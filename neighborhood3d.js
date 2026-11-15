// ── 우리동네 3D (아주 기본적인 화이트박스 버전) ──
// 우리집(금호파크힐스) 반경 220m 안의 실제 건물 외곽선(data/neighborhood_buildings.json,
// OpenStreetMap)을 그대로 세워 올리고, 그 위를 walk.glb/dance.glb 캐릭터가 걸어 다닌다.
// 사진 같은 정교함은 없고, 실제 건물 배치·대략적인 색감만 흉내 낸 수준이다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ASSET_VERSION = "20261115a";
const HOME = { lat: 37.5545375, lon: 127.0241406 };
const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON = 111320 * Math.cos((HOME.lat * Math.PI) / 180);

function toWorld(lat, lon) {
  const x = (lon - HOME.lon) * M_PER_DEG_LON;
  const z = -(lat - HOME.lat) * M_PER_DEG_LAT; // 북쪽 = -Z
  return [x, z];
}

// 카카오 로드뷰로 실제 건물을 둘러보고 고른 대략적인 색(흰색/회색 계열 + 오래된 동은 테라코타 톤)
const BUILDING_COLOR = {
  apartmentsNew: 0xe7e2da,
  apartmentsOld: 0xc98a62,
  school: 0xf0d9a0,
  church: 0xf3efe6,
  fitness: 0x93a7bb,
  commercial: 0x93a7bb,
};
function colorFor(b) {
  if (b.type === "apartments") return b.startDate >= 2015 ? BUILDING_COLOR.apartmentsNew : BUILDING_COLOR.apartmentsOld;
  return BUILDING_COLOR[b.type] ?? 0xaaaaaa;
}

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
const CHAR_SPEED = 2.4; // m/s

let renderer, scene, camera, clock, mixer, character;
let actions = {};
let currentAction = null;
let rafId = null;
let ready = false;
let loading = false;
let canvasEl, loadingEl, danceBtnEl;
const keys = { up: false, down: false, left: false, right: false };

function isNeighborhoodViewActive() {
  return document.getElementById("main-view")?.dataset.view === "neighborhood";
}

window.addEventListener("keydown", (ev) => {
  const dir = KEY_DIR[ev.key];
  if (!dir || !isNeighborhoodViewActive()) return;
  ev.preventDefault();
  keys[dir] = true;
});
window.addEventListener("keyup", (ev) => {
  const dir = KEY_DIR[ev.key];
  if (dir) keys[dir] = false;
});

function buildStaticScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe3ff);
  scene.fog = new THREE.Fog(0xbfe3ff, 100, 300);

  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8d9a7a, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(60, 90, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, far: 300 });
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: 0x8fbf72 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

function addBuilding(b) {
  const pts = b.footprint.map(([lat, lon]) => {
    const [x, z] = toWorld(lat, lon);
    return new THREE.Vector2(x, -z);
  });
  const shape = new THREE.Shape(pts);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: Math.max(3, b.height), bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colorFor(b) }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

async function loadBuildings() {
  const res = await fetch(`data/neighborhood_buildings.json?v=${ASSET_VERSION}`);
  const buildings = await res.json();
  buildings.forEach(addBuilding);
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

let dancing = false;
function onDanceClick() {
  if (!character || !mixer || dancing) return;
  const startDance = () => {
    dancing = true;
    playAction("Hip_Hop_Dance", {
      loop: false,
      onFinished: () => {
        dancing = false;
        playAction("Idle_02");
      },
    });
  };
  if (actions["Hip_Hop_Dance"]) {
    startDance();
    return;
  }
  danceBtnEl.disabled = true;
  new GLTFLoader().load(
    `models/dance.glb?v=${ASSET_VERSION}`,
    (gltf) => {
      gltf.animations.forEach((clip) => {
        if (!actions[clip.name]) actions[clip.name] = mixer.clipAction(clip);
      });
      danceBtnEl.disabled = false;
      startDance();
    },
    undefined,
    (err) => {
      console.warn("춤 동작을 못 불러왔다", err);
      danceBtnEl.disabled = false;
    }
  );
}

function updateMovement(dt) {
  if (!character || dancing) return;
  const dir = new THREE.Vector3(
    (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
    0,
    (keys.down ? 1 : 0) - (keys.up ? 1 : 0)
  );
  if (dir.lengthSq() > 0) {
    dir.normalize();
    character.position.addScaledVector(dir, CHAR_SPEED * dt);
    character.rotation.y = Math.atan2(dir.x, dir.z);
    playAction("Walking");
  } else {
    playAction("Idle_02");
  }
}

function updateCamera() {
  if (!character) return;
  const targetPos = character.position.clone().add(new THREE.Vector3(0, 6, 9));
  camera.position.lerp(targetPos, 0.08);
  camera.lookAt(character.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
}

function animate() {
  rafId = requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  updateMovement(dt);
  if (mixer) mixer.update(dt);
  updateCamera();
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
    await loadBuildings();
    await loadCharacter();
    character.position.set(0, 0, -35); // 113동 바로 앞, 건물 사이 빈 길 — 건물 안에 스폰되지 않게 확인한 지점
    playAction("Idle_02");
    danceBtnEl?.addEventListener("click", onDanceClick);
    if (danceBtnEl) danceBtnEl.hidden = false;
    if (loadingEl) loadingEl.hidden = true;
    ready = true;
    resize();
    animate();
  } catch (err) {
    console.warn("우리동네 3D를 불러오지 못했다", err);
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
