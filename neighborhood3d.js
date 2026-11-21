// ── 거리 모험 (프린세스메이커 무사수행 느낌의 아주 기본적인 버전) ──
// 실제 동네를 그대로 옮기는 건 접고, 평범한 한국 거리를 흉내 낸 가상의 길을 만들어서
// 그 위를 걸어 다니며 동전을 줍고 불량배를 처리해 용돈을 버는 걸로 바꿨다.
// walk.glb(이로이 3D 모델 + Walking/Running/Idle/Regular_Jump 등 20개 동작),
// dance.glb(춤 동작들)는 그대로 쓴다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ASSET_VERSION = "20261120b";

const KEY_DIR = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};
const WALK_SPEED = 3.0; // m/s
const RUN_SPEED = 7.5; // m/s

// "춤추기"를 누르면 이 중 하나를 무작위로 고른다(뛰기/걷기 자체 동작은 제외)
const DANCE_POOL = [
  "Boom_Dance",
  "Bubble_Dance",
  "Cardio_Dance",
  "Hip_Hop_Dance",
  "Hip_Hop_Dance_1",
  "Hip_Hop_Dance_2",
  "Hip_Hop_Dance_3",
  "Hip_Hop_Dance_4",
  "Indoor_Swing",
  "Love_You_Pop_Dance",
  "Shake_It_Off_Dance",
  "Superlove_Pop_Dance",
  "ymca_dance",
];
// 엄마 모델(mom.glb)에 들어있는 춤 동작들 — 걷기/인사/Idle 같은 동작은 제외
const MOM_DANCE_POOL = [
  "Boom_Dance",
  "Cardio_Dance",
  "Crystal_Beads",
  "Gangnam_Groove",
  "Hip_Hop_Dance",
  "Hip_Hop_Dance_2",
  "Hip_Hop_Dance_3",
  "Indoor_Swing",
  "Love_You_Pop_Dance",
  "OMG_Groove",
  "Shake_It_Off_Dance",
  "Superlove_Pop_Dance",
  "jazz_danc",
  "ymca_dance",
];

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
const PLACES = [
  { id: 0, name: "우리집", floors: 15, type: "아파트", x: 9.3, z: -10.7, home: true, model: "models/3D_place_113.glb", rotationDeg: 57 },
  { id: 1, name: "금호파크힐스 101동", floors: 15, type: "아파트", x: -294.5, z: 56.1, model: "models/3D_place_101.glb", rotationDeg: 6.3 },
  { id: 2, name: "금호파크힐스 102동", floors: 15, type: "아파트", x: -304.1, z: 57.3, model: "models/3D_place_102.glb", rotationDeg: 4.9 },
  { id: 3, name: "금호파크힐스 103동", floors: 15, type: "아파트", x: -251.2, z: -17.6, model: "models/3D_place_103.glb", rotationDeg: -40.7 },
  { id: 4, name: "금호파크힐스 104동", floors: 15, type: "아파트", x: -172.0, z: -92.0, model: "models/3D_place_104.glb", rotationDeg: 14.1 },
  { id: 5, name: "금호파크힐스 105동·이마트24", floors: 15, type: "아파트", x: -94.2, z: -138.0, model: "models/3D_place_105.glb", rotationDeg: 0 },
  { id: 6, name: "금호파크힐스 106동", floors: 15, type: "아파트", x: -70.0, z: -55.6, model: "models/3D_place_106.glb", rotationDeg: 46.3 },
  { id: 7, name: "금호파크힐스 107동", floors: 15, type: "아파트", x: -163.4, z: 2.5, model: "models/3D_place_107.glb", rotationDeg: 29.8 },
  { id: 8, name: "금호파크힐스 108동", floors: 15, type: "아파트", x: -199.8, z: 55.7, model: "models/3D_place_108.glb", rotationDeg: -27.8 },
  { id: 9, name: "금호파크힐스 109동", floors: 15, type: "아파트", x: -317.9, z: 142.8, model: "models/3D_place_109.glb", rotationDeg: 85.2 },
  { id: 10, name: "금호파크힐스 110동", floors: 15, type: "아파트", x: -251.5, z: 119.8, model: "models/3D_place_110.glb", rotationDeg: 24.3 },
  { id: 11, name: "금호파크힐스 111동", floors: 15, type: "아파트", x: -158.3, z: 119.8, model: "models/3D_place_111.glb", rotationDeg: 87.4 },
  { id: 12, name: "금호파크힐스 112동", floors: 15, type: "아파트", x: -74.0, z: 57.0, model: "models/3D_place_112.glb", rotationDeg: 17.7 },
  { id: 14, name: "금호파크힐스 114동", floors: 15, type: "아파트", x: 9.2, z: -93.5, model: "models/3D_place_114.glb", rotationDeg: -74.1 },
  { id: 15, name: "금호파크힐스 115동", floors: 15, type: "아파트", x: -25.0, z: -146.7, model: "models/3D_place_115.glb", rotationDeg: 68.8 },
  { id: 16, name: "금호파크힐스 116동", floors: 15, type: "아파트", x: -38.9, z: 100.1, model: "models/3D_place_116.glb", rotationDeg: -1.8 },
  { id: 17, name: "파리바게뜨", floors: 6, type: "카페", x: 50.5, z: -154.9, diagonal: true, model: "models/3D_place_namkwang.glb", rotationDeg: 0 },
  { id: 18, name: "대현교회", floors: 4, type: "기타", x: -261, z: -114, church: true },
  { id: 19, name: "금호고등학교", floors: 5, type: "학교", x: -58.2, z: 189.3 },
  { id: 20, name: "금호파크힐스 117동", floors: 15, type: "아파트", x: 22.3, z: 271.9, rotationDeg: 29 },
  { id: 21, name: "금호119안전센터", floors: 2, type: "기타", x: 17.2, z: 79.0, model: "models/3D_place_keumho119.glb", rotationDeg: 0 },
  { id: 22, name: "성동구립금호도서관", floors: 4, type: "도서관", x: 91, z: 83, model: "models/place_성동구립금호도서관.glb", rotationDeg: 0 },
  { id: 23, name: "성동구보건소금호분소", floors: 4, type: "보건소", x: 104, z: 152 },
  { id: 24, name: "성동아이사랑복합문화센터", floors: 4, type: "기타", x: 140.0, z: 329.9 },
  { id: 25, name: "태비KTS태권스쿨", floors: 4, type: "학원", x: 115, z: -88, model: "models/3D_place_taekwondo.glb", rotationDeg: 0 },
  // model 추측: 업로드된 models/place_할인마트.glb가 CSV 어디에도 매칭되는 이름이 없어서, 유형이 같은
  // "중형마트"인 NEW웰빙마트에 일단 연결해 뒀다 — 다른 가게용이면 알려주면 바로 옮긴다.
  { id: 26, name: "NEW웰빙마트", floors: 4, type: "중형마트", x: 104, z: -149, diagonal: true, model: "models/place_할인마트.glb", rotationDeg: 0 },
  { id: 27, name: "롯데마트행당점", floors: 6, type: "대형마트", x: 643.0, z: -371.9, model: "models/place_롯데마트행당점.glb", rotationDeg: 0 },
  { id: 28, name: "메가MGC커피", floors: 2, type: "카페", x: 51, z: -229, diagonal: true, model: "models/3D_place_megacoffee.glb", rotationDeg: 0 },
  { id: 29, name: "아담리즈수학·CU", floors: 3, type: "편의점", x: -104, z: -229 },
  { id: 30, name: "분식집", floors: 4, type: "식당", x: -56, z: -229 },

  // ── 2026-11-18 추가, 같은 날 밤 실제 업로드 파일명에 맞춰 갱신 ──
  // 3dmodeling_place.csv 31행 이후에 자리를 미리 잡아 둔다. model 경로는 "models/3D_place_*"가 아니라
  // 실제로 올라온 파일들을 보고 확인한 "models/place_<이름><번호>.glb" 규칙을 따른다(예: place_행당대림101.glb,
  // place_행당한진201.glb, place_극미101.glb — 복잡한 단지 이름은 행당한진타운→행당한진, 극동미라주→극미처럼
  // 사용자가 그때그때 줄여 쓰고 있어서 규칙이 고정돼 있지 않다). 그래서 실제 파일이 있거나 CSV의
  // 모델링이미지 칸에 이름이 적혀 있는 것만 model을 연결했고, 아직 이름이 안 정해진 나머지(신금호두산위브·
  // 금호1가동주민센터·행당한진타운 101~121동·대현산배수지공원·신금호공원·행당대림상가·행현초등학교·
  // 금호동벽산아파트)는 model 없이 좌표만 비워 뒀다 — 파일 이름을 알려주거나 CSV에 적어 두면 바로 연결한다.
  // ⚠️ 3dmodeling_place.csv의 모델링이미지 칸을 채우는 것만으로는 화면에 반영되지 않는다 — 실제로 불러오는
  // 건 이 PLACES 배열의 model 필드뿐이라, CSV를 고친 뒤에도 이 배열을 같이 고쳐야 적용된다.
  // 좌표는 2026-11-18 밤, 롯데마트행당점(개발자가 이미 배치해 둔 x:654,z:-352)을 기준점 삼아
  // 카카오 키워드 검색(kakao.maps.services.Places — 이 게임이 실제로 쓰는 것과 같은 API)으로 각
  // 단지의 정확한 위도·경도를 받아온 뒤, 롯데마트행당점의 실제 좌표 대비 raw 좌표로 축척(약 1.59배)과
  // 회전(약 -57도)을 함께 역산해서 다시 잡았다 — 처음엔 회전을 0으로 가정해서 집에서 먼 곳일수록
  // 엉뚱한 방향으로 크게 어긋났었는데("지도 표기한 것보다 턱없이 멀다"), 실제로는 원본 위성사진 자체가
  // 꽤 틀어져 있었다. 단지 안 동별 배치는 그래도 실제 항공사진 없이 격자로 임의 배치한 것이라, 모델을
  // 넣어 보고 지도에서 눈으로 본 뒤 미세 조정은 필요할 수 있다.
  { id: 31, name: "신금호두산위브 101동", floors: 15, type: "아파트", x: 49, z: 341 },
  { id: 32, name: "신금호두산위브 102동", floors: 15, type: "아파트", x: 74, z: 341 },
  { id: 33, name: "신금호두산위브 103동", floors: 15, type: "아파트", x: 99, z: 341 },
  { id: 34, name: "신금호두산위브 104동", floors: 15, type: "아파트", x: 62, z: 365 },
  { id: 35, name: "신금호두산위브 105동", floors: 15, type: "아파트", x: 86, z: 365 },
  { id: 36, name: "금호1가동주민센터", floors: 4, type: "기타", x: -52, z: 293 },

  { id: 41, name: "행당한진타운 101동", floors: 15, type: "아파트", x: 493, z: -432 },
  { id: 42, name: "행당한진타운 102동", floors: 15, type: "아파트", x: 515, z: -432 },
  { id: 43, name: "행당한진타운 103동", floors: 15, type: "아파트", x: 537, z: -432 },
  { id: 44, name: "행당한진타운 104동", floors: 15, type: "아파트", x: 559, z: -432 },
  { id: 45, name: "행당한진타운 105동", floors: 15, type: "아파트", x: 581, z: -432 },
  { id: 46, name: "행당한진타운 106동", floors: 15, type: "아파트", x: 603, z: -432 },
  { id: 47, name: "행당한진타운 107동", floors: 15, type: "아파트", x: 625, z: -432 },
  { id: 48, name: "행당한진타운 108동", floors: 15, type: "아파트", x: 493, z: -410 },
  { id: 49, name: "행당한진타운 109동", floors: 15, type: "아파트", x: 515, z: -410 },
  { id: 50, name: "행당한진타운 110동", floors: 15, type: "아파트", x: 537, z: -410 },
  { id: 51, name: "행당한진타운 111동", floors: 15, type: "아파트", x: 559, z: -410 },
  { id: 52, name: "행당한진타운 112동", floors: 15, type: "아파트", x: 581, z: -410 },
  { id: 53, name: "행당한진타운 113동", floors: 15, type: "아파트", x: 603, z: -410 },
  { id: 54, name: "행당한진타운 114동", floors: 15, type: "아파트", x: 625, z: -410 },
  { id: 55, name: "행당한진타운 115동", floors: 15, type: "아파트", x: 493, z: -388 },
  { id: 56, name: "행당한진타운 116동", floors: 15, type: "아파트", x: 515, z: -388 },
  { id: 57, name: "행당한진타운 117동", floors: 15, type: "아파트", x: 537, z: -388 },
  { id: 58, name: "행당한진타운 118동", floors: 15, type: "아파트", x: 559, z: -388 },
  { id: 59, name: "행당한진타운 119동", floors: 15, type: "아파트", x: 581, z: -388 },
  { id: 60, name: "행당한진타운 120동", floors: 15, type: "아파트", x: 603, z: -388 },
  { id: 61, name: "행당한진타운 121동", floors: 15, type: "아파트", x: 625, z: -388 },
  // 201~204동은 3dmodeling_place.csv에 이미 모델 이름(place_행당한진201~204)이 등록돼 있고 실제 glb도 올라와 있다.
  { id: 62, name: "행당한진타운 201동", floors: 15, type: "아파트", x: 638, z: -441, model: "models/place_행당한진201.glb", rotationDeg: 0 },
  { id: 63, name: "행당한진타운 202동", floors: 15, type: "아파트", x: 660, z: -441, model: "models/place_행당한진202.glb", rotationDeg: 0 },
  { id: 64, name: "행당한진타운 203동", floors: 15, type: "아파트", x: 638, z: -419, model: "models/place_행당한진203.glb", rotationDeg: 0 },
  { id: 65, name: "행당한진타운 204동", floors: 15, type: "아파트", x: 660, z: -419, model: "models/place_행당한진204.glb", rotationDeg: 0 },

  // seoul_geumbuk_elementary_v8.html로 만든 models/place_금북초.glb를 연결했다 — 예전에 만들어 둔
  // models/3D_place_keumbuk.glb(14MB, 더 큰 구버전으로 보임)는 이제 아무 데도 안 쓰인다, 필요없으면 지워도 된다.
  { id: 66, name: "금북초등학교", floors: 5, type: "학교", x: 375, z: 371, model: "models/place_금북초.glb", rotationDeg: 0 },
  { id: 67, name: "대현산배수지공원", floors: 1, type: "공원", x: 245, z: 518 },

  { id: 68, name: "극동미라주 101동", floors: 15, type: "아파트", x: 514, z: 504, model: "models/place_극미101.glb", rotationDeg: 0 },
  { id: 69, name: "극동미라주 102동", floors: 15, type: "아파트", x: 539, z: 504, model: "models/place_극미102.glb", rotationDeg: 0 },
  { id: 70, name: "극동미라주 103동", floors: 15, type: "아파트", x: 514, z: 529 },
  { id: 71, name: "극동미라주 104동", floors: 15, type: "아파트", x: 539, z: 529 },

  { id: 72, name: "신금호공원", floors: 1, type: "공원", x: -403, z: 239 },
  { id: 73, name: "행당대림상가", floors: 7, type: "마트", x: 565, z: -209 },
  { id: 74, name: "행현초등학교", floors: 5, type: "학교", x: 875, z: -318 },

  // 금호동벽산아파트는 CSV에 501~503·505동만 있고 504동이 없다(원본 그대로 비웠다).
  { id: 75, name: "금호동벽산아파트 501동", floors: 15, type: "아파트", x: -115, z: -510 },
  { id: 76, name: "금호동벽산아파트 502동", floors: 15, type: "아파트", x: -90, z: -510 },
  { id: 77, name: "금호동벽산아파트 503동", floors: 15, type: "아파트", x: -115, z: -485 },
  { id: 78, name: "금호동벽산아파트 505동", floors: 15, type: "아파트", x: -90, z: -485 },

  // 101~135동 전부 3dmodeling_place.csv에 place_행당대림<번호> 이름이 등록돼 있다 — 아직 일부(101~104·
  // 106·108~110·112·113·115·116·120·123~125·127~129)만 실제 glb가 올라와 있고 나머지는 올라오는 대로
  // 같은 이름으로 넣으면 바로 적용된다.
  { id: 81, name: "행당대림아파트 101동", floors: 15, type: "아파트", x: 662, z: -72, model: "models/place_행당대림101.glb", rotationDeg: 0 },
  { id: 82, name: "행당대림아파트 102동", floors: 15, type: "아파트", x: 684, z: -72, model: "models/place_행당대림102.glb", rotationDeg: 0 },
  { id: 83, name: "행당대림아파트 103동", floors: 15, type: "아파트", x: 706, z: -72, model: "models/place_행당대림103.glb", rotationDeg: 0 },
  { id: 84, name: "행당대림아파트 104동", floors: 15, type: "아파트", x: 728, z: -72, model: "models/place_행당대림104.glb", rotationDeg: 0 },
  { id: 85, name: "행당대림아파트 105동", floors: 15, type: "아파트", x: 750, z: -72, model: "models/place_행당대림105.glb", rotationDeg: 0 },
  { id: 86, name: "행당대림아파트 106동", floors: 15, type: "아파트", x: 772, z: -72, model: "models/place_행당대림106.glb", rotationDeg: 0 },
  { id: 87, name: "행당대림아파트 107동", floors: 15, type: "아파트", x: 794, z: -72, model: "models/place_행당대림107.glb", rotationDeg: 0 },
  { id: 88, name: "행당대림아파트 108동", floors: 15, type: "아파트", x: 662, z: -50, model: "models/place_행당대림108.glb", rotationDeg: 0 },
  { id: 89, name: "행당대림아파트 109동", floors: 15, type: "아파트", x: 684, z: -50, model: "models/place_행당대림109.glb", rotationDeg: 0 },
  { id: 90, name: "행당대림아파트 110동", floors: 15, type: "아파트", x: 706, z: -50, model: "models/place_행당대림110.glb", rotationDeg: 0 },
  { id: 91, name: "행당대림아파트 111동", floors: 15, type: "아파트", x: 728, z: -50, model: "models/place_행당대림111.glb", rotationDeg: 0 },
  { id: 92, name: "행당대림아파트 112동", floors: 15, type: "아파트", x: 750, z: -50, model: "models/place_행당대림112.glb", rotationDeg: 0 },
  { id: 93, name: "행당대림아파트 113동", floors: 15, type: "아파트", x: 772, z: -50, model: "models/place_행당대림113.glb", rotationDeg: 0 },
  { id: 94, name: "행당대림아파트 114동", floors: 15, type: "아파트", x: 794, z: -50, model: "models/place_행당대림114.glb", rotationDeg: 0 },
  { id: 95, name: "행당대림아파트 115동", floors: 15, type: "아파트", x: 662, z: -28, model: "models/place_행당대림115.glb", rotationDeg: 0 },
  { id: 96, name: "행당대림아파트 116동", floors: 15, type: "아파트", x: 684, z: -28, model: "models/place_행당대림116.glb", rotationDeg: 0 },
  { id: 97, name: "행당대림아파트 117동", floors: 15, type: "아파트", x: 706, z: -28, model: "models/place_행당대림117.glb", rotationDeg: 0 },
  { id: 98, name: "행당대림아파트 118동", floors: 15, type: "아파트", x: 728, z: -28, model: "models/place_행당대림118.glb", rotationDeg: 0 },
  { id: 99, name: "행당대림아파트 119동", floors: 15, type: "아파트", x: 750, z: -28, model: "models/place_행당대림119.glb", rotationDeg: 0 },
  { id: 100, name: "행당대림아파트 120동", floors: 15, type: "아파트", x: 772, z: -28, model: "models/place_행당대림120.glb", rotationDeg: 0 },
  { id: 101, name: "행당대림아파트 121동", floors: 15, type: "아파트", x: 794, z: -28, model: "models/place_행당대림121.glb", rotationDeg: 0 },
  { id: 102, name: "행당대림아파트 122동", floors: 15, type: "아파트", x: 662, z: -6, model: "models/place_행당대림122.glb", rotationDeg: 0 },
  { id: 103, name: "행당대림아파트 123동", floors: 15, type: "아파트", x: 684, z: -6, model: "models/place_행당대림123.glb", rotationDeg: 0 },
  { id: 104, name: "행당대림아파트 124동", floors: 15, type: "아파트", x: 706, z: -6, model: "models/place_행당대림124.glb", rotationDeg: 0 },
  { id: 105, name: "행당대림아파트 125동", floors: 15, type: "아파트", x: 728, z: -6, model: "models/place_행당대림125.glb", rotationDeg: 0 },
  { id: 106, name: "행당대림아파트 126동", floors: 15, type: "아파트", x: 750, z: -6, model: "models/place_행당대림126.glb", rotationDeg: 0 },
  { id: 107, name: "행당대림아파트 127동", floors: 15, type: "아파트", x: 772, z: -6, model: "models/place_행당대림127.glb", rotationDeg: 0 },
  { id: 108, name: "행당대림아파트 128동", floors: 15, type: "아파트", x: 794, z: -6, model: "models/place_행당대림128.glb", rotationDeg: 0 },
  { id: 109, name: "행당대림아파트 129동", floors: 15, type: "아파트", x: 662, z: 16, model: "models/place_행당대림129.glb", rotationDeg: 0 },
  { id: 110, name: "행당대림아파트 130동", floors: 15, type: "아파트", x: 684, z: 16, model: "models/place_행당대림130.glb", rotationDeg: 0 },
  { id: 111, name: "행당대림아파트 131동", floors: 15, type: "아파트", x: 706, z: 16, model: "models/place_행당대림131.glb", rotationDeg: 0 },
  { id: 112, name: "행당대림아파트 132동", floors: 15, type: "아파트", x: 728, z: 16, model: "models/place_행당대림132.glb", rotationDeg: 0 },
  { id: 113, name: "행당대림아파트 133동", floors: 15, type: "아파트", x: 750, z: 16, model: "models/place_행당대림133.glb", rotationDeg: 0 },
  { id: 114, name: "행당대림아파트 134동", floors: 15, type: "아파트", x: 772, z: 16, model: "models/place_행당대림134.glb", rotationDeg: 0 },
  { id: 115, name: "행당대림아파트 135동", floors: 15, type: "아파트", x: 794, z: 16, model: "models/place_행당대림135.glb", rotationDeg: 0 },

  // place.csv에만 있고 3dmodeling_place.csv에는 없는 지하철역 — place_신금호역5.glb가 이미 올라와 있어서 추가했다.
  { id: 200, name: "신금호역", floors: 1, type: "기타", x: -311, z: 433, model: "models/place_신금호역5.glb", rotationDeg: 0 },
];

