import { expect, test } from '@playwright/test';
import { USERS, phoneFor } from './helpers';

// Owner opens the read-only Roles & permissions screen from More.
test('owner opens Roles & permissions', async ({ browser }, info) => {
  const owner = await phoneFor(browser, USERS.owner, info.project.use);
  await owner.goto('/staff/more');
  await owner.getByText('Roles & permissions').click();
  await expect(owner).toHaveURL(/\/staff\/roles$/);
  await expect(owner.getByText('Everything, including users, services')).toBeVisible();

  await owner.getByTestId('role-CUSTOMER').click();
  await expect(owner.getByText('Only their own profile, addresses')).toBeVisible();
  await expect(owner.getByText('Own only').first()).toBeVisible();
});

// Settings: dark mode is saved on the device and is still on after the app restarts (a reload here).
test('dark mode stays on after a reload', async ({ browser }, info) => {
  const ravi = await phoneFor(browser, USERS.ravi, { ...info.project.use, colorScheme: 'light' });
  await ravi.goto('/settings');
  const background = () => ravi.getByTestId('screen').last().evaluate((el) => getComputedStyle(el).backgroundColor);
  await expect(ravi.getByTestId('appearance-light')).toBeVisible();
  const light = await background();

  await ravi.getByTestId('appearance-dark').click();
  await expect.poll(background).not.toBe(light);
  const dark = await background();

  await ravi.reload();
  await expect(ravi.getByTestId('appearance-dark')).toBeVisible();
  await expect.poll(background).toBe(dark);
});
