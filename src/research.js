// 질문 → (1) 웹 검색으로 조사 노트 작성 → (2) 노트를 8장 원고 JSON으로 정리
// 두 단계로 나눈 이유: 웹 검색 결과에는 인용(citations)이 붙는데,
// 구조화 출력(output_config.format)은 인용과 같이 쓸 수 없다.

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { MODEL, WEB_SEARCH_MAX_USES, BODY_SLIDES } from './config.js';

const client = new Anthropic();

const RESEARCH_SYSTEM = `당신은 한국어 인스타그램 매거진 '깝휘캣'의 리서처입니다.
주어진 질문을 웹 검색으로 조사해, 6장짜리 카드뉴스 본문에 쓸 근거 노트를 만듭니다.
- 공신력 있는 출처(공공기관, 학술 자료, 주요 언론, 공식 문서)를 우선합니다.
- 사실마다 근거 URL을 붙입니다. 검색 결과에서 확인하지 못한 내용은 쓰지 않습니다.
- 출처끼리 엇갈리는 내용은 엇갈린다고 적습니다.
- 질문 → 배경 → 핵심 이유/사실 → 의미 순으로 이야기 흐름이 생기게 정리합니다.`;

const Draft = z.object({
  cover: z.object({
    title: z.string().describe('표지 제목. 한 줄 9자 이내, 최대 3줄, 줄바꿈은 \\n'),
    subtitle: z.string().describe('표지 부제. 40자 이내'),
    imageQuery: z.string().describe('표지 사진 검색어. 영어 2~4단어'),
  }),
  bodies: z
    .array(
      z.object({
        title: z.string().describe('소제목. 12자 이내'),
        body: z.string().describe('본문. 2~3문장, 100자 이내'),
        imageQuery: z.string().describe('사진 검색어. 영어 2~4단어'),
      }),
    )
    .describe(`정확히 ${BODY_SLIDES}개. 하나의 흐름으로 이어지고, 마지막 장은 요약이라는 표시 없이 내용으로 마무리`),
  caption: z.string().describe('게시물 본문. 3~5문장, 600자 이내. 해시태그·출처·고지 문구는 넣지 않음'),
  hashtags: z.array(z.string()).describe('해시태그 10~15개. # 없이'),
  sources: z
    .array(z.object({ title: z.string(), url: z.string() }))
    .describe('본문 근거 출처 2~5개. 반드시 허용된 URL 목록 안에서만'),
});

const sumUsage = (a, b) => ({
  input_tokens: (a.input_tokens ?? 0) + (b.input_tokens ?? 0),
  output_tokens: (a.output_tokens ?? 0) + (b.output_tokens ?? 0),
  cache_creation_input_tokens: (a.cache_creation_input_tokens ?? 0) + (b.cache_creation_input_tokens ?? 0),
  cache_read_input_tokens: (a.cache_read_input_tokens ?? 0) + (b.cache_read_input_tokens ?? 0),
  server_tool_use: {
    web_search_requests:
      (a.server_tool_use?.web_search_requests ?? 0) + (b.server_tool_use?.web_search_requests ?? 0),
  },
});

// 실패해도 이미 쓴 비용은 기록해야 하므로 호출마다 누적해 둔다.
let total = {};
export const totalUsage = () => total;
const record = (u) => {
  total = sumUsage(total, u);
};

function assertNotRefused(response) {
  if (response.stop_reason === 'refusal') {
    throw new Error(`Claude가 요청을 거절했습니다: ${response.stop_details?.explanation ?? '사유 없음'}`);
  }
}

async function researchNotes(question) {
  const messages = [{ role: 'user', content: `질문: ${question}` }];
  let response;
  // 서버 쪽 검색 루프가 길어지면 pause_turn으로 끊긴다. 같은 대화를 다시 보내 이어간다.
  for (let i = 0; i < 4; i++) {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: RESEARCH_SYSTEM,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: WEB_SEARCH_MAX_USES }],
      messages,
    });
    record(response.usage);
    assertNotRefused(response);
    if (response.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: response.content });
  }

  const urls = new Map();
  const texts = [];
  for (const msg of [...messages.slice(1).map((m) => m.content).flat(), ...response.content]) {
    if (msg.type === 'web_search_tool_result' && Array.isArray(msg.content)) {
      for (const r of msg.content) if (r.url) urls.set(r.url, r.title ?? r.url);
    }
    if (msg.type === 'text') {
      texts.push(msg.text);
      for (const c of msg.citations ?? []) if (c.url) urls.set(c.url, c.title ?? c.url);
    }
  }
  return { notes: texts.join('\n'), urls };
}

async function writeDraft(question, notes, urls) {
  const allowed = [...urls].map(([url, title]) => `- ${title} | ${url}`).join('\n');
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'medium', format: zodOutputFormat(Draft) },
    system: `당신은 한국어 인스타그램 매거진 '깝휘캣'의 에디터입니다.
조사 노트만을 근거로 카드뉴스 원고를 씁니다. 노트에 없는 사실은 쓰지 않습니다.
말투는 친근하지만 정확하게, 문장은 짧게 씁니다. 글자 수 제한을 반드시 지킵니다.`,
    messages: [
      {
        role: 'user',
        content: `질문: ${question}\n\n## 조사 노트\n${notes}\n\n## 허용된 출처 URL\n${allowed}`,
      },
    ],
  });
  record(response.usage);
  assertNotRefused(response);
  const draft = response.parsed_output;
  if (!draft) throw new Error('원고 JSON을 해석하지 못했습니다.');
  if (draft.bodies.length !== BODY_SLIDES) {
    throw new Error(`본문이 ${BODY_SLIDES}장이 아닙니다 (${draft.bodies.length}장).`);
  }
  // 지어낸 출처를 막기 위해 실제 검색 결과에 나온 URL만 남긴다.
  draft.sources = draft.sources.filter((s) => urls.has(s.url));
  if (draft.sources.length === 0) throw new Error('검증된 출처가 하나도 없습니다.');
  return draft;
}

export async function research(question) {
  const { notes, urls } = await researchNotes(question);
  if (urls.size === 0) throw new Error('웹 검색 결과가 없습니다.');
  return writeDraft(question, notes, urls);
}
