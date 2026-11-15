// ── 키보드 대탈출 (로블록스 "키보드 이스케이프" 느낌의 미니게임) ──
// 거대한 키보드 자판 위를 뛰어다니며 구슬을 모아 레벨업하면 이동 속도가 빨라지고,
// 자판 사이 틈은 방향키+점프를 같이 눌러서 건너뛰어야 한다. 끝(스페이스바)까지 가면 탈출!
// 캐릭터 모델은 거리 모험(neighborhood3d.js)과 같은 walk.glb를 그대로 쓴다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ASSET_VERSION = "20261115a";

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
const WALK_SPEED_BASE = 2.4; // m/s
const RUN_SPEED_BASE = 5.4; // m/s

// ── 자판 생김새 ──
const KEY_W = 1.7;
const KEY_D = 1.8;
const KEY_H = 0.4;
const GROOVE = 0.12;
const ROW_SAFE_MARGIN = 0.3;

// 뒤(스폰)에서 앞(탈출구)으로: Z X C V B N M → A S D F G H J K L → Q W E R T Y U I O P → [ SPACE ]
const ROWS = [
  { letters: "ZXCVBNM".split(""), z: 16, color: 0xffb199 },
  { letters: "ASDFGHJKL".split(""), z: 11, color: 0xa9c6e8 },
  { letters: "QWERTYUIOP".split(""), z: 6, color: 0xa8d8c9 },
];
const FINISH = { z: 0, width: 15, depth: 3.2, color: 0xffd34d };

// 구슬(경험치) 배치: [행 번호(0~2), 그 행에서 몇 번째 글자 위]
const ORB_SPOTS = [
  [0, 1], [0, 4],
  [1, 0], [1, 4], [1, 8],
  [2, 1], [2, 5], [2, 8],
];
const XP_PER_LEVEL = 2; // 구슬 2개마다 레벨업
const SPEED_PER_LEVEL = 0.18; // 레벨마다 속도 +18%
const ESCAPE_REWARD_MIN = 1500;
const ESCAPE_REWARD_MAX = 3500;

let renderer, scene, camera, clock, mixer, character;
let actions = {};
let currentAction = null;
let rafId = null;
let ready = false;
let loading = false;
let canvasEl, loadingEl, walkBtnEl, runBtnEl, hudEl, toastEl, resetBtnEl, dpadEl;
const keys = { up: false, down: false, left: false, right: false };
let moveMode = "walk"; // "walk" | "run"
let jumping = false;
let toastTimer = null;
let escaped = false;

let orbs = [];
let safeRects = [];
let lastSafePos = new THREE.Vector3();
let xp = 0;
let level = 1;

// ── 카메라: 캐릭터를 중심으로 도는 궤도(드래그로 회전, 휠로 확대/축소) ──
let camYaw = 0;
let camPitch = 0.55;
let camDistance = 10;
const CAM_PITCH_MIN = 0.15;
const CAM_PITCH_MAX = 1.35;
const CAM_DIST_MIN = 3.5;
const CAM_DIST_MAX = 26;
let dragging = false;
let lastPointer = { x: 0, y: 0 };

function isKeyboardViewActive() {
  return document.getElementById("main-view")?.dataset.view === "keyboard";
}
function rand(min, max) {
  return min + Math.random() * (max - min);
}
function randStep100(min, max) {
  return Math.round(rand(min, max) / 100) * 100;
}
function speedMultiplier() {
  return 1 + SPEED_PER_LEVEL * (level - 1);
}
function maxLevel() {
  return 1 + Math.floor(ORB_SPOTS.length / XP_PER_LEVEL);
}

window.addEventListener("keydown", (ev) => {
  if (!isKeyboardViewActive()) return;
  const dir = KEY_DIR[ev.key];
  if (!dir && ev.key !== " ") return;
  ev.preventDefault();
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

// ── 글씨 라벨 — 캔버스에 그려서 늘 카메라를 보는 스프라이트로 띄운다 ──
const labelTextureCache = {};
function makeLabelSprite(text, scale = 0.05) {
  const cacheKey = text;
  if (!labelTextureCache[cacheKey]) {
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
    labelTextureCache[cacheKey] = { texture, w: canvas.width, h: canvas.height };
  }
  const { texture, w, h } = labelTextureCache[cacheKey];
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, sizeAttenuation: true }));
  sprite.scale.set(w * scale, h * scale, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function rowWidth(row) {
  return row.letters.length * (KEY_W + GROOVE) - GROOVE;
}

function keyX(row, idx) {
  const w = rowWidth(row);
  return -w / 2 + KEY_W / 2 + idx * (KEY_W + GROOVE);
}

function buildScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14213a);
  scene.fog = new THREE.Fog(0x14213a, 30, 90);

  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);

  scene.add(new THREE.HemisphereLight(0xdbe9ff, 0x101624, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(20, 30, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 120 });
  scene.add(sun);

  // 틈 아래로는 깊고 어두운 공간(빠지면 안 되는 곳)이 보이게 한다
  const voidPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x0a0e1a })
  );
  voidPlane.rotation.x = -Math.PI / 2;
  voidPlane.position.set(0, -2.5, 8);
  scene.add(voidPlane);

  safeRects = [];
  ROWS.forEach((row, i) => {
    safeRects.push(buildRow(row));
  });
  safeRects.push(buildFinish());
  spawnOrbs();
}

