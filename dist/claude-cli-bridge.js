#!/usr/bin/env node
/**
 * Claude CLI Bridge Service
 * Provides HTTP API to execute Claude CLI commands from the web app
 */

const http = require('http');
const { exec } = require('child_process');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

// CORS headers for browser requests
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

function executeCommand(command, attachments, timeout = 30000) {
    return new Promise((resolve, reject) => {
        console.log(`Executing: ${command}`);
        
        // Track working directory and files before command execution
        const workingDir = process.cwd();
        let existingFiles = [];
        const createdAttachmentFiles = [];
        
        try {
            existingFiles = fs.readdirSync(workingDir);
        } catch (error) {
            console.warn('Could not read directory before command execution');
        }
        
        // Create temporary files for attachments
        if (attachments && attachments.length > 0) {
            console.log(`📎 Processing ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}...`);
            
            for (const attachment of attachments) {
                try {
                    const tempFileName = `temp_${Date.now()}_${attachment.name}`;
                    const tempFilePath = path.join(workingDir, tempFileName);
                    fs.writeFileSync(tempFilePath, attachment.content, 'utf8');
                    createdAttachmentFiles.push(tempFileName);
                    console.log(`📁 Created temporary file: ${tempFileName} (${attachment.size} bytes)`);
                } catch (error) {
                    console.error(`Failed to create temporary file for ${attachment.name}:`, error.message);
                }
            }
        }
        
        exec(command, { 
            timeout,
            env: { 
                ...process.env, 
                PATH: '/data/data/com.termux/files/usr/bin:' + process.env.PATH,
                TERMUX_VERSION: process.env.TERMUX_VERSION || '1'
            },
            cwd: workingDir
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command failed: ${error.message}`);
                reject({
                    success: false,
                    error: error.message,
                    code: error.code
                });
            } else {
                const result = stdout || stderr || '';
                console.log(`Command output: ${result.substring(0, 200)}...`);
                
                // Check for new files created by Claude
                const artifacts = [];
                try {
                    const currentFiles = fs.readdirSync(workingDir);
                    const newFiles = currentFiles.filter(file => !existingFiles.includes(file));
                    
                    for (const newFile of newFiles) {
                        try {
                            const filePath = path.join(workingDir, newFile);
                            const stats = fs.statSync(filePath);
                            
                            // Only include text files and reasonable size files (< 1MB)
                            if (stats.isFile() && stats.size < 1024 * 1024) {
                                const content = fs.readFileSync(filePath, 'utf8');
                                artifacts.push({
                                    filename: newFile,
                                    type: path.extname(newFile) || 'text',
                                    size: stats.size,
                                    content: content,
                                    created: stats.ctime.toISOString()
                                });
                                console.log(`📁 Artifact captured: ${newFile} (${stats.size} bytes)`);
                            }
                        } catch (fileError) {
                            console.warn(`Could not read artifact ${newFile}:`, fileError.message);
                        }
                    }
                } catch (dirError) {
                    console.warn('Could not check for new files:', dirError.message);
                }
                
                // Cleanup temporary attachment files
                for (const tempFile of createdAttachmentFiles) {
                    try {
                        const tempFilePath = path.join(workingDir, tempFile);
                        if (fs.existsSync(tempFilePath)) {
                            fs.unlinkSync(tempFilePath);
                            console.log(`🧹 Cleaned up temporary file: ${tempFile}`);
                        }
                    } catch (cleanupError) {
                        console.warn(`Could not cleanup temp file ${tempFile}:`, cleanupError.message);
                    }
                }
                
                resolve({
                    success: true,
                    output: result,
                    stderr: stderr || '',
                    artifacts: artifacts,
                    attachmentsProcessed: createdAttachmentFiles.length
                });
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    // Set CORS headers
    Object.keys(CORS_HEADERS).forEach(key => {
        res.setHeader(key, CORS_HEADERS[key]);
    });

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    
    if (req.method === 'POST' && parsedUrl.pathname === '/api/claude-cli') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const { command, attachments } = JSON.parse(body);
                
                if (!command) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: 'Command is required' 
                    }));
                    return;
                }

                // Security check - only allow claude commands and basic utilities
                if (!command.includes('claude') && 
                    !command.includes('echo') && 
                    !command.includes('which') &&
                    !command.includes('--version')) {
                    res.writeHead(403);
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: 'Command not allowed' 
                    }));
                    return;
                }

                // Use claude command directly - symlink should work
                const processedCommand = command;

                const result = await executeCommand(processedCommand, attachments);
                
                res.writeHead(200);
                
                // If there are artifacts, return structured response
                if (result.artifacts && result.artifacts.length > 0) {
                    const response = {
                        output: result.output,
                        artifacts: result.artifacts,
                        success: true
                    };
                    res.end(JSON.stringify(response));
                } else {
                    // Return just the output for backward compatibility
                    res.end(result.output || JSON.stringify(result));
                }
                
            } catch (error) {
                console.error('Request error:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ 
                    success: false, 
                    error: error.message || 'Internal server error' 
                }));
            }
        });
        
    } else if (req.method === 'GET' && parsedUrl.pathname === '/api/health') {
        // Health check endpoint
        try {
            const result = await executeCommand('/data/data/com.termux/files/usr/bin/claude --version');
            res.writeHead(200);
            res.end(JSON.stringify({
                status: 'healthy',
                claude_cli: result.success,
                claude_version: result.output?.trim() || 'unknown'
            }));
        } catch (error) {
            res.writeHead(200);
            res.end(JSON.stringify({
                status: 'degraded',
                claude_cli: false,
                error: error.message
            }));
        }
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Claude CLI Bridge Service running on http://127.0.0.1:${PORT}`);
    console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
    console.log('Ready to bridge Claude CLI commands from web app!');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Claude CLI Bridge Service...');
    server.close(() => {
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});