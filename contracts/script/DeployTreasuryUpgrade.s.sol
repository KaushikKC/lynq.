// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/GatewayManager.sol";
import "../src/MultiCurrencyManager.sol";
import "../src/TreasuryPool.sol";
import "../src/LoanEngine.sol";

/**
 * @title DeployTreasuryUpgrade
 * @notice Deployment script for treasury management and Circle Gateway features
 */
contract DeployTreasuryUpgrade is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envAddress("USDC_ADDRESS");
        address agentController = vm.envAddress("AGENT_CONTROLLER_ADDRESS");
        address loanEngine = vm.envAddress("LOAN_ENGINE_ADDRESS");
        
        // Arc Testnet Chain ID
        uint256 chainId = 412346;
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== Deploying Treasury Management Contracts ===");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("USDC:", usdc);
        console.log("AgentController:", agentController);
        console.log("LoanEngine:", loanEngine);
        console.log("Chain ID:", chainId);
        
        // 1. Deploy GatewayManager for Circle Gateway integration
        console.log("\n1. Deploying GatewayManager...");
        address gatewayWallet = address(0x1234567890123456789012345678901234567890); // Placeholder
        GatewayManager gatewayManager = new GatewayManager(
            usdc,
            gatewayWallet,
            agentController,
            chainId
        );
        console.log("GatewayManager deployed at:", address(gatewayManager));
        
        // 2. Deploy MultiCurrencyManager
        console.log("\n2. Deploying MultiCurrencyManager...");
        MultiCurrencyManager multiCurrency = new MultiCurrencyManager(
            usdc,
            agentController
        );
        console.log("MultiCurrencyManager deployed at:", address(multiCurrency));
        
        // 3. Setup multi-currency manager in LoanEngine
        console.log("\n3. Setting up MultiCurrencyManager in LoanEngine...");
        LoanEngine(loanEngine).setMultiCurrencyManager(address(multiCurrency));
        console.log("MultiCurrencyManager linked to LoanEngine");
        
        // 4. Add supported currencies
        console.log("\n4. Adding supported currencies...");
        
        // Add EURC (Euro Coin) - assuming 1 EUR = 1.09 USD
        address eurc = address(0x2345678901234567890123456789012345678901); // Deploy TestEURC or use actual address
        multiCurrency.addCurrency(eurc, "EURC", 10900); // 1.09 USDC per EURC
        console.log("EURC added with rate: 1.09 USDC");
        
        // Add MXN token - assuming 1 MXN = 0.058 USD (17.24 MXN per USD)
        address mxn = address(0x3456789012345678901234567890123456789012); // Deploy TestMXN or use actual address
        multiCurrency.addCurrency(mxn, "MXN", 580); // 0.058 USDC per MXN
        console.log("MXN added with rate: 0.058 USDC");
        
        console.log("\n=== Deployment Summary ===");
        console.log("GatewayManager:", address(gatewayManager));
        console.log("MultiCurrencyManager:", address(multiCurrency));
        console.log("\nSupported Currencies:");
        console.log("- USDC (Base)");
        console.log("- EURC (1.09 USDC)");
        console.log("- MXN (0.058 USDC)");
        
        console.log("\n=== Next Steps ===");
        console.log("1. Update .env with new contract addresses");
        console.log("2. Fund GatewayManager with initial liquidity");
        console.log("3. Deploy test token contracts (EURC, MXN) if needed");
        console.log("4. Test treasury allocations and distributions");
        console.log("5. Test multi-currency loan repayments");
        
        vm.stopBroadcast();
    }
}

