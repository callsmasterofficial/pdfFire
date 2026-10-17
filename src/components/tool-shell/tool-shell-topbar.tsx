"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, ChevronRight, Home, PanelLeftClose, PanelLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { TOOL_ITEMS } from "@/lib/tools-data";

interface ToolShellTopbarProps {
  onOpenMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ToolShellTopbar({
  onOpenMobileSidebar,
  isSidebarCollapsed,
  onToggleCollapse,
}: ToolShellTopbarProps) {
  const pathname = usePathname();
  const activeTool = TOOL_ITEMS.find((t) => pathname === `/tool/${t.id}`);

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/90 backdrop-blur-md px-4 flex items-center justify-between gap-4 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted max-md:inline-flex hidden"
          aria-label="Open tool navigation"
        >
          <Menu className="size-4" />
        </button>

        {/* Desktop sidebar toggle button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="max-md:hidden inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>

        {/* Desktop breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            title="PDFfire Home"
          >
            <Home className="size-3.5" />
            <span className="hidden sm:inline">PDFfire</span>
          </Link>
          <ChevronRight className="size-3 text-muted-foreground/60" />
          <Link
            href="/tool"
            className={`hover:text-foreground transition-colors ${
              pathname === "/tool" ? "text-foreground font-semibold" : ""
            }`}
          >
            Studio
          </Link>
          {activeTool && (
            <>
              <ChevronRight className="size-3 text-muted-foreground/60" />
              <span className="text-foreground font-semibold truncate max-w-[160px] sm:max-w-none">
                {activeTool.title}
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success/10 border border-success/30 text-success">
          <ShieldCheck className="size-3" />
          <span>Local Engine</span>
        </div>
        <PwaInstallButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
