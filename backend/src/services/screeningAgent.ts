import User from '../models/User';
import Loan, { LoanStatus } from '../models/Loan';
import { logger } from '../utils/logger';

export interface EligibilityRequest {
  address: string;
  amount: number;
}

export interface EligibilityResponse {
  eligible: boolean;
  approvedAmount: number;
  interestRate: number;
  reason: string;
  tier?: string;
}

export class ScreeningAgent {
  // Thresholds (in basis points for interest rates)
  private readonly MIN_CREDIT_SCORE_TIER1 = parseInt(process.env.MIN_CREDIT_SCORE_TIER1 || '700');
  private readonly MIN_CREDIT_SCORE_TIER2 = parseInt(process.env.MIN_CREDIT_SCORE_TIER2 || '600');
  private readonly MIN_CREDIT_SCORE_TIER3 = parseInt(process.env.MIN_CREDIT_SCORE_TIER3 || '500');
  private readonly BASE_INTEREST_RATE = parseInt(process.env.BASE_INTEREST_RATE || '500'); // 5%
  private readonly MAX_LOAN_AMOUNT = parseInt(process.env.MAX_LOAN_AMOUNT || '50000');

  async checkEligibility(request: EligibilityRequest): Promise<EligibilityResponse> {
    const { address, amount } = request;

    try {
      // Get user data
      const user = await User.findOne({ address: address.toLowerCase() });

      if (!user) {
        return {
          eligible: false,
          approvedAmount: 0,
          interestRate: 0,
          reason: 'User not found. Please register first.',
        };
      }

      // Check if user is verified
      if (!user.verificationSBT || user.verifiedMethods.length === 0) {
        return {
          eligible: false,
          approvedAmount: 0,
          interestRate: 0,
          reason: 'User not verified. Please complete verification first.',
        };
      }

      // Check for active loans
      const activeLoans = await Loan.find({
        borrower: address.toLowerCase(),
        status: {
          $in: [LoanStatus.APPROVED, LoanStatus.DISBURSED],
        },
      });

      if (activeLoans.length > 0) {
        return {
          eligible: false,
          approvedAmount: 0,
          interestRate: 0,
          reason: 'You have an active loan. Please repay your current loan before requesting a new one.',
        };
      }

      // Check amount limits
      if (amount > this.MAX_LOAN_AMOUNT) {
        return {
          eligible: false,
          approvedAmount: 0,
          interestRate: 0,
          reason: `Loan amount exceeds maximum limit of ${this.MAX_LOAN_AMOUNT} USDC`,
        };
      }

      // Get credit score
      const creditScore = user.creditScore;

      // Determine tier and interest rate based on credit score
      let tier: string;
      let interestRate: number;
      let maxLoanForScore: number;

      if (creditScore >= this.MIN_CREDIT_SCORE_TIER1) {
        tier = 'Tier 1 (Excellent)';
        interestRate = this.BASE_INTEREST_RATE; // 5%
        maxLoanForScore = this.MAX_LOAN_AMOUNT;
      } else if (creditScore >= this.MIN_CREDIT_SCORE_TIER2) {
        tier = 'Tier 2 (Good)';
        interestRate = this.BASE_INTEREST_RATE + 200; // 7%
        maxLoanForScore = Math.floor(this.MAX_LOAN_AMOUNT * 0.6); // 60% of max
      } else if (creditScore >= this.MIN_CREDIT_SCORE_TIER3) {
        tier = 'Tier 3 (Fair)';
        interestRate = this.BASE_INTEREST_RATE + 500; // 10%
        maxLoanForScore = Math.floor(this.MAX_LOAN_AMOUNT * 0.3); // 30% of max
      } else {
        return {
          eligible: false,
          approvedAmount: 0,
          interestRate: 0,
          reason: `Credit score too low (${creditScore}). Minimum required: ${this.MIN_CREDIT_SCORE_TIER3}`,
        };
      }

      // Check if requested amount is within tier limits
      if (amount > maxLoanForScore) {
        return {
          eligible: true,
          approvedAmount: maxLoanForScore,
          interestRate,
          reason: `Approved for ${maxLoanForScore} USDC (${tier}). Your credit score qualifies you for up to this amount.`,
          tier,
        };
      }

      // Apply bonuses for reputation factors
      let finalInterestRate = interestRate;
      
      // Referral bonus: -0.5% for every 5 referrals (max 2% discount)
      const referralDiscount = Math.min(Math.floor(user.referralCount / 5) * 50, 200);
      finalInterestRate = Math.max(finalInterestRate - referralDiscount, 300); // Minimum 3%

      // XP bonus: -0.1% for every 100 XP (max 1% discount)
      const xpDiscount = Math.min(Math.floor(user.xp / 100) * 10, 100);
      finalInterestRate = Math.max(finalInterestRate - xpDiscount, 300);

      logger.info('Eligibility check passed', {
        address,
        amount,
        creditScore,
        tier,
        interestRate: finalInterestRate,
      });

      return {
        eligible: true,
        approvedAmount: amount,
        interestRate: finalInterestRate,
        reason: `Approved! Your credit score (${creditScore}) qualifies you for ${tier} with ${(finalInterestRate / 100).toFixed(2)}% interest.`,
        tier,
      };
    } catch (error) {
      logger.error('Error checking eligibility:', error);
      return {
        eligible: false,
        approvedAmount: 0,
        interestRate: 0,
        reason: 'Error checking eligibility. Please try again later.',
      };
    }
  }

  async calculateRecommendedAmount(address: string): Promise<number> {
    try {
      const user = await User.findOne({ address: address.toLowerCase() });
      
      if (!user) {
        return 0;
      }

      const creditScore = user.creditScore;

      if (creditScore >= this.MIN_CREDIT_SCORE_TIER1) {
        return this.MAX_LOAN_AMOUNT;
      } else if (creditScore >= this.MIN_CREDIT_SCORE_TIER2) {
        return Math.floor(this.MAX_LOAN_AMOUNT * 0.6);
      } else if (creditScore >= this.MIN_CREDIT_SCORE_TIER3) {
        return Math.floor(this.MAX_LOAN_AMOUNT * 0.3);
      }

      return 0;
    } catch (error) {
      logger.error('Error calculating recommended amount:', error);
      return 0;
    }
  }
}

export const screeningAgent = new ScreeningAgent();

