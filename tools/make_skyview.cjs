#!/usr/bin/env node
// models/ 폴더의 .glb를 위에서 내려다본 "스카이뷰" 이미지(img/skyview/*.webp)로 바꾸는 스크립트.
// map_editor.html이 이 이미지들을 지도 위 각 건물 자리에 (rotationDeg·scaleRatio까지 반영해서) 깔아 준다.
//
// 사용법(저장소 폴더에서):
//   node tools/make_skyview.cjs              # 새로 생겼거나 바뀐 glb만 다시 그림
//   node tools/make_skyview.cjs --force      # 전부 다시 그림
//   node tools/make_skyview.cjs models/place_설내옥.glb   # 특정 파일만
//   (윈도우에서는 "스카이뷰_만들기.bat"을 더블클릭해도 된다)
//
// 필요한 것: Node.js + Playwright(크로미움). 처음 한 번만:
//   npm install playwright three@0.160.0
//   npx playwright install chromium
// 실제 3D 그리기는 게임과 같은 three.js(0.160.0)로 한다 — node_modules에 있으면 그걸 쓰고,
// 없으면 CDN에서 받는다(이때는 인터넷 필요).
//
// 결과물:
//   img/skyview/<glb 이름>.webp  — 배경이 투명한 위에서 본 그림. 위쪽 = 모델의 -z, 오른쪽 = +x
//                                  (지도와 같은 방향: 지도에서 x는 오른쪽, z는 아래쪽)
//   img/skyview/skyview.json     — 각 그림이 모델 좌표에서 어느 범위(minX·minZ·width·depth)를
//                                  덮는지. 에디터가 이걸로 그림 크기·위치를 맞춘다.
const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const MODELS_DIR = path.join(ROOT, "models");
const OUT_DIR = path.join(ROOT, "img", "skyview");
const INDEX_FILE = path.join(OUT_DIR, "skyview.json");
const SKIP = new Set(["mom.glb", "walk.glb", "dance.glb"]); // 캐릭터 애니메이션 모델은 건물이 아니라 뺀다
const MAX_PX = 768; // 그림의 긴 변 최대 픽셀
const MAX_PX_PER_UNIT = 12; // 작은 모델이 쓸데없이 커지지 않게

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (err) {
  console.error("Playwright가 없어요. 저장소 폴더에서 먼저 아래 두 줄을 실행하세요:\n  npm install playwright three@0.160.0\n  npx playwright install chromium");
  process.exit(1);
}

