// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TestUSDC.sol";
import "../src/VerificationSBT.sol";
import "../src/AgentController.sol";
import "../src/TreasuryPool.sol";
import "../src/LoanEngine.sol";

/**
 * @title Deploy
 * @notice Deployment script for Lynq lending platform contracts
 * @dev Run with: forge script script/Deploy.s.sol:Deploy --rpc-url arc_testnet --broadcast --verify
 */
contract Deploy is Script {
    // Deployed contract addresses will be logged
    TestUSDC public usdc;
    VerificationSBT public verificationSBT;
    AgentController public agentController;
    TreasuryPool public treasuryPool;
    LoanEngine public loanEngine;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy TestUSDC
        console.log("\n1. Deploying TestUSDC...");
        usdc = new TestUSDC();
        console.log("TestUSDC deployed at:", address(usdc));
        
        // 2. Deploy VerificationSBT
        console.log("\n2. Deploying VerificationSBT...");
        verificationSBT = new VerificationSBT();
        console.log("VerificationSBT deployed at:", address(verificationSBT));
        
        // 3. Deploy AgentController
        console.log("\n3. Deploying AgentController...");
        agentController = new AgentController();
        console.log("AgentController deployed at:", address(agentController));
        
        // 4. Deploy TreasuryPool
        console.log("\n4. Deploying TreasuryPool...");
        treasuryPool = new TreasuryPool(
            address(usdc),
            address(agentController)
        );
        console.log("TreasuryPool deployed at:", address(treasuryPool));
        
        // 5. Deploy LoanEngine
        console.log("\n5. Deploying LoanEngine...");
        loanEngine = new LoanEngine(
            address(usdc),
            address(agentController),
            address(verificationSBT),
            address(treasuryPool)
        );
        console.log("LoanEngine deployed at:", address(loanEngine));
        
        // 6. Setup authorizations
        console.log("\n6. Setting up authorizations...");
        
        // Authorize LoanEngine in TreasuryPool
        agentController.addAgent(deployer, agentController.TREASURY_AGENT());
        treasuryPool.setLoanEngineAuthorization(address(loanEngine), true);
        console.log("LoanEngine authorized in TreasuryPool");
        
        // Add deployer as all agent types for initial setup
        agentController.addAgent(deployer, agentController.SCREENING_AGENT());
        agentController.addAgent(deployer, agentController.COMPLIANCE_AGENT());
        console.log("Deployer added as all agent types");
        
        // Grant verifier role to deployer
        verificationSBT.grantRole(verificationSBT.VERIFIER_ROLE(), deployer);
        console.log("Deployer granted verifier role");
        
        vm.stopBroadcast();
        
        // Log summary
        console.log("\n========================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("TestUSDC:          ", address(usdc));
        console.log("VerificationSBT:   ", address(verificationSBT));
        console.log("AgentController:   ", address(agentController));
        console.log("TreasuryPool:      ", address(treasuryPool));
        console.log("LoanEngine:        ", address(loanEngine));
        console.log("========================================");
        console.log("\nDeployer is configured as:");
        console.log("- Admin (all contracts)");
        console.log("- Screening Agent");
        console.log("- Treasury Agent");
        console.log("- Compliance Agent");
        console.log("- Verifier");
        console.log("========================================\n");
    }
}

