// ===================== 4. 한글: 초성 퀴즈 =====================
var CHOSUNG_DATA_RAW = `
동물,강아지,🐶
동물,고양이,🐱
동물,호랑이,🐯
동물,사자,🦁
동물,코끼리,🐘
동물,원숭이,🐵
동물,토끼,🐰
동물,곰,🐻
동물,여우,🦊
동물,판다,🐼
동물,기린,🦒
동물,병아리,🐤
동물,부엉이,🦉
식물,장미,🌹
식물,소나무,🌲
식물,해바라기,🌻
식물,튤립,🌷
식물,선인장,🌵
식물,단풍나무,🍁
식물,벚꽃,🌸
식물,대나무,🎍
식물,클로버,🍀
과일,사과,🍎
과일,바나나,🍌
과일,포도,🍇
과일,딸기,🍓
과일,수박,🍉
과일,복숭아,🍑
과일,파인애플,🍍
과일,키위,🥝
과일,레몬,🍋
과일,체리,🍒
과일,망고,🥭
아이스크림,바닐라맛,🍦
아이스크림,초콜릿맛,🍫
아이스크림,딸기맛,🍨
아이스크림,멜론맛,🍈
아이스크림,녹차맛,🍵
아이스크림,팥빙수,🍧
아이스크림,죠스바,🦈🍦
아이스크림,누가바,🍫🍦
아이스크림,스크류바,🍓🍦
아이스크림,알껌바,🍬🍦
아이스크림,메로나,🍈🍦
아이스크림,찰떡아이스,🍡🍦
아이스크림,서주아이스주,🥛🍦
아이스크림,시모나,🥞🍦
아이스크림,캔디바,🍬🧊
아이스크림,투게더,🍨
아이스크림,젤라또,🍧
아이스크림,베스킨라빈스,🍨🥄
아이스크림,하겐다즈,🍨🍫
아이스크림,월드콘,🍦🌍
아이스크림,와,🍧🧊
아이스크림,바밤바,🌰🍦
아이스크림,비비빅,🫘🍦
아이스크림,옥동자,🍫🍦
아이스크림,생귤탱귤,🍊🧊
아이스크림,구구콘,🍫🍦
아이스크림,부라보콘,🍦🎶
아이스크림,빵빠레,🍦🎺
아이스크림,요맘때,🍓🍦
아이스크림,더블비안코,🍎🍦
아이스크림,슈퍼콘,🍦🦸
아이스크림,돼지바,🐷🍦
아이스크림,끌레도르,🧀🍦
아이스크림,누크바,🥜🍦
과자,쿠키,🍪
과자,사탕,🍬
과자,롤리팝,🍭
과자,도넛,🍩
과자,와플,🧇
과자,프레즐,🥨
과자,팝콘,🍿
도시,서울,🏙️
도시,부산,🌊
도시,인천,✈️
도시,제주,🏝️
도시,대전,🏙️
도시,광주,🏙️
`;
function parseChosungData(raw) {
    return raw.trim().split(/\n/).map(function (line) {
        var parts = line.split(/\t|,/).map(function (s) { return s.trim(); });
        return { category: parts[0] || '', word: parts[1] || '', emoji: parts[2] || '❓' };
    }).filter(function (item) { return item.category && item.word; });
}
var CHOSUNG_WORD_POOL = parseChosungData(CHOSUNG_DATA_RAW);

// 한글 초성 분해
var CHO_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
function getChosung(ch) {
    var code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return ch;
    return CHO_LIST[Math.floor(code / (21 * 28))];
}
function getWordChosung(word) {
    return word.split('').map(getChosung).join('');
}

var chosungSettings = { category: '전체', timeLimit: 0 };
var chosungState = {};
var SPEECH_SUPPORTED = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
var voiceRecognition = null;

function initChosungQuiz() {
    renderChosungSetup();
}

