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

const STAT_INFO = {
  stamina: "오래 움직여도 덜 지치는 힘. 체육 활동·줄넘기·인라인으로 오른다.",
  power: "힘과 운동 수행력. 태권도·즐거운 생활 신체 놀이로 오른다.",
  agility: "재빠르게 반응하는 힘. 축구·피구·인라인·술래잡기로 오른다.",
  dexterity: "손으로 만들고 다루는 솜씨. 공예·클레이·악기·요리·로봇 조립으로 오른다.",
  language: "읽기·쓰기·말하기. 국어·논술·영어·한자로 오른다.",
  math: "수와 연산, 도형, 시계 보기. 수학·주산·문제집으로 오른다.",
  perception: "주변을 관찰하고 알아차리는 힘. 슬기로운 생활·과학실험·나들이로 오른다.",
  logic: "차근차근 생각하는 힘. 코딩·로봇·체스/바둑으로 오른다.",
  focus: "한 가지에 오래 집중하는 힘. 한자·주산·바둑·자율학습으로 오른다.",
  expression: "그림·음악·몸짓으로 표현하는 힘. 미술·음악·댄스·연극으로 오른다.",
  social: "친구와 어울리고 협동하는 힘. 창의적 체험활동·친구 돕기·함께 놀기로 오른다.",
  diligence: "약속과 규칙을 지키는 생활 태도. 바른 생활·등록 수업으로 오르고 지각하면 떨어진다.",
  insa: "친구들 사이의 인기. 포켓몬카드·반갑게 인사·방송댄스로 오른다.",
  selfEsteem: "스스로를 믿는 마음. 친구 돕기·위기 대처·분실물 신고로 오른다.",
  digital: "컴퓨터와 디지털 도구를 다루는 힘. 컴퓨터(ICT)·AI·코딩으로 오른다.",
  delinquency: "나쁜 길로 빠지는 정도 — 낮을수록 좋다. 분실물을 몰래 가지거나 장난전화를 하면 오른다.",
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
const SEGMENT_PHASE_MS = 1400;
const AFTERSCHOOL_STRESS = 8;
const AUTONOMOUS_STUDY_STRESS = 6;
const AUTONOMOUS_STUDY_EFFECT = { focus: 1, diligence: 1, staminaNow: -3 };

// 돌발사건 — 걷는 동안 게임 1분마다 확률 판정
const EVENT_CHANCE_PER_MIN = 0.07;
const EVENT_COOLDOWN_MIN = 6;
const MAX_EVENTS_PER_DAY = 3;
const HOTPLACE_SEARCH_RADIUS_M = 900;

const LOW_HUNGER = 30;
const LOW_ENERGY = 20;
const LATE_DILIGENCE_PENALTY = 1;
const SAVE_KEY = "roymaker-save-v2";
const CLOUD_SAVE_ID = "iroi"; // 가족 공용 세이브 — Firestore의 saves/{CLOUD_SAVE_ID} 문서 하나를 모든 기기가 공유
const FIREBASE_SDK_VERSION = "10.14.1";
const SLEEP_FADE_MS = 900;
const SLEEP_HOLD_MS = 700;
const ACADEMY_LESSON_MIN = 60;
const WAIT_PHASE_MS = 3000;
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
  sprite: { dir: "down", frame: null, drawnDir: "down", cache: null, movingAt: 0, riding: null, canvas: null, bubble: null },
  places: {},
  companyVisitedToday: false,
  placeEvents: [],
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
  diaryEntries: [],
  weekPlan: {},
  ui: { afterschoolCourse: null, careProgram: null },
  dayRunning: false,
  day: 1,
  holidaySet: new Set(),
  cloud: { ready: false, db: null, docRef: null },
};

// 주간 계획: { [dayNumber]: blocks[] } — 월요일에 한 주(월~금)를 짜고, 당일 아침까지 고칠 수 있다

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

// 평일 9~16시는 엄마·아빠가 회사에 있는 시간 — 이때는 "집으로 돌아와" 같은 말 대신 "이따 보자" 톤을 쓴다
function isParentAtWork(clock) {
  if (!isWeekday(state.day)) return false;
  if (state.holidaySet.has(gameDateKey(gameDateForDay(state.day)))) return false;
  return clock >= 9 * 60 && clock < 16 * 60;
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

// place.csv (유형, 이름, 위도, 경도) — 탭 또는 쉼표 구분.
// 유형 B = 버스정류장, S = 지하철역, H = 우리집, P = 장소(할머니댁·회사 등), A = 학원(학원 이름과 같게)
async function loadStations(path) {
  const res = await fetch(path);
  const text = (await res.text()).replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  return lines.slice(1).flatMap((line, i) => {
    const [type, name, lat, lng] = line.split(delimiter).map((v) => v.trim());
    const pos = { lat: Number(lat), lng: Number(lng) };
    if (!["B", "S", "H", "P", "A"].includes(type) || !name || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) {
      console.warn(`place.csv ${i + 2}번째 줄을 건너뜀: ${line}`);
      return [];
    }
    return [{ id: `${type}-${i + 1}`, type, name, pos }];
  });
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

// ── 걷는 캐릭터 스프라이트 (24×32 도트, 코드로 직접 그림 + 외곽선) ──
// 팔다리는 sin 곡선으로 앞뒤로 흔들리고(8프레임), 걸음마다 몸이 살짝 위아래로 들썩인다.
const SPRITE_W = 24;
const SPRITE_H = 35;
const SPRITE_SCALE = 2;
const SPRITE_FRAME_MS = 85;
const WALK_FRAMES = 8;
const SP = {
  outline: "#2a2030",
  hair: "#1f1a1c",
  hairHi: "#463c44",
  skin: "#f7cfae",
  skinD: "#e3a985",
  shirt: "#8fd8b8",
  shirtD: "#5fb893",
  pants: "#2b3a55",
  shoe: "#ff7a52",
  shoeD: "#c9573a",
  bag: "#ff8a5c",
  bagD: "#c95a36",
  glass: "#c8a46a",
  lens: "#fdf6e8",
  eye: "#3a2a24",
  blush: "#f4a3a0",
  mouth: "#c95c5c",
};

function makeSpriteCtx() {
  const c = document.createElement("canvas");
  c.width = SPRITE_W;
  c.height = SPRITE_H;
  const ctx = c.getContext("2d");
  const r = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  // 굵기 w의 팔다리 선
  const limb = (x0, y0, x1, y1, w, color) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      r(lerp(x0, x1, t) - (w - 1) / 2, lerp(y0, y1, t), w, 1, color);
    }
  };
  // 타원 채우기
  const oval = (cx, cy, rx, ry, color) => {
    for (let y = -ry; y <= ry; y++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5))));
      r(cx - half, cy + y, half * 2 + 1, 1, color);
    }
  };
  return { c, ctx, r, limb, oval };
}

// 투명 픽셀 중 그림과 맞닿은 곳에 외곽선
function addOutline(c, ctx) {
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const at = (x, y) => (x < 0 || y < 0 || x >= c.width || y >= c.height ? 0 : d[(y * c.width + x) * 4 + 3]);
  const mark = [];
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (at(x, y)) continue;
      if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) mark.push([x, y]);
    }
  }
  ctx.fillStyle = SP.outline;
  mark.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
}

// 앞모습(아래)·뒷모습(위)
function paintFrontBack(g, swing, bob, back) {
  const { r, limb, oval } = g;
  const y0 = 2 - bob;
  // 팔 — 손이 앞뒤로 오가며 위아래로 보인다
  const lHand = 21 + y0 + swing * 1.6;
  const rHand = 21 + y0 - swing * 1.6;
  const arm = (x, handY) => {
    limb(x, 15 + y0, x, handY, 2, SP.skin);
    limb(x, 15 + y0, x, 16 + y0, 2, SP.shirtD);
  };
  arm(7, lHand);
  arm(16, rHand);
  // 다리 — 드는 발은 올라간다
  const leg = (x, lift) => {
    const footY = 29 - lift;
    limb(x, 24 + y0, x, footY + y0, 2, SP.skin);
    r(x - 1, footY + 1 + y0, 3, 2, SP.shoe);
    r(x - 1, footY + 2 + y0, 3, 1, SP.shoeD);
  };
  leg(9.5, Math.max(0, -swing) * 2.2);
  leg(13.5, Math.max(0, swing) * 2.2);
  // 몸통
  r(8, 14 + y0, 8, 8, SP.shirt);
  r(8, 21 + y0, 8, 1, SP.shirtD);
  if (back) {
    r(8, 15 + y0, 8, 7, SP.bag);
    r(8, 15 + y0, 8, 2, SP.bagD);
    r(10, 18 + y0, 4, 1, SP.bagD);
  } else {
    r(10, 14 + y0, 4, 1, SP.shirtD);
    r(9, 15 + y0, 1, 4, SP.bagD);
    r(14, 15 + y0, 1, 4, SP.bagD);
  }
  r(8, 22 + y0, 8, 3, SP.pants);
  r(11, 24 + y0, 2, 1, SP.outline);
  // 머리
  oval(11.5, 8 + y0, 7, 6, SP.skin);
  r(10, 13 + y0, 4, 1, SP.skinD);
  if (back) {
    oval(11.5, 7 + y0, 8, 6, SP.hair);
    r(9, 12 + y0, 6, 1, SP.hair);
    r(8, 3 + y0, 3, 1, SP.hairHi);
  } else {
    // 머리카락: 위쪽 덮고 앞머리는 들쭉날쭉
    oval(11.5, 4 + y0, 8, 4, SP.hair);
    r(4, 4 + y0, 2, 5, SP.hair);
    r(18, 4 + y0, 2, 5, SP.hair);
    [6, 7, 9, 10, 12, 14, 15, 17].forEach((x, i) => r(x, 6 + y0, 1, i % 2 ? 2 : 1, SP.hair));
    r(8, 2 + y0, 3, 1, SP.hairHi);
    r(13, 1 + y0, 2, 1, SP.hairHi);
    // 동그란 안경 + 웃는 눈
    const lens = (x) => {
      r(x, 8 + y0, 5, 3, SP.lens);
      r(x + 1, 7 + y0, 3, 1, SP.glass);
      r(x + 1, 11 + y0, 3, 1, SP.glass);
      r(x, 8 + y0, 1, 3, SP.glass);
      r(x + 4, 8 + y0, 1, 3, SP.glass);
      r(x + 1, 9 + y0, 1, 1, SP.eye);
      r(x + 2, 8 + y0, 1, 1, SP.eye);
      r(x + 3, 9 + y0, 1, 1, SP.eye);
    };
    lens(6);
    lens(13);
    r(11, 9 + y0, 2, 1, SP.glass);
    r(5, 11 + y0, 2, 1, SP.blush);
    r(17, 11 + y0, 2, 1, SP.blush);
    r(10, 12 + y0, 1, 1, SP.mouth);
    r(11, 13 + y0, 2, 1, SP.mouth);
    r(13, 12 + y0, 1, 1, SP.mouth);
  }
}

