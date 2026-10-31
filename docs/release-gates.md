# FileMelo release acceptance gates

Updated 2026-10-31. This checklist applies to the website and related extension/mobile releases.

## Code and security

- [x] Establish a reproducible GitHub CI workflow with tests, strict TypeScript, ESLint, production build, and a high-severity production dependency audit (PR #2).
- [ ] Verify each pending pull request against the current `main` tip; respect the #1 → #3 → #7 and #1 → #5 → #6 dependency chains.
- [ ] Run the **combined** regression suite after all overlapping redaction and converter work is integrated; branch-by-branch success alone is insufficient.
- [ ] Independently verify redaction output, including PII text search and disclosure of scan/image limitations; never imply that a visual overlay permanently destroys hidden content.
- [ ] Verify the encrypted PDF fixtures and all supported protection/decryption modes, including genuinely generated AES-128 files.
- [ ] Check all multilingual font packs, their licenses, lazy-loading behavior, complex-script shaping, and truthful copy/extraction limitations. Preserve on-demand CJK.
- [ ] Check DOCX, HTML, XLSX, CSV, Markdown, OCR, text-to-PDF, and long-document pagination against actual output.
- [ ] Perform end-to-end browser tests, accessibility checks, and privacy/CSP review.

## Staging and production

- [ ] Confirm the correct hosting account, environment variables, secrets, origin, and deploy pipeline for the FileMelo website.
- [ ] Repair the custom domain `filemelo.com` (previous verification reported Cloudflare 1014), verify HTTPS and canonical URLs, and confirm the domain serves the intended deployment.
- [ ] Deploy an immutable commit to staging first. Validate all critical tools on desktop and mobile, with realistic input files and malformed files.
- [ ] Set an observable production rollout, rollback procedure, health checks, error telemetry, and cache purge strategy. Deploy to production only after gates pass.
- [ ] Run post-deploy smoke tests and verify the exact live release SHA.

## Extensions and apps

- [ ] Test browser extension unpacked and in supported Chrome/Edge/Firefox/Opera targets; audit manifest permissions and store assets before submission.
- [ ] Confirm paid Pro/Teams product requirements, pricing, billing accounts, entitlement enforcement, and store policies before publishing paid features.
- [ ] Confirm Expo/iOS/Android bundle identifiers, EAS signing credentials, store account access, permissions disclosures, screenshots, tester validation and release approvals.
- [ ] Confirm supported Windows/macOS desktop builds, signing/notarization, update mechanisms and distribution; no untested binaries should be published.

A merged PR is not proof that a domain is serving the app or that a store submission is live.
