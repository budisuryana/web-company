// Layout route checks: the shell survives in-CMS navigation; unknown /studio/* still reaches the public 404; logout path intact.
const { chromium } = require('/usr/local/lib/hermes-agent/node_modules/playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:3200';
const PW = fs.readFileSync('/root/work/devdata/dev-admin.pw', 'utf8').trim();
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(BASE + '/studio', { waitUntil: 'networkidle' });
  await p.fill('#usernameOrEmail', 'devcms'); await p.fill('#password', PW); await p.click('form button[type=submit]');
  await p.waitForSelector('.hq-sidebar'); await p.waitForLoadState('networkidle');
  await p.evaluate(() => { window.__shell = document.querySelector('.hq-sidebar'); });
  for (const label of ['Katalog Produk', 'Kotak Masuk', 'Profil & Konten', 'Manajemen Pengguna', 'Ringkasan']) {
    await p.click(`.hq-nav a:has-text("${label}")`); await p.waitForLoadState('networkidle');
    const r = await p.evaluate(() => ({ same: window.__shell === document.querySelector('.hq-sidebar'), path: location.pathname, current: document.querySelector('.hq-nav [aria-current=page]')?.textContent, crumb: document.querySelector('.hq-crumbs [aria-current=page]')?.textContent }));
    console.log('nav', label, JSON.stringify(r));
  }
  await p.click('.hq-nav a:has-text("Katalog Produk")'); await p.waitForLoadState('networkidle');
  await p.click('a[href^="/studio/products/"]:not([href$="/new"])'); await p.waitForLoadState('networkidle');
  console.log('editor', JSON.stringify(await p.evaluate(() => ({ same: window.__shell === document.querySelector('.hq-sidebar'), current: document.querySelector('.hq-nav [aria-current=page]')?.textContent, crumb: [...document.querySelectorAll('.hq-crumbs a, .hq-crumbs [aria-current]')].map((e) => e.textContent) }))));
  await p.goto(BASE + '/studio/does-not-exist', { waitUntil: 'networkidle' });
  console.log('unknown /studio/*:', JSON.stringify(await p.evaluate(() => ({ studio: document.documentElement.hasAttribute('data-studio'), h1: document.querySelector('h1')?.textContent?.trim().slice(0, 60) }))));
  console.log('pageerrors:', errs.length ? errs : 'none');
  await b.close();
})();
