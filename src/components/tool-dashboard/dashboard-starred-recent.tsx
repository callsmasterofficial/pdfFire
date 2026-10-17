"use client";

import React from "react";
import Link from "next/link";
import { Star, Clock, ArrowRight, Trash2 } from "lucide-react";
import { TOOL_ITEMS, ToolItem } from "@/lib/tools-data";

interface DashboardStarredRecentProps {
  starredIds: string[];
  recentIds: string[];
  onClearRecent: () => void;
}

export function DashboardStarredRecent({
  starredIds,
  recentIds,
  onClearRecent,
}: DashboardStarredRecentProps) {
  const starredTools = TOOL_ITEMS.filter((t) => starredIds.includes(t.id));
  const recentTools = recentIds
    .map((id) => TOOL_ITEMS.find((t) => t.id === id))
    .filter((t): t is ToolItem => !!t);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Starred Tools Card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500">
              <Star className="size-4 fill-amber-500" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Starred Tools</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {starredTools.length} saved
          </span>
        </div>

        {starredTools.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-xl bg-muted/30 border border-dashed border-border/80 text-xs text-muted-foreground">
            <Star className="size-5 mx-auto mb-1.5 text-muted-foreground/40" />
            <p>No starred tools yet.</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Hover over any tool in the sidebar and click the star icon to pin your favorites.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {starredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.id}
                  href={`/tool/${tool.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-muted/40 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="size-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">
                      {tool.title}
                    </span>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Tools Card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
              <Clock className="size-4" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Recent Tools</h2>
          </div>
          {recentTools.length > 0 && (
            <button
              type="button"
              onClick={onClearRecent}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {recentTools.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-xl bg-muted/30 border border-dashed border-border/80 text-xs text-muted-foreground">
            <Clock className="size-5 mx-auto mb-1.5 text-muted-foreground/40" />
            <p>No recent activity yet.</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Tools you open will automatically appear here for rapid 1-click access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.id}
                  href={`/tool/${tool.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-muted/40 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="size-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">
                      {tool.title}
                    </span>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
