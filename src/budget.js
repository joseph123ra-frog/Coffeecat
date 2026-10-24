// 월별 Claude API 사용액과 일별 게시 수를 data/usage.json에 기록한다.
// 워크플로가 실행 후 이 파일을 커밋해 다음 실행에 넘긴다.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { PRICE, MONTHLY_BUDGET_USD, MAX_RUN_COST_USD, MAX_POSTS_PER_DAY, PATHS, kstDate } from './config.js';

export async function loadLedger() {
  try {
    return JSON.parse(await readFile(PATHS.ledger, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return { issue: 0, months: {}, days: {} };
    throw err;
  }
}

export async function saveLedger(ledger) {
  await mkdir(dirname(PATHS.ledger), { recursive: true });
  await writeFile(PATHS.ledger, `${JSON.stringify(ledger, null, 2)}\n`);
}

export function costOf(usage) {
  const m = 1e6;
  return (
    ((usage.input_tokens ?? 0) * PRICE.inputPerMTok) / m +
    ((usage.output_tokens ?? 0) * PRICE.outputPerMTok) / m +
    ((usage.cache_creation_input_tokens ?? 0) * PRICE.cacheWritePerMTok) / m +
    ((usage.cache_read_input_tokens ?? 0) * PRICE.cacheReadPerMTok) / m +
    (usage.server_tool_use?.web_search_requests ?? 0) * PRICE.perWebSearch
  );
}

// 실행해도 되는지 판단한다. 안 되면 사유 문자열을, 되면 null을 돌려준다.
export function blockReason(ledger, now = new Date()) {
  const { month, day } = kstDate(now);
  const spent = ledger.months[month]?.usd ?? 0;
  if (spent + MAX_RUN_COST_USD > MONTHLY_BUDGET_USD) {
    return `이번 달 예산 소진 ($${spent.toFixed(2)} / $${MONTHLY_BUDGET_USD})`;
  }
  if ((ledger.days[day] ?? 0) >= MAX_POSTS_PER_DAY) return `오늘 게시 한도(${MAX_POSTS_PER_DAY}개) 도달`;
  return null;
}

export function addCost(ledger, usd, now = new Date()) {
  const { month } = kstDate(now);
  const m = (ledger.months[month] ??= { usd: 0, runs: 0 });
  m.usd = Math.round((m.usd + usd) * 10000) / 10000;
  m.runs += 1;
}

export function addPost(ledger, now = new Date()) {
  const { day } = kstDate(now);
  ledger.days[day] = (ledger.days[day] ?? 0) + 1;
}