// 옆모습 (왼쪽을 보는 기준 — 오른쪽은 좌우 반전)
function paintSide(g, swing, bob) {
  const { r, limb, oval } = g;
  const y0 = 2 - bob;
  const hip = { x: 12, y: 23 + y0 };
  const shoulder = { x: 12, y: 15 + y0 };
  const legAt = (angle) => ({ x: hip.x + Math.sin(angle) * 6, y: hip.y + Math.cos(angle) * 6 });
  const armAt = (angle) => ({ x: shoulder.x + Math.sin(angle) * 6, y: shoulder.y + Math.cos(angle) * 6 });
  const legA = -swing * 0.55; // 음수 = 앞(왼쪽)
  const armA = swing * 0.6;
  const drawLeg = (angle, skin, shoe) => {
    const f = legAt(angle);
    limb(hip.x, hip.y, f.x, f.y, 2, skin);
    r(f.x - 2, f.y + 1, 4, 2, shoe);
  };
  const drawArm = (angle, skin, sleeve) => {
    const h = armAt(angle);
    limb(shoulder.x, shoulder.y, h.x, h.y, 2, skin);
    limb(shoulder.x, shoulder.y, lerp(shoulder.x, h.x, 0.3), lerp(shoulder.y, h.y, 0.3), 2, sleeve);
  };
  // 먼 쪽 팔다리 (어둡게)
  drawArm(-armA, SP.skinD, SP.shirtD);
  drawLeg(-legA, SP.skinD, SP.shoeD);
  // 몸통 + 등 뒤 가방
  r(9, 14 + y0, 6, 8, SP.shirt);
  r(15, 15 + y0, 3, 7, SP.bag);
  r(17, 15 + y0, 1, 7, SP.bagD);
  r(9, 22 + y0, 6, 3, SP.pants);
  // 가까운 쪽 다리
  drawLeg(legA, SP.skin, SP.shoe);
  // 머리
  oval(11, 8 + y0, 6, 6, SP.skin);
  r(4, 9 + y0, 1, 2, SP.skin);
  oval(12, 4 + y0, 7, 4, SP.hair);
  r(13, 4 + y0, 5, 7, SP.hair);
  [5, 7, 8, 10].forEach((x, i) => r(x, 6 + y0, 1, i % 2 ? 1 : 2, SP.hair));
  r(9, 1 + y0, 3, 1, SP.hairHi);
  r(13, 9 + y0, 1, 2, SP.skinD);
  // 안경 + 웃는 눈
  r(5, 8 + y0, 4, 3, SP.lens);
  r(5, 7 + y0, 4, 1, SP.glass);
  r(5, 11 + y0, 4, 1, SP.glass);
  r(4, 8 + y0, 1, 3, SP.glass);
  r(9, 8 + y0, 4, 1, SP.glass);
  r(5, 9 + y0, 1, 1, SP.eye);
  r(6, 8 + y0, 1, 1, SP.eye);
  r(7, 9 + y0, 1, 1, SP.eye);
  r(8, 11 + y0, 2, 1, SP.blush);
  r(5, 12 + y0, 1, 1, SP.mouth);
  r(6, 13 + y0, 2, 1, SP.mouth);
  // 가까운 쪽 팔
  drawArm(armA, SP.skin, SP.shirtD);
}

function renderSpriteFrame(dir, swing, bob) {
  const g = makeSpriteCtx();
  if (dir === "left" || dir === "right") {
    paintSide(g, swing, bob);
    if (dir === "right") {
      const flipped = makeSpriteCtx();
      flipped.ctx.translate(SPRITE_W, 0);
      flipped.ctx.scale(-1, 1);
      flipped.ctx.drawImage(g.c, 0, 0);
      flipped.ctx.setTransform(1, 0, 0, 1, 0, 0);
      addOutline(flipped.c, flipped.ctx);
      return flipped.c;
    }
  } else {
    paintFrontBack(g, swing, bob, dir === "up");
  }
  addOutline(g.c, g.ctx);
  return g.c;
}

// 방향별 걷기 8프레임 + 서 있는 자세를 미리 그려 둔다
function buildSpriteCache() {
  const cache = {};
  ["down", "up", "left", "right"].forEach((dir) => {
    const frames = [];
    for (let i = 0; i < WALK_FRAMES; i++) {
      const swing = Math.sin((i / WALK_FRAMES) * Math.PI * 2);
      const bob = Math.abs(swing) < 0.75 ? 1 : 0; // 다리가 모일 때 살짝 올라간다
      frames.push(renderSpriteFrame(dir, swing, bob));
    }
    cache[dir] = { walk: frames, idle: renderSpriteFrame(dir, 0, 0) };
  });
  return cache;
}

function drawSprite(canvas, dir, frame) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, SPRITE_W, SPRITE_H);
  state.sprite.cache ??= buildSpriteCache();
  const set = state.sprite.cache[dir];
  ctx.drawImage(frame == null ? set.idle : set.walk[frame % WALK_FRAMES], 0, 0);
}

function setSpriteFacing(dir, moving) {
  state.sprite.dir = dir;
  if (moving) state.sprite.movingAt = performance.now();
}

function setSpriteRide(emoji) {
  state.sprite.riding = emoji;
  if (state.sprite.bubble) {
    state.sprite.bubble.textContent = emoji ?? "";
    state.sprite.bubble.hidden = !emoji;
  }
}

function startSpriteTicker() {
  let step = 0;
  setInterval(() => {
    const sp = state.sprite;
    if (!sp.canvas) return;
    const moving = !sp.riding && performance.now() - sp.movingAt < SPRITE_FRAME_MS * 2;
    const frame = moving ? step++ % WALK_FRAMES : null;
    if (!moving) step = 0;
    if (frame !== sp.frame || sp.dir !== sp.drawnDir) {
      drawSprite(sp.canvas, sp.dir, frame);
      sp.frame = frame;
      sp.drawnDir = sp.dir;
    }
  }, SPRITE_FRAME_MS);
}

function createCharacterOverlay(map, position) {
  const el = document.createElement("div");
  el.className = "char-sprite";
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_W;
  canvas.height = SPRITE_H;
  canvas.style.width = `${SPRITE_W * SPRITE_SCALE}px`;
  canvas.style.height = `${SPRITE_H * SPRITE_SCALE}px`;
  canvas.setAttribute("aria-label", "이로이");
  const bubble = document.createElement("span");
  bubble.className = "ride-bubble";
  bubble.hidden = true;
  el.appendChild(bubble);
  el.appendChild(canvas);
  state.sprite.canvas = canvas;
  state.sprite.bubble = bubble;
  drawSprite(canvas, state.sprite.dir, null);
  startSpriteTicker();
  return new kakao.maps.CustomOverlay({
    map,
    position: new kakao.maps.LatLng(position.lat, position.lng),
    yAnchor: 1,
    content: el,
  });
}

// 정류장/역 아이콘: 동그라미 안에 유형 알파벳(B 버스, S 지하철) + 옆에 이름 레이블
// 지도 아이콘: 동그라미 안 글자(B 버스 · S 지하철 · 집 · 금 학교 · A 학원 · P 장소) + 이름 레이블
const MARKER_KIND = { B: "버스정류장", S: "지하철역", H: "우리집", P: "장소", A: "학원", school: "학교" };
// 집·학교는 네모 아이콘 안에 이름을 바로 쓴다
const MARKER_SQUARE = { H: "우리집", school: "금북초" };

function createStationOverlay(map, position, type, name) {
  const el = document.createElement("div");
  el.className = `bus-stop-marker station-${type}`;
  el.title = `${MARKER_KIND[type] ?? ""} — ${name}`;
  el.innerHTML = MARKER_SQUARE[type]
    ? `<span class="square-badge">${MARKER_SQUARE[type]}</span>`
    : `<span class="bus-badge">${type}</span><span class="bus-label">${name}</span>`;
  return new kakao.maps.CustomOverlay({
    map,
    position: new kakao.maps.LatLng(position.lat, position.lng),
    content: el,
  });
}

function createHotplaceOverlay(map, position, place) {
  const el = document.createElement("div");
  el.className = "bus-stop-marker station-P";
  el.title = place.realName ? `${place.name} — ${place.realName}` : place.name;
  el.innerHTML = `<span class="bus-badge">P</span><span class="bus-label">${place.icon} ${place.name}</span>`;
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

function walkTo(target, startClock, label, { allowEarlyHome = false, roam = false } = {}) {
  if (typeof hideScene === "function") hideScene();
  return new Promise((resolve, reject) => {
    let clock = startClock;
    let last = performance.now();
    let paused = false;
    let walkedMinAcc = 0;
    let hasLeftHome = !(allowEarlyHome || roam) || distanceMeters(state.charPos, state.positions.home) > ARRIVAL_RADIUS_M;
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
        diary(`${currentStation.name}에서 ${modeLabel}를 타고 ${josa(dest.name, "까지/까지")} 갔다.`);

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
        // 대각선이면 좌우를 우선해서 바라본다
        const facing = dir.x !== 0 ? (dir.x > 0 ? "right" : "left") : dir.y > 0 ? "up" : "down";
        setSpriteFacing(facing, true);
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

      // 자유롭게 놀러 나간 경우엔 집을 한 번 벗어났다가 돌아와야 끝난다
      if (roam && !hasLeftHome && distanceMeters(state.charPos, state.positions.home) > ARRIVAL_RADIUS_M) hasLeftHome = true;
      if (dist <= ARRIVAL_RADIUS_M && (!roam || hasLeftHome)) {
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

      // 추억의 장소 근처를 잠시 서성이면 (하루 1번)
      for (const pe of state.placeEvents) {
        if (pe.doneToday || !pe.pos) continue;
        if (distanceMeters(state.charPos, pe.pos) <= pe.radiusM) {
          pe.dwell += dt;
          if (pe.dwell >= pe.dwellSec) {
            pe.doneToday = true;
            pauseFor(() => runPlaceMemory(pe, clock));
            return;
          }
        } else {
          pe.dwell = 0;
        }
      }

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

// locationBoost: {placeName, radiusM, multiplier} — 그 장소 근처에 있으면 이 이벤트가 뽑힐 확률이 올라간다
function effectiveEventWeight(e) {
  const base = e.weight ?? 1;
  if (!e.locationBoost) return base;
  const pos = resolveNamedPlace(e.locationBoost.placeName);
  if (!pos || distanceMeters(state.charPos, pos) > e.locationBoost.radiusM) return base;
  return base * (e.locationBoost.multiplier ?? 1);
}

async function runRandomEvent(clock) {
  const weighted = state.events.map((e) => ({ ...e, weight: effectiveEventWeight(e) }));
  const event = pickWeighted(weighted);
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
    speaker: event.speaker ?? "iroi",
  });

  if (event.id === "stranger") {
    state.recentStranger = { pos: { ...state.charPos }, called: new Set() };
  }

  let result = choice.result;
  if (choice.check) {
    const stat = state.character.stats[choice.check.stat] ?? 0;
    const chance = Math.min(0.9, Math.max(0.1, stat / (choice.check.threshold * 2)));
    result = Math.random() < chance ? choice.success : choice.fail;
  }

  const effect = nonZeroEffect(resolveEffect(result.effect, vars));
  const applied = applyEffect(effect);
  renderStats(state.character);
  const effectNote = Object.keys(applied).length ? ` (${appliedText(applied)})` : "";
  const what = event.title.replace(/^[^가-힣]+/u, "").trim();
  const how = fillTemplate(result.text, vars).replace(/^[^가-힣"0-9A-Za-z]+/u, "").trim();
  diary(`${/[.!?…]$/.test(what) ? what : `${what}.`} ${how}`);
  logLine(`${choice.label.replace(/^[^\s가-힣A-Za-z0-9"]+\s/, "")} → ${fillTemplate(result.text, vars)}${effectNote}`);
  await presentChoice("event-panel", result.crisis ? "⚠️ 위기 발생" : "결과", [{ label: "계속 걷기", value: true }], {
    body: `${fillTemplate(result.text, vars)}${effectNote}`,
    tone: result.crisis ? "danger" : "event",
    speaker: result.speaker ?? event.resultSpeaker ?? "iroi",
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
    body: `${place.greeting ?? "무엇을 할까?"}\n(지금 ${minutesToClock(clock)} · 용돈 ${state.character.wallet}원)`,
    tone: "hot",
    speaker: place.speaker ?? "iroi",
  });
  if (!item) {
    if (place.declineLine) {
      await presentChoice("event-panel", `${place.icon} ${place.name}`, [{ label: "▶ 계속 걷기", value: true }], {
        body: fillTemplate(place.declineLine, { doing: state.walkPurpose ?? "가야 할 데가 있어서 바빠야" }),
        speaker: "iroi",
      });
    }
    return 0;
  }
  if (place.acceptLine) {
    await presentChoice("event-panel", `${place.icon} ${place.name}`, [{ label: "▶", value: true }], {
      body: place.acceptLine,
      speaker: "iroi",
    });
  }
  state.character.wallet -= item.price;
  const applied = applyEffect(item.effect);
  renderStats(state.character);
  logLine(`${place.name}에서 ${item.name}${item.price ? ` (${item.price}원)` : ""} — ${appliedText(applied)}`);
  if (item.reaction) {
    await presentChoice("event-panel", `${item.icon} ${item.name}`, [{ label: "▶ 계속 걷기", value: true }], {
      body: `${item.reaction}\n(${appliedText(applied)})`,
      tone: "hot",
      speaker: "iroi",
    });
  }
  diary(
    item.price > 0
      ? `가는 길에 ${josa(place.name.split(" / ")[0], "에/에")} 들러서 ${josa(item.name, "을/를")} 샀다.`
      : `가는 길에 ${josa(place.name.split(" / ")[0], "에서/에서")} ${josa(item.name, "을/를")} 했다. 정말 신났다!`
  );
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
    body: `${minutesToClock(clock)} · 누구한테 전화하지?`,
    tone: "phone",
    speaker: "iroi",
  });
  if (!contact) return 0;

  const report = state.phone?.strangerReport;
  const rs = state.recentStranger;
  if (
    report &&
    rs &&
    report.calls[contact.id] &&
    !rs.called.has(contact.id) &&
    distanceMeters(state.charPos, rs.pos) <= report.radiusM
  ) {
    return strangerReportCall(contact, report);
  }

  const visit = state.phone?.companyVisit;
  const companyPos = visit ? state.places[visit.placeName] : null;
  if (
    contact.companyVisit &&
    companyPos &&
    !state.companyVisitedToday &&
    distanceMeters(state.charPos, companyPos) <= visit.radiusM
  ) {
    if (visit.persuade && contact.id === visit.persuade.contactId) {
      return offerMomCompanyOptions(contact, visit, clock);
    }
    return visitParentsCompany(contact, visit);
  }

  const placeCall = state.placeEvents.find(
    (pe) =>
      pe.pos &&
      pe.calls?.[contact.id] &&
      !pe.callsToday?.has(contact.id) &&
      distanceMeters(state.charPos, pe.pos) <= pe.callRadiusM
  );
  if (placeCall) return placeSpecialCall(placeCall, contact, clock);

  const line = pickRandom(contact.lines);
  const firstCall = !state.calledToday.has(contact.id);
  state.calledToday.add(contact.id);
  const effect = firstCall ? contact.effect ?? {} : {};
  const applied = applyEffect(effect);
  renderStats(state.character);
  const effectNote = Object.keys(applied).length ? ` (${appliedText(applied)})` : "";
  logLine(`📱 ${contact.name}에게 전화 — "${line}"${effectNote}`);
  diary(`${contact.name}에게 전화를 했다. "${line}"`);
  await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "끊기", value: true }], {
    body: `"${line}"${effectNote}`,
    tone: "phone",
    speaker: contact.portrait ?? contact.id,
    speakerName: contact.name,
  });
  return state.phone?.callMinutes ?? 2;
}

