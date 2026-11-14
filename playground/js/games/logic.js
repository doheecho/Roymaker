// ===================== 8. 논리: 패턴 매트릭스 =====================
var MATRIX_SHAPE_POOL = ["●", "■", "▲", "◆", "★", "♥", "♦", "♣", "♠"];
var patternSettings = { size: 3, timeLimit: 0 };
var patternState = {};
var patternRound = 1, patternCorrect = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('patternMatrix', { easy: { size: 2 }, normal: { size: 3 }, hard: { size: 4 } });
}

function initPatternMatrix() {
    patternRound = 1; patternCorrect = 0;
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('patternMatrix', patternSettings);
    renderPatternSetup();
}
function renderPatternSetup() {
    var sizes = [{v: 2, l: '2x2'}, {v: 3, l: '3x3'}, {v: 4, l: '4x4'}, {v: 'random', l: '무작위'}];
    var times = [{v: 5, l: '5초'}, {v: 10, l: '10초'}, {v: 20, l: '20초'}, {v: 0, l: '무제한'}];
    var html = '<div class="game-title-box">🧩 패턴 매트릭스</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';

    html += '<div class="setup-section-label">조각 수</div><div class="setup-btn-group">';
    sizes.forEach(function (s) {
        html += '<button class="setup-btn' + (patternSettings.size === s.v ? ' active' : '') + '" onclick="setPatternSize(' + (s.v === 'random' ? "'random'" : s.v) + ')">' + s.l + '</button>';
    });
    html += '</div>';

    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (patternSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setPatternTime(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';

    html += '<button class="action-btn" onclick="startPatternSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}

function setPatternSize(s) { patternSettings.size = s; renderPatternSetup(); }
function setPatternTime(t) { patternSettings.timeLimit = t; renderPatternSetup(); }
function startPatternSession() { patternRound = 1; patternCorrect = 0; generatePatternMatrixRound(); }

function generatePatternMatrixRound() {
    var size = patternSettings.size === 'random' ? pickRandom([2, 3, 4]) : patternSettings.size;
    var icons = pickN(MATRIX_SHAPE_POOL, size);
    // 라틴 방진: 각 행·열에 모든 아이콘이 정확히 한 번씩 들어가도록 만든다.
    // → 빈칸에 들어갈 아이콘이 "그 행/열에 없는 하나"로 유일하게 결정되어 모호하지 않다.
    var rowPerm = shuffleArray(Array.from({ length: size }, function (_, i) { return i; }));
    var colPerm = shuffleArray(Array.from({ length: size }, function (_, i) { return i; }));
    var shift = getRandomInt(0, size - 1);
    var grid = [];
    for (var r = 0; r < size; r++) {
        var row = [];
        for (var c = 0; c < size; c++) {
            row.push(icons[(rowPerm[r] + colPerm[c] + shift) % size]);
        }
        grid.push(row);
    }
    var hideR = getRandomInt(0, size - 1), hideC = getRandomInt(0, size - 1);
    var answer = grid[hideR][hideC];

    var wrongs = icons.filter(function (i) { return i !== answer; });
    var extra = shuffleArray(MATRIX_SHAPE_POOL.filter(function (i) { return icons.indexOf(i) === -1; }));
    var options = shuffleArray([answer].concat(wrongs).concat(extra).slice(0, 4));

    patternState = { size: size, grid: grid, hideR: hideR, hideC: hideC, answer: answer, options: options, answered: false, finished: false, timeLeft: patternSettings.timeLimit, timerId: null };
    renderPatternMatrix();
    if (patternSettings.timeLimit > 0) startPatternTimer();
}

function retryPatternRound() {
    patternState.answered = false;
    patternState.finished = false;
    patternState.timeLeft = patternSettings.timeLimit;
    renderPatternMatrix();
    if(patternSettings.timeLimit > 0) startPatternTimer();
}

function startPatternTimer() {
    var bar = document.getElementById('patternTimerBar');
    if (bar) bar.style.width = '100%';
    patternState.timerId = setInterval(function () {
        patternState.timeLeft -= 0.1;
        var pct = (patternState.timeLeft / patternSettings.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('patternTimerBar');
        if (b) b.style.width = pct + '%';
        if (patternState.timeLeft <= 0) {
            clearInterval(patternState.timerId);
            handlePatternTimeout();
        }
    }, 100);
    activeTimers.push(patternState.timerId);
}

function handlePatternTimeout() { choiceTimeout(); }

function patternChoiceCfg() {
    return {
        msgId: 'patternMsg', optClass: 'opt-btn',
        ok: '🎉 정답이에요!',
        bad: '아쉬워요! 정답은 "' + patternState.answer + '" 였어요.',
        timeout: '⏰ 시간이 다 됐어요! 정답은 "' + patternState.answer + '" 였어요.',
        onPick: function () { patternState.finished = true; if (patternState.timerId) clearInterval(patternState.timerId); },
        onCorrect: function () { patternCorrect++; },
        onResolved: function () { patternRound++; },
        onTimeout: function () { patternState.finished = true; },
        next: 'nextPatternRound()', retry: 'retryPatternRound()', home: 'initPatternMatrix()',
        failStyle: 'retryHome'
    };
}
function renderPatternMatrix() {
    var html = '<div class="game-title-box">🧩 패턴 매트릭스</div>';
    html += '<div class="game-sub-desc">각 가로줄과 세로줄에는 모든 모양이 한 번씩만 들어가요. 빈칸에 들어갈 모양을 골라보세요!</div>';
    html += '<div class="status-row"><div>' + patternRound + '라운드</div><div>정답: ' + patternCorrect + ' / ' + (patternRound - 1) + '</div></div>';

    if (patternSettings.timeLimit > 0) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="patternTimerBar"></div></div>';
    }

    html += '<div class="matrix-grid" style="grid-template-columns: repeat(' + patternState.size + ', 60px);">';
    for (var r = 0; r < patternState.size; r++) {
        for (var c = 0; c < patternState.size; c++) {
            var isBlank = (r === patternState.hideR && c === patternState.hideC);
            html += '<div class="matrix-cell' + (isBlank ? ' blank' : '') + '">' + (isBlank ? '?' : patternState.grid[r][c]) + '</div>';
        }
    }
    html += '</div>';
    var cfg = patternChoiceCfg();
    html += choiceOptionsHtml(patternState.options, cfg);
    document.getElementById('mainArea').innerHTML = html;
    choiceBegin(patternState.options.indexOf(patternState.answer), cfg);
}
function nextPatternRound() { generatePatternMatrixRound(); }

// ===================== 10. 논리: 크기 순서 추론 =====================
var sizeLogicState = {};
var sizeLogicRound = 1, sizeLogicCorrect = 0;
function initSizeLogic() { sizeLogicRound = 1; sizeLogicCorrect = 0; generateSizeLogicRound(); }
function generateSizeLogicRound() {
    var n = 4;
    var items = pickN(ICON_POOL, n); // 뽑힌 순서 그대로 "큰 것부터"의 정답 순서로 사용
    var clues = [];
    for (var i = 0; i < n - 1; i++) { clues.push(items[i] + ' 는(은) ' + items[i + 1] + ' 보다 커요.'); }
    var shuffled = shuffleArray(items.slice());
    sizeLogicState = { correctOrder: items.slice(), shuffled: shuffled, picked: [], checked: false, clues: shuffleArray(clues) };
    renderSizeLogic();
}
function renderSizeLogic() {
    var html = '<div class="game-title-box">📏 크기 순서 추론</div>';
    html += '<div class="game-sub-desc">아래 단서를 읽고, 가장 큰 것부터 순서대로 눌러보세요!</div>';
    html += '<div class="status-row"><div>' + sizeLogicRound + '라운드</div><div>정답: ' + sizeLogicCorrect + ' / ' + (sizeLogicRound - 1) + '</div></div>';
    html += '<div class="msg-box" style="display:block; background:#f8fafc; border-color:#e5e7eb; color:#1f2937; text-align:left; font-size:1.1rem; line-height:1.8;">' + sizeLogicState.clues.join('<br>') + '</div>';
    html += '<div class="sequence-answer-row">';
    for (var i = 0; i < sizeLogicState.correctOrder.length; i++) {
        html += '<div class="sequence-answer-slot">' + (sizeLogicState.picked[i] ? sizeLogicState.picked[i] : (i + 1)) + '</div>';
    }
    html += '</div>';
    html += '<div class="sequence-pool-row">';
    sizeLogicState.shuffled.forEach(function (it, idx) {
        var picked = sizeLogicState.picked.indexOf(it) > -1;
        html += '<button class="sequence-btn' + (picked ? ' picked' : '') + '" ' + (picked ? 'disabled' : '') + ' onclick="pickSizeLogicItem(' + idx + ')">' + it + '</button>';
    });
    html += '</div>';
    html += '<div id="sizeLogicMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function pickSizeLogicItem(idx) {
    if (sizeLogicState.checked) return;
    var it = sizeLogicState.shuffled[idx];
    if (sizeLogicState.picked.indexOf(it) > -1) return;
    vibrateShort();
    sizeLogicState.picked.push(it);
    if (sizeLogicState.picked.length === sizeLogicState.correctOrder.length) {
        sizeLogicState.checked = true;
        var isCorrect = sizeLogicState.picked.every(function (p, i) { return p === sizeLogicState.correctOrder[i]; });
        renderSizeLogic();
        var msg = document.getElementById('sizeLogicMsg');
        if (isCorrect) {
            sizeLogicCorrect++;
            msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 정확히 추론했어요!';
            document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextSizeLogicRound()', 'retrySizeLogicRound()', 'restartSizeLogic()'));
        } else {
            msg.className = 'msg-box bad'; msg.style.display = 'block';
            msg.innerText = '아쉬워요! 정답 순서는 ' + sizeLogicState.correctOrder.join(' → ') + ' 였어요.';
            document.getElementById('mainArea').insertAdjacentHTML('beforeend',
                '<div class="options-grid">' +
                '<button class="action-btn" onclick="retrySizeLogicRound()">다시 풀어보기 🔁</button>' +
                '<button class="action-btn secondary" onclick="restartSizeLogic()">처음부터 풀기 🔄</button>' +
                '</div>');
        }
    } else {
        renderSizeLogic();
    }
}
function retrySizeLogicRound() {
    sizeLogicState.picked = [];
    sizeLogicState.checked = false;
    renderSizeLogic();
}
function restartSizeLogic() { sizeLogicRound = 1; sizeLogicCorrect = 0; generateSizeLogicRound(); }
function nextSizeLogicRound() { sizeLogicRound++; generateSizeLogicRound(); }

// ===================== 27. 논리: 거울 대칭 완성하기 =====================
var mirrorState = {};
var mirrorRound = 1, mirrorCorrect = 0;
function initMirrorSymmetry() { mirrorRound = 1; mirrorCorrect = 0; generateMirrorRound(); }
function generateMirrorRound() {
    var halfW = 3, h = 4;
    var w = halfW * 2;
    var filledLeft = [];
    var count = getRandomInt(3, 5);
    var guard = 0;
    while (filledLeft.length < count && guard < 100) {
        guard++;
        var x = getRandomInt(0, halfW - 1), y = getRandomInt(0, h - 1);
        var exists = filledLeft.some(function (c) { return c.x === x && c.y === y; });
        if (!exists) filledLeft.push({ x: x, y: y });
    }
    var correctRight = filledLeft.map(function (c) { return { x: w - 1 - c.x, y: c.y }; });
    mirrorState = { w: w, h: h, halfW: halfW, filledLeft: filledLeft, correctRight: correctRight, selected: [], finished: false, failed: false, wrongCount: 0 };
    renderMirrorSymmetry();
}
var MIRROR_MAX_WRONG = 3;
function clickMirrorCell(x, y) {
    if (mirrorState.finished) return;
    if (x < mirrorState.halfW) return;
    vibrateShort();
    var already = mirrorState.selected.some(function (c) { return c.x === x && c.y === y; });
    if (already) return;
    var isCorrect = mirrorState.correctRight.some(function (c) { return c.x === x && c.y === y; });
    if (isCorrect) {
        mirrorState.selected.push({ x: x, y: y });
        if (mirrorState.selected.length === mirrorState.correctRight.length) {
            mirrorState.finished = true;
            mirrorCorrect++;
            renderMirrorSymmetry();
            var msg = document.getElementById('mirrorMsg');
            msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 완벽한 대칭을 만들었어요!';
            document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextMirrorRound()', 'retryMirrorRound()', 'initMirrorSymmetry()'));
            return;
        }
        renderMirrorSymmetry();
    } else {
        mirrorState.wrongCount++;
        var left = MIRROR_MAX_WRONG - mirrorState.wrongCount;
        if (left <= 0) {
            mirrorState.failed = true;
            mirrorState.finished = true;
            renderMirrorSymmetry();
            var fmsg = document.getElementById('mirrorMsg');
            fmsg.className = 'msg-box bad'; fmsg.style.display = 'block';
            fmsg.innerText = '아쉬워요! 초록색 칸이 정답 위치예요.';
            document.getElementById('mainArea').insertAdjacentHTML('beforeend',
                '<div class="options-grid">' +
                '<button class="action-btn" onclick="retryMirrorRound()">다시 풀어보기 🔁</button>' +
                '<button class="action-btn secondary" onclick="initMirrorSymmetry()">처음부터 풀기 🔄</button>' +
                '</div>');
            return;
        }
        renderMirrorSymmetry();
        var msg2 = document.getElementById('mirrorMsg');
        msg2.className = 'msg-box bad'; msg2.style.display = 'block';
        msg2.innerText = '음... 대칭 위치가 아니에요. (' + left + '번 더 틀리면 정답이 공개돼요)';
    }
}
function nextMirrorRound() { mirrorRound++; generateMirrorRound(); }
function retryMirrorRound() { mirrorState.selected = []; mirrorState.finished = false; mirrorState.failed = false; mirrorState.wrongCount = 0; renderMirrorSymmetry(); }
function renderMirrorSymmetry() {
    var html = '<div class="game-title-box">🪞 거울 대칭 완성하기</div>';
    html += '<div class="game-sub-desc">왼쪽 그림과 거울처럼 똑같이 되도록, 오른쪽에서 알맞은 칸을 클릭하세요!</div>';
    html += '<div class="status-row"><div>' + mirrorRound + '라운드</div><div>실수: ' + mirrorState.wrongCount + ' / ' + MIRROR_MAX_WRONG + '</div></div>';
    html += '<div class="maze-wrap"><div class="maze-grid" style="grid-template-columns: repeat(' + mirrorState.w + ', 34px);">';
    for (var y = 0; y < mirrorState.h; y++) {
        for (var x = 0; x < mirrorState.w; x++) {
            var isLeftFilled = mirrorState.filledLeft.some(function (c) { return c.x === x && c.y === y; });
            var isSelected = mirrorState.selected.some(function (c) { return c.x === x && c.y === y; });
            var isCorrectRight = mirrorState.correctRight.some(function (c) { return c.x === x && c.y === y; });
            var isMirrorLine = x === mirrorState.halfW - 1;
            var bg = '#f8fafc';
            var extra = '';
            if (x < mirrorState.halfW && isLeftFilled) bg = '#8b5cf6';
            if (x >= mirrorState.halfW && isSelected) bg = '#8b5cf6';
            if (mirrorState.failed && x >= mirrorState.halfW && isCorrectRight && !isSelected) { bg = '#d1fae5'; extra = 'box-shadow: inset 0 0 0 3px #10b981;'; }
            var borderRight = isMirrorLine ? '3px dashed #94a3b8' : '1px solid #e2e8f0';
            html += '<button type="button" class="maze-cell" style="background:' + bg + '; border-right:' + borderRight + '; cursor:pointer;' + extra + '" ' + (mirrorState.finished ? 'disabled' : '') + ' onclick="clickMirrorCell(' + x + ',' + y + ')"></button>';
        }
    }
    html += '</div></div>';
    html += '<div id="mirrorMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 28. 논리: 참/거짓 명제 추론 (인적성검사 스타일) =====================
var syllogismState = {};
var syllogismRound = 1, syllogismCorrect = 0;
function initSyllogism() { syllogismRound = 1; syllogismCorrect = 0; generateSyllogismRound(); }
function generateSyllogismRound() {
    var items = pickN(ICON_POOL, 4);
    var type = pickRandom(['valid', 'invalid', 'unknown']);
    var premise1, premise2, conclusion, answer;
    if (type === 'valid') {
        premise1 = items[0] + '는(은) ' + items[1] + '보다 커요.';
        premise2 = items[1] + '는(은) ' + items[2] + '보다 커요.';
        conclusion = items[0] + '는(은) ' + items[2] + '보다 크다.';
        answer = '맞다';
    } else if (type === 'invalid') {
        premise1 = items[0] + '는(은) ' + items[1] + '보다 커요.';
        premise2 = items[1] + '는(은) ' + items[2] + '보다 커요.';
        conclusion = items[2] + '는(은) ' + items[0] + '보다 크다.';
        answer = '틀리다';
    } else {
        premise1 = items[0] + '는(은) ' + items[1] + '보다 커요.';
        premise2 = items[2] + '는(은) ' + items[3] + '보다 커요.';
        conclusion = items[0] + '는(은) ' + items[3] + '보다 크다.';
        answer = '알 수 없다';
    }
    syllogismState = { premise1: premise1, premise2: premise2, conclusion: conclusion, answer: answer, answered: false };
    renderSyllogism();
}
var SYLLO_OPTS = ['맞다', '틀리다', '알 수 없다'];
function syllogismChoiceCfg() {
    var s = syllogismState;
    return {
        msgId: 'syllogismMsg', cols: 3,
        ok: '🎉 정답이에요!',
        bad: '아쉬워요! 정답은 "' + s.answer + '" 였어요.',
        onCorrect: function () { syllogismCorrect++; },
        onResolved: function () { syllogismRound++; },
        next: 'generateSyllogismRound()', retry: 'retrySyllogismRound()', home: 'initSyllogism()',
        failStyle: 'standard'
    };
}
function renderSyllogism() {
    var s = syllogismState;
    var html = '<div class="game-title-box">🧠 참/거짓 명제 추론</div>';
    html += '<div class="game-sub-desc">아래 단서 두 개를 보고, 마지막 문장이 맞는지 틀리는지 알 수 없는지 골라보세요!</div>';
    html += '<div class="status-row"><div>' + syllogismRound + '라운드</div><div>정답: ' + syllogismCorrect + ' / ' + (syllogismRound - 1) + '</div></div>';
    html += '<div class="msg-box" style="display:block; background:#f8fafc; border-color:#e5e7eb; text-align:left; line-height:1.9;">';
    html += '단서1: ' + s.premise1 + '<br>';
    html += '단서2: ' + s.premise2;
    html += '</div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">➡️ ' + s.conclusion + '</div>';
    var cfg = syllogismChoiceCfg();
    html += choiceOptionsHtml(SYLLO_OPTS, cfg);
    document.getElementById('mainArea').innerHTML = html;
    choiceBegin(SYLLO_OPTS.indexOf(s.answer), cfg);
}
function retrySyllogismRound() { renderSyllogism(); }

// ===================== 29. 논리: 숫자 규칙 추리 (인적성검사 스타일) =====================
var numSeqState = {};
var numSeqRound = 1, numSeqCorrect = 0;
function initNumSeq() { numSeqRound = 1; numSeqCorrect = 0; generateNumSeqRound(); }
function generateNumSeqRound() {
    var ruleType = pickRandom(['add', 'sub', 'mul', 'alt']);
    var seq = [];
    var k = getRandomInt(2, 5);
    var ruleText = '';
    if (ruleType === 'add') {
        var start = getRandomInt(1, 10);
        for (var i = 0; i < 5; i++) seq.push(start + k * i);
        ruleText = '규칙: ' + start + '에서 시작해서 숫자가 ' + k + '씩 커져요. (+' + k + ')';
    } else if (ruleType === 'sub') {
        var start2 = getRandomInt(30, 50);
        for (var i2 = 0; i2 < 5; i2++) seq.push(start2 - k * i2);
        ruleText = '규칙: ' + start2 + '에서 시작해서 숫자가 ' + k + '씩 작아져요. (-' + k + ')';
    } else if (ruleType === 'mul') {
        var v = getRandomInt(1, 3);
        var m = pickRandom([2, 3]);
        var mulStart = v;
        for (var i3 = 0; i3 < 5; i3++) { seq.push(v); v *= m; }
        ruleText = '규칙: ' + mulStart + '에서 시작해서 숫자가 ' + m + '배씩 커져요. (×' + m + ')';
    } else {
        var a = getRandomInt(3, 6), b = getRandomInt(1, 3);
        var v2 = getRandomInt(5, 10);
        seq.push(v2);
        for (var i4 = 1; i4 < 5; i4++) { v2 = (i4 % 2 === 1) ? v2 + a : v2 - b; seq.push(v2); }
        ruleText = '규칙: 번갈아가며 ' + a + '을(를) 더하고(+' + a + '), ' + b + '을(를) 빼요(-' + b + ').';
    }
    var shown = seq.slice(0, 4);
    var answer = seq[4];
    var options = [answer];
    [1, -1, 2, -2].forEach(function (d) {
        var v3 = answer + d;
        if (options.indexOf(v3) === -1 && options.length < 4) options.push(v3);
    });
    while (options.length < 4) { options.push(options[options.length - 1] + 1); }
    numSeqState = { shown: shown, answer: answer, ruleText: ruleText, fullSeq: seq, options: shuffleArray(options), answered: false };
    renderNumSeq();
}
function numSeqChoiceCfg() {
    var s = numSeqState;
    return {
        msgId: 'numSeqMsg',
        ok: '🎉 정답이에요!',
        bad: '아쉬워요! 정답은 ' + s.answer + '였어요.',
        explain: '<div class="msg-box" style="display:block; background:#f8fafc; border-color:#e5e7eb; text-align:left;">' +
            s.ruleText + '<br>전체 숫자: ' + s.fullSeq.join(', ') + '</div>',
        onCorrect: function () { numSeqCorrect++; },
        onResolved: function () { numSeqRound++; },
        next: 'generateNumSeqRound()', retry: 'retryNumSeqRound()', home: 'initNumSeq()',
        failStyle: 'standard'
    };
}
function renderNumSeq() {
    var s = numSeqState;
    var html = '<div class="game-title-box">🔢 숫자 규칙 추리</div>';
    html += '<div class="game-sub-desc">숫자들 사이의 규칙을 찾아서, 물음표에 들어갈 숫자를 맞혀보세요!</div>';
    html += '<div class="status-row"><div>' + numSeqRound + '라운드</div><div>정답: ' + numSeqCorrect + ' / ' + (numSeqRound - 1) + '</div></div>';
    html += '<div class="big-display" style="font-size:2rem; letter-spacing:0.2rem;">' + s.shown.join(',  ') + ',  ?</div>';
    var cfg = numSeqChoiceCfg();
    html += choiceOptionsHtml(s.options, cfg);
    document.getElementById('mainArea').innerHTML = html;
    choiceBegin(s.options.indexOf(s.answer), cfg);
}
function retryNumSeqRound() { renderNumSeq(); }

// ===================== 30. 논리: 무게 저울 추론하기 =====================
var weightState = {};
var weightRound = 1, weightCorrect = 0;
function initWeightScale() { weightRound = 1; weightCorrect = 0; generateWeightRound(); }
// 저울 하나를 그림. leftInner/rightInner = 접시 위 아이콘 HTML, tiltDeg = 저울대 기울기(+면 오른쪽이 아래),
// W = 전체 폭, groupId = 기우는 저울대 그룹의 id(나중에 애니메이션으로 기울일 때 사용)
function buildBalanceScale(leftInner, rightInner, tiltDeg, W, groupId) {
    W = W || 200;
    var H = 140;
    var cx = W / 2;
    var armX = Math.round(W * 0.30);
    var panW = Math.round(W * 0.34);
    var beamY = 46;
    var t = tiltDeg || 0;
    var html = '<div style="position:relative; width:' + W + 'px; height:' + H + 'px; flex:0 0 auto;">';
    // 고정 받침대: 바닥 + 기둥 + 삼각형
    html += '<div style="position:absolute; left:50%; bottom:0; width:' + Math.round(W * 0.32) + 'px; height:5px; background:#94a3b8; border-radius:3px; transform:translateX(-50%);"></div>';
    html += '<div style="position:absolute; left:50%; bottom:3px; width:3px; height:' + (H - beamY - 8) + 'px; background:#94a3b8; transform:translateX(-50%);"></div>';
    html += '<div style="position:absolute; left:50%; top:' + (beamY - 4) + 'px; width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-bottom:14px solid #64748b; transform:translateX(-50%);"></div>';
    // 기우는 저울대 그룹 (기둥 꼭대기를 축으로 회전)
    html += '<div ' + (groupId ? 'id="' + groupId + '" ' : '') + 'style="position:absolute; left:0; top:0; width:' + W + 'px; height:' + H + 'px; transform-origin:' + cx + 'px ' + beamY + 'px; transform:rotate(' + t + 'deg); transition:transform 0.7s cubic-bezier(.34,1.25,.64,1);">';
    html += '<div style="position:absolute; left:' + (cx - armX - 6) + 'px; top:' + beamY + 'px; width:' + (2 * armX + 12) + 'px; height:5px; background:#64748b; border-radius:3px;"></div>';
    html += '<div style="position:absolute; left:' + (cx - 6) + 'px; top:' + (beamY - 4) + 'px; width:12px; height:12px; background:#64748b; border-radius:50%;"></div>';
    var iconAW = Math.min(panW + 52, 2 * armX - 8);   // 접시 위 아이콘 영역: 접시보다 넓게, 단 양쪽이 안 겹치게
    [[cx - armX, leftInner], [cx + armX, rightInner]].forEach(function (p) {
        var sx = p[0], inner = p[1];
        html += '<div style="position:absolute; left:' + (sx - 1) + 'px; top:' + (beamY + 3) + 'px; width:2px; height:22px; background:#cbd5e1;"></div>';
        html += '<div style="position:absolute; left:' + (sx - panW / 2) + 'px; top:' + (beamY + 24) + 'px; width:' + panW + 'px; height:8px; background:#e2e8f0; border:1px solid #94a3b8; border-radius:0 0 34px 34px / 0 0 11px 11px;"></div>';
        html += '<div style="position:absolute; left:' + (sx - iconAW / 2) + 'px; top:' + (beamY - 24) + 'px; width:' + iconAW + 'px; height:48px; display:flex; align-items:flex-end; justify-content:center; flex-wrap:wrap;">' + inner + '</div>';
    });
    html += '</div></div>';
    return html;
}
// 접시에 올릴 아이콘 n개 (개수가 많으면 자동으로 작게)
function weightIconPile(icon, n) {
    var size = n >= 7 ? '1.05rem' : (n >= 5 ? '1.3rem' : (n >= 4 ? '1.55rem' : (n >= 3 ? '1.7rem' : '2.15rem')));
    var html = '';
    for (var i = 0; i < n; i++) html += '<span style="font-size:' + size + '; line-height:1; margin:0 -1px;">' + icon + '</span>';
    return html;
}
function renderWeightQuestionScale() {
    var s = weightState;
    var leftInner = weightIconPile(s.items[0], 1);
    var rightInner, tilt = 0;
    if (!s.answered) {
        rightInner = '<span style="font-size:2.3rem; line-height:1;">❓</span>';
    } else {
        rightInner = weightIconPile(s.items[2], s.chosen);
        tilt = (s.chosen > s.answer) ? 10 : ((s.chosen < s.answer) ? -10 : 0);
    }
    return buildBalanceScale(leftInner, rightInner, tilt, 236, 'weightQScaleBeam');
}
function generateWeightRound() {
    var items = pickN(ICON_POOL, 3);
    var r1 = pickRandom([2, 3]);
    var r2 = pickRandom([2, 3]);
    var answer = r1 * r2;
    var options = [answer];
    [r1 + r2, r1, r2, answer + 1, answer - 1].forEach(function (v) {
        if (v > 0 && options.indexOf(v) === -1 && options.length < 4) options.push(v);
    });
    while (options.length < 4) { options.push(options[options.length - 1] + 1); }
    weightState = { items: items, r1: r1, r2: r2, answer: answer, options: shuffleArray(options), answered: false, chosen: null };
    renderWeightScale();
}
function renderWeightScale() {
    var s = weightState;
    var html = '<div class="game-title-box">⚖️ 무게 저울 추론하기</div>';
    html += '<div class="game-sub-desc">위 <b>단서 저울 2개</b>는 양쪽 무게가 똑같아요. 이걸 보고 아래 <b style="color:var(--primary);">문제 저울</b>의 ❓ 자리에 들어갈 개수를 맞혀보세요!</div>';
    html += '<div class="status-row"><div>' + weightRound + '라운드</div><div>정답: ' + weightCorrect + ' / ' + (weightRound - 1) + '</div></div>';
    html += '<div class="row-label">단서 저울</div>';
    html += '<div style="width:100%; overflow-x:auto;"><div style="display:flex; justify-content:center; align-items:flex-start; gap:0.5rem; flex-wrap:wrap; min-width:min-content;">';
    html += buildBalanceScale(weightIconPile(s.items[0], 1), weightIconPile(s.items[1], s.r1), 0, 210);
    html += buildBalanceScale(weightIconPile(s.items[1], 1), weightIconPile(s.items[2], s.r2), 0, 210);
    html += '</div></div>';
    html += '<div class="row-label" style="margin-top:0.5rem;">문제 저울 &nbsp;—&nbsp; ' + s.items[0] + ' 1개 = ' + s.items[2] + ' ❓개</div>';
    html += '<div id="weightQ" style="display:flex; justify-content:center;">' + renderWeightQuestionScale() + '</div>';
    html += '<div id="weightOpts">';
    if (!s.answered) {
        html += '<div class="game-sub-desc" style="text-align:center; font-weight:800; margin-top:0.3rem;">' + s.items[0] + ' 1개는 ' + s.items[2] + ' 몇 개와 같을까요?</div>';
        html += '<div class="options-grid">';
        s.options.forEach(function (opt, idx) {
            html += '<button class="opt-btn text-opt" onclick="checkWeightScale(this,' + idx + ')">' + s.items[2] + ' ' + opt + '개</button>';
        });
        html += '</div>';
    }
    html += '</div>';
    html += '<div id="weightMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function checkWeightScale(btn, idx) {
    if (weightState.answered) return;
    weightState.answered = true;
    vibrateShort();
    var s = weightState;
    s.chosen = s.options[idx];
    var correct = s.chosen === s.answer;
    var tilt = correct ? 0 : (s.chosen > s.answer ? 10 : -10);
    if (correct) weightCorrect++;
    weightRound++;
    var optsEl = document.getElementById('weightOpts');
    if (optsEl) optsEl.innerHTML = '';
    // 문제 저울에 내가 고른 개수만큼 아이콘을 올리고(처음엔 수평), 잠시 뒤 기울여 결과를 보여줌
    var qEl = document.getElementById('weightQ');
    if (qEl) qEl.innerHTML = buildBalanceScale(weightIconPile(s.items[0], 1), weightIconPile(s.items[2], s.chosen), 0, 236, 'weightQScaleBeam');
    var t = gameTimeout(function () {
        var g = document.getElementById('weightQScaleBeam');
        if (g) g.style.transform = 'rotate(' + tilt + 'deg)';
    }, 110);
    var msg = document.getElementById('weightMsg');
    msg.style.display = 'block';
    if (correct) {
        msg.className = 'msg-box';
        msg.innerText = '🎉 정답이에요! ' + s.r1 + ' × ' + s.r2 + ' = ' + s.answer + '개 — 문제 저울이 딱 균형을 이뤘어요!';
    } else {
        msg.className = 'msg-box bad';
        var dir = s.chosen > s.answer
            ? ('내가 고른 ' + s.items[2] + ' ' + s.chosen + '개가 더 무거워서 그쪽으로 기울었어요 (너무 많아요)')
            : (s.items[0] + ' 쪽이 더 무거워서 그쪽으로 기울었어요 (너무 적어요)');
        msg.innerText = '아쉬워요! ' + dir + '. 정답은 ' + s.answer + '개였어요. (' + s.r1 + ' × ' + s.r2 + ')';
    }
    document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('generateWeightRound()', 'retryWeightRound()', 'initWeightScale()'));
}
function retryWeightRound() { weightState.answered = false; weightState.chosen = null; renderWeightScale(); }

// ===================== 31. 논리: 스도쿠 퍼즐 라이트 =====================
var SUDOKU_BASE = [[0, 1, 2, 3], [2, 3, 0, 1], [1, 0, 3, 2], [3, 2, 1, 0]];
var SUDOKU_HINT_MAP = { low: 3, mid: 2, high: 1, extreme: 0 };
var sudokuSettings = { level: 'low', timeLimit: 20 };
var sudokuState = {};
var sudokuRound = 1, sudokuCorrect = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('sudokuLite', { easy: { level: 'low' }, normal: { level: 'mid' }, hard: { level: 'high' } });
}
function initSudokuLite() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('sudokuLite', sudokuSettings);
    renderSudokuSetup();
}
function renderSudokuSetup() {
    var levels = [
        { v: 'low', l: '쉬움 (힌트 3개)' },
        { v: 'mid', l: '보통 (힌트 2개)' },
        { v: 'high', l: '어려움 (힌트 1개)' },
        { v: 'extreme', l: '최상 (힌트 없음)' }
    ];
    var html = '<div class="game-title-box">🧮 스도쿠 퍼즐 라이트</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요! 난이도에 따라 사용할 수 있는 힌트 개수가 달라져요.</div>';
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    levels.forEach(function (t) {
        html += '<button class="setup-btn' + (sudokuSettings.level === t.v ? ' active' : '') + '" onclick="setSudokuLevel(\'' + t.v + '\')">' + t.l + '</button>';
    });
    html += '</div>';
    var times = [{ v: 20, l: '20초' }, { v: 40, l: '40초' }, { v: 60, l: '60초' }, { v: 0, l: '무제한' }];
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (sudokuSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setSudokuTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startSudokuSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setSudokuLevel(v) { sudokuSettings.level = v; renderSudokuSetup(); }
function setSudokuTimeLimit(v) { sudokuSettings.timeLimit = v; renderSudokuSetup(); }
function startSudokuSession() { sudokuRound = 1; sudokuCorrect = 0; generateSudokuRound(); }
function startSudokuTimer() {
    var bar = document.getElementById('sudokuTimerBar');
    if (bar) bar.style.width = (sudokuState.timeLeft / sudokuState.timeLimit * 100) + '%';
    sudokuState.timerId = setInterval(function () {
        sudokuState.timeLeft -= 0.1;
        var b = document.getElementById('sudokuTimerBar');
        if (b) b.style.width = Math.max(0, sudokuState.timeLeft / sudokuState.timeLimit * 100) + '%';
        if (sudokuState.timeLeft <= 0) { handleSudokuTimeout(); }
    }, 100);
    activeTimers.push(sudokuState.timerId);
}
function handleSudokuTimeout() {
    if (sudokuState.timedOut || sudokuState.checked) return;
    if (sudokuState.timerId) { clearInterval(sudokuState.timerId); sudokuState.timerId = null; }
    sudokuState.timedOut = true;
    if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
    renderSudoku();
}
function generateSudokuSolution() {
    var grid = SUDOKU_BASE.map(function (row) { return row.slice(); });
    var perm = shuffleArray([0, 1, 2, 3]);
    grid = grid.map(function (row) { return row.map(function (v) { return perm[v]; }); });
    if (Math.random() < 0.5) { var t = grid[0]; grid[0] = grid[1]; grid[1] = t; }
    if (Math.random() < 0.5) { var t2 = grid[2]; grid[2] = grid[3]; grid[3] = t2; }
    if (Math.random() < 0.5) { var b0 = grid[0], b1 = grid[1]; grid[0] = grid[2]; grid[1] = grid[3]; grid[2] = b0; grid[3] = b1; }
    if (Math.random() < 0.5) { grid.forEach(function (row) { var t3 = row[0]; row[0] = row[1]; row[1] = t3; }); }
    if (Math.random() < 0.5) { grid.forEach(function (row) { var t4 = row[2]; row[2] = row[3]; row[3] = t4; }); }
    if (Math.random() < 0.5) { grid.forEach(function (row) { var a = row[0], b = row[1]; row[0] = row[2]; row[1] = row[3]; row[2] = a; row[3] = b; }); }
    if (Math.random() < 0.5) {
        var tg = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        for (var r = 0; r < 4; r++) { for (var c = 0; c < 4; c++) { tg[c][r] = grid[r][c]; } }
        grid = tg;
    }
    return grid;
}
// 4×4 스도쿠(2×2 상자)의 해 개수를 센다 (limit 이상이면 조기 종료)
function sudokuCountSolutions(grid, limit) {
    limit = limit || 2;
    var g = grid.map(function (row) { return row.slice(); });
    var count = 0;
    function ok(r, c, v) {
        for (var k = 0; k < 4; k++) { if (g[r][k] === v || g[k][c] === v) return false; }
        var br = r - r % 2, bc = c - c % 2;
        return g[br][bc] !== v && g[br][bc + 1] !== v && g[br + 1][bc] !== v && g[br + 1][bc + 1] !== v;
    }
    function rec() {
        var r = -1, c = -1;
        for (var i = 0; i < 4 && r < 0; i++) { for (var j = 0; j < 4; j++) { if (g[i][j] === null) { r = i; c = j; break; } } }
        if (r < 0) { count++; return; }
        for (var v = 0; v < 4 && count < limit; v++) {
            if (ok(r, c, v)) { g[r][c] = v; rec(); g[r][c] = null; }
        }
    }
    rec();
    return count;
}
// 정답이 유일하게 결정되는 빈칸 조합을 찾는다. (여러 정답이 나오는 불공정한 퍼즐 방지)
function sudokuMakeUniqueBlanks(solution, blankCount) {
    var all = Array.from({ length: 16 }, function (_, i) { return i; });
    for (var t = 0; t < 80; t++) {
        var picks = pickN(all, blankCount);
        var g = solution.map(function (row) { return row.slice(); });
        picks.forEach(function (p) { g[Math.floor(p / 4)][p % 4] = null; });
        if (sudokuCountSolutions(g, 2) === 1) return picks;
    }
    return null;
}
function generateSudokuRound() {
    var solution = generateSudokuSolution();
    var icons = pickN(ICON_POOL, 4);
    var blankPositions = sudokuMakeUniqueBlanks(solution, 8) || sudokuMakeUniqueBlanks(solution, 7) ||
        sudokuMakeUniqueBlanks(solution, 6) || pickN(Array.from({ length: 16 }, function (_, i) { return i; }), 6);
    var editable = [[false, false, false, false], [false, false, false, false], [false, false, false, false], [false, false, false, false]];
    var userGrid = solution.map(function (row) { return row.slice(); });
    blankPositions.forEach(function (pos) {
        var r = Math.floor(pos / 4), c = pos % 4;
        editable[r][c] = true;
        userGrid[r][c] = null;
    });
    if (sudokuState.timerId) { clearInterval(sudokuState.timerId); }
    sudokuState = {
        solution: solution, icons: icons, editable: editable, userGrid: userGrid,
        origUserGrid: userGrid.map(function (row) { return row.slice(); }),
        checked: false, wrongCells: [],
        hintsRemaining: SUDOKU_HINT_MAP[sudokuSettings.level], hintMode: false, hintedCells: [],
        timeLimit: sudokuSettings.timeLimit, timeLeft: sudokuSettings.timeLimit, timerId: null, timedOut: false
    };
    renderSudoku();
    if (sudokuState.timeLimit > 0) { startSudokuTimer(); }
}
function useSudokuHint() {
    if (sudokuState.timedOut) return;
    if (sudokuState.checked || sudokuState.hintMode || sudokuState.hintsRemaining <= 0) return;
    sudokuState.hintMode = true;
    renderSudoku();
}
function sudokuCellClick(r, c) {
    if (sudokuState.timedOut) return;
    if (sudokuState.checked) return;
    if (!sudokuState.editable[r][c]) return;
    if (sudokuState.hintedCells.indexOf(r + ',' + c) > -1) return;
    if (sudokuState.hintMode) {
        vibrateShort();
        sudokuState.userGrid[r][c] = sudokuState.solution[r][c];
        sudokuState.hintedCells.push(r + ',' + c);
        sudokuState.hintsRemaining--;
        sudokuState.hintMode = false;
        sudokuState.wrongCells = [];
        renderSudoku();
        return;
    }
    vibrateShort();
    var cur = sudokuState.userGrid[r][c];
    sudokuState.userGrid[r][c] = (cur === null) ? 0 : (cur + 1) % 4;
    sudokuState.wrongCells = [];
    renderSudoku();
}
function checkSudoku() {
    if (sudokuState.timedOut) return;
    if (sudokuState.checked) return;
    var allFilled = true;
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
            if (sudokuState.editable[r][c] && sudokuState.userGrid[r][c] === null) allFilled = false;
        }
    }
    var msg = document.getElementById('sudokuMsg');
    if (!allFilled) {
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '아직 빈칸이 남아있어요! 모두 채워주세요.';
        return;
    }
    var wrongCells = [];
    for (var r2 = 0; r2 < 4; r2++) {
        for (var c2 = 0; c2 < 4; c2++) {
            if (sudokuState.editable[r2][c2] && sudokuState.userGrid[r2][c2] !== sudokuState.solution[r2][c2]) {
                wrongCells.push(r2 + ',' + c2);
            }
        }
    }
    if (wrongCells.length === 0) {
        sudokuState.checked = true;
        if (sudokuState.timerId) { clearInterval(sudokuState.timerId); sudokuState.timerId = null; }
        sudokuCorrect++;
        if (typeof reportGameOutcome === 'function') reportGameOutcome('win');
        renderSudoku();
        msg = document.getElementById('sudokuMsg');
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 완벽해요! 규칙에 맞게 모두 채웠어요.';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextSudokuRound()', 'retrySudokuRound()', 'renderSudokuSetup()'));
    } else {
        if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
        sudokuState.wrongCells = wrongCells;
        renderSudoku();
        msg = document.getElementById('sudokuMsg');
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '아직 틀린 칸이 있어요! 빨간 테두리 칸을 다시 눌러 바꿔보세요.';
    }
}
function nextSudokuRound() { sudokuRound++; generateSudokuRound(); }
function retrySudokuRound() {
    if (sudokuState.timerId) { clearInterval(sudokuState.timerId); }
    sudokuState.userGrid = sudokuState.origUserGrid.map(function (row) { return row.slice(); });
    sudokuState.checked = false;
    sudokuState.wrongCells = [];
    sudokuState.hintMode = false;
    sudokuState.hintedCells = [];
    sudokuState.hintsRemaining = SUDOKU_HINT_MAP[sudokuSettings.level];
    sudokuState.timeLeft = sudokuState.timeLimit;
    sudokuState.timerId = null;
    sudokuState.timedOut = false;
    renderSudoku();
    if (sudokuState.timeLimit > 0) { startSudokuTimer(); }
}
function renderSudoku() {
    var html = '<div class="game-title-box">🧮 스도쿠 퍼즐 라이트</div>';
    html += '<div class="game-sub-desc">가로줄, 세로줄, 굵은 선으로 나뉜 2×2 상자 안에 같은 그림이 두 번 나오지 않도록 빈칸을 채워보세요! 빈칸을 누르면 그림이 바뀌어요.</div>';
    html += '<div class="status-row"><div>' + sudokuRound + '라운드</div><div>정답: ' + sudokuCorrect + ' / ' + (sudokuRound - 1) + '</div></div>';
    if (sudokuState.timeLimit > 0 && !sudokuState.checked && !sudokuState.timedOut) {
        html += '<div class="timer-container"><div class="timer-bar" id="sudokuTimerBar" style="width:' + (sudokuState.timeLeft / sudokuState.timeLimit * 100) + '%;"></div></div>';
    }
    if (sudokuState.timedOut) {
        html += '<div class="msg-box bad" style="display:block;">⏰ 시간이 다 됐어요!</div>';
    }
    if (sudokuState.hintMode) {
        html += '<div class="msg-box" style="display:block; background:#f5f3ff; border-color:#c4b5fd; color:#5b21b6;">💡 정답을 표시하고 싶은 칸을 선택하세요!</div>';
    }
    html += '<div class="matrix-grid" style="grid-template-columns: repeat(4, 60px);">';
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
            var isEditable = sudokuState.editable[r][c];
            var isHinted = sudokuState.hintedCells.indexOf(r + ',' + c) > -1;
            var val = sudokuState.userGrid[r][c];
            var content = (val === null) ? '?' : sudokuState.icons[val];
            var isWrong = sudokuState.wrongCells.indexOf(r + ',' + c) > -1;
            var clickable = isEditable && !isHinted && !sudokuState.timedOut;
            var cls = 'matrix-cell' + ((isEditable && val === null) ? ' blank' : '');
            var styleParts = [];
            if (c === 1) styleParts.push('border-right:3px solid #334155');
            if (r === 1) styleParts.push('border-bottom:3px solid #334155');
            if (clickable) styleParts.push('cursor:pointer');
            if (sudokuState.hintMode && clickable) { styleParts.push('border-color:#8b5cf6'); styleParts.push('background:#f5f3ff'); }
            if (isHinted) { styleParts.push('border-color:#eab308'); styleParts.push('background:#fef9c3'); }
            if (isWrong) { styleParts.push('border-color:#ef4444'); styleParts.push('background:#fee2e2'); }
            var styleAttr = styleParts.length ? ' style="' + styleParts.join(';') + ';"' : '';
            var onclickAttr = clickable ? ' onclick="sudokuCellClick(' + r + ',' + c + ')"' : '';
            html += '<div class="' + cls + '"' + styleAttr + onclickAttr + '>' + content + '</div>';
        }
    }
    html += '</div>';
    if (sudokuState.timedOut) {
        html += '<div class="options-grid">';
        html += '<button class="action-btn" onclick="retrySudokuRound()">다시 시도 🔁</button>';
        html += '<button class="action-btn secondary" onclick="renderSudokuSetup()">처음부터 ⏮</button>';
        html += '</div>';
        html += '<div id="sudokuMsg" class="msg-box"></div>';
        document.getElementById('mainArea').innerHTML = html;
        return;
    }
    html += '<div class="options-grid">';
    html += '<button class="action-btn" ' + (sudokuState.checked ? 'disabled' : '') + ' onclick="checkSudoku()">확인하기 ✅</button>';
    var hintDisabled = sudokuState.checked || sudokuState.hintMode || sudokuState.hintsRemaining <= 0;
    var hintStyle = sudokuState.hintsRemaining > 0 ? 'background:#8b5cf6;' : 'background:#d1d5db; color:#9ca3af;';
    html += '<button class="action-btn" style="' + hintStyle + '" ' + (hintDisabled ? 'disabled' : '') + ' onclick="useSudokuHint()">💡 힌트 (' + sudokuState.hintsRemaining + '개 남음)</button>';
    html += '</div>';
    html += '<div class="options-grid">';
    html += '<button class="action-btn secondary" onclick="generateSudokuRound()">새 퍼즐 🔄</button>';
    html += '<button class="action-btn secondary" onclick="renderSudokuSetup()">난이도 변경 ⚙️</button>';
    html += '</div>';
    html += '<div id="sudokuMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 32. 논리: 범인을 찾아라! =====================
