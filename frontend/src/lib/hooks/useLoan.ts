"use client";

import { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS } from "@/config/contracts";
import LoanEngineABI from "@/lib/abis/LoanEngine.json";

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
        if (error.message.includes("reverted")) {
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

  return {
    requestLoan,
    repayLoan,
    getLoan,
    getUserLoans,
    getCreditScore,
    getTotalOwed,
    getRemainingBalance,
    isLoading,
    walletAddress,
  };
}
