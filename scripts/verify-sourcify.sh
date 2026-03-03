#!/bin/bash
# Verify contracts using Sourcify (open source standard)
# Sourcify is supported by major wallets and tools
# No API key required!

echo "🔍 Verifying contracts on Sourcify..."
echo "   Sourcify is the open-source verification standard"
echo "   Supported by MetaMask, Remix, and major wallets"
echo ""

# Contract addresses
AI_AGENT_REGISTRY="0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24"
HUMAN_LEVEL_NFT="0x78BB5F702441B751D34d860474Acf6409585Aad8"
TASK_REGISTRY="0x7e8ee79A7BdC624b9FCB8A37b91C7305A00c2D42"
X402_PAYMENT="0x510fC8AD46EB0b010F0015b07c0EAc0C93B2599F"

NETWORK="polygonAmoy"

echo "1. AIAgentRegistry: $AI_AGENT_REGISTRY"
npx hardhat verify --network $NETWORK --sourcify $AI_AGENT_REGISTRY "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" 2>&1 | grep -E "(Successfully|Error|Already)" || echo "   Verification submitted"

echo ""
echo "2. HumanLevelNFT: $HUMAN_LEVEL_NFT"
npx hardhat verify --network $NETWORK --sourcify $HUMAN_LEVEL_NFT 2>&1 | grep -E "(Successfully|Error|Already)" || echo "   Verification submitted"

echo ""
echo "3. TaskRegistry: $TASK_REGISTRY"
npx hardhat verify --network $NETWORK --sourcify $TASK_REGISTRY "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" 2>&1 | grep -E "(Successfully|Error|Already)" || echo "   Verification submitted"

echo ""
echo "4. X402Payment: $X402_PAYMENT"
npx hardhat verify --network $NETWORK --sourcify $X402_PAYMENT "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" 2>&1 | grep -E "(Successfully|Error|Already)" || echo "   Verification submitted"

echo ""
echo "✅ Verification requests submitted!"
echo ""
echo "View verified contracts at:"
echo "  https://sourcify.dev/#/lookup/$AI_AGENT_REGISTRY"
echo "  https://sourcify.dev/#/lookup/$HUMAN_LEVEL_NFT"
echo "  https://sourcify.dev/#/lookup/$TASK_REGISTRY"
echo "  https://sourcify.dev/#/lookup/$X402_PAYMENT"
echo ""
echo "Note: Sourcify verification may take a few minutes to process."
