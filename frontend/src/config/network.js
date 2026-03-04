// 网络配置
const NETWORKS = {
  localhost: {
    name: 'Local Hardhat',
    chainId: 31337,
    rpc: 'http://127.0.0.1:8545',
    contracts: {
      // v0.2.0 - Deployed 2026-03-04
      HumanRegistry: '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF',
      AIAgentRegistry: '0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf',
      HumanLevelNFT: '0x9d4454B023096f34B160D6B654540c56A1F81688',
      CommunityGovernance: '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00',
      LiabilityRegistry: '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570',
      AgentCommunity: '0x809d550fca64d94Bd9F66E60752A544199cfAC3D',
      LiabilityPreset: '0x4c5859f0F772848b2D91F1D83E2Fe57935348029',
      AgentLifecycle: '0x1291Be112d480055DaFd8a610b7d1e203891C274',
      AgentRuntime: '0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154',
      HumanEconomy: '0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575',
      TaskRegistry: '0xCD8a1C3ba11CF5ECfa6267617243239504a98d90',
      X402Payment: '0x82e01223d51Eb87e16A03E24687EDF0F294da6f1',
    },
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
      // v0.2.0 - Deployed 2026-03-04
      HumanRegistry: '0xa7049DB55AE7D67FBC006734752DD1fe24687bE3',
      AIAgentRegistry: '0xB3b5b0955cFaDdB92b2433818159A1B4f7daaF78',
      HumanLevelNFT: '0xb42Bb4AcEf001b472f0A2838bD7EbC4Df544290D',
      CommunityGovernance: '0x7e1005053683C1F9697Dc90a071cDE350791F1e3',
      LiabilityRegistry: '0x93C9eF9C3ac2F7536F901b2c4d3CDa8FDceB526A',
      AgentCommunity: '0x303C3fa2d0F156372F5ec8689095C20D50431191',
      LiabilityPreset: '0x969133C8509b17956022aE4e43dC3B95577134A2',
      AgentLifecycle: '0xE342ba865025ee90Ff540Cc10c7192d15e813278',
      AgentRuntime: '0xccCe4726D5e480184b2aF51b39943e387F7acBd1',
      HumanEconomy: '0x2FC0a1B77047833Abb836048Dec3585f27c9f01a',
      TaskRegistry: '0xE8eb60EB3cFEaC27fb9D0bC52d5DE346206D3fAE',
      X402Payment: '0x608b0E50593B307CC7F09C1bE0Bd691107F8C87B',
    },
    liabilityPresets: {
      STANDARD: '0xa3fb30056d2c05f0b310151a52bfffabfc375a5f39efdcc17184b34cb3f5d9e1',
      LIMITED: '0x2a9f784d89f900f485f2f888a68d66d840fa9cea3b9dea64f2903dbbf89b7675',
      INSURED: '0x0e23468e1abbcbb31d08ab18aa8df8953b5acd751a0c4725ae27b44d0e8c2f93',
      BONDED: '0x9d9297abed392649589abfa441f0a17b4903c1bc2fbed7231ca3434e0532e837',
    }
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpc: 'https://polygon-rpc.com',
    wsUrl: 'wss://coidea-websocket.webthree549.workers.dev',
    contracts: {
      // v0.1.0
      AIAgentRegistry: '0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6',
      TaskRegistry: '0x3970FAf7708E18BD737C1f7fAD5c770FCD519Db5',
      X402Payment: '0x97738aE517ECDeD0cdfFB2aD7FB90Dfac803efbe',
      CommunityGovernance: '0x6AA35Fee046412830E371111Ddb15B74A145dF01',
      LiabilityPreset: '0xBE8EFdb2709687CE6128D629F868f28ECcaF1493',
      // v0.2.0
      HumanRegistry: '0x78BB5F702441B751D34d860474Acf6409585Aad8',
      HumanEconomy: '0x7e8ee79A7BdC624b9FCB8A37b91C7305A00c2D42',
      AgentLifecycle: '0x510fC8AD46EB0b010F0015b07c0EAc0C93B2599F',
      AgentRuntime: '0x22832750874A01Dc3Ba067C4f39197C4F1016cF9',
      AgentCommunity: '0xBF324dFc86d8F2Ad1e265B30d41e6453eA0E1169',
    },
    liabilityPresets: {
      STANDARD: '0xa3fb30056d2c05f0b310151a52bfffabfc375a5f39efdcc17184b34cb3f5d9e1',
      LIMITED: '0x2a9f784d89f900f485f2f888a68d66d840fa9cea3b9dea64f2903dbbf89b7675',
      INSURED: '0x0e23468e1abbcbb31d08ab18aa8df8953b5acd751a0c4725ae27b44d0e8c2f93',
      BONDED: '0x9d9297abed392649589abfa441f0a17b4903c1bc2fbed7231ca3434e0532e837'
    }
  },
};

// 当前环境
const CURRENT_NETWORK = process.env.REACT_APP_NETWORK || 'polygon';

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
