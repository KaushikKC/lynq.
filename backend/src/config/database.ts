import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lynq';

    // Connect to MongoDB (supports both local and Atlas URIs)
    // Atlas URI format: mongodb+srv://username:password@cluster.mongodb.net/database
    // Local URI format: mongodb://localhost:27017/database
    await mongoose.connect(mongoUri);

    const isAtlas = mongoUri.includes('mongodb+srv://');
    logger.info(`MongoDB connected successfully (${isAtlas ? 'Atlas' : 'Local'})`);
    logger.info(`Database: ${mongoose.connection.name}`);

    mongoose.connection.on('error', error => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    logger.error('Please check your MONGODB_URI in .env file');
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};
