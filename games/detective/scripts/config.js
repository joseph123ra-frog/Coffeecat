// 무료 프로젝트의 키만 사용. 유료 제공자 대체 없음.
export const MODEL = 'gemini-2.5-flash-lite';
export const MONTHLY_BUDGET_USD = 0;
export const MAX_RUN_COST_USD = 0;
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
