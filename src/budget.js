// 이전 유료 사용액과 무료 API 사용 기록과 일별 게시 수를 data/usage.json에 기록한다.
// 워크플로가 실행 후 이 파일을 커밋해 다음 실행에 넘긴다.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { MAX_POSTS_PER_DAY, PATHS, kstDate } from './config.js';

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
  if (usage.provider !== 'gemini-free') throw new Error('무료 API 사용 기록이 아닙니다.');
  return 0; // 결제 미연결 무료 프로젝트를 확인한 키만 사용한다.

}

// 실행해도 되는지 판단한다. 안 되면 사유 문자열을, 되면 null을 돌려준다.
export function blockReason(ledger, now = new Date(), { ignoreDailyLimit = false } = {}) {
  const { month, day } = kstDate(now);
  if (!ignoreDailyLimit && (ledger.days[day] ?? 0) >= MAX_POSTS_PER_DAY) return `오늘 게시 한도(${MAX_POSTS_PER_DAY}개) 도달`;
  return null;
}

export function addGeminiUsage(ledger, usage, now = new Date()) {
  const { month } = kstDate(now);
  const records = ledger.geminiFree ??= { months: {} };
  const m = records.months[month] ??= { runs: 0, calls: 0, input_tokens: 0, output_tokens: 0 };
  m.runs += 1;
  for (const key of ['calls', 'input_tokens', 'output_tokens']) m[key] += usage[key] ?? 0;
}

export function addPost(ledger, now = new Date()) {
  const { day } = kstDate(now);
  ledger.days[day] = (ledger.days[day] ?? 0) + 1;
}
