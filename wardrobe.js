// ── 옷장 · 아바타 (2026-11 추가) ──
// 이로이 기본 사진: img/roy/roy_n_09.png(안경 미착용, 9살), roy_g_09.png(안경 착용, 9살) … 나이별로 두 자리 숫자.
// 옷·아이템 그림: img/item/top_01_09.png(상의, 9살용), bot_01_09.png(하의), etc_01_09.png(기타) … — 끝의 _09는 몇 살 몸에 맞춘 그림인지
//   ※ 옷 그림은 이로이 기본 사진과 "같은 크기의 투명 PNG"로, 입혀질 자리에 그려 둔다 — 그대로 위에 겹쳐서 입힌다.
// 아이템 정보: 루트의 item.csv (id · 이름 · 설명 · 우선도 · 가격 · 효과) — 제목줄 이름으로 칸을 찾으므로 칸 순서는 바뀌어도 된다
// 우선도: 1이 가장 위에 그려진다(1 > 2 > 3). 비워 두면 상의 1 · 하의 2 · 신발 3 · 기타 1
// main.js의 state / applyEffect / renderStats / saveGame / logLine 등을 그대로 쓴다.

const ROY_IMAGE_DIR = "img/roy/";
const ITEM_IMAGE_DIR = "img/item/";
const ITEM_IMAGE_EXTS = ["png", "webp", "jpg"];
const ROY_BASE_AGE = 9; // 게임 시작일(2026-03-01)의 나이 — 매년 3월 1일에 한 살씩 먹는다
const ROY_LEGACY_IMAGES = { n: "img/characters/roy_n_9_stand.png", g: "img/characters/roy_g_9_stand.png" };
const WARDROBE_SLOTS = [
  { id: "top", label: "👕 상의", prefix: "top", priority: 1 },
  { id: "bot", label: "👖 하의", prefix: "bot", priority: 2 },
  { id: "shoe", label: "👟 신발", prefix: "shoe", priority: 3 },
  { id: "etc", label: "🎒 기타", prefix: "etc", priority: 1 },
];
// 우선도가 같을 때 겹치는 순서(뒤에 있을수록 위): 신발 → 하의 → 상의 → 기타
const WARDROBE_LAYER_ORDER = ["shoe", "bot", "top", "etc"];
const WARDROBE_DRAG_START_PX = 6;
// 테스트 기간: true면 돈·구매와 상관없이 모든 옷을 입어 볼 수 있다(정식 때 false로 바꾸면 구매한 옷만)
const WARDROBE_FREE_FOR_TEST = true;

function emptyWardrobe() {
  return { owned: [], equipped: { top: null, bot: null, shoe: null, etc: null } };
}

function ensureWardrobeState() {
  if (!state.wardrobe || typeof state.wardrobe !== "object") state.wardrobe = emptyWardrobe();
  state.wardrobe.owned ??= [];
  state.wardrobe.equipped ??= {};
  WARDROBE_SLOTS.forEach((s) => {
    if (!(s.id in state.wardrobe.equipped)) state.wardrobe.equipped[s.id] = null;
  });
  return state.wardrobe;
}

// ── 나이 ──
function royAgeForDay(day) {
  const d = gameDateForDay(day);
  const start = gameDateForDay(1);
  let years = d.getUTCFullYear() - start.getUTCFullYear();
  const beforeBirthdayMark =
    d.getUTCMonth() < start.getUTCMonth() || (d.getUTCMonth() === start.getUTCMonth() && d.getUTCDate() < start.getUTCDate());
  if (beforeBirthdayMark) years -= 1;
  return ROY_BASE_AGE + Math.max(0, years);
}

