"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TOOL_ITEMS, TOOL_CATEGORIES } from "@/lib/tools-data";

export function DashboardCategoriesGrid() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Explore Categories</h2>
          <p className="text-xs text-muted-foreground">
            Browse all specialized client-side document processing toolsets.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {TOOL_CATEGORIES.map((category) => {
          const tools = TOOL_ITEMS.filter((t) => t.category === category);
          if (tools.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{category}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                    {tools.length} {tools.length === 1 ? "tool" : "tools"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.id}
                      href={`/tool/${tool.id}`}
                      className="group flex flex-col justify-between p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-xs transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Icon className="size-4" />
                          </div>
                          {tool.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
                              {tool.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                            <span>{tool.title}</span>
                            <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 text-[10px] font-medium text-primary flex items-center gap-1 group-hover:underline">
                        <span>Launch Tool</span>
                        <span>→</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
