import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Streams `size` bytes of random data back to the client.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sizeParam = searchParams.get('size');
  // Default ~5MB. Clamp to avoid excessive memory usage.
  const size = Math.min(
    1_000_000_000, // 1GB max
    Math.max(64 * 1024, Number.parseInt(sizeParam || '5000000', 10) || 5_000_000)
  );

  const chunkSize = 64 * 1024; // 64KB chunks
  const totalChunks = Math.ceil(size / chunkSize);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < totalChunks; i++) {
        const remaining = size - i * chunkSize;
        const currentSize = Math.min(chunkSize, remaining);
        const chunk = new Uint8Array(currentSize);
        // Fill with random bytes so intermediate caches can't easily compress/deduplicate.
        crypto.getRandomValues(chunk);
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      // Intentionally omit Content-Length to allow streaming; browser will still read chunks.
    },
  });
}
