import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ message: 'Logout berhasil' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Logout gagal' }, { status: 500 });
  }
}
