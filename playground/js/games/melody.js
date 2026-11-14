
// ===================== 기억력/연주: 멜로디 연주하기 (오선보 + 건반) =====================
// 이 파일은 memory.js 의 playPianoTone()/getPianoAudioCtx()/PIANO_WHITE_FREQ_BASE/PIANO_SHARP_FREQ_BASE 를 재사용합니다.
//
// ---- 노래 데이터 표기법 -----
// 기본 단위는 4분음표입니다.
//   도레미파솔라시      : 글자 하나 = 4분음표 1개 (기본, 괄호 없으면 무조건 4분음표)
//   도(8) 도(16) 도(2) 도(1) : 괄호 안 숫자 = 음표의 "분모" (8=8분,16=16분,2=2분,1=온음표)
//   u도 u레 ...        : 한 옥타브 위 (뒤에 (8) 등 길이 지정 가능, 예: u도(8))
//   d도 d레 ...        : 한 옥타브 아래
//   파# 도# ...        : 음이름 뒤에 #을 붙이면 반음 올림(샵)
//   -                   : 4분쉼표 1개 (기본). -(8) 처럼 뒤에 숫자를 붙이면 그 길이만큼 쉼
//   ~                   : 바로 앞 음을 16분음표 1개 분량 더 홀드(연장)
//   /                   : 피크업(앞부분 딸림음) 구분자. 이 글자 앞부분은 정식 마디로 세지 않고,
//                         이 지점부터 1마디가 시작되는 것으로 계산함(엘리제를 위하여처럼 짧은 도입부가 있는 곡에 사용)
//   {음음음}(길이)      : 잇단음표(셋잇단음표 등) 그룹. 중괄호 안의 음표들이 괄호 안에 지정한 "길이"를
//                         똑같이 나눠 가짐. 예) {도d라#d라}(4) = 도/낮은라#/낮은라 3개음이 4분음표 1개
//                         분량(4유닛)을 정확히 3등분해서 나눠 연주(셋잇단음표). 그룹 안에서도 '-'(쉼표)를
//                         쓸 수 있고, 음 뒤에 '~'를 붙이면 그 음이 다른 음보다 2배(또는 그 이상) 길게
//                         차지하도록 비중을 늘릴 수 있음. 예) {도d라#d라~}(4) → 도:라#:라 = 1:1:2 비율로
//                         4유닛을 나눔(도=1, 라#=1, 라=2유닛). 길이 괄호를 생략하면 음 개수만큼 4분음표
//                         길이로 계산됨. 그룹이 끝난 뒤에는 평소처럼 다른 음표/쉼표/'~'를 이어서 쓸 수 있음.
// 연속된 쉼표(-)는 자동으로 합쳐져서 알맞은 쉼표 기호로 그려집니다.
// 새 노래를 추가하려면 MELODY_SONGS 배열에 buildMelodySong(id, 이름, 패턴문자열, 마디당유닛수(선택,기본16=4/4), 분류(선택))만 추가하면 됩니다.
// 마디당유닛수: 4/4=16(기본, 생략가능), 3/4=12, 2/4=8 등 (4분음표=4유닛 기준)

// 내부적으로는 16분음표 1개 = 1유닛(최소단위)로 계산합니다.
var MELODY_DEFAULT_UNITS = 4; // 괄호 없을 때 기본값 = 4분음표
var MELODY_MEASURE_UNITS = 16; // 한 마디 기본값(4/4 기준 4분음표 4개) = 16유닛
var MELODY_UNIT_MS = 120; // 16분음표 1유닛의 재생 길이(ms) - 4분음표=480ms 기준
var MELODY_FIRST_NOTE_DELAY_MS = 1000; // 오디오 컨텍스트가 완전히 켜질 시간을 주기 위한 첫 음 지연

// 음이름(자연음 7개) - 크로매틱 인덱스(0~11)에서 sharp:false 인 자리와 대응
var MELODY_PITCH_CLASSES = [
    { name: '도', sharp: false }, { name: '도#', sharp: true },
    { name: '레', sharp: false }, { name: '레#', sharp: true },
    { name: '미', sharp: false },
    { name: '파', sharp: false }, { name: '파#', sharp: true },
    { name: '솔', sharp: false }, { name: '솔#', sharp: true },
    { name: '라', sharp: false }, { name: '라#', sharp: true },
    { name: '시', sharp: false }
];
var MELODY_WHITE_NAMES = ['도', '레', '미', '파', '솔', '라', '시'];
var MELODY_PC_TO_DIA = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };

function melodyStaffY(pitchClass, octaveOffset) {
    var dia = MELODY_PC_TO_DIA[pitchClass - (MELODY_PITCH_CLASSES[pitchClass].sharp ? 1 : 0)];
    var step = octaveOffset * 7 + dia;
    return 70 - step * 7;
}
function getMelodyNoteFreq(pitchClass, octaveOffset) {
    var meta = MELODY_PITCH_CLASSES[pitchClass];
    var dia = MELODY_PC_TO_DIA[pitchClass - (meta.sharp ? 1 : 0)];
    var baseName = MELODY_WHITE_NAMES[dia];
    var mult = Math.pow(2, octaveOffset);
    return meta.sharp ? PIANO_SHARP_FREQ_BASE[baseName] * mult : PIANO_WHITE_FREQ_BASE[baseName] * mult;
}
function getLedgerLineYs(y) {
    var ys = [];
    if (y < 0) { for (var ly = -14; ly >= y; ly -= 14) { ys.push(ly); } }
    else if (y > 56) { for (var ly2 = 70; ly2 <= y; ly2 += 14) { ys.push(ly2); } }
    return ys;
}

// ---- 패턴 문자열 파서 ----
function melodyMatchDurationParen(s, i) {
    if (s.charAt(i) !== '(') return null;
    var j = i + 1, numStr = '';
    while (j < s.length && s.charAt(j) >= '0' && s.charAt(j) <= '9') { numStr += s.charAt(j); j++; }
    if (numStr === '' || s.charAt(j) !== ')') return null;
    var denom = parseInt(numStr, 10);
    if (!denom || denom <= 0) return null;
    var units;
    if (denom === 3) { units = 12; }      // 점2분음표 (3박)
    else if (denom === 6) { units = 6; }  // 점4분음표 (1박반)
    else { units = Math.round(16 / denom); }
    return { units: units, nextIndex: j + 1 };
}
var MELODY_NOTE_LETTER_MAP = { '도': 0, '레': 2, '미': 4, '파': 5, '솔': 7, '라': 9, '시': 11 };

// 잇단음표 그룹 {...} 안쪽 문자열을 음/쉼표 토큰 배열로 파싱함.
// 그룹 안에서는 개별 길이 괄호를 쓰지 않고, 대신 '~'로 직전 토큰의 비중(weight)을 1씩 늘릴 수 있음.
function parseMelodyGroupTokens(inner) {
    var tokens = [];
    var i = 0;
    while (i < inner.length) {
        var c = inner.charAt(i);
        if (c === '~') {
            if (tokens.length > 0) { tokens[tokens.length - 1].weight += 1; }
            i++; continue;
        }
        if (c === '-') { tokens.push({ type: 'rest', weight: 1 }); i++; continue; }
        var octaveOffset = 0;
        var checkIdx = i;
        if (c === 'u') {
            if (inner.charAt(i + 1) === 'u') { octaveOffset = 2; checkIdx = i + 2; }
            else { octaveOffset = 1; checkIdx = i + 1; }
        } else if (c === 'd') {
            if (inner.charAt(i + 1) === 'd') { octaveOffset = -2; checkIdx = i + 2; }
            else { octaveOffset = -1; checkIdx = i + 1; }
        }
        var c2 = inner.charAt(checkIdx);
        if (MELODY_NOTE_LETTER_MAP.hasOwnProperty(c2)) {
            var pitchClass = MELODY_NOTE_LETTER_MAP[c2];
            var afterNoteIdx = checkIdx + 1;
            if (inner.charAt(afterNoteIdx) === '#') {
                pitchClass += 1;
                afterNoteIdx += 1;
                if (pitchClass >= 12) { pitchClass -= 12; octaveOffset += 1; }
            }
            tokens.push({ type: 'note', pitchClass: pitchClass, octaveOffset: octaveOffset, weight: 1 });
            i = afterNoteIdx;
            continue;
        }
        i++; // 인식할 수 없는 글자는 건너뜀
    }
    return tokens;
}

