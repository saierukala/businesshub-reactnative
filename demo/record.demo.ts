import { expect, test } from '@playwright/test';
import { USERS, visitDay } from '../e2e/helpers';
import { pause, scene, settle, show, tap, type } from './scene';

// Not a test: records the phone part of the LinkedIn demo, one clip per part, in story order.
//   npm run demo
// The real Razorpay payment is filmed on a real phone (a development build); here the story stops at
// "visit completed, amount to collect", which is where that phone clip starts.
test.skip(!!process.env.CI, 'the demo recorder only runs on a developer machine');

test('record the phone demo', async ({ browser }) => {
  let bookingId = '';

  // ---- 1. Ravi logs in on his phone and books a washing machine repair (5 steps) ----
  await scene(browser, 'customer-books-a-repair', USERS.ravi, { typeLogin: true, start: '/home' }, async (app) => {
    await tap(app, app.getByRole('tab', { name: /Book$/ }));
    await tap(app, app.getByRole('radio', { name: /LG Washing Machine/ }), 800);
    await tap(app, app.getByRole('button', { name: 'Continue' }));
    await type(app.getByLabel('What is wrong?'), 'Machine is not draining water.');
    await tap(app, app.getByRole('radio', { name: /Washing Machine Repair/ }), 800);
    await tap(app, app.getByRole('button', { name: 'Continue' }));
    await tap(app, app.getByRole('radio', { name: /Home/ }), 800);
    await tap(app, app.getByRole('button', { name: 'Continue' }));
    await tap(app, app.getByTestId(`day-${visitDay()}`));
    await tap(app, app.getByTestId('slot').first(), 800);
    await tap(app, app.getByRole('button', { name: 'Continue' }), 2500); // the review step
    await app.getByRole('button', { name: 'Confirm booking' }).click();
    await app.waitForURL(/\/bookings\/[0-9a-f-]{36}$/);
    bookingId = app.url().split('/').pop()!;
    await expect(app.getByText('Confirmed').first()).toBeVisible();
    await settle(app, 2000);
  });

  // ---- 2. The manager opens it from the dashboard and assigns Rahul ----
  await scene(browser, 'manager-assigns-technician', USERS.manager, { start: '/staff' }, async (app) => {
    await pause(app, 1500);
    await app.goto(`/staff/bookings/${bookingId}`);
    await settle(app);
    await tap(app, app.getByRole('button', { name: 'Assign technician' }));
    await tap(app, app.getByRole('radio', { name: /Rahul Sharma/ }), 800);
    await tap(app, app.getByRole('button', { name: 'Assign', exact: true }));
    await expect(app.getByRole('button', { name: 'Change technician' })).toBeVisible();
  });

  // ---- 3. Rahul on the job: on the way, arrived, start work, asks for an extra charge ----
  await scene(browser, 'technician-on-the-job', USERS.rahul, { start: `/tech/jobs/${bookingId}` }, async (app) => {
    for (const step of ["I'm on my way", "I've arrived", 'Start work']) await tap(app, app.getByRole('button', { name: step }));
    await tap(app, app.getByRole('button', { name: 'Extra work needed' }), 800);
    await type(app.getByLabel('Extra amount (₹)'), '300');
    await type(app.getByLabel('What is the extra work?'), 'Drain pump clean');
    await tap(app, app.getByRole('button', { name: 'Ask the customer to approve' }));
    await show(app.getByText('Waiting for the customer to answer the extra charge.'), 2000);
  });

  // ---- 4. Ravi gets the notification and approves the extra charge ----
  await scene(browser, 'customer-approves-extra-charge', USERS.ravi, { start: '/home' }, async (app) => {
    await tap(app, app.getByRole('button', { name: /^Notifications/ }), 3000);
    await app.goto(`/bookings/${bookingId}`);
    await settle(app);
    await show(app.getByRole('button', { name: 'Approve' }), 1500);
    await tap(app, app.getByRole('button', { name: 'Approve' }));
    await expect(app.getByRole('button', { name: 'Approve' })).toBeHidden();
  });

  // ---- 5. Rahul writes what he did and completes the visit: 499 + 300 = 799 to collect ----
  await scene(browser, 'technician-completes-visit', USERS.rahul, { start: `/tech/jobs/${bookingId}` }, async (app) => {
    await type(app.getByLabel('What did you find?'), 'Drain pump blockage');
    await type(app.getByLabel('What did you do?'), 'Pump cleaned, hose checked, machine tested');
    await tap(app, app.getByRole('button', { name: 'Complete visit' }), 2000);
    await show(app.getByText('Amount to collect'), 2500);
  });

  // ---- 6. A phone-only customer calls: the manager books for her on his phone ----
  await scene(browser, 'manager-books-for-a-caller', USERS.manager, { start: '/staff/bookings/new' }, async (app) => {
    await type(app.getByPlaceholder('Search name, phone or email'), 'Priya');
    await settle(app, 1000);
    await tap(app, app.getByText('Priya Nair').first());
    await tap(app, app.getByRole('radio', { name: /Daikin Air Conditioner/ }), 800);
    await tap(app, app.getByRole('button', { name: 'Continue' }));
    await type(app.getByLabel('What is wrong?'), 'AC is not cooling.');
    await tap(app, app.getByRole('radio', { name: /AC Repair/ }), 800);
    await tap(app, app.getByRole('button', { name: 'Continue' }));
    await tap(app, app.getByRole('radio', { name: /Home/ }), 800);
    await tap(app, app.getByRole('button', { name: 'Continue' }));
    await tap(app, app.getByTestId(`day-${visitDay(1)}`));
    await tap(app, app.getByTestId('slot').first(), 1200); // then the free technicians for that time
    await tap(app, app.getByRole('button', { name: 'Continue' }), 2000);
    await tap(app, app.getByRole('radio', { name: 'Phone call' }), 800);
    await app.getByRole('button', { name: 'Confirm booking' }).click();
    await app.waitForURL(/\/staff\/bookings\/[0-9a-f-]{36}$/);
    await settle(app, 2500); // the "phone-only customer: call to keep them informed" banner
  });

  // ---- 7. The owner's day: dashboard, then reports ----
  await scene(browser, 'owner-dashboard-and-reports', USERS.owner, { start: '/staff' }, async (app) => {
    await pause(app, 2000);
    await tap(app, app.getByRole('tab', { name: /More$/ }));
    await tap(app, app.getByText('Reports', { exact: true }), 3000);
  });

  // ---- 8. Roles & permissions: what each role may do (checked by the server) ----
  await scene(browser, 'owner-roles-and-permissions', USERS.owner, { start: '/staff/more' }, async (app) => {
    await tap(app, app.getByText('Roles & permissions'), 2500);
    await tap(app, app.getByTestId('role-TECHNICIAN'), 2000);
    await tap(app, app.getByTestId('role-CUSTOMER'), 2500);
  });

  // ---- 9. Settings: dark mode ----
  await scene(browser, 'settings-dark-mode', USERS.ravi, { start: '/account' }, async (app) => {
    await show(app.getByText('Settings', { exact: true }), 1000);
    await tap(app, app.getByText('Settings', { exact: true }));
    await tap(app, app.getByTestId('appearance-dark'), 2000);
    await app.goto('/home');
    await settle(app, 2500);
  });
});
