import type { MetadataRoute } from "next";
import { getCanonicalUrl } from "../lib/seo/site-config";
import { getAllToolSeoData } from "../lib/seo/tools-seo-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const tools = getAllToolSeoData();
  const releaseDate = new Date("2026-10-19T00:00:00.000Z");

  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: getCanonicalUrl("/"),
      lastModified: releaseDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: getCanonicalUrl("/tool"),
      lastModified: releaseDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: getCanonicalUrl("/about"),
      lastModified: releaseDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: getCanonicalUrl("/privacy"),
      lastModified: releaseDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getCanonicalUrl("/terms"),
      lastModified: releaseDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: getCanonicalUrl(`/tool/${tool.id}`),
    lastModified: releaseDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...coreRoutes, ...toolRoutes];
}
