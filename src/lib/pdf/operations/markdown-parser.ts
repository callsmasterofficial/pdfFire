export type MarkdownBlockKind = "heading" | "paragraph" | "bullet" | "ordered" | "quote" | "code" | "rule";

export interface MarkdownBlock {
  kind: MarkdownBlockKind;
  text: string;
  level?: number;
}

const inlineText = (value: string) => value
  .replace(/!?(?:\[[^\]]*\]\([^)]*\))/g, (match) => {
    const label = match.match(/\[([^\]]*)\]/)?.[1] ?? "";
    return label;
  })
  .replace(/(`+)(.*?)\1/g, "$2")
  .replace(/(\*\*|__|\*|_)(.*?)\1/g, "$2")
  .replace(/~~(.*?)~~/g, "$1")
  .trim();

/** Parses the portable Markdown subset that PDFfire lays out as vector PDF text. */
export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r/g, "").split("\n");
  let paragraph: string[] = [];
  let inCode = false;
  let code: string[] = [];
  const flushParagraph = () => {
    const text = inlineText(paragraph.join(" "));
    if (text) blocks.push({ kind: "paragraph", text });
    paragraph = [];
  };

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inCode) {
        blocks.push({ kind: "code", text: code.join("\n") });
        code = [];
      } else flushParagraph();
      inCode = !inCode;
      continue;
    }
    if (inCode) { code.push(line); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)/);
    const bullet = line.match(/^\s*[-*+]\s+(.+)/);
    const ordered = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (heading) {
      flushParagraph();
      blocks.push({ kind: "heading", level: heading[1].length, text: inlineText(heading[2]) });
    } else if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      flushParagraph(); blocks.push({ kind: "rule", text: "" });
    } else if (bullet) {
      flushParagraph(); blocks.push({ kind: "bullet", text: inlineText(bullet[1]) });
    } else if (ordered) {
      flushParagraph(); blocks.push({ kind: "ordered", text: `${ordered[1]}. ${inlineText(ordered[2])}` });
    } else if (/^>\s?/.test(line)) {
      flushParagraph(); blocks.push({ kind: "quote", text: inlineText(line.replace(/^>\s?/, "")) });
    } else if (!line.trim()) flushParagraph();
    else paragraph.push(line.trim());
  }
  if (inCode) blocks.push({ kind: "code", text: code.join("\n") });
  flushParagraph();
  return blocks;
}
