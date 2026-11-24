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
//   junctionGaps[i]: 위에서 길 중간 횡단보도 자리만 뺀 것(교차로 자리만) — 보도·차가 꺾는 지점은 이걸 쓴다
//   whiteQuads : 정지선·횡단보도 줄무늬 사각형들 — 네 꼭짓점 [[x,z]×4]
//   crossings  : 횡단보도마다 { seg, which, junction, x, z(횡단보도 가운데), hx, hz(교차로 쪽 방향), rx, rz(들어오는
//                차로 쪽 = 오른쪽), half(도로 반폭), depth, stopX, stopZ(정지선 가운데), stopFromEnd, signal }
//   junctionEnds: 교차로에 닿아 횡단보도를 둘 수 있는 도로 끝 { seg, which, auto(폭 규칙상 기본으로 생기는지),
//                zone(그 끝에서 이 거리 안쪽이 교차로·횡단보도·정지선 자리) }
//   mids       : 길 중간 횡단보도(두 번째 인자 midList, map_data.js의 CROSSWALKS)를 도로에 붙인 결과 —
//                midList와 같은 순서로 { ok, seg, s(a 끝에서 잰 위치), x, z(도로 중심선 위 자리), dx, dz, half }
//                (근처에 도로가 없으면 ok: false)
//
// 도로마다 끝별로 덮어쓸 수 있다(맵 에디터의 "횡단보도·신호등" 설정):
//   crosswalkA / crosswalkB : true면 폭과 상관없이 만들고, false면 안 만든다(없으면 13m 이상일 때 자동)
//   signalA / signalB       : false면 그 횡단보도에 신호등을 세우지 않는다(없으면 신호등 있음)
// 길 중간(교차로가 아닌 곳)의 횡단보도는 midList로 받는다 — { x, z, signal? } 배열(맵 에디터의 "🚦 신호등 추가").
//   도로 폭 전체를 가로지르는 얼룩무늬 + 양쪽 방향 정지선을 긋고, crossings에는 다가오는 방향마다 하나씩
//   { mid: true, dirSign(+1: a→b로 달리는 차, -1: b→a), sStop(그 차가 서는 정지선, a 끝에서 잰 거리),
//     pedSignals(보행 신호등은 두 기록 중 첫 번째에만) } 를 넣는다(교차로 끝 기록의 which/stopFromEnd 대신).

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
const MID_SNAP_EXTRA = 3; // 길 중간 횡단보도: 도로 가장자리에서 이만큼 벗어난 점까지는 그 도로에 붙인다

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
      best = { dist: d, s: cum[i] + len * t, dx: vx / len, dz: vz / len, x, z, piece: i, t };
    }
  }
  return best;
}

function roadInfo(seg) {
  const pts = roadPolylineRaw(seg);
  const cum = cumulative(pts);
  return { seg, pts, cum, L: cum[cum.length - 1], half: seg.width / 2 };
}
// (x,z)에서 가장 가까운 도로 — 도로 가장자리에서 extra만큼 바깥까지 찾는다. 여러 도로가 겹치는 곳에서는
// "도로 안쪽으로 더 깊이 들어가 있는" 도로를 고른다. 없으면 null.
//   { seg(번호), s(a 끝에서 잰 위치), L(도로 길이), x, z(중심선 위 가장 가까운 점), dx, dz(a→b 방향), dist, half,
//     t(곡선 매개변수 0~1 — 곡선 도로를 둘로 자를 때 쓴다) }
function nearestOf(info, x, z, extra) {
  let best = null;
  info.forEach((r, i) => {
    if (r.L < 1e-3) return;
    const near = nearestOnPolyline(r.pts, r.cum, [x, z]);
    if (near.dist > r.half + extra) return;
    const score = near.dist - r.half;
    if (!best || score < best.score) {
      const t = r.pts.length > 2 ? (near.piece + near.t) / (r.pts.length - 1) : near.t;
      best = { seg: i, s: near.s, L: r.L, x: near.x, z: near.z, dx: near.dx, dz: near.dz, dist: near.dist, half: r.half, t, score };
    }
  });
  return best;
}
export function nearestRoadPoint(segs, x, z, extra = MID_SNAP_EXTRA) {
  return nearestOf(segs.map(roadInfo), x, z, extra);
}

