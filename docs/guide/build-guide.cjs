// Builds docs/HomeFix-Mobile-Guide.pdf from docs/guide/guide.html.
//   node docs/guide/build-guide.cjs
// The app screenshots come from `npm run shots` (demo-videos/screens/navy-light-*.png); run that first if they are missing.
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const root = path.join(__dirname, '..', '..');
const shots = path.join(root, 'demo-videos', 'screens');
const out = path.join(root, 'docs', 'HomeFix-Mobile-Guide.pdf');

const app = require(path.join(root, 'app.json')).expo;
const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

let html = fs.readFileSync(path.join(__dirname, 'guide.html'), 'utf8')
  .replace('{{VERSION}}', `${app.version} (build ${app.android?.versionCode ?? 1})`)
  .replace('{{DATE}}', date)
  .replace(/\{\{img:([^}]+)\}\}/g, (_, name) => {
    const file = path.join(shots, name);
    if (!fs.existsSync(file)) throw new Error(`Missing screenshot ${name}: run "npm run shots" first`);
    return 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
  });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate:
      '<div style="width:100%;font:8px Segoe UI,Arial,sans-serif;color:#8a93a8;padding:0 16mm;display:flex;justify-content:space-between">' +
      '<span>HomeFix Mobile · Setup, Build &amp; Run Guide</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
  });
  await browser.close();
  console.log('saved', path.relative(root, out), Math.round(fs.statSync(out).size / 1024) + ' KB');
})();
