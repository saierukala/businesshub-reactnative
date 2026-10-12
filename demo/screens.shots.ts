import { mkdirSync } from 'node:fs';
import { test, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import { USERS, apiFor, tokenFor, visitDay } from '../e2e/helpers';

// Not a test: screenshots of the main screens in several app colours, light and dark, plus one contact sheet
// (demo-videos/screens/contact-sheet.png) to review the look before recording.
//   npm run shots
test.skip(!!process.env.CI, 'only runs on a developer machine');

const WIDTH = Number(process.env.SHOTS_WIDTH ?? 390); // SHOTS_WIDTH=375 checks a smaller phone
const OUT = `demo-videos/screens${WIDTH === 390 ? '' : '-' + WIDTH}`;
const cutOff: string[] = [];
// SHOTS_PALETTES=navy,teal picks colours; default: all 8.
const PALETTES = process.env.SHOTS_PALETTES?.split(',') ?? ['navy', 'khaki', 'teal', 'snow', 'slate', 'midnight', 'dusk', 'mist'];
const MODES = ['light', 'dark'] as const;
type Shot = { name: string; email?: string; path: string; prepare?: (page: Page) => Promise<void> };
type Tech = { id: string; name: string };

// One login per person for the whole run (the demo API rate-limits logins).
const tokens = new Map<string, string>();
const token = async (email: string) => tokens.get(email) ?? tokens.set(email, await tokenFor(email)).get(email)!;

// A booking for Ravi's washing machine with Rahul on `day` (setup through the API).
async function bookWithRahul(api: APIRequestContext, day: string, skip = 0) {
  const ravi = (await (await api.get('/customers?q=Ravi')).json()).items[0];
  const appliance = (await (await api.get(`/appliances?customerId=${ravi.id}`)).json()).items.find((a: { brand: string }) => a.brand === 'LG');
  const address = (await (await api.get(`/addresses?customerId=${ravi.id}`)).json()).items.find((a: { label: string }) => a.label === 'Home');
  const service = (await (await api.get(`/services?categoryId=${appliance.category.id}`)).json()).items[0];
  const { slots } = await (await api.get(`/availability?serviceId=${service.id}&date=${day}&area=${encodeURIComponent(address.area)}`)).json();
  const slot = slots.filter((s: { technicians?: Tech[] }) => s.technicians?.some((t) => t.name === 'Rahul Sharma'))[skip];
  const rahulId = slot.technicians.find((t: Tech) => t.name === 'Rahul Sharma').id;
  const res = await api.post('/bookings', {
    data: { customerId: ravi.id, applianceId: appliance.id, serviceId: service.id, addressId: address.id, problemDescription: 'Machine is not draining water.', startAt: slot.startAt, source: 'PHONE', technicianId: rahulId },
  });
  return (await res.json()).id as string;
}

async function shoot(browser: Browser, palette: string, mode: string, shot: Shot, n: number) {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: 2, colorScheme: mode as 'light' | 'dark' });
  const t = shot.email ? await token(shot.email) : '';
  await context.addInitScript(
    ([t, p, m]) => {
      if (t) localStorage.setItem('bh_token', t);
      localStorage.setItem('palette', p);
      localStorage.setItem('appearance', m);
      const style = document.createElement('style');
      style.textContent = '*{scrollbar-width:none} ::-webkit-scrollbar{display:none}';
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
    },
    [t, palette, mode],
  );
  const page = await context.newPage();
  await page.goto(shot.path);
  await page.waitForFunction(() => !document.querySelector('[role="progressbar"]:not([aria-valuenow])'), null, { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1200);
  if (shot.prepare) await shot.prepare(page);
  await page.screenshot({ path: `${OUT}/${palette}-${mode}-${n}-${shot.name}.png` });
  // Nothing may stick out on the right (cut off on a phone). Things inside a sideways-scrolling or clipping
  // box (the day strip, the filter chips) are fine: they are meant to scroll.
  const wide = await page.evaluate(() => {
    const inScroller = (el: Element) => {
      for (let p = el.parentElement; p; p = p.parentElement) if (['auto', 'scroll', 'hidden'].includes(getComputedStyle(p).overflowX)) return true;
      return false;
    };
    return [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1 && !inScroller(el))
      .map((el) => (el.textContent ?? '').trim().slice(0, 30) || el.tagName)
      .slice(0, 3);
  });
  if (wide.length) cutOff.push(`${palette}-${mode}-${shot.name} (${wide.join(' | ')})`);
  await context.close();
}

