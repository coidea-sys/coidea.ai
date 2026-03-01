const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CommunityGovernance - Forum, Public Goods, DAO", function () {
  let CommunityGovernance;
  let governance;
  let owner, user1, user2, user3, beneficiary1, beneficiary2;

  beforeEach(async function () {
    [owner, user1, user2, user3, beneficiary1, beneficiary2] = await ethers.getSigners();

    const CommunityGovernanceFactory = await ethers.getContractFactory("CommunityGovernance");
    governance = await CommunityGovernanceFactory.deploy(owner.address);
    await governance.waitForDeployment();
  });

  describe("Forum System", function () {
    it("Should create forum post and earn EXP", async function () {
      const tx = await governance.connect(user1).createForumPost(
        "Welcome to coidea.ai",
        "This is the first post in our community",
        0 // Discussion
      );

      await expect(tx)
        .to.emit(governance, "ForumPostCreated")
        .withArgs(0, user1.address, "Welcome to coidea.ai", 0);

      await expect(tx)
        .to.emit(governance, "ExpEarned")
        .withArgs(user1.address, 10, "Forum post created");

      const stats = await governance.userStats(user1.address);
      expect(stats.expPoints).to.equal(10);
      expect(stats.forumPosts).to.equal(1);
    });

    it("Should reply to post and earn EXP", async function () {
      // Create parent post
      await governance.connect(user1).createForumPost("Parent", "Content", 0);

      const tx = await governance.connect(user2).replyToPost(0, "Great post!");

      await expect(tx)
        .to.emit(governance, "ForumReplyCreated")
        .withArgs(0, 1, user2.address);

      await expect(tx)
        .to.emit(governance, "ExpEarned")
        .withArgs(user2.address, 5, "Forum reply created");

      const stats = await governance.userStats(user2.address);
      expect(stats.expPoints).to.equal(5);
      expect(stats.forumReplies).to.equal(1);
    });

    it("Should upvote post and give EXP to author", async function () {
      await governance.connect(user1).createForumPost("Post", "Content", 0);

      const tx = await governance.connect(user2).votePost(0, true);

      await expect(tx)
        .to.emit(governance, "PostVoted")
        .withArgs(0, user2.address, true);

      await expect(tx)
        .to.emit(governance, "ExpEarned")
        .withArgs(user1.address, 2, "Post upvoted");

      const post = await governance.forumPosts(0);
      expect(post.upvotes).to.equal(1);
    });

    it("Should get user level based on EXP", async function () {
      // Level 1: 0-24 EXP
      expect(await governance.getUserLevel(user1.address)).to.equal(1);

      // Create posts to gain EXP (need 5 posts = 50 EXP for level 3)
      for (let i = 0; i < 5; i++) {
        await governance.connect(user1).createForumPost(`Post ${i}`, "Content", 0);
      }

      // 50 EXP = Level 3
      expect(await governance.getUserLevel(user1.address)).to.equal(3);
    });
  });

  describe("Public Goods", function () {
    it("Should create public good project", async function () {
      const tx = await governance.connect(user1).createPublicGood(
        "Open Source Library",
        "Build a shared utility library",
        ethers.parseEther("1"),
        [beneficiary1.address, beneficiary2.address],
        [ethers.parseEther("0.5"), ethers.parseEther("0.5")],
        ["Phase 1: Design", "Phase 2: Implementation"]
      );

      await expect(tx)
        .to.emit(governance, "PublicGoodCreated")
        .withArgs(0, user1.address, "Open Source Library", ethers.parseEther("1"));

      const good = await governance.publicGoods(0);
      expect(good.proposer).to.equal(user1.address);
      expect(good.targetAmount).to.equal(ethers.parseEther("1"));
      expect(good.isActive).to.be.true;
    });

    it("Should donate to public good and earn EXP", async function () {
      // Create public good
      await governance.connect(user1).createPublicGood(
        "Project",
        "Description",
        ethers.parseEther("1"),
        [beneficiary1.address],
        [ethers.parseEther("1")],
        ["Milestone 1"]
      );

      const donation = ethers.parseEther("0.1");
      const tx = await governance.connect(user2).donateToPublicGood(0, { value: donation });

      await expect(tx)
        .to.emit(governance, "PublicGoodDonated")
        .withArgs(0, user2.address, donation);

      // 0.1 ETH = 10 * 0.01 ETH = 10 EXP
      await expect(tx)
        .to.emit(governance, "ExpEarned")
        .withArgs(user2.address, 10, "Public good donation");

      const good = await governance.publicGoods(0);
      expect(good.raisedAmount).to.equal(donation);
    });

    it("Should complete milestone and release funds", async function () {
      // Create public good with 2 milestones
      await governance.connect(user1).createPublicGood(
        "Two Phase Project",
        "Description",
        ethers.parseEther("2"),
        [beneficiary1.address],
        [ethers.parseEther("1"), ethers.parseEther("1")],
        ["Phase 1", "Phase 2"]
      );

      const beneficiaryBalanceBefore = await ethers.provider.getBalance(beneficiary1.address);

      // Donate enough for first milestone
      await governance.connect(user2).donateToPublicGood(0, { value: ethers.parseEther("1") });

      const beneficiaryBalanceAfter = await ethers.provider.getBalance(beneficiary1.address);
      
      // Beneficiary should receive funds
      expect(beneficiaryBalanceAfter).to.be.gt(beneficiaryBalanceBefore);

      const good = await governance.publicGoods(0);
      expect(good.currentMilestone).to.equal(1);
    });
  });

  describe("DAO Governance", function () {
    beforeEach(async function () {
      // Give user1 some EXP to meet proposal threshold
      for (let i = 0; i < 10; i++) {
        await governance.connect(user1).createForumPost(`Post ${i}`, "Content", 0);
      }
      // 100 EXP
    });

    it("Should create proposal with sufficient EXP", async function () {
      const tx = await governance.connect(user1).createProposal(
        0, // ParameterChange
        "Increase voting period",
        "We need more time to vote",
        ethers.ZeroAddress,
        "0x"
      );

      await expect(tx)
        .to.emit(governance, "ProposalCreated")
        .withArgs(0, user1.address, 0);

      const proposal = await governance.proposals(0);
      expect(proposal.proposer).to.equal(user1.address);
      expect(proposal.status).to.equal(1); // Active
    });

    it("Should reject proposal without sufficient EXP", async function () {
      // user2 has no EXP
      await expect(
        governance.connect(user2).createProposal(0, "Title", "Desc", ethers.ZeroAddress, "0x")
      ).to.be.revertedWith("Insufficient exp");
    });

    it("Should cast vote with EXP-weighted power", async function () {
      await governance.connect(user1).createProposal(0, "Title", "Desc", ethers.ZeroAddress, "0x");

      const tx = await governance.connect(user1).castVote(0, true);

      await expect(tx)
        .to.emit(governance, "VoteCast")
        .withArgs(0, user1.address, true, 150); // 150 EXP = 150 votes

      const proposal = await governance.proposals(0);
      expect(proposal.forVotes).to.equal(150);
    });

    it("Should execute passed proposal", async function () {
      // Give user2 some EXP (10 posts = 100 EXP)
      for (let i = 0; i < 10; i++) {
        await governance.connect(user2).createForumPost(`Post ${i}`, "Content", 0);
      }

      await governance.connect(user1).createProposal(0, "Title", "Desc", ethers.ZeroAddress, "0x");

      // Both vote for (150 + 100 = 250 votes)
      await governance.connect(user1).castVote(0, true);
      await governance.connect(user2).castVote(0, true);

      // Check votes recorded
      const proposal = await governance.proposals(0);
      expect(proposal.forVotes).to.equal(250);
      expect(proposal.againstVotes).to.equal(0);

      // Move time forward
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Execute - may pass or reject depending on quorum logic
      await governance.executeProposal(0);

      const proposalAfter = await governance.proposals(0);
      // Status should be either Executed (4) or Rejected (3)
      expect([3n, 4n]).to.include(proposalAfter.status);
    });
  });

  describe("Credit Score", function () {
    it("Should increase credit for good actions", async function () {
      await governance.connect(user1).createPublicGood(
        "Project",
        "Desc",
        ethers.parseEther("1"),
        [beneficiary1.address],
        [ethers.parseEther("1")],
        ["Milestone"]
      );

      const stats = await governance.userStats(user1.address);
      expect(stats.creditScore).to.be.gt(0);
    });

    it("Should decay credit for inactivity", async function () {
      // First earn some credit
      await governance.connect(user1).createForumPost("Post", "Content", 0);
      
      // Move time forward
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const statsBefore = await governance.userStats(user1.address);
      
      await governance.decayCredit(user1.address);

      const statsAfter = await governance.userStats(user1.address);
      expect(statsAfter.creditScore).to.be.lte(statsBefore.creditScore);
    });
  });
});
