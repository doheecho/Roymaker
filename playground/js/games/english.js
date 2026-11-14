// ===================== 🔤 영어 놀이 카테고리 (6종) =====================
// 공통: 발음/문장 읽기는 브라우저 내장 TTS(en-US). 속도는 버튼으로 조절(시작 화면 + 게임 중 다시듣기 모두).
// 그림은 이모지. 정답 초록 / 오답 흔들림 + 세션 끝에 별점(⭐1~3).

// ---------- 공용 TTS + 읽기 속도 조절 ----------
var ENG_SPEED_PRESETS = [
    { v: 0.6, l: '🐢 아주 느리게' },
    { v: 0.78, l: '느리게' },
    { v: 0.92, l: '보통' },
    { v: 1.12, l: '🐇 빠르게' }
];
// hasEnVoice: null = 아직 모름(음성 목록 미로딩) → 일단 지원으로 간주, false = 영어 음성 없음, true = 있음
var ENG_TTS = { rate: 0.92, rerender: null, warmed: false, lastText: '', hasEnVoice: null, enVoice: null };
(function () {
    try {
        var s = parseFloat(localStorage.getItem('engTtsRate'));
        if (s >= 0.4 && s <= 1.6) ENG_TTS.rate = s;
    } catch (e) { }
})();
// 설치된 음성 목록에서 영어(en-*) 음성이 있는지 확인한다. 목록은 비동기로 채워지므로 voiceschanged에서도 갱신.
function engRefreshVoices() {
    if (!window.speechSynthesis || !window.speechSynthesis.getVoices) return;
    var voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return; // 아직 로딩 전 — hasEnVoice는 그대로(null) 둔다
    var en = null;
    for (var i = 0; i < voices.length; i++) {
        if (/^en(-|_|$)/i.test(voices[i].lang || '')) { en = voices[i]; break; }
    }
    var prev = ENG_TTS.hasEnVoice;
    ENG_TTS.enVoice = en;
    ENG_TTS.hasEnVoice = !!en;
    // 지원 여부가 바뀌었고 영어 게임 화면이 열려 있으면 다시 그려서 안내문/버튼을 갱신
    if (prev !== ENG_TTS.hasEnVoice && typeof ENG_TTS.rerender === 'function') { ENG_TTS.rerender(); }
}
if (window.speechSynthesis) {
    try {
        engRefreshVoices();
        window.speechSynthesis.addEventListener('voiceschanged', engRefreshVoices);
    } catch (e) { }
}
function engCancelSpeak() {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { }
}
function engSupportsTTS() {
    return !!(window.speechSynthesis && window.SpeechSynthesisUtterance) && ENG_TTS.hasEnVoice !== false;
}
function engSpeak(text, delayMs) {
    if (!engSupportsTTS() || !text) return;
    if (typeof SOUND_ON !== 'undefined' && !SOUND_ON) { ENG_TTS.lastText = text; return; }
    ENG_TTS.lastText = text;
    var doIt = function () {
        engCancelSpeak();
        try {
            var u = new SpeechSynthesisUtterance(text);
            u.lang = 'en-US';
            if (ENG_TTS.enVoice) u.voice = ENG_TTS.enVoice;
            u.rate = ENG_TTS.rate;
            u.pitch = 1.05;
            window.speechSynthesis.speak(u);
        } catch (e) { }
    };
    var d = (typeof delayMs === 'number') ? delayMs : (ENG_TTS.warmed ? 0 : 900);
    ENG_TTS.warmed = true;
    if (d > 0) { var t = gameTimeout(doIt, d); } else { doIt(); }
}
function engReplayLast() { vibrateShort(); engSpeak(ENG_TTS.lastText, 0); }
function setEngRate(v) {
    ENG_TTS.rate = v;
    try { localStorage.setItem('engTtsRate', String(v)); } catch (e) { }
    if (typeof ENG_TTS.rerender === 'function') ENG_TTS.rerender();
}
// 읽기 속도 버튼 줄 (시작 화면 / 게임 중 공용)
function engSpeedRow(label) {
    var lbl = (label === undefined) ? '🔈 읽기 속도' : label;
    var html = '<div class="eng-speed-row">';
    if (lbl) html += '<span class="eng-speed-label">' + lbl + '</span>';
    ENG_SPEED_PRESETS.forEach(function (p) {
        var on = Math.abs(ENG_TTS.rate - p.v) < 0.001;
        html += '<button class="eng-speed-btn' + (on ? ' active' : '') + '" onclick="setEngRate(' + p.v + ')">' + p.l + '</button>';
    });
    html += '</div>';
    return html;
}
function engSpeakBtn(txt) {
    return '<button class="eng-speak-btn" onclick="engReplayLast()">🔊 ' + (txt || '다시 듣기') + '</button>';
}
// 각 게임의 시작(초기) 화면으로 돌아가는 버튼 — 모든 영어 놀이 게임 진행 화면에 공통으로 붙임
function engBackBtn(initFn) {
    return '<button class="eng-mini-btn" onclick="' + initFn + '()">⏮ 처음으로</button>';
}
// 게임 진입 시 이전 게임의 소리/타이머 정리
function engEnter() {
    try { clearAllGameTimers(); } catch (e) { }
    engCancelSpeak();
}
// TTS 미지원 브라우저 안내(문장은 화면에도 항상 보여주므로 게임은 계속 가능)
function engTTSNote() {
    if (engSupportsTTS()) return '';
    return '<div class="game-sub-desc" style="color:#b45309; text-align:center;">이 브라우저는 소리 읽기를 지원하지 않아요. 문장을 눈으로 읽고 풀어보세요!</div>';
}