export function computeRoadMarkings(segs, midList = []) {
  const info = segs.map(roadInfo);
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
  const crossings = [];
  const junctionEnds = [];
  const junctionKeyOf = (e) => {
    const gi = groups.findIndex((g) => g.includes(e));
    return gi >= 0 && groups[gi].length >= 3 ? `g${gi}` : `t${e.i}${e.which}`;
  };
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
    const autoCw = w >= CROSSWALK_MIN_WIDTH;
    const cwOverride = e.which === "a" ? r.seg.crosswalkA : r.seg.crosswalkB;
    let cw = cwOverride === true ? true : cwOverride === false ? false : autoCw;
    junctionEnds.push({ seg: e.i, which: e.which, auto: autoCw, zone: Math.min(maxGap, c + CROSSWALK_DEPTH + STOP_LINE_GAP + STOP_LINE_WIDTH) });
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
      const pc = pointAt(r.pts, r.cum, fromA(c + CROSSWALK_DEPTH / 2));
      const hx = e.which === "a" ? -pc.dx : pc.dx, hz = e.which === "a" ? -pc.dz : pc.dz;
      const ps = pointAt(r.pts, r.cum, fromA(stopAt));
      const sigOverride = e.which === "a" ? r.seg.signalA : r.seg.signalB;
      crossings.push({
        seg: e.i, which: e.which, junction: junctionKeyOf(e),
        x: pc.x, z: pc.z, hx, hz, rx: -hz, rz: hx, half: r.half, depth: CROSSWALK_DEPTH,
        stopX: ps.x, stopZ: ps.z, stopFromEnd: stopAt, signal: sigOverride !== false,
      });
    }
  }

  // ④ 길 중간 횡단보도(교차로가 아닌 곳 — 맵 에디터에서 찍은 CROSSWALKS)
  //    차선만 끊고 보도는 끊지 않는다 — 그래서 여기까지의(교차로만 반영한) 구간을 junctionGaps로 따로 남긴다
  const junctionGaps = gaps.map((list) => list.slice());
  const mids = [];
  const MID_HALF = CROSSWALK_DEPTH / 2 + STOP_LINE_GAP + STOP_LINE_WIDTH; // 횡단보도 가운데에서 바깥 정지선 끝까지
  // a→b 방향 기준: a 끝에서 잰 s0~s1 구간, 옆으로 o0~o1(+ = a→b로 달릴 때 오른쪽) 사각형
  const quadA = (r, s0, s1, o0, o1) => {
    const mid = (s0 + s1) / 2;
    const p = pointAt(r.pts, r.cum, mid);
    const nx = -p.dz, nz = p.dx;
    const P = (s, o) => [p.x + p.dx * (s - mid) + nx * o, p.z + p.dz * (s - mid) + nz * o];
    whiteQuads.push([P(s0, o0), P(s0, o1), P(s1, o1), P(s1, o0)]);
  };
  (midList || []).forEach((m, k) => {
    const hit = m && Number.isFinite(m.x) && Number.isFinite(m.z) ? nearestOf(info, m.x, m.z, MID_SNAP_EXTRA) : null;
    const r = hit ? info[hit.seg] : null;
    if (!hit || r.L < MID_HALF * 2 + 1) {
      mids.push({ ok: false, x: m ? m.x : 0, z: m ? m.z : 0 });
      return;
    }
    const s = Math.max(MID_HALF + 0.5, Math.min(r.L - MID_HALF - 0.5, hit.s));
    const pc = pointAt(r.pts, r.cum, s);
    mids.push({ ok: true, seg: hit.seg, s, x: pc.x, z: pc.z, dx: pc.dx, dz: pc.dz, half: r.half });
    gaps[hit.seg].push([s - MID_HALF, s + MID_HALF]);
    const usable = r.half - 0.5;
    for (let o = -usable; o + CROSSWALK_STRIPE <= usable + 1e-6; o += CROSSWALK_STRIPE + CROSSWALK_GAP) {
      quadA(r, s - CROSSWALK_DEPTH / 2, s + CROSSWALK_DEPTH / 2, o, o + CROSSWALK_STRIPE);
    }
    const signal = m.signal !== false;
    [1, -1].forEach((dirSign, j) => {
      // 이쪽에서 다가오는 차가 서는 정지선(진행 방향 오른쪽 절반) — sStop은 횡단보도 쪽 가장자리
      const sStop = s - dirSign * (CROSSWALK_DEPTH / 2 + STOP_LINE_GAP);
      const sFar = sStop - dirSign * STOP_LINE_WIDTH;
      if (dirSign > 0) quadA(r, sFar, sStop, 0.2, r.half - 0.3);
      else quadA(r, sStop, sFar, -(r.half - 0.3), -0.2);
      const ps = pointAt(r.pts, r.cum, sStop);
      const hx = pc.dx * dirSign, hz = pc.dz * dirSign;
      crossings.push({
        seg: hit.seg, which: null, mid: true, midIndex: k, dirSign, sStop, junction: `m${k}`,
        x: pc.x, z: pc.z, hx, hz, rx: -hz, rz: hx, half: r.half, depth: CROSSWALK_DEPTH,
        stopX: ps.x, stopZ: ps.z, stopFromEnd: null, signal, pedSignals: j === 0,
      });
    });
  });

  // 구간 정리(겹치는 것 합치기)
  const mergeAll = (all) => all.map((list) => {
    list.sort((p, q) => p[0] - q[0]);
    const merged = [];
    for (const [s0, s1] of list) {
      if (merged.length && s0 <= merged[merged.length - 1][1]) merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], s1);
      else merged.push([s0, s1]);
    }
    return merged;
  });
  return { gaps: mergeAll(gaps), junctionGaps: mergeAll(junctionGaps), whiteQuads, crossings, junctionEnds, mids };
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

