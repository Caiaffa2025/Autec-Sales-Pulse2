import React, { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, CheckSquare, Columns3, List, Plus, Trash2 } from 'lucide-react';
import type { ActionCategory, ActionPlan, ActionPriority, ActionStatus, User } from '../types';
import { api } from '../utils/api';
import { formatDateBR, formatPercent } from '../utils/formatters';
import { computeActionSummary, isActionOverdue } from '../utils/intelligence';
import { HorizontalBarChart } from '../components/Charts';
import { EmptyState, KpiCard, Modal, PageHeader } from '../components/UI';

const KANBAN_COLUMNS: ActionStatus[] = ['Não iniciada', 'Em andamento', 'Aguardando', 'Concluída'];

const CATEGORIES: ActionCategory[] = [
  'Concorrência',
  'Preço',
  'Produto',
  'Logística',
  'Atendimento',
  'Treinamento',
  'Recuperação de clientes',
  'Conversão comercial',
  'Processo interno',
  'Outros',
];

const PRIORITIES: ActionPriority[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

export function ActionPlanPage({
  user,
  users,
  actions,
  onNewAction,
  onEditAction,
  onRefresh,
}: {
  user: User;
  users: User[];
  actions: ActionPlan[];
  onNewAction: () => void;
  onEditAction: (action: ActionPlan) => void;
  onRefresh: () => Promise<void>;
}) {
  const [viewMode, setViewMode] = useState<'kanban' | 'tabela' | 'painel'>('kanban');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');

  // Complete action evidence modal
  const [completingAction, setCompletingAction] = useState<ActionPlan | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [completeError, setCompleteError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      if (filterOwner && a.responsavel_id !== filterOwner) return false;
      if (filterCategory && a.categoria !== filterCategory) return false;
      if (filterPriority && a.prioridade !== filterPriority) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterOrigin && a.origem_tipo !== filterOrigin) return false;
      return true;
    });
  }, [actions, filterOwner, filterCategory, filterPriority, filterStatus, filterOrigin]);

  const summary = useMemo(() => computeActionSummary(filteredActions), [filteredActions]);

  async function handleQuickMoveStatus(action: ActionPlan, nextStatus: ActionStatus) {
    if (nextStatus === 'Concluída') {
      setCompletingAction(action);
      setEvidenceText(action.evidencia_conclusao || '');
      setCompleteError('');
      return;
    }
    setBusyId(action.id);
    try {
      await api.updateActionPlan(action.id, { status: nextStatus });
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!completingAction) return;
    if (!evidenceText.trim()) {
      setCompleteError('Registre a evidência ou observação da conclusão.');
      return;
    }
    setBusyId(completingAction.id);
    try {
      await api.updateActionPlan(completingAction.id, {
        status: 'Concluída',
        evidencia_conclusao: evidenceText.trim(),
      });
      await onRefresh();
      setCompletingAction(null);
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : 'Erro ao concluir ação.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(action: ActionPlan) {
    setBusyId(action.id);
    try {
      await api.deleteActionPlan(action.id);
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  }

  function priorityTone(p: ActionPriority): string {
    if (p === 'Crítica') return 'text-red-700 font-semibold';
    if (p === 'Alta') return 'text-amber-700 font-semibold';
    if (p === 'Média') return 'text-[#1B2E5E] font-medium';
    return 'text-slate-500';
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Plano de Ação Comercial"
        subtitle="Desdobramento de diagnósticos competitivos, perdas e desempenho em tarefas acompanháveis"
        actions={
          <>
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md ${
                  viewMode === 'kanban' ? 'bg-white text-[#1B2E5E] shadow-xs' : 'text-slate-600'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tabela')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md ${
                  viewMode === 'tabela' ? 'bg-white text-[#1B2E5E] shadow-xs' : 'text-slate-600'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('painel')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md ${
                  viewMode === 'painel' ? 'bg-white text-[#1B2E5E] shadow-xs' : 'text-slate-600'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Indicadores</span>
              </button>
            </div>
            <button
              type="button"
              onClick={onNewAction}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-medium rounded-lg whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Ação</span>
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Ações abertas" value={summary.openCount} subtitle="Em execução ou fila" tone="navy" />
        <KpiCard label="Concluídas" value={summary.completedCount} subtitle="Com evidência registrada" tone="positive" />
        <KpiCard
          label="Atrasadas"
          value={summary.overdueCount}
          subtitle="Prazo vencido"
          tone={summary.overdueCount > 0 ? 'danger' : 'neutral'}
        />
        <KpiCard
          label="Ações críticas"
          value={summary.criticalCount}
          subtitle="Prioridade máxima"
          tone={summary.criticalCount > 0 ? 'warning' : 'neutral'}
        />
        <KpiCard
          label="Taxa de conclusão"
          value={formatPercent(summary.completionPct)}
          subtitle={`${summary.completedCount} de ${summary.total} ativas`}
        />
        <KpiCard
          label="Próx. vencimentos"
          value={summary.upcomingCount}
          subtitle="Vencem nos próx. 7 dias"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Responsável</label>
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Categoria</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Prioridade</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Todas</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Todos</option>
            {['Não iniciada', 'Em andamento', 'Aguardando', 'Concluída', 'Cancelada'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Origem do diagnóstico</label>
          <select
            value={filterOrigin}
            onChange={(e) => setFilterOrigin(e.target.value)}
            className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Todas as origens</option>
            <option value="concorrente">Concorrente</option>
            <option value="oportunidade_perdida">Oportunidade Perdida</option>
            <option value="objecao">Objeção Recorrente</option>
            <option value="desempenho">Desempenho</option>
            <option value="produto">Produto</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {filteredActions.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-5 h-5" />}
          title="Nenhuma ação cadastrada para os filtros atuais"
          description="Crie ações diretamente aqui ou a partir dos módulos Radar de Concorrentes, Perdas Comerciais e Performance Comercial para vincular automaticamente o diagnóstico de origem."
          actionLabel="Criar Primeira Ação"
          onAction={onNewAction}
        />
      ) : null}

      {filteredActions.length > 0 && viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {KANBAN_COLUMNS.map((colStatus) => {
            const colItems = filteredActions.filter((a) => a.status === colStatus);
            return (
              <div key={colStatus} className="bg-slate-100/80 border border-slate-200 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-[#1B2E5E]">{colStatus}</h3>
                  <span className="text-xs font-mono text-slate-500">{colItems.length}</span>
                </div>
                {colItems.length === 0 ? (
                  <div className="py-6 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/50">
                    Sem ações nesta coluna
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {colItems.map((a) => {
                      const overdue = isActionOverdue(a);
                      return (
                        <div
                          key={a.id}
                          className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onEditAction(a)}
                              className="text-left text-xs font-semibold text-[#1B2E5E] hover:underline leading-snug"
                            >
                              {a.titulo}
                            </button>
                            <span className={`text-[11px] shrink-0 ${priorityTone(a.prioridade)}`}>{a.prioridade}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{a.problema_identificado}</p>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div>
                              {a.categoria} · {a.responsavel_nome}
                            </div>
                            <div className={overdue ? 'text-red-700 font-semibold' : ''}>
                              Prazo: {formatDateBR(a.prazo_conclusao)} {overdue ? '· Atrasada' : ''}
                            </div>
                            {a.origem_label ? (
                              <div className="text-slate-400 truncate">Origem: {a.origem_label}</div>
                            ) : null}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <select
                              value={a.status}
                              disabled={busyId === a.id}
                              onChange={(e) => handleQuickMoveStatus(a, e.target.value as ActionStatus)}
                              aria-label={`Alterar status de ${a.titulo}`}
                              className="h-7 px-2 text-[11px] border border-slate-200 rounded-md bg-white text-slate-700"
                            >
                              {['Não iniciada', 'Em andamento', 'Aguardando', 'Concluída', 'Cancelada'].map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => onEditAction(a)}
                              className="text-[11px] font-medium text-[#1B2E5E] hover:underline"
                            >
                              Detalhes
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {filteredActions.length > 0 && viewMode === 'tabela' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Ação / Problema</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Categoria / Origem</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Responsável</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Prazo</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Prioridade</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActions.map((a) => {
                  const overdue = isActionOverdue(a);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 align-top">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-[#1B2E5E]">{a.titulo}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{a.problema_identificado}</div>
                        {a.evidencia_conclusao ? (
                          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Evidência: {a.evidencia_conclusao}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-800">{a.categoria}</div>
                        <div className="text-[11px] text-slate-500">{a.origem_label || a.origem_tipo}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{a.responsavel_nome}</td>
                      <td className={`px-4 py-2.5 font-mono whitespace-nowrap ${overdue ? 'text-red-700 font-semibold' : ''}`}>
                        {formatDateBR(a.prazo_conclusao)}
                        {overdue ? ' (Atrasada)' : ''}
                      </td>
                      <td className={`px-4 py-2.5 ${priorityTone(a.prioridade)}`}>{a.prioridade}</td>
                      <td className="px-4 py-2.5">
                        <select
                          value={a.status}
                          disabled={busyId === a.id}
                          onChange={(e) => handleQuickMoveStatus(a, e.target.value as ActionStatus)}
                          className="h-7 px-2 text-xs border border-slate-200 rounded-md bg-white"
                        >
                          {['Não iniciada', 'Em andamento', 'Aguardando', 'Concluída', 'Cancelada'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => onEditAction(a)}
                          className="text-[#1B2E5E] font-medium hover:underline"
                        >
                          Editar
                        </button>
                        {user.role !== 'vendedor' ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(a)}
                            aria-label="Excluir ação"
                            className="text-slate-400 hover:text-red-700 inline-flex items-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {filteredActions.length > 0 && viewMode === 'painel' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Ações por Responsável</h3>
            <div className="space-y-3">
              {summary.byOwner.map((o) => (
                <div key={o.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs">
                  <span className="font-medium text-slate-900">{o.label}</span>
                  <span className="font-mono tabular-nums text-slate-600">
                    {o.abertas} abertas · {o.concluidas} concluídas ·{' '}
                    <span className={o.atrasadas > 0 ? 'text-red-700 font-semibold' : ''}>
                      {o.atrasadas} atrasadas
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Ações por Categoria</h3>
            <HorizontalBarChart
              data={summary.byCategory.map((c) => ({
                label: c.label,
                value: c.count,
              }))}
              formatValue={(v) => `${v} ação(ões)`}
            />
          </div>
        </div>
      ) : null}

      {/* Modal: Registrar Evidência ao Concluir Ação */}
      <Modal
        open={Boolean(completingAction)}
        onClose={() => setCompletingAction(null)}
        title="Concluir Ação Comercial"
        subtitle={completingAction ? completingAction.titulo : ''}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleConfirmComplete} className="space-y-3">
          {completeError ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{completeError}</div>
          ) : null}
          <p className="text-xs text-slate-600">
            Registre a evidência de execução ou resultado observado. A conclusão desta ação fica registrada no histórico sem alterar resultados históricos de vendas.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Evidência ou observação da conclusão *</label>
            <textarea
              rows={3}
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              placeholder="Ex.: Guia de argumentação TCO publicado e treinado com toda a equipe em 15/11/2026."
              className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCompletingAction(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={Boolean(busyId)}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
            >
              Confirmar Conclusão
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
