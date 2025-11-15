# 🌐 Frontend RPC Provider Setup

## ✅ What's Been Updated

I've updated the frontend to use your Alchemy RPC provider from environment variables instead of hardcoded URLs.

**Files Updated:**
1. `frontend/src/components/PrivyProvider.tsx` - Wagmi config now uses env variable
2. `frontend/src/config/contracts.ts` - Network config now uses env variable
3. `frontend/src/lib/hooks/useVerification.ts` - Chain definition now uses env variable

---

## 🔧 Setup Instructions

### **Step 1: Create/Update Frontend `.env.local` File**

Create or update `frontend/.env.local` (or `.env`) with your Alchemy RPC URL:

```bash
# Frontend Environment Variables

# Privy App ID
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Arc Testnet RPC URL (USE YOUR ALCHEMY URL HERE)
NEXT_PUBLIC_ARC_RPC_URL=https://arc-testnet.g.alchemy.com/v2/YOUR_FULL_API_KEY

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Important:** 
- Replace `YOUR_FULL_API_KEY` with your complete Alchemy API key
- Make sure the URL is complete (should end with your API key, not just `/v2/i`)

### **Step 2: Restart Frontend Dev Server**

```bash
# Stop the current frontend server (Ctrl+C)
# Then restart it
cd frontend
npm run dev
```

### **Step 3: Verify It's Working**

1. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Check Network tab
   - Look for RPC requests - they should go to your Alchemy URL

2. **Check Network Requests:**
   - All blockchain RPC calls should now go to `https://arc-testnet.g.alchemy.com/v2/...`
   - Not `https://rpc.testnet.arc.network`

---

## 📍 Where RPC is Used

The frontend uses RPC for:
- ✅ **Wallet connections** (via Wagmi/Privy)
- ✅ **Contract reads** (balance checks, loan queries)
- ✅ **Contract writes** (transactions, approvals)
- ✅ **Network switching** (adding Arc Testnet to wallet)

All of these now use your Alchemy RPC URL!

---

## 🎯 Backend vs Frontend

### **Backend:**
- Uses `ARC_TESTNET_RPC_URL` from `.env`
- All API endpoints use this RPC

### **Frontend:**
- Uses `NEXT_PUBLIC_ARC_RPC_URL` from `.env.local`
- All wallet/contract interactions use this RPC

**Make sure both are set to your Alchemy URL!**

---

## ✅ Verification Checklist

- [ ] Created/updated `frontend/.env.local` with `NEXT_PUBLIC_ARC_RPC_URL`
- [ ] Set the complete Alchemy RPC URL (with full API key)
- [ ] Restarted frontend dev server
- [ ] Checked browser console for RPC requests
- [ ] Verified requests go to Alchemy, not public Arc RPC

---

## 🚨 Troubleshooting

### **Still seeing public RPC in network requests?**
1. Make sure `.env.local` file exists in `frontend/` directory
2. Make sure variable name is exactly `NEXT_PUBLIC_ARC_RPC_URL`
3. Restart the dev server (Next.js caches env vars on startup)
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

### **Getting "Invalid RPC URL" errors?**
- Check that your Alchemy API key is complete
- Make sure URL format is: `https://arc-testnet.g.alchemy.com/v2/YOUR_API_KEY`
- Verify the API key is valid in Alchemy dashboard

---

## 🎉 Result

**Both backend and frontend now use your Alchemy RPC provider!**

- ✅ No more rate limits
- ✅ Faster responses
- ✅ Higher request capacity
- ✅ Better reliability

**You're all set!** 🚀

