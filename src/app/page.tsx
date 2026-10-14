import React from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/home/hero-section";
import { HomePreviewSection } from "@/components/home/home-preview-section";
import { ToolsDirectory } from "@/components/home/tools-directory";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 flex flex-col items-center">
        <HeroSection />
        <HomePreviewSection />
        <ToolsDirectory />
      </main>
      <Footer />
    </div>
  );
}
