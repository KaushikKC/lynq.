import mongoose, { Schema, Document } from 'mongoose';

export interface ITreasury extends Document {
  totalLiquidity: number;
  utilization: number;
  outstandingLoans: number;
  defaultRate: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalRepayments: number;
  updatedAt: Date;
}

const TreasurySchema: Schema = new Schema(
  {
    totalLiquidity: {
      type: Number,
      default: 0,
    },
    utilization: {
      type: Number,
      default: 0,
    },
    outstandingLoans: {
      type: Number,
      default: 0,
    },
    defaultRate: {
      type: Number,
      default: 0,
    },
    totalDeposits: {
      type: Number,
      default: 0,
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
    },
    totalRepayments: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITreasury>('Treasury', TreasurySchema);

