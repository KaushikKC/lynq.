// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentController.sol";

contract AgentControllerTest is Test {
    AgentController public controller;
    address public admin;
    address public agent1;
    address public agent2;
    address public user;
    
    function setUp() public {
        admin = address(this);
        agent1 = makeAddr("agent1");
        agent2 = makeAddr("agent2");
        user = makeAddr("user");
        
        controller = new AgentController();
    }
    
    function testAddScreeningAgent() public {
        controller.addAgent(agent1, controller.SCREENING_AGENT());
        
        assertTrue(controller.isAgent(agent1, controller.SCREENING_AGENT()));
        assertTrue(controller.isScreeningAgent(agent1));
    }
    
    function testAddTreasuryAgent() public {
        controller.addAgent(agent1, controller.TREASURY_AGENT());
        
        assertTrue(controller.isAgent(agent1, controller.TREASURY_AGENT()));
        assertTrue(controller.isTreasuryAgent(agent1));
    }
    
    function testAddComplianceAgent() public {
        controller.addAgent(agent1, controller.COMPLIANCE_AGENT());
        
        assertTrue(controller.isAgent(agent1, controller.COMPLIANCE_AGENT()));
        assertTrue(controller.isComplianceAgent(agent1));
    }
    
    function testRemoveAgent() public {
        controller.addAgent(agent1, controller.SCREENING_AGENT());
        assertTrue(controller.isScreeningAgent(agent1));
        
        controller.removeAgent(agent1, controller.SCREENING_AGENT());
        assertFalse(controller.isScreeningAgent(agent1));
    }
    
    function testInvalidRole() public {
        bytes32 invalidRole = keccak256("INVALID_ROLE");
        
        vm.expectRevert("AgentController: Invalid role");
        controller.addAgent(agent1, invalidRole);
    }
    
    function testCannotAddZeroAddress() public {
        try controller.addAgent(address(0), controller.SCREENING_AGENT()) {
            fail("Expected revert but call succeeded");
        } catch Error(string memory reason) {
            assertEq(reason, "AgentController: Cannot add zero address");
        }
    }
    
    function testMultipleRoles() public {
        controller.addAgent(agent1, controller.SCREENING_AGENT());
        controller.addAgent(agent1, controller.TREASURY_AGENT());
        
        assertTrue(controller.isScreeningAgent(agent1));
        assertTrue(controller.isTreasuryAgent(agent1));
        assertFalse(controller.isComplianceAgent(agent1));
    }
    
    function testGetRoles() public view {
        (bytes32 screening, bytes32 treasury, bytes32 compliance) = controller.getRoles();
        
        assertEq(screening, controller.SCREENING_AGENT());
        assertEq(treasury, controller.TREASURY_AGENT());
        assertEq(compliance, controller.COMPLIANCE_AGENT());
    }
    
    function testMultipleAgents() public {
        controller.addAgent(agent1, controller.SCREENING_AGENT());
        controller.addAgent(agent2, controller.TREASURY_AGENT());
        
        assertTrue(controller.isScreeningAgent(agent1));
        assertTrue(controller.isTreasuryAgent(agent2));
        assertFalse(controller.isScreeningAgent(agent2));
        assertFalse(controller.isTreasuryAgent(agent1));
    }
}

