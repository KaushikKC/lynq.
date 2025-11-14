import { NextRequest, NextResponse } from "next/server";
import { verifyCloudProof } from "@worldcoin/idkit-core/backend";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body once
    const requestBody = await request.json();
    const proof = requestBody;
    
    // Extract signal from request body if provided (frontend sends it separately)
    const signal = requestBody.signal || undefined;

    const app_id = (process.env.WORLD_ID_APP_ID || process.env.NEXT_PUBLIC_WORLD_ID_APP_ID)?.trim();
    const action = (process.env.WORLD_ID_ACTION || process.env.NEXT_PUBLIC_WORLD_ID_ACTION || "verify")?.trim();

    // Debug logging
    console.log("World ID Verification Request:", {
      hasProof: !!proof,
      app_id: app_id ? `${app_id.substring(0, 10)}...` : "missing",
      action: action,
      signal: signal ? `${String(signal).substring(0, 10)}...` : "none",
      proofKeys: proof ? Object.keys(proof) : [],
    });
    
    // Additional validation - check if action might be the issue
    if (action === "verify" && !proof?.merkle_root) {
      console.warn("Using default 'verify' action. Make sure this action exists in your Developer Portal!");
    }

    if (!app_id || !app_id.startsWith("app_")) {
      console.error("Invalid App ID:", app_id);
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid App ID configuration",
          detail: "WORLD_ID_APP_ID must be set and start with 'app_'"
        },
        { status: 500 }
      );
    }

    if (!action || action.length === 0) {
      console.error("Invalid Action:", action);
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid Action configuration",
          detail: "WORLD_ID_ACTION must be set"
        },
        { status: 500 }
      );
    }

    // Verify the proof using World ID Developer Portal API
    // This must be done server-side to avoid man-in-the-middle attacks
    // IMPORTANT: If a signal was used in the frontend, we MUST pass the same signal here
    // The signal is the wallet address that was used when generating the proof
    const proofKeys = Object.keys(proof);
    
    console.log("🔐 Calling verifyCloudProof with:", {
      app_id: app_id.substring(0, 15) + "...",
      action: action,
      hasSignal: !!signal,
      signal: signal ? String(signal).substring(0, 20) + "..." : "none",
      proofKeys: proofKeys,
      hasNullifierHash: proofKeys.includes("nullifier_hash"),
      hasMerkleRoot: proofKeys.includes("merkle_root"),
    });

    let verifyRes;
    try {
      // Pass the signal if it was used in the frontend
      // The signal must match exactly what was used when generating the proof
      verifyRes = await verifyCloudProof(
        proof,
        app_id as `app_${string}`,
        action,
        signal // Pass the signal if it was used in frontend
      );
      console.log("verifyCloudProof result:", {
        success: verifyRes.success,
        code: verifyRes.code,
        detail: verifyRes.detail,
      });
    } catch (verifyError) {
      console.error("verifyCloudProof threw error:", verifyError);
      return NextResponse.json(
        {
          success: false,
          error: "Proof verification error",
          detail: verifyError instanceof Error ? verifyError.message : "Unknown verification error",
        },
        { status: 500 }
      );
    }

    if (verifyRes.success) {
      // Store verification data in MongoDB
      try {
        const walletAddress = proof.signal || requestBody.signal;
        if (walletAddress) {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
          const saveResponse = await fetch(`${backendUrl}/api/user/${walletAddress}/verification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              worldIDVerification: {
                verified: true,
                verificationLevel: proof.verification_level === 'orb' ? 'orb' : 'device',
                proof: {
                  merkle_root: proof.merkle_root,
                  nullifier_hash: proof.nullifier_hash,
                  proof: proof.proof,
                  verification_level: proof.verification_level,
                  credential_type: proof.credential_type,
                },
                verifiedAt: new Date().toISOString(),
                action: action,
                signal: signal,
              },
            }),
          });

          if (saveResponse.ok) {
            console.log('✅ Verification data saved to database');
          } else {
            console.warn('⚠️ Failed to save verification data to database');
          }
        }
      } catch (dbError) {
        console.error('Error saving verification to database:', dbError);
        // Don't fail the verification if database save fails
      }

      return NextResponse.json({ 
        success: true,
        message: "World ID verified successfully"
      });
    } else {
      // Handle errors from the World ID /verify endpoint
      // Usually these errors are due to a user having already verified
      return NextResponse.json(
        { 
          success: false,
          error: verifyRes.detail || "Verification failed",
          code: verifyRes.code,
          detail: verifyRes.detail
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying World ID:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

