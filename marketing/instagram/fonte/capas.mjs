import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
for (const id of ['chaveiros','religiosos','casa']) { await p.goto(`http://localhost:8765/capa.html?id=${id}`); await p.waitForFunction(() => window.PRONTO); await p.screenshot({ path: `out/destaque-${id}.png` }); }
await b.close();
