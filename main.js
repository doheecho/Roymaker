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
const MOVE_SPEED_MPS = 60;
const GAME_MIN_PER_REAL_SEC = 1.0;
const ARRIVAL_RADIUS_M = 20;
const MAP_ZOOM_LEVEL = 3;

const BUS_FARE = 450;
const SUBWAY_FARE = 450;
const TRANSIT_M_PER_MIN = 220;
const TRANSIT_RIDE_MS = 1800;

const DAY_TIMELINE_START_MIN = 7 * 60;
const DAY_TIMELINE_END_MIN = 21 * 60;
const ROW_MIN = 30;
const ROW_PX = 30;
const TOTAL_ROWS = (DAY_TIMELINE_END_MIN - DAY_TIMELINE_START_MIN) / ROW_MIN;

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
  dayRunning: false,
  day: 1,
};

const SCHOOL_BLOCK_TEMPLATE = { id: "school", kind: "school", startMin: SCHOOL_START_MIN, endMin: SCHOOL_END_MIN };
let scheduleBlocks = [{ ...SCHOOL_BLOCK_TEMPLATE }];

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

function lerp(a, b, t) {
  return a + (b - a) * t;
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

function chooseTransportMode({ allowWalk, legLabel }) {
  return new Promise((resolve) => {
    const panel = document.getElementById("transport-choice");
    panel.hidden = false;
    panel.innerHTML = "";

    const heading = document.createElement("p");
    heading.textContent = `${legLabel} — 이동수단을 선택하세요`;
    panel.appendChild(heading);

    const row = document.createElement("div");
    row.className = "chip-row";

    function addOption(mode, label, disabled) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "transport-btn";
      btn.textContent = label;
      btn.disabled = disabled;
      btn.addEventListener("click", () => {
        panel.hidden = true;
        resolve(mode);
      });
      row.appendChild(btn);
    }

    if (allowWalk) addOption("walk", "도보로 직접 이동", false);
    addOption("bus", `버스 타기 (${BUS_FARE}원)`, state.character.wallet < BUS_FARE);
    addOption("subway", `지하철 타기 (${SUBWAY_FARE}원)`, state.character.wallet < SUBWAY_FARE);

    panel.appendChild(row);
  });
}

async function rideTransit(target, startClock, label) {
  const dist = distanceMeters(state.charPos, target);
  const gameMinutes = Math.max(5, Math.round(dist / TRANSIT_M_PER_MIN));
  const endClock = startClock + gameMinutes;
  const fromPos = { ...state.charPos };

  await animate(TRANSIT_RIDE_MS, (t) => {
    const lat = lerp(fromPos.lat, target.lat, t);
    const lng = lerp(fromPos.lng, target.lng, t);
    state.charPos = { lat, lng };
    state.charOverlay.setPosition(new kakao.maps.LatLng(lat, lng));
    state.map.setCenter(new kakao.maps.LatLng(lat, lng));
    setStatus(`${minutesToClock(lerp(startClock, endClock, t))} · ${label}`);
  });

  state.charPos = { ...target };
  state.charOverlay.setPosition(new kakao.maps.LatLng(target.lat, target.lng));
  setStatus(`${minutesToClock(endClock)} · ${label}`);
  return endClock;
}

