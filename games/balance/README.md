# 깝휘캣 밸런스

매일 한국 시간 0시에 질문이 바뀌는 모바일 우선 밸런스 게임입니다. GitHub Pages가 화면을 제공하고 Supabase가 익명 투표와 실시간 집계를 저장합니다.

## 투표 저장소 연결

1. Supabase SQL Editor에서 `backend/supabase.sql`을 실행합니다.
2. GitHub 저장소 변수 `SUPABASE_URL`을 등록합니다.
3. GitHub 저장소 Secret `SUPABASE_ANON_KEY`를 등록합니다.
4. `게임 사이트 배포` 워크플로를 다시 실행합니다.

브라우저에 저장한 무작위 식별자를 날짜와 함께 해시해 하루 한 표를 허용합니다. 회원가입 없는 게임이므로 기기·브라우저를 바꾼 중복 투표까지 막지는 않습니다.
