# Lynq Backend API

Backend service for the Lynq decentralized lending platform. Handles user management, loan processing, screening logic, and data aggregation.

## Features

- ✅ User management and credit scoring
- ✅ Loan request and approval workflow
- ✅ AI-powered screening agent (rules-based MVP)
- ✅ Treasury metrics and monitoring
- ✅ Event history tracking
- ✅ REST API with comprehensive endpoints
- ✅ MongoDB for data persistence
- ✅ Rate limiting and security headers
- ✅ Structured logging

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js v18+ or v20+
- MongoDB Atlas account (Cloud - Recommended) **OR** MongoDB v6+ (Local)
- npm or yarn

**💡 Using MongoDB Compass?** Perfect! Your Atlas URI works directly with this backend. See [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp src/config/env.example.txt .env

# Edit .env with your configuration
nano .env
```

## Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Database - MongoDB Atlas (Recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lynq?retryWrites=true&w=majority

# OR Local MongoDB
# MONGODB_URI=mongodb://localhost:27017/lynq

# Arc Network
ARC_RPC_URL=https://rpc.testnet.arc.network
CHAIN_ID=1234567890

# Screening Thresholds
MIN_CREDIT_SCORE_TIER1=700
MIN_CREDIT_SCORE_TIER2=600
MIN_CREDIT_SCORE_TIER3=500
BASE_INTEREST_RATE=500
MAX_LOAN_AMOUNT=50000

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Running the Server

### Development

```bash
npm run dev
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

## API Endpoints

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
    "referralCount": 3,
    "xp": 120,
    "activeLoans": 1,
    "totalBorrowed": 1000,
    "totalRepaid": 500,
    "outstandingBalance": 525
  }
}
```

#### GET /api/user/:address/reputation
Get detailed reputation breakdown and history.

**Response:**
```json
{
  "success": true,
  "data": {
    "creditScore": 650,
    "breakdown": {
      "onTimePayments": 5,
      "latePayments": 1,
      "defaults": 0,
      "totalLoans": 6,
      "averageRepaymentDays": 75
    },
    "reputation": {
      "xp": 120,
      "referralCount": 3,
      "verifiedMethods": ["worldid"],
      "memberSince": "2024-01-01T00:00:00.000Z"
    },
    "history": [...]
  }
}
```

#### POST /api/user/create
Create or update a user.

**Request:**
```json
{
  "address": "0x...",
  "verificationSBT": "ipfs://...",
  "verifiedMethods": ["worldid", "twitter"]
}
```

#### PUT /api/user/:address/credit-score
Update user's credit score (admin only).

**Request:**
```json
{
  "creditScore": 700
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

#### GET /api/loan/:loanId
Get loan details by ID.

#### GET /api/loan/user/:address
Get all loans for a user.

#### PUT /api/loan/:loanId/approve
Approve a loan (sets interest rate and due date).

**Request:**
```json
{
  "interestRate": 500,
  "txHash": "0x..."
}
```

#### PUT /api/loan/:loanId/disburse
Mark loan as disbursed.

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

#### PUT /api/loan/:loanId/default
Mark a loan as defaulted.

#### GET /api/loan/pending
Get all pending loan requests.

### Screening Endpoints

#### GET /api/screening/eligibility
Check loan eligibility for a user.

**Query Parameters:**
- `address`: User's wallet address
- `amount`: Requested loan amount

**Response:**
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "approvedAmount": 1000,
    "interestRate": 500,
    "reason": "Approved! Your credit score (650) qualifies you for Tier 2 (Good) with 5.00% interest.",
    "tier": "Tier 2 (Good)"
  }
}
```

#### GET /api/screening/recommended-amount
Get recommended loan amount for a user based on credit score.

**Query Parameters:**
- `address`: User's wallet address

### Treasury Endpoints

#### GET /api/treasury/metrics
Get treasury pool metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLiquidity": 100000,
    "utilization": 0.12,
    "outstandingLoans": 12000,
    "defaultRate": 0.01,
    "totalDeposits": 150000,
    "totalWithdrawals": 50000,
    "totalRepayments": 80000,
    "availableLiquidity": 88000,
    "metrics": {
      "totalLoans": 50,
      "activeLoans": 5,
      "completedLoans": 42,
      "defaultedLoans": 3
    }
  }
}
```

