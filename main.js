const STAT_LABELS = {
  intellect: "지력",
  stamina: "체력",
  power: "근력",
  art: "감성",
  social: "사회성",
  diligence: "성실성",
};

const STAT_ICONS = {
  intellect: "📖",
  stamina: "❤️",
  power: "💪",
  art: "🎨",
  social: "🗣️",
  diligence: "✍️",
};

const CONDITION_ICONS = { hunger: "🍚", staminaNow: "⚡", stress: "😵", wallet: "💰" };
const CONDITION_LABELS = { hunger: "허기", staminaNow: "체력", stress: "스트레스", wallet: "용돈" };
const SCHOOL_ICON = "🏫";

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

class DayCancelledEarly extends Error {
  constructor(clock) {
    super("cancelled");
    this.clock = clock;
  }
}

const BUS_FARE = 450;
const SUBWAY_FARE = 450;
const TRANSIT_M_PER_MIN = 220;
const TRANSIT_RIDE_MS = 1800;

const SCHOOL_STRESS = 10;
const ACADEMY_STRESS = 18;
const DAILY_STRESS_RECOVERY = 15;
const NO_SCHEDULE_STRESS_RECOVERY = 30;
const STRESS_ILLNESS_THRESHOLD = 80;
const STRESS_ILLNESS_RELIEF = 40;

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
  activities: [],
  items: [],
  categoryMap: {},
  positions: { home: null, school: null, academies: {}, activities: {} },
  stations: { subway: [], bus: [] },
  charPos: null,
  charOverlay: null,
  map: null,
  walkModeActive: false,
  dayRunning: false,
  day: 1,
  holidaySet: new Set(),
};

const SCHOOL_BLOCK_TEMPLATE = { id: "school", kind: "school", startMin: SCHOOL_START_MIN, endMin: SCHOOL_END_MIN };
let scheduleBlocks = [{ ...SCHOOL_BLOCK_TEMPLATE }];

const GAME_START_DATE_UTC = Date.UTC(2026, 2, 1); // Day 1 = 2026년 3월 1일 일요일
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function gameDateForDay(dayNumber) {
  return new Date(GAME_START_DATE_UTC + (dayNumber - 1) * 86400000);
}