// 금호파크힐스 단지 내부(동 사이 공터)에 심을 나무 자리 — 위성사진에서 건물·도로가 아닌 어두운
// 녹지로 보이는 자리를 건물 중심/도로 중심선에서 충분히 떨어뜨려 골라낸 좌표들(raw 단위, PLACES와 동일 기준)
const TREE_SPOTS = [[-428.9, -212.3], [-429.2, -186.8], [-421.4, -169.9], [-421.6, -128.2], [-429.4, -49.5], [-427.4, -38.9], [-417.1, 18.3], [-429.1, 37.8], [-416.2, 71.5], [-425.3, 152.5], [-412.2, 181.8], [-410.0, 195.1], [-414.7, 221.8], [-392.5, -205.2], [-394.5, -131.6], [-387.3, -87.5], [-390.5, -66.9], [-400.9, -39.0], [-388.4, -12.7], [-396.3, 28.7], [-387.4, 80.6], [-386.0, 134.5], [-400.7, 145.4], [-394.3, 178.9], [-404.3, 201.3], [-360.2, -180.8], [-377.1, -144.0], [-375.0, -112.3], [-378.4, -90.3], [-365.6, -38.3], [-371.2, -7.8], [-360.7, 31.3], [-368.3, 38.4], [-367.4, 117.6], [-360.4, 181.1], [-367.3, 234.8], [-337.0, -192.7], [-345.0, -170.8], [-331.8, -73.5], [-347.8, -62.7], [-336.8, 72.5], [-335.7, 134.8], [-348.9, 169.2], [-333.6, 209.4], [-319.1, -238.0], [-315.4, -178.0], [-308.3, -154.2], [-321.2, -139.3], [-316.0, 21.7], [-311.3, 126.2], [-291.0, -186.3], [-280.8, -75.9], [-297.9, -58.2], [-284.1, 3.3], [-285.5, 24.3], [-282.0, 56.7], [-280.6, 70.9], [-297.0, 123.6], [-293.3, 144.7], [-291.2, 193.0], [-287.4, 229.3], [-259.8, -65.5], [-260.1, -32.6], [-273.0, 54.5], [-268.8, 91.3], [-269.4, 116.9], [-268.4, 203.0], [-267.2, 219.0], [-236.9, -219.5], [-231.0, -137.2], [-234.1, -99.0], [-240.0, -60.2], [-243.1, -12.0], [-242.5, 41.6], [-238.8, 65.9], [-228.2, 126.0], [-228.3, 147.0], [-248.4, 174.5], [-237.9, 196.8], [-248.3, 224.1], [-221.9, -217.1], [-204.1, -137.3], [-207.1, -24.5], [-221.8, 91.4], [-206.8, 203.1], [-191.2, -247.9], [-194.8, -116.3], [-182.3, -9.4], [-186.7, 20.3], [-176.9, 63.0], [-187.1, 120.2], [-184.3, 169.5], [-165.6, -230.7], [-169.9, -223.3], [-167.5, -164.2], [-155.6, -74.6], [-158.1, -33.9], [-164.7, -14.4], [-165.2, 42.1], [-169.4, 181.8], [-154.7, 206.0], [-169.4, 237.9], [-134.6, -242.3], [-129.0, -203.1], [-132.8, -163.2], [-125.6, -109.1], [-125.5, -72.7], [-141.5, -63.4], [-137.3, -39.5], [-125.9, 26.2], [-135.8, 47.5], [-137.4, 63.9], [-124.3, 91.2], [-131.3, 132.5], [-138.8, 145.8], [-126.2, 193.1], [-129.6, 237.2], [-106.2, -249.4], [-116.1, -168.2], [-104.9, -103.5], [-112.1, -38.7], [-105.2, -0.9], [-105.9, 62.8], [-100.0, 124.5], [-112.0, 167.1], [-104.4, 201.3], [-104.5, 237.8], [-91.7, -242.4], [-88.1, -151.2], [-87.8, -103.6], [-88.5, -62.8], [-78.6, -21.7], [-71.7, 108.0], [-91.7, 154.4], [-84.6, 173.5], [-92.3, 198.4], [-49.3, -214.4], [-47.3, -167.4], [-47.7, -144.8], [-49.5, -103.5], [-60.9, 25.5], [-65.9, 93.5], [-27.8, -242.6], [-32.9, -207.1], [-35.3, -170.1], [-37.9, 54.1], [-36.3, 93.7], [-28.4, 147.4], [-19.8, 177.2], [3.1, -230.4], [-8.3, -220.9], [-6.7, -64.5], [-10.2, -15.2], [-3.0, 63.9], [-5.9, 146.5], [6.3, 226.2], [26.7, -245.2], [20.0, -179.0], [24.9, -126.5], [24.5, -111.7], [22.4, -48.1], [31.9, 20.6], [24.5, 79.8], [27.9, 93.2], [29.2, 131.8], [16.1, 148.9], [19.6, 169.2], [26.7, 211.3], [23.3, 234.4], [49.0, -210.4], [46.5, -157.7], [39.8, -38.7], [39.5, -6.2], [38.4, 23.8], [41.6, 213.0]];

