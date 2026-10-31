/**
 * Deletes targeted characters from the text-showing operators of a page.
 *
 * Two things this must get right.
 *
 * Neutralising a whole operator removes more than the redaction covers: a box
 * over one email in "Contact: john@x.com for details" would delete the entire
 * line, so text the user never covered would vanish. Only the covered
 * characters are replaced, one space each, so the glyph count is unchanged and
 * the original bytes are gone from the file.
 *
 * A target may also span operators. PDF.js reports a merged run where the page
 * paints "john@" and "example.com" as two operators, so the covered text
 * matches neither on its own. Blanking therefore happens over the operators'
 * concatenated text and is written back per operator.
 *
 * Operands are rewritten as hex strings: hex needs no escape analysis and
 * round-trips byte for byte.
 */
import { splitArrayElements, toHexString } from "./pdf-strings";
import type { ShowOperation } from "./show-operators";

/**
 * Blanks every occurrence of every target across `texts` joined end to end,
 * returning each operator's new text.
 */
export function blankAcrossOperations(texts: string[], targets: string[]): string[] {
  const combined = texts.join("");
  if (!combined) return texts;

  const owner: number[] = [];
  const offset: number[] = [];
  texts.forEach((text, index) => {
    for (let i = 0; i < text.length; i++) {
      owner.push(index);
      offset.push(i);
    }
  });

  const blanked = new Uint8Array(combined.length);
  for (const target of targets) {
    if (!target) continue;
    let index = combined.indexOf(target);
    while (index !== -1) {
      for (let i = index; i < index + target.length; i++) blanked[i] = 1;
      // Step by one so overlapping occurrences are also covered.
      index = combined.indexOf(target, index + 1);
    }
  }

  const characters = texts.map((text) => [...text]);
  for (let i = 0; i < blanked.length; i++) {
    if (blanked[i]) characters[owner[i]][offset[i]] = " ";
  }

  return characters.map((chars) => chars.join(""));
}

/**
 * Replacement source for `operation` given its new text, or null when nothing
 * changed and the operator should be left untouched.
 */
export function rewriteShowOperation(
  source: string,
  operation: ShowOperation,
  blankedText: string
): string | null {
  if (blankedText === operation.text) return null;

  if (operation.operator === "TJ") return rewriteArray(source, operation, blankedText);

  if (operation.operator === '"' && operation.quoteSpacing) {
    const [wordSpacing, charSpacing] = operation.quoteSpacing;
    return `${wordSpacing} ${charSpacing} ${toHexString(blankedText)} "`;
  }

  return `${toHexString(blankedText)} ${operation.operator}`;
}

function rewriteArray(
  source: string,
  operation: ShowOperation,
  blankedText: string
): string | null {
  const raw = source.slice(operation.start, operation.end);
  const open = raw.indexOf("[");
  const close = raw.lastIndexOf("]");
  if (open === -1 || close === -1) return null;

  const elements = splitArrayElements(raw.slice(open + 1, close));

  // Each string element takes its own share of the blanked text, so the
  // kerning numbers between them survive untouched.
  let cursor = 0;
  const rebuilt = elements
    .map((element) => {
      if (element.kind !== "string") return element.raw;
      const slice = blankedText.slice(cursor, cursor + element.text.length);
      cursor += element.text.length;
      return toHexString(slice);
    })
    .join(" ");

  return `[${rebuilt}] TJ`;
}
