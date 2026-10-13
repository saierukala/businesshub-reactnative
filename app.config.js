// Adds which code this is to the app config (app.json stays the main config):
//   extra.commit  = the git commit (on EAS Build: the commit that was built)
//   extra.builtAt = when this config was made (the APK build, or `expo start` for the code served from the PC)
// The app shows them, with the version, on the login screen and in Settings (src/lib/version.ts).
const { execSync } = require('child_process');

function commit() {
  if (process.env.EAS_BUILD_GIT_COMMIT_HASH) return process.env.EAS_BUILD_GIT_COMMIT_HASH.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unknown';
  }
}

module.exports = ({ config }) => ({
  ...config,
  extra: { ...config.extra, commit: commit(), builtAt: new Date().toISOString() },
});
