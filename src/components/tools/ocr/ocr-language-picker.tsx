"use client";

import React from "react";
import { OCR_LANGUAGES, SupportedOcrLanguage } from "@/lib/ocr/ocr-types";
import { Label } from "@/components/ui/label";

interface OcrLanguagePickerProps {
  selected: SupportedOcrLanguage;
  disabled?: boolean;
  onSelect: (lang: SupportedOcrLanguage) => void;
}

export function OcrLanguagePicker({ selected, disabled, onSelect }: OcrLanguagePickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-foreground/80">
          Recognition Language Pack
        </Label>
        <span className="text-[11px] text-muted-foreground">
          Cached in browser after first run
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {OCR_LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(lang.code)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary shadow-xs"
                  : "border-border/60 bg-muted/20 hover:bg-muted/40 text-foreground/80"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="text-xs font-semibold">{lang.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                {lang.sizeEstimate}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
