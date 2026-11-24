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
  { id: 0, name: "우리집", floors: 15, type: "아파트", x: 0.4, z: 1.6, home: true, model: "models/place_금파힐113.glb", rotationDeg: 0, scaleRatio: 1.3 },
  { id: 1, name: "금호파크힐스 101동", floors: 15, type: "아파트", x: -392.8, z: 75.6, model: "models/place_금파힐101.glb", rotationDeg: -7.3, scaleRatio: 1.3 },
  { id: 2, name: "금호파크힐스 102동", floors: 15, type: "아파트", x: -313.8, z: 41.4 },
  { id: 3, name: "금호파크힐스 103동", floors: 15, type: "아파트", x: -246.5, z: -21.7, rotationDeg: 0 },
  { id: 4, name: "금호파크힐스 104동", floors: 15, type: "아파트", x: -192.6, z: -81.1, model: "models/Community_north.glb", rotationDeg: -2 },
  { id: 5, name: "금호파크힐스 105동·이마트24", floors: 15, type: "아파트", x: -121.1, z: -124.9, rotationDeg: 0 },
  { id: 6, name: "금호파크힐스 106동", floors: 15, type: "아파트", x: -58.3, z: -61.9 },
  { id: 7, name: "금호파크힐스 107동", floors: 15, type: "아파트", x: -371.2, z: -141.9, model: "models/Community_south.glb", rotationDeg: 0 },
  { id: 8, name: "금호파크힐스 108동", floors: 15, type: "아파트", x: -266.8, z: 16.6 },
  { id: 9, name: "금호파크힐스 109동", floors: 15, type: "아파트", x: -326.6, z: 103.2, model: "models/place_금파힐109.glb", rotationDeg: -2.7, scaleRatio: 1.3 },
  { id: 10, name: "금호파크힐스 110동", floors: 15, type: "아파트", x: -253.5, z: 114.3, model: "models/place_금파힐110.glb", rotationDeg: -3.6, scaleRatio: 1.3 },
  { id: 11, name: "금호파크힐스 111동", floors: 15, type: "아파트", x: -218.8, z: 138.3, model: "models/place_금파힐111.glb", rotationDeg: -1.2, scaleRatio: 1.3 },
  { id: 12, name: "금호파크힐스 112동", floors: 15, type: "아파트", x: -70.2, z: 57.5, model: "models/place_금파힐112.glb", rotationDeg: -6.2, scaleRatio: 1.3 },
  { id: 14, name: "금호파크힐스 114동", floors: 15, type: "아파트", x: 11.2, z: -96, model: "models/place_금파힐114.glb", rotationDeg: 0, scaleRatio: 1.3 },
  { id: 15, name: "금호파크힐스 115동", floors: 15, type: "아파트", x: -25.1, z: -146, model: "models/place_금파힐115.glb", rotationDeg: 0, scaleRatio: 1.3 },
  { id: 16, name: "금호파크힐스 116동", floors: 15, type: "아파트", x: -45.7, z: 121.3, model: "models/place_금파힐116.glb", rotationDeg: -4.2, scaleRatio: 1.3 },
  { id: 17, name: "파리바게뜨", floors: 6, type: "카페", x: 30.6, z: -155.8, diagonal: true, model: "models/place_남광빌딩.glb", rotationDeg: -5.6, scaleRatio: 1.5 },
  { id: 18, name: "대현교회", floors: 4, type: "기타", x: -243, z: -120.3, church: true, model: "models/place_대현교회.glb", rotationDeg: 20.8 },
  { id: 19, name: "금호고등학교", floors: 5, type: "학교", x: -60.2, z: 177.3 },
  { id: 20, name: "금호파크힐스 117동", floors: 15, type: "아파트", x: 55.6, z: 267.1, rotationDeg: 29 },
  { id: 21, name: "금호119안전센터", floors: 2, type: "기타", x: 17.2, z: 79, model: "models/3D_place_keumho119.glb", rotationDeg: 0 },
  { id: 22, name: "성동구립금호도서관", floors: 4, type: "도서관", x: 89.1, z: 90.9, model: "models/place_library.glb", rotationDeg: 0, scaleRatio: 1.5 },
  { id: 23, name: "성동구보건소금호분소", floors: 4, type: "보건소", x: 91.6, z: 137.5 },
  { id: 24, name: "성동아이사랑복합문화센터", floors: 4, type: "기타", x: 153.5, z: 287.9 },
  { id: 25, name: "태비KTS태권스쿨", floors: 4, type: "학원", x: 119.7, z: -87.5, model: "models/3D_place_taekwondo.glb", rotationDeg: 0, scaleRatio: 1.5 },
  { id: 26, name: "NEW웰빙마트", floors: 4, type: "중형마트", x: 102.5, z: -151.8, diagonal: true, model: "models/place_홍일빌딩.glb", rotationDeg: 0, scaleRatio: 1.5 },
  { id: 27, name: "롯데마트행당점", floors: 6, type: "대형마트", x: 638.2, z: -370.4, model: "models/place_롯데마트.glb", rotationDeg: 31.9, scaleRatio: 1.9 },
  { id: 28, name: "메가MGC커피", floors: 2, type: "카페", x: 50.5, z: -222.6, diagonal: true, model: "models/3D_place_megacoffee.glb", rotationDeg: 0, scaleRatio: 1.5 },
  { id: 29, name: "아담리즈수학·CU", floors: 3, type: "편의점", x: -95, z: -229.8, model: "models/place_adamleeds.glb", scaleRatio: 1.5 },
  { id: 30, name: "분식집", floors: 4, type: "식당", x: -35.9, z: -221.9, model: "models/place_bunsik.glb", scaleRatio: 1.1 },
  { id: 31, name: "신금호두산위브 101동", floors: 15, type: "아파트", x: -269.5, z: -212.2 },
  { id: 32, name: "신금호두산위브 102동", floors: 15, type: "아파트", x: -170.9, z: -247.5 },
  { id: 33, name: "신금호두산위브 103동", floors: 15, type: "아파트", x: -279, z: -285.6 },
  { id: 34, name: "신금호두산위브 104동", floors: 15, type: "아파트", x: -164.2, z: -249.2 },
  { id: 35, name: "신금호두산위브 105동", floors: 15, type: "아파트", x: -113.8, z: -313.6 },
  { id: 36, name: "금호1가동주민센터", floors: 4, type: "기타", x: -185.8, z: 316.8 },
  { id: 41, name: "행당한진타운 101동", floors: 15, type: "아파트", x: 389.9, z: -225.1 },
  { id: 42, name: "행당한진타운 102동", floors: 15, type: "아파트", x: 505.8, z: -296.5 },
  { id: 43, name: "행당한진타운 103동", floors: 15, type: "아파트", x: 465.7, z: -225.8 },
  { id: 44, name: "행당한진타운 104동", floors: 15, type: "아파트", x: 574.7, z: -276.1 },
  { id: 45, name: "행당한진타운 105동", floors: 15, type: "아파트", x: 723.1, z: -423.9 },
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
  { id: 62, name: "행당한진타운 201동", floors: 15, type: "아파트", x: 236.9, z: -149.3, model: "models/place_행당한진201.glb", rotationDeg: -31.9, scaleRatio: 1.3 },
  { id: 63, name: "행당한진타운 202동", floors: 15, type: "아파트", x: 264.8, z: -167.5, model: "models/place_행당한진202.glb", rotationDeg: 58.9, scaleRatio: 1.3 },
  { id: 64, name: "행당한진타운 203동", floors: 15, type: "아파트", x: 294.9, z: -106, model: "models/place_행당한진203.glb", rotationDeg: 151.3, scaleRatio: 1.3 },
  { id: 65, name: "행당한진타운 204동", floors: 15, type: "아파트", x: 349.7, z: -71.5, model: "models/place_행당한진204.glb", rotationDeg: 148.7, scaleRatio: 1.3 },
  { id: 66, name: "금북초등학교", floors: 5, type: "학교", x: -133.9, z: -481.3, model: "models/place_금북초.glb", rotationDeg: 0 },
  { id: 67, name: "대현산배수지공원", floors: 1, type: "공원", x: -309.1, z: -475.9 },
  { id: 68, name: "극동미라주 101동", floors: 15, type: "아파트", x: -108.3, z: -619.4, model: "models/place_극미101.glb", rotationDeg: 0, scaleRatio: 1.3 },
  { id: 69, name: "극동미라주 102동", floors: 15, type: "아파트", x: -126.2, z: -701.1, model: "models/place_극미102.glb", rotationDeg: 0, scaleRatio: 1.3 },
  { id: 70, name: "극동미라주 103동", floors: 15, type: "아파트", x: -119.2, z: -774.3, model: "models/place_극미103.glb", scaleRatio: 1.2 },
  { id: 71, name: "극동미라주 104동", floors: 15, type: "아파트", x: -122.6, z: -843.2, model: "models/place_극미104.glb", rotationDeg: 1, scaleRatio: 1.3 },
  { id: 72, name: "신금호공원", floors: 1, type: "공원", x: -403, z: 239 },
  { id: 73, name: "행당대림상가", floors: 7, type: "마트", x: 588.7, z: -467.3 },
  { id: 74, name: "행현초등학교", floors: 5, type: "학교", x: 722.5, z: -540.6 },
  { id: 75, name: "금호동벽산아파트 501동", floors: 15, type: "아파트", x: 159.9, z: -47.4 },
  { id: 76, name: "금호동벽산아파트 502동", floors: 15, type: "아파트", x: 262.5, z: 0.6 },
  { id: 77, name: "금호동벽산아파트 503동", floors: 15, type: "아파트", x: 171.5, z: 59.3 },
  { id: 78, name: "금호동벽산아파트 505동", floors: 15, type: "아파트", x: 303.1, z: 95.7 },
  { id: 81, name: "행당대림아파트 101동", floors: 15, type: "아파트", x: 117.4, z: -549, model: "models/place_행당대림101.glb", rotationDeg: -2.3, scaleRatio: 1.5 },
  { id: 82, name: "행당대림아파트 102동", floors: 15, type: "아파트", x: 224.3, z: -594.6, model: "models/place_행당대림102.glb", rotationDeg: 0, scaleRatio: 1.5 },
  { id: 83, name: "행당대림아파트 103동", floors: 15, type: "아파트", x: 211.4, z: -476.1, model: "models/place_행당대림103.glb", rotationDeg: 4.4, scaleRatio: 1.5 },
  { id: 84, name: "행당대림아파트 104동", floors: 15, type: "아파트", x: 291.8, z: -510.1, model: "models/place_행당대림104.glb", rotationDeg: 4.4, scaleRatio: 1.5 },
  { id: 85, name: "행당대림아파트 105동", floors: 15, type: "아파트", x: 199.3, z: -336.6, model: "models/place_행당대림105.glb", rotationDeg: 0 },
  { id: 86, name: "행당대림아파트 106동", floors: 15, type: "아파트", x: 310.4, z: -401, model: "models/place_행당대림106.glb", rotationDeg: -148.7, scaleRatio: 1.5 },
  { id: 87, name: "행당대림아파트 107동", floors: 15, type: "아파트", x: 143.5, z: -246.9, model: "models/place_행당대림107.glb", rotationDeg: 0 },
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
  { id: 109, name: "행당대림아파트 129동", floors: 15, type: "아파트", x: 518, z: -462.2, model: "models/place_행당대림129.glb", rotationDeg: 118.4 },
  { id: 110, name: "행당대림아파트 130동", floors: 15, type: "아파트", x: 611.1, z: -556.3, model: "models/place_행당대림130.glb", rotationDeg: 0 },
  { id: 111, name: "행당대림아파트 131동", floors: 15, type: "아파트", x: 628.7, z: -623.2, model: "models/place_행당대림131.glb", rotationDeg: 122.2, scaleRatio: 1.5 },
  { id: 112, name: "행당대림아파트 132동", floors: 15, type: "아파트", x: 643.1, z: -667.5, model: "models/place_행당대림132.glb", rotationDeg: -151.6, scaleRatio: 1.5 },
  { id: 113, name: "행당대림아파트 133동", floors: 15, type: "아파트", x: 567.7, z: -683.7, model: "models/place_행당대림133.glb", rotationDeg: 0 },
  { id: 114, name: "행당대림아파트 134동", floors: 15, type: "아파트", x: 585.9, z: -743.9, model: "models/place_행당대림134.glb", rotationDeg: 0 },
  { id: 115, name: "행당대림아파트 135동", floors: 15, type: "아파트", x: 692.3, z: -788.7, model: "models/place_행당대림135.glb", rotationDeg: 0 },
  { id: 200, name: "신금호역", floors: 1, type: "기타", x: -508.9, z: 18.3, model: "models/place_신금호역5.glb", rotationDeg: -45 },
  { id: 201, name: "금파힐후문", floors: 1, type: "기타", x: -54.9, z: -168.7, model: "models/place_금파힐후문.glb", scaleRatio: 1.5 },
  { id: 202, name: "금파힐정문", floors: 1, type: "기타", x: -368.2, z: 133.4, model: "models/place_금파힐정문.glb", rotationDeg: -53.9, scaleRatio: 1.5 },
  { id: 203, name: "조형선외과동물병원", floors: 3, type: "기타", x: -433.8, z: 97.9, model: "models/place_조형선외과동물병원.glb", rotationDeg: -46.8, scaleRatio: 1.5 },
  { id: 204, name: "신금호역 인근 상가", floors: 3, type: "기타", x: -480.5, z: 31.5, model: "models/place_신금호역4번출구앞건물.glb", rotationDeg: 2, scaleRatio: 1.4 },
  { id: 205, name: "설내옥", floors: 3, type: "식당", x: -456.2, z: 148.1, model: "models/place_설내옥.glb", rotationDeg: -4, scaleRatio: 1.5 },
  { id: 206, name: "신금호역 인근 상가", floors: 5, type: "기타", x: -497.6, z: 85.9, model: "models/place_키잉글리시.glb", rotationDeg: -3, scaleRatio: 1.5 },
  { id: 207, name: "KFC", floors: 4, type: "식당", x: -590, z: 56.5, model: "models/place_KFC.glb", rotationDeg: -23, scaleRatio: 1.5 },
  { id: 208, name: "GS25", floors: 154, type: "편의점", x: -541.9, z: 55.7, model: "models/place_GS25.glb", rotationDeg: 2.8, scaleRatio: 1.5 },
  { id: 209, name: "홈플러스익스프레스", floors: 5, type: "중형마트", x: -440.8, z: 10.9, model: "models/place_홈플러스익스프레스.glb", rotationDeg: -15, scaleRatio: 1.5 },
  { id: 210, name: "경찰서,우체국", floors: 5, type: "기타", x: -609.9, z: -74.4, model: "models/place_경찰서.glb", rotationDeg: -2, scaleRatio: 1.2 },
  { id: 211, name: "신금호역", floors: 1, type: "기타", x: -581.3, z: 29.1, model: "models/place_신금호역5.glb" },
  { id: 212, name: "신금호역 인근 상가", floors: 15, type: "기타", x: -541.8, z: -81.2, model: "models/place_신금호역5번출구앞상가.glb", rotationDeg: -3.2, scaleRatio: 1.3 },
  { id: 213, name: "신금호역 인근 상가", floors: 5, type: "기타", x: -625.1, z: 14.3, model: "models/place_megacoffee2.glb", rotationDeg: -25.5, scaleRatio: 1.3 },
  { id: 214, name: "주택", floors: 5, type: "기타", x: 13.1, z: -226.3, model: "models/place_bagel.glb", rotationDeg: 0, scaleRatio: 1.4 },
  { id: 216, name: "주택가", floors: 3, type: "기타", x: -79.5, z: -301.3, model: "models/place_금북주택가2.glb", rotationDeg: -3.9, scaleRatio: 1.3 },
  { id: 217, name: "금호1가동 주민센터", floors: 5, type: "아파트", x: -340, z: -53.4, model: "models/place_금호1가동주민센터.glb", rotationDeg: 28.9, scaleRatio: 1.3 },
  { id: 218, name: "GS25", floors: 15, type: "아파트", x: -25.9, z: -573.4, model: "models/place_gs25극미점.glb", scaleRatio: 1.5 },
  { id: 219, name: "상가", floors: 15, type: "기타", x: -2, z: -509.4, model: "models/place_산마을돈타운2.glb", scaleRatio: 1.5 },
  { id: 220, name: "주택가", floors: 4, type: "기타", x: 0.9, z: -363.5, model: "models/place_금북남전체구역.glb", rotationDeg: 0.1, scaleRatio: 1.3 },
  { id: 222, name: "금호역인근상가", floors: 5, type: "기타", x: -592.7, z: 100.4, model: "models/place_골드축산.glb", rotationDeg: -4.5 },
  { id: 223, name: "행복한교회", floors: 5, type: "기타", x: 109.9, z: -503.8, model: "models/place_행복한교회.glb", scaleRatio: 1.3 },
  { id: 224, name: "대림상가", floors: 5, type: "기타", x: 53.4, z: -562.6, model: "models/place_대림독서실.glb", rotationDeg: -15.6, scaleRatio: 1.3 },
  { id: 225, name: "금호초등학교", floors: 5, type: "학교", x: -546.8, z: 361.1, model: "models/place_금호초등학교.glb", rotationDeg: 19.3, scaleRatio: 2 },
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
export const ROAD_SEGMENTS = [
  { a: [475.2, -475.6], b: [269.1, -350.7], width: 10 },
  { a: [189.1, -302.2], b: [155.4, -311.1], width: 10, curve: [168.2, -292.4] },
  { a: [155.4, -311.1], b: [159.8, -455.2], width: 10 },
  { a: [147.1, -499.1], b: [159.8, -455.2], width: 10, curve: [161.1, -480.3] },
  { a: [796.2, -534.5], b: [269.4, -217], width: 30, curve: [302, -224.5], sidewalk: 5 },
  { a: [79.4, -384.6], b: [79.1, -194], width: 30, sidewalk: 10 },
  { a: [548, -380.3], b: [616.4, -269.9], width: 20 },
  { a: [226.5, -120.9], b: [189.9, -196.5], width: 10 },
  { a: [741.4, -346.3], b: [616.4, -269.9], width: 10 },
  { a: [72.1, -255.8], b: [-61.9, -251.5], width: 10 },
  { a: [-15.8, -254.5], b: [-18.3, -193.3], width: 10 },
  { a: [-582, -29], b: [-400.5, 153.3], width: 30, sidewalk: 10 },
  { a: [326.4, -236.8], b: [387.2, -129.8], width: 10, curve: [359.9, -181.2] },
  { a: [719.9, -280.8], b: [637.6, -232], width: 10 },
  { a: [637.6, -232], b: [697.6, -120], width: 10 },
  { a: [79.1, -194], b: [-191, -191.1], width: 30, sidewalk: 10 },
  { a: [-624.4, 58.7], b: [-582, -29], width: 30, sidewalk: 10 },
  { a: [-191, -191.1], b: [-281.8, -111.9], width: 30, curve: [-270.4, -169.6], sidewalk: 10 },
  { a: [-393.5, -19.3], b: [-582, -29], width: 30, sidewalk: 10 },
  { a: [170, -188.5], b: [196.8, -105.6], width: 6 },
  { a: [196.8, -105.6], b: [222.4, -76.8], width: 6 },
  { a: [222.4, -76.8], b: [416, 16], width: 6 },
  { a: [79.1, -194], b: [269.4, -217], width: 30, curve: [173, -187.3], sidewalk: 5 },
  { a: [123.8, -189.9], b: [156.1, -85.6], width: 10, curve: [128.3, -108.4] },
  { a: [387.2, -129.8], b: [424.9, -96.1], width: 10, curve: [408.3, -96.6] },
  { a: [424.9, -96.1], b: [523.5, -70.5], width: 10 },
  { a: [523.5, -70.5], b: [594.9, -81.1], width: 10, curve: [563.8, -67.3] },
  { a: [594.9, -81.1], b: [697.6, -120], width: 10, curve: [646.7, -100.2] },
  { a: [874.2, -210.8], b: [803.4, -162.2], width: 10, curve: [838, -187.3] },
  { a: [79.1, -194], b: [72.4, -126.1], width: 30, curve: [75.6, -158.8], sidewalk: 10 },
  { a: [95.5, -96.5], b: [98, -5.9], width: 10 },
  { a: [109.6, 37.6], b: [112.6, 110], width: 10, curve: [125.3, 55.7] },
  { a: [76.1, 198.4], b: [146.8, 402.9], width: 30, curve: [123.8, 263.5], sidewalk: 10 },
  { a: [156.1, -85.6], b: [244.8, -40], width: 10 },
  { a: [294.4, 49.6], b: [358.4, 108.8], width: 6 },
  { a: [358.4, 108.8], b: [372.8, 179.2], width: 6 },
  { a: [148.2, -89.2], b: [114.7, -11.3], width: 10.7, curve: [133.7, -53] },
  { a: [114.7, -11.3], b: [138.8, 60.1], width: 10.3 },
  { a: [138.8, 60.1], b: [148.9, 138], width: 12.1 },
  { a: [905.3, -284], b: [874.2, -210.8], width: 10, curve: [898.5, -253.7] },
  { a: [684.8, -73.6], b: [416, 16], width: 6 },
  { a: [65.4, -53.3], b: [36.8, -55.7], width: 10 },
  { a: [416, 16], b: [441.6, 145.6], width: 6 },
  { a: [441.6, 145.6], b: [510.4, 208], width: 6 },
  { a: [510.4, 208], b: [553.6, 300.8], width: 6 },
  { a: [-525.4, 161.7], b: [-487.3, 218.5], width: 15, curve: [-494.4, 187.5] },
  { a: [140.8, 129.6], b: [300.8, 198.4], width: 6 },
  { a: [300.8, 198.4], b: [371.2, 180.8], width: 6 },
  { a: [76.1, 198.4], b: [57.9, 28], width: 30, curve: [41.2, 136.5], sidewalk: 10 },
  { a: [-487.3, 218.5], b: [-400.5, 153.3], width: 20 },
  { a: [-400.5, 153.3], b: [-159.1, 228.2], width: 30, curve: [-309.1, 196.3], sidewalk: 10 },
  { a: [-159.1, 228.2], b: [32, 316.2], width: 30, curve: [-39.5, 271.4], sidewalk: 10 },
  { a: [35.7, 318.1], b: [146.8, 402.9], width: 30, sidewalk: 10 },
  { a: [372.8, 180.8], b: [384, 284.8], width: 6 },
  { a: [382.4, 286.4], b: [369.6, 300.8], width: 6 },
  { a: [384, 286.4], b: [388.8, 300.8], width: 6 },
  { a: [-393.5, -19.3], b: [-281.8, -111.9], width: 30, curve: [-293, -19.3], sidewalk: 10 },
  { a: [-51.8, -384.9], b: [-51.8, -195.5], width: 10, curve: [-77.1, -292.8] },
  { a: [79.4, -384.6], b: [-17.5, -620.2], width: 30, curve: [71.7, -519.4], sidewalk: 10 },
  { a: [-53.7, -821.8], b: [-17.5, -620.2], width: 30, curve: [-77.8, -689.1], sidewalk: 10 },
  { a: [-54.1, -1005.7], b: [-50.9, -887.2], width: 30, curve: [-49.7, -948.9], sidewalk: 10 },
  { a: [-37.5, -460.6], b: [-52.4, -382.8], width: 10 },
  { a: [-649.9, 284.9], b: [-624.4, 58.7], width: 30, curve: [-652.6, 119.6], sidewalk: 10 },
  { a: [-649.9, 284.9], b: [-652.4, 544.2], width: 30, sidewalk: 10 },
  { a: [95.5, -96.5], b: [72.4, -126.1], width: 10, curve: [98.4, -110.1] },
  { a: [-400.5, 153.3], b: [-328.5, 102.6], width: 10, sidewalk: 5 },
  { a: [-328.5, 102.6], b: [-260, 85], width: 10, curve: [-304.6, 80.7], sidewalk: 5 },
  { a: [-190.7, 88.4], b: [-260, 85], width: 10, sidewalk: 5 },
  { a: [-93.3, 13], b: [-18.8, -56.7], width: 12, sidewalk: 5 },
  { a: [-18.8, -56.7], b: [-41.2, -126.5], width: 12, curve: [3.6, -71.1], sidewalk: 5 },
  { a: [-41.2, -126.5], b: [-51.8, -195.5], width: 10, curve: [-59.5, -135], sidewalk: 5 },
  { a: [-232, 8.7], b: [-54.1, -148.9], width: 12, sidewalk: 5 },
  { a: [-269.5, 1], b: [-233.3, 10], width: 12, curve: [-253.7, 33.2], sidewalk: 5 },
  { a: [-168, 87.8], b: [-112.3, 60.4], width: 12, curve: [-120.5, 93.3], sidewalk: 5 },
  { a: [-112.3, 60.4], b: [-93.3, 13], width: 12, curve: [-109.6, 24.7], sidewalk: 5 },
  { a: [-572.3, -216.6], b: [-582, -29], width: 30, sidewalk: 10 },
  { a: [-572.3, -216.6], b: [-641.2, -469], width: 30, curve: [-560.6, -283.2], sidewalk: 10 },
  { a: [-641.2, -469], b: [-727, -833.4], width: 30, curve: [-726.7, -632.3], sidewalk: 5 },
  { a: [-727, -833.4], b: [-787.7, -915.3], width: 30, curve: [-724.8, -898.2] },
  { a: [-919.9, -889.9], b: [-787.7, -915.3], width: 30, curve: [-880.7, -952.1] },
  { a: [-919.9, -889.9], b: [-975.1, -781.3], width: 30 },
  { a: [-167.4, -553.9], b: [29.5, -554.7], width: 10 },
  { a: [-525.4, 161.7], b: [-564.1, -9.4], width: 15, curve: [-579.2, 97.2] },
  { a: [-487.3, 218.5], b: [-479.3, 355.1], width: 15 },
  { a: [-479.3, 355.1], b: [-406.9, 492.9], width: 15, curve: [-474.1, 455] },
  { a: [-406.9, 492.9], b: [-337.1, 546.3], width: 15, curve: [-346.2, 528.3] },
  { a: [-671, -26.2], b: [-576.2, -120.1], width: 15, curve: [-663.8, -104.4] },
  { a: [-671, -26.2], b: [-695.9, 42.8], width: 15, curve: [-672, 25.3] },
  { a: [-707.1, 70.3], b: [-695.9, 42.8], width: 15, curve: [-708.3, 59.1] },
  { a: [-704.6, 100.5], b: [-694.7, 189.7], width: 10 },
  { a: [-674, 265], b: [-694.7, 189.7], width: 10, curve: [-691.2, 227.8] },
  { a: [-65.3, -104.1], b: [-41.2, -126.5], width: 10, sidewalk: 5 },
  { a: [-168, 87.8], b: [-190.7, 88.4], width: 12, sidewalk: 5 },
  { a: [-336.3, 38.9], b: [-318.2, 92.7], width: 10, curve: [-371.2, 68.9], sidewalk: 5 },
  { a: [98, -5.9], b: [109.6, 37.6], width: 10, curve: [101.6, 22.3] },
  { a: [112.6, 110], b: [107, 178.5], width: 10 },
  { a: [117.8, 212.9], b: [107, 178.5], width: 10, curve: [105.9, 198.3] },
  { a: [117.8, 212.9], b: [128.5, 318.5], width: 10, curve: [140.2, 260.5] },
  { a: [177.7, 545], b: [146.8, 402.9], width: 30 },
  { a: [-341, 334], b: [-487.3, 218.5], width: 15, curve: [-421.2, 296.9] },
  { a: [-238, 342.6], b: [-341, 334], width: 15, curve: [-293.4, 330.5] },
  { a: [-182.5, 442.1], b: [-238, 342.6], width: 15, curve: [-147.2, 359.8] },
  { a: [-216.5, 546.3], b: [-182.5, 442.1], width: 15 },
  { a: [-671, -26.2], b: [-582, -29], width: 10 },
  { a: [-707.1, 70.3], b: [-634.3, 82.4], width: 10, curve: [-660.1, 77.5] },
  { a: [-700.7, 133.2], b: [-540.9, 139.3], width: 10 },
  { a: [-525.4, 161.7], b: [-449.1, 106.5], width: 5 },
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
  { a: [-704.6, 100.5], b: [-707.1, 70.3], width: 10 },
  { a: [-573, 193.5], b: [-525.2, 198.6], width: 10 },
  { a: [-525.2, 198.6], b: [-487.3, 218.5], width: 10, curve: [-494.4, 200.2] },
  { a: [-613.8, 230.5], b: [-573, 193.5], width: 10, curve: [-592.1, 189.1] },
  { a: [-649.9, 284.9], b: [-613.8, 230.5], width: 10, curve: [-631.4, 268.3] },
  { a: [-780.1, 290.4], b: [-674, 265], width: 10 },
  { a: [-674, 265], b: [-649.9, 284.9], width: 10 },
  { a: [-18, -865.5], b: [132.4, -828.6], width: 15, curve: [45.8, -779.5] },
  { a: [-18, -865.5], b: [-50.9, -887.2], width: 15, curve: [-39.6, -889.1] },
  { a: [132.4, -828.6], b: [231.2, -903.1], width: 15, curve: [159.5, -838.5] },
  { a: [231.2, -903.1], b: [385.4, -992.4], width: 15, curve: [299.4, -957.9] },
  { a: [241.4, -394.6], b: [269.1, -350.7], width: 10 },
  { a: [138.8, -522.7], b: [147.1, -499.1], width: 10 },
  { a: [138.8, -522.7], b: [50.2, -514.4], width: 10, curve: [77.3, -533.2] },
  { a: [173.2, -532.3], b: [138.8, -522.7], width: 10 },
  { a: [235, -567.3], b: [173.2, -532.3], width: 10 },
  { a: [235, -567.3], b: [267.5, -603], width: 10, curve: [255.8, -575] },
  { a: [284.1, -641.2], b: [308.9, -669.3], width: 10, curve: [289.5, -661.6] },
  { a: [267.5, -603], b: [284.1, -641.2], width: 10 },
  { a: [536.4, -372.3], b: [475.2, -475.6], width: 10 },
  { a: [348.4, -689.7], b: [308.9, -669.3], width: 10 },
  { a: [475.2, -475.6], b: [529, -529.9], width: 10, curve: [511, -493.2] },
  { a: [529, -529.9], b: [623.2, -700.6], width: 10, curve: [593.7, -612.1] },
  { a: [623.2, -700.6], b: [617, -788.5], width: 10, curve: [649, -753.8] },
  { a: [617, -788.5], b: [531.1, -805], width: 10, curve: [589.5, -825.8] },
  { a: [492.8, -809.2], b: [531.1, -805], width: 10, curve: [513, -796.8] },
  { a: [443.2, -811.3], b: [492.8, -809.2], width: 10, curve: [459.7, -824.7] },
  { a: [443.2, -811.3], b: [404.9, -787.5], width: 10 },
  { a: [377, -759.5], b: [404.9, -787.5], width: 10, curve: [385.7, -778.7] },
  { a: [377, -759.5], b: [348.4, -689.7], width: 10 },
  { a: [62.1, -482.8], b: [-37.5, -460.6], width: 10, curve: [-39, -481.3] },
  { a: [72.4, -126.1], b: [65.4, -53.3], width: 30, curve: [68.7, -87.9], sidewalk: 10 },
  { a: [65.4, -53.3], b: [57.9, 28], width: 30, curve: [61.3, -9.9], sidewalk: 10 },
  { a: [475.2, -475.6], b: [348.4, -689.7], width: 10 },
  { a: [269.1, -350.7], b: [189.1, -302.2], width: 10 },
  { a: [269.1, -350.7], b: [331.2, -252.5], width: 10 },
  { a: [387.2, -129.8], b: [314.7, -85.4], width: 10 },
  { a: [637.6, -232], b: [469.2, -132], width: 10 },
  { a: [616.4, -269.9], b: [387.2, -129.8], width: 10 },
  { a: [697.6, -120], b: [803.4, -162.2], width: 10, curve: [751, -140.7] },
  { a: [-50.9, -887.2], b: [-53.7, -821.8], width: 30, curve: [-51.5, -855.2], sidewalk: 10 },
];

