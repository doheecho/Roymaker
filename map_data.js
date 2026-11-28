// python optimize_glb.py models/Community_north.glb

// ── 동네 데이터: 건물(PLACES)·도로(ROAD_SEGMENTS)·가로수(TREES)·공원(PARKS)·길 중간 신호등(CROSSWALKS) ──
// 이 파일은 map_editor.html에서 통째로 고쳐 쓰라고 일부러 따로 뺀 파일이다. map_editor에서
// "내보내기"를 누르면 이 파일 전체를 대체할 수 있는 텍스트가 나오니, 그걸 복사해서 이 파일
// 내용을 전부 지우고 그대로 붙여넣으면 된다(GitHub 웹 편집기 기준: 이 파일을 열고 Ctrl+A로
// 전체 선택한 뒤 붙여넣기) — neighborhood3d.js는 건드릴 필요가 없다.

// ── 동네 생김새: 실제 금호파크힐스 단지 주변(카카오맵 위성사진 기준)을 간단한 박스 매싱으로 재현 ──
// 좌표는 지도 스크린샷에서 번호별 위치를 눈대중으로 읽어 축척(약 1.6m/px)을 적용해 환산한 값이라
// 정밀한 실측은 아니고, 건물 간 상대적인 배치만 실제 동네와 비슷하게 맞췄다.
// 0번(우리집)은 층수·유형 정보가 비어 있어서 주변 금호파크힐스 동과 같은 15층 아파트로 가정했다.
//
// 2026-11-21 갱신: img/base_naver_map.png(113동 기준 축척 0.728 raw/px — buildMapGround 주석 참고)
// 위에서 101~117동(+우리집)과 몇몇 핵심 시설(파리바게뜨·금호고등학교·금호119안전센터·복합문화센터·
// 롯데마트행당점)의 번호/이름표를 직접 찾아 x,z를 다시 재서 정확히 맞췄고, 101~116동은 각 동 건물
// 윤곽(방향성이 뚜렷한 영역)의 긴 변 각도를 재서 각 .glb 모델의 기본 가로/세로(모델 자체의
// 바운딩박스) 방향과 비교해 rotationDeg까지 새로 구했다 — 건물 간 미세한 측정 오차는 있을 수 있다.
// 신금호두산위브·행당한진타운·행당대림아파트·극동미라주·금호동벽산아파트는 이 지도 사진 범위 밖이거나
// 이름표를 찾지 못해 좌표를 그대로 뒀다(다른/더 넓은 지도 사진이 있으면 같은 방식으로 다시 맞출 수 있다).
//
// 2026-11-21 밤 갱신: 101~116동(+우리집)의 .glb를 전부 새로 만든 모델(place_금파힐NNN.glb)로
// 바꾸면서, 모델 자체의 가로·세로가 많이 달라져 rotationDeg의 기준(모델 기본 긴 변이 x축인지
// z축인지)이 104·112·116동에서 뒤집혀 그 세 동만 rotationDeg를 다시 구했다(나머지는 기준이
// 그대로라 값도 그대로 둠). 102·106·107·108동과 103·104·105동은 각각 하나의 모델로 합쳐져서
// (Community_south.glb → 107 자리, Community_north.glb → 104 자리) 그 자리에만 모델을 붙였다.
// 102·103·105·106·108동은 건물 모델은 없어졌지만(model 필드 없음) 라벨은 그대로 남겨 각자
// 원래 위치(지도에서 처음 잰 좌표)에 이름표만 떠 있게 했다.
//
// 2026-11-22 갱신: Community_south·north.glb의 자리(x,z)와 각도(rotationDeg)는 이렇게 구했다 —
// three.js로 모델을 불러와 그 안의 이름 붙은 노드(KumhoParkHills_NNN_UpperOnly/GroundUp)마다
// 바운딩박스 중심을 재서 "모델 안에서 그 동이 어디 있는지"(로컬 좌표)를 얻고, 이 동들이 각자
// 단독 모델이었을 때 실측해 뒀던 원래 좌표(위 102~108 라인의 역사적인 x,z — 지금 라벨만 남은
// 102·103·105·106·108동 값과 같다)를 "실제 좌표"로 놓고, 여러 동 쌍의 로컬↔실제 벡터 사이
// 각도 차이를 평균해 rotationDeg를, 각 동의 "실제 좌표 - 회전시킨 로컬 좌표" 평균을 내서
// 모델이 들어갈 x,z를 구했다(Community_south는 102·106·107·108 네 동, Community_north는
// 103·104·105 세 동 평균 — 둘 다 세 쌍 안팎의 추정치가 서로 ±10° 안쪽으로 맞아떨어져서
// 믿을 만했다). 높이(세로 치수)가 15층 건물의 실제 높이(약 45~58m)와 맞아떨어지는 걸로 봐서
// scaleRatio 보정은 필요 없었다(기본 1).
export const PLACES = [
  { id: 0, name: "우리집", floors: 15, type: "아파트", x: -0.2, z: 1.3, home: true, model: "models/place_금파힐113.glb", rotationDeg: 0, scaleRatio: 1.3 },
  { id: 1, name: "금호파크힐스 101동", floors: 15, type: "아파트", x: -392.8, z: 75.6, model: "models/place_금파힐101.glb", rotationDeg: -7.3, scaleRatio: 1.3 },
  { id: 5, name: "금호파크힐스 105동·이마트24", floors: 15, type: "아파트", x: -121.1, z: -124.9, rotationDeg: 0 },
  { id: 17, name: "파리바게뜨", floors: 6, type: "카페", x: 35.7, z: -155.8, diagonal: true, model: "models/place_남광빌딩.glb", rotationDeg: -4, scaleRatio: 1.5 },
  { id: 18, name: "대현교회", floors: 4, type: "기타", x: -240.1, z: -120.3, church: true, model: "models/place_대현교회.glb", rotationDeg: 20.8 },
  { id: 19, name: "금호고등학교", floors: 5, type: "학교", x: -60.2, z: 177.3 },
  { id: 20, name: "금호파크힐스 117동", floors: 15, type: "아파트", x: 57.2, z: 272.8, model: "models/place_금파힐117동.glb", rotationDeg: -0.8, scaleRatio: 1.3 },
  { id: 21, name: "금호119안전센터", floors: 2, type: "기타", x: 21.5, z: 118.7, model: "models/place_금호119안전센터.glb", rotationDeg: 4.6, scaleRatio: 1.5 },
  { id: 22, name: "성동구립금호도서관", floors: 4, type: "도서관", x: 89.1, z: 90.9, model: "models/place_library.glb", rotationDeg: 0, scaleRatio: 1.5 },
  { id: 23, name: "성동구보건소금호분소", floors: 4, type: "보건소", x: 91.6, z: 137.5 },
  { id: 24, name: "성동아이사랑복합문화센터", floors: 4, type: "기타", x: 153.5, z: 287.9 },
  { id: 25, name: "태비KTS태권스쿨", floors: 4, type: "학원", x: 117.4, z: -98, model: "models/3D_place_taekwondo.glb", rotationDeg: 0, scaleRatio: 1.5 },
  { id: 26, name: "NEW웰빙마트", floors: 4, type: "중형마트", x: 111.2, z: -152.8, diagonal: true, model: "models/place_홍일빌딩.glb", rotationDeg: 0, scaleRatio: 1.5 },
  { id: 27, name: "롯데마트행당점", floors: 6, type: "대형마트", x: 638.2, z: -370.4, model: "models/place_롯데마트.glb", rotationDeg: 31.9, scaleRatio: 1.9, terrain: "baked" },
  { id: 28, name: "메가MGC커피", floors: 2, type: "카페", x: 50, z: -227.6, diagonal: true, model: "models/3D_place_megacoffee.glb", rotationDeg: 0, scaleRatio: 1.7 },
  { id: 29, name: "아담리즈수학·CU", floors: 3, type: "편의점", x: -91.4, z: -230.5, model: "models/place_adamleeds.glb", scaleRatio: 1.5 },
  { id: 30, name: "분식집", floors: 4, type: "식당", x: -31, z: -224.7, model: "models/place_bunsik.glb", scaleRatio: 1.1 },
  { id: 31, name: "신금호두산위브 101동", floors: 15, type: "아파트", x: -270.2, z: -211.9, model: "models/place_신금호두산위브101.glb" },
  { id: 32, name: "신금호두산위브 102동", floors: 15, type: "아파트", x: -220.7, z: -224.7, model: "models/place_신금호두산위브102.glb", scaleRatio: 1.3 },
  { id: 33, name: "신금호두산위브 103동", floors: 15, type: "아파트", x: -262.1, z: -272.7, model: "models/place_신금호두산위브103.glb", scaleRatio: 1.3 },
  { id: 34, name: "신금호두산위브 104동", floors: 15, type: "아파트", x: -162.5, z: -250.1, model: "models/place_신금호두산위브104.glb", scaleRatio: 1.3 },
  { id: 35, name: "신금호두산위브 105동", floors: 15, type: "아파트", x: -113.8, z: -313.6, model: "models/place_신금호두산위브105.glb" },
  { id: 41, name: "행당한진타운 101동", floors: 15, type: "아파트", x: 389.9, z: -225.1 },
  { id: 42, name: "행당한진타운 102동", floors: 15, type: "아파트", x: 505.8, z: -296.5 },
  { id: 43, name: "행당한진타운 103동", floors: 15, type: "아파트", x: 465.7, z: -225.8 },
  { id: 44, name: "행당한진타운 104동", floors: 15, type: "아파트", x: 574.7, z: -276.1 },
  { id: 45, name: "행당한진타운 105동", floors: 15, type: "아파트", x: 761.6, z: -433.7 },
  { id: 46, name: "행당한진타운 106동", floors: 15, type: "아파트", x: 796.4, z: -394 },
  { id: 47, name: "행당한진타운 107동", floors: 15, type: "아파트", x: 434.5, z: -48.6 },
  { id: 48, name: "행당한진타운 108동", floors: 15, type: "아파트", x: 438.9, z: -135.3 },
  { id: 49, name: "행당한진타운 109동", floors: 15, type: "아파트", x: 507.1, z: -113.6 },
  { id: 50, name: "행당한진타운 110동", floors: 15, type: "아파트", x: 584.9, z: -107.2 },
  { id: 51, name: "행당한진타운 111동", floors: 15, type: "아파트", x: 576.6, z: -162.7 },
  { id: 52, name: "행당한진타운 112동", floors: 15, type: "아파트", x: 644.5, z: -136 },
  { id: 53, name: "행당한진타운 113동", floors: 15, type: "아파트", x: 661.3, z: -272.9 },
  { id: 54, name: "행당한진타운 114동", floors: 15, type: "아파트", x: 727, z: -156.9 },
  { id: 55, name: "행당한진타운 115동", floors: 15, type: "아파트", x: 730.8, z: -246.2 },
  { id: 56, name: "행당한진타운 116동", floors: 15, type: "아파트", x: 777.9, z: -321.3 },
  { id: 57, name: "행당한진타운 117동", floors: 15, type: "아파트", x: 809.2, z: -191.3 },
  { id: 58, name: "행당한진타운 118동", floors: 15, type: "아파트", x: 858.2, z: -285 },
  { id: 59, name: "행당한진타운 119동", floors: 15, type: "아파트", x: 897.1, z: -154.4 },
  { id: 60, name: "행당한진타운 120동", floors: 15, type: "아파트", x: 950, z: -239.8 },
  { id: 61, name: "행당한진타운 121동", floors: 15, type: "아파트", x: 972.3, z: -155 },
  { id: 62, name: "행당한진타운 201동", floors: 15, type: "아파트", x: 239.6, z: -154.8, model: "models/place_행당한진201.glb", rotationDeg: 55.9, scaleRatio: 1.3 },
  { id: 63, name: "행당한진타운 202동", floors: 15, type: "아파트", x: 318.5, z: -160.2, model: "models/place_행당한진202.glb", rotationDeg: 58.9, scaleRatio: 1.3 },
  { id: 64, name: "행당한진타운 203동", floors: 15, type: "아파트", x: 294.5, z: -106.3, model: "models/place_행당한진203.glb", rotationDeg: 151.3, scaleRatio: 1.3 },
  { id: 65, name: "행당한진타운 204동", floors: 15, type: "아파트", x: 350.9, z: -69, model: "models/place_행당한진204.glb", rotationDeg: 148.7, scaleRatio: 1.3 },
  { id: 66, name: "금북초등학교", floors: 5, type: "학교", x: -133.9, z: -481.3, model: "models/place_금북초.glb", rotationDeg: 0, terrain: "baked" },
  { id: 67, name: "대현산배수지공원", floors: 1, type: "공원", x: -309.1, z: -475.9 },
  { id: 68, name: "극동미라주 101동", floors: 15, type: "아파트", x: -108.3, z: -619.4, model: "models/place_극미101.glb", rotationDeg: 0, scaleRatio: 1.3 },
  { id: 69, name: "극동미라주 102동", floors: 15, type: "아파트", x: -126.2, z: -701.1, model: "models/place_극미102.glb", rotationDeg: 0, scaleRatio: 1.3 },
  { id: 70, name: "극동미라주 103동", floors: 15, type: "아파트", x: -119.2, z: -774.3, model: "models/place_극미103.glb", scaleRatio: 1.2 },
  { id: 71, name: "극동미라주 104동", floors: 15, type: "아파트", x: -122.6, z: -843.2, model: "models/place_극미104.glb", rotationDeg: 1, scaleRatio: 1.3 },
  { id: 72, name: "신금호공원", floors: 1, type: "공원", x: -200.8, z: 166.8 },
  { id: 73, name: "행당대림프라자", floors: 7, type: "마트", x: 580.9, z: -457.4, model: "models/place_행당대림프라자.glb", rotationDeg: 30.9, scaleRatio: 2 },
  { id: 74, name: "행현초등학교", floors: 5, type: "학교", x: 722.5, z: -540.6 },
  { id: 75, name: "금호동벽산아파트 501동", floors: 15, type: "아파트", x: 159.9, z: -47.4 },
  { id: 76, name: "금호동벽산아파트 502동", floors: 15, type: "아파트", x: 262.5, z: 0.6 },
  { id: 77, name: "금호동벽산아파트 503동", floors: 15, type: "아파트", x: 171.5, z: 59.3 },
  { id: 78, name: "금호동벽산아파트 505동", floors: 15, type: "아파트", x: 303.1, z: 95.7 },
  { id: 81, name: "행당대림아파트 101동", floors: 15, type: "아파트", x: 117.4, z: -549, model: "models/place_행당대림101.glb", rotationDeg: -2.3, scaleRatio: 1.5 },
  { id: 82, name: "행당대림아파트 102동", floors: 15, type: "아파트", x: 224.3, z: -594.6, model: "models/place_행당대림102.glb", rotationDeg: 0, scaleRatio: 1.5 },
  { id: 83, name: "행당대림아파트 103동", floors: 15, type: "아파트", x: 211.4, z: -476.1, model: "models/place_행당대림103.glb", rotationDeg: 4.4, scaleRatio: 1.5 },
  { id: 84, name: "행당대림아파트 104동", floors: 15, type: "아파트", x: 291.8, z: -510.1, model: "models/place_행당대림104.glb", rotationDeg: 4.4, scaleRatio: 1.5 },
  { id: 85, name: "행당대림아파트 105동", floors: 15, type: "아파트", x: 206.3, z: -360.4, model: "models/place_행당대림105.glb", rotationDeg: 0, scaleRatio: 1.6 },
  { id: 86, name: "행당대림아파트 106동", floors: 15, type: "아파트", x: 310.4, z: -401, model: "models/place_행당대림106.glb", rotationDeg: -148.7, scaleRatio: 1.5 },
  { id: 87, name: "행당대림아파트 107동", floors: 15, type: "아파트", x: 148.5, z: -252.1, model: "models/place_행당대림107.glb", rotationDeg: 0, scaleRatio: 1.6 },
  { id: 88, name: "행당대림아파트 108동", floors: 15, type: "아파트", x: 249.1, z: -262.5, model: "models/place_행당대림108.glb", rotationDeg: -149.3, scaleRatio: 1.5 },
  { id: 89, name: "행당대림아파트 109동", floors: 15, type: "아파트", x: 263.7, z: -313.7, model: "models/place_행당대림109.glb", rotationDeg: -56.9, scaleRatio: 1.5 },
  { id: 90, name: "행당대림아파트 110동", floors: 15, type: "아파트", x: 361.5, z: -316.3, model: "models/place_행당대림110.glb", rotationDeg: -149.1, scaleRatio: 1.5 },
  { id: 91, name: "행당대림아파트 111동", floors: 15, type: "아파트", x: 391.3, z: -379.9, model: "models/place_행당대림111.glb", rotationDeg: 0 },
  { id: 92, name: "행당대림아파트 112동", floors: 15, type: "아파트", x: 466.9, z: -377.1, model: "models/place_행당대림112.glb", rotationDeg: -148.4 },
  { id: 93, name: "행당대림아파트 113동", floors: 15, type: "아파트", x: 411.6, z: -462.6, model: "models/place_행당대림113.glb", rotationDeg: -149, scaleRatio: 1.5 },
  { id: 94, name: "행당대림아파트 114동", floors: 15, type: "아파트", x: 329.7, z: -462.5, model: "models/place_행당대림114.glb", rotationDeg: 0 },
  { id: 95, name: "행당대림아파트 115동", floors: 15, type: "아파트", x: 364.4, z: -533.6, model: "models/place_행당대림115.glb", rotationDeg: -148.7, scaleRatio: 1.5 },
  { id: 96, name: "행당대림아파트 116동", floors: 15, type: "아파트", x: 322.6, z: -611.6, model: "models/place_행당대림116.glb", rotationDeg: 30.3, scaleRatio: 1.5 },
  { id: 97, name: "행당대림아파트 117동", floors: 15, type: "아파트", x: 303.1, z: -692.1, model: "models/place_행당대림117.glb", rotationDeg: 0 },
  { id: 98, name: "행당대림아파트 118동", floors: 15, type: "아파트", x: 357.7, z: -780.3, model: "models/place_행당대림118.glb", rotationDeg: 0 },
  { id: 99, name: "행당대림아파트 119동", floors: 15, type: "아파트", x: 420.7, z: -857.3, model: "models/place_행당대림119.glb", rotationDeg: 0 },
  { id: 100, name: "행당대림아파트 120동", floors: 15, type: "아파트", x: 520, z: -919.8, model: "models/place_행당대림120.glb", rotationDeg: 31.5, scaleRatio: 1.5 },
  { id: 101, name: "행당대림아파트 121동", floors: 15, type: "아파트", x: 616.7, z: -914.7, model: "models/place_행당대림121.glb", rotationDeg: 0 },
  { id: 102, name: "행당대림아파트 122동", floors: 15, type: "아파트", x: 556.5, z: -844.7, model: "models/place_행당대림122.glb", rotationDeg: 0 },
  { id: 103, name: "행당대림아파트 123동", floors: 15, type: "아파트", x: 460.9, z: -768, model: "models/place_행당대림123.glb", rotationDeg: -148.3, scaleRatio: 1.5 },
  { id: 104, name: "행당대림아파트 124동", floors: 15, type: "아파트", x: 402.1, z: -703.6, model: "models/place_행당대림124.glb", rotationDeg: -148.4, scaleRatio: 1.5 },
  { id: 105, name: "행당대림아파트 125동", floors: 15, type: "아파트", x: 449, z: -629.2, model: "models/place_행당대림125.glb", rotationDeg: -148.1, scaleRatio: 1.5 },
  { id: 106, name: "행당대림아파트 126동", floors: 15, type: "아파트", x: 506.5, z: -698.3, model: "models/place_행당대림126.glb", rotationDeg: -147.9, scaleRatio: 1.5 },
  { id: 107, name: "행당대림아파트 127동", floors: 15, type: "아파트", x: 546.7, z: -623.5, model: "models/place_행당대림127.glb", rotationDeg: -150.3, scaleRatio: 1.5 },
  { id: 108, name: "행당대림아파트 128동", floors: 15, type: "아파트", x: 492.6, z: -558.5, model: "models/place_행당대림128.glb", rotationDeg: -149.4, scaleRatio: 1.5 },
  { id: 109, name: "행당대림아파트 129동", floors: 15, type: "아파트", x: 511.1, z: -464.4, model: "models/place_행당대림129.glb", rotationDeg: 118.4, scaleRatio: 1.3 },
  { id: 110, name: "행당대림아파트 130동", floors: 15, type: "아파트", x: 611.1, z: -556.3, model: "models/place_행당대림130.glb", rotationDeg: 0 },
  { id: 111, name: "행당대림아파트 131동", floors: 15, type: "아파트", x: 628.7, z: -623.2, model: "models/place_행당대림131.glb", rotationDeg: 122.2, scaleRatio: 1.5 },
  { id: 112, name: "행당대림아파트 132동", floors: 15, type: "아파트", x: 643.1, z: -667.5, model: "models/place_행당대림132.glb", rotationDeg: -151.6, scaleRatio: 1.5 },
  { id: 113, name: "행당대림아파트 133동", floors: 15, type: "아파트", x: 567.7, z: -683.7, model: "models/place_행당대림133.glb", rotationDeg: 0 },
  { id: 114, name: "행당대림아파트 134동", floors: 15, type: "아파트", x: 585.9, z: -743.9, model: "models/place_행당대림134.glb", rotationDeg: 0 },
  { id: 115, name: "행당대림아파트 135동", floors: 15, type: "아파트", x: 692.3, z: -788.7, model: "models/place_행당대림135.glb", rotationDeg: 0 },
  { id: 200, name: "신금호역", floors: 1, type: "기타", x: -508.9, z: 18.3, model: "models/place_신금호역5.glb", rotationDeg: -45 },
  { id: 201, name: "금파힐후문", floors: 1, type: "기타", x: -54.9, z: -168.7, model: "models/place_금파힐후문.glb", scaleRatio: 1.5 },
  { id: 202, name: "금파힐정문", floors: 1, type: "기타", x: -368.2, z: 133.4, model: "models/place_금파힐정문.glb", rotationDeg: -53.9, scaleRatio: 1.5 },
  { id: 203, name: "조형선외과동물병원", floors: 3, type: "기타", x: -446, z: 66.3, model: "models/place_조형선외과동물병원.glb", rotationDeg: -46.8, scaleRatio: 1.5 },
  { id: 204, name: "신금호역 인근 상가", floors: 3, type: "기타", x: -480.5, z: 31.5, model: "models/place_신금호역4번출구앞건물.glb", rotationDeg: 2, scaleRatio: 1.4 },
  { id: 205, name: "설내옥", floors: 3, type: "식당", x: -456.4, z: 152.9, model: "models/place_설내옥.glb", rotationDeg: -7.9, scaleRatio: 1.5 },
  { id: 206, name: "신금호역 인근 상가", floors: 5, type: "기타", x: -499.5, z: 88.3, model: "models/place_키잉글리시.glb", rotationDeg: -5.1, scaleRatio: 1.5 },
  { id: 207, name: "KFC", floors: 4, type: "식당", x: -590.5, z: 42.7, model: "models/place_KFC.glb", rotationDeg: -9.9, scaleRatio: 1.5 },
  { id: 208, name: "GS25", floors: 154, type: "편의점", x: -540.6, z: 56.1, model: "models/place_GS25.glb", rotationDeg: 7.8, scaleRatio: 1.3 },
  { id: 209, name: "홈플러스익스프레스", floors: 5, type: "중형마트", x: -436.3, z: 14.1, model: "models/place_홈플러스익스프레스.glb", rotationDeg: -15, scaleRatio: 1.5 },
  { id: 210, name: "경찰서,우체국", floors: 5, type: "기타", x: -609.9, z: -74.4, model: "models/place_경찰서.glb", rotationDeg: -2, scaleRatio: 1.2 },
  { id: 211, name: "신금호역", floors: 1, type: "기타", x: -583.3, z: 16.1, model: "models/place_신금호역5.glb", rotationDeg: -10.8 },
  { id: 212, name: "신금호역 인근 상가", floors: 15, type: "기타", x: -540, z: -83, model: "models/place_신금호역5번출구앞상가.glb", rotationDeg: -3.2, scaleRatio: 1.3 },
  { id: 213, name: "신금호역 인근 상가", floors: 5, type: "기타", x: -623.5, z: 22.2, model: "models/place_megacoffee2.glb", rotationDeg: -25.5, scaleRatio: 1.5 },
  { id: 214, name: "주택", floors: 5, type: "기타", x: 15.4, z: -226.6, model: "models/place_bagel.glb", rotationDeg: 0.8, scaleRatio: 1.4 },
  { id: 216, name: "주택가", floors: 3, type: "기타", x: -79.5, z: -301.3, y: -3, model: "models/place_금북주택가2.glb", rotationDeg: -0.9, scaleRatio: 1.3 },
  { id: 217, name: "금호1가동 주민센터", floors: 5, type: "아파트", x: -340.6, z: -63.2, model: "models/place_금호1가동주민센터.glb", rotationDeg: 28.9, scaleRatio: 1.5 },
  { id: 218, name: "GS25", floors: 15, type: "아파트", x: -21.8, z: -576.1, model: "models/place_gs25극미점.glb", scaleRatio: 1.8 },
  { id: 219, name: "상가", floors: 15, type: "기타", x: 2.6, z: -510.1, model: "models/place_산마을돈타운2.glb", scaleRatio: 1.4 },
  { id: 220, name: "주택가", floors: 4, type: "기타", x: 7, z: -361.2, model: "models/place_금북남전체구역.glb", rotationDeg: 1.9, scaleRatio: 1.3 },
  { id: 222, name: "금호역인근상가", floors: 5, type: "기타", x: -595.1, z: 100, model: "models/place_골드축산.glb", rotationDeg: -4.5 },
  { id: 223, name: "행복한교회", floors: 5, type: "기타", x: 107.8, z: -495.1, model: "models/place_행복한교회.glb", rotationDeg: 5.5, scaleRatio: 1.5 },
  { id: 224, name: "대림상가", floors: 5, type: "기타", x: 53.4, z: -562.6, model: "models/place_대림독서실.glb", rotationDeg: -15.6, scaleRatio: 1.3 },
  { id: 225, name: "금호초등학교", floors: 5, type: "학교", x: -558.7, z: 335.9, model: "models/place_금호초등학교2.glb", rotationDeg: 2.5, scaleRatio: 1.7 },
  { id: 226, name: "금호파크힐스 117동", floors: 15, type: "아파트", x: -42.9, z: 223.5 },
  { id: 227, name: "성동중앙교회", floors: 5, type: "기타", x: 52.7, z: 223.2, model: "models/place_성동중앙교회.glb", rotationDeg: 4.7, scaleRatio: 1.5 },
  { id: 228, name: "버스정류장", floors: 1, type: "버스정류장", x: 57.2, z: -118.5, model: "models/asset_버스정류장.glb", rotationDeg: 84.2 },
  { id: 229, name: "신금호역 인근상가", floors: 5, type: "기타", x: -520.1, z: 118.6, model: "models/place_우리농산물직판장.glb", rotationDeg: 17.6 },
  { id: 230, name: "버스정류장", floors: 15, type: "버스정류장", x: 89.1, z: -143.5, model: "models/asset_버스정류장.glb", rotationDeg: -95.1 },
  { id: 231, name: "버스정류장", floors: 15, type: "버스정류장", x: 93, z: -244, model: "models/asset_버스정류장.glb", rotationDeg: -91.2 },
  { id: 232, name: "버스정류장", floors: 15, type: "버스정류장", x: 66.5, z: -280.8, model: "models/asset_버스정류장.glb", rotationDeg: 89.2 },
  { id: 233, name: "버스정류장", floors: 15, type: "버스정류장", x: -25.5, z: -604.9, model: "models/asset_버스정류장.glb", rotationDeg: 124.4 },
  { id: 234, name: "버스정류장", floors: 15, type: "버스정류장", x: -43.6, z: -779.8, model: "models/asset_버스정류장.glb", rotationDeg: -93.9 },
  { id: 235, name: "버스정류장", floors: 15, type: "버스정류장", x: -75.9, z: -768.1, model: "models/asset_버스정류장.glb", rotationDeg: 87.3 },
  { id: 236, name: "버스정류장", floors: 15, type: "버스정류장", x: -92.4, z: -175.8, model: "models/asset_버스정류장.glb", rotationDeg: -179.4 },
  { id: 237, name: "성동구보건소 금호분소", floors: 5, type: "보건소", x: -383.2, z: 22.3, model: "models/place_성동구보건소금호분소.glb" },
  { id: 238, name: "금호센트럴자이 104동", floors: 15, type: "아파트", x: -111, z: 329.9, model: "models/place_금호센트럴자이104.glb", rotationDeg: 12.1, scaleRatio: 1.3 },
  { id: 239, name: "금호센트럴자이 103동", floors: 15, type: "아파트", x: -200.8, z: 305.1, model: "models/place_금호센트럴자이103.glb", rotationDeg: -107.9, scaleRatio: 1.3 },
  { id: 240, name: "금호센트럴자이 102동", floors: 15, type: "아파트", x: -278, z: 280.2, model: "models/place_금호센트럴자이102.glb", rotationDeg: 4.8, scaleRatio: 1.3 },
  { id: 241, name: "금호센트럴자이 101동", floors: 15, type: "아파트", x: -362.1, z: 259.2, model: "models/place_금호센트럴자이101.glb", scaleRatio: 1.3 },
  { id: 242, name: "구립성동청소년독서실", floors: 5, type: "도서관", x: 308.2, z: -196.9, model: "models/place_구립성동청소년독서실.glb" },
  { id: 243, name: "버스정류장", floors: 15, type: "버스정류장", x: 77.8, z: 63.3, model: "models/asset_버스정류장.glb", rotationDeg: -90 },
  { id: 245, name: "", floors: 15, type: "아파트", x: -160.5, z: -6.6, model: "models/place_금파힐통합.glb", terrain: "baked" },
];

