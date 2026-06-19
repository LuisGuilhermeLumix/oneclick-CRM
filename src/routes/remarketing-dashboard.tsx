import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Send, MessageCircle, UserCheck, Megaphone, TrendingUp,
  BadgeDollarSign, Target, DollarSign, Search, Inbox, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { supabase, fetchAllPaged } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { MetricCard, BreakdownItem } from "@/components/MetricCard";
import { useFilters } from "@/hooks/useFilters";
import { startOfDayUTC, endOfDayUTC } from "@/lib/dates";
import { formatNumber, formatCurrency, formatPercent, formatDateLong } from "@/lib/format";
import { getLeadOrigin, ORIGIN_LABELS, ORIGIN_COLORS } from "@/lib/events";

export const Route = createFileRoute("/remarketing-dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Remarketing — Lumix - One Click CRM" },
      { name: "description", content: "Métricas de disparos e vendas de remarketing." },
    ],
  }),
  component: RemarketingDashboardPage,
});

const RMKT_TABLE = "rmkt_oneclick";
const CRM_TABLE = "oneclick_info_br_CRM";
// SRCs que identificam uma venda vinda do remarketing
const RMKT_SOURCES = ["WPP_RMKT_RC_01", "WPP_RMKT_AC_01"];
const COMISSAO_PCT = 0.2; // 20% sobre o valor recuperado

interface ColumnDef {
  status: string;
  label: string;
  color: string;
}

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
  for (let i = 0; i < status.length; i++) hash = status.charCodeAt(i) + ((hash << 5) - hash);
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

