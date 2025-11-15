/**
 * Rate Limiter and Request Throttler
 * Prevents hitting RPC rate limits by queuing and throttling requests
 */

interface QueuedRequest {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retries: number;
}

export class RateLimiter {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private minDelayBetweenRequests: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(
    minDelayMs: number = 500, // Minimum 500ms between requests (increased to reduce rate limits)
    maxRetries: number = 3,
    retryDelayMs: number = 2000 // Increased initial retry delay
  ) {
    this.minDelayBetweenRequests = minDelayMs;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelayMs;
  }

  /**
   * Execute a function with rate limiting and retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
        retries: 0,
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;

      // Wait for minimum delay between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelayBetweenRequests) {
        await this.delay(this.minDelayBetweenRequests - timeSinceLastRequest);
      }

      try {
        const result = await this.executeWithRetry(request);
        request.resolve(result);
        this.lastRequestTime = Date.now();
      } catch (error: any) {
        // Check if it's a rate limit error
        if (this.isRateLimitError(error) && request.retries < this.maxRetries) {
          // Re-queue with exponential backoff
          request.retries++;
          const backoffDelay = this.retryDelay * Math.pow(2, request.retries - 1);
          // eslint-disable-next-line no-console
          console.log(
            `Rate limited, retrying in ${backoffDelay}ms (attempt ${request.retries}/${this.maxRetries})`
          );

          await this.delay(backoffDelay);
          this.queue.unshift(request); // Add back to front of queue
        } else {
          request.reject(error);
        }
      }
    }

    this.processing = false;
  }

  private async executeWithRetry(request: QueuedRequest): Promise<any> {
    try {
      return await request.fn();
    } catch (error: any) {
      if (this.isRateLimitError(error) && request.retries < this.maxRetries) {
        throw error; // Let processQueue handle retry
      }
      throw error;
    }
  }

  private isRateLimitError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toString() || '';

    return (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('429') ||
      errorMessage.includes('daily request limit') ||
      errorCode === '429' ||
      errorCode === '-32003' ||
      error?.status === 429
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear the queue (useful for testing or reset)
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }
}

// Singleton instance for the application
export const rateLimiter = new RateLimiter(500, 3, 3000); // 500ms delay, 3 retries, 3s initial retry delay