// 2026-11-21 갱신: 금호파크힐스 단지 주변(위 네 상수로 폭을 정하던 구간 중 old raw 기준
// x:-460~160, z:-260~300 범위)은 img/base_naver_map.png에서 도로 색(건물·공원·하천보다
// 밝은 회백색) 영역을 직접 뽑아 거리변환(distance transform)으로 중심선을 다시 스냅하고
// 그 자리의 실제 폭을 재서 width에 숫자로 직접 박아 넣었다 — 그래서 이 구간 segment들은
// ROAD_MAJOR 같은 상수 대신 raw 숫자를 쓴다. 범위 밖(행당한진타운·행당대림아파트 등 이
// 지도 사진에 없는 구역)은 기존 값 그대로 뒀다.
//
// curve(선택, raw [x,z]): 있으면 a→curve(2차 베지어 제어점)→b로 휘어진 도로가 된다 — 없으면
// 완전한 직선(map_editor.html에서 그림판 곡선 도구처럼 가운데 손잡이를 당겨서 만든다).
// neighborhood3d.js는 이 곡선을 짧은 직선 여러 개로 잘게 쪼개 그린다.
//
// 도로마다 고를 수 있는 것(전부 선택 — map_editor.html의 도로 패널에서 고른다):
//   kind: "walk" = 보행용 도로(아파트 단지 안 길 등 — 베이지 블록, 차선·차 없음),
//         "school" = 어린이 보호구역(붉은 포장 + "어린이 보호구역"·"30" 글씨, 차가 천천히). 없으면 일반 자동차 도로.
//   lanes: 왕복 차로 수(1·2·4·6·8). 없으면 폭으로 자동 — 6m 미만 1 · 6~12m 2 · 12~17m 4 · 17~23m 6 · 23m 이상 8
//          (실제 도시 도로의 차로 하나 폭 3.0~3.5m 기준, road_markings.js의 autoLaneCount).
//   swStyle: 보도블록 무늬 "red"(붉은 벽돌)·"beige"(베이지 블록)·"twotone"(회색·붉은 투톤). 없으면 회색 블록.
//   crosswalkA/B·signalA/B·joinA/B: 교차로 끝(A/B)별 횡단보도·신호등 켜고 끄기, 자동 잇기 막기(교차로를 지운 곳).
export const ROAD_SEGMENTS = [
  { a: [475.2, -475.6], b: [269.1, -350.7], width: 10 },
  { a: [189.1, -302.2], b: [155.4, -311.1], width: 10, curve: [168.2, -292.4] },
  { a: [155.4, -311.1], b: [159.8, -455.2], width: 10, sidewalk: 5 },
  { a: [147.1, -499.1], b: [159.8, -455.2], width: 10, curve: [163.3, -464.5], sidewalk: 5 },
  { a: [796.2, -534.5], b: [269.4, -217], width: 30, curve: [302, -224.5], sidewalk: 10 },
  { a: [79.4, -384.6], b: [79.1, -194], width: 25, sidewalk: 15, lanes: 6 },
  { a: [548, -380.3], b: [616.4, -269.9], width: 20 },
  { a: [226.5, -120.9], b: [189.6, -198.6], width: 10, sidewalk: 5 },
  { a: [741.4, -346.3], b: [616.4, -269.9], width: 10 },
  { a: [72.1, -255.8], b: [-12.3, -253.1], width: 10, sidewalk: 15, kind: "school", lanes: 1, signalA: false },
  { a: [-12.3, -253.1], b: [-11.2, -193], width: 5, sidewalk: 10, lanes: 1 },
  { a: [-582, -29], b: [-563.3, -10.2], width: 30, sidewalk: 10 },
  { a: [326.4, -236.8], b: [387.2, -129.8], width: 10, curve: [359.9, -181.2], sidewalk: 5 },
  { a: [719.9, -280.8], b: [637.6, -232], width: 10 },
  { a: [637.6, -232], b: [697.6, -120], width: 10 },
  { a: [-624.4, 58.7], b: [-582, -29], width: 10, sidewalk: 10 },
  { a: [-191, -191.1], b: [-281.8, -111.9], width: 30, curve: [-270.4, -169.6], sidewalk: 10 },
  { a: [-393.5, -19.3], b: [-582, -29], width: 30, sidewalk: 15 },
  { a: [169.2, -195.9], b: [196.8, -105.6], width: 6 },
  { a: [196.8, -105.6], b: [222.4, -76.8], width: 6 },
  { a: [222.4, -76.8], b: [416, 16], width: 6 },
  { a: [79.1, -194], b: [169.2, -195.9], width: 30, curve: [123.9, -190.8], sidewalk: 10 },
  { a: [123.8, -189.9], b: [156.1, -85.6], width: 10, curve: [128.3, -108.4] },
  { a: [387.2, -129.8], b: [424.9, -96.1], width: 10, curve: [408.3, -96.6] },
  { a: [424.9, -96.1], b: [523.5, -70.5], width: 10 },
  { a: [523.5, -70.5], b: [594.9, -81.1], width: 10, curve: [563.8, -67.3] },
  { a: [594.9, -81.1], b: [697.6, -120], width: 10, curve: [646.7, -100.2] },
  { a: [874.2, -210.8], b: [803.4, -162.2], width: 10, curve: [838, -187.3] },
  { a: [79.1, -194], b: [72.4, -126.1], width: 25, curve: [75.6, -158.8], sidewalk: 10, lanes: 6 },
  { a: [95.5, -96.5], b: [98, -5.9], width: 10, sidewalk: 5 },
  { a: [109.6, 37.6], b: [112.6, 110], width: 10, curve: [125.3, 55.7], sidewalk: 5 },
  { a: [76.1, 198.4], b: [146.8, 402.9], width: 25, curve: [123.8, 263.5], sidewalk: 10, lanes: 6 },
  { a: [156.1, -85.6], b: [244.8, -40], width: 10 },
  { a: [148.2, -89.2], b: [114.7, -11.3], width: 10.7, curve: [133.7, -53] },
  { a: [114.7, -11.3], b: [138.8, 60.1], width: 10.3 },
  { a: [138.8, 60.1], b: [148.9, 138], width: 12.1, lanes: 2 },
  { a: [905.3, -284], b: [874.2, -210.8], width: 10, curve: [898.5, -253.7] },
  { a: [684.8, -73.6], b: [416, 16], width: 6 },
  { a: [65.4, -53.3], b: [40, -52.6], width: 9 },
  { a: [416, 16], b: [441.6, 145.6], width: 6 },
  { a: [441.6, 145.6], b: [510.4, 208], width: 6 },
  { a: [510.4, 208], b: [553.6, 300.8], width: 6 },
  { a: [-522.7, 170.3], b: [-487.3, 218.5], width: 15, curve: [-519.1, 175.6], sidewalk: 5 },
  { a: [76.1, 198.4], b: [57.9, 28], width: 25, curve: [41.2, 136.5], sidewalk: 10, lanes: 6 },
  { a: [-487.3, 218.5], b: [-400.5, 153.3], width: 10, sidewalk: 5, lanes: 1 },
  { a: [-400.5, 153.3], b: [-159.1, 228.2], width: 30, curve: [-309.1, 196.3], sidewalk: 10 },
  { a: [-159.1, 228.2], b: [7.4, 301.6], width: 30, curve: [-59, 264.3], sidewalk: 10 },
  { a: [35.7, 318.1], b: [146.8, 402.9], width: 30, sidewalk: 10 },
  { a: [-393.5, -19.3], b: [-281.8, -111.9], width: 30, curve: [-293, -19.3], sidewalk: 15 },
  { a: [79.4, -384.6], b: [-17.5, -620.2], width: 25, curve: [71.7, -519.4], sidewalk: 15, lanes: 6 },
  { a: [-53.7, -821.8], b: [-17.5, -620.2], width: 25, curve: [-77.8, -689.1], sidewalk: 15, lanes: 6 },
  { a: [-54.1, -1005.7], b: [-50.9, -887.2], width: 25, curve: [-49.7, -948.9], sidewalk: 15, lanes: 6 },
  { a: [-37.5, -460.6], b: [-52, -358.1], width: 10, sidewalk: 13, kind: "school", lanes: 1 },
  { a: [-649.9, 284.9], b: [-643.6, 135.4], width: 10, curve: [-651.4, 194.5], sidewalk: 10, kind: "school", signalA: false },
  { a: [-649.9, 284.9], b: [-650.3, 456.6], width: 10, sidewalk: 10, kind: "school", signalB: false },
  { a: [95.5, -96.5], b: [72.4, -126.1], width: 10, curve: [98.4, -110.1], sidewalk: 5 },
  { a: [-400.5, 153.3], b: [-328.5, 102.6], width: 10, sidewalk: 15 },
  { a: [-328.5, 102.6], b: [-260, 85], width: 10, curve: [-304.6, 80.7], sidewalk: 15 },
  { a: [-224.6, 85.9], b: [-260, 85], width: 10, sidewalk: 15 },
  { a: [-93.3, 13], b: [-18.8, -56.7], width: 10, curve: [-41.2, -36.7], sidewalk: 15, kind: "walk" },
  { a: [-18.8, -56.7], b: [-41.2, -126.5], width: 10, curve: [3.6, -71.1], sidewalk: 15, kind: "walk" },
  { a: [-41.2, -126.5], b: [-53.2, -149], width: 10, curve: [-50.8, -131], sidewalk: 5 },
  { a: [-232, 8.7], b: [-53.2, -149], width: 12, sidewalk: 5, kind: "walk" },
  { a: [-269.5, 1], b: [-233.3, 10], width: 12, curve: [-253.7, 33.2], sidewalk: 5, kind: "walk" },
  { a: [-168, 87.8], b: [-112.3, 60.4], width: 10, curve: [-120.5, 93.3], sidewalk: 15, kind: "walk" },
  { a: [-112.3, 60.4], b: [-93.3, 13], width: 10, curve: [-109.6, 24.7], sidewalk: 15, kind: "walk" },
  { a: [-572.3, -216.6], b: [-582, -29], width: 30, sidewalk: 10 },
  { a: [-572.3, -216.6], b: [-641.2, -469], width: 30, curve: [-560.6, -283.2], sidewalk: 10 },
  { a: [-641.2, -469], b: [-727, -833.4], width: 30, curve: [-726.7, -632.3], sidewalk: 5 },
  { a: [-727, -833.4], b: [-787.7, -915.3], width: 30, curve: [-724.8, -898.2] },
  { a: [-919.9, -889.9], b: [-787.7, -915.3], width: 30, curve: [-880.7, -952.1] },
  { a: [-919.9, -889.9], b: [-975.1, -781.3], width: 30 },
  { a: [-167.4, -553.9], b: [29.5, -554.7], width: 10, sidewalk: 5, railing: true, kind: "school", lanes: 1, signalB: false },
  { a: [-487.3, 218.5], b: [-479.3, 355.1], width: 15, curve: [-479.6, 282.4], sidewalk: 5, kind: "school" },
  { a: [-479.3, 355.1], b: [-436.1, 470.6], width: 15, curve: [-475.4, 430.5], sidewalk: 5, kind: "school" },
  { a: [-406.9, 492.9], b: [-337.1, 546.3], width: 15, curve: [-346.2, 528.3], sidewalk: 5 },
  { a: [-671, -26.2], b: [-576.2, -120.1], width: 15, curve: [-667.5, -100], sidewalk: 5 },
  { a: [-671, -26.2], b: [-695.9, 42.8], width: 15, curve: [-672, 25.3], sidewalk: 5 },
  { a: [-707.1, 70.3], b: [-695.9, 42.8], width: 15, sidewalk: 5 },
  { a: [-704.6, 100.5], b: [-694.7, 189.7], width: 10, curve: [-703.1, 122], sidewalk: 5 },
  { a: [-674, 265], b: [-694.7, 189.7], width: 10, curve: [-691.2, 227.8] },
  { a: [-100.1, -73.1], b: [-41.2, -126.5], width: 10, sidewalk: 15 },
  { a: [-168, 87.8], b: [-224.6, 85.9], width: 10, sidewalk: 15, kind: "walk" },
  { a: [-336.3, 38.9], b: [-318.2, 92.7], width: 10, curve: [-371.2, 68.9], sidewalk: 15 },
  { a: [98, -5.9], b: [109.6, 37.6], width: 10, curve: [101.6, 22.3], sidewalk: 5 },
  { a: [112.6, 110], b: [107, 178.5], width: 10, sidewalk: 5 },
  { a: [117.8, 212.9], b: [107, 178.5], width: 10, curve: [105.9, 198.3], sidewalk: 5 },
  { a: [117.8, 212.9], b: [128.5, 318.5], width: 10, curve: [140.2, 260.5], sidewalk: 5 },
  { a: [177.7, 545], b: [146.8, 402.9], width: 25, sidewalk: 10, lanes: 6 },
  { a: [-341, 334], b: [-487.3, 218.5], width: 15, curve: [-421.2, 296.9] },
  { a: [-238, 342.6], b: [-341, 334], width: 15, curve: [-293.4, 330.5] },
  { a: [-182.5, 442.1], b: [-238, 342.6], width: 15, curve: [-147.2, 359.8] },
  { a: [-216.5, 546.3], b: [-182.5, 442.1], width: 15 },
  { a: [-671, -26.2], b: [-582, -29], width: 10, curve: [-636.2, -28.4], sidewalk: 10 },
  { a: [-707.1, 70.3], b: [-633.1, 82.7], width: 10, sidewalk: 5 },
  { a: [-700.7, 133.2], b: [-643.6, 135.4], width: 10, sidewalk: 5 },
  { a: [-522.7, 170.3], b: [-448.1, 105.5], width: 5, sidewalk: 5 },
  { a: [-17.5, -620.2], b: [48.9, -595.4], width: 15, curve: [15.9, -595.7] },
  { a: [114.6, -592.8], b: [48.9, -595.4], width: 15 },
  { a: [189.8, -622.1], b: [114.6, -592.8], width: 15, curve: [152.5, -591.8] },
  { a: [189.8, -622.1], b: [274.5, -748.9], width: 15, curve: [247.1, -674.7] },
  { a: [274.5, -748.9], b: [318.5, -819.7], width: 15, curve: [284.4, -783.7] },
  { a: [318.5, -819.7], b: [376.5, -887.2], width: 15 },
  { a: [376.5, -887.2], b: [445.3, -916.5], width: 10, curve: [407.1, -917.2] },
  { a: [385.4, -992.4], b: [376.5, -887.2], width: 15, curve: [422.7, -929.3] },
  { a: [531.3, -974.5], b: [445.3, -916.5], width: 10 },
  { a: [385.4, -992.4], b: [445.3, -916.5], width: 10, curve: [403.9, -920.6] },
  { a: [-704.6, 100.5], b: [-707.1, 70.3], width: 10, sidewalk: 5 },
  { a: [-573, 193.5], b: [-487.3, 218.5], width: 10, curve: [-515.2, 199.2], sidewalk: 5, kind: "school" },
  { a: [-613.8, 230.5], b: [-573, 193.5], width: 10, curve: [-592.1, 189.1], sidewalk: 5, kind: "school" },
  { a: [-649.9, 284.9], b: [-613.8, 230.5], width: 10, sidewalk: 5, kind: "school", signalA: false },
  { a: [-780.1, 290.4], b: [-674, 265], width: 10 },
  { a: [-674, 265], b: [-649.9, 284.9], width: 10 },
  { a: [-18, -865.5], b: [132.4, -828.6], width: 15, curve: [45.8, -779.5] },
  { a: [-18, -865.5], b: [-50.9, -887.2], width: 15, curve: [-39.6, -889.1] },
  { a: [132.4, -828.6], b: [231.2, -903.1], width: 15, curve: [159.5, -838.5] },
  { a: [231.2, -903.1], b: [385.4, -992.4], width: 15, curve: [299.4, -957.9] },
  { a: [241.4, -394.6], b: [269.1, -350.7], width: 10 },
  { a: [138.8, -522.7], b: [147.1, -499.1], width: 10, sidewalk: 5 },
  { a: [138.8, -522.7], b: [50.2, -514.4], width: 10, sidewalk: 5 },
  { a: [173.2, -532.3], b: [138.8, -522.7], width: 10, curve: [155.9, -520.2], sidewalk: 5 },
  { a: [235, -567.3], b: [173.2, -532.3], width: 10, sidewalk: 5 },
  { a: [235, -567.3], b: [267.5, -603], width: 10, curve: [255.8, -575], sidewalk: 5 },
  { a: [284.1, -641.2], b: [308.9, -669.3], width: 10, curve: [289.5, -661.6], sidewalk: 5 },
  { a: [267.5, -603], b: [284.1, -641.2], width: 10, sidewalk: 5 },
  { a: [536.4, -372.3], b: [475.2, -475.6], width: 10, sidewalk: 5 },
  { a: [348.4, -689.7], b: [308.9, -669.3], width: 10, sidewalk: 5 },
  { a: [475.2, -475.6], b: [529, -529.9], width: 10, curve: [511, -493.2] },
  { a: [529, -529.9], b: [623.2, -700.6], width: 10, curve: [593.7, -612.1] },
  { a: [623.2, -700.6], b: [617, -788.5], width: 10, curve: [649, -753.8] },
  { a: [617, -788.5], b: [531.1, -805], width: 10, curve: [589.5, -825.8] },
  { a: [492.8, -809.2], b: [531.1, -805], width: 10, curve: [513, -796.8] },
  { a: [443.2, -811.3], b: [492.8, -809.2], width: 10, curve: [459.7, -824.7] },
  { a: [443.2, -811.3], b: [404.9, -787.5], width: 10 },
  { a: [377, -759.5], b: [404.9, -787.5], width: 10, curve: [385.7, -778.7] },
  { a: [377, -759.5], b: [348.4, -689.7], width: 10 },
  { a: [62.1, -482.8], b: [-37.5, -460.6], width: 10, curve: [-39, -481.3], sidewalk: 10, kind: "school", lanes: 1, signalA: false },
  { a: [72.4, -126.1], b: [65.4, -53.3], width: 25, curve: [68.7, -87.9], sidewalk: 10, lanes: 6, signalB: false },
  { a: [65.4, -53.3], b: [57.9, 28], width: 25, sidewalk: 10, lanes: 6, signalA: false },
  { a: [475.2, -475.6], b: [348.4, -689.7], width: 10, sidewalk: 5 },
  { a: [269.1, -350.7], b: [189.1, -302.2], width: 10 },
  { a: [269.1, -350.7], b: [331.2, -252.5], width: 10 },
  { a: [387.2, -129.8], b: [314.7, -85.4], width: 10, sidewalk: 5 },
  { a: [637.6, -232], b: [469.2, -132], width: 10 },
  { a: [616.4, -269.9], b: [387.2, -129.8], width: 10, sidewalk: 5 },
  { a: [697.6, -120], b: [803.4, -162.2], width: 10, curve: [751, -140.7] },
  { a: [-50.9, -887.2], b: [-53.7, -821.8], width: 25, curve: [-51.5, -855.2], sidewalk: 15, lanes: 6 },
  { a: [-633.1, 82.7], b: [-624.4, 58.7], width: 10, curve: [-629.2, 69.1], sidewalk: 10 },
  { a: [-643.6, 135.4], b: [-633.1, 82.7], width: 10, curve: [-639.6, 104.9], sidewalk: 10 },
  { a: [-643.6, 135.4], b: [-537.3, 137.6], width: 10, sidewalk: 5 },
  { a: [-12.3, -253.1], b: [-51.9, -251.7], width: 10, sidewalk: 10, kind: "school", lanes: 1, signalB: false },
  { a: [79.1, -194], b: [-11.2, -193], width: 30, sidewalk: 10, signalA: false },
  { a: [-52, -358.1], b: [-51.9, -251.7], width: 10, sidewalk: 15, kind: "school", lanes: 1, signalB: false },
  { a: [-51.9, -251.7], b: [-51.8, -192.6], width: 10, sidewalk: 15, kind: "school", lanes: 1, signalA: false, signalB: false },
  { a: [-53.2, -149], b: [-51.8, -192.6], width: 10, curve: [-55.5, -165.3], sidewalk: 5 },
  { a: [-11.2, -193], b: [-51.8, -192.6], width: 30, sidewalk: 10 },
  { a: [-51.8, -192.6], b: [-191, -191.1], width: 30, sidewalk: 10 },
  { a: [7.4, 301.6], b: [9.6, 218.1], width: 5, curve: [-11.4, 243.4], sidewalk: 5, lanes: 1 },
  { a: [7.4, 301.6], b: [32, 316.2], width: 30, curve: [20.3, 308.9], sidewalk: 10 },
  { a: [35, 224.9], b: [9.6, 218.1], width: 5, curve: [13.9, 215.7], sidewalk: 5, lanes: 1 },
  { a: [-448.1, 105.5], b: [-400.5, 153.3], width: 30, sidewalk: 10 },
  { a: [-563.3, -10.2], b: [-448.1, 105.5], width: 30, sidewalk: 10 },
  { a: [-537.3, 137.6], b: [-563.3, -10.2], width: 15, curve: [-573.8, 60.7], sidewalk: 5 },
  { a: [-522.7, 170.3], b: [-537.3, 137.6], width: 15, sidewalk: 5 },
  { a: [-436.1, 470.6], b: [-650.3, 456.6], width: 10, sidewalk: 5, kind: "school", signalA: false, signalB: false },
  { a: [-436.1, 470.6], b: [-406.9, 492.9], width: 15, curve: [-423.4, 483.6], sidewalk: 5 },
  { a: [169.2, -195.9], b: [189.6, -198.6], width: 30, sidewalk: 10, signalB: false },
  { a: [189.6, -198.6], b: [269.4, -217], width: 30, curve: [229.2, -204.7], sidewalk: 10 },
  { a: [-650.3, 456.6], b: [-652.4, 544.2], width: 10, curve: [-646.8, 494.4], sidewalk: 10, kind: "school" },
];

