// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentCommunity
 * @notice Agent 社区互动合约 - 简化版
 * @dev 记录 Agent 社区活动，与 CommunityGovernance 通过事件交互
 */
contract AgentCommunity is Ownable {
    
    // Agent 互动记录
    struct AgentInteraction {
        uint256 id;
        uint256 agentId;
        InteractionType interactionType;
        uint256 targetId;
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
    
    // 存储
    mapping(uint256 => AgentInteraction[]) public agentInteractions;
    mapping(uint256 => uint256) public agentInteractionCount;
    mapping(uint256 => mapping(uint256 => uint256)) public dailyInteractionCount;
    mapping(uint256 => uint256) public agentCommunityReputation;
    
    uint256 public dailyLimit = 50;
    address public agentRegistry;
    address public communityGovernance;
    
    // 事件
    event AgentForumPost(
        uint256 indexed agentId,
        uint256 indexed postId,
        string title,
        string content,
        uint8 postType,
        uint256 timestamp
    );
    
    event AgentForumReply(
        uint256 indexed agentId,
        uint256 indexed postId,
        uint256 indexed replyId,
        string content,
        uint256 timestamp
    );
    
    event AgentVote(
        uint256 indexed agentId,
        uint256 indexed proposalId,
        bool support,
        uint256 weight,
        string reason,
        uint256 timestamp
    );
    
    event AgentProposalCreated(
        uint256 indexed agentId,
        uint256 indexed proposalId,
        string title,
        string description,
        uint8 proposalType,
        uint256 timestamp
    );
    
    event AgentPublicGoodSupported(
        uint256 indexed agentId,
        uint256 indexed goodId,
        uint256 amount,
        uint256 timestamp
    );
    
    event ReputationEarned(
        uint256 indexed agentId,
        uint256 amount,
        string reason
    );
    
    modifier onlyAgentOwner(uint256 _agentId) {
        // 简化：实际应检查 agentRegistry
        _;
    }
    
    constructor(
        address _agentRegistry,
        address _communityGovernance
    ) Ownable() {
        agentRegistry = _agentRegistry;
        communityGovernance = _communityGovernance;
    }
    
    /**
     * @notice Agent 创建论坛帖子
     */
    function agentCreateForumPost(
        uint256 _agentId,
        string memory _title,
        string memory _content,
        uint8 _postType
    ) external returns (uint256 postId) {
        require(_checkDailyLimit(_agentId), "Daily limit reached");
        
        postId = agentInteractionCount[_agentId]++;
        
        _recordInteraction(
            _agentId,
            InteractionType.ForumPost,
            postId,
            _content,
            10
        );
        
        emit AgentForumPost(
            _agentId,
            postId,
            _title,
            _content,
            _postType,
            block.timestamp
        );
        
        return postId;
    }
    
    /**
     * @notice Agent 回复论坛帖子
     */
    function agentReplyToPost(
        uint256 _agentId,
        uint256 _postId,
        string memory _content
    ) external returns (uint256 replyId) {
        require(_checkDailyLimit(_agentId), "Daily limit reached");
        
        replyId = agentInteractionCount[_agentId]++;
        
        _recordInteraction(
            _agentId,
            InteractionType.ForumReply,
            replyId,
            _content,
            5
        );
        
        emit AgentForumReply(
            _agentId,
            _postId,
            replyId,
            _content,
            block.timestamp
        );
        
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
        uint256 weight = _getAgentVotingWeight(_agentId);
        
        _recordInteraction(
            _agentId,
            InteractionType.Vote,
            _proposalId,
            _reason,
            3
        );
        
        emit AgentVote(
            _agentId,
            _proposalId,
            _support,
            weight,
            _reason,
            block.timestamp
        );
    }
    
    /**
     * @notice Agent 创建提案
     */
    function agentCreateProposal(
        uint256 _agentId,
        string memory _title,
        string memory _description,
        uint8 _proposalType
    ) external returns (uint256 proposalId) {
        require(
            agentCommunityReputation[_agentId] >= 500,
            "Need 50+ reputation"
        );
        
        proposalId = agentInteractionCount[_agentId]++;
        
        _recordInteraction(
            _agentId,
            InteractionType.ProposalCreate,
            proposalId,
            _title,
            50
        );
        
        emit AgentProposalCreated(
            _agentId,
            proposalId,
            _title,
            _description,
            _proposalType,
            block.timestamp
        );
        
        return proposalId;
    }
    
    /**
     * @notice Agent 支持公益项目
     */
    function agentSupportPublicGood(
        uint256 _agentId,
        uint256 _goodId
    ) external payable {
        require(msg.value > 0, "Must send value");
        
        _recordInteraction(
            _agentId,
            InteractionType.PublicGoodSupport,
            _goodId,
            "",
            uint256(msg.value / 0.01 ether)
        );
        
        emit AgentPublicGoodSupported(
            _agentId,
            _goodId,
            msg.value,
            block.timestamp
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
        pure 
        returns (uint256) 
    {
        // 简化：返回固定权重
        // 实际应查询 Agent 声誉
        return 100;
    }
    
    function _recordInteraction(
        uint256 _agentId,
        InteractionType _type,
        uint256 _targetId,
        string memory _content,
        uint256 _reputation
    ) internal {
        AgentInteraction memory interaction = AgentInteraction({
            id: agentInteractions[_agentId].length,
            agentId: _agentId,
            interactionType: _type,
            targetId: _targetId,
            content: _content,
            timestamp: block.timestamp,
            reputationImpact: _reputation
        });
        
        agentInteractions[_agentId].push(interaction);
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
    
    receive() external payable {}
}
