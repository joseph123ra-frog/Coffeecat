# 인수인계: 깝휘캣 탐정 게임

이 문서는 다른 AI 코딩 에이전트(Codex)가 작업을 이어받기 위한 지시문이다. 위에서부터 순서대로 읽고 진행한다.

---

## 0. 먼저 지킬 것 (사용자 규칙)

사용자는 개발자가 아니다. 아래 규칙은 이 문서의 어떤 내용보다 우선한다.

1. 사용자에게 하는 설명은 **한국어로, 쉽고 짧게** 쓴다. 꾸밈말과 중복은 뺀다.
2. 사용자가 직접 해야 하는 일은 **최소로** 줄인다. 꼭 필요하면 **한 번에 한 단계씩** 안내한다(무엇을 누르고 무엇을 입력하는지까지).
3. 요청이 조금이라도 애매하면 **바로 만들지 말고 먼저 묻는다.** 단, 이 문서에 이미 정해진 것은 다시 묻지 않는다.
4. 모르거나 확인하지 못한 것은 지어내지 않는다. "신뢰할 수 있는 데이터 없음" 또는 "확인하지 못했다"고 밝힌다.
5. 정보를 인용하면 출처 링크를 단다. 링크가 실제로 열리는지, 그 페이지에 해당 내용이 있는지 확인한다.
6. 답하기 전에 논리 모순, 편향, 지어낸 내용, 빠진 부분(MECE 기준)이 없는지 스스로 검토한다.
7. 커밋 메시지, 코드 주석, 문서에 AI 모델 이름(예: 특정 모델 버전명)을 넣지 않는다. 단, 코드 안의 API 모델 ID 문자열(`claude-sonnet-5-5`)은 예외다.

---

## 1. 무엇을 만드는가

**"깝휘캣 탐정"**: 하루에 한 판씩 하는 모바일 웹 텍스트 추리 게임.

- 사용자는 인스타그램 매거진 **깝휘캣**(@kkaphwi.cat)을 운영한다. AI가 궁금한 질문을 조사해 카드뉴스로 올리는 계정이고, 콘셉트는 "궁금한 건 못 참는 고양이가 대신 찾아봤다냥"이다.
- 게임 주소는 **인스타 프로필 링크**에 넣는다. 인스타에 게시물을 계속 올리는 방식이 아니라 **웹사이트**다.
- 플레이어는 고양이 탐정 깝휘캣이 된다.
- 매일 0시(한국 시간)에 새 사건이 하나 열린다. 모든 플레이어가 같은 사건을 푼다.
- 진행 순서: 사건 소개 → 조사(7개 중 5개 선택) → 범인 지목(기회 1번) → 정답 공개.
- 맞히면 인스타 스토리에 공유하기 좋은 **결과 카드 이미지**(세로 1080×1920)를 보여 준다.
- 사건은 고양이 세계관의 귀엽고 엉뚱한 일상 미스터리다(예: "사라진 참치 츄르 사건").
- 한 판은 5~10분 분량이고, 모바일 화면에 맞춘다.

### 디자인 톤 (깝휘캣과 같게)
- 배경 `#151413`, 금색 포인트 `#E8C07D`, 흰 글씨
- 굵은 고딕 **Noto Sans KR**(400/700/900)
- 글자 로고 "깝휘캣"

---

## 2. 이미 정해진 결정 (다시 묻지 말 것)

| 항목 | 결정 |
|---|---|
| 호스팅 | **A안**: 게임 전용 새 GitHub 공개 저장소 `joseph123ra-frog/kkaphwi-detective` + 그 저장소의 GitHub Pages |
| 사건 생성 | GitHub Actions가 하루 1회 실행. Claude API로 사건을 만들어 JSON 파일로 저장 |
| 틀렸을 때 | **기회 1번**. 틀리면 정답과 해설만 공개하고 결과 카드는 없음 |
| 조사 | 7개 중 **5개만** 고를 수 있음 |
| 결과 카드 | **맞혔을 때만** 표시 |
| 새 사건 시각 | 매일 0시(한국 시간). 따로 묻지 않고 이렇게 정함 |

