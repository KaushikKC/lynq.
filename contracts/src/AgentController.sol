// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AgentController
 * @notice Manages agent roles for the Lynq lending platform
 * @dev Uses OpenZeppelin's AccessControl for role-based permissions
 */
contract AgentController is AccessControl {
    // Define role constants
    bytes32 public constant SCREENING_AGENT = keccak256("SCREENING_AGENT");
    bytes32 public constant TREASURY_AGENT = keccak256("TREASURY_AGENT");
    bytes32 public constant COMPLIANCE_AGENT = keccak256("COMPLIANCE_AGENT");
    
    event AgentAdded(address indexed agent, bytes32 indexed role);
    event AgentRemoved(address indexed agent, bytes32 indexed role);
    
    constructor() {
        // Grant the deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // Set role admins (who can grant/revoke these roles)
        _setRoleAdmin(SCREENING_AGENT, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(TREASURY_AGENT, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(COMPLIANCE_AGENT, DEFAULT_ADMIN_ROLE);
    }
    
    /**
     * @notice Add an agent with a specific role
     * @param agent Address of the agent
     * @param role Role to grant
     */
    function addAgent(address agent, bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(agent != address(0), "AgentController: Cannot add zero address");
        require(
            role == SCREENING_AGENT || 
            role == TREASURY_AGENT || 
            role == COMPLIANCE_AGENT,
            "AgentController: Invalid role"
        );
        
        grantRole(role, agent);
        emit AgentAdded(agent, role);
    }
    
    /**
     * @notice Remove an agent's role
     * @param agent Address of the agent
     * @param role Role to revoke
     */
    function removeAgent(address agent, bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(role, agent);
        emit AgentRemoved(agent, role);
    }
    
    /**
     * @notice Check if an address has a specific agent role
     * @param agent Address to check
     * @param role Role to check for
     * @return bool True if the address has the specified role
     */
    function isAgent(address agent, bytes32 role) external view returns (bool) {
        return hasRole(role, agent);
    }
    
    /**
     * @notice Check if an address is a screening agent
     * @param agent Address to check
     * @return bool True if the address is a screening agent
     */
    function isScreeningAgent(address agent) external view returns (bool) {
        return hasRole(SCREENING_AGENT, agent);
    }
    
    /**
     * @notice Check if an address is a treasury agent
     * @param agent Address to check
     * @return bool True if the address is a treasury agent
     */
    function isTreasuryAgent(address agent) external view returns (bool) {
        return hasRole(TREASURY_AGENT, agent);
    }
    
    /**
     * @notice Check if an address is a compliance agent
     * @param agent Address to check
     * @return bool True if the address is a compliance agent
     */
    function isComplianceAgent(address agent) external view returns (bool) {
        return hasRole(COMPLIANCE_AGENT, agent);
    }
    
    /**
     * @notice Get all roles for easy reference
     * @return screening bytes32 hash of SCREENING_AGENT role
     * @return treasury bytes32 hash of TREASURY_AGENT role
     * @return compliance bytes32 hash of COMPLIANCE_AGENT role
     */
    function getRoles() external pure returns (
        bytes32 screening,
        bytes32 treasury,
        bytes32 compliance
    ) {
        return (SCREENING_AGENT, TREASURY_AGENT, COMPLIANCE_AGENT);
    }
}