function gameDateKey(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatGameDate(date) {
  return `${date.getUTCFullYear()}년 ${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일 ${WEEKDAY_LABELS[date.getUTCDay()]}요일`;
}

function isSchoolDay(dayNumber) {
  const date = gameDateForDay(dayNumber);
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !state.holidaySet.has(gameDateKey(date));
}

function renderDayHeader() {
  const date = gameDateForDay(state.day);
  document.getElementById("game-date").textContent = formatGameDate(date);
  document.getElementById("day-counter").textContent = `Day ${state.day}`;
}

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

async function resolvePlace(address, placeQuery, fallbackPos) {
  if (address) {
    try {
      return await geocodeAddress(address);
    } catch (err) {
      console.warn(err);
    }
  }
  if (placeQuery) {
    try {
      return await keywordSearch(placeQuery);
    } catch (err) {
      console.warn(err);
    }
  }
  return fallbackPos;
}

function nearestStation(pos, list) {
  let best = null;
  for (const s of list) {
    const d = distanceMeters(pos, s.pos);
    if (!best || d < best.dist) best = { ...s, dist: d };
  }
  return best;
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

function createBusStopOverlay(map, position, name, title) {
  const el = document.createElement("div");
  el.className = "bus-stop-marker";
  el.title = title ?? name;
  el.innerHTML = `<span class="bus-badge">B</span><span class="bus-label">${name}</span>`;
  return new kakao.maps.CustomOverlay({
    map,
    position: new kakao.maps.LatLng(position.lat, position.lng),
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

function nearbyStationId(list) {
  const nearest = nearestStation(state.charPos, list);
  return nearest && nearest.dist <= ARRIVAL_RADIUS_M ? nearest.id : null;
}

function walkTo(target, startClock, label, { allowEarlyHome = false } = {}) {
  return new Promise((resolve, reject) => {
    state.walkModeActive = true;
    showDpad(true);

    let clock = startClock;
    let last = performance.now();
    let confirmingHome = false;
    let hasLeftHome = !allowEarlyHome || distanceMeters(state.charPos, state.positions.home) > ARRIVAL_RADIUS_M;
    let suppressedBusStopId = nearbyStationId(state.stations.bus);
    let suppressedSubwayId = nearbyStationId(state.stations.subway);
    let boarding = false;

    function boardAt(kind, currentStation) {
      boarding = true;
      state.walkModeActive = false;
      showDpad(false);
      const stations = kind === "bus" ? state.stations.bus : state.stations.subway;
      const modeLabel = kind === "bus" ? "버스" : "지하철";
      const fare = kind === "bus" ? BUS_FARE : SUBWAY_FARE;

      chooseRideDestination(kind, currentStation, stations).then((dest) => {
        if (!dest) {
          if (kind === "bus") suppressedBusStopId = currentStation.id;
          else suppressedSubwayId = currentStation.id;
          boarding = false;
          state.walkModeActive = true;
          showDpad(true);
          last = performance.now();
          requestAnimationFrame(frame);
          return;
        }

        state.character.wallet -= fare;
        renderStats(state.character);
        logLine(`${modeLabel} 요금 ${fare}원 지불 (잔액 ${state.character.wallet}원)`);

        rideTransit(dest.pos, clock, `${modeLabel}로 ${dest.name}까지 이동`).then((endClock) => {
          clock = endClock;
          logLine(`${minutesToClock(clock)} ${dest.name} 도착`);
          suppressedBusStopId = kind === "bus" ? dest.id : suppressedBusStopId;
          suppressedSubwayId = kind === "subway" ? dest.id : suppressedSubwayId;
          boarding = false;
          state.walkModeActive = true;
          showDpad(true);
          last = performance.now();
          requestAnimationFrame(frame);
        });
      });
    }

    function frame(now) {
      if (confirmingHome || boarding) return;

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

      if (allowEarlyHome) {
        const homeDist = distanceMeters(state.charPos, state.positions.home);
        if (!hasLeftHome && homeDist > ARRIVAL_RADIUS_M) hasLeftHome = true;
        if (hasLeftHome && homeDist <= ARRIVAL_RADIUS_M) {
          confirmingHome = true;
          state.walkModeActive = false;
          showDpad(false);
          confirmGoHomeEarly().then((yes) => {
            if (yes) {
              reject(new DayCancelledEarly(clock));
              return;
            }
            confirmingHome = false;
            hasLeftHome = false;
            state.walkModeActive = true;
            showDpad(true);
            last = performance.now();
            requestAnimationFrame(frame);
          });
          return;
        }
      }

      const nearBus = nearestStation(state.charPos, state.stations.bus);
      if (nearBus && nearBus.dist <= ARRIVAL_RADIUS_M && nearBus.id !== suppressedBusStopId) {
        logLine(`${minutesToClock(clock)} ${nearBus.name} 도착`);
        boardAt("bus", nearBus);
        return;
      }
      if (!nearBus || nearBus.dist > ARRIVAL_RADIUS_M) suppressedBusStopId = null;

      const nearSubway = nearestStation(state.charPos, state.stations.subway);
      if (nearSubway && nearSubway.dist <= ARRIVAL_RADIUS_M && nearSubway.id !== suppressedSubwayId) {
        logLine(`${minutesToClock(clock)} ${nearSubway.name} 도착`);
        boardAt("subway", nearSubway);
        return;
      }
      if (!nearSubway || nearSubway.dist > ARRIVAL_RADIUS_M) suppressedSubwayId = null;

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

function chooseRideDestination(kind, currentStation, stations) {
  return new Promise((resolve) => {
    const panel = document.getElementById("transport-choice");
    panel.hidden = false;
    panel.innerHTML = "";

    const modeLabel = kind === "bus" ? "버스를" : "지하철을";
    const fare = kind === "bus" ? BUS_FARE : SUBWAY_FARE;

    const heading = document.createElement("p");
    heading.textContent = `${currentStation.name} 도착 — ${modeLabel} 타고 어디로 갈까요?`;
    panel.appendChild(heading);

    const row = document.createElement("div");
    row.className = "chip-row";

    function addOption(label, value, disabled) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "transport-btn";
      btn.textContent = label;
      btn.disabled = !!disabled;
      btn.addEventListener("click", () => {
        panel.hidden = true;
        resolve(value);
      });
      row.appendChild(btn);
    }

    addOption("그냥 걷기", null, false);
    stations
      .filter((s) => s.id !== currentStation.id)
      .forEach((s) => addOption(`${s.name} (${fare}원)`, s, state.character.wallet < fare));

    panel.appendChild(row);
  });
}

function confirmGoHomeEarly() {
  return new Promise((resolve) => {
    const panel = document.getElementById("home-confirm");
    panel.hidden = false;
    panel.innerHTML = "";

    const heading = document.createElement("p");
    heading.textContent = "일정을 취소하고 집에 들어갑니다";
    panel.appendChild(heading);

    const row = document.createElement("div");
    row.className = "chip-row";

    function addOption(label, value) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "transport-btn";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        panel.hidden = true;
        resolve(value);
      });
      row.appendChild(btn);
    }

    addOption("예", true);
    addOption("아니오", false);

    panel.appendChild(row);
  });
}

function chooseHomeActivity(homeActivities) {
  return new Promise((resolve) => {
    const panel = document.getElementById("home-confirm");
    panel.hidden = false;
    panel.innerHTML = "";

    const heading = document.createElement("p");
    heading.textContent = "집에서 무엇을 할까요?";
    panel.appendChild(heading);

    const row = document.createElement("div");
    row.className = "chip-row";

    function addOption(label, value) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "transport-btn";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        panel.hidden = true;
        resolve(value);
      });
      row.appendChild(btn);
    }

    homeActivities.forEach((activity) => addOption(activity.name, activity));
    addOption("그냥 쉬기", null);

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

function travelTo(target, startClock, placeName) {
  const allowEarlyHome = target !== state.positions.home;
  return walkTo(target, startClock, `${placeName}(으)로 이동 중`, { allowEarlyHome });
}

async function renderMap(character, academies, activities, stations) {
  const map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(HOME_FALLBACK.lat, HOME_FALLBACK.lng),
    level: MAP_ZOOM_LEVEL,
  });
  state.map = map;

  const homePos = await resolveHomePosition(character.home);
  state.positions.home = homePos;
  map.setCenter(new kakao.maps.LatLng(homePos.lat, homePos.lng));
  addMarker(map, homePos, `집 — 금호파크힐스 113동<br>${character.home.address}`);

  const schoolFallback = offsetLatLng(homePos.lat, homePos.lng, HOME_SCHOOL_WALK_MIN * CHILD_WALK_M_PER_MIN, 45);
  state.positions.school = await resolvePlace(character.school.address, null, schoolFallback);
  addMarker(map, state.positions.school, `학교 — ${character.school.name}<br>${character.school.address}`);

  const placeableAcademies = academies.filter((a) => a.location.etaMinFromHome != null);
  for (let i = 0; i < placeableAcademies.length; i++) {
    const academy = placeableAcademies[i];
    const bearingDeg = (360 / placeableAcademies.length) * i;
    const isWalk = academy.location.mode === "walk";
    const mPerMin = isWalk ? CHILD_WALK_M_PER_MIN : TRANSIT_M_PER_MIN;
    const distanceM = academy.location.etaMinFromHome * mPerMin;
    const fallbackPos = offsetLatLng(homePos.lat, homePos.lng, distanceM, bearingDeg);
    const pos = await resolvePlace(academy.address, null, fallbackPos);
    state.positions.academies[academy.id] = pos;
    const category = state.categoryMap[academy.categoryId];
    const etaText = isWalk ? `도보 ${academy.location.etaMinFromHome}분` : `버스/지하철 약 ${academy.location.etaMinFromHome}분`;
    addMarker(map, pos, `<strong>${academy.name}</strong><br>${category.label} · ${etaText}`);
  }

  for (const activity of activities) {
    if (activity.location === "home") continue;
    const fallbackPos = offsetLatLng(homePos.lat, homePos.lng, (activity.travelMin ?? 15) * CHILD_WALK_M_PER_MIN, 200);
    const pos = await resolvePlace(activity.address, activity.placeQuery, fallbackPos);
    state.positions.activities[activity.id] = pos;
    addMarker(map, pos, `<strong>${activity.name}</strong><br>${activity.address ?? ""}`);
  }

  for (const station of stations.subway) {
    const fallbackPos = offsetLatLng(homePos.lat, homePos.lng, 1000, 0);
    const pos = await resolvePlace(station.address, null, fallbackPos);
    state.stations.subway.push({ ...station, pos });
    addMarker(map, pos, `🚇 ${station.name}`);
  }

  for (let i = 0; i < stations.bus.length; i++) {
    const stop = stations.bus[i];
    const bearingDeg = (360 / stations.bus.length) * i;
    const fallbackPos = offsetLatLng(homePos.lat, homePos.lng, 350, bearingDeg);
    const pos = await resolvePlace(stop.address, null, fallbackPos);
    state.stations.bus.push({ ...stop, pos });
    const note = stop.address ? "" : " (가상 위치)";
    createBusStopOverlay(map, pos, stop.name, `정류장 코드 ${stop.code}${note}`);
  }

  state.charPos = { ...homePos };
  state.charOverlay = createCharacterOverlay(map, homePos);
}

function renderStats(character) {
  document.getElementById("char-name").textContent = character.name;

  const statsEl = document.getElementById("stats");
  statsEl.innerHTML = "";
  Object.entries(character.stats).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <span class="icon">${STAT_ICONS[key] ?? ""}</span>
      <span class="label">${STAT_LABELS[key] ?? key}</span>
      <span class="bar"><span style="width:${Math.min(value, 100)}%"></span></span>
      <span class="value">${value}</span>
    `;
    statsEl.appendChild(row);
  });

  const condEl = document.getElementById("condition");
  const stress = character.condition.stress;
  const stressWarning = stress >= STRESS_ILLNESS_THRESHOLD;
  condEl.innerHTML = `
    <div class="condition-row">
      <span class="condition-badge">${CONDITION_ICONS.hunger} 허기 ${character.condition.hunger}</span>
      <span class="condition-badge">${CONDITION_ICONS.staminaNow} 체력 ${character.condition.staminaNow}</span>
      <span class="condition-badge${stressWarning ? " warning" : ""}">${CONDITION_ICONS.stress} 스트레스 ${stress}</span>
      <span class="condition-badge">${CONDITION_ICONS.wallet} ${character.wallet}원</span>
    </div>
  `;
}

function renderAcademies(academies, categoryMap) {
  const el = document.getElementById("academies");
  el.innerHTML = "";

  academies.forEach((academy) => {
    const category = categoryMap[academy.categoryId];
    const growthText = Object.entries(category.growth)
      .map(([stat, amount]) => `${STAT_LABELS[stat] ?? stat} +${amount}`)
      .join(" · ");
    const hoursText = academy.hours ? `운영 ${academy.hours.open}~${academy.hours.close}` : "운영시간 미정";
    const addressText = academy.address ?? "위치 미정";

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="item-icon">${category.icon ?? "🏫"}</span>
      <span>
        <strong>${academy.name}</strong> (${category.label})<br>
        <span class="muted">${growthText} · ${hoursText} · ${addressText} (집에서 ${academy.location.mode === "walk" ? "도보" : "이동"} ${academy.location.etaMinFromHome}분)</span>
      </span>
    `;
    el.appendChild(li);
  });
}

function applyEffect(effect) {
  Object.entries(effect).forEach(([key, amount]) => {
    if (key === "wallet") {
      state.character.wallet = Math.max(0, state.character.wallet + amount);
    } else if (key === "hunger" || key === "staminaNow" || key === "stress") {
      state.character.condition[key] = Math.min(100, Math.max(0, state.character.condition[key] + amount));
    } else {
      state.character.stats[key] = Math.min(100, Math.max(0, (state.character.stats[key] ?? 0) + amount));
    }
  });
}

function effectText(effect) {
  return Object.entries(effect)
    .map(([key, amount]) => `${STAT_LABELS[key] ?? (key === "hunger" ? "허기" : key)} +${amount}`)
    .join(" · ");
}

function signedEffectText(effect) {
  return Object.entries(effect)
    .map(([key, amount]) => {
      const sign = amount >= 0 ? "+" : "";
      if (key === "wallet") return `용돈 ${sign}${amount}원`;
      const label = STAT_LABELS[key] ?? CONDITION_LABELS[key] ?? key;
      return `${label} ${sign}${amount}`;
    })
    .join(" · ");
}

function renderActivityInfo() {
  const el = document.getElementById("activities-info");
  el.innerHTML = "";

  state.activities.forEach((activity) => {
    const hoursText = activity.hours ? `운영 ${activity.hours.open}~${activity.hours.close}` : "시간 제한 없음";
    const locationText = activity.location === "home" ? "집" : activity.address ?? "위치 미정";
    const modeTag = activity.location !== "home" && activity.mode === "transit" ? " · 버스/지하철 권장(도보는 멀어요)" : "";

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="item-icon">${activity.icon}</span>
      <span>
        <strong>${activity.name}</strong> (${activity.durationMin}분)<br>
        <span class="muted">${signedEffectText(activity.effect)} · ${locationText}${activity.location === "home" ? "" : ` · ${hoursText}`}${modeTag}</span>
      </span>
    `;
    el.appendChild(li);
  });
}

function showShopFeedback(text) {
  const el = document.getElementById("shop-feedback");
  el.hidden = false;
  el.textContent = text;
}

function renderShop() {
  const el = document.getElementById("shop-items");
  el.innerHTML = "";

  state.items.forEach((item) => {
    const li = document.createElement("li");
    const disabled = state.dayRunning || state.character.wallet < item.price;

    const itemRow = document.createElement("div");
    itemRow.className = "item-row";
    itemRow.innerHTML = `
      <span class="item-icon">${item.icon ?? "🎁"}</span>
      <span><strong>${item.name}</strong> — ${item.price}원<br><span class="muted">${item.description} (${effectText(item.effect)})</span></span>
    `;

    const buyBtn = document.createElement("button");
    buyBtn.type = "button";
    buyBtn.className = "shop-buy-btn";
    buyBtn.textContent = "구매";
    buyBtn.disabled = disabled;
    buyBtn.addEventListener("click", () => {
      if (state.dayRunning || state.character.wallet < item.price) return;
      state.character.wallet -= item.price;
      applyEffect(item.effect);
      renderStats(state.character);
      renderShop();
      showShopFeedback(`${item.icon ?? ""} ${item.name}을(를) 샀다! ${effectText(item.effect)} (잔액 ${state.character.wallet}원)`);
    });

    li.appendChild(itemRow);
    li.appendChild(buyBtn);
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
      const durationMin = spec.kind === "activity" ? spec.durationMin : ACADEMY_LESSON_MIN;
      const startMin = rowToMinutes(row);
      const endMin = startMin + durationMin;
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
        id: spec.kind === "school" ? "school" : `${spec.kind}-${spec.academyId ?? spec.activityId ?? "x"}-${Date.now()}`,
        kind: spec.kind,
        academyId: spec.academyId,
        activityId: spec.activityId,
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

function createChip(icon, label, spec, extraClass) {
  const chip = document.createElement("div");
  chip.className = `chip${extraClass ? ` ${extraClass}` : ""}`;
  chip.innerHTML = `<span class="chip-icon">${icon}</span><span>${label}</span>`;
  makeDraggable(chip, spec);
  return chip;
}

function renderPalette() {
  const el = document.getElementById("schedule-palette");
  el.innerHTML = "";

  const hasSchool = scheduleBlocks.some((b) => b.kind === "school");
  if (!hasSchool) {
    el.appendChild(createChip(SCHOOL_ICON, "학교 (09:00–16:00)", { kind: "school" }, "chip-school"));
  }

  state.activities.forEach((activity) => {
    el.appendChild(
      createChip(
        activity.icon,
        `${activity.name} (${activity.durationMin}분)`,
        { kind: "activity", activityId: activity.id, durationMin: activity.durationMin },
        "chip-activity"
      )
    );
  });

  state.academies
    .filter((a) => a.location.etaMinFromHome != null)
    .forEach((academy) => {
      const category = state.categoryMap[academy.categoryId];
      const suffix = academy.location.mode === "walk" ? "" : " · 버스/지하철 권장(도보는 멀어요)";
      el.appendChild(
        createChip(
          category.icon ?? "🏫",
          `${academy.name} (${ACADEMY_LESSON_MIN}분${suffix})`,
          { kind: "academy", academyId: academy.id },
          "chip-academy"
        )
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
    const kindClass = block.kind === "school" ? "tt-school" : block.kind === "activity" ? "tt-activity" : "tt-academy";
    const div = document.createElement("div");
    div.className = `tt-block ${kindClass}`;
    div.style.top = `${top}px`;
    div.style.height = `${height}px`;

    let icon = SCHOOL_ICON;
    let label = "학교";
    if (block.kind === "activity") {
      const activity = state.activities.find((a) => a.id === block.activityId);
      icon = activity.icon;
      label = activity.name;
    } else if (block.kind === "academy") {
      const academy = state.academies.find((a) => a.id === block.academyId);
      icon = state.categoryMap[academy.categoryId]?.icon ?? "🏫";
      label = academy.name;
    }
    const span = document.createElement("span");
    span.className = "tt-label";
    span.innerHTML = `<span>${icon}</span><span>${label}</span>`;
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

function addStress(amount) {
  state.character.condition.stress = Math.max(0, Math.min(100, state.character.condition.stress + amount));
}

function applySchoolDayEffects() {
  state.character.condition.hunger = 80;
  state.character.condition.staminaNow = Math.max(0, state.character.condition.staminaNow - 10);
  addStress(SCHOOL_STRESS);
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
  addStress(ACADEMY_STRESS);
  renderStats(state.character);

  const growthText = Object.entries(category.growth)
    .map(([stat, amount]) => `${STAT_LABELS[stat]} +${amount}`)
    .join(" · ");
  logLine(`${academy.name} 수업 완료 — ${growthText}`);
}

function applyActivityEffects(activity) {
  applyEffect(activity.effect);
  renderStats(state.character);
  logLine(`${activity.name} 완료 — ${signedEffectText(activity.effect)}`);
}

function triggerIllness() {
  state.character.condition.stress = Math.max(0, state.character.condition.stress - STRESS_ILLNESS_RELIEF);
  renderStats(state.character);
  logLine("스트레스가 너무 쌓여 몸살이 났다 — 나머지 일정을 취소하고 집으로 돌아갔다");
}

function applyEndOfDay(stressRecovery) {
  state.character.condition.hunger = 90;
  state.character.condition.staminaNow = Math.min(100, state.character.condition.staminaNow + 10);
  state.character.condition.stress = Math.max(0, state.character.condition.stress - stressRecovery);
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
  let gotSick = false;
  let cancelledEarly = false;

  if (blocks.length === 0) {
    logLine("오늘은 아무 일정도 없다 — 집에서 하루를 보냈다");
  }

  try {
    for (const block of blocks) {
      const isSchool = block.kind === "school";
      const isActivity = block.kind === "activity";
      const academy = isSchool || isActivity ? null : state.academies.find((a) => a.id === block.academyId);
      const activity = isActivity ? state.activities.find((a) => a.id === block.activityId) : null;
      const isHomeActivity = isActivity && activity.location === "home";

      const targetPos = isSchool
        ? state.positions.school
        : isHomeActivity
        ? state.positions.home
        : isActivity
        ? state.positions.activities[activity.id]
        : state.positions.academies[block.academyId];
      const placeName = isSchool ? "학교" : isActivity ? activity.name : academy.name;

      if (isHomeActivity && atHome) {
        logLine(`${minutesToClock(clock)} 집에서 ${placeName} 시작`);
      } else {
        logLine(`${minutesToClock(clock)} ${placeName}(으)로 이동 시작`);
        clock = await travelTo(targetPos, clock, placeName);
        atHome = isHomeActivity;

        const late = clock > block.startMin;
        if (isSchool) {
          hadSchool = true;
          schoolWasLate = late;
        }
        logLine(`${minutesToClock(clock)} ${placeName} 도착${late ? " — 지각" : ""}`);
      }

      clock = Math.max(clock, block.startMin);
      await waitUntil(
        clock,
        block.endMin,
        isSchool ? "수업 중 (점심 포함)" : isActivity ? `${placeName} 중` : `${placeName} 수업`
      );
      clock = block.endMin;

      if (isSchool) applySchoolDayEffects();
      else if (isActivity) applyActivityEffects(activity);
      else applyAcademyEffects(academy);

      if (state.character.condition.stress >= STRESS_ILLNESS_THRESHOLD) {
        triggerIllness();
        gotSick = true;
        break;
      }
    }
  } catch (err) {
    if (!(err instanceof DayCancelledEarly)) throw err;
    cancelledEarly = true;
    clock = err.clock;
    atHome = true;
    logLine(`${minutesToClock(clock)} 일정을 취소하고 집으로 돌아왔다`);
  }

  if (!atHome) {
    logLine(`${minutesToClock(clock)} 집으로 귀가 이동`);
    clock = await travelTo(state.positions.home, clock, "집");
    logLine(`${minutesToClock(clock)} 집 도착`);
  }

  if (cancelledEarly) {
    const homeActivities = state.activities.filter((a) => a.location === "home");
    const choice = await chooseHomeActivity(homeActivities);
    if (choice) {
      logLine(`${minutesToClock(clock)} 집에서 ${choice.name} 시작`);
      const endClock = clock + choice.durationMin;
      await waitUntil(clock, endClock, `${choice.name} 중`);
      clock = endClock;
      applyActivityEffects(choice);
    } else {
      logLine(`${minutesToClock(clock)} 그냥 쉬었다`);
    }
  }

  const stressRecovery = blocks.length === 0 ? NO_SCHEDULE_STRESS_RECOVERY : DAILY_STRESS_RECOVERY;
  applyEndOfDay(stressRecovery);

  const summaryEl = document.getElementById("day-summary");
  summaryEl.hidden = false;
  const schoolPart = hadSchool ? (schoolWasLate ? "학교에 지각했다." : "학교에 정시 등교했다.") : "오늘은 학교를 가지 않았다.";
  const sickPart = gotSick ? " 너무 무리해서 몸살이 났다." : "";
  const cancelPart = cancelledEarly ? " 도중에 일정을 취소하고 집에 돌아왔다." : "";
  summaryEl.textContent = `Day ${state.day} 완료 — ${schoolPart}${sickPart}${cancelPart} 허기 ${state.character.condition.hunger} · 체력 ${state.character.condition.staminaNow} · 스트레스 ${state.character.condition.stress}`;

  state.day += 1;
  renderDayHeader();

  scheduleBlocks = isSchoolDay(state.day) ? [{ ...SCHOOL_BLOCK_TEMPLATE }] : [];
  renderTimetable();

  state.dayRunning = false;
  const startBtn = document.getElementById("start-day-btn");
  startBtn.disabled = false;
  startBtn.textContent = "다음 날 일과 시작";
  renderShop();
}

function showView(name) {
  document.querySelectorAll(".view").forEach((el) => {
    el.hidden = el.id !== `view-${name}`;
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });
  document.getElementById("main-view").dataset.view = name;

  if (name === "map" && state.map) {
    state.map.relayout();
    if (state.charPos) {
      state.map.setCenter(new kakao.maps.LatLng(state.charPos.lat, state.charPos.lng));
    }
  }
}

function wireNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });
  showView("schedule");
}

function wireScheduleEditor() {
  document.getElementById("start-day-btn").addEventListener("click", () => {
    if (state.dayRunning) return;
    state.dayRunning = true;
    document.getElementById("start-day-btn").disabled = true;
    renderShop();
    showView("map");
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

  const [character, academies, categories, items, activities, stations, holidays] = await Promise.all([
    loadJSON("data/character.json"),
    loadJSON("data/academies.json"),
    loadJSON("data/academy_categories.json"),
    loadJSON("data/items.json"),
    loadJSON("data/activities.json"),
    loadJSON("data/stations.json"),
    loadJSON("data/holidays.json"),
  ]);

  state.character = character;
  state.academies = academies;
  state.items = items;
  state.activities = activities;
  state.categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  state.holidaySet = new Set(holidays.map((h) => h.date));

  renderDayHeader();
  scheduleBlocks = isSchoolDay(state.day) ? [{ ...SCHOOL_BLOCK_TEMPLATE }] : [];

  renderStats(character);
  renderAcademies(academies, state.categoryMap);
  renderActivityInfo();
  renderTimetable();
  renderShop();
  await renderMap(character, academies, activities, stations);
  wireScheduleEditor();
  wireMovementControls();
  wireNav();
}

main();