// ── 가로수(TREES) ──
// 금호파크힐스 단지 내부(동 사이 공터)에 심을 나무 자리 — 위성사진에서 건물·도로가 아닌 어두운
// 녹지로 보이는 자리를 건물 중심/도로 중심선에서 충분히 떨어뜨려 골라낸 좌표들(raw 단위, PLACES와
// 같은 기준). map_editor.html에서 "나무 추가/삭제"로 점 하나씩 더하고 뺄 수 있다.
export const TREES = [[-428.9, -212.3], [-429.2, -186.8], [-421.4, -169.9], [-421.6, -128.2], [-429.4, -49.5], [-427.4, -38.9], [-417.1, 18.3], [-429.1, 37.8], [-416.2, 71.5], [-403.2, 193.1], [-412.2, 181.8], [-388.8, 205.4], [-414.7, 221.8], [-392.5, -205.2], [-394.5, -131.6], [-387.3, -87.5], [-390.5, -66.9], [-400.9, -39], [-396.3, 28.7], [-372.6, 37], [-415.9, 203.2], [-387.8, 196.8], [-360.2, -180.8], [-377.1, -144], [-375, -112.3], [-378.4, -90.3], [-360.7, 31.3], [-368.3, 38.4], [-423.6, 189.4], [-337, -192.7], [-345, -170.8], [-317.4, -51.5], [-336.8, 72.5], [-432.4, 198.2], [-319.1, -238], [-315.4, -178], [-308.3, -154.2], [-321.2, -139.3], [-316, 21.7], [-291, -186.3], [-284.1, 3.3], [-285.5, 24.3], [-282, 56.7], [-265.4, 153.4], [-423.3, 212.2], [-259.8, -65.5], [-273, 54.5], [-211.2, 168.3], [-398.8, 216.4], [-205, -169.1], [-240, -60.2], [-243.1, -12], [-242.5, 41.6], [-238.8, 65.9], [-235.1, 168.3], [-228.3, 147], [-248.4, 174.5], [-267.6, 137.8], [-268.4, 180], [-189.6, -174.3], [-217.3, -165.5], [-207.1, -24.5], [-210.6, 194.7], [-173.1, -174.7], [-186.7, 20.3], [-247, 142.9], [-188.8, -117.7], [-160.1, -174], [-147.5, -173.6], [-154.7, 206], [-132.9, -173.6], [-125.9, 26.2], [-135.8, 47.5], [-137.4, 63.9], [-148.3, 115.3], [-138.8, 145.8], [-133.3, 135.2], [-233.8, 188.4], [-121.1, -173.2], [-177.3, 146], [-114.5, -13.3], [-138.3, 214.8], [-188.3, 197.2], [-17.4, -155.1], [-269.7, 172.7], [-149.8, 155.5], [-138.3, 196.3], [-101, -168.6], [-22.5, -27.7], [-65.9, 93.5], [-30.5, -157.7], [-506.1, -304.1], [-55.9, 21.1], [-183.9, 156.1], [-10.8, -34.5], [-40.9, 10.9], [-216.9, 159.2], [3.8, -145.7], [-4.9, -152.8], [-84.5, -164.3], [23.2, -17.4], [30.4, -22.9], [1.4, -38.7], [46.5, -157.7], [27.9, 4.8], [24.9, -34.2]];

