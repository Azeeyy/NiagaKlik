import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  platformFee: number;
  grandTotal: number;
  shippingCost: number;
  shippingAddress: {
    fullAddress: string;
    province: string;
    city: string;
    district: string;
    postalCode: string;
    recipientName: string;
    recipientPhone: string;
    lat?: number;
    lng?: number;
  };
  paymentMethod: 'cn_wallet' | 'qris' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  orderStatus: 'pending' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  notes?: string;
  trackingNumber?: string;
  cancelledBy?: 'buyer' | 'seller';
  cancelReason?: string;
  paidAt?: Date;
  processedAt?: Date;
  shippedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productImage: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { _id: false });

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    shippingAddress: {
      fullAddress: { type: String, required: true },
      province: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      postalCode: { type: String, required: true },
      recipientName: { type: String, required: true },
      recipientPhone: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    paymentMethod: { type: String, enum: ['cn_wallet', 'qris', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    orderStatus: { 
      type: String, 
      enum: ['pending', 'diproses', 'dikirim', 'selesai', 'dibatalkan'], 
      default: 'pending' 
    },
    notes: { type: String },
    trackingNumber: { type: String },
    cancelledBy: { type: String, enum: ['buyer', 'seller'] },
    cancelReason: { type: String },
    paidAt: { type: Date },
    processedAt: { type: Date },
    shippedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);


function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NK-${timestamp}-${random}`;
}

export { generateOrderNumber };

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
