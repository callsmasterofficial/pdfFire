import React from "react";
import { HelpCircle } from "lucide-react";
import { ToolFaq } from "@/lib/seo/types";

interface ToolFaqSectionProps {
  faqs: ToolFaq[];
  toolH1: string;
}

export function ToolFaqSection({ faqs, toolH1 }: ToolFaqSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="w-full mt-10 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="size-5 text-primary" />
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Frequently Asked Questions about {toolH1}
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="p-4 sm:p-5 rounded-xl border border-border bg-surface shadow-2xs"
          >
            <h3 className="text-sm font-semibold text-foreground mb-1.5">
              {faq.question}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