#### POST /api/treasury/deposit
Record a treasury deposit.

**Request:**
```json
{
  "amount": 10000,
  "txHash": "0x..."
}
```

#### POST /api/treasury/withdrawal
Record a treasury withdrawal.

#### POST /api/treasury/repayment
Record a loan repayment to treasury.

### History Endpoints

#### GET /api/history
Get event history with optional filtering.

**Query Parameters:**
- `address`: Filter by user address
- `eventType`: Filter by event type
- `limit`: Number of events to return (default: 50)
- `skip`: Number of events to skip (default: 0)

#### POST /api/history/event
Record a new event.

**Request:**
```json
{
  "eventType": "LoanRequested",
  "transactionHash": "0x...",
  "blockNumber": 12345,
  "address": "0x...",
  "data": {
    "loanId": 1,
    "amount": 1000
  },
  "timestamp": 1670000000
}
```

#### GET /api/history/stats
Get overall platform statistics.

## Data Models

### User
```typescript
{
  address: string;
  verifiedMethods: string[];
  verificationSBT?: string;
  creditScore: number; // 0-1000
  referralCount: number;
  xp: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Loan
```typescript
{
  loanId: number;
  borrower: string;
  amount: number;
  interestRate: number; // In basis points
  issuedAt?: number;
  dueAt?: number;
  repaidAt?: number;
  repaidAmount: number;
  status: 'requested' | 'approved' | 'disbursed' | 'repaid' | 'defaulted' | 'cancelled';
  reason?: string;
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Treasury
```typescript
{
  totalLiquidity: number;
  utilization: number;
  outstandingLoans: number;
  defaultRate: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalRepayments: number;
  updatedAt: Date;
}
```

## Screening Logic

The screening agent uses a tiered system based on credit scores:

### Tier 1 (Excellent) - Credit Score ≥ 700
- Interest Rate: 5% (BASE_INTEREST_RATE)
- Max Loan: Up to MAX_LOAN_AMOUNT ($50,000)

### Tier 2 (Good) - Credit Score ≥ 600
- Interest Rate: 7%
- Max Loan: 60% of MAX_LOAN_AMOUNT ($30,000)

### Tier 3 (Fair) - Credit Score ≥ 500
- Interest Rate: 10%
- Max Loan: 30% of MAX_LOAN_AMOUNT ($15,000)

### Below 500
- Not eligible for loans

### Bonuses
- **Referral Bonus**: -0.5% interest for every 5 referrals (max 2% discount)
- **XP Bonus**: -0.1% interest for every 100 XP (max 1% discount)
- Minimum interest rate: 3%

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

HTTP Status Codes:
- 200: Success
- 400: Bad Request
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Logging

Logs are written to:
- Console (formatted with colors in development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

## Security

- Rate limiting: 100 requests per 15 minutes per IP
- Helmet.js for security headers
- CORS configuration
- Input validation
- MongoDB injection protection

## Development

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── historyController.ts
│   │   ├── loanController.ts
│   │   ├── screeningController.ts
│   │   ├── treasuryController.ts
│   │   └── userController.ts
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── models/
│   │   ├── Event.ts
│   │   ├── Loan.ts
│   │   ├── Treasury.ts
│   │   └── User.ts
│   ├── routes/
│   │   └── index.ts
│   ├── services/
│   │   └── screeningAgent.ts
│   ├── utils/
│   │   └── logger.ts
│   ├── app.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Endpoints

1. Create/update controller in `src/controllers/`
2. Add route in `src/routes/index.ts`
3. Update this README with endpoint documentation

## Testing

```bash
npm test
```

## Deployment

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment-Specific Configs

- Development: Uses `.env` file
- Production: Use environment variables from hosting platform

## Contributing

1. Follow TypeScript best practices
2. Use ESLint and Prettier
3. Write descriptive commit messages
4. Update README for new features

## License

MIT

## Support

For issues or questions, contact the development team.

