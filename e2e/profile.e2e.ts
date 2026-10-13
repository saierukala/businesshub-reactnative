import { expect, test } from '@playwright/test';
import { USERS, apiFor, phoneFor } from './helpers';

// A technician adds a profile photo from the gallery, then edits their mobile number. Both projects run this
// against the same database, so it starts by clearing the photo and ends by putting the seed phone back.
test('technician uploads a profile photo and edits their phone', async ({ browser }, info) => {
  const api = await apiFor(USERS.rahul);
  await api.delete('/profile/avatar');
  const seedPhone = (await (await api.get('/profile')).json()).profile.phone as string;

  const rahul = await phoneFor(browser, USERS.rahul, info.project.use);
  await rahul.goto('/tech');
  await rahul.getByRole('tab', { name: /Account/ }).click();
  await rahul.getByLabel('Add profile photo').click();

  // A big, non-square picture: the app crops it square and shrinks it before uploading.
  const png = await rahul.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 1600;
    c.height = 1000;
    const g = c.getContext('2d')!;
    g.fillStyle = '#2563eb';
    g.fillRect(0, 0, 1600, 1000);
    return c.toDataURL('image/png').split(',')[1];
  });
  const chooser = rahul.waitForEvent('filechooser');
  await rahul.getByText('Choose from gallery').click();
  await (await chooser).setFiles({ name: 'me.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });

  await expect(rahul.getByText('Photo updated')).toBeVisible();
  await expect(rahul.getByLabel('Change profile photo')).toBeVisible();
  const { profile } = await (await api.get('/profile')).json();
  expect(profile.avatar).toMatch(/^data:image\/jpeg;base64,/);

  await rahul.getByText('Edit profile').click();
  const phone = rahul.getByLabel('Mobile number');
  await phone.fill('9123456780');
  await rahul.getByText('Save changes').click();
  await expect(rahul.getByText('Profile saved')).toBeVisible();
  await expect(rahul.getByText('+91 91234 56780')).toBeVisible();

  await api.patch('/profile', { data: { phone: seedPhone } });
  await api.delete('/profile/avatar');
  await api.dispose();
});