// three.js: node_modules에 있으면 로컬 서버로 내보내고, 없으면 CDN
let THREE_DIR = null;
try {
  THREE_DIR = path.dirname(path.dirname(require.resolve("three", { paths: [ROOT, process.cwd()] }))); // .../three/build/three.cjs → .../three
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
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(-0.4, 1, -0.6); // 북서쪽 위에서 비춰서 지붕 높낮이가 살짝 구분되게
scene.add(sun);
window.renderModel = async (url, maxPx, maxPpu) => {
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  scene.add(root);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const w = Math.max(box.max.x - box.min.x, 0.01);
  const d = Math.max(box.max.z - box.min.z, 0.01);
  const ppu = Math.min(maxPpu, maxPx / Math.max(w, d));
  const W = Math.max(1, Math.ceil(w * ppu));
  const H = Math.max(1, Math.ceil(d * ppu));
  const width = W / ppu, depth = H / ppu; // 픽셀 반올림까지 반영한 실제 덮는 범위
  renderer.setSize(W, H, false);
  const cx = box.min.x + width / 2, cz = box.min.z + depth / 2;
  const height = box.max.y - box.min.y;
  const cam = new THREE.OrthographicCamera(-width / 2, width / 2, depth / 2, -depth / 2, 0.1, height + 20);
  cam.position.set(cx, box.max.y + 10, cz);
  cam.up.set(0, 0, -1); // 화면 위쪽 = -z, 오른쪽 = +x (지도와 같은 방향)
  cam.lookAt(cx, box.min.y, cz);
  renderer.render(scene, cam);
  const dataUrl = renderer.domElement.toDataURL("image/webp", 0.88);
  scene.remove(root);
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry?.dispose();
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      if (!m) return;
      Object.values(m).forEach((v) => v && v.isTexture && v.dispose());
      m.dispose();
    });
  });
  const r = (v) => Math.round(v * 1000) / 1000;
  return { dataUrl, minX: r(box.min.x), minZ: r(box.min.z), width: r(width), depth: r(depth), px: [W, H] };
};
window.rendererReady = true;
</script></body></html>`;

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/__skyview.html") {
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

function hashFile(file) {
  return crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex").slice(0, 10);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const explicit = args.filter((a) => !a.startsWith("--"));
  let files = explicit.length
    ? explicit.map((f) => path.resolve(ROOT, f))
    : fs.readdirSync(MODELS_DIR).filter((f) => f.toLowerCase().endsWith(".glb") && !SKIP.has(f)).map((f) => path.join(MODELS_DIR, f));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = fs.existsSync(INDEX_FILE) ? JSON.parse(fs.readFileSync(INDEX_FILE, "utf8")) : {};
  // 지워진 glb의 항목·그림은 정리한다
  for (const key of Object.keys(index)) {
    if (!fs.existsSync(path.join(ROOT, key))) {
      const img = path.join(ROOT, index[key].file);
      if (fs.existsSync(img)) fs.unlinkSync(img);
      delete index[key];
      console.log(`정리: ${key} (glb가 없어짐)`);
    }
  }

  const todo = [];
  for (const file of files) {
    const key = path.relative(ROOT, file).split(path.sep).join("/");
    const hash = hashFile(file);
    const out = path.join(OUT_DIR, path.basename(file).replace(/\.glb$/i, ".webp"));
    if (!force && index[key] && index[key].hash === hash && fs.existsSync(out)) continue;
    todo.push({ file, key, hash, out });
  }
  if (!todo.length) {
    console.log("바뀐 glb가 없어요 — 전부 다시 그리려면 --force");
    return;
  }

  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const launchOpts = { args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] };
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxy) launchOpts.proxy = { server: proxy, bypass: "127.0.0.1,localhost" };
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage({ ignoreHTTPSErrors: true });
  page.on("pageerror", (err) => console.error("페이지 오류:", err.message));
  page.on("requestfailed", (req) => console.error("불러오기 실패:", req.url(), req.failure()?.errorText));
  await page.goto(`${base}/__skyview.html`);
  await page.waitForFunction(() => window.rendererReady === true, null, { timeout: 20000 });

  let ok = 0;
  for (const { file, key, hash, out } of todo) {
    const url = `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
    try {
      const r = await page.evaluate(([u, a, b]) => window.renderModel(u, a, b), [url, MAX_PX, MAX_PX_PER_UNIT]);
      fs.writeFileSync(out, Buffer.from(r.dataUrl.split(",")[1], "base64"));
      index[key] = {
        file: path.relative(ROOT, out).split(path.sep).join("/"),
        hash,
        minX: r.minX,
        minZ: r.minZ,
        width: r.width,
        depth: r.depth,
      };
      ok++;
      console.log(`✔ ${key}  (${r.px[0]}×${r.px[1]}px)`);
    } catch (err) {
      console.error(`✘ ${key}: ${err.message.split("\n")[0]}`);
    }
  }
  await browser.close();
  server.close();

  const sorted = Object.fromEntries(Object.keys(index).sort().map((k) => [k, index[k]]));
  fs.writeFileSync(INDEX_FILE, JSON.stringify(sorted, null, 1) + "\n");
  console.log(`\n완료: ${ok}/${todo.length}개 그림 → img/skyview/ (목록: img/skyview/skyview.json)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
