import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/home/hero-section";
import { HomePreviewSection } from "@/components/home/home-preview-section";
import { ToolsDirectory } from "@/components/home/tools-directory";
import { JsonLd } from "@/components/seo/json-ld";
import { generateWebSiteSchema, generateOrganizationSchema } from "@/lib/seo/schema-generators";
import { getCanonicalUrl, SITE_CONFIG } from "@/lib/seo/site-config";

export const metadata: Metadata = {
  title: SITE_CONFIG.defaultTitle,
  description: SITE_CONFIG.defaultDescription,
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
};

export default function Home() {
  const websiteSchema = generateWebSiteSchema();
  const orgSchema = generateOrganizationSchema();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd data={websiteSchema} />
      <JsonLd data={orgSchema} />
      <Header />
      <main className="flex-1 flex flex-col items-center">
        <HeroSection />
        <HomePreviewSection />
        <ToolsDirectory />
      </main>
      <Footer />
    </div>
  );
}
