// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HumanRegistry
 * @notice Human 用户注册与身份管理
 * @dev Human 是平台的核心参与者，拥有最高权限
 */
contract HumanRegistry is Ownable, ReentrancyGuard {
    
    // ============ 数据结构 ============
    
    struct HumanProfile {
        address wallet;
        string username;
        string metadataURI;      // IPFS 链接，包含头像、简介等
        uint256 registeredAt;
        uint256 reputation;
        uint256 totalTasksCreated;
        uint256 totalTasksCompleted;
        uint256 totalSpent;
        uint256 totalEarned;
        bool isVerified;
        bool isActive;
    }
    
    struct HumanStats {
        uint256 taskSuccessRate;     // 任务成功率 (basis points)
        uint256 avgTaskValue;        // 平均任务价值
        uint256 communityScore;      // 社区贡献分
        uint256 agentOwnershipCount; // 拥有的 Agent 数量
        uint256 lastActivityTime;
    }
    
    // ============ 状态存储 ============
    
    mapping(address => HumanProfile) public humans;
    mapping(address => HumanStats) public humanStats;
    mapping(string => address) public usernameToAddress;
    mapping(address => uint256[]) public humanTaskHistory;
    mapping(address => uint256[]) public humanAgentIds;
    
    address[] public humanList;
    uint256 public totalHumans;
    
    // 平台代币（可选）
    IERC20 public platformToken;
    bool public useTokenRewards;
    
    // 注册费用（防止垃圾账户）
    uint256 public registrationFee = 0.001 ether;
    address public feeRecipient;
    
    // ============ 事件 ============
    
    event HumanRegistered(
        address indexed wallet,
        string username,
        uint256 timestamp
    );
    
    event HumanUpdated(
        address indexed wallet,
        string field,
        string value
    );
    
    event HumanVerified(
        address indexed wallet,
        string verificationMethod
    );
    
    event ReputationChanged(
        address indexed wallet,
        int256 delta,
        uint256 newReputation,
        string reason
    );
    
    event TaskCreated(
        address indexed human,
        uint256 indexed taskId,
        uint256 reward
    );
    
    event TaskCompleted(
        address indexed human,
        uint256 indexed taskId,
        uint256 payment
    );
    
    event AgentCreated(
        address indexed human,
        uint256 indexed agentId,
        string agentName
    );
    
    // ============ 修饰符 ============
    
    modifier onlyHuman() {
        require(humans[msg.sender].registeredAt > 0, "Not registered");
        require(humans[msg.sender].isActive, "Account inactive");
        _;
    }
    
    modifier onlyVerified() {
        require(humans[msg.sender].isVerified, "Not verified");
        _;
    }
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }
    
    // ============ 注册与管理 ============
    
    /**
     * @notice 注册 Human 账户
     */
    function register(
        string memory _username,
        string memory _metadataURI
    ) external payable nonReentrant {
        require(bytes(_username).length >= 3, "Username too short");
        require(bytes(_username).length <= 32, "Username too long");
        require(humans[msg.sender].registeredAt == 0, "Already registered");
        require(usernameToAddress[_username] == address(0), "Username taken");
        require(msg.value >= registrationFee, "Insufficient fee");
        
        // 转账注册费
        (bool success, ) = feeRecipient.call{value: msg.value}("");
        require(success, "Fee transfer failed");
        
        // 创建档案
        humans[msg.sender] = HumanProfile({
            wallet: msg.sender,
            username: _username,
            metadataURI: _metadataURI,
            registeredAt: block.timestamp,
            reputation: 100, // 初始声誉
            totalTasksCreated: 0,
            totalTasksCompleted: 0,
            totalSpent: 0,
            totalEarned: 0,
            isVerified: false,
            isActive: true
        });
        
        // 初始化统计
        humanStats[msg.sender] = HumanStats({
            taskSuccessRate: 0,
            avgTaskValue: 0,
            communityScore: 0,
            agentOwnershipCount: 0,
            lastActivityTime: block.timestamp
        });
        
        usernameToAddress[_username] = msg.sender;
        humanList.push(msg.sender);
        totalHumans++;
        
        emit HumanRegistered(msg.sender, _username, block.timestamp);
    }
    
    /**
     * @notice 更新档案
     */
    function updateProfile(string memory _metadataURI) external onlyHuman {
        humans[msg.sender].metadataURI = _metadataURI;
        emit HumanUpdated(msg.sender, "metadataURI", _metadataURI);
    }
    
    /**
     * @notice 账户验证
     * @dev 可以通过多种方式：社交验证、KYC、质押等
     */
    function verifyHuman(
        address _human,
        string memory _method
    ) external onlyOwner {
        require(humans[_human].registeredAt > 0, "Human not found");
        humans[_human].isVerified = true;
        emit HumanVerified(_human, _method);
    }
    
    /**
     * @notice 停用账户
     */
    function deactivateAccount() external onlyHuman {
        humans[msg.sender].isActive = false;
    }
    
    /**
     * @notice 重新激活
     */
    function reactivateAccount() external {
        require(humans[msg.sender].registeredAt > 0, "Not registered");
        require(!humans[msg.sender].isActive, "Already active");
        humans[msg.sender].isActive = true;
        humanStats[msg.sender].lastActivityTime = block.timestamp;
    }
    
    // ============ 声誉系统 ============
    
    /**
     * @notice 增加声誉
     */
    function increaseReputation(
        address _human,
        uint256 _amount,
        string memory _reason
    ) external {
        // 实际应该限制调用者
        humans[_human].reputation += _amount;
        emit ReputationChanged(_human, int256(_amount), humans[_human].reputation, _reason);
    }
    
    /**
     * @notice 减少声誉
     */
    function decreaseReputation(
        address _human,
        uint256 _amount,
        string memory _reason
    ) external {
        humans[_human].reputation = humans[_human].reputation > _amount 
            ? humans[_human].reputation - _amount 
            : 0;
        emit ReputationChanged(_human, -int256(_amount), humans[_human].reputation, _reason);
    }
    
    // ============ 统计更新 ============
    
    function recordTaskCreated(
        address _human,
        uint256 _taskId,
        uint256 _reward
    ) external {
        humans[_human].totalTasksCreated++;
        humans[_human].totalSpent += _reward;
        humanStats[_human].lastActivityTime = block.timestamp;
        humanTaskHistory[_human].push(_taskId);
        
        _updateAvgTaskValue(_human, _reward);
        
        emit TaskCreated(_human, _taskId, _reward);
    }
    
    function recordTaskCompleted(
        address _human,
        uint256 _taskId,
        uint256 _payment
    ) external {
        humans[_human].totalTasksCompleted++;
        humans[_human].totalEarned += _payment;
        humanStats[_human].lastActivityTime = block.timestamp;
        
        // 更新成功率
        _updateSuccessRate(_human);
        
        emit TaskCompleted(_human, _taskId, _payment);
    }
    
    function recordAgentCreated(
        address _human,
        uint256 _agentId,
        string memory _agentName
    ) external {
        humanAgentIds[_human].push(_agentId);
        humanStats[_human].agentOwnershipCount++;
        humanStats[_human].lastActivityTime = block.timestamp;
        
        emit AgentCreated(_human, _agentId, _agentName);
    }
    
    function updateCommunityScore(address _human, uint256 _score) external {
        humanStats[_human].communityScore = _score;
        humanStats[_human].lastActivityTime = block.timestamp;
    }
    
    // ============ 查询 ============
    
    function getHumanProfile(address _human)
        external
        view
        returns (HumanProfile memory)
    {
        return humans[_human];
    }
    
    function getHumanStats(address _human)
        external
        view
        returns (HumanStats memory)
    {
        return humanStats[_human];
    }
    
    function getHumanTaskHistory(address _human)
        external
        view
        returns (uint256[] memory)
    {
        return humanTaskHistory[_human];
    }
    
    function getHumanAgents(address _human)
        external
        view
        returns (uint256[] memory)
    {
        return humanAgentIds[_human];
    }
    
    function isHuman(address _addr) external view returns (bool) {
        return humans[_addr].registeredAt > 0 && humans[_addr].isActive;
    }
    
    function isVerifiedHuman(address _addr) external view returns (bool) {
        return humans[_addr].isVerified;
    }
    
    // ============ 内部函数 ============
    
    function _updateSuccessRate(address _human) internal {
        HumanProfile storage p = humans[_human];
        if (p.totalTasksCreated > 0) {
            humanStats[_human].taskSuccessRate = 
                (p.totalTasksCompleted * 10000) / p.totalTasksCreated;
        }
    }
    
    function _updateAvgTaskValue(address _human, uint256 _newValue) internal {
        HumanStats storage s = humanStats[_human];
        HumanProfile storage p = humans[_human];
        
        if (p.totalTasksCreated == 1) {
            s.avgTaskValue = _newValue;
        } else {
            // 移动平均
            s.avgTaskValue = ((s.avgTaskValue * (p.totalTasksCreated - 1)) + _newValue) 
                / p.totalTasksCreated;
        }
    }
    
    // ============ 治理 ============
    
    function setRegistrationFee(uint256 _fee) external onlyOwner {
        registrationFee = _fee;
    }
    
    function setPlatformToken(address _token) external onlyOwner {
        platformToken = IERC20(_token);
        useTokenRewards = _token != address(0);
    }
    
    function setFeeRecipient(address _recipient) external onlyOwner {
        feeRecipient = _recipient;
    }
}
