// 예비 사건이 논리 검사를 통과하는지 확인한다. (API를 쓰지 않음)
import { readdirSync, readFileSync } from 'node:fs';
import { Case, checkCase } from './case.js';
import { PATHS } from './config.js';

let failed = 0;
for (const f of readdirSync(PATHS.backups).filter((f) => f.endsWith('.json')).sort()) {
  const c = Case.parse(JSON.parse(readFileSync(`${PATHS.backups}/${f}`, 'utf8')));
  const { errors, cover } = checkCase(c);
  console.log(`${f} ${c.title}: ${errors.length ? errors.join(' / ') : `통과 (필요한 단서 ${cover.length}개)`}`);
  if (errors.length) failed++;
}
process.exit(failed ? 1 : 0);
