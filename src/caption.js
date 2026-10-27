// 게시물 본문: 소개 글 → 출처 한 문장 → 사진 출처 → 해시태그 → 고지 문구(항상 맨 끝)
// 사진 작가 이름은 각 슬라이드에 들어가므로 본문에는 사진 사이트 이름만 적는다.

import { DISCLAIMER } from './config.js';

const LIMIT = 2200; // Instagram 캡션 최대 길이
// 2025년 12월부터 게시물당 해시태그 5개 제한이라는 자료가 있어 5개로 맞춘다 (주제 4개 + 계정 태그).
const MAX_TOPIC_TAGS = 4;
const BRAND_TAG = '#깝휘캣';

const siteOf = (credit) => (credit.includes('Wikimedia') ? 'Wikimedia Commons' : credit.includes('Pexels') ? 'Pexels' : 'Unsplash');

export function buildCaption(draft, imageCredits) {
  const topics = [...new Set(draft.hashtags.map((t) => t.replace(/^#/, '').replace(/\s+/g, '')).filter(Boolean))]
    .filter((t) => `#${t}` !== BRAND_TAG)
    .slice(0, MAX_TOPIC_TAGS)
    .map((t) => `#${t}`);
  const tags = [...topics, BRAND_TAG].join(' ');
  const sources = [...new Set(draft.sources.map((s) => s.title.trim()))].join(', ');
  const sites = [...new Set(imageCredits.map(siteOf))].join(', ');
  const tail = `\n\n출처: ${sources} 자료를 참고했습니다.\n사진: ${sites}\n\n${tags}\n\n${DISCLAIMER}`;
  const room = LIMIT - tail.length;
  // 첫 줄과 둘째 줄 사이에 빈 줄을 두지 않는다.
  const hook = draft.caption.trim().replace(/\n\s*\n+/g, '\n');
  const intro = hook.length > room ? `${hook.slice(0, room - 1)}…` : hook;
  return intro + tail;
}
