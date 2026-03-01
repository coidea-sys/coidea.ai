// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LiabilityPreset
 * @notice 责任预设合约 - coidea.ai 核心特色
 * @dev 提供 4 种责任模型：Standard、Limited、Insured、Bonded
 */
contract LiabilityPreset is Ownable, ReentrancyGuard {
    
    constructor() Ownable(msg.sender) {}
    
    enum LiabilityModel {
        Standard,   // 标准责任：无额外保障
        Limited,    // 有限责任：责任上限
        Insured,    // 保险模式：第三方保险
        Bonded      // 保证金模式：双方质押
    }
    
    struct PresetConfig {
        LiabilityModel model;
        uint256 publisherLiability;    // 发布者责任金额
        uint256 workerLiability;       // 工作者责任金额
        uint256 insurancePremium;      // 保险费（Insured 模式）
        address insuranceProvider;     // 保险提供商（Insured 模式）
        uint256 disputeWindow;         // 争议窗口期（秒）
        bool enabled;
    }
    
    // 预设配置映射
    mapping(bytes32 => PresetConfig) public presets;
    
    // 任务使用的预设
    mapping(uint256 => bytes32) public taskPresets;
    
    // 保证金托管
    mapping(uint256 => mapping(address => uint256)) public escrowDeposits;
    
    // 授权的任务注册表合约
    mapping(address => bool) public authorizedTaskRegistries;
    
    event PresetCreated(
        bytes32 indexed presetId,
        LiabilityModel model,
        uint256 publisherLiability,
        uint256 workerLiability
    );
    
    event PresetApplied(
        uint256 indexed taskId,
        bytes32 indexed presetId,
        address indexed publisher
    );
    
    event LiabilityDeposited(
        uint256 indexed taskId,
        address indexed party,
        uint256 amount
    );
    
    event LiabilityReleased(
        uint256 indexed taskId,
        address indexed party,
        uint256 amount
    );
    
    event TaskRegistryAuthorized(address indexed registry);
    
    modifier validPreset(bytes32 _presetId) {
        require(presets[_presetId].enabled, "Preset not found");
        _;
    }
    
    modifier onlyAuthorizedRegistry() {
        require(authorizedTaskRegistries[msg.sender], "Not authorized registry");
        _;
    }
    
    /**
     * @notice 授权任务注册表合约
     */
    function authorizeRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "Invalid registry address");
        authorizedTaskRegistries[_registry] = true;
        emit TaskRegistryAuthorized(_registry);
    }
    
    /**
     * @notice 撤销任务注册表授权
     */
    function revokeRegistry(address _registry) external onlyOwner {
        authorizedTaskRegistries[_registry] = false;
    }
    
    /**
     * @notice 授权任务注册表合约
     */
    function authorizeTaskRegistry(address _registry) external onlyOwner {
        authorizedTaskRegistries[_registry] = true;
        emit TaskRegistryAuthorized(_registry);
    }
    
    /**
     * @notice 创建 Standard 预设（无额外责任）
     */
    function createStandardPreset(
        bytes32 _presetId,
        uint256 _disputeWindow
    ) external onlyOwner {
        require(!presets[_presetId].enabled, "Preset already exists");
        
        presets[_presetId] = PresetConfig({
            model: LiabilityModel.Standard,
            publisherLiability: 0,
            workerLiability: 0,
            insurancePremium: 0,
            insuranceProvider: address(0),
            disputeWindow: _disputeWindow,
            enabled: true
        });
        
        emit PresetCreated(_presetId, LiabilityModel.Standard, 0, 0);
    }
    
    /**
     * @notice 创建 Limited 预设（责任上限）
     */
    function createLimitedPreset(
        bytes32 _presetId,
        uint256 _publisherLiability,
        uint256 _workerLiability,
        uint256 _disputeWindow
    ) external onlyOwner {
        require(!presets[_presetId].enabled, "Preset already exists");
        require(_publisherLiability > 0 || _workerLiability > 0, "Must set liability");
        
        presets[_presetId] = PresetConfig({
            model: LiabilityModel.Limited,
            publisherLiability: _publisherLiability,
            workerLiability: _workerLiability,
            insurancePremium: 0,
            insuranceProvider: address(0),
            disputeWindow: _disputeWindow,
            enabled: true
        });
        
        emit PresetCreated(
            _presetId,
            LiabilityModel.Limited,
            _publisherLiability,
            _workerLiability
        );
    }
    
    /**
     * @notice 创建 Insured 预设（保险模式）
     */
    function createInsuredPreset(
        bytes32 _presetId,
        uint256 _publisherLiability,
        uint256 _insurancePremium,
        address _insuranceProvider,
        uint256 _disputeWindow
    ) external onlyOwner {
        require(!presets[_presetId].enabled, "Preset already exists");
        require(_insuranceProvider != address(0), "Invalid insurance provider");
        
        presets[_presetId] = PresetConfig({
            model: LiabilityModel.Insured,
            publisherLiability: _publisherLiability,
            workerLiability: 0,
            insurancePremium: _insurancePremium,
            insuranceProvider: _insuranceProvider,
            disputeWindow: _disputeWindow,
            enabled: true
        });
        
        emit PresetCreated(
            _presetId,
            LiabilityModel.Insured,
            _publisherLiability,
            0
        );
    }
    
    /**
     * @notice 创建 Bonded 预设（保证金模式）
     */
    function createBondedPreset(
        bytes32 _presetId,
        uint256 _publisherLiability,
        uint256 _workerLiability,
        uint256 _disputeWindow
    ) external onlyOwner {
        require(!presets[_presetId].enabled, "Preset already exists");
        require(_publisherLiability > 0 && _workerLiability > 0, "Both parties must stake");
        
        presets[_presetId] = PresetConfig({
            model: LiabilityModel.Bonded,
            publisherLiability: _publisherLiability,
            workerLiability: _workerLiability,
            insurancePremium: 0,
            insuranceProvider: address(0),
            disputeWindow: _disputeWindow,
            enabled: true
        });
        
        emit PresetCreated(
            _presetId,
            LiabilityModel.Bonded,
            _publisherLiability,
            _workerLiability
        );
    }
    
    /**
     * @notice 应用预设到任务（由授权的任务注册表调用）
     */
    function applyPreset(
        uint256 _taskId,
        bytes32 _presetId,
        address _publisher
    ) external payable onlyAuthorizedRegistry validPreset(_presetId) {
        require(taskPresets[_taskId] == bytes32(0), "Preset already applied");
        
        PresetConfig storage preset = presets[_presetId];
        
        // 检查支付金额
        uint256 requiredAmount = preset.publisherLiability;
        if (preset.model == LiabilityModel.Insured) {
            requiredAmount += preset.insurancePremium;
        }
        
        require(msg.value >= requiredAmount, "Insufficient liability deposit");
        
        // 记录预设
        taskPresets[_taskId] = _presetId;
        
        // 托管发布者责任金
        if (preset.publisherLiability > 0) {
            escrowDeposits[_taskId][_publisher] = preset.publisherLiability;
            emit LiabilityDeposited(_taskId, _publisher, preset.publisherLiability);
        }
        
        // 支付保险费给保险提供商
        if (preset.model == LiabilityModel.Insured && preset.insurancePremium > 0) {
            (bool success, ) = preset.insuranceProvider.call{value: preset.insurancePremium}("");
            require(success, "Insurance payment failed");
        }
        
        // 退还多余金额
        if (msg.value > requiredAmount) {
            (bool success, ) = _publisher.call{value: msg.value - requiredAmount}("");
            require(success, "Refund failed");
        }
        
        emit PresetApplied(_taskId, _presetId, _publisher);
    }
    
    /**
     * @notice 工作者质押责任金（Bonded 模式）
     */
    function depositWorkerLiability(uint256 _taskId) external payable {
        bytes32 presetId = taskPresets[_taskId];
        require(presetId != bytes32(0), "No preset applied");
        
        PresetConfig storage preset = presets[presetId];
        require(preset.model == LiabilityModel.Bonded, "Not bonded mode");
        require(
            msg.value >= preset.workerLiability,
            "Insufficient worker liability"
        );
        require(
            escrowDeposits[_taskId][msg.sender] == 0,
            "Already deposited"
        );
        
        escrowDeposits[_taskId][msg.sender] = msg.value;
        emit LiabilityDeposited(_taskId, msg.sender, msg.value);
    }
    
    /**
     * @notice 完成任务时释放责任金（由授权的任务注册表调用）
     */
    function releaseLiability(
        uint256 _taskId,
        address _publisher,
        address _worker
    ) external onlyAuthorizedRegistry nonReentrant {
        bytes32 presetId = taskPresets[_taskId];
        if (presetId == bytes32(0)) return;
        
        PresetConfig storage preset = presets[presetId];
        
        // 释放发布者责任金
        uint256 publisherDeposit = escrowDeposits[_taskId][_publisher];
        if (publisherDeposit > 0) {
            escrowDeposits[_taskId][_publisher] = 0;
            (bool success, ) = _publisher.call{value: publisherDeposit}("");
            require(success, "Publisher release failed");
            emit LiabilityReleased(_taskId, _publisher, publisherDeposit);
        }
        
        // 释放工作者责任金（Bonded 模式）
        if (preset.model == LiabilityModel.Bonded) {
            uint256 workerDeposit = escrowDeposits[_taskId][_worker];
            if (workerDeposit > 0) {
                escrowDeposits[_taskId][_worker] = 0;
                (bool success, ) = _worker.call{value: workerDeposit}("");
                require(success, "Worker release failed");
                emit LiabilityReleased(_taskId, _worker, workerDeposit);
            }
        }
    }
    
    /**
     * @notice 争议时没收责任金（由授权的任务注册表调用）
     */
    function slashLiability(
        uint256 _taskId,
        address _guiltyParty,
        address _recipient
    ) external onlyAuthorizedRegistry nonReentrant {
        bytes32 presetId = taskPresets[_taskId];
        require(presetId != bytes32(0), "No preset applied");
        
        uint256 deposit = escrowDeposits[_taskId][_guiltyParty];
        require(deposit > 0, "No deposit to slash");
        
        escrowDeposits[_taskId][_guiltyParty] = 0;
        (bool success, ) = _recipient.call{value: deposit}("");
        require(success, "Slash transfer failed");
        
        emit LiabilityReleased(_taskId, _recipient, deposit);
    }
    
    /**
     * @notice 获取任务预设信息
     */
    function getTaskPreset(uint256 _taskId)
        external
        view
        returns (PresetConfig memory)
    {
        bytes32 presetId = taskPresets[_taskId];
        require(presetId != bytes32(0), "No preset applied");
        return presets[presetId];
    }
    
    /**
     * @notice 检查是否需要工作者质押
     */
    function requiresWorkerDeposit(uint256 _taskId)
        external
        view
        returns (bool, uint256)
    {
        bytes32 presetId = taskPresets[_taskId];
        if (presetId == bytes32(0)) return (false, 0);
        
        PresetConfig storage preset = presets[presetId];
        return (
            preset.model == LiabilityModel.Bonded,
            preset.workerLiability
        );
    }
    
    /**
     * @notice 获取责任金余额
     */
    function getEscrowBalance(uint256 _taskId, address _party)
        external
        view
        returns (uint256)
    {
        return escrowDeposits[_taskId][_party];
    }
}