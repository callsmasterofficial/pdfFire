export interface DocumentChecksums {
  sha256: string;
  sha1: string;
  sha384: string;
  sha512: string;
  byteSize: number;
  fileName: string;
}

function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  let hexString = "";
  for (let i = 0; i < byteArray.length; i++) {
    const hex = byteArray[i].toString(16).padStart(2, "0");
    hexString += hex;
  }
  return hexString;
}

export async function calculateDocumentChecksums(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  fileName = "document.pdf"
): Promise<DocumentChecksums> {
  let arrayBuffer: ArrayBuffer;
  let size = 0;
  let name = fileName;

  if (fileOrBytes instanceof File) {
    name = fileOrBytes.name;
    size = fileOrBytes.size;
    arrayBuffer = await fileOrBytes.arrayBuffer();
  } else if (fileOrBytes instanceof ArrayBuffer) {
    size = fileOrBytes.byteLength;
    arrayBuffer = fileOrBytes;
  } else {
    size = fileOrBytes.length;
    arrayBuffer = fileOrBytes.buffer as ArrayBuffer;
  }

  // Calculate cryptographic digests in parallel using native Web Crypto API
  const [sha256Buf, sha1Buf, sha384Buf, sha512Buf] = await Promise.all([
    crypto.subtle.digest("SHA-256", arrayBuffer),
    crypto.subtle.digest("SHA-1", arrayBuffer),
    crypto.subtle.digest("SHA-384", arrayBuffer),
    crypto.subtle.digest("SHA-512", arrayBuffer),
  ]);

  return {
    sha256: bufferToHex(sha256Buf),
    sha1: bufferToHex(sha1Buf),
    sha384: bufferToHex(sha384Buf),
    sha512: bufferToHex(sha512Buf),
    byteSize: size,
    fileName: name,
  };
}

export function verifyChecksum(
  calculated: string,
  reference: string
): boolean {
  if (!reference || !calculated) return false;
  return calculated.trim().toLowerCase() === reference.trim().toLowerCase();
}
