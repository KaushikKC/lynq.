import mongoose, { Schema, Document } from 'mongoose';

export enum LoanStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  DISBURSED = 'disbursed',
  REPAID = 'repaid',
  DEFAULTED = 'defaulted',
  CANCELLED = 'cancelled',
}

export interface ILoan extends Document {
  loanId: number;
  borrower: string;
  amount: number;
  interestRate: number;
  duration?: number; // Duration in days (3, 7, or 30)
  issuedAt?: number;
  dueAt?: number;
  repaidAt?: number;
  repaidAmount: number;
  status: LoanStatus;
  reason?: string;
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema: Schema = new Schema(
  {
    loanId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    borrower: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      // Duration in days (3, 7, or 30)
    },
    issuedAt: {
      type: Number,
    },
    dueAt: {
      type: Number,
    },
    repaidAt: {
      type: Number,
    },
    repaidAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.REQUESTED,
      index: true,
    },
    reason: {
      type: String,
    },
    txHash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
LoanSchema.index({ borrower: 1, status: 1 });
LoanSchema.index({ status: 1, createdAt: -1 });
LoanSchema.index({ dueAt: 1 });

export default mongoose.model<ILoan>('Loan', LoanSchema);
