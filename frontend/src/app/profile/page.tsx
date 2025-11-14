"use client";

import { useState } from "react";
import { FaCopy, FaCheckCircle, FaTwitter, FaGithub, FaLinkedin, FaExternalLinkAlt } from "react-icons/fa";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";

export default function UserProfile() {
  const [copied, setCopied] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [connectedSocials] = useState(["Twitter", "GitHub", "LinkedIn"]);
  const { authenticated, logout, user } = usePrivy();
  const { wallets } = useWallets();
  
  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || user?.wallet?.address || "";
  
  // Mock data
  const creditTier = "Silver";
  const creditScore = 640;

  const copyWalletAddress = () => {
    if (walletAddress && typeof window !== "undefined") {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setShowCopyToast(true);
      setTimeout(() => {
        setShowCopyToast(false);
        setCopied(false);
      }, 3000);
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return "Not connected";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDisconnect = () => {
    if (logout) {
      logout();
    }
  };

  const getSocialIcon = (social: string) => {
    switch (social) {
      case "Twitter":
        return <FaTwitter className="w-5 h-5" />;
      case "GitHub":
        return <FaGithub className="w-5 h-5" />;
      case "LinkedIn":
        return <FaLinkedin className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getSocialColor = (social: string) => {
    switch (social) {
      case "Twitter":
        return "text-[#1DA1F2]";
      case "GitHub":
        return "text-[#0C0C0C]";
      case "LinkedIn":
        return "text-[#0077B5]";
      default:
        return "text-[#8E8E8E]";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="text-sm text-[#8E8E8E] uppercase tracking-wider font-medium mb-2">
              User Profile
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Account Settings
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Manage your identity, credit tier, and connected accounts.
            </p>
          </div>

          {/* Wallet Address Section */}
          <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
              Wallet Address
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-[#F6F6F6] rounded-2xl px-6 py-4 font-mono text-sm text-[#0C0C0C]">
                {walletAddress ? truncateAddress(walletAddress) : "Not connected"}
              </div>
              {walletAddress && (
                <button
                  onClick={copyWalletAddress}
                  className="bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-6 py-4 rounded-2xl font-semibold transition-colors flex items-center gap-2"
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
              )}
            </div>
            
          </div>

          {/* Social Badges Section */}
          <div className="bg-white border-2 border-[#EDEDED] rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-extrabold font-heading text-[#0C0C0C] mb-6">
              Connected Accounts
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {connectedSocials.map((social) => (
                <div
                  key={social}
                  className="border-2 border-[#00D26A] bg-[#00D26A]/10 rounded-2xl p-6 flex flex-col items-center justify-center"
                >
                  <div className={`mb-3 ${getSocialColor(social)}`}>
                    {getSocialIcon(social)}
                  </div>
                  <div className="text-sm font-semibold text-[#0C0C0C] mb-2">
                    {social}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#00D26A]">
                    <FaCheckCircle className="w-3 h-3" />
                    <span>Connected</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Tier Badge */}
          <div className="bg-gradient-to-br from-[#FFD93D] to-[#FFC700] rounded-2xl p-8 shadow-lg mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#0C0C0C]/70 uppercase tracking-wide mb-2">
                  Current Credit Tier
                </div>
                <div className="text-4xl font-extrabold font-heading text-[#0C0C0C] mb-2">
                  {creditTier} Tier
                </div>
                <div className="text-lg text-[#0C0C0C]">
                  Credit Score: {creditScore}
                </div>
              </div>
              <div className="text-6xl">🏆</div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="space-y-4">
            <button className="w-full bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-8 py-4 rounded-2xl font-extrabold transition-colors uppercase tracking-wide flex items-center justify-center gap-3">
              <FaExternalLinkAlt className="w-5 h-5" />
              <span>View Onchain History</span>
            </button>
            
            <button
              onClick={handleDisconnect}
              disabled={!authenticated}
              className="w-full bg-transparent border-2 border-[#FF6B6B] hover:border-[#FF4444] disabled:border-[#EDEDED] disabled:text-[#8E8E8E] text-[#FF6B6B] hover:text-[#FF4444] px-8 py-4 rounded-2xl font-semibold transition-colors disabled:cursor-not-allowed"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      </main>

      {/* Copy Toast */}
      {showCopyToast && (
        <Toast
          type="success"
          title="Success !"
          message="Wallet address copied to clipboard!"
          onClose={() => setShowCopyToast(false)}
        />
      )}

      <Footer />
    </div>
  );
}

