import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CheckSquare,
  FileBarChart2,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Radar,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LandingContent } from '../types';
import { api, getLandingAdminToken, setLandingAdminToken } from '../utils/api';
import { LandingAdminModal } from '../components/LandingAdminModal';

interface LandingPageProps {
  isAuthenticated: boolean;
  onEnterPlatform: () => void;
}

const INITIAL_FALLBACK_CONTENT: LandingContent = {
  brandName: 'Autec Sales Pulse',
  headerCtaLabel: 'Acessar Plataforma',
  hero: {
    eyebrow: 'Autec Equipamentos de Laboratório · Plataforma de Inteligência Comercial B2B',
    title: 'Inteligência comercial e técnica para vender equipamentos de laboratório com previsibilidade.',
    description:
      'O Autec Sales Pulse reúne em um só ambiente o funil de vendas, o Radar de Concorrentes, a análise e recuperação de Perdas Comerciais, a Performance da equipe, Planos de Ação executáveis e o catálogo técnico completo com 66 equipamentos oficiais.',
    primaryCtaLabel: 'Entrar na Plataforma',
    secondaryCtaLabel: 'Explorar tudo por dentro ↓',
    imageUrl: '/src/assets/images/hero_autec_lab_1794930233501.jpg',
    imageAlt: 'Laboratório analítico de alta precisão equipado com sistemas de cromatografia e preparo de amostras',
  },
  highlights: [
    {
      id: 'hl-1',
      num: '04 Módulos',
      title: 'Inteligência Comercial',
      desc: 'Radar Competitivo, Perdas, Performance e Planos de Ação integrados ao funil.',
    },
    {
      id: 'hl-2',
      num: '66 Modelos',
      title: 'Portfólio Oficial Autec',
      desc: '8 linhas completas com aplicação, normas, especificações e consulta em 1 clique.',
    },
    {
      id: 'hl-3',
      num: '13 Motivos',
      title: 'Diagnóstico e Recuperação',
      desc: 'Motivos padronizados de perda e ciclo ativo de reabordagem de clientes.',
    },
    {
      id: 'hl-4',
      num: 'PDF & Excel',
      title: 'Relatórios Executivos',
      desc: 'Exportação gerencial com filtros dinâmicos, RBAC e trilha de auditoria.',
    },
  ],
  purposeSection: {
    eyebrow: '01. Propósito da Plataforma',
    title: 'O que o Autec Sales Pulse faz e para que serve na rotina da sua empresa',
    description:
      'Em vendas B2B de equipamentos científicos e laboratoriais, o ciclo é consultivo, técnico e disputado. Quando propostas, objeções, perdas e dados de concorrentes ficam espalhados em planilhas ou conversas individuais, a empresa perde visibilidade sobre por que ganha e por que perde negócios.',
    imageUrl: '/src/assets/images/module_radar_intelligence_1794930233824.jpg',
    imageAlt: 'Painel executivo de inteligência comercial integrado à operação laboratorial',
    items: [
      {
        id: 'purp-1',
        index: '01.',
        title: 'Centraliza toda a operação comercial em uma única base',
        text: 'Conecta clientes, oportunidades em andamento, interações consultivas, ocorrências competitivas, perdas e metas mensais sem duplicar cadastros.',
      },
      {
        id: 'purp-2',
        index: '02.',
        title: 'Explica por que a empresa está ganhando ou perdendo vendas',
        text: 'Cruza motivos de perda, pressão por preço, prazo de entrega, especificação técnica e atuação de cada concorrente por linha de produto e vendedor.',
      },
      {
        id: 'purp-3',
        index: '03.',
        title: 'Transforma negócios perdidos em segunda chance real de receita',
        text: 'Mantém um fluxo estruturado de oportunidades recuperáveis com data prevista de reabordagem e histórico completo de tentativas de retorno.',
      },
      {
        id: 'purp-4',
        index: '04.',
        title: 'Converte diagnóstico em execução cobrável com Planos de Ação',
        text: 'Permite abrir planos corretivos diretamente de um concorrente, produto, objeção ou perda, com responsável, prazo, prioridade e evidência de conclusão.',
      },
      {
        id: 'purp-5',
        index: '05.',
        title: 'Apoia o vendedor na hora da reunião com base técnica imediata',
        text: 'Disponibiliza os 66 equipamentos oficiais da Autec com chat de consulta em um clique, comparativo técnico de até 3 modelos e gerador de argumentos.',
      },
    ],
  },
  differentialsSection: {
    eyebrow: '02. Arquitetura e Diferenciais',
    title: 'Projetada para a realidade técnica e comercial da Autec',
    subtitle:
      'Diferente de CRMs genéricos cheios de etapas vazias, cada regra da plataforma foi construída para decisões gerenciais confiáveis em vendas de instrumentação analítica.',
    cards: [
      {
        id: 'diff-1',
        tag: 'Rigor Analítico · Zero Dados Fictícios',
        title: 'Separação rigorosa entre valor não informado e valor igual a zero',
        description:
          'Vendedores nunca são forçados a inventar o preço ou prazo de um concorrente quando o cliente não revela. A plataforma preserva campos opcionais como nulos reais e impede distorções em médias, rankings e gráficos executivos.',
        footerNote: 'Moeda em Real (R$), datas DD/MM/AAAA e filtros globais sincronizados',
        highlight: true,
        colSpan: 'wide',
      },
      {
        id: 'diff-2',
        tag: 'Da Análise à Execução',
        title: 'Criação de Plano de Ação a partir de qualquer gargalo',
        description:
          'Encontrou um concorrente ganhando espaço, uma objeção frequente ou queda de conversão em um produto? Em um clique a plataforma pré-preenche um Plano de Ação vinculado àquela origem, com prazo e exigência de evidência para concluir.',
        footerNote: 'Vínculo nativo com Radar, Perdas, Performance, Produtos e Objeções',
        highlight: false,
        colSpan: 'narrow',
      },
      {
        id: 'diff-3',
        tag: 'Segurança & Controle de Acesso (RBAC)',
        title: 'Até 20 usuários com permissões validadas no servidor',
        description:
          'Cada vendedor acompanha sua própria carteira com autonomia; gestores visualizam toda a operação e exportam relatórios; administradores controlam usuários, novos motivos de perda e trilha de auditoria.',
        footerNote: 'Perfis Administrador, Gestor Comercial e Vendedor',
        highlight: false,
        colSpan: 'narrow',
      },
      {
        id: 'diff-4',
        tag: 'Catálogo Científico Nativo',
        title: '66 equipamentos oficiais da Autec prontos para cotação, comparação e chat técnico',
        description:
          'Todas as 8 linhas oficiais do site da Autec já estão estruturadas dentro do banco de dados da plataforma, conectadas diretamente aos formulários de oportunidade, ocorrências competitivas, perdas, comparativo técnico e atendimento consultivo.',
        footerNote: 'CAMAG, Biotage, Advion, Biocomma, CEM, LUM, Syrris e VICI DBS',
        highlight: false,
        colSpan: 'wide',
      },
    ],
  },
  modulesSection: {
    eyebrow: '03. Mapa Completo do Sistema',
    title: 'Tudo o que existe por dentro do Autec Sales Pulse',
    subtitle: 'Navegue pelos blocos abaixo para conhecer cada módulo, tela e recurso operacional disponível após o login.',
    tabs: [
      {
        id: 'inteligencia',
        label: 'Inteligência Comercial (4)',
        title: 'Os 4 Módulos de Inteligência Comercial',
        subtitle: 'Visibilidade real sobre concorrência, perdas, produtividade da equipe e planos corretivos.',
        items: [
          {
            id: 'mod-radar',
            iconKey: 'radar',
            name: 'Radar de Concorrentes',
            summary: 'Mapeia quem disputa negócios com a Autec, em quais equipamentos e por quais motivos.',
            bullets: [
              'Cadastro de concorrentes com CNPJ, site, linha de atuação e status ativo/inativo',
              'Registro de ocorrências competitivas sem obrigar valores desconhecidos',
              'Ranking de menções, produtos mais confrontados, evolução por período e análise gerencial',
            ],
          },
          {
            id: 'mod-perdas',
            iconKey: 'losses',
            name: 'Perdas Comerciais & Recuperação',
            summary: 'Identifica causas raiz das perdas e transforma negócios perdidos em nova oportunidade.',
            bullets: [
              '13 motivos padronizados de perda, com criação de novos motivos restrita ao Administrador',
              'Total perdido, ticket médio de perda, cortes por vendedor, produto e concorrente vencedor',
              'Funil dedicado de recuperação com previsão de reabordagem e registro de tentativas',
            ],
          },
          {
            id: 'mod-perf',
            iconKey: 'performance',
            name: 'Performance Comercial',
            summary: 'Avalia conversão, volume de propostas e avanço real do funil por vendedor.',
            bullets: [
              'Taxa de conversão, ticket médio, oportunidades abertas, ganhas e perdidas',
              'Taxa de avanço das interações comerciais e identificação de motivos de estagnação',
              'Painel de gargalos para orientar coaching comercial e distribuição de carteira',
            ],
          },
          {
            id: 'mod-acao',
            iconKey: 'action',
            name: 'Plano de Ação Executável',
            summary: 'Conecta cada diagnóstico comercial a tarefas com responsável, prazo e evidência.',
            bullets: [
              'Criação direta a partir de concorrente, perda, objeção, produto ou meta de desempenho',
              'Prioridade (Baixa a Crítica), categoria, indicador esperado e detecção automática de atraso',
              'Conclusão auditada com registro obrigatório de evidência e data efetiva',
            ],
          },
        ],
      },
      {
        id: 'operacao',
        label: 'Operação & Funil',
        title: 'Operação Comercial & Ferramentas de Campo',
        subtitle: 'Fluxo diário para o vendedor registrar negociações e sustentar argumentos técnicos.',
        items: [
          {
            id: 'mod-dash',
            iconKey: 'dashboard',
            name: 'Dashboard Executivo Integrado',
            summary: 'Visão central do funil comercial combinada aos alertas de concorrência, perdas e ações.',
            bullets: [
              'Filtros globais por período, vendedor, cliente, produto Autec e situação',
              'Acompanhamento de faturamento realizado, pipeline em aberto e taxa de conversão',
              'Acesso direto para abrir novas oportunidades ou detalhar desvios',
            ],
          },
          {
            id: 'mod-arg',
            iconKey: 'sparkles',
            name: 'Gerador de Argumento Técnico',
            summary: 'Estrutura discursos consultivos adaptados ao perfil do laboratório e à objeção do cliente.',
            bullets: [
              'Combina equipamento Autec, normas atendidas, perfil do laboratório e concorrente citado',
              'Gera posicionamento de valor, contorno de objeção focado em TCO e pergunta de avanço',
              'Salva a abordagem diretamente no Histórico de Interações com status do funil',
            ],
          },
          {
            id: 'mod-comp',
            iconKey: 'scale',
            name: 'Comparativo Técnico Lado a Lado',
            summary: 'Compara até 3 equipamentos do portfólio oficial em uma única tabela técnica.',
            bullets: [
              'Filtro por linha de produto e busca rápida por modelo, código ou fabricante',
              'Comparação de categoria, normas atendidas, aplicação laboratorial e especificações',
              'Apoia elaboração de propostas técnicas, especificações e termos de referência',
            ],
          },
          {
            id: 'mod-crm',
            iconKey: 'briefcase',
            name: 'Oportunidades, Clientes & Histórico',
            summary: 'Gestão completa do funil de vendas e base de laboratórios clientes.',
            bullets: [
              'Cadastro rápido de clientes, oportunidades e catálogo pesquisável de 66 produtos',
              'Conversão direta de oportunidade não ganha para Perda Comercial em 1 clique',
              'Histórico de interações com marcação de avanço ou estagnação no funil',
            ],
          },
        ],
      },
      {
        id: 'gestao',
        label: 'Gestão & Relatórios',
        title: 'Gestão Executiva, Metas & Exportação',
        subtitle: 'Ferramentas exclusivas para diretoria e gerência comercial conduzirem a operação.',
        items: [
          {
            id: 'mod-cockpit',
            iconKey: 'chart',
            name: 'Cockpit do Gestor',
            summary: 'Painel consolidado de faturamento, metas do mês, projeção matemática e funil.',
            bullets: [
              '12 indicadores executivos atualizados em tempo real sobre a base comercial',
              'Comparativo Realizado vs Meta Mensal e ranking dos top vendedores por receita',
              'Leitura imediata de follow-ups pendentes e ritmo de fechamento no mês',
            ],
          },
          {
            id: 'mod-metas',
            iconKey: 'target',
            name: 'Ranking & Gestão de Metas',
            summary: 'Definição de metas mensais globais, por equipe ou individuais por vendedor.',
            bullets: [
              'Metas por faturamento (R$), quantidade de vendas ou propostas enviadas',
              'Comparativo de oportunidades, conversões e receita ganha por integrante',
              'Apoio direto às reuniões semanais de pipeline e fechamento mensal',
            ],
          },
          {
            id: 'mod-rel',
            iconKey: 'report',
            name: 'Relatórios Gerenciais (PDF e Excel)',
            summary: 'Exportação pronta para diretoria com filtros aplicados e rastreabilidade.',
            bullets: [
              'Relatórios dedicados de Concorrentes, Perdas, Performance e Plano de Ação',
              'Relatório Executivo Consolidado combinando todos os módulos comerciais',
              'Geração instantânea em PDF formatado e planilha Excel (.xlsx) auditada no log',
            ],
          },
        ],
      },
      {
        id: 'base',
        label: 'Base Técnica & Admin',
        title: 'Base Técnica, Capacitação & Governança',
        subtitle: 'Conhecimento técnico padronizado para toda a equipe e controle rigoroso de acessos.',
        items: [
          {
            id: 'mod-chat',
            iconKey: 'chat',
            name: 'Chat Técnico de Equipamentos',
            summary: 'Todos os 66 equipamentos ao lado do chat para consulta instantânea com um clique.',
            bullets: [
              'Lista pesquisável por linha e fabricante ao lado da conversa técnica',
              'Um clique exibe aplicação laboratorial, normas, diferenciais e ficha técnica',
              'Atalhos de perguntas comerciais e chat livre contextualizado no equipamento em foco',
            ],
          },
          {
            id: 'mod-kb',
            iconKey: 'book',
            name: 'Knowledge Base & Quiz Comercial',
            summary: 'Playbook de objeções, perfis de laboratório e avaliação contínua da equipe.',
            bullets: [
              'Respostas técnicas, analogias de venda e perguntas de retorno por tipo de objeção',
              'Mapeamento de dores por perfil (Farmacêutico, Ambiental, Alimentos e Pesquisa)',
              'Quiz comercial para nivelar domínio técnico de novos e atuais vendedores',
            ],
          },
          {
            id: 'mod-users',
            iconKey: 'users',
            name: 'Colaboradores & Auditoria RBAC',
            summary: 'Controle de até 20 usuários com permissões aplicadas no servidor e histórico de ações.',
            bullets: [
              'Perfis Administrador, Gestor Comercial e Vendedor com isolamento de carteira',
              'Gestão de ativação/desativação, redefinição de acesso e limite de usuários',
              'Trilha de auditoria registrando logins, criações, edições, exclusões e exportações',
            ],
          },
        ],
      },
    ],
  },
  audienceSection: {
    eyebrow: '04. Quem se beneficia na empresa',
    title: 'Para quem o Autec Sales Pulse foi construído',
    description:
      'Cada perfil dentro da organização utiliza o mesmo sistema com uma visão adaptada às suas decisões diárias — da abordagem no laboratório do cliente ao fechamento estratégico na diretoria.',
    imageUrl: '/src/assets/images/module_lab_field_1794930234211.jpg',
    imageAlt: 'Especialista técnico comercial da Autec apresentando equipamento de cromatografia a gerente de laboratório',
    cards: [
      {
        id: 'aud-1',
        role: 'Diretoria & Sócios',
        focus: 'Visão executiva e proteção de receita',
        help: 'Enxerga faturamento, projeção mensal, valor perdido por motivo e por concorrente, retorno de oportunidades recuperadas e relatórios consolidados em PDF e Excel.',
        footerNote: 'Acesso integrado com trilha de auditoria',
      },
      {
        id: 'aud-2',
        role: 'Gestores Comerciais',
        focus: 'Condução de equipe e metas',
        help: 'Identifica gargalos de conversão por vendedor, concorrentes em crescimento, produtos sob pressão competitiva e acompanha a execução de planos de ação com prazos.',
        footerNote: 'Acesso integrado com trilha de auditoria',
      },
      {
        id: 'aud-3',
        role: 'Vendedores & Consultores Técnicos',
        focus: 'Agilidade em negociações complexas',
        help: 'Consulta especificações dos 66 equipamentos em 1 clique no Chat Técnico, compara até 3 modelos, gera argumentos contra objeções e registra ocorrências em segundos.',
        footerNote: 'Acesso integrado com trilha de auditoria',
      },
      {
        id: 'aud-4',
        role: 'Aplicação & Marketing de Produto',
        focus: 'Posicionamento e resposta competitiva',
        help: 'Descobre quais diferenciais dos concorrentes mais pesam na decisão dos laboratórios e ajusta argumentos, treinamentos, playbook de objeções e materiais técnicos.',
        footerNote: 'Acesso integrado com trilha de auditoria',
      },
    ],
  },
  portfolioSection: {
    eyebrow: '05. Portfólio Autec Embarcado',
    title: '8 linhas oficiais e 66 equipamentos já carregados no sistema',
    subtitle:
      'Todo o catálogo científico comercializado pela Autec está pronto para uso nos funis, comparativos, ocorrências competitivas e consultas técnicas.',
    badgeLabel: 'Total ativo: 66 modelos · 8 linhas',
    lines: [
      {
        id: 'pl-1',
        name: 'Cromatografia Analítica',
        count: 12,
        brands: 'CAMAG',
        highlight: 'HPTLC Pro, TLC Visualizer 3, ATS4, Linomat 5, TLC Scanner 4, ADC2, Derivatizer e TLC-MS Interface 2',
      },
      {
        id: 'pl-2',
        name: 'Cromatografia Preparativa',
        count: 6,
        brands: 'Biotage · Advion Interchim',
        highlight: 'Biotage® Selekt Systems, ELSD-A120, Isolera Spektra ONE, puriFlash® 5.250, 5.400 e 5.250P',
      },
      {
        id: 'pl-3',
        name: 'Evaporação e Concentração',
        count: 4,
        brands: 'Biotage',
        highlight: 'Biotage® V-10 Touch, TurboVap® LV, TurboVap® II e Biotage® SPE Dry 96',
      },
      {
        id: 'pl-4',
        name: 'Preparo de Amostras',
        count: 12,
        brands: 'Biotage · Biocomma · CEM',
        highlight: 'Extrahera™, Pressure + 48/96, Cartuchos SPE, Phoenix BLACK, MARS 6, MARS Xpress 2.0 e BLADE',
      },
      {
        id: 'pl-5',
        name: 'Análise de Processos e Estabilidade',
        count: 10,
        brands: 'LUM · CEM',
        highlight: 'LUMiSizer, LUMiFuge, LUMiReader PSA/X-Ray, LUMiSpoc, SMART 6, ORACLE (RMN) e Sprint',
      },
      {
        id: 'pl-6',
        name: 'Síntese Orgânica e de Peptídeos',
        count: 10,
        brands: 'CEM',
        highlight: 'Discover 2.0, MARS 6 Synthesis, MultiPep 1 e 2, Liberty Blue/PRIME/PRO, CleavagePro e Prodigy 2.0',
      },
      {
        id: 'pl-7',
        name: 'Reatores de Batelada e Acessórios',
        count: 5,
        brands: 'Syrris',
        highlight: 'Atlas Syringe Pump, Atlas HD, ORB Modular, ORB Pilot e plataforma de fluxo contínuo Asia',
      },
      {
        id: 'pl-8',
        name: 'Geradores de Gás VICI DBS',
        count: 7,
        brands: 'VICI DBS',
        highlight: 'PG Plus, NM Plus, Estação FID, Hydrogen 19" Rack Plus, Geradores N₂, Mistral/Whisper e Ar Ultra Zero',
      },
    ],
  },
  customBlocksSectionTitle: 'Conteúdos & Imagens Adicionais',
  customBlocks: [],
  ctaSection: {
    eyebrow: 'Pronto para operar na sua empresa',
    title: 'Experimente o Autec Sales Pulse com todos os módulos ativos agora mesmo',
    description:
      'Acesse a plataforma para explorar o Dashboard, Radar de Concorrentes, Perdas Comerciais, Performance, Planos de Ação, Relatórios em PDF/Excel e o Chat Técnico com todos os 66 equipamentos da Autec.',
    buttonLabel: 'Acessar Plataforma Agora',
    note: 'Perfis de demonstração disponíveis na tela de entrada: Administrador, Gestor e Vendedor.',
  },
  footer: {
    brandLine: 'Autec Sales Pulse · Autec Equipamentos de Laboratório',
    credits: 'Desenvolvido por Agência STC Mobile',
  },
};

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  radar: Radar,
  losses: TrendingDown,
  performance: TrendingUp,
  action: CheckSquare,
  dashboard: LayoutDashboard,
  sparkles: Sparkles,
  scale: Scale,
  briefcase: Briefcase,
  chart: BarChart3,
  target: Target,
  report: FileBarChart2,
  chat: MessageSquare,
  book: BookOpen,
  users: Users,
};

