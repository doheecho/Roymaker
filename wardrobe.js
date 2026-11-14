// ── 옷장 · 아바타 (2026-11 추가) ──
// 이로이 기본 사진: img/roy/roy_n_09.png(안경 미착용, 9살), roy_g_09.png(안경 착용, 9살) … 나이별로 두 자리 숫자.
// 옷·아이템 그림: img/item/top_01_09.png(상의, 9살용), bot_01_09.png(하의), etc_01_09.png(기타) … — 끝의 _09는 몇 살 몸에 맞춘 그림인지
//   ※ 옷 그림은 이로이 기본 사진과 "같은 크기의 투명 PNG"로, 입혀질 자리에 그려 둔다 — 그대로 위에 겹쳐서 입힌다.
// 아이템 정보: 루트의 item.csv (id · 이름 · 설명 · 가격 · 효과) — 제목줄 이름으로 칸을 찾으므로 칸 순서는 바뀌어도 된다
// (선택) 낱개 옷을 다시 쓸 때 '우선도' 칸을 넣으면 1이 가장 위에 그려진다. 없으면 상의 1 · 하의 2 · 신발 3 · 기타 1
// main.js의 state / applyEffect / renderStats / saveGame / logLine 등을 그대로 쓴다.

const ROY_IMAGE_DIR = "img/roy/";
// 코디 세트: img/outfit/roy_{n|g}_{나이}_{번호}.png — 옷 입은 이로이 전신 사진(배경 투명)을 몸 사진 대신 통째로 보여준다
const OUTFIT_IMAGE_DIR = "img/outfit/";
const ITEM_IMAGE_DIR = "img/item/";
const ITEM_IMAGE_EXTS = ["png", "webp", "jpg"];
const ROY_BASE_AGE = 9; // 게임 시작일(2026-03-01)의 나이 — 매년 3월 1일에 한 살씩 먹는다
const ROY_LEGACY_IMAGES = { n: "img/characters/roy_n_9_stand.png", g: "img/characters/roy_g_9_stand.png" };
const WARDROBE_SLOTS = [
  { id: "set", label: "🧥 코디", prefix: "set", priority: 1 },
  { id: "top", label: "👕 상의", prefix: "top", priority: 1 },
  { id: "bot", label: "👖 하의", prefix: "bot", priority: 2 },
  { id: "shoe", label: "👟 신발", prefix: "shoe", priority: 3 },
  { id: "etc", label: "🎒 기타", prefix: "etc", priority: 1 },
];
// 우선도가 같을 때 겹치는 순서(뒤에 있을수록 위): 신발 → 하의 → 상의 → 기타
const WARDROBE_LAYER_ORDER = ["shoe", "bot", "top", "etc"];
// 테스트 기간: true면 돈·구매와 상관없이 모든 옷을 입어 볼 수 있다(정식 때 false로 바꾸면 구매한 옷만)
const WARDROBE_FREE_FOR_TEST = true;

function emptyWardrobe() {
  return { owned: [], equipped: { set: null, top: null, bot: null, shoe: null, etc: null }, appliedEffect: {} };
}

