export const SITE_CONFIG = {
  name: "FileMelo",
  tagline: "Convert. Create. Simplify.",
  defaultTitle: "FileMelo — Private PDF Tools",
  titleTemplate: "%s | FileMelo",
  defaultDescription:
    "Fast, private in-browser PDF manipulation. Merge, split, compress, convert, edit, and protect documents with zero server uploads.",
  locale: "en_US",
  author: "Callsmaster Services LLP",
  themeColor: "#FF7047",
  // No social handle is set: inventing one would point readers and
  // structured data at an account that may belong to someone else. Add the
  // real handle here once an account exists.
  twitterHandle: undefined as string | undefined,
} as const;

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "https://filemelo.com";
}

export function getCanonicalUrl(path: string = ""): string {
  const base = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") {
    return `${base}/`;
  }
  return `${base}${normalizedPath.replace(/\/+$/, "")}`;
}
