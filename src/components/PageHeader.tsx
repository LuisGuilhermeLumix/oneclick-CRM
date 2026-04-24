import { Calendar, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useFilters } from "@/hooks/useFilters";

interface PageHeaderProps {
  title: string;
  showFilters?: boolean;
}

export function PageHeader({ title, showFilters = true }: PageHeaderProps) {
  const { dateFrom, dateTo, channel, activeRange, setDateFrom, setDateTo, setChannel, setRange } = useFilters();
  const [channelOpen, setChannelOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#141414] bg-black/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <h1 className="text-[15px] font-semibold text-white">{title}</h1>

        {showFilters && (
          <>
            {/* Filtros inline — desktop */}
            <div className="hidden md:flex items-center gap-2">
              <DateField label="De:" value={dateFrom} onChange={setDateFrom} />
              <DateField label="Até:" value={dateTo} onChange={setDateTo} />

              <div className="flex items-center gap-1 ml-1">
                {([7, 30, 90] as const).map((d) => {
                  const key = `${d}d` as const;
                  return (
                    <button
                      key={d}
                      onClick={() => setRange(d)}
                      className={[
                        "h-9 px-3 text-xs font-medium rounded-md border transition-colors duration-150",
                        activeRange === key
                          ? "bg-[rgba(128,215,248,0.12)] border-[#80d7f8] text-[#80d7f8]"
                          : "bg-[#111] border-[#222] text-[#777] hover:text-[#ccc] hover:border-[#2a2a2a]",
                      ].join(" ")}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <button
                  onClick={() => setChannelOpen((v) => !v)}
                  className="h-9 flex items-center gap-2 px-3.5 rounded-lg bg-[#111] border border-[#222] text-[#ccc] text-sm hover:border-[#2a2a2a] transition-colors"
                >
                  <span className="text-[#666] text-xs">Canal:</span>
                  <span>{channel}</span>
                  <ChevronDown size={14} className="text-[#666]" />
                </button>
                {channelOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] py-1 shadow-lg z-50">
                    {(["Todos", "SMS", "Email"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => { setChannel(c); setChannelOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-sm text-[#ccc] hover:bg-[#161616] transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Botão filtros — mobile */}
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex md:hidden items-center gap-1.5 h-8 px-3 rounded-lg bg-[#111] border border-[#222] text-[#aaa] text-xs"
            >
              <SlidersHorizontal size={13} />
              Filtros
              {filtersOpen
                ? <ChevronUp size={12} className="text-[#555]" />
                : <ChevronDown size={12} className="text-[#555]" />}
            </button>
          </>
        )}
      </div>

      {/* Painel de filtros mobile */}
      {showFilters && filtersOpen && (
        <div className="flex md:hidden flex-col gap-3 px-4 pb-4 border-t border-[#0f0f0f]">
          <div className="flex gap-2 pt-3">
            <DateField label="De:" value={dateFrom} onChange={setDateFrom} />
            <DateField label="Até:" value={dateTo} onChange={setDateTo} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {([7, 30, 90] as const).map((d) => {
              const key = `${d}d` as const;
              return (
                <button
                  key={d}
                  onClick={() => setRange(d)}
                  className={[
                    "h-8 px-3 text-xs font-medium rounded-md border transition-colors",
                    activeRange === key
                      ? "bg-[rgba(128,215,248,0.12)] border-[#80d7f8] text-[#80d7f8]"
                      : "bg-[#111] border-[#222] text-[#777]",
                  ].join(" ")}
                >
                  {key}
                </button>
              );
            })}
            <div className="relative">
              <button
                onClick={() => setChannelOpen((v) => !v)}
                className="h-8 flex items-center gap-2 px-3 rounded-lg bg-[#111] border border-[#222] text-[#ccc] text-xs"
              >
                <span className="text-[#666]">Canal:</span>
                <span>{channel}</span>
                <ChevronDown size={12} className="text-[#666]" />
              </button>
              {channelOpen && (
                <div className="absolute left-0 mt-1.5 w-32 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] py-1 shadow-lg z-50">
                  {(["Todos", "SMS", "Email"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => { setChannel(c); setChannelOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#ccc] hover:bg-[#161616]"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="h-9 flex items-center gap-2 px-3 rounded-lg bg-[#111] border border-[#222] text-sm">
      <span className="text-[#666] text-xs">{label}</span>
      <Calendar size={13} className="text-[#555]" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[#ccc] text-xs outline-none border-none w-[110px] [color-scheme:dark]"
      />
    </div>
  );
}
