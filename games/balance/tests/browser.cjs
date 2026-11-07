const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000/balance/';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/config.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: `window.BALANCE_CONFIG={supabaseUrl:'https://vote.test',supabaseAnonKey:'sb_publishable_test-key'};`
  }));
  await page.route('https://vote.test/rest/v1/rpc/get_balance_results', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify([{ choice: 'A', total: 2 }, { choice: 'B', total: 1 }])
  }));
  await page.route('https://vote.test/rest/v1/rpc/cast_balance_vote', route => {
    assert.equal(route.request().headers().authorization, undefined);
    return route.fulfill({
      contentType: 'application/json', body: JSON.stringify({ choice: 'A', a_count: 3, b_count: 1 })
    });
  });

  await page.goto(base);
  await page.getByRole('button', { name: /^A / }).click();
  await page.getByText('75%').waitFor();
  assert.match(await page.locator('.status').textContent(), /4명 참여/);
  assert.equal(await page.locator('.choice.mine').count(), 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('모바일 투표·실시간 결과·하루 선택 저장·가로 폭 통과');
})().catch(error => { console.error(error); process.exit(1); });
