// ── 거리 모험 (프린세스메이커 무사수행 느낌의 아주 기본적인 버전) ──
// 실제 동네를 그대로 옮기는 건 접고, 평범한 한국 거리를 흉내 낸 가상의 길을 만들어서
// 그 위를 걸어 다니며 동전을 줍고 불량배를 처리해 용돈을 버는 걸로 바꿨다.
// walk.glb(이로이 3D 모델 + Walking/Running/Idle/Regular_Jump 등 20개 동작),
// dance.glb(춤 동작들)는 그대로 쓴다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { PLACES, ROAD_SEGMENTS, TREES, PARKS } from "./map_data.js?v=20261122b";

const ASSET_VERSION = "20261122c";

// 모든 .glb를 이 하나의 로더로 불러온다 — 로더를 호출마다 새로 만들면 매번 파서·확장 설정을
// 다시 구성하는 비용이 들고, meshopt로 압축한 모델(용량 줄이려고 지오메트리를 압축해 둔 것)을
// 읽으려면 디코더를 미리 등록해 둬야 한다.
const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

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

// ── 동네 생김새: 건물(PLACES)·도로(ROAD_SEGMENTS)·가로수(TREES)·공원(PARKS)은 map_data.js에 있다 ──
// map_editor.html에서 지도 위 건물/도로/나무/공원을 추가·삭제·드래그해 고친 뒤 "내보내기"를
// 누르면 map_data.js 전체를 바꿔치기할 수 있는 코드가 나온다 — neighborhood3d.js는 건드릴
// 필요가 없다.

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
// 옮겼다. map_data.js의 각 구간은 이 상수 대신 실측한 raw 숫자를 그대로 쓰지만(map_editor.html이
// 혹시 몰라 이 이름들도 폭으로 해석할 수 있게 남겨 둔다), 표면 색·중앙선·차선은 폭 숫자 자체로
// 구간마다 정한다(roadStyleFor: 8m 미만 골목길, 11m 미만 10m급, 13m 미만 단지내도로,
// 22m 미만 15~20m급, 그 이상 30m급).
const ROAD_MAJOR = 16; // 난계로·사거리 교차로 등 가장 두껍게 칠해진 간선도로
const ROAD_WIDE = 10; // 그다음으로 두꺼운 큰길
const ROAD_MEDIUM = 6; // 단지 안 보통 도로
const ROAD_NARROW = 3.5; // 가늘게 칠해진 좁은 길(차선 없음) — 이 폭 이하는 차선을 아예 안 그린다
// PLACES·ROAD_SEGMENTS는 map_data.js로 옮겼다(map_editor.html에서 그 파일 전체를 통째로 바꿔 쓸 수 있게).