// ---------- 공용 세션 별점 결과 ----------
function engStars(correct, total) {
    var r = total > 0 ? correct / total : 0;
    if (r >= 0.9) return 3;
    if (r >= 0.6) return 2;
    return 1;
}
function engStarStr(n) { return '⭐⭐⭐'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
function renderEngResult(emoji, name, correct, total, initFn, startFn, extraLine) {
    engCancelSpeak();
    ENG_TTS.rerender = null;
    if (typeof reportGameRound === 'function') reportGameRound(correct);
    var n = engStars(correct, total);
    if (typeof reportGameOutcome === 'function') reportGameOutcome(n >= 2 ? 'win' : 'lose');
    var html = '<div class="game-title-box">' + emoji + ' ' + name + ' — 끝!</div>';
    html += '<div style="text-align:center; font-size:2rem; letter-spacing:0.15rem; margin:0.7rem 0;">' + engStarStr(n) + '</div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800; font-size:1rem;">' + total + '문제 중 <span style="color:var(--primary);">' + correct + '개</span> 정답!';
    if (extraLine) html += '<br>' + extraLine;
    html += '</div>';
    html += buildStandardResultButtons(initFn + '()', startFn + '()', 'goHome()');
    document.getElementById('mainArea').innerHTML = html;
}


// ===========================================================================
// 1. 듣고 그림 찾기 (listenPickPicture) 🎧
// ===========================================================================
// 항목: { l:난이도, t:영어문장, a:정답 이모지, d:[오답 이모지 3개] }
// 오답은 주어/동작/장소 중 하나만 바꿔서 — 끝까지 안 들으면 못 맞추게.
var LISTEN_PICK_DATA = [
    // --- 1단계: 단문 (주어 + 동사 -ing) ---
    { l: 1, t: 'A cat is sleeping.', a: '🐱💤', d: ['🐶💤', '🐱🏃', '🐭💤'] },
    { l: 1, t: 'The dog is running.', a: '🐶🏃', d: ['🐱🏃', '🐶💤', '🐰🏃'] },
    { l: 1, t: 'A boy is jumping.', a: '👦🤸', d: ['👧🤸', '👦🏃', '🐸🤸'] },
    { l: 1, t: 'The girl is eating.', a: '👧🍽️', d: ['👦🍽️', '👧🥤', '👩🍽️'] },
    { l: 1, t: 'A baby is crying.', a: '👶😭', d: ['👶😴', '👦😭', '👶😂'] },
    { l: 1, t: 'The bird is flying.', a: '🐦🕊️', d: ['🐤🪺', '🐟🏊', '🦆🚶'] },
    { l: 1, t: 'A fish is swimming.', a: '🐟🏊', d: ['🐸🏊', '🐟💤', '🦆🚶'] },
    { l: 1, t: 'The man is reading.', a: '🧑📖', d: ['👩📖', '🧑✍️', '🧑🥤'] },
    { l: 1, t: 'A woman is singing.', a: '👩🎤', d: ['🧑🎤', '👩💃', '👧🎤'] },
    { l: 1, t: 'The frog is jumping.', a: '🐸🤸', d: ['🐰🤸', '🐸💤', '🐸🏊'] },
    { l: 1, t: 'A dog is eating.', a: '🐶🍽️', d: ['🐱🍽️', '🐶🥤', '🐶💤'] },
    { l: 1, t: 'The girl is dancing.', a: '👧💃', d: ['👦💃', '👧🎤', '👩💃'] },
    { l: 1, t: 'A boy is writing.', a: '👦✍️', d: ['👧✍️', '👦📖', '👦🎨'] },
    { l: 1, t: 'The duck is swimming.', a: '🦆🏊', d: ['🐤🚶', '🦆🚶', '🐟🏊'] },
    { l: 1, t: 'A rabbit is running.', a: '🐰🏃', d: ['🐰💤', '🐢🏃', '🐱🏃'] },
    { l: 1, t: 'The baby is laughing.', a: '👶😂', d: ['👶😭', '👧😂', '👶💤'] },
    { l: 1, t: 'A cat is drinking.', a: '🐱🥤', d: ['🐶🥤', '🐱🍽️', '🐱💤'] },
    { l: 1, t: 'The bear is walking.', a: '🐻🚶', d: ['🐻💤', '🐨🚶', '🐻🏃'] },
    { l: 1, t: 'A boy is crying.', a: '👦😭', d: ['👦😂', '👧😭', '👦😴'] },
    { l: 1, t: 'The cat is climbing.', a: '🐱🧗', d: ['🐿️🧗', '🐱💤', '🐱🏃'] },
    // --- 2단계: 형용사 / 장소·전치사 포함 ---
    { l: 2, t: 'The dog is sleeping under the tree.', a: '🐶🌳💤', d: ['🐱🌳💤', '🐶🏠💤', '🐶🌳🍽️'] },
    { l: 2, t: 'A cat is sitting on the box.', a: '🐱📦🪑', d: ['🐶📦🪑', '🐱🧺🪑', '🐱📦💤'] },
    { l: 2, t: 'The boy is reading in bed.', a: '👦🛏️📖', d: ['👧🛏️📖', '👦🛋️📖', '👦🛏️😴'] },
    { l: 2, t: 'A girl is playing in the park.', a: '👧🌳⚽', d: ['👦🌳⚽', '👧🏠⚽', '👧🌳📖'] },
    { l: 2, t: 'The big dog is barking.', a: '🐕📢', d: ['🐩📢', '🐕💤', '🐈📢'] },
    { l: 2, t: 'A small bird is singing.', a: '🐤🎵', d: ['🦅🎵', '🐤💤', '🐤🍽️'] },
    { l: 2, t: 'The cat is behind the door.', a: '🐱🚪', d: ['🐶🚪', '🐱🪟', '🐱📦'] },
    { l: 2, t: 'A fish is swimming in the sea.', a: '🐟🌊', d: ['🐟🪣', '🐸🌊', '🐦🌊'] },
    { l: 2, t: 'The boy is jumping over the fence.', a: '👦🚧🤸', d: ['👦🚧🚶', '👧🚧🤸', '👦🪜🤸'] },
    { l: 2, t: 'A kite is flying in the sky.', a: '🪁☁️', d: ['🪁🌊', '🎈☁️', '🐦☁️'] },
    { l: 2, t: 'The girl is holding a red balloon.', a: '👧🎈', d: ['👦🎈', '👧🍎', '👧🪁'] },
    { l: 2, t: 'A monkey is eating a banana.', a: '🐵🍌', d: ['🐵🍎', '🐶🍌', '🐵🥤'] },
    { l: 2, t: 'The children are playing on the beach.', a: '🧒🏖️', d: ['🧒🏫', '👵🏖️', '🧒🛏️'] },
    { l: 2, t: 'A cat is sleeping on the sofa.', a: '🐱🛋️💤', d: ['🐱🛏️💤', '🐶🛋️💤', '🐱🛋️🍽️'] },
    { l: 2, t: 'The dog is running in the rain.', a: '🐶🌧️🏃', d: ['🐶☀️🏃', '🐱🌧️🏃', '🐶🌧️💤'] },
    { l: 2, t: 'A boy is riding a bike.', a: '👦🚲', d: ['👧🚲', '👦🛴', '👦🏍️'] },
    { l: 2, t: 'The bird is in the nest.', a: '🐦🪺', d: ['🐦🌳', '🐤🪺', '🐿️🪺'] },
    { l: 2, t: 'A frog is sitting on a rock.', a: '🐸🪨', d: ['🐸🍃', '🐢🪨', '🐸💧'] },
    { l: 2, t: 'The old man is walking slowly.', a: '👴🐢🚶', d: ['👴🏃', '👦🐢🚶', '👴💤'] },
    { l: 2, t: 'A cat is playing with a ball.', a: '🐱⚽', d: ['🐶⚽', '🐱🧶', '🐱💤'] },
    // --- 3단계: 두 동작이 있는 복문 (한 동작만 보이는 그림이 함정) ---
    { l: 3, t: 'The girl is reading a book and drinking juice.', a: '👧📖🥤', d: ['👧📖', '👦📖🥤', '👧📖🍎'] },
    { l: 3, t: 'The boy is running and holding a flag.', a: '👦🏃🚩', d: ['👦🏃', '👦🚶🚩', '👧🏃🚩'] },
    { l: 3, t: 'The dog is jumping and catching a ball.', a: '🐶🤸⚽', d: ['🐶🤸', '🐱🤸⚽', '🐶💤⚽'] },
    { l: 3, t: 'The cat is sitting and looking at a bird.', a: '🐱🪑👀🐦', d: ['🐱🪑👀🐟', '🐱🏃🐦', '🐶🪑👀🐦'] },
    { l: 3, t: 'The woman is cooking and singing.', a: '👩🍳🎵', d: ['👩🍳', '👩🎵', '🧑🍳🎵'] },
    { l: 3, t: 'The boy is smiling and waving his hand.', a: '👦😀👋', d: ['👦😀', '👦😭👋', '👧😀👋'] },
    { l: 3, t: 'The baby is crying because she is hungry.', a: '👶😭🍽️', d: ['👶😴🍽️', '👶😂🍽️', '👶😭💤'] },
    { l: 3, t: 'The children are drawing and laughing together.', a: '🧒🎨😂', d: ['🧒🎨', '🧒😂', '👵🎨😂'] },
    { l: 3, t: 'The man is driving a car and listening to music.', a: '🧑🚗🎵', d: ['🧑🚗', '🧑🚲🎵', '👩🚗🎵'] },
    { l: 3, t: 'The girl is brushing her teeth and holding a cup.', a: '👧🪥🥤', d: ['👧🪥', '👦🪥🥤', '👧🍽️🥤'] },
    { l: 3, t: 'The dog is barking and wagging its tail.', a: '🐶📢〰️', d: ['🐶📢', '🐱📢〰️', '🐶💤〰️'] },
    { l: 3, t: 'The boy is climbing a tree to get an apple.', a: '👦🌳🍎', d: ['👦🌳', '👧🌳🍎', '👦🏠🍎'] },
    { l: 3, t: 'The cat jumped on the table and knocked the cup.', a: '🐱🍽️🥤', d: ['🐱🍽️', '🐱🥤', '🐶🍽️🥤'] },
    { l: 3, t: 'The girl is happy because it is her birthday.', a: '👧😀🎂', d: ['👧😭🎂', '👦😀🎂', '👧😀🎁'] },
    { l: 3, t: 'The kids went to the zoo and saw a lion.', a: '🧒🦁', d: ['🧒🐘', '🧒🏫', '👵🦁'] },
    { l: 3, t: 'Mom made a cake and we ate it together.', a: '👩🍰🍴', d: ['👩🍰', '👩🍪🍴', '👴🍰🍴'] },
    { l: 3, t: 'The little bird flew away from the big cat.', a: '🐦➡️🐱', d: ['🐦🐱', '🐤➡️🐶', '🦅➡️🐱'] }
];
var LISTEN_LEVELS = [
    { v: 1, l: '1단계 · 짧은 문장' },
    { v: 2, l: '2단계 · 장소·꾸밈말' },
    { v: 3, l: '3단계 · 두 가지 행동' }
];
var LISTEN_TOTAL = 10;
var listenState = {};
function initListenPick() { engEnter(); renderListenSetup(); }
function renderListenSetup() {
    ENG_TTS.rerender = renderListenSetup;
    if (!listenState.level) listenState.level = 1;
    var html = '<div class="game-title-box">🎧 듣고 그림 찾기</div>';
    html += '<div class="game-sub-desc">영어 문장을 잘 듣고, 문장에 맞는 그림을 골라요. 끝까지 들어야 함정을 피할 수 있어요!</div>';
    html += engTTSNote();
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    LISTEN_LEVELS.forEach(function (t) {
        html += '<button class="setup-btn' + (listenState.level === t.v ? ' active' : '') + '" onclick="setListenLevel(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">읽기 속도 (게임 중에도 바꿀 수 있어요)</div>';
    html += engSpeedRow('');
    html += '<button class="action-btn" onclick="startListenSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setListenLevel(v) { listenState.level = v; renderListenSetup(); }
function startListenSession() {
    var pool = shuffleArray(LISTEN_PICK_DATA.filter(function (x) { return x.l === listenState.level; }));
    var qs = pool.slice(0, LISTEN_TOTAL);
    while (qs.length < LISTEN_TOTAL && pool.length > 0) qs.push(pool[qs.length % pool.length]);
    listenState.queue = qs;
    listenState.i = 0;
    listenState.correct = 0;
    listenState.firstTry = true;
    listenState.spoken = false;
    listenState.answered = false;
    listenState.showText = false;
    renderListenRound();
}
function toggleListenText() { listenState.showText = !listenState.showText; renderListenRound(); }
function buildListenOptions(item) {
    var opts = shuffleArray([item.a].concat(item.d));
    return opts;
}
function renderListenRound() {
    ENG_TTS.rerender = renderListenRound;
    var st = listenState;
    if (typeof reportGameRound === 'function') reportGameRound(st.correct);
    var item = st.queue[st.i];
    if (!st.opts || st.optsFor !== st.i) { st.opts = buildListenOptions(item); st.optsFor = st.i; }
    var html = '<div class="game-title-box">🎧 듣고 그림 찾기</div>';
    html += '<div class="status-row"><div>' + (st.i + 1) + ' / ' + LISTEN_TOTAL + '</div><div>정답: ' + st.correct + '</div></div>';
    html += '<div class="eng-btn-row">' + engSpeakBtn('문장 다시 듣기') +
        '<button class="eng-mini-btn" onclick="toggleListenText()">' + (st.showText ? '🙈 문장 숨기기' : '👁 문장 보기') + '</button>' +
        engBackBtn('initListenPick') + '</div>';
    html += engSpeedRow();
    if (st.showText) html += '<div class="game-sub-desc" style="text-align:center; font-style:italic; color:#64748b; margin-top:0.6rem;">“' + item.t + '”</div>';
    html += '<div class="eng-pic-grid">';
    st.opts.forEach(function (op, idx) {
        html += '<button class="eng-pic-btn" data-i="' + idx + '" onclick="checkListenPick(' + idx + ')">' + op + '</button>';
    });
    html += '</div>';
    html += '<div id="engListenMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (!st.spoken) { st.spoken = true; engSpeak(item.t); }
}
function checkListenPick(idx) {
    var st = listenState;
    if (st.answered) return;
    var item = st.queue[st.i];
    var chosen = st.opts[idx];
    var btns = document.querySelectorAll('.eng-pic-btn');
    var msg = document.getElementById('engListenMsg');
    if (chosen === item.a) {
        st.answered = true;
        vibrateShort();
        btns[idx].classList.add('eng-ok');
        if (st.firstTry) st.correct++;
        engSpeak(item.t, 0);
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 맞았어요!'; playResultSound(true);
        var t = gameTimeout(listenNext, 1100);
    } else {
        st.firstTry = false;
        btns[idx].classList.add('eng-no');
        var b = btns[idx];
        var tt = gameTimeout(function () { b.classList.remove('eng-no'); }, 500);
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '다시 한 번 들어볼까요? 🔊'; playResultSound(false);
    }
}
function listenNext() {
    var st = listenState;
    st.i++;
    if (st.i >= LISTEN_TOTAL) {
        renderEngResult('🎧', '듣고 그림 찾기', st.correct, LISTEN_TOTAL, 'initListenPick', 'startListenSession');
        return;
    }
    st.firstTry = true;
    st.spoken = false;
    st.answered = false;
    st.showText = false;
    renderListenRound();
}


// ===========================================================================
// 2. 지시 따라하기 (followInstructions) 🙋
// ===========================================================================
// 태그가 붙은 사물 풀에서 보드를 만들고, 그 보드에서 성립하는 지시문만 출제 → 오답 시비 없음.
var FOLLOW_POOL = [
    { e: '🍎', w: 'apple', t: ['red', 'food', 'plant', 'notalive', 'round', 'small', 'edible'] },
    { e: '🍌', w: 'banana', t: ['yellow', 'food', 'plant', 'notalive', 'small', 'edible'] },
    { e: '🍇', w: 'grapes', t: ['purple', 'food', 'plant', 'notalive', 'round', 'small', 'edible'] },
    { e: '🍓', w: 'strawberry', t: ['red', 'food', 'plant', 'notalive', 'small', 'edible'] },
    { e: '🍊', w: 'orange', t: ['orange', 'food', 'plant', 'notalive', 'round', 'small', 'edible'] },
    { e: '🥕', w: 'carrot', t: ['orange', 'food', 'plant', 'notalive', 'edible'] },
    { e: '🌽', w: 'corn', t: ['yellow', 'food', 'plant', 'notalive', 'edible'] },
    { e: '🍞', w: 'bread', t: ['brown', 'food', 'notalive', 'edible'] },
    { e: '🧀', w: 'cheese', t: ['yellow', 'food', 'notalive', 'edible'] },
    { e: '🍪', w: 'cookie', t: ['brown', 'food', 'notalive', 'round', 'small', 'edible'] },
    { e: '🍰', w: 'cake', t: ['white', 'food', 'notalive', 'edible'] },
    { e: '🥛', w: 'milk', t: ['white', 'food', 'notalive', 'cold'] },
    { e: '🐶', w: 'dog', t: ['brown', 'animal', 'alive'] },
    { e: '🐱', w: 'cat', t: ['orange', 'animal', 'alive', 'small'] },
    { e: '🐰', w: 'rabbit', t: ['white', 'animal', 'alive', 'small'] },
    { e: '🐻', w: 'bear', t: ['brown', 'animal', 'alive', 'big'] },
    { e: '🦁', w: 'lion', t: ['yellow', 'animal', 'alive', 'big'] },
    { e: '🐸', w: 'frog', t: ['green', 'animal', 'alive', 'small'] },
    { e: '🐦', w: 'bird', t: ['blue', 'animal', 'alive', 'canfly', 'small'] },
    { e: '🦋', w: 'butterfly', t: ['orange', 'animal', 'alive', 'canfly', 'small'] },
    { e: '🐝', w: 'bee', t: ['yellow', 'animal', 'alive', 'canfly', 'small'] },
    { e: '🦅', w: 'eagle', t: ['brown', 'animal', 'alive', 'canfly', 'big'] },
    { e: '🐧', w: 'penguin', t: ['black', 'animal', 'alive', 'inwater'] },
    { e: '🐠', w: 'fish', t: ['orange', 'animal', 'alive', 'inwater', 'small'] },
    { e: '🐬', w: 'dolphin', t: ['gray', 'animal', 'alive', 'inwater', 'big'] },
    { e: '🐢', w: 'turtle', t: ['green', 'animal', 'alive', 'small'] },
    { e: '🐘', w: 'elephant', t: ['gray', 'animal', 'alive', 'big'] },
    { e: '🐭', w: 'mouse', t: ['gray', 'animal', 'alive', 'small'] },
    { e: '🐴', w: 'horse', t: ['brown', 'animal', 'alive', 'big'] },
    { e: '🚗', w: 'car', t: ['red', 'vehicle', 'notalive', 'haswheels', 'big'] },
    { e: '🚕', w: 'taxi', t: ['yellow', 'vehicle', 'notalive', 'haswheels', 'big'] },
    { e: '🚌', w: 'bus', t: ['yellow', 'vehicle', 'notalive', 'haswheels', 'big'] },
    { e: '🚲', w: 'bicycle', t: ['blue', 'vehicle', 'notalive', 'haswheels'] },
    { e: '✈️', w: 'airplane', t: ['white', 'vehicle', 'notalive', 'canfly', 'big'] },
    { e: '🚀', w: 'rocket', t: ['white', 'vehicle', 'notalive', 'canfly', 'big'] },
    { e: '🚁', w: 'helicopter', t: ['blue', 'vehicle', 'notalive', 'canfly', 'big'] },
    { e: '⛵', w: 'boat', t: ['white', 'vehicle', 'notalive', 'inwater'] },
    { e: '🚂', w: 'train', t: ['black', 'vehicle', 'notalive', 'haswheels', 'big'] },
    { e: '🌳', w: 'tree', t: ['green', 'plant', 'alive', 'big'] },
    { e: '🌸', w: 'flower', t: ['pink', 'plant', 'alive', 'small'] },
    { e: '🌵', w: 'cactus', t: ['green', 'plant', 'alive'] },
    { e: '🍄', w: 'mushroom', t: ['red', 'plant', 'notalive', 'small'] },
    { e: '⚽', w: 'ball', t: ['white', 'toy', 'notalive', 'round'] },
    { e: '🧸', w: 'teddy bear', t: ['brown', 'toy', 'notalive'] },
    { e: '🪁', w: 'kite', t: ['red', 'toy', 'notalive', 'canfly'] },
    { e: '🎈', w: 'balloon', t: ['red', 'toy', 'notalive', 'canfly', 'round'] },
    { e: '🧊', w: 'ice', t: ['white', 'notalive', 'cold'] },
    { e: '🔥', w: 'fire', t: ['orange', 'notalive', 'hot'] },
    { e: '☀️', w: 'sun', t: ['yellow', 'notalive', 'hot', 'round'] },
    { e: '⭐', w: 'star', t: ['yellow', 'notalive'] },
    { e: '🌙', w: 'moon', t: ['white', 'notalive'] },
    { e: '🧢', w: 'cap', t: ['red', 'clothes', 'notalive'] },
    { e: '👟', w: 'shoe', t: ['white', 'clothes', 'notalive'] },
    { e: '🧤', w: 'gloves', t: ['blue', 'clothes', 'notalive'] },
    { e: '🪑', w: 'chair', t: ['brown', 'furniture', 'notalive'] },
    { e: '🛏️', w: 'bed', t: ['white', 'furniture', 'notalive', 'big'] },
    { e: '✏️', w: 'pencil', t: ['yellow', 'school', 'notalive', 'small'] },
    { e: '📕', w: 'book', t: ['red', 'school', 'notalive'] },
    { e: '✂️', w: 'scissors', t: ['gray', 'school', 'notalive'] },
    { e: '🔑', w: 'key', t: ['yellow', 'notalive', 'small'] }
];
var FOLLOW_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'white', 'black', 'gray'];
var FOLLOW_CATS = [
    { tag: 'animal', say: 'animals', one: 'animal', ko: '동물' },
    { tag: 'food', say: 'food', one: 'food', ko: '음식' },
    { tag: 'vehicle', say: 'vehicles', one: 'vehicle', ko: '탈것' },
    { tag: 'plant', say: 'plants', one: 'plant', ko: '식물' },
    { tag: 'toy', say: 'toys', one: 'toy', ko: '장난감' },
    { tag: 'clothes', say: 'clothes', one: 'thing you can wear', ko: '옷' }
];
var FOLLOW_TOTAL = 8;
var followState = {};
function initFollowInstructions() { engEnter(); if (followState.timerId) { clearInterval(followState.timerId); followState.timerId = null; } renderFollowSetup(); }
function renderFollowSetup() {
    ENG_TTS.rerender = renderFollowSetup;
    if (!followState.level) followState.level = 1;
    if (followState.timer === undefined) followState.timer = false;
    var html = '<div class="game-title-box">🙋 지시 따라하기</div>';
    html += '<div class="game-sub-desc">영어 지시를 듣고, 조건에 맞는 것을 <b>모두</b> 찾아 눌러요. (정답이 여러 개일 수 있어요)</div>';
    html += engTTSNote();
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    [{ v: 1, l: '1단계 · 색/종류' }, { v: 2, l: '2단계 · 색+크기' }, { v: 3, l: '3단계 · 아니야(부정)' }].forEach(function (t) {
        html += '<button class="setup-btn' + (followState.level === t.v ? ' active' : '') + '" onclick="setFollowLevel(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한시간 막대</div><div class="setup-btn-group">';
    html += '<button class="setup-btn' + (!followState.timer ? ' active' : '') + '" onclick="setFollowTimer(false)">끄기 (천천히)</button>';
    html += '<button class="setup-btn' + (followState.timer ? ' active' : '') + '" onclick="setFollowTimer(true)">켜기</button>';
    html += '</div>';
    html += '<div class="setup-section-label">읽기 속도</div>' + engSpeedRow('');
    html += '<button class="action-btn" onclick="startFollowSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setFollowLevel(v) { followState.level = v; renderFollowSetup(); }
function setFollowTimer(v) { followState.timer = v; renderFollowSetup(); }
function toggleFollowText() { followState.showText = !followState.showText; renderFollowRound(); }
function followTagCount(board, tag) { return board.filter(function (it) { return it.t.indexOf(tag) > -1; }).length; }
// 보드 + 지시문 생성 (조건에 맞는 정답 수가 1~4, 오답이 넉넉하도록 재시도)
function genFollowRound(level) {
    for (var attempt = 0; attempt < 120; attempt++) {
        var board = pickN(FOLLOW_POOL, 9);
        var instr = null;
        if (level === 1) {
            if (Math.random() < 0.5) {
                var c = pickRandom(FOLLOW_COLORS);
                instr = { say: 'Touch everything that is ' + c + '.', ko: c + ' 색인 것을 모두 눌러요', test: function (it) { return it.t.indexOf(c) > -1; } };
            } else {
                var cat = pickRandom(FOLLOW_CATS);
                instr = { say: 'Touch all the ' + cat.say + '.', ko: cat.ko + '을(를) 모두 눌러요', test: (function (cg) { return function (it) { return it.t.indexOf(cg) > -1; }; })(cat.tag) };
            }
        } else if (level === 2) {
            // 이모지로 표현되지 않는 "the blue one / the small orange one"류를 없애고
            // "색깔 + 종류" 또는 "크기 + 동물"로만 출제 (정답 판정이 직관과 어긋나지 않게)
            if (Math.random() < 0.5) {
                var cat2 = pickRandom(FOLLOW_CATS.filter(function (fc) { return fc.tag !== 'clothes'; }));
                var c3 = pickRandom(FOLLOW_COLORS);
                instr = {
                    say: 'Touch the ' + c3 + ' ' + cat2.one + '.',
                    ko: c3 + ' 색인 ' + cat2.ko + '을(를) 눌러요',
                    test: (function (cc, cg) { return function (it) { return it.t.indexOf(cc) > -1 && it.t.indexOf(cg) > -1; }; })(c3, cat2.tag)
                };
            } else {
                var sz = pickRandom(['big', 'small']);
                instr = {
                    say: 'Touch the ' + sz + ' animal.',
                    ko: (sz === 'big' ? '큰' : '작은') + ' 동물을 눌러요',
                    test: (function (s) { return function (it) { return it.t.indexOf('animal') > -1 && it.t.indexOf(s) > -1; }; })(sz)
                };
            }
        } else {
            var r = Math.random();
            if (r < 0.34) {
                instr = { say: 'Touch everything that is NOT alive.', ko: '살아있지 않은 것을 모두 눌러요', test: function (it) { return it.t.indexOf('notalive') > -1; } };
            } else if (r < 0.67) {
                instr = { say: 'Touch the animals that can fly.', ko: '날 수 있는 동물을 눌러요', test: function (it) { return it.t.indexOf('animal') > -1 && it.t.indexOf('canfly') > -1; } };
            } else {
                var c4 = pickRandom(FOLLOW_COLORS);
                instr = { say: 'Touch everything that is NOT ' + c4 + '.', ko: c4 + ' 색이 아닌 것을 모두 눌러요', test: (function (cc) { return function (it) { return it.t.indexOf(cc) === -1; }; })(c4) };
            }
        }
        var matches = board.filter(instr.test);
        if (matches.length >= 1 && matches.length <= 4 && (board.length - matches.length) >= 3) {
            return { board: board, instr: instr, targets: matches.map(function (m) { return m.w; }) };
        }
    }
    // 실패 시 안전한 기본값
    var bd = pickN(FOLLOW_POOL, 9);
    return { board: bd, instr: { say: 'Touch all the animals.', ko: '동물을 모두 눌러요', test: function (it) { return it.t.indexOf('animal') > -1; } }, targets: bd.filter(function (it) { return it.t.indexOf('animal') > -1; }).map(function (m) { return m.w; }) };
}
function startFollowSession() {
    followState.round = 0;
    followState.cleared = 0;
    followState.startTime = Date.now();
    nextFollowRound();
}
function nextFollowRound() {
    var st = followState;
    st.round++;
    if (st.round > FOLLOW_TOTAL) { finishFollowSession(); return; }
    var g = genFollowRound(st.level);
    st.board = g.board;
    st.instr = g.instr;
    st.targets = g.targets.slice();
    st.found = [];
    st.wrongHits = 0;
    st.spoken = false;
    st.showText = false;
    st.timeLeft = 12;
    if (st.timerId) { clearInterval(st.timerId); st.timerId = null; }
    renderFollowRound();
    if (st.timer) {
        st.timerId = setInterval(function () {
            st.timeLeft -= 0.1;
            var bar = document.getElementById('engFollowBar');
            if (bar) bar.style.width = Math.max(0, (st.timeLeft / 12) * 100) + '%';
            if (st.timeLeft <= 0) {
                clearInterval(st.timerId); st.timerId = null;
                followRoundTimeout();
            }
        }, 100);
        activeTimers.push(st.timerId);
    }
}
function renderFollowRound() {
    ENG_TTS.rerender = renderFollowRound;
    var st = followState;
    var html = '<div class="game-title-box">🙋 지시 따라하기</div>';
    html += '<div class="status-row"><div>' + st.round + ' / ' + FOLLOW_TOTAL + ' 라운드</div><div>클리어: ' + st.cleared + '</div></div>';
    html += '<div class="eng-btn-row">' + engSpeakBtn('지시 다시 듣기') +
        '<button class="eng-mini-btn" onclick="toggleFollowText()">' + (st.showText ? '🙈 지시 숨기기' : '👁 지시 보기') + '</button>' +
        engBackBtn('initFollowInstructions') + '</div>';
    html += engSpeedRow();
    if (st.showText) {
        html += '<div class="game-sub-desc" style="text-align:center; font-weight:800; color:var(--primary); margin-top:0.5rem;">“' + st.instr.say + '”</div>';
        html += '<div class="game-sub-desc" style="text-align:center; margin-top:-0.4rem; color:#94a3b8; font-size:0.8rem;">(' + st.instr.ko + ')</div>';
    }
    if (st.timer) html += '<div class="timer-container"><div id="engFollowBar" class="timer-bar" style="width:' + ((st.timeLeft / 12) * 100) + '%;"></div></div>';
    html += '<div class="eng-board">';
    st.board.forEach(function (it, idx) {
        var done = st.found.indexOf(it.w) > -1;
        html += '<button class="eng-board-item' + (done ? ' eng-ok' : '') + '" ' + (done ? 'disabled' : '') + ' onclick="checkFollowHit(' + idx + ')">' + it.e + '</button>';
    });
    html += '</div>';
    html += '<div class="game-sub-desc" style="text-align:center;">찾은 개수: <b>' + st.found.length + ' / ' + st.targets.length + '</b></div>';
    html += '<div id="engFollowMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (!st.spoken) { st.spoken = true; engSpeak(st.instr.say); }
}
function checkFollowHit(idx) {
    var st = followState;
    var it = st.board[idx];
    if (st.found.indexOf(it.w) > -1) return;
    var btns = document.querySelectorAll('.eng-board-item');
    var msg = document.getElementById('engFollowMsg');
    if (st.targets.indexOf(it.w) > -1) {
        vibrateShort();
        st.found.push(it.w);
        btns[idx].classList.add('eng-ok');
        btns[idx].disabled = true;
        if (st.found.length >= st.targets.length) {
            if (st.timerId) { clearInterval(st.timerId); st.timerId = null; }
            st.cleared++;
            msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 다 찾았어요!'; playResultSound(true);
            var t = gameTimeout(nextFollowRound, 900);
        } else {
            renderFollowRound();
        }
    } else {
        st.wrongHits++;
        var b = btns[idx];
        b.classList.add('eng-no');
        var tt = gameTimeout(function () { b.classList.remove('eng-no'); }, 500);
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '앗, 이건 아니에요. 다시 들어볼까요? 🔊';
    }
}
function followRoundTimeout() {
    var st = followState;
    var msg = document.getElementById('engFollowMsg');
    if (msg) { msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '시간이 다 됐어요! 다음 라운드로 가요.'; }
    var t = gameTimeout(nextFollowRound, 1100);
}
function finishFollowSession() {
    var st = followState;
    if (st.timerId) { clearInterval(st.timerId); st.timerId = null; }
    var secs = Math.round((Date.now() - st.startTime) / 1000);
    var extra = '';
    try {
        var best = parseInt(localStorage.getItem('engFollowBest') || '0', 10);
        if (!best || secs < best) { localStorage.setItem('engFollowBest', String(secs)); extra = '⏱️ ' + secs + '초 — 최고 기록이에요! 🏆'; }
        else { extra = '⏱️ ' + secs + '초 (최고 기록: ' + best + '초)'; }
    } catch (e) { extra = '⏱️ ' + secs + '초'; }
    renderEngResult('🙋', '지시 따라하기', st.cleared, FOLLOW_TOTAL, 'initFollowInstructions', 'startFollowSession', extra);
}


// ===========================================================================
// 3. 문장 만들기 (sentenceScramble) 🧩
// ===========================================================================
// 항목: { l, s:'문장(마침표 없이)', e:'이모지 힌트', k:'한글 뜻', x:[미끼단어] (선택) }
var SCRAMBLE_DATA = [
    // 1단계: 3~4 단어
    { l: 1, s: 'The cat is sleeping', e: '🐱💤', k: '고양이가 자고 있어요' },
    { l: 1, s: 'I love my mom', e: '👦❤️👩', k: '나는 엄마를 사랑해요' },
    { l: 1, s: 'The sun is hot', e: '☀️🔥', k: '해는 뜨거워요' },
    { l: 1, s: 'Birds can fly', e: '🐦🕊️', k: '새는 날 수 있어요' },
    { l: 1, s: 'I like ice cream', e: '👦🍦', k: '나는 아이스크림을 좋아해요' },
    { l: 1, s: 'The dog is big', e: '🐶🐘', k: '그 개는 커요' },
    { l: 1, s: 'She is my friend', e: '👧🤝', k: '그 애는 내 친구예요' },
    { l: 1, s: 'We are happy', e: '😀😀', k: '우리는 행복해요' },
    { l: 1, s: 'The ball is red', e: '⚽🔴', k: '그 공은 빨개요' },
    { l: 1, s: 'Fish live in water', e: '🐟💧', k: '물고기는 물에 살아요' },
    { l: 1, s: 'I can jump high', e: '🤸⬆️', k: '나는 높이 뛸 수 있어요' },
    { l: 1, s: 'The baby is small', e: '👶🔹', k: '그 아기는 작아요' },
    { l: 1, s: 'He runs very fast', e: '🏃💨', k: '그는 아주 빨리 달려요' },
    { l: 1, s: 'Cats like to play', e: '🐱🧶', k: '고양이는 노는 걸 좋아해요' },
    { l: 1, s: 'The apple is sweet', e: '🍎🍯', k: '그 사과는 달아요' },
    { l: 1, s: 'My hat is blue', e: '🧢🔵', k: '내 모자는 파래요' },
    { l: 1, s: 'The moon is bright', e: '🌙✨', k: '달이 밝아요' },
    { l: 1, s: 'I see a star', e: '👀⭐', k: '나는 별을 봐요' },
    { l: 1, s: 'The frog is green', e: '🐸💚', k: '그 개구리는 초록색이에요' },
    { l: 1, s: 'We go to school', e: '🎒🏫', k: '우리는 학교에 가요' },
    // 2단계: 5~6 단어 (전치사구)
    { l: 2, s: 'The cat is on the bed', e: '🐱🛏️', k: '고양이가 침대 위에 있어요' },
    { l: 2, s: 'A dog is under the table', e: '🐶🪑', k: '개가 탁자 아래에 있어요' },
    { l: 2, s: 'The boy is behind the tree', e: '👦🌳', k: '남자아이가 나무 뒤에 있어요' },
    { l: 2, s: 'She is reading a book now', e: '👧📖', k: '그 애는 지금 책을 읽고 있어요' },
    { l: 2, s: 'We play in the park today', e: '🛝🌳', k: '우리는 오늘 공원에서 놀아요' },
    { l: 2, s: 'The bird is in the nest', e: '🐦🪺', k: '새가 둥지 안에 있어요' },
    { l: 2, s: 'I put the toy in the box', e: '🧸📦', k: '나는 장난감을 상자에 넣어요' },
    { l: 2, s: 'He is jumping over the fence', e: '👦🚧', k: '그는 울타리를 뛰어넘고 있어요' },
    { l: 2, s: 'The fish is swimming in the sea', e: '🐟🌊', k: '물고기가 바다에서 헤엄쳐요' },
    { l: 2, s: 'My mom is cooking in the kitchen', e: '👩🍳', k: '엄마가 부엌에서 요리하고 있어요' },
    { l: 2, s: 'The kite is high in the sky', e: '🪁☁️', k: '연이 하늘 높이 있어요' },
    { l: 2, s: 'Two cats are sleeping on the sofa', e: '🐱🐱🛋️', k: '고양이 두 마리가 소파에서 자고 있어요' },
    { l: 2, s: 'The red car is next to the house', e: '🚗🏠', k: '빨간 차가 집 옆에 있어요' },
    { l: 2, s: 'A frog is sitting on a rock', e: '🐸🪨', k: '개구리가 바위 위에 앉아 있어요' },
    { l: 2, s: 'The children are playing with a ball', e: '🧒⚽', k: '아이들이 공을 가지고 놀고 있어요' },
    { l: 2, s: 'I can see a rainbow after the rain', e: '🌈🌧️', k: '비 온 뒤에 무지개가 보여요' },
    { l: 2, s: 'The teacher is writing on the board', e: '👩‍🏫📝', k: '선생님이 칠판에 쓰고 있어요' },
    { l: 2, s: 'Grandma is sitting in the big chair', e: '👵🪑', k: '할머니가 큰 의자에 앉아 있어요' },
    { l: 2, s: 'The dog runs fast to the door', e: '🐶🚪', k: '개가 문으로 빨리 달려가요' },
    { l: 2, s: 'A bee is on the yellow flower', e: '🐝🌼', k: '벌이 노란 꽃 위에 있어요' },
    // 3단계: 7단어 이상 / 복문 / 미끼 단어
    { l: 3, s: 'The girl is reading a book and drinking juice', e: '👧📖🥤', k: '여자아이가 책을 읽으면서 주스를 마셔요', x: ['eating'] },
    { l: 3, s: 'The boy is running fast because he is late', e: '👦🏃⏰', k: '남자아이가 늦어서 빨리 달려요', x: ['slowly'] },
    { l: 3, s: 'My dog likes to eat and sleep all day', e: '🐶🍽️💤', k: '내 개는 하루 종일 먹고 자는 걸 좋아해요', x: ['night'] },
    { l: 3, s: 'We went to the zoo and saw a lion', e: '🦁🚌', k: '우리는 동물원에 가서 사자를 봤어요', x: ['tiger'] },
    { l: 3, s: 'She is happy because it is her birthday today', e: '🎂😀', k: '오늘이 생일이라서 그 애는 행복해요', x: ['sad'] },
    { l: 3, s: 'The cat jumped on the table and knocked the cup', e: '🐱🥤', k: '고양이가 탁자에 뛰어올라 컵을 넘어뜨렸어요', x: ['under'] },
    { l: 3, s: 'I want to play outside but it is raining', e: '🌧️😔', k: '밖에서 놀고 싶은데 비가 와요', x: ['sunny'] },
    { l: 3, s: 'He opened the door and turned on the light', e: '🚪💡', k: '그는 문을 열고 불을 켰어요', x: ['off'] },
    { l: 3, s: 'After lunch we will go to the playground', e: '🍱🛝', k: '점심을 먹고 나서 우리는 놀이터에 갈 거예요', x: ['before'] },
    { l: 3, s: 'The little bird flew away from the big cat', e: '🐦🐱', k: '작은 새가 큰 고양이에게서 날아갔어요', x: ['toward'] },
    { l: 3, s: 'Mom made a cake and we ate it together', e: '🍰👨‍👩‍👧', k: '엄마가 케이크를 만들고 우리는 함께 먹었어요', x: ['bought'] },
    { l: 3, s: 'The dog is barking because it hears a noise', e: '🐶🔊', k: '개가 소리를 들어서 짖고 있어요', x: ['quiet'] },
    { l: 3, s: 'We planted a tree and gave it some water', e: '🌳💧', k: '우리는 나무를 심고 물을 줬어요', x: ['cut'] },
    { l: 3, s: 'The baby is crying because she is very hungry', e: '👶😭', k: '아기가 너무 배고파서 울고 있어요', x: ['full'] },
    { l: 3, s: 'He put on his coat and went out to play', e: '🧥🚪', k: '그는 외투를 입고 놀러 나갔어요', x: ['inside'] },
    { l: 3, s: 'The sun came out after the rain stopped', e: '🌦️', k: '비가 그친 뒤에 해가 나왔어요', x: ['before'] }
];
var SCRAMBLE_TOTAL = 8;
var scrambleState = {};
function initSentenceScramble() { engEnter(); renderScrambleSetup(); }
function renderScrambleSetup() {
    ENG_TTS.rerender = renderScrambleSetup;
    if (!scrambleState.level) scrambleState.level = 1;
    var html = '<div class="game-title-box">🧩 문장 만들기</div>';
    html += '<div class="game-sub-desc">흩어진 단어 카드를 순서대로 눌러서 올바른 영어 문장을 만들어요. 위의 그림이 힌트예요!</div>';
    html += engTTSNote();
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    [{ v: 1, l: '1단계 · 3~4단어' }, { v: 2, l: '2단계 · 5~6단어' }, { v: 3, l: '3단계 · 긴 문장·미끼' }].forEach(function (t) {
        html += '<button class="setup-btn' + (scrambleState.level === t.v ? ' active' : '') + '" onclick="setScrambleLevel(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">읽기 속도 (정답이면 문장을 읽어줘요)</div>' + engSpeedRow('');
    html += '<button class="action-btn" onclick="startScrambleSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setScrambleLevel(v) { scrambleState.level = v; renderScrambleSetup(); }
function startScrambleSession() {
    var pool = shuffleArray(SCRAMBLE_DATA.filter(function (x) { return x.l === scrambleState.level; }));
    var qs = pool.slice(0, SCRAMBLE_TOTAL);
    while (qs.length < SCRAMBLE_TOTAL && pool.length > 0) qs.push(pool[qs.length % pool.length]);
    scrambleState.queue = qs;
    scrambleState.i = 0;
    scrambleState.correct = 0;
    scrambleState.hintPenalty = 0;
    scrambleState.revealedFor = -1;
    loadScrambleRound();
}
function loadScrambleRound() {
    var st = scrambleState;
    var item = st.queue[st.i];
    st.words = item.s.split(' ');
    var pool = st.words.slice();
    if (item.x) pool = pool.concat(item.x);
    st.pool = shuffleArray(pool.map(function (w, idx) { return { w: w, id: idx, used: false }; }));
    st.slots = [];
    st.firstTry = true;
    st.showKo = false;
    st.done = false;
    renderScrambleRound();
}
function renderScrambleRound() {
    ENG_TTS.rerender = renderScrambleRound;
    var st = scrambleState;
    if (typeof reportGameRound === 'function') reportGameRound(Math.round(st.correct));
    var item = st.queue[st.i];
    var html = '<div class="game-title-box">🧩 문장 만들기</div>';
    html += '<div class="status-row"><div>' + (st.i + 1) + ' / ' + SCRAMBLE_TOTAL + '</div><div>정답: ' + st.correct + '</div></div>';
    html += '<div style="text-align:center; font-size:2.4rem; margin:0.4rem 0;">' + item.e + '</div>';
    html += engSpeedRow();
    html += '<div class="eng-slot-row">';
    for (var i = 0; i < st.words.length; i++) {
        var filled = st.slots[i];
        html += '<button class="eng-slot' + (filled ? ' filled' : '') + '" ' + (filled ? 'onclick="scrambleRemoveSlot(' + i + ')"' : 'disabled') + '>' + (filled ? filled.w : '') + '</button>';
    }
    html += '</div>';
    html += '<div class="eng-wordpool">';
    st.pool.forEach(function (c) {
        html += '<button class="eng-word-card' + (c.used ? ' used' : '') + '" ' + (c.used ? 'disabled' : '') + ' onclick="scramblePick(' + c.id + ')">' + c.w + '</button>';
    });
    html += '</div>';
    html += '<div id="engScrambleMsg" class="msg-box"></div>';
    if (!st.done) {
        html += '<div class="options-grid" style="grid-template-columns:1fr 1fr; gap:0.4rem;">';
        html += '<button class="action-btn secondary" onclick="scrambleClear()">↩ 모두 비우기</button>';
        html += '<button class="action-btn secondary" onclick="scrambleToggleKo()">' + (st.showKo ? '뜻 숨기기' : '한글 뜻 보기 (별 -1)') + '</button>';
        html += '<button class="action-btn secondary" onclick="initSentenceScramble()">⏮ 처음으로</button>';
        html += '<button class="action-btn secondary" onclick="scrambleReveal()">💡 정답 보기</button>';
        html += '</div>';
        if (st.showKo) html += '<div class="game-sub-desc" style="text-align:center;">' + item.k + '</div>';
    }
    document.getElementById('mainArea').innerHTML = html;
}
function scramblePick(id) {
    var st = scrambleState;
    if (st.done) return;
    var card = null;
    for (var i = 0; i < st.pool.length; i++) if (st.pool[i].id === id) card = st.pool[i];
    if (!card || card.used) return;
    var slotIdx = st.slots.length;
    if (slotIdx >= st.words.length) return;
    vibrateShort();
    card.used = true;
    st.slots.push({ w: card.w, id: id });
    if (st.slots.length === st.words.length) { checkScramble(); }
    else renderScrambleRound();
}
function scrambleRemoveSlot(i) {
    var st = scrambleState;
    if (st.done) return;
    if (i !== st.slots.length - 1) {
        // 중간 슬롯을 누르면 그 뒤 카드까지 모두 풀로 되돌림
        while (st.slots.length > i) {
            var last = st.slots.pop();
            for (var k = 0; k < st.pool.length; k++) if (st.pool[k].id === last.id) st.pool[k].used = false;
        }
    } else {
        var last2 = st.slots.pop();
        for (var k2 = 0; k2 < st.pool.length; k2++) if (st.pool[k2].id === last2.id) st.pool[k2].used = false;
    }
    renderScrambleRound();
}
function scrambleClear() {
    var st = scrambleState;
    if (st.done) return;
    st.slots = [];
    st.pool.forEach(function (c) { c.used = false; });
    renderScrambleRound();
}
function scrambleToggleKo() {
    var st = scrambleState;
    if (st.done) return;
    if (!st.showKo && !st._koCounted) { st.hintPenalty++; st._koCounted = true; }
    st.showKo = !st.showKo;
    renderScrambleRound();
}
function checkScramble() {
    var st = scrambleState;
    var made = st.slots.map(function (s) { return s.w; }).join(' ');
    var target = st.words.join(' ');
    var msg;
    st._koCounted = false;
    if (made === target) {
        st.done = true;
        if (st.revealedFor === st.i) { /* 정답을 봤으면 점수 없음 */ }
        else if (st.firstTry && st.hintPenalty === 0) st.correct++;
        else if (st.firstTry) st.correct += 0.5;
        renderScrambleRound();
        msg = document.getElementById('engScrambleMsg');
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 완성! ' + target + '.'; playResultSound(true);
        engSpeak(target + '.', 0);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" style="width:100%;" onclick="scrambleNext()">다음 ▶</button>');
    } else {
        st.firstTry = false;
        renderScrambleRound();
        msg = document.getElementById('engScrambleMsg');
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '음... 순서를 다시 생각해볼까요? 🤔';
        // 슬롯 흔들기
        var row = document.querySelector('.eng-slot-row');
        if (row) { row.classList.add('eng-shake'); var t = gameTimeout(function () { row.classList.remove('eng-shake'); }, 500); }
    }
}
function scrambleReveal() {
    var st = scrambleState;
    if (st.done) return;
    st.done = true;
    st.revealedFor = st.i;
    // 슬롯을 정답으로 채워 보여줌
    st.slots = st.words.map(function (w, i) { return { w: w, id: -100 - i }; });
    st.pool.forEach(function (c) { c.used = true; });
    renderScrambleRound();
    var msg = document.getElementById('engScrambleMsg');
    msg.className = 'msg-box bad'; msg.style.display = 'block';
    msg.innerText = '💡 정답: ' + st.words.join(' ') + '.';
    engSpeak(st.words.join(' ') + '.', 0);
    document.getElementById('mainArea').insertAdjacentHTML('beforeend',
        '<div class="options-grid" style="grid-template-columns:1fr 1fr; gap:0.4rem;">' +
        '<button class="action-btn secondary" onclick="loadScrambleRound()">🔁 다시 풀기</button>' +
        '<button class="action-btn" onclick="scrambleNext()">다음 ▶</button>' +
        '</div>' +
        '<div style="text-align:center; margin-top:0.4rem;">' + engBackBtn('initSentenceScramble') + '</div>');
}
function scrambleNext() {
    var st = scrambleState;
    st.i++;
    st.hintPenalty = 0;
    if (st.i >= SCRAMBLE_TOTAL) {
        renderEngResult('🧩', '문장 만들기', Math.round(st.correct), SCRAMBLE_TOTAL, 'initSentenceScramble', 'startScrambleSession');
        return;
    }
    loadScrambleRound();
}


// ===========================================================================
// 4. 빈칸 채우기 (fillInBlank) ✏️
// ===========================================================================
// 항목: { p:문법포인트, e:이모지, pre:앞부분, post:뒷부분, o:[보기], a:정답, w:이유(한글) }
var FILL_DATA = [
    // be동사
    { p: 'be', e: '🐱', pre: 'The cat', post: 'sleeping.', o: ['is', 'are'], a: 'is', w: '고양이 한 마리라서 is예요.' },
    { p: 'be', e: '🐶🐶', pre: 'The dogs', post: 'barking.', o: ['is', 'are'], a: 'are', w: '개가 여러 마리라서 are예요.' },
    { p: 'be', e: '🙂', pre: 'I', post: 'happy.', o: ['am', 'is'], a: 'am', w: "'나(I)'는 항상 am이에요." },
    { p: 'be', e: '👧', pre: 'She', post: 'my friend.', o: ['is', 'are'], a: 'is', w: '한 사람(she)이라서 is예요.' },
    { p: 'be', e: '🧒🧒', pre: 'They', post: 'playing.', o: ['is', 'are'], a: 'are', w: '여러 명(they)이라서 are예요.' },
    { p: 'be', e: '👶', pre: 'The baby', post: 'crying.', o: ['is', 'are'], a: 'is', w: '아기 한 명이라서 is예요.' },
    { p: 'be', e: '👦👧', pre: 'We', post: 'ready.', o: ['is', 'are'], a: 'are', w: "'우리(we)'라서 are예요." },
    { p: 'be', e: '⚽', pre: 'The ball', post: 'red.', o: ['is', 'are'], a: 'is', w: '공 하나라서 is예요.' },
    { p: 'be', e: '🐦🐦', pre: 'Birds', post: 'singing.', o: ['is', 'are'], a: 'are', w: '새가 여러 마리라서 are예요.' },
    { p: 'be', e: '🌳', pre: 'The tree', post: 'very tall.', o: ['is', 'are'], a: 'is', w: '나무 하나라서 is예요.' },
    // 지시대명사 this / these
    { p: 'this', e: '🍎', pre: '', post: 'apple is sweet.', o: ['This', 'These'], a: 'This', w: '사과 하나라서 This예요.' },
    { p: 'this', e: '🍏🍏', pre: '', post: 'apples are green.', o: ['This', 'These'], a: 'These', w: '사과가 여러 개라서 These예요.' },
    { p: 'this', e: '🐱🐱', pre: 'Look at', post: 'cats!', o: ['this', 'these'], a: 'these', w: '여러 마리라서 these예요.' },
    { p: 'this', e: '🍪', pre: 'I want', post: 'cookie.', o: ['this', 'these'], a: 'this', w: '하나라서 this예요.' },
    { p: 'this', e: '👟👟', pre: '', post: 'shoes are new.', o: ['This', 'These'], a: 'These', w: '신발은 두 짝이라서 These예요.' },
    { p: 'this', e: '📕', pre: 'Give me', post: 'book.', o: ['this', 'these'], a: 'this', w: '한 권이라서 this예요.' },
    { p: 'this', e: '⭐⭐⭐', pre: '', post: 'stars are bright.', o: ['This', 'These'], a: 'These', w: '별이 여러 개라서 These예요.' },
    { p: 'this', e: '🎈', pre: '', post: 'balloon is mine.', o: ['This', 'These'], a: 'This', w: '풍선 하나라서 This예요.' },
    // 관사 a / an
    { p: 'article', e: '🐘', pre: 'I see', post: 'elephant.', o: ['a', 'an'], a: 'an', w: "elephant는 'e' 소리로 시작해서 an이에요." },
    { p: 'article', e: '🐶', pre: 'She has', post: 'dog.', o: ['a', 'an'], a: 'a', w: 'dog는 자음 소리로 시작해서 a예요.' },
    { p: 'article', e: '🍎', pre: 'He ate', post: 'apple.', o: ['a', 'an'], a: 'an', w: "apple은 'a' 소리로 시작해서 an이에요." },
    { p: 'article', e: '☂️', pre: 'It is', post: 'umbrella.', o: ['a', 'an'], a: 'an', w: "umbrella는 'u' 소리라서 an이에요." },
    { p: 'article', e: '🍌', pre: 'I want', post: 'banana.', o: ['a', 'an'], a: 'a', w: "banana는 'b' 소리라서 a예요." },
    { p: 'article', e: '🍊', pre: 'That is', post: 'orange.', o: ['a', 'an'], a: 'an', w: "orange는 'o' 소리라서 an이에요." },
    { p: 'article', e: '🦉', pre: 'We saw', post: 'owl.', o: ['a', 'an'], a: 'an', w: "owl은 'o' 소리라서 an이에요." },
    { p: 'article', e: '✏️', pre: 'I have', post: 'pencil.', o: ['a', 'an'], a: 'a', w: "pencil은 'p' 소리라서 a예요." },
    { p: 'article', e: '🥚', pre: 'She wants', post: 'egg.', o: ['a', 'an'], a: 'an', w: "egg는 'e' 소리라서 an이에요." },
    // 동사 3인칭 단수 -s
    { p: 'verb3s', e: '🐶🏃', pre: 'The dog', post: 'every morning.', o: ['run', 'runs'], a: 'runs', w: '주어가 he/she/it(dog)이면 동사에 -s를 붙여요.' },
    { p: 'verb3s', e: '🚶', pre: 'I', post: 'to school.', o: ['walk', 'walks'], a: 'walk', w: "주어가 'I'면 -s를 안 붙여요." },
    { p: 'verb3s', e: '👧🍎', pre: 'She', post: 'apples.', o: ['like', 'likes'], a: 'likes', w: '주어가 she라서 likes예요.' },
    { p: 'verb3s', e: '🧒⚽', pre: 'They', post: 'soccer.', o: ['play', 'plays'], a: 'play', w: '주어가 they(여러 명)라서 -s를 안 붙여요.' },
    { p: 'verb3s', e: '🐱💤', pre: 'My cat', post: 'a lot.', o: ['sleep', 'sleeps'], a: 'sleeps', w: '주어가 cat(it)이라서 sleeps예요.' },
    { p: 'verb3s', e: '📚', pre: 'We', post: 'books.', o: ['read', 'reads'], a: 'read', w: '주어가 we라서 -s를 안 붙여요.' },
    { p: 'verb3s', e: '🏃', pre: 'He', post: 'fast.', o: ['run', 'runs'], a: 'runs', w: '주어가 he라서 runs예요.' },
    { p: 'verb3s', e: '🐦', pre: 'The bird', post: 'in the sky.', o: ['fly', 'flies'], a: 'flies', w: '주어가 bird(it)라서 flies예요.' },
    { p: 'verb3s', e: '👶😭', pre: 'The baby', post: 'at night.', o: ['cry', 'cries'], a: 'cries', w: '주어가 baby(it/she)라서 cries예요.' },
    // 현재진행형 -ing
    { p: 'ing', e: '👶💤', pre: 'Look! The baby is', post: '.', o: ['sleep', 'sleeping'], a: 'sleeping', w: '지금 하고 있는 일은 -ing를 붙여요.' },
    { p: 'ing', e: '🧒⚽', pre: 'The kids are', post: 'now.', o: ['play', 'playing'], a: 'playing', w: '지금 일어나는 일이라 playing이에요.' },
    { p: 'ing', e: '👧🎨', pre: 'She is', post: 'a picture.', o: ['draw', 'drawing'], a: 'drawing', w: '지금 하는 중이라 drawing이에요.' },
    { p: 'ing', e: '👦🍱', pre: 'I am', post: 'my lunch.', o: ['eat', 'eating'], a: 'eating', w: '지금 먹는 중이라 eating이에요.' },
    { p: 'ing', e: '🐶📢', pre: 'The dog is', post: 'at the door.', o: ['bark', 'barking'], a: 'barking', w: '지금 짖는 중이라 barking이에요.' },
    { p: 'ing', e: '🎵', pre: 'We are', post: 'to music.', o: ['listen', 'listening'], a: 'listening', w: '지금 듣는 중이라 listening이에요.' },
    { p: 'ing', e: '👦🚲', pre: 'He is', post: 'a bike.', o: ['ride', 'riding'], a: 'riding', w: '지금 타는 중이라 riding이에요. (ride의 e가 빠져요)' },
    { p: 'ing', e: '👩🏃', pre: 'Mom is', post: 'in the park.', o: ['run', 'running'], a: 'running', w: '지금 달리는 중이라 running이에요. (n을 한 번 더 써요)' },
    // 전치사 in / on / under
    { p: 'prep', e: '🐱📦', pre: 'The cat is', post: 'the box.', o: ['in', 'on', 'under'], a: 'in', w: "상자 '안'에 있으니까 in이에요." },
    { p: 'prep', e: '📕🪑', pre: 'The book is', post: 'the table.', o: ['in', 'on', 'under'], a: 'on', w: "탁자 '위'에 있으니까 on이에요." },
    { p: 'prep', e: '⚽🪑', pre: 'The ball is', post: 'the chair.', o: ['in', 'on', 'under'], a: 'under', w: "의자 '아래'에 있으니까 under예요." },
    { p: 'prep', e: '🐟💧', pre: 'The fish are', post: 'the water.', o: ['in', 'on', 'under'], a: 'in', w: "물 '안'이라서 in이에요." },
    { p: 'prep', e: '☕', pre: 'The cup is', post: 'the shelf.', o: ['in', 'on', 'under'], a: 'on', w: "선반 '위'라서 on이에요." },
    { p: 'prep', e: '🐶🛏️', pre: 'The dog is', post: 'the bed.', o: ['in', 'on', 'under'], a: 'under', w: "침대 '아래'라서 under예요." },
    { p: 'prep', e: '🐦', pre: 'The bird is', post: 'the cage.', o: ['in', 'on', 'under'], a: 'in', w: "새장 '안'이라서 in이에요." },
    { p: 'prep', e: '🧢', pre: 'The hat is', post: 'your head.', o: ['in', 'on', 'under'], a: 'on', w: "머리 '위'라서 on이에요." },
    { p: 'prep', e: '🐭', pre: 'The mouse is', post: 'the sofa.', o: ['in', 'on', 'under'], a: 'under', w: "소파 '아래'라서 under예요." }
];
var FILL_TOTAL = 10;
var fillState = {};
function initFillInBlank() { engEnter(); renderFillSetup(); }
function renderFillSetup() {
    ENG_TTS.rerender = renderFillSetup;
    var html = '<div class="game-title-box">✏️ 빈칸 채우기</div>';
    html += '<div class="game-sub-desc">그림을 보고, 빈칸에 알맞은 단어를 골라요. 왜 그런지 규칙도 같이 알려줘요!</div>';
    html += engTTSNote();
    html += '<div class="game-sub-desc" style="text-align:center;">문법 포인트(be동사·this/these·a/an·-s·-ing·in/on/under)를 <b>섞어서</b> 10문제 나와요.</div>';
    html += '<div class="setup-section-label">읽기 속도</div>' + engSpeedRow('');
    html += '<button class="action-btn" onclick="startFillSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function startFillSession() {
    // 포인트를 골고루 섞기
    var byPoint = {};
    FILL_DATA.forEach(function (d) { (byPoint[d.p] = byPoint[d.p] || []).push(d); });
    var points = Object.keys(byPoint);
    points.forEach(function (p) { byPoint[p] = shuffleArray(byPoint[p]); });
    var qs = [];
    var pi = 0;
    while (qs.length < FILL_TOTAL) {
        var p = points[pi % points.length];
        if (byPoint[p].length) qs.push(byPoint[p].pop());
        pi++;
        if (pi > 200) break;
    }
    fillState.queue = shuffleArray(qs).slice(0, FILL_TOTAL);
    fillState.i = 0;
    fillState.correct = 0;
    fillState.firstTry = true;
    fillState.answered = false;
    renderFillRound();
}
function fillSentenceText(item) {
    return (item.pre ? item.pre + ' ' : '') + '___ ' + item.post;
}
function renderFillRound() {
    ENG_TTS.rerender = renderFillRound;
    var st = fillState;
    if (typeof reportGameRound === 'function') reportGameRound(st.correct);
    var item = st.queue[st.i];
    if (!st.opts || st.optsFor !== st.i) { st.opts = shuffleArray(item.o.slice()); st.optsFor = st.i; }
    var html = '<div class="game-title-box">✏️ 빈칸 채우기</div>';
    html += '<div class="status-row"><div>' + (st.i + 1) + ' / ' + FILL_TOTAL + '</div><div>정답: ' + st.correct + '</div></div>';
    html += '<div style="text-align:center; font-size:2.6rem; margin:0.5rem 0;">' + item.e + '</div>';
    html += '<div class="eng-blank-sentence">' + (item.pre ? item.pre + ' ' : '') + '<span class="eng-blank">?</span> ' + item.post + '</div>';
    html += '<div class="eng-btn-row">' + engSpeakBtn('문장 듣기') + engBackBtn('initFillInBlank') + '</div>';
    html += engSpeedRow();
    html += '<div class="options-grid"' + (item.o.length === 3 ? ' style="grid-template-columns:1fr 1fr 1fr;"' : '') + '>';
    st.opts.forEach(function (op, idx) {
        html += '<button class="opt-btn" style="font-size:1.1rem;" data-i="' + idx + '" onclick="checkFill(' + idx + ')">' + op + '</button>';
    });
    html += '</div>';
    html += '<div id="engFillMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (!st.spoken) { st.spoken = true; engSpeak(fillSentenceText(item).replace('___', 'blank')); }
}
function checkFill(idx) {
    var st = fillState;
    if (st.answered) return;
    var item = st.queue[st.i];
    var chosen = st.opts[idx];
    var btns = document.querySelectorAll('#mainArea .opt-btn');
    var msg = document.getElementById('engFillMsg');
    if (chosen === item.a) {
        st.answered = true;
        vibrateShort();
        btns[idx].classList.add('correct');
        if (st.firstTry) st.correct++;
        var full = (item.pre ? item.pre + ' ' : '') + item.a + ' ' + item.post;
        engSpeak(full, 0);
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 맞아요! “' + full + '”'; playResultSound(true);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" style="width:100%;" onclick="fillNext()">다음 ▶</button>');
    } else {
        st.firstTry = false;
        btns[idx].classList.add('wrong');
        var b = btns[idx];
        var tt = gameTimeout(function () { b.classList.remove('wrong'); }, 500);
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '💡 ' + item.w + ' 다시 골라볼까요?';
    }
}
function fillNext() {
    var st = fillState;
    st.i++;
    if (st.i >= FILL_TOTAL) {
        renderEngResult('✏️', '빈칸 채우기', st.correct, FILL_TOTAL, 'initFillInBlank', 'startFillSession');
        return;
    }
    st.firstTry = true;
    st.answered = false;
    st.spoken = false;
    renderFillRound();
}


// ===========================================================================
// 5. 단어 분류하기 (wordSort) 🗂️
// ===========================================================================
var WORDSORT_CATS = {
    animals: { ko: '동물', bin: '🐾 animals', words: [
        { e: '🐶', w: 'dog' }, { e: '🐱', w: 'cat' }, { e: '🐰', w: 'rabbit' }, { e: '🐻', w: 'bear' }, { e: '🦁', w: 'lion' },
        { e: '🐯', w: 'tiger' }, { e: '🐸', w: 'frog' }, { e: '🐷', w: 'pig' }, { e: '🐮', w: 'cow' }, { e: '🐔', w: 'hen' },
        { e: '🐦', w: 'bird' }, { e: '🐟', w: 'fish' }, { e: '🐢', w: 'turtle' }, { e: '🐘', w: 'elephant' }, { e: '🐵', w: 'monkey' },
        { e: '🦒', w: 'giraffe' }, { e: '🦓', w: 'zebra' }, { e: '🐴', w: 'horse' }
    ] },
    food: { ko: '음식', bin: '🍽️ food', words: [
        { e: '🍎', w: 'apple' }, { e: '🍌', w: 'banana' }, { e: '🍇', w: 'grapes' }, { e: '🍓', w: 'berry' }, { e: '🍊', w: 'orange' },
        { e: '🍞', w: 'bread' }, { e: '🧀', w: 'cheese' }, { e: '🍪', w: 'cookie' }, { e: '🍰', w: 'cake' }, { e: '🍕', w: 'pizza' },
        { e: '🍔', w: 'burger' }, { e: '🍦', w: 'ice cream' }, { e: '🥚', w: 'egg' }, { e: '🥛', w: 'milk' }, { e: '🍚', w: 'rice' },
        { e: '🍜', w: 'noodles' }, { e: '🌽', w: 'corn' }, { e: '🥕', w: 'carrot' }
    ] },
    colors: { ko: '색깔', bin: '🎨 colors', words: [
        { e: '🔴', w: 'red' }, { e: '🟠', w: 'orange' }, { e: '🟡', w: 'yellow' }, { e: '🟢', w: 'green' }, { e: '🔵', w: 'blue' },
        { e: '🟣', w: 'purple' }, { e: '🟤', w: 'brown' }, { e: '⚫', w: 'black' }, { e: '⚪', w: 'white' }, { e: '🩷', w: 'pink' }
    ] },
    feelings: { ko: '감정', bin: '😊 feelings', words: [
        { e: '😀', w: 'happy' }, { e: '😢', w: 'sad' }, { e: '😠', w: 'angry' }, { e: '😨', w: 'scared' }, { e: '😴', w: 'sleepy' },
        { e: '😲', w: 'surprised' }, { e: '😍', w: 'excited' }, { e: '😳', w: 'shy' }, { e: '🤢', w: 'sick' }, { e: '😌', w: 'calm' }
    ] },
    weather: { ko: '날씨', bin: '🌤️ weather', words: [
        { e: '☀️', w: 'sunny' }, { e: '🌧️', w: 'rainy' }, { e: '⛅', w: 'cloudy' }, { e: '❄️', w: 'snowy' }, { e: '🌈', w: 'rainbow' },
        { e: '💨', w: 'windy' }, { e: '⛈️', w: 'stormy' }, { e: '🌫️', w: 'foggy' }, { e: '🥵', w: 'hot' }, { e: '🥶', w: 'cold' }
    ] },
    body: { ko: '몸', bin: '🧍 body', words: [
        { e: '👁️', w: 'eye' }, { e: '👂', w: 'ear' }, { e: '👃', w: 'nose' }, { e: '👄', w: 'mouth' }, { e: '🖐️', w: 'hand' },
        { e: '🦶', w: 'foot' }, { e: '🦵', w: 'leg' }, { e: '💪', w: 'arm' }, { e: '🦷', w: 'tooth' }, { e: '👅', w: 'tongue' }
    ] },
    school: { ko: '학용품', bin: '🎒 school', words: [
        { e: '✏️', w: 'pencil' }, { e: '📕', w: 'book' }, { e: '🎒', w: 'backpack' }, { e: '📏', w: 'ruler' }, { e: '✂️', w: 'scissors' },
        { e: '🖍️', w: 'crayon' }, { e: '📓', w: 'notebook' }, { e: '🖊️', w: 'pen' }, { e: '📐', w: 'triangle' }, { e: '🧴', w: 'glue' }
    ] }
};
var WORDSORT_KEYS = Object.keys(WORDSORT_CATS);
var wordSortState = {};
function initWordSort() { engEnter(); renderWordSortSetup(); }
function renderWordSortSetup() {
    ENG_TTS.rerender = renderWordSortSetup;
    if (!wordSortState.level) wordSortState.level = 1;
    var html = '<div class="game-title-box">🗂️ 단어 분류하기</div>';
    html += '<div class="game-sub-desc">단어 카드를 누른 다음, 알맞은 통을 눌러서 분류해요. (카드 → 통 2번 누르기)</div>';
    html += engTTSNote();
    html += '<div class="setup-section-label">난이도 (통 개수)</div><div class="setup-btn-group">';
    [{ v: 1, l: '1단계 · 통 2개' }, { v: 2, l: '2단계 · 통 3개' }, { v: 3, l: '3단계 · 통 4개' }].forEach(function (t) {
        html += '<button class="setup-btn' + (wordSortState.level === t.v ? ' active' : '') + '" onclick="setWordSortLevel(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">읽기 속도 (카드를 누르면 읽어줘요)</div>' + engSpeedRow('');
    html += '<button class="action-btn" onclick="startWordSortSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setWordSortLevel(v) { wordSortState.level = v; renderWordSortSetup(); }
function startWordSortSession() {
    var nCats = wordSortState.level + 1; // 2,3,4
    var cats = pickN(WORDSORT_KEYS, nCats);
    var cardsPerCat = Math.ceil(13 / nCats);
    var cards = [];
    cats.forEach(function (ck) {
        var pool = shuffleArray(WORDSORT_CATS[ck].words.slice()).slice(0, cardsPerCat);
        pool.forEach(function (p) { cards.push({ e: p.e, w: p.w, cat: ck }); });
    });
    cards = shuffleArray(cards).slice(0, 13);
    wordSortState.cats = cats;
    wordSortState.cards = cards;
    wordSortState.placed = 0;
    wordSortState.wrong = 0;
    wordSortState.selected = null;
    wordSortState.startTime = Date.now();
    renderWordSortRound();
}
function renderWordSortRound() {
    ENG_TTS.rerender = renderWordSortRound;
    var st = wordSortState;
    if (typeof reportGameRound === 'function') reportGameRound(Math.max(0, st.placed - st.wrong));
    var html = '<div class="game-title-box">🗂️ 단어 분류하기</div>';
    html += '<div class="game-sub-desc" style="text-align:center; margin-bottom:0.4rem;">단어 카드를 누른 다음, 알맞은 통을 눌러서 분류해요. <b>(카드 → 통 2번 누르기)</b></div>';
    html += '<div class="status-row"><div>' + st.placed + ' / ' + st.cards.length + ' 분류</div><div>실수: ' + st.wrong + '</div></div>';
    html += '<div class="eng-btn-row">' + engBackBtn('initWordSort') + '</div>';
    html += engSpeedRow();
    html += '<div class="eng-bin-row">';
    st.cats.forEach(function (ck) {
        html += '<button class="eng-bin" onclick="wordSortDrop(\'' + ck + '\')">' + WORDSORT_CATS[ck].bin + '</button>';
    });
    html += '</div>';
    html += '<div class="eng-sort-pool">';
    st.cards.forEach(function (c, idx) {
        if (c.done) {
            html += '<div class="eng-sort-card done">' + c.e + '</div>';
        } else {
            var sel = st.selected === idx;
            html += '<button class="eng-sort-card' + (sel ? ' sel' : '') + '" onclick="wordSortSelect(' + idx + ')">' + c.e + '<span class="eng-sort-w">' + c.w + '</span></button>';
        }
    });
    html += '</div>';
    html += '<div id="engSortMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function wordSortSelect(idx) {
    var st = wordSortState;
    if (st.cards[idx].done) return;
    vibrateShort();
    st.selected = (st.selected === idx) ? null : idx;
    engSpeak(st.cards[idx].w, 0);
    renderWordSortRound();
}
function wordSortDrop(ck) {
    var st = wordSortState;
    if (st.selected === null || st.selected === undefined) {
        var m0 = document.getElementById('engSortMsg');
        m0.className = 'msg-box bad'; m0.style.display = 'block'; m0.innerText = '먼저 아래에서 단어 카드를 골라요!';
        return;
    }
    var card = st.cards[st.selected];
    var bins = document.querySelectorAll('.eng-bin');
    var binIdx = st.cats.indexOf(ck);
    var msg = document.getElementById('engSortMsg');
    if (card.cat === ck) {
        vibrateShort();
        card.done = true;
        st.placed++;
        st.selected = null;
        if (st.placed >= st.cards.length) {
            finishWordSort();
            return;
        }
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '✅ 맞아요!';
        renderWordSortRound();
    } else {
        st.wrong++;
        if (bins[binIdx]) {
            bins[binIdx].classList.add('eng-shake', 'eng-no');
            var b = bins[binIdx];
            var t = gameTimeout(function () { b.classList.remove('eng-shake', 'eng-no'); }, 500);
        }
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '음, 그 통이 아니에요. 다시 생각해봐요!';
    }
}
function finishWordSort() {
    var st = wordSortState;
    var secs = Math.round((Date.now() - st.startTime) / 1000);
    var total = st.cards.length;
    var score = Math.max(0, total - st.wrong);
    var extra = '⏱️ ' + secs + '초 · 실수 ' + st.wrong + '번';
    renderEngResult('🗂️', '단어 분류하기', score, total, 'initWordSort', 'startWordSortSession', extra);
}


// ===========================================================================
// 6. 반대말·비슷한말 짝짓기 (oppositeMatch) 🔄
// ===========================================================================
var ANTONYM_PAIRS = [
    ['big', 'small'], ['hot', 'cold'], ['happy', 'sad'], ['fast', 'slow'], ['up', 'down'],
    ['open', 'closed'], ['day', 'night'], ['new', 'old'], ['tall', 'short'], ['hard', 'soft'],
    ['wet', 'dry'], ['clean', 'dirty'], ['full', 'empty'], ['loud', 'quiet'], ['light', 'heavy'],
    ['high', 'low'], ['in', 'out'], ['push', 'pull'], ['good', 'bad'], ['easy', 'difficult'],
    ['first', 'last'], ['left', 'right'], ['win', 'lose'], ['buy', 'sell'], ['start', 'stop'],
    ['above', 'below'], ['front', 'back'], ['near', 'far'], ['same', 'different'], ['asleep', 'awake']
];
var SYNONYM_PAIRS = [
    ['big', 'large'], ['big', 'huge'], ['happy', 'glad'], ['happy', 'joyful'], ['fast', 'quick'],
    ['small', 'little'], ['smart', 'clever'], ['angry', 'mad'], ['scared', 'afraid'], ['pretty', 'beautiful'],
    ['begin', 'start'], ['jump', 'hop'], ['shout', 'yell'], ['sad', 'unhappy'], ['tired', 'sleepy'],
    ['kid', 'child'], ['rich', 'wealthy'], ['funny', 'silly'], ['quiet', 'silent'], ['close', 'near'],
    ['hard', 'tough'], ['nice', 'kind']
];
var OPP_TOTAL_STAGES = 1; // 세션 = 한 스테이지
var oppState = {};
function oppSynUnlocked() {
    try { return localStorage.getItem('engOppSynUnlocked') === '1'; } catch (e) { return false; }
}
function initOppositeMatch() { engEnter(); renderOppSetup(); }
function renderOppSetup() {
    ENG_TTS.rerender = renderOppSetup;
    if (!oppState.mode) oppState.mode = 'antonym';
    if (!oppState.pairsCount) oppState.pairsCount = 6;
    var synOk = oppSynUnlocked();
    var html = '<div class="game-title-box">🔄 반대말·비슷한말 짝짓기</div>';
    html += '<div class="game-sub-desc">카드를 뒤집어 영어 단어를 듣고, 짝이 되는 두 단어를 찾아요.</div>';
    html += engTTSNote();
    html += '<div class="setup-section-label">모드</div><div class="setup-btn-group">';
    html += '<button class="setup-btn' + (oppState.mode === 'antonym' ? ' active' : '') + '" onclick="setOppMode(\'antonym\')">반대말</button>';
    html += '<button class="setup-btn' + (oppState.mode === 'synonym' ? ' active' : '') + '" ' + (synOk ? '' : 'disabled') + ' onclick="setOppMode(\'synonym\')">비슷한말 ' + (synOk ? '' : '🔒') + '</button>';
    html += '</div>';
    if (!synOk) html += '<div class="game-sub-desc" style="font-size:0.8rem; color:#94a3b8;">비슷한말 모드는 반대말 스테이지를 한 번 통과하면 열려요.</div>';
    html += '<div class="setup-section-label">카드 쌍 개수</div><div class="setup-btn-group">';
    [6, 8, 10].forEach(function (n) {
        html += '<button class="setup-btn' + (oppState.pairsCount === n ? ' active' : '') + '" onclick="setOppPairs(' + n + ')">' + n + '쌍</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">읽기 속도</div>' + engSpeedRow('');
    html += '<button class="action-btn" onclick="startOppSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setOppMode(m) { oppState.mode = m; renderOppSetup(); }
function setOppPairs(n) { oppState.pairsCount = n; renderOppSetup(); }
function startOppSession() {
    var src = oppState.mode === 'synonym' ? SYNONYM_PAIRS : ANTONYM_PAIRS;
    var picked = shuffleArray(src.slice()).slice(0, Math.min(oppState.pairsCount, src.length));
    var cards = [];
    picked.forEach(function (pr, pid) {
        cards.push({ w: pr[0], pid: pid, matched: false, up: false });
        cards.push({ w: pr[1], pid: pid, matched: false, up: false });
    });
    oppState.cards = shuffleArray(cards);
    oppState.pairs = picked.length;
    oppState.matched = 0;
    oppState.moves = 0;
    oppState.flipped = [];
    oppState.busy = false;
    oppState.startTime = Date.now();
    renderOppRound();
}
function renderOppRound() {
    ENG_TTS.rerender = renderOppRound;
    var st = oppState;
    if (typeof reportGameRound === 'function') reportGameRound(st.matched);
    var n = st.cards.length;
    var cols = n <= 12 ? 4 : (n <= 16 ? 4 : 5);
    var html = '<div class="game-title-box">🔄 ' + (st.mode === 'synonym' || oppState.mode === 'synonym' ? '비슷한말' : '반대말') + ' 짝짓기</div>';
    html += '<div class="status-row"><div>' + st.matched + ' / ' + st.pairs + ' 쌍</div><div>뒤집기: ' + st.moves + '</div></div>';
    html += '<div class="eng-btn-row">' + engBackBtn('initOppositeMatch') + '</div>';
    html += engSpeedRow();
    html += '<div class="eng-opp-grid" style="grid-template-columns:repeat(' + cols + ', 1fr);">';
    st.cards.forEach(function (c, idx) {
        var show = c.up || c.matched;
        html += '<button class="eng-opp-card' + (c.matched ? ' matched' : (c.up ? ' up' : '')) + '" ' + (c.matched ? 'disabled' : '') + ' onclick="oppFlip(' + idx + ')">' + (show ? c.w : '?') + '</button>';
    });
    html += '</div>';
    html += '<div id="engOppMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function oppFlip(idx) {
    var st = oppState;
    if (st.busy) return;
    var c = st.cards[idx];
    if (c.up || c.matched) return;
    c.up = true;
    st.flipped.push(idx);
    engSpeak(c.w, 0);
    vibrateShort();
    if (st.flipped.length === 2) {
        st.moves++;
        st.busy = true;
        var a = st.cards[st.flipped[0]], b = st.cards[st.flipped[1]];
        renderOppRound();
        if (a.pid === b.pid && a !== b) {
            var t = gameTimeout(function () {
                a.matched = true; b.matched = true;
                st.matched++;
                st.flipped = [];
                st.busy = false;
                if (st.matched >= st.pairs) { finishOppSession(); return; }
                renderOppRound();
                var m = document.getElementById('engOppMsg');
                if (m) { m.className = 'msg-box'; m.style.display = 'block'; m.innerText = '🎉 ' + a.w + ' ↔ ' + b.w + ' 짝!'; }
            }, 700);
        } else {
            var t2 = gameTimeout(function () {
                a.up = false; b.up = false;
                st.flipped = [];
                st.busy = false;
                renderOppRound();
            }, 950);
        }
    } else {
        renderOppRound();
    }
}
function finishOppSession() {
    var st = oppState;
    var secs = Math.round((Date.now() - st.startTime) / 1000);
    var perfect = st.moves <= st.pairs + Math.ceil(st.pairs / 2);
    var scoreCorrect = perfect ? st.pairs : Math.max(1, st.pairs - 1);
    var extra = '⏱️ ' + secs + '초 · ' + st.moves + '번 뒤집었어요';
    if (oppState.mode === 'antonym' && !oppSynUnlocked()) {
        try { localStorage.setItem('engOppSynUnlocked', '1'); } catch (e) { }
        extra += '<br>🔓 비슷한말 모드가 열렸어요!';
    }
    renderEngResult('🔄', (oppState.mode === 'synonym' ? '비슷한말' : '반대말') + ' 짝짓기', scoreCorrect, st.pairs, 'initOppositeMatch', 'startOppSession', extra);
}


// ===================== 게임 등록 =====================
GAME_INIT_FNS.listenPickPicture = initListenPick;
GAME_INIT_FNS.followInstructions = initFollowInstructions;
GAME_INIT_FNS.sentenceScramble = initSentenceScramble;
GAME_INIT_FNS.fillInBlank = initFillInBlank;
GAME_INIT_FNS.wordSort = initWordSort;
GAME_INIT_FNS.oppositeMatch = initOppositeMatch;
