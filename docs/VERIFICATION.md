# Contract Verification Guide

## Overview

Due to **PolygonScan API V1 deprecation** (May 31, 2025), we have switched to **Sourcify** as our primary verification method.

| Method | Type | Status | Use Case |
|--------|------|--------|----------|
| **Sourcify** | Open Source | ✅ **Primary** | Recommended for all chains |
| **PolygonScan** | Commercial | ⚠️ Deprecated | Legacy only |
| **Blockscout** | Open Source | ✅ Supported | Alternative explorer |

## Why Sourcify?

- **Open source** - Transparent and community-driven
- **No API keys** - Free to use without registration
- **Multi-chain** - Works with any EVM chain
- **Wallet integration** - Supported by MetaMask, Remix, Safe
- **Future-proof** - Not subject to commercial API changes

## Configuration

Our `hardhat.config.js` is already configured to use Sourcify:

```javascript
// Sourcify verification (primary method)
sourcify: {
  enabled: true
},
// Etherscan disabled due to API V1 deprecation
etherscan: {
  apiKey: process.env.POLYGONSCAN_API_KEY,
  enabled: false,
}
```

## Verifying Contracts

### Single Contract

```bash
npx hardhat verify --network polygonAmoy <CONTRACT_ADDRESS> [constructor-args]
```

Example:
```bash
npx hardhat verify --network polygonAmoy 0xa7049DB55AE7D67FBC006734752DD1fe24687bE3 0x6e2c6bFDc06BAf06c3c42Cb5B9Dc73a9c41143Df
```

### All Contracts (Batch)

```bash
node scripts/verify-sourcify-all.js
```

## Verification Status

### Amoy Testnet (All Verified on Sourcify ✅)

| Contract | Address | Sourcify |
|----------|---------|----------|
| HumanRegistry | `0xa7049DB55AE7D67FBC006734752DD1fe24687bE3` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0xa7049DB55AE7D67FBC006734752DD1fe24687bE3/) |
| AIAgentRegistry | `0xB3b5b0955cFaDdB92b2433818159A1B4f7daaF78` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0xB3b5b0955cFaDdB92b2433818159A1B4f7daaF78/) |
| HumanLevelNFT | `0xb42Bb4AcEf001b472f0A2838bD7EbC4Df544290D` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0xb42Bb4AcEf001b472f0A2838bD7EbC4Df544290D/) |
| CommunityGovernance | `0x7e1005053683C1F9697Dc90a071cDE350791F1e3` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0x7e1005053683C1F9697Dc90a071cDE350791F1e3/) |
| LiabilityRegistry | `0x93C9eF9C3ac2F7536F901b2c4d3CDa8FDceB526A` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0x93C9eF9C3ac2F7536F901b2c4d3CDa8FDceB526A/) |
| AgentCommunity | `0x303C3fa2d0F156372F5ec8689095C20D50431191` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0x303C3fa2d0F156372F5ec8689095C20D50431191/) |
| LiabilityPreset | `0x969133C8509b17956022aE4e43dC3B95577134A2` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0x969133C8509b17956022aE4e43dC3B95577134A2/) |
| AgentLifecycle | `0xE342ba865025ee90Ff540Cc10c7192d15e813278` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0xE342ba865025ee90Ff540Cc10c7192d15e813278/) |
| AgentRuntime | `0xccCe4726D5e480184b2aF51b39943e387F7acBd1` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0xccCe4726D5e480184b2aF51b39943e387F7acBd1/) |
| HumanEconomy | `0x2FC0a1B77047833Abb836048Dec3585f27c9f01a` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0x2FC0a1B77047833Abb836048Dec3585f27c9f01a/) |
| TaskRegistry | `0xE8eb60EB3cFEaC27fb9D0bC52d5DE346206D3fAE` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0xE8eb60EB3cFEaC27fb9D0bC52d5DE346206D3fAE/) |
| X402Payment | `0x608b0E50593B307CC7F09C1bE0Bd691107F8C87B` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0x608b0E50593B307CC7F09C1bE0Bd691107F8C87B/) |

## Troubleshooting

### "Contract already verified"

This is normal. Sourcify will skip already verified contracts.

### "Network request failed"

- Check your internet connection
- Verify the contract address is correct
- Ensure the contract is deployed on the specified network

### Verification fails

1. **Check constructor arguments** - Must match exactly
2. **Check compiler version** - Must match deployment settings
3. **Check optimizer settings** - Must match (enabled: true, runs: 200)
4. **Wait a minute** - Block explorer may not have indexed the contract yet

## Manual Verification

If automatic verification fails, you can verify manually:

1. Go to [Sourcify](https://sourcify.dev/)
2. Enter contract address and chain ID (80002 for Amoy)
3. Upload source files or provide repository URL

## Legacy: PolygonScan Verification

If you still need PolygonScan verification (not recommended):

1. Wait for Hardhat to support PolygonScan API V2
2. Or verify manually on [Amoy PolygonScan](https://amoy.polygonscan.com/)

## Best Practices

1. **Verify immediately after deployment** - While context is fresh
2. **Document constructor arguments** - Save deployment info
3. **Use Sourcify as primary** - More reliable and future-proof
4. **Keep deployment artifacts** - In `deployments/` directory

---

*Last updated: 2026-03-04*
