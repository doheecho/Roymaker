// ===================== 한글: 고사성어/속담 맞추기 =====================
var IDIOM_LIST = [
    { title: "일석이조", desc: "돌 하나로 새 두 마리를 잡는다", famous: "한 번의 행동으로 두 가지 이익을 얻을 때 씁니다.", history: "서양의 격언에서 유래한 표현입니다." },
    { title: "새옹지마", desc: "인생의 길흉화복은 예측할 수 없다", famous: "나쁜 일이 좋은 일이 되기도 하고, 좋은 일이 나쁜 일이 되기도 합니다.", history: "중국 변방 노인의 일화에서 전해집니다." },
    { title: "화룡점정", desc: "용을 그린 후 마지막에 눈을 그려 넣는다", famous: "가장 중요한 부분을 완성하여 훌륭하게 만든다는 뜻입니다.", history: "장승요의 고화기(서화 이야기)에서 유래했습니다." },
    { title: "청출어람", desc: "쪽빛에서 났지만 쪽빛보다 더 푸르다", famous: "제자가 스승보다 더 뛰어남을 비유합니다.", history: "순자의 권학편에 나오는 말입니다." },
    { title: "절치부심", desc: "이를 갈고 마음을 썩이며 벼른다", famous: "매우 분하고 슬퍼서 마음을 단단히 먹을 때 씁니다.", history: "실패를 딛고 일어설 때 자주 쓰입니다." },
    { title: "권토중래", desc: "흙먼지를 일으키며 다시 쳐들어온다", famous: "한번 실패한 사람이 힘을 길러 다시 덤벼들 때 씁니다.", history: "패배를 딛고 재기하는 모습입니다." },
    { title: "괄목상대", desc: "눈을 비비고 상대의 실력을 다시 본다", famous: "상대의 실력이 크게 늘어 깜짝 놀랄 때 씁니다.", history: "여몽의 고사에서 유래했습니다." },
    { title: "교언영색", desc: "말을 교묘하게 하고 얼굴색을 꾸민다", famous: "아첨하는 말과 꾸민 표정으로 남을 속이려 하는 태도입니다.", history: "논어에 등장하는 경계의 말입니다." },
    { title: "구사일생", desc: "아홉 번 죽을 뻔하다가 한 번 살아난다", famous: "죽을 고비를 무사히 넘기고 겨우 살아났을 때 씁니다.", history: "어려운 역경을 이겨내는 표현입니다." },
    { title: "군계일학", desc: "닭 무리 속에 낀 한 마리의 학이다", famous: "많은 사람 가운데서 가장 뛰어난 사람을 비유합니다.", history: "남보다 월등히 뛰어난 재능을 뜻합니다." },
    { title: "기사회생", desc: "죽을 뻔하다가 다시 살아난다", famous: "거의 망해가던 일이 다시 살아나게 되었을 때 씁니다.", history: "절체절명의 순간에서 벗어나는 것입니다." },
    { title: "당랑거철", desc: "사마귀가 수레바퀴를 막아선다", famous: "자기 분수도 모르고 강한 상대에게 덤비는 어리석음을 뜻합니다.", history: "장자의 이야기에서 유래했습니다." },
    { title: "대기만성", desc: "큰 그릇은 늦게 만들어진다", famous: "큰 인물이 되려면 많은 시간과 노력이 필요하다는 뜻입니다.", history: "노자의 사상에서 비롯되었습니다." },
    { title: "도청도설", desc: "길거리에서 떠도는 소문이다", famous: "길에서 듣고 길에서 말하는 근거 없는 소문을 이릅니다.", history: "논어에 나오는 표현입니다." },
    { title: "동고동락", desc: "고통과 즐거움을 함께 나눈다", famous: "괴로울 때나 즐거울 때나 언제나 함께함을 뜻합니다.", history: "진정한 동반자 관계를 말합니다." },
    { title: "막무가내", desc: "어찌할 도리가 없고 고집이 아주 세다", famous: "도무지 말이 통하지 않고 억지를 부릴 때 씁니다.", history: "일상 생활에서 자주 쓰이는 성어입니다." },
    { title: "반신반의", desc: "반은 믿고 반은 의심한다", famous: "어떤 사실이 맞는지 틀린지 확신이 서지 않을 때 씁니다.", history: "마음속의 의구심을 표현합니다." },
    { title: "백발백중", desc: "쏜 화살이 백 번 모두 맞는다", famous: "계획이나 예측이 조금도 틀리지 않고 정확할 때 씁니다.", history: "명사수의 솜씨를 비유합니다." },
    { title: "사면초가", desc: "사방이 모두 적의 노래 소리로 둘러싸였다", famous: "아무에게도 도움을 받지 못하고 고립된 처지에 놓일 때 씁니다.", history: "초한지 항우의 일화에서 유래했습니다." },
    { title: "설상가상", desc: "눈 위에 또 서리가 내린다", famous: "나쁜 일 위에 또 나쁜 일이 겹쳐 일어날 때 씁니다.", history: "어려움이 가중되는 모양입니다." },
    { title: "수구초심", desc: "여우가 죽을 때 고향 쪽으로 머리를 둔다", famous: "본향을 잊지 않고 그리워하는 마음을 뜻합니다.", history: "동물의 본능에서 비유되었습니다." },
    { title: "십중팔구", desc: "열 가운데 여덟이나 아홉쯤 된다", famous: "거의 예외 없이 그렇게 될 것이라는 뜻입니다.", history: "일반적인 상황의 예측입니다." },
    { title: "심기일전", desc: "마음가짐을 새롭게 가다듬는다", famous: "과거의 일을 잊고 새로운 마음으로 다시 시작할 때 씁니다.", history: "정신을 가다듬는 행동입니다." },
    { title: "아전인수", desc: "제 논에 물 대기이다", famous: "오직 자기에게만 이롭도록 생각하거나 행동함을 뜻합니다.", history: "이기적인 태도를 비판할 때 씁니다." },
    { title: "역지사지", desc: "처지를 서로 바꾸어 생각한다", famous: "상대방의 입장에서 이해하고 생각하는 태도입니다.", history: "원만한 관계를 위한 지혜입니다." },
    { title: "오비이락", desc: "까마귀 날자 배 떨어진다", famous: "아무 관계없이 일어난 일이 우연히 겹쳐 의심을 받을 때 씁니다.", history: "억울한 상황을 비유합니다." },
    { title: "온고지신", desc: "옛것을 익혀 새것을 안다", famous: "옛 지식을 바탕으로 새로운 지혜와 도리를 배운다는 뜻입니다.", history: "논어의 가르침입니다." },
    { title: "우공이산", desc: "어리석은 영감이 산을 옮긴다", famous: "끈기 있게 꾸준히 노력하면 어떤 일이라도 이룰 수 있습니다.", history: "중국 고대 전설에서 유래했습니다." },
    { title: "유비무환", desc: "준비가 있으면 근심이 없다", famous: "사전에 철저히 준비해 두면 나중에 문제가 생기지 않습니다.", history: "서경에 나오는 교훈입니다." },
    { title: "이심전심", desc: "마음에서 마음으로 통한다", famous: "말을 하지 않아도 서로의 마음을 척척 알 수 있을 때 씁니다.", history: "깊은 신뢰 관계를 이릅니다." },
    { title: "자중지란", desc: "같은 편 안에서 일어난 싸움이다", famous: "한 조직이나 단체 안에서 서로 싸우고 분열하는 것을 뜻합니다.", history: "내부의 적을 이릅니다." },
    { title: "전화위복", desc: "화가 바뀌어 오히려 복이 된다", famous: "나쁜 일이 오히려 좋은 기회나 결과로 바뀔 때 씁니다.", history: "역경을 딛고 일어서는 지혜입니다." },
    { title: "적반하장", desc: "도둑이 오히려 매를 든다", famous: "잘못을 저지른 사람이 오히려 남을 나무랄 때 씁니다.", history: "부조리한 태도를 비판합니다." },
    { title: "조삼모사", desc: "아침에 3개, 저녁에 4개이다", famous: "당장의 차이만 알고 실속은 똑같음을 모르는 어리석음입니다.", history: "장자에 나오는 원숭이 이야기입니다." },
    { title: "좌충우돌", desc: "이리저리 부딪치며 거침없이 달린다", famous: "사방으로 마구 부딪치거나 우왕좌왕 바쁘게 움직일 때 씁니다.", history: "전투 중의 모습에서 유래했습니다." },
    { title: "주경야독", desc: "낮에는 일하고 밤에는 공부한다", famous: "어려운 환경 속에서도 꿋꿋이 배움을 이어가는 태도입니다.", history: "학문에 대한 열정을 뜻합니다." },
    { title: "죽마고우", desc: "대나무 말을 타고 놀던 오랜 친구이다", famous: "어릴 때부터 아주 친하게 지내온 오랜 친구를 뜻합니다.", history: "진한 우정의 대명사입니다." },
    { title: "지록위마", desc: "사슴을 가리켜 말이라고 우긴다", famous: "윗사람을 속이고 권세를 마음대로 휘두르는 뻔뻔함을 뜻합니다.", history: "진나라 조고의 고사에서 유래했습니다." },
    { title: "진퇴유곡", desc: "나아갈 수도 물러설 수도 없다", famous: "이러지도 저러지도 못하는 매우 어려운 처지에 빠졌을 때 씁니다.", history: "막다른 골목의 상황입니다." },
    { title: "창해일속", desc: "넓은 바다 속의 좁쌀 한 알이다", famous: "아주 크고 넓은 세상 속의 극히 보잘것없는 존재를 뜻합니다.", history: "겸손함을 나타낼 때 씁니다." },
    { title: "천고마비", desc: "하늘은 높고 말은 살찐다", famous: "가을이 오고 날씨가 맑아 온갖 곡식이 풍족해지는 시기입니다.", history: "중국 북방 민족의 침략을 경계하던 말에서 유래했습니다." },
    { title: "철면피", desc: "쇠로 만든 얼굴처럼 뻔뻔하다", famous: "부끄러움을 전혀 모르는 뻔뻔한 사람을 비유합니다.", history: "염치를 모르는 태도입니다." },
    { title: "청천벽력", desc: "맑은 하늘에 치는 날벼락이다", famous: "전혀 예상하지 못했던 갑작스럽고 큰 충격을 받았을 때 씁니다.", history: "매우 놀라운 소식을 이릅니다." },
    { title: "초지일관", desc: "처음 먹은 마음을 끝까지 밀고 나간다", famous: "처음 가졌던 결심을 끝까지 변치 않고 지켜나갈 때 씁니다.", history: "굳은 의지를 표현합니다." },
    { title: "파죽지세", desc: "대나무를 쪼개는 듯한 기세이다", famous: "거침없이 몰아치는 매우 강하고 대단한 기세를 뜻합니다.", history: "싸움이나 일에서 거침없이 승승장구할 때 씁니다." },
    { title: "형설지공", desc: "반딧불과 눈빛으로 공부한 공로이다", famous: "가난하고 어려운 환경 속에서도 굴하지 않고 열심히 공부한 보람입니다.", history: "진나라 차윤과 손강의 고사입니다." },
    { title: "각골난망", desc: "은혜를 뼈에 새겨 잊지 않는다", famous: "남에게 입은 은혜가 너무 커서 평생 잊지 않고 감사할 때 씁니다.", history: "깊은 고마움을 표현하는 성어입니다." },
    { title: "감언이설", desc: "귀가 솔깃하도록 남의 마음에 들게 꾸민 말이다", famous: "달콤한 말로 남을 꾀어 속이려는 태도입니다.", history: "교묘한 화술을 경계할 때 씁니다." },
    { title: "견물생심", desc: "물건을 보면 욕심이 생긴다", famous: "좋은 물건을 보면 그것을 갖고 싶은 욕심이 저절로 생긴다는 뜻입니다.", history: "인간의 본능적인 심리입니다." },
    { title: "고진감래", desc: "쓴 것이 다하면 단 것이 온다", famous: "고생 끝에 즐거움이 찾아온다는 뜻의 대표적인 표현입니다.", history: "역경을 참아내는 자세를 이릅니다." },
    { title: "과유불급", desc: "지나친 것은 모자란 것보다 못하다", famous: "모든 일은 정도를 지나치면 오히려 부족한 것만 못하다는 교훈입니다.", history: "논어의 중용 사상에서 유래했습니다." },
    { title: "구동존이", desc: "다른 점은 미뤄두고 공통점을 찾는다", famous: "의견 차이가 있더라도 공통된 이익을 위해 타협할 때 씁니다.", history: "외교적 협상이나 소통에서 쓰입니다." },
    { title: "구밀검복", desc: "입으로는 꿀을 뱉고 배 속에는 칼을 품었다", famous: "겉으로는 친절한 척하지만 마음속으로는 해칠 생각을 품은 사람을 뜻합니다.", history: "이중적인 인물을 비판합니다." },
    { title: "군사부일체", desc: "임금과 스승과 부모는 다 같다", famous: "예로부터 임금, 스승, 부모를 동등하게 존경해야 한다는 도덕적 가치입니다.", history: "유교적 윤리관에서 비롯되었습니다." },
    { title: "금상첨화", desc: "비단 위에 꽃을 더한다는 뜻이다", famous: "좋은 일 위에 좋은 일이 겹쳐 더욱 훌륭하게 되었을 때 씁니다.", history: "상황의 긍정적 극대화를 표현합니다." },
    { title: "금석지감", desc: "쇠와 돌처럼 세상이 변함을 느낀다", famous: "세월이 흘러 옛날과 크게 달라진 세태를 느낄 때 씁니다.", history: "변화된 세월에 대한 감회입니다." },
    { title: "기호지세", desc: "호마를 타고 달리는 기세와 같다", famous: "이미 시작하여 중간에 그만두거나 멈출 수 없는 상황을 뜻합니다.", history: "피할 수 없는 진퇴양난의 기세입니다." },
    { title: "남가일몽", desc: "한바탕 덧없는 꿈과 같다", famous: "인생의 부귀영화가 한순간의 꿈처럼 허무하다는 뜻입니다.", history: "남가기라는 고사에서 유래했습니다." },
    { title: "노심초사", desc: "마음을 태우고 속을 썩이며 애를 쓴다", famous: "어떤 일을 크게 걱정하고 염려하여 마음을 졸일 때 씁니다.", history: "깊은 노력을 기울이는 모습입니다." },
    { title: "다기망양", desc: "갈림길이 많아 양을 잃어버린다", famous: "학문의 길이 너무 넓어 오히려 진리를 찾기 어렵다는 비유입니다.", history: "열자 장부편에 나오는 이야기입니다." },
    { title: "단기지계", desc: "작은 칼로 베어내는 날카로운 지혜이다", famous: "학업이나 일을 중간에 그만두는 것은 짜던 베의 실을 끊는 것과 같다는 경계입니다.", history: "맹모삼천지교와 관련된 고사입니다." },
    { title: "대서특필", desc: "큰 글씨로 특별히 크게 적어 알린다", famous: "어떤 중요한 사실이나 뉴스를 매우 비중 있게 다룰 때 씁니다.", history: "신문이나 언론 보도에서 주로 쓰입니다." },
    { title: "동문서답", desc: "동쪽을 물었는데 서쪽을 대답한다", famous: "질문의 내용과 전혀 상관없는 엉뚱한 대답을 할 때 씁니다.", history: "소통이 어긋난 상황을 이릅니다." },
    { title: "마이동풍", desc: "말의 귀에 부는 바람과 같다", famous: "남의 조언이나 비판을 전혀 귀담아듣지 않고 흘려버릴 때 씁니다.", history: "무관심한 태도를 비유합니다." },
    { title: "맥수지탄", desc: "나라가 망함을 탄식한다", famous: "나라의 멸망이나 옛 성읍의 황폐해진 모습을 보고 슬퍼할 때 씁니다.", history: "시경의 내용에서 유래했습니다." },
    { title: "명약관화", desc: "불을 보듯 뻔하고 환하다", famous: "어떤 사실이 너무나 명백하여 의심할 여지가 없을 때 씁니다.", history: "확실한 진실을 이르는 말입니다." },
    { title: "무위도식", desc: "아무 하는 일 없이 먹기만 한다", famous: "게으르게 놀고먹으면서 아무런 사회적 기여를 하지 않는 태도입니다.", history: "나태함을 비판하는 표현입니다." },
    { title: "백문이불여일견", desc: "백 번 듣는 것이 한 번 보는 것만 못하다", famous: "말로 여러 번 듣는 것보다 직접 눈으로 확인하는 것이 확실하다는 뜻입니다.", history: "체험의 중요성을 강조합니다." },
    { title: "사리사욕", desc: "개인적인 이익과 욕심을 채운다", famous: "공공의 이익은 무시하고 오직 자신의 이기적인 욕심만 챙기는 태도입니다.", history: "비판받는 탐욕스러운 행동입니다." },
    { title: "삼고초려", desc: "초려를 세 번 찾아간다", famous: "인재를 모시기 위해 지극한 정성과 노력을 기울일 때 씁니다.", history: "삼국지 유비의 일화에서 유래했습니다." },
    { title: "상전벽해", desc: "뽕나무밭이 푸른 바다로 바뀐다", famous: "세상이 너무나 판이하게 바뀌어 옛모습을 찾아볼 수 없을 때 씁니다.", history: "세월의 거대한 변화를 이릅니다." },
    { title: "수수방관", desc: "소매에 손을 넣고 보고만 있다", famous: "어려운 일이 일어났을 때 나서서 해결하지 않고 곁에서 구경만 할 때 씁니다.", history: "무책임한 태도를 비판합니다." },
    { title: "식자우환", desc: "글을 아는 것이 오히려 근심이 된다", famous: "너무 많이 알거나 똑똑해서 오히려 화를 자초하거나 걱정이 늘어날 때 씁니다.", history: "지혜의 양면성을 이릅니다." },
    { title: "오매불망", desc: "자나 깨나 잊지 못한다", famous: "누군가나 어떤 대상을 간절하게 그리워하여 머릿속에서 떠나지 않을 때 씁니다.", history: "간절한 마음을 뜻합니다." },
    { title: "와신상담", desc: "가시나무 위에서 자고 쓸개를 핥는다", famous: "원수를 갚거나 고통스러운 역경을 이겨내려고 온갖 괴로움을 참아낼 때 씁니다.", history: "월왕 구천의 고사입니다." },
    { title: "인과응보", desc: "원인에 따라 결과가 응하여 돌아온다", famous: "좋은 일을 하면 좋은 복을 받고, 나쁜 일을 하면 그에 따르는 벌을 받게 된다는 뜻입니다.", history: "불교의 업보 사상에서 유래했습니다." },
    { title: "일취월장", desc: "날마다 나아가고 달마다 발전한다", famous: "실력이나 학업이 눈부시게 계속해서 발전해 나갈 때 씁니다.", history: "빠른 성장을 칭찬하는 표현입니다." },
    { title: "자가당착", desc: "자기의 말과 행동이 서로 모순된다", famous: "앞뒤의 논리가 서로 맞지 않아 스스로 얽매이게 되는 상황입니다.", history: "논리적 오류를 이릅니다." },
    { title: "적수공권", desc: "맨손과 빈 주먹뿐이다", famous: "아무런 도구나 재산도 없이 오직 맨몸으로 일을 시작할 때 씁니다.", history: "맨땅에 헤딩하는 상황을 뜻합니다." },
    { title: "조령모개", desc: "아침에 고쳤다가 저녁에 또 바꾼다", famous: "법이나 정책이 일관성이 없고 자주 이리저리 바뀔 때 씁니다.", history: "신뢰를 잃는 행태입니다." },
    { title: "좌우명", desc: "오른쪽에 써두고 늘 경계로 삼는 말이다", famous: "평소 삶의 지침으로 삼고 마음에 새겨두는 소중한 격언입니다.", history: "자리 가까이에 두고 보던 글귀에서 유래했습니다." },
    { title: "진수성찬", desc: "맛있는 음식을 온갖 진귀하게 차린다", famous: "상다리가 부러질 만큼 푸짐하고 맛있는 음식이 잘 차려진 밥상입니다.", history: "풍성한 상차림을 이릅니다." },
    { title: "천생연분", desc: "하늘이 맺어준 소중한 인연이다", famous: "두 사람의 만남이나 궁합이 더할 나위 없이 잘 맞을 때 씁니다.", history: "깊은 인연을 비유합니다." },
    { title: "청렴결백", desc: "마음이 맑고 욕심이 전혀 없다", famous: "재물에 대한 탐욕이 없고 품행이 매우 곧고 깨끗한 사람의 태도입니다.", history: "선비의 덕목을 이릅니다." },
    { title: "타산지석", desc: "다른 산의 돌이라도 옥을 다듬을 수 있다", famous: "다른 사람의 허물이나 나쁜 행동도 자신을 돌아보는 거울로 삼을 수 있다는 뜻입니다.", history: "시경의 구절에서 유래했습니다." },
    { title: "파안대소", desc: "얼굴을 활짝 펴고 크게 웃는다", famous: "근심을 풀고 기쁜 마음으로 껄껄 소리 내어 크게 웃을 때 씁니다.", history: "환한 미소를 표현합니다." },
    { title: "표리부동", desc: "겉모습과 속마음이 서로 다르다", famous: "말과 행동은 바른 척하지만 속으로는 음흉한 생각을 품고 있는 태도입니다.", history: "위선적인 사람을 비판합니다." },
    { title: "풍비박산", desc: "바람이 불고 우박이 흩어지듯 흩어진다", famous: "집안이나 조직이 완전히 흩어지고 무너져 내릴 때 씁니다.", history: "비참한 몰락을 뜻합니다." },
    { title: "함흥차사", desc: "한 번 떠난 뒤에 소식이 전혀 없다", famous: "심부름을 간 사람이 오래도록 돌아오지 않거나 소식이 없을 때 씁니다.", history: "조선 태조와 이성계의 일화에서 유래했습니다." },
    { title: "허풍선이", desc: "실속 없이 크게 떠벌리는 사람이다", famous: "실제 능력이나 재산은 없으면서 남 앞에서 과장되게 자랑하는 사람입니다.", history: "가벼운 언행을 이릅니다." },
    { title: "호가호위", desc: "여우가 호랑이의 위세를 빌려 호세를 부린다", famous: "남의 권력이나 든든한 배경을 믿고 젠체하며 까불 때 씁니다.", history: "전국책의 고사에서 유래했습니다." },
    { title: "환골탈태", desc: "뼈를 바꾸고 몸을 새롭게 벗어난다", famous: "예전의 낡은 틀을 완전히 깨고 훌륭하게 새롭게 변모할 때 씁니다.", history: "본질적인 혁신을 이릅니다." },
    { title: "흥진비래", desc: "즐거운 일이 다하면 슬픈 일이 온다", famous: "좋은 때가 지나가고 나면 고생스러운 시기가 찾아온다는 뜻입니다.", history: "세상의 순환을 나타냅니다." },
    { title: "각주구검", desc: "칼을 배에 새기고 검을 찾는다", famous: "시대의 변화를 깨닫지 못하고 융통성 없이 어리석게 옛것을 고집할 때 씁니다.", history: "여씨춘추에 나오는 고사입니다." },
    { title: "감탄고토", desc: "달면 삼키고 쓰면 뱉는다", famous: "자신의 비위나 이익에 따라서 사리를 분별하고 이기적으로 행동하는 태도입니다.", history: "변덕스러운 인정을 비판합니다." },
    { title: "강호제현", desc: "세상의 모든 어진 선비들이다", famous: "속세의 은둔 고수나 뛰어난 재야의 인물들을 높여 부를 때 씁니다.", history: "문학 작품 등에서 자주 쓰입니다." },
    { title: "개과천선", desc: "허물을 고쳐 착하게 된다", famous: "과거의 잘못이나 나쁜 버릇을 완전히 뉘우치고 올바른 사람으로 새롭게 태어날 때 씁니다.", history: "명심보감 등에 나오는 표현입니다." },
    { title: "견고불발", desc: "굳건하여 흔들리지 않는다", famous: "어떠한 역경이나 외압 속에서도 신념과 태도가 조금도 변하지 않을 때 씁니다.", history: "확고한 의지를 이릅니다." },
    { title: "결자해지", desc: "맺은 사람이 풀어야 한다", famous: "자기가 저지른 일이나 문제점은 스스로 책임지고 해결해야 한다는 뜻입니다.", history: "당나라 의인화된 승려의 일화에서 유래했습니다." },
    { title: "경거망동", desc: "가볍고 망령되게 움직인다", famous: "깊게 생각하거나 신중하지 못하고 경솔하게 함부로 행동할 때 씁니다.", history: "행동의 주의를 당부합니다." },
    { title: "계륵", desc: "닭의 갈비이다", famous: "이렇다 할 큰 쓸모는 없지만 버리기에는 참 아까운 애매한 것을 뜻합니다.", history: "삼국지 조조의 일화에서 유래했습니다." },
    { title: "고식지계", desc: "잠깐 동안 편안함을 취하는 꾀이다", famous: "근본적인 해결책이 아니라 임시방편으로 당장의 위기만 모면하려는 대책입니다.", history: "미봉책과 비슷한 의미입니다." },
    { title: "공명정대", desc: "마음이 공평하고 정직하여 올바르다", famous: "사심 없이 오직 원칙과 정의에 따라 공정하게 일을 처리하는 태도입니다.", history: "지도자의 필수 덕목입니다." },
    { title: "과이불개", desc: "잘못을 하고도 고치지 않는다", famous: "자신의 잘못을 알면서도 고집을 부리거나 반성하지 않는 어리석은 태도입니다.", history: "논어의 가르침입니다." },
    { title: "교학상장", desc: "가르치고 배우며 서로 성장한다", famous: "남을 가르치는 과정과 배우는 과정이 서로에게 큰 발전이 됨을 뜻합니다.", history: "예기 학기편의 가르침입니다." },
    { title: "구태의연", desc: "예전의 습관에서 벗어나지 못한다", famous: "급변하는 시대에 발맞추지 못하고 여전히 낡은 태도나 방식을 고수할 때 씁니다.", history: "답답한 답보 상태를 이릅니다." },
    { title: "근묵자흑", desc: "먹을 가까이 하면 검어진다", famous: "나쁜 사람이나 환경 가까이 지내다 보면 자신도 모르게 악에 물들게 된다는 뜻입니다.", history: "친구와 환경의 중요성입니다." },
    { title: "금과옥조", desc: "금과 옥처럼 매우 귀중한 법칙이다", famous: "절대적으로 지켜야 하거나 매우 소중하게 여기는 가르침이나 규칙입니다.", history: "귀중한 법도를 이릅니다." },
    { title: "난형난제", desc: "누가 형이고 누가 아우인지 정하기 어렵다", famous: "두 대상의 우열을 쉽게 가릴 수 없을 정도로 실력이 비슷할 때 씁니다.", history: "세설신어에서 유래했습니다." },
    { title: "내우외환", desc: "안으로는 근심이 있고 밖으로는 환난이 닥친다", famous: "집안이나 나라 내부가 어지러운 와중에 외부의 공격이나 시련까지 겹쳐 극심한 위기일 때 씁니다.", history: "총체적 난국을 이릅니다." },
    { title: "노당익장", desc: "나이가 들수록 더욱 기력이 왕성해진다", famous: "비록 연세가 많거나 오래되었음에도 불구하고 젊은이 못지않게 활기차게 활동할 때 씁니다.", history: "후한서의 기록에서 유래했습니다." },
    { title: "다정다감", desc: "정이 많고 감정이 매우 풍부하다", famous: "주변 사람들에게 따뜻한 마음을 베풀고 정을 깊이 나누는 성품을 뜻합니다.", history: "따뜻한 성품 표현입니다." },
    { title: "단사표음", desc: "도시락 밥과 표주박 물이다", famous: "가난하고 소박한 환경 속에서도 낙담하지 않고 학문에 뜻을 두는 선비의 삶입니다.", history: "논어의 안빈낙도 정신입니다." },
    { title: "대공무사", desc: "공공의 이익을 위하고 사사로움이 없다", famous: "개인의 이익을 철저히 배제하고 전체의 정의와 이익을 위해 공정하게 행동하는 태도입니다.", history: "바른 공직자의 자세입니다." },
    { title: "도탄에 빠지다", desc: "진흙에 빠지고 숯불에 탄다", famous: "백성들이 전쟁이나 가뭄으로 인해 극심한 고통과 가난 속에서 허덕일 때 씁니다.", history: "역사서의 참혹한 상황 묘사입니다." },
    { title: "동상이몽", desc: "잠은 같이 자면서 꿈은 다른 것을 꾼다", famous: "겉으로는 함께 협력하는 척하면서 속으로는 각자 딴생각이나 목적을 품고 있을 때 씁니다.", history: "서로 다른 꿍꿍이를 이릅니다." },
    { title: "막상막하", desc: "위아래를 쉽게 가리기 어렵다", famous: "실력이나 수준 차이가 거의 나지 않고 팽팽하게 맞설 때 씁니다.", history: "치열한 경쟁을 비유합니다." },
    { title: "맹모삼천", desc: "맹자의 어머니가 세 번 이사했다", famous: "자식의 교육을 위해 훌륭한 환경을 찾아 이사를 거듭했던 지극한 정성입니다.", history: "맹자의 일화에서 유래했습니다." },
    { title: "멸사봉공", desc: "개인의 사사로움을 버리고 공공을 받든다", famous: "자신의 이익이나 안위보다 전체의 이익과 사회를 위해 헌신적으로 봉사하는 태도입니다.", history: "숭고한 희생 정신입니다." },
    { title: "문경지교", desc: "목을 베어 줄 수 있는 친한 우정이다", famous: "생사를 함께할 정도로 아주 진실하고 깊은 우정을 나누는 친구 관계입니다.", history: "사기 맹상군 열전의 일화입니다." },
    { title: "반포지효", desc: "까마귀가 어미에게 먹이를 물어다 준다", famous: "자식이 커서 부모님의 은혜에 보답하고 효도를 다하는 마음을 뜻합니다.", history: "동물의 효성에서 유래했습니다." },
    { title: "방약무인", desc: "곁에 사람이 없는 것처럼 뻔뻔하다", famous: "주변의 시선이나 체면을 전혀 고려하지 않고 제멋대로 안하무인으로 행동할 때 씁니다.", history: "거만한 태도를 비판합니다." },
    { title: "백년하청", desc: "황하의 맑은 물을 백 년 동안 기다린다", famous: "오랫동안 기다려도 도무지 이루어질 가능성이 없거나 시기가 아득할 때 씁니다.", history: "중국 황하의 지리적 특성에서 유래했습니다." },
    { title: "보은망덕", desc: "은혜를 입고도 오히려 배신한다", famous: "남에게 큰 도움이나 은혜를 받고도 감사하기는커녕 오히려 배은망덕하게 행동할 때 씁니다.", history: "도덕적 지탄을 받는 행위입니다." },
    { title: "부화뇌동", desc: "주견 없이 남의 의견에 무작정 휩쓸린다", famous: "자신의 소신이나 철학 없이 남이 이끄는 대로 덩달아 휩쓸려 행동하는 태도입니다.", history: "논어의 경계 말씀입니다." },
    { title: "불원천리", desc: "먼 길을 마다하지 않고 찾아온다", famous: "거리가 아주 멀고 험준함에도 불구하고 상대를 위해 기꺼이 찾아오는 정성입니다.", history: "맹자의 사상에서 비롯되었습니다." },
    { title: "선공후사", desc: "공적인 일을 먼저 하고 사적인 일을 뒤로 미룬다", famous: "개인의 사사로운 이익보다 공공의 이익과 책임을 우선시하는 올바른 태도입니다.", history: "선비들의 행동 지침입니다." },
    { title: "설왕설래", desc: "말이 오고 가며 서로 논쟁한다", famous: "어떤 사안을 두고 여러 사람들이 찬반 양론으로 뜨겁게 의견을 주고받을 때 씁니다.", history: "치열한 토론 상황입니다." },
    { title: "수적천석", desc: "떨어지는 물방울이 돌을 뚫는다", famous: "비록 힘은 약할지라도 끈기 있게 지속하면 결국 큰 일을 이뤄낼 수 있다는 교훈입니다.", history: "꾸준한 노력의 대명사입니다." },
    { title: "시시비비", desc: "옳고 그름을 바르게 가린다", famous: "어떤 일의 잘잘못을 객관적이고 공정하게 따져서 판가름할 때 씁니다.", history: "이성적 판단 기준입니다." },
    { title: "신상필벌", desc: "공이 있는 자에게 상을 주고 죄를 지은 자에게 벌을 준다", famous: "조직이나 사회의 기강을 바로잡기 위해 상벌을 공정하고 엄격하게 집행하는 원칙입니다.", history: "한비자의 법가 사상입니다." },
    { title: "심사숙고", desc: "마음을 깊이 가다듬고 깊이 생각한다", famous: "어떤 중대한 결정을 내리기 전에 여러 번 거듭하여 매우 신중하게 생각할 때 씁니다.", history: "신중한 의사결정입니다." },
    { title: "언행일치", desc: "말과 행동이 서로 정확히 일치한다", famous: "입으로 내뱉은 약속이나 주장대로 실제로 행동과 실천이 똑같을 때 칭찬하는 말입니다.", history: "신용의 기본 덕목입니다." },
    { title: "연목구어", desc: "나무에 올라가 물고기를 구한다", famous: "방법과 수단이 완전히 틀려 애초에 절대 이룰 수 없는 허황된 일을 시도할 때 씁니다.", history: "맹자의 비유에서 유래했습니다." },
    { title: "우왕좌왕", desc: "이리저리 갈 길을 찾지 못하고 헤맨다", famous: "갑작스러운 위기나 혼란 속에서 정신을 차리지 못하고 허둥지둥할 때 씁니다.", history: "당황한 군중의 모습입니다." },
    { title: "유유상종", desc: "성향이 비슷한 사람끼리 서로 모인다", famous: "끼리끼리 놀고 성격이나 처지가 비슷한 사람들끼리 어울리게 된다는 뜻입니다.", history: "주역의 이치에서 유래했습니다." },
    { title: "자승자박", desc: "자기가 낸 꾀에 자기가 얽매인다", famous: "스스로 저지른 말이나 행동 때문에 결국 자기가 곤경에 빠지게 될 때 씁니다.", history: "스스로를 옭아매는 상황입니다." },
    { title: "주객전도", desc: "주인과 손님의 위치가 바뀐다", famous: "중요한 것과 사소한 것, 혹은 본래의 목적과 부수적인 것이 서로 뒤바뀌었을 때 씁니다.", history: "상황의 전도를 뜻합니다." },
    { title: "중구난방", desc: "여러 사람의 입을 막기 어렵다", famous: "사람들이 저마다 제각각 떠들어대어 의견을 하나로 통제하기 힘들 때 씁니다.", history: "국어의 기록에서 유래했습니다." },
    { title: "진퇴양난", desc: "나아갈 수도 물러설 수도 없다", famous: "어느 쪽으로도 해결책을 찾지 못하고 진퇴마저 막힌 매우 곤란한 처지입니다.", history: "극한의 시련을 이릅니다." },
    { title: "청산유수", desc: "푸른 산에서 흐르는 물처럼 거침없다", famous: "말을 막힘없이 유창하고 청산유수처럼 부드럽게 잘할 때 씁니다.", history: "뛰어난 언변을 찬탄합니다." },
    { title: "쾌도난마", desc: "잘 드는 칼로 얽힌 삼베를 벤다", famous: "복잡하고 어렵게 꼬인 문제를 명쾌하고 시원스럽게 순식간에 해결할 때 씁니다.", history: "북제서의 고사에서 유래했습니다." },
    { title: "한단지몽", desc: "한단의 꿈속에서 꾼 덧없는 영화이다", famous: "인생의 부귀영화가 한바탕 꿈처럼 허무하게 지나감을 비유하는 말입니다.", history: "상자기의 설화입니다." },
    { title: "허장성세", desc: "실속은 없으면서 허세를 부려 기세를 떨친다", famous: "능력도 없으면서 겉모습만 거창하게 과장하여 남을 위협하거나 뽐낼 때 씁니다.", history: "과장된 태도를 비판합니다." },
    { title: "호접지몽", desc: "장자가 나비가 된 꿈을 꾼다", famous: "나와 세상의 구별이 사라지고 만물이 하나가 되는 오묘한 경지나 꿈을 뜻합니다.", history: "장자의 제물론에서 유래했습니다." }
];
var PROVERB_LIST = [
    { title: "시작이 반이다", desc: "무슨 일이든 시작이 가장 중요하다.", famous: "무슨 일이든 시작하기가 어렵지 일단 시작하면 절반은 끝낸 것과 같습니다.", history: "조상들의 지혜가 담긴 친숙한 속담입니다." },
    { title: "백지장도 맞들면 낫다", desc: "아무리 쉬운 일도 힘을 합치면 훨씬 쉽다.", famous: "아주 가벼운 종이도 여럿이 함께 들면 훨씬 수월하다는 의미입니다.", history: "협동의 가치를 가르쳐 줍니다." },
    { title: "원숭이도 나무에서 떨어진다", desc: "아무리 달인이라도 간혹 실수할 때가 있다.", famous: "아무리 재주가 뛰어난 사람도 간혹 실수를 할 수 있으니 자만하지 말라는 뜻입니다.", history: "누구나 실수할 수 있음을 위로합니다." },
    { title: "급할수록 돌아가라", desc: "마음이 급할수록 더욱 침착하게 행동해야 한다.", famous: "일이 바쁘고 마음이 급할수록 오히려 차분하게 절차를 밟아가라는 뜻입니다.", history: "실수를 줄이는 지혜입니다." },
    { title: "고생 끝에 낙이 온다", desc: "힘든 일을 겪고 나면 반드시 즐거운 일이 찾아온다.", famous: "어려움과 고통을 잘 이겨내면 언젠가는 반드시 기쁨과 행복이 찾아옵니다.", history: "희망을 심어주는 대표 속담입니다." },
    { title: "우물 안 개구리", desc: "넓은 세상을 알지 못하고 시야가 매우 좁다.", famous: "넓은 세상의 사정을 모르고 자기만의 좁은 세계에 갇혀 지내는 사람을 이릅니다.", history: "견문을 넓혀야 함을 뜻합니다." },
    { title: "개구리 올챙이 적 생각 못 한다", desc: "과거의 어렵고 힘들었던 시절을 까마득히 잊는다.", famous: "형편이 나아진 사람이 예전에 어렵게 지내던 시절을 까마득히 잊고 잘난 체할 때 씁니다.", history: "겸손함을 가르치는 속담입니다." },
    { title: "공짜라면 양다리도 부러진다", desc: "공짜를 지나치게 좋아하면 오히려 해를 입는다.", famous: "대가를 바라지 않고 공짜로 얻으려다가 오히려 큰 손해를 입는다는 뜻입니다.", history: "지나친 욕심을 경계합니다." },
    { title: "구슬이 서 말이라도 꿰어야 보배", desc: "아무리 좋아도 실제로 쓸모 있게 만들어야 가치가 있다.", famous: "아무리 훌륭한 재주나 물건도 실제로 쓰이고 완성되어야 비로소 가치가 있습니다.", history: "실천과 노력을 강조합니다." },
    { title: "그 아버지에 그 아들", desc: "자식의 행동이 부모의 모습과 아주 똑같이 닮았다.", famous: "자식의 성품이나 행동이 부모를 꼭 빼 닮았다면 쓰는 표현입니다.", history: "가정교육의 중요성을 이릅니다." },
    { title: "누워서 침 뱉기", desc: "남을 해치려다가 결국 자기 자신에게 피해가 돌아온다.", famous: "남을 헐뜯거나 욕하려다가 결국 자신에게 그 피해와 부끄러움이 돌아오게 됩니다.", history: "어리석은 행동을 경고합니다." },
    { title: "등잔 밑이 어둡다", desc: "멀리 있는 것은 잘 알면서 가까운 곳의 일은 모른다.", famous: "멀리 있는 것은 잘 알면서도 정작 자기 가까이에 있는 일이나 물건은 찾기 어렵습니다.", history: "등잔의 특성에서 유래했습니다." },
    { title: "말이 씨가 된다", desc: "평소에 무심코 내뱉은 말이 실제로 이루어진다.", famous: "평소에 무심코 내뱉은 말이라도 결국 현실이 되어 돌아올 수 있으니 말을 조심해야 합니다.", history: "말의 중요성을 강조합니다." },
    { title: "모로 가도 서울만 가면 된다", desc: "과정이 어떠하든 결국 목적만 달성하면 된다.", famous: "수단과 방법이 어떠하든 간에 결국 목적만 제대로 달성하면 된다는 뜻입니다.", history: "실용주의적 관점입니다." },
    { title: "배보다 배꼽이 더 크다", desc: "본래의 것보다 부수적인 것이 훨씬 더 크다.", famous: "본래의 것보다 그것에 딸린 부수적인 것의 비용이나 크기가 더 클 때 씁니다.", history: "주객전도의 상황입니다." },
    { title: "벼는 익을수록 고개를 숙인다", desc: "훌륭한 사람일수록 더욱 겸손한 태도를 보인다.", famous: "훌륭한 사람일수록 지혜와 인격이 깊어져 더욱 겸손하고 남을 존중합니다.", history: "벼의 생태에서 비유했습니다." },
    { title: "보기 좋은 떡이 먹기도 좋다", desc: "겉모양이 훌륭해야 속실속도 좋기 마련이다.", famous: "무엇이든 겉모양이 훌륭하고 보기 좋아야 실속도 있고 마음에 들기 마련입니다.", history: "모양새의 중요성입니다." },
    { title: "사촌이 땅을 사면 배가 아프다", desc: "가까운 사람이 잘되는 것을 시기하고 질투한다.", famous: "가까운 사람이 뜻밖의 좋은 일을 당했을 때 순수하게 축하해주기보다 시샘하고 속상해합니다.", history: "인간의 질투심을 해학적으로 표현했습니다." },
    { title: "산 넘어 산이다", desc: "끝없이 힘들고 어려운 일이 계속 닥친다.", famous: "한 가지 어려움을 겨우겨우 넘겼더니 또 다른 더 큰 고난과 시련이 닥쳐옵니다.", history: "산악 지형의 비유입니다." },
    { title: "새 발의 피", desc: "비교할 수 없을 정도로 양이 아주 적다.", famous: "비교 대상이 안 될 정도로 양이 아주 적고 보잘것없음을 비유하는 말입니다.", history: "크기의 차이를 표현합니다." },
    { title: "소 잃고 외양간 고친다", desc: "이미 일을 그르친 뒤에는 뉘우쳐도 소용없다.", famous: "이미 피해를 입은 뒤에는 뒤늦게 손을 써봐야 아무 소용이 없다는 뜻입니다.", history: "사전 예방의 중요성입니다." },
    { title: "쇠귀에 경 읽기", desc: "아무리 가르쳐도 전혀 알아듣지 못한다.", famous: "아무리 반복해서 올바른 말을 일러주어도 전혀 알아듣지 못하는 답답한 상황입니다.", history: "귀담아듣지 않는 태도입니다." },
    { title: "아니 땐 굴뚝에 연기 나랴", desc: "원인이 없으면 결과나 소문도 절대 나지 않는다.", famous: "어떤 일에는 반드시 그럴 만한 원인이나 이유가 있으니까 소문이 난 것입니다.", history: "인과관계를 이르는 말입니다." },
    { title: "약방에 감초", desc: "어느 모임이나 일에든 빠지지 않고 꼭 끼어든다.", famous: "어떤 모임이나 일에든 반드시 빠지지 않고 꼭 끼어드는 사람이나 물건을 비유합니다.", history: "한약재 감초에서 유래했습니다." },
    { title: "어르고 뺨 치기", desc: "겉으로는 달래는 척하면서 은근히 해를 입힌다.", famous: "겉으로는 부드럽게 달래는 척하면서 뒤로는 교묘하게 남을 괴롭히고 해를 줍니다.", history: "이중적인 태도를 비판합니다." },
    { title: "오르지 못할 나무는 쳐다보지도 마라", desc: "애초에 불가능한 일은 아예 욕심내지 마라.", famous: "자신의 능력으로는 도저히 이루거나 가질 수 없는 대상은 아예 욕심내지 않는 것이 좋습니다.", history: "현실적인 판단을 권합니다." },
    { title: "웃는 얼굴에 침 못 뱉는다", desc: "항상 친절하게 대하면 상대도 화를 내지 못한다.", famous: "사람이 항상 밝고 웃는 얼굴로 대하면 아무리 화가 난 사람도 해코지하기 어렵습니다.", history: "상냥한 태도의 중요성입니다." },
    { title: "자라 보고 놀란 가슴 솥뚜껑 보고 놀란다", desc: "한번 놀라면 비슷한 것만 봐도 겁을 먹는다.", famous: "무서운 경험을 겪고 나면 그와 비슷한 작은 자극에도 지나치게 겁을 먹게 됩니다.", history: "과거의 기억 때문입니다." },
    { title: "작은 고추가 더 맵다", desc: "몸집이 작아도 야무지고 실력이 아주 뛰어나다.", famous: "겉모습이나 체격은 비록 작고 볼품없어 보이지만 실력이나 기개는 훨씬 야무지고 뛰어납니다.", history: "사람의 잠재력을 비유합니다." },
    { title: "찰떡 궁합", desc: "서로의 마음이 아주 잘 맞아떨어진다.", famous: "두 사람의 성격이나 마음이 아주 잘 맞아 떨어져서 환상의 호흡을 자랑할 때 씁니다.", history: "음식의 조화에서 비유했습니다." },
    { title: "콩 심은 데 콩 나고 팥 심은 데 팥 난다", desc: "원인에 따라 정확하게 그 결과가 나타난다.", famous: "모든 일은 평소에 행한 원인 그대로 정직하게 그에 상응하는 결과가 나타납니다.", history: "자연의 순리와 같습니다." },
    { title: "티끌 모아 태산", desc: "작은 것도 계속 모으면 엄청나게 커진다.", famous: "아주 사소하고 적은 양이라도 차곡차곡 모으다 보면 언젠가는 거대한 산을 이룹니다.", history: "꾸준한 노력을 칭찬합니다." },
    { title: "핑계 없는 무덤 없다", desc: "잘못을 감추기 위해 어떻게든 핑계를 대기 마련이다.", famous: "아무리 나쁜 일이나 실수를 저질러도 어떻게든 빠져나가기 위해 핑계는 늘 있기 마련입니다.", history: "인간의 변명하는 습성입니다." },
    { title: "하늘이 무너져도 솟아날 구멍이 있다", desc: "아무리 절망적인 상황이라도 해결책은 반드시 있다.", famous: "아무리 처지가 어렵고 절망적인 상황에 빠지더라도 반드시 살아날 방도는 생깁니다.", history: "희망을 주는 속담입니다." },
    { title: "호랑이 제 얘기 하면 온다", desc: "어떤 사람 이야기를 할 때 그 사람이 나타난다.", famous: "마침 어떤 사람에 대해 이야기를 나누고 있는데 그 당사자가 거짓말처럼 나타납니다.", history: "묘한 일치 상황입니다." },
    { title: "고래 싸움에 새우 등 터진다", desc: "강자들의 싸움에 약한 사람이 중간에서 피해를 입는다.", famous: "힘이 센 강자들끼리 서로 다투는 바람에 아무 상관 없는 약한 사람이 중간에서 큰 피해를 입습니다.", history: "약자의 설움을 표현합니다." },
    { title: "구관이 명관이다", desc: "새사람보다 경험이 많은 옛사람이 훨씬 낫다.", famous: "새로운 사람보다 예전에 일하던 사람이 경험도 많고 훨씬 일을 잘한다는 의미입니다.", history: "경험의 가치를 인정합니다." },
    { title: "금강산도 식후경", desc: "아무리 좋은 일도 배가 불러야 흥이 난다.", famous: "아무리 아름다운 경치를 구경하는 일도 배가 고프면 흥이 나지 않으니 무엇보다 먹는 것이 우선입니다.", history: "실용적인 삶의 지혜입니다." },
    { title: "누워서 떡 먹기", desc: "아주 쉽고 간단하게 해낼 수 있다.", famous: "어려운 노력을 들이지 않고도 아주 손쉽게 해낼 수 있는 쉬운 일을 비유합니다.", history: "쉬운 과제를 표현합니다." },
    { title: "도둑이 제 발 저린다", desc: "나쁜 짓을 하면 스스로 겁을 먹고 허둥지둥한다.", famous: "스스로 나쁜 짓이나 실수를 저질러놓고 남이 모를까 봐 저절로 겁을 먹고 허둥지둥합니다.", history: "양심의 가책을 이릅니다." },
    { title: "말 한마디로 천 냥 빚을 갚는다", desc: "말을 슬기롭고 예쁘게 하면 큰 위기도 넘긴다.", famous: "비록 돈 한 푼 없어도 평소에 말을 슬기롭고 예쁘게 하면 큰 어려움이나 빚도 해결할 수 있습니다.", history: "언어의 중요성입니다." },
    { title: "발 없는 새가 천 리 간다", desc: "말과 소문은 순식간에 아주 멀리까지 퍼져나간다.", famous: "말은 비록 날개가 없지만 한번 입에서 입으로 퍼져나가면 순식간에 아주 멀리까지 전달됩니다.", history: "소문의 속도를 비유합니다." },
    { title: "방귀 뀐 사람이 성낸다", desc: "오히려 잘못한 사람이 적반하장으로 화를 낸다.", famous: "자기가 먼저 잘못을 해놓고도 오히려 상대방에게 큰소리를 치며 적반하장으로 화를 냅니다.", history: "뻔뻔한 태도를 비판합니다." },
    { title: "서당 개 삼 년에 풍월을 읊는다", desc: "오래 보고 들으면 무지한 사람도 저절로 배운다.", famous: "아무리 무지한 사람도 학당 근처에서 오랜 세월 보고 들으면 저절로 시를 짓는 법을 익히게 됩니다.", history: "환경의 중요성입니다." },
    { title: "수박 겉핥기", desc: "내용을 깊이 파악하지 못하고 겉모습만 훑는다.", famous: "어떤 일의 속 내용은 제대로 파악하지 못한 채 겉모습만 대충 훑어보고 끝냅니다.", history: "깊이의 부족함을 이릅니다." },
    { title: "식은 죽 먹기", desc: "매우 쉽고 간단하게 해결할 수 있다.", famous: "누워서 떡 먹기와 같이 아주 쉽게 처리할 수 있는 간단한 일을 비유합니다.", history: "쉬운 과제를 표현합니다." },
    { title: "아는 길도 물어가라", desc: "아는 일도 확인하며 거듭 신중하게 행동하라.", famous: "자신이 잘 아는 익숙한 길이라도 혹시 모를 실수를 막기 위해 거듭 확인하고 가야 합니다.", history: "신중한 태도를 강조합니다." },
    { title: "가는 말이 고와야 오는 말이 곱다", desc: "내가 남에게 좋게 말해야 남도 나에게 좋게 말한다.", famous: "평소에 남에게 예의 바르고 고운 말을 써야 상대방도 자신에게 호의적으로 대한다는 뜻입니다.", history: "언행의 상호작용을 강조합니다." },
    { title: "간에 붙었다 뱃속에 붙었다 한다", desc: "자기 이익에 따라 지조 없이 이리저리 붙는다.", famous: "주견이나 소신 없이 이익에 따라 이쪽 편 저쪽 편으로 기회주의적으로 옮겨 다니는 사람을 비유합니다.", history: "줏대 없는 태도를 비판합니다." },
    { title: "겉 다르고 속 다르다", desc: "겉모습과 마음속의 생각이 판이하게 다르다.", famous: "겉으로는 친절하거나 바른 척하지만 속으로는 딴생각을 품고 있는 이중적인 인물입니다.", history: "신뢰를 잃는 행동입니다." },
    { title: "고양이 목에 방울 달기", desc: "실행하기 어렵거나 위험한 일을 헛되이 의논한다.", famous: "말은 쉽지만 실제로 실천하기에는 너무 위험하고 어려운 대책을 이르는 말입니다.", history: "실효성 없는 계획을 비유합니다." },
    { title: "구르는 돌에는 이끼가 안 낀다", desc: "끊임없이 부지런히 움직이면 늘 발전한다.", famous: "사람이 가만히 안주하지 않고 끊임없이 노력하고 활동하면 도태되지 않고 발전합니다.", history: "부지런함의 가치를 이릅니다." },
    { title: "그림의 떡", desc: "아무리 마음에 들어도 실속을 차릴 수 없다.", famous: "눈앞에 보기에는 아주 좋아 보이지만 실제로 가질 수도 없고 이용할 수도 없는 것을 뜻합니다.", history: "허황된 욕심을 비유합니다." },
    { title: "까마귀 고기를 먹었나", desc: "방금 전에 했던 일을 까맣게 잘 잊어버린다.", famous: "나이가 들었거나 깜빡해서 방금 전의 일이나 약속을 기억하지 못할 때 씁니다.", history: "건망증을 놀리는 표현입니다." },
    { title: "날벼락도 감지덕지", desc: "뜻밖의 거대한 재앙조차 오히려 다행으로 여긴다.", famous: "최악의 상황을 모면하여 오히려 감사하게 받아들여야 할 때 씁니다.", history: "안도하는 마음을 뜻합니다." },
    { title: "낮말은 새가 듣고 밤말은 쥐가 듣는다", desc: "아무리 비밀리에 해도 결국 남에게 새어나간다.", famous: "말은 언제 어디서든 누군가 들을 수 있으므로 항상 말조심을 해야 한다는 경고입니다.", history: "언행의 신중함을 강조합니다." },
    { title: "돌다리도 두드려 보고 건너라", desc: "잘 아는 일도 거듭 조심하고 확인해야 한다.", famous: "아무리 안전해 보이는 일이라도 혹시 모를 위험에 대비해 철저히 확인하고 진행하라는 뜻입니다.", history: "철저한 대비를 이릅니다." },
    { title: "땅 파서 장사하냐", desc: "아무리 거저 주려 해도 밑지는 장사는 없다.", famous: "상대방이 터무니없는 할인이나 공짜를 요구할 때 장사꾼이 억울함을 토로할 때 씁니다.", history: "경제적 현실을 이릅니다." },
    { title: "마중물", desc: "펌프질을 할 때 물을 끌어올리기 위해 먼저 붓는 물이다.", famous: "어떤 큰 성과를 얻기 위해 먼저 투자하는 작은 노력이나 자본을 비유합니다.", history: "펌프 작용의 원리에서 유래했습니다." },
    { title: "모난 돌이 정 맞는다", desc: "지나치게 두드러지면 남들에게 미움을 받는다.", famous: "성격이 너무 모나거나 남들 앞에 지나치게 잘난 체를 하면 시련이나 비판을 받기 쉽다는 뜻입니다.", history: "조화로운 삶을 권합니다." },
    { title: "믿었던 도끼에 발등 찍힌다", desc: "가장 믿었던 사람에게 배신을 당한다.", famous: "전적으로 신뢰하고 의지하던 사람에게 뜻밖의 뒤통수를 맞거나 배신당했을 때 씁니다.", history: "인간관계의 쓴맛을 표현합니다." },
    { title: "밑 빠진 독에 물 붓기", desc: "아무리 애를 써도 성과가 전혀 쌓이지 않는다.", famous: "노력이나 비용을 계속 쏟아부어도 아무런 보람이나 결과가 남지 않는 허무한 일입니다.", history: "소모적인 짓을 비유합니다." },
    { title: "바늘 도둑이 소 도둑 된다", desc: "사소한 나쁜 버릇이 커져서 큰 범죄가 된다.", famous: "처음에는 대수롭지 않게 작은 나쁜 짓을 시작하다가 나중에는 걷잡을 수 없이 큰 죄를 짓게 됩니다.", history: "초기 예방의 중요성입니다." },
    { title: "발목을 잡다", desc: "남의 일이 잘 풀리지 않도록 방해한다.", famous: "상대방의 약점을 쥐거나 방해하여 일을 제대로 진행하지 못하게 만들 때 씁니다.", history: "발목을 묶는 형상입니다." },
    { title: "벼룩의 간을 내어 먹는다", desc: "아주 보잘것없는 가난한 사람의 것까지 빼앗는다.", famous: "극도로 약하고 없는 사람의 얼마 안 되는 재물이나 이익까지 가로채는 잔인함을 비유합니다.", history: "부당한 착취를 비판합니다." },
    { title: "빛 좋은 개살구", desc: "겉모양은 번지레하지만 실속은 전혀 없다.", famous: "겉보기에는 아주 그럴듯하고 화려해 보이지만 막상 속을 보면 형편없는 것을 뜻합니다.", history: "실속의 중요성을 이릅니다." },
    { title: "사공이 많으면 배가 산으로 간다", desc: "참견하는 사람이 많으면 일이 엉뚱하게 된다.", famous: "일을 주관하는 사람이 많고 의견이 제각각이면 방향을 잃고 엉망이 된다는 뜻입니다.", history: "리더십의 단일화를 강조합니다." },
    { title: "새는 좌우의 날개로 난다", desc: "균형 잡힌 시각과 협력이 발전의 핵심이다.", famous: "어느 한쪽으로 치우치지 않고 양쪽이 조화를 이루어야만 올바르게 나아갈 수 있습니다.", history: "균형의 가치를 이릅니다." },
    { title: "소 닭 보듯 한다", desc: "서로 관심이 전혀 없고 서먹서먹하다.", famous: "두 사람이 서로를 마주 보면서도 아무런 감정이나 관심 없이 무관심하게 대할 때 씁니다.", history: "서먹한 관계를 비유합니다." },
    { title: "손이 크다", desc: "인심이 매우 후하고 씀씀이가 넉넉하다.", famous: "음식을 만들거나 물건을 베풀 때 아낌없이 푸짐하고 넉넉하게 쓰는 사람을 칭찬합니다.", history: "너그러운 인품을 뜻합니다." },
    { title: "십 년 가뭄에 단비", desc: "오랫동안 고생하던 끝에 아주 반가운 일이 생긴다.", famous: "절체절명의 어려운 순간에 뜻밖의 큰 도움이나 해결책이 극적으로 찾아왔을 때 씁니다.", history: "갈증을 해소하는 기쁨입니다." },
    { title: "열 길 물속은 알아도 한 길 사람 속은 모른다", desc: "사람의 마음속 생각을 짐작하기는 너무 어렵다.", famous: "자연의 이치나 깊은 바다는 측정할 수 있어도 인간의 음흉한 속마음은 알기 힘들다는 뜻입니다.", history: "인간관계의 오묘함입니다." },
    { title: "울며 겨자 먹기", desc: "마음에 내키지 않지만 억지로 마지못해 한다.", famous: "상황이 너무 불리하거나 어쩔 수 없어 싫은 일도 눈물을 머금고 억지로 수행할 때 씁니다.", history: "고통스러운 타협을 뜻합니다." },
    { title: "재주는 곰이 부리고 돈은 주인이 챙긴다", desc: "고생은 내가 하고 실속은 엉뚱한 사람이 가져간다.", famous: "실제로 힘든 일과 노고는 다 바쳤는데 엉뚱한 사람이 그 공로나 이익을 가로챌 때 씁니다.", history: "불합리한 상황을 꼬집습니다." },
    { title: "가는 날이 장날", desc: "뜻밖의 일로 우연히 곤란을 겪게 된다.", famous: "어떤 일을 하려고 마음먹고 나갔는데 뜻밖의 궂은일이나 마땅치 않은 상황을 우연히 만날 때 씁니다.", history: "우연한 겹침을 뜻합니다." },
    { title: "가을 타다", desc: "계절의 변화에 따라 쓸쓸함이나 허전함을 느낀다.", famous: "주로 가을바람이 불어올 때 마음이 싱숭생숭해지고 쓸쓸한 감정에 빠지는 심리 현상입니다.", history: "계절적 감수성입니다." },
    { title: "간에 기별도 안 간다", desc: "먹은 양이 너무 적어 만족스럽지 않다.", famous: "음식을 먹기는 먹었으나 양이 너무 적거나 감칠맛이 나지 않아 허기가 그대로 남을 때 씁니다.", history: "음식 관련 속담입니다." },
    { title: "개천에서 용 난다", desc: "보잘것없는 가난한 환경에서 훌륭한 인물이 난다.", famous: "변변치 못한 집안이나 어려운 여건 속에서도 끈기 있게 노력하여 크게 성공한 사람을 뜻합니다.", history: "희망을 주는 속담입니다." },
    { title: "고래 다리 긁기", desc: "아무리 애를 써도 아무런 효과나 보람이 없다.", famous: "거대한 대상에게 아주 하찮은 노력을 기울여봐야 전혀 변화를 줄 수 없을 때 씁니다.", history: "무모한 수고를 이릅니다." },
    { title: "귀가 가렵다", desc: "누군가 자신에 관해 이야기하고 있는 것 같다.", famous: "마치 남들이 뒤에서 내 뒷담화나 안부를 칭찬 혹은 험담하고 있을 때 직감적으로 쓰는 말입니다.", history: "친숙한 관용구입니다." },
    { title: "길고 짧고는 대봐야 안다", desc: "미리 짐작하지 말고 직접 겨루어봐야 알 수 있다.", famous: "누가 더 낫고 못난지는 뚜껑을 열고 실제로 경쟁해봐야 비로소 결과가 드러난다는 뜻입니다.", history: "공정한 경쟁입니다." },
    { title: "꿀먹은 벙어리", desc: "할 말이 있어도 입을 꾹 다물고 말하지 못한다.", famous: "어떤 난처한 상황이나 사정이 생겨서 당황한 나머지 한마디도 입 밖에 내지 못할 때 씁니다.", history: "당황스러운 상황입니다." },
    { title: "남의 떡이 더 커 보인다", desc: "내 것보다 남의 것이 훨씬 더 좋아 보인다.", famous: "자기가 가진 것에 만족하지 못하고 언제나 남이 가진 것만 더 탐내고 부러워하는 심리입니다.", history: "인간의 시샘입니다." },
    { title: "닭 잡아먹고 오리발 내민다", desc: "나쁜 짓을 하고 엉뚱하게 시치미를 뚝 뗀다.", famous: "자기가 저지른 잘못을 감추기 위해 뻔뻔하게 거짓말을 하며 발뺌할 때 씁니다.", history: "뻔뻔한 태도 비판입니다." },
    { title: "도토리 키 재기", desc: "비슷비슷한 것들끼리 우열을 가린다.", famous: "거기서 거기인 수준의 사람들끼리 서로 더 낫다고 다투는 어리석은 모습입니다.", history: "비교 무의미함을 뜻합니다." },
    { title: "장님 코끼리 만지기", desc: "전체를 보지 못하고 일부만 만져보고 짐작한다.", famous: "사물의 일부분만 경험하고는 그것이 전체인 줄로 착각하여 잘못 판단할 때 씁니다.", history: "열반경의 코끼리 일화입니다." },
    { title: "모기 소리 같다", desc: "목소리가 너무 작아 잘 들리지 않는다.", famous: "자신감이 부족하거나 기운이 없어 목소리가 개미나 모기처럼 웅얼거릴 때 씁니다.", history: "작은 소리 묘사입니다." },
    { title: "물에 빠진 생쥐", desc: "비나 물에 쫄딱 젖어 꼴이 말이 아니다.", famous: "옷이나 몸이 물에 흠뻑 젖어서 온몸이 덜덜 떨리고 초라한 모습이 되었을 때 씁니다.", history: "처량한 모습입니다." },
    { title: "밑져야 본전", desc: "실패해도 잃을 것이 전혀 없으니 해볼 만하다.", famous: "손해를 보아도 원래 상태 그대로이므로 두려워 말고 과감하게 도전해보라는 뜻입니다.", history: "합리적 도전입니다." },
    { title: "바늘구멍으로 하늘 보기", desc: "시야가 매우 좁아 세상을 잘 모른다.", famous: "좁디좁은 틈새로 세상을 관찰하며 거대한 진실을 다 아는 것처럼 착각하는 태도입니다.", history: "견문의 협소함입니다." },
    { title: "벼룩의 간을 빼 먹는다", desc: "아주 불쌍한 사람의 것까지 가로챈다.", famous: "가진 것 하나 없는 빈털터리의 얼마 안 되는 이익을 악착같이 빼앗는 비인간적인 행태입니다.", history: "착취 비판입니다." },
    { title: "산 입에 거미줄 치랴", desc: "어떻게든 살아가기 마련이다.", famous: "아무리 처지가 궁색하고 가난해도 사람이 굶어 죽기야 하겠냐며 희망을 북돋울 때 씁니다.", history: "생존의 끈기입니다." },
    { title: "입이 닳도록 칭찬한다", desc: "침이 마르도록 끊임없이 칭찬한다.", famous: "어떤 사람이나 물건의 훌륭한 점을 감탄하며 거듭 거듭 극찬할 때 씁니다.", history: "칭찬의 표현입니다." },
    { title: "효자 손 효자발", desc: "자신을 진심으로 돕는 믿음직한 손길이다.", famous: "곤란할 때 가장 적절한 시점에 가려운 곳을 긁어주듯 척척 도와주는 사람입니다.", history: "도움의 비유입니다." },
    { title: "힘을 쓰다", desc: "어떤 일에 본격적으로 영향력을 행사한다.", famous: "자신의 실력이나 권한을 발휘하여 어려운 문제를 적극적으로 해결해 나갈 때 씁니다.", history: "능력 발휘입니다." }
];

