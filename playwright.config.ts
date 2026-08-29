import { defineConfig, devices } from '@playwright/test';

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Next compile les routes a la demande en developpement. Un seul navigateur
  // evite que quatre premieres compilations se disputent le meme cache.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Africa/Lome',
  },
  projects: [
    { name: 'chromium-bureau', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Le bac a sable de test n'a pas toujours acces a fonts.gstatic.com.
    // Webpack sait reutiliser le cache de next/font, tandis que Turbopack
    // transforme ce cas en erreur de resolution interne.
    command: `NEXT_PUBLIC_E2E_MODE=1 npm run dev -- --webpack --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
