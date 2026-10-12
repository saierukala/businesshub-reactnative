import type { Role } from '@/lib/auth';

// What each role may do, for the read-only 'Roles & permissions' page.
// This is documentation of the rules the backend enforces (its route guards and services);
// changing this file changes nothing about who is allowed what.

export type Access = 'full' | 'own' | 'none';
export type Permission = { access: Access; note?: string };
export type PermissionRow = { action: string; roles: Record<Role, Permission> };
export type PermissionModule = { module: string; rows: PermissionRow[] };

export const ROLE_ORDER: Role[] = ['OWNER', 'MANAGER', 'TECHNICIAN', 'CUSTOMER'];

export const ROLE_INFO: Record<Role, { label: string; summary: string }> = {
  OWNER: { label: 'Owner', summary: 'Everything, including users, services, appliance types and the audit log.' },
  MANAGER: { label: 'Service Manager', summary: 'Runs the day: bookings for any customer, technicians, schedules, reports.' },
  TECHNICIAN: { label: 'Technician', summary: 'Only the jobs assigned to them: visit steps, notes, extra charges, payment.' },
  CUSTOMER: { label: 'Customer', summary: 'Only their own profile, addresses, appliances, bookings, payments and reviews.' },
};

const full = (note?: string): Permission => ({ access: 'full', note });
const own = (note?: string): Permission => ({ access: 'own', note });
const none: Permission = { access: 'none' };

const row = (action: string, owner: Permission, manager: Permission, technician: Permission, customer: Permission): PermissionRow => ({
  action,
  roles: { OWNER: owner, MANAGER: manager, TECHNICIAN: technician, CUSTOMER: customer },
});

export const PERMISSIONS: PermissionModule[] = [
  {
    module: 'Bookings',
    rows: [
      row('See bookings', full(), full(), own('Assigned jobs'), own()),
      row('Book a repair', full('For any customer'), full('For any customer'), none, own('For themselves')),
      row('Reschedule or cancel', full('Can override time windows, with a reason'), full('Can override time windows, with a reason'), none, own('Within the rules')),
      row('Assign or change technician', full(), full(), none, none),
      row('Mark no-show', full(), full(), none, none),
      row('Book a follow-up visit', full(), full(), own('Their own jobs'), none),
    ],
  },
  {
    module: 'Visits and payments',
    rows: [
      row('On my way, arrived, start, complete', none, none, own('Their own jobs'), none),
      row('Notes and extra charge', none, none, own('Their own jobs'), none),
      row('Approve or decline an extra charge', full("On the customer's behalf"), full("On the customer's behalf"), none, own()),
      row('Record a payment', full(), full(), own('Their own jobs'), none),
      row('See a receipt', full(), full(), own('Their own jobs'), own()),
    ],
  },
  {
    module: 'Customers',
    rows: [
      row('Create, search and edit customers', full(), full(), none, none),
      row('Addresses and appliances', full('Any customer'), full('Any customer'), none, own()),
      row('Invite or create an app code', full(), full(), none, none),
    ],
  },
  {
    module: 'Technicians',
    rows: [
      row('Skills, areas and working hours', full(), full(), none, none),
      row('Time off', full(), full(), none, none),
    ],
  },
  {
    module: 'Catalog',
    rows: [
      row('See services and appliance types', full('Including turned off'), full('Including turned off'), full('Offered only'), full('Offered only')),
      row('Edit services and appliance types', full(), none, none, none),
    ],
  },
  {
    module: 'Reviews',
    rows: [
      row('Write a review', none, none, none, own('After a finished job')),
      row('Read reviews', full(), full(), own('Their own jobs'), own()),
    ],
  },
  {
    module: 'Reports and admin',
    rows: [
      row('Dashboard and reports', full(), full(), own('Their own day'), own('Their own home')),
      row('Users (create, deactivate)', full(), none, none, none),
      row('Audit log', full(), none, none, none),
    ],
  },
];
