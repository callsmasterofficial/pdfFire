import React from "react";
import type { Metadata } from "next";
import { ToolShellLayout } from "@/components/tool-shell/tool-shell-layout";
import { getCanonicalUrl, SITE_CONFIG } from "@/lib/seo/site-config";

export const metadata: Metadata = {
  title: "Tool Studio & Catalog — FileMelo",
  description:
    "Explore, launch, and manage 34+ high-performance client-side PDF tools in a unified browser workspace.",
  alternates: {
    canonical: getCanonicalUrl("/tool"),
  },
  openGraph: {
    title: "Tool Studio & Catalog — FileMelo",
    description:
      "Explore, launch, and manage 34+ high-performance client-side PDF tools in a unified browser workspace.",
    url: getCanonicalUrl("/tool"),
    siteName: SITE_CONFIG.name,
    type: "website",
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToolShellLayout>{children}</ToolShellLayout>;
}
