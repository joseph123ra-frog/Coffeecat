// 게시물 본문: 소개 글 → 출처 → 사진 출처 → 해시태그 → 고지 문구(항상 맨 끝)

import { DISCLAIMER } from './config.js';

const LIMIT = 2200; // Instagram 캡션 최대 길이
const MAX_HASHTAGS = 15;

export function buildCaption(draft, imageCredits) {
  const tags = [...new Set(draft.hashtags.map((t) => t.replace(/^#/, '').replace(/\s+/g, '')).filter(Boolean))]
    .slice(0, MAX_HASHTAGS)
    .map((t) => `#${t}`)
    .join(' ');
  const sources = draft.sources.map((s) => `- ${s.title} ${s.url}`).join('\n');
  const credits = [...new Set(imageCredits)].join(' / ');
  const tail = `\n\n출처\n${sources}\n\n사진: ${credits}\n\n${tags}\n\n${DISCLAIMER}`;
  const room = LIMIT - tail.length;
  const intro = draft.caption.length > room ? `${draft.caption.slice(0, room - 1)}…` : draft.caption;
  return intro + tail;
}
