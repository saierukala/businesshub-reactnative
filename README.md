# HomeFix mobile app (React Native, Expo)

The phone app for **BusinessHub**, the HomeFix Appliance Services booking and field-service system.
One app for every role: customers book and track repairs, technicians run their day, owners and managers run the business.

It only talks to the BusinessHub backend API. Availability, prices, allowed status changes and every permission
are decided by the backend; the app shows what the API says and sends what the user picked.

## Screens

| Role | Screens |
| --- | --- |
| Everyone | Log in, forgot password, notifications, account with log out, Settings (light, dark or follow the phone; app colour) |
| Customer | Register, home, book a repair (5 steps), my bookings, booking detail (reschedule, cancel, approve or decline an extra charge, payment, Pay online with Razorpay, receipt, review), addresses and appliances with repair history |
| Technician | Today's jobs, job screen (call, map, on my way, arrived, start work, notes, extra charge, complete, collect cash or UPI, receipt, follow-up visit) |
| Owner / Manager | Dashboard, bookings, booking detail (assign or change technician, reschedule, cancel, no-show, follow-up, record payment), new booking for a customer, customers, technicians (skills, areas, hours, time off), needs reassignment, reports, reviews |
| Owner only | Services, users, audit log, roles & permissions (read-only) |

Reset-password, invite and verification emails also contain a 6-digit code: in the app use "Forgot password" (code + new password), "I have a code from HomeFix" on the login screen (set up an account), or the code box under "Verify your email". Owner/Manager can create an invite or verification code for a customer ("Create app code" on the customer page, web or app) to read out over the phone. Codes work once, for 15 minutes, with 5 tries.

## Pay online (Razorpay, test mode)

A customer pays a completed visit with the native Razorpay SDK (`react-native-razorpay`). The server makes the order and the amount,
and checks Razorpay's signature before marking the booking paid (same endpoints as the web).
The button shows only when the backend has Razorpay **test** keys, and only in a **development build**: Expo Go and the browser
preview have no Razorpay native module, so there it is hidden and cash / UPI to the technician still works.

```bash
npx expo run:android
```

That runs prebuild (makes the `android/` folder) and needs Android Studio. Without Android Studio, build in Expo's cloud
(free Expo account) and install the APK from the link it prints:

```bash
npx eas-cli@latest build --profile development --platform android
```

Then `npx expo start` and open the project in the installed **HomeFix** app (not Expo Go).
In the Razorpay screen choose UPI and enter `success@razorpay`.

## Demo video clips (phone screens, for LinkedIn)

```bash
npm run demo
```

Playwright plays the story at human speed and saves one Full HD (1920x1080) clip per part in `demo-videos/`: the app at
real phone size inside a phone frame, with a soft circle showing each tap. Its own database is wiped and seeded every run
(the API runs with the worker, so notifications appear). `DEMO_SCENES=2,5` re-records only those clips.
`demo-videos/checks/` has the first and last frame of each clip. The Razorpay payment itself is filmed on a real phone
(development build, see above). Code: `demo/record.demo.ts` (the story) and `demo/scene.ts` (frame, pacing, taps).
The clips use the default look: Navy, light.

To review the look without recording, `npm run shots` saves the main screens in every app colour, light and dark, in
`demo-videos/screens/` (one `sheet-<colour>.png` per colour, plus `contact-sheet.png`), and reports any screen wider than
the phone. `SHOTS_PALETTES=navy,teal` limits the colours, `SHOTS_WIDTH=375` checks a smaller phone.

## App colours (look only)

Settings → App colour offers the website's 8 sidebar palettes: Navy (default), Khaki, Teal, Snow, Slate, Midnight, Dusk,
Mist. The palette colours the header, the tab bar, buttons, hero cards and charts, in light and dark mode. It is saved on
the device, like light/dark. All colours come from `src/ui/theme.ts` (`buildTheme`); screens use `useAppTheme()`.

## Run it on your phone (no deployed backend needed)

1. Backend repo: start Postgres, `npm run seed` (once), then `npm run dev` (port 4000).
2. Here: copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`:
   - real phone on the same Wi-Fi: `http://<your PC's IPv4 address>:4000` (find it with `ipconfig`)
   - Android emulator: `http://10.0.2.2:4000`
3. Allow Node.js through Windows Firewall (private networks), or the phone cannot connect.
4. `npm install`, then `npx expo start -c`. Scan the QR code with the **Expo Go** app.

Check from the phone's browser first: `http://<PC IP>:4000/health` should answer `{"status":"ok"}`.

### Demo logins (from the backend seed, password `Password@123`)

`ravi@example.test` (customer), `rahul@homefix.test` (technician), `manager@homefix.test`, `owner@homefix.test`.
In development the login screen has buttons that fill these in.

### Browser preview (development only)

`npm run web -- --port 3000` opens the app in a browser. Use port 3000: the backend's CORS setting (`FRONTEND_URL`) allows that origin.
The browser has no secure store, so the token is kept in `localStorage` there. Phones always use the keystore.

## How login works

The app sends `X-Client: mobile` on login and register, so the backend also returns the JWT in the JSON
(the web app never gets it, it keeps its httpOnly cookie). The token is stored with `expo-secure-store`
and sent as `Authorization: Bearer <token>`. Any 401 clears it and goes back to the login screen.
Logging out also clears every cached query, so the next user never sees the previous user's data.

## Stack

Expo (SDK 57), expo-router (file-based routes), React Native Paper (Material 3 components and theme),
react-native-paper-dates (date and time pickers), TanStack Query, React Hook Form, Zod.
The API types, query hooks and Zod schemas in `src/lib` follow the web app, so both clients send the same requests.

## Folders

- `app/` routes. `(auth)` login screens; `(customer)`, `(tech)`, `(staff)` one folder per role, each with a tab bar and detail screens. `app/_layout.tsx` keeps each role inside its own area.
- `src/lib/` API client, auth context, types, IST date and money formatting, query hooks, Zod schemas.
- `src/features/` screens and sections: booking (wizard, slot picker, detail, dialogs, receipt), records, tech, staff.
- `src/ui/` theme, layout, form fields, pickers, cards, empty/error/loading states, toasts.

## Commands

- `npx expo start -c` run the app (Expo Go)
- `npm run typecheck` TypeScript
- `npm test` unit tests (IST dates, money, time-off conversion)

## Real-world notes

- **Time:** every date and time is shown in India time (`Asia/Kolkata`), whatever the phone's timezone. The date strip and slots come from the API.
- **Races:** if a slot is taken while you are choosing, the API answers 409; the app shows the message and asks you to pick again from a fresh list.
- **Plain http:** fine for local testing in Expo Go. A store build must use the HTTPS backend URL.
