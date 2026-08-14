@echo off
setlocal
cd /d "%~dp0"

echo Spoustim mistni server pro 3D galerii...
start "3D Galerie - SERVER (nezavirat, dokud ma byt galerie spustena)" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

timeout /t 2 /nobreak >nul

set "URL=http://localhost:8080"
set "KIOSK_FLAGS=--kiosk --disable-pinch --overscroll-history-navigation=0"

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" %KIOSK_FLAGS% --incognito %URL%
    goto :eof
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" %KIOSK_FLAGS% --incognito %URL%
    goto :eof
)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" %KIOSK_FLAGS% --inprivate %URL%
    goto :eof
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" %KIOSK_FLAGS% --inprivate %URL%
    goto :eof
)

echo Chrome ani Edge nebyly nalezeny na obvyklem miste, otevira se ve vychozim prohlizeci.
start "" %URL%
