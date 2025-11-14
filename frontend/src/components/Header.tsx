"use client";

import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useBalance, useChainId, useSwitchChain } from "wagmi";
import { useEffect, useState } from "react";
import { FaWallet, FaCopy, FaCheckCircle } from "react-icons/fa";

export default function Header() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [copied, setCopied] = useState(false);
  const targetChainId = 5042002;

  // Get wallet address
  const walletAddress = wallets[0]?.address || user?.wallet?.address;

  // Get balance
  const { data: balance } = useBalance({
    address: walletAddress as `0x${string}`,
    chainId: targetChainId,
  });

  // Auto-switch to target chain when connected
  useEffect(() => {
    if (authenticated && chainId && chainId !== targetChainId && switchChain && ready) {
      // Automatically switch to chain 5042002 when connected
      switchChain({ chainId: targetChainId });
    }
  }, [authenticated, chainId, targetChainId, switchChain, ready]);

  const handleConnect = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  const handleSwitchChain = () => {
    if (switchChain) {
      switchChain({ chainId: targetChainId });
    }
  };

  const copyAddress = () => {
    if (walletAddress && typeof window !== "undefined") {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return "0.00";
    const formatted = (Number(balance) / 1e18).toFixed(2);
    return formatted;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#EDEDED]">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="text-2xl font-bold font-heading text-[#0C0C0C]">
            lynq.
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-[#0C0C0C] text-sm font-medium hover:text-[#FFC700] transition-colors flex items-center gap-1">
              / Home /
            </Link>
            <Link href="/dashboard" className="text-[#0C0C0C] text-sm font-medium hover:text-[#FFC700] transition-colors flex items-center gap-1">
              / Dashboard /
            </Link>
            <Link href="/reputation" className="text-[#0C0C0C] text-sm font-medium hover:text-[#FFC700] transition-colors flex items-center gap-1">
              / Reputation /
            </Link>
            <Link href="/treasury" className="text-[#0C0C0C] text-sm font-medium hover:text-[#FFC700] transition-colors flex items-center gap-1">
              / Treasury /
            </Link>
            <Link href="/admin" className="text-[#0C0C0C] text-sm font-medium hover:text-[#FFC700] transition-colors flex items-center gap-1">
              / Admin /
            </Link>
            <Link href="/profile" className="text-[#0C0C0C] text-sm font-medium hover:text-[#FFC700] transition-colors flex items-center gap-1">
              / Profile /
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {ready && authenticated && walletAddress ? (
            <>
              {/* Balance Display */}
              {balance && (
                <div className="hidden md:flex items-center gap-2 bg-[#F6F6F6] px-4 py-2 rounded-full">
                  <FaWallet className="w-4 h-4 text-[#0C0C0C]" />
                  <span className="text-sm font-semibold text-[#0C0C0C]">
                    {formatBalance(balance.value)} {balance.symbol}
                  </span>
                </div>
              )}
              
              {/* Address Display */}
              <div className="flex items-center gap-2 bg-[#F6F6F6] px-4 py-2 rounded-full">
                <span className="text-sm font-mono text-[#0C0C0C]">
                  {shortenAddress(walletAddress)}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-[#8E8E8E] hover:text-[#0C0C0C] transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <FaCheckCircle className="w-4 h-4 text-[#00D26A]" />
                  ) : (
                    <FaCopy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Chain Switch Indicator */}
              {chainId !== targetChainId && (
                <button
                  onClick={handleSwitchChain}
                  className="bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                >
                  Switch Chain
                </button>
              )}

              {/* Disconnect Button */}
              <button
                onClick={handleConnect}
                className="bg-transparent border-2 border-[#FF6B6B] hover:border-[#FF4444] text-[#FF6B6B] hover:text-[#FF4444] px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={!ready}
              className="bg-[#FFD93D] hover:bg-[#FFC700] disabled:bg-[#EDEDED] disabled:text-[#8E8E8E] text-[#0C0C0C] px-6 py-2.5 rounded-full text-sm font-semibold transition-colors uppercase tracking-wide disabled:cursor-not-allowed"
            >
              {ready ? "Connect Wallet" : "Loading..."}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

