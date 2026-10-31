import React from "react";
import Link from "next/link";
import { Cpu, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface-secondary/40 py-12 transition-colors mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/filemelo-mark-light.svg"
                alt="FileMelo Logo"
                width={20}
                height={20}
                className="size-5 shrink-0 dark:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.svg"
                alt="FileMelo Logo"
                width={20}
                height={20}
                className="size-5 rounded-md shadow-xs shrink-0 hidden dark:block"
              />
              <span className="font-extrabold text-base">FileMelo</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Convert. Create. Simplify. Fast, private in-browser document processing with zero server uploads.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-success">
              <ShieldCheck className="size-3.5" />
              <span>100% Client-Side Privacy</span>
            </div>
          </div>

          {/* Popular Tools Column */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
              Popular Tools
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/tool/merge" prefetch={false} className="hover:text-primary transition-colors">
                  Merge PDF
                </Link>
              </li>
              <li>
                <Link href="/tool/split" prefetch={false} className="hover:text-primary transition-colors">
                  Split PDF
                </Link>
              </li>
              <li>
                <Link href="/tool/compress" prefetch={false} className="hover:text-primary transition-colors">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link href="/tool/pdf-to-img" prefetch={false} className="hover:text-primary transition-colors">
                  PDF to Images
                </Link>
              </li>
              <li>
                <Link href="/tool/sign" prefetch={false} className="hover:text-primary transition-colors">
                  Sign PDF
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Convert Column */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
              Convert & Security
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/tool/img-to-pdf" prefetch={false} className="hover:text-primary transition-colors">
                  Images to PDF
                </Link>
              </li>
              <li>
                <Link href="/tool/redact" prefetch={false} className="hover:text-primary transition-colors">
                  Redact PDF
                </Link>
              </li>
              <li>
                <Link href="/tool/protect" prefetch={false} className="hover:text-primary transition-colors">
                  Protect PDF
                </Link>
              </li>
              <li>
                <Link href="/tool/ocr" prefetch={false} className="hover:text-primary transition-colors">
                  OCR Scanned PDF
                </Link>
              </li>
              <li>
                <Link href="/tool/markdown-to-pdf" prefetch={false} className="hover:text-primary transition-colors">
                  Markdown to PDF
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Trust Column */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
              Platform & Trust
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/tool" className="hover:text-primary transition-colors">
                  Tool Studio (All 37 Tools)
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Architecture
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 FileMelo. Free, open, and private document productivity.</p>
          <div className="flex items-center gap-2">
            <Cpu className="size-3.5 text-primary" />
            <span>Local In-Memory WebAssembly Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
