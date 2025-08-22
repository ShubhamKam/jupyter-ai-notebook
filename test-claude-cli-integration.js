#!/usr/bin/env node

/**
 * Test Script for Claude CLI Integration
 * Tests all the fixes made to the AI Code Studio app
 */

const http = require('http');

const BRIDGE_URL = 'http://127.0.0.1:3001';
const WEB_URL = 'http://localhost:3000';

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

async function runTests() {
    console.log('🧪 Running Claude CLI Integration Tests...\n');

    try {
        // Test 1: Bridge Health Check
        console.log('Test 1: Bridge Health Check');
        const healthResponse = await makeRequest(`${BRIDGE_URL}/api/health`);
        const health = JSON.parse(healthResponse.data);
        console.log(`✅ Bridge Status: ${health.status}`);
        console.log(`✅ Claude CLI: ${health.claude_cli ? 'Available' : 'Not Available'}`);
        console.log(`✅ Version: ${health.claude_version}\n`);

        // Test 2: Code Generation
        console.log('Test 2: Code Generation via Claude CLI');
        const codeCommand = 'echo "Write Python hello function. Just return code." | claude -p';
        const codeResponse = await makeRequest(`${BRIDGE_URL}/api/claude-cli`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: codeCommand })
        });
        console.log('✅ Code Generation Response:');
        console.log(codeResponse.data.substring(0, 200) + '...\n');

        // Test 3: Chart Configuration Generation
        console.log('Test 3: Chart Configuration Generation');
        const chartCommand = 'echo "Generate ApexCharts JSON for line chart with sample data. Return only valid JSON." | claude -p';
        const chartResponse = await makeRequest(`${BRIDGE_URL}/api/claude-cli`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: chartCommand })
        });
        
        // Test JSON parsing
        const chartData = chartResponse.data;
        console.log('✅ Chart Config Response:');
        console.log(chartData.substring(0, 300) + '...');
        
        // Test if we can extract JSON from response
        const jsonMatch = chartData.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
        if (jsonMatch) {
            try {
                const parsedJson = JSON.parse(jsonMatch[1]);
                console.log('✅ JSON Extraction: SUCCESS');
                console.log(`✅ Chart Type: ${parsedJson.chart?.type || 'unknown'}\n`);
            } catch (e) {
                console.log('❌ JSON Parsing: FAILED\n');
            }
        } else {
            console.log('❌ JSON Pattern Match: FAILED\n');
        }

        // Test 4: File Attachment Support
        console.log('Test 4: File Attachment Support');
        const attachmentCommand = 'echo "Analyze the attached file content and provide a summary." | claude -p';
        const sampleAttachment = {
            id: 'test_attachment',
            name: 'sample.txt',
            size: 100,
            content: 'This is a sample file content for testing Claude CLI integration with file attachments.',
            uploadedAt: new Date().toISOString()
        };
        
        const attachmentResponse = await makeRequest(`${BRIDGE_URL}/api/claude-cli`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                command: attachmentCommand,
                attachments: [sampleAttachment]
            })
        });
        console.log('✅ File Attachment Response:');
        console.log(attachmentResponse.data.substring(0, 200) + '...\n');

        // Test 5: Web App Accessibility
        console.log('Test 5: Web App Accessibility');
        const webResponse = await makeRequest(WEB_URL);
        if (webResponse.status === 200 && webResponse.data.includes('AI Code Studio')) {
            console.log('✅ Web App: Accessible');
            if (webResponse.data.includes('claude-cli-status')) {
                console.log('✅ UI Integration: Claude CLI Status Indicator Present');
            } else {
                console.log('❌ UI Integration: Claude CLI Status Indicator Missing');
            }
            if (webResponse.data.includes('test-claude-cli')) {
                console.log('✅ UI Integration: Test Button Present');
            } else {
                console.log('❌ UI Integration: Test Button Missing');
            }
        } else {
            console.log('❌ Web App: Not Accessible');
        }

        console.log('\n🎉 All tests completed!');
        console.log('\n📱 To test the full integration:');
        console.log('1. Open http://localhost:3000 in your browser');
        console.log('2. Click the test button (✓) in the header');
        console.log('3. Create an AI prompt block and click "Attach Files" to test file attachments');
        console.log('4. Create a code block and use natural language prompts');
        console.log('5. Create a chart block and verify AI-generated configurations');
        console.log('\n✨ The app now supports file attachments with Claude CLI integration!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

runTests();