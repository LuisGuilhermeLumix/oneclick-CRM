import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Package, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { TrackingChart } from "@/components/TrackingChart";
import { TrackingDistribution } from "@/components/TrackingDistribution";
import { TrackingTable } from "@/components/TrackingTable";
import { useTracking } from "@/hooks/useTracking";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/tracking")({
  head: () => ({
    meta: [
      { title: "Tracking Codes — Lumix Recovery" },
      { name: "description", content: "Acompanhamento de eventos de envio e entrega." },
    ],
  }),
  component: TrackingPage,
});

function TrackingPage() {
  const [eventFilter, setEventFilter] = useState("Todos");
  const [page, setPage] = useState(1);
  const { rows, summary, chartData, totalPages, loading } = useTracking(eventFilter, page);

  return (
    <AppLayout title="Tracking Codes">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Total Enviados"
            icon={Send}
            loading={loading}
            value={formatNumber(summary.total)}
          />
          <MetricCard
            label="Info Received"
            icon={Package}
            loading={loading}
            value={formatNumber(summary.infoReceived)}
          />
          <MetricCard
            label="Delivered"
            icon={CheckCircle}
            loading={loading}
            value={<span className="text-[#22c55e]">{formatNumber(summary.delivered)}</span>}
          />
          <MetricCard
            label="Failed Attempt"
            icon={XCircle}
            loading={loading}
            value={<span className="text-[#ef4444]">{formatNumber(summary.failed)}</span>}
          />
        </div>

        <TrackingDistribution summary={summary} />
        <TrackingChart data={chartData} loading={loading} />
        <TrackingTable
          rows={rows}
          totalPages={totalPages}
          page={page}
          setPage={setPage}
          eventFilter={eventFilter}
          setEventFilter={setEventFilter}
          loading={loading}
        />
      </div>
    </AppLayout>
  );
}
