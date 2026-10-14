import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export interface TextWatermarkOptions {
  type: "text";
  text: string;
  fontSize?: number;
  opacity?: number;
  rotationDegrees?: number;
  colorHex?: string;
  pages?: number[]; // 1-indexed. Omit for all pages.
  outputFileName?: string;
}

export interface ImageWatermarkOptions {
  type: "image";
  imageBytes: Uint8Array;
  isPng?: boolean;
  scale?: number;
  opacity?: number;
  pages?: number[];
  outputFileName?: string;
}

export type WatermarkOptions = TextWatermarkOptions | ImageWatermarkOptions;

export interface WatermarkResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  fileName: string;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0.5;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0.5;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0.5;
  return rgb(r, g, b);
}

export async function applyWatermarkToPdf(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  options: WatermarkOptions
): Promise<WatermarkResult> {
  let bytes: Uint8Array | ArrayBuffer;
  if (fileOrBytes instanceof File) {
    bytes = await fileOrBytes.arrayBuffer();
  } else {
    bytes = fileOrBytes;
  }

  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();
  const targetPages = options.pages && options.pages.length > 0 ? new Set(options.pages) : null;
  const fileName = options.outputFileName || "watermarked-document.pdf";

  if (options.type === "text") {
    const {
      text = "CONFIDENTIAL",
      fontSize = 48,
      opacity = 0.25,
      rotationDegrees = 45,
      colorHex = "#999999",
    } = options;
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const color = hexToRgb(colorHex);

    for (let i = 0; i < totalPages; i++) {
      if (targetPages && !targetPages.has(i + 1)) continue;
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      // Centered position
      const x = (width - textWidth) / 2;
      const y = (height - textHeight) / 2;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(rotationDegrees),
      });
    }
  } else {
    const { imageBytes, isPng = true, scale = 0.5, opacity = 0.3 } = options;
    const embeddedImg = isPng
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

    for (let i = 0; i < totalPages; i++) {
      if (targetPages && !targetPages.has(i + 1)) continue;
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      const imgWidth = embeddedImg.width * scale;
      const imgHeight = embeddedImg.height * scale;

      page.drawImage(embeddedImg, {
        x: (width - imgWidth) / 2,
        y: (height - imgHeight) / 2,
        width: imgWidth,
        height: imgHeight,
        opacity,
      });
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return { pdfBytes, pageCount: totalPages, fileName };
}
