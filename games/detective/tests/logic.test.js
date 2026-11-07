import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Case, checkCase, toPublic, minimalCover } from '../scripts/case.js';
import { kstDate, addDays } from '../scripts/config.js';
const sample = Case.parse(JSON.parse(readFileSync(new URL('../data/backup/001.json', import.meta.url))));

test('범인 제외, 빠지지 않는 무고한 용의자, 단서 하나 풀이를 거부한다', () => {
  const culpritExcluded = structuredClone(sample);
  culpritExcluded.clues[0].eliminates.push(sample.culprit);
  assert.match(checkCase(culpritExcluded).errors.join(), /범인을 제외/);
  const missing = structuredClone(sample);
  missing.clues.forEach(clue => { clue.eliminates = clue.eliminates.filter(id => id !== 'A'); });
  assert.match(checkCase(missing).errors.join(), /A를 제외하는 단서가 없음/);
  const trivial = structuredClone(sample);
  trivial.clues[0].eliminates = ['A', 'B', 'C'];
  assert.match(checkCase(trivial).errors.join(), /단서 하나/);
});

test('현 설계에서 무고한 3마리를 제외할 단서는 최대 3개다', () => {
  // 단서별 확정 제외 방식에서는 6개가 필요한 사건을 표현할 수 없다.
  // 여섯 단서가 각 용의자를 반복 제외해도 최소 조합은 3개다.
  const repeated = structuredClone(sample);
  repeated.clues.forEach((clue, i) => { clue.eliminates = i < 6 ? [['A'], ['B'], ['C']][i % 3] : []; });
  assert.equal(minimalCover(repeated).length, 3);
});

test('공개 사건에 내부 설계가 없고 브라우저 방식으로 한글 정답을 복원한다', () => {
  const c = toPublic(sample, { no: 1, date: '2026-10-27' });
  assert.equal(c.plan, undefined);
  assert.ok(c.clues.every(clue => !('eliminates' in clue) && !('pointsTo' in clue)));
  const key = new TextEncoder().encode(`kkaphwi-${c.date}`);
  const bytes = Uint8Array.from(atob(c.answer), ch => ch.charCodeAt(0));
  const decoded = JSON.parse(new TextDecoder().decode(bytes.map((b, i) => b ^ key[i % key.length])));
  assert.deepEqual(decoded, { culprit: sample.culprit, culpritLine: sample.culpritLine, solution: sample.solution });
});

test('한국 자정과 월말 날짜를 처리한다', () => {
  assert.equal(kstDate(new Date('2026-10-31T14:59:59Z')).day, '2026-10-31');
  assert.equal(kstDate(new Date('2026-10-31T15:00:00Z')).day, '2026-11-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});
