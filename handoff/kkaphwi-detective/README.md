# 깝휘캣 탐정

하루 한 판, 고양이 탐정이 되어 푸는 모바일 추리 게임이다냥.
단서 7개 중 5개를 조사하고 범인을 한 번 지목합니다. 맞히면 스토리용 결과 카드를 저장할 수 있습니다.

배포 후 주소: https://joseph123ra-frog.github.io/kkaphwi-detective/

- 한국 시간 매일 21:07에 오늘·내일 사건을 준비합니다. 새 사건은 날짜가 바뀌는 0시부터 열립니다. 자동 실행은 지연될 수 있습니다.
- 생성 → 코드 논리 검사 → 전체 단서 풀이 검증 → 최소 단서 풀이 검증을 통과한 사건만 사용합니다.
- API 키가 없거나 생성에 실패하면 검토한 예비 사건을 사용합니다. 예비 사건 4개는 모두 사용한 뒤 순환합니다.
- 월 API 예산은 $5, 실행당 $0.50입니다. 호출 전 최대 비용을 확인하고 여유가 없으면 예비 사건을 사용합니다. 예상 월 약 $3은 추정이며 실제 사용량은 `data/usage.json`과 API 결제 내역을 확인해야 합니다.
- 응답을 받지 못해 비용이 불확실하면 최대 예약액을 비용 기록에 남깁니다. 예산 기록은 이 저장소의 자동 실행에만 적용됩니다. 다른 서비스의 같은 키 사용료는 포함하지 않습니다.

## 처음 설정

게임 전용 공개 저장소 `joseph123ra-frog/kkaphwi-detective`에 이 폴더 내용을 올립니다.
**Coffeecat Pages에는 배포하지 않습니다.** 자동 실행에도 전용 저장소 이름 확인 장치가 있습니다.

1. 저장소 **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다.
2. **Settings → Secrets and variables → Actions → Secrets → New repository secret**에서 이름 `ANTHROPIC_API_KEY`와 API 키를 등록합니다. 키를 채팅이나 코드에 적지 마세요.
3. **Actions → 매일 새 사건과 게임 배포 → Run workflow**로 실행합니다. 처음 실제 API 검사는 비용이 드므로 사용자 확인 후 한 번만 진행합니다.

이미 오늘·내일 사건이 있으면 생성 호출을 하지 않습니다. 첫 유료 검사도 필요한 날짜의 사건이 없을 때 진행합니다. 설정 전에도 예비 사건으로 게임을 열 수 있습니다.

공식 안내: [Pages 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [API 키 등 비밀값 등록](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [API 요금](https://platform.claude.com/docs/en/about-claude/pricing).

## 사건을 고치거나 문제가 생겼을 때

- **Actions**에서 최근 실행을 열어 실패한 단계를 확인합니다. 비용 기록을 지우면 예산 계산이 초기화되므로 지우지 마세요.
- 사건은 `site/cases/날짜.json`에 있습니다. 정답은 뒤섞여 있으므로 `answer`를 직접 고치지 마세요. 원본 사건을 수정한 뒤 `node scripts/publish-case.js 원본.json YYYY-MM-DD`로 바꿉니다. 오늘 사건이면 `latest.json`도 함께 갱신합니다. 이미 플레이한 사건을 바꾸면 이용자별 저장 결과가 달라질 수 있습니다.
- 공개 저장소이므로 정답을 미리 알아내는 것을 완전히 막지는 못합니다. AI 사건의 재미와 문장은 가끔 직접 확인해 주세요.
- 인스타 앱에서 공유가 안 되면 결과 이미지를 길게 눌러 저장합니다. 실제 인스타 앱에서의 동작은 기기 확인이 필요합니다.

## 로컬 확인

Node.js 22 이상에서 `npm ci`, `npm run check`, `npm test`를 실행합니다.
`npm run generate`는 키가 없으면 무료 예비 사건을 준비합니다.
`python3 -m http.server 8000 -d site`를 실행하고 `http://localhost:8000`을 엽니다.
화면 검사는 Playwright와 Chromium이 있는 환경에서 `node tests/browser.cjs`로 실행합니다.