// ════════════════════════════════════════════════════════════════════════════
// ── 도로 잇기(맵 에디터): 다른 길의 "중간"에 닿거나 가로지르는 길을 진짜 교차로로 만든다 ──
// 게임·노면표시는 도로 "끝점"이 서로 가까이(14 안) 모인 곳만 교차로로 친다. 그래서 길 끝이 다른 길 중간에
// 닿거나(T자) 두 길이 서로 가로지르면(X자) 이어진 길로 인식되지 않는다 — 여기서 그 자리에서 지나가는 길을
// 둘로 잘라(곡선이면 곡선 모양 그대로 둘로) 끝점들을 한 점에 모아 준다.
//   connectRoads(segs, focus, opts) : segs(ROAD_SEGMENTS와 같은 배열)를 그 자리에서 고친다. 잘린 길의 앞쪽 반은
//     원래 객체를 그대로 쓰고, 뒤쪽 반은 segs 끝에 새로 붙인다. focus(도로 번호 배열)를 주면 그 길들이 닿는 곳만,
//     없으면 지도 전체를 본다.
//     opts.at = [x, z]이면(맵 에디터 "🔗 교차로 추가"로 누른 자리) 그 점에서 opts.radius 안의 가장 가까운 한 곳만
//     잇고, 같은 교차로를 마저 완성하는 것(그 점 14 안)까지만 한다. opts.lenient면 사람이 직접 고른 자리라
//     닿았다고 보는 거리를 조금 넉넉하게 잡는다.
//     반환 { changed: Set(바뀐 도로 번호), added: [새로 생긴 도로 번호], joins(이은 곳 수), points(교차로가 된 점들) }
// ════════════════════════════════════════════════════════════════════════════
const CONNECT_EXTRA = 3; // 길 끝이 다른 길 가장자리에서 이만큼 못 미쳐도 닿은 걸로 본다(교차로 계산 ②와 같은 값)
const r1 = (v) => Math.round(v * 10) / 10;
function lerp2(p, q, t) { return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; }

