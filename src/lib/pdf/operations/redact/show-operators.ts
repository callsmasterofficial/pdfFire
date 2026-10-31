/**
 * The shape of a text-showing operator.
 *
 * Redaction acts on the operators that paint glyphs, so it needs their byte
 * ranges and the text they show. Only four operators show text: Tj, TJ,
 * \' (next line + show) and " (spacing + next line + show).
 *
 * They are located by `findShowOperationsWithState` in text-state.ts, which
 * also reports the font and spacing each one was drawn under.
 */

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
