/**
 * Minimal PDF content-stream tokenizer.
 *
 * Enough of the grammar to find operators and their operands with byte
 * offsets. It deliberately does not build a full object model: redaction only
 * needs to know which bytes paint which text.
 */
import {
  decodeArrayStrings,
  decodeHexString,
  decodeLiteralString,
  scanArray,
  scanLiteralString,
} from "./pdf-strings";

export interface Token {
  kind: "string" | "array" | "number" | "name" | "operator" | "other";
  start: number;
  end: number;
  /** Decoded text for strings/arrays, the spelling for operators and names. */
  text: string;
  raw: string;
}

const WHITESPACE = new Set([" ", "\n", "\r", "\t", "\f", "\0"]);
const DELIMITERS = new Set(["(", ")", "<", ">", "[", "]", "{", "}", "/", "%"]);
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)$/;

export function tokenize(stream: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < stream.length) {
    const char = stream[i];

    if (WHITESPACE.has(char)) {
      i++;
      continue;
    }

    if (char === "%") {
      while (i < stream.length && stream[i] !== "\n" && stream[i] !== "\r") i++;
      continue;
    }

    if (char === "(") {
      const end = scanLiteralString(stream, i);
      tokens.push(token("string", stream, i, end, decodeLiteralString(stream.slice(i + 1, end - 1))));
      i = end;
      continue;
    }

    if (char === "<" && stream[i + 1] !== "<") {
      const close = stream.indexOf(">", i);
      const end = close === -1 ? stream.length : close + 1;
      tokens.push(token("string", stream, i, end, decodeHexString(stream.slice(i + 1, end - 1))));
      i = end;
      continue;
    }

    if (char === "[") {
      const end = scanArray(stream, i);
      const inner = stream.slice(i + 1, Math.max(i + 1, end - 1));
      tokens.push(token("array", stream, i, end, decodeArrayStrings(inner)));
      i = end;
      continue;
    }

    if (char === "/") {
      let end = i + 1;
      while (end < stream.length && !WHITESPACE.has(stream[end]) && !DELIMITERS.has(stream[end])) end++;
      tokens.push(token("name", stream, i, end, stream.slice(i + 1, end)));
      i = end;
      continue;
    }

    if (DELIMITERS.has(char)) {
      // Dictionary markers and stray delimiters carry no meaning for our scan.
      const step = (char === "<" || char === ">") && stream[i + 1] === char ? 2 : 1;
      tokens.push(token("other", stream, i, i + step, ""));
      i += step;
      continue;
    }

    let end = i;
    while (end < stream.length && !WHITESPACE.has(stream[end]) && !DELIMITERS.has(stream[end])) end++;
    if (end === i) end = i + 1;
    const raw = stream.slice(i, end);
    tokens.push(token(NUMBER.test(raw) ? "number" : "operator", stream, i, end, raw));
    i = end;
  }

  return tokens;
}

function token(kind: Token["kind"], stream: string, start: number, end: number, text: string): Token {
  return { kind, start, end, text, raw: stream.slice(start, end) };
}
