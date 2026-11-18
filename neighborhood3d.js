// ── 거리 모험 (프린세스메이커 무사수행 느낌의 아주 기본적인 버전) ──
// 실제 동네를 그대로 옮기는 건 접고, 평범한 한국 거리를 흉내 낸 가상의 길을 만들어서
// 그 위를 걸어 다니며 동전을 줍고 불량배를 처리해 용돈을 버는 걸로 바꿨다.
// walk.glb(이로이 3D 모델 + Walking/Running/Idle/Regular_Jump 등 20개 동작),
// dance.glb(춤 동작들)는 그대로 쓴다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ASSET_VERSION = "20261116i";

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
const PLACES = [
  { id: 0, name: "우리집", floors: 15, type: "아파트", x: 0, z: 0, home: true, model: "models/3D_place_113.glb", rotationDeg: 0 },
  { id: 1, name: "금호파크힐스 101동", floors: 15, type: "아파트", x: -410, z: 94, model: "models/3D_place_101.glb", rotationDeg: 0 },
  { id: 2, name: "금호파크힐스 102동", floors: 15, type: "아파트", x: -322, z: 46, model: "models/3D_place_102.glb", rotationDeg: 0 },
  { id: 3, name: "금호파크힐스 103동", floors: 15, type: "아파트", x: -261, z: -16, model: "models/3D_place_103.glb", rotationDeg: 0 },
  { id: 4, name: "금호파크힐스 104동", floors: 15, type: "아파트", x: -200, z: -69, model: "models/3D_place_104.glb", rotationDeg: 0 },
  { id: 5, name: "금호파크힐스 105동·이마트24", floors: 15, type: "아파트", x: -136, z: -133, model: "models/3D_place_105.glb", rotationDeg: 0 },
  { id: 6, name: "금호파크힐스 106동", floors: 15, type: "아파트", x: -66, z: -77, model: "models/3D_place_106.glb", rotationDeg: 0 },
  { id: 7, name: "금호파크힐스 107동", floors: 15, type: "아파트", x: -141, z: -8, model: "models/3D_place_107.glb", rotationDeg: 0 },
  { id: 8, name: "금호파크힐스 108동", floors: 15, type: "아파트", x: -208, z: 59, model: "models/3D_place_108.glb", rotationDeg: 0 },
  { id: 9, name: "금호파크힐스 109동", floors: 15, type: "아파트", x: -325, z: 150, model: "models/3D_place_109.glb", rotationDeg: 0 },
  { id: 10, name: "금호파크힐스 110동", floors: 15, type: "아파트", x: -261, z: 136, model: "models/3D_place_110.glb", rotationDeg: 0 },
  { id: 11, name: "금호파크힐스 111동", floors: 15, type: "아파트", x: -170, z: 144, model: "models/3D_place_111.glb", rotationDeg: 0 },
  { id: 12, name: "금호파크힐스 112동", floors: 15, type: "아파트", x: -74, z: 75, model: "models/3D_place_112.glb", rotationDeg: 0 },
  { id: 14, name: "금호파크힐스 114동", floors: 15, type: "아파트", x: 0, z: -93, model: "models/3D_place_114.glb", rotationDeg: 0 },
  { id: 15, name: "금호파크힐스 115동", floors: 15, type: "아파트", x: -29, z: -149, model: "models/3D_place_115.glb", rotationDeg: 0 },
  { id: 16, name: "금호파크힐스 116동", floors: 15, type: "아파트", x: -50, z: 134, model: "models/3D_place_116.glb", rotationDeg: 0 },
  { id: 17, name: "파리바게뜨", floors: 6, type: "카페", x: 27, z: -160, diagonal: true, model: "models/3D_place_namkwang.glb", rotationDeg: 0 },
  { id: 18, name: "대현교회", floors: 4, type: "기타", x: -261, z: -114, church: true },
  { id: 19, name: "금호고등학교", floors: 5, type: "학교", x: -74, z: 203 },
  { id: 20, name: "금호파크힐스 117동", floors: 15, type: "아파트", x: 46, z: 240 },
  { id: 21, name: "금호119안전센터", floors: 2, type: "기타", x: 16, z: 83, model: "models/3D_place_keumho119.glb", rotationDeg: 0 },
  { id: 22, name: "성동구립금호도서관", floors: 4, type: "도서관", x: 91, z: 83 },
  { id: 23, name: "성동구보건소금호분소", floors: 4, type: "보건소", x: 104, z: 152 },
  { id: 24, name: "성동아이사랑복합문화센터", floors: 4, type: "기타", x: 139, z: 235 },
  { id: 25, name: "태비KTS태권스쿨", floors: 4, type: "학원", x: 115, z: -88, model: "models/3D_place_taekwondo.glb", rotationDeg: 0 },
  { id: 26, name: "NEW웰빙마트", floors: 4, type: "중형마트", x: 104, z: -149, diagonal: true },
  { id: 27, name: "롯데마트행당점", floors: 6, type: "대형마트", x: 654, z: -352 },
  { id: 28, name: "메가MGC커피", floors: 2, type: "카페", x: 51, z: -229, diagonal: true, model: "models/3D_place_megacoffee.glb", rotationDeg: 0 },
  { id: 29, name: "아담리즈수학·CU", floors: 3, type: "편의점", x: -104, z: -229 },
  { id: 30, name: "분식집", floors: 4, type: "식당", x: -56, z: -229 },

  // ── 2026-11-18 추가: 3dmodeling_place.csv의 31행 이후(신금호두산위브·금호1가동주민센터·행당한진타운·
  // 금북초등학교·대현산배수지공원·극동미라주·신금호공원·행당대림상가·행현초등학교·금호동벽산아파트·
  // 행당대림아파트)에 자리를 미리 잡아 둔다. 아직 모델링 전이라 model 경로는 앞으로 만들 파일 이름을
  // 미리 정해 둔 것뿐이다 — 같은 이름으로 models/ 폴더에 glb를 넣으면 코드를 더 안 고쳐도 바로 적용된다.
  // (예외: 금북초등학교는 seoul_geumbuk_elementary_v8.html로 이미 만들어 둔 3D_place_keumbuk.glb가
  // models/에 있는데 지금까지 아무 데도 연결돼 있지 않았다 — 그 기존 파일을 그대로 연결했다.)
  // 좌표는 금호파크힐스 동들처럼 위성사진을 눈대중으로 잰 게 아니라, place.csv/실제 주소의 위도·경도를
  // 집(0,0) 기준 상대 거리(m)로 환산해서 잡았다 — 집 기준 실제 방향·거리는 맞지만, 기존 좌표와 축척이
  // 완전히 같다는 보장은 없다. 특히 행당동 쪽(행당한진타운·행당대림아파트·행당대림상가·행현초등학교)은
  // 정확한 지번을 못 찾아 인근 도로 기준 추정치다. 각 단지 안에서 동별 배치는 실제 항공사진이 없어서
  // 격자로 임의 배치했다 — 실제 단지 모양과 다를 수 있으니, 모델을 넣어 보고 지도에서 눈으로 확인한
  // 뒤 x/z를 다시 조정할 것.
  { id: 31, name: "신금호두산위브 101동", floors: 15, type: "아파트", x: -315, z: -172, model: "models/3D_place_dusan101.glb", rotationDeg: 0 },
  { id: 32, name: "신금호두산위브 102동", floors: 15, type: "아파트", x: -270, z: -172, model: "models/3D_place_dusan102.glb", rotationDeg: 0 },
  { id: 33, name: "신금호두산위브 103동", floors: 15, type: "아파트", x: -225, z: -172, model: "models/3D_place_dusan103.glb", rotationDeg: 0 },
  { id: 34, name: "신금호두산위브 104동", floors: 15, type: "아파트", x: -292, z: -128, model: "models/3D_place_dusan104.glb", rotationDeg: 0 },
  { id: 35, name: "신금호두산위브 105동", floors: 15, type: "아파트", x: -248, z: -128, model: "models/3D_place_dusan105.glb", rotationDeg: 0 },
  { id: 36, name: "금호1가동주민센터", floors: 4, type: "기타", x: -270, z: -115, model: "models/3D_place_geumho1dong.glb", rotationDeg: 0 },

  { id: 41, name: "행당한진타운 101동", floors: 15, type: "아파트", x: 795, z: -835, model: "models/3D_place_hj101.glb", rotationDeg: 0 },
  { id: 42, name: "행당한진타운 102동", floors: 15, type: "아파트", x: 830, z: -835, model: "models/3D_place_hj102.glb", rotationDeg: 0 },
  { id: 43, name: "행당한진타운 103동", floors: 15, type: "아파트", x: 865, z: -835, model: "models/3D_place_hj103.glb", rotationDeg: 0 },
  { id: 44, name: "행당한진타운 104동", floors: 15, type: "아파트", x: 900, z: -835, model: "models/3D_place_hj104.glb", rotationDeg: 0 },
  { id: 45, name: "행당한진타운 105동", floors: 15, type: "아파트", x: 935, z: -835, model: "models/3D_place_hj105.glb", rotationDeg: 0 },
  { id: 46, name: "행당한진타운 106동", floors: 15, type: "아파트", x: 970, z: -835, model: "models/3D_place_hj106.glb", rotationDeg: 0 },
  { id: 47, name: "행당한진타운 107동", floors: 15, type: "아파트", x: 1005, z: -835, model: "models/3D_place_hj107.glb", rotationDeg: 0 },
  { id: 48, name: "행당한진타운 108동", floors: 15, type: "아파트", x: 795, z: -800, model: "models/3D_place_hj108.glb", rotationDeg: 0 },
  { id: 49, name: "행당한진타운 109동", floors: 15, type: "아파트", x: 830, z: -800, model: "models/3D_place_hj109.glb", rotationDeg: 0 },
  { id: 50, name: "행당한진타운 110동", floors: 15, type: "아파트", x: 865, z: -800, model: "models/3D_place_hj110.glb", rotationDeg: 0 },
  { id: 51, name: "행당한진타운 111동", floors: 15, type: "아파트", x: 900, z: -800, model: "models/3D_place_hj111.glb", rotationDeg: 0 },
  { id: 52, name: "행당한진타운 112동", floors: 15, type: "아파트", x: 935, z: -800, model: "models/3D_place_hj112.glb", rotationDeg: 0 },
  { id: 53, name: "행당한진타운 113동", floors: 15, type: "아파트", x: 970, z: -800, model: "models/3D_place_hj113.glb", rotationDeg: 0 },
  { id: 54, name: "행당한진타운 114동", floors: 15, type: "아파트", x: 1005, z: -800, model: "models/3D_place_hj114.glb", rotationDeg: 0 },
  { id: 55, name: "행당한진타운 115동", floors: 15, type: "아파트", x: 795, z: -765, model: "models/3D_place_hj115.glb", rotationDeg: 0 },
  { id: 56, name: "행당한진타운 116동", floors: 15, type: "아파트", x: 830, z: -765, model: "models/3D_place_hj116.glb", rotationDeg: 0 },
  { id: 57, name: "행당한진타운 117동", floors: 15, type: "아파트", x: 865, z: -765, model: "models/3D_place_hj117.glb", rotationDeg: 0 },
  { id: 58, name: "행당한진타운 118동", floors: 15, type: "아파트", x: 900, z: -765, model: "models/3D_place_hj118.glb", rotationDeg: 0 },
  { id: 59, name: "행당한진타운 119동", floors: 15, type: "아파트", x: 935, z: -765, model: "models/3D_place_hj119.glb", rotationDeg: 0 },
  { id: 60, name: "행당한진타운 120동", floors: 15, type: "아파트", x: 970, z: -765, model: "models/3D_place_hj120.glb", rotationDeg: 0 },
  { id: 61, name: "행당한진타운 121동", floors: 15, type: "아파트", x: 1005, z: -765, model: "models/3D_place_hj121.glb", rotationDeg: 0 },
  // 201~204동은 3dmodeling_place.csv에 이미 모델 이름(3D_place_hj201~204)이 등록돼 있던 것을 그대로 썼다.
  // 다만 modeling_code/3D_place_hd203.html에서 실제로 내보내는 파일명은 "hangdang_hanjin_203_final.glb"라
  // CSV가 기대하는 "3D_place_hj203.glb"와 다르다 — 그 파일을 쓸 거면 내보낸 뒤 이 이름으로 바꿔서 넣어야 한다.
  { id: 62, name: "행당한진타운 201동", floors: 15, type: "아파트", x: 1085, z: -820, model: "models/3D_place_hj201.glb", rotationDeg: 0 },
  { id: 63, name: "행당한진타운 202동", floors: 15, type: "아파트", x: 1125, z: -820, model: "models/3D_place_hj202.glb", rotationDeg: 0 },
  { id: 64, name: "행당한진타운 203동", floors: 15, type: "아파트", x: 1085, z: -780, model: "models/3D_place_hj203.glb", rotationDeg: 0 },
  { id: 65, name: "행당한진타운 204동", floors: 15, type: "아파트", x: 1125, z: -780, model: "models/3D_place_hj204.glb", rotationDeg: 0 },

  { id: 66, name: "금북초등학교", floors: 5, type: "학교", x: -110, z: -510, model: "models/3D_place_keumbuk.glb", rotationDeg: 0 },
  { id: 67, name: "대현산배수지공원", floors: 1, type: "공원", x: -300, z: -485, model: "models/3D_place_daehyeonsan.glb", rotationDeg: 0 },

  { id: 68, name: "극동미라주 101동", floors: 15, type: "아파트", x: -173, z: -738, model: "models/3D_place_mirage101.glb", rotationDeg: 0 },
  { id: 69, name: "극동미라주 102동", floors: 15, type: "아파트", x: -128, z: -738, model: "models/3D_place_mirage102.glb", rotationDeg: 0 },
  { id: 70, name: "극동미라주 103동", floors: 15, type: "아파트", x: -173, z: -693, model: "models/3D_place_mirage103.glb", rotationDeg: 0 },
  { id: 71, name: "극동미라주 104동", floors: 15, type: "아파트", x: -128, z: -693, model: "models/3D_place_mirage104.glb", rotationDeg: 0 },

  { id: 72, name: "신금호공원", floors: 1, type: "공원", x: -415, z: 205, model: "models/3D_place_singeumho_park.glb", rotationDeg: 0 },
  { id: 73, name: "행당대림상가", floors: 7, type: "마트", x: 650, z: -660, model: "models/3D_place_daerim_mall.glb", rotationDeg: 0 },
  { id: 74, name: "행현초등학교", floors: 5, type: "학교", x: 955, z: -800, model: "models/3D_place_haenghyeon.glb", rotationDeg: 0 },

  // 금호동벽산아파트는 CSV에 501~503·505동만 있고 504동이 없다(원본 그대로 비웠다).
  { id: 75, name: "금호동벽산아파트 501동", floors: 15, type: "아파트", x: 238, z: 738, model: "models/3D_place_byeoksan501.glb", rotationDeg: 0 },
  { id: 76, name: "금호동벽산아파트 502동", floors: 15, type: "아파트", x: 283, z: 738, model: "models/3D_place_byeoksan502.glb", rotationDeg: 0 },
  { id: 77, name: "금호동벽산아파트 503동", floors: 15, type: "아파트", x: 238, z: 783, model: "models/3D_place_byeoksan503.glb", rotationDeg: 0 },
  { id: 78, name: "금호동벽산아파트 505동", floors: 15, type: "아파트", x: 283, z: 783, model: "models/3D_place_byeoksan505.glb", rotationDeg: 0 },

  { id: 81, name: "행당대림아파트 101동", floors: 15, type: "아파트", x: 610, z: -780, model: "models/3D_place_daerim101.glb", rotationDeg: 0 },
  { id: 82, name: "행당대림아파트 102동", floors: 15, type: "아파트", x: 645, z: -780, model: "models/3D_place_daerim102.glb", rotationDeg: 0 },
  { id: 83, name: "행당대림아파트 103동", floors: 15, type: "아파트", x: 680, z: -780, model: "models/3D_place_daerim103.glb", rotationDeg: 0 },
  { id: 84, name: "행당대림아파트 104동", floors: 15, type: "아파트", x: 715, z: -780, model: "models/3D_place_daerim104.glb", rotationDeg: 0 },
  { id: 85, name: "행당대림아파트 105동", floors: 15, type: "아파트", x: 750, z: -780, model: "models/3D_place_daerim105.glb", rotationDeg: 0 },
  { id: 86, name: "행당대림아파트 106동", floors: 15, type: "아파트", x: 785, z: -780, model: "models/3D_place_daerim106.glb", rotationDeg: 0 },
  { id: 87, name: "행당대림아파트 107동", floors: 15, type: "아파트", x: 820, z: -780, model: "models/3D_place_daerim107.glb", rotationDeg: 0 },
  { id: 88, name: "행당대림아파트 108동", floors: 15, type: "아파트", x: 610, z: -745, model: "models/3D_place_daerim108.glb", rotationDeg: 0 },
  { id: 89, name: "행당대림아파트 109동", floors: 15, type: "아파트", x: 645, z: -745, model: "models/3D_place_daerim109.glb", rotationDeg: 0 },
  { id: 90, name: "행당대림아파트 110동", floors: 15, type: "아파트", x: 680, z: -745, model: "models/3D_place_daerim110.glb", rotationDeg: 0 },
  { id: 91, name: "행당대림아파트 111동", floors: 15, type: "아파트", x: 715, z: -745, model: "models/3D_place_daerim111.glb", rotationDeg: 0 },
  { id: 92, name: "행당대림아파트 112동", floors: 15, type: "아파트", x: 750, z: -745, model: "models/3D_place_daerim112.glb", rotationDeg: 0 },
  { id: 93, name: "행당대림아파트 113동", floors: 15, type: "아파트", x: 785, z: -745, model: "models/3D_place_daerim113.glb", rotationDeg: 0 },
  { id: 94, name: "행당대림아파트 114동", floors: 15, type: "아파트", x: 820, z: -745, model: "models/3D_place_daerim114.glb", rotationDeg: 0 },
  { id: 95, name: "행당대림아파트 115동", floors: 15, type: "아파트", x: 610, z: -710, model: "models/3D_place_daerim115.glb", rotationDeg: 0 },
  { id: 96, name: "행당대림아파트 116동", floors: 15, type: "아파트", x: 645, z: -710, model: "models/3D_place_daerim116.glb", rotationDeg: 0 },
  { id: 97, name: "행당대림아파트 117동", floors: 15, type: "아파트", x: 680, z: -710, model: "models/3D_place_daerim117.glb", rotationDeg: 0 },
  { id: 98, name: "행당대림아파트 118동", floors: 15, type: "아파트", x: 715, z: -710, model: "models/3D_place_daerim118.glb", rotationDeg: 0 },
  { id: 99, name: "행당대림아파트 119동", floors: 15, type: "아파트", x: 750, z: -710, model: "models/3D_place_daerim119.glb", rotationDeg: 0 },
  { id: 100, name: "행당대림아파트 120동", floors: 15, type: "아파트", x: 785, z: -710, model: "models/3D_place_daerim120.glb", rotationDeg: 0 },
  { id: 101, name: "행당대림아파트 121동", floors: 15, type: "아파트", x: 820, z: -710, model: "models/3D_place_daerim121.glb", rotationDeg: 0 },
  { id: 102, name: "행당대림아파트 122동", floors: 15, type: "아파트", x: 610, z: -675, model: "models/3D_place_daerim122.glb", rotationDeg: 0 },
  { id: 103, name: "행당대림아파트 123동", floors: 15, type: "아파트", x: 645, z: -675, model: "models/3D_place_daerim123.glb", rotationDeg: 0 },
  { id: 104, name: "행당대림아파트 124동", floors: 15, type: "아파트", x: 680, z: -675, model: "models/3D_place_daerim124.glb", rotationDeg: 0 },
  { id: 105, name: "행당대림아파트 125동", floors: 15, type: "아파트", x: 715, z: -675, model: "models/3D_place_daerim125.glb", rotationDeg: 0 },
  { id: 106, name: "행당대림아파트 126동", floors: 15, type: "아파트", x: 750, z: -675, model: "models/3D_place_daerim126.glb", rotationDeg: 0 },
  { id: 107, name: "행당대림아파트 127동", floors: 15, type: "아파트", x: 785, z: -675, model: "models/3D_place_daerim127.glb", rotationDeg: 0 },
  { id: 108, name: "행당대림아파트 128동", floors: 15, type: "아파트", x: 820, z: -675, model: "models/3D_place_daerim128.glb", rotationDeg: 0 },
  { id: 109, name: "행당대림아파트 129동", floors: 15, type: "아파트", x: 610, z: -640, model: "models/3D_place_daerim129.glb", rotationDeg: 0 },
  { id: 110, name: "행당대림아파트 130동", floors: 15, type: "아파트", x: 645, z: -640, model: "models/3D_place_daerim130.glb", rotationDeg: 0 },
  { id: 111, name: "행당대림아파트 131동", floors: 15, type: "아파트", x: 680, z: -640, model: "models/3D_place_daerim131.glb", rotationDeg: 0 },
  { id: 112, name: "행당대림아파트 132동", floors: 15, type: "아파트", x: 715, z: -640, model: "models/3D_place_daerim132.glb", rotationDeg: 0 },
  { id: 113, name: "행당대림아파트 133동", floors: 15, type: "아파트", x: 750, z: -640, model: "models/3D_place_daerim133.glb", rotationDeg: 0 },
  { id: 114, name: "행당대림아파트 134동", floors: 15, type: "아파트", x: 785, z: -640, model: "models/3D_place_daerim134.glb", rotationDeg: 0 },
  { id: 115, name: "행당대림아파트 135동", floors: 15, type: "아파트", x: 820, z: -640, model: "models/3D_place_daerim135.glb", rotationDeg: 0 },
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
  { a: [68.8, -251.2], b: [-20.8, -249.6], width: ROAD_MEDIUM },
  { a: [-22.4, -249.6], b: [-70.4, -238.4], width: ROAD_MEDIUM },
  { a: [70.4, -249.6], b: [70.4, -203.2], width: ROAD_MAJOR },
  { a: [-216.0, -248.0], b: [-257.6, -224.0], width: ROAD_MEDIUM },
  { a: [-214.4, -248.0], b: [-180.8, -187.2], width: ROAD_MEDIUM },
  { a: [-70.4, -238.4], b: [-65.6, -190.4], width: ROAD_MEDIUM },
  { a: [324.8, -236.8], b: [163.2, -184.0], width: ROAD_MAJOR },
  { a: [326.4, -236.8], b: [398.4, -120.0], width: ROAD_MEDIUM },
  { a: [657.6, -219.2], b: [475.2, -112.0], width: ROAD_MEDIUM },
  { a: [659.2, -219.2], b: [721.6, -108.8], width: ROAD_MEDIUM },
  { a: [68.8, -196.8], b: [-64.0, -188.8], width: ROAD_MAJOR },
  { a: [70.4, -196.8], b: [76.8, -180.8], width: ROAD_MAJOR },
  { a: [-81.6, -188.8], b: [-179.2, -185.6], width: ROAD_MAJOR },
  { a: [-78.4, -188.8], b: [-67.2, -188.8], width: ROAD_MAJOR },
  { a: [-80.0, -187.2], b: [-78.4, -145.6], width: ROAD_MEDIUM },
  { a: [-78.4, -145.6], b: [-40.0, -108.8], width: ROAD_MEDIUM },
  { a: [-40.0, -108.8], b: [-25.6, -52.8], width: ROAD_MEDIUM },
  { a: [-25.6, -52.8], b: [-35.2, -33.6], width: ROAD_MEDIUM },
  { a: [-35.2, -33.6], b: [-120.0, 41.6], width: ROAD_MEDIUM },
  { a: [-120.0, 41.6], b: [-134.4, 88.0], width: ROAD_MEDIUM },
  { a: [-134.4, 88.0], b: [-155.2, 100.8], width: ROAD_MEDIUM },
  { a: [-155.2, 100.8], b: [-340.8, 102.4], width: ROAD_MEDIUM },
  { a: [-340.8, 102.4], b: [-369.6, 120.0], width: ROAD_MEDIUM },
  { a: [-369.6, 120.0], b: [-414.4, 166.4], width: ROAD_MEDIUM },
  { a: [-180.8, -185.6], b: [-241.6, -171.2], width: ROAD_MAJOR },
  { a: [-241.6, -171.2], b: [-284.8, -145.6], width: ROAD_MAJOR },
  { a: [-284.8, -145.6], b: [-304.0, -115.2], width: ROAD_MAJOR },
  { a: [-304.0, -115.2], b: [-315.2, -48.0], width: ROAD_MAJOR },
  { a: [-315.2, -48.0], b: [-329.6, -27.2], width: ROAD_MAJOR },
  { a: [-329.6, -27.2], b: [-382.4, -11.2], width: ROAD_MAJOR },
  { a: [-382.4, -11.2], b: [-512.0, -9.6], width: ROAD_MAJOR },
  { a: [161.6, -184.0], b: [126.4, -177.6], width: ROAD_MAJOR },
  { a: [163.2, -182.4], b: [196.8, -105.6], width: ROAD_MEDIUM },
  { a: [196.8, -105.6], b: [222.4, -76.8], width: ROAD_MEDIUM },
  { a: [222.4, -76.8], b: [416.0, 16.0], width: ROAD_MEDIUM },
  { a: [78.4, -179.2], b: [124.8, -177.6], width: ROAD_MAJOR },
  { a: [76.8, -177.6], b: [72.0, -108.8], width: ROAD_MAJOR },
  { a: [126.4, -176.0], b: [140.8, -81.6], width: ROAD_MEDIUM },
  { a: [396.8, -118.4], b: [368.0, -100.8], width: ROAD_MEDIUM },
  { a: [400.0, -118.4], b: [430.4, -78.4], width: ROAD_MEDIUM },
  { a: [430.4, -78.4], b: [515.2, -56.0], width: ROAD_MEDIUM },
  { a: [515.2, -56.0], b: [564.8, -56.0], width: ROAD_MEDIUM },
  { a: [564.8, -56.0], b: [721.6, -107.2], width: ROAD_MEDIUM },
  { a: [740.8, -110.4], b: [723.2, -107.2], width: ROAD_MEDIUM },
  { a: [70.4, -107.2], b: [62.4, -51.2], width: ROAD_MAJOR },
  { a: [72.0, -107.2], b: [96.0, -92.8], width: ROAD_MEDIUM },
  { a: [96.0, -92.8], b: [97.6, 22.4], width: ROAD_MEDIUM },
  { a: [97.6, 22.4], b: [121.6, 73.6], width: ROAD_MEDIUM },
  { a: [121.6, 73.6], b: [110.4, 228.8], width: ROAD_MEDIUM },
  { a: [142.4, -80.0], b: [244.8, -40.0], width: ROAD_MEDIUM },
  { a: [244.8, -40.0], b: [292.8, -6.4], width: ROAD_MEDIUM },
  { a: [292.8, -6.4], b: [294.4, 49.6], width: ROAD_MEDIUM },
  { a: [294.4, 49.6], b: [358.4, 108.8], width: ROAD_MEDIUM },
  { a: [358.4, 108.8], b: [372.8, 179.2], width: ROAD_MEDIUM },
  { a: [140.8, -78.4], b: [113.6, -11.2], width: ROAD_MEDIUM },
  { a: [113.6, -11.2], b: [140.8, 67.2], width: ROAD_MEDIUM },
  { a: [140.8, 67.2], b: [139.2, 128.0], width: ROAD_MEDIUM },
  { a: [740.8, -68.8], b: [684.8, -73.6], width: ROAD_MEDIUM },
  { a: [684.8, -73.6], b: [416.0, 16.0], width: ROAD_MEDIUM },
  { a: [60.8, -51.2], b: [33.6, -49.6], width: ROAD_MEDIUM },
  { a: [62.4, -49.6], b: [54.4, 65.6], width: ROAD_MAJOR },
  { a: [416.0, 16.0], b: [441.6, 145.6], width: ROAD_MEDIUM },
  { a: [441.6, 145.6], b: [510.4, 208.0], width: ROAD_MEDIUM },
  { a: [510.4, 208.0], b: [553.6, 300.8], width: ROAD_MEDIUM },
  { a: [52.8, 67.2], b: [41.6, 78.4], width: ROAD_WIDE },
  { a: [41.6, 78.4], b: [41.6, 96.0], width: ROAD_WIDE },
  { a: [41.6, 96.0], b: [51.2, 105.6], width: ROAD_WIDE },
  { a: [56.0, 67.2], b: [62.4, 96.0], width: ROAD_WIDE },
  { a: [62.4, 96.0], b: [54.4, 104.0], width: ROAD_WIDE },
  { a: [-512.0, 86.4], b: [-427.2, 168.0], width: ROAD_MAJOR },
  { a: [51.2, 105.6], b: [36.8, 121.6], width: ROAD_WIDE },
  { a: [36.8, 121.6], b: [52.8, 147.2], width: ROAD_WIDE },
  { a: [54.4, 107.2], b: [54.4, 147.2], width: ROAD_MAJOR },
  { a: [140.8, 129.6], b: [300.8, 198.4], width: ROAD_MEDIUM },
  { a: [300.8, 198.4], b: [371.2, 180.8], width: ROAD_MEDIUM },
  { a: [137.6, 131.2], b: [132.8, 214.4], width: ROAD_MEDIUM },
  { a: [132.8, 214.4], b: [168.0, 244.8], width: ROAD_MEDIUM },
  { a: [54.4, 148.8], b: [68.8, 203.2], width: ROAD_MAJOR },
  { a: [68.8, 203.2], b: [97.6, 248.0], width: ROAD_MAJOR },
  { a: [-427.2, 168.0], b: [-416.0, 168.0], width: ROAD_MAJOR },
  { a: [-427.2, 168.0], b: [-508.8, 235.2], width: ROAD_MEDIUM },
  { a: [-414.4, 169.6], b: [-358.4, 198.4], width: ROAD_MAJOR },
  { a: [-358.4, 198.4], b: [-152.0, 259.2], width: ROAD_MAJOR },
  { a: [-152.0, 259.2], b: [-78.4, 291.2], width: ROAD_MAJOR },
  { a: [-78.4, 291.2], b: [-64.0, 307.2], width: ROAD_MAJOR },
  { a: [372.8, 180.8], b: [384.0, 284.8], width: ROAD_MEDIUM },
  { a: [108.8, 232.0], b: [99.2, 248.0], width: ROAD_WIDE },
  { a: [-510.4, 236.8], b: [-510.4, 243.2], width: ROAD_WIDE },
  { a: [-508.8, 244.8], b: [-435.2, 312.0], width: ROAD_MEDIUM },
  { a: [171.2, 244.8], b: [203.2, 264.0], width: ROAD_MEDIUM },
  { a: [203.2, 264.0], b: [190.4, 305.6], width: ROAD_MEDIUM },
  { a: [190.4, 305.6], b: [179.2, 312.0], width: ROAD_MEDIUM },
  { a: [-512.0, 246.4], b: [-512.0, 300.8], width: ROAD_MEDIUM },
  { a: [169.6, 246.4], b: [177.6, 312.0], width: ROAD_MEDIUM },
  { a: [99.2, 249.6], b: [105.6, 281.6], width: ROAD_MAJOR },
  { a: [107.2, 283.2], b: [121.6, 289.6], width: ROAD_WIDE },
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
const CAM_PITCH_MIN = 0.1;
const CAM_PITCH_MAX = 1.35;
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

  // 각 건물 사이에 깔린 회색 보행로(정밀한 실제 도로는 아니고, 건물들이 서 있는 자리를 넓게 덮는 정도)
  const plaza = new THREE.Mesh(
    new THREE.PlaneGeometry(groundW * 0.6, groundD * 0.6),
    new THREE.MeshStandardMaterial({ color: 0xc7c7c2 })
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set((AREA_MIN_X + AREA_MAX_X) / 2, -0.02, (AREA_MIN_Z + AREA_MAX_Z) / 2);
  plaza.receiveShadow = true;
  scene.add(plaza);

  buildRoads();
  buildPlaces();
  buildTrees();
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
function addTowerBox(px, pz, offX, offZ, w, d, h, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
  mesh.position.set(px + offX, h / 2, pz + offZ);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function buildApartmentCluster(place, px, pz, floors) {
  const baseH = Math.max(0.6, Math.min(floors, 6) * 3 * WORLD_SCALE);
  const BASE_COLOR = 0x3a3a40;
  addTowerBox(px, pz, 0, 0, 20 * WORLD_SCALE, 12 * WORLD_SCALE, baseH, BASE_COLOR);

  const useTemplateA = place.home || place.id % 2 === 1;
  let topHeight;
  if (useTemplateA) {
    // 113동 스타일: 메인 타워(정면 색) + 뒤쪽 보조 타워(크림) + 더 높은 첨탑(연회색)
    const mainColor = place.home ? 0xff6fa0 : 0xd98a4a;
    const mainH = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 3 * WORLD_SCALE);
    const sideH = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 2.4 * WORLD_SCALE);
    const spireH = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 3.3 * WORLD_SCALE);
    addTowerBox(px, pz, -4 * WORLD_SCALE, -1 * WORLD_SCALE, 9 * WORLD_SCALE, 9 * WORLD_SCALE, mainH, mainColor);
    addTowerBox(px, pz, 3 * WORLD_SCALE, 2 * WORLD_SCALE, 8 * WORLD_SCALE, 7 * WORLD_SCALE, sideH, 0xe8e2d0);
    addTowerBox(px, pz, 6 * WORLD_SCALE, -3 * WORLD_SCALE, 5 * WORLD_SCALE, 5 * WORLD_SCALE, spireH, 0xcfd0d2);
    topHeight = Math.max(mainH, sideH, spireH);
  } else {
    // 106동 스타일: 비슷한 높이의 타워 3개를 나란히(주황-크림-주황)
    const h1 = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 2.9 * WORLD_SCALE);
    const h2 = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 2.6 * WORLD_SCALE);
    const h3 = Math.max(baseH + 0.3 * WORLD_SCALE, floors * 3 * WORLD_SCALE);
    addTowerBox(px, pz, -6 * WORLD_SCALE, 0, 7 * WORLD_SCALE, 9 * WORLD_SCALE, h1, 0xd98a4a);
    addTowerBox(px, pz, 0, 0, 7 * WORLD_SCALE, 9 * WORLD_SCALE, h2, 0xe8e2d0);
    addTowerBox(px, pz, 6 * WORLD_SCALE, 0, 7 * WORLD_SCALE, 9 * WORLD_SCALE, h3, 0xd98a4a);
    topHeight = Math.max(h1, h2, h3);
  }
  return topHeight;
}

