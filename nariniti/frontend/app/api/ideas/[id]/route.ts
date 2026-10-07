import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cookieHeader = request.headers.get('cookie') || '';
    const res = await fetch(`${backendUrl}/api/ideas/${id}/`, {
      headers: { 'Cookie': cookieHeader },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }
}
