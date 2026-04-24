import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Cell, LabelList } from "recharts";

interface TrackingDistributionProps {
  summary: {
    total: number;
    infoReceived: number;
    delivered: number;
    failed: number;
  };
}

export function TrackingDistribution({ summary }: TrackingDistributionProps) {
  const total = summary.total || 1;
  const dist = [
    { name: "InfoReceived", value: +((summary.infoReceived / total) * 100).toFixed(1), color: "#80d7f8" },
    { name: "Delivered", value: +((summary.delivered / total) * 100).toFixed(1), color: "#22c55e" },
    { name: "FailedAttempt", value: +((summary.failed / total) * 100).toFixed(1), color: "#ef4444" },
  ];

  return (
    <div className="surface-panel p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">Distribuição por Evento</h2>
        <p className="text-xs text-[#555] mt-1">Porcentagem de cada tipo</p>
      </div>
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={dist}
            margin={{ top: 5, right: 50, left: 10, bottom: 0 }}
            barCategoryGap={10}
          >
            <CartesianGrid horizontal={false} stroke="#1a1a1a" strokeDasharray="3 3" />
            <XAxis type="number" stroke="#444" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#777"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
              {dist.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v) => (typeof v === "number" ? `${v.toFixed(1)}%` : "")}
                style={{ fill: "#888", fontSize: 11, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
