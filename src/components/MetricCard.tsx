import { LucideIcon, Pencil } from "lucide-react";
import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  subInfo?: ReactNode;
  icon?: LucideIcon;
  loading?: boolean;
  variant?: "default" | "brand" | "brand2";
  editable?: boolean;
  onEdit?: () => void;
}

export function MetricCard({
  label,
  value,
  subInfo,
  icon: Icon,
  loading,
  variant = "default",
  editable,
  onEdit,
}: MetricCardProps) {
  const valueClass =
    variant === "brand"
      ? "text-[#80d7f8]"
      : variant === "brand2"
        ? "text-[#e65ff5]"
        : "text-white";

  const borderClass =
    variant === "brand"
      ? "border-[rgba(128,215,248,0.2)] hover:border-[rgba(128,215,248,0.35)]"
      : variant === "brand2"
        ? "border-[rgba(230,95,245,0.2)] hover:border-[rgba(230,95,245,0.35)]"
        : "border-[#1e1e1e] hover:border-[rgba(128,215,248,0.2)]";

  const bgStyle =
    variant === "brand2"
      ? { background: "linear-gradient(135deg, #101010 0%, rgba(230,95,245,0.04) 100%)" }
      : variant === "brand"
        ? { background: "linear-gradient(135deg, #101010 0%, rgba(128,215,248,0.04) 100%)" }
        : { backgroundColor: "#101010" };

  return (
    <div
      className={`group relative rounded-xl border px-[22px] py-5 transition-all duration-150 hover:-translate-y-px ${borderClass}`}
      style={{ ...bgStyle, boxShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#777]">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-[#333]" />}
          {editable && (
            <button
              onClick={onEdit}
              className="text-[#444] hover:text-[#80d7f8] transition-colors"
              aria-label="Editar"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <>
          <div className="h-8 w-32 rounded animate-pulse bg-white/[0.04]" />
          <div className="h-3.5 w-40 rounded animate-pulse bg-white/[0.04] mt-3" />
        </>
      ) : (
        <>
          <div
            className={`text-[1.6rem] md:text-[2.2rem] font-bold leading-[1.1] tracking-[-0.03em] ${valueClass}`}
          >
            {value}
          </div>
          {subInfo && <div className="mt-2 text-xs text-[#555]">{subInfo}</div>}
        </>
      )}
    </div>
  );
}
