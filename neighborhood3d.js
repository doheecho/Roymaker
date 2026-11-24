// ── 거리 모험 (프린세스메이커 무사수행 느낌의 아주 기본적인 버전) ──
// 실제 동네를 그대로 옮기는 건 접고, 평범한 한국 거리를 흉내 낸 가상의 길을 만들어서
// 그 위를 걸어 다니며 동전을 줍고 불량배를 처리해 용돈을 버는 걸로 바꿨다.
// walk.glb(이로이 3D 모델 + Walking/Running/Idle/Regular_Jump 등 20개 동작),
// dance.glb(춤 동작들)는 그대로 쓴다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PLACES, ROAD_SEGMENTS, TREES, PARKS } from "./map_data.js?v=20261123c";
import { computeRoadMarkings, markedRanges, slicePolyline } from "./road_markings.js?v=20261124e";

const ASSET_VERSION = "20261124e";

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
// 거리 모험을 본편 능력치와 연결한다 — 스트레스·비행화가 높을수록 불량배가 늘고, 인싸력이
// 충분하면 친구가 동네에 나와 있어서 만나 놀 수 있다(main.js의 getAdventureStatContext로 읽어온다).
const ENEMY_COUNT_MAX = 10;
const ENEMY_STRESS_THRESHOLD = 50; // 이 값을 넘는 스트레스 10점마다 불량배 +1
const ENEMY_STRESS_STEP = 10;
const ENEMY_DELINQUENCY_STEP = 15; // 비행화 15점마다 불량배 +1
const FRIEND_INSA_THRESHOLD = 30; // 인싸력이 이 이상이면 친구가 등장한다
function enemyCountForStats(ctx) {
  const stressBonus = Math.max(0, Math.floor((ctx.stress - ENEMY_STRESS_THRESHOLD) / ENEMY_STRESS_STEP));
  const delinquencyBonus = Math.floor(ctx.delinquency / ENEMY_DELINQUENCY_STEP);
  return Math.min(ENEMY_COUNT_MAX, ENEMY_COUNT + stressBonus + delinquencyBonus);
}

let renderer, scene, camera, clock, mixer, character;
let actions = {};
let currentAction = null;
let rafId = null;
let ready = false;
let loading = false;
let canvasEl, loadingEl, danceBtnEl, walkBtnEl, runBtnEl, jumpBtnEl, momBtnEl, hudEl, toastEl, resetBtnEl, dpadEl;
let wrapEl, fullscreenBtnEl, exitFullscreenBtnEl, topZoneEl, exitBtnHideTimer = null;
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
let friend = null; // { mesh, met } — 인싸력이 충분할 때만 한 명 등장(없으면 null)

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
// 카메라가 보는 지점(피벗) 높이 — 여기를 낮추면 카메라가 아무리 가까이·어떤 각도로 돌아도
// 그 높이를 중심으로 프레임이 잡힌다(회전은 이 점을 중심으로 도는 것뿐이라, 각도를 돌리는
// 걸로는 "얼굴만 꽉 차 보이는" 구도 자체를 못 바꾼다 — 피벗 높이 자체를 내려야 한다).
// 머리 높이(옛 CHAR_SCALE=0.5 기준 0.6 → 지금 CHAR_SCALE=0.25면 비례상 0.3)보다도 더 내려서
// 가슴께에 둬, 최대로 확대해도 얼굴만이 아니라 상반신까지 같이 보이게 했다(2026-11-22).
const CAM_LOOK_Y = 0.2;
const CHAR_SCALE = 0.25; // 이로이·엄마는 원래의 1/4 크기 — 15층 건물 대비 실제 사람 키 비율에 더 가깝게(2026-11-22, 기존 1/2에서 한 번 더 줄임)
const CAM_DIST_MIN = 0.4; // 더 바짝 확대할 수 있게 더 줄임(2026-11-22, 기존 0.75에서)
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
const labelWorldPos = new THREE.Vector3();
function updateLabelScales() {
  if (!camera || !canvasEl) return;
  const canvasH = canvasEl.clientHeight || 1;
  const halfFovRad = (camera.fov / 2) * (Math.PI / 180);
  // scale.y 값이 이것일 때 화면에 LABEL_TARGET_FONT_PX만큼의 "전체 배지 높이"로 보인다
  // (목표는 글자 크기 14px이고, 배지 전체 높이는 캔버스에서 글자가 차지하는 비율만큼 더 크다)
  const badgeTargetPx = LABEL_TARGET_FONT_PX * ((LABEL_FONT_SIZE + LABEL_PAD_Y * 2) / LABEL_FONT_SIZE);
  const targetScaleY = (badgeTargetPx * 2 * Math.tan(halfFovRad)) / canvasH;
  allLabelSprites.forEach((sprite) => {
    // 불량배·친구 이름표처럼 다른 물체에 붙은 라벨은 월드 위치로 거리를 잰다
    const wp = sprite.parent && sprite.parent !== scene ? sprite.getWorldPosition(labelWorldPos) : sprite.position;
    const dist = Math.max(wp.distanceTo(camera.position), 0.01);
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
  sun.shadow.mapSize.set(512, 512); // 그림자 맵 512 — 대신 캐릭터 주변만 덮게 좁혀서(updateSunFollow) 선명하다
  Object.assign(sun.shadow.camera, { left: -SHADOW_HALF, right: SHADOW_HALF, top: SHADOW_HALF, bottom: -SHADOW_HALF, near: 0.5, far: 120 });
  scene.add(sun);
  scene.add(sun.target);
  sunLight = sun;

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

  // 움직이지 않는 것들(도로·보도·신호등·가로등·나무·바닥)은 만든 뒤 위치 계산을 고정해 매 프레임 비용을 줄인다
  let before = new Set(scene.children);
  buildParks();
  buildRoads();
  buildRoadsideProps();
  freezeStaticObjects([bg, ...scene.children.filter((o) => !before.has(o))]);
  buildPlaces();
  before = new Set(scene.children);
  buildTrees();
  freezeStaticObjects(scene.children.filter((o) => !before.has(o)));
  // 하늘·차·행인(움직임)은 고정하지 않는다
  buildSky();
  buildCars();
  buildPedestrians();
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
// 교차로 노면표시(road_markings.js): 도로마다 차선을 비울 구간(gaps) + 정지선·횡단보도 사각형(whiteQuads)
let roadMarkings = { gaps: [], whiteQuads: [] };

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
// rank는 도로끼리 겹칠 때(또는 교차로에서) 어느 쪽이 위에 보일지 정하는 우선순위다 — 차선이
// 많은(=더 중요한) 도로일수록 높고, 단지내도로(베이지)가 가장 낮다(사용자 지정, 2026-11-22).
// rank가 다른 두 도로가 평면상 겹치면 숫자가 큰 쪽이 항상 위에 그려진다(surfaceYFor).
function roadStyleFor(width) {
  if (width < 8) return { surface: ROAD_SURFACE_ALLEY, center: null, sides: false, rank: 1 };
  if (width < 11) return { surface: ROAD_SURFACE, center: "dashed", sides: false, rank: 2 };
  if (width < 13) return { surface: ROAD_SURFACE_COMPLEX, center: null, sides: false, rank: 0 };
  if (width < 22) return { surface: ROAD_SURFACE, center: "solid", sides: false, rank: 3 };
  return { surface: ROAD_SURFACE, center: "solid", sides: true, rank: 4 };
}
const ROAD_LAYER_BASE_Y = 0.005;
const ROAD_LAYER_STEP = 0.0015; // 눈에 띄는 단차는 아니고, 겹칠 때 어느 면이 위인지만 확실히 가르는 정도
function surfaceYFor(width) {
  return ROAD_LAYER_BASE_Y + roadStyleFor(width).rank * ROAD_LAYER_STEP;
}

// 보도(인도): 도로 양옆에 깔리는 별도 띠. 건물에셋(기본 -0.01, 예외 +0.02) > 도로(0.005~0.0135)
// > 보도 순으로 보이게, 이 둘의 가장 낮은 자리보다도 더 아래에 둔다(사용자 지정 우선순위).

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
function polylineTangents(pts) {
  const n = pts.length;
  return pts.map((p, i) => {
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
}

function buildRoadRibbon(seg, segIndex) {
  const rawPts = roadPolyline(seg);
  const pts = rawPts.map(([x, z]) => [x * WORLD_SCALE, z * WORLD_SCALE]);
  const n = pts.length;
  const roadW = seg.width * WORLD_SCALE;
  const tangents = polylineTangents(pts);
  // 교차로 안쪽 등 차선을 긋지 않는 구간(raw, a 끝에서 잰 거리)
  const gaps = roadMarkings.gaps[segIndex] || [];
  let rawLen = 0;
  for (let i = 1; i < rawPts.length; i++) rawLen += Math.hypot(rawPts[i][0] - rawPts[i - 1][0], rawPts[i][1] - rawPts[i - 1][1]);
  const ranges = markedRanges(rawLen, gaps);

  const style = roadStyleFor(seg.width);
  const surfaceY = surfaceYFor(seg.width);
  const road = new THREE.Mesh(
    buildRibbonGeometry(pts, tangents, roadW, 0),
    new THREE.MeshStandardMaterial({ color: style.surface, side: THREE.DoubleSide })
  );
  road.position.y = surfaceY;
  road.receiveShadow = true;
  scene.add(road);

  if (style.center === "solid") {
    const lineW = Math.max(0.25 * WORLD_SCALE, roadW * 0.015);
    const lineMat = new THREE.MeshBasicMaterial({ color: LANE_YELLOW });
    for (const [s0, s1] of ranges) {
      const sub = slicePolyline(rawPts, s0, s1).map(([x, z]) => [x * WORLD_SCALE, z * WORLD_SCALE]);
      const line = new THREE.Mesh(buildRibbonGeometry(sub, polylineTangents(sub), lineW, 0), lineMat);
      line.position.y = surfaceY + 0.002;
      scene.add(line);
    }
  }
  if (!style.center && !style.sides) return; // 골목길·단지내도로는 점선도 없다

  // 점선은 전체 폴리라인을 따라 누적 거리로 간격을 재서 찍는다 — 직선/곡선 구분 없이 같은
  // 방식이라 곡선 구간에서도 점선 간격이 고르게 이어진다.
  const dashLen = 3 * WORLD_SCALE;
  const gapLen = 3 * WORLD_SCALE;
  const step = dashLen + gapLen;
  const dashY = surfaceY + 0.0025;
  const halfDashRaw = dashLen / WORLD_SCALE / 2;
  const inGap = (sRaw) => gaps.some(([g0, g1]) => sRaw + halfDashRaw > g0 && sRaw - halfDashRaw < g1);
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
          if (inGap(nextDashAt / WORLD_SCALE)) { nextDashAt += step; continue; }
          list.push({ x: x1 + dx * t + perpX * offset, z: z1 + dz * t + perpZ * offset, yaw, y: dashY });
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

// ── 보도(인도) ──
// 보도 윗면이 기본 지면 높이(SIDEWALK_TOP_Y)이고 도로는 그보다 낮다. 보도·경계선·연석·울타리는
// 도로마다 메시를 만들지 않고 종류별로 하나씩 합쳐 그린다(드로우콜 몇 개뿐).
const SIDEWALK_TILE_RAW = 2.4; // 보도 텍스처 한 장이 덮는 길이(raw m) — 0.3m 블록 8×8
const SIDEWALK_TOP_Y = 0.05; // 보도 윗면 높이 — 도로(0.005~0.0135)보다 연석(턱)만큼 올라와 있다
const SIDEWALK_YELLOW_Y = SIDEWALK_TOP_Y + 0.001; // 황색 경계선은 보도 윗면 바로 위
const CURB_COLOR = 0xb9b4a8;
// 캐릭터가 보도 위에 설 때 쓰는 띠 목록(월드 좌표). 도로 중심선에서 떨어진 거리(inner~outer)가
// 보도 폭 안이면 보도 위로 본다. 교차로(gaps) 구간에는 보도를 깔지 않으니 띠도 만들지 않는다.
const walkBands = [];
const SIDEWALK_YELLOW_W_RAW = 0.45; // 황색 점자블록 띠 폭(raw m)
const SIDEWALK_YELLOW_INSET_RAW = 0.7; // 도로 가장자리에서 이만큼 보도 안쪽에 놓임
const SIDEWALK_SAMPLE_RAW = 0.6; // 보도를 이 간격으로 잘게 나눠서 다른 도로와 겹치는지 판정한다
const SIDEWALK_CORNER_MAX_RAW = 6; // 교차로 모서리 둥글기 최대 반지름(raw m)
// 울타리는 도로마다 맵 에디터에서 켠다(map_data.js의 railing: true) — 보도가 있는 도로에만 생긴다
const RAILING_INSET_RAW = 0.25; // 연석에서 보도 안쪽으로 이만큼
const RAILING_POST_SPACING_RAW = 2.5;
const RAILING_H = 0.1; // 울타리 높이(월드 단위, 보도 윗면 기준)
const RAILING_COLOR = 0x5b6068;
let sidewalkTexture = null;
// 회색 보도블록 — 0.3m 정사각 블록에 군데군데 진한 블록이 섞인 무늬(사진 속 인도처럼)
function getSidewalkTexture() {
  if (sidewalkTexture) return sidewalkTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#bdbdba";
  g.fillRect(0, 0, 256, 256);
  let seed = 12345;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = 8, cs = 256 / n;
  for (let r = 0; r < n; r++) {
    for (let k = 0; k < n; k++) {
      const v = rnd();
      g.fillStyle = v < 0.16 ? "#8b8c8e" : v < 0.3 ? "#acadaf" : v < 0.62 ? "#d2d2cf" : "#dcdcd9";
      g.fillRect(k * cs + 1, r * cs + 1, cs - 2, cs - 2);
    }
  }
  sidewalkTexture = new THREE.CanvasTexture(c);
  sidewalkTexture.colorSpace = THREE.SRGBColorSpace;
  sidewalkTexture.wrapS = sidewalkTexture.wrapT = THREE.RepeatWrapping;
  sidewalkTexture.anisotropy = 4;
  return sidewalkTexture;
}

// 여러 도로의 띠를 한 묶음(positions/uvs/indices)으로 모은다
function newRibbonStore() { return { pos: [], uv: [], idx: [] }; }
function storeToGeometry(store) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(store.pos, 3));
  if (store.uv.length) geo.setAttribute("uv", new THREE.Float32BufferAttribute(store.uv, 2));
  geo.setIndex(store.idx);
  geo.computeVertexNormals();
  return geo;
}
// 띠 하나(안쪽 점들 A, 바깥 점들 B, 높이 y)를 추가 — 텍스처는 평면 좌표로 입힌다
function pushStrip(store, A, B, y = 0) {
  const base = store.pos.length / 3;
  const tileW = SIDEWALK_TILE_RAW * WORLD_SCALE;
  for (let k = 0; k < A.length; k++) {
    store.pos.push(A[k][0], y, A[k][1], B[k][0], y, B[k][1]);
    store.uv.push(A[k][0] / tileW, A[k][1] / tileW, B[k][0] / tileW, B[k][1] / tileW);
  }
  for (let k = 0; k < A.length - 1; k++) {
    const a0 = base + k * 2, a1 = a0 + 1, b0 = a0 + 2, b1 = a0 + 3;
    store.idx.push(a0, b0, a1, a1, b0, b1);
  }
}
// 수평 점들을 따라 y0~y1 높이로 세운 면(연석·받침 벽)
function pushVerticalQuadStrip(store, pts2d, y0 = 0, y1 = SIDEWALK_TOP_Y) {
  const base = store.pos.length / 3;
  for (const [x, z] of pts2d) store.pos.push(x, y0, z, x, y1, z);
  for (let i = 0; i < pts2d.length - 1; i++) {
    const a0 = base + i * 2, a1 = a0 + 1, b0 = a0 + 2, b1 = a0 + 3;
    store.idx.push(a0, b0, a1, a1, b0, b1);
  }
}

// 두 점 사이 거리(캐릭터 발밑 판정용)
function distToSegment(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az;
  const len2 = vx * vx + vz * vz || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / len2));
  return Math.hypot(px - (ax + vx * t), pz - (az + vz * t));
}
function pointInPolygon(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi || 1e-12) + xi) inside = !inside;
  }
  return inside;
}

