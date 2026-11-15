// ── 거리 모험 (프린세스메이커 무사수행 느낌의 아주 기본적인 버전) ──
// 실제 동네를 그대로 옮기는 건 접고, 평범한 한국 거리를 흉내 낸 가상의 길을 만들어서
// 그 위를 걸어 다니며 동전을 줍고 불량배를 처리해 용돈을 버는 걸로 바꿨다.
// walk.glb(이로이 3D 모델 + Walking/Running/Idle/Regular_Jump 등 20개 동작),
// dance.glb(춤 동작들)는 그대로 쓴다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ASSET_VERSION = "20261115h";

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

// ── 거리 생김새 ──
const STREET_HALF_LEN = 60;
const STREET_HALF_WIDTH = 7;
const BUILDING_ROW_X = 13;
const BUILDING_COLORS = [0xffd9a0, 0xa8d8c9, 0xa9c6e8, 0xf2a9c4, 0xd7c4e8, 0xfff0a8, 0xffb199];
const SHOP_NAMES = ["분식", "문구점", "편의점", "세탁소", "약국", "빵집", "꽃집", "태권도장", "김밥천국", "문방구"];

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
let canvasEl, loadingEl, danceBtnEl, walkBtnEl, runBtnEl, hudEl, toastEl, resetBtnEl, dpadEl;
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
let camPitch = 0.55;
let camDistance = 11;
const CAM_PITCH_MIN = 0.15;
const CAM_PITCH_MAX = 1.35;
const CAM_DIST_MIN = 3.5;
const CAM_DIST_MAX = 28;
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
const labelTextureCache = {};
function makeLabelSprite(text) {
  if (!labelTextureCache[text]) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fontSize = 46;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const padX = 20;
    const padY = 14;
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
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, sizeAttenuation: true }));
  const scale = 0.05;
  sprite.scale.set(w * scale, h * scale, 1);
  sprite.renderOrder = 999;
  return sprite;
}

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
  Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, far: 300 });
  scene.add(sun);

  // 길 밖은 전부 잔디로 덮어서 끝이 안 보이게 한다
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0x8fbf72 }));
  bg.rotation.x = -Math.PI / 2;
  bg.position.y = -0.03;
  bg.receiveShadow = true;
  scene.add(bg);

  // 도로
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(STREET_HALF_WIDTH * 2, STREET_HALF_LEN * 2),
    new THREE.MeshStandardMaterial({ color: 0x6f6f72 })
  );
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  scene.add(road);

  // 중앙선
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf5e8b0 });
  for (let z = -STREET_HALF_LEN + 3; z < STREET_HALF_LEN; z += 8) {
    const seg = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 4), lineMat);
    seg.rotation.x = -Math.PI / 2;
    seg.position.set(0, 0.01, z);
    scene.add(seg);
  }

  // 양옆 인도
  [-1, 1].forEach((side) => {
    const sidewalk = new THREE.Mesh(
      new THREE.PlaneGeometry(4, STREET_HALF_LEN * 2),
      new THREE.MeshStandardMaterial({ color: 0xc7c7c2 })
    );
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(side * (STREET_HALF_WIDTH + 2), 0.01, 0);
    sidewalk.receiveShadow = true;
    scene.add(sidewalk);
  });

  buildShops();
}

