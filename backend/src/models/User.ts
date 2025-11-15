import mongoose, { Schema, Document } from 'mongoose';

export interface IWorldIDVerification {
  verified: boolean;
  verificationLevel?: 'device' | 'orb';
  proof?: {
    merkle_root?: string;
    nullifier_hash?: string;
    proof?: string;
    verification_level?: string;
    credential_type?: string;
  };
  verifiedAt?: Date;
  action?: string;
  signal?: string;
}

export interface ISocialVerification {
  platform: string; // 'twitter' | 'github' | 'linkedin' | 'google'
  username?: string;
  accountId?: string;
  email?: string;
  verifiedAt: Date;
}

export interface IUser extends Document {
  address: string;
  verifiedMethods: string[];
  verificationSBT?: string;
  worldIDVerification?: IWorldIDVerification;
  socialVerifications?: ISocialVerification[];
  creditScore: number;
  referralCount: number;
  xp: number;
  usdcBalance: number;
  treasuryDeposits: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorldIDVerificationSchema = new Schema(
  {
    verified: {
      type: Boolean,
      default: false,
    },
    verificationLevel: {
      type: String,
      enum: ['device', 'orb'],
    },
    proof: {
      type: Schema.Types.Mixed,
    },
    verifiedAt: {
      type: Date,
    },
    action: {
      type: String,
    },
    signal: {
      type: String,
    },
  },
  { _id: false }
);

const SocialVerificationSchema = new Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ['twitter', 'github', 'linkedin', 'google'],
    },
    username: String,
    accountId: String,
    email: String,
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const UserSchema: Schema = new Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    verifiedMethods: {
      type: [String],
      default: [],
    },
    verificationSBT: {
      type: String,
    },
    worldIDVerification: {
      type: WorldIDVerificationSchema,
    },
    socialVerifications: {
      type: [SocialVerificationSchema],
      default: [],
    },
    creditScore: {
      type: Number,
      default: 500,
      min: 0,
      max: 1000,
    },
    referralCount: {
      type: Number,
      default: 0,
    },
    xp: {
      type: Number,
      default: 0,
    },
    usdcBalance: {
      type: Number,
      default: 0,
    },
    treasuryDeposits: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
UserSchema.index({ creditScore: -1 });
UserSchema.index({ createdAt: -1 });

export default mongoose.model<IUser>('User', UserSchema);
