// Deployed Contract Addresses on Arc Testnet
export const CONTRACTS = {
  VerificationSBT: "0x290d0662a9d7fb13a7470b68900fEFEC895cC6Ae",
  AgentController: "0x92CB8A9a5a73bAbAB4d7AB05cB9c49B862F60cbB",
  TreasuryPool: "0xe72d3Ba61852302670139648ee70E193c49085B2",
  LoanEngine: "0x660D0bf91fCDd5dD4172c3e3D368198B277Ca679",
  TestUSDC: "0x3600000000000000000000000000000000000000",
  TestEURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", // Euro Coin for testing
  TestUSYC: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C", // Add your deployed USYC address here
  MultiCurrencyManager: "0x3049EB4d4FdAf0B1b4e565e3C790535039256CC7",
  GatewayManager: "0x4b92aD7fb2f98dF94E66C947005ee10142BB9b36",
} as const;

// Arc Testnet Configuration (matching your Privy setup)
// Get RPC URL from environment variable (defaults to public Arc Testnet)
const RPC_URL =
  process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";

export const NETWORK_CONFIG = {
  chainId: 5042002, // Arc Testnet Chain ID
  chainIdHex: "0x4CB2F2",
  chainName: "Arc Testnet",
  rpcUrls: [RPC_URL],
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
