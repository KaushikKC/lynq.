// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VerificationSBT.sol";

contract VerificationSBTTest is Test {
    VerificationSBT public sbt;
    address public admin;
    address public verifier;
    address public user1;
    address public user2;
    
    function setUp() public {
        admin = address(this);
        verifier = makeAddr("verifier");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        sbt = new VerificationSBT();
        sbt.grantRole(sbt.VERIFIER_ROLE(), verifier);
    }
    
    function testMintSBT() public {
        vm.prank(verifier);
        sbt.mintSBT(user1, "ipfs://metadata1");
        
        assertTrue(sbt.isVerified(user1));
        assertEq(sbt.userToTokenId(user1), 1);
    }
    
    function testMintSBTOnlyVerifier() public {
        vm.prank(user1);
        vm.expectRevert();
        sbt.mintSBT(user2, "ipfs://metadata1");
    }
    
    function testCannotMintTwice() public {
        vm.startPrank(verifier);
        sbt.mintSBT(user1, "ipfs://metadata1");
        
        vm.expectRevert("VerificationSBT: User already verified");
        sbt.mintSBT(user1, "ipfs://metadata2");
        vm.stopPrank();
    }
    
    function testRevokeSBT() public {
        vm.startPrank(verifier);
        sbt.mintSBT(user1, "ipfs://metadata1");
        
        assertTrue(sbt.isVerified(user1));
        
        sbt.revokeSBT(user1);
        assertFalse(sbt.isVerified(user1));
        assertEq(sbt.userToTokenId(user1), 0);
        vm.stopPrank();
    }
    
    function testRevokeSBTOnlyVerifier() public {
        vm.prank(verifier);
        sbt.mintSBT(user1, "ipfs://metadata1");
        
        vm.prank(user2);
        vm.expectRevert();
        sbt.revokeSBT(user1);
    }
    
    function testCannotTransfer() public {
        vm.prank(verifier);
        sbt.mintSBT(user1, "ipfs://metadata1");
        
        vm.prank(user1);
        vm.expectRevert("VerificationSBT: Soulbound token cannot be transferred");
        sbt.transferFrom(user1, user2, 1);
    }
    
    function testCannotApprove() public {
        vm.prank(verifier);
        sbt.mintSBT(user1, "ipfs://metadata1");
        
        vm.prank(user1);
        vm.expectRevert("VerificationSBT: Soulbound token cannot be approved");
        sbt.approve(user2, 1);
    }
    
    function testCannotSetApprovalForAll() public {
        vm.prank(verifier);
        sbt.mintSBT(user1, "ipfs://metadata1");
        
        vm.prank(user1);
        vm.expectRevert("VerificationSBT: Soulbound token cannot be approved");
        sbt.setApprovalForAll(user2, true);
    }
    
    function testTokenURI() public {
        vm.prank(verifier);
        sbt.mintSBT(user1, "ipfs://metadata1");
        
        assertEq(sbt.tokenURI(1), "ipfs://metadata1");
    }
    
    function testMultipleUsers() public {
        vm.startPrank(verifier);
        sbt.mintSBT(user1, "ipfs://metadata1");
        sbt.mintSBT(user2, "ipfs://metadata2");
        vm.stopPrank();
        
        assertTrue(sbt.isVerified(user1));
        assertTrue(sbt.isVerified(user2));
        assertEq(sbt.userToTokenId(user1), 1);
        assertEq(sbt.userToTokenId(user2), 2);
    }
}

