import { createWorker } from "tesseract.js";
import { getPdfjs, getLocalCmapAndFontConfig } from "../pdf/pdfjs-init";
import {
  SupportedOcrLanguage,
  OcrProgress,
  OcrPageResult,
  OcrDocumentResult,
} from "./ocr-types";

export type OcrProgressCallback = (progress: OcrProgress) => void;

export async function performOcrOnPdf(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  language: SupportedOcrLanguage = "eng",
  onProgress?: OcrProgressCallback
): Promise<OcrDocumentResult> {
  const startTime = Date.now();
  const bytes = fileOrBytes instanceof File ? await fileOrBytes.arrayBuffer() : fileOrBytes;
  const pdfjs = await getPdfjs();
  const fontConfig = getLocalCmapAndFontConfig();

  onProgress?.({ status: "Loading document", progress: 0.05 });

  const loadingTask = pdfjs.getDocument({
    data: bytes,
    ...fontConfig,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  onProgress?.({ status: `Initializing ${language} OCR engine`, progress: 0.1 });

  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        onProgress?.({
          status: `Processing text (${Math.round(m.progress * 100)}%)`,
          progress: 0.15 + m.progress * 0.7,
        });
      }
    },
  });

  const pages: OcrPageResult[] = [];
  const fullTextParts: string[] = [];

  try {
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.({
        status: `Rendering page ${pageNum} of ${numPages}`,
        progress: 0.15 + ((pageNum - 1) / numPages) * 0.75,
        currentPage: pageNum,
        totalPages: numPages,
      });

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Could not create canvas context for OCR rendering");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, canvas, viewport }).promise;

      const { data } = await worker.recognize(canvas);
      const recognizedText = data.text.trim();

      pages.push({
        pageNumber: pageNum,
        text: recognizedText,
        confidence: Math.round(data.confidence),
      });

      if (recognizedText) {
        fullTextParts.push(`--- Page ${pageNum} ---\n${recognizedText}`);
      }
    }
  } finally {
    await worker.terminate();
  }

  const processingTimeMs = Date.now() - startTime;
  const avgConfidence = pages.length > 0
    ? Math.round(pages.reduce((acc, p) => acc + p.confidence, 0) / pages.length)
    : 0;

  onProgress?.({ status: "Complete", progress: 1.0 });

  return {
    fullText: fullTextParts.join("\n\n"),
    pages,
    averageConfidence: avgConfidence,
    language,
    processingTimeMs,
  };
}
