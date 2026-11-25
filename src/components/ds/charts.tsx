import React, { useState } from 'react';

export interface ChartDatum {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

export const BarChartSVG: React.FC<{
  data: ChartDatum[];
  formatValue?: (n: number) => string;
  primaryLabel?: string;
  secondaryLabel?: string;
  height?: number;
}> = ({
  data,
  formatValue = (n) => n.toLocaleString('es-CL'),
  primaryLabel = 'Actual',
  secondaryLabel = 'Meta',
  height = 210,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => [d.value, d.secondaryValue || 0])
  );

  return (
    <div className="w-full select-none">
      <div className="relative" style={{ height }}>
        <div className="h-full flex items-end gap-2 sm:gap-3 pt-6 pb-7 border-b border-slate-200">
          {data.map((d, i) => {
            const hPct = Math.max(4, Math.round((d.value / maxVal) * 100));
            const hSecPct =
              typeof d.secondaryValue === 'number'
                ? Math.max(4, Math.round((d.secondaryValue / maxVal) * 100))
                : null;
            const isHovered = hoveredIdx === i;

            return (
              <div
                key={d.label}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
              >
                {isHovered && (
                  <div className="absolute -top-2 z-20 bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-md whitespace-nowrap pointer-events-none">
                    <div className="font-semibold">{d.label}</div>
                    <div className="font-mono tabular-nums">
                      {primaryLabel}: {formatValue(d.value)}
                    </div>
                    {typeof d.secondaryValue === 'number' && (
                      <div className="font-mono tabular-nums text-slate-300">
                        {secondaryLabel}: {formatValue(d.secondaryValue)}
                      </div>
                    )}
                  </div>
                )}
                <div className="w-full h-full flex items-end justify-center gap-1 px-0.5">
                  <div
                    style={{ height: `${hPct}%` }}
                    className={`w-full max-w-[26px] rounded-t-md transition-opacity ${
                      d.color || 'bg-blue-700'
                    } ${isHovered ? 'opacity-90' : ''}`}
                  />
                  {hSecPct !== null && (
                    <div
                      style={{ height: `${hSecPct}%` }}
                      className="w-full max-w-[18px] rounded-t-md bg-slate-200"
                    />
                  )}
                </div>
                <span className="absolute -bottom-6 text-[11px] text-slate-500 truncate max-w-full">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {data.some((d) => typeof d.secondaryValue === 'number') && (
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-700" />
            {primaryLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-200" />
            {secondaryLabel}
          </span>
        </div>
      )}
    </div>
  );
};

export const LineChartSVG: React.FC<{
  data: ChartDatum[];
  formatValue?: (n: number) => string;
  height?: number;
}> = ({ data, formatValue = (n) => n.toLocaleString('es-CL'), height = 200 }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const w = 520;
  const h = height;
  const padX = 24;
  const padY = 20;
  const maxVal = Math.max(1, ...data.map((d) => d.value));

  const points = data.map((d, idx) => {
    const x = padX + (idx / Math.max(1, data.length - 1)) * (w - padX * 2);
    const y = h - padY - (d.value / maxVal) * (h - padY * 2);
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${padX},${h - padY} ${polyline} ${w - padX},${h - padY}`;

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="crmLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = h - padY - t * (h - padY * 2);
          return (
            <line
              key={t}
              x1={padX}
              x2={w - padX}
              y1={y}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray="3 3"
            />
          );
        })}
        <polygon points={area} fill="url(#crmLineGrad)" />
        <polyline
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />
        {points.map((p, idx) => (
          <g
            key={p.label}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
          >
            <circle cx={p.x} cy={p.y} r={hovered === idx ? 5.5 : 3.5} fill="#1D4ED8" stroke="#fff" strokeWidth="2" />
            <text x={p.x} y={h - 3} textAnchor="middle" className="fill-slate-500 text-[10px]">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      {hovered !== null && points[hovered] && (
        <div className="mt-2 flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <span className="font-medium text-slate-700">{points[hovered].label}</span>
          <span className="font-mono tabular-nums font-semibold text-blue-700">
            {formatValue(points[hovered].value)}
          </span>
        </div>
      )}
    </div>
  );
};

export const HorizontalBars: React.FC<{
  items: { label: string; value: number; formattedValue: string; pct: number; colorClass?: string }[];
  onItemClick?: (label: string) => void;
}> = ({ items, onItemClick }) => (
  <div className="space-y-3">
    {items.map((item) => (
      <div
        key={item.label}
        onClick={() => onItemClick?.(item.label)}
        className={`space-y-1 ${onItemClick ? 'cursor-pointer group' : ''}`}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700 group-hover:text-blue-700 truncate pr-2">
            {item.label}
          </span>
          <span className="font-mono tabular-nums text-slate-900 font-semibold shrink-0">
            {item.formattedValue}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.min(100, Math.max(3, item.pct))}%` }}
            className={`h-full rounded-full transition-all ${item.colorClass || 'bg-blue-700'}`}
          />
        </div>
      </div>
    ))}
  </div>
);
