import { Request, Response } from 'express';
import { createApp } from '../src/app';
import { connectDatabase } from '../src/config/database';
import { logger } from '../src/utils/logger';

// Initialize database connection (cached for serverless)
let dbConnected = false;
let appInstance: ReturnType<typeof createApp> | null = null;

const initializeApp = async () => {
  if (!dbConnected) {
    try {
      await connectDatabase();
      dbConnected = true;
      logger.info('Database connected');
    } catch (error) {
      logger.error('Database connection error:', error);
      throw error;
    }
  }

  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance;
};

// Export serverless function handler
export default async (req: Request, res: Response) => {
  try {
    // Initialize app and database connection
    const app = await initializeApp();

    // Handle the request
    return app(req, res);
  } catch (error) {
    logger.error('Serverless function error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
