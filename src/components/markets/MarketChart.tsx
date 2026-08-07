"use client";

import { useDeferredValue, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type YesProbabilityPoint = {
  time: string;
  yesProbability: number;
};

type MarketChartProps = {
  /** Optional seed so each market gets a distinct but deterministic series. */
  seed?: string;
  data?: YesProbabilityPoint[];
  /** Override the chart chrome subtitle (e.g. "On-chain pools"). */
  subtitle?: string;
  /** Latest Yes odds % — deferred for smooth live updates. */
  currentYesPct?: number;
};

/** Build 24 hourly Yes-probability points (0–100) for demo charts. */
export function buildMockYesSeries(seed = "default"): YesProbabilityPoint[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const points: YesProbabilityPoint[] = [];
  let value = 40 + (hash % 25);

  for (let hour = 23; hour >= 0; hour -= 1) {
    const drift = ((hash >> (hour % 8)) & 7) - 3;
    value = Math.min(92, Math.max(8, value + drift + (hour % 5 === 0 ? 2 : -1)));
    const label =
      hour === 0 ? "now" : hour === 1 ? "1h" : `${hour}h`;
    points.push({ time: label, yesProbability: Number(value.toFixed(1)) });
  }

  return points.reverse();
}

/**
 * 24h Yes-probability area chart — neon DeFi aesthetic for the market detail.
 */
export function MarketChart({
  seed = "default",
  data,
  subtitle = "Live demo series",
  currentYesPct,
}: MarketChartProps) {
  const series = useMemo(
    () => data ?? buildMockYesSeries(seed),
    [data, seed],
  );

  const livePct =
    currentYesPct ?? series[series.length - 1]?.yesProbability ?? 50;
  const deferredPct = useDeferredValue(livePct);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-border bg-[#070b14] p-3 shadow-[0_0_40px_color-mix(in_oklab,#22d3ee_12%,transparent)] sm:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.1),transparent_50%)]"
      />
      <div className="relative mb-3 flex items-center justify-between gap-2">
        <p className="font-mono-explorer text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300/80">
          Yes probability · 24h
        </p>
        <div className="flex items-center gap-3">
          <p
            data-testid="chart-live-yes-pct"
            className="font-mono-explorer text-sm font-bold tabular-nums text-cyan-300 transition-all duration-500 ease-in-out"
          >
            {deferredPct.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="relative h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={series}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="yesGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.55} />
                <stop offset="85%" stopColor="#22d3ee" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="rgba(148,163,184,0.12)"
              strokeDasharray="3 6"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(7,11,20,0.95)",
                border: "1px solid rgba(34,211,238,0.35)",
                borderRadius: 12,
                color: "#e2e8f0",
                boxShadow: "0 0 24px rgba(34,211,238,0.2)",
              }}
              formatter={(value) => [
                `${Number(value).toFixed(1)}%`,
                "Yes",
              ]}
              labelFormatter={(label) => `t = ${label}`}
            />
            <Area
              type="monotone"
              dataKey="yesProbability"
              stroke="#22d3ee"
              strokeWidth={2.5}
              fill="url(#yesGlow)"
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-in-out"
              activeDot={{
                r: 5,
                fill: "#67e8f9",
                stroke: "#0e7490",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
