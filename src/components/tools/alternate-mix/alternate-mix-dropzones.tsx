import React from "react";
import { ArrowLeftRight, FileText, Upload } from "lucide-react";

interface AlternateMixDropzonesProps {
  fileA: File | null;
  fileB: File | null;
  pageCountA: number;
  pageCountB: number;
  onSelectA: (file: File) => void;
  onSelectB: (file: File) => void;
  onSwap: () => void;
}

export function AlternateMixDropzones({
  fileA,
  fileB,
  pageCountA,
  pageCountB,
  onSelectA,
  onSelectB,
  onSwap,
}: AlternateMixDropzonesProps) {
  const handleDrop = (e: React.DragEvent, handler: (f: File) => void) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handler(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* Document A */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, onSelectA)}
          className={`p-5 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
            fileA ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card"
          }`}
        >
          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
            <FileText className="size-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
            Document A (First / Odd)
          </span>
          {fileA ? (
            <div className="mt-1">
              <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">{fileA.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pageCountA} pages</p>
            </div>
          ) : (
            <label className="cursor-pointer text-xs text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted">
              <Upload className="size-3.5" /> Choose File A
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onSelectA(e.target.files[0])}
              />
            </label>
          )}
        </div>

        {/* Document B */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, onSelectB)}
          className={`p-5 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
            fileB ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card"
          }`}
        >
          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
            <FileText className="size-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
            Document B (Second / Even)
          </span>
          {fileB ? (
            <div className="mt-1">
              <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">{fileB.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pageCountB} pages</p>
            </div>
          ) : (
            <label className="cursor-pointer text-xs text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted">
              <Upload className="size-3.5" /> Choose File B
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onSelectB(e.target.files[0])}
              />
            </label>
          )}
        </div>
      </div>

      {fileA && fileB && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onSwap}
            className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card shadow-sm transition-all"
          >
            <ArrowLeftRight className="size-3.5" /> Swap Document A and B
          </button>
        </div>
      )}
    </div>
  );
}
