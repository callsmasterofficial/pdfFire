/**
 * Reads and replaces a page's content streams.
 *
 * The spec treats an array of content streams as one concatenated stream, so
 * we join them, rewrite once, and store the result as a single stream. Any
 * filter we cannot decode makes the page unredactable rather than silently
 * half-processed.
 */
import { PDFArray, PDFDocument, PDFName, PDFPage, PDFRawStream, PDFRef } from "pdf-lib";
import { decompressSync } from "fflate";

export class UnsupportedContentStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedContentStreamError";
  }
}

const LATIN1 = new TextDecoder("latin1");

function encodeLatin1(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

function contentRefs(page: PDFPage): PDFRef[] {
  const contents = page.node.get(PDFName.of("Contents"));
  if (contents instanceof PDFRef) return [contents];
  if (contents instanceof PDFArray) {
    const refs: PDFRef[] = [];
    for (let i = 0; i < contents.size(); i++) {
      const entry = contents.get(i);
      if (entry instanceof PDFRef) refs.push(entry);
    }
    return refs;
  }
  return [];
}

function filterNames(stream: PDFRawStream): string[] {
  const filter = stream.dict.get(PDFName.of("Filter"));
  if (!filter) return [];
  const text = String(filter);
  return text
    .split(/[\s[\]]+/)
    .filter(Boolean)
    .map((name) => name.replace(/^\//, ""));
}

function decodeStream(stream: PDFRawStream): string {
  const filters = filterNames(stream);
  if (filters.length === 0) return LATIN1.decode(stream.contents);

  if (filters.length === 1 && (filters[0] === "FlateDecode" || filters[0] === "Fl")) {
    try {
      return LATIN1.decode(decompressSync(stream.contents));
    } catch (error) {
      throw new UnsupportedContentStreamError(
        `Content stream could not be inflated: ${(error as Error).message}`
      );
    }
  }

  throw new UnsupportedContentStreamError(
    `Unsupported content stream filter chain: ${filters.join(", ") || "unknown"}`
  );
}

/** Decoded, concatenated content of a page. */
export function readPageContent(doc: PDFDocument, page: PDFPage): string {
  const parts: string[] = [];
  for (const ref of contentRefs(page)) {
    const stream = doc.context.lookup(ref);
    if (!(stream instanceof PDFRawStream)) {
      throw new UnsupportedContentStreamError("Page content is not a readable stream.");
    }
    parts.push(decodeStream(stream));
  }
  return parts.join("\n");
}

/** Replaces the page's content with `content`, stored as one flate stream. */
export function writePageContent(doc: PDFDocument, page: PDFPage, content: string): void {
  const stream = doc.context.flateStream(encodeLatin1(content));
  const ref = doc.context.register(stream);
  page.node.set(PDFName.of("Contents"), ref);
}
