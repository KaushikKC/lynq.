// Deployed Contract Addresses on Arc Testnet
export const CONTRACTS = {
  VerificationSBT: "0x290d0662a9d7fb13a7470b68900fEFEC895cC6Ae",
  AgentController: "0x92CB8A9a5a73bAbAB4d7AB05cB9c49B862F60cbB",
  TreasuryPool: "0xBa8B99fcBF8FF2861D01d22E4C604b164887E259",
  LoanEngine: "0x02D3aD867FFc93C424804563a4ed186eF2c433bd",
  TestUSDC: "0x3600000000000000000000000000000000000000",
  TestEURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", // Euro Coin for testing
  TestUSYC: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C", // Add your deployed USYC address here
  MultiCurrencyManager: "0x77F8B6dAe75Cf9CBC0c426567340DA4a5b67Af3b",
  GatewayManager: "0x2f98a71ebe762e9a30db9d845d1f8B6af267E2FB",
} as const;

// Arc Testnet Configuration (matching your Privy setup)
export const NETWORK_CONFIG = {
  chainId: 5042002, // Arc Testnet Chain ID
  chainIdHex: "0x4CB2F2",
  chainName: "Arc Testnet",
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
} as const;

// Backend API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
} as const;
