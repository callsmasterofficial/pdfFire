import React, { useState } from "react";
import { ShieldAlert, Search, Loader2, CheckCheck } from "lucide-react";
import { scanPdfForPii, PiiFinding } from "@/lib/pdf/operations/redact-pii";
import { RedactionArea } from "@/lib/pdf/operations/redact";

interface RedactPiiScannerProps {
  pdfBytes: Uint8Array;
  onAddRedactions: (redactions: RedactionArea[]) => void;
  fillColor: NonNullable<RedactionArea["fillColor"]>;
  overlayText: string;
}

export function RedactPiiScanner({
  pdfBytes,
  onAddRedactions,
  fillColor,
  overlayText,
}: RedactPiiScannerProps) {
  const [includeEmails, setIncludeEmails] = useState(true);
  const [includePhones, setIncludePhones] = useState(true);
  const [includeSsn, setIncludeSsn] = useState(true);
  const [includeCards, setIncludeCards] = useState(true);
  const [customWord, setCustomWord] = useState("");
  const [customList, setCustomList] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [findings, setFindings] = useState<PiiFinding[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    setHasScanned(false);
    try {
      const results = await scanPdfForPii(pdfBytes, {
        includeEmails,
        includePhones,
        includeSsn,
        includeCards,
        customKeywords: customList,
      });
      setFindings(results);
      setHasScanned(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to scan document for PII.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWord.trim()) return;
    if (!customList.includes(customWord.trim())) {
      setCustomList([...customList, customWord.trim()]);
    }
    setCustomWord("");
  };

  const handleApplyAllFindings = () => {
    const areas: RedactionArea[] = findings.map((f) => ({
      id: `redact-${f.id}`,
      pageNumber: f.pageNumber,
      x: Math.max(0, f.bbox.x - 2),
      y: Math.max(0, f.bbox.y - 2),
      width: f.bbox.width + 4,
      height: f.bbox.height + 4,
      fillColor,
      overlayText,
    }));
    onAddRedactions(areas);
  };

  return (
    <div className="space-y-4 bg-card p-4 rounded-xl border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Automated PII & Pattern Scanner
          </h4>
        </div>
        <button
          type="button"
          onClick={handleScan}
          disabled={isScanning}
          className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
        >
          {isScanning ? <Loader2 className="size-3 animate-spin" /> : <Search className="size-3" />}
          {isScanning ? "Scanning..." : "Scan Document"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {[
          { label: "Emails", state: includeEmails, set: setIncludeEmails },
          { label: "Phone Numbers", state: includePhones, set: setIncludePhones },
          { label: "SSNs / IDs", state: includeSsn, set: setIncludeSsn },
          { label: "Credit Cards", state: includeCards, set: setIncludeCards },
        ].map((item) => (
          <label key={item.label} className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={item.state}
              onChange={(e) => item.set(e.target.checked)}
              className="accent-primary size-3.5 rounded"
            />
            <span className="text-muted-foreground">{item.label}</span>
          </label>
        ))}
      </div>

      <form onSubmit={handleAddKeyword} className="flex gap-2">
        <input
          type="text"
          value={customWord}
          onChange={(e) => setCustomWord(e.target.value)}
          placeholder="Add custom keyword or name to find..."
          className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-1.5 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium"
        >
          + Add
        </button>
      </form>

      {customList.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customList.map((kw) => (
            <span
              key={kw}
              className="px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
            >
              {kw}
              <button
                type="button"
                onClick={() => setCustomList(customList.filter((k) => k !== kw))}
                className="hover:font-bold ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {hasScanned && (
        <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between">
          <span className="text-xs text-foreground">
            {findings.length === 0 ? "No sensitive PII patterns detected." : `Found ${findings.length} sensitive patterns.`}
          </span>
          {findings.length > 0 && (
            <button
              type="button"
              onClick={handleApplyAllFindings}
              className="px-2.5 py-1 text-xs bg-destructive text-destructive-foreground font-semibold rounded-md shadow-sm hover:opacity-90 inline-flex items-center gap-1"
            >
              <CheckCheck className="size-3" /> Redact All ({findings.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
