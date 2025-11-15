"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api/client";

export function useAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(async <T,>(
    requestFn: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("API Error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    handleRequest,
    api,
  };
}

// Hook for user operations
export function useUserAPI(address?: string) {
  const { isLoading, error, handleRequest } = useAPI();

  const getUserSummary = useCallback(
    (userAddress?: string) => {
      const addr = userAddress || address;
      if (!addr) throw new Error("No address provided");
      return handleRequest(() => api.getUserSummary(addr));
    },
    [address, handleRequest]
  );

  const getUserReputation = useCallback(
    (userAddress?: string) => {
      const addr = userAddress || address;
      if (!addr) throw new Error("No address provided");
      return handleRequest(() => api.getUserReputation(addr));
    },
    [address, handleRequest]
  );

  const createUser = useCallback(
    (data: {
      address: string;
      verificationSBT?: string;
      verifiedMethods?: string[];
    }) => {
      return handleRequest(() => api.createUser(data));
    },
    [handleRequest]
  );

  const checkEligibility = useCallback(
    (amount: number, userAddress?: string) => {
      const addr = userAddress || address;
      if (!addr) throw new Error("No address provided");
      return handleRequest(() => api.checkEligibility(addr, amount));
    },
    [address, handleRequest]
  );

  const getRecommendedAmount = useCallback(
    (userAddress?: string) => {
      const addr = userAddress || address;
      if (!addr) throw new Error("No address provided");
      return handleRequest(() => api.getRecommendedAmount(addr));
    },
    [address, handleRequest]
  );

  return {
    getUserSummary,
    getUserReputation,
    createUser,
    checkEligibility,
    getRecommendedAmount,
    isLoading,
    error,
  };
}

// Hook for loan operations
export function useLoanAPI() {
  const { isLoading, error, handleRequest } = useAPI();

  const requestLoan = useCallback(
    (data: { borrower: string; amount: number; reason: string }) => {
      return handleRequest(() => api.requestLoan(data));
    },
    [handleRequest]
  );

  const getLoan = useCallback(
    (loanId: number) => {
      return handleRequest(() => api.getLoan(loanId));
    },
    [handleRequest]
  );

  const getUserLoans = useCallback(
    (address: string) => {
      return handleRequest(() => api.getUserLoans(address));
    },
    [handleRequest]
  );

  const recordRepayment = useCallback(
    (data: { loanId: number; amount: number; txHash?: string }) => {
      return handleRequest(() => api.recordRepayment(data));
    },
    [handleRequest]
  );

  const getPendingLoans = useCallback(() => {
    return handleRequest(() => api.getPendingLoans());
  }, [handleRequest]);

  return {
    requestLoan,
    getLoan,
    getUserLoans,
    recordRepayment,
    getPendingLoans,
    isLoading,
    error,
  };
}

// Hook for treasury operations
export function useTreasuryAPI() {
  const { isLoading, error, handleRequest } = useAPI();

  const getTreasuryMetrics = useCallback(() => {
    return handleRequest(() => api.getTreasuryMetrics());
  }, [handleRequest]);

  const recordDeposit = useCallback(
    (amount: number, txHash?: string) => {
      return handleRequest(() => api.recordDeposit(amount, txHash));
    },
    [handleRequest]
  );

  const recordWithdrawal = useCallback(
    (amount: number, txHash?: string) => {
      return handleRequest(() => api.recordWithdrawal(amount, txHash));
    },
    [handleRequest]
  );

  return {
    getTreasuryMetrics,
    recordDeposit,
    recordWithdrawal,
    isLoading,
    error,
  };
}

