import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction {
  _id?: string;
  type: 'topup' | 'payment' | 'withdrawal' | 'refund' | 'fee' | 'transfer';
  amount: number;
  description: string;
  reference?: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
}

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  pendingBalance: number;
  transactions: ITransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema({
  type: { 
    type: String, 
    enum: ['topup', 'payment', 'withdrawal', 'refund', 'fee', 'transfer'], 
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  reference: { type: String },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
  createdAt: { type: Date, default: Date.now },
});

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    transactions: [TransactionSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
