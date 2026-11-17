import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Express, Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db, hashPassword, verifyPassword } from './db.ts';
import { DEFAULT_LANDING_CONTENT, type LandingContent } from './landingDefaults.ts';

const MAX_USERS = 20;
const SESSION_SECRET = process.env.SESSION_SECRET || 'autec-sales-pulse-stc-mobile-2026-secret-key';

interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'gestor' | 'vendedor';
  equipe: string;
  ativo: boolean;
}

interface AuthedRequest extends Request {
  authUser?: AuthUser;
}

function createToken(userId: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { uid: string; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid: string;
      exp: number;
    };
    if (!decoded.uid || !decoded.exp || Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

function recordAudit(
  user: AuthUser,
  entityType: string,
  entityId: string,
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT',
  summary: string,
  changes: unknown = {}
): void {
  const id = `aud-${crypto.randomUUID().slice(0, 12)}`;
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO audit_logs (id, user_id, user_name, user_role, entity_type, entity_id, operation, summary, changes_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, user.id, user.full_name, user.role, entityType, entityId, operation, summary, JSON.stringify(changes), now);
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Autenticação necessária. Faça login para continuar.' });
    return;
  }
  const verified = verifyToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    return;
  }
  const row = db
    .prepare('SELECT id, full_name, email, role, equipe, ativo FROM users WHERE id = ?')
    .get(verified.uid) as
    | {
        id: string;
        full_name: string;
        email: string;
        role: 'admin' | 'gestor' | 'vendedor';
        equipe: string;
        ativo: number;
      }
    | undefined;

  if (!row || !row.ativo) {
    res.status(401).json({ error: 'Usuário inativo ou não encontrado.' });
    return;
  }

  req.authUser = {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    equipe: row.equipe,
    ativo: Boolean(row.ativo),
  };
  next();
}

function requireRoles(roles: Array<'admin' | 'gestor' | 'vendedor'>) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({
        error: 'Acesso negado: seu perfil de usuário não possui permissão para esta operação.',
      });
      return;
    }
    next();
  };
}

function toNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isNaN(num) ? null : num;
}

function toNullableString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

