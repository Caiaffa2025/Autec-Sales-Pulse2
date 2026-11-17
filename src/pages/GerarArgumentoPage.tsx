import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { Client, Competitor, Interaction, LabProfile, Objection, Product, User } from '../types';
import { api } from '../utils/api';
import {
  buildArgumentCacheKey,
  buildCompositeToneCacheKey,
  type CachedArgumentEntry,
  clearArgumentCache,
  clearClientProductCache,
  findCachedByCompositeKey,
  getArgumentCacheCount,
  getCachedArgumentsForClientProduct,
  hasCachedToneForClientProduct,
  markCachedEntryAccessed,
  MAX_ENTRIES_PER_CLIENT_PRODUCT,
  removeCachedArgumentEntry,
  setCachedArgument,
} from '../utils/argumentCache';
import { formatDateBR, todayISO } from '../utils/formatters';
import { PageHeader, ProductSelectOptions } from '../components/UI';

const NEGOTIATION_STAGES = [
  'Prospecção / Qualificação Inicial',
  'Apresentação Técnica / Demonstração',
  'Proposta Enviada / Negociação de Preço',
  'Comparação Direta com Concorrente',
  'Licitação / Termo de Referência',
  'Reativação de Negócio Perdido',
];

const ARGUMENT_TONES = [
  'Consultivo & Normativo (ANVISA / ISO / USP)',
  'Foco em TCO & Retorno sobre Investimento',
  'Agilidade, Disponibilidade & Suporte Autec',
  'Comparativo Técnico Direto',
];

const TONE_STYLES: Array<{ value: 'Consultivo' | 'Direto' | 'Persuasivo' | 'Técnico-Analítico'; label: string; desc: string }> = [
  {
    value: 'Consultivo',
    label: 'Consultivo',
    desc: 'Empático e investigativo, valida a dor do laboratório.',
  },
  {
    value: 'Direto',
    label: 'Direto',
    desc: 'Objetivo e enxuto, ideal para decisores sem tempo.',
  },
  {
    value: 'Persuasivo',
    label: 'Persuasivo',
    desc: 'Foco em valor, redução de risco e avanço no fechamento.',
  },
  {
    value: 'Técnico-Analítico',
    label: 'Técnico-Analítico',
    desc: 'Ênfase rigorosa em normas, rastreabilidade e engenharia.',
  },
];

const ARGUMENT_CHANNELS = [
  'Reunião Presencial ou Vídeo',
  'E-mail Comercial Formal',
  'Mensagem Executiva (WhatsApp)',
];

const LOADING_STEPS = [
  { step: 1, label: 'Validando especificações do equipamento e playbook Autec...' },
  { step: 2, label: 'Contextualizando perfil do laboratório, objeção e estilo de tom...' },
  { step: 3, label: 'Estruturando roteiro comercial personalizado com IA...' },
];

interface FormFieldErrors {
  productId?: string;
  resistanceType?: string;
  clientName?: string;
  competitorName?: string;
  customNotes?: string;
  stagnationReason?: string;
  argumentText?: string;
}

