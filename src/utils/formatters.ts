const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

export function formatCurrencyBRL(
  value: number | null | undefined,
  emptyLabel = 'Não informado'
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return emptyLabel;
  }
  return brlFormatter.format(Number(value));
}

export function formatCompactBRL(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}k`;
  }
  return brlFormatter.format(value);
}

export function formatNumberBR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return numberFormatter.format(Number(value));
}

export function formatPercent(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(decimals).replace('.', ',')}%`;
}

export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Não informado';
  const clean = dateStr.trim();
  const ymdMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  }
  const d = new Date(clean);
  if (Number.isNaN(d.getTime())) return clean;
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatDateTimeBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfMonthISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function addDaysISO(baseIso: string, days: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + days));
  return dt.toISOString().slice(0, 10);
}

export function diffDays(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso.slice(0, 10)}T00:00:00Z`).getTime();
  const b = new Date(`${toIso.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function parseNullableNumber(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isNaN(raw) ? null : raw;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const normalized = trimmed.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

export function safePercent(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor Comercial',
  vendedor: 'Vendedor',
};

export const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  aberta: 'Aberta',
  proposta_enviada: 'Proposta Enviada',
  em_negociacao: 'Em Negociação',
  ganha: 'Ganha',
  perdida: 'Perdida',
  cancelada: 'Cancelada',
};

export const LOSS_STATUS_LABELS: Record<string, string> = {
  confirmada: 'Perda Confirmada',
  em_recuperacao: 'Em Recuperação',
  recuperada: 'Recuperada',
  nao_recuperada: 'Não Recuperada',
};