### 중요한 제약
- **깝휘캣 저장소 `joseph123ra-frog/Coffeecat`의 GitHub Pages에는 절대 올리지 않는다.** 그 Pages는 매 게시물마다 통째로 덮어써진다. 게임은 반드시 별도 저장소에 둔다.
- **비용: Claude API 월 $5 이내.** 회사 프로젝트와 월 $100 한도를 나눠 쓴다. Coffeecat 저장소 `src/config.js`에는 "개인 프로젝트 몫 $50 = 깝휘캣 $40 + 게임 2개(밸런스 게임·탐정 게임) $10"으로 적혀 있다. 이 게임 몫은 $5다.
  - 참고: 사용자는 처음에 "깝휘캣이 월 $30을 쓴다"고 했지만, 저장소 코드의 상한은 이미 $40으로 바뀌어 있다. 이 게임의 $5와는 충돌하지 않는다.
- **사건마다 단서와 정답이 논리적으로 맞아야 한다.** 단서로 범인을 추리할 수 없는 사건은 올리면 안 된다.

### 모델 선택 (사용자에게 아직 알리지 않음, 완료 보고 때 알릴 것)
- 사건 생성과 검증 모두 `claude-sonnet-5-5`를 쓴다. Coffeecat과 같은 모델이고, $5 예산에 맞추기 위한 선택이다.
- Opus 5.5($4/$20 per MTok)를 쓰면 월 약 $6~8로 예상되어 예산을 넘는다. 이 판단은 **완료 보고 때 사용자에게 한 줄로 알린다.** 사용자가 바꾸라고 하면 바꾼다.
- 요금 출처: https://platform.claude.com/docs/en/about-claude/pricing (2026-10-27에 열어서 확인함)
  - Sonnet 5.5: 입력 $2, 출력 $10 per MTok
  - Haiku 5.5: 입력 $0.10, 출력 $0.50 per MTok
  - Batch API는 50% 할인

---

## 3. 현재 상태

### 작업 위치
- 진행 중인 코드는 Coffeecat 저장소 브랜치 `claude/focused-franklin-fscycc`의 `handoff/kkaphwi-detective/`에 있다.
- 여기는 **임시 보관 위치**다. 최종 위치는 새 저장소 `joseph123ra-frog/kkaphwi-detective`의 루트다.
- 새 저장소는 **아직 없다.** 이전 에이전트가 GitHub API로 만들려 했지만 `403 Resource not accessible by integration` 오류로 실패했다. 아래 4-6처럼 처리한다.
- 빈 폴더는 git에 올라가지 않아서 `site/cases/`와 `.github/workflows/`가 빠져 있다. 새로 만든다.

### 완료된 파일

| 파일 | 내용 | 상태 |
|---|---|---|
| `package.json`, `package-lock.json` | 의존성: `@anthropic-ai/sdk` 1.3.0, `zod` 4.6.7 (Coffeecat과 같은 버전). ESM(`"type": "module"`) | 완료 |
| `scripts/config.js` | 모델, 단가, 월 예산 $5, 실행당 최대 $0.5, 시도 3회, 용의자 4·단서 7·선택 5, 털색 목록, 경로, 한국 시간 날짜 함수 | 완료 |
| `scripts/case.js` | 사건 zod 스키마, `minimalCover`, `checkCase`, `playerText`, `scramble`, `toPublic` (아래 설명 참고) | 완료 |
| `scripts/generate.js` | 오늘·내일 사건이 없으면 생성 → 코드 검사 → AI 풀이 검증 2회 → 저장. 실패하거나 예산이 부족하면 예비 사건 사용. 사용량 기록 | 작성 완료, **실제 API로 실행해 본 적 없음** |
| `scripts/check-backups.js` | 예비 사건이 논리 검사를 통과하는지 확인(API 미사용) | 완료. `001.json`이 "통과 (필요한 단서 3개)"로 나옴 |
| `data/backup/001.json` | 예비 사건 "사라진 참치 츄르 사건"(사용자에게 샘플로 보여 주고 승인받은 사건) | 완료 |
| `site/index.html` | 페이지 뼈대: 헤더 로고, `<main id="app">`, 푸터(@kkaphwi.cat 링크), Google Fonts, `style.css`, `game.js` 로드 | 완료 |
| `site/style.css` | 전체 스타일(아래 4-1의 클래스 이름과 맞춰져 있음) | 완료. game.js를 만들며 필요하면 수정 |

