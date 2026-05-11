export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

function toLocalDate(date: Date | string): Date {
  if (date instanceof Date) return date;
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (ymd) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  }
  return new Date(date);
}

export function formatDateShort(date: Date | string): string {
  return toLocalDate(date).toLocaleDateString("pt-BR", { month: "short", day: "2-digit" });
}

export function formatDateLong(date: Date | string): string {
  return toLocalDate(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