// 유형별 기본 크기·색(사진 참고 — 금호파크힐스는 흰색/베이지 바탕에 주황 포인트, 각 상점은 실제 브랜드 색을 흉내)
const TYPE_STYLE = {
  "아파트": { w: 22, d: 13, color: 0xede4d6, accent: 0xc9784a },
  "카페": { w: 13, d: 11, color: 0x173a66 },
  "기타": { w: 12, d: 10, color: 0x9fb0c0 },
  "학교": { w: 30, d: 16, color: 0xdccba0 },
  "도서관": { w: 14, d: 12, color: 0x7fa0b0 },
  "보건소": { w: 13, d: 11, color: 0x8fb5c5 },
  "학원": { w: 12, d: 10, color: 0x3d6fae },
  "중형마트": { w: 14, d: 12, color: 0xff8c3c },
  "대형마트": { w: 20, d: 16, color: 0xc81432 },
  "편의점": { w: 10, d: 9, color: 0x6a2c91 },
  "식당": { w: 11, d: 10, color: 0xe0a040 },
};
const NAME_COLOR_OVERRIDE = {
  "파리바게뜨": 0x163a73,
  "메가MGC커피": 0x8c1f1f,
};
// 실제 축척(1유닛=1m) 그대로 쓰면 건물이 너무 거대하고 이동도 한없이 느려져서,
// 지도 화면에서 움직이는 정도로 느껴지도록 전체를 줄여 쓴다 — 113동(우리집) 건물 밑변이
// 이로이 캐릭터(키 1.7) 두 배쯤 되도록 축척을 잡았다(22m짜리 폭 → 약 3.3)
const WORLD_SCALE = 0.15;
// 도로 지도(kakaomap_road1.png, 사용자가 건물번호 지도와 같은 위성사진 위에 빨간색으로 도로를
// 직접 칠해 준 버전) 기준. 이 지도는 번호 지도(kakaomap_number.png)와 완전히 같은 사진이라, 건물
// 좌표를 구할 때 썼던 것과 같은 축척·기준점으로 도로 모양을 그대로 옮길 수 있었다 — 빨간색 영역을
// 이미지 처리(색상 추출→스켈레톤화→그래프 추출)로 따서 중심선과 각 구간의 실제 두께를 함께 구했고,
// 두께 분포(3~5m / 13m 안팎 / 19~29m / 30m 이상)를 그대로 골목·보통길·큰길·난계로급 4단계 폭으로
// 옮겼다. 난계로와 거기 교차하는 큰길(가장 두껍게 칠해진 구간)은 ROAD_MAJOR로 따로 빼서 더 넓게,
// 차선도 2줄이 아니라 3줄로 그린다.
const ROAD_MAJOR = 16; // 난계로·사거리 교차로 등 가장 두껍게 칠해진 간선도로
const ROAD_WIDE = 10; // 그다음으로 두꺼운 큰길
const ROAD_MEDIUM = 6; // 단지 안 보통 도로
const ROAD_NARROW = 3.5; // 가늘게 칠해진 좁은 길(차선 없음)
// 2026-11-21 갱신: 금호파크힐스 단지 주변(위 네 상수로 폭을 정하던 구간 중 old raw 기준
// x:-460~160, z:-260~300 범위)은 img/base_naver_map.png에서 도로 색(건물·공원·하천보다
// 밝은 회백색) 영역을 직접 뽑아 거리변환(distance transform)으로 중심선을 다시 스냅하고
// 그 자리의 실제 폭을 재서 width에 숫자로 직접 박아 넣었다 — 그래서 이 구간 segment들은
// ROAD_MAJOR 같은 상수 대신 raw 숫자를 쓴다. 범위 밖(행당한진타운·행당대림아파트 등 이
// 지도 사진에 없는 구역)은 기존 값 그대로 뒀다.
const ROAD_SEGMENTS = [
  { a: [646.4, -430.4], b: [566.4, -379.2], width: ROAD_MAJOR },
  { a: [-52.8, -428.8], b: [-67.2, -348.8], width: ROAD_MEDIUM },
  { a: [-49.6, -428.8], b: [-30.4, -420.8], width: ROAD_MEDIUM },
  { a: [-30.4, -420.8], b: [6.4, -380.8], width: ROAD_MEDIUM },
  { a: [398.4, -428.8], b: [177.6, -296.0], width: ROAD_MEDIUM },
  { a: [177.6, -296.0], b: [160.0, -297.6], width: ROAD_MEDIUM },
  { a: [160.0, -297.6], b: [152.0, -316.8], width: ROAD_MEDIUM },
  { a: [152.0, -316.8], b: [147.2, -363.2], width: ROAD_MEDIUM },
  { a: [147.2, -363.2], b: [156.8, -424.0], width: ROAD_MEDIUM },
  { a: [72.0, -424.0], b: [72.0, -377.6], width: ROAD_MAJOR },
  { a: [523.2, -424.0], b: [553.6, -379.2], width: ROAD_MEDIUM },
  { a: [8.0, -380.8], b: [70.4, -377.6], width: ROAD_MEDIUM },
  { a: [6.4, -379.2], b: [6.4, -323.2], width: ROAD_MEDIUM },
  { a: [6.4, -323.2], b: [-17.6, -289.6], width: ROAD_MEDIUM },
  { a: [-17.6, -289.6], b: [-22.4, -251.2], width: ROAD_MEDIUM },
  { a: [555.2, -379.2], b: [566.4, -379.2], width: ROAD_MAJOR },
  { a: [566.4, -379.2], b: [635.2, -272.0], width: ROAD_MEDIUM },
  { a: [553.6, -377.6], b: [326.4, -238.4], width: ROAD_MAJOR },
  { a: [72.0, -376.0], b: [70.4, -251.2], width: ROAD_MAJOR },
  { a: [-68.8, -348.8], b: [-76.8, -347.2], width: ROAD_NARROW },
  { a: [-76.8, -347.2], b: [-70.4, -342.4], width: ROAD_NARROW },
  { a: [-68.8, -340.8], b: [-70.4, -238.4], width: ROAD_MEDIUM },
  { a: [740.8, -329.6], b: [635.2, -272.0], width: ROAD_MEDIUM },
  { a: [-200.0, -312.0], b: [-232.0, -289.6], width: ROAD_MEDIUM },
  { a: [-232.0, -289.6], b: [-216.0, -251.2], width: ROAD_MEDIUM },
  { a: [740.8, -273.6], b: [659.2, -220.8], width: ROAD_MEDIUM },
  { a: [-169.6, -272.0], b: [-212.8, -251.2], width: ROAD_MEDIUM },
  { a: [635.2, -272.0], b: [400.0, -120.0], width: ROAD_MEDIUM },
  { a: [73.2, -242.8], b: [-28.0, -241.3], width: 15.8 },
  { a: [-28.0, -241.3], b: [-81.1, -233.3], width: 13.4 },
  { a: [73.2, -242.8], b: [80.5, -199.8], width: 29.9 },
  { a: [-226.7, -258.8], b: [-252.9, -217.3], width: 10.2 },
  { a: [-212.9, -255.2], b: [-191.0, -191.1], width: 18.7 },
  { a: [-81.1, -233.3], b: [-55.6, -189.6], width: 26.2 },
  { a: [324.8, -236.8], b: [163.2, -184.0], width: ROAD_MAJOR },
  { a: [326.4, -236.8], b: [398.4, -120.0], width: ROAD_MEDIUM },
  { a: [657.6, -219.2], b: [475.2, -112.0], width: ROAD_MEDIUM },
  { a: [659.2, -219.2], b: [721.6, -108.8], width: ROAD_MEDIUM },
  { a: [78.3, -202.7], b: [-54.2, -191.1], width: 33.0 },
  { a: [80.5, -199.8], b: [86.3, -191.1], width: 33.3 },
  { a: [-71.6, -188.9], b: [-189.6, -191.1], width: 30.4 },
  { a: [-68.7, -187.5], b: [-57.1, -188.9], width: 32.3 },
  { a: [-70.2, -188.2], b: [-71.6, -135.8], width: 15.1 },
  { a: [-71.6, -135.8], b: [-38.9, -113.2], width: 18.7 },
  { a: [-38.9, -113.2], b: [-23.6, -63.7], width: 23.0 },
  { a: [-23.6, -63.7], b: [-32.3, -44.0], width: 19.0 },
  { a: [-32.3, -44.0], b: [-116.0, 50.6], width: 14.7 },
  { a: [-116.0, 50.6], b: [-145.2, 89.2], width: 20.0 },
  { a: [-145.2, 89.2], b: [-159.0, 91.4], width: 27.7 },
  { a: [-159.0, 91.4], b: [-330.8, 92.1], width: 17.3 },
  { a: [-330.8, 92.1], b: [-370.8, 129.9], width: 23.8 },
  { a: [-370.8, 129.9], b: [-408.7, 156.2], width: 28.6 },
  { a: [-191.0, -191.1], b: [-250.0, -181.6], width: 22.3 },
  { a: [-250.0, -181.6], b: [-274.7, -148.9], width: 24.8 },
  { a: [-274.7, -148.9], b: [-295.9, -124.9], width: 20.4 },
  { a: [-295.9, -124.9], b: [-305.3, -51.3], width: 18.9 },
  { a: [-305.3, -51.3], b: [-340.3, -32.4], width: 14.4 },
  { a: [-340.3, -32.4], b: [-392.7, -21.5], width: 11.4 },
  { a: [-382.4, -11.2], b: [-512.0, -9.6], width: ROAD_MAJOR },
  { a: [161.6, -184.0], b: [126.4, -177.6], width: ROAD_MAJOR },
  { a: [163.2, -182.4], b: [196.8, -105.6], width: ROAD_MEDIUM },
  { a: [196.8, -105.6], b: [222.4, -76.8], width: ROAD_MEDIUM },
  { a: [222.4, -76.8], b: [416.0, 16.0], width: ROAD_MEDIUM },
  { a: [88.5, -189.6], b: [132.2, -188.2], width: 27.3 },
  { a: [86.3, -188.2], b: [79.8, -117.6], width: 21.2 },
  { a: [131.5, -186.7], b: [148.2, -92.1], width: 20.5 },
  { a: [396.8, -118.4], b: [368.0, -100.8], width: ROAD_MEDIUM },
  { a: [400.0, -118.4], b: [430.4, -78.4], width: ROAD_MEDIUM },
  { a: [430.4, -78.4], b: [515.2, -56.0], width: ROAD_MEDIUM },
  { a: [515.2, -56.0], b: [564.8, -56.0], width: ROAD_MEDIUM },
  { a: [564.8, -56.0], b: [721.6, -107.2], width: ROAD_MEDIUM },
  { a: [740.8, -110.4], b: [723.2, -107.2], width: ROAD_MEDIUM },
  { a: [79.8, -117.6], b: [63.8, -53.5], width: 31.6 },
  { a: [79.8, -117.6], b: [96.5, -93.5], width: 19.7 },
  { a: [96.5, -93.5], b: [100.2, 12.0], width: 13.6 },
  { a: [100.2, 12.0], b: [118.4, 64.4], width: 10.8 },
  { a: [118.4, 64.4], b: [100.9, 222.4], width: 19.5 },
  { a: [142.4, -80.0], b: [244.8, -40.0], width: ROAD_MEDIUM },
  { a: [244.8, -40.0], b: [292.8, -6.4], width: ROAD_MEDIUM },
  { a: [292.8, -6.4], b: [294.4, 49.6], width: ROAD_MEDIUM },
  { a: [294.4, 49.6], b: [358.4, 108.8], width: ROAD_MEDIUM },
  { a: [358.4, 108.8], b: [372.8, 179.2], width: ROAD_MEDIUM },
  { a: [148.2, -89.2], b: [114.7, -11.3], width: 10.7 },
  { a: [114.7, -11.3], b: [138.8, 60.1], width: 10.3 },
  { a: [138.8, 60.1], b: [148.9, 138.0], width: 12.1 },
  { a: [740.8, -68.8], b: [684.8, -73.6], width: ROAD_MEDIUM },
  { a: [684.8, -73.6], b: [416.0, 16.0], width: ROAD_MEDIUM },
  { a: [63.8, -53.5], b: [36.8, -55.7], width: 26.7 },
  { a: [63.8, -53.5], b: [49.9, 75.3], width: 34.2 },
  { a: [416.0, 16.0], b: [441.6, 145.6], width: ROAD_MEDIUM },
  { a: [441.6, 145.6], b: [510.4, 208.0], width: ROAD_MEDIUM },
  { a: [510.4, 208.0], b: [553.6, 300.8], width: ROAD_MEDIUM },
  { a: [50.7, 76.8], b: [51.4, 80.4], width: 31.4 },
  { a: [51.4, 80.4], b: [51.4, 85.5], width: 30.4 },
  { a: [51.4, 85.5], b: [58.7, 95.0], width: 24.8 },
  { a: [50.7, 76.8], b: [56.5, 85.5], width: 31.4 },
  { a: [56.5, 85.5], b: [58.7, 93.5], width: 28.0 },
  { a: [-512.0, 86.4], b: [-427.2, 168.0], width: ROAD_MAJOR },
  { a: [58.7, 95.0], b: [39.0, 131.4], width: 16.7 },
  { a: [39.0, 131.4], b: [57.2, 142.3], width: 24.3 },
  { a: [58.7, 107.4], b: [57.2, 142.3], width: 28.1 },
  { a: [140.8, 129.6], b: [300.8, 198.4], width: ROAD_MEDIUM },
  { a: [300.8, 198.4], b: [371.2, 180.8], width: ROAD_MEDIUM },
  { a: [127.8, 132.1], b: [122.0, 224.6], width: 11.2 },
  { a: [132.8, 214.4], b: [168.0, 244.8], width: ROAD_MEDIUM },
  { a: [57.2, 142.3], b: [78.3, 210.8], width: 20.0 },
  { a: [78.3, 210.8], b: [104.5, 237.7], width: 33.8 },
  { a: [-436.4, 177.3], b: [-410.9, 157.6], width: 15.1 },
  { a: [-427.2, 168.0], b: [-508.8, 235.2], width: ROAD_MEDIUM },
  { a: [-413.8, 159.1], b: [-363.6, 207.1], width: 14.5 },
  { a: [-363.6, 207.1], b: [-153.2, 248.6], width: 18.0 },
  { a: [-153.2, 248.6], b: [-68.7, 285.7], width: 17.4 },
  { a: [-78.4, 291.2], b: [-64.0, 307.2], width: ROAD_MAJOR },
  { a: [372.8, 180.8], b: [384.0, 284.8], width: ROAD_MEDIUM },
  { a: [100.9, 222.4], b: [104.5, 237.7], width: 38.9 },
  { a: [-510.4, 236.8], b: [-510.4, 243.2], width: ROAD_WIDE },
  { a: [-508.8, 244.8], b: [-435.2, 312.0], width: ROAD_MEDIUM },
  { a: [171.2, 244.8], b: [203.2, 264.0], width: ROAD_MEDIUM },
  { a: [203.2, 264.0], b: [190.4, 305.6], width: ROAD_MEDIUM },
  { a: [190.4, 305.6], b: [179.2, 312.0], width: ROAD_MEDIUM },
  { a: [-512.0, 246.4], b: [-512.0, 300.8], width: ROAD_MEDIUM },
  { a: [169.6, 246.4], b: [177.6, 312.0], width: ROAD_MEDIUM },
  { a: [105.3, 239.1], b: [114.7, 289.4], width: 25.9 },
  { a: [114.7, 289.4], b: [114.7, 289.4], width: 29.4 },
  { a: [105.6, 284.8], b: [108.8, 300.8], width: ROAD_MAJOR },
  { a: [382.4, 286.4], b: [369.6, 300.8], width: ROAD_MEDIUM },
  { a: [384.0, 286.4], b: [388.8, 300.8], width: ROAD_MEDIUM },
  { a: [124.8, 292.8], b: [131.2, 300.8], width: ROAD_MEDIUM },
  { a: [-62.4, 308.8], b: [-43.2, 312.0], width: ROAD_MAJOR },
];

