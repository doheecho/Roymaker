// place.csv가 유형을 한글 단어로 적어도("우리집"/"학교"/"학원"/"공원") 내부적으로는 기존 짧은 코드로 다룬다
const CSV_TYPE_ALIASES = { 우리집: "H", 학교: "school", 학원: "A", 공원: "park" };

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
  diligence: "약속과 규칙을 지키는 생활 태도. 바른 생활·학원 수업으로 오르고 지각하면 떨어진다.",
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
// 히스테리시스: 진입 반경(ARRIVAL_RADIUS_M)보다 넉넉하게 벗어나야 "다시 물어봐도 되는 상태"로 풀린다
// — 경계선 바로 위에서 서성일 때 선택창이 껐다 켜졌다 반복되는 걸 막는다
const DEPART_RADIUS_M = 30;
const MAP_ZOOM_LEVEL = 3;

class DayCancelledEarly extends Error {
  constructor(clock) {
    super("cancelled");
    this.clock = clock;
  }
}

const BUS_FARE = 450;
const SUBWAY_FARE = 450;
const WEEKLY_ALLOWANCE = 10000;
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
  clothing: [],
  wardrobe: { owned: [], equipped: { top: null, bot: null, shoe: null, etc: null } },
  categoryMap: {},
  positions: { home: null, school: null, academies: {}, activities: {} },
  stations: { subway: [], bus: [] },
  charPos: null,
  charOverlay: null,
  map: null,
  hotplaces: [],
  parks: [],
  parkFriends: [],
  travel: [],
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

// 봄 3~5월, 여름 6~8월, 가을 9~11월, 겨울 12~2월 — 여행지 계절 제한에 쓴다
const SEASON_LABELS = { spring: "봄", summer: "여름", autumn: "가을", winter: "겨울" };
function seasonForDay(dayNumber) {
  const m = gameDateForDay(dayNumber).getUTCMonth(); // 0=1월
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
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

// 엄마한테 "오늘 일찍 퇴근할 수 있어?" 라고 물어볼 수 있는 시간대(§15-2) — isParentAtWork보다 넓은 8~18시
function isWeekdayWorkHours8to18(clock) {
  if (!isWeekday(state.day)) return false;
  if (state.holidaySet.has(gameDateKey(gameDateForDay(state.day)))) return false;
  return clock >= 8 * 60 && clock < 18 * 60;
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

// 주초 일괄 등록을 놓쳤어도 당일 학원에서 바로 정식 등록할 수 있게 한다 — 이후 주에도 계속 적용되도록 active/pending 둘 다 갱신
// 학원 수업을 들을 수 있는지 — 등록 여부와 상관없이 그 학원 운영시간 안이면 수업을 듣는다
function academyClassOpen(academy, dow, startMin, endMin = startMin + ACADEMY_LESSON_MIN) {
  if (!academy) return false;
  if (isRegisteredSlot(academy.id, dow, startMin)) return true;
  if (!academy.hours) return true;
  return startMin >= clockToMinutes(academy.hours.open) && endMin <= clockToMinutes(academy.hours.close);
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
  const res = await fetch(`${path}?v=${DATA_VERSION}`);
  const text = (await res.text()).replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  return lines.slice(1).flatMap((line, i) => {
    const [rawType, name, lat, lng, rawAddress] = line.split(delimiter).map((v) => (v ?? "").trim());
    const type = CSV_TYPE_ALIASES[rawType] ?? rawType;
    const pos = { lat: Number(lat), lng: Number(lng) };
    if (!["B", "S", "H", "P", "A", "school", "park"].includes(type) || !name || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) {
      console.warn(`place.csv ${i + 2}번째 줄을 건너뜀: ${line}`);
      return [];
    }
    return [{ id: `${type}-${i + 1}`, type, name, pos, address: rawAddress || null }];
  });
}

// index.html의 ?v= 자산 버전과 맞춰서 올릴 것 — 데이터 파일(JSON/CSV)도 브라우저 캐시에 걸리지 않게 함
const DATA_VERSION = "20261114d";

async function loadJSON(path) {
  const res = await fetch(`${path}?v=${DATA_VERSION}`);
  return res.json();
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
const MARKER_KIND = { B: "버스정류장", S: "지하철역", H: "우리집", P: "장소", A: "학원", school: "학교", park: "공원" };
// 집·학교·학원은 네모 아이콘 안에 짧은 이름을 바로 쓴다 — 학원은 개수가 많아질 수 있어 구체적인 이름 대신 "학원"으로 통일(지도 라벨 겹침 방지)
const MARKER_SQUARE = { H: "우리집", school: "금북초", A: "학원" };
// 동그라미 배지에 유형 글자 그대로 쓰기 애매한 것만 별도 지정 (나머지는 type 그대로: B/S/P)
const MARKER_BADGE = { park: "공" };

function createStationOverlay(map, position, type, name, address) {
  const el = document.createElement("div");
  el.className = `bus-stop-marker station-${type}`;
  const kindName = `${MARKER_KIND[type] ?? ""} — ${name}`;
  el.title = address ? `${kindName}\n${address}` : kindName;
  el.innerHTML = MARKER_SQUARE[type]
    ? `<span class="square-badge">${MARKER_SQUARE[type]}</span>`
    : `<span class="bus-badge">${MARKER_BADGE[type] ?? type}</span><span class="bus-label">${name}</span>`;
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
      park: nearbyStationId(state.parks),
      library: nearbyStationId(state.libraries ?? []),
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
      if (!nearBus || nearBus.dist > DEPART_RADIUS_M) suppressed.bus = null;

      const nearSubway = nearestStation(state.charPos, state.stations.subway);
      if (nearSubway && nearSubway.dist <= ARRIVAL_RADIUS_M && nearSubway.id !== suppressed.subway) {
        logLine(`${minutesToClock(clock)} ${nearSubway.name} 도착`);
        boardAt("subway", nearSubway);
        return;
      }
      if (!nearSubway || nearSubway.dist > DEPART_RADIUS_M) suppressed.subway = null;

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
      if (!nearHot || nearHot.dist > DEPART_RADIUS_M) suppressed.hotplace = null;

      const nearPark = nearestStation(state.charPos, state.parks);
      if (nearPark && nearPark.dist <= ARRIVAL_RADIUS_M && nearPark.id !== suppressed.park) {
        suppressed.park = nearPark.id;
        logLine(`${minutesToClock(clock)} ${nearPark.icon} ${nearPark.name} 안으로 들어갔다`);
        if (state.friendMeetup && state.friendMeetup.parkId === nearPark.id) {
          pauseFor(() => meetFriendAtPark(nearPark, state.friendMeetup, clock));
        } else {
          pauseFor(() => visitPark(nearPark, clock));
        }
        return;
      }
      if (!nearPark || nearPark.dist > DEPART_RADIUS_M) suppressed.park = null;

      const nearLib = nearestStation(state.charPos, state.libraries ?? []);
      if (nearLib && nearLib.dist <= ARRIVAL_RADIUS_M && nearLib.id !== suppressed.library) {
        suppressed.library = nearLib.id;
        logLine(`${minutesToClock(clock)} ${nearLib.icon} ${nearLib.name} 앞에 도착했다`);
        pauseFor(() => visitLibrary(nearLib, clock));
        return;
      }
      if (!nearLib || nearLib.dist > DEPART_RADIUS_M) suppressed.library = null;

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

const INTRO_SHOW_MS = 2500;
const INTRO_FADE_MS = 500;

// 매장/장소 전용 인트로 이미지(img/characters/intro_{id}.*)가 있으면 지도 중앙에 잠깐 띄웠다가 사라진다.
// 없으면(파일을 아직 안 넣었으면) 조용히 아무 일도 안 하고 바로 다음 대화로 넘어간다.
async function maybeShowIntro(id) {
  if (!id || typeof resolveCustomPortrait !== "function") return;
  const url = await resolveCustomPortrait(`intro_${id}`);
  if (!url) return;
  const panel = document.getElementById("intro-panel");
  if (!panel) return;
  panel.innerHTML = `<img src="${url}" alt="">`;
  panel.classList.remove("fade-out");
  panel.hidden = false;
  await new Promise((r) => setTimeout(r, INTRO_SHOW_MS));
  panel.classList.add("fade-out");
  await new Promise((r) => setTimeout(r, INTRO_FADE_MS));
  panel.hidden = true;
  panel.innerHTML = "";
  panel.classList.remove("fade-out");
}

// 여행 날짜별 이미지(img/characters/travel_{id}.*, travel_{id}_2.*, travel_{id}_3.* ...) — 5초간 띄운다(없으면 생략)
const TRAVEL_IMAGE_MS = 5000;
const TRAVEL_IMAGE_MAX_VARIANTS = 8;

// 한 여행지에 올려 둔 이미지를 전부 찾는다 — travel_{id}(기본) + travel_{id}_2, _3 ... 순서로, 있는 것만 모은다
async function resolveTravelImageUrls(id) {
  if (!id || typeof resolveCustomPortrait !== "function") return [];
  const candidates = [id, ...Array.from({ length: TRAVEL_IMAGE_MAX_VARIANTS - 1 }, (_, i) => `${id}_${i + 1}`)];
  const urls = await Promise.all(candidates.map((c) => resolveCustomPortrait(`travel_${c}`)));
  return urls.filter(Boolean);
}

async function showTravelImageUrl(url) {
  if (!url) return;
  const panel = document.getElementById("intro-panel");
  if (!panel) return;
  panel.innerHTML = `<img src="${url}" alt="">`;
  panel.classList.remove("fade-out");
  panel.hidden = false;
  await new Promise((r) => setTimeout(r, TRAVEL_IMAGE_MS));
  panel.classList.add("fade-out");
  await new Promise((r) => setTimeout(r, INTRO_FADE_MS));
  panel.hidden = true;
  panel.innerHTML = "";
  panel.classList.remove("fade-out");
}

async function visitHotplace(place, clock) {
  await maybeShowIntro(place.id);
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

// 공원에 들어가면 친구를 만나는 이벤트 — 매번 놀자는 친구 중 하나를 랜덤으로 뽑는다(weight로 빈도 조절)
// ── 도서관(2026-11-13 추가) — 일정 등록 없이, 운영시간에 들어가면 1시간씩 책을 읽는다 ──
const LIBRARY_OPEN_MIN = 9 * 60;
const LIBRARY_CLOSE_MIN = 18 * 60;
const LIBRARY_HOUR_MIN = 60;
const LIBRARY_HOUR_EFFECT = { language: 1, focus: 1, perception: 1, staminaNow: -3, stress: -2 };
const LIBRARY_PRAISE_CHANCE = 0.5;
const LIBRARY_PRAISE_EFFECT = { selfEsteem: 2, diligence: 1, logic: 1 };
const LIBRARY_BOOKS = [
  "Why? 인체",
  "Why? 곤충",
  "마법천자문",
  "그리스 로마 신화",
  "수학도둑",
  "어린이 과학동아",
  "전천당",
  "샬롯의 거미줄",
  "나무 집",
  "한국사 만화",
  "세계 지도 백과",
  "꼬마 니콜라",
];

async function visitLibrary(lib, clock) {
  if (clock < LIBRARY_OPEN_MIN || clock + LIBRARY_HOUR_MIN > LIBRARY_CLOSE_MIN) {
    await presentChoice("event-panel", `${lib.icon} ${lib.name}`, [{ label: "▶ 계속 걷기", value: true }], {
      body: `도서관 문이 닫혀 있다… (운영 ${minutesToClock(LIBRARY_OPEN_MIN)}~${minutesToClock(LIBRARY_CLOSE_MIN)})`,
      speaker: "iroi",
    });
    return 0;
  }
  const enter = await presentChoice(
    "event-panel",
    `${lib.icon} ${lib.name}`,
    [
      { label: "📖 들어가서 책 읽을래요", value: true, hint: "1시간씩 읽고, 더 볼지 고를 수 있어요" },
      { label: "다음에 올게요", value: false },
    ],
    { body: "\"어서 오렴~ 읽고 싶은 책 골라서 조용히 읽고 가렴.\"", speaker: "library_teacher" }
  );
  if (!enter) return 0;
  await maybeShowIntro("library");

  let t = clock;
  let hours = 0;
  const books = [];
  for (;;) {
    const book = pickRandom(LIBRARY_BOOKS.filter((b) => !books.includes(b))) ?? pickRandom(LIBRARY_BOOKS);
    books.push(book);
    const end = t + LIBRARY_HOUR_MIN;
    await waitUntil(t, end, `📚 도서관에서 『${book}』 읽는 중`, WAIT_PHASE_MS, { id: "reading" });
    t = end;
    hours += 1;
    const applied = applyEffect(LIBRARY_HOUR_EFFECT);
    renderStats(state.character);
    logLine(`${minutesToClock(t)} 도서관에서 『${book}』${josa(book, "을/를").slice(book.length)} 읽었다 (${appliedText(applied)})`);
    const canMore = t + LIBRARY_HOUR_MIN <= LIBRARY_CLOSE_MIN;
    const more = await presentChoice(
      "event-panel",
      `${lib.icon} ${lib.name}`,
      [
        { label: "📖 한 시간 더 읽기", value: true, disabled: !canMore, hint: canMore ? "" : "곧 문 닫을 시간이에요" },
        { label: "🚪 그만 보고 나가기", value: false },
      ],
      { body: `${minutesToClock(t)} · 『${book}』 다 읽었다! 재밌다~\n(${appliedText(applied)})`, speaker: "iroi" }
    );
    if (!more) break;
  }
  state.libraryHoursToday = (state.libraryHoursToday ?? 0) + hours;
  diary(`도서관에 가서 ${hours}시간 동안 책을 읽었다. ${books.map((b) => `『${b}』`).join(", ")}${josa(books[books.length - 1], "을/를").slice(books[books.length - 1].length)} 읽었다.`);
  await presentChoice("event-panel", `${lib.icon} ${lib.name}`, [{ label: "▶ 계속 걷기", value: true }], {
    body: "\"또 오렴~ 조심히 가!\"",
    speaker: "library_teacher",
  });
  return t - clock;
}

// 도서관에 다녀온 날, 집에 있을 때 엄마나 아빠가 스스로 공부하고 왔다며 칭찬할 수도 있다(하루 1번 판정)
async function libraryPraise() {
  const parent = Math.random() < 0.5 ? "mom" : "dad";
  const applied = applyEffect(LIBRARY_PRAISE_EFFECT);
  renderStats(state.character);
  const who = parent === "mom" ? "엄마" : "아빠";
  logLine(`🌟 도서관에서 스스로 공부하고 온 걸 ${who}가 칭찬해 주셨다 (${appliedText(applied)})`);
  diary(`도서관에 다녀왔다고 했더니 ${who}가 스스로 공부하고 왔다고 칭찬해 주셨다.`);
  const line =
    parent === "mom"
      ? "로이 오늘 도서관 다녀왔다며? 누가 시키지도 않았는데 스스로 공부하고 오다니, 정말 대견하다~"
      : "우리 로이가 혼자 도서관에 가서 책을 읽고 왔다고? 아빠가 다 뿌듯하네! 최고야!";
  await presentChoice("event-panel", "🌟 칭찬", [{ label: "헤헤, 또 갈 거예요!", value: true }], {
    body: `"${line}"\n(${appliedText(applied)})`,
    tone: "event",
    speaker: parent,
  });
}

async function visitPark(park, clock) {
  const variant = pickWeighted(state.parkFriends);
  const accepted = await presentChoice(
    "event-panel",
    `${variant.icon ?? "🧒"} ${park.name}`,
    [
      {
        label: variant.acceptLabel ?? "같이 논다",
        value: true,
        disabled: variant.cost ? state.character.wallet < variant.cost : false,
        hint: signedEffectText(variant.cost ? { wallet: -variant.cost, ...variant.effect } : variant.effect ?? {}),
      },
      { label: variant.declineLabel ?? "다음에 놀자", value: false },
    ],
    { body: `"${variant.greeting}"`, tone: "event", speaker: variant.speaker ?? "friend_1" }
  );
  if (!accepted) {
    logLine(`${park.name}에서 ${variant.friendName ?? "친구"}를 만났지만 다음에 놀기로 했다`);
    await presentChoice("event-panel", `${variant.icon ?? "🧒"} ${park.name}`, [{ label: "▶ 계속 걷기", value: true }], {
      body: `"${variant.declineLine ?? "그래~ 다음에 꼭 같이 놀자!"}"`,
      speaker: variant.speaker ?? "friend_1",
    });
    return 0;
  }
  if (variant.acceptLine) {
    await presentChoice("event-panel", `${variant.icon ?? "🧒"} ${park.name}`, [{ label: "▶", value: true }], {
      body: `"${variant.acceptLine}"`,
      speaker: variant.speaker ?? "friend_1",
    });
  }
  const end = clock + (variant.minutes ?? 20);
  await waitUntil(clock, end, `${park.name}에서 ${variant.friendName ?? "친구"}랑 노는 중`, WAIT_PHASE_MS, { id: "play" });
  if (variant.cost) state.character.wallet = Math.max(0, state.character.wallet - variant.cost);
  const applied = applyEffect(variant.effect ?? {});
  renderStats(state.character);
  logLine(`${park.name}에서 ${variant.friendName ?? "친구"}랑 놀았다${variant.cost ? ` (용돈 -${variant.cost}원)` : ""} — ${appliedText(applied)}`);
  diary(`${park.name}에서 친구를 만나서 같이 놀았다. ${variant.reaction ?? ""}`);
  await presentChoice("event-panel", `${variant.icon ?? "🧒"} ${park.name}`, [{ label: "▶ 계속 걷기", value: true }], {
    body: `"${variant.reaction ?? "진짜 재밌었다!"}"\n(${appliedText(applied)})`,
    speaker: "iroi",
  });
  return variant.minutes ?? 20;
}

// ── 친구에게 전화해서 공원에서 만나기로 약속(2026-11 추가) ──
const FRIEND_INVITE_RADIUS_M = 300;
const FRIEND_INVITE_ACCEPT_CHANCE = 0.6;
const FRIEND_MEETUP_MINUTES = 60;
const FRIEND_MEETUP_EFFECT = { social: 2, agility: 1, staminaNow: -12, stress: -15 };

async function inviteFriendCall(contact, clock) {
  const nearPark = nearestStation(state.charPos, state.parks);
  if (!nearPark || nearPark.dist > FRIEND_INVITE_RADIUS_M) {
    await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "끊기", value: true }], {
      body: "\"어? 지금 근처에 만날 만한 공원이 없나 봐~ 다음에 놀자!\"",
      tone: "phone",
      speaker: contact.portrait ?? contact.id,
      speakerName: contact.name,
    });
    logLine(`📱 ${contact.name}에게 전화했지만 근처에 만날 공원이 없어서 다음에 놀기로 했다`);
    return 0;
  }
  const accepted = Math.random() < FRIEND_INVITE_ACCEPT_CHANCE;
  if (!accepted) {
    const busy = recentInsaGain() >= INSA_GAIN_FOR_BUSY_EXCUSE;
    const line = busy ? "아쉬운데 엄마가 시킨 게 있어서 지금은 못 가ㅠ 담에 보자!" : "음… 다음에 놀자.";
    await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "끊기", value: true }], {
      body: `"${line}"`,
      tone: "phone",
      speaker: contact.portrait ?? contact.id,
      speakerName: contact.name,
    });
    logLine(`📱 ${contact.name}에게 ${nearPark.name}에서 놀자고 전화했지만 거절당했다`);
    diary(`${contact.name}에게 같이 놀자고 전화했는데 다음에 놀자고 했다.`);
    return 0;
  }
  await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "끊기", value: true }], {
    body: `"좋아! 지금 ${nearPark.name}으로 갈게~"`,
    tone: "phone",
    speaker: contact.portrait ?? contact.id,
    speakerName: contact.name,
  });
  logLine(`📱 ${contact.name}에게 전화해서 ${nearPark.name}에서 만나기로 했다`);
  diary(`${contact.name}에게 전화해서 ${nearPark.name}에서 만나기로 약속했다.`);
  state.friendMeetup = { parkId: nearPark.id, contactId: contact.id, contactName: contact.name };
  return 0;
}

