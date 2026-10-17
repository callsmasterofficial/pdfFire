import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";

export function Header() {
  return (
    <>
      <OfflineIndicator />
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-xs transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-lg text-foreground hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/pdffire-mark-light.svg"
              alt="PDFfire Logo"
              width={32}
              height={32}
              className="size-8 rounded-lg shrink-0 dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="PDFfire Logo"
              width={32}
              height={32}
              className="size-8 rounded-lg shadow-xs shrink-0 hidden dark:block"
            />
            <span className="tracking-tight text-foreground font-extrabold text-xl">
              PDF<span className="text-primary">fire</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 py-1 text-xs border-success/40 bg-success/10 text-success">
              <ShieldCheck className="size-3.5" />
              <span>100% Client-Side • Offline Capable</span>
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground mr-1">
              <Link
                href="/tool"
                className="hover:text-foreground transition-colors hidden sm:inline-block"
              >
                Studio
              </Link>
              <Link
                href="/#tools"
                className="hover:text-foreground transition-colors hidden sm:inline-block"
              >
                Tools
              </Link>
              <Link
                href="/#workspace"
                className="hover:text-foreground transition-colors hidden sm:inline-block"
              >
                Workspace
              </Link>
            </nav>
            <PwaInstallButton />
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
