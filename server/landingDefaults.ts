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

export const DEFAULT_LANDING_CONTENT: LandingContent = {
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
