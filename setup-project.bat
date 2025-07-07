@echo off
echo Setting up Inventory Management System...
echo.

echo Installing backend dependencies...
cd server
call npm install
cd ..

echo.
echo Installing frontend dependencies...
cd client
call npm install
cd ..

echo.
echo Setup complete! You can now run the application using start-dev.bat
echo.
pause
