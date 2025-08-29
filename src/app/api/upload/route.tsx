import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Consumes the request body to measure upload.
export async function POST(req: NextRequest) {
  const started = Date.now();
  let receivedBytes = 0;

  // In Node runtime, `req.body` is a Web ReadableStream (when present).
  const body = req.body;
  if (body) {
    const reader = body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
    }
  } else {
    const buf = await req.arrayBuffer();
    receivedBytes = buf.byteLength;
  }

  const ms = Date.now() - started;

  return new Response(
    JSON.stringify({ receivedBytes, ms }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    }
  );
}
