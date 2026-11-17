import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { AUTEC_OFFICIAL_PRODUCTS, LEGACY_PLACEHOLDER_PRODUCT_IDS } from './catalogData.ts';
import { DEFAULT_LANDING_CONTENT } from './landingDefaults.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.AUTEC_DB_PATH || path.join(DATA_DIR, 'autec_sales_pulse.db');
export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'gestor', 'vendedor')),
      equipe TEXT NOT NULL DEFAULT 'Comercial Geral',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      nome_equipamento TEXT NOT NULL,
      categoria TEXT NOT NULL,
      aplicacao_laboratorial TEXT NOT NULL DEFAULT '',
      normas_atendidas TEXT NOT NULL DEFAULT '',
      diferenciais TEXT NOT NULL DEFAULT '',
      faixa_preco REAL,
      especificacoes_json TEXT NOT NULL DEFAULT '{}',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_profiles (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      segmento TEXT NOT NULL DEFAULT '',
      dor_principal TEXT NOT NULL DEFAULT '',
      criterios_decisao TEXT NOT NULL DEFAULT '',
      equipamentos_recomendados TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS objections (
      id TEXT PRIMARY KEY,
      tipo_resistencia TEXT NOT NULL,
      objecao_comum TEXT NOT NULL,
      argumento_tecnico TEXT NOT NULL,
      analogia_venda TEXT NOT NULL DEFAULT '',
      pergunta_retorno TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      razao_social TEXT NOT NULL,
      cnpj TEXT NOT NULL DEFAULT '',
      segmento TEXT NOT NULL DEFAULT '',
      cidade TEXT NOT NULL DEFAULT '',
      uf TEXT NOT NULL DEFAULT '',
      contato_nome TEXT NOT NULL DEFAULT '',
      contato_email TEXT NOT NULL DEFAULT '',
      contato_telefone TEXT NOT NULL DEFAULT '',
      vendedor_responsavel_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      cliente_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      cliente_nome TEXT NOT NULL,
      vendedor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      vendedor_nome TEXT NOT NULL,
      produto_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      produto_nome TEXT NOT NULL DEFAULT '',
      valor REAL,
      status TEXT NOT NULL CHECK (status IN ('aberta', 'proposta_enviada', 'em_negociacao', 'ganha', 'perdida', 'cancelada')),
      data_abertura TEXT NOT NULL,
      data_encerramento TEXT,
      observacoes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      cliente_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      cliente_nome TEXT NOT NULL,
      vendedor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      vendedor_nome TEXT NOT NULL,
      produto_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      produto_nome TEXT NOT NULL DEFAULT '',
      lab_profile_id TEXT REFERENCES lab_profiles(id) ON DELETE SET NULL,
      tipo_resistencia TEXT NOT NULL DEFAULT '',
      concorrente_citado TEXT NOT NULL DEFAULT '',
      argumento_gerado TEXT NOT NULL DEFAULT '',
      avancou_funil INTEGER,
      motivo_estagnacao TEXT NOT NULL DEFAULT '',
      data_interacao TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      escopo TEXT NOT NULL CHECK (escopo IN ('global', 'equipe', 'individual')),
      tipo TEXT NOT NULL CHECK (tipo IN ('faturamento', 'vendas', 'propostas')),
      vendedor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      vendedor_nome TEXT NOT NULL DEFAULT '',
      equipe TEXT NOT NULL DEFAULT '',
      periodo_mes INTEGER NOT NULL,
      periodo_ano INTEGER NOT NULL,
      valor_meta REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS competitors (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      cnpj TEXT NOT NULL DEFAULT '',
      site TEXT NOT NULL DEFAULT '',
      categoria_atuacao TEXT NOT NULL DEFAULT '',
      produtos_concorrentes TEXT NOT NULL DEFAULT '',
      descricao TEXT NOT NULL DEFAULT '',
      observacoes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS competitive_occurrences (
      id TEXT PRIMARY KEY,
      data_ocorrencia TEXT NOT NULL,
      cliente_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      cliente_nome TEXT NOT NULL,
      vendedor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      vendedor_nome TEXT NOT NULL,
      produto_autec_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      produto_autec_nome TEXT NOT NULL,
      concorrente_id TEXT NOT NULL REFERENCES competitors(id) ON DELETE RESTRICT,
      concorrente_nome TEXT NOT NULL,
      produto_concorrente TEXT NOT NULL DEFAULT '',
      valor_proposta_autec REAL,
      valor_concorrente REAL,
      prazo_entrega_concorrente INTEGER,
      condicao_pagamento_mencionada TEXT,
      diferencial_concorrente TEXT NOT NULL DEFAULT '',
      motivo_preferencia TEXT NOT NULL DEFAULT '',
      resultado_negociacao TEXT NOT NULL CHECK (resultado_negociacao IN ('ganha', 'perdida', 'em_andamento', 'cancelada')),
      observacoes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loss_reasons (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      padrao INTEGER NOT NULL DEFAULT 0,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lost_opportunities (
      id TEXT PRIMARY KEY,
      identificador TEXT NOT NULL UNIQUE,
      oportunidade_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL,
      cliente_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      cliente_nome TEXT NOT NULL,
      vendedor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      vendedor_nome TEXT NOT NULL,
      produto_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      produto_nome TEXT NOT NULL DEFAULT '',
      data_abertura TEXT NOT NULL,
      data_encerramento TEXT NOT NULL,
      valor_estimado REAL,
      concorrente_vencedor_id TEXT REFERENCES competitors(id) ON DELETE SET NULL,
      concorrente_vencedor_nome TEXT NOT NULL DEFAULT '',
      motivo_principal_id TEXT NOT NULL REFERENCES loss_reasons(id) ON DELETE RESTRICT,
      motivo_principal_nome TEXT NOT NULL,
      motivo_secundario_id TEXT REFERENCES loss_reasons(id) ON DELETE SET NULL,
      motivo_secundario_nome TEXT NOT NULL DEFAULT '',
      descricao_detalhada TEXT NOT NULL DEFAULT '',
      recuperavel TEXT NOT NULL CHECK (recuperavel IN ('sim', 'nao', 'avaliar')),
      data_prevista_abordagem TEXT,
      status_perda TEXT NOT NULL DEFAULT 'confirmada' CHECK (status_perda IN ('confirmada', 'em_recuperacao', 'recuperada', 'nao_recuperada')),
      valor_recuperado REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recovery_attempts (
      id TEXT PRIMARY KEY,
      lost_opportunity_id TEXT NOT NULL REFERENCES lost_opportunities(id) ON DELETE CASCADE,
      motivo_tentativa TEXT NOT NULL,
      vendedor_responsavel_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      vendedor_responsavel_nome TEXT NOT NULL,
      data_retorno TEXT NOT NULL,
      contato_realizado TEXT NOT NULL DEFAULT '',
      situacao TEXT NOT NULL CHECK (situacao IN ('em_negociacao', 'recuperada', 'nao_recuperada')),
      valor_recuperado REAL,
      observacoes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS action_plans (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      problema_identificado TEXT NOT NULL,
      origem_tipo TEXT NOT NULL CHECK (origem_tipo IN ('concorrente', 'oportunidade_perdida', 'objecao', 'desempenho', 'produto', 'manual')),
      origem_id TEXT,
      origem_label TEXT NOT NULL DEFAULT '',
      descricao TEXT NOT NULL DEFAULT '',
      categoria TEXT NOT NULL CHECK (categoria IN ('Concorrência', 'Preço', 'Produto', 'Logística', 'Atendimento', 'Treinamento', 'Recuperação de clientes', 'Conversão comercial', 'Processo interno', 'Outros')),
      responsavel_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      responsavel_nome TEXT NOT NULL,
      criado_por_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      criado_por_nome TEXT NOT NULL,
      data_criacao TEXT NOT NULL,
      prazo_conclusao TEXT NOT NULL,
      prioridade TEXT NOT NULL CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Crítica')),
      resultado_esperado TEXT NOT NULL DEFAULT '',
      indicador_relacionado TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('Não iniciada', 'Em andamento', 'Aguardando', 'Concluída', 'Cancelada')),
      evidencia_conclusao TEXT NOT NULL DEFAULT '',
      data_conclusao TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT')),
      summary TEXT NOT NULL,
      changes_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS landing_content (
      id TEXT PRIMARY KEY,
      content_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  seedReferenceCatalogs();
}

function seedReferenceCatalogs(): void {
  const now = new Date().toISOString();

  // 1. Seed initial users if empty (max 20 users supported)
  const userCountRow = db.prepare('SELECT COUNT(*) as total FROM users').get() as { total: number };
  if (userCountRow.total === 0) {
    const defaultPass = hashPassword('Autec@2026');
    const insertUser = db.prepare(
      'INSERT INTO users (id, full_name, email, password_hash, role, equipe, ativo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    insertUser.run('usr-admin', 'Diretoria Comercial Autec', 'admin@autec.com.br', defaultPass, 'admin', 'Diretoria', 1, now);
    insertUser.run('usr-gestor', 'Fernanda Oliveira', 'gestor@autec.com.br', defaultPass, 'gestor', 'Gestão Comercial', 1, now);
    insertUser.run('usr-vend-1', 'Carlos Eduardo Silva', 'carlos.silva@autec.com.br', defaultPass, 'vendedor', 'Equipe Sudeste', 1, now);
    insertUser.run('usr-vend-2', 'Mariana Costa Ribeiro', 'mariana.costa@autec.com.br', defaultPass, 'vendedor', 'Equipe Sul & Centro', 1, now);
  }

  // 2. Sync official 66-product Autec catalog (idempotent upsert + safe retirement of starter placeholders)
  syncAutecOfficialCatalog(now);

  // 3. Seed Lab Profiles if empty
  const labCountRow = db.prepare('SELECT COUNT(*) as total FROM lab_profiles').get() as { total: number };
  if (labCountRow.total === 0) {
    const insertLab = db.prepare(
      'INSERT INTO lab_profiles (id, nome, segmento, dor_principal, criterios_decisao, equipamentos_recomendados, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insertLab.run(
      'lab-farma',
      'Indústria Farmacêutica & Cosméticos',
      'Controle de Qualidade e P&D',
      'Exigência rigorosa de auditorias ANVISA, USP/Ph. Eur., 21 CFR Part 11, pureza cromatográfica e síntese/purificação reprodutível',
      'Conformidade farmacopeica, automação auditável, suporte técnico especializado e precisão analítica',
      'CAMAG HPTLC Pro, CAMAG TLC Visualizer 3, Biotage® Selekt Systems, Phoenix BLACK Sulfated Ash',
      now
    );
    insertLab.run(
      'lab-saneamento',
      'Meio Ambiente, Toxicologia e Análise de Resíduos',
      'Laboratórios Ambientais e Agroindustriais',
      'Alto volume diário de extrações e digestões ácidas para ICP-MS/LC-MS e necessidade de evaporação rápida sem perda de analitos',
      'Produtividade em lote, redução de solventes, conformidade EPA e robustez operacional',
      'MARS 6, BLADE, TurboVap® LV, Biotage® Extrahera™, VICI DBS Mistral Evolution',
      now
    );
    insertLab.run(
      'lab-alimentos',
      'Indústria de Alimentos, Laticínios e Bebidas',
      'Garantia da Qualidade (MAPA / ANVISA)',
      'Necessidade de liberação rápida de lotes (gordura, proteína, umidade e estabilidade) eliminando métodos demorados e solventes tóxicos',
      'Velocidade de análise em linha/bancada, certificação MAPA/AOAC e baixo custo por ensaio',
      'ORACLE (RMN), SMART 6, Sprint, LUMiSizer, MARS 6 Extraction',
      now
    );
    insertLab.run(
      'lab-pesquisa',
      'Universidades, Institutos de Pesquisa e Química Fina',
      'Ensino, Síntese Orgânica e Escalonamento',
      'Integração entre síntese em fluxo/micro-ondas, purificação preparativa e escalonamento seguro para planta piloto',
      'Modularidade, versatilidade sintética, eficiência energética e aderência técnica a editais',
      'Discover 2.0, Liberty Blue 2.0, Syrris Atlas HD, Syrris Asia, puriFlash® 5.250',
      now
    );
  }

  // 4. Seed Objections Playbook if empty
  const objCountRow = db.prepare('SELECT COUNT(*) as total FROM objections').get() as { total: number };
  if (objCountRow.total === 0) {
    const insertObj = db.prepare(
      'INSERT INTO objections (id, tipo_resistencia, objecao_comum, argumento_tecnico, analogia_venda, pergunta_retorno, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insertObj.run(
      'obj-preco',
      'Preço',
      'O equipamento da Autec está acima do orçamento ou mais caro que o concorrente.',
      'Equipamentos Autec utilizam aço inox 304/316L de espessura industrial, controladores PID de alta estabilidade e já contemplam documentação técnica e garantia de 24 meses, reduzindo paradas e custos de recalibração.',
      'Um equipamento de laboratório sem estabilidade térmica gera retrabalho de ensaios e perda de lotes que custam muito mais que a diferença inicial de aquisição.',
      'Qual seria o impacto financeiro para o seu laboratório se uma análise ou auditoria fosse reprovada por variação térmica?',
      now
    );
    insertObj.run(
      'obj-prazo',
      'Prazo de Entrega',
      'Precisamos do equipamento com urgência e o concorrente prometeu entrega mais rápida.',
      'A Autec mantém componentes críticos em estoque nacional com montagem dedicada, garantindo cumprimento rigoroso do cronograma acordado e entrega técnica com prontuário completo.',
      'Um prazo otimista sem prontuário NR-13 ou calibração pode travar o comissionamento do equipamento na chegada.',
      'O concorrente já inclui a documentação de qualificação/NR-13 dentro desse prazo informado?',
      now
    );
    insertObj.run(
      'obj-tecnica',
      'Especificação Técnica',
      'Temos dúvida se o equipamento atende às normas da auditoria ANVISA / ISO 17025.',
      'Nossa linha é projetada com foco em uniformidade térmica documentada, sensores calibráveis e opção de pacote de qualificação IQ/OQ além de certificados rastreáveis RBC.',
      'Trabalhar com equipamentos prontos para auditoria elimina semanas de adaptação documental da equipe da qualidade.',
      'Quais pontos específicos do protocolo de qualificação são mais cobrados nas auditorias do seu laboratório?',
      now
    );
    insertObj.run(
      'obj-suporte',
      'Suporte e Manutenção',
      'Temos receio de demora na assistência técnica e reposição de peças.',
      'Fabricação e engenharia 100% nacionais com estoque imediato de resistências, sensores, gaxetas e placas controladoras, além de suporte direto com especialistas.',
      'Equipamentos importados sem peça local podem ficar meses parados aguardando desembaraço aduaneiro.',
      'Quantos dias o laboratório suportaria ficar com essa linha parada em caso de manutenção corretiva?',
      now
    );
  }

  // 5. Seed the 13 standardized Loss Reasons (Section 3.1)
  const reasonCountRow = db.prepare('SELECT COUNT(*) as total FROM loss_reasons').get() as { total: number };
  if (reasonCountRow.total === 0) {
    const standardReasons = [
      ['lr-01', 'Preço elevado'],
      ['lr-02', 'Concorrente com preço inferior'],
      ['lr-03', 'Prazo de entrega'],
      ['lr-04', 'Condições de pagamento'],
      ['lr-05', 'Falta de disponibilidade'],
      ['lr-06', 'Especificação técnica'],
      ['lr-07', 'Produto não atende à necessidade'],
      ['lr-08', 'Relacionamento com concorrente'],
      ['lr-09', 'Cliente adiou a compra'],
      ['lr-10', 'Projeto cancelado'],
      ['lr-11', 'Falta de orçamento'],
      ['lr-12', 'Sem retorno do cliente'],
      ['lr-13', 'Outro'],
    ];
    const insertReason = db.prepare(
      'INSERT INTO loss_reasons (id, nome, padrao, ativo, created_by, created_at) VALUES (?, ?, 1, 1, ?, ?)'
    );
    for (const [id, nome] of standardReasons) {
      insertReason.run(id, nome, 'Sistema', now);
    }
  }

  // 6. Seed Landing Page CMS content and hashed admin access password
  const landingRow = db.prepare('SELECT id FROM landing_content WHERE id = ?').get('main');
  if (!landingRow) {
    db.prepare('INSERT INTO landing_content (id, content_json, updated_at) VALUES (?, ?, ?)').run(
      'main',
      JSON.stringify(DEFAULT_LANDING_CONTENT),
      now
    );
  }

  const adminPassRow = db.prepare('SELECT key FROM app_settings WHERE key = ?').get('landing_admin_password_hash');
  if (!adminPassRow) {
    db.prepare('INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)').run(
      'landing_admin_password_hash',
      hashPassword('1966'),
      now
    );
  }
}

function syncAutecOfficialCatalog(now: string): void {
  const upsertProd = db.prepare(`
    INSERT INTO products (
      id, codigo, nome_equipamento, categoria, aplicacao_laboratorial,
      normas_atendidas, diferenciais, faixa_preco, especificacoes_json, ativo, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(id) DO UPDATE SET
      codigo = excluded.codigo,
      nome_equipamento = excluded.nome_equipamento,
      categoria = excluded.categoria,
      aplicacao_laboratorial = excluded.aplicacao_laboratorial,
      normas_atendidas = excluded.normas_atendidas,
      diferenciais = excluded.diferenciais,
      faixa_preco = excluded.faixa_preco,
      especificacoes_json = excluded.especificacoes_json,
      ativo = 1
  `);

  for (const item of AUTEC_OFFICIAL_PRODUCTS) {
    upsertProd.run(
      item.id,
      item.codigo,
      item.nome_equipamento,
      item.categoria,
      item.aplicacao_laboratorial,
      item.normas_atendidas,
      item.diferenciais,
      item.faixa_preco,
      JSON.stringify(item.especificacoes),
      now
    );
  }

  for (const legacyId of LEGACY_PLACEHOLDER_PRODUCT_IDS) {
    const exists = db.prepare('SELECT id FROM products WHERE id = ?').get(legacyId);
    if (!exists) continue;
    const isReferenced =
      db.prepare('SELECT 1 FROM opportunities WHERE produto_id = ? LIMIT 1').get(legacyId) ||
      db.prepare('SELECT 1 FROM interactions WHERE produto_id = ? LIMIT 1').get(legacyId) ||
      db.prepare('SELECT 1 FROM competitive_occurrences WHERE produto_autec_id = ? LIMIT 1').get(legacyId) ||
      db.prepare('SELECT 1 FROM lost_opportunities WHERE produto_id = ? LIMIT 1').get(legacyId);

    if (isReferenced) {
      db.prepare('UPDATE products SET ativo = 0 WHERE id = ?').run(legacyId);
    } else {
      db.prepare('DELETE FROM products WHERE id = ?').run(legacyId);
    }
  }
}

