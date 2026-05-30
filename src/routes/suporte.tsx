import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Headset,
  MessageCircleQuestion,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { supabase, fetchAllPaged } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { useFilters } from "@/hooks/useFilters";
import { startOfDayUTC, endOfDayUTC } from "@/lib/dates";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte — Lumix - One Click CRM" },
      { name: "description", content: "Atendimento de suporte: leads, dúvidas e pipeline." },
    ],
  }),
  component: SuportePage,
});

const TABLE = "oneclick_suporte_br_crm";

interface SupportTicket {
  id: number;
  name: string | null;
  number: string | null;
  email: string | null;
  product: string | null;
  status: string | null;
  topico: string | null;
  encaminhado_humano: boolean | null;
  last_message: string | null;
  chatwoot_conversation_id: number | null;
  created_at: string;
}

interface ColumnDef {
  status: string;
  label: string;
  color: string;
  bg: string;
}

/* Estágios do pipeline de suporte (status) */
const COLUMNS: ColumnDef[] = [
  { status: "novo",                label: "Novo",              color: "#888888", bg: "rgba(136,136,136,0.12)" },
  { status: "escolhendo_opcao",    label: "Escolhendo Opção",  color: "#80d7f8", bg: "rgba(128,215,248,0.12)" },
  { status: "acessar_app",         label: "Acessar App",       color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { status: "como_jogar",          label: "Como Jogar",        color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  { status: "reembolso",           label: "Reembolso",         color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { status: "encaminhado_humano",  label: "Com Vendedor",      color: "#ec4899", bg: "rgba(236,72,153,0.12)" },
  { status: "resolvido",           label: "Resolvido",         color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
];

const STATUS_COLOR_MAP: Record<string, string> = COLUMNS.reduce((acc, c) => {
  acc[c.status] = c.color;
  return acc;
}, {} as Record<string, string>);

const STATUS_LABEL_MAP: Record<string, string> = COLUMNS.reduce((acc, c) => {
  acc[c.status] = c.label;
  return acc;
}, {} as Record<string, string>);

/* Classificação das dúvidas (topico) — alimenta o gráfico "Maiores Dúvidas" */
const TOPICO_CONFIG: Record<string, { label: string; color: string }> = {
  acessar_app: { label: "Acessar App",         color: "#3b82f6" },
  como_jogar:  { label: "Como Jogar",          color: "#a78bfa" },
  reembolso:   { label: "Reembolso",           color: "#f59e0b" },
  pagamento:   { label: "Pagamento / Acesso",  color: "#22d3ee" },
  confianca:   { label: "Confiança / Golpe",   color: "#ef4444" },
  outros:      { label: "Outros",              color: "#6b7280" },
};

function topicoLabel(t: string | null): string {
  if (!t) return TOPICO_CONFIG.outros.label;
  return TOPICO_CONFIG[t]?.label ?? t;
}
function topicoColor(t: string | null): string {
  if (!t) return TOPICO_CONFIG.outros.color;
  return TOPICO_CONFIG[t]?.color ?? "#6b7280";
}

function formatDatePtBR(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SuportePage() {
  const { dateFrom, dateTo } = useFilters();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const rows = await fetchAllPaged<SupportTicket>((fromIdx, toIdx) =>
          supabase
            .from(TABLE)
            .select(
              "id, name, number, email, product, status, topico, encaminhado_humano, last_message, chatwoot_conversation_id, created_at",
            )
            .gte("created_at", startOfDayUTC(dateFrom))
            .lte("created_at", endOfDayUTC(dateTo))
            .order("created_at", { ascending: false })
            .range(fromIdx, toIdx),
        );

        if (cancelled) return;
        setTickets(rows);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setTickets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("suporte-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          if (!row) return;

          setTickets((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((t) => t.id !== row.id);
            }
            const created = new Date(row.created_at).getTime();
            const fromMs = new Date(startOfDayUTC(dateFrom)).getTime();
            const toMs = new Date(endOfDayUTC(dateTo)).getTime();
            if (created < fromMs || created > toMs) {
              return prev.filter((t) => t.id !== row.id);
            }

            const next = prev.filter((t) => t.id !== row.id);
            const updated: SupportTicket = {
              id: row.id,
              name: row.name ?? null,
              number: row.number ?? null,
              email: row.email ?? null,
              product: row.product ?? null,
              status: row.status ?? null,
              topico: row.topico ?? null,
              encaminhado_humano: row.encaminhado_humano ?? null,
              last_message: row.last_message ?? null,
              chatwoot_conversation_id: row.chatwoot_conversation_id ?? null,
              created_at: row.created_at,
            };
            next.unshift(updated);
            return next.sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            );
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [dateFrom, dateTo]);

  /* Métricas de topo */
  const stats = useMemo(() => {
    const total = tickets.length;
    const resolvidos = tickets.filter((t) => t.status === "resolvido").length;
    const comVendedor = tickets.filter(
      (t) => t.encaminhado_humano === true || t.status === "encaminhado_humano",
    ).length;
    const emAtendimento = total - resolvidos - comVendedor;
    return {
      total,
      emAtendimento: emAtendimento < 0 ? 0 : emAtendimento,
      comVendedor,
      resolvidos,
    };
  }, [tickets]);

  /* Maiores dúvidas (por topico) */
  const duvidasData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tickets) {
      const key = t.topico ?? "outros";
      counts[key] = (counts[key] || 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .map(([topico, value]) => ({
        topico,
        value,
        pct: total ? (value / total) * 100 : 0,
        color: topicoColor(topico),
        label: topicoLabel(topico),
      }))
      .sort((a, b) => b.value - a.value);
  }, [tickets]);

  return (
    <AppLayout title="Suporte" showFilters={false}>
      <div className="space-y-6">
        <SuporteFilters />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-fr">
          <MetricCard
            label="Leads de Suporte"
            icon={Headset}
            loading={loading}
            value={stats.total.toLocaleString("pt-BR")}
          />
          <MetricCard
            label="Em Atendimento"
            icon={MessageCircleQuestion}
            variant="brand"
            loading={loading}
            value={stats.emAtendimento.toLocaleString("pt-BR")}
          />
          <MetricCard
            label="Com Vendedor"
            icon={UserCheck}
            variant="brand2"
            loading={loading}
            value={stats.comVendedor.toLocaleString("pt-BR")}
            subInfo="Encaminhados ao atendimento humano"
          />
          <MetricCard
            label="Resolvidos"
            icon={CheckCircle2}
            variant="success"
            loading={loading}
            value={stats.resolvidos.toLocaleString("pt-BR")}
          />
        </div>

        {/* Pipeline kanban */}
        <div className="-mx-4 md:-mx-6 px-4 md:px-6 overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {COLUMNS.map((col) => {
              const colTickets = tickets.filter((t) => t.status === col.status);
              return (
                <div
                  key={col.status}
                  className="w-[280px] flex-shrink-0 rounded-xl bg-[#0a0a0a] border border-[#141414] flex flex-col max-h-[calc(100vh-360px)]"
                >
                  <div className="px-4 py-3 border-b border-[#141414] flex items-center justify-between gap-2 sticky top-0 bg-[#0a0a0a] rounded-t-xl">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: col.bg, color: col.color }}
                    >
                      {col.label}
                    </span>
                    <span className="text-xs font-semibold text-[#666]">
                      ({colTickets.length})
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loading && colTickets.length === 0 ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-20 rounded-lg bg-white/[0.03] animate-pulse"
                        />
                      ))
                    ) : colTickets.length === 0 ? (
                      <div className="text-center py-6 text-[11px] text-[#444]">
                        Sem tickets
                      </div>
                    ) : (
                      colTickets.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DuvidasPieChart data={duvidasData} loading={loading} />
      </div>
    </AppLayout>
  );
}

const QUICK_RANGES = [
  { key: "hoje",  label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "7d",    label: "7 dias" },
  { key: "mes",   label: "Este mês" },
] as const;

function SuporteFilters() {
  const { dateFrom, dateTo, activeRange, setRange, applyCustom } = useFilters();
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(dateFrom);
  const [customTo, setCustomTo] = useState(dateTo);

  function handleApplyCustom() {
    applyCustom(customFrom, customTo);
    setCustomOpen(false);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {QUICK_RANGES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setRange(key)}
          className={[
            "h-9 px-3 text-xs font-medium rounded-md border transition-colors duration-150",
            activeRange === key
              ? "bg-[rgba(128,215,248,0.12)] border-[#80d7f8] text-[#80d7f8]"
              : "bg-[#111] border-[#222] text-[#777] hover:text-[#ccc] hover:border-[#2a2a2a]",
          ].join(" ")}
        >
          {label}
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setCustomOpen((v) => !v)}
          className={[
            "h-9 flex items-center gap-1.5 px-3 text-xs font-medium rounded-md border transition-colors duration-150",
            activeRange === "custom"
              ? "bg-[rgba(128,215,248,0.12)] border-[#80d7f8] text-[#80d7f8]"
              : "bg-[#111] border-[#222] text-[#777] hover:text-[#ccc] hover:border-[#2a2a2a]",
          ].join(" ")}
        >
          <Calendar size={12} />
          Customizado
          {customOpen
            ? <ChevronUp size={11} className="text-[#555]" />
            : <ChevronDown size={11} className="text-[#555]" />}
        </button>

        {customOpen && (
          <div className="absolute left-0 mt-1.5 w-[280px] rounded-xl bg-[#0f0f0f] border border-[#1e1e1e] p-4 shadow-xl z-50">
            <p className="text-[11px] text-[#555] uppercase tracking-wide mb-3">
              Período personalizado
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-[#666] mb-1 block">De</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] text-[#ccc] text-xs outline-none focus:border-[#80d7f8] [color-scheme:dark] transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#666] mb-1 block">Até</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] text-[#ccc] text-xs outline-none focus:border-[#80d7f8] [color-scheme:dark] transition-colors"
                />
              </div>
              <button
                onClick={handleApplyCustom}
                className="w-full h-9 rounded-lg bg-[#80d7f8] text-black text-xs font-bold hover:bg-[#a8e8ff] transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const cfg = ticket.topico ? TOPICO_CONFIG[ticket.topico] : undefined;
  return (
    <div className="rounded-lg bg-[#101010] border border-[#1a1a1a] p-3 hover:border-[#2a2a2a] transition-colors">
      {cfg && (
        <div className="mb-2">
          <span
            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: cfg.color + "20", color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
      )}
      <div className="text-sm font-semibold text-white truncate">
        {ticket.name || "—"}
      </div>
      <div className="text-xs text-[#888] font-mono mt-0.5 truncate">
        {ticket.number || ticket.email || "—"}
      </div>
      <div className="text-[11px] text-[#555] mt-0.5">
        {formatDatePtBR(ticket.created_at)}
      </div>
      {ticket.last_message && (
        <div className="text-[11px] text-[#777] mt-1.5 line-clamp-2">
          {ticket.last_message}
        </div>
      )}
      {ticket.product && (
        <div className="mt-2">
          <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium truncate max-w-full bg-[#1e3a5f] text-[#80d7f8]">
            {ticket.product}
          </span>
        </div>
      )}
    </div>
  );
}

interface DuvidaDatum {
  topico: string;
  value: number;
  pct: number;
  color: string;
  label: string;
}

function DuvidasPieChart({ data, loading }: { data: DuvidaDatum[]; loading: boolean }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="surface-panel p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">Maiores Dúvidas</h2>
        <p className="text-xs text-[#555] mt-1">
          Distribuição dos tickets por tipo de dúvida no período
        </p>
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
                    <Cell key={d.topico} fill={d.color} />
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
              {total} {total === 1 ? "ticket" : "tickets"} no total
            </div>
            {data.map((d) => (
              <div key={d.topico} className="flex items-center justify-between gap-3 text-xs">
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
