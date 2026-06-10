import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'pembeli' | 'penjual' | 'operator';
  isVerified: boolean;
  otp: string | null;
  otpExpiresAt: Date | null;
  phone?: string;
  avatar?: string;
  addresses: IAddress[];
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  _id?: string;
  label: string;
  fullAddress: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
  recipientName: string;
  recipientPhone: string;
}

const AddressSchema = new Schema({
  label: { type: String, required: true },
  fullAddress: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  postalCode: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number },
  isDefault: { type: Boolean, default: false },
  recipientName: { type: String, required: true },
  recipientPhone: { type: String, required: true },
});

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['pembeli', 'penjual', 'operator'], default: 'pembeli' },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    phone: { type: String },
    avatar: { type: String },
    addresses: [AddressSchema],
    googleId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
