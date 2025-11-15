"use client";

import { useState } from "react";
import {
  FaRobot,
  FaCheckCircle,
  FaChartLine,
  FaShieldAlt,
  FaCoins,
  FaStar,
  FaClock,
} from "react-icons/fa";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface AgentActivity {
  timestamp: string;
  action: string;
  result: string;
  status: "success" | "warning" | "info";
}

interface Agent {
  id: string;
  name: string;
  type: "treasury" | "reputation" | "fraud";
  status: "active" | "idle" | "processing";
  description: string;
  icon: React.ReactNode;
  metrics: {
    label: string;
    value: string;
  }[];
  recentActivity: AgentActivity[];
}

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>("treasury");

  const agents: Agent[] = [
    {
      id: "treasury",
      name: "Treasury Agent",
      type: "treasury",
      status: "active",
      description:
        "Manages protocol liquidity, optimizes capital allocation, and ensures sufficient reserves for loan disbursements. Monitors pool health and rebalances assets automatically.",
      icon: <FaCoins className="w-8 h-8" />,
      metrics: [
        { label: "Total Liquidity", value: "$124,580 USDC" },
        { label: "Utilization Rate", value: "67.3%" },
        { label: "Reserve Ratio", value: "32.7%" },
        { label: "Active Loans", value: "247" },
      ],
      recentActivity: [
        {
          timestamp: "2 mins ago",
          action: "Rebalanced liquidity pool",
          result: "Moved $5,000 USDC to emergency reserve",
          status: "success",
        },
        {
          timestamp: "15 mins ago",
          action: "Loan disbursement approved",
          result: "$10 USDC disbursed to 0xABC...123",
          status: "success",
        },
        {
          timestamp: "1 hour ago",
          action: "Liquidity threshold check",
          result: "All pools above minimum threshold",
          status: "info",
        },
        {
          timestamp: "2 hours ago",
          action: "Interest rate adjustment",
          result: "Reduced rate by 0.1% due to high liquidity",
          status: "warning",
        },
      ],
    },
    {
      id: "reputation",
      name: "Reputation Agent",
      type: "reputation",
      status: "processing",
      description:
        "Calculates and updates credit scores in real-time based on repayment history, on-chain activity, and referral networks. Manages tier upgrades and NFT badge minting.",
      icon: <FaStar className="w-8 h-8" />,
      metrics: [
        { label: "Scores Updated Today", value: "1,234" },
        { label: "Avg Score Increase", value: "+12 pts" },
        { label: "Tier Upgrades", value: "45" },
        { label: "NFT Badges Minted", value: "18" },
      ],
      recentActivity: [
        {
          timestamp: "Just now",
          action: "Credit score updated",
          result: "User 0xDEF...456 score: 620 → 632 (+12)",
          status: "success",
        },
        {
          timestamp: "5 mins ago",
          action: "Tier upgrade processed",
          result: "User 0xABC...789 upgraded to Silver",
          status: "success",
        },
        {
          timestamp: "12 mins ago",
          action: "Referral bonus applied",
          result: "+10 score bonus for verified referral",
          status: "info",
        },
        {
          timestamp: "30 mins ago",
          action: "Late payment detected",
          result: "Score reduced by -15 for user 0xGHI...012",
          status: "warning",
        },
      ],
    },
    {
      id: "fraud",
      name: "Fraud Detection Agent",
      type: "fraud",
      status: "active",
      description:
        "Monitors suspicious patterns, detects abuse attempts, and flags high-risk transactions. Uses ML models to identify Sybil attacks, rapid borrowing patterns, and collusion.",
      icon: <FaShieldAlt className="w-8 h-8" />,
      metrics: [
        { label: "Threats Detected", value: "23" },
        { label: "Accounts Flagged", value: "8" },
        { label: "False Positive Rate", value: "2.1%" },
        { label: "Risk Score Avg", value: "Low (12/100)" },
      ],
      recentActivity: [
        {
          timestamp: "3 mins ago",
          action: "Suspicious pattern detected",
          result: "Flagged wallet 0xBAD...999 for review (rapid borrowing)",
          status: "warning",
        },
        {
          timestamp: "20 mins ago",
          action: "Sybil attack prevented",
          result: "Blocked 5 related accounts attempting collusion",
          status: "success",
        },
        {
          timestamp: "45 mins ago",
          action: "Risk assessment complete",
          result: "All active loans assessed - 2 flagged high risk",
          status: "info",
        },
        {
          timestamp: "1 hour ago",
          action: "False positive resolved",
          result: "User 0xGOOD...111 cleared after review",
          status: "success",
        },
      ],
    },
  ];

  const currentAgent = agents.find((a) => a.id === selectedAgent) || agents[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[#00D26A] text-white";
      case "processing":
        return "bg-[#FFD93D] text-[#0C0C0C]";
      case "idle":
        return "bg-[#8E8E8E] text-white";
      default:
        return "bg-[#EDEDED] text-[#8E8E8E]";
    }
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case "success":
        return <FaCheckCircle className="w-4 h-4 text-[#00D26A]" />;
      case "warning":
        return <FaShieldAlt className="w-4 h-4 text-[#FFD93D]" />;
      case "info":
        return <FaChartLine className="w-4 h-4 text-[#8E8E8E]" />;
      default:
        return <FaClock className="w-4 h-4 text-[#8E8E8E]" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-12">
            <div className="text-sm text-[#8E8E8E] uppercase tracking-wider font-medium mb-2">
              / MULTI-AGENT SYSTEM /
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Autonomous Agent Dashboard
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Monitor and manage AI agents powering the protocol. Real-time
              insights into treasury management, reputation scoring, and fraud
              detection.
            </p>
          </div>

          {/* Agent Selector Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  selectedAgent === agent.id
                    ? "border-[#FFD93D] bg-[#FFD93D]/10 shadow-lg"
                    : "border-[#EDEDED] hover:border-[#FFD93D]/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#0C0C0C] flex items-center justify-center text-[#FFD93D]">
                    {agent.icon}
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                      agent.status
                    )}`}
                  >
                    {agent.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold font-heading text-[#0C0C0C] mb-2">
                  {agent.name}
                </h3>
                <p className="text-sm text-[#8E8E8E] line-clamp-2">
                  {agent.description}
                </p>
              </button>
            ))}
          </div>

          {/* Selected Agent Details */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Agent Info & Metrics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Agent Overview */}
              <div className="bg-gradient-to-br from-[#0C0C0C] to-[#1A1A1A] rounded-2xl p-8 shadow-lg">
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-[#FFD93D] text-black flex items-center justify-center flex-shrink-0">
                    {currentAgent.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-3xl font-extrabold font-heading text-white">
                        {currentAgent.name}
                      </h2>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                          currentAgent.status
                        )}`}
                      >
                        {currentAgent.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[#8E8E8E] leading-relaxed">
                      {currentAgent.description}
                    </p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {currentAgent.metrics.map((metric, index) => (
                    <div
                      key={index}
                      className="bg-white/10 rounded-2xl p-4 border border-white/20"
                    >
                      <div className="text-sm text-[#8E8E8E] mb-1">
                        {metric.label}
                      </div>
                      <div className="text-2xl font-extrabold font-heading text-white">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Controls */}
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg">
                <h3 className="text-xl font-extrabold font-heading text-[#0C0C0C] mb-6">
                  Agent Controls
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <button className="bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-6 py-3 rounded-2xl font-semibold transition-colors">
                    Pause Agent
                  </button>
                  <button className="bg-white border-2 border-[#EDEDED] hover:border-[#0C0C0C] text-[#0C0C0C] px-6 py-3 rounded-2xl font-semibold transition-colors">
                    View Logs
                  </button>
                  <button className="bg-white border-2 border-[#EDEDED] hover:border-[#0C0C0C] text-[#0C0C0C] px-6 py-3 rounded-2xl font-semibold transition-colors">
                    Configure
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-extrabold font-heading text-[#0C0C0C] mb-6">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {currentAgent.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="pb-4 border-b border-[#EDEDED] last:border-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {getActivityIcon(activity.status)}
                      <div className="flex-1">
                        <div className="text-xs text-[#8E8E8E] mb-1">
                          {activity.timestamp}
                        </div>
                        <div className="text-sm font-semibold text-[#0C0C0C] mb-1">
                          {activity.action}
                        </div>
                        <div className="text-xs text-[#8E8E8E]">
                          {activity.result}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Overview */}
          <div className="mt-12 bg-gradient-to-br from-[#FFD93D] to-[#FFC700] rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <FaRobot className="w-12 h-12 text-[#0C0C0C]" />
              <div>
                <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-1">
                  Multi-Agent System Status
                </h2>
                <p className="text-[#0C0C0C]/70">
                  All agents operational and processing transactions
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/90 rounded-2xl p-4">
                <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                  System Uptime
                </div>
                <div className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                  99.9%
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl p-4">
                <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                  Transactions/Hour
                </div>
                <div className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                  2,456
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl p-4">
                <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                  Response Time
                </div>
                <div className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                  124ms
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl p-4">
                <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                  Error Rate
                </div>
                <div className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                  0.03%
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
