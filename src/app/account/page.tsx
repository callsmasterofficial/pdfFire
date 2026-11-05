import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SignInForm } from "@/components/account/sign-in-form";
import { getCanonicalUrl } from "@/lib/seo/site-config";

export const metadata: Metadata = {
  title: "Your FileMelo account",
  description:
    "Sign in to FileMelo to carry your plan across devices. Documents are never uploaded; an account only records what you have bought.",
  alternates: { canonical: getCanonicalUrl("/account") },
  // Nothing here is useful to a search engine, and the page is per-person.
  robots: { index: false, follow: true },
};

export default function AccountPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Your account
        </h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          An account carries your plan between devices. It holds your email
          address and what you have bought — never your documents, which are
          processed in your browser and never uploaded.
        </p>
        <SignInForm />
      </main>
      <Footer />
    </div>
  );
}
