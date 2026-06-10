import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'order' | 'payment' | 'system' | 'promo';
  title: string;
  message: string;
  link?: string;
  metadata?: {
    orderId?: string;
    amount?: number;
    itemCount?: number;
  };
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['order', 'payment', 'system', 'promo', 'admin'], 
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    metadata: {
      orderId: String,
      amount: Number,
      itemCount: Number,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);


export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
