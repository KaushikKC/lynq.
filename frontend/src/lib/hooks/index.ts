/**
 * Contract and API Hooks
 *
 * Import all hooks from a single location:
 * import { useLoan, useUSDC, useVerification } from "@/lib/hooks";
 */

// Contract hooks
export { useContracts, useContract } from "./useContracts";
export { useLoan } from "./useLoan";
export { useUSDC } from "./useUSDC";
export { useToken } from "./useToken";
export { useVerification } from "./useVerification";
export { useTreasury } from "./useTreasury";

// API hooks
export { useAPI, useUserAPI, useLoanAPI, useTreasuryAPI } from "./useAPI";
