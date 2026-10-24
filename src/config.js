// 전체 설정. 비밀값은 GitHub Secrets → 환경 변수로 들어온다.

export const MODEL = 'claude-sonnet-5-5';

// Claude API 단가 (USD, 2026-10 확인: https://platform.claude.com/docs/en/about-claude/pricing)
export const PRICE = {
  inputPerMTok: 2,
  outputPerMTok: 10,
  cacheWritePerMTok: 2.5,
  cacheReadPerMTok: 0.1,
  perWebSearch: 10 / 1000,
};

export const MONTHLY_BUDGET_USD = 30;
// 한 번 실행에 들 수 있는 최대 비용 추정치. 남은 예산이 이보다 적으면 실행하지 않는다.
export const MAX_RUN_COST_USD = 1;
export const MAX_POSTS_PER_DAY = 2;
export const WEB_SEARCH_MAX_USES = 8;

export const BODY_SLIDES = 6;
export const STYLE = 'split';
// 시그니처 페이지에 넣을 인스타그램 아이디. 계정이 정해지면 바꾼다.
export const HANDLE = '@kkaphwi.cat';

export const DISCLAIMER = '*해당 콘텐츠는 AI의 조사만을 거친 게시물로, 내용에 오류가 있을 수 있습니다';

// Notion DB 속성 이름. Notion에서 만든 이름과 같아야 한다.
export const NOTION_PROPS = {
  status: '상태',
  url: '게시 URL',
  note: '메모',
};
export const STATUS = { waiting: '대기', running: '진행 중', done: '완료', failed: '실패' };

export const PATHS = {
  ledger: 'data/usage.json',
  post: 'out/post',
};

export function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`환경 변수 ${name}이(가) 없습니다.`);
  return value;
}

// 한국 시간 기준 날짜
export function kstDate(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return {
    day: k.toISOString().slice(0, 10),
    month: k.toISOString().slice(0, 7),
    dotted: k.toISOString().slice(0, 10).replaceAll('-', '.'),
  };
}