// 도로들의 중심선·반폭(월드) — 보도·건물이 도로 위로 넘어가지 않게 판정할 때 쓴다(도로 우선)
let roadFootprintsCache = null;
function buildRoadFootprints() {
  if (roadFootprintsCache) return roadFootprintsCache;
  roadFootprintsCache = ROAD_SEGMENTS.map((seg, i) => {
    const pts = roadPolyline(seg).map(([x, z]) => [x * WORLD_SCALE, z * WORLD_SCALE]);
    const xs = pts.map((q) => q[0]), zs = pts.map((q) => q[1]);
    return {
      index: i, pts, half: (seg.width * WORLD_SCALE) / 2,
      minx: Math.min(...xs), maxx: Math.max(...xs), minz: Math.min(...zs), maxz: Math.max(...zs),
    };
  });
  return roadFootprintsCache;
}
// (x,z)가 ignore에 없는 도로 위(반폭 + margin 안)인가
function pointOnRoad(x, z, ignore, margin = 0.015) {
  for (const f of buildRoadFootprints()) {
    if (ignore && ignore.has(f.index)) continue;
    const m = f.half + margin;
    if (x < f.minx - m || x > f.maxx + m || z < f.minz - m || z > f.maxz + m) continue;
    for (let i = 0; i < f.pts.length - 1; i++) {
      const [ax, az] = f.pts[i], [bx, bz] = f.pts[i + 1];
      if (distToSegment(x, z, ax, az, bx, bz) <= m) return true;
    }
  }
  return false;
}

// 도로 끝마다, 거기서 "그냥 이어지는" 도로가 하나만 있으면(끝점 2개가 모이는 곳 = 교차로 아님) 그 번호를 적어 둔다
const JOIN_RAW = 14; // road_markings.js의 교차로 묶음 거리와 같은 값
function buildRoadConnections() {
  const ends = [];
  ROAD_SEGMENTS.forEach((seg, i) => {
    ends.push({ i, which: "a", x: seg.a[0], z: seg.a[1] });
    ends.push({ i, which: "b", x: seg.b[0], z: seg.b[1] });
  });
  const conns = ROAD_SEGMENTS.map(() => ({ a: null, b: null, aWhich: null, bWhich: null }));
  for (const e of ends) {
    const near = ends.filter((o) => o !== e && o.i !== e.i && Math.hypot(o.x - e.x, o.z - e.z) < JOIN_RAW);
    if (near.length !== 1) continue; // 혼자(막다른 길)거나 셋 이상(교차로)
    conns[e.i][e.which] = near[0].i;
    conns[e.i][e.which + "Which"] = near[0].which;
  }
  return conns;
}

// 같은 폭·같은 보도 폭으로 그냥 이어지는 구간들을 한 줄(체인)로 묶는다 — 한 줄로 그리면 이음매에서
// 연석·경계선이 엇갈리거나 겹치지 않고 곡선처럼 매끈하게 이어진다.
function sidewalkCompatible(i, j) {
  const a = ROAD_SEGMENTS[i], b = ROAD_SEGMENTS[j];
  return !!a.sidewalk && !!b.sidewalk && a.width === b.width && a.sidewalk === b.sidewalk && !!a.railing === !!b.railing;
}
function buildSidewalkChains(conns) {
  const link = (i, end) => {
    const j = conns[i][end];
    if (j == null || !sidewalkCompatible(i, j)) return null;
    return { j, jEnd: conns[i][end + "Which"] };
  };
  const opp = (e) => (e === "a" ? "b" : "a");
  const visited = new Set();
  const chains = [];
  ROAD_SEGMENTS.forEach((seg, i) => {
    if (!seg.sidewalk || visited.has(i)) return;
    // 머리 찾기: a 쪽으로 이어진 데까지 거슬러 간다
    let cur = i, freeEnd = "a";
    const seen = new Set([i]);
    for (;;) {
      const l = link(cur, freeEnd);
      if (!l || seen.has(l.j)) break;
      seen.add(l.j);
      cur = l.j;
      freeEnd = opp(l.jEnd);
    }
    // 머리부터 앞으로 훑으며 방향(뒤집힘)까지 기록
    const members = [];
    let c = cur, startEnd = freeEnd;
    for (;;) {
      if (visited.has(c)) break;
      visited.add(c);
      members.push({ idx: c, reversed: startEnd === "b" });
      const l = link(c, opp(startEnd));
      if (!l || visited.has(l.j)) break;
      c = l.j;
      startEnd = l.jEnd;
    }
    chains.push(members);
  });
  return chains;
}
// 체인 전체의 중심선(raw)과 교차로 구간(gaps, 체인 시작에서 잰 거리)
function chainGeometry(members) {
  const pts = [];
  const gaps = [];
  let offset = 0;
  members.forEach((m) => {
    let p = roadPolyline(ROAD_SEGMENTS[m.idx]).map((q) => [q[0], q[1]]);
    if (m.reversed) p.reverse();
    let L = 0;
    for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (pts.length) {
      const last = pts[pts.length - 1];
      const jump = Math.hypot(p[0][0] - last[0], p[0][1] - last[1]);
      if (jump < 1e-6) p = p.slice(1);
      else offset += jump; // 끝점이 딱 붙지 않은 이음매는 그 틈만큼 거리를 더한다
    }
    pts.push(...p);
    (roadMarkings.gaps[m.idx] || []).forEach(([g0, g1]) => {
      let a = Math.max(0, g0), b = Math.min(L, g1);
      if (b <= a) return;
      if (m.reversed) [a, b] = [L - b, L - a];
      gaps.push([offset + a, offset + b]);
    });
    offset += L;
  });
  gaps.sort((p, q) => p[0] - q[0]);
  const merged = [];
  for (const g of gaps) {
    if (merged.length && g[0] <= merged[merged.length - 1][1]) merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], g[1]);
    else merged.push([...g]);
  }
  return { pts, gaps: merged, len: offset };
}

// 보도 한 체인: 0.6m 간격 단면을 만들고, 다른 도로 위에 걸친 단면은 빼고(도로 우선) 띠·연석·경계선·울타리를 만든다
function collectChainSidewalk(members, stores, conns) {
  const first = ROAD_SEGMENTS[members[0].idx];
  const { pts: rawPts, gaps, len: rawLen } = chainGeometry(members);
  if (rawPts.length < 2) return;
  const roadW = first.width * WORLD_SCALE;
  const sideW = first.sidewalk * WORLD_SCALE;
  const lineW = SIDEWALK_YELLOW_W_RAW * WORLD_SCALE;
  const inset = SIDEWALK_YELLOW_INSET_RAW * WORLD_SCALE;
  const railOff = RAILING_INSET_RAW * WORLD_SCALE;
  // 이 체인의 구간들과, 거기에 단순 이음매로 붙은 도로는 "다른 도로"로 치지 않는다
  const ignore = new Set();
  members.forEach((m) => {
    ignore.add(m.idx);
    if (conns[m.idx].a != null) ignore.add(conns[m.idx].a);
    if (conns[m.idx].b != null) ignore.add(conns[m.idx].b);
  });
  for (const [s0, s1] of markedRanges(rawLen, gaps)) {
    const sub = slicePolyline(rawPts, s0, s1);
    if (sub.length < 2) continue;
    const pts = sub.map(([x, z]) => [x * WORLD_SCALE, z * WORLD_SCALE]);
    for (let i = 0; i < pts.length - 1; i++) {
      walkBands.push({ ax: pts[i][0], az: pts[i][1], bx: pts[i + 1][0], bz: pts[i + 1][1], inner: roadW / 2, outer: roadW / 2 + sideW });
    }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1];
    const h = SIDEWALK_SAMPLE_RAW * WORLD_SCALE;
    const stations = [];
    for (let d = 0; d < L; d += h) stations.push(d);
    stations.push(L);
    // 단면의 방향은 앞뒤 점을 같이 보고 정해서(이음매에서 꺾이는 각을 나눠 가짐) 보도가 매끈하게 돈다
    const samples = stations.map((d) => {
      const q = pointAlongPolyline(pts, d);
      const q0 = pointAlongPolyline(pts, Math.max(0, d - h * 0.5));
      const q1 = pointAlongPolyline(pts, Math.min(L, d + h * 0.5));
      let tx = q0.dirX + q1.dirX, tz = q0.dirZ + q1.dirZ;
      const tl = Math.hypot(tx, tz) || 1;
      return { x: q.x, z: q.z, tx: tx / tl, tz: tz / tl, d };
    });
    [-1, 1].forEach((dir) => {
      const secs = samples.map((q) => {
        const nx = -q.tz * dir, nz = q.tx * dir; // 도로 바깥쪽 법선
        const at = (o) => [q.x + nx * o, q.z + nz * o];
        const mid = at(roadW / 2 + sideW / 2);
        return { q, at, inner: at(roadW / 2), outer: at(roadW / 2 + sideW), blocked: pointOnRoad(mid[0], mid[1], ignore) };
      });
      let run = [];
      const flush = () => {
        if (run.length >= 2) {
          const A = run.map((r) => r.inner), B = run.map((r) => r.outer);
          pushStrip(stores.side, A, B);
          if (run.length >= 6) {
            // 행인이 걸을 보도 중앙선(월드 좌표)
            const mid = run.map((r) => r.at(roadW / 2 + sideW * 0.62));
            const pcum = [0];
            for (let i = 1; i < mid.length; i++) pcum.push(pcum[i - 1] + Math.hypot(mid[i][0] - mid[i - 1][0], mid[i][1] - mid[i - 1][1]));
            pedPaths.push({ pts: mid, cum: pcum, len: pcum[pcum.length - 1] });
          }
          pushVerticalQuadStrip(stores.curb, A); // 도로 쪽 연석 면
          [run[0], run[run.length - 1]].forEach((r) => pushVerticalQuadStrip(stores.curb, [r.inner, r.outer])); // 구간 끝 단면
          pushStrip(stores.line, run.map((r) => r.at(roadW / 2 + inset)), run.map((r) => r.at(roadW / 2 + inset + lineW)));
          if (first.railing) {
            const o = roadW / 2 + railOff;
            const rw = 0.012;
            pushStrip(stores.rail, run.map((r) => r.at(o - rw)), run.map((r) => r.at(o + rw)), RAILING_H);
            pushStrip(stores.rail, run.map((r) => r.at(o - rw * 0.7)), run.map((r) => r.at(o + rw * 0.7)), RAILING_H * 0.5);
            const spacing = RAILING_POST_SPACING_RAW * WORLD_SCALE;
            let next = run[0].q.d;
            for (const r of run) {
              if (r.q.d + 1e-6 >= next) {
                const p = r.at(o);
                stores.posts.push(p);
                next = r.q.d + spacing;
              }
            }
            const lastP = run[run.length - 1].at(o);
            stores.posts.push(lastP);
          }
        }
        run = [];
      };
      for (const sec of secs) {
        if (sec.blocked) flush();
        else run.push(sec);
      }
      flush();
    });
  }
}

// 폭이 다른 두 구간이 꺾여서 이어지는 자리(체인이 끊기는 곳): 바깥쪽에 부채꼴 보도를 채워 끊기지 않게 한다
function buildSidewalkJoints(conns, chainOf, stores) {
  const endDir = (seg, which, outward) => {
    const pts = roadPolyline(seg);
    const n = pts.length;
    let dx, dz;
    if (which === "a") { dx = pts[1][0] - pts[0][0]; dz = pts[1][1] - pts[0][1]; }
    else { dx = pts[n - 2][0] - pts[n - 1][0]; dz = pts[n - 2][1] - pts[n - 1][1]; }
    const len = Math.hypot(dx, dz) || 1;
    return outward ? [dx / len, dz / len] : [-dx / len, -dz / len];
  };
  const lineW = SIDEWALK_YELLOW_W_RAW * WORLD_SCALE;
  const inset = SIDEWALK_YELLOW_INSET_RAW * WORLD_SCALE;
  ROAD_SEGMENTS.forEach((seg, i) => {
    ["a", "b"].forEach((which) => {
      const j = conns[i][which];
      if (j == null || j < i) return;
      if (chainOf.get(i) != null && chainOf.get(i) === chainOf.get(j)) return; // 같은 체인이면 이미 한 줄로 이어졌다
      const segJ = ROAD_SEGMENTS[j];
      if (!seg.sidewalk || !segJ.sidewalk) return;
      const whichJ = conns[i][which + "Which"];
      const u = endDir(seg, which, false);
      const v = endDir(segJ, whichJ, true);
      const turn = u[0] * v[1] - u[1] * v[0];
      const angle = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1])));
      if (angle < (2 * Math.PI) / 180) return;
      const pi = which === "a" ? seg.a : seg.b;
      const pj = whichJ === "a" ? segJ.a : segJ.b;
      const P = [((pi[0] + pj[0]) / 2) * WORLD_SCALE, ((pi[1] + pj[1]) / 2) * WORLD_SCALE];
      const ri = (Math.max(seg.width, segJ.width) / 2) * WORLD_SCALE;
      const ro = ri + Math.min(seg.sidewalk, segJ.sidewalk) * WORLD_SCALE;
      const side = turn > 0 ? -1 : 1;
      const n1 = [-u[1] * side, u[0] * side];
      const n2 = [-v[1] * side, v[0] * side];
      const a1 = Math.atan2(n1[1], n1[0]);
      let da = Math.atan2(n2[1], n2[0]) - a1;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      const steps = Math.max(2, Math.ceil(Math.abs(da) / ((8 * Math.PI) / 180)));
      const arc = (r) => {
        const out = [];
        for (let k = 0; k <= steps; k++) {
          const t = a1 + (da * k) / steps;
          out.push([P[0] + Math.cos(t) * r, P[1] + Math.sin(t) * r]);
        }
        return out;
      };
      const inner = arc(ri);
      pushStrip(stores.side, inner, arc(ro));
      pushVerticalQuadStrip(stores.curb, inner);
      pushStrip(stores.line, arc(ri + inset), arc(ri + inset + lineW));
    });
  });
}

