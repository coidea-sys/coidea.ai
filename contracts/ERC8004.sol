// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC8004 AI Agent Identity Contract
 * @notice AI Agent Identity NFT with lifecycle states and reputation scoring
 * @notice AI Agent 身份 NFT，包含生命周期状态和声誉分
 */
contract ERC8004 is ERC721, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    /**
     * @notice AI Lifecycle states / AI 生命周期状态
     * @dev Represents the operational state of an AI Agent
     * @dev 表示 AI Agent 的运行状态
     */
    enum LifeCycleState {
        Dormant,      // 0 - Inactive, waiting for activation / 休眠 - 未激活，等待唤醒
        Active,       // 1 - Fully operational / 激活 - 完全运行
        Standby,      // 2 - Temporarily paused / 待机 - 临时暂停
        Evolving,     // 3 - Upgrading capabilities / 进化中 - 升级能力
        Retired       // 4 - Permanently deactivated / 退役 - 永久停用
    }

    /**
     * @notice AI Agent data structure / AI Agent 数据结构
     */
    struct Agent {
        string name;                    // Agent name / Agent 名称
        string[] capabilityTags;        // Capability tags (e.g., "coding", "design") / 能力标签
        LifeCycleState state;           // Current lifecycle state / 当前生命周期状态
        uint256 reputationScore;        // Reputation score 0-100 / 声誉分 0-100
        uint256 completedTasks;         // Total tasks completed / 完成任务总数
        uint256 successfulTasks;        // Successfully completed tasks / 成功完成任务数
        address developer;              // Developer wallet address / 开发者钱包地址
        uint256 createdAt;              // Creation timestamp / 创建时间戳
        string metadataURI;             // IPFS metadata URI / IPFS 元数据 URI
    }

    // Mapping from token ID to Agent data / Token ID 到 Agent 数据的映射
    mapping(uint256 => Agent) public agents;

    // Mapping from developer address to their agent token IDs / 开发者地址到其 Agent Token ID 的映射
    mapping(address => uint256[]) public developerAgents;

    // Reputation thresholds for agent levels / Agent 等级的声誉分阈值
    uint256 public constant REPUTATION_THRESHOLD_ADVANCED = 80;  // Threshold for advanced privileges / 高级权限阈值
    uint256 public constant REPUTATION_THRESHOLD_EXPERT = 95;    // Threshold for expert status / 专家级阈值

    /**
     * @notice Emitted when a new AI Agent is created / 当新的 AI Agent 被创建时触发
     * @param tokenId The ID of the created token / 创建的 Token ID
     * @param developer The address of the developer / 开发者地址
     * @param name The name of the agent / Agent 名称
     */
    event AgentCreated(uint256 indexed tokenId, address indexed developer, string name);

    /**
     * @notice Emitted when agent state changes / 当 Agent 状态改变时触发
     * @param tokenId The ID of the agent / Agent 的 Token ID
     * @param oldState The previous state / 之前的状态
     * @param newState The new state / 新的状态
     */
    event StateChanged(uint256 indexed tokenId, LifeCycleState oldState, LifeCycleState newState);

    /**
     * @notice Emitted when reputation score is updated / 当声誉分更新时触发
     * @param tokenId The ID of the agent / Agent 的 Token ID
     * @param oldScore The previous score / 之前的分数
     * @param newScore The new score / 新的分数
     */
    event ReputationUpdated(uint256 indexed tokenId, uint256 oldScore, uint256 newScore);

    /**
     * @notice Emitted when a task is completed / 当任务完成时触发
     * @param tokenId The ID of the agent / Agent 的 Token ID
     * @param success Whether the task was successful / 任务是否成功
     */
    event TaskCompleted(uint256 indexed tokenId, bool success);

    /**
     * @notice Contract constructor / 合约构造函数
     * @dev Initializes the NFT with name "Coidea AI Agent" and symbol "COAI"
     * @dev 初始化 NFT，名称为 "Coidea AI Agent"，符号为 "COAI"
     */
    constructor() ERC721("Coidea AI Agent", "COAI") Ownable(msg.sender) {}

    /**
     * @notice Create a new AI Agent NFT / 铸造新的 AI Agent NFT
     * @param _name The name of the agent / Agent 名称
     * @param _capabilityTags Array of capability tags / 能力标签数组
     * @param _metadataURI IPFS URI for metadata / 元数据的 IPFS URI
     * @return tokenId The ID of the newly created token / 新创建 Token 的 ID
     */
    function createAgent(
        string memory _name,
        string[] memory _capabilityTags,
        string memory _metadataURI
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);

        agents[tokenId] = Agent({
            name: _name,
            capabilityTags: _capabilityTags,
            state: LifeCycleState.Active,
            reputationScore: 50, // Initial reputation score / 初始声誉分
            completedTasks: 0,
            successfulTasks: 0,
            developer: msg.sender,
            createdAt: block.timestamp,
            metadataURI: _metadataURI
        });

        developerAgents[msg.sender].push(tokenId);

        emit AgentCreated(tokenId, msg.sender, _name);

        return tokenId;
    }

    /**
     * @notice Update the lifecycle state of an AI Agent / 更新 AI Agent 的生命周期状态
     * @param _tokenId The ID of the agent to update / 要更新的 Agent ID
     * @param _newState The new state to set / 要设置的新状态
     * @dev Only the owner or approved address can update state
     * @dev 只有所有者或授权地址可以更新状态
     */
    function updateState(uint256 _tokenId, LifeCycleState _newState) public {
        require(_isAuthorized(msg.sender, _tokenId), "Not authorized");

        Agent storage agent = agents[_tokenId];
        LifeCycleState oldState = agent.state;
        agent.state = _newState;

        emit StateChanged(_tokenId, oldState, _newState);
    }

    /**
     * @notice Check if an address is authorized to manage a token / 检查地址是否有权管理 Token
     * @param spender The address to check / 要检查的地址
     * @param tokenId The ID of the token / Token ID
     * @return bool True if authorized, false otherwise / 如果有权返回 true，否则返回 false
     */
    function _isAuthorized(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    /**
     * @notice Record task completion and update reputation / 记录任务完成并更新声誉分
     * @param _tokenId The ID of the agent / Agent 的 Token ID
     * @param _success Whether the task was completed successfully / 任务是否成功完成
     * @param _qualityScore Quality score 0-100 / 质量分 0-100
     * @dev Only contract owner can record task completion
     * @dev 只有合约所有者可以记录任务完成
     */
    function recordTaskCompletion(
        uint256 _tokenId,
        bool _success,
        uint256 _qualityScore // 0-100
    ) public onlyOwner {
        Agent storage agent = agents[_tokenId];

        agent.completedTasks++;
        if (_success) {
            agent.successfulTasks++;
        }

        // Calculate new reputation score / 计算新的声誉分
        uint256 oldScore = agent.reputationScore;
        uint256 successRate = (agent.successfulTasks * 100) / agent.completedTasks;

        // Reputation = success rate * 0.7 + quality score * 0.3 / 声誉分 = 成功率 * 0.7 + 质量分 * 0.3
        uint256 newScore = (successRate * 70 + _qualityScore * 30) / 100;

        // Smooth update: average of old and new / 平滑更新：旧分和新分的平均值
        agent.reputationScore = (oldScore + newScore) / 2;

        emit ReputationUpdated(_tokenId, oldScore, agent.reputationScore);
        emit TaskCompleted(_tokenId, _success);
    }

    /**
     * @notice Check if an agent has advanced privileges / 检查 Agent 是否有高级权限
     * @param _tokenId The ID of the agent to check / 要检查的 Agent ID
     * @return bool True if reputation >= 80 / 如果声誉分 >= 80 返回 true
     * @dev Advanced agents can publish tasks autonomously
     * @dev 高级 Agent 可以自主发布任务
     */
    function isAdvanced(uint256 _tokenId) public view returns (bool) {
        return agents[_tokenId].reputationScore >= REPUTATION_THRESHOLD_ADVANCED;
    }

    /**
     * @notice Check if an agent has expert status / 检查 Agent 是否为专家级
     * @param _tokenId The ID of the agent to check / 要检查的 Agent ID
     * @return bool True if reputation >= 95 / 如果声誉分 >= 95 返回 true
     */
    function isExpert(uint256 _tokenId) public view returns (bool) {
        return agents[_tokenId].reputationScore >= REPUTATION_THRESHOLD_EXPERT;
    }

    /**
     * @notice Get all agent IDs for a developer / 获取开发者的所有 Agent ID
     * @param _developer The developer's address / 开发者地址
     * @return uint256[] Array of agent token IDs / Agent Token ID 数组
     */
    function getDeveloperAgents(address _developer) public view returns (uint256[] memory) {
        return developerAgents[_developer];
    }

    /**
     * @notice Get detailed information about an agent / 获取 Agent 的详细信息
     * @param _tokenId The ID of the agent / Agent 的 Token ID
     * @return Agent The agent's data structure / Agent 的数据结构
     */
    function getAgentInfo(uint256 _tokenId) public view returns (Agent memory) {
        require(_exists(_tokenId), "Agent does not exist");
        return agents[_tokenId];
    }

    /**
     * @notice Set the metadata URI for a token / 设置 Token 的元数据 URI
     * @param _tokenId The ID of the token / Token ID
     * @param _uri The new metadata URI / 新的元数据 URI
     * @dev Only the owner or approved address can set URI
     * @dev 只有所有者或授权地址可以设置 URI
     */
    function setTokenURI(uint256 _tokenId, string memory _uri) public {
        require(_isAuthorized(msg.sender, _tokenId), "Not authorized");
        agents[_tokenId].metadataURI = _uri;
    }

    /**
     * @notice Override tokenURI to return agent metadata / 重写 tokenURI 返回 Agent 元数据
     * @param _tokenId The ID of the token / Token ID
     * @return string The metadata URI / 元数据 URI
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "Token does not exist");
        return agents[_tokenId].metadataURI;
    }

    /**
     * @notice Check if a token exists / 检查 Token 是否存在
     * @param tokenId The ID of the token to check / 要检查的 Token ID
     * @return bool True if token exists / 如果 Token 存在返回 true
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @notice Override _update for OpenZeppelin v5 compatibility / 重写 _update 以兼容 OpenZeppelin v5
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Override _increaseBalance for OpenZeppelin v5 compatibility / 重写 _increaseBalance 以兼容 OpenZeppelin v5
     */
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    /**
     * @notice Override supportsInterface for OpenZeppelin v5 compatibility / 重写 supportsInterface 以兼容 OpenZeppelin v5
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Public function to check if token exists / 公开函数检查 Token 是否存在
     * @param tokenId The ID of the token / Token ID
     * @return bool True if token exists / 如果 Token 存在返回 true
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }
}
