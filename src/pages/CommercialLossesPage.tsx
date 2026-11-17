import React, { useMemo, useState } from 'react';
import { Plus, RefreshCw, Shield, TrendingDown, UserPlus } from 'lucide-react';
import type {
  ActionPrefill,
  Client,
  Competitor,
  GlobalFilters,
  LossReason,
  LostOpportunity,
  Opportunity,
  Product,
  RecoverabilityStatus,
  RecoveryAttempt,
  User,
} from '../types';
import { api } from '../utils/api';
import {
  formatCompactBRL,
  formatCurrencyBRL,
  formatDateBR,
  formatPercent,
  LOSS_STATUS_LABELS,
  parseNullableNumber,
  todayISO,
} from '../utils/formatters';
import { computeLossSummary, filterLostOpportunities, formatMonthLabel, monthKey } from '../utils/intelligence';
import { HorizontalBarChart, LineChartMulti } from '../components/Charts';
import { EmptyState, GlobalFilterBar, KpiCard, Modal, PageHeader, ProductSelectOptions } from '../components/UI';

export function CommercialLossesPage({
  user,
  users,
  clients,
  products,
  competitors,
  opportunities,
  lossReasons,
  lostOpportunities,
  recoveryAttempts,
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
  opportunities: Opportunity[];
  lossReasons: LossReason[];
  lostOpportunities: LostOpportunity[];
  recoveryAttempts: RecoveryAttempt[];
  filters: GlobalFilters;
  onFiltersChange: (next: GlobalFilters) => void;
  onResetFilters: () => void;
  onRefresh: () => Promise<void>;
  onOpenNewClient: () => void;
  onCreateAction: (prefill: ActionPrefill) => void;
}) {
  const [tab, setTab] = useState<'dashboard' | 'lista' | 'recuperacao' | 'motivos'>('dashboard');
  const [reasonFilter, setReasonFilter] = useState('');

  // Modal: Register Loss
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [lossError, setLossError] = useState('');
  const [lossSaving, setLossSaving] = useState(false);
  const [lossForm, setLossForm] = useState({
    identificador: '',
    oportunidade_id: '',
    cliente_id: '',
    cliente_nome: '',
    vendedor_id: user.id,
    produto_id: products[0]?.id || '',
    data_abertura: todayISO(),
    data_encerramento: todayISO(),
    valor_estimado: '',
    concorrente_vencedor_id: '',
    motivo_principal_id: lossReasons[0]?.id || '',
    motivo_secundario_id: '',
    descricao_detalhada: '',
    recuperavel: 'avaliar' as RecoverabilityStatus,
    data_prevista_abordagem: '',
  });

  // Modal: Recovery Attempt
  const [recModalOpen, setRecModalOpen] = useState(false);
  const [selectedLostForRec, setSelectedLostForRec] = useState<LostOpportunity | null>(null);
  const [recError, setRecError] = useState('');
  const [recSaving, setRecSaving] = useState(false);
  const [recForm, setRecForm] = useState({
    motivo_tentativa: '',
    vendedor_responsavel_id: user.id,
    data_retorno: todayISO(),
    contato_realizado: '',
    situacao: 'em_negociacao' as 'em_negociacao' | 'recuperada' | 'nao_recuperada',
    valor_recuperado: '',
    observacoes: '',
  });

  // New Reason (Admin only)
  const [newReasonName, setNewReasonName] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [reasonSaving, setReasonSaving] = useState(false);

  const filteredLosses = useMemo(() => {
    const base = filterLostOpportunities(lostOpportunities, filters);
    if (!reasonFilter) return base;
    return base.filter((l) => l.motivo_principal_id === reasonFilter);
  }, [lostOpportunities, filters, reasonFilter]);

  const summary = useMemo(() => computeLossSummary(filteredLosses), [filteredLosses]);

  // Monthly loss evolution
  const evolution = useMemo(() => {
    const monthsSet = new Set<string>();
    filteredLosses.forEach((l) => monthsSet.add(monthKey(l.data_encerramento)));
    const months = Array.from(monthsSet).sort();
    const countSeries = months.map(
      (m) => filteredLosses.filter((l) => monthKey(l.data_encerramento) === m).length
    );
    return {
      labels: months.map(formatMonthLabel),
      series: [{ name: 'Oportunidades perdidas', color: '#EF4444', values: countSeries }],
    };
  }, [filteredLosses]);

  const recoverableList = useMemo(
    () =>
      filteredLosses.filter(
        (l) =>
          l.recuperavel === 'sim' ||
          l.recuperavel === 'avaliar' ||
          l.status_perda === 'em_recuperacao' ||
          l.status_perda === 'recuperada'
      ),
    [filteredLosses]
  );

  // Non-lost opportunities eligible to link
  const linkableOpportunities = useMemo(() => {
    const alreadyLinked = new Set(lostOpportunities.map((l) => l.oportunidade_id).filter(Boolean));
    return opportunities.filter((o) => !alreadyLinked.has(o.id) && o.status !== 'ganha');
  }, [opportunities, lostOpportunities]);

  function openNewLossModal() {
    setLossForm({
      identificador: '',
      oportunidade_id: '',
      cliente_id: clients[0]?.id || '',
      cliente_nome: clients[0]?.razao_social || '',
      vendedor_id: user.id,
      produto_id: products[0]?.id || '',
      data_abertura: todayISO(),
      data_encerramento: todayISO(),
      valor_estimado: '',
      concorrente_vencedor_id: '',
      motivo_principal_id: lossReasons[0]?.id || '',
      motivo_secundario_id: '',
      descricao_detalhada: '',
      recuperavel: 'avaliar',
      data_prevista_abordagem: '',
    });
    setLossError('');
    setLossModalOpen(true);
  }

  function handlePickOpportunity(oppId: string) {
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp) {
      setLossForm((prev) => ({ ...prev, oportunidade_id: '' }));
      return;
    }
    setLossForm((prev) => ({
      ...prev,
      oportunidade_id: opp.id,
      cliente_id: opp.cliente_id || '',
      cliente_nome: opp.cliente_nome,
      vendedor_id: opp.vendedor_id,
      produto_id: opp.produto_id || prev.produto_id,
      data_abertura: opp.data_abertura,
      valor_estimado: opp.valor !== null && opp.valor !== undefined ? String(opp.valor) : '',
    }));
  }

  async function handleSaveLoss(e: React.FormEvent) {
    e.preventDefault();
    if (!lossForm.cliente_id && !lossForm.cliente_nome.trim()) {
      setLossError('Informe o cliente da oportunidade perdida.');
      return;
    }
    if (!lossForm.motivo_principal_id) {
      setLossError('Selecione o motivo principal da perda.');
      return;
    }
    setLossSaving(true);
    setLossError('');
    try {
      await api.createLostOpportunity({
        identificador: lossForm.identificador.trim() || undefined,
        oportunidade_id: lossForm.oportunidade_id || null,
        cliente_id: lossForm.cliente_id || null,
        cliente_nome: lossForm.cliente_nome.trim(),
        vendedor_id: user.role === 'vendedor' ? user.id : lossForm.vendedor_id,
        produto_id: lossForm.produto_id || null,
        data_abertura: lossForm.data_abertura,
        data_encerramento: lossForm.data_encerramento,
        valor_estimado: parseNullableNumber(lossForm.valor_estimado),
        concorrente_vencedor_id: lossForm.concorrente_vencedor_id || null,
        motivo_principal_id: lossForm.motivo_principal_id,
        motivo_secundario_id: lossForm.motivo_secundario_id || null,
        descricao_detalhada: lossForm.descricao_detalhada.trim(),
        recuperavel: lossForm.recuperavel,
        data_prevista_abordagem: lossForm.data_prevista_abordagem || null,
      });
      await onRefresh();
      setLossModalOpen(false);
    } catch (err) {
      setLossError(err instanceof Error ? err.message : 'Erro ao registrar perda comercial.');
    } finally {
      setLossSaving(false);
    }
  }

  function openRecoveryModal(lost: LostOpportunity) {
    setSelectedLostForRec(lost);
    setRecForm({
      motivo_tentativa: `Reabordagem por perda (${lost.motivo_principal_nome})`,
      vendedor_responsavel_id: lost.vendedor_id || user.id,
      data_retorno: todayISO(),
      contato_realizado: '',
      situacao: 'em_negociacao',
      valor_recuperado: lost.valor_estimado !== null ? String(lost.valor_estimado) : '',
      observacoes: '',
    });
    setRecError('');
    setRecModalOpen(true);
  }

  async function handleSaveRecovery(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLostForRec) return;
    if (!recForm.motivo_tentativa.trim() || !recForm.data_retorno) {
      setRecError('Informe o motivo da tentativa e a data de retorno.');
      return;
    }
    setRecSaving(true);
    setRecError('');
    try {
      await api.createRecoveryAttempt(selectedLostForRec.id, {
        motivo_tentativa: recForm.motivo_tentativa.trim(),
        vendedor_responsavel_id: user.role === 'vendedor' ? user.id : recForm.vendedor_responsavel_id,
        data_retorno: recForm.data_retorno,
        contato_realizado: recForm.contato_realizado.trim(),
        situacao: recForm.situacao,
        valor_recuperado: parseNullableNumber(recForm.valor_recuperado),
        observacoes: recForm.observacoes.trim(),
      });
      await onRefresh();
      setRecModalOpen(false);
    } catch (err) {
      setRecError(err instanceof Error ? err.message : 'Erro ao registrar tentativa de recuperação.');
    } finally {
      setRecSaving(false);
    }
  }

  async function handleAddReason(e: React.FormEvent) {
    e.preventDefault();
    if (!newReasonName.trim()) {
      setReasonError('Digite o nome do novo motivo.');
      return;
    }
    setReasonSaving(true);
    setReasonError('');
    try {
      await api.createLossReason(newReasonName.trim());
      setNewReasonName('');
      await onRefresh();
    } catch (err) {
      setReasonError(err instanceof Error ? err.message : 'Erro ao cadastrar motivo.');
    } finally {
      setReasonSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Perdas Comerciais"
        subtitle="Diagnóstico de oportunidades efetivamente perdidas, causas raiz e recuperação estruturada"
        actions={
          <button
            type="button"
            onClick={openNewLossModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-medium rounded-lg whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Perda Comercial</span>
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {[
          { id: 'dashboard', label: 'Dashboard de Perdas' },
          { id: 'lista', label: `Oportunidades Perdidas (${filteredLosses.length})` },
          { id: 'recuperacao', label: `Recuperação (${recoverableList.length})` },
          { id: 'motivos', label: `Motivos Padronizados (${lossReasons.length})` },
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
          setReasonFilter('');
          onResetFilters();
        }}
        users={users}
        clients={clients}
        products={products}
        showSellerFilter={user.role !== 'vendedor'}
        situations={[
          { value: 'confirmada', label: 'Perda Confirmada' },
          { value: 'em_recuperacao', label: 'Em Recuperação' },
          { value: 'recuperada', label: 'Recuperada' },
          { value: 'nao_recuperada', label: 'Não Recuperada' },
        ]}
        extraControls={
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Motivo principal</label>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
            >
              <option value="">Todos os motivos</option>
              {lossReasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
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
              label="Total de oportunidades perdidas"
              value={summary.totalCount}
              subtitle="Exclui oportunidades em negociação"
              tone={summary.totalCount > 0 ? 'danger' : 'neutral'}
            />
            <KpiCard
              label="Valor financeiro perdido"
              value={formatCurrencyBRL(summary.totalValue, 'R$ 0,00')}
              subtitle="Soma das perdas com valor estimado"
              tone={summary.totalValue > 0 ? 'danger' : 'neutral'}
            />
            <KpiCard
              label="Ticket médio perdido"
              value={formatCurrencyBRL(summary.avgValue, '—')}
              subtitle="Valor perdido ÷ quantidade perdida"
            />
            <KpiCard
              label="Potencial de recuperação"
              value={summary.eligibleCount}
              subtitle={`Taxa de recuperação: ${formatPercent(summary.recoveryRate)} (${summary.recoveredCount}/${summary.eligibleCount})`}
              tone={summary.recoveredCount > 0 ? 'positive' : 'warning'}
            />
          </div>

          {filteredLosses.length === 0 ? (
            <EmptyState
              icon={<TrendingDown className="w-5 h-5" />}
              title="Nenhuma perda comercial registrada no período"
              description="Quando oportunidades forem encerradas como perdidas, registre-as aqui com motivo padronizado e potencial de recuperação para identificar gargalos reais sem misturar negócios em andamento."
              actionLabel="Registrar Primeira Perda"
              onAction={openNewLossModal}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[#1B2E5E]">Principais Motivos de Perda</h3>
                    {summary.byReason[0] ? (
                      <button
                        type="button"
                        onClick={() =>
                          onCreateAction({
                            titulo: `Reduzir perdas por "${summary.byReason[0].label}"`,
                            problema_identificado: `Motivo principal de perda com ${summary.byReason[0].count} registro(s) (${formatCurrencyBRL(summary.byReason[0].value)}).`,
                            origem_tipo: 'oportunidade_perdida',
                            origem_label: `Motivo de perda: ${summary.byReason[0].label}`,
                            categoria: summary.byReason[0].label.toLowerCase().includes('preço') ? 'Preço' : 'Conversão comercial',
                            indicador_relacionado: 'Valor perdido por motivo',
                          })
                        }
                        className="text-xs font-medium text-[#1B2E5E] hover:underline"
                      >
                        Criar Ação do Principal Motivo
                      </button>
                    ) : null}
                  </div>
                  <HorizontalBarChart
                    data={summary.byReason.slice(0, 8).map((r) => ({
                      label: r.label,
                      value: r.count,
                      secondaryLabel: formatCompactBRL(r.value),
                      color: '#EF4444',
                    }))}
                    formatValue={(v) => `${v} perda(s)`}
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Evolução Mensal das Perdas</h3>
                  <LineChartMulti labels={evolution.labels} series={evolution.series} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Perdas por Vendedor</h3>
                  <HorizontalBarChart
                    data={summary.bySeller.map((s) => ({
                      label: s.label,
                      value: s.value,
                      secondaryLabel: `${s.count} perda(s)`,
                      color: '#1B2E5E',
                    }))}
                    formatValue={(v) => formatCompactBRL(v)}
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Perdas por Produto</h3>
                  <HorizontalBarChart
                    data={summary.byProduct.map((p) => ({
                      label: p.label,
                      value: p.count,
                      secondaryLabel: formatCompactBRL(p.value),
                      color: '#F59E0B',
                    }))}
                    formatValue={(v) => `${v} perda(s)`}
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Perdas por Concorrente Vencedor</h3>
                  <HorizontalBarChart
                    data={summary.byCompetitor.map((c) => ({
                      label: c.label,
                      value: c.count,
                      secondaryLabel: formatCompactBRL(c.value),
                      color: '#6366F1',
                    }))}
                    formatValue={(v) => `${v} perda(s)`}
                    emptyMessage="Nenhum concorrente vencedor identificado nas perdas."
                  />
                </div>
              </div>
            </>
          )}
        </>
      ) : null}

      {tab === 'lista' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredLosses.length === 0 ? (
            <EmptyState
              icon={<TrendingDown className="w-5 h-5" />}
              title="Nenhuma oportunidade perdida cadastrada"
              description="Cadastre perdas manualmente ou converta uma oportunidade em andamento ao encerrá-la como perdida."
              actionLabel="Registrar Perda"
              onAction={openNewLossModal}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">ID / Encerramento</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Cliente / Vendedor</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Produto</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Motivo Principal</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Concorrente</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Valor Estimado</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLosses.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 align-top">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="font-mono font-semibold text-[#1B2E5E]">{l.identificador}</div>
                        <div className="text-[11px] text-slate-500">{formatDateBR(l.data_encerramento)}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900">{l.cliente_nome}</div>
                        <div className="text-[11px] text-slate-500">{l.vendedor_nome}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{l.produto_nome || 'Não informado'}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900">{l.motivo_principal_nome}</div>
                        {l.motivo_secundario_nome ? (
                          <div className="text-[11px] text-slate-500">Sec.: {l.motivo_secundario_nome}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{l.concorrente_vencedor_nome || 'Não informado'}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                        {formatCurrencyBRL(l.valor_estimado, 'Não informado')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-medium ${
                            l.status_perda === 'recuperada'
                              ? 'text-emerald-700'
                              : l.status_perda === 'em_recuperacao'
                                ? 'text-amber-700'
                                : 'text-red-700'
                          }`}
                        >
                          {LOSS_STATUS_LABELS[l.status_perda] || l.status_perda}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          Recuperável: {l.recuperavel === 'sim' ? 'Sim' : l.recuperavel === 'nao' ? 'Não' : 'A avaliar'}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-2.5">
                        {l.recuperavel !== 'nao' ? (
                          <button
                            type="button"
                            onClick={() => openRecoveryModal(l)}
                            className="text-emerald-700 hover:underline font-medium"
                          >
                            Recuperar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            onCreateAction({
                              titulo: `Tratar perda ${l.identificador} — ${l.cliente_nome}`,
                              problema_identificado: `Perda por ${l.motivo_principal_nome} (${formatCurrencyBRL(l.valor_estimado)}).`,
                              origem_tipo: 'oportunidade_perdida',
                              origem_id: l.id,
                              origem_label: `Perda ${l.identificador} · ${l.cliente_nome}`,
                              categoria: l.recuperavel === 'sim' ? 'Recuperação de clientes' : 'Conversão comercial',
                            })
                          }
                          className="text-[#1B2E5E] hover:underline font-medium"
                        >
                          Criar Ação
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'recuperacao' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              label="Oportunidades elegíveis"
              value={summary.eligibleCount}
              subtitle="Marcadas como recuperáveis"
            />
            <KpiCard
              label="Oportunidades recuperadas"
              value={summary.recoveredCount}
              subtitle={`Valor recuperado: ${formatCurrencyBRL(summary.recoveredValue, 'R$ 0,00')}`}
              tone="positive"
            />
            <KpiCard
              label="Taxa de recuperação"
              value={formatPercent(summary.recoveryRate)}
              subtitle="Recuperadas ÷ elegíveis × 100"
              tone="navy"
            />
          </div>

          {recoverableList.length === 0 ? (
            <EmptyState
              icon={<RefreshCw className="w-5 h-5" />}
              title="Nenhuma oportunidade elegível para recuperação"
              description="Ao registrar uma perda comercial, marque a possibilidade de recuperação como 'Sim' ou 'A avaliar' para acompanhá-la nesta fila."
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">Oportunidade</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Cliente / Motivo Original</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Responsável</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Prev. Retorno</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Valor Est. / Recup.</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Situação Atual</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Registrar Contato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recoverableList.map((l) => {
                      const attempts = recoveryAttempts.filter((a) => a.lost_opportunity_id === l.id);
                      const last = attempts[0];
                      return (
                        <tr key={l.id} className="hover:bg-slate-50 align-top">
                          <td className="px-4 py-2.5 font-mono font-semibold text-[#1B2E5E] whitespace-nowrap">
                            {l.identificador}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-slate-900">{l.cliente_nome}</div>
                            <div className="text-[11px] text-slate-500">{l.motivo_principal_nome}</div>
                            {last ? (
                              <div className="text-[11px] text-slate-600 mt-1">
                                Último contato ({formatDateBR(last.data_retorno)}): {last.contato_realizado || last.motivo_tentativa}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-2.5 text-slate-700">{l.vendedor_nome}</td>
                          <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                            {formatDateBR(l.data_prevista_abordagem)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                            <div>{formatCurrencyBRL(l.valor_estimado, 'Não informado')}</div>
                            {l.valor_recuperado !== null ? (
                              <div className="text-[11px] text-emerald-700 font-semibold">
                                Recup.: {formatCurrencyBRL(l.valor_recuperado)}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`font-medium ${
                                l.status_perda === 'recuperada'
                                  ? 'text-emerald-700'
                                  : l.status_perda === 'em_recuperacao'
                                    ? 'text-amber-700'
                                    : 'text-slate-700'
                              }`}
                            >
                              {LOSS_STATUS_LABELS[l.status_perda]}
                            </span>
                            <div className="text-[11px] text-slate-500">{attempts.length} tentativa(s)</div>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => openRecoveryModal(l)}
                              className="px-3 py-1.5 bg-[#1B2E5E] hover:bg-[#14234A] text-white rounded-md font-medium whitespace-nowrap"
                            >
                              Registrar Tentativa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'motivos' ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#1B2E5E]">Motivos Padronizados de Perda</h3>
              <p className="text-xs text-slate-500">
                Lista padrão oficial da Autec. Novos motivos exigem autorização de Administrador.
              </p>
            </div>
            {user.role === 'admin' ? (
              <form onSubmit={handleAddReason} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newReasonName}
                  onChange={(e) => setNewReasonName(e.target.value)}
                  placeholder="Novo motivo personalizado..."
                  className="h-9 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
                />
                <button
                  type="submit"
                  disabled={reasonSaving}
                  className="h-9 px-3.5 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-medium rounded-lg whitespace-nowrap"
                >
                  {reasonSaving ? 'Salvando...' : 'Adicionar Motivo'}
                </button>
              </form>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5" />
                <span>Somente Administradores podem criar novos motivos</span>
              </div>
            )}
          </div>
          {reasonError ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{reasonError}</div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {lossReasons.map((r) => (
              <div key={r.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <span className="font-medium text-slate-900">{r.nome}</span>
                <span className="text-[11px] text-slate-500">{r.padrao ? 'Padrão' : 'Customizado'}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Modal: Registrar Perda Comercial */}
      <Modal
        open={lossModalOpen}
        onClose={() => setLossModalOpen(false)}
        title="Registrar Oportunidade Perdida"
        subtitle="Vincule a uma oportunidade existente ou registre diretamente uma perda encerrada."
      >
        <form onSubmit={handleSaveLoss} className="space-y-3">
          {lossError ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{lossError}</div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {linkableOpportunities.length > 0 ? (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Vincular oportunidade existente (opcional)
                </label>
                <select
                  value={lossForm.oportunidade_id}
                  onChange={(e) => handlePickOpportunity(e.target.value)}
                  className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Cadastro manual avulso</option>
                  {linkableOpportunities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.codigo} — {o.cliente_nome} ({formatCurrencyBRL(o.valor)})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Identificador (automático se vazio)</label>
              <input
                type="text"
                value={lossForm.identificador}
                onChange={(e) => setLossForm({ ...lossForm, identificador: e.target.value })}
                placeholder="Ex.: PER-2026-0001"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Vendedor responsável *</label>
              <select
                value={lossForm.vendedor_id}
                disabled={user.role === 'vendedor'}
                onChange={(e) => setLossForm({ ...lossForm, vendedor_id: e.target.value })}
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
                  value={lossForm.cliente_id}
                  onChange={(e) => {
                    const cli = clients.find((c) => c.id === e.target.value);
                    setLossForm({
                      ...lossForm,
                      cliente_id: e.target.value,
                      cliente_nome: cli ? cli.razao_social : '',
                    });
                  }}
                  className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white mb-1.5"
                >
                  <option value="">Selecionar cliente ou digitar abaixo...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razao_social}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                type="text"
                value={lossForm.cliente_nome}
                onChange={(e) => setLossForm({ ...lossForm, cliente_id: '', cliente_nome: e.target.value })}
                placeholder="Nome do cliente"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Produto Autec</label>
              <select
                value={lossForm.produto_id}
                onChange={(e) => setLossForm({ ...lossForm, produto_id: e.target.value })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Não especificado</option>
                <ProductSelectOptions products={products} />
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Valor estimado (R$ · opcional)</label>
              <input
                type="text"
                inputMode="decimal"
                value={lossForm.valor_estimado}
                onChange={(e) => setLossForm({ ...lossForm, valor_estimado: e.target.value })}
                placeholder="Ex.: 24500,00"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data de abertura *</label>
              <input
                type="date"
                value={lossForm.data_abertura}
                onChange={(e) => setLossForm({ ...lossForm, data_abertura: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data do encerramento *</label>
              <input
                type="date"
                value={lossForm.data_encerramento}
                onChange={(e) => setLossForm({ ...lossForm, data_encerramento: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Motivo principal da perda *</label>
              <select
                value={lossForm.motivo_principal_id}
                onChange={(e) => setLossForm({ ...lossForm, motivo_principal_id: e.target.value })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
                required
              >
                {lossReasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Motivo secundário (opcional)</label>
              <select
                value={lossForm.motivo_secundario_id}
                onChange={(e) => setLossForm({ ...lossForm, motivo_secundario_id: e.target.value })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Nenhum</option>
                {lossReasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Concorrente vencedor (quando conhecido)</label>
              <select
                value={lossForm.concorrente_vencedor_id}
                onChange={(e) => setLossForm({ ...lossForm, concorrente_vencedor_id: e.target.value })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Não identificado / Sem concorrente</option>
                {competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Possibilidade de recuperação *</label>
              <select
                value={lossForm.recuperavel}
                onChange={(e) => setLossForm({ ...lossForm, recuperavel: e.target.value as RecoverabilityStatus })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="sim">Sim — Elegível para recuperação</option>
                <option value="avaliar">A avaliar posteriormente</option>
                <option value="nao">Não recuperável</option>
              </select>
            </div>

            {lossForm.recuperavel !== 'nao' ? (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Data prevista para nova abordagem</label>
                <input
                  type="date"
                  value={lossForm.data_prevista_abordagem}
                  onChange={(e) => setLossForm({ ...lossForm, data_prevista_abordagem: e.target.value })}
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                />
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Descrição detalhada da perda</label>
              <textarea
                rows={3}
                value={lossForm.descricao_detalhada}
                onChange={(e) => setLossForm({ ...lossForm, descricao_detalhada: e.target.value })}
                placeholder="Contexto da decisão do cliente, objeções finais e aprendizados..."
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setLossModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={lossSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-[#1B2E5E] hover:bg-[#14234A] rounded-lg"
            >
              {lossSaving ? 'Salvando...' : 'Registrar Perda'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Registrar Tentativa de Recuperação */}
      <Modal
        open={recModalOpen}
        onClose={() => setRecModalOpen(false)}
        title={`Recuperação · ${selectedLostForRec?.identificador || ''}`}
        subtitle={selectedLostForRec ? `Cliente: ${selectedLostForRec.cliente_nome}` : ''}
      >
        <form onSubmit={handleSaveRecovery} className="space-y-3">
          {recError ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{recError}</div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Motivo da tentativa de recuperação *</label>
              <input
                type="text"
                value={recForm.motivo_tentativa}
                onChange={(e) => setRecForm({ ...recForm, motivo_tentativa: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Vendedor responsável *</label>
              <select
                value={recForm.vendedor_responsavel_id}
                disabled={user.role === 'vendedor'}
                onChange={(e) => setRecForm({ ...recForm, vendedor_responsavel_id: e.target.value })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white disabled:bg-slate-50"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data do retorno *</label>
              <input
                type="date"
                value={recForm.data_retorno}
                onChange={(e) => setRecForm({ ...recForm, data_retorno: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Situação atualizada *</label>
              <select
                value={recForm.situacao}
                onChange={(e) =>
                  setRecForm({
                    ...recForm,
                    situacao: e.target.value as 'em_negociacao' | 'recuperada' | 'nao_recuperada',
                  })
                }
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="em_negociacao">Em negociação</option>
                <option value="recuperada">Recuperada</option>
                <option value="nao_recuperada">Não recuperada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Valor recuperado (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={recForm.valor_recuperado}
                onChange={(e) => setRecForm({ ...recForm, valor_recuperado: e.target.value })}
                placeholder="Ex.: 22000,00"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Contato realizado</label>
              <input
                type="text"
                value={recForm.contato_realizado}
                onChange={(e) => setRecForm({ ...recForm, contato_realizado: e.target.value })}
                placeholder="Ex.: Reunião com comprador e gerente de CQ + envio de proposta revisada"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Observações</label>
              <textarea
                rows={2}
                value={recForm.observacoes}
                onChange={(e) => setRecForm({ ...recForm, observacoes: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setRecModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={recSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-[#1B2E5E] hover:bg-[#14234A] rounded-lg"
            >
              {recSaving ? 'Salvando...' : 'Salvar Tentativa'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
