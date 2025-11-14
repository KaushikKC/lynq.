import { Request, Response } from 'express';
import Loan, { LoanStatus } from '../models/Loan';
import User from '../models/User';
import { logger } from '../utils/logger';

export class LoanController {
  // POST /api/loan/request
  async requestLoan(req: Request, res: Response): Promise<void> {
    try {
      const { borrower, amount, reason } = req.body;

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
        status: LoanStatus.REQUESTED,
        repaidAmount: 0,
      });

      logger.info('Loan requested', {
        loanId: loan.loanId,
        borrower: normalizedAddress,
        amount,
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

      if (!loanId || !amount) {
        res.status(400).json({
          success: false,
          error: 'Loan ID and amount are required',
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

      loan.repaidAmount += amount;
      if (txHash) loan.txHash = txHash;

      // Calculate total owed
      const totalOwed = loan.amount + (loan.amount * loan.interestRate) / 10000;

      // Check if fully repaid
      if (loan.repaidAmount >= totalOwed) {
        loan.status = LoanStatus.REPAID;
        loan.repaidAt = Math.floor(Date.now() / 1000);

        // Update user credit score based on repayment timing
        if (loan.dueAt && loan.repaidAt <= loan.dueAt) {
          // On-time repayment
          await User.findOneAndUpdate(
            { address: loan.borrower },
            { $inc: { creditScore: 50, xp: 100 } }
          );
        } else {
          // Late repayment
          await User.findOneAndUpdate(
            { address: loan.borrower },
            { $inc: { creditScore: 10, xp: 50 } }
          );
        }
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
      await User.findOneAndUpdate(
        { address: loan.borrower },
        { $inc: { creditScore: -200 } }
      );

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
}

export const loanController = new LoanController();

