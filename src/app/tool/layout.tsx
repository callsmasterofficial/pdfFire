import React from "react";
import type { Metadata } from "next";
import { ToolShellLayout } from "@/components/tool-shell/tool-shell-layout";

export const metadata: Metadata = {
  title: "Tool Studio & Catalog — PDFfire",
  description:
    "Explore, launch, and manage 31+ high-performance client-side PDF tools in a unified browser workspace.",
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToolShellLayout>{children}</ToolShellLayout>;
}