// ── item.csv 읽기 ──
// 형식: 첫 줄은 제목줄(id, 이름, 설명, 우선도, 가격, 효과 — 칸 순서는 자유). 구분은 탭 또는 쉼표(쉼표가 든 칸은 "따옴표"로 감싼다).
// #으로 시작하는 줄은 메모로 보고 건너뛴다. 가격이 비었거나 0이면 처음부터 가지고 있는 아이템.
// 효과 예: "언어+1 자존감+1" 또는 "language+1; selfEsteem+1" — 입고 있는 동안 하루가 끝날 때마다 한 번 적용.
function parseCsvLine(line, delimiter) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function parseItemEffect(text) {
  const effect = {};
  if (!text) return effect;
  const labelToKey = {};
  Object.entries(typeof STAT_LABELS === "object" ? STAT_LABELS : {}).forEach(([k, v]) => (labelToKey[v] = k));
  Object.entries(typeof CONDITION_LABELS === "object" ? CONDITION_LABELS : {}).forEach(([k, v]) => (labelToKey[v] = k));
  const re = /([가-힣A-Za-z]+)\s*([+-]\s*\d+)/g;
  let m;
  while ((m = re.exec(text))) {
    const key = labelToKey[m[1]] ?? m[1];
    effect[key] = (effect[key] ?? 0) + Number(m[2].replace(/\s/g, ""));
  }
  return effect;
}

function slotForItemId(id) {
  const lower = id.toLowerCase();
  return WARDROBE_SLOTS.find((s) => lower.startsWith(`${s.prefix}_`))?.id ?? null;
}

async function loadClothingItems(path = "item.csv") {
  try {
    const res = await fetch(`${path}?v=${typeof DATA_VERSION === "string" ? DATA_VERSION : Date.now()}`);
    if (!res.ok) return [];
    const text = (await res.text()).replace(/^﻿/, "");
    const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
    if (lines.length < 2) return [];
    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    const header = parseCsvLine(lines[0], delimiter).map((h) => h.toLowerCase());
    const col = (names, fallback) => {
      const i = header.findIndex((h) => names.includes(h));
      return i >= 0 ? i : fallback;
    };
    const C = {
      id: col(["id", "아이디"], 0),
      name: col(["이름", "name"], 1),
      description: col(["설명", "description"], 2),
      priority: col(["우선도", "우선순위", "priority"], -1),
      price: col(["가격", "price"], 3),
      effect: col(["효과", "effect"], 4),
    };
    return lines.slice(1).flatMap((line, i) => {
      const cells = parseCsvLine(line, delimiter);
      const cell = (k) => (C[k] >= 0 ? cells[C[k]] ?? "" : "");
      const [id, name, description, price, effectText] = [cell("id"), cell("name"), cell("description"), cell("price"), cell("effect")];
      const slot = id ? slotForItemId(id) : null;
      if (!slot) {
        console.warn(`item.csv ${i + 2}번째 줄을 건너뜀(id는 top_/bot_/shoe_/etc_로 시작해야 함): ${line}`);
        return [];
      }
      return [
        {
          id,
          slot,
          name: name || id,
          description: description || "",
          price: Math.max(0, Number(price) || 0),
          effect: parseItemEffect(effectText),
          priority: [1, 2, 3].includes(Number(cell("priority"))) ? Number(cell("priority")) : null,
        },
      ];
    });
  } catch (err) {
    console.warn("item.csv를 읽지 못했다", err);
    return [];
  }
}

function clothingById(id) {
  return (state.clothing ?? []).find((c) => c.id === id) ?? null;
}

function ownsClothing(item) {
  if (WARDROBE_FREE_FOR_TEST) return true;
  return item.price === 0 || ensureWardrobeState().owned.includes(item.id);
}

