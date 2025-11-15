// Deployed Contract Addresses on Arc Testnet
export const CONTRACTS = {
  VerificationSBT: "0x290d0662a9d7fb13a7470b68900fEFEC895cC6Ae",
  AgentController: "0x92CB8A9a5a73bAbAB4d7AB05cB9c49B862F60cbB",
  TreasuryPool: "0xE414cC94EcE2bB51344f40199580aff518d79494",
  LoanEngine: "0x09e3bAcD38C6E4bD46088650263c6e0ac9C4052c",
  TestUSDC: "0x3600000000000000000000000000000000000000", // Update with actual address
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