function renderChosungSetup() {
    var categories = ['전체'];
    CHOSUNG_WORD_POOL.forEach(function(item) {
        if (categories.indexOf(item.category) === -1) {
            categories.push(item.category);
        }
    });
    var times = [{ v: 5, l: '5초' }, { v: 10, l: '10초' }, { v: 20, l: '20초' }, { v: 0, l: '무제한' }];

    var html = '<div class="game-title-box">🔤 초성 퀴즈</div>';
    html += '<div class="game-sub-desc">분류와 제한시간을 고르고 시작해보세요!</div>';

    html += '<div class="setup-section-label">문제 분류</div><div class="setup-btn-group">';
    categories.forEach(function (c) {
        html += '<button class="setup-btn' + (chosungSettings.category === c ? ' active' : '') + '" onclick="setChosungCategory(\'' + c + '\')">' + c + '</button>';
    });
    html += '</div>';

    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (chosungSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setChosungTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';

    html += '<button class="action-btn" onclick="startChosungSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}

function setChosungCategory(c) { chosungSettings.category = c; renderChosungSetup(); }
function setChosungTimeLimit(t) { chosungSettings.timeLimit = t; renderChosungSetup(); }

function startChosungSession() {
    stopVoiceRecognition();
    var pool = chosungSettings.category === '전체' ? CHOSUNG_WORD_POOL : CHOSUNG_WORD_POOL.filter(function(item) { return item.category === chosungSettings.category; });
    chosungState = { correctCount: 0, totalCount: 0, pool: pool };
    nextChosungQuestion();
}

function nextChosungQuestion() {
    stopVoiceRecognition();
    if (chosungState.timerId) { clearInterval(chosungState.timerId); chosungState.timerId = null; }

    var pair = pickRandom(chosungState.pool);
    chosungState.word = pair.word;
    chosungState.emoji = pair.emoji;
    chosungState.category = pair.category;
    chosungState.revealed = false;
    chosungState.voiceSaid = undefined;
    chosungState.voiceMatched = undefined;
    chosungState.timedOut = false;
    chosungState.showSuccess = false;
    chosungState.timeLeft = chosungSettings.timeLimit;

    renderChosung();
    if (chosungSettings.timeLimit > 0) { startChosungTimer(); }
    if (SPEECH_SUPPORTED) { startVoiceAnswer(); }
}

function retryChosungQuestion() {
    if (chosungState.timerId) { clearInterval(chosungState.timerId); chosungState.timerId = null; }
    stopVoiceRecognition();
    chosungState.revealed = false;
    chosungState.voiceSaid = undefined;
    chosungState.voiceMatched = undefined;
    chosungState.timedOut = false;
    chosungState.showSuccess = false;
    chosungState.timeLeft = chosungSettings.timeLimit;

    renderChosung();
    if (chosungSettings.timeLimit > 0) { startChosungTimer(); }
    if (SPEECH_SUPPORTED) { startVoiceAnswer(); }
}

function startChosungTimer() {
    var bar = document.getElementById('chosungTimerBar');
    if (bar) bar.style.width = '100%';
    chosungState.timerId = setInterval(function () {
        chosungState.timeLeft -= 0.1;
        var pct = (chosungState.timeLeft / chosungSettings.timeLimit) * 100;
        if (pct < 0) pct = 0;
        var b = document.getElementById('chosungTimerBar');
        if (b) b.style.width = pct + '%';
        if (chosungState.timeLeft <= 0) {
            clearInterval(chosungState.timerId);
            chosungState.timerId = null;
            chosungState.timedOut = true;
            revealChosung(false);
        }
    }, 100);
    activeTimers.push(chosungState.timerId);
}

function renderChosung() {
    if (typeof reportGameRound === 'function') reportGameRound(chosungState.correctCount);
    var html = '<div class="game-title-box">🔤 초성 퀴즈</div>';
    html += '<div class="game-sub-desc">초성을 보고 정답을 소리 내어 말해보세요!' + (SPEECH_SUPPORTED ? ' 마이크 버튼을 누르고 말해보세요.' : ' 다 말했으면 눌러서 확인해요.') + '</div>';

    if (chosungSettings.timeLimit > 0 && !chosungState.revealed) {
        html += '<div class="timer-container" style="display:block;"><div class="timer-bar" id="chosungTimerBar"></div></div>';
    }

    html += '<div class="status-row"><div>🏷️ 분류: ' + chosungState.category + '</div><div>맞춘 개수: ' + chosungState.correctCount + ' / ' + chosungState.totalCount + '</div></div>';
    html += '<div class="hint-display">' + getWordChosung(chosungState.word) + '</div>';
    html += '<div class="game-sub-desc" style="text-align:center; letter-spacing:0.4rem; font-size:1rem;">' + Array(chosungState.word.length).fill('▢').join(' ') + ' (' + chosungState.word.length + '글자)</div>';

    if (!chosungState.revealed) {
        html += '<div class="big-display">🤔</div>';
        if (SPEECH_SUPPORTED) {
            html += '<button class="action-btn" style="background:#8b5cf6;" onclick="startVoiceAnswer()">🎤 음성으로 답하기</button>';
            html += '<div id="voiceStatus" class="game-sub-desc" style="margin-top:0.5rem; min-height:1.2rem;"></div>';
            html += '<div style="margin-top:0.3rem;"><button class="action-btn secondary" onclick="revealChosung(true)">그냥 정답 보기 👀</button></div>';
        } else {
            html += '<button class="action-btn" onclick="revealChosung(true)">정답 확인하기 👀</button>';
        }
    } else {
        html += '<div class="big-display">' + chosungState.emoji + '</div>';
        html += '<div class="game-sub-desc" style="font-weight:800; font-size:1.15rem; color:var(--primary);">정답: ' + chosungState.word + '</div>';

        if (chosungState.timedOut) {
            html += '<div class="msg-box bad" style="display:block;">⏰ 시간이 다 됐어요!</div>';
            html += buildStandardResultButtons('nextChosungQuestion()', 'retryChosungQuestion()', 'initChosungQuiz()');
        } else if (chosungState.showSuccess) {
            if (chosungState.voiceSaid !== undefined) {
                html += '<div class="game-sub-desc">내가 말한 것: "' + escapeHtml(chosungState.voiceSaid) + '"</div>';
            }
            html += '<div class="msg-box" style="display:block;">🎉 ' + (chosungState.voiceSaid !== undefined ? '정답을 정확히 말했어요!' : '정답이에요!') + '</div>';
            html += buildStandardResultButtons('nextChosungQuestion()', 'retryChosungQuestion()', 'initChosungQuiz()');
        } else if (chosungState.voiceSaid !== undefined) {
            html += '<div class="game-sub-desc">내가 말한 것: "' + escapeHtml(chosungState.voiceSaid) + '"</div>';
            html += '<div class="msg-box bad" style="display:block;">음... 다르게 들렸어요. 잘 말했는데 못 알아들었을 수도 있어요!</div>';
            var chosungEffNext = (typeof todayModeActive !== 'undefined' && todayModeActive) ? 'nextTodayModeRound()' : ((typeof randomModeActive !== 'undefined' && randomModeActive) ? 'nextRandomModeRound()' : 'nextChosungQuestion()');
            html += '<div class="options-grid">';
            html += '<button class="action-btn" onclick="overrideChosungCorrect()">그래도 맞았어요! 🙋</button>';
            html += '<button class="action-btn secondary" onclick="' + chosungEffNext + '">다음 문제 ▶</button>';
            html += '</div>';
        } else {
            html += '<div class="options-grid">';
            html += '<button class="action-btn" onclick="chosungResult(true)">맞았어요! 🎉</button>';
            html += '<button class="action-btn secondary" onclick="chosungResult(false)">아쉬워요</button>';
            html += '</div>';
        }
    }
    html += '<div style="margin-top:1.5rem;"><button class="action-btn secondary" onclick="initChosungQuiz()" style="font-size:0.85rem; padding:0.5rem 0.8rem;">설정으로 돌아가기 ⚙️</button></div>';
    document.getElementById('mainArea').innerHTML = html;
}

function revealChosung(manual) {
    stopVoiceRecognition();
    if (chosungState.timerId) { clearInterval(chosungState.timerId); chosungState.timerId = null; }
    chosungState.revealed = true;
    if (manual === false) {
        chosungState.timedOut = true;
        chosungState.totalCount++;
    }
    renderChosung();
}

function chosungResult(correct) {
    chosungState.totalCount++;
    if (correct) {
        chosungState.correctCount++;
        chosungState.showSuccess = true;
        renderChosung();
    } else {
        nextChosungQuestion();
    }
}
function overrideChosungCorrect() {
    chosungState.correctCount++;
    chosungState.showSuccess = true;
    renderChosung();
}

function stopVoiceRecognition() {
    if (voiceRecognition) {
        try { voiceRecognition.onresult = null; voiceRecognition.onerror = null; voiceRecognition.onend = null; voiceRecognition.stop(); } catch (e) { }
        voiceRecognition = null;
    }
}
function startVoiceAnswer() {
    var SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    stopVoiceRecognition();
    var statusEl = document.getElementById('voiceStatus');
    if (statusEl) statusEl.innerText = '🎙️ 듣고 있어요... 정답을 말해보세요!';

    voiceRecognition = new SpeechRecognitionAPI();
    voiceRecognition.lang = 'ko-KR';
    voiceRecognition.interimResults = false;
    voiceRecognition.maxAlternatives = 3;

    voiceRecognition.onresult = function (event) {
        var transcripts = [];
        for (var i = 0; i < event.results[0].length; i++) {
            transcripts.push(event.results[0][i].transcript);
        }
        handleVoiceResult(transcripts);
    };
    voiceRecognition.onerror = function () {
        var st = document.getElementById('voiceStatus');
        if (st) st.innerText = '⚠️ 잘 못 들었어요. 마이크 버튼을 다시 눌러보세요.';
    };
    voiceRecognition.onend = function () {};

    try { voiceRecognition.start(); } catch (e) { }
}
function normalizeSpeechText(s) {
    return String(s).replace(/\s+/g, '').trim();
}
function handleVoiceResult(transcripts) {
    if (chosungState.timerId) { clearInterval(chosungState.timerId); chosungState.timerId = null; }
    var target = normalizeSpeechText(chosungState.word);
    var matched = transcripts.some(function (t) {
        var n = normalizeSpeechText(t);
        return n === target || n.indexOf(target) > -1 || target.indexOf(n) > -1;
    });
    chosungState.voiceSaid = transcripts[0] || '(인식된 말이 없어요)';
    chosungState.voiceMatched = matched;
    chosungState.revealed = true;
    chosungState.totalCount++;
    if (matched) { chosungState.correctCount++; chosungState.showSuccess = true; }
    renderChosung();
}

// ===================== 게임 등록 =====================
GAME_INIT_FNS.chosungQuiz = initChosungQuiz;