export function LandingPage({ isAuthenticated, onEnterPlatform }: LandingPageProps) {
  const [content, setContent] = useState<LandingContent>(INITIAL_FALLBACK_CONTENT);
  const [activeTabId, setActiveTabId] = useState<string>('inteligencia');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [intelImgFailed, setIntelImgFailed] = useState(false);
  const [fieldImgFailed, setFieldImgFailed] = useState(false);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => getLandingAdminToken());

  useEffect(() => {
    let active = true;
    api
      .getLanding()
      .then((res) => {
        if (active && res.content) {
          setContent(res.content);
        }
      })
      .catch(() => {
        // keeps initial fallback content if network error occurs
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setHeroImgFailed(false);
  }, [content.hero.imageUrl]);

  useEffect(() => {
    setIntelImgFailed(false);
  }, [content.purposeSection.imageUrl]);

  useEffect(() => {
    setFieldImgFailed(false);
  }, [content.audienceSection.imageUrl]);

  useEffect(() => {
    if (content.modulesSection.tabs.length > 0 && !content.modulesSection.tabs.some((t) => t.id === activeTabId)) {
      setActiveTabId(content.modulesSection.tabs[0].id);
    }
  }, [content.modulesSection.tabs, activeTabId]);

  const explorer =
    content.modulesSection.tabs.find((t) => t.id === activeTabId) || content.modulesSection.tabs[0];

  function handleAdminAuthenticated(token: string) {
    setLandingAdminToken(token);
    setAdminToken(token);
  }

  function handleLogoutAdmin() {
    setLandingAdminToken(null);
    setAdminToken(null);
  }

  function handleSavedContent(updated: LandingContent) {
    setContent(updated);
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900">
      {/* Top Bar Contract: 3 zones, single row */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <a
            href="#topo"
            className="text-lg font-bold font-display tracking-tight text-[#1B2E5E] whitespace-nowrap shrink-0"
          >
            {content.brandName}
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#o-que-faz" className="hover:text-[#1B2E5E] transition-colors whitespace-nowrap shrink-0">
              O que faz
            </a>
            <a href="#diferenciais" className="hover:text-[#1B2E5E] transition-colors whitespace-nowrap shrink-0">
              Diferenciais
            </a>
            <a href="#modulos" className="hover:text-[#1B2E5E] transition-colors whitespace-nowrap shrink-0">
              Módulos
            </a>
            <a href="#para-quem-serve" className="hover:text-[#1B2E5E] transition-colors whitespace-nowrap shrink-0">
              Para quem serve
            </a>
            <a href="#portfolio" className="hover:text-[#1B2E5E] transition-colors whitespace-nowrap shrink-0">
              Portfólio
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border ${
                adminToken
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                  : 'bg-white border-slate-300 text-[#1B2E5E] hover:bg-slate-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Administrador</span>
            </button>

            <button
              type="button"
              onClick={onEnterPlatform}
              className="px-4 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            >
              <span>{isAuthenticated ? 'Voltar ao Painel' : content.headerCtaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main id="topo">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 pt-10 pb-12 md:pt-14 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className={`${content.hero.imageUrl ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col justify-center space-y-5`}>
              {content.hero.eyebrow ? (
                <div className="text-xs font-medium text-slate-500">{content.hero.eyebrow}</div>
              ) : null}

              <h1
                className="font-display font-bold text-[#1B2E5E] tracking-tight leading-[1.12]"
                style={{ fontSize: 'clamp(2.15rem, 3.6vw, 3.25rem)', textWrap: 'balance' }}
              >
                {content.hero.title}
              </h1>

              {content.hero.description ? (
                <p className="text-base text-slate-600 leading-relaxed max-w-xl whitespace-pre-line">
                  {content.hero.description}
                </p>
              ) : null}

              <div className="pt-2 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={onEnterPlatform}
                  className="px-6 py-3 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>{isAuthenticated ? 'Abrir Sistema Comercial' : content.hero.primaryCtaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {content.hero.secondaryCtaLabel ? (
                  <a
                    href="#modulos"
                    className="text-sm font-medium text-[#1B2E5E] hover:underline whitespace-nowrap shrink-0"
                  >
                    {content.hero.secondaryCtaLabel}
                  </a>
                ) : null}
              </div>
            </div>

            {content.hero.imageUrl ? (
              <div className="lg:col-span-6 flex">
                <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[300px] lg:min-h-[420px] relative">
                  {!heroImgFailed ? (
                    <img
                      src={content.hero.imageUrl}
                      alt={content.hero.imageAlt || 'Autec Equipamentos de Laboratório'}
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-white bg-[#1B2E5E]">
                      <FlaskConical className="w-10 h-10 mb-3 text-amber-400" />
                      <div className="text-sm font-semibold">Autec Equipamentos de Laboratório</div>
                      <div className="text-xs text-slate-300 mt-1">
                        Cromatografia, Preparo de Amostras, Síntese e Processos
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Capability Strip below Hero */}
          {content.highlights.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              {content.highlights.map((item) => (
                <div key={item.id} className="p-5 space-y-1.5">
                  <div className="font-mono tabular-nums text-xs font-semibold text-amber-700">{item.num}</div>
                  <div className="text-sm font-bold text-[#1B2E5E]">{item.title}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* SECTION 01: O QUE FAZ E PARA QUE SERVE */}
        <section id="o-que-faz" className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  {content.purposeSection.eyebrow ? (
                    <div className="text-xs font-semibold text-amber-700">{content.purposeSection.eyebrow}</div>
                  ) : null}
                  <h2
                    className="text-2xl md:text-3xl font-bold text-[#1B2E5E] tracking-tight"
                    style={{ textWrap: 'balance' }}
                  >
                    {content.purposeSection.title}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {content.purposeSection.description}
                  </p>
                </div>

                {content.purposeSection.imageUrl ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3">
                    {!intelImgFailed ? (
                      <img
                        src={content.purposeSection.imageUrl}
                        alt={content.purposeSection.imageAlt || 'Inteligência comercial Autec'}
                        referrerPolicy="no-referrer"
                        onError={() => setIntelImgFailed(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-100 text-slate-600">
                        <BarChart3 className="w-8 h-8 text-[#1B2E5E] mb-2" />
                        <div className="text-xs font-semibold">Gestão Comercial Centralizada</div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-7 flex flex-col justify-center divide-y divide-slate-200 border border-slate-200 rounded-xl bg-[#F7F8FA]">
                {content.purposeSection.items.map((row) => (
                  <div key={row.id} className="p-5 md:p-6 flex items-start gap-4">
                    <span className="font-mono text-sm font-bold text-[#1B2E5E] shrink-0 pt-0.5">{row.index}</span>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#1B2E5E]">{row.title}</h3>
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-line">{row.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 02: DIFERENCIAIS DA PLATAFORMA */}
        {content.differentialsSection.cards.length > 0 ? (
          <section id="diferenciais" className="max-w-7xl mx-auto px-6 py-16 space-y-8">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-semibold text-amber-700">{content.differentialsSection.eyebrow}</div>
              <h2
                className="text-2xl md:text-3xl font-bold text-[#1B2E5E] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {content.differentialsSection.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {content.differentialsSection.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {content.differentialsSection.cards.map((card) => {
                const spanClass = card.colSpan === 'wide' ? 'lg:col-span-7' : 'lg:col-span-5';
                if (card.highlight) {
                  return (
                    <div
                      key={card.id}
                      className={`${spanClass} bg-[#1B2E5E] text-white rounded-xl p-6 md:p-7 flex flex-col justify-between space-y-5`}
                    >
                      <div className="space-y-2.5">
                        <div className="text-xs font-medium text-amber-300">{card.tag}</div>
                        <h3 className="text-xl font-bold leading-snug">{card.title}</h3>
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{card.description}</p>
                      </div>
                      {card.footerNote ? (
                        <div className="pt-4 border-t border-white/15 text-xs text-slate-200">{card.footerNote}</div>
                      ) : null}
                    </div>
                  );
                }
                return (
                  <div
                    key={card.id}
                    className={`${spanClass} bg-white border border-slate-200 rounded-xl p-6 md:p-7 flex flex-col justify-between space-y-4`}
                  >
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-500">{card.tag}</div>
                      <h3 className="text-lg font-bold text-[#1B2E5E]">{card.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{card.description}</p>
                    </div>
                    {card.footerNote ? (
                      <div className="pt-3 border-t border-slate-100 text-xs font-medium text-[#1B2E5E]">
                        {card.footerNote}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* SECTION 03: TUDO O QUE EXISTE POR DENTRO DA PLATAFORMA */}
        {explorer ? (
          <section id="modulos" className="bg-white border-y border-slate-200 py-16">
            <div className="max-w-7xl mx-auto px-6 space-y-7">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="text-xs font-semibold text-amber-700">{content.modulesSection.eyebrow}</div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#1B2E5E] tracking-tight">
                    {content.modulesSection.title}
                  </h2>
                  <p className="text-sm text-slate-600">{content.modulesSection.subtitle}</p>
                </div>

                <div className="flex flex-wrap gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg w-fit">
                  {content.modulesSection.tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTabId(t.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        explorer.id === t.id ? 'bg-[#1B2E5E] text-white' : 'text-slate-600 hover:text-[#1B2E5E]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#F7F8FA] border border-slate-200 rounded-2xl p-6 md:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-[#1B2E5E]">{explorer.title}</h3>
                    <p className="text-xs md:text-sm text-slate-600 mt-0.5">{explorer.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onEnterPlatform}
                    className="text-xs font-semibold text-[#1B2E5E] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <span>Testar módulo na prática</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {explorer.items.map((mod) => {
                    const Icon = MODULE_ICONS[mod.iconKey] || Sparkles;
                    return (
                      <div key={mod.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#1B2E5E]/8 text-[#1B2E5E] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#1B2E5E]">{mod.name}</h4>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{mod.summary}</p>
                          </div>
                        </div>
                        <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                          {mod.bullets.map((b, bIdx) => (
                            <li key={`${mod.id}-b-${bIdx}`} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* SECTION 04: PARA QUEM SERVE */}
        <section id="para-quem-serve" className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-amber-700">{content.audienceSection.eyebrow}</div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-[#1B2E5E] tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  {content.audienceSection.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {content.audienceSection.description}
                </p>
              </div>

              {content.audienceSection.imageUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3">
                  {!fieldImgFailed ? (
                    <img
                      src={content.audienceSection.imageUrl}
                      alt={content.audienceSection.imageAlt || 'Venda técnica consultiva Autec'}
                      referrerPolicy="no-referrer"
                      onError={() => setFieldImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-100 text-slate-600">
                      <Users className="w-8 h-8 text-[#1B2E5E] mb-2" />
                      <div className="text-xs font-semibold">Venda Técnica Consultiva B2B</div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {content.audienceSection.cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-amber-700">{card.focus}</div>
                    <h3 className="text-base font-bold text-[#1B2E5E]">{card.role}</h3>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-line">{card.help}</p>
                  </div>
                  {card.footerNote ? (
                    <div className="pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-500">
                      {card.footerNote}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 05: PORTFÓLIO OFICIAL INTEGRADO */}
        {content.portfolioSection.lines.length > 0 ? (
          <section id="portfolio" className="bg-white border-y border-slate-200 py-16">
            <div className="max-w-7xl mx-auto px-6 space-y-7">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="text-xs font-semibold text-amber-700">{content.portfolioSection.eyebrow}</div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#1B2E5E] tracking-tight">
                    {content.portfolioSection.title}
                  </h2>
                  <p className="text-sm text-slate-600">{content.portfolioSection.subtitle}</p>
                </div>
                {content.portfolioSection.badgeLabel ? (
                  <div className="font-mono text-xs text-slate-500 whitespace-nowrap">
                    {content.portfolioSection.badgeLabel}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {content.portfolioSection.lines.map((line) => (
                  <div
                    key={line.id}
                    className="bg-[#F7F8FA] border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                        <span>{line.brands}</span>
                        <span className="font-semibold text-[#1B2E5E] tabular-nums">{line.count} modelos</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#1B2E5E] leading-snug">{line.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{line.highlight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* CUSTOM ADMIN TEXT & IMAGE BLOCKS (when added via Administrador) */}
        {content.customBlocks.length > 0 ? (
          <section id="conteudos-adicionais" className="max-w-7xl mx-auto px-6 py-16 space-y-10">
            {content.customBlocksSectionTitle ? (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-amber-700">Conteúdo Personalizado</div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1B2E5E] tracking-tight">
                  {content.customBlocksSectionTitle}
                </h2>
              </div>
            ) : null}

            <div className="space-y-8">
              {content.customBlocks.map((blk) => {
                if (blk.layout === 'banner') {
                  return (
                    <div
                      key={blk.id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1"
                    >
                      {blk.imageUrl ? (
                        <div className="w-full max-h-[420px] overflow-hidden bg-slate-100">
                          <img
                            src={blk.imageUrl}
                            alt={blk.imageAlt || blk.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="p-6 md:p-8 space-y-2.5">
                        {blk.badge ? <div className="text-xs font-semibold text-amber-700">{blk.badge}</div> : null}
                        <h3 className="text-xl font-bold text-[#1B2E5E]">{blk.title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{blk.text}</p>
                      </div>
                    </div>
                  );
                }

                const imgFirst = blk.layout === 'text-right';
                return (
                  <div
                    key={blk.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                  >
                    <div
                      className={`${blk.imageUrl ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-3 ${
                        imgFirst && blk.imageUrl ? 'lg:order-2' : 'lg:order-1'
                      }`}
                    >
                      {blk.badge ? <div className="text-xs font-semibold text-amber-700">{blk.badge}</div> : null}
                      <h3 className="text-xl md:text-2xl font-bold text-[#1B2E5E]">{blk.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{blk.text}</p>
                    </div>

                    {blk.imageUrl ? (
                      <div className={`lg:col-span-6 ${imgFirst ? 'lg:order-1' : 'lg:order-2'}`}>
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3">
                          <img
                            src={blk.imageUrl}
                            alt={blk.imageAlt || blk.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* SECTION 06: CTA FINAL & ACESSO IMEDIATO */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="bg-[#1B2E5E] text-white rounded-2xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="text-xs font-medium text-amber-300">{content.ctaSection.eyebrow}</div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug" style={{ textWrap: 'balance' }}>
                {content.ctaSection.title}
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed max-w-2xl whitespace-pre-line">
                {content.ctaSection.description}
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-3">
              <button
                type="button"
                onClick={onEnterPlatform}
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>{isAuthenticated ? 'Ir para o Dashboard' : content.ctaSection.buttonLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {content.ctaSection.note ? (
                <div className="text-xs text-slate-300 lg:text-right">{content.ctaSection.note}</div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="font-semibold text-[#1B2E5E]">{content.footer.brandLine}</div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#o-que-faz" className="hover:text-[#1B2E5E]">
              O que faz
            </a>
            <a href="#diferenciais" className="hover:text-[#1B2E5E]">
              Diferenciais
            </a>
            <a href="#modulos" className="hover:text-[#1B2E5E]">
              Módulos
            </a>
            <a href="#portfolio" className="hover:text-[#1B2E5E]">
              Portfólio
            </a>
            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="hover:text-[#1B2E5E] font-medium"
            >
              Administrador
            </button>
            <span>{content.footer.credits}</span>
          </div>
        </div>
      </footer>

      <LandingAdminModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        content={content}
        adminToken={adminToken}
        onAuthenticated={handleAdminAuthenticated}
        onLogoutAdmin={handleLogoutAdmin}
        onSavedContent={handleSavedContent}
      />
    </div>
  );
}
