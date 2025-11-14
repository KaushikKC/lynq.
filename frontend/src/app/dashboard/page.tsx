"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { FaCheckCircle, FaSpinner, FaClock } from "react-icons/fa";
import { useWallets } from "@privy-io/react-auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import { useLoan, useUSDC } from "@/lib/hooks";
import { CONTRACTS } from "@/config/contracts";

interface ActiveLoan {
  loanId: string;
  amount: number;
  dueDate: string;
  outstanding: number;
  interest: number;
  issuedAt: string;
}

export default function ActiveLoanDashboard() {
  const { wallets } = useWallets();
  const address = wallets[0]?.address;

  // Hooks - ONLY for transactions, NOT for reading data
  const { repayLoan } = useLoan();
  const { approve } = useUSDC();

  const [isRepaying, setIsRepaying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayType, setRepayType] = useState<"full" | "partial">("full");
  const [autoRepay, setAutoRepay] = useState(false);
  const [estimatedGas] = useState(0.001);
  const [repayTxHash, setRepayTxHash] = useState("");
  const [creditScore, setCreditScore] = useState(500);
  const [usdcBalance, setUsdcBalance] = useState("0");

  // Real data - fetched from backend
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);

  // Get current time once on mount
  const currentTime = useMemo(() => new Date().getTime(), []);

  // Load user data FROM BACKEND (NO RPC calls)
  useEffect(() => {
    const loadData = async () => {
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
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setCreditScore(500);
        setUsdcBalance("0");
      }
    };

    loadData();
  }, [address]);

  // Load loans from backend
  useEffect(() => {
    const loadLoans = async () => {
      if (!address) return;

      setIsLoadingLoans(true);
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/loan/user/${address}`
        );
        const data = await response.json();

        if (data.success && data.data) {
          // Map backend loans to ActiveLoan format
          const mappedLoans = data.data
            .map((loan: any) => {
              // Calculate interest correctly (interestRate is in basis points)
              const interestAmount =
                (loan.amount * (loan.interestRate || 0)) / 10000;
              const totalOwed = loan.amount + interestAmount;
              const outstanding = totalOwed - (loan.repaidAmount || 0);

              return {
                loanId: `LN-${loan.loanId || loan._id}`,
                amount: loan.amount,
                dueDate: loan.dueAt
                  ? new Date(loan.dueAt * 1000).toISOString().split("T")[0]
                  : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0],
                outstanding: Math.max(0, outstanding),
                interest: interestAmount,
                issuedAt: loan.issuedAt
                  ? new Date(loan.issuedAt * 1000).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0],
              };
            })
            .filter((loan: ActiveLoan) => loan.outstanding > 0);

          setActiveLoans(mappedLoans);
        }
      } catch (error) {
        console.error("Error loading loans:", error);
      } finally {
        setIsLoadingLoans(false);
      }
    };

    loadLoans();
  }, [address]);

  const handleRepayClick = (loanId: string) => {
    const loan = activeLoans.find((l) => l.loanId === loanId);
    if (loan) {
      setSelectedLoan(loanId);
      setRepayAmount(loan.outstanding.toString());
      setRepayType("full");
      setShowConfirmModal(true);
    }
  };

  const handleRepay = async () => {
    if (!selectedLoan || !address) return;

    const loan = activeLoans.find((l) => l.loanId === selectedLoan);
    if (!loan) return;

    const amount =
      repayType === "full" ? loan.outstanding.toString() : repayAmount;
    if (!amount || parseFloat(amount) <= 0) return;

    setIsRepaying(true);
    setShowConfirmModal(false);

    try {
      // Step 1: Approve USDC
      await approve(CONTRACTS.LoanEngine, amount);

      // Step 2: Repay loan on blockchain (user's wallet)
      const loanIdNumber = parseInt(selectedLoan.replace("LN-", ""));
      const result = await repayLoan(loanIdNumber, amount);

      if (result?.success) {
        setRepayTxHash(result.hash);

        // Step 3: Save repayment to backend
        try {
          console.log("💾 Saving repayment to backend...");
          const backendResponse = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/loan/repayment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                loanId: loanIdNumber,
                amount: parseFloat(amount),
                txHash: result.hash,
                // Convert BigInt to Number for JSON serialization
                blockNumber: result.receipt?.blockNumber
                  ? Number(result.receipt.blockNumber)
                  : undefined,
              }),
            }
          );

          const backendData = await backendResponse.json();
          console.log("💾 Repayment saved to backend:", backendData);

          if (!backendData.success) {
            console.error("❌ Backend save failed:", backendData.error);
            throw new Error(backendData.error || "Failed to save repayment");
          }

          console.log("✅ Repayment saved to backend successfully!");
        } catch (backendError) {
          console.error("❌ Error saving repayment to backend:", backendError);
          // Don't fail the whole operation
        }

        setIsRepaying(false);
        setShowSuccessModal(true);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);

        // Reload loans
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/loan/user/${address}`
        );
        const data = await response.json();
        if (data.success && data.data) {
          const mappedLoans = data.data
            .map((l: any) => {
              // Calculate interest correctly (interestRate is in basis points)
              const interestAmount = (l.amount * (l.interestRate || 0)) / 10000;
              const totalOwed = l.amount + interestAmount;
              const outstanding = totalOwed - (l.repaidAmount || 0);

              return {
                loanId: `LN-${l.loanId || l._id}`,
                amount: l.amount,
                dueDate: l.dueAt
                  ? new Date(l.dueAt * 1000).toISOString().split("T")[0]
                  : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0],
                outstanding: Math.max(0, outstanding),
                interest: interestAmount,
                issuedAt: l.issuedAt
                  ? new Date(l.issuedAt * 1000).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0],
              };
            })
            .filter((l: ActiveLoan) => l.outstanding > 0);

          setActiveLoans(mappedLoans);
        }

        setSelectedLoan(null);
        setRepayAmount("");
      } else {
        throw new Error("Repayment transaction failed");
      }
    } catch (error) {
      console.error("Error repaying loan:", error);
      alert(error instanceof Error ? error.message : "Failed to repay loan");
      setIsRepaying(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedLoan) return 0;
    const loan = activeLoans.find((l) => l.loanId === selectedLoan);
    if (!loan) return 0;
    const amount =
      repayType === "full" ? loan.outstanding : parseFloat(repayAmount) || 0;
    return amount + estimatedGas;
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="text-sm text-[#8E8E8E] uppercase tracking-wider font-medium mb-2">
              Active Loan Dashboard
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Manage your loans
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Track your repayment progress and manage your active loans.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6">
              <div className="text-sm text-[#8E8E8E] mb-1">Credit Score</div>
              <div className="text-3xl font-extrabold text-[#0C0C0C]">
                {creditScore}
              </div>
            </div>
            <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6">
              <div className="text-sm text-[#8E8E8E] mb-1">USDC Balance</div>
              <div className="text-3xl font-extrabold text-[#0C0C0C]">
                {parseFloat(usdcBalance).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Active Loans List */}
          <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
              Active Loans
            </h2>

            {isLoadingLoans ? (
              <div className="text-center py-12">
                <FaSpinner className="w-8 h-8 animate-spin mx-auto text-[#FFD93D] mb-4" />
                <p className="text-[#8E8E8E]">Loading your loans...</p>
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#8E8E8E] mb-4">No active loans</p>
                <Link
                  href="/eligibility"
                  className="text-[#FFD93D] hover:text-[#FFC700] font-semibold"
                >
                  Request your first loan →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map((loan) => {
                  const dueDate = new Date(loan.dueDate).getTime();
                  const daysLeft = Math.ceil(
                    (dueDate - currentTime) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={loan.loanId}
                      className="bg-[#F6F6F6] rounded-2xl p-6 border-2 border-[#EDEDED]"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-sm font-medium text-[#8E8E8E] uppercase tracking-wide">
                              Loan ID
                            </div>
                            <div className="text-lg font-extrabold font-mono text-[#0C0C0C]">
                              {loan.loanId}
                            </div>
                            <div className="flex items-center gap-2 bg-[#0C0C0C] px-3 py-1 rounded-lg">
                              <FaClock className="w-3 h-3 text-[#FFD93D]" />
                              <span className="text-white font-semibold text-xs">
                                {daysLeft} days left
                              </span>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-[#8E8E8E] mb-1">
                                Amount
                              </div>
                              <div className="text-lg font-extrabold text-[#0C0C0C]">
                                ${loan.amount} USDC
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-[#8E8E8E] mb-1">
                                Due Date
                              </div>
                              <div className="text-lg font-extrabold text-[#0C0C0C]">
                                {formatDate(loan.dueDate)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-[#8E8E8E] mb-1">
                                Outstanding
                              </div>
                              <div className="text-lg font-extrabold text-[#0C0C0C]">
                                ${loan.outstanding} USDC
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-[#8E8E8E] mb-1">
                                Interest
                              </div>
                              <div className="text-lg font-extrabold text-[#0C0C0C]">
                                {loan.interest}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRepayClick(loan.loanId)}
                          className="ml-4 bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-6 py-3 rounded-xl font-extrabold transition-colors uppercase tracking-wide"
                        >
                          Repay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Auto-Repay Toggle */}
          <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-extrabold font-heading text-[#0C0C0C] mb-1">
                  Auto-Repay
                </div>
                <div className="text-sm text-[#8E8E8E]">
                  Automatically repay loans when due
                </div>
              </div>
              <button
                onClick={() => setAutoRepay(!autoRepay)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  autoRepay ? "bg-[#FFD93D]" : "bg-[#EDEDED]"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    autoRepay ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Success Toast */}
      {showSuccessToast && (
        <Toast
          type="success"
          title="Success !"
          message="Loan repaid successfully! +10 credit score."
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {/* Confirm Repay Modal */}
      {showConfirmModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Confirm Repayment
            </h3>

            {(() => {
              const loan = activeLoans.find((l) => l.loanId === selectedLoan);
              if (!loan) return null;

              return (
                <>
                  <div className="space-y-4 mb-6">
                    <div className="bg-[#F6F6F6] rounded-xl p-4">
                      <div className="text-sm text-[#8E8E8E] mb-2">Loan ID</div>
                      <div className="font-mono font-extrabold text-[#0C0C0C]">
                        {loan.loanId}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setRepayType("full");
                          setRepayAmount(loan.outstanding.toString());
                        }}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${
                          repayType === "full"
                            ? "bg-[#FFD93D] text-[#0C0C0C]"
                            : "bg-[#EDEDED] text-[#8E8E8E]"
                        }`}
                      >
                        Pay Full
                      </button>
                      <button
                        onClick={() => {
                          setRepayType("partial");
                          setRepayAmount("");
                        }}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${
                          repayType === "partial"
                            ? "bg-[#FFD93D] text-[#0C0C0C]"
                            : "bg-[#EDEDED] text-[#8E8E8E]"
                        }`}
                      >
                        Pay Partial
                      </button>
                    </div>

                    {repayType === "partial" && (
                      <div>
                        <label className="block text-sm font-semibold text-[#0C0C0C] mb-2">
                          Amount (USDC)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={loan.outstanding}
                          step="0.01"
                          value={repayAmount}
                          onChange={(e) => setRepayAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-4 py-3 rounded-xl border-2 border-[#EDEDED] text-[#0C0C0C] focus:outline-none focus:ring-2 focus:ring-[#FFD93D]"
                        />
                        <div className="text-xs text-[#8E8E8E] mt-1">
                          Max: ${loan.outstanding} USDC
                        </div>
                      </div>
                    )}

                    <div className="bg-[#F6F6F6] rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#8E8E8E]">Repayment Amount</span>
                        <span className="font-extrabold text-[#0C0C0C]">
                          $
                          {repayType === "full"
                            ? loan.outstanding
                            : parseFloat(repayAmount) || 0}{" "}
                          USDC
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#8E8E8E]">Estimated Gas</span>
                        <span className="font-extrabold text-[#0C0C0C]">
                          {estimatedGas} ETH
                        </span>
                      </div>
                      <div className="border-t border-[#EDEDED] pt-2 flex justify-between">
                        <span className="font-semibold text-[#0C0C0C]">
                          Total
                        </span>
                        <span className="font-extrabold text-[#0C0C0C]">
                          ${calculateTotal().toFixed(2)} USDC + {estimatedGas}{" "}
                          ETH
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleRepay}
                      disabled={
                        isRepaying ||
                        (repayType === "partial" &&
                          (!repayAmount ||
                            parseFloat(repayAmount) <= 0 ||
                            parseFloat(repayAmount) > loan.outstanding))
                      }
                      className="flex-1 bg-[#FFD93D] hover:bg-[#FFC700] disabled:bg-[#EDEDED] disabled:text-[#8E8E8E] text-[#0C0C0C] px-6 py-3 rounded-2xl font-extrabold transition-colors uppercase tracking-wide disabled:cursor-not-allowed"
                    >
                      {isRepaying ? (
                        <>
                          <FaSpinner className="w-4 h-4 animate-spin inline mr-2" />
                          Processing...
                        </>
                      ) : (
                        "Confirm & Pay"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmModal(false);
                        setSelectedLoan(null);
                        setRepayAmount("");
                      }}
                      className="flex-1 bg-transparent border-2 border-[#EDEDED] hover:border-[#0C0C0C] text-[#0C0C0C] px-6 py-3 rounded-2xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              );
            })()}
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
                Loan Repaid!
              </h3>
              <p className="text-lg text-[#0C0C0C] mb-4">
                Loan repaid successfully! +10 credit score.
              </p>
              {repayTxHash && (
                <div className="bg-[#F6F6F6] rounded-xl p-4 text-sm">
                  <p className="text-[#8E8E8E] mb-2">Transaction Hash:</p>
                  <a
                    href={`https://testnet.arcscan.app/tx/${repayTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0C0C0C] font-mono text-xs break-all underline hover:text-[#FFD93D]"
                  >
                    {repayTxHash}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Link
                href="/eligibility"
                onClick={handleCloseModal}
                className="block w-full bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-8 py-4 rounded-2xl font-extrabold transition-colors uppercase tracking-wide text-center"
              >
                Request Another Loan
              </Link>
              <button
                onClick={handleCloseModal}
                className="w-full bg-transparent border-2 border-[#EDEDED] hover:border-[#0C0C0C] text-[#0C0C0C] px-8 py-4 rounded-2xl font-semibold transition-colors"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
