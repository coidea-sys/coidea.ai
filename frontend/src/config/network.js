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
      LiabilityPreset: process.env.REACT_APP_LOCAL_LIABILITY_PRESET_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    },
    // 责任预设 ID
    liabilityPresets: {
      STANDARD: '0xa3fb30056d2c05f0b310151a52bfffabfc375a5f39efdcc17184b34cb3f5d9e1',
      LIMITED: '0x2a9f784d89f900f485f2f888a68d66d840fa9cea3b9dea64f2903dbbf89b7675',
      INSURED: '0x0e23468e1abbcbb31d08ab18aa8df8953b5acd751a0c4725ae27b44d0e8c2f93',
      BONDED: '0x9d9297abed392649589abfa441f0a17b4903c1bc2fbed7231ca3434e0532e837'
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
      LiabilityPreset: process.env.REACT_APP_AMOY_LIABILITY_PRESET_ADDRESS,
    },
    liabilityPresets: {
      STANDARD: process.env.REACT_APP_AMOY_PRESET_STANDARD,
      LIMITED: process.env.REACT_APP_AMOY_PRESET_LIMITED,
      INSURED: process.env.REACT_APP_AMOY_PRESET_INSURED,
      BONDED: process.env.REACT_APP_AMOY_PRESET_BONDED,
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
      LiabilityPreset: process.env.REACT_APP_POLYGON_LIABILITY_PRESET_ADDRESS,
    },
    liabilityPresets: {
      STANDARD: process.env.REACT_APP_POLYGON_PRESET_STANDARD,
      LIMITED: process.env.REACT_APP_POLYGON_PRESET_LIMITED,
      INSURED: process.env.REACT_APP_POLYGON_PRESET_INSURED,
      BONDED: process.env.REACT_APP_POLYGON_PRESET_BONDED,
    }
  }
};

// 当前环境
const CURRENT_NETWORK = process.env.REACT_APP_NETWORK || 'localhost';

export const getNetworkConfig = () => NETWORKS[CURRENT_NETWORK];

export const getContractAddress = (name) => {
  return NETWORKS[CURRENT_NETWORK]?.contracts[name];
};

export const getLiabilityPresets = () => {
  return NETWORKS[CURRENT_NETWORK]?.liabilityPresets || {};
};

export const isLocal = () => CURRENT_NETWORK === 'localhost';

export const isAmoy = () => CURRENT_NETWORK === 'amoy';

export const isMainnet = () => CURRENT_NETWORK === 'polygon';

export default NETWORKS;
