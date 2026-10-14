import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createSamplePdfFile } from "../test-fixtures";
import { readPdfMetadata, updatePdfMetadata } from "../operations/metadata";
import { calculateDocumentChecksums, verifyChecksum } from "../operations/hash";
import { inspectPdfForm, fillAndFlattenPdfForm } from "../operations/forms";
import { checkPdfEncryption } from "../operations/security";

describe("Phase 6 PDF Operations (Metadata, Security & Forms)", () => {
  it("Metadata: reads and updates Title, Author, and Keywords", async () => {
    const doc = createSamplePdfFile("meta-test.pdf");
    const updated = await updatePdfMetadata(doc, {
      title: "Quarterly Audit Report",
      author: "Finance Team",
      subject: "Annual Review",
      keywords: "finance, audit, q3",
    });

    expect(updated.metadata.title).toBe("Quarterly Audit Report");
    expect(updated.metadata.author).toBe("Finance Team");
    expect(updated.metadata.subject).toBe("Annual Review");
    expect(updated.metadata.keywords).toContain("finance");

    // Re-read output
    const reRead = await readPdfMetadata(updated.pdfBytes);
    expect(reRead.title).toBe("Quarterly Audit Report");
    expect(reRead.author).toBe("Finance Team");
  });

  it("Metadata: strips all metadata for privacy", async () => {
    const doc = createSamplePdfFile("strip-test.pdf");
    const stripped = await updatePdfMetadata(doc, { stripAll: true });

    expect(stripped.metadata.title).toBe("");
    expect(stripped.metadata.author).toBe("");
    expect(stripped.metadata.producer).toBe("");

    const reRead = await readPdfMetadata(stripped.pdfBytes);
    expect(reRead.title).toBe("");
    expect(reRead.author).toBe("");
  });

  it("Cryptographic Hash: computes SHA-256, SHA-1 and verifies checksum", async () => {
    const doc = createSamplePdfFile("hash-test.pdf");
    const checksums = await calculateDocumentChecksums(doc);

    expect(checksums.sha256).toBeDefined();
    expect(checksums.sha256.length).toBe(64); // 256 bits = 64 hex chars
    expect(checksums.sha1.length).toBe(40); // 160 bits = 40 hex chars
    expect(checksums.sha512.length).toBe(128); // 512 bits = 128 hex chars
    expect(checksums.byteSize).toBeGreaterThan(0);

    // Verification check
    const isMatch = verifyChecksum(checksums.sha256, checksums.sha256.toUpperCase());
    expect(isMatch).toBe(true);

    const isMismatch = verifyChecksum(checksums.sha256, "0000000000000000000000000000000000000000000000000000000000000000");
    expect(isMismatch).toBe(false);
  });

  it("Forms: inspects, fills and flattens AcroForm fields", async () => {
    // Create PDF with a form field
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 400]);
    const form = pdfDoc.getForm();
    const textField = form.createTextField("applicantName");
    textField.setText("Jane Doe");
    textField.addToPage(page, { x: 50, y: 300, width: 200, height: 25 });
    const bytes = await pdfDoc.save();

    // Inspect
    const inspected = await inspectPdfForm(bytes);
    expect(inspected.hasForm).toBe(true);
    expect(inspected.fields.length).toBe(1);
    expect(inspected.fields[0].name).toBe("applicantName");
    expect(inspected.fields[0].currentValue).toBe("Jane Doe");

    // Fill & Flatten
    const result = await fillAndFlattenPdfForm(bytes, { applicantName: "John Smith" }, true);
    expect(result.fieldCount).toBe(1);
    expect(result.isFlattened).toBe(true);

    // After flattening, form fields are converted to static graphics
    const flattenedInspect = await inspectPdfForm(result.pdfBytes);
    expect(flattenedInspect.hasForm).toBe(false);
  });

  it("Security: inspects standard unencrypted document", async () => {
    const doc = createSamplePdfFile("security-test.pdf");
    const status = await checkPdfEncryption(doc);

    expect(status.isEncrypted).toBe(false);
    expect(status.canOpenWithoutPassword).toBe(true);
    expect(status.pageCount).toBe(3);
  });
});
