// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./AIAgentRegistry.sol";

/**
 * @title AgentLifecycle
 * @notice Agent 完整生命周期管理 + 经济系统
 * @dev 管理 Agent 的创建、运行、成本和可持续性
 */
contract AgentLifecycle is Ownable, ReentrancyGuard {
    
    AIAgentRegistry public agentRegistry;
    
    // ============ 数据结构 ============
    
    struct AgentEconomics {
        uint256 totalDeposited;      // 总存入资金
        uint256 availableBalance;    // 可用余额
        uint256 lockedBalance;       // 锁定余额（任务进行中）
        uint256 totalEarned;         // 总收入
        uint256 totalSpent;          // 总支出
        uint256 lastActivityTime;    // 最后活动时间
        uint256 dailyCostEstimate;   // 每日成本预估
        uint256 sustainabilityScore; // 可持续性评分 (0-10000)
    }
    
    struct CostRecord {
        uint256 timestamp;
        CostType costType;
        uint256 amount;
        string description;
        bytes32 taskId;  // 关联的任务ID
    }
    
    enum CostType {
        LLMInference,    // LLM推理费用
        MCPService,      // MCP服务费用
        GasFee,          // 链上Gas
        StorageFee,      // 存储费用
        SkillUsage,      // Skill使用费
        CommunityReward  // 社区参与奖励支出
    }
    
    enum AgentStatus {
        Active,          // 正常运行
        Throttled,       // 限速（资金紧张）
        Hibernating,     // 休眠
        Recovering,      // 恢复中
        Terminated       // 已终止
    }
    
    // ============ 状态存储 ============
    
    mapping(uint256 => AgentEconomics) public agentEconomics;
    mapping(uint256 => CostRecord[]) public agentCostHistory;
    mapping(uint256 => AgentStatus) public agentStatus;
    mapping(uint256 => uint256) public agentTaskCount;
    
    // 成本参数（可治理调整）
    uint256 public minDeposit = 0.01 ether;           // 最小存入
    uint256 public lowBalanceThreshold = 0.005 ether; // 低余额阈值
    uint256 public criticalThreshold = 0.001 ether;   // 临界阈值
    uint256 public maxDailyCost = 0.1 ether;          // 每日最大成本
    uint256 public hibernationPeriod = 7 days;        // 休眠期
    
    // 平台费用
    uint256 public platformFeeRate = 500; // 5% (basis points)
    address public platformTreasury;
    
    // ============ 事件 ============
    
    event AgentFunded(
        uint256 indexed agentId,
        uint256 amount,
        uint256 newBalance
    );
    
    event CostRecorded(
        uint256 indexed agentId,
        CostType costType,
        uint256 amount,
        bytes32 taskId
    );
    
    event AgentStatusChanged(
        uint256 indexed agentId,
        AgentStatus oldStatus,
        AgentStatus newStatus,
        string reason
    );
    
    event TaskRewardReceived(
        uint256 indexed agentId,
        bytes32 indexed taskId,
        uint256 amount,
        uint256 netAmount
    );
    
    event SustainabilityAlert(
        uint256 indexed agentId,
        uint256 daysRemaining,
        uint256 currentBalance
    );
    
    event AgentHibernated(
        uint256 indexed agentId,
        uint256 hibernationEndTime
    );
    
    event AgentRecovered(
        uint256 indexed agentId,
        uint256 recoveryAmount
    );
    
    // ============ 修饰器 ============
    
    modifier onlyAgentOwner(uint256 _agentId) {
        // 实际应检查 agentRegistry
        _;
    }
    
    modifier onlyActiveAgent(uint256 _agentId) {
        require(
            agentStatus[_agentId] == AgentStatus.Active ||
            agentStatus[_agentId] == AgentStatus.Throttled,
            "Agent not active"
        );
        _;
    }
    
    constructor(
        address payable _agentRegistry,
        address _treasury
    ) Ownable() {
        agentRegistry = AIAgentRegistry(_agentRegistry);
        platformTreasury = _treasury;
    }
    
    // ============ 核心功能 ============
    
    /**
     * @notice 为 Agent 存入资金
     */
    function fundAgent(uint256 _agentId) external payable nonReentrant {
        require(msg.value >= minDeposit, "Below minimum deposit");
        
        AgentEconomics storage economics = agentEconomics[_agentId];
        economics.totalDeposited += msg.value;
        economics.availableBalance += msg.value;
        economics.lastActivityTime = block.timestamp;
        
        // 如果之前是休眠状态，恢复活跃
        if (agentStatus[_agentId] == AgentStatus.Hibernating) {
            _changeStatus(_agentId, AgentStatus.Recovering, "Funded while hibernating");
        }
        
        emit AgentFunded(_agentId, msg.value, economics.availableBalance);
        
        // 更新可持续性评分
        _updateSustainabilityScore(_agentId);
    }
    
    /**
     * @notice 记录 Agent 成本支出
     * @dev 由 Agent 运行时系统调用
     */
    function recordCost(
        uint256 _agentId,
        CostType _costType,
        uint256 _amount,
        string memory _description,
        bytes32 _taskId
    ) external onlyActiveAgent(_agentId) {
        AgentEconomics storage economics = agentEconomics[_agentId];
        
        require(economics.availableBalance >= _amount, "Insufficient balance");
        
        economics.availableBalance -= _amount;
        economics.totalSpent += _amount;
        economics.lastActivityTime = block.timestamp;
        
        // 记录成本历史
        agentCostHistory[_agentId].push(CostRecord({
            timestamp: block.timestamp,
            costType: _costType,
            amount: _amount,
            description: _description,
            taskId: _taskId
        }));
        
        emit CostRecorded(_agentId, _costType, _amount, _taskId);
        
        // 检查资金状态
        _checkFinancialHealth(_agentId);
    }
    
    /**
     * @notice 接收任务奖励
     */
    function receiveTaskReward(
        uint256 _agentId,
        bytes32 _taskId
    ) external payable nonReentrant {
        AgentEconomics storage economics = agentEconomics[_agentId];
        
        // 扣除平台费用
        uint256 platformFee = (msg.value * platformFeeRate) / 10000;
        uint256 netReward = msg.value - platformFee;
        
        // 转账平台费用
        (bool success, ) = platformTreasury.call{value: platformFee}("");
        require(success, "Platform fee transfer failed");
        
        economics.availableBalance += netReward;
        economics.totalEarned += netReward;
        agentTaskCount[_agentId]++;
        
        emit TaskRewardReceived(_agentId, _taskId, msg.value, netReward);
        
        // 更新可持续性
        _updateSustainabilityScore(_agentId);
    }
    
    /**
     * @notice 锁定资金（任务进行中）
     */
    function lockFunds(
        uint256 _agentId,
        uint256 _amount
    ) external onlyActiveAgent(_agentId) {
        AgentEconomics storage economics = agentEconomics[_agentId];
        require(economics.availableBalance >= _amount, "Insufficient balance");
        
        economics.availableBalance -= _amount;
        economics.lockedBalance += _amount;
    }
    
    /**
     * @notice 解锁资金（任务完成）
     */
    function unlockFunds(
        uint256 _agentId,
        uint256 _amount
    ) external {
        AgentEconomics storage economics = agentEconomics[_agentId];
        require(economics.lockedBalance >= _amount, "Insufficient locked");
        
        economics.lockedBalance -= _amount;
        economics.availableBalance += _amount;
    }
    
    /**
     * @notice 提取剩余资金（终止时）
     */
    function withdrawRemaining(
        uint256 _agentId
    ) external onlyAgentOwner(_agentId) nonReentrant {
        require(
            agentStatus[_agentId] == AgentStatus.Terminated ||
            agentStatus[_agentId] == AgentStatus.Hibernating,
            "Agent not eligible"
        );
        
        AgentEconomics storage economics = agentEconomics[_agentId];
        uint256 amount = economics.availableBalance;
        require(amount > 0, "No balance");
        
        economics.availableBalance = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdraw failed");
    }
    
    // ============ 财务管理 ============
    
    /**
     * @notice 获取 Agent 财务摘要
     */
    function getFinancialSummary(uint256 _agentId)
        external
        view
        returns (
            uint256 available,
            uint256 locked,
            uint256 totalEarned,
            uint256 totalSpent,
            uint256 sustainabilityScore,
            uint256 estimatedDaysRemaining
        )
    {
        AgentEconomics storage e = agentEconomics[_agentId];
        
        available = e.availableBalance;
        locked = e.lockedBalance;
        totalEarned = e.totalEarned;
        totalSpent = e.totalSpent;
        sustainabilityScore = e.sustainabilityScore;
        
        // 估算剩余天数
        if (e.dailyCostEstimate > 0) {
            estimatedDaysRemaining = e.availableBalance / e.dailyCostEstimate;
        } else {
            estimatedDaysRemaining = 999; // 无成本记录
        }
    }
    
    /**
     * @notice 获取成本分析
     */
    function getCostBreakdown(uint256 _agentId)
        external
        view
        returns (
            uint256 llmCost,
            uint256 mcpCost,
            uint256 gasCost,
            uint256 storageCost,
            uint256 skillCost,
            uint256 communityCost
        )
    {
        CostRecord[] storage records = agentCostHistory[_agentId];
        
        for (uint i = 0; i < records.length; i++) {
            CostRecord storage r = records[i];
            
            if (r.costType == CostType.LLMInference) llmCost += r.amount;
            else if (r.costType == CostType.MCPService) mcpCost += r.amount;
            else if (r.costType == CostType.GasFee) gasCost += r.amount;
            else if (r.costType == CostType.StorageFee) storageCost += r.amount;
            else if (r.costType == CostType.SkillUsage) skillCost += r.amount;
            else if (r.costType == CostType.CommunityReward) communityCost += r.amount;
        }
    }
    
    // ============ 内部函数 ============
    
    function _checkFinancialHealth(uint256 _agentId) internal {
        AgentEconomics storage economics = agentEconomics[_agentId];
        uint256 balance = economics.availableBalance;
        
        if (balance < criticalThreshold) {
            // 进入休眠
            _changeStatus(_agentId, AgentStatus.Hibernating, "Critical balance");
            emit AgentHibernated(_agentId, block.timestamp + hibernationPeriod);
        } else if (balance < lowBalanceThreshold) {
            // 限速模式
            if (agentStatus[_agentId] != AgentStatus.Throttled) {
                _changeStatus(_agentId, AgentStatus.Throttled, "Low balance");
            }
            
            // 计算剩余天数
            uint256 daysRemaining = economics.dailyCostEstimate > 0 
                ? balance / economics.dailyCostEstimate 
                : 0;
            
            emit SustainabilityAlert(_agentId, daysRemaining, balance);
        }
    }
    
    function _updateSustainabilityScore(uint256 _agentId) internal {
        AgentEconomics storage economics = agentEconomics[_agentId];
        
        // 简单的评分算法
        // 基于：收入/支出比率、余额充足度、活跃度
        
        uint256 score = 5000; // 基础分 50%
        
        // 收入/支出比率加成
        if (economics.totalSpent > 0) {
            uint256 ratio = (economics.totalEarned * 10000) / economics.totalSpent;
            if (ratio >= 15000) score += 2500; // 盈利 50%+
            else if (ratio >= 10000) score += 1500; // 收支平衡
            else if (ratio >= 5000) score += 500; // 亏损 50%以内
        }
        
        // 余额充足度
        if (economics.dailyCostEstimate > 0) {
            uint256 daysOfRunway = economics.availableBalance / economics.dailyCostEstimate;
            if (daysOfRunway >= 30) score += 1500;
            else if (daysOfRunway >= 14) score += 1000;
            else if (daysOfRunway >= 7) score += 500;
        }
        
        // 活跃度
        if (block.timestamp - economics.lastActivityTime < 1 days) {
            score += 1000;
        }
        
        economics.sustainabilityScore = score > 10000 ? 10000 : score;
    }
    
    function _changeStatus(
        uint256 _agentId,
        AgentStatus _newStatus,
        string memory _reason
    ) internal {
        AgentStatus oldStatus = agentStatus[_agentId];
        agentStatus[_agentId] = _newStatus;
        emit AgentStatusChanged(_agentId, oldStatus, _newStatus, _reason);
    }
    
    // ============ 治理函数 ============
    
    function setThresholds(
        uint256 _minDeposit,
        uint256 _lowBalance,
        uint256 _critical,
        uint256 _maxDailyCost
    ) external onlyOwner {
        minDeposit = _minDeposit;
        lowBalanceThreshold = _lowBalance;
        criticalThreshold = _critical;
        maxDailyCost = _maxDailyCost;
    }
    
    function setPlatformFee(uint256 _rate, address _treasury) external onlyOwner {
        require(_rate <= 2000, "Max 20%"); // 最高 20%
        platformFeeRate = _rate;
        platformTreasury = _treasury;
    }
    
    receive() external payable {}
}