const AREA_MARGIN = 8;
// 도로가 건물보다 더 넓게 뻗어 있는 구간(예: 롯데마트 너머)도 있어서, 바닥·이동범위는 건물과
// 도로 좌표를 모두 합쳐서 계산한다
const ALL_COORD_XS = [...PLACES.map((p) => p.x), ...ROAD_SEGMENTS.flatMap((s) => [s.a[0], s.b[0], ...(s.curve ? [s.curve[0]] : [])])];
const ALL_COORD_ZS = [...PLACES.map((p) => p.z), ...ROAD_SEGMENTS.flatMap((s) => [s.a[1], s.b[1], ...(s.curve ? [s.curve[1]] : [])])];
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
// 게임을 열자마자 113동 1-2호 출입구 앞(캐릭터 바로 뒤에서 나무·두 출입구·금호119안전센터/
// 금호고등학교 이름표가 함께 보이는 구도)에서 시작하도록 맞춘 값 — 플레이어가 직접 돌리고
// 확대/축소하면 당연히 바뀐다(2026-11-22).
let camYaw = 2.8;
let camPitch = 0.26;
let camDistance = 3.6; // 캐릭터가 더 작아진(CHAR_SCALE 0.25) 만큼, 화면에서 너무 작고 멀어 보이지 않게 조금 당김(2026-11-22)
// 위아래 시선: 아래(-)부터 위(+)까지 거의 전 범위(±83°). 정확히 ±90°는 카메라가 뒤집혀서 피한다
const CAM_PITCH_MIN = -1.45;
const CAM_PITCH_MAX = 1.45;
const CAM_LOOK_Y = 0.6; // 시선 높이(캐릭터 머리 쪽)
const CHAR_SCALE = 0.25; // 이로이·엄마는 원래의 1/4 크기 — 15층 건물 대비 실제 사람 키 비율에 더 가깝게(2026-11-22, 기존 1/2에서 한 번 더 줄임)
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
// 7(102·106·107·108 커뮤니티동)은 glb 하나가 네 동을 다 덮고 있는데, 로딩/가시성 기준점은
// 그 glb를 올려 둔 107동 자리 하나뿐이다. 가장 먼 모서리인 106동 쪽은 그 기준점에서 약
// 323m 떨어져 있어서 기본 300m 범위를 살짝 넘어 — 106동 쪽에 서면 주변은 다 보이는데 이
// 건물(모델+플레이스홀더)만 통째로 사라진다. 이 동만 범위를 여유 있게 늘려서 해결한다.
const VISIBLE_RANGE_OVERRIDE_M = { 7: 400 };
function visibleRangeFor(id) {
  return (VISIBLE_RANGE_OVERRIDE_M[id] ?? VISIBLE_RANGE_M) * WORLD_SCALE;
}
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
  const inRange = (px, pz, id) => activeIds.has(id) || Math.hypot(cp.x - px, cp.z - pz) <= visibleRangeFor(id);
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

  buildParks();
  buildRoads();
  buildRoadsideProps();
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
  if (!TREES.length) return;
  const trunkGeo = new THREE.CylinderGeometry(0.35 * WORLD_SCALE, 0.45 * WORLD_SCALE, 3 * WORLD_SCALE, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a30 });
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, TREES.length);
  const foliageGeo = new THREE.ConeGeometry(2.4 * WORLD_SCALE, 4.6 * WORLD_SCALE, 7);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3f7a3f });
  const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, TREES.length);
  const dummy = new THREE.Object3D();
  TREES.forEach(([rawX, rawZ], i) => {
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

// 공원(PARKS): 바닥을 초록 잔디로 칠한 네모난 구역 — 지도 이미지(y=-0.025)보다는 위, 도로
// (y≈0.005~0.006)보다는 아래에 깔아서 도로가 공원 위를 지나가도 도로가 보이게 한다.
function buildParks() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x6fae4a });
  PARKS.forEach((park) => {
    const geo = new THREE.PlaneGeometry(park.w * WORLD_SCALE, park.d * WORLD_SCALE);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(park.x * WORLD_SCALE, -0.01, park.z * WORLD_SCALE);
    mesh.rotation.y = park.rotationDeg ? THREE.MathUtils.degToRad(park.rotationDeg) : 0;
    mesh.receiveShadow = true;
    scene.add(mesh);
  });
}

// 차선 점선은 도로가 많아지니 개별 메시로 그리면 수백 개가 생겨서(실측 500개+) 프레임이 뚝 떨어진다.
// 그래서 위치만 모아 뒀다가 색깔별로 InstancedMesh 하나씩(노란 점선 1개, 흰 점선 1개)으로 그린다.
let yellowDashTransforms = [];
let whiteDashTransforms = [];

// map_editor.html에서 a→curve(제어점)→b로 그린 2차 베지어 곡선을 따라 점을 여러 개 뽑는다 —
// curve가 없으면(직선) 그냥 양 끝점 2개뿐이라 아래 리본 그리기가 그대로 직선 사각형이 된다.
const ROAD_CURVE_STEPS = 20;
function quadBezierPoint(p0, p1, p2, t) {
  const mt = 1 - t;
  return [mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0], mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1]];
}
function roadPolyline(seg) {
  if (!seg.curve) return [seg.a, seg.b];
  const pts = [];
  for (let i = 0; i <= ROAD_CURVE_STEPS; i++) pts.push(quadBezierPoint(seg.a, seg.curve, seg.b, i / ROAD_CURVE_STEPS));
  return pts;
}

