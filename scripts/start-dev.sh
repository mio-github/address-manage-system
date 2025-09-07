#!/bin/bash

# MC Coordinate Keeper - Development Start Script
echo "🎮 Starting MC Coordinate Keeper Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Create necessary directories
mkdir -p dist/main dist/renderer

echo "🏗️  Building main process and preload script..."
npm run build:main &
MAIN_PID=$!

npm run build:preload &
PRELOAD_PID=$!

echo "🌐 Starting renderer development server..."
npm run dev:renderer &
RENDERER_PID=$!

# Wait for main process and preload build to complete
wait $MAIN_PID $PRELOAD_PID

echo "⚡ Starting Electron application..."

# Start Electron
npm run electron &
ELECTRON_PID=$!

echo "✅ Development environment started!"
echo ""
echo "📝 PIDs:"
echo "   Main build: $MAIN_PID"
echo "   Renderer dev server: $RENDERER_PID" 
echo "   Electron app: $ELECTRON_PID"
echo ""
echo "🔧 To stop all processes: Ctrl+C or run './scripts/stop-dev.sh'"

# Trap Ctrl+C and cleanup
trap 'echo "🛑 Stopping development environment..."; kill $RENDERER_PID $ELECTRON_PID 2>/dev/null; exit 0' INT

# Wait for processes
wait