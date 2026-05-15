import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — Lumix - One Click CRM" },
      { name: "description", content: "Pipeline de leads de carrinho abandonado." },
    ],
  }),
  component: PipelinePage,
});

const TABLE = "oneclick_info_br_CRM";

interface PipelineLead {
  id: number;
  name: string | null;
  number: string | null;
  product: string | null;
  status: string | null;
  created_at: string;
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

function PipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from(TABLE)
        .select("id, name, number, product, status, created_at")
        .eq("event", "abandoned_cart")
        .not("status", "is", null)
        .neq("status", "")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error(error);
        setLeads([]);
      } else {
        setLeads((data ?? []) as PipelineLead[]);
      }
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("pipeline-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          if (!row || row.event !== "abandoned_cart") return;

          setLeads((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((l) => l.id !== row.id);
            }
            const next = prev.filter((l) => l.id !== row.id);
            if (!row.status) return next;
            const updated: PipelineLead = {
              id: row.id,
              name: row.name ?? null,
              number: row.number ?? null,
              product: row.product ?? null,
              status: row.status,
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
  }, []);

  return (
    <AppLayout title="Pipeline (Leads)" showFilters={false}>
      <div className="-mx-4 md:-mx-6 px-4 md:px-6 overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.status);
            return (
              <div
                key={col.status}
                className="w-[280px] flex-shrink-0 rounded-xl bg-[#0a0a0a] border border-[#141414] flex flex-col max-h-[calc(100vh-180px)]"
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
                    colLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

function LeadCard({ lead }: { lead: PipelineLead }) {
  return (
    <div className="rounded-lg bg-[#101010] border border-[#1a1a1a] p-3 hover:border-[#2a2a2a] transition-colors">
      <div className="text-sm font-semibold text-white truncate">
        {lead.name || "—"}
      </div>
      <div className="text-xs text-[#888] font-mono mt-0.5 truncate">
        {lead.number || "—"}
      </div>
      {lead.product && (
        <div className="mt-2">
          <span
            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium truncate max-w-full"
            style={(() => {
              const c = getProductColor(lead.product);
              return { backgroundColor: c.bg, color: c.text };
            })()}
          >
            {lead.product}
          </span>
        </div>
      )}
    </div>
  );
}
