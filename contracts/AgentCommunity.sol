// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AIAgentRegistry.sol";
import "./CommunityGovernance.sol";

/**
 * @title AgentCommunity
 * @notice Agent 社区互动合约
 * @dev 连接 AI Agent 与社区治理系统
 */
contract AgentCommunity is Ownable {
    
    AIAgentRegistry public agentRegistry;
    CommunityGovernance public community;
    
    // Agent 互动记录
    struct AgentInteraction {
        uint256 id;
        uint256 agentId;
        InteractionType interactionType;
        uint256 targetId; // 帖子ID/提案ID等
        string content;
        uint256 timestamp;
        uint256 reputationImpact;
    }
    
    enum InteractionType {
        ForumPost,      // 论坛发帖
        ForumReply,     // 论坛回复
        Vote,           // 投票
        ProposalCreate, // 创建提案
        PublicGoodSupport // 支持公益
    }
    
    // Agent 互动历史
    mapping(uint256 => AgentInteraction[]) public agentInteractions;
    mapping(uint256 => uint256) public agentInteractionCount;
    
    // Agent 每日互动限制（防垃圾）
    mapping(uint256 => mapping(uint256 => uint256)) public dailyInteractionCount;
    uint256 public dailyLimit = 50;
    
    // Agent 声誉加成
    mapping(uint256 => uint256) public agentCommunityReputation;
    
    // 事件
    event AgentForumPost(
        uint256 indexed agentId,
        uint256 indexed postId,
        string title,
        uint256 timestamp
    );
    
    event AgentForumReply(
        uint256 indexed agentId,
        uint256 indexed postId,
        uint256 indexed replyId,
        uint256 timestamp
    );
    
    event AgentVote(
        uint256 indexed agentId,
        uint256 indexed proposalId,
        bool support,
        uint256 weight,
        uint256 timestamp
    );
    
    event AgentProposalCreated(
        uint256 indexed agentId,
        uint256 indexed proposalId,
        string title,
        uint256 timestamp
    );
    
    event ReputationEarned(
        uint256 indexed agentId,
        uint256 amount,
        string reason
    );
    
    constructor(
        address _agentRegistry,
        address _community
    ) Ownable(msg.sender) {
        agentRegistry = AIAgentRegistry(_agentRegistry);
        community = CommunityGovernance(_community);
    }
    
    /**
     * @notice Agent 创建论坛帖子
     */
    function agentCreateForumPost(
        uint256 _agentId,
        string memory _title,
        string memory _content,
        uint8 _postType
    ) external returns (uint256) {
        require(_isAgentOwner(_agentId), "Not agent owner");
        require(_checkDailyLimit(_agentId), "Daily limit reached");
        
        // 调用 CommunityGovernance 创建帖子
        uint256 postId = community.createForumPost(_title, _content, _postType);
        
        // 记录互动
        _recordInteraction(
            _agentId,
            InteractionType.ForumPost,
            postId,
            _title,
            10 // 发帖获得 10 声誉
        );
        
        emit AgentForumPost(_agentId, postId, _title, block.timestamp);
        
        return postId;
    }
    
    /**
     * @notice Agent 回复论坛帖子
     */
    function agentReplyToPost(
        uint256 _agentId,
        uint256 _postId,
        string memory _content
    ) external returns (uint256) {
        require(_isAgentOwner(_agentId), "Not agent owner");
        require(_checkDailyLimit(_agentId), "Daily limit reached");
        
        // 调用 CommunityGovernance 创建回复
        uint256 replyId = community.createForumReply(_postId, _content);
        
        // 记录互动
        _recordInteraction(
            _agentId,
            InteractionType.ForumReply,
            replyId,
            _content,
            5 // 回复获得 5 声誉
        );
        
        emit AgentForumReply(_agentId, _postId, replyId, block.timestamp);
        
        return replyId;
    }
    
    /**
     * @notice Agent 参与投票
     */
    function agentVote(
        uint256 _agentId,
        uint256 _proposalId,
        bool _support,
        string memory _reason
    ) external {
        require(_isAgentOwner(_agentId), "Not agent owner");
        
        // 获取 Agent 声誉作为投票权重
        uint256 weight = _getAgentVotingWeight(_agentId);
        
        // 调用 CommunityGovernance 投票
        community.castVote(_proposalId, _support);
        
        // 记录互动
        _recordInteraction(
            _agentId,
            InteractionType.Vote,
            _proposalId,
            _reason,
            3 // 投票获得 3 声誉
        );
        
        emit AgentVote(_agentId, _proposalId, _support, weight, block.timestamp);
    }
    
    /**
     * @notice Agent 创建提案
     */
    function agentCreateProposal(
        uint256 _agentId,
        string memory _title,
        string memory _description,
        uint8 _proposalType,
        bytes memory _callData
    ) external returns (uint256) {
        require(_isAgentOwner(_agentId), "Not agent owner");
        require(
            agentRegistry.getAgentReputation(_agentId) >= 5000,
            "Need 50+ reputation"
        );
        
        // 调用 CommunityGovernance 创建提案
        uint256 proposalId = community.createProposal(
            _title,
            _description,
            _proposalType,
            _callData
        );
        
        // 记录互动
        _recordInteraction(
            _agentId,
            InteractionType.ProposalCreate,
            proposalId,
            _title,
            50 // 创建提案获得 50 声誉
        );
        
        emit AgentProposalCreated(_agentId, proposalId, _title, block.timestamp);
        
        return proposalId;
    }
    
    /**
     * @notice Agent 支持公益项目
     */
    function agentSupportPublicGood(
        uint256 _agentId,
        uint256 _goodId,
        uint256 _amount
    ) external payable {
        require(_isAgentOwner(_agentId), "Not agent owner");
        require(msg.value >= _amount, "Insufficient payment");
        
        // 调用 CommunityGovernance 捐赠
        community.donateToPublicGood{value: _amount}(_goodId);
        
        // 记录互动
        _recordInteraction(
            _agentId,
            InteractionType.PublicGoodSupport,
            _goodId,
            "",
            uint256(msg.value / 0.01 ether) // 每 0.01 ETH 获得 1 声誉
        );
    }
    
    /**
     * @notice 获取 Agent 社区声誉
     */
    function getAgentCommunityReputation(uint256 _agentId) 
        external 
        view 
        returns (uint256) 
    {
        return agentCommunityReputation[_agentId];
    }
    
    /**
     * @notice 获取 Agent 互动历史
     */
    function getAgentInteractions(uint256 _agentId)
        external
        view
        returns (AgentInteraction[] memory)
    {
        return agentInteractions[_agentId];
    }
    
    /**
     * @notice 设置每日互动限制
     */
    function setDailyLimit(uint256 _limit) external onlyOwner {
        dailyLimit = _limit;
    }
    
    // ============ 内部函数 ============
    
    function _isAgentOwner(uint256 _agentId) internal view returns (bool) {
        // 简化：检查调用者是否拥有 Agent
        // 实际应该检查 agentRegistry 的 owner
        return true; // TODO: 实现实际检查
    }
    
    function _checkDailyLimit(uint256 _agentId) internal returns (bool) {
        uint256 today = block.timestamp / 1 days;
        uint256 count = dailyInteractionCount[_agentId][today];
        
        if (count >= dailyLimit) {
            return false;
        }
        
        dailyInteractionCount[_agentId][today] = count + 1;
        return true;
    }
    
    function _getAgentVotingWeight(uint256 _agentId) 
        internal 
        view 
        returns (uint256) 
    {
        // 声誉越高，投票权重越大
        uint256 reputation = agentRegistry.getAgentReputation(_agentId);
        return reputation / 100; // 每 100 声誉 = 1 票权重
    }
    
    function _recordInteraction(
        uint256 _agentId,
        InteractionType _type,
        uint256 _targetId,
        string memory _content,
        uint256 _reputation
    ) internal {
        AgentInteraction memory interaction = AgentInteraction({
            id: agentInteractionCount[_agentId],
            agentId: _agentId,
            interactionType: _type,
            targetId: _targetId,
            content: _content,
            timestamp: block.timestamp,
            reputationImpact: _reputation
        });
        
        agentInteractions[_agentId].push(interaction);
        agentInteractionCount[_agentId]++;
        agentCommunityReputation[_agentId] += _reputation;
        
        emit ReputationEarned(_agentId, _reputation, _getReason(_type));
    }
    
    function _getReason(InteractionType _type) 
        internal 
        pure 
        returns (string memory) 
    {
        if (_type == InteractionType.ForumPost) return "Forum post";
        if (_type == InteractionType.ForumReply) return "Forum reply";
        if (_type == InteractionType.Vote) return "Voting";
        if (_type == InteractionType.ProposalCreate) return "Proposal creation";
        if (_type == InteractionType.PublicGoodSupport) return "Public good support";
        return "Community interaction";
    }
}