async function runPlaceMemory(pe, clock) {
  const line = pickRandom(pe.lines);
  const applied = applyEffect(pe.effect);
  renderStats(state.character);
  logLine(`${minutesToClock(clock)} ${pe.icon} ${pe.placeName} — "${line}" (${appliedText(applied)})`);
  diary(`${josa(pe.placeName, "을/를")} 지나가다가 옛날 생각이 났다. "${line}"`);
  await presentChoice("event-panel", `${pe.icon} ${pe.title}`, [{ label: "다시 걷기", value: true }], {
    body: `${pe.text}\n\n"${line}"\n(${appliedText(applied)})`,
    tone: "event",
    speaker: "iroi",
  });
  return pe.minutes ?? 0;
}

async function placeSpecialCall(pe, contact, clock) {
  pe.callsToday ??= new Set();
  pe.callsToday.add(contact.id);
  const call = pe.calls[contact.id];
  // 평일 9~16시(부모님 근무중)에는 "집으로 돌아와" 대신 준비된 workLine("이따 보자" 톤)을 쓴다
  const atWork = isParentAtWork(clock) && (contact.id === "mom" || contact.id === "dad");
  const line = atWork && call.workLine ? call.workLine : call.line;
  const applied = applyEffect(call.effect);
  renderStats(state.character);
  const note = Object.keys(applied).length ? ` (${appliedText(applied)})` : "";
  logLine(`📱 ${pe.placeName}에서 ${contact.name}에게 전화 — "${line}"${note}`);
  diary(`${josa(pe.placeName, "에서/에서")} ${contact.name}에게 전화했더니 ${call.diary}`);
  await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "끊기", value: true }], {
    body: `"${line}"${note}`,
    tone: call.tone ?? "phone",
    speaker: contact.portrait ?? contact.id,
    speakerName: contact.name,
  });
  return state.phone?.callMinutes ?? 2;
}

// 수상한 어른을 만난 직후(그 자리에서 100m 안) 경찰·엄마·아빠에게 전화하면
async function strangerReportCall(contact, report) {
  state.recentStranger.called.add(contact.id);
  const call = report.calls[contact.id];
  await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "▶", value: true }], {
    body: call.iroiLine,
    tone: call.tone ?? "danger",
    speaker: "iroi",
  });
  const applied = applyEffect(call.effect);
  renderStats(state.character);
  const note = Object.keys(applied).length ? `\n(${appliedText(applied)})` : "";
  logLine(`📱 ${contact.name}에게 수상한 어른을 만났다고 전화 — "${call.reply}"${note.replace("\n", " ")}`);
  diary(call.diary);
  await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "끊기", value: true }], {
    body: `${call.reply}${note}`,
    tone: "phone",
    speaker: contact.portrait ?? contact.id,
    speakerName: contact.name,
  });
  return state.phone?.callMinutes ?? 2;
}

// 엄마·아빠 회사(삼성메디슨) 근처에서 전화하면 → 회사 앞으로 나와서 간식 선물
async function visitParentsCompany(contact, visit) {
  state.companyVisitedToday = true;
  const who = contact.name;
  await presentChoice("event-panel", `📞 ${who}`, [{ label: "▶", value: true }], {
    body: `"${who}! 나 지금 ${who} 회사 앞이야. 잠깐 나와 줄 수 있어?"`,
    tone: "phone",
    speaker: "iroi",
  });
  await presentChoice("event-panel", `📞 ${who}`, [{ label: "기다리기", value: true }], {
    body: "\"뭐? 로이가 여기까지 왔다고? 금방 나갈게!\"",
    tone: "phone",
    speaker: contact.id,
  });

  const snacks = [...visit.snacks].sort(() => Math.random() - 0.5).slice(0, visit.pickCount);
  const total = { ...visit.baseEffect };
  snacks.forEach((snack) => {
    Object.entries(snack.effect).forEach(([k, v]) => {
      total[k] = (total[k] ?? 0) + v;
    });
  });
  const applied = applyEffect(total);
  renderStats(state.character);

  const snackNames = snacks.map((x) => `${x.icon} ${x.name}`).join(", ");
  const snackPlain = snacks.map((x) => x.name).join(", ");
  logLine(`🏢 ${visit.placeName} 앞 — ${josa(who, "이/가")} 나와서 간식을 줬다: ${snackPlain} (${appliedText(applied)})`);
  diary(
    `${visit.placeName} 앞에서 ${who}에게 전화했더니 ${josa(who, "이/가")} 회사에서 나왔다! ` +
      `회사 식권으로 받은 ${josa(snackPlain, "을/를")} 간식으로 선물해 줘서 맛있게 먹었다.`
  );
  await presentChoice("event-panel", `🏢 ${visit.placeName} 앞`, [{ label: "😋 맛있게 먹기", value: true }], {
    body: `(${josa(who, "이/가")} 회사에서 나와 꼭 안아 주었다!)\n"우리 로이 왔어? 회사 식권으로 받은 간식이야, 맛있게 먹어!"\n${snackNames}\n(${appliedText(applied)})`,
    tone: "event",
    speaker: contact.id,
  });
  return visit.minutes;
}

// 회사 근처에서 엄마에게 전화할 때 — 잠깐 나와달라고 할지, 아예 일찍 퇴근하자고 조를지 고른다
async function offerMomCompanyOptions(contact, visit, clock) {
  const choice = await presentChoice(
    "event-panel",
    `📞 ${contact.name}`,
    [
      { label: "🍪 회사 앞으로 잠깐 나와줄 수 있어?", value: "visit" },
      { label: `🏃 ${visit.persuade.message}`, value: "persuade" },
      { label: "📵 그냥 끊는다", value: null },
    ],
    {
      body: `${minutesToClock(clock)} · ${visit.placeName} 근처다. ${contact.name}한테 뭐라고 하지?`,
      tone: "phone",
      speaker: "iroi",
    }
  );
  if (choice === "visit") return visitParentsCompany(contact, visit);
  if (choice === "persuade") return persuadeMomLeaveWork(contact, visit);
  return 0;
}

async function persuadeMomLeaveWork(contact, visit) {
  state.companyVisitedToday = true;
  const p = visit.persuade;
  const logic = state.character.stats.logic ?? 0;
  const chance = Math.min(0.9, Math.max(0.1, logic / (p.logicThreshold * 2)));
  const success = Math.random() < chance;

  const line = success ? p.successLine : p.failLine;
  const applied = applyEffect(success ? p.successEffect : p.failEffect);
  renderStats(state.character);
  const note = Object.keys(applied).length ? ` (${appliedText(applied)})` : "";
  logLine(`📱 ${visit.placeName}에서 엄마에게 전화 — "${p.message}" → "${line}"${note}`);
  diary(
    success
      ? "엄마한테 빨리 퇴근하고 놀아달라고 졸랐더니, 엄마가 오늘은 특별히 일찍 퇴근하기로 했다! 너무 신났다."
      : "엄마한테 빨리 와달라고 졸랐는데, 엄마는 아직 일이 안 끝났다고 했다. 이따 보기로 했다."
  );
  await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: success ? "야호!" : "알겠어요", value: true }], {
    body: `"${line}"${note}`,
    tone: success ? "event" : "phone",
    speaker: contact.id,
  });
  return state.phone?.callMinutes ?? 2;
}

// 공용 대화창 (프린세스 메이커 2 메시지 창 스타일)
// options: [{ label, value, disabled, hint, group }]
// speaker: 초상화 id (iroi, mom, dad, …) — 없으면 해설(초상화 없음). speakerName으로 이름표만 바꿀 수 있다.
const TYPE_MS = 22;

