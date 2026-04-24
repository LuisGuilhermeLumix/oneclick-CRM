import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { format, parseISO } from "date-fns";
import { TrackingRow } from "@/hooks/useTracking";

function formatDate(dateStr: string) {
  try { return format(parseISO(dateStr), 'MMM dd, yyyy HH:mm') } catch { return dateStr }
}

function EventBadge({ event }: { event: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    InfoReceived:  { label: 'Info Received',  color: '#80d7f8', bg: 'rgba(128,215,248,0.10)' },
    Delivered:     { label: 'Delivered',      color: '#22c55e', bg: 'rgba(34,197,94,0.10)'   },
    FailedAttempt: { label: 'Failed Attempt', color: '#ef4444', bg: 'rgba(239,68,68,0.10)'   },
  }
  const style = map[event] ?? { label: event, color: '#888', bg: 'rgba(100,100,100,0.10)' }
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: style.color, backgroundColor: style.bg }}
    >
      {style.label}
    </span>
  )
}

interface TrackingTableProps {
  rows: TrackingRow[];
  totalPages: number;
  page: number;
  setPage: (updater: number | ((p: number) => number)) => void;
  eventFilter: string;
  setEventFilter: (v: string) => void;
  loading: boolean;
}

export function TrackingTable({
  rows,
  totalPages,
  page,
  setPage,
  eventFilter,
  setEventFilter,
  loading,
}: TrackingTableProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="surface-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-white">Todos os Tracking Codes</h2>
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="h-9 flex items-center gap-2 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] px-3.5 text-sm text-[#ccc] hover:bg-[#161616] transition-colors"
          >
            <span className="text-[#666] text-xs">Evento:</span>
            <span>{eventFilter === "Todos" ? "Todos os Eventos" : eventFilter}</span>
            <ChevronDown size={14} className="text-[#666]" />
          </button>
          {open && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] py-1 shadow-lg z-20">
              {(["Todos", "InfoReceived", "Delivered", "FailedAttempt"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setEventFilter(opt);
                    setOpen(false);
                    setPage(1);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-[#ccc] hover:bg-[#161616] transition-colors"
                >
                  {opt === "Todos" ? "Todos os Eventos" : opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0a0a0a]">
              {["DATA", "EMAIL", "PRODUTO", "EVENTO", "COURIER"].map((h) => (
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
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-[#0f0f0f]">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 rounded animate-pulse bg-white/[0.04]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <Inbox size={48} className="mx-auto text-[#333] mb-3" />
                  <div className="text-sm text-[#444]">Nenhum código encontrado</div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key} className="border-b border-[#0f0f0f] hover:bg-white/[0.015] transition-colors">
                  <td className="px-4 py-3.5 text-[#888] text-xs">
                    {formatDate(row.date)}
                  </td>
                  <td className="px-4 py-3.5 text-[#ddd] text-xs font-mono">
                    {row.email}
                  </td>
                  <td className="px-4 py-3.5 text-[#aaa] text-sm">
                    {row.product}
                  </td>
                  <td className="px-4 py-3.5">
                    <EventBadge event={row.event} />
                  </td>
                  <td className="px-4 py-3.5 text-[#666] text-xs uppercase tracking-wide">
                    {row.slug}
                  </td>
                </tr>
              ))
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
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox size={40} className="mx-auto text-[#333] mb-3" />
            <div className="text-sm text-[#444]">Nenhum código encontrado</div>
          </div>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <EventBadge event={row.event} />
                <span className="text-[11px] text-[#555] uppercase tracking-wide">{row.slug}</span>
              </div>
              <div className="text-xs text-[#888] font-mono truncate">{row.email}</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#666] truncate">{row.product}</span>
                <span className="text-[11px] text-[#555] whitespace-nowrap">{formatDate(row.date)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-end gap-3 mt-4 pt-3">
        <span className="text-xs text-[#555]">
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="h-8 w-8 flex items-center justify-center rounded-md bg-[#111] border border-[#1e1e1e] text-[#888] transition-colors hover:border-[#80d7f8] hover:text-[#80d7f8] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-md bg-[#111] border border-[#1e1e1e] text-[#888] transition-colors hover:border-[#80d7f8] hover:text-[#80d7f8] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
