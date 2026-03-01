// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ILiabilityRegistry
 * @notice LiabilityRegistry 接口
 */
interface ILiabilityRegistry {
    enum LiabilityType {
        Limited,
        Unlimited,
        Insured,
        Joint
    }
    
    struct LiabilityProfile {
        LiabilityType liabilityType;
        uint256 maxLiability;
        uint256 stakedAmount;
        address insurer;
        uint256 insurancePremium;
        address[] jointHolders;
        uint256[] jointShares;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    function profiles(address _agent) external view returns (LiabilityProfile memory);
    function lockLiability(address _agent, bytes32 _taskId, uint256 _amount) external returns (bool);
    function releaseLiability(bytes32 _taskId) external;
    function canAssumeLiability(address _agent, uint256 _amount) external view returns (bool);
}
