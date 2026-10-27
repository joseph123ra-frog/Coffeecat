import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { kstDate } from '../scripts/config.js';

function run(mode, spent = 0) {
  const dir = mkdtempSync(join(tmpdir(), 'detective-test-'));
  cpSync(resolve('data/backup'), join(dir, 'data/backup'), { recursive: true });
  if (spent) writeFileSync(join(dir, 'data/usage.json'), JSON.stringify({ months: { [kstDate().month]: { usd: spent, runs: 0 } }, usedBackups: [], history: [] }));
  const mock = join(dir, 'mock.mjs');
  writeFileSync(mock, `
    import { readFileSync, appendFileSync } from 'node:fs';
    const sample = JSON.parse(readFileSync(${JSON.stringify(resolve('data/backup/001.json'))}, 'utf8'));
    globalThis.fetch = async (url, init) => {
      const body = JSON.parse(init.body);
      const count = String(url).includes('count_tokens');
      appendFileSync(${JSON.stringify(join(dir, 'calls.txt'))}, (count ? 'count' : 'message') + '\\n');
      if (count) return new Response(JSON.stringify({input_tokens: 1000}), {headers:{'content-type':'application/json'}});
      if (${JSON.stringify(mode)} === 'network') throw new Error('simulated disconnect');
      const generating = Boolean(body.output_config.format.schema.properties.plan);
      const output = generating ? sample : {reasoning:'단서 확인', culprit: ${JSON.stringify(mode === 'reject' ? 'A' : 'D')}};
      return new Response(JSON.stringify({id:'test-message', type:'message', role:'assistant', model:body.model,
        content:[{type:'text',text:JSON.stringify(output)}], stop_reason:${JSON.stringify(mode === 'truncated' ? 'max_tokens' : 'end_turn')}, stop_sequence:null,
        usage:{input_tokens:1000,output_tokens:500}}), {headers:{'content-type':'application/json'}});
    };
  `);
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  if (mode !== 'no-key') env.ANTHROPIC_API_KEY = 'test-only-not-a-real-key';
  const result = spawnSync(process.execPath, ['--import', mock, resolve('scripts/generate.js')], { cwd: dir, env, encoding: 'utf8', timeout: 10000 });
  try {
    assert.equal(result.status, 0, result.stderr + result.stdout);
    const ledger = JSON.parse(readFileSync(join(dir, 'data/usage.json'), 'utf8'));
    let calls = '';
    try { calls = readFileSync(join(dir, 'calls.txt'), 'utf8'); } catch {}
    return { ledger, calls, output: result.stdout };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('키가 없거나 월 예산이 소진되면 API 없이 예비 사건을 쓴다', () => {
  for (const mode of ['no-key', 'success']) {
    const result = run(mode, mode === 'success' ? 5 : 0);
    assert.equal(result.calls, '');
    assert.equal(result.ledger.history.length, 2);
    assert.ok(result.ledger.history.every(h => h.source === 'backup'));
  }
});

test('생성·전체 풀이·최소 풀이와 비용을 두 사건에 각각 기록한다', () => {
  const result = run('success');
  assert.equal(result.calls.split('\n').filter(line => line === 'message').length, 6);
  assert.ok(result.ledger.history.every(h => h.source === 'ai'));
  assert.ok(Math.abs(result.ledger.months[kstDate().month].usd - 0.042) < 0.00001);
});

test('검증 불일치와 잘린 응답은 공개하지 않고 예비 사건으로 대체한다', () => {
  for (const mode of ['reject', 'truncated']) {
    const result = run(mode);
    assert.ok(result.ledger.history.every(h => h.source === 'backup'));
    assert.ok(result.ledger.months[kstDate().month].usd > 0);
  }
});

test('응답이 사라지면 예약 비용을 유지하고 재전송하지 않는다', () => {
  const result = run('network');
  assert.equal(result.calls.split('\n').filter(line => line === 'message').length, 1);
  assert.ok(result.ledger.months[kstDate().month].usd > 0.06);
  assert.ok(result.ledger.history.every(h => h.source === 'backup'));
});

test('월 잔액보다 호출 최대액이 크면 유료 요청을 보내지 않는다', () => {
  const result = run('success', 4.99);
  assert.ok(!result.calls.includes('message'));
  assert.ok(result.ledger.history.every(h => h.source === 'backup'));
  assert.equal(result.ledger.months[kstDate().month].usd, 4.99);
});
