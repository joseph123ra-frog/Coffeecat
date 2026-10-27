// 오늘·내일(한국 시간) 사건 파일이 없으면 만든다.
// 만들기 → 코드로 논리 검사 → 정답을 모르는 별도 호출이 단서만 보고 풀어 보기.
// 셋 다 통과해야 올린다. 실패하거나 예산이 모자라면 예비 사건을 쓴다.

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { MODEL, PRICE, MONTHLY_BUDGET_USD, MAX_RUN_COST_USD, MAX_ATTEMPTS, PICKS, PATHS, kstDate, addDays } from './config.js';
import { Case, IDS, checkCase, playerText, toPublic } from './case.js';

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ maxRetries: 0, timeout: 120000 }) : null;
let activeLedger;
let reserved = 0;
let charged = 0;
let apiUnavailable = false;
const runMonth = kstDate().month;
const roundUp = n => Math.ceil(n * 1e6) / 1e6;
async function saveLedger() {
  await writeFile(PATHS.ledger, `${JSON.stringify(activeLedger, null, 2)}\n`);
}

// 사건이 매일 비슷해지지 않도록 장소와 사건 종류를 코드에서 골라 준다.
const PLACES = ['할머니 집 부엌', '동네 고양이 카페', '골목 생선가게', '도서관 창가', '꽃집 온실', '빵집 진열대', '학교 과학실', '캠핑장 텐트', '세탁소', '아파트 옥상 정원', '바닷가 민박집', '고양이 미용실', '동네 문구점', '수족관 매표소', '시골 외갓집 마루'];
const EVENTS = ['간식이 사라졌다', '소중한 물건이 없어졌다', '무언가가 깨져 있었다', '누군가 몰래 낙서를 했다', '장식이 엉망이 되었다', '털 뭉치가 잔뜩 발견되었다', '물건이 엉뚱한 곳으로 옮겨져 있었다', '상자가 찢어져 있었다'];

const SYSTEM = `당신은 인스타그램 매거진 '깝휘캣'의 하루 한 판 추리 게임 '깝휘캣 탐정'의 사건 작가입니다.
플레이어는 고양이 탐정 깝휘캣이 되어 사건을 풉니다.

## 세계관과 톤
- 고양이 세계의 귀엽고 엉뚱한 일상 미스터리. 다치거나 죽는 사람·동물, 무서운 내용, 실제 범죄는 없습니다.
- 등장인물은 고양이(용의자 4마리)와 주변 인물(집사, 강아지, 새 등 증인).
- 말투는 짧고 친근하게. 고양이 대사 끝에는 가끔 "~냥"을 붙입니다.

## 게임 규칙
- 용의자 4마리(A~D) 중 범인은 정확히 1마리.
- 조사 선택지 7개. 플레이어는 그중 ${PICKS}개만 고를 수 있습니다.
- 무고한 3마리는 각각 최소 하나의 단서로 "확실히 범인이 아니다"라고 말할 수 있어야 합니다 (알리바이, 신체 조건, 시간, 물리적 증거 등). 추측이 아니라 단서 내용만으로 확정되어야 합니다.
- 범인을 가리키는 단서가 최소 1개, 무고한 용의자를 의심스럽게 보이게 하는 헷갈리는 단서가 최소 1개 있어야 합니다. 헷갈리는 단서는 다른 단서로 풀려야 합니다.
- 무고한 3마리를 빼는 데 필요한 단서는 2~${PICKS}개. 단서 하나로 범인이 드러나면 너무 쉽습니다.
- 어떤 단서도 범인을 제외하면 안 되고, 단서끼리 모순되면 안 됩니다.
- 시간, 높이, 거리 같은 사실은 숫자로 분명하게 씁니다.
- eliminates와 pointsTo는 정직하게 채웁니다. 이 정보로 사건을 기계 검사합니다.`;

const Verdict = z.object({
  reasoning: z.string().describe('용의자마다 범인일 수 있는지 단서로 따진 과정. 짧게'),
  culprit: z.enum([...IDS, '모름']).describe('주어진 내용만으로 범인이 한 마리로 확정되면 그 id, 아니면 "모름"'),
});

