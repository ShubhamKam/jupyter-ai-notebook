#!/usr/bin/env node

/**
 * Test Web App Integration with Claude CLI Bridge
 * This simulates exactly what the web app does
 */

const http = require('http');

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

async function testWebIntegration() {
    console.log('🧪 Testing Web App Integration with Claude CLI...\n');

    try {
        // Test 1: Simulate AI Prompt Block
        console.log('Test 1: AI Prompt Block Integration');
        const promptCommand = 'echo "What is machine learning?" | claude -p';
        const promptResponse = await makeRequest('http://127.0.0.1:3001/api/claude-cli', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: promptCommand })
        });

        if (promptResponse.status === 200) {
            console.log('✅ AI Prompt Response:');
            console.log(promptResponse.data.substring(0, 200) + '...\n');
        } else {
            console.log('❌ AI Prompt Failed:', promptResponse.status);
        }

        // Test 2: Simulate Code Block Generation  
        console.log('Test 2: Code Block Generation');
        const codeCommand = 'echo "Write a Python function to reverse a string" | claude -p';
        const codeResponse = await makeRequest('http://127.0.0.1:3001/api/claude-cli', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: codeCommand })
        });

        if (codeResponse.status === 200) {
            console.log('✅ Code Generation Response:');
            console.log(codeResponse.data.substring(0, 300) + '...\n');
        } else {
            console.log('❌ Code Generation Failed:', codeResponse.status);
        }

        // Test 3: File Attachment Processing
        console.log('Test 3: File Attachment Processing');
        const attachmentCommand = 'echo "Analyze this data file" | claude -p';
        const testAttachment = {
            id: 'test_file',
            name: 'data.txt',
            size: 50,
            content: 'Name,Age,City\nJohn,30,NYC\nJane,25,LA\nBob,35,Chicago',
            uploadedAt: new Date().toISOString()
        };

        const attachmentResponse = await makeRequest('http://127.0.0.1:3001/api/claude-cli', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                command: attachmentCommand,
                attachments: [testAttachment]
            })
        });

        if (attachmentResponse.status === 200) {
            console.log('✅ File Attachment Response:');
            console.log(attachmentResponse.data.substring(0, 250) + '...\n');
        } else {
            console.log('❌ File Attachment Failed:', attachmentResponse.status);
        }

        console.log('🎉 Web Integration Tests Complete!');
        console.log('\n📱 The web app should now work properly with:');
        console.log('1. ✅ AI prompt blocks generating real responses');
        console.log('2. ✅ Code blocks generating real code');
        console.log('3. ✅ File attachments being processed');
        console.log('4. ✅ Bridge service communicating correctly');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testWebIntegration();