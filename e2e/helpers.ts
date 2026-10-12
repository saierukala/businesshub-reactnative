import { expect, request, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import { API_URL } from './env';

// Demo accounts from the backend seed (same well-known demo password for all).
export const DEMO_PASSWORD = 'Password@123';
export const USERS = {
  owner: 'owner@homefix.test',
  manager: 'manager@homefix.test',
  rahul: 'rahul@homefix.test',
  ravi: 'ravi@example.test',
};

// Log in like the app does (X-Client: mobile returns the token in the JSON).
export async function tokenFor(email: string): Promise<string> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API_URL}/auth/login`, { data: { email, password: DEMO_PASSWORD }, headers: { 'X-Client': 'mobile' } });
  expect(res.ok(), `login ${email}`).toBeTruthy();
  const { token } = await res.json();
  await ctx.dispose();
  return token;
}

// A logged-in phone for one person. The web build keeps the token in localStorage (phones use the keystore),
// so it is put there before the app starts. (The login screen itself is the same code for every role.)
export async function phoneFor(browser: Browser, email: string, contextOptions = {}): Promise<Page> {
  const token = await tokenFor(email);
  const context = await browser.newContext(contextOptions);
  await context.addInitScript((t) => localStorage.setItem('bh_token', t), token);
  return context.newPage();
}

// Calling the API directly, to set things up for a test.
export async function apiFor(email: string): Promise<APIRequestContext> {
  return request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Authorization: `Bearer ${await tokenFor(email)}` } });
}

const istDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d); // YYYY-MM-DD
const istWeekday = (d: Date) => new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(d);

// A visit day: `ahead` days from tomorrow in India, skipping Sundays (every technician is off).
export function visitDay(ahead = 0): string {
  let d = new Date(Date.now() + 24 * 3_600_000);
  let left = ahead;
  for (;;) {
    if (istWeekday(d) !== 'Sun') {
      if (left === 0) return istDay(d);
      left--;
    }
    d = new Date(d.getTime() + 24 * 3_600_000);
  }
}

// Step 4 of the booking wizard: the day from the strip, then the first free start time.
export async function pickSlot(page: Page, day: string) {
  await page.getByTestId(`day-${day}`).click();
  await page.getByTestId('slot').first().click();
}