async function meetFriendAtPark(park, meetup, clock) {
  state.friendMeetup = null;
  const speaker = meetup.contactId;
  await presentChoice("event-panel", `🧒 ${park.name}`, [{ label: "▶", value: true }], {
    body: `"${meetup.contactName}아! 여기야 여기~"`,
    speaker: "iroi",
  });
  const end = clock + FRIEND_MEETUP_MINUTES;
  await waitUntil(clock, end, `${park.name}에서 ${meetup.contactName}이랑 노는 중`, WAIT_PHASE_MS, { id: "play" });
  const applied = applyEffect(FRIEND_MEETUP_EFFECT);
  renderStats(state.character);
  logLine(`${park.name}에서 ${meetup.contactName}이랑 ${FRIEND_MEETUP_MINUTES}분 동안 놀았다 — ${appliedText(applied)}`);
  diary(`${meetup.contactName}을(를) ${park.name}에서 만나서 신나게 놀았다.`);
  await presentChoice("event-panel", `🧒 ${park.name}`, [{ label: "▶ 계속 걷기", value: true }], {
    body: `"진짜 재밌었다! 다음에 또 놀자~"\n(${appliedText(applied)})`,
    tone: "event",
    speaker,
  });
  return FRIEND_MEETUP_MINUTES;
}

// ── 주말에 집에서 엄마·아빠한테 전화 — 같은 집에 있는데 전화하는 개그(2026-11 추가) ──
async function weekendHomeGagCall(contact) {
  const parent = contact.portrait ?? contact.id;
  const parentName = contact.name;
  const lines = [
    { speaker: parent, name: parentName, text: "응 로이 어디야?", reply: "▶" },
    { speaker: "iroi", name: null, text: "내 방에 있어요", reply: "▶" },
    { speaker: parent, name: parentName, text: "응? 방에서 왜 전화를 했어?", reply: "▶" },
    { speaker: "iroi", name: null, text: "그냥 심심해서 ㅋ", reply: "▶" },
    { speaker: parent, name: parentName, text: "그래..ㅋㅋ", reply: "끊기" },
  ];
  for (const line of lines) {
    await presentChoice("event-panel", `📞 ${parentName}`, [{ label: line.reply, value: true }], {
      body: `"${line.text}"`,
      tone: "phone",
      speaker: line.speaker,
      speakerName: line.name ?? undefined,
    });
  }
  const firstCall = !state.calledToday.has(contact.id);
  state.calledToday.add(contact.id);
  const applied = applyEffect(firstCall ? { stress: -3 } : {});
  renderStats(state.character);
  const effectNote = Object.keys(applied).length ? ` (${appliedText(applied)})` : "";
  logLine(`📱 집에 있는데 심심해서 ${parentName}한테 전화했다 ㅋ${effectNote}`);
  diary(`심심해서 집에 있는 ${parentName}한테 내 방에서 전화를 걸었다. ${parentName}가 어이없어하셨다 ㅋㅋ`);
  return state.phone?.callMinutes ?? 2;
}

// ── 엄마한테 전화 — 일찍 퇴근 졸라보기(2026-11 추가) ──
const MOM_EARLY_HOME_LOGIC_THRESHOLD = 20;
const MOM_DATE_CLOCK = 17 * 60 + 30;
const MOM_DATE_MINUTES = 90;
const MOM_DATE_EFFECT = { stress: -15, social: 2, staminaNow: 10, selfEsteem: 1 };

