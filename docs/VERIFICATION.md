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

### Amoy Testnet (Verified on Sourcify)

| Contract | Address | Sourcify |
|----------|---------|----------|
| HumanRegistry | `0xa7049DB55AE7D67FBC006734752DD1fe24687bE3` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0xa7049DB55AE7D67FBC006734752DD1fe24687bE3/) |
| AIAgentRegistry | `0xB3b5b0955cFaDdB92b2433818159A1B4f7daaF78` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0xB3b5b0955cFaDdB92b2433818159A1B4f7daaF78/) |
| HumanLevelNFT | `0xb42Bb4AcEf001b472f0A2838bD7EbC4Df544290D` | ✅ [View](https://repo.sourcify.dev/contracts/full_match/80002/0xb42Bb4AcEf001b472f0A2838bD7EbC4Df544290D/) |
| ... | ... | ... |

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
