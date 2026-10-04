# BusinessHub Technician (React Native / Expo)

Mobile app for HomeFix technicians: today's visits, status updates, completing a visit, recording payment.
It only calls the BusinessHub backend API; all rules (availability, transitions, amounts) live there.

## Run it (no deployed backend needed)

1. Backend repo: start Postgres, then `npm run seed` (once) and `npm run dev` (port 4000).
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`:
   - real phone on the same Wi-Fi: `http://<your PC LAN IP>:4000` (find it with `ipconfig`)
   - Android emulator: `http://10.0.2.2:4000`
3. Allow Node.js through Windows Firewall (private networks) or the phone cannot connect.
4. `npm install`, then `npx expo start`. Scan the QR code with the Expo Go app.

Demo login: `rahul@homefix.test` / `Password@123` (from the backend seed).

## How login works
The app sends `X-Client: mobile`, so the backend returns the JWT in the login response.
The token is kept in `expo-secure-store` and sent as `Authorization: Bearer <token>`.
The web app keeps using its httpOnly cookie.

## Layout
- `app/` screens (expo-router, file-based like the Next.js App Router)
- `src/lib/` API client, auth context, types, IST date formatting
- `src/ui/` small shared components and styles

## Commands
`npm run typecheck`, `npx expo start`
