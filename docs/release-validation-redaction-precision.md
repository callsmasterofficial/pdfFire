# Positional redaction release validation

PR #7 depends on the PII geometry changes in PR #3. Before merging, validate the complete combined PDF pipeline against current main.

Critical security cases: text split across multiple PDF show operations, repeated matches, nonstandard font metrics, mixed font sizes, operators containing both covered and uncovered characters, and page content crossing redaction boundaries. Check that only covered characters are deleted and untouched text remains. Use an independent PDF parser to ensure target text cannot be extracted from the exported file. Fail closed when the PDF stream or character mapping cannot safely be rewritten. Image pixels, annotations, forms, attachments, and scanned/OCR content must not be described as universally irrecoverable merely because a box hides them.

This is a merge validation checklist, not evidence of a production deployment or a completed manual security audit.
