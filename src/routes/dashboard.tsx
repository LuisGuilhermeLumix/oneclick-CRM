import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp,
  Target,
  Receipt,
  Wallet,
  BadgeDollarSign,
  Users,
  MessageCircle,
  Send,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { MetricCard, BreakdownItem } from "@/components/MetricCard";
import { RecoveryChart } from "@/components/RecoveryChart";
import { LeadsTable } from "@/components/LeadsTable";
import { useMetrics } from "@/hooks/useMetrics";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { EVENT_COLORS, EVENT_LABELS } from "@/lib/events";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lumix - One Click CRM" },
      { name: "description", content: "Métricas de recuperação de vendas em tempo real." },
    ],
  }),
  component: DashboardPage,
});

const WPP_COLOR = "#22c55e";
const FRONT_COLOR = "#9ca3af";

function DashboardPage() {
  const { metrics: m, loading } = useMetrics();

  const leadsBreakdown: BreakdownItem[] = [
    { label: EVENT_LABELS.abandoned_cart, color: EVENT_COLORS.abandoned_cart, value: formatNumber(m.leadsBreakdown.abandoned_cart) },
    { label: EVENT_LABELS.generated_pix, color: EVENT_COLORS.generated_pix, value: formatNumber(m.leadsBreakdown.generated_pix) },
    { label: EVENT_LABELS.refused_card, color: EVENT_COLORS.refused_card, value: formatNumber(m.leadsBreakdown.refused_card) },
  ];

  const respostaBreakdown: BreakdownItem[] = [
    { label: EVENT_LABELS.abandoned_cart, color: EVENT_COLORS.abandoned_cart, value: formatPercent(m.taxaRespostaBreakdown.abandoned_cart, 1) },
    { label: EVENT_LABELS.generated_pix, color: EVENT_COLORS.generated_pix, value: formatPercent(m.taxaRespostaBreakdown.generated_pix, 1) },
    { label: EVENT_LABELS.refused_card, color: EVENT_COLORS.refused_card, value: formatPercent(m.taxaRespostaBreakdown.refused_card, 1) },
  ];

  const vendasBreakdown: BreakdownItem[] = [
    { label: "WPP", color: WPP_COLOR, value: formatNumber(m.vendasRecuperadasChannel.wpp) },
    { label: "Front", color: FRONT_COLOR, value: formatNumber(m.vendasRecuperadasChannel.front) },
  ];

  const conversaoBreakdown: BreakdownItem[] = [
    { label: EVENT_LABELS.abandoned_cart, color: EVENT_COLORS.abandoned_cart, value: formatPercent(m.taxaConversaoBreakdown.abandoned_cart, 1) },
    { label: EVENT_LABELS.generated_pix, color: EVENT_COLORS.generated_pix, value: formatPercent(m.taxaConversaoBreakdown.generated_pix, 1) },
    { label: EVENT_LABELS.refused_card, color: EVENT_COLORS.refused_card, value: formatPercent(m.taxaConversaoBreakdown.refused_card, 1) },
  ];

  const ticketBreakdown: BreakdownItem[] = [
    { label: "WPP", color: WPP_COLOR, value: formatCurrency(m.ticketMedioChannel.wpp) },
    { label: "Front", color: FRONT_COLOR, value: formatCurrency(m.ticketMedioChannel.front) },
  ];

  const valorBreakdown: BreakdownItem[] = [
    { label: "WPP", color: WPP_COLOR, value: formatCurrency(m.valorRecuperadoChannel.wpp) },
    { label: "Front", color: FRONT_COLOR, value: formatCurrency(m.valorRecuperadoChannel.front) },
  ];

  const totalRecuperado = m.valorRecuperadoChannel.wpp + m.valorRecuperadoChannel.front;
  const wppPct = totalRecuperado ? (m.valorRecuperadoChannel.wpp / totalRecuperado) * 100 : 0;
  const frontPct = totalRecuperado ? (m.valorRecuperadoChannel.front / totalRecuperado) * 100 : 0;

  const frontBreakdown: BreakdownItem[] = [
    {
      label: "WPP",
      color: WPP_COLOR,
      value: `${formatCurrency(m.valorRecuperadoChannel.wpp)} (${formatPercent(wppPct, 0)})`,
    },
    {
      label: "Front",
      color: FRONT_COLOR,
      value: `${formatCurrency(m.valorRecuperadoChannel.front)} (${formatPercent(frontPct, 0)})`,
    },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <MetricCard
            label="Leads"
            icon={Users}
            loading={loading}
            value={formatNumber(m.leadsTotal)}
            breakdown={leadsBreakdown}
          />
          <MetricCard
            label="Disparos Feitos"
            icon={Send}
            loading={loading}
            value={formatNumber(m.leadsTotal)}
            breakdown={leadsBreakdown}
          />
          <MetricCard
            label="Taxa de Resposta"
            icon={MessageCircle}
            variant="brand"
            loading={loading}
            value={formatPercent(m.taxaRespostaTotal, 1)}
            breakdown={respostaBreakdown}
          />
          <MetricCard
            label="Vendas Recuperadas"
            icon={TrendingUp}
            variant="success"
            loading={loading}
            value={formatNumber(m.vendasRecuperadasTotal)}
            breakdown={vendasBreakdown}
          />
          <MetricCard
            label="Taxa de Conversão"
            icon={Target}
            variant="brand"
            loading={loading}
            value={formatPercent(m.taxaConversaoTotal, 1)}
            breakdown={conversaoBreakdown}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <MetricCard
            label="Ticket Médio"
            icon={Receipt}
            loading={loading}
            value={formatCurrency(m.ticketMedioTotal)}
            breakdown={ticketBreakdown}
          />
          <MetricCard
            label="Valor Recuperado"
            icon={BadgeDollarSign}
            variant="success"
            loading={loading}
            value={formatCurrency(m.valorRecuperadoTotal)}
            breakdown={valorBreakdown}
          />
          <MetricCard
            label="Faturamento Sob o Front"
            icon={Wallet}
            variant="brand2"
            loading={loading}
            value={formatPercent(m.faturamentoFrontPct, 1)}
            subInfo="WPP vs. faturamento total"
            breakdown={frontBreakdown}
          />
        </div>

        <RecoveryChart />
        <LeadsTable />
      </div>
    </AppLayout>
  );
}
