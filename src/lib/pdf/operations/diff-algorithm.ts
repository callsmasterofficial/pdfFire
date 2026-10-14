export type DiffType = "unchanged" | "added" | "removed";

export interface DiffToken {
  type: DiffType;
  value: string;
}

export interface DiffStats {
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
  similarityRatio: number;
}

export interface TextDiffResult {
  tokens: DiffToken[];
  stats: DiffStats;
}

export function tokenizeWords(text: string): string[] {
  if (!text) return [];
  const regex = /(\s+|[^\s\w]+|\w+)/g;
  const matches = text.match(regex);
  return matches || [];
}

export function computeWordDiff(textA: string, textB: string): TextDiffResult {
  const tokensA = tokenizeWords(textA);
  const tokensB = tokenizeWords(textB);

  const m = tokensA.length;
  const n = tokensB.length;

  if (m === 0 && n === 0) {
    return {
      tokens: [],
      stats: { addedCount: 0, removedCount: 0, unchangedCount: 0, similarityRatio: 1 },
    };
  }

  if (textA === textB) {
    const tokens: DiffToken[] = [{ type: "unchanged", value: textA }];
    return {
      tokens,
      stats: { addedCount: 0, removedCount: 0, unchangedCount: tokensA.length, similarityRatio: 1 },
    };
  }

  const maxTokens = 2500;
  const safeA = tokensA.slice(0, maxTokens);
  const safeB = tokensB.slice(0, maxTokens);
  const safeM = safeA.length;
  const safeN = safeB.length;

  const dp: number[][] = Array.from({ length: safeM + 1 }, () => new Array(safeN + 1).fill(0));

  for (let i = 0; i < safeM; i++) {
    for (let j = 0; j < safeN; j++) {
      if (safeA[i] === safeB[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const diffs: DiffToken[] = [];
  let i = safeM;
  let j = safeN;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && safeA[i - 1] === safeB[j - 1]) {
      diffs.unshift({ type: "unchanged", value: safeA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffs.unshift({ type: "added", value: safeB[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diffs.unshift({ type: "removed", value: safeA[i - 1] });
      i--;
    }
  }

  const consolidated: DiffToken[] = [];
  for (const token of diffs) {
    const last = consolidated[consolidated.length - 1];
    if (last && last.type === token.type) {
      last.value += token.value;
    } else {
      consolidated.push({ ...token });
    }
  }

  let addedWords = 0;
  let removedWords = 0;
  let unchangedWords = 0;

  for (const token of diffs) {
    const isWord = /\w+/.test(token.value);
    if (isWord) {
      if (token.type === "added") addedWords++;
      else if (token.type === "removed") removedWords++;
      else unchangedWords++;
    }
  }

  const totalWords = unchangedWords + Math.max(addedWords, removedWords);
  const similarityRatio = totalWords > 0 ? Number((unchangedWords / totalWords).toFixed(3)) : 1;

  return {
    tokens: consolidated,
    stats: {
      addedCount: addedWords,
      removedCount: removedWords,
      unchangedCount: unchangedWords,
      similarityRatio,
    },
  };
}
