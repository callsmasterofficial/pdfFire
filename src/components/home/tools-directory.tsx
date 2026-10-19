"use client";

import React, { useState, useMemo } from "react";
import { ToolCard } from "./tool-card";
import { ToolsDirectoryHeader } from "./tools-directory-header";
import { ToolsDirectoryFilter } from "./tools-directory-filter";
import { ToolsDirectoryEmpty } from "./tools-directory-empty";
import { TOOL_ITEMS } from "@/lib/tools-data";

export function ToolsDirectory() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: TOOL_ITEMS.length };
    for (const tool of TOOL_ITEMS) {
      counts[tool.category] = (counts[tool.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return TOOL_ITEMS.filter((tool) => {
      const matchesCategory =
        activeCategory === "All" || tool.category === activeCategory;
      const matchesSearch =
        !query ||
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleResetFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
  };

  return (
    <section
      id="tools"
      suppressHydrationWarning
      className="w-full max-w-7xl mx-auto px-4 pb-24 sm:pb-32 mb-20 sm:mb-24 scroll-mt-20"
    >
      <ToolsDirectoryHeader
        totalCount={TOOL_ITEMS.length}
        filteredCount={filteredTools.length}
        activeCategory={activeCategory}
        hasActiveFilter={
          activeCategory !== "All" || searchQuery.trim().length > 0
        }
      />

      <ToolsDirectoryFilter
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryCounts={categoryCounts}
      />

      {filteredTools.length === 0 ? (
        <ToolsDirectoryEmpty
          searchQuery={searchQuery}
          activeCategory={activeCategory}
          onReset={handleResetFilters}
        />
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          suppressHydrationWarning
        >
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} {...tool} />
          ))}
        </div>
      )}
    </section>
  );
}
