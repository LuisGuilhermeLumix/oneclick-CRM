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

  const smsEntry = payload.find((p: any) => p.dataKey === "sms");
  const emailEntry = payload.find((p: any) => p.dataKey === "email");

  const data = payload[0]?.payload;
  const smsValue = data?.smsValue ?? 0;
  const emailValue = data?.emailValue ?? 0;

  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-xs shadow-lg min-w-[160px]">
      <p className="mb-2.5 text-[#666] font-medium">{formatDateLong(label)}</p>

      {smsEntry && (
        <div className="mb-1.5">
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: "#80d7f8" }}>● SMS</span>
            <span className="text-white font-semibold">{smsEntry.value} vendas</span>
          </div>
          <div className="flex justify-end">
            <span className="text-[#80d7f8] font-medium">{formatCurrency(smsValue)}</span>
          </div>
        </div>
      )}

      {emailEntry && (
        <div>
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: "#e65ff5" }}>● Email</span>
            <span className="text-white font-semibold">{emailEntry.value} vendas</span>
          </div>
          <div className="flex justify-end">
            <span className="text-[#e65ff5] font-medium">{formatCurrency(emailValue)}</span>
          </div>
        </div>
      )}

      {(smsEntry || emailEntry) && (
        <div className="mt-2 pt-2 border-t border-[#2a2a2a] flex items-center justify-between">
          <span className="text-[#555]">Total</span>
          <span className="text-white font-semibold">
            {formatCurrency(smsValue + emailValue)}
          </span>
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
            Vendas recuperadas por dia, separadas por canal
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LegendDot color="#80d7f8" label="SMS" />
          <LegendDot color="#e65ff5" label="Email" />
        </div>
      </div>

      <div style={{ width: "100%", height: typeof window !== "undefined" && window.innerWidth < 768 ? 160 : 220 }}>
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 8, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="smsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#80d7f8" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#80d7f8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="emailFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e65ff5" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#e65ff5" stopOpacity={0} />
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
              dataKey="sms"
              stroke="#80d7f8"
              strokeWidth={2}
              fill="url(#smsFill)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="email"
              stroke="#e65ff5"
              strokeWidth={2}
              fill="url(#emailFill)"
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
