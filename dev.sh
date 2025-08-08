#!/bin/bash

# Plaggona Metaverse Development Script
# This script runs the metaverse locally for development

set -e

echo "🌍 Starting Plaggona Metaverse Development Server..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not found. Please install Node.js."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing server on port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
    echo "🔥 Stopping existing server on port 3000..."
    kill $(lsof -Pi :3000 -sTCP:LISTEN -t) || true
    sleep 2
fi

# Start the development server
echo "🚀 Starting development server on http://localhost:3000"
echo "   Press Ctrl+C to stop"
echo ""

# Use nodemon if available for auto-restart
if command -v npx &> /dev/null && npm list nodemon >/dev/null 2>&1; then
    npx nodemon server.js
else
    node server.js
fi