// ── 공원(PARKS) ──
// 바닥을 초록색 잔디로 칠한 네모난 구역 — x,z(중심), w(가로),d(세로)는 raw 단위, rotationDeg는
// 건물과 같은 방식(월드 기준, 0이면 가로=x축·세로=z축 그대로)으로 돌아간다. map_editor.html에서
// "공원 추가/삭제"로 다룬다.
export const PARKS = [
  { id: 1, x: -416.9, z: -208.1, w: 200, d: 300, rotationDeg: 9.4 },
];

// 길 중간 횡단보도·신호등 — x,z(raw)는 도로 위 자리(가장 가까운 도로에 붙는다), signal: false면 신호등 없이 횡단보도만.
// 교차로 끝의 횡단보도·신호등은 여기가 아니라 ROAD_SEGMENTS의 crosswalkA/B·signalA/B로 켜고 끈다.
// map_editor.html의 "🚦 신호등 추가"로 다룬다.
export const CROSSWALKS = [
  { x: -44, z: -192.7 },
  { x: -60.3, z: -739 },
];

// 울타리 — a·b(raw 좌표 m)를 잇는 토막, type은 fence_types.js의 종류, base: false면 아래 돌 기단 없이.
// map_editor.html의 "🧱 울타리 추가"로 다룬다(종류는 fence_types.js에 계속 추가할 수 있다).
export const FENCES = [
  { a: [-365.7, -70.4], b: [-364.7, -71], type: "parkhills_glass" },
  { a: [-378.5, 118.7], b: [-381.5, 116.8], type: "parkhills_glass" },
  { a: [237.1, -122.9], b: [211.1, -178.8], type: "hanjin_stone" },
  { a: [211.1, -178.8], b: [235.7, -186.2], type: "hanjin_stone" },
  { a: [235.7, -186.2], b: [281.7, -198.9], type: "hanjin_stone" },
  { a: [281.7, -198.9], b: [323.9, -219], type: "hanjin_stone" },
  { a: [323.9, -219], b: [371.9, -134.2], type: "hanjin_stone" },
  { a: [308.3, -264], b: [265.6, -240.4], type: "daelim_brick" },
  { a: [265.6, -240.4], b: [199.4, -221.1], type: "daelim_brick" },
  { a: [199.4, -220.5], b: [161.2, -215.1], type: "daelim_brick" },
  { a: [161.2, -215.1], b: [106.7, -213.6], type: "daelim_brick" },
  { a: [106.7, -213.6], b: [107.2, -323.9], type: "daelim_brick" },
  { a: [324.9, -273.6], b: [515.4, -387.6], type: "daelim_brick" },
  { a: [-11.8, 47], b: [32.6, 46.8], type: "parkhills_glass" },
  { a: [32.6, 46.8], b: [39.7, -44.2], type: "parkhills_glass" },
  { a: [39.7, -44.2], b: [16.3, -49.4], type: "parkhills_glass" },
  { a: [-39.1, -163.6], b: [-23, -163.6], type: "parkhills_glass" },
  { a: [-23, -163.6], b: [11.6, -160.6], type: "parkhills_glass" },
  { a: [11.6, -160.6], b: [20.1, -128.1], type: "parkhills_glass" },
  { a: [20.1, -128.1], b: [46.2, -124.3], type: "parkhills_glass" },
  { a: [46.2, -124.3], b: [41, -67.7], type: "parkhills_glass" },
  { a: [41, -67.7], b: [20.7, -66.3], type: "parkhills_glass" },
  { a: [20.7, -66.3], b: [16.3, -49.4], type: "parkhills_glass" },
  { a: [-11.8, 47], b: [-17.2, 114.8], type: "parkhills_glass" },
  { a: [-17.2, 114.8], b: [-20.8, 117.9], type: "parkhills_glass" },
  { a: [-20.8, 117.9], b: [-138.7, 111.9], type: "parkhills_glass" },
  { a: [-138.7, 111.9], b: [-141.9, 116.6], type: "parkhills_glass" },
  { a: [-141.9, 116.6], b: [-145.9, 131.7], type: "parkhills_glass" },
  { a: [-145.9, 131.7], b: [-278.8, 124.8], type: "parkhills_glass" },
  { a: [-278.8, 124.8], b: [-283.5, 150.9], type: "parkhills_glass" },
  { a: [-283.5, 150.9], b: [-334.4, 148.7], type: "parkhills_glass" },
  { a: [-334.4, 148.7], b: [-353, 146.7], type: "parkhills_glass" },
  { a: [-182.9, -167.1], b: [-209.5, -162.4], type: "parkhills_glass" },
  { a: [-209.5, -162.4], b: [-231.3, -153.5], type: "parkhills_glass" },
  { a: [-231.3, -153.5], b: [-239.6, -147.1], type: "parkhills_glass" },
  { a: [-239.6, -147.1], b: [-226.2, -117.8], type: "parkhills_glass" },
  { a: [-226.2, -117.8], b: [-253.8, -91.7], type: "parkhills_glass" },
  { a: [-253.8, -91.7], b: [-288.9, -38], type: "parkhills_glass" },
  { a: [-288.9, -38], b: [-339.9, 5.9], type: "parkhills_glass" },
  { a: [-339.9, 5.9], b: [-366.3, 44.8], type: "parkhills_glass" },
  { a: [-366.3, 44.8], b: [-410.8, 42.1], type: "parkhills_glass" },
  { a: [-410.8, 42.1], b: [-443.9, 74.2], type: "parkhills_glass" },
  { a: [-443.9, 74.2], b: [-394.4, 124.1], type: "parkhills_glass" },
  { a: [-394.4, 124.1], b: [-381.5, 116.8], type: "parkhills_glass" },
];

