import { PDFDocument } from "pdf-lib";

export interface ImagesToPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
}

async function convertImageToStandardBytes(file: File): Promise<{
  bytes: Uint8Array;
  isPng: boolean;
}> {
  if (file.type === "image/png") {
    const buffer = await file.arrayBuffer();
    return { bytes: new Uint8Array(buffer), isPng: true };
  }

  if (file.type === "image/jpeg" || file.type === "image/jpg") {
    const buffer = await file.arrayBuffer();
    return { bytes: new Uint8Array(buffer), isPng: false };
  }

  // WebP, SVG, or other formats: render to canvas and export as JPEG
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Unable to create canvas context for image conversion"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Failed to encode canvas image"));
        blob.arrayBuffer().then((buf) => {
          resolve({ bytes: new Uint8Array(buf), isPng: false });
        });
      }, "image/jpeg", 0.92);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image "${file.name}" for conversion.`));
    };
    img.src = url;
  });
}

export async function convertImagesToPdf(
  files: File[],
  outputFileName = "images-converted.pdf"
): Promise<ImagesToPdfResult> {
  if (!files || files.length === 0) {
    throw new Error("At least one image file is required to create a PDF.");
  }

  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const { bytes, isPng } = await convertImageToStandardBytes(file);
    const embeddedImage = isPng
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);

    const { width, height } = embeddedImage;
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDoc.save();

  return {
    pdfBytes,
    pageCount: pdfDoc.getPageCount(),
    fileName: outputFileName,
  };
}
