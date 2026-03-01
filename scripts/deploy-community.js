const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Deploying CommunityGovernance...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // Deploy CommunityGovernance
  const CommunityGovernance = await ethers.getContractFactory("CommunityGovernance");
  const communityGovernance = await CommunityGovernance.deploy(deployer.address);
  await communityGovernance.waitForDeployment();

  const address = await communityGovernance.getAddress();
  console.log(`CommunityGovernance deployed to: ${address}`);

  // 更新 deployments/localhost.json
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  const deploymentFile = path.join(deploymentsDir, 'localhost.json');
  
  if (fs.existsSync(deploymentFile)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    deploymentInfo.contracts.CommunityGovernance = address;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('Updated deployments/localhost.json');
  }

  // 更新 .env
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('LOCALHOST_COMMUNITY_GOVERNANCE_ADDRESS=')) {
      envContent = envContent.replace(
        /LOCALHOST_COMMUNITY_GOVERNANCE_ADDRESS=.*/,
        `LOCALHOST_COMMUNITY_GOVERNANCE_ADDRESS=${address}`
      );
    } else {
      envContent += `\nLOCALHOST_COMMUNITY_GOVERNANCE_ADDRESS=${address}`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env');
  }

  // 更新 frontend/.env.development
  const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env.development');
  if (fs.existsSync(frontendEnvPath)) {
    let envContent = fs.readFileSync(frontendEnvPath, 'utf8');
    if (envContent.includes('REACT_APP_LOCAL_COMMUNITY_GOVERNANCE_ADDRESS=')) {
      envContent = envContent.replace(
        /REACT_APP_LOCAL_COMMUNITY_GOVERNANCE_ADDRESS=.*/,
        `REACT_APP_LOCAL_COMMUNITY_GOVERNANCE_ADDRESS=${address}`
      );
    } else {
      envContent += `\nREACT_APP_LOCAL_COMMUNITY_GOVERNANCE_ADDRESS=${address}`;
    }
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log('Updated frontend/.env.development');
  }

  console.log('\n✅ Deployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
