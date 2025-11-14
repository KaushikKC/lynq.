import { Request, Response } from 'express';
import Event, { EventType } from '../models/Event';
import { logger } from '../utils/logger';

export class HistoryController {
  // GET /api/history
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { address, eventType, limit = '50', skip = '0' } = req.query;

      const query: any = {};

      if (address) {
        query.address = (address as string).toLowerCase();
      }

      if (eventType) {
        query.eventType = eventType;
      }

      const events = await Event.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string));

      const total = await Event.countDocuments(query);

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            total,
            limit: parseInt(limit as string),
            skip: parseInt(skip as string),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // POST /api/history/event
  async recordEvent(req: Request, res: Response): Promise<void> {
    try {
      const { eventType, transactionHash, blockNumber, address, data, timestamp } = req.body;

      if (!eventType || !transactionHash || !blockNumber || !address || !data) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      const event = await Event.create({
        eventType,
        transactionHash,
        blockNumber,
        address: address.toLowerCase(),
        data,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
      });

      logger.info('Event recorded', {
        eventType,
        transactionHash,
        address,
      });

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      logger.error('Error recording event:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // GET /api/history/stats
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await Promise.all([
        Event.countDocuments({ eventType: EventType.LOAN_REQUESTED }),
        Event.countDocuments({ eventType: EventType.LOAN_APPROVED }),
        Event.countDocuments({ eventType: EventType.LOAN_REPAID }),
        Event.countDocuments({ eventType: EventType.LOAN_DEFAULTED }),
        Event.countDocuments({ eventType: EventType.VERIFICATION_MINTED }),
      ]);

      res.json({
        success: true,
        data: {
          loansRequested: stats[0],
          loansApproved: stats[1],
          loansRepaid: stats[2],
          loansDefaulted: stats[3],
          verificationsMinted: stats[4],
        },
      });
    } catch (error) {
      logger.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

export const historyController = new HistoryController();

