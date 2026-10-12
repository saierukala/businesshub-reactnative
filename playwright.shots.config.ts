import { defineConfig } from '@playwright/test';
import demo from './playwright.demo.config';

// Screenshots of the main screens in several app colours, light and dark (demo/screens.shots.ts).
//   npm run shots      ->  demo-videos/screens/*.png and contact-sheet.png
// Same servers and own database as the demo recorder.
export default defineConfig({ ...demo, testMatch: '**/*.shots.ts' });