const AREA_MARGIN = 8;
// 도로가 건물보다 더 넓게 뻗어 있는 구간(예: 롯데마트 너머)도 있어서, 바닥·이동범위는 건물과
// 도로 좌표를 모두 합쳐서 계산한다
const ALL_COORD_XS = [...PLACES.map((p) => p.x), ...ROAD_SEGMENTS.flatMap((s) => [s.a[0], s.b[0]])];
const ALL_COORD_ZS = [...PLACES.map((p) => p.z), ...ROAD_SEGMENTS.flatMap((s) => [s.a[1], s.b[1]])];
const AREA_MIN_X = Math.min(...ALL_COORD_XS) * WORLD_SCALE - AREA_MARGIN;
const AREA_MAX_X = Math.max(...ALL_COORD_XS) * WORLD_SCALE + AREA_MARGIN;
const AREA_MIN_Z = Math.min(...ALL_COORD_ZS) * WORLD_SCALE - AREA_MARGIN;
const AREA_MAX_Z = Math.max(...ALL_COORD_ZS) * WORLD_SCALE + AREA_MARGIN;

const ITEM_COUNT = 10;
const ENEMY_COUNT = 5;
const PICKUP_RADIUS = 1.7;
const ITEM_REWARD_MIN = 500;
const ITEM_REWARD_MAX = 1500;
const ENEMY_REWARD_MIN = 1000;
const ENEMY_REWARD_MAX = 3000;

let renderer, scene, camera, clock, mixer, character;
let actions = {};
let currentAction = null;
let rafId = null;
let ready = false;
let loading = false;
let canvasEl, loadingEl, danceBtnEl, walkBtnEl, runBtnEl, jumpBtnEl, momBtnEl, hudEl, toastEl, resetBtnEl, dpadEl;
let mom = null;
let momMixer = null;
let momActions = {};
let momLoading = false;
// 엄마 심부름(main.js의 runMomErrand)과 주고받는 상태 — phase: "toStore"|"awaitingDialog"|"toHome"
let currentErrand = null;
const placeHighlights = {}; // place.id -> 목적지 표시용 파란 점멸 스프라이트
const keys = { up: false, down: false, left: false, right: false };
let moveMode = "walk"; // "walk" | "run"
let dancing = false;
let danceLoaded = false;
let jumping = false;
let toastTimer = null;

let items = [];
let enemies = [];

// ── 카메라: 캐릭터를 중심으로 도는 궤도(드래그로 회전, 휠로 확대/축소) ──
let camYaw = 0;
let camPitch = 0.4;
let camDistance = 6;
// 위아래 시선: 아래(-)부터 위(+)까지 거의 전 범위(±83°). 정확히 ±90°는 카메라가 뒤집혀서 피한다
const CAM_PITCH_MIN = -1.45;
const CAM_PITCH_MAX = 1.45;
const CAM_LOOK_Y = 0.6; // 시선 높이(캐릭터 머리 쪽)
const CHAR_SCALE = 0.5; // 이로이·엄마는 원래의 절반 크기 — 건물이 상대적으로 크게 보이도록
const CAM_DIST_MIN = 1.5;
const CAM_DIST_MAX = 40;
let dragging = false;
let lastPointer = { x: 0, y: 0 };

function isNeighborhoodViewActive() {
  return document.getElementById("main-view")?.dataset.view === "neighborhood";
}
function rand(min, max) {
  return min + Math.random() * (max - min);
}
function randStep100(min, max) {
  return Math.round(rand(min, max) / 100) * 100;
}

window.addEventListener("keydown", (ev) => {
  if (!isNeighborhoodViewActive()) return;
  const dir = KEY_DIR[ev.key];
  if (!dir && ev.key !== " ") return;
  ev.preventDefault();
  // 화면의 어떤 버튼이 포커스를 들고 있으면 스페이스/방향키가 그 버튼을 다시 누르는 걸로
  // 처리될 수 있어서, 움직이거나 점프하기 전에 포커스를 뺀다
  if (document.activeElement?.tagName === "BUTTON") document.activeElement.blur();
  if (dir) {
    keys[dir] = true;
    return;
  }
  triggerJump();
});
window.addEventListener("keyup", (ev) => {
  const dir = KEY_DIR[ev.key];
  if (dir) keys[dir] = false;
});

// ── 글씨 라벨(간판·이름표) — 캔버스에 그려서 늘 카메라를 보는 스프라이트로 띄운다 ──
// 기본 sizeAttenuation(원근에 따라 커짐)만 쓰면 가까이 다가갈수록 한없이 커져서, 상단 동전·불량배
// 표시(HUD)의 글자 크기(14px)를 최대치로 두고 그보다 커지지 않게 화면 픽셀 기준으로 직접 계산해 준다.
// 심부름 목적지를 표시할 둥근 파란 광원 텍스처(한 번만 만들어서 재사용)
let _highlightTexture = null;
function highlightTexture() {
  if (_highlightTexture) return _highlightTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.5, "rgba(120,200,255,0.8)");
  grad.addColorStop(1, "rgba(120,200,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  _highlightTexture = new THREE.CanvasTexture(canvas);
  return _highlightTexture;
}

const labelTextureCache = {};
const allLabelSprites = [];
const LABEL_FONT_SIZE = 46; // 캔버스에 그리는 실제 글자 크기(px) — 아래 padY와 함께 캔버스 전체 높이를 이룬다
const LABEL_PAD_Y = 14;
const LABEL_TARGET_FONT_PX = 14; // 화면에 보일 때 글자 높이의 목표 픽셀 크기 — HUD의 font-size:14px과 맞춘다
// 행당동 쪽 건물이 늘면서 라벨이 지도에 너무 많이 쌓이고, 실제 glb도 전부 한꺼번에 불러오면
// 버벅여서, 둘 다 캐릭터와 가까운(약 300m) 곳만 — 라벨은 보이게, glb는 그때 가서 불러오게 —
// 바꿨다. 300m는 실측 미터라 WORLD_SCALE을 곱해 둔다.
const VISIBLE_RANGE_M = 300;
const LABEL_VISIBLE_RANGE = VISIBLE_RANGE_M * WORLD_SCALE;
function makeLabelSprite(text, scale = 0.05) {
  if (!labelTextureCache[text]) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fontSize = LABEL_FONT_SIZE;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const padX = 20;
    const padY = LABEL_PAD_Y;
    canvas.width = Math.ceil(ctx.measureText(text).width) + padX * 2;
    canvas.height = fontSize + padY * 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = "rgba(30, 30, 35, 0.72)";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(0, 0, canvas.width, canvas.height, 14);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    labelTextureCache[text] = { texture, w: canvas.width, h: canvas.height };
  }
  const { texture, w, h } = labelTextureCache[text];
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, sizeAttenuation: false }));
  sprite.userData.baseW = w * scale;
  sprite.userData.baseH = h * scale;
  sprite.scale.set(sprite.userData.baseW, sprite.userData.baseH, 1);
  sprite.renderOrder = 999;
  allLabelSprites.push(sprite);
  return sprite;
}