async function callMomOptions(contact, clock) {
  const choice = await presentChoice(
    "event-panel",
    "📞 엄마",
    [
      { label: "엄마 보고 싶어서 전화했어, 사랑해!", value: "love" },
      { label: "엄마! 오늘 일찍 퇴근할 수 있어?", value: "ask" },
    ],
    { body: `${minutesToClock(clock)} · 엄마한테 전화했다. 뭐라고 할까?`, tone: "phone", speaker: "iroi" }
  );
  if (choice === "love") {
    logLine("📱 엄마에게 전화해서 사랑한다고 말했다");
    diary("엄마한테 전화해서 사랑한다고 말했다. 엄마도 사랑한다고 해 주셨다.");
    await presentChoice("event-panel", "📞 엄마", [{ label: "끊기", value: true }], {
      body: "\"우리 로이, 엄마도 보고 싶었어~ 사랑해 💕\"",
      tone: "phone",
      speaker: "mom",
    });
    return state.phone?.callMinutes ?? 2;
  }
  const hasEveningPlan = planFor(state.day).some((b) => b.startMin >= 17 * 60);
  if (hasEveningPlan) {
    logLine("📱 엄마에게 일찍 퇴근할 수 있냐고 물었지만 오늘은 저녁 일정이 있어서 거절당했다");
    await presentChoice("event-panel", "📞 엄마", [{ label: "끊기", value: true }], {
      body: "\"로이야 미안, 오늘은 저녁에도 일이 있어서 평소처럼 퇴근할 것 같아ㅠ 이따 집에서 보자, 사랑해!\"",
      tone: "phone",
      speaker: "mom",
    });
    return state.phone?.callMinutes ?? 2;
  }
  const chance = Math.min(0.9, Math.max(0.1, (state.character.stats.logic ?? 0) / (MOM_EARLY_HOME_LOGIC_THRESHOLD * 2)));
  const success = Math.random() < chance;
  if (success) {
    state.momEarlyHomeToday = true;
    logLine("📱 엄마에게 일찍 퇴근할 수 있냐고 물었더니 승낙했다");
    diary("엄마한테 일찍 퇴근해 달라고 졸랐더니 들어주셨다! 오늘은 엄마랑 같이 뭔가 할 수 있을 것 같다.");
    await presentChoice("event-panel", "📞 엄마", [{ label: "야호!", value: true }], {
      body: "\"그래? 음… 알았어, 엄마가 오늘은 특별히 서둘러서 일찍 퇴근할게! 이따 집에서 보자~\"",
      tone: "event",
      speaker: "mom",
    });
  } else {
    logLine("📱 엄마에게 일찍 퇴근할 수 있냐고 물었지만 거절당했다");
    await presentChoice("event-panel", "📞 엄마", [{ label: "끊기", value: true }], {
      body: "\"로이야 미안해, 엄마 아직 회사에서 할 일이 남았어. 이따 퇴근하고 꼭 같이 놀자! 사랑해 💕\"",
      tone: "phone",
      speaker: "mom",
    });
  }
  return state.phone?.callMinutes ?? 2;
}

async function momDateEvent(clock) {
  await maybeShowIntro("datewithmom");
  await presentChoice("event-panel", "🚗 엄마와의 외출", [{ label: "좋아요!", value: true }], {
    body: "\"로이야! 엄마 오늘 일찍 왔어~ 우리 같이 나가서 맛있는 거 먹고 올까?\"",
    tone: "event",
    speaker: "mom",
  });
  const end = clock + MOM_DATE_MINUTES;
  await waitUntil(clock, end, "엄마와 외출 중", WAIT_PHASE_MS, { id: "play" });
  const applied = applyEffect(MOM_DATE_EFFECT);
  renderStats(state.character);
  logLine(`🚗 엄마가 일찍 퇴근해서 함께 외출했다 (${appliedText(applied)})`);
  diary("엄마가 일찍 퇴근해서 같이 나가서 맛있는 걸 먹고 즐거운 시간을 보냈다.");
  await presentChoice("event-panel", "🚗 엄마와의 외출", [{ label: "▶", value: true }], {
    body: `"오늘 엄마랑 같이 있어서 너무 좋았어!"\n(${appliedText(applied)})`,
    speaker: "iroi",
  });
  return end;
}

// ── 나비정원 삼촌한테 전화 — 집에 놀러오라고 조르기(2026-11 추가) ──
const UNCLE_PARTY_CLOCK = 19 * 60;
const UNCLE_PARTY_MINUTES = 120;
const UNCLE_PARTY_EFFECT = { stress: -10, staminaNow: 10, social: 2, insa: 2 };

async function callButterflyUncle(contact, clock) {
  if (!(isWeekday(state.day) && clock < 18 * 60)) {
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
  await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "▶", value: true }], {
    body: "\"삼촌! 우리집에 와!\"",
    speaker: "iroi",
  });
  await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "▶", value: true }], {
    body: "\"삼촌도 너무 가고 싶은데… 지금 회사라서 못 가ㅠ\"",
    tone: "phone",
    speaker: contact.portrait ?? contact.id,
    speakerName: contact.name,
  });
  await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "▶", value: true }], {
    body: "\"그럼 퇴근하고 우리집에 와! 나 로블록스 레벨 175야!\"",
    speaker: "iroi",
  });
  const isFriday = weekdayOf(state.day) === 5;
  if (isFriday) {
    state.unclePartyPending = true;
    logLine(`📱 나비정원 삼촌에게 전화해서 집에 놀러오라고 했다 — 오늘(금) 저녁에 오기로 했다`);
    diary("나비정원 삼촌한테 전화해서 집에 놀러오라고 졸랐다. 삼촌이 오늘 저녁에 오기로 했다!");
    await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "야호!", value: true }], {
      body: "\"오, 레벨 175?! 삼촌이 아빠랑 바로 얘기해 볼게… 그래, 좋아! 오늘 19시까지 집으로 갈게~\"",
      tone: "event",
      speaker: contact.portrait ?? contact.id,
      speakerName: contact.name,
    });
  } else {
    const applied = applyEffect({ stress: 2 });
    renderStats(state.character);
    logLine(`📱 나비정원 삼촌에게 전화해서 집에 놀러오라고 했지만 오늘은 못 온다고 했다 (${appliedText(applied)})`);
    diary("나비정원 삼촌한테 놀러오라고 전화했는데, 오늘은 바쁘다고 못 온다고 하셔서 시무룩해졌다.");
    await presentChoice("event-panel", `📞 ${contact.name}`, [{ label: "칫, 알겠어요…", value: true }], {
      body: `"삼촌이 아빠랑 얘기해 봤는데… 오늘은 회사 일이 너무 많아서 못 갈 것 같아. 미안해, 다음에 꼭 갈게!"\n(${appliedText(applied)})`,
      tone: "danger",
      speaker: contact.portrait ?? contact.id,
      speakerName: contact.name,
    });
  }
  return state.phone?.callMinutes ?? 2;
}

