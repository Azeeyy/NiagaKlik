import { NextRequest, NextResponse } from 'next/server';
import {dbConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, OTP, dan password baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ error: 'Kode OTP salah' }, { status: 400 });
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return NextResponse.json({ error: 'Kode OTP sudah kedaluwarsa' }, { status: 400 });
    }

    user.password = await hashPassword(newPassword);
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    return NextResponse.json({ message: 'Password berhasil direset. Silakan login dengan password baru.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
