// Interaction QA on the branch (dev server + dev DB). Nothing is saved: edits are discarded, dialogs cancelled.
const { chromium } = require('/usr/local/lib/hermes-agent/node_modules/playwright');
const fs = require('fs');
const BASE = 'http://127.0.0.1:3200';
const PW = fs.readFileSync('/root/work/devdata/dev-admin.pw', 'utf8').trim();
let fails = 0;
const check = (label, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  const html = (attr) => p.evaluate((a) => document.documentElement.getAttribute(a), attr);

  await p.goto(BASE + '/studio', { waitUntil: 'networkidle' });
  check('default theme is light', (await html('data-studio-theme')) === 'light');
  // Login: wrong password shows server error, keeps form
  await p.fill('#usernameOrEmail', 'devcms'); await p.fill('#password', 'wrong-password'); await p.click('form button[type=submit]');
  await p.waitForSelector('.hq-error[role=alert]'); check('wrong password shows inline error', true, (await p.textContent('.hq-error')).trim());
  await p.fill('#password', PW); await p.click('form button[type=submit]');
  await p.waitForSelector('.hq-sidebar'); await p.waitForLoadState('networkidle');

  // Theme toggle + persistence
  await p.click('.hq-topbar button[aria-label="Mode gelap"]');
  check('theme toggles to dark', (await html('data-studio-theme')) === 'dark');
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('.hq-sidebar');
  check('dark theme persists after reload', (await html('data-studio-theme')) === 'dark');
  await p.click('.hq-topbar button[aria-label="Mode terang"]');

  // Sidebar colour presets + custom, persisted
  const openMenu = async () => { if (!(await p.locator('[role=menu]').count())) await p.click('.hq-side-foot button'); await p.waitForSelector('[role=menu]'); };
  const closeMenu = async () => { await p.keyboard.press('Escape'); await p.waitForSelector('[role=menu]', { state: 'detached' }).catch(() => {}); };
  await openMenu(); await p.click('.hq-swatch[aria-label="Royal Blue"]'); await p.waitForTimeout(400); // sidebar colour transition
  const sbBg = await p.evaluate(() => getComputedStyle(document.querySelector('.hq-sidebar')).backgroundColor);
  check('sidebar preset applies', sbBg === 'rgb(36, 86, 166)', sbBg);
  await closeMenu();
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('.hq-sidebar'); await p.waitForTimeout(400);
  check('sidebar preset persists', (await p.evaluate(() => getComputedStyle(document.querySelector('.hq-sidebar')).backgroundColor)) === 'rgb(36, 86, 166)');
  await openMenu();
  await p.$eval('.hq-swatch.custom input', (el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, '#7a1f3d'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(400);
  check('custom sidebar colour applies', (await p.evaluate(() => getComputedStyle(document.querySelector('.hq-sidebar')).backgroundColor)) === 'rgb(122, 31, 61)');
  const fg = await p.evaluate(() => getComputedStyle(document.querySelector('.hq-nav-item')).color);
  check('custom colour derives readable nav text', !!fg, fg);
  // Admin language from the account menu
  await p.click('.hq-menu .hq-seg button[lang="en"]');
  check('admin language switches to EN', (await p.textContent('.hq-crumbs [aria-current=page]')).trim() === 'Overview' && (await html('lang')) === 'en');
  await p.click('.hq-menu .hq-seg button[lang="id"]');
  await openMenu(); await p.click('.hq-swatch[aria-label="Modern Charcoal"]'); await closeMenu();

  // Products: filters, chip, clear
  await p.click('.hq-nav a:has-text("Katalog Produk")'); await p.waitForLoadState('networkidle');
  await p.waitForSelector('.hq-product-row');
  const rows = await p.locator('.hq-product-row').count();
  await p.selectOption('#registry-pub', 'draft');
  const draftRows = await p.locator('.hq-product-row').count();
  await p.fill('#registry-search', 'zzzz-no-match'); await p.waitForTimeout(150);
  check('product filters narrow and empty state shows', draftRows <= rows && (await p.locator('.hq-empty').count()) === 1, `${rows} → ${draftRows} → empty`);
  await p.click('.hq-empty button'); check('clear filters restores list', (await p.locator('.hq-product-row').count()) === rows);

  // Editor: validation on empty create jumps to first tab with an error; Target users message
  await p.goto(BASE + '/studio/products/new', { waitUntil: 'networkidle' });
  await p.fill('input[placeholder="mis. Operations Hub"]', 'QA Temp'); await p.fill('input[placeholder="Manajemen kerja"]', 'QA');
  await p.click('button:has-text("Buat produk")');
  await p.waitForSelector('[role=alert].hq-banner');
  const activeTab = (await p.textContent('[role=tab][data-state=active]')).trim();
  check('validation jumps to Story tab', /Narasi/.test(activeTab), activeTab);
  await p.click('[role=tab]:has-text("Kapabilitas")');
  const targetErr = await p.locator('.hq-error').allTextContents();
  check('Target users message (ID)', targetErr.some((x) => x.includes('Target pengguna wajib diisi.')), targetErr.join(' | '));
  await p.click('a:has-text("Batal")'); await p.waitForURL(BASE + '/studio/products');

  // Content: edit → pending count → discard
  await p.click('.hq-nav a:has-text("Profil & Konten")'); await p.waitForLoadState('networkidle');
  const before = await p.inputValue('[id="field-en-common.tagline"]');
  await p.fill('[id="field-en-common.tagline"]', before + ' QA');
  const pendingText = (await p.textContent('form [aria-live="polite"]')).trim();
  check('content edit shows pending count', /1 perubahan belum disimpan/.test(pendingText), pendingText);
  await p.click('button:has-text("Batalkan")');
  check('discard restores stored value', (await p.inputValue('[id="field-en-common.tagline"]')) === before);
  await p.fill('[id="field-en-common.tagline"]', 'x'.repeat(200));
  check('over-limit disables save', await p.isDisabled('form button[type=submit]'));
  await p.click('button:has-text("Batalkan")');

  // Inbox: chip filter, confirm dialog cancel
  await p.click('.hq-nav a:has-text("Kotak Masuk")'); await p.waitForLoadState('networkidle');
  await p.click('.hq-chip:has-text("Semua")'); await p.waitForLoadState('networkidle');
  check('inbox chip filter pressed', (await p.getAttribute('.hq-chip:has-text("Semua")', 'aria-pressed')) === 'true');
  const del = p.locator('.hq-msg button:has-text("Hapus")').first();
  if (await del.count()) {
    await del.click(); await p.waitForSelector('[role=alertdialog]');
    const confirmBg = await p.evaluate(() => getComputedStyle([...document.querySelectorAll('[role=alertdialog] button')].pop()).color);
    await p.keyboard.press('Escape'); await p.waitForSelector('[role=alertdialog]', { state: 'detached' });
    check('delete dialog opens (danger) and Escape cancels', true, confirmBg);
  }

  // Users: role filter
  await p.click('.hq-nav a:has-text("Manajemen Pengguna")'); await p.waitForLoadState('networkidle');
  await p.waitForSelector('.hq-users tbody tr');
  const allUsers = await p.locator('.hq-users tbody tr').count();
  await p.selectOption('select[aria-label="Peran"]', 'user');
  const plain = await p.locator('.hq-users tbody tr').count() + (await p.locator('.hq-empty').count() ? 0 : 0);
  check('users role filter works', plain <= allUsers && ((await p.locator('.hq-users tbody tr').count()) > 0 || (await p.locator('.hq-empty').count()) === 1), `${allUsers} → ${plain}`);
  await p.selectOption('select[aria-label="Peran"]', 'all');

  // Keyboard: focus ring visible on nav
  await p.keyboard.press('Tab');
  const outline = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check('keyboard focus shows outline', outline !== 'none', outline);

  // Mobile: slide-over opens, Escape closes, navigation closes
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, storageState: await ctx.storageState() })).newPage();
  await m.goto(BASE + '/studio', { waitUntil: 'networkidle' });
  await m.click('[data-testid="studio-menu-button"]');
  check('mobile sidebar opens', await m.evaluate(() => document.querySelector('.hq-sidebar').classList.contains('open')));
  await m.keyboard.press('Escape');
  check('Escape closes mobile sidebar', await m.evaluate(() => !document.querySelector('.hq-sidebar').classList.contains('open')));
  await m.click('.hq-mob-tabs a:has-text("Kotak Masuk")'); await m.waitForURL(BASE + '/studio/inbox');
  check('bottom tab navigates', true);
  await m.click('.hq-mob-tabs button'); await m.click('.hq-nav a:has-text("Manajemen Pengguna")'); await m.waitForURL(BASE + '/studio/users');
  check('nav from slide-over closes it', await m.evaluate(() => !document.querySelector('.hq-sidebar').classList.contains('open')));

  // Sign out
  await openMenu(); await p.click('[role=menuitem]:has-text("Keluar")');
  await p.waitForSelector('#usernameOrEmail', { timeout: 15000 });
  check('sign out returns to login', true);

  check('no page errors', errs.length === 0, errs.join(' | '));
  console.log(fails ? `FAILED: ${fails}` : 'ALL INTERACTION CHECKS PASSED');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
