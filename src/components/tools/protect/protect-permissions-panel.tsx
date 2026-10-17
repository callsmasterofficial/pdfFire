import React from "react";
import { ProtectPdfOptions } from "@/lib/pdf/operations/protect";
import { ShieldCheck, Printer, Copy, Edit3, MessageSquare, FileCheck } from "lucide-react";

interface ProtectPermissionsPanelProps {
  options: ProtectPdfOptions;
  onChange: (options: ProtectPdfOptions) => void;
}

export function ProtectPermissionsPanel({ options, onChange }: ProtectPermissionsPanelProps) {
  const update = (patch: Partial<ProtectPdfOptions>) => onChange({ ...options, ...patch });

  const toggles = [
    {
      key: "allowPrinting" as const,
      label: "Allow Printing",
      desc: "Permit users to print high or standard resolution copies",
      icon: Printer,
    },
    {
      key: "allowCopying" as const,
      label: "Allow Copying Text & Assets",
      desc: "Permit text selection and image copying",
      icon: Copy,
    },
    {
      key: "allowModifying" as const,
      label: "Allow Modifying Content",
      desc: "Permit page rotation, insertion, or content changes",
      icon: Edit3,
    },
    {
      key: "allowAnnotating" as const,
      label: "Allow Annotations & Notes",
      desc: "Permit commenting and markup in conforming readers",
      icon: MessageSquare,
    },
    {
      key: "allowFillingForms" as const,
      label: "Allow Filling Forms & Signing",
      desc: "Permit interactive AcroForm completion and digital signing",
      icon: FileCheck,
    },
  ];

  return (
    <div className="space-y-4 bg-card p-5 rounded-xl border border-border">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Document Access & Restrictions
        </h4>
      </div>

      <div className="space-y-2.5">
        {toggles.map(({ key, label, desc, icon: Icon }) => {
          const isAllowed = options[key] ?? true;
          return (
            <label
              key={key}
              className="flex items-start gap-3 p-2.5 rounded-lg border border-border/80 bg-background hover:border-primary/40 transition-all cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={isAllowed}
                onChange={(e) => update({ [key]: e.target.checked })}
                className="accent-primary size-4 rounded mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