// 동마다 실제로 제작된 3D 모델(3D_place_101.glb ~ 116.glb 등)을 불러와서 자리에 앉힌다. 모델 자체의
// 단위가 PLACES 좌표와 같은 "실측 미터" 기준이라 WORLD_SCALE을 그대로 곱해서 쓰고, 모델이 세로 중심을
// 기준으로 만들어져 있어서(바닥이 y=0이 아님) 불러온 뒤 바운딩박스를 재서 바닥이 지면에 닿도록 보정한다.
// rotY는 사거리 대각선 배치(place.diagonal) 자리의 기본 회전값 — place.rotationDeg를 넣어 두면
// (모델마다 정면 방향이 다를 수 있어서) 그 값으로 덮어써 미세 조정할 수 있다.
function loadPlaceModel(place, px, pz, rotY = 0) {
  new GLTFLoader().load(
    `${place.model}?v=${ASSET_VERSION}`,
    (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(WORLD_SCALE);
      model.position.set(px, 0, pz);
      model.rotation.y = place.rotationDeg != null ? THREE.MathUtils.degToRad(place.rotationDeg) : rotY;
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      model.position.y -= box.min.y;
      scene.add(model);
    },
    undefined,
    (err) => console.warn(`${place.name} 모델을 못 불러왔다`, err)
  );
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

    if (place.model) {
      // 실제 제작된 3D 모델이 있는 동(113동=우리집, 106동)은 그 모델을 그대로 불러와 쓴다
      loadPlaceModel(place, px, pz, rotY);
    } else if (place.type === "아파트") {
      height = buildApartmentCluster(place, px, pz, floors);
    } else {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), new THREE.MeshStandardMaterial({ color }));
      mesh.position.set(px, height / 2, pz);
      mesh.rotation.y = rotY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    // 교회는 지붕 위에 작은 첨탑 + 십자가를 얹는다
    if (place.church) {
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(1.6 * WORLD_SCALE, 4 * WORLD_SCALE, 4),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      spire.position.set(px, height + 2 * WORLD_SCALE, pz);
      spire.rotation.y = Math.PI / 4;
      scene.add(spire);
      const crossMat = new THREE.MeshStandardMaterial({ color: 0xb8291f });
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.25 * WORLD_SCALE, 1.6 * WORLD_SCALE, 0.25 * WORLD_SCALE), crossMat);
      crossV.position.set(px, height + 4.6 * WORLD_SCALE, pz);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(1 * WORLD_SCALE, 0.25 * WORLD_SCALE, 0.25 * WORLD_SCALE), crossMat);
      crossH.position.set(px, height + 4.9 * WORLD_SCALE, pz);
      scene.add(crossV, crossH);
    }

    const labelText = place.home ? "🏠 우리집" : place.name;
    const label = makeLabelSprite(labelText, place.home ? 0.065 : 0.045);
    label.position.set(px, height + 1.1, pz);
    scene.add(label);

    // 심부름 목적지로 지정되면 이 라벨 뒤에서 파란 점멸 표시가 켜진다(기본은 숨김)
    const highlight = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: highlightTexture(), color: 0x3fa9ff, transparent: true, opacity: 0, depthTest: false })
    );
    highlight.scale.set(5, 5, 1);
    highlight.position.set(px, height + 1.1, pz);
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
  mom.position.set(character.position.x + rightX * 1.3, character.position.y, character.position.z + rightZ * 1.3);
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
  const y = character.position.y + camDistance * Math.sin(camPitch) + 1.2;
  const z = character.position.z + camDistance * Math.cos(camPitch) * Math.cos(camYaw);
  camera.position.set(x, y, z);
  camera.lookAt(character.position.x, character.position.y + 1.2, character.position.z);
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
