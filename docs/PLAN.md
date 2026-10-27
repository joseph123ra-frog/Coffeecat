# 깝휘캣 인스타그램 매거진 자동화 계획 (B안 확정)

## 확정 사항
| 항목 | 결정 |
|---|---|
| 입력 | Notion DB (모바일 앱에서 질문 한 줄 입력) |
| 계정 | Instagram 크리에이터 계정 + Instagram 로그인 방식 API (페이스북 페이지 불필요) |
| 검수 | 완전 자동. 본문 끝에 고지 문구 고정 |
| 고지 문구 | `*해당 콘텐츠는 AI의 조사만을 거친 게시물로, 내용에 오류가 있을 수 있습니다` |
| 게시 | 하루 3회 (09:00 / 13:00 / 19:00 KST). 대기 질문 없으면 건너뜀, 하루 최대 3개 |
| 실행 | GitHub Actions + Claude API (Sonnet 5.5 + 웹 검색) |
| 예산 | 이 프로젝트 월 $40 상한 (전체 $100 중 개인 몫 $50에서 게임 2개 $10 제외). 초과 시 자동 중단 |
| 이미지 | Unsplash → (Pexels: 신규 키 발급 중단으로 보류) → Wikimedia Commons 순 검색. 없으면 같은 출처의 웃긴 고양이 사진 (글은 그대로). AI 생성 이미지 미사용 |
| 디자인 | C-2: 표지 전면 사진 / 본문 사진 70 + 흰 공간 30 / 시그니처 고정 |
| 호스팅 | GitHub Pages (공개 저장소) |

## 흐름
```
[Notion 앱] 질문 입력 → 상태: 대기
      │  GitHub Actions cron, 하루 3회
      ▼
① Notion: 가장 오래된 '대기' 1개 → '진행 중' (없으면 종료)
② 월 예산 확인 (초과 시 종료 + Notion 기록)
③ Claude API: 조사 → 표지·본문 6장 원고, 캡션·해시태그·출처·사진 검색어 (JSON)
④ 사진 검색: Unsplash → Pexels → Wikimedia → 웃긴 고양이 사진으로 대체
⑤ HTML 템플릿 → Playwright → JPEG 8장 (1080×1350)
⑥ 저장소에 커밋 → GitHub Pages 공개 URL
⑦ Instagram API: 항목 컨테이너 8개 → 캐러셀 컨테이너 → 게시
⑧ Notion: '완료' + 게시 URL / 실패 시 '실패' + 사유
```

## 슬라이드 구성 (8장, C안 풀블리드 포토 계열)
1. 표지: 질문 + 부제 + 전면 사진
2~7. 본문 6장: 모두 같은 형식. 소제목 + 2~3문장(100자 안팎) + 사진 (없으면 텍스트 카드)
   - 마지막 본문도 '요약' 같은 명시적 표시 없이 내용으로만 마무리
8. 시그니처: 깝휘캣 고정 페이지 (매 호 동일)
- 출처는 게시물 본문(캡션)에 기재

## 필요한 비밀값 (GitHub Secrets)
`ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `IG_USER_ID`, `IG_ACCESS_TOKEN`, `UNSPLASH_ACCESS_KEY` (선택: `PEXELS_API_KEY`)

## 진행 단계
- [x] 디자인 시안 3종 (`docs/design-samples/`)
- [x] C안 선택, 8장 구성 확정
- [x] 본문 레이아웃: C-2 분할 (사진 위·소제목 얹기 / 아래 흰 공간에 본문). 비율 70:30 확정. 사진 없으면 웃긴 고양이 사진 + 원래 글
- [x] 시그니처 문구 확정, 로고 없이 글자 로고 사용
- [x] Notion DB 읽기/쓰기 (`src/notion.js`)
- [x] Claude 조사·원고 생성 + 예산 관리 (`src/research.js`, `src/budget.js`)
- [x] 사진 검색·출처 표기 (`src/images.js`, `src/caption.js`)
- [x] Instagram 게시 (`src/instagram.js`)
- [x] Instagram 토큰 자동 갱신 (`.github/workflows/refresh-token.yml`, `SECRETS_PAT` 필요)
- [x] 게시 기록 보관 (`archive/noXXX-날짜.json`: 질문·원고·캡션·출처·URL)
- [x] 피드백 스킬 `/coffeecat-feedback` → `prompts/guidelines.md` 갱신, 기록은 `feedback/log.md`
- [x] GitHub Actions 일정 실행 + Pages (`.github/workflows/publish.yml`)
- [x] 계정·키 설정 가이드 (`docs/SETUP.md`)
- [x] 실제 계정으로 첫 연동 테스트 (2026-10-24, No.01 게시 성공, Claude 비용 $0.26)
