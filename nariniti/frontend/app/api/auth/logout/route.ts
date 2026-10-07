import { NextResponse } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(`${backendUrl}/api/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      }
    });

    const nextResponse = NextResponse.json({ success: true }, { status: 200 });

    // Copy Set-Cookie to clear cookies
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookie => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
    } else {
      // Fallback manual clear if backend doesn't send them
      nextResponse.cookies.set('access_token', '', { maxAge: 0, path: '/' });
      nextResponse.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
    }

    return nextResponse;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
