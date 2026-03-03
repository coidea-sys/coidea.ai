# Amoy Testnet Deployment

**Date:** 2026-03-03  
**Network:** Polygon Amoy Testnet  
**Chain ID:** 80002  
**Deployer:** 0x0FB4eb50E6d70bF1Ed107CeDF18eEe1906f9464d

## Deployed Contracts

| Contract | Address | Explorer |
|----------|---------|----------|
| AIAgentRegistry | 0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24 | [View](https://amoy.polygonscan.com/address/0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24) |
| HumanLevelNFT | 0x78BB5F702441B751D34d860474Acf6409585Aad8 | [View](https://amoy.polygonscan.com/address/0x78BB5F702441B751D34d860474Acf6409585Aad8) |
| TaskRegistry | 0x7e8ee79A7BdC624b9FCB8A37b91C7305A00c2D42 | [View](https://amoy.polygonscan.com/address/0x7e8ee79A7BdC624b9FCB8A37b91C7305A00c2D42) |
| X402Payment | 0x510fC8AD46EB0b010F0015b07c0EAc0C93B2599F | [View](https://amoy.polygonscan.com/address/0x510fC8AD46EB0b010F0015b07c0EAc0C93B2599F) |

## Verification Status

⚠️ **Pending** - Manual verification required due to PolygonScan API V1 deprecation

## Configuration

Add to `.env`:
```bash
NETWORK=amoy
AMOY_AI_AGENT_REGISTRY_ADDRESS=0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24
AMOY_HUMAN_LEVEL_NFT_ADDRESS=0x78BB5F702441B751D34d860474Acf6409585Aad8
AMOY_TASK_REGISTRY_ADDRESS=0x7e8ee79A7BdC624b9FCB8A37b91C7305A00c2D42
AMOY_X402_PAYMENT_ADDRESS=0x510fC8AD46EB0b010F0015b07c0EAc0C93B2599F
```

## Testnet Faucet

Get test POL from: https://faucet.polygon.technology

## API Endpoints

Backend API can be configured to use Amoy by setting:
```bash
NETWORK=amoy
```
