import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { dbConnect } from './mongodb';
import { verifyToken } from './auth-edge'; // ← import dari auth-edge

export type { JWTPayload } from './auth-edge';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function getAuthUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const decoded = await verifyToken(token);
    if (!decoded) return null;

    await dbConnect();
    const User = (await import('./models/User')).default;
    const user = await User.findById(decoded.userId).select(
      '-password -otp -otpExpiresAt'
    );
    return user;
  } catch {
    return null;
  }
}

export function requireAuth(user: any) {
  if (!user) {
    return { authorized: false, message: 'Silakan login terlebih dahulu' };
  }
  return { authorized: true, message: '' };
}

export function requireRole(user: any, roles: string[]) {
  const auth = requireAuth(user);
  if (!auth.authorized) return auth;
  if (!roles.includes(user.role)) {
    return { authorized: false, message: 'Anda tidak memiliki akses ke halaman ini' };
  }
  return { authorized: true, message: '' };
}

export async function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}