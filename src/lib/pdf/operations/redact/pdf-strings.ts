/**
 * Decoding of PDF string syntax as it appears inside content streams.
 *
 * Shown text is written either as a literal `(abc)` or as hex `<616263>`, and
 * TJ mixes both with kerning numbers. Redaction has to compare against the
 * decoded characters, so these helpers are shared by the tokenizer.
 */

/** Offset just past the closing paren of the literal string starting at `start`. */
export function scanLiteralString(stream: string, start: number): number {
  let depth = 0;
  let i = start;
  while (i < stream.length) {
    const char = stream[i];
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === "(") depth++;
    else if (char === ")") {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return stream.length;
}

/** Offset just past the closing bracket of the array starting at `start`. */
export function scanArray(stream: string, start: number): number {
  let i = start + 1;
  while (i < stream.length) {
    if (stream[i] === "(") {
      i = scanLiteralString(stream, i);
      continue;
    }
    if (stream[i] === "]") return i + 1;
    i++;
  }
  return stream.length;
}

export function decodeLiteralString(body: string): string {
  return body.replace(/\\(n|r|t|b|f|\(|\)|\\|[0-7]{1,3})/g, (_match, escape: string) => {
    switch (escape) {
      case "n": return "\n";
      case "r": return "\r";
      case "t": return "\t";
      case "b": return "\b";
      case "f": return "\f";
      case "(": return "(";
      case ")": return ")";
      case "\\": return "\\";
      default: return String.fromCharCode(parseInt(escape, 8));
    }
  });
}

export function decodeHexString(body: string): string {
  const hex = body.replace(/[^0-9A-Fa-f]/g, "");
  const padded = hex.length % 2 === 0 ? hex : `${hex}0`;
  let out = "";
  for (let i = 0; i < padded.length; i += 2) {
    out += String.fromCharCode(parseInt(padded.slice(i, i + 2), 16));
  }
  return out;
}

/** Concatenated text of every string element inside a TJ array body. */
export function decodeArrayStrings(inner: string): string {
  let out = "";
  let i = 0;
  while (i < inner.length) {
    if (inner[i] === "(") {
      const end = scanLiteralString(inner, i);
      out += decodeLiteralString(inner.slice(i + 1, end - 1));
      i = end;
      continue;
    }
    if (inner[i] === "<") {
      const close = inner.indexOf(">", i);
      const end = close === -1 ? inner.length : close + 1;
      out += decodeHexString(inner.slice(i + 1, end - 1));
      i = end;
      continue;
    }
    i++;
  }
  return out;
}

export interface ArrayElement {
  kind: "string" | "other";
  /** Decoded characters, for string elements. */
  text: string;
  /** Original source, for everything else (kerning numbers, whitespace). */
  raw: string;
}

/**
 * Splits a TJ array body into its elements, keeping non-string elements
 * verbatim. The kerning numbers between strings carry the run's spacing, so
 * rewriting an array has to preserve them.
 */
export function splitArrayElements(inner: string): ArrayElement[] {
  const elements: ArrayElement[] = [];
  let i = 0;
  let pending = "";

  const flush = () => {
    if (pending) {
      elements.push({ kind: "other", text: "", raw: pending });
      pending = "";
    }
  };

  while (i < inner.length) {
    if (inner[i] === "(") {
      const end = scanLiteralString(inner, i);
      flush();
      elements.push({
        kind: "string",
        text: decodeLiteralString(inner.slice(i + 1, end - 1)),
        raw: inner.slice(i, end),
      });
      i = end;
      continue;
    }
    if (inner[i] === "<") {
      const close = inner.indexOf(">", i);
      const end = close === -1 ? inner.length : close + 1;
      flush();
      elements.push({
        kind: "string",
        text: decodeHexString(inner.slice(i + 1, end - 1)),
        raw: inner.slice(i, end),
      });
      i = end;
      continue;
    }
    pending += inner[i];
    i++;
  }

  flush();
  return elements;
}

/**
 * Encodes text as a PDF hex string. Used when rewriting an operand, because
 * hex needs no escape analysis and round-trips byte for byte.
 */
export function toHexString(text: string): string {
  let hex = "";
  for (const char of text) {
    hex += (char.codePointAt(0)! & 0xff).toString(16).padStart(2, "0");
  }
  return `<${hex}>`;
}