function presentChoice(panelId, heading, options, { body = null, tone = null, speaker = null, speakerName = null } = {}) {
  if (typeof hideScene === "function") hideScene();
  return new Promise((resolve) => {
    const panel = document.getElementById("event-panel");
    const spec = speaker && typeof portraitSpec === "function" ? portraitSpec(speaker) : null;
    panel.className = `map-overlay-panel pm-dialog${spec ? "" : " no-portrait"}`;
    panel.dataset.tone = tone ?? "";
    panel.innerHTML = "";
    panel.hidden = false;

    if (spec) {
      const frame = document.createElement("div");
      frame.className = "pm-portrait";
      frame.style.background = spec.bg ?? "#3d4a78";
      frame.appendChild(portraitElement(speaker));
      panel.appendChild(frame);
    }

    const main = document.createElement("div");
    main.className = "pm-main";
    panel.appendChild(main);

    if (spec) {
      const name = document.createElement("div");
      name.className = "pm-name";
      name.textContent = speakerName ?? spec.name;
      main.appendChild(name);
    }

    const h = document.createElement("p");
    h.className = "choice-heading";
    h.textContent = heading;
    // 이름표와 같은 말("📞 엄마" 등)이면 제목은 숨겨서 이름이 두 번 나오지 않게
    if (spec && heading.includes(speakerName ?? spec.name)) h.hidden = true;
    main.appendChild(h);

    const bodyEl = document.createElement("p");
    bodyEl.className = "choice-body";
    main.appendChild(bodyEl);

    const choices = document.createElement("div");
    choices.className = "pm-choices";
    choices.hidden = true;
    main.appendChild(choices);

    let timer = 0;
    let row = null;
    let currentGroup;
    options.forEach((opt) => {
      if (!row || opt.group !== currentGroup) {
        currentGroup = opt.group;
        if (opt.group) {
          const g = document.createElement("p");
          g.className = "choice-group";
          g.textContent = opt.group;
          choices.appendChild(g);
        }
        row = document.createElement("div");
        row.className = "chip-row";
        choices.appendChild(row);
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "transport-btn";
      btn.disabled = !!opt.disabled;
      btn.textContent = opt.label;
      if (opt.hint) btn.title = opt.hint;
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        clearInterval(timer);
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

    // 한 글자씩 써 내려가기 — 대화창을 누르면 바로 다 보인다
    const full = body ?? "";
    let shown = 0;
    const finish = () => {
      clearInterval(timer);
      bodyEl.textContent = full;
      bodyEl.classList.add("done");
      choices.hidden = false;
    };
    panel.onclick = (ev) => {
      if (ev.target.closest("button")) return;
      if (!choices.hidden) return;
      finish();
    };
    if (!full) {
      finish();
    } else {
      timer = setInterval(() => {
        shown += 1;
        bodyEl.textContent = full.slice(0, shown);
        if (shown >= full.length) finish();
      }, TYPE_MS);
    }
  });
}

async function waitUntil(startClock, endClock, label, durationMs = WAIT_PHASE_MS, scene = null) {
  setStatus(`${minutesToClock(startClock)} · ${label}`);
  if (scene && typeof showScene === "function") showScene(scene, `${minutesToClock(startClock)} · ${label}`);
  await animate(durationMs, (t) => {
    const text = `${minutesToClock(startClock + (endClock - startClock) * t)} · ${label}`;
    setStatus(text);
    if (scene && typeof setSceneCaption === "function") setSceneCaption(text);
  });
  setStatus(`${minutesToClock(endClock)} · ${label}`);
}

function chooseRideDestination(kind, currentStation, stations) {
  const modeLabel = kind === "bus" ? "버스" : "지하철";
  const fare = kind === "bus" ? BUS_FARE : SUBWAY_FARE;
  return presentChoice(
    "event-panel",
    `${kind === "bus" ? "🚌" : "🚇"} ${currentStation.name}`,
    [
      { label: "🚶 그냥 걷기", value: null },
      ...stations
        .filter((st) => st.id !== currentStation.id)
        .map((st) => ({ label: `${st.name} (${fare}원)`, value: st, disabled: state.character.wallet < fare })),
    ],
    { body: `${currentStation.name}에 왔다! ${josa(modeLabel, "을/를")} 타고 어디로 갈까? (용돈 ${state.character.wallet}원)`, speaker: "iroi" }
  );
}

function confirmGoHomeEarly() {
  return presentChoice(
    "event-panel",
    "🏠 우리집 앞",
    [
      { label: "예 — 일정을 취소하고 집에 들어간다", value: true },
      { label: "아니오 — 가던 길을 간다", value: false },
    ],
    { body: "어? 집 앞까지 와 버렸네… 오늘 남은 일정은 그만하고 집에 들어갈까?", speaker: "iroi" }
  );
}

async function rideTransit(target, startClock, label) {
  const dist = distanceMeters(state.charPos, target);
  const gameMinutes = Math.max(5, Math.round(dist / TRANSIT_M_PER_MIN));
  const endClock = startClock + gameMinutes;
  const fromPos = { ...state.charPos };
  const dLat = target.lat - fromPos.lat;
  const dLng = (target.lng - fromPos.lng) * Math.cos((fromPos.lat * Math.PI) / 180);
  setSpriteFacing(Math.abs(dLng) >= Math.abs(dLat) ? (dLng > 0 ? "right" : "left") : dLat > 0 ? "up" : "down", false);
  setSpriteRide(label.includes("지하철") ? "🚇" : "🚌");

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
  setSpriteRide(null);
  setStatus(`${minutesToClock(endClock)} · ${label}`);
  return endClock;
}

function travelTo(target, startClock, placeName) {
  state.walkPurpose = `${josa(placeName, "에/에")} 가야`;
  const allowEarlyHome = target !== state.positions.home;
  return walkTo(target, startClock, `${placeName}(으)로 이동 중`, { allowEarlyHome });
}

// CSV의 P 장소를 이름으로 찾는다 (학원·활동은 `place` 필드 또는 이름이 같으면 연결)
function csvAcademy(...names) {
  for (const n of names) {
    if (n && state.academyPlaces?.[n]) return state.academyPlaces[n];
  }
  return null;
}

function csvPlace(...names) {
  for (const n of names) {
    if (n && state.places[n]) return state.places[n];
  }
  return null;
}

// 이벤트의 locationBoost 등에서 쓰는, 이름으로 아무 장소(P/역/정류장)나 찾는 범용 조회
function resolveNamedPlace(name) {
  if (!name) return null;
  if (state.places[name]) return state.places[name];
  const station = [...(state.stations?.subway ?? []), ...(state.stations?.bus ?? [])].find((s) =>
    s.name.includes(name)
  );
  return station ? station.pos : null;
}

async function renderMap(character, academies, activities, csvRows, hotplaces) {
  const stations = csvRows.filter((r) => r.type === "B" || r.type === "S");
  state.places = Object.fromEntries(csvRows.filter((r) => r.type === "P").map((r) => [r.name, r.pos]));
  state.academyPlaces = Object.fromEntries(csvRows.filter((r) => r.type === "A").map((r) => [r.name, r.pos]));
  const csvHome = csvRows.find((r) => r.type === "H");

  const map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(HOME_FALLBACK.lat, HOME_FALLBACK.lng),
    level: MAP_ZOOM_LEVEL,
  });
  state.map = map;

  const homePos = csvHome ? csvHome.pos : await resolveHomePosition(character.home);
  state.positions.home = homePos;
  map.setCenter(new kakao.maps.LatLng(homePos.lat, homePos.lng));
  createStationOverlay(map, homePos, "H", csvHome?.name ?? "우리집");

  const schoolFallback = offsetLatLng(homePos.lat, homePos.lng, HOME_SCHOOL_WALK_MIN * CHILD_WALK_M_PER_MIN, 45);
  state.positions.school = await resolvePlace(character.school.address, null, schoolFallback);
  createStationOverlay(map, state.positions.school, "school", character.school.name);

  const placeableAcademies = academies.filter((a) => a.location.etaMinFromHome != null);
  for (let i = 0; i < placeableAcademies.length; i++) {
    const academy = placeableAcademies[i];
    const bearingDeg = (360 / placeableAcademies.length) * i;
    const isWalk = academy.location.mode === "walk";
    const mPerMin = isWalk ? CHILD_WALK_M_PER_MIN : TRANSIT_M_PER_MIN;
    const distanceM = academy.location.etaMinFromHome * mPerMin;
    const fallbackPos = offsetLatLng(homePos.lat, homePos.lng, distanceM, bearingDeg);
    const fromCsv = csvAcademy(academy.place, academy.name) ?? csvPlace(academy.place, academy.name);
    const pos = fromCsv ?? (await resolvePlace(academy.address, null, fallbackPos));
    state.positions.academies[academy.id] = pos;
    const category = state.categoryMap[academy.categoryId];
    const etaText = isWalk ? `도보 ${academy.location.etaMinFromHome}분` : `버스/지하철 약 ${academy.location.etaMinFromHome}분`;
    createStationOverlay(map, pos, "A", academy.name);
  }

  for (const activity of activities) {
    if (activity.location === "home") continue;
    const fallbackPos = offsetLatLng(homePos.lat, homePos.lng, (activity.travelMin ?? 15) * CHILD_WALK_M_PER_MIN, 200);
    const fromCsv = csvPlace(activity.place, activity.name);
    const pos = fromCsv ?? (await resolvePlace(activity.address, activity.placeQuery, fallbackPos));
    state.positions.activities[activity.id] = pos;
    if (!fromCsv) createStationOverlay(map, pos, "P", activity.name);
  }

  for (const station of stations) {
    const list = station.type === "S" ? state.stations.subway : state.stations.bus;
    list.push(station);
    createStationOverlay(map, station.pos, station.type, station.name);
  }

  // H(우리집)·P(장소)도 동그라미 알파벳 아이콘 + 레이블
  csvRows
    .filter((r) => r.type === "P")
    .forEach((r) => createStationOverlay(map, r.pos, r.type, r.name));

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
    const avg = groupAverage(character, group);
    const row = document.createElement("div");
    row.className = "stat-row group-row";
    row.innerHTML = `
      <span class="icon">${group.icon}</span>
      <span class="label">${group.label}</span>
      <span class="bar"><span style="width:${Math.min(avg, 100)}%"></span></span>
      <span class="value">${avg}</span>
    `;
    statsEl.appendChild(row);
  });
  const delinquency = character.stats.delinquency ?? 0;
  if (delinquency > 0) {
    const warn = document.createElement("p");
    warn.className = "stat-warn";
    warn.textContent = `😈 비행화 ${delinquency}`;
    statsEl.appendChild(warn);
  }
  const more = document.createElement("button");
  more.type = "button";
  more.className = "stat-more";
  more.textContent = "📊 전체 능력치 보기";
  more.addEventListener("click", () => showView("status"));
  statsEl.appendChild(more);

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
  renderStatusView();
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

function groupAverage(character, group) {
  const positive = group.stats.filter((key) => !NEGATIVE_STATS.has(key));
  return Math.round(positive.reduce((sum, key) => sum + (character.stats[key] ?? 0), 0) / positive.length);
}

function conditionComment(character) {
  const c = character.condition;
  if (c.stress >= 70) return "😵 스트레스가 많이 쌓였어요. 오늘은 일정을 줄이고 쉬게 해 주세요.";
  if (c.hunger <= LOW_HUNGER) return "🍚 배가 고파요. 배고프면 능력치가 절반만 자라요.";
  if (c.staminaNow <= LOW_ENERGY) return "🔋 기력이 바닥났어요. 지치면 능력치가 절반만 자라요.";
  if ((character.stats.delinquency ?? 0) >= 10) return "😈 요즘 행동이 조금 걱정돼요. 바른 선택을 할 수 있게 도와주세요.";
  if (c.stress <= 20) return "😊 컨디션 최고! 오늘은 무엇이든 잘 배울 수 있을 것 같아요.";
  return "🙂 평소처럼 씩씩하게 지내고 있어요.";
}

