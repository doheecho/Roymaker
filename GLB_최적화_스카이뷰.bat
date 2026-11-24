@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [1/2] models 폴더에서 아직 최적화 안 된 glb를 최적화합니다...
python optimize_glb.py --new
if errorlevel 1 (
  echo.
  echo 최적화에서 문제가 생겼어요. 위 메시지를 확인하세요. Python·Node.js가 설치돼 있어야 합니다.
  pause
  exit /b 1
)
echo.
echo [2/2] 새로 생겼거나 바뀐 glb의 스카이뷰(img\skyview)를 만듭니다...
echo (처음 한 번은 먼저: npm install playwright three@0.160.0  그리고  npx playwright install chromium)
node tools\make_skyview.cjs %*
echo.
echo 끝! 바뀐 파일(models, img\skyview)을 GitHub에 올리면 됩니다.
pause