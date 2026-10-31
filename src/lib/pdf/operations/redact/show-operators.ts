/**
 * Locates text-showing operators inside a decoded PDF content stream.
 *
 * Redaction acts on the operators that paint glyphs, so we need their byte
 * ranges and the text they show. Only four operators show text: Tj, TJ,
 * ' (next line + show) and " (spacing + next line + show).
 */
import { tokenize } from "./content-tokenizer";

export type ShowOperator = "Tj" | "TJ" | "'" | '"';

export interface ShowOperation {
  operator: ShowOperator;
  /** Offset of the first operand: where a replacement may begin. */
  start: number;
  /** Offset just past the operator. */
  end: number;
  /** Decoded text this operation paints. */
  text: string;
  /** Word and character spacing operands of `"`, which must be preserved. */
  quoteSpacing?: [number, number];
}

export function findShowOperations(stream: string): ShowOperation[] {
  const tokens = tokenize(stream);
  const operations: ShowOperation[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind !== "operator") continue;
    const operator = token.text as ShowOperator;

    if (operator === "Tj" || operator === "TJ" || operator === "'") {
      const operand = tokens[i - 1];
      if (!operand) continue;
      const wantsArray = operator === "TJ";
      if (wantsArray && operand.kind !== "array") continue;
      if (!wantsArray && operand.kind !== "string") continue;
      operations.push({ operator, start: operand.start, end: token.end, text: operand.text });
      continue;
    }

    if (operator === '"') {
      const operand = tokens[i - 1];
      const charSpacing = tokens[i - 2];
      const wordSpacing = tokens[i - 3];
      if (operand?.kind !== "string") continue;
      if (charSpacing?.kind !== "number" || wordSpacing?.kind !== "number") continue;
      operations.push({
        operator,
        start: wordSpacing.start,
        end: token.end,
        text: operand.text,
        quoteSpacing: [Number(wordSpacing.raw), Number(charSpacing.raw)],
      });
    }
  }

  return operations;
}