### 남은 작업 (4장에서 자세히)
1. `site/game.js`: 게임 화면 전체 로직 (**가장 큰 작업**)
2. `.github/workflows/daily.yml`: 사건 생성, 커밋, Pages 배포
3. `README.md`: 사용자용 한국어 설명
4. 예비 사건 2~4개 추가
5. 로컬 테스트: 논리 검사 음성 테스트, 화면 스크린샷 확인
6. 새 저장소로 옮기기, 사용자 설정 안내, 첫 실행 확인
7. 완료 보고

### 핵심 설계 설명 (이미 구현됨)

**사건 데이터 (`scripts/case.js`의 `Case` 스키마, AI 출력 형식)**
- `plan`: 작가가 먼저 하는 설계. 공개하지 않음
- `title`, `intro`
- `suspects[4]`: `{id: A~D, name, fur(털색 enum), desc}`
- `clues[7]`: `{label, text, eliminates: [id], pointsTo: [id]}`
  - `eliminates`: 이 단서만으로 범인이 아니라고 확정되는 용의자
  - `pointsTo`: 이 단서가 의심스럽게 보이게 하는 용의자
- `culprit`, `culpritLine`(범인의 자백 한마디), `solution`(해설)

**논리 보장 (3중)**
1. `checkCase`(코드 검사)
   - 용의자가 A~D이고 이름이 겹치지 않음, 단서 7개
   - 어떤 단서도 범인을 제외하지 않음
   - 무고한 3마리 모두 제외하는 단서가 있음
   - 범인을 가리키는 단서가 1개 이상, 헷갈리는 단서(무고한 용의자를 가리킴)가 1개 이상
   - 무고한 3마리를 빼는 최소 단서 조합(`minimalCover`, 전수 탐색)이 2개 이상 5개 이하
2. AI 풀이 검증 A: 정답을 모르는 별도 호출이 **단서 7개 전부**를 보고 범인을 맞혀야 함
3. AI 풀이 검증 B: **최소 단서 조합만** 보고도 같은 범인을 맞혀야 함. 5개만 골라도 풀 수 있다는 보장이다.
- 셋 중 하나라도 실패하면 실패 사유를 다음 시도 프롬프트에 넣어 다시 만든다(최대 3회). 그래도 안 되면 예비 사건을 쓴다.
- `eliminates`는 AI가 직접 적은 값이다. 거짓으로 적어도 검증 B가 잡아낸다.

**공개 파일 (`toPublic`)**
- 위치: `site/cases/YYYY-MM-DD.json`, 오늘 사건은 `site/cases/latest.json`에도 복사
- 내용: `{no, date, title, intro, suspects[{id,name,fur,desc}], clues[{id:"c1".., label, text}], answer}`
- 단서 순서는 섞는다. `eliminates`/`pointsTo`/`plan`은 넣지 않는다.
- `answer` = `{culprit, culpritLine, solution}`을 JSON → UTF-8 바이트 → 열쇠 `"kkaphwi-" + date`로 바이트 XOR → base64
- 공개 저장소라 마음먹으면 정답을 볼 수 있다. 사용자에게 이미 설명했고 A안으로 받아들였다. 이 뒤섞기는 파일을 열자마자 정답이 보이지 않게 하는 정도다.

**생성 시점**
- `generate.js`는 오늘과 내일(한국 시간) 파일 중 없는 것을 만든다.
- 워크플로를 **전날 저녁(예: 21시 KST)** 에 돌려 내일 사건을 미리 만들어 둔다. GitHub cron이 늦어져도 0시에 사건이 비지 않게 하기 위해서다.

