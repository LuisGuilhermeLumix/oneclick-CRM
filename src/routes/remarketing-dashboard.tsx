import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Send, MessageCircle, UserCheck, Megaphone } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { supabase, fetchAllPaged } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { useFilters } from "@/hooks/useFilters";
import { startOfDayUTC, endOfDayUTC } from "@/lib/dates";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/remarketing-dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Remarketing — Lumix - One Click CRM" },
      { name: "description", content: "Métricas de disparos de remarketing." },
    ],
  }),
  component: RemarketingDashboardPage,
});

const TABLE = "rmkt_oneclick";

interface ColumnDef {
  status: string;
  label: string;
  color: string;
}

// Mesmos status do Pipeline / Remarketing
const COLUMNS: ColumnDef[] = [
  { status: "primeiro_contato",   label: "Primeiro Contato",   color: "#888888" },
  { status: "em_contato",         label: "Em Contato",         color: "#80d7f8" },
  { status: "achou_caro",         label: "Achou Caro",         color: "#f59e0b" },
  { status: "sem_dinheiro_agora", label: "Sem Dinheiro Agora", color: "#f97316" },
  { status: "duvida_eficacia",    label: "Dúvida Eficácia",    color: "#a78bfa" },
  { status: "nao_confia",         label: "Não Confia",         color: "#ef4444" },
  { status: "link_enviado",       label: "Link Enviado",       color: "#3b82f6" },
  { status: "convertido",         label: "Convertido",         color: "#22c55e" },
  { status: "desistiu",           label: "Desistiu",           color: "#6b7280" },
  { status: "suspeita_robo",      label: "Suspeita de Robô",   color: "#ec4899" },
];

const KNOWN_STATUSES = new Set(COLUMNS.map((c) => c.status));

const DYNAMIC_COLORS = [
  "#14b8a6", "#8b5cf6", "#eab308", "#06b6d4", "#f43f5e",
  "#84cc16", "#f97316", "#0ea5e9", "#d946ef", "#10b981",
];

function colorForStatus(status: string): string {
  let hash = 0;
  for (let i = 0; i < status.length; i++) {
    hash = status.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DYNAMIC_COLORS[Math.abs(hash) % DYNAMIC_COLORS.length];
}

function prettify(status: string): string {
  return status.replace(/[_-]+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function slug(status: string): string {
  return status
    .normalize("NFD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

interface Row {
  id: number;
  status: string | null;
}

function RemarketingDashboardPage() {
  const { dateFrom, dateTo } = useFilters();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchAllPaged<Row>((fromIdx, toIdx) =>
          supabase
            .from(TABLE)
            .select("id, status, created_at")
            .gte("created_at", startOfDayUTC(dateFrom))
            .lte("created_at", endOfDayUTC(dateTo))
            .range(fromIdx, toIdx),
        );
        if (cancelled) return;
        setRows(data);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("rmkt-dash-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [dateFrom, dateTo]);

  const total = rows.length;

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) {
      const k = slug(r.status ?? "");
      if (!k) continue;
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  }, [rows]);

  // Lista de status = predefinidos + novos que apareceram nos dados
  const statusList = useMemo<ColumnDef[]>(() => {
    const extras = new Map<string, string>();
    for (const r of rows) {
      const raw = r.status?.trim();
      if (!raw) continue;
      const k = slug(raw);
      if (!k || KNOWN_STATUSES.has(k)) continue;
      if (!extras.has(k)) extras.set(k, raw);
    }
    const dyn: ColumnDef[] = [...extras.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, label]) => ({ status: k, label: prettify(label), color: colorForStatus(k) }));
    return [...COLUMNS, ...dyn];
  }, [rows]);

  const pieData = useMemo(() => {
    return statusList
      .map((c) => ({
        status: c.status,
        label: c.label,
        color: c.color,
        value: counts[c.status] || 0,
        pct: total ? ((counts[c.status] || 0) / total) * 100 : 0,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [statusList, counts, total]);

  const get = (s: string) => counts[s] || 0;

  return (
    <AppLayout title="Dashboard Remarketing">
      <div className="space-y-6">
        {/* Destaques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-fr">
          <MetricCard
            label="Leads Disparados"
            icon={Send}
            variant="brand"
            loading={loading}
            value={formatNumber(total)}
            subInfo="no período selecionado"
          />
          <MetricCard
            label="Primeiro Contato"
            icon={Megaphone}
            loading={loading}
            value={formatNumber(get("primeiro_contato"))}
          />
          <MetricCard
            label="Em Contato"
            icon={MessageCircle}
            variant="brand"
            loading={loading}
            value={formatNumber(get("em_contato"))}
          />
          <MetricCard
            label="Convertido"
            icon={UserCheck}
            variant="success"
            loading={loading}
            value={formatNumber(get("convertido"))}
          />
        </div>

        {/* Contagem por status */}
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-white">Leads por Status</h2>
            <p className="text-xs text-[#555] mt-1">
              Quantidade de leads em cada etapa no período
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {statusList.map((c) => (
              <StatusCount
                key={c.status}
                label={c.label}
                color={c.color}
                value={formatNumber(get(c.status))}
                loading={loading}
              />
            ))}
          </div>
        </div>

        <StatusPieChart data={pieData} loading={loading} />
      </div>
    </AppLayout>
  );
}

function StatusCount({
  label,
  color,
  value,
  loading,
}: {
  label: string;
  color: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#1e1e1e] bg-[#101010] px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#777] truncate">
          {label}
        </span>
      </div>
      {loading ? (
        <div className="h-7 w-16 rounded bg-white/[0.04] animate-pulse" />
      ) : (
        <div className="text-2xl font-bold text-white tabular-nums leading-none">{value}</div>
      )}
    </div>
  );
}

interface PieDatum {
  status: string;
  label: string;
  color: string;
  value: number;
  pct: number;
}

function StatusPieChart({ data, loading }: { data: PieDatum[]; loading: boolean }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="surface-panel p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">Distribuição por Status</h2>
        <p className="text-xs text-[#555] mt-1">Percentual de leads em cada etapa</p>
      </div>

      {loading ? (
        <div className="h-[300px] w-full rounded animate-pulse bg-white/[0.03]" />
      ) : data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-[#444]">
          Sem dados para o período selecionado
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-[280px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="#0a0a0a"
                  strokeWidth={2}
                >
                  {data.map((d) => (
                    <Cell key={d.status} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, _name: any, props: any) => {
                    const pct = props?.payload?.pct ?? 0;
                    return [`${value} (${pct.toFixed(1).replace(".", ",")}%)`, props?.payload?.label];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-[#555] mb-3">
              {total} {total === 1 ? "lead" : "leads"} no total
            </div>
            {data.map((d) => (
              <div key={d.status} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0"
                    style={{ background: d.color }}
                  />
                  <span className="text-[#ccc] truncate">{d.label}</span>
                </div>
                <span className="text-[#888] tabular-nums flex-shrink-0">
                  {d.value} ({d.pct.toFixed(1).replace(".", ",")}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