// ── 가로수(TREES) ──
// 금호파크힐스 단지 내부(동 사이 공터)에 심을 나무 자리 — 위성사진에서 건물·도로가 아닌 어두운
// 녹지로 보이는 자리를 건물 중심/도로 중심선에서 충분히 떨어뜨려 골라낸 좌표들(raw 단위, PLACES와
// 같은 기준). map_editor.html에서 "나무 추가/삭제"로 점 하나씩 더하고 뺄 수 있다.
export const TREES = [[-428.9, -212.3], [-429.2, -186.8], [-421.4, -169.9], [-421.6, -128.2], [-429.4, -49.5], [-427.4, -38.9], [-417.1, 18.3], [-429.1, 37.8], [-416.2, 71.5], [-381.8, 184.7], [-412.2, 181.8], [-388.8, 205.4], [-414.7, 221.8], [-392.5, -205.2], [-394.5, -131.6], [-387.3, -87.5], [-390.5, -66.9], [-400.9, -39], [-396.3, 28.7], [-387.4, 80.6], [-394.3, 178.9], [-380, 194.7], [-360.2, -180.8], [-377.1, -144], [-375, -112.3], [-378.4, -90.3], [-360.7, 31.3], [-368.3, 38.4], [-423.6, 189.4], [-337, -192.7], [-345, -170.8], [-317.4, -51.5], [-336.8, 72.5], [-432.4, 198.2], [-319.1, -238], [-315.4, -178], [-308.3, -154.2], [-321.2, -139.3], [-316, 21.7], [-291, -186.3], [-280.8, -75.9], [-284.1, 3.3], [-285.5, 24.3], [-282, 56.7], [-266.2, 161.1], [-402.3, 174], [-259.8, -65.5], [-273, 54.5], [-211.2, 168.3], [-398.8, 216.4], [-206, -164.1], [-241.8, -142.5], [-240, -60.2], [-243.1, -12], [-242.5, 41.6], [-238.8, 65.9], [-235.1, 168.3], [-228.3, 147], [-248.4, 174.5], [-265.9, 142.9], [-268.4, 180], [-193.7, -167.5], [-217.8, -158.2], [-207.1, -24.5], [-210.6, 194.7], [-179, -169], [-232, -150.9], [-186.7, 20.3], [-247, 142.9], [-188.8, -117.7], [-165.3, -169.5], [-150.6, -168.5], [-154.7, 206], [-135.4, -170], [-125.9, 26.2], [-135.8, 47.5], [-137.4, 63.9], [-196.6, 142.7], [-138.8, 145.8], [-136.4, 162.7], [-233.8, 188.4], [-116.1, -168.2], [-177.3, 146], [-112, 167.1], [-138.3, 214.8], [-188.3, 197.2], [-88.1, -151.2], [-269.7, 172.7], [-244.5, 151.5], [-138.3, 196.3], [-49.5, -103.5], [-60.9, 25.5], [-65.9, 93.5], [-35.3, -170.1], [-37.9, 54.1], [-36.3, 93.7], [-28.4, 147.4], [-183.9, 156.1], [-6.7, -64.5], [-10.2, -15.2], [-3, 63.9], [-5.9, 146.5], [-216.9, 159.2], [20, -179], [24.9, -126.5], [23, -104.1], [22.4, -48.1], [31.9, 20.6], [24.5, 79.8], [27.9, 93.2], [16.1, 148.9], [19.6, 169.2], [26.7, 211.3], [23.3, 234.4], [46.5, -157.7], [39.5, -6.2], [38.4, 23.8], [41.6, 213]];

// ── 공원(PARKS) ──
// 바닥을 초록색 잔디로 칠한 네모난 구역 — x,z(중심), w(가로),d(세로)는 raw 단위, rotationDeg는
// 건물과 같은 방식(월드 기준, 0이면 가로=x축·세로=z축 그대로)으로 돌아간다. map_editor.html에서
// "공원 추가/삭제"로 다룬다.
export const PARKS = [
];

// 길 중간 횡단보도·신호등 — x,z(raw)는 도로 위 자리(가장 가까운 도로에 붙는다), signal: false면 신호등 없이 횡단보도만.
// 교차로 끝의 횡단보도·신호등은 여기가 아니라 ROAD_SEGMENTS의 crosswalkA/B·signalA/B로 켜고 끈다.
// map_editor.html의 "🚦 신호등 추가"로 다룬다.
export const CROSSWALKS = [
  { x: -44, z: -192.7 },
  { x: -60.3, z: -739 },
];
