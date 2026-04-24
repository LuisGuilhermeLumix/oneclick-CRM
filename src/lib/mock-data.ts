// Mock data for the dashboard. Replace with real Supabase queries when backend is ready.

export type Channel = "SMS" | "Email";
export type LeadStatus = "Recuperado" | "Disparado" | "Pendente";
export type TrackingEvent = "InfoReceived" | "Delivered" | "FailedAttempt";

export interface Lead {
  id: string;
  date: string;
  email: string;
  product: string;
  channel: Channel;
  value: number;
  status: LeadStatus;
}

export interface TimeseriesPoint {
  date: string;
  sms: number;
  email: number;
}

export interface TrackingCode {
  id: number;
  date: string;
  name: string;
  number: string;
  product: string;
  event: TrackingEvent;
}

export const dashboardMetrics = {
  disparosFeitos: { total: 18420, sms: 11200, email: 7220 },
  vendasRecuperadas: { total: 2147, sms: 1284, email: 863 },
  taxaConversao: { total: 11.66, sms: 11.46, email: 11.95 },
  ticketMedio: { total: 89.42, sms: 84.1, email: 96.55 },
  comissaoLumix: 38420.55,
  faturamentoSobFront: 154280.12,
};

export const timeseriesData: TimeseriesPoint[] = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const base = 30 + Math.sin(i / 3) * 12;
  return {
    date: d.toISOString(),
    sms: Math.round(base + Math.random() * 25 + 20),
    email: Math.round(base + Math.random() * 18 + 10),
  };
});

const products = [
  "BurnPro Capsules",
  "VitaBoost Complex",
  "SlimFit Drops",
  "CollagenGlow",
  "OmegaPure 3000",
  "KetoFire Plus",
];

const emails = [
  "sarah.miller@gmail.com",
  "j.thompson@outlook.com",
  "amanda.k@yahoo.com",
  "michael.b@gmail.com",
  "jennifer.lopez@hotmail.com",
  "david.cohen@gmail.com",
  "rachel.green@outlook.com",
  "tom.harris@gmail.com",
  "lisa.wong@yahoo.com",
  "kevin.murphy@gmail.com",
  "natalie.brown@gmail.com",
  "chris.evans@outlook.com",
];

const statuses: LeadStatus[] = ["Recuperado", "Disparado", "Pendente"];

export const leads: Lead[] = Array.from({ length: 48 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(i / 2));
  d.setHours(8 + (i % 12), (i * 7) % 60);
  return {
    id: `ld_${1000 + i}`,
    date: d.toISOString(),
    email: emails[i % emails.length],
    product: products[i % products.length],
    channel: i % 2 === 0 ? "SMS" : "Email",
    value: Math.round((45 + Math.random() * 180) * 100) / 100,
    status: statuses[i % 3],
  };
});

export const trackingMetrics = {
  totalSent: 24580,
  infoReceived: 11108,
  delivered: 10942,
  failed: 2530,
};

export const trackingDistribution = [
  { name: "InfoReceived", value: 45.2, color: "#80d7f8" },
  { name: "Delivered", value: 44.5, color: "#22c55e" },
  { name: "FailedAttempt", value: 10.3, color: "#ef4444" },
];

const names = [
  "Sarah Miller",
  "James Thompson",
  "Amanda Kim",
  "Michael Brown",
  "Jennifer Lopez",
  "David Cohen",
  "Rachel Green",
  "Tom Harris",
  "Lisa Wong",
  "Kevin Murphy",
];

const events: TrackingEvent[] = ["InfoReceived", "Delivered", "FailedAttempt"];

export const trackingCodes: TrackingCode[] = Array.from({ length: 60 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(i / 3));
  return {
    id: i + 1,
    date: d.toISOString(),
    name: names[i % names.length],
    number: `+1 (${200 + (i % 700)}) ${String(100 + i).padStart(3, "0")}-${String(1000 + i * 7).slice(-4)}`,
    product: products[i % products.length],
    event: events[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2],
  };
});
