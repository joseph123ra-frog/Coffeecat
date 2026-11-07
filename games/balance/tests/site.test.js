import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('질문은 한 달 이상 겹치지 않는다', async () => {
  const source = await readFile(new URL('../site/questions.js', import.meta.url), 'utf8');
  const matches = [...source.matchAll(/\['([^']+)', '([^']+)'\]/g)];
  assert.ok(matches.length >= 31);
  assert.equal(new Set(matches.flatMap(match => [match[1], match[2]])).size, matches.length * 2);
});

test('비밀값은 배포 전 설정 파일에 들어 있지 않다', async () => {
  const source = await readFile(new URL('../site/config.js', import.meta.url), 'utf8');
  assert.match(source, /supabaseUrl: ''/);
  assert.match(source, /supabaseAnonKey: ''/);
});
