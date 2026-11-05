import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "public/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // The Electron main and preload processes are CommonJS by necessity: a
    // sandboxed preload cannot be an ES module, and the main process loads
    // before any bundler. They are Node, not browser code, so the Next/TS
    // rules written for the site do not apply to them.
    files: ["desktop/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // desktop/web is the site's export copied in by sync-web.
    ignores: [
      "desktop/web/**",
      "desktop/node_modules/**",
      "desktop/dist/**",
      // Wrangler's local state and the function bundles it generates.
      ".wrangler/**",
    ],
  },
]);

export default eslintConfig;
