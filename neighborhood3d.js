// ── 거리 모험 (프린세스메이커 무사수행 느낌의 아주 기본적인 버전) ──
// 실제 동네를 그대로 옮기는 건 접고, 평범한 한국 거리를 흉내 낸 가상의 길을 만들어서
// 그 위를 걸어 다니며 동전을 줍고 불량배를 처리해 용돈을 버는 걸로 바꿨다.
// walk.glb(이로이 3D 모델 + Walking/Running/Idle/Regular_Jump 등 20개 동작),
// dance.glb(춤 동작들)는 그대로 쓴다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import * as MAP_DATA from "./map_data.js?v=20261125u";
import { computeRoadMarkings, markedRanges, slicePolyline, roadLook } from "./road_markings.js?v=20261124i";
import { FENCE_TYPES, DEFAULT_FENCE_TYPE } from "./fence_types.js?v=20261125b";

const { PLACES, ROAD_SEGMENTS, TREES, PARKS } = MAP_DATA;
// 길 중간 횡단보도·신호등(맵 에디터 "🚦 신호등 추가"로 찍은 곳) — 예전 map_data.js에는 이 목록이 없을 수 있어서
// 이름을 골라 가져오지 않고(없으면 모듈 전체가 깨진다) 통째로 받아서 있으면 쓴다
const CROSSWALKS = Array.isArray(MAP_DATA.CROSSWALKS) ? MAP_DATA.CROSSWALKS : [];
const FENCES = Array.isArray(MAP_DATA.FENCES) ? MAP_DATA.FENCES : []; // 울타리 토막 { a, b, type, base? }
// 지형 높이(단차): 높이가 다른 구역(예: 금호파크힐스 단지)의 외곽선과 높이 점 — 맵 에디터 "⛰ 지형 높이"로 다룬다
const TERRAIN_ZONES = MAP_DATA.TERRAIN_ENABLED !== false && Array.isArray(MAP_DATA.TERRAIN_ZONES) ? MAP_DATA.TERRAIN_ZONES : []; // TERRAIN_ENABLED: false면 끔
const TERRAIN_POINTS = Array.isArray(MAP_DATA.TERRAIN_POINTS) ? MAP_DATA.TERRAIN_POINTS : [];

const ASSET_VERSION = "20261125b";

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

// ════════════════════════════════════════════════════════════════════════════
// ── 지형 높이(단차) — 주인공 집이 있는 금호파크힐스처럼 바깥 도로보다 높은 단지 ──
// · map_data.js의 TERRAIN_ZONES(구역 외곽선)과 TERRAIN_POINTS(높이 점, h = 바깥 도로 기준 "층", 1층 = 3m)로
//   구역 안의 땅 높이를 정한다: 높이 점들 사이는 거리에 반비례하는 가중 평균(가까운 점일수록 크게)으로 부드럽게 잇는다.
// · 구역 밖은 높이 0(지금까지처럼 평평). 구역 경계에는 옹벽(+높으면 위에 난간)을 세운다 — 단지 출입구(높이 0인
//   점을 둔 곳)는 옹벽 없이 경사로가 된다.
// · 게임 계산(걷기·충돌·행인·차 경로 등)은 전부 평평한 땅 기준 그대로 두고, "그릴 때만" 구역 안의 모든 꼭짓점을
//   그 자리 땅 높이만큼 올린다(three.js의 project_vertex·worldpos_vertex 조각을 고쳐서 — 건물·도로·나무·사람·차·
//   캐릭터·그림자까지 한 번에 같이 올라간다). 구역 밖 물체는 계산을 바로 건너뛰어서 부담이 거의 없다.
// ════════════════════════════════════════════════════════════════════════════
const TERRAIN_FLOOR_M = 3; // 1층 높이(raw m)
const terrainZones = TERRAIN_ZONES.map((zone) => {
  const poly = (zone.poly || []).map(([x, z]) => [x * WORLD_SCALE, z * WORLD_SCALE]);
  if (poly.length < 3) return null;
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  poly.forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); });
  return { name: zone.name || "", poly, box: [x0, z0, x1, z1], points: [] };
}).filter(Boolean);
function pointInPoly2(x, z, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > z) !== (b[1] > z) && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
// 높이 점은 그 점이 들어 있는(또는 경계에서 15m 안인) 구역에 속한다 — 출입구 점은 경계선 위에 찍어도 된다
TERRAIN_POINTS.forEach((pt) => {
  const x = pt.x * WORLD_SCALE, z = pt.z * WORLD_SCALE, h = (pt.h || 0) * TERRAIN_FLOOR_M * WORLD_SCALE;
  const zone = terrainZones.find((zn) => pointInPoly2(x, z, zn.poly)) ||
    terrainZones.find((zn) => zn.poly.some((a, i) => { const b = zn.poly[(i + 1) % zn.poly.length]; return distToSegmentRaw(x, z, a, b) < 15 * WORLD_SCALE; }));
  if (zone) zone.points.push([x, z, h]);
});
function distToSegmentRaw(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / L2));
  return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t);
}
const TERRAIN_EPS = 0.006; // 가중치 계산의 작은 값(월드² — 높이 점 바로 위에서 0으로 나누지 않게)
// 구역 안 땅 높이(외곽선 검사 없이) — 셰이더와 같은 식
function zoneHeightRaw(zone, x, z) {
  if (!zone.points.length) return 0;
  let sw = 0, sh = 0;
  for (const [px, pz, h] of zone.points) {
    const w = 1 / ((x - px) * (x - px) + (z - pz) * (z - pz) + TERRAIN_EPS);
    sw += w;
    sh += w * h;
  }
  return sh / sw;
}
// 월드 좌표 (x, z)의 땅 높이(월드 단위) — 구역 밖이면 0
function terrainAt(x, z) {
  for (const zone of terrainZones) {
    const [x0, z0, x1, z1] = zone.box;
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    if (pointInPoly2(x, z, zone.poly)) return zoneHeightRaw(zone, x, z);
  }
  return 0;
}
// 셰이더용 함수(구역·점 값을 상수로 박아 넣는다 — 맵을 불러올 때 한 번 만든다)
function buildTerrainGLSL() {
  const f = (v) => (Number.isInteger(v) ? v.toFixed(1) : String(+v.toFixed(5)));
  const parts = ["float nbZoneH(vec2 p, int zi) { return 0.0; }"];
  const insideFns = [], heightFns = [];
  terrainZones.forEach((zone, zi) => {
    const n = zone.poly.length, m = Math.max(1, zone.points.length);
    const pts = zone.points.length ? zone.points : [[0, 0, 0]];
    parts.push(`const vec2 NB_POLY${zi}[${n}] = vec2[${n}](${zone.poly.map(([x, z]) => `vec2(${f(x)}, ${f(z)})`).join(", ")});`);
    parts.push(`const vec3 NB_PTS${zi}[${m}] = vec3[${m}](${pts.map(([x, z, h]) => `vec3(${f(x)}, ${f(z)}, ${f(h)})`).join(", ")});`);
    parts.push(`bool nbIn${zi}(vec2 p) {
  if (p.x < ${f(zone.box[0])} || p.x > ${f(zone.box[2])} || p.y < ${f(zone.box[1])} || p.y > ${f(zone.box[3])}) return false;
  bool c = false;
  for (int i = 0, j = ${n - 1}; i < ${n}; j = i++) {
    vec2 a = NB_POLY${zi}[i], b = NB_POLY${zi}[j];
    if (((a.y > p.y) != (b.y > p.y)) && (p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x)) c = !c;
  }
  return c;
}
float nbH${zi}(vec2 p) {
  float sw = 0.0, sh = 0.0;
  for (int i = 0; i < ${m}; i++) { vec2 d = p - NB_PTS${zi}[i].xy; float w = 1.0 / (dot(d, d) + ${f(TERRAIN_EPS)}); sw += w; sh += w * NB_PTS${zi}[i].z; }
  return sh / sw;
}`);
    insideFns.push(`nbIn${zi}(p)`);
    heightFns.push(`if (nbIn${zi}(p)) return nbH${zi}(p);`);
  });
  parts.push(`bool nbInZone(vec2 p) { return ${insideFns.join(" || ") || "false"}; }`);
  // 외곽선 검사 없이(구역 사각 범위 안이면) 그 구역 높이 — 땅 메시 가장자리가 옹벽 꼭대기까지 꽉 차게
  parts.push(`float nbTerrainAny(vec2 p) { ${terrainZones.map((zone, zi) => `if (p.x >= ${f(zone.box[0] - 2)} && p.x <= ${f(zone.box[2] + 2)} && p.y >= ${f(zone.box[1] - 2)} && p.y <= ${f(zone.box[3] + 2)}) return nbH${zi}(p);`).join(" ")} return 0.0; }`);
  parts.push(`float nbTerrain(vec2 p) { ${heightFns.join(" ")} return 0.0; }`);
  return parts.slice(1).join("\n");
}
if (terrainZones.length) {
  // 모든 재질의 정점 위치 계산(project_vertex)과 그림자·환경용 월드 위치(worldpos_vertex)에 땅 높이를 더한다
  THREE.ShaderChunk.common += "\n" + buildTerrainGLSL() + "\n";
  THREE.ShaderChunk.project_vertex = THREE.ShaderChunk.project_vertex.replace(
    "mvPosition = modelViewMatrix * mvPosition;",
    "vec4 nbWorldPos = modelMatrix * mvPosition;\n#ifndef NB_TERRAIN_BAKED\nnbWorldPos.y += nbTerrain(nbWorldPos.xz);\n#endif\nmvPosition = viewMatrix * nbWorldPos;"
  );
  THREE.ShaderChunk.worldpos_vertex = THREE.ShaderChunk.worldpos_vertex.replace(
    "worldPosition = modelMatrix * worldPosition;",
    "worldPosition = modelMatrix * worldPosition;\n#ifndef NB_TERRAIN_BAKED\n\tworldPosition.y += nbTerrain(worldPosition.xz);\n#endif"
  );
}
// 도로 지도(kakaomap_road1.png, 사용자가 건물번호 지도와 같은 위성사진 위에 빨간색으로 도로를
// 직접 칠해 준 버전) 기준. 이 지도는 번호 지도(kakaomap_number.png)와 완전히 같은 사진이라, 건물
// 좌표를 구할 때 썼던 것과 같은 축척·기준점으로 도로 모양을 그대로 옮길 수 있었다 — 빨간색 영역을
// 이미지 처리(색상 추출→스켈레톤화→그래프 추출)로 따서 중심선과 각 구간의 실제 두께를 함께 구했고,
// 두께 분포(3~5m / 13m 안팎 / 19~29m / 30m 이상)를 그대로 골목·보통길·큰길·난계로급 4단계 폭으로
// 옮겼다. map_data.js의 각 구간은 이 상수 대신 실측한 raw 숫자를 그대로 쓰지만(map_editor.html이
// 혹시 몰라 이 이름들도 폭으로 해석할 수 있게 남겨 둔다), 표면 색·중앙선·차선은 폭 숫자 자체로
// 구간마다 정한다(roadLook: 도로 종류 kind·왕복 차로 수 lanes·폭 — 아래 "도로 모양" 설명 참고).
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

  hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d9a7a, 1.1);
  scene.add(hemiLight);
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
  bg.renderOrder = -3;
  scene.add(bg);

  // 네이버 지도 이미지를 실제 좌표에 맞춰 바닥에 깐다(없으면 위의 초록 바닥이 그대로 보임)
  buildMapGround(scene);
  // [실험 중] 실제 금호동 지형(GameMap.glb) — 아직 위치·크기 보정 전, 비교해 보려고 일단 얹어만 둔다
  buildGlbTerrain(scene);

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
  buildFences();
  buildTerrainWalls();
  tessellateForTerrain(scene.children.filter((o) => !before.has(o)));
  freezeStaticObjects([bg, ...scene.children.filter((o) => !before.has(o))]);
  buildPlaces();
  before = new Set(scene.children);
  buildTrees();
  freezeStaticObjects(scene.children.filter((o) => !before.has(o)));
  // 하늘·차·행인(움직임)은 고정하지 않는다
  buildSky();
  buildCars();
  buildPedestrians();
  buildShopSigns();
  buildSchoolZoneBoards();
  buildAlleyMouths();
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
// 지형 단차 구역의 땅: 같은 지도 그림을 잘게 나눈 판에 입혀서 땅 높이만큼 올리고, 구역 밖 부분은 그리지 않는다.
// 깊이(depth)를 쓰지 않고 바닥 바로 다음에 그려서, 도로·건물 바닥판 등이 언제나 그 위에 보인다(높이가 조금씩 어긋나도
// 땅이 도로를 뚫고 올라오지 않게).
const TERRAIN_GRID_RAW = 6; // 땅 판 한 칸(raw m)
function buildTerrainGround(tex, mapCx, mapCz, mapW, mapH) {
  terrainZones.forEach((zone) => {
    const [x0, z0, x1, z1] = zone.box;
    const cell = TERRAIN_GRID_RAW * WORLD_SCALE;
    const nx = Math.max(1, Math.ceil((x1 - x0) / cell)), nz = Math.max(1, Math.ceil((z1 - z0) / cell));
    const geo = new THREE.PlaneGeometry(nx * cell, nz * cell, nx, nz);
    geo.rotateX(-Math.PI / 2);
    geo.translate(x0 + (nx * cell) / 2, 0, z0 + (nz * cell) / 2);
    // 바닥 지도와 같은 자리에 같은 그림이 오게 UV를 다시 계산
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) - (mapCx - mapW / 2)) / mapW, 1 - (pos.getZ(i) - (mapCz - mapH / 2)) / mapH);
    }
    uv.needsUpdate = true;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, depthWrite: false });
    mat.customProgramCacheKey = () => "nb-terrain-ground";
    mat.onBeforeCompile = (shader) => {
      const lift = (v) => `${v}.y += nbTerrainAny(${v}.xz);`;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vNbXZ;")
        .replace("#include <project_vertex>", `vec4 nbW = modelMatrix * vec4(transformed, 1.0);\nvNbXZ = nbW.xz;\n${lift("nbW")}\nvec4 mvPosition = viewMatrix * nbW;\ngl_Position = projectionMatrix * mvPosition;`)
        .replace("#include <worldpos_vertex>", `vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);\n${lift("worldPosition")}`);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vNbXZ;")
        .replace("void main() {", "void main() {\n  if (!nbInZone(vNbXZ)) discard;");
    };
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -0.015;
    mesh.receiveShadow = true;
    mesh.renderOrder = -1;
    mesh.userData.noTerrainTess = true;
    scene.add(mesh);
  });
}
// 지형 구역 경계의 옹벽(+높은 곳은 위에 난간). 꼭짓점을 구역 바깥으로 아주 조금 비켜 놓아서 셰이더가 다시 올리지
// 않게 하고, 높이는 직접(절대값으로) 준다. 높이가 거의 0인 곳(출입구)은 비운다.
function buildTerrainWalls() {
  if (!terrainZones.length) return;
  const W = WORLD_SCALE;
  const wall = { pos: [], uv: [], idx: [] }, cap = { pos: [], idx: [] }, rail = { pos: [], idx: [] };
  const posts = [];
  const quad = (store, a, b, c, d, uvs) => {
    const base = store.pos.length / 3;
    [a, b, c, d].forEach((v) => store.pos.push(v[0], v[1], v[2]));
    if (uvs) uvs.forEach((u) => store.uv.push(u[0], u[1]));
    store.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const OUT = 0.04 * W, CAP = 0.35 * W, RAIL_H = 1.1 * W, POST_EVERY = 2.5 * W;
  terrainZones.forEach((zone) => {
    const P = zone.poly;
    let along = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 1e-4) continue;
      const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
      let nx = uz, nz = -ux; // 바깥쪽 법선(구역 안이면 뒤집는다)
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (pointInPoly2(mx + nx * 0.02, mz + nz * 0.02, P)) { nx = -nx; nz = -nz; }
      const n = Math.max(1, Math.ceil(L / (1.5 * W)));
      let nextPost = 0;
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
        const h0 = zoneHeightRaw(zone, p0[0], p0[1]), h1 = zoneHeightRaw(zone, p1[0], p1[1]);
        const d0 = along + L * t0, d1 = along + L * t1;
        if (Math.max(h0, h1) < 0.15 * W) continue; // 출입구(땅 높이 거의 0)는 벽 없이
        const o0 = [p0[0] + nx * OUT, p0[1] + nz * OUT], o1 = [p1[0] + nx * OUT, p1[1] + nz * OUT];
        const yb = -0.03;
        quad(wall, [o0[0], yb, o0[1]], [o1[0], yb, o1[1]], [o1[0], h1, o1[1]], [o0[0], h0, o0[1]],
          [[d0 / (2 * W), yb / (1.9 * W)], [d1 / (2 * W), yb / (1.9 * W)], [d1 / (2 * W), h1 / (1.9 * W)], [d0 / (2 * W), h0 / (1.9 * W)]]);
        // 벽 위 두겁석(바깥쪽으로 살짝 내민 띠)
        const c0 = [o0[0] + nx * CAP * 0.3, o0[1] + nz * CAP * 0.3], c1 = [o1[0] + nx * CAP * 0.3, o1[1] + nz * CAP * 0.3];
        quad(cap, [o0[0], h0 + 0.004, o0[1]], [o1[0], h1 + 0.004, o1[1]], [c1[0], h1 + 0.004, c1[1]], [c0[0], h0 + 0.004, c0[1]]);
        quad(cap, [c0[0], h0 - 0.03, c0[1]], [c1[0], h1 - 0.03, c1[1]], [c1[0], h1 + 0.004, c1[1]], [c0[0], h0 + 0.004, c0[1]]);
        // 1.5m 넘는 옹벽 위에는 난간
        if (Math.min(h0, h1) > 1.5 * W) {
          const r0 = [o0[0] + nx * 0.01, o0[1] + nz * 0.01], r1 = [o1[0] + nx * 0.01, o1[1] + nz * 0.01];
          quad(rail, [r0[0], h0 + RAIL_H - 0.012, r0[1]], [r1[0], h1 + RAIL_H - 0.012, r1[1]], [r1[0], h1 + RAIL_H, r1[1]], [r0[0], h0 + RAIL_H, r0[1]]);
          quad(rail, [r0[0], h0 + RAIL_H * 0.5 - 0.008, r0[1]], [r1[0], h1 + RAIL_H * 0.5 - 0.008, r1[1]], [r1[0], h1 + RAIL_H * 0.5, r1[1]], [r0[0], h0 + RAIL_H * 0.5, r0[1]]);
          while (nextPost <= L * t1) {
            if (nextPost >= L * t0) {
              const tt = nextPost / L;
              posts.push([a[0] + (b[0] - a[0]) * tt + nx * (OUT + 0.01), zoneHeightRaw(zone, a[0] + (b[0] - a[0]) * tt, a[1] + (b[1] - a[1]) * tt), a[1] + (b[1] - a[1]) * tt + nz * (OUT + 0.01)]);
            }
            nextPost += POST_EVERY;
          }
        } else nextPost = L * t1;
      }
      along += L;
    }
  });
  const mk = (store, mat, withUv) => {
    if (!store.idx.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(store.pos, 3));
    if (withUv) geo.setAttribute("uv", new THREE.Float32BufferAttribute(store.uv, 2));
    geo.setIndex(store.idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.userData.noTerrainTess = true;
    scene.add(mesh);
    return mesh;
  };
  const stoneTex = fenceTexture("stone").clone();
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.needsUpdate = true;
  mk(wall, new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9, side: THREE.DoubleSide }), true);
  mk(cap, new THREE.MeshStandardMaterial({ color: 0xb9b4a6, roughness: 0.85, side: THREE.DoubleSide }), false);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide });
  mk(rail, railMat, false);
  if (posts.length) {
    const postGeo = new THREE.BoxGeometry(0.012, RAIL_H, 0.012);
    postGeo.translate(0, RAIL_H / 2, 0);
    const inst = new THREE.InstancedMesh(postGeo, railMat, posts.length);
    const mtx = new THREE.Matrix4();
    posts.forEach(([x, y, z], i) => inst.setMatrixAt(i, mtx.makeTranslation(x, y, z)));
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    scene.add(inst);
  }
}

// 지형 구역 안에 걸친 큰 판(직선 도로 리본·공원 판·교차로 채움 등)은 꼭짓점이 양 끝에만 있어서 땅 높이를 따라
// 휘지 못한다 — 긴 삼각형을 반으로 나누기를 되풀이해 한 변이 약 4m 아래가 되게 잘게 쪼갠다(구역에 걸친 것만).
const TERRAIN_TESS_RAW = 4;
function tessellateForTerrain(objects) {
  if (!terrainZones.length) return;
  const maxLen = TERRAIN_TESS_RAW * WORLD_SCALE;
  const boxes = terrainZones.map((z) => z.box);
  const hitsZone = (b) => boxes.some(([x0, z0, x1, z1]) => b.max.x >= x0 && b.min.x <= x1 && b.max.z >= z0 && b.min.z <= z1);
  objects.forEach((obj) => {
    obj.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.userData.noTerrainTess) return;
      const geo = o.geometry;
      if (!geo || !geo.attributes.position || geo.groups.length > 1 || Object.keys(geo.morphAttributes || {}).length) return;
      o.updateMatrixWorld(true);
      if (!geo.boundingBox) geo.computeBoundingBox();
      const wb = geo.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if (!hitsZone(wb)) return;
      const out = splitLongTriangles(geo, maxLen);
      if (out) { o.geometry = out; geo.dispose(); }
    });
  });
}
function splitLongTriangles(geo, maxLen) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const names = Object.keys(g.attributes);
  const attrs = names.map((n) => g.attributes[n]);
  const pos = g.attributes.position;
  const max2 = maxLen * maxLen;
  let need = false;
  for (let i = 0; i < pos.count && !need; i += 3) {
    for (let e = 0; e < 3; e++) {
      const a = i + e, b = i + ((e + 1) % 3);
      const dx = pos.getX(a) - pos.getX(b), dy = pos.getY(a) - pos.getY(b), dz = pos.getZ(a) - pos.getZ(b);
      if (dx * dx + dy * dy + dz * dz > max2) { need = true; break; }
    }
  }
  if (!need) { if (g !== geo) g.dispose(); return null; }
  const outArr = attrs.map(() => []);
  const vert = (i) => attrs.map((at) => { const v = []; for (let c = 0; c < at.itemSize; c++) v.push(at.array[i * at.itemSize + c] ?? 0); return v; });
  const mid = (A, B) => A.map((va, k) => va.map((x, c) => (x + B[k][c]) / 2));
  const d2 = (A, B) => { const p = A[names.indexOf("position")], q = B[names.indexOf("position")]; return (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; };
  const emit = (A, B, C, depth) => {
    const ab = d2(A, B), bc = d2(B, C), ca = d2(C, A);
    const m = Math.max(ab, bc, ca);
    if (m <= max2 || depth > 14) {
      [A, B, C].forEach((V) => V.forEach((v, k) => outArr[k].push(...v)));
      return;
    }
    if (m === ab) { const M = mid(A, B); emit(A, M, C, depth + 1); emit(M, B, C, depth + 1); }
    else if (m === bc) { const M = mid(B, C); emit(A, B, M, depth + 1); emit(A, M, C, depth + 1); }
    else { const M = mid(C, A); emit(A, B, M, depth + 1); emit(M, B, C, depth + 1); }
  };
  for (let i = 0; i < pos.count; i += 3) emit(vert(i), vert(i + 1), vert(i + 2), 0);
  const out = new THREE.BufferGeometry();
  names.forEach((n, k) => out.setAttribute(n, new THREE.Float32BufferAttribute(outArr[k], attrs[k].itemSize)));
  if (g !== geo) g.dispose();
  return out;
}
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
      mesh.renderOrder = -2; // 지형 단차 땅(아래)보다 먼저
      scene.add(mesh);
      buildTerrainGround(tex, cx, cz, w, h);
    },
    undefined,
    () => console.warn("지도 바닥 이미지를 불러오지 못했다")
  );
}

