import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { applyRedactions } from "../operations/redact";
import { scanTextForPii } from "../operations/redact-pii";

async function createSampleDocWithPii(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 700]);
  page.drawText("Confidential Report for user@company.com", { x: 50, y: 650 });
  page.drawText("Direct Phone: 555-432-1098, SSN: 123-45-6789", { x: 50, y: 600 });
  page.drawText("Project Codename: Falcon", { x: 50, y: 550 });

  doc.setTitle("Secret Title");
  doc.setAuthor("Secret Agent");
  return await doc.save();
}

describe("Phase 13: Redaction & PII Scanning Operations", () => {
  it("applies redaction areas and strips metadata", async () => {
    const bytes = await createSampleDocWithPii();
    const result = await applyRedactions(
      bytes,
      [
        {
          id: "r1",
          pageNumber: 1,
          x: 50,
          y: 590,
          width: 200,
          height: 30,
          fillColor: "black",
          overlayText: "[REDACTED]",
        },
      ],
      true
    );

    expect(result.redactedCount).toBe(1);
    expect(result.pagesAffected).toBe(1);

    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getTitle()).toBe("");
    expect(doc.getAuthor()).toBe("");
  });

  it("detects email, phone, and SSN in document text streams", () => {
    const sampleText =
      "Confidential Report for user@company.com\nDirect Phone: 555-432-1098, SSN: 123-45-6789\nProject Codename: Falcon";
    const findings = scanTextForPii(sampleText, 1, {
      includeEmails: true,
      includePhones: true,
      includeSsn: true,
      customKeywords: ["Falcon"],
    });

    const types = findings.map((f) => f.type);
    expect(types).toContain("email");
    expect(types).toContain("phone");
    expect(types).toContain("ssn");
    expect(types).toContain("custom");

    const emailFinding = findings.find((f) => f.type === "email");
    expect(emailFinding?.text).toBe("user@company.com");
  });

  it("safely ignores out-of-range page numbers", async () => {
    const bytes = await createSampleDocWithPii();
    const result = await applyRedactions(bytes, [
      {
        id: "r-invalid",
        pageNumber: 99,
        x: 10,
        y: 10,
        width: 50,
        height: 20,
      },
    ]);

    expect(result.redactedCount).toBe(0);
    expect(result.pagesAffected).toBe(0);
  });
});