// 도로 폭(실측 m)에 따라 표면 색과 중앙선·차선을 다르게 그린다. 폭 하나하나를 보고 정하는
// 거라, 같은 길이라도 구간마다 실측 오차로 폭이 살짝씩 다르면 그 경계에서 스타일이 바뀔 수
// 있다(예: 10.7→10.3→12.1처럼 변하는 구간) — 길 단위로 통일하려면 손이 많이 가서, 우선은
// 구간(segment)별 실측 폭을 그대로 기준으로 쓰는 단순한 규칙을 쓴다.
//   8m 미만          : 골목길 — 옅은 회색, 선 없음
//   8m 이상 11m 미만 : 작은도로(10m급) — 기본 아스팔트색, 노란 점선 중앙선
//   11m 이상 13m 미만: 단지내도로(12m급) — 베이지(보도 느낌), 선 없음
//   13m 이상 22m 미만: 15~20m급 — 기본 아스팔트색, 노란 실선 중앙선
//   22m 이상         : 30m급 — 기본 아스팔트색, 노란 실선 중앙선 + 양옆 흰 점선 차선
const ROAD_SURFACE = 0x4a4a4e;
const ROAD_SURFACE_ALLEY = 0x7a7a7e;
const ROAD_SURFACE_COMPLEX = 0xd8c9a3;
const LANE_YELLOW = 0xf2c438;
const LANE_WHITE = 0xf2f2f2;
function roadStyleFor(width) {
  if (width < 8) return { surface: ROAD_SURFACE_ALLEY, center: null, sides: false };
  if (width < 11) return { surface: ROAD_SURFACE, center: "dashed", sides: false };
  if (width < 13) return { surface: ROAD_SURFACE_COMPLEX, center: null, sides: false };
  if (width < 22) return { surface: ROAD_SURFACE, center: "solid", sides: false };
  return { surface: ROAD_SURFACE, center: "solid", sides: true };
}