function buildRow(row) {
  const w = rowWidth(row);
  row.letters.forEach((letter, idx) => {
    const x = keyX(row, idx);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(KEY_W, KEY_H, KEY_D),
      new THREE.MeshStandardMaterial({ color: row.color })
    );
    mesh.position.set(x, KEY_H / 2, row.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const label = makeLabelSprite(letter, 0.032);
    label.position.set(x, KEY_H + 0.55, row.z);
    scene.add(label);
  });
  return {
    x1: -w / 2 - ROW_SAFE_MARGIN,
    x2: w / 2 + ROW_SAFE_MARGIN,
    z1: row.z - KEY_D / 2 - ROW_SAFE_MARGIN,
    z2: row.z + KEY_D / 2 + ROW_SAFE_MARGIN,
  };
}

function buildFinish() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(FINISH.width, KEY_H, FINISH.depth),
    new THREE.MeshStandardMaterial({ color: FINISH.color, emissive: 0x5a4600, emissiveIntensity: 0.25 })
  );
  mesh.position.set(0, KEY_H / 2, FINISH.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const label = makeLabelSprite("SPACE · 탈출구", 0.045);
  label.position.set(0, KEY_H + 1.3, FINISH.z);
  scene.add(label);

  return {
    x1: -FINISH.width / 2 - ROW_SAFE_MARGIN,
    x2: FINISH.width / 2 + ROW_SAFE_MARGIN,
    z1: FINISH.z - FINISH.depth / 2 - ROW_SAFE_MARGIN,
    z2: FINISH.z + FINISH.depth / 2 + ROW_SAFE_MARGIN,
    isFinish: true,
  };
}

function makeOrb() {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 0),
    new THREE.MeshStandardMaterial({ color: 0x4de8ff, emissive: 0x004a5a, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.25 })
  );
  mesh.castShadow = true;
  return mesh;
}

function spawnOrbs() {
  orbs.forEach((o) => scene.remove(o.mesh));
  orbs = [];
  ORB_SPOTS.forEach(([rowIdx, keyIdx]) => {
    const row = ROWS[rowIdx];
    const x = keyX(row, keyIdx);
    const mesh = makeOrb();
    mesh.position.set(x, KEY_H + 0.6, row.z);
    scene.add(mesh);
    orbs.push({ mesh, taken: false });
  });
}

