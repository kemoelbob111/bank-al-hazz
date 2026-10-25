@echo off
chcp 65001 >nul
cd /d "%~dp0"
title بنك الحظ

echo.
echo   ==============================
echo        بنك الحظ - تشغيل اللعبة
echo   ==============================
echo.

set PORT=8765

where py >nul 2>&1
if %errorlevel%==0 (
  start "" "http://127.0.0.1:%PORT%/index.html"
  echo المتصفح يفتح على http://127.0.0.1:%PORT%
  echo لإيقاف الخادم: Ctrl+C
  echo.
  py -m http.server %PORT%
  goto :end
)

where python >nul 2>&1
if %errorlevel%==0 (
  start "" "http://127.0.0.1:%PORT%/index.html"
  echo المتصفح يفتح على http://127.0.0.1:%PORT%
  echo لإيقاف الخادم: Ctrl+C
  echo.
  python -m http.server %PORT%
  goto :end
)

echo Python غير موجود - فتح الملف مباشرة...
start "" "%~dp0index.html"
timeout /t 3 >nul

:end