let usage = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };
const record = (u) => {
  usage.input += u.input_tokens ?? 0;
  usage.output += u.output_tokens ?? 0;
  usage.cacheWrite += u.cache_creation_input_tokens ?? 0;
  usage.cacheRead += u.cache_read_input_tokens ?? 0;
};
const costOf = (u) =>
  (u.input * PRICE.inputPerMTok + u.output * PRICE.outputPerMTok + u.cacheWrite * PRICE.cacheWritePerMTok + u.cacheRead * PRICE.cacheReadPerMTok) / 1e6;

async function ask(system, content, format, effort) {
  const output_config = { effort, format: betaZodOutputFormat(format) };
  const messages = [{ role: 'user', content }];
  const max_tokens = format === Case ? 6000 : 2000;
  // 응답 전에 중단되더라도 비용이 사라지지 않게 호출 최대액을 먼저 기록한다.
  const count = await client.beta.messages.countTokens({ model: MODEL, system, messages, output_config });
  const reserve = roundUp(((count.input_tokens + 1024) * PRICE.inputPerMTok + max_tokens * PRICE.outputPerMTok) / 1e6);
  const month = activeLedger.months[runMonth];
  if (month.usd + reserve > MONTHLY_BUDGET_USD || charged + reserved + reserve > MAX_RUN_COST_USD) {
    throw new Error('예산 상한으로 예비 사건 사용');
  }
  reserved += reserve;
  month.usd = roundUp(month.usd + reserve);
  await saveLedger();
  let response;
  try {
    // 다른 모델로 자동 전환하면 단가가 바뀌므로 지정한 모델만 호출한다.
    response = await client.beta.messages.create({ model: MODEL, max_tokens, output_config, system, messages });
  } catch (error) {
    apiUnavailable = true;
    // 청구 여부가 불확실하면 예약액을 유지하고 이 실행에서는 재전송하지 않는다.
    throw new Error(`API 응답을 확인하지 못함 (${error.status ?? '연결 오류'}). 예약 비용 유지`);
  }
  record(response.usage);
  const actual = costOf({ input: response.usage.input_tokens ?? 0, output: response.usage.output_tokens ?? 0,
    cacheWrite: response.usage.cache_creation_input_tokens ?? 0, cacheRead: response.usage.cache_read_input_tokens ?? 0 });
  reserved = Math.max(0, reserved - reserve);
  charged += actual;
  month.usd = roundUp(Math.max(0, month.usd - reserve + actual));
  await saveLedger();
  if (response.stop_reason !== 'end_turn') throw new Error(`생성 중단: ${response.stop_reason}`);
  const text = response.content.filter(block => block.type === 'text').map(block => block.text).join('');
  return format.parse(JSON.parse(text));
}

const solve = (c, clueIdx) =>
  ask(
    '당신은 추리 퍼즐 검수자입니다. 주어진 내용만 근거로 범인을 가립니다. 내용에 없는 것을 상상해 채우지 않습니다. 확정할 수 없으면 "모름"이라고 답합니다.',
    `${playerText(c, clueIdx)}\n\n범인은 누구입니까?`,
    Verdict,
    'medium',
  );

async function makeCase(recentTitles, feedback) {
  const place = PLACES[Math.floor(Math.random() * PLACES.length)];
  const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  const recent = recentTitles.length ? `\n최근 사건(겹치지 않게): ${recentTitles.join(', ')}` : '';
  const c = await ask(
    SYSTEM,
    `오늘의 사건을 만들어 주세요.\n장소: ${place}\n사건 종류: ${event}${recent}${feedback ? `\n\n지난 시도는 이런 문제로 탈락했습니다. 고쳐서 새로 만들어 주세요:\n${feedback}` : ''}`,
    Case,
    'medium',
  );
  const { errors, cover } = checkCase(c);
  if (errors.length) return { c, problem: errors.join(' / ') };

  // 단서를 전부 봤을 때와, 꼭 필요한 단서만 봤을 때 모두 같은 범인이 나와야 한다.
  const all = await solve(c);
  const minimal = await solve(c, cover);
  const name = (id) => c.suspects.find((s) => s.id === id)?.name ?? id;
  if (all.culprit !== c.culprit) return { c, problem: `단서 전부로 푼 답(${name(all.culprit)})이 정답(${name(c.culprit)})과 다름: ${all.reasoning}` };
  if (minimal.culprit !== c.culprit) return { c, problem: `필요한 단서 ${cover.length}개로 푼 답(${name(minimal.culprit)})이 정답과 다름: ${minimal.reasoning}` };
  return { c, problem: null };
}

