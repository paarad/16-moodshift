import { type NextRequest } from 'next/server';
// import { updateSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Disabled for MVP demo - skip auth session updates
  // return await updateSession(request);
  
  // Just pass through without auth checks for demo mode
  return;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 