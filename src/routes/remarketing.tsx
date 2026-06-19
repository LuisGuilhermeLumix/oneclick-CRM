import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { supabase, fetchAllPaged } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { PIPELINE_EVENT_CONFIG } from "@/lib/events";

export const Route = createFileRoute("/remarketing")({
  head: () => ({
    meta: [
      { title: "Remarketing — Lumix - One Click CRM" },
      { name: "description", content: "Pipeline de remarketing." },
    ],
  }),
  component: RemarketingPage,
});

const TABLE = "rmkt_oneclick";

interface RmktLead {
  id: number;
  nome: string | null;
  telefone: string | null;
  produto: string | null;
  status: string | null;
  evento: string | null;
}

// Eventos conhecidos (mesmas cores do Pipeline) + fallback para texto cru
const EVENTO_LABELS_EXTRA: Record<string, string> = {
  abandoned_cart: "Carrinho Abandonado",
  generated_pix: "Pix Gerado",
  refused_card: "Cartão Recusado",
  order_paid: "Venda Aprovada",
};

function getEventoConfig(evento: string): { label: string; color: string } {
  const cfg = PIPELINE_EVENT_CONFIG[evento];
  if (cfg) return cfg;
  return {
    label: EVENTO_LABELS_EXTRA[evento] ?? prettify(evento),
    color: "#9ca3af",
  };
}

interface ColumnDef {
  status: string;
  label: string;
  color: string;
  bg: string;
}

const PRODUCT_COLORS = [
  { bg: "#1e3a5f", text: "#80d7f8" },
  { bg: "#3b1f5e", text: "#c084fc" },
  { bg: "#1a4731", text: "#4ade80" },
  { bg: "#4a1f1f", text: "#f87171" },
  { bg: "#3d2e0a", text: "#fbbf24" },
  { bg: "#1a3d4a", text: "#22d3ee" },
  { bg: "#3d1a3d", text: "#f472b6" },
  { bg: "#2d3d1a", text: "#a3e635" },
];

function getProductColor(product: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < product.length; i++) {
    hash = product.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRODUCT_COLORS.length;
  return PRODUCT_COLORS[index];
}

