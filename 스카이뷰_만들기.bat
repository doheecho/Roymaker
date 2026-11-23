@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo models 폴더의 glb를 위에서 본 그림(img\skyview)으로 만듭니다...
echo (처음 한 번은 먼저: npm install playwright three@0.160.0  그리고  npx playwright install chromium)
node tools\make_skyview.cjs %*
pause