// ── 이미지 찾기 ──
const imageProbeCache = {};
function probeImageUrl(url) {
  if (!(url in imageProbeCache)) {
    imageProbeCache[url] = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
  return imageProbeCache[url];
}

async function firstExisting(urls) {
  for (const url of urls) {
    if (await probeImageUrl(url)) return url;
  }
  return null;
}

// 나이·안경에 맞는 기본 사진 — 그 나이 사진이 없으면 가까운 나이(아래쪽 먼저), 그래도 없으면 예전 사진
async function resolveRoyBaseImage(glasses, age) {
  const g = glasses ? "g" : "n";
  const other = glasses ? "n" : "g";
  const ages = [age];
  for (let d = 1; d <= 12; d++) {
    if (age - d >= 1) ages.push(age - d);
    ages.push(age + d);
  }
  const candidates = [];
  ages.forEach((a) => {
    const aa = String(a).padStart(2, "0");
    candidates.push(`${ROY_IMAGE_DIR}roy_${g}_${aa}.png`);
    if (a === age) candidates.push(`${ROY_IMAGE_DIR}roy_${other}_${aa}.png`);
  });
  return (await firstExisting(candidates)) ?? ROY_LEGACY_IMAGES[g];
}

// 나이별 옷 그림: {id}_{나이 두 자리} — 그 나이 그림이 없으면 가까운 나이(아래쪽 먼저), 그래도 없으면 나이 없는 {id}
async function resolveItemImage(id, age = royAgeForDay(state.day ?? 1)) {
  const names = [];
  for (let d = 0; d <= 12; d++) {
    if (age - d >= 1) names.push(`${id}_${String(age - d).padStart(2, "0")}`);
    if (d > 0) names.push(`${id}_${String(age + d).padStart(2, "0")}`);
  }
  names.push(id);
  return firstExisting(names.flatMap((n) => ITEM_IMAGE_EXTS.map((ext) => `${ITEM_IMAGE_DIR}${n}.${ext}`)));
}

// 옷장 목록용 미리보기 — 옷 그림은 몸 크기 캔버스라 빈 곳이 많으므로, 그림이 있는 부분만 잘라 보여준다
const thumbCache = {};
function trimmedThumb(url) {
  if (!url) return Promise.resolve(null);
  thumbCache[url] ??= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, 240 / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > 16) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
          }
        }
        if (x1 < 0) return resolve(url);
        const pad = 4;
        x0 = Math.max(0, x0 - pad);
        y0 = Math.max(0, y0 - pad);
        x1 = Math.min(w - 1, x1 + pad);
        y1 = Math.min(h - 1, y1 + pad);
        const out = document.createElement("canvas");
        out.width = x1 - x0 + 1;
        out.height = y1 - y0 + 1;
        out.getContext("2d").drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
        resolve(out.toDataURL("image/png"));
      } catch (err) {
        resolve(url);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
  return thumbCache[url];
}

// ── 방 아바타 그리기 ──
let roomGlasses = false;
async function refreshRoomAvatar(rerollGlasses = false) {
  const base = document.getElementById("room-char");
  if (!base) return;
  if (rerollGlasses) roomGlasses = Math.random() < 0.5;
  const age = royAgeForDay(state.day ?? 1);
  const url = await resolveRoyBaseImage(roomGlasses, age);
  if (base.getAttribute("src") !== url) base.src = url;
  base.alt = `방 안에 서 있는 이로이 (${age}살${roomGlasses ? ", 안경" : ""})`;

  const wardrobe = ensureWardrobeState();
  for (const slot of WARDROBE_LAYER_ORDER) {
    const layer = document.querySelector(`#room-avatar .room-layer[data-slot="${slot}"]`);
    if (!layer) continue;
    const itemId = wardrobe.equipped[slot];
    const src = itemId ? await resolveItemImage(itemId, age) : null;
    layer.style.zIndex = String(layerZIndex(slot, itemId));
    if (src) {
      layer.src = src;
      layer.hidden = false;
    } else {
      layer.removeAttribute("src");
      layer.hidden = true;
    }
  }
}

// 겹치는 높이: 우선도 1이 가장 위(1 > 2 > 3), 같으면 신발 → 하의 → 상의 → 기타 순으로 위
function layerZIndex(slot, itemId) {
  const item = itemId ? clothingById(itemId) : null;
  const def = WARDROBE_SLOTS.find((s) => s.id === slot)?.priority ?? 2;
  const priority = item?.priority ?? def;
  return (4 - priority) * 10 + WARDROBE_LAYER_ORDER.indexOf(slot) + 1;
}

// ── 입기 / 벗기 ──
function equipClothing(id) {
  const item = clothingById(id);
  if (!item) return;
  if (!ownsClothing(item)) {
    flashWardrobeNote(`🔒 ${item.name}은(는) 아직 없어요. 상점에서 ${item.price}원에 살 수 있어요.`);
    return;
  }
  const wardrobe = ensureWardrobeState();
  wardrobe.equipped[item.slot] = wardrobe.equipped[item.slot] === id ? null : id;
  refreshRoomAvatar();
  renderWardrobe();
  saveGame();
}

function unequipAll() {
  const wardrobe = ensureWardrobeState();
  WARDROBE_SLOTS.forEach((s) => (wardrobe.equipped[s.id] = null));
  refreshRoomAvatar();
  renderWardrobe();
  saveGame();
}

