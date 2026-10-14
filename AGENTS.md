# AGENTS.md — Repository Operating Rules for AI Agents

All AI agents operating in this workspace must strictly follow these instructions:

## 1. Mandatory Pre-Action Step: Read Process & Overview
Before proposing, editing, creating, or deleting ANY file or making architectural changes:
- Read [process.md](file:///Users/callsmaster/Documents/vk/free-pdf/process.md) to check the current project status and active phase.
- Read [project-overview.md](file:///Users/callsmaster/Documents/vk/free-pdf/project-overview.md) to verify constraints, tech stack, and non-goals.

## 2. Mandatory Post-Action Step: Update Process with Date
After completing EVERY task point, feature, or milestone:
- Update [process.md](file:///Users/callsmaster/Documents/vk/free-pdf/process.md) immediately.
- Mark completed items in the Phase Checklist.
- Append a new entry to the **Activity & Progress Log** table with:
  - Exact Date (`YYYY-MM-DD`)
  - Task Point / Item
  - Action Taken & Summary
  - Status
  - Next Planned Step

## 3. Strict Architectural Guardrails
- **100% Client-Side:** No server APIs, no Next.js API routes, no server actions for document processing, no server database, and no cloud document uploads.
- **Privacy-First:** User files must never leave the browser.
- **Sequential Phase Execution:** Work phase-by-phase (Phase 0 -> Phase 1 -> Phase 2 -> ...). Never jump ahead or build placeholder non-functional tools.

## 4. Code Quality & Modularity Standards
- **File Length Limit (Max 160–170 Lines):** Keep files and components concise, strictly under 160–170 lines of code.
- **Sub-Components Extraction:** To avoid large, monolithic files, break complex UIs down into granular sub-components.
- **DRY Principle:** Follow the DRY (Don't Repeat Yourself) principle at all times.
- **Component Reusability:** Extract and reuse components wherever possible (shared inputs, modals, buttons, preview cards, feedback states).


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
