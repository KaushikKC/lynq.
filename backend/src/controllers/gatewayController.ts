import { Request, Response } from 'express';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { rateLimiter } from '../utils/rateLimiter';
import { cache } from '../utils/cache';
import { rpcProviderManager } from '../utils/rpcProvider';

const GATEWAY_MANAGER_ABI = [
  'function depositToGateway(uint256 amount) external',
  'function createBurnIntent(uint256 amount, uint256 destinationChainId) external returns (bytes32)',
  'function executeMintWithAttestation(bytes32 intentId, address recipient, uint256 amount, uint256 sourceChainId) external',
  'function getUnifiedBalance(address user) external view returns (uint256)',
  'function getTotalUnifiedLiquidity() external view returns (uint256)',
  'function totalUnifiedLiquidity() external view returns (uint256)',
  'function isBurnIntentValid(bytes32 intentId) external view returns (bool)',
  'function getBurnIntent(bytes32 intentId) external view returns (tuple(address burner, uint256 amount, uint256 destinationChainId, uint256 timestamp, bool executed))',
  'event DepositToGateway(address indexed user, uint256 amount, uint256 chainId, uint256 timestamp)',
  'event BurnIntentCreated(bytes32 indexed intentId, address indexed burner, uint256 amount, uint256 destinationChainId)',
  'event CrossChainMint(address indexed recipient, uint256 amount, uint256 sourceChainId, bytes32 intentId)',
];

