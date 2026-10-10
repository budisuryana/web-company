// QA screenshots for the Workshop CMS redesign. Dev server + dev DB only (127.0.0.1).
// usage: node qa/shoot.cjs <outDir> [--themes=light,dark] [--langs=id,en] [--base=http://127.0.0.1:3200]
const { chromium } = require('/usr/local/lib/hermes-agent/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, '').split('=')));
const OUT = path.resolve(process.argv[2] || 'qa/shots');
const BASE = args.base || 'http://127.0.0.1:3200';
const THEMES = (args.themes || 'light').split(',');
const LANGS = (args.langs || 'id').split(',');
const ONLY = args.only ? args.only.split(',') : null;
const PW = fs.readFileSync('/root/work/devdata/dev-admin.pw', 'utf8').trim();
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
fs.mkdirSync(OUT, { recursive: true });

const report = [];
const log = (...m) => { console.log(...m); report.push(m.join(' ')); };

async function overflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const over = doc.scrollWidth - doc.clientWidth;
    if (over <= 1) return null;
    // Name the widest offenders so a failure is actionable.
    const offenders = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1 && getComputedStyle(el).position !== 'fixed')
      .slice(0, 4)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')}`);
    return `${over}px (${offenders.join(', ')})`;
  });
}

(async () => {
  const browser = await chromium.launch();
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    for (const theme of THEMES) {
      for (const lang of LANGS) {
        const tag = `${vpName}-${theme}-${lang}`;
        const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
        await ctx.addInitScript(([theme, lang]) => {
          try {
            localStorage.setItem('nk-admin-locale', lang);
            localStorage.setItem('nk-studio-theme', theme);
          } catch {}
        }, [theme, lang]);
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`));
        page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(`console: ${m.text().slice(0, 200)}`); });
        // Known dev-data gap: product images referenced by the dev DB are not in local storage.
        page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/manus-storage/')) errors.push(`http ${r.status()}: ${r.url().replace(BASE, '')}`); });

        const shot = async (name, opts = {}) => {
          if (ONLY && !ONLY.includes(name)) return;
          await page.waitForTimeout(opts.wait ?? 500);
          const ov = await overflow(page);
          if (ov) log(`OVERFLOW ${tag} ${name}: ${ov}`);
          await page.screenshot({ path: path.join(OUT, `${name}-${tag}.png`), fullPage: opts.full ?? true });
        };

        // Logged out: login screen
        await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle' });
        await page.waitForSelector('#usernameOrEmail');
        await shot('01-login', { full: false });
        // Validation message (empty submit)
        await page.click('form button[type=submit]');
        await shot('01b-login-error', { full: false, wait: 300 });

        await page.fill('#usernameOrEmail', 'devcms');
        await page.fill('#password', PW);
        await page.click('form button[type=submit]');
        await page.waitForFunction(() => !document.querySelector('#usernameOrEmail'), null, { timeout: 15000 });
        await page.waitForLoadState('networkidle');
        await shot('02-dashboard');

        const go = async (pathname, name, ready) => {
          await page.goto(`${BASE}${pathname}`, { waitUntil: 'networkidle' });
          if (ready) await page.waitForSelector(ready, { timeout: 15000 }).catch(() => log(`WARN ${tag} ${name}: ready selector ${ready} missing`));
          await shot(name);
        };
        await go('/studio/products', '03-products', '#registry-search');
        const editHref = await page.$eval(`a[href^="/studio/products/"]:not([href$="/new"])`, (a) => a.getAttribute('href')).catch(() => null);
        if (editHref) {
          await go(editHref, '04-editor-identity');
          // Confirm dialog: opened, then cancelled — nothing is changed.
          const del = page.getByRole('button', { name: /Delete product|Hapus produk/i }).first();
          if (await del.count()) {
            await del.click();
            await page.waitForSelector('[role="alertdialog"]');
            await shot('09-confirm-dialog', { full: false, wait: 400 });
            await page.getByRole('button', { name: /^(Batal|Cancel)$/ }).click();
            await page.waitForSelector('[role="alertdialog"]', { state: 'detached' });
          }
          for (const [tab, name] of [['story', '04b-editor-story'], ['translations', '04c-editor-translations'], ['capabilities', '04d-editor-capabilities'], ['assets', '04e-editor-assets']]) {
            const trigger = page.locator(`[role="tab"][id$="-trigger-${tab}"]`);
            if (await trigger.count()) { await trigger.click(); await shot(name); }
          }
        }
        await go('/studio/products/new', '05-product-new');
        // Validation summary on an empty create
        const saveBtn = page.locator('button:has-text("Create product"), button:has-text("Buat produk")').first();
        if (await saveBtn.count()) { await saveBtn.click(); await shot('05b-product-new-validation', { wait: 600 }); }
        await go('/studio/inbox', '06-inbox');
        await go('/studio/content', '07-content', '#content-search');
        await go('/studio/users', '08-users');
        // Confirm dialog (opened, then cancelled — nothing is changed)
        const promote = page.locator('button:has-text("Jadikan Admin"), button:has-text("Make Admin")').first();
        if (await promote.count()) {
          await promote.click();
          await page.waitForSelector('[role="alertdialog"]');
          await shot('09-confirm-dialog', { full: false, wait: 400 });
          await page.keyboard.press('Escape');
        }
        if (vpName === 'mobile') {
          const trigger = page.locator('[data-testid="studio-menu-button"], [data-sidebar="trigger"]').first();
          if (await trigger.count()) { await trigger.click(); await shot('10-mobile-sidebar', { full: false, wait: 500 }); }
        }
        if (errors.length) log(`ERRORS ${tag}:\n  ${[...new Set(errors)].join('\n  ')}`);
        else log(`OK ${tag}: no console errors`);
        await ctx.close();
      }
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.txt'), report.join('\n') + '\n');
})().catch((e) => { console.error(e); process.exit(1); });
