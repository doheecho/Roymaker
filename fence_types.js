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
//     matAlt: ["a", "b"] = 칸마다 번갈아 쓰는 재질(예: 파랑·초록 흡음판), w(at "bay") = 칸 가운데에 그 폭만큼만
//   mats: 재질 이름 → { color, opacity?, metalness?, roughness?, tex? } (opacity가 있으면 반투명 유리)
//     tex: "brick"(갈색 쪼갠 벽돌) | "stone"(문양 돌 옹벽) | "perforated"(타공 흡음판) — 칸 하나 면(2m×높이)에 맞춘 무늬
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
  // 행당대림 단지 울타리: 갈색 벽돌 옹벽(1.65m + 두겁석 0.1m) 위에 실버 H형 기둥, 아래는 파랑·초록 번갈아 흡음판,
  // 위는 반투명 서리유리 — 전체 3.85m
  daelim_brick: {
    name: "행당대림 갈색벽돌·반투명유리 울타리",
    editorColor: "#e07b4f",
    spacing: 2.0,
    height: 3.85,
    baseH: 1.75,
    depth: 0.48,
    mats: {
      brick: { color: 0xffffff, tex: "brick", roughness: 0.88 },
      coping: { color: 0x9c735b, roughness: 0.8 },
      post: { color: 0x9aa3ab, roughness: 0.4, metalness: 0.6 },
      rail: { color: 0xaeb6be, roughness: 0.35, metalness: 0.6 },
      gasket: { color: 0x343a40, roughness: 0.8 },
      blue: { color: 0x5a8bc2, tex: "perforated", roughness: 0.55, metalness: 0.3 },
      green: { color: 0x86b45b, tex: "perforated", roughness: 0.55, metalness: 0.3 },
      glass: { color: 0xeaf2f6, opacity: 0.58, roughness: 0.3 },
    },
    parts: [
      { name: "벽돌 옹벽", mat: "brick", at: "bay", onBase: true, y0: 0, y1: 1.65, d: 0.44 },
      { name: "두겁석", mat: "coping", at: "bay", onBase: true, y0: 1.65, y1: 1.75, d: 0.48 },
      { name: "기둥 받침판", mat: "post", at: "post", y0: 1.75, y1: 1.775, w: 0.22, d: 0.22 },
      { name: "H형 기둥", mat: "post", at: "post", y0: 1.775, y1: 3.85, w: 0.1, d: 0.12 },
      { name: "기둥 캡", mat: "post", at: "post", y0: 3.85, y1: 3.868, w: 0.116, d: 0.136 },
      { name: "아래 레일", mat: "rail", at: "bay", y0: 1.774, y1: 1.816, d: 0.068 },
      { name: "흡음판", matAlt: ["blue", "green"], at: "bay", y0: 1.816, y1: 2.448, d: 0.03, inset: 0.05 },
      { name: "중간 레일", mat: "rail", at: "bay", y0: 2.448, y1: 2.492, d: 0.064 },
      { name: "서리유리", mat: "glass", at: "bay", y0: 2.492, y1: 3.808, d: 0.02, inset: 0.06 },
      { name: "유리 가운데 살", mat: "gasket", at: "bay", y0: 2.492, y1: 3.808, w: 0.03, d: 0.03 },
      { name: "위 레일", mat: "rail", at: "bay", y0: 3.808, y1: 3.854, d: 0.072 },
    ],
  },
  // 행당한진 단지 울타리: 문양 콘크리트 옹벽(1.9m + 두겁석 0.1m, 배수구) 위에 짙은 회색 기둥, 아래 초록 타공 흡음판,
  // 위는 미색 반투명판 — 전체 3.7m
  hanjin_stone: {
    name: "행당한진 문양옹벽·초록 방음 울타리",
    editorColor: "#58b368",
    spacing: 2.0,
    height: 3.7,
    baseH: 2.0,
    depth: 0.44,
    mats: {
      stone: { color: 0xffffff, tex: "stone", roughness: 0.9 },
      coping: { color: 0xa8a498, roughness: 0.82 },
      weep: { color: 0x1e2024, roughness: 0.9 },
      post: { color: 0x383d42, roughness: 0.45, metalness: 0.5 },
      rail: { color: 0x5c646b, roughness: 0.4, metalness: 0.5 },
      green: { color: 0x448655, tex: "perforated", roughness: 0.55, metalness: 0.3 },
      panel: { color: 0xe6e0c9, opacity: 0.52, roughness: 0.5 },
    },
    parts: [
      { name: "문양 옹벽", mat: "stone", at: "bay", onBase: true, y0: 0, y1: 1.9, d: 0.4 },
      { name: "두겁석", mat: "coping", at: "bay", onBase: true, y0: 1.9, y1: 2.0, d: 0.44 },
      { name: "배수구(앞)", mat: "weep", at: "bay", onBase: true, y0: 0.3, y1: 0.38, w: 0.08, d: 0.012, z: 0.2 },
      { name: "배수구(뒤)", mat: "weep", at: "bay", onBase: true, y0: 0.3, y1: 0.38, w: 0.08, d: 0.012, z: -0.2 },
      { name: "H형 기둥", mat: "post", at: "post", y0: 2.0, y1: 3.7, w: 0.1, d: 0.12 },
      { name: "아래 레일", mat: "rail", at: "bay", y0: 2.021, y1: 2.063, d: 0.066 },
      { name: "초록 흡음판", mat: "green", at: "bay", y0: 2.063, y1: 2.718, d: 0.03, inset: 0.05 },
      { name: "중간 레일", mat: "rail", at: "bay", y0: 2.718, y1: 2.762, d: 0.064 },
      { name: "반투명판", mat: "panel", at: "bay", y0: 2.762, y1: 3.656, d: 0.02, inset: 0.06 },
      { name: "위 레일", mat: "rail", at: "bay", y0: 3.656, y1: 3.7, d: 0.07 },
    ],
  },
};
export const DEFAULT_FENCE_TYPE = "parkhills_glass";
