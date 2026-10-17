"use client";

import React from "react";
import { ShieldCheck, PanelLeftClose, PanelLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface ToolSidebarFooterProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ToolSidebarFooter({
  isCollapsed,
  onToggleCollapse,
}: ToolSidebarFooterProps) {
  return (
    <div className="p-3 border-t border-border bg-card/40 space-y-2 text-xs">
      {/* Privacy guarantee badge */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-success/10 border border-success/30 text-success text-[11px] font-medium">
        <ShieldCheck className="size-3.5 shrink-0" />
        <span className="truncate">Privacy by Architecture</span>
      </div>

      {/* Quick utilities row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <span className="text-[11px] text-muted-foreground font-mono">v1.0</span>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