// sizeAttenuation을 꺼 뒀으니(그래야 최대 크기를 우리가 정할 수 있다) 매 프레임 두 가지 크기를 비교해서
// 더 작은 쪽을 쓴다 — ① 멀어지면 거리에 비례해 작아지는 원래 sizeAttenuation과 같은 크기, ② 화면에서
// 글자 높이가 LABEL_TARGET_FONT_PX(=HUD의 font-size:14px)를 넘지 않는 크기. 그래서 멀리서는 자연스럽게
// 작아지고, 아무리 가까이 가도 HUD 글자 크기 이상으로는 커지지 않는다.
function updateLabelScales() {
  if (!camera || !canvasEl) return;
  const canvasH = canvasEl.clientHeight || 1;
  const halfFovRad = (camera.fov / 2) * (Math.PI / 180);
  // scale.y 값이 이것일 때 화면에 LABEL_TARGET_FONT_PX만큼의 "전체 배지 높이"로 보인다
  // (목표는 글자 크기 14px이고, 배지 전체 높이는 캔버스에서 글자가 차지하는 비율만큼 더 크다)
  const badgeTargetPx = LABEL_TARGET_FONT_PX * ((LABEL_FONT_SIZE + LABEL_PAD_Y * 2) / LABEL_FONT_SIZE);
  const targetScaleY = (badgeTargetPx * 2 * Math.tan(halfFovRad)) / canvasH;
  allLabelSprites.forEach((sprite) => {
    const dist = Math.max(sprite.position.distanceTo(camera.position), 0.01);
    const capFactor = targetScaleY / sprite.userData.baseH;
    const factor = Math.min(1 / dist, capFactor);
    sprite.scale.set(sprite.userData.baseW * factor, sprite.userData.baseH * factor, 1);
  });
}

// 지금 심부름 목적지로 지정된 장소 id 목록 — 이 목록에 있으면 라벨도, 건물(아래
// updatePlaceVisibility)도 거리와 상관없이 항상 보인다.
function missionActiveIds() {
  const activeIds = new Set();
  if (currentErrand?.phase === "toStore") currentErrand.storeIds.forEach((id) => activeIds.add(id));
  else if (currentErrand?.phase === "toHome") activeIds.add(0);
  return activeIds;
}

// 장소 라벨은 캐릭터와 LABEL_VISIBLE_RANGE(약 300m) 안에 있거나, 지금 심부름 목적지로 지정된
// 곳일 때만 보인다 — placeId가 없는 라벨(불량배 이름표 등)은 건드리지 않는다.
function updateLabelVisibility() {
  if (!character) return;
  const activeIds = missionActiveIds();
  const cp = character.position;
  allLabelSprites.forEach((sprite) => {
    const placeId = sprite.userData.placeId;
    if (placeId == null) return;
    if (activeIds.has(placeId)) {
      sprite.visible = true;
      return;
    }
    const dx = cp.x - sprite.position.x;
    const dz = cp.z - sprite.position.z;
    sprite.visible = Math.hypot(dx, dz) <= LABEL_VISIBLE_RANGE;
  });
}

// 건물 자체(플레이스홀더/실제 glb/교회 첨탑 등을 담은 group)도 라벨과 같은 기준으로
// 보이기/숨기기를 한다 — 심부름 목적지는 멀어도 건물과 이름이 계속 보여야 길을 찾을 수 있다.
function updatePlaceVisibility() {
  if (!character) return;
  const activeIds = missionActiveIds();
  const cp = character.position;
  const inRange = (px, pz, id) => activeIds.has(id) || Math.hypot(cp.x - px, cp.z - pz) <= LABEL_VISIBLE_RANGE;
  placeVisibilityEntries.forEach((e) => {
    e.group.visible = inRange(e.px, e.pz, e.place.id);
  });
  modelStreamEntries.forEach((entry) => {
    entry.inRange = inRange(entry.px, entry.pz, entry.place.id);
    entry.group.visible = entry.inRange;
  });
}

function buildStaticScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe3ff);
  scene.fog = new THREE.Fog(0xbfe3ff, 20, 180);

  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8d9a7a, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(20, 30, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, far: 200 });
  scene.add(sun);

  // 동네 전체를 덮는 잔디 바닥 — 건물들이 차지하는 영역(AREA_MIN/MAX)보다 넉넉하게 깐다
  const groundW = AREA_MAX_X - AREA_MIN_X;
  const groundD = AREA_MAX_Z - AREA_MIN_Z;
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(groundW, groundD),
    new THREE.MeshStandardMaterial({ color: 0x8fbf72 })
  );
  bg.rotation.x = -Math.PI / 2;
  bg.position.set((AREA_MIN_X + AREA_MAX_X) / 2, -0.03, (AREA_MIN_Z + AREA_MAX_Z) / 2);
  bg.receiveShadow = true;
  scene.add(bg);

  // 네이버 지도 이미지를 실제 좌표에 맞춰 바닥에 깐다(없으면 위의 초록 바닥이 그대로 보임)
  buildMapGround(scene);

  // 각 건물 사이에 깔린 회색 보행로 — 지도 이미지가 보이도록 숨긴다
  const plaza = new THREE.Mesh(
    new THREE.PlaneGeometry(groundW * 0.6, groundD * 0.6),
    new THREE.MeshStandardMaterial({ color: 0xc7c7c2 })
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set((AREA_MIN_X + AREA_MAX_X) / 2, -0.02, (AREA_MIN_Z + AREA_MAX_Z) / 2);
  plaza.receiveShadow = true;
  plaza.visible = false;
  scene.add(plaza);

  buildRoads();
  buildPlaces();
  buildTrees();
}

// ── 지도 바닥: img/base_naver_map.png(3288×2134)를 실제 위치에 맞춰 깐다 ──
// 이미지 우하단의 50m 축척자(149px)로 구한 실측 축척(약 0.336m/px)은 PLACES/ROAD_SEGMENTS가 쓰는
// raw 좌표계와는 맞지 않는다 — 그 좌표들도 결국 다른(예전) 지도 스크린샷을 "눈대중"으로 환산한 값이라
// 실제 축척과는 어긋나 있기 때문. 그래서 raw 좌표를 이미 알고 있는 두 지점(113동=우리집 raw(0,0),
// 금호119안전센터 raw(16,83))과 멀리 떨어진 롯데마트행당점 raw(654,-352)을 이 이미지에서 직접 찾아
// 픽셀 좌표를 읽고, 그 세 점으로 축척·회전을 역산했다(회전은 약 1.75도로 무시할 수준이라 0으로 둠).
// 이렇게 구한 축척으로 금호고등학교 위치를 역산해 봤더니 이미지 속 실제 학교 자리와 정확히 들어맞아
// 검증됐다. 이미지 파일을 바꾸면 anchorPx(113동이 찍힌 픽셀 좌표)와 scale도 다시 구해야 한다.
const MAP_IMAGE = {
  file: "img/base_naver_map.png",
  width: 3288,
  height: 2134,
  scale: 0.728, // raw 단위 / 이미지 px
  anchorPx: { x: 1339.4, y: 1381.5 }, // 주황색으로 칠해진 113동(우리집, raw 0,0)의 이미지 픽셀 좌표
};
function buildMapGround(scene) {
  new THREE.TextureLoader().load(
    `${MAP_IMAGE.file}?v=${ASSET_VERSION}`,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const { width, height, scale, anchorPx } = MAP_IMAGE;
      const w = width * scale * WORLD_SCALE;
      const h = height * scale * WORLD_SCALE;
      // 이미지 중심이 anchorPx(113동)에서 얼마나 떨어져 있는지로 바닥 메시의 중심 위치를 정한다
      const cx = (width / 2 - anchorPx.x) * scale * WORLD_SCALE;
      const cz = (height / 2 - anchorPx.y) * scale * WORLD_SCALE;
      const geo = new THREE.PlaneGeometry(w, h);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
      mesh.position.set(cx, -0.025, cz);
      mesh.receiveShadow = true;
      scene.add(mesh);
    },
    undefined,
    () => console.warn("지도 바닥 이미지를 불러오지 못했다")
  );
}

// 금호파크힐스 단지 내부 공터에 나무를 심는다 — 나무가 많아서(170여 그루) 개별 메시로 만들면
// 도로 차선처럼 드로우콜이 급격히 늘어나니, 줄기·수관을 각각 InstancedMesh 하나씩으로 그린다.
function buildTrees() {
  if (!TREE_SPOTS.length) return;
  const trunkGeo = new THREE.CylinderGeometry(0.35 * WORLD_SCALE, 0.45 * WORLD_SCALE, 3 * WORLD_SCALE, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a30 });
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, TREE_SPOTS.length);
  const foliageGeo = new THREE.ConeGeometry(2.4 * WORLD_SCALE, 4.6 * WORLD_SCALE, 7);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3f7a3f });
  const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, TREE_SPOTS.length);
  const dummy = new THREE.Object3D();
  TREE_SPOTS.forEach(([rawX, rawZ], i) => {
    const x = rawX * WORLD_SCALE;
    const z = rawZ * WORLD_SCALE;
    const scale = 0.85 + ((i * 37) % 30) / 100; // 170여 그루가 전부 같은 크기면 부자연스러워서 자리마다 살짝 다르게
    dummy.scale.setScalar(scale);
    dummy.rotation.y = (i * 2.4) % (Math.PI * 2);
    dummy.position.set(x, 1.5 * WORLD_SCALE * scale, z); // 줄기 밑동이 땅(y=0)에 닿도록 중심을 절반 높이만큼 띄운다
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 3 * WORLD_SCALE * scale + 2.3 * WORLD_SCALE * scale; // 줄기 꼭대기 위에 수관(원뿔)을 얹는다
    dummy.updateMatrix();
    foliageInst.setMatrixAt(i, dummy.matrix);
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  foliageInst.instanceMatrix.needsUpdate = true;
  trunkInst.castShadow = true;
  foliageInst.castShadow = true;
  scene.add(trunkInst, foliageInst);
}

// 차선 점선은 도로가 많아지니 개별 메시로 그리면 수백 개가 생겨서(실측 500개+) 프레임이 뚝 떨어진다.
// 그래서 위치만 모아 뒀다가 InstancedMesh 하나로 한 번에 그린다(드로우콜 1개).
let dashTransforms = [];

function buildRoadSegment({ a, b, width }) {
  const x1 = a[0] * WORLD_SCALE;
  const z1 = a[1] * WORLD_SCALE;
  const x2 = b[0] * WORLD_SCALE;
  const z2 = b[1] * WORLD_SCALE;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const roadW = width * WORLD_SCALE;

  const geo = new THREE.PlaneGeometry(roadW, len);
  geo.rotateX(-Math.PI / 2); // 바닥에 눕히는 회전을 지오메트리 자체에 구워 둬서, 메시 회전은 방향(Y축)만 다루면 되게 한다
  const road = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x4a4a4e }));
  road.rotation.y = yaw;
  road.position.set(midX, 0.005, midZ);
  road.receiveShadow = true;
  scene.add(road);

  // 골목(ROAD_NARROW)은 차선이 없고, 보통길은 중앙에 점선 차선 1줄, 큰길은 2줄, 난계로·사거리의
  // 간선도로(ROAD_MAJOR, 가장 두껍게 칠해져 있던 구간)는 왕복 차로가 가장 넓은 도로라는 걸 보여주려고
  // 차선을 3줄(중앙 + 양쪽)로 그려 넣는다
  if (width === ROAD_NARROW) return;
  const dashLen = 3 * WORLD_SCALE;
  const gapLen = 3 * WORLD_SCALE;
  const step = dashLen + gapLen;
  const ux = dx / len;
  const uz = dz / len;
  const perpX = -uz;
  const perpZ = ux;
  let lineOffsets = [0];
  if (width === ROAD_WIDE) lineOffsets = [-roadW * 0.15, roadW * 0.15];
  else if (width === ROAD_MAJOR) lineOffsets = [-roadW * 0.22, 0, roadW * 0.22];
  lineOffsets.forEach((offset) => {
    for (let d = step / 2; d < len; d += step) {
      dashTransforms.push({
        x: x1 + (dx * d) / len + perpX * offset,
        z: z1 + (dz * d) / len + perpZ * offset,
        yaw,
      });
    }
  });
}

