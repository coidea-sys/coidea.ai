const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying LiabilityPreset with account:", deployer.address);
    
    // 部署 LiabilityPreset
    console.log("\n📋 Deploying LiabilityPreset...");
    const LiabilityPreset = await hre.ethers.getContractFactory("LiabilityPreset");
    const liabilityPreset = await LiabilityPreset.deploy();
    await liabilityPreset.waitForDeployment();
    console.log("✅ LiabilityPreset deployed to:", await liabilityPreset.getAddress());
    
    // 创建默认预设
    console.log("\n📋 Creating default liability presets...");
    
    // Standard 预设 - 无额外责任，7天争议期
    const standardPresetId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("STANDARD"));
    await liabilityPreset.createStandardPreset(standardPresetId, 7 * 24 * 60 * 60);
    console.log("✅ Standard preset created");
    
    // Limited 预设 - 发布者 0.05 ETH，工作者 0.02 ETH，7天争议期
    const limitedPresetId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("LIMITED"));
    await liabilityPreset.createLimitedPreset(
        limitedPresetId,
        hre.ethers.parseEther("0.05"),
        hre.ethers.parseEther("0.02"),
        7 * 24 * 60 * 60
    );
    console.log("✅ Limited preset created");
    
    // Insured 预设 - 发布者 0.1 ETH，保险费 0.01 ETH
    const insuredPresetId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("INSURED"));
    await liabilityPreset.createInsuredPreset(
        insuredPresetId,
        hre.ethers.parseEther("0.1"),
        hre.ethers.parseEther("0.01"),
        deployer.address,
        7 * 24 * 60 * 60
    );
    console.log("✅ Insured preset created");
    
    // Bonded 预设 - 双方各质押 0.1 ETH
    const bondedPresetId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BONDED"));
    await liabilityPreset.createBondedPreset(
        bondedPresetId,
        hre.ethers.parseEther("0.1"),
        hre.ethers.parseEther("0.1"),
        7 * 24 * 60 * 60
    );
    console.log("✅ Bonded preset created");
    
    // 保存部署信息
    const deploymentInfo = {
        network: hre.network.name,
        chainId: Number(await hre.network.provider.request({ method: "eth_chainId" })),
        deployer: deployer.address,
        contracts: {
            LiabilityPreset: await liabilityPreset.getAddress()
        },
        presets: {
            STANDARD: standardPresetId,
            LIMITED: limitedPresetId,
            INSURED: insuredPresetId,
            BONDED: bondedPresetId
        },
        deployedAt: new Date().toISOString()
    };
    
    // 保存到文件
    const deploymentDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    const filename = `${hre.network.name}-${Date.now()}.json`;
    fs.writeFileSync(
        path.join(deploymentDir, filename),
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    // 同时更新最新部署
    fs.writeFileSync(
        path.join(deploymentDir, 'latest.json'),
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n📝 Deployment info saved to:", filename);
    
    // 输出摘要
    console.log("\n" + "=".repeat(60));
    console.log("🎉 LIABILITY PRESET DEPLOYMENT COMPLETE");
    console.log("=".repeat(60));
    console.log("\n📍 Contract Address:", await liabilityPreset.getAddress());
    console.log("\n🔧 Default Presets:");
    console.log("  STANDARD:", standardPresetId);
    console.log("  LIMITED: ", limitedPresetId);
    console.log("  INSURED: ", insuredPresetId);
    console.log("  BONDED:  ", bondedPresetId);
    console.log("\n📊 Preset Details:");
    console.log("  Standard - No extra liability, 7 day dispute window");
    console.log("  Limited  - Publisher: 0.05 ETH, Worker: 0.02 ETH");
    console.log("  Insured  - Publisher: 0.1 ETH, Premium: 0.01 ETH");
    console.log("  Bonded   - Both parties stake 0.1 ETH");
    console.log("\n" + "=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
