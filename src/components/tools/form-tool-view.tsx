"use client";

import React, { useState, useEffect } from "react";
import { CheckSquare, Lock, AlertCircle } from "lucide-react";
import { ToolLayout } from "./tool-layout";
import { ToolActionBar } from "./tool-action-bar";
import { SharedDropzone } from "@/components/file-handling/shared-dropzone";
import { FormFieldList } from "./forms/form-field-list";
import {
  inspectPdfForm,
  fillAndFlattenPdfForm,
  FormInspectionResult,
  FillFormResult,
} from "@/lib/pdf/operations";
import { downloadPdfBytes } from "@/lib/pdf/download";
import { ResultPreviewSection } from "@/components/preview/result-preview-section";

export function FormToolView() {
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<FormInspectionResult | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FillFormResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setInspection(null);
      setFieldValues({});
      setResult(null);
      return;
    }
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    inspectPdfForm(file)
      .then((res) => {
        if (!isCancelled) setInspection(res);
      })
      .catch((err) => {
        if (!isCancelled) setError(err instanceof Error ? err.message : "Failed to inspect form");
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFlatten = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fillAndFlattenPdfForm(
        file,
        fieldValues,
        true,
        `flattened-${file.name}`
      );
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to flatten form");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPdfBytes(result.pdfBytes, result.fileName);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setFieldValues({});
    setInspection(null);
  };

  return (
    <ToolLayout
      title="Fill & Flatten Form"
      description="Fill interactive AcroForm fields and permanently flatten them into tamper-proof vector graphics."
      icon={CheckSquare}
      category="Security"
    >
      <div className="w-full space-y-6">
        <SharedDropzone onFileSelect={(selectedFile) => setFile(selectedFile)} />

        {file && (
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CheckSquare className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{file.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {inspection ? `${inspection.fields.length} form fields detected` : "Inspecting form fields..."}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <Lock className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Why flatten PDF forms?</p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Flattening converts interactive text inputs and checkboxes into uneditable page elements, ensuring no recipient can modify entered values.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-xs text-muted-foreground font-mono">
                Scanning document for AcroForm fields...
              </div>
            ) : inspection ? (
              <FormFieldList
                fields={inspection.fields}
                fieldValues={fieldValues}
                onChange={handleFieldChange}
              />
            ) : null}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <ResultPreviewSection
                pdfBytes={result.pdfBytes}
                fileName={result.fileName}
                title="Flattened Form Preview"
                onDownload={handleDownload}
              />
            )}

            <ToolActionBar
              actionLabel="Flatten & Lock Form"
              isProcessing={isProcessing}
              canExecute={!!file}
              isDone={!!result}
              resultFileName={result?.fileName}
              onExecute={handleFlatten}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
