import { defineConfig, devices } from '@playwright/test';
import { API_PORT, API_URL, APP_PORT, APP_URL, BACKEND_DIR, JWT_SECRET, e2eDatabaseUrl } from './e2e/env';

// Mobile E2E on the app's web build (Expo web), in phone-sized browsers. One test per path.
// Two servers start for the run: the API (port 4200, its own database, wiped and seeded) and Expo web (port 8200).
// Both phone profiles run on Chromium (iPhone 14 = its size, touch and user agent; WebKit is not installed).
// Native-only parts (Razorpay Pay online, secure store) cannot run here: the web build hides Pay online.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // every test shares one database and one technician pool
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: APP_URL,
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'Pixel 7', use: { ...devices['Pixel 7'] } },
    { name: 'iPhone 14', use: { ...devices['iPhone 14'], browserName: 'chromium', defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    {
      // Every migration (including the no-overlap constraint), then an empty E2E database with the demo seed, then the API.
      // NODE_ENV=test: no auth rate limit and no pg-boss worker.
      command: 'npx prisma migrate deploy && npm run e2e:reset && npx tsx src/server.ts',
      cwd: BACKEND_DIR,
      url: `${API_URL}/health/ready`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { NODE_ENV: 'test', PORT: String(API_PORT), DATABASE_URL: e2eDatabaseUrl(), JWT_SECRET, FRONTEND_URL: APP_URL, LOG_LEVEL: 'warn' },
    },
    {
      command: `npx expo start --web --port ${APP_PORT}`,
      url: APP_URL,
      reuseExistingServer: false,
      timeout: 300_000, // the first Metro bundle is slow
      env: { CI: '1', EXPO_PUBLIC_API_URL: API_URL, BROWSER: 'none' },
    },
  ],
});