let wardrobeNoteTimer = null;
function flashWardrobeNote(text) {
  const note = document.getElementById("wardrobe-note");
  if (!note) return;
  note.textContent = text;
  note.hidden = false;
  clearTimeout(wardrobeNoteTimer);
  wardrobeNoteTimer = setTimeout(() => (note.hidden = true), 2600);
}

// ── 옷장 화면 ──
function openWardrobe() {
  const scene = document.querySelector(".room-scene");
  const panel = document.getElementById("wardrobe-panel");
  if (!scene || !panel) return;
  scene.classList.add("wardrobe-open");
  panel.hidden = false;
  renderWardrobe();
}

function closeWardrobe() {
  document.querySelector(".room-scene")?.classList.remove("wardrobe-open");
  const panel = document.getElementById("wardrobe-panel");
  if (panel) panel.hidden = true;
}

function renderWardrobe() {
  const panel = document.getElementById("wardrobe-panel");
  if (!panel || panel.hidden) return;
  const wardrobe = ensureWardrobeState();
  WARDROBE_SLOTS.forEach((slot) => {
    const list = panel.querySelector(`.wardrobe-list[data-slot="${slot.id}"]`);
    if (!list) return;
    list.innerHTML = "";
    const items = (state.clothing ?? []).filter((c) => c.slot === slot.id);
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "wardrobe-empty";
      empty.textContent = "아직 아이템이 없어요";
      list.appendChild(empty);
      return;
    }
    items.forEach((item) => list.appendChild(wardrobeCard(item, wardrobe)));
  });
}

function wardrobeCard(item, wardrobe) {
  const owned = ownsClothing(item);
  const worn = wardrobe.equipped[item.slot] === item.id;
  const card = document.createElement("div");
  card.className = `wardrobe-card${worn ? " worn" : ""}${owned ? "" : " locked"}`;
  card.dataset.itemId = item.id;
  card.title = owned ? (worn ? "누르면 벗어요" : "누르거나 로이에게 끌어다 놓으면 입어요") : `상점에서 ${item.price}원`;

  const thumb = document.createElement("div");
  thumb.className = "wardrobe-thumb";
  const fallback = WARDROBE_SLOTS.find((s) => s.id === item.slot)?.label.split(" ")[0] ?? "🎁";
  thumb.textContent = fallback;
  resolveItemImage(item.id)
    .then(trimmedThumb)
    .then((src) => {
      if (!src) return;
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.draggable = false;
      thumb.replaceChildren(img);
    });

  const name = document.createElement("div");
  name.className = "wardrobe-name";
  name.textContent = item.name;
  const desc = document.createElement("div");
  desc.className = "wardrobe-desc";
  desc.textContent = item.description;
  card.append(thumb, name, desc);

  if (Object.keys(item.effect).length) {
    const eff = document.createElement("div");
    eff.className = "wardrobe-effect";
    eff.textContent = `입고 있으면 매일: ${signedEffectText(item.effect)}`;
    card.appendChild(eff);
  }
  const badge = document.createElement("div");
  badge.className = "wardrobe-badge";
  badge.textContent = worn ? "✅ 입는 중" : owned ? "" : `🔒 ${item.price}원`;
  if (badge.textContent) card.appendChild(badge);

  wireWardrobeCardDrag(card, item);
  return card;
}