// segs[k]를 곡선 매개변수 t(직선이면 길이 비율) 자리에서 둘로 — 자르는 점은 P(이미 반올림된 [x,z])로 맞춘다
function splitSegAt(segs, k, t, P) {
  const seg = segs[k];
  const second = { ...seg };
  const A = seg.a, B = seg.b;
  if (seg.curve) {
    const C = seg.curve;
    const q0 = lerp2(A, C, t), q1 = lerp2(C, B, t);
    const fix = (s, q) => {
      const mx = (s.a[0] + s.b[0]) / 2, mz = (s.a[1] + s.b[1]) / 2;
      if (Math.hypot(q[0] - mx, q[1] - mz) < 0.5) delete s.curve; // 거의 직선이면 곡선 표시를 지운다
      else s.curve = [r1(q[0]), r1(q[1])];
    };
    seg.b = [P[0], P[1]];
    second.a = [P[0], P[1]];
    second.b = [B[0], B[1]];
    fix(seg, q0);
    fix(second, q1);
  } else {
    seg.b = [P[0], P[1]];
    second.a = [P[0], P[1]];
    second.b = [B[0], B[1]];
    delete second.curve;
  }
  // 끝(A/B)별 횡단보도·신호등 설정은 원래 그 끝을 가진 쪽에만 남긴다(새로 생긴 가운데 끝은 자동)
  delete second.crosswalkA;
  delete second.signalA;
  delete seg.crosswalkB;
  delete seg.signalB;
  segs.push(second);
  return segs.length - 1;
}

// 두 폴리라인이 진짜로 가로지르는 점들 { x, z, si, ti, sk, tk, sin }
function polylineCrossings(ri, rk) {
  const out = [];
  const ni = ri.pts.length, nk = rk.pts.length;
  for (let a = 0; a < ni - 1; a++) {
    const p1 = ri.pts[a], p2 = ri.pts[a + 1];
    const ux = p2[0] - p1[0], uz = p2[1] - p1[1];
    const lu = Math.hypot(ux, uz);
    if (lu < 1e-6) continue;
    for (let b = 0; b < nk - 1; b++) {
      const q1 = rk.pts[b], q2 = rk.pts[b + 1];
      const vx = q2[0] - q1[0], vz = q2[1] - q1[1];
      const lv = Math.hypot(vx, vz);
      if (lv < 1e-6) continue;
      const d = ux * vz - uz * vx;
      if (Math.abs(d) < 1e-9) continue;
      const wx = q1[0] - p1[0], wz = q1[1] - p1[1];
      const u = (wx * vz - wz * vx) / d;
      const v = (wx * uz - wz * ux) / d;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      out.push({
        x: p1[0] + ux * u, z: p1[1] + uz * u,
        si: ri.cum[a] + lu * u, ti: (a + u) / (ni - 1),
        sk: rk.cum[b] + lv * v, tk: (b + v) / (nk - 1),
        sin: Math.abs(d) / (lu * lv),
      });
    }
  }
  return out;
}

