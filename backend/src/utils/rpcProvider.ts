/**
 * Multi-Provider RPC System with Automatic Fallback
 * Supports multiple RPC providers and automatically switches on failure
 */

import { ethers } from 'ethers';
import { logger } from './logger';

class RPCProviderManager {
  private providers: string[] = [];
  private currentIndex = 0;
  private failedProviders: Set<number> = new Set();
  private resetTimeout: NodeJS.Timeout | null = null;

  private initialized = false;

  constructor() {
    // Don't initialize here - wait for first use to ensure dotenv is loaded
  }

  private initialize(): void {
    if (this.initialized) return;

    // Load RPC URLs from environment variables
    // Primary: ARC_TESTNET_RPC_URL
    // Fallbacks: ARC_TESTNET_RPC_URL_2, ARC_TESTNET_RPC_URL_3, etc.
    const primary = process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network';
    this.providers = [primary];

    // Add fallback providers if configured
    let i = 2;
    while (process.env[`ARC_TESTNET_RPC_URL_${i}`]) {
      this.providers.push(process.env[`ARC_TESTNET_RPC_URL_${i}`]!);
      i++;
    }

    // Add public Arc Testnet endpoints as additional fallbacks
    if (this.providers.length === 1) {
      // Only add public endpoints if no custom fallbacks are configured
      this.providers.push(
        'https://rpc.testnet.arc.network' // Already primary, but keep for consistency
        // Add more public endpoints if available
      );
    }

    this.initialized = true;

    // Log all providers (mask API keys for security)
    const maskedProviders = this.providers.map(url => {
      // Mask API keys in URLs (Alchemy, Infura, QuickNode patterns)
      return url.replace(/(\/v2\/|\/v3\/)[^/]+/g, (match: string) => {
        const parts = match.split('/');
        if (parts.length > 0 && parts[parts.length - 1].length > 10) {
          return match.substring(0, match.length - 10) + '***';
        }
        return match;
      });
    });

    logger.info(`RPC Provider Manager initialized with ${this.providers.length} provider(s):`);
    maskedProviders.forEach((url, index) => {
      logger.info(`  Provider ${index + 1}: ${url}`);
    });
  }

  /**
   * Get the current provider
   */
  getProvider(): ethers.JsonRpcProvider {
    this.initialize(); // Ensure initialized
    const url = this.providers[this.currentIndex];
    return new ethers.JsonRpcProvider(url);
  }

  /**
   * Get all provider URLs
   */
  getProviders(): string[] {
    this.initialize(); // Ensure initialized
    return [...this.providers];
  }

  /**
   * Switch to next provider on failure
   */
  switchProvider(): void {
    this.initialize(); // Ensure initialized
    const previousIndex = this.currentIndex;
    this.failedProviders.add(this.currentIndex);

    // Find next available provider
    let attempts = 0;
    do {
      this.currentIndex = (this.currentIndex + 1) % this.providers.length;
      attempts++;
    } while (this.failedProviders.has(this.currentIndex) && attempts < this.providers.length);

    if (attempts >= this.providers.length) {
      // All providers failed, reset and try again
      logger.warn('All RPC providers failed, resetting...');
      this.failedProviders.clear();
      this.currentIndex = 0;
    } else {
      logger.warn(
        `Switched RPC provider from ${this.providers[previousIndex]} to ${this.providers[this.currentIndex]}`
      );
    }

    // Reset failed providers after 5 minutes
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    this.resetTimeout = setTimeout(
      () => {
        this.failedProviders.clear();
        logger.info('RPC provider failure list reset');
      },
      5 * 60 * 1000
    );
  }

  /**
   * Mark current provider as failed and switch
   */
  markFailed(): void {
    this.switchProvider();
  }

  /**
   * Execute a function with automatic provider fallback
   */
  async executeWithFallback<T>(fn: (provider: ethers.JsonRpcProvider) => Promise<T>): Promise<T> {
    this.initialize(); // Ensure initialized
    const maxAttempts = this.providers.length;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const provider = this.getProvider();
        return await fn(provider);
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit or network error
        const isRateLimit =
          error?.code === -32003 ||
          error?.code === 429 ||
          error?.message?.toLowerCase().includes('rate limit') ||
          error?.message?.toLowerCase().includes('too many requests') ||
          error?.message?.toLowerCase().includes('daily request limit');

        if (isRateLimit && attempt < maxAttempts - 1) {
          logger.warn(`Rate limit hit on provider ${this.currentIndex + 1}, switching...`);
          this.markFailed();
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        // For other errors, try next provider
        if (attempt < maxAttempts - 1) {
          logger.warn(`RPC call failed on provider ${this.currentIndex + 1}, trying next...`);
          this.markFailed();
          continue;
        }
      }
    }

    // All providers failed
    throw lastError || new Error('All RPC providers failed');
  }
}

// Singleton instance
export const rpcProviderManager = new RPCProviderManager();

// Convenience function to get a provider
export function getRPCProvider(): ethers.JsonRpcProvider {
  return rpcProviderManager.getProvider();
}
