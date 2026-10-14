import { describe, it, expect } from "vitest";
import {
  summarizeDocumentText,
  extractEntities,
  askDocumentQuestion,
  detectHardwareCapabilities,
} from "../index";

describe("Phase 9: Optional Local AI Capabilities", () => {
  const sampleDocument = `
    Quarterly Operations Report for Q3 2026.
    The company achieved total revenue of $1,450,000 across digital operations.
    Net profit margins improved by 14% compared to the previous fiscal quarter.
    Security audits were concluded on 2026-09-30 by the compliance committee.
    For questions regarding these financial figures, contact audit-lead@pdfforge.org.
    The primary milestone achieved was the full migration to client-side in-memory document processing.
    This architecture eliminated cloud server document transmission and prevented external data leaks.
  `;

  it("Summarization: generates executive overview and takeaway bullet points", () => {
    const summary = summarizeDocumentText(sampleDocument, "Q3 Report", 1);

    expect(summary.title).toBe("Q3 Report");
    expect(summary.wordCount).toBeGreaterThan(30);
    expect(summary.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(summary.executiveSummary.length).toBeGreaterThan(40);
    expect(summary.keyTakeaways.length).toBeGreaterThanOrEqual(1);
    expect(summary.engine).toBe("on-device-nlp");
  });

  it("Entity Extraction: identifies amounts, dates, and email addresses locally", () => {
    const entities = extractEntities(sampleDocument);

    const amounts = entities.filter((e) => e.type === "amount");
    expect(amounts.some((a) => a.value.includes("$1,450,000"))).toBe(true);

    const dates = entities.filter((e) => e.type === "date");
    expect(dates.some((d) => d.value.includes("2026-09-30"))).toBe(true);

    const emails = entities.filter((e) => e.type === "email");
    expect(emails.some((m) => m.value.includes("audit-lead@pdfforge.org"))).toBe(true);
  });

  it("Document Q&A: answers questions with accurate page citations and confidence", () => {
    const pages = [
      {
        pageNumber: 1,
        text: sampleDocument,
        characterCount: sampleDocument.length,
      },
    ];

    const res = askDocumentQuestion("What was the total revenue?", pages);

    expect(res.confidence).toBeGreaterThan(60);
    expect(res.answer.toLowerCase()).toContain("revenue");
    expect(res.citations.length).toBeGreaterThanOrEqual(1);
    expect(res.citations[0].pageNumber).toBe(1);
  });

  it("Document Q&A: handles unmatched inquiries gracefully", () => {
    const pages = [
      {
        pageNumber: 1,
        text: sampleDocument,
        characterCount: sampleDocument.length,
      },
    ];

    const res = askDocumentQuestion("quantum astrophysics black hole", pages);
    expect(res.confidence).toBeLessThan(30);
    expect(res.citations.length).toBe(0);
  });

  it("Hardware Capabilities: provides runtime environment telemetry", async () => {
    const caps = await detectHardwareCapabilities();

    expect(caps.logicalCores).toBeGreaterThanOrEqual(1);
    expect(typeof caps.platformSummary).toBe("string");
  });
});
