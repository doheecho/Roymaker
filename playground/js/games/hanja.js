// ===================== 한글 언어 놀이: 한자 공부 =====================
function dedupeBy(arr, keyFn) {
    var seen = {}; var out = [];
    arr.forEach(function (item) {
        var k = keyFn(item);
        if (!seen[k]) { seen[k] = true; out.push(item); }
    });
    return out;
}

var RAW_HANJA_LIST = [
    { char: "一", meaning: "한 일", level: "8급" }, { char: "二", meaning: "두 이", level: "8급" }, { char: "三", meaning: "석 삼", level: "8급" },
    { char: "四", meaning: "넉 사", level: "8급" }, { char: "五", meaning: "다섯 오", level: "8급" }, { char: "六", meaning: "여섯 육", level: "8급" },
    { char: "七", meaning: "일곱 칠", level: "8급" }, { char: "八", meaning: "여덟 팔", level: "8급" }, { char: "九", meaning: "아홉 구", level: "8급" },
    { char: "十", meaning: "열 십", level: "8급" }, { char: "百", meaning: "일백 백", level: "8급" }, { char: "千", meaning: "일천 천", level: "8급" },
    { char: "萬", meaning: "일만 만", level: "8급" }, { char: "上", meaning: "위 상", level: "8급" }, { char: "中", meaning: "가운데 중", level: "8급" },
    { char: "下", meaning: "아래 하", level: "8급" }, { char: "左", meaning: "왼쪽 좌", level: "8급" }, { char: "右", meaning: "오른쪽 우", level: "8급" },
    { char: "前", meaning: "앞 전", level: "8급" }, { char: "後", meaning: "뒤 후", level: "8급" }, { char: "入", meaning: "들 입", level: "8급" },
    { char: "出", meaning: "날 출", level: "8급" }, { char: "生", meaning: "날 생", level: "8급" }, { char: "死", meaning: "죽을 사", level: "8급" },
    { char: "大", meaning: "큰 대", level: "8급" }, { char: "小", meaning: "작을 소", level: "8급" }, { char: "長", meaning: "길 장", level: "8급" },
    { char: "弟", meaning: "아우 제", level: "8급" }, { char: "父", meaning: "아비 부", level: "8급" }, { char: "母", meaning: "어머니 모", level: "8급" },
    { char: "男", meaning: "사내 남", level: "8급" }, { char: "女", meaning: "계집 여", level: "8급" }, { char: "子", meaning: "아들 자", level: "8급" },
    { char: "兄", meaning: "형 형", level: "8급" }, { char: "友", meaning: "벗 우", level: "8급" }, { char: "本", meaning: "근본 본", level: "8급" },
    { char: "體", meaning: "몸 체", level: "8급" }, { char: "心", meaning: "마음 심", level: "8급" }, { char: "手", meaning: "손 수", level: "8급" },
    { char: "足", meaning: "발 족", level: "8급" }, { char: "目", meaning: "눈 목", level: "8급" }, { char: "耳", meaning: "귀 이", level: "8급" },
    { char: "口", meaning: "입 구", level: "8급" }, { char: "山", meaning: "메 산", level: "8급" }, { char: "水", meaning: "물 수", level: "8급" },
    { char: "火", meaning: "불 화", level: "8급" }, { char: "木", meaning: "나무 목", level: "8급" }, { char: "土", meaning: "흙 토", level: "8급" },
    { char: "天", meaning: "하늘 천", level: "8급" }, { char: "地", meaning: "따 지", level: "8급" },
    { char: "日", meaning: "날 일", level: "7급" }, { char: "月", meaning: "달 월", level: "7급" }, { char: "年", meaning: "해 년", level: "7급" },
    { char: "時", meaning: "때 시", level: "7급" }, { char: "分", meaning: "나눌 분", level: "7급" }, { char: "東", meaning: "동쪽 동", level: "7급" },
    { char: "西", meaning: "서쪽 서", level: "7급" }, { char: "南", meaning: "남쪽 남", level: "7급" }, { char: "北", meaning: "북쪽 북", level: "7급" },
    { char: "校", meaning: "학교 교", level: "7급" }, { char: "車", meaning: "수레 차", level: "7급" }, { char: "音", meaning: "소리 음", level: "7급" },
    { char: "韓", meaning: "한국 한", level: "7급" }, { char: "國", meaning: "나라 국", level: "7급" }, { char: "語", meaning: "말씀 어", level: "7급" },
    { char: "字", meaning: "글자 자", level: "7급" }, { char: "學", meaning: "배울 학", level: "7급" }, { char: "院", meaning: "집 원", level: "7급" },
    { char: "買", meaning: "살 매", level: "7급" }, { char: "妹", meaning: "누이 매", level: "7급" }, { char: "脈", meaning: "맥 맥", level: "7급" },
    { char: "面", meaning: "낯 면", level: "7급" }, { char: "滅", meaning: "멸할 멸", level: "7급" }, { char: "墓", meaning: "무덤 묘", level: "7급" },
    { char: "無", meaning: "없을 무", level: "7급" }, { char: "默", meaning: "잠잠할 묵", level: "7급" }, { char: "勿", meaning: "말 물", level: "7급" },
    { char: "物", meaning: "만물 물", level: "7급" }, { char: "味", meaning: "맛 미", level: "7급" },
    { char: "尾", meaning: "꼬리 미", level: "7급" }, { char: "民", meaning: "백성 민", level: "7급" }, { char: "密", meaning: "빽빽할 밀", level: "7급" },
    { char: "朴", meaning: "순박할 박", level: "7급" }, { char: "班", meaning: "조 반", level: "7급" }, { char: "發", meaning: "피울 발", level: "7급" },
    { char: "芳", meaning: "꽃이름 방", level: "7급" }, { char: "房", meaning: "방 방", level: "7급" }, { char: "放", meaning: "놓을 방", level: "7급" },
    { char: "裵", meaning: "성 배", level: "7급" }, { char: "配", meaning: "나눌 배", level: "7급" }, { char: "伯", meaning: "맏 백", level: "7급" },
    { char: "番", meaning: "차례 번", level: "7급" }, { char: "凡", meaning: "무릇 범", level: "7급" }, { char: "法", meaning: "법 법", level: "7급" },
    { char: "碧", meaning: "푸를 벽", level: "7급" }, { char: "變", meaning: "변할 변", level: "7급" }, { char: "病", meaning: "병 병", level: "7급" },
    { char: "保", meaning: "지킬 보", level: "7급" }, { char: "寶", meaning: "보배 보", level: "7급" }, { char: "步", meaning: "걸음 보", level: "7급" },
    { char: "複", meaning: "겹칠 복", level: "7급" }, { char: "服", meaning: "옷 복", level: "7급" }, { char: "奉", meaning: "받들 봉", level: "7급" },
    { char: "夫", meaning: "지아비 부", level: "7급" }, { char: "府", meaning: "관아 부", level: "7급" }, { char: "婦", meaning: "아내 부", level: "7급" },
    { char: "不", meaning: "아닐 부", level: "7급" }, { char: "貧", meaning: "가난할 빈", level: "7급" }, { char: "氷", meaning: "얼음 빙", level: "7급" },
    { char: "思", meaning: "생각 사", level: "7급" }, { char: "社", meaning: "모을 사", level: "7급" }, { char: "寫", meaning: "베낄 사", level: "7급" },
    { char: "産", meaning: "낳을 산", level: "7급" }, { char: "殺", meaning: "죽일 살", level: "7급" },
    { char: "商", meaning: "장사 상", level: "7급" }, { char: "狀", meaning: "형상 상", level: "7급" }, { char: "相", meaning: "서로 상", level: "7급" },
    { char: "想", meaning: "생각 상", level: "7급" }, { char: "省", meaning: "살필 성", level: "7급" }, { char: "書", meaning: "글 서", level: "7급" },
    { char: "成", meaning: "이룰 성", level: "7급" }, { char: "性", meaning: "성품 성", level: "7급" }, { char: "聖", meaning: "성인 성", level: "7급" },
    { char: "世", meaning: "대 세", level: "7급" }, { char: "洗", meaning: "씻을 세", level: "7급" }, { char: "所", meaning: "바 소", level: "7급" },
    { char: "孫", meaning: "손자 손", level: "7급" }, { char: "樹", meaning: "나무 수", level: "7급" }, { char: "修", meaning: "닦을 수", level: "7급" },
    { char: "順", meaning: "순할 순", level: "7급" }, { char: "數", meaning: "셀 수", level: "7급" }, { char: "習", meaning: "익힐 습", level: "7급" },
    { char: "勝", meaning: "이길 승", level: "7급" }, { char: "詩", meaning: "시 시", level: "7급" }, { char: "始", meaning: "비로소 시", level: "7급" },
    { char: "試", meaning: "시험 시", level: "7급" }, { char: "食", meaning: "밥 식", level: "7급" }, { char: "信", meaning: "믿을 신", level: "7급" },
    { char: "身", meaning: "몸 신", level: "7급" }, { char: "新", meaning: "새 신", level: "7급" }, { char: "實", meaning: "열매 실", level: "7급" },
    { char: "安", meaning: "편안 안", level: "7급" }, { char: "暗", meaning: "어두울 암", level: "7급" }, { char: "壓", meaning: "누를 압", level: "7급" },
    { char: "仰", meaning: "우러를 앙", level: "7급" }, { char: "額", meaning: "이마 액", level: "7급" }, { char: "陽", meaning: "볕 양", level: "7급" },
    { char: "漁", meaning: "고기잡을 어", level: "7급" }, { char: "億", meaning: "억 억", level: "7급" }, { char: "業", meaning: "업 업", level: "7급" },
    { char: "榮", meaning: "영화 영", level: "7급" },
    { char: "各", meaning: "각각 각", level: "6급" }, { char: "甘", meaning: "달 감", level: "6급" }, { char: "江", meaning: "강 강", level: "6급" },
    { char: "個", meaning: "낱 개", level: "6급" }, { char: "京", meaning: "서울 경", level: "6급" }, { char: "經", meaning: "지날 경", level: "6급" },
    { char: "季", meaning: "계절 계", level: "6급" }, { char: "高", meaning: "높을 고", level: "6급" }, { char: "公", meaning: "공평할 공", level: "6급" },
    { char: "科", meaning: "과목 과", level: "6급" }, { char: "關", meaning: "관계할 관", level: "6급" }, { char: "光", meaning: "빛 광", level: "6급" },
    { char: "敎", meaning: "가르칠 교", level: "6급" }, { char: "貴", meaning: "귀할 귀", level: "6급" }, { char: "根", meaning: "뿌리 근", level: "6급" },
    { char: "近", meaning: "가까울 근", level: "6급" }, { char: "金", meaning: "쇠 금", level: "6급" }, { char: "期", meaning: "기약할 기", level: "6급" },
    { char: "記", meaning: "기록할 기", level: "6급" }, { char: "短", meaning: "짧을 단", level: "6급" }, { char: "黨", meaning: "무리 당", level: "6급" },
    { char: "臺", meaning: "돈대 대", level: "6급" }, { char: "道", meaning: "길 도", level: "6급" }, { char: "圖", meaning: "그림 도", level: "6급" },
    { char: "讀", meaning: "읽을 독", level: "6급" }, { char: "動", meaning: "움직일 동", level: "6급" }, { char: "洞", meaning: "마을 동", level: "6급" },
    { char: "登", meaning: "오를 등", level: "6급" }, { char: "羅", meaning: "벌일 라", level: "6급" }, { char: "樂", meaning: "풍류 락", level: "6급" },
    { char: "卵", meaning: "알 란", level: "6급" }, { char: "廊", meaning: "행랑 랑", level: "6급" }, { char: "良", meaning: "어질 량", level: "6급" },
    { char: "歷", meaning: "지날 력", level: "6급" }, { char: "例", meaning: "본보기 례", level: "6급" }, { char: "路", meaning: "길 로", level: "6급" },
    { char: "論", meaning: "논할 론", level: "6급" }, { char: "淚", meaning: "눈물 루", level: "6급" }, { char: "流", meaning: "흐를 류", level: "6급" },
    { char: "陸", meaning: "뭍 륙", level: "6급" }, { char: "里", meaning: "마을 리", level: "6급" }, { char: "林", meaning: "수풀 림", level: "6급" },
    { char: "立", meaning: "설 립", level: "6급" }, { char: "馬", meaning: "말 마", level: "6급" }, { char: "滿", meaning: "찰 만", level: "6급" },
    { char: "令", meaning: "명령 령", level: "6급" },
    { char: "弱", meaning: "약할 약", level: "6급" }, { char: "藥", meaning: "약 약", level: "6급" },
    { char: "英", meaning: "꽃부리 영", level: "6급" }, { char: "影", meaning: "그림자 영", level: "6급" },
    { char: "預", meaning: "맡길 예", level: "6급" }, { char: "汚", meaning: "더러울 오", level: "6급" }, { char: "溫", meaning: "따뜻할 온", level: "6급" },
    { char: "完", meaning: "완전할 완", level: "6급" }, { char: "王", meaning: "임금 왕", level: "6급" }, { char: "外", meaning: "바깥 외", level: "6급" },
    { char: "欲", meaning: "하고자 할 욕", level: "6급" }, { char: "用", meaning: "쓸 용", level: "6급" }, { char: "勇", meaning: "날랠 용", level: "6급" },
    { char: "運", meaning: "옮길 운", level: "6급" }, { char: "遠", meaning: "멀 원", level: "6급" }, { char: "原", meaning: "근원 원", level: "6급" }, { char: "位", meaning: "자리 위", level: "6급" }, { char: "爲", meaning: "할 위", level: "6급" }, { char: "育", meaning: "기를 육", level: "6급" },
    { char: "隱", meaning: "숨을 은", level: "6급" }, { char: "飮", meaning: "마실 음", level: "6급" },
    { char: "毅", meaning: "굳세 의", level: "6급" }, { char: "意", meaning: "뜻 의", level: "6급" }, { char: "依", meaning: "의지할 의", level: "6급" },
    { char: "衣", meaning: "옷 의", level: "6급" }, { char: "義", meaning: "옳을 의", level: "6급" }, { char: "益", meaning: "더할 익", level: "6급" },
    { char: "人", meaning: "사람 인", level: "6급" }, { char: "認", meaning: "알 인", level: "6급" }, { char: "仁", meaning: "어질 인", level: "6급" },
    { char: "貯", meaning: "쌓을 저", level: "6급" }, { char: "敵", meaning: "원수 적", level: "6급" }, { char: "傳", meaning: "전할 전", level: "6급" },
    { char: "電", meaning: "번개 전", level: "6급" }, { char: "戰", meaning: "싸움 전", level: "6급" }, { char: "點", meaning: "점 점", level: "6급" },
    { char: "庭", meaning: "뜰 정", level: "6급" }, { char: "正", meaning: "바를 정", level: "6급" }, { char: "定", meaning: "정할 정", level: "6급" },
    { char: "濟", meaning: "건널 제", level: "6급" }, { char: "題", meaning: "제목 제", level: "6급" }, { char: "第", meaning: "차례 제", level: "6급" },
    { char: "祖", meaning: "조상 조", level: "6급" }, { char: "助", meaning: "도울 조", level: "6급" }, { char: "族", meaning: "겨레 족", level: "6급" },
    { char: "鐘", meaning: "종 종", level: "6급" }, { char: "終", meaning: "마칠 종", level: "6급" }, { char: "註", meaning: "주해 주", level: "6급" },
    { char: "主", meaning: "임금 주", level: "6급" }, { char: "週", meaning: "주일 주", level: "6급" }, { char: "準", meaning: "준비할 준", level: "6급" },
    { char: "重", meaning: "무거울 중", level: "6급" }, { char: "卽", meaning: "곧 즉", level: "6급" }, { char: "證", meaning: "증거 증", level: "6급" },
    { char: "職", meaning: "벼슬 직", level: "6급" }, { char: "進", meaning: "나아갈 진", level: "6급" }, { char: "鎭", meaning: "진압할 진", level: "6급" },
    { char: "集", meaning: "모을 집", level: "6급" }, { char: "窓", meaning: "창 창", level: "6급" }, { char: "淸", meaning: "맑을 청", level: "6급" },
    { char: "祝", meaning: "빌 축", level: "6급" }, { char: "春", meaning: "봄 춘", level: "6급" }, { char: "沖", meaning: "부딪칠 충", level: "6급" },
    { char: "忠", meaning: "충성 충", level: "6급" }, { char: "取", meaning: "가질 취", level: "6급" }, { char: "治", meaning: "다스릴 치", level: "6급" },
    { char: "齒", meaning: "이 치", level: "6급" }, { char: "稱", meaning: "일컬을 칭", level: "6급" }, { char: "快", meaning: "쾌할 쾌", level: "6급" },
    { char: "泰", meaning: "클 태", level: "6급" }, { char: "殆", meaning: "위태할 태", level: "6급" }, { char: "統", meaning: "거느릴 통", level: "6급" }, { char: "投", meaning: "던질 투", level: "6급" }, { char: "特", meaning: "특별할 특", level: "6급" }, { char: "破", meaning: "깨칠 파", level: "6급" },
    { char: "平", meaning: "평평할 평", level: "6급" }, { char: "閉", meaning: "닫을 폐", level: "6급" }, { char: "標", meaning: "표지 표", level: "6급" },
    { char: "品", meaning: "물건 품", level: "6급" }, { char: "風", meaning: "바람 풍", level: "6급" }, { char: "必", meaning: "반드시 필", level: "6급" },
    { char: "寒", meaning: "추울 한", level: "6급" }, { char: "割", meaning: "쪼갤 할", level: "6급" },
    { char: "合", meaning: "합할 합", level: "6급" }, { char: "港", meaning: "항구 항", level: "6급" }, { char: "幸", meaning: "다행 행", level: "6급" },
    { char: "害", meaning: "해할 해", level: "6급" }, { char: "許", meaning: "허락할 허", level: "6급" }, { char: "形", meaning: "모양 형", level: "6급" },
    { char: "湖", meaning: "호수 호", level: "6급" }, { char: "浩", meaning: "넓을 호", level: "6급" }, { char: "惑", meaning: "미혹할 혹", level: "6급" },
    { char: "混", meaning: "섞일 혼", level: "6급" }, { char: "華", meaning: "빛날 화", level: "6급" },
    { char: "和", meaning: "화할 화", level: "6급" }, { char: "擴", meaning: "넓힐 확", level: "6급" }, { char: "確", meaning: "굳을 확", level: "6급" },
    { char: "會", meaning: "모일 회", level: "6급" }, { char: "孝", meaning: "효도 효", level: "6급" }, { char: "訓", meaning: "가르칠 훈", level: "6급" },
    { char: "休", meaning: "쉴 휴", level: "6급" }, { char: "凶", meaning: "흉할 흉", level: "6급" }
];
var HANJA_LIST = dedupeBy(RAW_HANJA_LIST, function (i) { return i.char; });

