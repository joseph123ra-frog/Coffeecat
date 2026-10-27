// 원본 사건을 검증한 뒤 공개 형식으로 저장한다. API는 호출하지 않는다.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Case, checkCase, toPublic } from './case.js';
import { PATHS, kstDate } from './config.js';

const [source, date] = process.argv.slice(2);
if (!source || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
  throw new Error('사용법: node scripts/publish-case.js 원본.json YYYY-MM-DD');
}
const c = Case.parse(JSON.parse(await readFile(source, 'utf8')));
const { errors } = checkCase(c);
if (errors.length) throw new Error(errors.join(' / '));
const path = `${PATHS.cases}/${date}.json`;
// 기존 사건 번호를 유지한다. 새 날짜는 정상 생성 절차를 사용한다.
const existing = JSON.parse(await readFile(path, 'utf8'));
const text = `${JSON.stringify(toPublic(c, { no: existing.no, date }), null, 2)}\n`;
await mkdir(PATHS.cases, { recursive: true });
await writeFile(path, text);
if (date === kstDate().day) await writeFile(`${PATHS.cases}/latest.json`, text);
console.log(`${date} 사건 수정 완료. 정답·해설까지 직접 확인해 주세요.`);
