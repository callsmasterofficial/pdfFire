/**
 * Reads the /Encrypt dictionary from a document loaded with
 * `ignoreEncryption: true`, where pdf-lib has parsed the structure but left
 * every stream and string as ciphertext.
 */
import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFString,
} from "pdf-lib";
import {
  UnsupportedEncryptionError,
  type EncryptionDictionary,
} from "../../crypto/standard-security";

function bytesOf(dict: PDFDict, key: string): Uint8Array {
  const value = dict.lookup(PDFName.of(key));
  if (value instanceof PDFHexString || value instanceof PDFString) {
    return value.asBytes();
  }
  return new Uint8Array(0);
}

function numberOf(dict: PDFDict, key: string, fallback = 0): number {
  const value = dict.lookup(PDFName.of(key));
  return value instanceof PDFNumber ? value.asNumber() : fallback;
}

/** Crypt filter method named by /StmF or /StrF, resolved through /CF. */
function filterMethod(encrypt: PDFDict, which: "StmF" | "StrF"): string {
  const name = encrypt.lookup(PDFName.of(which));
  const filterName = name instanceof PDFName ? name.asString().replace(/^\//, "") : "Identity";
  if (filterName === "Identity") return "Identity";

  const cf = encrypt.lookup(PDFName.of("CF"));
  if (!(cf instanceof PDFDict)) return "Unknown";
  const entry = cf.lookup(PDFName.of(filterName));
  if (!(entry instanceof PDFDict)) return "Unknown";
  const cfm = entry.lookup(PDFName.of("CFM"));
  return cfm instanceof PDFName ? cfm.asString().replace(/^\//, "") : "Unknown";
}

/** First element of the trailer /ID array, which the revision 2-4 key uses. */
function firstFileId(doc: PDFDocument): Uint8Array {
  const id = doc.context.lookupMaybe(doc.context.trailerInfo.ID, PDFArray);
  const first = id?.get(0);
  if (first instanceof PDFHexString || first instanceof PDFString) return first.asBytes();
  return new Uint8Array(0);
}

export function readEncryptDict(doc: PDFDocument): EncryptionDictionary {
  const encrypt = doc.context.lookupMaybe(doc.context.trailerInfo.Encrypt, PDFDict);
  if (!encrypt) {
    throw new UnsupportedEncryptionError("This document has no encryption dictionary.");
  }

  const version = numberOf(encrypt, "V");
  // /Length is in bits and defaults to 40 for V1.
  const lengthBits = numberOf(encrypt, "Length", version === 1 ? 40 : 128);
  const metadataFlag = encrypt.lookup(PDFName.of("EncryptMetadata"));

  return {
    v: version,
    r: numberOf(encrypt, "R"),
    keyLength: Math.max(5, Math.floor(lengthBits / 8)),
    p: numberOf(encrypt, "P", -1),
    idFirst: firstFileId(doc),
    encryptMetadata: metadataFlag instanceof PDFBool ? metadataFlag.asBoolean() : true,
    u: bytesOf(encrypt, "U"),
    o: bytesOf(encrypt, "O"),
    ue: bytesOf(encrypt, "UE"),
    oe: bytesOf(encrypt, "OE"),
    streamFilterMethod: filterMethod(encrypt, "StmF"),
    stringFilterMethod: filterMethod(encrypt, "StrF"),
  };
}
