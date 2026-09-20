@echo off
rem ============================================================
rem  Local preview launcher for the knowledge-system SPA.
rem  ES modules cannot be opened via file:// (CORS), so serve
rem  the public/ folder over a local static server instead.
rem ============================================================
cd /d "%~dp0"
echo.
echo  Starting local preview at http://127.0.0.1:8123/index.html
echo  Press Ctrl+C in this window to stop the server.
echo.
start "" http://127.0.0.1:8123/index.html
python -m http.server 8123 --directory public
if errorlevel 1 (
  echo.
  echo Python was not found. Install Python 3, or run:
  echo     python -m http.server 8123 --directory public
  pause
)
