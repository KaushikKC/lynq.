import { Request, Response } from 'express';
import Loan, { LoanStatus } from '../models/Loan';
import User from '../models/User';
import { logger } from '../utils/logger';
import { ethers } from 'ethers';

// Minimal ABIs - only functions we need
const LOAN_ENGINE_ABI = [
  'function approveLoan(uint256 loanId, uint256 interestRate) external',
  'function getLoan(uint256 loanId) external view returns (tuple(uint256 id, address borrower, uint256 amount, uint256 interestRate, uint256 issuedAt, uint256 dueAt, uint256 repaid, uint8 status, string reason))',
];

const TREASURY_POOL_ABI = [
  'function provideLiquidity(address loanEngine, uint256 amount) external',
  'function authorizedLoanEngines(address) external view returns (bool)',
  'function totalLiquidity() external view returns (uint256)',
  'function totalUtilized() external view returns (uint256)',
];

export class LoanController {
  // POST /api/loan/request
  async requestLoan(req: Request, res: Response): Promise<void> {
    try {
      const { borrower, amount, reason, duration } = req.body;

      if (!borrower || !amount) {
        res.status(400).json({
          success: false,
          error: 'Borrower address and amount are required',
        });
        return;
      }

      const normalizedAddress = borrower.toLowerCase();

      // Check if user exists
      const user = await User.findOne({ address: normalizedAddress });
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found. Please create account first.',
        });
        return;
      }

      // Get next loan ID
      const lastLoan = await Loan.findOne().sort({ loanId: -1 });
      const nextLoanId = lastLoan ? lastLoan.loanId + 1 : 1;

      // Create loan request
      const loan = await Loan.create({
        loanId: nextLoanId,
        borrower: normalizedAddress,
        amount,
        reason,
        duration: duration || 7, // Default to 7 days if not provided
        status: LoanStatus.REQUESTED,
        repaidAmount: 0,
      });

      logger.info('Loan requested', {
        loanId: loan.loanId,
        borrower: normalizedAddress,
        amount,
      });

      // ✅ AUTOMATICALLY TRIGGER AUTO-APPROVAL
      // This runs in the background, don't wait for it
      this.triggerAutoApproval(loan.loanId).catch(error => {
        logger.error('Auto-approval failed:', error);
      });

      res.json({
        success: true,
        data: loan,
      });
    } catch (error) {
      logger.error('Error requesting loan:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Helper function to trigger auto-approval in the background
  private async triggerAutoApproval(loanId: number): Promise<void> {
    try {
      logger.info('Triggering auto-approval for loan:', { loanId });

      // Wait a bit for the loan to be fully committed to DB
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get loan
      const loan = await Loan.findOne({ loanId });
      if (!loan || loan.status !== LoanStatus.REQUESTED) {
        logger.warn('Loan not found or not in REQUESTED status', { loanId });
        return;
      }

      // Get user for credit score
      const user = await User.findOne({ address: loan.borrower });
      if (!user) {
        logger.error('User not found for auto-approval', { borrower: loan.borrower });
        return;
      }

      // Check eligibility using screening rules (matching screeningAgent.ts)
      const creditScore = user.creditScore;
      const amount = loan.amount;

      const MIN_CREDIT_SCORE_TIER1 = 700;
      const MIN_CREDIT_SCORE_TIER2 = 600;
      const MIN_CREDIT_SCORE_TIER3 = 500;
      const MAX_LOAN_AMOUNT = 50000; // USDC (without decimals, stored as number)
      const BASE_INTEREST_RATE = 500; // 5%

      let eligible = false;
      let interestRate = 1000; // 10% default
      let maxLoanForScore = 0;

      if (creditScore >= MIN_CREDIT_SCORE_TIER1) {
        // Tier 1 (Excellent): 5% interest
        eligible = true;
        interestRate = BASE_INTEREST_RATE; // 5%
        maxLoanForScore = MAX_LOAN_AMOUNT;
      } else if (creditScore >= MIN_CREDIT_SCORE_TIER2) {
        // Tier 2 (Good): 7% interest
        eligible = true;
        interestRate = BASE_INTEREST_RATE + 200; // 7%
        maxLoanForScore = Math.floor(MAX_LOAN_AMOUNT * 0.6); // 60% of max
      } else if (creditScore >= MIN_CREDIT_SCORE_TIER3) {
        // Tier 3 (Fair): 10% interest
        eligible = true;
        interestRate = BASE_INTEREST_RATE + 500; // 10%
        maxLoanForScore = Math.floor(MAX_LOAN_AMOUNT * 0.3); // 30% of max
      }

      // Check if amount is within tier limits
      if (!eligible || amount > maxLoanForScore) {
        logger.info('Loan not eligible for auto-approval', {
          loanId,
          creditScore,
          amount,
          maxLoanForScore,
          reason: !eligible ? 'Credit score too low' : 'Amount exceeds tier limit',
        });
        return;
      }

      // Connect to blockchain
      const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
      const ARC_RPC_URL = process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network';
      const LOAN_ENGINE_ADDRESS =
        process.env.LOAN_ENGINE_ADDRESS || '0xc578E1fe90922664fF10913696d2b44Dfc135295';
      const TREASURY_POOL_ADDRESS =
        process.env.TREASURY_POOL_ADDRESS || '0xE462717d56fF402B19B6f6dA931811f6714715c1';

      if (!AGENT_PRIVATE_KEY) {
        throw new Error('AGENT_PRIVATE_KEY not configured');
      }

      const provider = new ethers.JsonRpcProvider(ARC_RPC_URL);
      const agentWallet = new ethers.Wallet(AGENT_PRIVATE_KEY, provider);
      const loanEngine = new ethers.Contract(LOAN_ENGINE_ADDRESS, LOAN_ENGINE_ABI, agentWallet);
      const treasuryPool = new ethers.Contract(
        TREASURY_POOL_ADDRESS,
        TREASURY_POOL_ABI,
        agentWallet
      );

      logger.info('Auto-approving loan on blockchain', {
        loanId,
        amount,
        interestRate,
      });

      // Step 1: Provide liquidity from TreasuryPool to LoanEngine
      // Convert amount to wei (6 decimals for USDC)
      const amountInWei = ethers.parseUnits(amount.toString(), 6);

      logger.info('Providing liquidity from TreasuryPool', {
        loanId,
        amount,
        amountInWei: amountInWei.toString(),
      });

      try {
        const liquidityTx = await treasuryPool.provideLiquidity(LOAN_ENGINE_ADDRESS, amountInWei);
        await liquidityTx.wait();
        logger.info('Liquidity provided to LoanEngine', {
          loanId,
          txHash: liquidityTx.hash,
        });
      } catch (error) {
        logger.error('Failed to provide liquidity:', error);
        throw new Error(
          'Failed to provide liquidity from TreasuryPool. Ensure TreasuryPool has sufficient funds and agent has TREASURY_AGENT role.'
        );
      }

      // Step 2: Approve loan on blockchain (this will auto-disburse)
      const approveTx = await loanEngine.approveLoan(loan.loanId, interestRate);
      await approveTx.wait();
      logger.info('Loan approved and disbursed on blockchain', { loanId, txHash: approveTx.hash });

      // Step 2: Update database
      loan.status = LoanStatus.DISBURSED;
      loan.interestRate = interestRate;
      loan.txHash = approveTx.hash;
      loan.issuedAt = Math.floor(Date.now() / 1000); // Unix timestamp

      // Use the duration from the loan request (default to 7 days if not set)
      const durationInDays = loan.duration || 7;
      loan.dueAt = Math.floor(Date.now() / 1000) + durationInDays * 24 * 60 * 60;

      await loan.save();

      logger.info('✅ Auto-approval completed successfully', {
        loanId,
        durationInDays,
        dueAt: new Date(loan.dueAt * 1000).toISOString(),
      });
    } catch (error) {
      logger.error('Error in auto-approval:', error);
      throw error;
    }
  }

  // GET /api/loan/:loanId
  async getLoan(req: Request, res: Response): Promise<void> {
    try {
      const { loanId } = req.params;

      const loan = await Loan.findOne({ loanId: parseInt(loanId) });

      if (!loan) {
        res.status(404).json({
          success: false,
          error: 'Loan not found',
        });
        return;
      }

      res.json({
        success: true,
        data: loan,
      });
    } catch (error) {
      logger.error('Error getting loan:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // GET /api/loan/user/:address
  async getUserLoans(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const normalizedAddress = address.toLowerCase();

      const loans = await Loan.find({ borrower: normalizedAddress }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: loans,
      });
    } catch (error) {
      logger.error('Error getting user loans:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // PUT /api/loan/:loanId/approve
  async approveLoan(req: Request, res: Response): Promise<void> {
    try {
      const { loanId } = req.params;
      const { interestRate, txHash } = req.body;

      if (interestRate === undefined) {
        res.status(400).json({
          success: false,
          error: 'Interest rate is required',
        });
        return;
      }

      const loan = await Loan.findOne({ loanId: parseInt(loanId) });

      if (!loan) {
        res.status(404).json({
          success: false,
          error: 'Loan not found',
        });
        return;
      }

      if (loan.status !== LoanStatus.REQUESTED) {
        res.status(400).json({
          success: false,
          error: 'Loan is not in requested status',
        });
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const dueDate = now + 90 * 24 * 60 * 60; // 90 days from now

      loan.status = LoanStatus.APPROVED;
      loan.interestRate = interestRate;
      loan.issuedAt = now;
      loan.dueAt = dueDate;
      loan.txHash = txHash;
      await loan.save();

      logger.info('Loan approved', {
        loanId: loan.loanId,
        borrower: loan.borrower,
        interestRate,
      });

      res.json({
        success: true,
        data: loan,
      });
    } catch (error) {
      logger.error('Error approving loan:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // PUT /api/loan/:loanId/disburse
  async disburseLoan(req: Request, res: Response): Promise<void> {
    try {
      const { loanId } = req.params;
      const { txHash } = req.body;

      const loan = await Loan.findOne({ loanId: parseInt(loanId) });

      if (!loan) {
        res.status(404).json({
          success: false,
          error: 'Loan not found',
        });
        return;
      }

      if (loan.status !== LoanStatus.APPROVED) {
        res.status(400).json({
          success: false,
          error: 'Loan is not approved',
        });
        return;
      }

      loan.status = LoanStatus.DISBURSED;
      if (txHash) loan.txHash = txHash;
      await loan.save();

      logger.info('Loan disbursed', {
        loanId: loan.loanId,
        borrower: loan.borrower,
      });

      res.json({
        success: true,
        data: loan,
      });
    } catch (error) {
      logger.error('Error disbursing loan:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // POST /api/loan/repayment
  async recordRepayment(req: Request, res: Response): Promise<void> {
    try {
      const { loanId, amount, txHash } = req.body;

      logger.info('📥 Received repayment request', {
        loanId,
        amount,
        txHash,
      });

      if (!loanId || !amount) {
        res.status(400).json({
          success: false,
          error: 'Loan ID and amount are required',
        });
        return;
      }

      const loan = await Loan.findOne({ loanId: parseInt(loanId) });

      if (!loan) {
        logger.error('❌ Loan not found', { loanId });
        res.status(404).json({
          success: false,
          error: 'Loan not found',
        });
        return;
      }

      logger.info('📊 Current loan state BEFORE repayment', {
        loanId: loan.loanId,
        amount: loan.amount,
        interestRate: loan.interestRate,
        repaidAmount: loan.repaidAmount,
        status: loan.status,
      });

      // Update repaid amount
      const previousRepaidAmount = loan.repaidAmount;
      loan.repaidAmount += amount;
      if (txHash) loan.txHash = txHash;

      // Calculate total owed (principal + interest)
      const totalOwed = loan.amount + (loan.amount * loan.interestRate) / 10000;

      logger.info('💰 Repayment calculation', {
        loanId: loan.loanId,
        loanAmount: loan.amount,
        interestRate: loan.interestRate,
        totalOwed,
        previousRepaidAmount,
        newRepaymentAmount: amount,
        totalRepaidAmount: loan.repaidAmount,
        isFullyRepaid: loan.repaidAmount >= totalOwed,
      });

      // Check if fully repaid
      if (loan.repaidAmount >= totalOwed) {
        loan.status = LoanStatus.REPAID;
        loan.repaidAt = Math.floor(Date.now() / 1000);

        logger.info('✅ Loan FULLY REPAID - updating status', {
          loanId: loan.loanId,
          newStatus: LoanStatus.REPAID,
          repaidAt: loan.repaidAt,
        });

        // Update user credit score based on repayment timing
        if (loan.dueAt && loan.repaidAt <= loan.dueAt) {
          // On-time repayment
          await User.findOneAndUpdate(
            { address: loan.borrower },
            { $inc: { creditScore: 50, xp: 100 } }
          );
          logger.info('⭐ Credit score increased: +50 (on-time repayment)');
        } else {
          // Late repayment
          await User.findOneAndUpdate(
            { address: loan.borrower },
            { $inc: { creditScore: 10, xp: 50 } }
          );
          logger.info('⭐ Credit score increased: +10 (late repayment)');
        }
      } else {
        logger.info('📝 Partial repayment recorded', {
          loanId: loan.loanId,
          totalRepaid: loan.repaidAmount,
          remaining: totalOwed - loan.repaidAmount,
          status: loan.status,
        });
      }

      await loan.save();

      logger.info('Repayment recorded', {
        loanId: loan.loanId,
        amount,
        totalRepaid: loan.repaidAmount,
        status: loan.status,
      });

      res.json({
        success: true,
        data: loan,
      });
    } catch (error) {
      logger.error('Error recording repayment:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // PUT /api/loan/:loanId/default
  async markAsDefaulted(req: Request, res: Response): Promise<void> {
    try {
      const { loanId } = req.params;

      const loan = await Loan.findOne({ loanId: parseInt(loanId) });

      if (!loan) {
        res.status(404).json({
          success: false,
          error: 'Loan not found',
        });
        return;
      }

      loan.status = LoanStatus.DEFAULTED;
      await loan.save();

      // Reduce credit score significantly
      await User.findOneAndUpdate({ address: loan.borrower }, { $inc: { creditScore: -200 } });

      logger.info('Loan marked as defaulted', {
        loanId: loan.loanId,
        borrower: loan.borrower,
      });

      res.json({
        success: true,
        data: loan,
      });
    } catch (error) {
      logger.error('Error marking loan as defaulted:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // GET /api/loan/pending
  async getPendingLoans(req: Request, res: Response): Promise<void> {
    try {
      const loans = await Loan.find({
        status: LoanStatus.REQUESTED,
      }).sort({ createdAt: 1 });

      res.json({
        success: true,
        data: loans,
      });
    } catch (error) {
      logger.error('Error getting pending loans:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // POST /api/loan/:loanId/auto-approve
  // Automatically approve and disburse loan based on rules
  async autoApproveLoan(req: Request, res: Response): Promise<void> {
    try {
      const { loanId } = req.params;

      // Get loan
      const loan = await Loan.findOne({ loanId: parseInt(loanId) });
      if (!loan) {
        res.status(404).json({
          success: false,
          error: 'Loan not found',
        });
        return;
      }

      // Check if already approved
      if (loan.status !== LoanStatus.REQUESTED) {
        res.status(400).json({
          success: false,
          error: `Loan already ${loan.status}`,
        });
        return;
      }

      // Get user for credit score
      const user = await User.findOne({ address: loan.borrower });
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Check eligibility using screening rules (matching screeningAgent.ts)
      const creditScore = user.creditScore;
      const amount = loan.amount;

      const MIN_CREDIT_SCORE_TIER1 = 700;
      const MIN_CREDIT_SCORE_TIER2 = 600;
      const MIN_CREDIT_SCORE_TIER3 = 500;
      const MAX_LOAN_AMOUNT = 50000; // USDC (without decimals)
      const BASE_INTEREST_RATE = 500; // 5%

      let eligible = false;
      let interestRate = 1000; // 10% default
      let maxLoanForScore = 0;

      if (creditScore >= MIN_CREDIT_SCORE_TIER1) {
        // Tier 1 (Excellent): 5% interest
        eligible = true;
        interestRate = BASE_INTEREST_RATE; // 5%
        maxLoanForScore = MAX_LOAN_AMOUNT;
      } else if (creditScore >= MIN_CREDIT_SCORE_TIER2) {
        // Tier 2 (Good): 7% interest
        eligible = true;
        interestRate = BASE_INTEREST_RATE + 200; // 7%
        maxLoanForScore = Math.floor(MAX_LOAN_AMOUNT * 0.6); // 60% of max
      } else if (creditScore >= MIN_CREDIT_SCORE_TIER3) {
        // Tier 3 (Fair): 10% interest
        eligible = true;
        interestRate = BASE_INTEREST_RATE + 500; // 10%
        maxLoanForScore = Math.floor(MAX_LOAN_AMOUNT * 0.3); // 30% of max
      }

      // Check if amount is within tier limits
      if (!eligible || amount > maxLoanForScore) {
        res.status(400).json({
          success: false,
          error: 'Loan does not meet eligibility criteria',
          details: {
            creditScore,
            amount,
            maxLoanForScore,
            required: !eligible
              ? `Credit score too low (minimum: ${MIN_CREDIT_SCORE_TIER3})`
              : `Amount exceeds tier limit ($${maxLoanForScore})`,
          },
        });
        return;
      }

      // Connect to blockchain
      const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
      const ARC_RPC_URL = process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network';
      const LOAN_ENGINE_ADDRESS =
        process.env.LOAN_ENGINE_ADDRESS || '0xc578E1fe90922664fF10913696d2b44Dfc135295';
      const TREASURY_POOL_ADDRESS =
        process.env.TREASURY_POOL_ADDRESS || '0xE462717d56fF402B19B6f6dA931811f6714715c1';

      if (!AGENT_PRIVATE_KEY) {
        throw new Error('AGENT_PRIVATE_KEY not configured');
      }

      const provider = new ethers.JsonRpcProvider(ARC_RPC_URL);
      const agentWallet = new ethers.Wallet(AGENT_PRIVATE_KEY, provider);
      const loanEngine = new ethers.Contract(LOAN_ENGINE_ADDRESS, LOAN_ENGINE_ABI, agentWallet);
      const treasuryPool = new ethers.Contract(
        TREASURY_POOL_ADDRESS,
        TREASURY_POOL_ABI,
        agentWallet
      );

      logger.info('Auto-approving loan', {
        loanId: loan.loanId,
        borrower: loan.borrower,
        amount,
        interestRate,
      });

      // Step 1: Provide liquidity from TreasuryPool to LoanEngine
      const amountInWei = ethers.parseUnits(amount.toString(), 6);

      try {
        const liquidityTx = await treasuryPool.provideLiquidity(LOAN_ENGINE_ADDRESS, amountInWei);
        await liquidityTx.wait();
        logger.info('Liquidity provided to LoanEngine', { txHash: liquidityTx.hash });
      } catch (error) {
        logger.error('Failed to provide liquidity:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to provide liquidity from TreasuryPool',
          details: (error as Error).message,
        });
        return;
      }

      // Step 2: Approve loan on blockchain (this will auto-disburse)
      const approveTx = await loanEngine.approveLoan(loan.loanId, interestRate);
      await approveTx.wait();
      logger.info('Loan approved and disbursed on blockchain', { txHash: approveTx.hash });

      // Step 3: Update database
      loan.status = LoanStatus.DISBURSED;
      loan.interestRate = interestRate;
      loan.txHash = approveTx.hash;
      loan.issuedAt = Math.floor(Date.now() / 1000); // Unix timestamp

      // Use the duration from the loan request (default to 7 days if not set)
      const durationInDays = loan.duration || 7;
      loan.dueAt = Math.floor(Date.now() / 1000) + durationInDays * 24 * 60 * 60;

      await loan.save();

      res.json({
        success: true,
        data: {
          loan,
          approveTxHash: approveTx.hash,
        },
        message: 'Loan automatically approved and disbursed',
      });
    } catch (error) {
      logger.error('Error auto-approving loan:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to auto-approve loan',
        details: (error as Error).message,
      });
    }
  }
}

export const loanController = new LoanController();