var RAW_WORD_MEANING_PAIRS = [
    { word: "學校", meaning: "학교" }, { word: "韓國", meaning: "한국" }, { word: "成功", meaning: "성공" },
    { word: "失敗", meaning: "실패" }, { word: "幸福", meaning: "행복" }, { word: "不幸", meaning: "불행" },
    { word: "希望", meaning: "희망" }, { word: "絶望", meaning: "절망" }, { word: "增加", meaning: "증가" },
    { word: "減少", meaning: "감소" }, { word: "飮食", meaning: "음식" }, { word: "運動", meaning: "운동" },
    { word: "學習", meaning: "학습" }, { word: "時間", meaning: "시간" }, { word: "空間", meaning: "공간" },
    { word: "東西", meaning: "동서" }, { word: "南北", meaning: "남북" }, { word: "父母", meaning: "부모" },
    { word: "兄弟", meaning: "형제" }, { word: "親舊", meaning: "친구" }, { word: "先生", meaning: "선생" },
    { word: "學生", meaning: "학생" }, { word: "科學", meaning: "과학" }, { word: "社會", meaning: "사회" },
    { word: "經濟", meaning: "경제" }, { word: "政治", meaning: "정치" }, { word: "文化", meaning: "문화" },
    { word: "歷史", meaning: "역사" }, { word: "平和", meaning: "평화" }, { word: "戰爭", meaning: "전쟁" },
    { word: "登山", meaning: "등산" }, { word: "下校", meaning: "하교" }, { word: "入學", meaning: "입학" },
    { word: "卒業", meaning: "졸업" }, { word: "輸出", meaning: "수출" }, { word: "輸入", meaning: "수입" },
    { word: "國語", meaning: "국어" }, { word: "漢字", meaning: "한자" }, { word: "文字", meaning: "문자" },
    { word: "少年", meaning: "소년" }, { word: "靑年", meaning: "청년" },
    { word: "老人", meaning: "노인" }, { word: "祖上", meaning: "조상" },
    { word: "子孫", meaning: "자손" }, { word: "大韓", meaning: "대한" }, { word: "民國", meaning: "민국" }
];
var WORD_MEANING_PAIRS = dedupeBy(RAW_WORD_MEANING_PAIRS, function (i) { return i.word; });

