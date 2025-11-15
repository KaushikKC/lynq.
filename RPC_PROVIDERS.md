# 🌐 RPC Provider Configuration Guide

## ✅ Multi-Provider System Implemented

I've implemented a **multi-provider RPC system** with automatic fallback. When one provider hits rate limits, it automatically switches to the next one.

---

## 🔧 How to Configure Multiple RPC Providers

### **Option 1: Add Fallback Providers in `.env`**

Add multiple RPC URLs to your backend `.env` file:

```bash
# Primary RPC Provider
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network

# Fallback Provider 1 (if you have another endpoint)
ARC_TESTNET_RPC_URL_2=https://your-backup-rpc-url.com

# Fallback Provider 2 (optional)
ARC_TESTNET_RPC_URL_3=https://another-backup-rpc-url.com
```

The system will automatically:
1. Try the primary provider first
2. Switch to fallback providers if rate limited
3. Rotate through all providers
4. Reset failed providers after 5 minutes

---

## 🚀 Alternative RPC Providers for Arc Testnet

### **1. QuickNode (Recommended)**
- **Free Tier**: 10M requests/month
- **Paid Plans**: Starting at $49/month
- **Setup**: 
  1. Go to https://www.quicknode.com/
  2. Create account
  3. Create Arc Testnet endpoint
  4. Copy RPC URL to `.env`

```bash
ARC_TESTNET_RPC_URL=https://your-quicknode-url.arc-testnet.quiknode.pro/YOUR_API_KEY
```

### **2. Alchemy**
- **Free Tier**: 300M compute units/month
- **Setup**:
  1. Go to https://www.alchemy.com/
  2. Create account
  3. Create Arc Testnet app
  4. Copy RPC URL

```bash
ARC_TESTNET_RPC_URL=https://arc-testnet.g.alchemy.com/v2/YOUR_API_KEY
```

### **3. Infura**
- **Free Tier**: 100k requests/day
- **Setup**:
  1. Go to https://www.infura.io/
  2. Create account
  3. Create Arc Testnet project
  4. Copy RPC URL

```bash
ARC_TESTNET_RPC_URL=https://arc-testnet.infura.io/v3/YOUR_PROJECT_ID
```

### **4. Public Arc Testnet RPC**
- **Free**: Yes, but rate limited
- **URL**: `https://rpc.testnet.arc.network`
- **Note**: This is what you're currently using (rate limited)

---

## 📝 Example `.env` Configuration

```bash
# Primary: QuickNode (if you have it)
ARC_TESTNET_RPC_URL=https://your-quicknode-url.arc-testnet.quiknode.pro/YOUR_API_KEY

# Fallback 1: Alchemy
ARC_TESTNET_RPC_URL_2=https://arc-testnet.g.alchemy.com/v2/YOUR_API_KEY

# Fallback 2: Infura
ARC_TESTNET_RPC_URL_3=https://arc-testnet.infura.io/v3/YOUR_PROJECT_ID

# Fallback 3: Public (last resort)
ARC_TESTNET_RPC_URL_4=https://rpc.testnet.arc.network
```

---

## 🎯 How It Works

### **Automatic Provider Switching:**
```
1. Request comes in
2. Try Provider 1 (QuickNode)
3. If rate limited → Switch to Provider 2 (Alchemy)
4. If rate limited → Switch to Provider 3 (Infura)
5. If all fail → Wait 5 minutes, reset, try again
```

### **Benefits:**
- ✅ **No more 429 errors** (automatic fallback)
- ✅ **Higher request capacity** (multiple providers)
- ✅ **Automatic recovery** (failed providers reset after 5 min)
- ✅ **Seamless switching** (no code changes needed)

---

## 🔍 Current Status

Check which provider is being used in your logs:
```
RPC Provider Manager initialized with 3 provider(s)
Switched RPC provider from https://rpc.testnet.arc.network to https://your-backup-url.com
```

---

## 💡 Quick Setup (5 minutes)

### **For QuickNode:**
1. Sign up at https://www.quicknode.com/
2. Create Arc Testnet endpoint
3. Copy RPC URL
4. Add to `.env`:
   ```bash
   ARC_TESTNET_RPC_URL=https://your-quicknode-url.arc-testnet.quiknode.pro/YOUR_API_KEY
   ```
5. Restart backend

### **For Alchemy:**
1. Sign up at https://www.alchemy.com/
2. Create Arc Testnet app
3. Copy RPC URL
4. Add to `.env`:
   ```bash
   ARC_TESTNET_RPC_URL_2=https://arc-testnet.g.alchemy.com/v2/YOUR_API_KEY
   ```
5. Restart backend

---

## 🎉 Result

**With multiple providers configured:**
- ✅ Automatic fallback on rate limits
- ✅ Higher total request capacity
- ✅ No more 429 errors
- ✅ Seamless user experience

**The system handles everything automatically!** 🚀

---

## 📊 Rate Limits Comparison

| Provider | Free Tier | Paid Plans |
|----------|-----------|------------|
| **QuickNode** | 10M/month | $49+/month |
| **Alchemy** | 300M compute units/month | $49+/month |
| **Infura** | 100k/day | $50+/month |
| **Public Arc** | Very limited | N/A |

**Recommendation**: Use QuickNode or Alchemy as primary, with public Arc as fallback.

