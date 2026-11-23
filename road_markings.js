// ── 교차로 노면표시 계산(게임 neighborhood3d.js와 map_editor.html이 같이 쓴다) ──
// 실제 도로처럼:
//   · 교차로(도로 3개 이상이 모이는 곳, 또는 도로 끝이 다른 도로 중간에 닿는 T자 길) 안쪽에는
//     중앙선·차선을 긋지 않는다.
//   · 교차로로 "들어오는" 방향 차로(우측통행이라 진행 방향의 오른쪽 절반)에 흰 정지선을 긋는다.
//   · 13m 이상 도로는 정지선과 교차로 사이에 횡단보도(얼룩무늬)를 둔다.
//   · 8m 미만 골목길이 붙는 건 교차로로 치지 않는다(큰길 차선이 골목 입구마다 끊기면 이상해서).
// 모든 값은 raw 단위(= map_data.js 좌표, 대략 m). 입력은 ROAD_SEGMENTS와 같은 {a, b, width, curve?} 배열.
//
// 반환값:
//   gaps[i]    : i번째 도로에서 노면표시(중앙선·차선)를 긋지 않을 구간들 — a 끝에서 잰 거리 [s0, s1]
//   whiteQuads : 정지선·횡단보도 줄무늬 사각형들 — 네 꼭짓점 [[x,z]×4]

export const ROAD_CURVE_STEPS = 20;
const JOIN_THRESH = 14; // 같은 교차로로 보는 끝점 사이 거리(neighborhood3d.js의 교차로 메움판과 같은 값)
const MARKED_MIN_WIDTH = 8; // 이보다 좁으면(골목길) 차선이 없고, 교차로를 만드는 길로도 안 친다
const CROSSWALK_MIN_WIDTH = 13; // 이 폭부터 횡단보도
const CROSSWALK_DEPTH = 4; // 횡단보도 폭(도로 진행 방향으로)
const CROSSWALK_STRIPE = 0.5; // 줄무늬 하나 너비
const CROSSWALK_GAP = 0.5; // 줄무늬 사이
const STOP_LINE_GAP = 1; // 횡단보도와 정지선 사이
const STOP_LINE_WIDTH = 0.45;
const CLEAR_MARGIN = 1; // 교차로 모서리에서 조금 더 물러나서 시작
const MIN_SIN = 0.26; // 이보다 각도 차가 작으면(약 15° 이내) 같은 방향으로 이어지는 길로 본다

function quadPoint(a, c, b, t) {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}
export function roadPolylineRaw(seg) {
  if (!seg.curve) return [seg.a, seg.b];
  const pts = [];
  for (let i = 0; i <= ROAD_CURVE_STEPS; i++) pts.push(quadPoint(seg.a, seg.curve, seg.b, i / ROAD_CURVE_STEPS));
  return pts;
}
function cumulative(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return cum;
}
// a 끝에서 s만큼 간 지점과 그 자리의 진행방향(단위벡터)
function pointAt(pts, cum, s) {
  const L = cum[cum.length - 1];
  s = Math.max(0, Math.min(L, s));
  for (let i = 0; i < pts.length - 1; i++) {
    if (s <= cum[i + 1] || i === pts.length - 2) {
      const len = cum[i + 1] - cum[i] || 1e-6;
      const t = (s - cum[i]) / len;
      const dx = (pts[i + 1][0] - pts[i][0]) / len, dz = (pts[i + 1][1] - pts[i][1]) / len;
      return { x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, z: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, dx, dz };
    }
  }
  return { x: pts[0][0], z: pts[0][1], dx: 1, dz: 0 };
}
// 점 p에서 폴리라인까지 가장 가까운 지점(거리, a 끝에서 잰 위치 s, 그 자리 방향)
function nearestOnPolyline(pts, cum, p) {
  let best = { dist: Infinity, s: 0, dx: 1, dz: 0, x: 0, z: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
    const vx = x2 - x1, vz = z2 - z1;
    const len2 = vx * vx + vz * vz || 1e-9;
    const t = Math.max(0, Math.min(1, ((p[0] - x1) * vx + (p[1] - z1) * vz) / len2));
    const x = x1 + vx * t, z = z1 + vz * t;
    const d = Math.hypot(p[0] - x, p[1] - z);
    if (d < best.dist) {
      const len = Math.sqrt(len2);
      best = { dist: d, s: cum[i] + len * t, dx: vx / len, dz: vz / len, x, z };
    }
  }
  return best;
}

