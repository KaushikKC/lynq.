// Deployed Contract Addresses on Arc Testnet
export const CONTRACTS = {
  VerificationSBT: "0x2D5A0Ee039A2eC9331018035be508E34dAbb2958",
  AgentController: "0x405A688E1C05dB9dee85A695F008e6926859aC4c",
  TreasuryPool: "0x4FdF07fEce136bf05c63Bd77FF8Fc9d6f04cF301",
  LoanEngine: "0xEC4BEA60368f3aB46355CE1f1F0D2e67B2377022",
  TestUSDC: "0x3600000000000000000000000000000000000000",
  TestEURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", // Euro Coin for testing
  TestUSYC: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C", // Add your deployed USYC address here
  MultiCurrencyManager: "0x9Ced052cAD68ae68CaE1A589edC8422608A0126e",
  GatewayManager: "0x439153faf87CaBb9Ba5C7a5602028F242fd02E33",
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
