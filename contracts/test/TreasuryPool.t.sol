// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TreasuryPool.sol";
import "../src/TestUSDC.sol";
import "../src/AgentController.sol";

contract TreasuryPoolTest is Test {
    TreasuryPool public pool;
    TestUSDC public usdc;
    AgentController public controller;
    
    address public admin;
    address public treasuryAgent;
    address public loanEngine;
    address public depositor1;
    address public depositor2;
    
    function setUp() public {
        admin = address(this);
        treasuryAgent = makeAddr("treasuryAgent");
        loanEngine = makeAddr("loanEngine");
        depositor1 = makeAddr("depositor1");
        depositor2 = makeAddr("depositor2");
        
        // Deploy contracts
        usdc = new TestUSDC();
        controller = new AgentController();
        pool = new TreasuryPool(address(usdc), address(controller));
        
        // Setup roles
        controller.addAgent(treasuryAgent, controller.TREASURY_AGENT());
        
        // Distribute USDC
        usdc.transfer(depositor1, 10000 * 10**6);
        usdc.transfer(depositor2, 10000 * 10**6);
    }
    
    function testDeposit() public {
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 1000 * 10**6);
        pool.deposit(1000 * 10**6);
        vm.stopPrank();
        
        assertEq(pool.deposits(depositor1), 1000 * 10**6);
        assertEq(pool.totalLiquidity(), 1000 * 10**6);
    }
    
    function testWithdraw() public {
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 1000 * 10**6);
        pool.deposit(1000 * 10**6);
        
        pool.withdraw(500 * 10**6);
        vm.stopPrank();
        
        assertEq(pool.deposits(depositor1), 500 * 10**6);
        assertEq(pool.totalLiquidity(), 500 * 10**6);
    }
    
    function testCannotWithdrawMoreThanDeposited() public {
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 1000 * 10**6);
        pool.deposit(1000 * 10**6);
        
        vm.expectRevert("TreasuryPool: Insufficient balance");
        pool.withdraw(2000 * 10**6);
        vm.stopPrank();
    }
    
    function testProvideLiquidity() public {
        // Deposit first
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 10000 * 10**6);
        pool.deposit(10000 * 10**6);
        vm.stopPrank();
        
        // Authorize loan engine
        vm.prank(treasuryAgent);
        pool.setLoanEngineAuthorization(loanEngine, true);
        
        // Provide liquidity
        vm.prank(treasuryAgent);
        pool.provideLiquidity(loanEngine, 1000 * 10**6);
        
        assertEq(pool.totalUtilized(), 1000 * 10**6);
        assertEq(usdc.balanceOf(loanEngine), 1000 * 10**6);
    }
    
    function testProvideLiquidityOnlyTreasuryAgent() public {
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 1000 * 10**6);
        pool.deposit(1000 * 10**6);
        
        vm.expectRevert("TreasuryPool: Caller is not a treasury agent");
        pool.provideLiquidity(loanEngine, 500 * 10**6);
        vm.stopPrank();
    }
    
    function testCannotProvideLiquidityToUnauthorizedEngine() public {
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 1000 * 10**6);
        pool.deposit(1000 * 10**6);
        vm.stopPrank();
        
        vm.prank(treasuryAgent);
        vm.expectRevert("TreasuryPool: Loan engine not authorized");
        pool.provideLiquidity(loanEngine, 500 * 10**6);
    }
    
    function testReceiveRepayment() public {
        // Setup: deposit and provide liquidity
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 10000 * 10**6);
        pool.deposit(10000 * 10**6);
        vm.stopPrank();
        
        vm.prank(treasuryAgent);
        pool.setLoanEngineAuthorization(loanEngine, true);
        
        vm.prank(treasuryAgent);
        pool.provideLiquidity(loanEngine, 1000 * 10**6);
        
        // Give loan engine extra USDC for interest payment
        usdc.transfer(loanEngine, 100 * 10**6);
        
        // Repay
        vm.startPrank(loanEngine);
        usdc.approve(address(pool), 1100 * 10**6);
        pool.receiveRepayment(1100 * 10**6);
        vm.stopPrank();
        
        assertEq(pool.totalUtilized(), 0);
        assertEq(pool.totalLiquidity(), 10100 * 10**6); // Original + interest
    }
    
    function testMinimumReserveRatio() public {
        // Deposit 10000 USDC
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 10000 * 10**6);
        pool.deposit(10000 * 10**6);
        vm.stopPrank();
        
        vm.prank(treasuryAgent);
        pool.setLoanEngineAuthorization(loanEngine, true);
        
        // Try to provide 9000 USDC (would leave only 10% reserve)
        vm.prank(treasuryAgent);
        vm.expectRevert("TreasuryPool: Would breach minimum reserve ratio");
        pool.provideLiquidity(loanEngine, 9000 * 10**6);
    }
    
    function testGetAvailableLiquidity() public {
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 10000 * 10**6);
        pool.deposit(10000 * 10**6);
        vm.stopPrank();
        
        assertEq(pool.getAvailableLiquidity(), 10000 * 10**6);
        
        vm.prank(treasuryAgent);
        pool.setLoanEngineAuthorization(loanEngine, true);
        
        vm.prank(treasuryAgent);
        pool.provideLiquidity(loanEngine, 1000 * 10**6);
        
        assertEq(pool.getAvailableLiquidity(), 9000 * 10**6);
    }
    
    function testGetReserveRatio() public {
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 10000 * 10**6);
        pool.deposit(10000 * 10**6);
        vm.stopPrank();
        
        assertEq(pool.getReserveRatio(), 10000); // 100%
        
        vm.prank(treasuryAgent);
        pool.setLoanEngineAuthorization(loanEngine, true);
        
        vm.prank(treasuryAgent);
        pool.provideLiquidity(loanEngine, 5000 * 10**6);
        
        assertEq(pool.getReserveRatio(), 5000); // 50%
    }
    
    function testGetUtilizationRatio() public {
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 10000 * 10**6);
        pool.deposit(10000 * 10**6);
        vm.stopPrank();
        
        assertEq(pool.getUtilizationRatio(), 0);
        
        vm.prank(treasuryAgent);
        pool.setLoanEngineAuthorization(loanEngine, true);
        
        vm.prank(treasuryAgent);
        pool.provideLiquidity(loanEngine, 3000 * 10**6);
        
        assertEq(pool.getUtilizationRatio(), 3000); // 30%
    }
    
    function testMultipleDepositors() public {
        vm.startPrank(depositor1);
        usdc.approve(address(pool), 5000 * 10**6);
        pool.deposit(5000 * 10**6);
        vm.stopPrank();
        
        vm.startPrank(depositor2);
        usdc.approve(address(pool), 3000 * 10**6);
        pool.deposit(3000 * 10**6);
        vm.stopPrank();
        
        assertEq(pool.totalLiquidity(), 8000 * 10**6);
        assertEq(pool.deposits(depositor1), 5000 * 10**6);
        assertEq(pool.deposits(depositor2), 3000 * 10**6);
    }
}

