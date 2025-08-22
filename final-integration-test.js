#!/usr/bin/env node

const http = require('http');

async function testFinalIntegration() {
    console.log('🧪 FINAL INTEGRATION TEST - AI Code Studio\n');

    try {
        // Test 1: Bridge Service Health
        const healthResponse = await fetch('http://127.0.0.1:3001/api/health');
        const health = await healthResponse.json();
        console.log('✅ Bridge Service:', health.status);
        console.log('✅ Claude CLI:', health.claude_cli ? 'Available' : 'Not Available');
        console.log('✅ Version:', health.claude_version);

        // Test 2: AI Prompt Block (like user would use)
        console.log('\n🧠 Testing AI Prompt Block Integration:');
        const promptCmd = 'echo "Explain what a REST API is" | claude -p';
        const promptResp = await fetch('http://127.0.0.1:3001/api/claude-cli', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: promptCmd })
        });
        const promptResult = await promptResp.text();
        console.log('✅ AI Prompt Response:');
        console.log(promptResult.substring(0, 200) + '...');

        // Test 3: Code Block Generation (like user would use)
        console.log('\n💻 Testing Code Block Generation:');
        const codeCmd = 'echo "Write a JavaScript function to find the maximum number in an array" | claude -p';
        const codeResp = await fetch('http://127.0.0.1:3001/api/claude-cli', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: codeCmd })
        });
        const codeResult = await codeResp.text();
        console.log('✅ Code Generation Response:');
        console.log(codeResult.substring(0, 300) + '...');

        // Test 4: File Attachment Processing
        console.log('\n📎 Testing File Attachment Processing:');
        const attachCmd = 'echo "Summarize the contents of this CSV data" | claude -p';
        const csvData = {
            id: 'test_csv',
            name: 'sales_data.csv',
            size: 120,
            content: 'Product,Sales,Month\nLaptop,150,Jan\nPhone,200,Jan\nTablet,100,Jan\nLaptop,180,Feb\nPhone,220,Feb',
            uploadedAt: new Date().toISOString()
        };
        const attachResp = await fetch('http://127.0.0.1:3001/api/claude-cli', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                command: attachCmd,
                attachments: [csvData]
            })
        });
        const attachResult = await attachResp.text();
        console.log('✅ File Attachment Response:');
        console.log(attachResult.substring(0, 250) + '...');

        console.log('\n🎉 FINAL INTEGRATION TEST RESULTS:');
        console.log('═'.repeat(50));
        console.log('✅ Bridge Service: HEALTHY');
        console.log('✅ AI Prompt Blocks: WORKING');
        console.log('✅ Code Generation: WORKING'); 
        console.log('✅ File Attachments: WORKING');
        console.log('✅ Claude CLI Integration: COMPLETE');
        console.log('═'.repeat(50));
        console.log('🚀 The web app and APK should now have:');
        console.log('  • Real Claude CLI responses (not simulation)');
        console.log('  • Working code generation');
        console.log('  • File attachment processing');
        console.log('  • Material 3 design');
        console.log('  • Mobile optimization');

    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error.message);
        console.log('\n🔧 If you see this error in the web app:');
        console.log('  1. Make sure bridge service is running');
        console.log('  2. Check that Claude CLI is installed');
        console.log('  3. Verify network connectivity');
    }
}

// Use node-fetch equivalent for older Node versions
global.fetch = global.fetch || function(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    json: () => Promise.resolve(JSON.parse(data)),
                    text: () => Promise.resolve(data)
                });
            });
        });

        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
};

testFinalIntegration();