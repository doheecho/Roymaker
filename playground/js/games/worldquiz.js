// ===================== 언어 상식 퀴즈: 세계 나라·수도 맞추기 =====================
var WORLD_QUIZ_LIST = [
            // --- 아시아 (약 50개국) ---
            { country: "대한민국", engName: "South Korea", continent: "아시아", code: "kr", capital: "서울 (Seoul)", region: "동아시아 (아시아), 수도는 서울", area: "100,430 km² (세계 107위)", pop: "약 5,170만 명 (세계 28위)", gdp: "선진국 경제", cities: "서울, 부산, 인천, 대구", famous: "K-컬처, IT 인프라 및 반도체 산업", history: "단군 조선부터 삼국시대와 조선왕조를 거쳐 현대에 이르렀습니다.", relation: null },
            { country: "북한", engName: "North Korea", continent: "아시아", code: "kp", capital: "평양 (Pyongyang)", region: "동아시아 (아시아), 수도는 평양", area: "120,540 km² (세계 97위)", pop: "약 2,600만 명 (세계 55위)", gdp: "계획 경제", cities: "평양, 함흥, 청진", famous: "백두산, 아리랑 축제", history: "1948년 수립된 한반도 북쪽의 국가입니다.", relation: "한민족이지만 분단된 특수한 관계입니다." },
            { country: "일본", engName: "Japan", continent: "아시아", code: "jp", capital: "도쿄 (Tokyo)", region: "동아시아 (아시아), 수도는 도쿄", area: "377,975 km² (세계 62위)", pop: "약 1억 2,400만 명 (세계 12위)", gdp: "대규모 선진 경제", cities: "도쿄, 오사카, 교토", famous: "애니메이션, 전통 문화 및 첨단 기술", history: "메이지 유신을 통해 근대화에 성공한 경제 대국입니다.", relation: "가장 가까운 이웃 국가입니다." },
            { country: "중국", engName: "China", continent: "아시아", code: "cn", capital: "베이징 (Beijing)", region: "동아시아 (아시아), 수도는 베이징", area: "9,600,000 km² (세계 3위)", pop: "약 14억 명 (세계 2위)", gdp: "거대 경제 대국", cities: "베이징, 상하이, 광저우", famous: "만리장성 및 거대 내수 시장", history: "황하 문명을 바탕으로 수많은 왕조가 교체되었습니다.", relation: "최대 교역국 중 하나입니다." },
            { country: "베트남", engName: "Vietnam", continent: "아시아", code: "vn", capital: "하노이 (Hanoi)", region: "동남아시아 (아시아), 수도는 하노이", area: "331,212 km² (세계 65위)", pop: "약 9,800만 명 (세계 15위)", gdp: "신흥 고성장 경제", cities: "하노이, 호찌민, 다낭", famous: "쌀국수 및 제조업 기지", history: "도이모이 정책 이후 급성장했습니다.", relation: "아세안 주요 협력 파트너입니다." },
            { country: "태국", engName: "Thailand", continent: "아시아", code: "th", capital: "방콕 (Bangkok)", region: "동남아시아 (아시아), 수도는 방콕", area: "513,120 km² (세계 50위)", pop: "약 7,100만 명 (세계 20위)", gdp: "관광 및 제조업 중심지", cities: "방콕, 치앙마이, 푸켓", famous: "불교 사원 및 관광지", history: "동남아에서 유일하게 식민 지배를 받지 않았습니다.", relation: "한국전쟁 참전국입니다." },
            { country: "필리핀", engName: "Philippines", continent: "아시아", code: "ph", capital: "마닐라 (Manila)", region: "동남아시아 (아시아), 수도는 마닐라", area: "300,000 km² (세계 72위)", pop: "약 1억 1,400만 명 (세계 13위)", gdp: "아시아 신흥국", cities: "마닐라, 세부, 다바오", famous: "열대 섬 및 휴양지", history: "스페인과 미국의 지배를 거쳤습니다.", relation: "한국전쟁 참전국입니다." },
            { country: "인도네시아", engName: "Indonesia", continent: "아시아", code: "id", capital: "자카르타 (Jakarta)", region: "동남아시아 (아시아), 수도는 자카르타", area: "1,904,569 km² (세계 15위)", pop: "약 2억 7,500만 명 (세계 4위)", gdp: "동남아 최대 경제 대국", cities: "자카르타, 수라바야, 덴파사르", famous: "발리 섬 및 천연자원", history: "네덜란드 지배 후 독립했습니다.", relation: "방산 및 자원 협력 국가입니다." },
            { country: "싱가포르", engName: "Singapore", continent: "아시아", code: "sg", capital: "싱가포르 (Singapore)", region: "동남아시아 (아시아), 수도는 싱가포르", area: "728.6 km² (세계 192위)", pop: "약 560만 명 (세계 114위)", gdp: "세계 최고 수준 1인당 GDP", cities: "싱가포르", famous: "글로벌 금융 허브", history: "1965년 독립 후 선진국으로 성장했습니다.", relation: "긴밀한 경제 파트너입니다." },
            { country: "말레이시아", engName: "Malaysia", continent: "아시아", code: "my", capital: "쿠알라룸푸르 (Kuala Lumpur)", region: "동남아시아 (아시아), 수도는 쿠알라룸푸르", area: "330,803 km² (세계 66위)", pop: "약 3,300만 명 (세계 45위)", gdp: "무역 및 자원 수출국", cities: "쿠알라룸푸르, 조지타운", famous: "페트로나스 트윈 타워", history: "다민족 연합 국가로 발전했습니다.", relation: "우호적인 관계를 유지합니다." },
            { country: "인도", engName: "India", continent: "아시아", code: "in", capital: "뉴델리 (New Delhi)", region: "남아시아 (아시아), 수도는 뉴델리", area: "3,287,263 km² (세계 7위)", pop: "약 14억 3,000만 명 (세계 1위)", gdp: "경제 대국 (고속 성장)", cities: "뉴델리, 뭄바이, 뱅갈로르", famous: "타지마할 및 IT 산업", history: "간디의 비폭력 운동으로 독립했습니다.", relation: "IT 및 제조업 협력이 활발합니다." },
            { country: "파키스탄", engName: "Pakistan", continent: "아시아", code: "pk", capital: "이슬라마바드 (Islamabad)", region: "남아시아 (아시아), 수도는 이슬라마바드", area: "881,913 km² (세계 33위)", pop: "약 2억 3,000만 명 (세계 5위)", gdp: "신흥 경제", cities: "이슬라마바드, 카라치, 라호르", famous: "K2 산 및 역사 유적", history: "1947년 인도에서 분리 독립했습니다.", relation: "외교 관계를 유지합니다." },
            { country: "방글라데시", engName: "Bangladesh", continent: "아시아", code: "bd", capital: "다카 (Dhaka)", region: "남아시아 (아시아), 수도는 다카", area: "147,570 km² (세계 92위)", pop: "약 1억 7,000만 명 (세계 8위)", gdp: "섬유 수출 중심국", cities: "다카, 치타공", famous: "방직 산업", history: "1971년 독립했습니다.", relation: "봉제 산업 협력 대상국입니다." },
            { country: "몽골", engName: "Mongolia", continent: "아시아", code: "mn", capital: "울란바토르 (Ulaanbaatar)", region: "동아시아 (아시아), 수도는 울란바토르", area: "1,564,116 km² (세계 18위)", pop: "약 340만 명 (세계 134위)", gdp: "광물 자원 중심국", cities: "울란바토르, 다르한", famous: "광활한 초원 및 칭기즈 칸", history: "몽골 제국의 역사를 지닙니다.", relation: "자원 개발 협력 우방국입니다." },
            { country: "대만", engName: "Taiwan", continent: "아시아", code: "tw", capital: "타이베이 (Taipei)", region: "동아시아 (아시아), 수도는 타이베이", area: "36,197 km² (세계 137위)", pop: "약 2,300만 명 (세계 55위)", gdp: "첨단 반도체 선진 경제", cities: "타이베이, 가오슝", famous: "TSMC 및 야시장", history: "민주적 경제 체제를 구축했습니다.", relation: "반도체 공급망 협력 관계입니다." },
            { country: "카자흐스탄", engName: "Kazakhstan", continent: "아시아", code: "kz", capital: "아스타나 (Astana)", region: "중앙아시아 (아시아), 수도는 아스타나", area: "2,724,900 km² (세계 9위)", pop: "약 1,900만 명 (세계 64위)", gdp: "자원 부국", cities: "아스타나, 알마티", famous: "석유·가스 자원", history: "1991년 소련 해체와 함께 독립했습니다.", relation: "중앙아시아 최대 경제 협력 파트너입니다." },
            { country: "우즈베키스탄", engName: "Uzbekistan", continent: "아시아", code: "uz", capital: "타슈켄트 (Tashkent)", region: "중앙아시아 (아시아), 수도는 타슈켄트", area: "447,400 km² (세계 56위)", pop: "약 3,600만 명 (세계 41위)", gdp: "농업 및 자원 중심국", cities: "타슈켄트, 사마르칸트", famous: "실크로드 역사 도시", history: "이슬람 문화의 중심지였습니다.", relation: "고려인 동포 사회 및 에너지 협력이 깊습니다." },
            { country: "사우디아라비아", engName: "Saudi Arabia", continent: "아시아", code: "sa", capital: "리야드 (Riyadh)", region: "중동 (아시아), 수도는 리야드", area: "2,149,690 km² (세계 12위)", pop: "약 3,600만 명 (세계 43위)", gdp: "석유 수출국 (G20)", cities: "리야드, 제다, 메카", famous: "석유 및 네옴시티", history: "아라비아 반도를 통일하여 세워졌습니다.", relation: "네옴시티 등 대규모 경제 협력 중입니다." },
            { country: "아랍에미리트", engName: "UAE", continent: "아시아", code: "ae", capital: "아부다비 (Abu Dhabi)", region: "중동 (아시아), 수도는 아부다비", area: "83,600 km² (세계 114위)", pop: "약 940만 명 (세계 93위)", gdp: "고소득 금융·물류 중심지", cities: "아부다비, 두바이", famous: "부르즈 칼리파", history: "1971년 토후국들이 연합하여 수립되었습니다.", relation: "바라카 원전 등 특별한 전략적 동반자입니다." },
            { country: "이라크", engName: "Iraq", continent: "아시아", code: "iq", capital: "바그다드 (Baghdad)", region: "중동 (아시아), 수도는 바그다드", area: "438,317 km² (세계 58위)", pop: "약 4,400만 명 (세계 36위)", gdp: "석유 매장국", cities: "바그다드, 아르빌", famous: "메소포타미아 문명", history: "인류 문명의 요람입니다.", relation: "재건 사업 및 플랜트 건설 협력국입니다." },
            { country: "이란", engName: "Iran", continent: "아시아", code: "ir", capital: "테헤란 (Tehran)", region: "중동 (아시아), 수도는 테헤란", area: "1,648,195 km² (세계 17위)", pop: "약 8,800만 명 (세계 18위)", gdp: "자원 국가", cities: "테헤란, 이스파한", famous: "페르시아 고대 문명", history: "1979년 이슬람 혁명을 거쳤습니다.", relation: "역사적 외교 관계를 가집니다." },
            { country: "이스라엘", engName: "Israel", continent: "아시아", code: "il", capital: "예루살렘 (Jerusalem)", region: "중동 (아시아), 수도는 예루살렘", area: "22,072 km² (세계 148위)", pop: "약 970만 명 (세계 96위)", gdp: "스타트업·첨단 기술 선진국", cities: "예루살렘, 텔아비브", famous: "IT 기술 및 성지", history: "1948년 현대 국가로 재건되었습니다.", relation: "R&D 및 첨단 기술 분야 교류가 활발합니다." },
            { country: "튀르키예", engName: "Turkey", continent: "아시아", code: "tr", capital: "앙카라 (Ankara)", region: "서아시아/유럽 (아시아), 수도는 앙카라", area: "783,562 km² (세계 37위)", pop: "약 8,500만 명 (세계 19위)", gdp: "경제 요충지", cities: "앙카라, 이스탄불", famous: "보스포루스 해협", history: "오스만 제국의 중심지였습니다.", relation: "형제의 나라로 불리는 혈맹 관계입니다." },
            { country: "카타르", engName: "Qatar", continent: "아시아", code: "qa", capital: "도하 (Doha)", region: "중동 (아시아), 수도는 도하", area: "11,586 km² (세계 158위)", pop: "약 270만 명 (세계 139위)", gdp: "LNG 부국", cities: "도하", famous: "천연가스 및 월드컵", history: "1971년 독립했습니다.", relation: "주요 LNG 도입선 및 에너지 협력국입니다." },
            { country: "네팔", engName: "Nepal", continent: "아시아", code: "np", capital: "카트만두 (Kathmandu)", region: "남아시아 (아시아), 수도는 카트만두", area: "147,181 km² (세계 93위)", pop: "약 3,000만 명 (세계 49위)", gdp: "관광 및 농업 국가", cities: "카트만두, 포카라", famous: "히말라야 산맥 및 에베레스트", history: "왕정에서 공화국으로 전환되었습니다.", relation: "등산 및 인적 교류가 있습니다." },
            { country: "스리랑카", engName: "Sri Lanka", continent: "아시아", code: "lk", capital: "스리자야와르디나푸라 코테 (Sri Jayawardenepura Kotte)", region: "남아시아 (아시아), 수도는 스리자야와르디나푸라 코테", area: "65,610 km² (세계 121위)", pop: "약 2,200만 명 (세계 58위)", gdp: "해상 무역 및 관광국", cities: "콜롬보, 칸디", famous: "홍차 및 불교 유적", history: "실크로드의 주요 기항지였습니다.", relation: "경제 및 개발 협력 국가입니다." },
            { country: "요르단", engName: "Jordan", continent: "아시아", code: "jo", capital: "암만 (Amman)", region: "중동 (아시아), 수도는 암만", area: "89,342 km² (세계 111위)", pop: "약 1,100만 명 (세계 83위)", gdp: "중동의 안정적 경제국", cities: "암만, 아카바, 페트라", famous: "페트라 유적", history: "영국 위임통치 후 독립했습니다.", relation: "중동 지역 우방국입니다." },
            { country: "레바논", engName: "Lebanon", continent: "아시아", code: "lb", capital: "베이루트 (Beirut)", region: "중동 (아시아), 수도는 베이루트", area: "10,452 km² (세계 166위)", pop: "약 530만 명 (세계 116위)", gdp: "상업 및 금융 중심지", cities: "베이루트, 트리폴리", famous: "레바논 삼나무 및 고대 페니키아", history: "고대 페니키아 문명의 발상지입니다.", relation: "UNIFIL 파견 등으로 인연이 있습니다." },
            { country: "오만", engName: "Oman", continent: "아시아", code: "om", capital: "무스카트 (Muscat)", region: "중동 (아시아), 수도는 무스카트", area: "309,500 km² (세계 70위)", pop: "약 450만 명 (세계 126위)", gdp: "에너지 자원 국가", cities: "무스카트, 살랄라", famous: "향신료 무역 및 사막", history: "해상 무역의 중심지였습니다.", relation: "에너지 및 건설 협력국입니다." },
            { country: "쿠웨이트", engName: "Kuwait", continent: "아시아", code: "kw", capital: "쿠웨이트시티 (Kuwait City)", region: "중동 (아시아), 수도는 쿠웨이트시티", area: "17,818 km² (세계 155위)", pop: "약 420만 명 (세계 129위)", gdp: "석유 부국", cities: "쿠웨이트시티", famous: "석유 자원 및 타워", history: "걸프 지역의 주요 무역항이었습니다.", relation: "에너지 협력 우방국입니다." },
            { country: "바레인", engName: "Bahrain", continent: "아시아", code: "bh", capital: "마나마 (Manama)", region: "중동 (아시아), 수도는 마나마", area: "765.3 km² (세계 184위)", pop: "약 140만 명 (세계 153위)", gdp: "금융 및 석유 경제", cities: "마나마", famous: "진주 채취 및 금융 허브", history: "고대 딜문 문명의 중심지였습니다.", relation: "중동 금융 협력국입니다." },
            { country: "예멘", engName: "Yemen", continent: "아시아", code: "ye", capital: "사나 (Sana'a)", region: "중동 (아시아), 수도는 사나", area: "527,968 km² (세계 49위)", pop: "약 3,300만 명 (세계 47위)", gdp: "개발도상국", cities: "사나, 아덴", famous: "모카 커피", history: "고대 향신료 무역로의 요충지였습니다.", relation: "인도적 지원 대상입니다." },
            { country: "시리아", engName: "Syria", continent: "아시아", code: "sy", capital: "다마스쿠스 (Damascus)", region: "중동 (아시아), 수도는 다마스쿠스", area: "185,180 km² (세계 88위)", pop: "약 2,200만 명 (세계 60위)", gdp: "중동 국가", cities: "다마스쿠스, 알레포", famous: "고대 역사 도시", history: "세계에서 가장 오래된 지속 거주 도시가 있습니다.", relation: "외교 관계를 유지합니다." },
            { country: "아프가니스탄", engName: "Afghanistan", continent: "아시아", code: "af", capital: "카불 (Kabul)", region: "중앙아시아 (아시아), 수도는 카불", area: "652,230 km² (세계 41위)", pop: "약 4,100만 명 (세계 34위)", gdp: "내륙 개발도상국", cities: "카불, 칸다하르", famous: "실크로드 요충지", history: "다양한 문명이 교차하는 요충지였습니다.", relation: "국제 사회와 협력 중입니다." },
            { country: "키르기스스탄", engName: "Kyrgyzstan", continent: "아시아", code: "kg", capital: "비슈케크 (Bishkek)", region: "중앙아시아 (아시아), 수도는 비슈케크", area: "199,951 km² (세계 86위)", pop: "약 700만 명 (세계 110위)", gdp: "중앙아시아 신흥국", cities: "비슈케크, 오시", famous: "산악 지형 및 호수", history: "실크로드의 대상들이 거쳐간 곳입니다.", relation: "개발 협력 국가입니다." },
            { country: "타지키스탄", engName: "Tajikistan", continent: "아시아", code: "tj", capital: "두샨베 (Dushanbe)", region: "중앙아시아 (아시아), 수도는 두샨베", area: "143,100 km² (세계 95위)", pop: "약 1,000만 명 (세계 91위)", gdp: "중앙아시아 국가", cities: "두샨베, 후잔트", famous: "파미르 고원", history: "소련 구성국에서 독립했습니다.", relation: "경제 협력 관계입니다." },
            { country: "투르크메니스탄", engName: "Turkmenistan", continent: "아시아", code: "tm", capital: "아시가바트 (Ashgabat)", region: "중앙아시아 (아시아), 수도는 아시가바트", area: "488,100 km² (세계 52위)", pop: "약 640만 명 (세계 113위)", gdp: "천연가스 부국", cities: "아시가바트, 투르크멘바시", famous: "가스 분화구 및 대리석 도시", history: "실크로드의 핵심 거점 중 하나였습니다.", relation: "자원 및 플랜트 협력국입니다." },
            { country: "아르메니아", engName: "Armenia", continent: "아시아", code: "am", capital: "예레반 (Yerevan)", region: "서아시아 (아시아), 수도는 예레반", area: "29,743 km² (세계 138위)", pop: "약 280만 명 (세계 137위)", gdp: "유럽·아시아 접경국", cities: "예레반, 귬리", famous: "아라라트 산 및 기독교 유적", history: "세계 최초로 기독교를 국교로 채택했습니다.", relation: "외교 관계를 유지합니다." },
            { country: "아제르바이잔", engName: "Azerbaijan", continent: "아시아", code: "az", capital: "바쿠 (Baku)", region: "서아시아 (아시아), 수도는 바쿠", area: "86,600 km² (세계 112위)", pop: "약 1,000만 명 (세계 86위)", gdp: "에너지 자원 국가", cities: "바쿠, 간자", famous: "카스피해 석유 및 불의 나라", history: "실크로드의 교차로였습니다.", relation: "에너지 및 인프라 협력국입니다." },
            { country: "조지아", engName: "Georgia", continent: "아시아", code: "ge", capital: "트빌리시 (Tbilisi)", region: "서아시아 (아시아), 수도는 트빌리시", area: "69,700 km² (세계 119위)", pop: "약 370만 명 (세계 133위)", gdp: "코카서스 선진 신흥국", cities: "트빌리시, 바투미", famous: "와인 발상지 및 코카서스 산맥", history: "고대 코콜리다 왕국의 터전입니다.", relation: "관광 및 경제 협력국입니다." },
            { country: "라오스", engName: "Laos", continent: "아시아", code: "la", capital: "비엔티안 (Vientiane)", region: "동남아시아 (아시아), 수도는 비엔티안", area: "236,800 km² (세계 82위)", pop: "약 750만 명 (세계 105위)", gdp: "동남아 개발도상국", cities: "비엔티안, 루앙프라방", famous: "메콩강 및 불교 사원", history: "란창 왕국의 역사를 지닙니다.", relation: "ODA 및 개발 협력 국가입니다." },
            { country: "캄보디아", engName: "Cambodia", continent: "아시아", code: "kh", capital: "프놈펜 (Phnom Penh)", region: "동남아시아 (아시아), 수도는 프놈펜", area: "181,035 km² (세계 89위)", pop: "약 1,680만 명 (세계 71위)", gdp: "관광 및 농업 신흥국", cities: "프놈펜, 시엠레아프", famous: "앙코르 와트", history: "크메르 제국의 찬란한 유산을 가졌습니다.", relation: "경제 및 문화 협력국입니다." },
            { country: "브루나이", engName: "Brunei", continent: "아시아", code: "bn", capital: "반다르스리베가완 (Bandar Seri Begawan)", region: "동남아시아 (아시아), 수도는 반다르스리베가완", area: "5,765 km² (세계 169위)", pop: "약 44만 명 (세계 174위)", gdp: "석유·가스 고소득 국가", cities: "반다르스리베가완", famous: "이슬람 사원 및 자원", history: "술탄 왕조의 통치를 이어오고 있습니다.", relation: "에너지 협력국입니다." },
            { country: "동티모르", engName: "East Timor", continent: "아시아", code: "tl", capital: "딜리 (Dili)", region: "동남아시아 (아시아), 수도는 딜리", area: "14,874 km² (세계 153위)", pop: "약 130만 명 (세계 157위)", gdp: "신생 독립국", cities: "딜리", famous: "아름다운 자연환경", history: "2002년 독립한 아시아 최신 독립국입니다.", relation: "평화 유지 및 지원 인연이 있습니다." },
            { country: "부탄", engName: "Bhutan", continent: "아시아", code: "bt", capital: "팀부 (Thimphu)", region: "남아시아 (아시아), 수도는 팀부", area: "38,394 km² (세계 135위)", pop: "약 78만 명 (세계 164위)", gdp: "국민총행복(GNH) 추구 국가", cities: "팀부, 파로", famous: "히말라야 산악 국가 및 불교", history: "독자적인 왕정 체제를 유지했습니다.", relation: "환경 및 문화 교류가 있습니다." },
            { country: "몰디브", engName: "Maldives", continent: "아시아", code: "mv", capital: "말레 (Male)", region: "남아시아 (아시아), 수도는 말레", area: "300 km² (세계 185위)", pop: "약 52만 명 (세계 171위)", gdp: "관광업 중심 국가", cities: "말레", famous: "세계적인 휴양지 및 산호섬", history: "인도양의 섬나라로 번영했습니다.", relation: "관광 및 휴양지로 친숙합니다." },

            // --- 유럽 (약 45개국) ---
            { country: "프랑스", engName: "France", continent: "유럽", code: "fr", capital: "파리 (Paris)", region: "서유럽 (유럽), 수도는 파리", area: "551,695 km² (세계 43위)", pop: "약 6,800만 명 (세계 22위)", gdp: "선진 경제 대국 (G7)", cities: "파리, 마르세유, 리옹", famous: "에펠탑 및 와인·예술", history: "프랑스 혁명으로 근대 민주주의의 발상지가 되었습니다.", relation: "문화, 과학기술 선진 우방국입니다." },
            { country: "영국", engName: "United Kingdom", continent: "유럽", code: "gb", capital: "런던 (London)", region: "서유럽 (유럽), 수도는 런던", area: "242,495 km² (세계 78위)", pop: "약 6,700만 명 (세계 21위)", gdp: "금융·선진 경제 (G7)", cities: "런던, 맨체스터, 버밍엄", famous: "빅벤 및 산업혁명", history: "산업혁명을 주도하며 세계 제국으로 발돋움했습니다.", relation: "한국전쟁 참전국 및 FTA 체결국입니다." },
            { country: "독일", engName: "Germany", continent: "유럽", code: "de", capital: "베를린 (Berlin)", region: "서유럽 (유럽), 수도는 베를린", area: "357,022 km² (세계 63위)", pop: "약 8,400만 명 (세계 19위)", gdp: "유럽 최대 경제 대국", cities: "베를린, 뮌헨, 프랑크푸르트", famous: "자동차 및 제조업", history: "베를린 장벽 붕괴로 평화 재통일을 이뤘습니다.", relation: "제조업 및 기술 교류가 활발합니다." },
            { country: "이탈리아", engName: "Italy", continent: "유럽", code: "it", capital: "로마 (Rome)", region: "남유럽 (유럽), 수도는 로마", area: "301,340 km² (세계 71위)", pop: "약 5,900만 명 (세계 25위)", gdp: "선진 경제 (G7)", cities: "로마, 밀라노, 피렌체", famous: "콜로세움 및 르네상스", history: "고대 로마 제국과 르네상스의 중심지입니다.", relation: "디자인, 문화 교류가 깊습니다." },
            { country: "스페인", engName: "Spain", continent: "유럽", code: "es", capital: "마드리드 (Madrid)", region: "남유럽 (유럽), 수도는 마드리드", area: "505,992 km² (세계 51위)", pop: "약 4,800만 명 (세계 30위)", gdp: "관광 및 농수산업 강국", cities: "마드리드, 바르셀로나, 세비야", famous: "플라멩코 및 축구", history: "대항해 시대를 열어 아메리카로 진출했습니다.", relation: "인프라 및 관광 분야 협력국입니다." },
            { country: "스위스", engName: "Switzerland", continent: "유럽", code: "ch", capital: "베른 (Bern)", region: "중앙유럽 (유럽), 수도는 베른", area: "41,285 km² (세계 133위)", pop: "약 880만 명 (세계 100위)", gdp: "영중립국 고소득 경제", cities: "취리히, 제네바, 베른", famous: "알프스 및 시계·금융", history: "영구 중립국 지위를 지켜왔습니다.", relation: "제약 및 금융 분야 협력국입니다." },
            { country: "스웨덴", engName: "Sweden", continent: "유럽", code: "se", capital: "스톡홀름 (Stockholm)", region: "북유럽 (유럽), 수도는 스톡홀름", area: "450,295 km² (세계 55위)", pop: "약 1,050만 명 (세계 88위)", gdp: "복지·혁신 선진 경제", cities: "스톡홀름, 예테보리", famous: "이케아 및 노벨상", history: "복지 국가 모델을 발전시켰습니다.", relation: "한국전쟁 적십자병원 파견 인연이 있습니다." },
            { country: "네덜란드", engName: "Netherlands", continent: "유럽", code: "nl", capital: "암스테르담 (Amsterdam)", region: "서유럽 (유럽), 수도는 암스테르담", area: "41,850 km² (세계 132위)", pop: "약 1,780만 명 (세계 67위)", gdp: "무역·농업 선진국", cities: "암스테르담, 로테르담, 헤이그", famous: "풍차 및 반도체 장비(ASML)", history: "해상 무역과 동인도 회사로 번영했습니다.", relation: "반도체 공급망의 핵심 협력국입니다." },
            { country: "벨기에", engName: "Belgium", continent: "유럽", code: "be", capital: "브뤼셀 (Brussels)", region: "서유럽 (유럽), 수도는 브뤼셀", area: "30,528 km² (세계 141위)", pop: "약 1,170만 명 (세계 82위)", gdp: "EU 본부 소재국", cities: "브뤼셀, 안트베르펜, 겐트", famous: "초콜릿 및 EU 정치 중심지", history: "양차 대전의 상처를 딛고 EU의 중심이 되었습니다.", relation: "한국전쟁 참전국입니다." },
            { country: "오스트리아", engName: "Austria", continent: "유럽", code: "at", capital: "빈 (Vienna)", region: "중앙유럽 (유럽), 수도는 빈", area: "83,879 km² (세계 113위)", pop: "약 910만 명 (세계 98위)", gdp: "문화 예술 선진국", cities: "빈, 잘츠부르크, 인스브루크", famous: "음악의 도시 빈 및 알프스", history: "합스부르크 가문의 중심지였습니다.", relation: "예술 및 경제 교류가 활발합니다." },
            { country: "폴란드", engName: "Poland", continent: "유럽", code: "pl", capital: "바르샤바 (Warsaw)", region: "동유럽 (유럽), 수도는 바르샤바", area: "312,696 km² (세계 70위)", pop: "약 3,770만 명 (세계 37위)", gdp: "동유럽 고성장 경제", cities: "바르샤바, 크라코프, 브로츠와프", famous: "쇼팽 및 중유럽 제조 허브", history: "공산주의를 극복하고 자유민주주의를 이뤘습니다.", relation: "방산 및 원전 협력의 핵심 파트너입니다." },
            { country: "포르투갈", engName: "Portugal", continent: "유럽", code: "pt", capital: "리스본 (Lisbon)", region: "남유럽 (유럽), 수도는 리스본", area: "92,212 km² (세계 111위)", pop: "약 1,040만 명 (세계 89위)", gdp: "해양 경제", cities: "리스본, 포르투", famous: "대항해 시대 역사 및 에그타르트", history: "대항해 시대의 포문을 연 선구자입니다.", relation: "신재생 에너지 협력 우방국입니다." },
            { country: "그리스", engName: "Greece", continent: "유럽", code: "gr", capital: "아테네 (Athens)", region: "남유럽 (유럽), 수도는 아테네", area: "131,957 km² (세계 96위)", pop: "약 1,040만 명 (세계 90위)", gdp: "관광 및 해운 중심 경제", cities: "아테네, 테살로니키", famous: "고대 그리스 문명 및 파르테논", history: "철학과 민주주의가 탄생한 본고장입니다.", relation: "해운 및 조선업 협력국입니다." },
            { country: "덴마크", engName: "Denmark", continent: "유럽", code: "dk", capital: "코펜하겐 (Copenhagen)", region: "북유럽 (유럽), 수도는 코펜하겐", area: "43,094 km² (세계 130위)", pop: "약 590만 명 (세계 115위)", gdp: "복지 선진국", cities: "코펜하겐, 오르후스", famous: "레고 및 안데르센 동화", history: "바이킹의 후예이자 입헌군주국입니다.", relation: "한국전쟁 의료지원국입니다." },
            { country: "노르웨이", engName: "Norway", continent: "유럽", code: "no", capital: "오슬로 (Oslo)", region: "북유럽 (유럽), 수도는 오슬로", area: "323,802 km² (세계 67위)", pop: "약 540만 명 (세계 118위)", gdp: "에너지 고소득 국가", cities: "오슬로, 베르겐", famous: "피오르드 및 석유·가스", history: "1905년 완전히 독립했습니다.", relation: "한국전쟁 의료지원국 및 해양 협력국입니다." },
            { country: "핀란드", engName: "Finland", continent: "유럽", code: "fi", capital: "헬싱키 (Helsinki)", region: "북유럽 (유럽), 수도는 헬싱키", area: "338,455 km² (세계 64위)", pop: "약 560만 명 (세계 117위)", gdp: "교육·혁신 선진국", cities: "헬싱키, 에스푸", famous: "오로라 및 교육 시스템", history: "1917년 독립을 선언했습니다.", relation: "스타트업 및 혁신 기술 협력국입니다." },
            { country: "아일랜드", engName: "Ireland", continent: "유럽", code: "ie", capital: "더블린 (Dublin)", region: "서유럽 (유럽), 수도는 더블린", area: "70,273 km² (세계 120위)", pop: "약 510만 명 (세계 121위)", gdp: "글로벌 IT·제약 거점", cities: "더블린, 코크", famous: "기네스 맥주 및 켈틱 타이거", history: "비약적인 경제 성장을 이뤄냈습니다.", relation: "고부가가치 산업 교류국입니다." },
            { country: "체코", engName: "Czechia", continent: "유럽", code: "cz", capital: "프라하 (Prague)", region: "중앙유럽 (유럽), 수도는 프라하", area: "78,871 km² (세계 115위)", pop: "약 1,050만 명 (세계 87위)", gdp: "공업·제조업 선진국", cities: "프라하, 브르노", famous: "프라하 성 및 맥주", history: "벨벳 혁명으로 민주주의를 되찾았습니다.", relation: "제조업 및 인프라 협력국입니다." },
            { country: "헝가리", engName: "Hungary", continent: "유럽", code: "hu", capital: "부다페스트 (Budapest)", region: "중앙유럽 (유럽), 수도는 부다페스트", area: "93,028 km² (세계 109위)", pop: "약 960만 명 (세계 95위)", gdp: "자동차·부품 제조 중심지", cities: "부다페스트, 데브레첸", famous: "다뉴브강 및 온천", history: "동유럽 민주화 운동의 주역이었습니다.", relation: "전기차 및 배터리 투자 집중 국가입니다." },
            { country: "우크라이나", engName: "Ukraine", continent: "유럽", code: "ua", capital: "키이우 (Kyiv)", region: "동유럽 (유럽), 수도는 키이우", area: "603,628 km² (세계 44위)", pop: "약 3,800만 명 (세계 35위)", gdp: "곡창 지대 신흥국", cities: "키이우, 하르키우, 오데사", famous: "세계적인 곡창 지대", history: "1991년 소련으로부터 독립했습니다.", relation: "전후 재건 사업 협력 기대 국가입니다." },
            { country: "루마니아", engName: "Romania", continent: "유럽", code: "ro", capital: "부쿠레슈티 (Bucharest)", region: "동유럽 (유럽), 수도는 부쿠레슈티", area: "238,397 km² (세계 80위)", pop: "약 1,900만 명 (세계 61위)", gdp: "IT 및 제조업 성장국", cities: "부쿠레슈티, 클루지나포카", famous: "드라큘라 성 및 IT 산업", history: "고대 로마의 식민지 다키아에 뿌리를 둡니다.", relation: "경제 협력 확대 국가입니다." },
            { country: "크로아티아", engName: "Croatia", continent: "유럽", code: "hr", capital: "자그레브 (Zagreb)", region: "남유럽 (유럽), 수도는 자그레브", area: "56,594 km² (세계 127위)", pop: "약 400만 명 (세계 130위)", gdp: "관광업 중심 국가", cities: "자그레브, 스플리트, 두브로브니크", famous: "아드리아해 및 플리트비체", history: "1991년 유고슬라비아 연방에서 독립했습니다.", relation: "인적 교류 및 우호 관계입니다." },
            { country: "러시아", engName: "Russia", continent: "유럽", code: "ru", capital: "모스크바 (Moscow)", region: "동유럽/북아시아 (유럽), 수도는 모스크바", area: "17,098,246 km² (세계 1위)", pop: "약 1억 4,300만 명 (세계 9위)", gdp: "세계 최대 영토 자원 국가", cities: "모스크바, 상트페테르부르크", famous: "시베리아 횡단철도 및 크렘린", history: "소련 해체 이후 현재에 이르렀습니다.", relation: "국제 정세에 따른 외교 변동성이 있습니다." },
            { country: "아이슬란드", engName: "Iceland", continent: "유럽", code: "is", capital: "레이캬비크 (Reykjavik)", region: "북유럽 (유럽), 수도는 레이캬비크", area: "103,000 km² (세계 106위)", pop: "약 38만 명 (세계 179위)", gdp: "청정 에너지 선진국", cities: "레이캬비크", famous: "오로라 및 간헐천", history: "세계 최초의 의회 중 하나를 세웠습니다.", relation: "신재생 에너지 협력국입니다." },
            { country: "벨라루스", engName: "Belarus", continent: "유럽", code: "by", capital: "민스크 (Minsk)", region: "동유럽 (유럽), 수도는 민스크", area: "207,600 km² (세계 84위)", pop: "약 920만 명 (세계 97위)", gdp: "제조업 중심 동유럽 국가", cities: "민스크, 고멜", famous: "동유럽 평원 및 숲", history: "소련 구성국에서 독립했습니다.", relation: "외교 관계를 유지합니다." },
            { country: "불가리아", engName: "Bulgaria", continent: "유럽", code: "bg", capital: "소피아 (Sofia)", region: "동유럽 (유럽), 수도는 소피아", area: "110,879 km² (세계 104위)", pop: "약 650만 명 (세계 111위)", gdp: "발칸반도 신흥 경제", cities: "소피아, 플로브디프", famous: "장미 오일 및 요거트", history: "발칸반도의 유서 깊은 역사 국가입니다.", relation: "유럽 내 협력 관계입니다." },
            { country: "세르비아", engName: "Serbia", continent: "유럽", code: "rs", capital: "베오그라드 (Belgrade)", region: "남유럽 (유럽), 수도는 베오그라드", area: "77,474 km² (세계 116위)", pop: "약 660만 명 (세계 109위)", gdp: "발칸반도 중심 국가", cities: "베오그라드, 노비사드", famous: "다뉴브강 및 역사 유적", history: "유고슬라비아의 중심 지역이었습니다.", relation: "경제 협력 관계입니다." },
            { country: "슬로바키아", engName: "Slovakia", continent: "유럽", code: "sk", capital: "브라티슬라바 (Bratislava)", region: "중앙유럽 (유럽), 수도는 브라티슬라바", area: "49,035 km² (세계 131위)", pop: "약 540만 명 (세계 118위)", gdp: "자동차 산업 중심 선진국", cities: "브라티슬라바, 코시체", famous: "타트라 산맥 및 성곽", history: "체코와 분리되어 독립 국가가 되었습니다.", relation: "제조업 투자 협력국입니다." },
            { country: "슬로베니아", engName: "Slovenia", continent: "유럽", code: "si", capital: "류블랴나 (Ljubljana)", region: "중앙유럽 (유럽), 수도는 류블랴나", area: "20,273 km² (세계 151위)", pop: "약 210만 명 (세계 148위)", gdp: "발전된 알프스 선진국", cities: "류블랴나, 마리보르", famous: "블레드 호수 및 알프스 자연", history: "유고슬라비아에서 평화롭게 독립했습니다.", relation: "유럽 내 우방국입니다." },
            { country: "리투아니아", engName: "Lithuania", continent: "유럽", code: "lt", capital: "빌뉴스 (Vilnius)", region: "북유럽/동유럽 (유럽), 수도는 빌뉴스", area: "65,300 km² (세계 122위)", pop: "약 280만 명 (세계 136위)", gdp: "발트 3국 선진 경제", cities: "빌뉴스, 카우나스", famous: "중세 구시가지 및 호수", history: "소련으로부터 독립을 이뤄냈습니다.", relation: "발트해 협력국입니다." },
            { country: "라트비아", engName: "Latvia", continent: "유럽", code: "lv", capital: "리가 (Riga)", region: "북유럽/동유럽 (유럽), 수도는 리가", area: "64,589 km² (세계 123위)", pop: "약 190만 명 (세계 150위)", gdp: "발트해 연안 경제", cities: "리가, 리에파야", famous: "아르누보 건축 및 발트해", history: "발트 3국의 중심에 위치합니다.", relation: "경제 및 물류 협력국입니다." },
            { country: "에스토니아", engName: "Estonia", continent: "유럽", code: "ee", capital: "탈린 (Tallinn)", region: "북유럽/동유럽 (유럽), 수도는 탈린", area: "45,339 km² (세계 132위)", pop: "약 130만 명 (세계 158위)", gdp: "디지털·IT 선진국", cities: "탈린, 타르투", famous: "전자정부 및 IT 스타트업", history: "디지털 혁신을 선도하는 국가입니다.", relation: "디지털 정부 및 IT 협력국입니다." },
            { country: "알바니아", engName: "Albania", continent: "유럽", code: "al", capital: "티라나 (Tirana)", region: "남유럽 (유럽), 수도는 티라나", area: "28,748 km² (세계 139위)", pop: "약 280만 명 (세계 138위)", gdp: "발칸반도 신흥국", cities: "티라나, 드로레스", famous: "지중해 해변 및 산악 지형", history: "독특한 언어와 역사를 가졌습니다.", relation: "외교 관계를 유지합니다." },
            { country: "보스니아 헤르체고비나", engName: "Bosnia and Herzegovina", continent: "유럽", code: "ba", capital: "사라예보 (Sarajevo)", region: "남유럽 (유럽), 수도는 사라예보", area: "51,209 km² (세계 129위)", pop: "약 320만 명 (세계 132위)", gdp: "발칸반도 국가", cities: "사라예보, 모스타르", history: "다민족 역사와 사라예보 사건의 무대입니다.", relation: "협력 관계입니다." },
            { country: "몬테네그로", engName: "Montenegro", continent: "유럽", code: "me", capital: "포드고리차 (Podgorica)", region: "남유럽 (유럽), 수도는 포드고리차", area: "13,812 km² (세계 155위)", pop: "약 62만 명 (세계 169위)", gdp: "관광 중심 아드리아해 국가", cities: "포드고리차, 코토르", famous: "코토르 만 및 아드리아해", history: "독립을 통해 주권 국가가 되었습니다.", relation: "관광 및 우호 관계입니다." },
            { country: "북마케도니아", engName: "North Macedonia", continent: "유럽", code: "mk", capital: "스코페 (Skopje)", region: "남유럽 (유럽), 수도는 스코페", area: "25,713 km² (세계 145위)", pop: "약 200만 명 (세계 149위)", gdp: "발칸반도 내륙국", cities: "스코페, 오흐리드", famous: "알렉산더 대왕의 역사", history: "고대 마케도니아의 터전입니다.", relation: "우호적 외교 관계입니다." },
            { country: "몰도바", engName: "Moldova", continent: "유럽", code: "md", capital: "키시나우 (Chisinau)", region: "동유럽 (유럽), 수도는 키시나우", area: "33,846 km² (세계 136위)", pop: "약 250만 명 (세계 141위)", gdp: "농업 중심 동유럽 국가", cities: "키시나우, 벨치", famous: "포도주 및 와이너리", history: "소련 해체 후 독립했습니다.", relation: "개발 협력국입니다." },
            { country: "키프로스", engName: "Cyprus", continent: "유럽", code: "cy", capital: "니코시아 (Nicosia)", region: "남유럽/서아시아 (유럽), 수도는 니코시아", area: "9,251 km² (세계 167위)", pop: "약 120만 명 (세계 160위)", gdp: "지중해 관광·금융 국가", cities: "니코시아, 리마솔", famous: "지중해 휴양지 및 유적", history: "그리스와 튀르키예 문화가 공존합니다.", relation: "지중해 교류국입니다." },
            { country: "룩셈부르크", engName: "Luxembourg", continent: "유럽", code: "lu", capital: "룩셈부르크 (Luxembourg)", region: "서유럽 (유럽), 수도는 룩셈부르크", area: "2,586 km² (세계 175위)", pop: "약 65만 명 (세계 167위)", gdp: "세계 최고 수준 1인당 GDP", cities: "룩셈부르크", famous: "금융 및 철강 산업", history: "유럽 연합의 사법·행정 중심지 중 하나입니다.", relation: "금융 및 경제 협력국입니다." },
            { country: "몰타", engName: "Malta", continent: "유럽", code: "mt", capital: "발레타 (Valletta)", region: "남유럽 (유럽), 수도는 발레타", area: "316 km² (세계 184위)", pop: "약 53만 명 (세계 172위)", gdp: "지중해 무역 및 관광국", cities: "발레타, 슬리에마", famous: "기사단 유적 및 지중해 바다", history: "지중해 해상 요충지였습니다.", relation: "유럽 내 교류국입니다." },
            { country: "모나코", engName: "Monaco", continent: "유럽", code: "mc", capital: "모나코 (Monaco)", region: "서유럽 (유럽), 수도는 모나코", area: "2.02 km² (세계 194위)", pop: "약 3만 9천 명 (세계 194위)", gdp: "고소득 휴양·금융 도시국가", cities: "모나코", famous: "카지노 및 F1 그랑프리", history: "그리말디 가문이 다스려온 공국입니다.", relation: "우호 관계입니다." },
            { country: "리히텐슈타인", engName: "Liechtenstein", continent: "유럽", code: "li", capital: "파두츠 (Vaduz)", region: "중앙유럽 (유럽), 수도는 파두츠", area: "160 km² (세계 188위)", pop: "약 3만 9천 명 (세계 195위)", gdp: "정밀 공업 고소득 국가", cities: "파두츠", famous: "알프스 산악 공국 및 우표", history: "스위스와 경제 관세 동맹을 맺고 있습니다.", relation: "유럽 내 소국 협력국입니다." },
            { country: "산마리노", engName: "San Marino", continent: "유럽", code: "sm", capital: "산마리노 (San Marino)", region: "남유럽 (유럽), 수도는 산마리노", area: "61 km² (세계 190위)", pop: "약 3만 3천 명 (세계 196위)", gdp: "관광 및 금융 소국", cities: "산마리노", famous: "티타노 산 및 중세 성채", history: "세계에서 가장 오래된 공화국 중 하나입니다.", relation: "우호 관계입니다." },
            { country: "바티칸 시국", engName: "Vatican City", continent: "유럽", code: "va", capital: "바티칸 (Vatican City)", region: "남유럽 (유럽), 수도는 바티칸", area: "0.49 km² (세계 195위)", pop: "약 800명 (세계 198위)", gdp: "가톨릭 교황청 중심", cities: "바티칸 시국", famous: "성 베드로 대성전 및 미술관", history: "세계에서 가장 작은 독립 주권 국가입니다.", relation: "종교 및 외교적 상징성이 높습니다." },
            { country: "안도라", engName: "Andorra", continent: "유럽", code: "ad", capital: "안도라라벨랴 (Andorra la Vella)", region: "남유럽 (유럽), 수도는 안도라라벨랴", area: "468 km² (세계 178위)", pop: "약 8만 명 (세계 185위)", gdp: "피레네 산맥 관광·면세 국가", cities: "안도라라벨랴", famous: "스키 리조트 및 쇼핑", history: "피레네 산맥 속의 자치 공국입니다.", relation: "유럽 교류국입니다." },

            // --- 아프리카 (약 50개국) ---
            { country: "이집트", engName: "Egypt", continent: "아프리카", code: "eg", capital: "카이로 (Cairo)", region: "북아프리카 (아프리카), 수도는 카이로", area: "1,002,450 km² (세계 30위)", pop: "약 1억 1,000만 명 (세계 14위)", gdp: "북아프리카 경제 대국", cities: "카이로, 알렉산드리아, 룩소르", famous: "피라미드 및 나일강", history: "세계 최고의 고대 문명을 꽃피웠습니다.", relation: "인프라 및 방산 분야 협력국입니다." },
            { country: "남아프리카 공화국", engName: "South Africa", continent: "아프리카", code: "za", capital: "프리토리아 (Pretoria)", region: "남아프리카 (아프리카), 수도는 프리토리아", area: "1,221,037 km² (세계 24위)", pop: "약 6,000만 명 (세계 24위)", gdp: "아프리카 대륙 선진 경제", cities: "프리토리아, 요하네스버그, 케이프타운", famous: "희귀 광물 및 자연 보호구역", history: "아파르트헤이트를 극복하고 민주주의를 이룩했습니다.", relation: "아프리카 핵심 교역 및 투자 파트너입니다." },
            { country: "모로코", engName: "Morocco", continent: "아프리카", code: "ma", capital: "라바트 (Rabat)", region: "북아프리카 (아프리카), 수도는 라바트", area: "446,550 km² (세계 57위)", pop: "약 3,700만 명 (세계 40위)", gdp: "북아프리카 관광·무역 중심", cities: "라바트, 카사블랑카, 마라케시", famous: "사하라 사막 및 카사블랑카", history: "독자적인 이슬람 왕조를 유지해 왔습니다.", relation: "자동차 및 부품 산업 중심의 협력국입니다." },
            { country: "케냐", engName: "Kenya", continent: "아프리카", code: "ke", capital: "나이로비 (Nairobi)", region: "동아프리카 (아프리카), 수도는 나이로비", area: "580,367 km² (세계 47위)", pop: "약 5,400만 명 (세계 27위)", gdp: "동아프리카 경제 허브", cities: "나이로비, 몸바사", famous: "사파리 관광 및 마라톤", history: "영국의 식민 지배를 거쳐 1963년 독립했습니다.", relation: "개발협력(ODA) 및 민간 투자 활발국입니다." },
            { country: "나이지리아", engName: "Nigeria", continent: "아프리카", code: "ng", capital: "아부주 (Abuja)", region: "서아프리카 (아프리카), 수도는 아부주", area: "923,768 km² (세계 32위)", pop: "약 2억 2,000만 명 (세계 6위)", gdp: "아프리카 최대 인구·경제 대국", cities: "아부주, 라고스", famous: "석유 자원 및 영화 산업(놀리우드)", history: "대륙 최대의 인구와 경제력을 가졌습니다.", relation: "에너지 및 자원 협력 대상국입니다." },
            { country: "가나", engName: "Ghana", continent: "아프리카", code: "gh", capital: "아크라 (Accra)", region: "서아프리카 (아프리카), 수도는 아크라", area: "238,533 km² (세계 79위)", pop: "약 3,300만 명 (세계 46위)", gdp: "민주주의 모범 국가", cities: "아크라, 쿠마시", famous: "황금 해안 및 코코아", history: "사하라 이남 아프리카 최초로 독립했습니다.", relation: "인프라 및 공공 행정 협력국입니다." },
            { country: "에티오피아", engName: "Ethiopia", continent: "아프리카", code: "et", capital: "아디스아바바 (Addis Ababa)", region: "동아프리카 (아프리카), 수도는 아디스아바바", area: "1,104,300 km² (세계 26위)", pop: "약 1억 2,300만 명 (세계 11위)", gdp: "급성장 신흥국", cities: "아디스아바바, 디레다바", famous: "커피 발상지 및 고원 지대", history: "고유의 제국 전통을 지켜온 국가입니다.", relation: "한국전쟁 참전 전통 우방국입니다." },
            { country: "탄자니아", engName: "Tanzania", continent: "아프리카", code: "tz", capital: "도돔마 (Dodoma)", region: "동아프리카 (아프리카), 수도는 도돔마", area: "947,303 km² (세계 31위)", pop: "약 6,500만 명 (세계 22위)", gdp: "자원 및 관광 중심국", cities: "도돔마, 다르에스살람, 잔지바르", famous: "세렝게티 국립공원 및 킬리만자로", history: "탱가니카와 잔지바르가 연합하여 탄생했습니다.", relation: "EDCF 지원 등 협력국입니다." },
            { country: "알제리", engName: "Algeria", continent: "아프리카", code: "dz", capital: "알제 (Algiers)", region: "북아프리카 (아프리카), 수도는 알제", area: "2,381,741 km² (세계 10위)", pop: "약 4,500만 명 (세계 33위)", gdp: "천연가스 부국", cities: "알제, 오랑, 콘스탄틴", famous: "사하라 사막 및 천연가스", history: "치열한 독립 전쟁 끝에 독립을 쟁취했습니다.", relation: "에너지 플랜트 및 건설 협력국입니다." },
            { country: "튀니지", engName: "Tunisia", continent: "아프리카", code: "tn", capital: "튀니스 (Tunis)", region: "북아프리카 (아프리카), 수도는 튀니스", area: "163,610 km² (세계 90위)", pop: "약 1,200만 명 (세계 79위)", gdp: "북아프리카 안정 경제", cities: "튀니스, 스팍스, 수스", famous: "카르타고 유적 및 지중해", history: "'아랍의 봄' 민주화 운동의 발상지입니다.", relation: "전자정부 및 IT 인프라 협력국입니다." },
            { country: "리비아", engName: "Libya", continent: "아프리카", code: "ly", capital: "트리폴리 (Tripoli)", region: "북아프리카 (아프리카), 수도는 트리폴리", area: "1,759,540 km² (세계 16위)", pop: "약 680만 명 (세계 107위)", gdp: "석유 수출 국가", cities: "트리폴리, 벵가지", famous: "고대 로마 유적 및 사막 석유", history: "북아프리카의 주요 산유국입니다.", relation: "건설 및 에너지 인연이 있습니다." },
            { country: "수단", engName: "Sudan", continent: "아프리카", code: "sd", capital: "하르툼 (Khartoum)", region: "북아프리카 (아프리카), 수도는 하르툼", area: "1,886,068 km² (세계 14위)", pop: "약 4,600만 명 (세계 32위)", gdp: "나일강 유역 농업 국가", cities: "하르툼, 포트수단", famous: "나일강 합류 지점 및 피라미드", history: "고대 쿠시 문명의 터전입니다.", relation: "교류 협력국입니다." },
            { country: "우간다", engName: "Uganda", continent: "아프리카", code: "ug", capital: "캄팔라 (Kampala)", region: "동아프리카 (아프리카), 수도는 캄팔라", area: "241,038 km² (세계 81위)", pop: "약 4,700만 명 (세계 30위)", gdp: "동아프리카 신흥국", cities: "캄팔라, 엔테베", famous: "빅토리아 호수 및 영장류", history: "아프리카의 진주라 불리는 자연을 가졌습니다.", relation: "개발 협력국입니다." },
            { country: "르완다", engName: "Rwanda", continent: "아프리카", code: "rw", capital: "키갈리 (Kigali)", region: "동아프리카 (아프리카), 수도는 키갈리", area: "26,338 km² (세계 144위)", pop: "약 1,350만 명 (세계 74위)", gdp: "IT·친환경 고성장국", cities: "키갈리", famous: "마운틴 고릴라 및 청정 도시", history: "비극을 극복하고 경제 도약을 이뤘습니다.", relation: "ICT 및 행정 협력국입니다." },
            { country: "짐바브웨", engName: "Zimbabwe", continent: "아프리카", code: "zw", capital: "하라레 (Harare)", region: "남아프리카 (아프리카), 수도는 하라레", area: "390,757 km² (세계 60위)", pop: "약 1,600만 명 (세계 73위)", gdp: "자원 보유 국가", cities: "하라레, 불라와요", famous: "빅토리아 폭포", history: "대형 폭포와 풍부한 광물을 지녔습니다.", relation: "협력 관계입니다." },
            { country: "잠비아", engName: "Zambia", continent: "아프리카", code: "zm", capital: "루사카 (Lusaka)", region: "남아프리카 (아프리카), 수도는 루사카", area: "752,618 km² (세계 38위)", pop: "약 2,000만 명 (세계 62위)", gdp: "구리 광물 중심 국가", cities: "루사카, 은돌라", famous: "구리 광산 및 빅토리아 폭포", history: "남부 아프리카의 내륙 국가입니다.", relation: "자원 및 개발 협력국입니다." },
            { country: "앙골라", engName: "Angola", continent: "아프리카", code: "ao", capital: "루안다 (Luanda)", region: "중앙아프리카 (아프리카), 수도는 루안다", area: "1,246,700 km² (세계 22위)", pop: "약 3,500만 명 (세계 42위)", gdp: "석유 및 다이아몬드 부국", cities: "루안다, 로비투", famous: "석유 자원 및 대서양 해안", history: "포르투갈 식민지에서 독립했습니다.", relation: "자원 및 건설 협력국입니다." },
            { country: "모잠비크", engName: "Mozambique", continent: "아프리카", code: "mz", capital: "마푸투 (Maputo)", region: "동아프리카 (아프리카), 수도는 마푸투", area: "801,590 km² (세계 35위)", pop: "약 3,300만 명 (세계 44위)", gdp: "천연자원 개발도상국", cities: "마푸투, 베이라", famous: "인도양 해변 및 천연가스", history: "동부 아프리카의 해상 무역항이었습니다.", relation: "자원 개발 협력국입니다." },
            { country: "마다가스카르", engName: "Madagascar", continent: "아프리카", code: "mg", capital: "안타나나리보 (Antananarivo)", region: "동아프리카 (아프리카), 수도는 안타나나리보", area: "587,041 km² (세계 46위)", pop: "약 2,900만 명 (세계 52위)", gdp: "농업 및 생태 관광국", cities: "안타나나리보, 투아마시나", famous: "바오나무 및 여우원숭이", history: "고유의 독특한 생태계를 보유하고 있습니다.", relation: "농업 및 생태 협력국입니다." },
            { country: "코트디부아르", engName: "Ivory Coast", continent: "아프리카", code: "ci", capital: "야무수크로 (Yamoussoukro)", region: "서아프리카 (아프리카), 수도는 야무수크로", area: "322,463 km² (세계 68위)", pop: "약 2,800만 명 (세계 53위)", gdp: "카카오 수출 중심국", cities: "야무수크로, 아비장", famous: "세계 최대 코코아 생산지", history: "서아프리카의 경제 중심지입니다.", relation: "무역 및 경제 협력국입니다." },
            { country: "카메룬", engName: "Cameroon", continent: "아프리카", code: "cm", capital: "야운데 (Yaounde)", region: "중앙아프리카 (아프리카), 수도는 야운데", area: "475,442 km² (세계 53위)", pop: "약 2,800만 명 (세계 54위)", gdp: "중앙아프리카 경제국", cities: "야운데, 두알라", famous: "아프리카의 축소판 자연", history: "프랑스와 영국의 신탁통치를 거쳤습니다.", relation: "자원 및 교류국입니다." },
            { country: "세네갈", engName: "Senegal", continent: "아프리카", code: "sn", capital: "다카르 (Dakar)", region: "서아프리카 (아프리카), 수도는 다카르", area: "196,722 km² (세계 87위)", pop: "약 1,700만 명 (세계 70위)", gdp: "서아프리카 안정 민주국", cities: "다카르, 티에스", famous: "다카르 랠리 및 고레섬", history: "서아프리카의 정치·문화 중심지입니다.", relation: "개발 협력국입니다." },
            { country: "모리셔스", engName: "Mauritius", continent: "아프리카", code: "mu", capital: "포트루이스 (Port Louis)", region: "동아프리카 (아프리카), 수도는 포트루이스", area: "2,040 km² (세계 179위)", pop: "약 130만 명 (세계 156위)", gdp: "고소득 휴양·금융 국가", cities: "포트루이스", famous: "아름다운 인도양 휴양지", history: "다양한 문화가 어우러진 섬나라입니다.", relation: "관광 및 금융 교류국입니다." },
            { country: "보츠와나", engName: "Botswana", continent: "아프리카", code: "bw", capital: "가보로네 (Gaborone)", region: "남아프리카 (아프리카), 수도는 가보로네", area: "581,730 km² (세계 48위)", pop: "약 260만 명 (세계 143위)", gdp: "다이아몬드 부국", cities: "가보로네, 프랑시스타운", famous: "칼라하리 사막 및 다이아몬드", history: "아프리카에서 정치적 안정이 높은 국가입니다.", relation: "자원 및 경제 협력국입니다." },
            { country: "나미비아", engName: "Namibia", continent: "아프리카", code: "na", capital: "빈트후크 (Windhoek)", region: "남아프리카 (아프리카), 수도는 빈트후크", area: "825,415 km² (세계 34위)", pop: "약 260만 명 (세계 144위)", gdp: "광물 자원 국가", cities: "빈트후크, 스바코프문트", famous: "나미브 사막 및 사파리", history: "독일 식민지배 후 독립했습니다.", relation: "관광 및 자원 협력국입니다." },
            { country: "가봉", engName: "Gabon", continent: "아프리카", code: "ga", capital: "리브르빌 (Libreville)", region: "중앙아프리카 (아프리카), 수도는 리브르빌", area: "267,667 km² (세계 76위)", pop: "약 24만 명 (세계 186위)", gdp: "석유 및 삼림 자원 부국", cities: "리브르빌, 포르장티", famous: "열대우림 및 생태 자원", history: "중앙아프리카의 안정된 산유국입니다.", relation: "자원 협력국입니다." },
            { country: "콩고민주공화국", engName: "Democratic Republic of the Congo", continent: "아프리카", code: "cd", capital: "킨샤사 (Kinshasa)", region: "중앙아프리카 (아프리카), 수도는 킨샤사", area: "2,344,858 km² (세계 11위)", pop: "약 1억 명 (세계 15위)", gdp: "막대한 광물 매장국", cities: "킨샤사, 루룸바시", famous: "콩고강 및 코발트·구리 광물", history: "아프리카 대륙에서 면적이 매우 넓은 국가입니다.", relation: "광물 자원 협력국입니다." },
            { country: "콩고공화국", engName: "Republic of the Congo", continent: "아프리카", code: "cg", capital: "브라자빌 (Brazzaville)", region: "중앙아프리카 (아프리카), 수도는 브라자빌", area: "342,000 km² (세계 64위)", pop: "약 600만 명 (세계 115위)", gdp: "석유 및 삼림 국가", cities: "브라자빌, 푸앵트누아르", famous: "콩고강 분지", history: "프랑스 식민지에서 독립했습니다.", relation: "교류 협력국입니다." },
            { country: "말리", engName: "Mali", continent: "아프리카", code: "ml", capital: "바마코 (Bamako)", region: "서아프리카 (아프리카), 수도는 바마코", area: "1,240,192 km² (세계 23위)", pop: "약 2,200만 명 (세계 61위)", gdp: "사막 및 농업 국가", cities: "바마코, 팀부투", famous: "고대 무역 도시 팀부투", history: "중세 말리 제국의 찬란한 역사를 가졌습니다.", relation: "문화 유산 협력국입니다." },
            { country: "부르키나파소", engName: "Burkina Faso", continent: "아프리카", code: "bf", capital: "와가두구 (Ouagadougou)", region: "서아프리카 (아프리카), 수도는 와가두구", area: "274,200 km² (세계 74위)", pop: "약 2,200만 명 (세계 59위)", gdp: "서아프리카 내륙국", cities: "와가두구, 보보디울라소", famous: "영화 예술제(FESPACO)", history: "프랑스로부터 독립했습니다.", relation: "협력 관계입니다." },
            { country: "니제르", engName: "Niger", continent: "아프리카", code: "ne", capital: "니아메이 (Niamey)", region: "서아프리카 (아프리카), 수도는 니아메이", area: "1,267,000 km² (세계 21위)", pop: "약 2,600만 명 (세계 55위)", gdp: "우라늄 자원 국가", cities: "니아메이, 진더", famous: "사하라 사막 및 우라늄", history: "내륙 사막 지역의 국가입니다.", relation: "자원 협력국입니다." },
            { country: "차드", engName: "Chad", continent: "아프리카", code: "td", capital: "엔자메나 (N'Djamena)", region: "중앙아프리카 (아프리카), 수도는 엔자메나", area: "1,284,000 km² (세계 20위)", pop: "약 1,700만 명 (세계 69위)", gdp: "중앙아프리카 내륙국", cities: "엔자메나, 큭도", famous: "차드 호수", history: "사막과 사바나 지역이 공존합니다.", relation: "협력 관계입니다." },
            { country: "소말리아", engName: "Somalia", continent: "아프리카", code: "so", capital: "모디가슈 (Mogadishu)", region: "동아프리카 (아프리카), 수도는 모디가슈", area: "637,657 km² (세계 42위)", pop: "약 1,700만 명 (세계 68위)", gdp: "아프리카의 뿔 국가", cities: "모디가슈, 하르게이사", famous: "아프리카의 뿔 해안선", history: "고대 향신료 무역항이었습니다.", relation: "국제 사회 지원 대상입니다." },
            { country: "지부티", engName: "Djibouti", continent: "아프리카", code: "dj", capital: "지부티 (Djibouti)", region: "동아프리카 (아프리카), 수도는 지부티", area: "23,200 km² (세계 147위)", pop: "약 110만 명 (세계 159위)", gdp: "군사·물류 요충지", cities: "지부티", famous: "홍해 입구 해상 요충지", history: "글로벌 군사 및 물류 거점입니다.", relation: "청해부대 파견 등 인연이 있습니다." },
            { country: "에리트레아", engName: "Eritrea", continent: "아프리카", code: "er", capital: "아스마라 (Asmara)", region: "동아프리카 (아프리카), 수도는 아스마라", area: "117,600 km² (세계 99위)", pop: "약 360만 명 (세계 131위)", gdp: "홍해 연안 국가", cities: "아스마라, 마사와", famous: "이탈리아풍 아스마라 건축", history: "에티오피아와 분리 독립했습니다.", relation: "외교 관계입니다." },
            { country: "남수단", engName: "South Sudan", continent: "아프리카", code: "ss", capital: "주바 (Juba)", region: "동아프리카 (아프리카), 수도는 주바", area: "619,745 km² (세계 43위)", pop: "약 1,100만 명 (세계 80위)", gdp: "신생 독립 국가", cities: "주바, 말칼", famous: "나일강 백나일 유역", history: "2011년 수단으로부터 독립했습니다.", relation: "한빛부대 파견 등 평화 유지 인연이 있습니다." },
            { country: "시에라리온", engName: "Sierra Leone", continent: "아프리카", code: "sl", capital: "프리타운 (Freetown)", region: "서아프리카 (아프리카), 수도는 프리타운", area: "71,740 km² (세계 118위)", pop: "약 840만 명 (세계 103위)", gdp: "서아프리카 해안 국가", cities: "프리타운, 보", famous: "아름다운 해변과 다이아몬드", history: "해방 노예들이 정착한 역사가 있습니다.", relation: "개발 협력국입니다." },
            { country: "라이베리아", engName: "Liberia", continent: "아프리카", code: "lr", capital: "몬로비아 (Monrovia)", region: "서아프리카 (아프리카), 수도는 몬로비아", area: "111,369 km² (세계 103위)", pop: "약 530만 명 (세계 115위)", gdp: "서아프리카 공화국", cities: "몬로비아, 그마바", famous: "아프리카 최초의 공화국", history: "미국 해방 노예들에 의해 세워졌습니다.", relation: "우호 관계입니다." },
            { country: "기니", engName: "Guinea", continent: "아프리카", code: "gn", capital: "코나크리 (Conakry)", region: "서아프리카 (아프리카), 수도는 코나크리", area: "245,857 km² (세계 77위)", pop: "약 1,380만 명 (세계 72위)", gdp: "보스사이트 광물 부국", cities: "코나크리, 칸칸", famous: "보스사이트 및 철광석", history: "서아프리카의 자원 부국입니다.", relation: "자원 협력국입니다." },
            { country: "토고", engName: "Togo", continent: "아프리카", code: "tg", capital: "로메 (Lome)", region: "서아프리카 (아프리카), 수도는 로메", area: "56,785 km² (세계 126위)", pop: "약 880만 명 (세계 101위)", gdp: "서아프리카 무역 항구국", cities: "로메, 소코데", famous: "서아프리카 해변 시장", history: "프랑스 식민지에서 독립했습니다.", relation: "교류 협력국입니다." },
            { country: "베냉", engName: "Benin", continent: "아프리카", code: "bj", capital: "포르토노보 (Porto-Novo)", region: "서아프리카 (아프리카), 수도는 포르토노보", area: "112,622 km² (세계 101위)", pop: "약 1,330만 명 (세계 75위)", gdp: "서아프리카 농업 국가", cities: "포르토노보, 코토누", famous: "다호메이 왕국의 역사", history: "고대 왕국의 역사를 간직하고 있습니다.", relation: "협력 관계입니다." },
            { country: "부룬디", engName: "Burundi", continent: "아프리카", code: "bi", capital: "기테가 (Gitega)", region: "동아프리카 (아프리카), 수도는 기테가", area: "27,834 km² (세계 142위)", pop: "약 1,280만 명 (세계 76위)", gdp: "동아프리카 내륙국", cities: "기테가, 부줌부라", famous: "탕가니카 호수", history: "왕정에서 공화국으로 전환되었습니다.", relation: "개발 협력국입니다." },
            { country: "말라위", engName: "Malawi", continent: "아프리카", code: "mw", capital: "릴롱궤 (Lilongwe)", region: "동남아프리카 (아프리카), 수도는 릴롱궤", area: "118,484 km² (세계 98위)", pop: "약 2,040만 명 (세계 63위)", gdp: "농업 중심 내륙국", cities: "릴롱궤, 블랜타이어", famous: "말라위 호수 (별칭: 별들의 호수)", history: "따뜻한 심장의 나라로 불립니다.", relation: "농업 ODA 협력국입니다." },
            { country: "레소토", engName: "Lesotho", continent: "아프리카", code: "ls", capital: "마세루 (Maseru)", region: "남아프리카 (아프리카), 수도는 마세루", area: "30,355 km² (세계 137위)", pop: "약 230만 명 (세계 146위)", gdp: "산악 왕국", cities: "마세루", famous: "하늘 위의 왕국 (고산 지대)", history: "영국 보호령에서 독립한 왕국입니다.", relation: "우호 관계입니다." },
            { country: "에스와티니", engName: "Eswatini", continent: "아프리카", code: "sz", capital: "음바바네 (Mbabane)", region: "남아프리카 (아프리카), 수도는 음바바네", area: "17,364 km² (세계 156위)", pop: "약 120만 명 (세계 161위)", gdp: "남부 아프리카 왕국", cities: "음바바네, 만지니", famous: "아프리카 전통 왕실 문화", history: "절대 군주제 형태를 유지하고 있습니다.", relation: "외교 관계입니다." },
            { country: "카보베르데", engName: "Cape Verde", continent: "아프리카", code: "cv", capital: "프라이아 (Praia)", region: "서아프리카 (아프리카), 수도는 프라이아", area: "4,033 km² (세계 171위)", pop: "약 59만 명 (세계 170위)", gdp: "대서양 섬나라", cities: "프라이아, 민델루", famous: "대서양 화산섬 및 음악", history: "포르투갈계 영향이 공존하는 섬나라입니다.", relation: "우호 교류국입니다." },

            // --- 북아메리카 (약 23개국) ---
            { country: "미국", engName: "United States", continent: "북아메리카", code: "us", capital: "워싱턴 D.C. (Washington D.C.)", region: "북아메리카 (북아메리카), 수도는 워싱턴 D.C.", area: "9,833,517 km² (세계 4위)", pop: "약 3억 3,000만 명 (세계 3위)", gdp: "세계 1위 경제·군사 대국", cities: "뉴욕, 로스앤젤레스, 시카고", famous: "할리우드 및 실리콘밸리", history: "1776년 독립 전쟁으로 건국되었습니다.", relation: "한미동맹을 바탕으로 한 핵심 동맹국입니다." },
            { country: "캐나다", engName: "Canada", continent: "북아메리카", code: "ca", capital: "오타와 (Ottawa)", region: "북아메리카 (북아메리카), 수도는 오타와", area: "9,984,670 km² (세계 2위)", pop: "약 3,900만 명 (세계 38위)", gdp: "세계 2위 영토 선진 경제", cities: "토론토, 밴쿠버, 몬트리올", famous: "단풍나무 및 청정 자연", history: "평화적인 자치권 확대로 성장했습니다.", relation: "한국전쟁 참전국 및 FTA 체결국입니다." },
            { country: "멕시코", engName: "Mexico", continent: "북아메리카", code: "mx", capital: "멕시코시티 (Mexico City)", region: "북아메리카 (북아메리카), 수도는 멕시코시티", area: "1,964,375 km² (세계 13위)", pop: "약 1억 2,800만 명 (세계 10위)", gdp: "라틴아메리카 제조 대국", cities: "멕시코시티, 과달라하라, 몬테레이", famous: "마야·아스텍 문명 및 타코", history: "인디언과 스페인 문화가 융합되었습니다.", relation: "자동차 및 제조업 중심의 긴밀한 교류국입니다." },
            { country: "쿠바", engName: "Cuba", continent: "북아메리카", code: "cu", capital: "아바나 (Havana)", region: "카리브해 (북아메리카), 수도는 아바나", area: "109,884 km² (세계 105위)", pop: "약 1,100만 명 (세계 85위)", gdp: "카리브해 사회주의 경제", cities: "아바나, 산티아고데쿠바", famous: "시가 및 클래식 카", history: "1959년 쿠바 혁명을 겪었습니다.", relation: "문화·예술적 교류가 일부 존재합니다." },
            { country: "자메이카", engName: "Jamaica", continent: "북아메리카", code: "jm", capital: "킹스턴 (Kingston)", region: "카리브해 (북아메리카), 수도는 킹스턴", area: "10,991 km² (세계 160위)", pop: "약 280만 명 (세계 138위)", gdp: "카리브해 관광 국가", cities: "킹스턴, 몬테고베이", famous: "레게 음악 및 단거리 육상", history: "1962년 영연방의 일원으로 독립했습니다.", relation: "문화 스포츠 분야 우호국입니다." },
            { country: "코스타리카", engName: "Costa Rica", continent: "북아메리카", code: "cr", capital: "산호세 (San Jose)", region: "중앙아메리카 (북아메리카), 수도는 산호세", area: "51,100 km² (세계 128위)", pop: "약 520만 명 (세계 119위)", gdp: "생태 관광 선진국", cities: "산호세", famous: "군대 폐지 및 생태 관광", history: "평화와 환경 보호의 상징입니다.", relation: "민주주의 가치를 공유하는 우방국입니다." },
            { country: "파나마", engName: "Panama", continent: "북아메리카", code: "pa", capital: "파나마시티 (Panama City)", region: "중앙아메리카 (북아메리카), 수도는 파나마시티", area: "75,417 km² (세계 117위)", pop: "약 440만 명 (세계 128위)", gdp: "물류 및 금융 요충지", cities: "파나마시티, 콜론", famous: "파나마 운하", history: "대서양과 태평양을 연결하는 운하를 개통했습니다.", relation: "글로벌 물류 및 해운 협력국입니다." },
            { country: "과테말라", engName: "Guatemala", continent: "북아메리카", code: "gt", capital: "과테말라시티 (Guatemala City)", region: "중앙아메리카 (북아메리카), 수도는 과테말라시티", area: "108,889 km² (세계 107위)", pop: "약 1,700만 명 (세계 67위)", gdp: "중미 신흥국", cities: "과테말라시티, 안티구아", famous: "마야 유적 및 커피", history: "마야 문명의 중심지였습니다.", relation: "교류 협력국입니다." },
            { country: "온두라스", engName: "Honduras", continent: "북아메리카", code: "hn", capital: "테구시갈파 (Tegucigalpa)", region: "중앙아메리카 (북아메리카), 수도는 테구시갈파", area: "112,492 km² (세계 102위)", pop: "약 1,040만 명 (세계 92위)", gdp: "중미 농업·제조업 국가", cities: "테구시갈파, 산페드로술라", famous: "마야 코판 유적", history: "스페인 식민지에서 독립했습니다.", relation: "협력 관계입니다." },
            { country: "엘살바도르", engName: "El Salvador", continent: "북아메리카", code: "sv", capital: "산살바도르 (San Salvador)", region: "중앙아메리카 (북아메리카), 수도는 산살바도르", area: "21,041 km² (세계 150위)", pop: "약 630만 명 (세계 112위)", gdp: "중미 공화국", cities: "산살바도르, 산타아나", famous: "화산 및 서핑 해변", history: "중미에서 면적이 가장 작으나 인구 밀도가 높습니다.", relation: "협력 관계입니다." },
            { country: "니카라과", engName: "Nicaragua", continent: "북아메리카", code: "ni", capital: "마나과 (Managua)", region: "중앙아메리카 (북아메리카), 수도는 마나과", area: "130,370 km² (세계 97위)", pop: "약 700만 명 (세계 108위)", gdp: "중미 농업 국가", cities: "마나과, 레온, 그라나다", famous: "니카라과 호수 및 화산", history: "중미 최대 면적의 공화국입니다.", relation: "외교 관계입니다." },
            { country: "도미니카 공화국", engName: "Dominican Republic", continent: "북아메리카", code: "do", capital: "산토도밍고 (Santo Domingo)", region: "카리브해 (북아메리카), 수도는 산토도밍고", area: "48,671 km² (세계 130위)", pop: "약 1,120만 명 (세계 78위)", gdp: "카리브해 고성장 경제", cities: "산토도밍고, 산티아고", famous: "휴양지 및 야구", history: "콜럼버스 도래 이후 최초의 유럽 정착지입니다.", relation: "관광 및 경제 교류국입니다." },
            { country: "아이티", engName: "Haiti", continent: "북아메리카", code: "ht", capital: "포르토프랭스 (Port-au-Prince)", region: "카리브해 (북아메리카), 수도는 포르토프랭스", area: "27,750 km² (세계 143위)", pop: "약 1,150만 명 (세계 77위)", gdp: "카리브해 개발도상국", cities: "포르토프랭스, 카프하이티앵", famous: "독특한 카리브 문화", history: "라틴아메리카 최초의 흑인 공화국입니다.", relation: "인도적 지원 및 협력국입니다." },
            { country: "바하마", engName: "Bahamas", continent: "북아메리카", code: "bs", capital: "나소 (Nassau)", region: "카리브해 (북아메리카), 수도는 나소", area: "13,943 km² (세계 154위)", pop: "약 40만 명 (세계 177위)", gdp: "관광 및 금융 고소득국", cities: "나소, 프리포트", famous: "청정 바다 및 휴양지", history: "대서양의 아름다운 섬나라입니다.", relation: "관광 교류국입니다." },
            { country: "벨리즈", engName: "Belize", continent: "북아메리카", code: "bz", capital: "벨모판 (Belmopan)", region: "중앙아메리카 (북아메리카), 수도는 벨모판", area: "22,966 km² (세계 149위)", pop: "약 40만 명 (세계 178위)", gdp: "중미·카리브해 국가", cities: "벨모판, 벨리즈시티", famous: "그레이트 블루 홀 및 마야 유적", history: "영국령 홍두카스에서 독립했습니다.", relation: "우호 관계입니다." },
            { country: "트리니다드 토바고", engName: "Trinidad and Tobago", continent: "북아메리카", code: "tt", capital: "포트오브스페인 (Port of Spain)", region: "카리브해 (북아메리카), 수도는 포트오브스페인", area: "5,128 km² (세계 170위)", pop: "약 150만 명 (세계 152위)", gdp: "에너지 자원 부국", cities: "포트오브스페인, 산페르난도", famous: "스틸판 음악 및 천연가스", history: "카리브해의 경제 중심지입니다.", relation: "에너지 협력국입니다." },
            { country: "바베이도스", engName: "Barbados", continent: "북아메리카", code: "bb", capital: "브리지타운 (Bridgetown)", region: "카리브해 (북아메리카), 수도는 브리지타운", area: "430 km² (세계 181위)", pop: "약 28만 명 (세계 182위)", gdp: "카리브해 금융·관광국", cities: "브리지타운", famous: "아름다운 해변 및 럼주", history: "최근 공화국으로 전환된 섬나라입니다.", relation: "우호 교류국입니다." },
            { country: "세인트루시아", engName: "Saint Lucia", continent: "북아메리카", code: "lc", capital: "캐스트리스 (Castries)", region: "카리브해 (북아메리카), 수도는 캐스트리스", area: "616 km² (세계 183위)", pop: "약 18만 명 (세계 188위)", gdp: "카리브해 관광 국가", cities: "캐스트리스", famous: "피톤 산 및 화산섬", history: "카리브해의 대표적인 휴양 섬입니다.", relation: "교류국입니다." },
            { country: "세인트빈센트 그레나디눈", engName: "Saint Vincent and the Grenadines", continent: "북아메리카", code: "vc", capital: "킹스타운 (Kingstown)", region: "카리브해 (북아메리카), 수도는 킹스타운", area: "389 km² (세계 182위)", pop: "약 10만 명 (세계 192위)", gdp: "카리브해 섬나라", cities: "킹스타운", famous: "요트 세일링 및 화산", history: "영연방의 일원입니다.", relation: "우호 관계입니다." },
            { country: "그레나다", engName: "Grenada", continent: "북아메리카", code: "gd", capital: "세인트조지스 (St. George's)", region: "카리브해 (북아메리카), 수도는 세인트조지스", area: "344 km² (세계 183위)", pop: "약 12만 명 (세계 190위)", gdp: "향신료 생산국", cities: "세인트조지스", famous: "향신료(육구) 및 해변", history: "향신료의 섬으로 불립니다.", relation: "교류국입니다." },
            { country: "앤티가 바부다", engName: "Antigua and Barbuda", continent: "북아메리카", code: "ag", capital: "세인트존스 (St. John's)", region: "카리브해 (북아메리카), 수도는 세인트존스", area: "442 km² (세계 180위)", pop: "약 9만 명 (세계 193위)", gdp: "관광 중심 섬나라", cities: "세인트존스", famous: "365개의 아름다운 해변", history: "영연방 국가입니다.", relation: "우호 관계입니다." },
            { country: "세인트키츠 네비스", engName: "Saint Kitts and Nevis", continent: "북아메리카", code: "kn", capital: "배스테어 (Basseterre)", region: "카리브해 (북아메리카), 수도는 배스테어", area: "261 km² (세계 186위)", pop: "약 4만 7천 명 (세계 194위)", gdp: "카리브해 소국", cities: "배스테어", famous: "화산섬 및 리조트", history: "아메리카 대륙에서 가장 작은 독립국입니다.", relation: "교류국입니다." },
            { country: "도미니카 연방", engName: "Dominica", continent: "북아메리카", code: "dm", capital: "로조 (Roseau)", region: "카리브해 (북아메리카), 수도는 로조", area: "751 km² (세계 177위)", pop: "약 7만 명 (세계 196위)", gdp: "자연 친화적 섬나라", cities: "로조", famous: "열대림 및 온천", history: "자연의 섬이라 불립니다.", relation: "우호 관계입니다." },

            // --- 남아메리카 (12개국) ---
            { country: "브라질", engName: "Brazil", continent: "남아메리카", code: "br", capital: "브라질리아 (Brasilia)", region: "남아메리카 (남아메리카), 수도는 브라질리아", area: "8,515,767 km² (세계 5위)", pop: "약 2억 1,500만 명 (세계 7위)", gdp: "남미 최대 경제 대국", cities: "상파울루, 리우데자네이루, 브라질리아", famous: "아마존 및 축구·삼바", history: "포르투갈어 사용 지역인 남미 최대 대국입니다.", relation: "남미 최대 경제 및 무역 파트너입니다." },
            { country: "아르헨티나", engName: "Argentina", continent: "남아메리카", code: "ar", capital: "부에노스아이레스 (Buenos Aires)", region: "남아메리카 (남아메리카), 수도는 부에노스아이레스", area: "2,780,400 km² (세계 8위)", pop: "약 4,600만 명 (세계 31위)", gdp: "남미 농축산·문화 강국", cities: "부에노스아이레스, 코르도바, 로사리오", famous: "탱고 및 소고기·와인", history: "유럽계 이민자들의 유입으로 독창적 문화를 가졌습니다.", relation: "광물 자원 및 곡물 협력국입니다." },
            { country: "칠레", engName: "Chile", continent: "남아메리카", code: "cl", capital: "산티아고 (Santiago)", region: "남아메리카 (남아메리카), 수도는 산티아고", area: "756,102 km² (세계 38위)", pop: "약 1,950만 명 (세계 65위)", gdp: "안데스 선진 경제", cities: "산티아고, 발파라이소, 콘셉시온", famous: "구리 광산 및 와인", history: "군사 독재를 극복하고 민주주의를 이뤘습니다.", relation: "아시아 최초 FTA 체결국입니다." },
            { country: "콜롬비아", engName: "Colombia", continent: "남아메리카", code: "co", capital: "보고타 (Bogota)", region: "남아메리카 (남아메리카), 수도는 보고타", area: "1,141,748 km² (세계 25위)", pop: "약 5,200만 명 (세계 29위)", gdp: "안데스 역동적 신흥국", cities: "보고타, 메데진, 칼리", famous: "커피 및 에메랄드", history: "시몬 볼리바르의 활약으로 해방되었습니다.", relation: "중남미 유일의 한국전쟁 참전국 혈맹입니다." },
            { country: "페루", engName: "Peru", continent: "남아메리카", code: "pe", capital: "리마 (Lima)", region: "남아메리카 (남아메리카), 수도는 리마", area: "1,285,216 km² (세계 20위)", pop: "약 3,400만 명 (세계 42위)", gdp: "광물·고대 문명 국가", cities: "리마, 쿠스코, 아레키파", famous: "마추픽추 및 잉카 제국", history: "잉카 제국의 본고장입니다.", relation: "FTA 체결국 및 광물 협력국입니다." },
            { country: "베네수엘라", engName: "Venezuela", continent: "남아메리카", code: "ve", capital: "카라카스 (Caracas)", region: "남아메리카 (남아메리카), 수도는 카라카스", area: "916,445 km² (세계 33위)", pop: "약 2,800만 명 (세계 51위)", gdp: "원유 매장 자원 국가", cities: "카라카스, 마라카이보", famous: "엔젤 폭포 및 원유", history: "시몬 볼리바르의 탄생지입니다.", relation: "제한적인 외교 관계입니다." },
            { country: "우루과이", engName: "Uruguay", continent: "남아메리카", code: "uy", capital: "몬테비데오 (Montevideo)", region: "남아메리카 (남아메리카), 수도는 몬테비데오", area: "176,215 km² (세계 89위)", pop: "약 340만 명 (세계 135위)", gdp: "안정된 남미 선진 경제", cities: "몬테비데오, 살토", famous: "청정 축산물 및 해변", history: "남미에서 가장 안정되고 민주적인 국가입니다.", relation: "농축산물 교류 우방국입니다." },
            { country: "볼리비아", engName: "Bolivia", continent: "남아메리카", code: "bo", capital: "수크레 (Sucre) / 라파스 (La Paz)", region: "남아메리카 (남아메리카), 수도는 수크레", area: "1,098,581 km² (세계 28위)", pop: "약 1,200만 명 (세계 81위)", gdp: "안데스 자원 국가", cities: "라파스, 산타크루스, 수크레", famous: "우유니 소금사막", history: "안데스 산맥의 내륙 국가입니다.", relation: "리튬 등 자원 협력국입니다." },
            { country: "에콰도르", engName: "Ecuador", continent: "남아메리카", code: "ec", capital: "키토 (Quito)", region: "남아메리카 (남아메리카), 수도는 키토", area: "283,561 km² (세계 72위)", pop: "약 1,800만 명 (세계 66위)", gdp: "적도 위치 신흥국", cities: "키토, 과야킬", famous: "갈라파고스 제도 및 바나나", history: "적도가 지나는 안데스 국가입니다.", relation: "자원 및 교류국입니다." },
            { country: "파라과이", engName: "Paraguay", continent: "남아메리카", code: "py", capital: "아순시온 (Asuncion)", region: "남아메리카 (남아메리카), 수도는 아순시온", area: "406,752 km² (세계 59위)", pop: "약 680만 명 (세계 106위)", gdp: "남미 내륙 농축산국", cities: "아순시온, 시우다드델에스테", famous: "이타이푸 댐 및 마테 차", history: "남미의 심장부에 위치한 내륙국입니다.", relation: " tradicional 우방국입니다." },
            { country: "가이아나", engName: "Guyana", continent: "남아메리카", code: "gy", capital: "조지타운 (Georgetown)", region: "남아메리카 (남아메리카), 수도는 조지타운", area: "214,969 km² (세계 83위)", pop: "약 80만 명 (세계 163위)", gdp: "고성장 원유 부국", cities: "조지타운", famous: "카이투르 폭포 및 신흥 원유", history: "남미 북부의 영어 사용 국가입니다.", relation: "에너지 및 자원 협력국입니다." },
            { country: "수리남", engName: "Suriname", continent: "남아메리카", code: "sr", capital: "파라마리보 (Paramaribo)", region: "남아메리카 (남아메리카), 수도는 파라마리보", area: "163,820 km² (세계 91위)", pop: "약 60만 명 (세계 168위)", gdp: "남미 카리브해 문화 국가", cities: "파라마리보", famous: "열대우림 및 다문화 사회", history: "네덜란드 식민지에서 독립했습니다.", relation: "교류 협력국입니다." },

            // --- 오세아니아 (약 14개국) ---
            { country: "호주", engName: "Australia", continent: "오세아니아", code: "au", capital: "캔버라 (Canberra)", region: "오세아니아 (오세아니아), 수도는 캔버라", area: "7,692,024 km² (세계 6위)", pop: "약 2,600만 명 (세계 56위)", gdp: "세계 10위권 선진 대륙 국가", cities: "시드니, 멜버른, 브리즈번, 캔버라", famous: "시드니 오페라 하우스 및 캥거루", history: "영국의 유배 식민지에서 독립적인 선진국이 되었습니다.", relation: "한국전쟁 참전국 및 핵심 전략 동반자입니다." },
            { country: "뉴질랜드", engName: "New Zealand", continent: "오세아니아", code: "nz", capital: "웰링턴 (Wellington)", region: "오세아니아 (오세아니아), 수도는 웰링턴", area: "268,021 km² (세계 75위)", pop: "약 510만 명 (세계 123위)", gdp: "청정 자연 선진국", cities: "오클랜드, 웰링턴, 크라이스트처치", famous: "마오리족 문화 및 반지의 제왕 촬영지", history: "와이탕이 조약을 계기로 영연방에 편입되었습니다.", relation: "한국전쟁 참전국 및 FTA 체결 우방입니다." },
            { country: "피지", engName: "Fiji", continent: "오세아니아", code: "fj", capital: "수바 (Suva)", region: "오세아니아 (오세아니아), 수도는 수바", area: "18,272 km² (세계 154위)", pop: "약 90만 명 (세계 161위)", gdp: "남태평양 관광 경제", cities: "수바, 나디", famous: "남태평양 휴양지 및 산호초", history: "1970년 영국의 통치에서 독립했습니다.", relation: "기후변화 대응 및 해양 수산 협력국입니다." },
            { country: "파푸아뉴기니", engName: "Papua New Guinea", continent: "오세아니아", code: "pg", capital: "포트모르즈비 (Port Moresby)", region: "오세아니아 (오세아니아), 수도는 포트모르즈비", area: "462,840 km² (세계 54위)", pop: "약 1,000만 명 (세계 92위)", gdp: "지하자원 풍부한 국가", cities: "포트모르즈비, 레이", famous: "다양한 원주민 문화 및 천연자원", history: "1975년 독립했습니다.", relation: "자원 개발 및 인프라 협력국입니다." },
            { country: "솔로몬 제도", engName: "Solomon Islands", continent: "오세아니아", code: "sb", capital: "호니아라 (Honiara)", region: "오세아니아 (오세아니아), 수도는 호니아라", area: "28,896 km² (세계 140위)", pop: "약 70만 명 (세계 166위)", gdp: "태평양 도서국", cities: "호니아라", famous: "태평양 전쟁 유적 및 산호섬", history: "태평양의 아름다운 섬나라입니다.", relation: "도서국 협력 대상입니다." },
            { country: "바누아투", engName: "Vanuatu", continent: "오세아니아", code: "vu", capital: "포트빌라 (Port Vila)", region: "오세아니아 (오세아니아), 수도는 포트빌라", area: "12,189 km² (세계 159위)", pop: "약 32만 명 (세계 181위)", gdp: "남태평양 섬나라", cities: "포트빌라", famous: "화산섬 및 스쿠버다이빙", history: "영국과 프랑스의 공동 통치를 거쳤습니다.", relation: "협력 관계입니다." },
            { country: "사모아", engName: "Samoa", continent: "오세아니아", code: "ws", capital: "아피아 (Apia)", region: "오세아니아 (오세아니아), 수도는 아피아", area: "2,842 km² (세계 174위)", pop: "약 22만 명 (세계 183위)", gdp: "폴리네시아 섬나라", cities: "아피아", famous: "폴리네시아 문화 및 자연", history: "태평양의 독립된 섬나라입니다.", relation: "교류국입니다." },
            { country: "통가", engName: "Tonga", continent: "오세아니아", code: "to", capital: "누쿠알로파 (Nuku'alofa)", region: "오세아니아 (오세아니아), 수도는 누쿠알로파", area: "747 km² (세계 178위)", pop: "약 10만 명 (세계 191위)", gdp: "태평양 왕정 국가", cities: "누쿠알로파", famous: "남태평양 전통 왕국", history: "태평양에서 유일하게 왕조를 유지합니다.", relation: "우호 관계입니다." },
            { country: "미크로네시아", engName: "Micronesia", continent: "오세아니아", code: "fm", capital: "팔리키르 (Palikir)", region: "오세아니아 (오세아니아), 수도는 팔리키르", area: "702 km² (세계 179위)", pop: "약 11만 명 (세계 189위)", gdp: "태평양 섬나라", cities: "팔리키르, 웨논", famous: "산호초 및 바다", history: "여러 섬들로 이루어진 연방국입니다.", relation: "협력 관계입니다." },
            { country: "팔라우", engName: "Palau", continent: "오세아니아", code: "pw", capital: "은글루무드 (Ngerulmud)", region: "오세아니아 (오세아니아), 수도는 은글루무드", area: "459 km² (세계 179위)", pop: "약 1만 8천 명 (세계 197위)", gdp: "관광 휴양 섬나라", cities: "코로르, 은글루무드", famous: "록 아일랜드 및 다이빙 명소", history: "청정 자연환경으로 유명합니다.", relation: "관광 및 우호 교류국입니다." },
            { country: "마셜 제도", engName: "Marshall Islands", continent: "오세아니아", code: "mh", capital: "마주로 (Majuro)", region: "오세아니아 (오세아니아), 수도는 마주로", area: "181 km² (세계 187위)", pop: "약 4만 명 (세계 195위)", gdp: "태평양 섬나라", cities: "마주로", famous: "환상산호초 아일랜드", history: "태평양의 산호 환상섬들로 구성됩니다.", relation: "협력 관계입니다." },
            { country: "키리바시", engName: "Kiribati", continent: "오세아니아", code: "ki", capital: "사우스타라와 (South Tarawa)", region: "오세아니아 (오세아니아), 수도는 사우스타라와", area: "811 km² (세계 176위)", pop: "약 13만 명 (세계 187위)", gdp: "적도에 걸쳐 있는 섬나라", cities: "사우스타라와", famous: "적도가 지나가는 33개의 산호섬", history: "기후변화 대응에 민감한 섬나라입니다.", relation: "협력 관계입니다." },
            { country: "투발루", engName: "Tuvalu", continent: "오세아니아", code: "tv", capital: "푸나푸티 (Funafuti)", region: "오세아니아 (오세아니아), 수도는 푸나푸티", area: "26 km² (세계 193위)", pop: "약 1만 1천 명 (세계 199위)", gdp: "태평양 소국", cities: "푸나푸티", famous: "아름다운 환초 섬", history: "세계에서 인구가 적은 독립국 중 하나입니다.", relation: "기후변화 국제 협력국입니다." },
            { country: "나우루", engName: "Nauru", continent: "오세아니아", code: "nr", capital: "야렌 (Yaren)", region: "오세아니아 (오세아니아), 수도는 야렌", area: "21 km² (세계 194위)", pop: "약 1만 2천 명 (세계 198위)", gdp: "인광석 역사 섬나라", cities: "야렌", famous: "세계에서 가장 작은 공화국 중 하나", history: "독립된 섬 공화국입니다.", relation: "우호 관계입니다." }
];

