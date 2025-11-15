import { Request, Response } from 'express';
import { ethers } from 'ethers';
import Treasury from '../models/Treasury';
import Loan, { LoanStatus } from '../models/Loan';
import User from '../models/User';
import { logger } from '../utils/logger';

const TREASURY_POOL_ABI = [
  'function createAllocation(string name, uint256 percentage, address destination) external returns (uint256)',
  'function executeAllocations() external',
  'function scheduleDistribution(address[] recipients, uint256[] amounts, uint256 frequency) external returns (uint256)',
  'function executeDistributions() external',
  'function allocations(uint256) external view returns (string, uint256, address, uint256, uint256, bool)',
  'function getAllocation(uint256) external view returns (tuple(string name, uint256 percentage, address destination, uint256 allocated, uint256 spent, bool active))',
  'function getDistribution(uint256) external view returns (tuple(address[] recipients, uint256[] amounts, uint256 frequency, uint256 lastExecuted, bool active))',
  'function allocationCount() external view returns (uint256)',
  'function distributionCount() external view returns (uint256)',
  'function deactivateAllocation(uint256) external',
  'function deactivateDistribution(uint256) external',
];

export class TreasuryController {
  // Helper to add delay between RPC calls
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // GET /api/treasury/metrics
  async getMetrics(_req: Request, res: Response): Promise<void> {
    try {
      let treasury = await Treasury.findOne();

      if (!treasury) {
        // Initialize treasury if not exists
        treasury = await Treasury.create({
          totalLiquidity: 0,
          utilization: 0,
          outstandingLoans: 0,
          defaultRate: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalRepayments: 0,
        });
      }

      // Calculate real-time metrics from loans
      const activeLoans = await Loan.find({
        status: { $in: [LoanStatus.DISBURSED] },
      });

      const outstandingAmount = activeLoans.reduce((sum, loan) => {
        const totalOwed = loan.amount + (loan.amount * loan.interestRate) / 10000;
        return sum + (totalOwed - loan.repaidAmount);
      }, 0);

      const allLoans = await Loan.find();
      const totalDisbursed = allLoans
        .filter(l => l.status !== LoanStatus.REQUESTED && l.status !== LoanStatus.CANCELLED)
        .reduce((sum, loan) => sum + loan.amount, 0);

      const defaultedLoans = allLoans.filter(l => l.status === LoanStatus.DEFAULTED);
      const defaultedAmount = defaultedLoans.reduce((sum, loan) => sum + loan.amount, 0);

      const defaultRate = totalDisbursed > 0 ? defaultedAmount / totalDisbursed : 0;
      const utilization =
        treasury.totalLiquidity > 0 ? outstandingAmount / treasury.totalLiquidity : 0;

      // Update treasury with calculated values
      treasury.outstandingLoans = outstandingAmount;
      treasury.defaultRate = defaultRate;
      treasury.utilization = utilization;
      await treasury.save();

      res.json({
        success: true,
        data: {
          totalLiquidity: treasury.totalLiquidity,
          utilization: treasury.utilization,
          outstandingLoans: treasury.outstandingLoans,
          defaultRate: treasury.defaultRate,
          totalDeposits: treasury.totalDeposits,
          totalWithdrawals: treasury.totalWithdrawals,
          totalRepayments: treasury.totalRepayments,
          availableLiquidity: treasury.totalLiquidity - outstandingAmount,
          metrics: {
            totalLoans: allLoans.length,
            activeLoans: activeLoans.length,
            completedLoans: allLoans.filter(l => l.status === LoanStatus.REPAID).length,
            defaultedLoans: defaultedLoans.length,
            totalDisbursed,
            defaultedAmount,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting treasury metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // POST /api/treasury/deposit
  async recordDeposit(req: Request, res: Response): Promise<void> {
    try {
      const { amount, txHash, address } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid amount is required',
        });
        return;
      }

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'User address is required',
        });
        return;
      }

      // Update treasury totals
      let treasury = await Treasury.findOne();

      if (!treasury) {
        treasury = await Treasury.create({
          totalLiquidity: amount,
          utilization: 0,
          outstandingLoans: 0,
          defaultRate: 0,
          totalDeposits: amount,
          totalWithdrawals: 0,
          totalRepayments: 0,
        });
      } else {
        treasury.totalLiquidity += amount;
        treasury.totalDeposits += amount;
        await treasury.save();
      }

      // Update user's deposit balance
      const user = await User.findOne({ address: address.toLowerCase() });
      if (user) {
        user.treasuryDeposits = (user.treasuryDeposits || 0) + amount;
        await user.save();
        logger.info('User deposit updated', {
          address,
          amount,
          totalDeposits: user.treasuryDeposits,
        });
      } else {
        logger.warn('User not found for deposit', { address });
      }

      logger.info('Deposit recorded', { amount, txHash, address });

      res.json({
        success: true,
        data: {
          treasury,
          userDeposits: user?.treasuryDeposits || 0,
        },
      });
    } catch (error) {
      logger.error('Error recording deposit:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // POST /api/treasury/withdrawal
  async recordWithdrawal(req: Request, res: Response): Promise<void> {
    try {
      const { amount, txHash, address } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid amount is required',
        });
        return;
      }

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'User address is required',
        });
        return;
      }

      const treasury = await Treasury.findOne();

      if (!treasury) {
        res.status(404).json({
          success: false,
          error: 'Treasury not found',
        });
        return;
      }

      treasury.totalLiquidity -= amount;
      treasury.totalWithdrawals += amount;
      await treasury.save();

      // Update user's deposit balance
      const user = await User.findOne({ address: address.toLowerCase() });
      if (user) {
        user.treasuryDeposits = Math.max(0, (user.treasuryDeposits || 0) - amount);
        await user.save();
        logger.info('User withdrawal updated', {
          address,
          amount,
          remainingDeposits: user.treasuryDeposits,
        });
      } else {
        logger.warn('User not found for withdrawal', { address });
      }

      logger.info('Withdrawal recorded', { amount, txHash, address });

      res.json({
        success: true,
        data: {
          treasury,
          userDeposits: user?.treasuryDeposits || 0,
        },
      });
    } catch (error) {
      logger.error('Error recording withdrawal:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // POST /api/treasury/repayment
  async recordRepayment(req: Request, res: Response): Promise<void> {
    try {
      const { amount, txHash } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid amount is required',
        });
        return;
      }

      const treasury = await Treasury.findOne();

      if (!treasury) {
        res.status(404).json({
          success: false,
          error: 'Treasury not found',
        });
        return;
      }

      treasury.totalRepayments += amount;
      await treasury.save();

      logger.info('Repayment to treasury recorded', { amount, txHash });

      res.json({
        success: true,
        data: treasury,
      });
    } catch (error) {
      logger.error('Error recording repayment:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // POST /api/treasury/allocation - Create budget allocation
  async createAllocation(req: Request, res: Response): Promise<void> {
    try {
      const { name, percentage, destination } = req.body;

      if (!name || !percentage || !destination) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, percentage, destination',
        });
        return;
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
      const treasuryPool = new ethers.Contract(
        process.env.TREASURY_POOL_ADDRESS!,
        TREASURY_POOL_ABI,
        agentWallet
      );

      logger.info('Creating allocation', { name, percentage, destination });

      // Convert percentage to basis points (e.g., 70% = 7000)
      const percentageBP = Math.floor(percentage * 100);

      const tx = await treasuryPool.createAllocation(name, percentageBP, destination);
      const receipt = await tx.wait();

      logger.info('Allocation created', { txHash: receipt.hash });

      res.json({
        success: true,
        txHash: receipt.hash,
        data: {
          name,
          percentage,
          destination,
        },
      });
    } catch (error: any) {
      logger.error('Error creating allocation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create allocation',
      });
    }
  }

  // POST /api/treasury/execute-allocations - Execute all allocations
  async executeAllocations(_req: Request, res: Response): Promise<void> {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
      const treasuryPool = new ethers.Contract(
        process.env.TREASURY_POOL_ADDRESS!,
        TREASURY_POOL_ABI,
        agentWallet
      );

      logger.info('Executing allocations');

      const tx = await treasuryPool.executeAllocations();
      const receipt = await tx.wait();

      logger.info('Allocations executed', { txHash: receipt.hash });

      res.json({
        success: true,
        txHash: receipt.hash,
      });
    } catch (error: any) {
      logger.error('Error executing allocations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute allocations',
      });
    }
  }

  // POST /api/treasury/schedule-distribution - Schedule payroll
  async scheduleDistribution(req: Request, res: Response): Promise<void> {
    try {
      const { recipients, amounts, frequency } = req.body;

      if (!recipients || !amounts || !frequency) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: recipients, amounts, frequency',
        });
        return;
      }

      if (recipients.length !== amounts.length) {
        res.status(400).json({
          success: false,
          error: 'Recipients and amounts arrays must have the same length',
        });
        return;
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
      const treasuryPool = new ethers.Contract(
        process.env.TREASURY_POOL_ADDRESS!,
        TREASURY_POOL_ABI,
        agentWallet
      );

      logger.info('Scheduling distribution', { recipients, amounts, frequency });

      // Convert amounts to wei (assuming USDC with 6 decimals)
      const amountsWei = amounts.map((a: number) => ethers.parseUnits(a.toString(), 6));

      const tx = await treasuryPool.scheduleDistribution(recipients, amountsWei, frequency);
      const receipt = await tx.wait();

      logger.info('Distribution scheduled', { txHash: receipt.hash });

      res.json({
        success: true,
        txHash: receipt.hash,
        data: {
          recipients,
          amounts,
          frequency,
        },
      });
    } catch (error: any) {
      logger.error('Error scheduling distribution:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to schedule distribution',
      });
    }
  }

  // POST /api/treasury/execute-distributions - Execute due distributions
  async executeDistributions(_req: Request, res: Response): Promise<void> {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
      const treasuryPool = new ethers.Contract(
        process.env.TREASURY_POOL_ADDRESS!,
        TREASURY_POOL_ABI,
        agentWallet
      );

      logger.info('Executing distributions');

      const tx = await treasuryPool.executeDistributions();
      const receipt = await tx.wait();

      logger.info('Distributions executed', { txHash: receipt.hash });

      res.json({
        success: true,
        txHash: receipt.hash,
      });
    } catch (error: any) {
      logger.error('Error executing distributions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute distributions',
      });
    }
  }

  // GET /api/treasury/allocations - Get all allocations
  async getAllocations(_req: Request, res: Response): Promise<void> {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const treasuryPool = new ethers.Contract(
        process.env.TREASURY_POOL_ADDRESS!,
        TREASURY_POOL_ABI,
        provider
      );

      const count = await treasuryPool.allocationCount();
      const allocations = [];

      for (let i = 1; i <= count; i++) {
        const alloc = await treasuryPool.getAllocation(i);
        allocations.push({
          id: i,
          name: alloc.name,
          percentage: Number(alloc.percentage) / 100, // Convert from basis points
          destination: alloc.destination,
          allocated: Number(ethers.formatUnits(alloc.allocated, 6)),
          spent: Number(ethers.formatUnits(alloc.spent, 6)),
          active: alloc.active,
        });
        // Add small delay to avoid rate limiting
        if (i < count) await this.delay(100);
      }

      res.json({
        success: true,
        data: allocations,
      });
    } catch (error: any) {
      logger.error('Error getting allocations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get allocations',
      });
    }
  }

  // GET /api/treasury/distributions - Get all distributions
  async getDistributions(_req: Request, res: Response): Promise<void> {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const treasuryPool = new ethers.Contract(
        process.env.TREASURY_POOL_ADDRESS!,
        TREASURY_POOL_ABI,
        provider
      );

      const count = await treasuryPool.distributionCount();
      const distributions = [];

      for (let i = 1; i <= count; i++) {
        const dist = await treasuryPool.getDistribution(i);
        const now = Math.floor(Date.now() / 1000);
        const nextDue = Number(dist.lastExecuted) + Number(dist.frequency);

        distributions.push({
          id: i,
          recipients: dist.recipients,
          amounts: dist.amounts.map((a: bigint) => Number(ethers.formatUnits(a, 6))),
          frequency: Number(dist.frequency),
          lastExecuted: Number(dist.lastExecuted),
          nextDue: nextDue,
          daysUntilNext: Math.floor((nextDue - now) / (24 * 60 * 60)),
          active: dist.active,
        });
        // Add small delay to avoid rate limiting
        if (i < count) await this.delay(100);
      }

      res.json({
        success: true,
        data: distributions,
      });
    } catch (error: any) {
      logger.error('Error getting distributions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get distributions',
      });
    }
  }
}

export const treasuryController = new TreasuryController();
