import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-edge'; // ← ganti ini

const protectedPaths = ['/dashboard', '/seller', '/operator', '/cart', '/checkout'];
const operatorRestricted = ['/cart', '/checkout'];

export async function middleware(req: NextRequest) { // ← tambah async
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  if (!protectedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!token) return NextResponse.next();

  const decoded = await verifyToken(token); // ← tambah await
  if (!decoded) return NextResponse.next();

  if (pathname.startsWith('/seller') && decoded.role !== 'penjual' && decoded.role !== 'operator') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/operator') && decoded.role !== 'operator') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (decoded.role === 'operator' && operatorRestricted.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/products', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};