import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { signToken } from '@/lib/auth-edge';
import { generateOTP } from '@/lib/utils';
import { sendOTPEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, password, role, resendOtp } = await req.json();

    // Handle resend OTP
    if (resendOtp) {
      if (!email) {
        return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      }

      if (user.isVerified) {
        return NextResponse.json({ error: 'Akun sudah diverifikasi' }, { status: 400 });
      }

      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      // Send OTP via email
      await sendOTPEmail(email, otp);

      return NextResponse.json({
        message: 'Kode OTP baru telah dikirim',
      });
    }

    // Normal registration
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'pembeli',
      isVerified: false,
      otp,
      otpExpiresAt,
    });

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return NextResponse.json({
      message: 'Registrasi berhasil. Silakan verifikasi OTP.',
      userId: user._id,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Registrasi gagal' }, { status: 500 });
  }
}
