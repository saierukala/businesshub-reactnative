# HomeFix mobile app: LinkedIn video, clip order and voiceover

All clips are in `demo-videos/` (Full HD 1920x1080, phone in the middle on a soft background).
Total: about **4 minutes** (3 min 51 s of clips plus the title and end cards).

Put the clips in Clipchamp in this exact order. Generate each voiceover line with text-to-speech and drop it at the
start of its clip. Each line is written to finish a little before the clip ends (calm pace, about 2 words per second).
Amounts are written out in words so the voice reads them correctly.

| # | File | Length | What is on screen |
|---|------|--------|-------------------|
| 0 | Title card (make it in Clipchamp) | 6 s | "HomeFix — appliance repair app (React Native + Expo)" |
| 1 | `01-customer-books-a-repair.webm` | 46 s | Ravi types his login, taps Book, 5 steps, booking confirmed |
| 2 | `02-manager-assigns-technician.webm` | 16 s | Manager dashboard, opens the booking, assigns Rahul |
| 3 | `03-technician-on-the-job.webm` | 21 s | On my way, Arrived, Start work, asks for ₹300 extra |
| 4 | `04-customer-approves-extra-charge.webm` | 17 s | Ravi opens notifications, then approves the extra |
| 5 | `05-technician-completes-visit.webm` | 22 s | Notes, Complete visit, ₹799 to collect |
| 6 | `05b-customer-pays-online.webm` | 31 s | Real Android phone (dark mode): Pay online, Razorpay test, receipt |
| 7 | `06-manager-books-for-a-caller.webm` | 34 s | Manager books for Priya (phone-only customer) |
| 8 | `07-owner-dashboard-and-reports.webm` | 14 s | Owner dashboard, More, Reports |
| 9 | `08-owner-roles-and-permissions.webm` | 14 s | Roles & permissions: Owner, Technician, Customer |
| 10 | `09-settings-dark-mode.webm` | 16 s | Account, Settings, Dark, home in dark mode |
| 11 | End card (make it in Clipchamp) | 8 s | Tech stack + "Thanks for watching" |

---

## 0. Title card (6 s)

> This is the HomeFix mobile app, for an appliance repair business, which I built end to end.

## 1. Customer books a repair (46 s)

On screen: login typed, home, Book tab, appliance, problem and service, address, day and time, review, confirmed.

> Ravi, a customer, logs in on his phone. He taps Book a repair. First, he picks his LG washing machine. Next, he types the problem, machine is not draining water, and chooses the repair service, with its price shown upfront. Then he picks his home address. Now he chooses a day, and the app shows only the time slots the server says are free. He picks one. Finally, he checks the summary and taps Confirm. The booking is confirmed, with its own booking number.

## 2. Manager assigns a technician (16 s)

On screen: manager dashboard, the booking, Assign technician, Rahul Sharma, Assign.

> Vikram, the service manager, opens the new booking on his phone. He taps Assign technician and picks Rahul, who is qualified and free at that time.

## 3. Technician on the job (21 s)

On screen: I'm on my way, I've arrived, Start work, Extra work needed, ₹300, Drain pump clean, waiting.

> Rahul, the technician, runs the visit from his phone. On my way. Arrived. Start work. He finds extra work, a three hundred rupee drain pump clean, and asks the customer to approve it.

## 4. Customer approves the extra charge (17 s)

On screen: notifications, the booking with the progress tracker, Approve.

> Ravi gets a notification. On his booking, the tracker shows the work has started. He reviews the extra charge and taps Approve. Nothing extra is done without his OK.

## 5. Technician completes the visit (22 s) — start the audio at 0:03

Timeline: 0:02 job screen (extra approved) · 0:04 types what he found · 0:07–0:12 types what he did · 0:13 taps Complete visit · 0:14 "Visit completed" · 0:17 ₹799 to collect.

> Rahul writes what he found, a drain pump blockage, and what he did: pump cleaned, hose checked, machine tested. He taps Complete visit. Visit completed. The app shows seven hundred and ninety nine rupees to collect, the visit charge plus the approved extra.

## 6. Customer pays online on a real phone (31 s) — start the audio at 0:01

Timeline: 0:01 home (dark mode) · 0:04 My bookings · 0:06 the booking · 0:08 ₹649 to pay, taps Pay online · 0:10 Razorpay opens · 0:12 picks a bank · 0:15 processing · 0:17 test bank, Success · 0:21 paid online · 0:26 receipt.

> Now on a real Android phone, in dark mode. Ravi opens his bookings and picks a finished repair. Six hundred and forty nine rupees to pay. He taps Pay online. Razorpay's secure checkout opens, in test mode. He chooses a bank, the payment processes, and the test bank says Success. Back in the app, it is paid online, and the receipt is ready: six hundred and forty nine rupees received.

## 7. Manager books for a phone-only customer (34 s) — start the audio at 0:02

Timeline: 0:02 Who is this for · 0:04 searches Priya · 0:06 Daikin air conditioner · 0:09–0:14 types the problem, picks AC Repair · 0:15 address · 0:18 day and 9:00 am · 0:23 review · 0:25 Phone call, Confirm · 0:27 booked, "call to keep them informed".

> Priya calls the office. She has no app and no email. The manager finds her and picks her Daikin air conditioner, types the problem, AC is not cooling, and chooses AC repair. Then her address, a day, and a free nine a.m. slot. He reviews it, marks it as a phone call, and confirms. Booked. Since Priya gets no messages, the app reminds staff to call her with updates.

## 8. Owner dashboard and reports (14 s) — start the audio at 0:02

Timeline: 0:02 dashboard (revenue, 1 booking today, 1 waiting for a technician) · 0:06 More · 0:08 Reports.

> The owner sees today at a glance: revenue, bookings, and a job waiting for a technician. From More, she opens Reports: bookings, revenue, services and technicians.

## 9. Roles and permissions (14 s) — start the audio at 0:02

Timeline: 0:02 More · 0:04 Roles and permissions, Owner · 0:07 Technician · 0:09 Customer.

> Roles and permissions. The owner can do everything. A technician, only their own jobs. A customer, only their own bookings. And the server checks every rule.

## 10. Settings, dark mode (16 s) — start the audio at 0:02

Timeline: 0:02 My account · 0:05 Settings · 0:07 Dark · 0:11 home in dark mode.

> In his account, Ravi opens Settings. He can choose light or dark mode, and an app colour. He picks Dark, and the whole app switches. Home, now in dark mode.

## 11. End card (8 s)

> HomeFix. React Native with Expo, a Node.js and PostgreSQL backend, and end to end tests with Playwright. Thanks for watching.

---

### Tips for Clipchamp

- Project size: 1080p (16:9). The clips are already 1920x1080, so nothing is cropped.
- Clip 6 is from the real phone (dark mode); the rest were recorded by Playwright (light). The voiceover says so,
  which reads as a deliberate "and here it is on a real device".
- Add a short caption at the start of each clip (Text → Plain), e.g. "Customer books", "Technician on the job".
- Export at 1080p. LinkedIn accepts videos up to 10 minutes from the phone app and longer from a computer;
  this one is about 4 minutes.
