@echo off
title KRC App Server
cd /d "%~dp0"
echo ============================================================
echo  KRC Companion App  -  local server
echo  Open in Chrome:   http://localhost:8000
echo  Keep this window open while using/installing. Close to stop.
echo ============================================================
echo.
py -m http.server 8000
pause
