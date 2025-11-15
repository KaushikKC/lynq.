"use client";

import { useState } from "react";
import {
  FaCheckCircle,
  FaThumbsUp,
  FaThumbsDown,
  FaClock,
  FaRobot,
  FaChartBar,
} from "react-icons/fa";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: "active" | "passed" | "rejected";
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  endDate: string;
  category: "interest" | "agent" | "parameter" | "treasury";
  icon: string;
}

export default function GovernancePage() {
  const [showVoteToast, setShowVoteToast] = useState(false);
  const [voteMessage, setVoteMessage] = useState("");

  // Mock proposals data
  const proposals: Proposal[] = [
    {
      id: "PROP-001",
      title: "Adjust Base Interest Rate to 0.8%",
      description:
        "Proposal to reduce the base interest rate from 1.0% to 0.8% to encourage more borrowing and increase platform usage. This change will make loans more affordable for Bronze and Silver tier users.",
      proposer: "Treasury Agent",
      status: "active",
      votesFor: 3420,
      votesAgainst: 1250,
      totalVotes: 4670,
      endDate: "2025-11-20",
      category: "interest",
      icon: "📊",
    },
    {
      id: "PROP-002",
      title: "Approve New Fraud Detection Agent v2.0",
      description:
        "Deploy upgraded fraud detection AI agent with improved pattern recognition and real-time risk assessment capabilities. The new agent can detect suspicious patterns 45% faster and reduce false positives by 30%.",
      proposer: "Agent Controller",
      status: "active",
      votesFor: 5240,
      votesAgainst: 890,
      totalVotes: 6130,
      endDate: "2025-11-18",
      category: "agent",
      icon: "🤖",
    },
    {
      id: "PROP-003",
      title: "Increase Gold Tier Max Loan to $1000",
      description:
        "Increase the maximum loan amount for Gold tier (800+ credit score) users from $500 to $1000 USDC. This will provide more financial flexibility for our most trusted borrowers.",
      proposer: "Community Member",
      status: "active",
      votesFor: 2890,
      votesAgainst: 3120,
      totalVotes: 6010,
      endDate: "2025-11-22",
      category: "parameter",
      icon: "💰",
    },
    {
      id: "PROP-004",
      title: "Add Collateral Support for ETH",
      description:
        "Enable ETH as collateral option in addition to USDC. This will allow users to stake ETH for lower interest rates and access more borrowing options.",
      proposer: "Treasury Agent",
      status: "passed",
      votesFor: 7890,
      votesAgainst: 1230,
      totalVotes: 9120,
      endDate: "2025-11-10",
      category: "treasury",
      icon: "⚡",
    },
  ];

  const handleVote = (proposalId: string, vote: "for" | "against") => {
    setVoteMessage(
      `Vote ${
        vote === "for" ? "FOR" : "AGAINST"
      } proposal ${proposalId} recorded!`
    );
    setShowVoteToast(true);
    setTimeout(() => setShowVoteToast(false), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[#FFD93D] text-[#0C0C0C]";
      case "passed":
        return "bg-[#00D26A] text-white";
      case "rejected":
        return "bg-[#FF6B6B] text-white";
      default:
        return "bg-[#EDEDED] text-[#8E8E8E]";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "interest":
        return "bg-blue-100 text-blue-600 border-blue-300";
      case "agent":
        return "bg-purple-100 text-purple-600 border-purple-300";
      case "parameter":
        return "bg-green-100 text-green-600 border-green-300";
      case "treasury":
        return "bg-orange-100 text-orange-600 border-orange-300";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };

  const calculateDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  };

  const activeProposals = proposals.filter((p) => p.status === "active");
  const completedProposals = proposals.filter((p) => p.status !== "active");

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-12">
            <div className="text-sm text-[#8E8E8E] uppercase tracking-wider font-medium mb-2">
              / GOVERNANCE DASHBOARD /
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              MicroDAO Governance
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Vote on proposals to shape the future of the protocol. Every token
              holder has a voice.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-[#FFD93D] to-[#FFC700] rounded-2xl p-6 shadow-lg">
              <div className="text-sm font-semibold text-[#0C0C0C]/70 uppercase tracking-wide mb-2">
                Active Proposals
              </div>
              <div className="text-4xl font-extrabold font-heading text-[#0C0C0C]">
                {activeProposals.length}
              </div>
            </div>
            <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
              <div className="text-sm font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">
                Total Proposals
              </div>
              <div className="text-4xl font-extrabold font-heading text-[#0C0C0C]">
                {proposals.length}
              </div>
            </div>
            <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
              <div className="text-sm font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">
                Your Voting Power
              </div>
              <div className="text-4xl font-extrabold font-heading text-[#0C0C0C]">
                127
              </div>
            </div>
            <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
              <div className="text-sm font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">
                Participation
              </div>
              <div className="text-4xl font-extrabold font-heading text-[#0C0C0C]">
                73%
              </div>
            </div>
          </div>

          {/* Active Proposals */}
          <div className="mb-12">
            <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
              Active Proposals
            </h2>
            <div className="space-y-6">
              {activeProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-4xl">{proposal.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                              proposal.status
                            )}`}
                          >
                            {proposal.status.toUpperCase()}
                          </span>
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full border ${getCategoryColor(
                              proposal.category
                            )}`}
                          >
                            {proposal.category.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-2">
                          {proposal.title}
                        </h3>
                        <p className="text-[#8E8E8E] mb-4 leading-relaxed">
                          {proposal.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-[#8E8E8E]">
                          <div className="flex items-center gap-2">
                            <FaRobot className="w-4 h-4" />
                            <span className="font-medium">
                              {proposal.proposer}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock className="w-4 h-4" />
                            <span className="font-medium">
                              {calculateDaysLeft(proposal.endDate)} days left
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voting Stats */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-[#0C0C0C]">
                        Voting Progress
                      </div>
                      <div className="text-sm font-extrabold text-[#0C0C0C]">
                        {proposal.totalVotes.toLocaleString()} votes
                      </div>
                    </div>
                    <div className="space-y-2">
                      {/* For Votes */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-sm font-semibold text-[#00D26A]">
                          FOR
                        </div>
                        <div className="flex-1 bg-[#EDEDED] rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-[#00D26A] h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                (proposal.votesFor / proposal.totalVotes) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <div className="w-20 text-right text-sm font-extrabold text-[#0C0C0C]">
                          {(
                            (proposal.votesFor / proposal.totalVotes) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                      {/* Against Votes */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-sm font-semibold text-[#FF6B6B]">
                          AGAINST
                        </div>
                        <div className="flex-1 bg-[#EDEDED] rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-[#FF6B6B] h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                (proposal.votesAgainst / proposal.totalVotes) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <div className="w-20 text-right text-sm font-extrabold text-[#0C0C0C]">
                          {(
                            (proposal.votesAgainst / proposal.totalVotes) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vote Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleVote(proposal.id, "for")}
                      className="flex-1 bg-[#00D26A] hover:bg-[#00B359] text-white px-6 py-3 rounded-2xl font-extrabold transition-colors uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                      <FaThumbsUp className="w-4 h-4" />
                      Vote For
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, "against")}
                      className="flex-1 bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-6 py-3 rounded-2xl font-extrabold transition-colors uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                      <FaThumbsDown className="w-4 h-4" />
                      Vote Against
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Proposals */}
          <div>
            <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
              Recent Completed Proposals
            </h2>
            <div className="space-y-4">
              {completedProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{proposal.icon}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                              proposal.status
                            )}`}
                          >
                            {proposal.status === "passed"
                              ? "PASSED ✓"
                              : "REJECTED ✗"}
                          </span>
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full border ${getCategoryColor(
                              proposal.category
                            )}`}
                          >
                            {proposal.category.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-lg font-extrabold font-heading text-[#0C0C0C] mb-1">
                          {proposal.title}
                        </h3>
                        <div className="text-sm text-[#8E8E8E]">
                          {proposal.votesFor.toLocaleString()} FOR ·{" "}
                          {proposal.votesAgainst.toLocaleString()} AGAINST
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <FaCheckCircle
                        className={`w-8 h-8 ${
                          proposal.status === "passed"
                            ? "text-[#00D26A]"
                            : "text-[#FF6B6B]"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Vote Toast */}
      {showVoteToast && (
        <Toast
          type="success"
          title="Vote Recorded!"
          message={voteMessage}
          onClose={() => setShowVoteToast(false)}
        />
      )}

      <Footer />
    </div>
  );
}
