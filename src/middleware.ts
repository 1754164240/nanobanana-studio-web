import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Protect all API routes from unauthorized access
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const authCookie = request.cookies.get('site_auth');
    
    // Check if the auth cookie contains the correct password
    if (authCookie?.value !== '175416') {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid access password' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware only to API routes
  matcher: '/api/:path*',
};
