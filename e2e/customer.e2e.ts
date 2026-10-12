import { expect, test } from '@playwright/test';
import { USERS, phoneFor, pickSlot, visitDay } from './helpers';

// Customer path: Ravi books a washing machine repair himself on his phone, then cancels it.
test('customer books a repair, then cancels it', async ({ browser }, info) => {
  const ravi = await phoneFor(browser, USERS.ravi, info.project.use);
  await ravi.goto('/book');

  await ravi.getByRole('radio', { name: /LG Washing Machine/ }).click();
  await ravi.getByRole('button', { name: 'Continue' }).click();

  await ravi.getByLabel('What is wrong?').fill('Machine is not draining water.');
  await ravi.getByRole('radio', { name: /Washing Machine Repair/ }).click();
  await ravi.getByRole('button', { name: 'Continue' }).click();

  await ravi.getByRole('radio', { name: /Home/ }).click();
  await ravi.getByRole('button', { name: 'Continue' }).click();

  await pickSlot(ravi, visitDay(info.project.name === 'Pixel 7' ? 0 : 1));
  await ravi.getByRole('button', { name: 'Continue' }).click();

  await expect(ravi.getByText('₹499').first()).toBeVisible(); // the visit charge comes from the server
  await ravi.getByRole('button', { name: 'Confirm booking' }).click();
  await ravi.waitForURL(/\/bookings\/[0-9a-f-]{36}$/);
  await expect(ravi.getByText('Confirmed').first()).toBeVisible();

  await ravi.getByRole('button', { name: 'Cancel', exact: true }).click();
  await ravi.getByRole('button', { name: 'Cancel booking' }).click();
  await expect(ravi.getByText('Cancelled').first()).toBeVisible();
});
