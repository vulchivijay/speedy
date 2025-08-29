import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'Unknown';
  console.log('Client IP:', ip);

  return NextResponse.next();
}
