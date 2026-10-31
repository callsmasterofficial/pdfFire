/**
 * Independent-reader verification helpers.
 *
 * Security-sensitive operations (redaction, sanitization) must be validated by
 * reading the exported bytes back with a parser that is NOT the one that wrote
 * them. We use PDF.js for text extraction and a raw content-stream scan as a
 * second, encoding-independent signal.
 */
import { PDFDocument, PDFName, PDFRawStream, PDFArray, PDFRef } from "pdf-lib";
import { decompressSync } from "fflate";

// Runtime shims for pdfjs-dist live in vitest.setup.ts.

/** Text as an independent reader (PDF.js) sees it, page by page. */
export async function extractPdfTextPerPage(bytes: Uint8Array): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    useWorkerFetch: false,
    disableFontFace: true,
  });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item: unknown) => (item as { str?: string }).str ?? "")
        .join("")
    );
  }
  await task.destroy();
  return pages;
}

/** Whole-document text as an independent reader sees it. */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  return (await extractPdfTextPerPage(bytes)).join("\n");
}

/**
 * Every string operand shown by the page content streams, decoded.
 *
 * PDF writers may emit shown text as a literal `(abc)` or as hex `<616263>`,
 * so a plain substring search over the raw stream is not a reliable signal.
 * This decodes both forms, giving an encoding-independent view of what text
 * still exists in the file.
 */
export async function extractContentStreamStrings(bytes: Uint8Array): Promise<string> {
  const raw = await decodeContentStreams(bytes);
  const out: string[] = [];

  // Hex strings: <48656C6C6F>
  for (const match of raw.matchAll(/<([0-9A-Fa-f\s]+)>/g)) {
    const hex = match[1].replace(/\s+/g, "");
    if (hex.length < 2 || hex.length % 2 !== 0) continue;
    let decoded = "";
    for (let i = 0; i < hex.length; i += 2) {
      decoded += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    }
    out.push(decoded);
  }

  // Literal strings: (Hello) with escaped parens honoured.
  for (const match of raw.matchAll(/\((?:\\.|[^\\()])*\)/g)) {
    out.push(match[0].slice(1, -1).replace(/\\([\\()])/g, "$1"));
  }

  return out.join("\n");
}

/**
 * Raw decoded content streams. Catches text that survives in the byte stream
 * even when a reader fails to map it back to characters.
 */
export async function decodeContentStreams(bytes: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(bytes, { throwOnInvalidObject: false });
  const chunks: string[] = [];

  for (const page of doc.getPages()) {
    const contents = page.node.get(PDFName.of("Contents"));
    const refs: PDFRef[] = [];
    if (contents instanceof PDFRef) refs.push(contents);
    else if (contents instanceof PDFArray) {
      for (let i = 0; i < contents.size(); i++) {
        const entry = contents.get(i);
        if (entry instanceof PDFRef) refs.push(entry);
      }
    }

    for (const ref of refs) {
      const stream = doc.context.lookup(ref);
      if (!(stream instanceof PDFRawStream)) continue;
      chunks.push(decodeStreamBytes(stream));
    }
  }

  return chunks.join("\n");
}

function decodeStreamBytes(stream: PDFRawStream): string {
  const filter = stream.dict.get(PDFName.of("Filter"));
  const raw = stream.contents;
  const isFlate =
    filter === PDFName.of("FlateDecode") ||
    String(filter) === "/FlateDecode" ||
    (filter instanceof PDFArray && String(filter).includes("FlateDecode"));

  if (!isFlate) return new TextDecoder("latin1").decode(raw);
  try {
    return new TextDecoder("latin1").decode(decompressSync(raw));
  } catch {
    return new TextDecoder("latin1").decode(raw);
  }
}
