"use client";

import { useState } from "react";
import Link from "next/link";
import { FaCheckCircle, FaWallet, FaCopy, FaShare, FaArrowRight, FaClock } from "react-icons/fa";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";

interface ActivityEvent {
  type: "loan_approved" | "loan_repaid" | "verification_complete";
  message: string;
  date: string;
  time: string;
}

export default function HomeDashboard() {
  const [copied, setCopied] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Mock data
  const walletAddress = "0x1234...5678";
  const isVerified = true;
  const hasSoulboundNFT = true;
  const currentScore = 640;
  const nextTierScore = 700;
  const currentTier = "Bronze";
  const nextTier = "Silver";
  const xpProgress = ((currentScore - 600) / (nextTierScore - 600)) * 100;
  const nextLoanLimit = 15; // USDC
  const referralLink = "/ref/0xABC1234567890DEF";

  const activeLoan = {
    id: "LN-2025-001",
    amount: 10,
    dueDate: "Nov 18, 2025",
    remaining: 3.03,
    daysLeft: 3,
  };

  const recentActivity: ActivityEvent[] = [
    { type: "loan_approved", message: "Loan approved: $10 USDC", date: "Nov 15", time: "14:30" },
    { type: "loan_repaid", message: "Loan repaid: $7.07 USDC", date: "Nov 12", time: "10:15" },
    { type: "verification_complete", message: "Identity verified successfully", date: "Nov 10", time: "09:00" },
    { type: "loan_approved", message: "Loan approved: $5 USDC", date: "Nov 8", time: "16:45" },
    { type: "loan_repaid", message: "Loan repaid: $5.05 USDC", date: "Nov 5", time: "11:20" },
  ];

  const copyReferralLink = () => {
    if (typeof window !== "undefined") {
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

  const shareReferralLink = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({
        title: "Join lynq - Decentralized Micro-Bank",
        text: "Get instant micro-loans with on-chain credit!",
        url: `${window.location.origin}${referralLink}`,
      });
    } else {
      copyReferralLink();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "loan_approved":
        return <FaCheckCircle className="w-4 h-4 text-[#00D26A]" />;
      case "loan_repaid":
        return <FaCheckCircle className="w-4 h-4 text-[#00D26A]" />;
      case "verification_complete":
        return <FaCheckCircle className="w-4 h-4 text-[#FFD93D]" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Dashboard
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Overview of your decentralized banking activity.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column - Main Stats */}
            <div className="lg:col-span-2 space-y-8">
              {/* Wallet & Verification Status */}
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FaWallet className="w-5 h-5 text-[#0C0C0C]" />
                    <span className="font-mono text-sm text-[#0C0C0C]">{walletAddress}</span>
                  </div>
                  {isVerified && hasSoulboundNFT && (
                    <div className="flex items-center gap-2 bg-[#00D26A]/10 px-3 py-1.5 rounded-full">
                      <FaCheckCircle className="w-3 h-3 text-[#00D26A]" />
                      <span className="text-xs font-semibold text-[#00D26A]">Soulbound NFT</span>
                    </div>
                  )}
                </div>
                {isVerified && (
                  <div className="flex items-center gap-2 text-sm text-[#8E8E8E]">
                    <FaCheckCircle className="w-4 h-4 text-[#00D26A]" />
                    <span>Identity Verified</span>
                  </div>
                )}
              </div>

              {/* Credit Score & XP Progress */}
              <div className="bg-gradient-to-br from-[#FFD93D] to-[#FFC700] rounded-2xl p-8 shadow-lg">
                <div className="mb-6">
                  <div className="text-sm font-medium text-[#0C0C0C]/70 uppercase tracking-wide mb-2">
                    Current Credit Score
                  </div>
                  <div className="text-6xl font-extrabold font-heading text-[#0C0C0C] mb-2">
                    {currentScore}
                  </div>
                  <div className="text-lg font-semibold text-[#0C0C0C]">
                    {currentTier} → {nextTier}
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0C0C0C]">Progress to {nextTier}</span>
                    <span className="font-semibold text-[#0C0C0C]">{Math.round(xpProgress)}%</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[#0C0C0C] h-full rounded-full transition-all duration-500"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-[#0C0C0C]/70">
                    {nextTierScore - currentScore} points until {nextTier}
                  </div>
                </div>
              </div>

              {/* Next Eligible Loan Limit */}
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#8E8E8E] uppercase tracking-wide mb-2">
                      Next Eligible Loan Limit
                    </div>
                    <div className="text-3xl font-extrabold font-heading text-[#0C0C0C]">
                      ${nextLoanLimit} USDC
                    </div>
                    <div className="text-sm text-[#8E8E8E] mt-1">
                      Based on credit score & tier
                    </div>
                  </div>
                  <Link
                    href="/eligibility"
                    className="bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-6 py-3 rounded-2xl font-extrabold transition-colors uppercase tracking-wide flex items-center gap-2"
                  >
                    Request Loan
                    <FaArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Active Loan Card */}
              {activeLoan && (
                <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-extrabold font-heading text-[#0C0C0C]">
                      Active Loan
                    </h3>
                    <div className="flex items-center gap-2 bg-[#00D26A]/10 px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 bg-[#00D26A] rounded-full"></div>
                      <span className="text-xs font-semibold text-[#00D26A]">Active</span>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-[#8E8E8E] mb-1">Amount</div>
                      <div className="text-lg font-extrabold text-[#0C0C0C]">${activeLoan.amount} USDC</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#8E8E8E] mb-1">Due Date</div>
                      <div className="text-lg font-extrabold text-[#0C0C0C]">{activeLoan.dueDate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#8E8E8E] mb-1">Remaining</div>
                      <div className="text-lg font-extrabold text-[#0C0C0C]">${activeLoan.remaining} USDC</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard"
                      className="flex-1 bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-6 py-3 rounded-2xl font-extrabold transition-colors uppercase tracking-wide text-center"
                    >
                      Repay
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-[#8E8E8E]">
                      <FaClock className="w-4 h-4" />
                      <span>{activeLoan.daysLeft} days left</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity Feed */}
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-extrabold font-heading text-[#0C0C0C] mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 hover:bg-[#F6F6F6] rounded-xl transition-colors">
                      <div className="mt-1">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#0C0C0C]">
                          {activity.message}
                        </div>
                        <div className="text-xs text-[#8E8E8E]">
                          {activity.date} at {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Referral */}
            <div className="space-y-8">
              {/* Referral Section */}
              <div className="bg-gradient-to-br from-[#0C0C0C] to-[#1A1A1A] rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-extrabold font-heading text-white mb-4">
                  Referral Link
                </h3>
                <p className="text-sm text-[#8E8E8E] mb-4">
                  Share your link and earn credit score boosts when friends verify and borrow.
                </p>
                <div className="bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-3 mb-4">
                  <div className="text-white font-mono text-xs break-all">
                    {typeof window !== "undefined" ? window.location.origin : ""}{referralLink}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copyReferralLink}
                    className="flex-1 bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-4 py-3 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
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
                  <button
                    onClick={shareReferralLink}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <FaShare className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-extrabold font-heading text-[#0C0C0C] mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/eligibility"
                    className="block w-full bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-6 py-3 rounded-2xl font-extrabold transition-colors uppercase tracking-wide text-center"
                  >
                    Request Loan
                  </Link>
                  <Link
                    href="/reputation"
                    className="block w-full bg-transparent border-2 border-[#EDEDED] hover:border-[#0C0C0C] text-[#0C0C0C] px-6 py-3 rounded-2xl font-semibold transition-colors text-center"
                  >
                    View Reputation
                  </Link>
                  <Link
                    href="/profile"
                    className="block w-full bg-transparent border-2 border-[#EDEDED] hover:border-[#0C0C0C] text-[#0C0C0C] px-6 py-3 rounded-2xl font-semibold transition-colors text-center"
                  >
                    Profile Settings
                  </Link>
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

