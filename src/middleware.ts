import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Permanent redirect from /available-flash to home page
  if (req.nextUrl.pathname === '/available-flash') {
    return NextResponse.redirect(new URL('/', req.url), 308);
  }

  if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/upload')) {
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