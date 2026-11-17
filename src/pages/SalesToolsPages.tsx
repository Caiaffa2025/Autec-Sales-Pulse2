import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, ExternalLink, HelpCircle, MessageSquare, Scale, Search, Send, XCircle } from 'lucide-react';
import type { Interaction, LabProfile, Objection, Product } from '../types';
import { api } from '../utils/api';
import { formatCurrencyBRL, formatDateBR } from '../utils/formatters';
import { EmptyState, PageHeader } from '../components/UI';

export { GerarArgumentoPage } from './GerarArgumentoPage';

export function ComparativoTecnicoPage({ products }: { products: Product[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => products.slice(0, 3).map((p) => p.id));
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.categoria))), [products]);
  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter && p.categoria !== categoryFilter) return false;
      if (!q) return true;
      const fab = p.especificacoes?.Fabricante || '';
      return (
        p.nome_equipamento.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        fab.toLowerCase().includes(q)
      );
    });
  }, [products, categoryFilter, search]);

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  const chosen = products.filter((p) => selectedIds.includes(p.id));
  const specKeys = Array.from(new Set(chosen.flatMap((p) => Object.keys(p.especificacoes || {}))));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Comparativo Técnico de Equipamentos"
        subtitle="Compare até 3 equipamentos Autec lado a lado para apoiar especificações e editais"
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          <div className="md:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
            >
              <option value="">Todas as linhas ({products.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({products.filter((p) => p.categoria === cat).length})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nome, código ou fabricante (CAMAG, Biotage, CEM, LUM, Syrris, VICI)..."
              className="w-full h-9 pl-8 pr-3 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <span className="text-[11px] font-mono text-slate-500">{chosen.length}/3</span>
            {chosen.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-500 hover:text-[#1B2E5E] whitespace-nowrap"
              >
                Limpar
              </button>
            ) : null}
          </div>
        </div>

        <div className="max-h-52 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pr-1">
          {visibleProducts.map((p) => {
            const active = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                className={`px-3 py-2 text-left text-xs rounded-lg border transition-colors ${
                  active
                    ? 'bg-[#1B2E5E] text-white border-[#1B2E5E] font-medium'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#1B2E5E]'
                }`}
              >
                <div className={`text-[10px] font-mono ${active ? 'text-slate-200' : 'text-slate-400'}`}>
                  {p.codigo} · {p.categoria}
                </div>
                <div className="truncate font-medium mt-0.5">{p.nome_equipamento}</div>
              </button>
            );
          })}
        </div>
      </div>

      {chosen.length === 0 ? (
        <EmptyState
          icon={<Scale className="w-5 h-5" />}
          title="Selecione ao menos um equipamento"
          description="Escolha até três equipamentos acima para visualizar especificações técnicas, normas atendidas e diferenciais."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-48">Critério</th>
                {chosen.map((p) => (
                  <th key={p.id} className="text-left px-4 py-3 font-bold text-[#1B2E5E] min-w-[220px]">
                    <div>{p.nome_equipamento}</div>
                    <div className="text-[11px] font-mono text-slate-500 font-normal">{p.codigo}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-2.5 font-semibold text-slate-700">Categoria</td>
                {chosen.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-slate-700">
                    {p.categoria}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-slate-700">Faixa de referência</td>
                {chosen.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 font-mono font-semibold text-[#1B2E5E]">
                    {formatCurrencyBRL(p.faixa_preco, 'Sob consulta')}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-slate-700">Normas atendidas</td>
                {chosen.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-slate-700">
                    {p.normas_atendidas || '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-slate-700">Aplicação laboratorial</td>
                {chosen.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-slate-600 leading-relaxed">
                    {p.aplicacao_laboratorial}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-slate-700">Diferenciais comerciais</td>
                {chosen.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-slate-700 leading-relaxed">
                    {p.diferenciais}
                  </td>
                ))}
              </tr>
              {specKeys.map((key) => (
                <tr key={key}>
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{key}</td>
                  {chosen.map((p) => (
                    <td key={p.id} className="px-4 py-2.5 font-mono text-slate-700">
                      {p.especificacoes?.[key] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function HistoricoInteracoesPage({
  interactions,
  onRefresh,
}: {
  interactions: Interaction[];
  onRefresh: () => Promise<void>;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function toggleFunnel(item: Interaction, avancou: boolean) {
    setUpdatingId(item.id);
    try {
      await api.updateInteractionProgress(item.id, {
        avancou_funil: avancou,
        motivo_estagnacao: avancou ? '' : item.motivo_estagnacao || 'Aguardando retorno do cliente',
      });
      await onRefresh();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Histórico de Interações"
        subtitle="Registro de abordagens comerciais, objeções enfrentadas e evolução no funil"
      />
      {interactions.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-5 h-5" />}
          title="Nenhuma interação comercial registrada"
          description="Utilize o Gerador de Argumentos para estruturar abordagens e registrar o avanço de cada negociação."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Data</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Cliente / Vendedor</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Equipamento</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Objeção / Concorrente</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status no Funil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interactions.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 align-top">
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap">{formatDateBR(i.data_interacao)}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-900">{i.cliente_nome}</div>
                      <div className="text-[11px] text-slate-500">{i.vendedor_nome}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{i.produto_nome || 'Não informado'}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{i.tipo_resistencia || '—'}</div>
                      {i.concorrente_citado ? (
                        <div className="text-[11px] text-slate-500">Concorrente: {i.concorrente_citado}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={updatingId === i.id}
                        onClick={() => toggleFunnel(i, true)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] ${
                          i.avancou_funil === true
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                            : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Avançou</span>
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === i.id}
                        onClick={() => toggleFunnel(i, false)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] ${
                          i.avancou_funil === false
                            ? 'bg-red-50 border-red-300 text-red-800 font-semibold'
                            : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Estagnou</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function KnowledgeBasePage({
  products,
  labProfiles,
  objections,
}: {
  products: Product[];
  labProfiles: LabProfile[];
  objections: Objection[];
}) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const filteredObjs = useMemo(
    () =>
      objections.filter(
        (o) =>
          !q ||
          o.tipo_resistencia.toLowerCase().includes(q) ||
          o.objecao_comum.toLowerCase().includes(q) ||
          o.argumento_tecnico.toLowerCase().includes(q)
      ),
    [objections, q]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Knowledge Base Comercial & Técnica"
        subtitle="Playbook de objeções, perfis de laboratório e especificações de referência Autec"
      />
      <div className="bg-white border border-slate-200 rounded-xl p-3.5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por objeção, norma, segmento ou argumento..."
          className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredObjs.map((o) => (
          <div key={o.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 text-xs">
            <div className="text-[11px] font-semibold text-amber-700">{o.tipo_resistencia}</div>
            <h3 className="text-sm font-bold text-[#1B2E5E]">{o.objecao_comum}</h3>
            <p className="text-slate-700 leading-relaxed">{o.argumento_tecnico}</p>
            {o.analogia_venda ? (
              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600">
                <span className="font-semibold text-slate-800">Analogia:</span> {o.analogia_venda}
              </div>
            ) : null}
            {o.pergunta_retorno ? (
              <div className="text-[#1B2E5E] font-medium">Pergunta de retorno: {o.pergunta_retorno}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1B2E5E]">
          <BookOpen className="w-4 h-4" />
          <span>Perfis de Laboratório ({labProfiles.length}) · Equipamentos ({products.length})</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {labProfiles.map((l) => (
            <div key={l.id} className="p-3 border border-slate-200 rounded-lg space-y-1">
              <div className="font-bold text-[#1B2E5E]">{l.nome}</div>
              <div className="text-slate-600">{l.dor_principal}</div>
              <div className="text-slate-500">Recomendados: {l.equipamentos_recomendados}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const QUIZ_QUESTIONS = [
  {
    q: 'Qual equipamento CEM da linha Análise de Processos e Estabilidade possui certificação MAPA para análise rápida de gordura por RMN sem necessidade de desenvolvimento de método?',
    options: ['ORACLE', 'Phoenix BLACK', 'Liberty PRO', 'MARS Xpress 2.0'],
    answer: 0,
  },
  {
    q: 'Na linha de Cromatografia Analítica CAMAG, qual equipamento realiza a transferência online de bandas de placas TLC/HPTLC diretamente para espectrômetro de massas (MS)?',
    options: ['Linomat 5', 'CAMAG – TLC-MS Interface 2', 'Chromatogram Immersion Device 3', 'CAMAG® Glass Reagent Sprayer'],
    answer: 1,
  },
  {
    q: 'Qual solução VICI DBS foi projetada especificamente para fornecer nitrogênio com fluxo, pressão e pureza requeridos por sistemas LC-MS/MS?',
    options: ['Gerador de Ar GC e GT Ultra Zero', 'PG Plus Series', 'Mistral Evolution Series e Whisper Series', 'Estação de Gás FID'],
    answer: 2,
  },
];

export function QuizComercialPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = QUIZ_QUESTIONS.reduce((acc, q, idx) => (answers[idx] === q.answer ? acc + 1 : acc), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quiz Comercial Autec"
        subtitle="Treinamento rápido de domínio técnico e argumentação consultiva"
      />
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 max-w-3xl">
        {QUIZ_QUESTIONS.map((item, idx) => (
          <div key={idx} className="space-y-2.5 pb-4 border-b border-slate-100 last:border-0">
            <div className="text-sm font-semibold text-[#1B2E5E]">
              {idx + 1}. {item.q}
            </div>
            <div className="space-y-1.5">
              {item.options.map((opt, optIdx) => {
                const selected = answers[idx] === optIdx;
                const isCorrect = optIdx === item.answer;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg border transition-colors ${
                      submitted
                        ? isCorrect
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                          : selected
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : 'border-slate-200 text-slate-600'
                        : selected
                          ? 'bg-[#1B2E5E] text-white border-[#1B2E5E]'
                          : 'border-slate-200 text-slate-700 hover:border-[#1B2E5E]'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2">
          {submitted ? (
            <div className="text-sm font-semibold text-[#1B2E5E] flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span>
                Resultado: {score} de {QUIZ_QUESTIONS.length} acerto(s)
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Selecione todas as respostas para validar</span>
          )}
          {submitted ? (
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
              className="px-4 py-2 bg-white border border-slate-200 text-xs font-medium rounded-lg"
            >
              Refazer Quiz
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="px-4 py-2 bg-[#1B2E5E] text-white text-xs font-medium rounded-lg"
            >
              Finalizar Avaliação
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatEquipamentosPage({ products }: { products: Product[] }) {
  const [question, setQuestion] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; productName?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.categoria))), [products]);
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter && p.categoria !== categoryFilter) return false;
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
  }, [products, categoryFilter, search]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendQuery(promptText: string, product?: Product | null) {
    if (loading) return;
    const targetProduct = product === undefined ? selectedProduct : product;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: promptText, productName: targetProduct?.nome_equipamento },
    ]);
    setLoading(true);
    try {
      const res = await api.equipmentChat(promptText, targetProduct?.id);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.reply, productName: targetProduct?.nome_equipamento },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: err instanceof Error ? err.message : 'Erro ao consultar catálogo.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectProduct(p: Product) {
    if (loading) return;
    setSelectedProductId(p.id);
    await sendQuery(`Consultar ficha técnica e diferenciais: ${p.nome_equipamento}`, p);
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion('');
    await sendQuery(q, selectedProduct);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Chat Técnico de Equipamentos"
        subtitle="Clique em qualquer equipamento do catálogo ao lado para obter a ficha e resposta técnica instantânea ou faça uma pergunta livre"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Catálogo clicável ao lado do chat */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl flex flex-col h-[580px]">
          <div className="p-3.5 border-b border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#1B2E5E] uppercase tracking-wide">
                Equipamentos Autec ({filteredProducts.length}/{products.length})
              </h3>
              {(search || categoryFilter) ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-[#1B2E5E]"
                >
                  Limpar filtros
                </button>
              ) : null}
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, código, fabricante..."
                className="w-full h-9 pl-8 pr-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#1B2E5E]"
            >
              <option value="">Todas as linhas ({products.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({products.filter((p) => p.categoria === cat).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {filteredProducts.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-12 px-4">
                Nenhum equipamento encontrado para os filtros aplicados.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = selectedProductId === p.id;
                const fab = p.especificacoes?.Fabricante;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSelectProduct(p)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-[#1B2E5E] text-white border-[#1B2E5E]'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-[#1B2E5E] hover:bg-slate-50'
                    } disabled:opacity-60`}
                  >
                    <div
                      className={`text-[10px] font-mono truncate ${
                        isSelected ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {p.codigo} · {p.categoria}
                      {fab ? ` · ${fab}` : ''}
                    </div>
                    <div className="text-xs font-semibold mt-0.5 leading-snug">{p.nome_equipamento}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Painel do Chat Técnico */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl flex flex-col h-[580px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 rounded-t-xl flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              {selectedProduct ? (
                <>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    Em foco: {selectedProduct.codigo} · {selectedProduct.categoria}
                  </div>
                  <div className="text-xs font-bold text-[#1B2E5E] truncate">
                    {selectedProduct.nome_equipamento}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-[#1B2E5E]">Assistente Técnico do Portfólio Autec</div>
                  <div className="text-[11px] text-slate-500">
                    Selecione um equipamento à esquerda ou pergunte sobre normas, aplicações e técnicas
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedProduct?.especificacoes?.['Página Oficial'] ? (
                <a
                  href={selectedProduct.especificacoes['Página Oficial']}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1B2E5E] hover:underline whitespace-nowrap"
                >
                  <span>autec.com.br</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : null}
              {selectedProduct ? (
                <button
                  type="button"
                  onClick={() => setSelectedProductId(null)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 border border-slate-200 bg-white px-2 py-1 rounded-md whitespace-nowrap"
                >
                  Limpar foco
                </button>
              ) : null}
            </div>
          </div>

          {selectedProduct ? (
            <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap gap-1.5 bg-white">
              {[
                'Quais os principais diferenciais comerciais?',
                'Quais normas e certificações atende?',
                'Como rebater objeção de preço para este modelo?',
              ].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  disabled={loading}
                  onClick={() => sendQuery(quick, selectedProduct)}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:border-[#1B2E5E] hover:text-[#1B2E5E] transition-colors"
                >
                  {quick}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-16 max-w-md mx-auto space-y-2">
                <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
                <div className="font-medium text-slate-700">
                  Clique em qualquer um dos {products.length} equipamentos na lista ao lado
                </div>
                <p className="leading-relaxed">
                  Ao clicar em um modelo, o chat exibe imediatamente sua aplicação laboratorial, normas atendidas, diferenciais comerciais e especificações técnicas.
                </p>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl text-xs whitespace-pre-wrap leading-relaxed max-w-[92%] ${
                    m.role === 'user'
                      ? 'ml-auto bg-[#1B2E5E] text-white'
                      : 'bg-slate-50 text-slate-800 border border-slate-200'
                  }`}
                >
                  {m.text}
                </div>
              ))
            )}
            {loading ? (
              <div className="p-3 rounded-xl text-xs bg-slate-50 text-slate-500 border border-slate-200 max-w-[75%]">
                Consultando especificações técnicas do equipamento...
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleAsk} className="p-3 border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                selectedProduct
                  ? `Perguntar sobre ${selectedProduct.nome_equipamento}...`
                  : 'Digite sua dúvida técnica sobre qualquer equipamento...'
              }
              className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-4 h-9 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Consultando...' : 'Enviar'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
