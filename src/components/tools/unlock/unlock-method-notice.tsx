"use client";

import React from "react";
import { FileText, ImageOff, Info } from "lucide-react";

type Method = "decrypted" | "rasterized";

/**
 * Says how the document was unlocked, or how it will be.
 *
 * Unlocking takes one of two paths with very different consequences: AES-256
 * documents are decrypted in place and keep their text, while anything else
 * falls back to page images and loses it. Neither can be claimed in advance, so
 * before processing this explains both and afterwards it states which happened.
 */
export function UnlockMethodNotice({ method }: { method?: Method }) {
  if (!method) {
    return (
      <div
        role="note"
        className="flex items-start gap-2.5 p-3.5 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground"
      >
        <Info className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          AES-256 documents are decrypted in place, so the text stays selectable and searchable.
          Older encryption cannot be removed that way, so those pages are re-rendered as images
          instead — which still opens without a password but loses the text layer. You will be told
          which happened.
        </p>
      </div>
    );
  }

  if (method === "decrypted") {
    return (
      <div
        role="status"
        className="flex items-start gap-2.5 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-sm text-emerald-700 dark:text-emerald-400"
      >
        <FileText className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Decrypted in place. The password is gone and the original text, fonts and structure are
          intact — the text is still selectable and searchable.
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400"
    >
      <ImageOff className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">
          This document&apos;s encryption could not be removed in place.
        </p>
        <p>
          Each page was re-rendered as an image instead. It opens without a password, but the text
          can no longer be selected, searched or read by a screen reader, and the file is usually
          larger. Keep your original.
        </p>
      </div>
    </div>
  );
}
