const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing on Amoy with account:", deployer.address);
  
  // Amoy 合约地址
  const addresses = {
    humanRegistry: "0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6",
    humanEconomy: "0x3970FAf7708E18BD737C1f7fAD5c770FCD519Db5",
    agentLifecycle: "0x97738aE517ECDeD0cdfFB2aD7FB90Dfac803efbe",
    agentRuntime: "0x6AA35Fee046412830E371111Ddb15B74A145dF01",
    agentCommunity: "0x3C15c31181736bfF6A084267C28366e31fD0aC41"
  };
  
  // 加载合约
  const HumanRegistry = await hre.ethers.getContractFactory("HumanRegistry");
  const humanRegistry = HumanRegistry.attach(addresses.humanRegistry);
  
  const HumanEconomy = await hre.ethers.getContractFactory("HumanEconomy");
  const humanEconomy = HumanEconomy.attach(addresses.humanEconomy);
  
  const AgentLifecycle = await hre.ethers.getContractFactory("AgentLifecycle");
  const agentLifecycle = AgentLifecycle.attach(addresses.agentLifecycle);
  
  console.log("\n=== Test 1: Human Registration ===");
  try {
    const fee = await humanRegistry.registrationFee();
    console.log("Registration fee:", hre.ethers.formatEther(fee), "MATIC");
    
    const tx = await humanRegistry.register("testuser", "ipfs://test", { value: fee });
    await tx.wait();
    console.log("✅ Human registered successfully");
    
    const profile = await humanRegistry.getHumanProfile(deployer.address);
    console.log("Username:", profile.username);
    console.log("Reputation:", profile.reputation.toString());
  } catch (e) {
    console.log("❌ Registration failed:", e.message);
  }
  
  console.log("\n=== Test 2: Deposit Funds ===");
  try {
    const depositAmount = hre.ethers.parseEther("0.01");
    const tx = await humanEconomy.deposit({ value: depositAmount });
    await tx.wait();
    console.log("✅ Deposited", hre.ethers.formatEther(depositAmount), "MATIC");
    
    const summary = await humanEconomy.getWalletSummary(deployer.address);
    console.log("Available balance:", hre.ethers.formatEther(summary.available), "MATIC");
  } catch (e) {
    console.log("❌ Deposit failed:", e.message);
  }
  
  console.log("\n=== Test 3: Fund Agent ===");
  try {
    const agentId = 1;
    const fundAmount = hre.ethers.parseEther("0.02"); // 增加金额
    
    const tx = await agentLifecycle.fundAgent(agentId, { value: fundAmount });
    await tx.wait();
    console.log("✅ Agent funded with", hre.ethers.formatEther(fundAmount), "MATIC");
    
    const summary = await agentLifecycle.getFinancialSummary(agentId);
    console.log("Agent available:", hre.ethers.formatEther(summary.available), "MATIC");
  } catch (e) {
    console.log("❌ Agent funding failed:", e.message);
  }
  
  console.log("\n=== Test 4: Record Agent Cost ===");
  try {
    const agentId = 1;
    const costAmount = hre.ethers.parseEther("0.001");
    
    const tx = await agentLifecycle.recordCost(
      agentId,
      0, // LLMInference
      costAmount,
      "Test LLM call",
      hre.ethers.encodeBytes32String("task1")
    );
    await tx.wait();
    console.log("✅ Cost recorded:", hre.ethers.formatEther(costAmount), "MATIC");
    
    const summary = await agentLifecycle.getFinancialSummary(agentId);
    console.log("Agent available after cost:", hre.ethers.formatEther(summary.available), "MATIC");
    console.log("Total spent:", hre.ethers.formatEther(summary.totalSpent), "MATIC");
  } catch (e) {
    console.log("❌ Cost recording failed:", e.message);
  }
  
  console.log("\n=== Test 5: Agent Community Interaction ===");
  try {
    const AgentCommunity = await hre.ethers.getContractFactory("AgentCommunity");
    const agentCommunity = AgentCommunity.attach(addresses.agentCommunity);
    
    const agentId = 1;
    const tx = await agentCommunity.agentCreateForumPost(
      agentId,
      "Hello from Amoy",
      "This is a test post from the Amoy testnet",
      0 // Discussion
    );
    await tx.wait();
    console.log("✅ Forum post created");
    
    const reputation = await agentCommunity.getAgentCommunityReputation(agentId);
    console.log("Agent community reputation:", reputation.toString());
  } catch (e) {
    console.log("❌ Community interaction failed:", e.message);
  }
  
  console.log("\n=== All Tests Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
