// 능력치 3분류 (신체능력 · 학습능력 · 성격/인성)
const STAT_GROUPS = [
  { id: "body", label: "신체능력", icon: "🏃", stats: ["stamina", "power", "agility", "dexterity"] },
  { id: "study", label: "학습능력", icon: "📚", stats: ["language", "math", "perception", "logic", "focus", "expression"] },
  { id: "character", label: "성격/인성", icon: "💖", stats: ["social", "diligence", "insa", "selfEsteem", "digital", "delinquency"] },
];

const STAT_LABELS = {
  stamina: "체력",
  power: "근력",
  agility: "순발력",
  dexterity: "손재주",
  language: "언어",
  math: "수리",
  perception: "지각",
  logic: "논리",
  focus: "집중력",
  expression: "표현력",
  social: "사회성",
  diligence: "성실성",
  insa: "인싸력",
  selfEsteem: "자존감",
  digital: "디지털",
  delinquency: "비행화",
};

const STAT_ICONS = {
  stamina: "❤️",
  power: "💪",
  agility: "⚡",
  dexterity: "✋",
  language: "📖",
  math: "🧮",
  perception: "🔍",
  logic: "🧩",
  focus: "🎯",
  expression: "🎨",
  social: "🗣️",
  diligence: "✍️",
  insa: "⭐",
  selfEsteem: "🌟",
  digital: "💻",
  delinquency: "😈",
};

// 높을수록 나쁜 능력치 — 게이지 색을 다르게 표시
const NEGATIVE_STATS = new Set(["delinquency"]);

const CONDITION_ICONS = { hunger: "🍚", staminaNow: "🔋", stress: "😵", wallet: "💰" };
const CONDITION_LABELS = { hunger: "허기", staminaNow: "기력", stress: "스트레스", wallet: "용돈" };
const SCHOOL_ICON = "🏫";

const HOME_FALLBACK = { lat: 37.5495, lng: 127.0203 };
const CHILD_WALK_M_PER_MIN = 70;
const HOME_SCHOOL_WALK_MIN = 10;
// 학교 시간표 기본값 — 실제 값은 data/school_schedule.json에서 읽어 덮어쓴다.
let SCHOOL_START_MIN = 8 * 60 + 30;
let SCHOOL_LATE_MIN = 8 * 60 + 50;
const MORNING_CARE_LATE_MIN = 9 * 60;
const SEGMENT_PHASE_MS = 650;
const AFTERSCHOOL_STRESS = 8;
const AUTONOMOUS_STUDY_STRESS = 6;
const AUTONOMOUS_STUDY_EFFECT = { focus: 1, diligence: 1, staminaNow: -3 };

// 돌발사건 — 걷는 동안 게임 1분마다 확률 판정
const EVENT_CHANCE_PER_MIN = 0.07;
const EVENT_COOLDOWN_MIN = 6;
const MAX_EVENTS_PER_DAY = 3;
const HOTPLACE_SEARCH_RADIUS_M = 900;
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
  hotplaces: [],
  walkModeActive: false,
  requestPhone: null,
  school: null,
  subjectMap: {},
  afterschoolCourses: [],
  neulbom: null,
  events: [],
  phone: null,
  safetyEducated: false,
  creativeCount: 0,
  eventsToday: 0,
  lastEventClock: -Infinity,
  calledToday: new Set(),
  registrations: { active: {}, pending: {} },
  ui: { afterschoolCourse: null, careProgram: null },
  dayRunning: false,
  day: 1,
  holidaySet: new Set(),
};

let scheduleBlocks = [];

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

function weekdayOf(dayNumber) {
  return gameDateForDay(dayNumber).getUTCDay();
}

function vacationOf(dayNumber) {
  const key = gameDateKey(gameDateForDay(dayNumber));
  return (state.school?.vacations ?? []).find((v) => key >= v.start && key <= v.end) ?? null;
}

function isSchoolDay(dayNumber) {
  const date = gameDateForDay(dayNumber);
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  if (vacationOf(dayNumber)) return false;
  return !state.holidaySet.has(gameDateKey(date));
}

function isWeekday(dayNumber) {
  const dow = weekdayOf(dayNumber);
  return dow >= 1 && dow <= 5;
}

function clockToMinutes(text) {
  const [h, m] = text.split(":").map(Number);
  return h * 60 + m;
}

// 요일별 정규수업 시간 — 월·금은 4교시, 화·수·목은 5교시 후 하교
function schoolTimesFor(dayNumber) {
  const dow = weekdayOf(dayNumber);
  const lastPeriod = state.school?.lastPeriodByWeekday?.[dow] ?? 5;
  const segs = state.school?.segments ?? [];
  const last = segs.find((s) => s.type === "period" && s.period === lastPeriod);
  const endMin = last ? last.endMin : 13 * 60 + 40;
  return { startMin: SCHOOL_START_MIN, endMin, lastPeriod };
}

// 방과후교육: 마지막 수업 후 20분 휴식 → 1차시 40분 → 10분 휴식 → 2차시 40분
function afterschoolTimesFor(dayNumber) {
  const cfg = state.school?.afterschool ?? { breakBeforeMin: 20, periodMin: 40, breakBetweenMin: 10 };
  const { endMin: schoolEnd } = schoolTimesFor(dayNumber);
  const startMin = schoolEnd + cfg.breakBeforeMin;
  const p1End = startMin + cfg.periodMin;
  const p2Start = p1End + cfg.breakBetweenMin;
  return { startMin, p1End, p2Start, endMin: p2Start + cfg.periodMin };
}

function schoolBlockFor(dayNumber) {
  const { startMin, endMin } = schoolTimesFor(dayNumber);
  return { id: "school", kind: "school", startMin, endMin };
}

function isRegisteredSlot(academyId, dow, startMin) {
  const reg = state.registrations.active[academyId];
  return !!reg && reg.days.includes(dow) && reg.startMin === startMin;
}

