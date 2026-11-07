# 무료 API 전환 · 2026-11-07

## 현재 상태

- 유료 생성 API 연결과 SDK를 제거했습니다. 조사·웹 검색·원고는 `gemini-2.5-flash`만 사용합니다.
- 키 등록과 무료 프로젝트 확인 전까지 자동 게시 작업은 일시 정지돼 있습니다(`publish.yml`의 `if: false`).
- 과거 `data/usage.json`의 유료 비용·게시 호수는 보존합니다. 새 호출·토큰 수는 `geminiFree`에 별도 기록합니다.
- API 키 없음, 무료 프로젝트 미확인, 429·오류·잘린 응답이면 중단합니다. 유료 제공자·다른 모델로 대체하지 않습니다.
- 실제 키를 사용하는 검사는 아직 하지 않았습니다. 모의 검사와 실제 운영 확인을 구분합니다.

## 사용자 설정

1. Google AI Studio에서 **결제 계정이 연결되지 않은 Free Tier 프로젝트**를 만들고 API 키를 발급합니다. 기존 유료 프로젝트 키는 사용하지 않습니다.
2. 저장소 Settings → Secrets and variables → Actions에서 Secret `GEMINI_API_KEY`로 직접 등록합니다. 키를 채팅으로 보내지 않습니다.
3. 같은 화면의 Variables에 `GEMINI_FREE_TIER_CONFIRMED`를 값 `true`로 등록합니다. 무료 프로젝트인지 실제 확인한 뒤에만 설정합니다.
4. 담당자가 키 값을 읽지 않는 사전 검사로 등록 상태를 확인하고 워크플로의 임시 중지를 해제합니다.

API 응답에는 결제 등급이 보장되지 않습니다. 코드는 키가 무료 프로젝트 소속인지 독립적으로 확인할 수 없습니다. 결제 계정을 연결하지 않아야 무료 한도를 넘겨도 청구되지 않습니다. 무료 서비스는 입력·응답이 Google 제품 개선에 쓰일 수 있습니다.

## 확인한 공식 자료

- [요금표](https://ai.google.dev/gemini-api/docs/pricing): 2.5 Flash의 무료 입력·출력, 검색 최대 하루 500회(Flash-Lite와 공유). 실제 프로젝트 한도는 다를 수 있습니다.
- [결제와 무료 등급](https://ai.google.dev/gemini-api/docs/billing)
- [콘텐츠 생성 REST](https://ai.google.dev/api/generate-content)

위 공식 문서는 2026-11-07 열어 확인했습니다. 현행 공급자와 설정은 본 문서 및 코드가 기준입니다.
