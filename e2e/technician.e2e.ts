import { expect, test } from '@playwright/test';
import { USERS, apiFor, phoneFor, visitDay } from './helpers';

type Tech = { id: string; name: string };

// Technician path: Rahul runs an assigned visit on his phone to "completed" and records the cash payment.
test('technician completes a visit and records the payment', async ({ browser }, info) => {
  // Setup through the API: the manager books Ravi's washing machine with Rahul.
  const api = await apiFor(USERS.manager);
  const ravi = (await (await api.get('/customers?q=Ravi')).json()).items[0];
  const appliance = (await (await api.get(`/appliances?customerId=${ravi.id}`)).json()).items.find((a: { brand: string }) => a.brand === 'LG');
  const address = (await (await api.get(`/addresses?customerId=${ravi.id}`)).json()).items.find((a: { label: string }) => a.label === 'Home');
  const service = (await (await api.get(`/services?categoryId=${appliance.category.id}`)).json()).items[0];
  const date = visitDay(info.project.name === 'Pixel 7' ? 4 : 5);
  const { slots } = await (await api.get(`/availability?serviceId=${service.id}&date=${date}&area=${encodeURIComponent(address.area)}`)).json();
  const slot = slots.find((s: { technicians?: Tech[] }) => s.technicians?.some((t) => t.name === 'Rahul Sharma'));
  const rahulId = slot.technicians.find((t: Tech) => t.name === 'Rahul Sharma').id;
  const res = await api.post('/bookings', {
    data: { customerId: ravi.id, applianceId: appliance.id, serviceId: service.id, addressId: address.id, problemDescription: 'Not spinning', startAt: slot.startAt, source: 'PHONE', technicianId: rahulId },
  });
  expect(res.ok()).toBeTruthy();
  const booking = await res.json();

  const rahul = await phoneFor(browser, USERS.rahul, info.project.use);
  await rahul.goto(`/tech/jobs/${booking.id}`);
  await rahul.getByRole('button', { name: "I'm on my way" }).click();
  await rahul.getByRole('button', { name: "I've arrived" }).click();
  await rahul.getByRole('button', { name: 'Start work' }).click();
  await expect(rahul.getByRole('button', { name: 'Complete visit' })).toBeVisible();

  await rahul.getByLabel('What did you find?').fill('Worn drive belt');
  await rahul.getByLabel('What did you do?').fill('Belt replaced, spin tested');
  await rahul.getByRole('button', { name: 'Complete visit' }).click();

  await expect(rahul.getByText('Amount to collect')).toBeVisible();
  await rahul.getByRole('radio', { name: /Cash/ }).click();
  await rahul.getByRole('button', { name: 'Payment received' }).click();
  await expect(rahul.getByText(/Paid ₹[\d,]+ by cash/)).toBeVisible();

  const after = await (await api.get(`/bookings/${booking.id}`)).json();
  expect(after.status).toBe('COMPLETED');
  expect(after.payment.method).toBe('CASH');
});
