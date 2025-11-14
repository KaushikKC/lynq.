import { Request, Response } from 'express';
import { screeningAgent } from '../services/screeningAgent';
import { logger } from '../utils/logger';

export class ScreeningController {
  // GET /api/screening/eligibility
  async checkEligibility(req: Request, res: Response): Promise<void> {
    try {
      const { address, amount } = req.query;

      if (!address || !amount) {
        res.status(400).json({
          success: false,
          error: 'Address and amount are required',
        });
        return;
      }

      const result = await screeningAgent.checkEligibility({
        address: address as string,
        amount: parseFloat(amount as string),
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error checking eligibility:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // GET /api/screening/recommended-amount
  async getRecommendedAmount(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.query;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address is required',
        });
        return;
      }

      const recommendedAmount = await screeningAgent.calculateRecommendedAmount(
        address as string
      );

      res.json({
        success: true,
        data: {
          recommendedAmount,
        },
      });
    } catch (error) {
      logger.error('Error getting recommended amount:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

export const screeningController = new ScreeningController();

