// 网络配置
const NETWORKS = {
  localhost: {
    name: 'Local Hardhat',
    chainId: 31337,
    rpc: 'http://127.0.0.1:8545',
    contracts: {
      AIAgentRegistry: process.env.REACT_APP_LOCAL_AI_AGENT_REGISTRY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      HumanLevelNFT: process.env.REACT_APP_LOCAL_HUMAN_LEVEL_NFT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      TaskRegistry: process.env.REACT_APP_LOCAL_TASK_REGISTRY_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      X402Payment: process.env.REACT_APP_LOCAL_X402_PAYMENT_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      CommunityGovernance: process.env.REACT_APP_LOCAL_COMMUNITY_GOVERNANCE_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    }
  },
  amoy: {
    name: 'Polygon Amoy',
    chainId: 80002,
    rpc: 'https://rpc-amoy.polygon.technology',
    contracts: {
      AIAgentRegistry: process.env.REACT_APP_AMOY_AI_AGENT_REGISTRY_ADDRESS,
      HumanLevelNFT: process.env.REACT_APP_AMOY_HUMAN_LEVEL_NFT_ADDRESS,
      TaskRegistry: process.env.REACT_APP_AMOY_TASK_REGISTRY_ADDRESS,
      X402Payment: process.env.REACT_APP_AMOY_X402_PAYMENT_ADDRESS,
    }
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpc: 'https://polygon-rpc.com',
    contracts: {
      AIAgentRegistry: process.env.REACT_APP_POLYGON_AI_AGENT_REGISTRY_ADDRESS,
      HumanLevelNFT: process.env.REACT_APP_POLYGON_HUMAN_LEVEL_NFT_ADDRESS,
      TaskRegistry: process.env.REACT_APP_POLYGON_TASK_REGISTRY_ADDRESS,
      X402Payment: process.env.REACT_APP_POLYGON_X402_PAYMENT_ADDRESS,
    }
  }
};

// 当前环境
const CURRENT_NETWORK = process.env.REACT_APP_NETWORK || 'localhost';

export const getNetworkConfig = () => NETWORKS[CURRENT_NETWORK];

export const getContractAddress = (name) => {
  return NETWORKS[CURRENT_NETWORK]?.contracts[name];
};

export const isLocal = () => CURRENT_NETWORK === 'localhost';

export const isAmoy = () => CURRENT_NETWORK === 'amoy';

export const isMainnet = () => CURRENT_NETWORK === 'polygon';

export default NETWORKS;
