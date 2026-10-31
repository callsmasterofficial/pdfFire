import { getDocumentParams, getPdfjs } from "../pdfjs-init";
import { buildPageTextMap, toItemCharRanges } from "./redact/page-text-map";
import { charRangeToRect, type Rect } from "../text/text-item-geometry";

export type PiiType = "email" | "phone" | "ssn" | "credit_card" | "custom";

/** A pattern match in a page's text, before any geometry is known. */
export interface PiiMatch {
  id: string;
  pageNumber: number;
  type: PiiType;
  text: string;
  /** Character range within the page's extracted text. */
  start: number;
  end: number;
}

export interface PiiFinding extends PiiMatch {
  /**
   * Rectangles covering the match, in PDF user space. One per text run the
   * match crosses, since a run has its own position and size.
   */
  boxes: Rect[];
}

export interface PiiScanOptions {
  includeEmails?: boolean;
  includePhones?: boolean;
  includeSsn?: boolean;
  includeCards?: boolean;
  customKeywords?: string[];
}

const REGEXES = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  credit_card: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
};

export function scanTextForPii(
  text: string,
  pageNumber = 1,
  options: PiiScanOptions = {}
): PiiMatch[] {
  const {
    includeEmails = true,
    includePhones = true,
    includeSsn = true,
    includeCards = true,
    customKeywords = [],
  } = options;

  const matches: PiiMatch[] = [];
  let nextId = 1;

  const collect = (type: PiiType, regex: RegExp) => {
    regex.lastIndex = 0;
    for (const match of text.matchAll(regex)) {
      if (match.index === undefined || !match[0]) continue;
      matches.push({
        id: `pii-${pageNumber}-${nextId++}`,
        pageNumber,
        type,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  };

  if (includeEmails) collect("email", REGEXES.email);
  if (includePhones) collect("phone", REGEXES.phone);
  if (includeSsn) collect("ssn", REGEXES.ssn);
  if (includeCards) collect("credit_card", REGEXES.credit_card);

  for (const keyword of customKeywords) {
    if (!keyword.trim()) continue;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    collect("custom", new RegExp(`\\b${escaped}\\b`, "gi"));
  }

  return matches;
}

export async function scanPdfForPii(
  bytes: Uint8Array | ArrayBuffer,
  options: PiiScanOptions = {}
): Promise<PiiFinding[]> {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument(getDocumentParams(bytes));
  const doc = await task.promise;
  const findings: PiiFinding[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const map = buildPageTextMap(content.items as Parameters<typeof buildPageTextMap>[0]);
      if (!map.text.trim()) continue;

      for (const match of scanTextForPii(map.text, pageNumber, options)) {
        const boxes = toItemCharRanges(map, match.start, match.end)
          .map(({ itemIndex, start, end }) =>
            charRangeToRect(map.items[itemIndex], start, end)
          );
        if (boxes.length === 0) continue;
        findings.push({ ...match, boxes });
      }
    }
  } finally {
    await task.destroy();
  }

  return findings;
}
