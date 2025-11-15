import { API_CONFIG } from "@/config/contracts";

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        success: false,
        error: "Request failed",
      }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  // User endpoints
  async getUserSummary(address: string) {
    return this.request(`/user/${address}/summary`);
  }

  async getUserReputation(address: string) {
    return this.request(`/user/${address}/reputation`);
  }

  async createUser(data: {
    address: string;
    verificationSBT?: string;
    verifiedMethods?: string[];
  }) {
    return this.request("/user/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCreditScore(address: string, creditScore: number) {
    return this.request(`/user/${address}/credit-score`, {
      method: "PUT",
      body: JSON.stringify({ creditScore }),
    });
  }

  // Screening endpoints
  async checkEligibility(address: string, amount: number) {
    return this.request(
      `/screening/eligibility?address=${address}&amount=${amount}`
    );
  }

  async getRecommendedAmount(address: string) {
    return this.request(`/screening/recommended-amount?address=${address}`);
  }

  // Loan endpoints
  async requestLoan(data: {
    borrower: string;
    amount: number;
    reason: string;
  }) {
    return this.request("/loan/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLoan(loanId: number) {
    return this.request(`/loan/${loanId}`);
  }

  async getUserLoans(address: string) {
    return this.request(`/loan/user/${address}`);
  }

  async approveLoan(loanId: number, interestRate: number, txHash?: string) {
    return this.request(`/loan/${loanId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ interestRate, txHash }),
    });
  }

  async recordRepayment(data: {
    loanId: number;
    amount: number;
    txHash?: string;
  }) {
    return this.request("/loan/repayment", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async markAsDefaulted(loanId: number) {
    return this.request(`/loan/${loanId}/default`, {
      method: "PUT",
    });
  }

  async getPendingLoans() {
    return this.request("/loan/pending");
  }

  // Treasury endpoints
  async getTreasuryMetrics() {
    return this.request("/treasury/metrics");
  }

  async recordDeposit(amount: number, txHash?: string) {
    return this.request("/treasury/deposit", {
      method: "POST",
      body: JSON.stringify({ amount, txHash }),
    });
  }

  async recordWithdrawal(amount: number, txHash?: string) {
    return this.request("/treasury/withdrawal", {
      method: "POST",
      body: JSON.stringify({ amount, txHash }),
    });
  }

  // History endpoints
  async getHistory(params?: {
    address?: string;
    eventType?: string;
    limit?: number;
    skip?: number;
  }) {
    const queryParams = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return this.request(`/history${queryParams ? `?${queryParams}` : ""}`);
  }

  async recordEvent(data: {
    eventType: string;
    transactionHash: string;
    blockNumber: number;
    address: string;
    data: Record<string, string | number | boolean | null>;
    timestamp?: number;
  }) {
    return this.request("/history/event", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getStats() {
    return this.request("/history/stats");
  }

  // Health check
  async healthCheck() {
    return this.request("/health");
  }
}

// Export singleton instance
export const api = new APIClient(API_CONFIG.baseUrl);
