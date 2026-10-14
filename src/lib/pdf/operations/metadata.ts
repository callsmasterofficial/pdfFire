import { PDFDocument } from "pdf-lib";

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
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  if (options.stripAll) {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
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

  pdfDoc.setModificationDate(new Date());
  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });

  const updatedMeta: PdfMetadataInfo = {
    title: pdfDoc.getTitle() || "",
    author: pdfDoc.getAuthor() || "",
    subject: pdfDoc.getSubject() || "",
    keywords: pdfDoc.getKeywords() || "",
    creator: pdfDoc.getCreator() || "",
    producer: pdfDoc.getProducer() || "",
    modificationDate: new Date().toISOString(),
    pageCount: pdfDoc.getPageCount(),
  };

  return {
    pdfBytes,
    fileName: options.outputFileName || "updated-metadata.pdf",
    metadata: updatedMeta,
  };
}