async function unclePartyEvent(clock) {
  await maybeShowIntro("uncleparty");
  const end = clock + UNCLE_PARTY_MINUTES;
  await waitUntil(clock, end, "엄마·아빠·나비정원 삼촌과 저녁 파티 중", WAIT_PHASE_MS, { id: "play" });
  state.dinnerDone = true;
  const partyTotal = { ...MEAL_EFFECT };
  Object.entries(UNCLE_PARTY_EFFECT).forEach(([k, v]) => {
    partyTotal[k] = (partyTotal[k] ?? 0) + v;
  });
  const applied = applyEffect(partyTotal);
  renderStats(state.character);
  logLine(`🎉 나비정원 삼촌이 집에 놀러와서 엄마·아빠와 함께 즐거운 저녁 파티를 했다 (${appliedText(applied)})`);
  diary("나비정원 삼촌이 집에 놀러와서 엄마, 아빠랑 다 같이 맛있는 저녁을 먹으며 신나게 놀았다.");
  await presentChoice("event-panel", "🎉 가족 파티", [{ label: "▶", value: true }], {
    body: `"오늘 진짜 최고의 저녁이었어!"\n(${appliedText(applied)})`,
    tone: "event",
    speaker: "iroi",
  });
  return end;
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

  if ((contact.id === "mom" || contact.id === "dad") && !isWeekday(state.day) && isAtHome()) {
    return weekendHomeGagCall(contact);
  }

  const placeCall = state.placeEvents.find(
    (pe) =>
      pe.pos &&
      pe.calls?.[contact.id] &&
      !pe.callsToday?.has(contact.id) &&
      distanceMeters(state.charPos, pe.pos) <= pe.callRadiusM
  );
  if (placeCall) return placeSpecialCall(placeCall, contact, clock);

  if (contact.id === "friend_1" || contact.id === "friend_2") return inviteFriendCall(contact, clock);

  if (contact.id === "mom" && isWeekdayWorkHours8to18(clock)) return callMomOptions(contact, clock);

  if (contact.id === "butterfly_uncle") return callButterflyUncle(contact, clock);

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

// 대화창 초상화 — 직접 넣은 사진이 있으면 사진이 다 받아진 뒤에만 보여준다.
// (예전엔 기본 그림을 먼저 그렸다가 사진으로 바꿔서 0.5초쯤 기본 그림이 비쳤다)
const PORTRAIT_FALLBACK_MS = 2000;
function fillPortraitFrame(frame, speaker, alt) {
  const showImage = (url) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = alt;
    frame.replaceChildren(img);
  };
  const showDrawn = () => {
    const el = portraitElement(speaker);
    if (el) frame.replaceChildren(el);
  };
  if (typeof resolveCustomPortrait !== "function") return showDrawn();
  const known = typeof cachedCustomPortrait === "function" ? cachedCustomPortrait(speaker) : undefined;
  if (known === null) return showDrawn();
  const ready = (url) => (typeof preloadPortraitImage === "function" ? preloadPortraitImage(url) : Promise.resolve(true));

  let settled = false;
  // 인터넷이 아주 느릴 때만 기본 그림을 먼저 보여준다
  const fallbackTimer = setTimeout(() => {
    if (!settled && frame.isConnected && !frame.firstChild) showDrawn();
  }, PORTRAIT_FALLBACK_MS);
  (known !== undefined ? Promise.resolve(known) : resolveCustomPortrait(speaker)).then(async (url) => {
    if (!url) {
      settled = true;
      clearTimeout(fallbackTimer);
      if (frame.isConnected && !frame.firstChild) showDrawn();
      return;
    }
    const ok = await ready(url);
    settled = true;
    clearTimeout(fallbackTimer);
    if (!frame.isConnected) return;
    if (ok) showImage(url);
    else if (!frame.firstChild) showDrawn();
  });
}

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
      panel.appendChild(frame);
      fillPortraitFrame(frame, speaker, speakerName ?? spec.name);
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
  const csvSchool = csvRows.find((r) => r.type === "school");

  const map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(HOME_FALLBACK.lat, HOME_FALLBACK.lng),
    level: MAP_ZOOM_LEVEL,
  });
  state.map = map;

  const homePos = csvHome ? csvHome.pos : await resolveHomePosition(character.home);
  state.positions.home = homePos;
  map.setCenter(new kakao.maps.LatLng(homePos.lat, homePos.lng));
  createStationOverlay(map, homePos, "H", csvHome?.name ?? "우리집", csvHome?.address);

  const schoolFallback = offsetLatLng(homePos.lat, homePos.lng, HOME_SCHOOL_WALK_MIN * CHILD_WALK_M_PER_MIN, 45);
  state.positions.school = csvSchool ? csvSchool.pos : await resolvePlace(character.school.address, null, schoolFallback);
  createStationOverlay(map, state.positions.school, "school", csvSchool?.name ?? character.school.name, csvSchool?.address);

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
    // CSV의 "학원" 행과 같은 좌표면 아래 블록 전체 렌더링에서 이미 핀을 그리므로 중복 생성하지 않는다
    if (!fromCsv) createStationOverlay(map, pos, "A", academy.name, academy.address);
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

  // P(장소)·학원·공원도 동그라미/네모 아이콘 + 레이블 — 핫플레이스와 이름이 겹치는 P는
  // 아래 핫플레이스 루프가 전용 오버레이를 그리므로 여기서는 제외(중복 방지)
  const hotplaceNames = new Set(hotplaces.map((h) => h.name));
  csvRows
    .filter((r) => (r.type === "P" && !hotplaceNames.has(r.name)) || r.type === "A" || r.type === "park")
    .forEach((r) => createStationOverlay(map, r.pos, r.type, r.name, r.address));

  // 공원에 들어가면 친구를 만나는 이벤트가 발동한다(walkTo 참고)
  state.parks = csvRows.filter((r) => r.type === "park").map((r) => ({ id: r.id, name: r.name, pos: r.pos, icon: "🌳" }));
  // 도서관: place.csv에서 이름에 "도서관"이 들어간 장소(지금은 성동구립금호도서관)
  state.libraries = csvRows.filter((r) => r.name.includes("도서관")).map((r) => ({ id: r.id, name: r.name, pos: r.pos, icon: "📚" }));

  for (const place of hotplaces) {
    const fromCsv = csvPlace(place.name);
    const fallbackPos = place.fallback
      ? offsetLatLng(homePos.lat, homePos.lng, place.fallback.distanceM, place.fallback.bearing)
      : homePos;
    let pos = fromCsv ?? fallbackPos;
    let realName = null;
    if (!fromCsv && place.address) {
      pos = await resolvePlace(place.address, null, fallbackPos);
    } else if (!fromCsv && place.placeQuery) {
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
    <img class="status-avatar" src="${PORTRAIT_SPECS?.iroi?.image ?? "img/character-face.png"}" alt="${character.name}">
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
    logicHistory: state.logicHistory ?? [],
    diligenceHistory: state.diligenceHistory ?? [],
    insaHistory: state.insaHistory ?? [],
    wardrobe: state.wardrobe,
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
  state.logicHistory = data.logicHistory ?? [];
  state.diligenceHistory = data.diligenceHistory ?? [];
  state.insaHistory = data.insaHistory ?? [];
  state.wardrobe = data.wardrobe ?? { owned: [], equipped: { top: null, bot: null, shoe: null, etc: null } };
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

// ── 저장 슬롯 (최대 20개, 이 브라우저에 저장) ──
const SLOT_KEY = "roymaker-slots-v1";
const SLOT_COUNT = 20;

function readSlots() {
  try {
    const arr = JSON.parse(localStorage.getItem(SLOT_KEY) ?? "[]");
    return Array.from({ length: SLOT_COUNT }, (_, i) => arr[i] ?? null);
  } catch (err) {
    console.warn("저장 슬롯 읽기 실패", err);
    return Array(SLOT_COUNT).fill(null);
  }
}

function writeSlots(slots) {
  try {
    localStorage.setItem(SLOT_KEY, JSON.stringify(slots));
    return true;
  } catch (err) {
    console.warn("저장 슬롯 쓰기 실패", err);
    return false;
  }
}

function slotSummary(slot) {
  const d = gameDateForDay(slot.data.day);
  const saved = new Date(slot.savedAt);
  const savedText = `${saved.getMonth() + 1}/${saved.getDate()} ${pad2(saved.getHours())}:${pad2(saved.getMinutes())}`;
  return `Day ${slot.data.day} · ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${WEEKDAY_LABELS[d.getUTCDay()]}요일 · 💰${slot.data.wallet}원 (저장 ${savedText})`;
}

function openSlotModal(mode) {
  const modal = document.getElementById("slot-modal");
  const list = document.getElementById("slot-list");
  const note = document.getElementById("slot-note");
  document.getElementById("slot-title").textContent = mode === "save" ? "💾 저장하기" : "📂 불러오기";
  note.textContent =
    mode === "save"
      ? state.dayRunning
        ? "일과가 진행 중일 때는 저장할 수 없어요. 하루를 마치고 저장해 주세요."
        : "저장할 칸을 고르세요. 이미 저장된 칸은 덮어씁니다."
      : state.dayRunning
      ? "일과가 진행 중일 때는 불러올 수 없어요."
      : "불러올 칸을 고르세요. 지금 진행 상황은 사라집니다(자동 저장분 제외).";
  list.innerHTML = "";
  readSlots().forEach((slot, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn";
    btn.innerHTML = `<strong>${i + 1}</strong><span>${slot ? slotSummary(slot) : "— 빈 칸 —"}</span>`;
    btn.disabled = state.dayRunning || (mode === "load" && !slot);
    btn.addEventListener("click", () => {
      if (mode === "save") saveToSlot(i);
      else loadFromSlot(i);
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
  modal.hidden = false;
}

function closeSlotModal() {
  document.getElementById("slot-modal").hidden = true;
}

function saveToSlot(i) {
  if (state.dayRunning) return;
  const slots = readSlots();
  if (slots[i] && !window.confirm(`${i + 1}번 칸에 덮어쓸까요?\n(${slotSummary(slots[i])})`)) return;
  slots[i] = { savedAt: Date.now(), data: JSON.parse(JSON.stringify(buildSaveData())) };
  if (writeSlots(slots)) {
    openSlotModal("save");
    document.getElementById("slot-note").textContent = `✅ ${i + 1}번 칸에 저장했어요.`;
  }
}

function loadFromSlot(i) {
  if (state.dayRunning) return;
  const slot = readSlots()[i];
  if (!slot) return;
  if (!window.confirm(`${i + 1}번 칸을 불러올까요?\n(${slotSummary(slot)})`)) return;
  applySaveData(JSON.parse(JSON.stringify(slot.data)));
  renderDayHeader();
  pruneWeekPlan();
  renderAcademies(state.academies, state.categoryMap);
  renderTimetable();
  renderStats(state.character);
  renderShop();
  saveGame();
  closeSlotModal();
  showView("home");
}

function wireSlots() {
  document.getElementById("save-btn").addEventListener("click", () => openSlotModal("save"));
  document.getElementById("load-btn").addEventListener("click", () => openSlotModal("load"));
  document.getElementById("slot-close").addEventListener("click", closeSlotModal);
  const modal = document.getElementById("slot-modal");
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) closeSlotModal();
  });
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !modal.hidden) closeSlotModal();
  });
}

// 여행 길이별 안내 문구
function travelNoteFor(days) {
  const span = days > 7 ? `다음주 일요일까지 ${days}일간` : `이번 주 ${days}일간`;
  return `여행을 가면 ${span}의 학교·학원·활동을 모두 쉬고 부모님과 함께 떠난다.`;
}

function openTravelModal() {
  const modal = document.getElementById("travel-modal");
  const list = document.getElementById("travel-list");
  const note = document.getElementById("travel-note");
  if (note) note.hidden = true; // 목록에서는 여행지 묶음마다 안내를 따로 보여준다
  list.innerHTML = "";
  const season = seasonForDay(state.day);
  ["near", "far"].forEach((category) => {
    const heading = document.createElement("h4");
    heading.className = "travel-group-heading";
    heading.textContent = category === "near" ? "가까운 여행지 (7일 · 월~일)" : "먼 여행지 (14일 · 월~다음 주 일요일)";
    list.appendChild(heading);
    const groupDays = (state.travel ?? []).find((d) => d.category === category)?.durationDays ?? (category === "near" ? 7 : 14);
    const groupNote = document.createElement("p");
    groupNote.className = "travel-group-note";
    groupNote.textContent = travelNoteFor(groupDays);
    list.appendChild(groupNote);
    const row = document.createElement("div");
    row.className = "travel-row";
    (state.travel ?? [])
      .filter((d) => d.category === category)
      .forEach((dest) => {
        const blocked = dest.blockedSeasons?.includes(season);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "travel-dest-btn";
        btn.disabled = blocked;
        btn.innerHTML = `<span class="travel-dest-icon">${dest.icon}</span><span>${dest.name}</span>`;
        btn.title = blocked ? `지금(${SEASON_LABELS[season]})은 갈 수 없는 계절이에요` : `${dest.durationDays}일간 여행`;
        btn.addEventListener("click", () => showTravelConfirm(dest));
        row.appendChild(btn);
      });
    list.appendChild(row);
  });
  modal.hidden = false;
}

function closeTravelModal() {
  document.getElementById("travel-modal").hidden = true;
}

// 여행지를 누르면 브라우저 확인창 대신 여행 창 안에서 예/아니오를 묻는다
function showTravelConfirm(dest) {
  const list = document.getElementById("travel-list");
  list.innerHTML = "";
  const box = document.createElement("div");
  box.className = "travel-confirm";
  const icon = document.createElement("div");
  icon.className = "travel-confirm-icon";
  icon.textContent = dest.icon;
  const q = document.createElement("p");
  q.className = "travel-confirm-text";
  q.textContent = `${josa(dest.name, "으로/로")} ${dest.durationDays}일간 여행을 떠날까요?`;
  const sub = document.createElement("p");
  sub.className = "travel-confirm-sub";
  sub.textContent = travelNoteFor(dest.durationDays);
  const row = document.createElement("div");
  row.className = "travel-confirm-row";
  const yes = document.createElement("button");
  yes.type = "button";
  yes.className = "travel-confirm-yes";
  yes.textContent = "예, 떠날래요!";
  yes.addEventListener("click", () => {
    closeTravelModal();
    startTravel(dest);
  });
  const no = document.createElement("button");
  no.type = "button";
  no.className = "travel-confirm-no";
  no.textContent = "아니오";
  no.addEventListener("click", () => openTravelModal());
  row.append(yes, no);
  box.append(icon, q, sub, row);
  list.appendChild(box);
  yes.focus();
}

function startTravel(destination) {
  if (state.dayRunning) return;
  state.dayRunning = true;
  document.getElementById("start-day-btn").disabled = true;
  document.getElementById("rest-day-btn")?.setAttribute("disabled", "");
  document.getElementById("travel-btn").disabled = true;
  syncRoomTravelButton();
  renderShop();
  showView("map");
  runTravel(destination);
}

function wireTravel() {
  const btn = document.getElementById("travel-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (state.dayRunning) return;
    openTravelModal();
  });
  document.getElementById("travel-close").addEventListener("click", closeTravelModal);
  const modal = document.getElementById("travel-modal");
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) closeTravelModal();
  });
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !modal.hidden) closeTravelModal();
  });
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
  if (typeof renderClothingShop === "function") renderClothingShop(el);
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
  if (spec.kind === "school") return { ...schoolTimesFor(day), invalid: !!vacation || !weekday };
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

