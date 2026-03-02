// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./HumanRegistry.sol";
import "./AgentLifecycle.sol";

/**
 * @title HumanEconomy
 * @notice Human 用户经济系统
 * @dev 管理 Human 的资金、收益、Agent 投资等
 */
contract HumanEconomy is Ownable, ReentrancyGuard {
    
    HumanRegistry public humanRegistry;
    AgentLifecycle public agentLifecycle;
    
    // ============ 数据结构 ============
    
    struct HumanWallet {
        uint256 availableBalance;    // 可用余额
        uint256 lockedInTasks;       // 锁定在任务中的资金
        uint256 investedInAgents;    // 投资在 Agent 中的资金
        uint256 totalDeposited;      // 总存入
        uint256 totalWithdrawn;      // 总提取
        uint256 totalRewards;        // 总奖励
    }
    
    struct AgentInvestment {
        uint256 agentId;
        uint256 amount;
        uint256 investedAt;
        uint256 sharePercent;        // 收益分成比例 (basis points)
        bool isActive;
    }
    
    struct RevenueShare {
        uint256 agentId;
        uint256 amount;
        uint256 timestamp;
        uint256 taskId;
    }
    
    // ============ 状态存储 ============
    
    mapping(address => HumanWallet) public humanWallets;
    mapping(address => AgentInvestment[]) public humanAgentInvestments;
    mapping(address => RevenueShare[]) public humanRevenueHistory;
    
    // Agent 投资者列表
    mapping(uint256 => address[]) public agentInvestors;
    mapping(uint256 => mapping(address => uint256)) public agentInvestmentIndex;
    
    // 平台费用
    uint256 public platformFeeRate = 500;        // 5%
    uint256 public agentRevenueShare = 3000;     // Agent 保留 30%
    uint256 public investorShare = 7000;         // 投资者分 70%
    address public platformTreasury;
    
    // 收益分配阈值
    uint256 public minDistributionAmount = 0.001 ether;
    
    // ============ 事件 ============
    
    event Deposited(
        address indexed human,
        uint256 amount,
        uint256 newBalance
    );
    
    event Withdrawn(
        address indexed human,
        uint256 amount,
        uint256 newBalance
    );
    
    event AgentInvested(
        address indexed human,
        uint256 indexed agentId,
        uint256 amount,
        uint256 sharePercent
    );
    
    event InvestmentWithdrawn(
        address indexed human,
        uint256 indexed agentId,
        uint256 amount
    );
    
    event RevenueDistributed(
        address indexed human,
        uint256 indexed agentId,
        uint256 amount,
        uint256 taskId
    );
    
    event TaskFunded(
        address indexed human,
        uint256 indexed taskId,
        uint256 amount
    );
    
    event TaskPaymentReleased(
        address indexed human,
        uint256 indexed taskId,
        uint256 amount
    );
    
    event Refunded(
        address indexed human,
        uint256 amount,
        string reason
    );
    
    // ============ 修饰符 ============
    
    modifier onlyHuman() {
        require(humanRegistry.isHuman(msg.sender), "Not human");
        _;
    }
    
    constructor(
        address _humanRegistry,
        address payable _agentLifecycle,
        address _treasury
    ) Ownable() {
        humanRegistry = HumanRegistry(_humanRegistry);
        agentLifecycle = AgentLifecycle(_agentLifecycle);
        platformTreasury = _treasury;
    }
    
    // ============ 资金管理 ============
    
    /**
     * @notice 存入资金
     */
    function deposit() external payable onlyHuman nonReentrant {
        require(msg.value > 0, "Must deposit something");
        
        HumanWallet storage wallet = humanWallets[msg.sender];
        wallet.availableBalance += msg.value;
        wallet.totalDeposited += msg.value;
        
        emit Deposited(msg.sender, msg.value, wallet.availableBalance);
    }
    
    /**
     * @notice 提取资金
     */
    function withdraw(uint256 _amount) external onlyHuman nonReentrant {
        HumanWallet storage wallet = humanWallets[msg.sender];
        require(wallet.availableBalance >= _amount, "Insufficient balance");
        
        wallet.availableBalance -= _amount;
        wallet.totalWithdrawn += _amount;
        
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, _amount, wallet.availableBalance);
    }
    
    /**
     * @notice 投资 Agent
     */
    function investInAgent(
        uint256 _agentId,
        uint256 _amount
    ) external onlyHuman nonReentrant {
        HumanWallet storage wallet = humanWallets[msg.sender];
        require(wallet.availableBalance >= _amount, "Insufficient balance");
        require(_amount >= 0.01 ether, "Min investment 0.01 ETH");
        
        wallet.availableBalance -= _amount;
        wallet.investedInAgents += _amount;
        
        // 转账给 Agent
        // 实际应该调用 agentLifecycle.fundAgent
        (bool success, ) = address(agentLifecycle).call{value: _amount}(
            abi.encodeWithSignature("fundAgent(uint256)", _agentId)
        );
        require(success, "Agent funding failed");
        
        // 计算分成比例 (基于投资金额占 Agent 总资金的比例)
        uint256 sharePercent = _calculateSharePercent(_agentId, _amount);
        
        // 记录投资
        humanAgentInvestments[msg.sender].push(AgentInvestment({
            agentId: _agentId,
            amount: _amount,
            investedAt: block.timestamp,
            sharePercent: sharePercent,
            isActive: true
        }));
        
        // 更新 Agent 投资者列表
        if (agentInvestmentIndex[_agentId][msg.sender] == 0) {
            agentInvestors[_agentId].push(msg.sender);
            agentInvestmentIndex[_agentId][msg.sender] = agentInvestors[_agentId].length;
        }
        
        emit AgentInvested(msg.sender, _agentId, _amount, sharePercent);
    }
    
    /**
     * @notice 撤回 Agent 投资
     */
    function withdrawInvestment(
        uint256 _agentId,
        uint256 _investmentIndex
    ) external onlyHuman nonReentrant {
        AgentInvestment storage investment = humanAgentInvestments[msg.sender][_investmentIndex];
        require(investment.agentId == _agentId, "Invalid investment");
        require(investment.isActive, "Already withdrawn");
        
        investment.isActive = false;
        
        HumanWallet storage wallet = humanWallets[msg.sender];
        wallet.investedInAgents -= investment.amount;
        
        // 从 Agent 撤回资金 (简化版，实际应更复杂)
        // 这里假设可以按比例撤回
        
        emit InvestmentWithdrawn(msg.sender, _agentId, investment.amount);
    }
    
    /**
     * @notice 创建任务并锁定资金
     */
    function fundTask(
        uint256 _taskId,
        uint256 _reward
    ) external onlyHuman {
        HumanWallet storage wallet = humanWallets[msg.sender];
        require(wallet.availableBalance >= _reward, "Insufficient balance");
        
        wallet.availableBalance -= _reward;
        wallet.lockedInTasks += _reward;
        
        emit TaskFunded(msg.sender, _taskId, _reward);
    }
    
    /**
     * @notice 任务完成，释放资金给执行者
     */
    function releaseTaskPayment(
        uint256 _taskId,
        address _executor,
        uint256 _amount
    ) external {
        // 实际应该由 TaskRegistry 调用
        HumanWallet storage wallet = humanWallets[msg.sender];
        require(wallet.lockedInTasks >= _amount, "Insufficient locked");
        
        wallet.lockedInTasks -= _amount;
        
        // 扣除平台费
        uint256 platformFee = (_amount * platformFeeRate) / 10000;
        uint256 netAmount = _amount - platformFee;
        
        // 转账平台费
        (bool feeSuccess, ) = platformTreasury.call{value: platformFee}("");
        require(feeSuccess, "Fee transfer failed");
        
        // 转账给执行者
        (bool success, ) = _executor.call{value: netAmount}("");
        require(success, "Payment failed");
        
        emit TaskPaymentReleased(msg.sender, _taskId, netAmount);
    }
    
    /**
     * @notice 任务取消，退款
     */
    function refundTask(uint256 _taskId, uint256 _amount) external onlyHuman {
        HumanWallet storage wallet = humanWallets[msg.sender];
        require(wallet.lockedInTasks >= _amount, "Insufficient locked");
        
        wallet.lockedInTasks -= _amount;
        wallet.availableBalance += _amount;
        
        emit Refunded(msg.sender, _amount, "Task cancelled");
    }
    
    // ============ 收益分配 ============
    
    /**
     * @notice 分配 Agent 收益给投资者
     * @dev 当 Agent 完成任务获得奖励时调用
     */
    function distributeAgentRevenue(
        uint256 _agentId,
        uint256 _totalRevenue,
        uint256 _taskId
    ) external payable {
        require(msg.value >= _totalRevenue, "Insufficient payment");
        
        // Agent 保留部分
        uint256 agentShare = (_totalRevenue * agentRevenueShare) / 10000;
        
        // 投资者分配部分
        uint256 investorTotal = (_totalRevenue * investorShare) / 10000;
        
        address[] storage investors = agentInvestors[_agentId];
        
        for (uint i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 investmentIdx = agentInvestmentIndex[_agentId][investor] - 1;
            AgentInvestment storage inv = humanAgentInvestments[investor][investmentIdx];
            
            if (inv.isActive) {
                uint256 share = (investorTotal * inv.sharePercent) / 10000;
                
                if (share >= minDistributionAmount) {
                    HumanWallet storage wallet = humanWallets[investor];
                    wallet.availableBalance += share;
                    wallet.totalRewards += share;
                    
                    humanRevenueHistory[investor].push(RevenueShare({
                        agentId: _agentId,
                        amount: share,
                        timestamp: block.timestamp,
                        taskId: _taskId
                    }));
                    
                    emit RevenueDistributed(investor, _agentId, share, _taskId);
                }
            }
        }
        
        // 剩余的给 Agent (或平台)
        uint256 remaining = address(this).balance;
        if (remaining > 0) {
            (bool success, ) = platformTreasury.call{value: remaining}("");
            require(success, "Remaining transfer failed");
        }
    }
    
    // ============ 查询 ============
    
    function getWalletSummary(address _human)
        external
        view
        returns (
            uint256 available,
            uint256 lockedInTasks,
            uint256 investedInAgents,
            uint256 totalValue
        )
    {
        HumanWallet storage w = humanWallets[_human];
        available = w.availableBalance;
        lockedInTasks = w.lockedInTasks;
        investedInAgents = w.investedInAgents;
        totalValue = available + lockedInTasks + investedInAgents;
    }
    
    function getInvestments(address _human)
        external
        view
        returns (AgentInvestment[] memory)
    {
        return humanAgentInvestments[_human];
    }
    
    function getRevenueHistory(address _human)
        external
        view
        returns (RevenueShare[] memory)
    {
        return humanRevenueHistory[_human];
    }
    
    function getTotalReturn(address _human)
        external
        view
        returns (int256)
    {
        HumanWallet storage w = humanWallets[_human];
        uint256 totalIn = w.totalDeposited;
        uint256 totalOut = w.totalWithdrawn + w.availableBalance + w.lockedInTasks + w.investedInAgents;
        return int256(totalOut) - int256(totalIn);
    }
    
    // ============ 内部函数 ============
    
    function _calculateSharePercent(
        uint256 _agentId,
        uint256 _investment
    ) internal view returns (uint256) {
        // 简化计算：假设总投资为当前投资 * 10
        // 实际应该查询 Agent 的总资金
        uint256 estimatedTotal = _investment * 10;
        return (_investment * 10000) / estimatedTotal;
    }
    
    // ============ 治理 ============
    
    function setFeeRates(
        uint256 _platformFee,
        uint256 _agentShare,
        uint256 _investorShare
    ) external onlyOwner {
        require(_platformFee <= 2000, "Max 20%");
        require(_agentShare + _investorShare == 10000, "Must sum to 100%");
        
        platformFeeRate = _platformFee;
        agentRevenueShare = _agentShare;
        investorShare = _investorShare;
    }
    
    function setMinDistribution(uint256 _amount) external onlyOwner {
        minDistributionAmount = _amount;
    }
    
    receive() external payable {}
}