var RAW_ANTONYM_PAIRS = [
    { word: "成功", meaning: "성공", answer: "失敗", answerMeaning: "실패" },
    { word: "幸福", meaning: "행복", answer: "不幸", answerMeaning: "불행" },
    { word: "希望", meaning: "희망", answer: "絶望", answerMeaning: "절망" },
    { word: "增加", meaning: "증가", answer: "減少", answerMeaning: "감소" },
    { word: "登校", meaning: "등교", answer: "下校", answerMeaning: "하교" },
    { word: "入學", meaning: "입학", answer: "卒業", answerMeaning: "졸업" },
    { word: "輸出", meaning: "수출", answer: "輸入", answerMeaning: "수입" },
    { word: "上升", meaning: "상승", answer: "下降", answerMeaning: "하강" },
    { word: "前進", meaning: "전진", answer: "後退", answerMeaning: "후퇴" },
    { word: "市內", meaning: "시내", answer: "市外", answerMeaning: "시외" },
    { word: "日出", meaning: "일출", answer: "日沒", answerMeaning: "일몰" },
    { word: "大", meaning: "큰 대", answer: "小", answerMeaning: "작을 소" },
    { word: "多", meaning: "많을 다", answer: "少", answerMeaning: "적을 소" },
    { word: "長", meaning: "길 장", answer: "短", answerMeaning: "짧을 단" },
    { word: "高", meaning: "높을 고", answer: "低", answerMeaning: "낮을 저" },
    { word: "上", meaning: "위 상", answer: "下", answerMeaning: "아래 하" },
    { word: "左", meaning: "왼쪽 좌", answer: "右", answerMeaning: "오른쪽 우" },
    { word: "前", meaning: "앞 전", answer: "後", answerMeaning: "뒤 후" },
    { word: "東", meaning: "동쪽 동", answer: "西", answerMeaning: "서쪽 서" },
    { word: "南", meaning: "남쪽 남", answer: "北", answerMeaning: "북쪽 북" },
    { word: "入", meaning: "들 입", answer: "出", answerMeaning: "날 출" },
    { word: "勝", meaning: "이길 승", answer: "敗", answerMeaning: "패할 패" },
    { word: "始", meaning: "비로소 시", answer: "終", answerMeaning: "마칠 종" },
    { word: "遠", meaning: "멀 원", answer: "近", answerMeaning: "가까울 근" },
    { word: "重", meaning: "무거울 중", answer: "輕", answerMeaning: "가벼울 경" },
    { word: "强", meaning: "강할 강", answer: "弱", answerMeaning: "약할 약" },
    { word: "天", meaning: "하늘 천", answer: "地", answerMeaning: "따 지" },
    { word: "男", meaning: "사내 남", answer: "女", answerMeaning: "계집 여" },
    { word: "父", meaning: "아비 부", answer: "母", answerMeaning: "어머니 모" },
    { word: "兄", meaning: "형 형", answer: "弟", answerMeaning: "아우 제" },
    { word: "生", meaning: "날 생", answer: "死", answerMeaning: "죽을 사" },
    { word: "有", meaning: "있을 유", answer: "無", answerMeaning: "없을 무" },
    { word: "善", meaning: "착할 선", answer: "惡", answerMeaning: "악할 악" },
    { word: "飮", meaning: "마실 음", answer: "排", answerMeaning: "배출할 배" },
    { word: "快", meaning: "쾌할 쾌", answer: "慢", answerMeaning: "거만할 만" }
];
var ANTONYM_PAIRS = dedupeBy(RAW_ANTONYM_PAIRS, function (i) { return i.word; });

