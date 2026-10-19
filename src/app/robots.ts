import type { MetadataRoute } from "next";
import { getSiteUrl } from "../lib/seo/site-config";

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
