const STAT_LABELS = {
  intellect: "지력",
  stamina: "체력",
  power: "근력",
  art: "감성",
  social: "사회성",
  diligence: "성실성",
};

const HOME_FALLBACK = { lat: 37.5495, lng: 127.0203 };
const CHILD_WALK_M_PER_MIN = 70;
const HOME_SCHOOL_WALK_MIN = 10;
const SCHOOL_START_MIN = 9 * 60;
const SCHOOL_END_MIN = 16 * 60;
const ACADEMY_LESSON_MIN = 60;
const WAIT_PHASE_MS = 2200;
const MOVE_SPEED_MPS = 30;
const GAME_MIN_PER_REAL_SEC = 0.5;
const ARRIVAL_RADIUS_M = 20;
const MAP_ZOOM_LEVEL = 3;

const KEY_TO_DIR = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

const keys = { up: false, down: false, left: false, right: false };

const state = {
  character: null,
  academies: [],
  categoryMap: {},
  positions: { home: null, school: null, academies: {} },
  charPos: null,
  charOverlay: null,
  map: null,
  walkModeActive: false,
  day: 1,
};

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function renderClock() {
  const el = document.getElementById("clock");
  const now = new Date();
  el.textContent = now.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function minutesToClock(min) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

function parseTimeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    new kakao.maps.services.Geocoder().addressSearch(address, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
      } else {
        reject(new Error(`지오코딩 실패: ${address}`));
      }
    });
  });
}

function keywordSearch(query) {
  return new Promise((resolve, reject) => {
    new kakao.maps.services.Places().keywordSearch(query, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
      } else {
        reject(new Error(`장소 검색 실패: ${query}`));
      }
    });
  });
}

async function resolveHomePosition(home) {
  if (home.buildingQuery) {
    try {
      return await keywordSearch(home.buildingQuery);
    } catch (err) {
      console.warn(err);
    }
  }
  try {
    return await geocodeAddress(home.address);
  } catch (err) {
    console.warn(err);
    return HOME_FALLBACK;
  }
}

function offsetLatLng(lat, lng, distanceM, bearingDeg) {
  const earthRadiusM = 6371000;
  const bearing = (bearingDeg * Math.PI) / 180;
  const dLat = ((distanceM * Math.cos(bearing)) / earthRadiusM) * (180 / Math.PI);
  const dLng =
    ((distanceM * Math.sin(bearing)) / (earthRadiusM * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  return { lat: lat + dLat, lng: lng + dLng };
}

function distanceMeters(a, b) {
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((a.lat * Math.PI) / 180);
  const dy = (b.lat - a.lat) * metersPerDegLat;
  const dx = (b.lng - a.lng) * metersPerDegLng;
  return Math.hypot(dx, dy);
}

function addMarker(map, position, content) {
  const marker = new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(position.lat, position.lng) });
  const infowindow = new kakao.maps.InfoWindow({ content: `<div class="map-tip">${content}</div>` });
  kakao.maps.event.addListener(marker, "click", () => infowindow.open(map, marker));
  return marker;
}

function createCharacterOverlay(map, position) {
  const el = document.createElement("div");
  el.className = "char-marker";
  el.textContent = "🧒";
  return new kakao.maps.CustomOverlay({
    map,
    position: new kakao.maps.LatLng(position.lat, position.lng),
    yAnchor: 1,
    content: el,
  });
}

function animate(durationMs, onFrame) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - startedAt) / durationMs);
      onFrame(t);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}

function showDpad(visible) {
  document.getElementById("dpad").hidden = !visible;
  if (!visible) {
    keys.up = keys.down = keys.left = keys.right = false;
  }
}

