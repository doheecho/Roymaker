// 대화창 초상화 — 이로이는 얼굴 그림(img/character-face.png), 다른 사람은 코드로 그린 32×32 도트 얼굴.
// main.js보다 먼저 로드되지만, main.js의 함수(addOutline 등)는 실제로 그릴 때만 부른다.

const PORTRAIT_SPECS = {
  iroi: { name: "이로이", image: "img/character-face.png", bg: "#3d7be0" },
  mom: { name: "엄마", skin: "#f6d2b5", hair: "#4a2c22", style: "long", mouth: "smile", cheeks: true, lashes: true, earrings: true, shirt: "#f29bb5", bg: "#ffd9e6" },
  dad: { name: "아빠", skin: "#efc39e", hair: "#1f1a1c", style: "short", glasses: "square", mouth: "smile", shirt: "#3d5a8a", tie: "#c94b4b", bg: "#d9e6fb" },
  friend_1: { name: "같은 반 친구", skin: "#f7d1b0", hair: "#6b4325", style: "spiky", mouth: "grin", cheeks: true, shirt: "#ffd257", bg: "#fff1bf" },
  friend_2: { name: "같은 반 친구", skin: "#f9d6bb", hair: "#2a1d1a", style: "pigtails", mouth: "smile", cheeks: true, lashes: true, pin: "#ff7a9c", shirt: "#b48ae0", bg: "#eee0fb" },
  grandma_mom: { name: "외할머니", skin: "#efc8a8", hair: "#cfcac6", style: "bun", glasses: "round", mouth: "smile", wrinkles: true, shirt: "#9a6fb0", bg: "#efe2f6" },
  grandma_dad: { name: "친할머니", skin: "#e9bb93", hair: "#d6d2cc", style: "short", mouth: "smile", wrinkles: true, cheeks: true, shirt: "#c98a5c", bg: "#f7e6d2" },
  grandpa_mom: { name: "외할아버지", skin: "#d9a074", hair: "#cfcac6", style: "bald", glasses: "square", mustache: true, mouth: "smile", wrinkles: true, shirt: "#5f7a5a", bg: "#e3ecda" },
  grandpa_dad: { name: "친할아버지", skin: "#e3b08a", hair: "#bdb8b2", style: "short", mustache: true, mouth: "smile", wrinkles: true, shirt: "#6d7a8a", bg: "#e6eaf0" },
  police_man: { name: "경찰관", skin: "#efc39e", hair: "#1f1a1c", style: "short", hat: "police", mouth: "smile", badge: true, shirt: "#2b3a6b", bg: "#dbe3f6" },
  stranger: { name: "수상한 어른", skin: "#d8b08f", hair: "#3a3330", style: "short", hat: "fedora", glasses: "sun", mouth: "smirk", stubble: true, shirt: "#5b5b66", bg: "#4a4058" },
  bully: { name: "동네 형", skin: "#e8b892", hair: "#2a201c", style: "spiky", brows: "angry", mouth: "frown", bandaid: true, shirt: "#d9534f", bg: "#fbd9d6" },
  crying_friend: { name: "친구", skin: "#f9d6bb", hair: "#5a3a26", style: "bob", brows: "sad", mouth: "frown", tears: true, shirt: "#7fc4e8", bg: "#d9effa" },
  stationery_owner: { name: "문구점 아저씨", skin: "#efc39e", hair: "#6d6560", style: "bald", mustache: true, mouth: "smile", apron: "#f0e6c8", shirt: "#7a9e5a", bg: "#e6f2d9" },
  snack_owner: { name: "분식집 이모", skin: "#f3cba9", hair: "#3a2620", style: "bun", headscarf: "#e94e4e", mouth: "smile", cheeks: true, apron: "#fff1e0", shirt: "#f08a5d", bg: "#ffe6d6" },
  library_teacher: { name: "도서관 선생님", skin: "#f3cba9", hair: "#3a2a24", style: "bob", glasses: "round", mouth: "smile", lashes: true, shirt: "#8fb36b", bg: "#eef5e3" },
  teacher: { name: "선생님", skin: "#f3cba9", hair: "#3a2a24", style: "bob", glasses: "round", mouth: "smile", shirt: "#5fa8a0", bg: "#dcf1ee" },
  butterfly_uncle: { name: "나비정원 삼촌", skin: "#e9bb93", hair: "#2a201c", style: "short", hat: "cap", hatColor: "#5fae6e", mouth: "grin", cheeks: true, shirt: "#5fae6e", bg: "#e3f4e0" },
  homeroom_teacher: { name: "담임 선생님", skin: "#f6d2b5", hair: "#5a3a26", style: "bob", glasses: "round", mouth: "smile", cheeks: true, lashes: true, shirt: "#f5a3b5", bg: "#fde4ec" },
  afterschool_1: { name: "방과후 선생님", skin: "#efc39e", hair: "#2b2422", style: "short", mouth: "grin", shirt: "#5fae6e", bg: "#e3f4e0" },
  afterschool_2: { name: "방과후 선생님", skin: "#f7d6bc", hair: "#7a4a2a", style: "long", mouth: "smile", cheeks: true, lashes: true, earrings: true, shirt: "#ffd257", bg: "#fff4cc" },
  afterschool_3: { name: "방과후 선생님", skin: "#f3cba9", hair: "#1f1a1c", style: "bun", glasses: "square", mouth: "smile", lashes: true, shirt: "#64b5f6", bg: "#e1f0fc" },
  taekwondo_master: { name: "태권도 사범님", skin: "#e8b892", hair: "#1a1515", style: "spiky", mouth: "grin", dobok: true, shirt: "#f5f5f5", bg: "#fbd9d6" },
  coding_teacher: { name: "코딩 선생님", skin: "#efc39e", hair: "#2b2422", style: "short", glasses: "square", mouth: "smile", headset: true, shirt: "#6d7a8a", bg: "#e3e9f2" },
  art_teacher: { name: "미술 선생님", skin: "#f6d2b5", hair: "#8a4a2a", style: "long", hat: "beret", hatColor: "#c94b4b", mouth: "smile", cheeks: true, lashes: true, paint: true, shirt: "#ba68c8", bg: "#f3e5f8" },
  essay_teacher: { name: "논술 선생님", skin: "#f3cba9", hair: "#3a2a24", style: "bun", glasses: "round", mouth: "smile", lashes: true, shirt: "#c8a46a", bg: "#f7eedc" },
  math_teacher: { name: "수학 선생님", skin: "#efc39e", hair: "#3a3330", style: "short", glasses: "square", mustache: true, mouth: "smile", tie: "#3d5a8a", shirt: "#ffffff", bg: "#e6eef8" },
  swim_coach: { name: "수영장 코치님", skin: "#d9a074", hair: "#1f1a1c", style: "short", hat: "swimcap", hatColor: "#3d7be0", goggles: true, mouth: "grin", whistle: true, shirt: "#1f6fbf", bg: "#d6f0fb" },
  teacher_badminton: { name: "배드민턴 선생님", skin: "#e3b08a", hair: "#1f1a1c", style: "short", hat: "cap", hatColor: "#2f9e6e", mouth: "grin", whistle: true, shirt: "#2f9e6e", bg: "#dcf3e8" },
  sports_coach: { name: "체육 코치님", skin: "#e3b08a", hair: "#1f1a1c", style: "short", hat: "cap", hatColor: "#d9534f", mouth: "grin", whistle: true, shirt: "#d9534f", bg: "#fde0dd" },
  gyeongyul_uncle: { name: "경율이 삼촌", skin: "#efc39e", hair: "#2b2422", style: "short", glasses: "square", mouth: "smile", shirt: "#e0a43b", bg: "#fdf0d2" },
  alba_mcdonalds: { name: "맥도날드 알바생", skin: "#f3cba9", hair: "#2b2422", style: "short", hat: "cap", hatColor: "#d9534f", mouth: "grin", cheeks: true, shirt: "#ffd257", bg: "#fff1bf" },
  alba_momstouch: { name: "맘스터치 알바생", skin: "#efc39e", hair: "#3a2a24", style: "short", hat: "cap", hatColor: "#4f7a3f", mouth: "smile", shirt: "#5fae6e", bg: "#e3f4e0" },
  alba_lotteria: { name: "롯데리아 알바생", skin: "#f7d6bc", hair: "#5a3a26", style: "bob", hat: "cap", hatColor: "#d9534f", mouth: "smile", cheeks: true, lashes: true, shirt: "#e8584f", bg: "#fbd9d6" },
  alba_kfc: { name: "KFC 알바생", skin: "#e8b892", hair: "#1f1a1c", style: "short", hat: "cap", hatColor: "#c9302c", mouth: "grin", shirt: "#ffffff", bg: "#fbe2e0" },
  alba_burgerking: { name: "버거킹 알바생", skin: "#efc39e", hair: "#3a2a24", style: "spiky", hat: "cap", hatColor: "#e0a43b", mouth: "grin", cheeks: true, shirt: "#8a4a2a", bg: "#f7e3cc" },
  alba_gimbab: { name: "김밥천국 알바생", skin: "#f3cba9", hair: "#3a2620", style: "bun", headscarf: "#e0a43b", mouth: "smile", apron: "#fff1e0", shirt: "#7a9e5a", bg: "#f0f7e6" },
};

