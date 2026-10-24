# 설정 가이드

코드는 준비돼 있고, 아래 계정·키를 만들어 GitHub Secrets에 넣으면 동작한다.
이 작업 환경에서는 Meta·Notion·사진 사이트 접속이 막혀 있어 **실제 연동 테스트는 아직 하지 못했다.** 모의(mock) 테스트만 통과했다.

## 1. Notion
1. Notion에서 새 데이터베이스(표)를 만든다. 속성 이름은 정확히 아래와 같아야 한다.

   | 속성 이름 | 유형 | 비고 |
   |---|---|---|
   | (제목 열) | 제목 | 질문을 적는 칸. 이름은 자유 |
   | 상태 | 선택(select) | 옵션: `대기`, `진행 중`, `완료`, `실패`. 비워 두면 `대기`로 취급 |
   | 게시 URL | URL | 게시 후 자동 기록 |
   | 메모 | 텍스트 | 호수·실패 사유 자동 기록 |

2. https://www.notion.so/profile/integrations 에서 내부 통합(Internal integration)을 만들고 토큰을 복사한다 → `NOTION_TOKEN`
3. 데이터베이스 페이지 오른쪽 위 `···` → 연결(Connections)에서 방금 만든 통합을 추가한다.
4. 데이터베이스 URL에서 32자리 ID를 복사한다 → `NOTION_DATABASE_ID`
   - 예: `notion.so/워크스페이스/0123456789abcdef0123456789abcdef?v=...` 의 `0123...cdef`

실패한 질문을 다시 돌리려면 상태를 `대기`로 바꾸면 된다.

## 2. Instagram
1. 인스타그램 계정을 만들고 앱 설정에서 **크리에이터 계정**으로 전환한다.
2. Meta 개발자 사이트에서 앱을 만들고 'Instagram API (Instagram 로그인)' 제품을 추가한다.
3. 권한 `instagram_business_basic`, `instagram_business_content_publish`로 장기 액세스 토큰을 발급한다 → `IG_ACCESS_TOKEN`
4. 계정의 Instagram 사용자 ID를 확인한다 → `IG_USER_ID`

※ Meta 화면 구성은 자주 바뀌고 이 환경에서는 원문을 열 수 없었다. 이 단계는 함께 화면을 보며 진행하는 것을 권한다.
※ 장기 토큰은 만료 기한이 있는 것으로 알려져 있다(확인 필요). 자동 갱신은 다음 단계에서 추가한다.

## 3. 사진 API (무료)
- Unsplash: https://unsplash.com/developers 에서 앱 등록 → Access Key → `UNSPLASH_ACCESS_KEY`
- Pexels: 2026-10 현재 신규 API 키 발급이 중단돼 있어 건너뛴다. 발급이 재개되면 `PEXELS_API_KEY`만 추가하면 자동으로 쓰인다.
- Wikimedia Commons: 키 불필요

## 4. Claude API
- https://platform.claude.com 에서 이 프로젝트 전용 API 키를 만든다 → `ANTHROPIC_API_KEY`
- 코드에 월 $30 상한이 들어가 있다(`src/config.js`). 콘솔에서도 별도 한도를 걸 수 있는지 확인 권장.

## 5. GitHub
1. 저장소를 공개(Public)로 둔다.
2. Settings → Secrets and variables → Actions 에 위 6개 값을 등록한다.
   `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `IG_USER_ID`, `IG_ACCESS_TOKEN`, `UNSPLASH_ACCESS_KEY` (선택: `PEXELS_API_KEY`)
3. Settings → Pages → Source를 **GitHub Actions**로 바꾼다.
4. 정기 실행(cron)은 기본 브랜치(main)에서만 동작하므로, 작업 브랜치를 main에 합친다.
5. Actions 탭 → '깝휘캣 자동 게시' → Run workflow로 첫 실행을 수동으로 해 본다.

## 동작 규칙 요약
- 매일 09:00, 19:00 (KST) 실행. 한 번에 1개, 하루 최대 2개.
- 대기 질문이 없거나 월 예산이 남지 않으면 아무것도 하지 않는다.
- 아이디가 정해지면 `src/config.js`의 `HANDLE`을 바꾼다.
