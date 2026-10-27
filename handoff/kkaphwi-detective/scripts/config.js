// 전체 설정. API 키는 GitHub Secrets → 환경 변수(ANTHROPIC_API_KEY)로 들어온다.

export const MODEL = 'claude-sonnet-5-5';

// Claude API 단가 (USD, 2026-10 확인: https://platform.claude.com/docs/en/about-claude/pricing)
export const PRICE = {
  inputPerMTok: 2,
  outputPerMTok: 10,
  cacheWritePerMTok: 2.5,
  cacheReadPerMTok: 0.1,
};

// 깝휘캣 저장소 src/config.js: 개인 프로젝트 몫 중 게임 2개에 $10. 이 게임은 $5.
export const MONTHLY_BUDGET_USD = 5;
// 사건 1개를 만드는 데 들 수 있는 최대 비용 추정치(재시도 포함). 남은 예산이 이보다 적으면 예비 사건을 쓴다.
export const MAX_RUN_COST_USD = 0.5;
export const MAX_ATTEMPTS = 3;

export const SUSPECTS = 4;
export const CLUES = 7;
// 플레이어가 고를 수 있는 조사 수. 범인을 가리는 데 필요한 단서 수가 이보다 많으면 안 된다.
export const PICKS = 5;

export const FUR = ['주황', '검정', '흰색', '회색', '삼색', '고등어', '턱시도', '갈색'];

export const PATHS = {
  ledger: 'data/usage.json',
  backups: 'data/backup',
  cases: 'site/cases',
};

export function kstDate(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return { day: k.toISOString().slice(0, 10), month: k.toISOString().slice(0, 7) };
}

export function addDays(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
