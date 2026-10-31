import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShieldCheck, CheckCircle2, Lock, EyeOff } from "lucide-react";
import { getCanonicalUrl } from "@/lib/seo/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy — Zero Server Uploads Architectural Guarantee",
  description:
    "Read FileMelo's Privacy Policy. 100% in-browser processing with zero document uploads, zero remote tracking, and complete user confidentiality.",
  alternates: {
    canonical: getCanonicalUrl("/privacy"),
  },
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-16 w-full">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold mb-3">
            <ShieldCheck className="size-3.5" />
            <span>Architecture Guarantee</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy & Data Handling
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective Date: October 19, 2026 • FileMelo Architectural Specification
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-success/30 bg-success/5 mb-8">
          <h2 className="text-sm font-bold text-success flex items-center gap-2 mb-1.5">
            <Lock className="size-4" />
            <span>Core Privacy Principle: Zero Document Uploads</span>
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When you use FileMelo to merge, split, compress, edit, convert, or protect PDF files, your documents remain strictly on your local computer or phone. FileMelo does not operate document processing servers, cloud storage buckets, or remote file analysis endpoints.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <span>1. How Your Files Are Processed</span>
            </h2>
            <p className="leading-relaxed">
              All PDF manipulations are executed directly inside your web browser using client-side JavaScript, WebAssembly binaries, and Web Workers. When you drag and drop a file, it is loaded into your browser’s temporary volatile RAM memory and released immediately when your session closes or when you reset the workspace.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <EyeOff className="size-4 text-primary" />
              <span>2. Local Storage & Client Cookies</span>
            </h2>
            <p className="leading-relaxed">
              FileMelo does not track you across the internet or use tracking cookies. We utilize browser <code>localStorage</code> strictly for non-sensitive interface preferences:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2 text-xs">
              <li>Theme preference (Paper light theme vs. Charcoal dark theme)</li>
              <li>Tool preferences (your starred favorite tools and recent tool list)</li>
            </ul>
            <p className="leading-relaxed mt-1">
              Your document contents, file names, and byte buffers are <strong>never stored</strong> in persistent browser databases or transmitted to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <span>3. AI & Natural Language Processing</span>
            </h2>
            <p className="leading-relaxed">
              Unlike cloud services that transmit your document text to OpenAI or external cloud LLMs, FileMelo’s summarization (TextRank) and Q&A (BM25) tools run 100% on-device using local algorithms. Zero words or passages are ever transmitted across a network.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <span>4. Technical Inquiries & Contact</span>
            </h2>
            <p className="leading-relaxed">
              If you have questions regarding FileMelo’s client-side security architecture or wish to review the open implementation, you can inspect network activity via your browser’s Developer Tools Network Tab to independently verify that zero document packets leave your device.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
