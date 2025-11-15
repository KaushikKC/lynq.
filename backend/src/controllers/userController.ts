import { Request, Response } from 'express';
import User from '../models/User';
import Loan, { LoanStatus } from '../models/Loan';
import Event from '../models/Event';
import { logger } from '../utils/logger';

export class UserController {
  // GET /api/user/:address/summary
  async getUserSummary(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const normalizedAddress = address.toLowerCase();

      // Get user
      const user = await User.findOne({ address: normalizedAddress });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Get active loans
      const activeLoans = await Loan.find({
        borrower: normalizedAddress,
        status: {
          $in: [LoanStatus.APPROVED, LoanStatus.DISBURSED],
        },
      });

      // Get total borrowed
      const allLoans = await Loan.find({
        borrower: normalizedAddress,
      });

      const totalBorrowed = allLoans.reduce((sum, loan) => sum + loan.amount, 0);
      const totalRepaid = allLoans.reduce((sum, loan) => sum + loan.repaidAmount, 0);

      // Calculate outstanding balance
      const outstandingBalance = activeLoans.reduce((sum, loan) => {
        const totalOwed = loan.amount + (loan.amount * loan.interestRate) / 10000;
        return sum + (totalOwed - loan.repaidAmount);
      }, 0);

      res.json({
        success: true,
        data: {
          address: user.address,
          creditScore: user.creditScore,
          isVerified: user.verifiedMethods.length > 0,
          verifiedMethods: user.verifiedMethods,
          verificationSBT: user.verificationSBT,
          referralCount: user.referralCount,
          xp: user.xp,
          usdcBalance: user.usdcBalance || 0,
          treasuryDeposits: user.treasuryDeposits || 0,
          activeLoans: activeLoans.length,
          totalBorrowed,
          totalRepaid,
          outstandingBalance,
          loans: {
            active: activeLoans.length,
            completed: allLoans.filter(l => l.status === LoanStatus.REPAID).length,
            defaulted: allLoans.filter(l => l.status === LoanStatus.DEFAULTED).length,
            total: allLoans.length,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting user summary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // GET /api/user/:address/reputation
  async getUserReputation(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const normalizedAddress = address.toLowerCase();

      const user = await User.findOne({ address: normalizedAddress });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const loans = await Loan.find({ borrower: normalizedAddress }).sort({ createdAt: -1 });

      // Calculate payment history
      const onTimePayments = loans.filter(
        l => l.status === LoanStatus.REPAID && l.repaidAt && l.dueAt && l.repaidAt <= l.dueAt
      ).length;

      const latePayments = loans.filter(
        l => l.status === LoanStatus.REPAID && l.repaidAt && l.dueAt && l.repaidAt > l.dueAt
      ).length;

      const defaults = loans.filter(l => l.status === LoanStatus.DEFAULTED).length;

      // Calculate average repayment time
      const repaidLoans = loans.filter(
        l => l.status === LoanStatus.REPAID && l.issuedAt && l.repaidAt
      );

      let averageRepaymentTime = 0;
      if (repaidLoans.length > 0) {
        const totalTime = repaidLoans.reduce((sum, loan) => {
          return sum + ((loan.repaidAt || 0) - (loan.issuedAt || 0));
        }, 0);
        averageRepaymentTime = totalTime / repaidLoans.length;
      }

      // Get recent events
      const recentEvents = await Event.find({
        address: normalizedAddress,
      })
        .sort({ timestamp: -1 })
        .limit(10);

      res.json({
        success: true,
        data: {
          creditScore: user.creditScore,
          breakdown: {
            onTimePayments,
            latePayments,
            defaults,
            totalLoans: loans.length,
            averageRepaymentDays: Math.floor(averageRepaymentTime / 86400), // Convert to days
          },
          reputation: {
            xp: user.xp,
            referralCount: user.referralCount,
            verifiedMethods: user.verifiedMethods,
            memberSince: user.createdAt,
          },
          history: recentEvents.map(event => ({
            type: event.eventType,
            timestamp: event.timestamp,
            data: event.data,
            txHash: event.transactionHash,
          })),
        },
      });
    } catch (error) {
      logger.error('Error getting user reputation:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // POST /api/user/create
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { address, verificationSBT, verifiedMethods } = req.body;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address is required',
        });
        return;
      }

      const normalizedAddress = address.toLowerCase();

      // Check if user already exists
      let user = await User.findOne({ address: normalizedAddress });

      if (user) {
        // Update user
        if (verificationSBT) user.verificationSBT = verificationSBT;
        if (verifiedMethods) user.verifiedMethods = verifiedMethods;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          address: normalizedAddress,
          verificationSBT,
          verifiedMethods: verifiedMethods || [],
          creditScore: 500,
          referralCount: 0,
          xp: 0,
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // POST /api/user/:address/verification
  async saveVerification(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const { worldIDVerification, socialVerifications, verificationSBT } = req.body;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address is required',
        });
        return;
      }

      const normalizedAddress = address.toLowerCase();

      // Find or create user
      let user = await User.findOne({ address: normalizedAddress });

      if (!user) {
        user = await User.create({
          address: normalizedAddress,
          creditScore: 500,
          referralCount: 0,
          xp: 0,
        });
      }

      // Update World ID verification
      if (worldIDVerification) {
        user.worldIDVerification = {
          verified: worldIDVerification.verified || false,
          verificationLevel: worldIDVerification.verificationLevel,
          proof: worldIDVerification.proof,
          verifiedAt: worldIDVerification.verifiedAt
            ? new Date(worldIDVerification.verifiedAt)
            : new Date(),
          action: worldIDVerification.action,
          signal: worldIDVerification.signal,
        };

        // Add to verifiedMethods if not already present
        if (worldIDVerification.verified && !user.verifiedMethods.includes('worldid')) {
          user.verifiedMethods.push('worldid');
        }
      }

      // Update social verifications
      if (socialVerifications && Array.isArray(socialVerifications)) {
        // Merge with existing social verifications
        const existingPlatforms = new Set(user.socialVerifications?.map(s => s.platform) || []);

        socialVerifications.forEach((social: any) => {
          const existingIndex = user.socialVerifications?.findIndex(
            s => s.platform === social.platform
          );

          if (existingIndex !== undefined && existingIndex >= 0 && user.socialVerifications) {
            // Update existing
            user.socialVerifications[existingIndex] = {
              platform: social.platform,
              username: social.username,
              accountId: social.accountId,
              email: social.email,
              verifiedAt: social.verifiedAt ? new Date(social.verifiedAt) : new Date(),
            };
          } else {
            // Add new
            if (!user.socialVerifications) {
              user.socialVerifications = [];
            }
            user.socialVerifications.push({
              platform: social.platform,
              username: social.username,
              accountId: social.accountId,
              email: social.email,
              verifiedAt: social.verifiedAt ? new Date(social.verifiedAt) : new Date(),
            });
          }

          // Add to verifiedMethods if not already present
          if (!user.verifiedMethods.includes(social.platform)) {
            user.verifiedMethods.push(social.platform);
          }
        });
      }

      // Update verification SBT
      if (verificationSBT) {
        user.verificationSBT = verificationSBT;
      }

      await user.save();

      logger.info('Verification data saved', {
        address: normalizedAddress,
        worldIDVerified: user.worldIDVerification?.verified,
        socialCount: user.socialVerifications?.length || 0,
      });

      res.json({
        success: true,
        data: {
          address: user.address,
          worldIDVerification: user.worldIDVerification,
          socialVerifications: user.socialVerifications,
          verificationSBT: user.verificationSBT,
          verifiedMethods: user.verifiedMethods,
        },
      });
    } catch (error) {
      logger.error('Error saving verification:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // GET /api/user/:address/verification
  async getVerification(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const normalizedAddress = address.toLowerCase();

      const user = await User.findOne({ address: normalizedAddress });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          address: user.address,
          worldIDVerification: user.worldIDVerification,
          socialVerifications: user.socialVerifications,
          verificationSBT: user.verificationSBT,
          verifiedMethods: user.verifiedMethods,
        },
      });
    } catch (error) {
      logger.error('Error getting verification:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // PUT /api/user/:address/credit-score
  async updateCreditScore(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const { creditScore } = req.body;

      if (creditScore === undefined || creditScore < 0 || creditScore > 1000) {
        res.status(400).json({
          success: false,
          error: 'Invalid credit score. Must be between 0 and 1000',
        });
        return;
      }

      const normalizedAddress = address.toLowerCase();

      const user = await User.findOneAndUpdate(
        { address: normalizedAddress },
        { creditScore },
        { new: true }
      );

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      logger.info('Credit score updated', { address: normalizedAddress, creditScore });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Error updating credit score:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

export const userController = new UserController();
