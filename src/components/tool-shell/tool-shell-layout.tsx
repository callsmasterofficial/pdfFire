"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ToolSidebar } from "./tool-sidebar";
import { ToolShellTopbar } from "./tool-shell-topbar";
import { useToolPreferences } from "./use-tool-preferences";
import { TOOL_ITEMS } from "@/lib/tools-data";

interface ToolShellLayoutProps {
  children: React.ReactNode;
}

export function ToolShellLayout({ children }: ToolShellLayoutProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { recordRecent } = useToolPreferences();

  // Record tool as recent whenever pathname matches a known tool
  useEffect(() => {
    const currentTool = TOOL_ITEMS.find((t) => pathname === `/tool/${t.id}`);
    if (currentTool) {
      recordRecent(currentTool.id);
    }
  }, [pathname, recordRecent]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Desktop Sticky Sidebar */}
      <div className="max-md:hidden h-full shrink-0">
        <ToolSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="w-72 h-full bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ToolSidebar onCloseMobile={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ToolShellTopbar
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          isSidebarCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
