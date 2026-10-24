// 원고 JSON → 1080×1350 JPEG 슬라이드 + 미리보기용 한 장짜리 모음(contact.jpg)
// 사용법: node src/render.js <data.json> [--style editorial|pop|photo | --all-styles] [--out 디렉터리]

import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { slideHtml } from '../templates/slide.js';
import { styles } from '../templates/styles.js';

const W = 1080;
const H = 1350;

export async function renderSlides(browser, data, style, outDir) {
  await mkdir(outDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const files = [];
  for (const [index, slide] of data.slides.entries()) {
    await page.setContent(slideHtml({ data, slide, index, style }), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // 본문이 넘치면 하단 페이지 번호에 닿지 않을 때까지 글자를 줄인다.
    await page.evaluate(() => {
      const body = document.querySelector('.s-body .body');
      const foot = document.querySelector('.foot');
      if (!body || !foot) return;
      let size = parseFloat(getComputedStyle(body).fontSize);
      while (size > 26 && body.getBoundingClientRect().bottom > foot.getBoundingClientRect().top - 16) {
        size -= 2;
        body.style.fontSize = `${size}px`;
      }
    });
    const file = join(outDir, `${index + 1}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
    files.push(file);
  }
  await page.close();
  return files;
}

// 전체 장을 4열로 줄여 한 장에 모은다. 시안 비교용.
async function contactSheet(browser, files, label, outFile) {
  const scale = 1 / 3;
  const cols = 4;
  const gap = 16;
  const w = Math.round(W * scale);
  const h = Math.round(H * scale);
  const rows = Math.ceil(files.length / cols);
  const width = cols * w + (cols + 1) * gap;
  const height = rows * h + (rows + 1) * gap + 60;
  // about:blank 페이지는 file:// 이미지를 못 읽으므로 data URL로 넣는다.
  const srcs = await Promise.all(files.map(async (f) => `data:image/jpeg;base64,${(await readFile(f)).toString('base64')}`));
  const imgs = srcs.map((src) => `<img src="${src}" style="width:${w}px;height:${h}px">`).join('');
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(
    `<body style="margin:0;background:#2b2b2b;font:700 26px sans-serif;color:#fff">
      <div style="height:60px;display:flex;align-items:center;padding:0 ${gap}px">${label}</div>
      <div style="display:grid;grid-template-columns:repeat(${cols},${w}px);gap:${gap}px;padding:0 ${gap}px ${gap}px">${imgs}</div></body>`,
    { waitUntil: 'load' },
  );
  await page.screenshot({ path: outFile, type: 'jpeg', quality: 90 });
  await page.close();
}

async function main() {
  const args = process.argv.slice(2);
  const input = args[0];
  if (!input) throw new Error('원고 JSON 경로가 필요합니다.');
  const opt = (name) => {
    const i = args.indexOf(name);
    return i === -1 ? undefined : args[i + 1];
  };
  const out = opt('--out') || 'out';
  const names = args.includes('--all-styles') ? Object.keys(styles) : [opt('--style') || 'editorial'];
  const data = JSON.parse(await readFile(input, 'utf8'));

  const browser = await chromium.launch();
  try {
    for (const name of names) {
      const style = styles[name];
      if (!style) throw new Error(`알 수 없는 스타일: ${name}`);
      const dir = join(out, name);
      const files = await renderSlides(browser, data, style, dir);
      await contactSheet(browser, files, style.label, join(out, `contact-${name}.jpg`));
      console.log(`${style.label}: ${files.length}장 → ${dir}`);
    }
  } finally {
    await browser.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
