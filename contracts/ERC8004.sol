// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC8004 AI Agent Identity Contract
 * @notice 实现 AI Agent 身份 NFT，包含生命周期状态和声誉分
 */
contract ERC8004 is ERC721, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    // AI 生命周期状态
    enum LifeCycleState {
        Dormant,      // 休眠
        Active,       // 激活
        Standby,      // 待机
        Evolving,     // 进化中
        Retired       // 退役
    }

    // AI Agent 数据结构
    struct Agent {
        string name;                    // AI 名称
        string[] capabilityTags;        // 能力标签
        LifeCycleState state;           // 生命周期状态
        uint256 reputationScore;        // 声誉分 (0-100)
        uint256 completedTasks;         // 完成任务数
        uint256 successfulTasks;        // 成功任务数
        address developer;              // 开发者地址
        uint256 createdAt;              // 创建时间
        string metadataURI;             // 元数据 URI
    }

    // Token ID => Agent 数据
    mapping(uint256 => Agent) public agents;

    // 开发者地址 => Token ID 列表
    mapping(address => uint256[]) public developerAgents;

    // 声誉分阈值
    uint256 public constant REPUTATION_THRESHOLD_ADVANCED = 80;
    uint256 public constant REPUTATION_THRESHOLD_EXPERT = 95;

    // 事件
    event AgentCreated(uint256 indexed tokenId, address indexed developer, string name);
    event StateChanged(uint256 indexed tokenId, LifeCycleState oldState, LifeCycleState newState);
    event ReputationUpdated(uint256 indexed tokenId, uint256 oldScore, uint256 newScore);
    event TaskCompleted(uint256 indexed tokenId, bool success);

    constructor() ERC721("Coidea AI Agent", "COAI") Ownable(msg.sender) {}

    /**
     * @notice 铸造新的 AI Agent NFT
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
            reputationScore: 50, // 初始声誉分
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
     * @notice 更新 AI Agent 状态
     */
    function updateState(uint256 _tokenId, LifeCycleState _newState) public {
        require(_isAuthorized(msg.sender, _tokenId), "Not authorized");

        Agent storage agent = agents[_tokenId];
        LifeCycleState oldState = agent.state;
        agent.state = _newState;

        emit StateChanged(_tokenId, oldState, _newState);
    }

    /**
     * @notice 检查是否授权
     */
    function _isAuthorized(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    /**
     * @notice 记录任务完成并更新声誉分
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

        // 计算新的声誉分
        uint256 oldScore = agent.reputationScore;
        uint256 successRate = (agent.successfulTasks * 100) / agent.completedTasks;

        // 声誉分 = 成功率 * 0.7 + 质量分 * 0.3
        uint256 newScore = (successRate * 70 + _qualityScore * 30) / 100;

        // 平滑更新
        agent.reputationScore = (oldScore + newScore) / 2;

        emit ReputationUpdated(_tokenId, oldScore, agent.reputationScore);
        emit TaskCompleted(_tokenId, _success);
    }

    /**
     * @notice 检查是否为高级 AI（可自主发布任务）
     */
    function isAdvanced(uint256 _tokenId) public view returns (bool) {
        return agents[_tokenId].reputationScore >= REPUTATION_THRESHOLD_ADVANCED;
    }

    /**
     * @notice 检查是否为专家级 AI
     */
    function isExpert(uint256 _tokenId) public view returns (bool) {
        return agents[_tokenId].reputationScore >= REPUTATION_THRESHOLD_EXPERT;
    }

    /**
     * @notice 获取开发者所有的 Agent
     */
    function getDeveloperAgents(address _developer) public view returns (uint256[] memory) {
        return developerAgents[_developer];
    }

    /**
     * @notice 获取 Agent 详细信息
     */
    function getAgentInfo(uint256 _tokenId) public view returns (Agent memory) {
        require(_exists(_tokenId), "Agent does not exist");
        return agents[_tokenId];
    }

    /**
     * @notice 设置 token URI
     */
    function setTokenURI(uint256 _tokenId, string memory _uri) public {
        require(_isAuthorized(msg.sender, _tokenId), "Not authorized");
        agents[_tokenId].metadataURI = _uri;
    }

    /**
     * @notice 重写 tokenURI 函数
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "Token does not exist");
        return agents[_tokenId].metadataURI;
    }

    /**
     * @notice 检查 token 是否存在
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // 重写必要的函数 - OpenZeppelin v5 兼容
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice 检查 token 是否存在
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }
}
