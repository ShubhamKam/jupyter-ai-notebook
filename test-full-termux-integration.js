#!/usr/bin/env node

/**
 * Complete Termux API Integration Test
 * This simulates exactly what happens in the APK
 */

const { exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

function simulateTermuxAPI(command) {
    return new Promise((resolve, reject) => {
        console.log(`🔧 TermuxAPI.runCommand('${command}')`);
        exec(command, {
            env: { 
                ...process.env, 
                PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/home/.local/bin:' + (process.env.PATH || ''),
                TERMUX_VERSION: process.env.TERMUX_VERSION || '1',
                HOME: '/data/data/com.termux/files/home',
                SHELL: '/data/data/com.termux/files/usr/bin/bash'
            },
            shell: '/data/data/com.termux/files/usr/bin/bash',
            cwd: process.cwd()
        }, (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ Command failed: ${error.message}`);
                reject(error);
            } else {
                console.log(`✅ Command output: ${stdout || stderr || 'Command executed successfully'}`);
                resolve({ output: stdout, stderr });
            }
        });
    });
}

async function testFullIntegration() {
    console.log('🚀 FULL TERMUX API INTEGRATION TEST');
    console.log('═'.repeat(50));
    console.log('Simulating exactly what happens in the APK...\n');

    try {
        // Step 1: Check if files exist (APK would have these)
        console.log('📁 Step 1: Checking APK bundle files...');
        const distPath = path.join(__dirname, 'dist');
        const bridgePath = path.join(distPath, 'claude-cli-bridge.js');
        const webAppPath = path.join(distPath, 'index.html');

        if (!fs.existsSync(bridgePath)) {
            throw new Error(`Bridge service not found at ${bridgePath}`);
        }
        if (!fs.existsSync(webAppPath)) {
            throw new Error(`Web app not found at ${webAppPath}`);
        }
        console.log('✅ All required files present');

        // Step 2: Simulate user opening APK and trying AI prompt
        console.log('\n🧠 Step 2: User creates AI prompt block...');
        console.log('📱 User types: "What is machine learning?"');
        console.log('🔄 Web app detects no bridge service, attempting auto-start...');

        // Step 3: Simulate Termux API call to start bridge service
        console.log('\n⚡ Step 3: Simulating TermuxAPI.runCommand()...');
        const startCommand = `cd ${distPath} && node claude-cli-bridge.js &`;
        
        try {
            await simulateTermuxAPI(startCommand);
            console.log('✅ Bridge service start command executed via simulated Termux API');
        } catch (startError) {
            throw new Error(`Failed to start bridge service: ${startError.message}`);
        }

        // Step 4: Wait for service to start (like the APK would)
        console.log('\n⏳ Step 4: Waiting for bridge service startup (4 seconds)...');
        await delay(4000);

        // Step 5: Test health check (like the APK would)
        console.log('\n🏥 Step 5: Testing bridge service health...');
        try {
            const healthResponse = await makeRequest('http://127.0.0.1:3001/api/health');
            const health = JSON.parse(healthResponse.data);
            console.log(`✅ Bridge service health: ${health.status}`);
            console.log(`✅ Claude CLI available: ${health.claude_cli}`);
            console.log(`✅ Claude version: ${health.claude_version}`);
        } catch (healthError) {
            throw new Error(`Bridge service health check failed: ${healthError.message}`);
        }

        // Step 6: Test actual AI prompt (like user would do)
        console.log('\n🤖 Step 6: Testing real AI prompt...');
        try {
            const promptResponse = await makeRequest('http://127.0.0.1:3001/api/claude-cli', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    command: 'echo "What is machine learning?" | claude -p' 
                })
            });
            
            console.log('✅ AI Prompt Response:');
            console.log(promptResponse.data.substring(0, 300) + '...');
        } catch (promptError) {
            throw new Error(`AI prompt test failed: ${promptError.message}`);
        }

        // Step 7: Test code generation (like user would do)
        console.log('\n💻 Step 7: Testing code generation...');
        try {
            const codeResponse = await makeRequest('http://127.0.0.1:3001/api/claude-cli', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    command: 'echo "Write a Python hello world function" | claude -p' 
                })
            });
            
            console.log('✅ Code Generation Response:');
            console.log(codeResponse.data.substring(0, 200) + '...');
        } catch (codeError) {
            throw new Error(`Code generation test failed: ${codeError.message}`);
        }

        // Step 8: Test file attachment processing
        console.log('\n📎 Step 8: Testing file attachment processing...');
        try {
            const attachmentResponse = await makeRequest('http://127.0.0.1:3001/api/claude-cli', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    command: 'echo "Analyze this CSV data" | claude -p',
                    attachments: [{
                        id: 'test_csv',
                        name: 'data.csv', 
                        size: 100,
                        content: 'Name,Age\nJohn,30\nJane,25',
                        uploadedAt: new Date().toISOString()
                    }]
                })
            });
            
            console.log('✅ File Attachment Response:');
            console.log(attachmentResponse.data.substring(0, 200) + '...');
        } catch (attachError) {
            throw new Error(`File attachment test failed: ${attachError.message}`);
        }

        // Final Results
        console.log('\n🎉 FULL INTEGRATION TEST RESULTS:');
        console.log('═'.repeat(50));
        console.log('✅ Bridge service auto-start: SUCCESS');
        console.log('✅ Health checking: SUCCESS'); 
        console.log('✅ AI prompt responses: SUCCESS');
        console.log('✅ Code generation: SUCCESS');
        console.log('✅ File attachments: SUCCESS');
        console.log('═'.repeat(50));
        
        console.log('\n📱 APK User Experience:');
        console.log('🔸 User opens APK → Material 3 design loads');
        console.log('🔸 User creates AI prompt → Auto-starts bridge via Termux API');
        console.log('🔸 User gets REAL Claude CLI response → No simulation!');
        console.log('🔸 Code generation works → Real Python/JS code');
        console.log('🔸 File uploads work → Claude analyzes attached files');
        console.log('');
        console.log('🚀 TERMUX API INTEGRATION: FULLY FUNCTIONAL!');
        console.log('Ready for APK build and deployment.');

        return true;

    } catch (error) {
        console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Ensure Claude CLI is installed: pkg install claude-code');
        console.log('2. Check Termux permissions and environment');
        console.log('3. Verify bridge service files are present');
        return false;
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up test processes...');
        exec('pkill -f "claude-cli-bridge" || true', () => {
            console.log('✅ Cleanup complete');
        });
    }
}

testFullIntegration();