const PORTRAIT_SIZE = 32;
const portraitCache = {};

function portraitSpec(id) {
  return PORTRAIT_SPECS[id] ?? null;
}

// 32×32 도트 얼굴 그리기
function paintPortrait(spec) {
  const c = document.createElement("canvas");
  c.width = PORTRAIT_SIZE;
  c.height = PORTRAIT_SIZE;
  const ctx = c.getContext("2d");
  const r = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const oval = (cx, cy, rx, ry, color) => {
    for (let y = -ry; y <= ry; y++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5))));
      r(cx - half, cy + y, half * 2 + 1, 1, color);
    }
  };
  const dark = "#2a2030";
  const skinD = shade(spec.skin, -24);

  // 어깨 + 옷
  oval(16, 31, 12, 5, spec.shirt);
  if (spec.apron) {
    r(11, 27, 10, 5, spec.apron);
    r(11, 26, 1, 2, spec.apron);
    r(20, 26, 1, 2, spec.apron);
  }
  if (spec.tie) r(15, 26, 2, 6, spec.tie);
  if (spec.dobok) {
    r(12, 25, 2, 6, "#d9d9d9");
    r(18, 25, 2, 6, "#d9d9d9");
    r(6, 29, 20, 2, "#1a1a1a");
  }
  if (spec.whistle) {
    r(15, 25, 1, 3, "#e8c34a");
    r(14, 28, 3, 2, "#c0c0c8");
  }
  if (spec.badge) r(9, 28, 2, 2, "#e8c34a");
  // 긴 머리는 어깨 뒤로
  if (spec.style === "long") {
    r(6, 9, 4, 19, spec.hair);
    r(22, 9, 4, 19, spec.hair);
  }
  // 목 + 얼굴 + 귀
  r(13, 23, 6, 4, skinD);
  oval(16, 15, 8, 9, spec.skin);
  r(7, 14, 1, 3, spec.skin);
  r(24, 14, 1, 3, spec.skin);

  // 머리 모양
  const hair = spec.hair;
  if (spec.style !== "bald") {
    oval(16, 9, 9, 5, hair);
    r(7, 9, 2, 4, hair);
    r(23, 9, 2, 4, hair);
  } else {
    r(7, 11, 2, 4, hair);
    r(23, 11, 2, 4, hair);
  }
  if (spec.style === "spiky") {
    [9, 12, 15, 18, 21].forEach((x, i) => r(x, 2 + (i % 2), 2, 3, hair));
    [10, 13, 17, 20].forEach((x) => r(x, 10, 1, 2, hair));
  }
  if (spec.style === "short" || spec.style === "long") r(10, 10, 12, 1, hair);
  if (spec.style === "bob") {
    r(7, 9, 3, 12, hair);
    r(22, 9, 3, 12, hair);
    r(10, 10, 12, 2, hair);
  }
  if (spec.style === "pigtails") {
    oval(5, 14, 2, 3, hair);
    oval(27, 14, 2, 3, hair);
    r(10, 10, 12, 1, hair);
    if (spec.pin) r(21, 8, 2, 2, spec.pin);
  }
  if (spec.style === "bun") {
    oval(16, 3, 3, 2, hair);
    r(10, 10, 12, 1, hair);
  }

  // 모자
  if (spec.hat === "police") {
    r(8, 3, 16, 6, "#22305a");
    r(7, 8, 18, 2, "#141a30");
    r(15, 4, 2, 2, "#e8c34a");
  } else if (spec.hat === "fedora") {
    r(9, 1, 14, 6, "#3b3640");
    r(9, 5, 14, 1, "#7a6a5a");
    r(4, 7, 24, 2, "#2e2a33");
  } else if (spec.hat === "cap") {
    r(8, 3, 16, 6, spec.hatColor);
    r(6, 8, 12, 2, shade(spec.hatColor, -30));
  } else if (spec.hat === "beret") {
    r(8, 3, 17, 4, spec.hatColor);
    r(10, 2, 12, 1, spec.hatColor);
    r(16, 1, 1, 1, spec.hatColor);
  } else if (spec.hat === "swimcap") {
    oval(16, 8, 9, 5, spec.hatColor);
    r(7, 9, 18, 2, spec.hatColor);
  }
  if (spec.headscarf) r(8, 4, 16, 5, spec.headscarf);
  if (spec.goggles) {
    r(9, 9, 6, 2, "#7cc8f0");
    r(17, 9, 6, 2, "#7cc8f0");
    r(15, 9, 2, 1, "#2a2030");
  }
  if (spec.headset) {
    r(6, 10, 2, 7, "#3b3b45");
    r(24, 10, 2, 7, "#3b3b45");
    r(8, 4, 16, 1, "#3b3b45");
    r(9, 19, 4, 1, "#3b3b45");
  }

  // 눈썹
  if (spec.brows === "angry") {
    r(10, 11, 2, 1, dark);
    r(12, 12, 2, 1, dark);
    r(18, 12, 2, 1, dark);
    r(20, 11, 2, 1, dark);
  } else if (spec.brows === "sad") {
    r(10, 12, 2, 1, dark);
    r(12, 11, 2, 1, dark);
    r(18, 11, 2, 1, dark);
    r(20, 12, 2, 1, dark);
  } else if (!spec.hat || spec.hat === "cap" || spec.hat === "beret") {
    r(10, 12, 4, 1, shade(hair, 10));
    r(18, 12, 4, 1, shade(hair, 10));
  }

  // 눈
  if (spec.glasses !== "sun") {
    r(11, 14, 2, 2, dark);
    r(19, 14, 2, 2, dark);
    r(11, 14, 1, 1, "#ffffff");
    r(19, 14, 1, 1, "#ffffff");
    if (spec.lashes) {
      r(10, 13, 1, 1, dark);
      r(21, 13, 1, 1, dark);
    }
  }
  if (spec.glasses === "round" || spec.glasses === "square") {
    const g = spec.glasses === "round" ? "#c8a46a" : "#3b3b45";
    r(9, 13, 6, 1, g);
    r(9, 17, 6, 1, g);
    r(9, 13, 1, 5, g);
    r(14, 13, 1, 5, g);
    r(17, 13, 6, 1, g);
    r(17, 17, 6, 1, g);
    r(17, 13, 1, 5, g);
    r(22, 13, 1, 5, g);
    r(15, 14, 2, 1, g);
  } else if (spec.glasses === "sun") {
    r(9, 13, 6, 4, "#1a1a22");
    r(17, 13, 6, 4, "#1a1a22");
    r(15, 14, 2, 1, "#1a1a22");
    r(10, 14, 2, 1, "#5a5a70");
  }
  if (spec.tears) {
    r(11, 16, 1, 3, "#7cc8f0");
    r(20, 16, 1, 3, "#7cc8f0");
  }
  if (spec.wrinkles) {
    r(8, 15, 1, 1, skinD);
    r(23, 15, 1, 1, skinD);
  }
  if (spec.cheeks) {
    r(9, 18, 2, 1, "#f4a3a0");
    r(21, 18, 2, 1, "#f4a3a0");
  }
  if (spec.paint) {
    r(20, 19, 2, 1, "#64b5f6");
    r(22, 18, 1, 1, "#ffd54f");
  }
  if (spec.bandaid) {
    r(21, 18, 3, 2, "#f2d39a");
    r(22, 18, 1, 2, "#d9b46a");
  }
  if (spec.earrings) {
    r(7, 17, 1, 1, "#e8c34a");
    r(24, 17, 1, 1, "#e8c34a");
  }
  if (spec.mustache) r(12, 19, 8, 1, shade(hair, -10));
  if (spec.stubble) {
    [12, 14, 17, 19].forEach((x) => r(x, 22, 1, 1, shade(spec.skin, -50)));
    [13, 16, 18].forEach((x) => r(x, 23, 1, 1, shade(spec.skin, -50)));
  }

  // 입
  const m = "#b8484d";
  if (spec.mouth === "grin") {
    r(13, 20, 6, 2, m);
    r(13, 20, 6, 1, "#ffffff");
  } else if (spec.mouth === "frown") {
    r(13, 21, 1, 1, m);
    r(14, 20, 4, 1, m);
    r(18, 21, 1, 1, m);
  } else if (spec.mouth === "smirk") {
    r(13, 21, 4, 1, m);
    r(17, 20, 2, 1, m);
  } else {
    r(13, 20, 1, 1, m);
    r(14, 21, 4, 1, m);
    r(18, 20, 1, 1, m);
  }

  if (typeof addOutline === "function") addOutline(c, ctx);
  return c;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, v + amt));
  const rr = ch(n >> 16);
  const gg = ch((n >> 8) & 255);
  const bb = ch(n & 255);
  return `#${((rr << 16) | (gg << 8) | bb).toString(16).padStart(6, "0")}`;
}

