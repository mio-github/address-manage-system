@echo off
REM MC Coordinate Keeper - Windows Start Script

echo 🎮 Starting MC Coordinate Keeper Development Environment...

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm -v >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found. Please install npm first.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Create necessary directories
if not exist "dist\main" mkdir "dist\main"
if not exist "dist\renderer" mkdir "dist\renderer"

echo 🏗️ Building and starting application...

REM Start development environment
call npm run dev

echo ✅ Development environment started!

pause