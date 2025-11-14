// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TestUSDC.sol";

contract TestUSDCTest is Test {
    TestUSDC public usdc;
    address public owner;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        usdc = new TestUSDC();
    }
    
    function testInitialSupply() public view {
        assertEq(usdc.totalSupply(), 1_000_000 * 10**6);
        assertEq(usdc.balanceOf(owner), 1_000_000 * 10**6);
    }
    
    function testDecimals() public view {
        assertEq(usdc.decimals(), 6);
    }
    
    function testFaucet() public {
        vm.prank(user1);
        usdc.faucet();
        
        assertEq(usdc.balanceOf(user1), 1000 * 10**6);
    }
    
    function testFaucetCooldown() public {
        vm.startPrank(user1);
        usdc.faucet();
        
        vm.expectRevert("TestUSDC: Faucet cooldown active");
        usdc.faucet();
        vm.stopPrank();
    }
    
    function testFaucetAfterCooldown() public {
        vm.startPrank(user1);
        usdc.faucet();
        
        // Fast forward 1 day
        vm.warp(block.timestamp + 1 days);
        
        usdc.faucet();
        assertEq(usdc.balanceOf(user1), 2000 * 10**6);
        vm.stopPrank();
    }
    
    function testMintOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        usdc.mint(user2, 1000 * 10**6);
    }
    
    function testMintByOwner() public {
        usdc.mint(user1, 5000 * 10**6);
        assertEq(usdc.balanceOf(user1), 5000 * 10**6);
    }
    
    function testTransfer() public {
        usdc.transfer(user1, 1000 * 10**6);
        assertEq(usdc.balanceOf(user1), 1000 * 10**6);
    }
}

