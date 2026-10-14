import { getPdfjs, getLocalCmapAndFontConfig } from "../pdfjs-init";

export interface PageImageOutput {
  pageNumber: number;
  name: string;
  blob: Blob;
  dataUrl: string;
  bytes: Uint8Array;
}

export interface PdfToImagesOptions {
  scale?: number; // default 2.0 for sharp render
  format?: "image/png" | "image/jpeg";
  baseFileName?: string;
  onProgress?: (current: number, total: number) => void;
}

export async function convertPdfToImages(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  options: PdfToImagesOptions = {}
): Promise<PageImageOutput[]> {
  const {
    scale = 2.0,
    format = "image/png",
    baseFileName = "page",
    onProgress,
  } = options;

  const pdfjs = await getPdfjs();
  const fontConfig = getLocalCmapAndFontConfig();

  let data: ArrayBuffer | Uint8Array;
  if (fileOrBytes instanceof File) {
    data = await fileOrBytes.arrayBuffer();
  } else {
    data = fileOrBytes;
  }

  const loadingTask = pdfjs.getDocument({
    data,
    ...fontConfig,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const ext = format === "image/jpeg" ? "jpg" : "png";
  const outputs: PageImageOutput[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Unable to obtain 2D canvas context for page rendering");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: ctx,
      canvas,
      viewport,
    });

    await renderTask.promise;

    const dataUrl = canvas.toDataURL(format, 0.95);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error(`Failed to convert page ${pageNum} to blob`));
      }, format, 0.95);
    });

    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    outputs.push({
      pageNumber: pageNum,
      name: `${baseFileName}-page-${pageNum}.${ext}`,
      blob,
      dataUrl,
      bytes,
    });

    // Clear canvas reference to reclaim memory
    canvas.width = 0;
    canvas.height = 0;

    if (onProgress) {
      onProgress(pageNum, numPages);
    }
  }

  await pdfDoc.cleanup();

  return outputs;
}
