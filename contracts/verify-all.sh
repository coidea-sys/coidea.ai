#!/bin/bash

# 验证所有 Polygon 主网合约

export POLYGONSCAN_API_KEY=SGFXKM1AGGDSGVK6Y4XTCV48B9WJ6UCXGH

echo "🔍 Verifying contracts on Polygon Mainnet..."
echo ""

# 合约地址
CONTRACTS=(
  "0xBE8EFdb2709687CE6128D629F868f28ECcaF1493:LiabilityPreset"
  "0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6:AIAgentRegistry"
  "0x3970FAf7708E18BD737C1f7fAD5c770FCD519Db5:TaskRegistry"
  "0x97738aE517ECDeD0cdfFB2aD7FB90Dfac803efbe:X402Payment"
  "0x6AA35Fee046412830E371111Ddb15B74A145dF01:CommunityGovernance"
)

for contract in "${CONTRACTS[@]}"; do
  IFS=':' read -r address name <<< "$contract"
  
  echo "📋 Verifying $name at $address..."
  npx hardhat verify --network polygon "$address" 2>&1 | grep -E "(Successfully|Error|error)" | head -2
  echo ""
  
  # 等待避免 rate limit
  sleep 10
done

echo "✅ Verification complete!"
