# Lynq Smart Contracts

Smart contracts for the Lynq decentralized lending platform built on Arc Network.

## Architecture

### Contracts

1. **TestUSDC.sol** - Test USDC token with faucet functionality for Arc testnet
2. **VerificationSBT.sol** - Soulbound token (non-transferable) for verified users
3. **AgentController.sol** - Role-based access control for screening, treasury, and compliance agents
4. **TreasuryPool.sol** - Liquidity pool management for deposits, withdrawals, and loan disbursements
5. **LoanEngine.sol** - Core loan lifecycle management (request, approve, disburse, repay)

### Features

- ✅ Modular architecture with separation of concerns
- ✅ Role-based access control using OpenZeppelin AccessControl
- ✅ Soulbound tokens for identity verification
- ✅ Credit scoring system
- ✅ Treasury pool with reserve ratio management
- ✅ Comprehensive loan lifecycle management
- ✅ ReentrancyGuard protection
- ✅ Event emission for off-chain indexing

## Setup

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js (optional, for frontend integration)

### Installation

```bash
# Install dependencies
forge install

# Build contracts
forge build
```

### Configuration

Create a `.env` file in the contracts directory:

```bash
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Arc Testnet RPC URL
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network

# Optional: Arc Etherscan API key for contract verification
ARC_ETHERSCAN_API_KEY=your_api_key_here
```

## Testing

### Run all tests

```bash
forge test
```

### Run tests with verbosity

```bash
forge test -vvv
```

### Run specific test file

```bash
forge test --match-path test/LoanEngine.t.sol
```

### Generate gas report

```bash
forge test --gas-report
```

## Deployment

### Deploy to Arc Testnet

```bash
# Load environment variables
source .env

# Deploy all contracts
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --broadcast \
  --verify

# Or use the configured RPC endpoint
forge script script/Deploy.s.sol:Deploy \
  --rpc-url arc_testnet \
  --broadcast
```

### Deploy to local network (Anvil)

```bash
# Start local node
anvil

# Deploy (in another terminal)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

## Contract Interactions

### Get USDC from Faucet

```bash
cast send <USDC_ADDRESS> "faucet()" \
  --rpc-url arc_testnet \
  --private-key $PRIVATE_KEY
```

### Mint Verification SBT

```bash
cast send <VERIFICATION_SBT_ADDRESS> \
  "mintSBT(address,string)" \
  <USER_ADDRESS> \
  "ipfs://metadata_uri" \
  --rpc-url arc_testnet \
  --private-key $PRIVATE_KEY
```

### Request a Loan

```bash
cast send <LOAN_ENGINE_ADDRESS> \
  "requestLoan(uint256,string)" \
  1000000000 \
  "Business expansion" \
  --rpc-url arc_testnet \
  --private-key $PRIVATE_KEY
```

### Approve a Loan (as screening agent)

```bash
cast send <LOAN_ENGINE_ADDRESS> \
  "approveLoan(uint256,uint256)" \
  1 \
  500 \
  --rpc-url arc_testnet \
  --private-key $PRIVATE_KEY
```

## Contract ABIs

After building, ABIs are available in:
```
contracts/out/<ContractName>.sol/<ContractName>.json
```

## Security Features

1. **ReentrancyGuard** - Protection against reentrancy attacks
2. **Access Control** - Role-based permissions for sensitive operations
3. **Soulbound Tokens** - Non-transferable identity tokens
4. **Reserve Ratio** - Treasury maintains minimum liquidity
5. **Input Validation** - Comprehensive checks on all user inputs
6. **SafeERC20** - Safe token transfer operations

## Key Roles

### AgentController Roles

- **SCREENING_AGENT** - Can approve/reject loans and update credit scores
- **TREASURY_AGENT** - Can provide liquidity and manage treasury operations
- **COMPLIANCE_AGENT** - Can mark loans as defaulted

### VerificationSBT Roles

- **VERIFIER_ROLE** - Can mint and revoke verification SBTs
- **DEFAULT_ADMIN_ROLE** - Can manage verifier roles

## Credit Scoring

- Initial score: 500
- Maximum score: 1000
- Minimum score: 0

Score updates:
- On-time repayment: +50
- Late but complete repayment: +10
- Default: -200

## Loan Parameters

- Min loan amount: 100 USDC
- Max loan amount: 50,000 USDC
- Max interest rate: 50% (5000 basis points)
- Default loan duration: 90 days

## Treasury Parameters

- Minimum reserve ratio: 20% (2000 basis points)
- Prevents withdrawals that would breach the reserve ratio
- Tracks utilized vs. available liquidity

## Development

### Run Slither (Static Analysis)

```bash
slither .
```

### Format Code

```bash
forge fmt
```

### Generate Documentation

```bash
forge doc
```

## Architecture Diagram

```
┌─────────────────┐
│   TestUSDC      │
│   (ERC20)       │
└────────┬────────┘
         │
         │ uses
         ▼
┌─────────────────────────────────────────────┐
│                                             │
│  ┌──────────────┐    ┌──────────────────┐  │
│  │Verification  │    │ AgentController  │  │
│  │    SBT       │    │  (Access Control)│  │
│  └──────┬───────┘    └────────┬─────────┘  │
│         │                     │             │
│         │ verifies            │ authorizes  │
│         ▼                     ▼             │
│  ┌────────────────────────────────────┐    │
│  │          LoanEngine                │    │
│  │  (Loan Lifecycle Management)       │    │
│  └──────────────┬─────────────────────┘    │
│                 │                           │
│                 │ disburses/repays          │
│                 ▼                           │
│         ┌───────────────┐                   │
│         │ TreasuryPool  │                   │
│         │(Liquidity Mgmt)│                  │
│         └───────────────┘                   │
│                                             │
└─────────────────────────────────────────────┘
```

## License

MIT

## Support

For issues and questions, please open an issue in the GitHub repository.
