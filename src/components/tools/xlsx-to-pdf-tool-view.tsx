"use client";

import React, { useState, useRef } from "react";
import { FileSpreadsheet, ShieldCheck, AlertCircle, UploadCloud, FileCode } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { XlsxMetricsBadge } from "./xlsx-metrics-badge";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { parseXlsxBytes, convertXlsxToPdf, XlsxToPdfResult, ParsedXlsx } from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { zipSync, strToU8 } from "fflate";

export function XlsxToPdfToolView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [title, setTitle] = useState("Spreadsheet");
  const [parsed, setParsed] = useState<ParsedXlsx | null>(null);
  const [result, setResult] = useState<XlsxToPdfResult | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<number | "all">("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processBytes = (bytes: Uint8Array, name: string) => {
    try {
      setError(null);
      setResult(null);
      const doc = parseXlsxBytes(bytes);
      setFileBytes(bytes);
      setFileName(name);
      setParsed(doc);
      if (doc.sheets[0]?.name) setTitle(doc.sheets[0].name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to parse Excel spreadsheet.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        processBytes(new Uint8Array(reader.result), file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLoadSample = () => {
    const sheetData = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
      <row r="1"><c r="A1"><is><t>Division</t></is></c><c r="B1"><is><t>Q1 Sales</t></is></c><c r="C1"><is><t>Q2 Sales</t></is></c><c r="D1"><is><t>Growth</t></is></c></row>
      <row r="2"><c r="A2"><is><t>Enterprise Cloud</t></is></c><c r="B2"><v>450000</v></c><c r="C2"><v>580000</v></c><c r="D2"><is><t>+28.8%</t></is></c></row>
      <row r="3"><c r="A3"><is><t>Consumer AI</t></is></c><c r="B3"><v>210000</v></c><c r="C3"><v>340000</v></c><c r="D3"><is><t>+61.9%</t></is></c></row>
      <row r="4"><c r="A4"><is><t>Developer Tools</t></is></c><c r="B4"><v>125000</v></c><c r="C4"><v>165000</v></c><c r="D4"><is><t>+32.0%</t></is></c></row>
    </sheetData></worksheet>`;
    const sampleWorkbook = `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Sales Summary" sheetId="1"/></sheets></workbook>`;
    const sample = zipSync({ "xl/workbook.xml": strToU8(sampleWorkbook), "xl/worksheets/sheet1.xml": strToU8(sheetData) });
    processBytes(sample, "Quarterly_Financial_Performance.xlsx");
  };

  const handleConvert = async () => {
    if (!fileBytes) return;
    setIsProcessing(true);
    setError(null);
    try {
      const sheetIdx = selectedSheet === "all" ? undefined : selectedSheet;
      const res = await convertXlsxToPdf(fileBytes, title, sheetIdx);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert spreadsheet.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout title="Excel to PDF" description="Convert Excel (.xlsx) workbooks into formatted landscape PDF tables 100% locally." icon={FileSpreadsheet} category="Convert">
      <div className="space-y-6">
        {!fileBytes ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-2xl p-8 sm:p-12 text-center bg-muted/10 hover:bg-muted/20 transition-colors">
            <UploadCloud className="size-12 text-primary/70 mb-3" />
            <h3 className="font-semibold text-base mb-1">Select or drop an Excel (.xlsx) spreadsheet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-4">Converts workbooks, multiple sheets, and numerical tables directly inside your browser memory.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button size="sm" onClick={() => fileInputRef.current?.click()} className="cursor-pointer">Browse Excel File</Button>
              <input ref={fileInputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5"><FileCode className="size-3.5" />Load Sample Spreadsheet</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="size-6 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md">{fileName}</p>
                  <p className="text-[11px] text-muted-foreground">{((fileBytes.length) / 1024).toFixed(1)} KB • Excel Workbook</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFileBytes(null); setParsed(null); setResult(null); }} className="text-xs">Change File</Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="doc-title" className="text-xs font-semibold">Document Title</Label>
                <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-xs" />
              </div>
              {parsed && parsed.sheets.length > 1 && (
                <div className="space-y-1.5">
                  <Label htmlFor="sheet-select" className="text-xs font-semibold">Sheet to Export</Label>
                  <select id="sheet-select" value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                    <option value="all">All Sheets ({parsed.sheets.length})</option>
                    {parsed.sheets.map((s, idx) => <option key={idx} value={idx}>{s.name} ({s.rows.length} rows)</option>)}
                  </select>
                </div>
              )}
            </div>

            {parsed && <XlsxMetricsBadge sheetCount={parsed.sheetCount} rowCount={parsed.rowCount} cellCount={parsed.cellCount} pageCount={result?.pageCount} />}
          </div>
        )}

        {error && <div className="flex gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive"><AlertCircle className="size-4 shrink-0" />{error}</div>}
        {result && (
          <ResultPreviewSection
            pdfBytes={result.pdfBytes}
            fileName={result.fileName}
            pageCount={result.pageCount}
            title="Excel Landscape PDF Preview"
            onDownload={() => downloadPdfBytes(result.pdfBytes, result.fileName)}
          />
        )}

        <div className="flex gap-2 rounded-xl border border-border/50 bg-muted/30 p-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />Your spreadsheets are parsed directly inside client memory. Cell formulas, numbers, and strings never touch any server.
        </div>

        <ToolActionBar actionLabel="Convert to PDF" isProcessing={isProcessing} canExecute={!!fileBytes && !isProcessing} isDone={!!result} resultFileName={result?.fileName} onExecute={handleConvert} onDownload={() => result && downloadPdfBytes(result.pdfBytes, result.fileName)} onReset={() => { setFileBytes(null); setParsed(null); setResult(null); setError(null); }} />
      </div>
    </ToolLayout>
  );
}
