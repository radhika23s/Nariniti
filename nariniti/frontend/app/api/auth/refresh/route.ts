import { NextResponse } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    // Forward the incoming cookie header so Django can read the refresh_token
    const incomingCookie = request.headers.get('cookie') || '';

    const response = await fetch(`${backendUrl}/api/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': incomingCookie,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorResponse = NextResponse.json(
        { error: errorData.detail || 'Invalid refresh token' },
        { status: 401 }
      );
      // Clear stale cookies on the client
      errorResponse.cookies.delete('access_token');
      errorResponse.cookies.delete('refresh_token');
      return errorResponse;
    }

    const nextResponse = NextResponse.json({ success: true }, { status: 200 });

    // Copy new Set-Cookie headers from Django (new access + rotated refresh token)
    const setCookieHeaders = response.headers.getSetCookie();
    setCookieHeaders.forEach(cookie => {
      nextResponse.headers.append('Set-Cookie', cookie);
    });

    return nextResponse;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