var SUSPECT_COLOR_HEX = { '빨강': '#ef4444', '파랑': '#3b82f6', '노랑': '#eab308' };
var SUSPECT_SKIN_TONES = ['#fbbf77', '#f3ae6d', '#e8965a', '#c97b4a'];
var SUSPECT_COLORS = ['빨강', '파랑', '노랑'];
function buildSuspectSVG(s) {
    var shirtColor = SUSPECT_COLOR_HEX[s.color];
    var svg = '<svg viewBox="0 0 80 92" xmlns="http://www.w3.org/2000/svg" style="width:60px; height:70px;">';
    svg += '<rect x="14" y="46" width="52" height="42" rx="12" fill="' + shirtColor + '" />';
    svg += '<circle cx="40" cy="30" r="22" fill="' + s.skin + '" />';
    if (s.glasses) {
        svg += '<circle cx="30" cy="31" r="8" fill="rgba(255,255,255,0.4)" stroke="#1f2937" stroke-width="3" />';
        svg += '<circle cx="50" cy="31" r="8" fill="rgba(255,255,255,0.4)" stroke="#1f2937" stroke-width="3" />';
        svg += '<line x1="38" y1="31" x2="42" y2="31" stroke="#1f2937" stroke-width="3" />';
    } else {
        svg += '<circle cx="30" cy="30" r="2.5" fill="#1f2937" />';
        svg += '<circle cx="50" cy="30" r="2.5" fill="#1f2937" />';
    }
    svg += '<path d="M 30 41 Q 40 47 50 41" stroke="#7c4a24" stroke-width="2.5" fill="none" stroke-linecap="round" />';
    if (s.hat) {
        svg += '<path d="M 14 20 Q 40 -8 66 20 Z" fill="#374151" />';
        svg += '<rect x="9" y="18" width="62" height="7" rx="3.5" fill="#374151" />';
    }
    svg += '</svg>';
    return svg;
}
var suspectSettings = { count: 6, timeLimit: 0 };
var suspectState = {};
var suspectRound = 1, suspectCorrect = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('suspectLogic', { easy: { count: 6 }, normal: { count: 8 }, hard: { count: 10 } });
}
function initSuspectLogic() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('suspectLogic', suspectSettings);
    renderSuspectSetup();
}
function renderSuspectSetup() {
    var counts = [{ v: 6, l: '6명' }, { v: 8, l: '8명' }, { v: 10, l: '10명' }, { v: 'random', l: '무작위' }];
    var times = [{ v: 5, l: '5초' }, { v: 10, l: '10초' }, { v: 20, l: '20초' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">🕵️ 범인을 찾아라!</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">용의자 수</div><div class="setup-btn-group">';
    counts.forEach(function (c) { html += '<button class="setup-btn' + (suspectSettings.count === c.v ? ' active' : '') + '" onclick="setSuspectCount(' + (c.v === 'random' ? "'random'" : c.v) + ')">' + c.l + '</button>'; });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) { html += '<button class="setup-btn' + (suspectSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setSuspectTimeLimit(' + t.v + ')">' + t.l + '</button>'; });
    html += '</div>';
    html += '<button class="action-btn" onclick="startSuspectSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setSuspectCount(v) { suspectSettings.count = v; renderSuspectSetup(); }
function setSuspectTimeLimit(v) { suspectSettings.timeLimit = v; renderSuspectSetup(); }
function startSuspectSession() { suspectRound = 1; suspectCorrect = 0; generateSuspectRound(); }
function generateSuspects(n) {
    var combos = [];
    [true, false].forEach(function (hat) {
        [true, false].forEach(function (glasses) {
            SUSPECT_COLORS.forEach(function (color) { combos.push({ hat: hat, glasses: glasses, color: color }); });
        });
    });
    var chosenCombos = pickN(combos, n);
    var skins = [];
    for (var i = 0; i < n; i++) { skins.push(pickRandom(SUSPECT_SKIN_TONES)); }
    return chosenCombos.map(function (c, idx) { return { id: idx, skin: skins[idx], hat: c.hat, glasses: c.glasses, color: c.color, eliminated: false }; });
}
function buildClueOptions(ans) {
    var options = [];
    options.push({ text: ans.hat ? '모자를 쓰고 있어요' : '모자를 쓰지 않았어요', test: function (s) { return s.hat === ans.hat; } });
    options.push({ text: ans.glasses ? '안경을 쓰고 있어요' : '안경을 쓰지 않았어요', test: function (s) { return s.glasses === ans.glasses; } });
    options.push({ text: ans.color + ' 옷을 입고 있어요', test: function (s) { return s.color === ans.color; } });
    SUSPECT_COLORS.forEach(function (c) {
        if (c !== ans.color) { options.push({ text: c + ' 옷을 입지 않았어요', test: function (s) { return s.color !== c; } }); }
    });
    return options;
}
function generateSuspectClues(suspects, ans) {
    var remaining = suspects.slice();
    var clues = [];
    var usedText = {};
    var guard = 0;
    while (remaining.length > 1 && guard < 20) {
        guard++;
        var options = buildClueOptions(ans).filter(function (o) { return !usedText[o.text]; });
        var best = null, bestElim = -1;
        options.forEach(function (o) {
            var elim = remaining.filter(function (s) { return !o.test(s); }).length;
            if (elim > bestElim) { bestElim = elim; best = o; }
        });
        if (!best || bestElim <= 0) break;
        usedText[best.text] = true;
        clues.push(best.text);
        remaining = remaining.filter(function (s) { return best.test(s); });
    }
    return clues;
}
function generateSuspectRound() {
    var n = suspectSettings.count === 'random' ? pickRandom([6, 8, 10]) : suspectSettings.count;
    var suspects = generateSuspects(n);
    var answerId = pickRandom(suspects.map(function (s) { return s.id; }));
    var ans = suspects.filter(function (s) { return s.id === answerId; })[0];
    var clues = generateSuspectClues(suspects, ans);
    suspectState = {
        suspects: suspects, clues: clues, clueIndex: 0, answerId: answerId, checked: false, success: false,
        timeLimit: suspectSettings.timeLimit, timeLeft: suspectSettings.timeLimit, timerId: null, timedOut: false
    };
    renderSuspectLogic();
    if (suspectSettings.timeLimit > 0) { startSuspectTimer(); }
}
function startSuspectTimer() {
    var bar = document.getElementById('suspectTimerBar');
    if (bar) bar.style.width = '100%';
    suspectState.timerId = setInterval(function () {
        suspectState.timeLeft -= 0.1;
        var pct = (suspectState.timeLeft / suspectState.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('suspectTimerBar');
        if (b) b.style.width = pct + '%';
        if (suspectState.timeLeft <= 0) {
            clearInterval(suspectState.timerId);
            handleSuspectTimeout();
        }
    }, 100);
    activeTimers.push(suspectState.timerId);
}
function handleSuspectTimeout() {
    if (suspectState.checked || suspectState.timedOut) return;
    suspectState.timedOut = true;
    if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
    renderSuspectLogic();
    var msg = document.getElementById('suspectMsg');
    var ans = suspectState.suspects.filter(function (s) { return s.id === suspectState.answerId; })[0];
    msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '⏰ 시간이 다 됐어요! 범인은 노란 테두리로 표시된 용의자였어요.';
    document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextSuspectRound()', 'retrySuspectRound()', 'restartSuspectLogic()'));
}
function restartSuspectLogic() { renderSuspectSetup(); }
function nextSuspectRound() { suspectRound++; generateSuspectRound(); }
function retrySuspectRound() {
    suspectState.checked = false;
    suspectState.success = false;
    suspectState.timedOut = false;
    suspectState.clueIndex = 0;
    suspectState.suspects.forEach(function (s) { s.eliminated = false; });
    renderSuspectLogic();
    if (suspectState.timeLimit > 0) { suspectState.timeLeft = suspectState.timeLimit; startSuspectTimer(); }
}
function toggleSuspectEliminate(id) {
    if (suspectState.checked || suspectState.timedOut) return;
    vibrateShort();
    var s = suspectState.suspects.filter(function (x) { return x.id === id; })[0];
    s.eliminated = !s.eliminated;
    renderSuspectLogic();
}
function nextSuspectClue() {
    if (suspectState.timedOut) return;
    if (suspectState.clueIndex < suspectState.clues.length - 1) {
        suspectState.clueIndex++;
        renderSuspectLogic();
    }
}
function checkSuspectAnswer() {
    if (suspectState.timedOut) return;
    var active = suspectState.suspects.filter(function (s) { return !s.eliminated; });
    var msg = document.getElementById('suspectMsg');
    if (active.length === 1 && active[0].id === suspectState.answerId) {
        suspectState.checked = true;
        suspectState.success = true;
        suspectCorrect++;
        if (typeof reportGameOutcome === 'function') reportGameOutcome('win');
        if (suspectState.timerId) { clearInterval(suspectState.timerId); }
        renderSuspectLogic();
        msg = document.getElementById('suspectMsg');
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 범인을 찾았습니다!';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextSuspectRound()', 'retrySuspectRound()', 'restartSuspectLogic()'));
    } else if (active.length === 0) {
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '앗, 모든 용의자를 지워버렸어요! 범인이 사라지면 안 돼요. 다시 살펴보세요.';
    } else if (active.length > 1) {
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '아직 용의자가 ' + active.length + '명 남았어요. 단서를 다시 살펴보고 더 지워보세요!';
    } else {
        if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '이 용의자는 범인이 아니에요! 단서를 다시 살펴보세요.';
    }
}
function renderSuspectLogic() {
    var html = '<div class="game-title-box">🕵️ 범인을 찾아라!</div>';
    html += '<div class="game-sub-desc">단서를 하나씩 확인하면서, 조건에 맞지 않는 용의자를 눌러서 지워보세요! (여러 명을 한 번에 지워도 돼요)</div>';
    html += '<div class="status-row"><div>' + suspectRound + '라운드</div><div>정답: ' + suspectCorrect + ' / ' + (suspectRound - 1) + '</div></div>';
    if (suspectState.timeLimit > 0 && !suspectState.checked && !suspectState.timedOut) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="suspectTimerBar"></div></div>';
    }
    var remainCount = suspectState.suspects.filter(function (s) { return !s.eliminated; }).length;
    html += '<div class="status-row"><div>남은 단서: ' + (suspectState.clues.length - suspectState.clueIndex - 1) + '개</div><div>남은 용의자: ' + remainCount + '명</div></div>';
    html += '<div class="msg-box" style="display:block; background:#f8fafc; border-color:#e5e7eb; text-align:left; line-height:1.9;">';
    for (var i = 0; i <= suspectState.clueIndex; i++) { html += '단서 ' + (i + 1) + ': ' + suspectState.clues[i] + '<br>'; }
    html += '</div>';
    html += '<div class="tile-row" style="grid-template-columns: repeat(3, 1fr); gap:0.6rem;">';
    suspectState.suspects.forEach(function (s) {
        var isFlash = ((suspectState.checked && suspectState.success) || suspectState.timedOut) && s.id === suspectState.answerId;
        var cardStyle = 'text-align:center; padding:0.6rem 0.4rem;' + (s.eliminated ? 'opacity:0.3; background:#e5e7eb;' : '') + (isFlash ? 'background:#fef9c3; border-color:#eab308; animation: gearHighlightPulse 1s infinite;' : '');
        var clickAttr = (!suspectState.checked && !suspectState.timedOut) ? ' onclick="toggleSuspectEliminate(' + s.id + ')"' : '';
        html += '<div class="game-tile" style="' + cardStyle + ' cursor:pointer; position:relative;"' + clickAttr + '>';
        html += buildSuspectSVG(s);
        if (s.eliminated) html += '<div style="position:absolute; top:0.3rem; right:0.3rem; font-size:1.1rem; color:#ef4444; font-weight:800;">❌</div>';
        html += '</div>';
    });
    html += '</div>';
    html += '<div class="options-grid">';
    if (suspectState.clueIndex < suspectState.clues.length - 1) {
        html += '<button class="action-btn secondary" ' + (suspectState.timedOut ? 'disabled' : '') + ' onclick="nextSuspectClue()">다음 단서 ▶</button>';
    }
    html += '<button class="action-btn" ' + (suspectState.checked || suspectState.timedOut ? 'disabled' : '') + ' onclick="checkSuspectAnswer()">범인 지목하기 ✅</button>';
    html += '</div>';
    html += '<div id="suspectMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (suspectState.timeLimit > 0 && !suspectState.checked && !suspectState.timedOut) {
        var barEl = document.getElementById('suspectTimerBar');
        if (barEl) barEl.style.width = (suspectState.timeLeft / suspectState.timeLimit * 100) + '%';
    }
}

// ===================== 33. 논리: 진실/거짓말 탐정 =====================
// 항상 진실만 말하는 캐릭터(😇)와 항상 거짓만 말하는 캐릭터(😈)의 단서를 듣고 보물이 있는 문을 추론.
// 라운드는 반드시 "모든 (문 위치 × 역할 조합)"을 브루트포스로 검사해 정답이 정확히 1개인 경우만 채택한다.
function tld_starN(c, t) { var r = t > 0 ? c / t : 0; return r >= 0.9 ? 3 : (r >= 0.6 ? 2 : 1); }
function tld_starStr(n) { return '⭐⭐⭐'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
var TLD_FACES = [
    { e: '🦊', n: '여우' }, { e: '🐰', n: '토끼' }, { e: '🐻', n: '곰' }, { e: '🦉', n: '부엉이' }, { e: '🐼', n: '판다' }, { e: '🐯', n: '호랑이' }
];
var tldState = { level: 1 };
var TLD_TOTAL = 8;
function initTruthLiar() { clearAllGameTimers(); renderTruthLiarSetup(); }
function renderTruthLiarSetup() {
    if (!tldState.level) tldState.level = 1;
    var html = '<div class="game-title-box">🕵️‍♀️ 진실/거짓말 탐정</div>';
    html += '<div class="game-sub-desc">😇 는 <b>항상 진실</b>만, 😈 는 <b>항상 거짓</b>만 말해요. 단서를 잘 읽고 보물이 있는 문을 찾아요!</div>';
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    [{ v: 1, l: '1단계 · 1명·정체 공개' }, { v: 2, l: '2단계 · 2명·정체 공개' }, { v: 3, l: '3단계 · 2명·정체 비밀' }].forEach(function (t) {
        html += '<button class="setup-btn' + (tldState.level === t.v ? ' active' : '') + '" onclick="setTldLevel(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startTruthLiarSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setTldLevel(v) { tldState.level = v; renderTruthLiarSetup(); }
// 한 캐릭터의 진술이 "참"인지 판정 (가정: 보물 위치 tp, 역할 배열 roles)
function tld_stmtTrue(clue, speakerIdx, tp, roles) {
    if (clue.kind === 'in') return tp === clue.door;
    if (clue.kind === 'notin') return tp !== clue.door;
    if (clue.kind === 'iamtruth') return roles[speakerIdx] === 'truth';
    if (clue.kind === 'otherTruth') return roles[clue.who] === 'truth';
    if (clue.kind === 'otherLiar') return roles[clue.who] === 'liar';
    if (clue.kind === 'atLeastOneLiar') return roles.filter(function (r) { return r === 'liar'; }).length >= 1;
    if (clue.kind === 'bothLiars') return roles.every(function (r) { return r === 'liar'; });
    return false;
}
function tld_consistent(chars, tp, roles) {
    for (var i = 0; i < chars.length; i++) {
        var st = tld_stmtTrue(chars[i].clue, i, tp, roles);
        if (roles[i] === 'truth' && !st) return false;
        if (roles[i] === 'liar' && st) return false;
    }
    return true;
}
// 정답 가능한 문 위치들(중복 제거)을 반환. fixedRoles=true면 주어진 역할만, 아니면 모든 역할 조합 탐색.
function tld_solutions(doors, chars, fixedRoles) {
    var roleCombos;
    if (fixedRoles) { roleCombos = [chars.map(function (c) { return c.role; })]; }
    else {
        roleCombos = [];
        for (var m = 0; m < (1 << chars.length); m++) {
            var rc = [];
            for (var b = 0; b < chars.length; b++) rc.push(((m >> b) & 1) ? 'liar' : 'truth');
            roleCombos.push(rc);
        }
    }
    var tps = [];
    for (var tp = 0; tp < doors; tp++) {
        for (var r = 0; r < roleCombos.length; r++) {
            if (tld_consistent(chars, tp, roleCombos[r])) { if (tps.indexOf(tp) === -1) tps.push(tp); break; }
        }
    }
    return tps;
}
function tld_clueText(clue, chars) {
    if (clue.kind === 'in') return '보물은 ' + (clue.door + 1) + '번 문 뒤에 있어.';
    if (clue.kind === 'notin') return '보물은 ' + (clue.door + 1) + '번 문 뒤에 없어.';
    if (clue.kind === 'iamtruth') return '나는 진실만 말해.';
    if (clue.kind === 'otherTruth') return chars[clue.who].face.n + '(은)는 진실만 말해.';
    if (clue.kind === 'otherLiar') return chars[clue.who].face.n + '(은)는 거짓말쟁이야.';
    if (clue.kind === 'atLeastOneLiar') return '우리 둘 중 적어도 한 명은 거짓말쟁이야.';
    if (clue.kind === 'bothLiars') return '우리 둘 다 거짓말쟁이야.';
    return '';
}
function genTruthLiarRound(level) {
    if (level === 3) return genTruthLiarLevel3();
    var doors = level === 1 ? 2 : 3;
    var nChars = level === 1 ? 1 : 2;
    for (var attempt = 0; attempt < 400; attempt++) {
        var tp = getRandomInt(0, doors - 1);
        var faces = pickN(TLD_FACES, nChars);
        var chars = [];
        for (var i = 0; i < nChars; i++) {
            chars.push({ face: faces[i], role: pickRandom(['truth', 'liar']), clue: null });
        }
        for (var j = 0; j < nChars; j++) {
            var kind = pickRandom(level === 1 ? ['in', 'notin'] : ['in', 'notin', 'notin']);
            chars[j].clue = { kind: kind, door: getRandomInt(0, doors - 1) };
        }
        if (!tld_consistent(chars, tp, chars.map(function (c) { return c.role; }))) continue;
        var sols = tld_solutions(doors, chars, true);
        if (sols.length === 1 && sols[0] === tp) {
            return { doors: doors, tp: tp, chars: chars, fixedRoles: true };
        }
    }
    // 안전 폴백: 1명·진실·직접단서
    var f = pickN(TLD_FACES, 1)[0];
    return { doors: 2, tp: 0, chars: [{ face: f, role: 'truth', clue: { kind: 'in', door: 0 } }], fixedRoles: true };
}
// 3단계(정체 비공개): 한 캐릭터는 역할을 강제하는 자기참조 단서, 다른 캐릭터는 내용 단서 → 항상 유일해
function genTruthLiarLevel3() {
    for (var attempt = 0; attempt < 400; attempt++) {
        var tp = getRandomInt(0, 1);
        var faces = pickN(TLD_FACES, 2);
        var forcing = pickRandom(['atLeastOneLiar', 'bothLiars']);
        var r0 = forcing === 'atLeastOneLiar' ? 'truth' : 'liar';
        var r1 = forcing === 'atLeastOneLiar' ? 'liar' : 'truth';
        var chars = [
            { face: faces[0], role: r0, clue: { kind: forcing } },
            { face: faces[1], role: r1, clue: { kind: pickRandom(['in', 'notin']), door: getRandomInt(0, 1) } }
        ];
        if (!tld_consistent(chars, tp, [r0, r1])) continue;
        var sols = tld_solutions(2, chars, false);
        if (sols.length === 1 && sols[0] === tp) return { doors: 2, tp: tp, chars: chars, fixedRoles: false };
    }
    var f = pickN(TLD_FACES, 2);
    return { doors: 2, tp: 1, chars: [{ face: f[0], role: 'truth', clue: { kind: 'atLeastOneLiar' } }, { face: f[1], role: 'liar', clue: { kind: 'notin', door: 1 } }], fixedRoles: false };
}
function startTruthLiarSession() {
    if (!tldState.level) tldState.level = 1;
    tldState.round = 0;
    tldState.correct = 0;
    tldState.hintUsed = 0;
    nextTruthLiarRound();
}
function nextTruthLiarRound() {
    tldState.round++;
    if (tldState.round > TLD_TOTAL) { finishTruthLiarSession(); return; }
    var r = genTruthLiarRound(tldState.level);
    tldState.doors = r.doors;
    tldState.tp = r.tp;
    tldState.chars = r.chars;
    tldState.fixedRoles = r.fixedRoles;
    tldState.answered = false;
    tldState.firstTry = true;
    tldState.revealRole = -1;
    renderTruthLiarRound();
}
function renderTruthLiarRound() {
    var st = tldState;
    var html = '<div class="game-title-box">🕵️‍♀️ 진실/거짓말 탐정</div>';
    html += '<div class="status-row"><div>' + st.round + ' / ' + TLD_TOTAL + ' 라운드</div><div>정답: ' + st.correct + '</div></div>';
    html += '<div class="eng-btn-row"><button class="eng-mini-btn" onclick="initTruthLiar()">⏮ 처음으로</button></div>';
    html += '<div class="game-sub-desc" style="text-align:center;">😇 항상 진실 · 😈 항상 거짓' + (st.fixedRoles ? '' : ' — <b>이번엔 정체가 비밀!</b>') + '</div>';
    html += '<div class="tld-char-row">';
    st.chars.forEach(function (c, i) {
        var roleShown = st.fixedRoles || st.revealRole === i;
        var roleIcon = roleShown ? (c.role === 'truth' ? '😇 진실' : '😈 거짓') : '❓ 정체 비밀';
        html += '<div class="tld-char"><div class="tld-char-face">' + c.face.e + ' ' + c.face.n + '</div>';
        html += '<div class="tld-char-role">' + roleIcon + '</div>';
        html += '<div class="tld-bubble">“' + tld_clueText(c.clue, st.chars) + '”</div></div>';
    });
    html += '</div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">보물은 몇 번 문 뒤에 있을까요?</div>';
    html += '<div class="tld-door-row">';
    for (var d = 0; d < st.doors; d++) {
        html += '<button class="tld-door" data-d="' + d + '" onclick="checkTruthLiar(' + d + ')">🚪<br>' + (d + 1) + '번</button>';
    }
    html += '</div>';
    if (!st.fixedRoles && !st.answered && st.revealRole === -1) {
        html += '<div style="text-align:center;"><button class="action-btn secondary" style="font-size:0.82rem; padding:0.45rem 0.9rem;" onclick="tldHint()">💡 힌트: 한 명의 정체 보기 (별 -1)</button></div>';
    }
    html += '<div id="tldMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function tldHint() {
    if (tldState.answered) return;
    tldState.revealRole = 0;
    tldState.hintUsed++;
    renderTruthLiarRound();
}
function checkTruthLiar(d) {
    var st = tldState;
    if (st.answered) return;
    var doors = document.querySelectorAll('.tld-door');
    var msg = document.getElementById('tldMsg');
    if (d === st.tp) {
        st.answered = true;
        vibrateShort();
        doors[d].classList.add('correct');
        if (st.firstTry && st.hintUsed === 0) st.correct++;
        else if (st.firstTry) st.correct += 0.5;
        msg.className = 'msg-box'; msg.style.display = 'block';
        msg.innerText = '🎉 정답! 보물은 ' + (st.tp + 1) + '번 문 뒤에 있었어요.';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" style="width:100%;" onclick="nextTruthLiarRound()">다음 ▶</button>');
    } else {
        st.firstTry = false;
        doors[d].classList.add('wrong');
        var b = doors[d];
        var tt = gameTimeout(function () { b.classList.remove('wrong'); }, 500);
        // 해설: 각 캐릭터의 진술을 실제 정답 기준으로 해석
        var expl = st.chars.map(function (c, i) {
            var actuallyTrue = tld_stmtTrue(c.clue, i, st.tp, st.chars.map(function (x) { return x.role; }));
            var roleTxt = c.role === 'truth' ? '진실쟁이' : '거짓말쟁이';
            return c.face.n + '(' + roleTxt + ')의 말은 사실 ' + (actuallyTrue ? '맞는 말' : '틀린 말') + '이에요.';
        }).join(' ');
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '아쉬워요! ' + expl + ' 다시 생각해볼까요?';
    }
}
function finishTruthLiarSession() {
    var st = tldState;
    if (typeof reportGameRound === 'function') reportGameRound(Math.round(st.correct));
    var n = tld_starN(Math.round(st.correct), TLD_TOTAL);
    if (typeof reportGameOutcome === 'function') reportGameOutcome(n >= 2 ? 'win' : 'lose');
    var html = '<div class="game-title-box">🕵️‍♀️ 진실/거짓말 탐정 — 끝!</div>';
    html += '<div style="text-align:center; font-size:2rem; letter-spacing:0.15rem; margin:0.7rem 0;">' + tld_starStr(n) + '</div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">' + TLD_TOTAL + '문제 중 <span style="color:var(--primary);">' + Math.round(st.correct) + '개</span> 정답!</div>';
    html += buildStandardResultButtons('initTruthLiar()', 'startTruthLiarSession()', 'goHome()');
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 34. 논리: 규칙 벗어난 것 찾기 =====================
// 5~7개 아이템 무리에서 스스로 규칙을 찾고 예외 하나를 고른다. 규칙은 항상 문장으로 해설.
function orr_starN(c, t) { var r = t > 0 ? c / t : 0; return r >= 0.9 ? 3 : (r >= 0.6 ? 2 : 1); }
function orr_starStr(n) { return '⭐⭐⭐'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
var ORR_COLOR_EMO = {
    circle: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'],
    square: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪'],
    heart: ['❤️', '🧡', '💛', '💚', '💙', '💜']
};
var ORR_COLOR_KO = ['빨강', '주황', '노랑', '초록', '파랑', '보라'];
var ORR_SHAPE_KO = { circle: '동그라미', square: '네모', heart: '하트' };
var ORR_ANIMALS = ['🐶', '🐱', '🐰', '🐻', '🦁', '🐯', '🐸', '🐵', '🐨', '🐮', '🐷', '🐔'];
var ORR_PLANTS = ['🌳', '🌵', '🌻', '🌷', '🍄', '🌲'];
var ORR_VEHICLES = ['🚗', '🚌', '🚂', '✈️', '🚲', '🚀', '🛵', '🚁'];
var ORR_FOODS = ['🍎', '🍌', '🍓', '🍕', '🍔', '🍞', '🍩', '🍪'];
var ORR_ARROWS_R = ['➡️', '👉', '🕐'];
var ORR_ARROWS_L = ['⬅️', '👈', '🕘'];
var orrState = { level: 1 };
var ORR_TOTAL = 10;
function initOddRuleOut() { clearAllGameTimers(); renderOddRuleSetup(); }
function renderOddRuleSetup() {
    if (!orrState.level) orrState.level = 1;
    var html = '<div class="game-title-box">🔍 규칙 벗어난 것 찾기</div>';
    html += '<div class="game-sub-desc">아이템들이 지키는 규칙을 스스로 찾아내고, 그 규칙에서 <b>벗어난 하나</b>를 골라요.</div>';
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    [{ v: 1, l: '1단계 · 눈에 바로 보임' }, { v: 2, l: '2단계 · 셈이 필요함' }, { v: 3, l: '3단계 · 색+모양 동시에' }].forEach(function (t) {
        html += '<button class="setup-btn' + (orrState.level === t.v ? ' active' : '') + '" onclick="setOrrLevel(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startOddRuleSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setOrrLevel(v) { orrState.level = v; renderOddRuleSetup(); }
// 각 생성기는 { cells:[표시문자열], odd:정답인덱스, explain:'해설' } 반환
function orr_genCategory() {
    var sets = [
        { normal: ORR_ANIMALS, odd: ORR_PLANTS, nk: '동물', ok: '식물' },
        { normal: ORR_ANIMALS, odd: ORR_VEHICLES, nk: '동물', ok: '탈것' },
        { normal: ORR_VEHICLES, odd: ORR_ANIMALS, nk: '탈것', ok: '동물' },
        { normal: ORR_FOODS, odd: ORR_ANIMALS, nk: '먹는 것', ok: '동물' },
        { normal: ORR_VEHICLES, odd: ORR_FOODS, nk: '탈것', ok: '먹는 것' }
    ];
    var s = pickRandom(sets);
    var k = getRandomInt(5, 7);
    var cells = pickN(s.normal, k - 1);
    var oddEmo = pickRandom(s.odd.filter(function (e) { return cells.indexOf(e) === -1; }));
    var oddIdx = getRandomInt(0, k - 1);
    cells.splice(oddIdx, 0, oddEmo);
    return { cells: cells, odd: oddIdx, explain: '나머지는 모두 ' + s.nk + '인데 ' + oddEmo + ' 만 ' + s.ok + '이에요.' };
}
function orr_genColor() {
    var shape = pickRandom(['circle', 'square', 'heart']);
    var c = getRandomInt(0, 5), c2 = getRandomInt(0, 5);
    while (c2 === c) c2 = getRandomInt(0, 5);
    var k = getRandomInt(5, 7);
    var cells = [];
    for (var i = 0; i < k; i++) cells.push(ORR_COLOR_EMO[shape][c]);
    var oddIdx = getRandomInt(0, k - 1);
    cells[oddIdx] = ORR_COLOR_EMO[shape][c2];
    return { cells: cells, odd: oddIdx, explain: '나머지는 모두 ' + ORR_COLOR_KO[c] + '인데 하나만 ' + ORR_COLOR_KO[c2] + '이에요.' };
}
function orr_genDirection() {
    var k = getRandomInt(5, 7);
    var r = pickRandom(ORR_ARROWS_R), l = pickRandom(ORR_ARROWS_L);
    var cells = [];
    for (var i = 0; i < k; i++) cells.push(r);
    var oddIdx = getRandomInt(0, k - 1);
    cells[oddIdx] = l;
    return { cells: cells, odd: oddIdx, explain: '나머지는 모두 오른쪽을 보는데 하나만 왼쪽을 봐요.' };
}
function orr_genMultiple() {
    var base = pickRandom([2, 3, 4, 5]);
    var k = getRandomInt(5, 6);
    var used = {};
    var nums = [];
    while (nums.length < k - 1) {
        var m = base * getRandomInt(2, 9);
        if (!used[m] && m < 100) { used[m] = 1; nums.push(m); }
    }
    var bad;
    do { bad = getRandomInt(2, 40); } while (bad % base === 0 || used[bad]);
    var oddIdx = getRandomInt(0, k - 1);
    nums.splice(oddIdx, 0, bad);
    return { cells: nums.map(String), odd: oddIdx, explain: '정답은 ' + bad + '이에요. 나머지는 모두 ' + base + '의 배수인데 ' + bad + '만 아니에요.' };
}
function orr_genParity() {
    var evenNormal = Math.random() < 0.5;
    var k = getRandomInt(5, 6);
    var used = {};
    var nums = [];
    while (nums.length < k - 1) {
        var v = getRandomInt(1, 49) * 2 - (evenNormal ? 0 : 1);
        if (!used[v] && v > 0 && v < 100) { used[v] = 1; nums.push(v); }
    }
    var bad;
    do { bad = getRandomInt(1, 99); } while ((bad % 2 === 0) === evenNormal || used[bad]);
    var oddIdx = getRandomInt(0, k - 1);
    nums.splice(oddIdx, 0, bad);
    return { cells: nums.map(String), odd: oddIdx, explain: '정답은 ' + bad + '이에요. 나머지는 모두 ' + (evenNormal ? '짝수' : '홀수') + '인데 ' + bad + '만 ' + (evenNormal ? '홀수' : '짝수') + '예요.' };
}
function orr_genDigits() {
    var k = getRandomInt(5, 6);
    var used = {};
    var nums = [];
    while (nums.length < k - 1) { var v = getRandomInt(10, 99); if (!used[v]) { used[v] = 1; nums.push(v); } }
    var bad = getRandomInt(100, 999);
    var oddIdx = getRandomInt(0, k - 1);
    nums.splice(oddIdx, 0, bad);
    return { cells: nums.map(String), odd: oddIdx, explain: '정답은 ' + bad + '이에요. 나머지는 모두 두 자리 수인데 ' + bad + '만 세 자리 수예요.' };
}
function orr_genColorShape() {
    // 3단계: 색+모양. 정상은 모두 (색c, 모양s). 예외는 색만 다르거나 모양만 다름(정확히 한 속성만 깨짐).
    var c = getRandomInt(0, 5);
    var s = pickRandom(['circle', 'square', 'heart']);
    var k = getRandomInt(5, 6);
    var cells = [];
    for (var i = 0; i < k; i++) cells.push(ORR_COLOR_EMO[s][c]);
    var oddIdx = getRandomInt(0, k - 1);
    var breakColor = Math.random() < 0.5;
    var explain;
    if (breakColor) {
        var c2 = getRandomInt(0, 5); while (c2 === c) c2 = getRandomInt(0, 5);
        cells[oddIdx] = ORR_COLOR_EMO[s][c2];
        explain = '나머지는 모두 ' + ORR_COLOR_KO[c] + ' ' + ORR_SHAPE_KO[s] + '인데 이것만 색이 ' + ORR_COLOR_KO[c2] + '이에요.';
    } else {
        var shapes = ['circle', 'square', 'heart'].filter(function (x) { return x !== s; });
        var s2 = pickRandom(shapes);
        cells[oddIdx] = ORR_COLOR_EMO[s2][c];
        explain = '나머지는 모두 ' + ORR_COLOR_KO[c] + ' ' + ORR_SHAPE_KO[s] + '인데 이것만 모양이 ' + ORR_SHAPE_KO[s2] + '예요.';
    }
    return { cells: cells, odd: oddIdx, explain: explain };
}
function genOddRuleRound(level) {
    var gens;
    if (level === 1) gens = [orr_genCategory, orr_genColor, orr_genDirection];
    else if (level === 2) gens = [orr_genMultiple, orr_genParity, orr_genDigits];
    else gens = [orr_genColorShape];
    return pickRandom(gens)();
}
function startOddRuleSession() {
    orrState.round = 0;
    orrState.correct = 0;
    nextOddRuleRound();
}
function nextOddRuleRound() {
    orrState.round++;
    if (orrState.round > ORR_TOTAL) { finishOddRuleSession(); return; }
    var r = genOddRuleRound(orrState.level);
    orrState.cells = r.cells;
    orrState.odd = r.odd;
    orrState.explain = r.explain;
    orrState.answered = false;
    orrState.firstTry = true;
    renderOddRuleRound();
}
function renderOddRuleRound() {
    var st = orrState;
    if (typeof reportGameRound === 'function') reportGameRound(st.correct);
    var k = st.cells.length;
    var cols = k <= 4 ? k : (k <= 6 ? 3 : 4);
    var html = '<div class="game-title-box">🔍 규칙 벗어난 것 찾기</div>';
    html += '<div class="status-row"><div>' + st.round + ' / ' + ORR_TOTAL + '</div><div>정답: ' + st.correct + '</div></div>';
    html += '<div class="eng-btn-row"><button class="eng-mini-btn" onclick="initOddRuleOut()">⏮ 처음으로</button></div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">규칙에서 벗어난 하나를 골라요!</div>';
    html += '<div class="orr-grid" style="grid-template-columns:repeat(' + cols + ', 1fr);">';
    st.cells.forEach(function (v, idx) {
        html += '<button class="orr-item" data-i="' + idx + '" onclick="checkOddRule(' + idx + ')">' + v + '</button>';
    });
    html += '</div>';
    html += '<div id="orrMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function checkOddRule(idx) {
    var st = orrState;
    if (st.answered) return;
    st.answered = true;
    vibrateShort();
    var btns = document.querySelectorAll('.orr-item');
    var ok = idx === st.odd;
    btns[st.odd].classList.add('correct');
    if (!ok) btns[idx].classList.add('wrong');
    if (ok && st.firstTry) st.correct++;
    var msg = document.getElementById('orrMsg');
    msg.style.display = 'block';
    msg.className = ok ? 'msg-box' : 'msg-box bad';
    msg.innerText = (ok ? '🎉 맞아요! ' : '아쉬워요! ') + st.explain;
    document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" style="width:100%;" onclick="nextOddRuleRound()">다음 ▶</button>');
}
function finishOddRuleSession() {
    var st = orrState;
    if (typeof reportGameRound === 'function') reportGameRound(st.correct);
    var n = orr_starN(st.correct, ORR_TOTAL);
    if (typeof reportGameOutcome === 'function') reportGameOutcome(n >= 2 ? 'win' : 'lose');
    var html = '<div class="game-title-box">🔍 규칙 벗어난 것 찾기 — 끝!</div>';
    html += '<div style="text-align:center; font-size:2rem; letter-spacing:0.15rem; margin:0.7rem 0;">' + orr_starStr(n) + '</div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">' + ORR_TOTAL + '문제 중 <span style="color:var(--primary);">' + st.correct + '개</span> 정답!</div>';
    html += buildStandardResultButtons('initOddRuleOut()', 'startOddRuleSession()', 'goHome()');
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 게임 등록 =====================
GAME_INIT_FNS.truthLiarDetective = initTruthLiar;
GAME_INIT_FNS.oddRuleOut = initOddRuleOut;
GAME_INIT_FNS.patternMatrix = initPatternMatrix;
GAME_INIT_FNS.sizeLogic = initSizeLogic;
GAME_INIT_FNS.mirrorSymmetry = initMirrorSymmetry;
GAME_INIT_FNS.syllogism = initSyllogism;
GAME_INIT_FNS.numSeq = initNumSeq;
GAME_INIT_FNS.weightScale = initWeightScale;
GAME_INIT_FNS.sudokuLite = initSudokuLite;
GAME_INIT_FNS.suspectLogic = initSuspectLogic;
