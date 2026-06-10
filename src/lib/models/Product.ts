import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  stock: number;
  sellerId: mongoose.Types.ObjectId;
  sellerName: string;
  isPreOrder: boolean;
  preOrderDeadline?: Date;
  preOrderEstimateDelivery?: string;
  condition: 'baru' | 'bekas';
  weight: number; // in grams
  tags: string[];
  isActive: boolean;
  soldCount: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    category: { type: String, required: true },
    images: [{ type: String }],
    stock: { type: Number, required: true, min: 0, default: 1 },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerName: { type: String, required: true },
    isPreOrder: { type: Boolean, default: false },
    preOrderDeadline: { type: Date },
    preOrderEstimateDelivery: { type: String },
    condition: { type: String, enum: ['baru', 'bekas'], default: 'baru' },
    weight: { type: Number, default: 250 },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    soldCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);


export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
