// REST를 직접 사용하며 유료 제공자·다른 모델로 대체하거나 자동 재시도하지 않는다.
import { MODEL } from './config.js';

export async function generate(body, { fetchImpl = globalThis.fetch, env = process.env } = {}) {
  if (env.GEMINI_FREE_TIER_CONFIRMED !== 'true') throw new Error('결제 미연결 Gemini 무료 프로젝트 확인이 필요합니다.');
  if (!env.GEMINI_API_KEY) throw new Error('GitHub Secrets에 GEMINI_API_KEY를 등록하세요.');
  let response;
  try {
    response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify(body), signal: AbortSignal.timeout(120000),
    });
  } catch {
    throw new Error('무료 생성 API 연결 실패. 재시도와 유료 전환 없이 중단합니다.');
  }
  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      detail = String(payload.error?.message ?? '').replaceAll(env.GEMINI_API_KEY, '[숨김]').slice(0, 500);
    } catch { /* 응답 본문을 읽을 수 없으면 상태 코드만 기록한다. */ }
    throw new Error(`무료 생성 API HTTP ${response.status}${detail ? `: ${detail}` : ''}. 재시도와 유료 전환 없이 중단합니다.`);
  }
  const result = await response.json();
  responseText(result); // 거절·잘림·빈 결과를 다음 단계에 넘기지 않는다.
  return result;
}

export function responseText(result) {
  const candidate = result.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new Error('무료 생성 API 응답이 정상 완료되지 않았습니다.');
  const text = (candidate.content?.parts ?? []).filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('');
  if (!text.trim()) throw new Error('무료 생성 API 응답이 비어 있습니다.');
  return text;
}

export function groundedSources(result) {
  const meta = result.candidates?.[0]?.groundingMetadata;
  const cited = new Set((meta?.groundingSupports ?? []).flatMap(s => s.groundingChunkIndices ?? []));
  const urls = new Map();
  for (const i of cited) {
    const web = meta?.groundingChunks?.[i]?.web;
    try {
      if (new URL(web?.uri).protocol === 'https:') urls.set(web.uri, web.title ?? web.uri);
    } catch { /* 검색 근거 없는 URL은 제외한다. */ }
  }
  return urls;
}
