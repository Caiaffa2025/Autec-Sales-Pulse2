import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
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
import { exportReportExcel, exportReportPDF, type ExportReportPayload } from '../utils/exporters';
import { formatCurrencyBRL, formatDateBR, formatDateTimeBR, formatPercent, safePercent } from '../utils/formatters';
import {
  computeActionSummary,
  computeCompetitorStats,
  computeLossSummary,
  computeSellerPerformance,
  filterLostOpportunities,
  filterOccurrences,
  filterOpportunities,
  isActionOverdue,
  isWithinDateRange,
} from '../utils/intelligence';
import { GlobalFilterBar, PageHeader } from '../components/UI';

type ReportKind = 'concorrentes' | 'perdas' | 'performance' | 'plano_acao' | 'executivo';

const REPORT_LABELS: Record<ReportKind, string> = {
  concorrentes: 'Relatório de Concorrentes',
  perdas: 'Relatório de Perdas Comerciais',
  performance: 'Relatório de Performance por Vendedor',
  plano_acao: 'Relatório do Plano de Ação',
  executivo: 'Relatório Executivo Consolidado',
};

export function ReportsPage({
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
}) {
  const [reportKind, setReportKind] = useState<ReportKind>('executivo');
  const [exportMsg, setExportMsg] = useState('');

  const filteredOpps = useMemo(() => filterOpportunities(opportunities, filters), [opportunities, filters]);
  const filteredOccs = useMemo(() => filterOccurrences(occurrences, filters), [occurrences, filters]);
  const filteredLosses = useMemo(() => filterLostOpportunities(lostOpportunities, filters), [lostOpportunities, filters]);
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
  const filteredActions = useMemo(
    () =>
      actions.filter((a) => {
        if (!isWithinDateRange(a.data_criacao, filters.dataInicio, filters.dataFim)) return false;
        if (filters.vendedorId && a.responsavel_id !== filters.vendedorId) return false;
        return true;
      }),
    [actions, filters]
  );

  const filtersSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.vendedorId) {
      const u = users.find((x) => x.id === filters.vendedorId);
      if (u) parts.push(`Vendedor: ${u.full_name}`);
    }
    if (filters.clienteId) {
      const c = clients.find((x) => x.id === filters.clienteId);
      if (c) parts.push(`Cliente: ${c.razao_social}`);
    }
    if (filters.produtoId) {
      const p = products.find((x) => x.id === filters.produtoId);
      if (p) parts.push(`Produto: ${p.nome_equipamento}`);
    }
    if (filters.situacao) parts.push(`Situação: ${filters.situacao}`);
    return parts.length > 0 ? parts.join(' | ') : 'Todos os registros do período';
  }, [filters, users, clients, products]);

  const payload: ExportReportPayload = useMemo(() => {
    const compStats = computeCompetitorStats(filteredOccs, []);
    const lossSum = computeLossSummary(filteredLosses);
    const sellerPerf = computeSellerPerformance(users, filteredOpps, filteredInts, filteredOccs, filteredLosses);
    const actionSum = computeActionSummary(filteredActions);

    if (reportKind === 'concorrentes') {
      return {
        reportTitle: REPORT_LABELS.concorrentes,
        periodStart: filters.dataInicio,
        periodEnd: filters.dataFim,
        filtersApplied: filtersSummary,
        recordCount: filteredOccs.length,
        fileNameBase: `autec_relatorio_concorrentes_${filters.dataInicio}_${filters.dataFim}`,
        kpis: [
          { label: 'Ocorrências', value: String(filteredOccs.length) },
          { label: 'Concorrentes Citados', value: String(compStats.length) },
          {
            label: 'Valor Disputado',
            value: formatCurrencyBRL(
              filteredOccs.reduce((a, o) => a + (o.valor_proposta_autec ?? 0), 0),
              'R$ 0,00'
            ),
          },
          { label: 'Mais Mencionado', value: compStats[0]?.concorrente_nome || '—' },
        ],
        sections: [
          {
            title: 'Ranking de Concorrentes',
            columns: ['Concorrente', 'Menções', 'Valor Disputado', 'Ganhas', 'Perdidas', 'Taxa Derrota'],
            rows: compStats.map((c) => [
              c.concorrente_nome,
              c.mencoes,
              formatCurrencyBRL(c.valorPotencial, 'R$ 0,00'),
              c.ganhas,
              c.perdidas,
              formatPercent(c.taxaDerrota),
            ]),
          },
          {
            title: 'Ocorrências Competitivas Detalhadas',
            columns: ['Data', 'Cliente', 'Vendedor', 'Produto Autec', 'Concorrente', 'Prop. Autec', 'Val. Concorrente', 'Resultado'],
            rows: filteredOccs.map((o) => [
              formatDateBR(o.data_ocorrencia),
              o.cliente_nome,
              o.vendedor_nome,
              o.produto_autec_nome,
              o.concorrente_nome,
              formatCurrencyBRL(o.valor_proposta_autec, 'Não informado'),
              formatCurrencyBRL(o.valor_concorrente, 'Não informado'),
              o.resultado_negociacao,
            ]),
          },
        ],
      };
    }

    if (reportKind === 'perdas') {
      return {
        reportTitle: REPORT_LABELS.perdas,
        periodStart: filters.dataInicio,
        periodEnd: filters.dataFim,
        filtersApplied: filtersSummary,
        recordCount: filteredLosses.length,
        fileNameBase: `autec_relatorio_perdas_${filters.dataInicio}_${filters.dataFim}`,
        kpis: [
          { label: 'Total Perdas', value: String(lossSum.totalCount) },
          { label: 'Valor Total Perdido', value: formatCurrencyBRL(lossSum.totalValue, 'R$ 0,00') },
          { label: 'Ticket Médio Perdido', value: formatCurrencyBRL(lossSum.avgValue, '—') },
          { label: 'Taxa de Recuperação', value: formatPercent(lossSum.recoveryRate) },
        ],
        sections: [
          {
            title: 'Perdas por Motivo Principal',
            columns: ['Motivo', 'Quantidade', 'Valor Estimado'],
            rows: lossSum.byReason.map((r) => [r.label, r.count, formatCurrencyBRL(r.value, 'R$ 0,00')]),
          },
          {
            title: 'Detalhamento de Oportunidades Perdidas',
            columns: ['ID', 'Data Enc.', 'Cliente', 'Vendedor', 'Motivo', 'Concorrente', 'Valor Est.', 'Status'],
            rows: filteredLosses.map((l) => [
              l.identificador,
              formatDateBR(l.data_encerramento),
              l.cliente_nome,
              l.vendedor_nome,
              l.motivo_principal_nome,
              l.concorrente_vencedor_nome || 'Não informado',
              formatCurrencyBRL(l.valor_estimado, 'Não informado'),
              l.status_perda,
            ]),
          },
        ],
      };
    }

    if (reportKind === 'performance') {
      const won = filteredOpps.filter((o) => o.status === 'ganha');
      const lost = filteredOpps.filter((o) => o.status === 'perdida');
      const totalWonVal = won.reduce((a, o) => a + (o.valor ?? 0), 0);
      return {
        reportTitle: REPORT_LABELS.performance,
        periodStart: filters.dataInicio,
        periodEnd: filters.dataFim,
        filtersApplied: filtersSummary,
        recordCount: filteredOpps.length,
        fileNameBase: `autec_relatorio_performance_${filters.dataInicio}_${filters.dataFim}`,
        kpis: [
          { label: 'Oportunidades', value: String(filteredOpps.length) },
          { label: 'Vendas Ganhas', value: formatCurrencyBRL(totalWonVal, 'R$ 0,00') },
          { label: 'Conversão Global', value: formatPercent(safePercent(won.length, won.length + lost.length)) },
          { label: 'Ticket Médio', value: formatCurrencyBRL(won.length > 0 ? totalWonVal / won.length : null, '—') },
        ],
        sections: [
          {
            title: 'Performance por Vendedor',
            columns: ['Vendedor', 'Equipe', 'Total', 'Ganhas', 'Perdidas', 'Conversão', 'Ticket Médio', 'Valor Ganho'],
            rows: sellerPerf.map((s) => [
              s.vendedor_nome,
              s.equipe,
              s.totalOportunidades,
              s.ganhas,
              s.perdidas,
              formatPercent(s.taxaConversao),
              formatCurrencyBRL(s.ticketMedio, '—'),
              formatCurrencyBRL(s.valorGanho, 'R$ 0,00'),
            ]),
          },
        ],
      };
    }

    if (reportKind === 'plano_acao') {
      return {
        reportTitle: REPORT_LABELS.plano_acao,
        periodStart: filters.dataInicio,
        periodEnd: filters.dataFim,
        filtersApplied: filtersSummary,
        recordCount: filteredActions.length,
        fileNameBase: `autec_relatorio_plano_acao_${filters.dataInicio}_${filters.dataFim}`,
        kpis: [
          { label: 'Ações Abertas', value: String(actionSum.openCount) },
          { label: 'Concluídas', value: String(actionSum.completedCount) },
          { label: 'Atrasadas', value: String(actionSum.overdueCount) },
          { label: 'Conclusão', value: formatPercent(actionSum.completionPct) },
        ],
        sections: [
          {
            title: 'Tarefas do Plano de Ação',
            columns: ['Título', 'Categoria', 'Responsável', 'Prazo', 'Prioridade', 'Status', 'Origem'],
            rows: filteredActions.map((a) => [
              a.titulo,
              a.categoria,
              a.responsavel_nome,
              `${formatDateBR(a.prazo_conclusao)}${isActionOverdue(a) ? ' (Atrasada)' : ''}`,
              a.prioridade,
              a.status,
              a.origem_label || a.origem_tipo,
            ]),
          },
        ],
      };
    }

    // Executivo consolidado
    const wonAll = filteredOpps.filter((o) => o.status === 'ganha');
    const lostAll = filteredOpps.filter((o) => o.status === 'perdida');
    const wonVal = wonAll.reduce((a, o) => a + (o.valor ?? 0), 0);
    return {
      reportTitle: REPORT_LABELS.executivo,
      periodStart: filters.dataInicio,
      periodEnd: filters.dataFim,
      filtersApplied: filtersSummary,
      recordCount: filteredOpps.length + filteredOccs.length + filteredLosses.length + filteredActions.length,
      fileNameBase: `autec_relatorio_executivo_${filters.dataInicio}_${filters.dataFim}`,
      kpis: [
        { label: 'Faturamento Ganho', value: formatCurrencyBRL(wonVal, 'R$ 0,00') },
        { label: 'Conversão', value: formatPercent(safePercent(wonAll.length, wonAll.length + lostAll.length)) },
        { label: 'Total Perdido', value: formatCurrencyBRL(lossSum.totalValue, 'R$ 0,00') },
        { label: 'Ações Pendentes / Atrasadas', value: `${actionSum.openCount} / ${actionSum.overdueCount}` },
      ],
      sections: [
        {
          title: 'Resumo de Performance por Vendedor',
          columns: ['Vendedor', 'Oportunidades', 'Ganhas', 'Perdidas', 'Conversão', 'Faturamento'],
          rows: sellerPerf.map((s) => [
            s.vendedor_nome,
            s.totalOportunidades,
            s.ganhas,
            s.perdidas,
            formatPercent(s.taxaConversao),
            formatCurrencyBRL(s.valorGanho, 'R$ 0,00'),
          ]),
        },
        {
          title: 'Principais Concorrentes no Período',
          columns: ['Concorrente', 'Menções', 'Valor Disputado', 'Perdas Autec'],
          rows: compStats.slice(0, 10).map((c) => [
            c.concorrente_nome,
            c.mencoes,
            formatCurrencyBRL(c.valorPotencial, 'R$ 0,00'),
            c.perdidas,
          ]),
        },
        {
          title: 'Principais Motivos de Perda',
          columns: ['Motivo', 'Quantidade', 'Valor Perdido'],
          rows: lossSum.byReason.slice(0, 10).map((r) => [
            r.label,
            r.count,
            formatCurrencyBRL(r.value, 'R$ 0,00'),
          ]),
        },
        {
          title: 'Plano de Ação — Pendências Críticas e Atrasadas',
          columns: ['Ação', 'Responsável', 'Prazo', 'Prioridade', 'Status'],
          rows: filteredActions
            .filter((a) => a.status !== 'Concluída' && a.status !== 'Cancelada')
            .map((a) => [a.titulo, a.responsavel_nome, formatDateBR(a.prazo_conclusao), a.prioridade, a.status]),
        },
      ],
    };
  }, [reportKind, filters, filtersSummary, filteredOpps, filteredOccs, filteredLosses, filteredInts, filteredActions, users]);

  async function handleExport(type: 'pdf' | 'excel') {
    if (type === 'pdf') {
      exportReportPDF(payload);
    } else {
      exportReportExcel(payload);
    }
    await api.logExport(payload.reportTitle, type.toUpperCase(), payload.recordCount).catch(() => {});
    setExportMsg(
      `${payload.reportTitle} exportado em ${type.toUpperCase()} às ${formatDateTimeBR(new Date().toISOString())}.`
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Relatórios Gerenciais"
        subtitle="Consolidação por período com rastreabilidade de filtros e exportação em PDF e Excel (.xlsx)"
        actions={
          <>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-medium rounded-lg whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('excel')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-[#1B2E5E] text-slate-700 text-xs font-medium rounded-lg whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
          </>
        }
      />

      {exportMsg ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <Download className="w-4 h-4 shrink-0" />
          <span>{exportMsg}</span>
        </div>
      ) : null}

      {/* Report selector */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {(Object.keys(REPORT_LABELS) as ReportKind[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setReportKind(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              reportKind === key ? 'bg-white text-[#1B2E5E] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {REPORT_LABELS[key]}
          </button>
        ))}
      </div>

      <GlobalFilterBar
        filters={filters}
        onChange={onFiltersChange}
        onReset={onResetFilters}
        users={users}
        clients={clients}
        products={products}
        showSellerFilter={user.role !== 'vendedor'}
      />

      {/* Preview Sheet */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-slate-500">Autec Equipamentos de Laboratório</div>
            <h2 className="text-lg font-bold text-[#1B2E5E]">{payload.reportTitle}</h2>
          </div>
          <div className="text-xs text-slate-600 space-y-0.5 md:text-right">
            <div>
              Período analisado: <span className="font-mono font-medium">{formatDateBR(filters.dataInicio)} a {formatDateBR(filters.dataFim)}</span>
            </div>
            <div>Data de geração: {formatDateTimeBR(new Date().toISOString())}</div>
            <div>Filtros: {filtersSummary}</div>
            <div>
              Registros considerados: <span className="font-mono font-semibold text-[#1B2E5E]">{payload.recordCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {payload.kpis.map((k) => (
            <div key={k.label} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[11px] text-slate-500">{k.label}</div>
              <div className="text-base font-bold text-[#1B2E5E] font-mono tabular-nums mt-0.5">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {payload.sections.map((sec) => (
            <div key={sec.title} className="space-y-2">
              <h3 className="text-sm font-semibold text-[#1B2E5E]">{sec.title}</h3>
              {sec.rows.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 border border-dashed border-slate-200 rounded-lg text-center">
                  Sem registros para esta seção no período e filtros selecionados.
                </p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        {sec.columns.map((col) => (
                          <th key={col} className="text-left px-3 py-2 font-semibold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sec.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
