#!/bin/bash

# AI Code Studio - Start with Claude CLI Integration
# This script starts both the web server and Claude CLI bridge service

echo "🚀 Starting AI Code Studio with Claude CLI Integration..."

# Check if we're in the right directory
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: Please run this script from the jupyter-ai directory"
    exit 1
fi

# Check if Claude CLI is installed
if ! command -v claude &> /dev/null; then
    echo "⚠️  Warning: Claude CLI not found. Install it with:"
    echo "    npm install -g claude-code"
    echo "    OR follow: https://github.com/anthropics/claude-code"
    echo ""
    echo "📱 Starting anyway - app will use simulation mode..."
else
    echo "✅ Claude CLI found: $(claude --version)"
fi

# Start Claude CLI Bridge Service in background
echo "🔧 Starting Claude CLI Bridge Service..."
cd dist
node claude-cli-bridge.js &
BRIDGE_PID=$!

# Wait for bridge to start
sleep 2

# Start web server
echo "🌐 Starting Web Server..."
python3 -m http.server 3000 --bind 0.0.0.0 &
WEB_PID=$!

echo ""
echo "🎉 Services started successfully!"
echo "📱 Web App: http://localhost:3000"
echo "🔗 Claude CLI Bridge: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BRIDGE_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    echo "👋 All services stopped. Goodbye!"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for either service to exit
wait