// [실험 중] 실제 금호동 지형(models/GameMap.glb, Web Mercator 위성사진+지형 내보내기 도구로 만듦).
// XZ 정렬: glTF가 내보내기 도구에서 받은 자기 노드 변환(scale·translation)에 WORLD_SCALE만 곱했더니
// PLACES 좌표(raw)가 이미 실제 건물 지붕 위에 거의 정확히 올라간다(건물마다 점을 찍어 렌더링해서
// 눈으로 확인함, 2026-11-25) — 그래서 추가 이동·회전·배율 보정이 필요 없었다.
// Y(높이): 이 지형 메시 자체의 절대 높이(해발고도 비슷한 값, 원점 근처에서 scene 단위로 약 16)는
// 게임이 지금까지 가정해 온 "도로·건물 바닥 = y 0"과 안 맞아서, 원점(113동, raw 0,0) 바로 위에서
// 땅까지 레이캐스트한 높이를 통째로 빼서 그 자리만 y=0이 되게 맞춘다 — 나머지 지점은 거기서부터의
// 실제 높이 차이(경사)를 그대로 가져간다. getTerrainY(x,z)로 이후 건물·캐릭터 배치에 쓸 수 있다.
const GLB_TERRAIN_FILE = "models/GameMap.glb";
const GLB_TERRAIN_ENABLED = true;
let glbTerrain = null;
const glbTerrainRaycaster = new THREE.Raycaster();
function getTerrainY(x, z) {
  if (!glbTerrain) return 0;
  glbTerrainRaycaster.set(new THREE.Vector3(x, 1000, z), new THREE.Vector3(0, -1, 0));
  const hits = glbTerrainRaycaster.intersectObject(glbTerrain, true);
  return hits.length ? hits[0].point.y : 0;
}
function buildGlbTerrain(scene) {
  if (!GLB_TERRAIN_ENABLED) return;
  gltfLoader.load(
    `${GLB_TERRAIN_FILE}?v=${ASSET_VERSION}`,
    (gltf) => {
      const terrain = gltf.scene;
      terrain.scale.multiplyScalar(WORLD_SCALE);
      terrain.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = false; } });
      terrain.updateMatrixWorld(true);
      glbTerrain = terrain;
      const originY = getTerrainY(0, 0);
      terrain.position.y -= originY;
      terrain.updateMatrixWorld(true);
      scene.add(terrain);
      const box = new THREE.Box3().setFromObject(terrain);
      console.log("[GLB 지형] 불러옴 — 원점(113동) 높이 보정값:", -originY.toFixed(2), "scene 단위");
      console.log("[GLB 지형] 보정 후 범위(scene 단위):", {
        x: [box.min.x.toFixed(1), box.max.x.toFixed(1)],
        y: [box.min.y.toFixed(2), box.max.y.toFixed(2)],
        z: [box.min.z.toFixed(1), box.max.z.toFixed(1)],
      });
    },
    undefined,
    (err) => console.warn("[GLB 지형] models/GameMap.glb를 못 불러왔다", err)
  );
}

// 금호파크힐스 단지 내부 공터에 나무를 심는다 — 나무가 많아서(170여 그루) 개별 메시로 만들면
// 도로 차선처럼 드로우콜이 급격히 늘어나니, 줄기·수관을 각각 InstancedMesh 하나씩으로 그린다.
// ── 울타리: map_data.js의 FENCES(에디터 "🧱 울타리 추가"로 그림)를 fence_types.js의 종류별 모양대로 세운다 ──
// 토막 길이에 맞춰 기둥 간격(spacing)에 가장 가까운 칸 수로 나누고, 칸·기둥마다 반복되는 부품 상자를 재질별
// 인스턴스 하나에 모두 담는다 — 울타리가 아무리 길어도 그리기 명령은 재질 수(유리울타리 4개)뿐이다.
const FENCE_CHUNK = 40; // 월드 단위(약 270m) 칸 — 잘게 나누면 그리기 명령이 늘어나서 크게 나눈다
const FENCE_VIEW_RANGE = 35; // 월드 단위(약 230m) — 칸 가장자리 기준
const fenceChunks = []; // { mesh, x, z, r }
const fenceMats = new Map(); // "종류:재질" → 재질(칸끼리 같이 쓴다)
function buildFences() {
  fenceChunks.length = 0;
  fenceMats.clear();
  if (!FENCES.length) return;
  const W = WORLD_SCALE;
  const boxes = new Map(); // "종류:재질" → [{ m: Matrix4 }]
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const tmp = new THREE.Object3D();
  FENCES.forEach((f) => {
    const T = FENCE_TYPES[f.type] || FENCE_TYPES[DEFAULT_FENCE_TYPE];
    const typeKey = FENCE_TYPES[f.type] ? f.type : DEFAULT_FENCE_TYPE;
    if (!T || !f.a || !f.b) return;
    const dx = f.b[0] - f.a[0], dz = f.b[1] - f.a[1];
    const L = Math.hypot(dx, dz);
    if (L < 0.3) return;
    const ux = dx / L, uz = dz / L;
    const yaw = Math.atan2(-uz, ux); // 로컬 +X가 진행 방향(a→b)
    const n = Math.max(1, Math.round(L / T.spacing));
    const bay = L / n;
    const withBase = f.base !== false;
    const drop = withBase ? 0 : T.baseH || 0;
    // 바닥 높이: 토막 가운데의 지면(보도 위면 보도 높이)
    const mx = (f.a[0] + f.b[0]) / 2 * W, mz = (f.a[1] + f.b[1]) / 2 * W;
    const gy = groundHeightAt(mx, mz);
    const push = (part, cx, len, matName) => {
      const y0 = Math.max(0, part.y0 - (part.onBase ? 0 : drop)), y1 = part.y1 - (part.onBase ? 0 : drop);
      if (y1 - y0 <= 0) return;
      const off = part.z || 0;
      tmp.position.set((f.a[0] + ux * cx - uz * off) * W, gy + ((y0 + y1) / 2) * W, (f.a[1] + uz * cx + ux * off) * W);
      tmp.rotation.set(0, yaw, 0);
      tmp.scale.set(len * W, (y1 - y0) * W, (part.d || 0.05) * W);
      tmp.updateMatrix();
      // 동네를 FENCE_CHUNK 크기 칸으로 나눠 칸마다 따로 담는다 — 화면 밖·멀리 있는 칸은 아예 안 그린다
      const chunk = `${Math.floor(tmp.position.x / FENCE_CHUNK)},${Math.floor(tmp.position.z / FENCE_CHUNK)}`;
      const key = `${typeKey}:${matName || part.mat}:${chunk}`;
      if (!boxes.has(key)) boxes.set(key, []);
      boxes.get(key).push(tmp.matrix.clone());
    };
    T.parts.forEach((part) => {
      if (part.onBase && !withBase) return;
      if (part.at === "post") {
        for (let k = 0; k <= n; k++) push(part, k * bay, part.w || 0.08);
      } else {
        const inset = part.inset || 0;
        for (let k = 0; k < n; k++) {
          const len = part.w ? part.w : Math.max(0.05, bay - inset * 2);
          push(part, (k + 0.5) * bay, len, part.matAlt ? part.matAlt[k % part.matAlt.length] : null);
        }
      }
    });
  });
  boxes.forEach((mats, key) => {
    const [typeKey, matName] = key.split(":");
    const matKey = `${typeKey}:${matName}`;
    const def = FENCE_TYPES[typeKey].mats[matName] || { color: 0x888888 };
    const glass = def.opacity != null && def.opacity < 1;
    const mat = fenceMats.get(matKey) || new THREE.MeshStandardMaterial({
      color: def.color, roughness: def.roughness ?? 0.7, metalness: def.metalness ?? 0, map: def.tex ? fenceTexture(def.tex) : null,
      transparent: glass, opacity: def.opacity ?? 1, depthWrite: !glass, side: glass ? THREE.DoubleSide : THREE.FrontSide,
    });
    fenceMats.set(matKey, mat);
    const mesh = new THREE.InstancedMesh(unit, mat, mats.length);
    mats.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    // 울타리는 낮고 가늘어서 그림자가 거의 안 보이는데 그림자 계산은 삼각형 수만큼 다시 그려야 한다 → 그림자는 안 드리운다
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    if (glass) mesh.renderOrder = 1;
    scene.add(mesh);
    fenceChunks.push({ mesh, x: mesh.boundingSphere.center.x, z: mesh.boundingSphere.center.z, r: mesh.boundingSphere.radius });
  });
  updateFenceVisibility();
}
// 캐릭터에서 FENCE_VIEW_RANGE(월드) 넘게 떨어진 울타리 칸은 숨긴다(울타리는 낮아서 멀면 거의 안 보인다)
function updateFenceVisibility() {
  if (!fenceChunks.length || !character) return;
  const cp = character.position;
  fenceChunks.forEach((c) => { c.mesh.visible = Math.hypot(c.x - cp.x, c.z - cp.z) - c.r < FENCE_VIEW_RANGE; });
}

// 울타리 무늬(칸 하나 면 = 가로 2m × 그 부품 높이에 딱 맞게 한 장) — 종류마다 한 번만 그려 둔다
const fenceTexCache = {};
function fenceTexture(kind) {
  if (fenceTexCache[kind]) return fenceTexCache[kind];
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  if (kind === "brick") {
    // 갈색 쪼갠면 벽돌: 2m에 4장(0.5m), 1.65m에 8단, 단마다 반 장씩 엇갈림
    c.width = 256; c.height = 212;
    g.fillStyle = "#382118"; g.fillRect(0, 0, c.width, c.height);
    const pal = ["#8D533C", "#9F644B", "#7A4632", "#A96F55"];
    const rows = 8, rh = c.height / rows, bw = c.width / 4;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let k = -1; k < 5; k++) {
        const x = k * bw + off;
        g.fillStyle = pal[Math.floor(rnd() * pal.length)];
        g.fillRect(x + 2, r * rh + 2, bw - 4, rh - 4);
        for (let d = 0; d < 14; d++) { // 쪼갠면 얼룩
          g.fillStyle = rnd() < 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,230,210,0.10)";
          g.fillRect(x + 2 + rnd() * (bw - 8), r * rh + 2 + rnd() * (rh - 6), 2 + rnd() * 6, 2 + rnd() * 3);
        }
      }
    }
  } else if (kind === "stone") {
    // 문양 콘크리트 옹벽: 따뜻한 회색 바탕에 크고 작은 돌 모양, 어두운 줄눈
    c.width = 256; c.height = 244;
    g.fillStyle = "#5E5B52"; g.fillRect(0, 0, c.width, c.height);
    const cols = 7, rows = 7, cw = c.width / cols, ch = c.height / rows;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const cx = (k + 0.5 + (rnd() - 0.5) * 0.3) * cw, cy = (r + 0.5 + (rnd() - 0.5) * 0.3) * ch;
      const sides = 5 + Math.floor(rnd() * 3);
      g.beginPath();
      for (let v = 0; v < sides; v++) {
        const a = (v / sides) * Math.PI * 2 + rnd() * 0.5;
        const rr = (0.5 + rnd() * 0.18) * Math.min(cw, ch) * 0.98;
        const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
        v ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath();
      const l = 160 + Math.floor(rnd() * 34);
      g.fillStyle = `rgb(${l + 8},${l + 4},${l - 8})`;
      g.fill();
    }
  } else {
    // 타공 흡음판: 흰 바탕(재질 색이 곱해짐)에 작은 구멍 격자와 가로 골
    c.width = 128; c.height = 64;
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "rgba(0,0,0,0.28)";
    for (let y = 3; y < c.height; y += 5) for (let x = 3 + ((y / 5) % 2) * 2; x < c.width; x += 5) g.fillRect(x, y, 1.5, 1.5);
    g.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 0; y < c.height; y += 16) g.fillRect(0, y, c.width, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  fenceTexCache[kind] = tex;
  return tex;
}

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

