/**
 * Pairs the characters the content stream paints with the characters PDF.js
 * reports, so geometry and deletion can talk about the same thing.
 *
 * The two views do not agree exactly: PDF.js merges and splits runs and adds
 * spacing of its own. Whitespace is therefore skipped on either side, but if
 * they diverge on real characters the pairing **fails** rather than guessing.
 * Everything downstream — which characters a box covers, and which bytes get
 * deleted — depends on this mapping, so a wrong pairing would delete the wrong
 * characters. Failing lets the caller fall back to matching by content, which
 * is less precise but cannot leave part of a redaction behind.
 */

const isSkippable = (char: string) => /\s/.test(char);

export interface Alignment {
  /** Flattened operator character -> index in the page text, or -1. */
  pageIndexOf: number[];
  /** Flattened operator character -> which operator it belongs to. */
  operatorOf: number[];
  /** Flattened operator character -> its offset within that operator. */
  offsetOf: number[];
  /** Page-text index -> flattened operator character, or -1. */
  operatorCharOf: number[];
}

export function alignSequences(
  operatorTexts: string[],
  pageText: string
): Alignment | null {
  const operatorOf: number[] = [];
  const offsetOf: number[] = [];
  let operatorChars = "";

  operatorTexts.forEach((text, index) => {
    for (let i = 0; i < text.length; i++) {
      operatorChars += text[i];
      operatorOf.push(index);
      offsetOf.push(i);
    }
  });

  const pageIndexOf = new Array<number>(operatorChars.length).fill(-1);
  const operatorCharOf = new Array<number>(pageText.length).fill(-1);

  let i = 0;
  let j = 0;

  while (i < operatorChars.length && j < pageText.length) {
    if (operatorChars[i] === pageText[j]) {
      pageIndexOf[i] = j;
      operatorCharOf[j] = i;
      i++;
      j++;
      continue;
    }
    if (isSkippable(pageText[j])) {
      j++;
      continue;
    }
    if (isSkippable(operatorChars[i])) {
      i++;
      continue;
    }
    return null;
  }

  // Every painted character PDF.js reported must have found its operator. An
  // unmatched one would be invisible to coverage and could be left behind.
  for (let k = j; k < pageText.length; k++) {
    if (!isSkippable(pageText[k])) return null;
  }

  return { pageIndexOf, operatorOf, offsetOf, operatorCharOf };
}
