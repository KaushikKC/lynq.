"use client";

import { useState, useEffect } from "react";
import {
  FaSpinner,
  FaArrowDown,
  FaArrowUp,
  FaChartLine,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useWallets } from "@privy-io/react-auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import { useTreasury, useUSDC } from "@/lib/hooks";
import { CONTRACTS } from "@/config/contracts";

export default function Treasury() {
  const { wallets } = useWallets();
  const address = wallets[0]?.address;

  // Hooks - ONLY for transactions, NOT for reading data
  const { deposit, withdraw } = useTreasury();
  const { approve } = useUSDC();

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [userDeposits, setUserDeposits] = useState("0");

  // Real data from contracts
  const [totalLiquidity, setTotalLiquidity] = useState(0);
  const [availableLiquidity, setAvailableLiquidity] = useState(0);
  const [utilizationRate, setUtilizationRate] = useState(0);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // These will come from backend later
  const outstandingLoans = totalLiquidity - availableLiquidity;
  const defaultRate = 2.5; // TODO: Fetch from backend
  const apyProjection = 8.5; // TODO: Calculate based on utilization
  const activeLoans = 142; // TODO: Fetch from backend
  const defaultedLoans = 3; // TODO: Fetch from backend

  // Load treasury metrics FROM BACKEND (fast querying)
  useEffect(() => {
    const loadMetrics = async () => {
      if (!address) return;

      setIsLoadingMetrics(true);
      try {
        // Fetch ALL data from backend (NO RPC calls)
        const [metricsResponse, userResponse] = await Promise.all([
          fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/treasury/metrics`
          ),
          fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/user/${address}/summary`
          ),
        ]);

        const metricsData = await metricsResponse.json();
        const userData = await userResponse.json();

        console.log("📊 Backend Response:", { metricsData, userData });

        // Set treasury metrics
        if (metricsData.success && metricsData.data) {
          setTotalLiquidity(metricsData.data.totalLiquidity || 0);
          setAvailableLiquidity(metricsData.data.availableLiquidity || 0);
          setUtilizationRate(metricsData.data.utilization || 0);
        }

        // Set user data (balance and deposits from backend)
        if (userData.success && userData.data) {
          setUserDeposits(userData.data.treasuryDeposits?.toString() || "0");
          setUsdcBalance(userData.data.usdcBalance?.toString() || "0");
        }
      } catch (error) {
        console.error("Error loading treasury metrics:", error);
        // Fallback: If backend fails, just show 0
        setTotalLiquidity(0);
        setAvailableLiquidity(0);
        setUtilizationRate(0);
        setUsdcBalance("0");
        setUserDeposits("0");
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    loadMetrics();
  }, [address]);

  // Format large numbers with K suffix
  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Debug: Log formatted value
  useEffect(() => {
    console.log("💵 Formatted Total Liquidity:", formatAmount(totalLiquidity));
  }, [totalLiquidity]);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0 || !address) return;

    setIsDepositing(true);
    try {
      // Step 1: Approve USDC
      await approve(CONTRACTS.TreasuryPool, depositAmount);

      // Step 2: Deposit to treasury (user's wallet)
      const result = await deposit(depositAmount);

      if (result?.success) {
        setTxHash(result.hash);

        // Step 3: Save to backend
        try {
          await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/treasury/deposit`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                amount: parseFloat(depositAmount),
                txHash: result.hash,
                address: address, // User address for tracking
              }),
            }
          );
        } catch (backendError) {
          console.error("Error saving deposit to backend:", backendError);
        }

        setDepositAmount("");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);

        // Reload ALL data FROM BACKEND (NO RPC calls)
        const [metricsResponse, userResponse] = await Promise.all([
          fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/treasury/metrics`
          ),
          fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/user/${address}/summary`
          ),
        ]);

        const metricsData = await metricsResponse.json();
        const userData = await userResponse.json();

        if (metricsData.success && metricsData.data) {
          setTotalLiquidity(metricsData.data.totalLiquidity || 0);
          setAvailableLiquidity(metricsData.data.availableLiquidity || 0);
        }

        if (userData.success && userData.data) {
          setUserDeposits(userData.data.treasuryDeposits?.toString() || "0");
          setUsdcBalance(userData.data.usdcBalance?.toString() || "0");
        }
      } else {
        throw new Error("Deposit transaction failed");
      }
    } catch (error) {
      console.error("Error depositing:", error);
      alert(error instanceof Error ? error.message : "Failed to deposit");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !address) return;

    setIsWithdrawing(true);
    try {
      // Withdraw from treasury (user's wallet)
      const result = await withdraw(withdrawAmount);

      if (result?.success) {
        setTxHash(result.hash);

        // Save to backend
        try {
          await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/treasury/withdrawal`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                amount: parseFloat(withdrawAmount),
                txHash: result.hash,
                address: address, // User address for tracking
              }),
            }
          );
        } catch (backendError) {
          console.error("Error saving withdrawal to backend:", backendError);
        }

        setWithdrawAmount("");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);

        // Reload ALL data FROM BACKEND (NO RPC calls)
        const [metricsResponse, userResponse] = await Promise.all([
          fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/treasury/metrics`
          ),
          fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/user/${address}/summary`
          ),
        ]);

        const metricsData = await metricsResponse.json();
        const userData = await userResponse.json();

        if (metricsData.success && metricsData.data) {
          setTotalLiquidity(metricsData.data.totalLiquidity || 0);
          setAvailableLiquidity(metricsData.data.availableLiquidity || 0);
        }

        if (userData.success && userData.data) {
          setUserDeposits(userData.data.treasuryDeposits?.toString() || "0");
          setUsdcBalance(userData.data.usdcBalance?.toString() || "0");
        }
      } else {
        throw new Error("Withdrawal transaction failed");
      }
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert(error instanceof Error ? error.message : "Failed to withdraw");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="text-sm text-[#8E8E8E] uppercase tracking-wider font-medium mb-2">
              Treasury Pool
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Lending Pool Health
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Public treasury metrics and deposit/withdraw functionality for
              liquidity providers.
            </p>
          </div>

          {/* User Stats */}
          {address && (
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="text-sm text-[#8E8E8E] mb-1">Your Deposits</div>
                <div className="text-3xl font-extrabold text-[#0C0C0C]">
                  {parseFloat(userDeposits).toFixed(2)} USDC
                </div>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
                <div className="text-sm text-[#8E8E8E] mb-1">Your Balance</div>
                <div className="text-3xl font-extrabold text-[#0C0C0C]">
                  {parseFloat(usdcBalance).toFixed(2)} USDC
                </div>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
                <div className="text-sm text-[#8E8E8E] mb-1">
                  Est. Annual Yield
                </div>
                <div className="text-3xl font-extrabold text-[#0C0C0C]">
                  {((parseFloat(userDeposits) * apyProjection) / 100).toFixed(
                    2
                  )}{" "}
                  USDC
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          {isLoadingMetrics ? (
            <div className="text-center py-12 mb-8">
              <FaSpinner className="w-8 h-8 animate-spin mx-auto text-[#FFD93D] mb-4" />
              <p className="text-[#8E8E8E]">Loading treasury metrics...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <div className="text-sm font-medium text-[#8E8E8E] uppercase tracking-wide mb-2">
                  Total Liquidity
                </div>
                <div className="text-3xl font-extrabold font-heading text-[#0C0C0C]">
                  {formatAmount(totalLiquidity)}
                </div>
                <div className="text-xs text-[#8E8E8E] mt-1">USDC</div>
              </div>
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <div className="text-sm font-medium text-[#8E8E8E] uppercase tracking-wide mb-2">
                  Utilization Rate
                </div>
                <div className="text-3xl font-extrabold font-heading text-[#0C0C0C]">
                  {utilizationRate}%
                </div>
                <div className="w-full bg-[#EDEDED] rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-[#FFD93D] to-[#FFC700] h-full rounded-full"
                    style={{ width: `${utilizationRate}%` }}
                  />
                </div>
              </div>
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <div className="text-sm font-medium text-[#8E8E8E] uppercase tracking-wide mb-2">
                  Outstanding Loans
                </div>
                <div className="text-3xl font-extrabold font-heading text-[#0C0C0C]">
                  {formatAmount(outstandingLoans)}
                </div>
                <div className="text-xs text-[#8E8E8E] mt-1">USDC</div>
              </div>
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <div className="text-sm font-medium text-[#8E8E8E] uppercase tracking-wide mb-2">
                  Default Rate
                </div>
                <div className="text-3xl font-extrabold font-heading text-[#0C0C0C]">
                  {defaultRate}%
                </div>
                <div className="text-xs text-[#8E8E8E] mt-1">Low risk</div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* APY & Deposit/Withdraw */}
            <div className="lg:col-span-2 space-y-6">
              {/* APY Projection */}
              <div className="bg-gradient-to-br from-[#FFD93D] to-[#FFC700] rounded-2xl p-8 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium text-[#0C0C0C]/70 uppercase tracking-wide mb-2">
                      APY Projection
                    </div>
                    <div className="text-5xl font-extrabold font-heading text-[#0C0C0C]">
                      {apyProjection}%
                    </div>
                    <div className="text-sm text-[#0C0C0C]/70 mt-2">
                      Estimated annual yield for depositors
                    </div>
                  </div>
                  <FaChartLine className="w-12 h-12 text-[#0C0C0C]/30" />
                </div>
              </div>

              {/* Deposit Section */}
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-extrabold font-heading text-[#0C0C0C] mb-4">
                  Deposit USDC
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-5 py-4 pr-20 rounded-2xl border-2 border-[#EDEDED] text-[#0C0C0C] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#FFD93D] focus:border-transparent transition-all"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8E8E8E]">
                      USDC
                    </div>
                  </div>
                  <button
                    onClick={handleDeposit}
                    disabled={
                      !depositAmount ||
                      isDepositing ||
                      parseFloat(depositAmount) <= 0
                    }
                    className="w-full bg-[#FFD93D] hover:bg-[#FFC700] disabled:bg-[#EDEDED] disabled:text-[#8E8E8E] text-[#0C0C0C] px-8 py-4 rounded-2xl font-extrabold transition-colors uppercase tracking-wide flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                  >
                    {isDepositing ? (
                      <>
                        <FaSpinner className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FaArrowDown className="w-5 h-5" />
                        <span>Deposit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Withdraw Section */}
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-extrabold font-heading text-[#0C0C0C] mb-4">
                  Withdraw USDC
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-5 py-4 pr-20 rounded-2xl border-2 border-[#EDEDED] text-[#0C0C0C] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#FFD93D] focus:border-transparent transition-all"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8E8E8E]">
                      USDC
                    </div>
                  </div>
                  <button
                    onClick={handleWithdraw}
                    disabled={
                      !withdrawAmount ||
                      isWithdrawing ||
                      parseFloat(withdrawAmount) <= 0
                    }
                    className="w-full bg-transparent border-2 border-[#0C0C0C] hover:bg-[#0C0C0C] hover:text-white disabled:border-[#EDEDED] disabled:text-[#8E8E8E] text-[#0C0C0C] px-8 py-4 rounded-2xl font-extrabold transition-colors uppercase tracking-wide flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                  >
                    {isWithdrawing ? (
                      <>
                        <FaSpinner className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FaArrowUp className="w-5 h-5" />
                        <span>Withdraw</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Risk Dashboard */}
            <div className="space-y-6">
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-extrabold font-heading text-[#0C0C0C] mb-4">
                  Risk Dashboard
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#F6F6F6] rounded-xl">
                    <div>
                      <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                        Active Loans
                      </div>
                      <div className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                        {activeLoans}
                      </div>
                    </div>
                    <FaChartLine className="w-8 h-8 text-[#00D26A]" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F6F6F6] rounded-xl">
                    <div>
                      <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                        Defaulted Loans
                      </div>
                      <div className="text-2xl font-extrabold font-heading text-[#FF6B6B]">
                        {defaultedLoans}
                      </div>
                    </div>
                    <FaExclamationTriangle className="w-8 h-8 text-[#FF6B6B]" />
                  </div>
                  <div className="p-4 bg-[#00D26A]/10 border-2 border-[#00D26A] rounded-xl">
                    <div className="text-xs font-semibold text-[#00D26A] mb-1">
                      Health Status
                    </div>
                    <div className="text-lg font-extrabold font-heading text-[#0C0C0C]">
                      Healthy
                    </div>
                    <div className="text-xs text-[#8E8E8E] mt-1">
                      Low default rate indicates stable pool
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Toast */}
      {showSuccessToast && (
        <Toast
          type="success"
          title="Success !"
          message="Transaction processed successfully!"
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      <Footer />
    </div>
  );
}