async function travelTo(target, startClock, label, allowWalk) {
  const mode = await chooseTransportMode({ allowWalk, legLabel: label });
  if (mode === "walk") {
    return walkTo(target, startClock, label);
  }
  const fare = mode === "bus" ? BUS_FARE : SUBWAY_FARE;
  state.character.wallet -= fare;
  renderStats(state.character);
  logLine(`${mode === "bus" ? "버스" : "지하철"} 요금 ${fare}원 지불 (잔액 ${state.character.wallet}원)`);
  return rideTransit(target, startClock, `${mode === "bus" ? "버스" : "지하철"}로 ${label}`);
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

  const placeableAcademies = academies.filter((a) => a.location.etaMinFromHome != null);
  placeableAcademies.forEach((academy, i) => {
    const bearingDeg = (360 / placeableAcademies.length) * i;
    const isWalk = academy.location.mode === "walk";
    const mPerMin = isWalk ? CHILD_WALK_M_PER_MIN : TRANSIT_M_PER_MIN;
    const distanceM = academy.location.etaMinFromHome * mPerMin;
    const pos = offsetLatLng(homePos.lat, homePos.lng, distanceM, bearingDeg);
    state.positions.academies[academy.id] = pos;
    const category = state.categoryMap[academy.categoryId];
    const etaText = isWalk ? `도보 ${academy.location.etaMinFromHome}분` : `버스/지하철 약 ${academy.location.etaMinFromHome}분`;
    addMarker(map, pos, `<strong>${academy.name}</strong> (가상 위치)<br>${category.label} · ${etaText}`);
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
  condEl.innerHTML = `<p class="muted">허기 ${character.condition.hunger} · 체력(현재) ${character.condition.staminaNow} · 용돈 ${character.wallet}원</p>`;
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

function minutesToRow(min) {
  return (min - DAY_TIMELINE_START_MIN) / ROW_MIN;
}

function rowToMinutes(row) {
  return DAY_TIMELINE_START_MIN + row * ROW_MIN;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function rowFromPoint(clientX, clientY) {
  const rect = document.getElementById("timetable").getBoundingClientRect();
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
  const row = Math.floor((clientY - rect.top) / ROW_PX);
  return Math.min(Math.max(row, 0), TOTAL_ROWS - 1);
}

function flashReject() {
  const el = document.getElementById("timetable-wrap");
  el.classList.add("tt-reject");
  setTimeout(() => el.classList.remove("tt-reject"), 350);
}

let previewEl = null;
function updatePreview(range) {
  clearPreview();
  if (!range) return;
  const conflict = scheduleBlocks.some((b) => rangesOverlap(b.startMin, b.endMin, range.startMin, range.endMin));
  previewEl = document.createElement("div");
  previewEl.className = `tt-preview ${conflict ? "tt-preview-bad" : "tt-preview-ok"}`;
  previewEl.style.top = `${minutesToRow(range.startMin) * ROW_PX}px`;
  previewEl.style.height = `${(minutesToRow(range.endMin) - minutesToRow(range.startMin)) * ROW_PX}px`;
  document.getElementById("timetable").appendChild(previewEl);
}
function clearPreview() {
  if (previewEl) {
    previewEl.remove();
    previewEl = null;
  }
}

function moveGhostTo(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

function makeDraggable(chipEl, spec) {
  chipEl.addEventListener("pointerdown", (event) => {
    if (state.dayRunning) return;
    event.preventDefault();

    const ghost = chipEl.cloneNode(true);
    ghost.classList.add("drag-ghost");
    document.body.appendChild(ghost);
    moveGhostTo(ghost, event.clientX, event.clientY);

    function computeRange(clientX, clientY) {
      const row = rowFromPoint(clientX, clientY);
      if (row == null) return null;
      if (spec.kind === "school") {
        return { startMin: SCHOOL_START_MIN, endMin: SCHOOL_END_MIN };
      }
      const startMin = rowToMinutes(row);
      const endMin = startMin + ACADEMY_LESSON_MIN;
      if (endMin > DAY_TIMELINE_END_MIN) return null;
      return { startMin, endMin };
    }

    function onMove(ev) {
      moveGhostTo(ghost, ev.clientX, ev.clientY);
      updatePreview(computeRange(ev.clientX, ev.clientY));
    }

    function onUp(ev) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ghost.remove();
      clearPreview();

      const range = computeRange(ev.clientX, ev.clientY);
      if (!range) return;
      const conflict = scheduleBlocks.some((b) => rangesOverlap(b.startMin, b.endMin, range.startMin, range.endMin));
      if (conflict) {
        flashReject();
        return;
      }
      scheduleBlocks.push({
        id: spec.kind === "school" ? "school" : `academy-${spec.academyId}-${Date.now()}`,
        kind: spec.kind,
        academyId: spec.academyId,
        startMin: range.startMin,
        endMin: range.endMin,
      });
      scheduleBlocks.sort((a, b) => a.startMin - b.startMin);
      renderTimetable();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });
}

function createChip(label, spec, extraClass) {
  const chip = document.createElement("div");
  chip.className = `chip${extraClass ? ` ${extraClass}` : ""}`;
  chip.textContent = label;
  makeDraggable(chip, spec);
  return chip;
}

function renderPalette() {
  const el = document.getElementById("schedule-palette");
  el.innerHTML = "";

  const hasSchool = scheduleBlocks.some((b) => b.kind === "school");
  if (!hasSchool) {
    el.appendChild(createChip("학교 (09:00–16:00)", { kind: "school" }, "chip-school"));
  }

  state.academies
    .filter((a) => a.location.etaMinFromHome != null)
    .forEach((academy) => {
      const suffix = academy.location.mode === "walk" ? "" : " · 버스/지하철 전용";
      el.appendChild(
        createChip(`${academy.name} (${ACADEMY_LESSON_MIN}분${suffix})`, { kind: "academy", academyId: academy.id })
      );
    });
}

function renderTimetable() {
  const el = document.getElementById("timetable");
  el.innerHTML = "";
  el.style.height = `${TOTAL_ROWS * ROW_PX}px`;

  for (let row = 0; row <= TOTAL_ROWS; row++) {
    const min = rowToMinutes(row);
    if (min % 60 === 0) {
      const line = document.createElement("div");
      line.className = "tt-hour-line";
      line.style.top = `${row * ROW_PX}px`;
      line.textContent = minutesToClock(min);
      el.appendChild(line);
    }
  }

  scheduleBlocks.forEach((block) => {
    const top = minutesToRow(block.startMin) * ROW_PX;
    const height = minutesToRow(block.endMin) * ROW_PX - top;
    const div = document.createElement("div");
    div.className = `tt-block ${block.kind === "school" ? "tt-school" : "tt-academy"}`;
    div.style.top = `${top}px`;
    div.style.height = `${height}px`;

    const label = block.kind === "school" ? "학교" : state.academies.find((a) => a.id === block.academyId).name;
    const span = document.createElement("span");
    span.textContent = label;
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "tt-remove";
    removeBtn.setAttribute("aria-label", "일정 삭제");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      if (state.dayRunning) return;
      scheduleBlocks = scheduleBlocks.filter((b) => b.id !== block.id);
      renderTimetable();
    });

    div.appendChild(span);
    div.appendChild(removeBtn);
    el.appendChild(div);
  });

  renderPalette();
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

async function runDay(blocks) {
  document.getElementById("day-run").hidden = false;
  document.getElementById("day-summary").hidden = true;
  document.getElementById("day-log").innerHTML = "";

  state.charPos = { ...state.positions.home };
  state.charOverlay.setPosition(new kakao.maps.LatLng(state.charPos.lat, state.charPos.lng));

  let clock = DAY_TIMELINE_START_MIN;
  let atHome = true;
  let hadSchool = false;
  let schoolWasLate = false;
  let lastAllowWalk = true;

  if (blocks.length === 0) {
    logLine("오늘은 아무 일정도 없다 — 집에서 하루를 보냈다");
  }

  for (const block of blocks) {
    const isSchool = block.kind === "school";
    const academy = isSchool ? null : state.academies.find((a) => a.id === block.academyId);
    const targetPos = isSchool ? state.positions.school : state.positions.academies[block.academyId];
    const placeName = isSchool ? "학교" : academy.name;
    const allowWalk = isSchool || academy.location.mode === "walk";
    lastAllowWalk = allowWalk;

    logLine(`${minutesToClock(clock)} ${placeName}(으)로 이동 시작`);
    clock = await travelTo(targetPos, clock, `${placeName}로 이동 중`, allowWalk);
    atHome = false;

    const late = clock > block.startMin;
    if (isSchool) {
      hadSchool = true;
      schoolWasLate = late;
    }
    logLine(`${minutesToClock(clock)} ${placeName} 도착${late ? " — 지각" : ""}`);

    clock = Math.max(clock, block.startMin);
    await waitUntil(
      clock,
      block.endMin,
      isSchool ? (late ? "지각 — 수업 중 (점심 포함)" : "수업 중 (점심 포함)") : `${placeName} 수업`
    );
    clock = block.endMin;

    if (isSchool) applySchoolDayEffects();
    else applyAcademyEffects(academy);
  }

  if (!atHome) {
    logLine(`${minutesToClock(clock)} 집으로 귀가 이동`);
    clock = await travelTo(state.positions.home, clock, "집으로 귀가 중", lastAllowWalk);
    logLine(`${minutesToClock(clock)} 집 도착`);
  }

  applyEndOfDay();

  const summaryEl = document.getElementById("day-summary");
  summaryEl.hidden = false;
  const schoolPart = hadSchool ? (schoolWasLate ? "학교에 지각했다." : "학교에 정시 등교했다.") : "오늘은 학교를 가지 않았다.";
  summaryEl.textContent = `Day ${state.day} 완료 — ${schoolPart} 허기 ${state.character.condition.hunger} · 체력 ${state.character.condition.staminaNow}`;

  state.day += 1;
  document.getElementById("day-counter").textContent = `Day ${state.day}`;

  scheduleBlocks = [{ ...SCHOOL_BLOCK_TEMPLATE }];
  renderTimetable();

  state.dayRunning = false;
  const startBtn = document.getElementById("start-day-btn");
  startBtn.disabled = false;
  startBtn.textContent = "다음 날 일과 시작";
}

function wireScheduleEditor() {
  document.getElementById("start-day-btn").addEventListener("click", () => {
    if (state.dayRunning) return;
    state.dayRunning = true;
    document.getElementById("start-day-btn").disabled = true;
    const blocksForToday = scheduleBlocks.map((b) => ({ ...b }));
    runDay(blocksForToday);
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
  renderTimetable();
  await renderMap(character, academies);
  wireScheduleEditor();
  wireMovementControls();
}

main();
