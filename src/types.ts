export type UserRole = 'admin' | 'gestor' | 'vendedor';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  equipe: string;
  ativo: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  codigo: string;
  nome_equipamento: string;
  categoria: string;
  aplicacao_laboratorial: string;
  normas_atendidas: string;
  diferenciais: string;
  faixa_preco: number | null;
  especificacoes: Record<string, string>;
  ativo: boolean;
  created_at: string;
}

export interface LabProfile {
  id: string;
  nome: string;
  segmento: string;
  dor_principal: string;
  criterios_decisao: string;
  equipamentos_recomendados: string;
  created_at: string;
}

export interface Objection {
  id: string;
  tipo_resistencia: string;
  objecao_comum: string;
  argumento_tecnico: string;
  analogia_venda: string;
  pergunta_retorno: string;
  created_at: string;
}

export interface Client {
  id: string;
  razao_social: string;
  cnpj: string;
  segmento: string;
  cidade: string;
  uf: string;
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  vendedor_responsavel_id: string | null;
  vendedor_responsavel_nome?: string | null;
  created_at: string;
}

export type OpportunityStatus =
  | 'aberta'
  | 'proposta_enviada'
  | 'em_negociacao'
  | 'ganha'
  | 'perdida'
  | 'cancelada';

export interface Opportunity {
  id: string;
  codigo: string;
  cliente_id: string | null;
  cliente_nome: string;
  vendedor_id: string;
  vendedor_nome: string;
  produto_id: string | null;
  produto_nome: string;
  valor: number | null;
  status: OpportunityStatus;
  data_abertura: string;
  data_encerramento: string | null;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  cliente_id: string | null;
  cliente_nome: string;
  vendedor_id: string;
  vendedor_nome: string;
  produto_id: string | null;
  produto_nome: string;
  lab_profile_id: string | null;
  tipo_resistencia: string;
  concorrente_citado: string;
  argumento_gerado: string;
  avancou_funil: boolean | null;
  motivo_estagnacao: string;
  data_interacao: string;
  created_at: string;
}

export interface Goal {
  id: string;
  escopo: 'global' | 'equipe' | 'individual';
  tipo: 'faturamento' | 'vendas' | 'propostas';
  vendedor_id: string | null;
  vendedor_nome: string;
  equipe: string;
  periodo_mes: number;
  periodo_ano: number;
  valor_meta: number;
  created_at: string;
}

