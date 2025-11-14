#!/bin/bash
# Deployment script for Lynq smart contracts on Arc Testnet

set -e

echo "====================================="
echo "Lynq Smart Contracts Deployment"
echo "====================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file with the following variables:"
    echo "  PRIVATE_KEY=your_private_key_here"
    echo "  ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network"
    exit 1
fi

# Source environment variables
source .env

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set in .env file"
    exit 1
fi

echo "Deploying to Arc Testnet..."
echo ""

# Deploy contracts
forge script script/Deploy.s.sol:Deploy \
    --rpc-url ${ARC_TESTNET_RPC_URL:-https://rpc.testnet.arc.network} \
    --broadcast \
    --legacy \
    -vvvv

echo ""
echo "====================================="
echo "Deployment Complete!"
echo "====================================="
echo ""
echo "Contract addresses have been saved to:"
echo "  broadcast/Deploy.s.sol/<chain-id>/run-latest.json"
echo ""
echo "Next steps:"
echo "1. Save the contract addresses"
echo "2. Update your frontend/backend with the new addresses"
echo "3. Verify contracts (optional):"
echo "   forge verify-contract <address> <contract> --chain-id <chain-id>"
echo ""

