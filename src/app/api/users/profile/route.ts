import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getAuthUser, hashPassword, comparePassword } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    await dbConnect();
    const { name, email, phone, currentPassword, newPassword, avatar } = await req.json();

    const fullUser = await User.findById(user._id);
    if (!fullUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Update name
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Nama tidak boleh kosong' }, { status: 400 });
      }
      fullUser.name = name.trim();
    }

    // Update email
    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json({ error: 'Email tidak boleh kosong' }, { status: 400 });
      }
      const normalizedEmail = email.toLowerCase().trim();

      // Check if email is already taken by another user
      if (normalizedEmail !== fullUser.email) {
        const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: fullUser._id } });
        if (existingUser) {
          return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
        }
      }
      fullUser.email = normalizedEmail;
    }

    // Update phone
    if (phone !== undefined) {
      fullUser.phone = phone.trim() || undefined;
    }

    // Update avatar
    if (avatar !== undefined) {
      fullUser.avatar = avatar || undefined;
    }

    // Change password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Password saat ini diperlukan untuk mengganti password' }, { status: 400 });
      }

      const isMatch = await comparePassword(currentPassword, fullUser.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
      }

      fullUser.password = await hashPassword(newPassword);
    }

    await fullUser.save();

    return NextResponse.json({
      message: 'Profil berhasil diperbarui',
      user: {
        _id: fullUser._id,
        name: fullUser.name,
        email: fullUser.email,
        phone: fullUser.phone,
        role: fullUser.role,
        avatar: fullUser.avatar,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui profil' }, { status: 500 });
  }
}
