import { Request, Response } from 'express';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';

const MULTI_CURRENCY_ABI = [
  'function addCurrency(address token, string symbol, uint256 rateVsUSDC) external',
  'function updateExchangeRate(address token, uint256 newRate) external',
  'function convertToUSDC(address token, uint256 amount) external view returns (uint256)',
  'function convertFromUSDC(address token, uint256 usdcAmount) external view returns (uint256)',
  'function convertCurrency(address fromToken, address toToken, uint256 amount) external view returns (uint256)',
  'function supportedTokens(address) external view returns (bool)',
  'function tokenSymbols(address) external view returns (string)',
  'function exchangeRates(address) external view returns (uint256)',
  'function getTokenDetails(address) external view returns (string, uint256, bool)',
];

export class MultiCurrencyController {
  // Helper to add delay between RPC calls
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  // POST /api/currency/add - Add supported currency
  async addCurrency(req: Request, res: Response): Promise<void> {
    try {
      const { token, symbol, rate } = req.body;

      if (!token || !symbol || !rate) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: token, symbol, rate',
        });
        return;
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
      const multiCurrency = new ethers.Contract(
        process.env.MULTI_CURRENCY_ADDRESS!,
        MULTI_CURRENCY_ABI,
        agentWallet
      );

      logger.info('Adding currency', { token, symbol, rate });

      // Convert rate to basis points (e.g., 1.09 = 10900)
      const rateBP = Math.floor(rate * 10000);

      const tx = await multiCurrency.addCurrency(token, symbol, rateBP);
      const receipt = await tx.wait();

      logger.info('Currency added', { txHash: receipt.hash });

      res.json({
        success: true,
        txHash: receipt.hash,
        data: {
          token,
          symbol,
          rate,
        },
      });
    } catch (error: any) {
      logger.error('Error adding currency:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add currency',
      });
    }
  }

  // PUT /api/currency/rate - Update exchange rate
  async updateRate(req: Request, res: Response): Promise<void> {
    try {
      const { token, rate } = req.body;

      if (!token || !rate) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: token, rate',
        });
        return;
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
      const multiCurrency = new ethers.Contract(
        process.env.MULTI_CURRENCY_ADDRESS!,
        MULTI_CURRENCY_ABI,
        agentWallet
      );

      logger.info('Updating exchange rate', { token, rate });

      const rateBP = Math.floor(rate * 10000);

      const tx = await multiCurrency.updateExchangeRate(token, rateBP);
      const receipt = await tx.wait();

      logger.info('Exchange rate updated', { txHash: receipt.hash });

      res.json({
        success: true,
        txHash: receipt.hash,
        data: {
          token,
          rate,
        },
      });
    } catch (error: any) {
      logger.error('Error updating exchange rate:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update exchange rate',
      });
    }
  }

  // GET /api/currency/convert - Convert between currencies
  async convertCurrency(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, amount } = req.query;

      if (!from || !to || !amount) {
        res.status(400).json({
          success: false,
          error: 'Missing required query parameters: from, to, amount',
        });
        return;
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const multiCurrency = new ethers.Contract(
        process.env.MULTI_CURRENCY_ADDRESS!,
        MULTI_CURRENCY_ABI,
        provider
      );

      // Convert amount to wei (assuming 6 decimals)
      const amountWei = ethers.parseUnits(amount as string, 6);

      // Get USDC equivalent first
      const usdcAmount = await multiCurrency.convertToUSDC(from, amountWei);

      // Then convert to target currency
      const toAmount = await multiCurrency.convertFromUSDC(to, usdcAmount);

      res.json({
        success: true,
        data: {
          from: amount,
          fromCurrency: from,
          to: ethers.formatUnits(toAmount, 6),
          toCurrency: to,
          usdcEquivalent: ethers.formatUnits(usdcAmount, 6),
        },
      });
    } catch (error: any) {
      logger.error('Error converting currency:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to convert currency',
      });
    }
  }

  // GET /api/currency/supported - Get all supported currencies
  async getSupportedCurrencies(_req: Request, res: Response): Promise<void> {
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const multiCurrency = new ethers.Contract(
        process.env.MULTI_CURRENCY_ADDRESS!,
        MULTI_CURRENCY_ABI,
        provider
      );

      // Get common token addresses from env
      const tokens = [
        { address: process.env.USDC_ADDRESS!, name: 'US Dollar Coin' },
        { address: process.env.EURC_ADDRESS || '0x0', name: 'Euro Coin' },
        { address: process.env.USYC_ADDRESS || '0x0', name: 'Circles tokenized money' },
      ];

      const currencies = [];
      const validTokens = tokens.filter(t => t.address !== '0x0');

      for (let i = 0; i < validTokens.length; i++) {
        const token = validTokens[i];
        try {
          const result = await multiCurrency.getTokenDetails(token.address);
          // Result is an array: [symbol, rate, supported]
          const symbol = result[0];
          const rate = result[1];
          const supported = result[2];

          if (supported) {
            currencies.push({
              address: token.address,
              symbol: symbol,
              name: token.name,
              rate: Number(rate) / 10000, // Convert from basis points
              rateDisplay: `1 ${symbol} = ${(Number(rate) / 10000).toFixed(4)} USDC`,
            });
          }

          // Add delay between calls to avoid rate limiting (200ms = max 5 calls/second)
          if (i < validTokens.length - 1) {
            await this.delay(200);
          }
        } catch (error) {
          logger.warn(`Failed to get details for token ${token.address}`, error);
          // Still add delay even on error to respect rate limits
          if (i < validTokens.length - 1) {
            await this.delay(200);
          }
        }
      }

      res.json({
        success: true,
        data: currencies,
      });
    } catch (error: any) {
      logger.error('Error getting supported currencies:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get supported currencies',
      });
    }
  }

  // GET /api/currency/token/:address - Get token details
  async getTokenDetails(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Token address is required',
        });
        return;
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'
      );
      const multiCurrency = new ethers.Contract(
        process.env.MULTI_CURRENCY_ADDRESS!,
        MULTI_CURRENCY_ABI,
        provider
      );

      const result = await multiCurrency.getTokenDetails(address);
      // Result is an array: [symbol, rate, supported]
      const symbol = result[0];
      const rate = result[1];
      const supported = result[2];

      console.log('details', { symbol, rate, supported });

      res.json({
        success: true,
        data: {
          address,
          symbol: symbol,
          rate: Number(rate) / 10000,
          supported: supported,
          rateDisplay: `1 ${symbol} = ${(Number(rate) / 10000).toFixed(4)} USDC`,
        },
      });
    } catch (error: any) {
      logger.error('Error getting token details:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get token details',
      });
    }
  }
}

export const multiCurrencyController = new MultiCurrencyController();