// 폭이 있는 띠(리본) 지오메트리를 하나 만든다 — 도로 표면뿐 아니라 중앙 실선도 같은 함수로
// (실선은 그냥 아주 얇은 리본) 만들어서 곡선 구간에서도 똑같이 매끈하게 휘어지게 한다.
function buildRibbonGeometry(pts, tangents, width, offset = 0) {
  const n = pts.length;
  const positions = [];
  for (let i = 0; i < n; i++) {
    const [tx, tz] = tangents[i];
    const px = -tz, pz = tx; // 진행 방향에 수직인 단위벡터
    const [x, z] = pts[i];
    const cx = x + px * offset, cz = z + pz * offset;
    positions.push(cx + (px * width) / 2, 0, cz + (pz * width) / 2);
    positions.push(cx - (px * width) / 2, 0, cz - (pz * width) / 2);
  }
  const indices = [];
  for (let i = 0; i < n - 1; i++) {
    const a0 = i * 2, a1 = i * 2 + 1, b0 = (i + 1) * 2, b1 = (i + 1) * 2 + 1;
    indices.push(a0, b0, a1, a1, b0, b1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// 도로 하나(직선이든 곡선이든)를 폭이 있는 띠(리본) 메시 하나로 통째로 그린다 — 예전엔 곡선을
// 짧은 직선 조각으로 쪼갠 뒤 조각마다 따로 회전된 네모를 깔고 꺾이는 자리마다 둥근 판으로
// 메웠는데, 샘플 간격이 좁으면 그 둥근 판들이 다닥다닥 겹쳐서 도로 전체가 구슬을 꿴 것처럼
// 울퉁불퉁해 보였다. 지금은 점들을 한 번에 이어 리본 하나로 그려서, 안쪽 꺾임은 양옆 방향의
// 평균(미터) 방향으로 폭을 내밀어 틈도 겹침도 없이 매끈하게 이어진다.
function buildRoadRibbon(seg) {
  const rawPts = roadPolyline(seg);
  const pts = rawPts.map(([x, z]) => [x * WORLD_SCALE, z * WORLD_SCALE]);
  const n = pts.length;
  const roadW = seg.width * WORLD_SCALE;
  const tangents = pts.map((p, i) => {
    let dx, dz;
    if (i === 0) {
      dx = pts[1][0] - pts[0][0];
      dz = pts[1][1] - pts[0][1];
    } else if (i === n - 1) {
      dx = pts[n - 1][0] - pts[n - 2][0];
      dz = pts[n - 1][1] - pts[n - 2][1];
    } else {
      const l1x = pts[i][0] - pts[i - 1][0], l1z = pts[i][1] - pts[i - 1][1];
      const l2x = pts[i + 1][0] - pts[i][0], l2z = pts[i + 1][1] - pts[i][1];
      const len1 = Math.hypot(l1x, l1z) || 1, len2 = Math.hypot(l2x, l2z) || 1;
      dx = l1x / len1 + l2x / len2;
      dz = l1z / len1 + l2z / len2;
    }
    const len = Math.hypot(dx, dz) || 1;
    return [dx / len, dz / len];
  });

  const style = roadStyleFor(seg.width);
  const road = new THREE.Mesh(
    buildRibbonGeometry(pts, tangents, roadW, 0),
    new THREE.MeshStandardMaterial({ color: style.surface, side: THREE.DoubleSide })
  );
  road.position.y = 0.005;
  road.receiveShadow = true;
  scene.add(road);

  if (style.center === "solid") {
    const lineW = Math.max(0.25 * WORLD_SCALE, roadW * 0.015);
    const line = new THREE.Mesh(
      buildRibbonGeometry(pts, tangents, lineW, 0),
      new THREE.MeshBasicMaterial({ color: LANE_YELLOW })
    );
    line.position.y = 0.008;
    scene.add(line);
  }
  if (!style.center && !style.sides) return; // 골목길·단지내도로는 점선도 없다

  // 점선은 전체 폴리라인을 따라 누적 거리로 간격을 재서 찍는다 — 직선/곡선 구분 없이 같은
  // 방식이라 곡선 구간에서도 점선 간격이 고르게 이어진다.
  const dashLen = 3 * WORLD_SCALE;
  const gapLen = 3 * WORLD_SCALE;
  const step = dashLen + gapLen;
  function pushDashes(offset, list) {
    let dist = 0;
    let nextDashAt = step / 2;
    for (let i = 0; i < n - 1; i++) {
      const [x1, z1] = pts[i];
      const [x2, z2] = pts[i + 1];
      const dx = x2 - x1, dz = z2 - z1;
      const segLen = Math.hypot(dx, dz);
      if (segLen > 1e-6) {
        const yaw = Math.atan2(dx, dz);
        const perpX = -dz / segLen, perpZ = dx / segLen;
        while (nextDashAt < dist + segLen) {
          const t = (nextDashAt - dist) / segLen;
          list.push({ x: x1 + dx * t + perpX * offset, z: z1 + dz * t + perpZ * offset, yaw });
          nextDashAt += step;
        }
        dist += segLen;
      }
    }
  }
  if (style.center === "dashed") pushDashes(0, yellowDashTransforms);
  if (style.sides) {
    const sideOffset = roadW * 0.25;
    pushDashes(-sideOffset, whiteDashTransforms);
    pushDashes(sideOffset, whiteDashTransforms);
  }
}

function buildDashInstances(transforms, color) {
  if (!transforms.length) return;
  const dashLen = 3 * WORLD_SCALE;
  const dashGeo = new THREE.PlaneGeometry(0.18 * WORLD_SCALE, dashLen);
  dashGeo.rotateX(-Math.PI / 2);
  const laneMat = new THREE.MeshBasicMaterial({ color });
  const inst = new THREE.InstancedMesh(dashGeo, laneMat, transforms.length);
  const dummy = new THREE.Object3D();
  transforms.forEach((t, i) => {
    dummy.position.set(t.x, 0.01, t.z);
    dummy.rotation.set(0, t.yaw, 0);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  });
  inst.instanceMatrix.needsUpdate = true;
  scene.add(inst);
}

function buildLaneDashes() {
  buildDashInstances(yellowDashTransforms, LANE_YELLOW);
  buildDashInstances(whiteDashTransforms, LANE_WHITE);
}

// 구간을 따로따로 그리면 꺾이는 지점마다 바깥쪽에 틈이 생겨서 끊겨 보인다 — 같은 지점에서
// 만나는 구간들의 "바깥쪽 모서리"(끝점에서 각 도로 폭의 절반만큼 양옆으로 벌어진 두 점)를
// 전부 모아 컨벡스헐(convex hull)로 감싸는 각진 폴리곤 하나로 이음매를 메운다. 예전엔 그냥
// 둥근 판을 깔았는데, 교차로마다 다 동그랗게 보여서(실제 도로 모양과 안 맞아서) 각 도로의
// 진짜 폭·방향을 따라가는 다각형으로 바꿨다. (곡선 내부는 이미 리본 하나로 매끈하게 이어지니,
// 여기서는 map_editor에서 실제로 서로 다른 구간으로 그린 것들의 진짜 끝점만 본다.)
function roadEndpointCorners(seg, which) {
  const pts = roadPolyline(seg);
  const n = pts.length;
  const point = which === "a" ? pts[0] : pts[n - 1];
  const [tx0, tz0] = which === "a"
    ? [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]]
    : [pts[n - 1][0] - pts[n - 2][0], pts[n - 1][1] - pts[n - 2][1]];
  const len = Math.hypot(tx0, tz0) || 1;
  const px = -tz0 / len, pz = tx0 / len; // 진행 방향에 수직인 단위벡터
  const half = seg.width / 2;
  return [
    [point[0] + px * half, point[1] + pz * half],
    [point[0] - px * half, point[1] - pz * half],
  ];
}

// Andrew's monotone chain — raw(x,z) 평면에서 컨벡스헐을 구해 점을 둘러싸는 순서로 반환한다.
function convexHull2D(points) {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function buildJunctionFillers() {
  const endpoints = [];
  ROAD_SEGMENTS.forEach((seg) => {
    endpoints.push({ x: seg.a[0], z: seg.a[1], seg, which: "a" });
    endpoints.push({ x: seg.b[0], z: seg.b[1], seg, which: "b" });
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
    const cornerPts = group.flatMap((p) => roadEndpointCorners(p.seg, p.which));
    const hull = convexHull2D(cornerPts);
    if (hull.length < 3) continue;
    const positions = [];
    hull.forEach(([x, z]) => positions.push(x * WORLD_SCALE, 0, z * WORLD_SCALE));
    const indices = [];
    for (let k = 1; k < hull.length - 1; k++) indices.push(0, k, k + 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const filler = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x4a4a4e, side: THREE.DoubleSide }));
    filler.position.y = 0.006;
    filler.receiveShadow = true;
    scene.add(filler);
  }
}

function buildRoads() {
  yellowDashTransforms = [];
  whiteDashTransforms = [];
  ROAD_SEGMENTS.forEach(buildRoadRibbon);
  buildLaneDashes();
  buildJunctionFillers();
}

// ── 가로등: 도로를 따라 일정 간격으로 세운다 ──
// 장식용 인스턴스라(걷기 로직과 무관) 폴리라인을 누적 거리로 훑으며 자리를 찍는 건 차선
// 점선과 같은 패턴이다. 도로의 어느 쪽(좌/우)에 세울지는 새로고침마다 바뀌면 이상해서,
// 구간 좌표로 만든 간단한 해시로 도로마다 고정된 쪽을 고른다.
// (주차된 차도 같은 방식으로 만들어 봤는데 그래픽 과부하가 느껴진다고 해서 뺐다.)
const STREETLIGHT_SPACING = 20 * WORLD_SCALE;
const STREETLIGHT_MARGIN = 4 * WORLD_SCALE;
const STREETLIGHT_POLE_HEIGHT = 5 * WORLD_SCALE;
const STREETLIGHT_OFFSET_GAP = 0.8 * WORLD_SCALE; // 도로 가장자리에서 바깥으로 더 띄우는 여유

function hashSeed(...parts) {
  let h = 0;
  const s = parts.join(",");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function polylineLength(pts) {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  return total;
}

// 폴리라인(pts, 이미 WORLD_SCALE 적용됨)을 따라 누적 거리 dist만큼 간 지점과 그 자리의
// 진행방향(단위벡터)을 돌려준다.
function pointAlongPolyline(pts, dist) {
  let remain = dist;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[i + 1];
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz) || 1e-6;
    if (remain <= len || i === pts.length - 2) {
      const t = Math.max(0, Math.min(1, remain / len));
      return { x: x1 + dx * t, z: z1 + dz * t, dirX: dx / len, dirZ: dz / len };
    }
    remain -= len;
  }
  const [x, z] = pts[pts.length - 1];
  return { x, z, dirX: 1, dirZ: 0 };
}

let streetlightTransforms = []; // { x, z, yaw }

function placeRoadsideProps(seg) {
  const pts = roadPolyline(seg).map(([x, z]) => [x * WORLD_SCALE, z * WORLD_SCALE]);
  const total = polylineLength(pts);
  if (total < 1e-3) return;
  const roadW = seg.width * WORLD_SCALE;

  const lightSide = hashSeed(seg.a[0], seg.a[1], seg.b[0], seg.b[1], "light") % 2 === 0 ? 1 : -1;
  for (let d = STREETLIGHT_MARGIN; d <= total - STREETLIGHT_MARGIN; d += STREETLIGHT_SPACING) {
    const { x, z, dirX, dirZ } = pointAlongPolyline(pts, d);
    const px = -dirZ, pz = dirX;
    const offset = roadW / 2 + STREETLIGHT_OFFSET_GAP;
    streetlightTransforms.push({ x: x + px * offset * lightSide, z: z + pz * offset * lightSide, yaw: Math.atan2(dirX, dirZ) });
  }
}

function buildStreetlights() {
  if (!streetlightTransforms.length) return;
  const poleGeo = new THREE.CylinderGeometry(0.06 * WORLD_SCALE, 0.08 * WORLD_SCALE, STREETLIGHT_POLE_HEIGHT, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x33363c });
  const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, streetlightTransforms.length);
  const headGeo = new THREE.SphereGeometry(0.28 * WORLD_SCALE, 8, 6);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff1c2 }); // 조명 없이도 켜진 것처럼 보이게 unlit 재질
  const headInst = new THREE.InstancedMesh(headGeo, headMat, streetlightTransforms.length);
  const dummy = new THREE.Object3D();
  streetlightTransforms.forEach((t, i) => {
    dummy.position.set(t.x, STREETLIGHT_POLE_HEIGHT / 2, t.z); // 기둥 밑동이 땅(y=0)에 닿도록
    dummy.rotation.set(0, t.yaw, 0);
    dummy.updateMatrix();
    poleInst.setMatrixAt(i, dummy.matrix);
    dummy.position.y = STREETLIGHT_POLE_HEIGHT + 0.15 * WORLD_SCALE; // 기둥 꼭대기 위에 등 얹기
    dummy.updateMatrix();
    headInst.setMatrixAt(i, dummy.matrix);
  });
  poleInst.instanceMatrix.needsUpdate = true;
  headInst.instanceMatrix.needsUpdate = true;
  poleInst.castShadow = true;
  scene.add(poleInst, headInst);
}

