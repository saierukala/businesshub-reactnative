import { expect, test } from '@playwright/test';
import { USERS, apiFor, phoneFor, pickSlot, visitDay } from './helpers';

// Staff path: the manager books on behalf of a customer who phoned in (same wizard, plus technician and source).
test('manager books a repair on behalf of a customer', async ({ browser }, info) => {
  const manager = await phoneFor(browser, USERS.manager, info.project.use);
  await manager.goto('/staff/bookings/new');

  await manager.getByPlaceholder('Search name, phone or email').fill('Ravi');
  await manager.getByText('Ravi Kumar').first().click();
  await expect(manager.getByText('Booking for')).toBeVisible();

  await manager.getByRole('radio', { name: /LG Washing Machine/ }).click();
  await manager.getByRole('button', { name: 'Continue' }).click();
  await manager.getByLabel('What is wrong?').fill('Drum makes a loud noise.');
  await manager.getByRole('radio', { name: /Washing Machine Repair/ }).click();
  await manager.getByRole('button', { name: 'Continue' }).click();
  await manager.getByRole('radio', { name: /Home/ }).click();
  await manager.getByRole('button', { name: 'Continue' }).click();

  await pickSlot(manager, visitDay(info.project.name === 'Pixel 7' ? 2 : 3));
  await manager.getByRole('radio', { name: /Rahul Sharma/ }).click(); // staff may pick a free technician
  await manager.getByRole('button', { name: 'Continue' }).click();

  await manager.getByRole('radio', { name: 'Phone call' }).click();
  await manager.getByRole('button', { name: 'Confirm booking' }).click();
  await manager.waitForURL(/\/staff\/bookings\/[0-9a-f-]{36}$/);
  const bookingId = manager.url().split('/').pop()!;

  // The server saved it for Ravi, from the phone, with Rahul.
  const api = await apiFor(USERS.manager);
  const b = await (await api.get(`/bookings/${bookingId}`)).json();
  expect(b.customer.name).toBe('Ravi Kumar');
  expect(b.source).toBe('PHONE');
  expect(b.technician.name).toBe('Rahul Sharma');
});
