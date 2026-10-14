import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } from "pdf-lib";

export type FormFieldType = "text" | "checkbox" | "dropdown" | "other";

export interface FormFieldInfo {
  name: string;
  type: FormFieldType;
  currentValue: string;
  options?: string[];
  isReadOnly: boolean;
}

export interface FormInspectionResult {
  hasForm: boolean;
  fields: FormFieldInfo[];
  pageCount: number;
}

export interface FillFormResult {
  pdfBytes: Uint8Array;
  fieldCount: number;
  isFlattened: boolean;
  fileName: string;
}

export async function inspectPdfForm(
  fileOrBytes: File | Uint8Array | ArrayBuffer
): Promise<FormInspectionResult> {
  const bytes = fileOrBytes instanceof File ? await fileOrBytes.arrayBuffer() : fileOrBytes;
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  let fields: FormFieldInfo[] = [];
  try {
    const form = pdfDoc.getForm();
    const rawFields = form.getFields();

    fields = rawFields.map((f) => {
      const name = f.getName();
      const isReadOnly = f.isReadOnly();

      if (f instanceof PDFTextField) {
        return { name, type: "text", currentValue: f.getText() || "", isReadOnly };
      }
      if (f instanceof PDFCheckBox) {
        return { name, type: "checkbox", currentValue: f.isChecked() ? "true" : "false", isReadOnly };
      }
      if (f instanceof PDFDropdown) {
        return { name, type: "dropdown", currentValue: f.getSelected()[0] || "", options: f.getOptions(), isReadOnly };
      }
      return { name, type: "other", currentValue: "", isReadOnly };
    });
  } catch {
    // Document does not have an AcroForm
  }

  return {
    hasForm: fields.length > 0,
    fields,
    pageCount: pdfDoc.getPageCount(),
  };
}

export async function fillAndFlattenPdfForm(
  fileOrBytes: File | Uint8Array | ArrayBuffer,
  fieldValues: Record<string, string>,
  flatten = true,
  outputFileName = "flattened-form.pdf"
): Promise<FillFormResult> {
  const bytes = fileOrBytes instanceof File ? await fileOrBytes.arrayBuffer() : fileOrBytes;
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  let fieldCount = 0;
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    fieldCount = fields.length;

    for (const [name, val] of Object.entries(fieldValues)) {
      try {
        const field = form.getField(name);
        if (field instanceof PDFTextField) {
          field.setText(val);
        } else if (field instanceof PDFCheckBox) {
          if (val === "true" || val === "checked") field.check();
          else field.uncheck();
        } else if (field instanceof PDFDropdown) {
          field.select(val);
        }
      } catch {
        // Skip individual missing or incompatible fields
      }
    }

    if (flatten && fieldCount > 0) {
      form.flatten();
    }
  } catch {
    // If no form exists, flattening proceeds as normal
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return {
    pdfBytes,
    fieldCount,
    isFlattened: flatten,
    fileName: outputFileName,
  };
}