function buildRoadsideProps() {
  streetlightTransforms = [];
  ROAD_SEGMENTS.forEach(placeRoadsideProps);
  buildStreetlights();
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
// 가시성(visibleRangeFor)과 같은 이유로, 107동(id 7) glb의 로딩/언로딩 거리도 그 동만 늘려야
// 한다 — 안 그러면 모델은 영영 안 불려오거나(300m 밖에서 로드 시도) 보이자마자 지워진다.
function modelLoadRangeFor(id) {
  return visibleRangeFor(id);
}
function modelUnloadRangeFor(id) {
  return modelLoadRangeFor(id) * 1.3;
}
const MODEL_STREAM_CHECK_INTERVAL = 0.4; // 매 프레임 전부 검사하면 낭비라 이 간격으로만 확인한다
const modelStreamEntries = []; // buildPlaces가 model이 있는 장소마다 하나씩 채운다
const placeVisibilityEntries = []; // model이 없는 장소(플레이스홀더만 있는 건물)의 group 목록

// ── 캐릭터 지면 높이(단차) ──
// buildPlaces가 장소마다 하나씩 채운다. 건물은 캐릭터가 그냥 뚫고 지나다닐 수 있고,
// 단차가 있는 곳(place.y가 있는 곳)만 그 건물을 둘러싼 더 넓은 발판(스커트 영역, 실제로
// 그려지는 벽 크기와 맞춤)을 캐릭터가 올라서서 걸어 다닐 수 있는 높은 지면으로 쓴다
// (groundPlatforms). 도로는 전부 평평(y=0)해서 따로 다룰 게 없다.
const groundPlatforms = [];
// 금호파크힐스 101~116동(+우리집)은 실제 .glb 모델의 바운딩박스를 재서 얻은 진짜 가로·세로
// (raw 미터, PLACES의 x·z와 같은 단위)를 알고 있어서, 충돌 판정은 TYPE_STYLE의 뭉뚱그린
// 22×13 대신 이 실측값을 쓴다 — 다른 건물은 아직 실측이 없어 TYPE_STYLE 크기로 대신한다.
// 2026-11-21 밤: 모델을 새로 바꾸면서 크기가 많이 달라져 다시 쟀다. 7(102·106·107·108
// 커뮤니티동)은 모델 전체가 아주 넓은 공용 마당까지 포함하고 있어서, 실제로 막아야 할 건물
// 덩어리만 대충 감싸는 값(160×90)을 따로 어림잡아 넣었다 — 공용 마당까지 다 막으면 오히려
// 지나다닐 수 있어야 할 자리까지 막힌다.
const BUILDING_FOOTPRINT_OVERRIDE = {
  0: [18, 29], 1: [18.3, 29], 3: [42, 49], 4: [136, 113], 5: [64.25, 42.15],
  7: [254, 158], 9: [12.6, 11.15], 10: [16.6, 11.15], 11: [16, 11.6], 12: [18.3, 29],
  14: [14.9, 23.8], 15: [15.2, 11], 16: [10.2, 8.3],
};
// loadPlaceModelInto는 기본적으로 모델의 가장 낮은 점(box.min.y)을 "바닥"으로 보고 그만큼
// 들어올리는데, 66(금북초)은 모델 안에 계단 밑·배수구처럼 본 바닥(y=0, 정점 대부분이 몰린
// 지점으로 확인함)보다 1m 더 낮은 작은 부분이 있어서 그 점이 최소값으로 잡혀 건물 전체가
// 1m 위로 들려 올라갔다 — 캐릭터가 허리까지 파묻혀 보이는 원인이었다(2026-11-22). 이렇게
// box.min.y가 진짜 바닥이 아닌 모델은 여기 id별로 "진짜 바닥 높이"를 직접 넣어 덮어쓴다.
const MODEL_FLOOR_OVERRIDE = { 66: 0 };
function worldToLocalXZ(x, z, cx, cz, cos, sin) {
  const dx = x - cx;
  const dz = z - cz;
  return [dx * cos - dz * sin, dx * sin + dz * cos];
}
function insideRect(x, z, cx, cz, cos, sin, halfW, halfD) {
  const [lx, lz] = worldToLocalXZ(x, z, cx, cz, cos, sin);
  return Math.abs(lx) <= halfW && Math.abs(lz) <= halfD;
}
// 캐릭터가 서 있는 자리의 지면 높이 — 단차가 있는 건물의 발판 위면 그 높이, 아니면 기본(0)
function groundHeightAt(x, z) {
  for (const p of groundPlatforms) {
    if (insideRect(x, z, p.cx, p.cz, p.cos, p.sin, p.halfW, p.halfD)) return p.y;
  }
  return 0;
}
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
  gltfLoader.load(
    `${entry.place.model}?v=${ASSET_VERSION}`,
    (gltf) => {
      entry.loading = false;
      // 로딩하는 동안 캐릭터가 다시 멀어졌으면 받아 둔 모델을 바로 버린다
      const curDist = character ? Math.hypot(character.position.x - entry.px, character.position.z - entry.pz) : Infinity;
      if (curDist > modelUnloadRangeFor(entry.place.id)) return;
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
      const floorY = MODEL_FLOOR_OVERRIDE[entry.place.id] ?? box.min.y;
      model.position.y -= floorY;
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
    if (dist <= modelLoadRangeFor(entry.place.id)) {
      if (!entry.loadedModel && !entry.loading) loadPlaceModelInto(entry);
    } else if (dist > modelUnloadRangeFor(entry.place.id) && entry.loadedModel) {
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
    // 충돌·단차 발판·스커트 크기에 쓸 "진짜" 가로·세로 — 실측값이 있으면 그걸, 없으면 위의
    // 뭉뚱그린 TYPE_STYLE 크기를 그대로 쓴다(플레이스홀더 박스 크기는 건드리지 않는다).
    const footprintOverride = BUILDING_FOOTPRINT_OVERRIDE[place.id];
    const colW = footprintOverride ? footprintOverride[0] * WORLD_SCALE : w;
    const colD = footprintOverride ? footprintOverride[1] * WORLD_SCALE : d;
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
        new THREE.BoxGeometry(colW * 1.4, Math.abs(groundY), colD * 1.4),
        new THREE.MeshStandardMaterial({ color: 0x9a9488 })
      );
      skirt.position.set(0, -groundY / 2, 0); // group 기준 로컬 좌표 — group.position.y와 합쳐지면 실제 지면(y=0)까지 이어진다
      skirt.castShadow = true;
      skirt.receiveShadow = true;
      group.add(skirt);
    }

    // 좌표(place.x/z)는 있어도 아직 모델(place.model)이 없는 자리는 가짜 박스를 세워 두지
    // 않고 그냥 빈 땅으로 둔다 — 라벨(이름표)은 아래에서 그대로 띄운다. 모델이 생기면 그때
    // 자동으로 건물이 나타난다.
    if (place.model) {
      // 지면 높이(단차) 등록 — 실제로 뜨는 모델의 회전(rotationDeg, 없으면 대각선 배치 rotY)을
      // 그대로 써서, 눈에 보이는 건물 자리와 발판 자리가 어긋나지 않게 한다.
      const colRot = place.rotationDeg != null ? THREE.MathUtils.degToRad(place.rotationDeg) : rotY;
      const cos = Math.cos(colRot);
      const sin = Math.sin(colRot);
      if (groundY !== 0) {
        groundPlatforms.push({ cx: px, cz: pz, cos, sin, halfW: (colW * 1.4) / 2, halfD: (colD * 1.4) / 2, y: groundY });
      }

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
    } else {
      // 모델이 없어도 group(스커트 포함)은 거리 기준으로 보이기/숨기기 대상에 그대로 올린다.
      placeVisibilityEntries.push({ place, px, pz, group });
    }

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
    gltfLoader.load(
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
  gltfLoader.load(
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
  gltfLoader.load(
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
    const curX = character.position.x;
    const curZ = character.position.z;
    // 건물을 막는 벽으로 쓰지 않아서, 건물 자리든 어디든 그냥 뚫고 지나다닐 수 있다.
    let nx = curX + dir.x * speed * dt;
    let nz = curZ + dir.z * speed * dt;
    nx = Math.max(AREA_MIN_X + 1, Math.min(AREA_MAX_X - 1, nx));
    nz = Math.max(AREA_MIN_Z + 1, Math.min(AREA_MAX_Z - 1, nz));
    character.position.x = nx;
    character.position.z = nz;
    character.rotation.y = Math.atan2(dir.x, dir.z);
  }
  // 서 있는 자리의 지면 높이(단차 있는 건물의 발판 위인지)에 맞춰 매 프레임 조금씩 따라가게
  // 해서, 뚝 끊기지 않고 비탈을 오르내리듯 자연스럽게 높이가 바뀌게 한다.
  const targetGroundY = groundHeightAt(character.position.x, character.position.z);
  character.position.y += (targetGroundY - character.position.y) * Math.min(1, dt * 6);
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
    // 113동 중 북서쪽으로 뻗은 날개(WingA)가 건물 중심 쪽(동)·북쪽 모서리에서 북동쪽을 보고
    // 있는 1-2호 출입구 앞 — 실제 모델(place_금파힐113.glb)을 rotationDeg(67.4°) 그대로 적용해
    // 불러온 뒤 그 날개의 월드 좌표 바운딩박스 모서리를 구해서(2026-11-21), 거기서 북동쪽으로
    // 3m 더 나가 선 자리다.
    character.position.set(1.3, 0, -1.31);
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
