// 실행 전: python3 -m http.server 8000 -d site
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdir, writeFile, readFile } = require('node:fs/promises');
const path = require('node:path');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
const out = path.resolve('test-results');
const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

(async () => {
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const c = JSON.parse(await readFile(`site/cases/${today()}.json`, 'utf8'));
  const key = Buffer.from(`kkaphwi-${c.date}`);
  const raw = Buffer.from(c.answer, 'base64');
  const answer = JSON.parse(Buffer.from(raw.map((b, i) => b ^ key[i % key.length])).toString());
  const errors = [];
  async function context(blocked = false) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    // 외부 글꼴이 끊긴 환경에서도 시스템 한글 글꼴로 카드가 나오는지 확인한다.
    await ctx.route('https://**/*', route => route.abort());
    if (blocked) await ctx.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('차단', 'SecurityError'); } });
    });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base);
    await page.getByRole('button', { name: '조사 시작', exact: true }).waitFor();
    return { ctx, page };
  }
  async function shot(page, name) {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} 가로 넘침`);
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  }
  const { ctx, page } = await context();
  await shot(page, '01-intro');
  await page.getByRole('button', { name: '조사 시작', exact: true }).click();
  await page.locator('.clue button').nth(0).click();
  await page.reload();
  await page.locator('.clue.open').waitFor();
  assert.equal(await page.locator('.clue.open').count(), 1);
  await page.locator('.clue.open button').click();
  assert.equal(await page.locator('.left').textContent(), '4 / 5');
  for (let i = 1; i < 5; i++) await page.locator('.clue button').nth(i).click();
  assert.equal(await page.locator('.clue button:disabled').count(), 2);
  await shot(page, '02-investigate');
  await page.reload();
  await page.locator('.clue button:disabled').first().waitFor();
  assert.equal(await page.locator('.left').textContent(), '0 / 5');
  await page.getByRole('button', { name: '범인 지목하기', exact: true }).click();
  await shot(page, '03-accuse');
  assert.equal(await page.getByRole('button', { name: '다시 조사하기', exact: true }).count(), 0);
  const culprit = c.suspects.find(s => s.id === answer.culprit);
  await page.getByRole('button', { name: culprit.name, exact: true }).click();
  await page.locator('.btn.primary').click();
  await page.locator('.card-img').waitFor();
  await shot(page, '04-correct');
  assert.equal(await page.locator('.solution').textContent(), answer.solution);
  assert.deepEqual(await page.locator('.card-img').evaluate(img => [img.naturalWidth, img.naturalHeight]), [1080, 1920]);
  const bytes = await page.locator('.card-img').evaluate(async img => Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer())));
  await writeFile(`${out}/result-card.png`, Buffer.from(bytes));
  await page.reload();
  await page.getByText('사건 해결!', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '범인 지목하기', exact: true }).count(), 0);
  await page.setViewportSize({ width: 360, height: 800 }); await shot(page, '05-correct-360');
  await ctx.close();

  const wrong = await context();
  await shot(wrong.page, '06-wrong-intro');
  await wrong.page.getByRole('button', { name: '조사 시작', exact: true }).click();
  await shot(wrong.page, '07-wrong-investigate');
  await wrong.page.getByRole('button', { name: '범인 지목하기', exact: true }).click();
  await wrong.page.getByRole('button', { name: '다시 조사하기', exact: true }).click();
  await wrong.page.getByRole('button', { name: '범인 지목하기', exact: true }).click();
  const innocent = c.suspects.find(s => s.id !== answer.culprit);
  await wrong.page.getByRole('button', { name: innocent.name, exact: true }).click();
  await shot(wrong.page, '08-wrong-accuse');
  await wrong.page.locator('.btn.primary').click();
  await wrong.page.getByText('아쉽다냥…', { exact: true }).waitFor();
  assert.equal(await wrong.page.locator('.card-img').count(), 0);
  await shot(wrong.page, '09-wrong-result');
  await wrong.page.reload(); await wrong.page.getByText('아쉽다냥…', { exact: true }).waitFor();
  await wrong.ctx.close();

  const blocked = await context(true);
  await blocked.page.getByRole('button', { name: '조사 시작', exact: true }).click();
  await blocked.page.locator('.clue button').first().click();
  await blocked.page.getByRole('button', { name: '범인 지목하기', exact: true }).click();
  await blocked.page.getByRole('button', { name: culprit.name, exact: true }).click();
  await blocked.page.locator('.btn.primary').click();
  await blocked.page.locator('.card-img').waitFor();
  await shot(blocked.page, '10-storage-blocked');
  await blocked.ctx.close();

  const fallback = await browser.newContext({ viewport: { width: 360, height: 800 } });
  await fallback.route(`**/cases/${today()}.json`, route => route.fulfill({ status: 404, body: '' }));
  await fallback.route('https://**/*', route => route.abort());
  const fallbackPage = await fallback.newPage();
  await fallbackPage.goto(base); await fallbackPage.getByRole('button', { name: '조사 시작', exact: true }).waitFor();
  await shot(fallbackPage, '11-fallback-360');
  await fallback.route('**/cases/latest.json', route => route.fulfill({ status: 404, body: '' }));
  await fallbackPage.reload(); await fallbackPage.getByText('사건 파일을 찾지 못했다냥. 잠시 후 다시 와 달라냥', { exact: true }).waitFor();
  await fallback.close();
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('모바일 화면·조사 제한·진행 저장·저장 차단·정답/오답·1080×1920 PNG·대체 사건·360px 폭 통과');
})().catch(error => { console.error(error); process.exit(1); });
