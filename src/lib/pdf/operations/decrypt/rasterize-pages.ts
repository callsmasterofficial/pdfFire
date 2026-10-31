/**
 * Last-resort unlock: render every page and rebuild the document from images.
 *
 * This loses the text layer entirely, so it is only used when the document's
 * encryption cannot be removed in place (see decrypt-document.ts). The caller
 * reports which path was taken.
 */
import { getPdfjs, getLocalCmapAndFontConfig } from "../../pdfjs-init";
import { PDFDocument } from "pdf-lib";

export async function rasterizeProtectedPdf(
  bytes: Uint8Array | ArrayBuffer,
  password: string
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
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

    const renderTask = page.render({ canvasContext: ctx, canvas, viewport });
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

  return { pdfBytes: await outputDoc.save({ useObjectStreams: true }), pageCount: numPages };
}