// 지형 높이(단차) — 바깥 도로보다 높은 단지(지금은 금호파크힐스)를 표현한다. map_editor.html의 "⛰ 지형 높이"로 다룬다.
// TERRAIN_ZONES: 높이가 있는 구역의 외곽선(poly: [x, z] raw 꼭짓점들). 구역 밖은 높이 0(평평), 경계에는 옹벽이 선다.
// TERRAIN_POINTS: 구역 안의 높이 점 — h는 바깥 도로(=0) 기준 "층"(1층 = 3m), 점 사이는 부드럽게 이어진다.
//   출입구(도로가 구역 경계를 지나는 곳)에 h: 0인 점을 두면 옹벽 없이 경사로가 된다.
//   (2026-11-25 초안: 공개 고도·단지 배치를 바탕으로 한 추정치 — 정문=0층 기준, 체감에 맞게 ±0.5~1층씩 고치면 된다)
// 지형 단차 켜기/끄기 — false면 게임은 지금까지처럼 평지로 그리고(아래 구역·높이 점 데이터는 그대로 남음),
// 맵 에디터에서는 계속 고칠 수 있다. 외곽선·높이를 다 맞춘 뒤 true로 바꾸면 된다. (2026-11-25 조정 전이라 잠시 끔)
export const TERRAIN_ENABLED = false;
export const TERRAIN_ZONES = [
  { name: "금호파크힐스", poly: [[-245.6, -129.7], [-175.8, -159.7], [-84.6, -165.1], [-8.2, -166.3], [34.1, -148.4], [46.2, -109.6], [40.5, -45.3], [33.4, 24.3], [29.8, 58.7], [19.1, 84.1], [11.7, 125.3], [-10.8, 136.6], [-112.1, 132.8], [-138.3, 147.8], [-213.3, 147.8], [-280.9, 159.1], [-344.6, 144.1], [-393.4, 110.3], [-427.1, 72.8], [-434.6, 46.6], [-408.4, 20.4], [-336.9, 4.3], [-300.1, -14.2], [-277, -36.4], [-262.9, -60.8], [-250.8, -88.4], [-220.8, -110.9], [-228.3, -129.7]] },
];
export const TERRAIN_POINTS = [
  { x: -366.2, z: 129.1, h: 0, name: "정문 출입구" },
  { x: -54.1, z: -165.6, h: 0, name: "후문 출입구" },
  { x: 41.4, z: -55.4, h: 0, name: "동쪽 출입구" },
  { x: -392.8, z: 75.6, h: 0.25, name: "101동" },
  { x: -313.8, z: 41.4, h: 1.25, name: "102동" },
  { x: -246.5, z: -21.7, h: 2, name: "103동" },
  { x: -192.6, z: -81.1, h: 2.5, name: "104동" },
  { x: -121.1, z: -124.9, h: 2.75, name: "105동" },
  { x: -58.3, z: -61.9, h: 2, name: "106동" },
  { x: -165, z: 5, h: 1.75, name: "107동(단지 가운데)" },
  { x: -266.8, z: 16.6, h: 1, name: "108동" },
  { x: -311.9, z: 135.7, h: 0.25, name: "109동" },
  { x: -253.5, z: 114.3, h: 0.25, name: "110동" },
  { x: -164.6, z: 120.5, h: 0.25, name: "111동" },
  { x: -65.2, z: 43.1, h: 0.2, name: "112동" },
  { x: 7.5, z: -6.6, h: 0.9, name: "113동(우리집)" },
  { x: 11.2, z: -96, h: 1.25, name: "114동" },
  { x: -22.9, z: -142.2, h: 1.75, name: "115동" },
  { x: -39.1, z: 109.8, h: 0, name: "116동" },
  { x: -9.7, z: 85.8, h: 0.2 },
  { x: 27.3, z: 36.1, h: 0.9 },
  { x: -98.9, z: 103.1, h: 0.2 },
];

