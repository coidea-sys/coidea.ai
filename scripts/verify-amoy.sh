#!/bin/bash
# Verify contracts on Amoy testnet
# Usage: ./scripts/verify-amoy.sh

echo "🔍 Verifying contracts on Amoy testnet..."
echo ""

# Load addresses from deployment
AI_AGENT_REGISTRY="0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24"
HUMAN_LEVEL_NFT="0x78BB5F702441B751D34d860474Acf6409585Aad8"
TASK_REGISTRY="0x7e8ee79A7BdC624b9FCB8A37b91C7305A00c2D42"
X402_PAYMENT="0x510fC8AD46EB0b010F0015b07c0EAc0C93B2599F"

echo "1. Verifying AIAgentRegistry..."
npx hardhat verify --network polygonAmoy \
  --contract contracts/AIAgentRegistry.sol:AIAgentRegistry \
  "$AI_AGENT_REGISTRY" \
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo ""
echo "2. Verifying HumanLevelNFT..."
npx hardhat verify --network polygonAmoy \
  --contract contracts/HumanLevelNFT.sol:HumanLevelNFT \
  "$HUMAN_LEVEL_NFT"

echo ""
echo "3. Verifying TaskRegistry..."
npx hardhat verify --network polygonAmoy \
  --contract contracts/TaskRegistry.sol:TaskRegistry \
  "$TASK_REGISTRY" \
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo ""
echo "4. Verifying X402Payment..."
npx hardhat verify --network polygonAmoy \
  --contract contracts/X402Payment.sol:X402Payment \
  "$X402_PAYMENT" \
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo ""
echo "✅ Verification complete!"
echo ""
echo "View contracts at:"
echo "  https://amoy.polygonscan.com/address/$AI_AGENT_REGISTRY"
echo "  https://amoy.polygonscan.com/address/$HUMAN_LEVEL_NFT"
echo "  https://amoy.polygonscan.com/address/$TASK_REGISTRY"
echo "  https://amoy.polygonscan.com/address/$X402_PAYMENT"
