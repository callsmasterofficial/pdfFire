import { extractTextFromPdf } from "./extract-text";
import { computeWordDiff, TextDiffResult } from "./diff-algorithm";

export * from "./visual-diff";

export interface PageComparison {
  pageNumber: number;
  textA: string;
  textB: string;
  diff: TextDiffResult;
  hasDifference: boolean;
}

export interface DocumentComparisonResult {
  docA: { name: string; totalPages: number; totalCharacters: number };
  docB: { name: string; totalPages: number; totalCharacters: number };
  maxPages: number;
  pages: PageComparison[];
  totalAddedWords: number;
  totalRemovedWords: number;
  totalUnchangedWords: number;
  overallSimilarity: number;
  changedPagesCount: number;
}

export function comparePageTexts(
  pagesA: string[],
  pagesB: string[],
  nameA = "Document A.pdf",
  nameB = "Document B.pdf"
): DocumentComparisonResult {
  const maxPages = Math.max(pagesA.length, pagesB.length);
  const pages: PageComparison[] = [];

  let totalAdded = 0;
  let totalRemoved = 0;
  let totalUnchanged = 0;
  let changedPagesCount = 0;

  for (let p = 1; p <= maxPages; p++) {
    const textA = pagesA[p - 1] || "";
    const textB = pagesB[p - 1] || "";
    const diff = computeWordDiff(textA, textB);

    const hasDiff = diff.stats.addedCount > 0 || diff.stats.removedCount > 0;
    if (hasDiff) changedPagesCount++;

    totalAdded += diff.stats.addedCount;
    totalRemoved += diff.stats.removedCount;
    totalUnchanged += diff.stats.unchangedCount;

    pages.push({
      pageNumber: p,
      textA,
      textB,
      diff,
      hasDifference: hasDiff,
    });
  }

  const totalWords = totalUnchanged + Math.max(totalAdded, totalRemoved);
  const overallSimilarity = totalWords > 0 ? Number((totalUnchanged / totalWords).toFixed(3)) : 1;

  const charsA = pagesA.reduce((sum, str) => sum + str.length, 0);
  const charsB = pagesB.reduce((sum, str) => sum + str.length, 0);

  return {
    docA: { name: nameA, totalPages: pagesA.length, totalCharacters: charsA },
    docB: { name: nameB, totalPages: pagesB.length, totalCharacters: charsB },
    maxPages,
    pages,
    totalAddedWords: totalAdded,
    totalRemovedWords: totalRemoved,
    totalUnchangedWords: totalUnchanged,
    overallSimilarity,
    changedPagesCount,
  };
}

export async function comparePdfDocuments(
  fileA: File | Uint8Array,
  fileB: File | Uint8Array,
  nameA = "Document A.pdf",
  nameB = "Document B.pdf"
): Promise<DocumentComparisonResult> {
  const [resA, resB] = await Promise.all([
    extractTextFromPdf(fileA, nameA),
    extractTextFromPdf(fileB, nameB),
  ]);

  const textsA = resA.pages.map((p) => p.text);
  const textsB = resB.pages.map((p) => p.text);

  return comparePageTexts(textsA, textsB, resA.fileName, resB.fileName);
}
