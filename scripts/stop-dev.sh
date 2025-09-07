#!/bin/bash

# MC Coordinate Keeper - Stop Development Script
echo "🛑 Stopping MC Coordinate Keeper Development Environment..."

# Kill processes by name
echo "🔄 Stopping webpack dev server..."
pkill -f "webpack serve"

echo "🔄 Stopping webpack main build..."
pkill -f "webpack.*webpack.main.config.js"

echo "🔄 Stopping Electron..."
pkill -f "electron"

echo "🔄 Stopping Python service..."
pkill -f "python.*main.py"

echo "✅ All development processes stopped!"