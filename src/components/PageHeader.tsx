import { Calendar, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useFilters } from "@/hooks/useFilters";
import { useProducts } from "@/hooks/useProducts";

interface PageHeaderProps {
  title: string;
  showFilters?: boolean;
}

const QUICK_RANGES = [
  { key: 'hoje',  label: 'Hoje'     },
  { key: 'ontem', label: 'Ontem'    },
  { key: '7d',    label: '7 dias'   },
  { key: 'mes',   label: 'Este mês' },
] as const;

export function PageHeader({ title, showFilters = true }: PageHeaderProps) {
  const {
    dateFrom,
    dateTo,
    product,
    activeRange,
    setProduct,
    setRange,
    applyCustom,
  } = useFilters();
  const { products } = useProducts();

  const [productOpen, setProductOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(dateFrom);
  const [customTo, setCustomTo] = useState(dateTo);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function handleApplyCustom() {
    applyCustom(customFrom, customTo);
    setCustomOpen(false);
  }

  const filterContent = (
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
            activeRange === 'custom'
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
          <div className="absolute right-0 mt-1.5 w-[280px] rounded-xl bg-[#0f0f0f] border border-[#1e1e1e] p-4 shadow-xl z-50">
            <p className="text-[11px] text-[#555] uppercase tracking-wide mb-3">Período personalizado</p>
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

      <div className="relative">
        <button
          onClick={() => setProductOpen((v) => !v)}
          className="h-9 flex items-center gap-2 px-3.5 rounded-lg bg-[#111] border border-[#222] text-[#ccc] text-sm hover:border-[#2a2a2a] transition-colors"
        >
          <span className="text-[#666] text-xs">Produto:</span>
          <span className="text-xs max-w-[140px] truncate">{product}</span>
          <ChevronDown size={12} className="text-[#666]" />
        </button>
        {productOpen && (
          <div className="absolute right-0 mt-1.5 w-56 max-h-72 overflow-y-auto rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] py-1 shadow-lg z-50">
            <button
              key="__all__"
              onClick={() => {
                setProduct("Todos");
                setProductOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-[#ccc] hover:bg-[#161616] transition-colors"
            >
              Todos
            </button>
            {products.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setProduct(p);
                  setProductOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-[#ccc] hover:bg-[#161616] transition-colors truncate"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-[#141414] bg-black/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <h1 className="text-[15px] font-semibold text-white">{title}</h1>

        {showFilters && (
          <>
            <div className="hidden md:flex items-center gap-2">
              {filterContent}
            </div>

            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex md:hidden items-center gap-1.5 h-8 px-3 rounded-lg bg-[#111] border border-[#222] text-[#aaa] text-xs"
            >
              <SlidersHorizontal size={13} />
              Filtros
            </button>
          </>
        )}
      </div>

      {showFilters && filtersOpen && (
        <div className="flex md:hidden flex-col gap-3 px-4 pb-4 border-t border-[#0f0f0f] pt-3">
          {filterContent}
        </div>
      )}
    </header>
  );
}
