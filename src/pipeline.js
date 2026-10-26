// GitHub Actions에서 단계별로 호출한다.
//   node src/pipeline.js prepare  질문 선택 → 조사 → 사진 → 렌더링 → out/post
//   node src/pipeline.js publish  GitHub Pages 공개 확인 → Instagram 게시 → Notion 완료
//   node src/pipeline.js fail     Notion에 실패 기록
// 단계 사이에 워크플로가 out/post/slides를 gh-pages 브랜치에 올린다.

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { PATHS, STATUS, STYLE, env, kstDate } from './config.js';
import { loadLedger, saveLedger, blockReason, addCost, addPost, costOf } from './budget.js';
import { nextQuestion, updateQuestion } from './notion.js';
import { research, totalUsage, HoldError } from './research.js';
import { pickImages } from './images.js';
import { buildCaption } from './caption.js';
import { publishCarousel } from './instagram.js';
import { renderSlides } from './render.js';
import { styles } from '../templates/styles.js';

const META = join(PATHS.post, 'meta.json');
const coverTitle = (question) => {
  const title = question.split(/\s+-\s+/)[0].trim();
  return /[?？!]$/.test(title) ? title : `${title}?`;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function output(values) {
  const lines = Object.entries(values).map(([k, v]) => `${k}=${v}`).join('\n');
  console.log(lines);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `${lines}\n`);
}

async function prepare() {
  const ledger = await loadLedger();
  // 수동 실행에서 질문을 직접 넣으면 Notion을 거치지 않는다 (지침 비교용 재제작 등).
  const manual = process.env.QUESTION?.trim();
  const blocked = blockReason(ledger, new Date(), { ignoreDailyLimit: process.env.IGNORE_DAILY_LIMIT === 'true' });
  if (blocked) {
    console.log(`건너뜀: ${blocked}`);
    return output({ skip: 'true' });
  }
  const item = manual ? { pageId: null, question: manual } : await nextQuestion();
  if (!item) {
    console.log('건너뜀: 대기 중인 질문 없음');
    return output({ skip: 'true' });
  }

  const now = new Date();
  // 호수로 이름을 붙여 기록이 겹치지 않게 하고, 피드백 때 'No.3'처럼 찾기 쉽게 한다.
  const postId = `no${String(ledger.issue + 1).padStart(3, '0')}-${kstDate(now).day}`;
  await mkdir(PATHS.post, { recursive: true });
  await writeFile(META, JSON.stringify({ ...item, postId }, null, 2));
  if (item.pageId) await updateQuestion(item.pageId, { status: STATUS.running, note: '' });
  console.log(`질문: ${item.question}`);

  let draft;
  try {
    draft = await research(item.question);
  } catch (err) {
    if (!(err instanceof HoldError)) throw err;
    console.log(`보류: ${err.message}`);
    if (item.pageId) await updateQuestion(item.pageId, { status: STATUS.held, note: `보류: ${err.message}` });
    return output({ skip: 'true' });
  } finally {
    const usd = costOf(totalUsage());
    addCost(ledger, usd, now);
    await saveLedger(ledger);
    console.log(`Claude 비용: $${usd.toFixed(4)}`);
  }

  const images = await pickImages([draft.cover.imageQuery, ...draft.bodies.map((b) => b.imageQuery)]);

  const data = {
    issue: ledger.issue + 1,
    date: kstDate(now).dotted,
    slides: [
      // 표지 제목은 Claude가 바꾸지 않도록 질문 칸의 질문 부분(' - ' 앞)을 그대로 쓴다.
      { type: 'cover', title: coverTitle(item.question), subtitle: draft.cover.subtitle, image: images[0] },
      ...draft.bodies.map((b, i) => ({ type: 'body', title: b.title, body: b.body, image: images[i + 1] })),
      { type: 'signature' },
    ],
  };
  const caption = buildCaption(draft, images.map((i) => i.credit));
  await writeFile(join(PATHS.post, 'data.json'), JSON.stringify({ data, draft }, null, 2));
  await writeFile(join(PATHS.post, 'caption.txt'), caption);
  // 게시 전에 기록부터 남긴다. 게시 단계가 실패해도 재게시 작업(repost.yml)으로 다시 올릴 수 있다.
  await mkdir(PATHS.archive, { recursive: true });
  await writeFile(
    join(PATHS.archive, `${postId}.json`),
    `${JSON.stringify({ issue: data.issue, question: item.question, permalink: null, caption, draft, data }, null, 2)}\n`,
  );

  const browser = await chromium.launch();
  try {
    await renderSlides(browser, data, styles[STYLE], join(PATHS.post, 'slides', postId));
  } finally {
    await browser.close();
  }
  await output({ skip: 'false', post_id: postId });
}

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

