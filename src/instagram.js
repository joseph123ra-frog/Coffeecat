// Instagram API (Instagram 로그인 방식)로 캐러셀 게시.
// 순서: 사진마다 항목 컨테이너 생성 → 캐러셀 컨테이너 생성 → 처리 완료 대기 → 게시

import { env } from './config.js';

const API = 'https://graph.instagram.com/v25.0';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, path, params = {}) {
  const body = new URLSearchParams({ ...params, access_token: env('IG_ACCESS_TOKEN') });
  const url = method === 'GET' ? `${API}${path}?${body}` : `${API}${path}`;
  const res = await fetch(url, { method, body: method === 'GET' ? undefined : body });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`Instagram ${path} 실패 (${res.status}): ${json.error?.message ?? JSON.stringify(json)}`);
  }
  return json;
}

async function waitFinished(containerId) {
  for (let i = 0; i < 30; i++) {
    const { status_code: status } = await call('GET', `/${containerId}`, { fields: 'status_code' });
    if (status === 'FINISHED') return;
    if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`컨테이너 ${containerId} 상태: ${status}`);
    await sleep(5000);
  }
  throw new Error(`컨테이너 ${containerId} 처리 시간 초과`);
}

export async function publishCarousel(imageUrls, caption) {
  const user = env('IG_USER_ID');
  const children = [];
  for (const image_url of imageUrls) {
    const { id } = await call('POST', `/${user}/media`, { image_url, is_carousel_item: 'true' });
    children.push(id);
  }
  for (const id of children) await waitFinished(id);

  const { id: carousel } = await call('POST', `/${user}/media`, {
    media_type: 'CAROUSEL',
    children: children.join(','),
    caption,
  });
  await waitFinished(carousel);

  const mediaId = await publishWithRetry(user, carousel, caption);
  const { permalink } = await call('GET', `/${mediaId}`, { fields: 'permalink' });
  return { mediaId, permalink };
}

// 처리 완료(FINISHED) 직후에도 media_publish가 'Media ID is not available'로 실패할 때가 있다.
// 그 사이 실제로는 게시됐을 수 있으므로, 다시 시도하기 전에 최근 게시물에 같은 본문이 있는지 먼저 본다.
async function publishWithRetry(user, carousel, caption) {
  for (let attempt = 1; ; attempt++) {
    try {
      const { id } = await call('POST', `/${user}/media_publish`, { creation_id: carousel });
      return id;
    } catch (err) {
      if (attempt >= 4) throw err;
      console.warn(`게시 재시도 ${attempt}/3: ${err.message}`);
      await sleep(20_000 * attempt);
      const { data = [] } = await call('GET', `/${user}/media`, { fields: 'id,caption', limit: '3' });
      const already = data.find((m) => m.caption === caption);
      if (already) return already.id;
    }
  }
}