async function loadLedger() {
  try {
    return JSON.parse(await readFile(PATHS.ledger, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return { months: {}, usedBackups: [], history: [] };
    throw err;
  }
}

async function pickBackup(ledger) {
  const files = (await readdir(PATHS.backups)).filter((f) => f.endsWith('.json')).sort();
  // 아직 안 쓴 것부터. 다 썼으면 가장 오래전에 쓴 것을 다시 쓴다.
  const unused = files.filter((f) => !ledger.usedBackups.includes(f));
  const file = unused[0] ?? ledger.usedBackups.find((f) => files.includes(f));
  ledger.usedBackups = [...ledger.usedBackups.filter((f) => f !== file), file];
  const c = Case.parse(JSON.parse(await readFile(`${PATHS.backups}/${file}`, 'utf8')));
  const { errors } = checkCase(c);
  if (errors.length) throw new Error(`예비 사건 오류: ${errors.join(' / ')}`);
  return c;
}

async function caseFor(date, ledger) {
  const spent = () => ledger.months[runMonth]?.usd ?? 0;
  const recent = ledger.history.slice(-14).map((h) => h.title);
  let feedback = '';
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    if (!client || apiUnavailable) {
      console.log('API 사용 불가 → 예비 사건 사용');
      break;
    }
    if (spent() >= MONTHLY_BUDGET_USD || charged + reserved >= MAX_RUN_COST_USD) {
      console.log(`이번 달 예산 부족 ($${spent().toFixed(2)} / $${MONTHLY_BUDGET_USD}) → 예비 사건 사용`);
      break;
    }
    try {
      const { c, problem } = await makeCase(recent, feedback);
      if (!problem) {
        console.log(`[${date}] ${i}번째 시도 통과: ${c.title}`);
        return { c, source: 'ai' };
      }
      console.log(`[${date}] ${i}번째 시도 탈락: ${problem}`);
      feedback = problem;
    } catch (err) {
      console.log(`[${date}] ${i}번째 시도 오류: ${err.message}`);
    }
  }
  const c = await pickBackup(ledger);
  console.log(`[${date}] 예비 사건 사용: ${c.title}`);
  return { c, source: 'backup' };
}

async function main() {
  const ledger = activeLedger = await loadLedger();
  const monthRecord = ledger.months[runMonth] ??= { usd: 0, runs: 0 };
  if (!Number.isFinite(monthRecord.usd) || monthRecord.usd < 0) throw new Error('비용 기록 오류');
  monthRecord.runs += 1;
  await saveLedger();
  const today = kstDate().day;
  await mkdir(PATHS.cases, { recursive: true });
  let latest = null;
  for (const date of [today, addDays(today, 1)]) {
    const path = `${PATHS.cases}/${date}.json`;
    if (existsSync(path)) {
      console.log(`[${date}] 이미 있음`);
      continue;
    }
    const before = costOf(usage);
    const { c, source } = await caseFor(date, ledger);
    const no = Math.max(0, ...ledger.history.map(h => h.no)) + 1;
    await writeFile(path, `${JSON.stringify(toPublic(c, { no, date }), null, 2)}\n`);
    ledger.history.push({ no, date, title: c.title, source, usd: Math.round((costOf(usage) - before) * 10000) / 10000 });
    if (date === today) latest = path;
    await saveLedger();
  }
  // 오늘 사건 파일을 latest.json으로도 둔다. 사이트는 날짜 파일이 없을 때 이것을 읽는다.
  const todayPath = latest ?? `${PATHS.cases}/${today}.json`;
  if (existsSync(todayPath)) await writeFile(`${PATHS.cases}/latest.json`, await readFile(todayPath));

  const m = ledger.months[runMonth];
  await writeFile(PATHS.ledger, `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(`이번 실행 비용 $${costOf(usage).toFixed(4)} · 미확인 예약 포함 이번 달 기록 $${m.usd.toFixed(4)} / $${MONTHLY_BUDGET_USD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