function ensureWardrobeState() {
  if (!state.wardrobe || typeof state.wardrobe !== "object") state.wardrobe = emptyWardrobe();
  state.wardrobe.owned ??= [];
  state.wardrobe.equipped ??= {};
  state.wardrobe.appliedEffect ??= {};
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
// 코디 세트 사진: 지금 안경 상태 → 다른 안경 상태 → 가까운 나이 순으로 찾는다
async function resolveOutfitImage(id, glasses, age = royAgeForDay(state.day ?? 1)) {
  const num = id.replace(/^set_/, "");
  const order = glasses ? ["g", "n"] : ["n", "g"];
  const urls = [];
  for (let d = 0; d <= 12; d++) {
    const ages = d === 0 ? [age] : [age - d, age + d].filter((a) => a >= 1);
    ages.forEach((a) => order.forEach((g) => urls.push(`${OUTFIT_IMAGE_DIR}roy_${g}_${String(a).padStart(2, "0")}_${num}.png`)));
  }
  return firstExisting(urls);
}

async function resolveItemImage(id, age = royAgeForDay(state.day ?? 1)) {
  if (id.startsWith("set_")) return resolveOutfitImage(id, roomGlasses, age);
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
function trimmedThumb(url, maxSize = 240) {
  if (!url) return Promise.resolve(null);
  const key = `${url}@${maxSize}`;
  thumbCache[key] ??= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
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
  return thumbCache[key];
}

// ── 방 아바타 그리기 ──
let roomGlasses = false;
async function refreshRoomAvatar(rerollGlasses = false) {
  const base = document.getElementById("room-char");
  if (!base) return;
  const chosen = ensureWardrobeState().glasses;
  if (typeof chosen === "boolean") roomGlasses = chosen; // 옷장에서 안경을 직접 쓰거나 벗었으면 그대로 유지
  else if (rerollGlasses) roomGlasses = Math.random() < 0.5;
  syncGlassesButton();
  const age = royAgeForDay(state.day ?? 1);
  const wardrobeNow = ensureWardrobeState();
  // 코디 세트를 입었으면 몸 사진 대신 코디 사진을 통째로 보여주고, 다른 옷 레이어는 숨긴다
  const outfitUrl = wardrobeNow.equipped.set && clothingById(wardrobeNow.equipped.set) ? await resolveOutfitImage(wardrobeNow.equipped.set, roomGlasses, age) : null;
  const url = outfitUrl ?? (await resolveRoyBaseImage(roomGlasses, age));
  if (base.getAttribute("src") !== url) base.src = url;
  base.alt = `방 안에 서 있는 이로이 (${age}살${roomGlasses ? ", 안경" : ""})`;
  // 사진이 정해지기 전의 기본(큰) 사진이 잠깐 보였다가 줄어드는 게 보이지 않도록,
  // 여기까지 와서 진짜 사진이 정해진 뒤에야 보여준다
  document.getElementById("room-avatar")?.classList.remove("pending");
  refreshMapAvatar();

  const wardrobe = ensureWardrobeState();
  for (const slot of WARDROBE_LAYER_ORDER) {
    const layer = document.querySelector(`#room-avatar .room-layer[data-slot="${slot}"]`);
    if (!layer) continue;
    const equippedId = wardrobe.equipped[slot];
    // item.csv에서 빠졌거나 꺼 둔 옷은 그리지 않는다(예전 세이브에 남은 낱개 옷 등)
    const itemId = outfitUrl || !clothingById(equippedId) ? null : equippedId;
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


async function refreshMapAvatar() {
  // 코디 사진마다 목 위치가 달라 자동으로 머리/몸을 나누는 가분수 변환이 옷에 따라 머리가
  // 찌그러지거나 배경 잔상이 남는 문제가 있어서, 지도 위에서는 코드로 그린 기존 가분수
  // 캐릭터를 그대로 쓴다(코디 사진은 내 방 화면에서만 보여준다).
  const sp = typeof state === "object" ? state.sprite : null;
  if (!sp?.el) return;
  sp.el.classList.remove("has-photo");
}

// ── 안경 쓰기 / 벗기 ──
function syncGlassesButton() {
  const btn = document.getElementById("wardrobe-glasses");
  if (btn) btn.textContent = roomGlasses ? "👓 안경 벗기" : "👓 안경 쓰기";
}

function toggleGlasses() {
  roomGlasses = !roomGlasses;
  ensureWardrobeState().glasses = roomGlasses;
  refreshRoomAvatar();
  renderWardrobe();
  saveGame();
}

// ── 입고 있는 옷의 효과를 실시간으로 적용/회수 ──
// 입을 때 적용된 실제 수치(클램핑 반영)를 slot별로 기억해 뒀다가, 벗을 때 그 수치 그대로 되돌린다
// (능력치가 이미 100에 가까워 일부만 적용됐을 때도 어긋나지 않도록)
function reverseSlotEffect(wardrobe, slotId) {
  const prev = wardrobe.appliedEffect[slotId];
  if (!prev || !Object.keys(prev).length) return;
  applyEffect(Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, -v])), { modifier: false });
  wardrobe.appliedEffect[slotId] = {};
}

function applySlotEffect(wardrobe, slotId) {
  const item = clothingById(wardrobe.equipped[slotId]);
  if (!item || !ownsClothing(item) || !Object.keys(item.effect).length) {
    wardrobe.appliedEffect[slotId] = {};
    return null;
  }
  const applied = applyEffect(item.effect, { modifier: false });
  wardrobe.appliedEffect[slotId] = applied;
  return { item, applied };
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
  const wearing = wardrobe.equipped[item.slot] !== id;
  const changedSlots = new Set([item.slot]);
  // 코디 세트와 낱개 옷은 함께 입지 않는다 — 같이 벗겨지는 슬롯들도 효과를 되돌려야 한다
  if (wearing && item.slot === "set") ["top", "bot", "shoe"].forEach((s) => changedSlots.add(s));
  if (wearing && ["top", "bot", "shoe"].includes(item.slot)) changedSlots.add("set");

  changedSlots.forEach((s) => reverseSlotEffect(wardrobe, s));
  wardrobe.equipped[item.slot] = wearing ? id : null;
  if (wearing && item.slot === "set") ["top", "bot", "shoe"].forEach((s) => (wardrobe.equipped[s] = null));
  if (wearing && ["top", "bot", "shoe"].includes(item.slot)) wardrobe.equipped.set = null;
  const results = [...changedSlots].map((s) => applySlotEffect(wardrobe, s)).filter(Boolean);

  renderStats(state.character);
  results.forEach(({ item: wornItem, applied }) => {
    if (Object.keys(applied).length) logLine(`👕 ${wornItem.name} 효과 (${appliedText(applied)})`);
  });
  refreshRoomAvatar();
  renderWardrobe();
  saveGame();
}

function unequipAll() {
  const wardrobe = ensureWardrobeState();
  WARDROBE_SLOTS.forEach((s) => reverseSlotEffect(wardrobe, s.id));
  WARDROBE_SLOTS.forEach((s) => (wardrobe.equipped[s.id] = null));
  renderStats(state.character);
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
    // 아이템이 하나도 없는 칸은 숨긴다(지금은 코디 세트만 쓰는 중)
    const section = list.closest(".wardrobe-section");
    if (section) section.hidden = items.length === 0;
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
  card.title = owned ? (worn ? "누르면 벗어요" : "누르면 입어요") : `상점에서 ${item.price}원`;

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
    eff.textContent = signedEffectText(item.effect);
    card.appendChild(eff);
  }
  const badge = document.createElement("div");
  badge.className = "wardrobe-badge";
  badge.textContent = worn ? "✅ 입는 중" : owned ? "" : `🔒 ${item.price}원`;
  if (badge.textContent) card.appendChild(badge);

  card.addEventListener("click", () => equipClothing(item.id));
  return card;
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
    const eff = Object.keys(item.effect).length ? ` (${signedEffectText(item.effect)})` : "";
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

function wireWardrobe() {
  ensureWardrobeState();
  document.getElementById("wardrobe-btn")?.addEventListener("click", () => {
    const panel = document.getElementById("wardrobe-panel");
    if (panel && !panel.hidden) closeWardrobe();
    else openWardrobe();
  });
  document.getElementById("wardrobe-close")?.addEventListener("click", closeWardrobe);
  document.getElementById("wardrobe-undress")?.addEventListener("click", unequipAll);
  document.getElementById("wardrobe-glasses")?.addEventListener("click", toggleGlasses);
  syncGlassesButton();
  wireRoomZoom();
}

// ── 내 방 이로이 확대/축소: 마우스 휠, 방 화면에서 ↑/↓ 키 — 최소는 지금 보이는 기본 크기 ──
const ROOM_ZOOM_KEY = "roymaker-room-zoom";
const ROOM_ZOOM_MIN = 1;
const ROOM_ZOOM_MAX = 2.5;
let roomZoom = ROOM_ZOOM_MIN;

function applyRoomZoom() {
  document.querySelector(".room-char-wrap")?.style.setProperty("--room-zoom", roomZoom);
}

function setRoomZoom(next) {
  roomZoom = Math.min(ROOM_ZOOM_MAX, Math.max(ROOM_ZOOM_MIN, next));
  applyRoomZoom();
  try {
    localStorage.setItem(ROOM_ZOOM_KEY, String(roomZoom));
  } catch (err) {
    // 저장이 안 되면 이번 화면에서만 적용된다
  }
}

function isHomeViewActive() {
  return document.getElementById("main-view")?.dataset.view === "home";
}

function wireRoomZoom() {
  try {
    const saved = Number(localStorage.getItem(ROOM_ZOOM_KEY));
    if (saved >= ROOM_ZOOM_MIN && saved <= ROOM_ZOOM_MAX) roomZoom = saved;
  } catch (err) {
    // 기본값(최소 크기)으로 시작
  }
  applyRoomZoom();

  const scene = document.querySelector(".room-scene");
  scene?.addEventListener(
    "wheel",
    (ev) => {
      if (!isHomeViewActive() || ev.target.closest("#wardrobe-panel")) return;
      ev.preventDefault();
      setRoomZoom(roomZoom + (ev.deltaY < 0 ? 0.08 : -0.08));
    },
    { passive: false }
  );

  window.addEventListener("keydown", (ev) => {
    if (!isHomeViewActive() || (ev.key !== "ArrowUp" && ev.key !== "ArrowDown")) return;
    if (document.activeElement?.closest("#wardrobe-panel")) return;
    ev.preventDefault();
    setRoomZoom(roomZoom + (ev.key === "ArrowUp" ? 0.1 : -0.1));
  });
}