// Mesmos status do Pipeline (Leads) atual
const COLUMNS: ColumnDef[] = [
  { status: "primeiro_contato",   label: "Primeiro Contato",  color: "#888888", bg: "rgba(136,136,136,0.12)" },
  { status: "em_contato",         label: "Em Contato",        color: "#80d7f8", bg: "rgba(128,215,248,0.12)" },
  { status: "achou_caro",         label: "Achou Caro",        color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { status: "sem_dinheiro_agora", label: "Sem Dinheiro Agora",color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  { status: "duvida_eficacia",    label: "Dúvida Eficácia",   color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  { status: "nao_confia",         label: "Não Confia",        color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  { status: "link_enviado",       label: "Link Enviado",      color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { status: "convertido",         label: "Convertido",        color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  { status: "desistiu",           label: "Desistiu",          color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
  { status: "suspeita_robo",      label: "Suspeita de Robô",  color: "#ec4899", bg: "rgba(236,72,153,0.12)" },
];

const KNOWN_STATUSES = new Set(COLUMNS.map((c) => c.status));

// Paleta para status NOVOS (não predefinidos) — cria coluna dinâmica
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
  return status
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Normaliza status p/ comparar: "Em Contato" -> "em_contato", "Dúvida Eficácia" -> "duvida_eficacia"
function slug(status: string): string {
  return status
    .normalize("NFD")
    .replace(/[^\x00-\x7F]/g, "") // remove acentos (marcas de combinação ficam fora do ASCII)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function RemarketingPage() {
  const [leads, setLeads] = useState<RmktLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const rows = await fetchAllPaged<RmktLead>((fromIdx, toIdx) =>
          supabase
            .from(TABLE)
            .select("id, nome, telefone, produto, status, evento")
            .not("status", "is", null)
            .neq("status", "")
            .order("id", { ascending: false })
            .range(fromIdx, toIdx),
        );

        if (cancelled) return;
        setLeads(rows);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setLeads([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("remarketing-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          if (!row) return;

          setLeads((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((l) => l.id !== row.id);
            }
            const next = prev.filter((l) => l.id !== row.id);
            if (!row.status) return next;

            const updated: RmktLead = {
              id: row.id,
              nome: row.nome ?? null,
              telefone: row.telefone ?? null,
              produto: row.produto ?? null,
              status: row.status,
              evento: row.evento ?? null,
            };
            next.unshift(updated);
            return next.sort((a, b) => b.id - a.id);
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Colunas = predefinidas + dinâmicas (status que apareceram e não existem ainda)
  const columns = useMemo<ColumnDef[]>(() => {
    const extras = new Map<string, string>(); // slug -> texto original do status
    for (const l of leads) {
      const raw = l.status?.trim();
      if (!raw) continue;
      const key = slug(raw);
      if (!key || KNOWN_STATUSES.has(key)) continue;
      if (!extras.has(key)) extras.set(key, raw);
    }
    const dynamic: ColumnDef[] = [...extras.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, label]) => {
        const color = colorForStatus(key);
        return { status: key, label: prettify(label), color, bg: color + "20" };
      });
    return [...COLUMNS, ...dynamic];
  }, [leads]);

  const pieData = useMemo(() => {
    const colorMap: Record<string, string> = {};
    const labelMap: Record<string, string> = {};
    for (const c of columns) {
      colorMap[c.status] = c.color;
      labelMap[c.status] = c.label;
    }

    const counts: Record<string, number> = {};
    for (const l of leads) {
      const key = slug(l.status ?? "");
      if (!key) continue;
      counts[key] = (counts[key] || 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .map(([status, value]) => ({
        status,
        value,
        pct: total ? (value / total) * 100 : 0,
        color: colorMap[status] ?? "#6b7280",
        label: labelMap[status] ?? status,
      }))
      .sort((a, b) => b.value - a.value);
  }, [leads, columns]);

  return (
    <AppLayout title="Remarketing" showFilters={false}>
      <div className="space-y-6">
        <div className="-mx-4 md:-mx-6 px-4 md:px-6 overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {columns.map((col) => {
              const colLeads = leads.filter((l) => slug(l.status ?? "") === col.status);
              return (
                <div
                  key={col.status}
                  className="w-[280px] flex-shrink-0 rounded-xl bg-[#0a0a0a] border border-[#141414] flex flex-col max-h-[calc(100vh-220px)]"
                >
                  <div className="px-4 py-3 border-b border-[#141414] flex items-center justify-between gap-2 sticky top-0 bg-[#0a0a0a] rounded-t-xl">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: col.bg, color: col.color }}
                    >
                      {col.label}
                    </span>
                    <span className="text-xs font-semibold text-[#666]">
                      ({colLeads.length})
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loading && colLeads.length === 0 ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-16 rounded-lg bg-white/[0.03] animate-pulse"
                        />
                      ))
                    ) : colLeads.length === 0 ? (
                      <div className="text-center py-6 text-[11px] text-[#444]">
                        Sem leads
                      </div>
                    ) : (
                      colLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <StatusPieChart data={pieData} loading={loading} />
      </div>
    </AppLayout>
  );
}

function LeadCard({ lead }: { lead: RmktLead }) {
  const evtCfg = lead.evento ? getEventoConfig(lead.evento) : undefined;
  return (
    <div className="rounded-lg bg-[#101010] border border-[#1a1a1a] p-3 hover:border-[#2a2a2a] transition-colors">
      {evtCfg && (
        <div className="mb-2">
          <span
            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: evtCfg.color + "20", color: evtCfg.color }}
          >
            {evtCfg.label}
          </span>
        </div>
      )}
      <div className="text-sm font-semibold text-white truncate">
        {lead.nome || "—"}
      </div>
      <div className="text-xs text-[#888] font-mono mt-0.5 truncate">
        {lead.telefone || "—"}
      </div>
      {lead.produto && (
        <div className="mt-2">
          <span
            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium truncate max-w-full"
            style={(() => {
              const c = getProductColor(lead.produto!);
              return { backgroundColor: c.bg, color: c.text };
            })()}
          >
            {lead.produto}
          </span>
        </div>
      )}
    </div>
  );
}

interface PieDatum {
  status: string;
  value: number;
  pct: number;
  color: string;
  label: string;
}

function StatusPieChart({ data, loading }: { data: PieDatum[]; loading: boolean }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="surface-panel p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">Distribuição por Status</h2>
        <p className="text-xs text-[#555] mt-1">
          Percentual de leads em cada coluna do remarketing
        </p>
      </div>

      {loading ? (
        <div className="h-[300px] w-full rounded animate-pulse bg-white/[0.03]" />
      ) : data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-[#444]">
          Sem dados
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
