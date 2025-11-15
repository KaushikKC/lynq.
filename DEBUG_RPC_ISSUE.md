# 🔍 Debugging RPC Rate Limit Issue

## The Problem
You're getting rate limit errors even though you have Alchemy configured. This is likely because **MetaMask is using its own RPC provider** instead of your Alchemy RPC.

## How to Debug

### Step 1: Check Browser Console
When you load the app, check the browser console. You should see:
```
🔗 Frontend RPC URL: https://arc-testnet.g.alchemy.com/v2/...
🔗 Env variable value: https://arc-testnet.g.alchemy.com/v2/...
```

If you see `NOT SET` or the public Arc RPC, your `.env.local` file is not configured correctly.

### Step 2: Check What RPC MetaMask is Using

1. Open MetaMask
2. Click the network dropdown (top of MetaMask)
3. Click "Settings" or "Edit" on Arc Testnet
4. Check the "RPC URL" field

**If it shows `https://rpc.testnet.arc.network`**, MetaMask is using the public RPC, not Alchemy!

### Step 3: Configure MetaMask to Use Alchemy

1. In MetaMask, go to Settings → Networks
2. Find "Arc Testnet" (or add it if it doesn't exist)
3. Click "Edit"
4. Change the RPC URL to your Alchemy URL:
   ```
   https://arc-testnet.g.alchemy.com/v2/YOUR_API_KEY
   ```
5. Save

### Step 4: Verify in Browser Console

After configuring MetaMask, when you try to approve, check the console. You should see:
```
🔍 Approving USDC - Checking RPC configuration...
🔍 Wallet Client RPC: https://arc-testnet.g.alchemy.com/v2/...
```

## Alternative: Force Use Public Client for Reads

If MetaMask continues to use its own RPC, we can modify the code to use `publicClient` for read operations and only use `walletClient` for signing. But this requires more changes.

## Quick Fix: Check Your Alchemy Plan

1. Go to https://dashboard.alchemy.com/
2. Check your current plan
3. Free tier has limits (e.g., 300M compute units/month)
4. If you're hitting limits, you may need to upgrade

## Verify Environment Variable

Make sure your `frontend/.env.local` file exists and has:
```bash
NEXT_PUBLIC_ARC_RPC_URL=https://arc-testnet.g.alchemy.com/v2/YOUR_FULL_API_KEY
```

**Important:** 
- File must be named `.env.local` (not `.env`)
- Must be in the `frontend` folder
- Must restart the dev server after creating/updating

## Test

1. Restart your frontend dev server
2. Open browser console
3. Try to approve USDC
4. Check the console logs to see which RPC is actually being used