// 하루 기본 시간표: 등교일이면 학교, 그리고 이번 주에 등록된 학원 수업
function buildDefaultBlocks(dayNumber) {
  const blocks = [];
  if (isSchoolDay(dayNumber)) blocks.push(schoolBlockFor(dayNumber));
  const dow = weekdayOf(dayNumber);
  Object.entries(state.registrations.active).forEach(([academyId, reg]) => {
    if (!reg.days.includes(dow)) return;
    const startMin = reg.startMin;
    const endMin = startMin + ACADEMY_LESSON_MIN;
    if (blocks.some((b) => rangesOverlap(b.startMin, b.endMin, startMin, endMin))) return;
    blocks.push({ id: `academy-${academyId}-reg`, kind: "academy", academyId, startMin, endMin });
  });
  return blocks.sort((a, b) => a.startMin - b.startMin);
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

// 집 주변 반경 안에서 가장 가까운 장소를 키워드로 찾는다 (핫플레이스용)
function keywordSearchNear(query, center, radius) {
  return new Promise((resolve, reject) => {
    new kakao.maps.services.Places().keywordSearch(
      query,
      (result, status) => {
        if (status === kakao.maps.services.Status.OK && result[0]) {
          resolve({ lat: Number(result[0].y), lng: Number(result[0].x), placeName: result[0].place_name });
        } else {
          reject(new Error(`주변 장소 검색 실패: ${query}`));
        }
      },
      {
        location: new kakao.maps.LatLng(center.lat, center.lng),
        radius,
        sort: kakao.maps.services.SortBy.DISTANCE,
      }
    );
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

function createHotplaceOverlay(map, position, place) {
  const el = document.createElement("div");
  el.className = "bus-stop-marker hot-marker";
  el.title = place.realName ? `${place.name} — ${place.realName}` : place.name;
  el.innerHTML = `<span class="bus-badge hot-badge">H</span><span class="bus-label">${place.icon} ${place.name}</span>`;
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
  document.getElementById("phone-btn").hidden = !visible;
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
    let clock = startClock;
    let last = performance.now();
    let paused = false;
    let walkedMinAcc = 0;
    let hasLeftHome = !allowEarlyHome || distanceMeters(state.charPos, state.positions.home) > ARRIVAL_RADIUS_M;
    const suppressed = {
      bus: nearbyStationId(state.stations.bus),
      subway: nearbyStationId(state.stations.subway),
      hotplace: nearbyStationId(state.hotplaces),
    };

    function pause() {
      paused = true;
      state.walkModeActive = false;
      showDpad(false);
    }

    function resume() {
      paused = false;
      state.walkModeActive = true;
      showDpad(true);
      last = performance.now();
      requestAnimationFrame(frame);
    }

    function finish() {
      state.walkModeActive = false;
      state.requestPhone = null;
      showDpad(false);
    }

    // 잠깐 멈추고 (창을 띄우고) 걸린 게임 시간(분)만큼 시계를 진행한 뒤 다시 걷기
    function pauseFor(task) {
      pause();
      Promise.resolve(task()).then((minutes) => {
        clock += minutes ?? 0;
        renderStats(state.character);
        resume();
      });
    }

    state.requestPhone = () => {
      if (paused || !state.walkModeActive) return;
      pauseFor(() => openPhone(clock));
    };

    function boardAt(kind, currentStation) {
      pause();
      const stations = kind === "bus" ? state.stations.bus : state.stations.subway;
      const modeLabel = kind === "bus" ? "버스" : "지하철";
      const fare = kind === "bus" ? BUS_FARE : SUBWAY_FARE;

      chooseRideDestination(kind, currentStation, stations).then((dest) => {
        if (!dest) {
          suppressed[kind] = currentStation.id;
          resume();
          return;
        }

        state.character.wallet -= fare;
        renderStats(state.character);
        logLine(`${modeLabel} 요금 ${fare}원 지불 (잔액 ${state.character.wallet}원)`);

        rideTransit(dest.pos, clock, `${modeLabel}로 ${dest.name}까지 이동`).then((endClock) => {
          clock = endClock;
          logLine(`${minutesToClock(clock)} ${dest.name} 도착`);
          suppressed[kind] = dest.id;
          suppressed.hotplace = nearbyStationId(state.hotplaces);
          resume();
        });
      });
    }

    function frame(now) {
      if (paused) return;

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
        walkedMinAcc += dt * GAME_MIN_PER_REAL_SEC;
      }

      const dist = distanceMeters(state.charPos, target);
      setStatus(`${minutesToClock(clock)} · ${label} (남은 거리 약 ${Math.round(dist)}m)`);

      if (dist <= ARRIVAL_RADIUS_M) {
        finish();
        resolve(clock);
        return;
      }

      if (allowEarlyHome) {
        const homeDist = distanceMeters(state.charPos, state.positions.home);
        if (!hasLeftHome && homeDist > ARRIVAL_RADIUS_M) hasLeftHome = true;
        if (hasLeftHome && homeDist <= ARRIVAL_RADIUS_M) {
          pause();
          confirmGoHomeEarly().then((yes) => {
            if (yes) {
              finish();
              reject(new DayCancelledEarly(clock));
              return;
            }
            hasLeftHome = false;
            resume();
          });
          return;
        }
      }

      const nearBus = nearestStation(state.charPos, state.stations.bus);
      if (nearBus && nearBus.dist <= ARRIVAL_RADIUS_M && nearBus.id !== suppressed.bus) {
        logLine(`${minutesToClock(clock)} ${nearBus.name} 도착`);
        boardAt("bus", nearBus);
        return;
      }
      if (!nearBus || nearBus.dist > ARRIVAL_RADIUS_M) suppressed.bus = null;

      const nearSubway = nearestStation(state.charPos, state.stations.subway);
      if (nearSubway && nearSubway.dist <= ARRIVAL_RADIUS_M && nearSubway.id !== suppressed.subway) {
        logLine(`${minutesToClock(clock)} ${nearSubway.name} 도착`);
        boardAt("subway", nearSubway);
        return;
      }
      if (!nearSubway || nearSubway.dist > ARRIVAL_RADIUS_M) suppressed.subway = null;

      const nearHot = nearestStation(state.charPos, state.hotplaces);
      if (nearHot && nearHot.dist <= ARRIVAL_RADIUS_M && nearHot.id !== suppressed.hotplace) {
        suppressed.hotplace = nearHot.id;
        logLine(`${minutesToClock(clock)} ${nearHot.icon} ${nearHot.name} 앞을 지나간다`);
        pauseFor(() => visitHotplace(nearHot, clock));
        return;
      }
      if (!nearHot || nearHot.dist > ARRIVAL_RADIUS_M) suppressed.hotplace = null;

      // 돌발사건: 실제로 걸은 게임 1분마다 한 번씩 판정
      while (walkedMinAcc >= 1) {
        walkedMinAcc -= 1;
        if (shouldTriggerEvent(clock)) {
          walkedMinAcc = 0;
          state.eventsToday += 1;
          state.lastEventClock = clock;
          pauseFor(() => runRandomEvent(clock));
          return;
        }
      }

      requestAnimationFrame(frame);
    }
    state.walkModeActive = true;
    showDpad(true);
    requestAnimationFrame(frame);
  });
}

function shouldTriggerEvent(clock) {
  if (state.events.length === 0) return false;
  if (state.eventsToday >= MAX_EVENTS_PER_DAY) return false;
  if (clock - state.lastEventClock < EVENT_COOLDOWN_MIN) return false;
  return Math.random() < EVENT_CHANCE_PER_MIN;
}

function pickWeighted(list) {
  const total = list.reduce((sum, e) => sum + (e.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const e of list) {
    r -= e.weight ?? 1;
    if (r <= 0) return e;
  }
  return list[list.length - 1];
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function fillTemplate(text, vars) {
  return String(text ?? "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

// 이펙트 값에 "{amount}" 같은 템플릿이 들어 있으면 숫자로 치환
function resolveEffect(effect, vars) {
  const out = {};
  Object.entries(effect ?? {}).forEach(([k, v]) => {
    out[k] = typeof v === "string" ? Number(fillTemplate(v, vars)) : v;
  });
  return out;
}

function nonZeroEffect(effect) {
  return Object.fromEntries(Object.entries(effect).filter(([, v]) => v !== 0));
}

async function runRandomEvent(clock) {
  const event = pickWeighted(state.events);
  const vars = {};
  if (event.amounts) vars.amount = pickRandom(event.amounts);
  if (event.variants) Object.assign(vars, pickRandom(event.variants));

  logLine(`${minutesToClock(clock)} ${event.title}`);

  const options = event.choices.map((choice) => {
    const locked = choice.safety && !state.safetyEducated;
    return {
      label: locked ? `🔒 ${choice.label}` : choice.label,
      value: choice,
      disabled: locked,
      hint: locked ? event.requiresSafety : null,
    };
  });
  const choice = await presentChoice("event-panel", event.title, options, {
    body: fillTemplate(event.text, vars),
    tone: "event",
  });

  let result = choice.result;
  if (choice.check) {
    const stat = state.character.stats[choice.check.stat] ?? 0;
    const chance = Math.min(0.9, Math.max(0.1, stat / (choice.check.threshold * 2)));
    result = Math.random() < chance ? choice.success : choice.fail;
  }

  const effect = nonZeroEffect(resolveEffect(result.effect, vars));
  applyEffect(effect);
  renderStats(state.character);
  const effectNote = Object.keys(effect).length ? ` (${signedEffectText(effect)})` : "";
  logLine(`${choice.label.replace(/^[^\s가-힣A-Za-z0-9"]+\s/, "")} → ${fillTemplate(result.text, vars)}${effectNote}`);
  await presentChoice("event-panel", result.crisis ? "⚠️ 위기 발생" : "결과", [{ label: "계속 걷기", value: true }], {
    body: `${fillTemplate(result.text, vars)}${effectNote}`,
    tone: result.crisis ? "danger" : "event",
  });
  return result.minutes ?? 0;
}

async function visitHotplace(place, clock) {
  const options = [{ label: "그냥 지나가기", value: null }];
  place.menu.forEach((item) => {
    const priceText = item.price > 0 ? `${item.price}원` : "무료";
    options.push({
      label: `${item.icon} ${item.name} · ${priceText} · ${item.minutes}분`,
      value: item,
      disabled: state.character.wallet < item.price,
      hint: signedEffectText(item.effect),
    });
  });
  const item = await presentChoice("event-panel", `${place.icon} ${place.name}`, options, {
    body: `지금 ${minutesToClock(clock)} · 용돈 ${state.character.wallet}원. 무엇을 할까요?`,
    tone: "hot",
  });
  if (!item) return 0;
  state.character.wallet -= item.price;
  applyEffect(item.effect);
  renderStats(state.character);
  logLine(`${place.name}에서 ${item.name}${item.price ? ` (${item.price}원)` : ""} — ${signedEffectText(item.effect)}`);
  return item.minutes;
}

async function openPhone(clock) {
  const contacts = state.phone?.contacts ?? [];
  const groups = [...new Set(contacts.map((c) => c.group))];
  const options = [{ label: "📵 전화 끊기", value: null }];
  groups.forEach((group) => {
    contacts
      .filter((c) => c.group === group)
      .forEach((c) => options.push({ label: `${c.icon} ${c.name}`, value: c, group, hint: c.note }));
  });
  const contact = await presentChoice("event-panel", "📱 휴대전화", options, {
    body: `${minutesToClock(clock)} · 누구에게 전화할까요?`,
    tone: "phone",
  });
  if (!contact) return 0;

  const line = pickRandom(contact.lines);
  const firstCall = !state.calledToday.has(contact.id);
  state.calledToday.add(contact.id);
  const effect = firstCall ? contact.effect ?? {} : {};
  applyEffect(effect);
  renderStats(state.character);
  const effectNote = Object.keys(effect).length ? ` (${signedEffectText(effect)})` : "";
  logLine(`📱 ${contact.name}에게 전화 — "${line}"${effectNote}`);
  await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "끊기", value: true }], {
    body: `"${line}"${effectNote}`,
    tone: "phone",
  });
  return state.phone?.callMinutes ?? 2;
}

// 공용 선택창 — options: [{ label, value, disabled, hint, group }]
function presentChoice(panelId, heading, options, { body = null, tone = null } = {}) {
  return new Promise((resolve) => {
    const panel = document.getElementById(panelId);
    panel.hidden = false;
    panel.innerHTML = "";
    panel.dataset.tone = tone ?? "";

    const h = document.createElement("p");
    h.className = "choice-heading";
    h.textContent = heading;
    panel.appendChild(h);

    if (body) {
      const b = document.createElement("p");
      b.className = "choice-body";
      b.textContent = body;
      panel.appendChild(b);
    }

    let row = null;
    let currentGroup;
    options.forEach((opt) => {
      if (!row || opt.group !== currentGroup) {
        currentGroup = opt.group;
        if (opt.group) {
          const g = document.createElement("p");
          g.className = "choice-group";
          g.textContent = opt.group;
          panel.appendChild(g);
        }
        row = document.createElement("div");
        row.className = "chip-row";
        panel.appendChild(row);
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "transport-btn";
      btn.disabled = !!opt.disabled;
      btn.textContent = opt.label;
      if (opt.hint) btn.title = opt.hint;
      btn.addEventListener("click", () => {
        panel.hidden = true;
        resolve(opt.value);
      });
      if (opt.hint) {
        const wrap = document.createElement("span");
        wrap.className = "choice-opt";
        const hint = document.createElement("span");
        hint.className = "choice-hint";
        hint.textContent = opt.hint;
        wrap.appendChild(btn);
        wrap.appendChild(hint);
        row.appendChild(wrap);
      } else {
        row.appendChild(btn);
      }
    });
  });
}

async function waitUntil(startClock, endClock, label, durationMs = WAIT_PHASE_MS) {
  setStatus(`${minutesToClock(startClock)} · ${label}`);
  await animate(durationMs, (t) => {
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
  return presentChoice("home-confirm", "일정을 취소하고 집에 들어갑니다", [
    { label: "예", value: true },
    { label: "아니오", value: false },
  ]);
}

function chooseHomeActivity(homeActivities) {
  return presentChoice("home-confirm", "집에서 무엇을 할까요?", [
    ...homeActivities.map((activity) => ({ label: activity.name, value: activity })),
    { label: "그냥 쉬기", value: null },
  ]);
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

async function renderMap(character, academies, activities, stations, hotplaces) {
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

  for (const place of hotplaces) {
    const fallbackPos = offsetLatLng(homePos.lat, homePos.lng, place.fallback.distanceM, place.fallback.bearing);
    let pos = fallbackPos;
    let realName = null;
    if (place.address) {
      pos = await resolvePlace(place.address, null, fallbackPos);
    } else if (place.placeQuery) {
      try {
        const found = await keywordSearchNear(place.placeQuery, homePos, HOTPLACE_SEARCH_RADIUS_M);
        pos = { lat: found.lat, lng: found.lng };
        realName = found.placeName;
      } catch (err) {
        console.warn(err);
      }
    }
    const entry = { ...place, pos, realName };
    state.hotplaces.push(entry);
    createHotplaceOverlay(map, pos, entry);
  }

  state.charPos = { ...homePos };
  state.charOverlay = createCharacterOverlay(map, homePos);
}

function renderStats(character) {
  document.getElementById("char-name").textContent = character.name;

  const statsEl = document.getElementById("stats");
  statsEl.innerHTML = "";
  STAT_GROUPS.forEach((group) => {
    const positive = group.stats.filter((key) => !NEGATIVE_STATS.has(key));
    const avg = Math.round(positive.reduce((sum, key) => sum + (character.stats[key] ?? 0), 0) / positive.length);
    const box = document.createElement("details");
    box.className = "stat-group";
    box.open = state.ui.openStatGroups?.has(group.id) ?? true;
    box.addEventListener("toggle", () => {
      state.ui.openStatGroups ??= new Set(STAT_GROUPS.map((g) => g.id));
      if (box.open) state.ui.openStatGroups.add(group.id);
      else state.ui.openStatGroups.delete(group.id);
    });
    box.innerHTML = `<summary><span>${group.icon} ${group.label}</span><span class="group-avg">평균 ${avg}</span></summary>`;
    group.stats.forEach((key) => {
      const value = character.stats[key] ?? 0;
      const row = document.createElement("div");
      row.className = `stat-row${NEGATIVE_STATS.has(key) ? " negative" : ""}`;
      row.innerHTML = `
        <span class="icon">${STAT_ICONS[key] ?? ""}</span>
        <span class="label">${STAT_LABELS[key] ?? key}</span>
        <span class="bar"><span style="width:${Math.min(value, 100)}%"></span></span>
        <span class="value">${value}</span>
      `;
      box.appendChild(row);
    });
    statsEl.appendChild(box);
  });

  const condEl = document.getElementById("condition");
  const stress = character.condition.stress;
  const stressWarning = stress >= STRESS_ILLNESS_THRESHOLD;
  condEl.innerHTML = `
    <div class="condition-row">
      <span class="condition-badge">${CONDITION_ICONS.hunger} 허기 ${character.condition.hunger}</span>
      <span class="condition-badge">${CONDITION_ICONS.staminaNow} 기력 ${character.condition.staminaNow}</span>
      <span class="condition-badge${stressWarning ? " warning" : ""}">${CONDITION_ICONS.stress} 스트레스 ${stress}</span>
      <span class="condition-badge">${CONDITION_ICONS.wallet} ${character.wallet}원</span>
      ${state.safetyEducated ? '<span class="condition-badge good" title="창의적 체험활동 안전 교육 이수 — 수상한 어른에게 슬기롭게 대처할 수 있다">🦺 안전교육 이수</span>' : ""}
    </div>
  `;
}

const REG_WEEKDAYS = [1, 2, 3, 4, 5];

function regSummary(reg) {
  if (!reg || reg.days.length === 0) return "등록 안 함";
  return `${reg.days.map((d) => WEEKDAY_LABELS[d]).join("·")} ${minutesToClock(reg.startMin)}`;
}

function sameReg(a, b) {
  const na = a && a.days.length ? a : null;
  const nb = b && b.days.length ? b : null;
  if (!na || !nb) return !na && !nb;
  return na.startMin === nb.startMin && na.days.join() === nb.days.join();
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
      <span class="academy-body">
        <strong>${academy.name}</strong> (${category.label})<br>
        <span class="muted">${growthText} · ${hoursText} · ${addressText} (집에서 ${academy.location.mode === "walk" ? "도보" : "이동"} ${academy.location.etaMinFromHome}분)</span>
      </span>
    `;

    if (academy.hours) {
      const body = li.querySelector(".academy-body");
      const regEl = document.createElement("div");
      regEl.className = "reg-row";

      const pending = state.registrations.pending[academy.id] ?? { days: [], startMin: clockToMinutes(academy.hours.open) };
      const open = clockToMinutes(academy.hours.open);
      const close = clockToMinutes(academy.hours.close);

      REG_WEEKDAYS.forEach((dow) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `reg-day${pending.days.includes(dow) ? " on" : ""}`;
        btn.textContent = WEEKDAY_LABELS[dow];
        btn.setAttribute("aria-pressed", pending.days.includes(dow) ? "true" : "false");
        btn.addEventListener("click", () => {
          const days = pending.days.includes(dow) ? pending.days.filter((d) => d !== dow) : [...pending.days, dow].sort();
          state.registrations.pending[academy.id] = { days, startMin: pending.startMin };
          renderAcademies(state.academies, state.categoryMap);
        });
        regEl.appendChild(btn);
      });

      const select = document.createElement("select");
      select.className = "reg-time";
      select.setAttribute("aria-label", `${academy.name} 수업 시작 시각`);
      for (let m = open; m + ACADEMY_LESSON_MIN <= close; m += 60) {
        const opt = document.createElement("option");
        opt.value = String(m);
        opt.textContent = minutesToClock(m);
        opt.selected = m === pending.startMin;
        select.appendChild(opt);
      }
      select.addEventListener("change", () => {
        state.registrations.pending[academy.id] = { days: pending.days, startMin: Number(select.value) };
        renderAcademies(state.academies, state.categoryMap);
      });
      regEl.appendChild(select);

      const active = state.registrations.active[academy.id];
      const status = document.createElement("span");
      status.className = "muted reg-status";
      status.textContent = sameReg(active, state.registrations.pending[academy.id])
        ? `이번 주 등록: ${regSummary(active)}`
        : `이번 주: ${regSummary(active)} → 다음 주(월)부터: ${regSummary(state.registrations.pending[academy.id])}`;
      regEl.appendChild(status);

      body.appendChild(regEl);
    }
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
  const conflict = range.invalid || scheduleBlocks.some((b) => rangesOverlap(b.startMin, b.endMin, range.startMin, range.endMin));
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
      return rangeForSpec(spec, rowToMinutes(row));
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
      const conflict = range.invalid || scheduleBlocks.some((b) => rangesOverlap(b.startMin, b.endMin, range.startMin, range.endMin));
      if (conflict) {
        flashReject();
        return;
      }
      scheduleBlocks.push({
        id: spec.kind === "school" ? "school" : `${spec.kind}-${spec.academyId ?? spec.activityId ?? spec.careSlot ?? "x"}-${Date.now()}`,
        kind: spec.kind,
        academyId: spec.academyId,
        activityId: spec.activityId,
        courseId: spec.kind === "afterschool" ? state.ui.afterschoolCourse : undefined,
        careSlot: spec.careSlot,
        programId: spec.kind === "care" && spec.careSlot !== "morning" ? state.ui.careProgram : undefined,
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

function careSlotById(id) {
  return state.neulbom?.slots.find((slot) => slot.id === id);
}

function careProgramById(id) {
  for (const group of state.neulbom?.programs ?? []) {
    const item = group.items.find((i) => i.id === id);
    if (item) return { ...item, groupLabel: group.label };
  }
  return null;
}

function afterschoolCourseById(id) {
  return state.afterschoolCourses.find((c) => c.id === id) ?? null;
}

// 팔레트 항목을 rowStartMin에 떨어뜨렸을 때의 시간 범위. invalid면 놓을 수 없다(운영시간 밖 등).
function rangeForSpec(spec, rowStartMin) {
  if (spec.kind === "school") return schoolTimesFor(state.day);
  if (spec.kind === "afterschool") {
    const t = afterschoolTimesFor(state.day);
    return { startMin: t.startMin, endMin: t.endMin };
  }
  if (spec.kind === "care") {
    const slot = careSlotById(spec.careSlot);
    let endMin = clockToMinutes(slot.end);
    let startMin;
    if (slot.start) {
      startMin = clockToMinutes(slot.start);
    } else {
      // 오후돌봄: 정규수업/방과후교육이 끝나는 시각에 맞춰 시작
      const schoolish = scheduleBlocks.filter((b) => b.kind === "school" || b.kind === "afterschool");
      startMin = schoolish.length ? Math.max(...schoolish.map((b) => b.endMin)) : rowStartMin;
      // 뒤에 학원 등 다른 일정이 있으면 그 전까지만 돌봄
      const nextStarts = scheduleBlocks.map((b) => b.startMin).filter((m) => m >= startMin);
      if (nextStarts.length) endMin = Math.min(endMin, ...nextStarts);
    }
    return { startMin, endMin, invalid: startMin >= endMin };
  }
  const durationMin = spec.kind === "activity" ? spec.durationMin : ACADEMY_LESSON_MIN;
  const startMin = rowStartMin;
  const endMin = startMin + durationMin;
  if (endMin > DAY_TIMELINE_END_MIN) return null;
  const place =
    spec.kind === "academy"
      ? state.academies.find((a) => a.id === spec.academyId)
      : state.activities.find((a) => a.id === spec.activityId);
  const hours = place?.hours;
  const outsideHours = !!hours && (startMin < clockToMinutes(hours.open) || endMin > clockToMinutes(hours.close));
  return { startMin, endMin, invalid: outsideHours };
}

function createChip(icon, label, spec, extraClass) {
  const chip = document.createElement("div");
  chip.className = `chip${extraClass ? ` ${extraClass}` : ""}`;
  chip.innerHTML = `<span class="chip-icon">${icon}</span><span>${label}</span>`;
  makeDraggable(chip, spec);
  return chip;
}

function paletteGroup(parent, title) {
  const group = document.createElement("div");
  group.className = "palette-group";
  const h = document.createElement("p");
  h.className = "palette-title";
  h.textContent = title;
  group.appendChild(h);
  const row = document.createElement("div");
  row.className = "chip-row";
  group.appendChild(row);
  parent.appendChild(group);
  return { group, row };
}

function paletteSelect(label, groups, selected, onChange) {
  const wrap = document.createElement("label");
  wrap.className = "palette-select";
  wrap.textContent = `${label} `;
  const select = document.createElement("select");
  groups.forEach((g) => {
    const og = document.createElement("optgroup");
    og.label = g.label;
    g.items.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = `${item.icon ? `${item.icon} ` : ""}${item.name}`;
      opt.title = item.description ?? "";
      opt.selected = item.id === selected;
      og.appendChild(opt);
    });
    select.appendChild(og);
  });
  select.addEventListener("change", () => onChange(select.value));
  wrap.appendChild(select);
  return wrap;
}

function renderPalette() {
  const el = document.getElementById("schedule-palette");
  el.innerHTML = "";

  const vacation = vacationOf(state.day);
  const weekday = isWeekday(state.day);
  const school = paletteGroup(el, vacation ? `🏫 학교 — ${vacation.name} 중` : "🏫 학교 · 방과후 · 늘봄");

  const hasSchool = scheduleBlocks.some((b) => b.kind === "school");
  if (!hasSchool && !vacation) {
    const t = schoolTimesFor(state.day);
    school.row.appendChild(
      createChip(SCHOOL_ICON, `정규수업 (${minutesToClock(t.startMin)}–${minutesToClock(t.endMin)})`, { kind: "school" }, "chip-school")
    );
  }

  if (weekday && !vacation) {
    const t = afterschoolTimesFor(state.day);
    const course = afterschoolCourseById(state.ui.afterschoolCourse);
    school.row.appendChild(
      createChip(
        course?.icon ?? "🎒",
        `방과후 · ${course?.name ?? ""} (${minutesToClock(t.startMin)}–${minutesToClock(t.endMin)})`,
        { kind: "afterschool" },
        "chip-afterschool"
      )
    );
  }

  const careSlots = (state.neulbom?.slots ?? []).filter((slot) =>
    slot.vacationOnly ? vacation && weekday : !vacation && weekday
  );
  careSlots.forEach((slot) => {
    const timeText = slot.start ? `${slot.start}–${slot.end}` : `~${slot.end}`;
    school.row.appendChild(createChip(slot.icon, `늘봄 ${slot.name} (${timeText})`, { kind: "care", careSlot: slot.id }, "chip-care"));
  });

  if (weekday) {
    const opts = document.createElement("div");
    opts.className = "palette-options";
    if (!vacation && state.afterschoolCourses.length) {
      opts.appendChild(
        paletteSelect(
          "방과후 과목",
          (state.afterschoolGroups ?? []).map((g) => ({ label: g.label, items: g.courses })),
          state.ui.afterschoolCourse,
          (value) => {
            state.ui.afterschoolCourse = value;
            renderPalette();
          }
        )
      );
    }
    if (careSlots.length && state.neulbom) {
      opts.appendChild(
        paletteSelect("늘봄 프로그램", state.neulbom.programs, state.ui.careProgram, (value) => {
          state.ui.careProgram = value;
        })
      );
    }
    school.group.appendChild(opts);
  }

  const acts = paletteGroup(el, "🧹 활동");
  state.activities.forEach((activity) => {
    const hoursText = activity.hours ? ` · ${activity.hours.open}~${activity.hours.close}` : "";
    acts.row.appendChild(
      createChip(
        activity.icon,
        `${activity.name} (${activity.durationMin}분${hoursText})`,
        { kind: "activity", activityId: activity.id, durationMin: activity.durationMin },
        "chip-activity"
      )
    );
  });

  const acads = paletteGroup(el, "🏢 학원 — 운영시간 안에만 놓을 수 있다. 등록하지 않은 시간은 자율학습");
  state.academies
    .filter((a) => a.location.etaMinFromHome != null)
    .forEach((academy) => {
      const category = state.categoryMap[academy.categoryId];
      const suffix = academy.location.mode === "walk" ? "" : " · 버스/지하철 권장";
      const hoursText = academy.hours ? ` · ${academy.hours.open}~${academy.hours.close}` : "";
      acads.row.appendChild(
        createChip(
          category.icon ?? "🏫",
          `${academy.name} (${ACADEMY_LESSON_MIN}분${hoursText}${suffix})`,
          { kind: "academy", academyId: academy.id },
          "chip-academy"
        )
      );
    });
}

function blockDisplay(block) {
  const dow = weekdayOf(state.day);
  if (block.kind === "school") return { icon: SCHOOL_ICON, label: "정규수업", cls: "tt-school" };
  if (block.kind === "afterschool") {
    const course = afterschoolCourseById(block.courseId);
    return { icon: course?.icon ?? "🎒", label: `방과후 · ${course?.name ?? "?"}`, cls: "tt-afterschool" };
  }
  if (block.kind === "care") {
    const slot = careSlotById(block.careSlot);
    const program = careProgramById(block.programId);
    return { icon: slot?.icon ?? "🏠", label: `늘봄 ${slot?.name ?? ""}${program ? ` · ${program.name}` : ""}`, cls: "tt-care" };
  }
  if (block.kind === "activity") {
    const activity = state.activities.find((a) => a.id === block.activityId);
    return { icon: activity.icon, label: activity.name, cls: "tt-activity" };
  }
  const academy = state.academies.find((a) => a.id === block.academyId);
  const registered = isRegisteredSlot(academy.id, dow, block.startMin);
  return {
    icon: state.categoryMap[academy.categoryId]?.icon ?? "🏫",
    label: `${academy.name}${registered ? " (등록 수업)" : " (자율학습)"}`,
    cls: "tt-academy",
  };
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
    const { icon, label, cls } = blockDisplay(block);
    const div = document.createElement("div");
    div.className = `tt-block ${cls}`;
    div.style.top = `${top}px`;
    div.style.height = `${height}px`;

    const span = document.createElement("span");
    span.className = "tt-label";
    span.innerHTML = `<span>${icon}</span><span>${minutesToClock(block.startMin)} ${label}</span>`;
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
  logLine(`${academy.name} 등록 수업 완료 — ${growthText}`);
}

// 운영시간 안이지만 사전 등록하지 않은 시간에 간 경우 — 자율학습
function applyAutonomousStudy(academy) {
  applyEffect(AUTONOMOUS_STUDY_EFFECT);
  state.character.condition.hunger = Math.max(0, state.character.condition.hunger - 10);
  addStress(AUTONOMOUS_STUDY_STRESS);
  renderStats(state.character);
  logLine(`${academy.name} — 등록된 수업 시간이 아니라 자율학습을 했다 (${signedEffectText(AUTONOMOUS_STUDY_EFFECT)})`);
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

function scaleGrowth(perHour, hours) {
  const out = {};
  Object.entries(perHour ?? {}).forEach(([k, v]) => {
    const amount = Math.round(v * hours);
    if (amount !== 0) out[k] = amount;
  });
  return out;
}

// 정규수업: 자율독서 → 교시별 과목 → 중간놀이/점심 … 요일별 마지막 교시까지
async function runSchoolBlock(block, clock, dow) {
  const timetable = state.school?.timetable?.[dow] ?? [];
  const segments = (state.school?.segments ?? []).filter((seg) => seg.endMin <= block.endMin);

  if (clock < block.startMin) {
    logLine(`${minutesToClock(clock)} 교문 앞에서 ${minutesToClock(block.startMin)}까지 기다렸다`);
    clock = block.startMin;
  }

  for (const seg of segments) {
    const subject = seg.type === "period" ? state.subjectMap[timetable[seg.period - 1]] : null;
    const segLabel = subject ? `${seg.label} ${subject.icon} ${subject.label}` : seg.label;

    if (seg.endMin <= clock) {
      if (seg.type === "period") logLine(`${segLabel} — 지각해서 놓쳤다`);
      continue;
    }

    await waitUntil(Math.max(seg.startMin, clock), seg.endMin, segLabel, SEGMENT_PHASE_MS);
    clock = seg.endMin;

    if (seg.type === "period") {
      if (!subject) {
        logLine(`${seg.label} — 자습`);
        continue;
      }
      let topic;
      if (subject.id === "creative_activity") {
        topic = subject.topics[state.creativeCount % subject.topics.length];
        state.creativeCount += 1;
      } else {
        topic = pickRandom(subject.topics);
      }
      applyEffect(subject.growth);
      renderStats(state.character);
      logLine(`${segLabel} — ${topic} (${signedEffectText(subject.growth)})`);
      if (topic === "안전 교육" && !state.safetyEducated) {
        state.safetyEducated = true;
        renderStats(state.character);
        logLine("🦺 안전 교육을 잘 들었다! 이제 수상한 어른을 만나도 슬기롭게 대처할 수 있다");
      }
    } else if (seg.type === "lunch") {
      state.character.condition.hunger = Math.max(state.character.condition.hunger, 80);
      renderStats(state.character);
      logLine(`${minutesToClock(seg.startMin)} 점심시간 — 급식을 먹고 허기를 회복했다 (허기 ${state.character.condition.hunger})`);
    } else if (seg.type === "reading") {
      logLine(`${minutesToClock(seg.startMin)} 자율독서시간 — 조용히 책을 읽었다`);
    }
  }

  state.character.condition.staminaNow = Math.max(0, state.character.condition.staminaNow - 10);
  addStress(SCHOOL_STRESS);
  renderStats(state.character);
  logLine(`${minutesToClock(block.endMin)} 정규수업 끝 (${WEEKDAY_LABELS[dow] ?? ""}요일 ${segments.filter((s) => s.type === "period").length}교시까지)`);
  return Math.max(clock, block.endMin);
}

// 방과후교육: 1차시 40분 → 10분 휴식 → 2차시 40분
async function runAfterschoolBlock(block, clock) {
  const course = afterschoolCourseById(block.courseId);
  const cfg = state.school?.afterschool ?? { periodMin: 40, breakBetweenMin: 10 };
  const p1End = block.startMin + cfg.periodMin;
  const p2Start = p1End + cfg.breakBetweenMin;
  const name = course?.name ?? "방과후";

  if (clock < block.startMin) {
    await waitUntil(clock, block.startMin, "방과후 시작 전 휴식", SEGMENT_PHASE_MS);
    clock = block.startMin;
  }
  const phases = [
    { start: block.startMin, end: p1End, label: `방과후 1차시 · ${name}` },
    { start: p1End, end: p2Start, label: "방과후 쉬는 시간" },
    { start: p2Start, end: block.endMin, label: `방과후 2차시 · ${name}` },
  ];
  for (const phase of phases) {
    if (phase.end <= clock) continue;
    await waitUntil(Math.max(phase.start, clock), phase.end, phase.label, SEGMENT_PHASE_MS);
    clock = phase.end;
  }

  if (course) {
    applyEffect(course.growth);
    state.character.condition.staminaNow = Math.max(0, state.character.condition.staminaNow - course.staminaCost);
  }
  state.character.condition.hunger = Math.max(0, state.character.condition.hunger - 10);
  addStress(AFTERSCHOOL_STRESS);
  renderStats(state.character);
  logLine(`방과후교육 ${name} 완료${course ? ` — ${signedEffectText(course.growth)}` : ""}`);
  return Math.max(clock, block.endMin);
}

// 늘봄학교 돌봄 (아침·오후·저녁·방학중)
async function runCareBlock(block, clock) {
  const slot = careSlotById(block.careSlot);
  const program = careProgramById(block.programId);
  const start = Math.max(clock, block.startMin);
  const label = `늘봄 ${slot.name}${program ? ` · ${program.name}` : ""}`;
  await waitUntil(start, block.endMin, label);
  const hours = Math.max(0, (block.endMin - start) / 60);

  const effect = slot.effect ? { ...slot.effect } : scaleGrowth(program?.growthPerHour, hours);
  applyEffect(effect);
  const c = state.character.condition;
  c.staminaNow = Math.max(0, c.staminaNow - Math.round((program?.staminaPerHour ?? 2) * hours));
  c.hunger = Math.max(0, c.hunger - Math.round(5 * hours));
  if (slot.lunch) c.hunger = Math.max(c.hunger, 80);
  if (slot.snackHunger) c.hunger = Math.min(100, c.hunger + slot.snackHunger);
  addStress(Math.round((slot.stressPerHour ?? 2) * hours));
  renderStats(state.character);

  const extras = [slot.lunch ? "점심 제공" : null, slot.snackHunger ? `저녁 간식 (허기 +${slot.snackHunger})` : null].filter(Boolean);
  const effectNote = Object.keys(effect).length ? ` — ${signedEffectText(effect)}` : "";
  logLine(`${label} 끝${effectNote}${extras.length ? ` · ${extras.join(" · ")}` : ""}`);
  return block.endMin;
}

function lateThresholdFor(block) {
  if (block.kind === "school") return SCHOOL_LATE_MIN;
  if (block.kind === "care" && block.careSlot === "morning") return MORNING_CARE_LATE_MIN;
  return block.startMin;
}

function isAtHome() {
  return distanceMeters(state.charPos, state.positions.home) <= ARRIVAL_RADIUS_M;
}

function blockPlace(block) {
  if (block.kind === "school" || block.kind === "afterschool" || block.kind === "care") {
    return { pos: state.positions.school, name: "학교" };
  }
  if (block.kind === "activity") {
    const activity = state.activities.find((a) => a.id === block.activityId);
    const pos = activity.location === "home" ? state.positions.home : state.positions.activities[activity.id];
    return { pos, name: activity.location === "home" ? "집" : activity.name, activity };
  }
  const academy = state.academies.find((a) => a.id === block.academyId);
  return { pos: state.positions.academies[block.academyId], name: academy.name, academy };
}

async function runDay(blocks) {
  document.getElementById("day-run").hidden = false;
  document.getElementById("day-summary").hidden = true;
  document.getElementById("day-log").innerHTML = "";

  state.charPos = { ...state.positions.home };
  state.charOverlay.setPosition(new kakao.maps.LatLng(state.charPos.lat, state.charPos.lng));
  state.eventsToday = 0;
  state.lastEventClock = -Infinity;
  state.calledToday = new Set();

  const dow = weekdayOf(state.day);
  let clock = DAY_TIMELINE_START_MIN;
  let hadSchool = false;
  let schoolWasLate = false;
  let gotSick = false;
  let cancelledEarly = false;

  if (blocks.length === 0) {
    logLine("오늘은 아무 일정도 없다 — 집에서 하루를 보냈다");
  }

  try {
    for (const block of blocks) {
      const place = blockPlace(block);
      const { label: blockLabel } = blockDisplay(block);
      const alreadyThere = distanceMeters(state.charPos, place.pos) <= ARRIVAL_RADIUS_M;

      if (alreadyThere) {
        logLine(`${minutesToClock(clock)} ${place.name}에서 이어서 ${blockLabel}`);
        if (block.kind === "school") hadSchool = true;
      } else {
        logLine(`${minutesToClock(clock)} ${place.name}(으)로 이동 시작 (${blockLabel})`);
        clock = await travelTo(place.pos, clock, place.name);
        const late = clock > lateThresholdFor(block);
        if (block.kind === "school") {
          hadSchool = true;
          schoolWasLate = late;
        }
        logLine(`${minutesToClock(clock)} ${place.name} 도착${late ? " — 지각" : ""}`);
      }

      if (block.kind === "school") {
        clock = await runSchoolBlock(block, clock, dow);
      } else if (block.kind === "afterschool") {
        clock = await runAfterschoolBlock(block, clock);
      } else if (block.kind === "care") {
        clock = await runCareBlock(block, clock);
      } else {
        clock = Math.max(clock, block.startMin);
        const registered = block.kind === "academy" && isRegisteredSlot(block.academyId, dow, block.startMin);
        const waitLabel =
          block.kind === "activity" ? `${place.activity.name} 중` : registered ? `${place.name} 수업` : `${place.name} 자율학습`;
        await waitUntil(clock, block.endMin, waitLabel);
        clock = block.endMin;
        if (block.kind === "activity") applyActivityEffects(place.activity);
        else if (registered) applyAcademyEffects(place.academy);
        else applyAutonomousStudy(place.academy);
      }

      if (state.character.condition.stress >= STRESS_ILLNESS_THRESHOLD) {
        triggerIllness();
        gotSick = true;
        break;
      }

      // 학원 수업이 끝나면 하원버스 or 개별 이동
      if (block.kind === "academy") {
        const how = await presentChoice("transport-choice", `${place.name} 끝 — 어떻게 갈까요?`, [
          { label: "🚌 하원버스 타고 집으로", value: "shuttle" },
          { label: "🚶 하원버스 안 타고 개별 이동", value: "walk" },
        ]);
        if (how === "shuttle") {
          logLine(`${minutesToClock(clock)} 하원버스 탑승`);
          clock = await rideTransit(state.positions.home, clock, "하원버스로 집까지 이동");
          logLine(`${minutesToClock(clock)} 하원버스로 집 도착`);
        } else {
          logLine(`${minutesToClock(clock)} 하원버스를 타지 않고 개별적으로 이동한다`);
        }
      }
    }
  } catch (err) {
    if (!(err instanceof DayCancelledEarly)) throw err;
    cancelledEarly = true;
    clock = err.clock;
    logLine(`${minutesToClock(clock)} 일정을 취소하고 집으로 돌아왔다`);
  }

  if (!isAtHome()) {
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
  summaryEl.textContent = `Day ${state.day} 완료 — ${schoolPart}${sickPart}${cancelPart} 허기 ${state.character.condition.hunger} · 기력 ${state.character.condition.staminaNow} · 스트레스 ${state.character.condition.stress}`;

  state.day += 1;
  renderDayHeader();

  // 월요일이 되면 지난주에 미리 등록해 둔 학원 일정이 이번 주 일정으로 확정된다
  if (weekdayOf(state.day) === 1) {
    state.registrations.active = JSON.parse(JSON.stringify(state.registrations.pending));
    logLine("📋 새 주가 시작됐다 — 미리 등록한 학원 일정이 이번 주에 적용된다");
  }
  renderAcademies(state.academies, state.categoryMap);

  scheduleBlocks = buildDefaultBlocks(state.day);
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

  document.getElementById("phone-btn").addEventListener("click", () => state.requestPhone?.());

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

  const [
    character,
    academies,
    categories,
    items,
    activities,
    stations,
    holidays,
    subjects,
    school,
    afterschool,
    neulbom,
    events,
    hotplaces,
    phone,
  ] = await Promise.all([
    loadJSON("data/character.json"),
    loadJSON("data/academies.json"),
    loadJSON("data/academy_categories.json"),
    loadJSON("data/items.json"),
    loadJSON("data/activities.json"),
    loadJSON("data/stations.json"),
    loadJSON("data/holidays.json"),
    loadJSON("data/subjects.json"),
    loadJSON("data/school_schedule.json"),
    loadJSON("data/afterschool.json"),
    loadJSON("data/neulbom.json"),
    loadJSON("data/events.json"),
    loadJSON("data/hotplaces.json"),
    loadJSON("data/phone.json"),
  ]);

  school.segments = school.segments.map((seg) => ({
    ...seg,
    startMin: clockToMinutes(seg.start),
    endMin: clockToMinutes(seg.end),
  }));
  state.school = school;
  SCHOOL_START_MIN = clockToMinutes(school.arrival.open);
  SCHOOL_LATE_MIN = clockToMinutes(school.arrival.lateAfter);
  state.subjectMap = Object.fromEntries(subjects.map((sub) => [sub.id, sub]));
  state.afterschoolGroups = afterschool;
  state.afterschoolCourses = afterschool.flatMap((g) => g.courses);
  state.ui.afterschoolCourse = state.afterschoolCourses[0]?.id ?? null;
  state.neulbom = neulbom;
  state.ui.careProgram = neulbom.programs[0]?.items[0]?.id ?? null;
  state.events = events;
  state.phone = phone;

  state.character = character;
  state.academies = academies;
  state.items = items;
  state.activities = activities;
  state.categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  state.holidaySet = new Set(holidays.map((h) => h.date));

  renderDayHeader();
  scheduleBlocks = buildDefaultBlocks(state.day);

  renderStats(character);
  renderAcademies(academies, state.categoryMap);
  renderActivityInfo();
  renderTimetable();
  renderShop();
  await renderMap(character, academies, activities, stations, hotplaces);
  wireScheduleEditor();
  wireMovementControls();
  wireNav();
}

main();
