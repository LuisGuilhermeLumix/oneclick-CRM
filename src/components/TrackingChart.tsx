import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { TrackingChartPoint } from '@/hooks/useTracking'

interface Props {
  data: TrackingChartPoint[]
  loading: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-xs shadow-lg">
      <p className="mb-2 text-[#888]">
        {label ? format(parseISO(label), 'MMM dd, yyyy') : ''}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="mb-0.5">
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function TrackingChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="surface-panel p-6">
        <div className="h-4 w-52 rounded animate-pulse bg-white/[0.04] mb-2" />
        <div className="h-3 w-64 rounded animate-pulse bg-white/[0.03] mb-5" />
        <div className="h-[200px] w-full rounded animate-pulse bg-white/[0.03]" />
      </div>
    )
  }

  return (
    <div className="surface-panel p-6">
      <div className="mb-5">
        <h2 className="text-[14px] font-semibold text-white">Eventos ao longo do tempo</h2>
        <p className="text-[12px] text-[#555] mt-0.5">Disparos por tipo de evento por dia</p>
      </div>

      <ResponsiveContainer width="100%" height={typeof window !== "undefined" && window.innerWidth < 768 ? 150 : 200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => {
              try { return format(parseISO(v), 'MMM dd') } catch { return v }
            }}
            tick={{ fill: '#444', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#444', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#888', paddingTop: 12 }}
            iconType="circle"
            iconSize={6}
          />
          <Line
            type="monotone"
            dataKey="infoReceived"
            name="Info Received"
            stroke="#80d7f8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#80d7f8' }}
          />
          <Line
            type="monotone"
            dataKey="delivered"
            name="Delivered"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#22c55e' }}
          />
          <Line
            type="monotone"
            dataKey="failed"
            name="Failed Attempt"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#ef4444' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
