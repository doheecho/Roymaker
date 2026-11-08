# Roymaker (이로이 Maker)

프린세스 메이커 2 스타일의 생활 육성 시뮬레이션. 서울 성동구에 사는 초등학교 2학년 "이로이"의 등교·수업·학원·귀가 하루를 보낸다.

- 설계 문서: [`docs/design.md`](docs/design.md)
- 플랫폼: 웹 브라우저 (정적 HTML/JS, 빌드 도구 없음)
- 지도 엔진: **카카오맵 API** (JS SDK + 로컬 API 지오코딩, 확정) — 계정당 첫 앱은 카드 등록 없이 무료 쿼터 사용 가능. JS 키는 `index.html`에 그대로 박혀있음 — 카카오 JS 키는 구글 지도 키처럼 도메인 등록으로 보호하는 게 정상 사용법이라 공개 저장소에 있어도 된다. [카카오 디벨로퍼스](https://developers.kakao.com)에서 "사이트 도메인"을 등록해둘 것.
- **주의**: 앱 콘솔에서 JS 키를 발급받는 것과, 그 앱의 "카카오맵" 제품(OPEN_MAP_AND_LOCAL)을 활성화하는 건 별개 설정이다. 제품이 꺼져 있으면 SDK 요청이 403으로 거부된다 — 내 애플리케이션 → 제품 설정 → 카카오맵에서 활성화 필요.
- 좌표: 아직 지오코딩 전이라 `data/academies.json`은 실제 `lat/lng` 대신 `etaMinFromHome`(집에서 걸리는 분)으로 이동시간을 흉내냄. 지도 위 학원 마커는 집 좌표에서 이 값만큼 떨어진 임의 방향에 찍은 추정 위치(가상)다.

## 폴더 구조

```
data/                학원·과목 등 콘텐츠 데이터 (DB 대신 JSON 테이블)
  academy_categories.json   학원 종류별 성장 규칙 (거의 안 바뀜)
  academies.json             실제 학원 인스턴스 (언제든 추가/삭제)
  subjects.json               교과목별 성장 규칙
  character.json              이로이 초기 상태
docs/design.md        게임 설계 문서 전문
index.html            진입점 (정적 페이지)
style.css
main.js               데이터 로드 + 기본 화면 렌더링
```

## 로컬에서 열어보기

브라우저가 `fetch`로 로컬 JSON을 읽을 수 있도록 정적 서버로 띄워야 한다 (파일을 더블클릭해서 열면 CORS로 막힘).

```
npx serve .
```