function buildShops() {
  let shopIdx = 0;
  [-1, 1].forEach((side) => {
    for (let z = -STREET_HALF_LEN + 10; z <= STREET_HALF_LEN - 10; z += 14) {
      const h = 6 + (shopIdx % 4) * 2.5;
      const color = BUILDING_COLORS[shopIdx % BUILDING_COLORS.length];
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(8, h, 10), new THREE.MeshStandardMaterial({ color }));
      const x = side * (BUILDING_ROW_X + 4);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // 입구 차양(생김새만 흉내)
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 0.4, 1.6),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      awning.position.set(x, 3, z + side * -5.5);
      scene.add(awning);

      const label = makeLabelSprite(SHOP_NAMES[shopIdx % SHOP_NAMES.length]);
      label.position.set(x, h + 2.2, z);
      scene.add(label);
      shopIdx++;
    }
  });

  // 가로수
  for (let z = -STREET_HALF_LEN + 6; z <= STREET_HALF_LEN - 6; z += 10) {
    [-1, 1].forEach((side) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 1.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x7a5a3a })
      );
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 10), new THREE.MeshStandardMaterial({ color: 0x4f9a5c }));
      leaves.position.y = 1.6;
      const tree = new THREE.Group();
      tree.add(trunk, leaves);
      tree.position.set(side * (STREET_HALF_WIDTH + 3.6), 0.8, z);
      tree.castShadow = true;
      scene.add(tree);
    });
  }
}

function randomStreetSpot() {
  const x = rand(-(STREET_HALF_WIDTH - 1.5), STREET_HALF_WIDTH - 1.5);
  const z = rand(-(STREET_HALF_LEN - 6), STREET_HALF_LEN - 6);
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

function startRandomDance() {
  const name = pickRandomDance();
  if (!name) return;
  dancing = true;
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

function updateMovement(dt) {
  if (!character || dancing || jumping) return;
  const dir = new THREE.Vector3(
    (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
    0,
    (keys.down ? 1 : 0) - (keys.up ? 1 : 0)
  );
  if (dir.lengthSq() > 0) {
    dir.normalize();
    const speed = moveMode === "run" ? RUN_SPEED : WALK_SPEED;
    const next = character.position.clone().addScaledVector(dir, speed * dt);
    next.x = Math.max(-STREET_HALF_WIDTH + 0.6, Math.min(STREET_HALF_WIDTH - 0.6, next.x));
    next.z = Math.max(-STREET_HALF_LEN + 1, Math.min(STREET_HALF_LEN - 1, next.z));
    character.position.copy(next);
    character.rotation.y = Math.atan2(dir.x, dir.z);
    playAction(moveMode === "run" ? "Running" : "Walking");
  } else {
    playAction("Idle_02");
  }
}

function wireOrbitControls() {
  canvasEl.addEventListener("pointerdown", (ev) => {
    dragging = true;
    lastPointer = { x: ev.clientX, y: ev.clientY };
    canvasEl.setPointerCapture(ev.pointerId);
  });
  canvasEl.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    const dx = ev.clientX - lastPointer.x;
    const dy = ev.clientY - lastPointer.y;
    lastPointer = { x: ev.clientX, y: ev.clientY };
    camYaw -= dx * 0.006;
    camPitch = Math.min(CAM_PITCH_MAX, Math.max(CAM_PITCH_MIN, camPitch + dy * 0.006));
  });
  const stopDrag = () => {
    dragging = false;
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
  walkBtnEl = document.getElementById("neighborhood3d-walk-btn");
  runBtnEl = document.getElementById("neighborhood3d-run-btn");
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
    character.position.set(0, 0, -STREET_HALF_LEN + 4);
    playAction("Idle_02");
    wireOrbitControls();
    wireDpad();
    // 버튼이 클릭 뒤에도 포커스를 들고 있으면, 스페이스바(점프)를 눌렀을 때 그 버튼이
    // 다시 눌리는 것으로 처리돼 버린다 — 눌린 직후 바로 포커스를 뺀다
    [danceBtnEl, walkBtnEl, runBtnEl, resetBtnEl].forEach((btn) => {
      btn?.addEventListener("click", () => btn.blur());
    });
    danceBtnEl?.addEventListener("click", onDanceClick);
    walkBtnEl?.addEventListener("click", () => setMoveMode("walk"));
    runBtnEl?.addEventListener("click", () => setMoveMode("run"));
    resetBtnEl?.addEventListener("click", startAdventure);
    startAdventure();
    [danceBtnEl, walkBtnEl, runBtnEl, hudEl, dpadEl].forEach((el) => {
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
