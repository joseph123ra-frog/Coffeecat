# 깝휘캣 인스타그램 매거진 자동화 계획 (B안 확정)

## 확정 사항
| 항목 | 결정 |
|---|---|
| 입력 | Notion DB (모바일 앱에서 질문 한 줄 입력) |
| 계정 | Instagram 크리에이터 계정 + Instagram 로그인 방식 API (페이스북 페이지 불필요) |
| 검수 | 완전 자동. 본문 끝에 고지 문구 고정 |
| 고지 문구 | `*해당 콘텐츠는 AI의 조사만을 거친 게시물로, 내용에 오류가 있을 수 있습니다` |
| 게시 | 하루 2회 (09:00 / 19:00 KST). 대기 질문 없으면 건너뜀, 하루 최대 2개 |
| 실행 | GitHub Actions + Claude API (Sonnet 5.5 + 웹 검색) |
| 예산 | 이 프로젝트 월 $30 상한. 초과 시 자동 중단 |
| 이미지 | Unsplash → Pexels → Wikimedia Commons 순 검색. 없으면 같은 출처의 고양이 사진 + 자체 밈 문구. AI 생성 이미지 미사용 |
| 호스팅 | GitHub Pages (공개 저장소) |

## 흐름
```
[Notion 앱] 질문 입력 → 상태: 대기
      │  GitHub Actions cron, 하루 2회
      ▼
① Notion: 가장 오래된 '대기' 1개 → '진행 중' (없으면 종료)
② 월 예산 확인 (초과 시 종료 + Notion 기록)
③ Claude API: 조사 → 6장 원고·본문·해시태그·출처·사진 검색어 (JSON)
④ 사진 검색: Unsplash → Pexels → Wikimedia → 고양이 사진 대체
⑤ HTML 템플릿 → Playwright → JPEG 6장 (1080×1350)
⑥ 저장소에 커밋 → GitHub Pages 공개 URL
⑦ Instagram API: 항목 컨테이너 6개 → 캐러셀 컨테이너 → 게시
⑧ Notion: '완료' + 게시 URL / 실패 시 '실패' + 사유
```

## 슬라이드 구성 (6장)
1. 표지: 질문 + 부제 + 사진
2~5. 본문: 제목 + 2~3문장(120자 안팎) + 사진 (없으면 텍스트 카드)
6. 요약: 핵심 3줄 + 출처 + 고지

## 필요한 비밀값 (GitHub Secrets)
`ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `IG_USER_ID`, `IG_ACCESS_TOKEN`, `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`

## 진행 단계
- [x] 디자인 시안 3종 (`docs/design-samples/`)
- [ ] 시안 확정
- [ ] Notion DB 구성 + 읽기/쓰기
- [ ] Claude 조사·원고 생성 + 예산 관리
- [ ] 사진 검색·출처 표기
- [ ] Instagram 게시 + 토큰 갱신
- [ ] GitHub Actions 일정 실행 + Pages
- [ ] 계정·키 설정 가이드
