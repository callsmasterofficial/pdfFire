/**
 * Fetches a language pack's font bytes, once.
 *
 * In the browser the packs are static assets under `/fonts`, so they are
 * fetched on demand and then cached by the browser like any other asset —
 * nothing is downloaded for a document that does not need it, and nothing is
 * requested from a third party, so converting a Chinese document does not tell
 * anyone that you did. Outside the browser the same files are read from disk so
 * the behaviour can be tested.
 */
import { FONT_PACKS, FONT_PACK_PATH, type ScriptId } from "./font-catalog";

const cache = new Map<ScriptId, Promise<Uint8Array>>();

async function fetchPack(pack: ScriptId): Promise<Uint8Array> {
  const file = FONT_PACKS[pack].file;

  if (typeof window === "undefined") {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    return new Uint8Array(await readFile(join(process.cwd(), "public", "fonts", file)));
  }

  const response = await fetch(`${FONT_PACK_PATH}/${file}`);
  if (!response.ok) {
    throw new Error(
      `The ${FONT_PACKS[pack].label} language pack could not be downloaded (${response.status}).`
    );
  }
  return new Uint8Array(await response.arrayBuffer());
}

export function loadFontPack(pack: ScriptId): Promise<Uint8Array> {
  const existing = cache.get(pack);
  if (existing) return existing;

  // Cached as the promise so concurrent callers share one download.
  const loading = fetchPack(pack).catch((error: unknown) => {
    cache.delete(pack);
    throw error;
  });
  cache.set(pack, loading);
  return loading;
}
