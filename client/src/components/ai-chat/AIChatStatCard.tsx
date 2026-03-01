/**
 * AIChatStatCard — Card statistiche strutturate da function calling backend
 * Renderizza KPI come occupazione, incassi, trend
 */
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SSEDataEvent, StatItem } from "./types";

interface AIChatStatCardProps {
  event: SSEDataEvent;
}

function StatCard({ stat }: { stat: StatItem }) {
  const TrendIcon =
    stat.trend === "up"
      ? TrendingUp
      : stat.trend === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    stat.trend === "up"
      ? "text-green-400"
      : stat.trend === "down"
        ? "text-red-400"
        : "text-slate-400";

  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
      <span className="text-xs text-slate-400">{stat.label}</span>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-white">{stat.value}</span>
        {stat.trend && (
          <TrendIcon className={`size-4 ${trendColor}`} />
        )}
      </div>
    </div>
  );
}

export function AIChatStatCard({ event }: AIChatStatCardProps) {
  const { title, content } = event;
  const { stats } = content;

  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <div className="my-3">
      {title && (
        <h4 className="text-sm font-medium text-teal-400 mb-2">{title}</h4>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {stats.map((stat, idx) => (
          <StatCard key={idx} stat={stat} />
        ))}
      </div>
    </div>
  );
}
