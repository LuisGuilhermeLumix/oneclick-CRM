import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartData } from "@/hooks/useChartData";
import { formatDateShort, formatDateLong, formatCurrency } from "@/lib/format";
import { ORIGIN_COLORS, ORIGIN_LABELS } from "@/lib/events";

const SERIES = [
  { key: "AC" as const, label: ORIGIN_LABELS.AC, color: ORIGIN_COLORS.AC },
  { key: "GP" as const, label: ORIGIN_LABELS.GP, color: ORIGIN_COLORS.GP },
  { key: "RC" as const, label: ORIGIN_LABELS.RC, color: ORIGIN_COLORS.RC },
];

function formatBRLCompact(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  }
  return `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload as Record<string, number> | undefined;
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-xs shadow-lg min-w-[220px]">
      <p className="mb-2.5 text-[#666] font-medium">{formatDateLong(label)}</p>
      <div className="space-y-2">
        {SERIES.map((s) => {
          const qtd = point ? (point[`${s.key}_qtd`] ?? 0) : 0;
          const val = point ? (point[`${s.key}_val`] ?? 0) : 0;
          return (
            <div key={s.key} className="space-y-0.5">
              <div className="flex items-center justify-between gap-4">
                <span style={{ color: s.color }} className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="text-[#888] tabular-nums text-[11px]">{qtd} vendas</span>
              </div>
              <div className="text-right text-white font-semibold tabular-nums">
                {formatCurrency(val)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RecoveryChart() {
  const { data, loading } = useChartData();

  if (loading) {
    return (
      <div className="surface-panel p-6">
        <div className="h-4 w-48 rounded animate-pulse bg-white/[0.04] mb-2" />
        <div className="h-3 w-64 rounded animate-pulse bg-white/[0.03] mb-5" />
        <div className="h-[260px] w-full rounded animate-pulse bg-white/[0.03]" />
      </div>
    );
  }

  return (
    <div className="surface-panel p-6">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Recuperações ao longo do tempo
          </h2>
          <p className="text-xs text-[#555] mt-1">
            Valor recuperado via WhatsApp por origem do lead
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {SERIES.map((s) => (
            <LegendDot key={s.key} color={s.color} label={s.label} />
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: typeof window !== "undefined" && window.innerWidth < 768 ? 200 : 280 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 5, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#1a1a1a"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="date"
              stroke="#444"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatDateShort(v)}
            />
            <YAxis
              stroke="#444"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={70}
              tickFormatter={formatBRLCompact}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#2a2a2a", strokeWidth: 1 }}
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={`${s.key}_val`}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-xs text-[#888]">{label}</span>
    </div>
  );
}
