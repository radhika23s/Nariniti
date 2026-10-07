import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const res = await fetch(`${backendUrl}/api/ideas/dashboard-stats/`, {
      headers: { 'Cookie': cookieHeader },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Stats unavailable' }, { status: 503 });
  }
}
