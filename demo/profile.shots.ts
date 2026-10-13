import { mkdirSync } from 'node:fs';
import { test, type Page } from '@playwright/test';
import { USERS, apiFor, tokenFor } from '../e2e/helpers';

// Not a test: screenshots of the profile photo screens (demo-videos/profile/*.png).
//   npx playwright test -c playwright.shots.config.ts demo/profile.shots.ts
test.skip(!!process.env.CI, 'only runs on a developer machine');

const OUT = 'demo-videos/profile';

// A stand-in portrait (head and shoulders on a soft gradient), as a JPEG data URL like the app uploads.
async function portrait(page: Page, from: string, to: string) {
  return page.evaluate(
    ([a, b]) => {
      const c = document.createElement('canvas');
      c.width = c.height = 512;
      const g = c.getContext('2d')!;
      const bg = g.createLinearGradient(0, 0, 512, 512);
      bg.addColorStop(0, a);
      bg.addColorStop(1, b);
      g.fillStyle = bg;
      g.fillRect(0, 0, 512, 512);
      g.fillStyle = '#f1d3b8';
      g.beginPath();
      g.arc(256, 210, 96, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#3b2a20';
      g.beginPath();
      g.arc(256, 180, 100, Math.PI, 0);
      g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.ellipse(256, 520, 190, 190, 0, Math.PI, 0);
      g.fill();
      return c.toDataURL('image/jpeg', 0.85);
    },
    [from, to],
  );
}

async function phone(browser: import('@playwright/test').Browser, email: string, mode: 'light' | 'dark' = 'light') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: mode });
  await context.addInitScript(([t, m]) => {
    localStorage.setItem('bh_token', t);
    localStorage.setItem('appearance', m);
  }, [await tokenFor(email), mode]);
  return context.newPage();
}

const settle = (page: Page) => page.waitForTimeout(1200);

test('profile photo screens', async ({ browser }) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  const rahulApi = await apiFor(USERS.rahul);
  const raviApi = await apiFor(USERS.ravi);
  await rahulApi.delete('/profile/avatar');

  // 1. Technician, no photo yet: initials with the camera badge.
  const rahul = await phone(browser, USERS.rahul);
  await rahul.goto('/tech');
  await rahul.getByRole('tab', { name: /Account/ }).click();
  await settle(rahul);
  await rahul.screenshot({ path: `${OUT}/1-no-photo.png` });

  // 2. Tap the photo: gallery / camera / remove.
  await rahul.getByLabel('Add profile photo').click();
  await settle(rahul);
  await rahul.screenshot({ path: `${OUT}/2-photo-menu.png` });
  await rahul.getByText('Cancel').click();

  // 3. With a photo.
  await rahulApi.put('/profile/avatar', { data: { image: await portrait(rahul, '#93c5fd', '#1e3a8a') } });
  await rahul.reload();
  await rahul.getByRole('tab', { name: /Account/ }).click();
  await settle(rahul);
  await rahul.screenshot({ path: `${OUT}/3-with-photo.png` });

  // 4. Edit profile form.
  await rahul.getByText('Edit profile').click();
  await settle(rahul);
  await rahul.screenshot({ path: `${OUT}/4-edit-profile.png` });

  // 5. Customer, dark mode, with a photo.
  const ravi = await phone(browser, USERS.ravi, 'dark');
  await raviApi.put('/profile/avatar', { data: { image: await portrait(ravi, '#fcd34d', '#c2410c') } });
  await ravi.goto('/account');
  await settle(ravi);
  await ravi.screenshot({ path: `${OUT}/5-customer-dark.png` });

  await rahulApi.dispose();
  await raviApi.dispose();
});
