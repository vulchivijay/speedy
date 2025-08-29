import { NextRequest } from 'next/server';

export const runtime = 'nodejs'; // Node runtime is robust for this use case

export async function GET(_req: NextRequest) {
  return new Response('pong', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  });
}