test('screens in three app colours, light and dark', async ({ browser }) => {
  test.setTimeout(15 * 60_000);
  mkdirSync(OUT, { recursive: true });

  // Data: one finished visit (with an approved extra charge, not paid yet) and one in progress.
  const manager = await apiFor(USERS.manager);
  const rahul = await apiFor(USERS.rahul);
  const ravi = await apiFor(USERS.ravi);
  const done = await bookWithRahul(manager, visitDay(0), 0);
  const working = await bookWithRahul(manager, visitDay(0), 2);
  for (const id of [done, working]) for (const to of ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS']) await rahul.post(`/bookings/${id}/status`, { data: { to } });
  await rahul.post(`/bookings/${done}/visit/extra-charge`, { data: { amount: 300, reason: 'Drain pump clean' } });
  await ravi.post(`/bookings/${done}/visit/extra-charge/decision`, { data: { decision: 'APPROVED' } });
  await rahul.post(`/bookings/${done}/visit/complete`, { data: { diagnosis: 'Drain pump blockage', workPerformed: 'Pump cleaned, hose checked, machine tested' } });

  const shots: Shot[] = [
    { name: 'login', path: '/login' },
    { name: 'customer-home', email: USERS.ravi, path: '/home' },
    {
      name: 'wizard-step-4',
      email: USERS.ravi,
      path: '/book',
      prepare: async (p) => {
        await p.getByRole('radio', { name: /LG Washing Machine/ }).click();
        await p.getByRole('button', { name: 'Continue' }).click();
        await p.getByLabel('What is wrong?').fill('Machine is not draining water.');
        await p.getByRole('radio', { name: /Washing Machine Repair/ }).click();
        await p.getByRole('button', { name: 'Continue' }).click();
        await p.getByRole('radio', { name: /Home/ }).click();
        await p.getByRole('button', { name: 'Continue' }).click();
        await p.getByTestId(`day-${visitDay(1)}`).click();
        await p.getByTestId('slot').nth(1).click();
        await p.waitForTimeout(600);
      },
    },
    { name: 'booking-detail', email: USERS.ravi, path: `/bookings/${working}` },
    { name: 'technician-job', email: USERS.rahul, path: `/tech/jobs/${working}` },
    { name: 'staff-dashboard', email: USERS.manager, path: '/staff' },
    { name: 'reports', email: USERS.owner, path: '/staff/reports' },
    { name: 'settings', email: USERS.ravi, path: '/settings' },
  ];

  for (const palette of PALETTES) for (const mode of MODES) for (const [i, s] of shots.entries()) await shoot(browser, palette, mode, s, i + 1);

  console.log(cutOff.length ? `  wider than the screen at ${WIDTH}px: ${cutOff.join(', ')}` : `  nothing cut off at ${WIDTH}px`);

  // Contact sheets: a row per colour and mode, a column per screen. One for everything, and one per colour.
  const { writeFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  const sheet = await (await browser.newContext({ viewport: { width: 2100, height: 800 } })).newPage();
  const makeSheet = async (name: string, palettes: string[]) => {
    const rows = palettes.flatMap((p) => MODES.map((m) => ({ p, m })));
    const html = `<html><body style="margin:0;padding:24px;background:#e5e7eb;font:600 18px system-ui">
      ${rows
        .map(
          ({ p, m }) => `<div style="margin-bottom:28px"><div style="margin:0 0 10px 4px">${p[0].toUpperCase() + p.slice(1)} · ${m}</div>
          <div style="display:flex;gap:14px">${shots
            .map((s, i) => `<figure style="margin:0"><img src="${p}-${m}-${i + 1}-${s.name}.png" style="width:240px;border-radius:18px;box-shadow:0 4px 14px #0003;display:block"><figcaption style="font:500 13px system-ui;margin-top:6px;text-align:center">${s.name}</figcaption></figure>`)
            .join('')}</div></div>`,
        )
        .join('')}</body></html>`;
    writeFileSync(`${OUT}/${name}.html`, html);
    await sheet.goto('file:///' + resolve(`${OUT}/${name}.html`).replace(/\\/g, '/'));
    await sheet.waitForTimeout(1500);
    await sheet.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  };
  await makeSheet('contact-sheet', PALETTES);
  for (const p of PALETTES) await makeSheet(`sheet-${p}`, [p]);
});
