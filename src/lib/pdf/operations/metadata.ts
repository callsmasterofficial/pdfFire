import { PDFDict, PDFDocument, PDFName, PDFRef } from "pdf-lib";

export interface PdfMetadataInfo {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate?: string;
  modificationDate?: string;
  pageCount: number;
}

export interface UpdateMetadataOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  stripAll?: boolean;
  outputFileName?: string;
}

export interface UpdateMetadataResult {
  pdfBytes: Uint8Array;
  fileName: string;
  metadata: PdfMetadataInfo;
}

export async function readPdfMetadata(
  fileOrBytes: File | Uint8Array | ArrayBuffer
): Promise<PdfMetadataInfo> {
  const bytes = fileOrBytes instanceof File ? await fileOrBytes.arrayBuffer() : fileOrBytes;
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const creationDate = pdfDoc.getCreationDate();
  const modificationDate = pdfDoc.getModificationDate();

  return {
    title: pdfDoc.getTitle() || "",
    author: pdfDoc.getAuthor() || "",
    subject: pdfDoc.getSubject() || "",
    keywords: pdfDoc.getKeywords() || "",
    creator: pdfDoc.getCreator() || "",
    producer: pdfDoc.getProducer() || "",
    creationDate: creationDate ? creationDate.toISOString() : undefined,
    modificationDate: modificationDate ? modificationDate.toISOString() : undefined,
    pageCount: pdfDoc.getPageCount(),
  };
}

export async function updatePdfMetadata(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  options: UpdateMetadataOptions
): Promise<UpdateMetadataResult> {
  const bytes = fileOrBytes instanceof File ? await fileOrBytes.arrayBuffer() : fileOrBytes;
  // pdf-lib stamps its own Producer and ModDate on load unless told not to,
  // which would reintroduce metadata the user asked to remove.
  const pdfDoc = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  if (options.stripAll) {
    stripDocumentMetadata(pdfDoc);
  } else {
    if (options.title !== undefined) pdfDoc.setTitle(options.title);
    if (options.author !== undefined) pdfDoc.setAuthor(options.author);
    if (options.subject !== undefined) pdfDoc.setSubject(options.subject);
    if (options.keywords !== undefined) {
      const kwList = options.keywords.split(",").map((k) => k.trim()).filter(Boolean);
      pdfDoc.setKeywords(kwList);
    }
    if (options.creator !== undefined) pdfDoc.setCreator(options.creator);
    if (options.producer !== undefined) pdfDoc.setProducer(options.producer);
  }

  // Stamping a fresh modification date would reintroduce a timestamp the user
  // just asked to remove, and pdf-lib's own save() adds ModDate and Producer
  // unless told not to.
  if (!options.stripAll) pdfDoc.setModificationDate(new Date());
  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });

  const updatedMeta: PdfMetadataInfo = {
    title: pdfDoc.getTitle() || "",
    author: pdfDoc.getAuthor() || "",
    subject: pdfDoc.getSubject() || "",
    keywords: pdfDoc.getKeywords() || "",
    creator: pdfDoc.getCreator() || "",
    producer: pdfDoc.getProducer() || "",
    modificationDate: options.stripAll ? undefined : new Date().toISOString(),
    pageCount: pdfDoc.getPageCount(),
  };

  return {
    pdfBytes,
    fileName: options.outputFileName || "updated-metadata.pdf",
    metadata: updatedMeta,
  };
}

/**
 * Clears the identity a PDF carries about its author and origin.
 *
 * The Info dictionary is only half of it: most real PDFs also carry an XMP
 * packet that duplicates the title and author and often holds more besides, so
 * clearing the Info fields alone leaves the same names readable in the file.
 * Dates are identifying too, so they go as well.
 *
 * This is not a claim of complete sanitisation. Annotation authors, embedded
 * file metadata, form field values and XObject-level properties are untouched;
 * the tool copy says so.
 */
function stripDocumentMetadata(pdfDoc: PDFDocument): void {
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("");
  pdfDoc.setCreator("");

  const info = pdfDoc.context.lookupMaybe(pdfDoc.context.trailerInfo.Info, PDFDict);
  for (const key of ["CreationDate", "ModDate"]) {
    info?.delete(PDFName.of(key));
  }

  // The XMP packet lives on the catalog and survives Info-only edits. Dropping
  // the catalog entry is not enough: the stream object stays registered and is
  // still written to the file, so it has to be deleted from the context too.
  const metadataKey = PDFName.of("Metadata");
  const metadataRef = pdfDoc.catalog.get(metadataKey);
  if (metadataRef) {
    pdfDoc.catalog.delete(metadataKey);
    if (metadataRef instanceof PDFRef) pdfDoc.context.delete(metadataRef);
  }
}
