import { defineConfig, type PlaywrightTestConfig } from '@playwright/test';
import config from './playwright.config';
import { e2eDatabaseUrl } from './e2e/env';

// The phone demo recorder (not a test): drives the app at human speed and saves one Full HD clip per part in demo-videos/.
//   npm run demo                (DEMO_SCENES=1,3 re-records only those clips)
// Same two servers as the E2E run, but on its OWN database (businesshub_demo_mobile_e2e), wiped and re-seeded every run.
type WebServer = Extract<NonNullable<PlaywrightTestConfig['webServer']>, unknown[]>[number];
const [api, app] = config.webServer as WebServer[];

// Development mode (not test mode), so events go through the real pg-boss queue and a worker turns them into
// in-app notifications: the bell fills up on camera. SMTP_URL is forced empty, so no real email is sent.
const apiEnv = { ...api.env, NODE_ENV: 'development', SMTP_URL: '', DATABASE_URL: e2eDatabaseUrl('businesshub_demo_mobile_e2e') };

export default defineConfig({
  ...config,
  testDir: './demo',
  testMatch: '**/*.demo.ts',
  projects: undefined, // one desktop-sized page; the phone frame is drawn inside it (demo/scene.ts)
  timeout: 20 * 60_000,
  retries: 0,
  reporter: 'list',
  use: { ...config.use, launchOptions: { slowMo: 120 }, video: 'off', trace: 'off', screenshot: 'off' },
  webServer: [
    { ...api, env: apiEnv },
    { command: 'npx tsx src/worker.ts', cwd: api.cwd, env: { ...apiEnv, LOG_LEVEL: 'info' }, wait: { stdout: /Worker started/ }, timeout: 120_000 },
    app,
  ],
});
