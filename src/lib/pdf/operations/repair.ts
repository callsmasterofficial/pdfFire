import { PDFDocument } from "pdf-lib";

export interface RepairDiagnostics {
  headerRepaired: boolean;
  eofRepaired: boolean;
  /**
   * True only when the source could not be parsed as it stood. The document is
   * always reserialised, so reporting a rebuild unconditionally told every
   * user their xref had been broken.
   */
  xrefRebuilt: boolean;
  /** True when at least one page of real content came through. */
  recoverySucceeded: boolean;
  pagesRecovered: number;
  originalSizeBytes: number;
  repairedSizeBytes: number;
  diagnosticLogs: string[];
}

export interface RepairResult {
  diagnostics: RepairDiagnostics;
  pdfBytes: Uint8Array;
}

function sanitizePdfHeader(bytes: Uint8Array, logs: string[]): { sanitized: Uint8Array; headerFixed: boolean } {
  const headerMagic = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
  let headerIndex = -1;

  const searchLimit = Math.min(bytes.length, 4096);
  for (let i = 0; i < searchLimit - 4; i++) {
    if (
      bytes[i] === headerMagic[0] &&
      bytes[i + 1] === headerMagic[1] &&
      bytes[i + 2] === headerMagic[2] &&
      bytes[i + 3] === headerMagic[3] &&
      bytes[i + 4] === headerMagic[4]
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex > 0) {
    logs.push(`Stripped ${headerIndex} leading junk bytes before '%PDF-' header marker.`);
    return { sanitized: bytes.slice(headerIndex), headerFixed: true };
  } else if (headerIndex === -1) {
    logs.push("Missing '%PDF-' header marker. Prepending standard '%PDF-1.7' declaration.");
    const defaultHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a]);
    const merged = new Uint8Array(defaultHeader.length + bytes.length);
    merged.set(defaultHeader, 0);
    merged.set(bytes, defaultHeader.length);
    return { sanitized: merged, headerFixed: true };
  }

  return { sanitized: bytes, headerFixed: false };
}

function ensurePdfEof(bytes: Uint8Array, logs: string[]): { sanitized: Uint8Array; eofFixed: boolean } {
  const tailLimit = Math.min(bytes.length, 1024);
  const tailSlice = bytes.slice(bytes.length - tailLimit);
  const tailText = new TextDecoder("latin1").decode(tailSlice);

  if (!tailText.includes("%%EOF")) {
    logs.push("Missing '%%EOF' end-of-file trailer marker. Appending valid trailer terminator.");
    const eofMarker = new Uint8Array([0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a]); // \n%%EOF\n
    const merged = new Uint8Array(bytes.length + eofMarker.length);
    merged.set(bytes, 0);
    merged.set(eofMarker, bytes.length);
    return { sanitized: merged, eofFixed: true };
  }

  return { sanitized: bytes, eofFixed: false };
}

export async function repairPdfDocument(fileOrBytes: File | Uint8Array): Promise<RepairResult> {
  const originalBytes = fileOrBytes instanceof File ? new Uint8Array(await fileOrBytes.arrayBuffer()) : fileOrBytes;
  const originalSizeBytes = originalBytes.length;
  const logs: string[] = [];

  // Step 1: Sanitize corrupted header
  const { sanitized: headerCleaned, headerFixed } = sanitizePdfHeader(originalBytes, logs);

  // Step 2: Ensure valid EOF trailer
  const { sanitized: streamCleaned, eofFixed } = ensurePdfEof(headerCleaned, logs);

  // Step 3: establish whether anything was actually wrong, before reserialising.
  // The document is rebuilt either way, so without this probe every file would
  // be reported as having had a broken cross-reference table.
  let parsedAsIs = false;
  try {
    await PDFDocument.load(streamCleaned, { ignoreEncryption: true });
    parsedAsIs = true;
    logs.push("Source cross-reference table parsed cleanly; no structural rebuild was required.");
  } catch (err: unknown) {
    logs.push(`Source could not be parsed as it stood: ${(err as Error).message}`);
    logs.push("Rebuilding cross-reference table (xref) and resolving object stream references...");
  }

  let pagesRecovered = 0;
  let recoverySucceeded = false;
  let repairedBytes: Uint8Array;

  try {
    const loadedDoc = await PDFDocument.load(streamCleaned, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
    });

    let pageCount = 0;
    try {
      pageCount = loadedDoc.getPageCount();
    } catch {
      pageCount = 0;
    }
    logs.push(`Detected ${pageCount} document page(s) in source stream.`);

    const pristineDoc = await PDFDocument.create();
    if (pageCount > 0) {
      const pageIndices = Array.from({ length: pageCount }, (_, idx) => idx);
      const copiedPages = await pristineDoc.copyPages(loadedDoc, pageIndices);
      for (const page of copiedPages) {
        pristineDoc.addPage(page);
      }
      pagesRecovered = pageCount;
      recoverySucceeded = true;
      logs.push(`Successfully transferred and reserialized all ${pagesRecovered} page(s).`);
    } else {
      // A blank page is not a recovered page. Saying so would tell the user
      // their content was salvaged when nothing was.
      pristineDoc.addPage([595.28, 841.89]);
      logs.push("No page content could be salvaged. The output is an empty placeholder, not recovered content.");
    }

    repairedBytes = await pristineDoc.save({ useObjectStreams: false });
    if (recoverySucceeded) {
      logs.push("Generated brand-new uncorrupted cross-reference table and trailers.");
    }
  } catch (err: unknown) {
    logs.push(`Structural recovery failed: ${(err as Error).message}`);
    const fallbackDoc = await PDFDocument.create();
    fallbackDoc.addPage([595.28, 841.89]);
    repairedBytes = await fallbackDoc.save();
    logs.push("No content could be recovered from this file. The output is an empty placeholder.");
  }

  const diagnostics: RepairDiagnostics = {
    headerRepaired: headerFixed,
    eofRepaired: eofFixed,
    xrefRebuilt: !parsedAsIs,
    recoverySucceeded,
    pagesRecovered,
    originalSizeBytes,
    repairedSizeBytes: repairedBytes.length,
    diagnosticLogs: logs,
  };

  return { diagnostics, pdfBytes: repairedBytes };
}
