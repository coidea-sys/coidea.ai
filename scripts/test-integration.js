#!/usr/bin/env node
/**
 * Integration Test Script
 * Run: node scripts/test-integration.js
 */

const http = require('http');

// Set env before imports
process.env.PORT = '0'; // Random port
process.env.NETWORK = 'localhost';

// Check config BEFORE importing app
const config = require('../backend/config');
console.log('Config check:');
console.log('  NETWORK:', process.env.NETWORK);
console.log('  aiAgentRegistry:', config.contracts.aiAgentRegistry || '❌ NOT SET');
console.log('');

const app = require('../backend/index');

const TEST_ACCOUNT = {
  agent: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
};

function makeRequest(method, path, data, port) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(body)
          });
        } catch {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running Integration Tests...\n');

  // Start server
  const server = app.listen(0, () => {
    const port = server.address().port;
    console.log(`✅ Server started on port ${port}\n`);
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
  const port = server.address().port;

  try {
    // Test 1: Health check
    console.log('Test 1: Health Check');
    const health = await makeRequest('GET', '/health', null, port);
    console.log('  Status:', health.status);
    console.log('  Response:', health.body);
    console.log(health.body.status === 'ok' ? '  ✅ PASS\n' : '  ❌ FAIL\n');

    // Test 2: Register agent
    console.log('Test 2: Register Agent');
    const agent = await makeRequest('POST', '/api/agents/register', {
      agentName: 'Integration Test Agent',
      agentURI: 'ipfs://QmTest',
      agentWallet: TEST_ACCOUNT.agent,
      privateKey: TEST_ACCOUNT.privateKey
    }, port);
    console.log('  Status:', agent.status);
    console.log('  Response:', JSON.stringify(agent.body, null, 2));
    
    if (agent.status === 200 && agent.body.success) {
      console.log('  ✅ PASS\n');
    } else if (agent.body.error?.includes('already registered')) {
      console.log('  ⚠️  Agent already exists (OK)\n');
    } else {
      console.log('  ❌ FAIL:', agent.body.error, '\n');
    }

    // Test 3: Get agent
    console.log('Test 3: Get Agent by ID');
    const getAgent = await makeRequest('GET', '/api/agents/0', null, port);
    console.log('  Status:', getAgent.status);
    console.log('  Response:', JSON.stringify(getAgent.body, null, 2));
    console.log(getAgent.status === 200 ? '  ✅ PASS\n' : '  ❌ FAIL\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    server.close();
    console.log('✅ Tests completed');
    process.exit(0);
  }
}

runTests();
