import { describe, it, expect, afterEach, vi } from "vitest";
import {
  isDesktopApp,
  openDocumentsNative,
  saveDocumentNative,
} from "../bridge";

/**
 * The bridge is the seam between the web app and the desktop shell, and the
 * part that is easy to get wrong is the difference between "the user cancelled"
 * and "there is no desktop here". Treating those the same means a cancelled
 * save dialog still drops the file into Downloads, against the user's decision.
 */

type Bridge = NonNullable<typeof globalThis.window extends never ? never : Window["filemeloDesktop"]>;

function installBridge(partial: Partial<Bridge>) {
  (globalThis as unknown as { window: Window }).window = {
    filemeloDesktop: {
      isDesktop: true,
      platform: "darwin",
      openDocuments: async () => [],
      saveDocument: async () => ({ saved: false }),
      revealFile: async () => false,
      ...partial,
    },
  } as unknown as Window & typeof globalThis;
}

function removeBridge() {
  (globalThis as unknown as { window: Window }).window = {} as Window & typeof globalThis;
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  vi.restoreAllMocks();
});

describe("isDesktopApp", () => {
  it("is false in a plain browser", () => {
    removeBridge();
    expect(isDesktopApp()).toBe(false);
  });

  it("is true inside the shell", () => {
    installBridge({});
    expect(isDesktopApp()).toBe(true);
  });
});

describe("saveDocumentNative", () => {
  it("reports unavailable with no bridge, so callers fall back", async () => {
    removeBridge();
    expect(await saveDocumentNative(new Uint8Array([1]), "a.pdf")).toBe(
      "unavailable"
    );
  });

  it("reports saved when the user picks a location", async () => {
    installBridge({ saveDocument: async () => ({ saved: true, name: "a.pdf" }) });
    expect(await saveDocumentNative(new Uint8Array([1]), "a.pdf")).toBe("saved");
  });

  it("distinguishes a cancelled dialog from a failure", async () => {
    // No `error` field: the user simply dismissed the dialog.
    installBridge({ saveDocument: async () => ({ saved: false }) });
    expect(await saveDocumentNative(new Uint8Array([1]), "a.pdf")).toBe(
      "cancelled"
    );
  });

  it("treats a reported error as unavailable so the document is not lost", async () => {
    installBridge({
      saveDocument: async () => ({ saved: false, error: "disk full" }),
    });
    expect(await saveDocumentNative(new Uint8Array([1]), "a.pdf")).toBe(
      "unavailable"
    );
  });

  it("treats a thrown bridge as unavailable rather than propagating", async () => {
    installBridge({
      saveDocument: async () => {
        throw new Error("ipc gone");
      },
    });
    expect(await saveDocumentNative(new Uint8Array([1]), "a.pdf")).toBe(
      "unavailable"
    );
  });

  it("passes the bytes through unchanged", async () => {
    const seen: number[][] = [];
    installBridge({
      saveDocument: async (p) => {
        seen.push(Array.from(p.bytes));
        return { saved: true };
      },
    });
    await saveDocumentNative(new Uint8Array([0x25, 0x50, 0x44, 0x46]), "x.pdf");
    expect(seen).toEqual([[0x25, 0x50, 0x44, 0x46]]);
  });
});

describe("openDocumentsNative", () => {
  it("returns null in a browser, which is distinct from an empty pick", async () => {
    removeBridge();
    expect(await openDocumentsNative()).toBeNull();
  });

  it("returns an empty array when the user cancels the picker", async () => {
    installBridge({ openDocuments: async () => [] });
    expect(await openDocumentsNative()).toEqual([]);
  });

  it("converts picked bytes into Files the rest of the app can use", async () => {
    installBridge({
      openDocuments: async () => [
        { name: "doc.pdf", size: 4, bytes: new Uint8Array([37, 80, 68, 70]) },
      ],
    });
    const files = await openDocumentsNative();
    expect(files).toHaveLength(1);
    expect(files![0]).toBeInstanceOf(File);
    expect(files![0].name).toBe("doc.pdf");
    expect(files![0].type).toBe("application/pdf");
    expect(new Uint8Array(await files![0].arrayBuffer())).toEqual(
      new Uint8Array([37, 80, 68, 70])
    );
  });

  it("gives images their own type so downstream checks work", async () => {
    installBridge({
      openDocuments: async () => [
        { name: "scan.PNG", size: 1, bytes: new Uint8Array([1]) },
      ],
    });
    const files = await openDocumentsNative();
    expect(files![0].type).toBe("image/png");
  });
});
