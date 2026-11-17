import React, { useMemo, useState } from 'react';
import { Briefcase, ExternalLink, Plus, Search, ShieldCheck, Target, Trash2, Trophy, Users } from 'lucide-react';
import type {
  ActionPrefill,
  AuditLog,
  Client,
  Goal,
  Interaction,
  LabProfile,
  Objection,
  Opportunity,
  OpportunityStatus,
  Product,
  User,
  UserRole,
} from '../types';
import { api } from '../utils/api';
import {
  formatCompactBRL,
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
  formatPercent,
  OPPORTUNITY_STATUS_LABELS,
  parseNullableNumber,
  ROLE_LABELS,
  safePercent,
  todayISO,
} from '../utils/formatters';
import { computeSellerPerformance } from '../utils/intelligence';
import { DonutBreakdown, HorizontalBarChart } from '../components/Charts';
import { EmptyState, KpiCard, Modal, PageHeader, ProductSelectOptions } from '../components/UI';

export function CadastrosOportunidadesPage({
  user,
  users,
  clients,
  products,
  opportunities,
  objections,
  onRefresh,
  onOpenNewClient,
  onCreateAction,
  onConvertToLoss,
}: {
  user: User;
  users: User[];
  clients: Client[];
  products: Product[];
  opportunities: Opportunity[];
  objections: Objection[];
  onRefresh: () => Promise<void>;
  onOpenNewClient: () => void;
  onCreateAction: (prefill: ActionPrefill) => void;
  onConvertToLoss: (opp: Opportunity) => void;
}) {
  const [tab, setTab] = useState<'oportunidades' | 'clientes' | 'produtos' | 'objecoes'>('oportunidades');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [oppModalOpen, setOppModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [oppError, setOppError] = useState('');
  const [oppSaving, setOppSaving] = useState(false);

  const productCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoria))),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (productCategoryFilter && p.categoria !== productCategoryFilter) return false;
      if (!q) return true;
      const fab = p.especificacoes?.Fabricante || '';
      return (
        p.nome_equipamento.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.aplicacao_laboratorial.toLowerCase().includes(q) ||
        fab.toLowerCase().includes(q)
      );
    });
  }, [products, productCategoryFilter, productSearch]);
  const [oppForm, setOppForm] = useState({
    cliente_id: '',
    cliente_nome: '',
    vendedor_id: user.id,
    produto_id: products[0]?.id || '',
    valor: '',
    status: 'aberta' as OpportunityStatus,
    data_abertura: todayISO(),
    observacoes: '',
  });

  function openNewOpp() {
    setEditingOpp(null);
    setOppForm({
      cliente_id: clients[0]?.id || '',
      cliente_nome: clients[0]?.razao_social || '',
      vendedor_id: user.id,
      produto_id: products[0]?.id || '',
      valor: '',
      status: 'aberta',
      data_abertura: todayISO(),
      observacoes: '',
    });
    setOppError('');
    setOppModalOpen(true);
  }

  function openEditOpp(o: Opportunity) {
    setEditingOpp(o);
    setOppForm({
      cliente_id: o.cliente_id || '',
      cliente_nome: o.cliente_nome,
      vendedor_id: o.vendedor_id,
      produto_id: o.produto_id || '',
      valor: o.valor !== null && o.valor !== undefined ? String(o.valor) : '',
      status: o.status,
      data_abertura: o.data_abertura,
      observacoes: o.observacoes || '',
    });
    setOppError('');
    setOppModalOpen(true);
  }

  async function handleSaveOpp(e: React.FormEvent) {
    e.preventDefault();
    if (!oppForm.cliente_id && !oppForm.cliente_nome.trim()) {
      setOppError('Informe o cliente da oportunidade.');
      return;
    }
    setOppSaving(true);
    setOppError('');
    try {
      const payload = {
        cliente_id: oppForm.cliente_id || null,
        cliente_nome: oppForm.cliente_nome.trim(),
        vendedor_id: user.role === 'vendedor' ? user.id : oppForm.vendedor_id,
        produto_id: oppForm.produto_id || null,
        valor: parseNullableNumber(oppForm.valor),
        status: oppForm.status,
        data_abertura: oppForm.data_abertura,
        observacoes: oppForm.observacoes.trim(),
      };
      if (editingOpp) {
        await api.updateOpportunity(editingOpp.id, payload);
      } else {
        await api.createOpportunity(payload);
      }
      await onRefresh();
      setOppModalOpen(false);
    } catch (err) {
      setOppError(err instanceof Error ? err.message : 'Erro ao salvar oportunidade.');
    } finally {
      setOppSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Oportunidades & Cadastros"
        subtitle="Gestão de oportunidades do funil comercial, clientes, catálogo de equipamentos e objeções"
        actions={
          <>
            <button
              type="button"
              onClick={onOpenNewClient}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-[#1B2E5E] text-slate-700 text-xs font-medium rounded-lg whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Cliente</span>
            </button>
            <button
              type="button"
              onClick={openNewOpp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-medium rounded-lg whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Oportunidade</span>
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {[
          { id: 'oportunidades', label: `Oportunidades (${opportunities.length})` },
          { id: 'clientes', label: `Clientes (${clients.length})` },
          { id: 'produtos', label: `Equipamentos Autec (${products.length})` },
          { id: 'objecoes', label: `Objeções (${objections.length})` },
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

      {tab === 'oportunidades' ? (
        opportunities.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-5 h-5" />}
            title="Nenhuma oportunidade cadastrada"
            description="Registre suas oportunidades em andamento ou encerradas para alimentar o Dashboard, Performance Comercial e Perdas Comerciais."
            actionLabel="Cadastrar Primeira Oportunidade"
            onAction={openNewOpp}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">Código / Abertura</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Cliente / Vendedor</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Equipamento</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Valor</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Situação</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opportunities.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="font-mono font-semibold text-[#1B2E5E]">{o.codigo}</div>
                        <div className="text-[11px] text-slate-500">{formatDateBR(o.data_abertura)}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900">{o.cliente_nome}</div>
                        <div className="text-[11px] text-slate-500">{o.vendedor_nome}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{o.produto_nome || 'Não informado'}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                        {formatCurrencyBRL(o.valor, 'Não informado')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-medium ${
                            o.status === 'ganha'
                              ? 'text-emerald-700'
                              : o.status === 'perdida'
                                ? 'text-red-700'
                                : 'text-[#1B2E5E]'
                          }`}
                        >
                          {OPPORTUNITY_STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-3">
                        <button
                          type="button"
                          onClick={() => openEditOpp(o)}
                          className="text-[#1B2E5E] hover:underline font-medium"
                        >
                          Editar
                        </button>
                        {o.status !== 'ganha' ? (
                          <button
                            type="button"
                            onClick={() => onConvertToLoss(o)}
                            className="text-red-700 hover:underline font-medium"
                          >
                            Registrar Perda
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : null}

      {tab === 'clientes' ? (
        clients.length === 0 ? (
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="Nenhum cliente cadastrado"
            description="Cadastre laboratórios e empresas clientes para vincular oportunidades, ocorrências e perdas."
            actionLabel="Cadastrar Primeiro Cliente"
            onAction={onOpenNewClient}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Razão Social</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Segmento</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Cidade / UF</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-[#1B2E5E]">{c.razao_social}</div>
                      {c.cnpj ? <div className="text-[11px] font-mono text-slate-500">{c.cnpj}</div> : null}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{c.segmento || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {c.cidade ? `${c.cidade}${c.uf ? `/${c.uf}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {c.contato_nome || '—'} {c.contato_email ? `· ${c.contato_email}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      {tab === 'produtos' ? (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar por equipamento, código, fabricante ou aplicação..."
                  className="w-full h-9 pl-8 pr-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
                />
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                Exibindo {filteredProducts.length} de {products.length} equipamentos
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setProductCategoryFilter('')}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors whitespace-nowrap ${
                  productCategoryFilter === ''
                    ? 'bg-[#1B2E5E] text-white border-[#1B2E5E] font-medium'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#1B2E5E]'
                }`}
              >
                Todas as Linhas ({products.length})
              </button>
              {productCategories.map((cat) => {
                const count = products.filter((p) => p.categoria === cat).length;
                const active = productCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProductCategoryFilter(active ? '' : cat)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#1B2E5E] text-white border-[#1B2E5E] font-medium'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-[#1B2E5E]'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="w-5 h-5" />}
              title="Nenhum equipamento encontrado"
              description="Ajuste o filtro de linha ou termo de busca para visualizar outros equipamentos do catálogo Autec."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((p) => {
                const manufacturer = p.especificacoes?.Fabricante;
                const officialUrl = p.especificacoes?.['Página Oficial'];
                return (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {p.codigo} · {p.categoria}
                            {manufacturer ? ` · ${manufacturer}` : ''}
                          </div>
                          <h3 className="text-sm font-bold text-[#1B2E5E] mt-0.5">{p.nome_equipamento}</h3>
                        </div>
                        <span className="font-mono font-semibold text-slate-900 shrink-0">
                          {formatCurrencyBRL(p.faixa_preco, 'Sob consulta')}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{p.aplicacao_laboratorial}</p>
                      <div className="text-slate-500">Normas/Referências: {p.normas_atendidas}</div>
                    </div>
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                      {officialUrl ? (
                        <a
                          href={officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-[#1B2E5E] font-medium"
                        >
                          <span>autec.com.br</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onCreateAction({
                            titulo: `Plano comercial para ${p.nome_equipamento}`,
                            problema_identificado: `Ação vinculada ao produto ${p.codigo}.`,
                            origem_tipo: 'produto',
                            origem_id: p.id,
                            origem_label: `Produto: ${p.nome_equipamento}`,
                            categoria: 'Produto',
                          })
                        }
                        className="text-[#1B2E5E] font-medium hover:underline"
                      >
                        Criar Ação deste Produto
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'objecoes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objections.map((o) => (
            <div key={o.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 text-xs">
              <div className="font-semibold text-amber-700">{o.tipo_resistencia}</div>
              <div className="text-sm font-bold text-[#1B2E5E]">{o.objecao_comum}</div>
              <p className="text-slate-600">{o.argumento_tecnico}</p>
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    onCreateAction({
                      titulo: `Reforçar contorno à objeção: ${o.tipo_resistencia}`,
                      problema_identificado: o.objecao_comum,
                      origem_tipo: 'objecao',
                      origem_id: o.id,
                      origem_label: `Objeção: ${o.tipo_resistencia}`,
                      categoria: 'Treinamento',
                    })
                  }
                  className="text-[#1B2E5E] font-medium hover:underline"
                >
                  Criar Ação a partir da Objeção
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Modal: Nova / Editar Oportunidade */}
      <Modal
        open={oppModalOpen}
        onClose={() => setOppModalOpen(false)}
        title={editingOpp ? `Editar ${editingOpp.codigo}` : 'Nova Oportunidade Comercial'}
      >
        <form onSubmit={handleSaveOpp} className="space-y-3">
          {oppError ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{oppError}</div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Cliente *</label>
              {clients.length > 0 ? (
                <select
                  value={oppForm.cliente_id}
                  onChange={(e) => {
                    const cli = clients.find((c) => c.id === e.target.value);
                    setOppForm({
                      ...oppForm,
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
                value={oppForm.cliente_nome}
                onChange={(e) => setOppForm({ ...oppForm, cliente_id: '', cliente_nome: e.target.value })}
                placeholder="Nome do cliente"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Vendedor responsável *</label>
              <select
                value={oppForm.vendedor_id}
                disabled={user.role === 'vendedor' || Boolean(editingOpp)}
                onChange={(e) => setOppForm({ ...oppForm, vendedor_id: e.target.value })}
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Equipamento Autec</label>
              <select
                value={oppForm.produto_id}
                onChange={(e) => setOppForm({ ...oppForm, produto_id: e.target.value })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Não especificado</option>
                <ProductSelectOptions products={products} />
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Valor estimado (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={oppForm.valor}
                onChange={(e) => setOppForm({ ...oppForm, valor: e.target.value })}
                placeholder="Ex.: 18500,00"
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Situação *</label>
              <select
                value={oppForm.status}
                onChange={(e) => setOppForm({ ...oppForm, status: e.target.value as OpportunityStatus })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="aberta">Aberta</option>
                <option value="proposta_enviada">Proposta Enviada</option>
                <option value="em_negociacao">Em Negociação</option>
                <option value="ganha">Ganha</option>
                <option value="perdida">Perdida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data de abertura *</label>
              <input
                type="date"
                value={oppForm.data_abertura}
                onChange={(e) => setOppForm({ ...oppForm, data_abertura: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Observações</label>
              <textarea
                rows={2}
                value={oppForm.observacoes}
                onChange={(e) => setOppForm({ ...oppForm, observacoes: e.target.value })}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setOppModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={oppSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-[#1B2E5E] hover:bg-[#14234A] rounded-lg"
            >
              {oppSaving ? 'Salvando...' : 'Salvar Oportunidade'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function CockpitGestorPage({
  users,
  opportunities,
  interactions,
  goals,
}: {
  users: User[];
  opportunities: Opportunity[];
  interactions: Interaction[];
  goals: Goal[];
}) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const won = opportunities.filter((o) => o.status === 'ganha');
  const lost = opportunities.filter((o) => o.status === 'perdida');
  const open = opportunities.filter((o) => ['aberta', 'proposta_enviada', 'em_negociacao'].includes(o.status));
  const proposals = opportunities.filter((o) => o.status === 'proposta_enviada');
  const faturamento = won.reduce((a, o) => a + (o.valor ?? 0), 0);
  const metaMensal = goals
    .filter((g) => g.tipo === 'faturamento' && g.periodo_mes === currentMonth && g.periodo_ano === currentYear)
    .reduce((a, g) => a + g.valor_meta, 0);
  const atingimento = safePercent(faturamento, metaMensal);
  const conversao = safePercent(won.length, won.length + lost.length);
  const ticketMedio = won.length > 0 ? faturamento / won.length : null;
  const followupsPendentes = interactions.filter((i) => i.avancou_funil === null).length;

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const dayOfMonth = Math.max(1, now.getDate());
  const projecao = faturamento > 0 ? (faturamento / dayOfMonth) * daysInMonth : 0;

  const sellerPerf = computeSellerPerformance(users, opportunities, interactions, [], []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cockpit do Gestor"
        subtitle={`Visão consolidada da operação comercial — ${String(currentMonth).padStart(2, '0')}/${currentYear}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Faturamento realizado" value={formatCurrencyBRL(faturamento, 'R$ 0,00')} tone="navy" />
        <KpiCard
          label="Meta mensal"
          value={formatCurrencyBRL(metaMensal, 'R$ 0,00')}
          subtitle={metaMensal > 0 ? `${formatPercent(atingimento)} atingido` : 'Sem meta definida'}
        />
        <KpiCard label="Vendas fechadas" value={won.length} tone="positive" />
        <KpiCard label="Oportunidades abertas" value={open.length} />
        <KpiCard label="Propostas enviadas" value={proposals.length} />
        <KpiCard label="Negociações ganhas" value={won.length} tone="positive" />
        <KpiCard label="Taxa de conversão" value={formatPercent(conversao)} />
        <KpiCard label="Ticket médio" value={formatCurrencyBRL(ticketMedio, '—')} />
        <KpiCard label="Atividades realizadas" value={interactions.length} />
        <KpiCard label="Follow-ups pendentes" value={followupsPendentes} tone={followupsPendentes > 0 ? 'warning' : 'neutral'} />
        <KpiCard label="Negociações perdidas" value={lost.length} tone={lost.length > 0 ? 'danger' : 'neutral'} />
        <KpiCard
          label="Projeção de faturamento"
          value={formatCurrencyBRL(projecao, 'R$ 0,00')}
          subtitle="Ritmo matemático no mês"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Faturamento vs Meta</h3>
          <HorizontalBarChart
            data={
              faturamento > 0 || metaMensal > 0
                ? [
                    { label: 'Realizado', value: faturamento, color: '#1B2E5E' },
                    { label: 'Meta Mensal', value: metaMensal, color: '#F59E0B' },
                  ]
                : []
            }
            formatValue={(v) => formatCompactBRL(v)}
            emptyMessage="Cadastre metas em Gestão de Metas e feche oportunidades para comparar Realizado vs Meta."
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Distribuição do Funil</h3>
          <DonutBreakdown
            slices={[
              { label: 'Abertas', value: opportunities.filter((o) => o.status === 'aberta').length, color: '#3B82F6' },
              { label: 'Propostas', value: proposals.length, color: '#8B5CF6' },
              {
                label: 'Em Negociação',
                value: opportunities.filter((o) => o.status === 'em_negociacao').length,
                color: '#F59E0B',
              },
              { label: 'Ganhas', value: won.length, color: '#10B981' },
              { label: 'Perdidas', value: lost.length, color: '#EF4444' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#1B2E5E] mb-4">Top Vendedores por Faturamento</h3>
        <HorizontalBarChart
          data={sellerPerf
            .filter((s) => s.valorGanho > 0)
            .slice(0, 6)
            .map((s) => ({
              label: s.vendedor_nome,
              value: s.valorGanho,
              secondaryLabel: `${s.ganhas} venda(s)`,
            }))}
          formatValue={(v) => formatCompactBRL(v)}
          emptyMessage="Sem vendas fechadas registradas."
        />
      </div>
    </div>
  );
}

export function RankingMetasPage({
  mode,
  users,
  opportunities,
  interactions,
  goals,
  onRefresh,
}: {
  mode: 'ranking' | 'metas';
  users: User[];
  opportunities: Opportunity[];
  interactions: Interaction[];
  goals: Goal[];
  onRefresh: () => Promise<void>;
}) {
  const sellerPerf = computeSellerPerformance(users, opportunities, interactions, [], []);
  const [form, setForm] = useState({
    escopo: 'individual' as 'global' | 'equipe' | 'individual',
    tipo: 'faturamento' as 'faturamento' | 'vendas' | 'propostas',
    vendedor_id: users.find((u) => u.role === 'vendedor')?.id || users[0]?.id || '',
    equipe: 'Equipe Sudeste',
    periodo_mes: new Date().getMonth() + 1,
    periodo_ano: new Date().getFullYear(),
    valor_meta: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    const val = parseNullableNumber(form.valor_meta);
    if (!val || val <= 0) {
      setError('Informe um valor positivo para a meta.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.createGoal({ ...form, valor_meta: val });
      setForm((prev) => ({ ...prev, valor_meta: '' }));
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar meta.');
    } finally {
      setSaving(false);
    }
  }

  if (mode === 'ranking') {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Ranking de Vendedores"
          subtitle="Consolidado de receita ganha, volume de oportunidades e conversão contextual"
        />
        {sellerPerf.every((s) => s.totalOportunidades === 0) ? (
          <EmptyState
            icon={<Trophy className="w-5 h-5" />}
            title="Sem movimentações comerciais para ranquear"
            description="Cadastre oportunidades comerciais para comparar resultados da equipe."
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">#</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Vendedor</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Oportunidades</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Ganhas</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Conversão</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Faturamento Ganho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellerPerf.map((s, idx) => (
                  <tr key={s.vendedor_id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono font-bold text-[#1B2E5E]">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{s.vendedor_nome}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{s.totalOportunidades}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{s.ganhas}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatPercent(s.taxaConversao)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">
                      {formatCurrencyBRL(s.valorGanho, 'R$ 0,00')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Gestão de Metas" subtitle="Definição de metas mensais globais, por equipe ou individuais" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <form onSubmit={handleCreateGoal} className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#1B2E5E]">Nova Meta</h3>
          {error ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
          ) : null}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Escopo</label>
            <select
              value={form.escopo}
              onChange={(e) => setForm({ ...form, escopo: e.target.value as typeof form.escopo })}
              className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="individual">Individual</option>
              <option value="equipe">Equipe</option>
              <option value="global">Global Autec</option>
            </select>
          </div>
          {form.escopo === 'individual' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Vendedor</label>
              <select
                value={form.vendedor_id}
                onChange={(e) => setForm({ ...form, vendedor_id: e.target.value })}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de meta</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}
              className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="faturamento">Faturamento (R$)</option>
              <option value="vendas">Quantidade de vendas</option>
              <option value="propostas">Propostas enviadas</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mês</label>
              <input
                type="number"
                min={1}
                max={12}
                value={form.periodo_mes}
                onChange={(e) => setForm({ ...form, periodo_mes: Number(e.target.value) })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ano</label>
              <input
                type="number"
                min={2024}
                max={2035}
                value={form.periodo_ano}
                onChange={(e) => setForm({ ...form, periodo_ano: Number(e.target.value) })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Valor da meta *</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.valor_meta}
              onChange={(e) => setForm({ ...form, valor_meta: e.target.value })}
              placeholder="Ex.: 120000,00"
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg font-mono"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full h-9 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-semibold rounded-lg"
          >
            {saving ? 'Salvando...' : 'Definir Meta'}
          </button>
        </form>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {goals.length === 0 ? (
            <EmptyState
              icon={<Target className="w-5 h-5" />}
              title="Nenhuma meta definida"
              description="Defina metas mensais ao lado para acompanhar o atingimento no Cockpit do Gestor."
            />
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Competência</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Escopo / Alvo</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Tipo</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Valor</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Remover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {goals.map((g) => (
                  <tr key={g.id}>
                    <td className="px-4 py-2.5 font-mono">
                      {String(g.periodo_mes).padStart(2, '0')}/{g.periodo_ano}
                    </td>
                    <td className="px-4 py-2.5">
                      {g.escopo === 'individual' ? g.vendedor_nome : g.escopo === 'equipe' ? g.equipe : 'Global Autec'}
                    </td>
                    <td className="px-4 py-2.5 capitalize">{g.tipo}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">
                      {g.tipo === 'faturamento' ? formatCurrencyBRL(g.valor_meta) : g.valor_meta}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          await api.deleteGoal(g.id);
                          await onRefresh();
                        }}
                        className="text-slate-400 hover:text-red-700"
                        aria-label="Excluir meta"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminColaboradoresPage({
  currentUser,
  users,
  auditLogs,
  onRefresh,
}: {
  currentUser: User;
  users: User[];
  auditLogs: AuditLog[];
  onRefresh: () => Promise<void>;
}) {
  const [tab, setTab] = useState<'usuarios' | 'auditoria'>('usuarios');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'vendedor' as UserRole,
    equipe: 'Equipe Sudeste',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.createUser(form);
      setForm({ full_name: '', email: '', password: '', role: 'vendedor', equipe: 'Equipe Sudeste' });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(u: User) {
    setError('');
    try {
      await api.updateUser(u.id, { ativo: !u.ativo });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário.');
    }
  }

  async function handleChangeRole(u: User, role: UserRole) {
    setError('');
    try {
      await api.updateUser(u.id, { role });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil.');
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Colaboradores, Permissões & Auditoria"
        subtitle={`Gestão de até 20 usuários (${users.length}/20 cadastrados) com controle RBAC aplicado no servidor`}
      />

      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab('usuarios')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            tab === 'usuarios' ? 'bg-white text-[#1B2E5E] shadow-xs' : 'text-slate-600'
          }`}
        >
          Usuários ({users.length}/20)
        </button>
        <button
          type="button"
          onClick={() => setTab('auditoria')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            tab === 'auditoria' ? 'bg-white text-[#1B2E5E] shadow-xs' : 'text-slate-600'
          }`}
        >
          Histórico de Alterações ({auditLogs.length})
        </button>
      </div>

      {error ? (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
      ) : null}

      {tab === 'usuarios' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form onSubmit={handleCreateUser} className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1B2E5E]">
              <ShieldCheck className="w-4 h-4" />
              <span>Novo Usuário</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome completo *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">E-mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Senha inicial (mín. 6) *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Perfil *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="gestor">Gestor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Equipe</label>
                <input
                  type="text"
                  value={form.equipe}
                  onChange={(e) => setForm({ ...form, equipe: e.target.value })}
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || users.length >= 20}
              className="w-full h-9 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              {users.length >= 20 ? 'Limite de 20 usuários atingido' : saving ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Colaborador</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Equipe</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Perfil</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{u.equipe}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={u.role}
                        disabled={u.id === currentUser.id}
                        onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                        className="h-7 px-2 text-xs border border-slate-200 rounded-md bg-white disabled:bg-slate-50"
                      >
                        <option value="vendedor">Vendedor</option>
                        <option value="gestor">Gestor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={u.ativo ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {u.id !== currentUser.id ? (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          className="text-[#1B2E5E] hover:underline font-medium"
                        >
                          {u.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      ) : (
                        <span className="text-slate-400">Sessão atual</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Data / Hora</th>
                <th className="text-left px-4 py-2.5 font-semibold">Usuário</th>
                <th className="text-left px-4 py-2.5 font-semibold">Operação</th>
                <th className="text-left px-4 py-2.5 font-semibold">Entidade</th>
                <th className="text-left px-4 py-2.5 font-semibold">Resumo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono whitespace-nowrap">{formatDateTimeBR(log.created_at)}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-slate-900">{log.user_name}</span>{' '}
                    <span className="text-slate-400">({ROLE_LABELS[log.user_role] || log.user_role})</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-[#1B2E5E]">{log.operation}</td>
                  <td className="px-4 py-2.5 text-slate-600">{log.entity_type}</td>
                  <td className="px-4 py-2.5 text-slate-700">{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
