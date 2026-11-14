// ===================== 19. 코딩 사고: 블록코딩 로봇 =====================
var DIRS4 = [
    { name: '오른쪽', dx: 1, dy: 0, wallSide: 'right', arrow: '➡️' },
    { name: '아래', dx: 0, dy: 1, wallSide: 'bottom', arrow: '⬇️' },
    { name: '왼쪽', dx: -1, dy: 0, wallSide: 'left', arrow: '⬅️' },
    { name: '위', dx: 0, dy: -1, wallSide: 'top', arrow: '⬆️' }
];
var BLOCK_TYPES = [
    { type: 'forward', label: '앞으로', shortLabel: '앞으로' },
    { type: 'backward', label: '뒤로', shortLabel: '뒤로' },
    { type: 'turnLeft', label: '왼쪽 돌기', shortLabel: '왼쪽' },
    { type: 'turnRight', label: '오른쪽 돌기', shortLabel: '오른쪽' },
    { type: 'repeatStart', count: 2, label: '🔁 2번 반복 시작', shortLabel: '🔁2' },
    { type: 'repeatStart', count: 3, label: '🔁 3번 반복 시작', shortLabel: '🔁3' },
    { type: 'repeatEnd', label: '⏹ 반복 끝', shortLabel: '⏹' }
];
var blockCodeSettings = { size: 5 };
var blockCodeState = {};
var blockCodeRound = 1, blockCodeSolved = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('blockCoding', { easy: { size: 5 }, normal: { size: 7 }, hard: { size: 9 } });
}
function initBlockCoding() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('blockCoding', blockCodeSettings);
    renderBlockCodeSetup();
}
function renderBlockCodeSetup() {
    var sizes = [{ v: 5, l: '쉬움 (5×5)' }, { v: 7, l: '보통 (7×7)' }, { v: 9, l: '어려움 (9×9)' }];
    var html = '<div class="game-title-box">🧑‍💻 블록코딩 로봇</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요! 명령 블록을 순서대로 쌓아서 캐릭터를 도착지까지 보내는 게임이에요.</div>';
    html += '<div class="setup-section-label">미로 크기</div><div class="setup-btn-group">';
    sizes.forEach(function (t) {
        html += '<button class="setup-btn' + (blockCodeSettings.size === t.v ? ' active' : '') + '" onclick="setBlockCodeSize(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startBlockCodeSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setBlockCodeSize(v) { blockCodeSettings.size = v; renderBlockCodeSetup(); }
function startBlockCodeSession() { blockCodeRound = 1; blockCodeSolved = 0; generateBlockCodeRound(); }
function generateBlockCodeRound() {
    var size = blockCodeSettings.size;
    var maze = buildMaze(size, size);
    blockCodeState = {
        maze: maze, w: size, h: size,
        goal: { x: size - 1, y: size - 1 },
        program: [],
        running: false,
        solved: false,
        buggyIndex: null,
        lastErrorMsg: '',
        debugMode: false,
        selectedEditIndex: null,
        lastFailSnapshot: null,
        player: { x: 0, y: 0 },
        facing: 0,
        stepIndex: 0,
        actions: [],
        sourceIndices: []
    };
    renderBlockCoding();
}
function restartBlockCoding() { renderBlockCodeSetup(); }
function nextBlockCodeRound() { blockCodeRound++; generateBlockCodeRound(); }
function retryBlockCoding() {
    blockCodeState.program = [];
    blockCodeState.running = false;
    blockCodeState.solved = false;
    blockCodeState.buggyIndex = null;
    blockCodeState.lastErrorMsg = '';
    blockCodeState.debugMode = false;
    blockCodeState.selectedEditIndex = null;
    blockCodeState.lastFailSnapshot = null;
    blockCodeState.player = { x: 0, y: 0 };
    blockCodeState.facing = 0;
    blockCodeState.stepIndex = 0;
    blockCodeState.actions = [];
    blockCodeState.sourceIndices = [];
    renderBlockCoding();
}
function pickPaletteBlock(idx) {
    if (blockCodeState.running || blockCodeState.solved) return;
    vibrateShort();
    if (blockCodeState.debugMode) {
        var target = blockCodeState.selectedEditIndex;
        if (target === null || target === undefined) return; // 바꿀 블록을 아직 안 골랐으면 무시
        blockCodeState.program[target] = BLOCK_TYPES[idx];
        if (target === blockCodeState.buggyIndex) {
            blockCodeState.buggyIndex = null;
            blockCodeState.lastErrorMsg = '';
        }
        blockCodeState.debugMode = false;
        blockCodeState.selectedEditIndex = null;
        renderBlockCoding();
        var msg = document.getElementById('blockCodeMsg');
        msg.className = 'msg-box'; msg.style.display = 'block';
        msg.innerText = '✅ 명령을 바꿨어요! "실행"을 눌러 다시 확인해보세요.';
    } else {
        blockCodeState.program.push(BLOCK_TYPES[idx]);
        renderBlockCoding();
    }
}
function selectDebugSlot(i) {
    if (!blockCodeState.debugMode) return;
    if (blockCodeState.running || blockCodeState.solved) return;
    vibrateShort();
    blockCodeState.selectedEditIndex = i;
    renderBlockCoding();
}
function switchToAddMode() {
    if (blockCodeState.running || blockCodeState.solved) return;
    vibrateShort();
    blockCodeState.debugMode = false;
    blockCodeState.selectedEditIndex = null;
    blockCodeState.lastFailSnapshot = null;
    renderBlockCoding();
}
function toggleDebugMode() {
    if (blockCodeState.buggyIndex === null || blockCodeState.buggyIndex === undefined) return;
    if (blockCodeState.running || blockCodeState.solved) return;
    vibrateShort();
    if (blockCodeState.debugMode) {
        blockCodeState.debugMode = false;
        blockCodeState.selectedEditIndex = null;
        renderBlockCoding();
    } else {
        blockCodeState.debugMode = true;
        blockCodeState.selectedEditIndex = blockCodeState.buggyIndex;
        renderBlockCoding();
        var msg = document.getElementById('blockCodeMsg');
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '🔧 변경할 명령 블록을 다시 선택하세요! (노란색이 지금 선택된 블록이에요) 그다음 아래에서 새 명령을 눌러 바꿔보세요.';
    }
}
function undoLastBlockCodeBlock() {
    if (blockCodeState.running || blockCodeState.solved || blockCodeState.debugMode) return;
    vibrateShort();
    blockCodeState.program.pop();
    renderBlockCoding();
}
function expandBlockProgram(program) {
    var result = [];
    var sourceIndices = [];
    var errors = [];
    var i = 0;
    while (i < program.length) {
        var blk = program[i];
        if (blk.type === 'repeatStart') {
            var j = i + 1;
            var body = [];
            var bodyIndices = [];
            var foundEnd = false;
            var nestedError = false;
            while (j < program.length) {
                if (program[j].type === 'repeatEnd') { foundEnd = true; break; }
                if (program[j].type === 'repeatStart') { nestedError = true; break; }
                body.push(program[j]);
                bodyIndices.push(j);
                j++;
            }
            if (nestedError) {
                errors.push('반복 블록 안에는 아직 또 다른 반복 블록을 넣을 수 없어요.');
                break;
            }
            if (!foundEnd) {
                errors.push('"' + blk.label + '" 블록에 짝이 되는 "⏹ 반복 끝" 블록이 없어요.');
                break;
            }
            for (var r = 0; r < blk.count; r++) {
                body.forEach(function (b, bi) { result.push(b); sourceIndices.push(bodyIndices[bi]); });
            }
            i = j + 1;
        } else if (blk.type === 'repeatEnd') {
            errors.push('짝이 되는 "🔁 반복 시작" 블록 없이 "⏹ 반복 끝" 블록만 있어요.');
            break;
        } else {
            result.push(blk);
            sourceIndices.push(i);
            i++;
        }
    }
    return { actions: result, sourceIndices: sourceIndices, errors: errors };
}
function runBlockCodeProgram() {
    if (blockCodeState.running || blockCodeState.solved || blockCodeState.debugMode) return;
    blockCodeState.buggyIndex = null;
    blockCodeState.lastErrorMsg = '';
    var expanded = expandBlockProgram(blockCodeState.program);
    var msg = document.getElementById('blockCodeMsg');
    if (expanded.errors.length > 0) {
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '🚫 ' + expanded.errors[0];
        blockCodeState.lastErrorMsg = expanded.errors[0];
        if (blockCodeState.program.length > 0) blockCodeState.buggyIndex = blockCodeState.program.length - 1;
        renderBlockCoding();
        return;
    }
    if (expanded.actions.length === 0) {
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '먼저 명령 블록을 눌러서 프로그램을 만들어보세요!';
        return;
    }
    blockCodeState.running = true;
    blockCodeState.actions = expanded.actions;
    blockCodeState.sourceIndices = expanded.sourceIndices;
    var snap = blockCodeState.lastFailSnapshot;
    var canResume = snap && snap.expandedPrefix.length > 0 && snap.expandedPrefix.length <= expanded.actions.length &&
        snap.expandedPrefix.every(function (a, idx) { return expanded.actions[idx] === a; });
    if (canResume) {
        blockCodeState.player = { x: snap.player.x, y: snap.player.y };
        blockCodeState.facing = snap.facing;
        blockCodeState.stepIndex = snap.expandedPrefix.length;
    } else {
        blockCodeState.player = { x: 0, y: 0 };
        blockCodeState.facing = 0;
        blockCodeState.stepIndex = 0;
    }
    blockCodeState.lastFailSnapshot = null;
    renderBlockCoding();
    var t = gameTimeout(stepBlockProgram, 450);
}
function stepBlockProgram() {
    if (blockCodeState.stepIndex >= blockCodeState.actions.length) {
        blockCodeState.running = false;
        if (blockCodeState.player.x === blockCodeState.goal.x && blockCodeState.player.y === blockCodeState.goal.y) {
            handleBlockCodeSuccess();
        } else {
            var lastOrig = blockCodeState.sourceIndices.length > 0 ? blockCodeState.sourceIndices[blockCodeState.sourceIndices.length - 1] : blockCodeState.program.length - 1;
            blockCodeState.lastFailSnapshot = {
                expandedPrefix: blockCodeState.actions.slice(0),
                player: { x: blockCodeState.player.x, y: blockCodeState.player.y },
                facing: blockCodeState.facing
            };
            handleBlockCodeFail('프로그램이 다 끝났는데 아직 도착하지 못했어요. 명령을 더 추가하거나 순서를 바꿔보세요.', lastOrig);
        }
        return;
    }
    var action = blockCodeState.actions[blockCodeState.stepIndex];
    if (action.type === 'turnLeft') {
        blockCodeState.facing = (blockCodeState.facing + 3) % 4;
    } else if (action.type === 'turnRight') {
        blockCodeState.facing = (blockCodeState.facing + 1) % 4;
    } else if (action.type === 'forward') {
        var cell = blockCodeState.maze[blockCodeState.player.y][blockCodeState.player.x];
        var curDir = DIRS4[blockCodeState.facing];
        if (cell[curDir.wallSide]) {
            blockCodeState.running = false;
            var origIdx = blockCodeState.sourceIndices[blockCodeState.stepIndex];
            blockCodeState.lastFailSnapshot = {
                expandedPrefix: blockCodeState.actions.slice(0, blockCodeState.stepIndex),
                player: { x: blockCodeState.player.x, y: blockCodeState.player.y },
                facing: blockCodeState.facing
            };
            handleBlockCodeFail('(' + (blockCodeState.stepIndex + 1) + '번째 명령) 벽에 부딪혔어요! 빨간색 블록을 확인하고 고쳐보세요.', origIdx);
            return;
        }
        blockCodeState.player = { x: blockCodeState.player.x + curDir.dx, y: blockCodeState.player.y + curDir.dy };
    } else if (action.type === 'backward') {
        var cell2 = blockCodeState.maze[blockCodeState.player.y][blockCodeState.player.x];
        var oppDir = DIRS4[(blockCodeState.facing + 2) % 4];
        if (cell2[oppDir.wallSide]) {
            blockCodeState.running = false;
            var origIdx2 = blockCodeState.sourceIndices[blockCodeState.stepIndex];
            blockCodeState.lastFailSnapshot = {
                expandedPrefix: blockCodeState.actions.slice(0, blockCodeState.stepIndex),
                player: { x: blockCodeState.player.x, y: blockCodeState.player.y },
                facing: blockCodeState.facing
            };
            handleBlockCodeFail('(' + (blockCodeState.stepIndex + 1) + '번째 명령) 뒤에 벽이 있어요! 빨간색 블록을 확인하고 고쳐보세요.', origIdx2);
            return;
        }
        blockCodeState.player = { x: blockCodeState.player.x + oppDir.dx, y: blockCodeState.player.y + oppDir.dy };
    }
    blockCodeState.stepIndex++;
    renderBlockCoding();
    if (blockCodeState.player.x === blockCodeState.goal.x && blockCodeState.player.y === blockCodeState.goal.y) {
        blockCodeState.running = false;
        handleBlockCodeSuccess();
        return;
    }
    var t = gameTimeout(stepBlockProgram, 450);
}
function handleBlockCodeSuccess() {
    blockCodeState.solved = true;
    blockCodeState.buggyIndex = null;
    blockCodeSolved++;
    if (typeof reportGameOutcome === 'function') reportGameOutcome('win');
    renderBlockCoding();
    var msg = document.getElementById('blockCodeMsg');
    msg.className = 'msg-box'; msg.style.display = 'block';
    msg.innerText = '🎉 성공! 명령 ' + blockCodeState.actions.length + '개로 도착했어요!';
    document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextBlockCodeRound()', 'retryBlockCoding()', 'restartBlockCoding()'));
}
function handleBlockCodeFail(reason, buggyOrigIndex) {
    blockCodeState.buggyIndex = (typeof buggyOrigIndex === 'number') ? buggyOrigIndex : null;
    blockCodeState.lastErrorMsg = reason;
    if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
    renderBlockCoding();
    var msg = document.getElementById('blockCodeMsg');
    msg.className = 'msg-box bad'; msg.style.display = 'block';
    msg.innerText = '🐞 ' + reason + ' 프로그램을 고친 뒤 다시 실행해보세요!';
}
function renderBlockCoding() {
    var html = '<div class="game-title-box">🧑‍💻 블록코딩 로봇</div>';
    html += '<div class="game-sub-desc">명령 블록을 순서대로 눌러 쌓고, "실행"을 눌러 캐릭터를 🏁까지 보내보세요! 틀려도 괜찮아요 — 🐞 디버깅으로 고쳐서 다시 도전하면 돼요.</div>';
    html += '<div class="status-row"><div>' + blockCodeRound + '라운드</div><div>성공: ' + blockCodeSolved + '개</div></div>';
    html += '<div class="maze-wrap">';
    html += '<div class="maze-grid" style="grid-template-columns: repeat(' + blockCodeState.w + ', 36px);">';
    for (var y = 0; y < blockCodeState.h; y++) {
        for (var x = 0; x < blockCodeState.w; x++) {
            var cell = blockCodeState.maze[y][x];
            var style = 'border-top:' + (cell.top ? '2px solid #334155' : 'none') +
                ';border-right:' + (cell.right ? '2px solid #334155' : 'none') +
                ';border-bottom:' + (cell.bottom ? '2px solid #334155' : 'none') +
                ';border-left:' + (cell.left ? '2px solid #334155' : 'none') + ';';
            var content = '';
            if (blockCodeState.player.x === x && blockCodeState.player.y === y) {
                content = '<span style="position:relative; display:inline-block;">🧑<span style="position:absolute; bottom:-8px; right:-12px; font-size:0.85em; background:#fff; border-radius:50%; line-height:1;">' + DIRS4[blockCodeState.facing].arrow + '</span></span>';
            } else if (blockCodeState.goal.x === x && blockCodeState.goal.y === y) content = '🏁';
            html += '<div class="maze-cell" style="' + style + '">' + content + '</div>';
        }
    }
    html += '</div></div>';
    html += '<div class="game-sub-desc" style="text-align:center;">현재 방향: <b style="color:var(--primary);">' + DIRS4[blockCodeState.facing].arrow + ' ' + DIRS4[blockCodeState.facing].name + '</b></div>';
    var paletteLabel = blockCodeState.debugMode ? '🔧 새 명령 선택 (눌러서 교체하기)' : '명령 블록 (눌러서 추가)';
    html += '<div class="setup-section-label">' + paletteLabel + '</div>';
    html += '<div class="palette-row">';
    BLOCK_TYPES.forEach(function (bt, idx) {
        html += '<button class="setup-btn' + (blockCodeState.debugMode ? ' active' : '') + '" style="min-width:auto;' + (blockCodeState.debugMode ? 'border-color:#eab308;' : '') + '" ' + (blockCodeState.running || blockCodeState.solved ? 'disabled' : '') + ' onclick="pickPaletteBlock(' + idx + ')">' + bt.label + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">내 프로그램 (' + blockCodeState.program.length + '개)' + (blockCodeState.debugMode ? ' — 바꿀 블록을 눌러 선택하세요' : '') + '</div>';
    html += '<div class="sequence-answer-row" style="flex-wrap:wrap;">';
    if (blockCodeState.program.length === 0) {
        html += '<div class="game-sub-desc" style="margin:0;">아직 명령이 없어요. 위에서 블록을 눌러 추가해보세요!</div>';
    } else {
        blockCodeState.program.forEach(function (blk, i) {
            var isCurrent = blockCodeState.running && blockCodeState.sourceIndices[blockCodeState.stepIndex] === i;
            var isBuggy = (!blockCodeState.running) && blockCodeState.buggyIndex === i;
            var isSelected = blockCodeState.debugMode && blockCodeState.selectedEditIndex === i;
            var slotStyle = '';
            if (isCurrent) {
                slotStyle = 'background:#fef9c3;border:2px solid #eab308;';
            } else {
                if (isSelected) slotStyle += 'background:#fef9c3;';
                if (isBuggy) slotStyle += 'border:3px solid #ef4444;color:#991b1b;font-weight:800;';
            }
            var clickable = blockCodeState.debugMode ? 'cursor:pointer;' : '';
            html += '<button type="button" class="sequence-answer-slot" ' + (blockCodeState.debugMode ? '' : 'disabled') + ' style="width:auto; min-width:36px; padding:0 0.4rem; font-size:0.9rem;' + slotStyle + clickable + '" onclick="selectDebugSlot(' + i + ')">' + blk.shortLabel + '</button>';
        });
        if (blockCodeState.debugMode) {
            html += '<button type="button" class="sequence-answer-slot" style="width:auto; min-width:36px; padding:0 0.5rem; font-size:0.85rem; cursor:pointer; border-style:dashed; color:var(--primary); font-weight:800;" onclick="switchToAddMode()">다음</button>';
        }
    }
    html += '</div>';
    var hasBug = (blockCodeState.buggyIndex !== null && blockCodeState.buggyIndex !== undefined);
    html += '<div class="options-grid" style="grid-template-columns: 1fr 1fr 1fr;">';
    html += '<button class="action-btn" ' + (blockCodeState.running || blockCodeState.solved || blockCodeState.debugMode ? 'disabled' : '') + ' onclick="runBlockCodeProgram()">▶ 실행</button>';
    html += '<button class="action-btn secondary" ' + (blockCodeState.running || blockCodeState.solved || blockCodeState.debugMode ? 'disabled' : '') + ' onclick="undoLastBlockCodeBlock()">↩ 지우기</button>';
    html += '<button class="action-btn" style="' + (hasBug ? 'background:#ef4444;' : 'background:#d1d5db; color:#9ca3af;') + '" ' + (hasBug ? '' : 'disabled') + ' onclick="toggleDebugMode()">🐞 디버깅' + (blockCodeState.debugMode ? ' 취소' : '') + '</button>';
    html += '</div>';
    html += '<div id="blockCodeMsg" class="msg-box"></div>';
    if (!blockCodeState.solved) {
        html += '<button class="action-btn secondary" style="margin-top:0.4rem; padding:0.5rem; font-size:0.82rem;" onclick="restartBlockCoding()">처음부터 풀기 (다른 미로) 🔄</button>';
    }
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 20. 코딩 사고: 조건문 로봇 (규칙에 따라 여러 단계 이어서 이동) =====================
var condRobotState = {};
var condRobotRound = 1, condRobotCorrect = 0;
function initConditionalRobot() { condRobotRound = 1; condRobotCorrect = 0; generateCondRobotRound(); }
// 🔵(조건 색)의 이동 방향은 "지금 로봇 위치"에 따라 달라진다 → 진짜 만약~라면(if/else)
function condRobotBlueDelta(pos) { return pos > 0 ? -1 : 1; }
function condRobotDeltaAt(rules, symbol, pos) {
    var rule = rules.filter(function (r) { return r.symbol === symbol; })[0];
    return rule.kind === 'cond' ? condRobotBlueDelta(pos) : rule.delta;
}
function generateCondRobotRound() {
    var n = getRandomInt(4, 6);
    var colors = ['🔴', '🟢', '🔵'];
    // 🔴/🟢 는 고정 규칙, 🔵 는 위치에 따라 달라지는 조건 규칙
    var fixedPool = shuffleArray([{ action: '전진', delta: 1 }, { action: '후진', delta: -1 }]);
    var rules = [
        { symbol: '🔴', kind: 'fixed', action: fixedPool[0].action, delta: fixedPool[0].delta },
        { symbol: '🟢', kind: 'fixed', action: fixedPool[1].action, delta: fixedPool[1].delta },
        { symbol: '🔵', kind: 'cond' }
    ];
    var path = [];
    for (var i = 0; i < n; i++) path.push(pickRandom(colors));
    // 조건 규칙이 최소 한 번은 나오도록 보장
    if (path.indexOf('🔵') === -1) { path[getRandomInt(0, n - 1)] = '🔵'; }
    // 한 단계씩 실제로 시뮬레이션 (🔵는 그 순간 위치에 따라 방향이 정해짐)
    var pos = 0, minPos = 0, maxPos = 0;
    path.forEach(function (c) {
        pos += condRobotDeltaAt(rules, c, pos);
        if (pos < minPos) minPos = pos;
        if (pos > maxPos) maxPos = pos;
    });
    var finalPos = pos;
    var candidates = [finalPos];
    [1, -1, 2, -2, 3, -3].forEach(function (d) {
        var v = finalPos + d;
        if (candidates.indexOf(v) === -1 && candidates.length < 4) candidates.push(v);
    });
    while (candidates.length < 4) { candidates.push(candidates[candidates.length - 1] + 1); }
    var trackHalf = Math.max(3, Math.abs(minPos) + 1, Math.abs(maxPos) + 1);
    condRobotState = {
        rules: rules, path: path, finalPos: finalPos, trackHalf: trackHalf,
        options: shuffleArray(candidates),
        phase: 'predict', animIndex: 0, execIndex: -1, currentPos: 0, lastDelta: null,
        chosenOption: null, answered: false
    };
    renderConditionalRobot();
}
function retryCondRobotRound() {
    condRobotState.phase = 'predict';
    condRobotState.answered = false;
    condRobotState.chosenOption = null;
    condRobotState.animIndex = 0;
    condRobotState.execIndex = -1;
    condRobotState.currentPos = 0;
    condRobotState.lastDelta = null;
    renderConditionalRobot();
}
function pickCondRobotGuess(idx) {
    if (condRobotState.phase !== 'predict') return;
    vibrateShort();
    condRobotState.chosenOption = condRobotState.options[idx];
    condRobotState.phase = 'reveal';
    condRobotState.animIndex = 0;
    condRobotState.execIndex = -1;
    condRobotState.currentPos = 0;
    condRobotState.lastDelta = null;
    renderConditionalRobot();
    var t = gameTimeout(stepCondRobotAnim, 550);
}
function stepCondRobotAnim() {
    if (condRobotState.animIndex >= condRobotState.path.length) {
        finishCondRobotRound();
        return;
    }
    var c = condRobotState.path[condRobotState.animIndex];
    vibrateShort();
    // 🔵는 "지금 위치"를 보고 방향을 정한다 (이동 적용 전 위치 기준)
    var delta = condRobotDeltaAt(condRobotState.rules, c, condRobotState.currentPos);
    condRobotState.currentPos += delta;
    condRobotState.lastDelta = delta;
    condRobotState.execIndex = condRobotState.animIndex;
    condRobotState.animIndex++;
    renderConditionalRobot();
    var t = gameTimeout(stepCondRobotAnim, 650);
}
function finishCondRobotRound() {
    condRobotState.answered = true;
    renderConditionalRobot();
    var msg = document.getElementById('condRobotMsg');
    var correct = condRobotState.chosenOption === condRobotState.finalPos;
    if (correct) {
        condRobotCorrect++;
        msg.className = 'msg-box'; msg.style.display = 'block';
        msg.innerText = '🎉 정답이에요! 로봇이 ' + condRobotState.finalPos + '번 칸에 도착했어요.';
    } else {
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '아쉬워요! 실제로는 ' + condRobotState.finalPos + '번 칸에 도착했어요. (내 예측: ' + condRobotState.chosenOption + '번 칸)';
    }
    condRobotRound++;
    document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('generateCondRobotRound()', 'retryCondRobotRound()', 'initConditionalRobot()'));
}
function renderCondRobotTrack() {
    var half = condRobotState.trackHalf || 3;
    var isReveal = condRobotState.phase === 'reveal';
    var cur = isReveal ? condRobotState.currentPos : 0;
    var delta = condRobotState.lastDelta;
    var moving = isReveal && !condRobotState.answered && delta !== null && delta !== undefined;
    var cellPx = 40, gapPx = 4;
    var stepStyle = '';
    if (moving) {
        var fromX = delta > 0 ? -(cellPx + gapPx) : (delta < 0 ? (cellPx + gapPx) : 0);
        stepStyle = ' class="robot-step-move" style="--stepFromX:' + fromX + 'px; --stepFromY:0px;"';
    }
    var html = '<div class="row-label">로봇이 움직이는 길 (🏁 0에서 앞으로 +1, 뒤로 -1)</div>';
    html += '<div style="width:100%; overflow-x:auto;"><div style="display:flex; gap:' + gapPx + 'px; width:max-content; margin:0.4rem auto 0.2rem auto; padding:0.4rem 0.2rem;">';
    for (var p = -half; p <= half; p++) {
        var isHere = p === cur;
        var isStart = p === 0;
        var bg = isHere ? '#fef9c3' : (isStart ? '#e0f2fe' : '#f8fafc');
        var border = isHere ? '#eab308' : (isStart ? '#7dd3fc' : '#cbd5e1');
        var mark = '';
        if (isHere) mark = '<span' + stepStyle + '>🤖</span>';
        else if (isStart) mark = '<span style="opacity:0.55;">🏁</span>';
        html += '<div style="position:relative; width:' + cellPx + 'px; height:48px; flex-shrink:0; background:' + bg +
            '; border:2px solid ' + border + '; border-radius:0.4rem; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">' + mark +
            '<span style="position:absolute; bottom:1px; right:3px; font-size:0.58rem; color:#94a3b8; font-weight:800;">' + p + '</span></div>';
    }
    html += '</div></div>';
    if (isReveal) {
        var dirLabel = '';
        if (moving) dirLabel = delta > 0 ? ' <span style="color:#eab308;">(전진 ▶)</span>' : (delta < 0 ? ' <span style="color:#eab308;">(◀ 후진)</span>' : ' <span style="color:#94a3b8;">(정지)</span>');
        html += '<div class="game-sub-desc" style="text-align:center; font-size:1.25rem; font-weight:800; margin-bottom:0.6rem;">🤖 로봇 위치: <span style="color:var(--primary);">' + cur + '</span>번 칸' + dirLabel + '</div>';
    }
    return html;
}
function renderConditionalRobot() {
    var html = '<div class="game-title-box">🚦 조건문 로봇</div>';
    html += '<div class="game-sub-desc">🔵는 <b>지금 로봇 위치</b>에 따라 방향이 달라져요(만약~라면). 로봇이 길을 끝까지 가면 몇 번 칸에 도착할지 예측해보세요!</div>';
    html += '<div class="status-row"><div>' + condRobotRound + '라운드</div><div>정답: ' + condRobotCorrect + ' / ' + (condRobotRound - 1) + '</div></div>';
    html += '<div class="msg-box" style="display:block; background:#f8fafc; border-color:#e5e7eb; color:#1f2937; text-align:left; line-height:1.9;">';
    condRobotState.rules.forEach(function (r) {
        if (r.kind === 'cond') {
            html += '만약 ' + r.symbol + ' 이면 → <b>지금 위치가 0보다 앞이면 뒤로, 아니면 앞으로</b><br>';
        } else {
            html += '만약 ' + r.symbol + ' 이면 → <b>' + r.action + '</b><br>';
        }
    });
    html += '</div>';
    html += '<div class="row-label">처리할 명령 순서</div>';
    html += '<div class="row-display">';
    condRobotState.path.forEach(function (c, i) {
        var isActive = condRobotState.phase === 'reveal' && !condRobotState.answered && condRobotState.execIndex === i;
        var isPast = condRobotState.phase === 'reveal' && i < condRobotState.animIndex && !isActive;
        var style = isActive ? 'border-color:#eab308; background:#fef9c3;' : (isPast ? 'opacity:0.35;' : '');
        html += '<div class="row-box" style="' + style + '">' + c + '</div>';
    });
    html += '</div>';
    html += renderCondRobotTrack();
    if (condRobotState.phase === 'predict') {
        html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">로봇은 최종적으로 몇 번 칸에 도착할까요?</div>';
        html += '<div class="options-grid">';
        condRobotState.options.forEach(function (opt, idx) {
            html += '<button class="opt-btn text-opt" onclick="pickCondRobotGuess(' + idx + ')">' + opt + '번 칸</button>';
        });
        html += '</div>';
    }
    html += '<div id="condRobotMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 21. 코딩 사고: 명령 미리보기 (벽 없는 열린 공간에서 순서 읽고 예측) =====================
var CMD_WORD_MAP = { forward: '앞으로', backward: '뒤로', turnLeft: '왼쪽', turnRight: '오른쪽' };
var codeTraceState = {};
var codeTraceRound = 1, codeTraceCorrect = 0;
var codeTraceSettings = { size: 'medium', count: 4 };
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('codeTrace', {
        easy: { size: 'easy', count: 4 },
        normal: { size: 'medium', count: 4 },
        hard: { size: 'hard', count: 8 }
    });
}
function initCodeTrace() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('codeTrace', codeTraceSettings);
    renderCodeTraceSetup();
}
function renderCodeTraceSetup() {
    var sizes = [{ v: 'easy', l: '쉬움' }, { v: 'medium', l: '보통' }, { v: 'hard', l: '어려움' }, { v: 'random', l: '무작위' }];
    var counts = [{ v: 4, l: '4개' }, { v: 6, l: '6개' }, { v: 8, l: '8개' }, { v: 'random', l: '무작위' }];
    var html = '<div class="game-title-box">🔍 명령 미리보기</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">맵 크기</div><div class="setup-btn-group">';
    sizes.forEach(function (t) {
        html += '<button class="setup-btn' + (codeTraceSettings.size === t.v ? ' active' : '') + '" onclick="setCodeTraceSize(\'' + t.v + '\')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">명령 개수</div><div class="setup-btn-group">';
    counts.forEach(function (t) {
        html += '<button class="setup-btn' + (codeTraceSettings.count === t.v ? ' active' : '') + '" onclick="setCodeTraceCount(' + (typeof t.v === 'string' ? "'" + t.v + "'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startCodeTraceSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setCodeTraceSize(v) { codeTraceSettings.size = v; renderCodeTraceSetup(); }
function setCodeTraceCount(v) { codeTraceSettings.count = v; renderCodeTraceSetup(); }
function startCodeTraceSession() { codeTraceRound = 1; codeTraceCorrect = 0; generateCodeTraceRound(); }
function resolveCodeTraceSize() {
    var sizeMap = { easy: 4, medium: 5, hard: 6 };
    var s = codeTraceSettings.size;
    if (s === 'random') s = pickRandom(['easy', 'medium', 'hard']);
    return sizeMap[s];
}
function resolveCodeTraceCount() {
    var c = codeTraceSettings.count;
    if (c === 'random') return pickRandom([4, 6, 8]);
    return c;
}
function generateCodeTraceRound() {
    var size = resolveCodeTraceSize();
    var n = resolveCodeTraceCount();
    var pos = { x: 0, y: 0 }, facing = 0;
    var program = [];
    for (var i = 0; i < n; i++) {
        var d = DIRS4[facing];
        var fwdX = pos.x + d.dx, fwdY = pos.y + d.dy;
        var oppD = DIRS4[(facing + 2) % 4];
        var backX = pos.x + oppD.dx, backY = pos.y + oppD.dy;
        var choices = ['turnLeft', 'turnRight'];
        if (fwdX >= 0 && fwdX < size && fwdY >= 0 && fwdY < size) { choices.push('forward', 'forward'); }
        if (backX >= 0 && backX < size && backY >= 0 && backY < size) { choices.push('backward'); }
        var cmd = pickRandom(choices);
        if (cmd === 'forward') { pos = { x: fwdX, y: fwdY }; }
        else if (cmd === 'backward') { pos = { x: backX, y: backY }; }
        else if (cmd === 'turnLeft') facing = (facing + 3) % 4;
        else facing = (facing + 1) % 4;
        program.push(cmd);
    }
    var finalPos = pos;

    function simulate(overrideTurn) {
        var p = { x: 0, y: 0 }, f = 0;
        program.forEach(function (c) {
            if (c === 'turnLeft') f = (f + (overrideTurn ? 1 : 3)) % 4;
            else if (c === 'turnRight') f = (f + (overrideTurn ? 3 : 1)) % 4;
            else {
                var dir = (c === 'forward') ? DIRS4[f] : DIRS4[(f + 2) % 4];
                p = { x: p.x + dir.dx, y: p.y + dir.dy };
            }
        });
        return p;
    }
    var ignoreTurnsPos = (function () {
        var p = { x: 0, y: 0 };
        program.forEach(function (c) { if (c === 'forward') p = { x: p.x + 1, y: p.y }; });
        return p;
    })();
    var swappedTurnsPos = simulate(true);
    var skipLastPos = (function () {
        var savedLast = program[program.length - 1];
        program.pop();
        var p = simulate(false);
        program.push(savedLast);
        return p;
    })();

    var candidates = [finalPos];
    [ignoreTurnsPos, swappedTurnsPos, skipLastPos].forEach(function (p) {
        var exists = candidates.some(function (c) { return c.x === p.x && c.y === p.y; });
        if (!exists && p.x >= 0 && p.x < size && p.y >= 0 && p.y < size && candidates.length < 4) candidates.push(p);
    });
    var guard = 0;
    while (candidates.length < 4 && guard < 30) {
        guard++;
        var rx = getRandomInt(0, size - 1), ry = getRandomInt(0, size - 1);
        var exists2 = candidates.some(function (c) { return c.x === rx && c.y === ry; });
        if (!exists2) candidates.push({ x: rx, y: ry });
    }

    codeTraceState = {
        size: size, program: program, finalPos: finalPos,
        options: shuffleArray(candidates),
        phase: 'predict', chosen: null, animIndex: 0, execIndex: -1,
        lastMoveVec: null, lastTurnDeg: 0,
        pos: { x: 0, y: 0 }, facing: 0, answered: false
    };
    renderCodeTrace();
}
function retryCodeTraceRound() {
    codeTraceState.phase = 'predict';
    codeTraceState.chosen = null;
    codeTraceState.animIndex = 0;
    codeTraceState.execIndex = -1;
    codeTraceState.lastMoveVec = null;
    codeTraceState.lastTurnDeg = 0;
    codeTraceState.pos = { x: 0, y: 0 };
    codeTraceState.facing = 0;
    codeTraceState.answered = false;
    renderCodeTrace();
}
function pickCodeTraceGuess(idx) {
    if (codeTraceState.phase !== 'predict') return;
    vibrateShort();
    codeTraceState.chosen = codeTraceState.options[idx];
    codeTraceState.phase = 'reveal';
    codeTraceState.animIndex = 0;
    codeTraceState.execIndex = -1;
    codeTraceState.lastMoveVec = null;
    codeTraceState.lastTurnDeg = 0;
    codeTraceState.pos = { x: 0, y: 0 };
    codeTraceState.facing = 0;
    renderCodeTrace();
    var t = gameTimeout(stepCodeTraceAnim, 500);
}
function stepCodeTraceAnim() {
    if (codeTraceState.animIndex >= codeTraceState.program.length) {
        finishCodeTraceRound();
        return;
    }
    var cmd = codeTraceState.program[codeTraceState.animIndex];
    vibrateShort();
    // 명령이 실행되는 그 순간에 아이콘이 그 방향으로 발을 내딛도록(시차 없음)
    var moveVec = null, turnDeg = 0;
    if (cmd === 'turnLeft') { codeTraceState.facing = (codeTraceState.facing + 3) % 4; turnDeg = -55; }
    else if (cmd === 'turnRight') { codeTraceState.facing = (codeTraceState.facing + 1) % 4; turnDeg = 55; }
    else {
        var d = (cmd === 'forward') ? DIRS4[codeTraceState.facing] : DIRS4[(codeTraceState.facing + 2) % 4];
        codeTraceState.pos = { x: codeTraceState.pos.x + d.dx, y: codeTraceState.pos.y + d.dy };
        moveVec = d;
    }
    codeTraceState.execIndex = codeTraceState.animIndex;
    codeTraceState.lastMoveVec = moveVec;
    codeTraceState.lastTurnDeg = turnDeg;
    codeTraceState.animIndex++;
    renderCodeTrace();
    var t = gameTimeout(stepCodeTraceAnim, 500);
}
function finishCodeTraceRound() {
    codeTraceState.answered = true;
    renderCodeTrace();
    var msg = document.getElementById('codeTraceMsg');
    var correct = codeTraceState.chosen.x === codeTraceState.finalPos.x && codeTraceState.chosen.y === codeTraceState.finalPos.y;
    if (typeof reportGameOutcome === 'function') reportGameOutcome(correct ? 'win' : 'lose');
    if (correct) {
        codeTraceCorrect++;
        msg.className = 'msg-box'; msg.style.display = 'block';
        msg.innerText = '🎉 정답이에요! 정확히 예측했어요.';
    } else {
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '아쉬워요! 실제 도착 위치는 (' + (codeTraceState.finalPos.x + 1) + ', ' + (codeTraceState.finalPos.y + 1) + ')였어요.';
    }
    codeTraceRound++;
    document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('generateCodeTraceRound()', 'retryCodeTraceRound()', 'renderCodeTraceSetup()'));
}
function renderCodeTrace() {
    var html = '<div class="game-title-box">🔍 명령 미리보기</div>';
    html += '<div class="game-sub-desc">아래 명령을 순서대로 실행하면 로봇이 어디에 도착할지 예측해보세요! (벽은 없어요)</div>';
    html += '<div class="status-row"><div>' + codeTraceRound + '라운드</div><div>정답: ' + codeTraceCorrect + ' / ' + (codeTraceRound - 1) + '</div></div>';
    html += '<div class="row-label">실행할 명령</div><div class="row-display" style="flex-wrap:wrap;">';
    codeTraceState.program.forEach(function (cmd, i) {
        var isActive = codeTraceState.phase === 'reveal' && !codeTraceState.answered && codeTraceState.execIndex === i;
        var isPast = codeTraceState.phase === 'reveal' && i < codeTraceState.animIndex && !isActive;
        var style = isActive ? 'border-color:#eab308; background:#fef9c3;' : (isPast ? 'opacity:0.35;' : '');
        html += '<div class="row-box" style="width:auto; min-width:46px; padding:0 0.3rem; font-size:0.72rem; font-weight:800;' + style + '">' + CMD_WORD_MAP[cmd] + '</div>';
    });
    html += '</div>';
    var ctMoving = codeTraceState.phase === 'reveal' && !codeTraceState.answered;
    html += '<div class="maze-wrap"><div class="maze-grid" style="grid-template-columns: repeat(' + codeTraceState.size + ', 32px);">';
    for (var y = 0; y < codeTraceState.size; y++) {
        for (var x = 0; x < codeTraceState.size; x++) {
            var content = '';
            var showX = codeTraceState.phase === 'reveal' ? codeTraceState.pos.x : 0;
            var showY = codeTraceState.phase === 'reveal' ? codeTraceState.pos.y : 0;
            var showFacing = codeTraceState.phase === 'reveal' ? codeTraceState.facing : 0;
            if (showX === x && showY === y) {
                var stepCls = '', stepVar = '';
                if (ctMoving && codeTraceState.lastMoveVec) {
                    stepCls = ' robot-step-move';
                    stepVar = '--stepFromX:' + (-(codeTraceState.lastMoveVec.dx) * 35) + 'px; --stepFromY:' + (-(codeTraceState.lastMoveVec.dy) * 35) + 'px;';
                } else if (ctMoving && codeTraceState.lastTurnDeg) {
                    stepCls = ' robot-turn-wiggle';
                    stepVar = '--turnDeg:' + codeTraceState.lastTurnDeg + 'deg;';
                }
                content = '<span class="' + stepCls.trim() + '" style="position:relative; display:inline-block;' + stepVar + '">🧑<span style="position:absolute; bottom:-8px; right:-12px; font-size:0.85em; background:#fff; border-radius:50%; line-height:1;">' + DIRS4[showFacing].arrow + '</span></span>';
            }
            html += '<div class="maze-cell" style="border:1px solid #e2e8f0;">' + content + '</div>';
        }
    }
    html += '</div></div>';
    html += '<div class="game-sub-desc" style="text-align:center;">현재 방향: <b style="color:var(--primary);">' + DIRS4[codeTraceState.phase === 'reveal' ? codeTraceState.facing : 0].arrow + ' ' + DIRS4[codeTraceState.phase === 'reveal' ? codeTraceState.facing : 0].name + '</b></div>';
    if (codeTraceState.phase === 'predict') {
        html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">로봇은 어디에 도착할까요? (가로, 세로)</div>';
        html += '<div class="options-grid">';
        codeTraceState.options.forEach(function (opt, idx) {
            html += '<button class="opt-btn text-opt" onclick="pickCodeTraceGuess(' + idx + ')">(' + (opt.x + 1) + ', ' + (opt.y + 1) + ')</button>';
        });
        html += '</div>';
    }
    html += '<div id="codeTraceMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 22. 코딩 사고: 변수 점수 만들기 (직접 모아보며 체험) =====================
var VARIABLE_EVENT_POOL = [
    { icon: '🍎', label: '사과', delta: 2 },
    { icon: '⭐', label: '별', delta: 3 },
    { icon: '👻', label: '유령', delta: -1 },
    { icon: '🍄', label: '버섯', delta: 1 },
    { icon: '💣', label: '폭탄', delta: -2 },
    { icon: '🪙', label: '동전', delta: 1 }
];
var variableState = {};
var variableRound = 1, variableSolved = 0;
function initVariableScore() { variableRound = 1; variableSolved = 0; generateVariableRound(); }
function generateVariableRound() {
    var n = getRandomInt(5, 7);
    var items = [];
    for (var i = 0; i < n; i++) { items.push(pickRandom(VARIABLE_EVENT_POOL)); }
    var pickCount = getRandomInt(2, Math.min(4, n));
    var shuffledIdx = shuffleArray(items.map(function (_, i2) { return i2; })).slice(0, pickCount);
    var target = shuffledIdx.reduce(function (sum, idx) { return sum + items[idx].delta; }, 0);
    if (target <= 0) target = Math.max(1, target + 3);
    variableState = { items: items, collected: [], score: 0, target: target, solved: false, failed: false };
    renderVariableScore();
}
function collectVariableItem(idx) {
    if (variableState.solved || variableState.failed) return;
    if (variableState.collected.indexOf(idx) > -1) return;
    vibrateShort();
    variableState.collected.push(idx);
    variableState.score += variableState.items[idx].delta;
    var reachedTarget = variableState.score >= variableState.target;
    var usedAll = variableState.collected.length === variableState.items.length;
    if (reachedTarget) variableState.solved = true;
    else if (usedAll) variableState.failed = true;
    renderVariableScore();
    var msg = document.getElementById('variableMsg');
    if (reachedTarget) {
        variableSolved++;
        msg.className = 'msg-box'; msg.style.display = 'block';
        msg.innerText = '🎉 목표 점수를 달성했어요! (' + variableState.score + '점)';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextVariableRound()', 'retryVariableRound()', 'initVariableScore()'));
    } else if (usedAll) {
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '아쉬워요! 목표에 도달하지 못했어요. "다시 모으기"를 눌러 다른 순서로 시도해보세요.';
    }
}
function nextVariableRound() { variableRound++; generateVariableRound(); }
function resetVariableRound() {
    if (variableState.solved) return;
    vibrateShort();
    variableState.collected = [];
    variableState.score = 0;
    variableState.failed = false;
    renderVariableScore();
}
function retryVariableRound() {
    variableState.collected = [];
    variableState.score = 0;
    variableState.failed = false;
    variableState.solved = false;
    renderVariableScore();
}
function renderVariableScore() {
    var html = '<div class="game-title-box">🔢 변수 점수 만들기</div>';
    html += '<div class="game-sub-desc">아이템을 눌러서 점수를 모아보세요! 점수는 오르기도 하고 내려가기도 해요.</div>';
    html += '<div class="status-row"><div>' + variableRound + '라운드</div><div>성공: ' + variableSolved + '개</div></div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-size:1.4rem; font-weight:800;">현재 점수: <span style="color:var(--primary);">' + variableState.score + '점</span> / 목표: ' + variableState.target + '점</div>';
    html += '<div class="palette-row">';
    variableState.items.forEach(function (e, idx) {
        var collected = variableState.collected.indexOf(idx) > -1;
        html += '<button class="setup-btn" style="min-width:56px;' + (collected ? 'opacity:0.35;' : '') + '" ' + (collected || variableState.solved || variableState.failed ? 'disabled' : '') + ' onclick="collectVariableItem(' + idx + ')">' + e.icon + '<br><span style="font-size:0.65rem;">' + (e.delta > 0 ? '+' : '') + e.delta + '</span></button>';
    });
    html += '</div>';
    if (!variableState.solved) {
        html += '<button class="action-btn secondary" onclick="resetVariableRound()">🔄 다시 모으기</button>';
    }
    html += '<div id="variableMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 23. 코딩 사고: 나만의 명령 만들기 (반복되는 단위를 함수로 인식) =====================
var functionState = {};
var functionRound = 1, functionCorrect = 0;
var FUNC_SHORT = { forward: '앞으로', backward: '뒤로', turnLeft: '왼쪽', turnRight: '오른쪽' };
var FUNC_CMD_POOL = ['forward', 'backward', 'turnLeft', 'turnRight'];
function initFunctionFinder() { functionRound = 1; functionCorrect = 0; generateFunctionRound(); }
function seqToLabel(seq) { return seq.map(function (c) { return FUNC_SHORT[c]; }).join(' → '); }
function generateFunctionRound() {
    var unitLen = getRandomInt(2, 3);
    var repeatCount = getRandomInt(2, 3);
    var unit = [];
    for (var i = 0; i < unitLen; i++) { unit.push(pickRandom(FUNC_CMD_POOL)); }
    var full = [];
    for (var r = 0; r < repeatCount; r++) { unit.forEach(function (c) { full.push(c); }); }
    var decoys = [];
    var guard = 0;
    while (decoys.length < 3 && guard < 50) {
        guard++;
        var cand = [];
        for (var j = 0; j < unitLen; j++) cand.push(pickRandom(FUNC_CMD_POOL));
        var sameAsUnit = cand.every(function (c, idx) { return c === unit[idx]; });
        var dup = decoys.some(function (d) { return d.every(function (c, idx) { return c === cand[idx]; }); });
        if (!sameAsUnit && !dup) decoys.push(cand);
    }
    var options = shuffleArray([unit].concat(decoys));
    functionState = { unit: unit, repeatCount: repeatCount, full: full, options: options, answered: false };
    renderFunctionFinder();
}
function functionChoiceCfg() {
    var s = functionState;
    return {
        msgId: 'functionMsg',
        ok: '🎉 정답이에요! 이 함수를 ' + s.repeatCount + '번 부르면 전체 명령과 똑같아요.',
        bad: '아쉬워요! 정답은 "' + seqToLabel(s.unit) + '" 였어요.',
        onCorrect: function () { functionCorrect++; },
        onResolved: function () { functionRound++; },
        next: 'generateFunctionRound()', retry: 'retryFunctionFinder()', home: 'initFunctionFinder()',
        failStyle: 'standard'
    };
}
function renderFunctionFinder() {
    var s = functionState;
    var html = '<div class="game-title-box">📦 나만의 명령 만들기</div>';
    html += '<div class="game-sub-desc">아래의 긴 명령은 사실 짧은 명령을 <b style="color:var(--primary);">' + s.repeatCount + '번</b> 반복한 거예요. 반복되는 부분(함수)이 무엇인지 찾아보세요!</div>';
    html += '<div class="status-row"><div>' + functionRound + '라운드</div><div>정답: ' + functionCorrect + ' / ' + (functionRound - 1) + '</div></div>';
    html += '<div class="row-label">전체 명령</div><div class="row-display">';
    s.full.forEach(function (c) { html += '<div class="row-box" style="width:auto; min-width:46px; padding:0 0.3rem; font-size:0.72rem; font-weight:800;">' + FUNC_SHORT[c] + '</div>'; });
    html += '</div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">이 함수를 ' + s.repeatCount + '번 반복하면 될까요?</div>';
    var cfg = functionChoiceCfg();
    html += choiceOptionsHtml(s.options.map(function (opt) { return seqToLabel(opt); }), cfg);
    document.getElementById('mainArea').innerHTML = html;
    choiceBegin(s.options.indexOf(s.unit), cfg);
}
function retryFunctionFinder() { renderFunctionFinder(); }

// ===================== 24. 코딩 사고: 최소 명령 개수 맞추기 (효율적으로 생각하기) =====================
var efficiencyState = {};
var efficiencyRound = 1, efficiencyCorrect = 0;
var efficiencySettings = { level: 'medium' };
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('efficiencyGuess', { easy: { level: 'low' }, normal: { level: 'medium' }, hard: { level: 'high' } });
}
function initEfficiencyGuess() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('efficiencyGuess', efficiencySettings);
    renderEfficiencySetup();
}
function renderEfficiencySetup() {
    var levels = [{ v: 'low', l: '쉬움' }, { v: 'medium', l: '보통' }, { v: 'high', l: '어려움' }, { v: 'random', l: '무작위' }];
    var html = '<div class="game-title-box">⚡ 최소 명령 개수 맞추기</div>';
    html += '<div class="game-sub-desc">난이도를 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    levels.forEach(function (t) {
        html += '<button class="setup-btn' + (efficiencySettings.level === t.v ? ' active' : '') + '" onclick="setEfficiencyLevel(\'' + t.v + '\')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startEfficiencySession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setEfficiencyLevel(v) { efficiencySettings.level = v; renderEfficiencySetup(); }
function startEfficiencySession() { efficiencyRound = 1; efficiencyCorrect = 0; generateEfficiencyRound(); }
function resolveEfficiencyRange() {
    var lv = efficiencySettings.level;
    if (lv === 'random') lv = pickRandom(['low', 'medium', 'high']);
    if (lv === 'low') return [1, 3];
    if (lv === 'high') return [5, 8];
    return [3, 5];
}
function generateEfficiencyRound() {
    var range = resolveEfficiencyRange();
    var R = getRandomInt(range[0], range[1]), D = getRandomInt(range[0], range[1]);
    var minCommands = R + D + 1;
    var options = [minCommands];
    [1, -1, 2, -2].forEach(function (d) {
        var v = minCommands + d;
        if (v > 0 && options.indexOf(v) === -1 && options.length < 4) options.push(v);
    });
    while (options.length < 4) { options.push(options[options.length - 1] + 1); }
    efficiencyState = { r: R, d: D, minCommands: minCommands, options: shuffleArray(options), answered: false };
    renderEfficiencyGuess();
}
function efficiencyChoiceCfg() {
    var s = efficiencyState;
    return {
        msgId: 'efficiencyMsg',
        ok: '🎉 정답이에요! 오른쪽 ' + s.r + '번 + 회전 1번 + 아래 ' + s.d + '번 = ' + s.minCommands + '개예요.',
        bad: '아쉬워요! 정답은 ' + s.minCommands + '개였어요.',
        onCorrect: function () { efficiencyCorrect++; },
        onResolved: function () { efficiencyRound++; },
        next: 'generateEfficiencyRound()', retry: 'retryEfficiencyGuess()', home: 'initEfficiencyGuess()',
        failStyle: 'standard'
    };
}
function renderEfficiencyGuess() {
    var s = efficiencyState;
    var html = '<div class="game-title-box">⚡ 최소 명령 개수 맞추기</div>';
    html += '<div class="game-sub-desc">로봇이 오른쪽으로 <b style="color:var(--primary);">' + s.r + '칸</b>, 아래로 <b style="color:var(--primary);">' + s.d + '칸</b> 가야 도착해요. 전진과 회전을 각각 명령 1개로 셀 때, 최소 몇 개의 명령이면 도착할 수 있을까요?</div>';
    html += '<div class="status-row"><div>' + efficiencyRound + '라운드</div><div>정답: ' + efficiencyCorrect + ' / ' + (efficiencyRound - 1) + '</div></div>';
    var cfg = efficiencyChoiceCfg();
    html += choiceOptionsHtml(s.options.map(function (o) { return o + '개'; }), cfg);
    document.getElementById('mainArea').innerHTML = html;
    choiceBegin(s.options.indexOf(s.minCommands), cfg);
}
function retryEfficiencyGuess() { renderEfficiencyGuess(); }

// ===================== 25. 코딩 사고: AND OR 스위치 놀이 (논리 게이트) =====================
var logicGateState = {};
var logicGateRound = 1, logicGateCorrect = 0;
function initLogicGate() { logicGateRound = 1; logicGateCorrect = 0; generateLogicGateRound(); }
function generateLogicGateRound() {
    var gate = pickRandom(['AND', 'OR']);
    var sw1 = pickRandom([true, false]);
    var sw2 = pickRandom([true, false]);
    var result = gate === 'AND' ? (sw1 && sw2) : (sw1 || sw2);
    logicGateState = { gate: gate, sw1: sw1, sw2: sw2, result: result, answered: false };
    renderLogicGate();
}
function logicGateChoiceCfg() {
    var r = logicGateState.result;
    return {
        msgId: 'logicGateMsg',
        ok: '🎉 정답이에요! ' + (r ? '전구가 켜져요.' : '전구가 꺼져있어요.'),
        bad: '아쉬워요! 실제로는 ' + (r ? '켜져요.' : '꺼져있어요.'),
        onCorrect: function () { logicGateCorrect++; },
        onResolved: function () { logicGateRound++; },
        next: 'generateLogicGateRound()', retry: 'retryLogicGate()', home: 'initLogicGate()',
        failStyle: 'standard'
    };
}
function renderLogicGate() {
    var s = logicGateState;
    var html = '<div class="game-title-box">💡 AND OR 스위치 놀이</div>';
    var gateDesc = s.gate === 'AND'
        ? '이 전구는 <b style="color:var(--primary);">AND</b> 규칙이에요. 스위치가 <b>둘 다 켜져야</b> 불이 켜져요!'
        : '이 전구는 <b style="color:var(--primary);">OR</b> 규칙이에요. 스위치가 <b>하나라도 켜지면</b> 불이 켜져요!';
    html += '<div class="game-sub-desc">' + gateDesc + '</div>';
    html += '<div class="status-row"><div>' + logicGateRound + '라운드</div><div>정답: ' + logicGateCorrect + ' / ' + (logicGateRound - 1) + '</div></div>';
    html += '<div class="msg-box" style="display:block; background:#f8fafc; border-color:#e5e7eb; text-align:center; font-size:2rem;">';
    html += (s.sw1 ? '🟢' : '⚫') + ' 스위치1 &nbsp;&nbsp; ' + (s.sw2 ? '🟢' : '⚫') + ' 스위치2';
    html += '</div>';
    html += '<div class="game-sub-desc" style="text-align:center; font-weight:800;">전구는 켜질까요, 꺼질까요?</div>';
    var cfg = logicGateChoiceCfg();
    html += choiceOptionsHtml(['💡 켜진다', '⚫ 꺼진다'], cfg);
    document.getElementById('mainArea').innerHTML = html;
    choiceBegin(s.result ? 0 : 1, cfg);
}
function retryLogicGate() { renderLogicGate(); }

// ===================== 30. 코딩 사고: 햄버거 만들기 (순차+선행조건 개념, 실제 실행) =====================
var HAMBURGER_RECIPES = [
    { name: '치즈버거', layers: ['🍞', '🥩', '🧀', '🍞'] },
    { name: '야채버거', layers: ['🍞', '🥬', '🍅', '🥒', '🍞'] },
    { name: '더블치즈버거', layers: ['🍞', '🥩', '🧀', '🥩', '🧀', '🍞'] },
    { name: '불고기버거', layers: ['🍞', '🥩', '🧅', '🍅', '🍞'] },
    { name: '베이컨버거', layers: ['🍞', '🥓', '🧀', '🥬', '🍞'] },
    { name: '스페셜버거', layers: ['🍞', '🥬', '🥩', '🧀', '🍅', '🍞'] },
    { name: '단짠버거', layers: ['🍞', '🥓', '🍯', '🧀', '🍞'] },
    { name: '아보카도버거', layers: ['🍞', '🥑', '🥩', '🍅', '🍞'] }
];
var GRILLABLE_ITEMS = ['🥩', '🥓'];
var BURGER_ACTIONS_BASE = [
    { type: 'grill', label: '🔥 굽기' },
    { type: 'serve', label: '🍽️ 포장' }
];
var BURGER_VISUAL = {
    '🍞': { color: '#e3a857', dark: '#c18a3d' },
    '🥩': { color: '#6b3a1f', dark: '#4a2712' },
    '🧀': { color: '#f9c74f', dark: '#e0a92e' },
    '🥬': { color: '#7cb342', dark: '#5a8f2a' },
    '🍅': { color: '#e5533d', dark: '#c23f2b' },
    '🥒': { color: '#8bc34a', dark: '#6a9c34' },
    '🧅': { color: '#f3e9f7', dark: '#d9c2e0' },
    '🥓': { color: '#c1544a', dark: '#8f362e' },
    '🍯': { color: '#f4a825', dark: '#d68e12' },
    '🥑': { color: '#a8c256', dark: '#87a13c' }
};
// 실제 재료 사진(투명 배경 PNG, images/hamburger 폴더에 있음)
var HAMBURGER_IMG_BASE = 'images/hamburger/';
var HAMBURGER_IMG = {
    bunBottom: HAMBURGER_IMG_BASE + '햄버거재료_아래빵.png',
    bunTop: HAMBURGER_IMG_BASE + '햄버거재료_윗빵.png',
    pattyRaw: HAMBURGER_IMG_BASE + '햄버거재료_생패티.png',
    pattyCooked: HAMBURGER_IMG_BASE + '햄버거재료_구운패티.png',
    baconRaw: HAMBURGER_IMG_BASE + '햄버거재료_생베이컨.png',
    baconCooked: HAMBURGER_IMG_BASE + '햄버거재료_구운베이컨.png',
    grillPan: HAMBURGER_IMG_BASE + '햄버거재료_굽기.png',
    wrapPaper: HAMBURGER_IMG_BASE + '햄버거재료_포장지.png',
    '🧀': HAMBURGER_IMG_BASE + '햄버거재료_치즈.png',
    '🥬': HAMBURGER_IMG_BASE + '햄버거재료_상추.png',
    '🍅': HAMBURGER_IMG_BASE + '햄버거재료_토마토.png',
    '🧅': HAMBURGER_IMG_BASE + '햄버거재료_양파.png',
    '🍯': HAMBURGER_IMG_BASE + '햄버거재료_시럽.png',
    '🥑': HAMBURGER_IMG_BASE + '햄버거재료_아보카도.png',
    '🥒': HAMBURGER_IMG_BASE + '햄버거재료_오이.png'
};
function hamburgerRawImg(item) { return item === '🥩' ? HAMBURGER_IMG.pattyRaw : HAMBURGER_IMG.baconRaw; }
function hamburgerCookedImg(item) { return item === '🥩' ? HAMBURGER_IMG.pattyCooked : HAMBURGER_IMG.baconCooked; }
// 빵 이미지는 위치가 아니라 "선택 순서"로 결정: 먼저 고른 빵 = 아래빵, 나중에 고른 빵 = 윗빵
function getBurgerIngredientImg(item, idx, firstBunIdx) {
    if (item === '🍞') return idx === firstBunIdx ? HAMBURGER_IMG.bunBottom : HAMBURGER_IMG.bunTop;
    if (GRILLABLE_ITEMS.indexOf(item) > -1) return hamburgerCookedImg(item);
    return HAMBURGER_IMG[item] || null;
}
// 이미지 한 장을 그림: marginTopExpr로 바로 아래 이미지의 세로 50% 지점에 겹치도록 하고,
// z-index는 쌓인 순서(나중에 놓을수록 앞으로) 그대로 사용
function renderBurgerImgHtml(src, marginTopExpr, zIndex, animClass, styleExtra) {
    return '<img src="' + src + '" class="burger-ing-img ' + animClass + '" style="position:relative; margin-top:' + marginTopExpr + '; z-index:' + zIndex + ';' + (styleExtra || '') + '" alt="">';
}
function renderBurgerFallbackHtml(item, marginTopExpr, zIndex, animClass, styleExtra) {
    var vv = BURGER_VISUAL[item] || { color: '#cccccc', dark: '#999999' };
    return '<div class="burger-ing-img ' + animClass + '" style="position:relative; margin-top:' + marginTopExpr + '; z-index:' + zIndex + '; width:var(--iw); height:var(--ih); border-radius:40%; background:' + vv.color + '; border:2px solid ' + vv.dark + '; display:flex; align-items:center; justify-content:center; font-size:0.95rem;' + (styleExtra || '') + '">' + item + '</div>';
}
// 왼쪽: 포장지(맨 아래, 고정) 위에 지금까지 쌓은 재료가 순서대로 겹쳐 올라감
// 화면에는 [맨 나중에 놓은 재료, ..., 맨 처음 놓은 재료(아래빵), 포장지] 순서로 그려지는데(위->아래),
// CSS margin-top은 항상 "바로 위(먼저 그려진) 요소"와의 간격을 줄이는 것이므로, 매 요소는 자기 자신의
// 높이의 -50%를 margin-top으로 가져야 "다음 요소가 내 높이의 50% 지점까지 파고든다"가 성립한다.
// (포장지도 마찬가지: 포장지의 -50%*ph가 있어야 그 위의 첫 재료가 포장지 세로 50% 지점에 놓인다)
// 맨 위(가장 나중에 놓인 재료)만 위에 겹칠 대상이 없으므로 margin-top 0.
// - 방금 새로 놓인 재료만 위에서 떨어지는 애니메이션을 재생하고, 이미 쌓여있던 재료는 다시 움직이지 않음
// 포장 후(burgerState.served): 전 층을 눌러 찌그러뜨린다.
// - 아래빵/위빵(맨 아래·맨 위): 높이는 20%만 축소(80% 유지), 자기 높이(축소분 반영) 기준 -70% 지점까지 파고듦
// - 가운데 재료: 높이 50%로 축소, 마찬가지로 자기 높이 기준 -70% 지점까지 파고듦
// (좌측->중앙 이동 애니메이션이 끝나는 1.5초 시점에 이어서 부드럽게 재생되도록 CSS에서 딜레이를 맞춰둠)
function renderBurgerLeftColumnHtml(extraColClass) {
    var built = burgerState.built;
    var firstBunIdx = built.indexOf('🍞');
    var squish = burgerState.served;
    var html = '<div class="burger-col' + (extraColClass ? ' ' + extraColClass : '') + '">';
    for (var i = built.length - 1; i >= 0; i--) {
        var item = built[i];
        var src = getBurgerIngredientImg(item, i, firstBunIdx);
        var isTopmost = i === built.length - 1;
        var marginExpr = isTopmost ? '0' : 'calc(var(--ih) * -0.5)';
        var animClass = i === burgerState.justAddedIdx ? 'burger-layer-pop' : '';
        var styleExtra = '';
        if (squish) {
            var isBunEdge = isTopmost || i === 0;
            var h1 = isBunEdge ? 'calc(var(--ih) * 0.8)' : 'calc(var(--ih) * 0.5)';
            var m1 = isBunEdge ? 'calc(var(--ih) * -0.56)' : 'calc(var(--ih) * -0.35)';
            styleExtra = '--sq-h0:var(--ih); --sq-m0:' + marginExpr + '; --sq-h1:' + h1 + '; --sq-m1:' + m1 + ';';
            animClass = (animClass ? animClass + ' ' : '') + 'burger-squish';
        }
        html += src ? renderBurgerImgHtml(src, marginExpr, i + 1, animClass, styleExtra) : renderBurgerFallbackHtml(item, marginExpr, i + 1, animClass, styleExtra);
    }
    var paperMargin = built.length === 0 ? '0' : 'calc(var(--ph) * -1.8)';
    html += renderBurgerImgHtml(HAMBURGER_IMG.wrapPaper, paperMargin, 0, '');
    html += '</div>';
    return html;
}
// 오른쪽: 후라이팬(맨 아래, 고정) 위에 굽는 중인 생/구운 패티·베이컨이 얹힘 (왼쪽과 동일한 margin 규칙)
function renderBurgerRightColumnHtml() {
    var html = '<div class="burger-col">';
    var hasItem = !!burgerState.panItem;
    if (hasItem) {
        var itemSrc = (burgerState.panPhase === 'raw') ? hamburgerRawImg(burgerState.panItem) : hamburgerCookedImg(burgerState.panItem);
        var animClass = burgerState.panPhase === 'raw' ? 'burger-layer-pop' : (burgerState.panPhase === 'cooked' ? 'burger-pan-item-cooked' : 'burger-pan-item-riseaway');
        html += renderBurgerImgHtml(itemSrc, '0', 1, animClass);
    }
    html += renderBurgerImgHtml(HAMBURGER_IMG.grillPan, hasItem ? 'calc(var(--ih) * -0.5)' : '0', 0, '');
    html += '</div>';
    return html;
}
// 실행을 누르면 좌: 포장지, 우: 후라이팬이 항상 깔려있는 2분할 장면
// 포장하기가 실행되면: 아래빵은 그대로 두고 나머지 재료들이 이미 50% 겹침 규칙대로 압축되어 있는 상태 그대로,
// 화면 중앙 1단 레이아웃으로 전환하고(후라이팬 쪽은 사라짐) 완성 팝 애니메이션을 한 번 재생
function renderBurgerSceneHtml() {
    if (burgerState.served) {
        var popClass = burgerState.justServed ? 'burger-serve-pop' : '';
        return '<div class="burger-scene">' + renderBurgerLeftColumnHtml(popClass) + '</div>';
    }
    return '<div class="burger-scene">' + renderBurgerLeftColumnHtml() + renderBurgerRightColumnHtml() + '</div>';
}
function buildBurgerSVG(layers) {
    var width = 220;
    var layerH = 34;
    var totalH = layers.length * layerH + 20;
    var svg = '<svg viewBox="0 0 ' + width + ' ' + (totalH + 12) + '" xmlns="http://www.w3.org/2000/svg" style="width:100%; max-width:240px; height:auto;">';
    svg += '<ellipse cx="' + (width / 2) + '" cy="' + (totalH + 5) + '" rx="' + (width / 2 - 12) + '" ry="7" fill="rgba(0,0,0,0.15)"/>';
    for (var i = 0; i < layers.length; i++) {
        var item = layers[i];
        var v = BURGER_VISUAL[item] || { color: '#cccccc', dark: '#999999' };
        var y = totalH - (i + 1) * layerH;
        var isFirst = (i === 0);
        var isLast = (i === layers.length - 1);
        if (item === '🍞' && isFirst) {
            svg += '<path d="M 15 ' + (y + layerH) + ' Q 15 ' + (y + 10) + ' ' + (width / 2) + ' ' + (y + 8) + ' Q ' + (width - 15) + ' ' + (y + 10) + ' ' + (width - 15) + ' ' + (y + layerH) + ' Z" fill="' + v.color + '" stroke="' + v.dark + '" stroke-width="2"/>';
        } else if (item === '🍞' && isLast) {
            svg += '<path d="M 12 ' + (y + layerH) + ' Q 8 ' + y + ' ' + (width / 2) + ' ' + (y - 8) + ' Q ' + (width - 8) + ' ' + y + ' ' + (width - 12) + ' ' + (y + layerH) + ' Z" fill="' + v.color + '" stroke="' + v.dark + '" stroke-width="2"/>';
            [0.28, 0.42, 0.58, 0.72].forEach(function (fx, si) {
                svg += '<ellipse cx="' + (width * fx) + '" cy="' + (y + 8 - (si % 2) * 3) + '" rx="2.5" ry="1.8" fill="#fff8e1" transform="rotate(' + (si * 15 - 20) + ' ' + (width * fx) + ' ' + (y + 8) + ')"/>';
            });
        } else {
            svg += '<path d="M 16 ' + (y + layerH - 4) + ' Q 10 ' + (y + layerH / 2) + ' 18 ' + (y + 4) + ' L ' + (width - 18) + ' ' + (y + 4) + ' Q ' + (width - 10) + ' ' + (y + layerH / 2) + ' ' + (width - 16) + ' ' + (y + layerH - 4) + ' Z" fill="' + v.color + '" stroke="' + v.dark + '" stroke-width="1.5"/>';
        }
    }
    svg += '</svg>';
    return svg;
}
var burgerState = {};
var burgerRound = 1, burgerSolved = 0;
function initHamburger() { burgerRound = 1; burgerSolved = 0; generateHamburgerRound(); }
function generateHamburgerRound() {
    var recipe = pickRandom(HAMBURGER_RECIPES);
    var uniqueIngredients = recipe.layers.filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    var addActions = shuffleArray(uniqueIngredients.map(function (ing) { return { type: 'add', item: ing, label: ing + ' 담기' }; }));
    var palette = shuffleArray(BURGER_ACTIONS_BASE.concat(addActions));
    burgerState = { recipe: recipe, palette: palette, program: [], running: false, solved: false, animIndex: 0, built: [], grilled: false, served: false, lastMsg: '', panPhase: null, panItem: null, justAddedIdx: -1, justServed: false };
    renderHamburger();
}
function addBurgerAction(idx) {
    if (burgerState.running || burgerState.solved) return;
    vibrateShort();
    burgerState.program.push(burgerState.palette[idx]);
    renderHamburger();
}
function undoBurgerAction() {
    if (burgerState.running || burgerState.solved) return;
    vibrateShort();
    burgerState.program.pop();
    renderHamburger();
}
function runHamburger() {
    if (burgerState.running || burgerState.solved || burgerState.program.length === 0) return;
    burgerState.running = true;
    burgerState.animIndex = 0;
    burgerState.built = [];
    burgerState.grilled = false;
    burgerState.served = false;
    burgerState.lastMsg = '';
    burgerState.panPhase = null;
    burgerState.panItem = null;
    burgerState.justAddedIdx = -1;
    burgerState.justServed = false;
    renderHamburger();
    var t = gameTimeout(stepHamburgerAnim, 1000);
}
function scheduleHamburgerStep(delay) {
    var t = gameTimeout(stepHamburgerAnim, delay);
}
function advanceHamburgerStep() {
    burgerState.animIndex++;
    if (burgerState.animIndex >= burgerState.program.length) { finishHamburgerCheck(); return; }
    scheduleHamburgerStep(900);
}
// 패티/베이컨을 굽는 연출: 후라이팬에 생재료가 들어가서 → 지글지글 익고 → 완성된 재료가 버거 위로 올라감
function runGrillAddAnimation(item) {
    burgerState.panItem = item;
    burgerState.panPhase = 'raw';
    burgerState.lastMsg = item + '를 후라이팬에 올렸어요!';
    renderHamburger();
    var t1 = gameTimeout(function () {
        burgerState.panPhase = 'cooked';
        burgerState.lastMsg = '🔥 지글지글~ 다 익었어요!';
        vibrateShort();
        renderHamburger();
        var t2 = gameTimeout(function () {
            burgerState.panPhase = 'flyup';
            renderHamburger();
            var t3 = gameTimeout(function () {
                burgerState.panPhase = null;
                burgerState.panItem = null;
                burgerState.built.push(item);
                burgerState.justAddedIdx = burgerState.built.length - 1;
                burgerState.lastMsg = item + '를 버거 위에 올렸어요!';
                renderHamburger();
                burgerState.justAddedIdx = -1;
                advanceHamburgerStep();
            }, 480);
        }, 650);
    }, 650);
}
function stepHamburgerAnim() {
    if (burgerState.animIndex >= burgerState.program.length) {
        finishHamburgerCheck();
        return;
    }
    var action = burgerState.program[burgerState.animIndex];
    vibrateShort();
    if (action.type === 'grill') {
        burgerState.grilled = true;
        burgerState.panPhase = 'appear';
        burgerState.panItem = null;
        burgerState.lastMsg = '🔥 후라이팬을 달구고 있어요!';
        renderHamburger();
        advanceHamburgerStep();
        return;
    } else if (action.type === 'add') {
        var isGrillable = GRILLABLE_ITEMS.indexOf(action.item) > -1;
        if (isGrillable && !burgerState.grilled) {
            burgerState.running = false;
            renderHamburger();
            var msg = document.getElementById('burgerMsg');
            msg.className = 'msg-box bad'; msg.style.display = 'block';
            msg.innerText = '🐛 앗! ' + action.item + '는 먼저 구워야 해요. "🔥 굽기"부터 실행되게 순서를 고쳐보세요.';
            document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" onclick="retryHamburgerRound()">다시 실행하기 🔁</button>');
            return;
        }
        if (burgerState.served) {
            burgerState.running = false;
            renderHamburger();
            var msg2 = document.getElementById('burgerMsg');
            msg2.className = 'msg-box bad'; msg2.style.display = 'block';
            msg2.innerText = '🐛 이미 포장했는데 재료를 더 넣었어요! "포장"은 맨 마지막에 해야해요.';
            document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" onclick="retryHamburgerRound()">다시 실행하기 🔁</button>');
            return;
        }
        if (isGrillable) {
            runGrillAddAnimation(action.item);
            return;
        }
        burgerState.built.push(action.item);
        burgerState.justAddedIdx = burgerState.built.length - 1;
        burgerState.lastMsg = action.item + '를 올렸어요!';
    } else if (action.type === 'serve') {
        burgerState.served = true;
        burgerState.justServed = true;
        burgerState.lastMsg = '🍽️ 포장 완료!';
    }
    renderHamburger();
    burgerState.justAddedIdx = -1;
    burgerState.justServed = false;
    advanceHamburgerStep();
}
function finishHamburgerCheck() {
    burgerState.running = false;
    var isCorrect = burgerState.served && burgerState.built.length === burgerState.recipe.layers.length &&
        burgerState.built.every(function (l, i) { return l === burgerState.recipe.layers[i]; });
    renderHamburger();
    var msg = document.getElementById('burgerMsg');
    if (isCorrect) {
        burgerState.solved = true;
        burgerSolved++;
        msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 완벽해요! "' + burgerState.recipe.name + '" 완성!';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextHamburgerRound()', 'retryHamburgerFresh()', 'initHamburger()'));
    } else if (!burgerState.served) {
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '아직 포장을 안 했어요! "🍽️ 포장"을 프로그램 맨 끝에 추가해보세요.';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" onclick="retryHamburgerRound()">다시 실행하기 🔁</button>');
    } else {
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '순서가 달라요! 주문서를 다시 보고 순서를 고쳐보세요.';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" onclick="retryHamburgerRound()">다시 실행하기 🔁</button>');
    }
}
function retryHamburgerRound() {
    burgerState.running = false;
    burgerState.built = [];
    burgerState.grilled = false;
    burgerState.served = false;
    burgerState.lastMsg = '';
    burgerState.panPhase = null;
    burgerState.panItem = null;
    burgerState.justAddedIdx = -1;
    burgerState.justServed = false;
    renderHamburger();
}
function nextHamburgerRound() { burgerRound++; generateHamburgerRound(); }
function retryHamburgerFresh() {
    burgerState.program = [];
    burgerState.running = false;
    burgerState.solved = false;
    burgerState.animIndex = 0;
    burgerState.built = [];
    burgerState.grilled = false;
    burgerState.served = false;
    burgerState.lastMsg = '';
    burgerState.panPhase = null;
    burgerState.panItem = null;
    burgerState.justAddedIdx = -1;
    burgerState.justServed = false;
    renderHamburger();
}
function renderHamburger() {
    var html = '<div class="game-title-box">🍔 햄버거 만들기</div>';
    html += '<div class="game-sub-desc">명령을 순서대로 쌓아서 <b style="color:#1d4ed8;">"' + burgerState.recipe.name + '"</b>를 완성해보세요! <b style="color:var(--primary);">고기·베이컨은 먼저 구워야 담을 수 있어요.</b></div>';
    html += '<div class="status-row"><div>' + burgerRound + '라운드</div><div>완성: ' + burgerSolved + '개</div></div>';
    html += '<div class="row-label">📋 주문서 (아래→위 순서)</div><div class="row-display">';
    burgerState.recipe.layers.forEach(function (l) { html += '<div class="row-box">' + l + '</div>'; });
    html += '</div>';
    html += '<div class="row-label">🍔 지금 만들어진 상태</div>';
    html += renderBurgerSceneHtml();
    if (burgerState.lastMsg && burgerState.running) {
        html += '<div class="game-sub-desc" style="text-align:center; font-weight:800; color:var(--primary);">' + burgerState.lastMsg + '</div>';
    }
    html += '<div class="setup-section-label">명령 (눌러서 추가, 여러 번 눌러도 돼요)</div><div class="palette-row">';
    burgerState.palette.forEach(function (act, idx) {
        html += '<button class="setup-btn" style="min-width:auto;" ' + (burgerState.running || burgerState.solved ? 'disabled' : '') + ' onclick="addBurgerAction(' + idx + ')">' + act.label + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">내 프로그램 (' + burgerState.program.length + '개)</div><div class="sequence-answer-row" style="flex-wrap:wrap;">';
    if (burgerState.program.length === 0) {
        html += '<div class="game-sub-desc" style="margin:0;">아직 명령이 없어요. 위에서 명령을 눌러 추가해보세요!</div>';
    } else {
        burgerState.program.forEach(function (act, i) {
            var isCurrent = burgerState.running && burgerState.animIndex === i;
            html += '<div class="sequence-answer-slot" style="width:auto; min-width:46px; padding:0 0.3rem; font-size:0.7rem; font-weight:800;' + (isCurrent ? 'background:#fef9c3;border-color:#eab308;' : '') + '">' + act.label + '</div>';
        });
    }
    html += '</div>';
    html += '<div class="options-grid">';
    html += '<button class="action-btn" ' + (burgerState.running || burgerState.solved ? 'disabled' : '') + ' onclick="runHamburger()">▶ 실행</button>';
    html += '<button class="action-btn secondary" ' + (burgerState.running || burgerState.solved ? 'disabled' : '') + ' onclick="undoBurgerAction()">↩ 지우기</button>';
    html += '</div>';
    html += '<div id="burgerMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 31. 코딩 사고: 파이프 연결하기 =====================
var waterPipeSettings = { size: 4, pipeMode: 'min', timeLimit: 0 };
var waterPipeState = {};
var waterPipeRound = 1, waterPipeSolved = 0;
var WATER_ROTATE_MAP = { top: 'right', right: 'bottom', bottom: 'left', left: 'top' };
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('waterPipe', {
        easy: { size: 4, pipeMode: 'min' },
        normal: { size: 6, pipeMode: 'mid' },
        hard: { size: 8, pipeMode: 'max' }
    });
}
function initWaterPipe() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('waterPipe', waterPipeSettings);
    renderWaterPipeSetup();
}
function renderWaterPipeSetup() {
    var sizes = [{ v: 4, l: '4×4' }, { v: 6, l: '6×6' }, { v: 8, l: '8×8' }, { v: 'random', l: '무작위' }];
    var modes = [{ v: 'min', l: '최소' }, { v: 'mid', l: '중간' }, { v: 'max', l: '최대' }, { v: 'random', l: '무작위' }];
    var times = [{ v: 10, l: '10초' }, { v: 15, l: '15초' }, { v: 20, l: '20초' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">🔀 파이프 연결하기</div>';
    html += '<div class="game-sub-desc">타일 수, 파이프 수, 시간 제한을 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">타일 수</div><div class="setup-btn-group">';
    sizes.forEach(function (t) {
        html += '<button class="setup-btn' + (waterPipeSettings.size === t.v ? ' active' : '') + '" onclick="setWaterPipeSize(' + (t.v === 'random' ? "'random'" : t.v) + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">파이프 수</div><div class="setup-btn-group">';
    modes.forEach(function (t) {
        html += '<button class="setup-btn' + (waterPipeSettings.pipeMode === t.v ? ' active' : '') + '" onclick="setWaterPipeMode(\'' + t.v + '\')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (waterPipeSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setWaterPipeTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startWaterPipeSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setWaterPipeSize(v) { waterPipeSettings.size = v; renderWaterPipeSetup(); }
function setWaterPipeMode(v) { waterPipeSettings.pipeMode = v; renderWaterPipeSetup(); }
function setWaterPipeTimeLimit(v) { waterPipeSettings.timeLimit = v; renderWaterPipeSetup(); }
function startWaterPipeSession() { waterPipeRound = 1; waterPipeSolved = 0; generateWaterPipeRound(); }
function dirFromTo(a, b) {
    if (b.x > a.x) return 'right';
    if (b.x < a.x) return 'left';
    if (b.y > a.y) return 'bottom';
    return 'top';
}
function oppositeWaterDir(d) { return { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[d]; }
function getOpenSides(rotation, kind) {
    var base = kind === 'straight' ? ['top', 'bottom'] : ['top', 'right'];
    var sides = base.slice();
    for (var i = 0; i < rotation; i++) { sides = sides.map(function (s) { return WATER_ROTATE_MAP[s]; }); }
    return sides;
}
function generateWaterPath(size, sx, tx) {
    var path = [{ x: sx, y: 0 }];
    var cx = sx, cy = 0;
    while (cy < size - 1 || cx !== tx) {
        var canMoveDown = cy < size - 1;
        var needHorizontal = cx !== tx;
        var moveDown = !canMoveDown ? false : (!needHorizontal ? true : Math.random() < 0.55);
        if (moveDown) { cy++; } else { cx += (tx > cx) ? 1 : -1; }
        path.push({ x: cx, y: cy });
    }
    return path;
}
function generateWaterPathGreedy(size, sx, tx, preferLong) {
    var visited = {};
    var path = [{ x: sx, y: 0 }];
    visited[sx + ',0'] = true;
    var cur = { x: sx, y: 0 };
    var target = { x: tx, y: size - 1 };
    var maxSteps = size * size;
    for (var step = 0; step < maxSteps; step++) {
        if (cur.x === target.x && cur.y === target.y) return path;
        var dirs = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
        var candidates = [];
        dirs.forEach(function (d) {
            var nx = cur.x + d.dx, ny = cur.y + d.dy;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited[nx + ',' + ny]) candidates.push({ x: nx, y: ny });
        });
        if (candidates.length === 0) return null;
        var nonTarget = candidates.filter(function (c) { return !(c.x === target.x && c.y === target.y); });
        var pick = (preferLong && nonTarget.length > 0) ? pickRandom(nonTarget) : pickRandom(candidates);
        visited[pick.x + ',' + pick.y] = true;
        path.push(pick);
        cur = pick;
    }
    return (cur.x === target.x && cur.y === target.y) ? path : null;
}
function generateWaterPathByMode(size, sx, tx, mode) {
    if (mode === 'min') return generateWaterPath(size, sx, tx);
    var preferLong = (mode === 'max');
    for (var attempt = 0; attempt < 40; attempt++) {
        var result = generateWaterPathGreedy(size, sx, tx, preferLong);
        if (result && result.length > 1) return result;
    }
    return generateWaterPath(size, sx, tx);
}
function generateWaterPipeRound() {
    var size = waterPipeSettings.size === 'random' ? pickRandom([4, 6, 8]) : waterPipeSettings.size;
    var mode = waterPipeSettings.pipeMode === 'random' ? pickRandom(['min', 'mid', 'max']) : waterPipeSettings.pipeMode;
    var sx = getRandomInt(0, size - 1);
    var tx = getRandomInt(0, size - 1);
    var path = generateWaterPathByMode(size, sx, tx, mode);
    var pipes = path.map(function (p, i) {
        var sideA = (i === 0) ? 'top' : dirFromTo(p, path[i - 1]);
        var sideB = (i === path.length - 1) ? 'bottom' : dirFromTo(p, path[i + 1]);
        var kind = (sideA === oppositeWaterDir(sideB)) ? 'straight' : 'elbow';
        return { kind: kind, rotation: getRandomInt(0, 3) };
    });
    waterPipeState = {
        size: size, source: { x: sx }, target: { x: tx }, path: path, pipes: pipes,
        filled: [], flowing: false, fired: false, success: false, fullVisited: [], willSucceed: false,
        timeLimit: waterPipeSettings.timeLimit, timeLeft: waterPipeSettings.timeLimit, timerId: null, timedOut: false
    };
    renderWaterPipe();
    if (waterPipeSettings.timeLimit > 0) { startWaterPipeTimer(); }
}
function startWaterPipeTimer() {
    var bar = document.getElementById('waterPipeTimerBar');
    if (bar) bar.style.width = (waterPipeState.timeLeft / waterPipeState.timeLimit * 100) + '%';
    waterPipeState.timerId = setInterval(function () {
        waterPipeState.timeLeft -= 0.1;
        var pct = (waterPipeState.timeLeft / waterPipeState.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('waterPipeTimerBar');
        if (b) b.style.width = pct + '%';
        if (waterPipeState.timeLeft <= 0) {
            clearInterval(waterPipeState.timerId);
            handleWaterPipeTimeout();
        }
    }, 100);
    activeTimers.push(waterPipeState.timerId);
}
function handleWaterPipeTimeout() {
    if (waterPipeState.fired || waterPipeState.timedOut) return;
    waterPipeState.timedOut = true;
    if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
    renderWaterPipe();
}
function restartWaterPipe() { renderWaterPipeSetup(); }
function nextWaterPipeRound() { waterPipeRound++; generateWaterPipeRound(); }
function retryWaterPipeRound() {
    waterPipeState.pipes.forEach(function (p) { p.rotation = getRandomInt(0, 3); });
    waterPipeState.filled = [];
    waterPipeState.fired = false;
    waterPipeState.success = false;
    waterPipeState.timedOut = false;
    waterPipeState.timeLeft = waterPipeState.timeLimit;
    renderWaterPipe();
    if (waterPipeState.timeLimit > 0) { startWaterPipeTimer(); }
}
function rotateWaterPipe(idx) {
    if (waterPipeState.flowing || waterPipeState.timedOut) return;
    vibrateShort();
    waterPipeState.pipes[idx].rotation = (waterPipeState.pipes[idx].rotation + 1) % 4;
    waterPipeState.filled = [];
    waterPipeState.fired = false;
    renderWaterPipe();
}
function traceWater(state) {
    var visited = [];
    var enterSide = 'top';
    var cur = state.path[0];
    var success = false;
    for (var step = 0; step < state.path.length + 1; step++) {
        var idx = -1;
        for (var i = 0; i < state.path.length; i++) { if (state.path[i].x === cur.x && state.path[i].y === cur.y) { idx = i; break; } }
        if (idx === -1) break;
        var pipe = state.pipes[idx];
        var sides = getOpenSides(pipe.rotation, pipe.kind);
        if (sides.indexOf(enterSide) === -1) break;
        visited.push({ x: cur.x, y: cur.y });
        var exitSide = (sides[0] === enterSide) ? sides[1] : sides[0];
        if (cur.x === state.target.x && cur.y === state.size - 1 && exitSide === 'bottom') { success = true; break; }
        var vec = { top: { dx: 0, dy: -1 }, bottom: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 } }[exitSide];
        cur = { x: cur.x + vec.dx, y: cur.y + vec.dy };
        enterSide = oppositeWaterDir(exitSide);
    }
    return { visited: visited, success: success };
}
function flowWater() {
    if (waterPipeState.flowing || waterPipeState.timedOut) return;
    if (waterPipeState.timerId) { clearInterval(waterPipeState.timerId); waterPipeState.timerId = null; }
    var result = traceWater(waterPipeState);
    waterPipeState.flowing = true;
    waterPipeState.fired = false;
    waterPipeState.fullVisited = result.visited;
    waterPipeState.willSucceed = result.success;
    waterPipeState.filled = [];
    stepWaterFlow(0);
}
function stepWaterFlow(i) {
    if (i >= waterPipeState.fullVisited.length) {
        waterPipeState.flowing = false;
        waterPipeState.fired = true;
        waterPipeState.success = waterPipeState.willSucceed;
        if (typeof reportGameOutcome === 'function') reportGameOutcome(waterPipeState.success ? 'win' : 'lose');
        if (waterPipeState.success) {
            waterPipeSolved++;
        } else if (waterPipeState.timeLimit > 0 && waterPipeState.timeLeft > 0 && !waterPipeState.timedOut) {
            startWaterPipeTimer();
        }
        renderWaterPipe();
        return;
    }
    waterPipeState.filled.push(waterPipeState.fullVisited[i]);
    renderWaterPipe();
    var t = gameTimeout(function () { stepWaterFlow(i + 1); }, 220);
}
function renderPipeShape(sides, isFilled) {
    var color = isFilled ? '#0ea5e9' : '#93c5fd';
    var segMap = {
        top: 'top:0; left:50%; width:8px; height:50%; margin-left:-4px;',
        bottom: 'bottom:0; left:50%; width:8px; height:50%; margin-left:-4px;',
        left: 'left:0; top:50%; height:8px; width:50%; margin-top:-4px;',
        right: 'right:0; top:50%; height:8px; width:50%; margin-top:-4px;'
    };
    var segs = '';
    sides.forEach(function (s) {
        segs += '<div style="position:absolute; background:' + color + '; border-radius:4px; ' + segMap[s] + '"></div>';
    });
    return '<div style="position:absolute; top:0; left:0; width:100%; height:100%;">' + segs + '</div>';
}
function renderWaterPipe() {
    var html = '<div class="game-title-box">🔀 파이프 연결하기</div>';
    html += '<div class="game-sub-desc">파이프를 눌러 90도씩 돌려서, 🚰 수도꼭지의 물이 🪣 물탱크까지 이어지도록 연결해보세요!</div>';
    html += '<div class="status-row"><div>' + waterPipeRound + '라운드</div><div>성공: ' + waterPipeSolved + '개</div></div>';
    if (waterPipeState.timeLimit > 0 && !waterPipeState.fired && !waterPipeState.timedOut) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="waterPipeTimerBar"></div></div>';
    }
    var size = waterPipeState.size;
    var pipeAt = {};
    waterPipeState.path.forEach(function (p, i) { pipeAt[p.x + ',' + p.y] = i; });
    html += '<div class="maze-wrap"><div class="maze-grid" style="grid-template-columns: repeat(' + size + ', 44px);">';
    for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
            var key = x + ',' + y;
            var isSourceCell = (y === 0 && x === waterPipeState.source.x);
            var isTargetCell = (y === size - 1 && x === waterPipeState.target.x);
            var pipeIdx = pipeAt[key];
            var content = '';
            var cellStyle = 'border:1px solid #e2e8f0; position:relative; width:44px; height:44px;';
            if (pipeIdx !== undefined) {
                var pipe = waterPipeState.pipes[pipeIdx];
                var sides = getOpenSides(pipe.rotation, pipe.kind);
                var isFilled = waterPipeState.filled.some(function (f) { return f.x === x && f.y === y; });
                content = renderPipeShape(sides, isFilled);
                cellStyle += 'cursor:pointer;';
            }
            var onclickAttr = (pipeIdx !== undefined && !waterPipeState.flowing && !waterPipeState.timedOut) ? ' onclick="rotateWaterPipe(' + pipeIdx + ')"' : '';
            var topLabel = isSourceCell ? '<div style="position:absolute; top:-22px; left:50%; transform:translateX(-50%); font-size:1.1rem;">🚰</div>' : '';
            var bottomLabel = isTargetCell ? '<div style="position:absolute; bottom:-22px; left:50%; transform:translateX(-50%); font-size:1.1rem;">🪣</div>' : '';
            html += '<div class="maze-cell" style="' + cellStyle + '"' + onclickAttr + '>' + content + topLabel + bottomLabel + '</div>';
        }
    }
    html += '</div></div>';
    html += '<div class="options-grid">';
    html += '<button class="action-btn" ' + (waterPipeState.flowing || waterPipeState.timedOut ? 'disabled' : '') + ' onclick="flowWater()">💧 물 흘리기!</button>';
    html += '</div>';
    html += '<div id="waterPipeMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (waterPipeState.timeLimit > 0 && !waterPipeState.fired && !waterPipeState.timedOut) {
        var barEl = document.getElementById('waterPipeTimerBar');
        if (barEl) barEl.style.width = (waterPipeState.timeLeft / waterPipeState.timeLimit * 100) + '%';
    }
    if (waterPipeState.timedOut) {
        var tmsg = document.getElementById('waterPipeMsg');
        tmsg.className = 'msg-box bad'; tmsg.style.display = 'block'; tmsg.innerText = '⏰ 시간이 다 됐어요!';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryWaterPipeRound()">다시 시도 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartWaterPipe()">처음부터 풀기 🔄</button>' +
            '</div>');
    } else if (waterPipeState.fired) {
        var msg = document.getElementById('waterPipeMsg');
        if (waterPipeState.success) {
            msg.className = 'msg-box'; msg.style.display = 'block'; msg.innerText = '🎉 물탱크에 물이 가득 찼어요! 성공이에요.';
            document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextWaterPipeRound()', 'retryWaterPipeRound()', 'restartWaterPipe()'));
        } else {
            msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '아쉬워요! 물이 중간에 새어 나갔어요. 파이프 방향을 다시 맞춰보세요.';
            document.getElementById('mainArea').insertAdjacentHTML('beforeend',
                '<div class="options-grid">' +
                '<button class="action-btn" onclick="retryWaterPipeRound()">다시 시도 🔁</button>' +
                '<button class="action-btn secondary" onclick="restartWaterPipe()">처음부터 풀기 🔄</button>' +
                '</div>');
        }
    }
}

// ===================== 32. 코딩 사고: 반복 청소 로봇 (조건 반복문 - repeat until) =====================
// 블록코딩 로봇(정해진 횟수 반복 🔁2/🔁3)과 다르게, 이 게임은 "몇 번"인지 모르는 상황에서
// "먼지가 있는 동안(조건) 계속" 반복하는 조건-반복문(while/repeat-until) 개념을 다룸.
// 복도는 시작칸(0) + 먼지칸(N개) 로 이어지고, 여러 복도를 이을 때는 그 사이에 "코너"(먼지 없음,
// 반드시 🔄로 지나가야 함) 칸을 하나 둠 - 그래서 직선 구간마다 반복 블록을 "따로" 써야 한다는 것도 배움.
var CLEANBOT_SEGMENT_COUNT = { low: 1, mid: 2, high: 3 };
var CLEANBOT_BLOCKS_BASE = [
    { type: 'forward', label: '➡️ 전진', shortLabel: '➡️' },
    { type: 'repeatStart', label: '🔁 먼지가 있으면 반복', shortLabel: '🔁❓' },
    { type: 'repeatEnd', label: '⏹ 반복 끝', shortLabel: '⏹' }
];
var CLEANBOT_TURN_BLOCK = { type: 'turnRight', label: '🔄 코너 돌기', shortLabel: '🔄' };
var cleanbotSettings = { level: 'low' };
var cleanbotState = {};
var cleanbotRound = 1, cleanbotSolved = 0;
if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('cleanbot', { easy: { level: 'low' }, normal: { level: 'mid' }, hard: { level: 'high' } });
}
function initCleanbot() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('cleanbot', cleanbotSettings);
    renderCleanbotSetup();
}
function renderCleanbotSetup() {
    var levels = [
        { v: 'low', l: '쉬움 (복도 1개)' },
        { v: 'mid', l: '보통 (복도 2개 + 코너 1번)' },
        { v: 'high', l: '어려움 (복도 3개 + 코너 2번)' }
    ];
    var html = '<div class="game-title-box">🧹 반복 청소 로봇</div>';
    html += '<div class="game-sub-desc">복도의 먼지 개수는 매번 달라져요. 청소를 "몇 번 반복" 시키는게 아니고 "먼지가 있으면 반복" 시키는게 필요해요.</div>';
    html += '<div class="setup-section-label">난이도</div><div class="setup-btn-group">';
    levels.forEach(function (t) {
        html += '<button class="setup-btn' + (cleanbotSettings.level === t.v ? ' active' : '') + '" onclick="setCleanbotLevel(\'' + t.v + '\')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startCleanbotSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setCleanbotLevel(v) { cleanbotSettings.level = v; renderCleanbotSetup(); }
function startCleanbotSession() { cleanbotRound = 1; cleanbotSolved = 0; generateCleanbotRound(); }
function cloneCleanbotCells(cells) { return cells.map(function (c) { return { dust: c.dust, corner: c.corner }; }); }
// 1D 복도 배열을 실제 좌표 경로로 변환: 코너 칸마다 오른쪽으로 90도 꺾어, 전체 맵이 사각형(ㄱ/ㄷ 자)을 그리도록 함
function layoutCleanbotCells(cells) {
    var dirs = [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 0, dy: -1 }];
    var d = 0, x = 0, y = 0;
    var coords = [];
    for (var i = 0; i < cells.length; i++) {
        coords.push({ x: x, y: y });
        if (cells[i] && cells[i].corner) d = (d + 1) % 4;
        x += dirs[d].dx; y += dirs[d].dy;
    }
    return coords;
}
function buildCleanbotWorld(segCount) {
    var cells = [{ dust: false, corner: false }];
    for (var s = 0; s < segCount; s++) {
        var n = getRandomInt(3, 5);
        for (var i = 0; i < n; i++) cells.push({ dust: true, corner: false });
        if (s < segCount - 1) cells.push({ dust: false, corner: true });
    }
    return cells;
}
function getCleanbotPalette() {
    var list = CLEANBOT_BLOCKS_BASE.slice();
    if (cleanbotState.segCount > 1) list.push(CLEANBOT_TURN_BLOCK);
    return list;
}
function generateCleanbotRound() {
    var segCount = CLEANBOT_SEGMENT_COUNT[cleanbotSettings.level];
    var blueprint = buildCleanbotWorld(segCount);
    cleanbotState = {
        segCount: segCount, blueprint: blueprint, cells: cloneCleanbotCells(blueprint),
        coords: layoutCleanbotCells(blueprint),
        pos: 0, pc: 0, curInstrIdx: null, guard: 0, jumps: null,
        program: [], running: false, solved: false, lastMsg: ''
    };
    renderCleanbot();
}
function addCleanbotBlock(idx) {
    if (cleanbotState.running || cleanbotState.solved) return;
    vibrateShort();
    cleanbotState.program.push(getCleanbotPalette()[idx]);
    renderCleanbot();
}
function undoCleanbotBlock() {
    if (cleanbotState.running || cleanbotState.solved) return;
    vibrateShort();
    cleanbotState.program.pop();
    renderCleanbot();
}
// 🔁/⏹ 짝을 찾아 각 반복시작 인덱스 -> 반복끝 인덱스(및 역방향) 점프표를 만듦(중첩 반복은 아직 미지원)
function cleanbotFindJumps(program) {
    var stack = [];
    var startToEnd = {}, endToStart = {};
    var error = null;
    for (var i = 0; i < program.length; i++) {
        if (program[i].type === 'repeatStart') {
            if (stack.length > 0) { error = '반복 블록 안에는 아직 또 다른 반복 블록을 넣을 수 없어요.'; break; }
            stack.push(i);
        } else if (program[i].type === 'repeatEnd') {
            if (stack.length === 0) { error = '짝이 되는 "🔁 반복" 블록 없이 "⏹ 반복 끝"만 있어요.'; break; }
            var s = stack.pop();
            startToEnd[s] = i; endToStart[i] = s;
        }
    }
    if (!error && stack.length > 0) error = '"🔁 반복" 블록에 짝이 되는 "⏹ 반복 끝" 블록이 없어요.';
    return { startToEnd: startToEnd, endToStart: endToStart, error: error };
}
function cleanbotHasDustAhead(cells, pos) { return !!(cells[pos + 1] && cells[pos + 1].dust); }
// 프로그램을 애니메이션 없이 끝까지 빠르게 실행해서 성공 여부만 계산(다른 길이의 복도로 일반화 검증할 때 사용)
function cleanbotSimulate(program, jumps, segCount) {
    var cells = buildCleanbotWorld(segCount);
    var pos = 0, pc = 0, guard = 0;
    while (pc < program.length) {
        guard++;
        if (guard > 500) return false;
        var instr = program[pc];
        if (instr.type === 'repeatStart') {
            pc = cleanbotHasDustAhead(cells, pos) ? pc + 1 : jumps.startToEnd[pc] + 1;
        } else if (instr.type === 'repeatEnd') {
            pc = jumps.endToStart[pc];
        } else if (instr.type === 'forward') {
            if (!cells[pos + 1] || cells[pos + 1].corner) return false;
            pos++; cells[pos].dust = false; pc++;
        } else if (instr.type === 'turnRight') {
            if (cells[pos + 1] && cells[pos + 1].corner) pos++;
            pc++;
        }
    }
    return pos === cells.length - 1 && cells.every(function (c) { return !c.dust; });
}
function runCleanbotProgram() {
    if (cleanbotState.running || cleanbotState.solved) return;
    var jumps = cleanbotFindJumps(cleanbotState.program);
    var msg = document.getElementById('cleanbotMsg');
    if (jumps.error) {
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '🚫 ' + jumps.error;
        return;
    }
    if (cleanbotState.program.length === 0) {
        msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = '먼저 명령 블록을 눌러서 프로그램을 만들어보세요!';
        return;
    }
    cleanbotState.jumps = jumps;
    cleanbotState.running = true;
    cleanbotState.pos = 0;
    cleanbotState.pc = 0;
    cleanbotState.guard = 0;
    cleanbotState.curInstrIdx = null;
    cleanbotState.cells = cloneCleanbotCells(cleanbotState.blueprint);
    cleanbotState.lastMsg = '';
    renderCleanbot();
    var t = gameTimeout(stepCleanbotProgram, 500);
}
function stepCleanbotProgram() {
    var st = cleanbotState;
    st.guard++;
    if (st.guard > 300) {
        st.running = false;
        handleCleanbotFail('🐛 반복이 끝나지 않아요! (무한 반복에 빠졌어요) 반복 블록 안의 조건이나 명령을 다시 확인해보세요.');
        return;
    }
    if (st.pc >= st.program.length) {
        st.running = false;
        var allClean = st.cells.every(function (c) { return !c.dust; });
        if (st.pos === st.cells.length - 1 && allClean) { handleCleanbotSuccess(); }
        else { handleCleanbotFail('아직 복도를 다 지나지 못했어요! 프로그램을 다시 살펴보세요.'); }
        return;
    }
    var instr = st.program[st.pc];
    var curPc = st.pc;
    st.curInstrIdx = curPc;
    if (instr.type === 'repeatStart') {
        st.pc = cleanbotHasDustAhead(st.cells, st.pos) ? curPc + 1 : st.jumps.startToEnd[curPc] + 1;
    } else if (instr.type === 'repeatEnd') {
        st.pc = st.jumps.endToStart[curPc];
    } else if (instr.type === 'forward') {
        if (!st.cells[st.pos + 1]) {
            st.running = false;
            handleCleanbotFail('🐛 복도 끝 벽에 부딪혔어요! 더 이상 갈 곳이 없어요. 필요 없는 명령을 지워보세요.');
            return;
        }
        if (st.cells[st.pos + 1].corner) {
            st.running = false;
            handleCleanbotFail('🐛 앞이 꺾인 코너예요! "🔄 코너 돌기"로 먼저 지나가야 해요.');
            return;
        }
        st.pos++;
        st.cells[st.pos].dust = false;
        st.pc = curPc + 1;
    } else if (instr.type === 'turnRight') {
        if (st.cells[st.pos + 1] && st.cells[st.pos + 1].corner) { st.pos++; }
        st.pc = curPc + 1;
    }
    renderCleanbot();
    var t = gameTimeout(stepCleanbotProgram, 480);
}
function handleCleanbotFail(reason) {
    renderCleanbot();
    if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
    var msg = document.getElementById('cleanbotMsg');
    msg.className = 'msg-box bad'; msg.style.display = 'block'; msg.innerText = reason;
    document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" onclick="retryCleanbotRound()">다시 실행하기 🔁</button>');
}
function handleCleanbotSuccess() {
    renderCleanbot();
    var msg = document.getElementById('cleanbotMsg');
    msg.className = 'msg-box'; msg.style.display = 'block';
    msg.innerText = '🎉 복도를 깨끗하게 청소했어요! 이 프로그램이 다른 길이의 복도에서도 통하는지 테스트해볼게요...';
    var t = gameTimeout(runCleanbotGeneralizationTest, 900);
}
// 성공한 프로그램을, 같은 구조지만 먼지 개수가 다른 복도 3곳에 몰래 테스트해봄으로써
// "정해진 횟수만큼 낱개로 나열"이 아니라 진짜 "조건 반복"을 썼는지 확인하는 일반화 검증 단계
function runCleanbotGeneralizationTest() {
    var trials = [];
    for (var i = 0; i < 3; i++) { trials.push(cleanbotSimulate(cleanbotState.program, cleanbotState.jumps, cleanbotState.segCount)); }
    var passCount = trials.filter(function (x) { return x; }).length;
    var html = '<div class="msg-box" style="display:block; text-align:left; line-height:1.8;">';
    html += '🧪 <b>다른 길이의 복도 3곳</b>에서도 테스트했어요: ' + trials.map(function (ok) { return ok ? '✅' : '❌'; }).join(' ') + '<br>';
    if (passCount === 3) {
        html += '<b style="color:#166534;">완벽해요! 이 프로그램은 복도 길이가 달라져도 항상 통해요 — 진짜 "반복"의 힘이에요! 🌟</b>';
    } else {
        html += '<b style="color:#991b1b;">앗, 방금 그 복도에서만 우연히 통했나봐요. "전진"을 낱개로 여러 번 눌러 만들지 않았는지 확인하고, "🔁 먼지가 있으면 반복" 블록으로 다시 만들어보세요!</b>';
    }
    html += '</div>';
    document.getElementById('mainArea').insertAdjacentHTML('beforeend', html);
    cleanbotRound++;
    if (typeof reportGameOutcome === 'function') reportGameOutcome(passCount === 3 ? 'win' : 'lose');
    if (passCount === 3) {
        cleanbotSolved++;
        cleanbotState.solved = true;
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextCleanbotRound()', 'retryCleanbotFresh()', 'renderCleanbotSetup()'));
    } else {
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', '<button class="action-btn" onclick="retryCleanbotFresh()">프로그램 다시 만들기 🔁</button>');
    }
}
function retryCleanbotRound() {
    cleanbotState.running = false;
    cleanbotState.pos = 0; cleanbotState.pc = 0; cleanbotState.curInstrIdx = null;
    cleanbotState.cells = cloneCleanbotCells(cleanbotState.blueprint);
    cleanbotState.lastMsg = '';
    renderCleanbot();
}
function nextCleanbotRound() { cleanbotRound++; generateCleanbotRound(); }
function retryCleanbotFresh() {
    cleanbotState.program = [];
    cleanbotState.running = false;
    cleanbotState.solved = false;
    cleanbotState.pos = 0; cleanbotState.pc = 0; cleanbotState.curInstrIdx = null;
    cleanbotState.cells = cloneCleanbotCells(cleanbotState.blueprint);
    cleanbotState.lastMsg = '';
    renderCleanbot();
}
function renderCleanbotStrip() {
    var st = cleanbotState;
    var coords = st.coords || layoutCleanbotCells(st.cells);
    var minX = 0, maxX = 0, minY = 0, maxY = 0;
    coords.forEach(function (c) {
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.y > maxY) maxY = c.y;
    });
    var cols = maxX - minX + 1, rows = maxY - minY + 1;
    var cellPx = 36;
    var lookup = {};
    coords.forEach(function (c, i) { lookup[(c.x - minX) + ',' + (c.y - minY)] = i; });
    var html = '<div style="width:100%; overflow-x:auto;"><div style="display:grid; grid-template-columns: repeat(' + cols + ', ' + cellPx + 'px); grid-auto-rows:' + cellPx + 'px; gap:3px; width:max-content; margin:0.7rem auto; padding:0.3rem;">';
    for (var r = 0; r < rows; r++) {
        for (var cc = 0; cc < cols; cc++) {
            var idx = lookup[cc + ',' + r];
            if (idx === undefined) { html += '<div></div>'; continue; }
            var cell = st.cells[idx];
            var isRobot = idx === st.pos;
            var bg = cell.corner ? '#fde68a' : (cell.dust ? '#e7e5e4' : '#f8fafc');
            var content = isRobot ? '🤖' : (cell.corner ? '🔄' : (cell.dust ? '🟤' : ''));
            html += '<div style="width:' + cellPx + 'px; height:' + cellPx + 'px; background:' + bg + '; border:2px solid #d6d3d1; border-radius:0.35rem; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">' + content + '</div>';
        }
    }
    html += '</div></div>';
    return html;
}
function renderCleanbot() {
    var st = cleanbotState;
    var html = '<div class="game-title-box">🧹 반복 청소 로봇</div>';
    html += '<div class="game-sub-desc">복도가 <b style="color:var(--primary);">코너(🔄)에서 90도로 꺾여</b> 사각형을 이뤄요. 먼지가 <b style="color:var(--primary);">몇 개인지 몰라도</b> 청소할 수 있는 프로그램을 만들어보세요!</div>';
    html += '<div class="status-row"><div>' + cleanbotRound + '라운드</div><div>완료: ' + cleanbotSolved + '개</div></div>';
    html += renderCleanbotStrip();
    html += '<div class="setup-section-label">명령 블록 (눌러서 추가)</div><div class="palette-row">';
    getCleanbotPalette().forEach(function (bt, idx) {
        html += '<button class="setup-btn" style="min-width:auto;" ' + (st.running || st.solved ? 'disabled' : '') + ' onclick="addCleanbotBlock(' + idx + ')">' + bt.label + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">내 프로그램 (' + st.program.length + '개)</div><div class="sequence-answer-row" style="flex-wrap:wrap;">';
    if (st.program.length === 0) {
        html += '<div class="game-sub-desc" style="margin:0;">아직 명령이 없어요. 위에서 블록을 눌러 추가해보세요!</div>';
    } else {
        st.program.forEach(function (blk, i) {
            var isCurrent = st.running && st.curInstrIdx === i;
            html += '<div class="sequence-answer-slot" style="width:auto; min-width:40px; padding:0 0.35rem; font-size:0.85rem; font-weight:800;' + (isCurrent ? 'background:#fef9c3;border-color:#eab308;' : '') + '">' + blk.shortLabel + '</div>';
        });
    }
    html += '</div>';
    html += '<div class="options-grid">';
    html += '<button class="action-btn" ' + (st.running || st.solved ? 'disabled' : '') + ' onclick="runCleanbotProgram()">▶ 실행</button>';
    html += '<button class="action-btn secondary" ' + (st.running || st.solved ? 'disabled' : '') + ' onclick="undoCleanbotBlock()">↩ 지우기</button>';
    html += '</div>';
    html += '<div id="cleanbotMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 게임 등록 =====================
GAME_INIT_FNS.blockCoding = initBlockCoding;
GAME_INIT_FNS.conditionalRobot = initConditionalRobot;
GAME_INIT_FNS.codeTrace = initCodeTrace;
GAME_INIT_FNS.variableScore = initVariableScore;
GAME_INIT_FNS.functionFinder = initFunctionFinder;
GAME_INIT_FNS.efficiencyGuess = initEfficiencyGuess;
GAME_INIT_FNS.logicGate = initLogicGate;
GAME_INIT_FNS.hamburgerMaker = initHamburger;
GAME_INIT_FNS.waterPipe = initWaterPipe;
GAME_INIT_FNS.cleanbot = initCleanbot;