**비용 기록**
- `data/usage.json`: `{months: {"YYYY-MM": {usd, runs}}, usedBackups: [...], history: [{no, date, title, source: "ai"|"backup", usd}]}`
- 시도마다 "이번 달 누적 + 이번 실행 + 시도당 예상 $0.167"이 $5를 넘으면 중단하고 예비 사건을 쓴다.
- 예상 비용: 시도 1회(생성 + 풀이 2회)에 약 $0.08~0.12, 월 약 $3. **실제 첫 실행 비용을 꼭 확인해서 보고한다.**

**API 호출 방식 (`generate.js`의 `ask`)**
- `client.beta.messages.parse({ model, max_tokens: 16000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default', output_config: { effort: 'medium', format: betaZodOutputFormat(schema) }, system, messages })`
- `betaZodOutputFormat`은 `@anthropic-ai/sdk/helpers/beta/zod`에서 가져온다(설치된 SDK 1.3.0에 있음을 확인함).
- `stop_reason === 'refusal'`을 확인하고, 결과는 `parsed_output`에서 읽는다.
- Sonnet 5.5에는 `temperature`, `budget_tokens`, `thinking: {type: 'disabled'}`, assistant prefill을 보내지 않는다(400 오류).
- 이 호출은 실제 API로 실행해 본 적이 없다. 특히 `fallbacks: 'default'`와 beta parse의 조합을 첫 실행에서 확인한다. 오류가 나면 Coffeecat의 `src/research.js`처럼 `client.messages.parse` + `zodOutputFormat`(fallback 없음)으로 바꿔도 된다.
- zod 스키마의 배열 길이는 스키마가 아니라 `checkCase`에서 검사한다(구조화 출력이 minItems/maxItems를 지원하지 않을 수 있어서).

---

## 4. 남은 작업 상세

### 4-1. `site/game.js` (바닐라 JS, 빌드 도구 없음, 프레임워크 없음)

**사건 불러오기**
- 한국 시간 오늘 날짜: `new Date(Date.now() + 9*3600*1000).toISOString().slice(0,10)`
- `fetch('cases/' + today + '.json', {cache: 'no-store'})`. 실패하면 `cases/latest.json`, 그것도 실패하면 "사건 파일을 찾지 못했다냥. 잠시 후 다시 와 달라냥" 안내.

**진행 상태 저장**
- localStorage 키 `kd:<사건 no>`에 `{stage, picked: [clueId...], accused: id|null}`를 저장한다.
- 모든 읽기/쓰기를 try/catch로 감싼다(인스타 앱 내 브라우저, 시크릿 모드 대비). 저장이 안 돼도 게임은 동작해야 한다.
- 새로고침해도 조사 횟수가 다시 생기지 않고, 지목 후에는 결과 화면이 다시 보이게 한다.

**정답 풀기**
- `atob(answer)` → 바이트 배열 → 열쇠 `"kkaphwi-" + date`의 UTF-8 바이트로 XOR → `TextDecoder`로 문자열 → `JSON.parse`
- `case.js`의 `scramble`과 정확히 반대여야 한다. Node로 만든 파일을 브라우저에서 풀어 보는 테스트를 한다.

**화면 1: 사건 소개**
- `.meta`: "사건 #001 · 10월 27일" (no는 3자리)
- `h1` 제목, `.intro` 소개
- "용의자" `h2` + `.suspects` 2×2 격자. `.suspect` 카드 안에 고양이 얼굴 SVG, `.name`, `.desc`
- `.btn.primary` "조사 시작"

