# Mainnet Deployment Checklist

## Pre-Deployment ✅

### Code Verification
- [x] All tests passing (305+)
- [x] Security audit completed (0 critical/high)
- [x] All audit findings fixed
- [x] Code frozen - no more changes

### Environment Setup
- [ ] MAINNET_PRIVATE_KEY set (hardware wallet recommended)
- [ ] POLYGONSCAN_API_KEY set
- [ ] RPC endpoint configured
- [ ] Sufficient MATIC balance (min 0.5 MATIC)

### Gas Estimation
- [ ] AIAgentRegistry: ~0.1 MATIC
- [ ] HumanLevelNFT: ~0.08 MATIC
- [ ] TaskRegistry: ~0.12 MATIC
- [ ] X402Payment: ~0.15 MATIC
- [ ] Total estimated: ~0.5 MATIC

## Deployment Process 🚀

### Step 1: Dry Run (Local Fork)
```bash
# Fork mainnet and test deployment
npx hardhat node --fork https://polygon.drpc.org
npx hardhat run scripts/deploy-mainnet.js --network localhost
```

### Step 2: Actual Deployment
```bash
# Deploy to mainnet
npx hardhat run scripts/deploy-mainnet.js --network polygon
```

### Step 3: Verification
```bash
# Verify on PolygonScan
npx hardhat verify --network polygon <AIAgentRegistry_ADDRESS> <DEPLOYER>
npx hardhat verify --network polygon <HumanLevelNFT_ADDRESS>
npx hardhat verify --network polygon <TaskRegistry_ADDRESS> <DEPLOYER>
npx hardhat verify --network polygon <X402Payment_ADDRESS> <DEPLOYER>

# Verify on Sourcify
npx hardhat verify --network polygon --sourcify <CONTRACT_ADDRESS>
```

## Post-Deployment 🔍

### Contract Verification
- [ ] All contracts verified on PolygonScan
- [ ] All contracts verified on Sourcify
- [ ] Source code matches deployment

### Frontend Update
- [ ] Update contract addresses in frontend/.env
- [ ] Update chain ID to 137 (Polygon Mainnet)
- [ ] Test frontend connection
- [ ] Deploy frontend to production

### Monitoring Setup
- [ ] Set up contract monitoring (Tenderly/OpenZeppelin)
- [ ] Configure alerts for large transactions
- [ ] Set up error tracking

### Documentation
- [ ] Update deployed addresses in README
- [ ] Update API documentation
- [ ] Announce deployment to community

## Emergency Procedures 🚨

### If Deployment Fails
1. Check gas price and retry
2. Check RPC endpoint status
3. Verify private key has sufficient balance

### If Contracts Have Issues
1. Pause contracts (if Pausable implemented)
2. Assess impact
3. Prepare upgrade/fix
4. Communicate with community

### Emergency Contacts
- Polygon Support: https://polygon.technology/support
- Hardhat Support: https://hardhat.org/support

## Deployed Addresses 📋

| Contract | Address | PolygonScan |
|----------|---------|-------------|
| AIAgentRegistry | TBD | TBD |
| HumanLevelNFT | TBD | TBD |
| TaskRegistry | TBD | TBD |
| X402Payment | TBD | TBD |

## Notes 📝

- Deployment timestamp: TBD
- Deployer address: TBD
- Gas used: TBD
- Total cost: TBD MATIC

---

**DO NOT PROCEED WITHOUT:**
1. Hardware wallet for deployment
2. At least 1 MATIC for gas
3. Verified all pre-deployment checks
4. Team approval
