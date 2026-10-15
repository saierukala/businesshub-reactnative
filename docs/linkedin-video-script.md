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

> HomeFix: one app to book, run and pay for appliance repairs.

## 1. Customer books a repair (46 s)

On screen: login typed, home, Book tab, appliance, problem and service, address, day and time, review, confirmed.

> Ravi, a customer, logs in on his phone and taps Book. Step one, he picks his LG washing machine. Step two, he types what is wrong, machine is not draining water, and chooses the repair service with its price. Step three, his home address. Step four, he picks a day, and the app shows only the times the server says are free. The phone never decides availability. Step five, he checks the summary and confirms. The booking is confirmed, with its own booking number.

## 2. Manager assigns a technician (16 s)

On screen: manager dashboard, the booking, Assign technician, Rahul Sharma, Assign.

> Vikram, the service manager, opens the new booking on his phone. He taps Assign technician and picks Rahul, who is qualified and free at that time.

## 3. Technician on the job (21 s)

On screen: I'm on my way, I've arrived, Start work, Extra work needed, ₹300, Drain pump clean, waiting.

> Rahul, the technician, runs the visit from his phone. On my way. Arrived. Start work. He finds extra work, a three hundred rupee drain pump clean, and asks the customer to approve it.

## 4. Customer approves the extra charge (17 s)

On screen: notifications, the booking with the progress tracker, Approve.

> Ravi gets a notification. On his booking, the tracker shows the work has started. He reviews the extra charge and taps Approve. Nothing extra is done without his OK.

## 5. Technician completes the visit (22 s)

On screen: What did you find, What did you do, Complete visit, Amount to collect ₹799.

> Rahul writes what he found and what he did, then completes the visit. The app shows the amount to collect, seven hundred and ninety nine rupees: the visit charge plus the approved extra. The server works out every amount.

## 6. Customer pays online on a real phone (31 s)

On screen: real Android phone in dark mode, a completed booking, Pay ₹649 online, Razorpay, Netbanking, test bank page, Success, "Payment successful", Paid by online, receipt.

> Now a real Android phone, in dark mode. The customer opens a finished repair and taps Pay online. Razorpay's secure checkout opens in test mode, so no real money moves. He picks Netbanking and a test bank, and the payment succeeds. The server checks Razorpay's signature, marks the booking paid, and the receipt is ready.

## 7. Manager books for a phone-only customer (34 s)

On screen: New booking, search Priya, her Daikin AC, AC is not cooling, AC Repair, address, day and time, Phone call, confirmed, "call to keep them informed" banner.

> Priya calls the office. She has no app and no email. The manager finds her by name, picks her Daikin air conditioner, types the problem, AC is not cooling, then the service, her address and a free time. He records that the booking came from a phone call and confirms. Because Priya gets no messages, the app reminds staff to call her with updates.

## 8. Owner dashboard and reports (14 s)

On screen: dashboard with revenue and counts, More tab, Reports.

> The owner sees the day at a glance: revenue, bookings, and jobs waiting for a technician. Reports go deeper, by bookings, revenue, services and technicians.

## 9. Roles and permissions (14 s)

On screen: Roles & permissions, Owner, then Technician, then Customer.

> Every role sees only what it is allowed to. Owner, technician, customer. And the server checks these rules on every single request.

## 10. Settings, dark mode (16 s)

On screen: Account, Settings, Dark, home screen in dark mode.

> Every user can pick light or dark mode, and an app colour. Ravi switches to dark mode, and the whole app follows.

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
