"use client";

import React from "react";
import { DashboardHero } from "./dashboard-hero";
import { DashboardStarredRecent } from "./dashboard-starred-recent";
import { DashboardCategoriesGrid } from "./dashboard-categories-grid";
import { useToolPreferences } from "@/components/tool-shell/use-tool-preferences";

export function ToolDashboardView() {
  const { starredIds, recentIds, clearRecent } = useToolPreferences();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <DashboardHero />

      <DashboardStarredRecent
        starredIds={starredIds}
        recentIds={recentIds}
        onClearRecent={clearRecent}
      />

      <DashboardCategoriesGrid />
    </div>
  );
}
