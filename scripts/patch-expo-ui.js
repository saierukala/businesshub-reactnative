// Works around an Expo SDK 57 bug in @expo/ui (pulled in by expo-router) on Android:
// when the dev launcher hands over to the app, ExpoUIModule's OnDestroy calls
// NativeStatePropsGetter().clearAllContentOrigins(), a native (JNI) method of expo-modules-core that is not
// loaded in that short-lived first React instance -> java.lang.UnsatisfiedLinkError, and the app crashes.
// The call only clears a cache of view positions, so skipping it when the native code is missing is safe.
// Runs after `npm install` (locally and on EAS Build). Remove it once Expo ships a fix.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', '@expo', 'ui', 'android', 'src', 'main', 'java', 'expo', 'modules', 'ui', 'ExpoUIModule.kt');
const from = 'NativeStatePropsGetter().clearAllContentOrigins()';
const to = 'runCatching { NativeStatePropsGetter().clearAllContentOrigins() } // patched by scripts/patch-expo-ui.js';

if (!fs.existsSync(file)) {
  console.log('patch-expo-ui: @expo/ui not installed, nothing to do');
  process.exit(0);
}
const source = fs.readFileSync(file, 'utf8');
if (source.includes(to)) {
  console.log('patch-expo-ui: already patched');
} else if (source.includes(from)) {
  fs.writeFileSync(file, source.replace(from, to));
  console.log('patch-expo-ui: patched ExpoUIModule.kt');
} else {
  console.log('patch-expo-ui: the line is gone (Expo may have fixed it); nothing to do');
}
