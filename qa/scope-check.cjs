// Verifies CMS styles are scoped: <html data-studio> only on /studio, removed after in-app navigation away.
const { chromium } = require('/usr/local/lib/hermes-agent/node_modules/playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:3200';
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const state = async (label) => console.log(label, await p.evaluate(() => ({ studio: document.documentElement.hasAttribute('data-studio'), theme: document.documentElement.getAttribute('data-studio-theme'), sbVars: document.documentElement.style.cssText.includes('--sb-'), bodyFont: getComputedStyle(document.body).fontFamily.split(',')[0], bodyBg: getComputedStyle(document.body).backgroundColor })));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await state('public / (fresh):');
  await p.goto(BASE + '/studio', { waitUntil: 'networkidle' }); await state('/studio:');
  await p.evaluate(() => { history.pushState({}, '', '/'); dispatchEvent(new PopStateEvent('popstate')); }); await p.waitForTimeout(800); await state('after in-app nav to /:');
  await b.close();
})();
