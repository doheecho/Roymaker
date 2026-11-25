#!/usr/bin/env node
// models/GameMap.glb(실제 지형, 위성사진+높낮이)를 위에서 내려다본 이미지로 구워서
// map_editor.html의 배경으로 쓸 수 있게 만드는 스크립트.
//
// 사용법(저장소 폴더에서):
//   node tools/make_terrain_topdown.cjs
//
// 필요한 것: make_skyview.cjs와 같음 — Playwright + three.js. 처음 한 번만:
//   npm install playwright three@0.160.0
//   npx playwright install chromium
//
// 결과물:
//   img/gamemap_topdown.webp   — 위에서 내려다본 그림(위쪽 = -z, 오른쪽 = +x, map_editor/게임과 같은 방향)
//   img/gamemap_topdown.json   — 이 그림이 raw 좌표계에서 어느 범위(minX·minZ·width·depth)를 덮는지.
//                                 GameMap.glb 자체 단위가 이미 PLACES/ROAD_SEGMENTS의 raw 단위와
//                                 그대로 맞아서(2026-11-25 확인, WORLD_SCALE만 곱하면 게임 장면에
//                                 맞음 — raw끼리는 추가 보정 없이 바로 겹침) 별도 앵커 보정이 필요 없다.
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.resolve(__dirname, "..");
const SRC_FILE = path.join(ROOT, "models", "GameMap.glb");
const OUT_IMG = path.join(ROOT, "img", "gamemap_topdown.webp");
const OUT_JSON = path.join(ROOT, "img", "gamemap_topdown.json");
const MAX_PX = 2400; // 그림의 긴 변 최대 픽셀 — map_editor에서 확대해도 흐려 보이지 않을 만큼

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (err) {
  console.error("Playwright가 없어요. 저장소 폴더에서 먼저 아래 두 줄을 실행하세요:\n  npm install playwright three@0.160.0\n  npx playwright install chromium");
  process.exit(1);
}

let THREE_DIR = null;
try {
  THREE_DIR = path.dirname(path.dirname(require.resolve("three", { paths: [ROOT, process.cwd()] })));
} catch (err) {
  THREE_DIR = null;
}
const THREE_BASE = THREE_DIR ? "/__three" : "https://cdn.jsdelivr.net/npm/three@0.160.0";

const RENDER_PAGE = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"${THREE_BASE}/build/three.module.js","three/addons/":"${THREE_BASE}/examples/jsm/"}}</script>
</head><body style="margin:0;background:transparent">
<script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 3));
window.renderTerrain = async (url, maxPx) => {
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  scene.add(root);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const w = box.max.x - box.min.x, d = box.max.z - box.min.z;
  const ppu = Math.min(maxPx / Math.max(w, d), 12);
  const W = Math.max(1, Math.round(w * ppu)), H = Math.max(1, Math.round(d * ppu));
  renderer.setSize(W, H, false);
  const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
  const cam = new THREE.OrthographicCamera(-w / 2, w / 2, d / 2, -d / 2, 0.1, (box.max.y - box.min.y) + 1000);
  cam.position.set(cx, box.max.y + 500, cz);
  cam.up.set(0, 0, -1); // 위쪽 = -z, 오른쪽 = +x (map_editor·게임과 같은 방향)
  cam.lookAt(cx, box.min.y, cz);
  renderer.render(scene, cam);
  const dataUrl = renderer.domElement.toDataURL("image/webp", 0.9);
  return { dataUrl, minX: box.min.x, minZ: box.min.z, width: w, depth: d, px: [W, H] };
};
window.rendererReady = true;
</script></body></html>`;

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/__render.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(RENDER_PAGE);
    }
    const fromThree = THREE_DIR && urlPath.startsWith("/__three/");
    const baseDir = fromThree ? THREE_DIR : ROOT;
    const file = path.join(baseDir, fromThree ? urlPath.slice("/__three".length) : urlPath);
    if (!file.startsWith(baseDir) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    const type = file.endsWith(".js") ? "text/javascript" : file.endsWith(".glb") ? "model/gltf-binary" : "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function main() {
  if (!fs.existsSync(SRC_FILE)) {
    console.error(`${SRC_FILE} 가 없어요.`);
    process.exit(1);
  }
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage();
  page.on("pageerror", (err) => console.error("페이지 오류:", err.message));
  await page.goto(`${base}/__render.html`);
  await page.waitForFunction(() => window.rendererReady === true, null, { timeout: 20000 });
  const r = await page.evaluate(([u, mx]) => window.renderTerrain(u, mx), [`${base}/models/GameMap.glb`, MAX_PX]);
  fs.writeFileSync(OUT_IMG, Buffer.from(r.dataUrl.split(",")[1], "base64"));
  fs.writeFileSync(OUT_JSON, JSON.stringify({ minX: r.minX, minZ: r.minZ, width: r.width, depth: r.depth }, null, 1) + "\n");
  console.log(`완료: ${path.relative(ROOT, OUT_IMG)} (${r.px[0]}×${r.px[1]}px), ${path.relative(ROOT, OUT_JSON)}`);
  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
