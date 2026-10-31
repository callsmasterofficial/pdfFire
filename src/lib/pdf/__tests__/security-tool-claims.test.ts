/**
 * Claim-versus-behaviour audit for the security and diagnostics tools (FM-009).
 *
 * Every defect found in this project so far came from testing a public claim
 * against what the code actually does, so these tests are written from the
 * marketing copy in `src/lib/seo/` rather than from the implementation.
 */
import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName, StandardFonts } from "pdf-lib";
import { updatePdfMetadata, readPdfMetadata } from "../operations/metadata";
import { protectPdf } from "../operations/protect";
import { checkPdfEncryption } from "../operations/security";
import { fillAndFlattenPdfForm } from "../operations/forms";
import { repairPdfDocument } from "../operations/repair";
import { compressPdfDocument } from "../operations/compress";

async function docWithMetadata(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 300]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText("Body text", { x: 50, y: 200, size: 12, font });

  doc.setTitle("Internal Title");
  doc.setAuthor("Jane Author");
  doc.setCreationDate(new Date("2020-01-02T03:04:05Z"));

  // Real PDFs carry an XMP packet that duplicates the Info dictionary and
  // often holds more besides, so a sanitiser has to deal with it.
  const xmp = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
    <x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF
      xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
      xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description rdf:about=""><dc:creator>Jane Author</dc:creator>
      <dc:title>Internal Title</dc:title></rdf:Description>
    </rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
  const stream = doc.context.stream(xmp, { Type: "Metadata", Subtype: "XML" });
  doc.catalog.set(PDFName.of("Metadata"), doc.context.register(stream));

  return doc.save();
}

/** Raw bytes, for checking what survived in the file itself. */
function asLatin1(bytes: Uint8Array): string {
  return new TextDecoder("latin1").decode(bytes);
}

describe("metadata: \"strip all\" claims privacy sanitisation", () => {
  it("harness confirms the metadata is present to begin with", async () => {
    const bytes = await docWithMetadata();
    expect(asLatin1(bytes)).toContain("Jane Author");
    expect((await readPdfMetadata(bytes)).author).toBe("Jane Author");
  });

  it("clears the Info dictionary fields", async () => {
    const result = await updatePdfMetadata(await docWithMetadata(), { stripAll: true });
    const meta = await readPdfMetadata(result.pdfBytes);

    expect(meta.title).toBe("");
    expect(meta.author).toBe("");
  });

  it("removes the XMP packet, which duplicates the same identity", async () => {
    const result = await updatePdfMetadata(await docWithMetadata(), { stripAll: true });

    expect(asLatin1(result.pdfBytes)).not.toContain("Jane Author");
  });

  it("clears the creation date", async () => {
    const result = await updatePdfMetadata(await docWithMetadata(), { stripAll: true });
    // pdf-lib's own load() fills in missing dates unless told not to, which
    // would mask whether the strip actually worked.
    const reloaded = await PDFDocument.load(result.pdfBytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    expect(reloaded.getCreationDate()).toBeUndefined();
  });
});

describe("protect: claims AES-256 encryption", () => {
  it("produces a file an independent reader refuses without the password", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const result = await protectPdf(await doc.save(), { userPassword: "correct horse" });

    const inspection = await checkPdfEncryption(result.pdfBytes);
    expect(inspection.isEncrypted).toBe(true);
    expect(inspection.canOpenWithoutPassword).toBe(false);
  });

  it("writes an AES-256 encryption dictionary, not RC4", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const result = await protectPdf(await doc.save(), { userPassword: "correct horse" });
    const raw = asLatin1(result.pdfBytes);

    expect(raw).toContain("/Encrypt");
    // AES-256 is revision 6, version 5, with a 256-bit key.
    expect(raw).toMatch(/\/R\s*6/);
    expect(raw).toMatch(/\/V\s*5/);
  });
});

describe("flatten: claims fields can no longer be edited", () => {
  it("leaves no interactive fields behind", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 200]);
    const form = doc.getForm();
    const field = form.createTextField("applicant.name");
    field.setText("Jane");
    field.addToPage(page, { x: 50, y: 100, width: 200, height: 20 });

    const result = await fillAndFlattenPdfForm(await doc.save(), {}, true);
    const reloaded = await PDFDocument.load(result.pdfBytes);

    expect(reloaded.getForm().getFields()).toHaveLength(0);
  });
});

describe("repair: claims a diagnostic report of what was fixed", () => {
  it("does not report repairs it did not perform on a healthy file", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const { diagnostics } = await repairPdfDocument(await doc.save());

    expect(diagnostics.headerRepaired).toBe(false);
    expect(diagnostics.eofRepaired).toBe(false);
    // A valid file has a valid xref; claiming a rebuild is a false positive.
    expect(diagnostics.xrefRebuilt).toBe(false);
  });

  it("does not report recovered pages when it salvaged nothing", async () => {
    const garbage = new Uint8Array(512).fill(0x41);
    const { diagnostics } = await repairPdfDocument(garbage);

    expect(diagnostics.pagesRecovered).toBe(0);
  });
});

describe("compress: claims three distinct presets", () => {
  it("light and balanced are not the same operation", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 300]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("Body text", { x: 50, y: 200, size: 12, font });
    doc.setTitle("Keep me");
    doc.setAuthor("Keep me too");
    const bytes = await doc.save();

    const light = await compressPdfDocument(bytes, { preset: "low", stripMetadata: false });
    const balanced = await compressPdfDocument(bytes, { preset: "medium", stripMetadata: false });

    // "Light (clean streams)" should preserve metadata that "Balanced" strips.
    const lightMeta = await readPdfMetadata(light.pdfBytes);
    expect(lightMeta.author).toBe("Keep me too");
    expect((await readPdfMetadata(balanced.pdfBytes)).author).toBe("");
  });
});