// 공개 주소의 이미지가 방금 만든 파일과 똑같아질 때까지 기다린다.
// 단순히 200 응답만 보면 캐시된 예전 이미지가 게시될 수 있다.
// 주소에 파일 해시를 붙여 Instagram이 가져갈 주소와 확인하는 주소를 같게 한다.
async function publicUrl(base, localFile) {
  const expected = sha(await readFile(localFile));
  const url = `${base}?v=${expected.slice(0, 12)}`;
  for (let i = 0; i < 60; i++) {
    const res = await fetch(url).catch(() => null);
    if (res?.ok && sha(Buffer.from(await res.arrayBuffer())) === expected) return url;
    await sleep(10_000);
  }
  throw new Error(`GitHub Pages 이미지가 이번 호 파일과 다릅니다(캐시 또는 배포 지연): ${url}`);
}

async function publish() {
  const meta = JSON.parse(await readFile(META, 'utf8'));
  const { data, draft } = JSON.parse(await readFile(join(PATHS.post, 'data.json'), 'utf8'));
  const caption = await readFile(join(PATHS.post, 'caption.txt'), 'utf8');
  const base = env('PAGES_BASE_URL').replace(/\/$/, '');
  const urls = [];
  for (const [i] of data.slides.entries()) {
    const name = `${meta.postId}/${i + 1}.jpg`;
    urls.push(await publicUrl(`${base}/${name}`, join(PATHS.post, 'slides', name)));
  }

  const { permalink } = await publishCarousel(urls, caption);
  if (meta.pageId) await updateQuestion(meta.pageId, { status: STATUS.done, url: permalink, note: `No.${data.issue}` });

  const ledger = await loadLedger();
  ledger.issue = Math.max(ledger.issue, data.issue);
  addPost(ledger);
  await saveLedger(ledger);
  // 나중에 본문을 고치거나 출처를 다시 확인할 수 있게 게시 기록을 남긴다.
  await mkdir(PATHS.archive, { recursive: true });
  await writeFile(
    join(PATHS.archive, `${meta.postId}.json`),
    `${JSON.stringify({ issue: data.issue, question: meta.question, permalink, caption, draft, data }, null, 2)}\n`,
  );
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
  if (!meta.pageId) return;
  const run = process.env.GITHUB_RUN_URL ?? '';
  await updateQuestion(meta.pageId, { status: STATUS.failed, note: `실패. 로그: ${run}` });
}

// 이미 만든 슬라이드를 다시 게시한다 (예: 잘못 올라간 게시물 교체). Claude를 부르지 않는다.
//   node src/pipeline.js repost <archive 파일> <슬라이드 폴더 이름>
async function repost() {
  const [archiveFile, dir] = process.argv.slice(3);
  // 기록 파일이 없으면(기록 선저장 이전 실패 건) 워크플로 입력으로 받은 본문을 쓴다.
  const record = await readFile(archiveFile, 'utf8')
    .then(JSON.parse)
    .catch(() => ({ caption: env('CAPTION'), question: process.env.QUESTION ?? '' }));
  const base = env('PAGES_BASE_URL').replace(/\/$/, '');
  const urls = [];
  for (let i = 1; i <= 8; i++) {
    const name = `${dir}/${i}.jpg`;
    urls.push(await publicUrl(`${base}/${name}`, join(PATHS.post, 'slides', name)));
  }
  const { permalink } = await publishCarousel(urls, record.caption);
  record.replaced = [...(record.replaced ?? []), record.permalink];
  record.permalink = permalink;
  await writeFile(archiveFile, `${JSON.stringify(record, null, 2)}\n`);
  console.log(`재게시 완료: ${permalink} (이전 게시물: ${record.replaced.at(-1)})`);
}

const commands = { prepare, publish, fail, repost };
const command = commands[process.argv[2]];
if (!command) {
  console.error('사용법: node src/pipeline.js prepare|publish|fail|repost');
  process.exit(1);
}
command().catch((err) => {
  console.error(err);
  process.exit(1);
});
