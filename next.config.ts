import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

// Sans cet appel, `getCloudflareContext()` ne rend rien en développement : le
// seau R2 des témoignages serait injoignable en local, et la route
// répondrait 503 alors que tout va bien en production. L'appel ouvre l'accès
// aux liaisons de wrangler.jsonc depuis `next dev`.
void initOpenNextCloudflareForDev();
