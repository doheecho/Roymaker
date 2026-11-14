// ===================== 13. 수학: 아날로그 시계 맞추기 =====================
var clockState = { dragging: null };
var clockRound = 1, clockCorrect = 0;
function initClockMatch() { clockRound = 1; clockCorrect = 0; generateClockRound(); }
function generateClockRound() {
    var targetHour = getRandomInt(0, 11);
    var targetMinute = pickRandom([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    clockState = { targetHour: targetHour, targetMinute: targetMinute, currentHour: 0, currentMinute: 0, dragging: null, checked: false };
    renderClockFace();
}
function formatClockTime(h, m) {
    var h12 = h === 0 ? 12 : h;
    return h12 + '시 ' + (m === 0 ? '정각' : m + '분');
}
function computeAngleFromCenter(cx, cy, px, py) {
    var dx = px - cx, dy = py - cy;
    var angle = Math.atan2(dx, -dy) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
}
function angleToHour(angle) { return Math.round(angle / 30) % 12; }
// 분침은 1분(6도) 단위로 읽어 부드럽게 움직이게 한다. (기존엔 5분/30도 단위라 뚝뚝 끊겼음)
function angleToMinute(angle) { return Math.round(angle / 6) % 60; }
// 두 분 값의 원형(60분) 최소 차이
function minuteDiff(a, b) { var d = Math.abs(a - b); return Math.min(d, 60 - d); }
function startClockDrag(which, e) {
    if (e && e.preventDefault) e.preventDefault();
    clockState.dragging = which;
}
function handleClockMove(e) {
    if (!clockState.dragging) return;
    var face = document.getElementById('clockFaceEl');
    if (!face || !face.getBoundingClientRect) return;
    var rect = face.getBoundingClientRect();
    var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    var point = (e.touches && e.touches[0]) ? e.touches[0] : e;
    if (typeof point.clientX !== 'number') return;
    var angle = computeAngleFromCenter(cx, cy, point.clientX, point.clientY);
    if (clockState.dragging === 'hour') {
        var newHour = angleToHour(angle);
        if (newHour !== clockState.currentHour) { vibrateShort(); }
        clockState.currentHour = newHour;
    } else {
        var newMinute = angleToMinute(angle);
        if (newMinute !== clockState.currentMinute) { vibrateShort(); }
        clockState.currentMinute = newMinute;
    }
    updateClockHandsVisual();
}
function stopClockDrag() { clockState.dragging = null; }
function updateClockHandsVisual() {
    var hourDeg = (clockState.currentHour % 12) * 30 + clockState.currentMinute * 0.5;
    var minDeg = clockState.currentMinute * 6;
    var hourEl = document.getElementById('clockHourHand');
    var minEl = document.getElementById('clockMinuteHand');
    if (hourEl) hourEl.style.transform = 'rotate(' + hourDeg + 'deg)';
    if (minEl) minEl.style.transform = 'rotate(' + minDeg + 'deg)';
}
function renderClockFace() {
    var html = '<div class="game-title-box">🕐 아날로그 시계 맞추기</div>';
    html += '<div class="game-sub-desc">시침(굵고 짧은 바늘)과 분침(얇고 긴 바늘)을 드래그해서 <b style="color:var(--primary);">' + formatClockTime(clockState.targetHour, clockState.targetMinute) + '</b>을 만들어보세요!</div>';
    html += '<div class="status-row"><div>' + clockRound + '라운드</div><div>정답: ' + clockCorrect + ' / ' + (clockRound - 1) + '</div></div>';
    html += '<div class="clock-face" id="clockFaceEl">';
    for (var i = 0; i < 12; i++) {
        html += '<div class="clock-tick" style="transform: rotate(' + (i * 30) + 'deg);"></div>';
    }
    html += '<div class="clock-hand hour" id="clockHourHand" style="transform: rotate(' + ((clockState.currentHour % 12) * 30 + clockState.currentMinute * 0.5) + 'deg);" onmousedown="startClockDrag(\'hour\',event)" ontouchstart="startClockDrag(\'hour\',event)"></div>';
    html += '<div class="clock-hand minute" id="clockMinuteHand" style="transform: rotate(' + (clockState.currentMinute * 6) + 'deg);" onmousedown="startClockDrag(\'minute\',event)" ontouchstart="startClockDrag(\'minute\',event)"></div>';
    html += '<div class="clock-center-dot"></div>';
    html += '</div>';
    html += '<div class="options-grid">';
    html += '<button class="action-btn" onclick="checkClockMatch()">확인하기 ✅</button>';
    html += '</div>';
    html += '<div id="clockMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function checkClockMatch() {
    if (clockState.checked) return;
    var msg = document.getElementById('clockMsg');
    if (clockState.currentHour === clockState.targetHour && minuteDiff(clockState.currentMinute, clockState.targetMinute) <= 1) {
        clockState.checked = true;
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 정답이에요!';
        clockCorrect++;
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextClockRound()', 'retryClockRound()', 'restartClockMatch()'));
    } else {
        clockState.checked = true;
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '아쉬워요! 만든 시간은 ' + formatClockTime(clockState.currentHour, clockState.currentMinute) + '이에요. (정답: ' + formatClockTime(clockState.targetHour, clockState.targetMinute) + ')';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryClockRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartClockMatch()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}
function retryClockRound() {
    clockState.currentHour = 0;
    clockState.currentMinute = 0;
    clockState.checked = false;
    renderClockFace();
}
function restartClockMatch() { clockRound = 1; clockCorrect = 0; generateClockRound(); }
function nextClockRound() { clockRound++; generateClockRound(); }
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('mousemove', function (e) { handleClockMove(e); });
    document.addEventListener('touchmove', function (e) { if (clockState.dragging) { if (e.preventDefault) e.preventDefault(); } handleClockMove(e); }, { passive: false });
    document.addEventListener('mouseup', function () { stopClockDrag(); });
    document.addEventListener('touchend', function () { stopClockDrag(); });
}

// ===================== 15. 수학: 확률 저울 뽑기 =====================
var PROB_COLORS = [
    { key: 'red', label: '빨강', emoji: '🔴' },
    { key: 'blue', label: '파랑', emoji: '🔵' },
    { key: 'yellow', label: '노랑', emoji: '🟡' },
    { key: 'green', label: '초록', emoji: '🟢' }
];
var probState = {};
var probRound = 1, probCorrect = 0;
function initProbabilityDraw() { probRound = 1; probCorrect = 0; generateProbRound(); }
function generateProbRound() {
    var colorCount = pickRandom([2, 3]);
    var chosenColors = pickN(PROB_COLORS, colorCount);
    var counts, maxVal;
    var attempts = 0;
    do {
        counts = chosenColors.map(function () { return getRandomInt(1, 6); });
        maxVal = Math.max.apply(null, counts);
        attempts++;
    } while (counts.filter(function (c) { return c === maxVal; }).length > 1 && attempts < 30);
    var answerIdx = counts.indexOf(maxVal);
    var total = counts.reduce(function (a, b) { return a + b; }, 0);
    var bag = chosenColors.map(function (c, i) { return { color: c, count: counts[i] }; });
    probState = { bag: bag, total: total, answerIdx: answerIdx, answered: false, correctGuess: false, drawResults: [], drawing: false };
    renderProbabilityDraw();
}
function nextProbRound() { probRound++; generateProbRound(); }
function retryProbRound() {
    probState.answered = false;
    probState.correctGuess = false;
    probState.drawResults = [];
    probState.drawing = false;
    renderProbabilityDraw();
}
function checkProbabilityDraw(idx) {
    if (probState.answered) return;
    probState.answered = true;
    probState.correctGuess = (idx === probState.answerIdx);
    if (probState.correctGuess) probCorrect++;
    vibrateShort();
    renderProbabilityDraw();
}
function weightedPickColor(bag) {
    var total = bag.reduce(function (sum, b) { return sum + b.count; }, 0);
    var r = getRandomInt(1, total);
    var acc = 0;
    for (var i = 0; i < bag.length; i++) {
        acc += bag[i].count;
        if (r <= acc) return bag[i].color;
    }
    return bag[bag.length - 1].color;
}
function startProbabilityDrawSim() {
    if (probState.drawing || probState.drawResults.length > 0) return;
    probState.drawing = true;
    stepProbabilityDraw(0);
}
function stepProbabilityDraw(i) {
    if (i >= 5) {
        probState.drawing = false;
        renderProbabilityDraw();
        return;
    }
    var color = weightedPickColor(probState.bag);
    probState.drawResults.push(color);
    vibrateShort();
    renderProbabilityDraw();
    var t = gameTimeout(function () { stepProbabilityDraw(i + 1); }, 500);
}
function renderProbabilityDraw() {
    var html = '<div class="game-title-box">🎲 확률 저울 뽑기</div>';
    html += '<div class="game-sub-desc">주머니 속 구슬 개수를 보고, 뽑았을 때 나올 확률이 가장 높은 색을 맞혀보세요!</div>';
    html += '<div class="status-row"><div>' + probRound + '라운드</div><div>정답: ' + probCorrect + ' / ' + (probRound - 1) + '</div></div>';
    probState.bag.forEach(function (b) {
        html += '<div class="row-label">' + b.color.emoji + ' ' + b.color.label + ' (' + b.count + '개)</div>';
        html += '<div class="row-display">';
        for (var i = 0; i < b.count; i++) { html += '<div class="row-box">' + b.color.emoji + '</div>'; }
        html += '</div>';
    });
    if (!probState.answered) {
        html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">어떤 색 구슬이 나올 확률이 가장 높을까요?</div>';
        html += '<div class="options-grid">';
        probState.bag.forEach(function (b, idx) {
            html += '<button class="opt-btn text-opt" onclick="checkProbabilityDraw(' + idx + ')">' + b.color.emoji + ' ' + b.color.label + '</button>';
        });
        html += '</div>';
    } else {
        var msgClass = probState.correctGuess ? 'msg-box' : 'msg-box bad';
        var msgText = probState.correctGuess
            ? '🎉 정답이에요! 개수가 가장 많으면 뽑힐 확률도 가장 높아요.'
            : '아쉬워요! ' + probState.bag[probState.answerIdx].color.label + '이(가) ' + probState.bag[probState.answerIdx].count + '개로 가장 많아서 확률이 가장 높아요.';
        html += '<div class="' + msgClass + '" style="display:block;">' + msgText + '</div>';
        html += '<div class="msg-box" style="display:block; background:#f8fafc; border-color:#e5e7eb; text-align:left; line-height:1.9;">';
        probState.bag.forEach(function (b) {
            var pct = Math.round(b.count / probState.total * 100);
            html += b.color.emoji + ' ' + b.color.label + ': ' + b.count + '/' + probState.total + ' (약 ' + pct + '%)<br>';
        });
        html += '</div>';
        if (probState.drawResults.length > 0) {
            html += '<div class="row-label">실제로 뽑아본 결과 (' + probState.drawResults.length + '번)</div>';
            html += '<div class="row-display">';
            probState.drawResults.forEach(function (r) { html += '<div class="row-box">' + r.emoji + '</div>'; });
            html += '</div>';
        }
        html += '<div class="options-grid">';
        if (probState.drawResults.length === 0 && !probState.drawing) {
            html += '<button class="action-btn secondary" onclick="startProbabilityDrawSim()">🎲 실제로 5번 뽑아보기</button>';
        }
        html += '</div>';
        html += buildStandardResultButtons('nextProbRound()', 'retryProbRound()', 'initProbabilityDraw()');
    }
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 16. 수학: 거스름돈 계산 =====================
var CHANGE_ITEMS = [
    { name: '삼각김밥', emoji: '🍙', price: 1200 },
    { name: '우유', emoji: '🥛', price: 1500 },
    { name: '아이스크림', emoji: '🍦', price: 1000 },
    { name: '과자', emoji: '🍪', price: 1800 },
    { name: '음료수', emoji: '🥤', price: 2000 },
    { name: '컵라면', emoji: '🍜', price: 1700 },
    { name: '초콜릿', emoji: '🍫', price: 1300 },
    { name: '빵', emoji: '🍞', price: 2500 },
    { name: '젤리', emoji: '🍬', price: 900 },
    { name: '사탕', emoji: '🍭', price: 500 }
];
var CHANGE_BILL_VALUES = [1000, 5000, 10000, 50000];
var CHANGE_DENOMS = [100, 500, 1000, 5000, 10000];
var CHANGE_DENOM_COLOR = { 10000: '#16a34a', 5000: '#f97316', 1000: '#9333ea', 500: '#94a3b8', 100: '#b45309', 50000: '#eab308' };
var CHANGE_DENOM_LABEL = { 10000: '만원', 5000: '오천원', 1000: '천원', 500: '500원', 100: '100원', 50000: '오만원' };
var changeSettings = { itemCount: 1, timeLimit: 0 };
var changeState = {};
var changeRound = 1, changeSolved = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('changeCounter', { easy: { itemCount: 1 }, normal: { itemCount: 2 }, hard: { itemCount: 3 } });
}
function initChangeGame() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('changeCounter', changeSettings);
    renderChangeSetup();
}
function renderChangeSetup() {
    var counts = [{ v: 1, l: '1개' }, { v: 2, l: '2개' }, { v: 3, l: '3개' }, { v: 'random', l: '무작위' }];
    var times = [{ v: 10, l: '10초' }, { v: 15, l: '15초' }, { v: 20, l: '20초' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">🪙 거스름돈 계산</div>';
    html += '<div class="game-sub-desc">편의점 알바가 되어 손님에게 정확한 거스름돈을 건네보세요!</div>';
    html += '<div class="setup-section-label">물건 개수</div><div class="setup-btn-group">';
    counts.forEach(function (c) { html += '<button class="setup-btn' + (changeSettings.itemCount === c.v ? ' active' : '') + '" onclick="setChangeItemCount(' + (c.v === 'random' ? "'random'" : c.v) + ')">' + c.l + '</button>'; });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) { html += '<button class="setup-btn' + (changeSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setChangeTimeLimit(' + t.v + ')">' + t.l + '</button>'; });
    html += '</div>';
    html += '<button class="action-btn" onclick="startChangeSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setChangeItemCount(v) { changeSettings.itemCount = v; renderChangeSetup(); }
function setChangeTimeLimit(v) { changeSettings.timeLimit = v; renderChangeSetup(); }
function startChangeSession() { changeRound = 1; changeSolved = 0; generateChangeRound(); }
function generateChangeRound() {
    var itemCount = changeSettings.itemCount === 'random' ? pickRandom([1, 2, 3]) : changeSettings.itemCount;
    var items = pickN(CHANGE_ITEMS, itemCount);
    var total = items.reduce(function (sum, i) { return sum + i.price; }, 0);
    var candidateBills = CHANGE_BILL_VALUES.filter(function (b) { return b > total; });
    if (candidateBills.length === 0) candidateBills = [CHANGE_BILL_VALUES[CHANGE_BILL_VALUES.length - 1]];
    var paid = pickRandom(candidateBills);
    changeState = {
        items: items, scanned: [], phase: 'scanning', total: total, paid: paid, changeDue: paid - total,
        given: {}, finished: false, timedOut: false, failed: false,
        timeLimit: changeSettings.timeLimit, timeLeft: changeSettings.timeLimit, timerId: null
    };
    renderChangeGame();
}
function restartChangeGame() { renderChangeSetup(); }
function nextChangeRound() { changeRound++; generateChangeRound(); }
function retryChangeRound() {
    changeState.scanned = [];
    changeState.phase = 'scanning';
    changeState.given = {};
    changeState.finished = false;
    changeState.timedOut = false;
    changeState.failed = false;
    changeState.timeLeft = changeState.timeLimit;
    if (changeState.timerId) { clearInterval(changeState.timerId); changeState.timerId = null; }
    renderChangeGame();
}
function startChangeTimer() {
    var bar = document.getElementById('changeTimerBar');
    if (bar) bar.style.width = '100%';
    changeState.timerId = setInterval(function () {
        changeState.timeLeft -= 0.1;
        var pct = (changeState.timeLeft / changeState.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('changeTimerBar');
        if (b) b.style.width = pct + '%';
        if (changeState.timeLeft <= 0) {
            clearInterval(changeState.timerId);
            handleChangeTimeout();
        }
    }, 100);
    activeTimers.push(changeState.timerId);
}
function handleChangeTimeout() {
    if (changeState.finished || changeState.timedOut) return;
    changeState.timedOut = true;
    if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
    renderChangeGame();
}
function scanChangeItem(idx) {
    if (changeState.phase !== 'scanning' || changeState.timedOut) return;
    if (changeState.scanned.indexOf(idx) > -1) return;
    vibrateShort();
    changeState.scanned.push(idx);
    if (changeState.scanned.length === changeState.items.length) {
        changeState.phase = 'paying';
        if (changeState.timeLimit > 0) { startChangeTimer(); }
    }
    renderChangeGame();
}
function addChangeCoin(denom) {
    if (changeState.phase !== 'paying' || changeState.finished || changeState.timedOut || changeState.failed) return;
    vibrateShort();
    changeState.given[denom] = (changeState.given[denom] || 0) + 1;
    renderChangeGame();
}
function clearChangeGiven() {
    if (changeState.finished || changeState.timedOut || changeState.failed) return;
    changeState.given = {};
    renderChangeGame();
}
function totalGivenChange() {
    var sum = 0;
    CHANGE_DENOMS.forEach(function (d) { sum += d * (changeState.given[d] || 0); });
    return sum;
}
function checkChangeAnswer() {
    if (changeState.phase !== 'paying' || changeState.finished || changeState.timedOut || changeState.failed) return;
    var givenTotal = totalGivenChange();
    var msg = document.getElementById('changeMsg');
    if (givenTotal === changeState.changeDue) {
        changeState.finished = true;
        changeSolved++;
        if (typeof reportGameOutcome === 'function') reportGameOutcome('win');
        if (changeState.timerId) clearInterval(changeState.timerId);
        renderChangeGame();
        msg = document.getElementById('changeMsg');
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 감사합니다! 정확해요!';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextChangeRound()', 'retryChangeRound()', 'restartChangeGame()'));
    } else {
        changeState.failed = true;
        if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
        if (changeState.timerId) clearInterval(changeState.timerId);
        renderChangeGame();
        msg = document.getElementById('changeMsg');
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = givenTotal > changeState.changeDue ? '앗! 손님한테 돈을 더 줘서 사장님한테 혼났어요ㅠ' : '앗! 손님한테 돈을 더 적게 돌려드렸어요ㅠ';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryChangeRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartChangeGame()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}
function buildBillSVG(value, color) {
    var label = value >= 10000 ? (value / 10000) + '만원' : (value / 1000) + '천원';
    var svg = '<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg" style="width:82px; height:41px; display:block;">';
    svg += '<rect x="1" y="1" width="98" height="48" rx="4" fill="' + color + '" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/>';
    svg += '<rect x="6" y="6" width="88" height="38" rx="2" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1" stroke-dasharray="2,2"/>';
    svg += '<circle cx="76" cy="25" r="12" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.65)" stroke-width="1"/>';
    svg += '<text x="22" y="30" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">' + label + '</text>';
    svg += '<text x="10" y="13" font-size="6" fill="rgba(255,255,255,0.85)">WON</text>';
    svg += '</svg>';
    return svg;
}
function buildCoinSVG(value, size, fill, ring) {
    var svg = '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:' + size + 'px; height:' + size + 'px; display:block;">';
    svg += '<circle cx="30" cy="30" r="27" fill="' + fill + '" stroke="' + ring + '" stroke-width="3"/>';
    svg += '<circle cx="30" cy="30" r="21" fill="none" stroke="' + ring + '" stroke-width="1.2" opacity="0.6"/>';
    svg += '<text x="30" y="35" font-size="14" font-weight="800" fill="' + ring + '" text-anchor="middle">' + value + '</text>';
    svg += '</svg>';
    return svg;
}
function renderChangeDenomButton(d, disabled) {
    var disabledAttr = disabled ? 'disabled' : '';
    var onclickAttr = ' onclick="addChangeCoin(' + d + ')"';
    var content;
    if (d === 500) { content = buildCoinSVG(500, 52, '#cbd5e1', '#475569'); }
    else if (d === 100) { content = buildCoinSVG(100, 44, '#e2e8f0', '#94a3b8'); }
    else { content = buildBillSVG(d, CHANGE_DENOM_COLOR[d]); }
    return '<button style="background:none; border:none; padding:0.2rem; cursor:pointer;" ' + disabledAttr + onclickAttr + '>' + content + '</button>';
}
function renderChangeGame() {
    var html = '<div class="game-title-box">🪙 거스름돈 계산</div>';
    html += '<div class="status-row"><div>' + changeRound + '라운드</div><div>성공: ' + changeSolved + '개</div></div>';
    if (changeState.phase === 'paying' && changeState.timeLimit > 0 && !changeState.finished && !changeState.timedOut) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="changeTimerBar"></div></div>';
    }
    var scannedTotal = changeState.scanned.reduce(function (sum, idx) { return sum + changeState.items[idx].price; }, 0);
    if (changeState.phase === 'scanning') {
        html += '<div style="background:#fff; border:2px solid #d1d5db; border-radius:1rem; padding:0.8rem 1rem; margin-bottom:0.6rem; font-weight:700; text-align:center;">🙋 "안녕하세요! 이거 계산해주세요~"</div>';
        html += '<div class="game-sub-desc" style="text-align:center;">각 물건의 바코드를 찍어서 가격을 확인해보세요.</div>';
        html += '<div class="tile-row" style="grid-template-columns: repeat(' + Math.min(changeState.items.length, 4) + ', 1fr); gap:0.6rem;">';
        changeState.items.forEach(function (item, idx) {
            var scanned = changeState.scanned.indexOf(idx) > -1;
            var cardStyle = 'text-align:center; padding:0.7rem 0.4rem;' + (scanned ? 'background:#d1fae5; opacity:0.85;' : 'cursor:pointer;');
            var clickAttr = !scanned ? ' onclick="scanChangeItem(' + idx + ')"' : '';
            html += '<div class="game-tile" style="' + cardStyle + '"' + clickAttr + '>';
            html += '<div style="font-size:1.8rem;">' + item.emoji + '</div>';
            html += '<div style="font-size:0.78rem; font-weight:700; margin-top:0.2rem;">' + item.name + '</div>';
            html += scanned ? '<div style="font-size:0.76rem; color:#6b7280;">' + item.price.toLocaleString() + '원 ✅</div>' : '';
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<div class="game-sub-desc">손님이 낸 돈을 보고, 거스름돈을 계산해서 건네주세요.</div>';
        html += '<div style="text-align:center; margin:0.6rem 0;"><div class="game-sub-desc" style="margin-bottom:0.3rem;">손님이 낸 돈</div><div style="display:flex; justify-content:center;">' + buildBillSVG(changeState.paid, CHANGE_DENOM_COLOR[changeState.paid]) + '</div></div>';
    }
    html += '<div style="text-align:center; font-size:1.5rem; font-weight:800; background:#1f2937; color:#4ade80; padding:0.7rem; border-radius:0.5rem; margin:0.8rem 0; font-family:monospace;">💰 합계 ' + scannedTotal.toLocaleString() + '원</div>';
    if (changeState.phase === 'paying') {
        var payDisabled = changeState.finished || changeState.timedOut || changeState.failed;
        html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">거스름돈을 계산해서 아래 화폐로 건네보세요!</div>';
        html += '<div style="display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:0.6rem; margin-bottom:1rem;">';
        CHANGE_DENOMS.slice().reverse().forEach(function (d) {
            html += renderChangeDenomButton(d, payDisabled);
        });
        html += '</div>';
        html += '<div class="game-sub-desc" style="text-align:center; font-weight:800; font-size:1.15rem;">건넨 금액: ' + totalGivenChange().toLocaleString() + '원</div>';
        html += '<div class="sequence-answer-row" style="flex-wrap:wrap;">';
        var anyGiven = false;
        CHANGE_DENOMS.forEach(function (d) {
            var count = changeState.given[d] || 0;
            if (count > 0) {
                anyGiven = true;
                html += '<div class="sequence-answer-slot" style="width:auto; min-width:50px; padding:0 0.4rem; font-size:0.78rem;">' + CHANGE_DENOM_LABEL[d] + ' × ' + count + '</div>';
            }
        });
        if (!anyGiven) { html += '<div class="game-sub-desc" style="margin:0;">아직 건넨 돈이 없어요.</div>'; }
        html += '</div>';
        html += '<div class="options-grid">';
        html += '<button class="action-btn" ' + (payDisabled ? 'disabled' : '') + ' onclick="checkChangeAnswer()">계산 완료! ✅</button>';
        html += '<button class="action-btn secondary" ' + (payDisabled ? 'disabled' : '') + ' onclick="clearChangeGiven()">지우기 🗑️</button>';
        html += '</div>';
    }
    html += '<div id="changeMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (changeState.phase === 'paying' && changeState.timeLimit > 0 && !changeState.finished && !changeState.timedOut) {
        var barEl = document.getElementById('changeTimerBar');
        if (barEl) barEl.style.width = (changeState.timeLeft / changeState.timeLimit * 100) + '%';
    }
    if (changeState.timedOut) {
        var tmsg = document.getElementById('changeMsg');
        tmsg.className = 'msg-box bad'; tmsg.style.display = 'block'; tmsg.innerText = '⏰ 시간이 다 됐어요!';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryChangeRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartChangeGame()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}

// ===================== 수학 대모험 (학년별 문제) =====================
function mathAdvMakeFillerOption(answer, tryIndex) {
    var match = String(answer).match(/^(-?\d+(?:\.\d+)?)(.*)$/);
    if (!match) return null;
    var isFloat = match[1].indexOf('.') > -1;
    var num = parseFloat(match[1]);
    var suffix = match[2];
    var step = isFloat ? 0.1 : 1;
    var direction = (tryIndex % 2 === 0) ? 1 : -1;
    var magnitude = Math.ceil(tryIndex / 2);
    var candidate = num + direction * magnitude * step;
    if (candidate < 0) { candidate = num + (magnitude + 2) * step; }
    return (isFloat ? candidate.toFixed(1) : String(candidate)) + suffix;
}
function mathAdvEnsureUniqueOptions(quizData) {
    var seen = {};
    var unique = [];
    unique.push(quizData.answer);
    seen[quizData.answer] = true;
    for (var i = 0; i < quizData.options.length && unique.length < 4; i++) {
        var opt = quizData.options[i];
        if (!seen[opt]) { seen[opt] = true; unique.push(opt); }
    }
    var tryIndex = 1, safetyCounter = 0;
    while (unique.length < 4 && safetyCounter < 40) {
        var filler = mathAdvMakeFillerOption(quizData.answer, tryIndex);
        safetyCounter++; tryIndex++;
        if (filler !== null && !seen[filler]) { seen[filler] = true; unique.push(filler); }
    }
    return unique;
}

var MATH_ADV_GENERATORS = {
    grade1: [
        function () { var b = getRandomInt(2, 6), s = getRandomInt(1, 9), t = b * 10 + s; return { q: "마트에서 사탕 10개들이 " + b + "봉지와 낱개 " + s + "개를 샀어요. 모두 몇 개일까요?", answer: t + "개", options: [t + "개", (t + 2) + "개", (t - 2) + "개", (t + 10) + "개"] }; },
        function () { var p = getRandomInt(3, 8) * 100, c = 1000 - p; return { q: "문방구에서 " + p + "원짜리 공책을 사고 1,000원짜리 지폐를 냈을 때 거스름돈은 얼마일까요?", answer: c + "원", options: [c + "원", (c + 100) + "원", (c > 100 ? c - 100 : 200) + "원", (c + 200) + "원"] }; },
        function () { var a = getRandomInt(11, 25), b = getRandomInt(5, 14), sum = a + b; return { q: "냉장고에 사과가 " + a + "개, 귤이 " + b + "개 있어요. 과일은 모두 몇 개일까요?", answer: sum + "개", options: [sum + "개", (sum + 2) + "개", (sum - 2) + "개", (sum + 5) + "개"] }; },
        function () { var a = getRandomInt(20, 39), b = getRandomInt(5, 15), res = a - b; return { q: "파티용 풍선 " + a + "개 중 " + b + "개가 펑 하고 터졌어요. 남은 풍선은 몇 개일까요?", answer: res + "개", options: [res + "개", (res + 1) + "개", (res - 1) + "개", (res + 3) + "개"] }; },
        function () { var a = getRandomInt(1, 9), ans = 10 - a; return { q: "저금통에 동전이 " + a + "개 있어요. 10개가 되려면 몇 개가 더 필요할까요?", answer: String(ans), options: [String(ans), String(ans + 1), String(ans > 1 ? ans - 1 : 3), String(ans + 2)] }; },
        function () { var t = getRandomInt(2, 9), u = getRandomInt(1, 9), val = t * 10 + u; return { q: "블록 놀이를 할 때 10개짜리 묶음 " + t + "개와 낱개 " + u + "개를 모았어요. 전체 블록은 몇 개일까요?", answer: String(val), options: [String(val), String(t + u), String(u * 10 + t), String(val + 10)] }; },
        function () { var ev = getRandomInt(2, 8) * 2; return { q: "식탁에 젓가락이 " + ev + "짝 놓여 있어요. 짝이 딱 맞는 짝수일까요?", answer: String(ev), options: [String(ev), String(ev + 1), String(ev + 3), String(ev + 5)] }; },
        function () { var od = getRandomInt(1, 4) * 2 + 1; return { q: "간식으로 사과 조각이 " + od + "개 남았어요. 두 명에게 똑같이 나누어 떨어지지 않는 홀수일까요?", answer: String(od), options: [String(od), String(od - 1), String(od + 1), String(od + 3)] }; },
        function () { var a = getRandomInt(3, 7), b = getRandomInt(3, 7), sum = a + b; return { q: "책꽂이에 동화책이 " + a + "권 있고, 더 꽂아서 총 " + sum + "권이 되었어요. 빈칸에 들어갈 책은 몇 권일까요? " + a + " + ( ) = " + sum, answer: String(b), options: [String(b), String(b + 1), String(b > 1 ? b - 1 : 2), String(b + 2)] }; },
        function () { var a = getRandomInt(10, 18), b = getRandomInt(2, 5), res = a - b; return { q: "스티커가 " + a + "장 있었는데 그림 그리며 사용했더니 " + res + "장 남았어요. 사용한 스티커는 몇 장일까요? " + a + " - ( ) = " + res, answer: String(b), options: [String(b), String(b + 1), String(b > 1 ? b - 1 : 2), String(b + 2)] }; },
        function () { var a = getRandomInt(2, 7), b = getRandomInt(2, 7), sum = a + b; return { q: "인형이 " + a + "개 있었는데 엄마가 " + b + "개를 더 사주셨어요. 지금 인형은 몇 개일까요?", answer: sum + "개", options: [sum + "개", (sum + 1) + "개", (sum - 1) + "개", (sum + 3) + "개"] }; },
        function () { var a = getRandomInt(10, 19), b = getRandomInt(2, 6), res = a - b; return { q: "초콜릿이 " + a + "개 있었는데 동생과 " + b + "개를 나눠 먹었어요. 남은 초콜릿은?", answer: res + "개", options: [res + "개", (res + 2) + "개", (res - 1) + "개", (res + 4) + "개"] }; },
        function () { return { q: "피자 조각을 자를 때 뾰족한 꼭짓점이 3개, 곧은 변이 3개인 조각 모양은 무슨 도형일까요?", answer: "삼각형", options: ["사각형", "원", "삼각형", "오각형"] }; },
        function () { return { q: "우리가 매일 보는 창문이나 공책 표지처럼 네 개의 곧은 변과 꼭짓점을 가진 모양은?", answer: "사각형", options: ["삼각형", "사각형", "원", "오각형"] }; },
        function () { return { q: "동글동글한 바퀴나 피자 한 판처럼 뾰족한 부분이 없는 모양은?", answer: "원", options: ["삼각형", "사각형", "원", "오각형"] }; },
        function () { return { q: "종이학을 접거나 블록을 조립할 때 곧은 선으로 둘러싸인 평면 도형을 무엇이라 부를까요?", answer: "다각형 (기초)", options: ["곡선도형", "다각형 (기초)", "입체", "원"] }; },
        function () { return { q: "방 안의 길이를 잴 때 자가 없다면, 내 발걸음이나 손뼘으로 길이를 어림잡아 재는 방법을 무엇이라 할까요?", answer: "임의 단위 측정", options: ["표준 단위 측정", "임의 단위 측정", "무게 측정", "들이 측정"] }; },
        function () { return { q: "미술 시간에 색종이의 길이를 자로 잴 때, 자의 어느 눈금에 끝을 맞춰야 정확할까요?", answer: "물건의 끝부분 (눈금 0)", options: ["물건의 중간", "물건의 끝부분 (눈금 0)", "눈금 10", "아무데나"] }; },
        function () { return { q: "필통에 쏙 들어가는 짧은 자로 잴 수 있는 가장 친숙한 길이 단위는 무엇일까요?", answer: "cm (센티미터)", options: ["m (미터)", "cm (센티미터)", "km (킬로미터)", "g (그램)"] }; },
        function () { return { q: "마트에서 물건을 살 때 수박과 사과 중 어느 것이 더 무거운지 비교하려고 해요. 가장 좋은 방법은?", answer: "양손으로 들어보기", options: ["눈으로 보기", "양손으로 들어보기", "자로 재기", "냄새 맡기"] }; },
        function () { return { q: "물통 두 개에 담긴 물의 양(들이)을 정확히 비교하고 싶을 때 어떻게 해야 할까요?", answer: "같은 컵에 부어보기", options: ["그냥 보기", "손으로 만지기", "같은 컵에 부어보기", "무게 재기"] }; },
        function () { return { q: "벽시계에서 길쭉하게 생겨서 째깍째깍 바쁘게 움직이는 바늘이 가리키는 시간 단위는?", answer: "분", options: ["시", "분", "초", "계절"] }; },
        function () { var h = getRandomInt(1, 12); return { q: "유치원에서 집에 올 때 시계를 보니 긴바늘은 12, 짧은바늘은 " + h + "를 가리키고 있어요. 지금 몇 시일까요?", answer: h + "시", options: [h + "시", (h % 12 + 1) + "시", (h > 1 ? h - 1 : 12) + "시", ((h + 2) % 12 || 12) + "시"] }; },
        function () { var n = getRandomInt(1, 4), ans = n * 24; return { q: "하루는 24시간이에요. 그러면 " + n + "일은 모두 몇 시간일까요?", answer: ans + "시간", options: [ans + "시간", (ans + 12) + "시간", (n * 12) + "시간", (ans + 24) + "시간"] }; },
        function () { var n = getRandomInt(1, 5), ans = n * 60; return { q: "1시간은 60분이에요. 그러면 " + n + "시간은 모두 몇 분일까요?", answer: ans + "분", options: [ans + "분", (ans + 30) + "분", (n * 100) + "분", (n * 50) + "분"] }; },
        function () { var n = getRandomInt(1, 4), ans = n * 7; return { q: "일주일은 7일이에요. 그러면 " + n + "주는 모두 며칠일까요?", answer: ans + "일", options: [ans + "일", (ans + 1) + "일", (n * 5) + "일", (ans + 7) + "일"] }; },
        function () { var n = getRandomInt(1, 4), ans = n * 12; return { q: "1년은 12달이에요. 그러면 " + n + "년은 모두 몇 달일까요?", answer: ans + "달", options: [ans + "달", (ans + 2) + "달", (n * 10) + "달", (ans + 12) + "달"] }; },
        function () { return { q: "달력에서 한 달(예: 5월)은 보통 며칠에서 며칠까지 있을까요?", answer: "28일~31일", options: ["10일~20일", "28일~31일", "50일", "60일"] }; },
        function () { return { q: "오늘이 즐거운 화요일이라면, 내일 유치원에 갈 때는 무슨 요일일까요?", answer: "수요일", options: ["월요일", "수요일", "목요일", "금요일"] }; },
        function () { return { q: "어제가 가족들과 놀러 간 금요일이었다면, 오늘은 무슨 요일일까요?", answer: "토요일", options: ["목요일", "토요일", "일요일", "월요일"] }; },
        function () { return { q: "1년 중 가장 첫 번째 달인 1월 다음으로 찾아오는 달은?", answer: "2월", options: ["12월", "2월", "3월", "5월"] }; },
        function () { return { q: "따뜻한 봄날이 지나가고 물놀이를 할 수 있는 다음 계절은 무엇일까요?", answer: "여름", options: ["겨울", "여름", "가을", "봄"] }; },
        function () { var st = getRandomInt(1, 5), ans = st + 8; return { q: "블록을 쌓는 규칙이에요: " + st + ", " + (st + 2) + ", " + (st + 4) + ", " + (st + 6) + ", ( ). 빈칸에 들어갈 수는?", answer: String(ans), options: [String(ans), String(ans + 1), String(ans - 2), String(ans + 3)] }; },
        function () { var st = getRandomInt(10, 19), ans = st - 4; return { q: "숫자가 점점 작아지는 규칙: " + st + ", " + (st - 1) + ", " + (st - 2) + ", " + (st - 3) + ", ( ). 빈칸은?", answer: String(ans), options: [String(ans), String(ans + 1), String(ans - 1), String(ans + 2)] }; },
        function () { return { q: "생활 속에서 모양이나 색깔이 일정한 순서로 반복되는 것을 수학에서 무엇이라 할까요?", answer: "규칙", options: ["우연", "규칙", "정답", "순서도"] }; },
        function () { return { q: "빨강, 파랑, 빨강, 파랑 블록이 반복될 때, 파랑 뒤에 와야 하는 블록 색깔은?", answer: "빨강", options: ["빨강", "파랑", "노랑", "초록"] }; },
        function () { return { q: "방 정리할 때 장난감 중 '바퀴가 있는 것'과 '바퀴가 없는 것'으로 나누는 것을 무엇이라 할까요?", answer: "분류하기", options: ["측정하기", "분류하기", "곱하기", "측량하기"] }; },
        function () { return { q: "신발장을 정리할 때 어른 신발과 내 신발을 크기별로 따로 모으는 것은 어떤 기준일까요?", answer: "크기 기준", options: ["색깔 기준", "크기 기준", "모양 기준", "가격 기준"] }; },
        function () { return { q: "좋아하는 간식 투표 결과를 보기 쉽게 표나 그림으로 나타낸 것을 무엇이라 할까요?", answer: "표", options: ["그림", "표", "문장", "수수께끼"] }; },
        function () { return { q: "간식 조사 표를 보고 가장 친구들이 많이 고른 항목을 찾는 가장 빠른 방법은?", answer: "숫자가 가장 큰 것을 찾는다", options: ["숫자가 가장 작은 것을 찾는다", "숫자가 가장 큰 것을 찾는다", "아무거나 고른다", "글자 수가 많은 것을 고른다"] }; },
        function () { return { q: "축구공이나 농구공처럼 동글동글한 공 모양의 물체를 수학에서 무엇이라 할까요?", answer: "구", options: ["원기둥", "구", "원뿔", "상자"] }; },
        function () { return { q: "우유갑이나 직사각형 상자 모양의 물체를 수학에서 무엇이라 할까요?", answer: "직육면체 (기초)", options: ["구", "직육면체 (기초)", "원뿔", "삼각형"] }; },
        function () { var a = getRandomInt(10, 50), b = getRandomInt(10, 50); while (a === b) b = getRandomInt(10, 50); var big = a > b ? a : b; var diff = Math.abs(a - b); var sumab = a + b; return { q: "문구점에 구슬이 " + a + "개, " + b + "개 있어요. 더 많은 쪽의 개수는?", answer: String(big), options: [String(big), String(diff), String(sumab), String(big - 1)] }; },
        function () { return { q: "친구들과 줄을 섰어요. 세 번째(3번째) 앞에 서 있는 친구는 앞에서 몇 번째일까요?", answer: "두 번째", options: ["첫 번째", "두 번째", "네 번째", "마지막"] }; },
        function () { var f = getRandomInt(2, 8), b = getRandomInt(2, 6), total = f + b - 1; return { q: "놀이공원 줄을 서는데 내가 앞에서 " + f + "번째이고 뒤에서 " + b + "번째예요. 줄에 서 있는 사람은 모두 몇 명일까요?", answer: total + "명", options: [total + "명", (f + b) + "명", (total + 1) + "명", (total - 1 > 0 ? total - 1 : total + 2) + "명"] }; },
        function () { var total = getRandomInt(4, 9), eaten = getRandomInt(1, total - 1), left = total - eaten; return { q: "엄마가 주신 사탕 " + total + "개 중 " + eaten + "개를 먹었어요. 남은 사탕은 몇 개일까요?", answer: left + "개", options: [left + "개", total + "개", (left + 1) + "개", (left > 1 ? left - 1 : left + 2) + "개"] }; },
        function () { var b = getRandomInt(2, 7), sum = getRandomInt(b + 2, b + 9), a = sum - b; return { q: "식탁 위에 놓인 접시를 맞추는 문제! " + sum + " = " + b + " + ( ). 빈칸에 알맞은 수는?", answer: String(a), options: [String(a), String(a + 1), String(a > 1 ? a - 1 : 2), String(a + 2)] }; },
        function () { var n = getRandomInt(1, 20); return { q: "숫자 계단을 올라가요. " + n + " 바로 다음에 오는 수는 무엇일까요?", answer: String(n + 1), options: [String(n + 1), String(n - 1 >= 0 ? n - 1 : n + 3), String(n + 2), String(n + 10)] }; },
        function () { var base = getRandomInt(5, 15), plus = getRandomInt(2, 6), ans = base + plus; return { q: "생일 파티 초대장에 " + base + "명보다 " + plus + "명 더 많은 친구를 불렀어요. 몇 명일까요?", answer: String(ans), options: [String(ans), String(base), String(ans + 3), String(base + 1)] }; },
        function () { var total = getRandomInt(15, 30), lost = getRandomInt(3, 10), left = total - lost; return { q: "가지고 있던 색연필 " + total + "자루 중 " + lost + "자루를 잃어버렸어요. 남은 것은?", answer: String(left), options: [String(left), String(total), String(left + 5), String(left - 3 > 0 ? left - 3 : left + 2)] }; },
        function () { return { q: "한 자리 자연수 중에서 가장 작은 숫자는 무엇일까요?", answer: "1", options: ["0", "1", "9", "10"] }; },
        function () { return { q: "한 자리 자연수 중에서 가장 큰 숫자는 무엇일까요?", answer: "9", options: ["1", "8", "9", "10"] }; }
    ],
    grade2: [
        function () { var n1 = getRandomInt(300, 390), n2 = getRandomInt(391, 450), n3 = getRandomInt(451, 550), mx = Math.max(n1, n2, n3); return { q: "마트에서 물건 가격을 보니 " + n1 + "원, " + n2 + "원, " + n3 + "원이에요. 가장 비싼 물건의 가격은?", answer: String(mx), options: [String(n1), String(n2), String(n3), "모두 같다"] }; },
        function () { var c = getRandomInt(3, 7), l = 8, tot = c * l; return { q: "동물원에 거미 " + c + "마리가 있어요. 거미 다리는 모두 몇 개일까요? (거미 1마리 다리 8개)", answer: tot + "개", options: [tot + "개", (tot + l) + "개", (tot - l) + "개", (tot + 4) + "개"] }; },
        function () { var a = getRandomInt(2, 9), b = getRandomInt(2, 9), ans = a * b; return { q: "간식을 사려고 포장지를 보니 1봉지에 " + a + "개씩 들어있는 사탕을 " + b + "봉지 샀어요. 총 몇 개일까요?", answer: String(ans), options: [String(ans), String(ans + a), String(ans - b > 0 ? ans - b : ans + 2), String(ans + 1)] }; },
        function () { var a = getRandomInt(45, 78), b = getRandomInt(15, 34), ans = a + b; return { q: "스티커 북에 공룡 스티커가 " + a + "장, 우주 스티커가 " + b + "장 있어요. 스티커는 모두 몇 장일까요?", answer: String(ans), options: [String(ans), String(ans + 10), String(ans - 10), String(ans + 1)] }; },
        function () { var a = getRandomInt(50, 85), b = getRandomInt(21, 45), ans = a - b; return { q: "책장에 동화책이 " + a + "권 있었는데 친구에게 " + b + "권을 빌려주었어요. 남은 책은 몇 권일까요?", answer: String(ans), options: [String(ans), String(ans + 10), String(ans - 10), String(ans + 2)] }; },
        function () { var h = getRandomInt(1, 9), t = getRandomInt(1, 9), u = getRandomInt(1, 9), val = h * 100 + t * 10 + u; return { q: "문구점에서 숫자 카드를 받았어요. 100이 " + h + "장, 10이 " + t + "장, 1이 " + u + "장일 때 만든 수는?", answer: String(val), options: [String(val), String(val + 10), String(val - 100), String(h * 100 + u * 10 + t)] }; },
        function () { var n1 = getRandomInt(100, 250), n2 = getRandomInt(251, 400), n3 = getRandomInt(401, 600), mn = Math.min(n1, n2, n3); return { q: "장난감 가격이 각각 " + n1 + "원, " + n2 + "원, " + n3 + "원이에요. 가장 저렴한 장난감은 얼마일까요?", answer: String(mn), options: [String(mn), String(n2), String(n3), "모두 같다"] }; },
        function () { var p = getRandomInt(2, 4), q = getRandomInt(3, 8), tot = p * q; return { q: "맛있는 젤리 " + tot + "개를 " + p + "명의 친구들에게 똑같이 나누어주려고 해요. 1명이 갖는 젤리는 몇 개일까요?", answer: q + "개", options: [q + "개", (q + 1) + "개", (q > 1 ? q - 1 : 2) + "개", (tot - p) + "개"] }; },
        function () { var st = getRandomInt(50, 80), ans = st - 12; return { q: "용돈을 모으는데 규칙적으로 줄어들어요: " + st + ", " + (st - 3) + ", " + (st - 6) + ", " + (st - 9) + ", ( ). 빈칸에 알맞은 수는?", answer: String(ans), options: [String(ans), String(ans + 3), String(ans - 3), String(ans + 1)] }; },
        function () { var n = getRandomInt(3, 8); return { q: "블록을 정리해요. 100개짜리 상자 " + n + "개, 10개짜리 묶음 5개, 낱개 2개일 때 전체 블록 개수는?", answer: String(n * 100 + 52), options: [String(n * 100 + 52), String(n * 10 + 52), String(n * 100 + 25), String(n * 100 + 15)] }; },
        function () { var a = getRandomInt(20, 50), b = getRandomInt(10, 30), sum = a + b; return { q: "문구점에서 색종이를 " + a + "장 사고 도화지를 " + b + "장 샀어요. 산 종이는 총 몇 장일까요?", answer: sum + "장", options: [sum + "장", (sum + 5) + "장", (sum - 5) + "장", (sum + 10) + "장"] }; },
        function () { var a = getRandomInt(60, 90), b = getRandomInt(15, 40), res = a - b; return { q: "풍선 " + a + "개 중 바람이 빠져서 " + res + "개가 남았어요. 터진 풍선은 몇 개일까요?", answer: b + "개", options: [b + "개", (b + 5) + "개", (b - 2 > 0 ? b - 2 : 3) + "개", (b + 10) + "개"] }; },
        function () { var m = getRandomInt(2, 5), cm = getRandomInt(1, 9) * 10, tot = m * 100 + cm; return { q: "내 키를 재어보니 " + m + "m " + cm + "cm예요. cm로만 나타내면 얼마일까요?", answer: tot + "cm", options: [tot + "cm", (tot + 5) + "cm", (m * 10 + cm) + "cm", (tot - 20) + "cm"] }; },
        function () { var h = getRandomInt(1, 5), m = getRandomInt(1, 3) * 10, totM = m + 30, fh = h + Math.floor(totM / 60), fm = totM % 60, ansStr = fh + "시 " + fm + "분"; return { q: "지금 시계가 " + h + "시 " + m + "분을 가리키고 있어요. 정확히 30분 뒤는 몇 시 몇 분일까요?", answer: ansStr, options: [ansStr, h + "시 " + (m + 10) + "분", (fh + 1) + "시 " + fm + "분", h + "시 " + Math.abs(m - 10) + "분"] }; },
        function () { var l = getRandomInt(1, 3), tot = l * 1000 + 500; return { q: "물병에 1L " + l + "통과 500ml 우유 1통이 있어요. 총 몇 ml일까요?", answer: tot + "ml", options: [tot + "ml", (tot - 500) + "ml", (tot + 500) + "ml", (l * 1000) + "ml"] }; },
        function () { var d = getRandomInt(5, 20), ans = d + 7; return { q: "오늘 달력을 보니 " + d + "일이에요. 정확히 일주일(7일) 뒤는 며칠일까요?", answer: ans + "일", options: [ans + "일", (ans + 1) + "일", (ans - 1) + "일", (ans + 2) + "일"] }; },
        function () { var m = getRandomInt(1, 11) * 5; return { q: "디지털 시계가 아닌 벽시계에서 긴바늘이 숫자 " + (m / 5) + "를 가리키고 있어요. 몇 분을 뜻할까요?", answer: m + "분", options: [m + "분", (m + 5) + "분", Math.max(0, m - 5) + "분", ((m + 15) % 60) + "분"] }; },
        function () { var a = getRandomInt(12, 30); return { q: "우리가 쓰는 연필의 길이가 " + a + "cm예요. 교실 칠판에 있는 1m보다 클까요 작을까요?", answer: "1m보다 작다", options: ["1m보다 크다", "1m보다 작다", "1m와 같다", "알 수 없다"] }; },
        function () { return { q: "수영장 길이 기준이 되는 기본 단위! 1m는 몇 cm일까요?", answer: "100cm", options: ["10cm", "100cm", "1,000cm", "10,000cm"] }; },
        function () { return { q: "손가락 한 마디 크기를 나타내기에 가장 알맞은 길이는?", answer: "손가락 한 마디 정도 (1cm)", options: ["칠판 길이", "손가락 한 마디 정도 (1cm)", "교실 크기", "운동장 한 바퀴"] }; },
        function () { return { q: "컵라면을 익히는 3분 동안 초바늘은 몇 바퀴를 돌아야 할까요?", answer: "3바퀴 (180초)", options: ["반 바퀴", "1바퀴 (60초)", "3바퀴 (180초)", "100바퀴"] }; },
        function () { return { q: "점심시간 종이 울리는 오전 11시 바로 다음 낮 시간은?", answer: "낮 12시 (정오)", options: ["밤 12시", "낮 12시", "오후 1시", "오전 10시"] }; },
        function () { var s = getRandomInt(5, 6), name = s === 5 ? "오각형" : "육각형"; return { q: "표지판 모양을 관찰해보니 꼭짓점이 " + s + "개, 변이 " + s + "개예요. 무슨 도형일까요?", answer: name, options: ["사각형", "오각형", "육각형", "칠각형"] }; },
        function () { return { q: "도로 표지판이나 도형 조각 중 삼각, 사각, 오각처럼 곧은 선으로만 둘러싸인 모양을 무엇이라 할까요?", answer: "다각형", options: ["원", "다각형", "구", "기둥"] }; },
        function () { return { q: "피자 조각(삼각형)을 살펴보면 꼭짓점과 변의 개수는 각각 몇 개일까요?", answer: "3개로 같다", options: ["3개와 4개", "3개로 같다", "4개와 3개", "다르다"] }; },
        function () { return { q: "네모난 액자의 네 모서리 각은 모두 어떤 각일까요?", answer: "직각", options: ["예각", "둔각", "직각", "평각"] }; },
        function () { return { q: "네 변의 길이가 모두 똑같은 정사각형의 특징으로 알맞은 것은?", answer: "정사각형 (네 변이 모두 같을 때)", options: ["직사각형", "정사각형 (네 변이 모두 같을 때)", "사다리꼴", "오각형"] }; },
        function () { return { q: "블록 4개로 만든 모양을 위에서 볼 때와 앞에서 볼 때 모양이 다른 이유는?", answer: "보는 방향에 따라 모양이 다르기 때문", options: ["나무가 부서져서", "보는 방향에 따라 모양이 다르기 때문", "마법이라서", "색깔이 달라서"] }; },
        function () { return { q: "색종이로 만든 도형 조각을 책상 위에서 이리저리 돌려도 변하지 않는 것은?", answer: "조각의 넓이와 모양", options: ["위치", "방향", "조각의 넓이와 모양", "색상"] }; },
        function () { return { q: "마트에서 파는 통나무나 음료수 캔(원기둥)의 특징이 아닌 것은?", answer: "뾰족한 꼭짓점이 있다", options: ["위아래가 합동인 원이다", "옆면이 굽은 면이다", "뾰족한 꼭짓점이 있다", "굴릴 수 있다"] }; },
        function () { return { q: "축구공(구)을 어느 방향에서 바라보아도 눈에 보이는 모양은?", answer: "언제나 원 모양", options: ["네모 모양", "세모 모양", "언제나 원 모양", "별 모양"] }; },
        function () { return { q: "택배 상자(직육면체)를 포장할 때 면은 모두 몇 개를 붙여야 할까요?", answer: "6개", options: ["4개", "5개", "6개", "8개"] }; },
        function () { return { q: "마트에서 과자를 3봉지씩 4묶음 살 때, 곱하기의 뜻으로 가장 알맞은 것은?", answer: "똑같은 수를 여러 번 더하기", options: ["수를 계속 빼기", "똑같은 수를 여러 번 더하기", "나누어 담기", "크기 비교하기"] }; },
        function () { return { q: "지갑에 돈이 0원인데 5번을 받아도 내 지갑에 있는 돈은?", answer: "0", options: ["그 수 그대로", "1", "0", "10"] }; },
        function () { return { q: "내가 가진 스티커 10장에 1을 곱하면 몇 장이 될까요?", answer: "그 수 그대로", options: ["0", "1", "그 수 그대로", "2배"] }; },
        function () { var a = getRandomInt(2, 9); return { q: "공책 한 권에 " + a + "백 원인데 10권을 사면 얼마일까요?", answer: String(a * 10), options: [String(a * 10), String(a + 10), String(a), String(a * 100)] }; },
        function () { return { q: "짝을 지어 춤을 추는 2단 곱셈구구의 결과는 언제나 어떤 수일까요?", answer: "짝수", options: ["홀수", "짝수", "소수", "0"] }; },
        function () { return { q: "맛있는 아이스크림 5단 구구단 결과는 일의 자리가 항상 무엇으로 끝날까요?", answer: "0 또는 5", options: ["1 또는 3", "0 또는 5", "짝수만", "홀수만"] }; },
        function () { return { q: "생일파티 쿠키를 친구들에게 똑같이 나누어 담는 수학 활동은?", answer: "나눗셈", options: ["곱셈", "나눗셈", "덧셈", "뺄셈"] }; },
        function () { var p = getRandomInt(2, 5), per = getRandomInt(2, 9), total = p * per; return { q: "사탕 " + total + "개를 친구 " + p + "명에게 똑같이 나누어 줄 때 한 명이 갖는 개수는?", answer: per + "개", options: [per + "개", (per + 1) + "개", (per > 1 ? per - 1 : 2) + "개", p + "개"] }; },
        function () { return { q: "나눗셈식 '10 ÷ 2 = 5'에서 숫자 2가 뜻하는 것은?", answer: "나누는 수 (묶음 수)", options: ["전체 개수", "나누는 수 (묶음 수)", "남은 개수", "몫"] }; },
        function () { return { q: "친구들과 쿠키를 나눠 먹고 남은 부스러기를 뜻하는 수학 용어는?", answer: "나머지", options: ["몫", "합", "나머지", "차"] }; },
        function () { return { q: "홀수 개짜리 사탕 묶음 두 개를 합치면 전체 개수는 짝수가 될까요 홀수가 될까요?", answer: "짝수", options: ["홀수", "짝수", "상황에 따라 다름", "알 수 없음"] }; },
        function () { return { q: "짝수 개와 홀수 개를 더하면 결과는 어떻게 될까요?", answer: "홀수", options: ["짝수", "홀수", "0", "항상 10"] }; },
        function () { return { q: "두 자리 숫자가 시작되는 가장 작은 자연수는?", answer: "10", options: ["1", "9", "10", "99"] }; },
        function () { return { q: "두 자리 자연수 중에서 가장 큰 숫자는 무엇일까요?", answer: "99", options: ["10", "90", "99", "100"] }; },
        function () { return { q: "10원짜리 동전 10개가 모이면 얼마가 될까요?", answer: "100 (백)", options: ["10", "100 (백)", "1,000", "10,000"] }; },
        function () { return { q: "마트에서 500원짜리 동전 2개로 1,000원짜리 물건을 살 수 있을까요?", answer: "같다", options: ["크다", "작다", "같다", "알 수 없다"] }; },
        function () { return { q: "10원짜리 동전 10개는 천 원짜리 지폐와 금액이 같을까요?", answer: "100원", options: ["10원", "50원", "100원", "1,000원"] }; },
        function () { return { q: "지우개 한 개의 무게를 저울에 잴 때 가장 알맞은 단위는?", answer: "g (그램)", options: ["kg (킬로그램)", "g (그램)", "t (톤)", "L (리터)"] }; },
        function () { return { q: "건강검진에서 내 몸무게를 잴 때 사용하는 단위는?", answer: "kg (킬로그램)", options: ["g (그램)", "kg (킬로그램)", "cm (센티미터)", "mL (밀리리터)"] }; },
        function () { return { q: "수학 문제를 풀 때 가장 중요한 자세는 무엇일까요?", answer: "꾸준히 생각하고 해결하기", options: ["정답만 외우기", "꾸준히 생각하고 해결하기", "모르면 넘기기", "찍기"] }; }
    ],
    grade3: [
        function () { var d = [4, 6, 8][getRandomInt(0, 2)], ate = getRandomInt(1, d - 1), left = d - ate; return { q: "피자 " + d + "조각 중 " + ate + "조각을 먹었어요. 남은 피자는 전체의 얼마일까요?", answer: left + "/" + d, options: [left + "/" + d, ate + "/" + d, "1/" + d, (left + 1) + "/" + d] }; },
        function () { var c = getRandomInt(3, 9), val = (c * 0.1).toFixed(1); return { q: "막대 과자를 10칸으로 나눈 것 중 0.1이 " + c + "개 모였어요. 소수로 얼마일까요?", answer: val, options: [val, "0.0" + c, c + ".0", ((c + 1) * 0.1).toFixed(1)] }; },
        function () { var d = getRandomInt(5, 9); return { q: "분모가 " + d + "인 분수 중 3/" + d + "보다 더 큰 분수를 골라보세요.", answer: "4/" + d, options: ["1/" + d, "2/" + d, "4/" + d, "3/" + d] }; },
        function () { var a = (getRandomInt(1, 4) * 0.1).toFixed(1), b = (getRandomInt(5, 9) * 0.1).toFixed(1); return { q: "달리기 기록이 " + a + "초와 " + b + "초예요. 더 큰 소수는 무엇일까요?", answer: b, options: [a, b, "둘 다 같다", "비교 불가"] }; },
        function () { return { q: "피자를 똑같이 나눌 때 전체 조각 수를 뜻하는 아래쪽 숫자를 무엇이라 부를까요?", answer: "분모", options: ["분자", "분모", "몫", "나누는 수"] }; },
        function () { return { q: "나누어진 피자 조각 중 내가 먹은 조각 수를 나타내는 위쪽 숫자는?", answer: "분자", options: ["분모", "분자", "나머지", "합"] }; },
        function () { return { q: "줄자로 재어볼 때 0.1cm가 10개 모이면 전체 길이는 얼마가 될까요?", answer: "1", options: ["0.1", "1", "10", "100"] }; },
        function () { var d = getRandomInt(4, 9); return { q: "분모가 " + d + "이고 분자가 " + (d - 1) + "인 분수는 어떻게 쓸까요?", answer: (d - 1) + "/" + d, options: [(d - 1) + "/" + d, "1/" + d, d + "/" + (d - 1), "1/1"] }; },
        function () { return { q: "분수에서 위쪽 분자가 언제나 1인 분수를 무엇이라 부를까요?", answer: "1", options: ["0", "1", "분모와 같은 수", "2"] }; },
        function () { var a = getRandomInt(1, 3), b = getRandomInt(1, 3); return { q: "피자 조각 덧셈: " + a + "/5 조각과 " + b + "/5 조각을 더하면?", answer: (a + b) + "/5", options: [(a + b) + "/5", (a + b) + "/10", "1/5", (a + b) + "/25"] }; },
        function () { var a = getRandomInt(2, 5), b = getRandomInt(2, 5), sum = (a + b) / 10; return { q: "소수 덧셈 맛보기: " + (a / 10) + "과 " + (b / 10) + "을 더하면 얼마일까요?", answer: sum.toFixed(1), options: [sum.toFixed(1), (sum + 0.2).toFixed(1), (sum > 0.2 ? sum - 0.1 : 0.5).toFixed(1), (sum + 0.3).toFixed(1)] }; },
        function () { var a = getRandomInt(6, 9), b = getRandomInt(1, 4), res = (a - b) / 10; return { q: "소수 뺄셈 맛보기: " + (a / 10) + "에서 " + (b / 10) + "을 빼면 얼마일까요?", answer: res.toFixed(1), options: [res.toFixed(1), (res + 0.2).toFixed(1), (res > 0.1 ? res - 0.1 : 0.3).toFixed(1), (res + 0.4).toFixed(1)] }; },
        function () { var p = 4, q = getRandomInt(5, 8), r = getRandomInt(1, 3), tot = p * q + r, ans = q + "개씩 갖고 " + r + "개 남음"; return { q: "사탕 " + tot + "개를 친구들 " + p + "명에게 똑같이 나누어줄 때 몫과 나머지는?", answer: ans, options: [ans, (q - 1) + "개씩 갖고 " + (r + 2) + "개 남음", (q + 1) + "개씩 남는 것 없음", q + "개씩 갖고 남는 것 없음"] }; },
        function () { var a = getRandomInt(3, 9), b = getRandomInt(2, 9), tot = a * b; return { q: "구슬 " + tot + "개를 " + b + "명에게 똑같이 나누어줄 때 한 명이 갖는 개수는?", answer: String(a), options: [String(a), String(a + 1), String(a > 1 ? a - 1 : 2), String(a + 2)] }; },
        function () { var a = getRandomInt(12, 35), b = getRandomInt(2, 5), ans = a * b; return { q: "마트에서 한 상자에 " + a + "개씩 들어있는 달걀 " + b + "상자를 샀어요. 총 몇 개인가요?", answer: String(ans), options: [String(ans), String(ans + 10), String(ans - 5), String(ans + 2)] }; },
        function () { return { q: "나눗셈의 몫을 정확하게 구할 때 머릿속으로 떠올려야 하는 것은?", answer: "곱셈구구", options: ["덧셈식", "곱셈구구", "뺄셈식", "분수식"] }; },
        function () { return { q: "나누어떨어지는 깔끔한 나눗셈에서 나머지는 항상 얼마일까요?", answer: "0", options: ["0", "1", "나누는 수", "몫"] }; },
        function () { return { q: "백원짜리 동전 10개가 모이면 얼마가 될까요?", answer: "1,000 (천)", options: ["10", "100", "1,000 (천)", "10,000"] }; },
        function () { return { q: "천 원짜리가 10장 모이면 얼마가 될까요?", answer: "10,000 (만)", options: ["1,000", "10,000 (만)", "100,000", "1,000,000"] }; },
        function () { return { q: "사탕을 아무도 없는 곳에 똑같이 나누어주려고 해요. 0으로 나누는 것은 수학에서 가능할까요?", answer: "불가능하다 (정의되지 않음)", options: ["가능하다", "0이다", "불가능하다 (정의되지 않음)", "그 수 자신이 된다"] }; },
        function () { return { q: "선물을 살 때 순서를 바꾸어 더하거나 곱해도 결과가 같은 규칙은?", answer: "교환 법칙", options: ["결합 법칙", "교환 법칙", "분배 법칙", "나누기 법칙"] }; },
        function () { var a = getRandomInt(100, 400), b = getRandomInt(100, 300), ans = a + b; return { q: "도서관에 책이 " + a + "권, 옆 건물에 " + b + "권이 있어요. 총 몇 권인가요?", answer: String(ans), options: [String(ans), String(ans + 100), String(ans - 50), String(ans + 10)] }; },
        function () { return { q: "자전거 바퀴를 만들 때 중심에서 테두리까지 뻗은 선분의 이름은?", answer: "반지름", options: ["지름", "반지름", "원주", "현"] }; },
        function () { var r = getRandomInt(3, 12), d = r * 2; return { q: "훌라후프 반지름이 " + r + "cm예요. 지름은 몇 cm일까요?", answer: d + "cm", options: [d + "cm", (r + 2) + "cm", r + "cm", (d + 4) + "cm"] }; },
        function () { return { q: "동그란 피자 한 판에서 지름은 반지름의 몇 배일까요?", answer: "2배", options: ["2배", "3배", "4배", "반 배"] }; },
        function () { return { q: "컴퍼스로 원을 그릴 때 뾰족한 침을 꽂는 곳을 무엇이라 부을까요?", answer: "원의 중심", options: ["반지름", "원의 중심", "지름", "테두리"] }; },
        function () { return { q: "원 모양의 호두파이를 자를 때 가장 긴 선분이 되는 것은?", answer: "지름", options: ["반지름", "지름", "현", "둘레"] }; },
        function () { return { q: "삼각형 모양 조각을 분류할 때, 반듯한 직각이 있는 삼각형의 이름은?", answer: "직각삼각형", options: ["예각삼각형", "직각삼각형", "둔각삼각형", "정삼각형"] }; },
        function () { return { q: "삼각형의 세 변의 길이가 모두 똑같은 마법의 삼각형 이름은?", answer: "정삼각형", options: ["이등변삼각형", "정삼각형", "직각삼각형", "부등변삼각형"] }; },
        function () { return { q: "두 조각을 포개었을 때 딱 맞아떨어지는 완벽한 관계를 무엇이라 할까요?", answer: "도형의 합동 (기초)", options: ["대칭", "도형의 합동 (기초)", "평행", "확대"] }; },
        function () { return { q: "네모 모양 중 마주보는 두 쌍의 변이 나란히 평행한 사각형은?", answer: "평행사변형", options: ["사다리꼴", "평행사변형", "마름모", "직사각형"] }; },
        function () { return { q: "사다리꼴 모양의 특징으로 알맞은 것은 무엇일까요?", answer: "사다리꼴은 평행한 변이 적어도 한 쌍 있다", options: ["네 변이 모두 같다", "사다리꼴은 평행한 변이 적어도 한 쌍 있다", "네 각이 모두 직각이다", "대각선의 길이가 같다"] }; },
        function () { var kg = getRandomInt(2, 5), g = getRandomInt(1, 9) * 100, tot = kg * 1000 + g; return { q: "수박 한 덩이의 무게가 " + kg + "kg " + g + "g이에요. g으로만 나타내면?", answer: tot + "g", options: [tot + "g", (kg * 100 + g) + "g", (tot + 500) + "g", (kg * 1000) + "g"] }; },
        function () { return { q: "음료수 병에 적힌 1L는 몇 mL일까요?", answer: "1,000mL", options: ["10mL", "100mL", "1,000mL", "10,000mL"] }; },
        function () { return { q: "다음 중 물건의 '무게'를 재는 단위가 아닌 것은?", answer: "L (리터)", options: ["g (그램)", "kg (킬로그램)", "t (톤)", "L (리터)"] }; },
        function () { return { q: "컵라면을 끓일 때 종이컵 한 컵에 들어가는 물의 양은 대략 얼마일까요?", answer: "약 200mL", options: ["약 2mL", "약 20mL", "약 200mL", "약 20L"] }; },
        function () { return { q: "사과 한 개의 무게를 저울에 달면 대략 어느 정도일까요?", answer: "약 300g", options: ["약 3g", "약 30g", "약 300g", "약 30kg"] }; },
        function () { return { q: "우리 집 욕조에 물을 가득 채울 때 필요한들이 단위는?", answer: "L (리터)", options: ["mL", "L (리터)", "g", "cm"] }; },
        function () { return { q: "고기 1kg은 몇 g일까요?", answer: "1,000g", options: ["10g", "100g", "1,000g", "10,000g"] }; },
        function () { return { q: "커다란 코끼리 한 마리의 무게처럼 엄청 무거운 것을 잴 때 쓰는 단위는?", answer: "t (톤)", options: ["g", "kg", "t (톤)", "mL"] }; },
        function () { var l1 = getRandomInt(1, 3), l2 = getRandomInt(1, 2), ml1 = 200, ml2 = 300, tot = (l1 + l2) * 1000 + 500; return { q: "물통에 " + l1 + "L " + ml1 + "mL와 " + l2 + "L " + ml2 + "mL의 물을 섞었어요. 총량은?", answer: (l1 + l2) + "L 500ml", options: [(l1 + l2) + "L 500ml", (l1 + l2 + 1) + "L", l1 + "L 200ml", l2 + "L"] }; },
        function () { return { q: "두 주전자의 들이(물 양)를 직접 비교하려고 할 때 필요한 도구는?", answer: "기준이 되는 통", options: ["자", "저울", "기준이 되는 통", "온도계"] }; },
        function () { return { q: "좋아하는 색상과 운동을 동시에 조사할 때 겹치는 친구들을 찾는 기준은?", answer: "모두 만족하는 것", options: ["아무것도 안 함", "모두 만족하는 것", "하나만 만족", "틀림"] }; },
        function () { return { q: "나눗셈 숙제를 다 풀고 맞았는지 확인할 때 쓰는 검산식은?", answer: "나누는 수 × 몫 + 나머지", options: ["나누는 수 × 몫 + 나머지", "몫 + 나머지", "나누는 수 - 몫", "합"] }; },
        function () { return { q: "그림그래프에서 큰 그림과 작은 그림이 나타내는 숫자가 다를 때 가장 먼저 볼 것은?", answer: "단위를 정확히 확인한다", options: ["무시한다", "단위를 정확히 확인한다", "더하기만 한다", "빼기만 한다"] }; },
        function () { return { q: "학급 친구들의 키를 조사해서 정리하는 첫 번째 단계는?", answer: "조사하기 (세기)", options: ["그래프 그리기", "조사하기 (세기)", "결론 내리기", "포기하기"] }; },
        function () { return { q: "반 친구들이 가장 많이 가지고 있는 필통 색상을 무엇이라 부를까요?", answer: "최빈값 (기초 개념)", options: ["평균", "최빈값 (기초 개념)", "합계", "차이"] }; },
        function () { return { q: "요리할 때 소금이나 물의 양을 눈대중으로 어림하는 까닭은?", answer: "대략적인 크기를 짐작하기 위해", options: ["정확한 값을 몰라서", "대략적인 크기를 짐작하기 위해", "시간을 아끼려고", "공부를 안 하려고"] }; },
        function () { return { q: "분수의 크기를 비교할 때 아래쪽 분모가 같다면 어떤 것을 비교해야 할까요?", answer: "분자의 크기", options: ["분모의 크기", "분자의 크기", "합", "차"] }; },
        function () { return { q: "소수점 아래 숫자의 크기를 비교할 때 어느 자리부터 차례대로 비교해야 할까요?", answer: "소수 첫째 자리부터", options: ["뒤에서부터", "소수 첫째 자리부터", "상관없음", "가장 작은 자리"] }; },
        function () { return { q: "수학 시험을 볼 때 어려운 문제를 만나면 가장 좋은 해결책은?", answer: "문제를 다시 읽고 조건 파악하기", options: ["찍기", "책 덮기", "문제를 다시 읽고 조건 파악하기", "울기"] }; }
    ],
    grade4: [
        function () { var num = ["45,000,000", "32,000,000", "54,000,000"][getRandomInt(0, 2)]; var r = num.indexOf("45") === 0 ? "4천 5백만" : (num.indexOf("32") === 0 ? "3천 2백만" : "5천 4백만"); return { q: "우리나라 예산을 보니 " + num + "원이에요. 우리말로 바르게 읽은 것은?", answer: r, options: [r, "3억 2천만", "54만", "4천 5백"] }; },
        function () { return { q: "마트에서 1만 원짜리 지폐가 10장 모이면 얼마가 될까요?", answer: "십만 (100,000)", options: ["천만", "십만 (100,000)", "백만", "일억"] }; },
        function () { return { q: "십만 원짜리 수표가 10장 모이면 얼마일까요?", answer: "백만 (1,000,000)", options: ["십만", "백만 (1,000,000)", "천만", "일억"] }; },
        function () { return { q: "백만 원이 10개 모이면 커지는 금액 단위는?", answer: "천만 (10,000,000)", options: ["백만", "천만 (10,000,000)", "일억", "십억"] }; },
        function () { return { q: "천만 원이 10개 모이면 우리나라 큰 돈 단위인 무엇이 될까요?", answer: "억 (100,000,000)", options: ["천만", "억 (100,000,000)", "조", "경"] }; },
        function () { var a = getRandomInt(120, 450), b = getRandomInt(50, 120), ans = a * b; return { q: "문구 공장에서 색종이를 한 상자에 " + a + "장씩 " + b + "상자 만들었어요. 총 몇 장일까요?", answer: String(ans), options: [String(ans), String(ans + 1000), String(ans - 500), String(ans + 200)] }; },
        function () { var a = getRandomInt(1200, 3400), b = getRandomInt(12, 25), ans = Math.floor(a / b); return { q: "과자 " + a + "개를 " + b + "명의 친구들에게 똑같이 나누어줄 때 한 명이 받는 과자는 대략 몇 개일까요?", answer: String(ans), options: [String(ans), String(ans + 10), String(ans - 10), String(ans + 5)] }; },
        function () { return { q: "물건을 살 때 곱하는 순서를 바꾸어도 총 금액이 같은 계산 법칙은?", answer: "교환 법칙", options: ["결합 법칙", "교환 법칙", "분배 법칙", "소거 법칙"] }; },
        function () { return { q: "마트에서 할인 쿠폰과 묶음 상품 덧셈·곱셈이 섞여 있을 때 먼저 계산해야 하는 것은?", answer: "곱셈을 먼저 계산한다", options: ["덧셈을 먼저", "곱셈을 먼저 계산한다", "뒤에서부터", "아무거나 먼저"] }; },
        function () { return { q: "쇼핑 영수증 계산식에 괄호가 있을 때 가장 먼저 처리해야 할 곳은?", answer: "괄호 안을 먼저 계산한다", options: ["밖부터", "괄호 안을 먼저 계산한다", "곱셈부터", "나눗셈부터"] }; },
        function () { var a = getRandomInt(10, 50) * 100, b = getRandomInt(5, 20) * 100, sum = a + b; return { q: "지갑에 " + a + "원이 있고 저금통에 " + b + "원이 있어요. 전체 돈은 얼마일까요?", answer: sum + "원", options: [sum + "원", (sum + 1000) + "원", (sum - 500) + "원", (sum + 2000) + "원"] }; },
        function () { var a = getRandomInt(100, 300) * 10, b = getRandomInt(20, 80) * 10, res = a - b; return { q: "문구점에서 " + a + "원짜리 학용품을 사고 " + b + "원을 할인받았어요. 지불하는 금액은 얼마일까요?", answer: res + "원", options: [res + "원", (res + 50) + "원", (res - 50) + "원", (res + 100) + "원"] }; },
        function () { return { q: "종이 부채를 활짝 펼쳤을 때 삼각형 세 각의 크기를 합치면 몇 도가 될까요?", answer: "180도", options: ["90도", "180도", "270도", "360도"] }; },
        function () { return { q: "네모난 운동장을 한 바퀴 돌며 네 각의 크기를 모두 더하면 몇 도일까요?", answer: "360도", options: ["180도", "270도", "360도", "540도"] }; },
        function () { var a = getRandomInt(20, 50), b = getRandomInt(20, 40), sum = a + b; return { q: "각도기로 재어보니 " + a + "도와 " + b + "도인 각을 이어 붙였어요. 합은 몇 도일까요?", answer: sum + "도", options: [sum + "도", (sum + 10) + "도", (sum - 10) + "도", Math.abs(a - b) + "도"] }; },
        function () { var cut = [25, 35, 45][getRandomInt(0, 2)], rem = 90 - cut; return { q: "직각(90도) 모양의 나무 판자에서 " + cut + "도를 잘라냈어요. 남은 각도는?", answer: rem + "도", options: [rem + "도", (rem + 10) + "도", (rem - 10) + "도", (90 + cut) + "도"] }; },
        function () { return { q: "피자 조각처럼 직각보다 작고 뾰족한 각을 수학에서 무엇이라 부를까요?", answer: "예각", options: ["둔각", "예각", "평각", "직각"] }; },
        function () { return { q: "의자에 편하게 기대어 앉을 때처럼 직각보다 크고 180도보다 작은 각은?", answer: "둔각", options: ["예각", "둔각", "평각", "직각"] }; },
        function () { return { q: "미술 시간에 각도를 정확하게 재기 위해 사용하는 도구는?", answer: "각도기", options: ["자", "컴퍼스", "각도기", "저울"] }; },
        function () { return { q: "삼각형 세 각 중 한 각이 둔각인 멋진 삼각형의 이름은?", answer: "둔각삼각형", options: ["예각삼각형", "직각삼각형", "둔각삼각형", "정삼각형"] }; },
        function () { return { q: "삼각형의 모든 각이 뾰족한 예각으로 이루어진 삼각형은?", answer: "예각삼각형", options: ["예각삼각형", "둔각삼각형", "직각삼각형", "평각삼각형"] }; },
        function () { return { q: "마주보는 두 쌍의 변이 서로 나란히 평행한 사각형 모양은?", answer: "평행사변형", options: ["사다리꼴", "평행사변형", "마름모", "직사각형"] }; },
        function () { var d = 10, a = getRandomInt(2, 4), b = getRandomInt(2, 4), sum = a + b; return { q: "피자 10조각 중 " + a + "조각과 " + b + "조각을 먹었어요. 분수 덧셈 결과는?", answer: sum + "/10", options: [sum + "/10", (sum + 1) + "/10", (sum - 1) + "/10", sum + "/20"] }; },
        function () { var a = (getRandomInt(1, 3) + 0.1 * getRandomInt(1, 5)).toFixed(1), b = (getRandomInt(1, 3) + 0.1 * getRandomInt(1, 5)).toFixed(1), sum = (parseFloat(a) + parseFloat(b)).toFixed(1); return { q: "마트에서 " + a + "kg짜리 사과와 " + b + "kg짜리 배를 샀어요. 총 무게 소수 덧셈은?", answer: sum, options: [sum, (parseFloat(sum) + 0.2).toFixed(1), (parseFloat(sum) - 0.1).toFixed(1), (parseFloat(sum) + 1.0).toFixed(1)] }; },
        function () { return { q: "달리기 기록이 5.6초였는데 연습해서 2.3초를 줄였어요. 남은 시간은?", answer: "3.3", options: ["3.3", "3.2", "3.4", "2.3"] }; },
        function () { return { q: "분모가 같은 대분수끼리 더할 때 자연수는 자연수끼리, 분수는?", answer: "분수끼리 더한다", options: ["뺀다", "분수끼리 더한다", "곱한다", "무시한다"] }; },
        function () { return { q: "가분수를 대분수로 고치려고 할 때 분자를 무엇으로 나누어야 할까요?", answer: "분모", options: ["분자", "분모", "10", "1"] }; },
        function () { return { q: "대분수를 가분수로 바꿀 때 분모와 자연수를 곱한 뒤 더해야 하는 것은?", answer: "분자", options: ["분모", "분자", "0", "1"] }; },
        function () { return { q: "소수 첫째 자리 숫자가 서로 같을 때, 어느 자리를 비교해야 할까요?", answer: "소수 둘째 자리", options: ["정수 부분", "소수 둘째 자리", "비교 불가", "상관없음"] }; },
        function () { return { q: "소수점 아래 0.01이 10개 모이면 소수로 얼마가 될까요?", answer: "0.1", options: ["0.001", "0.01", "0.1", "1"] }; },
        function () { return { q: "피자 한 판을 10조각으로 나눌 때 1조각은 소수로 얼마일까요?", answer: "0.1", options: ["0.01", "0.1", "1.0", "10"] }; },
        function () { return { q: "1을 100으로 똑같이 나눈 작은 조각은 소수로 얼마일까요?", answer: "0.01", options: ["0.01", "0.1", "0.001", "1.0"] }; },
        function () { return { q: "종이학을 빙글빙글 일정한 방향으로 돌리는 것을 무엇이라 할까요?", answer: "돌리기", options: ["밀기", "뒤집기", "돌리기", "확대"] }; },
        function () { return { q: "도형을 위아래나 양옆으로 콩 뒤집었을 때 변하지 않는 것은?", answer: "도형의 모양과 크기", options: ["위치", "방향", "도형의 모양과 크기", "색상"] }; },
        function () { return { q: "시계 바늘이 움직이는 방향으로 90도 회전하는 것은?", answer: "오른쪽으로 한 바퀴의 1/4", options: ["왼쪽", "오른쪽으로 한 바퀴의 1/4", "반대", "제자리"] }; },
        function () { return { q: "종이를 반으로 접었을 때 완벽하게 겹쳐지는 접힌 선을 무엇이라 할까요?", answer: "대칭축", options: ["대각선", "대칭축", "중심선", "반지름"] }; },
        function () { return { q: "선대칭도형이란 어떤 곧은 선을 기준으로 접었을 때 완전히 겹치는 도형일까요?", answer: "직선 (대칭축)", options: ["점", "직선 (대칭축)", "원", "각도기"] }; },
        function () { return { q: "점대칭도형은 어떤 점을 중심으로 정확히 몇 도 돌렸을 때 처음 모양과 겹칠까요?", answer: "180도", options: ["90도", "180도", "270도", "360도"] }; },
        function () { return { q: "정삼각형을 반으로 접을 수 있는 대칭축은 모두 몇 개일까요?", answer: "3개", options: ["1개", "2개", "3개", "무수히 많다"] }; },
        function () { return { q: "정사각형을 완벽하게 접을 수 있는 대칭축은 모두 몇 개인가요?", answer: "4개", options: ["2개", "4개", "6개", "8개"] }; },
        function () { return { q: "완벽한 동그라미 원의 대칭축은 모두 몇 개일까요?", answer: "무수히 많다", options: ["1개", "4개", "10개", "무수히 많다"] }; },
        function () { return { q: "도형을 모양과 방향은 그대로 두고 위치만 슥 밀어서 옮기는 것은?", answer: "밀기", options: ["밀기", "뒤집기", "돌리기", "대칭"] }; },
        function () { return { q: "우리 반 친구들의 월별 생일 수를 한눈에 비교하기 가장 좋은 그래프는?", answer: "막대그래프", options: ["막대그래프", "꺾은선 그래프", "그림", "글"] }; },
        function () { return { q: "일주일 동안 날씨에 따른 기온 변화를 선으로 이어 나타낸 그래프는?", answer: "꺾은선 그래프", options: ["막대그래프", "꺾은선 그래프", "원그래프", "띠그래프"] }; },
        function () { var target = getRandomInt(32, 48); return { q: "물건 가격 " + target + "원을 '버림'하여 십의 자리로 나타내면 얼마가 될까요?", answer: String(Math.floor(target / 10) * 10), options: [String(Math.floor(target / 10) * 10), String((Math.floor(target / 10) + 1) * 10), String(target), String(Math.floor(target / 10) * 10 + 5)] }; },
        function () { return { q: "물건을 살 때 구하려는 자리 숫자가 5 이상이면 올려서 처리하는 방법은?", answer: "반올림", options: ["버림", "올림", "반올림", "어림"] }; },
        function () { return { q: "반듯한 선분으로만 둘러싸인 평면도형의 이름을 무엇이라 할까요?", answer: "다각형", options: ["원", "다각형", "곡선도형", "입체"] }; },
        function () { return { q: "모든 변의 길이와 각의 크기가 똑같은 완벽한 다각형은?", answer: "정다각형", options: ["정다각형", "이등변", "대칭도형", "부등변"] }; },
        function () { return { q: "다각형에서 이웃하지 않는 꼭짓점끼리 대각선으로 이은 선분은?", answer: "대각선", options: ["변", "대각선", "반지름", "중심"] }; },
        function () { return { q: "막대그래프에서 세로 눈금 한 칸이 나타내는 숫자가 클 때의 편리한 점은?", answer: "큰 수량을 간단하게 나타낼 수 있다", options: ["자세히 볼 수 있다", "큰 수량을 간단하게 나타낼 수 있다", "칸이 좁아진다", "아무 장점 없음"] }; },
        function () { return { q: "꺾은선 그래프에서 선이 하늘 높이 가파르게 올라갈 때의 뜻은?", answer: "수량이 크게 증가했다는 뜻", options: ["수량이 감소했다", "수량이 크게 증가했다는 뜻", "변화가 없다", "오류가 생겼다"] }; }
    ]
};

var mathAdvSettings = { grade: 'all', timeLimit: 10 };
var mathAdvState = {};
var mathAdvRound = 1, mathAdvCorrect = 0;
function initMathAdventure() { renderMathAdvSetup(); }
function renderMathAdvSetup() {
    var grades = [{ v: 'all', l: '전체 종합' }, { v: 'grade1', l: '초등 1학년' }, { v: 'grade2', l: '초등 2학년' }, { v: 'grade3', l: '초등 3학년' }, { v: 'grade4', l: '초등 4학년' }];
    var times = [{ v: 10, l: '10초' }, { v: 15, l: '15초' }, { v: 20, l: '20초' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">➕ 수학 대모험</div>';
    html += '<div class="game-sub-desc">학년과 제한시간을 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">학년</div><div class="setup-btn-group">';
    grades.forEach(function (g) {
        html += '<button class="setup-btn' + (mathAdvSettings.grade === g.v ? ' active' : '') + '" onclick="setMathAdvGrade(\'' + g.v + '\')">' + g.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (mathAdvSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setMathAdvTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startMathAdvSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setMathAdvGrade(v) { mathAdvSettings.grade = v; renderMathAdvSetup(); }
function setMathAdvTimeLimit(v) { mathAdvSettings.timeLimit = v; renderMathAdvSetup(); }
function startMathAdvSession() { mathAdvRound = 1; mathAdvCorrect = 0; generateMathAdvRound(); }
function generateMathAdvRound() {
    var gradeKey = mathAdvSettings.grade === 'all' ? pickRandom(['grade1', 'grade2', 'grade3', 'grade4']) : mathAdvSettings.grade;
    var pool = MATH_ADV_GENERATORS[gradeKey];
    var quizData = pickRandom(pool)();
    var options = shuffleArray(mathAdvEnsureUniqueOptions(quizData));
    mathAdvState = {
        gradeKey: gradeKey, quizData: quizData, options: options, answered: false, selectedIdx: -1, correct: false,
        timeLimit: mathAdvSettings.timeLimit, timeLeft: mathAdvSettings.timeLimit, timerId: null, timedOut: false
    };
    renderMathAdventure();
    if (mathAdvState.timeLimit > 0) { startMathAdvTimer(); }
}
function retryMathAdvRound() {
    mathAdvState.answered = false;
    mathAdvState.timedOut = false;
    mathAdvState.selectedIdx = -1;
    mathAdvState.timeLeft = mathAdvState.timeLimit;
    renderMathAdventure();
    if (mathAdvState.timeLimit > 0) { startMathAdvTimer(); }
}
function nextMathAdvRound() { mathAdvRound++; generateMathAdvRound(); }
function startMathAdvTimer() {
    var bar = document.getElementById('mathAdvTimerBar');
    if (bar) bar.style.width = (mathAdvState.timeLeft / mathAdvState.timeLimit * 100) + '%';
    mathAdvState.timerId = setInterval(function () {
        mathAdvState.timeLeft -= 0.1;
        var b = document.getElementById('mathAdvTimerBar');
        if (b) b.style.width = Math.max(0, mathAdvState.timeLeft / mathAdvState.timeLimit * 100) + '%';
        if (mathAdvState.timeLeft <= 0) { handleMathAdvTimeout(); }
    }, 100);
    activeTimers.push(mathAdvState.timerId);
}
function handleMathAdvTimeout() {
    if (mathAdvState.timerId) { clearInterval(mathAdvState.timerId); mathAdvState.timerId = null; }
    choiceTimeout();
}
function mathAdvChoiceCfg() {
    var ans = mathAdvState.quizData.answer;
    return {
        msgId: 'mathAdvMsg',
        ok: '🎉 정답이에요!',
        bad: '아쉬워요! 정답은 "' + ans + '" 였어요.',
        timeout: '⏰ 시간이 다 됐어요! 정답은 "' + ans + '" 였어요.',
        onPick: function () { if (mathAdvState.timerId) { clearInterval(mathAdvState.timerId); mathAdvState.timerId = null; } },
        onCorrect: function () { mathAdvCorrect++; },
        next: 'nextMathAdvRound()', retry: 'retryMathAdvRound()', home: 'renderMathAdvSetup()',
        failStyle: 'retryHome'
    };
}
function renderMathAdventure() {
    var gradeBadges = { grade1: '초1', grade2: '초2', grade3: '초3', grade4: '초4' };
    var html = '<div class="game-title-box">➕ 수학 대모험</div>';
    html += '<div class="game-sub-desc">문제를 잘 읽고 알맞은 답을 골라보세요!</div>';
    html += '<div class="status-row"><div>' + mathAdvRound + '라운드 (' + gradeBadges[mathAdvState.gradeKey] + ')</div><div>정답: ' + mathAdvCorrect + ' / ' + (mathAdvRound - 1) + '</div></div>';
    if (mathAdvState.timeLimit > 0) {
        html += '<div class="timer-container"><div class="timer-bar" id="mathAdvTimerBar"></div></div>';
    }
    html += '<div style="background:#f8fafc; border:2px dashed #cbd5e1; border-radius:0.75rem; padding:1.25rem; margin-bottom:1.25rem; min-height:110px; display:flex; align-items:center; justify-content:center;">';
    html += '<div style="font-size:1.1rem; font-weight:700; line-height:1.5; text-align:center;">' + mathAdvState.quizData.q + '</div>';
    html += '</div>';
    var cfg = mathAdvChoiceCfg();
    html += choiceOptionsHtml(mathAdvState.options, cfg);
    document.getElementById('mainArea').innerHTML = html;
    choiceBegin(mathAdvState.options.indexOf(mathAdvState.quizData.answer), cfg);
}

// ===================== 게임 등록 =====================
GAME_INIT_FNS.clockMatch = initClockMatch;GAME_INIT_FNS.probabilityDraw = initProbabilityDraw;
GAME_INIT_FNS.changeCounter = initChangeGame;
GAME_INIT_FNS.mathAdventure = initMathAdventure;
