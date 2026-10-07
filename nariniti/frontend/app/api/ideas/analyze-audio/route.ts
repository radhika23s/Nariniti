import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const formData = await request.formData();

    const res = await fetch(`${backendUrl}/api/ideas/analyze-audio/`, {
      method: 'POST',
      headers: { 'Cookie': cookieHeader },
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Audio processing unavailable.' }, { status: 503 });
  }
}
