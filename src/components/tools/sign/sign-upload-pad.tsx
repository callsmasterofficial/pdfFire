"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, Sliders, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignUploadPadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

export function SignUploadPad({ onSignatureChange }: SignUploadPadProps) {
  const [threshold, setThreshold] = useState(215);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processImageTransparency = useCallback(
    (img: HTMLImageElement, thresh: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luminance >= thresh) {
          // Transparent background
          data[i + 3] = 0;
        } else {
          // Darken ink contrast
          const contrast = Math.max(0, 1 - luminance / thresh);
          data[i + 3] = Math.min(255, Math.floor(contrast * 255 * 1.5));
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      setProcessedUrl(dataUrl);
      onSignatureChange(dataUrl);
    },
    [onSignatureChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        processImageTransparency(img, threshold);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);
    if (originalImage) {
      processImageTransparency(originalImage, newThreshold);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedUrl(null);
    onSignatureChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!originalImage ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer group"
        >
          <UploadCloud className="size-9 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
          <span className="text-xs font-semibold text-foreground">Upload signature photo or scan</span>
          <span className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, or WebP. Paper background is auto-removed.</span>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative border border-border rounded-xl bg-surface p-4 flex items-center justify-center min-h-[140px] bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[size:16px_16px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={processedUrl || ""}
              alt="Transparentized signature"
              className="max-h-28 object-contain"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-surface-secondary/40 p-3 rounded-lg border border-border">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Sliders className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-semibold text-foreground shrink-0">Paper Filter:</span>
              <input
                type="range"
                min="140"
                max="245"
                value={threshold}
                onChange={(e) => handleThresholdChange(Number(e.target.value))}
                className="w-full sm:w-36 accent-primary"
              />
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs gap-1">
              <RotateCcw className="size-3" /> Change Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
