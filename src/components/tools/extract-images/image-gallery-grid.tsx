import React from "react";
import { ExtractedImage } from "@/lib/pdf/operations/extract-images";
import { Download, Image as ImageIcon } from "lucide-react";
import { triggerBytesDownload } from "@/lib/pdf/download";

interface ImageGalleryGridProps {
  images: ExtractedImage[];
}

export function ImageGalleryGrid({ images }: ImageGalleryGridProps) {
  if (images.length === 0) return null;

  const handleDownloadSingle = (img: ExtractedImage) => {
    const mime = img.format === "jpeg" ? "image/jpeg" : "image/png";
    triggerBytesDownload(img.bytes, img.name, mime);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <ImageIcon className="size-4 text-primary" />
          Extracted Images ({images.length})
        </h4>
        <span className="text-[11px] text-muted-foreground">
          Total: {Math.round(images.reduce((acc, curr) => acc + curr.sizeBytes, 0) / 1024)} KB
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-xs hover:border-primary/50 transition-all"
          >
            {/* Checkerboard pattern for transparent PNGs */}
            <div className="relative aspect-square w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] bg-muted/40 flex items-center justify-center p-2 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataUrl}
                alt={img.name}
                className="max-h-full max-w-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
              />
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-background/90 text-foreground border border-border/80 shadow-xs">
                Page {img.pageNumber}
              </span>
            </div>

            <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-foreground truncate" title={img.name}>
                  {img.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{img.width} × {img.height} px</span>
                  <span>{Math.max(1, Math.round(img.sizeBytes / 1024))} KB</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadSingle(img)}
                className="w-full py-1 px-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="size-3" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
