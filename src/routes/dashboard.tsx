import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp,
  Target,
  Receipt,
  DollarSign,
  Wallet,
  BadgeDollarSign,
  ShoppingCart,
  MessageCircle,
  Send,
} from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { RecoveryChart } from "@/components/RecoveryChart";
import { LeadsTable } from "@/components/LeadsTable";
import { CostsModal } from "@/components/CostsModal";
import { useMetrics } from "@/hooks/useMetrics";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lumix - One Click CRM" },
      { name: "description", content: "Métricas de recuperação de vendas em tempo real." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [costsOpen, setCostsOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { metrics: m, loading } = useMetrics();

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <MetricCard
            label="Carrinhos Abandonados"
            icon={ShoppingCart}
            loading={loading}
            value={formatNumber(m.carrinhosAbandonados)}
          />
          <MetricCard
            label="Disparos Feitos"
            icon={Send}
            loading={loading}
            value={formatNumber(m.disparosFeitos)}
          />
          <MetricCard
            label="Taxa de Resposta"
            icon={MessageCircle}
            variant="brand"
            loading={loading}
            value={formatPercent(m.taxaResposta, 1)}
          />
          <MetricCard
            label="Vendas Recuperadas"
            icon={TrendingUp}
            variant="success"
            loading={loading}
            value={formatNumber(m.vendasRecuperadas)}
          />
          <MetricCard
            label="Taxa de Conversão"
            icon={Target}
            variant="brand"
            loading={loading}
            value={formatPercent(m.taxaConversao, 1)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Ticket Médio"
            icon={Receipt}
            loading={loading}
            value={formatCurrency(m.ticketMedio)}
          />
          <MetricCard
            label="Valor Recuperado"
            icon={BadgeDollarSign}
            variant="success"
            loading={loading}
            value={formatCurrency(m.valorRecuperado)}
          />
          <MetricCard
            label="Comissão Lumix"
            icon={DollarSign}
            variant="brand2"
            loading={loading}
            value={formatCurrency(m.comissaoLumix)}
            subInfo="10% sobre o valor recuperado"
          />
          <MetricCard
            label="Faturamento Sob o Front"
            icon={Wallet}
            variant="brand2"
            loading={loading}
            value={formatPercent(m.faturamentoSobFrontPct, 1)}
            subInfo="Recuperado vs. faturamento total"
            editable
            onEdit={() => setCostsOpen(true)}
          />
        </div>

        <RecoveryChart />
        <LeadsTable />
      </div>

      <CostsModal
        key={reloadKey}
        open={costsOpen}
        onClose={() => setCostsOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </AppLayout>
  );
}
