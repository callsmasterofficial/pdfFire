import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck, Cpu, Lock, ArrowRight, Zap } from "lucide-react";
import { getCanonicalUrl } from "@/lib/seo/site-config";

export const metadata: Metadata = {
  title: "About FileMelo — Privacy-First Client-Side PDF Toolkit",
  description:
    "Learn about FileMelo's architecture. Process PDFs locally in your browser with zero server uploads, complete privacy, and high performance.",
  alternates: {
    canonical: getCanonicalUrl("/about"),
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-16 w-full">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <span>About FileMelo</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            PDF tools designed with <span className="text-primary">privacy by architecture.</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            FileMelo is a modern browser-based document utility suite. Unlike traditional cloud converters, your documents never leave your computer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          <div className="p-5 rounded-2xl border border-border bg-surface shadow-2xs">
            <Cpu className="size-6 text-primary mb-3" />
            <h2 className="text-base font-bold text-foreground mb-1.5">Zero Server Uploads</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every operation — from merging and compression to OCR and redaction — runs directly in your device’s browser memory via WebAssembly and Web Workers.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-surface shadow-2xs">
            <Lock className="size-6 text-success mb-3" />
            <h2 className="text-base font-bold text-foreground mb-1.5">Guaranteed Confidentiality</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We do not operate backend servers that process or store your files. No databases, no cloud caches, and no remote document tracking.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-surface shadow-2xs">
            <Zap className="size-6 text-accent mb-3" />
            <h2 className="text-base font-bold text-foreground mb-1.5">Instant Execution</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              By eliminating slow network upload and download queues, operations execute at the native speed of your device’s processor.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-surface shadow-2xs">
            <ShieldCheck className="size-6 text-primary mb-3" />
            <h2 className="text-base font-bold text-foreground mb-1.5">Offline Capable (PWA)</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              FileMelo is installable as a Progressive Web App. Once assets are cached, core tools function even without an active internet connection.
            </p>
          </div>
        </div>

        <section className="space-y-6 text-sm text-muted-foreground border-t border-border pt-8 mb-12">
          <h2 className="text-xl font-bold text-foreground">Why We Built FileMelo</h2>
          <p className="leading-relaxed">
            Most online PDF tools upload your sensitive tax documents, contracts, medical records, and legal files to unknown remote servers. Even when servers promise to delete files, transmitting confidential records over the internet exposes users to interception, data breaches, and unauthorized retention.
          </p>
          <p className="leading-relaxed">
            Modern web standards — specifically WebAssembly, HTML5 Canvas, and modern JavaScript engines — have made it entirely possible to manipulate, render, and compile PDF files directly inside the client browser. FileMelo was built to prove that document productivity can be fast, powerful, and completely private without compromise.
          </p>
        </section>

        <div className="p-6 rounded-2xl border border-border bg-surface-secondary/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ready to get started?</h3>
            <p className="text-xs text-muted-foreground">Explore 37 free, privacy-first PDF tools.</p>
          </div>
          <Link
            href="/tool"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover transition-colors"
          >
            <span>Open Tool Studio</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