var proverbSettings = { mode: 'idiom', timeLimit: 10 };
var proverbState = {};
var proverbRound = 1, proverbCorrect = 0;

function initProverbQuiz() { renderProverbSetup(); }

function renderProverbSetup() {
    var modes = [
        { v: 'idiom', l: '고사성어 맞추기' },
        { v: 'proverb', l: '속담 맞추기' }
    ];
    var times = [{ v: 10, l: '10초' }, { v: 15, l: '15초' }, { v: 20, l: '20초' }, { v: 0, l: '무제한' }];
    var html = '<div class="game-title-box">📜 고사성어·속담 맞추기</div>';
    html += '<div class="game-sub-desc">뜻 설명을 읽고, 알맞은 고사성어나 속담을 골라보세요!</div>';
    html += '<div class="setup-section-label">유형</div><div class="setup-btn-group">';
    modes.forEach(function (m) {
        html += '<button class="setup-btn' + (proverbSettings.mode === m.v ? ' active' : '') + '" onclick="setProverbMode(\'' + m.v + '\')">' + m.l + '</button>';
    });
    html += '</div>';
    html += '<div class="setup-section-label">제한 시간</div><div class="setup-btn-group">';
    times.forEach(function (t) {
        html += '<button class="setup-btn' + (proverbSettings.timeLimit === t.v ? ' active' : '') + '" onclick="setProverbTimeLimit(' + t.v + ')">' + t.l + '</button>';
    });
    html += '</div>';
    html += '<button class="action-btn" onclick="startProverbSession()">시작하기 🚀</button>';
    document.getElementById('mainArea').innerHTML = html;
}
function setProverbMode(v) { proverbSettings.mode = v; renderProverbSetup(); }
function setProverbTimeLimit(v) { proverbSettings.timeLimit = v; renderProverbSetup(); }
function startProverbSession() { proverbRound = 1; proverbCorrect = 0; generateProverbRound(); }

