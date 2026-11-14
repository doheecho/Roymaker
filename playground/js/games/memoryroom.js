// ===================== 관찰력: 기억의 방 (물건 배치 기억하기) =====================
// 방 배경 4종 (이미지 없이 CSS 그라데이션 + 이모지 소품으로 표현)
var ROOM_SCENES = [
    { id: 'classroom', name: '교실', bg: 'linear-gradient(180deg, #dbeafe 0%, #dbeafe 35%, #e7d7b8 35%, #e7d7b8 100%)', deco: [{ emoji: '🪟', x: 8, y: 10 }, { emoji: '🖍️', x: 90, y: 8 }] },
    { id: 'livingroom', name: '거실', bg: 'linear-gradient(180deg, #fef3c7 0%, #fef3c7 30%, #d6b98c 30%, #d6b98c 100%)', deco: [{ emoji: '🪟', x: 88, y: 10 }, { emoji: '🕯️', x: 6, y: 8 }] },
    { id: 'playground', name: '놀이터', bg: 'linear-gradient(180deg, #bae6fd 0%, #bae6fd 40%, #bbf7d0 40%, #bbf7d0 100%)', deco: [{ emoji: '☁️', x: 15, y: 6 }, { emoji: '☀️', x: 85, y: 6 }] },
    { id: 'bedroom', name: '방', bg: 'linear-gradient(180deg, #ede9fe 0%, #ede9fe 32%, #f3e8dd 32%, #f3e8dd 100%)', deco: [{ emoji: '🪟', x: 10, y: 9 }, { emoji: '🌙', x: 88, y: 8 }] }
];

// 공용 물건 풀 (이름 + 이모지)
var ROOM_OBJECT_POOL = [
    { name: '가방', emoji: '🎒' }, { name: '시계', emoji: '🕐' }, { name: '인형', emoji: '🧸' },
    { name: '공', emoji: '⚽' }, { name: '책', emoji: '📚' }, { name: '컵', emoji: '☕' },
    { name: '우산', emoji: '☂️' }, { name: '모자', emoji: '🎩' }, { name: '신발', emoji: '👟' },
    { name: '꽃병', emoji: '🏺' }, { name: '액자', emoji: '🖼️' }, { name: '스탠드', emoji: '💡' },
    { name: '자전거', emoji: '🚲' }, { name: '풍선', emoji: '🎈' }, { name: '로봇', emoji: '🤖' },
    { name: '기타', emoji: '🎸' }
];

// 방 안 물건이 놓일 수 있는 12개 고정 자리(4열 x 3행, % 좌표)
var ROOM_SLOTS = [];
(function () {
    for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 4; c++) {
            ROOM_SLOTS.push({ x: 12 + c * 25, y: 38 + r * 22 });
        }
    }
})();

var roomSettings = { objectCount: 6, studyTime: 5, modeSet: ['position', 'missing'] };
var roomState = {};
var roomRound = 1;
var roomBaseCount = 6;

if (typeof registerDifficultyPreset === 'function') {
    registerDifficultyPreset('memoryRoom', { easy: { objectCount: 4 }, normal: { objectCount: 6 }, hard: { objectCount: 8 } });
}
function initMemoryRoom() {
    if (typeof applyDifficultyPreset === 'function') applyDifficultyPreset('memoryRoom', roomSettings);
    renderRoomSetup();
}

