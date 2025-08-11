import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = [
    '/',
    '/chat'
];

const authRoutes = [
    '/auth/login',
    '/auth/register'
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    console.log(`🔥 MIDDLEWARE EXECUTING for path: ${pathname}`);

    const isProtected = protectedRoutes.some((route) => {
        if (route === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(route);
    });

    const isAuthRoute = authRoutes.some((route) =>
        pathname === route
    );

    const authCookie = request.cookies.get('auth')?.value;
    const isLoggedIn = !!authCookie;

    console.log(`🔍 Path: ${pathname}`);
    console.log(`🛡️ Protected: ${isProtected}`);
    console.log(`🔐 Auth Route: ${isAuthRoute}`);
    console.log(`👤 Logged In: ${isLoggedIn}`);
    console.log(`🍪 Auth Cookie: ${authCookie ? 'EXISTS' : 'MISSING'}`);

    // Redirect unauthenticated users from protected routes to login
    if (isProtected && !isLoggedIn) {
        console.log(`🚫 Redirecting to login - protected route without auth`);
        const loginUrl = new URL('/auth/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users from auth routes to home
    if (isAuthRoute && isLoggedIn) {
        console.log(`🏠 Redirecting to home - auth route with existing auth`);
        const homeUrl = new URL('/', request.url);
        return NextResponse.redirect(homeUrl);
    }

    console.log(`✅ Allowing request to proceed`);
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};