import type {
  ActionPlan,
  CompetitiveOccurrence,
  GlobalFilters,
  Interaction,
  LostOpportunity,
  Opportunity,
  User,
} from '../types';
import { addDaysISO, diffDays, safePercent, todayISO } from './formatters';

export function isWithinDateRange(dateStr: string | null | undefined, start: string, end: string): boolean {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
}

export function getPreviousPeriodRange(start: string, end: string): { prevStart: string; prevEnd: string } | null {
  if (!start || !end) return null;
  const span = Math.max(1, diffDays(start, end) + 1);
  const prevEnd = addDaysISO(start, -1);
  const prevStart = addDaysISO(prevEnd, -(span - 1));
  return { prevStart, prevEnd };
}

export function filterOpportunities(list: Opportunity[], filters: GlobalFilters): Opportunity[] {
  return list.filter((o) => {
    const refDate = o.data_abertura || o.created_at;
    if (!isWithinDateRange(refDate, filters.dataInicio, filters.dataFim)) return false;
    if (filters.vendedorId && o.vendedor_id !== filters.vendedorId) return false;
    if (filters.clienteId && o.cliente_id !== filters.clienteId) return false;
    if (filters.produtoId && o.produto_id !== filters.produtoId) return false;
    if (filters.situacao && o.status !== filters.situacao) return false;
    return true;
  });
}

export function filterOccurrences(list: CompetitiveOccurrence[], filters: GlobalFilters): CompetitiveOccurrence[] {
  return list.filter((o) => {
    if (!isWithinDateRange(o.data_ocorrencia, filters.dataInicio, filters.dataFim)) return false;
    if (filters.vendedorId && o.vendedor_id !== filters.vendedorId) return false;
    if (filters.clienteId && o.cliente_id !== filters.clienteId) return false;
    if (filters.produtoId && o.produto_autec_id !== filters.produtoId) return false;
    if (filters.situacao && o.resultado_negociacao !== filters.situacao) return false;
    return true;
  });
}

export function filterLostOpportunities(list: LostOpportunity[], filters: GlobalFilters): LostOpportunity[] {
  return list.filter((l) => {
    if (!isWithinDateRange(l.data_encerramento, filters.dataInicio, filters.dataFim)) return false;
    if (filters.vendedorId && l.vendedor_id !== filters.vendedorId) return false;
    if (filters.clienteId && l.cliente_id !== filters.clienteId) return false;
    if (filters.produtoId && l.produto_id !== filters.produtoId) return false;
    if (filters.situacao && l.status_perda !== filters.situacao) return false;
    return true;
  });
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  if (!y || !m) return ym;
  return `${m}/${y}`;
}

export interface CompetitorStats {
  concorrente_id: string;
  concorrente_nome: string;
  mencoes: number;
  mencoesPeriodoAnterior: number;
  variacaoAbsoluta: number;
  valorPotencial: number;
  ganhas: number;
  perdidas: number;
  emAndamento: number;
  taxaDerrota: number | null;
}

export function computeCompetitorStats(
  current: CompetitiveOccurrence[],
  previous: CompetitiveOccurrence[]
): CompetitorStats[] {
  const prevCounts = new Map<string, number>();
  for (const p of previous) {
    prevCounts.set(p.concorrente_id, (prevCounts.get(p.concorrente_id) || 0) + 1);
  }

  const map = new Map<string, CompetitorStats>();
  for (const o of current) {
    const existing = map.get(o.concorrente_id) || {
      concorrente_id: o.concorrente_id,
      concorrente_nome: o.concorrente_nome,
      mencoes: 0,
      mencoesPeriodoAnterior: prevCounts.get(o.concorrente_id) || 0,
      variacaoAbsoluta: 0,
      valorPotencial: 0,
      ganhas: 0,
      perdidas: 0,
      emAndamento: 0,
      taxaDerrota: null,
    };
    existing.mencoes += 1;
    if (o.valor_proposta_autec !== null && o.valor_proposta_autec !== undefined) {
      existing.valorPotencial += Number(o.valor_proposta_autec);
    }
    if (o.resultado_negociacao === 'ganha') existing.ganhas += 1;
    else if (o.resultado_negociacao === 'perdida') existing.perdidas += 1;
    else if (o.resultado_negociacao === 'em_andamento') existing.emAndamento += 1;
    map.set(o.concorrente_id, existing);
  }

  return Array.from(map.values())
    .map((item) => {
      const encerradas = item.ganhas + item.perdidas;
      return {
        ...item,
        variacaoAbsoluta: item.mencoes - item.mencoesPeriodoAnterior,
        taxaDerrota: safePercent(item.perdidas, encerradas),
      };
    })
    .sort((a, b) => b.mencoes - a.mencoes || b.valorPotencial - a.valorPotencial);
}

