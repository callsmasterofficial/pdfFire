import { getPdfjs, getLocalCmapAndFontConfig } from "../pdfjs-init";

export interface PiiFinding {
  id: string;
  pageNumber: number;
  type: "email" | "phone" | "ssn" | "credit_card" | "custom";
  text: string;
  bbox: { x: number; y: number; width: number; height: number };
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
  options: PiiScanOptions = {},
  bbox = { x: 50, y: 500, width: 120, height: 16 }
): PiiFinding[] {
  const {
    includeEmails = true,
    includePhones = true,
    includeSsn = true,
    includeCards = true,
    customKeywords = [],
  } = options;

  const findings: PiiFinding[] = [];
  let nextId = 1;

  const checkPattern = (type: PiiFinding["type"], regex: RegExp) => {
    regex.lastIndex = 0;
    const matches = text.match(regex);
    if (matches) {
      for (const m of matches) {
        findings.push({
          id: `pii-${pageNumber}-${nextId++}`,
          pageNumber,
          type,
          text: m,
          bbox,
        });
      }
    }
  };

  if (includeEmails) checkPattern("email", REGEXES.email);
  if (includePhones) checkPattern("phone", REGEXES.phone);
  if (includeSsn) checkPattern("ssn", REGEXES.ssn);
  if (includeCards) checkPattern("credit_card", REGEXES.credit_card);

  for (const kw of customKeywords) {
    if (!kw.trim()) continue;
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    checkPattern("custom", new RegExp(`\\b${esc}\\b`, "gi"));
  }

  return findings;
}

export async function scanPdfForPii(
  bytes: Uint8Array | ArrayBuffer,
  options: PiiScanOptions = {}
): Promise<PiiFinding[]> {
  if (typeof window === "undefined") {
    // Node.js test environment fallback: decode raw stream text
    const raw = typeof bytes === "string" ? bytes : new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return scanTextForPii(raw, 1, options);
  }

  const pdfjs = await getPdfjs();
  const fontConfig = getLocalCmapAndFontConfig();
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    ...fontConfig,
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const findings: PiiFinding[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!("str" in item) || typeof item.str !== "string" || !item.str.trim()) continue;
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const itemFindings = scanTextForPii(item.str, pageNum, options, {
        x: transform[4],
        y: transform[5],
        width: item.width || 60,
        height: Math.abs(transform[3]) || item.height || 12,
      });
      findings.push(...itemFindings);
    }
  }

  return findings;
}