var WORLD_QUIZ_CONTINENTS = ["전체", "아시아", "유럽", "아프리카", "북아메리카", "남아메리카", "오세아니아"];
var worldQuizSettings = { quizType: "capital", continent: "전체", timeLimit: 10 };
var worldQuizRound = 1, worldQuizCorrect = 0;
var worldQuizState = {};

function initWorldQuiz() { renderWorldQuizSetup(); }

function renderWorldQuizSetup() {
    var types = [{ v: "capital", l: "수도 맞추기" }, { v: "country", l: "나라 맞추기" }];
    var times = [{ v: 10, l: "10초" }, { v: 15, l: "15초" }, { v: 20, l: "20초" }, { v: 0, l: "무제한" }];
    var html = '<div class="game-title-box">🌍 세계 나라·수도 맞추기</div>';
    html += '<div class="game-sub-desc">국기를 보고 나라나 수도를 맞혀보세요!</div>';
    html += '<div class="setup-section-label">모드</div><div class="setup-btn-group">';
    types.forEach(function (t) {
        html += '<button class="setup-btn' + (worldQuizSettings.quizType === t.v ? ' active' : '') + '" onclick="setWorldQuizType(\'' + t.v + '\')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">대륙</div><div class="setup-btn-group">';
    WORLD_QUIZ_CONTINENTS.forEach(function (c) {
        html += '<button class="setup-btn' + (worldQuizSettings.continent === c ? ' active' : '') + '" onclick="setWorldQuizContinent(\'' + c + '\')">' + c + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (worldQuizSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setWorldQuizTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startWorldQuizSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setWorldQuizType(v) { worldQuizSettings.quizType = v; renderWorldQuizSetup(); }
function setWorldQuizContinent(v) { worldQuizSettings.continent = v; renderWorldQuizSetup(); }
function setWorldQuizTimeLimit(v) { worldQuizSettings.timeLimit = v; renderWorldQuizSetup(); }
function startWorldQuizSession() { worldQuizRound = 1; worldQuizCorrect = 0; generateWorldQuizRound(); }

function getWorldQuizFilteredList() {
    if (worldQuizSettings.continent === "전체") return WORLD_QUIZ_LIST;
    var filtered = WORLD_QUIZ_LIST.filter(function (it) { return it.continent === worldQuizSettings.continent; });
    return filtered.length >= 3 ? filtered : WORLD_QUIZ_LIST;
}

function generateWorldQuizRound() {
    var pool = getWorldQuizFilteredList();
    var correct = pickRandom(pool);
    var isCapitalMode = worldQuizSettings.quizType === "capital";
    var key = isCapitalMode ? "capital" : "country";
    var wrongPool = pool.filter(function (it) { return it[key] !== correct[key]; });
    if (wrongPool.length < 2) {
        wrongPool = WORLD_QUIZ_LIST.filter(function (it) { return it[key] !== correct[key]; });
    }
    var wrongs = pickN(wrongPool, 2);
    var raw = [{ value: correct[key], isCorrect: true }];
    wrongs.forEach(function (w) { if (w) raw.push({ value: w[key], isCorrect: false }); });
    // 표시 값이 같은 보기 제거(정답 우선). 3개 미만이면 목록에서 채운다.
    var byVal = {};
    raw.forEach(function (o) { if (!byVal[o.value] || o.isCorrect) byVal[o.value] = o; });
    var uniq = Object.keys(byVal).map(function (k) { return byVal[k]; });
    if (uniq.length < 3) {
        var fill = shuffleArray(WORLD_QUIZ_LIST.slice());
        for (var fi = 0; fi < fill.length && uniq.length < 3; fi++) {
            var v = fill[fi][key];
            if (!byVal[v]) { byVal[v] = { value: v, isCorrect: false }; uniq.push(byVal[v]); }
        }
    }
    var options = shuffleArray(uniq);
    worldQuizState = {
        correct: correct, options: options, answered: false, hintShown: false, selectedValue: null,
        timeLimit: worldQuizSettings.timeLimit, timeLeft: worldQuizSettings.timeLimit, timerId: null, timedOut: false
    };
    renderWorldQuizQuiz();
    if (worldQuizState.timeLimit > 0) { startWorldQuizTimer(); }
}
function retryWorldQuizRound() {
    worldQuizState.answered = false;
    worldQuizState.hintShown = false;
    worldQuizState.timedOut = false;
    worldQuizState.selectedValue = null;
    worldQuizState.timeLeft = worldQuizState.timeLimit;
    renderWorldQuizQuiz();
    if (worldQuizState.timeLimit > 0) { startWorldQuizTimer(); }
}
function nextWorldQuizRound() { worldQuizRound++; generateWorldQuizRound(); }

function startWorldQuizTimer() {
    var bar = document.getElementById('worldQuizTimerBar');
    if (bar) bar.style.width = (worldQuizState.timeLeft / worldQuizState.timeLimit * 100) + '%';
    worldQuizState.timerId = setInterval(function () {
        worldQuizState.timeLeft -= 0.1;
        var b = document.getElementById('worldQuizTimerBar');
        if (b) b.style.width = Math.max(0, worldQuizState.timeLeft / worldQuizState.timeLimit * 100) + '%';
        if (worldQuizState.timeLeft <= 0) { handleWorldQuizTimeout(); }
    }, 100);
    activeTimers.push(worldQuizState.timerId);
}
function handleWorldQuizTimeout() {
    if (worldQuizState.timerId) { clearInterval(worldQuizState.timerId); worldQuizState.timerId = null; }
    choiceTimeout();
}
function toggleWorldQuizHint() {
    if (worldQuizState.answered) return;
    worldQuizState.hintShown = !worldQuizState.hintShown;
    renderWorldQuizQuiz();
}
function worldQuizChoiceCfg() {
    var key = worldQuizSettings.quizType === "capital" ? "capital" : "country";
    var ans = worldQuizState.correct[key];
    return {
        msgId: 'worldQuizMsg',
        ok: '🎉 정답이에요! "' + ans + '"',
        bad: '아쉬워요! 정답은 "' + ans + '" 였어요.',
        timeout: '⏰ 시간이 다 됐어요! 정답은 "' + ans + '" 였어요.',
        onPick: function () { if (worldQuizState.timerId) { clearInterval(worldQuizState.timerId); worldQuizState.timerId = null; } },
        rerender: function (pickedIdx) {
            worldQuizState.answered = true;
            worldQuizState.selectedValue = (pickedIdx >= 0 && worldQuizState.options[pickedIdx]) ? worldQuizState.options[pickedIdx].value : null;
            renderWorldQuizQuiz();
        },
        onCorrect: function () { worldQuizCorrect++; },
        next: 'nextWorldQuizRound()', retry: 'retryWorldQuizRound()', home: 'renderWorldQuizSetup()',
        failStyle: 'retryHome'
    };
}
function buildWorldQuizInfoHtml(data) {
    var relationHtml = data.relation ? '<br><strong>한국과의 관계:</strong> ' + data.relation : '';
    return '<strong>🌍 ' + data.country + ' (' + data.engName + ')</strong><br>' +
        '<strong>수도:</strong> ' + data.capital + '<br>' +
        '<strong>지리:</strong> ' + data.region + '<br>' +
        '<strong>면적:</strong> ' + data.area + '<br>' +
        '<strong>인구:</strong> ' + data.pop + '<br>' +
        '<strong>경제:</strong> ' + data.gdp + '<br>' +
        '<strong>주요 도시:</strong> ' + data.cities + '<br>' +
        '<strong>특징:</strong> 주로 ' + data.famous + '(으)로 유명합니다.<br>' +
        '<strong>역사:</strong> ' + data.history + relationHtml;
}
// 국기 이미지(flagcdn.com)는 외부 리소스라 오프라인/네트워크 차단 시 로드에 실패할 수 있다.
// 그럴 때 게임이 멈추지 않도록 국가 코드 텍스트 박스로 대체한다.
function worldQuizFlagError(img) {
    if (!img) return;
    img.onerror = null;
    var code = (img.getAttribute('data-code') || '').toUpperCase();
    var box = document.createElement('div');
    box.textContent = code || '국기';
    box.style.cssText = 'display:flex; align-items:center; justify-content:center; min-height:120px; font-size:2.2rem; font-weight:800; letter-spacing:0.18em; color:#64748b; background:#f1f5f9; border-radius:0.5rem;';
    if (img.parentNode) { img.parentNode.replaceChild(box, img); }
}

function renderWorldQuizQuiz() {
    var isCapitalMode = worldQuizSettings.quizType === "capital";
    var data = worldQuizState.correct;
    var html = '<div class="game-title-box">🌍 세계 나라·수도 맞추기</div>';
    html += '<div class="game-sub-desc">' + (isCapitalMode ? '이 나라의 수도는 어디일까요?' : '어느 나라의 국기일까요?') + '</div>';
    html += '<div class="status-row"><div>' + worldQuizRound + '라운드</div><div>정답: ' + worldQuizCorrect + ' / ' + (worldQuizRound - 1) + '</div></div>';
    if (worldQuizState.timeLimit > 0 && !worldQuizState.answered) {
        html += '<div class="timer-container"><div class="timer-bar" id="worldQuizTimerBar" style="width:' + (worldQuizState.timeLeft / worldQuizState.timeLimit * 100) + '%;"></div></div>';
    }
    html += '<div class="worldquiz-flag-box"><img src="https://flagcdn.com/w320/' + data.code + '.png" alt="국기" loading="lazy" data-code="' + data.code + '" onerror="worldQuizFlagError(this)"></div>';
    if (isCapitalMode) {
        html += '<div class="game-sub-desc" style="font-weight:700; color:var(--text-main); font-size:1rem;">' + data.country + ' (' + data.engName + ')</div>';
    }
    if (worldQuizState.timedOut) {
        html += '<div class="msg-box bad" style="display:block;">⏰ 시간이 다 됐어요! 정답은 "' + (isCapitalMode ? data.capital : data.country) + '" 였어요.</div>';
    }
    if (!isCapitalMode && !worldQuizState.answered) {
        html += '<button class="action-btn secondary" style="width:100%;" onclick="toggleWorldQuizHint()">💡 힌트 보기</button>';
    }
    if (worldQuizState.hintShown && !worldQuizState.answered) {
        html += '<div class="msg-box" style="display:block; background:#f5f3ff; border-color:#c4b5fd; color:#5b21b6;">' + data.famous + '</div>';
    }
    if (worldQuizState.answered) {
        html += '<div class="msg-box" style="display:block; background:#f8fafc; border-color:#e5e7eb; text-align:left;">' + buildWorldQuizInfoHtml(data) + '</div>';
    }
    html += '<div class="options-grid single-col">';
    var correctIdx = -1;
    worldQuizState.options.forEach(function (opt, idx) {
        if (opt.isCorrect) correctIdx = idx;
        var cls = 'opt-btn text-opt';
        if (worldQuizState.answered) {
            if (opt.isCorrect) cls += ' correct';
            else if (opt.value === worldQuizState.selectedValue) cls += ' wrong';
        }
        html += '<button class="' + cls + '" ' + (worldQuizState.answered ? 'disabled' : '') + ' onclick="choiceSubmit(' + idx + ')">' + opt.value + '</button>';
    });
    html += '</div>';
    html += '<div id="worldQuizMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
    if (!worldQuizState.answered) { choiceBegin(correctIdx, worldQuizChoiceCfg()); }
}

GAME_INIT_FNS.worldQuiz = initWorldQuiz;
