import { chromium } from 'playwright-core';
const ids = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
p.on('console', (m) => console.log('[console]', m.text()));
p.on('pageerror', (e) => console.log('[erro]', e.message));
for (const id of ids) {
  await p.goto(`http://localhost:8765/foto.html?id=${id}`);
  await p.waitForFunction(() => window.PRONTO === true, null, { timeout: 300000 });
  await p.screenshot({ path: `out-foto/${id}.png` });
  console.log('ok', id);
}
await b.close();
