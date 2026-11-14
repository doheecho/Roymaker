// ── 깃허브(Gist)로 자동 저장 (2026-11 추가) ──
// 기기마다 한 번, 깃허브에서 만든 "gist 권한 토큰"을 붙여 넣으면
// - 저장할 때마다(하루가 끝날 때·슬롯 저장 등) 비공개 Gist "roymaker-save"에 진행 상황 + 20칸 저장을 올리고
// - 게임을 열 때 Gist 쪽이 이 기기보다 최신이면 그걸 자동으로 불러온다.
// 토큰은 이 브라우저의 localStorage에만 저장된다(코드·저장소에는 절대 안 올라감).
// main.js의 buildSaveData / applyTransfer / readSlots / writeSlots / pad2 를 그대로 쓴다.

const GH_TOKEN_KEY = "roymaker-gh-token";
const GH_GIST_KEY = "roymaker-gh-gist";
const GH_LOCAL_SAVED_AT_KEY = "roymaker-local-saved-at";
const GH_GIST_DESC = "roymaker-save (이로이의 하루 세이브 — 지우지 마세요)";
const GH_FILE = "roymaker-save.json";
const GH_PUSH_DELAY_MS = 2500;

const gh = { pushTimer: null, applying: false, lastPushedAt: 0, status: "" };

function ghGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}
function ghSet(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (err) {
    // 저장소를 못 쓰면 무시
  }
}

async function ghFetch(path, { method = "GET", body } = {}) {
  const token = ghGet(GH_TOKEN_KEY);
  if (!token) throw new Error("토큰이 없어요");
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new Error("토큰이 맞지 않아요(만료됐거나 잘못 붙여 넣음)");
  if (res.status === 403 || res.status === 404) throw new Error("토큰에 gist 권한이 없어요");
  if (!res.ok) throw new Error(`깃허브 응답 오류 (${res.status})`);
  return res.json();
}

function ghPayload() {
  return {
    app: "roymaker",
    v: 1,
    savedAt: Number(ghGet(GH_LOCAL_SAVED_AT_KEY)) || Date.now(),
    autosave: buildSaveData(),
    slots: readSlots(),
  };
}

// 이 기기의 저장이 바뀔 때마다 시각을 기록(어느 쪽이 최신인지 비교용)
function markLocalSaved() {
  if (gh.applying) return;
  ghSet(GH_LOCAL_SAVED_AT_KEY, String(Date.now()));
  scheduleGitHubPush();
}

async function ghFindOrCreateGist() {
  const saved = ghGet(GH_GIST_KEY);
  if (saved) {
    try {
      return await ghFetch(`/gists/${saved}`);
    } catch (err) {
      ghSet(GH_GIST_KEY, null);
    }
  }
  for (let page = 1; page <= 5; page++) {
    const list = await ghFetch(`/gists?per_page=100&page=${page}`);
    const hit = list.find((g) => g.files?.[GH_FILE]);
    if (hit) {
      ghSet(GH_GIST_KEY, hit.id);
      return ghFetch(`/gists/${hit.id}`);
    }
    if (list.length < 100) break;
  }
  const created = await ghFetch("/gists", {
    method: "POST",
    body: { description: GH_GIST_DESC, public: false, files: { [GH_FILE]: { content: JSON.stringify(ghPayload()) } } },
  });
  ghSet(GH_GIST_KEY, created.id);
  return created;
}

async function ghReadGistPayload(gist) {
  const file = gist.files?.[GH_FILE];
  if (!file) return null;
  let text = file.content;
  if (file.truncated && file.raw_url) text = await (await fetch(file.raw_url)).text();
  try {
    const p = JSON.parse(text);
    return p?.app === "roymaker" && p.autosave?.version === 2 ? p : null;
  } catch (err) {
    return null;
  }
}