// 대화창에 넣을 초상화 요소 (img 또는 확대된 canvas)
function portraitElement(id) {
  const spec = portraitSpec(id);
  if (!spec) return null;
  if (spec.image) {
    const img = document.createElement("img");
    img.src = spec.image;
    img.alt = spec.name;
    return img;
  }
  portraitCache[id] ??= paintPortrait(spec);
  const c = document.createElement("canvas");
  c.width = PORTRAIT_SIZE;
  c.height = PORTRAIT_SIZE;
  c.getContext("2d").drawImage(portraitCache[id], 0, 0);
  c.setAttribute("aria-label", spec.name);
  return c;
}

// ── 직접 넣은 캐릭터 이미지 (img/characters/) ──
// 파일 이름을 캐릭터 이름(예: 엄마.png, 이로이.jpg) 또는 id(예: mom.png)로 넣으면 그 그림으로 바뀐다.
const CHARACTER_DIR = "img/characters/";
const CHARACTER_EXTS = ["png", "jpg", "jpeg", "webp"];
const LISTING_CACHE_KEY = "roymaker-character-listing";
const LISTING_CACHE_MS = 10 * 60 * 1000;
const CHARACTER_REPO = "doheecho/Roymaker";
const customPortraitCache = {};
let characterListing = null; // Map(이름 → 파일명) | false(목록을 못 받음)
let characterListingPromise = null;

