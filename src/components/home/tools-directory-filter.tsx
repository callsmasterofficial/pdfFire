import React, { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { TOOL_CATEGORIES } from "@/lib/tools-data";

interface ToolsDirectoryFilterProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryCounts: Record<string, number>;
}

export function ToolsDirectoryFilter({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  categoryCounts,
}: ToolsDirectoryFilterProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        if (
          !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")
        ) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-4 mb-6">
      {/* Top search & quick controls row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md" suppressHydrationWarning>
          <div
            className="absolute top-1/2 left-0 flex items-center -translate-y-1/2 pointer-events-none select-none"
            style={{ paddingLeft: "0.875rem" }}
          >
            <Search
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tools... (e.g. merge, compress, protect)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search tools"
            style={{ paddingLeft: "2.35rem", paddingRight: "3.5rem" }}
            className="w-full h-10 rounded-xl border border-border bg-card/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all shadow-2xs"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/80 transition-colors cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/80 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                /
              </kbd>
            </div>
          )}
        </div>

        {activeCategory !== "All" && (
          <button
            type="button"
            onClick={() => onSelectCategory("All")}
            className="text-xs text-primary hover:underline font-medium self-end sm:self-center"
          >
            Reset to All Categories
          </button>
        )}
      </div>

      {/* Category Pills with Count Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {TOOL_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat] || 0;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all select-none cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold ring-1 ring-primary/20 scale-[1.02]"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