function parseMelodyPattern(str) {
    var noteMap = MELODY_NOTE_LETTER_MAP;
    var events = [];
    var anacrusisMarkerIndex = null;
    var i = 0;
    while (i < str.length) {
        var c = str.charAt(i);
        if (c === '/') { anacrusisMarkerIndex = events.length; i++; continue; }
        if (c === '{') {
            var closeIdx = str.indexOf('}', i + 1);
            if (closeIdx === -1) { i++; continue; } // 닫는 괄호가 없으면 잘못된 문법 - 건너뜀
            var groupTokens = parseMelodyGroupTokens(str.substring(i + 1, closeIdx));
            var afterBrace = closeIdx + 1;
            var groupTotalUnits = groupTokens.length * MELODY_DEFAULT_UNITS; // 길이 괄호 생략 시 기본값
            var gdm = melodyMatchDurationParen(str, afterBrace);
            if (gdm) { groupTotalUnits = gdm.units; afterBrace = gdm.nextIndex; }
            var totalWeight = 0;
            groupTokens.forEach(function (t) { totalWeight += t.weight; });
            var perWeightUnit = totalWeight > 0 ? groupTotalUnits / totalWeight : 0;
            groupTokens.forEach(function (t) {
                var tUnits = perWeightUnit * t.weight;
                if (t.type === 'note') {
                    events.push({ type: 'note', pitchClass: t.pitchClass, octaveOffset: t.octaveOffset, units: tUnits });
                } else if (events.length > 0 && events[events.length - 1].type === 'rest') {
                    events[events.length - 1].units += tUnits;
                } else {
                    events.push({ type: 'rest', units: tUnits });
                }
            });
            i = afterBrace;
            continue;
        }
        if (c === '~') {
            if (events.length > 0 && events[events.length - 1].type === 'note') {
                events[events.length - 1].units += 1;
            }
            i++; continue;
        }
        var octaveOffset = 0;
        var checkIdx = i;
        if (c === 'u') {
            if (str.charAt(i + 1) === 'u') { octaveOffset = 2; checkIdx = i + 2; }
            else { octaveOffset = 1; checkIdx = i + 1; }
        } else if (c === 'd') {
            if (str.charAt(i + 1) === 'd') { octaveOffset = -2; checkIdx = i + 2; }
            else { octaveOffset = -1; checkIdx = i + 1; }
        }
        var c2 = str.charAt(checkIdx);
        if (noteMap.hasOwnProperty(c2)) {
            var pitchClass = noteMap[c2];
            var afterNoteIdx = checkIdx + 1;
            if (str.charAt(afterNoteIdx) === '#') {
                pitchClass += 1;
                afterNoteIdx += 1;
                if (pitchClass >= 12) { pitchClass -= 12; octaveOffset += 1; } // 시# 같은 예외 처리(다음 옥타브로 넘어감)
            }
            i = afterNoteIdx;
            var dur = MELODY_DEFAULT_UNITS;
            var dm = melodyMatchDurationParen(str, i);
            if (dm) { dur = dm.units; i = dm.nextIndex; }
            events.push({ type: 'note', pitchClass: pitchClass, octaveOffset: octaveOffset, units: dur });
            continue;
        }
        if (c === '-') {
            i++;
            var dur2 = MELODY_DEFAULT_UNITS;
            var dm2 = melodyMatchDurationParen(str, i);
            if (dm2) { dur2 = dm2.units; i = dm2.nextIndex; }
            if (events.length > 0 && events[events.length - 1].type === 'rest') {
                events[events.length - 1].units += dur2;
            } else {
                events.push({ type: 'rest', units: dur2 });
            }
            continue;
        }
        i++;
    }
    var startUnit = 0;
    var noteEvents = [];
    events.forEach(function (e) {
        e.startUnit = startUnit;
        startUnit += e.units;
        if (e.type === 'note') { e.noteIndex = noteEvents.length; noteEvents.push(e); }
    });
    var anacrusisUnits = 0;
    if (anacrusisMarkerIndex !== null) {
        anacrusisUnits = (anacrusisMarkerIndex < events.length) ? events[anacrusisMarkerIndex].startUnit : startUnit;
    }
    return { events: events, noteEvents: noteEvents, totalUnits: startUnit, anacrusisUnits: anacrusisUnits };
}
function buildMelodySong(id, name, pattern, measureUnits, category) {
    var parsed = parseMelodyPattern(pattern);
    var mUnits = measureUnits || MELODY_MEASURE_UNITS;
    return {
        id: id, name: name, events: parsed.events, noteEvents: parsed.noteEvents, totalUnits: parsed.totalUnits,
        measureUnits: mUnits, anacrusisUnits: parsed.anacrusisUnits,
        timeSigTop: Math.round(mUnits / 4), timeSigBottom: 4,
        category: category || '기타'
    };
}
function getSongOctaveOffsets(song) {
    var set = { 0: true };
    song.noteEvents.forEach(function (e) { set[e.octaveOffset] = true; });
    var offsets = Object.keys(set).map(function (k) { return parseInt(k, 10); });
    offsets.sort(function (a, b) { return b - a; });
    return offsets;
}
// 이벤트가 몇 번째 마디에 속하는지 (0 = 피크업 마디, 1부터 정식 마디)
function melodyMeasureIndexOf(ev, song) {
    var anacrusis = song.anacrusisUnits || 0;
    if (ev.startUnit < anacrusis) return 0;
    return 1 + Math.floor((ev.startUnit - anacrusis) / song.measureUnits);
}
// 이벤트가 몇 번째 연습 구간에 속하는지 (피크업은 항상 0번 구간에 포함)
function melodySegIndexOf(ev) {
    var mi = melodyMeasureIndexOf(ev, melodyState.song);
    if (mi === 0) return 0;
    return Math.floor((mi - 1) / melodySettings.segmentMeasures);
}

