// ── 울타리 종류 목록 (게임 neighborhood3d.js와 맵 에디터 map_editor.html이 같이 쓴다) ──
// map_data.js의 FENCES 한 줄 = 울타리 한 토막: { a: [x, z], b: [x, z], type: "parkhills_glass", base: false? }
// (a·b는 raw 좌표 m, 도로처럼 에디터의 "🧱 울타리 추가"로 그린다. base: false면 아래 돌 기단 없이 바닥부터)
//
// 새 울타리 종류를 추가하려면: 아래 FENCE_TYPES에 항목 하나를 더 넣으면 된다 — 칸(기둥 사이) 간격·높이·색과
// "parts"(칸마다 반복되는 부품 상자 목록)만 적으면 게임이 알아서 길이에 맞춰 칸을 나눠 세운다.
//   parts 항목: { name, mat, at: "bay" | "post", y0, y1, w?, d?, z?, inset? }
//     at "bay"  = 기둥 사이 칸마다 하나(칸 길이만큼 길게, inset만큼 양 끝을 줄임)
//     at "post" = 기둥(칸 경계)마다 하나(w = 가로 폭)
//     y0~y1 = 바닥에서의 높이(m), d = 두께(m), z = 울타리 중심선에서 앞뒤로 비킨 거리(m)
//     onBase: true 부품은 base: false인 토막에서는 빠지고, 나머지 부품은 기단 높이(baseH)만큼 내려온다
//   mats: 재질 이름 → { color, opacity?, metalness?, roughness? } (opacity가 있으면 반투명 유리)
export const FENCE_TYPES = {
  // 금호파크힐스 단지 바깥 투명유리 울타리: 화강석 기단(1.05m) 위에 검은 기둥·가로대와 투명 유리판, 전체 3.7m
  parkhills_glass: {
    name: "금파힐 투명유리 울타리",
    editorColor: "#4fc3f7",
    spacing: 2.0, // 기둥 간격(m) — 길이에 맞춰 이 간격에 가장 가깝게 칸을 나눈다
    height: 3.7,
    baseH: 1.05,
    depth: 0.42,
    mats: {
      granite: { color: 0x5f646b, roughness: 0.85 },
      pillar: { color: 0xd9d8d2, roughness: 0.8 },
      metal: { color: 0x15171a, roughness: 0.45, metalness: 0.6 },
      glass: { color: 0xbfe3f2, opacity: 0.3, roughness: 0.1, metalness: 0.1 },
    },
    parts: [
      { name: "기단", mat: "granite", at: "bay", onBase: true, y0: 0, y1: 1.0, d: 0.42, inset: 0.15 },
      { name: "기단 갓돌", mat: "pillar", at: "bay", onBase: true, y0: 1.0, y1: 1.05, d: 0.46, inset: 0 },
      { name: "기단 기둥", mat: "pillar", at: "post", onBase: true, y0: 0, y1: 1.08, w: 0.3, d: 0.46 },
      { name: "기둥", mat: "metal", at: "post", y0: 1.05, y1: 3.7, w: 0.08, d: 0.08 },
      { name: "아래 가로대", mat: "metal", at: "bay", y0: 1.1, y1: 1.16, d: 0.06 },
      { name: "중간 가로대1", mat: "metal", at: "bay", y0: 1.95, y1: 2.0, d: 0.05 },
      { name: "중간 가로대2", mat: "metal", at: "bay", y0: 2.8, y1: 2.85, d: 0.05 },
      { name: "위 가로대", mat: "metal", at: "bay", y0: 3.62, y1: 3.7, d: 0.07 },
      { name: "유리", mat: "glass", at: "bay", y0: 1.16, y1: 3.62, d: 0.012, inset: 0.04 },
    ],
  },
};
export const DEFAULT_FENCE_TYPE = "parkhills_glass";
