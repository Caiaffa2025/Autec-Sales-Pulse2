import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Briefcase,
  CheckSquare,
  FileBarChart2,
  FlaskConical,
  Globe,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Radar,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import type {
  ActionPlan,
  ActionPrefill,
  AuditLog,
  Client,
  CompetitiveOccurrence,
  Competitor,
  GlobalFilters,
  Goal,
  Interaction,
  LabProfile,
  LossReason,
  LostOpportunity,
  Objection,
  Opportunity,
  Product,
  RecoverabilityStatus,
  RecoveryAttempt,
  User,
} from './types';
import { api, getStoredToken, setStoredToken } from './utils/api';
import { parseNullableNumber, ROLE_LABELS, startOfMonthISO, todayISO } from './utils/formatters';
import { ActionModal } from './components/ActionModal';
import { QuickClientModal } from './components/QuickClientModal';
import { Modal } from './components/UI';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CompetitorRadarPage } from './pages/CompetitorRadarPage';
import { CommercialLossesPage } from './pages/CommercialLossesPage';
import { CommercialPerformancePage } from './pages/CommercialPerformancePage';
import { ActionPlanPage } from './pages/ActionPlanPage';
import { ReportsPage } from './pages/ReportsPage';
import {
  ChatEquipamentosPage,
  ComparativoTecnicoPage,
  GerarArgumentoPage,
  HistoricoInteracoesPage,
  KnowledgeBasePage,
  QuizComercialPage,
} from './pages/SalesToolsPages';
import {
  AdminColaboradoresPage,
  CadastrosOportunidadesPage,
  CockpitGestorPage,
  RankingMetasPage,
} from './pages/ManagementCadastrosPages';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  roles?: Array<'admin' | 'gestor' | 'vendedor'>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, group: 'Inteligência Comercial' },
  { label: 'Radar de Concorrentes', path: '/radar-concorrentes', icon: Radar, group: 'Inteligência Comercial' },
  { label: 'Perdas Comerciais', path: '/perdas-comerciais', icon: TrendingDown, group: 'Inteligência Comercial' },
  { label: 'Performance Comercial', path: '/performance-comercial', icon: TrendingUp, group: 'Inteligência Comercial' },
  { label: 'Plano de Ação', path: '/plano-acao', icon: CheckSquare, group: 'Inteligência Comercial' },
  {
    label: 'Relatórios Gerenciais',
    path: '/relatorios',
    icon: FileBarChart2,
    group: 'Inteligência Comercial',
    roles: ['admin', 'gestor'],
  },

  { label: 'Gerar Argumento', path: '/gerar-argumento', icon: Sparkles, group: 'Operação & Funil' },
  { label: 'Comparativo Técnico', path: '/comparativo', icon: Scale, group: 'Operação & Funil' },
  { label: 'Oportunidades e Cadastros', path: '/novos-cadastros', icon: Briefcase, group: 'Operação & Funil' },
  { label: 'Histórico de Interações', path: '/historico', icon: Activity, group: 'Operação & Funil' },

  { label: 'Cockpit do Gestor', path: '/cockpit', icon: Award, group: 'Gestão Executiva', roles: ['admin', 'gestor'] },
  { label: 'Ranking de Vendedores', path: '/ranking', icon: Trophy, group: 'Gestão Executiva', roles: ['admin', 'gestor'] },
  { label: 'Gestão de Metas', path: '/metas', icon: Target, group: 'Gestão Executiva', roles: ['admin', 'gestor'] },

  { label: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen, group: 'Base Técnica & Admin' },
  { label: 'Quiz Comercial', path: '/quiz', icon: HelpCircle, group: 'Base Técnica & Admin' },
  { label: 'Chat de Equipamentos', path: '/chat-equipamentos', icon: MessageSquare, group: 'Base Técnica & Admin' },
  { label: 'Sobre a Plataforma', path: '/sobre', icon: Globe, group: 'Base Técnica & Admin' },
  {
    label: 'Colaboradores',
    path: '/admin/colaboradores',
    icon: Users,
    group: 'Base Técnica & Admin',
    roles: ['admin'],
  },
];

