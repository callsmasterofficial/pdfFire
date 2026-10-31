/**
 * Helper to generate in-memory test PDF fixtures without network requests.
 */

export function createSamplePdfFile(name = "sample-multipage.pdf"): File {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 6 0 R >> >> /Contents 7 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 6 0 R >> >> /Contents 8 0 R >>
endobj
5 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 6 0 R >> >> /Contents 9 0 R >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
7 0 obj
<< /Length 58 >>
stream
BT
/F1 22 Tf
50 700 Td
(FileMelo:  Local Page 1 Preview) Tj
ET
endstream
endobj
8 0 obj
<< /Length 58 >>
stream
BT
/F1 22 Tf
50 700 Td
(FileMelo:  Local Page 2 Preview) Tj
ET
endstream
endobj
9 0 obj
<< /Length 58 >>
stream
BT
/F1 22 Tf
50 700 Td
(FileMelo:  Local Page 3 Preview) Tj
ET
endstream
endobj
xref
0 10
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000123 00000 n 
0000000239 00000 n 
0000000355 00000 n 
0000000471 00000 n 
0000000539 00000 n 
0000000648 00000 n 
0000000757 00000 n 
trailer
<< /Size 10 /Root 1 0 R >>
startxref
866
%%EOF`;

  const blob = new Blob([content], { type: "application/pdf" });
  return new File([blob], name, { type: "application/pdf" });
}

export function createCorruptedPdfFile(name = "corrupted-document.pdf"): File {
  const content = `%PDF-1.4\nCorrupted random header stream garbage\n%%EOF`;
  const blob = new Blob([content], { type: "application/pdf" });
  return new File([blob], name, { type: "application/pdf" });
}

export function createFakeExtensionFile(name = "not-a-pdf.pdf"): File {
  const content = `Plain text file that was renamed to .pdf`;
  const blob = new Blob([content], { type: "application/pdf" });
  return new File([blob], name, { type: "application/pdf" });
}
