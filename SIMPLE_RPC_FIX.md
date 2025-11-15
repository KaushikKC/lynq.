# 🔧 Simple RPC Fix - Use Alchemy Everywhere

## The Problem
The frontend is still using `https://rpc.testnet.arc.network` instead of your Alchemy RPC.

## The Solution (2 Steps)

### Step 1: Create `frontend/.env.local` file

Create this file in the `frontend` folder:

```bash
NEXT_PUBLIC_ARC_RPC_URL=https://arc-testnet.g.alchemy.com/v2/YOUR_FULL_API_KEY
```

**Replace `YOUR_FULL_API_KEY` with your complete Alchemy API key.**

### Step 2: Restart Frontend Server

```bash
# Stop the server (Ctrl+C)
# Then restart
cd frontend
npm run dev
```

**That's it!** The frontend will now use Alchemy.

---

## How to Verify It's Working

1. **Check server logs** when you start the frontend:
   ```
   🔗 Frontend RPC URL: https://arc-testnet.g.alchemy.com/v2/...
   ```

2. **Check browser Network tab:**
   - Open DevTools (F12) → Network tab
   - Filter by "rpc" or "alchemy"
   - You should see requests to `arc-testnet.g.alchemy.com`
   - NOT `rpc.testnet.arc.network`

---

## Why It Wasn't Working

Next.js only reads `.env.local` files, and the server must be restarted after creating/updating the file.

The code is already set up correctly - it just needs the environment variable to be set!

