"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  category: string;
  children: React.ReactNode;
}

export function ToolLayout({
  title,
  description,
  icon: Icon,
  category,
  children,
}: ToolLayoutProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Navigation & Header */}
      <div className="mb-6">
        <Link href="/#tools">
          <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            <span>Back to Toolkit</span>
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-start gap-3.5">
            <div className="size-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  {category}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-[11px] font-medium text-primary">100% Client-Side</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                {title}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-muted-foreground shadow-2xs self-start sm:self-center">
            <ShieldCheck className="size-4 text-success shrink-0" />
            <span>Processed entirely in browser</span>
          </div>
        </div>
      </div>

      {/* Main Tool Content Container */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        {children}
      </div>
    </div>
  );
}
