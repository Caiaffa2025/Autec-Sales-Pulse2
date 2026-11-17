export interface OfficialProductSeed {
  id: string;
  codigo: string;
  nome_equipamento: string;
  categoria: string;
  aplicacao_laboratorial: string;
  normas_atendidas: string;
  diferenciais: string;
  faixa_preco: number | null;
  especificacoes: Record<string, string>;
}

export const LEGACY_PLACEHOLDER_PRODUCT_IDS = [
  'prd-estufa-200',
  'prd-autoclave-75',
  'prd-bod-350',
  'prd-capela-1200',
  'prd-banho-20',
  'prd-mufla-1200',
];

export const AUTEC_OFFICIAL_PRODUCTS: OfficialProductSeed[] = [
  // =========================================================================
  // 1. CROMATOGRAFIA ANALÍTICA (12 — CAMAG)
  // =========================================================================
  {
    id: 'prd-camag-hptlc-pro',
    codigo: 'CAM-HPTLC-PRO',
    nome_equipamento: 'HPTLC Pro',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Sistema modular totalmente automatizado para cromatografia em camada delgada de alta eficiência (HPTLC), com módulo de aplicação em banda de alta precisão em placas de vidro 20 × 10 cm.',
    normas_atendidas: 'USP <203>, Farmacopeia Europeia (Ph. Eur. 2.8.25), Boas Práticas de Laboratório (cGMP / GLP)',
    diferenciais:
      'Automação completa do fluxo analítico HPTLC com alta reprodutibilidade entre corridas, rastreabilidade para controle de qualidade farmacêutico e fitoterápico.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      'Formato de Placa': 'Placas de vidro HPTLC 20 × 10 cm',
      Operação: 'Módulos automatizados integrados',
      'Página Oficial': 'https://autec.com.br/camag-hptlc-pro',
    },
  },
  {
    id: 'prd-camag-tlc-visualizer-3',
    codigo: 'CAM-TLC-VIS3',
    nome_equipamento: 'CAMAG – TLC Visualizer 3',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Sistema de captura de imagens em alta resolução e documentação digital padronizada de placas TLC e HPTLC sob iluminação UV 254 nm, UV 366 nm e luz branca.',
    normas_atendidas: 'USP <203>, Ph. Eur., 21 CFR Part 11 (via visionCATS)',
    diferenciais:
      'Iluminação homogênea calibrada com câmera científica de alta sensibilidade para avaliação visual, comparação lado a lado e arquivamento auditável.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      Iluminação: 'UV 254 nm, UV 366 nm e Luz Branca',
      Software: 'Compatível com CAMAG visionCATS',
      'Página Oficial': 'https://autec.com.br/camag-tlc-visualizer-3',
    },
  },
  {
    id: 'prd-camag-ats4',
    codigo: 'CAM-ATS4',
    nome_equipamento: 'Automatic TLC Sampler (ATS4)',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Aplicador automático de amostras em placas TLC/HPTLC para análises qualitativas, quantitativas e separações preparativas.',
    normas_atendidas: 'USP <203>, Farmacopeias Internacionais, cGMP',
    diferenciais:
      'Aplicação totalmente automatizada em pontos ou bandas por spray ou contato, aumentando precisão volumétrica e produtividade em rotinas de CQ.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      'Modo de Aplicação': 'Pontos, bandas e áreas retangulares',
      Aplicação: 'Analítica e Preparativa em TLC/HPTLC',
      'Página Oficial': 'https://autec.com.br/automatic-tlc-sampler-ats4',
    },
  },
  {
    id: 'prd-camag-linomat-5',
    codigo: 'CAM-LINOMAT5',
    nome_equipamento: 'Linomat 5',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Aplicador semiautomático por spray em forma de bandas sobre placas TLC/HPTLC utilizando nitrogênio ou ar comprimido.',
    normas_atendidas: 'USP <203>, Ph. Eur., Controle de Qualidade Botânico e Farmacêutico',
    diferenciais:
      'Permite aplicar volumes maiores sem sobrecarga da fase estacionária, gerando bandas estreitas de alta resolução cromatográfica.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      'Gás de Operação': 'Nitrogênio ou Ar Comprimido',
      Automação: 'Semiautomático com dosagem controlada',
      'Página Oficial': 'https://autec.com.br/linomat-5',
    },
  },
  {
    id: 'prd-camag-tlc-scanner-4',
    codigo: 'CAM-SCANNER4',
    nome_equipamento: 'CAMAG – TLC Scanner 4',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Densitômetro de alta precisão para avaliação quantitativa e espectral de cromatogramas em placas TLC/HPTLC e outros objetos planos.',
    normas_atendidas: 'USP <203>, Ph. Eur., Validação Analítica ICH Q2',
    diferenciais:
      'Medição por absorbância UV/Vis e fluorescência com aquisição de espectros in situ para identificação inequívoca de picos.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      Técnica: 'Densitometria UV/Vis e Fluorescência',
      Software: 'Integração com visionCATS',
      'Página Oficial': 'https://autec.com.br/camag-tlc-scanner-4',
    },
  },
  {
    id: 'prd-camag-adc2',
    codigo: 'CAM-ADC2',
    nome_equipamento: 'Automatic Developing Chamber 2 (ADC2)',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Câmara automática de eluição isocrática para placas e folhas TLC/HPTLC no formato 20 × 10 cm com controle ambiental padronizado.',
    normas_atendidas: 'USP <203>, Ph. Eur. (controle de umidade relativa e saturação)',
    diferenciais:
      'Controle ativo de umidade relativa, pré-condicionamento, saturação da câmara e secagem automatizada, garantindo Rf altamente reprodutível.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      'Formato de Placa': '20 × 10 cm',
      Desenvolvimento: 'Isocrático automatizado com controle de umidade',
      'Página Oficial': 'https://autec.com.br/camag-automatic-developing-chamber-2-adc2',
    },
  },
  {
    id: 'prd-camag-derivatizer',
    codigo: 'CAM-DERIVATIZER',
    nome_equipamento: 'CAMAG® Derivatizer',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Dispositivo automatizado para derivatização (revelação química) homogênea de placas TLC e HPTLC em sistema fechado.',
    normas_atendidas: 'USP <203>, Boas Práticas de Segurança Laboratorial',
    diferenciais:
      'Substitui borrifação manual por microgotículas fechadas em câmara vedada, reduzindo consumo de reagentes, exposição do operador e variabilidade.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      Função: 'Derivatização automatizada por microspray fechado',
      Segurança: 'Sistema vedado sem névoa externa',
      'Página Oficial': 'https://www.autec.com.br/camag-derivatizer',
    },
  },
  {
    id: 'prd-camag-tlc-ms-interface-2',
    codigo: 'CAM-TLC-MS2',
    nome_equipamento: 'CAMAG – TLC-MS Interface 2',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Interface prática e versátil para eluição direta e livre de contaminações de bandas de TLC/HPTLC com transferência online para espectrômetro de massas (MS).',
    normas_atendidas: 'Identificação estrutural em P&D Farmacêutico, Forense e Fitoquímica',
    diferenciais:
      'Conexão plug-and-play com sistemas LC-MS sem raspagem manual de sílica, reduzindo interferências e acelerando confirmação de substâncias.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      Acoplamento: 'Transferência online TLC/HPTLC para MS',
      Manutenção: 'Autolimpeza entre eluições',
      'Página Oficial': 'https://autec.com.br/camag-tlc-ms-interface-2',
    },
  },
  {
    id: 'prd-camag-amd2',
    codigo: 'CAM-AMD2',
    nome_equipamento: 'Automatic Multiple Development 2 (AMD-2)',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Sistema automatizado de desenvolvimento múltiplo por gradiente para separação de misturas complexas em placas HPTLC.',
    normas_atendidas: 'Análises ambientais, lipídios, pesticidas e matrizes complexas',
    diferenciais:
      'Realiza múltiplos desenvolvimentos sucessivos com gradiente de solventes na mesma direção e secagem a vácuo intermediária para máxima resolução.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      Técnica: 'Desenvolvimento múltiplo por gradiente passo a passo',
      'Página Oficial': 'https://autec.com.br/amd-2-automatic-multiple-development-2',
    },
  },
  {
    id: 'prd-camag-tlc-sprayer',
    codigo: 'CAM-SPRAYER',
    nome_equipamento: 'TLC/HPTLC Sprayer',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Pulverizador eletropneumático com frasco para solvente e dois cabeçotes intercambiáveis para aplicação de reagentes reveladores em placas TLC/HPTLC.',
    normas_atendidas: 'Procedimentos gerais de revelação cromatográfica em TLC/HPTLC',
    diferenciais:
      'Cabeçotes específicos para soluções alcoólicas/baixa viscosidade e soluções viscosas como ácido sulfúrico aquoso ou reagentes corantes.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      Configuração: 'Bomba + 2 cabeças de pulverização (tipos A e B)',
      'Página Oficial': 'https://autec.com.br/tlc-hptlc-sprayer',
    },
  },
  {
    id: 'prd-camag-glass-sprayer',
    codigo: 'CAM-GLASS-SPRAY',
    nome_equipamento: 'CAMAG® Glass Reagent Sprayer',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Pulverizador de vidro borossilicato com pera de borracha ou conexão para ar comprimido/nitrogênio, para derivatização de placas TLC/HPTLC.',
    normas_atendidas: 'Rotinas laboratoriais de ensino e triagem em TLC/HPTLC',
    diferenciais:
      'Alternativa econômica e quimicamente inerte compatível com diversos reagentes reveladores e alimentação pneumática opcional.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      Material: 'Vidro resistente a reagentes',
      Alimentação: 'Manual (pera) ou ar comprimido / nitrogênio',
      'Página Oficial': 'https://autec.com.br/camag-glass-reagent-sprayer',
    },
  },
  {
    id: 'prd-camag-immersion-device-3',
    codigo: 'CAM-IMMERSION3',
    nome_equipamento: 'Chromatogram Immersion Device 3',
    categoria: 'Cromatografia Analítica',
    aplicacao_laboratorial:
      'Equipamento motorizado para imersão vertical padronizada de placas TLC/HPTLC em reagentes de derivatização.',
    normas_atendidas: 'USP <203>, Ph. Eur. (padronização de derivatização)',
    diferenciais:
      'Velocidade vertical e tempo de imersão controlados eletronicamente, evitando manchas e borrões que prejudicam a avaliação densitométrica.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CAMAG',
      'Linha Autec': 'Cromatografia Analítica',
      Controle: 'Velocidade de imersão e tempo programáveis',
      'Página Oficial': 'https://autec.com.br/chromatogram-immersion-device-3',
    },
  },

  // =========================================================================
  // 2. CROMATOGRAFIA PREPARATIVA (6 — Biotage & Advion Interchim)
  // =========================================================================
  {
    id: 'prd-biotage-selekt',
    codigo: 'BIO-SELEKT',
    nome_equipamento: 'Biotage® Selekt Systems',
    categoria: 'Cromatografia Preparativa',
    aplicacao_laboratorial:
      'Sistema automático avançado de purificação por cromatografia Flash para descoberta de novas moléculas, síntese orgânica e P&D químico-farmacêutico.',
    normas_atendidas: 'Boas Práticas de P&D e Purificação Farmacêutica',
    diferenciais:
      'Dois canais independentes de colunas, alta pressão e vazão para purificações rápidas, redução de consumo de solvente e interface touchscreen moderna.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage',
      'Linha Autec': 'Cromatografia Preparativa',
      Técnica: 'Cromatografia Flash Automatizada',
      Canais: 'Suporte a troca rápida de cartuchos em canal duplo',
      'Página Oficial': 'https://autec.com.br/biotage-selekt-systems',
    },
  },
  {
    id: 'prd-biotage-elsd-a120',
    codigo: 'BIO-ELSD-A120',
    nome_equipamento: 'Biotage® ELSD-A120',
    categoria: 'Cromatografia Preparativa',
    aplicacao_laboratorial:
      'Detector evaporativo de dispersão de luz (ELSD) universal para acoplamento em sistemas de purificação Flash na detecção de compostos sem cromóforos UV/Vis.',
    normas_atendidas: 'Purificação de carboidratos, lipídios, polímeros e produtos naturais',
    diferenciais:
      'Detecta compostos orgânicos transparentes ao UV, ampliando o alcance de coleta automática de frações puras.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage',
      'Linha Autec': 'Cromatografia Preparativa',
      Detecção: 'Espalhamento de Luz Evaporativo (ELSD) Universal',
      Compatibilidade: 'Sistemas de cromatografia Flash Biotage',
      'Página Oficial': 'https://autec.com.br/biotage-elsd-a120',
    },
  },
  {
    id: 'prd-biotage-isolera-spektra-one',
    codigo: 'BIO-ISOLERA-ONE',
    nome_equipamento: 'Isolera Spektra ONE',
    categoria: 'Cromatografia Preparativa',
    aplicacao_laboratorial:
      'Sistema inteligente de cromatografia Flash com tecnologia ACI (Sistema Acelerado para Isolação Cromatográfica) para purificação rápida de compostos.',
    normas_atendidas: 'P&D Químico, Farmacêutico e Acadêmico',
    diferenciais:
      'Otimização automática de gradiente baseada em TLC e detecção em todo o espectro UV-Vis para separar compostos com pureza superior e menor gasto de solvente.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage',
      'Linha Autec': 'Cromatografia Preparativa',
      Tecnologia: 'Spektra + ACI™ (Isolação Cromatográfica Acelerada)',
      'Página Oficial': 'https://autec.com.br/isolera-spektra-one/',
    },
  },
  {
    id: 'prd-advion-puriflash-5250',
    codigo: 'ADV-PF5250',
    nome_equipamento: 'puriFlash® 5.250',
    categoria: 'Cromatografia Preparativa',
    aplicacao_laboratorial:
      'Sistema de HPLC preparativo e Flash de alta flexibilidade e elevada capacidade de purificação para pesquisa, desenvolvimento de métodos e produção de compostos de alta pureza.',
    normas_atendidas: 'Aplicações de P&D, Química Medicinal e Produtos Naturais',
    diferenciais:
      'Versatilidade para operar em modo Flash e Prep-HPLC até 250 bar com precisão na coleta de frações e software inteligente.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Advion Interchim Scientific',
      'Linha Autec': 'Cromatografia Preparativa',
      'Pressão Máxima': 'Até 250 bar',
      Aplicação: 'Cromatografia Flash e HPLC Preparativo',
      'Página Oficial': 'https://autec.com.br/puriflash-5250/',
    },
  },
  {
    id: 'prd-advion-puriflash-5400',
    codigo: 'ADV-PF5400',
    nome_equipamento: 'puriFlash® 5.400',
    categoria: 'Cromatografia Preparativa',
    aplicacao_laboratorial:
      'Sistema de HPLC preparativo de ultra alta pressão (400 bar) que integra desenvolvimento de métodos analíticos e purificação preparativa em uma única plataforma.',
    normas_atendidas: 'Desenvolvimento analítico e purificação preparativa de alta resolução',
    diferenciais:
      'Elimina transferência entre equipamentos analíticos e preparativos, operando até 400 bar com alta resolução cromatográfica.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Advion Interchim Scientific',
      'Linha Autec': 'Cromatografia Preparativa',
      'Pressão Máxima': 'Até 400 bar (UHPLC/Prep-HPLC)',
      Integração: 'Analítico + Preparativo na mesma plataforma',
      'Página Oficial': 'https://autec.com.br/puriflash-5400',
    },
  },
  {
    id: 'prd-advion-puriflash-5250p',
    codigo: 'ADV-PF5250P',
    nome_equipamento: 'puriFlash® 5.250P',
    categoria: 'Cromatografia Preparativa',
    aplicacao_laboratorial:
      'Sistema de HPLC preparativo dedicado especialmente à purificação de peptídeos e oligonucleotídeos com separação de compostos de tempos de retenção muito próximos.',
    normas_atendidas: 'Purificação bioquímica, peptídeos terapêuticos e oligonucleotídeos',
    diferenciais:
      'Projeto otimizado para alta seletividade em biomoléculas e gradientes precisos para máxima recuperação e pureza.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Advion Interchim Scientific',
      'Linha Autec': 'Cromatografia Preparativa',
      'Alvo Principal': 'Peptídeos e Oligonucleotídeos',
      'Pressão Máxima': '250 bar',
      'Página Oficial': 'https://autec.com.br/puriflash-5250p',
    },
  },

  // =========================================================================
  // 3. EVAPORAÇÃO DE SOLVENTES E CONCENTRAÇÃO DE AMOSTRAS (4 — Biotage)
  // =========================================================================
  {
    id: 'prd-biotage-v10-touch',
    codigo: 'BIO-V10-TOUCH',
    nome_equipamento: 'Biotage® V-10 Touch',
    categoria: 'Evaporação de Solventes e Concentração de Amostras',
    aplicacao_laboratorial:
      'Evaporador centrífugo rápido para secagem de amostras em solventes aquosos e orgânicos, frações de HPLC e solventes com alto ponto de ebulição (DMSO, DMF, água).',
    normas_atendidas: 'Fluxos de purificação, química medicinal e preparo para LC-MS',
    diferenciais:
      'Secagem ultrarrápida sem superaquecimento e técnica exclusiva de secagem direta em sílica para carregamento a seco antes de purificação Flash.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage',
      'Linha Autec': 'Evaporação de Solventes e Concentração de Amostras',
      Solventes: 'Aquosos, orgânicos e alto ponto de ebulição (DMSO/DMF)',
      Diferencial: 'Secagem direta em cartucho/sílica para dry-loading',
      'Página Oficial': 'https://autec.com.br/biotage-v-10-touch',
    },
  },
  {
    id: 'prd-biotage-turbovap-lv',
    codigo: 'BIO-TURBOVAP-LV',
    nome_equipamento: 'TurboVap® LV',
    categoria: 'Evaporação de Solventes e Concentração de Amostras',
    aplicacao_laboratorial:
      'Concentrador de amostras de baixo volume por vórtice de gás nitrogênio e banho térmico controlado para até 48 amostras em tubos ou vials.',
    normas_atendidas: 'Análises ambientais (EPA), toxicologia, alimentos e bioanálise',
    diferenciais:
      'Segunda geração da linha líder mundial TurboVap® com racks intercambiáveis Multi-Rack, fluxo de gás programável e controle visual do menisco.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage',
      'Linha Autec': 'Evaporação de Solventes e Concentração de Amostras',
      Técnica: 'Evaporação por vórtice de nitrogênio com aquecimento',
      Capacidade: 'Múltiplos formatos de tubos e vials (Multi-Rack)',
      'Página Oficial': 'https://autec.com.br/turbovap-lv',
    },
  },
  {
    id: 'prd-biotage-turbovap-ii',
    codigo: 'BIO-TURBOVAP-II',
    nome_equipamento: 'TurboVap® II',
    categoria: 'Evaporação de Solventes e Concentração de Amostras',
    aplicacao_laboratorial:
      'Evaporador de solventes para volumes médios e grandes (frascos de 50 mL a 200 mL), ideal para concentração após extração líquido-líquido ou Soxhlet.',
    normas_atendidas: 'Métodos ambientais EPA, análise de resíduos e contaminantes',
    diferenciais:
      'Detecção automática de ponto final por sensor óptico, evitando secagem excessiva e perda de analitos voláteis.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage',
      'Linha Autec': 'Evaporação de Solventes e Concentração de Amostras',
      Capacidade: '6 posições para tubos concentradores de 50 mL ou 200 mL',
      Sensor: 'Detecção óptica de volume final',
      'Página Oficial': 'https://autec.com.br/turbovap-ii',
    },
  },
  {
    id: 'prd-biotage-spe-dry-96',
    codigo: 'BIO-SPEDRY-96',
    nome_equipamento: 'Biotage® SPE Dry 96',
    categoria: 'Evaporação de Solventes e Concentração de Amostras',
    aplicacao_laboratorial:
      'Sistema de evaporação de solventes de alta vazão para microplacas, compatível com placas coletoras de 24, 96 e 384 poços (modelos Single e Dual).',
    normas_atendidas: 'Bioanálise, triagem de alto rendimento (HTS) e toxicologia clínica',
    diferenciais:
      'Fluxo dual superior e inferior aquecido com controle independente de temperatura e vazão para secagem uniforme sem contaminação cruzada.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage',
      'Linha Autec': 'Evaporação de Solventes e Concentração de Amostras',
      Compatibilidade: 'Microplacas de 24, 96 e 384 poços',
      Configuração: 'Single (1 placa) ou Dual (2 placas simultâneas)',
      'Página Oficial': 'https://autec.com.br/biotage-spe-dry-96',
    },
  },

  // =========================================================================
  // 4. PREPARO DE AMOSTRAS (12 — Biotage, Biocomma & CEM)
  // =========================================================================
  {
    id: 'prd-biotage-extrahera',
    codigo: 'BIO-EXTRAHERA',
    nome_equipamento: 'Biotage® Extrahera™',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Estação automatizada de preparo de amostras para Extração em Fase Sólida (SPE), Extração Líquida em Fase Suportada (SLE), depleção de fosfolipídeos (PLD) e precipitação de proteínas (PPT).',
    normas_atendidas: 'Bioanálise GLP, Toxicologia, Forense e Resíduos em Alimentos',
    diferenciais:
      'Pressão positiva integrada com interface intuitiva e operação flexível tanto em placas de 96 poços quanto em cartuchos de 1, 3 e 6 mL.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage',
      'Linha Autec': 'Preparo de Amostras',
      Técnicas: 'SPE, SLE, PLD e PPT automatizados',
      Formatos: 'Placas de 96 poços e cartuchos 1 / 3 / 6 mL',
      'Página Oficial': 'https://autec.com.br/biotage-extrahera',
    },
  },
  {
    id: 'prd-biotage-pressure-96',
    codigo: 'BIO-PRESS96',
    nome_equipamento: 'Pressure + 96',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Manifold de pressão positiva para processamento paralelo de amostras em placas de 96 poços e cartuchos SPE/SLE.',
    normas_atendidas: 'Rotinas de LC-MS/MS em laboratórios clínicos, bioanalíticos e ambientais',
    diferenciais:
      'Pressão positiva uniforme por poço garante fluxo constante independentemente da viscosidade da matriz, superando limitações do vácuo.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage',
      'Linha Autec': 'Preparo de Amostras',
      Formato: 'Placas de 96 poços',
      Acionamento: 'Pressão positiva controlada (ar/nitrogênio)',
      'Página Oficial': 'https://autec.com.br/pressure-96',
    },
  },
  {
    id: 'prd-biotage-pressure-48',
    codigo: 'BIO-PRESS48',
    nome_equipamento: 'Pressure + 48',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Manifold de pressão positiva de 48 posições para cartuchos de SPE/SLE de 1 mL, 3 mL e 6 mL.',
    normas_atendidas: 'Preparo de amostras para cromatografia GC-MS e LC-MS',
    diferenciais:
      'Fluxo uniforme e constante mesmo em amostras viscosas como sangue total, plasma, óleos ou extratos de alimentos.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage',
      'Linha Autec': 'Preparo de Amostras',
      Capacidade: 'Até 48 cartuchos paralelos (1 mL, 3 mL e 6 mL)',
      Acionamento: 'Pressão positiva controlada',
      'Página Oficial': 'https://autec.com.br/pressure-48',
    },
  },
  {
    id: 'prd-biotage-isolute-spe',
    codigo: 'BIO-ISOLUTE-SPE',
    nome_equipamento: 'Cartuchos de SPE',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Linha ISOLUTE® de cartuchos e placas de 96 poços para Extração em Fase Sólida (SPE) com adsorventes apolares, de troca iônica e modo misto.',
    normas_atendidas: 'Métodos oficiais EPA, MAPA, ANVISA e Farmacopeias',
    diferenciais:
      'Alta pureza e reprodutibilidade lote a lote em fases poliméricas e base sílica para extração limpa antes de HPLC/UHPLC e GC.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biotage (ISOLUTE®)',
      'Linha Autec': 'Preparo de Amostras',
      Químicas: 'Apolar, Troca Iônica, Modo Misto e Fase Reversa',
      Formatos: 'Cartuchos e placas 96 poços',
      'Página Oficial': 'https://autec.com.br/cartuchos-de-spe',
    },
  },
  {
    id: 'prd-biocomma-filtros-seringa',
    codigo: 'BCM-FILTROS',
    nome_equipamento: 'Filtros de Seringa',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Filtros de seringa Biocomma com membranas de alta qualidade (PTFE, Nylon, PVDF, PES, MCE) para clarificação de amostras antes de injeção cromatográfica.',
    normas_atendidas: 'Padrões rigorosos de qualidade comparáveis aos líderes globais',
    diferenciais:
      'Baixo volume morto, mínima ligação inespecífica de analitos e excelente relação custo-benefício para rotinas de HPLC/UHPLC.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Biocomma',
      'Linha Autec': 'Preparo de Amostras',
      Aplicação: 'Filtração pré-HPLC, LC-MS e ensaios analíticos',
      'Página Oficial': 'https://autec.com.br/filtros-de-seringa/',
    },
  },
  {
    id: 'prd-cem-phoenix-black',
    codigo: 'CEM-PHOENIX-BLK',
    nome_equipamento: 'Phoenix BLACK – Forno Mufla',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Forno mufla por micro-ondas para calcinação ultrarrápida e determinação de cinzas em amostras poliméricas, alimentícias, farmacêuticas e petroquímicas.',
    normas_atendidas: 'USP <281>, ASTM, AOAC, ISO (reduz ciclos de horas para minutos)',
    diferenciais:
      'Calcinação até 10x mais rápida que muflas convencionais com interface touchscreen e exaustão integrada segura.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Preparo de Amostras',
      Tecnologia: 'Aquecimento por micro-ondas para calcinação',
      Interface: 'Touchscreen com programação de métodos',
      'Página Oficial': 'https://autec.com.br/cem-phoenix-black',
    },
  },
  {
    id: 'prd-cem-phoenix-black-sulfated',
    codigo: 'CEM-PHOENIX-SASH',
    nome_equipamento: 'Phoenix BLACK Sulfated Ash – Forno Mufla',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Forno mufla por micro-ondas específico para determinação de cinzas sulfatadas (resíduo por ignição) com adição direta de H₂SO₄.',
    normas_atendidas: 'USP <281> (Resíduo por Ignição), Ph. Eur. 2.4.14, Farmacopeia Brasileira',
    diferenciais:
      'Realiza calcinação sulfatada completa e segura em até 45 minutos sem pré-calcinação em bico de Bunsen ou chapa, reduzindo exposição a vapores ácidos.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Preparo de Amostras',
      'Tempo de Ciclo': 'Completa em até 45 minutos',
      Segurança: 'Elimina pré-calcinação manual com H₂SO₄',
      'Página Oficial': 'https://autec.com.br/cem-phoenix-black-sultated-ash',
    },
  },
  {
    id: 'prd-cem-sam-255',
    codigo: 'CEM-SAM255',
    nome_equipamento: 'SAM 255 – Estufa por Micro-ondas',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Estufa por micro-ondas para secagem rápida de amostras grandes (até 1 kg) de sólidos, lodos, minerais, polímeros e alimentos.',
    normas_atendidas: 'Ensaios gravimétricos e preparo rápido para análise elementar',
    diferenciais:
      'Seca amostras de até 1 kg em minutos, reduzindo drasticamente o tempo operacional em relação a estufas térmicas convencionais.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Preparo de Amostras',
      Capacidade: 'Amostras de até 1 kg',
      Tecnologia: 'Secagem por micro-ondas de alta velocidade',
      'Página Oficial': 'https://autec.com.br/cem-sam-255%20',
    },
  },
  {
    id: 'prd-cem-mars-xpress-2',
    codigo: 'CEM-MARSX2',
    nome_equipamento: 'MARS Xpress 2.0 - Sistema de Digestão por Micro-ondas',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Sistema de digestão ácida por micro-ondas em batelada para preparo de amostras visando ICP-OES, ICP-MS e AAS.',
    normas_atendidas: 'EPA 3015A, EPA 3051A, EPA 3052, USP <232>/<233>',
    diferenciais:
      'Montagem simples de vasos Xpress, detecção automática do tipo e quantidade de frascos e controle inteligente de temperatura sem contato.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Preparo de Amostras',
      Aplicação: 'Digestão para análise elementar (ICP/AAS)',
      Automação: 'Reconhecimento automático de vasos e sensores IR',
      'Página Oficial': 'https://autec.com.br/cem-marsxpress-2-0',
    },
  },
  {
    id: 'prd-cem-mars-6',
    codigo: 'CEM-MARS6',
    nome_equipamento: 'MARS 6 - Sistema de Digestão por Micro-ondas',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Sistema avançado de digestão ácida por micro-ondas para matrizes desafiadoras em farmácia, alimentos, meio ambiente, mineração e polímeros.',
    normas_atendidas: 'EPA 3015A, EPA 3051A, EPA 3052, USP <232>/<233>, AOAC',
    diferenciais:
      'Tecnologia iWave® de controle térmico direto da amostra, sensores OneTouch® que reconhecem vasos e métodos pré-programados para máxima segurança.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Preparo de Amostras',
      Potência: 'Até 1800 W com controle iWave® sem fios',
      Segurança: 'Sensores de reconhecimento automático de rotor e frascos',
      'Página Oficial': 'https://autec.com.br/cem-mars6',
    },
  },
  {
    id: 'prd-cem-blade',
    codigo: 'CEM-BLADE',
    nome_equipamento: 'BLADE - Sistema Sequencial de Digestão por Micro-ondas Automatizado',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Sistema sequencial automatizado de digestão ácida por micro-ondas de altíssima velocidade com carregador automático para análises elementares.',
    normas_atendidas: 'EPA, USP <232>/<233>, AOAC, Controle Elemental de Alta Vazão',
    diferenciais:
      'Digere e resfria amostras individuais em poucos minutos de forma totalmente automatizada, utilizando vasos de quartzo de fácil fechamento.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Preparo de Amostras',
      Modo: 'Digestão sequencial automatizada com amostrador',
      Aplicação: 'ICP-OES, ICP-MS e AAS de alta produtividade',
      'Página Oficial': 'https://autec.com.br/cem-blade',
    },
  },
  {
    id: 'prd-cem-mars6-extraction',
    codigo: 'CEM-MARS6-EXT',
    nome_equipamento: 'MARS 6 Extraction - Sistema de Extração por Micro-ondas',
    categoria: 'Preparo de Amostras',
    aplicacao_laboratorial:
      'Sistema de extração por solventes assistida por micro-ondas para recuperação rápida de orgânicos semivoláteis, pesticidas, PCBs, PAHs e polímeros.',
    normas_atendidas: 'EPA 3546, ASTM D7210, Extração de Contaminantes Orgânicos',
    diferenciais:
      'Potência de 2000 W com capacidade para até 40 amostras por lote, utilizando até 85% menos solvente que o método Soxhlet tradicional.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Preparo de Amostras',
      Potência: '2000 W',
      Capacidade: 'Até 40 amostras por lote (até 85% menos solvente)',
      'Página Oficial': 'https://autec.com.br/cem-mars6-extraction',
    },
  },

  // =========================================================================
  // 5. ANÁLISE DE PROCESSOS E ESTABILIDADE (10 — LUM & CEM)
  // =========================================================================
  {
    id: 'prd-lum-lumisizer',
    codigo: 'LUM-SIZER',
    nome_equipamento: 'LUMiSizer',
    categoria: 'Análise de Processos e Estabilidade',
    aplicacao_laboratorial:
      'Analisador centrífugo de dispersões com tecnologia STEP para avaliação acelerada de estabilidade física, vida de prateleira (shelf life) e distribuição de tamanho de partículas.',
    normas_atendidas: 'ISO/TR 13097, ISO 13318-2',
    diferenciais:
      'Acelera testes de estabilidade em até 2.300x em relação à gravidade ambiente, analisando até 12 amostras simultaneamente com perfis espaciais completos.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'LUM',
      'Linha Autec': 'Análise de Processos e Estabilidade',
      Tecnologia: 'STEP-Technology® (Space- and Time-resolved Extinction Profiles)',
      'Capacidade Simultânea': 'Até 12 amostras',
      'Página Oficial': 'https://autec.com.br/lumisizer',
    },
  },
  {
    id: 'prd-lum-lumifuge',
    codigo: 'LUM-FUGE',
    nome_equipamento: 'LUMiFuge',
    categoria: 'Análise de Processos e Estabilidade',
    aplicacao_laboratorial:
      'Analisador de estabilidade de emulsões, suspensões e dispersões industriais, permitindo prever shelf life, sedimentação e cremeação rapidamente.',
    normas_atendidas: 'ISO/TR 13097',
    diferenciais:
      'Quantifica diretamente instabilidade física em formulações concentradas sem diluição, ideal para P&D e Controle de Qualidade de cosméticos, fármacos e alimentos.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'LUM',
      'Linha Autec': 'Análise de Processos e Estabilidade',
      Tecnologia: 'STEP-Technology® em centrífuga analítica',
      'Página Oficial': 'https://autec.com.br/lumifuge',
    },
  },
  {
    id: 'prd-lum-lumireader-psa',
    codigo: 'LUM-READER-PSA',
    nome_equipamento: 'LUMiReader PSA',
    categoria: 'Análise de Processos e Estabilidade',
    aplicacao_laboratorial:
      'Analisador de estabilidade em gravidade real (1g) e distribuição granulométrica usando tecnologia STEP para emulsões e suspensões.',
    normas_atendidas: 'ISO/TR 13097, ISO 13317-3',
    diferenciais:
      'Mede instantaneamente o perfil de extinção de luz transmitida ao longo de todo o comprimento da amostra em condições reais de armazenamento.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'LUM',
      'Linha Autec': 'Análise de Processos e Estabilidade',
      Técnica: 'Extinção óptica STEP em gravidade real (1g)',
      'Página Oficial': 'https://autec.com.br/lumireader-psa',
    },
  },
  {
    id: 'prd-lum-lumireader-xray',
    codigo: 'LUM-READER-XRAY',
    nome_equipamento: 'LUMiReader X-Ray',
    categoria: 'Análise de Processos e Estabilidade',
    aplicacao_laboratorial:
      'Analisador de dispersões opacas em tempo real por transmissão de raios X para estudo de estabilidade, separação de fases e sedimentação em pastas, lamas e concentrados.',
    normas_atendidas: 'ISO/TR 13097, Caracterização de Dispersões Opacas',
    diferenciais:
      'Permite analisar amostras totalmente opacas à luz visível e NIR sem qualquer diluição da matriz original.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'LUM',
      'Linha Autec': 'Análise de Processos e Estabilidade',
      Técnica: 'Transmissão de Raios X resolvida em tempo e espaço',
      'Página Oficial': 'https://autec.com.br/lumireader-x-ray',
    },
  },
  {
    id: 'prd-lum-lumiflector',
    codigo: 'LUM-FLECTOR',
    nome_equipamento: 'LUMiFlector',
    categoria: 'Análise de Processos e Estabilidade',
    aplicacao_laboratorial:
      'Espectrômetro compacto multiparâmetro para monitoramento de processos e controle de qualidade em linha ou bancada (leite, emulsões, bebidas e processos industriais).',
    normas_atendidas: 'Controle de Qualidade e PAT (Process Analytical Technology)',
    diferenciais:
      'Medição rápida e não destrutiva de múltiplos parâmetros físico-químicos simultaneamente para tomada de decisão imediata em linha produtiva.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'LUM',
      'Linha Autec': 'Análise de Processos e Estabilidade',
      Aplicação: 'Monitoramento de processos e controle de qualidade rápido',
      'Página Oficial': 'https://autec.com.br/lumiflector',
    },
  },
  {
    id: 'prd-lum-lumispoc',
    codigo: 'LUM-SPOC',
    nome_equipamento: 'LUMiSpoc',
    categoria: 'Análise de Processos e Estabilidade',
    aplicacao_laboratorial:
      'Fotômetro de luz dispersa de partícula única (SPOS) para medição de distribuição de tamanho e concentração numérica de nano e micropartículas.',
    normas_atendidas: 'ISO 21501, Caracterização de Nanopartículas e Emulsões',
    diferenciais:
      'Alta resolução e ampla faixa dinâmica para contagem individual de partículas em suspensões, vacinas, lipossomas e emulsões parenterais.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'LUM',
      'Linha Autec': 'Análise de Processos e Estabilidade',
      Técnica: 'Single Particle Light Scattering (Contagem e Tamanho)',
      'Página Oficial': 'https://autec.com.br/lumispoc',
    },
  },
  {
    id: 'prd-lum-lumifrac',
    codigo: 'LUM-FRAC',
    nome_equipamento: 'LUMiFrac',
    categoria: 'Análise de Processos e Estabilidade',
    aplicacao_laboratorial:
      'Testador centrífugo de adesão e coesão para determinação quantitativa da resistência de materiais adesivos, revestimentos, compósitos e filmes.',
    normas_atendidas: 'DIN EN 15870, ISO 4624 (testes de adesão/tração centrífuga)',
    diferenciais:
      'Testa múltiplos corpos de prova simultaneamente por força centrífuga com alta precisão e reprodutibilidade estatística.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'LUM',
      'Linha Autec': 'Análise de Processos e Estabilidade',
      Aplicação: 'Resistência à tração, cisalhamento e adesão de revestimentos',
      'Página Oficial': 'https://autec.com.br/lumifrac',
    },
  },
  {
    id: 'prd-cem-smart-6',
    codigo: 'CEM-SMART6',
    nome_equipamento: 'SMART 6 - Analisador de Umidade e Sólidos por Micro-ondas e Infravermelho',
    categoria: 'Análise de Processos e Estabilidade',
    aplicacao_laboratorial:
      'Analisador rápido e preciso de umidade e sólidos totais para alimentos, laticínios, químicos, farmacêuticos e papel.',
    normas_atendidas: 'AOAC 985.14, AOAC 2008.06, Métodos de Referência MAPA',
    diferenciais:
      'Tecnologia iPower® combina micro-ondas e infravermelho para resultados em 2 a 3 minutos com precisão de estufa de referência.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Análise de Processos e Estabilidade',
      Tecnologia: 'Micro-ondas + Infravermelho (iPower®)',
      'Página Oficial': 'https://autec.com.br/cem-smart6',
    },
  },
  {
    id: 'prd-cem-oracle',
    codigo: 'CEM-ORACLE',
    nome_equipamento: 'ORACLE - Analisador Rápido de Gordura por RMN',
    categoria: 'Análise de Processos e Estabilidade',
    aplicacao_laboratorial:
      'Analisador rápido de gordura total por Ressonância Magnética Nuclear (RMN) no domínio do tempo, certificado pelo MAPA.',
    normas_atendidas: 'Certificado pelo MAPA, AOAC Official Method 2008.06 (compatível com referência)',
    diferenciais:
      'Primeiro analisador de gordura que não requer desenvolvimento ou calibração de método, entregando precisão de química de referência em ~30 segundos sem solventes.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Análise de Processos e Estabilidade',
      Técnica: 'Ressonância Magnética Nuclear (TD-NMR)',
      Certificação: 'Certificado pelo MAPA (sem desenvolvimento de método)',
      'Página Oficial': 'https://autec.com.br/cem-oracle',
    },
  },
  {
    id: 'prd-cem-sprint',
    codigo: 'CEM-SPRINT',
    nome_equipamento: 'Sprint - Analisador Rápido de Proteína',
    categoria: 'Análise de Processos e Estabilidade',
    aplicacao_laboratorial:
      'Analisador rápido e direto de proteínas em alimentos, carnes, laticínios e rações, substituindo os métodos tradicionais Kjeldahl e Dumas.',
    normas_atendidas: 'AOAC 2011.04 (referência para tecnologia iTAG em lácteos/alimentos)',
    diferenciais:
      'Determina proteína verdadeira (não nitrogênio não-proteico) em menos de 5 minutos usando tecnologia iTAG, sem ácidos corrosivos ou gases perigosos.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Análise de Processos e Estabilidade',
      Tecnologia: 'Marcação proteica direta iTAG®',
      'Tempo de Análise': 'Inferior a 5 minutos',
      'Página Oficial': 'https://autec.com.br/cem-sprint',
    },
  },

  // =========================================================================
  // 6. SÍNTESE ORGÂNICA E DE PEPTÍDEOS (10 — CEM)
  // =========================================================================
  {
    id: 'prd-cem-discover-2',
    codigo: 'CEM-DISC-20',
    nome_equipamento: 'Discover 2.0 – Sintetizador por Micro-ondas',
    categoria: 'Síntese Orgânica e de Peptídeos',
    aplicacao_laboratorial:
      'Reator de micro-ondas monomodo avançado para química sintética orgânica e inorgânica, com cavidade de 300 mL e controle preciso de temperatura e pressão.',
    normas_atendidas: 'P&D em Síntese Orgânica, Química Medicinal e Catálise',
    diferenciais:
      'Acelera reações orgânicas de horas para minutos com interface touchscreen intuitiva, câmera integrada opcional e compatibilidade com amostrador automático.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Síntese Orgânica e de Peptídeos',
      'Cavidade Única': 'Até 300 mL',
      Interface: 'Touchscreen com sensor IR de temperatura',
      'Página Oficial': 'https://autec.com.br/cem-discover-2-0',
    },
  },
  {
    id: 'prd-cem-mars6-synthesis',
    codigo: 'CEM-MARS6-SYN',
    nome_equipamento: 'MARS 6 Synthesis - Sintetizador por Micro-ondas em Paralelo e em Escala',
    categoria: 'Síntese Orgânica e de Peptídeos',
    aplicacao_laboratorial:
      'Reator por micro-ondas multimodo para síntese orgânica e inorgânica em paralelo ou escalonamento de reações até escala de litro.',
    normas_atendidas: 'Escalonamento sintético, síntese paralela e química de materiais',
    diferenciais:
      'Distribuição uniforme de energia de micro-ondas para reações paralelas com reprodutibilidade e segurança em frascos pressurizados ou abertos.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Síntese Orgânica e de Peptídeos',
      Modo: 'Síntese paralela e escalonamento em batelada',
      'Página Oficial': 'https://autec.com.br/cem-mars6-synthesis',
    },
  },
  {
    id: 'prd-cem-multipep-1',
    codigo: 'CEM-MULTIPEP1',
    nome_equipamento: 'MultiPep 1 – Sistema Automatizado de Síntese Peptídica em Paralelo',
    categoria: 'Síntese Orgânica e de Peptídeos',
    aplicacao_laboratorial:
      'Sintetizador automatizado de peptídeos em paralelo para bibliotecas peptídicas e triagem em P&D biofarmacêutico.',
    normas_atendidas: 'Pesquisa de peptídeos, epitopos, vacinas e química combinatória',
    diferenciais:
      'Sintetiza até 96 peptídeos simultaneamente em placas ou 48 peptídeos em colunas, incluindo síntese SPOT diretamente em membranas de celulose.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Síntese Orgânica e de Peptídeos',
      Capacidade: 'Até 96 peptídeos (placas) ou 48 (colunas) + SPOT',
      'Página Oficial': 'https://autec.com.br/cem-multipep-1',
    },
  },
  {
    id: 'prd-cem-multipep-2',
    codigo: 'CEM-MULTIPEP2',
    nome_equipamento: 'MultiPep 2 – Sistema Automatizado de Síntese Peptídica em Paralelo',
    categoria: 'Síntese Orgânica e de Peptídeos',
    aplicacao_laboratorial:
      'Plataforma de altíssima produtividade para síntese paralela automatizada de centenas de peptídeos em microplacas, colunas ou membranas.',
    normas_atendidas: 'Descoberta de fármacos, imunologia e proteômica',
    diferenciais:
      'Permite síntese simultânea em placas de até 384 poços, colunas ou membranas de celulose (SPOT / CelluSpots) com alta flexibilidade de escala.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Síntese Orgânica e de Peptídeos',
      Capacidade: 'Placas de até 384 poços, colunas e SPOT/CelluSpots',
      'Página Oficial': 'https://autec.com.br/cem-multipep-2',
    },
  },
  {
    id: 'prd-cem-cleavagepro',
    codigo: 'CEM-CLEAVAGEPRO',
    nome_equipamento: 'CleavagePro – Sistema de Clivagem de Peptídeos',
    categoria: 'Síntese Orgânica e de Peptídeos',
    aplicacao_laboratorial:
      'Sistema automatizado para clivagem segura e paralela de até 48 peptídeos sintetizados nos sistemas MultiPep 1 e 2.',
    normas_atendidas: 'Segurança na manipulação de TFA e coquetéis de clivagem',
    diferenciais:
      'Utiliza os mesmos vasos de reação dos sistemas MultiPep e transfere automaticamente o peptídeo clivado para tubos de 15 mL ou 50 mL.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Síntese Orgânica e de Peptídeos',
      Capacidade: 'Até 48 peptídeos em paralelo',
      Compatibilidade: 'Vasos MultiPep 1/2 -> tubos 15 mL ou 50 mL',
      'Página Oficial': 'https://autec.com.br/cem-cleavagepro',
    },
  },
  {
    id: 'prd-cem-liberty-blue-2',
    codigo: 'CEM-LIBERTY-B2',
    nome_equipamento: 'Liberty Blue 2.0 - Sintetizador de Peptídeos por Micro-ondas',
    categoria: 'Síntese Orgânica e de Peptídeos',
    aplicacao_laboratorial:
      'Sintetizador automático de peptídeos por micro-ondas para P&D acadêmico e farmacêutico com altíssima velocidade e pureza bruta.',
    normas_atendidas: 'Química Fmoc-SPPS de alta eficiência',
    diferenciais:
      'Tecnologia CarboMAX™ e ciclos ultrarrápidos com redução drástica do desperdício de solventes e reagentes em relação à síntese convencional.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Síntese Orgânica e de Peptídeos',
      Tecnologia: 'Síntese por micro-ondas CarboMAX™',
      'Página Oficial': 'https://autec.com.br/cem-liberty-blue-2-0',
    },
  },
  {
    id: 'prd-cem-liberty-prime-2',
    codigo: 'CEM-LIBERTY-P2',
    nome_equipamento: 'Liberty PRIME 2.0 - Sintetizador de Peptídeos por Micro-ondas',
    categoria: 'Síntese Orgânica e de Peptídeos',
    aplicacao_laboratorial:
      'Sintetizador de peptídeos de próxima geração com química otimizada one-pot para ciclos extremamente curtos e consumo mínimo de reagentes.',
    normas_atendidas: 'P&D de peptídeos longos e difíceis',
    diferenciais:
      'Minimiza consumo de DMF e tempos de acoplamento e desproteção com alta pureza bruta mesmo em sequências desafiadoras.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Síntese Orgânica e de Peptídeos',
      Técnica: 'SPPS por micro-ondas de altíssima velocidade',
      'Página Oficial': 'https://autec.com.br/cem-liberty-prime-2-0',
    },
  },
  {
    id: 'prd-cem-liberty-pro',
    codigo: 'CEM-LIBERTY-PRO',
    nome_equipamento: 'Liberty PRO - Sintetizador de Peptídeos por Micro-ondas',
    categoria: 'Síntese Orgânica e de Peptídeos',
    aplicacao_laboratorial:
      'Sintetizador automatizado de peptídeos em escala piloto e de produção industrial com capacidade de até 1 kg por lote.',
    normas_atendidas: 'Produção em escala cGMP de peptídeos terapêuticos (IFAs)',
    diferenciais:
      'Entrega lotes de até 1 kg com tempo de ciclo de 15 a 45 minutos por aminoácido, viabilizando escalonamento direto do Liberty Blue.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Síntese Orgânica e de Peptídeos',
      'Escala de Lote': 'Até 1 kg por lote',
      'Ciclo por Aminoácido': '15 a 45 minutos',
      'Página Oficial': 'https://autec.com.br/cem-liberty-pro',
    },
  },
  {
    id: 'prd-cem-razor',
    codigo: 'CEM-RAZOR',
    nome_equipamento: 'Razor - Sistema de Clivagem de Peptídeos',
    categoria: 'Síntese Orgânica e de Peptídeos',
    aplicacao_laboratorial:
      'Sistema dedicado para clivagem rápida e aquecida de até 12 peptídeos simultaneamente em cerca de 30 minutos.',
    normas_atendidas: 'Fluxo completo de síntese de peptídeos Fmoc-SPPS',
    diferenciais:
      'Controle exato de temperatura durante a clivagem ácida com filtração e coleta direta em tubos, reduzindo o tempo de clivagem de horas para 30 minutos.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Síntese Orgânica e de Peptídeos',
      Capacidade: 'Até 12 peptídeos simultaneamente',
      'Tempo Típico': 'Aproximadamente 30 minutos',
      'Página Oficial': 'https://autec.com.br/cem-razor',
    },
  },
  {
    id: 'prd-cem-prodigy-2',
    codigo: 'CEM-PRODIGY-2',
    nome_equipamento: 'Prodigy 2.0 - Sistema de Purificação de Peptídeos',
    categoria: 'Síntese Orgânica e de Peptídeos',
    aplicacao_laboratorial:
      'Sistema HPLC preparativo com aquecimento integrado de coluna e fase móvel, projetado especificamente para purificação de peptídeos de alta pureza.',
    normas_atendidas: 'Purificação de peptídeos em P&D e produção de pequena escala',
    diferenciais:
      'A cromatografia em alta temperatura reduz viscosidade, melhora a resolução de picos próximos e reduz drasticamente o consumo de solventes e o tempo de corrida.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'CEM',
      'Linha Autec': 'Síntese Orgânica e de Peptídeos',
      Técnica: 'HPLC Preparativo aquecido para peptídeos',
      'Página Oficial': 'https://autec.com.br/cem-prodigy-2-0',
    },
  },

  // =========================================================================
  // 7. REATORES DE BATELADA E ACESSÓRIOS (5 — Syrris)
  // =========================================================================
  {
    id: 'prd-syrris-atlas-pump',
    codigo: 'SYR-ATLAS-PUMP',
    nome_equipamento: 'Syrris Atlas Syringe Pump',
    categoria: 'Reatores de Batelada e Acessórios',
    aplicacao_laboratorial:
      'Bomba de seringa dupla precisa e modular para dosagem controlada de reagentes, amostragem e aplicações de fluxo contínuo.',
    normas_atendidas: 'Química de processos, cristalização e controle de dosagem em P&D',
    diferenciais:
      'Fluxo ultraestável e livre de pulsos, alta resistência química (vidro e PTFE) e integração nativa com sistemas de reação Atlas.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Syrris',
      'Linha Autec': 'Reatores de Batelada e Acessórios',
      Configuração: 'Bomba de seringa dupla modular com válvulas rotativas',
      'Página Oficial': 'https://autec.com.br/syrris-atlas-syringe-pump',
    },
  },
  {
    id: 'prd-syrris-atlas-hd',
    codigo: 'SYR-ATLAS-HD',
    nome_equipamento: 'Syrris Atlas HD – Sistema Automatizado de Reatores',
    categoria: 'Reatores de Batelada e Acessórios',
    aplicacao_laboratorial:
      'Sistema inteligente de automação de reatores encamisados de bancada com controle integrado de temperatura, agitação, pH, pressão e dosagem de reagentes.',
    normas_atendidas: 'P&D de Processos Químicos, Cristalização e Escalonamento',
    diferenciais:
      'Interface touchscreen intuitiva no módulo base, troca rápida de vasos sem ferramentas e registro completo de dados de processo sem necessidade de PC.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Syrris',
      'Linha Autec': 'Reatores de Batelada e Acessórios',
      Automação: 'Controle integrado de T, agitação, pH, dosagem e datalogger',
      'Página Oficial': 'https://autec.com.br/syrris-atlad-hd-sistema-automatizado-de-reatores',
    },
  },
  {
    id: 'prd-syrris-orb',
    codigo: 'SYR-ORB',
    nome_equipamento: 'Syrris ORB – Reator Jacketed Modular',
    categoria: 'Reatores de Batelada e Acessórios',
    aplicacao_laboratorial:
      'Sistema de reator encamisado (jacketed) flexível, seguro e altamente versátil para sínteses químicas em batelada de 100 mL a 10 L.',
    normas_atendidas: 'Laboratórios de química sintética e desenvolvimento de processos',
    diferenciais:
      'Suporte universal com troca rápida de vasos por uma única pessoa, braço de elevação leve e ampla compatibilidade com sensores e termorreguladores.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Syrris',
      'Linha Autec': 'Reatores de Batelada e Acessórios',
      Capacidade: 'Vasos encamisados intercambiáveis (bancada)',
      'Página Oficial': 'https://autec.com.br/syrris-orb-reator-jacketed-modular',
    },
  },
  {
    id: 'prd-syrris-orb-pilot',
    codigo: 'SYR-ORB-PILOT',
    nome_equipamento: 'Syrris ORB Pilot – Reator Jacketed para Escalonamento',
    categoria: 'Reatores de Batelada e Acessórios',
    aplicacao_laboratorial:
      'Sistema modular de reatores encamisados em escala piloto (10 L a 50 L) para estudos de escalonamento e produção em planta piloto.',
    normas_atendidas: 'Escalonamento químico-farmacêutico e química fina',
    diferenciais:
      'Estrutura compacta sobre rodízios com ajuste rápido de altura de vaso, vedação segura e possibilidade de automação via módulos externos.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Syrris',
      'Linha Autec': 'Reatores de Batelada e Acessórios',
      Aplicação: 'Escalonamento e planta piloto (volumes de grande escala)',
      'Página Oficial': 'https://autec.com.br/syrris-orb-pilor-reator-jacketed-parap-escalonamento',
    },
  },
  {
    id: 'prd-syrris-asia',
    codigo: 'SYR-ASIA',
    nome_equipamento: 'Syrris Asia – Plataforma de Química em Fluxo Contínuo',
    categoria: 'Reatores de Batelada e Acessórios',
    aplicacao_laboratorial:
      'Plataforma modular completa para química em fluxo contínuo (flow chemistry), incluindo microreatores, bombas sem pulsos, aquecimento/resfriamento e pressurização.',
    normas_atendidas: 'Síntese contínua em P&D farmacêutico, químico e catalítico',
    diferenciais:
      'Permite reações em condições extremas de temperatura e pressão com segurança intrínseca, melhor transferência térmica e escalonamento contínuo.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'Syrris',
      'Linha Autec': 'Reatores de Batelada e Acessórios',
      Tecnologia: 'Flow Chemistry modular de alta pressão e temperatura',
      'Página Oficial': 'https://autec.com.br/syrris-asia-plataforma-de-quimica-em-fluxo-continuo',
    },
  },

  // =========================================================================
  // 8. VICI DBS (7 — VICI DBS)
  // =========================================================================
  {
    id: 'prd-vici-pg-plus',
    codigo: 'VICI-PG-PLUS',
    nome_equipamento: 'PG Plus Series',
    categoria: 'VICI DBS',
    aplicacao_laboratorial:
      'Geradores de hidrogênio de alta pureza (até 99,9999%) por eletrólise PEM de água deionizada para detectores GC-FID, FPD, NPD e gás de arraste.',
    normas_atendidas: 'Alternativa segura aos cilindros de H₂ em laboratório (GC / GC-MS)',
    diferenciais:
      'Produção sob demanda com baixo volume interno armazenado, eliminando riscos logísticos e de segurança de cilindros de alta pressão.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'VICI DBS',
      'Linha Autec': 'VICI DBS',
      Gás: 'Hidrogênio (H₂) por membrana PEM',
      Aplicação: 'GC-FID, FPD, NPD e gás de arraste',
      'Página Oficial': 'https://autec.com.br/pg-plus-series',
    },
  },
  {
    id: 'prd-vici-nm-plus',
    codigo: 'VICI-NM-PLUS',
    nome_equipamento: 'NM Plus Series',
    categoria: 'VICI DBS',
    aplicacao_laboratorial:
      'Geradores de hidrogênio de ultra alta pureza equipados com exclusivo sistema de secagem e purificação sem necessidade de manutenção (No Maintenance).',
    normas_atendidas: 'GC-MS e gás de arraste cromatográfico exigindo baixíssima umidade',
    diferenciais:
      'Eleva o desempenho da linha PG Plus com módulo de purificação livre de troca de dessecantes, reduzindo paradas e custos de manutenção.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'VICI DBS',
      'Linha Autec': 'VICI DBS',
      Gás: 'Hidrogênio Ultra Puro (sem manutenção de dessecante)',
      'Página Oficial': 'https://autec.com.br/nm-plus-series',
    },
  },
  {
    id: 'prd-vici-fid-station',
    codigo: 'VICI-FID-STATION',
    nome_equipamento: 'Estação de Gás FID',
    categoria: 'VICI DBS',
    aplicacao_laboratorial:
      'Módulo compacto 2 em 1 que integra gerador de hidrogênio e gerador de ar sintético grau zero para alimentar detectores por ionização em chama (GC-FID).',
    normas_atendidas: 'Alimentação completa e autônoma para cromatógrafos GC-FID',
    diferenciais:
      'Economiza espaço em bancada combinando H₂ e Ar Zero livre de hidrocarbonetos em um único chassi confiável e silencioso.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'VICI DBS',
      'Linha Autec': 'VICI DBS',
      Gases: 'Hidrogênio + Ar Zero em módulo único',
      'Página Oficial': 'https://autec.com.br/estacao-de-gas-fid',
    },
  },
  {
    id: 'prd-vici-h2-rack-plus',
    codigo: 'VICI-H2-RACK',
    nome_equipamento: 'Hydrogen 19" Rack Plus',
    categoria: 'VICI DBS',
    aplicacao_laboratorial:
      'Geradores de hidrogênio de alta pureza em formato de montagem padrão industrial rack 19 polegadas para análise de processos, petroquímica e emissões.',
    normas_atendidas: 'Monitoramento contínuo de processos e analisadores em rack 19"',
    diferenciais:
      'Mesma tecnologia PEM confiável dos geradores laboratoriais adaptada para integração em gabinetes industriais 19".',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'VICI DBS',
      'Linha Autec': 'VICI DBS',
      Formato: 'Montagem padrão industrial Rack 19"',
      'Página Oficial': 'https://autec.com.br/hydrogen-19-rack-plus',
    },
  },
  {
    id: 'prd-vici-geradores-n2',
    codigo: 'VICI-GEN-N2',
    nome_equipamento: 'Geradores de Nitrogênio',
    categoria: 'VICI DBS',
    aplicacao_laboratorial:
      'Geradores de nitrogênio que convertem ar comprimido padrão em suprimento contínuo de N₂ de grau de pureza Ultra High para cromatografia e preparo de amostras.',
    normas_atendidas: 'Suprimento contínuo para GC, evaporadores (TurboVap) e ICP',
    diferenciais:
      'Tecnologia PSA / membrana para fornecimento regular e seguro de nitrogênio sem troca de cilindros ou dewars.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'VICI DBS',
      'Linha Autec': 'VICI DBS',
      Gás: 'Nitrogênio (N₂) grau Ultra High',
      'Página Oficial': 'https://autec.com.br/geradores-de-nitrogenio',
    },
  },
  {
    id: 'prd-vici-mistral-whisper',
    codigo: 'VICI-MISTRAL-WHISP',
    nome_equipamento: 'Mistral Evolution Series e Whisper Series',
    categoria: 'VICI DBS',
    aplicacao_laboratorial:
      'Geradores de nitrogênio projetados especificamente para atender às exigências de fluxo, pressão e pureza de todos os fabricantes de LC-MS/MS do mercado.',
    normas_atendidas: 'Compatibilidade LC/MS (Sciex, Agilent, Waters, Thermo, Shimadzu, Bruker)',
    diferenciais:
      'Versão Whisper com operação ultrassilenciosa e compressor integrado livre de óleo; série Mistral para alto desempenho contínuo 24/7.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'VICI DBS',
      'Linha Autec': 'VICI DBS',
      Aplicação: 'Espectrômetros de Massas LC/MS e LC-MS/MS',
      'Página Oficial': 'https://autec.com.br/mistral-evolution-series-e-whisper-series',
    },
  },
  {
    id: 'prd-vici-zero-air',
    codigo: 'VICI-ZERO-AIR',
    nome_equipamento: 'Gerador de Ar GC e GT Ultra Zero',
    categoria: 'VICI DBS',
    aplicacao_laboratorial:
      'Geradores catalíticos de ar grau zero livre de hidrocarbonetos (< 0,05 ppm) para detectores GC-FID, FPD, NPD e analisadores de emissões.',
    normas_atendidas: 'Qualidade de linha de base estável em análises GC-FID de traços',
    diferenciais:
      'Remove hidrocarbonetos e CO/CH₄ por oxidação catalítica, garantindo linha de base limpa e maior sensibilidade nos cromatogramas.',
    faixa_preco: null,
    especificacoes: {
      Fabricante: 'VICI DBS',
      'Linha Autec': 'VICI DBS',
      Gás: 'Ar Grau Ultra Zero (< 0,05 ppm hidrocarbonetos)',
      'Página Oficial': 'https://autec.com.br/gerador-de-ar-gc-e-gt-ultra-zero',
    },
  },
];
