import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Building2, Plus, Radar, ShieldAlert, UserPlus } from 'lucide-react';
import type {
  ActionPrefill,
  Client,
  CompetitiveOccurrence,
  Competitor,
  GlobalFilters,
  NegotiationResult,
  Product,
  User,
} from '../types';
import { api } from '../utils/api';
import { formatCompactBRL, formatCurrencyBRL, formatDateBR, formatPercent, parseNullableNumber, todayISO } from '../utils/formatters';
import {
  computeCompetitorStats,
  filterOccurrences,
  formatMonthLabel,
  getPreviousPeriodRange,
  isWithinDateRange,
  monthKey,
} from '../utils/intelligence';
import { HorizontalBarChart, LineChartMulti } from '../components/Charts';
import { EmptyState, GlobalFilterBar, KpiCard, Modal, PageHeader, ProductSelectOptions } from '../components/UI';

const RESULT_LABELS: Record<NegotiationResult, string> = {
  ganha: 'Ganha pela Autec',
  perdida: 'Perdida para Concorrente',
  em_andamento: 'Em Andamento',
  cancelada: 'Cancelada',
};

export function CompetitorRadarPage({
  user,
  users,
  clients,
  products,
  competitors,
  occurrences,
  filters,
  onFiltersChange,
  onResetFilters,
  onRefresh,
  onOpenNewClient,
  onCreateAction,
}: {
  user: User;
  users: User[];
  clients: Client[];
  products: Product[];
  competitors: Competitor[];
  occurrences: CompetitiveOccurrence[];
  filters: GlobalFilters;
  onFiltersChange: (next: GlobalFilters) => void;
  onResetFilters: () => void;
  onRefresh: () => Promise<void>;
  onOpenNewClient: () => void;
  onCreateAction: (prefill: ActionPrefill) => void;
}) {
  const [tab, setTab] = useState<'dashboard' | 'ocorrencias' | 'concorrentes' | 'gerencial'>('dashboard');
  const [selectedCompetitorFilter, setSelectedCompetitorFilter] = useState('');

  // Competitor Modal
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competitor | null>(null);
  const [compForm, setCompForm] = useState({
    nome: '',
    cnpj: '',
    site: '',
    categoria_atuacao: 'Equipamentos de Laboratório',
    produtos_concorrentes: '',
    descricao: '',
    observacoes: '',
    status: 'ativo' as 'ativo' | 'inativo',
  });
  const [compError, setCompError] = useState('');
  const [compSaving, setCompSaving] = useState(false);

  // Occurrence Modal
  const [occModalOpen, setOccModalOpen] = useState(false);
  const [occError, setOccError] = useState('');
  const [occSaving, setOccSaving] = useState(false);
  const [occForm, setOccForm] = useState({
    data_ocorrencia: todayISO(),
    cliente_id: '',
    cliente_nome: '',
    vendedor_id: user.id,
    produto_autec_id: products[0]?.id || '',
    concorrente_id: '',
    produto_concorrente: '',
    valor_proposta_autec: '',
    valor_concorrente: '',
    prazo_entrega_concorrente: '',
    condicao_pagamento_mencionada: '',
    diferencial_concorrente: '',
    motivo_preferencia: '',
    resultado_negociacao: 'em_andamento' as NegotiationResult,
    observacoes: '',
  });

  const filteredOccurrences = useMemo(() => {
    const base = filterOccurrences(occurrences, filters);
    if (!selectedCompetitorFilter) return base;
    return base.filter((o) => o.concorrente_id === selectedCompetitorFilter);
  }, [occurrences, filters, selectedCompetitorFilter]);

  const previousOccurrences = useMemo(() => {
    const range = getPreviousPeriodRange(filters.dataInicio, filters.dataFim);
    if (!range) return [];
    return occurrences.filter((o) => {
      if (!isWithinDateRange(o.data_ocorrencia, range.prevStart, range.prevEnd)) return false;
      if (filters.vendedorId && o.vendedor_id !== filters.vendedorId) return false;
      if (filters.clienteId && o.cliente_id !== filters.clienteId) return false;
      if (filters.produtoId && o.produto_autec_id !== filters.produtoId) return false;
      return true;
    });
  }, [occurrences, filters]);

  const competitorStats = useMemo(
    () => computeCompetitorStats(filteredOccurrences, previousOccurrences),
    [filteredOccurrences, previousOccurrences]
  );

  // Products most confronted
  const confrontedProducts = useMemo(() => {
    const map = new Map<string, { label: string; count: number; value: number; losses: number }>();
    for (const o of filteredOccurrences) {
      const cur = map.get(o.produto_autec_nome) || {
        label: o.produto_autec_nome,
        count: 0,
        value: 0,
        losses: 0,
      };
      cur.count += 1;
      cur.value += o.valor_proposta_autec ?? 0;
      if (o.resultado_negociacao === 'perdida') cur.losses += 1;
      map.set(o.produto_autec_nome, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredOccurrences]);

  // Preference reasons
  const preferenceReasons = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filteredOccurrences) {
      const reason = o.motivo_preferencia.trim();
      if (!reason) continue;
      map.set(reason, (map.get(reason) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOccurrences]);

  // Monthly mentions evolution
  const evolution = useMemo(() => {
    const monthsSet = new Set<string>();
    filteredOccurrences.forEach((o) => monthsSet.add(monthKey(o.data_ocorrencia)));
    const months = Array.from(monthsSet).sort();
    const totalSeries = months.map((m) => filteredOccurrences.filter((o) => monthKey(o.data_ocorrencia) === m).length);
    const lostSeries = months.map(
      (m) =>
        filteredOccurrences.filter(
          (o) => monthKey(o.data_ocorrencia) === m && o.resultado_negociacao === 'perdida'
        ).length
    );
    return {
      labels: months.map(formatMonthLabel),
      series: [
        { name: 'Total de menções', color: '#1B2E5E', values: totalSeries },
        { name: 'Negociações perdidas', color: '#EF4444', values: lostSeries },
      ],
    };
  }, [filteredOccurrences]);

  const totalDisputedValue = filteredOccurrences.reduce((acc, o) => acc + (o.valor_proposta_autec ?? 0), 0);
  const totalLostDisputes = filteredOccurrences.filter((o) => o.resultado_negociacao === 'perdida').length;

  function openNewCompetitor() {
    setEditingComp(null);
    setCompForm({
      nome: '',
      cnpj: '',
      site: '',
      categoria_atuacao: 'Equipamentos de Laboratório',
      produtos_concorrentes: '',
      descricao: '',
      observacoes: '',
      status: 'ativo',
    });
    setCompError('');
    setCompModalOpen(true);
  }

  function openEditCompetitor(c: Competitor) {
    setEditingComp(c);
    setCompForm({
      nome: c.nome,
      cnpj: c.cnpj,
      site: c.site,
      categoria_atuacao: c.categoria_atuacao,
      produtos_concorrentes: c.produtos_concorrentes,
      descricao: c.descricao,
      observacoes: c.observacoes,
      status: c.status,
    });
    setCompError('');
    setCompModalOpen(true);
  }

  async function handleSaveCompetitor(e: React.FormEvent) {
    e.preventDefault();
    if (!compForm.nome.trim()) {
      setCompError('Informe o nome da empresa concorrente.');
      return;
    }
    setCompSaving(true);
    setCompError('');
    try {
      if (editingComp) {
        await api.updateCompetitor(editingComp.id, compForm);
      } else {
        await api.createCompetitor(compForm);
      }
      await onRefresh();
      setCompModalOpen(false);
    } catch (err) {
      setCompError(err instanceof Error ? err.message : 'Erro ao salvar concorrente.');
    } finally {
      setCompSaving(false);
    }
  }

  function openNewOccurrence() {
    setOccForm({
      data_ocorrencia: todayISO(),
      cliente_id: clients[0]?.id || '',
      cliente_nome: clients[0]?.razao_social || '',
      vendedor_id: user.id,
      produto_autec_id: products[0]?.id || '',
      concorrente_id: competitors.find((c) => c.status === 'ativo')?.id || '',
      produto_concorrente: '',
      valor_proposta_autec: '',
      valor_concorrente: '',
      prazo_entrega_concorrente: '',
      condicao_pagamento_mencionada: '',
      diferencial_concorrente: '',
      motivo_preferencia: '',
      resultado_negociacao: 'em_andamento',
      observacoes: '',
    });
    setOccError('');
    setOccModalOpen(true);
  }

  async function handleSaveOccurrence(e: React.FormEvent) {
    e.preventDefault();
    if (!occForm.concorrente_id) {
      setOccError('Selecione ou cadastre primeiro um concorrente.');
      return;
    }
    if (!occForm.cliente_id && !occForm.cliente_nome.trim()) {
      setOccError('Informe o cliente da negociação.');
      return;
    }
    if (!occForm.produto_autec_id) {
      setOccError('Selecione o produto Autec envolvido.');
      return;
    }
    setOccSaving(true);
    setOccError('');
    try {
      await api.createOccurrence({
        data_ocorrencia: occForm.data_ocorrencia,
        cliente_id: occForm.cliente_id || null,
        cliente_nome: occForm.cliente_nome.trim(),
        vendedor_id: user.role === 'vendedor' ? user.id : occForm.vendedor_id,
        produto_autec_id: occForm.produto_autec_id,
        concorrente_id: occForm.concorrente_id,
        produto_concorrente: occForm.produto_concorrente.trim(),
        valor_proposta_autec: parseNullableNumber(occForm.valor_proposta_autec),
        valor_concorrente: parseNullableNumber(occForm.valor_concorrente),
        prazo_entrega_concorrente: parseNullableNumber(occForm.prazo_entrega_concorrente),
        condicao_pagamento_mencionada: occForm.condicao_pagamento_mencionada.trim() || null,
        diferencial_concorrente: occForm.diferencial_concorrente.trim(),
        motivo_preferencia: occForm.motivo_preferencia.trim(),
        resultado_negociacao: occForm.resultado_negociacao,
        observacoes: occForm.observacoes.trim(),
      });
      await onRefresh();
      setOccModalOpen(false);
    } catch (err) {
      setOccError(err instanceof Error ? err.message : 'Erro ao registrar ocorrência competitiva.');
    } finally {
      setOccSaving(false);
    }
  }

  // Managerial insights (Section 2.4)
  const growingCompetitors = competitorStats.filter((c) => c.variacaoAbsoluta > 0);
  const topAdvantages = useMemo(() => {
    const map = new Map<string, number>();
    filteredOccurrences.forEach((o) => {
      const dif = o.diferencial_concorrente.trim();
      if (dif) map.set(dif, (map.get(dif) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredOccurrences]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Radar de Concorrentes"
        subtitle="Mapeamento competitivo de negociações, diferenciais percebidos e pressão por linha de equipamentos"
        actions={
          <>
            <button
              type="button"
              onClick={openNewCompetitor}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-[#1B2E5E] text-slate-700 text-xs font-medium rounded-lg whitespace-nowrap"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Cadastrar Concorrente</span>
            </button>
            <button
              type="button"
              onClick={openNewOccurrence}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-medium rounded-lg whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Ocorrência</span>
            </button>
          </>
        }
      />

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {[
          { id: 'dashboard', label: 'Dashboard Competitivo' },
          { id: 'ocorrencias', label: `Ocorrências (${filteredOccurrences.length})` },
          { id: 'concorrentes', label: `Concorrentes (${competitors.length})` },
          { id: 'gerencial', label: 'Análise Gerencial' },
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
          setSelectedCompetitorFilter('');
          onResetFilters();
        }}
        users={users}
        clients={clients}
        products={products}
        showSellerFilter={user.role !== 'vendedor'}
        situations={[
          { value: 'em_andamento', label: 'Em Andamento' },
          { value: 'ganha', label: 'Ganha pela Autec' },
          { value: 'perdida', label: 'Perdida para Concorrente' },
          { value: 'cancelada', label: 'Cancelada' },
        ]}
        extraControls={
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Concorrente</label>
            <select
              value={selectedCompetitorFilter}
              onChange={(e) => setSelectedCompetitorFilter(e.target.value)}
              className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1B2E5E]"
            >
              <option value="">Todos os concorrentes</option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {tab === 'dashboard' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Ocorrências competitivas"
              value={filteredOccurrences.length}
              subtitle={`Período anterior: ${previousOccurrences.length}`}
              tone="navy"
            />
            <KpiCard
              label="Concorrentes citados"
              value={competitorStats.length}
              subtitle={`De ${competitors.filter((c) => c.status === 'ativo').length} ativos cadastrados`}
            />
            <KpiCard
              label="Valor potencial disputado"
              value={formatCurrencyBRL(totalDisputedValue, 'R$ 0,00')}
              subtitle="Soma das propostas Autec informadas"
            />
            <KpiCard
              label="Disputas perdidas"
              value={totalLostDisputes}
              subtitle={
                competitorStats[0]
                  ? `Maior presença: ${competitorStats[0].concorrente_nome}`
                  : 'Sem perdas associadas'
              }
              tone={totalLostDisputes > 0 ? 'danger' : 'neutral'}
            />
          </div>

          {filteredOccurrences.length === 0 ? (
            <EmptyState
              icon={<Radar className="w-5 h-5" />}
              title="Nenhuma ocorrência competitiva no período"
              description="Cadastre os concorrentes enfrentados e registre as ocorrências encontradas pelos vendedores para alimentar gráficos, comparações entre períodos e análises gerenciais sem dados fictícios."
              actionLabel={competitors.length === 0 ? 'Cadastrar Primeiro Concorrente' : 'Registrar Ocorrência Competitiva'}
              onAction={competitors.length === 0 ? openNewCompetitor : openNewOccurrence}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">
                    Ranking de Concorrentes Mais Mencionados
                  </h3>
                  <HorizontalBarChart
                    data={competitorStats.slice(0, 8).map((c) => ({
                      label: c.concorrente_nome,
                      value: c.mencoes,
                      secondaryLabel: formatCompactBRL(c.valorPotencial),
                    }))}
                    formatValue={(v) => `${v} menção(ões)`}
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Produtos Autec Mais Confrontados</h3>
                  <HorizontalBarChart
                    data={confrontedProducts.slice(0, 8).map((p) => ({
                      label: p.label,
                      value: p.count,
                      secondaryLabel: `${p.losses} perda(s)`,
                      color: '#F59E0B',
                    }))}
                    formatValue={(v) => `${v} disputa(s)`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Evolução das Menções por Período</h3>
                  <LineChartMulti labels={evolution.labels} series={evolution.series} />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">
                    Motivos de Preferência pelos Concorrentes
                  </h3>
                  <HorizontalBarChart
                    data={preferenceReasons.slice(0, 8)}
                    accentColor="#EF4444"
                    formatValue={(v) => `${v} menção(ões)`}
                    emptyMessage="Nenhum motivo de preferência informado nas ocorrências."
                  />
                </div>
              </div>

              {/* Comparativo entre períodos e perdas */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1B2E5E]">
                    Comparativo por Concorrente e Período Anterior
                  </h3>
                  <span className="text-xs text-slate-500">Sem cálculo de market share por ausência de base de mercado total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold">Concorrente</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Menções (Atual)</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Período Ant.</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Variação</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Valor Disputado</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Perdas Autec</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {competitorStats.map((c) => (
                        <tr key={c.concorrente_id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium text-slate-900">{c.concorrente_nome}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">{c.mencoes}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-500">
                            {c.mencoesPeriodoAnterior}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                            {c.variacaoAbsoluta > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-red-700 font-medium">
                                <ArrowUpRight className="w-3 h-3" />+{c.variacaoAbsoluta}
                              </span>
                            ) : c.variacaoAbsoluta < 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-medium">
                                <ArrowDownRight className="w-3 h-3" />
                                {c.variacaoAbsoluta}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                            {formatCurrencyBRL(c.valorPotencial, 'R$ 0,00')}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-red-700">
                            {c.perdidas} ({formatPercent(c.taxaDerrota)})
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                onCreateAction({
                                  titulo: `Plano de resposta competitiva: ${c.concorrente_nome}`,
                                  problema_identificado: `${c.concorrente_nome} presente em ${c.mencoes} negociação(ões) com ${c.perdidas} perda(s).`,
                                  origem_tipo: 'concorrente',
                                  origem_id: c.concorrente_id,
                                  origem_label: `Concorrente: ${c.concorrente_nome}`,
                                  categoria: 'Concorrência',
                                  indicador_relacionado: 'Taxa de vitória frente ao concorrente',
                                })
                              }
                              className="text-xs font-medium text-[#1B2E5E] hover:underline whitespace-nowrap"
                            >
                              Criar Ação
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : null}

      {tab === 'ocorrencias' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredOccurrences.length === 0 ? (
            <EmptyState
              icon={<Radar className="w-5 h-5" />}
              title="Nenhuma ocorrência registrada"
              description="Registre preços, prazos e diferenciais de concorrentes observados em campo. Campos desconhecidos podem ficar em branco sem assumir zero."
              actionLabel="Registrar Primeira Ocorrência"
              onAction={openNewOccurrence}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">Data</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Cliente / Vendedor</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Produto Autec</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Concorrente</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Proposta Autec</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Valor Concorrente</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Prazo Conc.</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOccurrences.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 align-top">
                      <td className="px-4 py-2.5 font-mono whitespace-nowrap">{formatDateBR(o.data_ocorrencia)}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900">{o.cliente_nome}</div>
                        <div className="text-[11px] text-slate-500">{o.vendedor_nome}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{o.produto_autec_nome}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-[#1B2E5E]">{o.concorrente_nome}</div>
                        {o.produto_concorrente ? (
                          <div className="text-[11px] text-slate-500">{o.produto_concorrente}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                        {formatCurrencyBRL(o.valor_proposta_autec, 'Não informado')}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                        {formatCurrencyBRL(o.valor_concorrente, 'Não informado')}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                        {o.prazo_entrega_concorrente === null || o.prazo_entrega_concorrente === undefined
                          ? 'Não informado'
                          : `${o.prazo_entrega_concorrente} dia(s)`}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-medium ${
                            o.resultado_negociacao === 'ganha'
                              ? 'text-emerald-700'
                              : o.resultado_negociacao === 'perdida'
                                ? 'text-red-700'
                                : 'text-slate-700'
                          }`}
                        >
                          {RESULT_LABELS[o.resultado_negociacao]}
                        </span>
                        {o.motivo_preferencia ? (
                          <div className="text-[11px] text-slate-500 mt-0.5">{o.motivo_preferencia}</div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'concorrentes' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {competitors.length === 0 ? (
            <EmptyState
              icon={<Building2 className="w-5 h-5" />}
              title="Nenhum concorrente cadastrado"
              description="Cadastre as empresas concorrentes disputando negociações com a Autec para padronizar o registro em campo."
              actionLabel="Cadastrar Primeiro Concorrente"
              onAction={openNewCompetitor}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">Empresa Concorrente</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Categoria de Atuação</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Produtos Concorrentes</th>
                    <th className="text-left px-4 py-2.5 font-semibold">CNPJ / Site</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                    {user.role !== 'vendedor' ? <th className="text-right px-4 py-2.5 font-semibold">Ações</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {competitors.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 align-top">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-[#1B2E5E]">{c.nome}</div>
                        {c.descricao ? <div className="text-[11px] text-slate-500 mt-0.5">{c.descricao}</div> : null}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{c.categoria_atuacao || 'Não informada'}</td>
                      <td className="px-4 py-2.5 text-slate-700">{c.produtos_concorrentes || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-500">
                        <div>{c.cnpj || 'CNPJ não informado'}</div>
                        {c.site ? <div className="text-[11px]">{c.site}</div> : null}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={c.status === 'ativo' ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                          {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {user.role !== 'vendedor' ? (
                        <td className="px-4 py-2.5 text-right space-x-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditCompetitor(c)}
                            className="text-[#1B2E5E] hover:underline font-medium"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onCreateAction({
                                titulo: `Analisar posicionamento frente a ${c.nome}`,
                                problema_identificado: `Mapeamento estratégico de ${c.nome} (${c.produtos_concorrentes || c.categoria_atuacao}).`,
                                origem_tipo: 'concorrente',
                                origem_id: c.id,
                                origem_label: `Concorrente: ${c.nome}`,
                                categoria: 'Concorrência',
                              })
                            }
                            className="text-amber-700 hover:underline font-medium"
                          >
                            Criar Ação
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'gerencial' ? (
        filteredOccurrences.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="w-5 h-5" />}
            title="Análise gerencial aguardando dados competitivos"
            description="Quando houver ocorrências registradas, esta visão destacará concorrentes em expansão, produtos sob maior pressão, vantagens citadas pelos clientes e pontos de resposta comercial."
            actionLabel="Registrar Ocorrência"
            onAction={openNewOccurrence}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#1B2E5E]">Concorrentes com Crescimento de Presença</h3>
              {growingCompetitors.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Nenhum concorrente apresentou aumento de menções em relação ao período anterior equivalente.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {growingCompetitors.map((c) => (
                    <div key={c.concorrente_id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{c.concorrente_nome}</div>
                        <div className="text-slate-500">
                          {c.mencoesPeriodoAnterior} → {c.mencoes} menções · {c.perdidas} perda(s)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onCreateAction({
                            titulo: `Conter avanço de ${c.concorrente_nome}`,
                            problema_identificado: `Crescimento de +${c.variacaoAbsoluta} menções no período analisado.`,
                            origem_tipo: 'concorrente',
                            origem_id: c.concorrente_id,
                            origem_label: `Concorrente: ${c.concorrente_nome}`,
                            categoria: 'Concorrência',
                          })
                        }
                        className="px-2.5 py-1 border border-slate-200 hover:border-[#1B2E5E] text-[#1B2E5E] rounded-md font-medium"
                      >
                        Criar Ação
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#1B2E5E]">Produtos sob Maior Pressão Competitiva</h3>
              <div className="space-y-2.5">
                {confrontedProducts.slice(0, 5).map((p) => (
                  <div key={p.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{p.label}</div>
                      <div className="text-slate-500">
                        {p.count} disputa(s) · {p.losses} perda(s) · {formatCurrencyBRL(p.value, 'R$ 0,00')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onCreateAction({
                          titulo: `Reforçar diferencial competitivo: ${p.label}`,
                          problema_identificado: `Produto enfrentou ${p.count} disputas com ${p.losses} perda(s).`,
                          origem_tipo: 'produto',
                          origem_label: `Produto: ${p.label}`,
                          categoria: 'Produto',
                        })
                      }
                      className="px-2.5 py-1 border border-slate-200 hover:border-[#1B2E5E] text-[#1B2E5E] rounded-md font-medium shrink-0"
                    >
                      Criar Ação
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 lg:col-span-2">
              <h3 className="text-sm font-semibold text-[#1B2E5E]">
                Principais Vantagens Competitivas Citadas & Pontos de Resposta Comercial
              </h3>
              {topAdvantages.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Os vendedores ainda não preencheram o campo "Diferencial do concorrente" nas ocorrências registradas.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topAdvantages.slice(0, 6).map((adv) => (
                    <div key={adv.label} className="p-3 border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{adv.label}</div>
                        <div className="text-slate-500 mt-0.5">Citado em {adv.count} negociação(ões)</div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onCreateAction({
                            titulo: `Construir contra-argumento para "${adv.label}"`,
                            problema_identificado: `Diferencial competitivo citado ${adv.count}x pelos clientes.`,
                            origem_tipo: 'concorrente',
                            origem_label: `Diferencial: ${adv.label}`,
                            categoria: 'Concorrência',
                          })
                        }
                        className="text-[#1B2E5E] font-medium hover:underline shrink-0"
                      >
                        Criar Ação
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      ) : null}

      {/* Modal: Cadastrar / Editar Concorrente */}
      <Modal
        open={compModalOpen}
        onClose={() => setCompModalOpen(false)}
        title={editingComp ? 'Editar Concorrente' : 'Cadastrar Concorrente'}
        subtitle="Mantenha a base única de concorrentes para padronizar menções e perdas."
      >
        <form onSubmit={handleSaveCompetitor} className="space-y-3">
          {compError ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{compError}</div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome da empresa concorrente *</label>
              <input
                type="text"
                value={compForm.nome}
                onChange={(e) => setCompForm({ ...compForm, nome: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">CNPJ (opcional)</label>
              <input
                type="text"
                value={compForm.cnpj}
                onChange={(e) => setCompForm({ ...compForm, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Site (opcional)</label>
              <input
                type="text"
                value={compForm.site}
                onChange={(e) => setCompForm({ ...compForm, site: e.target.value })}
                placeholder="https://..."
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Categoria de atuação</label>
              <input
                type="text"
                value={compForm.categoria_atuacao}
                onChange={(e) => setCompForm({ ...compForm, categoria_atuacao: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                value={compForm.status}
                onChange={(e) => setCompForm({ ...compForm, status: e.target.value as 'ativo' | 'inativo' })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Produtos concorrentes</label>
              <input
                type="text"
                value={compForm.produtos_concorrentes}
                onChange={(e) => setCompForm({ ...compForm, produtos_concorrentes: e.target.value })}
                placeholder="Ex.: Estufas, Autoclaves, Banhos-Maria..."
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
              <textarea
                rows={2}
                value={compForm.descricao}
                onChange={(e) => setCompForm({ ...compForm, descricao: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Observações</label>
              <textarea
                rows={2}
                value={compForm.observacoes}
                onChange={(e) => setCompForm({ ...compForm, observacoes: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCompModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={compSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-[#1B2E5E] hover:bg-[#14234A] rounded-lg"
            >
              {compSaving ? 'Salvando...' : 'Salvar Concorrente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Registrar Ocorrência Competitiva */}
      <Modal
        open={occModalOpen}
        onClose={() => setOccModalOpen(false)}
        title="Registrar Ocorrência Competitiva"
        subtitle="Campos financeiros e de prazo desconhecidos devem permanecer em branco (não preencha zero se não souber)."
      >
        <form onSubmit={handleSaveOccurrence} className="space-y-3">
          {occError ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{occError}</div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data da ocorrência *</label>
              <input
                type="date"
                value={occForm.data_ocorrencia}
                onChange={(e) => setOccForm({ ...occForm, data_ocorrencia: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Vendedor responsável *</label>
              <select
                value={occForm.vendedor_id}
                disabled={user.role === 'vendedor'}
                onChange={(e) => setOccForm({ ...occForm, vendedor_id: e.target.value })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white disabled:bg-slate-50"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">Cliente *</label>
                <button
                  type="button"
                  onClick={onOpenNewClient}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1B2E5E] hover:underline"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Novo cliente</span>
                </button>
              </div>
              {clients.length > 0 ? (
                <select
                  value={occForm.cliente_id}
                  onChange={(e) => {
                    const cli = clients.find((c) => c.id === e.target.value);
                    setOccForm({
                      ...occForm,
                      cliente_id: e.target.value,
                      cliente_nome: cli ? cli.razao_social : '',
                    });
                  }}
                  className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white mb-1.5"
                >
                  <option value="">Selecionar cliente cadastrado ou digitar abaixo...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razao_social}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                type="text"
                value={occForm.cliente_nome}
                onChange={(e) => setOccForm({ ...occForm, cliente_id: '', cliente_nome: e.target.value })}
                placeholder="Nome do laboratório / empresa cliente"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Produto Autec envolvido *</label>
              <select
                value={occForm.produto_autec_id}
                onChange={(e) => setOccForm({ ...occForm, produto_autec_id: e.target.value })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
                required
              >
                <option value="">Selecione o equipamento...</option>
                <ProductSelectOptions products={products} />
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Concorrente mencionado *</label>
              <select
                value={occForm.concorrente_id}
                onChange={(e) => setOccForm({ ...occForm, concorrente_id: e.target.value })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
                required
              >
                <option value="">Selecione o concorrente...</option>
                {competitors
                  .filter((c) => c.status === 'ativo')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Produto concorrente</label>
              <input
                type="text"
                value={occForm.produto_concorrente}
                onChange={(e) => setOccForm({ ...occForm, produto_concorrente: e.target.value })}
                placeholder="Modelo ou linha citada"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Resultado da negociação</label>
              <select
                value={occForm.resultado_negociacao}
                onChange={(e) =>
                  setOccForm({ ...occForm, resultado_negociacao: e.target.value as NegotiationResult })
                }
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="em_andamento">Em Andamento</option>
                <option value="ganha">Ganha pela Autec</option>
                <option value="perdida">Perdida para Concorrente</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Valor proposta Autec (R$ · opcional)</label>
              <input
                type="text"
                inputMode="decimal"
                value={occForm.valor_proposta_autec}
                onChange={(e) => setOccForm({ ...occForm, valor_proposta_autec: e.target.value })}
                placeholder="Deixe vazio se não informado"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Valor concorrente (R$ · quando conhecido)</label>
              <input
                type="text"
                inputMode="decimal"
                value={occForm.valor_concorrente}
                onChange={(e) => setOccForm({ ...occForm, valor_concorrente: e.target.value })}
                placeholder="Deixe vazio se desconhecido"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Prazo entrega concorrente (dias · opcional)</label>
              <input
                type="number"
                min={0}
                value={occForm.prazo_entrega_concorrente}
                onChange={(e) => setOccForm({ ...occForm, prazo_entrega_concorrente: e.target.value })}
                placeholder="Ex.: 15"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Condição de pagamento mencionada</label>
              <input
                type="text"
                value={occForm.condicao_pagamento_mencionada}
                onChange={(e) => setOccForm({ ...occForm, condicao_pagamento_mencionada: e.target.value })}
                placeholder="Ex.: 30/60/90 dias"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Diferencial do concorrente</label>
              <input
                type="text"
                value={occForm.diferencial_concorrente}
                onChange={(e) => setOccForm({ ...occForm, diferencial_concorrente: e.target.value })}
                placeholder="Ex.: Menor preço inicial, pronta entrega, financiamento próprio"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Motivo pelo qual o cliente considera o concorrente</label>
              <input
                type="text"
                value={occForm.motivo_preferencia}
                onChange={(e) => setOccForm({ ...occForm, motivo_preferencia: e.target.value })}
                placeholder="Ex.: Orçamento limitado do edital / prazo imediato"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Observações adicionais</label>
              <textarea
                rows={2}
                value={occForm.observacoes}
                onChange={(e) => setOccForm({ ...occForm, observacoes: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setOccModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={occSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-[#1B2E5E] hover:bg-[#14234A] rounded-lg"
            >
              {occSaving ? 'Registrando...' : 'Registrar Ocorrência'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
