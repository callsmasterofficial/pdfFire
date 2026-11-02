/**
 * Access to the desktop shell, when the app happens to be running inside it.
 *
 * Everything here degrades to `null`/`false` in a normal browser, so callers
 * can try the native path and fall back without branching on the platform
 * themselves. The shell exposes no filesystem paths — it can only offer the
 * user a picker or a save dialog — so nothing here can read or write a
 * location the user did not choose.
 *
 * See `desktop/src/preload.js` for the other side of this contract.
 */

export interface DesktopFile {
  name: string;
  size: number;
  bytes: Uint8Array;
}

interface DesktopBridge {
  isDesktop: true;
  platform: string;
  openDocuments(): Promise<DesktopFile[]>;
  saveDocument(payload: { name: string; bytes: Uint8Array }): Promise<{
    saved: boolean;
    name?: string;
    error?: string;
  }>;
  revealFile(name: string): Promise<boolean>;
}

declare global {
  interface Window {
    filemeloDesktop?: DesktopBridge;
  }
}

function bridge(): DesktopBridge | null {
  if (typeof window === "undefined") return null;
  return window.filemeloDesktop ?? null;
}

/** True only inside the desktop shell. */
export function isDesktopApp(): boolean {
  return bridge() !== null;
}

/** The host platform when running in the shell, else null. */
export function desktopPlatform(): string | null {
  return bridge()?.platform ?? null;
}

/**
 * Opens the OS file picker and returns the chosen files as `File` objects, so
 * callers can treat them exactly like a browser `<input type="file">` result.
 *
 * Returns null in a browser, and an empty array if the user cancelled — the
 * caller needs to tell those apart to decide whether to fall back.
 */
export async function openDocumentsNative(): Promise<File[] | null> {
  const api = bridge();
  if (!api) return null;

  const picked = await api.openDocuments();
  return picked.map((file) => {
    // Copy into a fresh buffer: the array arrives over IPC and we want a plain
    // ArrayBuffer backing the File, not a view onto shared memory.
    const copy = new Uint8Array(file.bytes.byteLength);
    copy.set(file.bytes);
    return new File([copy], file.name, { type: guessMimeType(file.name) });
  });
}

/**
 * Outcome of a native save.
 *
 * "cancelled" is deliberately distinct from "unavailable": if the user dismisses
 * the save dialog they have decided not to save, and falling back to a browser
 * download would drop the file into Downloads against that decision. Only
 * "unavailable" should fall back.
 */
export type NativeSaveOutcome = "saved" | "cancelled" | "unavailable";

/** Saves through the OS save dialog. */
export async function saveDocumentNative(
  data: Blob | Uint8Array,
  fileName: string
): Promise<NativeSaveOutcome> {
  const api = bridge();
  if (!api) return "unavailable";

  const bytes =
    data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;

  try {
    const result = await api.saveDocument({ name: fileName, bytes });
    if (result.saved) return "saved";
    // The main process reports an `error` for a genuine failure and nothing at
    // all when the user simply dismissed the dialog.
    return result.error ? "unavailable" : "cancelled";
  } catch {
    // A broken bridge should not lose the document: let the caller fall back.
    return "unavailable";
  }
}

/** Reveals a saved file in Finder/Explorer. No-op in a browser. */
export async function revealFileNative(fileName: string): Promise<boolean> {
  const api = bridge();
  if (!api) return false;
  return api.revealFile(fileName);
}

function guessMimeType(name: string): string {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
