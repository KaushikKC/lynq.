"use client";

import { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { usePublicClient, useWalletClient } from "wagmi";
import { parseUnits } from "viem";
import { withRetry } from "@/lib/utils/rpcRetry";

// Standard ERC20 ABI for approve function
const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useToken() {
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Approve any ERC20 token
   * @param tokenAddress Token contract address
   * @param spender Address to approve (e.g., LoanEngine)
   * @param amount Amount to approve (in token's native decimals, usually 6 for stablecoins)
   * @param decimals Token decimals (default 6 for USDC/EURC/USYC)
   */
  const approveToken = async (
    tokenAddress: string,
    spender: string,
    amount: string,
    decimals: number = 6
  ) => {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      const amountInWei = parseUnits(amount, decimals);

      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spender as `0x${string}`, amountInWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { hash, receipt, success: receipt.status === "success" };
    } catch (error: any) {
      console.error("Error approving token:", error);

      if (
        error?.message?.includes("rate limit") ||
        error?.message?.includes("exceeds defined limit")
      ) {
        throw new Error(
          "RPC rate limit exceeded. Please wait a few seconds and try again."
        );
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    approveToken,
    isLoading,
  };
}
