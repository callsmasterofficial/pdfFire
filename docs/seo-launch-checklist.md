# PDFfire — SEO Launch & Search Console Checklist

**Checklist Status:** Pre-Launch / Ready for Production  
**Target Domain:** `https://pdffire.com` (configurable via `NEXT_PUBLIC_SITE_URL`)  
**Scope:** Production Deployment, Domain Verification, Indexing, and Monitoring

---

## 1. Environment & Production Domain Configuration

- [ ] **Configure Production URL Environment Variable:**
  In your production hosting dashboard (e.g., Vercel, Cloudflare Pages, Netlify), add the following environment variable:
  ```env
  NEXT_PUBLIC_SITE_URL=https://pdffire.com
  ```
  *(Note: Never set this to `http://localhost:3000` or preview deployment URLs in production).*

- [ ] **Verify Canonical Base Resolution:**
  Confirm that canonical tags across all pages resolve with the production domain:
  - Homepage: `<link rel="canonical" href="https://pdffire.com/" />`
  - Tool Pages: `<link rel="canonical" href="https://pdffire.com/tool/merge" />`

---

## 2. Robots.txt & XML Sitemap Verification

- [ ] **Test Live `robots.txt` Endpoint:**
  Verify that `https://pdffire.com/robots.txt` returns HTTP 200 with:
  ```text
  User-Agent: *
  Allow: /
  Disallow: /_next/
  Disallow: /pdf.worker.min.mjs
  Disallow: /pdfjs/

  Sitemap: https://pdffire.com/sitemap.xml
  ```

- [ ] **Test Live XML Sitemap Endpoint:**
  Verify that `https://pdffire.com/sitemap.xml` returns valid XML containing:
  - Homepage (`/`)
  - Tool Studio (`/tool`)
  - All 34 public tool pages (`/tool/[id]`)
  - Trust pages (`/about`, `/privacy`, `/terms`)
  Confirm no 404s, redirects, or noindex URLs are present in the sitemap.

---

## 3. Google Search Console Setup

- [ ] **Add Domain Property in Search Console:**
  1. Open [Google Search Console](https://search.google.com/search-console).
  2. Add a new **Domain property** (e.g. `pdffire.com`).
  3. Copy the provided DNS `TXT` verification record into your domain DNS provider (Cloudflare, Namecheap, Route53, etc.).
  4. Wait for DNS propagation and click **Verify**.

- [ ] **Submit XML Sitemap:**
  1. In the left navigation, open **Sitemaps**.
  2. In "Add a new sitemap", enter: `sitemap.xml`.
  3. Click **Submit** and verify the status reports **Success**.

- [ ] **URL Inspection of Core Pages:**
  Inspect representative URLs using the Search Console URL Inspection Tool:
  - `https://pdffire.com/`
  - `https://pdffire.com/tool/merge`
  - `https://pdffire.com/tool/compress`
  - `https://pdffire.com/privacy`
  Confirm "Page is fetchable", "Indexed, not submitted in sitemap" or "Discovered", and valid structured data.

---

## 4. Bing Webmaster Tools Setup

- [ ] **Import from Google Search Console:**
  1. Open [Bing Webmaster Tools](https://www.bing.com/webmasters).
  2. Choose **Import from Google Search Console** for instant 1-click verification.
  3. Confirm sitemap URL `https://pdffire.com/sitemap.xml` is imported and active.

---

## 5. Structured Data (Schema.org) Validation

- [ ] **Test Homepage Schema:**
  Run `https://pdffire.com/` through the [Google Rich Results Test](https://search.google.com/test/rich-results) and [Schema.org Validator](https://validator.schema.org/).
  - Expected Schemas: `WebSite`, `Organization`.

- [ ] **Test Tool Page Schemas:**
  Run `https://pdffire.com/tool/merge` through the Rich Results Test.
  - Expected Schemas: `SoftwareApplication`, `BreadcrumbList`, `FAQPage`.
  - Confirm 0 errors and 0 warnings.

---

## 6. Social Share & Open Graph Validation

- [ ] **Verify Open Graph & Twitter Cards:**
  - Test `https://pdffire.com/` using [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).
  - Test using [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
  - Test using [Twitter Card Validator / Tweet Preview](https://cards-dev.twitter.com/validator).
  - Verify image displays `public/brand/pdffire-og.png` (1200x630) with crisp contrast.

---

## 7. Performance & Core Web Vitals (CWV) Verification

- [ ] **Test Mobile & Desktop CWV via PageSpeed Insights:**
  - Target: **LCP < 2.5s**, **INP < 200ms**, **CLS < 0.1**.
  - Verify static asset caching on CDN edge.
  - Ensure WebAssembly / PDF.js assets are only fetched on demand.

---

## 8. Post-Launch Monitoring (First 30–60 Days)

- [ ] **Weekly Search Console Coverage Review:**
  - Check **Pages** report for "Excluded", "Crawled - currently not indexed", or "Discovered - currently not indexed".
  - Ensure zero 404 crawl errors on public tools.
- [ ] **Keyword Ranking & Impressions:**
  - Monitor queries under the **Performance** tab to discover emerging queries for tools like "compress pdf online", "merge pdf without upload", etc.
  - Refine page titles and descriptions based on real user queries.
