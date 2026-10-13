import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo';

// Which app is this? Two answers, because a development build gets its screens from the PC:
//   installed = the APK on the phone (its app.json, built in at build time)
//   code      = the JavaScript running now (from the PC's `expo start`, or the same as installed in a release)
// Bump "version" and android.versionCode in app.json before every new APK build.
type Config = { version?: string; android?: { versionCode?: number }; extra?: { commit?: string; builtAt?: string } };

function installedConfig(): Config | null {
  try {
    const m = requireOptionalNativeModule<{ manifest?: unknown }>('ExponentConstants')?.manifest;
    return typeof m === 'string' ? (JSON.parse(m) as Config) : ((m as Config) ?? null);
  } catch {
    return null;
  }
}

const day = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

export function versionInfo() {
  const installed = installedConfig();
  const code = Constants.expoConfig as Config | null;
  return {
    app: installed?.version ?? code?.version ?? '?',
    build: installed?.android?.versionCode,
    appCommit: installed?.extra?.commit,
    codeCommit: code?.extra?.commit,
    codeTime: day(code?.extra?.builtAt),
  };
}

// One line, e.g. "Version 1.0.1 (build 2) · code 8fa820d, 13 Oct, 6:40 pm"
export function versionLabel() {
  const v = versionInfo();
  const build = [v.build && `build ${v.build}`, v.appCommit && v.appCommit !== v.codeCommit && v.appCommit].filter(Boolean).join(', ');
  return `Version ${v.app}${build ? ` (${build})` : ''}${v.codeCommit ? ` · code ${v.codeCommit}${v.codeTime ? `, ${v.codeTime}` : ''}` : ''}`;
}