function walkTo(target, startClock, label) {
  return new Promise((resolve) => {
    state.walkModeActive = true;
    showDpad(true);

    let clock = startClock;
    let last = performance.now();

    function frame(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      const dir = { x: 0, y: 0 };
      if (keys.up) dir.y += 1;
      if (keys.down) dir.y -= 1;
      if (keys.left) dir.x -= 1;
      if (keys.right) dir.x += 1;
      const mag = Math.hypot(dir.x, dir.y);

      if (mag > 0) {
        const nx = dir.x / mag;
        const ny = dir.y / mag;
        const metersPerDegLat = 111320;
        const metersPerDegLng = 111320 * Math.cos((state.charPos.lat * Math.PI) / 180);
        const moveM = MOVE_SPEED_MPS * dt;
        state.charPos = {
          lat: state.charPos.lat + (ny * moveM) / metersPerDegLat,
          lng: state.charPos.lng + (nx * moveM) / metersPerDegLng,
        };
        state.charOverlay.setPosition(new kakao.maps.LatLng(state.charPos.lat, state.charPos.lng));
        state.map.setCenter(new kakao.maps.LatLng(state.charPos.lat, state.charPos.lng));
        clock += dt * GAME_MIN_PER_REAL_SEC;
      }

      const dist = distanceMeters(state.charPos, target);
      setStatus(`${minutesToClock(clock)} · ${label} (남은 거리 약 ${Math.round(dist)}m)`);

      if (dist <= ARRIVAL_RADIUS_M) {
        state.walkModeActive = false;
        showDpad(false);
        resolve(clock);
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

async function waitUntil(startClock, endClock, label) {
  setStatus(`${minutesToClock(startClock)} · ${label}`);
  await animate(WAIT_PHASE_MS, (t) => {
    setStatus(`${minutesToClock(startClock + (endClock - startClock) * t)} · ${label}`);
  });
  setStatus(`${minutesToClock(endClock)} · ${label}`);
}

async function renderMap(character, academies) {
  const map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(HOME_FALLBACK.lat, HOME_FALLBACK.lng),
    level: MAP_ZOOM_LEVEL,
  });
  state.map = map;

  const homePos = await resolveHomePosition(character.home);
  state.positions.home = homePos;
  map.setCenter(new kakao.maps.LatLng(homePos.lat, homePos.lng));
  addMarker(map, homePos, `집 — 금호파크힐스 113동<br>${character.home.address}`);

  try {
    state.positions.school = await geocodeAddress(character.school.address);
  } catch (err) {
    console.warn(err);
    state.positions.school = offsetLatLng(homePos.lat, homePos.lng, HOME_SCHOOL_WALK_MIN * CHILD_WALK_M_PER_MIN, 45);
  }
  addMarker(map, state.positions.school, `학교 — ${character.school.name}<br>${character.school.address}`);

  const localAcademies = academies.filter((a) => a.location.mode === "walk" && a.location.etaMinFromHome != null);
  localAcademies.forEach((academy, i) => {
    const bearingDeg = (360 / localAcademies.length) * i;
    const distanceM = academy.location.etaMinFromHome * CHILD_WALK_M_PER_MIN;
    const pos = offsetLatLng(homePos.lat, homePos.lng, distanceM, bearingDeg);
    state.positions.academies[academy.id] = pos;
    const category = state.categoryMap[academy.categoryId];
    addMarker(
      map,
      pos,
      `<strong>${academy.name}</strong> (가상 위치)<br>${category.label} · 도보 ${academy.location.etaMinFromHome}분`
    );
  });

  state.charPos = { ...homePos };
  state.charOverlay = createCharacterOverlay(map, homePos);
}

function renderStats(character) {
  document.getElementById("char-name").textContent = `${character.name} (초${character.grade})`;

  const statsEl = document.getElementById("stats");
  statsEl.innerHTML = "";
  Object.entries(character.stats).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <span class="label">${STAT_LABELS[key] ?? key}</span>
      <span class="bar"><span style="width:${Math.min(value, 100)}%"></span></span>
      <span class="value">${value}</span>
    `;
    statsEl.appendChild(row);
  });

  const condEl = document.getElementById("condition");
  condEl.innerHTML = `<p class="muted">허기 ${character.condition.hunger} · 체력(현재) ${character.condition.staminaNow}</p>`;
}

function renderAcademies(academies, categoryMap) {
  const el = document.getElementById("academies");
  el.innerHTML = "";

  academies.forEach((academy) => {
    const category = categoryMap[academy.categoryId];
    const growthText = Object.entries(category.growth)
      .map(([stat, amount]) => `${STAT_LABELS[stat] ?? stat} +${amount}`)
      .join(" · ");

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${academy.name}</strong> (${category.label})<br>
      <span class="muted">${growthText} · 집에서 ${academy.location.mode === "walk" ? "도보" : "이동"} ${academy.location.etaMinFromHome}분</span>
    `;
    el.appendChild(li);
  });
}

function populateAcademySelect(academies) {
  const el = document.getElementById("academy-select");
  el.innerHTML = "";

  const homeOpt = document.createElement("option");
  homeOpt.value = "";
  homeOpt.textContent = "바로 귀가";
  el.appendChild(homeOpt);

  academies
    .filter((a) => a.location.mode === "walk")
    .forEach((academy) => {
      const opt = document.createElement("option");
      opt.value = academy.id;
      opt.textContent = `${academy.name} (도보 ${academy.location.etaMinFromHome}분)`;
      el.appendChild(opt);
    });
}

function logLine(text) {
  const el = document.getElementById("day-log");
  const li = document.createElement("li");
  li.textContent = text;
  el.appendChild(li);
  el.scrollTop = el.scrollHeight;
}

function setStatus(text) {
  document.getElementById("day-status").textContent = text;
}

function applySchoolDayEffects() {
  state.character.condition.hunger = 80;
  state.character.condition.staminaNow = Math.max(0, state.character.condition.staminaNow - 10);
  renderStats(state.character);
  logLine("급식을 먹고 허기를 회복했다 (허기 80)");
}

function applyAcademyEffects(academy) {
  const category = state.categoryMap[academy.categoryId];
  Object.entries(category.growth).forEach(([stat, amount]) => {
    state.character.stats[stat] = Math.min(100, (state.character.stats[stat] ?? 0) + amount);
  });
  state.character.condition.staminaNow = Math.max(0, state.character.condition.staminaNow - category.staminaCost);
  state.character.condition.hunger = Math.max(0, state.character.condition.hunger - 15);
  renderStats(state.character);

  const growthText = Object.entries(category.growth)
    .map(([stat, amount]) => `${STAT_LABELS[stat]} +${amount}`)
    .join(" · ");
  logLine(`${academy.name} 수업 완료 — ${growthText}`);
}

function applyEndOfDay() {
  state.character.condition.hunger = 90;
  state.character.condition.staminaNow = Math.min(100, state.character.condition.staminaNow + 10);
  renderStats(state.character);
  logLine("저녁밥을 먹고 하루를 마쳤다");
}

async function runDay(departMin, academyId) {
  document.getElementById("day-run").hidden = false;
  document.getElementById("day-summary").hidden = true;
  document.getElementById("day-log").innerHTML = "";

  state.charPos = { ...state.positions.home };
  state.charOverlay.setPosition(new kakao.maps.LatLng(state.charPos.lat, state.charPos.lng));

  let clock = departMin;
  logLine(`${minutesToClock(clock)} 집에서 출발 — 방향키/버튼으로 학교까지 이동`);
  clock = await walkTo(state.positions.school, clock, "학교로 이동 중");

  const isLate = clock > SCHOOL_START_MIN;
  logLine(`${minutesToClock(clock)} 학교 도착${isLate ? " — 지각!" : ""}`);

  clock = Math.max(clock, SCHOOL_START_MIN);
  await waitUntil(clock, SCHOOL_END_MIN, isLate ? "지각 — 수업 중 (점심 포함)" : "수업 중 (점심 포함)");
  clock = SCHOOL_END_MIN;
  applySchoolDayEffects();

  if (academyId) {
    const academy = state.academies.find((a) => a.id === academyId);
    const academyPos = state.positions.academies[academyId];

    logLine(`${minutesToClock(clock)} 하교 — ${academy.name}(으)로 이동`);
    clock = await walkTo(academyPos, clock, `${academy.name}(으)로 이동 중`);
    logLine(`${minutesToClock(clock)} ${academy.name} 도착`);

    const lessonEnd = clock + ACADEMY_LESSON_MIN;
    await waitUntil(clock, lessonEnd, `${academy.name} 수업`);
    clock = lessonEnd;
    applyAcademyEffects(academy);

    logLine(`${minutesToClock(clock)} 집으로 귀가 이동`);
    clock = await walkTo(state.positions.home, clock, "집으로 귀가 중");
  } else {
    logLine(`${minutesToClock(clock)} 하교 — 집으로 귀가`);
    clock = await walkTo(state.positions.home, clock, "집으로 귀가 중");
  }

  logLine(`${minutesToClock(clock)} 집 도착`);
  applyEndOfDay();

  const summaryEl = document.getElementById("day-summary");
  summaryEl.hidden = false;
  summaryEl.textContent = `Day ${state.day} 완료 — ${isLate ? "오늘은 지각했다." : "정시에 등교했다."} 허기 ${
    state.character.condition.hunger
  } · 체력 ${state.character.condition.staminaNow}`;

  state.day += 1;
  document.getElementById("day-counter").textContent = `Day ${state.day}`;

  const startBtn = document.getElementById("start-day-btn");
  startBtn.disabled = false;
  startBtn.textContent = "다음 날 시작";
  document.getElementById("depart-select").disabled = false;
  document.getElementById("academy-select").disabled = false;
}

function wireScheduleForm() {
  const form = document.getElementById("schedule-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const departMin = parseTimeToMinutes(document.getElementById("depart-select").value);
    const academyId = document.getElementById("academy-select").value || null;

    document.getElementById("start-day-btn").disabled = true;
    document.getElementById("depart-select").disabled = true;
    document.getElementById("academy-select").disabled = true;

    runDay(departMin, academyId);
  });
}

function wireMovementControls() {
  window.addEventListener("keydown", (event) => {
    const dir = KEY_TO_DIR[event.key];
    if (!dir) return;
    if (state.walkModeActive) event.preventDefault();
    keys[dir] = true;
  });
  window.addEventListener("keyup", (event) => {
    const dir = KEY_TO_DIR[event.key];
    if (dir) keys[dir] = false;
  });

  document.querySelectorAll("#dpad button").forEach((btn) => {
    const dir = btn.dataset.dir;
    btn.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      keys[dir] = true;
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) =>
      btn.addEventListener(evt, () => (keys[dir] = false))
    );
  });
}

async function main() {
  renderClock();
  setInterval(renderClock, 1000 * 30);

  const [character, academies, categories] = await Promise.all([
    loadJSON("data/character.json"),
    loadJSON("data/academies.json"),
    loadJSON("data/academy_categories.json"),
  ]);

  state.character = character;
  state.academies = academies;
  state.categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  renderStats(character);
  renderAcademies(academies, state.categoryMap);
  populateAcademySelect(academies);
  await renderMap(character, academies);
  wireScheduleForm();
  wireMovementControls();
}

main();
