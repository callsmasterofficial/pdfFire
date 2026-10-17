"use client";

import React from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

interface ToolSidebarHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCloseMobile?: () => void;
}

export function ToolSidebarHeader({
  searchQuery,
  onSearchChange,
  onCloseMobile,
}: ToolSidebarHeaderProps) {
  return (
    <div className="p-3.5 border-b border-border space-y-3">
      {/* Brand logo & mobile close */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/pdffire-mark-light.svg"
            alt="PDFfire Logo"
            width={26}
            height={26}
            className="size-6.5 rounded-md shrink-0 dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt="PDFfire Logo"
            width={26}
            height={26}
            className="size-6.5 rounded-md shadow-xs shrink-0 hidden dark:block"
          />
          <span className="font-extrabold text-base tracking-tight text-foreground">
            PDF<span className="text-primary">fire</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground ml-0.5">
            studio
          </span>
        </Link>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted md:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Quick search input */}
      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 flex items-center pointer-events-none select-none"
          style={{ paddingLeft: "0.75rem" }}
        >
          <Search className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search tools in sidebar"
          style={{ paddingLeft: "2.1rem", paddingRight: "1.75rem" }}
          className="w-full h-8 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}