**화면 2: 조사**
- 위쪽 `.mini-suspects`: 용의자 이름과 작은 얼굴
- `.counter`: "남은 조사" + `.left` "3 / 5" + 발바닥 아이콘(🐾 남은 개수만큼)
- 단서 7개를 `.clue` 목록으로 표시
  - 버튼을 누르면 `.open`이 되고 `.text`로 내용이 펼쳐진다. 조사 1회 소모
  - 이미 연 단서는 다시 눌러도 소모하지 않는다
  - 5개를 다 쓰면 나머지 버튼은 `disabled`
  - 처음 누를 때 "조사는 5번뿐" 안내를 짧게 보여 준다
- `.sticky` 하단에 `.btn.primary` "범인 지목하기". 언제든 누를 수 있다. 5개를 다 안 써도 됨

**화면 3: 지목**
- 안내: "범인이라고 생각하는 고양이를 골라라냥"
- `button.suspect` 4개. 고르면 `.selected`
- 확인 버튼 "○○가 범인이다냥!", 그 아래 `.warn` "기회는 한 번뿐이다냥"
  - `alert`/`confirm`은 쓰지 않는다. 인스타 앱 내 브라우저에서 막힐 수 있다.
- "다시 조사하기" `.btn.ghost`: 남은 조사가 있을 때만 화면 2로 돌아간다

**화면 4: 결과**
- 맞힘: `.verdict` "사건 해결!", 범인 얼굴(크게), "범인은 ○○였다냥". 이어서 `.confess`(culpritLine), "해설" `.solution`, 결과 카드
- 틀림: `.verdict.wrong` "아쉽다냥…", "진짜 범인은 ○○", 고른 고양이, `.confess`, `.solution`. 결과 카드 없음
- 공통 `.next`: "다음 사건까지 **HH:MM:SS**" (한국 시간 다음 0시까지, 1초마다 갱신). 인스타 팔로우 링크
- 한국어 조사(이/가, 은/는, 였다/이었다)는 받침 여부로 고른다. 예: "모찌가", "보리였다냥"

**결과 카드 (canvas 1080×1920, 맞혔을 때만)**
- 그리기 전에 폰트 로드를 기다린다: `await document.fonts.load('900 80px "Noto Sans KR"')`, `700`, `400`도
- 구성(위→아래)
  1. 배경 `#151413`, 금색 테두리
  2. 로고 "깝휘캣" + "탐정"
  3. "사건 #001"
  4. 사건 제목(자동 줄바꿈)
  5. 크게 "해결!"
  6. 범인 고양이 얼굴(SVG를 Image로 그림)
  7. "범인은 ○○였다냥"
  8. "조사 N번 만에 해결" · 날짜
  9. "@kkaphwi.cat" + 사이트 주소
- 한국어 줄바꿈 함수를 직접 만든다(글자 단위로 `measureText`).
- 공유
  - `canvas.toBlob` → `File`
  - `navigator.canShare?.({files})`이면 `.btn.primary` "스토리에 공유하기" → `navigator.share({files})`
  - 아니면 `<img class="card-img">`로 보여 주고 "이미지를 길게 눌러 저장하라냥" 안내 + `<a download>` 저장 버튼
  - 인스타 앱 내 브라우저는 다운로드가 막힐 수 있어서 길게 눌러 저장하는 방법을 반드시 둔다.

**고양이 얼굴 SVG**
- 함수 `catSVG(fur)`: 귀 2개(삼각형) + 둥근 얼굴 + 눈 + 코 + 수염
- 털색 매핑
  - 주황 `#E8A15A`, 검정 `#2B2725`(테두리 밝게), 흰색 `#F4F1EC`, 회색 `#9A958F`
  - 삼색: 흰 바탕 + 주황/검정 얼룩, 고등어: 회갈색 + 줄무늬, 턱시도: 검정 + 흰 입가, 갈색 `#8A6142`
- 검정·턱시도는 어두운 배경에서 안 보이지 않게 외곽선을 넣는다.
- 같은 SVG를 화면 카드와 결과 카드(canvas)에 함께 쓴다.

**기타**
- 텍스트는 `textContent`로 넣는다(innerHTML에 사건 텍스트를 넣지 않음).
- 가로 스크롤이 없어야 하고, 360px 폭에서 깨지지 않아야 한다.
- 화면을 바꿀 때 맨 위로 스크롤한다.

