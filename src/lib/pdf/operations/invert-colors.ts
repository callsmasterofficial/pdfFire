import { PDFDocument } from "pdf-lib";
import { getLocalCmapAndFontConfig, getPdfjs } from "../pdfjs-init";

export type ColourTransform = "invert" | "sepia" | "high-contrast";
export interface InvertColorsResult { pdfBytes: Uint8Array; pageCount: number; fileName: string; }

export function transformRgbaPixels(data: Uint8ClampedArray, mode: ColourTransform): void {
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (mode === "invert") [data[i], data[i + 1], data[i + 2]] = [255 - r, 255 - g, 255 - b];
    else if (mode === "sepia") {
      data[i] = Math.min(255, r * .393 + g * .769 + b * .189);
      data[i + 1] = Math.min(255, r * .349 + g * .686 + b * .168);
      data[i + 2] = Math.min(255, r * .272 + g * .534 + b * .131);
    } else {
      const light = (r * .2126 + g * .7152 + b * .0722) >= 150 ? 255 : 0;
      data[i] = light; data[i + 1] = light; data[i + 2] = light;
    }
  }
}

export async function transformPdfColours(file: File, mode: ColourTransform): Promise<InvertColorsResult> {
  const pdfjs = await getPdfjs();
  const source = await file.arrayBuffer();
  const input = await pdfjs.getDocument({ data: source, ...getLocalCmapAndFontConfig(), useSystemFonts: true }).promise;
  const output = await PDFDocument.create(); const scale = 1.5;
  for (let number = 1; number <= input.numPages; number++) {
    const sourcePage = await input.getPage(number); const viewport = sourcePage.getViewport({ scale });
    const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Your browser cannot create the colour transform canvas.");
    await sourcePage.render({ canvasContext: context, canvas, viewport }).promise;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height); transformRgbaPixels(pixels.data, mode); context.putImageData(pixels, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not encode transformed page.")), "image/png"));
    const image = await output.embedPng(new Uint8Array(await blob.arrayBuffer())); const page = output.addPage([viewport.width / scale, viewport.height / scale]);
    page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() }); canvas.width = 0; canvas.height = 0;
  }
  await input.cleanup();
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return { pdfBytes: await output.save(), pageCount: output.getPageCount(), fileName: `${base}-${mode}.pdf` };
}
