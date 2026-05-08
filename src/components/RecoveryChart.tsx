import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartData } from "@/hooks/useChartData";
import { formatDateShort, formatDateLong, formatCurrency } from "@/lib/format";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const salesEntry = payload.find((p: any) => p.dataKey === "sales");
  const data = payload[0]?.payload;
  const value = data?.value ?? 0;

  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-xs shadow-lg min-w-[160px]">
      <p className="mb-2.5 text-[#666] font-medium">{formatDateLong(label)}</p>

      {salesEntry && (
        <div>
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: "#22c55e" }}>● WPP</span>
            <span className="text-white font-semibold">{salesEntry.value} vendas</span>
          </div>
          <div className="flex justify-end">
            <span className="text-[#22c55e] font-medium">{formatCurrency(value)}</span>
          </div>
        </div>
      )}
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
        <div className="h-[220px] w-full rounded animate-pulse bg-white/[0.03]" />
      </div>
    );
  }

  return (
    <div className="surface-panel p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Recuperações ao longo do tempo
          </h2>
          <p className="text-xs text-[#555] mt-1">
            Vendas recuperadas via WhatsApp por dia
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LegendDot color="#22c55e" label="WPP" />
        </div>
      </div>

      <div style={{ width: "100%", height: typeof window !== "undefined" && window.innerWidth < 768 ? 160 : 220 }}>
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 8, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="wppFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#2a2a2a", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#wppFill)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
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
