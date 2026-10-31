"use client";

import React from "react";
import { ImageOff } from "lucide-react";

/**
 * States how unlocking actually works, before the user commits to it.
 *
 * pdf-lib cannot write a decrypted copy of an encrypted document, so the file
 * is opened with PDF.js and each page re-rendered as an image. That produces a
 * document which opens without a password but has no text layer — a real loss
 * the listing previously described as "decrypts document streams".
 */
export function UnlockRasterizationNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400"
    >
      <ImageOff className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">The unlocked copy will be page images, not text.</p>
        <p>
          Each page is re-rendered, so the result opens without a password but its text can no
          longer be selected, searched or read by a screen reader, and the file is usually larger.
          Keep your original.
        </p>
      </div>
    </div>
  );
}
