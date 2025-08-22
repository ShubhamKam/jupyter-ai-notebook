#!/data/data/com.termux/files/usr/bin/bash

# Termux Middleware Script for AI Notebook App
# Run this once in Termux to enable app access to Claude CLI
# Usage: bash termux-middleware.sh

echo "🚀 Setting up Termux Middleware for AI Notebook App"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Claude CLI is installed
check_claude() {
    echo -e "${BLUE}📋 Checking Claude CLI installation...${NC}"
    
    if command -v claude &> /dev/null; then
        VERSION=$(claude --version 2>/dev/null || echo "Unknown version")
        echo -e "${GREEN}✅ Claude CLI found: $VERSION${NC}"
        return 0
    else
        echo -e "${RED}❌ Claude CLI not found${NC}"
        echo -e "${YELLOW}💡 Install with: pkg install -y nodejs && npm install -g @anthropic-ai/claude-code${NC}"
        return 1
    fi
}

# Create simple HTTP middleware server
create_middleware() {
    echo -e "${BLUE}🔧 Creating middleware server...${NC}"
    
    cat > /data/data/com.termux/files/home/claude-middleware.js << 'EOF'
#!/usr/bin/env node

/**
 * Simple Claude CLI Middleware Server
 * Lightweight proxy between app and Claude CLI
 */

const http = require('http');
const { exec } = require('child_process');
const PORT = 8888; // Different port to avoid conflicts

console.log('🚀 Claude CLI Middleware Server Starting...');

const server = http.createServer((req, res) => {
    // Set CORS headers for app access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.method === 'GET' && req.url === '/health') {
        // Simple health check
        exec('claude --version', (error, stdout, stderr) => {
            const response = {
                status: error ? 'error' : 'ok',
                claude_available: !error,
                version: stdout?.trim() || 'unknown',
                timestamp: new Date().toISOString()
            };
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(response));
        });
        return;
    }
    
    if (req.method === 'POST' && req.url === '/claude') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { prompt, command } = JSON.parse(body);
                const claudeCommand = command || `echo "${prompt?.replace(/"/g, '\\"')}" | claude -p`;
                
                console.log(`📝 Executing: ${claudeCommand}`);
                
                exec(claudeCommand, { 
                    timeout: 30000,
                    maxBuffer: 1024 * 1024 // 1MB buffer
                }, (error, stdout, stderr) => {
                    const response = {
                        success: !error,
                        output: stdout || stderr || '',
                        error: error?.message || null,
                        timestamp: new Date().toISOString()
                    };
                    
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify(response));
                    
                    if (error) {
                        console.log(`❌ Error: ${error.message}`);
                    } else {
                        console.log(`✅ Response sent (${stdout?.length || 0} chars)`);
                    }
                });
                
            } catch (parseError) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid JSON in request body'
                }));
            }
        });
        return;
    }
    
    // 404 for other paths
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({error: 'Not found'}));
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ Middleware server running on http://127.0.0.1:${PORT}`);
    console.log(`📋 Health check: http://127.0.0.1:${PORT}/health`);
    console.log(`🤖 Claude endpoint: http://127.0.0.1:${PORT}/claude`);
    console.log('🎯 Ready for AI Notebook App connections!');
    console.log('\n💡 Keep this running while using the AI Notebook App');
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is already in use. Stop other services or use a different port.`);
    } else {
        console.log(`❌ Server error: ${error.message}`);
    }
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down middleware server...');
    server.close(() => {
        console.log('✅ Middleware server stopped');
        process.exit(0);
    });
});
EOF

    chmod +x /data/data/com.termux/files/home/claude-middleware.js
    echo -e "${GREEN}✅ Middleware server created at ~/claude-middleware.js${NC}"
}

# Create startup script
create_startup_script() {
    echo -e "${BLUE}🔧 Creating startup script...${NC}"
    
    cat > /data/data/com.termux/files/home/start-claude-middleware << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash

echo "🚀 Starting Claude CLI Middleware for AI Notebook App..."

# Check if already running
if pgrep -f "claude-middleware.js" > /dev/null; then
    echo "⚠️  Middleware already running. Stopping first..."
    pkill -f "claude-middleware.js"
    sleep 2
fi

# Start the middleware
cd /data/data/com.termux/files/home
node claude-middleware.js &

echo "✅ Middleware started! Check http://127.0.0.1:8888/health"
echo "💡 Keep this running while using the AI Notebook App"
EOF

    chmod +x /data/data/com.termux/files/home/start-claude-middleware
    echo -e "${GREEN}✅ Startup script created: ~/start-claude-middleware${NC}"
}

# Create stop script
create_stop_script() {
    cat > /data/data/com.termux/files/home/stop-claude-middleware << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash

echo "🛑 Stopping Claude CLI Middleware..."

if pgrep -f "claude-middleware.js" > /dev/null; then
    pkill -f "claude-middleware.js"
    echo "✅ Middleware stopped"
else
    echo "ℹ️  Middleware not running"
fi
EOF

    chmod +x /data/data/com.termux/files/home/stop-claude-middleware
    echo -e "${GREEN}✅ Stop script created: ~/stop-claude-middleware${NC}"
}

# Test the middleware
test_middleware() {
    echo -e "${BLUE}🧪 Testing middleware setup...${NC}"
    
    # Start middleware in background
    cd /data/data/com.termux/files/home
    node claude-middleware.js &
    MIDDLEWARE_PID=$!
    
    # Wait a moment for startup
    sleep 3
    
    # Test health check
    if curl -s http://127.0.0.1:8888/health > /dev/null; then
        echo -e "${GREEN}✅ Middleware health check passed${NC}"
        
        # Test Claude CLI through middleware
        RESPONSE=$(curl -s -X POST http://127.0.0.1:8888/claude \
            -H "Content-Type: application/json" \
            -d '{"prompt": "Hello Claude!"}')
        
        if echo "$RESPONSE" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ Claude CLI integration working through middleware${NC}"
        else
            echo -e "${YELLOW}⚠️  Claude CLI test had issues (but middleware is running)${NC}"
        fi
    else
        echo -e "${RED}❌ Middleware health check failed${NC}"
    fi
    
    # Stop test middleware
    kill $MIDDLEWARE_PID 2>/dev/null
    sleep 1
}

# Main setup process
main() {
    echo -e "${BLUE}Starting Termux middleware setup...${NC}"
    
    # Check requirements
    if ! check_claude; then
        echo -e "${YELLOW}⚠️  Claude CLI not found, but continuing setup...${NC}"
    fi
    
    # Create components
    create_middleware
    create_startup_script
    create_stop_script
    
    echo -e "\n${GREEN}🎉 Termux Middleware Setup Complete!${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo -e "${YELLOW}📋 USAGE INSTRUCTIONS:${NC}"
    echo -e "  1️⃣  Start middleware: ${BLUE}~/start-claude-middleware${NC}"
    echo -e "  2️⃣  Open AI Notebook App"
    echo -e "  3️⃣  App will connect to middleware automatically"
    echo -e "  4️⃣  Stop middleware: ${BLUE}~/stop-claude-middleware${NC}"
    echo -e ""
    echo -e "${YELLOW}🔗 Middleware URLs:${NC}"
    echo -e "  • Health: ${BLUE}http://127.0.0.1:8888/health${NC}"
    echo -e "  • Claude: ${BLUE}http://127.0.0.1:8888/claude${NC}"
    echo -e ""
    echo -e "${YELLOW}💡 Tips:${NC}"
    echo -e "  • Run middleware in background with: ${BLUE}~/start-claude-middleware &${NC}"
    echo -e "  • Check if running: ${BLUE}pgrep -f claude-middleware${NC}"
    echo -e "  • View logs: Check terminal output"
    echo -e ""
    echo -e "${GREEN}✨ Ready to use with AI Notebook App!${NC}"
    
    # Offer to test
    read -p "🧪 Test the middleware now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_middleware
    fi
}

# Run main setup
main