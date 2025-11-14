"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaCheckCircle, FaSpinner, FaWallet } from "react-icons/fa";
import { useWallets } from "@privy-io/react-auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import { useLoan, useUSDC, useVerification } from "@/lib/hooks";
import { useUserAPI } from "@/lib/hooks/useAPI";
import { CONTRACTS } from "@/config/contracts";

export default function LoanEligibility() {
  const { wallets } = useWallets();
  const address = wallets[0]?.address;

  // Hooks - ONLY for transactions, NOT for reading data
  const { requestLoan } = useLoan();
  const { approve } = useUSDC();
  const { checkEligibility } = useUserAPI(address);

  const [loanAmount, setLoanAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [repaymentDuration, setRepaymentDuration] = useState("");
  const [useCollateral, setUseCollateral] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [loanTxHash, setLoanTxHash] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  // Real data from contracts
  const [creditScore, setCreditScore] = useState(500);
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [isVerified, setIsVerified] = useState(false);
  const availableLimit = creditScore >= 700 ? 50 : creditScore >= 600 ? 30 : 15;
  const currentTier =
    creditScore >= 700 ? "Gold" : creditScore >= 600 ? "Silver" : "Bronze";
  const nextTier =
    creditScore >= 700 ? "Platinum" : creditScore >= 600 ? "Gold" : "Silver";
  const nextTierRequirement =
    creditScore >= 700 ? 850 : creditScore >= 600 ? 700 : 600;

  // Load user data FROM BACKEND (NO RPC calls)
  useEffect(() => {
    const loadUserData = async () => {
      if (!address) return;

      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/user/${address}/summary`
        );
        const data = await response.json();

        if (data.success && data.data) {
          setCreditScore(data.data.creditScore || 500);
          setUsdcBalance(data.data.usdcBalance?.toString() || "0");
          setIsVerified(data.data.isVerified || false);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setCreditScore(500);
        setUsdcBalance("0");
        setIsVerified(false);
      }
    };

    loadUserData();
  }, [address]);

  // Calculate estimated terms
  const calculateTerms = () => {
    if (!loanAmount || !repaymentDuration) return null;
    const amount = parseFloat(loanAmount);
    const days = parseInt(repaymentDuration);

    // Base rate calculation
    let rate = 1.0; // 1% base
    if (amount > 30) rate += 0.5;
    if (creditScore < 600) rate += 0.5;
    if (useCollateral) rate -= 0.3; // Lower rate with collateral

    return {
      rate,
      days,
      totalAmount: amount * (1 + rate / 100),
      monthlyPayment:
        days <= 7
          ? amount * (1 + rate / 100)
          : (amount * (1 + rate / 100)) / (days / 30),
    };
  };

  const estimatedTerms = calculateTerms();

  const handleCheckEligibility = async () => {
    if (!loanAmount || !purpose || !repaymentDuration || !address) {
      return;
    }

    const amount = parseFloat(loanAmount);
    if (amount < 5 || amount > 500) {
      return;
    }

    setIsChecking(true);
    setErrorMessage("");

    try {
      // Step 1: Check if user is verified
      if (!isVerified) {
        setErrorMessage("Please complete identity verification first");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 4000);
        return;
      }

      // Step 2: Check eligibility via backend
      const eligibility = await checkEligibility(amount);

      const eligibilityData = eligibility as {
        data?: {
          eligible: boolean;
          reason?: string;
          approvedAmount?: number;
          interestRate?: number;
        };
      };

      if (!eligibilityData?.data?.eligible) {
        setErrorMessage(
          eligibilityData?.data?.reason || "Not eligible for this loan amount"
        );
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 4000);
        return;
      }

      // Step 3: Approve USDC spending (the contract will pull USDC for repayment)
      // Note: For loans, we typically don't need approval unless collateral is required
      // But we'll keep this for future collateral implementation
      if (useCollateral) {
        await approve(CONTRACTS.LoanEngine, loanAmount);
      }

      // Step 4: Request loan on blockchain (user's wallet)
      const loanReason = `${purpose} - ${repaymentDuration} days`;
      const result = await requestLoan(loanAmount, loanReason);

      if (result?.success) {
        setApprovedAmount(amount);
        setLoanTxHash(result.hash);

        // Step 5: Save loan data to backend for fast querying
        try {
          console.log("💾 Saving loan to backend...");
          const backendResponse = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/loan/request`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                borrower: address,
                amount: parseFloat(loanAmount),
                reason: loanReason,
                interestRate: eligibilityData?.data?.interestRate || 0.05,
                duration: parseInt(repaymentDuration),
                txHash: result.hash,
                // Convert BigInt to string for JSON serialization
                blockNumber: result.receipt?.blockNumber
                  ? Number(result.receipt.blockNumber)
                  : undefined,
              }),
            }
          );

          const backendData = await backendResponse.json();
          console.log("💾 Backend response:", backendData);

          if (!backendData.success) {
            console.error("❌ Backend save failed:", backendData.error);
            throw new Error(backendData.error || "Failed to save to backend");
          }

          console.log("✅ Loan saved to backend successfully!");
          console.log(
            "🚀 Auto-approval will be triggered in the background..."
          );
        } catch (backendError) {
          console.error("❌ Error saving to backend:", backendError);
          // Don't fail the whole operation if backend save fails
          // But log it prominently
          setErrorMessage(
            `Loan requested on-chain but backend save failed: ${
              backendError instanceof Error
                ? backendError.message
                : "Unknown error"
            }`
          );
        }

        // Show success toast first
        setShowSuccessToast(true);

        // Then show modal after toast delay
        setTimeout(() => {
          setShowSuccessModal(true);
          setShowSuccessToast(false);
        }, 3000);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: unknown) {
      console.error("Error requesting loan:", error);
      const message =
        error instanceof Error ? error.message : "Failed to request loan";
      setErrorMessage(message);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 4000);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    // Reset form
    setLoanAmount("");
    setPurpose("");
    setRepaymentDuration("");
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="text-sm text-[#8E8E8E] uppercase tracking-wider font-medium mb-2">
              Step 2 of 3 — Loan Eligibility
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Request your micro-loan
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Get instant access to stablecoin loans based on your verified
              identity and credit score.
            </p>
          </div>

          {/* Top Status Card */}
          <div className="bg-gradient-to-br from-[#FFD93D] to-[#FFC700] rounded-2xl p-8 mb-8 shadow-lg">
            <div className="flex items-center justify-start mb-8">
              <div className="flex items-center gap-2 bg-white/90 px-5 py-2.5 rounded-full shadow-sm">
                <FaCheckCircle className="w-4 h-4 text-[#00D26A]" />
                <span className="text-sm font-semibold text-[#0C0C0C]">
                  Verified
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="text-sm font-medium text-[#0C0C0C]/70 uppercase tracking-wide">
                  Credit Score
                </div>
                <div className="text-4xl font-extrabold font-heading text-[#0C0C0C]">
                  {creditScore}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-[#0C0C0C]/70 uppercase tracking-wide">
                  Available Limit
                </div>
                <div className="text-4xl font-extrabold font-heading text-[#0C0C0C] flex items-center gap-3">
                  <FaWallet className="w-7 h-7" />
                  <span>${availableLimit} USDC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-8">
              Loan Request Form
            </h2>

            <div className="space-y-8">
              {/* Loan Amount Input with Slider */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                  Loan Amount (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="500"
                    step="1"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="Enter amount ($5 - $500)"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-[#EDEDED] text-[#0C0C0C] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#FFD93D] focus:border-transparent transition-all"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8E8E8E]">
                    USDC
                  </div>
                </div>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="1"
                  value={loanAmount || 5}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full h-2 bg-[#EDEDED] rounded-lg appearance-none cursor-pointer accent-[#FFD93D]"
                />
                <div className="flex justify-between text-xs text-[#8E8E8E]">
                  <span>$5</span>
                  <span>$500</span>
                </div>
                <p className="text-xs text-[#8E8E8E]">
                  Minimum: $5 | Maximum: $50
                </p>
              </div>

              {/* Purpose Dropdown */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                  Loan Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-[#EDEDED] text-[#0C0C0C] focus:outline-none focus:ring-2 focus:ring-[#FFD93D] focus:border-transparent transition-all bg-white cursor-pointer"
                >
                  <option value="">Select purpose</option>
                  <option value="personal">Personal</option>
                  <option value="bills">Bills</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              {/* Repayment Duration Dropdown */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                  Repayment Duration
                </label>
                <select
                  value={repaymentDuration}
                  onChange={(e) => setRepaymentDuration(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-[#EDEDED] text-[#0C0C0C] focus:outline-none focus:ring-2 focus:ring-[#FFD93D] focus:border-transparent transition-all bg-white cursor-pointer"
                >
                  <option value="">Select duration</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>

              {/* Tiers Info */}
              <div className="bg-[#F6F6F6] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium text-[#8E8E8E] uppercase tracking-wide mb-1">
                      Current Tier
                    </div>
                    <div className="text-lg font-extrabold font-heading text-[#0C0C0C]">
                      {currentTier}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-[#8E8E8E] uppercase tracking-wide mb-1">
                      Next Tier
                    </div>
                    <div className="text-lg font-extrabold font-heading text-[#0C0C0C]">
                      {nextTier} (Score: {nextTierRequirement}+)
                    </div>
                  </div>
                </div>
              </div>

              {/* Collateral Toggle */}
              <div className="flex items-center justify-between p-4 bg-white border-2 border-[#EDEDED] rounded-2xl">
                <div>
                  <div className="text-sm font-semibold text-[#0C0C0C] mb-1">
                    Stake USDC Collateral (Optional)
                  </div>
                  <div className="text-xs text-[#8E8E8E]">
                    Lower interest rate by staking collateral
                  </div>
                </div>
                <button
                  onClick={() => setUseCollateral(!useCollateral)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    useCollateral ? "bg-[#FFD93D]" : "bg-[#EDEDED]"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      useCollateral ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Estimated Terms Card */}
              {estimatedTerms && loanAmount && repaymentDuration && (
                <div className="bg-gradient-to-br from-[#FFD93D] to-[#FFC700] rounded-2xl p-6">
                  <h3 className="text-lg font-extrabold font-heading text-[#0C0C0C] mb-4">
                    Estimated Terms
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[#0C0C0C]/70 mb-1">
                        Interest Rate
                      </div>
                      <div className="text-xl font-extrabold font-heading text-[#0C0C0C]">
                        {estimatedTerms.rate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[#0C0C0C]/70 mb-1">
                        Repayment Period
                      </div>
                      <div className="text-xl font-extrabold font-heading text-[#0C0C0C]">
                        {repaymentDuration} days
                      </div>
                    </div>
                    <div>
                      <div className="text-[#0C0C0C]/70 mb-1">Total Amount</div>
                      <div className="text-xl font-extrabold font-heading text-[#0C0C0C]">
                        ${estimatedTerms.totalAmount.toFixed(2)} USDC
                      </div>
                    </div>
                    <div>
                      <div className="text-[#0C0C0C]/70 mb-1">Due Date</div>
                      <div className="text-xl font-extrabold font-heading text-[#0C0C0C]">
                        {(() => {
                          const dueDate = new Date();
                          dueDate.setDate(
                            dueDate.getDate() + parseInt(repaymentDuration)
                          );
                          return dueDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Check Eligibility Button */}
              <div className="pt-4">
                <button
                  onClick={handleCheckEligibility}
                  disabled={
                    !loanAmount ||
                    !purpose ||
                    !repaymentDuration ||
                    isChecking ||
                    parseFloat(loanAmount) < 5 ||
                    parseFloat(loanAmount) > 500
                  }
                  className="w-full bg-[#FFD93D] hover:bg-[#FFC700] disabled:bg-[#EDEDED] disabled:text-[#8E8E8E] text-[#0C0C0C] px-8 py-4 rounded-2xl font-extrabold transition-colors uppercase tracking-wide flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                >
                  {isChecking ? (
                    <>
                      <FaSpinner className="w-5 h-5 animate-spin" />
                      <span>Checking Eligibility...</span>
                    </>
                  ) : (
                    "Check Eligibility"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Success Toast */}
          {showSuccessToast && (
            <Toast
              type="success"
              title="Success !"
              message={`Loan requested successfully! Transaction: ${loanTxHash.slice(
                0,
                10
              )}...`}
              onClose={() => setShowSuccessToast(false)}
            />
          )}

          {/* Error Toast with Fallback Explanation */}
          {showErrorToast && (
            <div className="fixed top-24 right-6 z-50 max-w-md">
              <Toast
                type="error"
                title="Notice !"
                message={
                  errorMessage ||
                  "Increase your reputation or repay existing loans to borrow again."
                }
                onClose={() => setShowErrorToast(false)}
              />
              <div className="mt-4 bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <h4 className="text-lg font-extrabold font-heading text-[#0C0C0C] mb-3">
                  How to Improve Eligibility
                </h4>
                <ul className="space-y-2 text-sm text-[#0C0C0C]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD93D]">•</span>
                    <span>
                      Repay existing loans on time to boost your credit score
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD93D]">•</span>
                    <span>
                      Complete identity verification to unlock higher limits
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD93D]">•</span>
                    <span>Refer friends to earn reputation boosts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FFD93D]">•</span>
                    <span>
                      Maintain a repayment streak to access better rates
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slide-in">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-[#00D26A] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-extrabold font-heading text-[#0C0C0C] mb-2">
                    Loan Requested!
                  </h3>
                  <p className="text-lg text-[#0C0C0C] mb-4">
                    Your loan request of ${approvedAmount} USDC has been
                    submitted successfully.
                  </p>
                  {loanTxHash && (
                    <div className="bg-[#F6F6F6] rounded-xl p-4 text-sm">
                      <p className="text-[#8E8E8E] mb-2">Transaction Hash:</p>
                      <a
                        href={`https://testnet.arcscan.app/tx/${loanTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0C0C0C] font-mono text-xs break-all underline hover:text-[#FFD93D]"
                      >
                        {loanTxHash}
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Link
                    href="/dashboard"
                    onClick={handleCloseModal}
                    className="block w-full bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-8 py-4 rounded-2xl font-extrabold transition-colors uppercase tracking-wide text-center"
                  >
                    View Active Loans
                  </Link>
                  <button
                    onClick={handleCloseModal}
                    className="w-full bg-transparent border-2 border-[#EDEDED] hover:border-[#0C0C0C] text-[#0C0C0C] px-8 py-4 rounded-2xl font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
