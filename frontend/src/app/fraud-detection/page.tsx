"use client";

import { useState } from "react";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaBan,
  FaEye,
  FaUserSlash,
} from "react-icons/fa";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FraudAlert {
  id: string;
  timestamp: string;
  walletAddress: string;
  riskLevel: "high" | "medium" | "low";
  category: string;
  description: string;
  action: string;
  status: "flagged" | "resolved" | "monitoring";
}

interface RiskMetric {
  label: string;
  value: string;
  change: number;
  status: "good" | "warning" | "danger";
}

export default function FraudDetectionPage() {
  const [timeFilter, setTimeFilter] = useState("24h");

  // Mock fraud detection data
  const riskMetrics: RiskMetric[] = [
    {
      label: "Overall Risk Score",
      value: "12/100",
      change: -3,
      status: "good",
    },
    { label: "Active Threats", value: "3", change: -2, status: "good" },
    { label: "Flagged Accounts", value: "8", change: +1, status: "warning" },
    {
      label: "Blocked Transactions",
      value: "23",
      change: +5,
      status: "warning",
    },
  ];

  const fraudAlerts: FraudAlert[] = [
    {
      id: "ALERT-001",
      timestamp: "2 mins ago",
      walletAddress: "0xBAD1...7890",
      riskLevel: "high",
      category: "Rapid Borrowing",
      description:
        "User attempted to take 5 loans within 10 minutes across different wallets",
      action: "Account flagged, transactions blocked",
      status: "flagged",
    },
    {
      id: "ALERT-002",
      timestamp: "15 mins ago",
      walletAddress: "0xSUSP...4567",
      riskLevel: "high",
      category: "Sybil Attack",
      description:
        "5 related accounts detected attempting coordinated borrowing",
      action: "All accounts blocked, IPs logged",
      status: "flagged",
    },
    {
      id: "ALERT-003",
      timestamp: "1 hour ago",
      walletAddress: "0xSCAM...1234",
      riskLevel: "medium",
      category: "Collusion Pattern",
      description: "Circular referral pattern detected between 3 wallets",
      action: "Under investigation, reputation bonuses revoked",
      status: "monitoring",
    },
    {
      id: "ALERT-004",
      timestamp: "2 hours ago",
      walletAddress: "0xGOOD...9876",
      riskLevel: "low",
      category: "False Positive",
      description:
        "Flagged for rapid activity, verified as legitimate business use",
      action: "Account cleared, whitelist added",
      status: "resolved",
    },
    {
      id: "ALERT-005",
      timestamp: "3 hours ago",
      walletAddress: "0xFRAUD...5555",
      riskLevel: "high",
      category: "Fake Collateral",
      description: "Attempted to use cloned ERC20 token as collateral",
      action: "Transaction rejected, account permanently banned",
      status: "flagged",
    },
  ];

  const abuseCategories = [
    { name: "Sybil Attacks", count: 12, severity: "high", blocked: 10 },
    { name: "Rapid Borrowing", count: 8, severity: "medium", blocked: 7 },
    { name: "Fake Collateral", count: 3, severity: "high", blocked: 3 },
    { name: "Collusion", count: 5, severity: "medium", blocked: 4 },
    { name: "Identity Theft", count: 2, severity: "high", blocked: 2 },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-[#FF6B6B] text-white";
      case "medium":
        return "bg-[#FFD93D] text-[#0C0C0C]";
      case "low":
        return "bg-[#00D26A] text-white";
      default:
        return "bg-[#8E8E8E] text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "flagged":
        return "border-[#FF6B6B] bg-[#FF6B6B]/10";
      case "monitoring":
        return "border-[#FFD93D] bg-[#FFD93D]/10";
      case "resolved":
        return "border-[#00D26A] bg-[#00D26A]/10";
      default:
        return "border-[#EDEDED] bg-white";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <FaBan className="w-5 h-5 text-[#FF6B6B]" />;
      case "medium":
        return <FaExclamationTriangle className="w-5 h-5 text-[#FFD93D]" />;
      default:
        return <FaEye className="w-5 h-5 text-[#00D26A]" />;
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
              / FRAUD DETECTION SYSTEM /
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Abuse Prevention Dashboard
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Real-time monitoring of suspicious activities, fraud patterns, and
              automated threat prevention.
            </p>
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-4 mb-8">
            <span className="text-sm font-semibold text-[#0C0C0C]">
              Time Range:
            </span>
            <div className="flex gap-2">
              {["1h", "24h", "7d", "30d"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    timeFilter === filter
                      ? "bg-[#FFD93D] text-[#0C0C0C]"
                      : "bg-white border-2 border-[#EDEDED] text-[#8E8E8E] hover:border-[#FFD93D]"
                  }`}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Metrics Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {riskMetrics.map((metric, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 shadow-lg border-2 ${
                  metric.status === "good"
                    ? "bg-[#00D26A]/10 border-[#00D26A]"
                    : metric.status === "warning"
                    ? "bg-[#FFD93D]/10 border-[#FFD93D]"
                    : "bg-[#FF6B6B]/10 border-[#FF6B6B]"
                }`}
              >
                <div className="text-sm font-semibold text-[#8E8E8E] uppercase tracking-wide mb-2">
                  {metric.label}
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-4xl font-extrabold font-heading text-[#0C0C0C]">
                    {metric.value}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      metric.change < 0 ? "text-[#00D26A]" : "text-[#FF6B6B]"
                    }`}
                  >
                    {metric.change > 0 ? "+" : ""}
                    {metric.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Recent Alerts */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
                Recent Fraud Alerts
              </h2>
              <div className="space-y-4">
                {fraudAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-2xl p-6 border-2 ${getStatusColor(
                      alert.status
                    )} transition-all`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FaShieldAlt
                          className={`w-6 h-6 ${
                            alert.riskLevel === "high"
                              ? "text-[#FF6B6B]"
                              : alert.riskLevel === "medium"
                              ? "text-[#FFD93D]"
                              : "text-[#00D26A]"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-semibold px-3 py-1 rounded-full ${getRiskColor(
                                alert.riskLevel
                              )}`}
                            >
                              {alert.riskLevel.toUpperCase()} RISK
                            </span>
                            <span className="text-xs font-medium text-[#8E8E8E]">
                              {alert.timestamp}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-[#8E8E8E]">
                            {alert.id} · {alert.walletAddress}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-lg font-extrabold font-heading text-[#0C0C0C] mb-2">
                        {alert.category}
                      </div>
                      <p className="text-sm text-[#8E8E8E] mb-3">
                        {alert.description}
                      </p>
                      <div className="bg-white rounded-xl p-3 border border-[#EDEDED]">
                        <div className="text-xs font-semibold text-[#8E8E8E] uppercase tracking-wide mb-1">
                          Action Taken
                        </div>
                        <div className="text-sm font-semibold text-[#0C0C0C]">
                          {alert.action}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="flex-1 bg-[#0C0C0C] hover:bg-[#1A1A1A] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                        View Details
                      </button>
                      {alert.status === "monitoring" && (
                        <button className="flex-1 bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                          Block Account
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Abuse Categories */}
            <div>
              <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
                Abuse Categories
              </h2>
              <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-6 shadow-lg">
                <div className="space-y-4">
                  {abuseCategories.map((category, index) => (
                    <div
                      key={index}
                      className="pb-4 border-b border-[#EDEDED] last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(category.severity)}
                          <div>
                            <div className="text-sm font-extrabold text-[#0C0C0C] mb-1">
                              {category.name}
                            </div>
                            <div className="text-xs text-[#8E8E8E]">
                              {category.count} attempts detected
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-extrabold font-heading text-[#0C0C0C]">
                            {category.blocked}
                          </div>
                          <div className="text-xs text-[#8E8E8E]">blocked</div>
                        </div>
                      </div>
                      <div className="w-full bg-[#EDEDED] rounded-full h-2">
                        <div
                          className={`h-full rounded-full ${
                            category.severity === "high"
                              ? "bg-[#FF6B6B]"
                              : "bg-[#FFD93D]"
                          }`}
                          style={{
                            width: `${
                              (category.blocked / category.count) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Model Stats */}
              <div className="mt-6 bg-gradient-to-br from-[#0C0C0C] to-[#1A1A1A] rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-extrabold font-heading text-white mb-4">
                  AI Model Performance
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#8E8E8E]">
                        Detection Accuracy
                      </span>
                      <span className="text-sm font-bold text-white">
                        97.9%
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-[#00D26A] h-full rounded-full"
                        style={{ width: "97.9%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#8E8E8E]">
                        False Positive Rate
                      </span>
                      <span className="text-sm font-bold text-white">2.1%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-[#FFD93D] h-full rounded-full"
                        style={{ width: "2.1%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#8E8E8E]">
                        Response Time
                      </span>
                      <span className="text-sm font-bold text-white">87ms</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-[#FFD93D] h-full rounded-full"
                        style={{ width: "87%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prevention Stats */}
          <div className="bg-gradient-to-br from-[#FFD93D] to-[#FFC700] rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#0C0C0C] flex items-center justify-center">
                <FaUserSlash className="w-8 h-8 text-[#FFD93D]" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-1">
                  Fraud Prevention Impact
                </h2>
                <p className="text-[#0C0C0C]/70">
                  Total losses prevented and system protection metrics
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/90 rounded-2xl p-4">
                <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                  Losses Prevented
                </div>
                <div className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                  $47,890
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl p-4">
                <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                  Attacks Blocked
                </div>
                <div className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                  156
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl p-4">
                <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                  Accounts Protected
                </div>
                <div className="text-2xl font-extrabold font-heading text-[#0C0C0C]">
                  1,234
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl p-4">
                <div className="text-sm font-medium text-[#8E8E8E] mb-1">
                  System Health
                </div>
                <div className="text-2xl font-extrabold font-heading text-[#00D26A]">
                  Excellent
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
