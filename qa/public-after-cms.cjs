// After signing in and leaving the CMS via its own "view public site" link, / must look exactly like a fresh /.
// Run on both baseline (old sidebar link) and branch (account-menu link); toasts are allowed to expire first.
const { chromium } = require('/usr/local/lib/hermes-agent/node_modules/playwright');
const fs = require('fs');
const PW = fs.readFileSync('/root/work/devdata/dev-admin.pw', 'utf8').trim();
const VPS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const freeze = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';

async function shot(browser, vp, flow) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await flow(page);
  await page.waitForTimeout(6000); // let the sign-in toast expire
  await page.addStyleTag({ content: freeze });
  await page.waitForTimeout(500);
  const buf = await page.screenshot({ fullPage: true });
  const meta = await page.evaluate(() => ({ studio: document.documentElement.hasAttribute('data-studio'), toasts: document.querySelectorAll('[data-sonner-toast]').length }));
  await ctx.close();
  return { buf, meta };
}
async function login(page, base) {
  await page.goto(base + '/studio', { waitUntil: 'networkidle' });
  await page.fill('#usernameOrEmail', 'devcms'); await page.fill('#password', PW); await page.click('form button[type=submit]');
  await page.waitForFunction(() => !document.querySelector('#usernameOrEmail')); await page.waitForLoadState('networkidle');
}
async function diff(browser, a, b) {
  const page = await browser.newPage();
  const r = await page.evaluate(async ([a, b]) => {
    const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { diff: -1, a: [ia.width, ia.height], b: [ib.width, ib.height] };
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height; const x = c.getContext('2d');
    x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data; x.clearRect(0, 0, c.width, c.height); x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) n++; return { diff: n };
  }, ['data:image/png;base64,' + a.toString('base64'), 'data:image/png;base64,' + b.toString('base64')]);
  await page.close(); return r;
}
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp] of Object.entries(VPS)) {
    const fresh = await shot(browser, vp, (p) => p.goto('http://127.0.0.1:3201/', { waitUntil: 'networkidle' }));
    const baseAfter = await shot(browser, vp, async (p) => {
      const B = 'http://127.0.0.1:3201'; await login(p, B);
      if (name === 'mobile') await p.click('[data-sidebar="trigger"]');
      await p.click('[data-sidebar="menu-button"]:has-text("Lihat Situs Publik")'); await p.waitForURL(B + '/'); await p.waitForLoadState('networkidle');
    });
    const branchAfter = await shot(browser, vp, async (p) => {
      const B = 'http://127.0.0.1:3200'; await login(p, B);
      if (name === 'mobile') await p.click('[data-testid="studio-menu-button"]');
      await p.click('.hq-side-foot button'); await p.click('[role="menuitem"]:has-text("Lihat Situs Publik")'); await p.waitForURL(B + '/'); await p.waitForLoadState('networkidle');
    });
    console.log(name, 'branch-after vs fresh:', JSON.stringify(await diff(browser, fresh.buf, branchAfter.buf)), JSON.stringify(branchAfter.meta),
      '| baseline-after vs fresh:', JSON.stringify(await diff(browser, fresh.buf, baseAfter.buf)), JSON.stringify(baseAfter.meta));
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
