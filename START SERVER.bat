@echo off
echo.
echo  ==========================================
echo   COSMIC GALAXY — Local Server
echo  ==========================================
echo.
echo  Starting server on http://localhost:8000
echo.
echo  Open your browser and go to:
echo  http://localhost:8000/index.html
echo.
echo  Press Ctrl+C to stop the server
echo.
python -m http.server 8000
pause