// 교차로 모서리: 서로 이웃한 두 길의 보도 끝을 둥근 모서리(연석 곡선)로 이어 준다.
// 두 길의 도로 가장자리 선이 만나는 점(K) 앞에서 반지름 r만큼 곡선으로 돌린다.
function buildSidewalkCorners(stores) {
  const ends = [];
  ROAD_SEGMENTS.forEach((seg, i) => {
    ends.push({ i, which: "a", x: seg.a[0], z: seg.a[1] });
    ends.push({ i, which: "b", x: seg.b[0], z: seg.b[1] });
  });
  const used = new Set();
  const groups = [];
  ends.forEach((e, k) => {
    if (used.has(k)) return;
    const g = [e];
    used.add(k);
    ends.forEach((o, m) => {
      if (!used.has(m) && Math.hypot(o.x - e.x, o.z - e.z) < JOIN_RAW) { g.push(o); used.add(m); }
    });
    if (g.length >= 3) groups.push(g);
  });
  const lineW = SIDEWALK_YELLOW_W_RAW * WORLD_SCALE;
  const inset = SIDEWALK_YELLOW_INSET_RAW * WORLD_SCALE;
  for (const g of groups) {
    const arms = g.map((e) => {
      const seg = ROAD_SEGMENTS[e.i];
      const rawPts = roadPolyline(seg);
      const pts = rawPts.map(([x, z]) => [x * WORLD_SCALE, z * WORLD_SCALE]);
      let rawLen = 0;
      for (let i = 1; i < rawPts.length; i++) rawLen += Math.hypot(rawPts[i][0] - rawPts[i - 1][0], rawPts[i][1] - rawPts[i - 1][1]);
      const n = pts.length;
      // 교차로에서 멀어지는 방향(정렬용)
      let dx, dz;
      if (e.which === "a") { dx = pts[1][0] - pts[0][0]; dz = pts[1][1] - pts[0][1]; }
      else { dx = pts[n - 2][0] - pts[n - 1][0]; dz = pts[n - 2][1] - pts[n - 1][1]; }
      const dl = Math.hypot(dx, dz) || 1;
      const arm = { e, seg, angle: Math.atan2(dz / dl, dx / dl), has: false };
      if (!seg.sidewalk) return arm;
      const ranges = markedRanges(rawLen, roadMarkings.gaps[e.i] || []);
      if (!ranges.length) return arm;
      const sEnd = e.which === "a" ? ranges[0][0] : ranges[ranges.length - 1][1];
      const q = pointAlongPolyline(pts, sEnd * WORLD_SCALE);
      const away = e.which === "a" ? [q.dirX, q.dirZ] : [-q.dirX, -q.dirZ];
      Object.assign(arm, { has: true, P: [q.x, q.z], away, half: (seg.width * WORLD_SCALE) / 2, sw: seg.sidewalk * WORLD_SCALE });
      return arm;
    });
    arms.sort((p, q) => p.angle - q.angle);
    const ignore = new Set(g.map((e) => e.i));
    for (let k = 0; k < arms.length; k++) {
      const A = arms[k], B = arms[(k + 1) % arms.length];
      if (!A.has || !B.has) continue;
      let delta = B.angle - A.angle;
      if (delta <= 0) delta += 2 * Math.PI;
      if (delta > (170 * Math.PI) / 180) continue; // 거의 일직선(또는 그 이상) 사이는 모서리가 아니다
      const nA = [-A.away[1], A.away[0]]; // A의 반시계 쪽(=B 쪽 블록)
      const nB = [B.away[1], -B.away[0]]; // B의 시계 쪽(=A 쪽 블록)
      const IA = [A.P[0] + nA[0] * A.half, A.P[1] + nA[1] * A.half];
      const IB = [B.P[0] + nB[0] * B.half, B.P[1] + nB[1] * B.half];
      const gA = [-A.away[0], -A.away[1]], gB = [-B.away[0], -B.away[1]]; // 교차로 쪽으로
      const dxy = [IB[0] - IA[0], IB[1] - IA[1]];
      const det = -gA[0] * gB[1] + gA[1] * gB[0];
      if (Math.abs(det) < 1e-6) continue;
      const u = (dxy[0] * -gB[1] - dxy[1] * -gB[0]) / det;
      const v = (gA[0] * dxy[1] - gA[1] * dxy[0]) / det;
      if (u < 0 || v < 0) continue;
      const rf = Math.min(u, v, SIDEWALK_CORNER_MAX_RAW * WORLD_SCALE);
      const K = [IA[0] + gA[0] * u, IA[1] + gA[1] * u];
      const TA = [IA[0] + gA[0] * (u - rf), IA[1] + gA[1] * (u - rf)];
      const TB = [IB[0] + gB[0] * (v - rf), IB[1] + gB[1] * (v - rf)];
      const Q = [IA];
      if (u - rf > 1e-4) Q.push(TA);
      const steps = 10;
      for (let s = 1; s < steps; s++) {
        const t = s / steps, w = 1 - t;
        Q.push([w * w * TA[0] + 2 * w * t * K[0] + t * t * TB[0], w * w * TA[1] + 2 * w * t * K[1] + t * t * TB[1]]);
      }
      if (v - rf > 1e-4) Q.push(TB);
      Q.push(IB);
      // 각 점에서 블록 쪽(바깥) 법선
      const W = Math.min(A.sw, B.sw);
      const normals = Q.map((p, idx) => {
        const a = Q[Math.max(0, idx - 1)], b = Q[Math.min(Q.length - 1, idx + 1)];
        let tx = b[0] - a[0], tz = b[1] - a[1];
        const tl = Math.hypot(tx, tz) || 1;
        tx /= tl; tz /= tl;
        let nx = -tz, nz = tx;
        const f = idx / (Q.length - 1);
        const hx = nA[0] * (1 - f) + nB[0] * f, hz = nA[1] * (1 - f) + nB[1] * f;
        if (nx * hx + nz * hz < 0) { nx = -nx; nz = -nz; }
        return [nx, nz];
      });
      const at = (o) => Q.map((p, idx) => [p[0] + normals[idx][0] * o, p[1] + normals[idx][1] * o]);
      const outer = at(W);
      // 모서리가 다른(이 교차로에 속하지 않은) 도로 위로 넘어가면 그 모서리는 만들지 않는다
      const mids = at(W / 2);
      if (mids.some(([x, z]) => pointOnRoad(x, z, ignore))) continue;
      pushStrip(stores.side, Q, outer);
      pushVerticalQuadStrip(stores.curb, Q);
      pushStrip(stores.line, at(inset), at(inset + lineW));
      addPolyPlatform([...Q, ...outer.slice().reverse()], SIDEWALK_TOP_Y);
    }
  }
}

function buildRoadSidewalks() {
  walkBands.length = 0;
  pedPaths.length = 0;
  const stores = { side: newRibbonStore(), line: newRibbonStore(), curb: newRibbonStore(), rail: newRibbonStore(), posts: [] };
  const conns = buildRoadConnections();
  const chains = buildSidewalkChains(conns);
  const chainOf = new Map();
  chains.forEach((members, c) => members.forEach((m) => chainOf.set(m.idx, c)));
  chains.forEach((members) => collectChainSidewalk(members, stores, conns));
  buildSidewalkJoints(conns, chainOf, stores);
  buildSidewalkCorners(stores);
  if (stores.side.idx.length) {
    const mesh = new THREE.Mesh(
      storeToGeometry(stores.side),
      new THREE.MeshStandardMaterial({ map: getSidewalkTexture(), roughness: 1, side: THREE.DoubleSide })
    );
    mesh.position.y = SIDEWALK_TOP_Y;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  if (stores.line.idx.length) {
    const mesh = new THREE.Mesh(storeToGeometry(stores.line), new THREE.MeshBasicMaterial({ color: LANE_YELLOW, side: THREE.DoubleSide }));
    mesh.position.y = SIDEWALK_YELLOW_Y;
    scene.add(mesh);
  }
  if (stores.curb.idx.length) {
    stores.curb.uv.length = 0;
    const mesh = new THREE.Mesh(storeToGeometry(stores.curb), new THREE.MeshStandardMaterial({ color: CURB_COLOR, roughness: 1, side: THREE.DoubleSide }));
    mesh.receiveShadow = true; // 연석은 아주 낮아서 그림자를 드리울 필요가 없다(그림자 계산 절약)
    scene.add(mesh);
  }
  if (stores.rail.idx.length) {
    stores.rail.uv.length = 0;
    const railMat = new THREE.MeshStandardMaterial({ color: RAILING_COLOR, roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(storeToGeometry(stores.rail), railMat);
    mesh.position.y = SIDEWALK_TOP_Y;
    scene.add(mesh);
    if (stores.posts.length) {
      const postGeo = new THREE.BoxGeometry(0.012, RAILING_H, 0.012);
      const posts = new THREE.InstancedMesh(postGeo, railMat, stores.posts.length);
      const dummy = new THREE.Object3D();
      stores.posts.forEach(([x, z], i) => {
        dummy.position.set(x, SIDEWALK_TOP_Y + RAILING_H / 2, z);
        dummy.updateMatrix();
        posts.setMatrixAt(i, dummy.matrix);
      });
      posts.instanceMatrix.needsUpdate = true;
      scene.add(posts);
    }
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
    dummy.position.set(t.x, t.y, t.z);
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
    // 메움판 자체도 우선순위를 따른다 — 만나는 도로 중 rank가 가장 높은 쪽의 색·높이를 쓴다.
    const topSeg = group.reduce((best, p) => (roadStyleFor(p.seg.width).rank > roadStyleFor(best.seg.width).rank ? p : best)).seg;
    const filler = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: roadStyleFor(topSeg.width).surface, side: THREE.DoubleSide }));
    filler.position.y = surfaceYFor(topSeg.width) + 0.0005;
    filler.receiveShadow = true;
    scene.add(filler);
  }
}

// 정지선·횡단보도 줄무늬를 메시 하나로 — 어느 도로 표면보다도 위(가장 높은 rank 위)에 깐다
function buildRoadMarks() {
  const quads = roadMarkings.whiteQuads;
  if (!quads.length) return;
  const positions = [];
  const indices = [];
  quads.forEach((q, k) => {
    q.forEach(([x, z]) => positions.push(x * WORLD_SCALE, 0, z * WORLD_SCALE));
    const b = k * 4;
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: LANE_WHITE, side: THREE.DoubleSide }));
  mesh.position.y = ROAD_LAYER_BASE_Y + 4 * ROAD_LAYER_STEP + 0.003;
  scene.add(mesh);
}

function buildRoads() {
  yellowDashTransforms = [];
  whiteDashTransforms = [];
  roadMarkings = computeRoadMarkings(ROAD_SEGMENTS);
  ROAD_SEGMENTS.forEach(buildRoadRibbon);
  buildRoadSidewalks();
  buildLaneDashes();
  buildJunctionFillers();
  buildRoadMarks();
  buildTrafficSignals();
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

function placeRoadsideProps(seg, segIndex) {
  const gaps = roadMarkings.gaps[segIndex] || []; // 교차로 안쪽(차선을 비운 구간)에는 가로등도 세우지 않는다
  const pts = roadPolyline(seg).map(([x, z]) => [x * WORLD_SCALE, z * WORLD_SCALE]);
  const total = polylineLength(pts);
  if (total < 1e-3) return;
  const roadW = seg.width * WORLD_SCALE;

  const lightSide = hashSeed(seg.a[0], seg.a[1], seg.b[0], seg.b[1], "light") % 2 === 0 ? 1 : -1;
  for (let d = STREETLIGHT_MARGIN; d <= total - STREETLIGHT_MARGIN; d += STREETLIGHT_SPACING) {
    const dRaw = d / WORLD_SCALE;
    if (gaps.some(([g0, g1]) => dRaw > g0 && dRaw < g1)) continue;
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
// 모델 자체에 바닥 도로 텍스처가 포함된 건물(금파힐정문·후문)은 그 텍스처가 바닥(procedural
// 도로 — surfaceYFor로 0.005~0.0135 사이에 쌓임) 바로 위에 겹쳐서 깜빡거리는(z-fighting)
// 일이 없게, 그 범위보다 확실히 위로 살짝 띄운다(건물 자체가 떠 보일 만큼 크진 않은 값).
// 여기 없는 나머지 모든 건물은 반대로 DEFAULT_MODEL_Y_LIFT만큼 아래로 내려서(바닥보다
// 살짝 지하로) 도로가 항상 그 위에 또렷하게 이기도록 한다 — y=0 하나로 딱 붙여두면 세계
// 좌표가 커질수록(이 동네는 x·z가 수백 단위까지 간다) float32 정밀도 때문에 그 둘 사이
// 간격이 흐려질 수 있어서, 양쪽에서 여유를 벌려 둔다.
// 2026-11-24: 이제 "보도 높이(SIDEWALK_TOP_Y)"가 기본 지면이고 도로가 그보다 낮다 — 그래서 건물은
// group째로 보도 높이까지 올리고(아래 buildPlaces의 baseLift), 모델은 그 안에서 아주 살짝만 내려
// 보도 윗면과 딱 겹쳐 깜빡이지 않게 한다. 금파힐정문·후문은 모델 안에 도로 바닥이 있어서 도로 높이 그대로.
const DEFAULT_MODEL_Y_LIFT = -0.002;
const MODEL_Y_LIFT_OVERRIDE = { 201: 0.02, 202: 0.02 };
const ROAD_LEVEL_PLACE_IDS = new Set([201, 202]); // 보도 높이로 올리지 않는 건물(도로에 놓인 문주)
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
// 다각형 발판(교차로 모서리 보도, 건물 바닥 외곽) — 겉 사각형(bbox)을 같이 둬서 멀리 있는 건 바로 건너뛴다
function addPolyPlatform(poly, y) {
  const xs = poly.map((q) => q[0]), zs = poly.map((q) => q[1]);
  groundPlatforms.push({ poly, y, minx: Math.min(...xs), maxx: Math.max(...xs), minz: Math.min(...zs), maxz: Math.max(...zs) });
}
function groundHeightAt(x, z) {
  for (const p of groundPlatforms) {
    if (p.poly) {
      if (x < p.minx || x > p.maxx || z < p.minz || z > p.maxz) continue;
      if (pointInPolygon(x, z, p.poly)) return p.y;
    } else if (insideRect(x, z, p.cx, p.cz, p.cos, p.sin, p.halfW, p.halfD)) return p.y;
  }
  // 보도 위면 턱만큼 높다(도로에서 보도로 올라서면 캐릭터도 같이 올라간다)
  for (const s of walkBands) {
    if (Math.max(s.ax, s.bx) < x - s.outer || Math.min(s.ax, s.bx) > x + s.outer) continue;
    if (Math.max(s.az, s.bz) < z - s.outer || Math.min(s.az, s.bz) > z + s.outer) continue;
    const d = distToSegment(x, z, s.ax, s.az, s.bx, s.bz);
    if (d > s.inner && d <= s.outer) return SIDEWALK_TOP_Y;
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
// 보도 높이로 올라간 건물 처리:
// · 모델 바닥 정점들의 외곽(볼록 껍질)을 구해서, 그게 도로 위로 넘어가면 그 건물은 예전처럼 도로보다
//   살짝 낮게 둔다(건물 판이 도로를 덮지 않게 — 도로 우선).
// · 안 넘어가면 보도 높이 그대로 두고, 외곽을 따라 바닥까지 벽(받침 옆면)만 세워 허공에 뜬 틈을 가린다
//   (예전처럼 사각형 판을 통째로 깔면 모양이 다른 건물은 판이 도로까지 튀어나왔다).
// · 같은 외곽을 캐릭터 발판으로 등록해서 건물 앞마당에서도 보도 높이로 선다.
function modelBottomHull(model) {
  model.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  const im = new THREE.Matrix4();
  const mw = new THREE.Matrix4();
  const visit = (cb) => model.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
    const pos = o.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / 3000));
    const mats = [];
    if (o.isInstancedMesh) {
      const cnt = Math.min(o.count, 300);
      for (let k = 0; k < cnt; k++) {
        o.getMatrixAt(k, im);
        mats.push(new THREE.Matrix4().multiplyMatrices(o.matrixWorld, im));
      }
    } else {
      mats.push(mw.copy(o.matrixWorld));
    }
    for (const m of mats) {
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m);
        cb(v);
      }
    }
  });
  let minY = Infinity;
  visit((p) => { if (p.y < minY) minY = p.y; });
  const pts = [];
  const th = minY + 0.03;
  visit((p) => { if (p.y <= th) pts.push([p.x, p.z]); });
  return pts.length >= 3 ? convexHull2D(pts) : null;
}
function hullOverlapsRoad(hull) {
  const step = 0.05;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(len / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      if (pointOnRoad(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, null, -0.02)) return true;
    }
  }
  return false;
}
let buildingSkirtMaterial = null;
function settleBuildingBase(entry, model) {
  if (ROAD_LEVEL_PLACE_IDS.has(entry.place.id)) return;
  if (entry.baseDecided === "low") {
    model.position.y += -0.01 - DEFAULT_MODEL_Y_LIFT;
    return;
  }
  if (entry.baseDecided === "raised") return;
  const hull = modelBottomHull(model);
  if (!hull) { entry.baseDecided = "raised"; return; }
  if (hullOverlapsRoad(hull)) {
    // 건물 판이 도로에 걸친다 → 도로보다 살짝 낮게(도로가 위에 보이게)
    entry.baseDecided = "low";
    entry.group.position.y = entry.groundY;
    model.position.y += -0.01 - DEFAULT_MODEL_Y_LIFT;
    return;
  }
  entry.baseDecided = "raised";
  const baseY = entry.group.position.y;
  if (baseY <= 0) return;
  if (!buildingSkirtMaterial) buildingSkirtMaterial = new THREE.MeshStandardMaterial({ color: CURB_COLOR, roughness: 1, side: THREE.DoubleSide });
  const store = newRibbonStore();
  pushVerticalQuadStrip(store, [...hull, hull[0]], -baseY, -0.003); // group 기준: 지면(0)~건물 바닥 바로 아래
  store.uv.length = 0;
  const skirt = new THREE.Mesh(storeToGeometry(store), buildingSkirtMaterial);
  skirt.receiveShadow = true;
  entry.group.add(skirt);
  addPolyPlatform(hull, baseY);
}

