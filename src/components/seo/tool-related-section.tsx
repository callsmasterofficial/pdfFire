import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ToolSeoData } from "@/lib/seo/types";

interface ToolRelatedSectionProps {
  relatedTools: ToolSeoData[];
}

export function ToolRelatedSection({ relatedTools }: ToolRelatedSectionProps) {
  if (!relatedTools || relatedTools.length === 0) return null;

  return (
    <section className="w-full mt-10 pt-8 border-t border-border">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Related PDF Tools
          </h2>
        </div>
        <Link
          href="/tool"
          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          <span>View all tools</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {relatedTools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tool/${tool.id}`}
            className="group p-4 rounded-xl border border-border bg-surface hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                {tool.category}
              </span>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {tool.h1}
              </h3>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                {tool.metaDescription}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-primary font-medium">
              <span>Open Tool</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