export class GatewayController {
  // POST /api/gateway/deposit - Deposit USDC to Circle Gateway
  async depositToGateway(req: Request, res: Response): Promise<void> {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid amount is required',
        });
        return;
      }

      // Use RPC provider manager with fallback
      const provider = await rpcProviderManager.executeWithFallback(async p => p);
      const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
      const gatewayManager = new ethers.Contract(
        process.env.GATEWAY_MANAGER_ADDRESS!,
        GATEWAY_MANAGER_ABI,
        agentWallet
      );

      // Convert amount to wei (6 decimals for USDC)
      const amountInWei = ethers.parseUnits(amount.toString(), 6);

      logger.info('Depositing to Gateway', { amount, amountInWei: amountInWei.toString() });

      // Use rate limiter for transaction
      const tx = await rateLimiter.execute(() => gatewayManager.depositToGateway(amountInWei));
      const receipt = (await rateLimiter.execute(() =>
        tx.wait()
      )) as ethers.ContractTransactionReceipt;

      // Clear cache after deposit (balance changed)
      cache.delete(`gateway:balance:${agentWallet.address.toLowerCase()}`);
      cache.delete('gateway:stats');

      logger.info('Gateway deposit successful', { txHash: receipt.hash });

      res.json({
        success: true,
        txHash: receipt.hash,
        data: {
          amount,
          message: 'USDC deposited to Circle Gateway successfully',
        },
      });
    } catch (error: any) {
      logger.error('Error depositing to Gateway:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to deposit to Gateway',
      });
    }
  }

  // GET /api/gateway/balance/:address - Get unified balance
  async getUnifiedBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address is required',
        });
        return;
      }

      // Check cache first
      const cacheKey = `gateway:balance:${address.toLowerCase()}`;
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        logger.info('Returning cached unified balance', { address });
        res.json(cached);
        return;
      }

      // Use RPC provider manager with fallback
      const provider = await rpcProviderManager.executeWithFallback(async p => p);
      const gatewayManager = new ethers.Contract(
        process.env.GATEWAY_MANAGER_ADDRESS!,
        GATEWAY_MANAGER_ABI,
        provider
      );

      // Use rate limiter for RPC calls
      const [balance, totalLiquidity] = await Promise.all([
        rateLimiter.execute(() => gatewayManager.getUnifiedBalance(address)),
        rateLimiter.execute(() => gatewayManager.totalUnifiedLiquidity()),
      ]);

      const response = {
        success: true,
        data: {
          address,
          unifiedBalance: ethers.formatUnits(balance, 6),
          totalUnifiedLiquidity: ethers.formatUnits(totalLiquidity, 6),
        },
      };

      // Cache the result for 15 seconds
      cache.set(cacheKey, response, 15000);

      res.json(response);
    } catch (error: any) {
      logger.error('Error getting unified balance:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get unified balance',
      });
    }
  }

  // POST /api/gateway/burn-intent - Create burn intent for cross-chain transfer
  async createBurnIntent(req: Request, res: Response): Promise<void> {
    try {
      const { amount, destinationChainId } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid amount is required',
        });
        return;
      }

      if (!destinationChainId) {
        res.status(400).json({
          success: false,
          error: 'Destination chain ID is required',
        });
        return;
      }

      // Use RPC provider manager with fallback
      const provider = await rpcProviderManager.executeWithFallback(async p => p);
      const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
      const gatewayManager = new ethers.Contract(
        process.env.GATEWAY_MANAGER_ADDRESS!,
        GATEWAY_MANAGER_ABI,
        agentWallet
      );

      const amountInWei = ethers.parseUnits(amount.toString(), 6);

      logger.info('Creating burn intent', { amount, destinationChainId });

      // Use rate limiter for transaction (getTransactionCount, estimateGas, etc.)
      const tx = await rateLimiter.execute(() =>
        gatewayManager.createBurnIntent(amountInWei, destinationChainId)
      );
      const receipt = (await rateLimiter.execute(() =>
        tx.wait()
      )) as ethers.ContractTransactionReceipt;

      // Get the intent ID from events
      const event = receipt.logs.find((log: ethers.Log) => {
        try {
          const parsed = gatewayManager.interface.parseLog(log);
          return parsed?.name === 'BurnIntentCreated';
        } catch {
          return false;
        }
      });

      let intentId = null;
      if (event) {
        const parsed = gatewayManager.interface.parseLog(event);
        intentId = parsed?.args[0];
      }

      logger.info('Burn intent created', { txHash: receipt.hash, intentId });

      // Clear cache after burn intent (balance changed)
      cache.delete(`gateway:balance:${agentWallet.address.toLowerCase()}`);
      cache.delete('gateway:stats');

      res.json({
        success: true,
        txHash: receipt.hash,
        data: {
          intentId,
          amount,
          destinationChainId,
          message: 'Burn intent created successfully',
        },
      });
    } catch (error: any) {
      logger.error('Error creating burn intent:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create burn intent',
      });
    }
  }

  // GET /api/gateway/stats - Get Gateway statistics
  async getGatewayStats(req: Request, res: Response): Promise<void> {
    try {
      const gatewayAddress = process.env.GATEWAY_MANAGER_ADDRESS;

      if (!gatewayAddress) {
        res.status(500).json({
          success: false,
          error: 'GATEWAY_MANAGER_ADDRESS not configured',
        });
        return;
      }

      // Check cache first
      const cacheKey = 'gateway:stats';
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        logger.info('Returning cached Gateway stats');
        res.json(cached);
        return;
      }

      // Use RPC provider manager with fallback
      const provider = await rpcProviderManager.executeWithFallback(async p => p);

      // Check if contract exists at address (with rate limiting)
      const code = await rateLimiter.execute(() => provider.getCode(gatewayAddress));
      if (code === '0x') {
        res.status(500).json({
          success: false,
          error: `No contract found at address ${gatewayAddress}. Please deploy GatewayManager first.`,
        });
        return;
      }

      const gatewayManager = new ethers.Contract(gatewayAddress, GATEWAY_MANAGER_ABI, provider);

      // Try calling getTotalUnifiedLiquidity() first (explicit function)
      // If that fails, fall back to totalUnifiedLiquidity() (public state variable)
      let totalLiquidity;
      try {
        totalLiquidity = await rateLimiter.execute(() => gatewayManager.getTotalUnifiedLiquidity());
      } catch (err) {
        // Fall back to public state variable getter
        try {
          totalLiquidity = await rateLimiter.execute(() => gatewayManager.totalUnifiedLiquidity());
        } catch (fallbackErr) {
          logger.error('Error calling totalUnifiedLiquidity:', fallbackErr);
          // Return stats without liquidity data if call fails
          totalLiquidity = 0n;
        }
      }

      const response = {
        success: true,
        data: {
          totalUnifiedLiquidity: ethers.formatUnits(totalLiquidity, 6),
          gatewayAddress: gatewayAddress,
          chainId: process.env.CHAIN_ID || '412346',
          message: 'Circle Gateway integration active',
        },
      };

      // Cache the result for 20 seconds
      cache.set(cacheKey, response, 20000);

      res.json(response);
    } catch (error: any) {
      logger.error('Error getting Gateway stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get Gateway stats',
      });
    }
  }
}

export const gatewayController = new GatewayController();
