# GLB 최적화 · 스카이뷰 만들기 가이드

새 건물 모델(`.glb`)을 올린 뒤 해야 하는 두 가지 작업을 **직접** 돌리는 방법을 정리했습니다.
방법은 세 가지이고, 편한 것 하나만 쓰면 됩니다.

| 방법 | 필요한 것 | 추천 상황 |
|---|---|---|
| [A. 깃허브 자동(Actions)](#a-깃허브에서-자동으로-추천) | 아무것도 없음(폰으로도 됨) | **제일 편함.** glb만 올리면 끝 |
| [B. 웹 브라우저(Codespaces)](#b-웹-브라우저에서-codespaces) | 브라우저 | 명령을 직접 치며 결과를 보고 싶을 때 |
| [C. 내 컴퓨터(로컬)](#c-내-컴퓨터에서-로컬-윈도우맥) | Python·Node.js 설치 | PC에서 작업할 때, 인터넷이 느릴 때 |

---

## 0. 무엇을 하는 작업인가요?

### GLB 최적화 — `optimize_glb.py`
- Blender 등에서 뽑은 glb는 용량이 큽니다(보통 2~7MB). 그대로 쓰면 폰에서 로딩이 오래 걸립니다.
- 텍스처를 WebP로 바꾸고 1024px 이하로 줄이며, 중복 데이터를 지우고, 형상(정점)을 meshopt로 압축합니다.
- 보통 **80~90% 줄어듭니다**(예: 6.8MB → 0.85MB). 모양·크기·정점 수는 그대로입니다.
- 이미 최적화된 파일은 `--new` 옵션이 알아서 건너뜁니다(두 번 압축하면 화질만 나빠지므로).
- 캐릭터 모델(`mom.glb`, `walk.glb`, `dance.glb`)은 기본으로 빠집니다(뼈대·동작이 깨질 수 있어서).

### 스카이뷰 만들기 — `tools/make_skyview.cjs`
- 각 glb를 **위에서 내려다본 그림**(`img/skyview/<파일이름>.webp`)으로 만듭니다.
- 맵 에디터(`map_editor.html`)가 이 그림을 지도 위 건물 자리에 깔아 줘서, 건물 위치·회전을 맞추기 쉬워집니다.
- 그림 목록과 크기 정보는 `img/skyview/skyview.json`에 저장됩니다.
- 새로 생겼거나 **내용이 바뀐 glb만** 다시 그립니다(파일 내용으로 비교). 전부 다시 그리려면 `--force`.

### 순서
**최적화 → 스카이뷰** 순서로 돌리세요. 최적화하면 파일 내용이 바뀌므로, 스카이뷰를 먼저 그렸다면 다시 그려집니다.

---

## A. 깃허브에서 자동으로 (추천)

저장소에 `.github/workflows/glb-optimize-skyview.yml`이 들어 있어서, **`models/` 폴더에 glb가 올라오면 깃허브가 알아서**
최적화 → 스카이뷰 → 커밋까지 해 줍니다. PC 없이 폰으로도 됩니다.

### 처음 한 번만: 권한 확인
1. 깃허브 저장소 → **Settings** → 왼쪽 **Actions** → **General**
2. 맨 아래 **Workflow permissions**에서 **Read and write permissions** 선택 → **Save**
   (이게 꺼져 있으면 마지막 "커밋" 단계에서 권한 오류가 납니다)

### 평소 쓰는 법
1. 깃허브 웹(또는 폰 앱)에서 저장소의 `models` 폴더로 들어갑니다.
2. **Add file → Upload files**로 glb를 올리고 **Commit changes**를 누릅니다.
3. 저장소 위쪽 **Actions** 탭을 누르면 "GLB 최적화 + 스카이뷰"가 돌고 있습니다(노란 점 = 도는 중).
   보통 **3~6분** 걸립니다(처음엔 도구를 내려받느라 조금 더).
4. 초록 체크가 뜨면 끝. 커밋 목록에 **"GLB 최적화·스카이뷰 자동 갱신"**(작성자 github-actions[bot])이 생기고,
   `models/`의 glb가 작아지고 `img/skyview/`에 그림이 추가돼 있습니다.

### 손으로 돌리기(이미 올린 파일을 다시 처리하고 싶을 때)
- **Actions** 탭 → 왼쪽 **GLB 최적화 + 스카이뷰** → 오른쪽 **Run workflow** → (필요하면 "스카이뷰를 전부 다시 그릴까요?" 체크) → **Run workflow**

### 주의
- 봇이 `main`에 커밋을 하나 더 넣습니다. **PC에서 작업하기 전엔 꼭 최신으로 받으세요**(`git pull` 또는 GitHub Desktop의
  **Fetch/Pull**). 안 그러면 예전 파일로 덮어써서 "데이터가 예전으로 돌아간" 것처럼 보일 수 있습니다.
- 봇은 `models/`와 `img/skyview/`만 건드립니다. 맵 에디터의 "☁️ GitHub에 저장"(map_data.js)과는 부딪히지 않습니다.
- 실패(빨간 X)하면 Actions 탭에서 그 실행을 눌러 어느 단계에서 멈췄는지 보세요. 아래 [문제 해결](#문제-해결) 참고.

---

## B. 웹 브라우저에서 (Codespaces)

깃허브가 브라우저 안에 리눅스 컴퓨터를 하나 빌려주는 기능입니다. 명령을 직접 쳐서 결과를 바로 보고 싶을 때 씁니다.
(개인 계정은 매달 무료 사용 시간이 있습니다. 다 쓰면 끄세요.)

1. 깃허브 저장소 첫 화면 → 초록 **Code** 버튼 → **Codespaces** 탭 → **Create codespace on main**
2. 1~2분 뒤 브라우저에 VS Code 화면이 뜹니다. 아래쪽 **터미널**에 다음을 한 줄씩 붙여 넣습니다.

```bash
# 처음 한 번만(코드스페이스를 새로 만들 때마다)
npm install --no-save playwright three@0.160.0
npx playwright install --with-deps chromium

# 1) 아직 최적화 안 된 glb 최적화
python3 optimize_glb.py --new

# 2) 새로 생겼거나 바뀐 glb의 스카이뷰 만들기
node tools/make_skyview.cjs

# 3) 결과를 깃허브에 올리기
git add models img/skyview
git commit -m "GLB 최적화·스카이뷰"
git push
```

3. 다 쓰면 왼쪽 아래 **Codespaces** → **Stop Current Codespace**(무료 시간 아끼기).

> 팁: glb를 코드스페이스에 직접 올리려면 왼쪽 파일 목록의 `models` 폴더에 파일을 끌어다 놓으면 됩니다.

---

## C. 내 컴퓨터에서 (로컬, 윈도우·맥)

### 처음 한 번만 준비
1. **Python 3** 설치: <https://www.python.org/downloads/>
   - 윈도우 설치 첫 화면에서 **"Add python.exe to PATH"를 꼭 체크**하세요.
2. **Node.js LTS** 설치: <https://nodejs.org/> (설치하면 `npx`도 같이 생깁니다)
3. 저장소 폴더(이 파일이 있는 `Roymaker` 폴더)에서 명령창을 엽니다.
   - 윈도우: 폴더 주소창에 `cmd` 입력 후 Enter
   - 맥: 터미널에서 `cd` 로 폴더 이동
4. 스카이뷰용 도구 설치(한 번만):

```bash
npm install playwright three@0.160.0
npx playwright install chromium
```

> 최적화 도구(@gltf-transform/cli)는 처음 돌릴 때 `npx`가 알아서 내려받습니다(인터넷 필요).

### 작업하기 전에: 최신 파일 받기
GitHub Desktop이면 **Fetch origin → Pull**, 명령창이면 `git pull`.

### 윈도우: 더블클릭으로
- **`GLB_최적화_스카이뷰.bat`** 더블클릭 → 최적화와 스카이뷰를 차례로 합니다.
- 스카이뷰만 다시 만들려면 **`스카이뷰_만들기.bat`**.

### 명령으로 (윈도우·맥 공통)

```bash
# 1) 아직 최적화 안 된 glb만 최적화 (맥은 python 대신 python3)
python optimize_glb.py --new

# 2) 새로 생겼거나 바뀐 glb의 스카이뷰
node tools/make_skyview.cjs
```

### 결과 올리기
바뀐 파일은 `models/*.glb`와 `img/skyview/`(그림 + `skyview.json`)입니다.
- GitHub Desktop: 왼쪽 목록에서 확인 → 아래 요약 입력 → **Commit to main** → **Push origin**
- 명령창: `git add models img/skyview` → `git commit -m "GLB 최적화·스카이뷰"` → `git push`

---

## 옵션 정리

### `optimize_glb.py`
| 명령 | 하는 일 |
|---|---|
| `python optimize_glb.py --new` | **추천.** `models/`에서 아직 최적화 안 된 것만 |
| `python optimize_glb.py models/place_새건물.glb` | 특정 파일만(여러 개를 띄어 써도 됨) |
| `python optimize_glb.py --all` | `models/` 전부 — **이미 된 것도 다시 압축하니 평소엔 쓰지 마세요** |
| `--texture-size 2048` | 텍스처 최대 크기(기본 1024px). 간판 글씨가 뭉개질 때만 키우기 |
| `--dir 폴더` | `models/` 말고 다른 폴더(`--new`/`--all`과 함께) |
| `--force` | 캐릭터 모델(mom·walk·dance)도 전체 최적화(비추천) |

- 결과에 `○○ -> ○○ bytes (87% 감소)`가 나오면 성공입니다.
- `건너뜀(최적화해도 안 줄어듦)`이면 원본을 그대로 둡니다(이미 작거나 텍스처가 없는 파일).
- 최적화 조합은 건물 크기가 틀어지지 않는 것으로 **검증된 옵션만** 씁니다(스크립트 맨 위 설명 참고).

### `tools/make_skyview.cjs`
| 명령 | 하는 일 |
|---|---|
| `node tools/make_skyview.cjs` | 새로 생겼거나 바뀐 glb만 |
| `node tools/make_skyview.cjs models/place_설내옥.glb` | 특정 파일만 |
| `node tools/make_skyview.cjs --force` | 전부 다시(몇 분 걸림) |

---

## 새 건물을 올릴 때 전체 흐름

1. Blender 등에서 glb로 내보내기 → 파일 이름은 `place_건물이름.glb`처럼(한글 가능)
2. 깃허브 `models/` 폴더에 올리기
3. **A 방법이면 끝**(자동). B·C 방법이면 위 명령 두 개 실행 후 올리기
4. 맵 에디터에서 그 건물을 고르고 `model`칸에 `models/place_건물이름.glb` 입력 → 스카이뷰 그림을 보며 위치·회전 맞추기
5. **☁️ GitHub에 저장**

> 같은 이름으로 모델을 **바꿔 올리면** 자동으로 다시 최적화·스카이뷰됩니다(내용이 바뀌었으니까).
> 게임이 옛 모델을 계속 보여 주면 `neighborhood3d.js` 맨 위 `ASSET_VERSION` 숫자를 바꿔 달라고 하거나, 폰에서 새로고침하세요.

---

## 문제 해결

| 증상 | 원인·해결 |
|---|---|
| `npx로 @gltf-transform/cli를 실행할 수 없다` | Node.js가 없거나 인터넷이 안 됨. Node.js 설치 후 명령창을 새로 열기 |
| `'python'은(는) 내부 또는 외부 명령...이 아닙니다` | Python 설치 때 "Add to PATH"를 안 함 → 다시 설치하며 체크, 또는 `py optimize_glb.py --new` |
| `Playwright가 없어요` | 저장소 폴더에서 `npm install playwright three@0.160.0` → `npx playwright install chromium` |
| 스카이뷰가 비어 있거나 까맣다 | 모델이 아주 멀리 떨어진 곳에 있거나 크기가 0인 경우. 원본 모델의 원점·크기를 확인 |
| Actions가 빨간 X, "Permission denied"/"403" | [처음 한 번만: 권한 확인](#처음-한-번만-권한-확인)의 Read and write 설정 |
| Actions가 빨간 X, push 단계 실패 | 그 사이 다른 커밋이 들어온 경우. Run workflow로 한 번 더 돌리면 됨 |
| 원본 glb가 20MB 넘게 커서 깃허브에 안 올라감 | 편집기가 glb 안에 남긴 백업 데이터(extras) 때문인 경우가 많아요. `optimize_glb.py`가 이걸 자동으로 지우고 압축해서 보통 1MB 안팎이 돼요(28MB → 1MB). 깃허브 웹은 25MB까지만 올라가니, 이런 파일은 C 방법(로컬)으로 최적화한 뒤 올리세요 |
| 최적화 뒤 건물이 이상하게 늘어나거나 찌그러짐 | 거의 없지만, 그 파일을 원본으로 되돌리고(깃허브 History에서) 알려 주세요 |
| 맵 에디터에 스카이뷰가 안 보임 | 에디터 위 "스카이뷰" 체크 확인, 새로고침(그림·json이 올라갔는지 `img/skyview/` 확인) |
