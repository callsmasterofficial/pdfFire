"use client";

import { useState } from "react";
import { FileSpreadsheet, ShieldCheck } from "lucide-react";
import { ToolActionBar } from "./tool-action-bar";
import { ToolLayout } from "./tool-layout";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertCsvToPdf, CsvToPdfResult, parseCsv } from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { TextFidelityNotice } from "@/components/tools/text-fidelity-notice";
import { TableFidelityNotice } from "@/components/tools/table-fidelity-notice";

const SAMPLE = "Name,Department,Location,Status\nAvery Cole,Product,Bengaluru,Active\nJordan Patel,Design,Mumbai,Review\nRiley Singh,Engineering,Pune,Active";

export function CsvToPdfToolView() {
  const [title, setTitle] = useState("Team directory"); const [csv, setCsv] = useState(SAMPLE);
  const [result, setResult] = useState<CsvToPdfResult | null>(null); const [busy, setBusy] = useState(false); const table = parseCsv(csv);
  const generate = async () => { setBusy(true); try { setResult(await convertCsvToPdf(csv, title)); } finally { setBusy(false); } };
  return <ToolLayout title="CSV to PDF" description="Paste a CSV table and generate a clean, landscape PDF table locally." icon={FileSpreadsheet} category="Convert">
    <div className="space-y-5"><div className="max-w-md space-y-1.5"><Label htmlFor="csv-title" className="text-xs font-semibold">Document title</Label><Input id="csv-title" value={title} onChange={(event) => setTitle(event.target.value)} className="h-9" /></div>
      <div className="grid gap-4 lg:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="csv-source" className="text-xs font-semibold">CSV data</Label><textarea id="csv-source" value={csv} onChange={(event) => { setCsv(event.target.value); setResult(null); }} rows={14} spellCheck={false} className="w-full rounded-xl border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary" /></div>
        <div className="space-y-1.5"><span className="text-xs font-semibold">Table preview</span><div className="overflow-auto rounded-xl border border-border bg-muted/20 p-3"><p className="mb-3 text-[11px] text-muted-foreground">{table.rows.length} rows • {table.headers.length} columns • first 6 columns exported</p><table className="w-full text-left text-xs"><thead><tr>{table.headers.slice(0, 6).map((value, index) => <th key={index} className="border-b border-border p-2 font-semibold">{value}</th>)}</tr></thead><tbody>{table.rows.slice(0, 7).map((row, index) => <tr key={index}>{row.slice(0, 6).map((value, cell) => <td key={cell} className="border-b border-border/50 p-2">{value}</td>)}</tr>)}</tbody></table></div></div></div>
      {result?.textFidelity && <TextFidelityNotice report={result.textFidelity} />}

            {result?.tableFidelity && <TableFidelityNotice report={result.tableFidelity} />}

      {result && (
        <ResultPreviewSection
          pdfBytes={result.pdfBytes}
          fileName={result.fileName}
          pageCount={result.pageCount}
          title="CSV Table PDF Preview"
          onDownload={() => downloadPdfBytes(result.pdfBytes, result.fileName)}
        />
      )}
      <div className="flex gap-2 rounded-xl border border-border/50 bg-muted/40 p-3 text-[11px] text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" />CSV is parsed and typeset in browser memory. Quoted commas and escaped quotation marks are supported.</div>
      <ToolActionBar actionLabel="Generate PDF table" isProcessing={busy} canExecute={table.headers.length > 0 && !busy} isDone={!!result} resultFileName={result?.fileName} onExecute={generate} onDownload={() => result && downloadPdfBytes(result.pdfBytes, result.fileName)} onReset={() => { setCsv(""); setTitle("Data table"); setResult(null); }} />
    </div>
  </ToolLayout>;
}
