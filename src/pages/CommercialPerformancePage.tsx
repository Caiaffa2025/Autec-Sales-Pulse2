import React, { useMemo, useState } from 'react';
import { Award, Download, FileDown, HelpCircle, TrendingUp } from 'lucide-react';
import type {
  ActionPrefill,
  Client,
  CompetitiveOccurrence,
  GlobalFilters,
  Interaction,
  LostOpportunity,
  Opportunity,
  Product,
  User,
} from '../types';
import { api } from '../utils/api';
import { buildFiltersSummaryText, exportVisualSnapshotPDF } from '../utils/exporters';
import {
  formatCompactBRL,
  formatCurrencyBRL,
  formatDateTimeBR,
  formatPercent,
  safePercent,
} from '../utils/formatters';
import {
  computeSellerPerformance,
  filterLostOpportunities,
  filterOccurrences,
  filterOpportunities,
  formatMonthLabel,
  getPreviousPeriodRange,
  isWithinDateRange,
  monthKey,
} from '../utils/intelligence';
import { HorizontalBarChart, LineChartMulti } from '../components/Charts';
import { EmptyState, GlobalFilterBar, KpiCard, PageHeader } from '../components/UI';

export function CommercialPerformancePage({
  user,
  users,
  clients,
  products,
  opportunities,
  interactions,
  occurrences,
  lostOpportunities,
  filters,
  onFiltersChange,
  onResetFilters,
  onCreateAction,
}: {
  user: User;
  users: User[];
  clients: Client[];
  products: Product[];
  opportunities: Opportunity[];
  interactions: Interaction[];
  occurrences: CompetitiveOccurrence[];
  lostOpportunities: LostOpportunity[];
  filters: GlobalFilters;
  onFiltersChange: (next: GlobalFilters) => void;
  onResetFilters: () => void;
  onCreateAction: (prefill: ActionPrefill) => void;
}) {
  const [tab, setTab] = useState<'ranking' | 'vendedores' | 'comparativos' | 'gerencial'>('ranking');
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [exportMsg, setExportMsg] = useState('');

  const filteredOpps = useMemo(() => {
    const base = filterOpportunities(opportunities, filters);
    if (!selectedTeam) return base;
    const teamUserIds = new Set(users.filter((u) => u.equipe === selectedTeam).map((u) => u.id));
    return base.filter((o) => teamUserIds.has(o.vendedor_id));
  }, [opportunities, filters, selectedTeam, users]);

  const filteredInts = useMemo(
    () =>
      interactions.filter((i) => {
        if (!isWithinDateRange(i.data_interacao, filters.dataInicio, filters.dataFim)) return false;
        if (filters.vendedorId && i.vendedor_id !== filters.vendedorId) return false;
        if (filters.clienteId && i.cliente_id !== filters.clienteId) return false;
        if (filters.produtoId && i.produto_id !== filters.produtoId) return false;
        return true;
      }),
    [interactions, filters]
  );

  const filteredOccs = useMemo(() => filterOccurrences(occurrences, filters), [occurrences, filters]);
  const filteredLosses = useMemo(() => filterLostOpportunities(lostOpportunities, filters), [lostOpportunities, filters]);

  // Previous period comparison
  const previousOpps = useMemo(() => {
    const range = getPreviousPeriodRange(filters.dataInicio, filters.dataFim);
    if (!range) return [];
    return opportunities.filter((o) => {
      if (!isWithinDateRange(o.data_abertura || o.created_at, range.prevStart, range.prevEnd)) return false;
      if (filters.vendedorId && o.vendedor_id !== filters.vendedorId) return false;
      if (filters.produtoId && o.produto_id !== filters.produtoId) return false;
      return true;
    });
  }, [opportunities, filters]);

  const sellerPerf = useMemo(
    () => computeSellerPerformance(users, filteredOpps, filteredInts, filteredOccs, filteredLosses),
    [users, filteredOpps, filteredInts, filteredOccs, filteredLosses]
  );

  // Totals (strictly ignoring undefined status, zero division guarded)
  const validOpps = filteredOpps.filter((o) => Boolean(o.status));
  const ganhas = validOpps.filter((o) => o.status === 'ganha');
  const perdidas = validOpps.filter((o) => o.status === 'perdida');
  const emAndamento = validOpps.filter((o) =>
    ['aberta', 'proposta_enviada', 'em_negociacao'].includes(o.status)
  );
  const encerradas = ganhas.length + perdidas.length;
  const valorGanho = ganhas.reduce((acc, o) => acc + (o.valor ?? 0), 0);
  const valorPipeline = emAndamento.reduce((acc, o) => acc + (o.valor ?? 0), 0);
  const taxaConversao = safePercent(ganhas.length, encerradas);
  const taxaPerda = safePercent(perdidas.length, encerradas);
  const ticketMedio = ganhas.length > 0 ? valorGanho / ganhas.length : null;

  const prevGanhas = previousOpps.filter((o) => o.status === 'ganha');
  const prevEncerradas = prevGanhas.length + previousOpps.filter((o) => o.status === 'perdida').length;
  const prevValorGanho = prevGanhas.reduce((acc, o) => acc + (o.valor ?? 0), 0);
  const prevConversao = safePercent(prevGanhas.length, prevEncerradas);

  // Monthly comparison series
  const monthlySeries = useMemo(() => {
    const targetOpps = selectedSellerId
      ? validOpps.filter((o) => o.vendedor_id === selectedSellerId)
      : validOpps;
    const monthsSet = new Set<string>();
    targetOpps.forEach((o) => monthsSet.add(monthKey(o.data_abertura || o.created_at)));
    const months = Array.from(monthsSet).sort();
    return {
      labels: months.map(formatMonthLabel),
      series: [
        {
          name: 'Oportunidades Ganhas',
          color: '#10B981',
          values: months.map((m) => targetOpps.filter((o) => monthKey(o.data_abertura) === m && o.status === 'ganha').length),
        },
        {
          name: 'Oportunidades Perdidas',
          color: '#EF4444',
          values: months.map((m) => targetOpps.filter((o) => monthKey(o.data_abertura) === m && o.status === 'perdida').length),
        },
      ],
    };
  }, [validOpps, selectedSellerId]);

  // Product performance
  const productStats = useMemo(() => {
    const map = new Map<
      string,
      { label: string; total: number; ganhas: number; perdidas: number; valorGanho: number; conversao: number | null }
    >();
    for (const o of validOpps) {
      const key = o.produto_nome || 'Sem produto vinculado';
      const cur = map.get(key) || { label: key, total: 0, ganhas: 0, perdidas: 0, valorGanho: 0, conversao: null };
      cur.total += 1;
      if (o.status === 'ganha') {
        cur.ganhas += 1;
        cur.valorGanho += o.valor ?? 0;
      } else if (o.status === 'perdida') {
        cur.perdidas += 1;
      }
      map.set(key, cur);
    }
    return Array.from(map.values())
      .map((p) => ({
        ...p,
        conversao: safePercent(p.ganhas, p.ganhas + p.perdidas),
      }))
      .sort((a, b) => b.total - a.total);
  }, [validOpps]);

  // Team performance
  const teams = useMemo(() => Array.from(new Set(users.map((u) => u.equipe).filter(Boolean))), [users]);
  const teamStats = useMemo(() => {
    return teams.map((eq) => {
      const members = sellerPerf.filter((s) => s.equipe === eq);
      const gan = members.reduce((a, m) => a + m.ganhas, 0);
      const enc = members.reduce((a, m) => a + m.encerradas, 0);
      const val = members.reduce((a, m) => a + m.valorGanho, 0);
      const tot = members.reduce((a, m) => a + m.totalOportunidades, 0);
      return {
        equipe: eq,
        membros: members.length,
        totalOportunidades: tot,
        ganhas: gan,
        encerradas: enc,
        valorGanho: val,
        conversao: safePercent(gan, enc),
      };
    });
  }, [teams, sellerPerf]);

  // Managerial insights (respecting minimum context & avoiding discriminatory single-metric ranking)
  const sellersWithSample = sellerPerf.filter((s) => s.encerradas >= 2);
  const bestConv = [...sellersWithSample].sort((a, b) => (b.taxaConversao || 0) - (a.taxaConversao || 0))[0] || null;
  const highestVolume = [...sellerPerf].filter((s) => s.totalOportunidades > 0).sort((a, b) => b.totalOportunidades - a.totalOportunidades)[0] || null;
  const highestLoss = [...sellersWithSample].filter((s) => s.perdidas > 0).sort((a, b) => (b.taxaPerda || 0) - (a.taxaPerda || 0))[0] || null;
  const supportCandidates = sellerPerf.filter(
    (s) => s.encerradas >= 2 && s.taxaPerda !== null && s.taxaPerda >= 50
  );

  async function handleExportSnapshotPDF() {
    const extras: string[] = [];
    if (selectedTeam) extras.push(`Equipe: ${selectedTeam}`);
    if (selectedSellerId) {
      const s = sellerPerf.find((x) => x.vendedor_id === selectedSellerId);
      if (s) extras.push(`Evolução mensal filtrada: ${s.vendedor_nome}`);
    }
    const filtersApplied = buildFiltersSummaryText(filters, users, clients, products, extras);

    const sections = [
      {
        title: 'Ranking & Indicadores por Vendedor',
        columns: [
          'Vendedor',
          'Equipe',
          'Clientes',
          'Oport.',
          'Ganhas',
          'Perdidas',
          'Andam.',
          'Conversão',
          'Ticket Médio',
          'Valor Ganho',
        ],
        rows: sellerPerf.map((s) => [
          s.vendedor_nome,
          s.equipe || '—',
          s.clientesAtendidos,
          s.totalOportunidades,
          s.ganhas,
          s.perdidas,
          s.emAndamento,
          s.encerradas > 0 ? `${formatPercent(s.taxaConversao)} (n=${s.encerradas})` : '—',
          formatCurrencyBRL(s.ticketMedio, '—'),
          formatCurrencyBRL(s.valorGanho, 'R$ 0,00'),
        ]),
      },
      {
        title: 'Visão Gerencial & Produtos',
        columns: ['Dimensão / Produto', 'Indicador', 'Detalhamento'],
        rows: [
          [
            'Melhor conversão (mín. 2 encerradas)',
            bestConv ? bestConv.vendedor_nome : 'Aguardando amostra mínima',
            bestConv ? `${formatPercent(bestConv.taxaConversao)} (${bestConv.ganhas}/${bestConv.encerradas})` : '—',
          ],
          [
            'Maior volume de oportunidades',
            highestVolume ? highestVolume.vendedor_nome : 'Sem oportunidades',
            highestVolume
              ? `${highestVolume.totalOportunidades} oport. (${formatCurrencyBRL(highestVolume.valorTotal, 'R$ 0,00')})`
              : '—',
          ],
          [
            'Maior índice de perdas (mín. 2 encerradas)',
            highestLoss ? highestLoss.vendedor_nome : 'Sem índice elevado',
            highestLoss ? `${formatPercent(highestLoss.taxaPerda)} (${highestLoss.perdidas} perda(s))` : '—',
          ],
          [
            'Sinalização de suporte (perda >= 50%)',
            supportCandidates.length > 0 ? `${supportCandidates.length} vendedor(es)` : 'Nenhum sinalizado',
            supportCandidates.map((s) => s.vendedor_nome).join(', ') || 'Operação equilibrada',
          ],
          ...productStats.map((p) => [
            p.label,
            formatPercent(p.conversao),
            `${p.ganhas} ganha(s) / ${p.perdidas} perda(s) · ${formatCurrencyBRL(p.valorGanho, 'R$ 0,00')}`,
          ]),
        ],
      },
    ];

    if (teamStats.length > 0) {
      sections.push({
        title: 'Desempenho por Equipe',
        columns: ['Equipe', 'Membros', 'Oport.', 'Ganhas', 'Encerradas', 'Conversão', 'Faturamento'],
        rows: teamStats.map((t) => [
          t.equipe,
          t.membros,
          t.totalOportunidades,
          t.ganhas,
          t.encerradas,
          formatPercent(t.conversao),
          formatCurrencyBRL(t.valorGanho, 'R$ 0,00'),
        ]),
      });
    }

    exportVisualSnapshotPDF({
      reportTitle: 'Performance Comercial',
      subtitle: 'Snapshot Visual Completo dos Indicadores Filtrados · Autec Equipamentos de Laboratório',
      generatedBy: user.full_name,
      periodStart: filters.dataInicio,
      periodEnd: filters.dataFim,
      filtersApplied,
      recordSummary: `${validOpps.length} oportunidade(s) válida(s) · ${sellerPerf.length} vendedor(es) · ${encerradas} negócio(s) encerrado(s)`,
      fileNameBase: `autec_performance_snapshot_${filters.dataInicio}_${filters.dataFim}`,
      kpiGroups: [
        {
          title: 'Indicadores Globais Filtrados',
          badge: `${ganhas.length} ganhas · ${perdidas.length} perdidas · ${emAndamento.length} em andamento`,
          cards: [
            {
              label: 'Valor das vendas ganhas',
              value: formatCurrencyBRL(valorGanho, 'R$ 0,00'),
              subtitle: `Período anterior: ${formatCurrencyBRL(prevValorGanho, 'R$ 0,00')}`,
              tone: 'navy',
            },
            {
              label: 'Taxa de conversão',
              value: formatPercent(taxaConversao),
              subtitle: `Anterior: ${formatPercent(prevConversao)} · ${ganhas.length}/${encerradas} encerradas`,
              tone: taxaConversao !== null && taxaConversao >= 30 ? 'positive' : 'neutral',
            },
            {
              label: 'Ticket médio (ganhas)',
              value: formatCurrencyBRL(ticketMedio, '—'),
              subtitle: ganhas.length > 0 ? `${ganhas.length} venda(s) ganha(s)` : 'Sem vendas ganhas',
              tone: 'neutral',
            },
            {
              label: 'Valor em negociação',
              value: formatCurrencyBRL(valorPipeline, 'R$ 0,00'),
              subtitle: `${emAndamento.length} aberta(s) · Perda: ${formatPercent(taxaPerda)}`,
              tone: 'neutral',
            },
          ],
        },
      ],
      charts: [
        {
          type: 'line',
          title: 'Evolução Mensal (Ganhas vs Perdidas)',
          labels: monthlySeries.labels,
          series: monthlySeries.series,
          emptyMessage: 'Sem movimentação mensal suficiente para o gráfico evolutivo.',
        },
        {
          type: 'bars',
          title: 'Desempenho por Produto Autec',
          items: productStats.map((p) => ({
            label: p.label,
            value: p.valorGanho,
            displayValue: formatCompactBRL(p.valorGanho),
            secondary: `${p.ganhas}/${p.ganhas + p.perdidas} (${formatPercent(p.conversao)})`,
            color: '#1B2E5E',
          })),
          emptyMessage: 'Sem produtos movimentados no período selecionado.',
        },
      ],
      sections,
    });

    await api
      .logExport('Snapshot Visual — Performance Comercial', 'PDF', validOpps.length)
      .catch(() => {});
    setExportMsg(`Relatório PDF de Performance Comercial exportado às ${formatDateTimeBR(new Date().toISOString())}.`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Performance Comercial"
        subtitle="Indicadores individuais e coletivos com conversão real, ticket médio, comparativos e leitura gerencial contextual"
        actions={
          <button
            type="button"
            onClick={handleExportSnapshotPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Exportar Relatório PDF</span>
          </button>
        }
      />

      {exportMsg ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 shrink-0" />
            <span>{exportMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportMsg('')}
            className="text-[11px] font-medium text-emerald-700 hover:underline shrink-0"
          >
            Fechar
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {[
          { id: 'ranking', label: 'Visão Geral & Ranking' },
          { id: 'vendedores', label: 'Indicadores por Vendedor' },
          { id: 'comparativos', label: 'Comparativos (Produto / Equipe)' },
          { id: 'gerencial', label: 'Visão Gerencial' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === t.id ? 'bg-white text-[#1B2E5E] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <GlobalFilterBar
        filters={filters}
        onChange={onFiltersChange}
        onReset={() => {
          setSelectedTeam('');
          onResetFilters();
        }}
        users={users}
        clients={clients}
        products={products}
        showSellerFilter={user.role !== 'vendedor'}
        situations={[
          { value: 'aberta', label: 'Aberta' },
          { value: 'proposta_enviada', label: 'Proposta Enviada' },
          { value: 'em_negociacao', label: 'Em Negociação' },
          { value: 'ganha', label: 'Ganha' },
          { value: 'perdida', label: 'Perdida' },
        ]}
        extraControls={
          teams.length > 0 && user.role !== 'vendedor' ? (
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Equipe</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
              >
                <option value="">Todas as equipes</option>
                {teams.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>
          ) : null
        }
      />

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Valor das vendas ganhas"
          value={formatCurrencyBRL(valorGanho, 'R$ 0,00')}
          subtitle={`Período anterior: ${formatCurrencyBRL(prevValorGanho, 'R$ 0,00')}`}
          tone="navy"
        />
        <KpiCard
          label="Taxa de conversão"
          value={formatPercent(taxaConversao)}
          subtitle={`Anterior: ${formatPercent(prevConversao)} · ${ganhas.length}/${encerradas} encerradas`}
          tone={taxaConversao !== null && taxaConversao >= 30 ? 'positive' : 'neutral'}
        />
        <KpiCard
          label="Ticket médio (ganhas)"
          value={formatCurrencyBRL(ticketMedio, '—')}
          subtitle={ganhas.length > 0 ? `${ganhas.length} venda(s) ganha(s)` : 'Sem vendas ganhas no período'}
        />
        <KpiCard
          label="Valor em negociação"
          value={formatCurrencyBRL(valorPipeline, 'R$ 0,00')}
          subtitle={`${emAndamento.length} aberta(s) · Perda: ${formatPercent(taxaPerda)}`}
        />
      </div>

      {validOpps.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-5 h-5" />}
          title="Nenhuma oportunidade registrada no período"
          description="Cadastre oportunidades no módulo Oportunidades e Cadastros para acompanhar conversão, ticket médio, evolução mensal e comparativos por vendedor e produto."
        />
      ) : (
        <>
          {tab === 'ranking' ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#1B2E5E] shrink-0 mt-0.5" />
                <span>
                  Avaliação contextual: a classificação abaixo considera conjuntamente volume de oportunidades, negócios encerrados, taxa de conversão e valor ganho, evitando conclusões com amostra insuficiente.
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold">Vendedor / Equipe</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Oportunidades</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Ganhas</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Perdidas</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Em Andamento</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Conversão</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Ticket Médio</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Valor Ganho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sellerPerf.map((s) => (
                        <tr key={s.vendedor_id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-[#1B2E5E]">{s.vendedor_nome}</div>
                            <div className="text-[11px] text-slate-500">
                              {s.equipe} · {s.clientesAtendidos} cliente(s) atendido(s)
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">{s.totalOportunidades}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                            {s.ganhas}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-red-700">{s.perdidas}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">{s.emAndamento}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                            {s.encerradas > 0 ? (
                              <span>
                                {formatPercent(s.taxaConversao)}{' '}
                                <span className="text-[11px] text-slate-400">(n={s.encerradas})</span>
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                            {formatCurrencyBRL(s.ticketMedio, '—')}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                            {formatCurrencyBRL(s.valorGanho, 'R$ 0,00')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#1B2E5E]">Evolução Mensal (Ganhas vs Perdidas)</h3>
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(e.target.value)}
                    className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Toda a operação visível</option>
                    {sellerPerf.map((s) => (
                      <option key={s.vendedor_id} value={s.vendedor_id}>
                        {s.vendedor_nome}
                      </option>
                    ))}
                  </select>
                </div>
                <LineChartMulti labels={monthlySeries.labels} series={monthlySeries.series} />
              </div>
            </div>
          ) : null}

          {tab === 'vendedores' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sellerPerf.map((s) => (
                <div key={s.vendedor_id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-[#1B2E5E]">{s.vendedor_nome}</h3>
                      <p className="text-xs text-slate-500">
                        {s.equipe} · {s.clientesAtendidos} cliente(s) atendido(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onCreateAction({
                          titulo: `Acompanhamento comercial — ${s.vendedor_nome}`,
                          problema_identificado: `Conversão atual ${formatPercent(s.taxaConversao)} (${s.ganhas} ganhas / ${s.perdidas} perdidas).`,
                          origem_tipo: 'desempenho',
                          origem_id: s.vendedor_id,
                          origem_label: `Vendedor: ${s.vendedor_nome}`,
                          categoria: 'Treinamento',
                        })
                      }
                      className="text-xs font-medium text-[#1B2E5E] hover:underline shrink-0"
                    >
                      Criar Ação
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500">Registradas</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">{s.totalOportunidades}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Ganhas / Perdidas</div>
                      <div className="font-mono font-bold text-sm">
                        <span className="text-emerald-700">{s.ganhas}</span> /{' '}
                        <span className="text-red-700">{s.perdidas}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Em Andamento</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">{s.emAndamento}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Valor Total</div>
                      <div className="font-mono font-semibold text-slate-900">{formatCompactBRL(s.valorTotal)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Vendas Ganhas</div>
                      <div className="font-mono font-semibold text-emerald-700">{formatCompactBRL(s.valorGanho)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Potencial Aberto</div>
                      <div className="font-mono font-semibold text-[#1B2E5E]">
                        {formatCompactBRL(s.valorEmNegociacao)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Conversão</div>
                      <div className="font-mono font-bold text-[#1B2E5E]">{formatPercent(s.taxaConversao)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Taxa de Perda</div>
                      <div className="font-mono font-semibold text-red-700">{formatPercent(s.taxaPerda)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Ticket Médio</div>
                      <div className="font-mono font-semibold text-slate-900">
                        {formatCurrencyBRL(s.ticketMedio, '—')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <div className="font-semibold text-slate-700 mb-1">Principais objeções</div>
                      {s.principaisObjecoes.length === 0 ? (
                        <div className="text-slate-400">Sem objeções registradas</div>
                      ) : (
                        <ul className="space-y-0.5 text-slate-600">
                          {s.principaisObjecoes.map((o) => (
                            <li key={o.label}>
                              {o.label} ({o.count})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700 mb-1">Concorrentes mais encontrados</div>
                      {s.concorrentesEncontrados.length === 0 ? (
                        <div className="text-slate-400">Sem menções registradas</div>
                      ) : (
                        <ul className="space-y-0.5 text-slate-600">
                          {s.concorrentesEncontrados.map((c) => (
                            <li key={c.label}>
                              {c.label} ({c.count})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === 'comparativos' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Desempenho por Produto Autec</h3>
                <HorizontalBarChart
                  data={productStats.map((p) => ({
                    label: p.label,
                    value: p.valorGanho,
                    secondaryLabel: `${p.ganhas}/${p.ganhas + p.perdidas} (${formatPercent(p.conversao)})`,
                  }))}
                  formatValue={(v) => formatCompactBRL(v)}
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Desempenho por Equipe</h3>
                {teamStats.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhuma equipe cadastrada nos perfis de usuário.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold">Equipe</th>
                          <th className="text-right px-3 py-2 font-semibold">Oport.</th>
                          <th className="text-right px-3 py-2 font-semibold">Ganhas</th>
                          <th className="text-right px-3 py-2 font-semibold">Conversão</th>
                          <th className="text-right px-3 py-2 font-semibold">Faturamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teamStats.map((t) => (
                          <tr key={t.equipe}>
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {t.equipe} <span className="text-slate-400">({t.membros})</span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono">{t.totalOportunidades}</td>
                            <td className="px-3 py-2 text-right font-mono text-emerald-700">{t.ganhas}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatPercent(t.conversao)}</td>
                            <td className="px-3 py-2 text-right font-mono font-semibold">
                              {formatCurrencyBRL(t.valorGanho, 'R$ 0,00')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {tab === 'gerencial' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1B2E5E]">
                  <Award className="w-4 h-4" />
                  <span>Destaques & Sinais de Suporte Comercial</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <div className="text-slate-500">Melhor conversão (mín. 2 encerradas)</div>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {bestConv
                        ? `${bestConv.vendedor_nome} — ${formatPercent(bestConv.taxaConversao)} (${bestConv.ganhas}/${bestConv.encerradas})`
                        : 'Aguardando amostra mínima de 2 negócios encerrados por vendedor'}
                    </div>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <div className="text-slate-500">Maior volume de oportunidades geradas</div>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {highestVolume
                        ? `${highestVolume.vendedor_nome} — ${highestVolume.totalOportunidades} oportunidade(s) (${formatCurrencyBRL(highestVolume.valorTotal, 'R$ 0,00')})`
                        : 'Sem oportunidades no período'}
                    </div>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                    <div>
                      <div className="text-slate-500">Maior índice de perdas (mín. 2 encerradas)</div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        {highestLoss
                          ? `${highestLoss.vendedor_nome} — ${formatPercent(highestLoss.taxaPerda)} (${highestLoss.perdidas} perda(s))`
                          : 'Nenhum vendedor com índice elevado de perda no período'}
                      </div>
                    </div>
                    {highestLoss ? (
                      <button
                        type="button"
                        onClick={() =>
                          onCreateAction({
                            titulo: `Suporte em fechamento — ${highestLoss.vendedor_nome}`,
                            problema_identificado: `Taxa de perda de ${formatPercent(highestLoss.taxaPerda)} em ${highestLoss.encerradas} encerradas.`,
                            origem_tipo: 'desempenho',
                            origem_id: highestLoss.vendedor_id,
                            origem_label: `Desempenho: ${highestLoss.vendedor_nome}`,
                            categoria: 'Treinamento',
                          })
                        }
                        className="px-2.5 py-1 border border-slate-200 hover:border-[#1B2E5E] text-[#1B2E5E] rounded-md font-medium shrink-0"
                      >
                        Criar Ação
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[#1B2E5E]">
                  Produtos: Conversão vs Dificuldade Comercial
                </h3>
                <div className="space-y-2.5">
                  {productStats.map((p) => (
                    <div key={p.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs">
                      <div>
                        <div className="font-medium text-slate-900">{p.label}</div>
                        <div className="text-slate-500">
                          Conversão: {formatPercent(p.conversao)} · {p.ganhas} ganha(s) / {p.perdidas} perda(s)
                        </div>
                      </div>
                      {p.perdidas > p.ganhas ? (
                        <button
                          type="button"
                          onClick={() =>
                            onCreateAction({
                              titulo: `Revisar estratégia comercial: ${p.label}`,
                              problema_identificado: `Produto com ${p.perdidas} perda(s) frente a ${p.ganhas} ganhas.`,
                              origem_tipo: 'produto',
                              origem_label: `Produto: ${p.label}`,
                              categoria: 'Produto',
                            })
                          }
                          className="text-[#1B2E5E] font-medium hover:underline shrink-0"
                        >
                          Criar Ação
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-medium shrink-0">Saudável</span>
                      )}
                    </div>
                  ))}
                </div>
                {supportCandidates.length > 0 ? (
                  <div className="pt-2 border-t border-slate-100 text-xs text-amber-800">
                    Sinalização de suporte: {supportCandidates.map((s) => s.vendedor_nome).join(', ')} apresentam taxa de perda ≥ 50% com amostra ≥ 2 encerradas.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