var MELODY_SONGS = [    buildMelodySong('twinkle', '작은별', '도도솔솔라라솔-파파미미레레도-솔솔파파미미레-솔솔파파미미레-도도솔솔라라솔-파파미미레레도-',16, '동요'),
    buildMelodySong('butterfly', '나비야', '솔미미-파레레-도레미파솔솔솔-솔미미미파레레-도미솔미레미도-레레레레레미파-미미미미미파솔-솔미미미파레레레도미솔미레미도-',16, '동요'),
    buildMelodySong('schoolbell', '학교종', '솔솔라라솔솔미-솔솔미미레---솔솔라라솔솔미-솔미레미도---',16, '동요'),
    buildMelodySong('bear', '곰세마리', '도도(8)도(8)도도미솔미도솔(8)솔(8)미솔(8)솔(8)미도도도-솔솔미도솔솔솔-솔솔미도솔솔솔-솔솔미도솔(8)솔(8)솔(8)라(8)솔-u도솔u도솔미레도-',16, '동요'),
    buildMelodySong('shoes', '새신을신고', '솔미(8)레(8)도도도(8)d시(8)도(8)레(8)미미솔미(8)라(8)솔(8)파(8)미(8)레(8)미레도(4)',16, '동요'),
    buildMelodySong('Autumm', '가을길', '미(4)미(8)미(8)미(4)파(8)솔(8)라(4)솔(8)파(8)미(4)-(4)솔(4)솔(8)솔(8)솔(4)라(8)시(8)u도(4)시(8)라(8)솔(4)-(4)미(4)미(8)미(8)미(4)파(8)솔(8)라(4)솔(8)파(8)미(4)-(4)라(4)u도(4)시(4)u레(4)u도(4)u도(4)u도(4)-(4)라(4)u도(8)u도(8)u도(4)-(4)라(4)u도(8)u도(8)u도(4)-(4)라(4)u도(8)u도(8)u도(4)u도(4)u도(4)시(8)라(8)솔(4)파(4)미(4)미(8)미(8)미(4)파(8)솔(8)라(4)솔(8)파(8)미(4)-(4)솔(4)솔(8)솔(8)솔(4)라(8)시(8)u도(4)시(8)라(8)솔(4)-(4)미(4)미(8)미(8)미(4)파(8)솔(8)라(4)솔(8)파(8)미(4)-(4)라(4)u도(4)시(4)u레(4)u도(4)u도(4)u도(4)-(4)',16, '동요'),
    buildMelodySong('Child', '어린이날노래', '파(8)솔(8)라(8)-(8)파(8)솔(8)라(8)u레(8)u도(4)-(8)라(8)솔(8)파(8)라(8)솔(8)솔(4)-(4)파(8)솔(8)라(8)-(8)u도(8)라(8)솔(8)라(8)u도(4)-(8)라(8)솔(8)파(8)라(8)솔(8)파(4)-(4)u레(4){u레~u레}(4)라#(8)u도(4)u레(8)u도(4)라(4)라(8)u레(8)u도(8)라#(8)라(8)파(4)라(8)u도 (4)-(4)도(8)-(16)레(16)도(8)-(8)파(8)솔(8)라(8)u레(8)u도(4)-(8)라(8)솔(8)파(8)라(8)솔(8)파(4)-(4) ',12,'동요')  ,
    buildMelodySong('Rupolph', '루돌프 사슴코', '솔(8)라(4)솔(8)미(4)u도(4)라(4)솔(4)-(2)솔(8)라(8)솔(8)라(8)솔(4)u도(4)시(4)-(2)-(4)파(8)솔(4)파(8)레(4)시(4)라(4)솔(4)-(2)솔(8)라(8)솔(8)라(8)솔(4)라(4)미(4)-(2)-(4)솔(8)라(4)솔(8)미(4)u도(4)라(4)솔(4)-(2)솔(8)라(8)솔(8)라(8)솔(4)u도(4)시(4)-(2)-(4)파(8)솔(4)파(8)레(4)시(4)라(4)솔(4)-(2)솔(8)라(8)솔(8)라(8)솔(4)u레(4)u도(4)-(2)-(4)라(4)라(4)u도(4)라(4)솔(4)미(8)솔(4)-(2)파(4)라(4)솔(4)파(4)미(4)-(2)-(4)레(4)미(4)솔(4)라(4)시(4)시(8)시(4)-(4)-(8)u도(4)u도(4)시(4)라(4)솔(4)파(8)레(4)-(4)-(8)솔(8)라(4)솔(8)미(4)u도(4)라(4)솔(4)-(2)솔(8)라(8)솔(8)라(8)솔(8)솔(8)u도(4)시(4)-(2)-(4)파(8)솔(4)파(8)레(4)시(4)라(4)솔(4)-(2)솔(8)라(8)솔(8)라(8)솔(4)u레(4)u도(4)-(2)-(4)',16, '동요'),
    buildMelodySong('Jingle Bells', '징글벨', '레(8)시(8)라(8)솔(8)레(4)-(4)레(8)시(8)라(8)솔(8)미(4)-(4)미(8)u도(8)시(8)라(8)파#(4)-(4)u레(8)u레(8)u도(8)라(8)시(4)-(4)레(8)시(8)라(8)솔(8)레(4)-(4)레(8)시(8)라(8)솔(8)미(4)-(4)미(8)u도(8)시(8)라(8)u레(8)u레(8){u레~u레}(4)u미(8)u레(8)u도(8)라(8)솔(4)-(4)시(8)시(8)시(4)시(8)시(8)시(4)시(8)u레(8){솔~라}(4)시(4)-(4)u도(8)u도(8){u도~u도}(4)u도(8)시(8)시(8)시(8)시(8)라(8)라(8)시(8)라(4)u레(4)시(8)시(8)시(4)시(8)시(8)시(4)시(8)u레(8){솔~라}(4)시(4)-(4)u도(8)u도(8){u도~u도}(4)u도(8)시(8)시(8)시(8)u레(8)u레(8)u도(8)라(8)솔(4)-(4) ',16, '동요'),
    buildMelodySong('Bubble', '비누방울', '도(8)u도(8)u도(8)u도(4)도(4)미(8)레(8)u레(8)u레(8)u레(4)레(4)파(8)미(8)u미(8)u미(8)u미(8)u미(8)u도(4)u레(4)-(8)파(8)솔(4)레(4)-(8)도(8)u도(8)u도(8)u도(4)도(4)미(8)레(8)u레(8)u레(8)u레(4)레(4)파(8)u미(8)u파(8)u미(8)u미(8)u미(8)u레(4)u도(4)-(2)-(4)-(8)라(8)시(8)u도(8)라(4)-(4)-(8)솔(8)라(8)시(8)솔(4)-(8)-(4)파(8)솔(8)라(8)파(4)-(4)-(8)레(8)미(8)파(8)솔(8)라(8)시(8)u도(8)u레(8)u레(4)u레(4)u레(4)-(4)라(8)시(8)u도(8)라(4)-(4)-(8)솔(8)라(8)시(8)솔(4)-(4)-(8)파(8)솔(8)라(8)파(4)-(4)-(8)레(8)미(8)파(8)솔(8)라(8)시(8)u도(8)u레(8)u레(4)u레(4)u레(4)-(4)-(2)-(2)도(8)u도(8)u도(8)u도(4)도(4)미(8)레(8)u레(8)u레(8)u레(4)레(4)파(8)미(8)u미(8)u미(8)u미(8)u미(8)u도(4)u레(4)-(8)파(8)솔(4)레(4)-(8)도(8)u도(8)u도(8)u도(4)도(4)미(8)레(8)u레(8)u레(8)u레(4)레(4)파(8)u미(8)u파(8)u미(8)u미(8)u미(8)u레(4)u도(4)-(2)-(4)-(8)',16, '만화'),
    buildMelodySong('Dooli', '아기공룡둘리', '도#(8)미(8)도#(8)d시(4)-(2)-(2)-(4)-(8)d시(8)미(8)d시(8)d라(4)-(2)-(8)파#(4)미(4)-(4)도#(8)미(8)도#(8)d시(4)-(2)-(8)파#(4)미(4)-(2)도#(4)미(4)-(2)-(2)-(4)도#(8)미(8)도#(8)d시(4)-(2)-(2)-(4)-(8)솔#(4)미(8)도#(4)-(2)-(4)d라(4)d시(8)d시(4)-(2)-(2)-(8)d시(8)d라(8)d시(8)도#(4)-(2)-(2)-(4)-(8)레(8)미(8)파#(8)파#(4)-(2)-(8)파#(8)솔#(8)라(4)-(2)-(2)솔#(4)솔#(4)미(4)도#(4)미(8)파#(4)-(2)-(8)파#(4)솔#(4)라(4)솔#(8)솔#(8)파#(8)미(4)-(2)-(8)솔#(8)솔#(8)시(4)시(4)라(4)솔#(8)라(4)-(8)라(4)솔#(4)-(2)라(4)시(4)-(2)-(2)u도#(4)u도#(4)u도#(4)u레(4)u도#(8)시(4)-(2)-(8)시(4)시(4)라(4)u도#(8)u도#(8)시(8)라(4)-(4)-(8)라(8)-(4)-(8)u라(8)-(4)-(8)솔#(4)라(8)시(4)-(2)미(8)미(8)미(8)u도#(4)u도#(8)라(4)-(2)-(2)-(8)u도#(4)u도#(4)u도#(4)u레(4)u도#(8)시(4)-(2)-(8)시(4)시(4)라(4)u도#(8)u도#(8)시(8)라(4)-(4)-(8)라(8)-(4)-(8)u라(8)-(4)-(8)솔#(4)라(8)시(4)-(2)미(8)미(8)미(8)u도#(4)u도#(8)라(4)-(2)-(2)-(8)',16, '만화'),
    buildMelodySong('Ramen', '라면과구공탄', '라(8)라(8)라(8)라(8)u도#(8)u도#(8)u도#(8)u도#(8)u도#(8)u도#(8)시(8)라(8)솔#(4)-(4)솔#(4)솔#(8)솔#(8)시(4)시(8)시(8)시(8)시(8)솔#(8)파#(8)미(4)-(4)라(4)라(8)라(8)u도#(8)u도#(8)u도#(8)u도#(8)u도#(8)u도#(8)시(8)라(8)솔#(4)-(4)솔#(4)솔#(8)솔#(8)시(4)시(8)시(8)미(8)미(8)파#(8)솔#(8)라(4)-(4)',16, '만화'),
    buildMelodySong('Die Forelle', '송어', '솔/u도(6)u도(8)u미(4)u미(4)u도(2)솔(4)솔(4)솔(6)솔(8)u레(8)u도(8)시(8)라(8)솔(2)-(4)솔(4)u도(6)u도(8)u미(4)u미(4)u도(2)솔(4)u도(4)시(4)라(8)시(8)u도(4)파#(4)솔(2)-(4)솔(4)시(6)시(8)u도(8)시(8)라(8)시(8)u도(2)솔(4)u도(4)시(6)시(8)시(8)u파(8)u레(8)시(8)u도(2)-(4)u도(4)라(6)라(8)라(4)u도(4)u도(2)솔(2)솔(6)솔(8)u레(4)시(4)u도(2)-(4)u도(4)시(8)라(8)라(4)라(8)u도(8)시(8)u레(8)u도(2)솔(4)솔(4)솔(6)솔(8)u레(4)시(4)u도(2)-(2)',16, '가곡'),
    buildMelodySong('Fur Elise1', '엘리제를위하여(1)', 'u미(8)u레#(8)/u미(8)u레#(8)u미(8)시(8)u레(8)u도(8)라(8)-(4)도(8)미(8)라(8)시(8)-(4)미(8)솔#(8)시(8)u도(8)-(4)미(8)u미(8)u레#(8)u미(8)u레#(8)u미(8)시(8)u레(8)u도(8)라(8)-(4)도(8)미(8)라(8)시(8)-(4)미(8)u도(8)시(8)라(4)-(8)', 16, '가곡'),
    buildMelodySong('Fur Elise2', '엘리제를위하여(2)', 'u미(8)u레#(8)/u미(8)u레#(8)u미(8)시(8)u레(8)u도(8)라(8)-(4)도(8)미(8)라(8)시(8)-(4)미(8)솔#(8)시(8)u도(8)-(4)미(8)u미(8)u레#(8)u미(8)u레#(8)u미(8)시(8)u레(8)u도(8)라(8)-(4)도(8)미(8)라(8)시(8)-(4)미(8)u도(8)시(8)라(8)-(4)시(8)u도(8)u레(8)u미(8)-(4)솔(8)u파(8)u미(8)u레(8)-(4)파(8)u미(8)u레(8)u도(8)-(4)미(8)u레(8)u도(8)시(8)-(4)미(8)u미(8)미(8)u미(8)u미(8)uu미(8)u레#(8)u미(8)u레#(8)u미(8)u레#(8)u미(8)u레#(8)u미(8)u레#(8)u미(8)u레#(8)u미(8)시(8)u레(8)u도(8)라(8)-(4)도(8)미(8)라(8)시(8)-(4)미(8)솔#(8)시(8)u도(8)-(4)미(8)u미(8)u레#(8)u미(8)u레#(8)u미(8)시(8)u레(8)u도(8)라(8)-(4)도(8)미(8)라(8)시(8)-(4)미(8)u도(8)시(8)라(8)-(4)', 16, '가곡'),
    buildMelodySong('Loved', '사랑했나봐', 'u도#(8)u레(8)u미(8)라(8)/u파#(6)u파#(8)u미(8)u레(8)u도#(8)u레(8)u미(2)u도#(8)u미(8)u미(8)u파#(8)u파#(6)라(8)u미(8)u도#(16)u미(8)u파#(8)u도#(4)-(4)u도#(8)u레(8)u미(8)라(8)u파#(6)u파#(8)u솔#(8)u도#(8)u도(8)u도#(8)u라(6)u라(8)u라(8)u솔#(8)u파#(8)u미(8)u파#(8)u파#(8)u파#(8)u미(8)u미(8)u파#(8)-(8)u미(16)u파#(16)u솔(8)u파#(8)u미(8)u미(4)u레(8)u도#(8)u레(8)-(8)u레(8)u도#(8)라(8)솔#(8)솔#(8)라(8)시(8)u도#(8)u레(8)u도#(8)시(4)u도#(4)라(4)라(8)라(8)라(8)시(8)라(8)시(8)u도#(4)-(4)-(2)도#(8)미(8)라(8)(8)솔#(8)솔#(8)라(8)시(8)u도#(8)u레(8)u도#(8)시u(4)u도#(4)라(4)라(8)라(8)라(8)시(8)라(8)시(8)라(4)-(4)-(2)라(8)라(8)라(8)시(8)라(8)시(8)라(4)-(4)', 16, 'K-pop'),
    buildMelodySong('Love Scenario', '사랑을했다', '시(8)라(8)솔(8)/시(8)u레(4)-(4)시(8)라(8)솔(8)시(8)라(4)-(4)시(8)라(8)솔(8)라(8)라(8)-(8)솔(8)라(8)솔(8)시(8)미(4)-(4)시(8)라(8)솔(8)라(8)솔(8)시(8)u레(4)-(4)시(8)라(8)솔(8)시(8)라(4)-(4)시(8)라(8)솔(8)라(8)라(8)-(8)솔(8)라(8)솔(8)시(8)솔(4)-(4)시(8)라(8)솔(8)솔(8)솔(8)u미(4)u레(8)시(4)-(8)라(8)솔(8)시(8)라(4)-(4)솔(8)솔(8)솔(8)u미(4)u레(8)시(4)-(8)라(8)솔(8)라(8)솔(4)-(4)솔(8)솔(8)솔(8)u미(4)u솔(8)u미(4)-(8)u미(8)u솔(8)u미(8)u레(4)-(4)솔(8)솔(8)솔(8)u미(4)u레(8)시(4)-(8)라(8)솔(8)라(8)솔(4)-(4)-(8)', 16, 'K-pop' ),
    buildMelodySong('My home', '나비정원에가자', '레(16)레(16)라(4)-(8)솔(8)솔(8)솔(16)파(16)레(16)파(8)레-(4)레(16)레(16)라(4)-(8)솔(8)솔(8)솔(16)파(16)레(16)파(8)레-(4)u레(8)라(8)솔(16)솔(16)파(16)솔(8)파(8)레(8)레(16)레(16)u레(8)라(8)솔(16)솔(16)파(16)솔(8)라(4)-(8)레(16)레(16)라(4)-(8)솔(8)솔(8)솔(16)파(16)레(16)파(8)레(8)-(4)', 16, 'K-pop'),
    buildMelodySong('Love Dive', 'Love Dive', 'u레(16)u레(8)u미(8)u파(8)u레(16)u도#(16)u도#(8)u레(8)u미(8)-(16)u레(16)u레(8)u미(8)u파(8)u레(16)u도#(8)-(8)u라(16)u솔(16)u파(16)u미(16)u레(16)u레(8)u미(8)u파(8)u레(16)u도#(16)u도#(8)u레(8)u미(16)라(8){u도~라#라}(8)-(8){u도~라#라}(8)-(8)u라(16)u솔(8)u파(16)u미(8)u레(8)-(8)uu레(8)u라(8)u라#(8)u라(8)-(16)u솔(16)u솔(16)u파(16)u미(16)u파(16)u레(8)uu레(8)u라(8)u라#(8)u라(8)-(16)u레(16)u라(16)u레(16)u라(16)u레(16)u라(8)uu레(8)u라(8)u라#(8)u라(16)uu도(16)uu도(16)u라(16)uu도(16)uu레(16)uu레(8)-(8)-(16)uu도(16)u라(8)-(8)u라(16)u솔(8)u파(16)u미(8)u레(8)-(8)' , 16, 'K-pop'),
    buildMelodySong('Last Goodbye_Int', '오랜날 오랜밤(Int)',  '솔(4)미(8)파(8)솔(4)미(8)파(8)솔(8)d솔(8)d라(8)d시(8)도(8)레(8)미(8)파(8)미(4)도(8)레(8)미(4)d미(8)d파(8)d솔(8)d라(8)d솔(8)d파(8)d솔(4)-(4)d솔#(4)도(8)d라#(8)도(4)d라#(8)d솔#(8)d솔(8)d파(8)d미(8)d파(8)d솔(8)d라(8)d시(8)도(8)d라(4)도(8)d시(8)도(4)d시(8)d라(8)d시(8)d라(8)d시(8)도(8)레(8)도(8)레(8)미(8)파(4)-(2)-(4)', 16, 'K-pop' ),
    buildMelodySong('Last Goodbye1', '오랜날 오랜밤(전)', 'd솔(8)레(4)도(8)파(8)미(4)-(4)-(8)미(8)레(8)파(8)미(4)-(4)-(4)미(4)레(8)도(8)도(8)도(4)레(8)d시(4)-(2)d시(8)도(8)d라(4)-(4)d라(8)라(8)솔(8)파(8)미(8)도(4)-(8)도(8)솔(8)솔(8)솔(8)미(8)미(4)-(8)미(8)레(8)도(8)d시(8)도(8)d라(4)-(2)-(2)-(2)-(8)d솔(8)레(8)도(8)파(8)미(4)-(4)-(8)미(8)레(8)파(8)미(4)-(4)d솔(8)미(4)레(8)도(8)도(8)도(4)레(8)d시(4)-(2)d시(8)도(8)d라(4)-(4)d라(8)라(8)솔(8)파(8)미(8)도(4)-(8)도(8)솔(8)솔(8)솔(8)미(8)미(4)-(8)미(8)미(8)미(8)미(8)미(8)시(4)-(8)라(4)라(4)-(2)-(8)솔(4)u도(4)시(4)-(8)라(8)라(4)-(2)-(4)라(4)u레(4)u도(4)-(8)솔#(4)솔#(4)-(4)-(8)라#(4)솔#(4)라#(4)솔(4)-(4)솔(4)라(8)시(8)시(4)-(8)라(8)라(4)-(8)미(8)파(4)솔(8)라(4)u도(4)-(2)-(8)라(4)시(8)u도(8)u미(4)u레(8)u레(4)u도(4)u레(4)-(4)-(8)   ', 16, 'K-pop'),
    buildMelodySong('Last Goodbye2', '오랜날 오랜밤(후)', 'u도(4)u레(4)u미(4)-(4)-(8)u도(4)u레(4)u미(4)솔(8)u도(4)-(4)u도(8)u파(4)u미(8)u레(4)u미(4)u파(4)-(2)-(4)-(8)솔#(4)솔#(8)솔#(4)라#(8)솔#(8)솔(4)u레(8)시(8)u도(4)솔(8)미(8)파(4)u도(4)-(8)솔#(8)솔#(8)솔#(8)솔#(4)라#(8)솔(4)u미(4)u파(4)u솔(4)-(4)u미(4)u파(4)u솔(4)솔(8)u도(4)-(4)u도(8)u라(4)u솔(8)u파(4)u솔(4)u솔#(4)-(2)-(4)-(8)솔#(4)솔#(8)솔#(4)라#(8)솔#(8)솔(4)u레(8)시(8)u도(4)u레(8)u미(8)u미(4)라(4)-(2)-(2)-(8)u레(8)u미(8)u미(8)u미(4)u파(8)u미(4)-(2)u도(4)-(4)시(4)-(4)u도(4)-(2)-(4)-(8)   ', 16, 'K-pop' ),
    buildMelodySong('Last Goodbye3', '오랜날 오랜밤(전체)', 'd솔(8)레(4)도(8)파(8)미(4)-(4)-(8)미(8)레(8)파(8)미(4)-(4)-(4)미(4)레(8)도(8)도(8)도(4)레(8)d시(4)-(2)d시(8)도(8)d라(4)-(4)d라(8)라(8)솔(8)파(8)미(8)도(4)-(8)도(8)솔(8)솔(8)솔(8)미(8)미(4)-(8)미(8)레(8)도(8)d시(8)도(8)d라(4)-(2)-(2)-(2)-(8)d솔(8)레(8)도(8)파(8)미(4)-(4)-(8)미(8)레(8)파(8)미(4)-(4)d솔(8)미(4)레(8)도(8)도(8)도(4)레(8)d시(4)-(2)d시(8)도(8)d라(4)-(4)d라(8)라(8)솔(8)파(8)미(8)도(4)-(8)도(8)솔(8)솔(8)솔(8)미(8)미(4)-(8)미(8)미(8)미(8)미(8)미(8)시(4)-(8)라(4)라(4)-(2)-(8)솔(4)u도(4)시(4)-(8)라(8)라(4)-(2)-(4)라(4)u레(4)u도(4)-(8)솔#(4)솔#(4)-(4)-(8)라#(4)솔#(4)라#(4)솔(4)-(4)솔(4)라(8)시(8)시(4)-(8)라(8)라(4)-(8)미(8)파(4)솔(8)라(4)u도(4)-(2)-(8)라(4)시(8)u도(8)u미(4)u레(8)u레(4)u도(4)u레(4)-(4)-(8)u도(4)u레(4)u미(4)-(4)-(8)u도(4)u레(4)u미(4)솔(8)u도(4)-(4)u도(8)u파(4)u미(8)u레(4)u미(4)u파(4)-(2)-(4)-(8)솔#(4)솔#(8)솔#(4)라#(8)솔#(8)솔(4)u레(8)시(8)u도(4)솔(8)미(8)파(4)u도(4)-(8)솔#(8)솔#(8)솔#(8)솔#(4)라#(8)솔(4)u미(4)u파(4)u솔(4)-(4)u미(4)u파(4)u솔(4)솔(8)u도(4)-(4)u도(8)u라(4)u솔(8)u파(4)u솔(4)u솔#(4)-(2)-(4)-(8)솔#(4)솔#(8)솔#(4)라#(8)솔#(8)솔(4)u레(8)시(8)u도(4)u레(8)u미(8)u미(4)라(4)-(2)-(2)-(8)u레(8)u미(8)u미(8)u미(4)u파(8)u미(4)-(2)u도(4)-(4)시(4)-(4)u도(4)-(2)-(4)-(8)   ', 16, 'K-pop' )
               ];