function buildLaneDashes() {
  if (!dashTransforms.length) return;
  const dashLen = 3 * WORLD_SCALE;
  const dashGeo = new THREE.PlaneGeometry(0.18 * WORLD_SCALE, dashLen);
  dashGeo.rotateX(-Math.PI / 2);
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xf5e8b0 });
  const inst = new THREE.InstancedMesh(dashGeo, laneMat, dashTransforms.length);
  const dummy = new THREE.Object3D();
  dashTransforms.forEach((t, i) => {
    dummy.position.set(t.x, 0.01, t.z);
    dummy.rotation.set(0, t.yaw, 0);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  });
  inst.instanceMatrix.needsUpdate = true;
  scene.add(inst);
}

// 구간을 따로따로 그리면 꺾이는 지점마다 바깥쪽에 틈이 생겨서 끊겨 보인다 — 같은 지점에서
// 만나는 구간들 중 제일 넓은 폭으로 둥근 판을 하나 더 깔아서 이음매를 자연스럽게 메운다
function buildJunctionFillers() {
  const endpoints = [];
  ROAD_SEGMENTS.forEach((seg) => {
    endpoints.push({ x: seg.a[0], z: seg.a[1], width: seg.width });
    endpoints.push({ x: seg.b[0], z: seg.b[1], width: seg.width });
  });
  const THRESH = 14; // raw 단위(이미지 추출 과정에서 생기는 좌표 오차를 흡수 — 전보다 넉넉하게)
  const used = new Array(endpoints.length).fill(false);
  for (let i = 0; i < endpoints.length; i++) {
    if (used[i]) continue;
    const group = [endpoints[i]];
    used[i] = true;
    for (let j = i + 1; j < endpoints.length; j++) {
      if (used[j]) continue;
      if (Math.hypot(endpoints[i].x - endpoints[j].x, endpoints[i].z - endpoints[j].z) < THRESH) {
        group.push(endpoints[j]);
        used[j] = true;
      }
    }
    if (group.length < 2) continue; // 혼자인 끝점(막다른 길)은 메울 필요 없다
    const rawCx = group.reduce((s, p) => s + p.x, 0) / group.length;
    const rawCz = group.reduce((s, p) => s + p.z, 0) / group.length;
    const maxWidth = Math.max(...group.map((p) => p.width));
    // 묶인 끝점들이 중심에서 떨어진 거리까지 넉넉히 덮도록(각도가 예리한 모서리에서도 안 뚫리게)
    const maxSpread = Math.max(...group.map((p) => Math.hypot(p.x - rawCx, p.z - rawCz)));
    const radius = (Math.max(maxWidth / 2, maxSpread) + maxWidth * 0.25) * WORLD_SCALE;
    const geo = new THREE.CircleGeometry(radius, 20);
    geo.rotateX(-Math.PI / 2);
    const filler = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x4a4a4e }));
    filler.position.set(rawCx * WORLD_SCALE, 0.006, rawCz * WORLD_SCALE);
    filler.receiveShadow = true;
    scene.add(filler);
  }
}

function buildRoads() {
  dashTransforms = [];
  ROAD_SEGMENTS.forEach(buildRoadSegment);
  buildLaneDashes();
  buildJunctionFillers();
}

// 금호파크힐스 동들은 대부분 실제 3D 모델(loadPlaceModel)을 쓰지만, 모델이 없는 동(예: 117동)은
// 이 스타일화 매싱으로 대신한다 — 동 번호 짝/홀수로 두 템플릿을 번갈아 적용해 타워 여러 개를
// 높이 다르게 붙이고 저층부는 어둡게, 상층부는 주황/베이지 투톤으로 나눠서 단지 느낌을 흉내낸다.
function addTowerBox(px, pz, offX, offZ, w, d, h, color, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
  mesh.position.set(px + offX, h / 2, pz + offZ);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// parent를 넘기면(모델이 있는 동의 임시 매싱용) scene에 바로 넣지 않고 그 그룹에 담아서
// 나중에 실제 glb가 로드되면 그룹째로 숨길 수 있게 한다.
function buildApartmentCluster(place, px, pz, floors, parent = scene) {
  const baseH = Math.max(0.6, Math.min(floors, 6) * 3 * WORLD_SCALE);
  const BASE_COLOR = 0x3a3a40;
  addTowerBox(px, pz, 0, 0, 20 * WORLD_SCALE, 12 * WORLD_SCALE, baseH, BASE_COLOR, parent);

  const useTemplateA = place.home || place.id % 2 === 1;
  let topHeight;
  if (useTemplateA) {
    // 113동 스타일: 메인 타워(정면 색) + 뒤쪽 보조 타워(크림) + 더 높은 첨탑(연회색)
    const mainColor = place.home ? 0xff6fa0 : 0xd98a4a;
    const mainH = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 3 * WORLD_SCALE);
    const sideH = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 2.4 * WORLD_SCALE);
    const spireH = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 3.3 * WORLD_SCALE);
    addTowerBox(px, pz, -4 * WORLD_SCALE, -1 * WORLD_SCALE, 9 * WORLD_SCALE, 9 * WORLD_SCALE, mainH, mainColor, parent);
    addTowerBox(px, pz, 3 * WORLD_SCALE, 2 * WORLD_SCALE, 8 * WORLD_SCALE, 7 * WORLD_SCALE, sideH, 0xe8e2d0, parent);
    addTowerBox(px, pz, 6 * WORLD_SCALE, -3 * WORLD_SCALE, 5 * WORLD_SCALE, 5 * WORLD_SCALE, spireH, 0xcfd0d2, parent);
    topHeight = Math.max(mainH, sideH, spireH);
  } else {
    // 106동 스타일: 비슷한 높이의 타워 3개를 나란히(주황-크림-주황)
    const h1 = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 2.9 * WORLD_SCALE);
    const h2 = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 2.6 * WORLD_SCALE);
    const h3 = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 3 * WORLD_SCALE);
    addTowerBox(px, pz, -6 * WORLD_SCALE, 0, 7 * WORLD_SCALE, 9 * WORLD_SCALE, h1, 0xd98a4a, parent);
    addTowerBox(px, pz, 0, 0, 7 * WORLD_SCALE, 9 * WORLD_SCALE, h2, 0xe8e2d0, parent);
    addTowerBox(px, pz, 6 * WORLD_SCALE, 0, 7 * WORLD_SCALE, 9 * WORLD_SCALE, h3, 0xd98a4a, parent);
    topHeight = Math.max(h1, h2, h3);
  }
  return topHeight;
}

// 동네가 넓어지면서(행당한진타운·행당대림아파트 등) glb를 전부 한꺼번에 불러오면 버벅여서, 실제
// 모델은 캐릭터가 MODEL_LOAD_RANGE(300m) 안에 들어왔을 때만 불러오고, MODEL_UNLOAD_RANGE 밖으로
// 나가면 다시 지워서 메모리를 돌려준다. 두 거리 사이에 여유를 둔 건 경계에서 왔다 갔다 할 때마다
// 불러오고 지우기를 반복하지 않게 하는 히스테리시스다. 로딩 전/지워진 동안은 건물이 아예 안 보이면
// 어색하니, 모델 없는 동과 같은 임시 매싱(placeholder)을 세워 두고 모델이 뜨면 숨긴다.
const MODEL_LOAD_RANGE = LABEL_VISIBLE_RANGE;
const MODEL_UNLOAD_RANGE = MODEL_LOAD_RANGE * 1.3;
const MODEL_STREAM_CHECK_INTERVAL = 0.4; // 매 프레임 전부 검사하면 낭비라 이 간격으로만 확인한다
const modelStreamEntries = []; // buildPlaces가 model이 있는 장소마다 하나씩 채운다
const placeVisibilityEntries = []; // model이 없는 장소(플레이스홀더만 있는 건물)의 group 목록
let modelStreamTimer = 0;

function disposeObject3D(obj) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry?.dispose();
    const materials = Array.isArray(o.material) ? o.material : [o.material];
    materials.forEach((mat) => {
      if (!mat) return;
      ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "bumpMap"].forEach((key) => mat[key]?.dispose());
      mat.dispose();
    });
  });
}

// 모델 자체의 단위가 PLACES 좌표와 같은 "실측 미터" 기준이라 WORLD_SCALE을 그대로 곱해서 쓰고,
// 모델이 세로 중심을 기준으로 만들어져 있어서(바닥이 y=0이 아님) 불러온 뒤 바운딩박스를 재서
// 바닥이 지면에 닿도록 보정한다. rotY는 사거리 대각선 배치(place.diagonal) 자리의 기본 회전값 —
// place.rotationDeg를 넣어 두면(모델마다 정면 방향이 다를 수 있어서) 그 값으로 덮어써 미세조정한다.
// place.scaleRatio(기본 1)는 실제 건물보다 작게/크게 모델링된 .glb를 지도 위 실측 크기에 맞춰
// 통째로 키우거나 줄이는 보정값이다 — WORLD_SCALE과 곱해져서 적용된다.
function loadPlaceModelInto(entry) {
  entry.loading = true;
  new GLTFLoader().load(
    `${entry.place.model}?v=${ASSET_VERSION}`,
    (gltf) => {
      entry.loading = false;
      // 로딩하는 동안 캐릭터가 다시 멀어졌으면 받아 둔 모델을 바로 버린다
      const curDist = character ? Math.hypot(character.position.x - entry.px, character.position.z - entry.pz) : Infinity;
      if (curDist > MODEL_UNLOAD_RANGE) return;
      const model = gltf.scene;
      model.scale.setScalar(WORLD_SCALE * (entry.place.scaleRatio ?? 1));
      model.position.set(entry.px, 0, entry.pz);
      model.rotation.y = entry.place.rotationDeg != null ? THREE.MathUtils.degToRad(entry.place.rotationDeg) : entry.rotY;
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      model.position.y -= box.min.y;
      entry.group.add(model);
      entry.loadedModel = model;
      if (entry.placeholder) entry.placeholder.visible = false;
    },
    undefined,
    (err) => {
      entry.loading = false;
      console.warn(`${entry.place.name} 모델을 못 불러왔다`, err);
    }
  );
}

function updateModelStreaming(dt) {
  if (!character || !modelStreamEntries.length) return;
  modelStreamTimer += dt;
  if (modelStreamTimer < MODEL_STREAM_CHECK_INTERVAL) return;
  modelStreamTimer = 0;
  const cp = character.position;
  modelStreamEntries.forEach((entry) => {
    const dist = Math.hypot(cp.x - entry.px, cp.z - entry.pz);
    if (dist <= MODEL_LOAD_RANGE) {
      if (!entry.loadedModel && !entry.loading) loadPlaceModelInto(entry);
    } else if (dist > MODEL_UNLOAD_RANGE && entry.loadedModel) {
      entry.group.remove(entry.loadedModel);
      disposeObject3D(entry.loadedModel);
      entry.loadedModel = null;
      if (entry.placeholder) entry.placeholder.visible = true;
    }
  });
}

