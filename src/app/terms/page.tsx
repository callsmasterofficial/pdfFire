import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FileText, CheckCircle2 } from "lucide-react";
import { getCanonicalUrl } from "@/lib/seo/site-config";

export const metadata: Metadata = {
  title: "Terms of Service — FileMelo Browser Productivity Tools",
  description:
    "Read FileMelo's Terms of Service. Usage terms, client-side disclaimer, and open source licensing information.",
  alternates: {
    canonical: getCanonicalUrl("/terms"),
  },
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-16 w-full">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <FileText className="size-3.5" />
            <span>Usage Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective Date: October 19, 2026 • FileMelo Open Usage Terms
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <span>1. Acceptance of Terms</span>
            </h2>
            <p className="leading-relaxed">
              By accessing or using FileMelo, you agree to these Terms of Service. FileMelo provides browser-based document productivity utilities operating strictly on your device.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <span>2. Local Processing & User Responsibility</span>
            </h2>
            <p className="leading-relaxed">
              Because all document conversions, edits, and cryptographic operations occur locally on your hardware, you are solely responsible for backing up original files before performing destructive operations such as page deletions, redactions, or password encryption.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <span>3. Disclaimer of Warranties</span>
            </h2>
            <p className="leading-relaxed">
              FileMelo is provided &ldquo;as is&rdquo; without warranty of any kind, express or implied. While we employ rigorous quality assurance and testing across standard PDF specifications, complex third-party proprietary PDF extensions, corrupted files, or severe device memory constraints may affect processing outcomes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <span>4. Lawful Use & Prohibited Activities</span>
            </h2>
            <p className="leading-relaxed">
              You agree not to use FileMelo for unlawful purposes, including unauthorized decryption of documents you do not have permission to access, or attempting to compromise the integrity of the application.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <span>5. Open Source & Third-Party Attribution</span>
            </h2>
            <p className="leading-relaxed">
              FileMelo is built upon established open-source technologies including pdf-lib, PDF.js, and Tesseract.js. All respective third-party licenses and intellectual property rights remain with their respective owners.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
