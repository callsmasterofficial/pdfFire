export const SITE_CONFIG = {
  name: "PDFfire",
  tagline: "PDF tools that just work.",
  defaultTitle: "PDFfire — PDF Tools That Just Work",
  titleTemplate: "%s | PDFfire",
  defaultDescription:
    "Fast, private in-browser PDF manipulation. Merge, split, compress, convert, edit, and protect documents with zero server uploads.",
  locale: "en_US",
  author: "PDFfire Team",
  themeColor: "#FF7047",
  twitterHandle: "@pdffire",
} as const;

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "https://pdffire.com";
}

export function getCanonicalUrl(path: string = ""): string {
  const base = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") {
    return `${base}/`;
  }
  return `${base}${normalizedPath.replace(/\/+$/, "")}`;
}