function buildPlaces() {
  PLACES.forEach((place) => {
    const style = TYPE_STYLE[place.type] || TYPE_STYLE["기타"];
    const px = place.x * WORLD_SCALE;
    const pz = place.z * WORLD_SCALE;
    const w = style.w * WORLD_SCALE;
    const d = style.d * WORLD_SCALE;
    const floors = place.floors || 15;
    let height = Math.max(0.6, floors * 3 * WORLD_SCALE);
    const color = NAME_COLOR_OVERRIDE[place.name] ?? style.color;
    const rotY = place.diagonal ? Math.PI / 4 : 0;

    // 건물 자체(플레이스홀더·실제 glb·교회 첨탑 등)는 전부 이 group에 담아서, 아래
    // updatePlaceVisibility()가 group째로 보이기/숨기기만 하면 되게 한다 — 라벨과 똑같이
    // 캐릭터와 LABEL_VISIBLE_RANGE(약 300m) 안에 있거나 지금 심부름 목적지일 때만 보인다.
    // place.y(기본 0, raw 미터)는 금호동처럼 단지 안에 단차가 있는 동네에서 건물마다 실제
    // 지면 높이가 다른 걸 표현하는 값 — group 자체를 그만큼 올리고/내리고, 바닥(y=0)까지
    // 이어지는 벽(스커트)을 세워서 "여기만 지대가 높다/낮다"는 느낌을 준다.
    const groundY = (place.y || 0) * WORLD_SCALE;
    const group = new THREE.Group();
    group.position.y = groundY;
    scene.add(group);
    if (groundY !== 0) {
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(w * 1.4, Math.abs(groundY), d * 1.4),
        new THREE.MeshStandardMaterial({ color: 0x9a9488 })
      );
      skirt.position.set(0, -groundY / 2, 0); // group 기준 로컬 좌표 — group.position.y와 합쳐지면 실제 지면(y=0)까지 이어진다
      skirt.castShadow = true;
      skirt.receiveShadow = true;
      group.add(skirt);
    }

    if (place.model) {
      // 실제 제작된 3D 모델이 있는 동(113동=우리집, 106동 등)은 캐릭터가 가까워지면 불러와 쓴다
      // (updateModelStreaming) — 그전엔 모델 없는 동과 같은 임시 매싱을 세워 둔다.
      const placeholder = new THREE.Group();
      if (place.type === "아파트") {
        height = buildApartmentCluster(place, px, pz, floors, placeholder);
      } else {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), new THREE.MeshStandardMaterial({ color }));
        mesh.position.set(px, height / 2, pz);
        mesh.rotation.y = rotY;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        placeholder.add(mesh);
      }
      group.add(placeholder);
      modelStreamEntries.push({ place, px, pz, rotY, placeholder, group, loadedModel: null, loading: false, inRange: true });
    } else if (place.type === "아파트") {
      height = buildApartmentCluster(place, px, pz, floors, group);
    } else {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), new THREE.MeshStandardMaterial({ color }));
      mesh.position.set(px, height / 2, pz);
      mesh.rotation.y = rotY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    // 교회는 지붕 위에 작은 첨탑 + 십자가를 얹는다
    if (place.church) {
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(1.6 * WORLD_SCALE, 4 * WORLD_SCALE, 4),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      spire.position.set(px, height + 2 * WORLD_SCALE, pz);
      spire.rotation.y = Math.PI / 4;
      group.add(spire);
      const crossMat = new THREE.MeshStandardMaterial({ color: 0xb8291f });
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.25 * WORLD_SCALE, 1.6 * WORLD_SCALE, 0.25 * WORLD_SCALE), crossMat);
      crossV.position.set(px, height + 4.6 * WORLD_SCALE, pz);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(1 * WORLD_SCALE, 0.25 * WORLD_SCALE, 0.25 * WORLD_SCALE), crossMat);
      crossH.position.set(px, height + 4.9 * WORLD_SCALE, pz);
      group.add(crossV, crossH);
    }

    if (!place.model) placeVisibilityEntries.push({ place, px, pz, group });

    const labelText = place.home ? "🏠 우리집" : place.name;
    const label = makeLabelSprite(labelText, place.home ? 0.065 : 0.045);
    label.position.set(px, groundY + height + 1.1, pz);
    label.userData.placeId = place.id; // updateLabelVisibility에서 거리·목적지 판정에 쓴다
    scene.add(label);

    // 심부름 목적지로 지정되면 이 라벨 뒤에서 파란 점멸 표시가 켜진다(기본은 숨김)
    const highlight = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: highlightTexture(), color: 0x3fa9ff, transparent: true, opacity: 0, depthTest: false })
    );
    highlight.scale.set(5, 5, 1);
    highlight.position.set(px, groundY + height + 1.1, pz);
    highlight.renderOrder = 998;
    highlight.visible = false;
    scene.add(highlight);
    placeHighlights[place.id] = highlight;
  });
}

function randomStreetSpot() {
  const x = rand(AREA_MIN_X + 2, AREA_MAX_X - 2);
  const z = rand(AREA_MIN_Z + 2, AREA_MAX_Z - 2);
  return [x, z];
}

function makeCoin() {
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.MeshStandardMaterial({ color: 0xffd34d, emissive: 0x5a3c00, emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.3 })
  );
  mesh.castShadow = true;
  return mesh;
}

function makeThug() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.45, 1.3, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a3a42 })
  );
  body.position.y = 0.85;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 12), new THREE.MeshStandardMaterial({ color: 0xe0b088 }));
  head.position.y = 1.65;
  head.castShadow = true;
  group.add(body, head);
  const label = makeLabelSprite("불량배");
  label.position.y = 2.5;
  group.add(label);
  return group;
}

function spawnItems() {
  items.forEach((it) => scene.remove(it.mesh));
  items = [];
  for (let i = 0; i < ITEM_COUNT; i++) {
    const [x, z] = randomStreetSpot();
    const mesh = makeCoin();
    mesh.position.set(x, 0.9, z);
    scene.add(mesh);
    items.push({ mesh, taken: false });
  }
}

function spawnEnemies() {
  enemies.forEach((en) => scene.remove(en.mesh));
  enemies = [];
  for (let i = 0; i < ENEMY_COUNT; i++) {
    const [x, z] = randomStreetSpot();
    const mesh = makeThug();
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    enemies.push({ mesh, defeated: false });
  }
}

function startAdventure() {
  if (currentErrand) {
    items.forEach((it) => scene.remove(it.mesh));
    enemies.forEach((en) => scene.remove(en.mesh));
    items = [];
    enemies = [];
  } else {
    spawnItems();
    spawnEnemies();
  }
  if (resetBtnEl) resetBtnEl.hidden = true;
  updateHud();
}

function showToast(text) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 1600);
}

function remainingCounts() {
  const itemsLeft = items.filter((it) => !it.taken).length;
  const enemiesLeft = enemies.filter((en) => !en.defeated).length;
  return { itemsLeft, enemiesLeft };
}

function updateHud() {
  if (!hudEl) return;
  if (currentErrand) {
    hudEl.textContent = currentErrand.hudText;
    return;
  }
  const { itemsLeft, enemiesLeft } = remainingCounts();
  hudEl.textContent = `🪙 동전 ${itemsLeft} · 👊 불량배 ${enemiesLeft}`;
  if (itemsLeft === 0 && enemiesLeft === 0 && resetBtnEl) {
    resetBtnEl.hidden = false;
    showToast("🎉 거리를 다 정리했다! 다시 하기를 눌러 보자");
  }
}

function grantReward(amount, label) {
  if (typeof window.grantAdventureReward === "function") window.grantAdventureReward(amount);
  showToast(`${label} · 용돈 +${amount}원`);
}

function updatePickups(dt) {
  if (!character) return;
  const cp = character.position;
  let changed = false;
  items.forEach((it) => {
    if (it.taken) return;
    it.mesh.rotation.y += dt * 2.2;
    it.mesh.position.y = 0.9 + Math.sin(performance.now() / 300 + it.mesh.id) * 0.1;
    if (cp.distanceTo(it.mesh.position) < PICKUP_RADIUS) {
      it.taken = true;
      scene.remove(it.mesh);
      changed = true;
      grantReward(randStep100(ITEM_REWARD_MIN, ITEM_REWARD_MAX), "🪙 동전을 주웠다");
    }
  });
  enemies.forEach((en) => {
    if (en.defeated) return;
    if (cp.distanceTo(en.mesh.position) < PICKUP_RADIUS) {
      en.defeated = true;
      scene.remove(en.mesh);
      changed = true;
      grantReward(randStep100(ENEMY_REWARD_MIN, ENEMY_REWARD_MAX), "👊 불량배를 혼내줬다");
    }
  });
  if (changed) updateHud();
}

const ERRAND_ARRIVAL_RADIUS = 3;

// 심부름 중엔 동전·불량배 대신 목적지(편의점 → 다시 집)에 가까워졌는지를 매 프레임 확인한다.
// main.js 쪽 async 흐름이 window.onErrandStoreArrival / window.onErrandHomeReturn을 기다리고 있다.
function updateErrand() {
  if (!currentErrand || !character) return;
  const cp = character.position;
  if (currentErrand.phase === "toStore") {
    for (const id of currentErrand.storeIds) {
      const place = PLACES.find((p) => p.id === id);
      if (!place) continue;
      const dx = cp.x - place.x * WORLD_SCALE;
      const dz = cp.z - place.z * WORLD_SCALE;
      if (Math.hypot(dx, dz) < ERRAND_ARRIVAL_RADIUS) {
        currentErrand.phase = "awaitingDialog";
        window.onErrandStoreArrival?.(id);
        return;
      }
    }
  } else if (currentErrand.phase === "toHome") {
    if (Math.hypot(cp.x, cp.z) < ERRAND_ARRIVAL_RADIUS) {
      currentErrand.phase = "done";
      currentErrand = null;
      window.onErrandHomeReturn?.();
    }
  }
}

// 심부름 목적지(편의점들 → 다시 집)에 해당하는 라벨 뒤에서 파란 빛이 점멸한다
function updateErrandHighlights() {
  const activeIds = new Set();
  if (currentErrand?.phase === "toStore") currentErrand.storeIds.forEach((id) => activeIds.add(id));
  else if (currentErrand?.phase === "toHome") activeIds.add(0);
  const t = performance.now() / 300;
  Object.entries(placeHighlights).forEach(([id, sprite]) => {
    const active = activeIds.has(Number(id));
    sprite.visible = active;
    if (active) sprite.material.opacity = 0.35 + 0.35 * Math.sin(t) ** 2;
  });
}

function loadCharacter() {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      `models/walk.glb?v=${ASSET_VERSION}`,
      (gltf) => {
        character = gltf.scene;
        character.scale.setScalar(CHAR_SCALE);
        character.traverse((o) => {
          if (o.isMesh) o.castShadow = true;
        });
        scene.add(character);
        mixer = new THREE.AnimationMixer(character);
        gltf.animations.forEach((clip) => {
          actions[clip.name] = mixer.clipAction(clip);
        });
        resolve();
      },
      undefined,
      reject
    );
  });
}

function playAction(name, { loop = true, onFinished } = {}) {
  const next = actions[name];
  if (!next || next === currentAction) return;
  if (currentAction) currentAction.fadeOut(0.2);
  next.reset().setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
  next.clampWhenFinished = !loop;
  next.fadeIn(0.2).play();
  currentAction = next;
  if (!loop && onFinished) {
    const onFinishedEvt = (e) => {
      if (e.action !== next) return;
      mixer.removeEventListener("finished", onFinishedEvt);
      onFinished();
    };
    mixer.addEventListener("finished", onFinishedEvt);
  }
}

function setMoveMode(mode) {
  moveMode = mode;
  walkBtnEl?.classList.toggle("active", mode === "walk");
  runBtnEl?.classList.toggle("active", mode === "run");
}

function triggerJump() {
  if (!character || !mixer || dancing || jumping || !actions["Regular_Jump"]) return;
  jumping = true;
  playAction("Regular_Jump", {
    loop: false,
    onFinished: () => {
      jumping = false;
      playAction("Idle_02");
    },
  });
}

