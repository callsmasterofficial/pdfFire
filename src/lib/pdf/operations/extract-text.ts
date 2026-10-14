import { getPdfjs, getLocalCmapAndFontConfig } from "../pdfjs-init";

export interface PageTextResult {
  pageNumber: number;
  text: string;
  characterCount: number;
}

export interface ExtractTextResult {
  fullText: string;
  pages: PageTextResult[];
  totalPages: number;
  totalCharacters: number;
  fileName: string;
}

export async function extractTextFromPdf(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  fileName = "document.pdf"
): Promise<ExtractTextResult> {
  const bytes = fileOrBytes instanceof File ? await fileOrBytes.arrayBuffer() : fileOrBytes;
  const pdfjs = await getPdfjs();
  const fontConfig = getLocalCmapAndFontConfig();

  const loadingTask = pdfjs.getDocument({
    data: bytes,
    ...fontConfig,
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const totalPages = doc.numPages;
  const pages: PageTextResult[] = [];
  const fullTextParts: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageStrings: string[] = [];

    for (const item of content.items) {
      if ("str" in item && typeof item.str === "string") {
        pageStrings.push(item.str);
      }
    }

    const pageText = pageStrings.join(" ").trim();
    pages.push({
      pageNumber: pageNum,
      text: pageText,
      characterCount: pageText.length,
    });
    if (pageText) {
      fullTextParts.push(`--- Page ${pageNum} ---\n${pageText}`);
    }
  }

  const fullText = fullTextParts.join("\n\n");
  const totalCharacters = pages.reduce((acc, p) => acc + p.characterCount, 0);

  return {
    fullText,
    pages,
    totalPages,
    totalCharacters,
    fileName,
  };
}
