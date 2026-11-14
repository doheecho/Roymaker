// ===================== 5. 관찰력: 무엇이 바뀌었을까 =====================
var spotSettings = { count: 10, timeLimit: 5 };
var spotState = {};
var spotRound = 1;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('spotChange', { easy: { count: 6 }, normal: { count: 10 }, hard: { count: 12 } });
}
function initSpotChange() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('spotChange', spotSettings);
    renderSpotChangeSetup();
}
function renderSpotChangeSetup() {
    var counts = [6, 8, 10, 12];
    var times = [{ v: 5, l: '5초' }, { v: 10, l: '10초' }, { v: 20, l: '20초' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">🔎 무엇이 바뀌었을까요</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">그림 개수</div><div class="setup-btn-group">';
    counts.forEach(function (c) {
        html += '<button class="setup-btn' + (spotSettings.count === c ? ' active' : '') + '" onclick="setSpotCount(' + c + ')">' + c + '개</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (spotSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setSpotTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startSpotChangeGame()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setSpotCount(c) { spotSettings.count = c; renderSpotChangeSetup(); }
function setSpotTimeLimit(t) { spotSettings.timeLimit = t; renderSpotChangeSetup(); }
function startSpotChangeGame() {
    spotRound = 1;
    generateSpotChangeRound();
}
function nextSpotChangeRound() {
    spotRound++;
    generateSpotChangeRound();
}
function generateSpotChangeRound() {
    var n = spotSettings.count;
    var icons = pickN(ICON_POOL, n);
    var changeCount = getRandomInt(1, 3);
    var changeIndices = pickN(Array.from({ length: n }, function (_, i) { return i; }), changeCount);
    var afterIcons = icons.slice();
    var usedReplacements = [];
    changeIndices.forEach(function (idx) {
        var candidates = ICON_POOL.filter(function (i) { return icons.indexOf(i) === -1 && usedReplacements.indexOf(i) === -1; });
        var replacement = pickRandom(candidates);
        usedReplacements.push(replacement);
        afterIcons[idx] = replacement;
    });
    spotState = { icons: icons, afterIcons: afterIcons, changeIndices: changeIndices, found: [], finished: false, timeLeft: spotSettings.timeLimit, timerId: null };
    renderSpotChangeRound();
    if (spotSettings.timeLimit > 0) { startSpotTimer(); }
}
function retrySpotChangeRound() {
    spotState.found = [];
    spotState.finished = false;
    spotState.timeLeft = spotSettings.timeLimit;
    renderSpotChangeRound();
    if (spotSettings.timeLimit > 0) { startSpotTimer(); }
}
function restartSpotChange() {
    spotRound = 1;
    renderSpotChangeSetup();
}
function renderSpotChangeRound() {
    var changeCount = spotState.changeIndices.length;
    var html = '<div class="game-title-box">🔎 무엇이 바뀌었을까요</div>';
    html += '<div class="game-sub-desc">위 그림과 아래 그림을 비교해서, 달라진 곳 <b style="color:var(--primary);">' + changeCount + '군데</b>를 ' + (spotSettings.timeLimit > 0 ? spotSettings.timeLimit + '초 안에 ' : '') + '모두 찾아 눌러보세요!</div>';
    if (spotSettings.timeLimit > 0) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="spotTimerBar"></div></div>';
    }
    html += '<div class="status-row"><div>' + spotRound + '라운드</div><div>찾은 개수: <span id="spotFoundCount">' + spotState.found.length + '</span> / ' + changeCount + '</div></div>';
    html += '<div class="row-label">이전 그림</div><div class="row-display">';
    spotState.icons.forEach(function (icon) { html += '<div class="row-box">' + icon + '</div>'; });
    html += '</div>';
    html += '<div class="row-label" style="font-weight:800;">지금 그림 : 위와 다른 그림을 찾아보세요!</div><div class="row-display">';
    spotState.afterIcons.forEach(function (icon, idx) {
        var alreadyFound = spotState.found.indexOf(idx) > -1;
        var extraStyle = alreadyFound ? ' style="border:2px solid #10b981;background:#d1fae5;"' : '';
        html += '<button type="button" class="row-box clickable"' + extraStyle + ' aria-label="칸 ' + (idx + 1) + '" onclick="checkSpotChange(this,' + idx + ')">' + icon + '</button>';
    });
    html += '</div>';
    html += '<div id="spotMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function startSpotTimer() {
    var bar = document.getElementById('spotTimerBar');
    if (bar) bar.style.width = '100%';
    spotState.timerId = setInterval(function () {
        spotState.timeLeft -= 0.1;
        var pct = (spotState.timeLeft / spotSettings.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('spotTimerBar');
        if (b) b.style.width = pct + '%';
        if (spotState.timeLeft <= 0) {
            clearInterval(spotState.timerId);
            handleSpotTimeout();
        }
    }, 100);
    activeTimers.push(spotState.timerId);
}
function handleSpotTimeout() {
    if (spotState.finished) return;
    spotState.finished = true;
    if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
    var boxes = document.querySelectorAll('.row-box.clickable');
    spotState.changeIndices.forEach(function (idx) {
        if (boxes[idx] && spotState.found.indexOf(idx) === -1) {
            boxes[idx].style.border = '2px solid #10b981';
            boxes[idx].style.background = '#d1fae5';
        }
    });
    var msg = document.getElementById('spotMsg');
    msg.className = 'msg-box bad'; msg.style.display = 'block';
    msg.innerText = '아쉬워요! ' + spotRound + '라운드까지 성공했어요. (' + spotState.found.length + '/' + spotState.changeIndices.length + ' 찾음)'; playResultSound(false);
    document.getElementById('mainArea').insertAdjacentHTML('beforeend',
        '<div class="options-grid">' +
        '<button class="action-btn" onclick="retrySpotChangeRound()">다시 풀어보기 🔁</button>' +
        '<button class="action-btn secondary" onclick="restartSpotChange()">처음부터 풀기 🔄</button>' +
        '</div>');
}
function checkSpotChange(el, idx) {
    if (spotState.finished) return;
    if (spotState.found.indexOf(idx) > -1) return;
    vibrateShort();
    var msg = document.getElementById('spotMsg');
    if (spotState.changeIndices.indexOf(idx) > -1) {
        spotState.found.push(idx);
        el.style.border = '2px solid #10b981'; el.style.background = '#d1fae5';
        var countEl = document.getElementById('spotFoundCount');
        if (countEl) countEl.innerText = spotState.found.length;
        if (spotState.found.length === spotState.changeIndices.length) {
            spotState.finished = true;
            if (typeof reportGameOutcome === 'function') reportGameOutcome('win');
            clearInterval(spotState.timerId);
            msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 성공! 모두 찾았어요.'; playResultSound(true);
            document.getElementById('mainArea').insertAdjacentHTML('beforeend',
                buildStandardResultButtons('nextSpotChangeRound()', 'retrySpotChangeRound()', 'restartSpotChange()'));
        } else {
            msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 하나 찾았어요! 더 찾아보세요!';
        }
    } else {
        el.style.border = '2px solid #ef4444';
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '다시 한 번 비교해보아요!';
        var t = gameTimeout(function () { el.style.border = ''; msg.style.display = 'none'; }, 500);
    }
}

// ===================== 6. 관찰력: 숫자야 나와라! =====================
var numberRushSettings = { range: '1-100', count: 10 };
var numberRushRound = 1;
var numberRushState = {};
function initNumberRush() {
    renderNumberRushSetup();
}
function renderNumberRushSetup() {
    var ranges = [
        { v: '1-20', l: '1~20' }, { v: '1-50', l: '1~50' },
        { v: '1-100', l: '1~100' }, { v: '50-100', l: '50~100' }
    ];
    var counts = [1, 3, 5, 10];
    var html = '<div class="game-title-box">🔢 숫자야 나와라!</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요! 숫자 중 가장 작은 수부터 순서대로 누르는 게임이에요.</div>';
    html += '<div class="setup-section-label">숫자 범위</div><div class="setup-btn-group">';
    ranges.forEach(function (r) {
        html += '<button class="setup-btn' + (numberRushSettings.range === r.v ? ' active' : '') + '" onclick="setNumberRushRange(\'' + r.v + '\')">' + r.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">맞춰야 할 개수</div><div class="setup-btn-group">';
    counts.forEach(function (c) {
        html += '<button class="setup-btn' + (numberRushSettings.count === c ? ' active' : '') + '" onclick="setNumberRushCount(' + c + ')">' + c + '개</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startNumberRushSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setNumberRushRange(v) { numberRushSettings.range = v; renderNumberRushSetup(); }
function setNumberRushCount(c) { numberRushSettings.count = c; renderNumberRushSetup(); }
function startNumberRushSession() {
    numberRushRound = 1;
    generateNumberRushRound();
}
function generateNumberRushRound() {
    var bounds = numberRushSettings.range.split('-').map(Number);
    var min = bounds[0], max = bounds[1];
    var pool = [];
    for (var v = min; v <= max; v++) { pool.push(v); }
    var displayCount = Math.min(10, pool.length);
    var numbers = pickN(pool, displayCount);
    var sortedAll = numbers.slice().sort(function (a, b) { return a - b; });
    var targetCount = Math.min(numberRushSettings.count, sortedAll.length);
    var targetNumbers = sortedAll.slice(0, targetCount);
    var gridSize = 16;
    var positions = pickN(Array.from({ length: gridSize }, function (_, i) { return i; }), numbers.length);
    var cells = new Array(gridSize).fill(null);
    positions.forEach(function (pos, idx) { cells[pos] = numbers[idx]; });
    numberRushState = { cells: cells, sortedNumbers: targetNumbers, currentIndex: 0, total: targetNumbers.length, finished: false, failed: false };
    renderNumberRush();
}
function retryNumberRushRound() {
    numberRushState.currentIndex = 0;
    numberRushState.finished = false;
    numberRushState.failed = false;
    renderNumberRush();
}
function restartNumberRush() {
    numberRushRound = 1;
    renderNumberRushSetup();
}
function nextNumberRushProblem() {
    numberRushRound++;
    generateNumberRushRound();
}
function renderNumberRush() {
    var html = '<div class="game-title-box">🔢 숫자야 나와라!</div>';
    html += '<div class="game-sub-desc">10개의 숫자 중 가장 작은 ' + numberRushState.total + '개를 순서대로 눌러보세요!</div>';
    html += '<div class="status-row"><div>' + numberRushRound + '라운드</div><div>진행: ' + (numberRushState.finished ? numberRushState.total : numberRushState.currentIndex) + ' / ' + numberRushState.total + '</div></div>';
    html += '<div class="number-grid">';
    numberRushState.cells.forEach(function (num, idx) {
        if (num === null) {
            html += '<div class="number-btn empty"></div>';
            return;
        }
        var valueIndex = numberRushState.sortedNumbers.indexOf(num);
        var done = valueIndex > -1 && valueIndex < numberRushState.currentIndex;
        var revealCorrect = numberRushState.failed && valueIndex === numberRushState.currentIndex;
        var cls = 'number-btn' + (done ? ' done' : '') + (revealCorrect ? ' reveal-correct' : '');
        var disabled = (done || numberRushState.finished || numberRushState.failed) ? 'disabled' : '';
        html += '<button class="' + cls + '" ' + disabled + ' onclick="clickNumberRush(this,' + num + ')">' + num + '</button>';
    });
    html += '</div>';
    html += '<div id="numberRushMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (numberRushState.finished) {
        var msg = document.getElementById('numberRushMsg');
        msg.className = 'msg-box'; msg.style.display = 'block';
        msg.innerText = '🎉 정답이에요! 잘했어요.'; playResultSound(true);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            buildStandardResultButtons('nextNumberRushProblem()', 'retryNumberRushRound()', 'restartNumberRush()'));
    } else if (numberRushState.failed) {
        var msg2 = document.getElementById('numberRushMsg');
        msg2.className = 'msg-box bad'; msg2.style.display = 'block';
        msg2.innerText = '아쉬워요! 주황색으로 표시된 숫자가 다음 정답이었어요.'; playResultSound(false);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryNumberRushRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartNumberRush()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}
function clickNumberRush(btn, num) {
    if (numberRushState.finished || numberRushState.failed) return;
    var expected = numberRushState.sortedNumbers[numberRushState.currentIndex];
    if (num === expected) {
        vibrateShort();
        numberRushState.currentIndex++;
        if (numberRushState.currentIndex >= numberRushState.total) {
            numberRushState.finished = true;
            if (typeof reportGameOutcome === 'function') reportGameOutcome('win');
        }
        renderNumberRush();
    } else {
        vibrateShort();
        numberRushState.failed = true;
        if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
        renderNumberRush();
    }
}

// ===================== 7. 관찰력: 순간 포착 세기 =====================
// 물체들이 잠깐 나타났다 사라진 뒤, 특정 속성(색/모양)을 가진 물체가 몇 개였는지 맞힌다.
// 물체는 격자 셀당 하나씩 + 약간의 무작위 오프셋으로 배치해 겹치지 않게 한다.
function fcs_starN(c, t) { var r = t > 0 ? c / t : 0; return r >= 0.9 ? 3 : (r >= 0.6 ? 2 : 1); }
function fcs_starStr(n) { return '⭐⭐⭐'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
var FCS_COLORS = [
    { k: 'red', hex: '#ef4444', ko: '빨간' },
    { k: 'orange', hex: '#f97316', ko: '주황' },
    { k: 'yellow', hex: '#eab308', ko: '노란' },
    { k: 'green', hex: '#22c55e', ko: '초록' },
    { k: 'blue', hex: '#3b82f6', ko: '파란' },
    { k: 'purple', hex: '#a855f7', ko: '보라' }
];
var FCS_SHAPES = [
    { k: 'circle', ko: '동그라미', css: 'border-radius:50%;' },
    { k: 'square', ko: '네모', css: 'border-radius:5px;' },
    { k: 'triangle', ko: '세모', css: 'clip-path:polygon(50% 0,100% 100%,0 100%);' }
];
var FCS_LEVELS = {
    1: { min: 5, max: 6, expo: 3600, kinds: ['color'] },
    2: { min: 8, max: 10, expo: 2400, kinds: ['color'] },
    3: { min: 10, max: 12, expo: 1700, kinds: ['combo', 'compare'] }
};
var fcsState = { level: 1 };
var FCS_TOTAL = 8;
var FCS_STAGE_W = 320, FCS_STAGE_H = 220, FCS_OBJ = 34;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('flashCountSpot', { easy: { level: 1 }, normal: { level: 2 }, hard: { level: 3 } });
}
function initFlashCount() {
    clearAllGameTimers();
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('flashCountSpot', fcsState);
    renderFlashCountSetup();
}
function renderFlashCountSetup() {
    if (!fcsState.level) fcsState.level = 1;
    var html = '<div class="game-title-box">⚡ 순간 포착 세기</div>';
    html += '<div class="game-sub-desc">물체들이 <b>잠깐</b> 나타났다 사라져요. 질문에 맞는 물체가 몇 개였는지 기억해서 골라요!</div>';
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    [{ v: 1, l: '1단계 · 5~6개·3.6초' }, { v: 2, l: '2단계 · 8~10개·2.4초' }, { v: 3, l: '3단계 · 10~12개·1.7초' }].forEach(function (t) {
        html += '<button class="setup-btn' + (fcsState.level === t.v ? ' active' : '') + '" onclick="setFcsLevel(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startFlashCountSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setFcsLevel(v) { fcsState.level = v; renderFlashCountSetup(); }
function fcs_layout(n) {
    var cols = Math.ceil(Math.sqrt(n * (FCS_STAGE_W / FCS_STAGE_H)));
    var rows = Math.ceil(n / cols);
    var cw = FCS_STAGE_W / cols, ch = FCS_STAGE_H / rows;
    var cellIdx = shuffleArray(Array.from({ length: cols * rows }, function (_, i) { return i; })).slice(0, n);
    return cellIdx.map(function (ci) {
        var cx = ci % cols, cy = Math.floor(ci / cols);
        var maxX = Math.max(0, cw - FCS_OBJ - 2), maxY = Math.max(0, ch - FCS_OBJ - 2);
        return {
            x: Math.round(cx * cw + 1 + Math.random() * maxX),
            y: Math.round(cy * ch + 1 + Math.random() * maxY)
        };
    });
}
function genFlashCountRound(level) {
    var cfg = FCS_LEVELS[level];
    var n = getRandomInt(cfg.min, cfg.max);
    var objs = [];
    for (var i = 0; i < n; i++) {
        objs.push({ color: getRandomInt(0, FCS_COLORS.length - 1), shape: getRandomInt(0, FCS_SHAPES.length - 1) });
    }
    var pos = fcs_layout(n);
    objs.forEach(function (o, i) { o.x = pos[i].x; o.y = pos[i].y; });
    var kind = pickRandom(cfg.kinds);
    var q, answer, options, match;
    if (kind === 'color') {
        var ci = getRandomInt(0, FCS_COLORS.length - 1);
        match = function (o) { return o.color === ci; };
        answer = objs.filter(match).length;
        q = FCS_COLORS[ci].ko + ' 물체가 몇 개였을까요?';
        options = fcs_numOptions(answer, n);
    } else if (kind === 'combo') {
        var cc = getRandomInt(0, FCS_COLORS.length - 1), ss = getRandomInt(0, FCS_SHAPES.length - 1);
        match = function (o) { return o.color === cc && o.shape === ss; };
        answer = objs.filter(match).length;
        q = FCS_COLORS[cc].ko + ' ' + FCS_SHAPES[ss].ko + '가 몇 개였을까요?';
        options = fcs_numOptions(answer, n);
    } else {
        // compare: 두 색 중 어느 게 더 많았나
        var a = getRandomInt(0, FCS_COLORS.length - 1), b = getRandomInt(0, FCS_COLORS.length - 1);
        while (b === a) b = getRandomInt(0, FCS_COLORS.length - 1);
        var ca = objs.filter(function (o) { return o.color === a; }).length;
        var cb = objs.filter(function (o) { return o.color === b; }).length;
        match = function (o) { return o.color === a || o.color === b; };
        q = FCS_COLORS[a].ko + ' 물체와 ' + FCS_COLORS[b].ko + ' 물체 중 어느 게 더 많았을까요?';
        options = [FCS_COLORS[a].ko + ' 물체', FCS_COLORS[b].ko + ' 물체', '같아요'];
        answer = ca > cb ? 0 : (cb > ca ? 1 : 2);
    }
    return { objs: objs, kind: kind, q: q, answer: answer, options: options, match: match };
}
function fcs_numOptions(answer, n) {
    var hi = Math.min(n, Math.max(answer + 1, 4));
    var opts = [];
    for (var v = 0; v <= hi; v++) opts.push(v);
    return opts;
}
function startFlashCountSession() {
    fcsState.round = 0;
    fcsState.correct = 0;
    nextFlashCountRound();
}
function nextFlashCountRound() {
    fcsState.round++;
    if (fcsState.round > FCS_TOTAL) { finishFlashCountSession(); return; }
    var r = genFlashCountRound(fcsState.level);
    fcsState.data = r;
    fcsState.phase = 'ready';
    fcsState.answered = false;
    renderFlashCountReady();
}
function fcs_objHtml(o, hl) {
    var col = FCS_COLORS[o.color], sh = FCS_SHAPES[o.shape];
    return '<div class="fcs-obj' + (hl ? ' hl' : '') + '" style="left:' + o.x + 'px; top:' + o.y + 'px; width:' + FCS_OBJ + 'px; height:' + FCS_OBJ + 'px; background:' + col.hex + '; ' + sh.css + '"></div>';
}
function fcs_stageHtml(objs, hlFn) {
    var h = '<div class="fcs-stage">';
    objs.forEach(function (o) { h += fcs_objHtml(o, hlFn ? hlFn(o) : false); });
    h += '</div>';
    return h;
}
function renderFlashCountReady() {
    var st = fcsState;
    var html = '<div class="game-title-box">⚡ 순간 포착 세기</div>';
    html += '<div class="status-row"><div>' + st.round + ' / ' + FCS_TOTAL + ' 라운드</div><div>정답: ' + st.correct + '</div></div>';
    html += '<div class="eng-btn-row"><button class="eng-mini-btn" onclick="initFlashCount()">⏮ 처음으로</button></div>';
    html += '<div class="fcs-stage"><div class="fcs-countdown" id="fcsCount">준비!</div></div>';
    document.getElementById('mainArea').innerHTML = html;
    var t1 = gameTimeout(function () {
        var el = document.getElementById('fcsCount'); if (el) el.innerText = '집중!';
        var t2 = gameTimeout(fcs_showObjects, 650);
    }, 700);
}
function fcs_showObjects() {
    var st = fcsState;
    var html = '<div class="game-title-box">⚡ 순간 포착 세기</div>';
    html += '<div class="status-row"><div>' + st.round + ' / ' + FCS_TOTAL + ' 라운드</div><div>정답: ' + st.correct + '</div></div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">잘 보세요! 👀</div>';
    html += fcs_stageHtml(st.data.objs, null);
    document.getElementById('mainArea').innerHTML = html;
    var t = gameTimeout(fcs_askQuestion, FCS_LEVELS[st.level].expo);
}
function fcs_askQuestion() {
    var st = fcsState;
    st.phase = 'ask';
    var html = '<div class="game-title-box">⚡ 순간 포착 세기</div>';
    html += '<div class="status-row"><div>' + st.round + ' / ' + FCS_TOTAL + ' 라운드</div><div>정답: ' + st.correct + '</div></div>';
    html += '<div class="eng-btn-row"><button class="eng-mini-btn" onclick="initFlashCount()">⏮ 처음으로</button></div>';
    html += '<div class="fcs-stage"><div class="fcs-countdown" style="font-size:1.3rem; color:#94a3b8;">❓</div></div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800; font-size:1rem;">' + st.data.q + '</div>';
    html += '<div class="options-grid"' + (st.data.options.length > 4 ? ' style="grid-template-columns:repeat(4,1fr);"' : '') + '>';
    st.data.options.forEach(function (op, idx) {
        html += '<button class="opt-btn" data-i="' + idx + '" onclick="checkFlashCount(' + idx + ')">' + op + '</button>';
    });
    html += '</div>';
    html += '<div id="fcsMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function checkFlashCount(idx) {
    var st = fcsState;
    if (st.answered) return;
    st.answered = true;
    vibrateShort();
    var ok = idx === st.data.answer;
    if (ok) st.correct++;
    var btns = document.querySelectorAll('#mainArea .opt-btn');
    btns[idx].classList.add(ok ? 'correct' : 'wrong');
    if (!ok && btns[st.data.answer]) btns[st.data.answer].classList.add('correct');
    // 물체 다시 보여주며 정답 대상 하이라이트
    var stageWrap = document.querySelector('.fcs-stage');
    if (stageWrap) stageWrap.outerHTML = fcs_stageHtml(st.data.objs, st.data.match);
    var msg = document.getElementById('fcsMsg');
    msg.style.display = 'block';
    msg.className = ok ? 'msg-box' : 'msg-box bad';
    var ansTxt = st.data.kind === 'compare' ? ('정답은 "' + st.data.options[st.data.answer] + '"') : ('정답은 ' + st.data.answer + '개');
    msg.innerText = (ok ? '🎉 맞아요! ' : '아쉬워요! ') + ansTxt + '예요. (노란 테두리가 해당 물체)';
    document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" style="width:100%;" onclick="nextFlashCountRound()">다음 ▶</button>');
}
function finishFlashCountSession() {
    var st = fcsState;
    if (typeof reportGameRound === 'function') reportGameRound(st.correct);
    var n = fcs_starN(st.correct, FCS_TOTAL);
    if (typeof reportGameOutcome === 'function') reportGameOutcome(n >= 2 ? 'win' : 'lose');
    var html = '<div class="game-title-box">⚡ 순간 포착 세기 — 끝!</div>';
    html += '<div style="text-align:center; font-size:2rem; letter-spacing:0.15rem; margin:0.7rem 0;">' + fcs_starStr(n) + '</div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">' + FCS_TOTAL + '문제 중 <span style="color:var(--primary);">' + st.correct + '개</span> 정답!</div>';
    html += buildStandardResultButtons('initFlashCount()', 'startFlashCountSession()', 'goHome()');
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 게임 등록 =====================
GAME_INIT_FNS.spotChange = initSpotChange;
GAME_INIT_FNS.numberRush = initNumberRush;
GAME_INIT_FNS.flashCountSpot = initFlashCount;