function parseNum(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  let s = String(val).replace(/[^0-9.,\-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

interface LeadRow {
  id: number;
  status: string | null;
}

interface SaleRow {
  id: string;
  date: string;
  name: string;
  number: string;
  email: string;
  product: string;
  utm_source: string;
  value: number;
}

function RemarketingDashboardPage() {
  const { dateFrom, dateTo } = useFilters();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const from = startOfDayUTC(dateFrom);
      const to = endOfDayUTC(dateTo);
      try {
        // Leads disparados (tabela de remarketing)
        const leadRows = await fetchAllPaged<LeadRow>((fromIdx, toIdx) =>
          supabase
            .from(RMKT_TABLE)
            .select("id, status, created_at")
            .gte("created_at", from)
            .lte("created_at", to)
            .range(fromIdx, toIdx),
        );

        // Vendas do remarketing (CRM: order_paid + utm_source dos SRCs de remarketing)
        const saleRows = await fetchAllPaged<any>((fromIdx, toIdx) =>
          supabase
            .from(CRM_TABLE)
            .select('id, created_at, name, number, email, product, utm_source, "($)"')
            .eq("Event", "order_paid")
            .in("utm_source", RMKT_SOURCES)
            .gte("created_at", from)
            .lte("created_at", to)
            .order("created_at", { ascending: false })
            .range(fromIdx, toIdx),
        );

        if (cancelled) return;
        setLeads(leadRows);
        setSales(
          saleRows.map((r) => ({
            id: String(r.id),
            date: r.created_at,
            name: r.name ?? "—",
            number: r.number ?? "—",
            email: r.email ?? "—",
            product: r.product ?? "—",
            utm_source: r.utm_source ?? "",
            value: parseNum(r["($)"]),
          })),
        );
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setLeads([]);
        setSales([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const ch1 = supabase
      .channel("rmkt-dash-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: RMKT_TABLE }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch1);
    };
  }, [dateFrom, dateTo]);

  const totalLeads = leads.length;

  // ---- Métricas financeiras (vendas) ----
  const vendas = sales.length;
  const valorRecuperado = useMemo(() => sales.reduce((acc, s) => acc + s.value, 0), [sales]);
  const comissaoLumix = valorRecuperado * COMISSAO_PCT;
  const taxaConversao = totalLeads > 0 ? (vendas / totalLeads) * 100 : 0;

  // breakdown por origem (AC / RC)
  const vendasBreakdown = useMemo<BreakdownItem[]>(() => {
    const cnt = { AC: 0, RC: 0 } as Record<string, number>;
    for (const s of sales) {
      const o = getLeadOrigin(s.utm_source);
      if (o === "AC" || o === "RC") cnt[o] += 1;
    }
    return [
      { label: ORIGIN_LABELS.AC, color: ORIGIN_COLORS.AC, value: formatNumber(cnt.AC) },
      { label: ORIGIN_LABELS.RC, color: ORIGIN_COLORS.RC, value: formatNumber(cnt.RC) },
    ];
  }, [sales]);

  const valorBreakdown = useMemo<BreakdownItem[]>(() => {
    const sum = { AC: 0, RC: 0 } as Record<string, number>;
    for (const s of sales) {
      const o = getLeadOrigin(s.utm_source);
      if (o === "AC" || o === "RC") sum[o] += s.value;
    }
    return [
      { label: ORIGIN_LABELS.AC, color: ORIGIN_COLORS.AC, value: formatCurrency(sum.AC) },
      { label: ORIGIN_LABELS.RC, color: ORIGIN_COLORS.RC, value: formatCurrency(sum.RC) },
    ];
  }, [sales]);

  // ---- Contagem por status (leads disparados) ----
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of leads) {
      const k = slug(l.status ?? "");
      if (!k) continue;
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  }, [leads]);

  const statusList = useMemo<ColumnDef[]>(() => {
    const extras = new Map<string, string>();
    for (const l of leads) {
      const raw = l.status?.trim();
      if (!raw) continue;
      const k = slug(raw);
      if (!k || KNOWN_STATUSES.has(k)) continue;
      if (!extras.has(k)) extras.set(k, raw);
    }
    const dyn: ColumnDef[] = [...extras.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, label]) => ({ status: k, label: prettify(label), color: colorForStatus(k) }));
    return [...COLUMNS, ...dyn];
  }, [leads]);

  const pieData = useMemo(() => {
    return statusList
      .map((c) => ({
        status: c.status,
        label: c.label,
        color: c.color,
        value: counts[c.status] || 0,
        pct: totalLeads ? ((counts[c.status] || 0) / totalLeads) * 100 : 0,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [statusList, counts, totalLeads]);

  const get = (s: string) => counts[s] || 0;

  return (
    <AppLayout title="Dashboard Remarketing">
      <div className="space-y-6">
        {/* Linha 1 — disparos e vendas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-fr">
          <MetricCard
            label="Leads Disparados"
            icon={Send}
            variant="brand"
            loading={loading}
            value={formatNumber(totalLeads)}
            subInfo="no período selecionado"
          />
          <MetricCard
            label="Vendas Recuperadas"
            icon={TrendingUp}
            variant="success"
            loading={loading}
            value={formatNumber(vendas)}
            breakdown={vendasBreakdown}
          />
          <MetricCard
            label="Valor Recuperado"
            icon={BadgeDollarSign}
            variant="success"
            loading={loading}
            value={formatCurrency(valorRecuperado)}
            breakdown={valorBreakdown}
          />
          <MetricCard
            label="Taxa de Conversão"
            icon={Target}
            variant="brand"
            loading={loading}
            value={formatPercent(taxaConversao, 1)}
            subInfo="vendas ÷ leads disparados"
          />
        </div>

        {/* Linha 2 — comissão + destaques de status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-fr">
          <MetricCard
            label="Comissão Lumix"
            icon={DollarSign}
            variant="brand2"
            loading={loading}
            value={formatCurrency(comissaoLumix)}
            subInfo="20% sobre o valor recuperado"
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

        <SalesTable sales={sales} loading={loading} />
      </div>
    </AppLayout>
  );
}

function StatusCount({
  label, color, value, loading,
}: { label: string; color: string; value: string; loading: boolean }) {
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

// ---------- Leads Recentes (compradores do remarketing) ----------
const PER_PAGE = 10;

function SalesTable({ sales, loading }: { sales: SaleRow[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.number.toLowerCase().includes(q),
    );
  }, [sales, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const headers = ["Data", "Nome", "Telefone", "Email", "Produto", "Canal", "Valor"];

  return (
    <div className="surface-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-white">Leads Recentes (compraram)</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por email, nome ou telefone..."
            className="h-9 w-72 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] pl-9 pr-3 text-sm text-white placeholder-[#444] focus:border-[#80d7f8] transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0a0a0a]">
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#555] px-4 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[#0f0f0f]">
                  {headers.map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 rounded animate-pulse bg-white/[0.04]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="py-16 text-center">
                  <Inbox size={48} className="mx-auto text-[#333] mb-3" />
                  <div className="text-sm text-[#444]">Nenhuma venda no período</div>
                </td>
              </tr>
            ) : (
              pageData.map((s) => (
                <tr key={s.id} className="border-b border-[#0f0f0f] hover:bg-white/[0.015] transition-colors">
                  <td className="px-4 py-3.5 text-[#888] text-xs whitespace-nowrap">
                    {formatDateLong(s.date)}
                  </td>
                  <td className="px-4 py-3.5 text-[#ddd]">{s.name}</td>
                  <td className="px-4 py-3.5 text-[#aaa] font-mono text-xs">{s.number}</td>
                  <td className="px-4 py-3.5 text-[#ddd]">{s.email}</td>
                  <td className="px-4 py-3.5 text-[#aaa]">{s.product}</td>
                  <td className="px-4 py-3.5">
                    <OriginBadge utm_source={s.utm_source} />
                  </td>
                  <td className="px-4 py-3.5 text-white font-medium">{formatCurrency(s.value)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 mt-4 pt-3">
        <span className="text-xs text-[#555]">Página {page} de {totalPages}</span>
        <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft size={14} />
        </PageBtn>
        <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
          <ChevronRight size={14} />
        </PageBtn>
      </div>
    </div>
  );
}

function OriginBadge({ utm_source }: { utm_source: string }) {
  const origin = getLeadOrigin(utm_source);
  if (!origin) return <span className="text-[11px] text-[#555]">—</span>;
  const color = ORIGIN_COLORS[origin];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: color + "1f", color }}
    >
      {ORIGIN_LABELS[origin]}
    </span>
  );
}

function PageBtn({
  children, onClick, disabled,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 flex items-center justify-center rounded-md bg-[#111] border border-[#1e1e1e] text-[#888] transition-colors hover:border-[#80d7f8] hover:text-[#80d7f8] disabled:opacity-40 disabled:hover:border-[#1e1e1e] disabled:hover:text-[#888] disabled:cursor-not-allowed"
    >
      {children}
    </button>
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
                  <span className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
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
