import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';

export interface BarDatum {
  label: string;
  value: number;
  secondaryLabel?: string;
  color?: string;
}

export function HorizontalBarChart({
  data,
  formatValue = (v) => String(v),
  emptyMessage = 'Sem registros no período selecionado.',
  accentColor = '#1B2E5E',
}: {
  data: BarDatum[];
  formatValue?: (val: number) => string;
  emptyMessage?: string;
  accentColor?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
        <BarChart3 className="w-7 h-7 mb-2 opacity-40" />
        <p className="text-xs text-slate-500 max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const pct = Math.max(2, (item.value / maxVal) * 100);
        return (
          <div key={`${item.label}-${idx}`} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="font-medium text-slate-700 truncate" title={item.label}>
                {item.label}
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap shrink-0">
                {formatValue(item.value)}
                {item.secondaryLabel ? (
                  <span className="text-slate-400 font-normal ml-1.5">· {item.secondaryLabel}</span>
                ) : null}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.color || accentColor,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

export function LineChartMulti({
  labels,
  series,
  formatValue = (v) => String(v),
  emptyMessage = 'Sem dados suficientes para exibir a evolução temporal.',
}: {
  labels: string[];
  series: LineSeries[];
  formatValue?: (val: number) => string;
  emptyMessage?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (labels.length === 0 || series.length === 0 || series.every((s) => s.values.every((v) => v === 0))) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
        <BarChart3 className="w-7 h-7 mb-2 opacity-40" />
        <p className="text-xs text-slate-500 max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  const width = 620;
  const height = 220;
  const padL = 52;
  const padR = 18;
  const padT = 16;
  const padB = 34;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const allVals = series.flatMap((s) => s.values);
  const maxVal = Math.max(...allVals, 1);

  const getX = (i: number) =>
    labels.length === 1 ? padL + innerW / 2 : padL + (i / (labels.length - 1)) * innerW;
  const getY = (v: number) => padT + innerH - (v / maxVal) * innerH;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: s.color }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52 min-w-[360px]">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + innerH * (1 - t);
            const val = Math.round(maxVal * t);
            return (
              <g key={t}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#E5E7EB" strokeDasharray="3 3" />
                <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#64748B" className="font-mono">
                  {formatValue(val)}
                </text>
              </g>
            );
          })}

          {labels.map((lbl, idx) => {
            const x = getX(idx);
            return (
              <g key={lbl}>
                <text x={x} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748B">
                  {lbl}
                </text>
                <rect
                  x={x - 16}
                  y={padT}
                  width={32}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              </g>
            );
          })}

          {series.map((s) => {
            const points = s.values.map((v, idx) => `${getX(idx)},${getY(v)}`).join(' ');
            return (
              <g key={s.name}>
                {labels.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.25"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={points}
                  />
                )}
                {s.values.map((v, idx) => (
                  <circle
                    key={idx}
                    cx={getX(idx)}
                    cy={getY(v)}
                    r={hoverIdx === idx ? 5 : 3.5}
                    fill="#FFFFFF"
                    stroke={s.color}
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}
        </svg>
        {hoverIdx !== null && (
          <div className="mt-1 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-md inline-flex flex-wrap items-center gap-3">
            <span className="font-semibold">{labels[hoverIdx]}</span>
            {series.map((s) => (
              <span key={s.name} className="font-mono tabular-nums">
                {s.name}: {formatValue(s.values[hoverIdx] ?? 0)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutBreakdown({
  slices,
  formatValue = (v) => String(v),
  emptyMessage = 'Sem dados no período.',
}: {
  slices: DonutSlice[];
  formatValue?: (val: number) => string;
  emptyMessage?: string;
}) {
  const nonZero = slices.filter((s) => s.value > 0);
  const total = nonZero.reduce((acc, s) => acc + s.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
        <BarChart3 className="w-7 h-7 mb-2 opacity-40" />
        <p className="text-xs text-slate-500 max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  let acc = 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          {nonZero.map((s) => {
            const frac = s.value / total;
            const dash = frac * circumference;
            const offset = -acc * circumference;
            acc += frac;
            return (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="20"
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-slate-500">Total</span>
          <span className="text-sm font-bold text-[#1B2E5E] font-mono tabular-nums">{total}</span>
        </div>
      </div>
      <div className="flex-1 w-full space-y-2">
        {nonZero.map((s) => {
          const pct = ((s.value / total) * 100).toFixed(1).replace('.', ',');
          return (
            <div key={s.label} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-700 truncate">{s.label}</span>
              </div>
              <span className="font-mono tabular-nums font-medium text-slate-900 shrink-0">
                {formatValue(s.value)} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
