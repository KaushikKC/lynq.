// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TestEURC.sol";
import "../src/TestMXN.sol";

/**
 * @title TestTokenDeploy
 * @notice Deploy test tokens for multi-currency testing (EURC, MXN)
 */
contract TestTokenDeploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== Deploying Test Tokens ===");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        
        // Deploy TestEURC (Euro Coin)
        console.log("\n1. Deploying TestEURC...");
        TestEURC eurc = new TestEURC();
        console.log("TestEURC deployed at:", address(eurc));
        console.log("Initial EURC balance:", eurc.balanceOf(vm.addr(deployerPrivateKey)) / 10**6);
        
        // Deploy TestMXN (Mexican Peso)
        console.log("\n2. Deploying TestMXN...");
        TestMXN mxn = new TestMXN();
        console.log("TestMXN deployed at:", address(mxn));
        console.log("Initial MXN balance:", mxn.balanceOf(vm.addr(deployerPrivateKey)) / 10**6);
        
        console.log("\n=== Test Tokens Deployed ===");
        console.log("EURC:", address(eurc));
        console.log("MXN:", address(mxn));
        console.log("\nInitial balances:");
        console.log("- EURC: 1,000,000");
        console.log("- MXN: 10,000,000");
        console.log("\n=== Update your .env ===");
        console.log("EURC_ADDRESS=", address(eurc));
        console.log("MXN_ADDRESS=", address(mxn));
        
        vm.stopBroadcast();
    }
}

