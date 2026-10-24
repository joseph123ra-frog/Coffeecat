// Notion 질문 DB 읽기/쓰기. API 버전 2025-09-03부터 DB 조회는 data source 단위로 한다.

import { env, NOTION_PROPS, STATUS } from './config.js';

const API = 'https://api.notion.com/v1';
const VERSION = '2025-09-03';

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env('NOTION_TOKEN')}`,
      'Notion-Version': VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Notion ${method} ${path} 실패 (${res.status}): ${json.message ?? ''}`);
  return json;
}

async function dataSourceId() {
  const db = await call('GET', `/databases/${env('NOTION_DATABASE_ID')}`);
  const id = db.data_sources?.[0]?.id;
  if (!id) throw new Error('Notion DB에서 data source를 찾지 못했습니다.');
  return id;
}

const titleOf = (page) => {
  const prop = Object.values(page.properties).find((p) => p.type === 'title');
  return prop?.title.map((t) => t.plain_text).join('').trim() ?? '';
};

// 상태가 '대기'이거나 비어 있는 질문 중 가장 먼저 만든 것 1개
export async function nextQuestion() {
  const res = await call('POST', `/data_sources/${await dataSourceId()}/query`, {
    filter: {
      or: [
        { property: NOTION_PROPS.status, select: { equals: STATUS.waiting } },
        { property: NOTION_PROPS.status, select: { is_empty: true } },
      ],
    },
    sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
    page_size: 10,
  });
  for (const page of res.results) {
    const question = titleOf(page);
    if (question) return { pageId: page.id, question };
  }
  return null;
}

export async function updateQuestion(pageId, { status, url, note }) {
  const properties = {};
  if (status) properties[NOTION_PROPS.status] = { select: { name: status } };
  if (url) properties[NOTION_PROPS.url] = { url };
  if (note !== undefined) {
    properties[NOTION_PROPS.note] = { rich_text: [{ text: { content: String(note).slice(0, 1900) } }] };
  }
  await call('PATCH', `/pages/${pageId}`, { properties });
}
