import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { PwaProvider } from "@/components/pwa/pwa-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FF7047",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "PDFfire — PDF Tools That Just Work",
  description:
    "Fast, private in-browser PDF manipulation. Merge, split, compress, convert, edit, and protect documents with zero server uploads.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/brand/pdffire-mark-light.svg",
        media: "(prefers-color-scheme: light)",
        type: "image/svg+xml",
      },
      {
        url: "/brand/pdffire-mark-dark.svg",
        media: "(prefers-color-scheme: dark)",
        type: "image/svg+xml",
      },
      { url: "/icons/favicon.ico" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PDFfire",
  },
  openGraph: {
    title: "PDFfire — PDF Tools That Just Work",
    description: "Fast, private in-browser PDF manipulation with zero server uploads.",
    siteName: "PDFfire",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PDFfire — PDF Tools That Just Work",
    description: "Fast, private in-browser PDF manipulation with zero server uploads.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <PwaProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
