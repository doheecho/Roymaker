// ── 거리 모험 (프린세스메이커 무사수행 느낌의 아주 기본적인 버전) ──
// 실제 동네를 그대로 옮기는 건 접고, 평범한 한국 거리를 흉내 낸 가상의 길을 만들어서
// 그 위를 걸어 다니며 동전을 줍고 불량배를 처리해 용돈을 버는 걸로 바꿨다.
// walk.glb(이로이 3D 모델 + Walking/Running/Idle/Regular_Jump 등 20개 동작),
// dance.glb(춤 동작들)는 그대로 쓴다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ASSET_VERSION = "20261115o";

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
const WALK_SPEED = 2.4; // m/s
const RUN_SPEED = 5.4; // m/s

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
// 엄마 모델(mom.glb)에 들어있는 춤 동작들 — 걷기/인사 같은 동작은 제외
const MOM_DANCE_POOL = [
  "Cardio_Dance",
  "Denim_Pop_Dance",
  "Gangnam_Groove",
  "Hip_Hop_Dance",
  "Hip_Hop_Dance_2",
  "Hip_Hop_Dance_3",
  "Love_You_Pop_Dance",
  "OMG_Groove",
  "Pod_Baby_Groove",
  "Pop_Dance_LSA2",
  "Superlove_Pop_Dance",
  "You_Groove",
  "jazz_danc",
  "ymca_dance",
];

// ── 동네 생김새: 실제 금호파인힐스 단지 주변(카카오맵 위성사진 기준)을 간단한 박스 매싱으로 재현 ──
// 좌표는 지도 스크린샷에서 번호별 위치를 눈대중으로 읽어 축척(약 1.6m/px)을 적용해 환산한 값이라
// 정밀한 실측은 아니고, 건물 간 상대적인 배치만 실제 동네와 비슷하게 맞췄다.
// 0번(우리집)은 층수·유형 정보가 비어 있어서 주변 금호파인힐스 동과 같은 15층 아파트로 가정했다.
const PLACES = [
  { id: 0, name: "우리집", floors: 15, type: "아파트", x: 0, z: 0, home: true },
  { id: 1, name: "금호파인힐스 101동", floors: 15, type: "아파트", x: -410, z: 94 },
  { id: 2, name: "금호파인힐스 102동", floors: 15, type: "아파트", x: -322, z: 46 },
  { id: 3, name: "금호파인힐스 103동", floors: 15, type: "아파트", x: -261, z: -16 },
  { id: 4, name: "금호파인힐스 104동", floors: 15, type: "아파트", x: -200, z: -69 },
  { id: 5, name: "금호파인힐스 105동·이마트24", floors: 15, type: "아파트", x: -136, z: -133 },
  { id: 6, name: "금호파인힐스 106동", floors: 15, type: "아파트", x: -66, z: -77 },
  { id: 7, name: "금호파인힐스 107동", floors: 15, type: "아파트", x: -141, z: -8 },
  { id: 8, name: "금호파인힐스 108동", floors: 15, type: "아파트", x: -208, z: 59 },
  { id: 9, name: "금호파인힐스 109동", floors: 15, type: "아파트", x: -325, z: 150 },
  { id: 10, name: "금호파인힐스 110동", floors: 15, type: "아파트", x: -261, z: 136 },
  { id: 11, name: "금호파인힐스 111동", floors: 15, type: "아파트", x: -170, z: 144 },
  { id: 12, name: "금호파인힐스 112동", floors: 15, type: "아파트", x: -74, z: 75 },
  { id: 14, name: "금호파인힐스 114동", floors: 15, type: "아파트", x: 0, z: -93 },
  { id: 15, name: "금호파인힐스 115동", floors: 15, type: "아파트", x: -29, z: -149 },
  { id: 16, name: "금호파인힐스 116동", floors: 15, type: "아파트", x: -50, z: 134 },
  { id: 17, name: "파리바게뜨", floors: 6, type: "카페", x: 27, z: -160, diagonal: true },
  { id: 18, name: "대현교회", floors: 4, type: "기타", x: -261, z: -114, church: true },
  { id: 19, name: "금호고등학교", floors: 5, type: "학교", x: -74, z: 203 },
  { id: 20, name: "금호파인힐스 117동", floors: 15, type: "아파트", x: 46, z: 240 },
  { id: 21, name: "금호119안전센터", floors: 2, type: "기타", x: 16, z: 83 },
  { id: 22, name: "성동구립금호도서관", floors: 4, type: "도서관", x: 91, z: 83 },
  { id: 23, name: "성동구보건소금호분소", floors: 4, type: "보건소", x: 104, z: 152 },
  { id: 24, name: "성동아이사랑복합문화센터", floors: 4, type: "기타", x: 139, z: 235 },
  { id: 25, name: "태비KTS태권스쿨", floors: 4, type: "학원", x: 115, z: -88 },
  { id: 26, name: "NEW웰빙마트", floors: 4, type: "중형마트", x: 104, z: -149, diagonal: true },
  { id: 27, name: "롯데마트행당점", floors: 6, type: "대형마트", x: 654, z: -352 },
  { id: 28, name: "메가MGC커피", floors: 2, type: "카페", x: 51, z: -229, diagonal: true },
  { id: 29, name: "아담리즈수학·CU", floors: 3, type: "편의점", x: -104, z: -229 },
  { id: 30, name: "분식집", floors: 4, type: "식당", x: -56, z: -229 },
];

