"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Star, Clock } from "lucide-react";
import { usePathname } from "next/navigation";

interface ToolSidebarNavProps {
  starredCount: number;
  recentCount: number;
  onSelectNav?: (view: "dashboard" | "starred" | "recent") => void;
  activeNavView?: string;
  onLinkClick?: () => void;
}

export function ToolSidebarNav({
  starredCount,
  recentCount,
  onSelectNav,
  activeNavView,
  onLinkClick,
}: ToolSidebarNavProps) {
  const pathname = usePathname();
  const isDashboardActive = pathname === "/tool" && (!activeNavView || activeNavView === "dashboard");

  return (
    <div className="p-2 space-y-1 border-b border-border text-xs">
      {/* Dashboard Link */}
      <Link
        href="/tool"
        onClick={() => {
          onSelectNav?.("dashboard");
          onLinkClick?.();
        }}
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
          isDashboardActive
            ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
            : "text-foreground hover:bg-muted/70"
        }`}
      >
        <div className="flex items-center gap-2">
          <LayoutDashboard className="size-4 shrink-0" />
          <span>Dashboard</span>
        </div>
      </Link>

      {/* Recent Tools Jump */}
      <button
        type="button"
        onClick={() => {
          onSelectNav?.("recent");
          onLinkClick?.();
        }}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-left ${
          activeNavView === "recent"
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          <span>Recent tools</span>
        </div>
        {recentCount > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
            {recentCount}
          </span>
        )}
      </button>

      {/* Starred Tools Jump */}
      <button
        type="button"
        onClick={() => {
          onSelectNav?.("starred");
          onLinkClick?.();
        }}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-left ${
          activeNavView === "starred"
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <Star className="size-4 shrink-0 text-amber-500 fill-amber-500/30" />
          <span>Starred</span>
        </div>
        {starredCount > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">
            {starredCount}
          </span>
        )}
      </button>
    </div>
  );
}
