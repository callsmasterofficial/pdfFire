import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolViewRenderer } from "./tool-view-renderer";
import { getToolSeoData, getRelatedTools, getAllToolSeoData } from "@/lib/seo/tools-seo-data";
import { getCanonicalUrl, SITE_CONFIG } from "@/lib/seo/site-config";
import {
  generateSoftwareApplicationSchema,
  generateBreadcrumbSchema,
  generateFaqSchema,
} from "@/lib/seo/schema-generators";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolBreadcrumbs } from "@/components/seo/tool-breadcrumbs";
import { ToolGuideSection } from "@/components/seo/tool-guide-section";
import { ToolFaqSection } from "@/components/seo/tool-faq-section";
import { ToolRelatedSection } from "@/components/seo/tool-related-section";

interface ToolPageProps {
  params: Promise<{ toolId: string }>;
}

export function generateStaticParams() {
  return getAllToolSeoData().map((tool) => ({ toolId: tool.id }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { toolId } = await params;
  const seo = getToolSeoData(toolId);
  if (!seo) {
    return {
      title: "Tool Not Found",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = getCanonicalUrl(`/tool/${seo.id}`);
  return {
    title: seo.title,
    description: seo.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${seo.h1} — ${SITE_CONFIG.name}`,
      description: seo.metaDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      type: "website",
      images: [
        {
          url: "/brand/pdffire-og.png",
          width: 1200,
          height: 630,
          alt: `${seo.h1} — ${SITE_CONFIG.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${seo.h1} — ${SITE_CONFIG.name}`,
      description: seo.metaDescription,
      images: ["/brand/pdffire-og.png"],
    },
  };
}

function ToolLoadingFallback() {
  return (
    <div className="w-full flex-1 flex flex-col items-center py-4 sm:py-6 px-3 sm:px-6">
      <div className="w-full max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-muted-foreground font-mono">Loading tool...</p>
      </div>
    </div>
  );
}

async function ToolPageContent({ params }: ToolPageProps) {
  const { toolId } = await params;
  const seo = getToolSeoData(toolId);

  if (!seo) {
    notFound();
  }

  const softwareSchema = generateSoftwareApplicationSchema(seo);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Tools", path: "/tool" },
    { name: seo.h1, path: `/tool/${seo.id}` },
  ]);
  const faqSchema = generateFaqSchema(seo.faqs);
  const relatedTools = getRelatedTools(toolId);

  return (
    <div className="w-full flex-1 flex flex-col items-center py-4 sm:py-6 px-3 sm:px-6">
      <JsonLd data={softwareSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <div className="w-full max-w-5xl mx-auto">
        <ToolBreadcrumbs
          items={[
            { name: "Tools", path: "/tool" },
            { name: seo.h1, path: `/tool/${seo.id}` },
          ]}
        />

        <ToolViewRenderer toolId={toolId} />

        <ToolGuideSection tool={seo} />
        <ToolFaqSection faqs={seo.faqs} toolH1={seo.h1} />
        <ToolRelatedSection relatedTools={relatedTools} />
      </div>
    </div>
  );
}

export default function ToolPage({ params }: ToolPageProps) {
  return (
    <Suspense fallback={<ToolLoadingFallback />}>
      <ToolPageContent params={params} />
    </Suspense>
  );
}