export function computeRoadMarkings(segs) {
  const info = segs.map((seg) => {
    const pts = roadPolylineRaw(seg);
    const cum = cumulative(pts);
    return { seg, pts, cum, L: cum[cum.length - 1], half: seg.width / 2 };
  });
  const gaps = segs.map(() => []);
  const whiteQuads = [];

  // 각 도로 끝: 위치, 도로 안쪽(교차로에서 멀어지는) 방향
  const ends = [];
  info.forEach((r, i) => {
    if (r.L < 1e-3) return;
    const n = r.pts.length;
    const da = pointAt(r.pts, r.cum, 0);
    const db = pointAt(r.pts, r.cum, r.L);
    ends.push({ i, which: "a", x: r.pts[0][0], z: r.pts[0][1], dx: da.dx, dz: da.dz });
    ends.push({ i, which: "b", x: r.pts[n - 1][0], z: r.pts[n - 1][1], dx: -db.dx, dz: -db.dz });
  });

  // 끝점들을 교차로 단위로 묶는다
  const used = new Array(ends.length).fill(false);
  const groups = [];
  for (let k = 0; k < ends.length; k++) {
    if (used[k]) continue;
    const g = [ends[k]];
    used[k] = true;
    for (let m = k + 1; m < ends.length; m++) {
      if (!used[m] && Math.hypot(ends[k].x - ends[m].x, ends[k].z - ends[m].z) < JOIN_THRESH) {
        g.push(ends[m]);
        used[m] = true;
      }
    }
    groups.push(g);
  }

  // arm i가 상대 길(방향 d, 반폭 h)의 가장자리를 벗어나는 데 필요한 거리
  function clearAgainst(e, half, dx, dz, h) {
    const cos = e.dx * dx + e.dz * dz;
    const sin = Math.abs(e.dx * dz - e.dz * dx);
    if (sin < MIN_SIN) return null;
    return Math.max(0, (h + half * cos) / sin);
  }
  const endClear = new Map(); // "i:a" → { clear, crossing }

  function noteEnd(e, clear, crossing) {
    const key = `${e.i}:${e.which}`;
    const prev = endClear.get(key);
    if (!prev || clear > prev.clear) endClear.set(key, { e, clear, crossing: crossing || (prev && prev.crossing) });
    else if (crossing) prev.crossing = true;
  }

  // ① 끝점이 3개 이상 모이는 교차로(삼거리·사거리…)
  for (const g of groups) {
    if (g.length < 3) continue;
    const cx = g.reduce((s, e) => s + e.x, 0) / g.length;
    const cz = g.reduce((s, e) => s + e.z, 0) / g.length;
    for (const e of g) {
      const ri = info[e.i];
      let best = 0, crossing = false;
      for (const o of g) {
        if (o === e || info[o.i].seg.width < MARKED_MIN_WIDTH) continue;
        const c = clearAgainst(e, ri.half, o.dx, o.dz, info[o.i].half);
        if (c == null) continue;
        crossing = true;
        best = Math.max(best, c);
      }
      if (!crossing) continue;
      const proj = (e.x - cx) * e.dx + (e.z - cz) * e.dz; // 끝점이 교차로 중심보다 이미 안쪽에 있으면 그만큼 덜 물러난다
      noteEnd(e, Math.max(0, best - proj) + CLEAR_MARGIN, true);
    }
  }

  // ② 도로 끝이 다른 도로의 "중간"에 닿는 T자 길
  for (const e of ends) {
    const ri = info[e.i];
    const group = groups.find((g) => g.includes(e));
    for (let k = 0; k < info.length; k++) {
      if (k === e.i || group.some((o) => o.i === k)) continue;
      const rk = info[k];
      if (rk.L < 1e-3) continue;
      const near = nearestOnPolyline(rk.pts, rk.cum, [e.x, e.z]);
      if (near.dist > rk.half + 3) continue;
      if (near.s < JOIN_THRESH || near.s > rk.L - JOIN_THRESH) continue; // 끝 근처면 ①에서 다룬다
      const sin = Math.abs(e.dx * near.dz - e.dz * near.dx);
      if (sin < MIN_SIN) continue;
      const cosAbs = Math.abs(e.dx * near.dx + e.dz * near.dz);
      if (rk.seg.width >= MARKED_MIN_WIDTH) {
        const proj = (e.x - near.x) * e.dx + (e.z - near.z) * e.dz;
        const c = Math.max(0, (rk.half + ri.half * cosAbs) / sin - proj) + CLEAR_MARGIN;
        noteEnd(e, c, true);
      }
      // 큰 길(13m 이상)이 와서 붙으면 지나가는 길의 차선도 그 자리에서 끊는다(신호 교차로처럼)
      if (ri.seg.width >= CROSSWALK_MIN_WIDTH) {
        const g = (ri.half + rk.half * cosAbs) / sin + CLEAR_MARGIN;
        gaps[k].push([near.s - g, near.s + g]);
      }
    }
  }

  // ③ 끝마다: 교차로 안쪽은 비우고, 정지선·횡단보도
  for (const { e, clear, crossing } of endClear.values()) {
    const r = info[e.i];
    const w = r.seg.width;
    const fromA = (s) => (e.which === "a" ? s : r.L - s); // "그 끝에서 잰 거리" → "a 끝에서 잰 거리"
    const maxGap = r.L * 0.45;
    let c = Math.min(clear, maxGap);
    if (!crossing || w < MARKED_MIN_WIDTH) {
      gaps[e.i].push(e.which === "a" ? [-1, fromA(c)] : [fromA(c), r.L + 1]);
      continue;
    }
    let cw = w >= CROSSWALK_MIN_WIDTH;
    let stopAt = cw ? c + CROSSWALK_DEPTH + STOP_LINE_GAP : c + 0.3;
    if (stopAt + STOP_LINE_WIDTH > maxGap) { cw = false; stopAt = c + 0.3; }
    const drawStop = stopAt + STOP_LINE_WIDTH <= maxGap;
    const gapEnd = drawStop ? stopAt + STOP_LINE_WIDTH : c;
    gaps[e.i].push(e.which === "a" ? [-1, fromA(gapEnd)] : [fromA(gapEnd), r.L + 1]);

    // 그 끝에서 s0~s1 구간, 옆으로 o0~o1(오른쪽 = 교차로로 들어가는 차로) 사각형
    const quad = (s0, s1, o0, o1) => {
      const p = pointAt(r.pts, r.cum, fromA((s0 + s1) / 2));
      // 교차로 쪽으로 가는 진행 방향 h와 그 오른쪽 rv(우측통행 — 들어오는 차로)
      const hx = e.which === "a" ? -p.dx : p.dx, hz = e.which === "a" ? -p.dz : p.dz;
      const rx = -hz, rz = hx;
      const mid = (s0 + s1) / 2;
      const P = (s, o) => {
        const along = fromA(s) - fromA(mid); // a 기준 거리 차
        return [p.x + p.dx * along + rx * o, p.z + p.dz * along + rz * o];
      };
      whiteQuads.push([P(s0, o0), P(s0, o1), P(s1, o1), P(s1, o0)]);
    };
    if (drawStop) quad(stopAt, stopAt + STOP_LINE_WIDTH, 0.2, r.half - 0.3);
    if (cw) {
      const usable = r.half - 0.5;
      for (let o = -usable; o + CROSSWALK_STRIPE <= usable + 1e-6; o += CROSSWALK_STRIPE + CROSSWALK_GAP) {
        quad(c, c + CROSSWALK_DEPTH, o, o + CROSSWALK_STRIPE);
      }
    }
  }

  // 구간 정리(겹치는 것 합치기)
  gaps.forEach((list, i) => {
    list.sort((p, q) => p[0] - q[0]);
    const merged = [];
    for (const [s0, s1] of list) {
      if (merged.length && s0 <= merged[merged.length - 1][1]) merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], s1);
      else merged.push([s0, s1]);
    }
    gaps[i] = merged;
  });
  return { gaps, whiteQuads };
}

// 길이 L인 도로에서 gaps를 뺀 "노면표시를 그을 구간"들
export function markedRanges(L, gaps) {
  const out = [];
  let s = 0;
  for (const [g0, g1] of gaps) {
    if (g0 > s) out.push([s, Math.min(g0, L)]);
    s = Math.max(s, g1);
    if (s >= L) break;
  }
  if (s < L) out.push([s, L]);
  return out.filter(([a, b]) => b - a > 0.5);
}

// 폴리라인에서 a 끝 기준 s0~s1 부분만 잘라낸다
export function slicePolyline(pts, s0, s1) {
  const cum = cumulative(pts);
  const out = [];
  const p0 = pointAt(pts, cum, s0);
  out.push([p0.x, p0.z]);
  for (let i = 1; i < pts.length - 1; i++) if (cum[i] > s0 && cum[i] < s1) out.push(pts[i]);
  const p1 = pointAt(pts, cum, s1);
  out.push([p1.x, p1.z]);
  return out;
}
