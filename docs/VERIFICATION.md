# Contract Verification Guide

## Overview

We support multiple verification methods for maximum compatibility:

| Method | Type | Status | Use Case |
|--------|------|--------|----------|
| **Sourcify** | Open Source | ✅ Recommended | Primary verification |
| **PolygonScan** | Commercial | ⚠️ API V1 Deprecated | Backup/legacy |
| **Blockscout** | Open Source | ✅ Supported | Alternative explorer |

## Sourcify (Recommended)

Sourcify is the **open-source verification standard** supported by:
- MetaMask
- Remix IDE
- Blockscout
- Safe (Gnosis Safe)

### Verify via Script

```bash
./scripts/verify-sourcify.sh
```

### Verify Manually

```bash
# AIAgentRegistry
npx hardhat verify --network polygonAmoy --sourcify \
  0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24 \
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# HumanLevelNFT
npx hardhat verify --network polygonAmoy --sourcify \
  0x78BB5F702441B751D34d860474Acf6409585Aad8

# TaskRegistry
npx hardhat verify --network polygonAmoy --sourcify \
  0x7e8ee79A7BdC624b9FCB8A37b91C7305A00c2D42 \
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# X402Payment
npx hardhat verify --network polygonAmoy --sourcify \
  0x510fC8AD46EB0b010F0015b07c0EAc0C93B2599F \
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
```

### Check Verification Status

```bash
curl "https://sourcify.dev/server/check-all-by-addresses?\
  addresses=0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24&\
  chainIds=80002"
```

### View Verified Contracts

- https://sourcify.dev/#/lookup/0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24
- https://sourcify.dev/#/lookup/0x78BB5F702441B751D34d860474Acf6409585Aad8
- https://sourcify.dev/#/lookup/0x7e8ee79A7BdC624b9FCB8A37b91C7305A00c2D42
- https://sourcify.dev/#/lookup/0x510fC8AD46EB0b010F0015b07c0EAc0C93B2599F

## PolygonScan (Legacy)

Due to PolygonScan API V1 deprecation, automatic verification may fail.

### Manual Verification

1. Go to https://amoy.polygonscan.com
2. Search for your contract address
3. Click "Verify and Publish"
4. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.24
   - License Type: MIT
5. Paste the flattened contract code

### Flatten Contract

```bash
npx hardhat flatten contracts/AIAgentRegistry.sol > AIAgentRegistry.flattened.sol
```

## Automated CI/CD

The project includes GitHub Actions workflow for automated deployment and verification:

```bash
# Trigger deployment
gh workflow run deploy.yml

# Or push to main branch
git push origin main
```

See `.github/workflows/deploy.yml` for details.

## Troubleshooting

### "Multiple contracts match bytecode"

Use `--contract` flag with full path:
```bash
npx hardhat verify --network polygonAmoy \
  --contract contracts/AIAgentRegistry.sol:AIAgentRegistry \
  <address> <constructor-args>
```

### "API V1 Deprecated"

Switch to Sourcify or manual verification on PolygonScan website.

### "Contract not found"

Ensure:
1. Contract is deployed
2. Using correct network
3. Constructor arguments match

## Best Practices

1. **Always verify immediately after deployment**
2. **Use Sourcify as primary method** - it's open and wallet-agnostic
3. **Keep deployment artifacts** in `deployments/` directory
4. **Document constructor arguments** for each deployment
