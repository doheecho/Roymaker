// ===================== 3. 공간지각: 미로 찾기 =====================
var mazeSettings = { size: 8, timeLimit: 0 };
var mazeSolved = 0;
var mazeState = {};
var mazeHoldInterval = null;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('mazeGame', { easy: { size: 6 }, normal: { size: 8 }, hard: { size: 10 } });
}

function buildMaze(w, h) {
    var cells = [];
    for (var y = 0; y < h; y++) { var row = []; for (var x = 0; x < w; x++) { row.push({ top: true, right: true, bottom: true, left: true, visited: false }); } cells.push(row); }
    var stack = [{ x: 0, y: 0 }];
    cells[0][0].visited = true;
    var dirs = [{ dx: 0, dy: -1, self: 'top', opp: 'bottom' }, { dx: 1, dy: 0, self: 'right', opp: 'left' }, { dx: 0, dy: 1, self: 'bottom', opp: 'top' }, { dx: -1, dy: 0, self: 'left', opp: 'right' }];
    while (stack.length > 0) {
        var cur = stack[stack.length - 1];
        var neighbors = [];
        dirs.forEach(function (d) {
            var nx = cur.x + d.dx, ny = cur.y + d.dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && !cells[ny][nx].visited) neighbors.push({ x: nx, y: ny, dir: d });
        });
        if (neighbors.length === 0) { stack.pop(); continue; }
        var next = neighbors[getRandomInt(0, neighbors.length - 1)];
        cells[cur.y][cur.x][next.dir.self] = false;
        cells[next.y][next.x][next.dir.opp] = false;
        cells[next.y][next.x].visited = true;
        stack.push({ x: next.x, y: next.y });
    }
    return cells;
}
function initMazeGame() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('mazeGame', mazeSettings);
    renderMazeSetup();
}
function renderMazeSetup() {
    var sizes = [{ v: 6, l: '쉬움' }, { v: 8, l: '보통' }, { v: 10, l: '어려움' }];
    var times = [{ v: 10, l: '10초' }, { v: 20, l: '20초' }, { v: 60, l: '1분' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">🐭 미로 찾기</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">미로 크기</div><div class="setup-btn-group">';
    sizes.forEach(function (s) {
        html += '<button class="setup-btn' + (mazeSettings.size === s.v ? ' active' : '') + '" onclick="setMazeSize(' + s.v + ')">' + s.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (mazeSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setMazeTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startMazeSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setMazeSize(v) { mazeSettings.size = v; renderMazeSetup(); }
function setMazeTimeLimit(v) { mazeSettings.timeLimit = v; renderMazeSetup(); }
function startMazeSession() {
    mazeSolved = 0;
    generateMazeRound();
}
function generateMazeRound() {
    var w = mazeSettings.size, h = mazeSettings.size;
    mazeState = { w: w, h: h, cells: buildMaze(w, h), player: { x: 0, y: 0 }, goal: { x: w - 1, y: h - 1 }, won: false, failed: false, timeLeft: mazeSettings.timeLimit, timerId: null, startTime: Date.now(), elapsed: 0, stopwatchId: null };
    renderMaze();
    if (mazeSettings.timeLimit > 0) { startMazeTimer(); }
    startMazeStopwatch();
}
function retryMazeRound() {
    mazeState.player = { x: 0, y: 0 };
    mazeState.won = false;
    mazeState.failed = false;
    mazeState.timeLeft = mazeSettings.timeLimit;
    mazeState.startTime = Date.now();
    mazeState.elapsed = 0;
    renderMaze();
    if (mazeSettings.timeLimit > 0) { startMazeTimer(); }
    startMazeStopwatch();
}
function restartMaze() {
    mazeSolved = 0;
    renderMazeSetup();
}
function nextMazeProblem() {
    generateMazeRound();
}
function startMazeStopwatch() {
    mazeState.stopwatchId = setInterval(function () {
        if (mazeState.won || mazeState.failed) { clearInterval(mazeState.stopwatchId); return; }
        var el = document.getElementById('mazeElapsedDisplay');
        var secs = ((Date.now() - mazeState.startTime) / 1000).toFixed(1);
        if (el) el.innerText = secs + '초';
    }, 100);
    activeTimers.push(mazeState.stopwatchId);
}
function startMazeTimer() {
    var bar = document.getElementById('mazeTimerBar');
    if (bar) bar.style.width = '100%';
    mazeState.timerId = setInterval(function () {
        mazeState.timeLeft -= 0.1;
        var pct = (mazeState.timeLeft / mazeSettings.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('mazeTimerBar');
        if (b) b.style.width = pct + '%';
        if (mazeState.timeLeft <= 0) {
            clearInterval(mazeState.timerId);
            mazeState.failed = true;
            if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
            stopHoldMove();
            renderMaze();
        }
    }, 100);
    activeTimers.push(mazeState.timerId);
}
function renderMaze() {
    var html = '<div class="game-title-box">🐭 미로 찾기</div>';
    html += '<div class="game-sub-desc">쥐돌이 🐭를 치즈 🧀까지 안내해주세요! 버튼을 누르고 있으면 계속 이동하고, 미로 위에서 손가락으로 길을 따라 쭉 그어도 움직여요.</div>';
    html += '<div class="status-row"><div>맞춘 문제: ' + mazeSolved + '개</div><div>경과 시간: <span id="mazeElapsedDisplay">0.0초</span></div></div>';
    if (mazeSettings.timeLimit > 0) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="mazeTimerBar"></div></div>';
    }
    html += '<div class="maze-wrap">';
    html += '<div class="maze-grid" id="mazeGridEl" style="grid-template-columns: repeat(' + mazeState.w + ', 30px);">';
    for (var y = 0; y < mazeState.h; y++) {
        for (var x = 0; x < mazeState.w; x++) {
            var c = mazeState.cells[y][x];
            var style = 'border-top:' + (c.top ? '2px solid #334155' : 'none') +
                ';border-right:' + (c.right ? '2px solid #334155' : 'none') +
                ';border-bottom:' + (c.bottom ? '2px solid #334155' : 'none') +
                ';border-left:' + (c.left ? '2px solid #334155' : 'none') + ';';
            var content = '';
            if (mazeState.player.x === x && mazeState.player.y === y) content = '🐭';
            else if (mazeState.goal.x === x && mazeState.goal.y === y) content = '🧀';
            html += '<div class="maze-cell" style="' + style + '">' + content + '</div>';
        }
    }
    html += '</div>';
    html += '<div class="maze-controls">';
    html += '<div></div><button class="maze-btn" onmousedown="startHoldMove(0,-1)" ontouchstart="event.preventDefault();startHoldMove(0,-1)">▲</button><div></div>';
    html += '<button class="maze-btn" onmousedown="startHoldMove(-1,0)" ontouchstart="event.preventDefault();startHoldMove(-1,0)">◀</button>';
    html += '<button class="maze-btn" onmousedown="startHoldMove(0,1)" ontouchstart="event.preventDefault();startHoldMove(0,1)">▼</button>';
    html += '<button class="maze-btn" onmousedown="startHoldMove(1,0)" ontouchstart="event.preventDefault();startHoldMove(1,0)">▶</button>';
    html += '</div></div>';
    html += '<div id="mazeMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    attachMazeSwipeHandlers();
    if (mazeState.won) {
        clearInterval(mazeState.timerId);
        clearInterval(mazeState.stopwatchId);
        stopHoldMove();
        var msg = document.getElementById('mazeMsg');
        msg.style.display = 'block'; msg.innerText = '🎉 도착했어요! ' + mazeState.elapsed.toFixed(1) + '초 만에 성공했어요!'; playResultSound(true);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextMazeProblem()', 'retryMazeRound()', 'restartMaze()'));
    } else if (mazeState.failed) {
        clearInterval(mazeState.stopwatchId);
        stopHoldMove();
        var msg2 = document.getElementById('mazeMsg');
        msg2.className = 'msg-box bad'; msg2.style.display = 'block'; msg2.innerText = '⏰ 시간이 다 됐어요!'; playResultSound(false);
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryMazeRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartMaze()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}
function mazeCellFromTouch(touchX, touchY, rectWidth, rectHeight, w, h) {
    var cellW = rectWidth / w;
    var cellH = rectHeight / h;
    var col = Math.floor(touchX / cellW);
    var row = Math.floor(touchY / cellH);
    return { col: col, row: row };
}
function processMazeDragToCell(col, row) {
    if (mazeState.won || mazeState.failed) return;
    if (col < 0 || col >= mazeState.w || row < 0 || row >= mazeState.h) return;
    var p = mazeState.player;
    var dx = col - p.x, dy = row - p.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    moveMaze(dx, dy);
}
function handleMazeDragEvent(e) {
    if (!e.touches || !e.touches[0]) return;
    var grid = document.getElementById('mazeGridEl');
    if (!grid || !grid.getBoundingClientRect) return;
    var rect = grid.getBoundingClientRect();
    var touchX = e.touches[0].clientX - rect.left;
    var touchY = e.touches[0].clientY - rect.top;
    var cell = mazeCellFromTouch(touchX, touchY, rect.width, rect.height, mazeState.w, mazeState.h);
    processMazeDragToCell(cell.col, cell.row);
}
function attachMazeSwipeHandlers() {
    var grid = document.getElementById('mazeGridEl');
    if (!grid || !grid.addEventListener) return;
    grid.addEventListener('touchstart', function (e) {
        e.preventDefault();
        handleMazeDragEvent(e);
    }, { passive: false });
    grid.addEventListener('touchmove', function (e) {
        e.preventDefault();
        handleMazeDragEvent(e);
    }, { passive: false });
}
function startHoldMove(dx, dy) {
    stopHoldMove();
    moveMaze(dx, dy);
    mazeHoldInterval = setInterval(function () { moveMaze(dx, dy); }, 180);
    activeTimers.push(mazeHoldInterval);
}
function stopHoldMove() {
    if (mazeHoldInterval) { clearInterval(mazeHoldInterval); mazeHoldInterval = null; }
}
function moveMaze(dx, dy) {
    if (mazeState.won || mazeState.failed) return;
    var p = mazeState.player;
    var cell = mazeState.cells[p.y][p.x];
    var can = false;
    if (dx === 0 && dy === -1 && !cell.top) can = true;
    if (dx === 1 && dy === 0 && !cell.right) can = true;
    if (dx === 0 && dy === 1 && !cell.bottom) can = true;
    if (dx === -1 && dy === 0 && !cell.left) can = true;
    if (!can) return;
    p.x += dx; p.y += dy;
    if (p.x === mazeState.goal.x && p.y === mazeState.goal.y) {
        mazeState.won = true;
        mazeState.elapsed = (Date.now() - mazeState.startTime) / 1000;
        mazeSolved++;
        if (typeof reportGameOutcome === 'function') reportGameOutcome('win');
        if (typeof reportGameRound === 'function') reportGameRound(mazeSolved);
        stopHoldMove();
    }
    renderMaze();
}
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('mouseup', function () { stopHoldMove(); });
    document.addEventListener('touchend', function () { stopHoldMove(); });
}

// ===================== 11. 공간지각: 위에서 본 모양 맞추기 =====================
var topViewSettings = { maxHeight: 3, width: 2, depth: 2, timeLimit: 0 };
var topViewState = {};
var topViewRound = 1, topViewCorrect = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('topViewMatch', {
        easy: { maxHeight: 3, width: 2, depth: 2 },
        normal: { maxHeight: 5, width: 3, depth: 3 },
        hard: { maxHeight: 10, width: 4, depth: 4 }
    });
}
function initTopViewMatch() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('topViewMatch', topViewSettings);
    renderTopViewSetup();
}
function renderTopViewSetup() {
    var heights = [{ v: 3, l: '3층' }, { v: 5, l: '5층' }, { v: 10, l: '10층' }, { v: 'random', l: '무작위' }];
    var widths = [{ v: 2, l: '2개' }, { v: 3, l: '3개' }, { v: 4, l: '4개' }, { v: 'random', l: '무작위' }];
    var depths = [{ v: 2, l: '2개' }, { v: 3, l: '3개' }, { v: 4, l: '4개' }, { v: 'random', l: '무작위' }];
    var times = [{ v: 10, l: '10초' }, { v: 20, l: '20초' }, { v: 30, l: '30초' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">📦 위에서 본 모양 맞추기</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">최대 층수</div><div class="setup-btn-group">';
    heights.forEach(function (t) {
        html += '<button class="setup-btn' + (topViewSettings.maxHeight === t.v ? ' active' : '') + '" onclick="setTopViewHeight(' + (t.v === 'random' ? "'random'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">가로 개수</div><div class="setup-btn-group">';
    widths.forEach(function (t) {
        html += '<button class="setup-btn' + (topViewSettings.width === t.v ? ' active' : '') + '" onclick="setTopViewWidth(' + (t.v === 'random' ? "'random'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">세로 개수</div><div class="setup-btn-group">';
    depths.forEach(function (t) {
        html += '<button class="setup-btn' + (topViewSettings.depth === t.v ? ' active' : '') + '" onclick="setTopViewDepth(' + (t.v === 'random' ? "'random'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (topViewSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setTopViewTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startTopViewSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setTopViewHeight(v) { topViewSettings.maxHeight = v; renderTopViewSetup(); }
function setTopViewWidth(v) { topViewSettings.width = v; renderTopViewSetup(); }
function setTopViewDepth(v) { topViewSettings.depth = v; renderTopViewSetup(); }
function setTopViewTimeLimit(v) { topViewSettings.timeLimit = v; renderTopViewSetup(); }
function startTopViewSession() { topViewRound = 1; topViewCorrect = 0; generateTopViewRound(); }
function resolveTopViewParams() {
    var maxH = topViewSettings.maxHeight === 'random' ? pickRandom([3, 5, 10]) : topViewSettings.maxHeight;
    var w = topViewSettings.width === 'random' ? pickRandom([2, 3, 4]) : topViewSettings.width;
    var d = topViewSettings.depth === 'random' ? pickRandom([2, 3, 4]) : topViewSettings.depth;
    return { maxH: maxH, w: w, d: d };
}
function generateTopViewRound() {
    var params = resolveTopViewParams();
    var w = params.w, d = params.d, maxH = params.maxH;
    var heights = [];
    for (var i = 0; i < w * d; i++) { heights.push(getRandomInt(1, maxH)); }
    var grid = [];
    for (var r = 0; r < d; r++) { var row = []; for (var c = 0; c < w; c++) { row.push(heights[r * w + c]); } grid.push(row); }
    var frontView = [];
    for (var c = 0; c < w; c++) { var m = 0; for (var r = 0; r < d; r++) { m = Math.max(m, grid[r][c]); } frontView.push(m); }
    var answer = frontView.join(', ');
    var optionSet = [answer];
    var attempts = 0;
    while (optionSet.length < 4 && attempts < 40) {
        attempts++;
        var cand = [];
        for (var k = 0; k < w; k++) { cand.push(getRandomInt(1, maxH)); }
        var cs = cand.join(', ');
        if (optionSet.indexOf(cs) === -1) optionSet.push(cs);
    }
    var options = shuffleArray(optionSet);
    topViewState = { grid: grid, w: w, h: d, answer: answer, options: options, answered: false, finished: false, timeLeft: topViewSettings.timeLimit, timerId: null };
    renderTopViewMatch();
    if (topViewSettings.timeLimit > 0) { startTopViewTimer(); }
}
function retryTopViewRound() {
    topViewState.answered = false;
    topViewState.finished = false;
    topViewState.timeLeft = topViewSettings.timeLimit;
    renderTopViewMatch();
    if (topViewSettings.timeLimit > 0) { startTopViewTimer(); }
}
function restartTopView() { renderTopViewSetup(); }
function nextTopViewRound() { topViewRound++; generateTopViewRound(); }
function startTopViewTimer() {
    var bar = document.getElementById('topViewTimerBar');
    if (bar) bar.style.width = '100%';
    topViewState.timerId = setInterval(function () {
        topViewState.timeLeft -= 0.1;
        var pct = (topViewState.timeLeft / topViewSettings.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('topViewTimerBar');
        if (b) b.style.width = pct + '%';
        if (topViewState.timeLeft <= 0) {
            clearInterval(topViewState.timerId);
            handleTopViewTimeout();
        }
    }, 100);
    activeTimers.push(topViewState.timerId);
}
function handleTopViewTimeout() { choiceTimeout(); }
function topViewChoiceCfg() {
    return {
        msgId: 'topViewMsg',
        ok: '🎉 정답이에요! 이런 모양으로 보여요:',
        bad: '아쉬워요! 정답은 "' + topViewState.answer + '" 였어요. 정답 모양은 이래요:',
        timeout: '⏰ 시간이 다 됐어요! 정답은 "' + topViewState.answer + '" 였어요.',
        explain: function () { return renderFrontViewBars(topViewState.answer); },
        onPick: function () { topViewState.finished = true; if (topViewState.timerId) clearInterval(topViewState.timerId); },
        onCorrect: function () { topViewCorrect++; },
        onTimeout: function () { topViewState.finished = true; },
        next: 'nextTopViewRound()', retry: 'retryTopViewRound()', home: 'restartTopView()',
        failStyle: 'retryHome'
    };
}
function renderTopViewMatch() {
    var html = '<div class="game-title-box">📦 위에서 본 모양 맞추기</div>';
    html += '<div class="game-sub-desc">쌓기나무를 위에서 본 모습이에요(숫자는 쌓인 층수). 아래에서 바라보면 왼쪽부터 몇 층씩 보일까요?</div>';
    if (topViewSettings.timeLimit > 0) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="topViewTimerBar"></div></div>';
    }
    html += '<div class="status-row"><div>' + topViewRound + '라운드</div><div>정답: ' + topViewCorrect + ' / ' + (topViewRound - 1) + '</div></div>';
    html += '<div class="topview-grid" style="grid-template-columns: repeat(' + topViewState.w + ', 56px);">';
    for (var r = 0; r < topViewState.h; r++) {
        for (var c = 0; c < topViewState.w; c++) {
            html += '<div class="topview-cell">' + topViewState.grid[r][c] + '층</div>';
        }
    }
    html += '</div>';
    html += '<div style="display:flex; justify-content:center; gap:0.3rem; margin-bottom:0.2rem;">';
    for (var wc = 0; wc < topViewState.w; wc++) { html += '<div style="width:56px; text-align:center; font-size:1.2rem;">⬆️</div>'; }
    html += '</div>';
    html += '<div style="text-align:center; margin-bottom:1rem;"><span style="font-size:1.9rem;">🧍</span><div class="game-sub-desc" style="margin:0;">내가 여기서 이 방향으로 바라보고 있어요!</div></div>';
    var cfg = topViewChoiceCfg();
    html += choiceOptionsHtml(topViewState.options, cfg);
    document.getElementById('mainArea').innerHTML = html;
    choiceBegin(topViewState.options.indexOf(topViewState.answer), cfg);
}
function renderFrontViewBars(answerStr) {
    var heights = answerStr.split(',').map(function (s) { return parseInt(s.trim(), 10); });
    var html = '<div style="display:flex; justify-content:center; align-items:flex-end; gap:0.5rem; margin: 0.9rem 0; min-height:110px;">';
    heights.forEach(function (h) {
        html += '<div style="display:flex; flex-direction:column-reverse; align-items:center;">';
        for (var i = 0; i < h; i++) {
            html += '<div style="width:38px; height:24px; background:#a78bfa; border:2px solid #7c3aed; border-radius:4px; margin-top:2px; box-shadow: 2px 2px 0 rgba(124,58,237,0.3);"></div>';
        }
        html += '</div>';
    });
    html += '</div>';
    return html;
}

// ===================== 12. 공간지각: 지도 찾기 =====================
var MAP_LANDMARKS = [
    { name: '학교', emoji: '🏫' }, { name: '빵집', emoji: '🥐' }, { name: '병원', emoji: '🏥' },
    { name: '집', emoji: '🏠' }, { name: '공원', emoji: '🌳' }, { name: '분수', emoji: '⛲' }
];
var mapState = {};
var mapRound = 1, mapCorrect = 0;
function initMapFinder() { mapRound = 1; mapCorrect = 0; generateMapRound(); }
function generateMapRound() {
    var gridSize = 3;
    var attempts = 0;
    var ax, ay, bx, by, dx, dy;
    do {
        attempts++;
        var positions = pickN(Array.from({ length: gridSize * gridSize }, function (_, i) { return i; }), 2);
        ax = positions[0] % gridSize; ay = Math.floor(positions[0] / gridSize);
        bx = positions[1] % gridSize; by = Math.floor(positions[1] / gridSize);
        dx = bx - ax; dy = by - ay;
    } while (Math.abs(dx) === Math.abs(dy) && attempts < 20);
    var chosen = pickN(MAP_LANDMARKS, 2);
    var dir;
    if (Math.abs(dx) >= Math.abs(dy)) { dir = dx > 0 ? '오른쪽' : '왼쪽'; } else { dir = dy > 0 ? '아래쪽' : '위쪽'; }
    var grid = new Array(gridSize * gridSize).fill(null);
    grid[ay * gridSize + ax] = chosen[0];
    grid[by * gridSize + bx] = chosen[1];
    mapState = { grid: grid, gridSize: gridSize, a: chosen[0], b: chosen[1], answer: dir, answered: false };
    renderMapFinder();
}
var MAP_DIR_OPTS = ['위쪽', '아래쪽', '왼쪽', '오른쪽'];
function mapFinderChoiceCfg() {
    return {
        msgId: 'mapMsg',
        ok: '🎉 정답이에요!',
        bad: '아쉬워요! 정답은 "' + mapState.answer + '" 였어요.',
        onCorrect: function () { mapCorrect++; },
        next: 'nextMapRound()', retry: 'retryMapRound()', home: 'restartMapFinder()',
        failStyle: 'retryHome'
    };
}
function renderMapFinder() {
    var html = '<div class="game-title-box">🗺️ 지도 찾기</div>';
    html += '<div class="game-sub-desc">지도를 보고 위치 관계를 알아맞혀보세요!</div>';
    html += '<div class="status-row"><div>' + mapRound + '라운드</div><div>정답: ' + mapCorrect + ' / ' + (mapRound - 1) + '</div></div>';
    html += '<div class="map-grid" style="grid-template-columns: repeat(' + mapState.gridSize + ', 56px);">';
    mapState.grid.forEach(function (cell) {
        html += '<div class="map-cell">' + (cell ? cell.emoji : '') + '</div>';
    });
    html += '</div>';
    html += '<div class="game-sub-desc" style="text-align:center;">' + mapState.b.emoji + ' ' + mapState.b.name + '은(는) ' + mapState.a.emoji + ' ' + mapState.a.name + '의 어느 쪽에 있을까요?</div>';
    var cfg = mapFinderChoiceCfg();
    html += choiceOptionsHtml(MAP_DIR_OPTS, cfg);
    document.getElementById('mainArea').innerHTML = html;
    choiceBegin(MAP_DIR_OPTS.indexOf(mapState.answer), cfg);
}
function retryMapRound() { renderMapFinder(); }
function restartMapFinder() { mapRound = 1; mapCorrect = 0; generateMapRound(); }
function nextMapRound() { mapRound++; generateMapRound(); }

// ===================== 17. 공간지각: 3D 블록 돌리기 =====================
var CUBE3D_TILT_X = -22;
var cube3dSettings = { blockCount: 4, timeLimit: 10 };
var cube3dState = {};
var cube3dRound = 1, cube3dCorrect = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('cube3dMatch', { easy: { blockCount: 4 }, normal: { blockCount: '5-7' }, hard: { blockCount: '8-10' } });
}
function initCube3DMatch() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('cube3dMatch', cube3dSettings);
    renderCube3DSetup();
}
function renderCube3DSetup() {
    var counts = [{ v: 4, l: '4개' }, { v: '5-7', l: '5~7개' }, { v: '8-10', l: '8~10개' }, { v: 'random', l: '무작위' }];
    var times = [{ v: 10, l: '10초' }, { v: 15, l: '15초' }, { v: 20, l: '20초' }, { v: 'random', l: '무작위' }];
    var html = '<div class="game-title-box">🧊 3D 블록 돌리기</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">블록 개수</div><div class="setup-btn-group">';
    counts.forEach(function (t) {
        html += '<button class="setup-btn' + (cube3dSettings.blockCount === t.v ? ' active' : '') + '" onclick="setCube3DBlockCount(' + (typeof t.v === 'string' ? "'" + t.v + "'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (cube3dSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setCube3DTimeLimit(' + (typeof t.v === 'string' ? "'" + t.v + "'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startCube3DSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setCube3DBlockCount(v) { cube3dSettings.blockCount = v; renderCube3DSetup(); }
function setCube3DTimeLimit(v) { cube3dSettings.timeLimit = v; renderCube3DSetup(); }
function startCube3DSession() { cube3dRound = 1; cube3dCorrect = 0; generateCube3DRound(); }
function resolveCube3DBlockCount() {
    var bc = cube3dSettings.blockCount;
    if (bc === '5-7') return getRandomInt(5, 7);
    if (bc === '8-10') return getRandomInt(8, 10);
    if (bc === 'random') return getRandomInt(4, 10);
    return bc;
}
function resolveCube3DTimeLimit() {
    var tl = cube3dSettings.timeLimit;
    if (tl === 'random') return pickRandom([10, 15, 20]);
    return tl;
}
function generateRandomPolycube(n) {
    var cells = [{ x: 0, y: 0, z: 0 }];
    var cellSet = { '0,0,0': true };
    var dirs = [{ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }];
    var safety = 0;
    while (cells.length < n && safety < 3000) {
        safety++;
        var base = cells[getRandomInt(0, cells.length - 1)];
        var dir = dirs[getRandomInt(0, 5)];
        var nx = base.x + dir.x, ny = base.y + dir.y, nz = base.z + dir.z;
        var key = nx + ',' + ny + ',' + nz;
        if (!cellSet[key]) {
            cells.push({ x: nx, y: ny, z: nz });
            cellSet[key] = true;
        }
    }
    return cells;
}
function computeCubeExtent(cells) {
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    cells.forEach(function (c) {
        if (c.x < minX) minX = c.x; if (c.x > maxX) maxX = c.x;
        if (c.y < minY) minY = c.y; if (c.y > maxY) maxY = c.y;
        if (c.z < minZ) minZ = c.z; if (c.z > maxZ) maxZ = c.z;
    });
    var rangeX = maxX - minX + 1, rangeY = maxY - minY + 1, rangeZ = maxZ - minZ + 1;
    return Math.max(rangeX, rangeY, rangeZ);
}
function computeCubeScale(cells, comfort) {
    comfort = comfort || 2;
    var extent = computeCubeExtent(cells);
    var scale = comfort / extent;
    if (scale > 1) scale = 1;
    if (scale < 0.35) scale = 0.35;
    return scale;
}
function buildCube3DHTML(positions, rotX, rotY, groupId, scale) {
    scale = scale || 1;
    var size = 40;
    var avgX = 0, avgY = 0, avgZ = 0;
    positions.forEach(function (p) { avgX += p.x; avgY += p.y; avgZ += p.z; });
    avgX /= positions.length; avgY /= positions.length; avgZ /= positions.length;
    var html = '<div class="cube3d-group" id="' + groupId + '" style="transform: rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(' + scale + ');">';
    positions.forEach(function (p) {
        var tx = (p.x - avgX) * size, ty = -(p.y - avgY) * size, tz = (p.z - avgZ) * size;
        html += '<div class="cube3d-unit" style="transform: translate3d(' + tx + 'px,' + ty + 'px,' + tz + 'px);">';
        var faces = [
            ['translateZ(20px)', '#8b5cf6'],
            ['rotateY(180deg) translateZ(20px)', '#6d28d9'],
            ['rotateY(90deg) translateZ(20px)', '#7c3aed'],
            ['rotateY(-90deg) translateZ(20px)', '#5b21b6'],
            ['rotateX(90deg) translateZ(20px)', '#a78bfa'],
            ['rotateX(-90deg) translateZ(20px)', '#4c1d95']
        ];
        faces.forEach(function (f) {
            html += '<div class="cube3d-face" style="background:' + f[1] + '; transform:' + f[0] + ';"></div>';
        });
        html += '</div>';
    });
    html += '</div>';
    return html;
}
function generateCube3DRound() {
    var n = resolveCube3DBlockCount();
    var shape = generateRandomPolycube(n);
    var targetRotY = pickRandom([0, 90, 180, 270]);
    var timeLimit = resolveCube3DTimeLimit();
    cube3dState = { shape: shape, targetRotY: targetRotY, currentRotY: 0, dragging: false, dragStartX: 0, dragStartRot: 0, checked: false, timeLeft: timeLimit, timeLimit: timeLimit, timerId: null };
    renderCube3DMatch();
    startCube3DTimer();
}
function retryCube3DRound() {
    cube3dState.checked = false;
    cube3dState.currentRotY = 0;
    cube3dState.timeLeft = cube3dState.timeLimit;
    renderCube3DMatch();
    startCube3DTimer();
}
function restartCube3DMatch() { renderCube3DSetup(); }
function nextCube3DRound() { cube3dRound++; generateCube3DRound(); }
function startCube3DTimer() {
    var bar = document.getElementById('cube3dTimerBar');
    if (bar) bar.style.width = '100%';
    cube3dState.timerId = setInterval(function () {
        cube3dState.timeLeft -= 0.1;
        var pct = (cube3dState.timeLeft / cube3dState.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('cube3dTimerBar');
        if (b) b.style.width = pct + '%';
        if (cube3dState.timeLeft <= 0) {
            clearInterval(cube3dState.timerId);
            handleCube3DTimeout();
        }
    }, 100);
    activeTimers.push(cube3dState.timerId);
}
function handleCube3DTimeout() {
    if (cube3dState.checked) return;
    cube3dState.checked = true;
    var msg = document.getElementById('cube3dMsg');
    msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '⏰ 시간이 다 됐어요! 목표 모양과 다시 맞춰보세요.';
    document.getElementById('mainArea').insertAdjacentHTML('beforeend',
        '<div class="options-grid">' +
        '<button class="action-btn" onclick="retryCube3DRound()">다시 풀어보기 🔁</button>' +
        '<button class="action-btn secondary" onclick="restartCube3DMatch()">처음부터 풀기 🔄</button>' +
        '</div>');
}
function renderCube3DMatch() {
    var scale = computeCubeScale(cube3dState.shape, 3);
    cube3dState.scale = scale;
    var html = '<div class="game-title-box">🧊 3D 블록 돌리기</div>';
    html += '<div class="game-sub-desc">아래 목표 모양과 똑같아지도록, 내 블록을 좌우로 드래그해서 돌려보세요!</div>';
    html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="cube3dTimerBar"></div></div>';
    html += '<div class="status-row"><div>' + cube3dRound + '라운드</div><div>정답: ' + cube3dCorrect + ' / ' + (cube3dRound - 1) + '</div></div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800; margin-bottom:0.3rem;">🎯 목표 모양</div>';
    html += '<div class="cube3d-scene">' + buildCube3DHTML(cube3dState.shape, CUBE3D_TILT_X, cube3dState.targetRotY, 'cube3dTarget', scale) + '</div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800; margin-bottom:0.3rem;">🔄 내 블록 (드래그해서 돌리기)</div>';
    html += '<div class="cube3d-scene interactive" onmousedown="startCube3DDrag(event)" ontouchstart="startCube3DDrag(event)">' + buildCube3DHTML(cube3dState.shape, CUBE3D_TILT_X, cube3dState.currentRotY, 'cube3dInteractive', scale) + '</div>';
    html += '<div class="options-grid">';
    html += '<button class="action-btn" onclick="checkCube3DMatch()">확인하기 ✅</button>';
    html += '</div>';
    html += '<div id="cube3dMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function startCube3DDrag(e) {
    if (cube3dState.checked) return;
    if (e && e.preventDefault) e.preventDefault();
    cube3dState.dragging = true;
    var point = (e.touches && e.touches[0]) ? e.touches[0] : e;
    cube3dState.dragStartX = point.clientX;
    cube3dState.dragStartRot = cube3dState.currentRotY;
}
function handleCube3DMove(e) {
    if (!cube3dState.dragging) return;
    var point = (e.touches && e.touches[0]) ? e.touches[0] : e;
    if (typeof point.clientX !== 'number') return;
    var delta = point.clientX - cube3dState.dragStartX;
    cube3dState.currentRotY = cube3dState.dragStartRot + delta * 0.6;
    var g = document.getElementById('cube3dInteractive');
    if (g) g.style.transform = 'rotateX(' + CUBE3D_TILT_X + 'deg) rotateY(' + cube3dState.currentRotY + 'deg) scale(' + (cube3dState.scale || 1) + ')';
}
function stopCube3DDrag() { cube3dState.dragging = false; }
function normalizeAngle(a) { var n = a % 360; if (n < 0) n += 360; return n; }
function snapTo90(a) { return Math.round(normalizeAngle(a) / 90) * 90 % 360; }
function checkCube3DMatch() {
    if (cube3dState.checked) return;
    cube3dState.checked = true;
    clearInterval(cube3dState.timerId);
    var snapped = snapTo90(cube3dState.currentRotY);
    var msg = document.getElementById('cube3dMsg');
    if (snapped === cube3dState.targetRotY) {
        cube3dCorrect++;
        if (typeof reportGameOutcome === 'function') reportGameOutcome('win');
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 정답이에요! 똑같이 돌렸어요.';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextCube3DRound()', 'retryCube3DRound()', 'restartCube3DMatch()'));
    } else {
        if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '아직 달라요! 조금 더 돌려서 맞춰보세요.';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryCube3DRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartCube3DMatch()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('mousemove', function (e) { handleCube3DMove(e); });
    document.addEventListener('touchmove', function (e) { if (cube3dState.dragging) { if (e.preventDefault) e.preventDefault(); } handleCube3DMove(e); }, { passive: false });
    document.addEventListener('mouseup', function () { stopCube3DDrag(); });
    document.addEventListener('touchend', function () { stopCube3DDrag(); });
}

// ===================== 18. 공간지각: 평면도로 입체 찾기 =====================
var PROJECTION_DIRECTIONS = [
    { v: 'top', l: '위쪽에서 아래로' },
    { v: 'front', l: '앞쪽에서' },
    { v: 'back', l: '뒤쪽에서' },
    { v: 'left', l: '왼쪽에서' },
    { v: 'right', l: '오른쪽에서' }
];
var projMatchSettings = { blockCount: 4, timeLimit: 10 };
var projMatchState = {};
var projMatchRound = 1, projMatchCorrect = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('projectionMatch', { easy: { blockCount: 4 }, normal: { blockCount: 5 }, hard: { blockCount: 6 } });
}
function initProjectionMatch() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('projectionMatch', projMatchSettings);
    renderProjectionMatchSetup();
}
function renderProjectionMatchSetup() {
    var counts = [{ v: 4, l: '4개' }, { v: 5, l: '5개' }, { v: 6, l: '6개' }, { v: 'random', l: '무작위' }];
    var times = [{ v: 10, l: '10초' }, { v: 15, l: '15초' }, { v: 20, l: '20초' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">🔦 평면도로 입체 찾기</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">도형 조각 개수</div><div class="setup-btn-group">';
    counts.forEach(function (t) {
        html += '<button class="setup-btn' + (projMatchSettings.blockCount === t.v ? ' active' : '') + '" onclick="setProjMatchBlockCount(' + (typeof t.v === 'string' ? "'" + t.v + "'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (projMatchSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setProjMatchTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startProjMatchSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setProjMatchBlockCount(v) { projMatchSettings.blockCount = v; renderProjectionMatchSetup(); }
function setProjMatchTimeLimit(v) { projMatchSettings.timeLimit = v; renderProjectionMatchSetup(); }
function startProjMatchSession() { projMatchRound = 1; projMatchCorrect = 0; generateProjMatchRound(); }
function resolveProjMatchBlockCount() {
    var bc = projMatchSettings.blockCount;
    if (bc === 'random') return pickRandom([4, 5, 6]);
    return bc;
}
function projectShapePoints(cells, direction) {
    var points = [];
    cells.forEach(function (c) {
        var u, v;
        switch (direction) {
            case 'top': u = c.x; v = c.z; break;
            case 'front': u = c.x; v = c.y; break;
            case 'back': u = -c.x; v = c.y; break;
            case 'left': u = c.z; v = c.y; break;
            case 'right': u = -c.z; v = c.y; break;
        }
        points.push(u + ',' + v);
    });
    var uniq = Array.from(new Set(points));
    var coords = uniq.map(function (s) { var p = s.split(',').map(Number); return { u: p[0], v: p[1] }; });
    var minU = Math.min.apply(null, coords.map(function (p) { return p.u; }));
    var minV = Math.min.apply(null, coords.map(function (p) { return p.v; }));
    var normalized = coords.map(function (p) { return (p.u - minU) + ',' + (p.v - minV); });
    normalized.sort();
    return normalized;
}
function projSignature(points) { return points.join('|'); }
function generateProjMatchRound() {
    var n = resolveProjMatchBlockCount();
    var target = generateRandomPolycube(n);
    var direction = pickRandom(PROJECTION_DIRECTIONS).v;
    var targetPoints = projectShapePoints(target, direction);
    var targetSig = projSignature(targetPoints);

    var decoys = [];
    var attempts = 0;
    while (decoys.length < 2 && attempts < 200) {
        attempts++;
        var cand = generateRandomPolycube(n);
        var candSig = projSignature(projectShapePoints(cand, direction));
        if (candSig !== targetSig) { decoys.push(cand); }
    }
    var safety = 0;
    while (decoys.length < 2 && safety < 20) {
        safety++;
        var extra = generateRandomPolycube(n + decoys.length + 1);
        var extraSig = projSignature(projectShapePoints(extra, direction));
        if (extraSig !== targetSig) decoys.push(extra);
    }

    var options = shuffleArray([target].concat(decoys));
    var correctIndex = options.indexOf(target);
    var dirLabel = PROJECTION_DIRECTIONS.filter(function (d) { return d.v === direction; })[0].l;

    projMatchState = {
        target: target, direction: direction, dirLabel: dirLabel,
        targetPoints: targetPoints, options: options, correctIndex: correctIndex,
        checked: false, timeLeft: projMatchSettings.timeLimit, timeLimit: projMatchSettings.timeLimit, timerId: null
    };
    renderProjMatch();
    if (projMatchSettings.timeLimit > 0) { startProjMatchTimer(); }
}
function retryProjMatchRound() {
    projMatchState.checked = false;
    projMatchState.timeLeft = projMatchState.timeLimit;
    renderProjMatch();
    if (projMatchState.timeLimit > 0) { startProjMatchTimer(); }
}
function restartProjMatch() { renderProjectionMatchSetup(); }
function nextProjMatchRound() { projMatchRound++; generateProjMatchRound(); }
function startProjMatchTimer() {
    var bar = document.getElementById('projMatchTimerBar');
    if (bar) bar.style.width = '100%';
    projMatchState.timerId = setInterval(function () {
        projMatchState.timeLeft -= 0.1;
        var pct = (projMatchState.timeLeft / projMatchState.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('projMatchTimerBar');
        if (b) b.style.width = pct + '%';
        if (projMatchState.timeLeft <= 0) {
            clearInterval(projMatchState.timerId);
            handleProjMatchTimeout();
        }
    }, 100);
    activeTimers.push(projMatchState.timerId);
}
function handleProjMatchTimeout() { choiceTimeout(); }
function projMatchChoiceCfg() {
    return {
        msgId: 'projMatchMsg', selector: '.cube3d-option-box',
        ok: '🎉 정답이에요!',
        bad: '아쉬워요! 초록 테두리가 정답이에요.',
        timeout: '⏰ 시간이 다 됐어요! 초록 테두리가 정답이에요.',
        onPick: function () { if (projMatchState.timerId) clearInterval(projMatchState.timerId); projMatchState.checked = true; },
        onCorrect: function () { projMatchCorrect++; },
        onTimeout: function () { projMatchState.checked = true; },
        next: 'nextProjMatchRound()', retry: 'retryProjMatchRound()', home: 'restartProjMatch()',
        failStyle: 'retryHome'
    };
}
function renderProjectionGrid(points) {
    var maxU = 0, maxV = 0;
    var filled = {};
    points.forEach(function (s) {
        var p = s.split(',').map(Number);
        if (p[0] > maxU) maxU = p[0];
        if (p[1] > maxV) maxV = p[1];
        filled[s] = true;
    });
    var w = maxU + 1, h = maxV + 1;
    var html = '<div class="proj-grid" style="grid-template-columns: repeat(' + w + ', 30px);">';
    for (var row = h - 1; row >= 0; row--) {
        for (var col = 0; col < w; col++) {
            var key = col + ',' + row;
            html += '<div class="proj-cell' + (filled[key] ? ' filled' : '') + '"></div>';
        }
    }
    html += '</div>';
    return html;
}
function renderCompassFrame(innerHtml, activeDirection) {
    var html = '<div class="compass-frame">';
    html += '<div class="compass-corner compass-back' + (activeDirection === 'back' ? ' active' : '') + '"><span class="arrow">↘</span>뒤쪽</div>';
    html += '<div class="compass-corner compass-right' + (activeDirection === 'right' ? ' active' : '') + '"><span class="arrow">↙</span>오른쪽</div>';
    html += '<div class="compass-corner compass-front' + (activeDirection === 'front' ? ' active' : '') + '"><span class="arrow">↖</span>앞쪽</div>';
    html += '<div class="compass-corner compass-left' + (activeDirection === 'left' ? ' active' : '') + '"><span class="arrow">↗</span>왼쪽</div>';
    html += innerHtml;
    html += '</div>';
    return html;
}
function renderProjMatch() {
    var html = '<div class="game-title-box">🔦 평면도로 입체 찾기</div>';
    html += '<div class="game-sub-desc">이 입체 도형을 <b style="color:var(--primary);">' + projMatchState.dirLabel + '</b> 바라본 평면도예요. 어떤 3D 도형인지 보기에서 찾아보세요!</div>';
    if (projMatchState.timeLimit > 0) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="projMatchTimerBar"></div></div>';
    }
    html += '<div class="status-row"><div>' + projMatchRound + '라운드</div><div>정답: ' + projMatchCorrect + ' / ' + (projMatchRound - 1) + '</div></div>';
    var cfg = projMatchChoiceCfg();
    var innerContent = renderProjectionGrid(projMatchState.targetPoints);
    innerContent += '<div class="cube3d-options-row">';
    projMatchState.options.forEach(function (opt, idx) {
        var scale = computeCubeScale(opt);
        innerContent += '<button type="button" class="cube3d-option-box" onclick="choiceSubmit(' + idx + ')">';
        innerContent += '<div class="cube3d-scene" style="width:100px; height:100px;">' + buildCube3DHTML(opt, CUBE3D_TILT_X, 35, 'projOpt' + idx, scale) + '</div>';
        innerContent += '</button>';
    });
    innerContent += '</div>';
    html += renderCompassFrame(innerContent, projMatchState.direction);
    html += '<div id="projMatchMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    choiceBegin(projMatchState.correctIndex, cfg);
}

// ===================== 26. 공간지각: 좌표 보물찾기 =====================
var coordHuntState = {};
var coordHuntRound = 1, coordHuntCorrect = 0;
function initCoordHunt() { coordHuntRound = 1; coordHuntCorrect = 0; generateCoordHuntRound(); }
function generateCoordHuntRound() {
    var size = 5;
    var tx = getRandomInt(1, size), ty = getRandomInt(1, size);
    coordHuntState = { size: size, tx: tx, ty: ty, found: false, wrongCell: null };
    renderCoordHunt();
}
function clickCoordHuntCell(x, y) {
    if (coordHuntState.found) return;
    vibrateShort();
    if (x === coordHuntState.tx && y === coordHuntState.ty) {
        coordHuntState.found = true;
        coordHuntCorrect++;
        renderCoordHunt();
        var msg = document.getElementById('coordHuntMsg');
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 찾았어요!';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextCoordHuntRound()', 'retryCoordHuntRound()', 'restartCoordHunt()'));
    } else {
        coordHuntState.wrongCell = { x: x, y: y };
        renderCoordHunt();
        var t = gameTimeout(function () { coordHuntState.wrongCell = null; renderCoordHunt(); }, 400);
    }
}
function nextCoordHuntRound() { coordHuntRound++; generateCoordHuntRound(); }
function retryCoordHuntRound() { coordHuntState.found = false; coordHuntState.wrongCell = null; renderCoordHunt(); }
function restartCoordHunt() { initCoordHunt(); }
function renderCoordHunt() {
    var html = '<div class="game-title-box">💎 좌표 보물찾기</div>';
    html += '<div class="game-sub-desc">보물은 <b style="color:var(--primary);">(가로 ' + coordHuntState.tx + ', 세로 ' + coordHuntState.ty + ')</b>에 있어요! 그 칸을 찾아 클릭하세요.</div>';
    html += '<div class="status-row"><div>' + coordHuntRound + '라운드</div><div>정답: ' + coordHuntCorrect + ' / ' + (coordHuntRound - 1) + '</div></div>';
    html += '<div class="maze-wrap"><div class="maze-grid" style="grid-template-columns: repeat(' + coordHuntState.size + ', 38px);">';
    for (var y = 1; y <= coordHuntState.size; y++) {
        for (var x = 1; x <= coordHuntState.size; x++) {
            var content = '';
            var style = 'border:1px solid #e2e8f0; cursor:pointer;';
            if (coordHuntState.found && x === coordHuntState.tx && y === coordHuntState.ty) { content = '💎'; style += 'background:#d1fae5;'; }
            if (coordHuntState.wrongCell && coordHuntState.wrongCell.x === x && coordHuntState.wrongCell.y === y) { style += 'background:#fee2e2;'; }
            html += '<button type="button" class="maze-cell" style="' + style + '" ' + (coordHuntState.found ? 'disabled' : '') + ' onclick="clickCoordHuntCell(' + x + ',' + y + ')">' + content + '</button>';
        }
    }
    html += '</div></div>';
    html += '<div id="coordHuntMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 31. 공간지각: 톱니바퀴 회전 방향 맞추기 =====================
var gearState = {};
var gearRound = 1, gearCorrect = 0;
function initGearRotation() { gearRound = 1; gearCorrect = 0; generateGearRound(); }
function resolveGearDirections(n, startDir) {
    var dirs = [];
    for (var i = 0; i < n; i++) {
        dirs.push((i % 2 === 0) ? startDir : (startDir === 'cw' ? 'ccw' : 'cw'));
    }
    return dirs;
}
function generateGearRound() {
    var n = getRandomInt(3, 5);
    var startDir = pickRandom(['cw', 'ccw']);
    var dirs = resolveGearDirections(n, startDir);
    gearState = { n: n, startDir: startDir, dirs: dirs, lastDir: dirs[n - 1], answered: false, correctGuess: false };
    renderGearRotation();
}
function renderGearRotation() {
    var html = '<div class="game-title-box">⚙️ 톱니바퀴 회전 방향 맞추기</div>';
    html += '<div class="game-sub-desc">맞물려 돌아가는 톱니바퀴는 옆으로 갈수록 반대 방향으로 돌아요. 첫 번째 톱니바퀴의 방향을 보고, 마지막 톱니바퀴는 어느 방향일지 맞혀보세요!</div>';
    html += '<div class="status-row"><div>' + gearRound + '라운드</div><div>정답: ' + gearCorrect + ' / ' + (gearRound - 1) + '</div></div>';
    html += '<div class="row-display" style="font-size:2.2rem; flex-wrap:wrap;">';
    for (var i = 0; i < gearState.n; i++) {
        var isFirst = i === 0;
        var isLast = i === gearState.n - 1;
        var label = '&nbsp;';
        var gearSpanClass = '';
        var boxStyle = 'width:auto; min-width:60px; height:82px; flex-direction:column; gap:0.5rem; padding:0.6rem;';
        if (gearState.answered) {
            gearSpanClass = gearState.dirs[i] === 'cw' ? 'gear-spin-cw' : 'gear-spin-ccw';
            label = gearState.dirs[i] === 'cw' ? '↻' : '↺';
            if (isLast) {
                boxStyle += ' background:#fef9c3; border:3px solid #eab308; border-radius:0.6rem; animation: gearHighlightPulse 1.2s infinite;';
            }
        } else {
            if (isFirst) label = gearState.startDir === 'cw' ? '↻' : '↺';
            else if (isLast) label = '❓';
        }
        html += '<div class="row-box" style="' + boxStyle + '"><span class="' + gearSpanClass + '">⚙️</span><span style="font-size:1rem; font-weight:800; color:var(--primary);">' + label + '</span></div>';
    }
    html += '</div>';
    html += '<div class="options-grid">';
    var cwCls = 'opt-btn text-opt', ccwCls = 'opt-btn text-opt';
    if (gearState.answered) {
        if (gearState.lastDir === 'cw') { cwCls += ' correct'; if (!gearState.correctGuess) ccwCls += ' wrong'; }
        else { ccwCls += ' correct'; if (!gearState.correctGuess) cwCls += ' wrong'; }
    }
    html += '<button class="' + cwCls + '" ' + (gearState.answered ? 'disabled' : '') + ' onclick="checkGearRotation(\'cw\')">시계 방향 (↻)</button>';
    html += '<button class="' + ccwCls + '" ' + (gearState.answered ? 'disabled' : '') + ' onclick="checkGearRotation(\'ccw\')">반시계 방향 (↺)</button>';
    html += '</div>';
    html += '<div id="gearMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (gearState.answered) {
        var msg = document.getElementById('gearMsg');
        var correctLabel = gearState.lastDir === 'cw' ? '시계 방향 (↻)' : '반시계 방향 (↺)';
        if (gearState.correctGuess) {
            msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 정답이에요! 톱니바퀴가 도는 모습을 확인해보세요.';
        } else {
            msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '아쉬워요! 정답은 ' + (gearState.lastDir === 'cw' ? '시계 방향' : '반시계 방향') + '이에요!';
        }
        if (gearState.correctGuess) {
            document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextGearRound()', 'retryGearRound()', 'restartGearRotation()'));
        } else {
            document.getElementById('mainArea').insertAdjacentHTML('beforeend',
                '<div class="options-grid">' +
                '<button class="action-btn" onclick="retryGearRound()">다시 풀어보기 🔁</button>' +
                '<button class="action-btn secondary" onclick="restartGearRotation()">처음부터 풀기 🔄</button>' +
                '</div>');
        }
    }
}
function checkGearRotation(guess) {
    if (gearState.answered) return;
    gearState.answered = true;
    gearState.correctGuess = (guess === gearState.lastDir);
    if (gearState.correctGuess) gearCorrect++;
    vibrateShort();
    renderGearRotation();
}
function nextGearRound() { gearRound++; generateGearRound(); }
function retryGearRound() { gearState.answered = false; gearState.correctGuess = false; renderGearRotation(); }
function restartGearRotation() { initGearRotation(); }

// ===================== 33. 공간지각: 빛과 거울 미로 =====================
var MIRROR_REFLECT = {
    '/': { right: 'up', up: 'right', left: 'down', down: 'left' },
    '\\': { right: 'down', down: 'right', left: 'up', up: 'left' }
};
var LIGHT_DIR_VEC = { right: { dx: 1, dy: 0 }, left: { dx: -1, dy: 0 }, up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 } };
var lightMazeSettings = { size: 4, timeLimit: 10 };
var LIGHT_MAX_MIRRORS = { 4: 4, 5: 5, 6: 6 };
var lightMazeState = {};
var lightMazeRound = 1, lightMazeSolved = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('lightMirrorMaze', { easy: { size: 4 }, normal: { size: 5 }, hard: { size: 6 } });
}
function initLightMirrorMaze() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('lightMirrorMaze', lightMazeSettings);
    renderLightMazeSetup();
}
function renderLightMazeSetup() {
    var sizes = [{ v: 4, l: '쉬움 (4×4)' }, { v: 5, l: '보통 (5×5)' }, { v: 6, l: '어려움 (6×6)' }, { v: 'random', l: '무작위' }];
    var times = [{ v: 10, l: '10초' }, { v: 15, l: '15초' }, { v: 20, l: '20초' }, { v: 'random', l: '무작위' }];
    var html = '<div class="game-title-box">🔆 빛과 거울 미로</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">격자 크기</div><div class="setup-btn-group">';
    sizes.forEach(function (s) {
        html += '<button class="setup-btn' + (lightMazeSettings.size === s.v ? ' active' : '') + '" onclick="setLightMazeSize(' + (s.v === 'random' ? "'random'" : s.v) + ')">' + s.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (lightMazeSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setLightMazeTimeLimit(' + (t.v === 'random' ? "'random'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startLightMazeSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setLightMazeSize(v) { lightMazeSettings.size = v; renderLightMazeSetup(); }
function setLightMazeTimeLimit(v) { lightMazeSettings.timeLimit = v; renderLightMazeSetup(); }
function startLightMazeSession() { lightMazeRound = 1; lightMazeSolved = 0; generateLightMazeRound(); }
function generateMultiMirrorLightPuzzle(size, maxMirrors) {
    var vec = LIGHT_DIR_VEC;
    for (var attempt = 0; attempt < 30; attempt++) {
        var numMirrors = getRandomInt(1, maxMirrors);
        var sourceY = getRandomInt(0, size - 1);
        var cx = 0, cy = sourceY;
        var visited = {}; visited['0,' + sourceY] = true;
        var dir = 'right';
        var isHorizontal = true;
        var ok = true;
        for (var m = 0; m < numMirrors; m++) {
            var maxStep = Math.max(1, size - 1);
            var steps = getRandomInt(1, maxStep);
            var moved = 0;
            for (var s = 0; s < steps; s++) {
                var nx = cx + vec[dir].dx, ny = cy + vec[dir].dy;
                var key = nx + ',' + ny;
                if (nx < 0 || nx >= size || ny < 0 || ny >= size || visited[key]) break;
                cx = nx; cy = ny; visited[key] = true; moved++;
            }
            if (moved === 0) { ok = false; break; }
            if (isHorizontal) { dir = pickRandom(['up', 'down']); } else { dir = pickRandom(['left', 'right']); }
            isHorizontal = !isHorizontal;
        }
        if (!ok) continue;
        var finalSteps = getRandomInt(1, Math.max(1, size - 1));
        var moved2 = 0;
        for (var s2 = 0; s2 < finalSteps; s2++) {
            var nx2 = cx + vec[dir].dx, ny2 = cy + vec[dir].dy;
            var key2 = nx2 + ',' + ny2;
            if (nx2 < 0 || nx2 >= size || ny2 < 0 || ny2 >= size || visited[key2]) break;
            cx = nx2; cy = ny2; visited[key2] = true; moved2++;
        }
        if (moved2 === 0) continue;
        if (cx === 0 && cy === sourceY) continue;
        return { sourceY: sourceY, target: { x: cx, y: cy }, requiredMirrors: numMirrors };
    }
    var sourceYFallback = getRandomInt(0, size - 1);
    var targetFallback;
    var attempts2 = 0;
    do {
        targetFallback = { x: getRandomInt(1, size - 1), y: getRandomInt(0, size - 1) };
        attempts2++;
    } while (targetFallback.y === sourceYFallback && attempts2 < 30);
    return { sourceY: sourceYFallback, target: targetFallback, requiredMirrors: 1 };
}
function generateLightMazeRound() {
    var size = lightMazeSettings.size === 'random' ? pickRandom([4, 5, 6]) : lightMazeSettings.size;
    var timeLimit = lightMazeSettings.timeLimit === 'random' ? pickRandom([10, 15, 20]) : lightMazeSettings.timeLimit;
    var maxMirrors = LIGHT_MAX_MIRRORS[size] || 4;
    var puzzle = generateMultiMirrorLightPuzzle(size, maxMirrors);
    var source = { x: 0, y: puzzle.sourceY, dir: 'right' };
    var target = puzzle.target;
    var grid = [];
    for (var y = 0; y < size; y++) { var row = []; for (var x = 0; x < size; x++) { row.push(null); } grid.push(row); }
    lightMazeState = {
        size: size, source: source, target: target, grid: grid, path: [], fullPath: [], fired: false, success: false, animating: false,
        requiredMirrors: puzzle.requiredMirrors,
        timeLimit: timeLimit, timeLeft: timeLimit, timerId: null, timedOut: false
    };
    renderLightMirrorMaze();
    if (timeLimit > 0) { startLightMazeTimer(); }
}
function startLightMazeTimer() {
    var bar = document.getElementById('lightMazeTimerBar');
    if (bar) bar.style.width = (lightMazeState.timeLeft / lightMazeState.timeLimit * 100) + '%';
    lightMazeState.timerId = setInterval(function () {
        lightMazeState.timeLeft -= 0.1;
        var pct = (lightMazeState.timeLeft / lightMazeState.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('lightMazeTimerBar');
        if (b) b.style.width = pct + '%';
        if (lightMazeState.timeLeft <= 0) {
            clearInterval(lightMazeState.timerId);
            handleLightMazeTimeout();
        }
    }, 100);
    activeTimers.push(lightMazeState.timerId);
}
function handleLightMazeTimeout() {
    if (lightMazeState.fired || lightMazeState.timedOut) return;
    lightMazeState.timedOut = true;
    renderLightMirrorMaze();
}
function restartLightMirrorMaze() { renderLightMazeSetup(); }
function nextLightMazeRound() { lightMazeRound++; generateLightMazeRound(); }
function retryLightMazeRound() {
    var size = lightMazeState.size;
    var grid = [];
    for (var y = 0; y < size; y++) { var row = []; for (var x = 0; x < size; x++) { row.push(null); } grid.push(row); }
    lightMazeState.grid = grid;
    lightMazeState.path = [];
    lightMazeState.fullPath = [];
    lightMazeState.fired = false;
    lightMazeState.success = false;
    lightMazeState.timedOut = false;
    lightMazeState.timeLeft = lightMazeState.timeLimit;
    renderLightMirrorMaze();
    if (lightMazeState.timeLimit > 0) { startLightMazeTimer(); }
}
function lightMazeCellClick(x, y) {
    if (lightMazeState.animating || lightMazeState.timedOut) return;
    if (x === lightMazeState.source.x && y === lightMazeState.source.y) return;
    if (x === lightMazeState.target.x && y === lightMazeState.target.y) return;
    vibrateShort();
    var cur = lightMazeState.grid[y][x];
    var next = (cur === null) ? '/' : (cur === '/' ? '\\' : null);
    lightMazeState.grid[y][x] = next;
    lightMazeState.fired = false;
    lightMazeState.path = [];
    renderLightMirrorMaze();
}
function traceLaser(state) {
    var path = [];
    var x = state.source.x, y = state.source.y, dir = state.source.dir;
    path.push({ x: x, y: y });
    var maxSteps = state.size * state.size * 2;
    var hit = false;
    for (var step = 0; step < maxSteps; step++) {
        var v = LIGHT_DIR_VEC[dir];
        var nx = x + v.dx, ny = y + v.dy;
        if (nx < 0 || nx >= state.size || ny < 0 || ny >= state.size) break;
        x = nx; y = ny;
        path.push({ x: x, y: y });
        if (x === state.target.x && y === state.target.y) { hit = true; break; }
        var mirror = state.grid[y][x];
        if (mirror === '/' || mirror === '\\') { dir = MIRROR_REFLECT[mirror][dir]; }
    }
    return { path: path, hit: hit };
}
function fireLaser() {
    if (lightMazeState.animating || lightMazeState.timedOut) return;
    var result = traceLaser(lightMazeState);
    lightMazeState.animating = true;
    lightMazeState.fired = false;
    lightMazeState.success = false;
    lightMazeState.fullPath = result.path;
    lightMazeState.hit = result.hit;
    lightMazeState.path = [];
    stepLaserAnim(0);
}
function stepLaserAnim(i) {
    if (i >= lightMazeState.fullPath.length) {
        lightMazeState.animating = false;
        lightMazeState.fired = true;
        lightMazeState.success = lightMazeState.hit;
        if (lightMazeState.success) {
            lightMazeSolved++;
            if (lightMazeState.timerId) { clearInterval(lightMazeState.timerId); }
        }
        renderLightMirrorMaze();
        return;
    }
    lightMazeState.path.push(lightMazeState.fullPath[i]);
    renderLightMirrorMaze();
    var t = gameTimeout(function () { stepLaserAnim(i + 1); }, 150);
}
function renderLightMirrorMaze() {
    var html = '<div class="game-title-box">🔆 빛과 거울 미로</div>';
    html += '<div style="background:#fff; border:2px solid #d1d5db; border-radius:1rem; padding:0.8rem 1rem; margin-bottom:0.6rem; font-weight:700; text-align:center;">💡 ' + lightMazeState.requiredMirrors + '개의 거울을 설치해서 레이저를 ⭐ 별에 닿게 만들어보세요!</div>';
    html += '<div class="game-sub-desc">빈 칸을 누르면 파란 막대 거울이 놓여요. 다시 누르면 반대 방향으로 바뀌어요.</div>';
    if (lightMazeState.timeLimit > 0 && !lightMazeState.fired && !lightMazeState.timedOut) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="lightMazeTimerBar"></div></div>';
    }
    html += '<div class="status-row"><div>' + lightMazeRound + '라운드</div><div>성공: ' + lightMazeSolved + '개</div></div>';
    html += '<div class="maze-wrap"><div class="maze-grid" style="grid-template-columns: repeat(' + lightMazeState.size + ', 40px);">';
    for (var y = 0; y < lightMazeState.size; y++) {
        for (var x = 0; x < lightMazeState.size; x++) {
            var isSource = (x === lightMazeState.source.x && y === lightMazeState.source.y);
            var isTarget = (x === lightMazeState.target.x && y === lightMazeState.target.y);
            var mirror = lightMazeState.grid[y][x];
            var onPath = lightMazeState.path.some(function (p) { return p.x === x && p.y === y; });
            var content = '';
            var cellCls = 'maze-cell';
            if (isSource) {
                var arrowMap = { right: '→', left: '←', up: '↑', down: '↓' };
                content = '🔦<span style="font-size:0.9rem; font-weight:800; color:#1d4ed8;">' + arrowMap[lightMazeState.source.dir] + '</span>';
                cellCls += ' light-source-blink';
            }
            else if (isTarget) {
                var starCls = (lightMazeState.fired && lightMazeState.success) ? ' class="light-target-success"' : '';
                content = '<span' + starCls + '>⭐</span>';
            }
            else if (mirror === '/') content = '<div style="width:75%; height:6px; background:#2563eb; border-radius:3px; transform:rotate(-45deg);"></div>';
            else if (mirror === '\\') content = '<div style="width:75%; height:6px; background:#2563eb; border-radius:3px; transform:rotate(45deg);"></div>';
            var style = 'border:1px solid #e2e8f0; font-size:1.3rem;';
            if (onPath && !isSource) { style += 'background:' + ((lightMazeState.fired && lightMazeState.success) ? '#fef9c3' : '#e0f2fe') + ';'; }
            var clickable = !isSource && !isTarget && !lightMazeState.animating && !lightMazeState.timedOut;
            var onclickAttr = clickable ? ' onclick="lightMazeCellClick(' + x + ',' + y + ')"' : '';
            if (clickable) style += 'cursor:pointer;';
            html += '<div class="' + cellCls + '" style="' + style + '"' + onclickAttr + '>' + content + '</div>';
        }
    }
    html += '</div></div>';
    html += '<div class="options-grid">';
    html += '<button class="action-btn" ' + (lightMazeState.animating || lightMazeState.timedOut ? 'disabled' : '') + ' onclick="fireLaser()">🔫 레이저 발사!</button>';
    html += '</div>';
    html += '<div id="lightMazeMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (lightMazeState.timeLimit > 0 && !lightMazeState.fired && !lightMazeState.timedOut) {
        var barEl = document.getElementById('lightMazeTimerBar');
        if (barEl) barEl.style.width = (lightMazeState.timeLeft / lightMazeState.timeLimit * 100) + '%';
    }
    if (lightMazeState.timedOut) {
        var tmsg = document.getElementById('lightMazeMsg');
        tmsg.className = 'msg-box bad'; tmsg.style.display = 'block'; tmsg.innerText = '⏰ 시간이 다 됐어요!';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryLightMazeRound()">다시 시도 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartLightMirrorMaze()">처음부터 풀기 🔄</button>' +
            '</div>');
    } else if (lightMazeState.fired) {
        var msg = document.getElementById('lightMazeMsg');
        if (lightMazeState.success) {
            msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 별에 명중했어요! 빛(레이저)은 거울에 닿으면 90도 반사되는 성질을 잘 이용했어요.';
            document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextLightMazeRound()', 'retryLightMazeRound()', 'restartLightMirrorMaze()'));
        } else {
            msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '아쉬워요! 빛(레이저)은 거울에 닿으면 90도 반사돼요. 거울 위치를 바꿔서 다시 시도해보세요!';
            document.getElementById('mainArea').insertAdjacentHTML('beforeend',
                '<div class="options-grid">' +
                '<button class="action-btn" onclick="retryLightMazeRound()">다시 시도 🔁</button>' +
                '<button class="action-btn secondary" onclick="restartLightMirrorMaze()">처음부터 풀기 🔄</button>' +
                '</div>');
        }
    }
}

// ===================== 34. 공간지각: 접힌 종이 구멍 뚫기 =====================
var PAPER_N = 8;
var PAPER_FOLD_COUNT_MAP = { low: 1, mid: 2, high: 3 };
var paperSettings = { level: 'low' };
var paperState = {};
var paperRound = 1, paperCorrect = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('paperFold', { easy: { level: 'low' }, normal: { level: 'mid' }, hard: { level: 'high' } });
}
function initPaperFold() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('paperFold', paperSettings);
    renderPaperFoldSetup();
}
function renderPaperFoldSetup() {
    var levels = [
        { v: 'low', l: '쉬움 (1번 접기)' },
        { v: 'mid', l: '보통 (2번 접기)' },
        { v: 'high', l: '어려움 (3번 접기)' }
    ];
    var html = '<div class="game-title-box">🧩 접힌 종이 구멍 뚫기</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요! 접는 횟수가 많을수록 어려워져요.</div>';
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    levels.forEach(function (t) {
        html += '<button class="setup-btn' + (paperSettings.level === t.v ? ' active' : '') + '" onclick="setPaperFoldLevel(\'' + t.v + '\')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startPaperFoldSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setPaperFoldLevel(v) { paperSettings.level = v; renderPaperFoldSetup(); }
function startPaperFoldSession() { paperRound = 1; paperCorrect = 0; generatePaperFoldRound(); }
function buildInitialFoldMap(n) {
    var map = [];
    for (var x = 0; x < n; x++) {
        var col = [];
        for (var y = 0; y < n; y++) { col.push([{ x: x, y: y }]); }
        map.push(col);
    }
    return map;
}
function applyPaperFold(map, axis) {
    var w = map.length, h = map[0].length;
    if (axis === 'v') {
        var newW = w / 2;
        var newMap = [];
        for (var x = 0; x < newW; x++) {
            var col = [];
            for (var y = 0; y < h; y++) { col.push(map[x][y].concat(map[w - 1 - x][y])); }
            newMap.push(col);
        }
        return newMap;
    } else {
        var newH = h / 2;
        var newMap2 = [];
        for (var x2 = 0; x2 < w; x2++) {
            var col2 = [];
            for (var y2 = 0; y2 < newH; y2++) { col2.push(map[x2][y2].concat(map[x2][h - 1 - y2])); }
            newMap2.push(col2);
        }
        return newMap2;
    }
}
function holeSetSignature(holes) {
    return holes.map(function (h) { return h.x + ',' + h.y; }).sort().join('|');
}
function generatePaperFoldRound() {
    var foldCount = PAPER_FOLD_COUNT_MAP[paperSettings.level];
    var map = buildInitialFoldMap(PAPER_N);
    var folds = [];
    var dims = [{ w: PAPER_N, h: PAPER_N }];
    var w = PAPER_N, h = PAPER_N;
    for (var i = 0; i < foldCount; i++) {
        var options = [];
        if (w >= 2) options.push('v');
        if (h >= 2) options.push('h');
        var axis = pickRandom(options);
        map = applyPaperFold(map, axis);
        folds.push(axis);
        if (axis === 'v') w = w / 2; else h = h / 2;
        dims.push({ w: w, h: h });
    }
    var px = getRandomInt(0, w - 1), py = getRandomInt(0, h - 1);
    var correctHoles = map[px][py];
    var correctSig = holeSetSignature(correctHoles);

    var allCells = [];
    for (var x = 0; x < w; x++) { for (var y = 0; y < h; y++) { allCells.push({ x: x, y: y }); } }
    var decoyHoleSets = [];
    var attempts = 0;
    while (decoyHoleSets.length < 3 && attempts < 100) {
        attempts++;
        var cand = pickRandom(allCells);
        var candHoles = map[cand.x][cand.y];
        var sig = holeSetSignature(candHoles);
        if (sig !== correctSig && !decoyHoleSets.some(function (d) { return holeSetSignature(d) === sig; })) {
            decoyHoleSets.push(candHoles);
        }
    }
    while (decoyHoleSets.length < 3) {
        var fake = [];
        var used = {};
        while (fake.length < correctHoles.length) {
            var rx = getRandomInt(0, PAPER_N - 1), ry = getRandomInt(0, PAPER_N - 1);
            var key = rx + ',' + ry;
            if (!used[key]) { used[key] = true; fake.push({ x: rx, y: ry }); }
        }
        var fsig = holeSetSignature(fake);
        if (fsig !== correctSig && !decoyHoleSets.some(function (d) { return holeSetSignature(d) === fsig; })) decoyHoleSets.push(fake);
    }
    var optionSets = shuffleArray([correctHoles].concat(decoyHoleSets));
    var correctIndex = optionSets.indexOf(correctHoles);

    var stagePositions = [];
    stagePositions[foldCount] = [{ x: px, y: py }];
    for (var k = foldCount; k > 0; k--) {
        var axisK = folds[k - 1];
        var prevDims = dims[k - 1];
        var curPositions = stagePositions[k];
        var prevPositions = [];
        curPositions.forEach(function (p) {
            prevPositions.push({ x: p.x, y: p.y });
            if (axisK === 'v') { prevPositions.push({ x: prevDims.w - 1 - p.x, y: p.y }); }
            else { prevPositions.push({ x: p.x, y: prevDims.h - 1 - p.y }); }
        });
        stagePositions[k - 1] = prevPositions;
    }

    paperState = { n: PAPER_N, folds: folds, dims: dims, stagePositions: stagePositions, foldedW: w, foldedH: h, punch: { x: px, y: py }, options: optionSets, correctIndex: correctIndex, answered: false };
    playPaperFoldAnim();
}
var PAPER_CELL_PX = 22;
var PAPER_GRID_STYLE = 'background-color:#e3a857; background-image: linear-gradient(to right, rgba(0,0,0,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.18) 1px, transparent 1px); background-size: ' + 22 + 'px ' + 22 + 'px;';
var PAPER_FOLD_TRANSITION_MS = 1350;
var PAPER_FOLD_PRE_DELAY_MS = 750;
var PAPER_FOLD_POST_WAIT_MS = 1425;
var PAPER_UNFOLD_PRE_DELAY_MS = 450;
var PAPER_UNFOLD_POST_WAIT_MS = 1425;
function renderPaperPunchMarks(positions, animClass) {
    if (!positions || positions.length === 0) return '';
    var html = '';
    positions.forEach(function (p) {
        html += '<div class="' + (animClass || '') + '" style="position:absolute; left:' + (p.x * PAPER_CELL_PX) + 'px; top:' + (p.y * PAPER_CELL_PX) + 'px; width:' + PAPER_CELL_PX + 'px; height:' + PAPER_CELL_PX + 'px; display:flex; align-items:center; justify-content:center; z-index:3; pointer-events:none;"><div style="width:70%; height:70%; background:#dc2626; border:2px solid #7f1d1d; border-radius:50%; box-shadow:0 0 4px rgba(220,38,38,0.6);"></div></div>';
    });
    return html;
}
// 종이가 어느 방향으로 접히는지(reverse=false)/펴지는지(reverse=true)를 오리가미 도안처럼
// 둥글게 휘어진 화살표(직선이 아니라 반원 모양 곡선)로 보여줌. marker-end가 곡선의 접선 방향으로
// 화살촉을 자동 회전시켜 주기 때문에 "휘어서 넘어가는" 느낌이 자연스럽게 남.
function renderFoldDirectionArrow(axis, fullWpx, fullHpx, reverse) {
    var color = '#2563eb';
    var uid = axis + (reverse ? 'R' : 'F');
    var markerId = 'foldArrowHead_' + uid;
    // 끝이 살짝 오목한(제비꼬리) 부드러운 화살촉
    var defs = '<defs><marker id="' + markerId + '" viewBox="0 0 12 12" refX="8.5" refY="6" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse">' +
        '<path d="M1,1 L11,6 L1,11 L3.6,6 Z" fill="' + color + '" /></marker></defs>';
    // stroke-dasharray "1 9" + 둥근 캡 => 점선(점 흐름), CSS 애니메이션(.fold-arrow-dash)이 점을 진행 방향으로 흐르게 함
    var pathAttrs = 'fill="none" stroke="' + color + '" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="1 9" class="fold-arrow-dash" marker-end="url(#' + markerId + ')"';
    if (axis === 'v') {
        // 가로로 접힐 때(좌우로 넘어감): 라벨을 가리지 않도록 화살표를 종이 "아래쪽"에 둔다
        var svgH = 40;
        var rightX = fullWpx * 0.80, leftX = fullWpx * 0.20;
        var x1 = reverse ? leftX : rightX, x2 = reverse ? rightX : leftX;
        var d = 'M ' + x1 + ' 6 Q ' + ((x1 + x2) / 2) + ' 34 ' + x2 + ' 6';
        return '<svg width="' + fullWpx + '" height="' + svgH + '" viewBox="0 0 ' + fullWpx + ' ' + svgH + '" style="position:absolute; left:0; top:' + (fullHpx + 10) + 'px; overflow:visible; pointer-events:none;">' +
            defs + '<path d="' + d + '" ' + pathAttrs + ' /></svg>';
    }
    var svgW = 40;
    var botY = fullHpx * 0.80, topY = fullHpx * 0.20;
    var y1 = reverse ? topY : botY, y2 = reverse ? botY : topY;
    var d2 = 'M 6 ' + y1 + ' Q 34 ' + ((y1 + y2) / 2) + ' 6 ' + y2;
    return '<svg width="' + svgW + '" height="' + fullHpx + '" viewBox="0 0 ' + svgW + ' ' + fullHpx + '" style="position:absolute; left:' + (fullWpx + 10) + 'px; top:0; overflow:visible; pointer-events:none;">' +
        defs + '<path d="' + d2 + '" ' + pathAttrs + ' /></svg>';
}
function renderPaperFoldFlapStage(curW, curH, axis, flapId, flapTransform, positions, punchAnimClass, arrowReverse) {
    var fullWpx = curW * PAPER_CELL_PX, fullHpx = curH * PAPER_CELL_PX;
    var anchorPx = PAPER_N * PAPER_CELL_PX;
    var html = '<div style="position:relative; width:' + anchorPx + 'px; height:' + anchorPx + 'px; margin:1.6rem auto 1rem auto;">';
    html += '<div style="position:absolute; left:0; top:0; width:' + fullWpx + 'px; height:' + fullHpx + 'px; perspective:900px;">';
    var punchOverlay = renderPaperPunchMarks(positions, punchAnimClass);
    if (axis === 'v') {
        html += '<div style="position:absolute; left:0; top:0; width:' + (fullWpx / 2) + 'px; height:' + fullHpx + 'px; ' + PAPER_GRID_STYLE + ' border:2px solid #c18a3d; border-radius:0.3rem;">' + punchOverlay + '</div>';
        html += '<div id="' + flapId + '" style="position:absolute; left:' + (fullWpx / 2) + 'px; top:0; width:' + (fullWpx / 2) + 'px; height:' + fullHpx + 'px; ' + PAPER_GRID_STYLE + ' border:2px solid #c18a3d; border-radius:0.3rem; transform-origin: left center; transform: ' + flapTransform + '; transition: transform ' + (PAPER_FOLD_TRANSITION_MS / 1000) + 's ease; backface-visibility:hidden;"></div>';
    } else {
        html += '<div style="position:absolute; left:0; top:0; width:' + fullWpx + 'px; height:' + (fullHpx / 2) + 'px; ' + PAPER_GRID_STYLE + ' border:2px solid #c18a3d; border-radius:0.3rem;">' + punchOverlay + '</div>';
        html += '<div id="' + flapId + '" style="position:absolute; left:0; top:' + (fullHpx / 2) + 'px; width:' + fullWpx + 'px; height:' + (fullHpx / 2) + 'px; ' + PAPER_GRID_STYLE + ' border:2px solid #c18a3d; border-radius:0.3rem; transform-origin: center top; transform: ' + flapTransform + '; transition: transform ' + (PAPER_FOLD_TRANSITION_MS / 1000) + 's ease; backface-visibility:hidden;"></div>';
    }
    if (arrowReverse !== null && arrowReverse !== undefined) { html += renderFoldDirectionArrow(axis, fullWpx, fullHpx, arrowReverse); }
    html += '</div></div>';
    return html;
}
function renderPaperFlatStage(curW, curH, positions, punchAnimClass) {
    var wpx = curW * PAPER_CELL_PX, hpx = curH * PAPER_CELL_PX;
    var anchorPx = PAPER_N * PAPER_CELL_PX;
    var html = '<div style="position:relative; width:' + anchorPx + 'px; height:' + anchorPx + 'px; margin:0.5rem auto 1rem auto;">';
    html += '<div style="position:absolute; left:0; top:0; width:' + wpx + 'px; height:' + hpx + 'px; ' + PAPER_GRID_STYLE + ' border:2px solid #c18a3d; border-radius:0.3rem;">';
    html += renderPaperPunchMarks(positions, punchAnimClass);
    html += '</div></div>';
    return html;
}
function playPaperFoldAnim() {
    var curW = PAPER_N, curH = PAPER_N;
    var i = 0;
    function step() {
        if (i >= paperState.folds.length) {
            var noPunchHtml = '<div class="game-title-box">🧩 접힌 종이 구멍 뚫기</div>';
            noPunchHtml += '<div class="status-row"><div>' + paperRound + '라운드</div><div>정답: ' + paperCorrect + ' / ' + (paperRound - 1) + '</div></div>';
            noPunchHtml += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">다 접었어요! 이제 펀치로 구멍을 뚫어요...</div>';
            noPunchHtml += renderPaperFlatStage(curW, curH, null);
            document.getElementById('mainArea').innerHTML = noPunchHtml;
            var tPunch = gameTimeout(function () {
                var punchHtml = '<div class="game-title-box">🧩 접힌 종이 구멍 뚫기</div>';
                punchHtml += '<div class="status-row"><div>' + paperRound + '라운드</div><div>정답: ' + paperCorrect + ' / ' + (paperRound - 1) + '</div></div>';
                punchHtml += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">🔴 표시된 위치에 펀치로 구멍을 뚫었어요!</div>';
                punchHtml += renderPaperFlatStage(curW, curH, [paperState.punch], 'paper-punch-pop');
                document.getElementById('mainArea').innerHTML = punchHtml;
                var tDone = gameTimeout(function () { renderPaperFold(); }, 2100);
            }, 900);
            return;
        }
        var axis = paperState.folds[i];
        var html = '<div class="game-title-box">🧩 접힌 종이 구멍 뚫기</div>';
        html += '<div class="game-sub-desc">종이가 접히는 모습을 잘 살펴보세요!</div>';
        html += '<div class="status-row"><div>' + paperRound + '라운드</div><div>정답: ' + paperCorrect + ' / ' + (paperRound - 1) + '</div></div>';
        html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">' + (i + 1) + ') ' + (axis === 'v' ? '왼쪽 ↔ 오른쪽으로 반 접기' : '위 ↔ 아래로 반 접기') + '</div>';
        html += renderPaperFoldFlapStage(curW, curH, axis, 'paperFoldFlap', axis === 'v' ? 'rotateY(0deg)' : 'rotateX(0deg)', null, null, false);
        document.getElementById('mainArea').innerHTML = html;
        var t1 = gameTimeout(function () {
            var flap = document.getElementById('paperFoldFlap');
            if (flap) { flap.style.transform = axis === 'v' ? 'rotateY(-180deg)' : 'rotateX(180deg)'; }
            var t2 = gameTimeout(function () {
                if (axis === 'v') { curW = curW / 2; } else { curH = curH / 2; }
                i++;
                step();
            }, PAPER_FOLD_POST_WAIT_MS);
        }, PAPER_FOLD_PRE_DELAY_MS);
    }
    step();
}
function playPaperUnfoldAnim(wasCorrect) {
    var curW = paperState.foldedW, curH = paperState.foldedH;
    var reverseFolds = paperState.folds.slice().reverse();
    var i = 0;
    function step() {
        if (i >= reverseFolds.length) {
            var tDone = gameTimeout(function () { renderPaperFoldResult(wasCorrect); }, 750);
            return;
        }
        var axis = reverseFolds[i];
        var nextW = axis === 'v' ? curW * 2 : curW;
        var nextH = axis === 'h' ? curH * 2 : curH;
        var stageK = paperState.folds.length - i;
        var html = '<div class="game-title-box">🧩 접힌 종이 구멍 뚫기</div>';
        html += '<div class="game-sub-desc">종이를 다시 펼치고 있어요...</div>';
        html += renderPaperFoldFlapStage(nextW, nextH, axis, 'paperUnfoldFlap', axis === 'v' ? 'rotateY(-180deg)' : 'rotateX(180deg)', paperState.stagePositions[stageK], null, true);
        document.getElementById('mainArea').innerHTML = html;
        var t1 = gameTimeout(function () {
            var flap = document.getElementById('paperUnfoldFlap');
            if (flap) { flap.style.transform = axis === 'v' ? 'rotateY(0deg)' : 'rotateX(0deg)'; }
            var t2 = gameTimeout(function () {
                curW = nextW; curH = nextH;
                i++;
                step();
            }, PAPER_UNFOLD_POST_WAIT_MS);
        }, PAPER_UNFOLD_PRE_DELAY_MS);
    }
    step();
}
function renderPaperFoldResult(wasCorrect) {
    var html = '<div class="game-title-box">🧩 접힌 종이 구멍 뚫기</div>';
    html += '<div class="status-row"><div>' + paperRound + '라운드</div><div>정답: ' + paperCorrect + ' / ' + (paperRound - 1) + '</div></div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">짜잔! 완전히 펼친 모양이에요:</div>';
    html += '<div style="display:flex; justify-content:center; margin-bottom:1rem;">' + renderPaperMiniGrid(paperState.options[paperState.correctIndex], paperState.n, 20) + '</div>';
    html += '<div class="' + (wasCorrect ? 'msg-box' : 'msg-box bad') + '" style="display:block;">' + (wasCorrect ? '🎉 정답이었어요!' : '아쉬워요! 이 모양이 정답이었어요.') + '</div>';
    if (wasCorrect) {
        html += buildStandardResultButtons('generatePaperFoldRound()', 'retryPaperFoldSameRound()', 'renderPaperFoldSetup()');
    } else {
        html += '<div class="options-grid" style="grid-template-columns: 1fr 1fr 1fr; gap:0.4rem;">';
        html += '<button class="action-btn" style="font-size:0.82rem; padding:0.6rem 0.3rem;" onclick="generatePaperFoldRound()">다음 문제 ▶</button>';
        html += '<button class="action-btn secondary" style="font-size:0.82rem; padding:0.6rem 0.3rem;" onclick="retryPaperFoldSameRound()">다시 하기 🔁</button>';
        html += '<button class="action-btn secondary" style="font-size:0.82rem; padding:0.6rem 0.3rem;" onclick="renderPaperFoldSetup()">처음부터 🔄</button>';
        html += '</div>';
    }
    document.getElementById('mainArea').innerHTML = html;
}
function retryPaperFoldSameRound() {
    paperState.answered = false;
    renderPaperFold();
}
function renderPaperMiniGrid(holes, n, cellPx) {
    var holeSet = {};
    holes.forEach(function (h) { holeSet[h.x + ',' + h.y] = true; });
    var html = '<div style="display:inline-grid; grid-template-columns: repeat(' + n + ', ' + cellPx + 'px); gap:1px; background:#c18a3d; padding:3px; border-radius:0.3rem;">';
    for (var y = 0; y < n; y++) {
        for (var x = 0; x < n; x++) {
            var filled = holeSet[x + ',' + y];
            html += '<div style="width:' + cellPx + 'px; height:' + cellPx + 'px; background:#e3a857; display:flex; align-items:center; justify-content:center;">' + (filled ? '<div style="width:70%; height:70%; background:#dc2626; border:1px solid #7f1d1d; border-radius:50%;"></div>' : '') + '</div>';
        }
    }
    html += '</div>';
    return html;
}
function renderPaperFold() {
    var html = '<div class="game-title-box">🧩 접힌 종이 구멍 뚫기</div>';
    html += '<div class="game-sub-desc">종이를 접은 순서를 보고, 펀치로 구멍을 뚫은 뒤 다시 펼치면 어떤 모양이 될지 맞혀보세요!</div>';
    html += '<div class="status-row"><div>' + paperRound + '라운드</div><div>정답: ' + paperCorrect + ' / ' + (paperRound - 1) + '</div></div>';
    var foldLabels = paperState.folds.map(function (axis, i) {
        return (i + 1) + ') ' + (axis === 'v' ? '왼쪽 ↔ 오른쪽으로 반 접기' : '위 ↔ 아래로 반 접기');
    });
    html += '<div class="msg-box" style="display:block; background:#f8fafc; border-color:#e5e7eb; text-align:left; line-height:1.9;">' + foldLabels.join('<br>') + '<br>➡️ 그 상태에서 🔴 위치에 펀치로 구멍을 뚫었어요!</div>';
    html += renderPaperFlatStage(paperState.foldedW, paperState.foldedH, [paperState.punch]);
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">종이를 완전히 펼치면 어떤 모양이 될까요?</div>';
    html += '<div class="cube3d-options-row" style="flex-wrap:wrap;">';
    paperState.options.forEach(function (holes, idx) {
        html += '<button type="button" class="cube3d-option-box" onclick="checkPaperFold(' + idx + ')">' + renderPaperMiniGrid(holes, paperState.n, 12) + '</button>';
    });
    html += '</div>';
    html += '<div id="paperMsg" class="msg-box"></div>';
    html += '<div style="margin-top:1rem;"><button class="action-btn secondary" onclick="renderPaperFoldSetup()" style="font-size:0.82rem; padding:0.5rem 0.8rem;">난이도 변경 ⚙️</button></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function checkPaperFold(idx) {
    if (paperState.answered) return;
    paperState.answered = true;
    vibrateShort();
    var boxes = document.querySelectorAll('.cube3d-option-box');
    var isCorrect = (idx === paperState.correctIndex);
    if (typeof reportGameOutcome === 'function') reportGameOutcome(isCorrect ? 'win' : 'lose');
    var msg = document.getElementById('paperMsg');
    if (isCorrect) {
        paperCorrect++;
        if (boxes[idx]) boxes[idx].classList.add('correct');
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 정답이에요! 종이를 펼치는 모습을 확인해보세요.';
    } else {
        if (boxes[idx]) boxes[idx].classList.add('wrong');
        if (boxes[paperState.correctIndex]) boxes[paperState.correctIndex].classList.add('correct');
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '아쉬워요! 종이를 펼치는 모습을 확인해보세요.';
    }
    paperRound++;
    var t = gameTimeout(function () { playPaperUnfoldAnim(isCorrect); }, 1000);
}

// ===================== 37. 공간지각: 치즈 갉아먹기 미로 =====================
var cheeseSettings = { size: 4, timeLimit: 10 };
var cheeseState = {};
var cheeseRound = 1, cheeseSolved = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('cheeseMaze', { easy: { size: 4 }, normal: { size: 5 }, hard: { size: 6 } });
}
function initCheeseMaze() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('cheeseMaze', cheeseSettings);
    renderCheeseSetup();
}
function renderCheeseSetup() {
    var sizes = [{ v: 4, l: '쉬움 (4×4)' }, { v: 5, l: '보통 (5×5)' }, { v: 6, l: '어려움 (6×6)' }, { v: 'random', l: '무작위' }];
    var times = [{ v: 10, l: '10초' }, { v: 15, l: '15초' }, { v: 20, l: '20초' }, { v: 'random', l: '무작위' }];
    var html = '<div class="game-title-box">🧀 치즈 갉아먹기 미로</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">격자 크기</div><div class="setup-btn-group">';
    sizes.forEach(function (s) {
        html += '<button class="setup-btn' + (cheeseSettings.size === s.v ? ' active' : '') + '" onclick="setCheeseSize(' + (s.v === 'random' ? "'random'" : s.v) + ')">' + s.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (cheeseSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setCheeseTimeLimit(' + (t.v === 'random' ? "'random'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startCheeseSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setCheeseSize(v) { cheeseSettings.size = v; renderCheeseSetup(); }
function setCheeseTimeLimit(v) { cheeseSettings.timeLimit = v; renderCheeseSetup(); }
function startCheeseSession() { cheeseRound = 1; cheeseSolved = 0; generateCheeseRound(); }
function computeSnakeEndpoint(w, h) {
    var endRow = h - 1;
    var endCol = (endRow % 2 === 0) ? (w - 1) : 0;
    return { x: endCol, y: endRow };
}
function findRandomHamiltonianPath(size, budget) {
    var total = size * size;
    var visited = {};
    var path = [{ x: 0, y: 0 }];
    visited['0,0'] = true;
    var calls = { n: 0 };
    function dfs(cell) {
        calls.n++;
        if (calls.n > budget) return false;
        if (path.length === total) return true;
        var dirs = shuffleArray([{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }]);
        for (var i = 0; i < dirs.length; i++) {
            var nx = cell.x + dirs[i].dx, ny = cell.y + dirs[i].dy;
            if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
            var key = nx + ',' + ny;
            if (visited[key]) continue;
            visited[key] = true;
            path.push({ x: nx, y: ny });
            if (dfs({ x: nx, y: ny })) return true;
            path.pop();
            visited[key] = false;
        }
        return false;
    }
    return dfs({ x: 0, y: 0 }) ? path : null;
}
function generateCheeseExit(size) {
    for (var attempt = 0; attempt < 6; attempt++) {
        var path = findRandomHamiltonianPath(size, 20000);
        if (path) return path[path.length - 1];
    }
    return computeSnakeEndpoint(size, size);
}
function generateCheeseRound() {
    var size = cheeseSettings.size === 'random' ? pickRandom([4, 5, 6]) : cheeseSettings.size;
    var timeLimit = cheeseSettings.timeLimit === 'random' ? pickRandom([10, 15, 20]) : cheeseSettings.timeLimit;
    var exit = generateCheeseExit(size);
    cheeseState = {
        size: size, exit: exit, mouse: { x: 0, y: 0 }, visited: [{ x: 0, y: 0 }], finished: false, failed: false,
        timeLimit: timeLimit, timeLeft: timeLimit, timerId: null, timedOut: false
    };
    renderCheeseMaze();
    if (timeLimit > 0) { startCheeseTimer(); }
}
function startCheeseTimer() {
    var bar = document.getElementById('cheeseTimerBar');
    if (bar) bar.style.width = '100%';
    cheeseState.timerId = setInterval(function () {
        cheeseState.timeLeft -= 0.1;
        var pct = (cheeseState.timeLeft / cheeseState.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('cheeseTimerBar');
        if (b) b.style.width = pct + '%';
        if (cheeseState.timeLeft <= 0) {
            clearInterval(cheeseState.timerId);
            handleCheeseTimeout();
        }
    }, 100);
    activeTimers.push(cheeseState.timerId);
}
function handleCheeseTimeout() {
    if (cheeseState.finished || cheeseState.failed || cheeseState.timedOut) return;
    cheeseState.timedOut = true;
    if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
    stopCheeseHoldMove();
    renderCheeseMaze();
}
function restartCheeseMaze() { renderCheeseSetup(); }
function nextCheeseRound() { cheeseRound++; generateCheeseRound(); }
function retryCheeseRound() {
    cheeseState.mouse = { x: 0, y: 0 };
    cheeseState.visited = [{ x: 0, y: 0 }];
    cheeseState.finished = false;
    cheeseState.failed = false;
    cheeseState.timedOut = false;
    cheeseState.timeLeft = cheeseState.timeLimit;
    renderCheeseMaze();
    if (cheeseState.timeLimit > 0) { startCheeseTimer(); }
}
function isCheeseVisited(x, y) { return cheeseState.visited.some(function (v) { return v.x === x && v.y === y; }); }
function moveCheeseMouse(dx, dy) {
    if (cheeseState.finished || cheeseState.failed || cheeseState.timedOut) return;
    var nx = cheeseState.mouse.x + dx, ny = cheeseState.mouse.y + dy;
    if (nx < 0 || nx >= cheeseState.size || ny < 0 || ny >= cheeseState.size) return;
    if (isCheeseVisited(nx, ny)) return;
    vibrateShort();
    cheeseState.mouse = { x: nx, y: ny };
    cheeseState.visited.push({ x: nx, y: ny });
    var allVisited = cheeseState.visited.length === cheeseState.size * cheeseState.size;
    if (allVisited) {
        if (nx === cheeseState.exit.x && ny === cheeseState.exit.y) {
            cheeseState.finished = true;
            cheeseSolved++;
            if (typeof reportGameOutcome === 'function') reportGameOutcome('win');
            if (typeof reportGameRound === 'function') reportGameRound(cheeseSolved);
            if (cheeseState.timerId) clearInterval(cheeseState.timerId);
            stopCheeseHoldMove();
        } else {
            cheeseState.failed = true;
            if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
            if (cheeseState.timerId) clearInterval(cheeseState.timerId);
            stopCheeseHoldMove();
        }
    } else {
        var stuck = true;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
            var tx = nx + d[0], ty = ny + d[1];
            if (tx >= 0 && tx < cheeseState.size && ty >= 0 && ty < cheeseState.size && !isCheeseVisited(tx, ty)) stuck = false;
        });
        if (stuck) {
            cheeseState.failed = true;
            if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
            if (cheeseState.timerId) clearInterval(cheeseState.timerId);
            stopCheeseHoldMove();
        }
    }
    renderCheeseMaze();
}
var cheeseHoldInterval = null;
function startCheeseHoldMove(dx, dy) {
    stopCheeseHoldMove();
    moveCheeseMouse(dx, dy);
    cheeseHoldInterval = setInterval(function () { moveCheeseMouse(dx, dy); }, 500);
    activeTimers.push(cheeseHoldInterval);
}
function stopCheeseHoldMove() {
    if (cheeseHoldInterval) { clearInterval(cheeseHoldInterval); cheeseHoldInterval = null; }
}
function processCheeseDragToCell(col, row) {
    if (cheeseState.finished || cheeseState.failed) return;
    if (col < 0 || col >= cheeseState.size || row < 0 || row >= cheeseState.size) return;
    var m = cheeseState.mouse;
    var dx = col - m.x, dy = row - m.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    moveCheeseMouse(dx, dy);
}
function handleCheeseDragEvent(e) {
    if (!e.touches || !e.touches[0]) return;
    var grid = document.getElementById('cheeseGridEl');
    if (!grid || !grid.getBoundingClientRect) return;
    var rect = grid.getBoundingClientRect();
    var touchX = e.touches[0].clientX - rect.left;
    var touchY = e.touches[0].clientY - rect.top;
    var cell = mazeCellFromTouch(touchX, touchY, rect.width, rect.height, cheeseState.size, cheeseState.size);
    processCheeseDragToCell(cell.col, cell.row);
}
function attachCheeseSwipeHandlers() {
    var grid = document.getElementById('cheeseGridEl');
    if (!grid || !grid.addEventListener) return;
    grid.addEventListener('touchstart', function (e) { e.preventDefault(); handleCheeseDragEvent(e); }, { passive: false });
    grid.addEventListener('touchmove', function (e) { e.preventDefault(); handleCheeseDragEvent(e); }, { passive: false });
}
function renderCheeseMaze() {
    var html = '<div class="game-title-box">🧀 치즈 갉아먹기 미로</div>';
    html += '<div class="game-sub-desc">🐭 생쥐를 움직여 모든 치즈 칸을 딱 한 번씩만 밟고, 마지막에 🕳️ 구멍으로 쏙 들어가보세요! 지나간 칸은 다시 갈 수 없어요.</div>';
    html += '<div class="game-sub-desc">방향키를 사용하거나, 이동할 칸을 드래그해주세요</div>';
    if (cheeseState.timeLimit > 0 && !cheeseState.finished && !cheeseState.failed && !cheeseState.timedOut) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="cheeseTimerBar"></div></div>';
    }
    var remain = cheeseState.size * cheeseState.size - cheeseState.visited.length;
    html += '<div class="status-row"><div>맞춘 문제: ' + cheeseSolved + '개</div><div>남은 치즈: ' + remain + '개</div></div>';
    html += '<div class="maze-wrap"><div class="maze-grid" id="cheeseGridEl" style="grid-template-columns: repeat(' + cheeseState.size + ', 40px);">';
    for (var y = 0; y < cheeseState.size; y++) {
        for (var x = 0; x < cheeseState.size; x++) {
            var isMouse = (cheeseState.mouse.x === x && cheeseState.mouse.y === y);
            var isExit = (cheeseState.exit.x === x && cheeseState.exit.y === y);
            var visited = isCheeseVisited(x, y);
            var content = '';
            if (isMouse) content = '🐭';
            else if (isExit) content = '🕳️';
            else if (!visited) content = '🧀';
            var bg = visited && !isMouse ? 'background:#f1f5f9;' : '';
            html += '<div class="maze-cell" style="border:1px solid #e2e8f0; font-size:1.2rem;' + bg + '">' + content + '</div>';
        }
    }
    html += '</div>';
    html += '<div class="maze-controls">';
    html += '<div></div><button class="maze-btn" onmousedown="startCheeseHoldMove(0,-1)" ontouchstart="event.preventDefault();startCheeseHoldMove(0,-1)">▲</button><div></div>';
    html += '<button class="maze-btn" onmousedown="startCheeseHoldMove(-1,0)" ontouchstart="event.preventDefault();startCheeseHoldMove(-1,0)">◀</button>';
    html += '<button class="maze-btn" onmousedown="startCheeseHoldMove(0,1)" ontouchstart="event.preventDefault();startCheeseHoldMove(0,1)">▼</button>';
    html += '<button class="maze-btn" onmousedown="startCheeseHoldMove(1,0)" ontouchstart="event.preventDefault();startCheeseHoldMove(1,0)">▶</button>';
    html += '</div></div>';
    html += '<div id="cheeseMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    attachCheeseSwipeHandlers();
    if (cheeseState.timeLimit > 0 && !cheeseState.finished && !cheeseState.failed && !cheeseState.timedOut) {
        var barEl = document.getElementById('cheeseTimerBar');
        if (barEl) barEl.style.width = (cheeseState.timeLeft / cheeseState.timeLimit * 100) + '%';
    }
    if (cheeseState.finished) {
        var msg = document.getElementById('cheeseMsg');
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 치즈를 모두 먹고 깔끔하게 탈출했어요!';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextCheeseRound()', 'retryCheeseRound()', 'restartCheeseMaze()'));
    } else if (cheeseState.failed) {
        var msg2 = document.getElementById('cheeseMsg');
        msg2.className = 'msg-box bad'; msg2.style.display = 'block'; msg2.innerText = '아쉬워요! 더 이상 갈 곳이 없어요. (모든 칸을 밟고 마지막에 정확히 구멍으로 들어가야 해요)';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryCheeseRound()">다시 시도 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartCheeseMaze()">처음부터 풀기 🔄</button>' +
            '</div>');
    } else if (cheeseState.timedOut) {
        var msg3 = document.getElementById('cheeseMsg');
        msg3.className = 'msg-box bad'; msg3.style.display = 'block'; msg3.innerText = '⏰ 시간이 다 됐어요!';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryCheeseRound()">다시 시도 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartCheeseMaze()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('mouseup', function () { stopCheeseHoldMove(); });
    document.addEventListener('touchend', function () { stopCheeseHoldMove(); });
}

// ===================== 38. 공간지각: 전개도 접어 상자 만들기 =====================
// 십자(+) 모양 정육면체 전개도 고정 사용. 칸 위치: T(위)/L(왼)/F(가운데,기준)/R(오른)/B(R 옆, 오른쪽 끝)/Bo(아래)
// "일직선 위 3칸 규칙"(전개도에서 한 줄에 3칸 이상 있으면 양 끝이 마주보는 면)에 따라
// 이 십자 전개도의 마주보는 면은 항상 T↔Bo, L↔R, F↔B 로 고정됨(어떤 그림을 넣어도 변하지 않음)
var NETFOLD_EMOJI_POOL = ['⭐', '🍎', '🐱', '🌙', '☀️', '🍀', '🐬', '🎈', '🚗', '🌵', '🦋', '🍩', '🐢', '🎵', '🍉', '🌈'];
var NETFOLD_POS = ['T', 'L', 'F', 'R', 'B', 'Bo'];
var NETFOLD_GRID = { T: { c: 1, r: 0 }, L: { c: 0, r: 1 }, F: { c: 1, r: 1 }, R: { c: 2, r: 1 }, B: { c: 3, r: 1 }, Bo: { c: 1, r: 2 } };
var NETFOLD_OPPOSITE = { T: 'Bo', Bo: 'T', L: 'R', R: 'L', F: 'B', B: 'F' };
// 접힌 상자(renderNetFoldSceneHtml 방식)에서 해당 면을 정면으로 돌리는 회전값. 마주보는 면은 같은 축으로 180도만 더 돌리면 됨
var NETFOLD_FACE_FRONT = {
    F: 'rotateX(0deg) rotateY(0deg)',
    B: 'rotateX(0deg) rotateY(180deg)',
    R: 'rotateX(0deg) rotateY(-90deg)',
    L: 'rotateX(0deg) rotateY(90deg)',
    T: 'rotateX(-90deg) rotateY(0deg)',
    Bo: 'rotateX(90deg) rotateY(0deg)'
};
var netfoldSettings = { level: 'low' };
var netfoldState = {};
var netfoldRound = 1, netfoldCorrect = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('netFoldBox', { easy: { level: 'low' }, normal: { level: 'mid' }, hard: { level: 'high' } });
}
function initNetFoldBox() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('netFoldBox', netfoldSettings);
    renderNetFoldSetup();
}
function renderNetFoldSetup() {
    var levels = [
        { v: 'low', l: '쉬움 (마주보는 면 맞히기)' },
        { v: 'mid', l: '보통 (접어서 상자 맞추기)' },
        { v: 'high', l: '어려움 (거꾸로 전개도 찾기)' }
    ];
    var html = '<div class="game-title-box">📦 전개도 접어 상자 만들기</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요! 전개도를 접었을 때의 모습을 상상하는 놀이예요.</div>';
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    levels.forEach(function (t) {
        html += '<button class="setup-btn' + (netfoldSettings.level === t.v ? ' active' : '') + '" onclick="setNetFoldLevel(\'' + t.v + '\')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startNetFoldSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setNetFoldLevel(v) { netfoldSettings.level = v; renderNetFoldSetup(); }
function startNetFoldSession() { netfoldRound = 1; netfoldCorrect = 0; generateNetFoldRound(); }
function randomNetFoldAssignment() {
    var pool = shuffleArray(NETFOLD_EMOJI_POOL.slice()).slice(0, 6);
    var assign = {};
    NETFOLD_POS.forEach(function (k, i) { assign[k] = pool[i]; });
    return assign;
}
function netfoldSwapAssign(a, k1, k2) {
    var copy = {};
    NETFOLD_POS.forEach(function (k) { copy[k] = a[k]; });
    var tmp = copy[k1]; copy[k1] = copy[k2]; copy[k2] = tmp;
    return copy;
}
function generateNetFoldRound() {
    var assign = randomNetFoldAssignment();
    netfoldState = { level: netfoldSettings.level, assign: assign, answered: false };
    if (netfoldSettings.level === 'low') { generateNetFoldLevel1(); }
    else if (netfoldSettings.level === 'mid') { generateNetFoldLevel2(); }
    else { generateNetFoldLevel3(); }
}
function retryNetFoldSameRound() {
    netfoldState.answered = false;
    if (netfoldState.level === 'low') { renderNetFoldLevel1(); }
    else if (netfoldState.level === 'mid') { renderNetFoldLevel2(); }
    else { renderNetFoldLevel3(); }
}
// 정답/오답 공용 결과 처리(다른 공간지각 게임들과 동일한 버튼 구성 재사용)
function netfoldFinishRound(isCorrect, correctMsg, wrongMsg) {
    netfoldRound++;
    if (typeof reportGameOutcome === 'function') reportGameOutcome(isCorrect ? 'win' : 'lose');
    var msg = document.getElementById('netfoldMsg');
    msg.style.display = 'block';
    if (isCorrect) {
        netfoldCorrect++;
        msg.className = 'msg-box'; msg.innerText = correctMsg;
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('generateNetFoldRound()', 'retryNetFoldSameRound()', 'renderNetFoldSetup()'));
    } else {
        msg.className = 'msg-box bad'; msg.innerText = wrongMsg;
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid" style="grid-template-columns: 1fr 1fr 1fr; gap:0.4rem;">' +
            '<button class="action-btn" style="font-size:0.82rem; padding:0.6rem 0.3rem;" onclick="generateNetFoldRound()">다음 문제 ▶</button>' +
            '<button class="action-btn secondary" style="font-size:0.82rem; padding:0.6rem 0.3rem;" onclick="retryNetFoldSameRound()">다시 하기 🔁</button>' +
            '<button class="action-btn secondary" style="font-size:0.82rem; padding:0.6rem 0.3rem;" onclick="renderNetFoldSetup()">처음부터 🔄</button>' +
            '</div>');
    }
}
// 평면 전개도 미리보기(레벨1의 문제 그림, 레벨3의 보기 4개에 공용으로 사용)
function renderNetPreviewHtml(assign, cellPx, highlightKey, markKey) {
    var w = 4 * cellPx, h = 3 * cellPx;
    var html = '<div style="position:relative; width:' + w + 'px; height:' + h + 'px; margin:0.6rem auto;">';
    NETFOLD_POS.forEach(function (k) {
        var g = NETFOLD_GRID[k];
        var isHi = k === highlightKey;
        var content = k === markKey ? '❓' : assign[k];
        html += '<div style="position:absolute; left:' + (g.c * cellPx) + 'px; top:' + (g.r * cellPx) + 'px; width:' + cellPx + 'px; height:' + cellPx + 'px; background:#fff; border:2px solid ' + (isHi ? '#2563eb' : '#c18a3d') + '; ' + (isHi ? 'box-shadow:0 0 0 3px rgba(37,99,235,0.35);' : '') + ' display:flex; align-items:center; justify-content:center; font-size:' + (cellPx * 0.55) + 'px; box-sizing:border-box;">' + content + '</div>';
    });
    html += '</div>';
    return html;
}
// 정지된(애니메이션 없는) 3D 정육면체 미리보기 - 레벨2 보기 4개, 레벨3의 "이 상자" 두 각도 보기에 공용으로 사용
var NETFOLD_CUBE_FACE_TRANSFORM = {
    F: 'translateZ(HALFpx)', B: 'rotateY(180deg) translateZ(HALFpx)',
    R: 'rotateY(90deg) translateZ(HALFpx)', L: 'rotateY(-90deg) translateZ(HALFpx)',
    T: 'rotateX(90deg) translateZ(HALFpx)', Bo: 'rotateX(-90deg) translateZ(HALFpx)'
};
function buildNetCubeHTML(assign, rotX, rotY, groupId, size) {
    var half = size / 2;
    var html = '<div class="netfold-cube-group" id="' + groupId + '" style="transform: rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg);">';
    NETFOLD_POS.forEach(function (k) {
        var t = NETFOLD_CUBE_FACE_TRANSFORM[k].replace('HALFpx', half + 'px');
        html += '<div class="netfold-cube-face" style="width:' + size + 'px; height:' + size + 'px; margin:-' + half + 'px 0 0 -' + half + 'px; font-size:' + (size * 0.5) + 'px; transform:' + t + ';">' + assign[k] + '</div>';
    });
    html += '</div>';
    return html;
}
// ---- 레벨1: 마주보는 면 맞히기 ----
function generateNetFoldLevel1() {
    var assign = netfoldState.assign;
    var askKey = pickRandom(NETFOLD_POS);
    var correctKey = NETFOLD_OPPOSITE[askKey];
    var correctEmoji = assign[correctKey];
    var decoyPool = NETFOLD_POS.filter(function (k) { return k !== askKey && k !== correctKey; }).map(function (k) { return assign[k]; });
    var options = shuffleArray([correctEmoji].concat(shuffleArray(decoyPool).slice(0, 3)));
    netfoldState.askKey = askKey;
    netfoldState.askKeyEmoji = assign[askKey];
    netfoldState.correctAnswer = correctEmoji;
    netfoldState.options = options;
    renderNetFoldLevel1();
}
function renderNetFoldLevel1() {
    var html = '<div class="game-title-box">📦 전개도 접어 상자 만들기</div>';
    html += '<div class="game-sub-desc">이 전개도를 접으면 정육면체 상자가 돼요. <b style="color:#2563eb;">파란 테두리</b> 칸의 반대쪽(마주보는 면)에는 어떤 그림이 있을까요?</div>';
    html += '<div class="status-row"><div>' + netfoldRound + '라운드</div><div>정답: ' + netfoldCorrect + ' / ' + (netfoldRound - 1) + '</div></div>';
    html += renderNetPreviewHtml(netfoldState.assign, 40, netfoldState.askKey, null);
    html += '<div class="cube3d-options-row">';
    netfoldState.options.forEach(function (opt, idx) {
        html += '<button type="button" class="cube3d-option-box" style="width:52px; height:52px; display:flex; align-items:center; justify-content:center; font-size:1.7rem;" onclick="checkNetFoldLevel1(' + idx + ')">' + opt + '</button>';
    });
    html += '</div>';
    html += '<div id="netfoldMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function checkNetFoldLevel1(idx) {
    if (netfoldState.answered) return;
    netfoldState.answered = true;
    vibrateShort();
    var boxes = document.querySelectorAll('.cube3d-option-box');
    var isCorrect = netfoldState.options[idx] === netfoldState.correctAnswer;
    boxes.forEach(function (b, i) {
        if (netfoldState.options[i] === netfoldState.correctAnswer) b.classList.add('correct');
        else if (i === idx) b.classList.add('wrong');
    });
    netfoldState.level1Correct = isCorrect;
    // 답을 고르면 정육면체가 천천히 접히고, 상자를 한 바퀴 돌려 마주보는 면을 확인시켜 준다
    var t = gameTimeout(playNetFoldLevel1Reveal, 400);
}
function playNetFoldLevel1Reveal() {
    var assign = netfoldState.assign;
    var html = '<div class="game-title-box">📦 전개도 접어 상자 만들기</div>';
    html += '<div class="status-row"><div>' + netfoldRound + '라운드</div><div>정답: ' + netfoldCorrect + ' / ' + (netfoldRound - 1) + '</div></div>';
    html += '<div class="game-sub-desc" id="netfoldRevealCap" style="text-align:center; font-weight:800;">상자를 천천히 접어볼게요...</div>';
    html += '<div id="netfoldStage"></div>';
    html += '<div id="netfoldRevealAns" style="text-align:center; margin:0.6rem 0; min-height:56px;"></div>';
    html += '<div id="netfoldMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    var askKey = netfoldState.askKey;
    var oppKey = NETFOLD_OPPOSITE[askKey];
    playNetFoldAssemblyAnim(assign, function () {
        var assembly = document.getElementById('netfoldAssembly');
        var cap = document.getElementById('netfoldRevealCap');
        var askFace = document.getElementById('netfoldFace' + askKey);
        // 1) 보기에서 고른 면(파란 테두리)을 상자 정면으로
        if (assembly) assembly.style.transform = NETFOLD_FACE_FRONT[askKey];
        if (askFace) { askFace.style.boxShadow = '0 0 0 4px #2563eb, 0 0 16px rgba(37,99,235,0.75)'; askFace.style.borderColor = '#2563eb'; }
        if (cap) cap.innerText = '고른 면(파란 테두리)이 상자 앞면이에요';
        var t1 = gameTimeout(function () {
            // 2) 같은 축으로 180도 돌려서 마주보는 면이 정면에 오게
            if (assembly) assembly.style.transform = NETFOLD_FACE_FRONT[oppKey];
            if (askFace) askFace.style.boxShadow = 'none';
            if (cap) cap.innerText = '상자를 돌려서 반대쪽(마주보는 면)을 확인해요!';
            var t1b = gameTimeout(function () {
                var oppFace = document.getElementById('netfoldFace' + oppKey);
                if (oppFace) { oppFace.style.boxShadow = '0 0 0 4px #10b981, 0 0 18px rgba(16,185,129,0.8)'; oppFace.style.borderColor = '#10b981'; }
                var ans = document.getElementById('netfoldRevealAns');
                if (ans) {
                    ans.innerHTML = '<div style="display:inline-flex; align-items:center; gap:0.5rem; font-size:1.4rem; font-weight:800;">' +
                        '<span style="padding:0.25rem 0.5rem; border:2px solid #2563eb; border-radius:0.5rem;">' + netfoldState.askKeyEmoji + '</span>' +
                        '<span style="color:#6b7280; font-size:1rem;">의 반대쪽 →</span>' +
                        '<span style="padding:0.25rem 0.5rem; border:3px solid #10b981; background:#d1fae5; border-radius:0.5rem; box-shadow:0 0 12px rgba(16,185,129,0.6);">' + netfoldState.correctAnswer + '</span>' +
                        '</div>';
                }
                var t2 = gameTimeout(finishNetFoldLevel1, 1050);
            }, NETFOLD_SPIN_MS + 170);
        }, NETFOLD_SPIN_MS + 280);
    });
}
function finishNetFoldLevel1() {
    netfoldFinishRound(netfoldState.level1Correct,
        '🎉 정답이에요! 마주보는 면을 잘 찾았어요.',
        '아쉬워요! 정답은 ' + netfoldState.correctAnswer + ' 이었어요.');
}
// ---- 레벨2: 전개도를 실제로 접는 애니메이션을 본 뒤, 완성된 상자와 같은 보기 고르기 ----
// F는 고정(회전 없음), L/R/T/Bo는 F와 맞닿은 변을 축으로 90도 접혀 옆면이 되고,
// B는 R의 자식 요소로 두어 R을 따라 함께 돌다가 마지막에 한 번 더 접혀 뒷면이 됨(종이 상자 접기와 동일한 방식)
var NETFOLD_ANIM_S = 56;
var NETFOLD_FOLD_MS = 1000;   // 한 면이 접히는 시간
var NETFOLD_SPIN_MS = 700;    // 접힌 상자를 돌려 보여줄 때의 회전 시간
var NETFOLD_STEP_GAP = 140;   // 접기 단계 사이의 여유 시간
function renderNetFoldSceneHtml(assign) {
    var S = NETFOLD_ANIM_S;
    var sceneW = 4 * S, sceneH = 3 * S;
    function face(id, key, extra) {
        var g = NETFOLD_GRID[key];
        return '<div id="' + id + '" style="position:absolute; left:' + (g.c * S) + 'px; top:' + (g.r * S) + 'px; width:' + S + 'px; height:' + S + 'px; background:#fff; border:2px solid #c18a3d; box-sizing:border-box; display:flex; align-items:center; justify-content:center; font-size:' + (S * 0.5) + 'px; backface-visibility:hidden;' + (extra || '') + '">' + assign[key] + '</div>';
    }
    var html = '<div style="width:100%; overflow-x:auto;"><div style="width:' + sceneW + 'px; height:' + (sceneH + 30) + 'px; margin:0.5rem auto; perspective:760px;">';
    html += '<div id="netfoldAssembly" style="position:relative; width:' + sceneW + 'px; height:' + sceneH + 'px; margin-top:20px; transform-style:preserve-3d; transform-origin:' + (1.5 * S) + 'px ' + (1.5 * S) + 'px ' + (-0.5 * S) + 'px; transform:rotateX(0deg) rotateY(0deg); transition:transform ' + NETFOLD_SPIN_MS + 'ms ease;">';
    html += face('netfoldFaceF', 'F', '');
    html += face('netfoldFaceL', 'L', 'transform-origin:right center; transform:rotateY(0deg); transition:transform ' + NETFOLD_FOLD_MS + 'ms ease;');
    html += face('netfoldFaceT', 'T', 'transform-origin:bottom center; transform:rotateX(0deg); transition:transform ' + NETFOLD_FOLD_MS + 'ms ease;');
    html += face('netfoldFaceBo', 'Bo', 'transform-origin:top center; transform:rotateX(0deg); transition:transform ' + NETFOLD_FOLD_MS + 'ms ease;');
    var gr = NETFOLD_GRID.R;
    html += '<div id="netfoldFaceR" style="position:absolute; left:' + (gr.c * S) + 'px; top:' + (gr.r * S) + 'px; width:' + S + 'px; height:' + S + 'px; background:#fff; border:2px solid #c18a3d; box-sizing:border-box; display:flex; align-items:center; justify-content:center; font-size:' + (S * 0.5) + 'px; backface-visibility:hidden; transform-style:preserve-3d; transform-origin:left center; transform:rotateY(0deg); transition:transform ' + NETFOLD_FOLD_MS + 'ms ease;">';
    html += assign.R;
    html += '<div id="netfoldFaceB" style="position:absolute; left:' + S + 'px; top:0; width:' + S + 'px; height:' + S + 'px; background:#fff; border:2px solid #c18a3d; box-sizing:border-box; display:flex; align-items:center; justify-content:center; font-size:' + (S * 0.5) + 'px; backface-visibility:hidden; transform-origin:left center; transform:rotateY(0deg); transition:transform ' + NETFOLD_FOLD_MS + 'ms ease;">' + assign.B + '</div>';
    html += '</div></div></div></div>';
    return html;
}
function playNetFoldAssemblyAnim(assign, onDone) {
    var html = '<div class="game-sub-desc" style="text-align:center; font-weight:800;">전개도가 어떻게 접히는지 잘 보세요!</div>' + renderNetFoldSceneHtml(assign);
    document.getElementById('netfoldStage').innerHTML = html;
    var t1 = gameTimeout(function () {
        var elL = document.getElementById('netfoldFaceL'); if (elL) elL.style.transform = 'rotateY(-90deg)';
        var elR = document.getElementById('netfoldFaceR'); if (elR) elR.style.transform = 'rotateY(90deg)';
        var elT = document.getElementById('netfoldFaceT'); if (elT) elT.style.transform = 'rotateX(90deg)';
        var elBo = document.getElementById('netfoldFaceBo'); if (elBo) elBo.style.transform = 'rotateX(-90deg)';
        var t2 = gameTimeout(function () {
            var elB = document.getElementById('netfoldFaceB'); if (elB) elB.style.transform = 'rotateY(90deg)';
            var t3 = gameTimeout(function () {
                var assembly = document.getElementById('netfoldAssembly');
                if (assembly) assembly.style.transform = 'rotateX(-20deg) rotateY(-28deg)';
                var t4 = gameTimeout(function () { if (onDone) onDone(); }, NETFOLD_SPIN_MS);
            }, NETFOLD_FOLD_MS + NETFOLD_STEP_GAP);
        }, NETFOLD_FOLD_MS + NETFOLD_STEP_GAP);
    }, 420);
}
function generateNetFoldLevel2() {
    var assign = netfoldState.assign;
    // 오답은 접는 애니메이션의 마지막 각도(앞·위·오른쪽)에서는 안 보이던 "뒷면"이 서로 다르도록 만들어,
    // 눈으로 바로 못 맞추고 상자를 접거나 돌려봐야(힌트) 알 수 있게 함
    var decoy1 = netfoldSwapAssign(assign, 'B', 'Bo');
    var decoy2 = netfoldSwapAssign(assign, 'B', 'L');
    var decoy3 = netfoldSwapAssign(assign, 'B', 'F');
    var opts = shuffleArray([{ a: assign, correct: true }, { a: decoy1, correct: false }, { a: decoy2, correct: false }, { a: decoy3, correct: false }]);
    netfoldState.options = opts;
    netfoldState.correctOptIndex = opts.map(function (o) { return o.correct; }).indexOf(true);
    renderNetFoldLevel2();
}
function renderNetFoldLevel2() {
    var html = '<div class="game-title-box">📦 전개도 접어 상자 만들기</div>';
    html += '<div class="status-row"><div>' + netfoldRound + '라운드</div><div>정답: ' + netfoldCorrect + ' / ' + (netfoldRound - 1) + '</div></div>';
    html += '<div id="netfoldStage"></div>';
    document.getElementById('mainArea').innerHTML = html;
    playNetFoldAssemblyAnim(netfoldState.assign, renderNetFoldLevel2Question);
}
function renderNetFoldLevel2Question() {
    var html = '<div class="game-sub-desc" style="text-align:center; font-weight:800;">방금 접은 상자를 <span style="color:#2563eb;">뒤쪽에서</span> 본 모습을 보기에서 찾아보세요!</div>';
    html += '<div style="text-align:center;"><div class="netfold-cube-scene">' + buildNetCubeHTML(netfoldState.assign, -20, -28, 'netfoldRefCube', 50) + '</div>';
    html += '<div class="game-sub-desc" style="margin:0.1rem 0 0.3rem 0;">방금 만든 상자 (앞·위·오른쪽 면)</div>';
    html += '<button class="action-btn secondary" style="font-size:0.8rem; padding:0.4rem 0.9rem; margin-top:0;" onclick="netFoldLevel2Hint()">💡 힌트: 상자 한 바퀴 돌려보기</button></div>';
    html += '<div class="cube3d-options-row" style="flex-wrap:wrap; margin-top:0.9rem;">';
    netfoldState.options.forEach(function (opt, idx) {
        html += '<button type="button" class="cube3d-option-box" onclick="checkNetFoldLevel2(' + idx + ')"><div class="netfold-cube-scene">' + buildNetCubeHTML(opt.a, -20, 158, 'netfoldOpt' + idx, 42) + '</div></button>';
    });
    html += '</div><div id="netfoldMsg" class="msg-box"></div>';
    document.getElementById('netfoldStage').innerHTML = html;
}
function netFoldLevel2Hint() {
    var el = document.getElementById('netfoldRefCube');
    if (!el || netfoldState.answered) return;
    vibrateShort();
    el.style.transition = 'transform 1.9s ease-in-out';
    el.style.transform = 'rotateX(-20deg) rotateY(332deg)';
    var t = gameTimeout(function () {
        if (!el) return;
        el.style.transition = 'transform 1s ease-in-out';
        el.style.transform = 'rotateX(-20deg) rotateY(-28deg)';
    }, 1950);
}
function checkNetFoldLevel2(idx) {
    if (netfoldState.answered) return;
    netfoldState.answered = true;
    vibrateShort();
    var boxes = document.querySelectorAll('.cube3d-option-box');
    var isCorrect = idx === netfoldState.correctOptIndex;
    boxes.forEach(function (b, i) {
        if (i === netfoldState.correctOptIndex) b.classList.add('correct');
        else if (i === idx) b.classList.add('wrong');
    });
    netfoldFinishRound(isCorrect, '🎉 정답이에요! 접힌 상자 모양을 잘 맞혔어요.', '아쉬워요! 초록 테두리가 정답이에요.');
}
// ---- 레벨3(역발상): 완성된 상자를 두 각도에서 보고, 그걸 펼친 전개도를 4개 보기 중에서 찾기 ----
function generateNetFoldLevel3() {
    var assign = netfoldState.assign;
    var decoy1 = netfoldSwapAssign(assign, 'L', 'R');
    var decoy2 = netfoldSwapAssign(assign, 'T', 'Bo');
    var decoy3 = netfoldSwapAssign(assign, 'F', 'B');
    var opts = shuffleArray([{ a: assign, correct: true }, { a: decoy1, correct: false }, { a: decoy2, correct: false }, { a: decoy3, correct: false }]);
    netfoldState.options = opts;
    netfoldState.correctOptIndex = opts.map(function (o) { return o.correct; }).indexOf(true);
    renderNetFoldLevel3();
}
function renderNetFoldLevel3() {
    var html = '<div class="game-title-box">📦 전개도 접어 상자 만들기</div>';
    html += '<div class="game-sub-desc">이 상자를 완전히 펼치면 어떤 전개도가 될까요? 두 각도에서 본 모습이에요.</div>';
    html += '<div class="status-row"><div>' + netfoldRound + '라운드</div><div>정답: ' + netfoldCorrect + ' / ' + (netfoldRound - 1) + '</div></div>';
    html += '<div id="netfoldStage">' + renderNetFoldLevel3Body(netfoldState.assign) + '</div>';
    html += '<div id="netfoldMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function renderNetFoldLevel3Body(assign) {
    // 답을 고르면 두 열(앞/뒤 상자)이 각각 그 자리에서 펼쳐지는 애니메이션으로 바뀐다.
    var html = '<div style="display:flex; justify-content:center; gap:0.8rem; flex-wrap:wrap; align-items:flex-start;">';
    html += '<div id="netfoldL3Front" style="text-align:center;"><div class="netfold-cube-scene">' + buildNetCubeHTML(assign, -20, -28, 'netfoldView1', 46) + '</div><div class="game-sub-desc" style="margin:0.2rem 0 0 0;">앞에서 볼 때</div></div>';
    html += '<div id="netfoldL3Back" style="text-align:center;"><div class="netfold-cube-scene">' + buildNetCubeHTML(assign, -20, 152, 'netfoldView2', 46) + '</div><div class="game-sub-desc" style="margin:0.2rem 0 0 0;">뒤에서 볼 때</div></div>';
    html += '</div>';
    html += '<div class="cube3d-options-row" style="flex-wrap:wrap;">';
    netfoldState.options.forEach(function (opt, idx) {
        html += '<button type="button" class="cube3d-option-box" onclick="checkNetFoldLevel3(' + idx + ')">' + renderNetPreviewHtml(opt.a, 16, null, null) + '</button>';
    });
    html += '</div>';
    return html;
}
function checkNetFoldLevel3(idx) {
    if (netfoldState.answered) return;
    netfoldState.answered = true;
    vibrateShort();
    var boxes = document.querySelectorAll('.cube3d-option-box');
    var isCorrect = idx === netfoldState.correctOptIndex;
    boxes.forEach(function (b, i) {
        if (i === netfoldState.correctOptIndex) b.classList.add('correct');
        else if (i === idx) b.classList.add('wrong');
    });
    // 보기 4개는 그대로 두고, 앞/뒤 두 상자를 각각 제자리에서 펼쳐 보여준다. (끝나면 앞쪽 콜백에서 마무리)
    var t = gameTimeout(function () {
        playNetFoldUnfoldAnim(netfoldState.assign, null, 'netfoldL3Back', isCorrect,
            { prefix: 'nfB', startRotY: 152, caption: '뒤에서 본 상자 펼치기' });
        playNetFoldUnfoldAnim(netfoldState.assign, function () {
            netfoldFinishRound(isCorrect,
                '🎉 정답이에요! 상자가 펼쳐지는 모습대로 전개도를 정확히 찾았어요.',
                '아쉬워요! 상자가 펼쳐지는 모습을 보세요. 초록 테두리가 정답 전개도예요.');
        }, 'netfoldL3Front', isCorrect, { prefix: 'nfF', caption: '앞에서 본 상자 펼치기' });
    }, 400);
}
// 완성된 상자를 다시 전개도로 "느리게" 펼치는 애니메이션 (playNetFoldAssemblyAnim 의 역방향)
// containerId: 애니메이션을 그릴 컨테이너(기본 netfoldStage), wasCorrect: 안내 문구 결정용
// opts.prefix: 요소 id 접두사(같은 화면에 두 개를 동시에 돌릴 때 충돌 방지). opts.startRotY: 시작 각도.
// opts.caption: 상단 문구('' 로 숨김). 기본은 wasCorrect 로 결정.
function playNetFoldUnfoldAnim(assign, onDone, containerId, wasCorrect, opts) {
    opts = opts || {};
    var P = opts.prefix || 'netfold';
    var startRotY = (typeof opts.startRotY === 'number') ? opts.startRotY : -28;
    var target = document.getElementById(containerId || 'netfoldStage');
    if (!target) { if (onDone) onDone(); return; }
    var S = NETFOLD_ANIM_S;
    var sceneW = 4 * S, sceneH = 3 * S;
    function face(idKey, key, extra) {
        var g = NETFOLD_GRID[key];
        return '<div id="' + P + idKey + '" style="position:absolute; left:' + (g.c * S) + 'px; top:' + (g.r * S) + 'px; width:' + S + 'px; height:' + S + 'px; background:#fff; border:2px solid #c18a3d; box-sizing:border-box; display:flex; align-items:center; justify-content:center; font-size:' + (S * 0.5) + 'px; backface-visibility:hidden;' + (extra || '') + '">' + assign[key] + '</div>';
    }
    var tr = 'transition:transform ' + NETFOLD_FOLD_MS + 'ms ease;';
    var html = '';
    if (opts.caption !== '') {
        var capText = opts.caption || ((wasCorrect === false) ? '상자를 펼치면 이런 전개도예요' : '정답! 상자를 천천히 펼쳐볼게요...');
        html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">' + capText + '</div>';
    }
    html += '<div style="width:100%; overflow-x:auto;"><div style="width:' + sceneW + 'px; height:' + (sceneH + 30) + 'px; margin:0.5rem auto; perspective:760px;">';
    html += '<div id="' + P + 'Assembly" style="position:relative; width:' + sceneW + 'px; height:' + sceneH + 'px; margin-top:20px; transform-style:preserve-3d; transform-origin:' + (1.5 * S) + 'px ' + (1.5 * S) + 'px ' + (-0.5 * S) + 'px; transform:rotateX(-20deg) rotateY(' + startRotY + 'deg); transition:transform ' + NETFOLD_SPIN_MS + 'ms ease;">';
    html += face('FaceF', 'F', '');
    html += face('FaceL', 'L', 'transform-origin:right center; transform:rotateY(-90deg);' + tr);
    html += face('FaceT', 'T', 'transform-origin:bottom center; transform:rotateX(90deg);' + tr);
    html += face('FaceBo', 'Bo', 'transform-origin:top center; transform:rotateX(-90deg);' + tr);
    var gr = NETFOLD_GRID.R;
    html += '<div id="' + P + 'FaceR" style="position:absolute; left:' + (gr.c * S) + 'px; top:' + (gr.r * S) + 'px; width:' + S + 'px; height:' + S + 'px; background:#fff; border:2px solid #c18a3d; box-sizing:border-box; display:flex; align-items:center; justify-content:center; font-size:' + (S * 0.5) + 'px; backface-visibility:hidden; transform-style:preserve-3d; transform-origin:left center; transform:rotateY(90deg);' + tr + '">';
    html += assign.R;
    html += '<div id="' + P + 'FaceB" style="position:absolute; left:' + S + 'px; top:0; width:' + S + 'px; height:' + S + 'px; background:#fff; border:2px solid #c18a3d; box-sizing:border-box; display:flex; align-items:center; justify-content:center; font-size:' + (S * 0.5) + 'px; backface-visibility:hidden; transform-origin:left center; transform:rotateY(90deg);' + tr + '">' + assign.B + '</div>';
    html += '</div></div></div></div>';
    target.innerHTML = html;
    var t0 = gameTimeout(function () {
        var assembly = document.getElementById(P + 'Assembly');
        if (assembly) assembly.style.transform = 'rotateX(0deg) rotateY(0deg)';
        var elB = document.getElementById(P + 'FaceB'); if (elB) elB.style.transform = 'rotateY(0deg)';
        var t1 = gameTimeout(function () {
            var elL = document.getElementById(P + 'FaceL'); if (elL) elL.style.transform = 'rotateY(0deg)';
            var elR = document.getElementById(P + 'FaceR'); if (elR) elR.style.transform = 'rotateY(0deg)';
            var elT = document.getElementById(P + 'FaceT'); if (elT) elT.style.transform = 'rotateX(0deg)';
            var elBo = document.getElementById(P + 'FaceBo'); if (elBo) elBo.style.transform = 'rotateX(0deg)';
            var t2 = gameTimeout(function () { if (onDone) onDone(); }, NETFOLD_FOLD_MS + 200);
        }, NETFOLD_FOLD_MS + NETFOLD_STEP_GAP);
    }, 300);
}

// ===================== 게임 등록 =====================
GAME_INIT_FNS.mazeGame = initMazeGame;
GAME_INIT_FNS.topViewMatch = initTopViewMatch;
GAME_INIT_FNS.mapFinder = initMapFinder;
GAME_INIT_FNS.cube3dMatch = initCube3DMatch;
GAME_INIT_FNS.projectionMatch = initProjectionMatch;
GAME_INIT_FNS.coordHunt = initCoordHunt;
GAME_INIT_FNS.gearRotation = initGearRotation;
GAME_INIT_FNS.lightMirrorMaze = initLightMirrorMaze;
GAME_INIT_FNS.paperFold = initPaperFold;
GAME_INIT_FNS.cheeseMaze = initCheeseMaze;
GAME_INIT_FNS.netFoldBox = initNetFoldBox;
