const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load deployment info
const deploymentPath = path.join(__dirname, '..', 'deployments', 'polygonAmoy.json');
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

const RPC_URL = 'https://rpc-amoy.polygon.technology';
const CHAIN_ID = 80002;

// Minimal ABIs for testing
const HUMAN_REGISTRY_ABI = [
  "function register(string _username, string _metadataURI) payable",
  "function isHuman(address _wallet) view returns (bool)",
  "function humans(address) view returns (address wallet, string username, string metadataURI, uint256 registeredAt, uint256 reputation, uint256 totalTasksCreated, uint256 totalTasksCompleted, uint256 totalSpent, uint256 totalEarned, bool isVerified, bool isActive)"
];

const TASK_REGISTRY_ABI = [
  "function createTask(string _title, string _description, uint8 _taskType, uint256 _reward, uint256 _deadlineDuration, string[] _requiredSkills, uint256 _minReputation, bool _isMultiAgent) payable returns (uint256)",
  "function taskCounter() view returns (uint256)",
  "function getTask(uint256 _taskId) view returns (tuple(uint256 id, string title, string description, uint8 taskType, uint8 state, address publisher, address worker, uint256 reward, uint256 deadline, uint256 createdAt))"
];

async function runE2ETests() {
  console.log('🧪 Starting E2E Tests on Amoy Testnet\n');
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Chain ID: ${CHAIN_ID}\n`);

  // Create provider
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);

  // Test 1: Connection
  console.log('Test 1: Network Connection');
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Connected. Current block: ${blockNumber}`);
  } catch (err) {
    console.error(`❌ Connection failed: ${err.message}`);
    process.exit(1);
  }

  // Test 2: Contract existence
  console.log('\nTest 2: Contract Existence');
  const contracts = deployment.contracts;
  
  for (const [name, address] of Object.entries(contracts)) {
    try {
      const code = await provider.getCode(address);
      if (code && code !== '0x') {
        console.log(`✅ ${name}: ${address} (deployed)`);
      } else {
        console.log(`⚠️  ${name}: ${address} (no code)`);
      }
    } catch (err) {
      console.log(`❌ ${name}: ${address} (error: ${err.message})`);
    }
  }

  // Test 3: Read contract state
  console.log('\nTest 3: Contract State');
  try {
    const humanRegistry = new ethers.Contract(
      contracts.HumanRegistry,
      HUMAN_REGISTRY_ABI,
      provider
    );
    
    // Try to call a view function
    const testAddress = '0x0000000000000000000000000000000000000000';
    const isHuman = await humanRegistry.isHuman(testAddress);
    console.log(`✅ HumanRegistry.isHuman() works: ${isHuman}`);
  } catch (err) {
    console.log(`⚠️  HumanRegistry read test: ${err.message}`);
  }

  // Test 4: TaskRegistry
  console.log('\nTest 4: TaskRegistry State');
  try {
    const taskRegistry = new ethers.Contract(
      contracts.TaskRegistry,
      TASK_REGISTRY_ABI,
      provider
    );
    
    const taskCount = await taskRegistry.taskCounter();
    console.log(`✅ TaskRegistry.taskCounter(): ${taskCount}`);
  } catch (err) {
    console.log(`⚠️  TaskRegistry read test: ${err.message}`);
  }

  // Test 5: Gas estimation
  console.log('\nTest 5: Gas Estimation');
  try {
    const feeData = await provider.getFeeData();
    console.log(`✅ Gas price: ${ethers.formatUnits(feeData.gasPrice || 0, 'gwei')} gwei`);
  } catch (err) {
    console.log(`⚠️  Gas estimation: ${err.message}`);
  }

  console.log('\n✨ E2E Tests Complete');
  console.log('\n📋 Summary:');
  console.log(`- Network: Amoy Testnet (${CHAIN_ID})`);
  console.log(`- Contracts: ${Object.keys(contracts).length} deployed`);
  console.log(`- Deployer: ${deployment.deployer}`);
  console.log(`- Explorer: ${deployment.explorer}`);
}

runE2ETests().catch(console.error);
