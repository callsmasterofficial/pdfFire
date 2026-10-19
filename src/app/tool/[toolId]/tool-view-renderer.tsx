import React from "react";
import { notFound } from "next/navigation";
import { MergeToolView } from "@/components/tools/merge-tool-view";
import { RotateToolView } from "@/components/tools/rotate-tool-view";
import { ExtractToolView } from "@/components/tools/extract-tool-view";
import { SplitToolView } from "@/components/tools/split-tool-view";
import { ReorderToolView } from "@/components/tools/reorder-tool-view";
import { ImagesToPdfView } from "@/components/tools/images-to-pdf-view";
import { PdfToImagesView } from "@/components/tools/pdf-to-images-view";
import { BatchToolView } from "@/components/tools/batch-tool-view";
import { CompressToolView } from "@/components/tools/compress-tool-view";
import { WatermarkToolView } from "@/components/tools/watermark-tool-view";
import { PageNumberToolView } from "@/components/tools/page-number-tool-view";
import { EditToolView } from "@/components/tools/edit-tool-view";
import { MetadataToolView } from "@/components/tools/metadata-tool-view";
import { HashToolView } from "@/components/tools/hash-tool-view";
import { FormToolView } from "@/components/tools/form-tool-view";
import { UnlockToolView } from "@/components/tools/unlock-tool-view";
import { OcrToolView } from "@/components/tools/ocr-tool-view";
import { PdfToTextView } from "@/components/tools/pdf-to-text-view";
import { TextToPdfView } from "@/components/tools/text-to-pdf-view";
import { AiSummaryToolView } from "@/components/tools/ai-summary-tool-view";
import { AiChatToolView } from "@/components/tools/ai-chat-tool-view";
import { CompareToolView } from "@/components/tools/compare-tool-view";
import { RepairToolView } from "@/components/tools/repair-tool-view";
import { SignToolView } from "@/components/tools/sign-tool-view";
import { NUpToolView } from "@/components/tools/n-up-tool-view";
import { CropToolView } from "@/components/tools/crop-tool-view";
import { AlternateMixToolView } from "@/components/tools/alternate-mix-tool-view";
import { FlipToolView } from "@/components/tools/flip-tool-view";
import { RedactToolView } from "@/components/tools/redact-tool-view";
import { ProtectToolView } from "@/components/tools/protect-tool-view";
import { ExtractImagesToolView } from "@/components/tools/extract-images-tool-view";
import { MarkdownToPdfToolView } from "@/components/tools/markdown-to-pdf-tool-view";
import { CsvToPdfToolView } from "@/components/tools/csv-to-pdf-tool-view";
import { InvertColorsToolView } from "@/components/tools/invert-colors-tool-view";

interface ToolViewRendererProps {
  toolId: string;
}

export function ToolViewRenderer({ toolId }: ToolViewRendererProps) {
  switch (toolId) {
    case "merge": return <MergeToolView />;
    case "rotate": return <RotateToolView />;
    case "extract": return <ExtractToolView />;
    case "split": return <SplitToolView />;
    case "reorder": return <ReorderToolView />;
    case "img-to-pdf": return <ImagesToPdfView />;
    case "pdf-to-img": return <PdfToImagesView />;
    case "batch": return <BatchToolView />;
    case "compress": return <CompressToolView />;
    case "watermark": return <WatermarkToolView />;
    case "page-number": return <PageNumberToolView />;
    case "edit": return <EditToolView />;
    case "metadata": return <MetadataToolView />;
    case "hash": return <HashToolView />;
    case "flatten": return <FormToolView />;
    case "unlock": return <UnlockToolView />;
    case "ocr": return <OcrToolView />;
    case "pdf-to-text": return <PdfToTextView />;
    case "text-to-pdf": return <TextToPdfView />;
    case "summary": return <AiSummaryToolView />;
    case "chat": return <AiChatToolView />;
    case "compare": return <CompareToolView />;
    case "repair": return <RepairToolView />;
    case "sign": return <SignToolView />;
    case "n-up": return <NUpToolView />;
    case "crop": return <CropToolView />;
    case "alternate-mix": return <AlternateMixToolView />;
    case "flip": return <FlipToolView />;
    case "redact": return <RedactToolView />;
    case "protect": return <ProtectToolView />;
    case "extract-images": return <ExtractImagesToolView />;
    case "markdown-to-pdf": return <MarkdownToPdfToolView />;
    case "csv-to-pdf": return <CsvToPdfToolView />;
    case "invert-colors": return <InvertColorsToolView />;
    default:
      notFound();
  }
}