var melodySettings = { songId: 'twinkle', segmentMeasures: 2, playbackSpeed: 1, octaveShift: 0 };
function setMelodyPlaybackSpeed(sp) { melodySettings.playbackSpeed = sp; updateMelodyTop(); }
function setMelodyOctaveShift(delta) {
    var next = (melodySettings.octaveShift || 0) + delta;
    if (next > 2) next = 2;
    if (next < -2) next = -2;
    if (next === melodySettings.octaveShift) return;
    melodySettings.octaveShift = next;
    updateMelodyKeyboardArea(); // 건반의 옥타브 구성/음높이가 바뀌므로 건반도 다시 그려야 함
    updateMelodyTop(); // 악보의 음 높이 표시도 함께 갱신
}
var melodyState = {};
var melodyMode = 'song';
var freePlaySettings = { octaves: 1 };
var freePlayState = {};

function initMelodyGame() { renderMelodySetup(); }
function setMelodyMode(m) { melodyMode = m; renderMelodySetup(); }

function renderMelodySetup() {
    var html = '<div class="game-title-box">🎼 멜로디 연주하기</div>';
    html += '<div class="setup-btn-group" style="margin-bottom:0.8rem;">';
    html += '<button class="setup-btn' + (melodyMode === 'song' ? ' active' : '') + '" onclick="setMelodyMode(\'song\')">🎵 노래 연습</button>';
    html += '<button class="setup-btn' + (melodyMode === 'free' ? ' active' : '') + '" onclick="setMelodyMode(\'free\')">🎹 자유 연주</button>';
    html += '</div>';
    html += melodyMode === 'free' ? renderFreePlaySetupInner() : renderSongSetupInner();
    document.getElementById('mainArea').innerHTML = html;
}

