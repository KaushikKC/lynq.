/**
 * Debug endpoint to check RPC provider configuration
 */

import { Router } from 'express';
import { rpcProviderManager } from '../utils/rpcProvider';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/debug/rpc-providers - Check which RPC providers are configured
router.get('/rpc-providers', (_req, res) => {
  try {
    const providers = rpcProviderManager.getProviders();

    // Mask API keys for security
    const maskedProviders = providers.map((url, index) => {
      const masked = url.replace(/(\/v2\/|\/v3\/)[^/]+/g, (match: string) => {
        const parts = match.split('/');
        if (parts.length > 0 && parts[parts.length - 1].length > 10) {
          return match.substring(0, match.length - 10) + '***';
        }
        return match;
      });
      return {
        index: index + 1,
        url: masked,
        fullUrl: url, // Include full URL in response for debugging (remove in production)
        isCurrent: index === 0, // First provider is current
      };
    });

    res.json({
      success: true,
      data: {
        totalProviders: providers.length,
        providers: maskedProviders,
        currentProvider: maskedProviders[0]?.url || 'None',
        envVar: process.env.ARC_TESTNET_RPC_URL || 'Not set',
      },
    });
  } catch (error: any) {
    logger.error('Error getting RPC providers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get RPC providers',
    });
  }
});

export default router;
