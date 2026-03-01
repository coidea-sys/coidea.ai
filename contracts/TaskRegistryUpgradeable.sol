// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title TaskRegistryUpgradeable
 * @notice 可升级的任务注册表合约
 */
contract TaskRegistryUpgradeable is 
    Initializable, 
    OwnableUpgradeable,
    UUPSUpgradeable 
{
    // 版本号，用于追踪升级
    uint256 public version;
    
    // 任务状态枚举
    enum TaskState {
        Draft, Open, Assigned, Submitted, UnderReview, Completed, Cancelled, Disputed
    }
    
    enum TaskType {
        Coding, Design, Research, Writing, Data, Consultation, Other
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
        uint256 deadline;
        string[] requiredSkills;
        uint256 minReputation;
        string deliverableURI;
        uint256 createdAt;
        uint256 assignedAt;
        uint256 submittedAt;
        uint256 completedAt;
    }
    
    // 状态变量
    uint256 public taskCounter;
    uint256 public platformFee; // 基点 (100 = 1%)
    address public feeRecipient;
    
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public publisherTasks;
    mapping(address => uint256[]) public workerTasks;
    
    // 事件
    event TaskCreated(uint256 indexed taskId, address indexed publisher, string title, uint256 reward);
    event TaskAssigned(uint256 indexed taskId, address indexed worker);
    event TaskSubmitted(uint256 indexed taskId, string deliverableURI);
    event TaskCompleted(uint256 indexed taskId, address indexed worker, uint256 reward);
    event VersionUpgraded(uint256 newVersion);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _feeRecipient) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        platformFee = 250; // 2.5%
        feeRecipient = _feeRecipient;
        version = 1;
    }
    
    /**
     * @notice 创建任务
     */
    function createTask(
        string memory _title,
        string memory _description,
        TaskType _taskType,
        uint256 _reward,
        uint256 _deadline,
        string[] memory _requiredSkills,
        uint256 _minReputation
    ) external payable returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(_reward > 0, "Reward must be > 0");
        require(_deadline > block.timestamp, "Deadline must be future");
        
        uint256 fee = (_reward * platformFee) / 10000;
        require(msg.value >= _reward + fee, "Insufficient deposit");
        
        uint256 taskId = taskCounter++;
        
        Task storage task = tasks[taskId];
        task.id = taskId;
        task.title = _title;
        task.description = _description;
        task.taskType = _taskType;
        task.state = TaskState.Open;
        task.publisher = msg.sender;
        task.reward = _reward;
        task.deposit = msg.value;
        task.deadline = _deadline;
        task.requiredSkills = _requiredSkills;
        task.minReputation = _minReputation;
        task.createdAt = block.timestamp;
        
        publisherTasks[msg.sender].push(taskId);
        
        emit TaskCreated(taskId, msg.sender, _title, _reward);
        
        return taskId;
    }
    
    /**
     * @notice 分配任务
     */
    function assignTask(uint256 _taskId, address _worker) external {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Only publisher");
        require(task.state == TaskState.Open, "Task not open");
        require(_worker != address(0), "Invalid worker");
        
        task.worker = _worker;
        task.state = TaskState.Assigned;
        task.assignedAt = block.timestamp;
        
        workerTasks[_worker].push(_taskId);
        
        emit TaskAssigned(_taskId, _worker);
    }
    
    /**
     * @notice 提交工作
     */
    function submitWork(uint256 _taskId, string memory _deliverableURI) external {
        Task storage task = tasks[_taskId];
        require(task.worker == msg.sender, "Only worker");
        require(task.state == TaskState.Assigned, "Task not assigned");
        
        task.deliverableURI = _deliverableURI;
        task.state = TaskState.Submitted;
        task.submittedAt = block.timestamp;
        
        emit TaskSubmitted(_taskId, _deliverableURI);
    }
    
    /**
     * @notice 完成任务并支付
     */
    function completeTask(uint256 _taskId) external {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Only publisher");
        require(task.state == TaskState.Submitted, "Task not submitted");
        
        task.state = TaskState.Completed;
        task.completedAt = block.timestamp;
        
        // 支付奖励给工作者
        (bool success, ) = task.worker.call{value: task.reward}("");
        require(success, "Reward transfer failed");
        
        // 支付平台费
        uint256 fee = task.deposit - task.reward;
        (success, ) = feeRecipient.call{value: fee}("");
        require(success, "Fee transfer failed");
        
        emit TaskCompleted(_taskId, task.worker, task.reward);
    }
    
    /**
     * @notice 升级版本（仅 owner）
     */
    function upgradeVersion() external onlyOwner {
        version++;
        emit VersionUpgraded(version);
    }
    
    /**
     * @notice 更新平台费（仅 owner）
     */
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = _newFee;
    }
    
    /**
     * @notice 授权升级（仅 owner）
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    receive() external payable {}
}
