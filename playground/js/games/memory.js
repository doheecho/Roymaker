// ===================== 1. 기억력: 카드 짝맞추기 =====================
var memorySettings = { cardCount: 12, timeLimit: 0 };
var memoryState = {};
var memoryRound = 1;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('memoryMatch', { easy: { cardCount: 8 }, normal: { cardCount: 12 }, hard: { cardCount: 16 } });
}
function initMemoryMatch() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('memoryMatch', memorySettings);
    renderMemoryMatchSetup();
}
function renderMemoryMatchSetup() {
    var counts = [4, 8, 12, 16];
    var times = [{ v: 10, l: '10초' }, { v: 30, l: '30초' }, { v: 60, l: '1분' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">🃏 카드 짝맞추기</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">카드 개수</div><div class="setup-btn-group">';
    counts.forEach(function (c) {
        html += '<button class="setup-btn' + (memorySettings.cardCount === c ? ' active' : '') + '" onclick="setMemoryCardCount(' + c + ')">' + c + '개</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (memorySettings.timeLimit === t.v ? ' active' : '') + '" onclick="setMemoryTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startMemoryMatchGame()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setMemoryCardCount(c) { memorySettings.cardCount = c; renderMemoryMatchSetup(); }
function setMemoryTimeLimit(t) { memorySettings.timeLimit = t; renderMemoryMatchSetup(); }
function startMemoryMatchGame() {
    memoryRound = 1;
    generateMemoryRound();
}
function generateMemoryRound() {
    var pairsCount = memorySettings.cardCount / 2;
    var icons = pickN(ICON_POOL, pairsCount);
    var cards = shuffleArray(icons.concat(icons));
    memoryState = { cards: cards, flipped: [], matched: [], moves: 0, lock: false, timeLeft: memorySettings.timeLimit, timerId: null, timedOut: false, finished: false };
    renderMemoryMatch();
    if (memorySettings.timeLimit > 0) { startMemoryTimer(); }
}
function retryMemoryRound() {
    memoryState.flipped = [];
    memoryState.matched = [];
    memoryState.moves = 0;
    memoryState.lock = false;
    memoryState.timedOut = false;
    memoryState.finished = false;
    memoryState.timeLeft = memorySettings.timeLimit;
    renderMemoryMatch();
    if (memorySettings.timeLimit > 0) { startMemoryTimer(); }
}
function restartMemory() {
    memoryRound = 1;
    renderMemoryMatchSetup();
}
function nextMemoryRound() {
    memoryRound++;
    generateMemoryRound();
}
function startMemoryTimer() {
    var bar = document.getElementById('memoryTimerBar');
    if (bar) bar.style.width = '100%';
    memoryState.timerId = setInterval(function () {
        memoryState.timeLeft -= 0.1;
        var pct = (memoryState.timeLeft / memorySettings.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('memoryTimerBar');
        if (b) b.style.width = pct + '%';
        if (memoryState.timeLeft <= 0) {
            clearInterval(memoryState.timerId);
            memoryState.timedOut = true;
            renderMemoryMatch();
        }
    }, 100);
    activeTimers.push(memoryState.timerId);
}
function renderMemoryMatch() {
    var cols = memoryState.cards.length <= 4 ? 2 : 4;
    var html = '<div class="game-title-box">🃏 카드 짝맞추기</div>';
    html += '<div class="game-sub-desc">같은 그림 카드 두 장을 찾아 짝을 지어보세요!</div>';
    html += '<div class="status-row"><div>' + memoryRound + '라운드</div><div>시도 횟수: ' + memoryState.moves + ' · 맞춘 짝: ' + (memoryState.matched.length / 2) + ' / ' + (memoryState.cards.length / 2) + '</div></div>';
    if (memorySettings.timeLimit > 0) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="memoryTimerBar"></div></div>';
    }
    html += '<div class="memory-grid" style="grid-template-columns: repeat(' + cols + ', 90px);">';
    memoryState.cards.forEach(function (icon, idx) {
        var isFlipped = memoryState.flipped.indexOf(idx) > -1;
        var isMatched = memoryState.matched.indexOf(idx) > -1;
        var cls = 'memory-card' + (isFlipped || isMatched ? ' flipped' : '') + (isMatched ? ' matched' : '');
        html += '<button type="button" class="' + cls + '" aria-label="카드 ' + (idx + 1) + '" onclick="flipMemoryCard(' + idx + ')">' + ((isFlipped || isMatched) ? icon : '❓') + '</button>';
    });
    html += '</div>';
    html += '<div id="memoryMsg" class="msg-box"></div>';
    var done = memoryState.matched.length === memoryState.cards.length;
    document.getElementById('mainArea').innerHTML = html;
    if (memorySettings.timeLimit > 0 && !done && !memoryState.timedOut) {
        var barEl = document.getElementById('memoryTimerBar');
        if (barEl) barEl.style.width = (memoryState.timeLeft / memorySettings.timeLimit * 100) + '%';
    }
    if (done && !memoryState.finished) {
        memoryState.finished = true;
        clearInterval(memoryState.timerId);
        var msg = document.getElementById('memoryMsg');
        msg.className = 'msg-box'; msg.style.display = 'block';
        msg.innerText = '🎉 성공! ' + memoryState.moves + '번 만에 모두 맞췄어요.';
        playResultSound(true);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextMemoryRound()', 'retryMemoryRound()', 'restartMemory()'));
    } else if (memoryState.timedOut && !memoryState.finished) {
        memoryState.finished = true;
        var msg2 = document.getElementById('memoryMsg');
        msg2.className = 'msg-box bad'; msg2.style.display = 'block';
        msg2.innerText = '아쉬워요! ' + memoryRound + '라운드까지 성공했어요.';
        playResultSound(false);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryMemoryRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartMemory()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}
function flipMemoryCard(idx) {
    if (memoryState.lock || memoryState.timedOut) return;
    if (memoryState.flipped.indexOf(idx) > -1 || memoryState.matched.indexOf(idx) > -1) return;
    vibrateShort();
    memoryState.flipped.push(idx);
    if (memoryState.flipped.length === 2) {
        memoryState.moves++;
        var a = memoryState.flipped[0], b = memoryState.flipped[1];
        if (memoryState.cards[a] === memoryState.cards[b]) {
            memoryState.matched.push(a, b);
            memoryState.flipped = [];
            renderMemoryMatch();
        } else {
            memoryState.lock = true;
            renderMemoryMatch();
            var t = gameTimeout(function () {
                memoryState.flipped = [];
                memoryState.lock = false;
                renderMemoryMatch();
            }, 900);
        }
    } else {
        renderMemoryMatch();
    }
}

// ===================== 2. 기억력: 순서 기억하기(사이먼) =====================
var simonState = {};
var SIMON_BTNS = [
    { emoji: '🔴', color: '#ef4444' }, { emoji: '🔵', color: '#3b82f6' },
    { emoji: '🟡', color: '#eab308' }, { emoji: '🟢', color: '#22c55e' }
];
function initSimonGame() {
    simonState = { sequence: [getRandomInt(0, 3)], userIndex: 0, round: 1, showing: true, lit: -1, locked: false };
    renderSimonGame();
    playSimonSequence();
}
function renderSimonGame() {
    var html = '<div class="game-title-box">🔵 순서 기억하기</div>';
    html += '<div class="game-sub-desc">불이 켜지는 순서를 잘 보고, 같은 순서로 눌러보세요!</div>';
    html += '<div class="status-row"><div>라운드: ' + simonState.round + '</div><div>' + (simonState.showing ? '순서를 보여주는 중...' : '차례대로 눌러보세요!') + '</div></div>';
    html += '<div class="simon-grid">';
    SIMON_BTNS.forEach(function (b, idx) {
        var lit = simonState.lit === idx;
        var row = Math.floor(idx / 2) + 1;
        var col = (idx % 2) + 1;
        html += '<button class="simon-btn' + (lit ? ' lit' : '') + '" style="background:' + b.color + '; grid-row:' + row + '; grid-column:' + col + ';" ' + ((simonState.showing || simonState.locked) ? 'disabled' : '') + ' onclick="simonClick(this,' + idx + ')">' + b.emoji + '</button>';
    });
    html += '</div>';
    html += '<div id="simonMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function playSimonSequence() {
    simonState.showing = true;
    simonState.userIndex = 0;
    var i = 0;
    function step() {
        if (i >= simonState.sequence.length) {
            simonState.lit = -1;
            simonState.showing = false;
            renderSimonGame();
            return;
        }
        simonState.lit = simonState.sequence[i];
        renderSimonGame();
        var t1 = gameTimeout(function () {
            simonState.lit = -1;
            renderSimonGame();
            var t2 = gameTimeout(function () { i++; step(); }, 250);
        }, 600);
    }
    var t0 = gameTimeout(step, 500);
}
function simonClick(btn, idx) {
    if (simonState.showing || simonState.locked) return;
    btn.classList.add('pressed');
    vibrateShort();
    var tp = gameTimeout(function () { btn.classList.remove('pressed'); }, 150);
    var expected = simonState.sequence[simonState.userIndex];
    if (idx === expected) {
        simonState.userIndex++;
        if (simonState.userIndex === simonState.sequence.length) {
            simonState.locked = true;
            renderSimonGame();
            var msg = document.getElementById('simonMsg');
            msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 성공! ' + simonState.round + '라운드를 통과했어요.'; playResultSound(true);
            document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextSimonRound()', 'retrySimonSuccess()', 'initSimonGame()'));
        }
    } else {
        simonState.locked = true;
        simonState.failedRoundLength = simonState.sequence.length;
        renderSimonGame();
        var msg2 = document.getElementById('simonMsg');
        msg2.className = 'msg-box bad'; msg2.style.display = 'block';
        msg2.innerText = '아쉬워요! ' + simonState.round + '라운드까지 성공했어요.'; playResultSound(false);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retrySimonRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="initSimonGame()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}
function nextSimonRound() {
    simonState.round++;
    simonState.sequence.push(getRandomInt(0, 3));
    simonState.locked = false;
    playSimonSequence();
}
function retrySimonSuccess() {
    simonState.locked = false;
    playSimonSequence();
}
function retrySimonRound() {
    var len = simonState.failedRoundLength || 1;
    var seq = [];
    for (var i = 0; i < len; i++) { seq.push(getRandomInt(0, 3)); }
    simonState = { sequence: seq, userIndex: 0, round: len, showing: true, lit: -1, locked: false };
    renderSimonGame();
    playSimonSequence();
}

// ===================== 15. 기억력: 순간 기억하기 =====================
var flashSettings = { pieceCount: 6, prepTime: 10 };
var flashState = {};
var flashRound = 1, flashCorrect = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('flashMemory', { easy: { pieceCount: 4 }, normal: { pieceCount: 6 }, hard: { pieceCount: 8 } });
}
function initFlashMemory() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('flashMemory', flashSettings);
    renderFlashSetup();
}
function renderFlashSetup() {
    var counts = [{ v: 4, l: '4개' }, { v: 6, l: '6개' }, { v: 8, l: '8개' }, { v: 'random', l: '무작위' }];
    var preps = [{ v: 5, l: '5초' }, { v: 10, l: '10초' }, { v: 15, l: '15초' }, { v: 20, l: '20초' }];
    var html = '<div class="game-title-box">⚡ 순간 기억하기</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">기억할 조각 수</div><div class="setup-btn-group">';
    counts.forEach(function (t) {
        html += '<button class="setup-btn' + (flashSettings.pieceCount === t.v ? ' active' : '') + '" onclick="setFlashPieceCount(' + (t.v === 'random' ? "'random'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">준비 시간</div><div class="setup-btn-group">';
    preps.forEach(function (t) {
        html += '<button class="setup-btn' + (flashSettings.prepTime === t.v ? ' active' : '') + '" onclick="setFlashPrepTime(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startFlashSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setFlashPieceCount(v) { flashSettings.pieceCount = v; renderFlashSetup(); }
function setFlashPrepTime(v) { flashSettings.prepTime = v; renderFlashSetup(); }
function startFlashSession() { flashRound = 1; flashCorrect = 0; generateFlashRound(); }
function resolveFlashPieceCount() {
    return flashSettings.pieceCount === 'random' ? pickRandom([4, 6, 8]) : flashSettings.pieceCount;
}
function generateFlashRound() {
    var n = resolveFlashPieceCount();
    var shown = pickN(ICON_POOL, n);
    var decoys = pickN(ICON_POOL.filter(function (i) { return shown.indexOf(i) === -1; }), 4);
    var allOptions = shuffleArray(shown.concat(decoys));
    flashState = { shown: shown, allOptions: allOptions, selected: [], phase: 'study', checked: false, timeLeft: flashSettings.prepTime, timerId: null };
    renderFlashMemory();
    startFlashPrepTimer();
}
function retryFlashRound() {
    flashState.selected = [];
    flashState.checked = false;
    flashState.phase = 'study';
    flashState.timeLeft = flashSettings.prepTime;
    renderFlashMemory();
    startFlashPrepTimer();
}
function restartFlashMemory() { renderFlashSetup(); }
function nextFlashRound() { flashRound++; generateFlashRound(); }
function startFlashPrepTimer() {
    var bar = document.getElementById('flashTimerBar');
    if (bar) bar.style.width = '100%';
    flashState.timerId = setInterval(function () {
        flashState.timeLeft -= 0.1;
        var pct = (flashState.timeLeft / flashSettings.prepTime) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('flashTimerBar');
        if (b) b.style.width = pct + '%';
        if (flashState.timeLeft <= 0) {
            clearInterval(flashState.timerId);
            flashState.phase = 'recall';
            renderFlashMemory();
        }
    }, 100);
    activeTimers.push(flashState.timerId);
}
function renderFlashMemory() {
    var html = '<div class="game-title-box">⚡ 순간 기억하기</div>';
    if (flashState.phase === 'study') {
        html += '<div class="game-sub-desc">이 그림들을 잘 기억해두세요! 시간이 다 되면 사라져요.</div>';
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="flashTimerBar"></div></div>';
        html += '<div class="status-row"><div>' + flashRound + '라운드</div><div>정답: ' + flashCorrect + ' / ' + (flashRound - 1) + '</div></div>';
        html += '<div class="flash-grid">';
        flashState.shown.forEach(function (icon) { html += '<div class="flash-item">' + icon + '</div>'; });
        html += '</div>';
    } else {
        html += '<div class="game-sub-desc">아까 보여드렸던 그림을 모두 골라 눌러보세요! (' + flashState.shown.length + '개)</div>';
        html += '<div class="status-row"><div>' + flashRound + '라운드</div><div>선택: ' + flashState.selected.length + ' / ' + flashState.shown.length + '</div></div>';
        html += '<div class="flash-grid">';
        flashState.allOptions.forEach(function (icon, idx) {
            var sel = flashState.selected.indexOf(idx) > -1;
            html += '<button type="button" class="flash-item' + (sel ? ' selected' : '') + '" aria-pressed="' + (sel ? 'true' : 'false') + '" onclick="toggleFlashSelect(' + idx + ')">' + icon + '</button>';
        });
        html += '</div>';
        if (!flashState.checked) {
            html += '<button class="action-btn" onclick="checkFlashMemory()">확인하기 ✅</button>';
        }
    }
    html += '<div id="flashMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function toggleFlashSelect(idx) {
    if (flashState.checked) return;
    var pos = flashState.selected.indexOf(idx);
    if (pos > -1) { flashState.selected.splice(pos, 1); } else { flashState.selected.push(idx); }
    renderFlashMemory();
}
function checkFlashMemory() {
    if (flashState.checked) return;
    flashState.checked = true;
    var correctIdxs = [];
    flashState.allOptions.forEach(function (icon, idx) { if (flashState.shown.indexOf(icon) > -1) correctIdxs.push(idx); });
    var selectedSorted = flashState.selected.slice().sort();
    var correctSorted = correctIdxs.slice().sort();
    var isCorrect = JSON.stringify(selectedSorted) === JSON.stringify(correctSorted);
    var msg = document.getElementById('flashMsg');
    var items = document.querySelectorAll('.flash-item');
    correctIdxs.forEach(function (idx) { if (items[idx]) { items[idx].style.border = '3px solid #10b981'; } });
    if (isCorrect) {
        flashCorrect++;
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 정확히 기억했어요!'; playResultSound(true);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextFlashRound()', 'retryFlashRound()', 'restartFlashMemory()'));
    } else {
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '아쉬워요! 초록 테두리가 아까 보여드렸던 그림이에요.'; playResultSound(false);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryFlashRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartFlashMemory()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}

// ===================== 16. 기억력: 피아노 건반 누르기 =====================
var PIANO_WHITE_NOTES = ['도', '레', '미', '파', '솔', '라', '시'];
var PIANO_WHITE_FREQ_BASE = { 도: 261.63, 레: 293.66, 미: 329.63, 파: 349.23, 솔: 392.00, 라: 440.00, 시: 493.88 };
var PIANO_SHARP_FREQ_BASE = { 도: 277.18, 레: 311.13, 파: 369.99, 솔: 415.30, 라: 466.16 };
var pianoAudioCtx = null;
function getPianoAudioCtx() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!pianoAudioCtx) { pianoAudioCtx = new AC(); }
    if (pianoAudioCtx.state === 'suspended') { pianoAudioCtx.resume(); }
    return pianoAudioCtx;
}
function playPianoTone(freq) {
    if (typeof SOUND_ON !== 'undefined' && !SOUND_ON) return;
    var ctx = getPianoAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
}
function buildPianoKeys(level) {
    var octaves = level === 'high' ? 2 : 1;
    var keys = [];
    var whiteSlot = 0;
    for (var oct = 0; oct < octaves; oct++) {
        var mult = Math.pow(2, oct);
        PIANO_WHITE_NOTES.forEach(function (n) {
            keys.push({ note: n, freq: PIANO_WHITE_FREQ_BASE[n] * mult, black: false, whiteSlot: whiteSlot });
            whiteSlot++;
            if (level !== 'low' && PIANO_SHARP_FREQ_BASE[n]) {
                keys.push({ note: n + '#', freq: PIANO_SHARP_FREQ_BASE[n] * mult, black: true, whiteSlot: whiteSlot - 1 });
            }
        });
    }
    keys.push({ note: '도', freq: PIANO_WHITE_FREQ_BASE['도'] * Math.pow(2, octaves), black: false, whiteSlot: whiteSlot });
    return keys;
}
var pianoSettings = { level: 'low' };
var pianoState = {};
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('pianoKeys', { easy: { level: 'low' }, normal: { level: 'mid' }, hard: { level: 'high' } });
}
function initPianoKeys() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('pianoKeys', pianoSettings);
    renderPianoSetup();
}
function renderPianoSetup() {
    var levels = [{ v: 'low', l: '쉬움 (1옥타브 흰 건반)' }, { v: 'mid', l: '보통 (1옥타브 전체)' }, { v: 'high', l: '어려움 (2옥타브 전체)' }];
    var html = '<div class="game-title-box">🎹 피아노 건반 누르기</div>';
    html += '<div class="game-sub-desc">소리를 잘 듣고, 같은 순서로 건반을 눌러보세요! 난이도를 골라 시작해보세요.</div>';
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    levels.forEach(function (t) {
        html += '<button class="setup-btn' + (pianoSettings.level === t.v ? ' active' : '') + '" onclick="setPianoLevel(\'' + t.v + '\')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startPianoSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setPianoLevel(v) { pianoSettings.level = v; renderPianoSetup(); }
function startPianoSession() {
    pianoState = { keys: buildPianoKeys(pianoSettings.level), sequence: [], userIndex: 0, round: 1, showing: true, lit: -1, locked: false };
    renderPianoKeys();
    playPianoIntroScale(function () {
        pianoState.sequence = [getRandomInt(0, pianoState.keys.length - 1)];
        playPianoSequence();
    });
}
function playPianoIntroScale(callback) {
    var introKeys = [];
    var isHigh = pianoSettings.level === 'high';
    pianoState.keys.forEach(function (k, idx) { if (!k.black && (isHigh || k.whiteSlot <= 7)) introKeys.push(idx); });
    var i = 0;
    function step() {
        if (i >= introKeys.length) { callback(); return; }
        var keyIdx = introKeys[i];
        pianoState.lit = keyIdx;
        playPianoTone(pianoState.keys[keyIdx].freq);
        renderPianoKeys();
        var t1 = gameTimeout(function () {
            pianoState.lit = -1;
            renderPianoKeys();
            var t2 = gameTimeout(function () { i++; step(); }, 120);
        }, 320);
    }
    var t0 = gameTimeout(step, 1000);
}
function pianoSeqToNoteString(seq) {
    return seq.map(function (i) { return pianoState.keys[i].note; }).join('-');
}
function renderPianoKeys() {
    var html = '<div class="game-title-box">🎹 피아노 건반 누르기</div>';
    html += '<div class="game-sub-desc">소리를 잘 듣고, 같은 순서로 건반을 눌러보세요!</div>';
    html += '<div class="status-row"><div>라운드: ' + pianoState.round + '</div><div>' + (pianoState.showing ? '순서를 들려주는 중...' : '차례대로 눌러보세요!') + '</div></div>';
    var whiteCount = pianoState.keys.filter(function (k) { return !k.black; }).length;
    var whitePct = 100 / whiteCount;
    var blackPct = whitePct * 0.62;
    var whiteFontRem = whiteCount <= 8 ? 1.15 : 0.8;
    var blackFontRem = whiteCount <= 8 ? 0.85 : 0.62;
    html += '<div style="position:relative; width:100%; height:170px; margin:0 0 1rem 0;">';
    var wSlot = 0;
    pianoState.keys.forEach(function (k, idx) {
        if (k.black) return;
        var lit = pianoState.lit === idx;
        html += '<button style="position:absolute; left:' + (wSlot * whitePct) + '%; top:0; width:' + whitePct + '%; height:170px; background:' + (lit ? '#fef08a' : '#ffffff') + '; border:2px solid #1f2937; border-radius:0 0 0.3rem 0.3rem; display:flex; align-items:flex-end; justify-content:center; padding-bottom:0.5rem; font-weight:800; font-size:' + whiteFontRem + 'rem; color:#4b5563; box-shadow:' + (lit ? 'inset 0 4px 8px rgba(0,0,0,0.25)' : '0 3px 0 #cbd5e1') + '; transition: background 0.15s; z-index:1;" ' + (pianoState.showing ? 'disabled' : '') + ' onclick="pianoKeyClick(this,' + idx + ')">' + k.note + '</button>';
        wSlot++;
    });
    pianoState.keys.forEach(function (k, idx) {
        if (!k.black) return;
        var lit = pianoState.lit === idx;
        var leftPct = (k.whiteSlot + 1) * whitePct - blackPct / 2;
        html += '<button style="position:absolute; left:' + leftPct + '%; top:0; width:' + blackPct + '%; height:60%; background:' + (lit ? '#fbbf24' : '#1f2937') + '; border:2px solid #000; border-radius:0 0 0.25rem 0.25rem; display:flex; align-items:flex-end; justify-content:center; padding-bottom:0.4rem; font-weight:800; font-size:' + blackFontRem + 'rem; color:#fff; transition: background 0.15s; z-index:2;" ' + (pianoState.showing ? 'disabled' : '') + ' onclick="pianoKeyClick(this,' + idx + ')">' + k.note + '</button>';
    });
    html += '</div>';
    html += '<div id="pianoMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function playPianoSequence() {
    pianoState.showing = true;
    pianoState.userIndex = 0;
    var i = 0;
    function step() {
        if (i >= pianoState.sequence.length) {
            pianoState.lit = -1;
            pianoState.showing = false;
            renderPianoKeys();
            return;
        }
        var keyIdx = pianoState.sequence[i];
        pianoState.lit = -1;
        playPianoTone(pianoState.keys[keyIdx].freq);
        renderPianoKeys();
        var t1 = gameTimeout(function () {
            pianoState.lit = -1;
            renderPianoKeys();
            var t2 = gameTimeout(function () { i++; step(); }, 250);
        }, 550);
    }
    var t0 = gameTimeout(step, 500);
}
function pianoKeyClick(btn, idx) {
    if (pianoState.showing) return;
    vibrateShort();
    var key = pianoState.keys[idx];
    playPianoTone(key.freq);
    var restColor = key.black ? '#1f2937' : '#ffffff';
    var pressColor = key.black ? '#fbbf24' : '#fde68a';
    btn.style.background = pressColor;
    var tp = gameTimeout(function () { if (btn) btn.style.background = restColor; }, 150);
    if (pianoState.locked) return;
    var expected = pianoState.sequence[pianoState.userIndex];
    if (idx === expected) {
        pianoState.userIndex++;
        if (pianoState.userIndex === pianoState.sequence.length) {
            pianoState.locked = true;
            renderPianoKeys();
            var msg = document.getElementById('pianoMsg');
            msg.className = 'msg-box'; msg.style.display = 'block';
            msg.innerText = '🎉 성공! ' + pianoState.round + '라운드를 통과했어요. 답은 ' + pianoSeqToNoteString(pianoState.sequence) + ' 이에요.'; playResultSound(true);
            document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextPianoRound()', 'retryPianoSuccess()', 'initPianoKeys()'));
        }
    } else {
        pianoState.locked = true;
        renderPianoKeys();
        var msg2 = document.getElementById('pianoMsg');
        msg2.className = 'msg-box bad'; msg2.style.display = 'block';
        msg2.innerText = '아쉬워요! 답은 ' + pianoSeqToNoteString(pianoState.sequence) + ' 였어요.'; playResultSound(false);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryPianoRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="initPianoKeys()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}
function nextPianoRound() {
    pianoState.round++;
    if (pianoState.sequence.length >= 5) {
        pianoState.sequence = [getRandomInt(0, pianoState.keys.length - 1)];
    } else {
        pianoState.sequence.push(getRandomInt(0, pianoState.keys.length - 1));
    }
    pianoState.locked = false;
    playPianoSequence();
}
function retryPianoSuccess() {
    pianoState.locked = false;
    playPianoSequence();
}
function retryPianoRound() {
    pianoState.userIndex = 0;
    pianoState.showing = true;
    pianoState.lit = -1;
    pianoState.locked = false;
    renderPianoKeys();
    playPianoSequence();
}

// ===================== 게임 등록 =====================
GAME_INIT_FNS.memoryMatch = initMemoryMatch;
GAME_INIT_FNS.simonGame = initSimonGame;
GAME_INIT_FNS.flashMemory = initFlashMemory;
GAME_INIT_FNS.pianoKeys = initPianoKeys;
