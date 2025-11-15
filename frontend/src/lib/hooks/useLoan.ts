"use client";

import { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS } from "@/config/contracts";
import LoanEngineABI from "@/lib/abis/LoanEngine.json";
import { withRetry } from "@/lib/utils/rpcRetry";

export function useLoan() {
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);

  const walletAddress = wallets[0]?.address as `0x${string}` | undefined;

  /**
   * Request a loan
   */
  const requestLoan = async (amount: string, reason: string) => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const amountInWei = parseUnits(amount, 6); // USDC has 6 decimals

      console.log("Requesting loan:", {
        amount,
        amountInWei: amountInWei.toString(),
        reason,
        loanEngineAddress: CONTRACTS.LoanEngine,
      });

      const hash = await walletClient.writeContract({
        address: CONTRACTS.LoanEngine as `0x${string}`,
        abi: LoanEngineABI,
        functionName: "requestLoan",
        args: [amountInWei, reason],
      });

      console.log("Transaction sent:", hash);

      // Wait for transaction
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      console.log("Transaction receipt:", {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
      });

      if (receipt.status !== "success") {
        throw new Error("Transaction reverted on blockchain");
      }

      return { hash, receipt, success: true };
    } catch (error) {
      console.error("Error requesting loan:", error);

      // Better error message
      if (error instanceof Error) {
        if (
          error.message.includes("rate limit") ||
          error.message.includes("exceeds defined limit")
        ) {
          throw new Error(
            "RPC rate limit exceeded. Please wait a few seconds and try again. If this persists, check your RPC provider configuration."
          );
        } else if (error.message.includes("reverted")) {
          throw new Error(
            "Transaction was rejected by the contract. Please check if you have completed verification and meet eligibility criteria."
          );
        } else if (error.message.includes("insufficient funds")) {
          throw new Error("Insufficient gas funds to complete transaction");
        } else if (error.message.includes("User rejected")) {
          throw new Error("Transaction cancelled by user");
        }
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Repay a loan
   */
  const repayLoan = async (loanId: number, amount: string) => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const amountInWei = parseUnits(amount, 6);

      const hash = await walletClient.writeContract({
        address: CONTRACTS.LoanEngine as `0x${string}`,
        abi: LoanEngineABI,
        functionName: "repayLoan",
        args: [BigInt(loanId), amountInWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { hash, receipt, success: receipt.status === "success" };
    } catch (error) {
      console.error("Error repaying loan:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Repay a loan with any supported token (multi-currency)
   * @param loanId ID of the loan
   * @param tokenAddress Token address (USDC, EURC, USYC)
   * @param amount Amount in the token's native decimals
   */
  const repayLoanWithToken = async (
    loanId: number,
    tokenAddress: string,
    amount: string
  ) => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      // Get token decimals (assuming 6 for stablecoins, but should query)
      const decimals = 6; // USDC, EURC, USYC all use 6 decimals
      const amountInWei = parseUnits(amount, decimals);

      const hash = await walletClient.writeContract({
        address: CONTRACTS.LoanEngine as `0x${string}`,
        abi: LoanEngineABI,
        functionName: "repayLoanWithToken",
        args: [BigInt(loanId), tokenAddress as `0x${string}`, amountInWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { hash, receipt, success: receipt.status === "success" };
    } catch (error) {
      console.error("Error repaying loan with token:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get loan details
   */
  const getLoan = async (loanId: number) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const loan = await publicClient.readContract({
        address: CONTRACTS.LoanEngine as `0x${string}`,
        abi: LoanEngineABI,
        functionName: "getLoan",
        args: [BigInt(loanId)],
      });

      return loan;
    } catch (error) {
      console.error("Error getting loan:", error);
      throw error;
    }
  };

  /**
   * Get user's loans
   */
  const getUserLoans = async (address?: string) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    const userAddress = (address || walletAddress) as `0x${string}`;
    if (!userAddress) {
      throw new Error("No address provided");
    }

    try {
      const loanIds = await publicClient.readContract({
        address: CONTRACTS.LoanEngine as `0x${string}`,
        abi: LoanEngineABI,
        functionName: "getUserLoans",
        args: [userAddress],
      });

      return loanIds as bigint[];
    } catch (error) {
      console.error("Error getting user loans:", error);
      throw error;
    }
  };

  /**
   * Get user's credit score
   */
  const getCreditScore = async (address?: string) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    const userAddress = (address || walletAddress) as `0x${string}`;
    if (!userAddress) {
      throw new Error("No address provided");
    }

    try {
      const score = await publicClient.readContract({
        address: CONTRACTS.LoanEngine as `0x${string}`,
        abi: LoanEngineABI,
        functionName: "getCreditScore",
        args: [userAddress],
      });

      return Number(score);
    } catch (error) {
      console.error("Error getting credit score:", error);
      throw error;
    }
  };

  /**
   * Get total owed for a loan
   */
  const getTotalOwed = async (loanId: number) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const totalOwed = await publicClient.readContract({
        address: CONTRACTS.LoanEngine as `0x${string}`,
        abi: LoanEngineABI,
        functionName: "getTotalOwed",
        args: [BigInt(loanId)],
      });

      return formatUnits(totalOwed as bigint, 6);
    } catch (error) {
      console.error("Error getting total owed:", error);
      throw error;
    }
  };

  /**
   * Get remaining balance for a loan
   */
  const getRemainingBalance = async (loanId: number) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const remaining = await publicClient.readContract({
        address: CONTRACTS.LoanEngine as `0x${string}`,
        abi: LoanEngineABI,
        functionName: "getRemainingBalance",
        args: [BigInt(loanId)],
      });

      return formatUnits(remaining as bigint, 6);
    } catch (error) {
      console.error("Error getting remaining balance:", error);
      throw error;
    }
  };

  /**
   * Auto-repay loan if credit score improves (programmable logic)
   * @param loanId ID of the loan
   */
  const autoRepayOnCreditImprovement = async (loanId: number) => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.LoanEngine as `0x${string}`,
        abi: LoanEngineABI,
        functionName: "autoRepayOnCreditImprovement",
        args: [BigInt(loanId)],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { hash, receipt, success: receipt.status === "success" };
    } catch (error) {
      console.error("Error auto-repaying loan:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Auto-extend loan if 50% paid early (programmable logic)
   * @param loanId ID of the loan
   */
  const autoExtendOnPartialPayment = async (loanId: number) => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      // First, check loan status to provide better error messages
      const loan = (await getLoan(loanId)) as any;
      if (!loan || (loan as any).status !== 2) {
        // 2 = Disbursed
        throw new Error("Loan must be active (disbursed) to extend");
      }

      // Check if at least 50% is repaid
      const totalOwed = await getTotalOwed(loanId);
      const remaining = await getRemainingBalance(loanId);
      const repaid = parseFloat(totalOwed) - parseFloat(remaining);
      const halfAmount = parseFloat(totalOwed) / 2;

      if (repaid < halfAmount) {
        throw new Error(
          `At least 50% must be repaid to extend. Currently repaid: ${repaid.toFixed(
            2
          )} USDC, required: ${halfAmount.toFixed(2)} USDC`
        );
      }

      // Check due date (must be at least 1 day before due date)
      const currentTime = Math.floor(Date.now() / 1000);

      // Handle BigInt conversion properly
      const loanDueAt = (loan as any).dueAt;
      let dueAt: number;
      if (typeof loanDueAt === "bigint") {
        dueAt = Number(loanDueAt);
      } else if (typeof loanDueAt === "string") {
        dueAt = parseInt(loanDueAt, 10);
      } else {
        dueAt = Number(loanDueAt);
      }

      const oneDayInSeconds = 24 * 60 * 60;
      const daysRemaining = (dueAt - currentTime) / (24 * 60 * 60);

      // Debug logging
      console.log("🔍 Auto-extend check:", {
        currentTime,
        dueAt,
        daysRemaining: daysRemaining.toFixed(2),
        oneDayBefore: dueAt - oneDayInSeconds,
      });

      if (currentTime >= dueAt - oneDayInSeconds) {
        throw new Error(
          "Cannot extend loan: too close to due date (must be at least 1 day before)"
        );
      }

      // Contract now allows extension at any time if 50% is paid
      // No need to check for 30 days restriction

      const hash = await walletClient.writeContract({
        address: CONTRACTS.LoanEngine as `0x${string}`,
        abi: LoanEngineABI,
        functionName: "autoExtendOnPartialPayment",
        args: [BigInt(loanId)],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { hash, receipt, success: receipt.status === "success" };
    } catch (error: any) {
      console.error("Error auto-extending loan:", error);

      // Extract revert reason if available
      if (error?.data?.message) {
        const errorMsg = error.data.message;
        throw new Error(`Auto-extend failed: ${errorMsg}`);
      }
      if (error?.shortMessage) {
        throw new Error(`Auto-extend failed: ${error.shortMessage}`);
      }
      if (error?.message) {
        // If it's already a user-friendly error, throw it as-is
        if (
          error.message.includes("must be") ||
          error.message.includes("Cannot extend") ||
          error.message.includes("cannot be extended")
        ) {
          throw error;
        }
        throw new Error(`Auto-extend failed: ${error.message}`);
      }

      throw new Error(
        "Failed to extend loan. Please ensure: (1) Loan is active, (2) At least 50% repaid, (3) At least 1 day before due date"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestLoan,
    repayLoan,
    repayLoanWithToken,
    autoRepayOnCreditImprovement,
    autoExtendOnPartialPayment,
    getLoan,
    getUserLoans,
    getCreditScore,
    getTotalOwed,
    getRemainingBalance,
    isLoading,
    walletAddress,
  };
}
