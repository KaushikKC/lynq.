/**
 * RPC Retry Utility for Frontend
 * Only retries on actual rate limit errors - no throttling
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error?.message?.toLowerCase() || "";
  const errorName = error?.name?.toLowerCase() || "";
  const errorDetails = error?.details?.toLowerCase() || "";

  return (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("rate limited") ||
    errorMessage.includes("exceeds defined limit") ||
    errorMessage.includes("too many requests") ||
    errorMessage.includes("429") ||
    errorName.includes("limit") ||
    errorDetails.includes("rate limit")
  );
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic ONLY on rate limit errors
 * No throttling - calls execute immediately
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 2, initialDelay = 1000, maxDelay = 5000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Only retry on rate limit errors
      if (isRateLimitError(error) && attempt < maxRetries) {
        const delayMs = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        console.warn(
          `⚠️ Rate limit hit (attempt ${attempt + 1}/${
            maxRetries + 1
          }), retrying in ${delayMs}ms...`
        );
        console.warn(
          "⚠️ This suggests MetaMask might be using a different RPC. Check MetaMask network settings."
        );
        await delay(delayMs);
        continue;
      }

      // If not a rate limit error or max retries reached, throw immediately
      throw error;
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
