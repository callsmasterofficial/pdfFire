import React from "react";
import { Flame, Sparkles } from "lucide-react";

interface ToolsDirectoryHeaderProps {
  totalCount: number;
  filteredCount: number;
  activeCategory: string;
  hasActiveFilter: boolean;
}

export function ToolsDirectoryHeader({
  totalCount,
  filteredCount,
  activeCategory,
  hasActiveFilter,
}: ToolsDirectoryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-6 border-b border-border/60">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Flame className="size-3.5 fill-primary text-primary" />
          <span>{totalCount} Local PDF Utilities</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Toolkit Directory
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
          Engineered for speed and client-side privacy. Process documents in your browser with zero server uploads.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start md:self-end text-xs text-muted-foreground font-mono">
        <Sparkles className="size-3.5 text-primary" />
        <span>
          {hasActiveFilter
            ? `Showing ${filteredCount} of ${totalCount} tools${activeCategory !== "All" ? ` • ${activeCategory}` : ""}`
            : `${totalCount} tools available`}
        </span>
      </div>
    </div>
  );
}