function scheduleGitHubPush() {
  if (!ghGet(GH_TOKEN_KEY)) return;
  clearTimeout(gh.pushTimer);
  gh.pushTimer = setTimeout(() => pushToGitHub().catch(() => {}), GH_PUSH_DELAY_MS);
}

async function pushToGitHub() {
  if (!ghGet(GH_TOKEN_KEY)) return false;
  try {
    const gist = await ghFindOrCreateGist();
    const payload = ghPayload();
    await ghFetch(`/gists/${gist.id}`, { method: "PATCH", body: { files: { [GH_FILE]: { content: JSON.stringify(payload) } } } });
    gh.lastPushedAt = Date.now();
    setGitHubStatus(`☁️ 깃허브에 저장됨 (${ghTimeText(gh.lastPushedAt)}, Day ${payload.autosave.day})`);
    return true;
  } catch (err) {
    setGitHubStatus(`⚠️ 깃허브 저장 실패: ${err.message}`);
    return false;
  }
}

// Gist가 이 기기보다 최신이면 불러온다. force면 비교 없이 불러온다.
async function pullFromGitHub({ force = false } = {}) {
  if (!ghGet(GH_TOKEN_KEY)) return false;
  try {
    const gist = await ghFindOrCreateGist();
    const remote = await ghReadGistPayload(gist);
    if (!remote) {
      setGitHubStatus("☁️ 깃허브 연결됨 — 아직 올라간 세이브가 없어서 이 기기 것을 올렸어요");
      await pushToGitHub();
      return false;
    }
    const localAt = Number(ghGet(GH_LOCAL_SAVED_AT_KEY)) || 0;
    if (!force && remote.savedAt <= localAt) {
      setGitHubStatus(`☁️ 깃허브 연결됨 — 이 기기가 최신이에요 (Day ${state.day})`);
      if (remote.savedAt < localAt) scheduleGitHubPush();
      return false;
    }
    gh.applying = true;
    try {
      applyTransfer(remote);
    } finally {
      gh.applying = false;
    }
    ghSet(GH_LOCAL_SAVED_AT_KEY, String(remote.savedAt));
    if (typeof showView === "function") showView("home");
    setGitHubStatus(`☁️ 깃허브에서 불러왔어요 (Day ${state.day}, ${ghTimeText(remote.savedAt)}에 저장된 것)`);
    const note = document.getElementById("save-note");
    if (note) note.textContent = `☁️ 깃허브에 저장된 진행 상황(Day ${state.day})을 불러왔어요.`;
    return true;
  } catch (err) {
    setGitHubStatus(`⚠️ 깃허브 불러오기 실패: ${err.message}`);
    return false;
  }
}