// 누르면 입기/벗기, 끌어서 로이 몸 위에 놓아도 입기 (마우스·터치 모두)
function wireWardrobeCardDrag(card, item) {
  let start = null;
  let ghost = null;
  card.addEventListener("pointerdown", (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return;
    start = { x: ev.clientX, y: ev.clientY, id: ev.pointerId };
  });
  card.addEventListener("pointermove", (ev) => {
    if (!start || ev.pointerId !== start.id) return;
    const moved = Math.hypot(ev.clientX - start.x, ev.clientY - start.y);
    if (!ghost && moved > WARDROBE_DRAG_START_PX && ownsClothing(item)) {
      // 세로 스크롤 중이면 끌기로 보지 않는다
      if (Math.abs(ev.clientY - start.y) > Math.abs(ev.clientX - start.x) * 1.5 && ev.pointerType !== "mouse") {
        start = null;
        return;
      }
      card.setPointerCapture?.(ev.pointerId);
      ghost = document.createElement("div");
      ghost.className = "wardrobe-ghost";
      const src = card.querySelector(".wardrobe-thumb img")?.src;
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        ghost.appendChild(img);
      } else {
        ghost.textContent = card.querySelector(".wardrobe-thumb")?.textContent ?? "🎁";
      }
      document.body.appendChild(ghost);
      document.getElementById("room-avatar")?.classList.add("drop-ready");
    }
    if (ghost) {
      ghost.style.left = `${ev.clientX}px`;
      ghost.style.top = `${ev.clientY}px`;
    }
  });
  const end = (ev) => {
    if (!start) return;
    const wasDrag = !!ghost;
    if (ghost) {
      ghost.remove();
      ghost = null;
      const avatar = document.getElementById("room-avatar");
      avatar?.classList.remove("drop-ready");
      const r = avatar?.getBoundingClientRect();
      const onRoy = r && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
      const wardrobe = ensureWardrobeState();
      if (onRoy && wardrobe.equipped[item.slot] !== item.id) equipClothing(item.id);
    }
    start = null;
    if (!wasDrag && ev.type === "pointerup") equipClothing(item.id);
  };
  card.addEventListener("pointerup", end);
  card.addEventListener("pointercancel", () => {
    ghost?.remove();
    ghost = null;
    document.getElementById("room-avatar")?.classList.remove("drop-ready");
    start = null;
  });
}

// ── 상점: 옷·아이템 사기 ──
function renderClothingShop(listEl) {
  const forSale = (state.clothing ?? []).filter((c) => c.price > 0);
  if (!listEl || forSale.length === 0) return;
  const head = document.createElement("li");
  head.className = "shop-section-head";
  head.textContent = "👕 옷 · 아이템 (사면 내 방 옷장에서 입을 수 있어요)";
  listEl.appendChild(head);
  forSale.forEach((item) => {
    const owned = ownsClothing(item);
    const li = document.createElement("li");
    const row = document.createElement("div");
    row.className = "item-row";
    const icon = WARDROBE_SLOTS.find((s) => s.id === item.slot)?.label.split(" ")[0] ?? "🎁";
    const eff = Object.keys(item.effect).length ? ` (입고 있으면 매일 ${signedEffectText(item.effect)})` : "";
    row.innerHTML = `<span class="item-icon">${icon}</span><span><strong></strong> — ${item.price}원<br><span class="muted"></span></span>`;
    row.querySelector("strong").textContent = item.name;
    row.querySelector(".muted").textContent = `${item.description}${eff}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-buy-btn";
    btn.textContent = WARDROBE_FREE_FOR_TEST ? "테스트 중" : owned ? "보유 중" : "구매";
    btn.disabled = owned || state.dayRunning || state.character.wallet < item.price;
    btn.addEventListener("click", () => {
      if (ownsClothing(item) || state.dayRunning || state.character.wallet < item.price) return;
      state.character.wallet -= item.price;
      ensureWardrobeState().owned.push(item.id);
      renderStats(state.character);
      renderShop();
      saveGame();
      showShopFeedback(`${icon} ${item.name}을(를) 샀다! 내 방 옷장에서 입어 보세요. (잔액 ${state.character.wallet}원)`);
    });
    li.append(row, btn);
    listEl.appendChild(li);
  });
}

// ── 입고 있는 옷의 효과: 하루가 끝날 때마다 한 번 ──
function applyWardrobeDailyEffects() {
  const wardrobe = ensureWardrobeState();
  const total = {};
  const names = [];
  WARDROBE_SLOTS.forEach((s) => {
    const item = clothingById(wardrobe.equipped[s.id]);
    if (!item || !ownsClothing(item) || !Object.keys(item.effect).length) return;
    names.push(item.name);
    Object.entries(item.effect).forEach(([k, v]) => (total[k] = (total[k] ?? 0) + v));
  });
  if (!names.length) return;
  const applied = applyEffect(total, { modifier: false });
  if (Object.keys(applied).length) logLine(`👕 ${names.join(", ")} 효과 (${appliedText(applied)})`);
}

function wireWardrobe() {
  ensureWardrobeState();
  document.getElementById("wardrobe-btn")?.addEventListener("click", () => {
    const panel = document.getElementById("wardrobe-panel");
    if (panel && !panel.hidden) closeWardrobe();
    else openWardrobe();
  });
  document.getElementById("wardrobe-close")?.addEventListener("click", closeWardrobe);
  document.getElementById("wardrobe-undress")?.addEventListener("click", unequipAll);
}
