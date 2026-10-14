"use client";

import React from "react";
import { FormFieldInfo } from "@/lib/pdf/operations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldListProps {
  fields: FormFieldInfo[];
  fieldValues: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

export function FormFieldList({ fields, fieldValues, onChange }: FormFieldListProps) {
  if (fields.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
        No interactive form fields found in this PDF. Flattening will permanently render any dynamic annotations into page content.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {fields.map((field) => {
        const val = fieldValues[field.name] !== undefined ? fieldValues[field.name] : field.currentValue;

        if (field.type === "checkbox") {
          const isChecked = val === "true" || val === "checked";
          return (
            <label
              key={field.name}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onChange(field.name, e.target.checked ? "true" : "false")}
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs font-mono text-foreground font-medium">{field.name}</span>
            </label>
          );
        }

        return (
          <div key={field.name} className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground">{field.name}</Label>
            <Input
              value={val}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={`Value for ${field.name}...`}
              className="h-8 text-xs font-mono bg-muted/20"
            />
          </div>
        );
      })}
    </div>
  );
}
