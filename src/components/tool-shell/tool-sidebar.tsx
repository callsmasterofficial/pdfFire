"use client";

import React, { useState } from "react";
import { ToolSidebarHeader } from "./tool-sidebar-header";
import { ToolSidebarNav } from "./tool-sidebar-nav";
import { ToolSidebarCategories } from "./tool-sidebar-categories";
import { ToolSidebarFooter } from "./tool-sidebar-footer";
import { useToolPreferences } from "./use-tool-preferences";

interface ToolSidebarProps {
  onSelectNav?: (view: "dashboard" | "starred" | "recent") => void;
  activeNavView?: string;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ToolSidebar({
  onSelectNav,
  activeNavView,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}: ToolSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { starredIds, recentIds, toggleStar } = useToolPreferences();

  return (
    <aside
      className={`h-full flex flex-col bg-card/60 backdrop-blur-md border-r border-border transition-all duration-200 select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <ToolSidebarHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCloseMobile={onCloseMobile}
      />

      <ToolSidebarNav
        starredCount={starredIds.length}
        recentCount={recentIds.length}
        onSelectNav={onSelectNav}
        activeNavView={activeNavView}
        onLinkClick={onCloseMobile}
      />

      <ToolSidebarCategories
        searchQuery={searchQuery}
        starredIds={starredIds}
        onToggleStar={toggleStar}
        onLinkClick={onCloseMobile}
      />

      <ToolSidebarFooter
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </aside>
  );
}
