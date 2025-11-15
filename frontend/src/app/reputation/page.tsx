"use client";

import { useState } from "react";
import { FaCopy, FaCheckCircle, FaTimesCircle, FaTrophy } from "react-icons/fa";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";

interface LoanHistory {
  date: string;
  loan: string;
  repaid: boolean;
  status: "success" | "failed";
  scoreChange: number;
}

export default function ReputationDashboard() {
  const [referralLink, setReferralLink] = useState("");
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock data
  const currentScore = 640;
  const targetScore = 700; // Silver tier
  const currentTier: string = "Bronze";
  const nextTier: string = "Silver";
  const progress = ((currentScore - 600) / (targetScore - 600)) * 100; // Bronze starts at 600
  const verifiedReferrals = 2;
  const referralScoreBoost = 20;
  const successfulLoans = 3;
  const hasTrustedBorrowerBadge = successfulLoans >= 3;
  const repaymentStreak = 5;
  const nextMilestone = 10;

  // Credit Score Breakdown
  const scoreBreakdown = {
    repayment: { percentage: 60, value: 384, label: "Repayment History" },
    verification: { percentage: 20, value: 128, label: "Verification" },
    referrals: { percentage: 20, value: 128, label: "Referrals" },
  };

  const loanHistory: LoanHistory[] = [
    {
      date: "10 Nov",
      loan: "$10",
      repaid: true,
      status: "success",
      scoreChange: +10,
    },
    {
      date: "15 Nov",
      loan: "$15",
      repaid: false,
      status: "failed",
      scoreChange: -5,
    },
  ];

  const generateReferralLink = () => {
    const address = "0xABC1234567890DEF";
    const link = `/ref/${address}`;
    setReferralLink(link);
  };

  const copyReferralLink = () => {
    if (referralLink && typeof window !== "undefined") {
      const fullLink = `${window.location.origin}${referralLink}`;
      navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setShowCopyToast(true);
      setTimeout(() => {
        setShowCopyToast(false);
        setCopied(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="text-sm text-[#8E8E8E] uppercase tracking-wider font-medium mb-2">
              Reputation Dashboard
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Build your on-chain credit
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Track your credit growth, referral rewards, and unlock new tiers.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Credit Score Meter & Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              {/* Credit Score Meter */}
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
                  Credit Score
                </h2>

                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-48 h-48">
                    {/* Background Circle */}
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="84"
                        fill="none"
                        stroke="#EDEDED"
                        strokeWidth="12"
                      />
                      {/* Progress Circle */}
                      <circle
                        cx="96"
                        cy="96"
                        r="84"
                        fill="none"
                        stroke="#FFD93D"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 84}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 84 * (1 - progress / 100)
                        }`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-extrabold font-heading text-[#0C0C0C]">
                        {currentScore}
                      </div>
                      <div className="text-sm text-[#8E8E8E] mt-1">
                        {currentTier} → {nextTier}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="text-lg font-semibold text-[#0C0C0C]">
                    Current Score: {currentScore} / Tier: {currentTier} →{" "}
                    {nextTier}
                  </div>
                  <div className="text-sm text-[#8E8E8E]">
                    {targetScore - currentScore} points until {nextTier}
                  </div>
                </div>
              </div>

              {/* Credit Score Breakdown */}
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
                  Score Breakdown
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {Object.entries(scoreBreakdown).map(([key, data]) => (
                    <div key={key} className="text-center">
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <svg className="transform -rotate-90 w-32 h-32">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#EDEDED"
                            strokeWidth="8"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke={
                              key === "repayment"
                                ? "#00D26A"
                                : key === "verification"
                                ? "#FFD93D"
                                : "#B388FF"
                            }
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${
                              2 * Math.PI * 56 * (1 - data.percentage / 100)
                            }`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                            {data.percentage}%
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#0C0C0C] mb-1">
                        {data.label}
                      </div>
                      <div className="text-xs text-[#8E8E8E]">
                        {data.value} points
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Repayment Streak */}
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-extrabold font-heading text-[#0C0C0C] mb-4">
                  Repayment Streak
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-extrabold font-heading text-[#0C0C0C]">
                      {repaymentStreak} days
                    </div>
                    <div className="text-sm text-[#8E8E8E] mt-1">
                      Current streak
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                      Next Milestone
                    </div>
                    <div className="text-lg font-extrabold font-heading text-[#FFD93D]">
                      {nextMilestone} days
                    </div>
                  </div>
                </div>
                <div className="w-full bg-[#EDEDED] rounded-full h-2 mt-4">
                  <div
                    className="bg-gradient-to-r from-[#FFD93D] to-[#FFC700] h-full rounded-full"
                    style={{
                      width: `${(repaymentStreak / nextMilestone) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Badges Section */}
            <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
                Badges
              </h2>

              <div className="space-y-4">
                {hasTrustedBorrowerBadge ? (
                  <div className="bg-gradient-to-br from-[#FFD93D] to-[#FFC700] rounded-2xl p-6 text-center">
                    <div className="text-5xl mb-3">🏅</div>
                    <div className="text-lg font-extrabold font-heading text-[#0C0C0C] mb-1">
                      Trusted Borrower
                    </div>
                    <div className="text-sm text-[#0C0C0C]/70">NFT Badge</div>
                    <div className="text-xs text-[#0C0C0C]/60 mt-2">
                      Earned after 3 successful loans
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#F6F6F6] rounded-2xl p-6 text-center border-2 border-dashed border-[#EDEDED]">
                    <div className="text-4xl mb-3 opacity-50">🏅</div>
                    <div className="text-sm font-semibold text-[#8E8E8E]">
                      Complete 3 successful loans to unlock
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tier Badges */}
          <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Tier Badges
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-2xl border-2 ${
                  currentTier === "Bronze"
                    ? "border-[#FFD93D] bg-[#FFD93D]/10"
                    : "border-[#EDEDED]"
                }`}
              >
                <div className="text-3xl mb-2">🥉</div>
                <div className="font-extrabold font-heading text-[#0C0C0C] mb-1">
                  Bronze
                </div>
                <div className="text-xs text-[#8E8E8E]">Score: 600+</div>
                <div className="text-xs text-[#8E8E8E] mt-1">Max: $15 USDC</div>
              </div>
              <div
                className={`p-4 rounded-2xl border-2 ${
                  currentTier === "Silver"
                    ? "border-[#FFD93D] bg-[#FFD93D]/10"
                    : "border-[#EDEDED]"
                }`}
              >
                <div className="text-3xl mb-2">🥈</div>
                <div className="font-extrabold font-heading text-[#0C0C0C] mb-1">
                  Silver
                </div>
                <div className="text-xs text-[#8E8E8E]">Score: 700+</div>
                <div className="text-xs text-[#8E8E8E] mt-1">Max: $50 USDC</div>
              </div>
              <div
                className={`p-4 rounded-2xl border-2 ${
                  currentTier === "Gold"
                    ? "border-[#FFD93D] bg-[#FFD93D]/10"
                    : "border-[#EDEDED]"
                }`}
              >
                <div className="text-3xl mb-2">🥇</div>
                <div className="font-extrabold font-heading text-[#0C0C0C] mb-1">
                  Gold
                </div>
                <div className="text-xs text-[#8E8E8E]">Score: 800+</div>
                <div className="text-xs text-[#8E8E8E] mt-1">
                  Max: $200 USDC
                </div>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
              Loan History
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#EDEDED]">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                      Loan
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                      Repaid
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-[#0C0C0C] uppercase tracking-wide">
                      Score Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loanHistory.map((loan, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#EDEDED] last:border-0 hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 text-[#0C0C0C] font-medium">
                        {loan.date}
                      </td>
                      <td className="py-4 px-4 text-[#0C0C0C] font-medium">
                        {loan.loan}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`font-medium ${
                            loan.repaid ? "text-[#00D26A]" : "text-[#FF6B6B]"
                          }`}
                        >
                          {loan.repaid ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {loan.status === "success" ? (
                          <FaCheckCircle className="w-5 h-5 text-[#00D26A]" />
                        ) : (
                          <FaTimesCircle className="w-5 h-5 text-[#FF6B6B]" />
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`font-extrabold ${
                            loan.scoreChange > 0
                              ? "text-[#00D26A]"
                              : "text-[#FF6B6B]"
                          }`}
                        >
                          {loan.scoreChange > 0 ? "+" : ""}
                          {loan.scoreChange}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Referral Section */}
          <div className="bg-gradient-to-br from-[#0C0C0C] to-[#1A1A1A] rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold font-heading text-white mb-3">
                  Invite friends and boost your reputation.
                </h2>
                <p className="text-[#8E8E8E] mb-4">
                  Share your referral link and earn credit score boosts when
                  friends verify and borrow.
                </p>

                {referralLink ? (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-3 text-white font-mono text-sm break-all">
                      {typeof window !== "undefined"
                        ? window.location.origin
                        : ""}
                      {referralLink}
                    </div>
                    <button
                      onClick={copyReferralLink}
                      className="bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-6 py-3 rounded-2xl font-semibold transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <FaCheckCircle className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <FaCopy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={generateReferralLink}
                    className="bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-8 py-4 rounded-2xl font-extrabold transition-colors uppercase tracking-wide"
                  >
                    Generate Referral Link
                  </button>
                )}

                <div className="mt-4 flex items-center gap-2 text-white">
                  <FaTrophy className="w-5 h-5 text-[#FFD93D]" />
                  <span className="font-semibold">
                    {verifiedReferrals} verified referrals → +
                    {referralScoreBoost} score boost
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Copy Toast */}
      {showCopyToast && (
        <Toast
          type="success"
          title="Success !"
          message="Referral link copied to clipboard!"
          onClose={() => setShowCopyToast(false)}
        />
      )}

      <Footer />
    </div>
  );
}
