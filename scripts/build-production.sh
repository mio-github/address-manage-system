#!/bin/bash

# MC Coordinate Keeper - Production Build Script
echo "🏭 Building MC Coordinate Keeper for Production..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist dist-electron

# Create directories
mkdir -p dist/main dist/renderer

# Type check
echo "🔍 Running TypeScript type check..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "❌ TypeScript type check failed!"
    exit 1
fi

# Lint code
echo "🔍 Running ESLint..."
npm run lint
if [ $? -eq 0 ]; then
    echo "✅ Linting passed"
else
    echo "⚠️  Linting found issues (continuing build)"
fi

# Build main process
echo "🏗️  Building main process..."
npm run build:main
if [ $? -ne 0 ]; then
    echo "❌ Main process build failed!"
    exit 1
fi

# Build renderer process
echo "🏗️  Building renderer process..."
npm run build:renderer
if [ $? -ne 0 ]; then
    echo "❌ Renderer process build failed!"
    exit 1
fi

echo "✅ Production build completed successfully!"
echo ""
echo "🚀 To run the built application:"
echo "   npm start"
echo ""
echo "📦 To create distribution packages:"
echo "   npm run dist"