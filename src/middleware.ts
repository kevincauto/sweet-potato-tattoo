import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Permanent redirect from /available-flash to home page
  if (req.nextUrl.pathname === '/available-flash') {
    return NextResponse.redirect(new URL('/', req.url), 308);
  }

  const isAdminRoute =
    req.nextUrl.pathname.startsWith('/admin') ||
    req.nextUrl.pathname.startsWith('/api/upload') ||
    req.nextUrl.pathname.startsWith('/api/claim-image') ||
    req.nextUrl.pathname.startsWith('/api/replace-image');

  if (isAdminRoute) {
    const basicAuth = req.headers.get('authorization');
    const url = req.nextUrl;

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      if (user === 'admin' && pwd === process.env.ADMIN_PASSWORD) {
        return NextResponse.next();
      }
    }
    url.pathname = '/api/auth';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
} 