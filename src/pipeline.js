// GitHub Actions에서 단계별로 호출한다.
//   node src/pipeline.js prepare  질문 선택 → 조사 → 사진 → 렌더링 → out/post
//   node src/pipeline.js publish  GitHub Pages 공개 확인 → Instagram 게시 → Notion 완료
//   node src/pipeline.js fail     Notion에 실패 기록
// 단계 사이에 워크플로가 out/post/slides를 gh-pages 브랜치에 올린다.

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { PATHS, STATUS, STYLE, env, kstDate } from './config.js';
import { loadLedger, saveLedger, blockReason, addCost, addPost, costOf } from './budget.js';
import { nextQuestion, updateQuestion } from './notion.js';
import { research, totalUsage } from './research.js';
import { pickImages } from './images.js';
import { buildCaption } from './caption.js';
import { publishCarousel } from './instagram.js';
import { renderSlides } from './render.js';
import { styles } from '../templates/styles.js';

const META = join(PATHS.post, 'meta.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function output(values) {
  const lines = Object.entries(values).map(([k, v]) => `${k}=${v}`).join('\n');
  console.log(lines);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `${lines}\n`);
}

async function prepare() {
  const ledger = await loadLedger();
  const blocked = blockReason(ledger);
  if (blocked) {
    console.log(`건너뜀: ${blocked}`);
    return output({ skip: 'true' });
  }
  const item = await nextQuestion();
  if (!item) {
    console.log('건너뜀: 대기 중인 질문 없음');
    return output({ skip: 'true' });
  }

  const now = new Date();
  const postId = `${kstDate(now).day}-${item.pageId.replace(/-/g, '').slice(0, 8)}`;
  await mkdir(PATHS.post, { recursive: true });
  await writeFile(META, JSON.stringify({ ...item, postId }, null, 2));
  await updateQuestion(item.pageId, { status: STATUS.running, note: '' });
  console.log(`질문: ${item.question}`);

  let draft;
  try {
    draft = await research(item.question);
  } finally {
    const usd = costOf(totalUsage());
    addCost(ledger, usd, now);
    await saveLedger(ledger);
    console.log(`Claude 비용: $${usd.toFixed(4)}`);
  }

  const images = await pickImages([
    { query: draft.cover.imageQuery, catMeme: '' },
    ...draft.bodies.map((b) => ({ query: b.imageQuery, catMeme: b.catMeme })),
  ]);
  // 표지는 밈 문구 없이 사진만 쓴다.
  delete images[0].meme;

  const data = {
    issue: ledger.issue + 1,
    date: kstDate(now).dotted,
    slides: [
      { type: 'cover', title: draft.cover.title, subtitle: draft.cover.subtitle, image: images[0] },
      ...draft.bodies.map((b, i) => ({ type: 'body', title: b.title, body: b.body, image: images[i + 1] })),
      { type: 'signature' },
    ],
  };
  const caption = buildCaption(draft, images.map((i) => i.credit));
  await writeFile(join(PATHS.post, 'data.json'), JSON.stringify({ data, draft }, null, 2));
  await writeFile(join(PATHS.post, 'caption.txt'), caption);

  const browser = await chromium.launch();
  try {
    await renderSlides(browser, data, styles[STYLE], join(PATHS.post, 'slides', postId));
  } finally {
    await browser.close();
  }
  await output({ skip: 'false', post_id: postId });
}

async function waitPublic(url) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(url, { method: 'HEAD' }).catch(() => null);
    if (res?.ok) return;
    await sleep(10_000);
  }
  throw new Error(`GitHub Pages에 이미지가 올라오지 않았습니다: ${url}`);
}

async function publish() {
  const meta = JSON.parse(await readFile(META, 'utf8'));
  const { data } = JSON.parse(await readFile(join(PATHS.post, 'data.json'), 'utf8'));
  const caption = await readFile(join(PATHS.post, 'caption.txt'), 'utf8');
  const base = env('PAGES_BASE_URL').replace(/\/$/, '');
  const urls = data.slides.map((_, i) => `${base}/${meta.postId}/${i + 1}.jpg`);
  for (const url of urls) await waitPublic(url);

  const { permalink } = await publishCarousel(urls, caption);
  await updateQuestion(meta.pageId, { status: STATUS.done, url: permalink, note: `No.${data.issue}` });

  const ledger = await loadLedger();
  ledger.issue = Math.max(ledger.issue, data.issue);
  addPost(ledger);
  await saveLedger(ledger);
  console.log(`게시 완료: ${permalink}`);
}

async function fail() {
  let meta;
  try {
    meta = JSON.parse(await readFile(META, 'utf8'));
  } catch {
    console.log('기록할 질문이 없습니다.');
    return;
  }
  const run = process.env.GITHUB_RUN_URL ?? '';
  await updateQuestion(meta.pageId, { status: STATUS.failed, note: `실패. 로그: ${run}` });
}

const commands = { prepare, publish, fail };
const command = commands[process.argv[2]];
if (!command) {
  console.error('사용법: node src/pipeline.js prepare|publish|fail');
  process.exit(1);
}
command().catch((err) => {
  console.error(err);
  process.exit(1);
});
