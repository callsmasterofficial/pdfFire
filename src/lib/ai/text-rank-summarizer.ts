import { DocumentSummaryResult, DocumentEntity } from "./types";

const STOP_WORDS = new Set([
  "the", "and", "is", "in", "to", "of", "for", "with", "a", "an", "on", "at",
  "by", "this", "that", "from", "be", "are", "as", "was", "or", "it", "not",
  "have", "has", "but", "all", "they", "we", "you", "which", "will", "can",
]);

export function extractEntities(text: string): DocumentEntity[] {
  const entities: DocumentEntity[] = [];

  // Amounts
  const amountRegex = /(?:\$|€|£|USD|EUR)\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/gi;
  let match: RegExpExecArray | null;
  while ((match = amountRegex.exec(text)) !== null) {
    entities.push({
      type: "amount",
      value: match[0].trim(),
      context: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + 40)).trim(),
    });
    if (entities.length > 20) break;
  }

  // Dates
  const dateRegex = /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;
  while ((match = dateRegex.exec(text)) !== null) {
    entities.push({
      type: "date",
      value: match[0].trim(),
      context: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + 40)).trim(),
    });
    if (entities.length > 30) break;
  }

  // Emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    entities.push({
      type: "email",
      value: match[0].trim(),
      context: match[0],
    });
    if (entities.length > 35) break;
  }

  return entities;
}

export function summarizeDocumentText(
  fullText: string,
  title = "Document Summary",
  pageCount = 1
): DocumentSummaryResult {
  const cleanText = fullText.replace(/\r?\n/g, " ").trim();
  const rawSentences = cleanText
    .split(/(?<=[.?!])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 350);

  const words = cleanText.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Word frequency map
  const wordFreq: Record<string, number> = {};
  for (const w of words) {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  }

  // Score sentences
  const scored = rawSentences.map((sentence, idx) => {
    const sWords = sentence.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    let score = 0;
    for (const w of sWords) {
      score += wordFreq[w] || 0;
    }
    // Positional weight: boost initial sentences in document
    const posBoost = idx < 3 ? 1.5 : 1.0;
    return {
      sentence,
      score: (score / Math.max(1, sWords.length)) * posBoost,
      index: idx,
    };
  });

  // Pick top sentences for executive summary
  scored.sort((a, b) => b.score - a.score);
  const topSentences = scored.slice(0, Math.min(4, scored.length));
  topSentences.sort((a, b) => a.index - b.index);

  const executiveSummary = topSentences.map((s) => s.sentence).join(" ");

  // Pick distinct takeaway bullet points
  const takeaways = scored
    .slice(0, Math.min(5, scored.length))
    .map((s) => s.sentence.replace(/^[•\-\d.]\s*/, "").trim());

  const entities = extractEntities(fullText);

  return {
    title,
    executiveSummary: executiveSummary || cleanText.slice(0, 300) + "...",
    keyTakeaways: takeaways.length > 0 ? takeaways : [cleanText.slice(0, 150)],
    entities,
    wordCount,
    readingTimeMinutes,
    pageCount,
    engine: "on-device-nlp",
  };
}
