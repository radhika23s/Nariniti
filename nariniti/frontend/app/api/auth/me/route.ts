import { NextResponse } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(`${backendUrl}/api/auth/me/`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader
      }
    });

    if (!response.ok) {
      return NextResponse.json({ authenticated: false }, { status: response.status === 401 ? 200 : response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
