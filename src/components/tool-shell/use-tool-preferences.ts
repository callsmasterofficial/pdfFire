"use client";

import { useState, useEffect, useCallback } from "react";

const STARRED_KEY = "filemelo_starred_tools";
const RECENT_KEY = "filemelo_recent_tools";
// Read-only fallbacks from before the rename, so an existing visitor does not
// lose their starred and recent tools. Reading one migrates it and clears it.
const LEGACY_STARRED_KEY = "pdffire_starred_tools";
const LEGACY_RECENT_KEY = "pdffire_recent_tools";
const MAX_RECENT = 6;

/** Reads `key`, falling back to `legacyKey` and migrating it across. */
function readWithMigration(key: string, legacyKey: string): string | null {
  const current = localStorage.getItem(key);
  if (current) return current;
  const legacy = localStorage.getItem(legacyKey);
  if (!legacy) return null;
  localStorage.setItem(key, legacy);
  localStorage.removeItem(legacyKey);
  return legacy;
}

export function useToolPreferences() {
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedStarred = readWithMigration(STARRED_KEY, LEGACY_STARRED_KEY);
      if (storedStarred) setStarredIds(JSON.parse(storedStarred));

      const storedRecent = readWithMigration(RECENT_KEY, LEGACY_RECENT_KEY);
      if (storedRecent) setRecentIds(JSON.parse(storedRecent));
    } catch {
      // LocalStorage error fallback
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const toggleStar = useCallback((toolId: string) => {
    setStarredIds((prev) => {
      const updated = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId];
      try {
        localStorage.setItem(STARRED_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const recordRecent = useCallback((toolId: string) => {
    setRecentIds((prev) => {
      const filtered = prev.filter((id) => id !== toolId);
      const updated = [toolId, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentIds([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {}
  }, []);

  return {
    starredIds,
    recentIds,
    isLoaded,
    toggleStar,
    recordRecent,
    clearRecent,
    isStarred: (id: string) => starredIds.includes(id),
  };
}