function inSafeRect(pos) {
  return safeRects.find(
    (r) => pos.x >= r.x1 && pos.x <= r.x2 && pos.z >= r.z1 && pos.z <= r.z2
  );
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

function updateHud() {
  if (!hudEl) return;
  const orbsLeft = orbs.filter((o) => !o.taken).length;
  hudEl.textContent = `⭐ Lv.${level} · 구슬 ${ORB_SPOTS.length - orbsLeft}/${ORB_SPOTS.length} · 속도 x${speedMultiplier().toFixed(2)}`;
}

function grantXp() {
  xp += 1;
  const nextLevel = Math.min(maxLevel(), 1 + Math.floor(xp / XP_PER_LEVEL));
  if (nextLevel > level) {
    level = nextLevel;
    showToast(`🆙 레벨업! Lv.${level} · 속도가 빨라졌다`);
  }
  updateHud();
}

function finishEscape() {
  if (escaped) return;
  escaped = true;
  const reward = randStep100(ESCAPE_REWARD_MIN, ESCAPE_REWARD_MAX);
  if (typeof window.grantAdventureReward === "function") window.grantAdventureReward(reward);
  showToast(`🎉 키보드 대탈출 성공! 용돈 +${reward}원`);
  if (resetBtnEl) resetBtnEl.hidden = false;
}

function updatePickupsAndFall(dt) {
  if (!character) return;
  const cp = character.position;
  let changed = false;
  orbs.forEach((o) => {
    if (o.taken) return;
    o.mesh.rotation.y += dt * 2.4;
    o.mesh.position.y = KEY_H + 0.6 + Math.sin(performance.now() / 280 + o.mesh.id) * 0.1;
    if (cp.distanceTo(o.mesh.position) < 1.5) {
      o.taken = true;
      scene.remove(o.mesh);
      changed = true;
      grantXp();
    }
  });
  if (changed) updateHud();

  const hit = inSafeRect(cp);
  if (hit) {
    lastSafePos.copy(cp);
    if (hit.isFinish) finishEscape();
  } else if (!jumping) {
    // 점프 중이 아닌데 자판 틈 위에 있다는 건 떨어졌다는 뜻 — 마지막으로 서 있던 자판으로 돌려보낸다
    character.position.copy(lastSafePos);
    showToast("😵 틈에 빠졌다! 방향키+스페이스바로 뛰어서 건너보자");
  }
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
  if (!character || !mixer || jumping || !actions["Regular_Jump"]) return;
  jumping = true;
  playAction("Regular_Jump", {
    loop: false,
    onFinished: () => {
      jumping = false;
      playAction("Idle_02");
    },
  });
}

// 방향키는 "월드 기준 앞/뒤/좌/우"가 아니라 지금 돌려 둔 카메라가 보는 방향을 기준으로 움직인다.
function updateMovement(dt) {
  if (!character) return;
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
    const speed = (moveMode === "run" ? RUN_SPEED_BASE : WALK_SPEED_BASE) * speedMultiplier();
    character.position.addScaledVector(dir, speed * dt);
    character.rotation.y = Math.atan2(dir.x, dir.z);
  }
  // 점프 중엔 점프 동작을 그대로 유지하고, 이동/방향 전환만 반영한다(방향키+점프 동시 입력으로 틈을 건넌다)
  if (jumping) return;
  if (moving) {
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
  updatePickupsAndFall(dt);
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

function resetRun() {
  xp = 0;
  level = 1;
  escaped = false;
  Object.keys(keys).forEach((k) => (keys[k] = false));
  spawnOrbs();
  character.position.set(0, KEY_H, ROWS[0].z);
  character.rotation.y = 0;
  lastSafePos.copy(character.position);
  if (resetBtnEl) resetBtnEl.hidden = true;
  updateHud();
}

async function initKeyboardEscape() {
  canvasEl = document.getElementById("kbescape-canvas");
  loadingEl = document.getElementById("kbescape-loading");
  walkBtnEl = document.getElementById("kbescape-walk-btn");
  runBtnEl = document.getElementById("kbescape-run-btn");
  hudEl = document.getElementById("kbescape-hud");
  toastEl = document.getElementById("kbescape-toast");
  resetBtnEl = document.getElementById("kbescape-reset-btn");
  dpadEl = document.getElementById("kbescape-dpad");
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
    buildScene();
    await loadCharacter();
    character.position.set(0, KEY_H, ROWS[0].z);
    lastSafePos.copy(character.position);
    playAction("Idle_02");
    wireOrbitControls();
    wireDpad();
    // 버튼이 클릭 뒤에도 포커스를 들고 있으면 스페이스바(점프)가 그 버튼을 다시 누르는 걸로 처리돼서,
    // 눌린 직후 바로 포커스를 뺀다
    [walkBtnEl, runBtnEl, resetBtnEl].forEach((btn) => {
      btn?.addEventListener("click", () => btn.blur());
    });
    walkBtnEl?.addEventListener("click", () => setMoveMode("walk"));
    runBtnEl?.addEventListener("click", () => setMoveMode("run"));
    resetBtnEl?.addEventListener("click", resetRun);
    updateHud();
    [walkBtnEl, runBtnEl, hudEl, dpadEl].forEach((el) => {
      if (el) el.hidden = false;
    });
    if (loadingEl) loadingEl.hidden = true;
    ready = true;
    resize();
    animate();
  } catch (err) {
    console.warn("키보드 대탈출을 불러오지 못했다", err);
    if (loadingEl) loadingEl.textContent = "불러오지 못했어요. 인터넷 연결을 확인해 주세요.";
  } finally {
    loading = false;
  }
}

function pauseKeyboardEscape() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

window.initKeyboardEscape = initKeyboardEscape;
window.pauseKeyboardEscape = pauseKeyboardEscape;