// ── 도로 모양: 종류(kind)·왕복 차로 수(lanes)·폭으로 정한다(road_markings.js의 roadLook — 맵 에디터와 같은 규칙) ──
//   일반 자동차 도로: 차로 수를 따로 정하지 않으면 폭으로 — 6m 미만 1(골목) · 6~12m 2(8m 미만은 선 없는 이면도로,
//                     8m 이상은 노란 점선 중앙선) · 12~17m 4 · 17~23m 6 · 23m 이상 8(4차로 이상은 노란 겹실선 +
//                     차로 사이 흰 점선). 실제 도시 도로의 차로 하나 폭 3.0~3.5m에 맞춘 기준이다.
//   보행용 도로(kind: "walk"): 아파트 단지 안 길처럼 사람이 다니는 길 — 베이지 블록 포장, 차선·차 없음
//   어린이 보호구역(kind: "school"): 붉은 포장 + "어린이 보호구역"·"30" 글씨, 차가 천천히 다닌다
const ROAD_SURFACE = 0x4a4a4e;
const ROAD_SURFACE_ALLEY = 0x7a7a7e;
const LANE_YELLOW = 0xf2c438;
const LANE_WHITE = 0xf2f2f2;
const PAVING_TILE_RAW = { walk: 3, school: 2.4 }; // 포장 무늬 한 장이 덮는 길이(raw m)
// rank는 도로끼리 겹칠 때(또는 교차로에서) 어느 쪽이 위에 보일지 정하는 우선순위다 — 차로가 많은(=더
// 중요한) 도로일수록 높고, 보행용 도로가 가장 낮다(사용자 지정, 2026-11-22).
const ROAD_LAYER_BASE_Y = 0.005;
const ROAD_LAYER_STEP = 0.0015; // 눈에 띄는 단차는 아니고, 겹칠 때 어느 면이 위인지만 확실히 가르는 정도
function surfaceYFor(seg) {
  return ROAD_LAYER_BASE_Y + roadLook(seg).rank * ROAD_LAYER_STEP;
}
// 보행용 도로·어린이 보호구역 포장 무늬(캔버스로 한 번만 그린다)
const pavingTextures = {};
function getPavingTexture(kind) {
  if (pavingTextures[kind]) return pavingTextures[kind];
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  let seed = kind === "walk" ? 4242 : 777;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  if (kind === "walk") {
    // 단지 안 길: 베이지 직사각 블록(2:1)을 엇갈려 깐 포장
    g.fillStyle = "#b9a77f";
    g.fillRect(0, 0, 256, 256);
    const cols = ["#d9c9a5", "#e1d3b2", "#cfbd96", "#d4c39e", "#c8b58c"];
    const bw = 64, bh = 32;
    for (let r = 0; r < 256 / bh; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let x = -off; x < 256; x += bw) {
        g.fillStyle = cols[Math.floor(rnd() * cols.length)];
        g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
  } else {
    // 어린이 보호구역: 붉은 미끄럼방지 포장(작은 벽돌 무늬)
    g.fillStyle = "#8e3a32";
    g.fillRect(0, 0, 256, 256);
    const cols = ["#b5473d", "#a94238", "#bd5146", "#a03d34", "#b24a40"];
    const bw = 32, bh = 16;
    for (let r = 0; r < 256 / bh; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let x = -off; x < 256; x += bw) {
        g.fillStyle = cols[Math.floor(rnd() * cols.length)];
        g.fillRect(x + 1, r * bh + 1, bw - 2, bh - 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  pavingTextures[kind] = tex;
  return tex;
}
// 도로 표면 재질은 종류별로 하나씩만 만들어 같이 쓴다
const roadSurfaceMats = {};
function roadSurfaceMaterial(surface) {
  if (roadSurfaceMats[surface]) return roadSurfaceMats[surface];
  const mat = surface === "walk" || surface === "school"
    ? new THREE.MeshStandardMaterial({ map: getPavingTexture(surface), roughness: 1, side: THREE.DoubleSide })
    : new THREE.MeshStandardMaterial({ color: surface === "alley" ? ROAD_SURFACE_ALLEY : ROAD_SURFACE, side: THREE.DoubleSide });
  roadSurfaceMats[surface] = mat;
  return mat;
}
// 평면 좌표로 무늬 좌표(uv)를 입힌다 — 무늬 한 장이 tile(월드 단위)만큼 덮게
function addPlanarUV(geo, tile) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / tile;
    uv[i * 2 + 1] = pos.getZ(i) / tile;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
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

const yellowLineMat = new THREE.MeshBasicMaterial({ color: LANE_YELLOW });
let schoolDecals = []; // 어린이 보호구역 글씨 자리 { x, z(가운데, 월드), fx, fz(차가 달리는 방향), w, l(월드), y }
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

  const look = roadLook(seg);
  const surfaceY = surfaceYFor(seg);
  const geo = buildRibbonGeometry(pts, tangents, roadW, 0);
  if (PAVING_TILE_RAW[look.surface]) addPlanarUV(geo, PAVING_TILE_RAW[look.surface] * WORLD_SCALE);
  const road = new THREE.Mesh(geo, roadSurfaceMaterial(look.surface));
  road.position.y = surfaceY;
  road.receiveShadow = true;
  scene.add(road);

  if (look.center === "double") {
    // 왕복 4차로 이상: 노란 겹실선(가는 실선 두 줄)
    const lineW = 0.16 * WORLD_SCALE, off = 0.17 * WORLD_SCALE;
    for (const [s0, s1] of ranges) {
      const sub = slicePolyline(rawPts, s0, s1).map(([x, z]) => [x * WORLD_SCALE, z * WORLD_SCALE]);
      const subT = polylineTangents(sub);
      [-off, off].forEach((o) => {
        const line = new THREE.Mesh(buildRibbonGeometry(sub, subT, lineW, o), yellowLineMat);
        line.position.y = surfaceY + 0.002;
        scene.add(line);
      });
    }
  }
  if (look.kind === "school") collectSchoolDecals(rawPts, ranges, look, surfaceY);
  if (!look.center && look.perDir < 2) return; // 골목길·보행용 도로는 점선도 없다

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
  if (look.center === "dashed") pushDashes(0, yellowDashTransforms);
  // 방향별 차로 사이 흰 점선(왕복 4차로면 양쪽 한 줄씩, 6차로면 두 줄씩…)
  for (let k = 1; k < look.perDir; k++) {
    const o = k * look.laneW * WORLD_SCALE;
    pushDashes(-o, whiteDashTransforms);
    pushDashes(o, whiteDashTransforms);
  }
}

// ── 어린이 보호구역 글씨: 방향마다 한 번씩, 그쪽으로 달리는 차로 위에 위에서부터 "어린이 / 보호구역 / ⓷⓪" ──
// 글씨 그림은 한 장(캔버스)이고 자리마다 네모를 하나씩 모아 메시 하나로 그린다(드로우콜 1개)
let schoolZoneTexture = null;
function getSchoolZoneTexture() {
  if (schoolZoneTexture) return schoolZoneTexture;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  g.strokeStyle = "#ffffff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  // 위(차가 달려가는 쪽 = 멀리)부터 아래로: 어린이 → 보호구역 → 30 원(가까이) — 차에서 보면 위에서부터
  // "어린이 보호구역 30" 순서로 읽힌다(사용자 지정)
  const stretched = (text, y, size) => {
    g.save();
    g.translate(128, y);
    g.scale(1, 1.55); // 도로 글씨처럼 진행 방향으로 길쭉하게
    g.font = `bold ${size}px sans-serif`;
    g.fillText(text, 0, 0);
    g.restore();
  };
  stretched("어린이", 78, 70);
  stretched("보호구역", 205, 58);
  g.lineWidth = 13;
  g.beginPath();
  g.arc(128, 400, 92, 0, Math.PI * 2);
  g.stroke();
  g.font = "bold 104px sans-serif";
  g.fillText("30", 128, 406);
  schoolZoneTexture = new THREE.CanvasTexture(c);
  schoolZoneTexture.colorSpace = THREE.SRGBColorSpace;
  schoolZoneTexture.anisotropy = 4;
  return schoolZoneTexture;
}
function collectSchoolDecals(rawPts, ranges, look, surfaceY) {
  if (!ranges.length) return;
  // 교차로 사이에서 가장 긴 구간에 놓는다
  const [r0, r1] = ranges.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
  const span = r1 - r0;
  const laneSpan = look.perDir ? look.perDir * look.laneW : look.laneW; // 한 방향 차로 폭 합(raw)
  const w = Math.min(laneSpan * 0.9, 7.5);
  const l = w * 1.95;
  if (span < l + 4) return;
  const cum = [0];
  for (let i = 1; i < rawPts.length; i++) cum.push(cum[i - 1] + Math.hypot(rawPts[i][0] - rawPts[i - 1][0], rawPts[i][1] - rawPts[i - 1][1]));
  const dirs = look.perDir ? [1, -1] : [1];
  dirs.forEach((dirSign) => {
    const sRaw = dirSign > 0 ? r0 + Math.max(l / 2 + 2, span * 0.25) : r1 - Math.max(l / 2 + 2, span * 0.25);
    const q = pointAlongPolyline(rawPts, sRaw);
    const fx = q.dirX * dirSign, fz = q.dirZ * dirSign;
    const side = look.perDir ? laneSpan / 2 : 0; // 그 방향 차로들 가운데(진행 방향 오른쪽)
    const cx = q.x + -fz * side, cz = q.z + fx * side;
    schoolDecals.push({ x: cx * WORLD_SCALE, z: cz * WORLD_SCALE, fx, fz, w: w * WORLD_SCALE, l: l * WORLD_SCALE, y: surfaceY });
  });
}
function buildSchoolDecals() {
  if (!schoolDecals.length) return;
  const pos = [], uv = [], idx = [];
  schoolDecals.forEach((d, k) => {
    const rx = -d.fz, rz = d.fx; // 진행 방향 오른쪽
    const hw = d.w / 2, hl = d.l / 2;
    const corner = (a, b) => [d.x + d.fx * a + rx * b, d.z + d.fz * a + rz * b];
    // 캔버스 위쪽(v=1)이 진행 방향 앞(멀리), 왼쪽(u=0)이 운전자 왼쪽
    [[corner(-hl, -hw), 0, 0], [corner(-hl, hw), 1, 0], [corner(hl, hw), 1, 1], [corner(hl, -hw), 0, 1]].forEach(([p, u, v]) => {
      pos.push(p[0], 0, p[1]);
      uv.push(u, v);
    });
    const b = k * 4;
    idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: getSchoolZoneTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  mesh.position.y = ROAD_LAYER_BASE_Y + 4 * ROAD_LAYER_STEP + 0.0028;
  mesh.renderOrder = 1;
  scene.add(mesh);
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
// 보도블록 무늬(map_data.js의 swStyle — 맵 에디터에서 고른다): 0.3m 블록 8×8 한 장을 캔버스로 그린다
//   gray(기본): 회색 정사각 블록에 군데군데 진한 블록 · red: 붉은 벽돌을 엇갈려 쌓은 무늬
//   beige: 베이지 정사각 블록 · twotone: 회색 블록 사이사이 붉은 블록(2×2)
const sidewalkTextures = {};
function getSidewalkTexture(style = "gray") {
  if (!["gray", "red", "beige", "twotone"].includes(style)) style = "gray";
  if (sidewalkTextures[style]) return sidewalkTextures[style];
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  let seed = 12345;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = 8, cs = 256 / n;
  if (style === "red") {
    g.fillStyle = "#7d3d34";
    g.fillRect(0, 0, 256, 256);
    const cols = ["#b5574a", "#a84c40", "#c06253", "#9b4338", "#b9604f"];
    const bw = 64, bh = 32;
    for (let r = 0; r < 256 / bh; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let x = -off; x < 256; x += bw) {
        g.fillStyle = cols[Math.floor(rnd() * cols.length)];
        g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
  } else {
    const base = style === "beige" ? "#c9b88f" : "#bdbdba";
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < n; r++) {
      for (let k = 0; k < n; k++) {
        const v = rnd();
        let col;
        if (style === "beige") col = v < 0.16 ? "#b39f74" : v < 0.3 ? "#c4b087" : v < 0.62 ? "#dccdab" : "#e4d7b9";
        else if (style === "twotone" && r % 4 < 2 && k % 4 < 2) col = v < 0.5 ? "#b5574a" : "#a84c40"; // 2×2 붉은 블록이 고르게(방향 상관없이 같은 무늬)
        else col = v < 0.16 ? "#8b8c8e" : v < 0.3 ? "#acadaf" : v < 0.62 ? "#d2d2cf" : "#dcdcd9";
        g.fillStyle = col;
        g.fillRect(k * cs + 1, r * cs + 1, cs - 2, cs - 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  sidewalkTextures[style] = tex;
  return tex;
}
const swStyleOf = (seg) => (seg && seg.swStyle) || "gray";
// 보도 띠는 무늬별로 따로 모은다(무늬마다 메시 하나)
function sideStore(stores, style) {
  if (!stores.side[style]) stores.side[style] = newRibbonStore();
  return stores.side[style];
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
let roadFootprintGrid = null; // 칸(ROAD_GRID_CELL) → 그 칸에 걸치는 도로 발자국들 — 보도 판정이 수만 번이라 빠르게
const ROAD_GRID_CELL = 1.5;
const gridKey = (ix, iz) => ix * 100003 + iz;
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
  roadFootprintGrid = new Map();
  roadFootprintsCache.forEach((f) => {
    const m = f.half + 0.05;
    for (let ix = Math.floor((f.minx - m) / ROAD_GRID_CELL); ix <= Math.floor((f.maxx + m) / ROAD_GRID_CELL); ix++) {
      for (let iz = Math.floor((f.minz - m) / ROAD_GRID_CELL); iz <= Math.floor((f.maxz + m) / ROAD_GRID_CELL); iz++) {
        const k = gridKey(ix, iz);
        if (!roadFootprintGrid.has(k)) roadFootprintGrid.set(k, []);
        roadFootprintGrid.get(k).push(f);
      }
    }
  });
  return roadFootprintsCache;
}
// (x,z)가 ignore에 없는 도로 위(반폭 + margin 안)인가
function pointOnRoad(x, z, ignore, margin = 0.015) {
  buildRoadFootprints();
  const list = roadFootprintGrid.get(gridKey(Math.floor(x / ROAD_GRID_CELL), Math.floor(z / ROAD_GRID_CELL)));
  if (!list) return false;
  for (const f of list) {
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
  return !!a.sidewalk && !!b.sidewalk && a.width === b.width && a.sidewalk === b.sidewalk && !!a.railing === !!b.railing && swStyleOf(a) === swStyleOf(b);
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
    ((roadMarkings.junctionGaps || roadMarkings.gaps)[m.idx] || []).forEach(([g0, g1]) => { // 길 중간 횡단보도에선 보도를 끊지 않는다
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
// ── 보도가 다른 도로에 걸리는 곳: 자르지 않고 도로 높이로 내려앉힌다(앞뒤로 완만한 경사) ──
// 도로가 그 위를 덮으니 도로가 우선이고, 예전처럼 비스듬히 잘린 세로 단면이나 빈 구멍이 생기지 않는다.
// 캐릭터·행인도 그 경사를 따라 내려갔다 올라온다(사용자 지정 2026-11-25).
const SIDEWALK_RAMP_RAW = 2; // 보도가 도로 높이까지 내려가는 경사 길이(raw m)
const SIDEWALK_LOW_Y = 0.003; // 내려앉은 보도 높이 — 가장 낮은 도로 표면(0.005)보다 조금 아래라 도로가 위에 보인다
const SIDEWALK_PROBES = [0.12, 0.5, 0.88]; // 보도 폭에서 이 비율 자리 중 한 곳이라도 다른 도로 위면 내려앉힌다
const walkDips = []; // 내려앉은·경사진 보도 조각(캐릭터 발밑 높이) — 나머지 보도는 walkBands가 보도 높이로 처리

// 단면마다 높이(h: 0 = 도로 높이, 1 = 보도 높이)와 실제 y — 막힌 곳에서 멀어질수록 경사를 따라 올라간다
function sidewalkHeights(secs) {
  const n = secs.length;
  const dist = new Array(n).fill(Infinity);
  let last = -Infinity;
  for (let i = 0; i < n; i++) { if (secs[i].blocked) last = secs[i].d; dist[i] = secs[i].d - last; }
  last = Infinity;
  for (let i = n - 1; i >= 0; i--) { if (secs[i].blocked) last = secs[i].d; dist[i] = Math.min(dist[i], last - secs[i].d); }
  const ramp = SIDEWALK_RAMP_RAW * WORLD_SCALE;
  secs.forEach((sc, i) => {
    const t = Math.min(1, dist[i] / ramp);
    sc.h = t * t * (3 - 2 * t);
    sc.y = SIDEWALK_LOW_Y + sc.h * (SIDEWALK_TOP_Y - SIDEWALK_LOW_Y);
  });
}
// 띠(안쪽 점들 A, 바깥 점들 B)를 단면별 높이 ys(메시 기준 높이에서 잰 값)로 추가
function pushStripY(store, A, B, ys) {
  const base = store.pos.length / 3;
  const tileW = SIDEWALK_TILE_RAW * WORLD_SCALE;
  for (let k = 0; k < A.length; k++) {
    store.pos.push(A[k][0], ys[k], A[k][1], B[k][0], ys[k], B[k][1]);
    store.uv.push(A[k][0] / tileW, A[k][1] / tileW, B[k][0] / tileW, B[k][1] / tileW);
  }
  for (let k = 0; k < A.length - 1; k++) {
    const a0 = base + k * 2, a1 = a0 + 1, b0 = a0 + 2, b1 = a0 + 3;
    store.idx.push(a0, b0, a1, a1, b0, b1);
  }
}
// 바닥(0)부터 점마다 다른 높이 ys(절대 높이)까지 세운 면(연석 — 내려앉은 곳은 높이가 0이라 안 보인다)
function pushVerticalQuadStripY(store, pts2d, ys) {
  const base = store.pos.length / 3;
  pts2d.forEach(([x, z], k) => store.pos.push(x, 0, z, x, ys[k], z));
  for (let i = 0; i < pts2d.length - 1; i++) {
    const a0 = base + i * 2, a1 = a0 + 1, b0 = a0 + 2, b1 = a0 + 3;
    store.idx.push(a0, b0, a1, a1, b0, b1);
  }
}
function addWalkDip(poly, ax, az, bx, bz, y0, y1) {
  const xs = poly.map((q) => q[0]), zs = poly.map((q) => q[1]);
  const ux = bx - ax, uz = bz - az;
  walkDips.push({ poly, ax, az, ux, uz, len2: ux * ux + uz * uz || 1e-9, y0, y1,
    minx: Math.min(...xs), maxx: Math.max(...xs), minz: Math.min(...zs), maxz: Math.max(...zs) });
}
// 보도 띠 하나를 그린다 — secs: [{ d(띠를 따라 잰 거리), c: [x,z](높이 보간 기준점), at(o)(안쪽 가장자리에서 바깥으로 o),
// inner, outer, blocked }]. opts: { style, width, platform(걷는 높이를 다각형으로), ped(행인 길), railing }
function emitSidewalkBand(stores, secs, opts) {
  if (secs.length < 2) return;
  const lineW = SIDEWALK_YELLOW_W_RAW * WORLD_SCALE;
  const inset = SIDEWALK_YELLOW_INSET_RAW * WORLD_SCALE;
  sidewalkHeights(secs);
  const ys = secs.map((sc) => sc.y - SIDEWALK_TOP_Y);
  const A = secs.map((sc) => sc.inner), B = secs.map((sc) => sc.outer);
  pushStripY(sideStore(stores, opts.style), A, B, ys);
  pushVerticalQuadStripY(stores.curb, A, secs.map((sc) => sc.y)); // 도로 쪽 연석 면
  [secs[0], secs[secs.length - 1]].forEach((sc) => pushVerticalQuadStripY(stores.curb, [sc.inner, sc.outer], [sc.y, sc.y])); // 띠 끝 단면
  pushStripY(stores.line, secs.map((sc) => sc.at(inset)), secs.map((sc) => sc.at(inset + lineW)), ys);
  // 걷는 높이: 보도 높이 그대로인 구간은 다각형(platform) 또는 walkBands, 내려앉은·경사진 곳은 조각(walkDips)으로
  const full = (sc) => sc.h >= 0.999;
  let lowStart = -1;
  for (let i = 0; i < secs.length - 1; i++) {
    const s0 = secs[i], s1 = secs[i + 1];
    if (full(s0) && full(s1)) continue;
    if (s0.h < 0.001 && s1.h < 0.001) {
      // 완전히 내려앉은 단면이 이어지면 한 조각으로 합친다(조각 수를 줄이려고)
      if (lowStart < 0) lowStart = i;
      if (i + 1 < secs.length - 1 && secs[i + 2].h < 0.001) continue;
      const a = secs[lowStart], b = s1;
      addWalkDip([a.inner, a.outer, b.outer, b.inner], a.c[0], a.c[1], b.c[0], b.c[1], SIDEWALK_LOW_Y, SIDEWALK_LOW_Y);
      lowStart = -1;
      continue;
    }
    addWalkDip([s0.inner, s0.outer, s1.outer, s1.inner], s0.c[0], s0.c[1], s1.c[0], s1.c[1], s0.y, s1.y);
  }
  if (opts.platform) {
    let run = [];
    const flushRun = () => {
      if (run.length >= 2) addPolyPlatform([...run.map((sc) => sc.inner), ...run.map((sc) => sc.outer).reverse()], SIDEWALK_TOP_Y);
      run = [];
    };
    secs.forEach((sc) => { if (full(sc)) run.push(sc); else flushRun(); });
    flushRun();
  }
  if (opts.ped && secs.length >= 6) {
    // 행인이 걸을 보도 중앙선(월드 좌표, 점마다 높이)
    const mid = secs.map((sc) => sc.at(opts.width * 0.62));
    const pcum = [0];
    for (let i = 1; i < mid.length; i++) pcum.push(pcum[i - 1] + Math.hypot(mid[i][0] - mid[i - 1][0], mid[i][1] - mid[i - 1][1]));
    pedPaths.push({ pts: mid, ys: secs.map((sc) => sc.y), cum: pcum, len: pcum[pcum.length - 1], w: opts.width });
  }
  if (opts.railing) {
    // 울타리는 보도 높이 그대로인 구간에만(내려앉은 곳 = 길이 지나가는 곳은 비운다)
    const o = RAILING_INSET_RAW * WORLD_SCALE;
    const rw = 0.012;
    const spacing = RAILING_POST_SPACING_RAW * WORLD_SCALE;
    let run = [];
    const flushRail = () => {
      if (run.length >= 2) {
        pushStrip(stores.rail, run.map((sc) => sc.at(o - rw)), run.map((sc) => sc.at(o + rw)), RAILING_H);
        pushStrip(stores.rail, run.map((sc) => sc.at(o - rw * 0.7)), run.map((sc) => sc.at(o + rw * 0.7)), RAILING_H * 0.5);
        let next = run[0].d;
        for (const sc of run) {
          if (sc.d + 1e-6 >= next) {
            stores.posts.push(sc.at(o));
            next = sc.d + spacing;
          }
        }
        stores.posts.push(run[run.length - 1].at(o));
      }
      run = [];
    };
    secs.forEach((sc) => { if (full(sc)) run.push(sc); else flushRail(); });
    flushRail();
  }
}

function collectChainSidewalk(members, stores, conns) {
  const first = ROAD_SEGMENTS[members[0].idx];
  const { pts: rawPts, gaps, len: rawLen } = chainGeometry(members);
  if (rawPts.length < 2) return;
  const roadW = first.width * WORLD_SCALE;
  const sideW = first.sidewalk * WORLD_SCALE;
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
        const at = (o) => [q.x + nx * (roadW / 2 + o), q.z + nz * (roadW / 2 + o)];
        // 보도 폭 안쪽·가운데·바깥 중 한 곳이라도 다른 도로 위면 그 자리는 도로 높이로(비스듬히 지나가는 길도 다 덮게)
        const blocked = SIDEWALK_PROBES.some((f) => { const p = at(sideW * f); return pointOnRoad(p[0], p[1], ignore); });
        const inner = at(0), outer = at(sideW);
        return { d: q.d, c: [(inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2], at, inner, outer, blocked };
      });
      emitSidewalkBand(stores, secs, { style: swStyleOf(first), width: sideW, ped: true, railing: !!first.railing });
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
      pushStrip(sideStore(stores, swStyleOf(seg)), inner, arc(ro));
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
      // has: 이 길에 보도가 있는지 — 보도가 없는 길도 모서리의 한쪽 끝(도로 가장자리)은 알아야 해서 자리(P)는 구한다
      const arm = { e, seg, angle: Math.atan2(dz / dl, dx / dl), has: !!seg.sidewalk, sw: (seg.sidewalk || 0) * WORLD_SCALE };
      const ranges = markedRanges(rawLen, (roadMarkings.junctionGaps || roadMarkings.gaps)[e.i] || []);
      if (!ranges.length) return arm;
      const sEnd = e.which === "a" ? ranges[0][0] : ranges[ranges.length - 1][1];
      const q = pointAlongPolyline(pts, sEnd * WORLD_SCALE);
      const away = e.which === "a" ? [q.dirX, q.dirZ] : [-q.dirX, -q.dirZ];
      Object.assign(arm, { P: [q.x, q.z], away, half: (seg.width * WORLD_SCALE) / 2 });
      return arm;
    });
    arms.sort((p, q) => p.angle - q.angle);
    const ignore = new Set(g.map((e) => e.i));
    const probe = (pt) => pointOnRoad(pt[0], pt[1], ignore);
    // 띠의 안쪽 점들 Q와 바깥 법선 N으로 단면 목록을 만들어 그린다(다른 도로가 지나가면 그 자리는 도로 높이로)
    const band = (Q, N, W, style) => {
      let d = 0;
      const secs = Q.map((pt, idx) => {
        if (idx) d += Math.hypot(pt[0] - Q[idx - 1][0], pt[1] - Q[idx - 1][1]);
        const n = N[idx];
        const at = (o) => [pt[0] + n[0] * o, pt[1] + n[1] * o];
        const outer = at(W);
        return { d, c: [(pt[0] + outer[0]) / 2, (pt[1] + outer[1]) / 2], at, inner: pt, outer, blocked: SIDEWALK_PROBES.some((f) => probe(at(W * f))) };
      });
      emitSidewalkBand(stores, secs, { style, width: W, platform: true });
    };
    for (let k = 0; k < arms.length; k++) {
      const A = arms[k], B = arms[(k + 1) % arms.length];
      if (!A.P || !B.P) continue;
      let delta = B.angle - A.angle;
      if (delta <= 0) delta += 2 * Math.PI;
      const nA = [-A.away[1], A.away[0]]; // A의 반시계 쪽(=B 쪽 블록)
      const nB = [B.away[1], -B.away[0]]; // B의 시계 쪽(=A 쪽 블록)
      const IA = [A.P[0] + nA[0] * A.half, A.P[1] + nA[1] * A.half];
      const IB = [B.P[0] + nB[0] * B.half, B.P[1] + nB[1] * B.half];
      if (delta >= (170 * Math.PI) / 180 && delta <= (190 * Math.PI) / 180) {
        // 거의 일직선으로 마주 보는 두 길 사이(ㅏ자의 막힌 쪽 등): 그 사이로 들어오는 길이 없으니 보도를 곧게 이어 준다
        if (!A.has || !B.has) continue;
        const len = Math.hypot(IB[0] - IA[0], IB[1] - IA[1]);
        if (len < 1e-4) continue;
        const steps = Math.max(1, Math.ceil(len / (SIDEWALK_SAMPLE_RAW * WORLD_SCALE)));
        const Q = [], N = [];
        for (let st = 0; st <= steps; st++) {
          const t = st / steps;
          Q.push([IA[0] + (IB[0] - IA[0]) * t, IA[1] + (IB[1] - IA[1]) * t]);
          let nx = nA[0] * (1 - t) + nB[0] * t, nz = nA[1] * (1 - t) + nB[1] * t;
          const nl = Math.hypot(nx, nz) || 1;
          N.push([nx / nl, nz / nl]);
        }
        band(Q, N, Math.min(A.sw, B.sw), swStyleOf(A.seg));
        continue;
      }
      if (delta > (190 * Math.PI) / 180) continue; // 그보다 더 벌어진 쪽은 모서리가 아니다
      if (!A.has && !B.has) continue; // 둘 중 한 길에만 보도가 있어도 모서리를 둥글게 돌려 준다
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
      const W = A.has && B.has ? Math.min(A.sw, B.sw) : Math.max(A.sw, B.sw);
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
      // 모서리가 다른(이 교차로에 속하지 않은) 도로 위로 넘어가는 부분은 도로 높이로 내려앉힌다
      band(Q, normals, W, swStyleOf(A.has ? A.seg : B.seg));
    }
  }
}

function buildRoadSidewalks() {
  walkBands.length = 0;
  walkDips.length = 0;
  pedPaths.length = 0;
  const stores = { side: {}, line: newRibbonStore(), curb: newRibbonStore(), rail: newRibbonStore(), posts: [] };
  const conns = buildRoadConnections();
  const chains = buildSidewalkChains(conns);
  const chainOf = new Map();
  chains.forEach((members, c) => members.forEach((m) => chainOf.set(m.idx, c)));
  chains.forEach((members) => collectChainSidewalk(members, stores, conns));
  buildSidewalkJoints(conns, chainOf, stores);
  buildSidewalkCorners(stores);
  Object.entries(stores.side).forEach(([style, store]) => {
    if (!store.idx.length) return;
    const mesh = new THREE.Mesh(
      storeToGeometry(store),
      new THREE.MeshStandardMaterial({ map: getSidewalkTexture(style), roughness: 1, side: THREE.DoubleSide })
    );
    mesh.position.y = SIDEWALK_TOP_Y;
    mesh.receiveShadow = true;
    scene.add(mesh);
  });
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
    // 메움판 자체도 우선순위를 따른다 — 만나는 도로 중 rank가 가장 높은 쪽의 표면·높이를 쓴다.
    const topSeg = group.reduce((best, p) => (roadLook(p.seg).rank > roadLook(best.seg).rank ? p : best)).seg;
    const topLook = roadLook(topSeg);
    if (PAVING_TILE_RAW[topLook.surface]) addPlanarUV(geo, PAVING_TILE_RAW[topLook.surface] * WORLD_SCALE);
    const filler = new THREE.Mesh(geo, roadSurfaceMaterial(topLook.surface));
    filler.position.y = surfaceYFor(topSeg) + 0.0005;
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
  schoolDecals = [];
  roadMarkings = computeRoadMarkings(ROAD_SEGMENTS, CROSSWALKS);
  ROAD_SEGMENTS.forEach(buildRoadRibbon);
  buildRoadSidewalks();
  buildLaneDashes();
  buildJunctionFillers();
  buildRoadMarks();
  buildSchoolDecals();
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
  streetlightHeadMat = headMat;
  const headInst = new THREE.InstancedMesh(headGeo, headMat, streetlightTransforms.length);
  // 밤에 가로등 밑에 깔리는 불빛(진짜 조명 대신 둥근 빛 무늬를 더해 그리는 판 — 수백 개여도 드로우콜 1)
  const poolGeo = new THREE.CircleGeometry(1, 28);
  poolGeo.rotateX(-Math.PI / 2);
  const poolMat = new THREE.MeshBasicMaterial({ map: getLightPoolTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const poolInst = new THREE.InstancedMesh(poolGeo, poolMat, streetlightTransforms.length);
  poolInst.frustumCulled = false;
  poolInst.renderOrder = 2;
  poolInst.visible = false;
  streetlightPools = poolInst;
  const dummy = new THREE.Object3D();
  streetlightTransforms.forEach((t, i) => {
    dummy.position.set(t.x, STREETLIGHT_POLE_HEIGHT / 2, t.z); // 기둥 밑동이 땅(y=0)에 닿도록
    dummy.rotation.set(0, t.yaw, 0);
    dummy.updateMatrix();
    poleInst.setMatrixAt(i, dummy.matrix);
    dummy.position.y = STREETLIGHT_POLE_HEIGHT + 0.15 * WORLD_SCALE; // 기둥 꼭대기 위에 등 얹기
    dummy.updateMatrix();
    headInst.setMatrixAt(i, dummy.matrix);
    dummy.position.set(t.x, SIDEWALK_TOP_Y + 0.006, t.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(STREETLIGHT_POOL_RADIUS);
    dummy.updateMatrix();
    poolInst.setMatrixAt(i, dummy.matrix);
    dummy.scale.setScalar(1);
  });
  poleInst.instanceMatrix.needsUpdate = true;
  headInst.instanceMatrix.needsUpdate = true;
  poolInst.instanceMatrix.needsUpdate = true;
  poleInst.castShadow = true;
  scene.add(poleInst, headInst, poolInst);
}
const STREETLIGHT_POOL_RADIUS = 9 * WORLD_SCALE;
let streetlightHeadMat = null;
let streetlightPools = null;
let lightPoolTexture = null;
function getLightPoolTexture() {
  if (lightPoolTexture) return lightPoolTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,214,150,1)");
  grd.addColorStop(0.45, "rgba(255,196,120,0.45)");
  grd.addColorStop(1, "rgba(255,180,100,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  lightPoolTexture = new THREE.CanvasTexture(c);
  lightPoolTexture.colorSpace = THREE.SRGBColorSpace;
  return lightPoolTexture;
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
  // 다른 도로가 지나가서 내려앉았거나 경사진 보도
  for (const d of walkDips) {
    if (x < d.minx || x > d.maxx || z < d.minz || z > d.maxz) continue;
    if (!pointInPolygon(x, z, d.poly)) continue;
    const t = Math.max(0, Math.min(1, ((x - d.ax) * d.ux + (z - d.az) * d.uz) / d.len2));
    return d.y0 + (d.y1 - d.y0) * t;
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
          // terrain: "baked" — 모델 안에 단차(높이)가 이미 들어 있으니 게임이 땅 높이만큼 또 올리지 않는다
          if (entry.place.terrain === "baked") {
            (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => { if (mt) { mt.defines = { ...(mt.defines || {}), NB_TERRAIN_BAKED: "" }; mt.needsUpdate = true; } });
          }
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
      registerBuildingGlass(entry, model); // 밤에 창문 불빛
      fitShopToModel(entry); // 입간판이 건물 안에 들어갔으면 옮기고, 문 닫은 시간엔 셔터
      if (entry.placeholder) entry.placeholder.visible = false;
    },
    undefined,
    (err) => {
      entry.loading = false;
      entry.failed = true; // 파일이 없거나 깨졌으면 다시 받으려고 계속 요청하지 않는다(임시 매싱이 그대로 보인다)
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
      if (!entry.loadedModel && !entry.loading && !entry.failed) want.push(entry);
    } else if (dist > modelUnloadRangeFor(entry.place.id) && entry.loadedModel) {
      entry.group.remove(entry.loadedModel);
      disposeObject3D(entry.loadedModel);
      entry.loadedModel = null;
      buildingGlass.delete(entry);
      removeShopShutter(entry);
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
    const terrainLift = terrainAt(px, pz); // 지형 단차(이름표는 그림 셰이더가 아니라서 직접 올린다)
    label.position.set(px, groundY + terrainLift + height + 1.1, pz);
    label.userData.placeId = place.id; // updateLabelVisibility에서 거리·목적지 판정에 쓴다
    scene.add(label);

    // 심부름 목적지로 지정되면 이 라벨 뒤에서 파란 점멸 표시가 켜진다(기본은 숨김)
    const highlight = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: highlightTexture(), color: 0x3fa9ff, transparent: true, opacity: 0, depthTest: false })
    );
    highlight.scale.set(5, 5, 1);
    highlight.position.set(px, groundY + terrainLift + height + 1.1, pz);
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

// 불량배: 서 있지 않고 행인처럼 보도를 어슬렁거린다(이름표 없음 — 모습으로 알아보게). 닿으면 예전처럼
// "혼내줬다" 보상(updatePickups). 쫓아오기 같은 이벤트는 나중에 따로 만든다. 모습은 행인보다 조금 큰
// 검은 후드티·빨간 모자·청바지.
const BULLY_SCALE = 1.2;
const BULLY_WANDER_SPEED = 0.55;
function makeThug() {
  const group = new THREE.Group();
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 });
  const hoodie = mat(0x1d1f24), jeans = mat(0x2f3b52), skin = mat(0xe0b088), capMat = mat(0xb3262c), shoe = mat(0xf2f2f2);
  const body = new THREE.Group(); // 몸 방향·팔다리 흔들기용(나중에 이름표·말풍선을 붙이면 group에 따로 붙여서 돌지 않게)
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
  group.userData = { body, legs, arms };
  return group;
}

// 친구: 이로이 또래 아이 — 어른 행인보다 작고 머리가 크며, 노랑 줄무늬 티·파란 반바지·빨간 책가방·
// 노란 모자로 행인·불량배와 한눈에 구별된다. 팔다리는 불량배처럼 따로 움직일 수 있게(userData) 만들어 둬서
// 나중에 "같이 걸어가기" 같은 이벤트에서 걷는 모습을 그대로 쓸 수 있다.
const FRIEND_LOOK_RANGE = 6; // 캐릭터가 이 안으로 오면 그쪽을 바라본다
function makeFriend() {
  const group = new THREE.Group();
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
  const shirt = mat(0xffd23f), stripe = mat(0x3a86ff), shorts = mat(0x2b59c3), skin = mat(0xf1c9a5);
  const hair = mat(0x3b2a20), bag = mat(0xe8483b), capMat = mat(0xffc21a), shoe = mat(0xf5f5f5), sock = mat(0xffffff);
  const body = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.07), shirt);
  torso.position.y = 0.19;
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.114, 0.025, 0.074), stripe);
  band.position.y = 0.2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 12), skin);
  head.position.y = 0.3;
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  hairCap.position.set(0, 0.302, -0.006);
  const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.056, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.32), capMat);
  capCrown.position.y = 0.318;
  const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.006, 0.045), capMat);
  capBrim.position.set(0, 0.338, 0.05);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.045), bag);
  pack.position.set(0, 0.2, -0.055);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.035, 0.048), mat(0xc23328));
  flap.position.set(0, 0.235, -0.056);
  const legs = [-1, 1].map((sx) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.026, 0.13, 0);
    const short = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.05, 0.05), shorts);
    short.position.y = -0.02;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.032), skin);
    leg.position.y = -0.075;
    const sk = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.02, 0.034), sock);
    sk.position.y = -0.11;
    const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.06), shoe);
    sneaker.position.set(0, -0.122, 0.008);
    pivot.add(short, leg, sk, sneaker);
    return pivot;
  });
  const arms = [-1, 1].map((sx) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.07, 0.24, 0);
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.04, 0.036), shirt);
    sleeve.position.y = -0.015;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.08, 0.028), skin);
    arm.position.y = -0.065;
    pivot.add(sleeve, arm);
    return pivot;
  });
  body.add(torso, band, head, hairCap, capCrown, capBrim, pack, flap, ...legs, ...arms);
  body.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(body);
  const label = makeLabelSprite("친구");
  label.position.y = 0.52;
  group.add(label);
  group.userData = { body, legs, arms };
  return group;
}

