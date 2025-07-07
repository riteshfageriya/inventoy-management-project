@echo off
echo Starting Inventory Management System Development Environment
echo.

rem Get the current directory
set "CURRENT_DIR=%cd%"
echo Current directory: %CURRENT_DIR%

echo Starting Backend Server...
start cmd /k "cd /d %CURRENT_DIR%\server && npm run dev"
echo.

timeout /t 3 > nul

echo Starting Frontend Client...
start cmd /k "cd /d %CURRENT_DIR%\client && npm start"
echo.

echo Both services are starting. Please wait for the browser to open.
echo.
echo Press any key to close this window (services will continue running)
pause > nul
