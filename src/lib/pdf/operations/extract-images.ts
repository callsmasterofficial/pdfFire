import { PDFDocument, PDFName, PDFDict, PDFRawStream } from "pdf-lib";
import { unzlibSync } from "fflate";
import {
  encodeRgbaToPng,
  convertRawPixelsToRgba,
  createPreviewUrl,
} from "./image-pixel-utils";
import { createZipArchive, ZipFileInput } from "../download";

export interface ExtractedImage {
  id: string;
  name: string;
  pageNumber: number;
  width: number;
  height: number;
  format: "png" | "jpeg";
  bytes: Uint8Array;
  dataUrl: string;
  sizeBytes: number;
}

export interface ExtractImagesOptions {
  format?: "png" | "jpeg";
  minWidth?: number;
  minHeight?: number;
  onProgress?: (page: number, total: number) => void;
}

export interface ExtractImagesResult {
  images: ExtractedImage[];
  totalImages: number;
  pageCount: number;
  zipBytes?: Uint8Array;
}

export async function extractImagesFromPdf(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  options: ExtractImagesOptions = {}
): Promise<ExtractImagesResult> {
  const { minWidth = 1, minHeight = 1, onProgress } = options;
  const rawBytes =
    fileOrBytes instanceof File
      ? new Uint8Array(await fileOrBytes.arrayBuffer())
      : fileOrBytes instanceof ArrayBuffer
      ? new Uint8Array(fileOrBytes)
      : fileOrBytes;

  const pdfDoc = await PDFDocument.load(rawBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const images: ExtractedImage[] = [];
  const processedRefs = new Set<string>();
  let imgCounter = 1;

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageNum = pageIdx + 1;
    const page = pages[pageIdx];
    const resources = page.node.Resources();
    const xObjRef = resources?.get(PDFName.of("XObject"));
    const xObjDict = pdfDoc.context.lookup(xObjRef);

    if (xObjDict instanceof PDFDict) {
      for (const [, ref] of xObjDict.entries()) {
        const refStr = ref?.toString() || "";
        if (refStr && processedRefs.has(refStr)) continue;

        const stream = pdfDoc.context.lookup(ref);
        if (!(stream instanceof PDFRawStream) || !stream.dict) continue;

        const subtype = stream.dict.get(PDFName.of("Subtype"))?.toString();
        if (subtype !== "/Image") continue;

        const width = Number(stream.dict.get(PDFName.of("Width"))?.toString()) || 0;
        const height = Number(stream.dict.get(PDFName.of("Height"))?.toString()) || 0;
        if (width < minWidth || height < minHeight) continue;

        if (refStr) processedRefs.add(refStr);

        const filter = stream.dict.get(PDFName.of("Filter"))?.toString() || "";
        let finalBytes: Uint8Array;
        let imgFormat: "png" | "jpeg" = "png";

        if (filter.includes("/DCTDecode")) {
          imgFormat = "jpeg";
          finalBytes = stream.getContents();
        } else {
          // Decompress FlateDecode raster stream
          try {
            const rawPixels = unzlibSync(stream.getContents());
            let smaskBytes: Uint8Array | undefined;

            const smaskRef = stream.dict.get(PDFName.of("SMask"));
            if (smaskRef) {
              const smaskStream = pdfDoc.context.lookup(smaskRef);
              if (smaskStream instanceof PDFRawStream) {
                smaskBytes = unzlibSync(smaskStream.getContents());
              }
            }

            const rgba = convertRawPixelsToRgba(rawPixels, width, height, smaskBytes);
            finalBytes = encodeRgbaToPng(rgba, width, height);
            imgFormat = "png";
          } catch {
            continue;
          }
        }

        const ext = imgFormat === "jpeg" ? "jpg" : "png";
        const mime = imgFormat === "jpeg" ? "image/jpeg" : "image/png";
        const name = `image-p${pageNum}-${imgCounter}.${ext}`;

        images.push({
          id: `img-${pageNum}-${imgCounter}-${Date.now()}`,
          name,
          pageNumber: pageNum,
          width,
          height,
          format: imgFormat,
          bytes: finalBytes,
          dataUrl: createPreviewUrl(finalBytes, mime),
          sizeBytes: finalBytes.length,
        });
        imgCounter++;
      }
    }

    if (onProgress) onProgress(pageNum, pages.length);
  }

  let zipBytes: Uint8Array | undefined;
  if (images.length > 0) {
    const zipFiles: ZipFileInput[] = images.map((img) => ({
      name: img.name,
      data: img.bytes,
    }));
    zipBytes = createZipArchive(zipFiles);
  }

  return { images, totalImages: images.length, pageCount: pages.length, zipBytes };
}
