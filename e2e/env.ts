import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Where the backend repo is (next to this one by default).
export const BACKEND_DIR = resolve(process.env.BACKEND_DIR ?? '../BusinessHub-backend');

// Own ports, so a run never clashes with your dev servers (4000, 8081) or the web app's E2E (4100, 3100).
export const API_PORT = 4200;
export const API_URL = `http://localhost:${API_PORT}`;
export const APP_PORT = 8200;
export const APP_URL = `http://localhost:${APP_PORT}`;

// The run uses its OWN database, wiped and re-seeded before every run. Never the dev database.
export function e2eDatabaseUrl(): string {
  let url = process.env.E2E_DATABASE_URL;
  if (!url) {
    const envFile = resolve(BACKEND_DIR, '.env');
    const dev = existsSync(envFile) ? readFileSync(envFile, 'utf8').match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1] : undefined;
    if (!dev) throw new Error("Set E2E_DATABASE_URL (a Postgres database whose name contains 'e2e').");
    url = dev.replace(/\/[^/?]+(\?|$)/, '/businesshub_e2e_mobile$1');
  }
  const dbName = new URL(url).pathname.slice(1);
  if (!dbName.includes('e2e')) throw new Error(`Refusing to wipe database "${dbName}": the E2E database name must contain "e2e".`);
  return url;
}

export const JWT_SECRET = 'e2e-only-secret-e2e-only-secret-e2e-only-secret-0123456789';