export interface Competitor {
  id: string;
  nome: string;
  cnpj: string;
  site: string;
  categoria_atuacao: string;
  produtos_concorrentes: string;
  descricao: string;
  observacoes: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export type NegotiationResult = 'ganha' | 'perdida' | 'em_andamento' | 'cancelada';

export interface CompetitiveOccurrence {
  id: string;
  data_ocorrencia: string;
  cliente_id: string | null;
  cliente_nome: string;
  vendedor_id: string;
  vendedor_nome: string;
  produto_autec_id: string | null;
  produto_autec_nome: string;
  concorrente_id: string;
  concorrente_nome: string;
  produto_concorrente: string;
  valor_proposta_autec: number | null;
  valor_concorrente: number | null;
  prazo_entrega_concorrente: number | null;
  condicao_pagamento_mencionada: string | null;
  diferencial_concorrente: string;
  motivo_preferencia: string;
  resultado_negociacao: NegotiationResult;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface LossReason {
  id: string;
  nome: string;
  padrao: boolean;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
}

export type RecoverabilityStatus = 'sim' | 'nao' | 'avaliar';
export type LossWorkflowStatus = 'confirmada' | 'em_recuperacao' | 'recuperada' | 'nao_recuperada';

export interface LostOpportunity {
  id: string;
  identificador: string;
  oportunidade_id: string | null;
  cliente_id: string | null;
  cliente_nome: string;
  vendedor_id: string;
  vendedor_nome: string;
  produto_id: string | null;
  produto_nome: string;
  data_abertura: string;
  data_encerramento: string;
  valor_estimado: number | null;
  concorrente_vencedor_id: string | null;
  concorrente_vencedor_nome: string;
  motivo_principal_id: string;
  motivo_principal_nome: string;
  motivo_secundario_id: string | null;
  motivo_secundario_nome: string;
  descricao_detalhada: string;
  recuperavel: RecoverabilityStatus;
  data_prevista_abordagem: string | null;
  status_perda: LossWorkflowStatus;
  valor_recuperado: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecoveryAttempt {
  id: string;
  lost_opportunity_id: string;
  motivo_tentativa: string;
  vendedor_responsavel_id: string;
  vendedor_responsavel_nome: string;
  data_retorno: string;
  contato_realizado: string;
  situacao: 'em_negociacao' | 'recuperada' | 'nao_recuperada';
  valor_recuperado: number | null;
  observacoes: string;
  created_at: string;
}

export type ActionCategory =
  | 'Concorrência'
  | 'Preço'
  | 'Produto'
  | 'Logística'
  | 'Atendimento'
  | 'Treinamento'
  | 'Recuperação de clientes'
  | 'Conversão comercial'
  | 'Processo interno'
  | 'Outros';

export type ActionPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';
export type ActionStatus = 'Não iniciada' | 'Em andamento' | 'Aguardando' | 'Concluída' | 'Cancelada';
export type ActionOriginType =
  | 'concorrente'
  | 'oportunidade_perdida'
  | 'objecao'
  | 'desempenho'
  | 'produto'
  | 'manual';

export interface ActionPlan {
  id: string;
  titulo: string;
  problema_identificado: string;
  origem_tipo: ActionOriginType;
  origem_id: string | null;
  origem_label: string;
  descricao: string;
  categoria: ActionCategory;
  responsavel_id: string;
  responsavel_nome: string;
  criado_por_id: string;
  criado_por_nome: string;
  data_criacao: string;
  prazo_conclusao: string;
  prioridade: ActionPriority;
  resultado_esperado: string;
  indicador_relacionado: string;
  status: ActionStatus;
  evidencia_conclusao: string;
  data_conclusao: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  entity_type: string;
  entity_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT';
  summary: string;
  changes_json: string;
  created_at: string;
}

export interface GlobalFilters {
  dataInicio: string;
  dataFim: string;
  vendedorId: string;
  clienteId: string;
  produtoId: string;
  situacao: string;
}

export interface ActionPrefill {
  titulo?: string;
  problema_identificado?: string;
  origem_tipo: ActionOriginType;
  origem_id?: string | null;
  origem_label?: string;
  categoria?: ActionCategory;
  indicador_relacionado?: string;
  resultado_esperado?: string;
}

export interface LandingHighlightItem {
  id: string;
  num: string;
  title: string;
  desc: string;
}

export interface LandingPurposeItem {
  id: string;
  index: string;
  title: string;
  text: string;
}

export interface LandingDifferentialCard {
  id: string;
  tag: string;
  title: string;
  description: string;
  footerNote: string;
  highlight?: boolean;
  colSpan?: 'wide' | 'narrow';
}

export interface LandingModuleItem {
  id: string;
  iconKey: string;
  name: string;
  summary: string;
  bullets: string[];
}

export interface LandingModuleTab {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  items: LandingModuleItem[];
}

export interface LandingAudienceCard {
  id: string;
  role: string;
  focus: string;
  help: string;
  footerNote: string;
}

export interface LandingPortfolioLine {
  id: string;
  name: string;
  count: number;
  brands: string;
  highlight: string;
}

export interface LandingCustomBlock {
  id: string;
  badge: string;
  title: string;
  text: string;
  imageUrl: string;
  imageAlt: string;
  layout: 'text-left' | 'text-right' | 'banner';
}

export interface LandingContent {
  brandName: string;
  headerCtaLabel: string;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    imageUrl: string;
    imageAlt: string;
  };
  highlights: LandingHighlightItem[];
  purposeSection: {
    eyebrow: string;
    title: string;
    description: string;
    imageUrl: string;
    imageAlt: string;
    items: LandingPurposeItem[];
  };
  differentialsSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cards: LandingDifferentialCard[];
  };
  modulesSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tabs: LandingModuleTab[];
  };
  audienceSection: {
    eyebrow: string;
    title: string;
    description: string;
    imageUrl: string;
    imageAlt: string;
    cards: LandingAudienceCard[];
  };
  portfolioSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    badgeLabel: string;
    lines: LandingPortfolioLine[];
  };
  customBlocksSectionTitle: string;
  customBlocks: LandingCustomBlock[];
  ctaSection: {
    eyebrow: string;
    title: string;
    description: string;
    buttonLabel: string;
    note: string;
  };
  footer: {
    brandLine: string;
    credits: string;
  };
}

