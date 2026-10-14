import { QaAnswerResult, QaCitation } from "./types";
import { PageTextResult } from "../pdf/operations";

export function askDocumentQuestion(
  question: string,
  pages: PageTextResult[]
): QaAnswerResult {
  const qTerms = question
    .toLowerCase()
    .replace(/[?.,!]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (qTerms.length === 0 || pages.length === 0) {
    return {
      question,
      answer: "Please enter a specific question about the document content.",
      citations: [],
      confidence: 0,
    };
  }

  interface CandidatePassage {
    pageNumber: number;
    text: string;
    score: number;
  }

  const candidates: CandidatePassage[] = [];

  for (const page of pages) {
    const paragraphs = page.text
      .split(/(?:\r?\n){2,}|\.\s+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 25);

    for (const para of paragraphs) {
      const pLower = para.toLowerCase();
      let matchCount = 0;
      let exactPhraseBonus = 0;

      for (const term of qTerms) {
        if (pLower.includes(term)) {
          matchCount++;
        }
      }

      // Check for two-word sequential matches
      for (let i = 0; i < qTerms.length - 1; i++) {
        if (pLower.includes(`${qTerms[i]} ${qTerms[i + 1]}`)) {
          exactPhraseBonus += 3;
        }
      }

      if (matchCount > 0) {
        const score = (matchCount / qTerms.length) * 10 + exactPhraseBonus;
        candidates.push({
          pageNumber: page.pageNumber,
          text: para,
          score,
        });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return {
      question,
      answer: "No directly relevant mentions found in this document for the provided inquiry.",
      citations: [],
      confidence: 10,
    };
  }

  const best = candidates[0];
  const topCitations: QaCitation[] = candidates.slice(0, 3).map((c) => ({
    pageNumber: c.pageNumber,
    snippet: c.text.length > 200 ? c.text.slice(0, 197) + "..." : c.text,
    relevanceScore: Math.round(c.score * 10),
  }));

  const confidence = Math.min(98, Math.round(50 + best.score * 7));

  return {
    question,
    answer: best.text,
    citations: topCitations,
    confidence,
  };
}
