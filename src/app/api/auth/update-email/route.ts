import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { generateOTP } from '@/lib/utils';
import { sendOTPEmail } from '@/lib/email';

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const { currentEmail, newEmail } = await req.json();

    if (!currentEmail || !newEmail) {
      return NextResponse.json({ error: 'Email lama dan baru wajib diisi' }, { status: 400 });
    }

    const normalizedNew = newEmail.toLowerCase().trim();
    const normalizedCurrent = currentEmail.toLowerCase().trim();

    // Check if new email is the same as current
    if (normalizedNew === normalizedCurrent) {
      return NextResponse.json({ error: 'Email baru sama dengan email saat ini' }, { status: 400 });
    }

    // Check if new email is already taken
    const existingUser = await User.findOne({ email: normalizedNew });
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Find the current user by current email
    const user = await User.findOne({ email: normalizedCurrent });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'Akun sudah diverifikasi' }, { status: 400 });
    }

    // Update email and generate new OTP
    user.email = normalizedNew;
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP to new email
    await sendOTPEmail(normalizedNew, otp);

    return NextResponse.json({
      message: 'Email berhasil diperbarui. Kode OTP baru telah dikirim.',
      email: normalizedNew,
    });
  } catch (error: any) {
    console.error('Update email error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui email' }, { status: 500 });
  }
}
