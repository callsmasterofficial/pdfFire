/**
 * Text run geometry per page, as PDF.js reports it.
 *
 * Only the positions come from here. Widths come from the fonts themselves, so
 * the per-run width PDF.js provides is kept purely as a fallback for fonts
 * whose metrics cannot be read.
 */
import { getDocumentParams, getPdfjs } from "../../pdfjs-init";
import { toTextItemGeometry, type TextItemGeometry } from "../../text/text-item-geometry";

export async function readPageItems(
  bytes: Uint8Array,
  pageNumbers: number[]
): Promise<Map<number, TextItemGeometry[]>> {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument(getDocumentParams(bytes));
  const doc = await task.promise;
  const byPage = new Map<number, TextItemGeometry[]>();

  try {
    for (const pageNumber of pageNumbers) {
      if (pageNumber < 1 || pageNumber > doc.numPages) continue;
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const items: TextItemGeometry[] = [];

      for (const raw of content.items) {
        const item = toTextItemGeometry(raw as Parameters<typeof toTextItemGeometry>[0]);
        if (item) items.push(item);
      }

      byPage.set(pageNumber, items);
    }
  } finally {
    await task.destroy();
  }

  return byPage;
}
