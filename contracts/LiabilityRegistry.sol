// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LiabilityRegistry
 * @notice Agent 责任预设与保险机制
 * @dev 为每个 Agent 定义责任上限、保险覆盖和质押机制
 */
contract LiabilityRegistry {
    
    enum LiabilityType {
        Limited,      // 有限责任：最大损失 = 质押金
        Unlimited,    // 无限责任：全部资产承担
        Insured,      // 保险覆盖：第三方承保
        Joint         // 共同责任：多方分担
    }
    
    struct LiabilityProfile {
        LiabilityType liabilityType;
        uint256 maxLiability;        // 最大责任金额（Limited/Insured 用）
        uint256 stakedAmount;        // 当前质押金额
        address insurer;             // 保险公司地址（Insured 用）
        uint256 insurancePremium;    // 保险费率（万分之几）
        address[] jointHolders;      // 共同责任方（Joint 用）
        uint256[] jointShares;       // 分担比例（万分之几）
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // Agent 地址 => 责任配置
    mapping(address => LiabilityProfile) public profiles;
    
    // 任务 ID => 责任锁定金额
    mapping(bytes32 => uint256) public lockedLiability;
    
    // 保险公司白名单
    mapping(address => bool) public approvedInsurers;
    
    address public owner;
    address public feeRecipient;
    uint256 public platformFeeRate = 50; // 0.5%
    
    event ProfileCreated(
        address indexed agent,
        LiabilityType liabilityType,
        uint256 maxLiability
    );
    
    event ProfileUpdated(
        address indexed agent,
        LiabilityType liabilityType,
        uint256 maxLiability
    );
    
    event LiabilityLocked(
        bytes32 indexed taskId,
        address indexed agent,
        uint256 amount
    );
    
    event LiabilityReleased(
        bytes32 indexed taskId,
        address indexed agent,
        uint256 amount
    );
    
    event LiabilityClaimed(
        bytes32 indexed taskId,
        address indexed claimant,
        uint256 amount,
        string reason
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @notice 创建有限责任配置
     * @param _maxLiability 最大责任金额
     */
    function createLimitedLiability(uint256 _maxLiability) external payable {
        require(_maxLiability > 0, "Max liability must be > 0");
        require(msg.value >= _maxLiability, "Must stake max liability amount");
        require(!profiles[msg.sender].isActive, "Profile already exists");
        
        profiles[msg.sender] = LiabilityProfile({
            liabilityType: LiabilityType.Limited,
            maxLiability: _maxLiability,
            stakedAmount: msg.value,
            insurer: address(0),
            insurancePremium: 0,
            jointHolders: new address[](0),
            jointShares: new uint256[](0),
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        emit ProfileCreated(msg.sender, LiabilityType.Limited, _maxLiability);
    }
    
    /**
     * @notice 创建无限责任配置
     */
    function createUnlimitedLiability() external {
        require(!profiles[msg.sender].isActive, "Profile already exists");
        
        profiles[msg.sender] = LiabilityProfile({
            liabilityType: LiabilityType.Unlimited,
            maxLiability: type(uint256).max,
            stakedAmount: 0,
            insurer: address(0),
            insurancePremium: 0,
            jointHolders: new address[](0),
            jointShares: new uint256[](0),
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        emit ProfileCreated(msg.sender, LiabilityType.Unlimited, type(uint256).max);
    }
    
    /**
     * @notice 创建保险覆盖配置
     * @param _insurer 保险公司地址
     * @param _coverage 保险覆盖金额
     * @param _premiumRate 保险费率（万分之几）
     */
    function createInsuredLiability(
        address _insurer,
        uint256 _coverage,
        uint256 _premiumRate
    ) external payable {
        require(approvedInsurers[_insurer], "Insurer not approved");
        require(_coverage > 0, "Coverage must be > 0");
        require(_premiumRate > 0 && _premiumRate <= 1000, "Invalid premium rate");
        require(!profiles[msg.sender].isActive, "Profile already exists");
        
        uint256 premium = (_coverage * _premiumRate) / 10000;
        require(msg.value >= premium, "Must pay premium");
        
        // 转保费给保险公司
        (bool success, ) = payable(_insurer).call{value: premium}("");
        require(success, "Premium transfer failed");
        
        profiles[msg.sender] = LiabilityProfile({
            liabilityType: LiabilityType.Insured,
            maxLiability: _coverage,
            stakedAmount: 0,
            insurer: _insurer,
            insurancePremium: _premiumRate,
            jointHolders: new address[](0),
            jointShares: new uint256[](0),
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        emit ProfileCreated(msg.sender, LiabilityType.Insured, _coverage);
    }
    
    /**
     * @notice 创建共同责任配置
     * @param _holders 责任方地址
     * @param _shares 分担比例（万分之几，总和=10000）
     */
    function createJointLiability(
        address[] calldata _holders,
        uint256[] calldata _shares
    ) external payable {
        require(_holders.length > 0, "Must have joint holders");
        require(_holders.length == _shares.length, "Length mismatch");
        require(!profiles[msg.sender].isActive, "Profile already exists");
        
        uint256 totalShare = 0;
        for (uint i = 0; i < _shares.length; i++) {
            totalShare += _shares[i];
        }
        require(totalShare == 10000, "Shares must sum to 10000");
        
        profiles[msg.sender] = LiabilityProfile({
            liabilityType: LiabilityType.Joint,
            maxLiability: type(uint256).max,
            stakedAmount: msg.value,
            insurer: address(0),
            insurancePremium: 0,
            jointHolders: _holders,
            jointShares: _shares,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        emit ProfileCreated(msg.sender, LiabilityType.Joint, type(uint256).max);
    }
    
    /**
     * @notice 增加质押金额
     */
    function addStake() external payable {
        require(profiles[msg.sender].isActive, "Profile not found");
        profiles[msg.sender].stakedAmount += msg.value;
        profiles[msg.sender].updatedAt = block.timestamp;
    }
    
    /**
     * @notice 减少质押金额（需满足最小要求）
     * @param _amount 提取金额
     */
    function reduceStake(uint256 _amount) external {
        LiabilityProfile storage profile = profiles[msg.sender];
        require(profile.isActive, "Profile not found");
        require(profile.stakedAmount >= _amount, "Insufficient stake");
        
        // 有限责任需保留 maxLiability
        if (profile.liabilityType == LiabilityType.Limited) {
            require(
                profile.stakedAmount - _amount >= profile.maxLiability,
                "Must maintain max liability stake"
            );
        }
        
        profile.stakedAmount -= _amount;
        profile.updatedAt = block.timestamp;
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice 锁定责任金额（任务开始时）
     * @param _agent Agent 地址
     * @param _taskId 任务 ID
     * @param _amount 锁定金额
     */
    function lockLiability(
        address _agent,
        bytes32 _taskId,
        uint256 _amount
    ) external returns (bool) {
        LiabilityProfile storage profile = profiles[_agent];
        require(profile.isActive, "Agent has no liability profile");
        
        // 检查责任上限
        if (profile.liabilityType == LiabilityType.Limited) {
            require(_amount <= profile.maxLiability, "Exceeds max liability");
            require(_amount <= profile.stakedAmount, "Insufficient stake");
        }
        
        // 保险覆盖检查
        if (profile.liabilityType == LiabilityType.Insured) {
            require(_amount <= profile.maxLiability, "Exceeds insurance coverage");
        }
        
        lockedLiability[_taskId] = _amount;
        
        emit LiabilityLocked(_taskId, _agent, _amount);
        
        return true;
    }
    
    /**
     * @notice 释放责任锁定（任务成功完成）
     * @param _taskId 任务 ID
     */
    function releaseLiability(bytes32 _taskId) external {
        uint256 amount = lockedLiability[_taskId];
        require(amount > 0, "No liability locked");
        
        delete lockedLiability[_taskId];
        
        emit LiabilityReleased(_taskId, msg.sender, amount);
    }
    
    /**
     * @notice 执行责任赔付（任务失败/争议）
     * @param _taskId 任务 ID
     * @param _agent Agent 地址
     * @param _claimant 索赔方
     * @param _amount 赔付金额
     * @param _reason 赔付原因
     */
    function executeLiability(
        bytes32 _taskId,
        address _agent,
        address _claimant,
        uint256 _amount,
        string calldata _reason
    ) external onlyOwner {
        LiabilityProfile storage profile = profiles[_agent];
        require(profile.isActive, "Agent has no liability profile");
        
        uint256 locked = lockedLiability[_taskId];
        require(locked > 0, "No liability locked");
        require(_amount <= locked, "Claim exceeds locked amount");
        
        if (profile.liabilityType == LiabilityType.Limited) {
            // 有限责任：从质押中赔付
            require(_amount <= profile.stakedAmount, "Insufficient stake");
            profile.stakedAmount -= _amount;
            (bool success, ) = payable(_claimant).call{value: _amount}("");
            require(success, "Compensation failed");
            
        } else if (profile.liabilityType == LiabilityType.Unlimited) {
            // 无限责任：Agent 需有足够余额
            (bool success, ) = payable(_claimant).call{value: _amount}("");
            require(success, "Compensation failed");
            
        } else if (profile.liabilityType == LiabilityType.Insured) {
            // 保险覆盖：通知保险公司赔付
            // 实际实现需要保险公司接口
            emit LiabilityClaimed(_taskId, _claimant, _amount, _reason);
            
        } else if (profile.liabilityType == LiabilityType.Joint) {
            // 共同责任：按比例分担
            for (uint i = 0; i < profile.jointHolders.length; i++) {
                uint256 share = (_amount * profile.jointShares[i]) / 10000;
                // 实际实现需要检查各方余额
            }
            emit LiabilityClaimed(_taskId, _claimant, _amount, _reason);
        }
        
        delete lockedLiability[_taskId];
        
        emit LiabilityClaimed(_taskId, _claimant, _amount, _reason);
    }
    
    /**
     * @notice 获取 Agent 责任配置
     */
    function getProfile(address _agent) external view returns (LiabilityProfile memory) {
        return profiles[_agent];
    }
    
    /**
     * @notice 检查 Agent 是否能承担某金额的责任
     */
    function canAssumeLiability(address _agent, uint256 _amount) external view returns (bool) {
        LiabilityProfile memory profile = profiles[_agent];
        if (!profile.isActive) return false;
        
        if (profile.liabilityType == LiabilityType.Limited) {
            return _amount <= profile.maxLiability && _amount <= profile.stakedAmount;
        }
        
        if (profile.liabilityType == LiabilityType.Insured) {
            return _amount <= profile.maxLiability;
        }
        
        return true; // Unlimited, Joint
    }
    
    // 管理员功能
    function addApprovedInsurer(address _insurer) external onlyOwner {
        approvedInsurers[_insurer] = true;
    }
    
    function removeApprovedInsurer(address _insurer) external onlyOwner {
        approvedInsurers[_insurer] = false;
    }
    
    function setPlatformFeeRate(uint256 _rate) external onlyOwner {
        require(_rate <= 500, "Fee too high"); // Max 5%
        platformFeeRate = _rate;
    }
    
    receive() external payable {}
}
