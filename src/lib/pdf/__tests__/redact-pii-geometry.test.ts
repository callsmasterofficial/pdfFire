/**
 * Gates for automated PII redaction (FM-007).
 *
 * Two properties matter here beyond "the secret is gone":
 *   - a match split across text runs must still be found;
 *   - deleting the covered text must not delete anything else, or a box over
 *     one email would silently remove the sentence around it.
 */
import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyRedactions, type RedactionArea } from "../operations/redact";
import { scanPdfForPii, scanTextForPii } from "../operations/redact-pii";
import { extractPdfText } from "./helpers/pdf-text";

const LINE = "Contact: john@example.com for details";

async function singleLineDoc(text = LINE): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 300]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 60, y: 200, size: 14, font });
  return doc.save();
}

/**
 * Two show operators that only form an email once the page text is joined.
 * PDF.js reports them as a single merged run, so the covered text matches
 * neither operator on its own.
 */
async function splitOperatorDoc(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 300]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const size = 14;
  page.drawText("john@", { x: 60, y: 200, size, font });
  page.drawText("example.com", { x: 60 + font.widthOfTextAtSize("john@", size), y: 200, size, font });
  return doc.save();
}

/**
 * Two runs PDF.js keeps separate, because their font sizes differ. The match
 * spans both, so it needs a box per run.
 */
async function splitRunDoc(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 300]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText("john@", { x: 60, y: 200, size: 14, font });
  page.drawText("example.com", { x: 60 + font.widthOfTextAtSize("john@", 14), y: 200, size: 9, font });
  return doc.save();
}

function toAreas(boxes: { x: number; y: number; width: number; height: number }[], page = 1) {
  return boxes.map((box, index): RedactionArea => ({
    id: `a${index}`,
    pageNumber: page,
    ...box,
    fillColor: "black",
  }));
}

describe("PII redaction geometry", () => {
  it("reports character offsets rather than a placeholder box", () => {
    const matches = scanTextForPii("mail me at a@b.co please", 1, {});
    const email = matches.find((m) => m.type === "email");

    expect(email?.text).toBe("a@b.co");
    expect(email?.start).toBe(11);
    expect(email?.end).toBe(17);
  });

  it("finds PII split across two reported runs and boxes each one", async () => {
    const findings = await scanPdfForPii(await splitRunDoc(), { includeEmails: true });
    const email = findings.find((f) => f.type === "email");

    expect(email?.text).toBe("john@example.com");
    // One box per run, because each run has its own position and size.
    expect(email!.boxes.length).toBe(2);
    expect(email!.boxes[0].height).not.toBeCloseTo(email!.boxes[1].height, 1);
  });

  it("removes PII split across two reported runs", async () => {
    const bytes = await splitRunDoc();
    const findings = await scanPdfForPii(bytes, { includeEmails: true });
    const result = await applyRedactions(bytes, toAreas(findings.flatMap((f) => f.boxes)));

    expect(await extractPdfText(result.pdfBytes)).not.toContain("example.com");
  });

  it("removes PII split across two operators of one merged run", async () => {
    const bytes = await splitOperatorDoc();
    const findings = await scanPdfForPii(bytes, { includeEmails: true });
    expect(findings[0].text).toBe("john@example.com");

    const result = await applyRedactions(bytes, toAreas(findings.flatMap((f) => f.boxes)));
    const text = await extractPdfText(result.pdfBytes);

    expect(text).not.toContain("example.com");
    expect(text).not.toContain("john@");
  });

  it("boxes the match, not the whole line", async () => {
    const findings = await scanPdfForPii(await singleLineDoc(), { includeEmails: true });
    const box = findings[0].boxes[0];

    // The line starts at x=60 and runs ~245pt. The email sits inside it, so a
    // correct box is both narrower than the line and offset from its start.
    expect(box.x).toBeGreaterThan(90);
    expect(box.width).toBeLessThan(140);
  });

  it("covers descenders below the baseline", async () => {
    const findings = await scanPdfForPii(await singleLineDoc(), { includeEmails: true });
    const box = findings[0].boxes[0];

    // Baseline is y=200; "j" descends below it, so the box must start lower.
    expect(box.y).toBeLessThan(200);
    expect(box.y + box.height).toBeGreaterThan(200 + 14 * 0.7);
  });

  it("deletes only the covered characters, keeping the rest of the line", async () => {
    const bytes = await singleLineDoc();
    const findings = await scanPdfForPii(bytes, { includeEmails: true });
    const result = await applyRedactions(bytes, toAreas(findings.flatMap((f) => f.boxes)));
    const text = await extractPdfText(result.pdfBytes);

    expect(text).not.toContain("john@example.com");
    expect(text).toContain("Contact:");
    expect(text).toContain("for details");
  });

  it("leaves other text on the page untouched", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([500, 300]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("Email: a@b.co", { x: 60, y: 200, size: 14, font });
    page.drawText("Keep this line intact", { x: 60, y: 150, size: 14, font });
    const bytes = await doc.save();

    const findings = await scanPdfForPii(bytes, { includeEmails: true });
    const result = await applyRedactions(bytes, toAreas(findings.flatMap((f) => f.boxes)));
    const text = await extractPdfText(result.pdfBytes);

    expect(text).not.toContain("a@b.co");
    expect(text).toContain("Keep this line intact");
  });
});
