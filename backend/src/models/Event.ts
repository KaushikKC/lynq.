import mongoose, { Schema, Document } from 'mongoose';

export enum EventType {
  LOAN_REQUESTED = 'LoanRequested',
  LOAN_APPROVED = 'LoanApproved',
  LOAN_DISBURSED = 'LoanDisbursed',
  LOAN_REPAID = 'LoanRepaid',
  LOAN_DEFAULTED = 'LoanDefaulted',
  LOAN_CANCELLED = 'LoanCancelled',
  VERIFICATION_MINTED = 'VerificationMinted',
  VERIFICATION_REVOKED = 'VerificationRevoked',
  CREDIT_SCORE_UPDATED = 'CreditScoreUpdated',
  TREASURY_DEPOSIT = 'TreasuryDeposit',
  TREASURY_WITHDRAWAL = 'TreasuryWithdrawal',
}

export interface IEvent extends Document {
  eventType: EventType;
  transactionHash: string;
  blockNumber: number;
  address: string;
  data: Record<string, any>;
  timestamp: number;
  createdAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    eventType: {
      type: String,
      enum: Object.values(EventType),
      required: true,
      index: true,
    },
    transactionHash: {
      type: String,
      required: true,
      index: true,
    },
    blockNumber: {
      type: Number,
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
EventSchema.index({ address: 1, eventType: 1 });
EventSchema.index({ eventType: 1, timestamp: -1 });
EventSchema.index({ createdAt: -1 });

export default mongoose.model<IEvent>('Event', EventSchema);

