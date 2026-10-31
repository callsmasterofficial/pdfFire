import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The whole product runs in the browser: there are no API routes, no server
  // actions and no request-time data, so the site is exported as static files.
  // That is the cheapest and simplest thing to host, and it keeps the privacy
  // promise literal — there is no server to send a document to.
  output: "export",
  // cacheComponents and partialPrefetching both need a server runtime at
  // request time, which a static export does not have.
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Keep `next build` surfacing published security advisories for this app.
    agentUpgrade: "security",
  },
};

export default nextConfig;
