// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIAgentRegistry
 * @notice AI Agent Identity Registry inspired by ERC-8004 standard
 * @notice 受 ERC-8004 标准启发的 AI Agent 身份注册表
 * 
 * @dev Manages AI Agent identity, lifecycle, and reputation on-chain
 * @dev 在链上管理 AI Agent 身份、生命周期和声誉
 * 
 * Features / 特性:
 * - Agent registration with unique global ID / Agent 注册，获得唯一全局 ID
 * - agentURI pointing to offchain metadata (ERC-8004 compatible) / agentURI 指向链下元数据（兼容 ERC-8004）
 * - agentWallet for x402 payments / agentWallet 用于 x402 支付
 * - Reputation scoring with precision / 高精度声誉评分
 * - Lifecycle state management / 生命周期状态管理
 */
contract AIAgentRegistry is ERC721, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    /**
     * @notice Agent lifecycle states / Agent 生命周期状态
     * @dev Inactive: Not yet activated / 未激活
     * @dev Active: Fully operational / 运行中
     * @dev Suspended: Temporarily paused / 暂停
     * @dev Revoked: Permanently revoked / 永久撤销
     */
    enum AgentState {
        Inactive,
        Active,
        Suspended,
        Revoked
    }

    /**
     * @notice Agent registration data / Agent 注册数据
     */
    struct Agent {
        string agentName;               // Agent display name / Agent 显示名称
        string agentURI;                // Offchain metadata URI / 链下元数据 URI
        address agentWallet;            // Primary wallet for x402 payments / x402 支付主钱包
        AgentState state;               // Current lifecycle state / 当前生命周期状态
        uint256 reputationScore;        // Reputation 0-10000 (100.00%) / 声誉分 0-10000
        uint256 totalTasks;             // Total tasks completed / 完成任务总数
        uint256 successfulTasks;        // Successful task completions / 成功任务数
        address registrant;             // Original registrant / 原始注册者
        uint256 registeredAt;           // Registration timestamp / 注册时间戳
        uint256 updatedAt;              // Last update timestamp / 最后更新时间戳
    }

    // tokenId => Agent data / tokenId => Agent 数据
    mapping(uint256 => Agent) public agents;
    
    // agentWallet => tokenId / agentWallet => tokenId
    mapping(address => uint256) public walletToAgent;
    
    // registrant => tokenIds[] / 注册者 => tokenId 列表
    mapping(address => uint256[]) public registrantAgents;
    
    // Reputation thresholds (scaled by 100) / 声誉阈值 (放大100倍)
    uint256 public constant REPUTATION_THRESHOLD_TRUSTED = 7000;   // 70.00
    uint256 public constant REPUTATION_THRESHOLD_VERIFIED = 8500;  // 85.00
    uint256 public constant REPUTATION_THRESHOLD_EXPERT = 9500;    // 95.00
    uint256 public constant MAX_REPUTATION = 10000;                // 100.00
    uint256 public constant MIN_REPUTATION = 0;                    // 0.00
    
    uint256 public minReputationThreshold = 1000; // 10.00 minimum for operations
    uint256 public registrationFee = 0;
    address public feeRecipient;

    // Events / 事件
    event AgentRegistered(
        uint256 indexed tokenId,
        address indexed registrant,
        string agentName,
        string agentURI,
        address agentWallet
    );
    
    event AgentURIUpdated(uint256 indexed tokenId, string newAgentURI);
    event AgentStateChanged(uint256 indexed tokenId, AgentState oldState, AgentState newState);
    event ReputationUpdated(uint256 indexed tokenId, uint256 oldScore, uint256 newScore);
    event TaskRecorded(uint256 indexed tokenId, bool success, bytes32 indexed taskId);

    constructor(address _feeRecipient) 
        ERC721("AI Agent Registry", "AGENT") 
        Ownable() 
    {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Register a new AI Agent / 注册新的 AI Agent
     * @param _agentName Agent display name / Agent 显示名称
     * @param _agentURI Metadata URI (IPFS recommended) / 元数据 URI（推荐 IPFS）
     * @param _agentWallet Wallet for x402 payments / x402 支付钱包
     * @return tokenId Unique agent ID / 唯一 Agent ID
     */
    function registerAgent(
        string memory _agentName,
        string memory _agentURI,
        address _agentWallet
    ) public payable returns (uint256) {
        require(bytes(_agentName).length > 0, "Agent name required");
        require(bytes(_agentName).length <= 200, "Name too long");
        require(bytes(_agentURI).length > 0, "Agent URI required");
        require(_agentWallet != address(0), "Invalid wallet address");
        require(walletToAgent[_agentWallet] == 0, "Wallet already registered");
        
        if (registrationFee > 0) {
            require(msg.value >= registrationFee, "Insufficient fee");
        }
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        
        agents[tokenId] = Agent({
            agentName: _agentName,
            agentURI: _agentURI,
            agentWallet: _agentWallet,
            state: AgentState.Active,
            reputationScore: 5000, // Initial: 50.00
            totalTasks: 0,
            successfulTasks: 0,
            registrant: msg.sender,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        walletToAgent[_agentWallet] = tokenId;
        registrantAgents[msg.sender].push(tokenId);
        
        emit AgentRegistered(tokenId, msg.sender, _agentName, _agentURI, _agentWallet);
        
        return tokenId;
    }

    /**
     * @notice Update agent metadata URI / 更新 Agent 元数据 URI
     * @param _tokenId Agent ID / Agent ID
     * @param _newAgentURI New metadata URI / 新的元数据 URI
     */
    function updateAgentURI(uint256 _tokenId, string memory _newAgentURI) public {
        require(_isAuthorized(msg.sender, _tokenId), "Not authorized");
        require(bytes(_newAgentURI).length > 0, "URI required");
        
        agents[_tokenId].agentURI = _newAgentURI;
        agents[_tokenId].updatedAt = block.timestamp;
        
        emit AgentURIUpdated(_tokenId, _newAgentURI);
    }

    /**
     * @notice Update agent state / 更新 Agent 状态
     * @param _tokenId Agent ID / Agent ID
     * @param _newState New state / 新状态
     */
    function updateState(uint256 _tokenId, AgentState _newState) public {
        require(_isAuthorized(msg.sender, _tokenId), "Not authorized");
        
        Agent storage agent = agents[_tokenId];
        AgentState oldState = agent.state;
        
        require(_isValidStateTransition(oldState, _newState), "Invalid state transition");
        
        agent.state = _newState;
        agent.updatedAt = block.timestamp;
        
        emit AgentStateChanged(_tokenId, oldState, _newState);
    }

    /**
     * @notice Check if state transition is valid / 检查状态转换是否有效
     * @param _oldState Current state / 当前状态
     * @param _newState Target state / 目标状态
     * @return bool True if valid / 如果有效返回 true
     */
    function _isValidStateTransition(AgentState _oldState, AgentState _newState) 
        internal pure returns (bool) 
    {
        // Revoked is final state / 撤销是最终状态
        if (_oldState == AgentState.Revoked) {
            return false;
        }
        return true;
    }

    /**
     * @notice Record task completion and update reputation / 记录任务完成并更新声誉
     * @param _tokenId Agent ID / Agent ID
     * @param _success Whether task succeeded / 任务是否成功
     * @param _qualityScore Quality score 0-100 / 质量分 0-100
     * @param _taskId External task identifier / 外部任务标识符
     */
    function recordTaskCompletion(
        uint256 _tokenId,
        bool _success,
        uint256 _qualityScore,
        bytes32 _taskId
    ) public onlyOwner {
        require(_exists(_tokenId), "Agent does not exist");
        require(_qualityScore <= 100, "Quality score must be 0-100");
        
        Agent storage agent = agents[_tokenId];
        
        agent.totalTasks++;
        if (_success) {
            agent.successfulTasks++;
        }
        
        uint256 oldScore = agent.reputationScore;
        
        // Calculate with precision / 高精度计算
        uint256 successRate = agent.totalTasks == 0 ? 0 : 
            (agent.successfulTasks * 10000) / agent.totalTasks;
        
        // Weighted: 70% success rate, 30% quality / 加权：70% 成功率，30% 质量分
        uint256 newScore = (successRate * 70 + _qualityScore * 3000) / 100;
        
        // Bound check / 边界检查
        if (newScore > MAX_REPUTATION) newScore = MAX_REPUTATION;
        if (newScore < MIN_REPUTATION) newScore = MIN_REPUTATION;
        
        // Smooth update / 平滑更新
        agent.reputationScore = (oldScore + newScore) / 2;
        agent.updatedAt = block.timestamp;
        
        emit ReputationUpdated(_tokenId, oldScore, agent.reputationScore);
        emit TaskRecorded(_tokenId, _success, _taskId);
    }

    /**
     * @notice Check if agent is trusted / 检查 Agent 是否可信
     * @param _tokenId Agent ID / Agent ID
     * @return bool True if reputation >= 70.00
     */
    function isTrusted(uint256 _tokenId) public view returns (bool) {
        return agents[_tokenId].reputationScore >= REPUTATION_THRESHOLD_TRUSTED;
    }

    /**
     * @notice Check if agent is verified / 检查 Agent 是否已验证
     * @param _tokenId Agent ID / Agent ID
     * @return bool True if reputation >= 85.00
     */
    function isVerified(uint256 _tokenId) public view returns (bool) {
        return agents[_tokenId].reputationScore >= REPUTATION_THRESHOLD_VERIFIED;
    }

    /**
     * @notice Check if agent is expert / 检查 Agent 是否为专家
     * @param _tokenId Agent ID / Agent ID
     * @return bool True if reputation >= 95.00
     */
    function isExpert(uint256 _tokenId) public view returns (bool) {
        return agents[_tokenId].reputationScore >= REPUTATION_THRESHOLD_EXPERT;
    }

    /**
     * @notice Get agent info by wallet / 通过钱包获取 Agent 信息
     * @param _wallet Agent wallet address / Agent 钱包地址
     * @return Agent memory Agent data / Agent 数据
     */
    function getAgentByWallet(address _wallet) public view returns (Agent memory) {
        uint256 tokenId = walletToAgent[_wallet];
        require(tokenId != 0 || _wallet == agents[0].agentWallet, "Wallet not registered");
        return agents[tokenId];
    }

    /**
     * @notice Get all agents for registrant / 获取注册者的所有 Agent
     * @param _registrant Registrant address / 注册者地址
     * @return uint256[] Array of token IDs / Token ID 数组
     */
    function getRegistrantAgents(address _registrant) public view returns (uint256[] memory) {
        return registrantAgents[_registrant];
    }

    /**
     * @notice Check if wallet is registered / 检查钱包是否已注册
     * @param _wallet Wallet address / 钱包地址
     * @return bool True if registered / 如果已注册返回 true
     */
    function isWalletRegistered(address _wallet) public view returns (bool) {
        return walletToAgent[_wallet] != 0;
    }

    /**
     * @notice Override tokenURI to return agentURI / 重写 tokenURI 返回 agentURI
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "Token does not exist");
        return agents[_tokenId].agentURI;
    }

    /**
     * @notice Check if address is authorized / 检查地址是否授权
     */
    function _isAuthorized(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    /**
     * @notice Check if token exists / 检查 Token 是否存在
     */
    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // Override required functions / 重写必要函数
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Admin functions / 管理员函数
    function setRegistrationFee(uint256 _fee) public onlyOwner {
        registrationFee = _fee;
    }

    function setMinReputationThreshold(uint256 _threshold) public onlyOwner {
        require(_threshold <= MAX_REPUTATION, "Threshold too high");
        minReputationThreshold = _threshold;
    }

    function setFeeRecipient(address _recipient) public onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        feeRecipient = _recipient;
    }

    function withdrawFees() public onlyOwner {
        (bool success, ) = payable(feeRecipient).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}
