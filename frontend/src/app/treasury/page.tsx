"use client";

import { useState, useEffect } from "react";
import {
  FaSpinner,
  FaArrowDown,
  FaArrowUp,
  FaChartLine,
  FaExclamationTriangle,
  FaChartPie,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaGlobe,
  FaNetworkWired,
  FaFire,
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

  // Treasury Admin States
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [supportedCurrencies, setSupportedCurrencies] = useState<any[]>([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

  // Allocation Form
  const [allocationName, setAllocationName] = useState("");
  const [allocationPercentage, setAllocationPercentage] = useState("");
  const [allocationDestination, setAllocationDestination] = useState("");

  // Distribution Form
  const [distRecipients, setDistRecipients] = useState("");
  const [distAmounts, setDistAmounts] = useState("");
  const [distFrequency, setDistFrequency] = useState("2592000"); // 30 days

  // Gateway States
  const [gatewayStats, setGatewayStats] = useState<any>(null);
  const [unifiedBalance, setUnifiedBalance] = useState("0");
  const [gatewayDepositAmount, setGatewayDepositAmount] = useState("");
  const [isDepositingToGateway, setIsDepositingToGateway] = useState(false);
  const [burnAmount, setBurnAmount] = useState("");
  const [destinationChainId, setDestinationChainId] = useState("1");
  const [isCreatingBurnIntent, setIsCreatingBurnIntent] = useState(false);
  const [gatewayTxHash, setGatewayTxHash] = useState("");
  const [gatewaySuccessMessage, setGatewaySuccessMessage] = useState("");

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

  // Load Gateway Data
  const loadGatewayData = async () => {
    if (!address) return;

    try {
      const [statsResponse, balanceResponse] = await Promise.all([
        fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/gateway/stats`
        ),
        fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/gateway/balance/${address}`
        ),
      ]);

      const statsData = await statsResponse.json();
      const balanceData = await balanceResponse.json();

      if (statsData.success && statsData.data) {
        setGatewayStats(statsData.data);
      }

      if (balanceData.success && balanceData.data) {
        setUnifiedBalance(balanceData.data.unifiedBalance || "0");
      }
    } catch (error) {
      console.error("Error loading Gateway data:", error);
    }
  };

  // Handle Gateway Deposit
  const handleGatewayDeposit = async () => {
    if (
      !gatewayDepositAmount ||
      parseFloat(gatewayDepositAmount) <= 0 ||
      !address
    )
      return;

    setIsDepositingToGateway(true);
    try {
      // First, approve USDC for Gateway Manager
      const gatewayManagerAddress =
        gatewayStats?.gatewayAddress || CONTRACTS.GatewayManager;
      if (!gatewayManagerAddress) {
        throw new Error("Gateway Manager address not found");
      }

      const amountInWei = (parseFloat(gatewayDepositAmount) * 1e6).toString();
      await approve(gatewayManagerAddress, gatewayDepositAmount);

      // Then deposit via API
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        }/gateway/deposit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseFloat(gatewayDepositAmount),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setGatewayDepositAmount("");
        setGatewayTxHash(data.data?.txHash || data.data?.hash || "");
        setGatewaySuccessMessage(
          `Successfully deposited ${gatewayDepositAmount} USDC to Gateway!`
        );
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
          setGatewayTxHash("");
          setGatewaySuccessMessage("");
        }, 5000);
        // Reload Gateway data
        await loadGatewayData();
        // Reload user balance
        const userResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/user/${address}/summary`
        );
        const userData = await userResponse.json();
        if (userData.success && userData.data) {
          setUsdcBalance(userData.data.usdcBalance?.toString() || "0");
        }
      } else {
        throw new Error(data.error || "Gateway deposit failed");
      }
    } catch (error) {
      console.error("Error depositing to Gateway:", error);
      alert(
        error instanceof Error ? error.message : "Failed to deposit to Gateway"
      );
    } finally {
      setIsDepositingToGateway(false);
    }
  };

  // Handle Burn Intent Creation
  const handleCreateBurnIntent = async () => {
    if (!burnAmount || parseFloat(burnAmount) <= 0) return;

    setIsCreatingBurnIntent(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        }/gateway/burn-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseFloat(burnAmount),
            destinationChainId: parseInt(destinationChainId),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const messageHash = data.data?.messageHash || data.data?.txHash || "";
        setBurnAmount("");
        setGatewayTxHash(messageHash);
        setGatewaySuccessMessage(
          `Burn intent created successfully! Cross-chain transfer initiated.`
        );
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
          setGatewayTxHash("");
          setGatewaySuccessMessage("");
        }, 5000);
        // Reload Gateway data
        await loadGatewayData();
      } else {
        throw new Error(data.error || "Failed to create burn intent");
      }
    } catch (error) {
      console.error("Error creating burn intent:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create burn intent"
      );
    } finally {
      setIsCreatingBurnIntent(false);
    }
  };

  // Load Treasury Admin Data
  const loadAdminData = async () => {
    setIsLoadingAdmin(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

      const [allocRes, distRes, currRes] = await Promise.all([
        fetch(`${apiUrl}/treasury/allocations`),
        fetch(`${apiUrl}/treasury/distributions`),
        fetch(`${apiUrl}/currency/supported`),
      ]);

      const [allocData, distData, currData] = await Promise.all([
        allocRes.json(),
        distRes.json(),
        currRes.json(),
      ]);

      if (allocData.success) setAllocations(allocData.data || []);
      if (distData.success) setDistributions(distData.data || []);
      if (currData.success) setSupportedCurrencies(currData.data || []);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  // Create Allocation
  const handleCreateAllocation = async () => {
    if (!allocationName || !allocationPercentage || !allocationDestination) {
      alert("Please fill all allocation fields");
      return;
    }

    setIsLoadingAdmin(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        }/treasury/allocation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: allocationName,
            percentage: parseInt(allocationPercentage),
            destination: allocationDestination,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        setAllocationName("");
        setAllocationPercentage("");
        setAllocationDestination("");
        await loadAdminData();
      } else {
        alert(
          "Failed to create allocation: " + (data.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error creating allocation:", error);
      alert("Failed to create allocation");
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  // Execute Allocations
  const handleExecuteAllocations = async () => {
    setIsLoadingAdmin(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        }/treasury/execute-allocations`,
        { method: "POST" }
      );

      const data = await response.json();
      if (data.success) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);

        // Wait 1 second before reloading to avoid RPC rate limits
        // The backend also adds a 500ms delay, so total is ~1.5s
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await loadAdminData();
      } else {
        alert(
          "Failed to execute allocations: " + (data.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error executing allocations:", error);
      alert("Failed to execute allocations");
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  // Schedule Distribution
  const handleScheduleDistribution = async () => {
    if (!distRecipients || !distAmounts) {
      alert("Please fill distribution fields");
      return;
    }

    setIsLoadingAdmin(true);
    try {
      const recipients = distRecipients.split(",").map((r) => r.trim());
      const amounts = distAmounts.split(",").map((a) => parseFloat(a.trim()));

      if (recipients.length !== amounts.length) {
        alert("Number of recipients must match number of amounts");
        return;
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        }/treasury/schedule-distribution`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients,
            amounts,
            frequency: parseInt(distFrequency),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        setDistRecipients("");
        setDistAmounts("");
        await loadAdminData();
      } else {
        alert(
          "Failed to schedule distribution: " + (data.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error scheduling distribution:", error);
      alert("Failed to schedule distribution");
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  // Execute Distributions
  const handleExecuteDistributions = async () => {
    setIsLoadingAdmin(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        }/treasury/execute-distributions`,
        { method: "POST" }
      );

      const data = await response.json();
      if (data.success) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);

        // Wait 1 second before reloading to avoid RPC rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await loadAdminData();
      } else {
        alert(
          "Failed to execute distributions: " + (data.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error executing distributions:", error);
      alert("Failed to execute distributions");
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
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
              <button
                onClick={() => {
                  setShowAdminPanel(!showAdminPanel);
                  if (!showAdminPanel) {
                    loadAdminData();
                    loadGatewayData();
                  }
                }}
                className="bg-gradient-to-r from-[#FFD93D] to-[#FFC700] hover:from-[#FFC700] hover:to-[#FFD93D] text-[#0C0C0C] px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <FaChartPie className="w-5 h-5" />
                {showAdminPanel ? "Hide Admin" : "Treasury Admin"}
              </button>
            </div>
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

          {/* Treasury Admin Panel */}
          {showAdminPanel && (
            <div className="mb-8 space-y-6">
              {/* Multi-Currency Support */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaGlobe className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                    Multi-Currency Support
                  </h2>
                </div>
                {isLoadingAdmin ? (
                  <FaSpinner className="w-6 h-6 animate-spin text-purple-600" />
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {supportedCurrencies.map((currency, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 shadow">
                        <div className="text-lg font-bold text-[#0C0C0C]">
                          {currency.symbol || "Unknown"}
                        </div>
                        <div className="text-sm text-[#8E8E8E]">
                          {currency.rateDisplay || `Rate: ${currency.rate}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget Allocations */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FaChartPie className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                      Budget Allocations
                    </h2>
                  </div>
                  <button
                    onClick={handleExecuteAllocations}
                    disabled={isLoadingAdmin}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                  >
                    {isLoadingAdmin ? (
                      <FaSpinner className="w-4 h-4 animate-spin" />
                    ) : (
                      "Execute Allocations"
                    )}
                  </button>
                </div>

                {/* Create Allocation Form */}
                <div className="bg-white rounded-xl p-4 mb-4 space-y-3">
                  <h3 className="font-bold text-[#0C0C0C]">
                    Create New Allocation
                  </h3>
                  <div className="grid md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Name (e.g., High-Risk Loans)"
                      value={allocationName}
                      onChange={(e) => setAllocationName(e.target.value)}
                      className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Percentage (0-100)"
                      value={allocationPercentage}
                      onChange={(e) => setAllocationPercentage(e.target.value)}
                      className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Destination Address"
                      value={allocationDestination}
                      onChange={(e) => setAllocationDestination(e.target.value)}
                      className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={handleCreateAllocation}
                      disabled={isLoadingAdmin}
                      className="bg-[#FFD93D] hover:bg-[#FFC700] disabled:bg-gray-300 text-[#0C0C0C] px-4 py-2 rounded-lg font-bold transition-colors"
                    >
                      {isLoadingAdmin ? "..." : "Create"}
                    </button>
                  </div>
                </div>

                {/* List Allocations */}
                {isLoadingAdmin ? (
                  <FaSpinner className="w-6 h-6 animate-spin text-blue-600" />
                ) : allocations.length > 0 ? (
                  <div className="space-y-2">
                    {allocations.map((alloc) => (
                      <div
                        key={alloc.id}
                        className="bg-white rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-[#0C0C0C]">
                            {alloc.name}
                          </div>
                          <div className="text-sm text-[#8E8E8E]">
                            {alloc.percentage}% →{" "}
                            {alloc.destination?.slice(0, 10)}...
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-[#8E8E8E]">
                            Allocated
                          </div>
                          <div className="font-bold text-[#0C0C0C]">
                            {alloc.allocated || 0} USDC
                          </div>
                        </div>
                        <div
                          className={`ml-4 px-3 py-1 rounded-full text-xs font-bold ${
                            alloc.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {alloc.active ? "Active" : "Inactive"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-[#8E8E8E] py-4">
                    No allocations yet. Create one above!
                  </div>
                )}
              </div>

              {/* Scheduled Distributions (Payroll) */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FaCalendarAlt className="w-6 h-6 text-green-600" />
                    <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                      Scheduled Distributions
                    </h2>
                  </div>
                  <button
                    onClick={handleExecuteDistributions}
                    disabled={isLoadingAdmin}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                  >
                    {isLoadingAdmin ? (
                      <FaSpinner className="w-4 h-4 animate-spin" />
                    ) : (
                      "Execute Distributions"
                    )}
                  </button>
                </div>

                {/* Schedule Distribution Form */}
                <div className="bg-white rounded-xl p-4 mb-4 space-y-3">
                  <h3 className="font-bold text-[#0C0C0C]">
                    Schedule New Distribution
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Recipients (comma-separated addresses)"
                      value={distRecipients}
                      onChange={(e) => setDistRecipients(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Amounts (comma-separated, e.g., 5,10,5)"
                      value={distAmounts}
                      onChange={(e) => setDistAmounts(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                    />
                    <div className="flex gap-3">
                      <select
                        value={distFrequency}
                        onChange={(e) => setDistFrequency(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                      >
                        <option value="60">Every 60 seconds (testing)</option>
                        <option value="86400">Daily (24 hours)</option>
                        <option value="604800">Weekly (7 days)</option>
                        <option value="2592000">Monthly (30 days)</option>
                      </select>
                      <button
                        onClick={handleScheduleDistribution}
                        disabled={isLoadingAdmin}
                        className="bg-[#FFD93D] hover:bg-[#FFC700] disabled:bg-gray-300 text-[#0C0C0C] px-6 py-2 rounded-lg font-bold transition-colors"
                      >
                        {isLoadingAdmin ? "..." : "Schedule"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* List Distributions */}
                {isLoadingAdmin ? (
                  <FaSpinner className="w-6 h-6 animate-spin text-green-600" />
                ) : distributions.length > 0 ? (
                  <div className="space-y-2">
                    {distributions.map((dist) => (
                      <div key={dist.id} className="bg-white rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-[#0C0C0C]">
                            Distribution #{dist.id}
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              dist.active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {dist.active ? "Active" : "Inactive"}
                          </div>
                        </div>
                        <div className="text-sm text-[#8E8E8E]">
                          {dist.recipients?.length || 0} recipients • Total:{" "}
                          {dist.amounts?.reduce(
                            (a: number, b: number) => a + b,
                            0
                          ) || 0}{" "}
                          USDC •
                          {dist.daysUntilNext !== undefined
                            ? ` Next in ${dist.daysUntilNext} days`
                            : " Frequency: " + (dist.frequency || 0) + "s"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-[#8E8E8E] py-4">
                    No distributions yet. Schedule one above!
                  </div>
                )}
              </div>

              {/* Circle Gateway Integration */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaNetworkWired className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                    Circle Gateway Integration
                  </h2>
                </div>
                <p className="text-sm text-[#8E8E8E] mb-6">
                  Unified USDC balance across chains. Deposit to Gateway Wallet
                  for cross-chain transfers.
                </p>

                {/* Gateway Stats */}
                {gatewayStats && (
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow">
                      <div className="text-sm text-[#8E8E8E] mb-1">
                        Gateway Address
                      </div>
                      <div className="text-xs font-mono text-[#0C0C0C] break-all">
                        {gatewayStats.gatewayAddress || "N/A"}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow">
                      <div className="text-sm text-[#8E8E8E] mb-1">
                        Total Unified Liquidity
                      </div>
                      <div className="text-lg font-bold text-[#0C0C0C]">
                        {parseFloat(
                          gatewayStats.totalUnifiedLiquidity || "0"
                        ).toFixed(2)}{" "}
                        USDC
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow">
                      <div className="text-sm text-[#8E8E8E] mb-1">
                        Your Unified Balance
                      </div>
                      <div className="text-lg font-bold text-[#0C0C0C]">
                        {parseFloat(unifiedBalance).toFixed(2)} USDC
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow">
                      <div className="text-sm text-[#8E8E8E] mb-1">
                        Chain ID
                      </div>
                      <div className="text-lg font-bold text-[#0C0C0C]">
                        {gatewayStats.chainId || "N/A"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Deposit to Gateway */}
                <div className="bg-white rounded-xl p-4 mb-4 border-2 border-blue-100">
                  <h3 className="text-lg font-bold text-[#0C0C0C] mb-3">
                    Deposit to Gateway
                  </h3>
                  <p className="text-xs text-[#8E8E8E] mb-3">
                    Deposit USDC to Gateway Wallet for unified cross-chain
                    balance. Requires USDC approval first.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount (USDC)"
                      value={gatewayDepositAmount}
                      onChange={(e) => setGatewayDepositAmount(e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-[#EDEDED] rounded-lg focus:outline-none focus:border-blue-500"
                      step="0.01"
                      min="0"
                    />
                    <button
                      onClick={handleGatewayDeposit}
                      disabled={
                        !gatewayDepositAmount ||
                        parseFloat(gatewayDepositAmount) <= 0 ||
                        isDepositingToGateway
                      }
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      {isDepositingToGateway ? (
                        <>
                          <FaSpinner className="w-4 h-4 animate-spin" />
                          Depositing...
                        </>
                      ) : (
                        <>
                          <FaArrowDown className="w-4 h-4" />
                          Deposit
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Create Burn Intent */}
                <div className="bg-white rounded-xl p-4 border-2 border-cyan-100">
                  <h3 className="text-lg font-bold text-[#0C0C0C] mb-3">
                    Create Burn Intent (Cross-Chain Transfer)
                  </h3>
                  <p className="text-xs text-[#8E8E8E] mb-3">
                    Create a burn intent to transfer USDC to another chain via
                    Circle Gateway attestation.
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount (USDC)"
                        value={burnAmount}
                        onChange={(e) => setBurnAmount(e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-[#EDEDED] rounded-lg focus:outline-none focus:border-cyan-500"
                        step="0.01"
                        min="0"
                      />
                      <input
                        type="number"
                        placeholder="Destination Chain ID"
                        value={destinationChainId}
                        onChange={(e) => setDestinationChainId(e.target.value)}
                        className="w-40 px-4 py-2 border-2 border-[#EDEDED] rounded-lg focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <button
                      onClick={handleCreateBurnIntent}
                      disabled={
                        !burnAmount ||
                        parseFloat(burnAmount) <= 0 ||
                        !destinationChainId ||
                        isCreatingBurnIntent
                      }
                      className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {isCreatingBurnIntent ? (
                        <>
                          <FaSpinner className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <FaFire className="w-4 h-4" />
                          Create Burn Intent
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <div className="text-xs font-semibold text-cyan-800 mb-1">
                      💡 How it works:
                    </div>
                    <ul className="text-xs text-cyan-700 space-y-1">
                      <li>
                        • Deposit USDC to Gateway Wallet (unified balance)
                      </li>
                      <li>• Create burn intent to transfer to another chain</li>
                      <li>• Circle Gateway handles cross-chain attestation</li>
                      <li>
                        • USDC is minted on destination chain via Gateway API
                      </li>
                    </ul>
                  </div>
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
          message={
            gatewaySuccessMessage || "Transaction processed successfully!"
          }
          txHash={gatewayTxHash || txHash}
          onClose={() => {
            setShowSuccessToast(false);
            setGatewayTxHash("");
            setGatewaySuccessMessage("");
          }}
        />
      )}

      <Footer />
    </div>
  );
}
