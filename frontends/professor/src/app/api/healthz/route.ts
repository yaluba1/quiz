import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { status: 'ok', service: 'quiz-frontend-professor', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}

