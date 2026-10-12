import { mkdirSync } from 'node:fs';
import type { Browser, Frame, Locator } from '@playwright/test';
import { DEMO_PASSWORD, tokenFor } from '../e2e/helpers';
import { APP_URL } from '../e2e/env';

// One scene = one video clip (demo-videos/NN-name.webm).
// Full HD 1920x1080, the same 16:9 shape as the website clips. The app runs at real phone size (390x844, like an
// iPhone 14) inside a phone frame in the middle, drawn 1.2x bigger. A phone-sized page video would only be 390x844
// (blurry when enlarged); drawing the phone bigger inside an HD page keeps the text sharp.
// Recorded headless by Playwright itself (page video, not a screen capture).
const OUT = 'demo-videos';
const SIZE = { width: 1920, height: 1080 };
const PHONE = { width: 390, height: 844, scale: 1.2 };

let count = 0;

// DEMO_SCENES=1,3 re-records only those clips. Every scene still plays (later ones need the data earlier ones made).
const only = process.env.DEMO_SCENES?.split(',').map((s) => s.trim().padStart(2, '0'));
const keep = (n: string) => !only || only.includes(n);

// The page around the phone. Served at APP_URL/__stage (same origin as the app, so its storage works normally).
const stage = (src: string) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;overflow:hidden}
  body{display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 30% 20%,#e0e7ff,#f1f5f9 55%,#e2e8f0)}
  .phone{width:${PHONE.width}px;height:${PHONE.height}px;border:12px solid #0f172a;border-radius:52px;overflow:hidden;background:#000;
    transform:scale(${PHONE.scale});box-shadow:0 30px 60px rgba(15,23,42,.35)}
  iframe{width:100%;height:100%;border:0;display:block;background:#fff}
</style></head><body><div class="phone"><iframe name="phone" src="${src}"></iframe></div></body></html>`;

type SceneOptions = {
  typeLogin?: boolean; // start on the login screen and type the email and password on camera (else already logged in)
  start: string; // the first app screen, e.g. '/book'
};

export async function scene(browser: Browser, name: string, email: string, opts: SceneOptions, play: (app: Frame) => Promise<void>) {
  const n = String(++count).padStart(2, '0');
  mkdirSync(`${OUT}/checks`, { recursive: true });

  const context = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 1, colorScheme: 'light', recordVideo: { dir: `${OUT}/raw`, size: SIZE } });
  // Logged in through the API first (the token goes where the web build keeps it), so the clip does not start with a login.
  if (!opts.typeLogin) await context.addInitScript((t) => window.name === 'phone' && localStorage.setItem('bh_token', t), await tokenFor(email));
  await context.addInitScript(tapScript);
  await context.route('**/__stage', (route) => route.fulfill({ contentType: 'text/html', body: stage(opts.typeLogin ? '/login' : opts.start) }));
  context.setDefaultTimeout(30_000); // a wrong step fails fast instead of hanging the recording

  const page = await context.newPage();
  await page.goto(`${APP_URL}/__stage`);
  const app = page.frame({ name: 'phone' })!;
  await app.waitForLoadState();

  if (opts.typeLogin) {
    await settle(app, 1200);
    await type(app.getByLabel('Email'), email);
    await type(app.getByLabel('Password'), DEMO_PASSWORD);
    await app.getByRole('button', { name: 'Log in' }).click();
    await app.waitForURL((url) => url.pathname !== '/login');
    if (opts.start !== '/') await app.goto(opts.start);
  }
  await settle(app, 2000);
  await page.screenshot({ path: `${OUT}/checks/${n}-${name}-start.png` });

  let ok = false;
  try {
    await play(app);
    await settle(app, 2500); // hold the last screen for a moment
    await page.screenshot({ path: `${OUT}/checks/${n}-${name}-end.png` });
    ok = true;
  } finally {
    const video = page.video();
    await context.close();
    if (ok && keep(n)) { // a scene that failed never replaces a good clip
      await video?.saveAs(`${OUT}/${n}-${name}.webm`);
      console.log(`  saved ${OUT}/${n}-${name}.webm`);
    }
    await video?.delete();
  }
}

// Human-ish pacing helpers.
export const pause = (app: Frame, ms = 1500) => app.waitForTimeout(ms);

// Wait until the screen is drawn (no spinner), then give the viewer time to read it.
// (A spinner is an ActivityIndicator: role=progressbar without a value. The technician's day bar has a value, so it does not count.)
export async function settle(app: Frame, ms = 1500) {
  await app.waitForFunction(() => !document.querySelector('[role="progressbar"]:not([aria-valuenow])'), null, { timeout: 15_000 }).catch(() => {});
  await app.waitForTimeout(ms);
}

export async function type(field: Locator, text: string) {
  await field.click();
  await field.pressSequentially(text, { delay: 100 });
}

// Tap, then let the next screen load and be read.
export async function tap(app: Frame, target: Locator, ms = 1500) {
  await target.click();
  await settle(app, ms);
}

// Smoothly scroll something into the middle of the phone screen (Playwright's own scrolling jumps).
export async function show(target: Locator, ms = 1200) {
  await target.first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await new Promise((r) => setTimeout(r, ms));
}

// Videos do not show touches. This draws a soft fingertip circle that moves to each tap and pulses on it.
// Only inside the phone; the scrollbars there are hidden too (it still scrolls).
const tapScript = () => {
  if (window.name !== 'phone') return;
  const add = () => {
    const style = document.createElement('style');
    style.textContent = '*{scrollbar-width:none} ::-webkit-scrollbar{display:none}';
    document.head.appendChild(style);
    const dot = document.createElement('div');
    dot.style.cssText =
      'position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;z-index:2147483647;pointer-events:none;' +
      'background:rgba(37,99,235,.25);border:2px solid rgba(37,99,235,.8);transition:transform .35s ease-out, opacity .4s;transform:translate(-80px,-80px)';
    document.body.appendChild(dot);
    let x = -80;
    let y = -80;
    let hide = 0;
    const at = (s = 1) => {
      dot.style.transform = `translate(${x}px,${y}px) scale(${s})`;
      dot.style.opacity = '1';
      clearTimeout(hide);
      hide = window.setTimeout(() => (dot.style.opacity = '0'), 900); // fades after the tap, so it never covers what is shown
    };
    document.addEventListener('mousemove', (e) => ((x = e.clientX), (y = e.clientY), at()), true);
    document.addEventListener('mousedown', () => at(0.6), true);
    document.addEventListener('mouseup', () => at(1), true);
  };
  if (document.body) add();
  else document.addEventListener('DOMContentLoaded', add);
};
