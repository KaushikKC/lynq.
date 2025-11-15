"use client";

import { useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaPlay } from "react-icons/fa";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LoanRequest {
  wallet: string;
  score: number;
  loanRequest: string;
  decision: "approved" | "rejected" | "pending";
  time: string;
}

export default function AgentConsole() {
  const [isRunning, setIsRunning] = useState(false);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([
    { wallet: "0x123...", score: 650, loanRequest: "$10", decision: "approved", time: "14:03" },
    { wallet: "0x987...", score: 580, loanRequest: "$20", decision: "rejected", time: "14:05" },
  ]);
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const [totalProcessed, setTotalProcessed] = useState(24);
  const [averageScore, setAverageScore] = useState(615);
  const [poolParams, setPoolParams] = useState({
    maxLoanAmount: 200,
    minCreditScore: 600,
    interestRate: 1.0,
    utilizationThreshold: 80,
  });
  const [showForceCloseModal, setShowForceCloseModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);

  const handleRunAgent = async () => {
    setIsRunning(true);
    setLogOutput([]);
    
    // Simulate agent processing
    const newRequests: LoanRequest[] = [];
    const newLogs: string[] = ["Agent run started..."];
    
    // Generate mock requests
    const mockRequests = [
      { wallet: "0xABC...", score: 670, loanRequest: "$15", threshold: 600 },
      { wallet: "0xDEF...", score: 590, loanRequest: "$25", threshold: 600 },
    ];

    for (let i = 0; i < mockRequests.length; i++) {
      const request = mockRequests[i];
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const decision = request.score >= request.threshold ? "approved" : "rejected";
      const time = new Date().toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: false 
      });
      
      newRequests.push({
        wallet: request.wallet,
        score: request.score,
        loanRequest: request.loanRequest,
        decision,
        time,
      });

      if (decision === "approved") {
        newLogs.push(`User ${request.wallet} verified → Approved ${request.loanRequest} USDC.`);
      } else {
        newLogs.push(`User ${request.wallet} below threshold → Denied.`);
      }

      setLogOutput([...newLogs]);
    }

    newLogs.push("Agent idle.");
    setLogOutput(newLogs);
    setLoanRequests([...newRequests, ...loanRequests]);
    setTotalProcessed(totalProcessed + newRequests.length);
    
    // Update average score
    const allScores = [...newRequests, ...loanRequests].map(r => r.score);
    const newAverage = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    setAverageScore(newAverage);
    
    setIsRunning(false);
  };

  const handleForceClose = (wallet: string) => {
    setSelectedLoan(wallet);
    setShowForceCloseModal(true);
  };

  const confirmForceClose = () => {
    if (selectedLoan) {
      setLoanRequests(loanRequests.filter(r => r.wallet !== selectedLoan));
      setLogOutput([...logOutput, `Force-closed loan for ${selectedLoan}`]);
      setShowForceCloseModal(false);
      setSelectedLoan(null);
    }
  };

  const handleUpdateParams = (key: string, value: number) => {
    setPoolParams({ ...poolParams, [key]: value });
    setLogOutput([...logOutput, `Updated ${key} to ${value}`]);
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 6)}...`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="text-sm text-[#8E8E8E] uppercase tracking-wider font-medium mb-2">
              Autonomous Agent Console
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Screening Agent Automation
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Visualize and manage automated loan approval decisions.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Main Table */}
            <div className="lg:col-span-2 bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                  Loan Requests
                </h2>
                <button
                  onClick={handleRunAgent}
                  disabled={isRunning}
                  className="bg-[#FFD93D] hover:bg-[#FFC700] disabled:bg-[#EDEDED] disabled:text-[#8E8E8E] text-[#0C0C0C] px-6 py-3 rounded-2xl font-extrabold transition-colors uppercase tracking-wide flex items-center gap-2 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaPlay className="w-4 h-4" />
                      <span>Run Screening Agent</span>
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#EDEDED]">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                        Wallet
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                        Score
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                        Loan Request
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                        Decision
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                        Time
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanRequests.map((request, index) => (
                      <tr key={index} className="border-b border-[#EDEDED] last:border-0 hover:bg-[#F6F6F6] transition-colors">
                        <td className="py-4 px-4 text-[#0C0C0C] font-mono text-sm">
                          {truncateAddress(request.wallet)}
                        </td>
                        <td className="py-4 px-4 text-[#0C0C0C] font-semibold">
                          {request.score}
                        </td>
                        <td className="py-4 px-4 text-[#0C0C0C] font-medium">
                          {request.loanRequest}
                        </td>
                        <td className="py-4 px-4">
                          {request.decision === "approved" ? (
                            <div className="flex items-center gap-2">
                              <FaCheckCircle className="w-5 h-5 text-[#00D26A]" />
                              <span className="text-[#00D26A] font-semibold">Approved</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FaTimesCircle className="w-5 h-5 text-[#FF6B6B]" />
                              <span className="text-[#FF6B6B] font-semibold">Rejected</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-[#8E8E8E] font-mono text-sm">
                          {request.time}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleForceClose(request.wallet)}
                            className="text-xs bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                          >
                            Force Close
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Output Log */}
            <div className="bg-[#0C0C0C] rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-extrabold font-heading text-white mb-4">
                Output Log
              </h2>
              <div className="space-y-2 font-mono text-sm text-[#8E8E8E] max-h-96 overflow-y-auto">
                {logOutput.length > 0 ? (
                  logOutput.map((log, index) => (
                    <div key={index} className="pb-2">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-[#8E8E8E]">Agent idle.</div>
                )}
              </div>
            </div>
          </div>

          {/* Pool Parameters */}
          <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg mb-8">
            <h3 className="text-xl font-extrabold font-heading text-[#0C0C0C] mb-6">
              Pool Parameters
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#0C0C0C] mb-2">
                  Max Loan Amount (USDC)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={poolParams.maxLoanAmount}
                    onChange={(e) => handleUpdateParams("maxLoanAmount", parseFloat(e.target.value))}
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-[#EDEDED] text-[#0C0C0C] focus:outline-none focus:ring-2 focus:ring-[#FFD93D]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0C0C0C] mb-2">
                  Min Credit Score
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={poolParams.minCreditScore}
                    onChange={(e) => handleUpdateParams("minCreditScore", parseFloat(e.target.value))}
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-[#EDEDED] text-[#0C0C0C] focus:outline-none focus:ring-2 focus:ring-[#FFD93D]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0C0C0C] mb-2">
                  Base Interest Rate (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    value={poolParams.interestRate}
                    onChange={(e) => handleUpdateParams("interestRate", parseFloat(e.target.value))}
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-[#EDEDED] text-[#0C0C0C] focus:outline-none focus:ring-2 focus:ring-[#FFD93D]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0C0C0C] mb-2">
                  Utilization Threshold (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={poolParams.utilizationThreshold}
                    onChange={(e) => handleUpdateParams("utilizationThreshold", parseFloat(e.target.value))}
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-[#EDEDED] text-[#0C0C0C] focus:outline-none focus:ring-2 focus:ring-[#FFD93D]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mini Dashboard */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
              <div className="text-sm font-medium text-[#8E8E8E] uppercase tracking-wide mb-2">
                Total Loans Processed
              </div>
              <div className="text-4xl font-extrabold font-heading text-[#0C0C0C]">
                {totalProcessed}
              </div>
            </div>
            <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
              <div className="text-sm font-medium text-[#8E8E8E] uppercase tracking-wide mb-2">
                Average Credit Score
              </div>
              <div className="text-4xl font-extrabold font-heading text-[#0C0C0C]">
                {averageScore}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Force Close Modal */}
      {showForceCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Force Close Loan
            </h3>
            <p className="text-[#8E8E8E] mb-6">
              Are you sure you want to force-close the loan for {selectedLoan}? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmForceClose}
                className="flex-1 bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-6 py-3 rounded-2xl font-extrabold transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowForceCloseModal(false);
                  setSelectedLoan(null);
                }}
                className="flex-1 bg-transparent border-2 border-[#EDEDED] hover:border-[#0C0C0C] text-[#0C0C0C] px-6 py-3 rounded-2xl font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

