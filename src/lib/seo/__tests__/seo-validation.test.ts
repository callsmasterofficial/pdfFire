import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { getAllToolSeoData, getToolSeoData, getRelatedTools } from "../tools-seo-data";
import { getSiteUrl, getCanonicalUrl } from "../site-config";
import generateSitemap from "../../../app/sitemap";
import generateRobots from "../../../app/robots";
import {
  generateWebSiteSchema,
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateBreadcrumbSchema,
  generateFaqSchema,
} from "../schema-generators";

describe("Automated SEO Validation Suite", () => {
  const tools = getAllToolSeoData();

  it("verifies all 34 tools have unique titles, descriptions, and H1s", () => {
    expect(tools.length).toBe(34);

    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const canonicals = new Set<string>();

    for (const tool of tools) {
      expect(tool.id).toBeTruthy();
      expect(tool.title.trim().length).toBeGreaterThan(15);
      expect(tool.metaDescription.trim().length).toBeGreaterThan(30);
      expect(tool.h1.trim().length).toBeGreaterThan(5);

      expect(titles.has(tool.title)).toBe(false);
      titles.add(tool.title);

      expect(descriptions.has(tool.metaDescription)).toBe(false);
      descriptions.add(tool.metaDescription);

      const canonical = getCanonicalUrl(`/tool/${tool.id}`);
      expect(canonicals.has(canonical)).toBe(false);
      canonicals.add(canonical);

      expect(tool.instructions.length).toBeGreaterThanOrEqual(3);
      expect(tool.features.length).toBeGreaterThanOrEqual(2);
      expect(tool.limitations.length).toBeGreaterThanOrEqual(1);
      expect(tool.faqs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("verifies related tool references do not have broken links", () => {
    for (const tool of tools) {
      const related = getRelatedTools(tool.id);
      expect(related.length).toBeGreaterThanOrEqual(2);
      for (const rel of related) {
        expect(getToolSeoData(rel.id)).toBeDefined();
      }
    }
  });

  it("verifies canonical URLs are well-formed and do not point to localhost in default config", () => {
    const rootCanonical = getCanonicalUrl("/");
    expect(rootCanonical).toBe("https://pdffire.com/");
    expect(rootCanonical.includes("localhost")).toBe(false);

    const toolCanonical = getCanonicalUrl("/tool/merge");
    expect(toolCanonical).toBe("https://pdffire.com/tool/merge");
  });

  it("verifies sitemap generates eligible, unique, and valid public URLs", () => {
    const sitemapEntries = generateSitemap();
    expect(sitemapEntries.length).toBe(39); // 1 home + 1 tool studio + 34 tools + 3 trust

    const seenUrls = new Set<string>();
    for (const entry of sitemapEntries) {
      expect(entry.url.startsWith("https://pdffire.com")).toBe(true);
      expect(seenUrls.has(entry.url)).toBe(false);
      seenUrls.add(entry.url);
      expect(entry.priority).toBeDefined();
      expect(entry.changeFrequency).toBeDefined();
    }
  });

  it("verifies robots.txt allows public routes and points to sitemap", () => {
    const robots = generateRobots();
    expect(robots.sitemap).toBe("https://pdffire.com/sitemap.xml");
    const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    expect(rules.allow).toBe("/");
    expect(rules.userAgent).toBe("*");
  });

  it("verifies schema.org JSON-LD generators produce valid structured data", () => {
    const siteSchema = generateWebSiteSchema();
    expect(siteSchema["@type"]).toBe("WebSite");
    expect(siteSchema.url).toBe(getSiteUrl());

    const orgSchema = generateOrganizationSchema();
    expect(orgSchema["@type"]).toBe("Organization");

    const mergeTool = getToolSeoData("merge")!;
    const appSchema = generateSoftwareApplicationSchema(mergeTool);
    expect(appSchema["@type"]).toBe("SoftwareApplication");
    expect(appSchema.name).toContain("Merge PDF");

    const breadcrumbs = generateBreadcrumbSchema([
      { name: "Tools", path: "/tool" },
      { name: "Merge PDF", path: "/tool/merge" },
    ]);
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbs.itemListElement.length).toBe(2);

    const faqSchema = generateFaqSchema(mergeTool.faqs);
    expect(faqSchema?.["@type"]).toBe("FAQPage");
    expect(faqSchema?.mainEntity.length).toBe(mergeTool.faqs.length);
  });

  it("verifies critical branding and Open Graph assets exist on disk", () => {
    const publicDir = path.resolve(process.cwd(), "public");
    const requiredFiles = [
      "brand/pdffire-og.png",
      "brand/pdffire-mark-light.svg",
      "brand/pdffire-mark-dark.svg",
      "icon.svg",
      "icons/icon-512.png",
      "icons/favicon.ico",
      "manifest.json",
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(publicDir, file);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });
});
