import { getPdfjs, getLocalCmapAndFontConfig } from "../pdfjs-init";
import { PDFDocument, EncryptedPDFError } from "pdf-lib";

export interface UnlockPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
}

export interface SecurityInspectionResult {
  isEncrypted: boolean;
  canOpenWithoutPassword: boolean;
  pageCount?: number;
  error?: string;
}

export async function checkPdfEncryption(
  fileOrBytes: File | Uint8Array | ArrayBuffer
): Promise<SecurityInspectionResult> {
  const bytes = fileOrBytes instanceof File ? await fileOrBytes.arrayBuffer() : fileOrBytes;

  try {
    const doc = await PDFDocument.load(bytes);
    return {
      isEncrypted: false,
      canOpenWithoutPassword: true,
      pageCount: doc.getPageCount(),
    };
  } catch (err: unknown) {
    if (err instanceof EncryptedPDFError || (err as Error)?.message?.toLowerCase().includes("encrypt")) {
      return {
        isEncrypted: true,
        canOpenWithoutPassword: false,
      };
    }
    return {
      isEncrypted: false,
      canOpenWithoutPassword: false,
      error: (err as Error).message,
    };
  }
}

export async function unlockPdfWithPassword(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  password: string,
  outputFileName = "unlocked-document.pdf"
): Promise<UnlockPdfResult> {
  const bytes = fileOrBytes instanceof File ? await fileOrBytes.arrayBuffer() : fileOrBytes;
  const pdfjs = await getPdfjs();
  const fontConfig = getLocalCmapAndFontConfig();

  const loadingTask = pdfjs.getDocument({
    data: bytes,
    password,
    ...fontConfig,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const outputDoc = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Unable to create canvas context for unlocking");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: ctx,
      canvas,
      viewport,
    });
    await renderTask.promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const imgBytes = await (await fetch(dataUrl)).arrayBuffer();
    const embeddedImg = await outputDoc.embedJpg(imgBytes);

    const newPage = outputDoc.addPage([embeddedImg.width / 2, embeddedImg.height / 2]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: embeddedImg.width / 2,
      height: embeddedImg.height / 2,
    });
  }

  const pdfBytes = await outputDoc.save({ useObjectStreams: true });
  return {
    pdfBytes,
    pageCount: numPages,
    fileName: outputFileName,
  };
}