export function registerApiRoutes(app: Express): void {
  // ---------------- AUTH ----------------
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Informe e-mail e senha.' });
      return;
    }
    const row = db
      .prepare('SELECT id, full_name, email, password_hash, role, equipe, ativo, created_at FROM users WHERE lower(email) = lower(?)')
      .get(email.trim()) as
      | {
          id: string;
          full_name: string;
          email: string;
          password_hash: string;
          role: 'admin' | 'gestor' | 'vendedor';
          equipe: string;
          ativo: number;
          created_at: string;
        }
      | undefined;

    if (!row || !verifyPassword(password, row.password_hash)) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }
    if (!row.ativo) {
      res.status(403).json({ error: 'Este usuário está desativado. Contate o administrador.' });
      return;
    }

    const user: AuthUser = {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      role: row.role,
      equipe: row.equipe,
      ativo: true,
    };
    const token = createToken(row.id);
    recordAudit(user, 'User', row.id, 'LOGIN', `Login realizado por ${row.full_name}`);
    res.json({ token, user: { ...user, created_at: row.created_at } });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
    res.json({ user: req.authUser });
  });

  // ---------------- USERS & DIRECTORY ----------------
  app.get('/api/users/directory', requireAuth, (_req: AuthedRequest, res: Response) => {
    const rows = db
      .prepare('SELECT id, full_name, email, role, equipe, ativo, created_at FROM users ORDER BY full_name ASC')
      .all() as Array<{
      id: string;
      full_name: string;
      email: string;
      role: string;
      equipe: string;
      ativo: number;
      created_at: string;
    }>;
    res.json(rows.map((r) => ({ ...r, ativo: Boolean(r.ativo) })));
  });

  app.get('/api/users', requireAuth, requireRoles(['admin']), (_req: AuthedRequest, res: Response) => {
    const rows = db
      .prepare('SELECT id, full_name, email, role, equipe, ativo, created_at FROM users ORDER BY created_at ASC')
      .all() as Array<{
      id: string;
      full_name: string;
      email: string;
      role: string;
      equipe: string;
      ativo: number;
      created_at: string;
    }>;
    res.json(rows.map((r) => ({ ...r, ativo: Boolean(r.ativo) })));
  });

  app.post('/api/users', requireAuth, requireRoles(['admin']), (req: AuthedRequest, res: Response) => {
    const countRow = db.prepare('SELECT COUNT(*) as total FROM users').get() as { total: number };
    if (countRow.total >= MAX_USERS) {
      res.status(400).json({ error: `Limite máximo de ${MAX_USERS} usuários atingido para esta instância.` });
      return;
    }
    const { full_name, email, password, role, equipe } = req.body as {
      full_name?: string;
      email?: string;
      password?: string;
      role?: string;
      equipe?: string;
    };
    if (!full_name?.trim() || !email?.trim() || !password || !role) {
      res.status(400).json({ error: 'Preencha nome completo, e-mail, senha e perfil de acesso.' });
      return;
    }
    if (!['admin', 'gestor', 'vendedor'].includes(role)) {
      res.status(400).json({ error: 'Perfil inválido. Utilize admin, gestor ou vendedor.' });
      return;
    }
    const exists = db.prepare('SELECT id FROM users WHERE lower(email) = lower(?)').get(email.trim());
    if (exists) {
      res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
      return;
    }
    const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO users (id, full_name, email, password_hash, role, equipe, ativo, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)'
    ).run(id, full_name.trim(), email.trim().toLowerCase(), hashPassword(password), role, (equipe || 'Comercial Geral').trim(), now);

    recordAudit(req.authUser!, 'User', id, 'CREATE', `Usuário ${full_name.trim()} (${role}) cadastrado`, {
      email: email.trim().toLowerCase(),
      role,
    });
    res.status(201).json({
      id,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      role,
      equipe: (equipe || 'Comercial Geral').trim(),
      ativo: true,
      created_at: now,
    });
  });

  app.put('/api/users/:id', requireAuth, requireRoles(['admin']), (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    const { full_name, role, equipe, ativo, password } = req.body as {
      full_name?: string;
      role?: string;
      equipe?: string;
      ativo?: boolean;
      password?: string;
    };
    const nextRole = role && ['admin', 'gestor', 'vendedor'].includes(role) ? role : String(existing.role);
    const nextAtivo = ativo === undefined ? Number(existing.ativo) : ativo ? 1 : 0;
    if (id === req.authUser!.id && nextAtivo === 0) {
      res.status(400).json({ error: 'Você não pode desativar o próprio usuário administrador logado.' });
      return;
    }

    db.prepare('UPDATE users SET full_name = ?, role = ?, equipe = ?, ativo = ? WHERE id = ?').run(
      full_name?.trim() || String(existing.full_name),
      nextRole,
      equipe !== undefined ? equipe.trim() : String(existing.equipe),
      nextAtivo,
      id
    );
    if (password && password.length >= 6) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), id);
    }
    recordAudit(req.authUser!, 'User', id, 'UPDATE', `Usuário ${full_name || existing.full_name} atualizado`, {
      role: nextRole,
      ativo: Boolean(nextAtivo),
    });
    const updated = db
      .prepare('SELECT id, full_name, email, role, equipe, ativo, created_at FROM users WHERE id = ?')
      .get(id) as Record<string, unknown>;
    res.json({ ...updated, ativo: Boolean(updated.ativo) });
  });

  // ---------------- PRODUCTS ----------------
  app.get('/api/products', requireAuth, (_req: AuthedRequest, res: Response) => {
    const rows = db
      .prepare('SELECT * FROM products WHERE ativo = 1 ORDER BY categoria ASC, nome_equipamento ASC')
      .all() as Array<Record<string, unknown>>;
    res.json(
      rows.map((r) => ({
        ...r,
        ativo: Boolean(r.ativo),
        especificacoes: (() => {
          try {
            return JSON.parse(String(r.especificacoes_json || '{}'));
          } catch {
            return {};
          }
        })(),
      }))
    );
  });

  app.post('/api/products', requireAuth, requireRoles(['admin', 'gestor']), (req: AuthedRequest, res: Response) => {
    const {
      codigo,
      nome_equipamento,
      categoria,
      aplicacao_laboratorial,
      normas_atendidas,
      diferenciais,
      faixa_preco,
      especificacoes,
    } = req.body as Record<string, unknown>;
    if (!String(codigo || '').trim() || !String(nome_equipamento || '').trim()) {
      res.status(400).json({ error: 'Código e nome do equipamento são obrigatórios.' });
      return;
    }
    const dup = db.prepare('SELECT id FROM products WHERE lower(codigo) = lower(?)').get(String(codigo).trim());
    if (dup) {
      res.status(409).json({ error: 'Já existe um equipamento cadastrado com este código.' });
      return;
    }
    const id = `prd-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO products (id, codigo, nome_equipamento, categoria, aplicacao_laboratorial, normas_atendidas, diferenciais, faixa_preco, especificacoes_json, ativo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)'
    ).run(
      id,
      String(codigo).trim().toUpperCase(),
      String(nome_equipamento).trim(),
      String(categoria || 'Equipamentos Gerais').trim(),
      String(aplicacao_laboratorial || '').trim(),
      String(normas_atendidas || '').trim(),
      String(diferenciais || '').trim(),
      toNullableNumber(faixa_preco),
      JSON.stringify(especificacoes || {}),
      now
    );
    recordAudit(req.authUser!, 'Product', id, 'CREATE', `Equipamento ${nome_equipamento} cadastrado`);
    res.status(201).json({
      id,
      codigo: String(codigo).trim().toUpperCase(),
      nome_equipamento: String(nome_equipamento).trim(),
      categoria: String(categoria || 'Equipamentos Gerais').trim(),
      aplicacao_laboratorial: String(aplicacao_laboratorial || '').trim(),
      normas_atendidas: String(normas_atendidas || '').trim(),
      diferenciais: String(diferenciais || '').trim(),
      faixa_preco: toNullableNumber(faixa_preco),
      especificacoes: especificacoes || {},
      ativo: true,
      created_at: now,
    });
  });

  app.put('/api/products/:id', requireAuth, requireRoles(['admin', 'gestor']), (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Equipamento não encontrado.' });
      return;
    }
    const b = req.body as Record<string, unknown>;
    db.prepare(
      'UPDATE products SET nome_equipamento = ?, categoria = ?, aplicacao_laboratorial = ?, normas_atendidas = ?, diferenciais = ?, faixa_preco = ?, ativo = ? WHERE id = ?'
    ).run(
      String(b.nome_equipamento ?? existing.nome_equipamento).trim(),
      String(b.categoria ?? existing.categoria).trim(),
      String(b.aplicacao_laboratorial ?? existing.aplicacao_laboratorial).trim(),
      String(b.normas_atendidas ?? existing.normas_atendidas).trim(),
      String(b.diferenciais ?? existing.diferenciais).trim(),
      b.faixa_preco !== undefined ? toNullableNumber(b.faixa_preco) : toNullableNumber(existing.faixa_preco),
      b.ativo === undefined ? Number(existing.ativo) : b.ativo ? 1 : 0,
      id
    );
    recordAudit(req.authUser!, 'Product', id, 'UPDATE', `Equipamento ${b.nome_equipamento ?? existing.nome_equipamento} atualizado`);
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ ...row, ativo: Boolean(row.ativo), especificacoes: JSON.parse(String(row.especificacoes_json || '{}')) });
  });

  // ---------------- LAB PROFILES & OBJECTIONS ----------------
  app.get('/api/lab-profiles', requireAuth, (_req: AuthedRequest, res: Response) => {
    res.json(db.prepare('SELECT * FROM lab_profiles ORDER BY nome ASC').all());
  });

  app.post('/api/lab-profiles', requireAuth, requireRoles(['admin', 'gestor']), (req: AuthedRequest, res: Response) => {
    const { nome, segmento, dor_principal, criterios_decisao, equipamentos_recomendados } = req.body as Record<string, string>;
    if (!nome?.trim()) {
      res.status(400).json({ error: 'Nome do perfil laboratorial é obrigatório.' });
      return;
    }
    const id = `lab-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO lab_profiles (id, nome, segmento, dor_principal, criterios_decisao, equipamentos_recomendados, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, nome.trim(), segmento || '', dor_principal || '', criterios_decisao || '', equipamentos_recomendados || '', now);
    recordAudit(req.authUser!, 'LabProfile', id, 'CREATE', `Perfil laboratorial ${nome.trim()} criado`);
    res.status(201).json(db.prepare('SELECT * FROM lab_profiles WHERE id = ?').get(id));
  });

  app.get('/api/objections', requireAuth, (_req: AuthedRequest, res: Response) => {
    res.json(db.prepare('SELECT * FROM objections ORDER BY tipo_resistencia ASC').all());
  });

  app.post('/api/objections', requireAuth, requireRoles(['admin', 'gestor']), (req: AuthedRequest, res: Response) => {
    const { tipo_resistencia, objecao_comum, argumento_tecnico, analogia_venda, pergunta_retorno } =
      req.body as Record<string, string>;
    if (!tipo_resistencia?.trim() || !objecao_comum?.trim() || !argumento_tecnico?.trim()) {
      res.status(400).json({ error: 'Tipo de resistência, objeção e argumento técnico são obrigatórios.' });
      return;
    }
    const id = `obj-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO objections (id, tipo_resistencia, objecao_comum, argumento_tecnico, analogia_venda, pergunta_retorno, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, tipo_resistencia.trim(), objecao_comum.trim(), argumento_tecnico.trim(), analogia_venda || '', pergunta_retorno || '', now);
    recordAudit(req.authUser!, 'Objection', id, 'CREATE', `Objeção "${tipo_resistencia.trim()}" cadastrada`);
    res.status(201).json(db.prepare('SELECT * FROM objections WHERE id = ?').get(id));
  });

  // ---------------- CLIENTS ----------------
  app.get('/api/clients', requireAuth, (req: AuthedRequest, res: Response) => {
    const rows = db
      .prepare(
        `SELECT c.*, u.full_name as vendedor_responsavel_nome
         FROM clients c
         LEFT JOIN users u ON c.vendedor_responsavel_id = u.id
         ORDER BY c.razao_social ASC`
      )
      .all() as Array<Record<string, unknown>>;
    if (req.authUser!.role === 'vendedor') {
      // Sellers see clients assigned to them or shared unassigned clients
      res.json(rows.filter((r) => !r.vendedor_responsavel_id || r.vendedor_responsavel_id === req.authUser!.id));
      return;
    }
    res.json(rows);
  });

  app.post('/api/clients', requireAuth, (req: AuthedRequest, res: Response) => {
    const b = req.body as Record<string, unknown>;
    const razao = String(b.razao_social || '').trim();
    if (!razao) {
      res.status(400).json({ error: 'Razão social / nome do cliente é obrigatório.' });
      return;
    }
    const dup = db.prepare('SELECT id FROM clients WHERE lower(razao_social) = lower(?)').get(razao);
    if (dup) {
      res.status(409).json({ error: 'Já existe um cliente cadastrado com esta razão social.' });
      return;
    }
    const id = `cli-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const vendedorResp =
      req.authUser!.role === 'vendedor' ? req.authUser!.id : toNullableString(b.vendedor_responsavel_id);
    db.prepare(
      'INSERT INTO clients (id, razao_social, cnpj, segmento, cidade, uf, contato_nome, contato_email, contato_telefone, vendedor_responsavel_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      razao,
      String(b.cnpj || '').trim(),
      String(b.segmento || '').trim(),
      String(b.cidade || '').trim(),
      String(b.uf || '').trim().toUpperCase(),
      String(b.contato_nome || '').trim(),
      String(b.contato_email || '').trim(),
      String(b.contato_telefone || '').trim(),
      vendedorResp,
      now
    );
    recordAudit(req.authUser!, 'Client', id, 'CREATE', `Cliente ${razao} cadastrado`);
    res.status(201).json(
      db
        .prepare(
          'SELECT c.*, u.full_name as vendedor_responsavel_nome FROM clients c LEFT JOIN users u ON c.vendedor_responsavel_id = u.id WHERE c.id = ?'
        )
        .get(id)
    );
  });

  // ---------------- OPPORTUNITIES (EXISTING + ENRICHED) ----------------
  app.get('/api/opportunities', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    let sql = 'SELECT * FROM opportunities';
    const params: string[] = [];
    if (user.role === 'vendedor') {
      sql += ' WHERE vendedor_id = ?';
      params.push(user.id);
    }
    sql += ' ORDER BY data_abertura DESC, created_at DESC';
    res.json(db.prepare(sql).all(...params));
  });

  app.post('/api/opportunities', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const b = req.body as Record<string, unknown>;
    const vendedorId = user.role === 'vendedor' ? user.id : String(b.vendedor_id || user.id);
    const seller = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(vendedorId) as
      | { id: string; full_name: string }
      | undefined;
    if (!seller) {
      res.status(400).json({ error: 'Vendedor responsável inválido.' });
      return;
    }

    let clienteId = toNullableString(b.cliente_id);
    let clienteNome = String(b.cliente_nome || '').trim();
    if (clienteId) {
      const cli = db.prepare('SELECT id, razao_social FROM clients WHERE id = ?').get(clienteId) as
        | { id: string; razao_social: string }
        | undefined;
      if (cli) clienteNome = cli.razao_social;
    }
    if (!clienteNome) {
      res.status(400).json({ error: 'Informe o cliente da oportunidade.' });
      return;
    }

    let produtoId = toNullableString(b.produto_id);
    let produtoNome = String(b.produto_nome || '').trim();
    if (produtoId) {
      const prd = db.prepare('SELECT id, nome_equipamento FROM products WHERE id = ?').get(produtoId) as
        | { id: string; nome_equipamento: string }
        | undefined;
      if (prd) produtoNome = prd.nome_equipamento;
    }

    const status = String(b.status || 'aberta');
    if (!['aberta', 'proposta_enviada', 'em_negociacao', 'ganha', 'perdida', 'cancelada'].includes(status)) {
      res.status(400).json({ error: 'Situação da oportunidade inválida.' });
      return;
    }
    const dataAbertura = String(b.data_abertura || new Date().toISOString().slice(0, 10));
    const dataEncerramento =
      ['ganha', 'perdida', 'cancelada'].includes(status)
        ? String(b.data_encerramento || new Date().toISOString().slice(0, 10))
        : toNullableString(b.data_encerramento);

    const countRow = db.prepare('SELECT COUNT(*) as total FROM opportunities').get() as { total: number };
    const codigo =
      String(b.codigo || '').trim() ||
      `OPP-${new Date().getFullYear()}-${String(countRow.total + 1).padStart(4, '0')}`;
    const dup = db.prepare('SELECT id FROM opportunities WHERE lower(codigo) = lower(?)').get(codigo);
    if (dup) {
      res.status(409).json({ error: `Código de oportunidade ${codigo} já existe.` });
      return;
    }

    const id = `opp-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO opportunities (id, codigo, cliente_id, cliente_nome, vendedor_id, vendedor_nome, produto_id, produto_nome, valor, status, data_abertura, data_encerramento, observacoes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      codigo,
      clienteId,
      clienteNome,
      seller.id,
      seller.full_name,
      produtoId,
      produtoNome,
      toNullableNumber(b.valor),
      status,
      dataAbertura,
      dataEncerramento,
      String(b.observacoes || '').trim(),
      now,
      now
    );
    recordAudit(user, 'Opportunity', id, 'CREATE', `Oportunidade ${codigo} (${clienteNome}) criada`);
    res.status(201).json(db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id));
  });

  app.put('/api/opportunities/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Oportunidade não encontrada.' });
      return;
    }
    if (user.role === 'vendedor' && existing.vendedor_id !== user.id) {
      res.status(403).json({ error: 'Você só pode atualizar suas próprias oportunidades.' });
      return;
    }
    const b = req.body as Record<string, unknown>;
    const status = String(b.status ?? existing.status);
    if (!['aberta', 'proposta_enviada', 'em_negociacao', 'ganha', 'perdida', 'cancelada'].includes(status)) {
      res.status(400).json({ error: 'Situação inválida.' });
      return;
    }
    const dataEncerramento = ['ganha', 'perdida', 'cancelada'].includes(status)
      ? String(b.data_encerramento || existing.data_encerramento || new Date().toISOString().slice(0, 10))
      : null;

    let produtoId = b.produto_id !== undefined ? toNullableString(b.produto_id) : (existing.produto_id as string | null);
    let produtoNome = String(b.produto_nome ?? existing.produto_nome ?? '');
    if (produtoId) {
      const prd = db.prepare('SELECT nome_equipamento FROM products WHERE id = ?').get(produtoId) as
        | { nome_equipamento: string }
        | undefined;
      if (prd) produtoNome = prd.nome_equipamento;
    }

    const now = new Date().toISOString();
    db.prepare(
      'UPDATE opportunities SET cliente_nome = ?, produto_id = ?, produto_nome = ?, valor = ?, status = ?, data_abertura = ?, data_encerramento = ?, observacoes = ?, updated_at = ? WHERE id = ?'
    ).run(
      String(b.cliente_nome ?? existing.cliente_nome).trim(),
      produtoId,
      produtoNome,
      b.valor !== undefined ? toNullableNumber(b.valor) : toNullableNumber(existing.valor),
      status,
      String(b.data_abertura ?? existing.data_abertura),
      dataEncerramento,
      String(b.observacoes ?? existing.observacoes ?? '').trim(),
      now,
      id
    );
    recordAudit(user, 'Opportunity', id, 'UPDATE', `Oportunidade ${existing.codigo} atualizada para ${status}`, {
      fromStatus: existing.status,
      toStatus: status,
    });
    res.json(db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id));
  });

  app.delete('/api/opportunities/:id', requireAuth, requireRoles(['admin', 'gestor']), (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT codigo FROM opportunities WHERE id = ?').get(id) as { codigo: string } | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Oportunidade não encontrada.' });
      return;
    }
    db.prepare('DELETE FROM opportunities WHERE id = ?').run(id);
    recordAudit(req.authUser!, 'Opportunity', id, 'DELETE', `Oportunidade ${existing.codigo} removida`);
    res.json({ ok: true });
  });

  // ---------------- INTERACTIONS ----------------
  app.get('/api/interactions', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    if (user.role === 'vendedor') {
      res.json(db.prepare('SELECT * FROM interactions WHERE vendedor_id = ? ORDER BY data_interacao DESC, created_at DESC').all(user.id));
      return;
    }
    res.json(db.prepare('SELECT * FROM interactions ORDER BY data_interacao DESC, created_at DESC').all());
  });

  app.post('/api/interactions', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const b = req.body as Record<string, unknown>;
    const vendedorId = user.role === 'vendedor' ? user.id : String(b.vendedor_id || user.id);
    const seller = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(vendedorId) as
      | { id: string; full_name: string }
      | undefined;
    if (!seller) {
      res.status(400).json({ error: 'Vendedor inválido.' });
      return;
    }
    const id = `int-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const avancou =
      b.avancou_funil === true ? 1 : b.avancou_funil === false ? 0 : null;
    db.prepare(
      'INSERT INTO interactions (id, cliente_id, cliente_nome, vendedor_id, vendedor_nome, produto_id, produto_nome, lab_profile_id, tipo_resistencia, concorrente_citado, argumento_gerado, avancou_funil, motivo_estagnacao, data_interacao, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      toNullableString(b.cliente_id),
      String(b.cliente_nome || 'Cliente não informado').trim(),
      seller.id,
      seller.full_name,
      toNullableString(b.produto_id),
      String(b.produto_nome || '').trim(),
      toNullableString(b.lab_profile_id),
      String(b.tipo_resistencia || '').trim(),
      String(b.concorrente_citado || '').trim(),
      String(b.argumento_gerado || '').trim(),
      avancou,
      String(b.motivo_estagnacao || '').trim(),
      String(b.data_interacao || now.slice(0, 10)),
      now
    );
    recordAudit(user, 'Interaction', id, 'CREATE', `Interação comercial registrada para ${b.cliente_nome || 'cliente'}`);
    const row = db.prepare('SELECT * FROM interactions WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json({
      ...row,
      avancou_funil: row.avancou_funil === null ? null : Boolean(row.avancou_funil),
    });
  });

  app.patch('/api/interactions/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM interactions WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Interação não encontrada.' });
      return;
    }
    if (user.role === 'vendedor' && existing.vendedor_id !== user.id) {
      res.status(403).json({ error: 'Permissão negada para alterar interação de outro vendedor.' });
      return;
    }
    const b = req.body as { avancou_funil?: boolean | null; motivo_estagnacao?: string };
    const avancou = b.avancou_funil === true ? 1 : b.avancou_funil === false ? 0 : null;
    db.prepare('UPDATE interactions SET avancou_funil = ?, motivo_estagnacao = ? WHERE id = ?').run(
      avancou,
      String(b.motivo_estagnacao || '').trim(),
      id
    );
    recordAudit(user, 'Interaction', id, 'UPDATE', `Status de avanço no funil atualizado`);
    const row = db.prepare('SELECT * FROM interactions WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({
      ...row,
      avancou_funil: row.avancou_funil === null ? null : Boolean(row.avancou_funil),
    });
  });

  // ---------------- GOALS ----------------
  app.get('/api/goals', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    if (user.role === 'vendedor') {
      res.json(
        db
          .prepare("SELECT * FROM goals WHERE escopo = 'global' OR vendedor_id = ? ORDER BY periodo_ano DESC, periodo_mes DESC")
          .all(user.id)
      );
      return;
    }
    res.json(db.prepare('SELECT * FROM goals ORDER BY periodo_ano DESC, periodo_mes DESC').all());
  });

  app.post('/api/goals', requireAuth, requireRoles(['admin', 'gestor']), (req: AuthedRequest, res: Response) => {
    const b = req.body as Record<string, unknown>;
    const escopo = String(b.escopo || 'individual');
    const tipo = String(b.tipo || 'faturamento');
    const mes = Number(b.periodo_mes);
    const ano = Number(b.periodo_ano);
    const valorMeta = Number(b.valor_meta);
    if (!mes || !ano || Number.isNaN(valorMeta) || valorMeta <= 0) {
      res.status(400).json({ error: 'Informe mês, ano e valor positivo para a meta.' });
      return;
    }
    const vendedorId = escopo === 'individual' ? toNullableString(b.vendedor_id) : null;
    let vendedorNome = '';
    if (vendedorId) {
      const u = db.prepare('SELECT full_name FROM users WHERE id = ?').get(vendedorId) as { full_name: string } | undefined;
      if (u) vendedorNome = u.full_name;
    }
    const id = `gol-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO goals (id, escopo, tipo, vendedor_id, vendedor_nome, equipe, periodo_mes, periodo_ano, valor_meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, escopo, tipo, vendedorId, vendedorNome, String(b.equipe || '').trim(), mes, ano, valorMeta, now);
    recordAudit(req.authUser!, 'Goal', id, 'CREATE', `Meta ${tipo} (${escopo}) definida para ${mes}/${ano}`);
    res.status(201).json(db.prepare('SELECT * FROM goals WHERE id = ?').get(id));
  });

  app.delete('/api/goals/:id', requireAuth, requireRoles(['admin', 'gestor']), (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    db.prepare('DELETE FROM goals WHERE id = ?').run(id);
    recordAudit(req.authUser!, 'Goal', id, 'DELETE', 'Meta removida');
    res.json({ ok: true });
  });

  // ---------------- MODULE 1: RADAR DE CONCORRENTES ----------------
  app.get('/api/competitors', requireAuth, (_req: AuthedRequest, res: Response) => {
    res.json(db.prepare('SELECT * FROM competitors ORDER BY nome ASC').all());
  });

  app.post('/api/competitors', requireAuth, (req: AuthedRequest, res: Response) => {
    const b = req.body as Record<string, unknown>;
    const nome = String(b.nome || '').trim();
    if (!nome) {
      res.status(400).json({ error: 'Nome da empresa concorrente é obrigatório.' });
      return;
    }
    const dup = db.prepare('SELECT id FROM competitors WHERE lower(nome) = lower(?)').get(nome);
    if (dup) {
      res.status(409).json({ error: 'Este concorrente já está cadastrado no sistema.' });
      return;
    }
    const id = `cmp-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const status = b.status === 'inativo' ? 'inativo' : 'ativo';
    db.prepare(
      'INSERT INTO competitors (id, nome, cnpj, site, categoria_atuacao, produtos_concorrentes, descricao, observacoes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      nome,
      String(b.cnpj || '').trim(),
      String(b.site || '').trim(),
      String(b.categoria_atuacao || '').trim(),
      String(b.produtos_concorrentes || '').trim(),
      String(b.descricao || '').trim(),
      String(b.observacoes || '').trim(),
      status,
      now,
      now
    );
    recordAudit(req.authUser!, 'Competitor', id, 'CREATE', `Concorrente ${nome} cadastrado`);
    res.status(201).json(db.prepare('SELECT * FROM competitors WHERE id = ?').get(id));
  });

  app.put('/api/competitors/:id', requireAuth, requireRoles(['admin', 'gestor']), (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM competitors WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Concorrente não encontrado.' });
      return;
    }
    const b = req.body as Record<string, unknown>;
    const nome = String(b.nome ?? existing.nome).trim();
    const status = b.status === 'inativo' ? 'inativo' : 'ativo';
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE competitors SET nome = ?, cnpj = ?, site = ?, categoria_atuacao = ?, produtos_concorrentes = ?, descricao = ?, observacoes = ?, status = ?, updated_at = ? WHERE id = ?'
    ).run(
      nome,
      String(b.cnpj ?? existing.cnpj ?? '').trim(),
      String(b.site ?? existing.site ?? '').trim(),
      String(b.categoria_atuacao ?? existing.categoria_atuacao ?? '').trim(),
      String(b.produtos_concorrentes ?? existing.produtos_concorrentes ?? '').trim(),
      String(b.descricao ?? existing.descricao ?? '').trim(),
      String(b.observacoes ?? existing.observacoes ?? '').trim(),
      status,
      now,
      id
    );
    recordAudit(req.authUser!, 'Competitor', id, 'UPDATE', `Concorrente ${nome} atualizado`);
    res.json(db.prepare('SELECT * FROM competitors WHERE id = ?').get(id));
  });

  app.get('/api/competitive-occurrences', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    if (user.role === 'vendedor') {
      res.json(
        db
          .prepare('SELECT * FROM competitive_occurrences WHERE vendedor_id = ? ORDER BY data_ocorrencia DESC, created_at DESC')
          .all(user.id)
      );
      return;
    }
    res.json(db.prepare('SELECT * FROM competitive_occurrences ORDER BY data_ocorrencia DESC, created_at DESC').all());
  });

  app.post('/api/competitive-occurrences', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const b = req.body as Record<string, unknown>;
    const vendedorId = user.role === 'vendedor' ? user.id : String(b.vendedor_id || user.id);
    const seller = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(vendedorId) as
      | { id: string; full_name: string }
      | undefined;
    if (!seller) {
      res.status(400).json({ error: 'Vendedor responsável inválido.' });
      return;
    }

    const concorrenteId = String(b.concorrente_id || '').trim();
    const competitor = db.prepare('SELECT id, nome FROM competitors WHERE id = ?').get(concorrenteId) as
      | { id: string; nome: string }
      | undefined;
    if (!competitor) {
      res.status(400).json({ error: 'Selecione um concorrente válido cadastrado.' });
      return;
    }

    const clienteId = toNullableString(b.cliente_id);
    let clienteNome = String(b.cliente_nome || '').trim();
    if (clienteId) {
      const cli = db.prepare('SELECT razao_social FROM clients WHERE id = ?').get(clienteId) as
        | { razao_social: string }
        | undefined;
      if (cli) clienteNome = cli.razao_social;
    }
    if (!clienteNome) {
      res.status(400).json({ error: 'Informe o cliente envolvido na ocorrência competitiva.' });
      return;
    }

    const produtoId = toNullableString(b.produto_autec_id);
    let produtoNome = String(b.produto_autec_nome || '').trim();
    if (produtoId) {
      const prd = db.prepare('SELECT nome_equipamento FROM products WHERE id = ?').get(produtoId) as
        | { nome_equipamento: string }
        | undefined;
      if (prd) produtoNome = prd.nome_equipamento;
    }
    if (!produtoNome) {
      res.status(400).json({ error: 'Informe o produto Autec envolvido na negociação.' });
      return;
    }

    const resultado = String(b.resultado_negociacao || 'em_andamento');
    if (!['ganha', 'perdida', 'em_andamento', 'cancelada'].includes(resultado)) {
      res.status(400).json({ error: 'Resultado da negociação inválido.' });
      return;
    }

    const id = `occ-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    // Preserve null vs explicit 0!
    const valAutec = toNullableNumber(b.valor_proposta_autec);
    const valConc = toNullableNumber(b.valor_concorrente);
    const prazoConc = toNullableNumber(b.prazo_entrega_concorrente);

    db.prepare(
      `INSERT INTO competitive_occurrences (
        id, data_ocorrencia, cliente_id, cliente_nome, vendedor_id, vendedor_nome,
        produto_autec_id, produto_autec_nome, concorrente_id, concorrente_nome,
        produto_concorrente, valor_proposta_autec, valor_concorrente,
        prazo_entrega_concorrente, condicao_pagamento_mencionada,
        diferencial_concorrente, motivo_preferencia, resultado_negociacao,
        observacoes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      String(b.data_ocorrencia || now.slice(0, 10)),
      clienteId,
      clienteNome,
      seller.id,
      seller.full_name,
      produtoId,
      produtoNome,
      competitor.id,
      competitor.nome,
      String(b.produto_concorrente || '').trim(),
      valAutec,
      valConc,
      prazoConc === null ? null : Math.round(prazoConc),
      toNullableString(b.condicao_pagamento_mencionada),
      String(b.diferencial_concorrente || '').trim(),
      String(b.motivo_preferencia || '').trim(),
      resultado,
      String(b.observacoes || '').trim(),
      now,
      now
    );
    recordAudit(user, 'CompetitiveOccurrence', id, 'CREATE', `Ocorrência competitiva vs ${competitor.nome} registrada`);
    res.status(201).json(db.prepare('SELECT * FROM competitive_occurrences WHERE id = ?').get(id));
  });

  app.put('/api/competitive-occurrences/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM competitive_occurrences WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Ocorrência competitiva não encontrada.' });
      return;
    }
    if (user.role === 'vendedor' && existing.vendedor_id !== user.id) {
      res.status(403).json({ error: 'Você só pode editar ocorrências competitivas registradas por você.' });
      return;
    }
    const b = req.body as Record<string, unknown>;
    const resultado = String(b.resultado_negociacao ?? existing.resultado_negociacao);
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE competitive_occurrences SET
        produto_concorrente = ?, valor_proposta_autec = ?, valor_concorrente = ?,
        prazo_entrega_concorrente = ?, condicao_pagamento_mencionada = ?,
        diferencial_concorrente = ?, motivo_preferencia = ?, resultado_negociacao = ?,
        observacoes = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      String(b.produto_concorrente ?? existing.produto_concorrente ?? '').trim(),
      b.valor_proposta_autec !== undefined ? toNullableNumber(b.valor_proposta_autec) : toNullableNumber(existing.valor_proposta_autec),
      b.valor_concorrente !== undefined ? toNullableNumber(b.valor_concorrente) : toNullableNumber(existing.valor_concorrente),
      b.prazo_entrega_concorrente !== undefined
        ? toNullableNumber(b.prazo_entrega_concorrente)
        : toNullableNumber(existing.prazo_entrega_concorrente),
      b.condicao_pagamento_mencionada !== undefined
        ? toNullableString(b.condicao_pagamento_mencionada)
        : toNullableString(existing.condicao_pagamento_mencionada),
      String(b.diferencial_concorrente ?? existing.diferencial_concorrente ?? '').trim(),
      String(b.motivo_preferencia ?? existing.motivo_preferencia ?? '').trim(),
      resultado,
      String(b.observacoes ?? existing.observacoes ?? '').trim(),
      now,
      id
    );
    recordAudit(user, 'CompetitiveOccurrence', id, 'UPDATE', `Ocorrência competitiva atualizada (${resultado})`);
    res.json(db.prepare('SELECT * FROM competitive_occurrences WHERE id = ?').get(id));
  });

  // ---------------- MODULE 2: PERDAS COMERCIAIS & RECUPERAÇÃO ----------------
  app.get('/api/loss-reasons', requireAuth, (_req: AuthedRequest, res: Response) => {
    const rows = db.prepare('SELECT * FROM loss_reasons WHERE ativo = 1 ORDER BY padrao DESC, nome ASC').all() as Array<
      Record<string, unknown>
    >;
    res.json(rows.map((r) => ({ ...r, padrao: Boolean(r.padrao), ativo: Boolean(r.ativo) })));
  });

  app.post('/api/loss-reasons', requireAuth, requireRoles(['admin']), (req: AuthedRequest, res: Response) => {
    const { nome } = req.body as { nome?: string };
    if (!nome?.trim()) {
      res.status(400).json({ error: 'Informe o nome do novo motivo de perda.' });
      return;
    }
    const dup = db.prepare('SELECT id FROM loss_reasons WHERE lower(nome) = lower(?)').get(nome.trim());
    if (dup) {
      res.status(409).json({ error: 'Já existe um motivo de perda com este nome.' });
      return;
    }
    const id = `lr-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    db.prepare('INSERT INTO loss_reasons (id, nome, padrao, ativo, created_by, created_at) VALUES (?, ?, 0, 1, ?, ?)').run(
      id,
      nome.trim(),
      req.authUser!.full_name,
      now
    );
    recordAudit(req.authUser!, 'LossReason', id, 'CREATE', `Novo motivo administrativo de perda criado: ${nome.trim()}`);
    const created = db.prepare('SELECT * FROM loss_reasons WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json({ ...created, padrao: Boolean(created.padrao), ativo: Boolean(created.ativo) });
  });

  app.get('/api/lost-opportunities', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    if (user.role === 'vendedor') {
      res.json(
        db
          .prepare('SELECT * FROM lost_opportunities WHERE vendedor_id = ? ORDER BY data_encerramento DESC, created_at DESC')
          .all(user.id)
      );
      return;
    }
    res.json(db.prepare('SELECT * FROM lost_opportunities ORDER BY data_encerramento DESC, created_at DESC').all());
  });

  app.post('/api/lost-opportunities', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const b = req.body as Record<string, unknown>;
    const vendedorId = user.role === 'vendedor' ? user.id : String(b.vendedor_id || user.id);
    const seller = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(vendedorId) as
      | { id: string; full_name: string }
      | undefined;
    if (!seller) {
      res.status(400).json({ error: 'Vendedor responsável inválido.' });
      return;
    }

    const motivoPrincipalId = String(b.motivo_principal_id || '').trim();
    const motivoPrincipal = db.prepare('SELECT id, nome FROM loss_reasons WHERE id = ?').get(motivoPrincipalId) as
      | { id: string; nome: string }
      | undefined;
    if (!motivoPrincipal) {
      res.status(400).json({ error: 'Selecione um motivo principal de perda válido.' });
      return;
    }

    const motivoSecundarioId = toNullableString(b.motivo_secundario_id);
    let motivoSecundarioNome = '';
    if (motivoSecundarioId) {
      const m2 = db.prepare('SELECT nome FROM loss_reasons WHERE id = ?').get(motivoSecundarioId) as
        | { nome: string }
        | undefined;
      if (m2) motivoSecundarioNome = m2.nome;
    }

    const oportunidadeId = toNullableString(b.oportunidade_id);
    if (oportunidadeId) {
      const alreadyLost = db
        .prepare('SELECT id FROM lost_opportunities WHERE oportunidade_id = ?')
        .get(oportunidadeId);
      if (alreadyLost) {
        res.status(409).json({ error: 'Esta oportunidade já possui um registro de perda comercial associado.' });
        return;
      }
    }

    const clienteId = toNullableString(b.cliente_id);
    let clienteNome = String(b.cliente_nome || '').trim();
    if (clienteId) {
      const cli = db.prepare('SELECT razao_social FROM clients WHERE id = ?').get(clienteId) as
        | { razao_social: string }
        | undefined;
      if (cli) clienteNome = cli.razao_social;
    }
    if (!clienteNome) {
      res.status(400).json({ error: 'Informe o cliente da oportunidade perdida.' });
      return;
    }

    const produtoId = toNullableString(b.produto_id);
    let produtoNome = String(b.produto_nome || '').trim();
    if (produtoId) {
      const prd = db.prepare('SELECT nome_equipamento FROM products WHERE id = ?').get(produtoId) as
        | { nome_equipamento: string }
        | undefined;
      if (prd) produtoNome = prd.nome_equipamento;
    }

    const concorrenteVencedorId = toNullableString(b.concorrente_vencedor_id);
    let concorrenteVencedorNome = '';
    if (concorrenteVencedorId) {
      const cmp = db.prepare('SELECT nome FROM competitors WHERE id = ?').get(concorrenteVencedorId) as
        | { nome: string }
        | undefined;
      if (cmp) concorrenteVencedorNome = cmp.nome;
    }

    const countRow = db.prepare('SELECT COUNT(*) as total FROM lost_opportunities').get() as { total: number };
    const identificador =
      String(b.identificador || '').trim() ||
      `PER-${new Date().getFullYear()}-${String(countRow.total + 1).padStart(4, '0')}`;
    const dupId = db.prepare('SELECT id FROM lost_opportunities WHERE lower(identificador) = lower(?)').get(identificador);
    if (dupId) {
      res.status(409).json({ error: `Identificador ${identificador} já cadastrado.` });
      return;
    }

    const recuperavel = ['sim', 'nao', 'avaliar'].includes(String(b.recuperavel))
      ? String(b.recuperavel)
      : 'avaliar';
    const now = new Date().toISOString();
    const dataAbertura = String(b.data_abertura || now.slice(0, 10));
    const dataEncerramento = String(b.data_encerramento || now.slice(0, 10));
    const id = `loss-${crypto.randomUUID().slice(0, 8)}`;

    db.prepare(
      `INSERT INTO lost_opportunities (
        id, identificador, oportunidade_id, cliente_id, cliente_nome,
        vendedor_id, vendedor_nome, produto_id, produto_nome,
        data_abertura, data_encerramento, valor_estimado,
        concorrente_vencedor_id, concorrente_vencedor_nome,
        motivo_principal_id, motivo_principal_nome,
        motivo_secundario_id, motivo_secundario_nome,
        descricao_detalhada, recuperavel, data_prevista_abordagem,
        status_perda, valor_recuperado, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmada', NULL, ?, ?)`
    ).run(
      id,
      identificador,
      oportunidadeId,
      clienteId,
      clienteNome,
      seller.id,
      seller.full_name,
      produtoId,
      produtoNome,
      dataAbertura,
      dataEncerramento,
      toNullableNumber(b.valor_estimado),
      concorrenteVencedorId,
      concorrenteVencedorNome,
      motivoPrincipal.id,
      motivoPrincipal.nome,
      motivoSecundarioId,
      motivoSecundarioNome,
      String(b.descricao_detalhada || '').trim(),
      recuperavel,
      toNullableString(b.data_prevista_abordagem),
      now,
      now
    );

    // Keep linked opportunity status consistent as 'perdida'
    if (oportunidadeId) {
      db.prepare("UPDATE opportunities SET status = 'perdida', data_encerramento = ?, updated_at = ? WHERE id = ?").run(
        dataEncerramento,
        now,
        oportunidadeId
      );
    }

    recordAudit(user, 'LostOpportunity', id, 'CREATE', `Perda comercial ${identificador} registrada (${motivoPrincipal.nome})`);
    res.status(201).json(db.prepare('SELECT * FROM lost_opportunities WHERE id = ?').get(id));
  });

  app.get('/api/recovery-attempts', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    if (user.role === 'vendedor') {
      res.json(
        db
          .prepare(
            `SELECT ra.* FROM recovery_attempts ra
             JOIN lost_opportunities lo ON ra.lost_opportunity_id = lo.id
             WHERE lo.vendedor_id = ? OR ra.vendedor_responsavel_id = ?
             ORDER BY ra.data_retorno DESC, ra.created_at DESC`
          )
          .all(user.id, user.id)
      );
      return;
    }
    res.json(db.prepare('SELECT * FROM recovery_attempts ORDER BY data_retorno DESC, created_at DESC').all());
  });

  app.post('/api/lost-opportunities/:id/recovery-attempts', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const { id } = req.params;
    const lost = db.prepare('SELECT * FROM lost_opportunities WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!lost) {
      res.status(404).json({ error: 'Registro de oportunidade perdida não encontrado.' });
      return;
    }
    if (user.role === 'vendedor' && lost.vendedor_id !== user.id) {
      res.status(403).json({ error: 'Você só pode registrar tentativas de recuperação das suas oportunidades.' });
      return;
    }
    const b = req.body as Record<string, unknown>;
    const situacao = String(b.situacao || 'em_negociacao');
    if (!['em_negociacao', 'recuperada', 'nao_recuperada'].includes(situacao)) {
      res.status(400).json({ error: 'Situação da recuperação inválida.' });
      return;
    }
    const respId = user.role === 'vendedor' ? user.id : String(b.vendedor_responsavel_id || lost.vendedor_id);
    const respUser = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(respId) as
      | { id: string; full_name: string }
      | undefined;
    if (!respUser) {
      res.status(400).json({ error: 'Vendedor responsável inválido.' });
      return;
    }

    const valorRec = toNullableNumber(b.valor_recuperado);
    const now = new Date().toISOString();
    const attemptId = `rec-${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(
      `INSERT INTO recovery_attempts (
        id, lost_opportunity_id, motivo_tentativa, vendedor_responsavel_id,
        vendedor_responsavel_nome, data_retorno, contato_realizado,
        situacao, valor_recuperado, observacoes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      attemptId,
      id,
      String(b.motivo_tentativa || '').trim() || 'Nova abordagem comercial',
      respUser.id,
      respUser.full_name,
      String(b.data_retorno || now.slice(0, 10)),
      String(b.contato_realizado || '').trim(),
      situacao,
      valorRec,
      String(b.observacoes || '').trim(),
      now
    );

    const nextLossStatus =
      situacao === 'em_negociacao'
        ? 'em_recuperacao'
        : situacao === 'recuperada'
          ? 'recuperada'
          : 'nao_recuperada';
    db.prepare('UPDATE lost_opportunities SET status_perda = ?, valor_recuperado = ?, updated_at = ? WHERE id = ?').run(
      nextLossStatus,
      situacao === 'recuperada' ? valorRec ?? toNullableNumber(lost.valor_estimado) : toNullableNumber(lost.valor_recuperado),
      now,
      id
    );

    recordAudit(user, 'RecoveryAttempt', attemptId, 'CREATE', `Tentativa de recuperação (${situacao}) em ${lost.identificador}`);
    res.status(201).json({
      attempt: db.prepare('SELECT * FROM recovery_attempts WHERE id = ?').get(attemptId),
      lostOpportunity: db.prepare('SELECT * FROM lost_opportunities WHERE id = ?').get(id),
    });
  });

  // ---------------- MODULE 4: PLANO DE AÇÃO ----------------
  app.get('/api/action-plans', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    if (user.role === 'vendedor') {
      res.json(
        db
          .prepare('SELECT * FROM action_plans WHERE responsavel_id = ? OR criado_por_id = ? ORDER BY prazo_conclusao ASC, created_at DESC')
          .all(user.id, user.id)
      );
      return;
    }
    res.json(db.prepare('SELECT * FROM action_plans ORDER BY prazo_conclusao ASC, created_at DESC').all());
  });

  app.post('/api/action-plans', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const b = req.body as Record<string, unknown>;
    if (!String(b.titulo || '').trim() || !String(b.problema_identificado || '').trim() || !String(b.prazo_conclusao || '').trim()) {
      res.status(400).json({ error: 'Título, problema identificado e prazo de conclusão são obrigatórios.' });
      return;
    }
    const responsavelId = user.role === 'vendedor' ? user.id : String(b.responsavel_id || user.id);
    const resp = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(responsavelId) as
      | { id: string; full_name: string }
      | undefined;
    if (!resp) {
      res.status(400).json({ error: 'Responsável inválido.' });
      return;
    }

    const origemTipo = String(b.origem_tipo || 'manual');
    const categoria = String(b.categoria || 'Outros');
    const prioridade = String(b.prioridade || 'Média');
    const status = String(b.status || 'Não iniciada');
    const now = new Date().toISOString();
    const id = `act-${crypto.randomUUID().slice(0, 8)}`;

    db.prepare(
      `INSERT INTO action_plans (
        id, titulo, problema_identificado, origem_tipo, origem_id, origem_label,
        descricao, categoria, responsavel_id, responsavel_nome,
        criado_por_id, criado_por_nome, data_criacao, prazo_conclusao,
        prioridade, resultado_esperado, indicador_relacionado, status,
        evidencia_conclusao, data_conclusao, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      String(b.titulo).trim(),
      String(b.problema_identificado).trim(),
      origemTipo,
      toNullableString(b.origem_id),
      String(b.origem_label || '').trim(),
      String(b.descricao || '').trim(),
      categoria,
      resp.id,
      resp.full_name,
      user.id,
      user.full_name,
      String(b.data_criacao || now.slice(0, 10)),
      String(b.prazo_conclusao),
      prioridade,
      String(b.resultado_esperado || '').trim(),
      String(b.indicador_relacionado || '').trim(),
      status,
      String(b.evidencia_conclusao || '').trim(),
      status === 'Concluída' ? now.slice(0, 10) : null,
      now,
      now
    );
    recordAudit(user, 'ActionPlan', id, 'CREATE', `Ação "${b.titulo}" criada (${prioridade})`);
    res.status(201).json(db.prepare('SELECT * FROM action_plans WHERE id = ?').get(id));
  });

  app.put('/api/action-plans/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM action_plans WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Ação não encontrada.' });
      return;
    }
    if (user.role === 'vendedor' && existing.responsavel_id !== user.id && existing.criado_por_id !== user.id) {
      res.status(403).json({ error: 'Você só pode atualizar ações atribuídas a você.' });
      return;
    }
    const b = req.body as Record<string, unknown>;
    const nextStatus = String(b.status ?? existing.status);
    const responsavelId =
      user.role === 'vendedor'
        ? String(existing.responsavel_id)
        : String(b.responsavel_id ?? existing.responsavel_id);
    const resp = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(responsavelId) as
      | { id: string; full_name: string }
      | undefined;

    const now = new Date().toISOString();
    const dataConclusao =
      nextStatus === 'Concluída'
        ? String(b.data_conclusao || existing.data_conclusao || now.slice(0, 10))
        : null;

    db.prepare(
      `UPDATE action_plans SET
        titulo = ?, problema_identificado = ?, descricao = ?, categoria = ?,
        responsavel_id = ?, responsavel_nome = ?, prazo_conclusao = ?,
        prioridade = ?, resultado_esperado = ?, indicador_relacionado = ?,
        status = ?, evidencia_conclusao = ?, data_conclusao = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      String(b.titulo ?? existing.titulo).trim(),
      String(b.problema_identificado ?? existing.problema_identificado).trim(),
      String(b.descricao ?? existing.descricao ?? '').trim(),
      String(b.categoria ?? existing.categoria),
      resp ? resp.id : String(existing.responsavel_id),
      resp ? resp.full_name : String(existing.responsavel_nome),
      String(b.prazo_conclusao ?? existing.prazo_conclusao),
      String(b.prioridade ?? existing.prioridade),
      String(b.resultado_esperado ?? existing.resultado_esperado ?? '').trim(),
      String(b.indicador_relacionado ?? existing.indicador_relacionado ?? '').trim(),
      nextStatus,
      String(b.evidencia_conclusao ?? existing.evidencia_conclusao ?? '').trim(),
      dataConclusao,
      now,
      id
    );
    recordAudit(user, 'ActionPlan', id, 'UPDATE', `Ação "${existing.titulo}" atualizada (${nextStatus})`, {
      fromStatus: existing.status,
      toStatus: nextStatus,
    });
    res.json(db.prepare('SELECT * FROM action_plans WHERE id = ?').get(id));
  });

  app.delete('/api/action-plans/:id', requireAuth, requireRoles(['admin', 'gestor']), (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT titulo FROM action_plans WHERE id = ?').get(id) as { titulo: string } | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Ação não encontrada.' });
      return;
    }
    db.prepare('DELETE FROM action_plans WHERE id = ?').run(id);
    recordAudit(req.authUser!, 'ActionPlan', id, 'DELETE', `Ação "${existing.titulo}" excluída`);
    res.json({ ok: true });
  });

  // ---------------- AUDIT LOGS & EXPORTS ----------------
  app.get('/api/audit-logs', requireAuth, requireRoles(['admin', 'gestor']), (_req: AuthedRequest, res: Response) => {
    res.json(db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200').all());
  });

  app.post('/api/audit-logs/export', requireAuth, (req: AuthedRequest, res: Response) => {
    const { reportName, format, count } = req.body as { reportName?: string; format?: string; count?: number };
    recordAudit(
      req.authUser!,
      'Report',
      reportName || 'relatorio',
      'EXPORT',
      `Exportação de relatório "${reportName || 'Gerencial'}" (${format || 'PDF'}) com ${count ?? 0} registros`
    );
    res.json({ ok: true });
  });

  // ---------------- SERVER-SIDE GEMINI AI TOOLS (EXISTING AUTEC FEATURES) ----------------
  const getGeminiClient = (): GoogleGenAI | null => {
    const rawKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!rawKey || rawKey === 'MY_GEMINI_API_KEY') return null;
    return new GoogleGenAI({
      apiKey: rawKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  const extractGeminiError = (err: unknown): { status: number; message: string; isTransient: boolean } => {
    const errObj = err as { status?: number; code?: number; message?: string; cause?: { code?: string; message?: string } };
    let status = Number(errObj?.status || errObj?.code || 0);
    const rawMsg = String(errObj?.message || errObj?.cause?.message || err || '');

    if (!status) {
      const codeMatch = /"code"\s*:\s*(\d{3})/.exec(rawMsg) || /\b(400|401|403|404|429|500|502|503|504)\b/.exec(rawMsg);
      if (codeMatch) status = Number(codeMatch[1]);
    }

    const upper = rawMsg.toUpperCase();
    const isTransient =
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      upper.includes('UNAVAILABLE') ||
      upper.includes('INTERNAL') ||
      upper.includes('RESOURCE_EXHAUSTED') ||
      upper.includes('ECONNRESET') ||
      upper.includes('ETIMEDOUT') ||
      upper.includes('FETCH FAILED');

    return { status: status || 500, message: rawMsg, isTransient };
  };

  const generateGeminiTextWithRetry = async (ai: GoogleGenAI, prompt: string): Promise<string> => {
    const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let lastErr: unknown;

    for (const model of modelsToTry) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
          });
          const text = (response.text || '').trim();
          if (text) return text;
          lastErr = new Error('EMPTY_MODEL_RESPONSE');
        } catch (err) {
          lastErr = err;
          const info = extractGeminiError(err);
          console.error(`[AI ${model} attempt ${attempt}] status=${info.status} msg=${info.message.slice(0, 260)}`);

          // Do not retry auth/key errors
          if (
            info.status === 400 ||
            info.status === 401 ||
            info.status === 403 ||
            info.message.includes('API_KEY_INVALID') ||
            info.message.includes('PERMISSION_DENIED')
          ) {
            throw err;
          }

          // If model 404, break inner retry loop and try secondary valid model
          if (info.status === 404 || info.message.includes('NOT_FOUND')) {
            break;
          }

          if (info.isTransient && attempt < 3) {
            const delayMs = 500 * Math.pow(2, attempt - 1);
            await new Promise((r) => setTimeout(r, delayMs));
            continue;
          }
          break;
        }
      }
    }

    throw lastErr;
  };

  app.post('/api/ai/generate-argument', requireAuth, async (req: AuthedRequest, res: Response) => {
    const {
      productId,
      productName,
      productDiff,
      norms,
      labProfileName,
      labPain,
      resistanceType,
      competitorName,
      competitorDiff,
      clientName,
      negotiationStage,
      tone,
      toneStyle,
      channel,
      customNotes,
    } = req.body as Record<string, string>;

    let prodRow:
      | {
          nome_equipamento: string;
          categoria: string;
          aplicacao_laboratorial: string;
          normas_atendidas: string;
          diferenciais: string;
          especificacoes_json: string;
        }
      | undefined;

    if (String(productId || '').trim()) {
      prodRow = db
        .prepare(
          'SELECT nome_equipamento, categoria, aplicacao_laboratorial, normas_atendidas, diferenciais, especificacoes_json FROM products WHERE id = ?'
        )
        .get(String(productId).trim()) as typeof prodRow;
    }

    const finalProductName = (prodRow?.nome_equipamento || productName || '').trim();
    if (!finalProductName) {
      res.status(400).json({ error: 'Selecione um equipamento Autec para gerar o argumento.' });
      return;
    }

    const finalNorms = (prodRow?.normas_atendidas || norms || '').trim() || 'Padrão laboratorial';
    const finalDiff = (prodRow?.diferenciais || productDiff || '').trim() || 'Alta precisão e suporte técnico especializado';
    const finalApp = (prodRow?.aplicacao_laboratorial || '').trim();
    const finalCategory = (prodRow?.categoria || '').trim();

    const playbookObj = db
      .prepare('SELECT objecao_comum, argumento_tecnico, analogia_venda, pergunta_retorno FROM objections WHERE lower(tipo_resistencia) = lower(?) LIMIT 1')
      .get(String(resistanceType || '').trim()) as
      | { objecao_comum: string; argumento_tecnico: string; analogia_venda: string; pergunta_retorno: string }
      | undefined;

    let competitorExtra = (competitorDiff || '').trim();
    if (!competitorExtra && String(competitorName || '').trim()) {
      const compRow = db
        .prepare('SELECT categoria_atuacao, produtos_concorrentes, descricao FROM competitors WHERE lower(nome) = lower(?) LIMIT 1')
        .get(String(competitorName).trim()) as
        | { categoria_atuacao: string; produtos_concorrentes: string; descricao: string }
        | undefined;
      if (compRow) {
        competitorExtra = [compRow.categoria_atuacao, compRow.produtos_concorrentes, compRow.descricao]
          .filter(Boolean)
          .join(' — ');
      }
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Chave GEMINI_API_KEY não configurada no servidor. Configure a chave em Settings > Secrets para habilitar a geração por IA.',
      });
      return;
    }

    const toneStyleGuideMap: Record<string, string> = {
      Consultivo: 'Linguagem empática, colaborativa e investigativa, validando a dor do laboratório antes de apresentar a solução.',
      Direto: 'Frases curtas, objetivas e sem rodeios; destaque impacto imediato e dados práticos em leitura rápida.',
      Persuasivo: 'Foco em valor percebido, redução de risco operacional/auditoria, custo da inação (TCO) e chamada firme para avançar.',
      'Técnico-Analítico': 'Linguagem rigorosa de engenharia analítica, enfatizando normas, rastreabilidade, reprodutibilidade e robustez.',
    };
    const selectedToneStyle = (toneStyle || 'Consultivo').trim();
    const toneStyleInstruction = toneStyleGuideMap[selectedToneStyle] || toneStyleGuideMap.Consultivo;

    try {
      const prompt = `Você é um especialista sênior em vendas consultivas B2B da Autec Equipamentos de Laboratório.
Gere um roteiro comercial objetivo, técnico e persuasivo em Português do Brasil para o vendedor utilizar na negociação:

DADOS DO CLIENTE E CENÁRIO:
- Cliente / Laboratório: ${clientName || 'Não informado'}
- Perfil do laboratório: ${labProfileName || 'Geral'}
- Dor principal do perfil: ${labPain || 'Confiabilidade, conformidade em auditoria e produtividade'}
- Etapa da negociação: ${negotiationStage || 'Negociação / Apresentação de Proposta'}
- Canal de abordagem: ${channel || 'Reunião Consultiva / Presencial ou Vídeo'}
- Estilo de Tom: ${selectedToneStyle} (${toneStyleInstruction})
- Enfoque estratégico: ${tone || 'Consultivo & Normativo'}

EQUIPAMENTO AUTEC:
- Equipamento: ${finalProductName}${finalCategory ? ` (${finalCategory})` : ''}
${finalApp ? `- Aplicação laboratorial: ${finalApp}` : ''}
- Normas e referências atendidas: ${finalNorms}
- Diferenciais técnicos do equipamento: ${finalDiff}

OBJEÇÃO E CONCORRÊNCIA:
- Tipo de objeção enfrentada: ${resistanceType || 'Geral'}
- Concorrente citado: ${competitorName || 'Nenhum citado'}
${competitorExtra ? `- Contexto conhecido do concorrente: ${competitorExtra}` : ''}
${playbookObj ? `- Referência do playbook interno Autec: Objeção típica: "${playbookObj.objecao_comum}" | Base técnica: ${playbookObj.argumento_tecnico} | Analogia: ${playbookObj.analogia_venda} | Pergunta sugerida: ${playbookObj.pergunta_retorno}` : ''}
${customNotes?.trim() ? `- Observações específicas da negociação informadas pelo vendedor: ${customNotes.trim()}` : ''}

REGRAS DE SAÍDA (não invente preços ou prazos que não foram informados, aplique estritamente o Estilo de Tom "${selectedToneStyle}" e adapte o formato ao canal "${channel || 'Reunião Consultiva'}"):
Estruture em 3 blocos claros e práticos:
1) Argumento Técnico de Valor (conectando o ${finalProductName} às normas ${finalNorms} e à rotina do cliente)
2) Contorno da Objeção (focado em TCO, conformidade, confiabilidade e diferenciação frente ao concorrente)
3) Pergunta Estratégica de Fechamento e Próximo Passo.`;

      const text = await generateGeminiTextWithRetry(ai, prompt);
      res.json({ argument: text, source: 'gemini' });
    } catch (err: unknown) {
      const info = extractGeminiError(err);
      console.error('[AI generate-argument FINAL FAILURE]', info.status, info.message);
      if (
        info.status === 403 ||
        info.status === 401 ||
        info.status === 400 ||
        info.message.includes('PERMISSION_DENIED') ||
        info.message.includes('API_KEY_INVALID')
      ) {
        res.status(403).json({
          error: 'Chave Gemini inválida ou sem permissão. Verifique a GEMINI_API_KEY em Settings > Secrets.',
        });
        return;
      }
      if (info.status === 429 || info.message.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error: 'Limite de requisições da API Gemini atingido no momento. Aguarde alguns segundos e tente novamente.',
        });
        return;
      }
      if (info.status === 503 || info.message.includes('UNAVAILABLE')) {
        res.status(503).json({
          error: 'O serviço da API Gemini está temporariamente sobrecarregado (503). Tente novamente em alguns segundos.',
        });
        return;
      }
      res.status(500).json({
        error: `Falha ao gerar o argumento na API Gemini (código ${info.status}). Tente novamente em instantes.`,
      });
    }
  });

  app.post('/api/ai/equipment-chat', requireAuth, async (req: AuthedRequest, res: Response) => {
    const { question, productId } = req.body as { question?: string; productId?: string };
    if (!question?.trim() && !productId) {
      res.status(400).json({ error: 'Digite uma pergunta técnica ou selecione um equipamento Autec.' });
      return;
    }

    const products = db
      .prepare('SELECT id, codigo, nome_equipamento, categoria, aplicacao_laboratorial, normas_atendidas, diferenciais, especificacoes_json FROM products WHERE ativo = 1')
      .all() as Array<Record<string, string>>;

    const focused = productId ? products.find((p) => p.id === productId) : undefined;
    const effectiveQuestion =
      question?.trim() || (focused ? `Apresente a ficha técnica, aplicações, normas e diferenciais do ${focused.nome_equipamento}.` : '');

    const buildStructuredBrief = (p: Record<string, string>): string => {
      let specs: Record<string, string> = {};
      try {
        specs = JSON.parse(p.especificacoes_json || '{}') as Record<string, string>;
      } catch {
        specs = {};
      }
      const specLines = Object.entries(specs).map(([k, v]) => `  - ${k}: ${v}`);
      return [
        `${p.nome_equipamento} (${p.codigo})`,
        `Linha: ${p.categoria}`,
        ``,
        `• Aplicação Laboratorial:\n  ${p.aplicacao_laboratorial || 'Sob consulta técnica.'}`,
        ``,
        `• Normas e Referências:\n  ${p.normas_atendidas || 'Conforme especificação técnica.'}`,
        ``,
        `• Diferenciais Comerciais:\n  ${p.diferenciais || 'Representação e suporte especializado Autec.'}`,
        ...(specLines.length > 0 ? ['', '• Especificações e Detalhes:', ...specLines] : []),
      ].join('\n');
    };

    const ai = getGeminiClient();
    if (!ai) {
      if (focused && (!question?.trim() || /ficha|detalhe|resumo|sobre|apresente/i.test(effectiveQuestion))) {
        res.json({ reply: buildStructuredBrief(focused), source: 'catalog_lookup' });
        return;
      }

      if (focused) {
        const reply = `${buildStructuredBrief(focused)}\n\n• Resposta direta à consulta ("${effectiveQuestion}"):\n  Para aplicações envolvendo ${focused.nome_equipamento}, destaque ${focused.diferenciais.toLowerCase()} e conformidade com ${focused.normas_atendidas}.`;
        res.json({ reply, source: 'catalog_lookup' });
        return;
      }

      const tokens = effectiveQuestion
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2);
      const scored = products
        .map((p) => {
          const hay = `${p.codigo} ${p.nome_equipamento} ${p.categoria} ${p.aplicacao_laboratorial} ${p.normas_atendidas} ${p.diferenciais}`.toLowerCase();
          const score = tokens.reduce((acc, tk) => (hay.includes(tk) ? acc + 1 : acc), 0);
          return { p, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((x) => x.p);

      const categories = Array.from(new Set(products.map((p) => p.categoria)));
      const reply =
        scored.length > 0
          ? scored.map((p) => buildStructuredBrief(p)).join('\n\n────────────────────────\n\n')
          : `Catálogo oficial Autec ativo com ${products.length} equipamentos nas linhas:\n${categories
              .map((c) => `• ${c} (${products.filter((p) => p.categoria === c).length} modelos)`)
              .join('\n')}\n\nClique em qualquer equipamento na lista ao lado ou digite o nome/fabricante (CAMAG, Biotage, Advion, CEM, LUM, Syrris, VICI DBS).`;
      res.json({ reply, source: 'catalog_lookup' });
      return;
    }

    try {
      const catalogContext = products
        .map(
          (p) =>
            `${p.codigo} | ${p.categoria} | ${p.nome_equipamento} | Aplicação: ${p.aplicacao_laboratorial} | Normas: ${p.normas_atendidas} | Diferenciais: ${p.diferenciais}`
        )
        .join('\n');

      const prompt = focused
        ? `Você é o assistente técnico comercial da Autec Equipamentos de Laboratório.
O vendedor selecionou especificamente o equipamento abaixo do catálogo oficial:
${buildStructuredBrief(focused)}

Responda em Português do Brasil de forma objetiva, consultiva e fiel aos dados acima (sem inventar preços ou especificações não listadas).
Solicitação do vendedor: ${effectiveQuestion}`
        : `Você é o assistente técnico comercial da Autec Equipamentos de Laboratório. Responda de forma clara, objetiva e técnica em Português do Brasil com base no catálogo oficial abaixo (sem inventar preços):\n\n${catalogContext}\n\nPergunta do vendedor: ${effectiveQuestion}`;

      const reply = await generateGeminiTextWithRetry(ai, prompt);
      res.json({ reply, source: 'gemini' });
    } catch (err: unknown) {
      const info = extractGeminiError(err);
      console.error('[AI equipment-chat FINAL FAILURE]', info.status, info.message);
      if (focused) {
        res.json({ reply: buildStructuredBrief(focused), source: 'catalog_fallback' });
        return;
      }
      res.status(500).json({ error: 'Falha ao consultar o assistente de equipamentos.' });
    }
  });

  // ---------------- LANDING PAGE CMS (SQLITE GRATUITO + SENHA OCULTA) ----------------
  const LANDING_UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(LANDING_UPLOADS_DIR)) {
    fs.mkdirSync(LANDING_UPLOADS_DIR, { recursive: true });
  }

  const createLandingAdminToken = (): string => {
    const exp = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
    const payload = Buffer.from(JSON.stringify({ scope: 'landing_admin', exp })).toString('base64url');
    const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  };

  const verifyLandingAdminToken = (token: string): boolean => {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payload, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
    if (sig.length !== expectedSig.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;
    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
        scope?: string;
        exp?: number;
      };
      return decoded.scope === 'landing_admin' && typeof decoded.exp === 'number' && Date.now() <= decoded.exp;
    } catch {
      return false;
    }
  };

  const requireLandingAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const token = String(req.headers['x-landing-admin-token'] || '').trim();
    if (!token || !verifyLandingAdminToken(token)) {
      res.status(401).json({ error: 'Sessão de administrador expirada ou inválida. Informe a senha novamente.' });
      return;
    }
    next();
  };

  app.get('/api/landing', (_req: Request, res: Response) => {
    const row = db.prepare('SELECT content_json, updated_at FROM landing_content WHERE id = ?').get('main') as
      | { content_json: string; updated_at: string }
      | undefined;

    if (!row) {
      res.json({ content: DEFAULT_LANDING_CONTENT, updated_at: new Date().toISOString() });
      return;
    }

    try {
      const parsed = JSON.parse(row.content_json) as Partial<LandingContent>;
      const merged: LandingContent = {
        ...DEFAULT_LANDING_CONTENT,
        ...parsed,
        hero: { ...DEFAULT_LANDING_CONTENT.hero, ...(parsed.hero || {}) },
        purposeSection: { ...DEFAULT_LANDING_CONTENT.purposeSection, ...(parsed.purposeSection || {}) },
        differentialsSection: { ...DEFAULT_LANDING_CONTENT.differentialsSection, ...(parsed.differentialsSection || {}) },
        modulesSection: { ...DEFAULT_LANDING_CONTENT.modulesSection, ...(parsed.modulesSection || {}) },
        audienceSection: { ...DEFAULT_LANDING_CONTENT.audienceSection, ...(parsed.audienceSection || {}) },
        portfolioSection: { ...DEFAULT_LANDING_CONTENT.portfolioSection, ...(parsed.portfolioSection || {}) },
        ctaSection: { ...DEFAULT_LANDING_CONTENT.ctaSection, ...(parsed.ctaSection || {}) },
        footer: { ...DEFAULT_LANDING_CONTENT.footer, ...(parsed.footer || {}) },
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : DEFAULT_LANDING_CONTENT.highlights,
        customBlocks: Array.isArray(parsed.customBlocks) ? parsed.customBlocks : DEFAULT_LANDING_CONTENT.customBlocks,
      };
      res.json({ content: merged, updated_at: row.updated_at });
    } catch {
      res.json({ content: DEFAULT_LANDING_CONTENT, updated_at: row.updated_at });
    }
  });

  app.post('/api/landing/admin/verify', (req: Request, res: Response) => {
    const { password } = req.body as { password?: string };
    const cleanPass = String(password || '').trim();
    if (!cleanPass) {
      res.status(400).json({ error: 'Informe a senha de administrador.' });
      return;
    }
    const row = db
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('landing_admin_password_hash') as { value: string } | undefined;

    if (!row || !verifyPassword(cleanPass, row.value)) {
      res.status(401).json({ error: 'Senha de administrador incorreta.' });
      return;
    }

    const token = createLandingAdminToken();
    res.json({ ok: true, token });
  });

  app.put('/api/landing', requireLandingAdmin, (req: Request, res: Response) => {
    const { content } = req.body as { content?: LandingContent };
    if (!content || typeof content !== 'object') {
      res.status(400).json({ error: 'Conteúdo inválido para salvar a Landing Page.' });
      return;
    }

    const now = new Date().toISOString();
    const serialized = JSON.stringify(content);
    db.prepare(
      `INSERT INTO landing_content (id, content_json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at`
    ).run('main', serialized, now);

    res.json({ ok: true, content, updated_at: now });
  });

  app.post('/api/landing/reset', requireLandingAdmin, (_req: Request, res: Response) => {
    const now = new Date().toISOString();
    const serialized = JSON.stringify(DEFAULT_LANDING_CONTENT);
    db.prepare(
      `INSERT INTO landing_content (id, content_json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at`
    ).run('main', serialized, now);

    res.json({ ok: true, content: DEFAULT_LANDING_CONTENT, updated_at: now });
  });

  app.post('/api/landing/upload', requireLandingAdmin, (req: Request, res: Response) => {
    const { filename, dataUrl } = req.body as { filename?: string; dataUrl?: string };
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Envie um arquivo de imagem válido.' });
      return;
    }

    const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
    if (!match) {
      res.status(400).json({ error: 'Formato não suportado. Use PNG, JPG, WEBP ou GIF.' });
      return;
    }

    const mime = match[1];
    const base64Data = match[2];
    const buf = Buffer.from(base64Data, 'base64');
    if (buf.length > 8 * 1024 * 1024) {
      res.status(400).json({ error: 'A imagem excede o limite de 8 MB.' });
      return;
    }

    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = extMap[mime] || 'jpg';
    const safeBase = String(filename || 'imagem')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40) || 'imagem';
    const storedName = `${safeBase}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const targetPath = path.join(LANDING_UPLOADS_DIR, storedName);

    fs.writeFileSync(targetPath, buf);
    res.json({ ok: true, url: `/api/landing/uploads/${storedName}`, filename: storedName });
  });

  app.get('/api/landing/uploads/:filename', (req: Request, res: Response) => {
    const filename = String(req.params.filename || '');
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      res.status(400).json({ error: 'Nome de arquivo inválido.' });
      return;
    }
    const filePath = path.join(LANDING_UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Imagem não encontrada.' });
      return;
    }
    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(filePath);
  });
}
