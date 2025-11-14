"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaGithub, FaLinkedin, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { usePrivy, useLoginWithOAuth, useWallets } from "@privy-io/react-auth";
import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";
import type { ISuccessResult, IErrorState } from "@worldcoin/idkit";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import { FaXTwitter } from "react-icons/fa6";
import { useVerification } from "@/lib/hooks/useVerification";
import { api } from "@/lib/api/client";

export default function VerifyIdentity() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { initOAuth } = useLoginWithOAuth();
  const {
    isVerified: checkSBTVerification,
    getTokenId,
    mintSBT,
  } = useVerification();

  const [showVerificationToast, setShowVerificationToast] = useState(false);
  const [showMintToast, setShowMintToast] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [badgeMinted, setBadgeMinted] = useState(false);
  const [connectingSocial, setConnectingSocial] = useState<string | null>(null);
  const [worldIDVerified, setWorldIDVerified] = useState(false);
  const [sbtTokenId, setSbtTokenId] = useState(0);
  const [mintTxHash, setMintTxHash] = useState<string>("");
  const [userCreated, setUserCreated] = useState(false);
  const [worldIDError, setWorldIDError] = useState<string | null>(null);

  const walletAddress = wallets[0]?.address || user?.wallet?.address || "";

  // Get connected social accounts from Privy user object
  // We track all connected socials for display
  const allConnectedSocials: string[] = [];
  if (user?.twitter) allConnectedSocials.push("Twitter");
  if (user?.github) allConnectedSocials.push("GitHub");
  if (user?.google) allConnectedSocials.push("Google");
  if (user?.linkedin) allConnectedSocials.push("LinkedIn");

  // Count only the required socials: Twitter, GitHub, LinkedIn (at least 2 of 3 required)
  const requiredSocials: string[] = [];
  if (user?.twitter) requiredSocials.push("Twitter");
  if (user?.github) requiredSocials.push("GitHub");
  if (user?.linkedin) requiredSocials.push("LinkedIn");

  const requiredSocialsCount = requiredSocials.length;
  const hasMinimumSocials = requiredSocialsCount >= 2;

  // Verification is complete only if:
  // 1. World ID is verified (optional for testing)
  // 2. At least 2 of 3 socials (Twitter, GitHub, LinkedIn) are verified (required)
  const isFullyVerified = hasMinimumSocials;

  // Check if World ID is properly configured
  const worldIDAppId = process.env.NEXT_PUBLIC_WORLD_ID_APP_ID?.trim();
  const worldIDAction =
    process.env.NEXT_PUBLIC_WORLD_ID_ACTION?.trim() || "verify";
  const isWorldIDConfigured =
    worldIDAppId &&
    worldIDAppId !== "app_xxxxxxx" &&
    worldIDAppId.startsWith("app_");

  // Prepare signal - must be a string or undefined
  // According to World ID docs, signal is optional and should be undefined if not provided
  // If wallet is connected, use the address as signal to prevent replay attacks
  const worldIDSignal =
    walletAddress && walletAddress.length > 0 ? walletAddress : undefined;

  // Debug logging (remove in production)
  useEffect(() => {
    if (isWorldIDConfigured) {
      console.log("World ID Config:", {
        app_id: worldIDAppId,
        action: worldIDAction,
        verification_level: "Device (for testing)",
        signal: worldIDSignal
          ? `${worldIDSignal.substring(0, 10)}...`
          : "undefined",
        hasWallet: !!walletAddress,
      });
      console.log("💡 Make sure:");
      console.log("  1. Action identifier in portal matches:", worldIDAction);
      console.log("  2. You have World App installed");
      console.log("  3. You've completed Device verification in World App");
      console.log(
        "⚠️  NOTE: Using Device verification for testing. Switch to Orb for production!"
      );
    }
  }, [
    worldIDAppId,
    worldIDAction,
    worldIDSignal,
    walletAddress,
    isWorldIDConfigured,
  ]);

  // handleVerify is called when the proof is received, before showing success screen
  // This is where we verify the proof on the backend
  // Throwing an error here will show the user a custom error message
  const handleVerify = async (proof: ISuccessResult) => {
    setWorldIDError(null);
    console.log("🔍 Verifying proof on backend...", {
      hasProof: !!proof,
      proofKeys: proof ? Object.keys(proof) : [],
      expectedSignal: worldIDSignal,
      app_id: worldIDAppId,
      action: worldIDAction,
    });

    try {
      // Include the signal in the request so backend can verify it
      const requestBody = {
        ...proof,
        signal: worldIDSignal, // Include the signal that was used in frontend
      };

      const response = await fetch("/api/worldid/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("📡 Backend response:", {
        status: response.status,
        success: data.success,
        error: data.error,
        detail: data.detail,
      });

      if (!response.ok) {
        const errorMsg =
          data.error ||
          data.detail ||
          `HTTP ${response.status}: Verification failed`;
        console.error("❌ Verification failed:", errorMsg);
        throw new Error(errorMsg);
      }

      if (!data.success) {
        const errorMsg = data.error || data.detail || "Verification failed";
        console.error("❌ Verification unsuccessful:", errorMsg);
        throw new Error(errorMsg);
      }

      console.log("✅ Verification successful!");
    } catch (error) {
      console.error("💥 Error in handleVerify:", error);
      throw error; // Re-throw to show error in World ID modal
    }
  };

  // onSuccess is called when the modal is closed after successful verification
  // This is where we update the UI
  const handleWorldIDSuccess = async () => {
    setWorldIDVerified(true);
    setShowVerificationToast(true);
    setTimeout(() => setShowVerificationToast(false), 3000);

    // Save verification data to backend
    await saveVerificationToBackend();
  };

  // Save verification data to backend MongoDB
  const saveVerificationToBackend = async () => {
    if (!walletAddress) return;

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

      // Prepare social verifications data
      const socialVerifications: Array<{
        platform: string;
        username?: string;
        accountId?: string;
        email?: string;
        verifiedAt: string;
      }> = [];

      if (user?.twitter) {
        const twitterData = user.twitter as {
          username?: string | null;
          accountId?: string;
        };
        socialVerifications.push({
          platform: "twitter",
          username: twitterData.username || undefined,
          accountId: twitterData.accountId || undefined,
          verifiedAt: new Date().toISOString(),
        });
      }
      if (user?.github) {
        const githubData = user.github as {
          username?: string | null;
          accountId?: string;
        };
        socialVerifications.push({
          platform: "github",
          username: githubData.username || undefined,
          accountId: githubData.accountId || undefined,
          verifiedAt: new Date().toISOString(),
        });
      }
      if (user?.linkedin) {
        const linkedinData = user.linkedin as {
          username?: string;
          accountId?: string;
        };
        socialVerifications.push({
          platform: "linkedin",
          username: linkedinData.username || undefined,
          accountId: linkedinData.accountId || undefined,
          verifiedAt: new Date().toISOString(),
        });
      }
      if (user?.google) {
        const googleData = user.google as {
          email?: string | null;
          accountId?: string;
        };
        socialVerifications.push({
          platform: "google",
          email: googleData.email || undefined,
          accountId: googleData.accountId || undefined,
          verifiedAt: new Date().toISOString(),
        });
      }

      // Prepare World ID verification data
      const worldIDVerification = worldIDVerified
        ? {
            verified: true,
            verificationLevel: "device" as const, // or 'orb' based on your setting
            verifiedAt: new Date().toISOString(),
            action: worldIDAction,
            signal: worldIDSignal,
          }
        : undefined;

      const response = await fetch(
        `${backendUrl}/api/user/${walletAddress}/verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            worldIDVerification,
            socialVerifications,
            verificationSBT: badgeMinted ? "minted" : undefined,
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Verification data saved to backend");
      } else {
        console.error(
          "Failed to save verification data:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error saving verification to backend:", error);
    }
  };

  // Load verification data from backend on mount
  useEffect(() => {
    const loadVerificationData = async () => {
      if (!walletAddress) return;

      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const response = await fetch(
          `${backendUrl}/api/user/${walletAddress}/verification`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Update World ID verification status
            if (data.data.worldIDVerification?.verified) {
              setWorldIDVerified(true);
            }
            // Badge minting status could be checked from verificationSBT
            if (data.data.verificationSBT) {
              setBadgeMinted(true);
            }
          }
        }
      } catch (error) {
        console.error("Error loading verification data:", error);
      }
    };

    if (walletAddress) {
      loadVerificationData();
    }
  }, [walletAddress]);

  // Save verification data whenever verification status changes
  useEffect(() => {
    if (walletAddress && (worldIDVerified || requiredSocialsCount >= 2)) {
      saveVerificationToBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldIDVerified, requiredSocialsCount, walletAddress, badgeMinted]);

  const handleWorldIDError = (error: IErrorState) => {
    console.error("World ID error:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      app_id: worldIDAppId,
      action: worldIDAction,
      hasSignal: !!worldIDSignal,
    });

    let errorMessage = "Failed to open World App";
    if (error.code === "verification_rejected") {
      errorMessage = `Verification Cancelled - You cancelled the request in World App.

📱 To complete verification:
1. Click the "Verify" button again
2. Open World App when prompted
3. Follow the verification steps
4. Approve the verification request

💡 TIP: Make sure you have Device verification enabled in World App before trying again.`;
    } else if (error.code === "malformed_request") {
      errorMessage = `Malformed request - Please check:
1. App ID matches Developer Portal: ${worldIDAppId ? "✓ Set" : "✗ Missing"}
2. Action matches Developer Portal: "${worldIDAction}" 
   → Check Developer Portal: https://developer.worldcoin.org
   → Go to your App → Actions section
   → Action name must match EXACTLY (case-sensitive)
3. Wallet connected: ${walletAddress ? "✓ Yes" : "✗ No"}
4. Signal: ${worldIDSignal ? "✓ Set" : "Not required"}

💡 TIP: If action doesn't exist in portal, create it first!
   Common action names: "verify", "login", "sign-in"`;
    } else if (error.code === "failed_by_host_app") {
      errorMessage = `Backend Verification Failed - The proof couldn't be verified on our server.

🔍 Common causes:
1. App ID mismatch - Check your .env.local file
2. Action mismatch - Must match Developer Portal exactly
3. Signal mismatch - Signal must match between frontend and backend
4. Network error - Check server logs for details

💡 Check your browser console and server logs for more details.
   The error details should show what went wrong.`;
    } else if (error.code === "credential_unavailable") {
      errorMessage = `Credential Unavailable - You need to verify with World ID first!

📱 Steps to verify:
1. Download World App: https://worldcoin.org/download
2. Complete Device verification in World App
   → Open World App → Verify Identity → Use Device verification
   → This can be done on your phone (no Orb needed)
3. Return here and try again

💡 This app is configured for Device verification (testing mode)
   → For production, consider switching to Orb verification`;
    } else {
      errorMessage = error.code || error.message || "Failed to open World App";
      if (error.message?.includes("verification level")) {
        errorMessage +=
          "\n\n💡 This app requires Device verification. Make sure you've completed Device verification in World App.";
      }
    }
    setWorldIDError(errorMessage);
  };

  const handleSocialConnect = async (social: string) => {
    if (allConnectedSocials.includes(social)) {
      return; // Already connected
    }

    if (!initOAuth) {
      console.error("initOAuth not available");
      return;
    }

    setConnectingSocial(social);
    try {
      // Map social names to Privy's OAuth provider format
      const privySocialMap: Record<
        string,
        "twitter" | "github" | "google" | "linkedin"
      > = {
        Twitter: "twitter",
        GitHub: "github",
        Google: "google",
        LinkedIn: "linkedin",
      };

      const privySocial = privySocialMap[social];
      if (privySocial) {
        await initOAuth({ provider: privySocial });
        setShowVerificationToast(true);
        setTimeout(() => setShowVerificationToast(false), 3000);
      }
    } catch (error) {
      console.error("Error connecting social:", error);
    } finally {
      setConnectingSocial(null);
    }
  };

  // Check if SBT is already minted and create user in backend
  useEffect(() => {
    const initUser = async () => {
      if (!walletAddress) return;

      try {
        // Check if SBT is already minted
        const sbtVerified = await checkSBTVerification();
        if (sbtVerified) {
          setBadgeMinted(true);
          const tokenId = await getTokenId();
          setSbtTokenId(tokenId);
        }

        // Create or update user in backend
        if ((await checkSBTVerification()) && !userCreated) {
          const verifiedMethods: string[] = [];
          if (worldIDVerified) verifiedMethods.push("worldid");
          if (user?.twitter) verifiedMethods.push("twitter");
          if (user?.github) verifiedMethods.push("github");
          if (user?.google) verifiedMethods.push("google");
          if (user?.linkedin) verifiedMethods.push("linkedin");

          await api.createUser({
            address: walletAddress,
            verifiedMethods,
            verificationSBT: sbtVerified
              ? `Token ID: ${sbtTokenId}`
              : undefined,
          });

          setUserCreated(true);
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };

    initUser();
  }, [
    walletAddress,
    checkSBTVerification,
    worldIDVerified,
    user,
    getTokenId,
    sbtTokenId,
    userCreated,
  ]);

  // Show verification toast when fully verified
  useEffect(() => {
    if (isFullyVerified) {
      setShowVerificationToast(true);
      setTimeout(() => setShowVerificationToast(false), 3000);
    }
  }, [isFullyVerified]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="text-sm text-[#8E8E8E] uppercase tracking-wider font-medium mb-2">
              Step 1 of 3 — Verify Identity
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold font-heading text-[#0C0C0C] mb-4">
              Establish trust and eligibility
            </h1>
            <p className="text-lg text-[#8E8E8E]">
              Connect at least 2 socials (Twitter, GitHub, or LinkedIn) to start
              borrowing. World ID is optional.
            </p>
          </div>

          {/* Verification Options */}
          <div className="space-y-4 mb-8">
            {/* World ID */}
            {isWorldIDConfigured ? (
              <IDKitWidget
                app_id={worldIDAppId as `app_${string}`}
                action={worldIDAction}
                verification_level={VerificationLevel.Device}
                {...(worldIDSignal ? { signal: worldIDSignal } : {})}
                handleVerify={handleVerify}
                onSuccess={handleWorldIDSuccess}
                onError={handleWorldIDError}
              >
                {({ open }) => (
                  <button
                    onClick={open}
                    disabled={worldIDVerified || !walletAddress}
                    className="w-full bg-[#0C0C0C] hover:bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl font-semibold transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      {worldIDVerified ? (
                        <FaCheckCircle className="w-5 h-5 text-[#00D26A]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-white"></div>
                      )}
                      <span>World ID</span>
                    </div>
                    <span className="text-sm text-[#8E8E8E]">
                      {worldIDVerified
                        ? "Verified"
                        : !walletAddress
                        ? "Connect Wallet First"
                        : "Verify"}
                    </span>
                  </button>
                )}
              </IDKitWidget>
            ) : (
              <button
                disabled
                className="w-full bg-[#0C0C0C] opacity-50 text-white px-6 py-4 rounded-2xl font-semibold flex items-center justify-between cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-white"></div>
                  <span>World ID</span>
                </div>
                <span className="text-sm text-[#8E8E8E]">Not Configured</span>
              </button>
            )}

            {/* World ID Error Message */}
            {worldIDError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-800 font-medium mb-1">
                  World ID Error
                </p>
                <p className="text-xs text-red-600 mb-2">{worldIDError}</p>
                {worldIDError.includes("malformed") && (
                  <div className="text-xs text-red-500 space-y-1 mb-2">
                    <p className="font-semibold">Common causes:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        Invalid or missing App ID - Check your
                        NEXT_PUBLIC_WORLD_ID_APP_ID
                      </li>
                      <li>App not registered in World ID Developer Portal</li>
                      <li>Wallet not connected - Connect your wallet first</li>
                      <li>
                        App ID format incorrect - Must start with
                        &quot;app_&quot;
                      </li>
                    </ul>
                  </div>
                )}
                <p className="text-xs text-red-500 mt-2">
                  {!isWorldIDConfigured
                    ? "⚠️ Please set NEXT_PUBLIC_WORLD_ID_APP_ID in your .env.local file with your actual World ID App ID (format: app_xxxxxxx)."
                    : !walletAddress
                    ? "⚠️ Please connect your wallet first before verifying with World ID."
                    : "Make sure your World ID App ID is correct and the app is registered in the World ID Developer Portal."}
                </p>
                <button
                  onClick={() => setWorldIDError(null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Twitter */}
            <button
              onClick={() => handleSocialConnect("Twitter")}
              disabled={
                allConnectedSocials.includes("Twitter") ||
                connectingSocial === "Twitter"
              }
              className={`w-full border-2 ${
                allConnectedSocials.includes("Twitter")
                  ? "border-[#00D26A] bg-[#00D26A]/10"
                  : "border-[#EDEDED] hover:border-[#FFD93D]"
              } px-6 py-4 rounded-2xl font-semibold transition-colors flex items-center justify-between disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3">
                {connectingSocial === "Twitter" ? (
                  <FaSpinner className="w-5 h-5 animate-spin text-black" />
                ) : allConnectedSocials.includes("Twitter") ? (
                  <FaCheckCircle className="w-5 h-5 text-[#00D26A]" />
                ) : (
                  <FaXTwitter className="w-5 h-5 text-black" />
                )}
                <span className="text-[#0C0C0C]">Connect Twitter</span>
              </div>
              {allConnectedSocials.includes("Twitter") && (
                <span className="text-sm text-[#00D26A] font-medium">
                  {user?.twitter?.username
                    ? `@${user.twitter.username}`
                    : "Connected"}
                </span>
              )}
            </button>

            {/* GitHub */}
            <button
              onClick={() => handleSocialConnect("GitHub")}
              disabled={
                allConnectedSocials.includes("GitHub") ||
                connectingSocial === "GitHub"
              }
              className={`w-full border-2 ${
                allConnectedSocials.includes("GitHub")
                  ? "border-[#00D26A] bg-[#00D26A]/10"
                  : "border-[#EDEDED] hover:border-[#FFD93D]"
              } px-6 py-4 rounded-2xl font-semibold transition-colors flex items-center justify-between disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3">
                {connectingSocial === "GitHub" ? (
                  <FaSpinner className="w-5 h-5 animate-spin text-[#0C0C0C]" />
                ) : allConnectedSocials.includes("GitHub") ? (
                  <FaCheckCircle className="w-5 h-5 text-[#00D26A]" />
                ) : (
                  <FaGithub className="w-5 h-5 text-[#0C0C0C]" />
                )}
                <span className="text-[#0C0C0C]">Connect GitHub</span>
              </div>
              {allConnectedSocials.includes("GitHub") && (
                <span className="text-sm text-[#00D26A] font-medium">
                  {user?.github?.username || "Connected"}
                </span>
              )}
            </button>

            {/* LinkedIn (Optional) */}
            <button
              onClick={() => handleSocialConnect("LinkedIn")}
              disabled={
                allConnectedSocials.includes("LinkedIn") ||
                connectingSocial === "LinkedIn"
              }
              className={`w-full border-2 ${
                allConnectedSocials.includes("LinkedIn")
                  ? "border-[#00D26A] bg-[#00D26A]/10"
                  : "border-[#EDEDED] hover:border-[#FFD93D]"
              } px-6 py-4 rounded-2xl font-semibold transition-colors flex items-center justify-between disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3">
                {connectingSocial === "LinkedIn" ? (
                  <FaSpinner className="w-5 h-5 animate-spin text-[#0077B5]" />
                ) : allConnectedSocials.includes("LinkedIn") ? (
                  <FaCheckCircle className="w-5 h-5 text-[#00D26A]" />
                ) : (
                  <FaLinkedin className="w-5 h-5 text-[#0077B5]" />
                )}
                <span className="text-[#0C0C0C]">Connect LinkedIn</span>
              </div>
              {allConnectedSocials.includes("LinkedIn") && (
                <span className="text-sm text-[#00D26A] font-medium">
                  Connected
                </span>
              )}
            </button>
          </div>

          {/* Verification Success Toast */}
          {showVerificationToast && (
            <Toast
              type="success"
              title="Success !"
              message="Identity verified successfully!"
              onClose={() => setShowVerificationToast(false)}
            />
          )}

          {/* Badge Minting Success Toast */}
          {showMintToast && (
            <Toast
              type="success"
              title="Success !"
              message="Verification Badge (Soulbound NFT) minted successfully!"
              onClose={() => setShowMintToast(false)}
            />
          )}

          {/* Verification Progress Indicator */}
          {!isFullyVerified && (
            <div className="bg-[#F6F6F6] border-2 border-[#EDEDED] rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-extrabold font-heading text-[#0C0C0C] mb-4">
                Verification Requirements (World ID Optional)
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {worldIDVerified ? (
                    <FaCheckCircle className="w-5 h-5 text-[#00D26A]" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#8E8E8E]" />
                  )}
                  <span
                    className={`text-sm ${
                      worldIDVerified
                        ? "text-[#00D26A] font-semibold"
                        : "text-[#8E8E8E]"
                    }`}
                  >
                    World ID Verification{" "}
                    {worldIDVerified ? "✓ Complete" : "(Optional)"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {hasMinimumSocials ? (
                    <FaCheckCircle className="w-5 h-5 text-[#00D26A]" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#8E8E8E]" />
                  )}
                  <span
                    className={`text-sm ${
                      hasMinimumSocials
                        ? "text-[#00D26A] font-semibold"
                        : "text-[#8E8E8E]"
                    }`}
                  >
                    Social Verification: {requiredSocialsCount}/2 (at least 2 of
                    Twitter, GitHub, LinkedIn)
                  </span>
                </div>
                {!hasMinimumSocials && (
                  <div className="ml-8 text-xs text-[#8E8E8E]">
                    Connected: {requiredSocials.join(", ") || "None"} — Need{" "}
                    {2 - requiredSocialsCount} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Card - Only show when fully verified */}
          {isFullyVerified && (
            <div className="bg-[#00D26A]/10 border-2 border-[#00D26A] rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <FaCheckCircle className="w-6 h-6 text-[#00D26A] mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold font-heading text-[#0C0C0C] mb-2">
                    Verification Complete
                  </h3>
                  <p className="text-[#0C0C0C] mb-4">
                    You&apos;re ready to apply for a loan. Your identity has
                    been verified and your social connections are established.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {worldIDVerified && (
                      <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-[#0C0C0C]">
                        World ID: Verified ✓
                      </span>
                    )}
                    {requiredSocials.map((social) => {
                      let displayText = social;
                      if (social === "Twitter" && user?.twitter?.username) {
                        displayText = `Twitter: @${user.twitter.username}`;
                      } else if (
                        social === "GitHub" &&
                        user?.github?.username
                      ) {
                        displayText = `GitHub: ${user.github.username}`;
                      } else if (social === "LinkedIn") {
                        displayText = "LinkedIn: Connected";
                      }
                      return (
                        <span
                          key={social}
                          className="bg-white px-3 py-1 rounded-full text-sm font-medium text-[#0C0C0C]"
                        >
                          {displayText} ✓
                        </span>
                      );
                    })}
                    {requiredSocialsCount < 2 && (
                      <span className="bg-yellow-100 px-3 py-1 rounded-full text-sm font-medium text-yellow-800">
                        Need {2 - requiredSocialsCount} more social(s)
                      </span>
                    )}
                  </div>

                  {/* Privacy Note */}
                  <div className="bg-white/50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-[#0C0C0C]/70 leading-relaxed">
                      <strong>Privacy:</strong> We store only proof hashes
                      on-chain. Your personal data remains private and is never
                      stored on the blockchain.
                    </p>
                  </div>

                  {/* Mint Badge Button */}
                  {!badgeMinted && (
                    <button
                      onClick={async () => {
                        if (!walletAddress) {
                          alert("Please connect your wallet first");
                          return;
                        }

                        setIsMinting(true);
                        try {
                          // Step 1: Mint SBT from FRONTEND (user's wallet)
                          // NOTE: User's wallet must have VERIFIER_ROLE
                          // To grant role, use: grantRole(VERIFIER_ROLE, yourWalletAddress)
                          const metadataURI = `ipfs://verified/${walletAddress}`;
                          const result = await mintSBT(
                            walletAddress,
                            metadataURI
                          );

                          if (result?.success) {
                            setMintTxHash(result.hash);
                            setBadgeMinted(true);
                            setShowMintToast(true);
                            setTimeout(() => setShowMintToast(false), 5000);

                            // Step 2: Get token ID from blockchain
                            const tokenId = await getTokenId();
                            setSbtTokenId(tokenId);

                            // Step 3: Save to backend for fast querying
                            await api.createUser({
                              address: walletAddress,
                              verificationSBT: `tx:${result.hash}|tokenId:${tokenId}`,
                              verifiedMethods: [
                                ...(worldIDVerified ? ["worldid"] : []),
                                ...(user?.twitter ? ["twitter"] : []),
                                ...(user?.github ? ["github"] : []),
                                ...(user?.google ? ["google"] : []),
                              ],
                            });
                          } else {
                            throw new Error("Minting transaction failed");
                          }
                        } catch (error: unknown) {
                          console.error("Error minting SBT:", error);

                          let errorMessage =
                            "Failed to mint verification badge. Please try again.";
                          if (error instanceof Error) {
                            errorMessage = error.message;

                            // Add helpful instructions if it's a role error
                            if (errorMessage.includes("VERIFIER_ROLE")) {
                              errorMessage +=
                                "\n\n💡 To grant yourself VERIFIER_ROLE:\n1. Go to the VerificationSBT contract on Arcscan\n2. Call grantRole(VERIFIER_ROLE, yourWalletAddress)\n3. VERIFIER_ROLE hash: " +
                                "keccak256('VERIFIER_ROLE')";
                            }
                          }

                          alert(errorMessage);
                        } finally {
                          setIsMinting(false);
                        }
                      }}
                      disabled={isMinting || !walletAddress}
                      className="w-full bg-[#FFD93D] hover:bg-[#FFC700] disabled:bg-[#EDEDED] disabled:text-[#8E8E8E] text-[#0C0C0C] px-8 py-4 rounded-2xl font-extrabold transition-colors uppercase tracking-wide flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                    >
                      {isMinting ? (
                        <>
                          <FaSpinner className="w-5 h-5 animate-spin" />
                          <span>Minting Badge...</span>
                        </>
                      ) : (
                        "Mint Verification Badge (SBT)"
                      )}
                    </button>
                  )}

                  {badgeMinted && (
                    <div className="bg-[#FFD93D] rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <FaCheckCircle className="w-5 h-5 text-[#0C0C0C]" />
                        <span className="font-semibold text-[#0C0C0C]">
                          Verification Badge (Soulbound NFT) minted
                          successfully!
                        </span>
                      </div>
                      {mintTxHash && (
                        <div className="text-xs text-[#0C0C0C]/70">
                          <span className="font-medium">Transaction: </span>
                          <a
                            href={`https://testnet.arcscan.app/tx/${mintTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-[#0C0C0C]"
                          >
                            {mintTxHash.slice(0, 10)}...{mintTxHash.slice(-8)}
                          </a>
                        </div>
                      )}
                      {sbtTokenId > 0 && (
                        <div className="text-xs text-[#0C0C0C]/70">
                          <span className="font-medium">Token ID: </span>
                          <span>{sbtTokenId}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Continue Button - Only show when fully verified */}
          {isFullyVerified && (
            <Link
              href="/eligibility"
              className="block w-full bg-[#FFD93D] hover:bg-[#FFC700] text-[#0C0C0C] px-8 py-4 rounded-2xl font-extrabold transition-colors uppercase tracking-wide text-center"
            >
              Continue → Check Loan Eligibility
            </Link>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
