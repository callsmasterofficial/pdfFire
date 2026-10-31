import { getSiteUrl, getCanonicalUrl, SITE_CONFIG } from "./site-config";
import { ToolSeoData, ToolFaq } from "./types";

export function generateWebSiteSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    alternateName: "FileMelo Toolkit",
    url: siteUrl,
    description: SITE_CONFIG.defaultDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/tool?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateOrganizationSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: siteUrl,
    logo: `${siteUrl}/icons/icon-512.png`,
    sameAs: [],
  };
}

export function generateSoftwareApplicationSchema(tool: ToolSeoData) {
  const toolUrl = getCanonicalUrl(`/tool/${tool.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.h1} — ${SITE_CONFIG.name}`,
    headline: tool.title,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (Web Browser)",
    url: toolUrl,
    description: tool.metaDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: tool.features,
    browserRequirements: "Requires WebAssembly & HTML5 Canvas support",
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

export function generateFaqSchema(faqs: ToolFaq[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