// 친구는 가만히 서 있되 숨 쉬듯 살짝 들썩이고, 캐릭터가 가까이 오면 그쪽을 본다
function updateFriend(dt) {
  if (!friend || friend.met) return;
  const m = friend.mesh;
  const ud = m.userData;
  if (!ud.body) return;
  friend.t = (friend.t || 0) + dt;
  ud.body.position.y = Math.abs(Math.sin(friend.t * 2.2)) * 0.006;
  if (character) {
    const dx = character.position.x - m.position.x, dz = character.position.z - m.position.z;
    if (dx * dx + dz * dz < FRIEND_LOOK_RANGE * FRIEND_LOOK_RANGE) {
      const want = Math.atan2(dx, dz);
      let diff = want - ud.body.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      ud.body.rotation.y += diff * Math.min(1, dt * 5);
    }
  }
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
    const en = { mesh, defeated: false, phase: Math.random() * 6 };
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
  if (!enemies.length) return;
  enemies.forEach((en) => {
    if (en.defeated) return;
    const m = en.mesh;
    let fx = 0, fz = 1, speed = 0;
    if (en.path) {
      en.d += en.dir * BULLY_WANDER_SPEED * dt;
      if (en.d >= en.path.len) { en.d = en.path.len; en.dir = -1; }
      if (en.d <= 0) { en.d = 0; en.dir = 1; }
      const q = pathPose(en.path, en.d, en.k);
      en.k = q.k;
      m.position.x = q.x;
      m.position.z = q.z;
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
  const mesh = makeFriend();
  // 보도 위 아무 데나 — 되도록 캐릭터에게서 너무 가깝지도 멀지도 않은 곳
  let spot = null;
  if (pedPaths.length) {
    const cp = character ? character.position : new THREE.Vector3();
    for (let attempt = 0; attempt < 60 && !spot; attempt++) {
      const path = pedPaths[Math.floor(Math.random() * pedPaths.length)];
      const q = pointAlongPolyline(path.pts, Math.random() * path.len);
      const d = Math.hypot(q.x - cp.x, q.z - cp.z);
      if ((d > 8 && d < 40) || attempt === 59) spot = [q.x, q.z];
    }
  }
  const [x, z] = spot || randomStreetSpot();
  mesh.position.set(x, groundHeightAt(x, z), z);
  mesh.userData.body.rotation.y = Math.random() * Math.PI * 2;
  scene.add(mesh);
  friend = { mesh, met: false, t: Math.random() * 3 };
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

function showToast(text, ms = 1600) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, ms);
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

function grantReward(amount, label, ms) {
  if (typeof window.grantAdventureReward === "function") window.grantAdventureReward(amount);
  showToast(`${label} · 용돈 +${amount}원`, ms);
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
const TERRAIN_STEP_MAX = 1.0 * WORLD_SCALE; // 한 걸음에 오르내릴 수 있는 땅 높이 차(raw 1m) — 경사로는 되고 옹벽은 안 된다
function updateMovement(dt) {
  characterMoving = false;
  if (!character || dancing) return;
  if (currentErrand?.phase === "awaitingDialog") return; // 편의점 대화 중엔 멈춰 선다
  const inputForward = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
  const inputRight = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const moving = inputForward !== 0 || inputRight !== 0;
  characterMoving = moving;
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
    // 옹벽(땅 높이가 갑자기 1m 넘게 바뀌는 곳)은 못 넘는다 — 벽을 따라 미끄러지듯 한쪽 방향으로만 움직여 본다
    if (terrainZones.length) {
      const t0 = terrainAt(curX, curZ);
      const ok = (x, z) => Math.abs(terrainAt(x, z) - t0) <= TERRAIN_STEP_MAX;
      if (!ok(nx, nz)) {
        if (ok(nx, curZ)) nz = curZ;
        else if (ok(curX, nz)) nx = curX;
        else { nx = curX; nz = curZ; }
      }
    }
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
  // 지형 단차가 있는 곳에선 캐릭터가 그려지는 높이(땅 높이만큼 올라감)를 따라간다
  const ty = character.position.y + terrainAt(character.position.x, character.position.z);
  const x = character.position.x + camDistance * Math.cos(camPitch) * Math.sin(camYaw);
  // 아래를 볼 때(pitch < 0)는 카메라가 땅 밑으로 내려가지 않게 바닥 위에 머문다
  const y = Math.max(0.25 + ty - character.position.y, ty + camDistance * Math.sin(camPitch) + CAM_LOOK_Y);
  const z = character.position.z + camDistance * Math.cos(camPitch) * Math.cos(camYaw);
  camera.position.set(x, y, z);
  camera.lookAt(character.position.x, ty + CAM_LOOK_Y, character.position.z);
}

function animate() {
  rafId = requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  updateMovement(dt);
  updateEnemies(dt);
  updateFriend(dt);
  updatePickups(dt);
  updateErrand();
  updateErrandHighlights();
  if (mixer) mixer.update(dt);
  if (momMixer) momMixer.update(dt);
  updateCamera();
  updateSunFollow();
  updateSky(dt);
  updateSignals(dt);
  updateAlleyEvent(dt);
  updateCars(dt);
  updatePedestrians(dt);
  updateSchoolZone(dt);
  updateSound(dt);
  updateLabelScales();
  // 라벨·건물 보이기/숨기기는 캐릭터가 움직여야만 바뀌니 0.2초마다만 확인한다
  visibilityTimer += dt;
  if (visibilityTimer >= 0.2) {
    visibilityTimer = 0;
    updateLabelVisibility();
    updatePlaceVisibility();
    updateFenceVisibility();
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
      cloudTint: { value: new THREE.Color(1, 1, 1) },
      night: { value: 0 },
      moonDir: { value: new THREE.Vector3(-0.35, 0.75, 0.55).normalize() },
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
      uniform vec3 cloudTint;
      uniform float night;
      uniform vec3 moonDir;
      varying vec3 vDir;
      float hash3(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(horizonColor, topColor, smoothstep(0.0, 0.55, max(h, 0.0)));
        float c = 0.0;
        if (h > 0.01) {
          vec2 uv = d.xz / (h + 0.12) * 0.16 + vec2(time * 0.0035, time * 0.0012);
          c = texture2D(clouds, uv).a * smoothstep(0.01, 0.2, h);
        }
        if (night > 0.01 && h > 0.04) {
          // 밤하늘: 별(방향을 잘게 나눈 칸마다 드물게 반짝) + 달
          float st = step(0.9968, hash3(floor(d * 300.0)));
          col += vec3(st) * night * smoothstep(0.04, 0.3, h) * (1.0 - c);
          float m = smoothstep(0.99935, 0.9997, dot(d, moonDir));
          col = mix(col, vec3(1.0, 0.97, 0.88), m * night * (1.0 - c * 0.8));
        }
        col = mix(col, cloudTint, c * 0.9);
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
// ── 시간대(밤·낮): 거리 모험 화면 위 "시간" 버튼(전체화면 버튼 왼쪽)으로 고른다 ──
// 시간에 따라 하늘색·햇빛(방향·색·세기)·주변광·안개·구름색이 바뀌고, 밤에는 별·달이 뜬다. 저녁부터는 가로등이
// 밝아지며 바닥에 불빛이 깔리고, 건물 창문(텍스처 없는 어두운 유리 재질)에 불이 켜진다 — 진짜 조명(점광원)은
// 하나도 늘리지 않고 재질 색만 바꿔서 성능 부담이 거의 없다. 고른 시간은 이 기기에만 저장된다.
// ════════════════════════════════════════════════════════════════════════════
let hemiLight = null;
let worldHour = 13; // 0~24시
let nightLevel = 0; // 0 = 낮, 1 = 한밤 — 가로등·창문 불빛 세기
const timeListeners = []; // 시간이 바뀌면 불릴 함수들(행인·가게·소리 등)
const TIME_PRESETS = [
  { h: 7, icon: "🌅", label: "아침" },
  { h: 13, icon: "☀️", label: "낮" },
  { h: 18.5, icon: "🌇", label: "저녁" },
  { h: 21, icon: "🌙", label: "밤" },
  { h: 2, icon: "🌌", label: "새벽" },
];
// 시각별 하늘·빛(사이 시각은 앞뒤 값을 섞는다): 하늘 위·지평선, 해(달)빛 색·세기, 주변광 하늘·땅 색·세기, 구름색, 밤 정도
const TIME_KEYS = [
  { h: 0, top: 0x050b1e, hor: 0x18264a, sun: 0x8fa6e8, sunI: 0.22, hs: 0x55669a, hg: 0x161a22, hI: 0.34, cloud: 0x262d40, night: 1 },
  { h: 4.6, top: 0x081430, hor: 0x23345a, sun: 0x8fa6e8, sunI: 0.22, hs: 0x5a6b9e, hg: 0x181c25, hI: 0.36, cloud: 0x2a3247, night: 1 },
  { h: 5.8, top: 0x3a5a9a, hor: 0xe8a07a, sun: 0xffa86a, sunI: 0.45, hs: 0xb0a0b8, hg: 0x4a4038, hI: 0.6, cloud: 0xf2b8a0, night: 0.55 },
  { h: 7, top: 0x4f9fe6, hor: 0xcfe6f7, sun: 0xffecd2, sunI: 1.05, hs: 0xf2f6ff, hg: 0x7f8a6c, hI: 0.95, cloud: 0xffffff, night: 0 },
  { h: 12, top: 0x4f9fe6, hor: 0xd8ecfa, sun: 0xffffff, sunI: 1.3, hs: 0xffffff, hg: 0x8d9a7a, hI: 1.1, cloud: 0xffffff, night: 0 },
  { h: 16.5, top: 0x4b98e0, hor: 0xdcebf5, sun: 0xfff0d8, sunI: 1.2, hs: 0xfff8ee, hg: 0x8d9a7a, hI: 1.05, cloud: 0xffffff, night: 0 },
  { h: 18.2, top: 0x3a5c9c, hor: 0xffa468, sun: 0xff9a52, sunI: 0.75, hs: 0xf0c8a8, hg: 0x5e5446, hI: 0.75, cloud: 0xffcfa8, night: 0.3 },
  { h: 19.3, top: 0x1b2a58, hor: 0x8a5a7a, sun: 0xc0806e, sunI: 0.32, hs: 0x8a7ea6, hg: 0x2e2c33, hI: 0.48, cloud: 0x6a5a72, night: 0.8 },
  { h: 20.5, top: 0x061029, hor: 0x1c2b50, sun: 0x8fa6e8, sunI: 0.22, hs: 0x55669a, hg: 0x161a22, hI: 0.34, cloud: 0x262d40, night: 1 },
  { h: 24, top: 0x050b1e, hor: 0x18264a, sun: 0x8fa6e8, sunI: 0.22, hs: 0x55669a, hg: 0x161a22, hI: 0.34, cloud: 0x262d40, night: 1 },
];
const _tc1 = new THREE.Color(), _tc2 = new THREE.Color();
function mixHex(a, b, t, out) { return out.copy(_tc1.setHex(a)).lerp(_tc2.setHex(b), t); }
function timeLabel(h) {
  const hh = Math.floor(h) % 24, mm = Math.round((h - Math.floor(h)) * 60);
  const name = h >= 5 && h < 9 ? ["🌅", "아침"] : h >= 9 && h < 17 ? ["☀️", "낮"] : h >= 17 && h < 20 ? ["🌇", "저녁"] : h >= 20 || h < 1 ? ["🌙", "밤"] : ["🌌", "새벽"];
  return `${name[0]} ${name[1]} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
const _windowWarm = new THREE.Color(0xffcf73), _windowShop = new THREE.Color(0xfff0c8), _windowOther = new THREE.Color(0xffe2a6);
const _headDay = new THREE.Color(0xe8e4d6), _headNight = new THREE.Color(0xfff0b8);
function applyTimeOfDay() {
  const h = ((worldHour % 24) + 24) % 24;
  let i = 0;
  while (i < TIME_KEYS.length - 2 && TIME_KEYS[i + 1].h <= h) i++;
  const A = TIME_KEYS[i], B = TIME_KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (h - A.h) / (B.h - A.h || 1)));
  mixHex(A.top, B.top, t, SKY_TOP_COLOR);
  mixHex(A.hor, B.hor, t, SKY_HORIZON_COLOR);
  nightLevel = A.night + (B.night - A.night) * t;
  if (scene) {
    if (scene.background && scene.background.isColor) scene.background.copy(SKY_HORIZON_COLOR);
    if (scene.fog) scene.fog.color.copy(SKY_HORIZON_COLOR);
  }
  if (skyMesh) {
    const u = skyMesh.material.uniforms;
    mixHex(A.cloud, B.cloud, t, u.cloudTint.value);
    u.night.value = nightLevel;
  }
  if (sunLight) {
    mixHex(A.sun, B.sun, t, sunLight.color);
    sunLight.intensity = A.sunI + (B.sunI - A.sunI) * t;
    // 낮에는 해가 동쪽에서 남쪽 하늘을 지나 서쪽으로, 밤에는 달빛(남서쪽 높이)
    if (h >= 5.6 && h <= 19.5) {
      const a = Math.min(1, Math.max(0, (h - 5.8) / 13.4)) * Math.PI;
      SUN_OFFSET.set(Math.cos(a), 0.3 + 1.1 * Math.sin(a), 0.55).normalize().multiplyScalar(42);
    } else {
      SUN_OFFSET.set(-0.35, 0.75, 0.55).normalize().multiplyScalar(42);
    }
    updateSunFollow();
  }
  if (hemiLight) {
    mixHex(A.hs, B.hs, t, hemiLight.color);
    mixHex(A.hg, B.hg, t, hemiLight.groundColor);
    hemiLight.intensity = A.hI + (B.hI - A.hI) * t;
  }
  // 가로등: 해 질 녘부터 켜진다
  const lamp = Math.max(0, Math.min(1, (nightLevel - 0.15) / 0.5));
  if (streetlightHeadMat) streetlightHeadMat.color.copy(_headDay).lerp(_headNight, lamp);
  if (streetlightPools) {
    streetlightPools.visible = lamp > 0.01;
    streetlightPools.material.opacity = 0.7 * lamp;
  }
  buildingGlass.forEach((_, entry) => applyGlassNight(entry));
  timeListeners.forEach((fn) => fn(h, nightLevel));
}
function setWorldHour(h, save = true) {
  worldHour = ((h % 24) + 24) % 24;
  if (save) { try { localStorage.setItem("roymaker-nb-hour", String(worldHour)); } catch (err) { /* 저장 못 해도 괜찮다 */ } }
  applyTimeOfDay();
  updateTimeUI();
}
function loadSavedHour() {
  try {
    const v = parseFloat(localStorage.getItem("roymaker-nb-hour"));
    if (Number.isFinite(v)) worldHour = ((v % 24) + 24) % 24;
  } catch (err) { /* 저장소를 못 쓰면 기본(낮) */ }
}

// ── 가게 영업 시간(창문 불빛·가게 앞 영업 표시가 따른다) — 편의점은 24시간, 학교·보건소는 낮에만 ──
const SHOP_TYPES = new Set(["편의점", "카페", "식당", "학원", "중형마트", "대형마트", "마트"]);
const OPEN_HOURS = { 편의점: [0, 24], 카페: [8, 22], 식당: [10.5, 22], 학원: [14, 22], 중형마트: [9, 23], 대형마트: [10, 23], 마트: [9, 23], 보건소: [9, 18], 도서관: [9, 22], 학교: [8, 17] };
function placeIsOpen(place, h) {
  const r = OPEN_HOURS[place.type];
  if (!r) return true;
  return h >= r[0] && h < r[1];
}

// ── 창문 불빛: 건물 모델이 불러와질 때 창유리 재질을 골라 두고, 밤 정도에 따라 발광 세기를 바꾼다 ──
// 모델 재질 이름이 비어 있어서 색으로 고른다: 텍스처 없이 파르스름하고 어두우면서 매끈한 면(창유리), 반투명한 면,
// 어두운 금속성 면 — 그리고 창이 그려진 벽 텍스처는 어둡고 파르스름한 픽셀(창유리 부분)만 빛나게 한다.
// 셰이더를 살짝 고쳐서 건물 기준 "창 하나·층 하나" 크기 칸마다 켜짐/꺼짐·밝기를 무작위로 정하고,
// 위·아래를 보는 면(지붕·바닥)은 빛나지 않게 한다 — 실제 아파트처럼 집집마다 불 켜진 창이 다르다.
const buildingGlass = new Map(); // 불러온 건물(entry) → { place, list: [{ mat, k, off, origEmissive, origIntensity }] }
const WIN_CELL = new THREE.Vector3(2.6, 2.9, 2.6); // 모델 좌표(대략 m)에서 창 하나 · 층 하나 크기
function isGlassyMaterial(m) {
  if (!m || !m.isMeshStandardMaterial || m.map) return false;
  const c = m.color;
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  if (m.opacity < 0.9) return true; // 반투명 유리
  if (c.b >= c.r && lum < 0.15 && m.roughness <= 0.55) return true; // 어둡고 파르스름한 유리
  if (c.b >= c.r && m.roughness <= 0.15) return true; // 아주 매끈한(비치는) 유리
  return m.metalness >= 0.3 && lum < 0.2; // 어두운 금속성 유리
}
// 재질별 면적(월드 기준) — 건물 겉면의 큰 몫을 덮는 재질은 유리가 아니라 벽이라고 본다
function materialAreas(model) {
  const areas = new Map();
  let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  model.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || !o.geometry?.attributes?.position) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index;
    const n = idx ? idx.count : pos.count;
    let area = 0;
    for (let i = 0; i + 2 < n; i += 3) {
      a.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(o.matrixWorld);
      b.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(o.matrixWorld);
      c.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(o.matrixWorld);
      area += b.sub(a).cross(c.sub(a)).length() * 0.5;
    }
    areas.set(o.material, (areas.get(o.material) || 0) + area);
    total += area;
  });
  return { areas, total: total || 1 };
}
// texMode: 0 = 창유리 재질(면 전체가 유리), 1 = 텍스처에 창이 그려진 벽(어둡고 파르스름한 픽셀만 빛난다)
function patchWindowMaterial(mat, invModel, off, texMode) {
  if (mat.userData.nbWindow) return;
  mat.userData.nbWindow = true;
  mat.customProgramCacheKey = () => "nb-window-glow";
  mat.onBeforeCompile = (shader) => {
    if (!shader.vertexShader.includes("#include <worldpos_vertex>") || !shader.fragmentShader.includes("#include <emissivemap_fragment>")) return;
    shader.uniforms.uWinInv = { value: invModel };
    shader.uniforms.uWinCell = { value: WIN_CELL };
    shader.uniforms.uWinOff = off;
    shader.uniforms.uWinTex = { value: texMode };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform mat4 uWinInv;\nvarying vec3 vWinPos;\nvarying vec3 vWinN;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWinPos = (uWinInv * modelMatrix * vec4(transformed, 1.0)).xyz;\nvWinN = normalize(mat3(modelMatrix) * objectNormal);");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uWinCell;\nuniform float uWinOff;\nuniform float uWinTex;\nvarying vec3 vWinPos;\nvarying vec3 vWinN;")
      .replace("#include <emissivemap_fragment>", [
        "#include <emissivemap_fragment>",
        "{",
        "  vec3 wc = floor(vWinPos / uWinCell);",
        "  float wr = fract(sin(dot(wc, vec3(12.9898, 78.233, 37.719))) * 43758.5453);",
        "  float winLike = 1.0;",
        "  if (uWinTex > 0.5) {",
        "    float l = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));",
        "    winLike = (1.0 - smoothstep(0.06, 0.2, l)) * step(diffuseColor.r, diffuseColor.b + 0.02);",
        "  }",
        "  totalEmissiveRadiance *= winLike * step(uWinOff, wr) * (0.7 + 0.6 * fract(wr * 7.13)) * (1.0 - smoothstep(0.4, 0.8, abs(vWinN.y)));",
        "}",
      ].join("\n"));
  };
  mat.needsUpdate = true;
}
function registerBuildingGlass(entry, model) {
  const seen = new Set();
  const list = [];
  model.updateMatrixWorld(true);
  const inv = model.matrixWorld.clone().invert();
  const { areas, total } = materialAreas(model);
  let seed = (Math.abs(hashSeed(entry.place.id, "glass")) % 2147483646) + 1;
  model.traverse((o) => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      if (seen.has(m) || !m || !m.isMeshStandardMaterial) return;
      seen.add(m);
      const glass = isGlassyMaterial(m) && (areas.get(m) || 0) / total <= 0.3;
      if (!glass && !m.map) return; // 텍스처도 없고 유리도 아닌 벽·지붕은 그대로
      seed = (seed * 16807) % 2147483647;
      const off = { value: 0.4 }; // 꺼진 창 비율(시간·영업에 따라 바뀐다)
      patchWindowMaterial(m, inv, off, glass ? 0 : 1);
      list.push({ mat: m, k: 0.6 + (seed / 2147483647) * 0.4, off, origEmissive: m.emissive.clone(), origIntensity: m.emissiveIntensity });
    });
  });
  if (!list.length) return;
  buildingGlass.set(entry, { place: entry.place, list });
  applyGlassNight(entry);
}
function applyGlassNight(entry) {
  const info = buildingGlass.get(entry);
  if (!info) return;
  const place = info.place;
  const open = placeIsOpen(place, worldHour);
  const shop = SHOP_TYPES.has(place.type) || OPEN_HOURS[place.type];
  const color = place.type === "아파트" ? _windowWarm : shop ? _windowShop : _windowOther;
  const level = Math.max(0, (nightLevel - 0.2) / 0.8);
  // 꺼진 창 비율: 아파트는 밤이 깊을수록(새벽엔 대부분 잠) 더 많이, 가게는 문 열면 거의 다 켜지고 닫으면 거의 다 꺼짐
  const h = worldHour;
  const lateNight = h >= 0.5 && h < 5 ? 0.88 : h >= 23 || h < 0.5 ? 0.7 : 0.52;
  const offFrac = shop ? (open ? 0.15 : 0.92) : place.type === "아파트" ? lateNight : 0.6;
  info.list.forEach((g) => {
    g.off.value = offFrac;
    if (level <= 0) {
      g.mat.emissive.copy(g.origEmissive);
      g.mat.emissiveIntensity = g.origIntensity;
      return;
    }
    g.mat.emissive.copy(color);
    g.mat.emissiveIntensity = level * g.k * 0.8;
  });
}
// 거리 모험 화면 위 시간 버튼 + 고르는 창(미리 정한 시간 5개 + 30분 단위 막대)
let timeBtnEl = null, timePopEl = null, timeRangeEl = null;
function updateTimeUI() {
  if (timeBtnEl) timeBtnEl.textContent = timeLabel(worldHour);
  if (timeRangeEl) timeRangeEl.value = String(worldHour);
  timePopEl?.querySelectorAll(".nb-time-preset").forEach((b) => b.classList.toggle("on", Math.abs(parseFloat(b.dataset.h) - worldHour) < 0.01));
}
function wireTimeControls() {
  timeBtnEl = document.getElementById("neighborhood3d-time-btn");
  timePopEl = document.getElementById("neighborhood3d-time-pop");
  timeRangeEl = document.getElementById("neighborhood3d-time-range");
  if (!timeBtnEl || !timePopEl) return;
  const presets = timePopEl.querySelector(".nb-time-presets");
  if (presets) {
    presets.innerHTML = "";
    TIME_PRESETS.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "nb-time-preset";
      b.dataset.h = String(p.h);
      b.textContent = `${p.icon} ${p.label}`;
      b.addEventListener("click", () => { setWorldHour(p.h); b.blur(); });
      presets.appendChild(b);
    });
  }
  timeRangeEl?.addEventListener("input", () => setWorldHour(parseFloat(timeRangeEl.value)));
  timeRangeEl?.addEventListener("change", () => timeRangeEl.blur()); // 방향키가 막대 대신 캐릭터를 움직이게
  timeBtnEl.addEventListener("click", (ev) => {
    ev.stopPropagation();
    timePopEl.hidden = !timePopEl.hidden;
    timeBtnEl.blur();
  });
  document.addEventListener("pointerdown", (ev) => {
    if (!timePopEl.hidden && !timePopEl.contains(ev.target) && ev.target !== timeBtnEl) timePopEl.hidden = true;
  });
  updateTimeUI();
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
const signalArms = new Map(); // "도로번호:a|b" → 그 끝 횡단보도(신호 있음), 길 중간은 "도로번호:m번호:±1"
const midSignalsBySeg = new Map(); // 도로번호 → 그 도로 중간 횡단보도의 신호(다가오는 방향별) — 차가 길 중간에서도 서게
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

const armKey = (a) => (a.mid ? `${a.seg}:m${a.midIndex}:${a.dirSign}` : `${a.seg}:${a.which}`);

function buildTrafficSignals() {
  signalArms.clear();
  midSignalsBySeg.clear();
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
    arms.forEach((a) => {
      a.junctionRef = j;
      signalArms.set(armKey(a), a);
      if (a.mid) {
        if (!midSignalsBySeg.has(a.seg)) midSignalsBySeg.set(a.seg, []);
        midSignalsBySeg.get(a.seg).push(a);
      }
    });
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
    // (길 중간 횡단보도는 방향마다 기록이 둘이라 보행 신호등은 첫 기록에만 — pedSignals)
    if (c.pedSignals !== false) [1, -1].forEach((side) => {
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
// ── 달리는 차·버스·오토바이: 캐릭터 주변에서만 차 18대 + 서울 시내버스 4대(파란 간선·초록 지선) + 배달 오토바이
//    4대가 차로를 따라 달린다 (한밤·새벽엔 차가 줄고 버스는 쉰다 — carDensity) ──
// · 8m 이상 도로(단지 안 베이지 도로 제외)의 오른쪽 차로를 달리고, 도로 끝(교차로)에서 이어진 길 중 하나로
//   꺾어 들어간다(곧은 길을 더 자주 고름). 막다른 길에선 돌아 나온다. 버스는 13m 이상 큰길을 골라 다닌다.
// · 신호등이 있는 끝에서는 빨강·노랑이면 정지선 앞에 선다. 앞차와 거리를 두고, 앞에 사람이 있으면 멈춘다
//   (차도에 서서 오래 막고 있으면 경적). 어린이 보호구역에선 절반 속도.
// · 차는 몸통·유리, 버스는 색깔별 몸통 하나(텍스처 한 장에 옆면·앞뒤·지붕을 모아 그림), 오토바이는 몸통·배달원·
//   헬멧·배달통, 바퀴·그림자는 같이 써서 종류별 인스턴스 몇 개뿐이다. 밤엔 전조등·미등과 앞 도로 불빛이 켜진다.
//   멀어진 차는 캐릭터 근처로 다시 보낸다. 차 한 대 자리는 "골목에서 나오는 차" 이벤트 전용이다.
// ════════════════════════════════════════════════════════════════════════════
const CAR_COUNT = 18;
const BUS_COUNT = 4; // 반은 파란 간선버스, 반은 초록 지선버스
// 배달 오토바이: 스쿠터 + 헬멧 쓴 배달원 + 뒤에 배달통. 차처럼 차로·신호를 따르되 더 빠르고 바깥 차로 쪽으로 달리며,
// 꺾을 때 몸을 기울인다.
const MOTO_COUNT = 4;
const MOTO_LEN = 0.36, MOTO_WID = 0.13;
const MOTO_MAX_SPEED = 4.7;
const MOTO_COLORS = [0xd8262e, 0xf2f2ef, 0x2a2c31, 0xf2b705];
const MOTO_JACKETS = [0x2a3a5c, 0x1f7a64, 0xd9482b, 0x3b3f46];
const MOTO_HELMETS = [0xffffff, 0xe03a3a, 0x26282c, 0xffcf3a];
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
    const look = roadLook(seg);
    // 8m 이상 자동차 도로(보행용 도로는 차가 안 다님)
    const drivable = L > 4 && w >= 8 && look.kind !== "walk" && look.perDir >= 1;
    // 양 끝 교차로 구간 길이(차가 그 앞에서 꺾기 시작)
    let gapA = 0, gapB = 0;
    ((roadMarkings.junctionGaps || roadMarkings.gaps)[i] || []).forEach(([g0, g1]) => {
      if (g0 <= 0.01) gapA = Math.max(gapA, Math.min(L, g1));
      if (g1 >= L - 0.01) gapB = Math.max(gapB, L - Math.max(0, g0));
    });
    if (gapA + gapB > L * 0.9) { gapA = Math.min(gapA, L * 0.45); gapB = Math.min(gapB, L * 0.45); }
    // 진행 방향 오른쪽 차로들의 중심(raw) — 왕복 차로 수(lanes)를 반으로 나눠 한 방향 차로마다 하나
    const lanes = [];
    for (let k = 0; k < Math.max(1, look.perDir); k++) lanes.push((k + 0.5) * look.laneW);
    // 어린이 보호구역에서는 천천히(시속 30km 느낌)
    return { i, pts, cum, L, w, drivable, gapA, gapB, lanes, speedFactor: look.kind === "school" ? SCHOOL_SPEED_FACTOR : 1 };
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
  buildBusStops();
}

// ── 버스정류장: 유형이 "버스정류장"인 장소를 가장 가까운 찻길에 붙인다 — 정류장이 진행 방향 오른쪽(인도 쪽)에
// 오는 방향으로 달리는 버스는 정류장 앞에 서서 몇 초 기다렸다가(사람이 타고 내리는 시간) 다시 출발한다 ──
const BUS_STOP_ATTACH_RAW = 30; // 정류장에서 이 거리(raw m) 안의 찻길에만 붙인다
const BUS_DWELL_MIN = 4, BUS_DWELL_MAX = 7; // 정류장에 서 있는 시간(초)
let busStopsBySeg = new Map(); // 도로 번호 → [{ s, dir, place }]
function buildBusStops() {
  busStopsBySeg = new Map();
  PLACES.forEach((place) => {
    if (place.type !== "버스정류장") return;
    let best = null;
    carRoads.forEach((r) => {
      if (!r.drivable) return;
      const q = nearestOnRawPolyline(r.pts, r.cum, place.x, place.z);
      // 도로 끝 교차로 구간 안이면 버스가 서기 어려우니 그 바로 바깥으로
      const s = Math.max(r.gapA + 3, Math.min(r.L - r.gapB - 3, q.s));
      if (r.L - r.gapA - r.gapB < 8) return;
      const d = q.dist - r.w / 2;
      if (d < BUS_STOP_ATTACH_RAW && (!best || d < best.d || (Math.abs(d - best.d) < 2 && r.w > best.r.w))) best = { r, q, s, d };
    });
    if (!best) return;
    // 정류장이 도로 중심선의 어느 쪽인가 → 그쪽이 오른쪽이 되는 진행 방향
    const side = (place.x - best.q.x) * -best.q.dz + (place.z - best.q.z) * best.q.dx; // dir=+1 기준 오른쪽(-dz, dx)이면 양수
    const dir = side >= 0 ? 1 : -1;
    if (!busStopsBySeg.has(best.r.i)) busStopsBySeg.set(best.r.i, []);
    busStopsBySeg.get(best.r.i).push({ s: best.s, dir, place });
  });
}

function carRoadPose(r, s, dir, lane) {
  const q = polyPointAt(r.pts, r.cum, s);
  const fx = q.dx * dir, fz = q.dz * dir;
  const rx = -fz, rz = fx; // 진행 방향 오른쪽(우측통행)
  return { x: (q.x + rx * lane) * WORLD_SCALE, z: (q.z + rz * lane) * WORLD_SCALE, fx, fz };
}

// 버스는 오른쪽 끝 차로(정류장 쪽), 오토바이는 대개 바깥 차로, 차는 아무 차로나
function laneFor(car, r) {
  if (car.type === "bus" || (car.type === "moto" && Math.random() < 0.75)) return r.lanes[r.lanes.length - 1];
  return r.lanes[Math.floor(Math.random() * r.lanes.length)];
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
    Object.assign(car, { active: true, mode: "road", seg: r.i, s, dir, lane, turn: null, x: pose.x, z: pose.z, fx: pose.fx, fz: pose.fz, lean: 0, prevYaw: undefined, dwell: 0, lastStop: null });
    car.maxSpeed = (isBus ? BUS_MAX_SPEED : car.type === "moto" ? MOTO_MAX_SPEED : CAR_MAX_SPEED) * (0.85 + Math.random() * 0.3);
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

// 배달 오토바이 모양(몸통·안장·앞 기둥·핸들을 한 덩어리로)
function makeMotoBodyGeometry() {
  const parts = [];
  const box = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); parts.push(g); };
  box(0.085, 0.07, 0.24, 0, 0.1, -0.01); // 몸통·발판
  box(0.078, 0.05, 0.13, 0, 0.155, -0.05); // 안장
  box(0.07, 0.17, 0.045, 0, 0.165, 0.115); // 앞 기둥·앞 덮개
  box(0.16, 0.014, 0.014, 0, 0.25, 0.11); // 핸들
  return mergeGeometries(parts);
}
// 배달원(앉은 자세): 윗옷(인스턴스 색 그대로)·바지(어둡게)를 정점 색으로 나눠 한 덩어리로
function makeRiderGeometry() {
  const parts = [];
  const add = (g, shade) => {
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3).fill(shade);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    parts.push(g);
  };
  const torso = new THREE.BoxGeometry(0.11, 0.14, 0.07);
  torso.rotateX(0.2); // 앞으로 살짝 숙임
  torso.translate(0, 0.255, -0.04);
  add(torso, 1);
  [-1, 1].forEach((sx) => {
    const arm = new THREE.BoxGeometry(0.03, 0.03, 0.15);
    arm.rotateX(0.4); // 어깨에서 핸들 쪽으로 내려감
    arm.translate(sx * 0.066, 0.28, 0.04);
    add(arm, 1);
    const thigh = new THREE.BoxGeometry(0.038, 0.04, 0.11);
    thigh.translate(sx * 0.03, 0.195, 0.01);
    add(thigh, 0.2);
    const shin = new THREE.BoxGeometry(0.036, 0.075, 0.036);
    shin.translate(sx * 0.034, 0.16, 0.065);
    add(shin, 0.2);
  });
  return mergeGeometries(parts);
}
function makeDeliveryBoxTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#d63b2f";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 86, 128, 12);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "bold 44px sans-serif";
  g.fillText("배달", 64, 48);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildCars() {
  buildCarNetwork();
  cars = [];
  const nCarSlots = CAR_COUNT + 1; // 마지막 한 대는 "골목에서 나오는 차" 이벤트 전용
  const total = nCarSlots + BUS_COUNT + MOTO_COUNT;
  const bodyGeo = new THREE.BoxGeometry(CAR_WID, 0.11, CAR_LEN);
  const cabinGeo = new THREE.BoxGeometry(CAR_WID * 0.86, 0.085, CAR_LEN * 0.5);
  const wheelGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.045, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  const shadowGeo = new THREE.CircleGeometry(1, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const body = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.35 }), nCarSlots);
  const cabin = new THREE.InstancedMesh(cabinGeo, new THREE.MeshStandardMaterial({ color: 0x24313d, roughness: 0.2, metalness: 0.6 }), nCarSlots);
  const wheels = new THREE.InstancedMesh(wheelGeo, new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.9 }), total * 4);
  const shadow = new THREE.InstancedMesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }), total);
  const busGeo = makeBusGeometry();
  const buses = BUS_TYPES.map((t) => new THREE.InstancedMesh(busGeo, new THREE.MeshStandardMaterial({ map: makeBusTexture(t), roughness: 0.55, metalness: 0.15 }), BUS_COUNT));
  const motoBody = new THREE.InstancedMesh(makeMotoBodyGeometry(), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.25 }), MOTO_COUNT);
  const rider = new THREE.InstancedMesh(makeRiderGeometry(), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, vertexColors: true }), MOTO_COUNT);
  const helmetGeo = new THREE.SphereGeometry(0.05, 10, 8);
  helmetGeo.scale(1, 0.95, 1.1);
  helmetGeo.translate(0, 0.39, -0.01);
  const helmet = new THREE.InstancedMesh(helmetGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 }), MOTO_COUNT);
  const boxGeo = new THREE.BoxGeometry(0.12, 0.1, 0.11);
  boxGeo.translate(0, 0.225, -0.16);
  const deliveryBox = new THREE.InstancedMesh(boxGeo, new THREE.MeshStandardMaterial({ map: makeDeliveryBoxTexture(), roughness: 0.7 }), MOTO_COUNT);
  // 밤에만: 전조등(흰빛)·미등(빨강) 작은 판, 차 앞 도로에 깔리는 불빛(가로등 불빛처럼 더해 그리는 판)
  const lampGeo = new THREE.BoxGeometry(0.055, 0.026, 0.008);
  const headLamps = new THREE.InstancedMesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xfff6d8 }), total * 2);
  const tailLamps = new THREE.InstancedMesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xff2a1f }), total * 2);
  const beamGeo = new THREE.CircleGeometry(1, 20);
  beamGeo.rotateX(-Math.PI / 2);
  const beams = new THREE.InstancedMesh(beamGeo, new THREE.MeshBasicMaterial({ map: getLightPoolTexture(), color: 0xfff4dc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }), total);
  beams.renderOrder = 2;
  for (let k = 0; k < nCarSlots; k++) {
    body.setColorAt(k, new THREE.Color(CAR_COLORS[k % CAR_COLORS.length]));
    cars.push({ active: false, index: k, type: "car", len: CAR_LEN, wid: CAR_WID, scripted: k === CAR_COUNT });
  }
  for (let k = 0; k < BUS_COUNT; k++) {
    cars.push({ active: false, index: k, type: "bus", busType: k % BUS_TYPES.length, len: BUS_LEN, wid: BUS_WID });
  }
  for (let k = 0; k < MOTO_COUNT; k++) {
    cars.push({ active: false, index: k, type: "moto", len: MOTO_LEN, wid: MOTO_WID, lean: 0, latOff: 0.5 + Math.random() * 0.5 });
  }
  const all = [body, cabin, wheels, shadow, ...buses, motoBody, rider, helmet, deliveryBox, headLamps, tailLamps, beams];
  all.forEach((m) => {
    m.frustumCulled = false; // 인스턴스가 계속 움직여서 미리 잡은 경계로 자르면 안 된다
    m.count = 0;
    scene.add(m);
  });
  [motoBody, rider, helmet].forEach((m) => m.setColorAt(0, new THREE.Color(0xffffff))); // instanceColor 버퍼를 미리 만든다
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  carMeshes = { body, cabin, wheels, shadow, buses, motoBody, rider, helmet, deliveryBox, headLamps, tailLamps, beams, all };
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
  beginTurn(car, carRoadPose(nr, s, dir, lane), { seg: m.i, dir, s, lane });
}

// 지금 자리·방향에서 p1(다음 도로 위 자리·방향)까지 2차 곡선으로 돌아 들어간다
function beginTurn(car, p1, next) {
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
  car.turn = { p0, c: { x: cx, z: cz }, p1, len: Math.max(0.05, len), t: 0, next };
}

function speedToStopWithin(distWorld) {
  return distWorld <= 0 ? 0 : Math.sqrt(2 * CAR_DECEL * distWorld);
}

let honkCooldown = 0;
function updateCars(dt) {
  if (!carMeshes || !character) return;
  honkCooldown = Math.max(0, honkCooldown - dt);
  const W = WORLD_SCALE;
  const cp = character.position;
  carRespawnTimer += dt;
  if (carRespawnTimer > 0.5) {
    carRespawnTimer = 0;
    const allowedCars = Math.round(CAR_COUNT * carDensity(worldHour));
    const busesRun = worldHour >= 5;
    cars.forEach((car) => {
      const far = !car.active || Math.hypot(car.x - cp.x, car.z - cp.z) > VEHICLE_DESPAWN;
      if (car.scripted) { if (far) car.active = false; return; } // 골목 이벤트 차는 이벤트 때만 나온다
      if ((car.type === "car" && car.index >= allowedCars) || (car.type === "bus" && !busesRun)) {
        if (car.active && safeToHide(car.x, car.z)) car.active = false; // 지금 시간엔 쉬는 차
        return;
      }
      if (far) {
        car.active = false;
        spawnCar(car);
      }
    });
  }
  cars.forEach((car) => {
    if (!car.active) return;
    const accel = car.type === "moto" ? CAR_ACCEL * 1.7 : CAR_ACCEL;
    let limit = car.maxSpeed * (car.mode === "road" ? carRoads[car.seg].speedFactor : 1);
    // 앞에 사람(캐릭터)이 있으면 멈춘다
    const ax = cp.x - car.x, az = cp.z - car.z;
    const ahead = ax * car.fx + az * car.fz;
    const side = Math.abs(ax * -car.fz + az * car.fx);
    if (ahead > 0 && ahead < car.len * 0.5 + 1.8 && side < car.wid * 0.5 + 0.25) {
      limit = Math.min(limit, speedToStopWithin(ahead - car.len * 0.5 - 0.35));
      // 차도에 서서 차를 오래 막고 있으면 "빵!"
      car.blockedT = car.speed < 0.3 ? (car.blockedT || 0) + dt : 0;
      if (car.blockedT > 1.6 && honkCooldown <= 0 && !car.scripted && !characterOnCrossing()) {
        honkCooldown = 7;
        car.blockedT = 0;
        playHorn(0.8);
        showToast("🚗 빵! 차도에 서 있으면 위험해요 — 보도로 비켜요", 2400);
      }
    } else car.blockedT = 0;
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
      // 길 중간 횡단보도 신호(이 차가 달리는 방향에서 다가오는 쪽 정지선)
      const midArms = midSignalsBySeg.get(car.seg);
      if (midArms) {
        for (const arm of midArms) {
          if (arm.dirSign !== car.dir) continue;
          const st = armVehicleState(arm);
          if (st === "G") continue;
          const toStop = (arm.sStop - car.s) * car.dir;
          if (toStop > -0.3 && !(st === "Y" && toStop < 3)) {
            limit = Math.min(limit, speedToStopWithin((toStop - 0.4) * W - car.len * 0.5));
          }
        }
      }
      // 버스정류장: 이 도로·방향의 정류장 앞에서 서서 잠깐 기다린다
      if (car.type === "bus") {
        if (car.dwell > 0) {
          car.dwell -= dt;
          limit = 0;
          if (car.dwell <= 0) car.dwell = 0;
        } else {
          for (const st of busStopsBySeg.get(car.seg) || []) {
            if (st.dir !== car.dir || car.lastStop === st) continue;
            const to = (st.s - car.s) * car.dir; // raw, 정류장까지
            if (to < -2 || to > 45) continue;
            limit = Math.min(limit, speedToStopWithin(Math.max(0, to) * W));
            if (to < 1 && car.speed < 0.2) {
              car.dwell = BUS_DWELL_MIN + Math.random() * (BUS_DWELL_MAX - BUS_DWELL_MIN);
              car.lastStop = st; // 다 기다리면 이 정류장은 지나간다
              limit = 0;
            }
            break;
          }
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
      car.speed += Math.max(-CAR_DECEL * dt, Math.min(accel * dt, limit - car.speed));
      car.speed = Math.max(0, car.speed);
      car.s += (car.dir * car.speed * dt) / W;
      const pose = carRoadPose(r, car.s, car.dir, car.lane + (car.type === "moto" ? car.latOff : 0));
      car.x = pose.x; car.z = pose.z; car.fx = pose.fx; car.fz = pose.fz;
      const turnAt = car.dir > 0 ? r.L - r.gapB : r.gapA;
      if ((car.dir > 0 && car.s >= turnAt) || (car.dir < 0 && car.s <= turnAt)) startCarTurn(car);
    } else if (car.mode === "alley") {
      // 골목 이벤트 차: 골목 가운데를 따라 큰길 쪽으로 나온다(멈춤·급정거는 updateAlleyEvent가 speedCap으로 정한다)
      const al = car.alley;
      car.speed += Math.max(-CAR_DECEL * 1.8 * dt, Math.min(accel * dt, Math.min(limit, al.speedCap) - car.speed));
      car.speed = Math.max(0, car.speed);
      car.s += (al.dir * car.speed * dt) / W;
      const pose = carRoadPose(al.r, car.s, al.dir, al.lane);
      car.x = pose.x; car.z = pose.z; car.fx = pose.fx; car.fz = pose.fz;
      if ((al.dir > 0 && car.s >= al.sTurn) || (al.dir < 0 && car.s <= al.sTurn)) startAlleyExitTurn(car);
    } else {
      const tn = car.turn;
      car.speed += Math.max(-CAR_DECEL * dt, Math.min(accel * dt, Math.min(limit, car.maxSpeed * 0.75) - car.speed));
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
    if (car.type === "moto") {
      // 꺾을 때 도는 쪽으로 몸을 기울인다(빠르게 돌수록 더)
      const yaw = Math.atan2(car.fx, car.fz);
      let dy = car.prevYaw === undefined ? 0 : yaw - car.prevYaw;
      if (dy > Math.PI) dy -= 2 * Math.PI;
      else if (dy < -Math.PI) dy += 2 * Math.PI;
      car.prevYaw = yaw;
      const target = Math.max(-0.42, Math.min(0.42, (-dy / Math.max(dt, 1e-3)) * car.speed / 20));
      car.lean += (target - car.lean) * Math.min(1, dt * 5);
    }
  });
  // 그리기(종류별로 활성인 것만 앞쪽 칸에 모아서)
  const { body, cabin, wheels, shadow, buses, motoBody, rider, helmet, deliveryBox, headLamps, tailLamps, beams } = carMeshes;
  const m = new THREE.Matrix4(), part = new THREE.Matrix4(), base = new THREE.Matrix4(), sc = new THREE.Matrix4();
  const y0 = 0.012;
  let nCar = 0, nAll = 0, nW = 0, nMoto = 0, nHead = 0, nTail = 0;
  const nBus = BUS_TYPES.map(() => 0);
  // 밤엔 전조등·미등을 켜고 차 앞 도로를 비춘다(낮에는 아예 그리지 않는다)
  const lampsOn = nightLevel > 0.3;
  headLamps.visible = tailLamps.visible = beams.visible = lampsOn;
  beams.material.opacity = 0.5 * Math.min(1, (nightLevel - 0.3) / 0.4);
  const lamp = (mesh, idx, x, y, z) => { mesh.setMatrixAt(idx, m.multiplyMatrices(base, part.makeTranslation(x, y, z))); };
  cars.forEach((car) => {
    if (!car.active) return;
    base.makeRotationY(Math.atan2(car.fx, car.fz)).setPosition(car.x, y0, car.z);
    shadow.setMatrixAt(nAll, m.multiplyMatrices(base, part.makeScale(car.wid * 0.75, 1, car.len * 0.62)));
    if (lampsOn) {
      const ahead = car.type === "bus" ? BUS_LEN / 2 + 0.6 : car.type === "moto" ? 0.55 : CAR_LEN / 2 + 0.55;
      const bw = car.type === "bus" ? 0.36 : car.type === "moto" ? 0.2 : 0.32;
      const bl = car.type === "bus" ? 0.72 : car.type === "moto" ? 0.42 : 0.64;
      beams.setMatrixAt(nAll, m.multiplyMatrices(base, part.makeTranslation(0, 0.017 - y0, ahead)).multiply(sc.makeScale(bw, 1, bl)));
    }
    if (car.type === "bus") {
      const mesh = buses[car.busType];
      mesh.setMatrixAt(nBus[car.busType]++, m.multiplyMatrices(base, part.makeTranslation(0, BUS_CLEARANCE + BUS_H / 2, 0)));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        m.multiplyMatrices(base, part.makeTranslation(sx * (BUS_WID / 2 - 0.015), 0.06, sz * 0.56));
        wheels.setMatrixAt(nW++, m.multiply(sc.makeScale(1.35, 1.35, 1.35)));
      }
      if (lampsOn) for (const sx of [-1, 1]) {
        lamp(headLamps, nHead++, sx * 0.13, 0.13, BUS_LEN / 2 + 0.004);
        lamp(tailLamps, nTail++, sx * 0.15, 0.16, -BUS_LEN / 2 - 0.004);
      }
    } else if (car.type === "moto") {
      base.multiply(part.makeRotationZ(car.lean || 0)); // 기울기는 바퀴 닿는 땅을 축으로
      motoBody.setMatrixAt(nMoto, base);
      rider.setMatrixAt(nMoto, base);
      helmet.setMatrixAt(nMoto, base);
      deliveryBox.setMatrixAt(nMoto, base);
      if (car.colorSlot !== nMoto) {
        motoBody.setColorAt(nMoto, new THREE.Color(MOTO_COLORS[car.index % MOTO_COLORS.length]));
        rider.setColorAt(nMoto, new THREE.Color(MOTO_JACKETS[car.index % MOTO_JACKETS.length]));
        helmet.setColorAt(nMoto, new THREE.Color(MOTO_HELMETS[car.index % MOTO_HELMETS.length]));
        [motoBody, rider, helmet].forEach((mesh) => { mesh.instanceColor.needsUpdate = true; });
        car.colorSlot = nMoto;
      }
      for (const wz of [0.125, -0.11]) {
        m.multiplyMatrices(base, part.makeTranslation(0, 0.05, wz));
        wheels.setMatrixAt(nW++, m.multiply(sc.makeScale(0.6, 1.1, 1.1)));
      }
      if (lampsOn) {
        lamp(headLamps, nHead++, 0, 0.2, 0.142);
        lamp(tailLamps, nTail++, 0, 0.2, -0.218);
      }
      nMoto++;
    } else {
      body.setMatrixAt(nCar, m.multiplyMatrices(base, part.makeTranslation(0, 0.1, 0)));
      cabin.setMatrixAt(nCar, m.multiplyMatrices(base, part.makeTranslation(0, 0.195, -0.04)));
      if (body.instanceColor && car.colorSlot !== nCar) {
        body.setColorAt(nCar, new THREE.Color(CAR_COLORS[car.index % CAR_COLORS.length]));
        car.colorSlot = nCar;
        body.instanceColor.needsUpdate = true;
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        wheels.setMatrixAt(nW++, m.multiplyMatrices(base, part.makeTranslation(sx * (CAR_WID / 2 - 0.01), 0.045, sz * 0.26)));
      }
      if (lampsOn) for (const sx of [-1, 1]) {
        lamp(headLamps, nHead++, sx * 0.11, 0.105, CAR_LEN / 2 + 0.004);
        lamp(tailLamps, nTail++, sx * 0.12, 0.115, -CAR_LEN / 2 - 0.004);
      }
      nCar++;
    }
    nAll++;
  });
  body.count = cabin.count = nCar;
  shadow.count = nAll;
  wheels.count = nW;
  buses.forEach((mesh, k) => { mesh.count = nBus[k]; });
  motoBody.count = rider.count = helmet.count = deliveryBox.count = nMoto;
  headLamps.count = nHead;
  tailLamps.count = nTail;
  beams.count = lampsOn ? nAll : 0;
  carMeshes.all.forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
}

// ════════════════════════════════════════════════════════════════════════════
// ── 걷는 행인: 캐릭터 주변 보도 위를 오가는 사람들(몸통·머리·팔다리를 종류별 인스턴스 하나로) ──
// 보도를 만들 때 남겨 둔 보도 중앙선(pedPaths)을 따라 걷다가 끝에서 돌아서고, 멀어지면 캐릭터 근처 보도로
// 다시 보낸다. 그중 몇 명은 "수상한 사람"(검은 코트·모자·선글라스) — 캐릭터가 다가가면 멈춰 서서 쳐다본다
// (안내·이벤트는 나중에 따로 만든다). 부담이 크면 PED_COUNT를 줄이거나 0으로 두면 된다.
// ════════════════════════════════════════════════════════════════════════════
const PED_COUNT = 24;
const PED_SUSPICIOUS = 2; // 위 인원 중 수상한 사람 수
const PED_SPAWN_MAX = 30;
const PED_DESPAWN = 42;
const SUSPICIOUS_WATCH_RANGE = 3.2; // 이 안으로 오면 멈춰 서서 캐릭터를 쳐다본다
const PED_SHIRTS = [0x2f6db5, 0xd94d4d, 0xf2c14e, 0x3a9d5d, 0xf2f2f2, 0x6b4fa3, 0xe58b3a, 0x222831, 0x8fb8de];
const PED_PANTS = [0x2b3442, 0x3b4f7a, 0x1d1f22, 0x6b5b4b, 0x5a6470];
const PED_SKIN = [0xf1c9a5, 0xe0b088, 0xd29b74];
const SUSPICIOUS_COAT = 0x2e2a27;
const SUSPICIOUS_PANTS = 0x18191b;
// 아이 행인(등하교 시간에 학교 근처): 조금 작고 밝은 옷, 책가방
const KID_SCALE = 0.78;
const KID_SHIRTS = [0xffd23f, 0xff7aa8, 0x6cc4ff, 0x7bd389, 0xffa24c, 0xb08cff];
const KID_PANTS = [0x2b59c3, 0x34495e, 0x8e44ad, 0x1f6f8b];
const KID_PACKS = [0xe8483b, 0x2f80ed, 0xf2c94c, 0x27ae60, 0xff6f91];
// 시간대가 바뀌어 사람·차를 줄일 때 눈앞에서 갑자기 사라지지 않게: 카메라 뒤쪽이거나 충분히 멀 때만 치운다
function safeToHide(x, z) {
  const cp = character.position;
  const dx = x - cp.x, dz = z - cp.z;
  const d = Math.hypot(dx, dz);
  if (d > 24) return true;
  return d > 4 && dx * -Math.sin(camYaw) + dz * -Math.cos(camYaw) < 0;
}
// 시간대별 차 수(최대 대비) — 한밤·새벽엔 한산하고 버스는 0~5시에 안 다닌다(배달 오토바이는 밤에도 다닌다)
function carDensity(h) {
  if (h < 5) return 0.35;
  if (h < 6.5) return 0.6;
  if (h >= 22) return 0.7;
  return 1;
}
// 시간대별 행인 수(최대 인원 대비) — 출근·등교(7~9시)와 저녁(17~20시)이 가장 붐비고 새벽엔 드물다
function pedDensity(h) {
  if (h < 5) return 0.12;
  if (h < 7) return 0.35;
  if (h < 9) return 1;
  if (h < 12) return 0.7;
  if (h < 14) return 0.85;
  if (h < 17) return 0.75;
  if (h < 20) return 1;
  if (h < 22) return 0.55;
  return 0.3;
}
// 시간대별로 사람이 몰리는 곳: 등하교 시간엔 학교, 저녁엔 마트·편의점 — { pts: [[x,z]...](월드), kids }
let pedHotspots = null;
function pedSpawnTargets(h) {
  if (!pedHotspots) {
    const at = (types) => PLACES.filter((p) => types.includes(p.type)).map((p) => [p.x * WORLD_SCALE, p.z * WORLD_SCALE]);
    pedHotspots = { school: at(["학교"]), mart: at(["중형마트", "대형마트", "마트", "편의점"]) };
  }
  if ((h >= 7 && h < 9.5) || (h >= 13 && h < 16.5)) return { pts: pedHotspots.school, kids: true };
  if (h >= 16.5 && h < 20.5) return { pts: pedHotspots.mart, kids: false };
  return null;
}
const pedPaths = []; // { pts: [[x,z]...], cum, len } — 월드 좌표
let peds = [];
let pedMeshes = null;
let pedRespawnTimer = 0;

function pedColors(ped) {
  const slot = ped.slot;
  const skin = new THREE.Color(PED_SKIN[(slot * 7) % PED_SKIN.length]);
  if (ped.type === "suspicious") {
    return { shirt: new THREE.Color(SUSPICIOUS_COAT), pants: new THREE.Color(SUSPICIOUS_PANTS), skin };
  }
  if (ped.kid) {
    const v = ped.look || 0;
    return { shirt: new THREE.Color(KID_SHIRTS[v % KID_SHIRTS.length]), pants: new THREE.Color(KID_PANTS[(v * 3) % KID_PANTS.length]), skin, pack: new THREE.Color(KID_PACKS[(v * 5) % KID_PACKS.length]) };
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
  const y = path.ys ? path.ys[k] + (path.ys[k + 1] - path.ys[k]) * t : SIDEWALK_TOP_Y; // 보도가 내려앉은 곳은 낮게
  return { k, x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, y, tx: (b[0] - a[0]) / segLen, tz: (b[1] - a[1]) / segLen };
}

function buildPedestrians() {
  peds = [];
  pedMeshes = null;
  pedNearCache.clear();
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
  // 아이 행인의 책가방(등 뒤)
  const packGeo = new THREE.BoxGeometry(0.1, 0.12, 0.05);
  pedMeshes = {
    torso: mk(torsoGeo, 0xffffff, PED_COUNT),
    head: mk(headGeo, 0xffffff, PED_COUNT),
    legs: mk(legGeo, 0xffffff, PED_COUNT * 2),
    arms: mk(armGeo, 0xffffff, PED_COUNT * 2),
    hat: mk(hatGeo, 0x1b1c1f, nSus),
    brim: mk(brimGeo, 0x1b1c1f, nSus),
    coat: mk(coatGeo, SUSPICIOUS_COAT, nSus),
    shades: mk(shadesGeo, 0x050505, nSus),
    pack: mk(packGeo, 0xffffff, PED_COUNT),
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

// 보도 중앙선 하나의 경계 상자(빠른 거리 판정용)
function pathBBox(path) {
  if (!path.bb) {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    path.pts.forEach(([px, pz]) => { x0 = Math.min(x0, px); x1 = Math.max(x1, px); z0 = Math.min(z0, pz); z1 = Math.max(z1, pz); });
    path.bb = [x0, z0, x1, z1];
  }
  return path.bb;
}
const pedNearCache = new Map();
function pedPathsNear(x, z, r) {
  const key = `${x.toFixed(2)},${z.toFixed(2)},${r}`;
  if (!pedNearCache.has(key)) {
    pedNearCache.set(key, pedPaths.filter((path) => {
      const [x0, z0, x1, z1] = pathBBox(path);
      return x >= x0 - r && x <= x1 + r && z >= z0 - r && z <= z1 + r;
    }));
  }
  return pedNearCache.get(key);
}

function spawnPed(ped) {
  const cp = character.position;
  // 지금 시간에 사람이 몰리는 곳(학교·마트)이 가까이 있으면 절반 넘게는 그 근처 보도에 내보낸다
  const targets = ped.type === "suspicious" ? null : pedSpawnTargets(worldHour);
  const near = targets ? targets.pts.filter(([x, z]) => Math.hypot(x - cp.x, z - cp.z) < PED_SPAWN_MAX * 1.4) : [];
  const hot = near.length && Math.random() < 0.6 ? near[Math.floor(Math.random() * near.length)] : null;
  const hotPaths = hot ? pedPathsNear(hot[0], hot[1], 9) : null;
  const pool = hotPaths && hotPaths.length ? hotPaths : pedPaths;
  for (let attempt = 0; attempt < 30; attempt++) {
    const path = pool[Math.floor(Math.random() * pool.length)];
    const d = Math.random() * path.len;
    const q = pointAlongPolyline(path.pts, d);
    if (Math.hypot(q.x - cp.x, q.z - cp.z) > PED_SPAWN_MAX * (hot ? 1.3 : 1)) continue;
    if (hot && attempt < 20 && Math.hypot(q.x - hot[0], q.z - hot[1]) > 9) continue;
    // 아이: 등하교 시간 학교 근처면 대부분, 낮 시간 다른 곳에도 가끔
    const h = worldHour;
    const kid = ped.type !== "suspicious" && ((hot && targets.kids && Math.random() < 0.75) || (h >= 9 && h < 19 && Math.random() < 0.12));
    Object.assign(ped, {
      active: true, path, d, dir: Math.random() < 0.5 ? 1 : -1, x: q.x, z: q.z,
      speed: ped.type === "suspicious" ? 0.4 + Math.random() * 0.2 : kid ? 0.5 + Math.random() * 0.35 : 0.55 + Math.random() * 0.45,
      lateral: (Math.random() - 0.5) * 0.24, k: 0, kid, look: Math.floor(Math.random() * 60), colorSlot: -1, packSlot: -1,
    });
    return true;
  }
  return false;
}

function updatePedestrians(dt) {
  if (!pedMeshes || !character) return;
  const cp = character.position;
  pedRespawnTimer += dt;
  if (pedRespawnTimer > 0.6) {
    pedRespawnTimer = 0;
    const normalSlots = peds.filter((q) => q.type !== "suspicious").length;
    const allowed = Math.round(normalSlots * pedDensity(worldHour));
    peds.forEach((ped) => {
      const dist = Math.hypot(ped.x - cp.x, ped.z - cp.z);
      if (ped.type !== "suspicious" && ped.slot >= allowed) {
        // 지금 시간엔 이만큼 다니지 않는다 — 안 보이는 사람부터 조용히 사라진다(눈앞에서 갑자기 없어지지 않게)
        if (ped.active && safeToHide(ped.x, ped.z)) ped.active = false;
        return;
      }
      if (!ped.active || dist > PED_DESPAWN) {
        ped.active = false;
        spawnPed(ped);
      }
    });
  }
  const { torso, head, legs, arms, hat, brim, coat, shades, shadow, pack } = pedMeshes;
  const m = new THREE.Matrix4(), base = new THREE.Matrix4(), part = new THREE.Matrix4(), rot = new THREE.Matrix4();
  const kidScale = new THREE.Matrix4().makeScale(KID_SCALE, KID_SCALE, KID_SCALE);
  let nk = 0;
  const y0 = SIDEWALK_TOP_Y;
  let n = 0, ns = 0;
  peds.forEach((ped) => {
    if (!ped.active) return;
    const path = ped.path;
    const toCharX = cp.x - ped.x, toCharZ = cp.z - ped.z;
    const charDist = Math.hypot(toCharX, toCharZ);
    // 수상한 사람: 캐릭터가 다가오면 멈춰 서서 쳐다본다
    const watching = ped.type === "suspicious" && charDist < SUSPICIOUS_WATCH_RANGE && !currentErrand;
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
    base.makeRotationY(Math.atan2(fx, fz)).setPosition(ped.x, (q.y != null ? q.y : y0) + bob, ped.z);
    if (ped.kid) base.multiply(kidScale);
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
    if (ped.kid) {
      pack.setMatrixAt(nk, m.multiplyMatrices(base, part.makeTranslation(0, 0.255, -0.06)));
      if (ped.packSlot !== nk) {
        pack.setColorAt(nk, pedColors(ped).pack);
        if (pack.instanceColor) pack.instanceColor.needsUpdate = true;
        ped.packSlot = nk;
      }
      nk++;
    }
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
  pack.count = nk;
  [torso, head, legs, arms, hat, brim, coat, shades, shadow, pack].forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
}

// ════════════════════════════════════════════════════════════════════════════
// ── 가게 입간판: 편의점·카페·식당·마트·학원 앞 보도에 "영업 중 / 준비 중" ──
// 가게 자리에서 가장 가까운 보도(행인이 걷는 보도 중앙선)를 찾아 가게 쪽 가장자리에 A자 입간판을 세운다.
// 영업시간(OPEN_HOURS)에 맞춰 초록 "영업 중"(밤에도 환하게 빛남) / 회색 "준비 중"으로 바뀐다 — 모양은 하나라
// 인스턴스 두 개(드로우콜 2)뿐이다.
// ════════════════════════════════════════════════════════════════════════════
const SHOP_SIGN_W = 0.15, SHOP_SIGN_H = 0.23, SHOP_SIGN_TILT = 0.2; // 월드 단위 / 라디안(A자로 벌어진 각)
let shopSigns = null; // { open, closed, list: [{ place, matrix }] }
let shopSignsListening = false;

function makeShopSignTexture(open) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 192;
  const g = c.getContext("2d");
  g.fillStyle = "#4a3b30"; // 나무 테두리
  g.fillRect(0, 0, 128, 192);
  g.fillStyle = open ? "#1f9d55" : "#7b828a";
  g.fillRect(9, 9, 110, 174);
  g.fillStyle = "#ffffff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "bold 40px sans-serif";
  g.fillText(open ? "영업" : "준비", 64, 56);
  g.fillText("중", 64, 102);
  g.fillRect(26, 130, 76, 3);
  g.font = "bold 22px sans-serif";
  g.fillText(open ? "OPEN" : "CLOSED", 64, 157);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
function shopSignGeometry() {
  const parts = [];
  [1, -1].forEach((side) => {
    const g = new THREE.BoxGeometry(SHOP_SIGN_W, SHOP_SIGN_H, 0.008);
    g.translate(0, SHOP_SIGN_H / 2, 0);
    g.rotateX(-side * SHOP_SIGN_TILT); // 위끝이 가운데로 모여 A자가 되게
    g.translate(0, 0, side * SHOP_SIGN_H * Math.sin(SHOP_SIGN_TILT));
    parts.push(g);
  });
  return mergeGeometries(parts);
}
// 보도 중앙선(pedPaths) 위에서 (x, z)에 가장 가까운 점 — maxDist(월드)보다 멀면 null.
// reject(x, z)가 참인 자리(예: 건물 바닥 안)는 건너뛰고 그 구간에서 가장 가까운 다른 자리를 고른다.
function nearestPedPathPoint(x, z, maxDist, reject = null) {
  let best = null, bd = maxDist;
  for (const path of pedPaths) {
    const [x0, z0, x1, z1] = pathBBox(path);
    if (x < x0 - bd || x > x1 + bd || z < z0 - bd || z > z1 + bd) continue;
    const pts = path.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], az = pts[i][1];
      const dx = pts[i + 1][0] - ax, dz = pts[i + 1][1] - az;
      const L2 = dx * dx + dz * dz;
      if (L2 < 1e-10) continue;
      const t0 = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
      for (const t of reject ? [t0, 0, 0.25, 0.5, 0.75, 1] : [t0]) {
        const px = ax + dx * t, pz = az + dz * t;
        const d = Math.hypot(x - px, z - pz);
        if (d >= bd || (reject && reject(px, pz))) continue;
        const L = Math.sqrt(L2);
        bd = d;
        best = { x: px, z: pz, tx: dx / L, tz: dz / L, w: path.w || 0.3, dist: d };
      }
    }
  }
  return best;
}
function buildShopSigns() {
  shopSigns = null;
  const list = [];
  PLACES.forEach((place) => {
    if (!SHOP_TYPES.has(place.type)) return;
    const px = place.x * WORLD_SCALE, pz = place.z * WORLD_SCALE;
    // 건물 바닥(대략의 가로·세로·회전) 안에 놓이지 않게 — 보도와 건물이 겹쳐 있는 곳도 있다
    const style = TYPE_STYLE[place.type] || TYPE_STYLE["기타"];
    const fo = BUILDING_FOOTPRINT_OVERRIDE[place.id];
    const halfW = ((fo ? fo[0] : style.w) * WORLD_SCALE) / 2 + 0.06;
    const halfD = ((fo ? fo[1] : style.d) * WORLD_SCALE) / 2 + 0.06;
    const rot = place.rotationDeg != null ? THREE.MathUtils.degToRad(place.rotationDeg) : place.diagonal ? Math.PI / 4 : 0;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const inside = (qx, qz) => insideRect(qx, qz, px, pz, cos, sin, halfW, halfD);
    // 길이 지나가서 보도가 내려앉은 자리(횡단 구간)도 피한다
    const q = nearestPedPathPoint(px, pz, 9, (qx, qz) => inside(qx, qz) || groundHeightAt(qx, qz) < SIDEWALK_TOP_Y - 0.01);
    if (!q) return;
    // 가게 쪽(보도 바깥 가장자리)으로 비켜 세우고, 앞뒤 판이 보도를 오가는 사람을 보게 한다
    let nx = -q.tz, nz = q.tx;
    if (nx * (px - q.x) + nz * (pz - q.z) < 0) { nx = -nx; nz = -nz; }
    let off = Math.min(q.w * 0.26, q.dist * 0.8);
    if (inside(q.x + nx * off, q.z + nz * off)) off = 0;
    const x = q.x + nx * off, z = q.z + nz * off;
    const sg = { place, matrix: new THREE.Matrix4(), fitted: false };
    setSignPose(sg, x, z, q.tx, q.tz);
    list.push(sg);
  });
  if (!list.length) return;
  const geo = shopSignGeometry();
  const mk = (mat) => {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  };
  shopSigns = {
    open: mk(new THREE.MeshBasicMaterial({ map: makeShopSignTexture(true) })), // 조명과 상관없이 환하게(밤에 켜진 간판처럼)
    closed: mk(new THREE.MeshStandardMaterial({ map: makeShopSignTexture(false), roughness: 0.8 })),
    list,
  };
  updateShopSigns(worldHour);
  if (!shopSignsListening) {
    shopSignsListening = true;
    timeListeners.push((h) => updateShopSigns(h));
  }
}
// ── 가게 셔터: 문 닫은 시간엔 가게 1층 앞면(입간판이 있는 쪽)에 셔터가 내려와 있다 ──
// 건물 모델이 불러와질 때 입간판 자리에서 건물 쪽으로 광선을 쏴서 1층 벽(가게 앞면)을 찾고, 그 벽이 좌우로
// 이어지는 만큼(최대 약 8m) 셔터 판을 붙인다. 큰 마트·학원은 셔터를 달지 않는다.
const SHUTTER_TYPES = new Set(["편의점", "카페", "식당", "중형마트", "마트"]);
const SHUTTER_H = 0.42; // 월드(약 2.8m) — 1층 가게 앞
let shutterMaterial = null;
let shuttersListening = false;
const shopShutters = new Map(); // entry → 셔터 메시
function getShutterMaterial() {
  if (shutterMaterial) return shutterMaterial;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#9aa0a6";
  g.fillRect(0, 0, 64, 128);
  for (let y = 0; y < 128; y += 8) { // 가로 골(셔터 살)
    g.fillStyle = "#bfc4c9";
    g.fillRect(0, y, 64, 3);
    g.fillStyle = "#767c83";
    g.fillRect(0, y + 6, 64, 2);
  }
  g.fillStyle = "#5d6268";
  g.fillRect(0, 122, 64, 6); // 아래 손잡이 띠
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  shutterMaterial = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.4, side: THREE.DoubleSide });
  return shutterMaterial;
}
const _shutterRay = new THREE.Raycaster();
const _rayO = new THREE.Vector3(), _rayD = new THREE.Vector3(), _rayDown = new THREE.Vector3(0, -1, 0);
// 가게 건물 모델이 불러와지면: ① 입간판이 실제 건물 안·밑에 들어가 있으면 가장 가까운 열린 보도로 옮기고
// (건물 크기를 모델을 받기 전엔 몰라서 처음엔 대략의 크기로 정해 둔다) ② 문 닫은 시간에 내려올 셔터를 붙인다.
function fitShopToModel(entry) {
  const model = entry.loadedModel;
  if (!model || !shopSigns || !SHOP_TYPES.has(entry.place.type)) return;
  const sg = shopSigns.list.find((q) => q.place === entry.place);
  if (!sg) return;
  entry.group.updateMatrixWorld(true);
  const baseY = entry.group.position.y;
  const box = new THREE.Box3().setFromObject(model);
  // 위에서 내려다봐서 바닥보다 높은 면(지붕·벽 위)이 있으면 건물 안·밑이다
  let rays = 0;
  const blocked = (x, z) => {
    if (x < box.min.x || x > box.max.x || z < box.min.z || z > box.max.z) return false;
    rays++;
    _shutterRay.set(_rayO.set(x, box.max.y + 0.5, z), _rayDown);
    _shutterRay.far = box.max.y - baseY + 1;
    return _shutterRay.intersectObject(model, true).some((hh) => hh.point.y > baseY + 0.25);
  };
  if (!sg.fitted) {
    sg.fitted = true;
    if (blocked(sg.x, sg.z)) {
      const cands = [];
      pedPathsNear(entry.px, entry.pz, 9).forEach((path) => {
        const pts = path.pts;
        for (let i = 0; i < pts.length - 1; i += 2) {
          if (path.ys && path.ys[i] < SIDEWALK_TOP_Y - 0.01) continue; // 내려앉은 보도(길 건너는 자리)는 빼고
          const a = pts[i], b = pts[i + 1];
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
          const d = Math.hypot(a[0] - entry.px, a[1] - entry.pz);
          if (d < 9) cands.push({ x: a[0], z: a[1], d, tx: (b[0] - a[0]) / L, tz: (b[1] - a[1]) / L, w: path.w || 0.3 });
        }
      });
      cands.sort((p, q) => p.d - q.d);
      for (const c of cands) {
        if (rays > 40) break; // 광선은 몇십 개까지만(불러올 때 끊기지 않게)
        if (blocked(c.x, c.z)) continue;
        let nx = -c.tz, nz = c.tx;
        if (nx * (entry.px - c.x) + nz * (entry.pz - c.z) < 0) { nx = -nx; nz = -nz; }
        let off = c.w * 0.26;
        if (blocked(c.x + nx * off, c.z + nz * off)) off = 0;
        setSignPose(sg, c.x + nx * off, c.z + nz * off, c.tx, c.tz);
        updateShopSigns(worldHour);
        break;
      }
    }
  }
  addShopShutter(entry, sg, baseY);
}
function addShopShutter(entry, sg, baseY) {
  const place = entry.place;
  const model = entry.loadedModel;
  if (entry.shutter || !SHUTTER_TYPES.has(place.type)) return;
  // 입간판에서 보도를 가로질러 건물 쪽으로 광선을 쏴서 1층 벽(가게 앞면)을 찾는다
  let dx = -sg.tz, dz = sg.tx;
  if (dx * (entry.px - sg.x) + dz * (entry.pz - sg.z) < 0) { dx = -dx; dz = -dz; }
  const y = baseY + 0.2; // 1층 눈높이쯤(약 1.3m)
  const cast = (ox, oz, far) => {
    _shutterRay.set(_rayO.set(ox, y, oz), _rayD.set(dx, 0, dz));
    _shutterRay.far = far;
    return _shutterRay.intersectObject(model, true)[0] || null;
  };
  // 가게 앞면은 입간판 바로 뒤(보도 가장자리)에 있어야 한다 — 멀리 있는 벽이면 다른 면이라 셔터를 달지 않는다
  const main = cast(sg.x, sg.z, 1);
  if (!main || !main.face) return;
  // 벽의 바깥 방향(수평) — 광선과 마주 보게
  const n = main.face.normal.clone().transformDirection(main.object.matrixWorld);
  n.y = 0;
  if (n.lengthSq() < 0.25) return; // 바닥·지붕처럼 누운 면이면 그만
  n.normalize();
  if (n.x * dx + n.z * dz > 0) n.multiplyScalar(-1);
  const tx = -n.z, tz = n.x; // 벽을 따라가는 방향
  // 좌우로 같은 벽이 이어지는 만큼만(광선 길이가 비슷하면 같은 벽)
  const reach = (sign) => {
    let ok = 0;
    for (let k = 1; k <= 4; k++) {
      const o = k * 0.15 * sign;
      const hh = cast(sg.x + tx * o, sg.z + tz * o, main.distance + 0.3);
      if (!hh || Math.abs(hh.distance - main.distance) > 0.08) break;
      ok = k * 0.15;
    }
    return ok;
  };
  const left = reach(-1), right = reach(1);
  const w = Math.min(1.2, left + right + 0.3);
  if (w < 0.3) return;
  const mid = (right - left) / 2; // 가운데를 이어지는 쪽으로 옮긴다
  const p = main.point;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, SHUTTER_H), getShutterMaterial());
  // group은 높이만 옮겨져 있어서(가로 위치 0) 월드 XZ를 그대로 쓴다. 바닥(0)부터 1층 높이까지, 벽에서 살짝 띄워서
  mesh.position.set(p.x + tx * mid + n.x * 0.012, SHUTTER_H / 2, p.z + tz * mid + n.z * 0.012);
  mesh.rotation.y = Math.atan2(n.x, n.z);
  mesh.receiveShadow = true;
  mesh.visible = !placeIsOpen(place, worldHour);
  entry.group.add(mesh);
  entry.shutter = mesh;
  shopShutters.set(entry, mesh);
  if (!shuttersListening) {
    shuttersListening = true;
    timeListeners.push((h) => shopShutters.forEach((m, e) => { m.visible = !placeIsOpen(e.place, h); }));
  }
}
function removeShopShutter(entry) {
  if (!entry.shutter) return;
  entry.group.remove(entry.shutter);
  entry.shutter.geometry.dispose();
  entry.shutter = null;
  shopShutters.delete(entry);
}
// 입간판 자리·방향(보도 진행 방향 tx, tz) — 앞뒤 판이 보도를 오가는 사람을 보게
function setSignPose(sg, x, z, tx, tz) {
  Object.assign(sg, { x, z, tx, tz });
  sg.matrix.makeRotationY(Math.atan2(tx, tz)).setPosition(x, groundHeightAt(x, z), z);
}
function updateShopSigns(h) {
  if (!shopSigns) return;
  let no = 0, nc = 0;
  shopSigns.list.forEach((sg) => {
    if (placeIsOpen(sg.place, h)) shopSigns.open.setMatrixAt(no++, sg.matrix);
    else shopSigns.closed.setMatrixAt(nc++, sg.matrix);
  });
  shopSigns.open.count = no;
  shopSigns.closed.count = nc;
  shopSigns.open.instanceMatrix.needsUpdate = true;
  shopSigns.closed.instanceMatrix.needsUpdate = true;
}

// ════════════════════════════════════════════════════════════════════════════
// ── 어린이 보호구역: 차는 평소의 절반 속도(시속 30km 아래)로 달린다 ──
// · 보호구역에 들어서면 안내 한마디
// · 보호구역 입구마다 "어린이 보호구역 + 지금 속도" 전광판 — 다가오는 차의 속도를 km/h로 보여 주고,
//   30 이하면 초록 "감사합니다", 넘으면 빨강 "천천히!"(차는 보호구역에 들어서며 속도를 줄인다)
// ════════════════════════════════════════════════════════════════════════════
const SCHOOL_SPEED_FACTOR = 0.5;
const kmhOf = (speed) => Math.round((speed / CAR_MAX_SPEED) * 50); // 평소 최고 속도 = 시속 50km로 보고 환산
const SCHOOL_BOARD_W = 0.26, SCHOOL_BOARD_H = 0.26, SCHOOL_BOARD_POLE_H = 0.74;
let schoolZoneRoads = []; // { i, pts(월드), half(월드) }
let schoolBoards = []; // { x, z, fin: [x, z](들어오는 차 방향), ctx, tex, shown }
let inSchoolZone = false, schoolToastCooldown = 0, schoolBoardTimer = 0;

function distToPolyline2(pts, x, z) {
  let bd = Infinity;
  for (let i = 0; i < pts.length - 1; i++) bd = Math.min(bd, distToSegment(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  return bd;
}
function drawSchoolBoard(b, kmh) {
  const g = b.ctx;
  g.fillStyle = "#ffd200";
  g.fillRect(0, 0, 256, 74);
  g.fillStyle = "#151515";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "bold 33px sans-serif";
  g.fillText("어린이 보호구역", 128, 39);
  g.fillStyle = "#0b0b0d";
  g.fillRect(0, 74, 256, 182);
  if (kmh == null) {
    // 다가오는 차가 없으면 제한 속도 30 표지
    g.fillStyle = "#ffffff";
    g.beginPath(); g.arc(128, 162, 64, 0, Math.PI * 2); g.fill();
    g.lineWidth = 13; g.strokeStyle = "#e0262b";
    g.beginPath(); g.arc(128, 162, 57, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#151515";
    g.font = "bold 62px sans-serif";
    g.fillText("30", 128, 166);
  } else {
    const ok = kmh <= 30;
    g.fillStyle = ok ? "#3dff73" : "#ff3b30";
    g.font = "bold 96px monospace";
    g.fillText(String(kmh), 112, 146);
    g.font = "bold 24px sans-serif";
    g.fillText("km/h", 212, 168);
    g.font = "bold 30px sans-serif";
    g.fillText(ok ? "감사합니다" : "천천히!", 128, 224);
  }
  b.tex.needsUpdate = true;
}
function buildSchoolZoneBoards() {
  schoolZoneRoads = [];
  schoolBoards = [];
  const W = WORLD_SCALE;
  ROAD_SEGMENTS.forEach((seg, i) => {
    if (roadLook(seg).kind !== "school") return;
    schoolZoneRoads.push({ i, seg, raw: roadPolyline(seg), pts: roadPolyline(seg).map(([x, z]) => [x * W, z * W]), half: (seg.width / 2 + (seg.sidewalk || 0) + 1) * W });
  });
  if (!schoolZoneRoads.length) return;
  const poleGeo = new THREE.CylinderGeometry(0.011, 0.013, SCHOOL_BOARD_POLE_H, 8);
  poleGeo.translate(0, SCHOOL_BOARD_POLE_H / 2, 0);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 0.5, metalness: 0.5 });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.7 });
  const boardGeo = new THREE.BoxGeometry(SCHOOL_BOARD_W, SCHOOL_BOARD_H, 0.02);
  schoolZoneRoads.forEach((zr) => {
    const seg = zr.seg;
    ["a", "b"].forEach((which) => {
      const p = seg[which];
      // 다른 보호구역 도로와 이어진 끝은 입구가 아니다
      const shared = schoolZoneRoads.some((o) => o !== zr && ["a", "b"].some((w2) => Math.hypot(o.seg[w2][0] - p[0], o.seg[w2][1] - p[1]) < JOIN_RAW));
      if (shared) return;
      const L = polylineLength(zr.raw);
      if (L < 24) return;
      const q = pointAlongPolyline(zr.raw, which === "a" ? 14 : L - 14); // 입구에서 14m 안쪽
      const fin = which === "a" ? [q.dirX, q.dirZ] : [-q.dirX, -q.dirZ]; // 보호구역으로 들어오는 차의 방향
      const r = [-fin[1], fin[0]]; // 그 차의 오른쪽
      const side = seg.width / 2 + Math.min(seg.sidewalk || 1.5, 4) * 0.55;
      const x = (q.x + r[0] * side) * W, z = (q.z + r[1] * side) * W;
      const y = groundHeightAt(x, z);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const b = { x, z, fin, ctx: canvas.getContext("2d"), tex, shown: undefined };
      drawSchoolBoard(b, null);
      b.shown = null;
      const yaw = Math.atan2(-fin[0], -fin[1]); // 판 앞면(+Z)이 다가오는 차를 보게
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, y, z);
      // 앞면(+Z)만 전광판 그림, 나머지 면은 어두운 뒷판
      const board = new THREE.Mesh(boardGeo, [backMat, backMat, backMat, backMat, new THREE.MeshBasicMaterial({ map: tex }), backMat]);
      board.position.set(x - fin[0] * 0.016, y + SCHOOL_BOARD_POLE_H - SCHOOL_BOARD_H / 2 - 0.01, z - fin[1] * 0.016);
      board.rotation.y = yaw;
      pole.castShadow = board.castShadow = true;
      scene.add(pole, board);
      schoolBoards.push(b);
    });
  });
}
function updateSchoolZone(dt) {
  if (!schoolZoneRoads.length || !character) return;
  schoolToastCooldown = Math.max(0, schoolToastCooldown - dt);
  schoolBoardTimer += dt;
  if (schoolBoardTimer < 0.25) return;
  schoolBoardTimer = 0;
  const cp = character.position;
  const inside = schoolZoneRoads.some((zr) => distToPolyline2(zr.pts, cp.x, cp.z) < zr.half);
  if (inside && !inSchoolZone && schoolToastCooldown <= 0) {
    showToast("🏫 어린이 보호구역이에요! 여기선 차들이 시속 30km 아래로 천천히 달려요", 3400);
    schoolToastCooldown = 45;
  }
  inSchoolZone = inside;
  schoolBoards.forEach((b) => {
    if (Math.hypot(b.x - cp.x, b.z - cp.z) > 30) return; // 멀리 있는 전광판은 다시 그리지 않는다
    let best = null, bd = 7;
    cars.forEach((car) => {
      if (!car.active) return;
      const dx = b.x - car.x, dz = b.z - car.z;
      const d = Math.hypot(dx, dz);
      if (d > bd || dx * car.fx + dz * car.fz <= 0 || car.fx * b.fin[0] + car.fz * b.fin[1] < 0.5) return; // 전광판 쪽으로 들어오는 차만
      best = car;
      bd = d;
    });
    const kmh = best ? Math.max(3, kmhOf(best.speed)) : null;
    if (kmh !== b.shown) {
      b.shown = kmh;
      drawSchoolBoard(b, kmh);
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ── 골목에서 갑자기 나오는 차(미니 이벤트) ──
// 큰길 보도를 걷다가 골목(폭 10m 이하 길)이 큰길과 만나는 입구로 다가가면, 가끔 골목 안에서 차가 나온다.
// "멈춰서 좌우를 살펴요!" 안내가 뜨고 — 멈춰 서서 차가 지나가길 기다리면 칭찬(+용돈), 그대로 걸어 들어가면 차가
// "빵!" 하고 급정거한다. 나온 차는 큰길로 우회전해서 다른 차들 사이에 섞여 달려간다(차 한 대 자리를 이 이벤트용으로
// 따로 둔다). 신호등이 있는 입구는 빼고, 한 번 차가 나온 입구는 3분 동안 쉰다.
// ════════════════════════════════════════════════════════════════════════════
const ALLEY_TRIGGER_DIST = 4.6; // 월드 — 입구(아이가 지나는 자리)에서 이만큼 안으로 다가오면
const ALLEY_CAR_START_RAW = 24; // 차가 출발하는 자리: 큰길 보도에서 골목 안쪽으로 이만큼(raw m)
let alleyMouths = [];
let alleyEvent = null;
let alleyCooldown = 15; // 거리 모험에 들어와서 처음 얼마 동안은 쉰다(초)
let alleyCheckTimer = 0;
let characterMoving = false;

function nearestOnRawPolyline(pts, cum, x, z) {
  let best = { dist: Infinity, s: 0, x: 0, z: 0, dx: 1, dz: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1];
    const dx = pts[i + 1][0] - ax, dz = pts[i + 1][1] - az;
    const L2 = dx * dx + dz * dz;
    if (L2 < 1e-9) continue;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
    const px = ax + dx * t, pz = az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best.dist) {
      const L = Math.sqrt(L2);
      best = { dist: d, s: cum[i] + L * t, x: px, z: pz, dx: dx / L, dz: dz / L };
    }
  }
  return best;
}
// 캐릭터가 횡단보도 위에 있는지(신호 유무 상관없이) — 그 위에서 차를 막고 있어도 경적을 울리지 않게
function characterOnCrossing() {
  if (!character) return false;
  const px = character.position.x / WORLD_SCALE, pz = character.position.z / WORLD_SCALE;
  return (roadMarkings?.crossings || []).some((c) => {
    const dx = px - c.x, dz = pz - c.z;
    return Math.abs(dx * c.hx + dz * c.hz) <= c.depth / 2 + 1 && Math.abs(dx * c.rx + dz * c.rz) <= c.half + 1;
  });
}
function buildAlleyMouths() {
  alleyMouths = [];
  if (!carRoads) return;
  carRoads.forEach((r) => {
    const seg = ROAD_SEGMENTS[r.i];
    if (roadLook(seg).kind === "walk" || r.w > 10 || r.L < ALLEY_CAR_START_RAW + 14) return;
    ["a", "b"].forEach((which) => {
      if (signalArms.has(`${r.i}:${which}`)) return; // 신호등 있는 입구는 빼기
      const E = which === "a" ? r.pts[0] : r.pts[r.pts.length - 1];
      let main = null;
      carRoads.forEach((o) => {
        if (!o.drivable || o.i === r.i || o.w < Math.max(15, r.w + 5)) return;
        const edge = nearestOnRawPolyline(o.pts, o.cum, E[0], E[1]).dist - o.w / 2;
        if (edge < 3 && (!main || edge < main.edge)) main = { r: o, edge };
      });
      if (!main) return;
      const inward = which === "a" ? 1 : -1; // s가 커지는 쪽이 골목 안쪽이면 +1
      const sE = which === "a" ? 0 : r.L;
      // 큰길 차도를 벗어나는 지점(골목 쪽으로 가며 큰길 중심선에서 반폭보다 멀어지는 곳)
      let sEdge = null;
      for (let k = 0; k <= 80; k++) {
        const sv = sE + inward * k * 0.5;
        if (sv < 0 || sv > r.L) break;
        const q = polyPointAt(r.pts, r.cum, sv);
        if (nearestOnRawPolyline(main.r.pts, main.r.cum, q.x, q.z).dist > main.r.w / 2) { sEdge = sv; break; }
      }
      if (sEdge == null) return;
      const swRaw = ROAD_SEGMENTS[main.r.i].sidewalk || 2.5;
      const sCross = sEdge + inward * swRaw * 0.5; // 큰길 보도가 골목을 가로지르는 자리(아이가 지나가는 곳)
      const sStart = sEdge + inward * (swRaw + ALLEY_CAR_START_RAW);
      if (sStart < 0 || sStart > r.L) return;
      const c = polyPointAt(r.pts, r.cum, sCross);
      alleyMouths.push({
        r, which, inward, main: main.r, sEdge, sCross, sStart, swRaw,
        lane: roadLook(seg).perDir >= 1 ? r.lanes[0] : 0, // 양방향 길이면 나가는 쪽 차로, 좁은 골목은 가운데
        cx: c.x * WORLD_SCALE, cz: c.z * WORLD_SCALE,
        ax: c.dx * inward, az: c.dz * inward, // 골목 안쪽 방향(단위 벡터)
        halfW: (r.w / 2 + 0.8) * WORLD_SCALE, halfL: (swRaw / 2 + 1) * WORLD_SCALE,
        nextOk: 0,
      });
    });
  });
}
function startAlleyEvent(mo, car) {
  const r = mo.r;
  const dir = -mo.inward; // 큰길 쪽으로
  const pose = carRoadPose(r, mo.sStart, dir, mo.lane);
  Object.assign(car, {
    active: true, mode: "alley", seg: r.i, s: mo.sStart, dir, lane: mo.lane, turn: null,
    x: pose.x, z: pose.z, fx: pose.fx, fz: pose.fz, colorSlot: -1,
    maxSpeed: CAR_MAX_SPEED * 0.85, speed: CAR_MAX_SPEED * 0.4,
    alley: { r, dir, lane: mo.lane, sTurn: mo.sEdge + mo.inward * 0.3, speedCap: CAR_MAX_SPEED * 0.62, mouth: mo },
  });
  alleyEvent = { mo, car, t: 0, still: 0, danger: false, waitT: 0 };
  mo.nextOk = clock.elapsedTime + 180;
  showToast("⚠️ 골목에서 차가 나와요! 멈춰서 좌우를 살펴요", 2800);
  playEngineRev();
}
// 골목 끝(큰길 가장자리)에 닿으면 큰길로 우회전해서 보통 차처럼 달린다
function startAlleyExitTurn(car) {
  const mo = car.alley.mouth;
  const mr = mo.main;
  const q = nearestOnRawPolyline(mr.pts, mr.cum, car.x / WORLD_SCALE, car.z / WORLD_SCALE);
  const rx = -car.fz, rz = car.fx; // 지금 진행 방향의 오른쪽
  const dir = q.dx * rx + q.dz * rz >= 0 ? 1 : -1;
  const lane = mr.lanes[mr.lanes.length - 1];
  const s1 = Math.max(0, Math.min(mr.L, q.s + dir * (lane + 3)));
  car.alley = null;
  beginTurn(car, carRoadPose(mr, s1, dir, lane), { seg: mr.i, dir, s: s1, lane });
}
function updateAlleyEvent(dt) {
  if (!alleyMouths.length || !character || !carMeshes) return;
  if (alleyEvent) { runAlleyEvent(dt); return; }
  alleyCooldown -= dt;
  alleyCheckTimer += dt;
  if (alleyCooldown > 0 || alleyCheckTimer < 0.3 || !characterMoving || currentErrand?.phase === "awaitingDialog") return;
  alleyCheckTimer = 0;
  const cp = character.position;
  const car = cars.find((c) => c.scripted);
  if (!car || (car.active && Math.hypot(car.x - cp.x, car.z - cp.z) < 16)) return; // 지난번 차가 아직 근처면 기다린다
  const now = clock.elapsedTime;
  const fx = Math.sin(character.rotation.y), fz = Math.cos(character.rotation.y);
  for (const mo of alleyMouths) {
    if (now < mo.nextOk) continue;
    const dx = mo.cx - cp.x, dz = mo.cz - cp.z;
    const d = Math.hypot(dx, dz);
    if (d > ALLEY_TRIGGER_DIST || d < 1.1) continue;
    if ((dx * fx + dz * fz) / d < 0.55) continue; // 입구 쪽으로 걸어가는 중이어야
    const along = -(dx * mo.ax + dz * mo.az); // 아이 자리의 "골목 안쪽" 성분(입구 기준)
    if (along > mo.halfL || along < -(mo.halfL + 0.5)) continue; // 이미 골목 안이거나 큰길 건너편이면 아니다
    mo.nextOk = now + 25; // 이번에 안 나와도 25초 동안은 이 입구를 다시 보지 않는다
    if (Math.random() > 0.7) continue;
    startAlleyEvent(mo, car);
    return;
  }
}
function runAlleyEvent(dt) {
  const ev = alleyEvent, car = ev.car, mo = ev.mo;
  ev.t += dt;
  const cp = character.position;
  if (!characterMoving) ev.still += dt;
  const rx = cp.x - mo.cx, rz = cp.z - mo.cz;
  const along = rx * mo.ax + rz * mo.az, across = -rx * mo.az + rz * mo.ax;
  const kidInZone = Math.abs(along) <= mo.halfL && Math.abs(across) <= mo.halfW;
  if (car.active && car.mode === "alley") {
    // 차 앞범퍼에서 아이가 지나는 자리(건널목)까지 남은 거리(월드)
    const toZone = ((mo.sCross - car.s) * car.alley.dir - (mo.swRaw / 2 + 1)) * WORLD_SCALE - car.len / 2;
    if (kidInZone && toZone < 2.3 && toZone > -car.len) {
      if (!ev.danger) {
        ev.danger = true;
        playHorn(1);
        showToast("😰 빵! 위험했어요 — 골목 앞에서는 꼭 멈춰서 좌우를 살펴요", 3200);
      }
      car.alley.speedCap = 0; // 급정거, 아이가 비킬 때까지 기다린다
      ev.waitT = 0;
    } else if (car.alley.speedCap === 0) {
      ev.waitT += dt;
      if (ev.waitT > 0.9) car.alley.speedCap = CAR_MAX_SPEED * 0.45;
    }
  } else {
    // 큰길로 나왔다(= 아이 앞을 지나갔다) — 결과
    if (!ev.danger && car.active) {
      const d = Math.hypot(cp.x - mo.cx, cp.z - mo.cz);
      if (ev.still >= 0.7 && d < 6) grantReward(500, "👍 잘 멈췄어요! 골목 앞에선 멈추고 좌우 살피기", 3000);
      else if (d < 6) showToast("골목 앞에서는 잠깐 멈춰서 차가 오는지 살펴봐요", 2800);
    }
    alleyEvent = null;
    alleyCooldown = 45;
    return;
  }
  if (ev.t > 25) { // 아이가 길을 계속 막고 서 있는 등 너무 오래 걸리면 끝낸다
    car.alley.speedCap = CAR_MAX_SPEED * 0.45;
    alleyEvent = null;
    alleyCooldown = 30;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ── 동네 소리: 소리 파일 없이 Web Audio로 그때그때 만든다 ──
// · 차 소리: 낮게 웅웅거리는 소음 — 가까이 달리는 차·버스가 많고 빠를수록 커지고 밝아진다
// · 배달 오토바이: 가까이 지나가면 "부릉" 엔진 소리(속도 따라 높낮이)
// · 낮엔 새소리, 밤엔 풀벌레 소리
// · 학교 가까이: 수업 시간(8~17시)엔 가끔 "딩동댕동" 종소리
// · 신호등 있는 횡단보도 앞: 초록불이면 "삐요삐요" 안내음, 빨간불이면 "똑…똑" 대기음
// · 경적(골목 이벤트·차도를 막고 서 있을 때)
// 상단 🔊 버튼으로 켜고 끈다(기본 켬, 이 기기에 저장). 거리 모험 화면을 떠나면 멈춘다.
// ════════════════════════════════════════════════════════════════════════════
let audioCtx = null, audioMaster = null, soundOn = true;
let trafficGain = null, trafficFilter = null, motoOsc = null, motoGain = null, motoFilter = null;
let ambientTimer = 1.5, bellTimer = 4, signalBeepTimer = 0, soundUpdateTimer = 0;
let soundBtnEl = null, soundWired = false;
const SCHOOL_BELL_NOTES = [659.25, 523.25, 587.33, 392.0, 392.0, 587.33, 659.25, 523.25]; // 미도레솔 솔레미도(딩동댕동)

function loadSoundPref() {
  try { soundOn = localStorage.getItem("roymaker-nb-sound") !== "0"; } catch (err) { soundOn = true; }
}
function audioReady() {
  return !!(audioCtx && soundOn && audioCtx.state === "running");
}
function ensureAudio() {
  if (audioCtx || !soundOn) return audioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { audioCtx = new AC(); } catch (err) { audioCtx = null; return null; }
  const ac = audioCtx;
  audioMaster = ac.createGain();
  audioMaster.gain.value = 0.8;
  audioMaster.connect(ac.destination);
  // 차 소리: 갈색 소음(낮은 소리가 많은 소음) 2초짜리를 되풀이 → 저역 필터 → 음량(차가 가까울수록 크게)
  const len = Math.floor(ac.sampleRate * 2);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const drift = data[len - 1] - data[0]; // 끝과 처음 값을 맞춰서 되풀이할 때 "딱" 소리가 안 나게
  for (let i = 0; i < len; i++) data[i] -= drift * (i / (len - 1));
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  trafficFilter = ac.createBiquadFilter();
  trafficFilter.type = "lowpass";
  trafficFilter.frequency.value = 320;
  trafficGain = ac.createGain();
  trafficGain.gain.value = 0;
  noise.connect(trafficFilter).connect(trafficGain).connect(audioMaster);
  noise.start();
  // 오토바이 엔진: 톱니파 + 빠른 떨림 → 저역 필터 → 음량(가장 가까운 오토바이 거리·속도 따라)
  motoOsc = ac.createOscillator();
  motoOsc.type = "sawtooth";
  motoOsc.frequency.value = 80;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 24;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 10;
  lfo.connect(lfoGain).connect(motoOsc.frequency);
  motoFilter = ac.createBiquadFilter();
  motoFilter.type = "lowpass";
  motoFilter.frequency.value = 650;
  motoGain = ac.createGain();
  motoGain.gain.value = 0;
  motoOsc.connect(motoFilter).connect(motoGain).connect(audioMaster);
  motoOsc.start();
  lfo.start();
  return audioCtx;
}
// 짧은 소리 하나: 주파수(끝 주파수로 미끄러짐), 파형, 시작 지연, 길이, 크기
function playTone({ freq, freqEnd = 0, type = "sine", start = 0, dur = 0.2, gain = 0.2, attack = 0.005, filter = 0 }) {
  if (!audioReady()) return;
  const ac = audioCtx;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = osc;
  if (filter) {
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filter;
    node = node.connect(f);
  }
  node.connect(g).connect(audioMaster);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}
function playBird(vol) {
  const base = 2300 + Math.random() * 1500;
  const n = 2 + Math.floor(Math.random() * 3);
  for (let k = 0; k < n; k++) {
    const f = base * (0.92 + Math.random() * 0.16);
    playTone({ freq: f, freqEnd: f * (1.25 + Math.random() * 0.3), start: k * (0.12 + Math.random() * 0.05), dur: 0.07 + Math.random() * 0.04, gain: 0.045 * vol, attack: 0.01 });
  }
}
function playCricket(vol) {
  const f = 4300 + Math.random() * 500;
  const chirps = 2 + Math.floor(Math.random() * 2);
  for (let c = 0; c < chirps; c++) {
    for (let p = 0; p < 3; p++) playTone({ freq: f, start: c * 0.34 + p * 0.045, dur: 0.035, gain: 0.025 * vol, attack: 0.004 });
  }
}
function playSchoolBell(vol) {
  SCHOOL_BELL_NOTES.forEach((f, k) => {
    const st = k * 0.6 + (k >= 4 ? 0.45 : 0);
    // 실로폰처럼: 기본음 + 위쪽 배음(2.76배·5.4배)이 빨리 사라진다
    playTone({ freq: f, start: st, dur: 1.5, gain: 0.11 * vol, attack: 0.004 });
    playTone({ freq: f * 2.76, start: st, dur: 0.5, gain: 0.03 * vol, attack: 0.002 });
    playTone({ freq: f * 5.4, start: st, dur: 0.2, gain: 0.012 * vol, attack: 0.002 });
  });
}
function playCrossBeep() {
  playTone({ freq: 1180, start: 0, dur: 0.08, gain: 0.06, type: "square", filter: 2600 });
  playTone({ freq: 880, start: 0.12, dur: 0.1, gain: 0.06, type: "square", filter: 2600 });
}
function playCrossTick() {
  playTone({ freq: 1500, start: 0, dur: 0.025, gain: 0.035, type: "square", filter: 3000 });
}
function playHorn(vol = 1) {
  [392, 494].forEach((f) => playTone({ freq: f, type: "square", dur: 0.5, gain: 0.07 * vol, attack: 0.012, filter: 1600 }));
}
function playEngineRev() {
  playTone({ freq: 70, freqEnd: 150, type: "sawtooth", dur: 0.7, gain: 0.07, attack: 0.05, filter: 500 });
}
function nearestPlaceDist(types, x, z) {
  let bd = Infinity;
  PLACES.forEach((p) => {
    if (types.includes(p.type)) bd = Math.min(bd, Math.hypot(p.x * WORLD_SCALE - x, p.z * WORLD_SCALE - z));
  });
  return bd;
}
// 캐릭터 가까이(횡단보도 앞에서 기다리거나 건너는 중) 신호 있는 횡단보도
function nearestSignalArm() {
  const px = character.position.x / WORLD_SCALE, pz = character.position.z / WORLD_SCALE;
  for (const arm of signalArms.values()) {
    if (arm.mid && arm.pedSignals === false) continue;
    const dx = px - arm.x, dz = pz - arm.z;
    if (Math.abs(dx * arm.hx + dz * arm.hz) <= arm.depth / 2 + 3 && Math.abs(dx * arm.rx + dz * arm.rz) <= arm.half + 5) return arm;
  }
  return null;
}
function updateSound(dt) {
  if (!audioReady() || !character) return;
  const cp = character.position;
  soundUpdateTimer += dt;
  ambientTimer -= dt;
  bellTimer -= dt;
  signalBeepTimer -= dt;
  if (soundUpdateTimer >= 0.1) {
    soundUpdateTimer = 0;
    let level = 0, motoBest = Infinity, motoSpeed = 0;
    cars.forEach((car) => {
      if (!car.active) return;
      const d = Math.hypot(car.x - cp.x, car.z - cp.z);
      if (car.type === "moto") {
        if (d < motoBest) { motoBest = d; motoSpeed = car.speed; }
        return;
      }
      const k = Math.max(0, 1 - d / 9);
      level += k * k * (0.35 + 0.65 * Math.min(1, car.speed / CAR_MAX_SPEED)) * (car.type === "bus" ? 1.5 : 1);
    });
    level = Math.min(1, level);
    const t = audioCtx.currentTime;
    trafficGain.gain.setTargetAtTime(0.025 + 0.3 * level, t, 0.25);
    trafficFilter.frequency.setTargetAtTime(240 + 520 * level, t, 0.25);
    const mk = motoBest < 11 ? Math.pow(1 - motoBest / 11, 2) : 0;
    motoGain.gain.setTargetAtTime(0.09 * mk, t, 0.15);
    motoOsc.frequency.setTargetAtTime(62 + 50 * Math.min(1, motoSpeed / MOTO_MAX_SPEED), t, 0.2);
  }
  if (ambientTimer <= 0) {
    const h = worldHour;
    if (h >= 5.5 && h < 18.5) { playBird(nightLevel > 0.5 ? 0.5 : 1); ambientTimer = 1.6 + Math.random() * 4.5; }
    else if (h >= 19.5 || h < 4.5) { playCricket(1); ambientTimer = 0.8 + Math.random() * 2.4; }
    else ambientTimer = 3;
  }
  if (bellTimer <= 0) {
    bellTimer = 5;
    if (worldHour >= 8 && worldHour < 17) {
      const d = nearestPlaceDist(["학교"], cp.x, cp.z);
      if (d < 24) { playSchoolBell(Math.max(0.25, 1 - d / 24)); bellTimer = 80 + Math.random() * 60; }
    }
  }
  if (signalBeepTimer <= 0) {
    const arm = nearestSignalArm();
    if (arm && armPedState(arm) === "G") { playCrossBeep(); signalBeepTimer = 0.7; }
    else if (arm) { playCrossTick(); signalBeepTimer = 1.15; }
    else signalBeepTimer = 0.4;
  }
}
function updateSoundBtn() {
  if (!soundBtnEl) return;
  soundBtnEl.textContent = soundOn ? "🔊 소리" : "🔇 소리";
  soundBtnEl.setAttribute("aria-pressed", soundOn ? "true" : "false");
  soundBtnEl.title = soundOn ? "동네 소리 끄기" : "동네 소리 켜기";
}
function setSoundOn(on) {
  soundOn = on;
  try { localStorage.setItem("roymaker-nb-sound", on ? "1" : "0"); } catch (err) { /* 저장 못 해도 괜찮다 */ }
  if (on) {
    ensureAudio();
    audioCtx?.resume?.();
  } else {
    audioCtx?.suspend?.();
  }
  updateSoundBtn();
}
function resumeSoundIfOn() {
  if (!soundOn || document.hidden) return;
  ensureAudio();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
}
function wireSoundControls() {
  soundBtnEl = document.getElementById("neighborhood3d-sound-btn");
  if (soundWired) return;
  soundWired = true;
  loadSoundPref();
  if (soundBtnEl) {
    soundBtnEl.hidden = false;
    soundBtnEl.addEventListener("click", () => {
      setSoundOn(!soundOn);
      soundBtnEl.blur();
    });
    updateSoundBtn();
  }
  // 브라우저는 화면을 한 번 눌러야 소리를 낼 수 있게 한다 — 거리 모험에서 누르거나 키를 누를 때 깨운다
  const wake = () => { if (rafId && isNeighborhoodViewActive()) resumeSoundIfOn(); };
  wrapEl?.addEventListener("pointerdown", wake);
  window.addEventListener("keydown", wake);
  document.addEventListener("visibilitychange", () => {
    if (!audioCtx) return;
    if (document.hidden) audioCtx.suspend().catch(() => {});
    else if (rafId && isNeighborhoodViewActive()) resumeSoundIfOn();
  });
  resumeSoundIfOn();
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
const SUN_OFFSET = new THREE.Vector3(20, 30, 15); // 시간대(applyTimeOfDay)에 따라 해·달 방향으로 바뀐다
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
    if (ready && !rafId) {
      animate();
      resumeSoundIfOn();
    }
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
    // [임시 디버그 — GLB 지형 실험 끝나면 지울 것] 브라우저 콘솔에서 바로 scene·camera를 들여다보려고
    window.__nbDebug = { scene, camera, renderer, getTerrainY, THREE };
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
    loadSavedHour();
    wireTimeControls();
    applyTimeOfDay();
    wireSoundControls();
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
  if (audioCtx && audioCtx.state === "running") audioCtx.suspend().catch(() => {});
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