// 평지·경사 구역 — 실제 지형(GameMap.glb)이 담지 못하는 단차(학교 운동장 같은 평지, 교문 진입로 같은 경사로)를 덮어쓴다.
// map_editor.html의 "⛰ 평지·경사 구역"으로 다룬다. pts: [x, z(, h)] raw 좌표 꼭짓점, h: 높이(우리집 기준 raw m — 에디터
// "위치+고도 뽑기"와 같은 기준). 꼭짓점 h가 없으면 구역 h, 둘 다 없으면 그 자리 실제 지형 높이. walls: false면 옹벽 없음.
// 가장자리에서 안팎 높이가 다르면 게임이 옹벽을 세우고, 캐릭터는 옹벽을 못 넘어 경사로로만 오르내린다.
export const TERRAIN_SHAPES = [
  { name: "금북초 교정(평지)", h: 20.5, pts: [[-82.1, -433.3], [-86.1, -407.3], [-90.1, -385.3], [-92.4, -369.3], [-118.9, -369.8], [-155.9, -371.3], [-169.4, -378.8], [-175.9, -399.3], [-175.9, -433.3], [-195.9, -434.8], [-195.9, -495.3], [-191.4, -508.8], [-177.9, -516.8], [-166.4, -517.8], [-166.4, -539.3], [-52.9, -539.3], [-50.9, -521.3], [-33.4, -515.3], [-33.4, -499.3], [-43.4, -498.8], [-66.4, -434.8], [-70.4, -434], [-73.7, -433.3]] },
  { name: "금북초 교문 진입로(경사)", pts: [[-70.4, -434, 20.5], [-73.7, -433.3, 20.5], [-82.1, -433.3, 20.5], [-86.1, -407.3, 17], [-90.1, -385.3, 14.1], [-90, -378.7, 13.5], [-87.2, -372.7, 13], [-82.4, -368.2, 12.5], [-76.2, -366, 12], [-74.4, -365.8], [-72.8, -377.3], [-74.5, -377.6, 12], [-76.3, -378.2, 12.5], [-77.8, -379.5, 13], [-78.5, -381.3, 13.5], [-78.6, -383.2, 14.1], [-75, -405.2, 17]] },
  { name: "금파힐 커뮤니티 하단 데크 남측(평지)", h: -0.05, pts: [[-283.3, 151.6], [-278.6, 124.9], [-145.8, 132.4], [-141.8, 116.6], [-138.8, 112.3], [-19.9, 118.7], [-17.3, 116.6], [-11.7, 47.1], [32.7, 47.3], [35.5, 10], [-114.9, 10], [-179.5, 69], [-328.4, 58.5], [-343.8, 92.6], [-385, 105], [-385, 150], [-334.3, 149.4]] },
  { name: "금파힐 정문 서측 우회로 연결(경사)", walls: false, pts: [[-362, 71], [-331, 66], [-310, 88, -0.05], [-338, 99, -0.05]] },
  { name: "금파힐 커뮤니티 하단 데크 북측(경사)", pts: [[35.5, 10, -0.05], [39.7, -46, 4.71], [22.1, -50.6, 5.1], [19, -54.6, 5.44], [22.1, -64.2, 6.26], [41.1, -65.2, 6.35], [46.7, -124.3, 11.37], [20.2, -127.9, 11.68], [11.2, -160.4, 14.44], [-23.8, -163.4, 14.7], [-87.4, -162.9, 14.66], [-88.8, -126.6, 11.57], [-90.6, -107, 9.9], [-72.1, -88.2, 8.3], [-59.3, -79.8, 7.59], [-50.9, -87.5, 8.24], [-40.4, -78.2, 7.45], [-47.9, -68.7, 6.64], [-48.8, -50.3, 5.08], [-114.9, 10, -0.05]] },
  { name: "금파힐 동측 지하주차장 진입로(경사)", pts: [[52.6, -46.5], [43.2, -46.5, -2.92], [43.5, -64.5, -1.95], [53.7, -61.5]] },
  { name: "금파힐 동측 지하주차장 진입부(경사)", pts: [[43.2, -46.5, -2.92], [39.7, -46, -2.92], [22.1, -50.6, -4.95], [19, -54.6, -5.22], [22.1, -64.2, -4.54], [41.1, -65.2, -1.85], [43.5, -64.5, -1.95]] },
  { name: "금파힐 커뮤니티 상단 데크 남측(평지)", h: 5.95, pts: [[-114.9, 10], [-179.5, 69], [-328.4, 58.5], [-339.4, 10]] },
  { name: "금파힐 커뮤니티 상단 데크 북측(경사)", pts: [[-288.9, -37.7, 10.01], [-254.4, -90.4, 14.49], [-226.1, -117.6, 16.8], [-240, -146.9, 19.3], [-231, -153.7, 19.87], [-211, -162.1, 20.59], [-183, -167.1, 21.01], [-87.4, -162.9, 20.66], [-88.8, -126.6, 17.57], [-92.5, -108.5, 16.03], [-151.7, -55.6, 11.53], [-145.9, -49.2, 10.99], [-86.7, -102.1, 15.49], [-72.1, -88.2, 14.3], [-59.3, -79.8, 13.59], [-50.9, -87.5, 14.24], [-40.4, -78.2, 13.45], [-47.9, -68.7, 12.64], [-48.8, -50.3, 11.08], [-114.9, 10, 5.95], [-339.4, 10, 5.95], [-340.2, 6.6, 6.24]] },
  { name: "금파힐 커뮤니티 보행자 경사로(경사)", pts: [[-72.2, -126.6, -0.05], [-151.7, -55.6, 5.95], [-145.9, -49.2, 5.95], [-66.4, -120.2, -0.05]] },
];
