"use client";

import { useWalletClient, usePublicClient } from "wagmi";
import { getContract } from "viem";
import { CONTRACTS } from "@/config/contracts";

// Import ABIs
import LoanEngineABI from "@/lib/abis/LoanEngine.json";
import TreasuryPoolABI from "@/lib/abis/TreasuryPool.json";
import AgentControllerABI from "@/lib/abis/AgentController.json";
import VerificationSBTABI from "@/lib/abis/VerificationSBT.json";
import TestUSDCABI from "@/lib/abis/TestUSDC.json";

/**
 * Hook to get contract instances with Wagmi/Viem
 * Returns contracts ready to use with your Privy wallet
 */
export function useContracts() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Read-only contracts (using public client)
  const readContracts = {
    loanEngine: publicClient
      ? getContract({
          address: CONTRACTS.LoanEngine as `0x${string}`,
          abi: LoanEngineABI,
          client: publicClient,
        })
      : null,
    treasuryPool: publicClient
      ? getContract({
          address: CONTRACTS.TreasuryPool as `0x${string}`,
          abi: TreasuryPoolABI,
          client: publicClient,
        })
      : null,
    agentController: publicClient
      ? getContract({
          address: CONTRACTS.AgentController as `0x${string}`,
          abi: AgentControllerABI,
          client: publicClient,
        })
      : null,
    verificationSBT: publicClient
      ? getContract({
          address: CONTRACTS.VerificationSBT as `0x${string}`,
          abi: VerificationSBTABI,
          client: publicClient,
        })
      : null,
    testUSDC: publicClient
      ? getContract({
          address: CONTRACTS.TestUSDC as `0x${string}`,
          abi: TestUSDCABI,
          client: publicClient,
        })
      : null,
  };

  // Write contracts (using wallet client for transactions)
  const writeContracts = {
    loanEngine:
      publicClient && walletClient
        ? getContract({
            address: CONTRACTS.LoanEngine as `0x${string}`,
            abi: LoanEngineABI,
            client: { public: publicClient, wallet: walletClient },
          })
        : null,
    treasuryPool:
      publicClient && walletClient
        ? getContract({
            address: CONTRACTS.TreasuryPool as `0x${string}`,
            abi: TreasuryPoolABI,
            client: { public: publicClient, wallet: walletClient },
          })
        : null,
    agentController:
      publicClient && walletClient
        ? getContract({
            address: CONTRACTS.AgentController as `0x${string}`,
            abi: AgentControllerABI,
            client: { public: publicClient, wallet: walletClient },
          })
        : null,
    verificationSBT:
      publicClient && walletClient
        ? getContract({
            address: CONTRACTS.VerificationSBT as `0x${string}`,
            abi: VerificationSBTABI,
            client: { public: publicClient, wallet: walletClient },
          })
        : null,
    testUSDC:
      publicClient && walletClient
        ? getContract({
            address: CONTRACTS.TestUSDC as `0x${string}`,
            abi: TestUSDCABI,
            client: { public: publicClient, wallet: walletClient },
          })
        : null,
  };

  return {
    read: readContracts,
    write: writeContracts,
    isReady: !!publicClient,
    canWrite: !!walletClient,
  };
}

/**
 * Hook to get a specific contract
 */
export function useContract(contractName: keyof typeof CONTRACTS) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const ABIs = {
    LoanEngine: LoanEngineABI,
    TreasuryPool: TreasuryPoolABI,
    AgentController: AgentControllerABI,
    VerificationSBT: VerificationSBTABI,
    TestUSDC: TestUSDCABI,
  };

  const address = CONTRACTS[contractName] as `0x${string}`;
  const abi = ABIs[contractName];

  const readContract = publicClient
    ? getContract({
        address,
        abi,
        client: publicClient,
      })
    : null;

  const writeContract =
    publicClient && walletClient
      ? getContract({
          address,
          abi,
          client: { public: publicClient, wallet: walletClient },
        })
      : null;

  return {
    read: readContract,
    write: writeContract,
    address,
    isReady: !!publicClient,
    canWrite: !!walletClient,
  };
}
