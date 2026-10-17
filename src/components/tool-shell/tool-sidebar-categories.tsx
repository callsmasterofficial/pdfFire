"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { TOOL_ITEMS, TOOL_CATEGORIES, ToolItem } from "@/lib/tools-data";

interface ToolSidebarCategoriesProps {
  searchQuery: string;
  starredIds: string[];
  onToggleStar: (id: string) => void;
  onLinkClick?: () => void;
}

export function ToolSidebarCategories({
  searchQuery,
  starredIds,
  onToggleStar,
  onLinkClick,
}: ToolSidebarCategoriesProps) {
  const pathname = usePathname();
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    Organize: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredToolsByCategory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result: Record<string, ToolItem[]> = {};

    for (const cat of TOOL_CATEGORIES) {
      const items = TOOL_ITEMS.filter((tool) => {
        const matchesCat = tool.category === cat;
        if (!matchesCat) return false;
        if (!query) return true;
        return (
          tool.title.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query)
        );
      });
      if (items.length > 0) result[cat] = items;
    }
    return result;
  }, [searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin">
      <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        Tools Catalog
      </div>

      {Object.entries(filteredToolsByCategory).map(([category, tools]) => {
        const isExpanded = searchQuery.trim() ? true : !!expandedCats[category];

        return (
          <div key={category} className="space-y-0.5">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground/90 hover:bg-muted/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5">
                {isExpanded ? (
                  <ChevronDown className="size-3.5 text-muted-foreground transition-transform" />
                ) : (
                  <ChevronRight className="size-3.5 text-muted-foreground transition-transform" />
                )}
                <span>{category}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
                {tools.length}
              </span>
            </button>

            {isExpanded && (
              <div className="pl-4 pr-1 py-0.5 space-y-0.5 border-l border-border/60 ml-3">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const toolHref = `/tool/${tool.id}`;
                  const isActive = pathname === toolHref;
                  const isStarred = starredIds.includes(tool.id);

                  return (
                    <div
                      key={tool.id}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <Link
                        href={toolHref}
                        onClick={onLinkClick}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span className="truncate">{tool.title}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleStar(tool.id);
                        }}
                        className={`p-0.5 rounded-xs transition-opacity cursor-pointer ${
                          isStarred
                            ? "opacity-100 text-amber-500 fill-amber-500"
                            : "opacity-0 group-hover:opacity-100 hover:text-amber-500"
                        }`}
                        title={isStarred ? "Unstar tool" : "Star tool"}
                        aria-label={isStarred ? `Unstar ${tool.title}` : `Star ${tool.title}`}
                      >
                        <Star className={`size-3 ${isStarred ? "fill-amber-500" : ""}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