// 건물 모델은 작은 조각(메시)이 수십~수백 개라 조각마다 그리기 명령이 하나씩 나간다(멀리 보면 1000번 넘게).
// 불러올 때 같은 재질을 쓰는 조각들을 하나로 합쳐서 그리기 명령 수를 크게 줄인다. 압축(quantize)된
// 정점은 그대로 합치면 범위가 잘리므로, 먼저 보통 숫자(Float32)로 풀고 조각 위치를 정점에 구워 넣는다.
const ATTR_GETTERS = ["getX", "getY", "getZ", "getW"];
function toFloatGeometry(geo) {
  const g = new THREE.BufferGeometry();
  for (const name of Object.keys(geo.attributes)) {
    const a = geo.attributes[name];
    const n = a.itemSize;
    const arr = new Float32Array(a.count * n);
    for (let i = 0; i < a.count; i++) for (let c = 0; c < n; c++) arr[i * n + c] = a[ATTR_GETTERS[c]](i);
    g.setAttribute(name, new THREE.BufferAttribute(arr, n));
  }
  if (geo.index) g.setIndex(new THREE.BufferAttribute(Uint32Array.from(geo.index.array), 1));
  return g;
}
function mergeModelMeshes(model) {
  model.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const groups = new Map();
  model.traverse((o) => {
    if (!o.isMesh || !o.visible || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || !o.geometry?.attributes?.position) return;
    // 거울처럼 뒤집힌 조각은 합치면 면 방향이 뒤집혀 안 보일 수 있어서 그대로 둔다
    if (new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld).determinant() < 0) return;
    if (Object.keys(o.geometry.morphAttributes || {}).length) return;
    const geo = o.geometry;
    const key = `${o.material.uuid}|${Object.keys(geo.attributes).sort().join(",")}|${geo.index ? "i" : "n"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  });
  let before = 0, after = 0;
  groups.forEach((meshes) => {
    before += meshes.length;
    if (meshes.length < 2) { after += meshes.length; return; }
    const geos = meshes.map((m) => {
      const g = toFloatGeometry(m.geometry);
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      return g;
    });
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) { after += meshes.length; return; }
    const mesh = new THREE.Mesh(merged, meshes[0].material);
    model.add(mesh);
    meshes.forEach((m) => m.parent && m.parent.remove(m));
    after += 1;
  });
  return { before, after };
}

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
      mergeModelMeshes(model); // 같은 재질 조각을 합쳐 그리기 명령 줄이기(회전·크기 넣기 전, 모델 기준 좌표로)
      const modelScale = WORLD_SCALE * (entry.place.scaleRatio ?? 1);
      model.scale.setScalar(modelScale);
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
      model.position.y += MODEL_Y_LIFT_OVERRIDE[entry.place.id] ?? DEFAULT_MODEL_Y_LIFT;
      settleBuildingBase(entry, model);
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
  // 한꺼번에 여러 모델을 받기 시작하면 다운로드·해석이 몰려 화면이 끊긴다 — 가까운 것부터 동시에 최대 2개씩
  let loadingNow = modelStreamEntries.filter((e) => e.loading).length;
  const want = [];
  modelStreamEntries.forEach((entry) => {
    const dist = Math.hypot(cp.x - entry.px, cp.z - entry.pz);
    entry.streamDist = dist;
    if (dist <= modelLoadRangeFor(entry.place.id)) {
      if (!entry.loadedModel && !entry.loading) want.push(entry);
    } else if (dist > modelUnloadRangeFor(entry.place.id) && entry.loadedModel) {
      entry.group.remove(entry.loadedModel);
      disposeObject3D(entry.loadedModel);
      entry.loadedModel = null;
      if (entry.placeholder) entry.placeholder.visible = true;
    }
  });
  want.sort((a, b) => a.streamDist - b.streamDist);
  for (const entry of want) {
    if (loadingNow >= MAX_CONCURRENT_MODEL_LOADS) break;
    loadPlaceModelInto(entry);
    loadingNow++;
  }
}
const MAX_CONCURRENT_MODEL_LOADS = 2;

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
    // 건물 바닥은 보도 높이(SIDEWALK_TOP_Y)에 맞춘다 — 도로는 그보다 낮다(문주 등 도로 위 시설은 예외)
    const baseLift = ROAD_LEVEL_PLACE_IDS.has(place.id) ? 0 : SIDEWALK_TOP_Y;
    const group = new THREE.Group();
    group.position.y = groundY + baseLift;
    scene.add(group);
    if (groundY !== 0) {
      const skirtH = Math.abs(groundY + baseLift);
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(colW * 1.4, skirtH, colD * 1.4),
        new THREE.MeshStandardMaterial({ color: 0x9a9488 })
      );
      skirt.position.set(0, -(groundY + baseLift) / 2, 0); // group 기준 로컬 좌표 — group.position.y와 합쳐지면 실제 지면(y=0)까지 이어진다
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
        groundPlatforms.push({ cx: px, cz: pz, cos, sin, halfW: (colW * 1.4) / 2, halfD: (colD * 1.4) / 2, y: groundY + baseLift });
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
      modelStreamEntries.push({ place, px, pz, rotY, placeholder, group, groundY, loadedModel: null, loading: false, inRange: true, baseDecided: null });

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

// 불량배: 이제 서 있지 않고 행인처럼 보도를 어슬렁거린다. 캐릭터가 가까이(BULLY_CHASE_RANGE 안) 오면 다가오고,
// 닿으면 예전처럼 "혼내줬다" 보상(updatePickups). 모습은 행인보다 조금 큰 검은 후드티·빨간 모자·청바지.
const BULLY_SCALE = 1.2;
const BULLY_WANDER_SPEED = 0.55;
const BULLY_CHASE_SPEED = 1.3; // 캐릭터 걷기(3)보다 느리게 — 피할 수도, 혼내 줄 수도 있게
const BULLY_CHASE_RANGE = 6;
function makeThug() {
  const group = new THREE.Group();
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 });
  const hoodie = mat(0x1d1f24), jeans = mat(0x2f3b52), skin = mat(0xe0b088), capMat = mat(0xb3262c), shoe = mat(0xf2f2f2);
  const body = new THREE.Group(); // 몸 방향·팔다리 흔들기용(이름표는 group에 따로 붙여서 돌지 않게)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, 0.08), hoodie);
  torso.position.y = 0.25;
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), hoodie);
  hood.position.set(0, 0.35, -0.028);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 10), skin);
  head.position.y = 0.375;
  const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.05, 0.03, 12), capMat);
  capCrown.position.y = 0.41;
  const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.008, 0.05), capMat);
  capBrim.position.set(0, 0.398, 0.05);
  const legs = [-1, 1].map((sx) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.032, 0.17, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.17, 0.048), jeans);
    leg.position.y = -0.085;
    const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.025, 0.07), shoe);
    sneaker.position.set(0, -0.163, 0.01);
    pivot.add(leg, sneaker);
    return pivot;
  });
  const arms = [-1, 1].map((sx) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.083, 0.31, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.14, 0.036), hoodie);
    arm.position.y = -0.07;
    pivot.add(arm);
    return pivot;
  });
  body.add(torso, hood, head, capCrown, capBrim, ...legs, ...arms);
  body.scale.setScalar(BULLY_SCALE);
  body.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(body);
  const label = makeLabelSprite("불량배");
  label.position.y = 0.72;
  group.add(label);
  group.userData = { body, legs, arms };
  return group;
}

// 불량배와 같은 뼈대(원기둥 몸+공 머리)를 쓰되, 밝은 색으로 구분해서 "반가운 존재"처럼 보이게 한다.
function makeFriend() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.45, 1.3, 10),
    new THREE.MeshStandardMaterial({ color: 0xf2a63e })
  );
  body.position.y = 0.85;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 12), new THREE.MeshStandardMaterial({ color: 0xe0b088 }));
  head.position.y = 1.65;
  head.castShadow = true;
  group.add(body, head);
  const label = makeLabelSprite("친구");
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

function spawnEnemies(count) {
  enemies.forEach((en) => scene.remove(en.mesh));
  enemies = [];
  for (let i = 0; i < count; i++) {
    const mesh = makeThug();
    const en = { mesh, defeated: false, phase: Math.random() * 6, chasing: false };
    if (pedPaths.length) {
      // 보도 아무 데나 — 동네 곳곳의 보도를 어슬렁거린다
      en.path = pedPaths[Math.floor(Math.random() * pedPaths.length)];
      en.d = Math.random() * en.path.len;
      en.dir = Math.random() < 0.5 ? 1 : -1;
      en.k = 0;
      const q = pathPose(en.path, en.d, 0);
      mesh.position.set(q.x, SIDEWALK_TOP_Y, q.z);
    } else {
      const [x, z] = randomStreetSpot();
      mesh.position.set(x, 0, z);
    }
    scene.add(mesh);
    enemies.push(en);
  }
}

function updateEnemies(dt) {
  if (!character || !enemies.length) return;
  const cp = character.position;
  enemies.forEach((en) => {
    if (en.defeated) return;
    const m = en.mesh;
    const dx = cp.x - m.position.x, dz = cp.z - m.position.z;
    const dist = Math.hypot(dx, dz);
    let fx = 0, fz = 1, speed = 0;
    if (dist < BULLY_CHASE_RANGE && dist > 0.05 && !currentErrand) {
      // 캐릭터 쪽으로 다가온다(보도를 벗어나도 됨)
      fx = dx / dist; fz = dz / dist;
      speed = BULLY_CHASE_SPEED;
      m.position.x += fx * speed * dt;
      m.position.z += fz * speed * dt;
      en.chasing = true;
    } else if (en.path) {
      if (en.chasing) {
        // 쫓기를 그만두면 가장 가까운 보도 지점으로 돌아가서 다시 어슬렁
        const near = nearestOnPath(en.path, m.position.x, m.position.z);
        en.d = near.d;
        en.k = near.k || 0;
        en.chasing = false;
      }
      en.d += en.dir * BULLY_WANDER_SPEED * dt;
      if (en.d >= en.path.len) { en.d = en.path.len; en.dir = -1; }
      if (en.d <= 0) { en.d = 0; en.dir = 1; }
      const q = pathPose(en.path, en.d, en.k);
      en.k = q.k;
      // 보도로 돌아가는 동안 순간이동하지 않게 조금씩 다가간다
      m.position.x += (q.x - m.position.x) * Math.min(1, dt * 4);
      m.position.z += (q.z - m.position.z) * Math.min(1, dt * 4);
      fx = q.tx * en.dir; fz = q.tz * en.dir;
      speed = BULLY_WANDER_SPEED;
    }
    m.position.y += (groundHeightAt(m.position.x, m.position.z) - m.position.y) * Math.min(1, dt * 6);
    const ud = m.userData;
    if (speed > 0 && ud.body) {
      ud.body.rotation.y = Math.atan2(fx, fz);
      en.phase += speed * dt * 10;
      const swing = Math.sin(en.phase) * 0.55;
      ud.legs[0].rotation.x = swing;
      ud.legs[1].rotation.x = -swing;
      ud.arms[0].rotation.x = -swing * 0.8;
      ud.arms[1].rotation.x = swing * 0.8;
    }
  });
}

function spawnFriend(ctx) {
  if (friend) {
    scene.remove(friend.mesh);
    friend = null;
  }
  if (ctx.insa < FRIEND_INSA_THRESHOLD) return;
  const [x, z] = randomStreetSpot();
  const mesh = makeFriend();
  mesh.position.set(x, 0, z);
  scene.add(mesh);
  friend = { mesh, met: false };
}

function startAdventure() {
  const statCtx = window.getAdventureStatContext?.() ?? { insa: 0, social: 0, stress: 0, delinquency: 0 };
  if (currentErrand) {
    items.forEach((it) => scene.remove(it.mesh));
    enemies.forEach((en) => scene.remove(en.mesh));
    if (friend) scene.remove(friend.mesh);
    items = [];
    enemies = [];
    friend = null;
  } else {
    spawnItems();
    spawnEnemies(enemyCountForStats(statCtx));
    spawnFriend(statCtx);
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
  const friendPart = friend && !friend.met ? " · 👫 친구" : "";
  hudEl.textContent = `🪙 동전 ${itemsLeft} · 👊 불량배 ${enemiesLeft}${friendPart}`;
  if (itemsLeft === 0 && enemiesLeft === 0 && resetBtnEl) {
    resetBtnEl.hidden = false;
    showToast("🎉 거리를 다 정리했다! 다시 하기를 눌러 보자");
  }
}

function grantReward(amount, label) {
  if (typeof window.grantAdventureReward === "function") window.grantAdventureReward(amount);
  showToast(`${label} · 용돈 +${amount}원`);
}

function grantFriendHangout() {
  if (typeof window.grantFriendHangout === "function") window.grantFriendHangout();
  showToast("👫 친구와 신나게 놀았다 · 스트레스 감소");
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
  if (friend && !friend.met && cp.distanceTo(friend.mesh.position) < PICKUP_RADIUS) {
    friend.met = true;
    scene.remove(friend.mesh);
    changed = true;
    grantFriendHangout();
  }
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
  updateEnemies(dt);
  updatePickups(dt);
  updateErrand();
  updateErrandHighlights();
  if (mixer) mixer.update(dt);
  if (momMixer) momMixer.update(dt);
  updateCamera();
  updateSunFollow();
  updateSky(dt);
  updateSignals(dt);
  updateCars(dt);
  updatePedestrians(dt);
  updateLabelScales();
  // 라벨·건물 보이기/숨기기는 캐릭터가 움직여야만 바뀌니 0.2초마다만 확인한다
  visibilityTimer += dt;
  if (visibilityTimer >= 0.2) {
    visibilityTimer = 0;
    updateLabelVisibility();
    updatePlaceVisibility();
  }
  updateModelStreaming(dt);
  renderer.render(scene, camera);
  updatePerformance(dt);
}
let visibilityTimer = 1;

function resize() {
  if (!renderer || !canvasEl) return;
  const w = canvasEl.clientWidth || 600;
  const h = canvasEl.clientHeight || 400;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

// ── 전체화면: #neighborhood3d-wrap 자체를 전체화면으로 — 브라우저가 알아서 지금 화면
// 해상도에 꽉 채워 주고, resize()는 fullscreenchange에서 다시 불러 캔버스를 그 크기에 맞춘다 ──
function isWrapFullscreen() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  return !!fsEl && fsEl === wrapEl;
}
function requestWrapFullscreen() {
  if (isWrapFullscreen()) return;
  try {
    const req = wrapEl?.requestFullscreen || wrapEl?.webkitRequestFullscreen;
    req?.call(wrapEl)?.catch?.(() => {}); // 사용자 제스처가 아니라고 거부되는 등은 조용히 무시
  } catch (err) {
    /* 브라우저별로 동기 예외를 던지는 경우도 있다 — 무시 */
  }
}
function exitWrapFullscreen() {
  if (!isWrapFullscreen()) return; // 이미 전체화면이 아니면 exitFullscreen() 자체가 예외를 던질 수 있다
  try {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    exit?.call(document)?.catch?.(() => {});
  } catch (err) {
    /* 무시 */
  }
}
// 전체화면 들어가자마자는 "축소" 버튼을 보여 주다가, 화면을 가리지 않게 잠시 뒤 스스로 숨긴다.
// 화면 맨 위(top-zone)를 터치하면 다시 보여 주고 숨김 타이머를 처음부터 다시 잰다.
function showExitFullscreenBtnTemporarily() {
  if (!exitFullscreenBtnEl) return;
  exitFullscreenBtnEl.hidden = false;
  clearTimeout(exitBtnHideTimer);
  exitBtnHideTimer = setTimeout(() => {
    exitFullscreenBtnEl.hidden = true;
  }, 2500);
}
function onFullscreenChange() {
  const fs = isWrapFullscreen();
  wrapEl?.classList.toggle("is-fullscreen", fs);
  if (fs) {
    showExitFullscreenBtnTemporarily();
  } else if (exitFullscreenBtnEl) {
    clearTimeout(exitBtnHideTimer);
    exitFullscreenBtnEl.hidden = true;
  }
  resize();
}
document.addEventListener("fullscreenchange", onFullscreenChange);
document.addEventListener("webkitfullscreenchange", onFullscreenChange);


// ════════════════════════════════════════════════════════════════════════════
// ── 하늘: 그라데이션 + 천천히 흘러가는 구름 (구 하나 + 셰이더, 드로우콜 1) ──
// 구름은 처음에 한 번 캔버스로 만든 반복 무늬(노이즈) 텍스처를 하늘 위에 펼쳐서 시간에 따라 밀어 준다.
// ════════════════════════════════════════════════════════════════════════════
const SKY_TOP_COLOR = new THREE.Color(0x4f9fe6);
const SKY_HORIZON_COLOR = new THREE.Color(0xd8ecfa);
let skyMesh = null;
function makeCloudTexture() {
  const N = 256;
  const lattice = (size, seed) => {
    const a = new Float32Array(size * size);
    let s = seed;
    for (let i = 0; i < a.length; i++) { s = (s * 16807) % 2147483647; a[i] = s / 2147483647; }
    return a;
  };
  const layers = [[6, 0.5, 11], [12, 0.27, 23], [24, 0.15, 37], [48, 0.08, 51]].map(([size, amp, seed]) => ({ size, amp, g: lattice(size, seed) }));
  const smooth = (t) => t * t * (3 - 2 * t);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = N;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let v = 0;
      for (const L of layers) {
        const fx = (x / N) * L.size, fy = (y / N) * L.size;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = smooth(fx - x0), ty = smooth(fy - y0);
        const g = (i, j) => L.g[(j % L.size) * L.size + (i % L.size)]; // 끝과 처음이 이어지게(타일링)
        const a = g(x0, y0), b = g(x0 + 1, y0), c = g(x0, y0 + 1), d = g(x0 + 1, y0 + 1);
        v += L.amp * ((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty);
      }
      const cover = Math.max(0, Math.min(1, (v - 0.55) * 3.4)); // 맑은 하늘 사이로 뭉게구름이 드문드문
      const k = (y * N + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
      img.data[k + 3] = Math.round(cover * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function buildSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: SKY_TOP_COLOR },
      horizonColor: { value: SKY_HORIZON_COLOR },
      clouds: { value: makeCloudTexture() },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform sampler2D clouds;
      uniform float time;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(horizonColor, topColor, smoothstep(0.0, 0.55, max(h, 0.0)));
        if (h > 0.01) {
          vec2 uv = d.xz / (h + 0.12) * 0.16 + vec2(time * 0.0035, time * 0.0012);
          float c = texture2D(clouds, uv).a * smoothstep(0.01, 0.2, h);
          col = mix(col, vec3(1.0), c * 0.9);
        }
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  skyMesh = new THREE.Mesh(new THREE.SphereGeometry(250, 32, 16), mat);
  skyMesh.renderOrder = -1;
  skyMesh.frustumCulled = false;
  scene.add(skyMesh);
  scene.background = SKY_HORIZON_COLOR.clone();
  if (scene.fog) scene.fog.color.copy(SKY_HORIZON_COLOR);
}
function updateSky(dt) {
  if (!skyMesh) return;
  skyMesh.position.copy(camera.position);
  skyMesh.material.uniforms.time.value += dt;
}

// ════════════════════════════════════════════════════════════════════════════
// ── 신호등: 횡단보도마다 차량 신호등(정지선 오른쪽, 팔이 차로 위로) + 보행 신호등(횡단보도 양끝) ──
// 교차로마다 마주 보는 길끼리 같은 단계로 묶어서 초록 → 노랑 → 전부 빨강 순서로 돈다. 보행 신호는
// 자기가 건너는 길의 차가 빨간불인 동안(다른 단계의 초록 시간) 초록이 된다. 기둥·팔·몸통·불빛은 종류별로
// 인스턴스 하나씩이라 신호등이 많아도 드로우콜은 몇 개뿐이고, 불빛 색은 바뀔 때만 다시 쓴다.
// ════════════════════════════════════════════════════════════════════════════
const SIGNAL_GREEN_S = 8;
const SIGNAL_YELLOW_S = 2;
const SIGNAL_ALLRED_S = 1;
const VEH_SIGNAL_POLE_H = 0.85;
const PED_SIGNAL_POLE_H = 0.42;
const LAMP_OFF = new THREE.Color(0x30343a);
const LAMP_RED = new THREE.Color(0xff3b30);
const LAMP_YELLOW = new THREE.Color(0xffc21a);
const LAMP_GREEN = new THREE.Color(0x27e36a);
const signalArms = new Map(); // "도로번호:a|b" → 그 끝 횡단보도(신호 있음)
let signalJunctions = [];
let signalLamps = null; // { mesh, slots: [{ arm, kind }], last: [] }
let signalClock = 0;
let signalUpdateTimer = 0;

// 한 횡단보도(arm)의 지금 신호: 차량 "G"|"Y"|"R", 보행 "G"|"R"
function armVehicleState(arm) {
  const j = arm.junctionRef;
  const slot = SIGNAL_GREEN_S + SIGNAL_YELLOW_S + SIGNAL_ALLRED_S;
  const t = (signalClock + j.offset) % j.cycle;
  const p = Math.floor(t / slot);
  const within = t - p * slot;
  if (arm.phase !== p) return "R";
  return within < SIGNAL_GREEN_S ? "G" : within < SIGNAL_GREEN_S + SIGNAL_YELLOW_S ? "Y" : "R";
}
function armPedState(arm) {
  const j = arm.junctionRef;
  const slot = SIGNAL_GREEN_S + SIGNAL_YELLOW_S + SIGNAL_ALLRED_S;
  const t = (signalClock + j.offset) % j.cycle;
  const p = Math.floor(t / slot);
  const within = t - p * slot;
  return arm.phase !== p && within < SIGNAL_GREEN_S ? "G" : "R";
}
// 차가 쓰는 질문: 그 도로 끝(which)에 신호가 있으면 지금 색, 없으면 null
function signalStateFor(segIndex, which) {
  const arm = signalArms.get(`${segIndex}:${which}`);
  return arm ? armVehicleState(arm) : null;
}

function buildTrafficSignals() {
  signalArms.clear();
  signalJunctions = [];
  signalLamps = null;
  const list = (roadMarkings.crossings || []).filter((c) => c.signal).map((c) => ({ ...c }));
  if (!list.length) return;
  const W = WORLD_SCALE;
  // 교차로별로 묶고, 마주 보는 길끼리 같은 단계(phase)로
  const byJ = new Map();
  list.forEach((c) => {
    if (!byJ.has(c.junction)) byJ.set(c.junction, []);
    byJ.get(c.junction).push(c);
  });
  byJ.forEach((arms, key) => {
    let nPhases = 0;
    arms.forEach((a) => {
      if (a.phase != null) return;
      a.phase = nPhases;
      arms.forEach((b) => {
        if (b.phase == null && a.hx * b.hx + a.hz * b.hz < -0.6) b.phase = a.phase;
      });
      nPhases++;
    });
    nPhases = Math.max(2, nPhases); // 신호 있는 길이 한 방향뿐이어도 다른 쪽(보행·교차 차량) 차례를 둔다
    const cycle = nPhases * (SIGNAL_GREEN_S + SIGNAL_YELLOW_S + SIGNAL_ALLRED_S);
    const j = { key, arms, cycle, offset: ((Math.abs(hashSeed(key)) % 1000) / 1000) * cycle };
    arms.forEach((a) => { a.junctionRef = j; signalArms.set(`${a.seg}:${a.which}`, a); });
    signalJunctions.push(j);
  });

  // 인스턴스 배치 계산
  const poles = []; // { x, z, h }
  const arms = []; // { x, z, y, len, yaw }
  const heads = []; // { x, y, z, sx, sy, sz, yaw }
  const lamps = []; // { x, y, z, yaw, r, arm, kind }
  const yawFacing = (dx, dz) => Math.atan2(dx, dz); // 로컬 +Z가 (dx,dz)를 보게
  list.forEach((c) => {
    const h = [c.hx, c.hz], r = [c.rx, c.rz];
    // 차량 신호등: 정지선 오른쪽 길가 기둥 + 차로 위로 뻗은 팔 + 다가오는 차를 보는 몸통(가로형 3구)
    const baseRaw = [c.stopX + r[0] * (c.half + 0.9), c.stopZ + r[1] * (c.half + 0.9)];
    const armLenRaw = c.half * 0.75 + 0.9;
    const B = [baseRaw[0] * W, baseRaw[1] * W];
    poles.push({ x: B[0], z: B[1], h: VEH_SIGNAL_POLE_H });
    const armMid = [B[0] - r[0] * (armLenRaw * W) / 2, B[1] - r[1] * (armLenRaw * W) / 2];
    arms.push({ x: armMid[0], z: armMid[1], y: VEH_SIGNAL_POLE_H - 0.02, len: armLenRaw * W, yaw: yawFacing(-h[0], -h[1]) });
    const headPos = [B[0] - r[0] * (armLenRaw - 0.5) * W, B[1] - r[1] * (armLenRaw - 0.5) * W];
    const headY = VEH_SIGNAL_POLE_H - 0.07;
    const faceYaw = yawFacing(-h[0], -h[1]);
    heads.push({ x: headPos[0], y: headY, z: headPos[1], sx: 0.17, sy: 0.055, sz: 0.04, yaw: faceYaw });
    // 운전자 기준 왼쪽부터 빨강·노랑·초록(가로형)
    [["vR", -0.052], ["vY", 0], ["vG", 0.052]].forEach(([kind, o]) => {
      lamps.push({
        x: headPos[0] + r[0] * o - h[0] * 0.021, y: headY, z: headPos[1] + r[1] * o - h[1] * 0.021,
        yaw: faceYaw, r: 0.018, arm: c, kind,
      });
    });
    // 보행 신호등: 횡단보도 양끝(도로 양쪽 길가), 길 건너편을 바라봄. 위 빨강(서 있는 사람), 아래 초록
    [1, -1].forEach((side) => {
      const E = [(c.x + r[0] * side * (c.half + 0.7)) * W, (c.z + r[1] * side * (c.half + 0.7)) * W];
      poles.push({ x: E[0], z: E[1], h: PED_SIGNAL_POLE_H });
      const face = [-r[0] * side, -r[1] * side];
      const fy = yawFacing(face[0], face[1]);
      const hy = PED_SIGNAL_POLE_H + 0.02;
      heads.push({ x: E[0], y: hy, z: E[1], sx: 0.05, sy: 0.085, sz: 0.035, yaw: fy });
      [["pR", 0.021], ["pG", -0.021]].forEach(([kind, dy]) => {
        lamps.push({ x: E[0] + face[0] * 0.019, y: hy + dy, z: E[1] + face[1] * 0.019, yaw: fy, r: 0.016, arm: c, kind });
      });
    });
  });

  const dummy = new THREE.Object3D();
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2c3036, roughness: 0.6, metalness: 0.3 });
  const poleMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.014, 1, 6), darkMat, poles.length);
  poles.forEach((p, i) => {
    dummy.position.set(p.x, SIDEWALK_TOP_Y + p.h / 2, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, p.h, 1);
    dummy.updateMatrix();
    poleMesh.setMatrixAt(i, dummy.matrix);
  });
  const armMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), darkMat, arms.length);
  arms.forEach((a, i) => {
    dummy.position.set(a.x, SIDEWALK_TOP_Y + a.y, a.z);
    dummy.rotation.set(0, a.yaw, 0);
    dummy.scale.set(a.len, 0.018, 0.018); // 로컬 X(=오른쪽 r 방향)로 길게
    dummy.updateMatrix();
    armMesh.setMatrixAt(i, dummy.matrix);
  });
  const headMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x1d2024, roughness: 0.7 }), heads.length);
  heads.forEach((hh, i) => {
    dummy.position.set(hh.x, SIDEWALK_TOP_Y + hh.y, hh.z);
    dummy.rotation.set(0, hh.yaw, 0);
    dummy.scale.set(hh.sx, hh.sy, hh.sz);
    dummy.updateMatrix();
    headMesh.setMatrixAt(i, dummy.matrix);
  });
  const lampMesh = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }), lamps.length);
  lamps.forEach((l, i) => {
    dummy.position.set(l.x, SIDEWALK_TOP_Y + l.y, l.z);
    dummy.rotation.set(0, l.yaw, 0);
    dummy.scale.set(l.r, l.r, 1);
    dummy.updateMatrix();
    lampMesh.setMatrixAt(i, dummy.matrix);
    lampMesh.setColorAt(i, LAMP_OFF);
  });
  [poleMesh, armMesh, headMesh, lampMesh].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    m.castShadow = m !== lampMesh;
    scene.add(m);
  });
  if (lampMesh.instanceColor) lampMesh.instanceColor.needsUpdate = true;
  signalLamps = { mesh: lampMesh, slots: lamps.map((l) => ({ arm: l.arm, kind: l.kind })), last: new Array(lamps.length).fill(null) };
  updateSignalLamps(true);
}

function updateSignalLamps(force = false) {
  if (!signalLamps) return;
  let changed = false;
  signalLamps.slots.forEach((slot, i) => {
    let col = LAMP_OFF;
    if (slot.kind[0] === "v") {
      const st = armVehicleState(slot.arm);
      if ((slot.kind === "vR" && st === "R") || (slot.kind === "vY" && st === "Y") || (slot.kind === "vG" && st === "G")) {
        col = slot.kind === "vR" ? LAMP_RED : slot.kind === "vY" ? LAMP_YELLOW : LAMP_GREEN;
      }
    } else {
      const st = armPedState(slot.arm);
      if (slot.kind === "pR" && st === "R") col = LAMP_RED;
      if (slot.kind === "pG" && st === "G") col = LAMP_GREEN;
    }
    if (force || signalLamps.last[i] !== col) {
      signalLamps.mesh.setColorAt(i, col);
      signalLamps.last[i] = col;
      changed = true;
    }
  });
  if (changed && signalLamps.mesh.instanceColor) signalLamps.mesh.instanceColor.needsUpdate = true;
}

// 캐릭터가 빨간불에 횡단보도를 건너면 한마디(교통안전)
let redLightToastCooldown = 0;
function checkCharacterRedLight(dt) {
  redLightToastCooldown = Math.max(0, redLightToastCooldown - dt);
  if (!character || redLightToastCooldown > 0 || !signalArms.size) return;
  const W = WORLD_SCALE;
  const px = character.position.x / W, pz = character.position.z / W;
  for (const arm of signalArms.values()) {
    const dx = px - arm.x, dz = pz - arm.z;
    const along = dx * arm.hx + dz * arm.hz;
    const across = dx * arm.rx + dz * arm.rz;
    if (Math.abs(along) <= arm.depth / 2 + 0.5 && Math.abs(across) <= arm.half && armPedState(arm) === "R") {
      showToast("🚦 빨간불이에요! 초록불에 건너요");
      redLightToastCooldown = 6;
      return;
    }
  }
}

function updateSignals(dt) {
  if (!signalJunctions.length) return;
  signalClock += dt;
  signalUpdateTimer += dt;
  if (signalUpdateTimer >= 0.2) {
    signalUpdateTimer = 0;
    updateSignalLamps();
    checkCharacterRedLight(0.2);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ── 달리는 차·버스: 캐릭터 주변에서만 차 18대 + 서울 시내버스 4대(파란 간선·초록 지선)가 차로를 따라 달린다 ──
// · 8m 이상 도로(단지 안 베이지 도로 제외)의 오른쪽 차로를 달리고, 도로 끝(교차로)에서 이어진 길 중 하나로
//   꺾어 들어간다(곧은 길을 더 자주 고름). 막다른 길에선 돌아 나온다. 버스는 13m 이상 큰길을 골라 다닌다.
// · 신호등이 있는 끝에서는 빨강·노랑이면 정지선 앞에 선다. 앞차와 거리를 두고, 앞에 사람이 있으면 멈춘다.
// · 차는 몸통·유리, 버스는 색깔별 몸통 하나(텍스처 한 장에 옆면·앞뒤·지붕을 모아 그림), 바퀴·그림자는 같이 써서
//   종류별 인스턴스 6개뿐이다. 멀어진 차는 캐릭터 근처로 다시 보낸다.
// ════════════════════════════════════════════════════════════════════════════
const CAR_COUNT = 18;
const BUS_COUNT = 4; // 반은 파란 간선버스, 반은 초록 지선버스
const VEHICLE_SPAWN_MIN = 14; // 월드 단위 — 캐릭터 바로 앞에서 불쑥 생기지 않게
const VEHICLE_SPAWN_MAX = 38;
const VEHICLE_DESPAWN = 48;
const CAR_LEN = 0.8, CAR_WID = 0.34;
const BUS_LEN = 1.7, BUS_WID = 0.4, BUS_H = 0.42, BUS_CLEARANCE = 0.06;
const CAR_MAX_SPEED = 4.2; // 월드/초 (캐릭터 걷기 3, 뛰기 7.5)
const BUS_MAX_SPEED = 3.2;
const BUS_ROAD_MIN_WIDTH = 13; // 버스가 다니는 큰길
const CAR_ACCEL = 2.2, CAR_DECEL = 5.5;
const CAR_COLORS = [0xf2f2f0, 0xc9ccd1, 0x2b2d31, 0xb8202a, 0x1f4e8c, 0x6b7076, 0x203247, 0xd8cdb0, 0x3c6e47];
// 서울 시내버스(노선 번호·행선지는 예시 — 바꾸고 싶으면 여기만 고치면 된다)
const BUS_TYPES = [
  { key: "blue", body: "#1f5fbf", roof: "#dde6f2", number: "421", dest: "금호동", badge: "B" },
  { key: "green", body: "#3da535", roof: "#e3f0dc", number: "2014", dest: "금호역", badge: "G" },
];
let carRoads = null; // 도로별 정보(차가 달릴 수 있는 도로만 drivable)
let carNodes = null;
let cars = []; // 차·버스 모두(type: "car" | "bus")
let carMeshes = null;
let carRespawnTimer = 0;

function polyPointAt(pts, cum, s) {
  const L = cum[cum.length - 1];
  s = Math.max(0, Math.min(L, s));
  let i = 0;
  while (i < pts.length - 2 && cum[i + 1] < s) i++;
  const len = cum[i + 1] - cum[i] || 1e-6;
  const t = (s - cum[i]) / len;
  const dx = (pts[i + 1][0] - pts[i][0]) / len, dz = (pts[i + 1][1] - pts[i][1]) / len;
  return { x: pts[i][0] + dx * len * t, z: pts[i][1] + dz * len * t, dx, dz };
}

function buildCarNetwork() {
  carRoads = ROAD_SEGMENTS.map((seg, i) => {
    const pts = roadPolyline(seg);
    const cum = [0];
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const L = cum[cum.length - 1];
    const w = seg.width;
    const drivable = L > 4 && w >= 8 && !(w >= 11 && w < 13);
    // 양 끝 교차로 구간 길이(차가 그 앞에서 꺾기 시작)
    let gapA = 0, gapB = 0;
    (roadMarkings.gaps[i] || []).forEach(([g0, g1]) => {
      if (g0 <= 0.01) gapA = Math.max(gapA, Math.min(L, g1));
      if (g1 >= L - 0.01) gapB = Math.max(gapB, L - Math.max(0, g0));
    });
    if (gapA + gapB > L * 0.9) { gapA = Math.min(gapA, L * 0.45); gapB = Math.min(gapB, L * 0.45); }
    const lanes = w >= 22 ? [w * 0.125, w * 0.375] : [w * 0.25]; // 진행 방향 오른쪽 차로 중심(raw)
    return { i, pts, cum, L, w, drivable, gapA, gapB, lanes };
  });
  // 도로 끝 → 교차로(노드)
  const ends = [];
  carRoads.forEach((r) => {
    if (!r.drivable) return;
    ends.push({ i: r.i, which: "a", x: r.pts[0][0], z: r.pts[0][1] });
    ends.push({ i: r.i, which: "b", x: r.pts[r.pts.length - 1][0], z: r.pts[r.pts.length - 1][1] });
  });
  carNodes = new Map();
  const used = new Set();
  ends.forEach((e, k) => {
    if (used.has(k)) return;
    const members = [e];
    used.add(k);
    ends.forEach((o, m) => {
      if (!used.has(m) && Math.hypot(o.x - e.x, o.z - e.z) < JOIN_RAW) { members.push(o); used.add(m); }
    });
    const node = { members };
    members.forEach((m) => carNodes.set(`${m.i}:${m.which}`, node));
  });
}

function carRoadPose(r, s, dir, lane) {
  const q = polyPointAt(r.pts, r.cum, s);
  const fx = q.dx * dir, fz = q.dz * dir;
  const rx = -fz, rz = fx; // 진행 방향 오른쪽(우측통행)
  return { x: (q.x + rx * lane) * WORLD_SCALE, z: (q.z + rz * lane) * WORLD_SCALE, fx, fz };
}

// 버스는 오른쪽 끝 차로(정류장 쪽), 차는 아무 차로나
function laneFor(car, r) {
  return car.type === "bus" ? r.lanes[r.lanes.length - 1] : r.lanes[Math.floor(Math.random() * r.lanes.length)];
}

function spawnCar(car) {
  const cp = character.position;
  const isBus = car.type === "bus";
  const minRun = isBus ? 12 : 6;
  let candidates = carRoads.filter((r) => r.drivable && r.L - r.gapA - r.gapB > minRun && (!isBus || r.w >= BUS_ROAD_MIN_WIDTH));
  if (!candidates.length) candidates = carRoads.filter((r) => r.drivable && r.L - r.gapA - r.gapB > 6);
  for (let attempt = 0; attempt < 30; attempt++) {
    const r = candidates[Math.floor(Math.random() * candidates.length)];
    if (!r) return false;
    const s = r.gapA + 2 + Math.random() * Math.max(0.1, r.L - r.gapA - r.gapB - 4);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const lane = laneFor(car, r);
    const pose = carRoadPose(r, s, dir, lane);
    const d = Math.hypot(pose.x - cp.x, pose.z - cp.z);
    if (d < VEHICLE_SPAWN_MIN || d > VEHICLE_SPAWN_MAX) continue;
    const clearRaw = (car.len * 1.6) / WORLD_SCALE + 4;
    if (cars.some((o) => o !== car && o.active && o.mode === "road" && o.seg === r.i && o.dir === dir && Math.abs(o.lane - lane) < 0.5 && Math.abs(o.s - s) < clearRaw)) continue;
    Object.assign(car, { active: true, mode: "road", seg: r.i, s, dir, lane, turn: null, x: pose.x, z: pose.z, fx: pose.fx, fz: pose.fz });
    car.maxSpeed = (isBus ? BUS_MAX_SPEED : CAR_MAX_SPEED) * (0.85 + Math.random() * 0.3);
    car.speed = car.maxSpeed * 0.6;
    return true;
  }
  return false;
}

// 버스 텍스처 한 장(1024×1024)에 옆면 두 개·앞·뒤·지붕을 모아 그린다
//   y 0~256: 왼쪽 옆면(앞이 왼쪽) / 256~512: 오른쪽 옆면(문 쪽, 앞이 오른쪽) / 512~768: 앞·뒤·지붕
function makeBusTexture(t) {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  const side = (y0, frontAtLeft) => {
    g.fillStyle = t.body;
    g.fillRect(0, y0, 1024, 256);
    g.fillStyle = "rgba(0,0,0,0.22)";
    g.fillRect(0, y0 + 210, 1024, 46); // 아래 진한 띠
    g.fillStyle = "#f4f4f4";
    g.fillRect(0, y0 + 198, 1024, 8); // 흰 줄
    g.fillStyle = "#22303c";
    g.fillRect(20, y0 + 36, 984, 118); // 창문 띠
    g.fillStyle = t.body;
    for (let k = 1; k < 8; k++) g.fillRect(20 + k * 123, y0 + 36, 9, 118); // 창틀
    if (!frontAtLeft) {
      // 문(앞문·가운데문) — 인도 쪽인 오른쪽 면에만
      g.fillStyle = "#2c3b47";
      g.fillRect(1024 - 150, y0 + 36, 78, 196);
      g.fillRect(450, y0 + 36, 78, 196);
    }
    // 노선 번호 + 간선(B)/지선(G) 동그라미
    g.textBaseline = "middle";
    g.textAlign = "left";
    g.font = "bold 40px sans-serif";
    const label = t.number;
    const w = g.measureText(label).width;
    const x = frontAtLeft ? 70 : 1024 - 70 - w - 56;
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(x + 20, y0 + 176, 18, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = t.body;
    g.font = "bold 26px sans-serif";
    g.textAlign = "center";
    g.fillText(t.badge, x + 20, y0 + 177);
    g.textAlign = "left";
    g.fillStyle = "#ffffff";
    g.font = "bold 40px sans-serif";
    g.fillText(label, x + 48, y0 + 177);
  };
  side(0, true);
  side(256, false);
  // 앞면(0~256): 행선지 LED + 앞유리 + 전조등
  g.fillStyle = t.body;
  g.fillRect(0, 512, 256, 256);
  g.fillStyle = "#111417";
  g.fillRect(22, 522, 212, 34);
  g.fillStyle = "#ffb21a";
  g.font = "bold 24px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(`${t.number} ${t.dest}`, 128, 540);
  g.fillStyle = "#1c2630";
  g.fillRect(14, 566, 228, 118);
  g.fillStyle = "#fff6d0";
  g.fillRect(20, 714, 44, 18);
  g.fillRect(192, 714, 44, 18);
  // 뒷면(256~512): 큰 노선 번호 + 브레이크등
  g.fillStyle = t.body;
  g.fillRect(256, 512, 256, 256);
  g.fillStyle = "#1c2630";
  g.fillRect(274, 560, 220, 70);
  g.fillStyle = "#ffffff";
  g.font = "bold 54px sans-serif";
  g.fillText(t.number, 384, 676);
  g.fillStyle = "#c0262c";
  g.fillRect(268, 714, 34, 16);
  g.fillRect(466, 714, 34, 16);
  // 지붕(512~1024): 밝은 지붕 + 에어컨
  g.fillStyle = t.roof;
  g.fillRect(512, 512, 512, 256);
  g.fillStyle = "#b7c0ca";
  g.fillRect(620, 575, 300, 126);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
// 버스 상자의 면마다 텍스처의 다른 칸을 쓰게 UV를 바꾼다(상자 면 순서: +x, -x, +y, -y, +z(앞), -z(뒤))
function makeBusGeometry() {
  const geo = new THREE.BoxGeometry(BUS_WID, BUS_H, BUS_LEN);
  const uv = geo.attributes.uv;
  const regions = [
    [0, 1, 0.75, 1], // +x: 왼쪽 옆면
    [0, 1, 0.5, 0.75], // -x: 오른쪽 옆면(문 쪽)
    [0.5, 1, 0.25, 0.5], // +y: 지붕
    [0.5, 1, 0.25, 0.5], // -y: 바닥(안 보임)
    [0, 0.25, 0.25, 0.5], // +z: 앞
    [0.25, 0.5, 0.25, 0.5], // -z: 뒤
  ];
  for (let f = 0; f < 6; f++) {
    const [u0, u1, v0, v1] = regions[f];
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
    }
  }
  uv.needsUpdate = true;
  return geo;
}

function buildCars() {
  buildCarNetwork();
  cars = [];
  const total = CAR_COUNT + BUS_COUNT;
  const bodyGeo = new THREE.BoxGeometry(CAR_WID, 0.11, CAR_LEN);
  const cabinGeo = new THREE.BoxGeometry(CAR_WID * 0.86, 0.085, CAR_LEN * 0.5);
  const wheelGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.045, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  const shadowGeo = new THREE.CircleGeometry(1, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const body = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.35 }), CAR_COUNT);
  const cabin = new THREE.InstancedMesh(cabinGeo, new THREE.MeshStandardMaterial({ color: 0x24313d, roughness: 0.2, metalness: 0.6 }), CAR_COUNT);
  const wheels = new THREE.InstancedMesh(wheelGeo, new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.9 }), total * 4);
  const shadow = new THREE.InstancedMesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }), total);
  const busGeo = makeBusGeometry();
  const buses = BUS_TYPES.map((t) => new THREE.InstancedMesh(busGeo, new THREE.MeshStandardMaterial({ map: makeBusTexture(t), roughness: 0.55, metalness: 0.15 }), BUS_COUNT));
  for (let k = 0; k < CAR_COUNT; k++) {
    body.setColorAt(k, new THREE.Color(CAR_COLORS[k % CAR_COLORS.length]));
    cars.push({ active: false, index: k, type: "car", len: CAR_LEN, wid: CAR_WID });
  }
  for (let k = 0; k < BUS_COUNT; k++) {
    cars.push({ active: false, index: k, type: "bus", busType: k % BUS_TYPES.length, len: BUS_LEN, wid: BUS_WID });
  }
  [body, cabin, wheels, shadow, ...buses].forEach((m) => {
    m.frustumCulled = false; // 인스턴스가 계속 움직여서 미리 잡은 경계로 자르면 안 된다
    m.count = 0;
    scene.add(m);
  });
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  carMeshes = { body, cabin, wheels, shadow, buses };
}

function chooseNextRoad(car) {
  const endWhich = car.dir > 0 ? "b" : "a";
  const node = carNodes.get(`${car.seg}:${endWhich}`);
  const options = node ? node.members.filter((m) => m.i !== car.seg) : [];
  if (!options.length) return null;
  // 지금 진행 방향과 비슷한(곧게 가는) 길을 더 자주 고른다. 버스는 큰길을 훨씬 더 자주 고른다.
  const weights = options.map((m) => {
    const nr = carRoads[m.i];
    const q = m.which === "a" ? polyPointAt(nr.pts, nr.cum, 0) : polyPointAt(nr.pts, nr.cum, nr.L);
    const ox = m.which === "a" ? q.dx : -q.dx, oz = m.which === "a" ? q.dz : -q.dz;
    const dot = car.fx * ox + car.fz * oz;
    let wgt = 0.25 + Math.max(0, dot) * 2;
    if (car.type === "bus") wgt *= nr.w >= BUS_ROAD_MIN_WIDTH ? 4 : 0.15;
    return wgt;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let pick = Math.random() * total;
  for (let k = 0; k < options.length; k++) {
    pick -= weights[k];
    if (pick <= 0) return options[k];
  }
  return options[options.length - 1];
}

function startCarTurn(car) {
  const m = chooseNextRoad(car);
  if (!m) {
    car.dir = -car.dir; // 막다른 길: 그 자리에서 돌아 나온다
    return;
  }
  const nr = carRoads[m.i];
  const dir = m.which === "a" ? 1 : -1;
  const s = dir > 0 ? nr.gapA : nr.L - nr.gapB;
  let lane;
  if (car.type === "bus") lane = nr.lanes[nr.lanes.length - 1];
  else {
    const idx = carRoads[car.seg].lanes.indexOf(car.lane);
    lane = nr.lanes[Math.min(nr.lanes.length - 1, Math.max(0, idx))];
  }
  const p1 = carRoadPose(nr, s, dir, lane);
  const p0 = { x: car.x, z: car.z };
  // 제어점: 들어오는 방향 직선과 나가는 방향 직선이 만나는 점(없으면 두 점의 중간)
  let cx = (p0.x + p1.x) / 2, cz = (p0.z + p1.z) / 2;
  const det = car.fx * -p1.fz - car.fz * -p1.fx;
  if (Math.abs(det) > 0.15) {
    const dx = p1.x - p0.x, dz = p1.z - p0.z;
    const u = (dx * -p1.fz - dz * -p1.fx) / det;
    if (u > 0 && u < 12) { cx = p0.x + car.fx * u; cz = p0.z + car.fz * u; }
  }
  let len = 0, px = p0.x, pz = p0.z;
  for (let k = 1; k <= 8; k++) {
    const t = k / 8, w = 1 - t;
    const qx = w * w * p0.x + 2 * w * t * cx + t * t * p1.x, qz = w * w * p0.z + 2 * w * t * cz + t * t * p1.z;
    len += Math.hypot(qx - px, qz - pz);
    px = qx; pz = qz;
  }
  car.mode = "turn";
  car.turn = { p0, c: { x: cx, z: cz }, p1, len: Math.max(0.05, len), t: 0, next: { seg: m.i, dir, s, lane } };
}

function speedToStopWithin(distWorld) {
  return distWorld <= 0 ? 0 : Math.sqrt(2 * CAR_DECEL * distWorld);
}

function updateCars(dt) {
  if (!carMeshes || !character) return;
  const W = WORLD_SCALE;
  const cp = character.position;
  carRespawnTimer += dt;
  if (carRespawnTimer > 0.5) {
    carRespawnTimer = 0;
    cars.forEach((car) => {
      if (!car.active || Math.hypot(car.x - cp.x, car.z - cp.z) > VEHICLE_DESPAWN) {
        car.active = false;
        spawnCar(car);
      }
    });
  }
  cars.forEach((car) => {
    if (!car.active) return;
    let limit = car.maxSpeed;
    // 앞에 사람(캐릭터)이 있으면 멈춘다
    const ax = cp.x - car.x, az = cp.z - car.z;
    const ahead = ax * car.fx + az * car.fz;
    const side = Math.abs(ax * -car.fz + az * car.fx);
    if (ahead > 0 && ahead < car.len * 0.5 + 1.8 && side < car.wid * 0.5 + 0.25) {
      limit = Math.min(limit, speedToStopWithin(ahead - car.len * 0.5 - 0.35));
    }
    if (car.mode === "road") {
      const r = carRoads[car.seg];
      const endWhich = car.dir > 0 ? "b" : "a";
      // 신호
      const sig = signalStateFor(car.seg, endWhich);
      if (sig && sig !== "G") {
        const arm = signalArms.get(`${car.seg}:${endWhich}`);
        const stopS = car.dir > 0 ? r.L - arm.stopFromEnd : arm.stopFromEnd;
        const toStop = (stopS - car.s) * car.dir; // raw, 정지선까지
        if (toStop > -0.3 && !(sig === "Y" && toStop < 3)) {
          limit = Math.min(limit, speedToStopWithin((toStop - 0.4) * W - car.len * 0.5));
        }
      }
      // 앞차(같은 도로·방향·차로에서 가장 가까운 앞차)
      let lead = null, gapRaw = Infinity;
      cars.forEach((o) => {
        if (o === car || !o.active || o.mode !== "road" || o.seg !== car.seg || o.dir !== car.dir || Math.abs(o.lane - car.lane) > 0.5) return;
        const d = (o.s - car.s) * car.dir;
        if (d > 0 && d < gapRaw) { gapRaw = d; lead = o; }
      });
      if (lead) limit = Math.min(limit, speedToStopWithin(gapRaw * W - (car.len + lead.len) * 0.5 - 0.25));
      car.speed += Math.max(-CAR_DECEL * dt, Math.min(CAR_ACCEL * dt, limit - car.speed));
      car.speed = Math.max(0, car.speed);
      car.s += (car.dir * car.speed * dt) / W;
      const pose = carRoadPose(r, car.s, car.dir, car.lane);
      car.x = pose.x; car.z = pose.z; car.fx = pose.fx; car.fz = pose.fz;
      const turnAt = car.dir > 0 ? r.L - r.gapB : r.gapA;
      if ((car.dir > 0 && car.s >= turnAt) || (car.dir < 0 && car.s <= turnAt)) startCarTurn(car);
    } else {
      const tn = car.turn;
      car.speed += Math.max(-CAR_DECEL * dt, Math.min(CAR_ACCEL * dt, Math.min(limit, car.maxSpeed * 0.75) - car.speed));
      car.speed = Math.max(0, car.speed);
      tn.t = Math.min(1, tn.t + (car.speed * dt) / tn.len);
      const t = tn.t, w = 1 - t;
      const x = w * w * tn.p0.x + 2 * w * t * tn.c.x + t * t * tn.p1.x;
      const z = w * w * tn.p0.z + 2 * w * t * tn.c.z + t * t * tn.p1.z;
      const dx = 2 * w * (tn.c.x - tn.p0.x) + 2 * t * (tn.p1.x - tn.c.x);
      const dz = 2 * w * (tn.c.z - tn.p0.z) + 2 * t * (tn.p1.z - tn.c.z);
      const dl = Math.hypot(dx, dz) || 1;
      car.x = x; car.z = z; car.fx = dx / dl; car.fz = dz / dl;
      if (tn.t >= 1) {
        Object.assign(car, { mode: "road", seg: tn.next.seg, dir: tn.next.dir, s: tn.next.s, lane: tn.next.lane, turn: null });
      }
    }
  });
  // 그리기(종류별로 활성인 것만 앞쪽 칸에 모아서)
  const { body, cabin, wheels, shadow, buses } = carMeshes;
  const m = new THREE.Matrix4(), part = new THREE.Matrix4(), base = new THREE.Matrix4(), sc = new THREE.Matrix4();
  const y0 = 0.012;
  let nCar = 0, nAll = 0;
  const nBus = BUS_TYPES.map(() => 0);
  cars.forEach((car) => {
    if (!car.active) return;
    base.makeRotationY(Math.atan2(car.fx, car.fz)).setPosition(car.x, y0, car.z);
    shadow.setMatrixAt(nAll, m.multiplyMatrices(base, part.makeScale(car.wid * 0.75, 1, car.len * 0.62)));
    if (car.type === "bus") {
      const mesh = buses[car.busType];
      mesh.setMatrixAt(nBus[car.busType]++, m.multiplyMatrices(base, part.makeTranslation(0, BUS_CLEARANCE + BUS_H / 2, 0)));
      let w = 0;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        m.multiplyMatrices(base, part.makeTranslation(sx * (BUS_WID / 2 - 0.015), 0.06, sz * 0.56));
        wheels.setMatrixAt(nAll * 4 + w, m.multiply(sc.makeScale(1.35, 1.35, 1.35)));
        w++;
      }
    } else {
      body.setMatrixAt(nCar, m.multiplyMatrices(base, part.makeTranslation(0, 0.1, 0)));
      cabin.setMatrixAt(nCar, m.multiplyMatrices(base, part.makeTranslation(0, 0.195, -0.04)));
      if (body.instanceColor && car.colorSlot !== nCar) {
        body.setColorAt(nCar, new THREE.Color(CAR_COLORS[car.index % CAR_COLORS.length]));
        car.colorSlot = nCar;
        body.instanceColor.needsUpdate = true;
      }
      let w = 0;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        wheels.setMatrixAt(nAll * 4 + w, m.multiplyMatrices(base, part.makeTranslation(sx * (CAR_WID / 2 - 0.01), 0.045, sz * 0.26)));
        w++;
      }
      nCar++;
    }
    nAll++;
  });
  body.count = cabin.count = nCar;
  shadow.count = nAll;
  wheels.count = nAll * 4;
  buses.forEach((mesh, k) => { mesh.count = nBus[k]; });
  [body, cabin, wheels, shadow, ...buses].forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
}

// ════════════════════════════════════════════════════════════════════════════
// ── 걷는 행인: 캐릭터 주변 보도 위를 오가는 사람들(몸통·머리·팔다리를 종류별 인스턴스 하나로) ──
// 보도를 만들 때 남겨 둔 보도 중앙선(pedPaths)을 따라 걷다가 끝에서 돌아서고, 멀어지면 캐릭터 근처 보도로
// 다시 보낸다. 그중 몇 명은 "수상한 사람"(검은 코트·모자·선글라스) — 캐릭터가 다가가면 멈춰 서서 쳐다보고,
// 아주 가까워지면 안전 안내가 뜬다. 부담이 크면 PED_COUNT를 줄이거나 0으로 두면 된다.
// ════════════════════════════════════════════════════════════════════════════
const PED_COUNT = 24;
const PED_SUSPICIOUS = 2; // 위 인원 중 수상한 사람 수
const PED_SPAWN_MAX = 30;
const PED_DESPAWN = 42;
const SUSPICIOUS_WATCH_RANGE = 3.2; // 이 안으로 오면 멈춰 서서 캐릭터를 쳐다본다
const SUSPICIOUS_WARN_RANGE = 1.8; // 이 안이면 안전 안내
const PED_SHIRTS = [0x2f6db5, 0xd94d4d, 0xf2c14e, 0x3a9d5d, 0xf2f2f2, 0x6b4fa3, 0xe58b3a, 0x222831, 0x8fb8de];
const PED_PANTS = [0x2b3442, 0x3b4f7a, 0x1d1f22, 0x6b5b4b, 0x5a6470];
const PED_SKIN = [0xf1c9a5, 0xe0b088, 0xd29b74];
const SUSPICIOUS_COAT = 0x2e2a27;
const SUSPICIOUS_PANTS = 0x18191b;
const pedPaths = []; // { pts: [[x,z]...], cum, len } — 월드 좌표
let peds = [];
let pedMeshes = null;
let pedRespawnTimer = 0;
let suspiciousToastCooldown = 0;

function pedColors(ped) {
  const slot = ped.slot;
  const skin = new THREE.Color(PED_SKIN[(slot * 7) % PED_SKIN.length]);
  if (ped.type === "suspicious") {
    return { shirt: new THREE.Color(SUSPICIOUS_COAT), pants: new THREE.Color(SUSPICIOUS_PANTS), skin };
  }
  return { shirt: new THREE.Color(PED_SHIRTS[slot % PED_SHIRTS.length]), pants: new THREE.Color(PED_PANTS[(slot * 3) % PED_PANTS.length]), skin };
}

// 걷는 길 위의 위치(d)를 길 모양에서 찾는다 — 지난 구간 번호(ped.k)에서 이어서 찾아 빠르다
function pathPose(path, d, hint) {
  const cum = path.cum;
  let k = Math.min(hint || 0, cum.length - 2);
  while (k < cum.length - 2 && cum[k + 1] < d) k++;
  while (k > 0 && cum[k] > d) k--;
  const a = path.pts[k], b = path.pts[k + 1];
  const segLen = cum[k + 1] - cum[k] || 1e-6;
  const t = (d - cum[k]) / segLen;
  return { k, x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, tx: (b[0] - a[0]) / segLen, tz: (b[1] - a[1]) / segLen };
}
// 점에서 가장 가까운 길 위 위치(d) — 쫓아가다가 길로 돌아올 때 쓴다
function nearestOnPath(path, x, z) {
  let best = { dist: Infinity, d: 0 };
  for (let k = 0; k < path.pts.length - 1; k++) {
    const [ax, az] = path.pts[k], [bx, bz] = path.pts[k + 1];
    const vx = bx - ax, vz = bz - az;
    const len2 = vx * vx + vz * vz || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / len2));
    const dist = Math.hypot(x - (ax + vx * t), z - (az + vz * t));
    if (dist < best.dist) best = { dist, d: path.cum[k] + Math.sqrt(len2) * t, k };
  }
  return best;
}

function buildPedestrians() {
  peds = [];
  pedMeshes = null;
  if (!PED_COUNT || !pedPaths.length) return;
  const nSus = Math.min(PED_SUSPICIOUS, PED_COUNT);
  const mk = (geo, color, count) => {
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.8 }), Math.max(1, count));
    mesh.frustumCulled = false;
    mesh.count = 0;
    scene.add(mesh);
    return mesh;
  };
  const torsoGeo = new THREE.BoxGeometry(0.12, 0.15, 0.07);
  const headGeo = new THREE.SphereGeometry(0.045, 10, 8);
  const legGeo = new THREE.BoxGeometry(0.042, 0.17, 0.045);
  legGeo.translate(0, -0.085, 0); // 엉덩이를 축으로 흔들리게
  const armGeo = new THREE.BoxGeometry(0.03, 0.14, 0.034);
  armGeo.translate(0, -0.07, 0); // 어깨를 축으로
  const shadowGeo = new THREE.CircleGeometry(0.075, 12);
  shadowGeo.rotateX(-Math.PI / 2);
  // 수상한 사람 전용 소품: 챙 모자, 긴 코트 자락, 선글라스
  const hatGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.045, 12);
  const brimGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.008, 14);
  const coatGeo = new THREE.BoxGeometry(0.13, 0.12, 0.08);
  const shadesGeo = new THREE.BoxGeometry(0.075, 0.016, 0.012);
  pedMeshes = {
    torso: mk(torsoGeo, 0xffffff, PED_COUNT),
    head: mk(headGeo, 0xffffff, PED_COUNT),
    legs: mk(legGeo, 0xffffff, PED_COUNT * 2),
    arms: mk(armGeo, 0xffffff, PED_COUNT * 2),
    hat: mk(hatGeo, 0x1b1c1f, nSus),
    brim: mk(brimGeo, 0x1b1c1f, nSus),
    coat: mk(coatGeo, SUSPICIOUS_COAT, nSus),
    shades: mk(shadesGeo, 0x050505, nSus),
    shadow: (() => {
      const s = new THREE.InstancedMesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }), PED_COUNT);
      s.frustumCulled = false;
      s.count = 0;
      scene.add(s);
      return s;
    })(),
  };
  for (let k = 0; k < PED_COUNT; k++) {
    const ped = { active: false, slot: k, phase: Math.random() * 6, type: k >= PED_COUNT - nSus ? "suspicious" : "normal" };
    const c = pedColors(ped);
    pedMeshes.torso.setColorAt(k, c.shirt);
    pedMeshes.head.setColorAt(k, c.skin);
    pedMeshes.legs.setColorAt(k * 2, c.pants);
    pedMeshes.legs.setColorAt(k * 2 + 1, c.pants);
    pedMeshes.arms.setColorAt(k * 2, c.shirt);
    pedMeshes.arms.setColorAt(k * 2 + 1, c.shirt);
    peds.push(ped);
  }
  ["torso", "head", "legs", "arms"].forEach((key) => {
    if (pedMeshes[key].instanceColor) pedMeshes[key].instanceColor.needsUpdate = true;
  });
}

function spawnPed(ped) {
  const cp = character.position;
  for (let attempt = 0; attempt < 25; attempt++) {
    const path = pedPaths[Math.floor(Math.random() * pedPaths.length)];
    const d = Math.random() * path.len;
    const q = pointAlongPolyline(path.pts, d);
    if (Math.hypot(q.x - cp.x, q.z - cp.z) > PED_SPAWN_MAX) continue;
    Object.assign(ped, {
      active: true, path, d, dir: Math.random() < 0.5 ? 1 : -1, x: q.x, z: q.z,
      speed: ped.type === "suspicious" ? 0.4 + Math.random() * 0.2 : 0.55 + Math.random() * 0.45,
      lateral: (Math.random() - 0.5) * 0.24, k: 0,
    });
    return true;
  }
  return false;
}

function updatePedestrians(dt) {
  if (!pedMeshes || !character) return;
  const cp = character.position;
  suspiciousToastCooldown = Math.max(0, suspiciousToastCooldown - dt);
  pedRespawnTimer += dt;
  if (pedRespawnTimer > 0.6) {
    pedRespawnTimer = 0;
    peds.forEach((ped) => {
      if (!ped.active || Math.hypot(ped.x - cp.x, ped.z - cp.z) > PED_DESPAWN) {
        ped.active = false;
        spawnPed(ped);
      }
    });
  }
  const { torso, head, legs, arms, hat, brim, coat, shades, shadow } = pedMeshes;
  const m = new THREE.Matrix4(), base = new THREE.Matrix4(), part = new THREE.Matrix4(), rot = new THREE.Matrix4();
  const y0 = SIDEWALK_TOP_Y;
  let n = 0, ns = 0;
  peds.forEach((ped) => {
    if (!ped.active) return;
    const path = ped.path;
    const toCharX = cp.x - ped.x, toCharZ = cp.z - ped.z;
    const charDist = Math.hypot(toCharX, toCharZ);
    // 수상한 사람: 캐릭터가 다가오면 멈춰 서서 쳐다본다
    const watching = ped.type === "suspicious" && charDist < SUSPICIOUS_WATCH_RANGE && !currentErrand;
    if (watching && charDist < SUSPICIOUS_WARN_RANGE && suspiciousToastCooldown <= 0) {
      showToast("😨 수상한 사람이 쳐다봐요! 따라가지 말고 사람 많은 곳으로 가요");
      suspiciousToastCooldown = 12;
    }
    if (!watching) {
      ped.d += ped.dir * ped.speed * dt;
      if (ped.d >= path.len) { ped.d = path.len; ped.dir = -1; }
      if (ped.d <= 0) { ped.d = 0; ped.dir = 1; }
    }
    const q = pathPose(path, ped.d, ped.k);
    ped.k = q.k;
    ped.x = q.x - q.tz * ped.lateral;
    ped.z = q.z + q.tx * ped.lateral;
    let fx = q.tx * ped.dir, fz = q.tz * ped.dir;
    if (watching && charDist > 1e-3) { fx = toCharX / charDist; fz = toCharZ / charDist; }
    if (!watching) ped.phase += ped.speed * dt * 11;
    const swing = watching ? 0 : Math.sin(ped.phase) * 0.5;
    const bob = watching ? 0 : Math.abs(Math.cos(ped.phase)) * 0.008;
    base.makeRotationY(Math.atan2(fx, fz)).setPosition(ped.x, y0 + bob, ped.z);
    torso.setMatrixAt(n, m.multiplyMatrices(base, part.makeTranslation(0, 0.245, 0)));
    head.setMatrixAt(n, m.multiplyMatrices(base, part.makeTranslation(0, 0.37, 0)));
    shadow.setMatrixAt(n, m.multiplyMatrices(base, part.makeTranslation(0, 0.003 - bob, 0)));
    [-1, 1].forEach((sideSign, li) => {
      const legSwing = swing * sideSign;
      m.multiplyMatrices(base, part.makeTranslation(sideSign * 0.03, 0.17, 0));
      m.multiply(rot.makeRotationX(legSwing));
      legs.setMatrixAt(n * 2 + li, m);
      m.multiplyMatrices(base, part.makeTranslation(sideSign * 0.077, 0.31, 0));
      m.multiply(rot.makeRotationX(-legSwing * 0.8));
      arms.setMatrixAt(n * 2 + li, m);
    });
    if (ped.type === "suspicious") {
      hat.setMatrixAt(ns, m.multiplyMatrices(base, part.makeTranslation(0, 0.425, 0)));
      brim.setMatrixAt(ns, m.multiplyMatrices(base, part.makeTranslation(0, 0.405, 0)));
      coat.setMatrixAt(ns, m.multiplyMatrices(base, part.makeTranslation(0, 0.13, 0)));
      shades.setMatrixAt(ns, m.multiplyMatrices(base, part.makeTranslation(0, 0.378, 0.04)));
      ns++;
    }
    if (ped.colorSlot !== n) {
      // 활성 행인을 앞쪽 칸으로 모으므로, 칸이 바뀌면 그 칸의 색을 이 사람 옷 색으로 다시 칠한다
      const c = pedColors(ped);
      torso.setColorAt(n, c.shirt);
      head.setColorAt(n, c.skin);
      legs.setColorAt(n * 2, c.pants); legs.setColorAt(n * 2 + 1, c.pants);
      arms.setColorAt(n * 2, c.shirt); arms.setColorAt(n * 2 + 1, c.shirt);
      [torso, head, legs, arms].forEach((mesh) => { if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; });
      ped.colorSlot = n;
    }
    n++;
  });
  torso.count = head.count = shadow.count = n;
  legs.count = arms.count = n * 2;
  hat.count = brim.count = coat.count = shades.count = ns;
  [torso, head, legs, arms, hat, brim, coat, shades, shadow].forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
}

// ════════════════════════════════════════════════════════════════════════════
// ── 성능 도우미 ──
// · 화면 해상도 자동 조절: 2초마다 FPS를 재서 40 아래면 해상도 배율을 0.25씩 낮추고(최저 1배),
//   57 넘게 여유가 3번 이어지면 다시 올린다(최대 1.5배).
// · FPS 표시: 주소 끝에 ?fps 를 붙이면(예: index.html?fps) 화면 구석에 FPS·드로우콜·삼각형 수가 뜬다.
// ════════════════════════════════════════════════════════════════════════════
const PERF_MAX_PIXEL_RATIO = 1.5;
let perfFrames = 0, perfTime = 0, perfGoodStreak = 0, perfPixelRatio = 1;
let fpsEl = null;
function initPerformanceHelpers() {
  perfPixelRatio = Math.min(window.devicePixelRatio || 1, PERF_MAX_PIXEL_RATIO);
  const wantFps = /[?&]fps\b/.test(location.search) || (() => { try { return localStorage.getItem("roymaker-fps") === "1"; } catch (err) { return false; } })();
  if (wantFps && wrapEl && !fpsEl) {
    fpsEl = document.createElement("div");
    fpsEl.style.cssText = "position:absolute; left:8px; bottom:8px; z-index:5; background:rgba(0,0,0,.6); color:#fff; font:12px/1.4 monospace; padding:4px 8px; border-radius:6px; pointer-events:none; white-space:pre;";
    wrapEl.appendChild(fpsEl);
  }
}
function updatePerformance(dt) {
  perfFrames++;
  perfTime += dt;
  if (perfTime < 2) return;
  const fps = perfFrames / perfTime;
  perfFrames = 0;
  perfTime = 0;
  const maxPR = Math.min(window.devicePixelRatio || 1, PERF_MAX_PIXEL_RATIO);
  if (fps < 40 && perfPixelRatio > 1) {
    perfPixelRatio = Math.max(1, perfPixelRatio - 0.25);
    renderer.setPixelRatio(perfPixelRatio);
    resize();
    perfGoodStreak = 0;
  } else if (fps > 57 && perfPixelRatio < maxPR) {
    perfGoodStreak++;
    if (perfGoodStreak >= 3) {
      perfPixelRatio = Math.min(maxPR, perfPixelRatio + 0.25);
      renderer.setPixelRatio(perfPixelRatio);
      resize();
      perfGoodStreak = 0;
    }
  } else {
    perfGoodStreak = 0;
  }
  if (fpsEl) {
    const info = renderer.info.render;
    const activeCars = cars.filter((c) => c.active).length;
    const activePeds = peds.filter((p) => p.active).length;
    fpsEl.textContent = `FPS ${fps.toFixed(0)} · 해상도 ${perfPixelRatio.toFixed(2)}x\n드로우콜 ${info.calls} · 삼각형 ${(info.triangles / 1000).toFixed(0)}k\n차 ${activeCars} · 행인 ${activePeds}`;
  }
}

// 그림자: 태양 그림자 범위를 캐릭터 주변(±SHADOW_HALF)으로 좁혀서 따라다니게 한다 — 같은 512 맵으로 훨씬 선명.
// 그림자 맵 한 칸 단위로 맞춰 움직여서 걸을 때 그림자 가장자리가 지글거리지 않게 한다.
const SHADOW_HALF = 40;
const SUN_OFFSET = new THREE.Vector3(20, 30, 15);
let sunLight = null;
function updateSunFollow() {
  if (!sunLight || !character) return;
  const texel = (SHADOW_HALF * 2) / sunLight.shadow.mapSize.x;
  const tx = Math.round(character.position.x / texel) * texel;
  const tz = Math.round(character.position.z / texel) * texel;
  sunLight.target.position.set(tx, 0, tz);
  sunLight.position.set(tx + SUN_OFFSET.x, SUN_OFFSET.y, tz + SUN_OFFSET.z);
  sunLight.target.updateMatrixWorld();
}

// 한 번 만들고 움직이지 않는 것들(도로·보도·나무·가로등·신호등 등)은 매 프레임 위치 계산을 건너뛰게 고정한다
function freezeStaticObjects(objects) {
  objects.forEach((obj) => obj.traverse((o) => {
    o.matrixAutoUpdate = false;
    o.updateMatrix();
  }));
}

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
  wrapEl = document.getElementById("neighborhood3d-wrap");
  fullscreenBtnEl = document.getElementById("neighborhood3d-fullscreen-btn");
  exitFullscreenBtnEl = document.getElementById("neighborhood3d-exit-fullscreen-btn");
  topZoneEl = document.getElementById("neighborhood3d-top-zone");
  if (!canvasEl || ready || loading) {
    resize();
    if (ready && !rafId) animate();
    return;
  }
  loading = true;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
    // 화면 밀도가 큰 폰·폴드는 픽셀 수가 많아서 GPU가 힘들다 — 1.5배까지만 그리고 나머지는 늘려서 보여준다
    // (눈으로 보기엔 거의 차이가 없고, 픽셀 수는 크게 줄어든다)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    initPerformanceHelpers();
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
    fullscreenBtnEl?.addEventListener("click", requestWrapFullscreen);
    exitFullscreenBtnEl?.addEventListener("click", exitWrapFullscreen);
    topZoneEl?.addEventListener("pointerdown", () => {
      if (isWrapFullscreen()) showExitFullscreenBtnTemporarily();
    });
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
