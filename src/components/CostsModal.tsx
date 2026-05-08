import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface CostsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function CostsModal({ open, onClose, onSaved }: CostsModalProps) {
  const [faturamento, setFaturamento] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("crm_config")
      .select("total_revenue_usd")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFaturamento(String(data.total_revenue_usd ?? ""));
        }
      });
  }, [open]);

  async function handleSave() {
    setSaving(true);
    try {
      await supabase
        .from("crm_config")
        .update({
          total_revenue_usd: parseFloat(faturamento) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[440px] max-w-full rounded-2xl bg-[#0f0f0f] border border-[#2a2a2a] p-8"
      >
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-bold text-white">Configuração de Faturamento</h3>
          <button
            onClick={onClose}
            className="text-[#444] hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-[13px] text-[#555] mb-5">
          Defina o faturamento total usado no cálculo do Faturamento Sob o Front
        </p>
        <div className="border-t border-[#1a1a1a] mb-5" />

        <div className="space-y-4">
          <Field label="Faturamento Total (R$)" value={faturamento} onChange={setFaturamento} />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 h-11 w-full rounded-[10px] bg-[#80d7f8] text-black font-bold transition-all duration-150 hover:bg-[#a8e8ff] disabled:opacity-70"
        >
          {saving ? "Salvando..." : "Salvar Configuração"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#888] mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] px-3.5 text-sm text-white placeholder-[#444] focus:border-[#80d7f8] focus:[box-shadow:0_0_0_3px_rgba(128,215,248,0.10)] transition-all"
      />
    </div>
  );
}
