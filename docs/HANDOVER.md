# Coffeecat 인수인계

기준일: 2026-11-07(한국 시간)

## 작업 원칙

- 사용자에게 한국어로 짧게 설명하고, 직접 해야 하는 일은 한 단계씩 안내합니다.
- 모르는 정보는 추측하지 않습니다. 인용 정보는 실제 페이지를 확인한 링크와 함께 제공합니다.
- API 키·토큰을 채팅이나 코드에 넣지 않습니다. 사용자가 GitHub Secrets에 직접 등록합니다.
- 확정된 디자인·운영 결정을 바꾸기 전에 사용자에게 묻습니다.

## Instagram 자동 게시

- 저장소: https://github.com/joseph123ra-frog/Coffeecat
- 기본 브랜치: `claude/brave-archimedes-77048b`
- Notion 질문을 조사해 8장 카드뉴스를 만들고 `@kkaphwi.cat`에 게시합니다.
- 예약: 매일 09:00 / 13:00 / 19:00 KST.
- 게시물 No.01~08이 발행됐고 `data/usage.json`의 issue는 8입니다.
- 유료 Claude API 코드는 제거했습니다. `src/gemini.js`와 `src/research.js`가 `gemini-2.5-flash-lite` 무료 등급만 호출합니다.
- `GEMINI_API_KEY`와 `GEMINI_FREE_TIER_CONFIRMED=true`를 등록하기 전까지 자동 게시 워크플로는 멈춰 있습니다.
- 전환 방법과 무료 등급 제한은 [GEMINI.md](GEMINI.md)에 기록돼 있습니다.

확정된 카드 구성과 편집 규칙은 [PLAN.md](PLAN.md), [SETUP.md](SETUP.md), [guidelines.md](../prompts/guidelines.md), [피드백 기록](../feedback/log.md)을 먼저 확인합니다.

## 밸런스 게임

- 공개 경로: `https://joseph123ra-frog.github.io/Coffeecat/balance/`
- 코드: `games/balance/`
- 한국 시간 0시에 질문이 바뀝니다. 회원가입 없이 브라우저별 하루 한 표를 받습니다.
- GitHub Pages는 화면을 배포하고 Supabase는 투표와 실시간 결과를 저장합니다.
- Supabase 연결 전에는 화면만 열리고 투표 버튼은 잠깁니다. 연결 절차는 `games/balance/README.md`에 있습니다.

## 탐정 게임

- 공개 경로: `https://joseph123ra-frog.github.io/Coffeecat/detective/`
- 코드: `games/detective/`
- 단서 7개 중 5개를 골라 용의자 4마리 중 범인을 찾습니다.
- 매일 21:07 KST에 오늘·내일 사건을 준비합니다. Gemini 무료 키가 없거나 호출이 실패하면 검증된 예비 사건을 씁니다.
- 생성 사건은 코드 논리 검사와 두 번의 독립 풀이 검증을 통과해야 공개됩니다.

## GitHub Pages 배포

- `게임 사이트 배포`는 두 게임을 한 Pages 안의 `/balance/`, `/detective/` 경로에 함께 올립니다.
- Instagram 게시·재게시 때도 `scripts/build-pages.js`가 게임과 게시물 이미지를 합쳐 게임이 지워지지 않게 합니다.
- 사용 완료한 `renumber.yml`은 삭제했습니다.

## 비밀값

- 기존 Notion·Instagram·Unsplash 비밀값은 그대로 사용합니다.
- 새로 필요한 값: Secret `GEMINI_API_KEY`, Variable `GEMINI_FREE_TIER_CONFIRMED`, Variable `SUPABASE_URL`, Secret `SUPABASE_ANON_KEY`.
- 값의 실제 유효성은 저장소 코드에서 읽을 수 없습니다. GitHub Actions 실행으로만 확인합니다.
