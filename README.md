# Lynq - Programmable Treasury & Lending Platform

A decentralized lending platform built on Arc Network that demonstrates advanced programmable logic using USDC and EURC stablecoins, integrated with Circle Gateway for automated treasury management and cross-chain operations.

## Table of Contents

- [Overview](#overview)
- [Live Links](#live-links)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Smart Contracts](#smart-contracts)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

Lynq is a comprehensive DeFi lending platform that showcases the power of programmable money through:

1. **Advanced Programmable Logic Track**: Demonstrates complex automated financial systems using USDC and EURC stablecoins with smart contract conditions, automation, and cross-chain capabilities.

2. **Treasury Management Track**: Implements a smart contract-based treasury system using Circle Gateway and Arc to automate allocations, distributions, and on-chain treasury operations.

The platform enables organizations to manage their treasury through smart contracts, automating fund allocation, scheduled distributions, multi-signature approvals, and programmatic fund management based on rules and triggers.

## Live Links

- **Live Application**: [Add your live application URL here]
- **Demo Video**: [Add your demo video URL here]
- **Block Explorer**: [Arc Testnet Explorer](https://testnet.arcscan.app)

## Features

### Programmable Money Features

- **Auto-Repay on Credit Improvement**: Loans automatically repay when borrower's credit score reaches 700 or higher
- **Auto-Extend on Partial Payment**: Loans automatically extend by 30 days when 50% is repaid before due date
- **Dynamic Interest Rate Updates**: Interest rates adjust based on treasury utilization ratios
- **Credit Score-Based Automation**: Loan terms and conditions automatically adjust based on on-chain credit scores
- **Multi-Currency Repayments**: Support for USDC, EURC, and other stablecoins with automatic conversion
- **Cross-Chain Capabilities**: Unified balance tracking and transfers across multiple chains via Circle Gateway

### Treasury Management Features

- **Automated Budget Allocations**: Percentage-based budget allocation system with automated execution
- **Scheduled Distributions**: Payroll-style recurring distributions with configurable frequency
- **Multi-Currency Treasury**: Support for multiple stablecoins with unified accounting
- **Reserve Ratio Management**: Automatic enforcement of minimum 20% reserve ratio
- **Circle Gateway Integration**: Cross-chain USDC transfers with unified balance tracking
- **Role-Based Access Control**: Granular permissions for treasury, screening, and compliance agents

### Core Platform Features

- **Decentralized Lending**: Complete loan lifecycle management from request to repayment
- **Identity Verification**: Soulbound tokens (SBTs) for verified user identity
- **Credit Scoring System**: On-chain credit scoring with dynamic updates based on repayment behavior
- **Liquidity Pool Management**: Automated liquidity provision and withdrawal with reserve protection
- **Event Tracking**: Comprehensive event emission for off-chain indexing and analytics

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  Next.js + React + Privy Auth + Wagmi + TanStack Query     │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                      Backend API Layer                       │
│  Express.js + TypeScript + MongoDB + Ethers.js              │
│  - User Management                                          │
│  - Loan Processing                                          │
│  - Treasury Operations                                      │
│  - Gateway Integration                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Smart Contract Layer                      │
│  Arc Network (EVM-Compatible)                               │
│                                                              │
│  ┌──────────────┐    ┌──────────────────┐                  │
│  │Verification  │    │ AgentController  │                  │
│  │    SBT       │    │  (Access Control)│                  │
│  └──────┬───────┘    └────────┬─────────┘                  │
│         │                     │                             │
│         │ verifies            │ authorizes                  │
│         ▼                     ▼                             │
│  ┌────────────────────────────────────┐                     │
│  │          LoanEngine                │                     │
│  │  (Loan Lifecycle Management)       │                     │
│  └──────────────┬─────────────────────┘                     │
│                 │                                           │
│                 │ disburses/repays                          │
│                 ▼                                           │
│         ┌───────────────┐                                   │
│         │ TreasuryPool  │                                   │
│         │(Liquidity Mgmt)│                                  │
│         └───────┬───────┘                                   │
│                 │                                           │
│         ┌───────▼────────┐                                  │
│         │GatewayManager  │                                  │
│         │(Circle Gateway)│                                  │
│         └────────────────┘                                  │
│                                                              │
│  ┌────────────────────────────────────┐                     │
│  │  MultiCurrencyManager              │                     │
│  │  (USDC/EURC/MXN Support)           │                     │
│  └────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Smart Contract Architecture

**Core Contracts:**

1. **VerificationSBT.sol**: Soulbound token for user identity verification
2. **AgentController.sol**: Role-based access control system
3. **LoanEngine.sol**: Core loan lifecycle management with programmable features
4. **TreasuryPool.sol**: Liquidity pool with automated allocation and distribution
5. **GatewayManager.sol**: Circle Gateway integration for cross-chain operations
6. **MultiCurrencyManager.sol**: Multi-currency support with exchange rate management

**Test Tokens:**

- **TestUSDC.sol**: Test USDC token for Arc testnet
- **TestEURC.sol**: Test EURC token for Arc testnet
- **TestMXN.sol**: Test MXN token for Arc testnet

## Tech Stack

### Frontend
- **Framework**: Next.js 16
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS
- **Web3**: Wagmi, Viem, Privy Auth
- **State Management**: TanStack Query
- **Identity**: Worldcoin IDKit

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Web3**: Ethers.js 6
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

### Smart Contracts
- **Language**: Solidity 0.8.24
- **Framework**: Foundry
- **Libraries**: OpenZeppelin Contracts
- **Network**: Arc Network (EVM-compatible)
- **Testing**: Forge

## Installation

### Prerequisites

- Node.js 18+ or 20+
- MongoDB (Atlas recommended) or local MongoDB 6+
- Foundry (for smart contracts)
- Git

### Clone Repository

```bash
git clone <repository-url>
cd "lynq original"
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### Backend Setup

```bash
cd backend
npm install
cp src/config/env.example.txt .env
# Edit .env with your configuration
npm run dev
```

### Smart Contracts Setup

```bash
cd contracts
forge install
forge build
```

## Configuration

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_WORLDCOIN_APP_ID=your_worldcoin_app_id
```

### Backend Environment Variables

Create `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lynq

# Arc Network
ARC_RPC_URL=https://rpc.testnet.arc.network
CHAIN_ID=5042002

# Contract Addresses
VERIFICATION_SBT_ADDRESS=0x503B21D6cd2e49F814a4fB620a6aAf3228043A8f
AGENT_CONTROLLER_ADDRESS=0x405A688E1C05DB9dee85A695F008e6926859aC4c
TREASURY_POOL_ADDRESS=0x4FdF07fEce136bf05c63Bd77FF8Fc9d6f04cF301
LOAN_ENGINE_ADDRESS=0xEC4BEA60368f3aB46355CE1f1F0D2e67B2377022
GATEWAY_MANAGER_ADDRESS=0x439153faf87CaBb9Ba5C7a5602028F242fd02E33
MULTI_CURRENCY_MANAGER_ADDRESS=0x9Ced052cAD68ae68CaE1A589edC8422608A0126e
USDC_ADDRESS=0x3600000000000000000000000000000000000000
EURC_ADDRESS=0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a

# Agent Private Key (for treasury operations)
AGENT_PRIVATE_KEY=your_private_key_here

# Screening Configuration
MIN_CREDIT_SCORE_TIER1=700
MIN_CREDIT_SCORE_TIER2=600
MIN_CREDIT_SCORE_TIER3=500
BASE_INTEREST_RATE=500
MAX_LOAN_AMOUNT=50000

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Smart Contracts Environment Variables

Create `contracts/.env`:

```env
PRIVATE_KEY=your_private_key_here
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
ARC_ETHERSCAN_API_KEY=your_api_key_here
```

## Deployment

### Smart Contracts Deployment

#### Deploy Core Contracts

```bash
cd contracts
source .env

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --broadcast \
  --verify
```

#### Deploy Treasury Upgrade Contracts

```bash
forge script script/DeployTreasuryUpgrade.s.sol:DeployTreasuryUpgrade \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --broadcast \
  --verify
```

### Backend Deployment

#### Build

```bash
cd backend
npm run build
```

#### Production Start

```bash
npm start
```

#### Vercel Deployment

The backend includes `vercel.json` for serverless deployment on Vercel.

### Frontend Deployment

#### Build

```bash
cd frontend
npm run build
```

#### Production Start

```bash
npm start
```

#### Vercel Deployment

```bash
vercel deploy
```

## Smart Contracts

### Deployed Contracts (Arc Testnet)

| Contract | Address | Description | Explorer Link |
|----------|---------|-------------|---------------|
| VerificationSBT | `0x503B21D6cd2e49F814a4fB620a6aAf3228043A8f` | Soulbound token for identity verification | [View on Arcscan](https://testnet.arcscan.app/address/0x503B21D6cd2e49F814a4fB620a6aAf3228043A8f) |
| AgentController | `0x405A688E1C05DB9dee85A695F008e6926859aC4c` | Role-based access control | [View on Arcscan](https://testnet.arcscan.app/address/0x405A688E1C05DB9dee85A695F008e6926859aC4c) |
| TreasuryPool | `0x4FdF07fEce136bf05c63Bd77FF8Fc9d6f04cF301` | Liquidity pool with automated allocations | [View on Arcscan](https://testnet.arcscan.app/address/0x4FdF07fEce136bf05c63Bd77FF8Fc9d6f04cF301) |
| LoanEngine | `0xEC4BEA60368f3aB46355CE1f1F0D2e67B2377022` | Loan lifecycle management | [View on Arcscan](https://testnet.arcscan.app/address/0xEC4BEA60368f3aB46355CE1f1F0D2e67B2377022) |
| GatewayManager | `0x439153faf87CaBb9Ba5C7a5602028F242fd02E33` | Circle Gateway integration | [View on Arcscan](https://testnet.arcscan.app/address/0x439153faf87CaBb9Ba5C7a5602028F242fd02E33) |
| MultiCurrencyManager | `0x9Ced052cAD68ae68CaE1A589edC8422608A0126e` | Multi-currency support | [View on Arcscan](https://testnet.arcscan.app/address/0x9Ced052cAD68ae68CaE1A589edC8422608A0126e) |
| TestUSDC | `0x3600000000000000000000000000000000000000` | Test USDC token | [View on Arcscan](https://testnet.arcscan.app/address/0x3600000000000000000000000000000000000000) |
| TestEURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | Test EURC token | [View on Arcscan](https://testnet.arcscan.app/address/0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a) |
| TestUSYC | `0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C` | Test USYC token | [View on Arcscan](https://testnet.arcscan.app/address/0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C) |

### Key Functions

#### LoanEngine - Programmable Features

```solidity
// Auto-repay when credit score improves
function autoRepayOnCreditImprovement(uint256 loanId) external

// Auto-extend loan on 50% partial payment
function autoExtendOnPartialPayment(uint256 loanId) external

// Update interest rates based on utilization
function updateInterestRatesBasedOnUtilization(uint256 newBaseRate) external

// Repay with any supported currency
function repayLoanWithToken(uint256 loanId, address token, uint256 amount) external
```

#### TreasuryPool - Automation Features

```solidity
// Create budget allocation rule
function createAllocation(string calldata name, uint256 percentage, address destination) external

// Execute all allocations
function executeAllocations() external

// Schedule recurring distribution (payroll)
function scheduleDistribution(address[] calldata recipients, uint256[] calldata amounts, uint256 frequency) external

// Execute due distributions
function executeDistributions() external
```

#### GatewayManager - Cross-Chain Features

```solidity
// Deposit to Circle Gateway
function depositToGateway(uint256 amount) external

// Create burn intent for cross-chain transfer
function createBurnIntent(uint256 amount, uint256 destinationChainId) external returns (bytes32)

// Execute mint on destination chain
function executeMintWithAttestation(bytes32 intentId, address recipient, uint256 amount, uint256 sourceChainId) external
```

### Security Features

- ReentrancyGuard protection on all state-changing functions
- Role-based access control using OpenZeppelin AccessControl
- Input validation on all user inputs
- SafeERC20 for token transfers
- Minimum reserve ratio enforcement (20%)
- Credit score bounds checking (0-1000)

## API Documentation

### Base URL

```
http://localhost:3001/api
```

### Authentication

Most endpoints require authentication via wallet signature or API key.

### User Endpoints

#### GET /api/user/:address/summary

Get user summary including balances, credit score, and active loans.

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "creditScore": 650,
    "isVerified": true,
    "verifiedMethods": ["worldid"],
    "activeLoans": 1,
    "totalBorrowed": 1000,
    "totalRepaid": 500,
    "outstandingBalance": 525
  }
}
```

### Loan Endpoints

#### POST /api/loan/request

Create a new loan request.

**Request:**
```json
{
  "borrower": "0x...",
  "amount": 1000,
  "reason": "Business expansion"
}
```

#### PUT /api/loan/:loanId/approve

Approve a loan and set interest rate.

**Request:**
```json
{
  "interestRate": 500,
  "txHash": "0x..."
}
```

#### POST /api/loan/repayment

Record a loan repayment.

**Request:**
```json
{
  "loanId": 1,
  "amount": 500,
  "txHash": "0x..."
}
```

### Treasury Endpoints

#### GET /api/treasury/metrics

Get treasury pool metrics including liquidity, utilization, and loan statistics.

#### POST /api/treasury/create-allocation

Create a new budget allocation rule.

**Request:**
```json
{
  "name": "High-Risk Loans",
  "percentage": 3000,
  "destination": "0x..."
}
```

#### POST /api/treasury/execute-allocations

Execute all active allocations, transferring funds to destination addresses.

#### POST /api/treasury/schedule-distribution

Schedule a recurring distribution (payroll).

**Request:**
```json
{
  "recipients": ["0x...", "0x..."],
  "amounts": [1000, 2000],
  "frequency": 2592000
}
```

### Gateway Endpoints

#### POST /api/gateway/deposit

Deposit USDC to Circle Gateway for cross-chain access.

**Request:**
```json
{
  "amount": 10000
}
```

#### GET /api/gateway/balance/:address

Get unified USDC balance across all chains.

### Multi-Currency Endpoints

#### POST /api/multi-currency/add-currency

Add a new supported currency.

**Request:**
```json
{
  "token": "0x...",
  "symbol": "EURC",
  "rateVsUSDC": 10900
}
```

#### POST /api/loan/repay-with-token

Repay a loan using a non-USDC currency.

**Request:**
```json
{
  "loanId": 1,
  "token": "0x...",
  "amount": 1000
}
```

For complete API documentation, see [backend/README.md](./backend/README.md).

## Testing

### Smart Contracts Testing

```bash
cd contracts

# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test file
forge test --match-path test/LoanEngine.t.sol

# Generate gas report
forge test --gas-report
```

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

## Project Structure

```
lynq/
├── contracts/                 # Smart contracts
│   ├── src/                  # Contract source files
│   │   ├── LoanEngine.sol
│   │   ├── TreasuryPool.sol
│   │   ├── GatewayManager.sol
│   │   ├── MultiCurrencyManager.sol
│   │   └── ...
│   ├── test/                 # Contract tests
│   ├── script/               # Deployment scripts
│   └── foundry.toml
│
├── backend/                  # Backend API
│   ├── src/
│   │   ├── controllers/      # API controllers
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities
│   └── package.json
│
├── frontend/                 # Frontend application
│   ├── src/
│   │   ├── app/              # Next.js app directory
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities and hooks
│   │   └── config/           # Configuration
│   └── package.json
│
└── README.md
```

## Programmable Logic Examples

### Example 1: Auto-Repay on Credit Improvement

When a borrower's credit score reaches 700 or higher, the loan automatically repays from their USDC balance:

```solidity
function autoRepayOnCreditImprovement(uint256 loanId) external {
    Loan storage loan = loans[loanId];
    require(creditScore[loan.borrower] >= 700, "Credit score not high enough");
    
    uint256 userBalance = usdc.balanceOf(loan.borrower);
    uint256 remaining = getRemainingBalance(loanId);
    
    require(userBalance >= remaining, "Insufficient balance");
    
    // Auto-repay
    usdc.safeTransferFrom(loan.borrower, address(this), remaining);
    loan.repaid += remaining;
    loan.status = LoanStatus.Repaid;
}
```

### Example 2: Automated Budget Allocation

Treasury automatically allocates funds based on percentage rules:

```solidity
function executeAllocations() external onlyTreasuryAgent {
    uint256 available = totalLiquidity - totalUtilized;
    
    for (uint256 i = 1; i <= allocationCount; i++) {
        Allocation storage alloc = allocations[i];
        if (!alloc.active) continue;
        
        uint256 amount = (available * alloc.percentage) / BASIS_POINTS;
        usdc.safeTransfer(alloc.destination, amount);
        alloc.allocated += amount;
    }
}
```

### Example 3: Scheduled Payroll Distribution

Automated recurring distributions execute when due:

```solidity
function executeDistributions() external {
    for (uint256 i = 1; i <= distributionCount; i++) {
        Distribution storage dist = distributions[i];
        
        if (!dist.active) continue;
        if (block.timestamp < dist.lastExecuted + dist.frequency) continue;
        
        for (uint256 j = 0; j < dist.recipients.length; j++) {
            usdc.safeTransfer(dist.recipients[j], dist.amounts[j]);
        }
        
        dist.lastExecuted = block.timestamp;
    }
}
```

## Circle Gateway Integration

The GatewayManager contract integrates with Circle Gateway to enable cross-chain USDC transfers:

1. **Deposit to Gateway**: Users deposit USDC into the gateway wallet
2. **Create Burn Intent**: Users create burn intents for cross-chain transfers
3. **Attestation Verification**: Circle Gateway provides attestations for valid burns
4. **Mint on Destination**: USDC is minted on the destination chain based on attestations

The system maintains unified balance tracking across all chains, allowing users to see their total USDC balance regardless of which chain they're on.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for all new features
- Update documentation for API changes
- Follow Solidity style guide for smart contracts
- Ensure all tests pass before submitting PR

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue on the repository or contact the development team.

## Acknowledgments

- Built for Arc Circle Hackathon
- Uses OpenZeppelin Contracts for security
- Integrated with Circle Gateway for cross-chain functionality
- Deployed on Arc Network testnet