// 곡 목록을 분류(category)별로 그룹핑함 - MELODY_SONGS에 등장하는 순서대로 분류 섹션도 나열됨
function groupMelodySongsByCategory() {
    var order = [];
    var byCategory = {};
    MELODY_SONGS.forEach(function (s) {
        var cat = s.category || '기타';
        if (!byCategory[cat]) { byCategory[cat] = []; order.push(cat); }
        byCategory[cat].push(s);
    });
    return order.map(function (cat) { return { category: cat, songs: byCategory[cat] }; });
}

function renderSongSetupInner() {
    var html = '<div class="game-sub-desc">악보를 보고 건반을 순서대로 눌러 연주해보세요! 틀려도 끝까지 연주할 수 있어요.</div>';
    var groups = groupMelodySongsByCategory();
    groups.forEach(function (g) {
        html += '<div class="setup-section-label">' + g.category + '</div><div class="setup-btn-group">';
        g.songs.forEach(function (s) {
            html += '<button class="setup-btn' + (melodySettings.songId === s.id ? ' active' : '') + '" onclick="setMelodySong(\'' + s.id + '\')">' + s.name + '</button>';
        });
        html += '</div>';
    });
    html += '<div class="setup-section-label">연주 길이</div><div class="setup-btn-group">';
    [2, 4].forEach(function (m) {
        html += '<button class="setup-btn' + (melodySettings.segmentMeasures === m ? ' active' : '') + '" onclick="setMelodySegmentMeasures(' + m + ')">' + m + '칸씩</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startMelodySession()">시작하기 🚀</button>';
    return html;
}
function setMelodySegmentMeasures(m) { melodySettings.segmentMeasures = m; renderMelodySetup(); }

function renderFreePlaySetupInner() {
    var opts = [1, 2, 3];
    var html = '<div class="game-sub-desc">정해진 곡 없이 건반을 자유롭게 눌러 연주해보세요!</div>';
    html += '<div class="setup-section-label">옥타브 수</div><div class="setup-btn-group">';
    opts.forEach(function (n) {
        html += '<button class="setup-btn' + (freePlaySettings.octaves === n ? ' active' : '') + '" onclick="setFreePlayOctaves(' + n + ')">' + n + '옥타브</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startFreePlaySession()">시작하기 🚀</button>';
    return html;
}
function setFreePlayOctaves(n) { freePlaySettings.octaves = n; renderMelodySetup(); }
function setMelodySong(id) { melodySettings.songId = id; renderMelodySetup(); }
function getMelodySong() {
    var found = null;
    MELODY_SONGS.forEach(function (s) { if (s.id === melodySettings.songId) found = s; });
    return found || MELODY_SONGS[0];
}

// ===================== 건반 (도~시 12건반, 옥타브별로 세로로 쌓임) - 노래연습/자유연주 공용 =====================
// includeTrailingDo=true 이면 다음 옥타브의 '도'를 마지막에 추가해서 "도~도"까지 표시
function buildMelodyKeyboardRow(octaveOffset, includeTrailingDo) {
    var keys = [];
    var whiteSlot = 0;
    for (var pc = 0; pc < 12; pc++) {
        var meta = MELODY_PITCH_CLASSES[pc];
        var freq = getMelodyNoteFreq(pc, octaveOffset);
        if (!meta.sharp) {
            keys.push({ pitchClass: pc, octaveOffset: octaveOffset, name: meta.name, freq: freq, black: false, whiteSlot: whiteSlot });
            whiteSlot++;
        } else {
            keys.push({ pitchClass: pc, octaveOffset: octaveOffset, name: meta.name, freq: freq, black: true, whiteSlot: whiteSlot - 1 });
        }
    }
    if (includeTrailingDo) {
        keys.push({ pitchClass: 0, octaveOffset: octaveOffset + 1, name: '도', freq: getMelodyNoteFreq(0, octaveOffset + 1), black: false, whiteSlot: whiteSlot });
    }
    return keys;
}
function renderOctaveKeyboardRow(keys, rowLabel, clickFnName) {
    var whiteCount = keys.filter(function (k) { return !k.black; }).length;
    var whitePct = 100 / whiteCount;
    var blackPct = whitePct * 0.62;
    var rowH = 110;
    var html = '';
    if (rowLabel) { html += '<div style="font-size:0.75rem; color:#6b7280; margin:0.3rem 0 0.15rem 0.2rem;">' + rowLabel + '</div>'; }
    html += '<div style="position:relative; width:100%; height:' + rowH + 'px; margin-bottom:0.5rem;">';
    var wSlot = 0;
    keys.forEach(function (k) {
        if (k.black) return;
        html += '<button style="position:absolute; left:' + (wSlot * whitePct) + '%; top:0; width:' + whitePct + '%; height:' + rowH + 'px; background:#ffffff; border:2px solid #1f2937; border-radius:0 0 0.3rem 0.3rem; display:flex; align-items:flex-end; justify-content:center; padding-bottom:0.4rem; font-weight:800; font-size:0.85rem; color:#4b5563; box-shadow:0 3px 0 #cbd5e1; z-index:1; transition:background 0.08s, transform 0.08s;" onclick="' + clickFnName + '(this,' + k.octaveOffset + ',' + k.pitchClass + ')">' + k.name + '</button>';
        wSlot++;
    });
    keys.forEach(function (k) {
        if (!k.black) return;
        var leftPct = (k.whiteSlot + 1) * whitePct - blackPct / 2;
        html += '<button style="position:absolute; left:' + leftPct + '%; top:0; width:' + blackPct + '%; height:' + (rowH * 0.6) + 'px; background:#1f2937; border:2px solid #000; border-radius:0 0 0.25rem 0.25rem; display:flex; align-items:flex-end; justify-content:center; padding-bottom:0.3rem; font-weight:800; font-size:0.68rem; color:#fff; z-index:2; transition:background 0.08s, transform 0.08s;" onclick="' + clickFnName + '(this,' + k.octaveOffset + ',' + k.pitchClass + ')">' + k.name + '</button>';
    });
    html += '</div>';
    return html;
}

// ===================== 자유 연주 =====================
function startFreePlaySession() {
    freePlayState = { octaves: freePlaySettings.octaves };
    renderFreePlayGame();
}
function renderFreePlayGame() {
    var n = freePlayState.octaves;
    var html = '<div class="game-title-box">🎹 자유 연주 (' + n + '옥타브)</div>';
    html += '<div class="game-sub-desc">건반을 눌러 자유롭게 연주해보세요!</div>';
    for (var i = n - 1; i >= 0; i--) {
        html += renderOctaveKeyboardRow(buildMelodyKeyboardRow(i, true), (i + 1) + '옥타브', 'freePlayKeyClick');
    }
    html += '<button class="action-btn secondary" style="width:100%; margin-top:0.6rem;" onclick="renderMelodySetup()">설정으로 돌아가기 ⏮</button>';
    document.getElementById('mainArea').innerHTML = html;
}
// 건반을 누르면 색을 바꾸고 살짝 눌리는 효과를 줌 (흰/검 건반 색 자동 구분)
function flashKeyPress(btn) {
    if (!btn) return;
    var isBlackKey = btn.style.background.indexOf('31, 41, 55') > -1 || btn.style.background === '#1f2937' || btn.style.background === 'rgb(31, 41, 55)';
    var origBg = btn.style.background;
    btn.style.background = isBlackKey ? '#eab308' : '#fde68a';
    btn.style.transform = 'translateY(2px)';
    var t = gameTimeout(function () {
        btn.style.background = origBg;
        btn.style.transform = '';
    }, 150);
}
function freePlayKeyClick(btn, octaveOffset, pitchClass) {
    playPianoTone(getMelodyNoteFreq(pitchClass, octaveOffset));
    vibrateShort();
    flashKeyPress(btn);
}

// ===================== 노래 연습 세션 =====================
// 이 파일은 memory.js 의 playPianoTone / getPianoAudioCtx / PIANO_*_FREQ_BASE 에 의존한다.
// index.html의 로드 순서상 memory.js가 먼저 오지만, 순서가 어긋나면 조용히 무음이 되므로 한 번 경고한다.
if (typeof playPianoTone !== 'function') {
    console.warn('[melody] memory.js가 먼저 로드되지 않아 소리가 나지 않을 수 있습니다.');
}
function startMelodySession(fullMode) {
    var song = getMelodySong();
    melodyState = {
        song: song, pos: 0, hits: 0,
        mode: fullMode ? 'full' : 'segment',
        segIndex: 0, finished: false, isPlaying: false, demoActiveEvent: null,
        displayFull: false
    };
    renderMelodyGame(); // 자동재생 없이 화면만 그림 - 구간듣기/전체듣기 버튼을 눌러야 재생 시작
}
function retryMelodySong() { startMelodySession(melodyState.mode === 'full'); }

function getVisibleEvents() {
    if (melodyState.mode === 'full' || melodyState.displayFull) return melodyState.song.events;
    return melodyState.song.events.filter(function (e) { return melodySegIndexOf(e) === melodyState.segIndex; });
}

// ---- 재생 컨트롤: 구간 듣기 / 전체 듣기 / 전체 악보보기 / 중단하기 ----
function listenSegmentDemo() {
    melodyState.displayFull = false;
    startMelodyPlaybackWith(getVisibleEvents());
}
function listenFullDemo() {
    melodyState.displayFull = true;
    updateMelodyTop(); // 전체 악보로 화면 전환
    startMelodyPlaybackWith(melodyState.song.events);
}
// 재생 없이 전체 악보만 보기/구간 악보로 되돌리기 토글
function toggleMelodyScoreView() {
    melodyState.displayFull = !melodyState.displayFull;
    updateMelodyTop();
}
function stopMelodyPlayback() {
    clearAllGameTimers();
    melodyState.isPlaying = false;
    melodyState.demoActiveEvent = null;
    updateMelodyTop();
}
function startMelodyPlaybackWith(events) {
    getPianoAudioCtx(); // 오디오 컨텍스트를 버튼 누르는 즉시 생성/재개시켜서, 실제 재생 전 준비 시간을 확보
    clearAllGameTimers(); // 기존에 재생 중이던 음이 있다면 멈추고 새로 시작
    melodyState.isPlaying = true;
    melodyState.demoActiveEvent = null;
    updateMelodyTop();
    playMelodyEventsDemo(events, function () {
        melodyState.isPlaying = false;
        melodyState.demoActiveEvent = null;
        updateMelodyTop();
    });
}
// 구간이 바뀔 때(연주 중 다음 구간으로 넘어갈 때)는 그대로 자동으로 미리 들려줌
function startMelodyPlayback() { startMelodyPlaybackWith(getVisibleEvents()); }
// 악보의 특정 음/쉼표를 클릭하면: 재생 중이던 음악을 멈추고 그 지점부터 다시 재생
function melodyScoreEventClick(startUnit) {
    var events = getVisibleEvents().filter(function (e) { return e.startUnit >= startUnit; });
    if (events.length === 0) return;
    startMelodyPlaybackWith(events);
}


// ---- 오선보 렌더링: 마디 단위로 그룹화, 화면 폭에 따라 한 줄/두 줄 자동 분배 ----
function isMelodyWideScreen() { return window.innerWidth >= 700; }

function renderMelodyStaffLines(events) {
    var song = melodyState.song;
    var byMeasure = {};
    events.forEach(function (ev) {
        var mi = melodyMeasureIndexOf(ev, song);
        if (!byMeasure[mi]) byMeasure[mi] = [];
        byMeasure[mi].push(ev);
    });
    var measureIdxs = Object.keys(byMeasure).map(function (k) { return parseInt(k, 10); }).sort(function (a, b) { return a - b; });
    var wide = isMelodyWideScreen();
    var measuresPerLine = wide ? melodySettings.segmentMeasures : Math.max(1, Math.ceil(melodySettings.segmentMeasures / 2));
    var lines = [];
    var cur = [];
    var curCount = 0;
    measureIdxs.forEach(function (mi) {
        if (mi === 0) { cur = cur.concat(byMeasure[mi]); return; } // 피크업 마디는 세지 않고 현재 줄에 포함
        if (curCount >= measuresPerLine) { lines.push(cur); cur = []; curCount = 0; }
        cur = cur.concat(byMeasure[mi]);
        curCount++;
    });
    if (cur.length > 0) lines.push(cur);

    var unitPx = wide ? 22 : 18;
    var html = '<div style="margin-bottom:0.8rem;">';
    lines.forEach(function (lineEvents) {
        var showTimeSig = lineEvents.length > 0 && lineEvents[0].startUnit === 0;
        html += renderMelodyStaffSvg(lineEvents, unitPx, song, showTimeSig);
    });
    html += '</div>';
    return html;
}

function classifyMelodyDuration(u) {
    if (u <= 1) return { hollow: false, stem: true, flags: 2, dot: false };
    if (u === 2) return { hollow: false, stem: true, flags: 1, dot: false };
    if (u === 3) return { hollow: false, stem: true, flags: 1, dot: true };
    if (u === 4) return { hollow: false, stem: true, flags: 0, dot: false };
    if (u === 6) return { hollow: false, stem: true, flags: 0, dot: true };
    if (u === 8) return { hollow: true, stem: true, flags: 0, dot: false };
    if (u === 12) return { hollow: true, stem: true, flags: 0, dot: true };
    if (u >= 16) return { hollow: true, stem: false, flags: 0, dot: false };
    return { hollow: u >= 8, stem: true, flags: u < 2 ? 1 : 0, dot: false };
}

function renderQuarterRestPath(cx, midY, fill) {
    var d = 'M ' + (cx - 4) + ' ' + (midY - 11) +
        ' L ' + (cx + 4) + ' ' + (midY - 11) +
        ' L ' + (cx - 4) + ' ' + (midY + 1) +
        ' L ' + (cx + 4) + ' ' + (midY + 1) +
        ' L ' + (cx - 2) + ' ' + (midY + 11);
    return '<path d="' + d + '" stroke="' + fill + '" stroke-width="2.2" fill="none" stroke-linejoin="round" stroke-linecap="round" />';
}
function renderEighthRestShape(cx, midY, fill) {
    var h = '<circle cx="' + (cx + 4) + '" cy="' + (midY - 6) + '" r="3" fill="' + fill + '" />';
    h += '<line x1="' + (cx + 4) + '" y1="' + (midY - 6) + '" x2="' + (cx - 4) + '" y2="' + (midY + 9) + '" stroke="' + fill + '" stroke-width="2" stroke-linecap="round" />';
    return h;
}
function renderSixteenthRestShape(cx, midY, fill) {
    var h = '<circle cx="' + (cx + 5) + '" cy="' + (midY - 8) + '" r="2.6" fill="' + fill + '" />';
    h += '<circle cx="' + (cx + 1) + '" cy="' + (midY - 1) + '" r="2.6" fill="' + fill + '" />';
    h += '<line x1="' + (cx + 5) + '" y1="' + (midY - 8) + '" x2="' + (cx - 5) + '" y2="' + (midY + 11) + '" stroke="' + fill + '" stroke-width="2" stroke-linecap="round" />';
    return h;
}
function renderMelodyRestGlyph(cx, staffTop, units, fill) {
    var midY = staffTop + 28;
    var line4Y = staffTop + 14;
    if (units <= 1) { return renderSixteenthRestShape(cx, midY, fill); }
    if (units === 2) { return renderEighthRestShape(cx, midY, fill); }
    if (units === 3) { return renderEighthRestShape(cx, midY, fill) + '<circle cx="' + (cx + 12) + '" cy="' + (midY - 4) + '" r="1.6" fill="' + fill + '" />'; }
    if (units === 4) { return renderQuarterRestPath(cx, midY, fill); }
    if (units === 6) { return renderQuarterRestPath(cx, midY, fill) + '<circle cx="' + (cx + 12) + '" cy="' + (midY - 4) + '" r="1.6" fill="' + fill + '" />'; }
    if (units === 8) { return '<rect x="' + (cx - 6) + '" y="' + (midY - 5) + '" width="12" height="5" fill="' + fill + '" />'; }
    if (units === 12) { return '<rect x="' + (cx - 6) + '" y="' + (midY - 5) + '" width="12" height="5" fill="' + fill + '" />' + '<circle cx="' + (cx + 11) + '" cy="' + (midY - 2) + '" r="1.6" fill="' + fill + '" />'; }
    return '<rect x="' + (cx - 6) + '" y="' + line4Y + '" width="12" height="5" fill="' + fill + '" />';
}

// events: 한 줄에 표시할 이벤트 배열(이미 시간순 정렬됨). song: 마디/피크업 정보를 위해 필요. showTimeSig: 박자표 표시 여부(곡의 맨 처음 줄에서만 true)
function renderMelodyStaffSvg(events, unitPx, song, showTimeSig) {
    var octShift = melodySettings.octaveShift || 0;
    var leftPad = showTimeSig ? 70 : 46;
    var unitOffset = events.length ? events[0].startUnit : 0;
    var minY = 0, maxY = 56;
    var contentEnd = unitOffset;
    events.forEach(function (ev) {
        var end = ev.startUnit + ev.units;
        if (end > contentEnd) contentEnd = end;
        if (ev.type === 'rest') return;
        var y = melodyStaffY(ev.pitchClass, ev.octaveOffset + octShift);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    });
    var widthUnits = Math.max(contentEnd - unitOffset, 1);
    var staffTop = Math.max(0, -minY) + 24;
    var bottomMargin = Math.max(0, maxY - 56) + 26;
    var svgHeight = staffTop + 56 + bottomMargin;
    var svgWidth = leftPad + widthUnits * unitPx + 24;
    var html = '<div style="background:#fff; border:2px solid #1f2937; border-radius:0.6rem; padding:0.6rem 0.4rem; margin-bottom:0.5rem; overflow-x:auto;">';
    html += '<svg width="' + svgWidth + '" height="' + svgHeight + '" viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" style="display:block; max-width:100%;">';
    [0, 14, 28, 42, 56].forEach(function (ly) {
        html += '<line x1="4" y1="' + (staffTop + ly) + '" x2="' + (svgWidth - 4) + '" y2="' + (staffTop + ly) + '" stroke="#1f2937" stroke-width="1.5" />';
    });
    // 마디선: 곡의 마디당 유닛수(song.measureUnits) 기준, 피크업이 있으면 그 지점부터 정식 마디 시작
    var anacrusis = song.anacrusisUnits || 0;
    var firstBoundary = anacrusis > 0 ? anacrusis : song.measureUnits;
    for (var mb = firstBoundary; mb <= unitOffset + widthUnits; mb += song.measureUnits) {
        if (mb >= unitOffset) {
            var barX = leftPad + (mb - unitOffset) * unitPx;
            var isPickupBoundary = (anacrusis > 0 && mb === anacrusis);
            var barStroke = isPickupBoundary ? '#9ca3af' : '#1f2937';
            var barDash = isPickupBoundary ? ' stroke-dasharray="4,3"' : '';
            html += '<line x1="' + barX + '" y1="' + staffTop + '" x2="' + barX + '" y2="' + (staffTop + 56) + '" stroke="' + barStroke + '" stroke-width="1.2"' + barDash + ' />';
        }
    }
    html += '<text x="6" y="' + (staffTop + 52) + '" font-size="46" fill="#1f2937">𝄞</text>';
    if (showTimeSig) {
        html += '<text x="34" y="' + (staffTop + 27) + '" font-size="22" font-weight="800" fill="#1f2937" text-anchor="middle">' + song.timeSigTop + '</text>';
        html += '<text x="34" y="' + (staffTop + 55) + '" font-size="22" font-weight="800" fill="#1f2937" text-anchor="middle">' + song.timeSigBottom + '</text>';
    }
    events.forEach(function (ev) {
        var relUnit = ev.startUnit - unitOffset;
        var cx = leftPad + relUnit * unitPx + (ev.units * unitPx) / 2 + 14;
        html += '<g style="cursor:pointer;" onclick="melodyScoreEventClick(' + ev.startUnit + ')">';
        html += '<rect x="' + (leftPad + relUnit * unitPx) + '" y="' + staffTop + '" width="' + (ev.units * unitPx) + '" height="56" fill="transparent" />';
        if (ev.type === 'rest') {
            html += renderMelodyRestGlyph(cx, staffTop, ev.units, '#9ca3af');
            html += '</g>';
            return;
        }
        var meta = MELODY_PITCH_CLASSES[ev.pitchClass];
        var y = melodyStaffY(ev.pitchClass, ev.octaveOffset + octShift);
        var cy = staffTop + y;
        var isCurrent = ev.noteIndex === melodyState.pos;
        var isPast = ev.noteIndex < melodyState.pos;
        var isDemoActive = ev === melodyState.demoActiveEvent;
        var fill = isCurrent ? '#3b82f6' : (isPast ? '#9ca3af' : '#1f2937');
        if (isDemoActive) { fill = '#eab308'; }
        var d = classifyMelodyDuration(ev.units);
        getLedgerLineYs(y).forEach(function (ly) {
            html += '<line x1="' + (cx - 14) + '" y1="' + (staffTop + ly) + '" x2="' + (cx + 14) + '" y2="' + (staffTop + ly) + '" stroke="#1f2937" stroke-width="1.5" />';
        });
        if (isDemoActive) {
            html += '<circle class="melody-pulse" cx="' + cx + '" cy="' + cy + '" r="13" fill="#fde047" />';
        }
        if (meta.sharp) {
            html += '<text x="' + (cx - 20) + '" y="' + (cy + 6) + '" font-size="16" fill="' + fill + '">♯</text>';
        }
        if (d.hollow) {
            html += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="7" ry="5.5" fill="#fff" stroke="' + fill + '" stroke-width="2" transform="rotate(-20 ' + cx + ' ' + cy + ')" />';
        } else {
            html += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="7" ry="5.5" fill="' + fill + '" transform="rotate(-20 ' + cx + ' ' + cy + ')" />';
        }
        if (d.stem) {
            var stemX = cx + 6.5, stemTopY = cy - 22;
            html += '<line x1="' + stemX + '" y1="' + cy + '" x2="' + stemX + '" y2="' + stemTopY + '" stroke="' + fill + '" stroke-width="1.5" />';
            for (var fi = 0; fi < d.flags; fi++) {
                var fy = stemTopY + fi * 8;
                var flagPath = 'M ' + stemX + ' ' + fy + ' L ' + (stemX + 9) + ' ' + (fy + 5) + ' L ' + stemX + ' ' + (fy + 11) + ' Z';
                html += '<path d="' + flagPath + '" fill="' + fill + '" />';
            }
        }
        if (d.dot) {
            html += '<circle cx="' + (cx + 12) + '" cy="' + (cy - 2) + '" r="1.6" fill="' + fill + '" />';
        }
        html += '<text x="' + cx + '" y="' + (staffTop + maxY + 20) + '" font-size="12" fill="' + (isDemoActive ? '#a16207' : '#6b7280') + '" font-weight="' + (isDemoActive ? '800' : '400') + '" text-anchor="middle">' + meta.name + '</text>';
        html += '</g>';
    });
    html += '</svg></div>';
    return html;
}

function renderMelodyKeyboard() {
    var shift = melodySettings.octaveShift || 0;
    var offsets = getSongOctaveOffsets(melodyState.song).map(function (o) { return o + shift; });
    var html = '';
    offsets.forEach(function (off) {
        var label = offsets.length > 1 ? (off === 0 ? '기본 옥타브' : (off > 0 ? '+' + off + '옥타브 (높은음)' : off + '옥타브 (낮은음)')) : null;
        html += renderOctaveKeyboardRow(buildMelodyKeyboardRow(off, true), label, 'melodyKeyClick');
    });
    return html;
}
// 옥타브 조정 시 건반의 옥타브 구성/음높이가 바뀌므로 건반 영역만 별도로 다시 그림
function updateMelodyKeyboardArea() {
    var el = document.getElementById('melodyKeyboardArea');
    if (el) { el.innerHTML = renderMelodyKeyboard(); }
}

function renderMelodyTopHtml() {
    if (typeof reportGameRound === 'function') reportGameRound(melodyState.hits);
    var song = melodyState.song;
    var totalNotes = song.noteEvents.length;
    var isFull = melodyState.mode === 'full';
    var html = '<style>@keyframes melodyPulse{0%,100%{opacity:0.2;}50%{opacity:0.75;}}.melody-pulse{animation:melodyPulse 0.5s ease-in-out infinite;}</style>';
    html += '<div class="game-title-box">🎼 멜로디 연주하기 · ' + song.name + (isFull ? ' (전체곡)' : '') + '</div>';
    html += '<div class="game-sub-desc">파란색 음표를 순서대로 건반으로 눌러보세요! (연주 중 노란색으로 반짝이는 음이 지금 들리는 음이에요. 악보를 클릭하면 그 부분부터 들을 수 있어요)</div>';
    html += '<div class="status-row"><div>' + melodyState.pos + ' / ' + totalNotes + '음 연주함</div><div>맞은 음: ' + melodyState.hits + '</div></div>';
    html += renderMelodyStaffLines(getVisibleEvents());
    if (!melodyState.isPlaying) {
        var octShift = melodySettings.octaveShift || 0;
        html += '<div style="display:flex; justify-content:space-between; align-items:baseline;">';
        html += '<span class="setup-section-label">재생 속도</span>';
        html += '<span class="setup-section-label">옥타브 조정 <span style="color:var(--primary);">' + (octShift > 0 ? '+' + octShift : octShift) + '</span></span>';
        html += '</div>';
        html += '<div class="setup-btn-group" style="margin-bottom:0.5rem; flex-wrap:nowrap; gap:0.3rem;">';
        [0.5, 0.8, 1, 1.2].forEach(function (sp) {
            html += '<button class="setup-btn' + (melodySettings.playbackSpeed === sp ? ' active' : '') + '" style="min-width:0; padding:0.6rem 0.2rem; font-size:0.82rem;" onclick="setMelodyPlaybackSpeed(' + sp + ')">x' + sp + '</button>';
        });
        html += '<button class="setup-btn" style="flex:0 0 2.4rem; min-width:0; padding:0.6rem 0;" onclick="setMelodyOctaveShift(-1)"' + (octShift <= -2 ? ' disabled' : '') + '>▼</button>';
        html += '<button class="setup-btn" style="flex:0 0 2.4rem; min-width:0; padding:0.6rem 0;" onclick="setMelodyOctaveShift(1)"' + (octShift >= 2 ? ' disabled' : '') + '>▲</button>';
        html += '</div>';
    }
    if (melodyState.isPlaying) {
        html += '<button class="action-btn secondary" style="margin-bottom:0.8rem;" onclick="stopMelodyPlayback()">⏸ 중단하기</button>';
    } else if (isFull) {
        html += '<button class="action-btn secondary" style="margin-bottom:0.8rem;" onclick="listenFullDemo()">🔊 다시 듣기</button>';
    } else {
        html += '<div class="options-grid" style="grid-template-columns:repeat(4, 1fr); gap:0.35rem; margin-bottom:0.8rem;">';
        html += '<button class="action-btn secondary" style="padding:0.6rem 0.3rem; font-size:0.85rem;" onclick="listenSegmentDemo()">구간 듣기</button>';
        html += '<button class="action-btn secondary" style="padding:0.6rem 0.3rem; font-size:0.85rem;" onclick="listenFullDemo()">전체 듣기</button>';
        html += '<button class="action-btn secondary" style="padding:0.6rem 0.3rem; font-size:0.85rem;" onclick="toggleMelodyScoreView()">' + (melodyState.displayFull ? '구간 악보로' : '전체 악보보기') + '</button>';
        html += '<button class="action-btn secondary" style="padding:0.6rem 0.3rem; font-size:0.85rem;" onclick="renderMelodySetup()">처음으로</button>';
        html += '</div>';
    }
    return html;
}
// 건반은 세션 동안 절대 바뀌지 않으므로(같은 곡이면 옥타브 구성 고정) 한 번만 그리고,
// 이후에는 melodyTopArea(악보/상태/재생버튼)만 갱신해서 건반 DOM이 계속 살아있게 함
// -> 건반 눌림 효과(flashKeyPress)가 화면에 그려질 시간을 확보하기 위함
// (단, 옥타브 조정 버튼을 누른 경우는 예외적으로 updateMelodyKeyboardArea()가 건반도 함께 다시 그림)
function renderMelodyGame() {
    var html = '<div id="melodyTopArea">' + renderMelodyTopHtml() + '</div>';
    html += '<div id="melodyKeyboardArea">' + renderMelodyKeyboard() + '</div>';
    document.getElementById('mainArea').innerHTML = html;
}
function updateMelodyTop() {
    var el = document.getElementById('melodyTopArea');
    if (el) { el.innerHTML = renderMelodyTopHtml(); } else { renderMelodyGame(); }
}

// ---- 리듬 그대로 재생 (쉼표=무음, 홀드=길게) + 재생 중인 음 노란색 하이라이트 ----
// 여러 배음(하모닉)을 섞어서 사인파 하나보다 피아노에 가까운 음색을 냄
var MELODY_HARMONICS = [
    { mult: 1, gain: 1 }, { mult: 2, gain: 0.32 }, { mult: 3, gain: 0.15 }, { mult: 4, gain: 0.07 }
];
// 구간듣기/전체듣기 데모 재생도 건반을 직접 눌렀을 때(playPianoTone)와 완전히 같은 피아노 음색으로 들리게 함
function playMelodyTone(freq) {
    playPianoTone(freq);
}
// 건반을 직접 눌렀을 때 나는 소리 - memory.js의 playPianoTone을 피아노에 더 가까운 소리로 덮어씀
// (memory.js보다 이 파일이 나중에 로드되므로 전역에서 이 정의가 최종 적용됨 - 기존 피아노 건반 게임에도 동일하게 적용됨)
function playPianoTone(freq) {
    var ctx = getPianoAudioCtx();
    if (!ctx) return;
    var now = ctx.currentTime;
    var peak = 0.3;
    var attack = 0.008;
    var masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(peak, now + attack); // 빠른 어택 - 눌리는 느낌
    masterGain.gain.exponentialRampToValueAtTime(peak * 0.35, now + 0.2); // 피아노 특유의 초반 감쇠
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9); // 자연스러운 여운(스타카토 아님)
    masterGain.connect(ctx.destination);
    MELODY_HARMONICS.forEach(function (h) {
        var osc = ctx.createOscillator();
        var hGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * h.mult;
        hGain.gain.value = h.gain;
        osc.connect(hGain);
        hGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.0);
    });
}
function playMelodyEventsDemo(events, onComplete) {
    var i = 0;
    var octShift = melodySettings.octaveShift || 0;
    function step() {
        if (i >= events.length) {
            melodyState.demoActiveEvent = null;
            if (onComplete) onComplete();
            return;
        }
        var ev = events[i];
        var durMs = (ev.units * MELODY_UNIT_MS) / melodySettings.playbackSpeed;
        if (ev.type === 'note') {
            melodyState.demoActiveEvent = ev;
            playMelodyTone(getMelodyNoteFreq(ev.pitchClass, ev.octaveOffset + octShift));
        } else {
            melodyState.demoActiveEvent = null;
        }
        updateMelodyTop();
        var t = gameTimeout(function () { i++; step(); }, durMs);
    }
    var t0 = gameTimeout(step, MELODY_FIRST_NOTE_DELAY_MS);
}

function melodyKeyClick(btn, octaveOffset, pitchClass) {
    if (melodyState.finished) return;
    playPianoTone(getMelodyNoteFreq(pitchClass, octaveOffset));
    vibrateShort();
    flashKeyPress(btn);
    var noteEvents = melodyState.song.noteEvents;
    var expectedEvent = noteEvents[melodyState.pos];
    var octShift = melodySettings.octaveShift || 0;
    if (pitchClass === expectedEvent.pitchClass && octaveOffset === expectedEvent.octaveOffset + octShift) melodyState.hits++;
    melodyState.pos++;
    if (melodyState.pos >= noteEvents.length) {
        melodyState.finished = true;
        stopMelodyPlayback();
        renderMelodyResult();
        return;
    }
    if (melodyState.mode === 'segment') {
        var nextSeg = melodySegIndexOf(noteEvents[melodyState.pos]);
        if (nextSeg !== melodyState.segIndex) {
            melodyState.segIndex = nextSeg;
            updateMelodyTop();
            startMelodyPlayback();
            return;
        }
    }
    updateMelodyTop();
}

function renderMelodyResult() {
    var song = melodyState.song;
    var total = song.noteEvents.length;
    var pct = Math.round((melodyState.hits / total) * 100);
    var grade = pct >= 90 ? '🌟 참 잘했어요!' : (pct >= 70 ? '👍 잘했어요!' : (pct >= 50 ? '💪 조금 더 연습해봐요' : '🔁 다시 도전해봐요'));
    var isFull = melodyState.mode === 'full';
    var html = '<div class="game-title-box">🎼 멜로디 연주하기 · ' + song.name + '</div>';
    html += '<div class="game-sub-desc">연주를 모두 마쳤어요!</div>';
    html += '<div class="msg-box" style="display:block; text-align:center; font-size:1.05rem; line-height:1.8;">' + grade + '<br>정확도 <b>' + pct + '%</b> (' + melodyState.hits + ' / ' + total + '음 일치)</div>';
    html += '<div class="options-grid">';
    html += '<button class="action-btn" onclick="retryMelodySong()">다시 연주하기 🔁</button>';
    if (!isFull) {
        html += '<button class="action-btn secondary" onclick="startMelodySession(true)">전체곡 연주하기 🎬</button>';
    } else {
        html += '<button class="action-btn secondary" onclick="startMelodySession(false)">구간별로 다시 연습 📖</button>';
    }
    html += '</div>';
    html += '<button class="action-btn secondary" style="width:100%; margin-top:0.5rem;" onclick="renderMelodySetup()">다른 노래 선택 🎵</button>';
    html += '<button class="action-btn secondary" style="width:100%; margin-top:0.5rem;" onclick="goHome()">⏮ 이전으로 가기</button>';
    document.getElementById('mainArea').innerHTML = html;
}

// ===================== 게임 등록 =====================
GAME_INIT_FNS.melodyGame = initMelodyGame;
