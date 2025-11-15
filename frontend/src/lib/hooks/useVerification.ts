"use client";

import { useWallets } from "@privy-io/react-auth";
import { usePublicClient } from "wagmi";
import { CONTRACTS } from "@/config/contracts";
import VerificationSBTABI from "@/lib/abis/VerificationSBT.json";
import { createWalletClient, custom, defineChain } from "viem";

// Define Arc Testnet chain
const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
    public: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
});

export function useVerification() {
  const { wallets } = useWallets();
  const publicClient = usePublicClient();

  const walletAddress = wallets[0]?.address as `0x${string}` | undefined;

  /**
   * Check if user is verified
   */
  const isVerified = async (address?: string) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    const userAddress = (address || walletAddress) as `0x${string}`;
    if (!userAddress) {
      throw new Error("No address provided");
    }

    try {
      const verified = await publicClient.readContract({
        address: CONTRACTS.VerificationSBT as `0x${string}`,
        abi: VerificationSBTABI,
        functionName: "isVerified",
        args: [userAddress],
      });

      return verified as boolean;
    } catch (error) {
      console.error("Error checking verification:", error);
      return false;
    }
  };

  /**
   * Get user's token ID
   */
  const getTokenId = async (address?: string) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    const userAddress = (address || walletAddress) as `0x${string}`;
    if (!userAddress) {
      throw new Error("No address provided");
    }

    try {
      const tokenId = await publicClient.readContract({
        address: CONTRACTS.VerificationSBT as `0x${string}`,
        abi: VerificationSBTABI,
        functionName: "userToTokenId",
        args: [userAddress],
      });

      return Number(tokenId);
    } catch (error) {
      console.error("Error getting token ID:", error);
      return 0;
    }
  };

  /**
   * Get token URI (metadata)
   */
  const getTokenURI = async (tokenId: number) => {
    if (!publicClient) {
      throw new Error("Client not available");
    }

    try {
      const uri = await publicClient.readContract({
        address: CONTRACTS.VerificationSBT as `0x${string}`,
        abi: VerificationSBTABI,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
      });

      return uri as string;
    } catch (error) {
      console.error("Error getting token URI:", error);
      return "";
    }
  };

  /**
   * Mint SBT (user's wallet must have VERIFIER_ROLE)
   * NOTE: If user doesn't have VERIFIER_ROLE, this will fail.
   * For testing, you can grant VERIFIER_ROLE to your wallet in the contract.
   */
  const mintSBT = async (toAddress: string, metadataURI: string) => {
    // Get the connected wallet from Privy
    const wallet = wallets[0];

    if (!wallet) {
      throw new Error("Wallet not connected");
    }

    if (!walletAddress) {
      throw new Error("No wallet address");
    }

    if (!publicClient) {
      throw new Error("Public client not available");
    }

    try {
      // Get the Ethereum provider from Privy's wallet
      const ethereumProvider = await wallet.getEthereumProvider();

      if (!ethereumProvider) {
        throw new Error("Failed to get Ethereum provider from wallet");
      }

      // Check current chain and switch if needed
      const currentChainId = await ethereumProvider.request({
        method: "eth_chainId",
      });
      const currentChainIdNum = parseInt(currentChainId as string, 16);

      console.log("Current chain ID:", currentChainIdNum);
      console.log("Target chain ID:", arcTestnet.id);

      if (currentChainIdNum !== arcTestnet.id) {
        console.log("Switching to Arc Testnet...");
        try {
          // Try to switch to the network
          await ethereumProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${arcTestnet.id.toString(16)}` }],
          });
          console.log("Switched to Arc Testnet");
        } catch (switchError: unknown) {
          // This error code indicates that the chain has not been added to wallet
          const error = switchError as { code?: number };
          if (error.code === 4902) {
            console.log("Arc Testnet not added, adding now...");
            await ethereumProvider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${arcTestnet.id.toString(16)}`,
                  chainName: arcTestnet.name,
                  nativeCurrency: arcTestnet.nativeCurrency,
                  rpcUrls: [arcTestnet.rpcUrls.default.http[0]],
                  blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
                },
              ],
            });
            console.log("Arc Testnet added and switched");
          } else {
            throw switchError;
          }
        }
      }

      // Create viem wallet client with Privy's provider
      const walletClient = createWalletClient({
        account: walletAddress,
        chain: arcTestnet,
        transport: custom(ethereumProvider),
      });

      // Call mintSBT from user's wallet
      console.log("Minting SBT...", { toAddress, metadataURI });

      const hash = await walletClient.writeContract({
        address: CONTRACTS.VerificationSBT as `0x${string}`,
        abi: VerificationSBTABI,
        functionName: "mintSBT",
        args: [toAddress as `0x${string}`, metadataURI],
      });

      console.log("Transaction sent:", hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Transaction confirmed:", receipt);

      return {
        success: true,
        hash,
        receipt,
      };
    } catch (error: unknown) {
      console.error("Error minting SBT:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if it's a chain mismatch error
      if (errorMessage.includes("chain") || errorMessage.includes("Chain")) {
        throw new Error(
          "Please switch your wallet to Arc Testnet (Chain ID: 5042002). Your wallet should have prompted you to switch. If not, manually add Arc Testnet in your wallet settings."
        );
      }

      // Check if it's a role error
      if (
        errorMessage.includes("AccessControl") ||
        errorMessage.includes("VERIFIER_ROLE")
      ) {
        throw new Error(
          "Your wallet doesn't have VERIFIER_ROLE. Please grant this role to your wallet in the contract. See GRANT_VERIFIER_ROLE.md for instructions."
        );
      }

      // Check for user rejection
      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("rejected")
      ) {
        throw new Error("Transaction rejected by user");
      }

      throw error;
    }
  };

  return {
    isVerified,
    getTokenId,
    getTokenURI,
    mintSBT,
    walletAddress,
  };
}