var HANJA_MODE_DESC = {
    meaning: '한자를 보고 알맞은 뜻을 고르세요!',
    hanja: '뜻을 보고 알맞은 한자를 고르세요!',
    wordmeaning: '한자어를 보고 알맞은 뜻을 고르세요!',
    antonym: '반대되는 뜻을 가진 한자(어)를 고르세요!'
};

var hanjaSettings = { mode: 'meaning', timeLimit: 10, level: 'all' };
var hanjaState = {};
var hanjaRound = 1, hanjaCorrect = 0;

// 급수는 한자 낱글자(뜻/한자 맞추기)에만 적용된다. 한자어·반대말 모드는 낱글자 급수가 없어 전체를 쓴다.
var HANJA_LEVEL_MODES = { meaning: 1, hanja: 1 };
function hanjaLevelApplies() { return !!HANJA_LEVEL_MODES[hanjaSettings.mode]; }
function hanjaCharPool() {
    if (hanjaSettings.level === 'all') return HANJA_LIST;
    var pool = HANJA_LIST.filter(function (i) { return i.level === hanjaSettings.level; });
    return pool.length >= 4 ? pool : HANJA_LIST;
}

function initHanja() { renderHanjaSetup(); }

function renderHanjaSetup() {
    var modes = [
        { v: 'meaning', l: '뜻 맞추기' },
        { v: 'hanja', l: '한자 맞추기' },
        { v: 'wordmeaning', l: '한자어 뜻 찾기' },
        { v: 'antonym', l: '반대 뜻 찾기' }
    ];
    var levels = [{ v: 'all', l: '전체' }, { v: '8급', l: '8급 (쉬움)' }, { v: '7급', l: '7급 (보통)' }, { v: '6급', l: '6급 (어려움)' }];
    var times = [{ v: 10, l: '10초' }, { v: 15, l: '15초' }, { v: 20, l: '20초' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">漢 한자 공부</div>';
    html += '<div class="game-sub-desc">모드와 급수, 제한시간을 골라 시작해보세요!</div>';
    html += '<div class="setup-section-label">모드</div><div class="setup-btn-group">';
    modes.forEach(function (m) {
        html += '<button class="setup-btn' + (hanjaSettings.mode === m.v ? ' active' : '') + '" onclick="setHanjaMode(\'' + m.v + '\')">' + m.l + '</button>';
    });
    html += '</div>';
    if (hanjaLevelApplies()) {
        html += '<div class="setup-section-label">급수</div><div class="setup-btn-group">';
        levels.forEach(function (lv) {
            html += '<button class="setup-btn' + (hanjaSettings.level === lv.v ? ' active' : '') + '" onclick="setHanjaLevel(\'' + lv.v + '\')">' + lv.l + '</button>';
        });
        html += '</div>';
    }
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (hanjaSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setHanjaTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startHanjaSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setHanjaMode(v) { hanjaSettings.mode = v; renderHanjaSetup(); }
function setHanjaLevel(v) { hanjaSettings.level = v; renderHanjaSetup(); }
function setHanjaTimeLimit(v) { hanjaSettings.timeLimit = v; renderHanjaSetup(); }
function startHanjaSession() { hanjaRound = 1; hanjaCorrect = 0; generateHanjaRound(); }

// 보기 중복 제거: 표시 글자가 같은 오답(정답과 헷갈림) 및 서로 겹치는 오답을 걸러낸다.
function dedupeHanjaOptions(options) {
    var correct = options.filter(function (o) { return o.correct; })[0];
    var seen = {};
    var out = [];
    options.forEach(function (o) {
        if (o.correct) { if (!seen[o.label]) { seen[o.label] = 1; out.push(o); } return; }
        if (correct && o.label === correct.label) return;
        if (seen[o.label]) return;
        seen[o.label] = 1;
        out.push(o);
    });
    return out;
}

function generateHanjaRound() {
    var mode = hanjaSettings.mode;
    var q, options;
    if (mode === 'meaning') {
        var pool1 = hanjaCharPool();
        q = pickRandom(pool1);
        var w1 = pickN(pool1.filter(function (i) { return i.char !== q.char; }), 3);
        options = shuffleArray([q].concat(w1)).map(function (o) {
            return { label: o.meaning, correct: o.char === q.char, full: o.meaning + ' (' + o.char + ')' };
        });
    } else if (mode === 'hanja') {
        var pool2 = hanjaCharPool();
        q = pickRandom(pool2);
        var w2 = pickN(pool2.filter(function (i) { return i.char !== q.char; }), 3);
        options = shuffleArray([q].concat(w2)).map(function (o) {
            return { label: o.char, correct: o.char === q.char, full: o.char + ' (' + o.meaning + ')' };
        });
    } else if (mode === 'wordmeaning') {
        q = pickRandom(WORD_MEANING_PAIRS);
        var w3 = pickN(WORD_MEANING_PAIRS.filter(function (i) { return i.word !== q.word; }), 3);
        options = shuffleArray([q].concat(w3)).map(function (o) {
            return { label: o.meaning, correct: o.word === q.word, full: o.meaning + ' (' + o.word + ')' };
        });
    } else {
        q = pickRandom(ANTONYM_PAIRS);
        var w4 = pickN(ANTONYM_PAIRS.filter(function (p) { return p.answer !== q.answer && p.word !== q.word; }), 3);
        var correctOpt = { word: q.answer, meaning: q.answerMeaning, correct: true };
        var wrongOpts = w4.map(function (p) { return { word: p.answer, meaning: p.answerMeaning, correct: false }; });
        options = shuffleArray([correctOpt].concat(wrongOpts)).map(function (o) {
            return { label: o.word, correct: o.correct, full: o.word + ' (' + o.meaning + ')' };
        });
    }
    options = dedupeHanjaOptions(options);
    hanjaState = {
        mode: mode, q: q, options: options, answered: false, selectedIdx: -1, hintShown: false,
        timeLimit: hanjaSettings.timeLimit, timeLeft: hanjaSettings.timeLimit, timerId: null, timedOut: false
    };
    renderHanja();
    if (hanjaSettings.timeLimit > 0) startHanjaTimer();
}

function toggleHanjaHint() {
    if (hanjaState.answered) return;
    hanjaState.hintShown = !hanjaState.hintShown;
    renderHanja();
}

function startHanjaTimer() {
    var bar = document.getElementById('hanjaTimerBar');
    if (bar) bar.style.width = (hanjaState.timeLeft / hanjaState.timeLimit * 100) + '%';
    hanjaState.timerId = setInterval(function () {
        hanjaState.timeLeft -= 0.1;
        var b = document.getElementById('hanjaTimerBar');
        if (b) b.style.width = Math.max(0, hanjaState.timeLeft / hanjaState.timeLimit * 100) + '%';
        if (hanjaState.timeLeft <= 0) { handleHanjaTimeout(); }
    }, 100);
    activeTimers.push(hanjaState.timerId);
}

function handleHanjaTimeout() {
    if (hanjaState.timerId) { clearInterval(hanjaState.timerId); hanjaState.timerId = null; }
    choiceTimeout();
}
function hanjaChoiceCfg() {
    var correctOpt = hanjaState.options.filter(function (o) { return o.correct; })[0];
    return {
        msgId: 'hanjaMsg',
        ok: '🎉 정답이에요!',
        bad: '아쉬워요! 정답은 ' + correctOpt.full + ' 였어요.',
        timeout: '⏰ 시간이 다 됐어요! 정답은 ' + correctOpt.full + ' 였어요.',
        onPick: function () { if (hanjaState.timerId) { clearInterval(hanjaState.timerId); hanjaState.timerId = null; } },
        rerender: function (pickedIdx) { hanjaState.answered = true; hanjaState.selectedIdx = pickedIdx; renderHanja(); },
        onCorrect: function () { hanjaCorrect++; },
        onResolved: function () { hanjaRound++; },
        onTimeout: function () { hanjaState.timedOut = true; hanjaRound++; },
        next: 'nextHanjaRound()', retry: 'retryHanjaRound()', home: 'renderHanjaSetup()',
        failStyle: 'retryHome'
    };
}

function retryHanjaRound() {
    hanjaState.answered = false;
    hanjaState.selectedIdx = -1;
    hanjaState.hintShown = false;
    hanjaState.timedOut = false;
    hanjaState.timeLeft = hanjaState.timeLimit;
    renderHanja();
    if (hanjaState.timeLimit > 0) startHanjaTimer();
}
function nextHanjaRound() { generateHanjaRound(); }

function renderHanja() {
    var s = hanjaState;
    var html = '<div class="game-title-box">漢 한자 공부</div>';
    html += '<div class="game-sub-desc">' + HANJA_MODE_DESC[s.mode] + '</div>';
    html += '<div class="status-row"><div>' + hanjaRound + '라운드</div><div>정답: ' + hanjaCorrect + ' / ' + (hanjaRound - 1) + '</div></div>';
    if (s.timeLimit > 0 && !s.answered) {
        html += '<div class="timer-container"><div class="timer-bar" id="hanjaTimerBar" style="width:' + (s.timeLeft / s.timeLimit * 100) + '%;"></div></div>';
    }
    html += '<div style="background:#f8fafc; border:3px dashed #cbd5e1; border-radius:0.75rem; padding:1.25rem; margin-bottom:1.25rem; min-height:110px; display:flex; align-items:center; justify-content:center; position:relative;">';
    if (s.mode === 'antonym') {
        html += '<button class="action-btn secondary" style="position:absolute; top:8px; left:8px; padding:0.3rem 0.6rem; font-size:0.75rem; margin:0;" onclick="toggleHanjaHint()">💡 ' + (s.hintShown ? '힌트 끄기' : '힌트 보기') + '</button>';
        var shown = s.hintShown || s.answered;
        html += '<div style="font-size:1.3rem; font-weight:700; color:var(--primary); text-align:center; line-height:1.5;"><b>' + s.q.word + (shown ? ' (' + s.q.meaning + ')' : '') + '</b> 와(과)<br>반대되는 뜻을 가진 한자(어)는?</div>';
    } else if (s.mode === 'wordmeaning') {
        html += '<div style="font-size:3.5rem; font-weight:800; color:var(--text-main);">' + s.q.word + '</div>';
    } else if (s.mode === 'meaning') {
        html += '<div style="position:absolute; top:10px; right:12px; background:#e0e7ff; color:var(--primary); font-size:0.75rem; font-weight:700; padding:0.2rem 0.5rem; border-radius:0.35rem; border:1px solid #c7d2fe;">' + s.q.level + '</div>';
        html += '<div style="font-size:4.5rem; font-weight:800; color:var(--text-main);">' + s.q.char + '</div>';
    } else {
        html += '<div style="position:absolute; top:10px; right:12px; background:#e0e7ff; color:var(--primary); font-size:0.75rem; font-weight:700; padding:0.2rem 0.5rem; border-radius:0.35rem; border:1px solid #c7d2fe;">' + s.q.level + '</div>';
        html += '<div style="font-size:1.3rem; font-weight:700; color:var(--primary);">"' + s.q.meaning + '"에 알맞은 한자는?</div>';
    }
    html += '</div>';
    var cfg = hanjaChoiceCfg();
    html += '<div class="options-grid">';
    s.options.forEach(function (o, idx) {
        var label = s.answered ? o.full : o.label;
        var cls = 'opt-btn';
        if (s.answered) {
            if (o.correct) cls += ' correct';
            else if (idx === s.selectedIdx) cls += ' wrong';
        }
        html += '<button class="' + cls + '" style="font-size:1.4rem; height:64px;" ' + (s.answered ? 'disabled' : '') + ' onclick="choiceSubmit(' + idx + ')">' + label + '</button>';
    });
    html += '</div>';
    html += '<div id="hanjaMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (!s.answered) {
        var ci = -1;
        s.options.forEach(function (o, idx) { if (o.correct) ci = idx; });
        choiceBegin(ci, cfg);
    }
}

GAME_INIT_FNS.hanjaQuiz = initHanja;