### 4-2. `.github/workflows/daily.yml`
- 트리거
  - `schedule: cron '7 12 * * *'` (21:07 KST. 정각은 지연이 잦아 피함)
  - `workflow_dispatch`
  - `push` to `main`
- `permissions: contents: write, pages: write, id-token: write`
- `concurrency: group: daily, cancel-in-progress: false`
- 순서
  1. checkout
  2. setup-node 22 (`cache: npm`)
  3. `npm ci`
  4. `npm run check` (예비 사건 검사)
  5. `npm run generate` (env `ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}`)
  6. 바뀐 `site/cases`, `data/usage.json` 커밋·푸시. 봇 이름/이메일은 Coffeecat `publish.yml`과 같게. 바뀐 게 없으면 건너뜀
  7. `actions/upload-pages-artifact`(path: `site`) → `actions/deploy-pages` (environment `github-pages`)
- 키가 없으면 생성 단계가 실패하지 말고 예비 사건으로 넘어가게 한다. 지금 `generate.js`는 `new Anthropic()`을 파일 맨 위에서 만든다. 키가 없을 때 예외가 나는지 확인하고, 나면 고친다.
- `GITHUB_TOKEN`으로 한 푸시는 워크플로를 다시 실행시키지 않으므로 무한 반복은 없다. 그래도 확인한다.
- 액션 버전은 Coffeecat `publish.yml`이 쓰는 버전(`actions/checkout@v4`, `actions/setup-node@v4` 등)과 맞춘다. 거기 Pages 배포 단계가 있으면 그대로 참고한다.

### 4-3. 예비 사건 추가
- `data/backup/002.json` ~ `004.json`을 손으로 쓰거나 API로 만들어 사람이 검토한다.
- 모두 `npm run check`를 통과해야 하고, 장소·사건 종류가 001과 겹치지 않게 한다.
- 고양이 세계관, 무섭지 않은 내용, 숫자로 분명한 사실을 지킨다.

### 4-4. `README.md` (사용자용, 한국어, 짧게)
- 이게 뭔지, 주소
- 매일 어떻게 돌아가는지(21시에 내일 사건 생성 → 0시 공개)
- 비용과 상한
- 사건을 손으로 바꾸는 법: `site/cases/날짜.json`을 수정. `answer`는 뒤섞여 있으니 고치려면 생성 스크립트를 써야 함
- 문제가 생기면 볼 곳: Actions 탭

### 4-5. 테스트 (푸시 전에 반드시)
1. `npm run check` 통과
2. `checkCase` 음성 테스트(작은 스크립트로)
   - 범인을 제외하는 단서
   - 무고한 용의자가 안 빠지는 경우
   - 필요한 단서가 6개인 경우
   - 단서 하나로 풀리는 경우
   - 각각 오류가 나야 한다
3. `toPublic`으로 `001.json`을 오늘·내일 날짜 공개 파일로 만들어 `site/cases/`에 둔다. 첫 배포에도 쓴다.
4. 로컬 서버(`npx http-server site` 또는 `python3 -m http.server -d site`)를 띄우고 Playwright(크로미움, 모바일 390×844 뷰포트)로 확인
   - 4개 화면을 모두 지나가는 시나리오 2개: 맞힘 / 틀림
   - 단계마다 스크린샷을 찍어 직접 본다
   - 확인할 것
     - 6번째 조사가 막히는지
     - 새로고침 후 상태가 유지되는지
     - localStorage를 막았을 때도 동작하는지
     - 정답 풀기가 맞는지
     - 결과 카드 PNG가 1080×1920인지, 한글 폰트가 제대로 나오는지(두부 글자 □ 없음)
     - 360px 폭에서 가로 스크롤이 없는지
5. 실제 API 생성은 키가 있을 때만 한다. 비용이 드니 사용자 확인 후 1회만 실행한다.

