import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Download,
  FileBarChart2,
  FileDown,
  Plus,
  Radar,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type {
  ActionPlan,
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
  formatDateBR,
  formatDateTimeBR,
  formatPercent,
  safePercent,
} from '../utils/formatters';
import {
  computeActionSummary,
  computeCompetitorStats,
  computeLossSummary,
  computeSellerPerformance,
  filterLostOpportunities,
  filterOccurrences,
  filterOpportunities,
  isWithinDateRange,
} from '../utils/intelligence';
import { DonutBreakdown, HorizontalBarChart } from '../components/Charts';
import { GlobalFilterBar, KpiCard, PageHeader } from '../components/UI';

export function DashboardPage({
  user,
  users,
  clients,
  products,
  opportunities,
  interactions,
  occurrences,
  lostOpportunities,
  actions,
  filters,
  onFiltersChange,
  onResetFilters,
  onNavigate,
  onOpenNewOpportunity,
}: {
  user: User;
  users: User[];
  clients: Client[];
  products: Product[];
  opportunities: Opportunity[];
  interactions: Interaction[];
  occurrences: CompetitiveOccurrence[];
  lostOpportunities: LostOpportunity[];
  actions: ActionPlan[];
  filters: GlobalFilters;
  onFiltersChange: (next: GlobalFilters) => void;
  onResetFilters: () => void;
  onNavigate: (path: string) => void;
  onOpenNewOpportunity: () => void;
}) {
  const [exportMsg, setExportMsg] = useState('');
  const filteredOpps = filterOpportunities(opportunities, filters);
  const filteredOccs = filterOccurrences(occurrences, filters);
  const filteredLosses = filterLostOpportunities(lostOpportunities, filters);
  const filteredInts = interactions.filter((i) => {
    if (!isWithinDateRange(i.data_interacao, filters.dataInicio, filters.dataFim)) return false;
    if (filters.vendedorId && i.vendedor_id !== filters.vendedorId) return false;
    if (filters.clienteId && i.cliente_id !== filters.clienteId) return false;
    if (filters.produtoId && i.produto_id !== filters.produtoId) return false;
    return true;
  });

  // Existing Autec Sales Pulse metrics
  const openOpps = filteredOpps.filter((o) =>
    ['aberta', 'proposta_enviada', 'em_negociacao'].includes(o.status)
  );
  const proposalsSent = filteredOpps.filter((o) => o.status === 'proposta_enviada');
  const wonOpps = filteredOpps.filter((o) => o.status === 'ganha');
  const lostOppsCount = filteredOpps.filter((o) => o.status === 'perdida').length;
  const faturamentoRealizado = wonOpps.reduce((acc, o) => acc + (o.valor ?? 0), 0);
  const pipelineValue = openOpps.reduce((acc, o) => acc + (o.valor ?? 0), 0);
  const encerradas = wonOpps.length + lostOppsCount;
  const taxaConversaoGeral = safePercent(wonOpps.length, encerradas);

  // Funnel distribution
  const funnelSlices = [
    {
      label: 'Abertas',
      value: filteredOpps.filter((o) => o.status === 'aberta').length,
      color: '#3B82F6',
    },
    {
      label: 'Propostas Enviadas',
      value: proposalsSent.length,
      color: '#8B5CF6',
    },
    {
      label: 'Em Negociação',
      value: filteredOpps.filter((o) => o.status === 'em_negociacao').length,
      color: '#F59E0B',
    },
    {
      label: 'Ganhas',
      value: wonOpps.length,
      color: '#10B981',
    },
    {
      label: 'Perdidas',
      value: lostOppsCount,
      color: '#EF4444',
    },
  ];

  // Top sellers by revenue
  const sellerPerf = computeSellerPerformance(users, filteredOpps, filteredInts, filteredOccs, filteredLosses);
  const topSellersBars = sellerPerf
    .filter((s) => s.valorGanho > 0)
    .slice(0, 6)
    .map((s) => ({
      label: s.vendedor_nome,
      value: s.valorGanho,
      secondaryLabel: `${s.ganhas} venda(s)`,
      color: '#1B2E5E',
    }));

  // 7 NEW INTELLIGENCE INDICATORS (Section 6)
  const compStats = computeCompetitorStats(filteredOccs, []);
  const topCompetitor = compStats[0] || null;

  const lossSummary = computeLossSummary(filteredLosses);
  const topLossReason = lossSummary.byReason[0] || null;

  const bestConvSeller =
    sellerPerf
      .filter((s) => s.encerradas >= 1 && s.taxaConversao !== null)
      .sort((a, b) => (b.taxaConversao || 0) - (a.taxaConversao || 0) || b.ganhas - a.ganhas)[0] || null;

  const actionSummary = computeActionSummary(actions);

  const recoverableCount = filteredLosses.filter(
    (l) => l.recuperavel === 'sim' && l.status_perda !== 'recuperada' && l.status_perda !== 'nao_recuperada'
  ).length;

  async function handleExportSnapshotPDF() {
    const filtersApplied = buildFiltersSummaryText(filters, users, clients, products);
    exportVisualSnapshotPDF({
      reportTitle: 'Dashboard Comercial',
      subtitle: 'Snapshot Visual Completo dos Indicadores Filtrados · Autec Equipamentos de Laboratório',
      generatedBy: user.full_name,
      periodStart: filters.dataInicio,
      periodEnd: filters.dataFim,
      filtersApplied,
      recordSummary: `${filteredOpps.length} oportunidade(s) · ${filteredInts.length} interação(ões) · ${filteredOccs.length} ocorrência(s) · ${filteredLosses.length} perda(s)`,
      fileNameBase: `autec_dashboard_snapshot_${filters.dataInicio}_${filters.dataFim}`,
      kpiGroups: [
        {
          title: 'Pulso Comercial & Funil Atual',
          badge: `${filteredOpps.length} oportunidade(s) · ${filteredInts.length} interação(ões)`,
          cards: [
            {
              label: 'Faturamento realizado',
              value: formatCurrencyBRL(faturamentoRealizado, 'R$ 0,00'),
              subtitle: `${wonOpps.length} negócio(s) ganho(s)`,
              tone: 'navy',
            },
            {
              label: 'Oportunidades abertas',
              value: String(openOpps.length),
              subtitle: `Pipeline: ${formatCurrencyBRL(pipelineValue, 'R$ 0,00')}`,
              tone: 'neutral',
            },
            {
              label: 'Propostas enviadas',
              value: String(proposalsSent.length),
              subtitle: `Interações no período: ${filteredInts.length}`,
              tone: 'neutral',
            },
            {
              label: 'Taxa de conversão',
              value: formatPercent(taxaConversaoGeral),
              subtitle:
                encerradas > 0 ? `${wonOpps.length} ganhas de ${encerradas} encerradas` : 'Sem encerradas no período',
              tone: taxaConversaoGeral !== null && taxaConversaoGeral >= 30 ? 'positive' : 'neutral',
            },
          ],
        },
        {
          title: 'Indicadores de Inteligência Comercial',
          badge: 'Consolidado dos quatro módulos',
          cards: [
            {
              label: 'Concorrente mais mencionado',
              value: topCompetitor ? topCompetitor.concorrente_nome : 'Sem registros',
              subtitle: topCompetitor
                ? `${topCompetitor.mencoes} menção(ões) · ${formatCompactBRL(topCompetitor.valorPotencial)}`
                : 'Registre ocorrências no Radar',
              tone: 'neutral',
            },
            {
              label: 'Principal motivo de perda',
              value: topLossReason ? topLossReason.label : 'Sem perdas',
              subtitle: topLossReason
                ? `${topLossReason.count} perda(s) · ${formatCompactBRL(topLossReason.value)}`
                : 'Nenhuma perda no período',
              tone: topLossReason ? 'warning' : 'neutral',
            },
            {
              label: 'Valor total de perdas',
              value: formatCurrencyBRL(lossSummary.totalValue, 'R$ 0,00'),
              subtitle: `${lossSummary.totalCount} oportunidade(s) perdida(s)`,
              tone: lossSummary.totalCount > 0 ? 'danger' : 'neutral',
            },
            {
              label: 'Vendedor maior conversão',
              value: bestConvSeller ? bestConvSeller.vendedor_nome : 'Sem encerradas',
              subtitle: bestConvSeller
                ? `${formatPercent(bestConvSeller.taxaConversao)} (${bestConvSeller.ganhas}/${bestConvSeller.encerradas})`
                : 'Aguardando encerrados',
              tone: bestConvSeller ? 'positive' : 'neutral',
            },
            {
              label: 'Ações pendentes',
              value: String(actionSummary.openCount),
              subtitle: `${actionSummary.criticalCount} crítica(s) · ${actionSummary.completedCount} concluída(s)`,
              tone: 'neutral',
            },
            {
              label: 'Ações atrasadas',
              value: String(actionSummary.overdueCount),
              subtitle: actionSummary.overdueCount > 0 ? 'Prazo vencido — atenção' : 'Nenhuma em atraso',
              tone: actionSummary.overdueCount > 0 ? 'danger' : 'positive',
            },
            {
              label: 'Oportunidades recuperáveis',
              value: String(recoverableCount),
              subtitle: `Recuperação: ${formatPercent(lossSummary.recoveryRate)}`,
              tone: recoverableCount > 0 ? 'warning' : 'neutral',
            },
            {
              label: 'Valor recuperado',
              value: formatCurrencyBRL(lossSummary.recoveredValue, 'R$ 0,00'),
              subtitle: `${lossSummary.recoveredCount} de ${lossSummary.eligibleCount} elegíveis`,
              tone: lossSummary.recoveredCount > 0 ? 'positive' : 'neutral',
            },
          ],
        },
      ],
      charts: [
        {
          type: 'breakdown',
          title: 'Distribuição do Funil',
          items: funnelSlices.map((s) => ({
            label: s.label,
            value: s.value,
            displayValue: String(s.value),
            color: s.color,
          })),
          emptyMessage: 'Nenhuma oportunidade registrada no período selecionado.',
        },
        {
          type: 'bars',
          title: 'Top Vendedores por Faturamento',
          items: topSellersBars.map((b) => ({
            label: b.label,
            value: b.value,
            displayValue: formatCompactBRL(b.value),
            secondary: b.secondaryLabel,
            color: b.color,
          })),
          emptyMessage: 'Sem vendas fechadas no período selecionado.',
        },
      ],
      sections: [
        {
          title: 'Resumo dos Módulos de Inteligência',
          columns: ['Módulo', 'Escopo Filtrado', 'Indicador Chave'],
          rows: [
            [
              'Radar de Concorrentes',
              `${filteredOccs.length} ocorrência(s)`,
              topCompetitor ? `Líder de menções: ${topCompetitor.concorrente_nome}` : 'Sem menções no período',
            ],
            [
              'Perdas Comerciais',
              `${filteredLosses.length} perda(s) · ${recoverableCount} recuperável(is)`,
              `Total perdido: ${formatCurrencyBRL(lossSummary.totalValue, 'R$ 0,00')}`,
            ],
            [
              'Performance Comercial',
              `${sellerPerf.length} vendedor(es) analisado(s)`,
              `Conversão geral: ${formatPercent(taxaConversaoGeral)}`,
            ],
            [
              'Plano de Ação',
              `${actionSummary.openCount} aberta(s) · ${actionSummary.overdueCount} atrasada(s)`,
              `${actionSummary.completedCount} concluída(s) (${formatPercent(actionSummary.completionPct)})`,
            ],
          ],
        },
        {
          title: 'Desempenho Consolidado por Vendedor (Filtros Atuais)',
          columns: ['Vendedor', 'Oport.', 'Ganhas', 'Perdidas', 'Conversão', 'Valor Ganho'],
          rows: sellerPerf.map((s) => [
            s.vendedor_nome,
            s.totalOportunidades,
            s.ganhas,
            s.perdidas,
            formatPercent(s.taxaConversao),
            formatCurrencyBRL(s.valorGanho, 'R$ 0,00'),
          ]),
        },
      ],
    });
    await api
      .logExport(
        'Snapshot Visual — Dashboard Comercial',
        'PDF',
        filteredOpps.length + filteredOccs.length + filteredLosses.length
      )
      .catch(() => {});
    setExportMsg(`Relatório PDF do Dashboard exportado às ${formatDateTimeBR(new Date().toISOString())}.`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Comercial"
        subtitle={`Visão consolidada do Autec Sales Pulse · ${formatDateBR(filters.dataInicio)} a ${formatDateBR(filters.dataFim)}`}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportSnapshotPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-[#1B2E5E] text-[#1B2E5E] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Exportar Relatório PDF</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewOpportunity}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Oportunidade</span>
            </button>
            {user.role !== 'vendedor' ? (
              <button
                type="button"
                onClick={() => onNavigate('/relatorios')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-[#1B2E5E] text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                <FileBarChart2 className="w-3.5 h-3.5" />
                <span>Relatórios</span>
              </button>
            ) : null}
          </>
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

      <GlobalFilterBar
        filters={filters}
        onChange={onFiltersChange}
        onReset={onResetFilters}
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
      />

      {/* Preserved Existing KPIs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1B2E5E]">Pulso Comercial & Funil Atual</h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {filteredOpps.length} oportunidade(s) · {filteredInts.length} interação(ões)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Faturamento realizado"
            value={formatCurrencyBRL(faturamentoRealizado, 'R$ 0,00')}
            subtitle={`${wonOpps.length} negócio(s) ganho(s)`}
            tone="navy"
          />
          <KpiCard
            label="Oportunidades abertas"
            value={openOpps.length}
            subtitle={`Pipeline: ${formatCurrencyBRL(pipelineValue, 'R$ 0,00')}`}
            tone="neutral"
          />
          <KpiCard
            label="Propostas enviadas"
            value={proposalsSent.length}
            subtitle={`Interações no período: ${filteredInts.length}`}
            tone="neutral"
          />
          <KpiCard
            label="Taxa de conversão"
            value={formatPercent(taxaConversaoGeral)}
            subtitle={encerradas > 0 ? `${wonOpps.length} ganhas de ${encerradas} encerradas` : 'Sem encerradas no período'}
            tone={taxaConversaoGeral !== null && taxaConversaoGeral >= 30 ? 'positive' : 'neutral'}
          />
        </div>
      </section>

      {/* Preserved Existing Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Distribuição do Funil</h3>
          <DonutBreakdown
            slices={funnelSlices}
            emptyMessage="Nenhuma oportunidade registrada no período. Cadastre uma oportunidade para acompanhar o funil."
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Top Vendedores por Faturamento</h3>
          <HorizontalBarChart
            data={topSellersBars}
            formatValue={(v) => formatCompactBRL(v)}
            emptyMessage="Sem vendas fechadas no período selecionado."
          />
        </div>
      </div>

      {/* Section 6: 7 NEW COMMERCIAL INTELLIGENCE INDICATORS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1B2E5E]">Indicadores de Inteligência Comercial</h2>
          <span className="text-xs text-slate-500">Consolidado dos quatro novos módulos</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Concorrente mais mencionado"
            value={topCompetitor ? topCompetitor.concorrente_nome : 'Sem registros'}
            subtitle={
              topCompetitor
                ? `${topCompetitor.mencoes} menção(ões) · ${formatCompactBRL(topCompetitor.valorPotencial)}`
                : 'Registre ocorrências no Radar'
            }
            onClick={() => onNavigate('/radar-concorrentes')}
          />
          <KpiCard
            label="Principal motivo de perda"
            value={topLossReason ? topLossReason.label : 'Sem perdas'}
            subtitle={
              topLossReason
                ? `${topLossReason.count} perda(s) · ${formatCompactBRL(topLossReason.value)}`
                : 'Nenhuma perda no período'
            }
            tone={topLossReason ? 'warning' : 'neutral'}
            onClick={() => onNavigate('/perdas-comerciais')}
          />
          <KpiCard
            label="Valor total de perdas"
            value={formatCurrencyBRL(lossSummary.totalValue, 'R$ 0,00')}
            subtitle={`${lossSummary.totalCount} oportunidade(s) perdida(s)`}
            tone={lossSummary.totalCount > 0 ? 'danger' : 'neutral'}
            onClick={() => onNavigate('/perdas-comerciais')}
          />
          <KpiCard
            label="Vendedor com maior conversão"
            value={bestConvSeller ? bestConvSeller.vendedor_nome : 'Sem encerradas'}
            subtitle={
              bestConvSeller
                ? `${formatPercent(bestConvSeller.taxaConversao)} (${bestConvSeller.ganhas}/${bestConvSeller.encerradas} encerradas)`
                : 'Aguardando negócios encerrados'
            }
            tone={bestConvSeller ? 'positive' : 'neutral'}
            onClick={() => onNavigate('/performance-comercial')}
          />
          <KpiCard
            label="Ações pendentes"
            value={actionSummary.openCount}
            subtitle={`${actionSummary.criticalCount} crítica(s) · ${actionSummary.completedCount} concluída(s)`}
            onClick={() => onNavigate('/plano-acao')}
          />
          <KpiCard
            label="Ações atrasadas"
            value={actionSummary.overdueCount}
            subtitle={actionSummary.overdueCount > 0 ? 'Prazo vencido — requer atenção' : 'Nenhuma ação em atraso'}
            tone={actionSummary.overdueCount > 0 ? 'danger' : 'positive'}
            onClick={() => onNavigate('/plano-acao')}
          />
          <KpiCard
            label="Oportunidades recuperáveis"
            value={recoverableCount}
            subtitle={`Taxa de recuperação: ${formatPercent(lossSummary.recoveryRate)}`}
            tone={recoverableCount > 0 ? 'warning' : 'neutral'}
            onClick={() => onNavigate('/perdas-comerciais')}
          />
          <KpiCard
            label="Valor recuperado"
            value={formatCurrencyBRL(lossSummary.recoveredValue, 'R$ 0,00')}
            subtitle={`${lossSummary.recoveredCount} de ${lossSummary.eligibleCount} elegíveis`}
            tone={lossSummary.recoveredCount > 0 ? 'positive' : 'neutral'}
            onClick={() => onNavigate('/perdas-comerciais')}
          />
        </div>
      </section>

      {/* Section 6: Shortcuts to the 4 New Modules */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#1B2E5E]">Acesso Rápido aos Módulos de Inteligência</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              path: '/radar-concorrentes',
              title: 'Radar de Concorrentes',
              desc: 'Concorrentes disputados, preços, prazos e pressão por produto.',
              icon: Radar,
              meta: `${filteredOccs.length} ocorrência(s)`,
            },
            {
              path: '/perdas-comerciais',
              title: 'Perdas Comerciais',
              desc: 'Diagnóstico de motivos de perda e fluxo de recuperação.',
              icon: TrendingDown,
              meta: `${filteredLosses.length} perda(s) · ${recoverableCount} recuperável(is)`,
            },
            {
              path: '/performance-comercial',
              title: 'Performance Comercial',
              desc: 'Conversão, ticket médio, comparativos e visão gerencial.',
              icon: TrendingUp,
              meta: `${sellerPerf.length} vendedor(es) analisado(s)`,
            },
            {
              path: '/plano-acao',
              title: 'Plano de Ação',
              desc: 'Kanban e acompanhamento de tarefas vinculadas a diagnósticos.',
              icon: CheckSquare,
              meta: `${actionSummary.openCount} aberta(s) · ${actionSummary.overdueCount} atrasada(s)`,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className="bg-white border border-slate-200 hover:border-[#1B2E5E] rounded-xl p-4 text-left transition-colors flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#1B2E5E] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1B2E5E] transition-colors" />
                  </div>
                  <div className="text-sm font-semibold text-[#1B2E5E]">{item.title}</div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
                <div className="text-[11px] font-medium text-slate-600 pt-2 border-t border-slate-100 font-mono tabular-nums">
                  {item.meta}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {actionSummary.overdueCount > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-900">
              <span className="font-semibold">Atenção operacional:</span> Existem {actionSummary.overdueCount} ação(ões) com prazo vencido e {actionSummary.upcomingCount} vencendo nos próximos 7 dias.
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/plano-acao')}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg shrink-0 whitespace-nowrap"
          >
            Abrir Plano de Ação
          </button>
        </div>
      ) : null}
    </div>
  );
}
