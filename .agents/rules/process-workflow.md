---
trigger: always_on
---

# Process & Overview Mandatory Rule

Before any file modifications, additions, or code generation:
1. Always read `process.md` and `project-overview.md` first.
2. Confirm architectural constraints (client-side only, no backend/database/cloud uploads).
3. Follow sequential phases.

Code Quality & Structure Standards:
1. Maximum 160–170 lines of code per file/component.
2. Decompose large files into dedicated sub-components.
3. Strictly follow the DRY (Don't Repeat Yourself) principle.
4. Build and leverage reusable components across the codebase.

After each task or sub-task:
1. Update `process.md` with the current date (`YYYY-MM-DD`), the task completed, and next steps in the Activity Log.
2. Keep phase checklist items up-to-date.

