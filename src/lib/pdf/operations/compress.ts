import { PDFDocument } from "pdf-lib";
import { convertPdfToImages } from "./pdf-to-images";

export type CompressionPreset = "low" | "medium" | "strong";

export interface CompressPdfOptions {
  preset?: CompressionPreset;
  stripMetadata?: boolean;
  outputFileName?: string;
  onProgress?: (current: number, total: number) => void;
}

export interface CompressPdfResult {
  pdfBytes: Uint8Array;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savedBytes: number;
  percentageSaved: number;
  isSmaller: boolean;
  fileName: string;
}

async function compressStrong(
  bytes: Uint8Array | ArrayBuffer,
  outputFileName: string,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const images = await convertPdfToImages(bytes, {
    scale: 1.25,
    format: "image/jpeg",
    onProgress,
  });

  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const embeddedImg = await pdfDoc.embedJpg(img.bytes);
    const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: embeddedImg.width,
      height: embeddedImg.height,
    });
  }

  return pdfDoc.save({ useObjectStreams: true });
}

export async function compressPdfDocument(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  options: CompressPdfOptions = {}
): Promise<CompressPdfResult> {
  const {
    preset = "medium",
    stripMetadata = true,
    outputFileName = "compressed-document.pdf",
    onProgress,
  } = options;

  let rawBytes: Uint8Array;
  let originalSizeBytes: number;

  if (fileOrBytes instanceof File) {
    originalSizeBytes = fileOrBytes.size;
    const buf = await fileOrBytes.arrayBuffer();
    rawBytes = new Uint8Array(buf);
  } else if (fileOrBytes instanceof ArrayBuffer) {
    originalSizeBytes = fileOrBytes.byteLength;
    rawBytes = new Uint8Array(fileOrBytes);
  } else {
    originalSizeBytes = fileOrBytes.length;
    rawBytes = fileOrBytes;
  }

  let compressedBytes: Uint8Array;

  if (preset === "strong") {
    try {
      compressedBytes = await compressStrong(rawBytes, outputFileName, onProgress);
    } catch {
      // Fallback to structural optimization if rasterization fails (e.g. node test env)
      const pdfDoc = await PDFDocument.load(rawBytes, { ignoreEncryption: true });
      if (stripMetadata) {
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("");
        pdfDoc.setCreator("");
      }
      compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    }
  } else {
    const pdfDoc = await PDFDocument.load(rawBytes, { ignoreEncryption: true });
    if (preset === "medium" || stripMetadata) {
      pdfDoc.setTitle("");
      pdfDoc.setAuthor("");
      pdfDoc.setSubject("");
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer("");
      pdfDoc.setCreator("");
    }
    compressedBytes = await pdfDoc.save({ useObjectStreams: true });
  }

  const compressedSizeBytes = compressedBytes.length;
  const isSmaller = compressedSizeBytes < originalSizeBytes;
  const savedBytes = isSmaller ? originalSizeBytes - compressedSizeBytes : 0;
  const percentageSaved = isSmaller
    ? Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
    : 0;

  return {
    pdfBytes: compressedBytes,
    originalSizeBytes,
    compressedSizeBytes,
    savedBytes,
    percentageSaved,
    isSmaller,
    fileName: outputFileName,
  };
}
