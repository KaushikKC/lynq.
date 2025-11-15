"use client";

import { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS } from "@/config/contracts";
import TestUSDCABI from "@/lib/abis/TestUSDC.json";
import { withRetry } from "@/lib/utils/rpcRetry";

export function useUSDC() {
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);

  const walletAddress = wallets[0]?.address as `0x${string}` | undefined;

  /**
   * Get USDC balance
   */
  const getBalance = async (address?: string) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    const userAddress = (address || walletAddress) as `0x${string}`;
    if (!userAddress) {
      throw new Error("No address provided");
    }

    try {
      const balance = await publicClient.readContract({
        address: CONTRACTS.TestUSDC as `0x${string}`,
        abi: TestUSDCABI,
        functionName: "balanceOf",
        args: [userAddress],
      });

      return formatUnits(balance as bigint, 6);
    } catch (error) {
      console.error("Error getting USDC balance:", error);
      throw error;
    }
  };

  /**
   * Approve USDC spending
   */
  const approve = async (spender: string, amount: string) => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const amountInWei = parseUnits(amount, 6);

      // Debug: Log what RPC is being used
      console.log("🔍 Approving USDC - Checking RPC configuration...");
      if (publicClient.transport && "url" in publicClient.transport) {
        console.log(
          "🔍 Public Client RPC:",
          (publicClient.transport as any).url
        );
      }
      if (walletClient.transport && "url" in walletClient.transport) {
        console.log(
          "🔍 Wallet Client RPC:",
          (walletClient.transport as any).url
        );
      }

      // Execute immediately - only retry on actual rate limit errors
      const hash = await withRetry(
        () =>
          walletClient.writeContract({
            address: CONTRACTS.TestUSDC as `0x${string}`,
            abi: TestUSDCABI,
            functionName: "approve",
            args: [spender as `0x${string}`, amountInWei],
          }),
        { maxRetries: 2, initialDelay: 2000, maxDelay: 10000 }
      );

      // Wait for receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { hash, receipt, success: receipt.status === "success" };
    } catch (error: any) {
      console.error("Error approving USDC:", error);

      // Better error message for rate limits
      if (
        error?.message?.includes("rate limit") ||
        error?.message?.includes("exceeds defined limit")
      ) {
        throw new Error(
          "RPC rate limit exceeded. Please wait a few seconds and try again. If this persists, check your RPC provider configuration."
        );
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check allowance
   */
  const getAllowance = async (owner: string, spender: string) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const allowance = await publicClient.readContract({
        address: CONTRACTS.TestUSDC as `0x${string}`,
        abi: TestUSDCABI,
        functionName: "allowance",
        args: [owner as `0x${string}`, spender as `0x${string}`],
      });

      return formatUnits(allowance as bigint, 6);
    } catch (error) {
      console.error("Error getting allowance:", error);
      throw error;
    }
  };

  /**
   * Claim from faucet
   */
  const claimFaucet = async () => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.TestUSDC as `0x${string}`,
        abi: TestUSDCABI,
        functionName: "faucet",
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { hash, receipt, success: receipt.status === "success" };
    } catch (error) {
      console.error("Error claiming faucet:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Transfer USDC
   */
  const transfer = async (to: string, amount: string) => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const amountInWei = parseUnits(amount, 6);

      const hash = await walletClient.writeContract({
        address: CONTRACTS.TestUSDC as `0x${string}`,
        abi: TestUSDCABI,
        functionName: "transfer",
        args: [to as `0x${string}`, amountInWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { hash, receipt, success: receipt.status === "success" };
    } catch (error) {
      console.error("Error transferring USDC:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getBalance,
    approve,
    getAllowance,
    claimFaucet,
    transfer,
    isLoading,
    walletAddress,
  };
}
