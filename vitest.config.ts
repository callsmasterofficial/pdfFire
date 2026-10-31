import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    // Parsing PDFs with PDF.js is slower than the pure pdf-lib tests.
    testTimeout: 30000,
  },
});