function createChip(icon, label, spec, extraClass, tooltip = "") {
  const chip = document.createElement("div");
  chip.className = `chip${extraClass ? ` ${extraClass}` : ""}`;
  chip.innerHTML = `<span class="chip-icon">${icon}</span><span>${label}</span>`;
  if (tooltip) chip.title = tooltip;
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

  if (days.some((d) => isWeekday(d) && !vacationOf(d))) {
    school.row.appendChild(
      createChip(SCHOOL_ICON, "정규수업", { kind: "school" }, "chip-school", "08:30 등교 (08:50 넘으면 지각)\n월·금 12:50 하교 / 화·수·목 13:40 하교")
    );
  }

  if (schoolDays.length) {
    const course = afterschoolCourseById(state.ui.afterschoolCourse);
    school.row.appendChild(
      createChip(
        course?.icon ?? "🎒",
        "방과후 수업",
        { kind: "afterschool" },
        "chip-afterschool",
        `${course?.name ?? ""}\n마지막 수업 20분 뒤 시작 · 40분 + 10분 휴식 + 40분\n${course ? signedEffectText(course.growth) : ""}`
      )
    );
  }

  const careSlots = (state.neulbom?.slots ?? []).filter((slot) => (slot.vacationOnly ? vacationDays.length : schoolDays.length));
  careSlots.forEach((slot) => {
    const timeText = slot.start ? `${slot.start}–${slot.end}` : `~${slot.end}`;
    school.row.appendChild(
      createChip(slot.icon, slot.name, { kind: "care", careSlot: slot.id }, "chip-care", `${timeText}\n${slot.description ?? ""}`)
    );
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
    const hoursText = activity.hours ? `\n운영 ${activity.hours.open}~${activity.hours.close}` : "";
    acts.row.appendChild(
      createChip(
        activity.icon,
        activity.name,
        { kind: "activity", activityId: activity.id, durationMin: activity.durationMin },
        "chip-activity",
        `${activity.durationMin}분${hoursText}\n${signedEffectText(activity.effect)}`
      )
    );
  });

  const acads = paletteGroup(el, "🏢 학원 — 등록하지 않아도 운영시간 안이면 언제든 수업을 듣는다. 각 수업은 60분 진행한다.");
  state.academies
    .filter((a) => a.location.etaMinFromHome != null)
    .forEach((academy) => {
      const category = state.categoryMap[academy.categoryId];
      const hoursText = academy.hours ? `운영 ${academy.hours.open}~${academy.hours.close}` : "운영시간 미정";
      acads.row.appendChild(
        createChip(
          category.icon ?? "🏫",
          academy.name,
          { kind: "academy", academyId: academy.id },
          "chip-academy",
          `${category.label} · 수업 ${ACADEMY_LESSON_MIN}분\n${hoursText}\n${signedEffectText(category.growth)}`
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
  const inClass = academyClassOpen(academy, dow, block.startMin, block.endMin);
  return {
    icon: state.categoryMap[academy.categoryId]?.icon ?? "🏫",
    label: `${academy.name}${inClass ? " (수업)" : " (자율학습)"}`,
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
  const travelBtn = document.getElementById("travel-btn");
  if (travelBtn) travelBtn.hidden = weekdayOf(state.day) !== 1; // 여행은 월요일에만 떠날 수 있다
  syncRoomTravelButton();

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

// 화면 전체가 어두워지며 문구(text)가 떴다가, 어두운 동안 duringDark()를 실행하고 다시 밝아진다
function screenFade(text, duringDark) {
  return new Promise((resolve) => {
    const fade = document.getElementById("sleep-fade");
    if (!fade) {
      Promise.resolve(duringDark?.()).then(resolve);
      return;
    }
    const label = fade.querySelector("span");
    if (label) label.textContent = text;
    fade.hidden = false;
    requestAnimationFrame(() => fade.classList.add("on"));
    setTimeout(async () => {
      await duringDark?.();
      fade.classList.remove("on");
      setTimeout(() => {
        fade.hidden = true;
        resolve();
      }, SLEEP_FADE_MS);
    }, SLEEP_FADE_MS + SLEEP_HOLD_MS);
  });
}

// 하루 일정 짤 때 "오늘은 아무것도 안 한다" — 일과를 건너뛰고 바로 하루를 마친 뒤 Zzz…로 다음 날
const REST_DAY_MESSAGE_MS = 1800;
async function restWholeDay() {
  if (state.dayRunning) return;
  state.dayRunning = true;
  const buttons = ["start-day-btn", "rest-day-btn", "travel-btn"].map((id) => document.getElementById(id)).filter(Boolean);
  buttons.forEach((b) => (b.disabled = true));
  syncRoomTravelButton();
  const statsAtStart = { ...state.character.stats };
  logLine("😴 오늘은 아무것도 안 하고 집에서 뒹굴뒹굴 쉬었다");
  applyEndOfDay(NO_SCHEDULE_STRESS_RECOVERY);
  state.lastDay = { day: state.day, delta: statDelta(statsAtStart, state.character.stats) };

  const fade = document.getElementById("sleep-fade");
  const label = fade.querySelector("span");
  if (label) label.textContent = "오늘은 아무것도 안 하고 하루가 끝났다…";
  fade.hidden = false;
  requestAnimationFrame(() => fade.classList.add("on"));
  await new Promise((r) => setTimeout(r, SLEEP_FADE_MS + REST_DAY_MESSAGE_MS));
  if (label) label.textContent = "Zzz…";
  await new Promise((r) => setTimeout(r, SLEEP_HOLD_MS + 600));
  advanceToNextDay();
  showView("home");
  window.scrollTo(0, 0);
  fade.classList.remove("on");
  await new Promise((r) => setTimeout(r, SLEEP_FADE_MS));
  fade.hidden = true;
  buttons.forEach((b) => (b.disabled = false));
  syncRoomTravelButton();
}

// 잠자기: 화면이 잠시 어두워졌다가 다음 날 일정 화면으로
function sleepAndAdvance() {
  const fade = document.getElementById("sleep-fade");
  const btn = document.getElementById("sleep-btn");
  btn.disabled = true;
  const label = fade.querySelector("span");
  if (label) label.textContent = "Zzz…";
  fade.hidden = false;
  requestAnimationFrame(() => fade.classList.add("on"));
  setTimeout(() => {
    document.getElementById("diary-overlay").hidden = true;
    advanceToNextDay();
    showView("home");
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
    applyEffect({ wallet: WEEKLY_ALLOWANCE }, { modifier: false });
    renderStats(state.character);
    logLine(`💰 이번 주 용돈 ${WEEKLY_ALLOWANCE}원을 받았다 (잔액 ${state.character.wallet}원)`);
  }
  renderAcademies(state.academies, state.categoryMap);

  pruneWeekPlan();
  renderTimetable();
  renderStats(state.character);
  saveGame();

  state.dayRunning = false;
  const startBtn = document.getElementById("start-day-btn");
  startBtn.disabled = false;
  document.getElementById("rest-day-btn")?.removeAttribute("disabled");
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

  logLine(`${academy.name} 수업 완료 — ${appliedText(applied)}`);
  diary(`${josa(academy.name, "에서/에서")} 열심히 수업을 들었다.`);
}

// 운영시간 밖에 간 경우 — 자율학습
function applyAutonomousStudy(academy) {
  const applied = applyEffect(AUTONOMOUS_STUDY_EFFECT);
  state.character.condition.hunger = Math.max(0, state.character.condition.hunger - 10);
  addStress(AUTONOMOUS_STUDY_STRESS);
  renderStats(state.character);
  logLine(`${academy.name} — 수업 시간이 아니라 자율학습을 했다 (${appliedText(applied)})`);
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

// 허기 회복은 이제 아침밥/저녁밥(serveBreakfast/serveDinner/lateDinnerTalk)이 맡는다 — 여기서는 잠들기 전 기력·스트레스만 추가로 회복
function applyEndOfDay(stressRecovery) {
  if (typeof applyWardrobeDailyEffects === "function") applyWardrobeDailyEffects();
  state.character.condition.staminaNow = Math.min(100, state.character.condition.staminaNow + 10);
  state.character.condition.stress = Math.max(0, state.character.condition.stress - stressRecovery);
  renderStats(state.character);
  logLine("하루를 마쳤다");
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
// ── 선생님 인사 ──
const AFTERSCHOOL_TEACHERS = ["afterschool_1", "afterschool_2", "afterschool_3"];

// 같은 과목은 늘 같은 선생님이 맡도록 이름으로 골라 준다
function teacherFor(key) {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AFTERSCHOOL_TEACHERS[h % AFTERSCHOOL_TEACHERS.length];
}

function teacherSays(speaker, heading, body, label = "▶") {
  return presentChoice("event-panel", heading, [{ label, value: true }], { body, speaker });
}

async function runSchoolBlock(block, clock, dow, wasLate = false) {
  const timetable = state.school?.timetable?.[dow] ?? [];
  const segments = (state.school?.segments ?? []).filter((seg) => seg.endMin <= block.endMin);

  if (clock < block.startMin) {
    logLine(`${minutesToClock(clock)} 교문 앞에서 ${minutesToClock(block.startMin)}까지 기다렸다`);
    diary("학교에 너무 일찍 도착해서 교문 앞에서 기다렸다.");
    clock = block.startMin;
  }

  await maybeShowIntro("school");
  await teacherSays(
    "homeroom_teacher",
    "🏫 교실",
    wasLate
      ? "\"로이야, 오늘은 조금 늦었네? 내일은 조금만 더 일찍 오자. 자, 오늘 하루도 즐겁게 공부해 보자~\""
      : "\"로이야, 좋은 아침! 오늘 하루도 즐겁게 공부하자~\"",
    "네, 선생님!"
  );

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
  await teacherSays("homeroom_teacher", "🏫 교실", "\"오늘 하루도 공부하느라 고생 많았어~ 내일도 웃으면서 만나자!\"", "안녕히 계세요!");
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
  await teacherSays(
    teacherFor(block.courseId ?? name),
    `${course?.icon ?? "🎒"} 방과후 수업`,
    `"로이야, 안녕! 오늘의 방과후 수업은 ${josa(name, "이야/야")}~ 즐겁게 배워 보자!"`,
    "네, 좋아요!"
  );
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
  await teacherSays(
    teacherFor(block.programId ?? slot.id),
    `${slot.icon} ${slot.name}`,
    slot.id === "morning"
      ? "\"로이 일찍 왔구나, 좋은 아침! 수업 시작 전까지 책 읽으면서 기다리자~\""
      : program
      ? `"로이야, 어서 와! 오늘 ${slot.name} 시간엔 ${josa(program.name, "을/를")} 해 볼 거야~ 재미있게 해 보자!"`
      : `"로이야, 어서 와! 오늘도 ${slot.name} 시간 즐겁게 보내자~"`,
    "네!"
  );
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

// ── 계획을 어기고 일찍 집에 온 날 저녁, 엄마와의 대화 ──
const LOGIC_LOOKBACK_DAYS = 7;
const LOGIC_GAIN_FOR_EXCUSE = 2;
const DILIGENCE_LOOKBACK_DAYS = 7;
const DILIGENCE_GAIN_FOR_PARTY = 1;
const INSA_LOOKBACK_DAYS = 7;
const INSA_GAIN_FOR_BUSY_EXCUSE = 1;

// 최근 7일 사이 논리가 얼마나 올랐나
function recentLogicGain() {
  const hist = state.logicHistory ?? [];
  const oldest = hist.length ? Math.min(...hist.map((h) => h.logic)) : state.character.stats.logic ?? 0;
  return (state.character.stats.logic ?? 0) - oldest;
}

// 최근 7일 사이 성실성이 얼마나 올랐나 — 금/토 밤 파티 허락 여부 판정(§10-5)
function recentDiligenceGain() {
  const hist = state.diligenceHistory ?? [];
  const oldest = hist.length ? Math.min(...hist.map((h) => h.diligence)) : state.character.stats.diligence ?? 0;
  return (state.character.stats.diligence ?? 0) - oldest;
}

// 최근 7일 사이 인싸력이 얼마나 올랐나 — 친구에게 전화했을 때 거절 대사 톤 판정
function recentInsaGain() {
  const hist = state.insaHistory ?? [];
  const oldest = hist.length ? Math.min(...hist.map((h) => h.insa)) : state.character.stats.insa ?? 0;
  return (state.character.stats.insa ?? 0) - oldest;
}

// 차비가 없어서 일정을 못 갔다고 인정해 주는 용돈 기준 — 이 미만이면 논리 능력치 변명 대신 차비 부족 사유로 처리
const NO_FARE_WALLET_THRESHOLD = 1000;

async function eveningTalkWithMom(clock, skipped) {
  const names = [...new Set(skipped.map((b) => blockDisplay(b).label.replace(/ \((등록 수업|수업|자율학습)\)$/, "")))];
  const what = names.length ? names.join(", ") : "오늘 일정";
  const noFare = state.character.wallet < NO_FARE_WALLET_THRESHOLD;
  const good = !noFare && recentLogicGain() >= LOGIC_GAIN_FOR_EXCUSE;
  await presentChoice("event-panel", "🏠 엄마와 대화", [{ label: "▶", value: true }], {
    body: `"로이야, 오늘 ${josa(what, "을/를")} 안 가고 집에 왔다며? 무슨 일 있었어?"`,
    speaker: "mom",
  });
  await presentChoice("event-panel", "🏠 엄마와 대화", [{ label: "▶", value: true }], {
    body: noFare
      ? "\"엄마… 그게… 학원에 갈 차비가 없어서 못 갔어요… 죄송해요ㅠ\""
      : good
      ? "\"엄마, 그게… 오늘 너무 피곤하고 머리도 아파서 무리하면 내일 더 힘들 것 같았어. 그래서 오늘은 쉬고 내일 더 열심히 하려고 집에 왔어.\""
      : "\"엄마… 그냥… 가기 싫어서… 집에 왔어…\"",
    speaker: "iroi",
  });
  const effect = noFare ? { stress: -10, selfEsteem: 1, wallet: WEEKLY_ALLOWANCE } : good ? { stress: -10, staminaNow: 10 } : { stress: 10, delinquency: 2 };
  const applied = applyEffect(effect);
  renderStats(state.character);
  const reply = noFare
    ? "\"뭐? 차비가 없어서 못 갔다고?! 세상에… 엄마가 그것도 모르고 있었네, 정말 미안해ㅠ 앞으로는 용돈을 꼭 넉넉히 챙겨줄게. 오늘은 로이 잘못이 아니니까 속상해하지 마.\""
    : good
    ? "\"그랬구나… 많이 힘들었지? 엄마한테 차근차근 이유를 설명해 줘서 고마워. 몸이 안 좋을 땐 쉬는 게 맞아. 잘했어, 오늘은 푹 쉬자.\""
    : "\"로이야, 정해진 약속을 이유 없이 안 지키면 안 돼. 선생님도 기다리셨을 거야. 다음부터는 꼭 계획대로 하자, 알았지?\"";
  logLine(
    `🌇 엄마와 대화 — ${noFare ? "차비가 없어서 못 갔다고 하자 엄마가 미안해하며 용돈을 바로 줬다" : good ? "이유를 잘 설명해서 엄마가 걱정하며 잘했다고 했다" : "이유 없이 계획을 어겨서 꾸중을 들었다"} (${appliedText(applied)})`
  );
  diary(
    noFare
      ? `차비가 없어서 ${josa(what, "을/를")} 못 갔다고 하자, 엄마가 미안해하면서 용돈을 바로 챙겨 주셨다.`
      : good
      ? `${josa(what, "을/를")} 안 가고 집에 온 이유를 엄마한테 잘 설명했더니, 엄마가 걱정하면서 잘했다고 해 주셨다.`
      : `이유 없이 ${josa(what, "을/를")} 빼먹어서 엄마한테 혼났다. 다음부터는 계획을 꼭 지켜야지.`
  );
  await presentChoice("event-panel", "🏠 엄마와 대화", [{ label: noFare ? "엄마… 고마워요ㅠ" : good ? "고마워 엄마!" : "죄송해요…", value: true }], {
    body: `${reply}\n(${appliedText(applied)})`,
    tone: noFare || good ? "event" : "danger",
    speaker: "mom",
  });
  return clock;
}

// ── 일정이 다 끝난 뒤의 자유 시간 ──
const BEDTIME_MIN = 22 * 60;
const HOMEWORK_MIN = 60;
const HOMEWORK_PRAISE_MIN = 120;
const HOMEWORK_PRAISE_BONUS_CHANCE = 0.5;
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

// ── 아침밥 · 저녁밥 (2026-11 추가) ──
const DINNER_MIN = 19 * 60;
const MEAL_EFFECT = { hunger: 45, staminaNow: 20, stress: -15 };
const LATE_DINNER_DILIGENCE_PENALTY = 1;

async function serveBreakfast() {
  await presentChoice("event-panel", "🍚 아침밥", [{ label: "▶", value: true }], {
    body: "\"로이야, 일어났니? 아침밥 다 차려놨어, 얼른 와서 먹자~\"",
    speaker: "mom",
  });
  const applied = applyEffect(MEAL_EFFECT);
  renderStats(state.character);
  logLine(`🍚 엄마가 차려주신 아침밥을 먹었다 (${appliedText(applied)})`);
  diary("아침에 엄마가 차려주신 밥을 든든하게 먹고 하루를 시작했다.");
  await presentChoice("event-panel", "🍚 아침밥", [{ label: "▶", value: true }], {
    body: `"잘 먹었습니다! 오늘도 힘내야지~"\n(${appliedText(applied)})`,
    speaker: "iroi",
  });
}

// 7시까지 집에 있었으면(또는 이미 와 있으면) 자동으로 저녁밥을 먹는다 — 선택 없음
async function serveDinner() {
  await presentChoice("event-panel", "🍚 저녁밥", [{ label: "▶", value: true }], {
    body: "\"로이야, 저녁 다 됐다! 어서 와서 먹어~\"",
    speaker: "mom",
  });
  const applied = applyEffect(MEAL_EFFECT);
  renderStats(state.character);
  logLine(`🍚 엄마가 차려주신 저녁밥을 먹었다 (${appliedText(applied)})`);
  diary("저녁에 엄마가 차려주신 밥을 맛있게 먹었다.");
  await presentChoice("event-panel", "🍚 저녁밥", [{ label: "▶", value: true }], {
    body: `"잘 먹었습니다! 든든하다~"\n(${appliedText(applied)})`,
    speaker: "iroi",
  });
}

// 7시가 지나서야 집에 들어온 경우 — 밥을 먹을지 말지 고를 수 있다(먹으면 성실성 소폭 하락)
async function lateDinnerTalk() {
  const eatIt = await presentChoice(
    "event-panel",
    "🏠 집",
    [
      { label: "응 엄마, 배고파요… 밥 차려주세요", value: true },
      { label: "괜찮아요 엄마!", value: false },
    ],
    { body: "\"로이야, 밥은 먹었니? 왜 이렇게 늦게 들어왔어, 배고프겠다…\"", speaker: "mom" }
  );
  if (!eatIt) {
    await presentChoice("event-panel", "🏠 집", [{ label: "▶", value: true }], {
      body: "\"괜찮아요 엄마!\"",
      speaker: "iroi",
    });
    logLine("엄마가 밥은 먹었는지 물었지만 괜찮다고 했다");
    diary("늦게 들어왔는데 엄마가 밥은 먹었냐고 물으셨다. 괜찮다고 했다.");
    return;
  }
  await presentChoice("event-panel", "🏠 집", [{ label: "▶", value: true }], {
    body: "\"응 엄마, 배고파요… 밥 차려주세요.\"",
    speaker: "iroi",
  });
  const applied = applyEffect({ ...MEAL_EFFECT, diligence: -LATE_DINNER_DILIGENCE_PENALTY });
  renderStats(state.character);
  logLine(`🍚 너무 늦게 들어와서 엄마가 그제서야 저녁밥을 차려주셨다 (${appliedText(applied)})`);
  diary("너무 늦게 들어와서 죄송했지만, 엄마가 그래도 저녁밥을 차려주셨다.");
  await presentChoice("event-panel", "🍚 저녁밥", [{ label: "▶", value: true }], {
    body: `"고마워요 엄마ㅠ"\n(${appliedText(applied)})`,
    speaker: "iroi",
  });
}

// ── 금/토 밤 9시 파티 요청(2026-11 추가) ──
const PARTY_WEEKDAYS = [5, 6]; // 금, 토
const PARTY_MIN = 21 * 60;
const PARTY_MINUTES = 60;
const PARTY_GOOD_EFFECT = { stress: -15 };
const PARTY_BAD_EFFECT = { stress: 10, delinquency: 2 };

async function askForParty(clock) {
  state.partyDone = true;
  await presentChoice("event-panel", "🎉 파티", [{ label: "▶", value: true }], {
    body: "\"엄마, 저 오늘 파티하고 싶어요!\"",
    speaker: "iroi",
  });
  const good = recentDiligenceGain() >= DILIGENCE_GAIN_FOR_PARTY;
  const isFriday = weekdayOf(state.day) === 5;
  const end = clock + PARTY_MINUTES;
  if (good) {
    await waitUntil(clock, end, isFriday ? "엄마랑 \"나 혼자 산다\" 보는 중" : "엄마랑 예능 프로그램 보는 중", WAIT_PHASE_MS, { id: "play" });
    const applied = applyEffect(PARTY_GOOD_EFFECT);
    renderStats(state.character);
    const showLine = isFriday
      ? "\"그래, 우리 로이 요즘 열심히 했으니까! 같이 \\\"나 혼자 산다\\\" 보면서 기안84 형 일상 구경하자~\""
      : "\"그래, 우리 로이 요즘 열심히 했으니까! 재밌는 예능 프로그램 보면서 같이 파티하자~\"";
    logLine(`🎉 엄마와 함께 파티를 즐겼다 (${appliedText(applied)})`);
    diary(isFriday ? "엄마랑 \"나 혼자 산다\"를 보면서 즐거운 금요일 밤 파티를 했다." : "엄마랑 재밌는 예능 프로그램을 보면서 토요일 밤 파티를 했다.");
    await presentChoice("event-panel", "🎉 파티", [{ label: "신난다!", value: true }], {
      body: `${showLine}\n(${appliedText(applied)})`,
      tone: "event",
      speaker: "mom",
    });
  } else {
    await waitUntil(clock, end, "엄마·아빠한테 혼나는 중", WAIT_PHASE_MS, { id: "rest" });
    const applied = applyEffect(PARTY_BAD_EFFECT);
    renderStats(state.character);
    logLine(`엄마·아빠한테 이 밤에 무슨 파티냐고 혼났다 (${appliedText(applied)})`);
    diary("밤늦게 파티하고 싶다고 했다가 엄마, 아빠한테 혼났다.");
    await presentChoice("event-panel", "🎉 파티", [{ label: "죄송해요…", value: true }], {
      body: `"이 밤에 무슨 파티야? 얼른 들어가서 자!"\n"아빠도 한마디 하자면 — 요즘 좀 느슨해진 것 같은데, 정신 차려야지."\n(${appliedText(applied)})`,
      tone: "danger",
      speaker: "mom",
    });
  }
  return end;
}

async function eveningFreeTime(clock, pendingTalk = null, needsDinner = false) {
  state.gameMinutesToday = 0;
  state.homeworkMinutesToday = 0;
  state.homeworkPraiseDone = false;
  state.readingCountToday = 0;
  state.readingPraiseDone = false;
  const talkIfDue = async (force) => {
    if (pendingTalk && (force || clock >= pendingTalk.at)) {
      const talk = pendingTalk;
      pendingTalk = null;
      clock = await eveningTalkWithMom(clock, talk.skipped);
    }
  };
  const dinnerIfDue = async (force) => {
    if (needsDinner && !state.dinnerDone && (force || clock >= DINNER_MIN)) {
      state.dinnerDone = true;
      await serveDinner();
    }
  };
  const momDateIfDue = async (force) => {
    if (state.momEarlyHomeToday && !state.momDateDone && (force || clock >= MOM_DATE_CLOCK)) {
      state.momDateDone = true;
      clock = await momDateEvent(clock);
    }
  };
  const unclePartyIfDue = async (force) => {
    if (state.unclePartyPending && (force || clock >= UNCLE_PARTY_CLOCK)) {
      state.unclePartyPending = false;
      clock = await unclePartyEvent(clock);
    }
  };
  const libraryPraiseIfDue = async () => {
    if ((state.libraryHoursToday ?? 0) > 0 && !state.libraryPraiseChecked && isAtHome()) {
      state.libraryPraiseChecked = true;
      if (Math.random() < LIBRARY_PRAISE_CHANCE) await libraryPraise();
    }
  };
  for (;;) {
    await libraryPraiseIfDue();
    await talkIfDue(false);
    await dinnerIfDue(false);
    await momDateIfDue(false);
    await unclePartyIfDue(false);
    if (clock >= BEDTIME_MIN) {
      await talkIfDue(true);
      await dinnerIfDue(true);
      await momDateIfDue(true);
      await unclePartyIfDue(true);
      await presentChoice("event-panel", "🌙 밤", [{ label: "😴 잠자러 가기", value: true }], {
        body: `벌써 ${minutesToClock(clock)}이야! 이제 자야겠다.`,
        speaker: "iroi",
      });
      return clock;
    }
    const canParty = PARTY_WEEKDAYS.includes(weekdayOf(state.day)) && clock >= PARTY_MIN && !state.partyDone;
    const options = [
      { label: "🏃 밖에 나가서 논다", value: "out" },
      { label: "📚 집에서 숙제를 한다", value: "homework" },
      { label: "📖 집에서 독서를 한다", value: "reading" },
      { label: "🎮 집에서 게임을 한다", value: "game" },
      { label: "📱 휴대전화를 연다", value: "phone" },
    ];
    if (canParty) options.push({ label: "🎉 엄마한테 파티하자고 말한다", value: "party" });
    options.push({ label: "😴 그냥 잔다", value: "sleep" });
    const pick = await presentChoice("event-panel", "🏠 집", options, {
      body: `${minutesToClock(clock)} · 특별히 해야할 일은 없는 것 같네? 이제 뭘 할까?`,
      speaker: "iroi",
    });
    if (pick === "sleep") {
      // 일찍 자려고 해도, 빼먹은 일정 얘기나 저녁밥은 자기 전에 꼭 하신다
      await talkIfDue(true);
      await dinnerIfDue(true);
      await momDateIfDue(true);
      await unclePartyIfDue(true);
      logLine(`${minutesToClock(clock)} 잠자리에 들었다`);
      return clock;
    }
    if (pick === "out") clock = await playOutside(clock);
    else if (pick === "homework") clock = await doHomework(clock);
    else if (pick === "reading") clock = await readAtHome(clock);
    else if (pick === "game") clock = await playGame(clock);
    else if (pick === "phone") clock += await openPhone(clock);
    else if (pick === "party") clock = await askForParty(clock);
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
  state.homeworkMinutesToday = (state.homeworkMinutesToday ?? 0) + HOMEWORK_MIN;
  if (state.homeworkMinutesToday >= HOMEWORK_PRAISE_MIN && !state.homeworkPraiseDone) {
    state.homeworkPraiseDone = true;
    await praiseHomework(end);
  }
  return end;
}

// 집에서 독서 — 60분 동안 책을 읽고 언어·집중력·표현력이 조금 오르고 마음이 차분해진다
const HOME_READING_MIN = 60;
const HOME_READING_BOOKS = [
  "마법천자문",
  "흔한남매",
  "안녕 자두야",
  "Why? 공룡",
  "Why? 우주",
  "어린왕자",
  "샬롯의 거미줄",
  "찰리와 초콜릿 공장",
  "전천당",
  "이상한 과자 가게",
  "세계 명작 동화",
  "한국사 만화",
];
async function readAtHome(clock) {
  const book = pickRandom(HOME_READING_BOOKS);
  const end = clock + HOME_READING_MIN;
  await waitUntil(clock, end, `📖 집에서 『${book}』 읽는 중`, WAIT_PHASE_MS, { id: "reading" });
  const applied = applyEffect({ language: 1, focus: 1, expression: 1, stress: -4 });
  renderStats(state.character);
  logLine(`${minutesToClock(end)} 집에서 『${book}』${josa(book, "을/를").slice(book.length)} 읽었다 (${appliedText(applied)})`);
  diary(`집에서 『${book}』${josa(book, "을/를").slice(book.length)} 읽었다. 책 읽는 시간이 즐거웠다.`);
  await presentChoice("event-panel", "📖 독서", [{ label: "▶", value: true }], {
    body: `『${book}』 다 읽었다! 이야기가 머릿속에 계속 떠오른다~\n(${appliedText(applied)})`,
    speaker: "iroi",
  });
  state.readingCountToday = (state.readingCountToday ?? 0) + 1;
  if (state.readingCountToday >= READING_PRAISE_COUNT && !state.readingPraiseDone) {
    state.readingPraiseDone = true;
    await praiseReading(book);
  }
  return end;
}

// 하루에 집에서 독서를 2번 이상 하면 엄마가 칭찬한다(하루 1번)
const READING_PRAISE_COUNT = 2;
const READING_PRAISE_EFFECT = { selfEsteem: 2, language: 1, logic: 1, diligence: 1 };
async function praiseReading(book) {
  const applied = applyEffect(READING_PRAISE_EFFECT);
  renderStats(state.character);
  logLine(`🌟 집에서 책을 열심히 읽는 걸 보고 엄마가 칭찬해 주셨다 (${appliedText(applied)})`);
  diary("오늘 책을 여러 권 읽었더니 엄마가 책 읽는 로이가 최고라고 칭찬해 주셨다.");
  await presentChoice("event-panel", "🌟 칭찬", [{ label: "헤헤, 책 읽는 거 재밌어요!", value: true }], {
    body: `"어머, 우리 로이가 오늘 책을 벌써 몇 권째 읽는 거야? 『${book}』도 다 읽었네!\n이렇게 스스로 책 읽는 로이가 엄마는 너무 자랑스러워~"\n(${appliedText(applied)})`,
    tone: "event",
    speaker: "mom",
  });
}

// 시키지 않았는데 하루에 숙제를 2시간 넘게 하면 엄마가 기특해하며 칭찬한다(하루 1번)
async function praiseHomework(clock) {
  const bonus = Math.random() < HOMEWORK_PRAISE_BONUS_CHANCE ? pickRandom([1000, 2000, 3000, 5000]) : 0;
  const effect = bonus ? { selfEsteem: 2, stress: -8, diligence: 1, wallet: bonus } : { selfEsteem: 2, stress: -8, diligence: 1 };
  const applied = applyEffect(effect);
  renderStats(state.character);
  const bonusLine = bonus ? ` 기특한 마음에 친구들이랑 맛있는 거 사 먹으라고 용돈도 ${bonus}원 주셨다.` : "";
  logLine(`🌟 엄마가 시키지 않았는데 숙제를 열심히 한 걸 보고 칭찬해 주셨다.${bonusLine} (${appliedText(applied)})`);
  diary(`오늘 숙제를 많이 했더니 엄마가 기특하다고 칭찬해 주셨다.${bonusLine}`);
  await presentChoice("event-panel", "🌟 칭찬", [{ label: "헤헤, 고마워요 엄마!", value: true }], {
    body: `"우리 로이, 시키지도 않았는데 혼자 이렇게 열심히 공부하다니! 너무 이쁘고 잘했어~"${bonus ? `\n"기특해서 그러는데, 친구들이랑 맛있는 거 사 먹어~" (용돈 +${bonus}원)` : ""}\n(${appliedText(applied)})`,
    tone: "event",
    speaker: "mom",
  });
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

// ── 여행(2026-11 추가) — 한 주(또는 두 주)를 통째로 건너뛰고 날짜 단위로 진행된다 ──
const TRAVEL_FAMILY_LINES = [
  { speaker: "iroi", body: "엄마, 아빠! 여기 진짜 신기하다! 다음엔 또 어디 가?" },
  { speaker: "mom", body: "우리 로이, 오늘 진짜 즐거워 보이네~ 엄마도 너무 행복하다." },
  { speaker: "dad", body: "자, 사진 찍자! 다 같이 \"김치~\"!" },
  { speaker: "iroi", body: "아빠, 나 저거 먹어보고 싶어요! 맛있을 것 같아요!" },
  { speaker: "mom", body: "로이야, 오늘 많이 걸어서 피곤하지? 그래도 재밌었지?" },
  { speaker: "dad", body: "우리 가족 여행은 언제나 최고야. 로이 덕분에 더 재밌어." },
  { speaker: "iroi", body: "진짜 꿈만 같아! 학교 친구들한테 자랑해야지~" },
  { speaker: "mom", body: "조심히 다니고, 엄마 아빠 손 꼭 잡고 다니자~" },
];
const TRAVEL_EFFECT_NEAR = { stress: -30, social: 3, selfEsteem: 2 };
const TRAVEL_EFFECT_FAR = { stress: -40, social: 5, selfEsteem: 4, language: 2, perception: 2 };

async function runTravel(destination) {
  const startDay = state.day;
  const totalDays = destination.durationDays;
  document.getElementById("day-run").hidden = false;
  document.getElementById("day-summary").hidden = true;
  document.getElementById("day-log").innerHTML = "";
  logLine(`✈️ ${destination.name}(으)로 ${totalDays}일간 가족여행을 떠났다!`);
  diary(`${josa(destination.name, "을/를")} 가족과 함께 여행했다.`);

  // 날짜는 화면 전환 없이 한 번에 다 지나간다 — 중간에 월요일이 껴 있으면 등록 확정·주간 용돈만 조용히 처리
  for (let i = 1; i < totalDays; i++) {
    const travelDay = startDay + i;
    state.day = travelDay;
    if (weekdayOf(travelDay) === 1) {
      state.registrations.active = JSON.parse(JSON.stringify(state.registrations.pending));
      applyEffect({ wallet: WEEKLY_ALLOWANCE }, { modifier: false });
      renderStats(state.character);
      logLine(`💰 여행 중에도 이번 주 용돈 ${WEEKLY_ALLOWANCE}원이 들어왔다`);
    }
  }
  logLine(`${destination.icon} ${destination.name} 여행 — 마지막 날`);
  const images = await resolveTravelImageUrls(destination.id);
  if (images.length) await showTravelImageUrl(pickRandom(images));

  state.day = startDay + totalDays;

  // 여행 마지막 날, 가족 대화를 몰아서 한 번에 보여준다
  const recapCount = Math.min(3, TRAVEL_FAMILY_LINES.length);
  const recapLines = [...TRAVEL_FAMILY_LINES].sort(() => Math.random() - 0.5).slice(0, recapCount);
  for (const line of recapLines) {
    await presentChoice("event-panel", `${destination.icon} ${destination.name} 여행`, [{ label: "▶", value: true }], {
      body: `"${line.body}"`,
      tone: "event",
      speaker: line.speaker,
    });
  }

  const effect = destination.category === "far" ? TRAVEL_EFFECT_FAR : TRAVEL_EFFECT_NEAR;
  const applied = applyEffect(effect);
  state.character.condition.hunger = 100;
  state.character.condition.staminaNow = 100;
  renderStats(state.character);
  logLine(`✈️ 즐거운 여행을 마치고 집으로 돌아왔다 (${appliedText(applied)})`);
  diary(`${josa(destination.name, "을/를")} 가족과 함께 다녀왔다. 정말 즐거운 여행이었다!`);
  await presentChoice("event-panel", "✈️ 여행에서 돌아옴", [{ label: "▶", value: true }], {
    body: `"우리 가족 여행 진짜 최고였어! 다음에 또 가자!"\n(${appliedText(applied)})`,
    tone: "event",
    speaker: "iroi",
  });

  // 잠잘 때처럼 화면이 어두워지며 "집으로 무사히 돌아왔다…" 문구와 함께 내 방으로 돌아온다
  await screenFade("집으로 무사히 돌아왔다…", () => {
    if (typeof hideScene === "function") hideScene();
    document.getElementById("event-panel").hidden = true;
    renderDayHeader();
    renderAcademies(state.academies, state.categoryMap);
    pruneWeekPlan();
    renderTimetable();
    renderStats(state.character);
    saveGame();
    state.dayRunning = false;
    document.getElementById("start-day-btn").disabled = false;
    document.getElementById("rest-day-btn")?.removeAttribute("disabled");
    document.getElementById("travel-btn").disabled = false;
    syncRoomTravelButton();
    renderShop();
    document.getElementById("day-summary").hidden = false;
    document.getElementById("day-summary").textContent = `${destination.name} 여행에서 돌아왔다 — Day ${state.day}부터 다시 일상이 시작된다.`;
    showView("home");
    window.scrollTo(0, 0);
  });
}

// 일과 진행 중 지도 좌상단의 "다음 일정" 표시 — block이면 그 일정, "home"이면 귀가, null이면 숨김
function setNextSchedule(next) {
  const el = document.getElementById("next-schedule");
  if (!el) return;
  if (!next) {
    el.hidden = true;
    return;
  }
  if (next === "home") {
    el.textContent = "다음 일정: 🏠 집으로 귀가";
  } else {
    const { icon, label } = blockDisplay(next);
    el.textContent = `다음 일정: ${minutesToClock(next.startMin)} ${icon ?? ""} ${label}`.replace(/\s+/g, " ");
  }
  el.hidden = false;
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
  state.logicHistory = [...(state.logicHistory ?? []).filter((h) => h.day >= state.day - LOGIC_LOOKBACK_DAYS), { day: state.day, logic: state.character.stats.logic ?? 0 }];
  state.diligenceHistory = [...(state.diligenceHistory ?? []).filter((h) => h.day >= state.day - DILIGENCE_LOOKBACK_DAYS), { day: state.day, diligence: state.character.stats.diligence ?? 0 }];
  state.insaHistory = [...(state.insaHistory ?? []).filter((h) => h.day >= state.day - INSA_LOOKBACK_DAYS), { day: state.day, insa: state.character.stats.insa ?? 0 }];
  state.lastEventClock = -Infinity;
  state.calledToday = new Set();
  state.companyVisitedToday = false;
  state.dinnerDone = false;
  state.partyDone = false;
  state.momEarlyHomeToday = false;
  state.momDateDone = false;
  state.libraryHoursToday = 0;
  state.libraryPraiseChecked = false;
  state.unclePartyPending = false;
  state.friendMeetup = null;
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
  let doneBlocks = 0;
  let skippedBlocks = [];

  if (blocks.length === 0) {
    logLine("오늘은 아무 일정도 없다 — 집에서 하루를 보냈다");
    diary("오늘은 아무 일정 없이 집에서 푹 쉬었다.");
  }

  await serveBreakfast();

  try {
    for (const [blockIndex, block] of blocks.entries()) {
      const place = blockPlace(block);
      const { label: blockLabel } = blockDisplay(block);
      const alreadyThere = distanceMeters(state.charPos, place.pos) <= ARRIVAL_RADIUS_M;
      setNextSchedule(block); // 가는 중엔 지금 가는 일정이 '다음 일정'

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

      setNextSchedule(blocks[blockIndex + 1] ?? "home"); // 도착했으면 그다음 일정을 보여준다

      if (block.kind === "school") {
        clock = await runSchoolBlock(block, clock, dow, !alreadyThere && schoolWasLate);
      } else if (block.kind === "afterschool") {
        clock = await runAfterschoolBlock(block, clock);
      } else if (block.kind === "care") {
        clock = await runCareBlock(block, clock);
      } else {
        clock = Math.max(clock, block.startMin);
        let registered = block.kind === "academy" && academyClassOpen(place.academy, dow, block.startMin, block.endMin);
        if (block.kind === "academy") {
          const cat = state.categoryMap[place.academy.categoryId];
          await maybeShowIntro(cat?.introId);
          if (registered) {
            await teacherSays(
              cat?.teacher ?? "teacher",
              `${cat?.icon ?? "🏫"} ${place.name}`,
              `"${cat?.greeting ?? "로이야, 어서 와! 오늘도 열심히 해 보자~"}"`,
              "네!"
            );
          } else {
            const hours = place.academy.hours;
            await teacherSays(
              cat?.teacher ?? "teacher",
              `${cat?.icon ?? "🏫"} ${place.name}`,
              `"어? 로이야, 지금은 수업 시간이 아니야${hours ? `(수업은 ${hours.open}~${hours.close})` : ""}. 오늘은 자율학습 하고 가렴~"`,
              "네!"
            );
          }
        }
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

      doneBlocks += 1;
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
          { body: "\"오늘 수업 끝! 수고했어. 로이는 하원버스 타고 갈 거니?\"", speaker: state.categoryMap[place.academy.categoryId]?.teacher ?? "teacher" }
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
    skippedBlocks = blocks.slice(doneBlocks);
    clock = err.clock;
    logLine(`${minutesToClock(clock)} 일정을 취소하고 집으로 돌아왔다`);
    diary("가던 길에 마음이 바뀌어서 남은 일정을 취소하고 집으로 돌아왔다.");
  }

  setNextSchedule("home");
  if (!isAtHome()) {
    logLine(`${minutesToClock(clock)} 집으로 귀가 이동`);
    clock = await travelTo(state.positions.home, clock, "집");
    logLine(`${minutesToClock(clock)} 집 도착`);
  }

  setNextSchedule(null); // 집에 오면 오늘 일정은 끝
  if (gotSick) {
    await presentChoice("event-panel", "🏠 집", [{ label: "😴 잠자러 가기", value: true }], {
      body: "몸이 너무 안 좋아… 오늘은 일찍 자야겠다.",
      speaker: "iroi",
    });
  } else {
    // 7시까지 집에 왔으면 저녁밥은 자유 시간 중 자동으로 먹는다(needsDinner).
    // 7시가 지나서야 집에 들어온 거면 지금 바로 "밥은 먹었니" 대화가 뜬다.
    let needsDinner = false;
    if (clock > DINNER_MIN) {
      state.dinnerDone = true;
      await lateDinnerTalk();
    } else {
      needsDinner = true;
    }
    // 빼먹은 일정이 끝날 시각이 지난 뒤, 집에 있을 때 엄마와의 대화가 열린다
    const pendingTalk =
      cancelledEarly && skippedBlocks.length
        ? { at: Math.max(...skippedBlocks.map((b) => b.endMin)), skipped: skippedBlocks }
        : null;
    clock = await eveningFreeTime(clock, pendingTalk, needsDinner);
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
  // 캐시된 옛 index.html에는 "내 방" 화면이 없으니 그때는 주간 일정으로 대신 연다
  if (!document.getElementById(`view-${name}`)) name = "schedule";
  document.querySelectorAll(".view").forEach((el) => {
    el.hidden = el.id !== `view-${name}`;
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });
  document.getElementById("main-view").dataset.view = name;

  if (name === "home") {
    randomizeRoomCharacter();
    syncRoomTravelButton();
  }

  if (name === "map" && state.map) {
    state.map.relayout();
    if (state.charPos) {
      state.map.setCenter(new kakao.maps.LatLng(state.charPos.lat, state.charPos.lng));
    }
  }
}

// 메인 화면(내 방) — 들어올 때마다 안경 쓴/안 쓴 이로이 중 하나를 무작위로 보여준다
const ROOM_CHAR_IMAGES = ["img/characters/roy_n_9_stand.png", "img/characters/roy_g_9_stand.png"];
function randomizeRoomCharacter() {
  // 옷장(wardrobe.js)이 있으면 나이별 사진 + 입은 옷까지 그린다
  if (typeof refreshRoomAvatar === "function") {
    refreshRoomAvatar(true);
    if (typeof renderWardrobe === "function") renderWardrobe(); // 상점에서 산 옷이 바로 보이게
    return;
  }
  const img = document.getElementById("room-char");
  if (!img) return;
  img.src = ROOM_CHAR_IMAGES[Math.floor(Math.random() * ROOM_CHAR_IMAGES.length)];
}

// 설치한 앱(PWA)을 아직 예전 설정(standalone)으로 열었을 때만, 첫 터치에 전체화면으로 바꾼다.
// manifest가 fullscreen으로 적용되면 이미 전체화면이라 아무것도 하지 않는다.
function wireAppFullscreen() {
  const isInstalledWindow = window.matchMedia?.("(display-mode: standalone)").matches;
  const el = document.documentElement;
  if (!isInstalledWindow || !el.requestFullscreen) return;
  const goFullscreen = () => {
    if (document.fullscreenElement) return;
    el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  };
  document.addEventListener("pointerdown", goFullscreen, { once: true });
  // 다른 앱에 갔다 오면 전체화면이 풀리므로, 돌아와서 다시 터치하면 또 전체화면으로
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !document.fullscreenElement) {
      document.addEventListener("pointerdown", goFullscreen, { once: true });
    }
  });
}

// 지도의 이로이 얼굴 버튼 — 누르면 기본 축척으로 돌아가고 이로이를 지도 정중앙에 둔다
function wireMapRecenter() {
  const btn = document.getElementById("map-recenter-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!state.map) return;
    const pos = state.charPos ?? state.positions.home;
    if (!pos) return;
    state.map.setLevel(MAP_ZOOM_LEVEL);
    state.map.setCenter(new kakao.maps.LatLng(pos.lat, pos.lng));
  });
}

// 내 방 화면의 여행 버튼 — 주간 일정 화면의 여행 버튼(월요일에만 보임)과 같은 상태를 따라간다
function syncRoomTravelButton() {
  const roomBtn = document.getElementById("room-travel-btn");
  const travelBtn = document.getElementById("travel-btn");
  if (!roomBtn || !travelBtn) return;
  const monday = !travelBtn.hidden;
  roomBtn.disabled = !monday || travelBtn.disabled || state.dayRunning;
  roomBtn.textContent = monday ? "✈️ 여행 가기" : "✈️ 여행은 월요일에만";
  roomBtn.title = monday ? "이번 주 여행을 떠난다" : "여행은 월요일에만 떠날 수 있어요";
}

function wireRoomTravel() {
  const roomBtn = document.getElementById("room-travel-btn");
  const travelBtn = document.getElementById("travel-btn");
  if (!roomBtn || !travelBtn) return;
  roomBtn.addEventListener("click", () => {
    if (!roomBtn.disabled) travelBtn.click();
  });
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
  showView("home");
}

function wireScheduleEditor() {
  document.getElementById("start-day-btn").addEventListener("click", () => {
    if (state.dayRunning) return;
    state.dayRunning = true;
    document.getElementById("start-day-btn").disabled = true;
  document.getElementById("rest-day-btn")?.setAttribute("disabled", "");
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
const APP_VERSION = "20261111g";

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
  if (typeof wireWardrobe !== "function") await loadLocalScript("wardrobe.js");
  const wrap = document.querySelector(".map-wrap");
  if (wrap && !document.getElementById("intro-panel")) {
    const panel = document.createElement("div");
    panel.id = "intro-panel";
    panel.className = "intro-panel";
    panel.hidden = true;
    wrap.appendChild(panel);
  }
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

// img/characters/ 에 이로이 이미지가 있으면 사이드바·능력치 화면 얼굴도 바꾼다
async function applyCustomIroiImage() {
  if (typeof resolveCustomPortrait !== "function") return;
  const url = await resolveCustomPortrait("iroi");
  if (!url) return;
  PORTRAIT_SPECS.iroi.image = url;
  document.querySelectorAll("img.char-avatar, img.status-avatar, img.map-recenter-face").forEach((img) => {
    img.src = url;
  });
}

async function main() {
  await ensureUiModules();
  applyCustomIroiImage();
  // 대화창 인물 사진을 뒤에서 미리 받아 둔다(게임 시작은 막지 않음)
  if (typeof preloadAllCustomPortraits === "function") setTimeout(() => preloadAllCustomPortraits(), 1500);
  const cloudReadyPromise = initCloudSave(); // 데이터 로딩과 동시에 진행 — 느려도 게임 시작을 막지 않음

  const [
    character,
    academies,
    categories,
    items,
    clothing,
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
    parkFriends,
    travel,
  ] = await Promise.all([
    loadJSON("data/character.json"),
    loadJSON("data/academies.json"),
    loadJSON("data/academy_categories.json"),
    loadJSON("data/items.json"),
    typeof loadClothingItems === "function" ? loadClothingItems() : Promise.resolve([]),
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
    loadJSON("data/park_friends.json"),
    loadJSON("data/travel.json"),
  ]);
  state.parkFriends = parkFriends;
  state.travel = travel;

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
  state.clothing = clothing;
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
  wireSlots();
  wireTravel();
  wireRoomTravel();
  if (typeof wireWardrobe === "function") wireWardrobe();
  wireMapRecenter();
  wireAppFullscreen();
  document.getElementById("sleep-btn").addEventListener("click", sleepAndAdvance);
  document.getElementById("rest-day-btn")?.addEventListener("click", restWholeDay);
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