### 4-6. 새 저장소로 옮기기와 사용자 설정
1. `joseph123ra-frog/kkaphwi-detective`(공개)를 만든다.
   - 에이전트 권한으로 안 되면 사용자에게 안내한다: github.com 오른쪽 위 **+** → **New repository** → 이름 `kkaphwi-detective` → **Public** → **Create repository**
2. `handoff/kkaphwi-detective/`의 내용을 새 저장소 **루트**에 올린다(`node_modules` 제외). 첫 커밋.
3. 사용자 설정은 꼭 필요한 2가지만, 한 단계씩 안내한다.
   1. **Pages 켜기**: 새 저장소 → Settings → Pages → Source를 **GitHub Actions**로
   2. **API 키 등록**: Settings → Secrets and variables → Actions → New repository secret → 이름 `ANTHROPIC_API_KEY`
      - 비용을 따로 보려면 platform.claude.com에서 이 게임 전용 키를 새로 만들기를 권한다. 기존 키를 써도 동작한다.
      - Console에서 키별 월 한도를 걸 수 있는지는 확인하지 못했다. 확인 전에는 단정하지 말 것.
   - 위 메뉴 이름은 이전 에이전트가 공식 문서에서 확인하지 못했다(네트워크 차단). 안내 전에 GitHub 문서로 확인한다.
4. Actions 탭에서 워크플로를 수동 실행(`workflow_dispatch`)하는 방법을 안내하거나 직접 실행한다. 로그에서 다음을 확인한다.
   - 생성 통과 여부
   - 실제 비용
   - Pages 주소(`https://joseph123ra-frog.github.io/kkaphwi-detective/`)가 열리는지
5. 완료되면 Coffeecat 브랜치의 `handoff/` 폴더는 더 이상 필요 없다. 지울지 사용자에게 묻는다(그 브랜치는 PR이 없는 작업 브랜치다).

### 4-7. 완료 보고 (사용자에게, 한국어, 짧게)
- 게임 주소, 인스타 프로필에 넣으면 된다는 안내
- 매일 돌아가는 방식(한 줄)
- 첫 실행 실제 비용과 월 예상 비용, 상한 $5에서 자동으로 멈춤
- 모델 선택 한 줄: Sonnet 5.5, 이유는 예산
- 남은 한계
  - 공개 저장소라 마음먹으면 정답을 미리 볼 수 있음
  - AI 사건은 3중 검사를 거치지만 재미와 문장 품질은 사람이 가끔 봐 주면 좋음
- 사용자가 할 일이 남았다면 한 단계씩

---

## 5. 참고: 샘플 사건 (사용자가 본 것, `data/backup/001.json`)

**사라진 참치 츄르 사건**: 찬장 위 참치맛 츄르 3개가 밤 10시~아침 7시 사이에 사라졌다.

**용의자**
- 치즈(주황, 먹보)
- 루나(검정, 밤 산책)
- 보리(회색, 노묘)
- 모찌(흰색, 아기)

**정답: 모찌**
- 치즈: 할머니 증언으로 알리바이 성립. 입가 냄새는 연어맛 츄르 때문(헷갈리는 단서)
- 루나: 강아지 두부가 밤새 함께 있었다고 증언
- 보리: 관절염 진단서
- 모찌를 가리키는 단서: 커튼의 작은 발톱 구멍, 작은 이빨 자국, 발톱의 하늘색 실밥

필요한 단서는 최소 3개(할머니·루나·보리)다. 새 사건도 이 정도 난이도와 톤을 기준으로 한다.

---

## 6. 확인하지 못한 것 (단정하지 말 것)
- GitHub Pages·Actions 무료 조건과 한도: 이전 환경에서 docs.github.com 접속이 막혀 확인하지 못함
- `generate.js`의 실제 API 동작과 실제 비용
- Anthropic Console에서 API 키별 지출 한도를 걸 수 있는지
- 인스타 앱 내 브라우저에서 `navigator.share`(파일 공유)와 다운로드가 되는지. 실제 기기 확인이 필요하면 사용자에게 부탁한다(한 단계씩).
