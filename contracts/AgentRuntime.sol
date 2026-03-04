/**
 * @title AgentRuntime
 * @notice Agent 运行时系统 - 协调 LLM、MCP、Skills
 * @dev 类似 OpenClaw 的 Agent 执行引擎
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AgentLifecycle.sol";
import "./AgentCommunity.sol";

contract AgentRuntime {
    
    AgentLifecycle public lifecycle;
    AgentCommunity public community;
    
    // Skill 注册表
    struct Skill {
        bytes32 skillId;
        string name;
        string description;
        address provider;
        uint256 baseCost;
        bool isActive;
        string[] requiredCapabilities;
    }
    
    // MCP 服务注册表
    struct MCPService {
        bytes32 serviceId;
        string name;
        string endpoint;
        uint256 costPerCall;
        bool isActive;
    }
    
    // Agent 执行上下文
    struct ExecutionContext {
        uint256 agentId;
        bytes32 currentTaskId;
        bytes32[] skillStack;
        uint256 startTime;
        uint256 gasUsed;
        bool isComplete;
    }
    
    mapping(bytes32 => Skill) public skills;
    mapping(bytes32 => MCPService) public mcpServices;
    mapping(bytes32 => ExecutionContext) public executions;
    mapping(uint256 => bytes32[]) public agentExecutionHistory;
    
    bytes32[] public skillList;
    bytes32[] public mcpServiceList;
    
    // ============ 事件 ============
    
    event SkillRegistered(
        bytes32 indexed skillId,
        string name,
        address provider,
        uint256 baseCost
    );
    
    event MCPServiceRegistered(
        bytes32 indexed serviceId,
        string name,
        uint256 costPerCall
    );
    
    event ExecutionStarted(
        bytes32 indexed executionId,
        uint256 indexed agentId,
        bytes32 taskId,
        string intent
    );
    
    event SkillInvoked(
        bytes32 indexed executionId,
        bytes32 indexed skillId,
        uint256 cost
    );
    
    event MCPServiceCalled(
        bytes32 indexed executionId,
        bytes32 indexed serviceId,
        uint256 cost
    );
    
    event ExecutionCompleted(
        bytes32 indexed executionId,
        bool success,
        uint256 totalCost,
        string result
    );
    
    event ReflectionRecorded(
        bytes32 indexed executionId,
        uint256 effectivenessScore,
        string learnings
    );
    
    // ============ Skill 管理 ============
    
    function registerSkill(
        bytes32 _skillId,
        string memory _name,
        string memory _description,
        address _provider,
        uint256 _baseCost,
        string[] memory _capabilities
    ) external {
        require(skills[_skillId].provider == address(0), "Skill exists");
        
        skills[_skillId] = Skill({
            skillId: _skillId,
            name: _name,
            description: _description,
            provider: _provider,
            baseCost: _baseCost,
            isActive: true,
            requiredCapabilities: _capabilities
        });
        
        skillList.push(_skillId);
        
        emit SkillRegistered(_skillId, _name, _provider, _baseCost);
    }
    
    function registerMCPService(
        bytes32 _serviceId,
        string memory _name,
        string memory _endpoint,
        uint256 _costPerCall
    ) external {
        require(bytes(mcpServices[_serviceId].name).length == 0, "Service exists");
        
        mcpServices[_serviceId] = MCPService({
            serviceId: _serviceId,
            name: _name,
            endpoint: _endpoint,
            costPerCall: _costPerCall,
            isActive: true
        });
        
        mcpServiceList.push(_serviceId);
        
        emit MCPServiceRegistered(_serviceId, _name, _costPerCall);
    }
    
    // ============ 执行引擎 ============
    
    /**
     * @notice 启动 Agent 执行
     * @dev 类似 OpenClaw 的 Agent 执行循环
     */
    function startExecution(
        uint256 _agentId,
        bytes32 _taskId,
        string memory _intent
    ) external returns (bytes32 executionId) {
        executionId = keccak256(abi.encodePacked(
            _agentId,
            _taskId,
            block.timestamp,
            _intent
        ));
        
        executions[executionId] = ExecutionContext({
            agentId: _agentId,
            currentTaskId: _taskId,
            skillStack: new bytes32[](0),
            startTime: block.timestamp,
            gasUsed: 0,
            isComplete: false
        });
        
        agentExecutionHistory[_agentId].push(executionId);
        
        emit ExecutionStarted(executionId, _agentId, _taskId, _intent);
        
        return executionId;
    }
    
    /**
     * @notice 调用 Skill
     * @dev Skill 执行会产生成本
     */
    function invokeSkill(
        bytes32 _executionId,
        bytes32 _skillId,
        bytes memory _input
    ) external returns (bytes memory output) {
        ExecutionContext storage ctx = executions[_executionId];
        require(!ctx.isComplete, "Execution complete");
        
        Skill storage skill = skills[_skillId];
        require(skill.isActive, "Skill inactive");
        
        // 记录成本
        lifecycle.recordCost(
            ctx.agentId,
            AgentLifecycle.CostType.SkillUsage,
            skill.baseCost,
            string(abi.encodePacked("Skill: ", skill.name)),
            ctx.currentTaskId
        );
        
        ctx.skillStack.push(_skillId);
        ctx.gasUsed += skill.baseCost;
        
        emit SkillInvoked(_executionId, _skillId, skill.baseCost);
        
        // 实际 Skill 执行由链下服务处理
        // 这里只记录调用意图和成本
        output = abi.encode("SKILL_EXECUTED", _skillId, _input);
    }
    
    /**
     * @notice 调用 MCP 服务
     * @dev MCP (Model Context Protocol) 服务调用
     */
    function callMCPService(
        bytes32 _executionId,
        bytes32 _serviceId,
        bytes memory _params
    ) external returns (bytes memory result) {
        ExecutionContext storage ctx = executions[_executionId];
        require(!ctx.isComplete, "Execution complete");
        
        MCPService storage service = mcpServices[_serviceId];
        require(service.isActive, "Service inactive");
        
        // 记录成本
        lifecycle.recordCost(
            ctx.agentId,
            AgentLifecycle.CostType.MCPService,
            service.costPerCall,
            string(abi.encodePacked("MCP: ", service.name)),
            ctx.currentTaskId
        );
        
        ctx.gasUsed += service.costPerCall;
        
        emit MCPServiceCalled(_executionId, _serviceId, service.costPerCall);
        
        // MCP 调用由链下服务处理
        result = abi.encode("MCP_CALLED", _serviceId, _params);
    }
    
    /**
     * @notice 完成执行并记录反思
     * @dev 类似 OpenClaw 的执行后反思
     */
    function completeExecution(
        bytes32 _executionId,
        bool _success,
        string memory _result,
        uint256 _effectivenessScore,
        string memory _learnings
    ) external {
        ExecutionContext storage ctx = executions[_executionId];
        require(!ctx.isComplete, "Already complete");
        
        ctx.isComplete = true;
        
        emit ExecutionCompleted(
            _executionId,
            _success,
            ctx.gasUsed,
            _result
        );
        
        emit ReflectionRecorded(
            _executionId,
            _effectivenessScore,
            _learnings
        );
    }
    
    // ============ 决策支持 ============
    
    /**
     * @notice 获取推荐 Skill
     * @dev 基于任务类型推荐合适的 Skills
     */
    function recommendSkills(
        string memory _taskType
    ) external view returns (bytes32[] memory) {
        // 简化版：返回所有活跃 Skills
        // 实际应基于任务类型和 Agent 历史匹配
        
        bytes32[] memory activeSkills = new bytes32[](skillList.length);
        uint256 count = 0;
        
        for (uint i = 0; i < skillList.length; i++) {
            if (skills[skillList[i]].isActive) {
                activeSkills[count] = skillList[i];
                count++;
            }
        }
        
        // 调整数组大小
        bytes32[] memory result = new bytes32[](count);
        for (uint i = 0; i < count; i++) {
            result[i] = activeSkills[i];
        }
        
        return result;
    }
    
    /**
     * @notice 估算任务成本
     */
    function estimateTaskCost(
        bytes32[] memory _requiredSkills,
        uint256 _estimatedMcpCalls
    ) external view returns (uint256 totalCost) {
        // Skill 成本
        for (uint i = 0; i < _requiredSkills.length; i++) {
            totalCost += skills[_requiredSkills[i]].baseCost;
        }
        
        // MCP 调用成本（使用平均值）
        if (_estimatedMcpCalls > 0 && mcpServiceList.length > 0) {
            uint256 avgMcpCost = 0;
            for (uint i = 0; i < mcpServiceList.length; i++) {
                avgMcpCost += mcpServices[mcpServiceList[i]].costPerCall;
            }
            avgMcpCost = avgMcpCost / mcpServiceList.length;
            totalCost += avgMcpCost * _estimatedMcpCalls;
        }
        
        // 加上预估 Gas 费用
        totalCost += 0.001 ether;
    }
    
    // ============ 查询 ============
    
    function getAgentExecutions(uint256 _agentId)
        external
        view
        returns (bytes32[] memory)
    {
        return agentExecutionHistory[_agentId];
    }
    
    function getExecutionDetails(bytes32 _executionId)
        external
        view
        returns (
            uint256 agentId,
            bytes32 taskId,
            uint256 skillCount,
            uint256 gasUsed,
            bool isComplete,
            uint256 duration
        )
    {
        ExecutionContext storage ctx = executions[_executionId];
        agentId = ctx.agentId;
        taskId = ctx.currentTaskId;
        skillCount = ctx.skillStack.length;
        gasUsed = ctx.gasUsed;
        isComplete = ctx.isComplete;
        duration = ctx.isComplete 
            ? block.timestamp - ctx.startTime 
            : 0;
    }
}
