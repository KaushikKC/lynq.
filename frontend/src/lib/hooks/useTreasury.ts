"use client";

import { useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS } from "@/config/contracts";
import TreasuryPoolABI from "@/lib/abis/TreasuryPool.json";

export function useTreasury() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Deposit USDC to treasury
   */
  const deposit = async (amount: string) => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const amountInWei = parseUnits(amount, 6);

      const hash = await walletClient.writeContract({
        address: CONTRACTS.TreasuryPool as `0x${string}`,
        abi: TreasuryPoolABI,
        functionName: "deposit",
        args: [amountInWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { hash, receipt, success: receipt.status === "success" };
    } catch (error) {
      console.error("Error depositing to treasury:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Withdraw from treasury
   */
  const withdraw = async (amount: string) => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const amountInWei = parseUnits(amount, 6);

      const hash = await walletClient.writeContract({
        address: CONTRACTS.TreasuryPool as `0x${string}`,
        abi: TreasuryPoolABI,
        functionName: "withdraw",
        args: [amountInWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { hash, receipt, success: receipt.status === "success" };
    } catch (error) {
      console.error("Error withdrawing from treasury:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get user's deposits
   */
  const getDeposits = async (address: string) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const deposits = await publicClient.readContract({
        address: CONTRACTS.TreasuryPool as `0x${string}`,
        abi: TreasuryPoolABI,
        functionName: "deposits",
        args: [address as `0x${string}`],
      });

      return formatUnits(deposits as bigint, 6);
    } catch (error) {
      console.error("Error getting deposits:", error);
      throw error;
    }
  };

  /**
   * Get total liquidity
   */
  const getTotalLiquidity = async () => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const liquidity = await publicClient.readContract({
        address: CONTRACTS.TreasuryPool as `0x${string}`,
        abi: TreasuryPoolABI,
        functionName: "totalLiquidity",
      });

      return formatUnits(liquidity as bigint, 6);
    } catch (error) {
      console.error("Error getting total liquidity:", error);
      throw error;
    }
  };

  /**
   * Get total utilized
   */
  const getTotalUtilized = async () => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const utilized = await publicClient.readContract({
        address: CONTRACTS.TreasuryPool as `0x${string}`,
        abi: TreasuryPoolABI,
        functionName: "totalUtilized",
      });

      return formatUnits(utilized as bigint, 6);
    } catch (error) {
      console.error("Error getting total utilized:", error);
      throw error;
    }
  };

  /**
   * Get available liquidity
   */
  const getAvailableLiquidity = async () => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const available = await publicClient.readContract({
        address: CONTRACTS.TreasuryPool as `0x${string}`,
        abi: TreasuryPoolABI,
        functionName: "getAvailableLiquidity",
      });

      return formatUnits(available as bigint, 6);
    } catch (error) {
      console.error("Error getting available liquidity:", error);
      throw error;
    }
  };

  /**
   * Get reserve ratio
   */
  const getReserveRatio = async () => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const ratio = await publicClient.readContract({
        address: CONTRACTS.TreasuryPool as `0x${string}`,
        abi: TreasuryPoolABI,
        functionName: "getReserveRatio",
      });

      return Number(ratio) / 100; // Convert basis points to percentage
    } catch (error) {
      console.error("Error getting reserve ratio:", error);
      throw error;
    }
  };

  /**
   * Get utilization ratio
   */
  const getUtilizationRatio = async () => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const ratio = await publicClient.readContract({
        address: CONTRACTS.TreasuryPool as `0x${string}`,
        abi: TreasuryPoolABI,
        functionName: "getUtilizationRatio",
      });

      return Number(ratio) / 100; // Convert basis points to percentage
    } catch (error) {
      console.error("Error getting utilization ratio:", error);
      throw error;
    }
  };

  return {
    deposit,
    withdraw,
    getDeposits,
    getTotalLiquidity,
    getTotalUtilized,
    getAvailableLiquidity,
    getReserveRatio,
    getUtilizationRatio,
    isLoading,
  };
}
