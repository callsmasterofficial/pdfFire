/**
 * Maps per-character coverage from PDF.js runs onto content-stream operators.
 *
 * Geometry comes from PDF.js, but deletion happens in the content stream, and
 * the two do not report text identically: PDF.js merges and splits runs and may
 * introduce spacing of its own. Matching by *content* instead — blanking every
 * occurrence of the covered string — removed identical text the user never
 * covered, which is what this replaces.
 *
 * The two character sequences are walked together, skipping whitespace either
 * side introduces. If they diverge on real characters, alignment fails and the
 * caller falls back to content matching rather than guessing: a wrong alignment
 * would delete the wrong characters, which is worse than deleting too many.
 */

const isSkippable = (char: string) => /\s/.test(char);

export interface CharMetric {
  /** Delete this character. */
  covered: boolean;
  /** Advance width it occupies, in the same space PDF.js reports. */
  advance: number;
  /** Font size it was drawn at, used to convert the advance to text units. */
  fontSize: number;
}

export interface PageCoverage {
  text: string;
  covered: boolean[];
  advances: number[];
  fontSizes: number[];
}

/**
 * Per-operator, per-character metrics saying which characters to delete and how
 * much width each one occupied, or null when the sequences could not be
 * aligned.
 */
export function alignCoverage(
  operatorTexts: string[],
  coverage: PageCoverage
): CharMetric[][] | null {
  const { text: pageText, covered, advances, fontSizes } = coverage;
  const metrics = operatorTexts.map((text) =>
    Array.from({ length: text.length }, (): CharMetric => ({
      covered: false,
      advance: 0,
      fontSize: 0,
    }))
  );

  // Flatten the operator characters, remembering where each one came from.
  const owner: number[] = [];
  const offset: number[] = [];
  let operatorChars = "";
  operatorTexts.forEach((text, index) => {
    for (let i = 0; i < text.length; i++) {
      operatorChars += text[i];
      owner.push(index);
      offset.push(i);
    }
  });

  let i = 0;
  let j = 0;
  let transferred = 0;
  const totalCovered = covered.reduce((sum, flag) => sum + (flag ? 1 : 0), 0);

  while (i < operatorChars.length && j < pageText.length) {
    if (operatorChars[i] === pageText[j]) {
      if (covered[j]) {
        metrics[owner[i]][offset[i]] = {
          covered: true,
          advance: advances[j] ?? 0,
          fontSize: fontSizes[j] ?? 0,
        };
        transferred++;
      }
      i++;
      j++;
      continue;
    }

    // PDF.js inserted spacing that the operator does not paint, or vice versa.
    if (isSkippable(pageText[j]) && !covered[j]) {
      j++;
      continue;
    }
    if (isSkippable(operatorChars[i])) {
      i++;
      continue;
    }

    return null;
  }

  // Every covered character must have found an operator character to delete.
  // Anything less would leave part of a redaction behind.
  return transferred === totalCovered ? metrics : null;
}
