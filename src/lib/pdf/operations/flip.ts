import { PDFDocument, PDFName } from "pdf-lib";

export interface FlipOptions {
  direction: "horizontal" | "vertical" | "both";
  pageScope?: "all" | "odd" | "even" | "custom";
  customPages?: number[];
}

export interface FlipResult {
  pdfBytes: Uint8Array;
  flippedPagesCount: number;
  totalPages: number;
}

function shouldFlipPage(idx: number, options: FlipOptions): boolean {
  const pNum = idx + 1;
  if (options.pageScope === "odd") return pNum % 2 !== 0;
  if (options.pageScope === "even") return pNum % 2 === 0;
  if (options.pageScope === "custom" && options.customPages) {
    return options.customPages.includes(pNum);
  }
  return true;
}

export async function flipPdf(
  pdfBytes: Uint8Array,
  options: FlipOptions
): Promise<FlipResult> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();
  if (totalPages === 0) throw new Error("Document has no pages.");

  // Guarantee empty pages have a Contents stream before embedding
  for (const p of srcDoc.getPages()) {
    if (!p.node.get(PDFName.of("Contents"))) {
      const emptyStream = srcDoc.context.flateStream(new Uint8Array(0));
      p.node.set(PDFName.of("Contents"), srcDoc.context.register(emptyStream));
    }
  }

  const outDoc = await PDFDocument.create();
  const pageIndices = srcDoc.getPageIndices();
  const embeddedPages = await outDoc.embedPdf(srcDoc, pageIndices);

  let flippedPagesCount = 0;

  for (let i = 0; i < totalPages; i++) {
    const emb = embeddedPages[i];
    const outPage = outDoc.addPage([emb.width, emb.height]);
    const mustFlip = shouldFlipPage(i, options);

    if (!mustFlip) {
      outPage.drawPage(emb, { x: 0, y: 0, width: emb.width, height: emb.height });
      continue;
    }

    flippedPagesCount++;
    if (options.direction === "horizontal") {
      outPage.drawPage(emb, {
        x: emb.width,
        y: 0,
        xScale: -1,
        yScale: 1,
      });
    } else if (options.direction === "vertical") {
      outPage.drawPage(emb, {
        x: 0,
        y: emb.height,
        xScale: 1,
        yScale: -1,
      });
    } else {
      // both
      outPage.drawPage(emb, {
        x: emb.width,
        y: emb.height,
        xScale: -1,
        yScale: -1,
      });
    }
  }

  const outBytes = await outDoc.save();
  return {
    pdfBytes: outBytes,
    flippedPagesCount,
    totalPages,
  };
}
