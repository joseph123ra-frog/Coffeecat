import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate, responseText, groundedSources } from '../src/gemini.js';
import { costOf, addGeminiUsage, blockReason } from '../src/budget.js';
const env = { GEMINI_API_KEY: 'test-only', GEMINI_FREE_TIER_CONFIRMED: 'true' };
const result = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '정상' }] } }] };

test('키와 무료 프로젝트 확인 없이는 네트워크 호출이 없다', async () => {
  let calls = 0;
  for (const config of [{}, { GEMINI_API_KEY: 'test-only' }, { GEMINI_FREE_TIER_CONFIRMED: 'true' }]) {
    await assert.rejects(generate({}, { env: config, fetchImpl: () => { calls++; } }));
  }
  assert.equal(calls, 0);
});
test('무료 모델만 호출하고 한도 초과에는 재시도하지 않으며 오류에 비밀값을 넣지 않는다', async () => {
  let calls = 0;
  await assert.rejects(generate({}, { env, fetchImpl: async (url, init) => {
    calls++;
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent');
    assert.equal(init.headers['x-goog-api-key'], env.GEMINI_API_KEY);
    return new Response('비밀 응답', { status: 429 });
  } }), { message: /HTTP 429/ });
  assert.equal(calls, 1);
});
test('거절·잘린 원고·빈 응답을 차단한다', () => {
  for (const finishReason of ['MAX_TOKENS', 'SAFETY', undefined]) assert.throws(() => responseText({ candidates: [{ finishReason }] }));
  assert.throws(() => responseText({ candidates: [{ finishReason: 'STOP' }] }));
  assert.equal(responseText(result), '정상');
});
test('검색에서 실제 인용된 HTTPS 출처만 허용한다', () => {
  const sources = groundedSources({ candidates: [{ groundingMetadata: {
    groundingChunks: [{ web: { uri: 'https://example.com/a', title: '근거' } }, { web: { uri: 'https://example.com/unused' } }, { web: { uri: 'file:///tmp/secret' } }],
    groundingSupports: [{ groundingChunkIndices: [0, 2, 0] }],
  } }] });
  assert.deepEqual([...sources.keys()], ['https://example.com/a']);
});
test('이전 유료 사용액은 보존하고 무료 사용량을 따로 기록한다', () => {
  const ledger = { months: { '2026-10': { usd: 3.786, runs: 11 } }, days: {} };
  addGeminiUsage(ledger, { calls: 2, input_tokens: 100, output_tokens: 200 }, new Date('2026-10-27T00:00:00Z'));
  assert.equal(ledger.months['2026-10'].usd, 3.786);
  assert.equal(ledger.geminiFree.months['2026-10'].calls, 2);
  assert.equal(costOf({ provider: 'gemini-free' }), 0);
  assert.throws(() => costOf({ provider: 'anthropic' }));
  ledger.days['2026-10-27'] = 3;
  assert.match(blockReason(ledger, new Date('2026-10-27T00:00:00Z')), /게시 한도/);
});
test('조사·원고·재조사 흐름과 출처 중복·환각 방지', async () => {
  const { research, HoldError } = await import('../src/research.js');
  const draft = JSON.parse(readFileSync(new URL('../archive/no008-2026-10-27.json', import.meta.url))).draft;
  const urls = ['https://example.com/a', 'https://example.com/b', 'https://example.com/c'];
  const original = globalThis.fetch;
  const oldEnv = { key: process.env.GEMINI_API_KEY, confirmed: process.env.GEMINI_FREE_TIER_CONFIRMED };
  Object.assign(process.env, env);
  let calls = 0, good = true;
  globalThis.fetch = async (_url, init) => {
    calls++;
    const body = JSON.parse(init.body);
    const writing = Boolean(body.generationConfig.responseJsonSchema);
    const d = { ...draft, sources: [...urls.map(url => ({ title: '근거', url })), { title: '중복', url: urls[0] }, { title: '허구', url: 'https://fake.example/' }] };
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: writing ? JSON.stringify(d) : '조사 노트' }] }, groundingMetadata: good ? {
      groundingChunks: urls.map(uri => ({ web: { uri } })), groundingSupports: [{ groundingChunkIndices: [0, 1, 2] }],
    } : undefined }] }), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const d = await research('왜 그럴까?');
    assert.equal(d.bodies.length, 6);
    assert.equal(d.sources.length, 3);
    assert.equal(calls, 2);
    good = false;
    await assert.rejects(research('근거 없는 질문'), HoldError);
    assert.equal(calls, 6);
  } finally {
    globalThis.fetch = original;
    for (const [key, value] of [['GEMINI_API_KEY', oldEnv.key], ['GEMINI_FREE_TIER_CONFIRMED', oldEnv.confirmed]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
