"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, Info } from "lucide-react";
import type { RedactionResult } from "@/lib/pdf/operations/redact";

/**
 * States plainly what the redaction did and did not do.
 *
 * The product must not imply that a filled rectangle removes content, so the
 * verified text removal and the non-text caveat are always shown together.
 */
export function RedactVerificationNotice({ result }: { result: RedactionResult }) {
  const verified = result.textRemovalVerified;

  return (
    <div className="space-y-2">
      <div
        className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm ${
          verified
            ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-400"
        }`}
      >
        {verified ? (
          <ShieldCheck className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
        ) : (
          <ShieldAlert className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
        )}
        <p>
          {verified ? (
            <>
              Covered text was deleted from {result.removedTextOperations}{" "}
              {result.removedTextOperations === 1 ? "text operation" : "text operations"} and the
              exported file was re-checked: that text can no longer be extracted.
            </>
          ) : (
            <>
              The boxes were drawn but the underlying text was <strong>not</strong> removed. Anyone
              can still copy it out of the file. Do not treat this output as redacted.
            </>
          )}
        </p>
      </div>

      {result.contentMatchedPages.length > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400">
          <ShieldAlert className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            On page{result.contentMatchedPages.length === 1 ? "" : "s"}{" "}
            {result.contentMatchedPages.join(", ")} the covered text could not be matched by
            position, so every copy of it on th{result.contentMatchedPages.length === 1 ? "at" : "ose"}{" "}
            page was removed. Identical text you did not cover may also be gone.
          </p>
        </div>
      )}

      {result.shiftedPages.length > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground">
          <Info className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            On page{result.shiftedPages.length === 1 ? "" : "s"} {result.shiftedPages.join(", ")}{" "}
            nearby text shifted slightly and now sits under a box. Nothing extra was deleted, but
            the box hides a little more than you marked.
          </p>
        </div>
      )}

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground">
        <Info className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Images, vector artwork, annotations and form fields under a box are covered, not deleted —
          and text inside a scanned image is a picture, so there is no text to remove. Review the
          output before sharing it.
        </p>
      </div>
    </div>
  );
}
