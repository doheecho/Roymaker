// 일정 애니메이션 창 (프린세스 메이커 2의 수행 장면처럼)
// 128×80 도트 캔버스에 배경 + 이로이 스프라이트 + 소품을 매 프레임 그린다.
// main.js의 buildSpriteCache / renderSpriteFrame / SP 를 그릴 때만 사용한다.

const SCENE_W = 128;
const SCENE_H = 80;

const sceneState = { spec: null, raf: 0, startedAt: 0, extra: {} };

function sceneCtx() {
  const canvas = document.getElementById("scene-canvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

// ── 그리기 도구 ──
function sR(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function sText(ctx, text, x, y, c, size = 8) {
  ctx.fillStyle = c;
  ctx.font = `bold ${size}px "Jua", "Gowun Dodum", sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillText(text, Math.round(x), Math.round(y));
}

function spriteFrame(dir, walking, t, speed = 8) {
  state.sprite.cache ??= buildSpriteCache();
  const set = state.sprite.cache[dir];
  if (!walking) return set.idle;
  return set.walk[Math.floor(t * speed) % set.walk.length];
}

// 큰 동작(발차기 등)은 따로 한 번만 그려 둔다
function posePose(key, dir, swing) {
  sceneState.extra.poses ??= {};
  sceneState.extra.poses[key] ??= renderSpriteFrame(dir, swing, 0);
  return sceneState.extra.poses[key];
}

function drawActor(ctx, img, x, y) {
  ctx.drawImage(img, Math.round(x), Math.round(y));
}

function tri(t, period) {
  const p = (t % period) / period;
  return p < 0.5 ? p * 2 : 2 - p * 2;
}

// ── 배경 ──
function bgRoom(ctx, wall, floor, floorLine) {
  sR(ctx, 0, 0, SCENE_W, 56, wall);
  sR(ctx, 0, 56, SCENE_W, 24, floor);
  sR(ctx, 0, 56, SCENE_W, 1, floorLine);
  for (let x = 0; x < SCENE_W; x += 16) sR(ctx, x, 57, 1, 23, floorLine);
}

function bgOutdoor(ctx, t, ground = "#7cc46a") {
  sR(ctx, 0, 0, SCENE_W, 50, "#9fd4f5");
  sR(ctx, 0, 34, SCENE_W, 16, "#b9e2f8");
  const cx = (t * 4) % (SCENE_W + 40) - 20;
  [
    [cx, 8],
    [cx + 60, 16],
  ].forEach(([x, y]) => {
    sR(ctx, (x % (SCENE_W + 40)) - 10, y, 18, 4, "#ffffff");
    sR(ctx, (x % (SCENE_W + 40)) - 6, y - 3, 10, 3, "#ffffff");
  });
  sR(ctx, 0, 50, SCENE_W, 30, ground);
  sR(ctx, 0, 50, SCENE_W, 2, "#5fa850");
}

function bgClassroom(ctx, board) {
  bgRoom(ctx, "#f3e9d2", "#c8955c", "#a9773f");
  sR(ctx, 22, 4, 84, 30, "#8a5a32");
  sR(ctx, 24, 6, 80, 26, "#2f5d46");
  if (board) sText(ctx, board, 30, 12, "#f4f1e0", 10);
  sR(ctx, 24, 32, 80, 2, "#6e4426");
  sR(ctx, 90, 29, 6, 2, "#f4f1e0");
}

function desk(ctx, x = 30, w = 68, y = 52) {
  sR(ctx, x, y, w, 5, "#a0703f");
  sR(ctx, x, y + 5, w, 1, "#7a5230");
  sR(ctx, x + 3, y + 6, 3, 22, "#7a5230");
  sR(ctx, x + w - 6, y + 6, 3, 22, "#7a5230");
}

function floaters(ctx, t, symbols, color) {
  symbols.forEach((s, i) => {
    const phase = (t * 0.6 + i / symbols.length) % 1;
    sText(ctx, s, 14 + ((i * 37) % 96), 44 - phase * 40, color, 9);
  });
}

// ── 장면들 ──
const SCENES = {
  classroom(ctx, t, o) {
    bgClassroom(ctx, o.board);
    const bob = Math.floor(t * 2) % 2;
    drawActor(ctx, spriteFrame("down", false, t), 52, 26 + bob);
    desk(ctx);
    sR(ctx, 54, 49, 20, 4, "#ffffff");
    const px = 56 + tri(t, 0.8) * 14;
    sR(ctx, px, 46, 1, 4, "#e8c34a");
  },
  cafeteria(ctx, t) {
    bgRoom(ctx, "#fbefe0", "#e7d7bd", "#cdbb9c");
    drawActor(ctx, spriteFrame("down", false, t), 52, 24);
    desk(ctx, 24, 80, 50);
    sR(ctx, 46, 46, 36, 5, "#b9c3c9");
    sR(ctx, 50, 44, 8, 3, "#ffffff");
    sR(ctx, 61, 44, 8, 3, "#e9a35b");
    sR(ctx, 72, 44, 7, 3, "#7cc46a");
    const p = (Math.sin(t * 5) + 1) / 2;
    sR(ctx, 66, 46 - p * 10, 2, 6, "#9aa4ab");
  },
  reading(ctx, t) {
    bgRoom(ctx, "#eef3e6", "#c8955c", "#a9773f");
    sR(ctx, 6, 8, 26, 44, "#8a5a32");
    ["#e57373", "#64b5f6", "#ffd54f", "#81c784", "#ba68c8"].forEach((c, i) => sR(ctx, 9 + i * 4, 12, 3, 12, c));
    ["#4fc3f7", "#ff8a65", "#aed581", "#f06292"].forEach((c, i) => sR(ctx, 9 + i * 5, 30, 4, 12, c));
    drawActor(ctx, spriteFrame("down", false, t), 58, 26);
    desk(ctx, 38, 68);
    sR(ctx, 60, 47, 22, 6, "#ffffff");
    sR(ctx, 70, 47, 1, 6, "#c9c0b0");
    if (Math.floor(t * 1.2) % 2) sR(ctx, 71, 44, 9, 4, "#f7f2e6");
  },
  play(ctx, t) {
    bgOutdoor(ctx, t);
    sR(ctx, 92, 26, 3, 26, "#b14a2a");
    sR(ctx, 116, 26, 3, 26, "#b14a2a");
    sR(ctx, 90, 24, 31, 3, "#d9534f");
    const sw = Math.sin(t * 3) * 6;
    sR(ctx, 103 + sw, 27, 1, 14, "#555");
    sR(ctx, 100 + sw, 41, 8, 2, "#ffb74d");
    const jump = Math.abs(Math.sin(t * 4)) * 10;
    drawActor(ctx, spriteFrame("down", true, t), 40, 18 - jump);
  },
  soccer(ctx, t) {
    bgOutdoor(ctx, t, "#6fbf5e");
    sR(ctx, 0, 64, SCENE_W, 1, "#ffffff");
    sR(ctx, 112, 30, 2, 24, "#ffffff");
    sR(ctx, 112, 30, 14, 2, "#ffffff");
    const p = tri(t, 3);
    const goingRight = (t % 3) / 3 < 0.5;
    const x = 10 + p * 76;
    drawActor(ctx, spriteFrame(goingRight ? "right" : "left", true, t, 12), x, 22);
    const bx = x + (goingRight ? 24 : -6);
    const by = 51 - Math.abs(Math.sin(t * 8)) * 4;
    sR(ctx, bx, by, 5, 5, "#ffffff");
    sR(ctx, bx + 2, by + 1, 1, 3, "#333");
  },
  dodgeball(ctx, t) {
    bgRoom(ctx, "#e8d8b0", "#d9b27a", "#c49a5f");
    sR(ctx, 63, 56, 2, 24, "#ffffff");
    const jump = (t % 1.6) > 1.0 ? Math.sin(((t % 1.6) - 1.0) / 0.6 * Math.PI) * 12 : 0;
    drawActor(ctx, spriteFrame("left", jump > 0, t), 70, 22 - jump);
    const bx = SCENE_W - ((t % 1.6) / 1.6) * (SCENE_W + 10);
    sR(ctx, bx, 44, 7, 7, "#e53935");
  },
  jumprope(ctx, t) {
    bgOutdoor(ctx, t);
    const phase = (t * 1.6) % 1;
    const jump = Math.sin(phase * Math.PI) * 9;
    drawActor(ctx, spriteFrame("down", false, t), 52, 18 - jump);
    ctx.strokeStyle = "#ff7a52";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const over = phase < 0.5;
    ctx.ellipse(64, over ? 16 - jump : 54, 20, over ? 10 : 4, 0, over ? Math.PI : 0, over ? 2 * Math.PI : Math.PI);
    ctx.stroke();
  },
  inline(ctx, t) {
    bgOutdoor(ctx, t);
    sR(ctx, 0, 60, SCENE_W, 10, "#c9c9c9");
    const x = ((t * 30) % (SCENE_W + 30)) - 26;
    drawActor(ctx, spriteFrame("right", false, t), x, 26);
    sR(ctx, x + 6, 61, 3, 2, "#333");
    sR(ctx, x + 14, 61, 3, 2, "#333");
  },
  dance(ctx, t) {
    sR(ctx, 0, 0, SCENE_W, SCENE_H, "#2d2350");
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = `rgba(255, 240, 160, ${0.12 + 0.08 * Math.sin(t * 3 + i)})`;
      ctx.beginPath();
      ctx.moveTo(20 + i * 44, 0);
      ctx.lineTo(4 + i * 44, 70);
      ctx.lineTo(44 + i * 44, 70);
      ctx.fill();
    }
    sR(ctx, 0, 62, SCENE_W, 18, "#5a3b7a");
    const dirs = ["down", "left", "down", "right"];
    const dir = dirs[Math.floor(t * 2) % 4];
    const bob = Math.abs(Math.sin(t * 6)) * 3;
    drawActor(ctx, spriteFrame(dir, true, t, 10), 52, 28 - bob);
    floaters(ctx, t, ["♪", "♫", "♪"], "#ffd54f");
  },
  taekwondo(ctx, t) {
    bgRoom(ctx, "#fdfaf2", "#d6b37a", "#b8935a");
    sR(ctx, 30, 6, 68, 14, "#c62828");
    sText(ctx, "태권도", 46, 8, "#ffffff", 10);
    sR(ctx, 20, 60, 88, 16, "#3f6fb5");
    const kicking = Math.floor(t * 2.2) % 2 === 1;
    drawActor(ctx, kicking ? posePose("kick", "right", 1.9) : spriteFrame("right", false, t), 50, 26);
    if (kicking) sText(ctx, "얍!", 80, 28, "#c62828", 10);
  },
  art(ctx, t) {
    bgRoom(ctx, "#fff6e8", "#c8955c", "#a9773f");
    sR(ctx, 80, 18, 2, 40, "#8a5a32");
    sR(ctx, 98, 18, 2, 40, "#8a5a32");
    sR(ctx, 76, 14, 28, 24, "#ffffff");
    sR(ctx, 76, 38, 28, 2, "#8a5a32");
    const colors = ["#e57373", "#64b5f6", "#ffd54f", "#81c784", "#ba68c8", "#ff8a65"];
    const n = Math.floor(t * 4) % 40;
    for (let i = 0; i < n; i++) {
      const x = 78 + ((i * 7919) % 24);
      const y = 16 + ((i * 104729) % 20);
      sR(ctx, x, y, 2, 2, colors[i % colors.length]);
    }
    drawActor(ctx, spriteFrame("right", false, t), 50, 26);
    sR(ctx, 72 + tri(t, 0.6) * 4, 30 + tri(t, 0.9) * 6, 4, 1, "#8a5a32");
  },
  craft(ctx, t, o) {
    bgRoom(ctx, "#fff6e8", "#c8955c", "#a9773f");
    drawActor(ctx, spriteFrame("down", false, t), 52, 24);
    desk(ctx, 26, 76, 50);
    if (o.kind === "cooking") {
      sR(ctx, 56, 44, 18, 6, "#555b63");
      sR(ctx, 74, 46, 8, 2, "#3b3f45");
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.8 + i / 3) % 1;
        sR(ctx, 60 + i * 5, 42 - p * 14, 2, 2, `rgba(255,255,255,${1 - p})`);
      }
    } else {
      const colors = ["#e57373", "#64b5f6", "#ffd54f", "#81c784"];
      const c = colors[Math.floor(t) % colors.length];
      const squish = Math.round(Math.sin(t * 6) * 2);
      sR(ctx, 58 - squish, 45 + squish, 12 + squish * 2, 6 - squish, c);
    }
  },
  music(ctx, t, o) {
    bgRoom(ctx, "#f2ecfb", "#c8955c", "#a9773f");
    const bob = Math.floor(t * 3) % 2;
    drawActor(ctx, spriteFrame("down", false, t), 52, 26 + bob);
    const inst = o.instrument ?? "guitar";
    if (inst === "drum") {
      sR(ctx, 50, 50, 28, 10, "#d9534f");
      sR(ctx, 50, 50, 28, 2, "#f5f5f5");
      const hit = Math.floor(t * 6) % 2;
      sR(ctx, 54, 44 + hit * 4, 1, 6, "#8a5a32");
      sR(ctx, 72, 48 - hit * 4, 1, 6, "#8a5a32");
    } else if (inst === "flute") {
      sR(ctx, 48, 40, 22, 2, "#c0c0c8");
    } else if (inst === "violin") {
      sR(ctx, 66, 38, 8, 10, "#a0522d");
      sR(ctx, 58 + tri(t, 0.7) * 12, 40, 14, 1, "#e8d8b0");
    } else {
      sR(ctx, 54, 42, 12, 9, "#c8814a");
      sR(ctx, 66, 44, 12, 2, "#8a5a32");
    }
    floaters(ctx, t, ["♪", "♫", "♬", "♪"], "#7e57c2");
  },
  computer(ctx, t) {
    bgRoom(ctx, "#e6eef5", "#9aa7b4", "#7f8c99");
    sR(ctx, 40, 10, 48, 32, "#2b2f36");
    sR(ctx, 43, 13, 42, 26, "#14261c");
    const lines = 6;
    for (let i = 0; i < lines; i++) {
      const w = 8 + ((i * 13 + Math.floor(t * 3)) % 26);
      sR(ctx, 46, 15 + i * 4, w, 2, i % 3 === 0 ? "#7cf29b" : "#4fc3f7");
    }
    if (Math.floor(t * 3) % 2) sR(ctx, 46, 15 + lines * 4 - 2, 3, 2, "#ffffff");
    sR(ctx, 60, 42, 8, 6, "#2b2f36");
    desk(ctx, 22, 84, 50);
    drawActor(ctx, spriteFrame("up", false, t), 52, 36);
  },
  science(ctx, t) {
    bgRoom(ctx, "#e8f4f2", "#b9c3c9", "#9aa4ab");
    drawActor(ctx, spriteFrame("down", false, t), 52, 24);
    desk(ctx, 26, 76, 50);
    sR(ctx, 76, 38, 6, 8, "#cfe9f5");
    sR(ctx, 73, 46, 12, 5, "#cfe9f5");
    sR(ctx, 74, 47, 10, 4, "#81c784");
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.9 + i / 3) % 1;
      sR(ctx, 77 + i * 2, 44 - p * 16, 2, 2, "#a5d6a7");
    }
    sR(ctx, 40, 46, 4, 5, "#ffd54f");
  },
  study(ctx, t, o) {
    bgRoom(ctx, "#f7f1e3", "#c8955c", "#a9773f");
    floaters(ctx, t, o.symbols ?? ["1", "+", "2", "=", "3"], "#4c8fd1");
    const bob = Math.floor(t * 2) % 2;
    drawActor(ctx, spriteFrame("down", false, t), 52, 26 + bob);
    desk(ctx);
    sR(ctx, 54, 49, 20, 4, "#ffffff");
    sR(ctx, 56 + tri(t, 0.8) * 14, 46, 1, 4, "#e8c34a");
  },
  chores(ctx, t) {
    bgRoom(ctx, "#fdf3e1", "#d9b27a", "#c49a5f");
    sR(ctx, 8, 14, 22, 16, "#bfe3f5");
    sR(ctx, 8, 14, 22, 2, "#8a5a32");
    const p = tri(t, 3);
    const right = (t % 3) / 3 < 0.5;
    const x = 12 + p * 80;
    drawActor(ctx, spriteFrame(right ? "right" : "left", true, t, 10), x, 22);
    const bx = right ? x + 22 : x - 4;
    sR(ctx, bx, 40, 2, 16, "#8a5a32");
    sR(ctx, bx - 3, 54, 8, 3, "#e8c34a");
    for (let i = 0; i < 3; i++) {
      const q = (t * 1.5 + i / 3) % 1;
      sR(ctx, bx + (right ? 6 : -6) + i * 2, 54 - q * 6, 1, 1, `rgba(150,130,100,${1 - q})`);
    }
  },
  errand(ctx, t) {
    bgOutdoor(ctx, t);
    const off = (t * 24) % 48;
    for (let i = -1; i < 4; i++) {
      const x = i * 48 - off;
      sR(ctx, x + 6, 26, 24, 24, "#f3d9b1");
      sR(ctx, x + 4, 22, 28, 5, "#c0624a");
      sR(ctx, x + 14, 38, 6, 12, "#8a5a32");
      sR(ctx, x + 36, 34, 3, 16, "#8a5a32");
      sR(ctx, x + 31, 26, 13, 10, "#4caf50");
    }
    sR(ctx, 0, 58, SCENE_W, 8, "#d0c4b0");
    drawActor(ctx, spriteFrame("right", true, t, 10), 50, 24);
    sR(ctx, 52, 44, 8, 6, "#c8955c");
    sR(ctx, 53, 41, 6, 1, "#8a5a32");
  },
  garden(ctx, t) {
    bgOutdoor(ctx, t);
    for (let i = 0; i < 12; i++) {
      const x = 4 + i * 11;
      sR(ctx, x + 1, 58, 1, 6, "#3e8e41");
      sR(ctx, x, 56, 3, 3, ["#f06292", "#ffd54f", "#ba68c8", "#ff8a65"][i % 4]);
    }
    drawActor(ctx, spriteFrame("down", false, t), 52, 22);
    for (let i = 0; i < 3; i++) {
      const bx = 64 + Math.sin(t * 1.3 + i * 2) * 40;
      const by = 24 + Math.sin(t * 2.1 + i) * 12;
      const flap = Math.floor(t * 8 + i) % 2;
      const c = ["#ff8a65", "#64b5f6", "#ffd54f"][i];
      sR(ctx, bx - (flap ? 3 : 2), by, flap ? 3 : 2, 3, c);
      sR(ctx, bx + 1, by, flap ? 3 : 2, 3, c);
      sR(ctx, bx, by, 1, 3, "#3a2a24");
    }
  },
  game(ctx, t) {
    bgRoom(ctx, "#e6e0f5", "#c8955c", "#a9773f");
    sR(ctx, 36, 8, 56, 34, "#2b2f36");
    const palette = ["#64b5f6", "#ff8a65", "#81c784", "#ffd54f", "#ba68c8"];
    sR(ctx, 39, 11, 50, 28, palette[Math.floor(t * 2) % palette.length]);
    const hx = 44 + tri(t, 1.4) * 36;
    sR(ctx, hx, 28, 5, 5, "#ffffff");
    sR(ctx, 70, 16 + Math.round(Math.sin(t * 5) * 3), 6, 4, "#2b2f36");
    sR(ctx, 60, 42, 8, 6, "#2b2f36");
    sR(ctx, 30, 62, 68, 10, "#d9534f");
    drawActor(ctx, spriteFrame("up", false, t), 52, 34 + (Math.floor(t * 4) % 2));
    sR(ctx, 58, 52, 12, 4, "#3b3f45");
  },
  swim(ctx, t) {
    sR(ctx, 0, 0, SCENE_W, 30, "#e3f4fb");
    sR(ctx, 0, 30, SCENE_W, 50, "#4fa8e0");
    for (let i = 0; i < 6; i++) sR(ctx, ((i * 26 + t * 12) % (SCENE_W + 20)) - 10, 36 + (i % 3) * 12, 12, 1, "#a9dcf7");
    sR(ctx, 0, 52, SCENE_W, 1, "#ff7a52");
    const x = ((t * 22) % (SCENE_W + 30)) - 26;
    const bob = Math.sin(t * 6) * 1.5;
    drawActor(ctx, spriteFrame("right", false, t), x, 22 + bob);
    sR(ctx, x - 4, 44 + bob, 34, 16, "#4fa8e0");
    const splash = Math.floor(t * 6) % 2;
    sR(ctx, x + (splash ? 26 : -4), 40 + bob, 3, 2, "#ffffff");
  },
  rest(ctx, t) {
    bgRoom(ctx, "#e6e0f5", "#c8955c", "#a9773f");
    sR(ctx, 26, 30, 4, 30, "#8a5a32");
    sR(ctx, 26, 48, 80, 12, "#8a5a32");
    sR(ctx, 30, 30, 22, 8, "#ffffff");
    drawActor(ctx, spriteFrame("down", false, t), 30, 16 + (Math.floor(t * 1.5) % 2));
    sR(ctx, 30, 33, 74, 16, "#7aa7e0");
    sR(ctx, 30, 33, 74, 3, "#a9c8f0");
    floaters(ctx, t, ["Z", "z", "Z"], "#5c6bc0");
  },
};

// ── 일정 → 장면 고르기 ──
const SUBJECT_BOARDS = {
  korean: "가나다라",
  math: "2×3=6",
  right_living: "질서·배려",
  wise_living: null,
  joyful_living: null,
};
const CREATIVE_BOARDS = { "학급 회의": "학급회의", "안전 교육": "안전 교육!", "독서 활동": "책 읽기", "학교 행사 준비": "행사 준비" };

const COURSE_SCENES = {
  robot_coding: { id: "computer" },
  life_science: { id: "science" },
  chess_baduk: { id: "study", symbols: ["♟", "♞", "♜", "●", "○"] },
  soccer: { id: "soccer" },
  dodgeball: { id: "dodgeball" },
  music_jumprope: { id: "jumprope" },
  inline_skate: { id: "inline" },
  kpop_dance: { id: "dance" },
  drawing: { id: "art" },
  clay_art: { id: "craft", kind: "clay" },
  total_craft: { id: "craft", kind: "clay" },
  kids_cooking: { id: "craft", kind: "cooking" },
  ukulele: { id: "music", instrument: "guitar" },
  violin: { id: "music", instrument: "violin" },
  flute: { id: "music", instrument: "flute" },
  drum: { id: "music", instrument: "drum" },
  acoustic_guitar: { id: "music", instrument: "guitar" },
  native_english: { id: "study", symbols: ["A", "B", "C", "Hi!"] },
  basic_english: { id: "study", symbols: ["A", "B", "C", "Hi!"] },
  hanja: { id: "study", symbols: ["天", "地", "人", "山"] },
  abacus: { id: "study", symbols: ["1", "2", "3", "+", "="] },
  ict: { id: "computer" },
};

const CARE_SCENES = {
  play_gym: { id: "play" },
  music_jumprope: { id: "jumprope" },
  kids_dance: { id: "dance" },
  play_coding: { id: "computer" },
  ai_intro: { id: "computer" },
  creative_art: { id: "art" },
  play_theater: { id: "dance" },
  instrument: { id: "music", instrument: "guitar" },
  science_lab: { id: "science" },
  play_math_english: { id: "study", symbols: ["1+1", "ABC", "2", "Z"] },
};

const ACADEMY_SCENES = {
  martial_arts: { id: "taekwondo" },
  art: { id: "art" },
  math: { id: "study", symbols: ["12", "×", "3", "=", "36"] },
  essay_writing: { id: "study", symbols: ["가", "나", "다", "✎"] },
  coding: { id: "computer" },
  ball_sports: { id: "soccer" },
  swimming: { id: "swim" },
  premium_academic: { id: "study", symbols: ["A+", "★", "π", "∑"] },
};

const ACTIVITY_SCENES = {
  chore_30: { id: "chores" },
  chore_60: { id: "chores" },
  errand_grandma_seongdong: { id: "errand" },
  errand_junggye: { id: "errand" },
  butterfly_garden: { id: "garden" },
};

function sceneForSubject(subject, topic) {
  if (!subject) return { id: "study" };
  if (subject.id === "creative_activity") return { id: "classroom", board: CREATIVE_BOARDS[topic] ?? "창체" };
  if (subject.id === "wise_living") return { id: "garden" };
  if (subject.id === "joyful_living") return topic === "그리기" || topic === "만들기" ? { id: "art" } : { id: "dance" };
  return { id: "classroom", board: SUBJECT_BOARDS[subject.id] ?? "" };
}

function sceneForCourse(courseId) {
  return COURSE_SCENES[courseId] ?? { id: "study" };
}

function sceneForCare(slot, programId) {
  if (slot?.id === "morning") return { id: "reading" };
  return CARE_SCENES[programId] ?? { id: "play" };
}

function sceneForAcademy(categoryId, registered) {
  if (!registered) return { id: "study", symbols: ["자습", "✎", "…"] };
  return ACADEMY_SCENES[categoryId] ?? { id: "study" };
}

function sceneForActivity(activityId) {
  return ACTIVITY_SCENES[activityId] ?? { id: "chores" };
}

// ── 창 열고 닫기 ──
function showScene(spec, caption) {
  const panel = document.getElementById("scene-panel");
  if (!panel || !spec || !SCENES[spec.id]) return;
  document.getElementById("scene-caption").textContent = caption ?? "";
  panel.hidden = false;
  if (sceneState.spec?.id !== spec.id || sceneState.spec?.board !== spec.board) {
    sceneState.startedAt = performance.now();
  }
  sceneState.spec = spec;
  if (!sceneState.raf) {
    const loop = (now) => {
      if (!sceneState.spec) {
        sceneState.raf = 0;
        return;
      }
      const t = (now - sceneState.startedAt) / 1000;
      const ctx = sceneCtx();
      ctx.clearRect(0, 0, SCENE_W, SCENE_H);
      try {
        SCENES[sceneState.spec.id](ctx, t, sceneState.spec);
      } catch (err) {
        console.warn("장면 그리기 실패", err);
      }
      sceneState.raf = requestAnimationFrame(loop);
    };
    sceneState.raf = requestAnimationFrame(loop);
  }
}

function setSceneCaption(caption) {
  const el = document.getElementById("scene-caption");
  if (el) el.textContent = caption;
}

function hideScene() {
  sceneState.spec = null;
  const panel = document.getElementById("scene-panel");
  if (panel) panel.hidden = true;
}
