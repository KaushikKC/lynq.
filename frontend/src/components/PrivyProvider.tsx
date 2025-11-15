"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { createConfig } from "wagmi";

// Get RPC URL from environment variable (defaults to public Arc Testnet)
const RPC_URL =
  process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";

// Debug: Log which RPC is being used (client-side too)
if (typeof window !== "undefined") {
  // Client-side logging
  console.log("🔗 Frontend RPC URL:", RPC_URL);
  console.log(
    "🔗 Env variable value:",
    process.env.NEXT_PUBLIC_ARC_RPC_URL || "NOT SET"
  );
  console.log(
    "🔗 Full RPC URL (masked):",
    RPC_URL.replace(/\/v2\/[^/]+/, "/v2/***")
  );
}

// Configure Arc Testnet with Chain ID 5042002
const customChain = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
} as const;

// Create wagmi config with custom RPC URL
const wagmiConfig = createConfig({
  chains: [customChain],
  transports: {
    [customChain.id]: http(RPC_URL),
  },
});

const queryClient = new QueryClient();

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProviderBase
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["wallet", "email", "sms", "google", "twitter", "github"],
        appearance: {
          theme: "light",
          accentColor: "#FFD93D",
          logo: "/logo.png",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: customChain,
        supportedChains: [customChain],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProviderBase>
  );
}
