import { Request, Response } from 'express';
import Treasury from '../models/Treasury';
import Loan, { LoanStatus } from '../models/Loan';
import User from '../models/User';
import { logger } from '../utils/logger';

export class TreasuryController {
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
}

export const treasuryController = new TreasuryController();
