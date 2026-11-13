# 작업 규칙

- 변경을 커밋·푸시한 뒤에는 **항상 `main`에도 바로 합쳐서 푸시한다** (저장소 주인의 요청).
  작업 브랜치에 푸시 → `origin/main`을 받아 작업 브랜치를 `main`에 머지 → `node --check main.js` 등
  간단한 확인 → `git push origin main`. 충돌이 나면 멈추고 먼저 알린다.