export function connectRoads(segs, focus, opts = {}) {
  const changed = new Set();
  const added = [];
  const points = [];
  const work = new Set(focus ? focus.filter((i) => i >= 0 && i < segs.length) : segs.map((_, i) => i));
  const all = !focus;
  const lenient = !!opts.lenient;
  let joins = 0;
  // (x,z)와 14 안에 있는 모든 도로 끝 — 길이가 1이면 아무 데도 안 이어진 "빈 끝"
  const groupAt = (x, z) => {
    const g = [];
    segs.forEach((sg, j) => ["a", "b"].forEach((w) => { if (Math.hypot(sg[w][0] - x, sg[w][1] - z) < JOIN_THRESH) g.push([j, w]); }));
    return g;
  };
  const moveEnds = (group, P) => group.forEach(([j, w]) => { segs[j][w] = [P[0], P[1]]; changed.add(j); });
  const interior = (s, L) => s >= JOIN_THRESH && s <= L - JOIN_THRESH;
  const tOf = (r, near) => (r.pts.length > 2 ? (near.piece + near.t) / (r.pts.length - 1) : near.t);
  const box = (r, pad) => {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    r.pts.forEach(([x, z]) => { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); });
    return [x0 - pad, z0 - pad, x1 + pad, z1 + pad];
  };
  const overlap = (A, B) => A[0] <= B[2] && B[0] <= A[2] && A[1] <= B[3] && B[1] <= A[3];
  const inBox = (b, p) => p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3];
  const endDir = (r, which) => pointAt(r.pts, r.cum, which === "a" ? 0 : r.L);
  const split = (k, t, P, from) => {
    const n = splitSegAt(segs, k, t, P);
    changed.add(k);
    added.push(n);
    if (work.has(k) || (from != null && work.has(from))) work.add(n);
    return n;
  };
  const freeReach = (rk) => rk.half + CONNECT_EXTRA + (lenient ? 3 : 0);
  const nodeReach = (rk) => (lenient ? Math.max(CONNECT_EXTRA, rk.half * 0.5) : CONNECT_EXTRA);

  // 지금 모양에서 이을 수 있는 곳 하나를 고른다 — target이 없으면 처음 찾은 곳, 있으면 target에서 limit 안의
  // 가장 가까운 곳. 고른 곳은 { P(교차로가 될 점), apply(실제로 잇기) } — 고른 바로 다음에 apply해야 한다.
  function scan(target, limit) {
    const info = segs.map(roadInfo);
    // 누른 자리에서 먼 길은 아예 보지 않는다(빠르게)
    const reach = info.map((r) => !target || inBox(box(r, r.half + CONNECT_EXTRA + 6 + limit), target));
    let best = null, bestD = Infinity;
    const offer = (P, apply) => {
      if (!target) { best = { P, apply }; return true; }
      const d = Math.hypot(P[0] - target[0], P[1] - target[1]);
      if (d <= limit && d < bestD) { bestD = d; best = { P, apply }; }
      return false;
    };
    const boxes = info.map((r) => box(r, freeReach(r)));
    // ① 길 끝이 다른 길 중간에 닿음(T자)
    //    · 아무 데도 안 이어진 "빈 끝"이면: 그 길 가장자리 근처(3m)까지 닿은 것도 이어 준다
    //    · 이미 다른 길과 모여 있는 끝(교차로 점)이면: 그 점이 지나가는 길 한가운데(3m 안)에 있을 때만
    for (let i = 0; i < segs.length; i++) {
      const ri = info[i];
      if (ri.L < 1e-3 || !reach[i]) continue;
      for (const which of ["a", "b"]) {
        const E = segs[i][which];
        const group = groupAt(E[0], E[1]);
        const free = group.length === 1;
        for (let k = 0; k < segs.length; k++) {
          if (k === i || !reach[k] || (!all && !work.has(i) && !work.has(k))) continue;
          if (!inBox(boxes[k], E)) continue;
          const rk = info[k];
          if (rk.L < 1e-3 || group.some(([j]) => j === k)) continue; // 이미 그 길 끝과 같은 교차로
          const near = nearestOnPolyline(rk.pts, rk.cum, E);
          if (near.dist > (free ? freeReach(rk) : nodeReach(rk))) continue;
          // 지나가는 길과 거의 나란히 겹쳐 그린 길이면 건드리지 않는다
          const crossesAtAngle = group.some(([j, w]) => {
            const d = endDir(info[j], w);
            return Math.abs(d.dx * near.dz - d.dz * near.dx) >= MIN_SIN;
          });
          if (!crossesAtAngle) continue;
          if (interior(near.s, rk.L)) {
            const P = [r1(near.x), r1(near.z)];
            const t = tOf(rk, near);
            if (offer(P, () => { moveEnds(group, P); split(k, t, P, i); })) return best;
          } else if (free) {
            // 지나가는 길의 끝 가까이에 닿았으면 그 끝으로 모은다(ㄱ자·ㅏ자)
            const kw = near.s < rk.L / 2 ? "a" : "b";
            const P = [segs[k][kw][0], segs[k][kw][1]];
            if (offer(P, () => moveEnds(group, P))) return best;
          }
        }
      }
    }
    // ② 두 길이 서로 가로지름(X자) — 둘 다 중간이면 둘 다 자르고, 한쪽이 "빈 끝" 근처에서 살짝 넘어간
    //    거면 그 끝을 교차점으로 당겨서 T자로 잇는다
    const cboxes = info.map((r) => box(r, 0));
    for (let i = 0; i < segs.length; i++) {
      if (!reach[i]) continue;
      for (let k = i + 1; k < segs.length; k++) {
        if (!reach[k] || (!all && !work.has(i) && !work.has(k))) continue;
        if (!overlap(cboxes[i], cboxes[k])) continue;
        const ri = info[i], rk = info[k];
        if (ri.L < 1e-3 || rk.L < 1e-3) continue;
        for (const c of polylineCrossings(ri, rk)) {
          if (c.sin < MIN_SIN) continue;
          const inI = interior(c.si, ri.L), inK = interior(c.sk, rk.L);
          const P = [r1(c.x), r1(c.z)];
          const endI = c.si < ri.L / 2 ? "a" : "b", endK = c.sk < rk.L / 2 ? "a" : "b";
          if (inI && inK) {
            if (offer(P, () => { split(i, c.ti, P); split(k, c.tk, P); })) return best;
            continue;
          }
          const gI = inI ? null : groupAt(segs[i][endI][0], segs[i][endI][1]);
          const gK = inK ? null : groupAt(segs[k][endK][0], segs[k][endK][1]);
          if (gI && gK) {
            // 둘 다 끝 근처: 둘 다 빈 끝일 때만(ㄱ자 모서리를 살짝 넘겨 그린 것) 교차점에서 만나게
            if (gI.length !== 1 || gK.length !== 1) continue;
            if (offer(P, () => moveEnds([...gI, ...gK], P))) return best;
            continue;
          }
          const [g, o, ot] = gI ? [gI, k, c.tk] : [gK, i, c.ti];
          if (g.length !== 1) continue; // 이미 교차로에 모여 있는 끝(넓은 길끼리 겹친 자리 등)은 그대로
          if (offer(P, () => { moveEnds(g, P); split(o, ot, P, g[0][0]); })) return best;
        }
      }
    }
    return best;
  }

  // 한 번에 한 곳씩 잇고 처음부터 다시 본다(잘린 길이 또 다른 길과 만날 수 있어서). 누른 자리(opts.at)가 있으면
  // 첫 번째로 이은 점을 기준으로 그 교차로를 마저 완성하는 것까지만.
  let anchor = null;
  for (let guard = 0; guard < 400; guard++) {
    const target = anchor || opts.at || null;
    const limit = anchor ? JOIN_THRESH : opts.radius || JOIN_THRESH * 2;
    const c = scan(target, limit);
    if (!c) break;
    c.apply();
    joins++;
    points.push(c.P);
    if (opts.at && !anchor) anchor = c.P;
  }
  return { changed, added, joins, points };
}
