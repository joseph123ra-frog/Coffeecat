// 게시물 본문: 소개 글 → 출처 한 문장 → 사진 출처 → 해시태그 → 고지 문구(항상 맨 끝)
// 사진 작가 이름은 각 슬라이드에 들어가므로 본문에는 사진 사이트 이름만 적는다.

import { DISCLAIMER } from './config.js';

const LIMIT = 2200; // Instagram 캡션 최대 길이
const MAX_HASHTAGS = 15;

const siteOf = (credit) => (credit.includes('Wikimedia') ? 'Wikimedia Commons' : credit.includes('Pexels') ? 'Pexels' : 'Unsplash');

export function buildCaption(draft, imageCredits) {
  const tags = [...new Set(draft.hashtags.map((t) => t.replace(/^#/, '').replace(/\s+/g, '')).filter(Boolean))]
    .slice(0, MAX_HASHTAGS)
    .map((t) => `#${t}`)
    .join(' ');
  const sources = [...new Set(draft.sources.map((s) => s.title.trim()))].join(', ');
  const sites = [...new Set(imageCredits.map(siteOf))].join(', ');
  const tail = `\n\n출처: ${sources} 자료를 참고했습니다.\n사진: ${sites}\n\n${tags}\n\n${DISCLAIMER}`;
  const room = LIMIT - tail.length;
  const intro = draft.caption.length > room ? `${draft.caption.slice(0, room - 1)}…` : draft.caption;
  return intro + tail;
}
