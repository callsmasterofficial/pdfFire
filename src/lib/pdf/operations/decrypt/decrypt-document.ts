/**
 * Removes a password from a PDF while keeping its text.
 *
 * pdf-lib cannot open an encrypted document, and PDF.js can decrypt but cannot
 * write one back out. The gap between them is why unlocking used to re-render
 * every page as an image, destroying the text layer.
 *
 * This closes it for AES-256: pdf-lib parses the structure with
 * `ignoreEncryption`, every stream and string is decrypted in place, /Encrypt
 * is dropped, and pdf-lib reserialises — recomputing lengths and the
 * cross-reference table. Text, fonts, links and structure all survive.
 *
 * Anything it cannot handle safely throws `UnsupportedEncryptionError` so the
 * caller can fall back to the disclosed rasterised copy instead of producing a
 * broken file.
 */
import {
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFString,
} from "pdf-lib";
import { bytesToHex } from "@pdfsmaller/pdf-encrypt";
import type { DocumentCipher, ObjectId } from "../../crypto/document-cipher";
import {
  UnsupportedEncryptionError,
  WrongPasswordError,
} from "../../crypto/standard-security";
import { buildCipher } from "./build-cipher";
import { readEncryptDict } from "./read-encrypt-dict";

export { UnsupportedEncryptionError, WrongPasswordError };

export interface DecryptResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  /** Streams whose contents were decrypted. */
  streamsDecrypted: number;
  /** Strings whose contents were decrypted. */
  stringsDecrypted: number;
  /** Which cipher removed the encryption, for reporting. */
  method: string;
}

/**
 * Object streams hold other objects inside an encrypted stream. pdf-lib parses
 * them while loading, before anything can be decrypted, so their contents would
 * already be garbage by the time we got here.
 */
function rejectObjectStreams(bytes: Uint8Array): void {
  const head = new TextDecoder("latin1").decode(bytes);
  if (head.includes("/ObjStm")) {
    throw new UnsupportedEncryptionError(
      "This document stores objects inside encrypted object streams, which cannot be decrypted in place."
    );
  }
}

export async function decryptPdfWithPassword(
  input: Uint8Array,
  password: string
): Promise<DecryptResult> {
  rejectObjectStreams(input);

  const doc = await PDFDocument.load(input, {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
    updateMetadata: false,
  });

  const encryptDict = readEncryptDict(doc);
  const cipher = await buildCipher(encryptDict, password);

  // With /EncryptMetadata false the XMP stream is left in the clear, so
  // decrypting it would turn readable metadata into noise.
  const metadataRef = doc.catalog.get(PDFName.of("Metadata"));
  const clearMetadataObject =
    !encryptDict.encryptMetadata && metadataRef instanceof PDFRef
      ? metadataRef.objectNumber
      : -1;

  // The encryption dictionary's own strings are never encrypted, and it is
  // about to be removed, so it must not be walked.
  const encryptRef = doc.context.trailerInfo.Encrypt;
  const encryptObjectNumber = encryptRef instanceof PDFRef ? encryptRef.objectNumber : -1;

  let streamsDecrypted = 0;
  let stringsDecrypted = 0;

  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    if (ref.objectNumber === encryptObjectNumber) continue;
    const id: ObjectId = {
      objectNumber: ref.objectNumber,
      generationNumber: ref.generationNumber,
    };

    if (object instanceof PDFRawStream) {
      await decryptStringsIn(object.dict, cipher, id, () => stringsDecrypted++);
      if (ref.objectNumber === clearMetadataObject) continue;

      const plain = await cipher.decrypt(object.contents, id);
      object.dict.set(PDFName.of("Length"), PDFNumber.of(plain.length));
      // `contents` is read-only, so the object is replaced rather than mutated.
      doc.context.assign(ref, PDFRawStream.of(object.dict, plain));
      streamsDecrypted++;
      continue;
    }

    if (object instanceof PDFDict) {
      await decryptStringsIn(object, cipher, id, () => stringsDecrypted++);
    }
  }

  doc.context.trailerInfo.Encrypt = undefined;
  if (encryptRef instanceof PDFRef) doc.context.delete(encryptRef);

  const pdfBytes = await doc.save({ useObjectStreams: false });
  return {
    pdfBytes,
    pageCount: doc.getPageCount(),
    streamsDecrypted,
    stringsDecrypted,
    method: cipher.method,
  };
}

/** Decrypts every string value directly inside `dict`. */
async function decryptStringsIn(
  dict: PDFDict,
  cipher: DocumentCipher,
  id: ObjectId,
  onDecrypted: () => void
): Promise<void> {
  for (const [key, value] of dict.entries()) {
    if (!(value instanceof PDFString) && !(value instanceof PDFHexString)) continue;
    const plain = await cipher.decrypt(value.asBytes(), id);
    // The plaintext is raw bytes and may already be UTF-16BE with a byte order
    // mark. Writing it back through fromText() would encode it a second time,
    // so it goes back as hex, byte for byte.
    dict.set(key, PDFHexString.of(bytesToHex(plain)));
    onDecrypted();
  }
}