// 유형별 기본 크기·색(사진 참고 — 금호파인힐스는 흰색/베이지 바탕에 주황 포인트, 각 상점은 실제 브랜드 색을 흉내)
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
// 도로 지도(kakaomap_road.png, 사용자가 빨간색으로 직접 도로를 칠해 준 버전) 기준으로 그린 도로망.
// 라벨이나 지하철 5호선(보라색) 표시에 가려진 구간도 전부 도로로 쳤다. 폭은 지도에서 보이는 두께
// 차이를 3단계(큰길/보통길/골목)로 단순화해서 반영했고, 큰길·보통길에는 중앙 차선을 그려 넣었다.
const ROAD_WIDE = 10; // 난계로 같은 큰길
const ROAD_MEDIUM = 6; // 단지 안 보통 도로
const ROAD_NARROW = 3.5; // 건물 사이 좁은 길(차선 없음)
const ROAD_SEGMENTS = [
  // 난계로: 대현교회 → 이마트24 → 메가MGC커피 사거리 → 롯데마트 방향
  { a: [-261, -114], b: [-136, -133], width: ROAD_WIDE },
  { a: [-136, -133], b: [60, -179], width: ROAD_WIDE },
  { a: [60, -179], b: [654, -352], width: ROAD_WIDE },
  // 사거리에서 수직으로 교차하는 큰길(지도상 굵게 표시된, 도서관·안전센터 쪽으로 이어지는 길)
  { a: [60, -179], b: [16, 83], width: ROAD_WIDE },
  { a: [16, 83], b: [104, 152], width: ROAD_WIDE },
  { a: [104, 152], b: [139, 235], width: ROAD_MEDIUM },
  // 단지 서쪽(대현교회~9·10·11동~학교~117동) 안쪽 도로
  { a: [-261, -114], b: [-325, 150], width: ROAD_MEDIUM },
  { a: [-325, 150], b: [-170, 144], width: ROAD_MEDIUM },
  { a: [-170, 144], b: [-74, 203], width: ROAD_MEDIUM },
  { a: [-74, 203], b: [46, 240], width: ROAD_MEDIUM },
  // 이마트24에서 우리집 쪽으로 들어오는 안쪽 골목
  { a: [-136, -133], b: [0, -93], width: ROAD_NARROW },
  { a: [0, -93], b: [0, 0], width: ROAD_NARROW },
];

