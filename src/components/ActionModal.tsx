import React, { useEffect, useState } from 'react';
import type { ActionCategory, ActionPlan, ActionPriority, ActionPrefill, ActionStatus, User } from '../types';
import { todayISO } from '../utils/formatters';
import { Modal } from './UI';

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
const STATUSES: ActionStatus[] = ['Não iniciada', 'Em andamento', 'Aguardando', 'Concluída', 'Cancelada'];

export function ActionModal({
  open,
  onClose,
  onSave,
  users,
  currentUser,
  editing,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Partial<ActionPlan>, editingId?: string) => Promise<void>;
  users: User[];
  currentUser: User;
  editing?: ActionPlan | null;
  prefill?: ActionPrefill | null;
}) {
  const [titulo, setTitulo] = useState('');
  const [problema, setProblema] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<ActionCategory>('Concorrência');
  const [responsavelId, setResponsavelId] = useState(currentUser.id);
  const [prazo, setPrazo] = useState(todayISO());
  const [prioridade, setPrioridade] = useState<ActionPriority>('Alta');
  const [resultadoEsperado, setResultadoEsperado] = useState('');
  const [indicadorRelacionado, setIndicadorRelacionado] = useState('');
  const [status, setStatus] = useState<ActionStatus>('Não iniciada');
  const [evidencia, setEvidencia] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editing) {
      setTitulo(editing.titulo);
      setProblema(editing.problema_identificado);
      setDescricao(editing.descricao);
      setCategoria(editing.categoria);
      setResponsavelId(editing.responsavel_id);
      setPrazo(editing.prazo_conclusao);
      setPrioridade(editing.prioridade);
      setResultadoEsperado(editing.resultado_esperado);
      setIndicadorRelacionado(editing.indicador_relacionado);
      setStatus(editing.status);
      setEvidencia(editing.evidencia_conclusao || '');
    } else {
      setTitulo(prefill?.titulo || '');
      setProblema(prefill?.problema_identificado || '');
      setDescricao('');
      setCategoria(prefill?.categoria || 'Concorrência');
      setResponsavelId(currentUser.id);
      setPrazo(todayISO());
      setPrioridade('Alta');
      setResultadoEsperado(prefill?.resultado_esperado || '');
      setIndicadorRelacionado(prefill?.indicador_relacionado || '');
      setStatus('Não iniciada');
      setEvidencia('');
    }
  }, [open, editing, prefill, currentUser.id]);

  const originType = editing?.origem_tipo || prefill?.origem_tipo || 'manual';
  const originId = editing?.origem_id ?? prefill?.origem_id ?? null;
  const originLabel = editing?.origem_label || prefill?.origem_label || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !problema.trim() || !prazo) {
      setError('Preencha o título da ação, o problema identificado e o prazo de conclusão.');
      return;
    }
    if (status === 'Concluída' && !evidencia.trim()) {
      setError('Ao concluir uma ação, registre a evidência ou observação da conclusão.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(
        {
          titulo: titulo.trim(),
          problema_identificado: problema.trim(),
          origem_tipo: originType,
          origem_id: originId,
          origem_label: originLabel,
          descricao: descricao.trim(),
          categoria,
          responsavel_id: responsavelId,
          prazo_conclusao: prazo,
          prioridade,
          resultado_esperado: resultadoEsperado.trim(),
          indicador_relacionado: indicadorRelacionado.trim(),
          status,
          evidencia_conclusao: evidencia.trim(),
        },
        editing?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar ação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar Ação Comercial' : 'Nova Ação do Plano Comercial'}
      subtitle={
        originLabel
          ? `Origem vinculada: ${originLabel}`
          : 'Transforme diagnósticos comerciais em tarefas executáveis com prazo e responsável.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Título da ação *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Revisar argumentação de TCO para Autoclave AV-75"
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Problema identificado *</label>
            <input
              type="text"
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
              placeholder="Ex.: Aumento de perdas por preço em editais hospitalares"
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Categoria *</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as ActionCategory)}
              className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1B2E5E]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Prioridade *</label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as ActionPriority)}
              className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1B2E5E]"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Responsável *</label>
            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
              disabled={currentUser.role === 'vendedor'}
              className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 focus:outline-none focus:border-[#1B2E5E]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Prazo de conclusão *</label>
            <input
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ActionStatus)}
              className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1B2E5E]"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Indicador relacionado</label>
            <input
              type="text"
              value={indicadorRelacionado}
              onChange={(e) => setIndicadorRelacionado(e.target.value)}
              placeholder="Ex.: Taxa de conversão / Perdas por preço"
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Resultado esperado</label>
            <input
              type="text"
              value={resultadoEsperado}
              onChange={(e) => setResultadoEsperado(e.target.value)}
              placeholder="Ex.: Reduzir incidência de perdas por preço em 15% no próximo trimestre"
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição detalhada da execução</label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Passos práticos, materiais necessários e alinhamento com a equipe..."
              className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
            />
          </div>

          {status === 'Concluída' || editing?.evidencia_conclusao ? (
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Evidência / Observação da conclusão {status === 'Concluída' ? '*' : ''}
              </label>
              <textarea
                rows={2}
                value={evidencia}
                onChange={(e) => setEvidencia(e.target.value)}
                placeholder="Descreva o que foi entregue, documento gerado ou resultado observado (sem alterar vendas históricas)."
                className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-white bg-[#1B2E5E] hover:bg-[#14234A] rounded-lg disabled:opacity-60"
          >
            {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Criar Ação'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