export interface SellerPerformance {
  vendedor_id: string;
  vendedor_nome: string;
  equipe: string;
  totalOportunidades: number;
  ganhas: number;
  perdidas: number;
  emAndamento: number;
  encerradas: number;
  valorTotal: number;
  valorGanho: number;
  valorEmNegociacao: number;
  valorPerdido: number;
  taxaConversao: number | null;
  taxaPerda: number | null;
  ticketMedio: number | null;
  clientesAtendidos: number;
  principaisObjecoes: Array<{ label: string; count: number }>;
  concorrentesEncontrados: Array<{ label: string; count: number }>;
}

export function computeSellerPerformance(
  users: User[],
  opportunities: Opportunity[],
  interactions: Interaction[],
  occurrences: CompetitiveOccurrence[],
  lostOpportunities: LostOpportunity[]
): SellerPerformance[] {
  const userMap = new Map<string, User>();
  for (const u of users) userMap.set(u.id, u);

  const sellerIds = new Set<string>();
  for (const u of users) {
    if (u.role === 'vendedor' || opportunities.some((o) => o.vendedor_id === u.id)) {
      sellerIds.add(u.id);
    }
  }
  for (const o of opportunities) sellerIds.add(o.vendedor_id);

  const results: SellerPerformance[] = [];
  for (const sellerId of sellerIds) {
    const u = userMap.get(sellerId);
    const opps = opportunities.filter((o) => o.vendedor_id === sellerId && Boolean(o.status));
    const ints = interactions.filter((i) => i.vendedor_id === sellerId);
    const occs = occurrences.filter((c) => c.vendedor_id === sellerId);
    const losses = lostOpportunities.filter((l) => l.vendedor_id === sellerId);

    const ganhasList = opps.filter((o) => o.status === 'ganha');
    const perdidasList = opps.filter((o) => o.status === 'perdida');
    const andamentoList = opps.filter((o) =>
      ['aberta', 'proposta_enviada', 'em_negociacao'].includes(o.status)
    );
    const encerradas = ganhasList.length + perdidasList.length;

    const valorTotal = opps.reduce((acc, o) => acc + (o.valor ?? 0), 0);
    const valorGanho = ganhasList.reduce((acc, o) => acc + (o.valor ?? 0), 0);
    const valorEmNegociacao = andamentoList.reduce((acc, o) => acc + (o.valor ?? 0), 0);
    const valorPerdido = losses.reduce((acc, l) => acc + (l.valor_estimado ?? 0), 0);

    const clientSet = new Set<string>();
    opps.forEach((o) => clientSet.add((o.cliente_id || o.cliente_nome).toLowerCase()));
    ints.forEach((i) => clientSet.add((i.cliente_id || i.cliente_nome).toLowerCase()));

    const objCount = new Map<string, number>();
    ints.forEach((i) => {
      if (i.tipo_resistencia) objCount.set(i.tipo_resistencia, (objCount.get(i.tipo_resistencia) || 0) + 1);
    });
    losses.forEach((l) => {
      if (l.motivo_principal_nome)
        objCount.set(l.motivo_principal_nome, (objCount.get(l.motivo_principal_nome) || 0) + 1);
    });

    const compCount = new Map<string, number>();
    occs.forEach((c) => {
      compCount.set(c.concorrente_nome, (compCount.get(c.concorrente_nome) || 0) + 1);
    });
    ints.forEach((i) => {
      if (i.concorrente_citado)
        compCount.set(i.concorrente_citado, (compCount.get(i.concorrente_citado) || 0) + 1);
    });

    results.push({
      vendedor_id: sellerId,
      vendedor_nome: u?.full_name || opps[0]?.vendedor_nome || 'Vendedor',
      equipe: u?.equipe || 'Comercial Geral',
      totalOportunidades: opps.length,
      ganhas: ganhasList.length,
      perdidas: perdidasList.length,
      emAndamento: andamentoList.length,
      encerradas,
      valorTotal,
      valorGanho,
      valorEmNegociacao,
      valorPerdido,
      taxaConversao: safePercent(ganhasList.length, encerradas),
      taxaPerda: safePercent(perdidasList.length, encerradas),
      ticketMedio: ganhasList.length > 0 ? valorGanho / ganhasList.length : null,
      clientesAtendidos: clientSet.size,
      principaisObjecoes: Array.from(objCount.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
      concorrentesEncontrados: Array.from(compCount.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    });
  }

  return results.sort((a, b) => b.valorGanho - a.valorGanho || b.totalOportunidades - a.totalOportunidades);
}

export function computeLossSummary(losses: LostOpportunity[]) {
  // Never mix in-negotiation opportunities into losses
  const confirmedLosses = losses;
  const totalCount = confirmedLosses.length;
  const totalValue = confirmedLosses.reduce((acc, l) => acc + (l.valor_estimado ?? 0), 0);
  const avgValue = totalCount > 0 ? totalValue / totalCount : null;

  const eligibleRecovery = confirmedLosses.filter(
    (l) => l.recuperavel === 'sim' || l.status_perda === 'em_recuperacao' || l.status_perda === 'recuperada'
  );
  const recovered = confirmedLosses.filter((l) => l.status_perda === 'recuperada');
  const recoveredValue = recovered.reduce((acc, l) => acc + (l.valor_recuperado ?? l.valor_estimado ?? 0), 0);
  const recoveryRate = safePercent(recovered.length, eligibleRecovery.length);

  const byReason = countAndSum(confirmedLosses, (l) => l.motivo_principal_nome);
  const bySeller = countAndSum(confirmedLosses, (l) => l.vendedor_nome);
  const byProduct = countAndSum(confirmedLosses, (l) => l.produto_nome || 'Não especificado');
  const byCompetitor = countAndSum(
    confirmedLosses.filter((l) => Boolean(l.concorrente_vencedor_nome)),
    (l) => l.concorrente_vencedor_nome
  );

  return {
    totalCount,
    totalValue,
    avgValue,
    eligibleCount: eligibleRecovery.length,
    recoveredCount: recovered.length,
    recoveredValue,
    recoveryRate,
    byReason,
    bySeller,
    byProduct,
    byCompetitor,
  };
}

function countAndSum<T extends { valor_estimado?: number | null }>(
  items: T[],
  keyFn: (item: T) => string
): Array<{ label: string; count: number; value: number }> {
  const map = new Map<string, { label: string; count: number; value: number }>();
  for (const item of items) {
    const label = keyFn(item) || 'Não informado';
    const cur = map.get(label) || { label, count: 0, value: 0 };
    cur.count += 1;
    cur.value += item.valor_estimado ?? 0;
    map.set(label, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count || b.value - a.value);
}

export function isActionOverdue(action: ActionPlan): boolean {
  if (action.status === 'Concluída' || action.status === 'Cancelada') return false;
  return action.prazo_conclusao < todayISO();
}

export function computeActionSummary(actions: ActionPlan[]) {
  const today = todayISO();
  const next7 = addDaysISO(today, 7);
  const active = actions.filter((a) => a.status !== 'Cancelada');
  const open = actions.filter((a) => ['Não iniciada', 'Em andamento', 'Aguardando'].includes(a.status));
  const completed = actions.filter((a) => a.status === 'Concluída');
  const overdue = actions.filter((a) => isActionOverdue(a));
  const critical = open.filter((a) => a.prioridade === 'Crítica');
  const upcoming = open.filter((a) => a.prazo_conclusao >= today && a.prazo_conclusao <= next7);
  const completionPct = safePercent(completed.length, active.length);

  const byOwner = new Map<string, { label: string; abertas: number; concluidas: number; atrasadas: number }>();
  for (const a of active) {
    const cur = byOwner.get(a.responsavel_nome) || {
      label: a.responsavel_nome,
      abertas: 0,
      concluidas: 0,
      atrasadas: 0,
    };
    if (a.status === 'Concluída') cur.concluidas += 1;
    else cur.abertas += 1;
    if (isActionOverdue(a)) cur.atrasadas += 1;
    byOwner.set(a.responsavel_nome, cur);
  }

  const byCategory = new Map<string, number>();
  for (const a of active) {
    byCategory.set(a.categoria, (byCategory.get(a.categoria) || 0) + 1);
  }

  return {
    total: active.length,
    openCount: open.length,
    completedCount: completed.length,
    overdueCount: overdue.length,
    criticalCount: critical.length,
    upcomingCount: upcoming.length,
    upcoming,
    completionPct,
    byOwner: Array.from(byOwner.values()).sort((a, b) => b.abertas - a.abertas),
    byCategory: Array.from(byCategory.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  };
}
