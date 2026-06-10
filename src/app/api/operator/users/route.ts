import { NextResponse, NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'operator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const users = await User.find({}).select('-password -otp -otpExpiresAt').sort({ createdAt: -1 }).lean();

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'operator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { action, userIds, title, message } = await req.json();

    if (action === 'send-notification') {
      if (!userIds || userIds.length === 0) {
        return NextResponse.json({ error: 'Pilih minimal 1 user' }, { status: 400 });
      }
      if (!title || !message) {
        return NextResponse.json({ error: 'Judul dan pesan harus diisi' }, { status: 400 });
      }

      const notifications = userIds.map((userId: string) => ({
        userId,
        type: 'admin',
        title,
        message,
        link: '/dashboard',
      }));

      await Notification.insertMany(notifications);
      return NextResponse.json({ 
        message: `Notifikasi berhasil dikirim ke ${userIds.length} user`,
        count: userIds.length 
      }, { status: 200 });
    }

    if (action === 'delete-users') {
      if (!userIds || userIds.length === 0) {
        return NextResponse.json({ error: 'Pilih minimal 1 user' }, { status: 400 });
      }

      const result = await User.deleteMany({ _id: { $in: userIds } });
      return NextResponse.json({ 
        message: `${result.deletedCount} user berhasil dihapus`,
        deletedCount: result.deletedCount 
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Operator action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
