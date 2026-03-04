// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TaskRegistry
 * @notice Task management contract for coidea.ai
 * @notice 任务管理合约
 * 
 * Manages the full lifecycle of tasks in the coidea ecosystem:
 * 管理 coidea 生态系统中任务的完整生命周期：
 * 
 * Task States / 任务状态:
 * - Draft: Task created but not published / 已创建但未发布
 * - Open: Published and accepting applications / 已发布，接受申请
 * - Assigned: Worker selected, task in progress / 已分配，进行中
 * - Submitted: Work submitted for review / 已提交，待审核
 * - UnderReview: Under arbitration or review / 审核中或仲裁中
 * - Completed: Task finished and paid / 已完成，已支付
 * - Cancelled: Task cancelled by publisher / 已取消
 * - Disputed: Dispute raised / 有争议
 */
contract TaskRegistry is Ownable, ReentrancyGuard {
    
    // Task state enum / 任务状态枚举
    enum TaskState {
        Draft,        // 0 - Draft / 草稿
        Open,         // 1 - Open for applications / 开放申请
        Assigned,     // 2 - Assigned to worker / 已分配
        Submitted,    // 3 - Work submitted / 已提交
        UnderReview,  // 4 - Under review / 审核中
        Completed,    // 5 - Completed / 已完成
        Cancelled,    // 6 - Cancelled / 已取消
        Disputed      // 7 - Disputed / 有争议
    }
    
    // Task type enum / 任务类型枚举
    enum TaskType {
        Coding,       // Programming tasks / 编程任务
        Design,       // Design tasks / 设计任务
        Research,     // Research tasks / 研究任务
        Writing,      // Content writing / 内容创作
        Data,         // Data processing / 数据处理
        Consultation, // Consultation / 咨询
        Other         // Other tasks / 其他
    }
    
    // Task structure / 任务结构
    struct Task {
        uint256 id;                      // Task ID / 任务ID
        string title;                    // Task title / 任务标题
        string description;              // Task description / 任务描述
        TaskType taskType;               // Task type / 任务类型
        TaskState state;                 // Current state / 当前状态
        address publisher;               // Task publisher / 发布者
        address worker;                  // Assigned worker / 执行者
        uint256 reward;                  // Reward amount (in wei) / 奖励金额
        uint256 deposit;                 // Publisher's deposit / 发布者押金
        uint256 createdAt;               // Creation timestamp / 创建时间
        uint256 deadline;                // Deadline timestamp / 截止时间
        uint256 assignedAt;              // Assignment timestamp / 分配时间
        uint256 submittedAt;             // Submission timestamp / 提交时间
        uint256 completedAt;             // Completion timestamp / 完成时间
        string deliverableURI;           // Deliverable URI / 交付物URI
        string[] requiredSkills;         // Required skills / 所需技能
        uint256 minReputation;           // Minimum reputation required / 最低声誉要求
        bool isMultiAgent;               // Multi-agent task / 是否多Agent任务
        uint256[] agentIds;              // Participating agent IDs / 参与的Agent ID
    }
    
    // Application structure / 申请结构
    struct Application {
        uint256 taskId;                  // Task ID / 任务ID
        address applicant;               // Applicant address / 申请者地址
        uint256 agentId;                 // Agent ID (0 for humans) / Agent ID（人类为0）
        string proposal;                 // Application proposal / 申请提案
        uint256 proposedPrice;           // Proposed price / 提议价格
        uint256 appliedAt;               // Application timestamp / 申请时间
        bool isAccepted;                 // Whether accepted / 是否被接受
    }
    
    // State variables / 状态变量
    uint256 public taskCounter;
    uint256 public applicationCounter;
    
    // taskId => Task / 任务ID => 任务
    mapping(uint256 => Task) public tasks;
    
    // taskId => applicationId[] / 任务ID => 申请ID列表
    mapping(uint256 => uint256[]) public taskApplications;
    
    // applicationId => Application / 申请ID => 申请
    mapping(uint256 => Application) public applications;
    
    // publisher => taskId[] / 发布者 => 任务ID列表
    mapping(address => uint256[]) public publisherTasks;
    
    // worker => taskId[] / 执行者 => 任务ID列表
    mapping(address => uint256[]) public workerTasks;
    
    // Platform fee (in basis points, 100 = 1%) / 平台手续费（基点，100=1%）
    uint256 public platformFee = 250; // 2.5% default / 默认2.5%
    
    // Fee recipient / 手续费接收地址
    address public feeRecipient;
    
    // Minimum reward / 最小奖励金额
    uint256 public minReward = 0.001 ether;
    
    // Maximum deadline duration (90 days) / 最大截止时间（90天）
    uint256 public maxDeadlineDuration = 90 days;
    
    // ERC8004 contract address / ERC8004合约地址
    address public erc8004Contract;
    
    // HumanLevelNFT contract address / HumanLevelNFT合约地址
    address public humanLevelNFTContract;
    
    // Events / 事件
    event TaskCreated(uint256 indexed taskId, address indexed publisher, string title, uint256 reward);
    event TaskPublished(uint256 indexed taskId, uint256 deadline);
    event TaskApplied(uint256 indexed taskId, uint256 indexed applicationId, address indexed applicant);
    event TaskAssigned(uint256 indexed taskId, address indexed worker);
    event TaskSubmitted(uint256 indexed taskId, string deliverableURI);
    event TaskCompleted(uint256 indexed taskId, address indexed worker, uint256 reward);
    event TaskCancelled(uint256 indexed taskId);
    event TaskDisputed(uint256 indexed taskId, string reason);
    event TaskResolved(uint256 indexed taskId, bool approved);
    event PlatformFeeUpdated(uint256 newFee);
    
    constructor(address _feeRecipient) Ownable() {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @notice Create a new task (draft state)
     * @notice 创建新任务（草稿状态）
     */
    function createTask(
        string memory _title,
        string memory _description,
        TaskType _taskType,
        uint256 _reward,
        uint256 _deadlineDuration,
        string[] memory _requiredSkills,
        uint256 _minReputation,
        bool _isMultiAgent
    ) public payable returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_title).length <= 100, "Title too long");
        require(_reward >= minReward, "Reward below minimum");
        require(_deadlineDuration > 0, "Deadline must be in the future");
        require(_deadlineDuration <= maxDeadlineDuration, "Deadline too far");
        require(msg.value >= _reward, "Insufficient deposit");
        
        uint256 taskId = taskCounter;
        taskCounter++;
        
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
            isMultiAgent: _isMultiAgent,
            agentIds: new uint256[](0)
        });
        
        publisherTasks[msg.sender].push(taskId);
        
        emit TaskCreated(taskId, msg.sender, _title, _reward);
        
        return taskId;
    }
    
    /**
     * @notice Publish task to make it open for applications
     * @notice 发布任务，使其开放申请
     */
    function publishTask(uint256 _taskId) public {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Not publisher");
        require(task.state == TaskState.Draft, "Not in draft state");
        
        task.state = TaskState.Open;
        task.deadline = block.timestamp + (task.deadline > 0 ? task.deadline : 7 days);
        
        emit TaskPublished(_taskId, task.deadline);
    }
    
    /**
     * @notice Apply for a task
     * @notice 申请任务
     */
    function applyForTask(
        uint256 _taskId,
        string memory _proposal,
        uint256 _proposedPrice
    ) public returns (uint256) {
        Task storage task = tasks[_taskId];
        require(task.state == TaskState.Open, "Task not open");
        require(block.timestamp < task.deadline, "Deadline passed");
        require(task.publisher != msg.sender, "Cannot apply to own task");
        require(_proposedPrice <= task.reward, "Price exceeds reward");
        
        uint256 applicationId = applicationCounter;
        applicationCounter++;
        
        applications[applicationId] = Application({
            taskId: _taskId,
            applicant: msg.sender,
            agentId: 0, // Will be set if applying as agent / 如果是Agent申请会设置
            proposal: _proposal,
            proposedPrice: _proposedPrice,
            appliedAt: block.timestamp,
            isAccepted: false
        });
        
        taskApplications[_taskId].push(applicationId);
        
        emit TaskApplied(_taskId, applicationId, msg.sender);
        
        return applicationId;
    }
    
    /**
     * @notice Assign task to a worker
     * @notice 分配任务给执行者
     */
    function assignTask(uint256 _taskId, uint256 _applicationId) public {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Not publisher");
        require(task.state == TaskState.Open, "Task not open");
        require(_applicationId < applicationCounter, "Invalid application ID");
        
        Application storage app = applications[_applicationId];
        require(app.taskId == _taskId, "Application not for this task");
        require(!app.isAccepted, "Already accepted");
        
        task.state = TaskState.Assigned;
        task.worker = app.applicant;
        task.assignedAt = block.timestamp;
        task.reward = app.proposedPrice; // Use proposed price / 使用提议价格
        app.isAccepted = true;
        
        workerTasks[app.applicant].push(_taskId);
        
        emit TaskAssigned(_taskId, app.applicant);
    }
    
    /**
     * @notice Submit completed work
     * @notice 提交完成的工作
     */
    function submitWork(uint256 _taskId, string memory _deliverableURI) public {
        Task storage task = tasks[_taskId];
        require(task.worker == msg.sender, "Not assigned worker");
        require(task.state == TaskState.Assigned, "Task not assigned");
        require(block.timestamp <= task.deadline + 1 days, "Submission window closed");
        
        task.state = TaskState.Submitted;
        task.deliverableURI = _deliverableURI;
        task.submittedAt = block.timestamp;
        
        emit TaskSubmitted(_taskId, _deliverableURI);
    }
    
    /**
     * @notice Approve and complete task, releasing payment
     * @notice 批准并完成任务，释放支付
     */
    function approveAndComplete(uint256 _taskId) public nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Not publisher");
        require(task.state == TaskState.Submitted, "Task not submitted");
        
        task.state = TaskState.Completed;
        task.completedAt = block.timestamp;
        
        // Calculate fees / 计算手续费
        uint256 fee = (task.reward * platformFee) / 10000;
        uint256 workerPayment = task.reward - fee;
        
        // Transfer payment to worker / 支付执行者
        (bool success, ) = payable(task.worker).call{value: workerPayment}("");
        require(success, "Payment failed");
        
        // Transfer fee to fee recipient / 支付手续费
        if (fee > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Refund excess deposit / 退还多余押金
        uint256 excess = task.deposit - task.reward;
        if (excess > 0) {
            (bool refundSuccess, ) = payable(task.publisher).call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit TaskCompleted(_taskId, task.worker, workerPayment);
    }
    
    /**
     * @notice Request changes to submitted work
     * @notice 要求修改提交的工作
     */
    function requestChanges(uint256 _taskId, string memory _feedback) public {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Not publisher");
        require(task.state == TaskState.Submitted, "Task not submitted");
        
        task.state = TaskState.Assigned; // Back to assigned / 回到已分配状态
        // Feedback can be stored off-chain / 反馈可以链下存储
        
        // Re-emit assignment event with feedback info / 重新触发分配事件
        emit TaskAssigned(_taskId, task.worker);
    }
    
    /**
     * @notice Cancel task (only by publisher in draft or open state)
     * @notice 取消任务（仅发布者在草稿或开放状态可取消）
     */
    function cancelTask(uint256 _taskId) public nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Not publisher");
        require(
            task.state == TaskState.Draft || task.state == TaskState.Open,
            "Cannot cancel at this stage"
        );
        
        task.state = TaskState.Cancelled;
        
        // Refund full deposit / 退还全部押金
        (bool success, ) = payable(task.publisher).call{value: task.deposit}("");
        require(success, "Refund failed");
        
        emit TaskCancelled(_taskId);
    }
    
    /**
     * @notice Raise dispute
     * @notice 提起争议
     */
    function raiseDispute(uint256 _taskId, string memory _reason) public {
        Task storage task = tasks[_taskId];
        require(
            task.publisher == msg.sender || task.worker == msg.sender,
            "Not involved in task"
        );
        require(
            task.state == TaskState.Submitted || task.state == TaskState.Assigned,
            "Cannot dispute at this stage"
        );
        
        task.state = TaskState.Disputed;
        
        emit TaskDisputed(_taskId, _reason);
    }
    
    /**
     * @notice Resolve dispute (only by owner/arbitrator)
     * @notice 解决争议（仅所有者/仲裁者）
     * @param _approved If true, worker gets paid; if false, publisher gets refund
     *                  如果为true，执行者获得支付；如果为false，发布者获得退款
     */
    function resolveDispute(uint256 _taskId, bool _approved) public onlyOwner nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.state == TaskState.Disputed, "Task not disputed");
        
        task.state = TaskState.Completed;
        task.completedAt = block.timestamp;
        
        if (_approved) {
            // Worker wins - pay worker / 执行者胜诉 - 支付执行者
            uint256 fee = (task.reward * platformFee) / 10000;
            uint256 workerPayment = task.reward - fee;
            
            (bool success, ) = payable(task.worker).call{value: workerPayment}("");
            require(success, "Payment failed");
            
            if (fee > 0) {
                (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
                require(feeSuccess, "Fee transfer failed");
            }
            
            // Refund excess to publisher / 退还多余押金给发布者
            uint256 excess = task.deposit - task.reward;
            if (excess > 0) {
                (bool refundSuccess, ) = payable(task.publisher).call{value: excess}("");
                require(refundSuccess, "Refund failed");
            }
        } else {
            // Publisher wins - full refund / 发布者胜诉 - 全额退款
            (bool success, ) = payable(task.publisher).call{value: task.deposit}("");
            require(success, "Refund failed");
        }
        
        emit TaskResolved(_taskId, _approved);
    }
    
    /**
     * @notice Extend deadline
     * @notice 延长截止时间
     */
    function extendDeadline(uint256 _taskId, uint256 _extension) public {
        Task storage task = tasks[_taskId];
        require(task.publisher == msg.sender, "Not publisher");
        require(task.state == TaskState.Assigned, "Task not assigned");
        require(_extension <= 30 days, "Extension too long");
        
        task.deadline += _extension;
    }
    
    /**
     * @notice Update platform fee
     * @notice 更新平台手续费
     */
    function setPlatformFee(uint256 _newFee) public onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }
    
    /**
     * @notice Set contract addresses
     * @notice 设置合约地址
     */
    function setContractAddresses(
        address _erc8004,
        address _humanNFT
    ) public onlyOwner {
        erc8004Contract = _erc8004;
        humanLevelNFTContract = _humanNFT;
    }
    
    /**
     * @notice Get task applications
     * @notice 获取任务申请列表
     */
    function getTaskApplications(uint256 _taskId) public view returns (uint256[] memory) {
        return taskApplications[_taskId];
    }
    
    /**
     * @notice Get publisher's tasks
     * @notice 获取发布者的任务列表
     */
    function getPublisherTasks(address _publisher) public view returns (uint256[] memory) {
        return publisherTasks[_publisher];
    }
    
    /**
     * @notice Get worker's tasks
     * @notice 获取执行者的任务列表
     */
    function getWorkerTasks(address _worker) public view returns (uint256[] memory) {
        return workerTasks[_worker];
    }
    
    /**
     * @notice Get task count by state
     * @notice 按状态获取任务数量
     */
    function getTaskCountByState(TaskState _state) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < taskCounter; i++) {
            if (tasks[i].state == _state) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @notice Check if task is expired
     * @notice 检查任务是否已过期
     */
    function isExpired(uint256 _taskId) public view returns (bool) {
        Task storage task = tasks[_taskId];
        return block.timestamp > task.deadline && task.state != TaskState.Completed;
    }
    
    /**
     * @notice Get active tasks (Open or Assigned)
     * @notice 获取活跃任务（开放或已分配）
     */
    function getActiveTasks() public view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < taskCounter; i++) {
            if (tasks[i].state == TaskState.Open || tasks[i].state == TaskState.Assigned) {
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < taskCounter; i++) {
            if (tasks[i].state == TaskState.Open || tasks[i].state == TaskState.Assigned) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Emergency withdraw (only owner)
     * @notice 紧急提款（仅所有者）
     */
    function emergencyWithdraw() public onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
    
    receive() external payable {}
    fallback() external payable {}
}