function pickRandomDance() {
  const pool = DANCE_POOL.filter((name) => actions[name]);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickRandomMomDance() {
  const pool = MOM_DANCE_POOL.filter((name) => momActions[name]);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 엄마가 옆에 있으면 같이 춤춘다 — 이로이가 고른 춤을 엄마도 갖고 있으면 같은 춤을, 없으면 엄마는
// 자기 춤 목록에서 따로 무작위로 고른다.
function triggerMomDance(childDanceName) {
  if (!mom || !momMixer) return;
  const name = momActions[childDanceName] ? childDanceName : pickRandomMomDance();
  if (!name) return;
  const action = momActions[name];
  const idle = momActions["Idle_02"];
  momMixer.stopAllAction();
  action.reset().setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = !idle;
  action.play();
  if (idle) {
    const onFinished = (e) => {
      if (e.action !== action) return;
      momMixer.removeEventListener("finished", onFinished);
      idle.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    };
    momMixer.addEventListener("finished", onFinished);
  }
}

function startRandomDance() {
  const name = pickRandomDance();
  if (!name) return;
  dancing = true;
  triggerMomDance(name);
  playAction(name, {
    loop: false,
    onFinished: () => {
      dancing = false;
      playAction("Idle_02");
    },
  });
}

function onDanceClick() {
  if (!character || !mixer || dancing || jumping) return;
  if (danceLoaded) {
    startRandomDance();
    return;
  }
  danceBtnEl.disabled = true;
  new GLTFLoader().load(
    `models/dance.glb?v=${ASSET_VERSION}`,
    (gltf) => {
      gltf.animations.forEach((clip) => {
        if (!actions[clip.name]) actions[clip.name] = mixer.clipAction(clip);
      });
      danceLoaded = true;
      danceBtnEl.disabled = false;
      startRandomDance();
    },
    undefined,
    (err) => {
      console.warn("춤 동작을 못 불러왔다", err);
      danceBtnEl.disabled = false;
    }
  );
}

// "엄마 부르기"를 누르면 이로이 옆(바라보는 방향 기준 오른쪽으로 살짝 떨어진 자리)에 엄마를 세운다.
// 모델은 처음 누를 때만 불러오고(춤 동작과 같은 지연 로딩 방식), 그다음부터는 부를 때마다
// 이로이 옆자리로 다시 옮겨 세운다.
function placeMomBesideCharacter() {
  if (!mom || !character) return;
  const rotY = character.rotation.y;
  const rightX = Math.cos(rotY);
  const rightZ = -Math.sin(rotY);
  mom.position.set(character.position.x + rightX * 0.9, character.position.y, character.position.z + rightZ * 0.9);
  mom.rotation.y = rotY;
  mom.visible = true;
}

// 부르면 손 흔드는 동작(Wave_for_Help_4)을 한 번 하고, 끝나면 Idle_02로 자연스럽게 선다
function playMomGreeting() {
  if (!momMixer) return;
  const greet = momActions["Wave_for_Help_4"];
  const idle = momActions["Idle_02"];
  momMixer.stopAllAction();
  if (!greet) {
    idle?.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    return;
  }
  greet.reset().setLoop(THREE.LoopOnce, 1);
  greet.clampWhenFinished = !idle;
  greet.play();
  if (idle) {
    const onFinished = (e) => {
      if (e.action !== greet) return;
      momMixer.removeEventListener("finished", onFinished);
      idle.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    };
    momMixer.addEventListener("finished", onFinished);
  }
}

// 엄마 모델이 아직 없으면 불러오고(이미 있으면 바로), 끝나면 onReady를 호출한다 —
// "엄마 부르기" 버튼과 심부름 자동 등장이 같은 로딩 로직을 쓴다
function ensureMomLoaded(onReady) {
  if (mom) {
    onReady();
    return;
  }
  if (momLoading) return;
  momLoading = true;
  if (momBtnEl) momBtnEl.disabled = true;
  new GLTFLoader().load(
    `models/mom.glb?v=${ASSET_VERSION}`,
    (gltf) => {
      mom = gltf.scene;
      mom.scale.setScalar(CHAR_SCALE);
      mom.traverse((o) => {
        if (o.isMesh) o.castShadow = true;
      });
      scene.add(mom);
      momMixer = new THREE.AnimationMixer(mom);
      gltf.animations.forEach((clip) => {
        momActions[clip.name] = momMixer.clipAction(clip);
      });
      momLoading = false;
      if (momBtnEl) momBtnEl.disabled = false;
      onReady();
    },
    undefined,
    (err) => {
      console.warn("엄마 모델을 못 불러왔다", err);
      momLoading = false;
      if (momBtnEl) momBtnEl.disabled = false;
    }
  );
}

function onMomClick() {
  ensureMomLoaded(() => {
    placeMomBesideCharacter();
    playMomGreeting();
  });
}

// 심부름을 마치고 집으로 돌아올 때, 엄마가 집 앞에 미리 나와서 손을 흔들며 기다리고 있다
function spawnErrandMom() {
  ensureMomLoaded(() => {
    mom.position.set(2 * WORLD_SCALE, 0, 3);
    mom.rotation.y = Math.PI;
    mom.visible = true;
    const greet = momActions["Wave_for_Help_4"];
    if (greet) {
      momMixer.stopAllAction();
      greet.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    }
  });
}

// 방향키는 "월드 기준 앞/뒤/좌/우"가 아니라, 지금 마우스로 돌려 둔 카메라가 보는 방향을 기준으로
// 움직인다 — 카메라를 오른쪽으로 돌렸으면 위쪽 키가 그 돌린 방향으로 가도록, camYaw를 매 프레임
// 그대로 반영한다.
function updateMovement(dt) {
  if (!character || dancing) return;
  if (currentErrand?.phase === "awaitingDialog") return; // 편의점 대화 중엔 멈춰 선다
  const inputForward = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
  const inputRight = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const moving = inputForward !== 0 || inputRight !== 0;
  if (moving) {
    const fx = -Math.sin(camYaw);
    const fz = -Math.cos(camYaw);
    const rx = Math.cos(camYaw);
    const rz = -Math.sin(camYaw);
    const dir = new THREE.Vector3(fx * inputForward + rx * inputRight, 0, fz * inputForward + rz * inputRight);
    dir.normalize();
    const speed = moveMode === "run" ? RUN_SPEED : WALK_SPEED;
    const next = character.position.clone().addScaledVector(dir, speed * dt);
    next.x = Math.max(AREA_MIN_X + 1, Math.min(AREA_MAX_X - 1, next.x));
    next.z = Math.max(AREA_MIN_Z + 1, Math.min(AREA_MAX_Z - 1, next.z));
    character.position.x = next.x;
    character.position.z = next.z;
    character.rotation.y = Math.atan2(dir.x, dir.z);
  }
  // 점프 중엔 애니메이션은 점프 동작을 그대로 유지하고, 이동/방향 전환만 반영한다
  // (방향키+점프를 같이 누르면 그 방향으로 가며 점프하게)
  if (jumping) return;
  if (moving) {
    playAction(moveMode === "run" ? "Running" : "Walking");
  } else {
    playAction("Idle_02");
  }
}

// 모바일에서 손가락 두 개로 벌리고 좁혀서 확대/축소할 수 있게, 지금 눌려 있는 포인터들을
// pointerId별로 기록해 둔다. 손가락이 하나면 기존처럼 드래그 회전, 두 개가 되면 그 사이 거리
// 변화로 줌을 하고(핀치), 한 손가락 드래그 회전은 그동안 멈춘다.
const activePointers = new Map();
let pinchStartDist = 0;
let pinchStartCamDistance = 0;

function pinchDistance() {
  const pts = [...activePointers.values()];
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
}

function wireOrbitControls() {
  canvasEl.addEventListener("pointerdown", (ev) => {
    activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    // setPointerCapture가 실패해도(일부 환경에서 예외를 던질 수 있다) 핀치 줌 상태 기록은 반드시 되어야 한다
    try {
      canvasEl.setPointerCapture(ev.pointerId);
    } catch (err) {
      /* 캡처 실패는 무시 — 드래그/핀치 자체는 아래 로직으로 계속 동작한다 */
    }
    if (activePointers.size === 2) {
      dragging = false;
      pinchStartDist = pinchDistance();
      pinchStartCamDistance = camDistance;
    } else if (activePointers.size === 1) {
      dragging = true;
      lastPointer = { x: ev.clientX, y: ev.clientY };
    }
  });
  canvasEl.addEventListener("pointermove", (ev) => {
    if (!activePointers.has(ev.pointerId)) return;
    activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (activePointers.size === 2) {
      const dist = pinchDistance();
      const ratio = pinchStartDist > 0 ? pinchStartDist / dist : 1;
      camDistance = Math.min(CAM_DIST_MAX, Math.max(CAM_DIST_MIN, pinchStartCamDistance * ratio));
      return;
    }
    if (!dragging) return;
    const dx = ev.clientX - lastPointer.x;
    const dy = ev.clientY - lastPointer.y;
    lastPointer = { x: ev.clientX, y: ev.clientY };
    camYaw -= dx * 0.006;
    camPitch = Math.min(CAM_PITCH_MAX, Math.max(CAM_PITCH_MIN, camPitch + dy * 0.006));
  });
  const stopDrag = (ev) => {
    activePointers.delete(ev.pointerId);
    if (activePointers.size === 1) {
      const [remaining] = activePointers.values();
      dragging = true;
      lastPointer = { x: remaining.x, y: remaining.y };
    } else {
      dragging = false;
    }
  };
  canvasEl.addEventListener("pointerup", stopDrag);
  canvasEl.addEventListener("pointercancel", stopDrag);
  canvasEl.addEventListener("pointerleave", stopDrag);
  canvasEl.addEventListener(
    "wheel",
    (ev) => {
      ev.preventDefault();
      camDistance = Math.min(CAM_DIST_MAX, Math.max(CAM_DIST_MIN, camDistance + ev.deltaY * 0.012));
    },
    { passive: false }
  );
}

function wireDpad() {
  dpadEl?.querySelectorAll("button").forEach((btn) => {
    const dir = btn.dataset.dir;
    btn.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      keys[dir] = true;
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => btn.addEventListener(evt, () => (keys[dir] = false)));
  });
}

function updateCamera() {
  if (!character) return;
  const x = character.position.x + camDistance * Math.cos(camPitch) * Math.sin(camYaw);
  // 아래를 볼 때(pitch < 0)는 카메라가 땅 밑으로 내려가지 않게 바닥 위에 머문다
  const y = Math.max(0.25, character.position.y + camDistance * Math.sin(camPitch) + CAM_LOOK_Y);
  const z = character.position.z + camDistance * Math.cos(camPitch) * Math.cos(camYaw);
  camera.position.set(x, y, z);
  camera.lookAt(character.position.x, character.position.y + CAM_LOOK_Y, character.position.z);
}

function animate() {
  rafId = requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  updateMovement(dt);
  updatePickups(dt);
  updateErrand();
  updateErrandHighlights();
  if (mixer) mixer.update(dt);
  if (momMixer) momMixer.update(dt);
  updateCamera();
  updateLabelScales();
  updateLabelVisibility();
  updatePlaceVisibility();
  updateModelStreaming(dt);
  renderer.render(scene, camera);
}

function resize() {
  if (!renderer || !canvasEl) return;
  const w = canvasEl.clientWidth || 600;
  const h = canvasEl.clientHeight || 400;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

async function initNeighborhood3D() {
  canvasEl = document.getElementById("neighborhood3d-canvas");
  loadingEl = document.getElementById("neighborhood3d-loading");
  danceBtnEl = document.getElementById("neighborhood3d-dance-btn");
  walkBtnEl = document.getElementById("neighborhood3d-walk-btn");
  runBtnEl = document.getElementById("neighborhood3d-run-btn");
  jumpBtnEl = document.getElementById("neighborhood3d-jump-btn");
  momBtnEl = document.getElementById("neighborhood3d-mom-btn");
  hudEl = document.getElementById("neighborhood3d-hud");
  toastEl = document.getElementById("neighborhood3d-toast");
  resetBtnEl = document.getElementById("neighborhood3d-reset-btn");
  dpadEl = document.getElementById("neighborhood3d-dpad");
  if (!canvasEl || ready || loading) {
    resize();
    if (ready && !rafId) animate();
    return;
  }
  loading = true;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
    renderer.shadowMap.enabled = true;
    clock = new THREE.Clock();
    buildStaticScene();
    await loadCharacter();
    character.position.set(0, 0, 2.5); // 우리집(0,0) 바로 앞 — 건물 안에 스폰되지 않게 앞마당만큼 띄운다
    playAction("Idle_02");
    wireOrbitControls();
    wireDpad();
    // 버튼이 클릭 뒤에도 포커스를 들고 있으면, 스페이스바(점프)를 눌렀을 때 그 버튼이
    // 다시 눌리는 것으로 처리돼 버린다 — 눌린 직후 바로 포커스를 뺀다
    [danceBtnEl, walkBtnEl, runBtnEl, jumpBtnEl, momBtnEl, resetBtnEl].forEach((btn) => {
      btn?.addEventListener("click", () => btn.blur());
    });
    danceBtnEl?.addEventListener("click", onDanceClick);
    walkBtnEl?.addEventListener("click", () => setMoveMode("walk"));
    runBtnEl?.addEventListener("click", () => setMoveMode("run"));
    jumpBtnEl?.addEventListener("click", triggerJump);
    momBtnEl?.addEventListener("click", onMomClick);
    resetBtnEl?.addEventListener("click", startAdventure);
    startAdventure();
    [danceBtnEl, walkBtnEl, runBtnEl, jumpBtnEl, momBtnEl, hudEl, dpadEl].forEach((el) => {
      if (el) el.hidden = false;
    });
    if (loadingEl) loadingEl.hidden = true;
    ready = true;
    resize();
    animate();
  } catch (err) {
    console.warn("거리 모험을 불러오지 못했다", err);
    if (loadingEl) loadingEl.textContent = "불러오지 못했어요. 인터넷 연결을 확인해 주세요.";
  } finally {
    loading = false;
  }
}

function pauseNeighborhood3D() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

window.initNeighborhood3D = initNeighborhood3D;
window.pauseNeighborhood3D = pauseNeighborhood3D;

// main.js의 엄마 심부름 이벤트가 이 거리 모험 화면을 "조종"하는 다리 함수들
window.startErrand = function startErrand({ storeIds, hudText }) {
  currentErrand = { storeIds, hudText, phase: "toStore" };
  if (ready) startAdventure(); // 이미 들어와 있던 화면이면 동전·불량배를 바로 치운다
  if (hudEl) hudEl.hidden = false;
  updateHud();
};
window.errandDialogDone = function errandDialogDone() {
  if (!currentErrand) return;
  currentErrand.phase = "toHome";
  spawnErrandMom();
};
window.isErrandActive = function isErrandActive() {
  return !!currentErrand;
};
