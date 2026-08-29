import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const autoriserEvaluationDev = process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'";

const politiqueContenu = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://accounts.google.com",
  `script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com${autoriserEvaluationDev}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://*.gstatic.com https://www.gstatic.com",
  "media-src 'self' data: blob: https://www.wordproaudio.net",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://accounts.google.com https://bolls.life",
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join('; ');

const entetesSecurite = [
  { key: 'Content-Security-Policy', value: politiqueContenu },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(self), browsing-topics=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [{ source: '/(.*)', headers: entetesSecurite }];
  },
};

export default nextConfig;

// Sans cet appel, `getCloudflareContext()` ne rend rien en développement : le
// seau R2 des témoignages serait injoignable en local, et la route
// répondrait 503 alors que tout va bien en production. L'appel ouvre l'accès
// aux liaisons de wrangler.jsonc depuis `next dev`.
if (process.env.NEXT_PUBLIC_E2E_MODE !== '1') {
  void initOpenNextCloudflareForDev();
}
