#!/bin/bash

# MC Coordinate Keeper - Initial Setup Script
echo "🎮 MC Coordinate Keeper - Initial Setup"
echo "=================================="

# Check system requirements
echo "🔍 Checking system requirements..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js found: $NODE_VERSION"
else
    echo "❌ Node.js not found!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm found: $NPM_VERSION"
else
    echo "❌ npm not found!"
    exit 1
fi

# Check Python (for future image analysis service)
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -V)
    echo "✅ Python found: $PYTHON_VERSION"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python -V)
    echo "✅ Python found: $PYTHON_VERSION"
else
    echo "⚠️  Python not found. Image analysis features will not work."
    echo "Please install Python 3.8+ from https://python.org/"
fi

echo ""
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🏗️  Creating necessary directories..."
mkdir -p dist/main dist/renderer
mkdir -p python-service

echo ""
echo "🔧 Setting up scripts permissions..."
chmod +x scripts/*.sh

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start development:"
echo "   ./scripts/start-dev.sh"
echo ""
echo "🛑 To stop development:"
echo "   ./scripts/stop-dev.sh"
echo ""
echo "📋 Other commands:"
echo "   npm run build     - Build for production"
echo "   npm run dist      - Create distribution package"
echo "   npm test          - Run tests"
echo "   npm run lint      - Run linting"