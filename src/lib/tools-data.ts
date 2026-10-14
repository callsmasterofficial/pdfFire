import {
  Combine, Scissors, RotateCw, Layers, FileImage, Image as ImageIcon,
  Files, Zap, Stamp, Hash, PenTool, Lock, ShieldAlert, Fingerprint,
  FileText, CheckSquare, Unlock, ScanText, FileUp, Sparkles, MessageSquareText,
  GitCompare, Wrench,
} from "lucide-react";
import { ToolCardProps } from "@/components/home/tool-card";

export const TOOL_ITEMS: ToolCardProps[] = [
  {
    id: "merge", title: "Merge PDF", category: "Organize", icon: Combine, badge: "Phase 3", isAvailable: true,
    description: "Combine multiple PDF documents into a single organized file in seconds.",
  },
  {
    id: "split", title: "Split PDF", category: "Organize", icon: Scissors, badge: "Phase 3", isAvailable: true,
    description: "Extract specific page ranges or separate every page into dedicated files.",
  },
  {
    id: "rotate", title: "Rotate PDF", category: "Organize", icon: RotateCw, badge: "Phase 3", isAvailable: true,
    description: "Rotate single or multiple pages 90, 180, or 270 degrees clockwise.",
  },
  {
    id: "extract", title: "Extract Pages", category: "Organize", icon: Layers, badge: "Phase 3", isAvailable: true,
    description: "Select individual pages to create a fresh, streamlined PDF document.",
  },
  {
    id: "reorder", title: "Delete & Reorder", category: "Organize", icon: Layers, badge: "Phase 3", isAvailable: true,
    description: "Rearrange page sequence via drag-and-drop and prune unneeded pages.",
  },
  {
    id: "batch", title: "Batch Operations", category: "Batch", icon: Files, badge: "Phase 4", isAvailable: true,
    description: "Queue multiple documents, reorder in bulk, and execute batch operations.",
  },
  {
    id: "compress", title: "Compress PDF", category: "Edit & Optimize", icon: Zap, badge: "Phase 5", isAvailable: true,
    description: "Optimize PDF structure and object streams with honest before/after metrics.",
  },
  {
    id: "watermark", title: "Watermark PDF", category: "Edit & Optimize", icon: Stamp, badge: "Phase 5", isAvailable: true,
    description: "Stamp customized diagonal or horizontal text watermarks across document pages.",
  },
  {
    id: "page-number", title: "Page Numbers & Headers", category: "Edit & Optimize", icon: Hash, badge: "Phase 5", isAvailable: true,
    description: "Add clean pagination, headers, and footers at flexible coordinates.",
  },
  {
    id: "edit", title: "Edit & Annotate", category: "Edit & Optimize", icon: PenTool, badge: "Phase 5", isAvailable: true,
    description: "Add text notes, shapes, and freehand pencil markings with undo/redo.",
  },
  {
    id: "summary", title: "Summarize PDF", category: "AI & Insights", icon: Sparkles, badge: "Phase 9", isAvailable: true,
    description: "Generate executive summaries and key takeaway bullet points 100% on-device.",
  },
  {
    id: "chat", title: "Ask PDF (Q&A)", category: "AI & Insights", icon: MessageSquareText, badge: "Phase 9", isAvailable: true,
    description: "Ask questions about your PDF and receive answers with cited page numbers locally.",
  },
  {
    id: "img-to-pdf", title: "Images to PDF", category: "Convert", icon: FileImage, badge: "Phase 3", isAvailable: true,
    description: "Convert PNG, JPG, and WebP imagery into clean, standardized PDF pages.",
  },
  {
    id: "pdf-to-img", title: "PDF to Images", category: "Convert", icon: ImageIcon, badge: "Phase 3", isAvailable: true,
    description: "Export high-resolution PNG or JPEG images from any document pages.",
  },
  {
    id: "ocr", title: "OCR Scanned PDF", category: "Convert", icon: ScanText, badge: "Phase 7", isAvailable: true,
    description: "Extract text from scanned PDFs & images and generate searchable PDFs 100% locally.",
  },
  {
    id: "pdf-to-text", title: "PDF to Text", category: "Convert", icon: FileText, badge: "Phase 7", isAvailable: true,
    description: "Instantly extract embedded text streams and character counts from digital PDF documents.",
  },
  {
    id: "text-to-pdf", title: "Text to PDF", category: "Convert", icon: FileUp, badge: "Phase 7", isAvailable: true,
    description: "Write or paste plain text and convert it into a clean, paginated PDF document locally.",
  },
  {
    id: "metadata", title: "Edit & Strip Metadata", category: "Security", icon: FileText, badge: "Phase 6", isAvailable: true,
    description: "Inspect, modify, or strip document metadata fields 100% inside your browser.",
  },
  {
    id: "hash", title: "Cryptographic Checksum", category: "Security", icon: Fingerprint, badge: "Phase 6", isAvailable: true,
    description: "Compute SHA-256/SHA-512 digests and verify against reference checksums.",
  },
  {
    id: "flatten", title: "Fill & Flatten Form", category: "Security", icon: CheckSquare, badge: "Phase 6", isAvailable: true,
    description: "Fill AcroForm fields and flatten into immutable, tamper-proof vector drawings.",
  },
  {
    id: "unlock", title: "Unlock PDF", category: "Security", icon: Unlock, badge: "Phase 6", isAvailable: true,
    description: "Remove password protection from encrypted documents and export clean files.",
  },
  {
    id: "compare", title: "Compare PDFs", category: "Diagnostics", icon: GitCompare, badge: "Phase 11", isAvailable: true,
    description: "Compare two PDF versions side-by-side with text diffing and visual pixel overlays.",
  },
  {
    id: "repair", title: "Repair PDF", category: "Diagnostics", icon: Wrench, badge: "Phase 11", isAvailable: true,
    description: "Rebuild corrupted xref tables, repair broken headers, and salvage readable pages.",
  },
  {
    id: "protect", title: "Protect PDF", category: "Security", icon: Lock, badge: "Phase 6", isAvailable: false,
    description: "Apply standard password encryption without transmitting files anywhere.",
  },
  {
    id: "redact", title: "Secure Redaction", category: "Security", icon: ShieldAlert, badge: "Phase 6", isAvailable: false,
    description: "Sanitize and strip underlying text vectors safely inside browser memory.",
  },
];

export const TOOL_CATEGORIES = [
  "All", "Organize", "Batch", "Edit & Optimize", "Convert", "Security", "AI & Insights", "Diagnostics",
] as const;