function ArgumentSkeleton({ stepIndex }: { stepIndex: number }) {
  const activeStep = LOADING_STEPS[Math.min(stepIndex, LOADING_STEPS.length - 1)];

  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      {/* Granular loading progress header */}
      <div className="p-3 bg-[#1B2E5E]/5 border border-[#1B2E5E]/15 rounded-lg space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1B2E5E]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>{activeStep.label}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 shrink-0">
            Etapa {activeStep.step} de {LOADING_STEPS.length}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1B2E5E] transition-all duration-500 rounded-full"
            style={{ width: `${Math.round((activeStep.step / LOADING_STEPS.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Granular Skeleton blocks mirroring the 3-section script */}
      <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50/60 animate-pulse">
        <div className="space-y-2">
          <div className="h-3.5 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-full bg-slate-200 rounded" />
          <div className="h-3 w-11/12 bg-slate-200 rounded" />
          <div className="h-3 w-4/5 bg-slate-200 rounded" />
        </div>

        <div className="pt-2 border-t border-slate-200/70 space-y-2">
          <div className="h-3.5 w-56 bg-slate-200 rounded" />
          <div className="h-3 w-full bg-slate-200 rounded" />
          <div className="h-3 w-10/12 bg-slate-200 rounded" />
          <div className="h-3 w-3/4 bg-slate-200 rounded" />
        </div>

        <div className="pt-2 border-t border-slate-200/70 space-y-2">
          <div className="h-3.5 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-5/6 bg-slate-200 rounded" />
          <div className="h-3 w-2/3 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function GerarArgumentoPage({
  user,
  clients,
  products,
  labProfiles,
  objections,
  competitors = [],
  interactions = [],
  onSavedInteraction,
}: {
  user: User;
  clients: Client[];
  products: Product[];
  labProfiles: LabProfile[];
  objections: Objection[];
  competitors?: Competitor[];
  interactions?: Interaction[];
  onSavedInteraction: () => Promise<void>;
}) {
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [labId, setLabId] = useState(labProfiles[0]?.id || '');
  const [resistanceType, setResistanceType] = useState(objections[0]?.tipo_resistencia || 'Preço');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedCompetitorId, setSelectedCompetitorId] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [negotiationStage, setNegotiationStage] = useState(NEGOTIATION_STAGES[2]);
  const [tone, setTone] = useState(ARGUMENT_TONES[0]);
  const [toneStyle, setToneStyle] = useState<'Consultivo' | 'Direto' | 'Persuasivo' | 'Técnico-Analítico'>('Consultivo');
  const [channel, setChannel] = useState(ARGUMENT_CHANNELS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [stagnationReason, setStagnationReason] = useState('');

  const [generating, setGenerating] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [argumentText, setArgumentText] = useState('');
  const [cachedHitInfo, setCachedHitInfo] = useState<{
    createdAt: string;
    compositeKey: string;
    toneStyle: string;
    resistanceType: string;
    matchType: 'exact' | 'composite';
  } | null>(null);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const loadingTimersRef = useRef<number[]>([]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.categoria))), [products]);

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
        fab.toLowerCase().includes(q)
      );
    });
  }, [products, productCategoryFilter, productSearch]);

  useEffect(() => {
    if (filteredProducts.length > 0 && !filteredProducts.some((p) => p.id === productId)) {
      setProductId(filteredProducts[0].id);
    } else if (!productId && products.length > 0) {
      setProductId(products[0].id);
    }
  }, [filteredProducts, products, productId]);

  useEffect(() => {
    if (!labId && labProfiles.length > 0) {
      setLabId(labProfiles[0].id);
    }
  }, [labProfiles, labId]);

  useEffect(() => {
    if (!resistanceType && objections.length > 0) {
      setResistanceType(objections[0].tipo_resistencia);
    }
  }, [objections, resistanceType]);

  useEffect(() => {
    return () => {
      loadingTimersRef.current.forEach((t) => window.clearTimeout(t));
      loadingTimersRef.current = [];
    };
  }, []);

  const selectedProduct =
    filteredProducts.find((p) => p.id === productId) || products.find((p) => p.id === productId) || products[0];
  const selectedLab = labProfiles.find((l) => l.id === labId);
  const selectedObjection = objections.find((o) => o.tipo_resistencia === resistanceType);
  const selectedCompetitor = competitors.find((c) => c.id === selectedCompetitorId);
  const activeCompetitors = useMemo(() => competitors.filter((c) => c.status === 'ativo'), [competitors]);
  const resistanceTypes = Array.from(new Set(objections.map((o) => o.tipo_resistencia)));

  const recentArguments = useMemo(
    () => interactions.filter((i) => i.argumento_gerado?.trim()).slice(0, 4),
    [interactions]
  );

  const totalCacheCount = useMemo(() => {
    void cacheVersion;
    return getArgumentCacheCount();
  }, [cacheVersion]);

  const clientProductCachedEntries = useMemo(() => {
    void cacheVersion;
    if (!selectedProduct?.id) return [];
    return getCachedArgumentsForClientProduct(clientId, clientName, selectedProduct.id);
  }, [cacheVersion, clientId, clientName, selectedProduct?.id]);

  const cachedTonesMap = useMemo(() => {
    void cacheVersion;
    const pid = selectedProduct?.id || '';
    const map: Record<string, boolean> = {};
    if (!pid) return map;
    for (const st of TONE_STYLES) {
      map[st.value] = hasCachedToneForClientProduct(clientId, clientName, pid, st.value);
    }
    return map;
  }, [cacheVersion, clientId, clientName, selectedProduct?.id]);

  function validateGenerationInputs(): FormFieldErrors {
    const nextErrors: FormFieldErrors = {};

    if (!selectedProduct || !selectedProduct.id) {
      nextErrors.productId = 'Selecione um equipamento Autec válido do catálogo.';
    }
    if (!resistanceType.trim() || resistanceType.trim().length < 2) {
      nextErrors.resistanceType = 'Selecione um tipo de objeção válido.';
    }

    const trimmedClient = clientName.trim();
    if (trimmedClient && (trimmedClient.length < 2 || trimmedClient.length > 120)) {
      nextErrors.clientName = 'O nome do cliente deve ter entre 2 e 120 caracteres.';
    }

    const trimmedComp = competitorName.trim();
    if (trimmedComp && (trimmedComp.length < 2 || trimmedComp.length > 100)) {
      nextErrors.competitorName = 'O nome do concorrente deve ter entre 2 e 100 caracteres.';
    }

    const trimmedNotes = customNotes.trim();
    if (trimmedNotes && trimmedNotes.length < 5) {
      nextErrors.customNotes = 'Informe ao menos 5 caracteres nos detalhes ou deixe o campo em branco.';
    } else if (trimmedNotes.length > 500) {
      nextErrors.customNotes = 'Os detalhes adicionais devem ter no máximo 500 caracteres.';
    }

    return nextErrors;
  }

  useEffect(() => {
    if (!submittedOnce) return;
    setFieldErrors(validateGenerationInputs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedOnce, productId, resistanceType, clientName, competitorName, customNotes]);

  function startGranularLoadingProgress() {
    loadingTimersRef.current.forEach((t) => window.clearTimeout(t));
    loadingTimersRef.current = [];
    setLoadingStepIdx(0);
    const t1 = window.setTimeout(() => setLoadingStepIdx(1), 450);
    const t2 = window.setTimeout(() => setLoadingStepIdx(2), 1150);
    loadingTimersRef.current.push(t1, t2);
  }

  function stopGranularLoadingProgress() {
    loadingTimersRef.current.forEach((t) => window.clearTimeout(t));
    loadingTimersRef.current = [];
    setLoadingStepIdx(0);
  }

  function applyCachedHit(
    hit: { entry: CachedArgumentEntry; matchType: 'exact' | 'composite' },
    options?: { updateCacheVersion?: boolean }
  ) {
    setArgumentText(hit.entry.argument);
    setCachedHitInfo({
      createdAt: hit.entry.createdAt,
      compositeKey:
        hit.entry.compositeKey ||
        buildCompositeToneCacheKey(
          hit.entry.clientId,
          hit.entry.clientName,
          hit.entry.productId,
          hit.entry.toneStyle
        ),
      toneStyle: hit.entry.toneStyle,
      resistanceType: hit.entry.resistanceType,
      matchType: hit.matchType,
    });
    if (options?.updateCacheVersion !== false) {
      setCacheVersion((v) => v + 1);
    }
    setError('');
    setFeedback('');
    setFieldErrors((prev) => ({ ...prev, argumentText: undefined }));
  }

  function checkCompositeCacheAndDisplay(overrides?: {
    productId?: string;
    clientId?: string;
    clientName?: string;
    toneStyle?: 'Consultivo' | 'Direto' | 'Persuasivo' | 'Técnico-Analítico';
  }): boolean {
    const nextProductId = overrides?.productId ?? (selectedProduct?.id || productId);
    const nextClientId = overrides?.clientId ?? clientId;
    const nextClientName = overrides?.clientName ?? clientName;
    const nextToneStyle = overrides?.toneStyle ?? toneStyle;

    if (!nextProductId) return false;

    const exactKey = buildArgumentCacheKey({
      productId: nextProductId,
      labId,
      resistanceType,
      competitorName,
      clientId: nextClientId,
      clientName: nextClientName,
      negotiationStage,
      tone,
      toneStyle: nextToneStyle,
      channel,
      customNotes,
    });

    const hit = findCachedByCompositeKey({
      clientId: nextClientId,
      clientName: nextClientName,
      productId: nextProductId,
      toneStyle: nextToneStyle,
      exactKey,
    });

    if (hit) {
      applyCachedHit(hit);
      return true;
    }

    if (cachedHitInfo) {
      setArgumentText('');
      setCachedHitInfo(null);
    }
    return false;
  }

  function handleSelectToneStyle(nextTone: 'Consultivo' | 'Direto' | 'Persuasivo' | 'Técnico-Analítico') {
    setToneStyle(nextTone);
    checkCompositeCacheAndDisplay({ toneStyle: nextTone });
  }

  async function runGeneration(options: { bypassCache?: boolean } = {}) {
    setSubmittedOnce(true);
    const errorsFound = validateGenerationInputs();
    setFieldErrors(errorsFound);

    if (Object.keys(errorsFound).length > 0 || !selectedProduct) {
      setError('Corrija os campos destacados antes de gerar o argumento.');
      return;
    }

    setError('');
    setFeedback('');
    setCopied(false);

    const cacheInput = {
      productId: selectedProduct.id,
      labId,
      resistanceType,
      competitorName,
      clientId,
      clientName,
      negotiationStage,
      tone,
      toneStyle,
      channel,
      customNotes,
    };
    const cacheKey = buildArgumentCacheKey(cacheInput);

    if (!options.bypassCache) {
      const compositeHit = findCachedByCompositeKey({
        clientId,
        clientName,
        productId: selectedProduct.id,
        toneStyle,
        exactKey: cacheKey,
      });
      if (compositeHit && compositeHit.matchType === 'exact') {
        applyCachedHit(compositeHit);
        return;
      }
      if (
        compositeHit &&
        cachedHitInfo &&
        cachedHitInfo.compositeKey === compositeHit.entry.compositeKey &&
        argumentText.trim() === compositeHit.entry.argument.trim()
      ) {
        applyCachedHit(compositeHit);
        return;
      }
    }

    setGenerating(true);
    setCachedHitInfo(null);
    startGranularLoadingProgress();

    try {
      const res = await api.generateArgument({
        productId: selectedProduct.id,
        productName: selectedProduct.nome_equipamento,
        productDiff: selectedProduct.diferenciais,
        norms: selectedProduct.normas_atendidas,
        labProfileName: selectedLab?.nome || '',
        labPain: selectedLab?.dor_principal || '',
        resistanceType,
        competitorName: competitorName.trim(),
        competitorDiff: selectedCompetitor
          ? [selectedCompetitor.categoria_atuacao, selectedCompetitor.produtos_concorrentes, selectedCompetitor.descricao]
              .filter(Boolean)
              .join(' — ')
          : '',
        clientName: clientName.trim(),
        negotiationStage,
        tone,
        toneStyle,
        channel,
        customNotes: customNotes.trim(),
      });

      setArgumentText(res.argument);
      setCachedArgument(cacheInput, res.argument, {
        productName: selectedProduct.nome_equipamento,
        labProfileName: selectedLab?.nome || '',
      });
      setCacheVersion((v) => v + 1);
      setFieldErrors((prev) => ({ ...prev, argumentText: undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar argumento.');
    } finally {
      stopGranularLoadingProgress();
      setGenerating(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await runGeneration({ bypassCache: false });
  }

  async function handleCopy() {
    if (!argumentText.trim()) return;
    try {
      await navigator.clipboard.writeText(argumentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione o texto manualmente.');
    }
  }

  function handleResetForm() {
    setProductCategoryFilter('');
    setProductSearch('');
    setClientId('');
    setClientName('');
    setSelectedCompetitorId('');
    setCompetitorName('');
    setCustomNotes('');
    setStagnationReason('');
    setToneStyle('Consultivo');
    setError('');
    setFeedback('');
    setFieldErrors({});
    setSubmittedOnce(false);
    setCachedHitInfo(null);
  }

  function handleClearCache() {
    clearArgumentCache();
    setCacheVersion((v) => v + 1);
    setCachedHitInfo(null);
    setFeedback('Todo o cache persistente de argumentos foi limpo.');
  }

  function handleClearCurrentPairCache() {
    if (!selectedProduct?.id) return;
    clearClientProductCache(clientId, clientName, selectedProduct.id);
    setCacheVersion((v) => v + 1);
    setCachedHitInfo(null);
    setFeedback(
      `Cache de ${clientName.trim() || 'Cliente Geral'} · ${selectedProduct.nome_equipamento} limpo.`
    );
  }

  function handleLoadCachedEntry(entry: CachedArgumentEntry) {
    setArgumentText(entry.argument);
    setCachedHitInfo({
      createdAt: entry.createdAt,
      compositeKey:
        entry.compositeKey ||
        buildCompositeToneCacheKey(entry.clientId, entry.clientName, entry.productId, entry.toneStyle),
      toneStyle: entry.toneStyle,
      resistanceType: entry.resistanceType,
      matchType: 'exact',
    });
    if (entry.labId && labProfiles.some((l) => l.id === entry.labId)) {
      setLabId(entry.labId);
    }
    if (entry.resistanceType) setResistanceType(entry.resistanceType);
    if (entry.negotiationStage && NEGOTIATION_STAGES.includes(entry.negotiationStage)) {
      setNegotiationStage(entry.negotiationStage);
    }
    if (entry.tone && ARGUMENT_TONES.includes(entry.tone)) {
      setTone(entry.tone);
    }
    if (
      entry.toneStyle === 'Consultivo' ||
      entry.toneStyle === 'Direto' ||
      entry.toneStyle === 'Persuasivo' ||
      entry.toneStyle === 'Técnico-Analítico'
    ) {
      setToneStyle(entry.toneStyle);
    }
    if (entry.channel && ARGUMENT_CHANNELS.includes(entry.channel)) {
      setChannel(entry.channel);
    }
    setCompetitorName(entry.competitorName || '');
    const matchedComp = competitors.find(
      (c) => c.nome.toLowerCase() === (entry.competitorName || '').toLowerCase()
    );
    setSelectedCompetitorId(matchedComp ? matchedComp.id : '');
    setCustomNotes(entry.customNotes || '');
    markCachedEntryAccessed(entry.clientProductKey, entry.key);
    setCacheVersion((v) => v + 1);
    setError('');
    setFeedback('');
    setFieldErrors((prev) => ({ ...prev, argumentText: undefined }));
  }

  function handleRemoveCachedEntry(entry: CachedArgumentEntry) {
    removeCachedArgumentEntry(entry.clientProductKey, entry.key);
    setCacheVersion((v) => v + 1);
  }

  async function handleSaveInteraction(avancou: boolean | null) {
    const trimmedArg = argumentText.trim();
    const trimmedStagnation = stagnationReason.trim();
    const saveErrors: FormFieldErrors = {};

    if (trimmedArg.length < 20) {
      saveErrors.argumentText = 'O roteiro precisa ter pelo menos 20 caracteres antes de ser registrado.';
    }
    if (avancou === false && trimmedStagnation && trimmedStagnation.length < 3) {
      saveErrors.stagnationReason = 'Informe pelo menos 3 caracteres no motivo de estagnação ou deixe em branco.';
    } else if (trimmedStagnation.length > 240) {
      saveErrors.stagnationReason = 'O motivo de estagnação deve ter no máximo 240 caracteres.';
    }

    if (Object.keys(saveErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...saveErrors }));
      setError('Revise os campos destacados antes de registrar no histórico.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.createInteraction({
        cliente_id: clientId || null,
        cliente_nome: clientName.trim() || 'Cliente não informado',
        vendedor_id: user.id,
        produto_id: selectedProduct?.id || null,
        produto_nome: selectedProduct?.nome_equipamento || '',
        lab_profile_id: selectedLab?.id || null,
        tipo_resistencia: resistanceType,
        concorrente_citado: competitorName.trim(),
        argumento_gerado: trimmedArg,
        avancou_funil: avancou,
        motivo_estagnacao: avancou === false ? trimmedStagnation : '',
        data_interacao: todayISO(),
      });
      await onSavedInteraction();
      setFeedback('Interação registrada no Histórico Comercial.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar interação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gerar Argumento Comercial"
        subtitle="Monte discursos consultivos personalizados com cache local, validação robusta e escolha do estilo de tom"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {totalCacheCount > 0 ? (
              <button
                type="button"
                onClick={handleClearCache}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-red-200 hover:text-red-700 text-slate-600 text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Cache ({totalCacheCount})</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Contexto</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <form onSubmit={handleGenerate} noValidate className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          {error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Bloco 1: Equipamento */}
          <div className="space-y-2.5 pb-3.5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#1B2E5E]">
                1. Equipamento Autec * ({filteredProducts.length})
              </span>
              {productCategoryFilter || productSearch ? (
                <button
                  type="button"
                  onClick={() => {
                    setProductCategoryFilter('');
                    setProductSearch('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-[#1B2E5E]"
                >
                  Mostrar todos ({products.length})
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                aria-label="Filtrar por linha de equipamento"
                className="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
              >
                <option value="">Todas as linhas</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar modelo ou marca..."
                  className="w-full h-8 pl-7 pr-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>
            </div>

            <div>
              <select
                value={selectedProduct?.id || productId}
                onChange={(e) => {
                  const nextPid = e.target.value;
                  setProductId(nextPid);
                  checkCompositeCacheAndDisplay({ productId: nextPid });
                }}
                aria-invalid={Boolean(fieldErrors.productId)}
                className={`w-full h-9 px-2.5 text-sm border rounded-lg bg-white font-medium text-slate-800 ${
                  fieldErrors.productId ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                }`}
              >
                {filteredProducts.length === 0 ? (
                  <option value="">Nenhum equipamento encontrado</option>
                ) : (
                  <ProductSelectOptions products={filteredProducts} />
                )}
              </select>
              {fieldErrors.productId ? (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.productId}</p>
              ) : null}
            </div>

            {selectedProduct ? (
              <div className="p-2.5 bg-[#F7F8FA] border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#1B2E5E] truncate">{selectedProduct.categoria}</span>
                  <span className="font-mono text-slate-500 shrink-0">{selectedProduct.codigo}</span>
                </div>
                {selectedProduct.normas_atendidas ? (
                  <div>
                    <strong className="text-slate-700">Normas:</strong> {selectedProduct.normas_atendidas}
                  </div>
                ) : null}
                {selectedProduct.diferenciais ? (
                  <div className="line-clamp-2">
                    <strong className="text-slate-700">Diferenciais:</strong> {selectedProduct.diferenciais}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Bloco 2: Cliente & Cenário */}
          <div className="space-y-2.5 pb-3.5 border-b border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#1B2E5E]">
              2. Laboratório, Cliente & Etapa
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Perfil do Laboratório</label>
              <select
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                {labProfiles.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
              {selectedLab?.dor_principal ? (
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  <strong>Dor típica:</strong> {selectedLab.dor_principal}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cliente (opcional)</label>
              {clients.length > 0 ? (
                <select
                  value={clientId}
                  onChange={(e) => {
                    const nextCid = e.target.value;
                    const cli = clients.find((c) => c.id === nextCid);
                    const nextName = cli ? cli.razao_social : '';
                    setClientId(nextCid);
                    setClientName(nextName);
                    checkCompositeCacheAndDisplay({ clientId: nextCid, clientName: nextName });
                  }}
                  className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white mb-1.5"
                >
                  <option value="">Selecionar cliente cadastrado ou digitar...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razao_social}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                type="text"
                maxLength={125}
                value={clientName}
                aria-invalid={Boolean(fieldErrors.clientName)}
                onChange={(e) => {
                  const nextName = e.target.value;
                  setClientId('');
                  setClientName(nextName);
                  checkCompositeCacheAndDisplay({ clientId: '', clientName: nextName });
                }}
                placeholder="Nome do laboratório ou empresa"
                className={`w-full h-9 px-3 text-sm border rounded-lg ${
                  fieldErrors.clientName ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
              />
              {fieldErrors.clientName ? (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.clientName}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Etapa da Negociação</label>
              <select
                value={negotiationStage}
                onChange={(e) => setNegotiationStage(e.target.value)}
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                {NEGOTIATION_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bloco 3: Estilo de Tom, Objeção & Concorrente */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#1B2E5E]">
              3. Estilo de Tom, Objeção & Concorrente
            </div>

            {/* Seletor de Estilo de Tom */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Estilo de Tom *</label>
              <div className="grid grid-cols-2 gap-2">
                {TONE_STYLES.map((st) => {
                  const active = toneStyle === st.value;
                  const hasCached = Boolean(cachedTonesMap[st.value]);
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => handleSelectToneStyle(st.value)}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        active
                          ? 'bg-[#1B2E5E] text-white border-[#1B2E5E]'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-[#1B2E5E]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold leading-tight">{st.label}</span>
                        {hasCached ? (
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              active ? 'bg-white/15 text-emerald-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            Em cache
                          </span>
                        ) : null}
                      </div>
                      <div className={`text-[10px] mt-0.5 leading-snug ${active ? 'text-slate-200' : 'text-slate-500'}`}>
                        {st.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Resistência / Objeção *</label>
              <select
                value={resistanceType}
                onChange={(e) => setResistanceType(e.target.value)}
                aria-invalid={Boolean(fieldErrors.resistanceType)}
                className={`w-full h-9 px-2.5 text-sm border rounded-lg bg-white ${
                  fieldErrors.resistanceType ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
              >
                {(resistanceTypes.length > 0 ? resistanceTypes : ['Preço', 'Prazo de Entrega', 'Especificação Técnica']).map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
              {fieldErrors.resistanceType ? (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.resistanceType}</p>
              ) : null}
              {selectedObjection ? (
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  <strong>Cenário base:</strong> {selectedObjection.objecao_comum}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Concorrente Citado (opcional)</label>
              {activeCompetitors.length > 0 ? (
                <select
                  value={selectedCompetitorId}
                  onChange={(e) => {
                    const comp = activeCompetitors.find((c) => c.id === e.target.value);
                    setSelectedCompetitorId(e.target.value);
                    setCompetitorName(comp ? comp.nome : '');
                  }}
                  className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white mb-1.5"
                >
                  <option value="">Selecionar do Radar de Concorrentes ou digitar...</option>
                  {activeCompetitors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                type="text"
                maxLength={105}
                value={competitorName}
                aria-invalid={Boolean(fieldErrors.competitorName)}
                onChange={(e) => {
                  setSelectedCompetitorId('');
                  setCompetitorName(e.target.value);
                }}
                placeholder="Ex.: Marca ou fornecedor concorrente"
                className={`w-full h-9 px-3 text-sm border rounded-lg ${
                  fieldErrors.competitorName ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
              />
              {fieldErrors.competitorName ? (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.competitorName}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Canal de Abordagem</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {ARGUMENT_CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Enfoque Estratégico</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {ARGUMENT_TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Detalhes Específicos da Negociação (opcional)
                </label>
                <span className={`text-[10px] font-mono ${customNotes.length > 500 ? 'text-red-600' : 'text-slate-400'}`}>
                  {customNotes.length}/500
                </span>
              </div>
              <textarea
                rows={2}
                value={customNotes}
                aria-invalid={Boolean(fieldErrors.customNotes)}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Ex.: Cliente pediu prazo menor que 30 dias ou justificativa técnica para auditoria ANVISA."
                className={`w-full p-2.5 text-xs border rounded-lg leading-relaxed ${
                  fieldErrors.customNotes ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
              />
              {fieldErrors.customNotes ? (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.customNotes}</p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full h-10 bg-[#1B2E5E] hover:bg-[#14234A] disabled:opacity-60 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2"
          >
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{generating ? LOADING_STEPS[loadingStepIdx]?.label : 'Gerar Argumento Técnico'}</span>
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#1B2E5E]">Roteiro de Argumentação</h3>
                  {cachedHitInfo && !generating ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                      <Database className="w-3 h-3 shrink-0" />
                      <span>Resposta Cacheada</span>
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">
                  Copie para enviar ao cliente, edite o texto ou registre diretamente no Histórico Comercial
                </p>
              </div>
              {argumentText && !generating ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => runGeneration({ bypassCache: true })}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{cachedHitInfo ? 'Regerar na IA (Ignorar Cache)' : 'Nova Variação'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#1B2E5E] text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
              ) : null}
            </div>

            {generating ? (
              <ArgumentSkeleton stepIndex={loadingStepIdx} />
            ) : !argumentText ? (
              <div className="py-14 text-center space-y-2">
                <Sparkles className="w-7 h-7 text-[#1B2E5E]/40 mx-auto" />
                <div className="text-xs font-medium text-slate-600">
                  Selecione o equipamento, estilo de tom, perfil do laboratório e objeção para montar a argumentação.
                </div>
                <div className="text-[11px] text-slate-400">
                  Ao escolher um Estilo de Tom já gerado para este cliente e produto, a resposta em cache aparece
                  instantaneamente sem chamar a API.
                </div>
              </div>
            ) : (
              <>
                {cachedHitInfo ? (
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 font-medium">
                      <Database className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>
                        <strong>Resposta Cacheada</strong> carregada do localStorage (salva em{' '}
                        {new Date(cachedHitInfo.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        ) sem chamada de rede.
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-800">
                      Tom: {cachedHitInfo.toneStyle} · Objeção: {cachedHitInfo.resistanceType}
                    </span>
                  </div>
                ) : null}

                <div>
                  <textarea
                    rows={13}
                    value={argumentText}
                    aria-invalid={Boolean(fieldErrors.argumentText)}
                    onChange={(e) => {
                      setArgumentText(e.target.value);
                      if (cachedHitInfo) {
                        setCachedHitInfo(null);
                      }
                      if (fieldErrors.argumentText && e.target.value.trim().length >= 20) {
                        setFieldErrors((prev) => ({ ...prev, argumentText: undefined }));
                      }
                    }}
                    className={`w-full p-3.5 text-sm border rounded-lg leading-relaxed text-slate-800 focus:outline-none focus:border-[#1B2E5E] ${
                      fieldErrors.argumentText ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                  {fieldErrors.argumentText ? (
                    <p className="text-[11px] text-red-600 mt-1">{fieldErrors.argumentText}</p>
                  ) : null}
                </div>

                {feedback ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{feedback}</span>
                  </div>
                ) : null}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-slate-600">
                      Registrar abordagem no Histórico Comercial:
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{stagnationReason.length}/240</span>
                  </div>
                  <input
                    type="text"
                    maxLength={245}
                    value={stagnationReason}
                    aria-invalid={Boolean(fieldErrors.stagnationReason)}
                    onChange={(e) => {
                      setStagnationReason(e.target.value);
                      if (fieldErrors.stagnationReason) {
                        setFieldErrors((prev) => ({ ...prev, stagnationReason: undefined }));
                      }
                    }}
                    placeholder="Motivo caso tenha permanecido estagnado (opcional)"
                    className={`w-full h-8 px-2.5 text-xs border rounded-lg bg-white ${
                      fieldErrors.stagnationReason ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {fieldErrors.stagnationReason ? (
                    <p className="text-[11px] text-red-600">{fieldErrors.stagnationReason}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveInteraction(null)}
                      className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Aguardando Retorno</span>
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveInteraction(false)}
                      className="px-3 py-2 bg-white border border-slate-200 hover:border-red-300 text-red-700 text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Permaneceu Estagnado</span>
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveInteraction(true)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Avançou no Funil</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Cache Persistente por Cliente / Produto (últimas 10 respostas) */}
          {selectedProduct ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-[#1B2E5E] shrink-0" />
                    <span className="text-xs font-semibold text-[#1B2E5E] truncate">
                      Cache Persistente: {clientName.trim() || 'Cliente Geral'} · {selectedProduct.nome_equipamento}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Armazena localmente até as últimas {MAX_ENTRIES_PER_CLIENT_PRODUCT} respostas para este cliente e
                    equipamento
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono font-semibold text-[#1B2E5E]">
                    {clientProductCachedEntries.length}/{MAX_ENTRIES_PER_CLIENT_PRODUCT}
                  </span>
                  {clientProductCachedEntries.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleClearCurrentPairCache}
                      className="text-[11px] text-slate-500 hover:text-red-600 font-medium"
                    >
                      Limpar par
                    </button>
                  ) : null}
                </div>
              </div>

              {clientProductCachedEntries.length === 0 ? (
                <div className="py-3 text-[11px] text-slate-500 text-center">
                  Nenhuma resposta em cache ainda para este par cliente/produto. Ao gerar, os roteiros ficam salvos
                  neste navegador para reuso instantâneo sem chamar a API.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                  {clientProductCachedEntries.map((entry, idx) => (
                    <div key={entry.id || entry.key} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="font-mono text-slate-400">#{idx + 1}</span>
                          <span className="px-1.5 py-0.5 bg-[#1B2E5E]/10 text-[#1B2E5E] font-semibold rounded">
                            {entry.toneStyle || 'Consultivo'}
                          </span>
                          <span className="font-medium text-slate-700 truncate">
                            Objeção: {entry.resistanceType}
                          </span>
                          {entry.competitorName ? (
                            <span className="text-slate-500 truncate">· vs {entry.competitorName}</span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {new Date(entry.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {entry.channel}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-snug">{entry.argument}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleLoadCachedEntry(entry)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#1B2E5E] bg-slate-100 hover:bg-slate-200 rounded-md"
                        >
                          Carregar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCachedEntry(entry)}
                          title="Remover do cache"
                          aria-label="Remover resposta do cache"
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Argumentos recentes */}
          {recentArguments.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-semibold text-[#1B2E5E]">Últimos Argumentos Registrados</div>
              <div className="divide-y divide-slate-100">
                {recentArguments.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-800 truncate">
                        {item.produto_nome || 'Equipamento Autec'} · {item.cliente_nome}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {formatDateBR(item.data_interacao)} · Objeção: {item.tipo_resistencia || 'Geral'}
                        {item.concorrente_citado ? ` · Concorrente: ${item.concorrente_citado}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setArgumentText(item.argumento_gerado);
                        setCachedHitInfo(null);
                        setFeedback('');
                        setFieldErrors((prev) => ({ ...prev, argumentText: undefined }));
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium text-[#1B2E5E] border border-slate-200 rounded-md hover:bg-slate-50 shrink-0"
                    >
                      Reabrir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