// GitHub에서 폴더 목록을 한 번 받아 온다 (실패하면 파일을 하나씩 찾아본다)
function loadCharacterListing() {
  characterListingPromise ??= (async () => {
    // 10분 안에 받아 둔 목록이 있으면 다시 묻지 않는다 (GitHub API 요청 제한 대비)
    try {
      const cached = JSON.parse(sessionStorage.getItem(LISTING_CACHE_KEY) ?? "null");
      if (cached && Date.now() - cached.at < LISTING_CACHE_MS) {
        characterListing = new Map(cached.entries);
        return;
      }
    } catch (err) {
      // 저장소를 못 쓰면 그냥 새로 받는다
    }
    try {
      const res = await fetch(`https://api.github.com/repos/${CHARACTER_REPO}/contents/${CHARACTER_DIR.replace(/\/$/, "")}`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = await res.json();
      characterListing = new Map();
      items
        .filter((it) => it.type === "file" && /\.(png|jpe?g|webp|gif)$/i.test(it.name))
        .forEach((it) => characterListing.set(it.name.replace(/\.[^.]+$/, "").normalize("NFC").trim(), it.name));
      try {
        sessionStorage.setItem(LISTING_CACHE_KEY, JSON.stringify({ at: Date.now(), entries: [...characterListing] }));
      } catch (err) {
        // 무시
      }
    } catch (err) {
      characterListing = false;
    }
  })();
  return characterListingPromise;
}

function probeImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// 이미 찾아 둔 결과가 있으면 바로 돌려준다(없으면 undefined) — 대화창이 기다리지 않고 그릴 수 있게
function cachedCustomPortrait(id) {
  return id in customPortraitCache ? customPortraitCache[id] : undefined;
}

// 사진을 미리 받아 두는 곳 — 같은 주소의 <img>는 이 덕분에 기다림 없이 뜬다
const preloadedPortraits = {};
function preloadPortraitImage(url) {
  if (!url) return Promise.resolve(false);
  if (!preloadedPortraits[url]) {
    const img = new Image();
    img.decoding = "async";
    preloadedPortraits[url] = new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
    preloadedPortraits[url].img = img;
    img.src = url;
  }
  return preloadedPortraits[url];
}

// 게임 시작 뒤 대화에 나오는 인물 사진들을 한 장씩 미리 받아 둔다
async function preloadAllCustomPortraits() {
  for (const id of Object.keys(PORTRAIT_SPECS)) {
    const url = await resolveCustomPortrait(id);
    if (url) await preloadPortraitImage(url);
  }
}

async function resolveCustomPortrait(id) {
  if (id in customPortraitCache) return customPortraitCache[id];
  const spec = portraitSpec(id);
  const names = [...new Set([id, spec?.name].filter(Boolean).map((n) => n.normalize("NFC")))];
  await loadCharacterListing();
  let url = null;
  if (characterListing) {
    const hit = names.map((n) => characterListing.get(n)).find(Boolean);
    if (hit) url = CHARACTER_DIR + encodeURIComponent(hit);
  } else {
    outer: for (const n of names) {
      for (const form of [...new Set([n, n.normalize("NFD")])]) {
        for (const ext of CHARACTER_EXTS) {
          const candidate = `${CHARACTER_DIR}${encodeURIComponent(form)}.${ext}`;
          if (await probeImage(candidate)) {
            url = candidate;
            break outer;
          }
        }
      }
    }
  }
  customPortraitCache[id] = url;
  return url;
}
