// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ILiabilityRegistry.sol";

/**
 * @title TaskRegistryWithLiability
 * @notice 集成责任预设机制的任务管理合约
 * 
 * 核心特性：
 * 1. 任务发布时选择责任模型
 * 2. Agent 接单前验证责任能力
 * 3. 任务执行中锁定责任金额
 * 4. 争议解决时按责任模型赔付
 */
contract TaskRegistryWithLiability is Ownable, ReentrancyGuard {
    
    enum TaskState {
        Draft,
        Open,
        Assigned,
        Submitted,
        UnderReview,
        Completed,
        Cancelled,
        Disputed
    }
    
    enum TaskType {
        Coding, Design, Research, Writing, 
        Data, Consultation, Other
    }
    
    // 责任模型配置
    enum LiabilityModel {
        Standard,     // 标准：无特殊责任要求
        Limited,      // 有限责任：Agent 需质押
        Insured,      // 保险覆盖：需有保险
        Bonded        // 保证金：双方都需要质押
    }
    
    struct Task {
        uint256 id;
        string title;
        string description;
        TaskType taskType;
        TaskState state;
        address publisher;
        address worker;
        uint256 reward;
        uint256 deposit;
        uint256 createdAt;
        uint256 deadline;
        uint256 assignedAt;
        uint256 submittedAt;
        uint256 completedAt;
        string deliverableURI;
        string[] requiredSkills;
        uint256 minReputation;
        
        // 责任预设
        LiabilityModel liabilityModel;
        uint256 liabilityAmount;      // 责任金额（Limited/Insured/Bonded 用）
        bool liabilityLocked;         // 责任是否已锁定
    }
    
    struct Application {
        uint256 taskId;
        address applicant;
        uint256 agentId;
        string proposal;
        uint256 proposedPrice;
        uint256 appliedAt;
        bool isAccepted;
        bool canAssumeLiability;      // 是否能承担责任
    }
    
    // 状态变量
    uint256 public taskCounter;
    uint256 public applicationCounter;
    
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => uint256[]) public taskApplications;
    mapping(uint256 => Application) public applications;
    mapping(address => uint256[]) public publisherTasks;
    mapping(address => uint256[]) public workerTasks;
    
    // 平台配置
    uint256 public platformFee = 250; // 2.5%
    address public feeRecipient;
    uint256 public minReward = 0.001 ether;
    uint256 public maxDeadlineDuration = 90 days;
    
    // 责任注册表地址
    address public liabilityRegistry;
    
    // 事件
    event TaskCreated(
        uint256 indexed taskId, 
        address indexed publisher, 
        string title, 
        uint256 reward,
        LiabilityModel liabilityModel,
        uint256 liabilityAmount
    );
    event TaskPublished(uint256 indexed taskId, uint256 deadline);
    event TaskApplied(uint256 indexed taskId, uint256 indexed applicationId, address indexed applicant);
    event LiabilityVerified(uint256 indexed taskId, address indexed agent, bool canAssume);
    event TaskAssigned(uint256 indexed taskId, address indexed worker);
    event TaskSubmitted(uint256 indexed taskId, string deliverableURI);
    event TaskCompleted(uint256 indexed taskId, address indexed worker, uint256 reward);
    event TaskCancelled(uint256 indexed taskId);
    event TaskDisputed(uint256 indexed taskId, string reason);
    event DisputeResolved(uint256 indexed taskId, bool workerWins, uint256 compensation);
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @notice 创建任务（带责任预设）
     * @param _liabilityModel 责任模型
     * @param _liabilityAmount 责任金额（0 表示使用 reward）
     */
    function createTask(
        string memory _title,
        string memory _description,
        TaskType _taskType,
        uint256 _reward,
        uint256 _deadlineDuration,
        string[] memory _requiredSkills,
        uint256 _minReputation,
        LiabilityModel _liabilityModel,
        uint256 _liabilityAmount
    ) public payable returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_title).length <= 100, "Title too long");
        require(_reward >= minReward, "Reward too low");
        require(_deadlineDuration <= maxDeadlineDuration, "Deadline too far");
        require(msg.value >= _reward, "Insufficient deposit");
        
        // Bonded 模式下发布者也需质押
        if (_liabilityModel == LiabilityModel.Bonded) {
            uint256 requiredBond = _liabilityAmount > 0 ? _liabilityAmount : _reward;
            require(msg.value >= _reward + requiredBond, "Need reward + bond");
        }
        
        uint256 taskId = taskCounter++;
        
        tasks[taskId] = Task({
            id: taskId,
            title: _title,
            description: _description,
            taskType: _taskType,
            state: TaskState.Draft,
            publisher: msg.sender,
            worker: address(0),
            reward: _reward,
            deposit: msg.value,
            createdAt: block.timestamp,
            deadline: 0,
            assignedAt: 0,
            submittedAt: 0,
            completedAt: 0,
            deliverableURI: "",
            requiredSkills: _requiredSkills,
            minReputation: _minReputation,
            liabilityModel: _liabilityModel,
            liabilityAmount: _liabilityAmount > 0 ? _liabilityAmount : _reward,
            liabilityLocked: false
        });
        
        publisherTasks[msg.sender].push(taskId);
        
        emit TaskCreated(
            taskId, 
            msg.sender, 
            _title, 
            _reward,
            _liabilityModel,
            _liabilityAmount > 0 ? _liabilityAmount : _reward
        );
        
        return taskId;
    }
    
    /**
     * @notice 发布任务
     */
    function publishTask(uint256 _taskId) public {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Not publisher");
        require(task.state == TaskState.Draft, "Not draft");
        
        task.state = TaskState.Open;
        task.deadline = block.timestamp + 7 days;
        
        emit TaskPublished(_taskId, task.deadline);
    }
    
    /**
     * @notice 申请任务（自动验证责任能力）
     */
    function applyForTask(
        uint256 _taskId,
        string memory _proposal,
        uint256 _proposedPrice
    ) public returns (uint256) {
        Task storage task = tasks[_taskId];
        require(task.state == TaskState.Open, "Not open");
        require(block.timestamp < task.deadline, "Expired");
        require(task.publisher != msg.sender, "Cannot apply own");
        require(_proposedPrice <= task.reward, "Price exceeds reward");
        
        // 验证责任能力
        bool canAssume = verifyLiabilityCapability(msg.sender, _taskId);
        
        uint256 appId = applicationCounter++;
        
        applications[appId] = Application({
            taskId: _taskId,
            applicant: msg.sender,
            agentId: 0,
            proposal: _proposal,
            proposedPrice: _proposedPrice,
            appliedAt: block.timestamp,
            isAccepted: false,
            canAssumeLiability: canAssume
        });
        
        taskApplications[_taskId].push(appId);
        
        emit TaskApplied(_taskId, appId, msg.sender);
        emit LiabilityVerified(_taskId, msg.sender, canAssume);
        
        return appId;
    }
    
    /**
     * @notice 验证 Agent 是否能承担任务责任
     */
    function verifyLiabilityCapability(address _agent, uint256 _taskId) 
        public view returns (bool) 
    {
        Task storage task = tasks[_taskId];
        
        // Standard 模式：无特殊要求
        if (task.liabilityModel == LiabilityModel.Standard) {
            return true;
        }
        
        // 需要 LiabilityRegistry 验证
        if (liabilityRegistry == address(0)) {
            return false;
        }
        
        ILiabilityRegistry registry = ILiabilityRegistry(liabilityRegistry);
        
        if (task.liabilityModel == LiabilityModel.Limited) {
            // 有限责任：检查是否有足够质押
            return registry.canAssumeLiability(_agent, task.liabilityAmount);
        }
        
        if (task.liabilityModel == LiabilityModel.Insured) {
            // 保险覆盖：检查是否有保险
            return registry.canAssumeLiability(_agent, task.liabilityAmount);
        }
        
        if (task.liabilityModel == LiabilityModel.Bonded) {
            // 保证金：双方都需要有能力
            return registry.canAssumeLiability(_agent, task.liabilityAmount);
        }
        
        return false;
    }
    
    /**
     * @notice 分配任务（只接受有责任能力的申请）
     */
    function assignTask(uint256 _taskId, uint256 _applicationId) public {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Not publisher");
        require(task.state == TaskState.Open, "Not open");
        
        Application storage app = applications[_applicationId];
        require(app.taskId == _taskId, "Wrong task");
        require(!app.isAccepted, "Already accepted");
        
        // 非 Standard 模式需验证责任能力
        if (task.liabilityModel != LiabilityModel.Standard) {
            require(app.canAssumeLiability, "Agent cannot assume liability");
            
            // 锁定责任金额
            if (liabilityRegistry != address(0)) {
                ILiabilityRegistry registry = ILiabilityRegistry(liabilityRegistry);
                bytes32 taskHash = keccak256(abi.encodePacked(_taskId, app.applicant));
                registry.lockLiability(app.applicant, taskHash, task.liabilityAmount);
                task.liabilityLocked = true;
            }
        }
        
        task.state = TaskState.Assigned;
        task.worker = app.applicant;
        task.assignedAt = block.timestamp;
        task.reward = app.proposedPrice;
        app.isAccepted = true;
        
        workerTasks[app.applicant].push(_taskId);
        
        emit TaskAssigned(_taskId, app.applicant);
    }
    
    /**
     * @notice 提交工作
     */
    function submitWork(uint256 _taskId, string memory _deliverableURI) public {
        Task storage task = tasks[_taskId];
        require(task.worker == msg.sender, "Not worker");
        require(task.state == TaskState.Assigned, "Not assigned");
        
        task.state = TaskState.Submitted;
        task.deliverableURI = _deliverableURI;
        task.submittedAt = block.timestamp;
        
        emit TaskSubmitted(_taskId, _deliverableURI);
    }
    
    /**
     * @notice 完成任务并支付
     */
    function completeTask(uint256 _taskId) public nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Not publisher");
        require(task.state == TaskState.Submitted, "Not submitted");
        
        task.state = TaskState.Completed;
        task.completedAt = block.timestamp;
        
        // 释放责任锁定
        if (task.liabilityLocked && liabilityRegistry != address(0)) {
            ILiabilityRegistry registry = ILiabilityRegistry(liabilityRegistry);
            bytes32 taskHash = keccak256(abi.encodePacked(_taskId, task.worker));
            registry.releaseLiability(taskHash);
            task.liabilityLocked = false;
        }
        
        // 计算费用
        uint256 fee = (task.reward * platformFee) / 10000;
        uint256 payment = task.reward - fee;
        
        // 支付
        (bool success, ) = payable(task.worker).call{value: payment}("");
        require(success, "Payment failed");
        
        if (fee > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSuccess, "Fee failed");
        }
        
        // 退还多余押金
        uint256 excess = task.deposit - task.reward;
        if (excess > 0) {
            (bool refundSuccess, ) = payable(task.publisher).call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit TaskCompleted(_taskId, task.worker, payment);
    }
    
    /**
     * @notice 提起争议
     */
    function raiseDispute(uint256 _taskId, string memory _reason) public {
        Task storage task = tasks[_taskId];
        require(
            task.publisher == msg.sender || task.worker == msg.sender,
            "Not involved"
        );
        require(
            task.state == TaskState.Submitted || task.state == TaskState.Assigned,
            "Cannot dispute"
        );
        
        task.state = TaskState.Disputed;
        emit TaskDisputed(_taskId, _reason);
    }
    
    /**
     * @notice 解决争议
     * @param _workerWins true: 执行者胜，获得支付; false: 发布者胜，全额退款
     */
    function resolveDispute(uint256 _taskId, bool _workerWins) 
        public onlyOwner nonReentrant 
    {
        Task storage task = tasks[_taskId];
        require(task.state == TaskState.Disputed, "Not disputed");
        
        task.state = TaskState.Completed;
        task.completedAt = block.timestamp;
        
        // 释放责任锁定
        if (task.liabilityLocked && liabilityRegistry != address(0)) {
            ILiabilityRegistry registry = ILiabilityRegistry(liabilityRegistry);
            bytes32 taskHash = keccak256(abi.encodePacked(_taskId, task.worker));
            registry.releaseLiability(taskHash);
            task.liabilityLocked = false;
        }
        
        uint256 compensation = 0;
        
        if (_workerWins) {
            // 执行者胜
            uint256 fee = (task.reward * platformFee) / 10000;
            compensation = task.reward - fee;
            
            (bool success, ) = payable(task.worker).call{value: compensation}("");
            require(success, "Payment failed");
            
            if (fee > 0) {
                (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
                require(feeSuccess, "Fee failed");
            }
            
            uint256 excess = task.deposit - task.reward;
            if (excess > 0) {
                (bool refundSuccess, ) = payable(task.publisher).call{value: excess}("");
                require(refundSuccess, "Refund failed");
            }
        } else {
            // 发布者胜 - 全额退款
            compensation = 0;
            (bool success, ) = payable(task.publisher).call{value: task.deposit}("");
            require(success, "Refund failed");
        }
        
        emit DisputeResolved(_taskId, _workerWins, compensation);
    }
    
    /**
     * @notice 取消任务
     */
    function cancelTask(uint256 _taskId) public nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Not publisher");
        require(
            task.state == TaskState.Draft || task.state == TaskState.Open,
            "Cannot cancel"
        );
        
        task.state = TaskState.Cancelled;
        
        (bool success, ) = payable(task.publisher).call{value: task.deposit}("");
        require(success, "Refund failed");
        
        emit TaskCancelled(_taskId);
    }
    
    // 管理员功能
    function setLiabilityRegistry(address _registry) public onlyOwner {
        liabilityRegistry = _registry;
    }
    
    function setPlatformFee(uint256 _fee) public onlyOwner {
        require(_fee <= 1000, "Fee too high");
        platformFee = _fee;
    }
    
    // 查询函数
    function getTaskApplications(uint256 _taskId) public view returns (uint256[] memory) {
        return taskApplications[_taskId];
    }
    
    function getPublisherTasks(address _publisher) public view returns (uint256[] memory) {
        return publisherTasks[_publisher];
    }
    
    function getWorkerTasks(address _worker) public view returns (uint256[] memory) {
        return workerTasks[_worker];
    }
    
    receive() external payable {}
}
