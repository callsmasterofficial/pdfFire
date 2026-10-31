import type { MetadataRoute } from "next";
import { getSiteUrl } from "../lib/seo/site-config";

// Emitted at build time: the site is a static export, so these have no
// request-time behaviour to fall back on.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/_next/",
          "/pdf.worker.min.mjs",
          "/pdfjs/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