// 프린세스 메이커 2의 상태 화면처럼 — 프로필 + 분류별 전체 능력치
function renderStatusView() {
  const character = state.character;
  const profile = document.getElementById("status-profile");
  if (!profile) return;
  const positiveKeys = Object.keys(STAT_LABELS).filter((k) => !NEGATIVE_STATS.has(k));
  const sorted = [...positiveKeys].sort((a, b) => (character.stats[b] ?? 0) - (character.stats[a] ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const delta = state.lastDay?.delta ?? {};
  const hasDelta = Object.keys(delta).length > 0;

  profile.innerHTML = `
    <img class="status-avatar" src="img/character-face.png" alt="${character.name}">
    <div class="status-info">
      <p class="status-name">${character.name} <span class="muted">초등학교 ${character.grade}학년</span></p>
      <p class="muted">${formatGameDate(gameDateForDay(state.day))} · Day ${state.day} · 💰 ${character.wallet}원</p>
      <p class="status-cond">🍚 허기 ${character.condition.hunger} · 🔋 기력 ${character.condition.staminaNow} · 😵 스트레스 ${character.condition.stress}${state.safetyEducated ? " · 🦺 안전교육 이수" : ""}</p>
      <p class="status-comment">${conditionComment(character)}</p>
      <p class="muted">가장 자신 있는 능력: <strong>${STAT_ICONS[best]} ${STAT_LABELS[best]} ${character.stats[best]}</strong> · 더 키워야 할 능력: <strong>${STAT_ICONS[worst]} ${STAT_LABELS[worst]} ${character.stats[worst]}</strong></p>
    </div>
  `;

  const groupsEl = document.getElementById("status-groups");
  groupsEl.innerHTML = "";
  STAT_GROUPS.forEach((group) => {
    const card = document.createElement("section");
    card.className = `status-group status-${group.id}`;
    card.innerHTML = `<h3>${group.icon} ${group.label} <span class="group-avg">평균 ${groupAverage(character, group)}</span></h3>`;
    group.stats.forEach((key) => {
      const value = character.stats[key] ?? 0;
      const d = delta[key] ?? 0;
      const good = NEGATIVE_STATS.has(key) ? d < 0 : d > 0;
      const row = document.createElement("div");
      row.className = `stat-row${NEGATIVE_STATS.has(key) ? " negative" : ""}`;
      row.title = STAT_INFO[key] ?? "";
      row.innerHTML = `
        <span class="icon">${STAT_ICONS[key] ?? ""}</span>
        <span class="label">${STAT_LABELS[key] ?? key}</span>
        <span class="bar"><span style="width:${Math.min(value, 100)}%"></span></span>
        <span class="value">${value}</span>
        <span class="delta ${d === 0 ? "" : good ? "up" : "down"}">${d === 0 ? "" : `${d > 0 ? "+" : ""}${d}`}</span>
      `;
      card.appendChild(row);
      const info = document.createElement("p");
      info.className = "stat-info";
      info.textContent = STAT_INFO[key] ?? "";
      card.appendChild(info);
    });
    groupsEl.appendChild(card);
  });

  document.getElementById("status-delta-note").textContent = hasDelta
    ? `오른쪽 숫자는 지난 일과(Day ${state.lastDay.day}) 동안의 변화예요.`
    : "일과를 한 번 마치면 그날 능력치가 얼마나 변했는지 함께 보여 줘요.";
}

function statDelta(before, after) {
  const out = {};
  Object.keys(STAT_LABELS).forEach((key) => {
    const d = (after[key] ?? 0) - (before[key] ?? 0);
    if (d !== 0) out[key] = d;
  });
  return out;
}

// ── 저장 / 불러오기 (localStorage는 항상, Firebase가 설정돼 있으면 클라우드에도) ──
function buildSaveData() {
  return {
    version: 2,
    day: state.day,
    stats: state.character.stats,
    condition: state.character.condition,
    wallet: state.character.wallet,
    registrations: state.registrations,
    safetyEducated: state.safetyEducated,
    creativeCount: state.creativeCount,
    ui: { afterschoolCourse: state.ui.afterschoolCourse, careProgram: state.ui.careProgram },
    lastDay: state.lastDay ?? null,
    weekPlan: state.weekPlan,
  };
}

function applySaveData(data) {
  state.day = data.day;
  Object.assign(state.character.stats, data.stats);
  Object.assign(state.character.condition, data.condition);
  state.character.wallet = data.wallet;
  state.registrations = data.registrations ?? { active: {}, pending: {} };
  state.safetyEducated = !!data.safetyEducated;
  state.creativeCount = data.creativeCount ?? 0;
  if (data.ui?.afterschoolCourse) state.ui.afterschoolCourse = data.ui.afterschoolCourse;
  if (data.ui?.careProgram) state.ui.careProgram = data.ui.careProgram;
  state.lastDay = data.lastDay ?? null;
  state.weekPlan = data.weekPlan ?? {};
}

function saveGame() {
  const data = buildSaveData();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("저장 실패", err);
  }
  if (state.cloud.ready) {
    state.cloud.docRef.set(data).catch((err) => console.warn("클라우드 저장 실패 — 이 기기엔 저장됐어요", err));
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
    document.head.appendChild(el);
  });
}

