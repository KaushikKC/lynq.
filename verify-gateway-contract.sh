#!/bin/bash

# Quick script to verify GatewayManager contract deployment

GATEWAY_ADDRESS="0x4b92aD7fb2f98dF94E66C947005ee10142BB9b36"
RPC_URL="https://rpc.testnet.arc.network"

echo "🔍 Checking GatewayManager contract at: $GATEWAY_ADDRESS"
echo ""

# Check if contract has code
echo "1. Checking contract code..."
CODE=$(cast code $GATEWAY_ADDRESS --rpc-url $RPC_URL 2>/dev/null)

if [ "$CODE" == "0x" ] || [ -z "$CODE" ]; then
    echo "❌ ERROR: No contract found at address $GATEWAY_ADDRESS"
    echo "   Please deploy GatewayManager contract first!"
    echo ""
    echo "   To deploy, run:"
    echo "   cd contracts && forge script script/DeployTreasuryUpgrade.s.sol:DeployTreasuryUpgrade --rpc-url $RPC_URL --broadcast"
    exit 1
else
    echo "✅ Contract code found at address"
fi

echo ""
echo "2. Testing function calls..."

# Test getTotalUnifiedLiquidity()
echo "   Testing getTotalUnifiedLiquidity()..."
RESULT=$(cast call $GATEWAY_ADDRESS "getTotalUnifiedLiquidity()" --rpc-url $RPC_URL 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ getTotalUnifiedLiquidity() works"
    echo "   Result: $RESULT"
else
    echo "   ❌ getTotalUnifiedLiquidity() failed: $RESULT"
fi

# Test totalUnifiedLiquidity() (public state variable)
echo "   Testing totalUnifiedLiquidity()..."
RESULT=$(cast call $GATEWAY_ADDRESS "totalUnifiedLiquidity()" --rpc-url $RPC_URL 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ totalUnifiedLiquidity() works"
    echo "   Result: $RESULT"
else
    echo "   ❌ totalUnifiedLiquidity() failed: $RESULT"
fi

echo ""
echo "✅ Verification complete!"

