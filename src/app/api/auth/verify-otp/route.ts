import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email dan OTP wajib diisi' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'Akun sudah diverifikasi' }, { status: 400 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ error: 'Kode OTP salah' }, { status: 400 });
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return NextResponse.json({ error: 'Kode OTP sudah kedaluwarsa' }, { status: 400 });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    return NextResponse.json({ message: 'Akun berhasil diverifikasi' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verifikasi gagal' }, { status: 500 });
  }
}
