// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CommunityGovernance
 * @notice 社区治理、论坛、公益和声誉系统
 * 
 * 功能：
 * 1. 论坛发帖/回复/点赞
 * 2. 公益项目发起/捐赠/执行
 * 3. DAO 提案/投票
 * 4. 经验值和信用分计算
 */
contract CommunityGovernance is Ownable, ReentrancyGuard {
    
    // ============ 数据结构 ============
    
    enum PostType { Discussion, Question, Idea, Announcement }
    enum ProposalType { ParameterChange, TreasurySpending, RuleAmendment, PublicGood }
    enum ProposalStatus { Draft, Active, Passed, Rejected, Executed }
    
    struct ForumPost {
        uint256 id;
        address author;
        string title;
        string content;
        PostType postType;
        uint256 parentId; // 0 for top-level posts
        uint256[] replyIds;
        uint256 upvotes;
        uint256 downvotes;
        mapping(address => int8) userVotes; // 1 = upvote, -1 = downvote
        uint256 createdAt;
        bool isPinned;
    }
    
    struct PublicGood {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 targetAmount;
        uint256 raisedAmount;
        uint256 spentAmount;
        address[] beneficiaries;
        uint256[] milestoneAmounts;
        string[] milestoneDescriptions;
        uint256 currentMilestone;
        bool isActive;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        string title;
        string description;
        bytes executionData; // 执行数据
        address targetContract; // 目标合约
        uint256 forVotes;
        uint256 againstVotes;
        mapping(address => bool) hasVoted;
        ProposalStatus status;
        uint256 votingStart;
        uint256 votingEnd;
        uint256 createdAt;
    }
    
    struct UserStats {
        uint256 expPoints;      // 经验值
        uint256 creditScore;    // 信用分 (0-1000)
        uint256 forumPosts;
        uint256 forumReplies;
        uint256 forumUpvotesReceived;
        uint256 proposalsCreated;
        uint256 votesParticipated;
        uint256 publicGoodsSupported;
        uint256 publicGoodsCreated;
        uint256 lastActivityAt;
    }
    
    // ============ 状态变量 ============
    
    uint256 public postCounter;
    uint256 public publicGoodCounter;
    uint256 public proposalCounter;
    
    mapping(uint256 => ForumPost) public forumPosts;
    mapping(uint256 => PublicGood) public publicGoods;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => UserStats) public userStats;
    
    // 经验值配置
    uint256 public expPerPost = 10;
    uint256 public expPerReply = 5;
    uint256 public expPerUpvote = 2;
    uint256 public expPerProposal = 50;
    uint256 public expPerVote = 3;
    uint256 public expPerDonation = 1; // per 0.01 ETH
    
    // 信用分配置
    uint256 public creditDecayRate = 1; // 每日衰减
    uint256 public creditPerGoodAction = 5;
    uint256 public creditPenaltyBadAction = 20;
    
    // DAO 配置
    uint256 public votingPeriod = 7 days;
    uint256 public proposalThreshold = 100; // 最小经验值
    uint256 public quorumNumerator = 40; // 40% 参与率
    uint256 public quorumDenominator = 100;
    
    address public treasury;
    
    // ============ 事件 ============
    
    event ForumPostCreated(uint256 indexed postId, address indexed author, string title, PostType postType);
    event ForumReplyCreated(uint256 indexed postId, uint256 indexed replyId, address indexed author);
    event PostVoted(uint256 indexed postId, address indexed voter, bool isUpvote);
    
    event PublicGoodCreated(uint256 indexed goodId, address indexed proposer, string title, uint256 targetAmount);
    event PublicGoodDonated(uint256 indexed goodId, address indexed donor, uint256 amount);
    event PublicGoodMilestoneCompleted(uint256 indexed goodId, uint256 milestoneIndex);
    event PublicGoodCompleted(uint256 indexed goodId);
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, ProposalType proposalType);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 votes);
    event ProposalExecuted(uint256 indexed proposalId);
    
    event ExpEarned(address indexed user, uint256 amount, string reason);
    event CreditUpdated(address indexed user, uint256 newScore, string reason);
    
    // ============ 构造函数 ============
    
    constructor(address _treasury) Ownable() {
        treasury = _treasury;
    }
    
    // ============ 论坛功能 ============
    
    function createForumPost(
        string memory _title,
        string memory _content,
        PostType _postType
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_content).length > 0, "Content required");
        
        uint256 postId = postCounter++;
        
        ForumPost storage post = forumPosts[postId];
        post.id = postId;
        post.author = msg.sender;
        post.title = _title;
        post.content = _content;
        post.postType = _postType;
        post.parentId = 0;
        post.upvotes = 0;
        post.downvotes = 0;
        post.createdAt = block.timestamp;
        
        // 增加经验值
        _addExp(msg.sender, expPerPost, "Forum post created");
        
        // 更新用户统计
        userStats[msg.sender].forumPosts++;
        userStats[msg.sender].lastActivityAt = block.timestamp;
        
        emit ForumPostCreated(postId, msg.sender, _title, _postType);
        
        return postId;
    }
    
    function replyToPost(uint256 _parentId, string memory _content) public returns (uint256) {
        require(forumPosts[_parentId].author != address(0), "Parent post not found");
        require(bytes(_content).length > 0, "Content required");
        
        uint256 replyId = postCounter++;
        
        ForumPost storage reply = forumPosts[replyId];
        reply.id = replyId;
        reply.author = msg.sender;
        reply.title = "";
        reply.content = _content;
        reply.postType = PostType.Discussion;
        reply.parentId = _parentId;
        reply.upvotes = 0;
        reply.downvotes = 0;
        reply.createdAt = block.timestamp;
        
        forumPosts[_parentId].replyIds.push(replyId);
        
        // 增加经验值
        _addExp(msg.sender, expPerReply, "Forum reply created");
        
        // 更新用户统计
        userStats[msg.sender].forumReplies++;
        userStats[msg.sender].lastActivityAt = block.timestamp;
        
        emit ForumReplyCreated(_parentId, replyId, msg.sender);
        
        return replyId;
    }
    
    function votePost(uint256 _postId, bool _isUpvote) public {
        ForumPost storage post = forumPosts[_postId];
        require(post.author != address(0), "Post not found");
        require(post.author != msg.sender, "Cannot vote own post");
        
        int8 currentVote = post.userVotes[msg.sender];
        int8 newVote = _isUpvote ? int8(1) : int8(-1);
        
        require(currentVote != newVote, "Already voted same way");
        
        // 移除旧投票
        if (currentVote == 1) post.upvotes--;
        else if (currentVote == -1) post.downvotes--;
        
        // 添加新投票
        if (_isUpvote) post.upvotes++;
        else post.downvotes++;
        
        post.userVotes[msg.sender] = newVote;
        
        // 给作者增加经验值（如果是 upvote）
        if (_isUpvote) {
            _addExp(post.author, expPerUpvote, "Post upvoted");
            userStats[post.author].forumUpvotesReceived++;
        }
        
        userStats[msg.sender].lastActivityAt = block.timestamp;
        
        emit PostVoted(_postId, msg.sender, _isUpvote);
    }
    
    // ============ 公益功能 ============
    
    function createPublicGood(
        string memory _title,
        string memory _description,
        uint256 _targetAmount,
        address[] memory _beneficiaries,
        uint256[] memory _milestoneAmounts,
        string[] memory _milestoneDescriptions
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(_targetAmount > 0, "Target amount required");
        require(_beneficiaries.length > 0, "At least one beneficiary");
        require(_milestoneAmounts.length == _milestoneDescriptions.length, "Milestone mismatch");
        
        uint256 totalMilestones = 0;
        for (uint i = 0; i < _milestoneAmounts.length; i++) {
            totalMilestones += _milestoneAmounts[i];
        }
        require(totalMilestones == _targetAmount, "Milestones must sum to target");
        
        uint256 goodId = publicGoodCounter++;
        
        PublicGood storage good = publicGoods[goodId];
        good.id = goodId;
        good.proposer = msg.sender;
        good.title = _title;
        good.description = _description;
        good.targetAmount = _targetAmount;
        good.raisedAmount = 0;
        good.spentAmount = 0;
        good.beneficiaries = _beneficiaries;
        good.milestoneAmounts = _milestoneAmounts;
        good.milestoneDescriptions = _milestoneDescriptions;
        good.currentMilestone = 0;
        good.isActive = true;
        good.createdAt = block.timestamp;
        
        // 增加经验值和信用分
        _addExp(msg.sender, expPerProposal, "Public good created");
        _updateCredit(msg.sender, int256(creditPerGoodAction), "Public good created");
        
        userStats[msg.sender].publicGoodsCreated++;
        userStats[msg.sender].lastActivityAt = block.timestamp;
        
        emit PublicGoodCreated(goodId, msg.sender, _title, _targetAmount);
        
        return goodId;
    }
    
    function donateToPublicGood(uint256 _goodId) public payable nonReentrant {
        PublicGood storage good = publicGoods[_goodId];
        require(good.isActive, "Public good not active");
        require(msg.value > 0, "Donation required");
        require(good.raisedAmount + msg.value <= good.targetAmount, "Exceeds target");
        
        good.raisedAmount += msg.value;
        
        // 计算经验值 (每 0.01 ETH = 1 exp)
        uint256 expGained = (msg.value / 0.01 ether) * expPerDonation;
        if (expGained > 0) {
            _addExp(msg.sender, expGained, "Public good donation");
        }
        
        _updateCredit(msg.sender, int256(creditPerGoodAction), "Donated to public good");
        
        userStats[msg.sender].publicGoodsSupported++;
        userStats[msg.sender].lastActivityAt = block.timestamp;
        
        emit PublicGoodDonated(_goodId, msg.sender, msg.value);
        
        // 检查是否完成当前里程碑
        _checkMilestoneCompletion(_goodId);
    }
    
    function _checkMilestoneCompletion(uint256 _goodId) internal {
        PublicGood storage good = publicGoods[_goodId];
        
        if (good.currentMilestone < good.milestoneAmounts.length) {
            uint256 milestoneTarget = 0;
            for (uint i = 0; i <= good.currentMilestone; i++) {
                milestoneTarget += good.milestoneAmounts[i];
            }
            
            if (good.raisedAmount >= milestoneTarget) {
                // 里程碑完成，释放资金
                uint256 releaseAmount = good.milestoneAmounts[good.currentMilestone];
                good.spentAmount += releaseAmount;
                
                // 分配给受益人
                uint256 perBeneficiary = releaseAmount / good.beneficiaries.length;
                for (uint i = 0; i < good.beneficiaries.length; i++) {
                    (bool success, ) = payable(good.beneficiaries[i]).call{value: perBeneficiary}("");
                    require(success, "Transfer failed");
                }
                
                emit PublicGoodMilestoneCompleted(_goodId, good.currentMilestone);
                
                good.currentMilestone++;
                
                // 检查是否全部完成
                if (good.currentMilestone >= good.milestoneAmounts.length) {
                    good.isActive = false;
                    good.completedAt = block.timestamp;
                    emit PublicGoodCompleted(_goodId);
                }
            }
        }
    }
    
    // ============ DAO 投票功能 ============
    
    function createProposal(
        ProposalType _proposalType,
        string memory _title,
        string memory _description,
        address _targetContract,
        bytes memory _executionData
    ) public returns (uint256) {
        require(userStats[msg.sender].expPoints >= proposalThreshold, "Insufficient exp");
        require(bytes(_title).length > 0, "Title required");
        
        uint256 proposalId = proposalCounter++;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.proposalType = _proposalType;
        proposal.title = _title;
        proposal.description = _description;
        proposal.executionData = _executionData;
        proposal.targetContract = _targetContract;
        proposal.forVotes = 0;
        proposal.againstVotes = 0;
        proposal.status = ProposalStatus.Active;
        proposal.votingStart = block.timestamp;
        proposal.votingEnd = block.timestamp + votingPeriod;
        proposal.createdAt = block.timestamp;
        
        // 增加经验值
        _addExp(msg.sender, expPerProposal, "Proposal created");
        
        userStats[msg.sender].proposalsCreated++;
        userStats[msg.sender].lastActivityAt = block.timestamp;
        
        emit ProposalCreated(proposalId, msg.sender, _proposalType);
        
        return proposalId;
    }
    
    function castVote(uint256 _proposalId, bool _support) public {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp < proposal.votingEnd, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        // 投票权重基于经验值
        uint256 voteWeight = userStats[msg.sender].expPoints;
        require(voteWeight > 0, "No voting power");
        
        if (_support) {
            proposal.forVotes += voteWeight;
        } else {
            proposal.againstVotes += voteWeight;
        }
        
        proposal.hasVoted[msg.sender] = true;
        
        // 增加经验值
        _addExp(msg.sender, expPerVote, "Voted on proposal");
        
        userStats[msg.sender].votesParticipated++;
        userStats[msg.sender].lastActivityAt = block.timestamp;
        
        emit VoteCast(_proposalId, msg.sender, _support, voteWeight);
    }
    
    function executeProposal(uint256 _proposalId) public nonReentrant {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp >= proposal.votingEnd, "Voting not ended");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 quorum = (proposal.forVotes + proposal.againstVotes) * quorumDenominator / quorumNumerator;
        
        // 检查通过条件
        bool passed = proposal.forVotes > proposal.againstVotes && 
                      totalVotes >= quorum;
        
        if (passed) {
            proposal.status = ProposalStatus.Passed;
            
            // 执行提案
            if (proposal.targetContract != address(0) && proposal.executionData.length > 0) {
                (bool success, ) = proposal.targetContract.call(proposal.executionData);
                require(success, "Execution failed");
            }
            
            proposal.status = ProposalStatus.Executed;
            emit ProposalExecuted(_proposalId);
        } else {
            proposal.status = ProposalStatus.Rejected;
        }
    }
    
    // ============ 经验值和信用分 ============
    
    function _addExp(address _user, uint256 _amount, string memory _reason) internal {
        userStats[_user].expPoints += _amount;
        emit ExpEarned(_user, _amount, _reason);
    }
    
    function _updateCredit(address _user, int256 _delta, string memory _reason) internal {
        UserStats storage stats = userStats[_user];
        
        if (_delta > 0) {
            stats.creditScore += uint256(_delta);
            if (stats.creditScore > 1000) stats.creditScore = 1000;
        } else {
            uint256 penalty = uint256(-_delta);
            if (stats.creditScore >= penalty) {
                stats.creditScore -= penalty;
            } else {
                stats.creditScore = 0;
            }
        }
        
        emit CreditUpdated(_user, stats.creditScore, _reason);
    }
    
    // 每日衰减信用分（防止僵尸账户）
    function decayCredit(address _user) public {
        UserStats storage stats = userStats[_user];
        require(block.timestamp > stats.lastActivityAt + 1 days, "Too soon");
        
        uint256 daysInactive = (block.timestamp - stats.lastActivityAt) / 1 days;
        uint256 decay = daysInactive * creditDecayRate;
        
        if (stats.creditScore >= decay) {
            stats.creditScore -= decay;
        } else {
            stats.creditScore = 0;
        }
        
        emit CreditUpdated(_user, stats.creditScore, "Credit decay");
    }
    
    // ============ 查询函数 ============
    
    function getUserLevel(address _user) public view returns (uint256) {
        uint256 exp = userStats[_user].expPoints;
        
        if (exp >= 10000) return 10;
        if (exp >= 5000) return 9;
        if (exp >= 2500) return 8;
        if (exp >= 1000) return 7;
        if (exp >= 500) return 6;
        if (exp >= 250) return 5;
        if (exp >= 100) return 4;
        if (exp >= 50) return 3;
        if (exp >= 25) return 2;
        return 1;
    }
    
    function getPostReplies(uint256 _postId) public view returns (uint256[] memory) {
        return forumPosts[_postId].replyIds;
    }
    
    function getPublicGoodMilestones(uint256 _goodId) public view returns (
        uint256[] memory amounts,
        string[] memory descriptions,
        uint256 current
    ) {
        PublicGood storage good = publicGoods[_goodId];
        return (good.milestoneAmounts, good.milestoneDescriptions, good.currentMilestone);
    }
    
    // ============ 管理员功能 ============
    
    function setExpConfig(
        uint256 _expPerPost,
        uint256 _expPerReply,
        uint256 _expPerUpvote,
        uint256 _expPerProposal,
        uint256 _expPerVote
    ) public onlyOwner {
        expPerPost = _expPerPost;
        expPerReply = _expPerReply;
        expPerUpvote = _expPerUpvote;
        expPerProposal = _expPerProposal;
        expPerVote = _expPerVote;
    }
    
    function setVotingPeriod(uint256 _period) public onlyOwner {
        votingPeriod = _period;
    }
    
    function setProposalThreshold(uint256 _threshold) public onlyOwner {
        proposalThreshold = _threshold;
    }
    
    function pinPost(uint256 _postId, bool _pinned) public onlyOwner {
        forumPosts[_postId].isPinned = _pinned;
    }
    
    receive() external payable {}
}
