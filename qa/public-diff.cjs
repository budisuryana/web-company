// Public site must be unchanged: pixel-compare branch (3200) against baseline fb6cbd5 (3201).
// Also checks the "after leaving the CMS" case: sign in on the branch, follow the in-app link to /, compare.
const { chromium } = require('/usr/local/lib/hermes-agent/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve('qa/public');
fs.mkdirSync(OUT, { recursive: true });
const BRANCH = 'http://127.0.0.1:3200', BASE = 'http://127.0.0.1:3201';
const PAGES = ['/', '/products', '/products/reconly', '/about', '/contact', '/privacy', '/id', '/id/products', '/id/about', '/id/contact'];
const VPS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const PW = fs.readFileSync('/root/work/devdata/dev-admin.pw', 'utf8').trim();

async function snap(browser, base, route, vp, prepare) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  if (prepare) await prepare(page); else await page.goto(base + route, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.waitForTimeout(1200);
  const buf = await page.screenshot({ fullPage: true });
  const meta = await page.evaluate(() => ({ studio: document.documentElement.hasAttribute('data-studio'), font: getComputedStyle(document.body).fontFamily.split(',')[0], bg: getComputedStyle(document.body).backgroundColor }));
  await ctx.close();
  return { buf, errors, meta };
}

async function diff(browser, a, b) {
  const page = await browser.newPage();
  const result = await page.evaluate(async ([a, b]) => {
    const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { sizeA: [ia.width, ia.height], sizeB: [ib.width, ib.height], diff: -1 };
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height; const x = c.getContext('2d');
    x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data;
    x.clearRect(0, 0, c.width, c.height); x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) n++;
    return { size: [c.width, c.height], diff: n };
  }, ['data:image/png;base64,' + a.toString('base64'), 'data:image/png;base64,' + b.toString('base64')]);
  await page.close();
  return result;
}

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  for (const [vpName, vp] of Object.entries(VPS)) {
    for (const route of PAGES) {
      const base = await snap(browser, BASE, route, vp);
      const branch = await snap(browser, BRANCH, route, vp);
      const d = await diff(browser, base.buf, branch.buf);
      const ok = d.diff === 0 && !branch.errors.length;
      if (!ok) { failures++; const name = `${vpName}${route.replace(/\//g, '_') || '_root'}`; fs.writeFileSync(path.join(OUT, `${name}-base.png`), base.buf); fs.writeFileSync(path.join(OUT, `${name}-branch.png`), branch.buf); }
      console.log(`${ok ? 'SAME' : 'DIFF'} ${vpName} ${route} ${JSON.stringify(d)} studioAttr=${branch.meta.studio} font=${branch.meta.font} ${branch.errors.length ? 'errors=' + branch.errors.join('|') : ''}`);
    }
    // After leaving the CMS through its own link.
    const base = await snap(browser, BASE, '/', vp);
    const left = await snap(browser, BRANCH, '/', vp, async (page) => {
      await page.goto(BRANCH + '/studio', { waitUntil: 'networkidle' });
      await page.fill('#usernameOrEmail', 'devcms'); await page.fill('#password', PW); await page.click('form button[type=submit]');
      await page.waitForSelector('.hq-sidebar'); await page.waitForLoadState('networkidle');
      if (vpName === 'mobile') { await page.click('[data-testid="studio-menu-button"]'); await page.click('.hq-side-foot button'); } else { await page.click('.hq-side-foot button'); }
      await page.click('[role="menuitem"]:has-text("Lihat Situs Publik")');
      await page.waitForURL(BRANCH + '/'); await page.waitForLoadState('networkidle');
    });
    const d = await diff(browser, base.buf, left.buf);
    if (d.diff !== 0) { failures++; fs.writeFileSync(path.join(OUT, `${vpName}-after-cms-base.png`), base.buf); fs.writeFileSync(path.join(OUT, `${vpName}-after-cms-branch.png`), left.buf); }
    console.log(`${d.diff === 0 ? 'SAME' : 'DIFF'} ${vpName} / after leaving CMS ${JSON.stringify(d)} studioAttr=${left.meta.studio} font=${left.meta.font} bg=${left.meta.bg}`);
  }
  await browser.close();
  console.log(failures ? `FAILURES: ${failures}` : 'ALL PUBLIC PAGES IDENTICAL');
})().catch((e) => { console.error(e); process.exit(1); });