// firebase-config.js에 실제 값이 채워져 있을 때만 SDK를 불러와 연결한다 — 없으면 이 기기 저장만 쓴다
async function initCloudSave() {
  if (typeof FIREBASE_CONFIG === "undefined" || !FIREBASE_CONFIG.apiKey) return;
  try {
    await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore-compat.js`);
    firebase.initializeApp(FIREBASE_CONFIG);
    await firebase.auth().signInAnonymously();
    state.cloud.db = firebase.firestore();
    state.cloud.docRef = state.cloud.db.collection("saves").doc(CLOUD_SAVE_ID);
    state.cloud.ready = true;
  } catch (err) {
    console.warn("클라우드 저장 연결 실패 — 이 기기 저장만 사용합니다", err);
    state.cloud.ready = false;
  }
}

async function loadFromCloud() {
  if (!state.cloud.ready) return false;
  try {
    const snap = await state.cloud.docRef.get();
    if (!snap.exists) return false;
    const data = snap.data();
    if (data.version !== 2) return false;
    applySaveData(data);
    return true;
  } catch (err) {
    console.warn("클라우드 불러오기 실패 — 이 기기 저장을 대신 확인합니다", err);
    return false;
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.version !== 2) return false;
    applySaveData(data);
    return true;
  } catch (err) {
    console.warn("불러오기 실패", err);
    return false;
  }
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
        <span class="muted">${growthText} · ${hoursText} · ${addressText}</span>
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
          saveGame();
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
        saveGame();
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

// 배고프거나(허기 ≤ 30) 지치면(기력 ≤ 20) 능력치 성장이 절반으로 줄어든다
function growthMultiplier() {
  const c = state.character.condition;
  return c.hunger <= LOW_HUNGER || c.staminaNow <= LOW_ENERGY ? 0.5 : 1;
}

// 효과를 적용하고 실제로 적용된 값을 돌려준다 (로그는 이 값으로 찍는다)
function applyEffect(effect, { modifier = true } = {}) {
  const mult = modifier ? growthMultiplier() : 1;
  const applied = {};
  let halved = false;
  Object.entries(effect).forEach(([key, amount]) => {
    if (key === "wallet") {
      state.character.wallet = Math.max(0, state.character.wallet + amount);
      applied[key] = amount;
    } else if (key === "hunger" || key === "staminaNow" || key === "stress") {
      state.character.condition[key] = Math.min(100, Math.max(0, state.character.condition[key] + amount));
      applied[key] = amount;
    } else {
      let gain = amount;
      if (amount > 0 && !NEGATIVE_STATS.has(key) && mult < 1) {
        // 확률 반올림: +1이면 50% 확률로 0, +3이면 1 또는 2
        const scaled = amount * mult;
        gain = Math.floor(scaled) + (Math.random() < scaled - Math.floor(scaled) ? 1 : 0);
        if (gain < amount) halved = true;
      }
      state.character.stats[key] = Math.min(100, Math.max(0, (state.character.stats[key] ?? 0) + gain));
      if (gain !== 0) applied[key] = gain;
    }
  });
  Object.defineProperty(applied, "halved", { value: halved, enumerable: false });
  return applied;
}

function appliedText(applied) {
  const text = signedEffectText(applied);
  if (!applied.halved) return text;
  return `${text ? `${text} · ` : ""}배고프거나 지쳐서 덜 자랐다`;
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

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="item-icon">${activity.icon}</span>
      <span>
        <strong>${activity.name}</strong> (${activity.durationMin}분)<br>
        <span class="muted">${signedEffectText(activity.effect)} · ${locationText}${activity.location === "home" ? "" : ` · ${hoursText}`}</span>
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
      applyEffect(item.effect, { modifier: false });
      renderStats(state.character);
      renderShop();
      saveGame();
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

// ── 주간 계획 ──
function planFor(day) {
  if (!state.weekPlan[day]) state.weekPlan[day] = buildDefaultBlocks(day);
  return state.weekPlan[day];
}

// 평일이면 이번 주 월~금 5칸, 주말이면 오늘 하루만
function plannerDays() {
  const dow = weekdayOf(state.day);
  if (dow >= 1 && dow <= 5) {
    const monday = state.day - (dow - 1);
    return [0, 1, 2, 3, 4].map((i) => monday + i);
  }
  return [state.day];
}

function isDayEditable(day) {
  return !state.dayRunning && day >= state.day;
}

function pruneWeekPlan() {
  const first = plannerDays()[0];
  Object.keys(state.weekPlan).forEach((key) => {
    if (Number(key) < first) delete state.weekPlan[key];
  });
}

function dayHeaderInfo(day) {
  const date = gameDateForDay(day);
  const key = gameDateKey(date);
  const holiday = state.holidays?.find((h) => h.date === key);
  const vacation = vacationOf(day);
  return {
    title: `${WEEKDAY_LABELS[date.getUTCDay()]} ${date.getUTCMonth() + 1}/${date.getUTCDate()}`,
    tag: holiday ? holiday.name : vacation ? vacation.name : null,
  };
}

// 포인터 아래의 요일 칸과 시간 줄
function cellFromPoint(clientX, clientY) {
  const wrap = document.getElementById("timetable-wrap").getBoundingClientRect();
  if (clientX < wrap.left || clientX > wrap.right || clientY < wrap.top || clientY > wrap.bottom) return null;
  for (const col of document.querySelectorAll("#timetable .tt-col")) {
    const r = col.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      const row = Math.min(Math.max(Math.floor((clientY - r.top) / ROW_PX), 0), TOTAL_ROWS - 1);
      return { day: Number(col.dataset.day), col, row };
    }
  }
  return null;
}

function flashReject() {
  const el = document.getElementById("timetable-wrap");
  el.classList.add("tt-reject");
  setTimeout(() => el.classList.remove("tt-reject"), 350);
}

function rangeConflicts(day, range) {
  return range.invalid || planFor(day).some((b) => rangesOverlap(b.startMin, b.endMin, range.startMin, range.endMin));
}

let previewEl = null;
function updatePreview(hit) {
  clearPreview();
  if (!hit) return;
  const { range, col, day } = hit;
  const bad = rangeConflicts(day, range);
  previewEl = document.createElement("div");
  previewEl.className = `tt-preview ${bad ? "tt-preview-bad" : "tt-preview-ok"}`;
  previewEl.style.top = `${minutesToRow(range.startMin) * ROW_PX}px`;
  previewEl.style.height = `${(minutesToRow(range.endMin) - minutesToRow(range.startMin)) * ROW_PX}px`;
  col.appendChild(previewEl);
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

    function hitTest(clientX, clientY) {
      const cell = cellFromPoint(clientX, clientY);
      if (!cell) return null;
      const range = rangeForSpec(spec, rowToMinutes(cell.row), cell.day);
      if (!range) return null;
      if (!isDayEditable(cell.day)) range.invalid = true;
      return { ...cell, range };
    }

    function onMove(ev) {
      moveGhostTo(ghost, ev.clientX, ev.clientY);
      updatePreview(hitTest(ev.clientX, ev.clientY));
    }

    function onUp(ev) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ghost.remove();
      clearPreview();

      const hit = hitTest(ev.clientX, ev.clientY);
      if (!hit) return;
      if (rangeConflicts(hit.day, hit.range)) {
        flashReject();
        return;
      }
      const plan = planFor(hit.day);
      plan.push({
        id: spec.kind === "school" ? "school" : `${spec.kind}-${spec.academyId ?? spec.activityId ?? spec.careSlot ?? "x"}-${Date.now()}`,
        kind: spec.kind,
        academyId: spec.academyId,
        activityId: spec.activityId,
        courseId: spec.kind === "afterschool" ? state.ui.afterschoolCourse : undefined,
        careSlot: spec.careSlot,
        programId: spec.kind === "care" && spec.careSlot !== "morning" ? state.ui.careProgram : undefined,
        startMin: hit.range.startMin,
        endMin: hit.range.endMin,
      });
      plan.sort((x, y) => x.startMin - y.startMin);
      saveGame();
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

// 팔레트 항목을 그 날(day)의 rowStartMin에 떨어뜨렸을 때의 시간 범위. invalid면 놓을 수 없다.
function rangeForSpec(spec, rowStartMin, day) {
  const vacation = vacationOf(day);
  const weekday = isWeekday(day);
  if (spec.kind === "school") return { ...schoolTimesFor(day), invalid: !!vacation };
  if (spec.kind === "afterschool") {
    const t = afterschoolTimesFor(day);
    return { startMin: t.startMin, endMin: t.endMin, invalid: !weekday || !!vacation };
  }
  if (spec.kind === "care") {
    const slot = careSlotById(spec.careSlot);
    const dayOk = slot.vacationOnly ? weekday && !!vacation : weekday && !vacation;
    let endMin = clockToMinutes(slot.end);
    let startMin;
    if (slot.start) {
      startMin = clockToMinutes(slot.start);
    } else {
      // 오후돌봄: 정규수업/방과후교육이 끝나는 시각에 맞춰 시작
      const plan = planFor(day);
      const schoolish = plan.filter((b) => b.kind === "school" || b.kind === "afterschool");
      startMin = schoolish.length ? Math.max(...schoolish.map((b) => b.endMin)) : rowStartMin;
      // 뒤에 학원 등 다른 일정이 있으면 그 전까지만 돌봄
      const nextStarts = plan.map((b) => b.startMin).filter((m) => m >= startMin);
      if (nextStarts.length) endMin = Math.min(endMin, ...nextStarts);
    }
    return { startMin, endMin, invalid: !dayOk || startMin >= endMin };
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

  const days = plannerDays();
  const schoolDays = days.filter((d) => isWeekday(d) && !vacationOf(d));
  const vacationDays = days.filter((d) => isWeekday(d) && vacationOf(d));
  const school = paletteGroup(el, "🏫 학교 수업");

  if (days.some((d) => !vacationOf(d))) {
    school.row.appendChild(createChip(SCHOOL_ICON, "정규수업 (월·금 ~12:50 / 화~목 ~13:40)", { kind: "school" }, "chip-school"));
  }

  if (schoolDays.length) {
    const course = afterschoolCourseById(state.ui.afterschoolCourse);
    school.row.appendChild(
      createChip(course?.icon ?? "🎒", "방과후 수업", { kind: "afterschool" }, "chip-afterschool")
    );
  }

  const careSlots = (state.neulbom?.slots ?? []).filter((slot) => (slot.vacationOnly ? vacationDays.length : schoolDays.length));
  careSlots.forEach((slot) => {
    const timeText = slot.start ? `${slot.start}–${slot.end}` : `~${slot.end}`;
    school.row.appendChild(createChip(slot.icon, `${slot.name} (${timeText})`, { kind: "care", careSlot: slot.id }, "chip-care"));
  });

  if (schoolDays.length || vacationDays.length) {
    const opts = document.createElement("div");
    opts.className = "palette-options";
    if (schoolDays.length && state.afterschoolCourses.length) {
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

  const acads = paletteGroup(el, "🏢 학원 — 정해진 수업시간이 아닐 때에 가면 자율학습을 한다. 각 수업은 60분 진행한다.");
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

function blockDisplay(block, day = state.day) {
  const dow = weekdayOf(day);
  if (block.kind === "school") return { icon: SCHOOL_ICON, label: "정규수업", cls: "tt-school" };
  if (block.kind === "afterschool") {
    const course = afterschoolCourseById(block.courseId);
    return { icon: course?.icon ?? "🎒", label: `방과후 · ${course?.name ?? "?"}`, cls: "tt-afterschool" };
  }
  if (block.kind === "care") {
    const slot = careSlotById(block.careSlot);
    const program = careProgramById(block.programId);
    return { icon: slot?.icon ?? "🏠", label: `${slot?.name ?? ""}${program ? ` · ${program.name}` : ""}`, cls: "tt-care" };
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
  const days = plannerDays();
  el.style.setProperty("--tt-cols", days.length);
  el.classList.toggle("tt-week", days.length > 1);

  const head = document.createElement("div");
  head.className = "tt-head";
  head.appendChild(document.createElement("div"));
  days.forEach((day) => {
    const info = dayHeaderInfo(day);
    const h = document.createElement("div");
    h.className = `tt-day-head${day === state.day ? " today" : ""}${day < state.day ? " past" : ""}${info.tag ? " holiday" : ""}`;
    h.innerHTML = `<strong>${info.title}</strong>${day === state.day ? '<span class="tt-tag">오늘</span>' : ""}${
      info.tag ? `<span class="tt-tag">${info.tag}</span>` : ""
    }`;
    head.appendChild(h);
  });
  el.appendChild(head);

  const body = document.createElement("div");
  body.className = "tt-body";
  body.style.height = `${TOTAL_ROWS * ROW_PX}px`;

  const gutter = document.createElement("div");
  gutter.className = "tt-gutter";
  for (let row = 0; row <= TOTAL_ROWS; row += 2) {
    const label = document.createElement("span");
    label.style.top = `${row * ROW_PX}px`;
    label.textContent = minutesToClock(rowToMinutes(row));
    gutter.appendChild(label);
  }
  body.appendChild(gutter);

  days.forEach((day) => {
    const editable = isDayEditable(day);
    const col = document.createElement("div");
    col.className = `tt-col${day === state.day ? " today" : ""}${!editable ? " locked" : ""}`;
    col.dataset.day = String(day);

    planFor(day).forEach((block) => {
      const top = minutesToRow(block.startMin) * ROW_PX;
      const height = minutesToRow(block.endMin) * ROW_PX - top;
      const { icon, label, cls } = blockDisplay(block, day);
      const div = document.createElement("div");
      div.className = `tt-block ${cls}`;
      div.style.top = `${top}px`;
      div.style.height = `${height}px`;
      div.title = `${minutesToClock(block.startMin)}–${minutesToClock(block.endMin)} ${label}`;

      const span = document.createElement("span");
      span.className = "tt-label";
      span.innerHTML = `<span>${icon}</span><span>${minutesToClock(block.startMin)} ${label}</span>`;
      div.appendChild(span);

      if (editable) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "tt-remove";
        removeBtn.setAttribute("aria-label", "일정 삭제");
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => {
          if (!isDayEditable(day)) return;
          state.weekPlan[day] = planFor(day).filter((b) => b.id !== block.id);
          saveGame();
          renderTimetable();
        });
        div.appendChild(removeBtn);
      }
      col.appendChild(div);
    });
    body.appendChild(col);
  });
  el.appendChild(body);

  const note = document.getElementById("planner-note");
  if (note) {
    const dow = weekdayOf(state.day);
    note.textContent =
      dow === 1
        ? "📋 월요일 — 이번 주(월~금) 일정을 짜는 날이에요. 요일 칸에 항목을 끌어다 놓으세요."
        : dow >= 2 && dow <= 5
        ? "✏️ 이번 주 계획대로 진행해요. 오늘과 남은 요일 일정은 아직 고칠 수 있어요(지난 요일은 잠김)."
        : "🌤️ 주말이에요 — 오늘 하루 일정만 짜요. 월요일이 되면 새 한 주 일정을 짠다.";
  }
  document.getElementById("start-day-btn").textContent = `오늘(${WEEKDAY_LABELS[weekdayOf(state.day)]}) 일과 시작`;

  renderPalette();
}

// ── 오늘의 일기 ──
// 받침 유무에 따라 조사 고르기: josa("떡볶이", "을/를") → "떡볶이를"
function josa(word, pair) {
  const [withBatchim, withoutBatchim] = pair.split("/");
  const core = String(word).replace(/\s*\([^)]*\)\s*$/, "").trim();
  const last = core.charCodeAt(core.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    const jong = (last - 0xac00) % 28;
    if (pair === "으로/로") return `${word}${jong === 0 || jong === 8 ? "로" : "으로"}`;
    return `${word}${jong === 0 ? withoutBatchim : withBatchim}`;
  }
  return `${word}${withBatchim}(${withoutBatchim})`;
}

function diary(text) {
  state.diaryEntries.push(text);
}

const DIARY_WEATHER = ["☀️ 맑음", "⛅ 구름 조금", "☁️ 흐림", "🌧️ 비", "🌬️ 바람", "🌈 맑게 갬"];


function diaryClosing(character, gotSick) {
  const c = character.condition;
  if (gotSick) return "몸이 안 좋아서 오늘은 일찍 자야겠다. 내일은 꼭 나아야지.";
  if (c.stress >= 60) return "오늘은 정말 정말 피곤한 하루였다. 푹 자고 싶다.";
  if (c.stress <= 20) return "오늘도 즐거운 하루였다! 내일은 또 무슨 일이 생길까?";
  return "오늘 하루도 끝! 내일도 힘내자.";
}

function showDiary({ delta, gotSick }) {
  const overlay = document.getElementById("diary-overlay");
  const date = gameDateForDay(state.day);
  document.getElementById("diary-title").textContent = `[오늘의 일기] ${formatGameDate(date)}`;
  document.getElementById("diary-weather").textContent = `날씨: ${DIARY_WEATHER[(state.day * 7 + 3) % DIARY_WEATHER.length]}`;

  const body = document.getElementById("diary-body");
  body.innerHTML = "";
  const entries = state.diaryEntries.length ? state.diaryEntries : ["오늘은 별일 없이 조용히 지나갔다."];
  [...entries, diaryClosing(state.character, gotSick)].forEach((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    body.appendChild(p);
  });

  const statsEl = document.getElementById("diary-stats");
  statsEl.innerHTML = "";
  const keys = Object.keys(delta);
  if (keys.length === 0) {
    statsEl.innerHTML = '<span class="diary-chip">능력치 변화 없음</span>';
  } else {
    keys.forEach((key) => {
      const d = delta[key];
      const good = NEGATIVE_STATS.has(key) ? d < 0 : d > 0;
      const chip = document.createElement("span");
      chip.className = `diary-chip ${good ? "up" : "down"}`;
      chip.textContent = `${STAT_ICONS[key] ?? ""} ${STAT_LABELS[key] ?? key} ${d > 0 ? "+" : ""}${d}`;
      statsEl.appendChild(chip);
    });
  }
  const c = state.character.condition;
  document.getElementById("diary-condition").textContent =
    `🍚 허기 ${c.hunger} · 🔋 기력 ${c.staminaNow} · 😵 스트레스 ${c.stress} · 💰 ${state.character.wallet}원`;

  overlay.hidden = false;
  overlay.scrollTop = 0;
  document.getElementById("sleep-btn").focus();
}

// 잠자기: 화면이 잠시 어두워졌다가 다음 날 일정 화면으로
function sleepAndAdvance() {
  const fade = document.getElementById("sleep-fade");
  const btn = document.getElementById("sleep-btn");
  btn.disabled = true;
  fade.hidden = false;
  requestAnimationFrame(() => fade.classList.add("on"));
  setTimeout(() => {
    document.getElementById("diary-overlay").hidden = true;
    advanceToNextDay();
    showView("schedule");
    window.scrollTo(0, 0);
    fade.classList.remove("on");
    setTimeout(() => {
      fade.hidden = true;
      btn.disabled = false;
    }, SLEEP_FADE_MS);
  }, SLEEP_FADE_MS + SLEEP_HOLD_MS);
}

function advanceToNextDay() {
  state.day += 1;
  renderDayHeader();

  // 월요일이 되면 지난주에 미리 등록해 둔 학원 일정이 이번 주 일정으로 확정된다
  if (weekdayOf(state.day) === 1) {
    state.registrations.active = JSON.parse(JSON.stringify(state.registrations.pending));
    logLine("📋 새 주가 시작됐다 — 미리 등록한 학원 일정이 이번 주에 적용된다");
  }
  renderAcademies(state.academies, state.categoryMap);

  pruneWeekPlan();
  renderTimetable();
  renderStats(state.character);
  saveGame();

  state.dayRunning = false;
  const startBtn = document.getElementById("start-day-btn");
  startBtn.disabled = false;
  renderShop();
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
  const applied = applyEffect(category.growth);
  state.character.condition.staminaNow = Math.max(0, state.character.condition.staminaNow - category.staminaCost);
  state.character.condition.hunger = Math.max(0, state.character.condition.hunger - 15);
  addStress(ACADEMY_STRESS);
  renderStats(state.character);

  logLine(`${academy.name} 등록 수업 완료 — ${appliedText(applied)}`);
  diary(`${josa(academy.name, "에서/에서")} 열심히 수업을 들었다.`);
}

// 운영시간 안이지만 사전 등록하지 않은 시간에 간 경우 — 자율학습
function applyAutonomousStudy(academy) {
  const applied = applyEffect(AUTONOMOUS_STUDY_EFFECT);
  state.character.condition.hunger = Math.max(0, state.character.condition.hunger - 10);
  addStress(AUTONOMOUS_STUDY_STRESS);
  renderStats(state.character);
  logLine(`${academy.name} — 등록된 수업 시간이 아니라 자율학습을 했다 (${appliedText(applied)})`);
  diary(`${josa(academy.name, "에/에")} 갔는데 내 수업 시간이 아니라서 혼자 자습을 했다.`);
}

function applyActivityEffects(activity) {
  const applied = applyEffect(activity.effect);
  renderStats(state.character);
  logLine(`${activity.name} 완료 — ${appliedText(applied)}`);
  diary(
    applied.wallet > 0
      ? `${josa(activity.name, "을/를")} 해서 용돈 ${applied.wallet}원을 벌었다!`
      : `${josa(activity.name, "을/를")} 했다.`
  );
}

function triggerIllness() {
  state.character.condition.stress = Math.max(0, state.character.condition.stress - STRESS_ILLNESS_RELIEF);
  renderStats(state.character);
  logLine("스트레스가 너무 쌓여 몸살이 났다 — 나머지 일정을 취소하고 집으로 돌아갔다");
  diary("너무 무리했는지 몸살이 나서 남은 일정을 못 하고 집에 왔다.");
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
    diary("학교에 너무 일찍 도착해서 교문 앞에서 기다렸다.");
    clock = block.startMin;
  }

  const learned = [];
  let ateLunch = false;
  for (const seg of segments) {
    const subject = seg.type === "period" ? state.subjectMap[timetable[seg.period - 1]] : null;
    const segLabel = subject ? `${seg.label} ${subject.icon} ${subject.label}` : seg.label;

    if (seg.endMin <= clock) {
      if (seg.type === "period") logLine(`${segLabel} — 지각해서 놓쳤다`);
      continue;
    }

    let topic = null;
    if (seg.type === "period" && subject) {
      if (subject.id === "creative_activity") {
        topic = subject.topics[state.creativeCount % subject.topics.length];
        state.creativeCount += 1;
      } else {
        topic = pickRandom(subject.topics);
      }
    }
    const scene =
      seg.type === "period"
        ? sceneForSubject(subject, topic)
        : seg.type === "lunch"
        ? { id: "cafeteria" }
        : seg.type === "reading"
        ? { id: "reading" }
        : { id: "play" };
    await waitUntil(Math.max(seg.startMin, clock), seg.endMin, topic ? `${segLabel} — ${topic}` : segLabel, SEGMENT_PHASE_MS, scene);
    clock = seg.endMin;

    if (seg.type === "period") {
      if (!subject) {
        logLine(`${seg.label} — 자습`);
        continue;
      }
      const applied = applyEffect(subject.growth);
      renderStats(state.character);
      logLine(`${segLabel} — ${topic} (${appliedText(applied)})`);
      learned.push(`${subject.label} 시간엔 ${topic}`);
      if (topic === "안전 교육" && !state.safetyEducated) {
        state.safetyEducated = true;
        renderStats(state.character);
        logLine("🦺 안전 교육을 잘 들었다! 이제 수상한 어른을 만나도 슬기롭게 대처할 수 있다");
        diary("안전 교육 시간에 모르는 어른이 같이 가자고 하면 크게 싫다고 말하고 사람 많은 곳으로 가야 한다고 배웠다.");
      }
    } else if (seg.type === "lunch") {
      state.character.condition.hunger = Math.max(state.character.condition.hunger, 80);
      ateLunch = true;
      renderStats(state.character);
      logLine(`${minutesToClock(seg.startMin)} 점심시간 — 급식을 먹고 허기를 회복했다 (허기 ${state.character.condition.hunger})`);
    } else if (seg.type === "reading") {
      logLine(`${minutesToClock(seg.startMin)} 자율독서시간 — 조용히 책을 읽었다`);
    }
  }

  state.character.condition.staminaNow = Math.max(0, state.character.condition.staminaNow - 10);
  addStress(SCHOOL_STRESS);
  renderStats(state.character);
  if (learned.length) diary(`학교에서 ${josa(learned.join(", "), "을/를")} 했다.`);
  if (ateLunch) diary("점심 급식을 맛있게 먹었다.");
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
    await waitUntil(clock, block.startMin, "방과후 시작 전 휴식", SEGMENT_PHASE_MS, { id: "play" });
    clock = block.startMin;
  }
  const phases = [
    { start: block.startMin, end: p1End, label: `방과후 1차시 · ${name}`, scene: sceneForCourse(block.courseId) },
    { start: p1End, end: p2Start, label: "방과후 쉬는 시간", scene: { id: "play" } },
    { start: p2Start, end: block.endMin, label: `방과후 2차시 · ${name}`, scene: sceneForCourse(block.courseId) },
  ];
  for (const phase of phases) {
    if (phase.end <= clock) continue;
    await waitUntil(Math.max(phase.start, clock), phase.end, phase.label, SEGMENT_PHASE_MS, phase.scene);
    clock = phase.end;
  }

  let applied = null;
  if (course) {
    applied = applyEffect(course.growth);
    state.character.condition.staminaNow = Math.max(0, state.character.condition.staminaNow - course.staminaCost);
  }
  state.character.condition.hunger = Math.max(0, state.character.condition.hunger - 10);
  addStress(AFTERSCHOOL_STRESS);
  renderStats(state.character);
  diary(`방과후 ${name} 수업이 재미있었다.`);
  logLine(`방과후교육 ${name} 완료${applied ? ` — ${appliedText(applied)}` : ""}`);
  return Math.max(clock, block.endMin);
}

// 늘봄학교 돌봄 (아침·오후·저녁·방학중)
async function runCareBlock(block, clock) {
  const slot = careSlotById(block.careSlot);
  const program = careProgramById(block.programId);
  const start = Math.max(clock, block.startMin);
  const label = `늘봄 ${slot.name}${program ? ` · ${program.name}` : ""}`;
  await waitUntil(start, block.endMin, label, WAIT_PHASE_MS, sceneForCare(slot, block.programId));
  const hours = Math.max(0, (block.endMin - start) / 60);

  const effect = applyEffect(slot.effect ? { ...slot.effect } : scaleGrowth(program?.growthPerHour, hours));
  const c = state.character.condition;
  c.staminaNow = Math.max(0, c.staminaNow - Math.round((program?.staminaPerHour ?? 2) * hours));
  c.hunger = Math.max(0, c.hunger - Math.round(5 * hours));
  if (slot.lunch) c.hunger = Math.max(c.hunger, 80);
  if (slot.snackHunger) c.hunger = Math.min(100, c.hunger + slot.snackHunger);
  addStress(Math.round((slot.stressPerHour ?? 2) * hours));
  renderStats(state.character);

  const extras = [slot.lunch ? "점심 제공" : null, slot.snackHunger ? `저녁 간식 (허기 +${slot.snackHunger})` : null].filter(Boolean);
  const effectNote = Object.keys(effect).length ? ` — ${appliedText(effect)}` : "";
  diary(program ? `늘봄교실 ${slot.name} 시간에 ${josa(program.name, "을/를")} 했다.` : `늘봄교실 ${slot.name}에서 시간을 보냈다.`);
  logLine(`${label} 끝${effectNote}${extras.length ? ` · ${extras.join(" · ")}` : ""}`);
  return block.endMin;
}

function lateThresholdFor(block) {
  if (block.kind === "school") return SCHOOL_LATE_MIN;
  if (block.kind === "care" && block.careSlot === "morning") return MORNING_CARE_LATE_MIN;
  return block.startMin;
}

// ── 일정이 다 끝난 뒤의 자유 시간 ──
const BEDTIME_MIN = 22 * 60;
const HOMEWORK_MIN = 60;
const GAME_SESSION_MIN = 60;
const GAME_SCOLD_MIN = 120;
const HOMEWORK_SYMBOLS = {
  korean: ["가", "나", "다", "✎"],
  math: ["1", "+", "2", "=", "3"],
  right_living: ["♡", "질서", "배려"],
  wise_living: ["🌱", "?", "!"],
  joyful_living: ["♪", "✂", "★"],
  creative_activity: ["!", "★", "✎"],
};

// 확률 반올림으로 절반만 (1이면 50% 확률로 1)
function halfGrowth(growth) {
  const out = {};
  Object.entries(growth).forEach(([k, v]) => {
    const half = v / 2;
    const n = Math.floor(half) + (Math.random() < half - Math.floor(half) ? 1 : 0);
    if (n) out[k] = n;
  });
  return out;
}

async function eveningFreeTime(clock) {
  state.gameMinutesToday = 0;
  for (;;) {
    if (clock >= BEDTIME_MIN) {
      await presentChoice("event-panel", "🌙 밤", [{ label: "😴 잠자러 가기", value: true }], {
        body: `벌써 ${minutesToClock(clock)}이야! 이제 자야겠다.`,
        speaker: "iroi",
      });
      return clock;
    }
    const pick = await presentChoice(
      "event-panel",
      "🏠 집",
      [
        { label: "🏃 밖에 나가서 논다", value: "out" },
        { label: "📚 집에서 숙제를 한다", value: "homework" },
        { label: "🎮 집에서 게임을 한다", value: "game" },
        { label: "😴 그냥 잔다", value: "sleep" },
      ],
      { body: `${minutesToClock(clock)} · 오늘 일정이 다 끝났다! 이제 뭘 할까?`, speaker: "iroi" }
    );
    if (pick === "sleep") {
      logLine(`${minutesToClock(clock)} 잠자리에 들었다`);
      return clock;
    }
    if (pick === "out") clock = await playOutside(clock);
    else if (pick === "homework") clock = await doHomework(clock);
    else if (pick === "game") clock = await playGame(clock);
  }
}

async function playOutside(clock) {
  logLine(`${minutesToClock(clock)} 밖에 놀러 나갔다 (집으로 돌아오면 끝)`);
  state.walkPurpose = "동네 구경을 해야";
  const endClock = await walkTo(state.positions.home, clock, "밖에서 노는 중 — 집으로 돌아오면 끝", { roam: true });
  logLine(`${minutesToClock(endClock)} 실컷 놀고 집에 돌아왔다`);
  diary("일정이 끝나고 밖에 나가서 동네를 돌아다니며 놀았다.");
  return endClock;
}

async function doHomework(clock) {
  const subjects = Object.values(state.subjectMap);
  const subject = pickRandom(subjects);
  const topic = pickRandom(subject.topics);
  const end = clock + HOMEWORK_MIN;
  await waitUntil(clock, end, `${subject.icon} ${subject.label} 숙제 — ${topic}`, WAIT_PHASE_MS, {
    id: "study",
    symbols: HOMEWORK_SYMBOLS[subject.id] ?? ["✎"],
  });
  const effect = { ...halfGrowth(subject.growth), diligence: 1, selfEsteem: 1 };
  const applied = applyEffect(effect);
  renderStats(state.character);
  logLine(`${minutesToClock(end)} ${subject.label} 숙제 끝 — ${topic} (${appliedText(applied)})`);
  diary(`집에서 ${subject.label} 숙제를 했다. ${josa(topic, "을/를")} 공부했다.`);
  await presentChoice("event-panel", "📚 숙제", [{ label: "▶", value: true }], {
    body: `${subject.label} 숙제 끝! 오늘은 ${josa(topic, "을/를")} 공부했어. 뿌듯하다~\n(${appliedText(applied)})`,
    speaker: "iroi",
  });
  return end;
}

async function playGame(clock) {
  const end = clock + GAME_SESSION_MIN;
  await waitUntil(clock, end, "🎮 집에서 게임하는 중", WAIT_PHASE_MS, { id: "game" });
  state.gameMinutesToday = (state.gameMinutesToday ?? 0) + GAME_SESSION_MIN;
  const applied = applyEffect({ stress: -10 });
  renderStats(state.character);
  logLine(`${minutesToClock(end)} 게임 ${GAME_SESSION_MIN}분 (${appliedText(applied)})`);
  await presentChoice("event-panel", "🎮 게임", [{ label: "▶", value: true }], {
    body: `와, 게임 진짜 재밌다! 스트레스가 확 풀렸어~\n(${appliedText(applied)})`,
    speaker: "iroi",
  });
  if (state.gameMinutesToday >= GAME_SCOLD_MIN) {
    const parent = Math.random() < 0.5 ? "mom" : "dad";
    const line =
      parent === "mom"
        ? "로이야! 게임을 벌써 몇 시간째 하는 거야? 이제 그만하고 다른 거 하자!"
        : "게임은 한 시간만 하기로 약속했지? 약속을 안 지키면 안 돼. 당장 그만!";
    const scold = applyEffect({ delinquency: 1, stress: 5 });
    renderStats(state.character);
    logLine(`${parent === "mom" ? "엄마" : "아빠"}에게 게임을 너무 오래 한다고 꾸중을 들었다 (${appliedText(scold)})`);
    diary(`게임을 너무 오래 해서 ${parent === "mom" ? "엄마" : "아빠"}한테 혼났다. 내일은 약속을 지켜야지.`);
    await presentChoice("event-panel", "😠 꾸중", [{ label: "죄송해요…", value: true }], {
      body: `${line}\n(${appliedText(scold)})`,
      tone: "danger",
      speaker: parent,
    });
  } else {
    diary("집에서 게임을 했다. 정말 재미있었다!");
  }
  return end;
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
  setSpriteFacing("down", false);
  state.eventsToday = 0;
  state.recentStranger = null;
  state.lastEventClock = -Infinity;
  state.calledToday = new Set();
  state.companyVisitedToday = false;
  state.placeEvents.forEach((pe) => {
    pe.doneToday = false;
    pe.dwell = 0;
    pe.callsToday = new Set();
  });
  state.diaryEntries = [];

  const statsAtStart = { ...state.character.stats };
  const dow = weekdayOf(state.day);
  let clock = DAY_TIMELINE_START_MIN;
  let hadSchool = false;
  let schoolWasLate = false;
  let gotSick = false;
  let cancelledEarly = false;

  if (blocks.length === 0) {
    logLine("오늘은 아무 일정도 없다 — 집에서 하루를 보냈다");
    diary("오늘은 아무 일정 없이 집에서 푹 쉬었다.");
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
        if (late && block.kind === "school") {
          applyEffect({ diligence: -LATE_DILIGENCE_PENALTY });
          renderStats(state.character);
          logLine(`지각해서 선생님께 주의를 받았다 (성실성 -${LATE_DILIGENCE_PENALTY})`);
          diary("학교에 늦어서 선생님께 주의를 받았다. 내일은 일찍 일어나야지.");
        } else if (block.kind === "school" && clock >= SCHOOL_START_MIN) {
          diary("학교에 늦지 않게 도착했다.");
        }
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
        const scene =
          block.kind === "activity"
            ? sceneForActivity(place.activity.id)
            : sceneForAcademy(place.academy.categoryId, registered);
        await waitUntil(clock, block.endMin, waitLabel, WAIT_PHASE_MS, scene);
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
        const how = await presentChoice(
          "event-panel",
          `${place.name} 끝`,
          [
            { label: "🚌 하원버스 타고 집으로", value: "shuttle" },
            { label: "🚶 하원버스 안 타고 개별 이동", value: "walk" },
          ],
          { body: "오늘 수업 끝! 로이는 하원버스 타고 갈 거니?", speaker: "teacher", speakerName: `${place.name} 선생님` }
        );
        if (how === "shuttle") {
          logLine(`${minutesToClock(clock)} 하원버스 탑승`);
          clock = await rideTransit(state.positions.home, clock, "하원버스로 집까지 이동");
          logLine(`${minutesToClock(clock)} 하원버스로 집 도착`);
          diary("수업이 끝나고 하원버스를 타고 집에 왔다.");
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
    diary("가던 길에 마음이 바뀌어서 남은 일정을 취소하고 집으로 돌아왔다.");
  }

  if (!isAtHome()) {
    logLine(`${minutesToClock(clock)} 집으로 귀가 이동`);
    clock = await travelTo(state.positions.home, clock, "집");
    logLine(`${minutesToClock(clock)} 집 도착`);
  }

  if (gotSick) {
    await presentChoice("event-panel", "🏠 집", [{ label: "😴 잠자러 가기", value: true }], {
      body: "몸이 너무 안 좋아… 오늘은 일찍 자야겠다.",
      speaker: "iroi",
    });
  } else {
    clock = await eveningFreeTime(clock);
  }

  const stressRecovery = blocks.length === 0 ? NO_SCHEDULE_STRESS_RECOVERY : DAILY_STRESS_RECOVERY;
  applyEndOfDay(stressRecovery);

  const summaryEl = document.getElementById("day-summary");
  summaryEl.hidden = false;
  const schoolPart = hadSchool ? (schoolWasLate ? "학교에 지각했다." : "학교에 정시 등교했다.") : "오늘은 학교를 가지 않았다.";
  const sickPart = gotSick ? " 너무 무리해서 몸살이 났다." : "";
  const cancelPart = cancelledEarly ? " 도중에 일정을 취소하고 집에 돌아왔다." : "";
  const delta = statDelta(statsAtStart, state.character.stats);
  state.lastDay = { day: state.day, delta };
  const deltaText = Object.keys(delta).length ? ` 오늘의 변화: ${signedEffectText(delta)}.` : " 오늘은 능력치 변화가 없었다.";
  summaryEl.textContent = `Day ${state.day} 완료 — ${schoolPart}${sickPart}${cancelPart}${deltaText} 허기 ${state.character.condition.hunger} · 기력 ${state.character.condition.staminaNow} · 스트레스 ${state.character.condition.stress}`;

  setStatus(`Day ${state.day} 끝 — 오늘의 일기를 쓰고 잠자리에 들어요`);
  if (typeof hideScene === "function") hideScene();
  showDiary({ delta, gotSick });
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

// 화면 설명 팝업 — 각 화면 제목 옆 "설명보기" 버튼
function wireHelp() {
  const modal = document.getElementById("help-modal");
  if (!modal) return;
  const close = () => {
    modal.hidden = true;
  };
  document.querySelectorAll(".help-btn[data-help]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tpl = document.getElementById(`help-${btn.dataset.help}`);
      document.getElementById("help-title").textContent = btn.dataset.title ?? "설명";
      document.getElementById("help-body").innerHTML = tpl ? tpl.innerHTML : "";
      modal.hidden = false;
      document.getElementById("help-close").focus();
    });
  });
  document.getElementById("help-close").addEventListener("click", close);
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) close();
  });
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !modal.hidden) close();
  });
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
    const blocksForToday = planFor(state.day).map((b) => ({ ...b }));
    renderTimetable();
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

// 화면 파일 버전 — index.html의 ?v= 값과 같게 올려 주면 브라우저가 새 파일을 받아 간다
const APP_VERSION = "20261111d";

function loadLocalScript(src) {
  return new Promise((resolve) => {
    const el = document.createElement("script");
    el.src = `${src}?v=${APP_VERSION}`;
    el.onload = () => resolve(true);
    el.onerror = () => {
      console.warn(`${src}를 불러오지 못했다`);
      resolve(false);
    };
    document.head.appendChild(el);
  });
}

// 브라우저가 예전 index.html을 캐시해 두었어도 대화창 얼굴·일정 애니메이션이 동작하도록 보충한다
async function ensureUiModules() {
  if (typeof portraitSpec !== "function") await loadLocalScript("portraits.js");
  if (typeof showScene !== "function") await loadLocalScript("scenes.js");
  const wrap = document.querySelector(".map-wrap");
  if (wrap && !document.getElementById("scene-panel")) {
    const panel = document.createElement("div");
    panel.id = "scene-panel";
    panel.className = "scene-panel";
    panel.hidden = true;
    panel.innerHTML =
      '<canvas id="scene-canvas" width="128" height="80" aria-label="일정 애니메이션"></canvas><p id="scene-caption" class="scene-caption"></p>';
    wrap.appendChild(panel);
  }
  if (wrap && !document.getElementById("event-panel")) {
    const panel = document.createElement("div");
    panel.id = "event-panel";
    panel.className = "map-overlay-panel pm-dialog";
    panel.hidden = true;
    wrap.appendChild(panel);
  }
}

async function main() {
  await ensureUiModules();
  renderClock();
  setInterval(renderClock, 1000 * 30);
  const cloudReadyPromise = initCloudSave(); // 데이터 로딩과 동시에 진행 — 느려도 게임 시작을 막지 않음

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
    placeEvents,
  ] = await Promise.all([
    loadJSON("data/character.json"),
    loadJSON("data/academies.json"),
    loadJSON("data/academy_categories.json"),
    loadJSON("data/items.json"),
    loadJSON("data/activities.json"),
    loadStations("place.csv"),
    loadJSON("data/holidays.json"),
    loadJSON("data/subjects.json"),
    loadJSON("data/school_schedule.json"),
    loadJSON("data/afterschool.json"),
    loadJSON("data/neulbom.json"),
    loadJSON("data/events.json"),
    loadJSON("data/hotplaces.json"),
    loadJSON("data/phone.json"),
    loadJSON("data/place_events.json"),
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
  state.holidays = holidays;

  await cloudReadyPromise;
  const fromCloud = state.cloud.ready && (await loadFromCloud());
  let restored = fromCloud;
  if (!restored) {
    restored = loadGame();
    if (restored && state.cloud.ready) saveGame(); // 이 기기에만 있던 기존 세이브를 클라우드로 올려서 다른 기기와 동기화
  }
  renderDayHeader();
  pruneWeekPlan();

  renderStats(character);
  renderAcademies(academies, state.categoryMap);
  renderActivityInfo();
  renderTimetable();
  renderShop();
  await renderMap(character, academies, activities, stations, hotplaces);
  state.placeEvents = placeEvents.map((pe) => ({
    ...pe,
    pos: state.places[pe.placeName] ?? null,
    doneToday: false,
    dwell: 0,
    callsToday: new Set(),
  }));
  wireScheduleEditor();
  wireMovementControls();
  wireNav();
  wireHelp();
  document.getElementById("sleep-btn").addEventListener("click", sleepAndAdvance);
  document.getElementById("new-game-btn").addEventListener("click", async () => {
    if (state.dayRunning) return;
    if (!window.confirm("저장된 진행 상황을 지우고 Day 1부터 새로 시작할까요?")) return;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      console.warn(err);
    }
    if (state.cloud.ready) {
      try {
        await state.cloud.docRef.delete();
      } catch (err) {
        console.warn("클라우드 세이브 삭제 실패", err);
      }
    }
    location.reload();
  });
  if (restored) {
    document.getElementById("save-note").textContent = fromCloud
      ? `☁️ 클라우드에 저장된 진행 상황(Day ${state.day})을 불러왔어요.`
      : `💾 이 기기에 저장된 진행 상황(Day ${state.day})을 불러왔어요.`;
  }
}

main();
