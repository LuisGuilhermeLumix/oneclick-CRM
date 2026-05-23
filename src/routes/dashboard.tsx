import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp,
  Target,
  Receipt,
  Wallet,
  BadgeDollarSign,
  Users,
  MessageCircle,
  DollarSign,
  Banknote,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { MetricCard, BreakdownItem } from "@/components/MetricCard";
import { RecoveryChart } from "@/components/RecoveryChart";
import { LeadsTable } from "@/components/LeadsTable";
import { useMetrics } from "@/hooks/useMetrics";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { EVENT_COLORS, EVENT_LABELS, ORIGIN_COLORS, ORIGIN_LABELS } from "@/lib/events";

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
  const { metrics: m, loading } = useMetrics();

  const eventBreakdown = (
    values: { abandoned_cart: number; generated_pix: number; refused_card: number },
    fmt: (v: number) => string,
  ): BreakdownItem[] => [
    { label: EVENT_LABELS.abandoned_cart, color: EVENT_COLORS.abandoned_cart, value: fmt(values.abandoned_cart) },
    { label: EVENT_LABELS.generated_pix,  color: EVENT_COLORS.generated_pix,  value: fmt(values.generated_pix) },
    { label: EVENT_LABELS.refused_card,   color: EVENT_COLORS.refused_card,   value: fmt(values.refused_card) },
  ];

  const originBreakdown = (
    values: { AC: number; GP: number; RC: number },
    fmt: (v: number) => string,
  ): BreakdownItem[] => [
    { label: ORIGIN_LABELS.AC, color: ORIGIN_COLORS.AC, value: fmt(values.AC) },
    { label: ORIGIN_LABELS.GP, color: ORIGIN_COLORS.GP, value: fmt(values.GP) },
    { label: ORIGIN_LABELS.RC, color: ORIGIN_COLORS.RC, value: fmt(values.RC) },
  ];

  const valorWpp = m.valorRecuperado.total;
  const moneyAndPct = (money: number, pct: number) =>
    `${formatCurrency(money)} (${formatPercent(pct, 0)})`;

  const fatFrontBreakdown: BreakdownItem[] = [
    {
      label: ORIGIN_LABELS.AC,
      color: ORIGIN_COLORS.AC,
      value: moneyAndPct(m.valorRecuperado.breakdown.AC, m.faturamentoFrontBreakdownPct.AC),
    },
    {
      label: ORIGIN_LABELS.GP,
      color: ORIGIN_COLORS.GP,
      value: moneyAndPct(m.valorRecuperado.breakdown.GP, m.faturamentoFrontBreakdownPct.GP),
    },
    {
      label: ORIGIN_LABELS.RC,
      color: ORIGIN_COLORS.RC,
      value: moneyAndPct(m.valorRecuperado.breakdown.RC, m.faturamentoFrontBreakdownPct.RC),
    },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 auto-rows-fr">
          <MetricCard
            label="Leads"
            icon={Users}
            loading={loading}
            value={formatNumber(m.leadsTotal)}
            breakdown={eventBreakdown(m.leadsBreakdown, formatNumber)}
          />
          <MetricCard
            label="Taxa de Resposta"
            icon={MessageCircle}
            variant="brand"
            loading={loading}
            value={formatPercent(m.taxaResposta.total, 1)}
            breakdown={eventBreakdown(m.taxaResposta.breakdown, (v) => formatPercent(v, 1))}
          />
          <MetricCard
            label="Vendas Recuperadas"
            icon={TrendingUp}
            variant="success"
            loading={loading}
            value={formatNumber(m.vendasWpp.total)}
            breakdown={originBreakdown(m.vendasWpp.breakdown, formatNumber)}
          />
          <MetricCard
            label="Taxa de Conversão"
            icon={Target}
            variant="brand"
            loading={loading}
            value={formatPercent(m.taxaConversao.total, 1)}
            breakdown={eventBreakdown(m.taxaConversao.breakdown, (v) => formatPercent(v, 1))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 auto-rows-fr">
          <MetricCard
            label="Ticket Médio"
            icon={Receipt}
            loading={loading}
            value={formatCurrency(m.ticketMedio.total)}
            breakdown={originBreakdown(m.ticketMedio.breakdown, formatCurrency)}
          />
          <MetricCard
            label="Valor Recuperado"
            icon={BadgeDollarSign}
            variant="success"
            loading={loading}
            value={formatCurrency(valorWpp)}
            breakdown={originBreakdown(m.valorRecuperado.breakdown, formatCurrency)}
          />
          <MetricCard
            label="Faturamento Sob o Front"
            icon={Wallet}
            variant="brand2"
            loading={loading}
            value={formatPercent(m.faturamentoFrontPct, 1)}
            subInfo="WPP recuperado vs. total order_paid"
            breakdown={fatFrontBreakdown}
          />
          <MetricCard
            label="Faturamento Total (Front)"
            icon={Banknote}
            variant="brand"
            loading={loading}
            value={formatCurrency(m.faturamentoFront)}
            subInfo="order_paid sem utm_source WPP"
          />
          <MetricCard
            label="Comissão Lumix"
            icon={DollarSign}
            variant="brand2"
            loading={loading}
            value={formatCurrency(m.comissaoLumix)}
            subInfo="20% sobre o valor recuperado WPP"
          />
        </div>

        <RecoveryChart />
        <LeadsTable />
      </div>
    </AppLayout>
  );
}
