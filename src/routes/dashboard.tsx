import { createFileRoute } from "@tanstack/react-router";
import { Send, TrendingUp, Target, Receipt, DollarSign, Wallet, ShoppingCart, BadgeDollarSign } from "lucide-react";
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
      { title: "Dashboard — Lumix Recovery" },
      { name: "description", content: "Métricas de recuperação de vendas em tempo real." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [costsOpen, setCostsOpen] = useState(false);
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
            subInfo="Leads únicos no período"
          />
          <MetricCard
            label="Disparos Feitos"
            icon={Send}
            loading={loading}
            value={formatNumber(m.disparosFeitos.total)}
            subInfo={`SMS: ${formatNumber(m.disparosFeitos.sms)} | Email: ${formatNumber(m.disparosFeitos.email)}`}
          />
          <MetricCard
            label="Vendas Recuperadas"
            icon={TrendingUp}
            variant="brand"
            loading={loading}
            value={formatNumber(m.vendasRecuperadas.total)}
            subInfo={`SMS: ${formatNumber(m.vendasRecuperadas.sms)} | Email: ${formatNumber(m.vendasRecuperadas.email)}`}
          />
          <MetricCard
            label="Taxa de Conversão"
            icon={Target}
            loading={loading}
            value={formatPercent(m.taxaConversao.total, 1)}
            subInfo={`SMS: ${formatPercent(m.taxaConversao.sms, 1)} | Email: ${formatPercent(m.taxaConversao.email, 1)}`}
          />
          <MetricCard
            label="Ticket Médio"
            icon={Receipt}
            loading={loading}
            value={formatCurrency(m.ticketMedio.total)}
            subInfo={`SMS: ${formatCurrency(m.ticketMedio.sms)} | Email: ${formatCurrency(m.ticketMedio.email)}`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricCard
            label="Valor Recuperado"
            icon={BadgeDollarSign}
            variant="brand"
            loading={loading}
            value={formatCurrency(m.receitaRecuperada.total)}
            subInfo={`SMS: ${formatCurrency(m.receitaRecuperada.sms)} | Email: ${formatCurrency(m.receitaRecuperada.email)}`}
          />
          <MetricCard
            label="Comissão Lumix"
            icon={DollarSign}
            variant="brand2"
            loading={loading}
            value={formatCurrency(m.comissaoLumix)}
            subInfo="13% sobre receita recuperada no período"
          />
          <MetricCard
            label="Faturamento Sob o Front"
            icon={Wallet}
            loading={loading}
            value={formatPercent(m.faturamentoSobFrontPct, 2)}
            subInfo="Recuperado vs. faturamento do front orgânico"
            editable
            onEdit={() => setCostsOpen(true)}
          />
        </div>

        <RecoveryChart />
        <LeadsTable />
      </div>

      <CostsModal open={costsOpen} onClose={() => setCostsOpen(false)} />
    </AppLayout>
  );
}
