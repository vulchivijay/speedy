import React, { useMemo } from 'react';
import type { JSX } from 'react';

type RingGaugeProps = {
  value: number;
  max?: number;
  label?: string;
  units?: string;
  size?: number;
  stroke?: number;
  ticks?: number;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const colorFor = (p: number) => (p < 0.35 ? '#ef4444' : p < 0.7 ? '#f59e0b' : '#22c55e');

const RingGauge: React.FC<RingGaugeProps> = ({
  value,
  max = 100,
  label = '',
  units = 'Mbps',
  size = 240,
  stroke = 16,
  ticks = 24,
}) => {
  const v = clamp(value, 0, max);
  const p = v / max;

  const w = size, h = size;
  const cx = w / 2, cy = h / 2;
  const r = (size - stroke - 10) / 2;
  const C = 2 * Math.PI * r;
  const dashOffset = C * (1 - p);
  const col = colorFor(p);

  const tickLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    const majorEvery = 4;
    for (let i = 0; i < ticks; i++) {
      const angle = (i / ticks) * 2 * Math.PI - Math.PI / 2;
      const outer = { x: cx + (r + 6) * Math.cos(angle), y: cy + (r + 6) * Math.sin(angle) };
      const inner = {
        x: cx + (r - (i % majorEvery === 0 ? 12 : 8)) * Math.cos(angle),
        y: cy + (r - (i % majorEvery === 0 ? 12 : 8)) * Math.sin(angle),
      };
      lines.push(<line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} />);
    }
    return lines;
  }, [ticks, cx, cy, r]);

  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        <g stroke="#475569" strokeWidth={2} strokeLinecap="round">
          {tickLines}
        </g>

        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth={stroke} opacity={0.7} />

        {/* Rotate to start at 12 o'clock */}
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={col}
            strokeWidth={stroke}
            strokeLinecap="round"
            filter="url(#soft)"
            strokeDasharray={C}
            strokeDashoffset={dashOffset}
          />
        </g>

        <text x={cx} y={cy - 2} textAnchor="middle" fill="#e5e7eb" fontSize="28" fontWeight={800}>
          {v < 10 ? v.toFixed(2) : v.toFixed(1)} {units}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="#94a3b8" fontSize="12">
          {label}
        </text>
      </svg>
    </div>
  );
};

export const DualFullGauges: React.FC<{
  download: number;
  upload: number;
  maxDown?: number;
  maxUp?: number;
}> = ({ download, upload, maxDown = 100, maxUp = 40 }) => {
  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    padding: 16,
    borderRadius: 12,
  };
  const titleStyle: React.CSSProperties = {
    color: '#989898',
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: '0.08em',
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: '1fr 1fr',
        background: 'linear-gradient(180deg,#ffffff,#ffffff)',
        padding: 16,
        borderRadius: 16,
      }}
    >
      <div style={cardStyle}>
        <div style={titleStyle}>Download</div>
        <RingGauge value={download} max={maxDown} label="Download" units="Mbps" />
      </div>
      <div style={cardStyle}>
        <div style={titleStyle}>Upload</div>
        <RingGauge value={upload} max={maxUp} label="Upload" units="Mbps" />
      </div>
    </div>
  );
};

// Example usage:
// <DualFullGauges download={62.4} upload={14.8} maxDown={100} maxUp={40} />
