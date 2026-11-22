@echo off
cd /d "%~dp0"
echo map_editor 로컬 서버를 켭니다...
echo 브라우저에서 http://localhost:8000/map_editor.html 로 접속하세요.
echo 끄려면 이 창을 닫거나 Ctrl+C 를 누르세요.
start http://localhost:8000/map_editor.html
python -m http.server 8000
pause
