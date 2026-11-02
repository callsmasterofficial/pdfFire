import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // Mirror the "@/*" -> "src/*" mapping from tsconfig. Type-only imports are
  // erased before vitest sees them, so this only began to matter when a module
  // imported a runtime value through the alias.
  resolve: {
    alias: {
      // process.cwd() rather than __dirname: this config is currently loaded as
      // CommonJS, but Vite warns that will change, and __dirname would break then.
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    // Parsing PDFs with PDF.js is slower than the pure pdf-lib tests.
    testTimeout: 30000,
  },
});
