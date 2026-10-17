import React from "react";
import { SearchX, RotateCcw } from "lucide-react";

interface ToolsDirectoryEmptyProps {
  searchQuery: string;
  activeCategory: string;
  onReset: () => void;
}

export function ToolsDirectoryEmpty({
  searchQuery,
  activeCategory,
  onReset,
}: ToolsDirectoryEmptyProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center max-w-lg mx-auto my-8 space-y-4">
      <div className="size-12 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
        <SearchX className="size-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">No matching PDF tools found</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          {searchQuery
            ? `No results found for "${searchQuery}" in ${activeCategory === "All" ? "any category" : activeCategory}.`
            : `No tools currently in ${activeCategory}.`}
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground text-xs font-medium transition-colors cursor-pointer"
      >
        <RotateCcw className="size-3.5" />
        <span>Reset Filters & Show All</span>
      </button>
    </div>
  );
}
