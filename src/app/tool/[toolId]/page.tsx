import React, { Suspense } from "react";
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

const SUPPORTED_TOOLS = [
  "merge", "rotate", "extract", "split", "reorder",
  "img-to-pdf", "pdf-to-img", "batch", "compress",
  "watermark", "page-number", "edit",
  "metadata", "hash", "flatten", "unlock",
  "ocr", "pdf-to-text", "text-to-pdf",
  "summary", "chat", "compare", "repair",
  "sign", "n-up", "crop", "alternate-mix", "flip",
  "redact", "protect", "extract-images",
] as const;

export function generateStaticParams() {
  return SUPPORTED_TOOLS.map((toolId) => ({ toolId }));
}

interface ToolPageProps {
  params: Promise<{ toolId: string }>;
}

async function ToolContent({ params }: ToolPageProps) {
  const { toolId } = await params;

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
    default:
      notFound();
  }
}

function ToolLoadingFallback() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
      <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
      <p className="text-xs text-muted-foreground font-mono">Loading tool...</p>
    </div>
  );
}

export default function ToolPage({ params }: ToolPageProps) {
  return (
    <div className="w-full flex-1 flex flex-col items-center py-4 sm:py-6 px-3 sm:px-6">
      <Suspense fallback={<ToolLoadingFallback />}>
        <ToolContent params={params} />
      </Suspense>
    </div>
  );
}