function renderRoomSetup() {
    var counts = [4, 6, 8, 10];
    var times = [{ v: 3, l: '3초' }, { v: 5, l: '5초' }, { v: 7, l: '7초' }, { v: 10, l: '10초' }];
    var modes = [{ v: 'position', l: '위치 기억하기' }, { v: 'missing', l: '사라진 물건 찾기' }];
    var html = '<div class="game-title-box">🛋️ 기억의 방</div>';
    html += '<div class="game-sub-desc">방 안 물건들의 자리를 잘 기억해두세요! 시간이 지나면 가려져요.</div>';
    html += '<div class="setup-section-label">물건 개수</div><div class="setup-btn-group">';
    counts.forEach(function (c) {
        html += '<button class="setup-btn' + (roomSettings.objectCount === c ? ' active' : '') + '" onclick="setRoomObjectCount(' + c + ')">' + c + '개</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">보여주는 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (roomSettings.studyTime === t.v ? ' active' : '') + '" onclick="setRoomStudyTime(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">문제 유형 (중복 선택 가능)</div><div class="setup-btn-group">';
    modes.forEach(function (m) {
        var active = roomSettings.modeSet.indexOf(m.v) > -1;
        html += '<button class="setup-btn' + (active ? ' active' : '') + '" onclick="toggleRoomMode(\'' + m.v + '\')">' + m.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startRoomSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setRoomObjectCount(c) { roomSettings.objectCount = c; renderRoomSetup(); }
function setRoomStudyTime(t) { roomSettings.studyTime = t; renderRoomSetup(); }
function toggleRoomMode(m) {
    var idx = roomSettings.modeSet.indexOf(m);
    if (idx > -1) {
        if (roomSettings.modeSet.length > 1) roomSettings.modeSet.splice(idx, 1);
    } else {
        roomSettings.modeSet.push(m);
    }
    renderRoomSetup();
}

function startRoomSession() {
    roomRound = 1;
    roomBaseCount = roomSettings.objectCount;
    generateRoomRound();
}

function generateRoomRound() {
    var count = Math.min(roomBaseCount + (roomRound - 1), ROOM_SLOTS.length - 2, ROOM_OBJECT_POOL.length);
    var scene = pickRandom(ROOM_SCENES);
    var slotOrder = ROOM_SLOTS.map(function (s, i) { return i; });
    var slotIdxs = pickN(slotOrder, count);
    var objs = pickN(ROOM_OBJECT_POOL, count);
    var placed = objs.map(function (o, i) { return { name: o.name, emoji: o.emoji, slot: slotIdxs[i] }; });
    var mode = roomSettings.modeSet.length > 1 ? pickRandom(roomSettings.modeSet) : roomSettings.modeSet[0];
    roomState = {
        scene: scene, placed: placed, mode: mode, phase: 'study',
        timeLeft: roomSettings.studyTime, timerId: null,
        targetIdx: null, missingIdx: null, missingOptions: null,
        selectedSlot: null, selectedOption: null, checked: false
    };
    renderRoomStudy();
    startRoomTimer();
}

function retryRoomRound() {
    roomState.phase = 'study';
    roomState.timeLeft = roomSettings.studyTime;
    roomState.targetIdx = null; roomState.missingIdx = null; roomState.missingOptions = null;
    roomState.selectedSlot = null; roomState.selectedOption = null; roomState.checked = false;
    renderRoomStudy();
    startRoomTimer();
}
function restartMemoryRoom() { roomRound = 1; renderRoomSetup(); }
function nextRoomRound() { roomRound++; generateRoomRound(); }

function startRoomTimer() {
    var bar = document.getElementById('roomTimerBar');
    if (bar) bar.style.width = '100%';
    roomState.timerId = setInterval(function () {
        roomState.timeLeft -= 0.1;
        var pct = (roomState.timeLeft / roomSettings.studyTime) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('roomTimerBar');
        if (b) b.style.width = pct + '%';
        if (roomState.timeLeft <= 0) {
            clearInterval(roomState.timerId);
            roomState.phase = 'answer';
            prepareRoomAnswerPhase();
        }
    }, 100);
    activeTimers.push(roomState.timerId);
}

// 방 화면(배경+소품+물건 자리)을 그리는 공용 렌더러
// options: { clickable, onClickAttr, highlightSlot, wrongSlot, hidePlacedIdx }
function renderRoomSceneBox(showObjects, options) {
    options = options || {};
    var scene = roomState.scene;
    var html = '<div style="position:relative; width:100%; height:260px; border-radius:0.8rem; overflow:hidden; border:2px solid #1f2937; background:' + scene.bg + '; margin-bottom:1rem;">';
    scene.deco.forEach(function (d) {
        html += '<div style="position:absolute; left:' + d.x + '%; top:' + d.y + '%; font-size:1.6rem; transform:translate(-50%,-50%);">' + d.emoji + '</div>';
    });
    ROOM_SLOTS.forEach(function (s, idx) {
        var placedObj = null, placedIdx = -1;
        roomState.placed.forEach(function (p, pi) { if (p.slot === idx) { placedObj = p; placedIdx = pi; } });
        var content = '';
        if (showObjects && placedObj && placedIdx !== options.hidePlacedIdx) {
            content = placedObj.emoji;
        }
        var extraStyle = '';
        if (options.highlightSlot === idx) extraStyle += 'box-shadow:0 0 0 4px #10b981; background:rgba(16,185,129,0.2);';
        if (options.wrongSlot === idx) extraStyle += 'box-shadow:0 0 0 4px #ef4444; background:rgba(239,68,68,0.2);';
        var clickAttr = options.clickable ? ' onclick="' + options.onClickAttr + '(' + idx + ')"' : '';
        html += '<div style="position:absolute; left:' + s.x + '%; top:' + s.y + '%; width:54px; height:54px; margin-left:-27px; margin-top:-27px; border-radius:0.6rem; background:rgba(255,255,255,0.55); border:2px dashed rgba(255,255,255,0.9); display:flex; align-items:center; justify-content:center; font-size:1.7rem; cursor:' + (options.clickable ? 'pointer' : 'default') + ';' + extraStyle + '"' + clickAttr + '>' + content + '</div>';
    });
    html += '</div>';
    return html;
}

function renderRoomStudy() {
    var html = '<div class="game-title-box">🛋️ 기억의 방</div>';
    html += '<div class="game-sub-desc">' + roomState.scene.name + ' 안 물건들의 위치를 잘 기억해두세요!</div>';
    html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="roomTimerBar"></div></div>';
    html += '<div class="status-row"><div>' + roomRound + '라운드</div><div>물건 ' + roomState.placed.length + '개 · ' + roomState.scene.name + '</div></div>';
    html += renderRoomSceneBox(true, {});
    html += '<div id="roomMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    var barEl = document.getElementById('roomTimerBar');
    if (barEl) barEl.style.width = (roomState.timeLeft / roomSettings.studyTime * 100) + '%';
}

function prepareRoomAnswerPhase() {
    if (roomState.mode === 'position') {
        roomState.targetIdx = getRandomInt(0, roomState.placed.length - 1);
        roomState.selectedSlot = null;
        roomState.checked = false;
        renderRoomPositionAnswer();
    } else {
        roomState.missingIdx = getRandomInt(0, roomState.placed.length - 1);
        roomState.missingOptions = shuffleArray(roomState.placed.slice());
        roomState.selectedOption = null;
        roomState.checked = false;
        renderRoomMissingAnswer();
    }
}

// ---- 위치 기억하기 ----
function renderRoomPositionAnswer() {
    var target = roomState.placed[roomState.targetIdx];
    var html = '<div class="game-title-box">🛋️ 기억의 방</div>';
    html += '<div class="game-sub-desc">' + target.emoji + ' <b>' + target.name + '</b>이(가) 있던 자리를 골라보세요!</div>';
    html += '<div class="status-row"><div>' + roomRound + '라운드</div><div>' + roomState.scene.name + '</div></div>';
    html += renderRoomSceneBox(roomState.checked, {
        clickable: !roomState.checked,
        onClickAttr: 'pickRoomSlot',
        highlightSlot: roomState.checked ? target.slot : null,
        wrongSlot: (roomState.checked && roomState.selectedSlot !== target.slot) ? roomState.selectedSlot : null
    });
    html += '<div id="roomMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function pickRoomSlot(idx) {
    if (roomState.checked) return;
    roomState.selectedSlot = idx;
    roomState.checked = true;
    vibrateShort();
    renderRoomPositionAnswer();
    var target = roomState.placed[roomState.targetIdx];
    var msg = document.getElementById('roomMsg');
    if (idx === target.slot) {
        msg.className = 'msg-box'; msg.style.display = 'block';
        msg.innerText = '🎉 정확해요! 맞는 자리를 기억했어요.';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextRoomRound()', 'retryRoomRound()', 'restartMemoryRoom()'));
    } else {
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '아쉬워요! 초록색이 원래 있던 자리예요. ' + roomRound + '라운드까지 성공했어요.';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryRoomRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartMemoryRoom()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}

// ---- 사라진 물건 찾기 ----
function renderRoomMissingAnswer() {
    var html = '<div class="game-title-box">🛋️ 기억의 방</div>';
    html += '<div class="game-sub-desc">' + roomState.scene.name + '에서 사라진 물건은 무엇일까요?</div>';
    html += '<div class="status-row"><div>' + roomRound + '라운드</div><div>' + roomState.scene.name + '</div></div>';
    html += renderRoomSceneBox(true, { hidePlacedIdx: roomState.missingIdx });
    html += '<div class="flash-grid">';
    roomState.missingOptions.forEach(function (p, idx) {
        var sel = roomState.selectedOption === idx;
        var isMissing = roomState.placed.indexOf(p) === roomState.missingIdx;
        var cls = 'flash-item' + (sel ? ' selected' : '');
        var extra = '';
        if (roomState.checked) {
            if (isMissing) extra = ' style="border:3px solid #10b981;"';
            else if (sel) extra = ' style="border:3px solid #ef4444;"';
        }
        html += '<button type="button" class="' + cls + '"' + extra + ' aria-label="' + p.name + '" onclick="pickRoomMissingOption(' + idx + ')">' + p.emoji + '</button>';
    });
    html += '</div>';
    if (!roomState.checked) {
        html += '<button class="action-btn" onclick="checkRoomMissingAnswer()">확인하기 ✅</button>';
    }
    html += '<div id="roomMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}
function pickRoomMissingOption(idx) {
    if (roomState.checked) return;
    roomState.selectedOption = idx;
    vibrateShort();
    renderRoomMissingAnswer();
}
function checkRoomMissingAnswer() {
    if (roomState.selectedOption === null || roomState.checked) return;
    roomState.checked = true;
    var missingObj = roomState.placed[roomState.missingIdx];
    var chosenObj = roomState.missingOptions[roomState.selectedOption];
    var isCorrect = chosenObj === missingObj;
    renderRoomMissingAnswer();
    var msg = document.getElementById('roomMsg');
    if (isCorrect) {
        msg.className = 'msg-box'; msg.style.display = 'block';
        msg.innerText = '🎉 정답이에요! ' + missingObj.name + '이(가) 사라졌었어요.';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextRoomRound()', 'retryRoomRound()', 'restartMemoryRoom()'));
    } else {
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '아쉬워요! 초록 테두리(' + missingObj.name + ')가 사라졌던 물건이에요.';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryRoomRound()">다시 풀어보기 🔁</button>' +
            '<button class="action-btn secondary" onclick="restartMemoryRoom()">처음부터 풀기 🔄</button>' +
            '</div>');
    }
}

// ===================== 게임 등록 =====================
GAME_INIT_FNS.memoryRoom = initMemoryRoom;
