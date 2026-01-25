import { NextResponse } from 'next/server';

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
  });
}

export function GET() {
  return unauthorized();
}

// Important: middleware rewrites unauthorized admin/API requests here for *any* method.
// If we only implement GET, other methods will return 405 and be confusing in the admin UI.
export function POST() {
  return unauthorized();
}
export function PUT() {
  return unauthorized();
}
export function PATCH() {
  return unauthorized();
}
export function DELETE() {
  return unauthorized();
}
export function OPTIONS() {
  return unauthorized();
}
export function HEAD() {
  return unauthorized();
}