const AREA_MARGIN = 8;
const AREA_MIN_X = Math.min(...PLACES.map((p) => p.x * WORLD_SCALE)) - AREA_MARGIN;
const AREA_MAX_X = Math.max(...PLACES.map((p) => p.x * WORLD_SCALE)) + AREA_MARGIN;
const AREA_MIN_Z = Math.min(...PLACES.map((p) => p.z * WORLD_SCALE)) - AREA_MARGIN;
const AREA_MAX_Z = Math.max(...PLACES.map((p) => p.z * WORLD_SCALE)) + AREA_MARGIN;

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
}

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

  // 골목(ROAD_NARROW)은 차선이 없고, 큰길·보통길에는 중앙 점선 차선을 그려 넣는다
  if (width === ROAD_NARROW) return;
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xf5e8b0 });
  const dashLen = 1.2 * WORLD_SCALE;
  const gapLen = 1.2 * WORLD_SCALE;
  const step = dashLen + gapLen;
  const dashGeo = new THREE.PlaneGeometry(0.18 * WORLD_SCALE, dashLen);
  dashGeo.rotateX(-Math.PI / 2);
  for (let d = step / 2; d < len; d += step) {
    const dash = new THREE.Mesh(dashGeo, laneMat);
    dash.rotation.y = yaw;
    dash.position.set(x1 + (dx * d) / len, 0.01, z1 + (dz * d) / len);
    scene.add(dash);
  }
}

function buildRoads() {
  ROAD_SEGMENTS.forEach(buildRoadSegment);
}

function buildPlaces() {
  PLACES.forEach((place) => {
    const style = TYPE_STYLE[place.type] || TYPE_STYLE["기타"];
    const px = place.x * WORLD_SCALE;
    const pz = place.z * WORLD_SCALE;
    const w = style.w * WORLD_SCALE;
    const d = style.d * WORLD_SCALE;
    const height = Math.max(0.6, (place.floors || 15) * 3 * WORLD_SCALE);
    const color = NAME_COLOR_OVERRIDE[place.name] ?? style.color;
    const rotY = place.diagonal ? Math.PI / 4 : 0;

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), new THREE.MeshStandardMaterial({ color }));
    mesh.position.set(px, height / 2, pz);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // 아파트 동은 사진 속 흰색/베이지 + 주황 포인트 배색을 얇은 세로 띠로 흉내낸다
    if (place.type === "아파트") {
      const accent = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.22, height, d + 0.3 * WORLD_SCALE),
        new THREE.MeshStandardMaterial({ color: place.home ? 0xff6fa0 : style.accent })
      );
      accent.position.set(px + Math.cos(rotY) * w * 0.36, height / 2, pz - Math.sin(rotY) * w * 0.36);
      accent.rotation.y = rotY;
      accent.castShadow = true;
      scene.add(accent);
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
  spawnItems();
  spawnEnemies();
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
  momMixer.stopAllAction();
  action.reset().setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
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

function onMomClick() {
  if (mom) {
    placeMomBesideCharacter();
    const greet = momActions["Big_Wave_Hello"];
    if (greet) {
      if (momMixer) momMixer.stopAllAction();
      greet.reset().setLoop(THREE.LoopOnce, 1);
      greet.clampWhenFinished = true;
      greet.play();
    }
    return;
  }
  if (momLoading) return;
  momLoading = true;
  momBtnEl.disabled = true;
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
      placeMomBesideCharacter();
      const greet = momActions["Big_Wave_Hello"];
      if (greet) {
        greet.reset().setLoop(THREE.LoopOnce, 1);
        greet.clampWhenFinished = true;
        greet.play();
      }
      momLoading = false;
      momBtnEl.disabled = false;
    },
    undefined,
    (err) => {
      console.warn("엄마 모델을 못 불러왔다", err);
      momLoading = false;
      momBtnEl.disabled = false;
    }
  );
}

// 방향키는 "월드 기준 앞/뒤/좌/우"가 아니라, 지금 마우스로 돌려 둔 카메라가 보는 방향을 기준으로
// 움직인다 — 카메라를 오른쪽으로 돌렸으면 위쪽 키가 그 돌린 방향으로 가도록, camYaw를 매 프레임
// 그대로 반영한다.
function updateMovement(dt) {
  if (!character || dancing) return;
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
