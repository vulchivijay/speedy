'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function formatBitsPerSecond(bps: number) {
  if (!isFinite(bps) || bps <= 0) return '0 bps';
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
  let i = 0;
  let value = bps;
  while (value >= 1000 && i < units.length - 1) {
    value /= 1000;
    i++;
  }
  return `${value.toFixed(2)} ${units[i]}`;
}

function formatMs(ms: number) {
  return `${ms?.toFixed(1)} Ms`;
}

// Fills any Uint8Array using getRandomValues in 64KB chunks (browser-safe)
function fillRandom(view: Uint8Array) {
  const MAX = 65536; // 64KB per spec
  for (let i = 0; i < view.length; i += MAX) {
    crypto.getRandomValues(view.subarray(i, Math.min(i + MAX, view.length)));
  }
}

type Props = {
  meterDownload: (step: number) => void;
  meterUpload: (step: number) => void;
};

interface PingStats {
  samples: number[];
  averageMs: number;
  minMs: number;
  maxMs: number;
  jitterMs: number;
}

interface SpeedResult {
  bps: number;
  bytes: number;
  durationMs: number;
}

export default function SpeedTestMeasureDetails({ meterDownload, meterUpload }: Props) {
  // const [running, setRunning] = useState(false);
  const [ping, setPing] = useState<PingStats | null>(null);
  const [download, setDownload] = useState<SpeedResult | null>(null);
  const [upload, setUpload] = useState<SpeedResult | null>(null);

  const [pingProgress, setPingProgress] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  // const reset = useCallback(() => {
  //   setPing(null);
  //   setDownload(null);
  //   setUpload(null);
  //   setPingProgress('');
  //   setDownloadProgress('');
  //   setUploadProgress('');
  // }, []);

  const measurePing = useCallback(async (count = 10, spacingMs = 200) => {
    const samples: number[] = [];
    for (let i = 0; i < count; i++) {
      const t0 = performance.now();
      await fetch(`/api/ping?ts=${Date.now()}&n=${i}`, { cache: 'no-store' });
      const t1 = performance.now();
      samples.push(t1 - t0);
      if (i < count - 1) {
        await new Promise((r) => setTimeout(r, spacingMs));
      }
    }
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const mean = avg;
    const variance = samples.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / samples.length;
    const std = Math.sqrt(variance);
    const result: PingStats = {
      samples,
      averageMs: avg,
      minMs: min,
      maxMs: max,
      jitterMs: std,
    };
    setPing(result);
    return result;
  }, []);

  const measureDownload = useCallback(async (targetSeconds = 8, partSizeBytes = 5 * 1024 * 1024) => {
    const started = performance.now();
    let totalBytes = 0;

    // Allow cancellation mid-test
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      while ((performance.now() - started) / 1000 < targetSeconds) {
        const url = `/api/download?size=${partSizeBytes}&ts=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal });

        if (!res.ok || !res.body) throw new Error('Download response invalid');

        const reader = res.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            totalBytes += value.byteLength;
            const elapsed = performance.now() - started;
            setDownloadProgress(
              `Downloading… ${(totalBytes / (1024 * 1024)).toFixed(2)} MB in ${(elapsed / 1000).toFixed(1)} s`
            );
            meterDownload(parseInt((totalBytes / (1024 * 1024)).toFixed(2)));
            if (elapsed / 1000 >= targetSeconds) {
              // Abort ongoing fetch to stop quickly
              controller.abort();
              break;
            }
          }
        }
      }
    } catch (_) {
      // Likely aborted to end the test; ignore
    } finally {
      abortRef.current = null;
    }

    const elapsedMs = performance.now() - started;
    const bps = (totalBytes * 8) / (elapsedMs / 1000);
    const result: SpeedResult = { bps, bytes: totalBytes, durationMs: elapsedMs };
    setDownload(result);
    return result;
  }, []);

  const measureUpload = useCallback(async (targetSeconds = 8, chunkBytes = 2 * 1024 * 1024) => {
    const started = performance.now();
    let totalBytes = 0;

    // Reusable random chunk to avoid CPU overhead each loop
    const base = new Uint8Array(chunkBytes);
    //crypto.getRandomValues(base);
    fillRandom(base);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      while ((performance.now() - started) / 1000 < targetSeconds) {
        // Build a ~5MB body by repeating the base chunk to amortize overhead
        const repeat = Math.ceil((5 * 1024 * 1024) / base.byteLength);
        const parts = new Array(repeat).fill(base);

        const blob = new Blob(parts, { type: 'application/octet-stream' });

        const t0 = performance.now();
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: blob,
          headers: { 'Content-Type': 'application/octet-stream' },
          cache: 'no-store',
          signal: controller.signal,
        });
        const t1 = performance.now();

        if (!res.ok) throw new Error('Upload failed');

        totalBytes += blob.size;

        const elapsed = performance.now() - started;
        const instBps = (blob.size * 8) / ((t1 - t0) / 1000);
        setUploadProgress(
          `Uploading… ${(totalBytes / (1024 * 1024)).toFixed(2)} MB in ${(elapsed / 1000).toFixed(1)} s (inst ${formatBitsPerSecond(instBps)})`
        );
        meterUpload(parseInt((totalBytes / (1024 * 1024)).toFixed(2)));
        if (elapsed / 1000 >= targetSeconds) {
          controller.abort();
          break;
        }
      }
    } catch (_) {
      // likely aborted
    } finally {
      abortRef.current = null;
    }

    const elapsedMs = performance.now() - started;
    const bps = (totalBytes * 8) / (elapsedMs / 1000);
    const result: SpeedResult = { bps, bytes: totalBytes, durationMs: elapsedMs };
    setUpload(result);
    return result;
  }, []);

  const start = useCallback(async () => {
    //setRunning(true);
    //reset();

    try {
      setPingProgress('Measuring ping…');
      await measurePing(10, 150);

      setDownloadProgress('Measuring download speed…');
      await measureDownload(8, 5 * 1024 * 1024);

      setUploadProgress('Measuring upload speed…');
      await measureUpload(8, 2 * 1024 * 1024);

      setPingProgress('Done')
      setDownloadProgress('Done');
      setUploadProgress('Done');
    } catch (err) {
      setPingProgress('Error occurred. See console.');
      setDownloadProgress('Error occurred. See console.');
      setUploadProgress('Error occurred. See console.');
    } finally {
      //setRunning(false);
    }
  }, [measurePing, measureDownload, measureUpload]);

  // const stop = useCallback(() => {
  //   abortRef.current?.abort();
  //   abortRef.current = null;
  //   setRunning(false);
  //   setPingProgress('Stopped');
  //   setDownloadProgress('Stopped');
  //   setUploadProgress('Stopped');
  // }, []);

  // const summary = useMemo(() => {
  //   if (!ping && !download && !upload) return null;
  //   return (
  //     <div style={{ marginTop: 16 }}>
  //       {ping && (
  //         <div>
  //           <h3>Ping</h3>
  //           <div>Average: {formatMs(ping.averageMs)}</div>
  //           <div>Min: {formatMs(ping.minMs)} | Max: {formatMs(ping.maxMs)}</div>
  //           <div>Jitter (σ): {formatMs(ping.jitterMs)}</div>
  //         </div>
  //       )}
  //       {download && (
  //         <div style={{ marginTop: 12 }}>
  //           <h3>Download</h3>
  //           <div>Speed: {formatBitsPerSecond(download.bps)}</div>
  //           <div>Data: {(download.bytes / (1024 * 1024)).toFixed(2)} MB in {(download.durationMs / 1000).toFixed(1)} s</div>
  //         </div>
  //       )}
  //       {upload && (
  //         <div style={{ marginTop: 12 }}>
  //           <h3>Upload</h3>
  //           <div>Speed: {formatBitsPerSecond(upload.bps)}</div>
  //           <div>Data: {(upload.bytes / (1024 * 1024)).toFixed(2)} MB in {(upload.durationMs / 1000).toFixed(1)} s</div>
  //         </div>
  //       )}
  //     </div>
  //   );
  // }, [ping, download, upload]);

  useEffect(() => {
    start();
  }, []);

  return (
    <div className="basis-3xs">
      <div className="min-h-30 my-3 p-4 shadow-md rounded-md border border-gray-200">
        <div className="text-md font-semibold text-gray-900">Download</div>
        {download && (
          <>
            <div className="text-3xl font-semibold text-gray-700">{formatBitsPerSecond(download.bps)}</div>
            <div className="text-sm font-semibold text-gray-400">Data: {(download.bytes / (1024 * 1024)).toFixed(2)} MB in {(download.durationMs / 1000).toFixed(1)} s</div>
          </>
        )}
        {!download && (
          <>{downloadProgress}</>
        )}
      </div>
      <div className="min-h-30 my-3 p-4 shadow-md rounded-md border border-gray-200">
        <div className="text-md font-semibold text-gray-900">Upload</div>
        {upload && (
          <>
            <div className="text-3xl font-semibold text-gray-700">{formatBitsPerSecond(upload.bps)}</div>
            <div className="text-sm font-semibold text-gray-400">Data: {(upload.bytes / (1024 * 1024)).toFixed(2)} MB in {(upload.durationMs / 1000).toFixed(1)} s</div>
          </>
        )}
        {!upload && (
          <>{uploadProgress}</>
        )}
      </div>
      <div className="min-h-30 my-3 p-4 shadow-md rounded-md border border-gray-200">
        <div className="text-md font-semibold text-gray-900">Ping</div>
        {ping && (
          <>
            <div className="text-3xl font-semibold text-gray-700">{formatMs(ping.averageMs)}</div>
            <div className="text-sm font-semibold text-gray-400">Jitter (σ): {formatMs(ping.jitterMs)}</div>
            <div className="text-sm font-semibold text-gray-400">Min: {formatMs(ping.minMs)} | Max: {formatMs(ping.maxMs)}</div>
          </>
        )}
        {!ping && (
          <>{pingProgress}</>
        )}
      </div>
    </div>
  );
}