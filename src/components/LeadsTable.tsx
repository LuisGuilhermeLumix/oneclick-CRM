import { useState } from "react";
import { ChevronLeft, ChevronRight, Inbox, Search } from "lucide-react";
import { useLeads, LeadRow } from "@/hooks/useLeads";
import { formatCurrency, formatDateLong } from "@/lib/format";

export function LeadsTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { rows: pageData, totalPages, loading } = useLeads(search, page);

  return (
    <div className="surface-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-white">Leads Recentes</h2>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]"
          />
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

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0a0a0a]">
              {["Data", "Nome", "Telefone", "Email", "Produto", "Canal", "Valor Recuperado"].map((h) => (
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
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#0f0f0f]">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 rounded animate-pulse bg-white/[0.04]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Inbox size={48} className="mx-auto text-[#333] mb-3" />
                  <div className="text-sm text-[#444]">Nenhum lead encontrado</div>
                </td>
              </tr>
            ) : (
              pageData.map((lead) => <LeadRowItem key={lead.id} lead={lead} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="flex md:hidden flex-col divide-y divide-[#0f0f0f]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-4 w-48 rounded animate-pulse bg-white/[0.04]" />
              <div className="h-3 w-32 rounded animate-pulse bg-white/[0.03]" />
              <div className="h-3 w-24 rounded animate-pulse bg-white/[0.03]" />
            </div>
          ))
        ) : pageData.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox size={40} className="mx-auto text-[#333] mb-3" />
            <div className="text-sm text-[#444]">Nenhum lead encontrado</div>
          </div>
        ) : (
          pageData.map((lead) => (
            <div key={lead.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-white truncate">{lead.name}</span>
                <ChannelBadge />
              </div>
              <div className="text-xs text-[#888] font-mono truncate">{lead.number}</div>
              <div className="text-xs text-[#888] truncate">{lead.email}</div>
              <div className="text-xs text-[#666]">{lead.product}</div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#555]">{formatDateLong(lead.date)}</span>
                <span className="text-[13px] font-semibold text-white">
                  {formatCurrency(lead.recoveredValue)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-end gap-3 mt-4 pt-3">
        <span className="text-xs text-[#555]">
          Página {page} de {totalPages}
        </span>
        <PageBtn
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft size={14} />
        </PageBtn>
        <PageBtn
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          <ChevronRight size={14} />
        </PageBtn>
      </div>
    </div>
  );
}

function LeadRowItem({ lead }: { lead: LeadRow }) {
  return (
    <tr className="border-b border-[#0f0f0f] hover:bg-white/[0.015] transition-colors">
      <td className="px-4 py-3.5 text-[#888] text-xs whitespace-nowrap">
        {formatDateLong(lead.date)}
      </td>
      <td className="px-4 py-3.5 text-[#ddd]">{lead.name}</td>
      <td className="px-4 py-3.5 text-[#aaa] font-mono text-xs">{lead.number}</td>
      <td className="px-4 py-3.5 text-[#ddd]">{lead.email}</td>
      <td className="px-4 py-3.5 text-[#aaa]">{lead.product}</td>
      <td className="px-4 py-3.5">
        <ChannelBadge />
      </td>
      <td className="px-4 py-3.5 text-white font-medium">
        {formatCurrency(lead.recoveredValue)}
      </td>
    </tr>
  );
}

export function ChannelBadge() {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: "rgba(34,197,94,0.10)", color: "#22c55e" }}
    >
      WPP
    </span>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
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
