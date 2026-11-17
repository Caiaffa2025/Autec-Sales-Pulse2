import type {
  ActionPlan,
  AuditLog,
  Client,
  CompetitiveOccurrence,
  Competitor,
  Goal,
  Interaction,
  LabProfile,
  LandingContent,
  LossReason,
  LostOpportunity,
  Objection,
  Opportunity,
  Product,
  RecoveryAttempt,
  User,
} from '../types';

const TOKEN_KEY = 'autec_sales_pulse_token';
const LANDING_ADMIN_TOKEN_KEY = 'autec_landing_admin_token';

export function getLandingAdminToken(): string | null {
  try {
    return sessionStorage.getItem(LANDING_ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setLandingAdminToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(LANDING_ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(LANDING_ADMIN_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errMsg =
      (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : null) || `Erro HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: User }>('/api/auth/me'),

  // Users
  listDirectory: () => request<User[]>('/api/users/directory'),
  listUsers: () => request<User[]>('/api/users'),
  createUser: (payload: {
    full_name: string;
    email: string;
    password: string;
    role: string;
    equipe: string;
  }) =>
    request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (id: string, payload: Partial<User> & { password?: string }) =>
    request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Catalogs & CRM
  listProducts: () => request<Product[]>('/api/products'),
  createProduct: (payload: Partial<Product>) =>
    request<Product>('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  listLabProfiles: () => request<LabProfile[]>('/api/lab-profiles'),
  createLabProfile: (payload: Partial<LabProfile>) =>
    request<LabProfile>('/api/lab-profiles', { method: 'POST', body: JSON.stringify(payload) }),

  listObjections: () => request<Objection[]>('/api/objections'),
  createObjection: (payload: Partial<Objection>) =>
    request<Objection>('/api/objections', { method: 'POST', body: JSON.stringify(payload) }),

  listClients: () => request<Client[]>('/api/clients'),
  createClient: (payload: Partial<Client>) =>
    request<Client>('/api/clients', { method: 'POST', body: JSON.stringify(payload) }),

  listOpportunities: () => request<Opportunity[]>('/api/opportunities'),
  createOpportunity: (payload: Partial<Opportunity>) =>
    request<Opportunity>('/api/opportunities', { method: 'POST', body: JSON.stringify(payload) }),
  updateOpportunity: (id: string, payload: Partial<Opportunity>) =>
    request<Opportunity>(`/api/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteOpportunity: (id: string) =>
    request<{ ok: boolean }>(`/api/opportunities/${id}`, { method: 'DELETE' }),

  listInteractions: () => request<Interaction[]>('/api/interactions'),
  createInteraction: (payload: Partial<Interaction>) =>
    request<Interaction>('/api/interactions', { method: 'POST', body: JSON.stringify(payload) }),
  updateInteractionProgress: (id: string, payload: { avancou_funil: boolean | null; motivo_estagnacao?: string }) =>
    request<Interaction>(`/api/interactions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  listGoals: () => request<Goal[]>('/api/goals'),
  createGoal: (payload: Partial<Goal>) =>
    request<Goal>('/api/goals', { method: 'POST', body: JSON.stringify(payload) }),
  deleteGoal: (id: string) =>
    request<{ ok: boolean }>(`/api/goals/${id}`, { method: 'DELETE' }),

  // Module 1: Radar de Concorrentes
  listCompetitors: () => request<Competitor[]>('/api/competitors'),
  createCompetitor: (payload: Partial<Competitor>) =>
    request<Competitor>('/api/competitors', { method: 'POST', body: JSON.stringify(payload) }),
  updateCompetitor: (id: string, payload: Partial<Competitor>) =>
    request<Competitor>(`/api/competitors/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  listOccurrences: () => request<CompetitiveOccurrence[]>('/api/competitive-occurrences'),
  createOccurrence: (payload: Partial<CompetitiveOccurrence>) =>
    request<CompetitiveOccurrence>('/api/competitive-occurrences', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateOccurrence: (id: string, payload: Partial<CompetitiveOccurrence>) =>
    request<CompetitiveOccurrence>(`/api/competitive-occurrences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Module 2: Perdas Comerciais
  listLossReasons: () => request<LossReason[]>('/api/loss-reasons'),
  createLossReason: (nome: string) =>
    request<LossReason>('/api/loss-reasons', { method: 'POST', body: JSON.stringify({ nome }) }),

  listLostOpportunities: () => request<LostOpportunity[]>('/api/lost-opportunities'),
  createLostOpportunity: (payload: Partial<LostOpportunity>) =>
    request<LostOpportunity>('/api/lost-opportunities', { method: 'POST', body: JSON.stringify(payload) }),

  listRecoveryAttempts: () => request<RecoveryAttempt[]>('/api/recovery-attempts'),
  createRecoveryAttempt: (lostId: string, payload: Partial<RecoveryAttempt>) =>
    request<{ attempt: RecoveryAttempt; lostOpportunity: LostOpportunity }>(
      `/api/lost-opportunities/${lostId}/recovery-attempts`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  // Module 4: Plano de Ação
  listActionPlans: () => request<ActionPlan[]>('/api/action-plans'),
  createActionPlan: (payload: Partial<ActionPlan>) =>
    request<ActionPlan>('/api/action-plans', { method: 'POST', body: JSON.stringify(payload) }),
  updateActionPlan: (id: string, payload: Partial<ActionPlan>) =>
    request<ActionPlan>(`/api/action-plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteActionPlan: (id: string) =>
    request<{ ok: boolean }>(`/api/action-plans/${id}`, { method: 'DELETE' }),

  // Audit & Reports
  listAuditLogs: () => request<AuditLog[]>('/api/audit-logs'),
  logExport: (reportName: string, format: string, count: number) =>
    request<{ ok: boolean }>('/api/audit-logs/export', {
      method: 'POST',
      body: JSON.stringify({ reportName, format, count }),
    }),

  // AI Tools
  generateArgument: (payload: Record<string, string>) =>
    request<{ argument: string; source: string }>('/api/ai/generate-argument', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  equipmentChat: (question: string, productId?: string) =>
    request<{ reply: string; source: string }>('/api/ai/equipment-chat', {
      method: 'POST',
      body: JSON.stringify({ question, productId }),
    }),

  // Landing Page CMS
  getLanding: () => request<{ content: LandingContent; updated_at: string }>('/api/landing'),
  verifyLandingAdmin: (password: string) =>
    request<{ ok: boolean; token: string }>('/api/landing/admin/verify', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  saveLanding: (content: LandingContent, adminToken: string) =>
    request<{ ok: boolean; content: LandingContent; updated_at: string }>('/api/landing', {
      method: 'PUT',
      headers: { 'X-Landing-Admin-Token': adminToken },
      body: JSON.stringify({ content }),
    }),
  resetLanding: (adminToken: string) =>
    request<{ ok: boolean; content: LandingContent; updated_at: string }>('/api/landing/reset', {
      method: 'POST',
      headers: { 'X-Landing-Admin-Token': adminToken },
    }),
  uploadLandingImage: (filename: string, dataUrl: string, adminToken: string) =>
    request<{ ok: boolean; url: string; filename: string }>('/api/landing/upload', {
      method: 'POST',
      headers: { 'X-Landing-Admin-Token': adminToken },
      body: JSON.stringify({ filename, dataUrl }),
    }),
};
