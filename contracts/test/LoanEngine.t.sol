// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LoanEngine.sol";
import "../src/TestUSDC.sol";
import "../src/AgentController.sol";
import "../src/VerificationSBT.sol";
import "../src/TreasuryPool.sol";

contract LoanEngineTest is Test {
    LoanEngine public loanEngine;
    TestUSDC public usdc;
    AgentController public controller;
    VerificationSBT public sbt;
    TreasuryPool public pool;
    
    address public admin;
    address public screeningAgent;
    address public treasuryAgent;
    address public complianceAgent;
    address public verifier;
    address public borrower1;
    address public borrower2;
    address public depositor;
    
    function setUp() public {
        admin = address(this);
        screeningAgent = makeAddr("screeningAgent");
        treasuryAgent = makeAddr("treasuryAgent");
        complianceAgent = makeAddr("complianceAgent");
        verifier = makeAddr("verifier");
        borrower1 = makeAddr("borrower1");
        borrower2 = makeAddr("borrower2");
        depositor = makeAddr("depositor");
        
        // Deploy contracts
        usdc = new TestUSDC();
        controller = new AgentController();
        sbt = new VerificationSBT();
        pool = new TreasuryPool(address(usdc), address(controller));
        loanEngine = new LoanEngine(
            address(usdc),
            address(controller),
            address(sbt),
            address(pool)
        );
        
        // Setup roles
        controller.addAgent(screeningAgent, controller.SCREENING_AGENT());
        controller.addAgent(treasuryAgent, controller.TREASURY_AGENT());
        controller.addAgent(complianceAgent, controller.COMPLIANCE_AGENT());
        sbt.grantRole(sbt.VERIFIER_ROLE(), verifier);
        
        // Authorize loan engine in pool
        vm.prank(treasuryAgent);
        pool.setLoanEngineAuthorization(address(loanEngine), true);
        
        // Fund depositor and deposit to pool
        usdc.transfer(depositor, 100000 * 10**6);
        vm.startPrank(depositor);
        usdc.approve(address(pool), 100000 * 10**6);
        pool.deposit(100000 * 10**6);
        vm.stopPrank();
        
        // Verify borrowers
        vm.startPrank(verifier);
        sbt.mintSBT(borrower1, "ipfs://borrower1");
        sbt.mintSBT(borrower2, "ipfs://borrower2");
        vm.stopPrank();
    }
    
    function testRequestLoan() public {
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        assertEq(loanId, 1);
        
        LoanEngine.Loan memory loan = loanEngine.getLoan(loanId);
        assertEq(loan.borrower, borrower1);
        assertEq(loan.amount, 1000 * 10**6);
        assertEq(uint256(loan.status), uint256(LoanEngine.LoanStatus.Requested));
    }
    
    function testRequestLoanOnlyVerified() public {
        address unverified = makeAddr("unverified");
        
        vm.prank(unverified);
        vm.expectRevert("LoanEngine: User not verified");
        loanEngine.requestLoan(1000 * 10**6, "Business");
    }
    
    function testRequestLoanMinimumAmount() public {
        vm.prank(borrower1);
        vm.expectRevert("LoanEngine: Amount below minimum");
        loanEngine.requestLoan(50 * 10**6, "Too small");
    }
    
    function testRequestLoanMaximumAmount() public {
        vm.prank(borrower1);
        vm.expectRevert("LoanEngine: Amount exceeds maximum");
        loanEngine.requestLoan(100000 * 10**6, "Too large");
    }
    
    function testApproveLoan() public {
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        // Fund loan engine for disbursement
        vm.prank(treasuryAgent);
        pool.provideLiquidity(address(loanEngine), 1000 * 10**6);
        
        vm.prank(screeningAgent);
        loanEngine.approveLoan(loanId, 500); // 5% interest
        
        LoanEngine.Loan memory loan = loanEngine.getLoan(loanId);
        assertEq(uint256(loan.status), uint256(LoanEngine.LoanStatus.Disbursed));
        assertEq(loan.interestRate, 500);
        assertEq(usdc.balanceOf(borrower1), 1000 * 10**6);
    }
    
    function testApproveLoanOnlyScreeningAgent() public {
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        vm.prank(borrower2);
        vm.expectRevert("LoanEngine: Caller is not a screening agent");
        loanEngine.approveLoan(loanId, 500);
    }
    
    function testRepayLoan() public {
        // Request and approve loan
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        vm.prank(treasuryAgent);
        pool.provideLiquidity(address(loanEngine), 1000 * 10**6);
        
        vm.prank(screeningAgent);
        loanEngine.approveLoan(loanId, 500); // 5% interest, total owed = 1050 USDC
        
        // Give borrower USDC to repay
        usdc.transfer(borrower1, 1050 * 10**6);
        
        // Repay loan
        vm.startPrank(borrower1);
        usdc.approve(address(loanEngine), 1050 * 10**6);
        loanEngine.repayLoan(loanId, 1050 * 10**6);
        vm.stopPrank();
        
        LoanEngine.Loan memory loan = loanEngine.getLoan(loanId);
        assertEq(uint256(loan.status), uint256(LoanEngine.LoanStatus.Repaid));
        assertEq(loan.repaid, 1050 * 10**6);
    }
    
    function testPartialRepayment() public {
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        vm.prank(treasuryAgent);
        pool.provideLiquidity(address(loanEngine), 1000 * 10**6);
        
        vm.prank(screeningAgent);
        loanEngine.approveLoan(loanId, 500);
        
        usdc.transfer(borrower1, 1050 * 10**6);
        
        vm.startPrank(borrower1);
        usdc.approve(address(loanEngine), 500 * 10**6);
        loanEngine.repayLoan(loanId, 500 * 10**6);
        vm.stopPrank();
        
        LoanEngine.Loan memory loan = loanEngine.getLoan(loanId);
        assertEq(uint256(loan.status), uint256(LoanEngine.LoanStatus.Disbursed));
        assertEq(loan.repaid, 500 * 10**6);
        assertEq(loanEngine.getRemainingBalance(loanId), 550 * 10**6);
    }
    
    function testCreditScoreIncreasesOnRepayment() public {
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        uint256 initialScore = loanEngine.getCreditScore(borrower1);
        
        vm.prank(treasuryAgent);
        pool.provideLiquidity(address(loanEngine), 1000 * 10**6);
        
        vm.prank(screeningAgent);
        loanEngine.approveLoan(loanId, 500);
        
        usdc.transfer(borrower1, 1050 * 10**6);
        
        vm.startPrank(borrower1);
        usdc.approve(address(loanEngine), 1050 * 10**6);
        loanEngine.repayLoan(loanId, 1050 * 10**6);
        vm.stopPrank();
        
        uint256 finalScore = loanEngine.getCreditScore(borrower1);
        assertGt(finalScore, initialScore);
    }
    
    function testMarkAsDefaulted() public {
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        vm.prank(treasuryAgent);
        pool.provideLiquidity(address(loanEngine), 1000 * 10**6);
        
        vm.prank(screeningAgent);
        loanEngine.approveLoan(loanId, 500);
        
        // Fast forward past due date
        LoanEngine.Loan memory loan = loanEngine.getLoan(loanId);
        vm.warp(loan.dueAt + 1 days);
        
        uint256 scoreBefore = loanEngine.getCreditScore(borrower1);
        
        vm.prank(complianceAgent);
        loanEngine.markAsDefaulted(loanId);
        
        loan = loanEngine.getLoan(loanId);
        assertEq(uint256(loan.status), uint256(LoanEngine.LoanStatus.Defaulted));
        
        uint256 scoreAfter = loanEngine.getCreditScore(borrower1);
        assertLt(scoreAfter, scoreBefore);
    }
    
    function testCannotMarkAsDefaultedBeforeDueDate() public {
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        vm.prank(treasuryAgent);
        pool.provideLiquidity(address(loanEngine), 1000 * 10**6);
        
        vm.prank(screeningAgent);
        loanEngine.approveLoan(loanId, 500);
        
        vm.prank(complianceAgent);
        vm.expectRevert("LoanEngine: Loan not yet overdue");
        loanEngine.markAsDefaulted(loanId);
    }
    
    function testCancelLoan() public {
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        vm.prank(borrower1);
        loanEngine.cancelLoan(loanId);
        
        LoanEngine.Loan memory loan = loanEngine.getLoan(loanId);
        assertEq(uint256(loan.status), uint256(LoanEngine.LoanStatus.Cancelled));
    }
    
    function testScreeningAgentCanCancelLoan() public {
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        vm.prank(screeningAgent);
        loanEngine.cancelLoan(loanId);
        
        LoanEngine.Loan memory loan = loanEngine.getLoan(loanId);
        assertEq(uint256(loan.status), uint256(LoanEngine.LoanStatus.Cancelled));
    }
    
    function testUpdateCreditScore() public {
        // Request a loan first to initialize credit score
        vm.prank(borrower1);
        loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        uint256 initialScore = loanEngine.getCreditScore(borrower1);
        
        vm.prank(screeningAgent);
        loanEngine.updateCreditScore(borrower1, 100, true);
        
        uint256 newScore = loanEngine.getCreditScore(borrower1);
        assertEq(newScore, initialScore + 100);
    }
    
    function testCreditScoreCaps() public {
        // Request a loan first to initialize credit score to 500
        vm.prank(borrower1);
        loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        // Test max cap
        vm.startPrank(screeningAgent);
        loanEngine.updateCreditScore(borrower1, 1000, true);
        assertEq(loanEngine.getCreditScore(borrower1), 1000);
        
        // Test min cap - note: getCreditScore returns INITIAL_CREDIT_SCORE (500) when internal score is 0
        loanEngine.updateCreditScore(borrower1, 2000, false);
        uint256 finalScore = loanEngine.getCreditScore(borrower1);
        // After decreasing by 2000 from 1000, score should be at minimum (0 internally, 500 from getCreditScore)
        assertEq(finalScore, 500); // getCreditScore returns INITIAL_CREDIT_SCORE when score is 0
        vm.stopPrank();
    }
    
    function testGetUserLoans() public {
        vm.startPrank(borrower1);
        uint256 loanId1 = loanEngine.requestLoan(1000 * 10**6, "Loan 1");
        uint256 loanId2 = loanEngine.requestLoan(2000 * 10**6, "Loan 2");
        vm.stopPrank();
        
        uint256[] memory loans = loanEngine.getUserLoans(borrower1);
        assertEq(loans.length, 2);
        assertEq(loans[0], loanId1);
        assertEq(loans[1], loanId2);
    }
    
    function testGetTotalOwed() public {
        vm.prank(borrower1);
        uint256 loanId = loanEngine.requestLoan(1000 * 10**6, "Business expansion");
        
        vm.prank(treasuryAgent);
        pool.provideLiquidity(address(loanEngine), 1000 * 10**6);
        
        vm.prank(screeningAgent);
        loanEngine.approveLoan(loanId, 500); // 5% interest
        
        uint256 totalOwed = loanEngine.getTotalOwed(loanId);
        assertEq(totalOwed, 1050 * 10**6); // 1000 + 5%
    }
    
    function testMultipleBorrowers() public {
        vm.prank(borrower1);
        uint256 loan1 = loanEngine.requestLoan(1000 * 10**6, "Borrower 1 loan");
        
        vm.prank(borrower2);
        uint256 loan2 = loanEngine.requestLoan(2000 * 10**6, "Borrower 2 loan");
        
        assertEq(loanEngine.getLoan(loan1).borrower, borrower1);
        assertEq(loanEngine.getLoan(loan2).borrower, borrower2);
    }
}

