# 캐릭터 이미지 폴더

이 폴더에 **캐릭터 이름**(또는 id)으로 이미지 파일을 넣으면, 게임 대화창에 나오는 그 캐릭터의 얼굴이 넣은 이미지로 바뀝니다.
이로이 이미지는 사이드바와 능력치 화면 얼굴도 함께 바뀝니다.

- 파일 형식: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`
- 예: `엄마.png`, `아빠.jpg`, `이로이.png` (또는 `mom.png`, `dad.jpg`, `iroi.png`)
- 정사각형에 가까운 얼굴 사진이 가장 잘 맞습니다(대화창 액자는 정사각형, 가운데를 기준으로 잘림).
- GitHub에 올린 뒤 1~2분쯤 지나면(Pages 배포) 새로고침했을 때 반영됩니다.
- 지도 위를 걸어 다니는 도트 캐릭터는 바뀌지 않습니다.

| 파일 이름(캐릭터 이름) | 또는 id |
|---|---|
| `이로이` | `iroi` |
| `엄마` | `mom` |
| `아빠` | `dad` |
| `같은 반 친구` | `friend_1` |
| `같은 반 친구` | `friend_2` |
| `외할머니` | `grandma_mom` |
| `친할머니` | `grandma_dad` |
| `외할아버지` | `grandpa_mom` |
| `친할아버지` | `grandpa_dad` |
| `경찰관` | `police_man` |
| `수상한 어른` | `stranger` |
| `동네 형` | `bully` |
| `친구` | `crying_friend` |
| `문구점 아저씨` | `stationery_owner` |
| `분식집 이모` | `snack_owner` |
| `선생님` | `teacher` |
| `나비정원 삼촌` | `butterfly_uncle` |
| `경율이 삼촌` | `gyeongyul_uncle` |
| `담임 선생님` | `homeroom_teacher` |
| `방과후 선생님` | `afterschool_1` · `afterschool_2` · `afterschool_3` |
| `태권도 사범님` | `taekwondo_master` |
| `코딩 선생님` | `coding_teacher` |
| `미술 선생님` | `art_teacher` |
| `논술 선생님` | `essay_teacher` |
| `수학 선생님` | `math_teacher` |
| `수영장 코치님` | `swim_coach` |
| `체육 코치님` | `sports_coach` |
| `맥도날드 알바생` | `alba_mcdonalds` |
| `맘스터치 알바생` | `alba_momstouch` |
| `롯데리아 알바생` | `alba_lotteria` |
| `KFC 알바생` | `alba_kfc` |
| `버거킹 알바생` | `alba_burgerking` |
| `김밥천국 알바생` | `alba_gimbab` |

> `방과후 선생님`은 세 명이라, 각각 다른 사진을 쓰려면 `afterschool_1.png` ~ `afterschool_3.png`로 넣어 주세요.
> `같은 반 친구`는 두 명이 이름이 같아서, 서로 다른 그림을 쓰려면 `friend_1.png`, `friend_2.png`처럼 id로 넣어 주세요.

## 매장/장소 입장 인트로 이미지

매장이나 특정 장소에 들어갈 때, 대화가 시작되기 전에 지도 중앙에 2.5초간 떴다가 사라지는 큰 이미지입니다.
같은 `img/characters/` 폴더에 **`intro_` + id**로 된 이미지를 넣으면 자동으로 쓰입니다 — 없으면 그냥 인트로 없이 바로 대화로 넘어갑니다.

- 비율은 **3:2(가로로 넓게)**로 만들어 주세요. 화면에는 지도 너비의 80% 크기로 표시됩니다.
- 예: `intro_school.png`(학교), `intro_taekwondo.png`(태권도학원), `intro_lotteria.png`(롯데리아) 등.
- 학원은 카테고리의 `introId`(`data/academy_categories.json`)로, 매장/장소는 활동 id(`data/hotplaces.json`의 `id`)로 파일 이름을 맞추면 됩니다.
- 추가(2026-11): `intro_datewithmom.png`(엄마가 일찍 퇴근해서 같이 외출할 때), `intro_uncleparty.png`(나비정원 삼촌이 금요일 저녁에 집에 놀러올 때)도 같은 방식으로 쓰입니다.

## 여행 이미지

여행(§24) 중 날짜가 바뀔 때마다 지도 중앙에 **5초간**(매장 인트로보다 깁니다) 떴다가 사라지는 이미지입니다. 같은 폴더에 **`travel_` + 여행지 id**로 넣어 주세요 — 없으면 이미지 없이 바로 그날의 가족 대화로 넘어갑니다.

- 비율은 매장 인트로와 같은 **3:2**로 만들어 주세요.
- 여행 하루하루 전부 같은 이미지가 반복해서 쓰입니다(날짜별로 다른 이미지가 아님).
- 가까운 여행지: `travel_guam.png`, `travel_sapporo.png`, `travel_jeju.png`, `travel_yangyang.png`, `travel_danang.png`, `travel_osaka.png`, `travel_shanghai.png`
- 먼 여행지: `travel_spain.png`, `travel_germany.png`, `travel_italy.png`, `travel_greatbritain.png`, `travel_usa.png`, `travel_austria.png`, `travel_iceland.png`, `travel_india.png`, `travel_madagascar.png`