function generateProverbRound() {
    var pool = proverbSettings.mode === 'idiom' ? IDIOM_LIST : PROVERB_LIST;
    var correct = pickRandom(pool);
    var wrongPool = pool.filter(function (it) { return it.title !== correct.title; });
    var wrongs = pickN(wrongPool, 2);
    var options = shuffleArray([
        { title: correct.title, isCorrect: true },
        { title: wrongs[0].title, isCorrect: false },
        { title: wrongs[1].title, isCorrect: false }
    ]);
    proverbState = {
        pool: pool, correct: correct, options: options, answered: false, hintShown: false,
        timeLimit: proverbSettings.timeLimit, timeLeft: proverbSettings.timeLimit, timerId: null, timedOut: false
    };
    renderProverbQuiz();
    if (proverbState.timeLimit > 0) { startProverbTimer(); }
}
function retryProverbRound() {
    proverbState.answered = false;
    proverbState.hintShown = false;
    proverbState.timedOut = false;
    proverbState.timeLeft = proverbState.timeLimit;
    renderProverbQuiz();
    if (proverbState.timeLimit > 0) { startProverbTimer(); }
}
function nextProverbRound() { proverbRound++; generateProverbRound(); }

function startProverbTimer() {
    var bar = document.getElementById('proverbTimerBar');
    if (bar) bar.style.width = (proverbState.timeLeft / proverbState.timeLimit * 100) + '%';
    proverbState.timerId = setInterval(function () {
        proverbState.timeLeft -= 0.1;
        var b = document.getElementById('proverbTimerBar');
        if (b) b.style.width = Math.max(0, proverbState.timeLeft / proverbState.timeLimit * 100) + '%';
        if (proverbState.timeLeft <= 0) { handleProverbTimeout(); }
    }, 100);
    activeTimers.push(proverbState.timerId);
}
function handleProverbTimeout() {
    if (proverbState.timedOut || proverbState.answered) return;
    if (proverbState.timerId) { clearInterval(proverbState.timerId); proverbState.timerId = null; }
    proverbState.timedOut = true;
    proverbState.answered = true;
    if (typeof reportGameOutcome === 'function') reportGameOutcome('lose');
    renderProverbQuiz();
}
function toggleProverbHint() {
    if (proverbState.answered) return;
    proverbState.hintShown = !proverbState.hintShown;
    renderProverbQuiz();
}
function checkProverbAnswer(btn, title, isCorrect) {
    if (proverbState.answered) return;
    if (proverbState.timerId) { clearInterval(proverbState.timerId); proverbState.timerId = null; }
    proverbState.answered = true;
    proverbState.selectedTitle = title;
    vibrateShort();
    if (isCorrect) { proverbCorrect++; }
    if (typeof reportGameOutcome === 'function') reportGameOutcome(isCorrect ? 'win' : 'lose');
    renderProverbQuiz();
    var msg = document.getElementById('proverbMsg');
    var modeLabel = proverbSettings.mode === 'idiom' ? '고사성어' : '속담';
    if (isCorrect) {
        msg.className = 'msg-box'; msg.style.display = 'block';
        msg.innerText = '🎉 정답이에요! "' + proverbState.correct.title + '"';
        document.getElementById('mainArea').insertAdjacentHTML('beforeend', buildStandardResultButtons('nextProverbRound()', 'retryProverbRound()', 'renderProverbSetup()'));
    } else {
        msg.className = 'msg-box bad'; msg.style.display = 'block';
        msg.innerText = '아쉬워요! 정답은 "' + proverbState.correct.title + '" 였어요. (' + proverbState.correct.famous + ')';
        var effHome = (typeof todayModeActive !== 'undefined' && todayModeActive) ? 'exitTodayMode()' : ((typeof randomModeActive !== 'undefined' && randomModeActive) ? 'exitRandomMode()' : 'renderProverbSetup()');
        document.getElementById('mainArea').insertAdjacentHTML('beforeend',
            '<div class="options-grid">' +
            '<button class="action-btn" onclick="retryProverbRound()">다시 시도 🔁</button>' +
            '<button class="action-btn secondary" onclick="' + effHome + '">처음부터 ⏮</button>' +
            '</div>');
    }
}
function findProverbItemByTitle(title) {
    var pool = proverbState.pool || (proverbSettings.mode === 'idiom' ? IDIOM_LIST : PROVERB_LIST);
    var found = null;
    pool.forEach(function (it) { if (it.title === title) found = it; });
    return found;
}
function showProverbOptionMeaning(title) {
    if (!proverbState.answered) return;
    var item = findProverbItemByTitle(title);
    if (!item) return;
    openMeaningModal(item.title, item.desc + ' — ' + item.famous);
}
function renderProverbQuiz() {
    var modeLabel = proverbSettings.mode === 'idiom' ? '고사성어' : '속담';
    var html = '<div class="game-title-box">📜 고사성어·속담 맞추기</div>';
    html += '<div class="game-sub-desc">다음 뜻 설명에 알맞은 ' + modeLabel + '을(를) 골라보세요!</div>';
    html += '<div class="status-row"><div>' + proverbRound + '라운드</div><div>정답: ' + proverbCorrect + ' / ' + (proverbRound - 1) + '</div></div>';
    if (proverbState.timeLimit > 0 && !proverbState.answered) {
        html += '<div class="timer-container"><div class="timer-bar" id="proverbTimerBar" style="width:' + (proverbState.timeLeft / proverbState.timeLimit * 100) + '%;"></div></div>';
    }
    html += '<div class="msg-box" style="display:block; background:#fdf2f8; border-color:#f472b6; color:#be185d; text-align:center; font-weight:700; font-size:1.05rem;">' + proverbState.correct.desc + '</div>';
    if (proverbState.timedOut) {
        html += '<div class="msg-box bad" style="display:block;">⏰ 시간이 다 됐어요! 정답은 "' + proverbState.correct.title + '" 였어요. (' + proverbState.correct.famous + ')</div>';
    }
    if (!proverbState.answered) {
        html += '<button class="action-btn secondary" style="width:100%;" onclick="toggleProverbHint()">💡 힌트 보기</button>';
    }
    if (proverbState.hintShown && !proverbState.answered) {
        html += '<div class="msg-box" style="display:block; background:#f5f3ff; border-color:#c4b5fd; color:#5b21b6;">' + proverbState.correct.famous + '</div>';
    }
    if (proverbState.answered) {
        html += '<div class="msg-box" style="display:block; background:#f8fafc; border-color:#e5e7eb; text-align:left;">' +
            '<strong>의미:</strong> ' + proverbState.correct.desc + '<br>' +
            '<strong>설명:</strong> ' + proverbState.correct.famous + '<br>' +
            '<strong>배경:</strong> ' + proverbState.correct.history +
            '</div>';
    }
    if (proverbState.answered && !proverbState.timedOut) {
        html += '<div class="game-sub-desc" style="margin-bottom:0.4rem;">오답을 눌러보면 무슨 뜻인지 볼 수 있어요.</div>';
    }
    html += '<div class="options-grid" style="grid-template-columns: 1fr;">';
    proverbState.options.forEach(function (opt) {
        var cls = 'opt-btn';
        var escTitle = opt.title.replace(/'/g, "\\'");
        var onclick;
        if (proverbState.answered) {
            if (opt.isCorrect) {
                cls += ' correct';
                onclick = "showProverbOptionMeaning('" + escTitle + "')";
            } else if (opt.title === proverbState.selectedTitle) {
                cls += ' wrong';
                onclick = "showProverbOptionMeaning('" + escTitle + "')";
            } else {
                onclick = "showProverbOptionMeaning('" + escTitle + "')";
            }
        } else {
            onclick = "checkProverbAnswer(this,'" + escTitle + "'," + opt.isCorrect + ")";
        }
        html += '<button class="' + cls + '" onclick="' + onclick + '">' + opt.title + '</button>';
    });
    html += '</div>';
    html += '<div id="proverbMsg" class="msg-box"></div>';
    document.getElementById('mainArea').innerHTML = html;
}

GAME_INIT_FNS.proverbIdiom = initProverbQuiz;