function createDefaultFilters(): GlobalFilters {
  return {
    dataInicio: startOfMonthISO(),
    dataFim: todayISO(),
    vendedorId: '',
    clienteId: '',
    produtoId: '',
    situacao: '',
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = window.location.pathname;
    return p || '/';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data State
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [labProfiles, setLabProfiles] = useState<LabProfile[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [occurrences, setOccurrences] = useState<CompetitiveOccurrence[]>([]);
  const [lossReasons, setLossReasons] = useState<LossReason[]>([]);
  const [lostOpportunities, setLostOpportunities] = useState<LostOpportunity[]>([]);
  const [recoveryAttempts, setRecoveryAttempts] = useState<RecoveryAttempt[]>([]);
  const [actions, setActions] = useState<ActionPlan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [filters, setFilters] = useState<GlobalFilters>(createDefaultFilters);

  // Global Modals
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionPlan | null>(null);
  const [actionPrefill, setActionPrefill] = useState<ActionPrefill | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  // Convert Opportunity -> Lost Opportunity Modal
  const [convertingOpp, setConvertingOpp] = useState<Opportunity | null>(null);
  const [convertForm, setConvertForm] = useState({
    motivo_principal_id: '',
    concorrente_vencedor_id: '',
    recuperavel: 'avaliar' as RecoverabilityStatus,
    data_prevista_abordagem: '',
    descricao_detalhada: '',
  });
  const [convertError, setConvertError] = useState('');
  const [convertSaving, setConvertSaving] = useState(false);

  const navigate = useCallback((path: string) => {
    setCurrentPath(path);
    setMobileMenuOpen(false);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      const p = window.location.pathname;
      setCurrentPath(p || '/');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const fetchAllData = useCallback(async (userObj: User) => {
    setLoadingData(true);
    setLoadError('');
    try {
      const [
        dirUsers,
        prods,
        labs,
        objs,
        clis,
        opps,
        ints,
        gls,
        cmps,
        occs,
        reasons,
        losses,
        recs,
        acts,
        logs,
      ] = await Promise.all([
        userObj.role === 'admin' ? api.listUsers() : api.listDirectory(),
        api.listProducts(),
        api.listLabProfiles(),
        api.listObjections(),
        api.listClients(),
        api.listOpportunities(),
        api.listInteractions(),
        api.listGoals(),
        api.listCompetitors(),
        api.listOccurrences(),
        api.listLossReasons(),
        api.listLostOpportunities(),
        api.listRecoveryAttempts(),
        api.listActionPlans(),
        userObj.role === 'admin' || userObj.role === 'gestor' ? api.listAuditLogs() : Promise.resolve([]),
      ]);
      setUsers(dirUsers);
      setProducts(prods);
      setLabProfiles(labs);
      setObjections(objs);
      setClients(clis);
      setOpportunities(opps);
      setInteractions(ints);
      setGoals(gls);
      setCompetitors(cmps);
      setOccurrences(occs);
      setLossReasons(reasons);
      setLostOpportunities(losses);
      setRecoveryAttempts(recs);
      setActions(acts);
      setAuditLogs(logs);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar os dados comerciais.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    api
      .me()
      .then((res) => {
        setCurrentUser(res.user);
        return fetchAllData(res.user);
      })
      .catch(() => {
        setStoredToken(null);
        setCurrentUser(null);
      })
      .finally(() => setAuthChecking(false));
  }, [fetchAllData]);

  async function handleLogin(user: User) {
    setCurrentUser(user);
    await fetchAllData(user);
    navigate('/dashboard');
  }

  function handleLogout() {
    setStoredToken(null);
    setCurrentUser(null);
    navigate('/');
  }

  function openCreateAction(prefill?: ActionPrefill) {
    setEditingAction(null);
    setActionPrefill(prefill || { origem_tipo: 'manual' });
    setActionModalOpen(true);
  }

  async function handleSaveAction(payload: Partial<ActionPlan>, editingId?: string) {
    if (editingId) {
      await api.updateActionPlan(editingId, payload);
    } else {
      await api.createActionPlan(payload);
    }
    if (currentUser) await fetchAllData(currentUser);
  }

  function openConvertOpportunityToLoss(opp: Opportunity) {
    setConvertingOpp(opp);
    setConvertForm({
      motivo_principal_id: lossReasons[0]?.id || '',
      concorrente_vencedor_id: '',
      recuperavel: 'avaliar',
      data_prevista_abordagem: '',
      descricao_detalhada: opp.observacoes || '',
    });
    setConvertError('');
  }

  async function handleConfirmConvertLoss(e: React.FormEvent) {
    e.preventDefault();
    if (!convertingOpp) return;
    if (!convertForm.motivo_principal_id) {
      setConvertError('Selecione o motivo principal da perda.');
      return;
    }
    setConvertSaving(true);
    setConvertError('');
    try {
      await api.createLostOpportunity({
        oportunidade_id: convertingOpp.id,
        cliente_id: convertingOpp.cliente_id,
        cliente_nome: convertingOpp.cliente_nome,
        vendedor_id: convertingOpp.vendedor_id,
        produto_id: convertingOpp.produto_id,
        data_abertura: convertingOpp.data_abertura,
        data_encerramento: todayISO(),
        valor_estimado: parseNullableNumber(convertingOpp.valor),
        concorrente_vencedor_id: convertForm.concorrente_vencedor_id || null,
        motivo_principal_id: convertForm.motivo_principal_id,
        recuperavel: convertForm.recuperavel,
        data_prevista_abordagem: convertForm.data_prevista_abordagem || null,
        descricao_detalhada: convertForm.descricao_detalhada.trim(),
      });
      if (currentUser) await fetchAllData(currentUser);
      setConvertingOpp(null);
      navigate('/perdas-comerciais');
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : 'Erro ao registrar perda.');
    } finally {
      setConvertSaving(false);
    }
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-sm font-medium text-[#1B2E5E]">Carregando Autec Sales Pulse...</div>
      </div>
    );
  }

  if (!currentUser) {
    if (currentPath === '/login') {
      return <LoginPage onLogin={handleLogin} onBackToLanding={() => navigate('/')} />;
    }
    return <LandingPage isAuthenticated={false} onEnterPlatform={() => navigate('/login')} />;
  }

  if (currentPath === '/sobre') {
    return <LandingPage isAuthenticated={true} onEnterPlatform={() => navigate('/dashboard')} />;
  }

  const effectivePath = currentPath === '/' || currentPath === '/login' ? '/dashboard' : currentPath;

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(currentUser.role)
  );
  const navGroups = Array.from(new Set(visibleNavItems.map((i) => i.group)));

  // Route access guard (backend also enforces RBAC on every API)
  const activeNav = NAV_ITEMS.find((i) => i.path === effectivePath);
  const accessDenied = activeNav?.roles && !activeNav.roles.includes(currentUser.role);

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1B2E5E] flex items-center justify-center shrink-0">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1B2E5E] leading-tight tracking-tight">Autec</div>
            <div className="text-[10px] text-slate-500 font-medium leading-tight">Smart Sales Engine</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1 text-slate-400 hover:text-slate-700"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group} className="space-y-1">
            <div className="px-3 text-[11px] font-semibold text-slate-400">{group}</div>
            {visibleNavItems
              .filter((i) => i.group === group)
              .map((item) => {
                const Icon = item.icon;
                const active = effectivePath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                      active
                        ? 'bg-[#1B2E5E] text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-[#1B2E5E]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="px-4 py-3.5 border-t border-slate-200 space-y-2.5">
        <div className="text-xs">
          <div className="font-semibold text-[#1B2E5E] truncate">{currentUser.full_name}</div>
          <div className="text-[11px] text-slate-500 truncate">
            {ROLE_LABELS[currentUser.role]} · {currentUser.equipe}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-slate-200 hover:border-red-300 hover:text-red-700 text-slate-600 text-xs font-medium rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair da Sessão</span>
        </button>
        <div className="text-[10px] text-slate-400 text-center">Agência STC Mobile · Autec</div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F7F8FA] text-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-slate-200 hidden lg:flex flex-col shrink-0 no-print">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden no-print">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 h-full border-r border-slate-200 shadow-xl">{SidebarContent}</aside>
        </div>
      ) : null}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0 no-print">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1.5 text-[#1B2E5E]"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1B2E5E] flex items-center justify-center">
              <FlaskConical className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-[#1B2E5E]">Autec Sales Pulse</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">{ROLE_LABELS[currentUser.role]}</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1380px] mx-auto p-4 md:p-6 space-y-5">
            {loadError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={() => fetchAllData(currentUser)}
                  className="font-semibold underline ml-3"
                >
                  Tentar novamente
                </button>
              </div>
            ) : null}

            {loadingData && products.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl" />
                ))}
              </div>
            ) : accessDenied ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-red-700 mx-auto" />
                <h2 className="text-base font-bold text-[#1B2E5E]">Acesso restrito ao perfil</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Seu perfil ({ROLE_LABELS[currentUser.role]}) não possui autorização para acessar esta área administrativa ou gerencial.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-[#1B2E5E] text-white text-xs font-medium rounded-lg"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            ) : (
              <>
                {effectivePath === '/dashboard' && (
                  <DashboardPage
                    user={currentUser}
                    users={users}
                    clients={clients}
                    products={products}
                    opportunities={opportunities}
                    interactions={interactions}
                    occurrences={occurrences}
                    lostOpportunities={lostOpportunities}
                    actions={actions}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onResetFilters={() => setFilters(createDefaultFilters())}
                    onNavigate={navigate}
                    onOpenNewOpportunity={() => navigate('/novos-cadastros')}
                  />
                )}

                {effectivePath === '/radar-concorrentes' && (
                  <CompetitorRadarPage
                    user={currentUser}
                    users={users}
                    clients={clients}
                    products={products}
                    competitors={competitors}
                    occurrences={occurrences}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onResetFilters={() => setFilters(createDefaultFilters())}
                    onRefresh={() => fetchAllData(currentUser)}
                    onOpenNewClient={() => setClientModalOpen(true)}
                    onCreateAction={openCreateAction}
                  />
                )}

                {effectivePath === '/perdas-comerciais' && (
                  <CommercialLossesPage
                    user={currentUser}
                    users={users}
                    clients={clients}
                    products={products}
                    competitors={competitors}
                    opportunities={opportunities}
                    lossReasons={lossReasons}
                    lostOpportunities={lostOpportunities}
                    recoveryAttempts={recoveryAttempts}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onResetFilters={() => setFilters(createDefaultFilters())}
                    onRefresh={() => fetchAllData(currentUser)}
                    onOpenNewClient={() => setClientModalOpen(true)}
                    onCreateAction={openCreateAction}
                  />
                )}

                {effectivePath === '/performance-comercial' && (
                  <CommercialPerformancePage
                    user={currentUser}
                    users={users}
                    clients={clients}
                    products={products}
                    opportunities={opportunities}
                    interactions={interactions}
                    occurrences={occurrences}
                    lostOpportunities={lostOpportunities}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onResetFilters={() => setFilters(createDefaultFilters())}
                    onCreateAction={openCreateAction}
                  />
                )}

                {effectivePath === '/plano-acao' && (
                  <ActionPlanPage
                    user={currentUser}
                    users={users}
                    actions={actions}
                    onNewAction={() => openCreateAction()}
                    onEditAction={(act) => {
                      setEditingAction(act);
                      setActionPrefill(null);
                      setActionModalOpen(true);
                    }}
                    onRefresh={() => fetchAllData(currentUser)}
                  />
                )}

                {effectivePath === '/relatorios' && (
                  <ReportsPage
                    user={currentUser}
                    users={users}
                    clients={clients}
                    products={products}
                    opportunities={opportunities}
                    interactions={interactions}
                    occurrences={occurrences}
                    lostOpportunities={lostOpportunities}
                    actions={actions}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onResetFilters={() => setFilters(createDefaultFilters())}
                  />
                )}

                {effectivePath === '/gerar-argumento' && (
                  <GerarArgumentoPage
                    user={currentUser}
                    clients={clients}
                    products={products}
                    labProfiles={labProfiles}
                    objections={objections}
                    competitors={competitors}
                    interactions={interactions}
                    onSavedInteraction={() => fetchAllData(currentUser)}
                  />
                )}

                {effectivePath === '/comparativo' && <ComparativoTecnicoPage products={products} />}

                {effectivePath === '/novos-cadastros' && (
                  <CadastrosOportunidadesPage
                    user={currentUser}
                    users={users}
                    clients={clients}
                    products={products}
                    opportunities={opportunities}
                    objections={objections}
                    onRefresh={() => fetchAllData(currentUser)}
                    onOpenNewClient={() => setClientModalOpen(true)}
                    onCreateAction={openCreateAction}
                    onConvertToLoss={openConvertOpportunityToLoss}
                  />
                )}

                {effectivePath === '/historico' && (
                  <HistoricoInteracoesPage
                    interactions={interactions}
                    onRefresh={() => fetchAllData(currentUser)}
                  />
                )}

                {effectivePath === '/cockpit' && (
                  <CockpitGestorPage
                    users={users}
                    opportunities={opportunities}
                    interactions={interactions}
                    goals={goals}
                  />
                )}

                {(effectivePath === '/ranking' || effectivePath === '/metas') && (
                  <RankingMetasPage
                    mode={effectivePath === '/ranking' ? 'ranking' : 'metas'}
                    users={users}
                    opportunities={opportunities}
                    interactions={interactions}
                    goals={goals}
                    onRefresh={() => fetchAllData(currentUser)}
                  />
                )}

                {effectivePath === '/knowledge-base' && (
                  <KnowledgeBasePage products={products} labProfiles={labProfiles} objections={objections} />
                )}

                {effectivePath === '/quiz' && <QuizComercialPage />}

                {effectivePath === '/chat-equipamentos' && <ChatEquipamentosPage products={products} />}

                {effectivePath === '/admin/colaboradores' && (
                  <AdminColaboradoresPage
                    currentUser={currentUser}
                    users={users}
                    auditLogs={auditLogs}
                    onRefresh={() => fetchAllData(currentUser)}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Action Modal */}
      <ActionModal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onSave={handleSaveAction}
        users={users}
        currentUser={currentUser}
        editing={editingAction}
        prefill={actionPrefill}
      />

      {/* Global Quick Client Modal */}
      <QuickClientModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onCreated={(cli) => setClients((prev) => [...prev, cli])}
      />

      {/* Convert Opportunity -> Lost Opportunity Modal */}
      <Modal
        open={Boolean(convertingOpp)}
        onClose={() => setConvertingOpp(null)}
        title={`Registrar Perda — ${convertingOpp?.codigo || ''}`}
        subtitle={convertingOpp ? `Cliente: ${convertingOpp.cliente_nome}` : ''}
      >
        <form onSubmit={handleConfirmConvertLoss} className="space-y-3">
          {convertError ? (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{convertError}</div>
          ) : null}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Motivo principal da perda *</label>
            <select
              value={convertForm.motivo_principal_id}
              onChange={(e) => setConvertForm({ ...convertForm, motivo_principal_id: e.target.value })}
              className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              required
            >
              {lossReasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Concorrente vencedor (opcional)</label>
            <select
              value={convertForm.concorrente_vencedor_id}
              onChange={(e) => setConvertForm({ ...convertForm, concorrente_vencedor_id: e.target.value })}
              className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Não identificado / Sem concorrente</option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Possibilidade de recuperação *</label>
              <select
                value={convertForm.recuperavel}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, recuperavel: e.target.value as RecoverabilityStatus })
                }
                className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="sim">Sim</option>
                <option value="avaliar">A avaliar</option>
                <option value="nao">Não</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data prevista nova abordagem</label>
              <input
                type="date"
                value={convertForm.data_prevista_abordagem}
                onChange={(e) => setConvertForm({ ...convertForm, data_prevista_abordagem: e.target.value })}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição detalhada</label>
            <textarea
              rows={3}
              value={convertForm.descricao_detalhada}
              onChange={(e) => setConvertForm({ ...convertForm, descricao_detalhada: e.target.value })}
              className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setConvertingOpp(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={convertSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg"
            >
              {convertSaving ? 'Registrando...' : 'Confirmar Perda Comercial'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
