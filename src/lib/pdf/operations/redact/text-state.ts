/**
 * The text state in effect at each text-showing operator.
 *
 * To work out how wide a character actually is, the font it is drawn with has
 * to be known, along with the spacing operators that add to every advance. The
 * PDF text state is larger than this, but these are the parts that change a
 * character's advance:
 *
 *   Tf  font resource name and size
 *   Tc  extra space added after every character
 *   Tw  extra space added after character code 32 only
 *   Tz  horizontal scaling, as a percentage
 */
import { tokenize } from "./content-tokenizer";
import type { ShowOperation, ShowOperator } from "./show-operators";

export interface TextState {
  fontName: string;
  fontSize: number;
  charSpacing: number;
  wordSpacing: number;
  horizontalScale: number;
}

export interface ShowOperationWithState extends ShowOperation {
  state: TextState;
}

const INITIAL: TextState = {
  fontName: "",
  fontSize: 0,
  charSpacing: 0,
  wordSpacing: 0,
  horizontalScale: 100,
};

/**
 * Text-showing operators together with the state each one was drawn under.
 * Replaces `findShowOperations` where widths matter.
 */
export function findShowOperationsWithState(stream: string): ShowOperationWithState[] {
  const tokens = tokenize(stream);
  const operations: ShowOperationWithState[] = [];
  let state: TextState = { ...INITIAL };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind !== "operator") continue;
    const operator = token.text;

    if (operator === "Tf") {
      const size = tokens[i - 1];
      const name = tokens[i - 2];
      if (size?.kind === "number" && name?.kind === "name") {
        state = { ...state, fontName: name.text, fontSize: Number(size.raw) };
      }
      continue;
    }

    if (operator === "Tc" || operator === "Tw" || operator === "Tz") {
      const value = tokens[i - 1];
      if (value?.kind !== "number") continue;
      const amount = Number(value.raw);
      if (operator === "Tc") state = { ...state, charSpacing: amount };
      else if (operator === "Tw") state = { ...state, wordSpacing: amount };
      else state = { ...state, horizontalScale: amount };
      continue;
    }

    // The " operator sets word and character spacing as its first operands.
    if (operator === '"') {
      const charSpacing = tokens[i - 2];
      const wordSpacing = tokens[i - 3];
      if (charSpacing?.kind === "number" && wordSpacing?.kind === "number") {
        state = {
          ...state,
          charSpacing: Number(charSpacing.raw),
          wordSpacing: Number(wordSpacing.raw),
        };
      }
    }

    if (operator !== "Tj" && operator !== "TJ" && operator !== "'" && operator !== '"') {
      continue;
    }

    const operand = tokens[i - 1];
    if (!operand) continue;
    if (operator === "TJ" ? operand.kind !== "array" : operand.kind !== "string") continue;

    const start =
      operator === '"' && tokens[i - 3]?.kind === "number" ? tokens[i - 3].start : operand.start;

    operations.push({
      operator: operator as ShowOperator,
      start,
      end: token.end,
      text: operand.text,
      quoteSpacing:
        operator === '"'
          ? [state.wordSpacing, state.charSpacing]
          : undefined,
      state: { ...state },
    });
  }

  return operations;
}

/**
 * Advance of one character in the same space PDF.js reports widths, given its
 * width in 1/1000 text-space units.
 */
export function advanceOf(width: number, code: number, state: TextState): number {
  const glyph = (width / 1000) * state.fontSize;
  const spacing = state.charSpacing + (code === 32 ? state.wordSpacing : 0);
  return (glyph + spacing) * (state.horizontalScale / 100);
}