function ghTimeText(ms) {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function setGitHubStatus(text) {
  gh.status = text;
  const el = document.getElementById("gh-status");
  if (el) el.textContent = text;
}

function renderGitHubBox() {
  const connected = !!ghGet(GH_TOKEN_KEY);
  const setup = document.getElementById("gh-setup");
  const actions = document.getElementById("gh-actions");
  if (setup) setup.hidden = connected;
  if (actions) actions.hidden = !connected;
  setGitHubStatus(gh.status || (connected ? "☁️ 깃허브 연결됨" : "연결 안 됨 — 아래 순서대로 토큰을 한 번만 넣어 주세요"));
}

function wireGitHubSave() {
  const box = document.getElementById("gh-box");
  if (!box) return;
  document.getElementById("gh-connect").addEventListener("click", async () => {
    const input = document.getElementById("gh-token");
    const token = input.value.trim();
    if (!/^(ghp_|github_pat_|gho_)/.test(token)) {
      setGitHubStatus("⚠️ 토큰은 ghp_ 또는 github_pat_ 로 시작해요. 다시 복사해 붙여 넣어 주세요");
      return;
    }
    ghSet(GH_TOKEN_KEY, token);
    ghSet(GH_GIST_KEY, null);
    input.value = "";
    setGitHubStatus("연결하는 중…");
    try {
      const me = await ghFetch("/user");
      setGitHubStatus(`✅ ${me.login} 계정에 연결됐어요. 세이브를 확인하는 중…`);
      renderGitHubBox();
      await pullFromGitHub();
    } catch (err) {
      ghSet(GH_TOKEN_KEY, null);
      renderGitHubBox();
      setGitHubStatus(`⚠️ 연결 실패: ${err.message}`);
    }
  });
  document.getElementById("gh-push").addEventListener("click", async () => {
    if (state.dayRunning) return setGitHubStatus("일과가 진행 중일 때는 하루를 마치고 해 주세요");
    setGitHubStatus("깃허브에 저장하는 중…");
    markLocalSaved();
    clearTimeout(gh.pushTimer);
    await pushToGitHub();
  });
  document.getElementById("gh-pull").addEventListener("click", async () => {
    if (state.dayRunning) return setGitHubStatus("일과가 진행 중일 때는 하루를 마치고 해 주세요");
    if (!window.confirm("깃허브에 저장된 세이브로 이 기기의 진행 상황과 20칸 저장을 바꿀까요?")) return;
    setGitHubStatus("깃허브에서 불러오는 중…");
    await pullFromGitHub({ force: true });
    if (typeof openSlotModal === "function" && !document.getElementById("slot-modal").hidden) openSlotModal("load");
  });
  document.getElementById("gh-link")?.addEventListener("click", async () => {
    const link = connectLink();
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setGitHubStatus("🔗 연결 링크를 복사했어요. 카카오톡 '나와의 채팅' 등으로 보내서 다른 기기에서 열면 자동으로 연결돼요. (링크 안에 토큰이 있으니 남에게 보내지 마세요)");
    } catch (err) {
      window.prompt("이 링크를 복사해서 다른 기기에서 여세요", link);
    }
  });
  document.getElementById("gh-disconnect").addEventListener("click", () => {
    if (!window.confirm("이 기기에서 깃허브 연결을 끊을까요? (깃허브에 올라간 세이브는 그대로 남아요)")) return;
    ghSet(GH_TOKEN_KEY, null);
    ghSet(GH_GIST_KEY, null);
    gh.status = "";
    renderGitHubBox();
  });
  renderGitHubBox();
}

// 연결 링크: 게임 주소 뒤에 #gh=토큰 을 붙여 열면 그 기기에 토큰을 저장하고 주소창에서는 지운다
// (토큰을 저장소·코드에 넣으면 깃허브가 공개 토큰으로 보고 바로 폐기하므로, 링크로만 옮긴다)
function takeTokenFromLink() {
  const m = (location.hash || "").match(/[#&]gh=([A-Za-z0-9_]+)/);
  if (!m) return false;
  const token = m[1];
  try {
    history.replaceState(null, "", location.pathname + location.search);
  } catch (err) {
    location.hash = "";
  }
  if (!/^(ghp_|github_pat_|gho_)/.test(token)) return false;
  if (ghGet(GH_TOKEN_KEY) !== token) ghSet(GH_GIST_KEY, null);
  ghSet(GH_TOKEN_KEY, token);
  return true;
}

function connectLink() {
  const token = ghGet(GH_TOKEN_KEY);
  return token ? `${location.origin}${location.pathname}#gh=${token}` : null;
}

// 게임 시작 때: 연결돼 있으면 깃허브 쪽이 최신인지 확인해서 불러온다
async function initGitHubSave() {
  const fromLink = takeTokenFromLink();
  wireGitHubSave();
  if (fromLink) setGitHubStatus("🔗 연결 링크로 깃허브에 연결했어요. 세이브를 확인하는 중…");
  if (!ghGet(GH_TOKEN_KEY)) return;
  if (!ghGet(GH_LOCAL_SAVED_AT_KEY) && ghGet("roymaker-save-v2")) ghSet(GH_LOCAL_SAVED_AT_KEY, "1"); // 예전 세이브는 아주 오래된 것으로 취급
  await pullFromGitHub();
}
