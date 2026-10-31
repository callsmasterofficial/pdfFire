# PII redaction geometry integration checks

This change is stacked on the foundational redaction work in PR #1 and should be merged only after it.

Release acceptance: scan redaction boxes must align with **matched substrings** rather than the whole PDF.js item. Verify punctuation, non-ASCII text, repeated values, overlapping matches, multiline text, and mixed text/image pages. Use an independent parser to confirm covered text is not extractable after redaction. Fail closed for unsupported structures; retain user-facing disclaimers for image content and annotations.

Do not interpret a passing rectangle/overlay snapshot as proof that private information was removed.
