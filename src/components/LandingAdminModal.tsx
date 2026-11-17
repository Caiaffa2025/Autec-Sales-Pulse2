import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Image as ImageIcon,
  Lock,
  LogOut,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  LandingAudienceCard,
  LandingContent,
  LandingCustomBlock,
  LandingDifferentialCard,
  LandingHighlightItem,
  LandingModuleItem,
  LandingPortfolioLine,
  LandingPurposeItem,
} from '../types';
import { api } from '../utils/api';

type AdminTab = 'hero' | 'proposito' | 'diferenciais' | 'modulos' | 'publico' | 'extras' | 'rodape';

interface LandingAdminModalProps {
  open: boolean;
  onClose: () => void;
  content: LandingContent;
  adminToken: string | null;
  onAuthenticated: (token: string) => void;
  onLogoutAdmin: () => void;
  onSavedContent: (updated: LandingContent, updatedAt: string) => void;
}

function ImageFieldControl({
  label,
  imageUrl,
  imageAlt,
  onChangeUrl,
  onChangeAlt,
  onUploadFile,
  uploading,
}: {
  label: string;
  imageUrl: string;
  imageAlt: string;
  onChangeUrl: (url: string) => void;
  onChangeAlt: (alt: string) => void;
  onUploadFile: (file: File) => void;
  uploading: boolean;
}) {
  return (
    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#1B2E5E] inline-flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </span>
        <div className="flex items-center gap-2">
          <label className="px-2.5 py-1.5 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-[11px] font-medium rounded-lg cursor-pointer inline-flex items-center gap-1.5">
            <Upload className="w-3 h-3" />
            <span>{uploading ? 'Enviando...' : 'Enviar Imagem'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadFile(file);
                e.target.value = '';
              }}
            />
          </label>
          {imageUrl ? (
            <button
              type="button"
              onClick={() => onChangeUrl('')}
              className="px-2.5 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-medium rounded-lg inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Excluir Imagem</span>
            </button>
          ) : null}
        </div>
      </div>

      {imageUrl ? (
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <img
            src={imageUrl}
            alt={imageAlt || 'Pré-visualização'}
            className="w-32 h-22 object-cover rounded-lg border border-slate-200 bg-white shrink-0"
          />
          <div className="flex-1 w-full space-y-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">URL ou caminho da imagem</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => onChangeUrl(e.target.value)}
                placeholder="https://... ou /api/landing/uploads/..."
                className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Descrição acessível (alt)</label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => onChangeAlt(e.target.value)}
                placeholder="Descrição breve da imagem"
                className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[11px] text-slate-500">
            Nenhuma imagem ativa neste bloco. Envie um arquivo do computador ou cole uma URL abaixo:
          </div>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="Cole a URL de uma imagem (opcional) ou use Enviar Imagem"
            className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
          />
        </div>
      )}
    </div>
  );
}

export function LandingAdminModal({
  open,
  onClose,
  content,
  adminToken,
  onAuthenticated,
  onLogoutAdmin,
  onSavedContent,
}: LandingAdminModalProps) {
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<AdminTab>('hero');
  const [draft, setDraft] = useState<LandingContent>(content);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(JSON.parse(JSON.stringify(content)) as LandingContent);
      setFeedback('');
      setErrorMsg('');
      setAuthError('');
      setConfirmReset(false);
    }
  }, [open, content]);

  if (!open) return null;

  async function handleVerifyPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setAuthError('Informe a senha de acesso.');
      return;
    }
    setVerifying(true);
    setAuthError('');
    try {
      const res = await api.verifyLandingAdmin(password);
      setPassword('');
      onAuthenticated(res.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Senha incorreta.');
    } finally {
      setVerifying(false);
    }
  }

  async function handleImageUpload(file: File, applyUrl: (url: string) => void) {
    if (!adminToken) return;
    setUploading(true);
    setErrorMsg('');
    setFeedback('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
        reader.readAsDataURL(file);
      });
      const res = await api.uploadLandingImage(file.name, dataUrl, adminToken);
      applyUrl(res.url);
      setFeedback('Imagem enviada e vinculada. Clique em "Salvar Tudo no Banco" para confirmar.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar imagem.';
      if (msg.toLowerCase().includes('sessão') || msg.toLowerCase().includes('expirada')) {
        onLogoutAdmin();
      }
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveAll() {
    if (!adminToken) return;
    setSaving(true);
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await api.saveLanding(draft, adminToken);
      onSavedContent(res.content, res.updated_at);
      setFeedback('Todas as alterações da Landing Page foram salvas no banco de dados.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar alterações.';
      if (msg.toLowerCase().includes('sessão') || msg.toLowerCase().includes('expirada')) {
        onLogoutAdmin();
      }
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetDefaults() {
    if (!adminToken) return;
    setSaving(true);
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await api.resetLanding(adminToken);
      setDraft(JSON.parse(JSON.stringify(res.content)) as LandingContent);
      onSavedContent(res.content, res.updated_at);
      setConfirmReset(false);
      setFeedback('Conteúdo padrão restaurado e salvo no banco de dados.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao restaurar padrão.');
    } finally {
      setSaving(false);
    }
  }

  // Password Gate Modal when not authenticated as Landing Admin
  if (!adminToken) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
          <div className="px-6 py-4 bg-[#1B2E5E] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">Acesso Administrador — Landing Page</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="text-slate-300 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleVerifyPassword} className="p-6 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Área restrita para editar textos, incluir ou excluir informações e gerenciar imagens da Landing Page
              com gravação direta no banco de dados.
            </p>

            {authError ? (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{authError}</div>
            ) : null}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Senha de Administrador</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="off"
                placeholder="••••••••"
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={verifying}
                className="px-4 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{verifying ? 'Verificando...' : 'Desbloquear Painel'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="px-5 py-3.5 bg-[#1B2E5E] text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold leading-tight">Administrador da Landing Page</h2>
              <div className="text-[11px] text-slate-300 inline-flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Incluir, editar e excluir textos e imagens · Banco de dados SQLite gratuito</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onLogoutAdmin();
                onClose();
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Bloquear Adm</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel"
              className="text-slate-300 hover:text-white p-1.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1.5 shrink-0">
          {[
            { id: 'hero', label: 'Hero & Topo' },
            { id: 'proposito', label: 'Destaques & O que faz' },
            { id: 'diferenciais', label: 'Diferenciais' },
            { id: 'modulos', label: 'Módulos Internos' },
            { id: 'publico', label: 'Público & Portfólio' },
            { id: 'extras', label: `Textos & Imagens Extras (${draft.customBlocks.length})` },
            { id: 'rodape', label: 'CTA Final & Rodapé' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as AdminTab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === t.id
                  ? 'bg-[#1B2E5E] text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable Editor Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{errorMsg}</div>
          ) : null}
          {feedback ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{feedback}</span>
            </div>
          ) : null}

          {/* TAB 1: HERO & TOPO */}
          {activeTab === 'hero' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Plataforma (Topo)</label>
                  <input
                    type="text"
                    value={draft.brandName}
                    onChange={(e) => setDraft({ ...draft, brandName: e.target.value })}
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Texto do Botão do Cabeçalho</label>
                  <input
                    type="text"
                    value={draft.headerCtaLabel}
                    onChange={(e) => setDraft({ ...draft, headerCtaLabel: e.target.value })}
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subtítulo Superior (Eyebrow)</label>
                <input
                  type="text"
                  value={draft.hero.eyebrow}
                  onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, eyebrow: e.target.value } })}
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título Principal (H1)</label>
                <textarea
                  rows={2}
                  value={draft.hero.title}
                  onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, title: e.target.value } })}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição Principal</label>
                <textarea
                  rows={3}
                  value={draft.hero.description}
                  onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, description: e.target.value } })}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Texto Botão Principal</label>
                  <input
                    type="text"
                    value={draft.hero.primaryCtaLabel}
                    onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, primaryCtaLabel: e.target.value } })}
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Texto Link Secundário</label>
                  <input
                    type="text"
                    value={draft.hero.secondaryCtaLabel}
                    onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, secondaryCtaLabel: e.target.value } })}
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <ImageFieldControl
                label="Imagem Principal (Hero)"
                imageUrl={draft.hero.imageUrl}
                imageAlt={draft.hero.imageAlt}
                uploading={uploading}
                onChangeUrl={(url) => setDraft({ ...draft, hero: { ...draft.hero, imageUrl: url } })}
                onChangeAlt={(alt) => setDraft({ ...draft, hero: { ...draft.hero, imageAlt: alt } })}
                onUploadFile={(file) =>
                  handleImageUpload(file, (url) => setDraft((prev) => ({ ...prev, hero: { ...prev.hero, imageUrl: url } })))
                }
              />
            </div>
          )}

          {/* TAB 2: DESTAQUES & PROPÓSITO */}
          {activeTab === 'proposito' && (
            <div className="space-y-6">
              {/* Highlights Strip */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1B2E5E]">Faixa de Destaques (abaixo do Hero)</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newItem: LandingHighlightItem = {
                        id: `hl-${Date.now()}`,
                        num: 'Novo',
                        title: 'Novo Destaque',
                        desc: 'Descreva este benefício comercial ou técnico.',
                      };
                      setDraft({ ...draft, highlights: [...draft.highlights, newItem] });
                    }}
                    className="px-3 py-1.5 bg-[#1B2E5E] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Incluir Destaque</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {draft.highlights.map((hl, idx) => (
                    <div key={hl.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-600">Destaque #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({ ...draft, highlights: draft.highlights.filter((x) => x.id !== hl.id) })
                          }
                          className="text-xs text-red-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={hl.num}
                          placeholder="Número/Etiqueta"
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              highlights: draft.highlights.map((x) => (x.id === hl.id ? { ...x, num: e.target.value } : x)),
                            })
                          }
                          className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                        <input
                          type="text"
                          value={hl.title}
                          placeholder="Título"
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              highlights: draft.highlights.map((x) =>
                                x.id === hl.id ? { ...x, title: e.target.value } : x
                              ),
                            })
                          }
                          className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={hl.desc}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            highlights: draft.highlights.map((x) => (x.id === hl.id ? { ...x, desc: e.target.value } : x)),
                          })
                        }
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Purpose Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3.5">
                <h3 className="text-sm font-bold text-[#1B2E5E]">Seção 01: O que faz e para que serve</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Rótulo da Seção</label>
                    <input
                      type="text"
                      value={draft.purposeSection.eyebrow}
                      onChange={(e) =>
                        setDraft({ ...draft, purposeSection: { ...draft.purposeSection, eyebrow: e.target.value } })
                      }
                      className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Título da Seção</label>
                    <input
                      type="text"
                      value={draft.purposeSection.title}
                      onChange={(e) =>
                        setDraft({ ...draft, purposeSection: { ...draft.purposeSection, title: e.target.value } })
                      }
                      className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Texto Introdutório</label>
                  <textarea
                    rows={3}
                    value={draft.purposeSection.description}
                    onChange={(e) =>
                      setDraft({ ...draft, purposeSection: { ...draft.purposeSection, description: e.target.value } })
                    }
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
                  />
                </div>

                <ImageFieldControl
                  label="Imagem da Seção Propósito"
                  imageUrl={draft.purposeSection.imageUrl}
                  imageAlt={draft.purposeSection.imageAlt}
                  uploading={uploading}
                  onChangeUrl={(url) =>
                    setDraft({ ...draft, purposeSection: { ...draft.purposeSection, imageUrl: url } })
                  }
                  onChangeAlt={(alt) =>
                    setDraft({ ...draft, purposeSection: { ...draft.purposeSection, imageAlt: alt } })
                  }
                  onUploadFile={(file) =>
                    handleImageUpload(file, (url) =>
                      setDraft((prev) => ({ ...prev, purposeSection: { ...prev.purposeSection, imageUrl: url } }))
                    )
                  }
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-slate-700">Lista de Funcionalidades / Propósitos</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = `${String(draft.purposeSection.items.length + 1).padStart(2, '0')}.`;
                      const item: LandingPurposeItem = {
                        id: `purp-${Date.now()}`,
                        index: nextIdx,
                        title: 'Novo ponto de valor da plataforma',
                        text: 'Explique como este recurso ajuda a equipe comercial.',
                      };
                      setDraft({
                        ...draft,
                        purposeSection: { ...draft.purposeSection, items: [...draft.purposeSection.items, item] },
                      });
                    }}
                    className="px-3 py-1.5 bg-[#1B2E5E] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Incluir Texto</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {draft.purposeSection.items.map((item) => (
                    <div key={item.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.index}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              purposeSection: {
                                ...draft.purposeSection,
                                items: draft.purposeSection.items.map((x) =>
                                  x.id === item.id ? { ...x, index: e.target.value } : x
                                ),
                              },
                            })
                          }
                          className="w-16 h-8 px-2 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                        />
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              purposeSection: {
                                ...draft.purposeSection,
                                items: draft.purposeSection.items.map((x) =>
                                  x.id === item.id ? { ...x, title: e.target.value } : x
                                ),
                              },
                            })
                          }
                          className="flex-1 h-8 px-2.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              purposeSection: {
                                ...draft.purposeSection,
                                items: draft.purposeSection.items.filter((x) => x.id !== item.id),
                              },
                            })
                          }
                          className="px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={item.text}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            purposeSection: {
                              ...draft.purposeSection,
                              items: draft.purposeSection.items.map((x) =>
                                x.id === item.id ? { ...x, text: e.target.value } : x
                              ),
                            },
                          })
                        }
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIFERENCIAIS */}
          {activeTab === 'diferenciais' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Rótulo da Seção</label>
                  <input
                    type="text"
                    value={draft.differentialsSection.eyebrow}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        differentialsSection: { ...draft.differentialsSection, eyebrow: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Título</label>
                  <input
                    type="text"
                    value={draft.differentialsSection.title}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        differentialsSection: { ...draft.differentialsSection, title: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subtítulo</label>
                <textarea
                  rows={2}
                  value={draft.differentialsSection.subtitle}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      differentialsSection: { ...draft.differentialsSection, subtitle: e.target.value },
                    })
                  }
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-700">Cards de Diferenciais</span>
                <button
                  type="button"
                  onClick={() => {
                    const card: LandingDifferentialCard = {
                      id: `diff-${Date.now()}`,
                      tag: 'Diferencial',
                      title: 'Novo diferencial da plataforma',
                      description: 'Descreva o diferencial competitivo para sua equipe.',
                      footerNote: 'Autec Sales Pulse',
                      highlight: false,
                      colSpan: 'narrow',
                    };
                    setDraft({
                      ...draft,
                      differentialsSection: {
                        ...draft.differentialsSection,
                        cards: [...draft.differentialsSection.cards, card],
                      },
                    });
                  }}
                  className="px-3 py-1.5 bg-[#1B2E5E] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir Diferencial</span>
                </button>
              </div>

              <div className="space-y-3">
                {draft.differentialsSection.cards.map((card) => (
                  <div key={card.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(card.highlight)}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                differentialsSection: {
                                  ...draft.differentialsSection,
                                  cards: draft.differentialsSection.cards.map((x) =>
                                    x.id === card.id ? { ...x, highlight: e.target.checked } : x
                                  ),
                                },
                              })
                            }
                          />
                          <span>Card em destaque (azul marinho)</span>
                        </label>
                        <select
                          value={card.colSpan || 'narrow'}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              differentialsSection: {
                                ...draft.differentialsSection,
                                cards: draft.differentialsSection.cards.map((x) =>
                                  x.id === card.id ? { ...x, colSpan: e.target.value as 'wide' | 'narrow' } : x
                                ),
                              },
                            })
                          }
                          className="h-7 px-2 text-xs border border-slate-200 rounded bg-white"
                        >
                          <option value="wide">Largura Ampla</option>
                          <option value="narrow">Largura Compacta</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            differentialsSection: {
                              ...draft.differentialsSection,
                              cards: draft.differentialsSection.cards.filter((x) => x.id !== card.id),
                            },
                          })
                        }
                        className="text-xs text-red-700 hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Card</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={card.tag}
                        placeholder="Etiqueta superior"
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            differentialsSection: {
                              ...draft.differentialsSection,
                              cards: draft.differentialsSection.cards.map((x) =>
                                x.id === card.id ? { ...x, tag: e.target.value } : x
                              ),
                            },
                          })
                        }
                        className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        value={card.footerNote}
                        placeholder="Nota de rodapé do card"
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            differentialsSection: {
                              ...draft.differentialsSection,
                              cards: draft.differentialsSection.cards.map((x) =>
                                x.id === card.id ? { ...x, footerNote: e.target.value } : x
                              ),
                            },
                          })
                        }
                        className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={card.title}
                      placeholder="Título do diferencial"
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          differentialsSection: {
                            ...draft.differentialsSection,
                            cards: draft.differentialsSection.cards.map((x) =>
                              x.id === card.id ? { ...x, title: e.target.value } : x
                            ),
                          },
                        })
                      }
                      className="w-full h-8 px-2.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                    />
                    <textarea
                      rows={2}
                      value={card.description}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          differentialsSection: {
                            ...draft.differentialsSection,
                            cards: draft.differentialsSection.cards.map((x) =>
                              x.id === card.id ? { ...x, description: e.target.value } : x
                            ),
                          },
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MÓDULOS INTERNOS */}
          {activeTab === 'modulos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Rótulo da Seção</label>
                  <input
                    type="text"
                    value={draft.modulesSection.eyebrow}
                    onChange={(e) =>
                      setDraft({ ...draft, modulesSection: { ...draft.modulesSection, eyebrow: e.target.value } })
                    }
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Título</label>
                  <input
                    type="text"
                    value={draft.modulesSection.title}
                    onChange={(e) =>
                      setDraft({ ...draft, modulesSection: { ...draft.modulesSection, title: e.target.value } })
                    }
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={draft.modulesSection.subtitle}
                  onChange={(e) =>
                    setDraft({ ...draft, modulesSection: { ...draft.modulesSection, subtitle: e.target.value } })
                  }
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              {draft.modulesSection.tabs.map((tab) => (
                <div key={tab.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-[#1B2E5E]">Aba: {tab.label}</div>
                    <button
                      type="button"
                      onClick={() => {
                        const newMod: LandingModuleItem = {
                          id: `mod-${Date.now()}`,
                          iconKey: 'sparkles',
                          name: 'Novo Módulo / Recurso',
                          summary: 'Resumo do que este recurso entrega para a empresa.',
                          bullets: ['Benefício operacional 1', 'Benefício gerencial 2'],
                        };
                        setDraft({
                          ...draft,
                          modulesSection: {
                            ...draft.modulesSection,
                            tabs: draft.modulesSection.tabs.map((t) =>
                              t.id === tab.id ? { ...t, items: [...t.items, newMod] } : t
                            ),
                          },
                        });
                      }}
                      className="px-2.5 py-1 bg-[#1B2E5E] text-white text-[11px] font-medium rounded-lg inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Incluir Módulo nesta Aba</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={tab.label}
                      placeholder="Nome da aba"
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          modulesSection: {
                            ...draft.modulesSection,
                            tabs: draft.modulesSection.tabs.map((t) =>
                              t.id === tab.id ? { ...t, label: e.target.value } : t
                            ),
                          },
                        })
                      }
                      className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      value={tab.title}
                      placeholder="Título da aba"
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          modulesSection: {
                            ...draft.modulesSection,
                            tabs: draft.modulesSection.tabs.map((t) =>
                              t.id === tab.id ? { ...t, title: e.target.value } : t
                            ),
                          },
                        })
                      }
                      className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      value={tab.subtitle}
                      placeholder="Subtítulo da aba"
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          modulesSection: {
                            ...draft.modulesSection,
                            tabs: draft.modulesSection.tabs.map((t) =>
                              t.id === tab.id ? { ...t, subtitle: e.target.value } : t
                            ),
                          },
                        })
                      }
                      className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div className="space-y-2.5">
                    {tab.items.map((mod) => (
                      <div key={mod.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={mod.name}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                modulesSection: {
                                  ...draft.modulesSection,
                                  tabs: draft.modulesSection.tabs.map((t) =>
                                    t.id === tab.id
                                      ? {
                                          ...t,
                                          items: t.items.map((m) =>
                                            m.id === mod.id ? { ...m, name: e.target.value } : m
                                          ),
                                        }
                                      : t
                                  ),
                                },
                              })
                            }
                            className="flex-1 h-8 px-2.5 text-xs font-bold border border-slate-200 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                modulesSection: {
                                  ...draft.modulesSection,
                                  tabs: draft.modulesSection.tabs.map((t) =>
                                    t.id === tab.id ? { ...t, items: t.items.filter((m) => m.id !== mod.id) } : t
                                  ),
                                },
                              })
                            }
                            className="px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={mod.summary}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              modulesSection: {
                                ...draft.modulesSection,
                                tabs: draft.modulesSection.tabs.map((t) =>
                                  t.id === tab.id
                                    ? {
                                        ...t,
                                        items: t.items.map((m) =>
                                          m.id === mod.id ? { ...m, summary: e.target.value } : m
                                        ),
                                      }
                                    : t
                                ),
                              },
                            })
                          }
                          className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-lg"
                        />
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Tópicos (um por linha)
                          </label>
                          <textarea
                            rows={3}
                            value={mod.bullets.join('\n')}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                modulesSection: {
                                  ...draft.modulesSection,
                                  tabs: draft.modulesSection.tabs.map((t) =>
                                    t.id === tab.id
                                      ? {
                                          ...t,
                                          items: t.items.map((m) =>
                                            m.id === mod.id
                                              ? {
                                                  ...m,
                                                  bullets: e.target.value
                                                    .split('\n')
                                                    .map((s) => s.trim())
                                                    .filter((s) => s.length > 0),
                                                }
                                              : m
                                          ),
                                        }
                                      : t
                                  ),
                                },
                              })
                            }
                            className="w-full p-2 text-xs border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: PÚBLICO & PORTFÓLIO */}
          {activeTab === 'publico' && (
            <div className="space-y-6">
              <div className="space-y-3.5">
                <h3 className="text-sm font-bold text-[#1B2E5E]">Seção 04: Para quem serve</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={draft.audienceSection.eyebrow}
                    onChange={(e) =>
                      setDraft({ ...draft, audienceSection: { ...draft.audienceSection, eyebrow: e.target.value } })
                    }
                    className="h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={draft.audienceSection.title}
                    onChange={(e) =>
                      setDraft({ ...draft, audienceSection: { ...draft.audienceSection, title: e.target.value } })
                    }
                    className="h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <textarea
                  rows={2}
                  value={draft.audienceSection.description}
                  onChange={(e) =>
                    setDraft({ ...draft, audienceSection: { ...draft.audienceSection, description: e.target.value } })
                  }
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
                />

                <ImageFieldControl
                  label="Imagem da Seção Para Quem Serve"
                  imageUrl={draft.audienceSection.imageUrl}
                  imageAlt={draft.audienceSection.imageAlt}
                  uploading={uploading}
                  onChangeUrl={(url) =>
                    setDraft({ ...draft, audienceSection: { ...draft.audienceSection, imageUrl: url } })
                  }
                  onChangeAlt={(alt) =>
                    setDraft({ ...draft, audienceSection: { ...draft.audienceSection, imageAlt: alt } })
                  }
                  onUploadFile={(file) =>
                    handleImageUpload(file, (url) =>
                      setDraft((prev) => ({ ...prev, audienceSection: { ...prev.audienceSection, imageUrl: url } }))
                    )
                  }
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-slate-700">Perfis / Público-Alvo</span>
                  <button
                    type="button"
                    onClick={() => {
                      const card: LandingAudienceCard = {
                        id: `aud-${Date.now()}`,
                        role: 'Novo Perfil de Usuário',
                        focus: 'Foco de atuação',
                        help: 'Como este setor utiliza a plataforma no dia a dia.',
                        footerNote: 'Acesso integrado com trilha de auditoria',
                      };
                      setDraft({
                        ...draft,
                        audienceSection: { ...draft.audienceSection, cards: [...draft.audienceSection.cards, card] },
                      });
                    }}
                    className="px-3 py-1.5 bg-[#1B2E5E] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Incluir Perfil</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {draft.audienceSection.cards.map((card) => (
                    <div key={card.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={card.role}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              audienceSection: {
                                ...draft.audienceSection,
                                cards: draft.audienceSection.cards.map((x) =>
                                  x.id === card.id ? { ...x, role: e.target.value } : x
                                ),
                              },
                            })
                          }
                          className="flex-1 h-8 px-2.5 text-xs font-bold border border-slate-200 rounded-lg bg-white mr-2"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              audienceSection: {
                                ...draft.audienceSection,
                                cards: draft.audienceSection.cards.filter((x) => x.id !== card.id),
                              },
                            })
                          }
                          className="text-xs text-red-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={card.focus}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            audienceSection: {
                              ...draft.audienceSection,
                              cards: draft.audienceSection.cards.map((x) =>
                                x.id === card.id ? { ...x, focus: e.target.value } : x
                              ),
                            },
                          })
                        }
                        className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                      <textarea
                        rows={3}
                        value={card.help}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            audienceSection: {
                              ...draft.audienceSection,
                              cards: draft.audienceSection.cards.map((x) =>
                                x.id === card.id ? { ...x, help: e.target.value } : x
                              ),
                            },
                          })
                        }
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1B2E5E]">Seção 05: Linhas do Portfólio</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const line: LandingPortfolioLine = {
                        id: `pl-${Date.now()}`,
                        name: 'Nova Linha de Equipamentos',
                        count: 1,
                        brands: 'Fabricante',
                        highlight: 'Equipamentos incluídos nesta linha.',
                      };
                      setDraft({
                        ...draft,
                        portfolioSection: {
                          ...draft.portfolioSection,
                          lines: [...draft.portfolioSection.lines, line],
                        },
                      });
                    }}
                    className="px-3 py-1.5 bg-[#1B2E5E] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Incluir Linha</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={draft.portfolioSection.title}
                    onChange={(e) =>
                      setDraft({ ...draft, portfolioSection: { ...draft.portfolioSection, title: e.target.value } })
                    }
                    className="h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={draft.portfolioSection.badgeLabel}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        portfolioSection: { ...draft.portfolioSection, badgeLabel: e.target.value },
                      })
                    }
                    className="h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {draft.portfolioSection.lines.map((line) => (
                    <div key={line.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={line.name}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              portfolioSection: {
                                ...draft.portfolioSection,
                                lines: draft.portfolioSection.lines.map((x) =>
                                  x.id === line.id ? { ...x, name: e.target.value } : x
                                ),
                              },
                            })
                          }
                          className="flex-1 h-8 px-2.5 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              portfolioSection: {
                                ...draft.portfolioSection,
                                lines: draft.portfolioSection.lines.filter((x) => x.id !== line.id),
                              },
                            })
                          }
                          className="text-xs text-red-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={line.brands}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              portfolioSection: {
                                ...draft.portfolioSection,
                                lines: draft.portfolioSection.lines.map((x) =>
                                  x.id === line.id ? { ...x, brands: e.target.value } : x
                                ),
                              },
                            })
                          }
                          placeholder="Fabricantes"
                          className="col-span-2 h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                        <input
                          type="number"
                          min={0}
                          value={line.count}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              portfolioSection: {
                                ...draft.portfolioSection,
                                lines: draft.portfolioSection.lines.map((x) =>
                                  x.id === line.id ? { ...x, count: Number(e.target.value || 0) } : x
                                ),
                              },
                            })
                          }
                          className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={line.highlight}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            portfolioSection: {
                              ...draft.portfolioSection,
                              lines: draft.portfolioSection.lines.map((x) =>
                                x.id === line.id ? { ...x, highlight: e.target.value } : x
                              ),
                            },
                          })
                        }
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TEXTOS & IMAGENS EXTRAS */}
          {activeTab === 'extras' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1B2E5E]">Blocos Livres de Texto e Imagem</h3>
                  <p className="text-xs text-slate-600">
                    Inclua quantos blocos adicionais quiser (novos textos, comunicados, fotos de equipamentos, casos de
                    sucesso ou banners) na Landing Page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const block: LandingCustomBlock = {
                      id: `blk-${Date.now()}`,
                      badge: 'Destaque Especial',
                      title: 'Novo Conteúdo Adicional',
                      text: 'Escreva aqui o texto completo que deseja exibir na Landing Page.',
                      imageUrl: '',
                      imageAlt: 'Imagem ilustrativa',
                      layout: 'text-left',
                    };
                    setDraft({ ...draft, customBlocks: [...draft.customBlocks, block] });
                  }}
                  className="px-3.5 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Incluir Novo Bloco (Texto + Imagem)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título da Seção Extra (exibida quando houver ao menos 1 bloco)
                </label>
                <input
                  type="text"
                  value={draft.customBlocksSectionTitle}
                  onChange={(e) => setDraft({ ...draft, customBlocksSectionTitle: e.target.value })}
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              {draft.customBlocks.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
                  Nenhum bloco extra incluído ainda. Clique em "Incluir Novo Bloco (Texto + Imagem)" acima para criar.
                </div>
              ) : (
                <div className="space-y-4">
                  {draft.customBlocks.map((blk, idx) => (
                    <div key={blk.id} className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-[#1B2E5E]">Bloco Adicional #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={blk.layout}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                customBlocks: draft.customBlocks.map((x) =>
                                  x.id === blk.id
                                    ? { ...x, layout: e.target.value as 'text-left' | 'text-right' | 'banner' }
                                    : x
                                ),
                              })
                            }
                            className="h-8 px-2 text-xs border border-slate-200 rounded-lg"
                          >
                            <option value="text-left">Texto à Esquerda + Imagem à Direita</option>
                            <option value="text-right">Imagem à Esquerda + Texto à Direita</option>
                            <option value="banner">Formato Banner Centralizado</option>
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                customBlocks: draft.customBlocks.filter((x) => x.id !== blk.id),
                              })
                            }
                            className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium rounded-lg inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir Bloco</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Etiqueta / Categoria</label>
                          <input
                            type="text"
                            value={blk.badge}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                customBlocks: draft.customBlocks.map((x) =>
                                  x.id === blk.id ? { ...x, badge: e.target.value } : x
                                ),
                              })
                            }
                            className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Título do Bloco</label>
                          <input
                            type="text"
                            value={blk.title}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                customBlocks: draft.customBlocks.map((x) =>
                                  x.id === blk.id ? { ...x, title: e.target.value } : x
                                ),
                              })
                            }
                            className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Texto do Bloco</label>
                        <textarea
                          rows={3}
                          value={blk.text}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              customBlocks: draft.customBlocks.map((x) =>
                                x.id === blk.id ? { ...x, text: e.target.value } : x
                              ),
                            })
                          }
                          className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
                        />
                      </div>

                      <ImageFieldControl
                        label={`Imagem do Bloco #${idx + 1}`}
                        imageUrl={blk.imageUrl}
                        imageAlt={blk.imageAlt}
                        uploading={uploading}
                        onChangeUrl={(url) =>
                          setDraft({
                            ...draft,
                            customBlocks: draft.customBlocks.map((x) => (x.id === blk.id ? { ...x, imageUrl: url } : x)),
                          })
                        }
                        onChangeAlt={(alt) =>
                          setDraft({
                            ...draft,
                            customBlocks: draft.customBlocks.map((x) => (x.id === blk.id ? { ...x, imageAlt: alt } : x)),
                          })
                        }
                        onUploadFile={(file) =>
                          handleImageUpload(file, (url) =>
                            setDraft((prev) => ({
                              ...prev,
                              customBlocks: prev.customBlocks.map((x) =>
                                x.id === blk.id ? { ...x, imageUrl: url } : x
                              ),
                            }))
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CTA FINAL & RODAPÉ */}
          {activeTab === 'rodape' && (
            <div className="space-y-5">
              <div className="space-y-3.5">
                <h3 className="text-sm font-bold text-[#1B2E5E]">Chamada Final (CTA)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Subtítulo CTA</label>
                    <input
                      type="text"
                      value={draft.ctaSection.eyebrow}
                      onChange={(e) =>
                        setDraft({ ...draft, ctaSection: { ...draft.ctaSection, eyebrow: e.target.value } })
                      }
                      className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Texto do Botão CTA</label>
                    <input
                      type="text"
                      value={draft.ctaSection.buttonLabel}
                      onChange={(e) =>
                        setDraft({ ...draft, ctaSection: { ...draft.ctaSection, buttonLabel: e.target.value } })
                      }
                      className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Título CTA</label>
                  <input
                    type="text"
                    value={draft.ctaSection.title}
                    onChange={(e) => setDraft({ ...draft, ctaSection: { ...draft.ctaSection, title: e.target.value } })}
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Descrição CTA</label>
                  <textarea
                    rows={2}
                    value={draft.ctaSection.description}
                    onChange={(e) =>
                      setDraft({ ...draft, ctaSection: { ...draft.ctaSection, description: e.target.value } })
                    }
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Observação abaixo do Botão</label>
                  <input
                    type="text"
                    value={draft.ctaSection.note}
                    onChange={(e) => setDraft({ ...draft, ctaSection: { ...draft.ctaSection, note: e.target.value } })}
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-3.5">
                <h3 className="text-sm font-bold text-[#1B2E5E]">Rodapé</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Identificação da Empresa</label>
                    <input
                      type="text"
                      value={draft.footer.brandLine}
                      onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, brandLine: e.target.value } })}
                      className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Créditos</label>
                    <input
                      type="text"
                      value={draft.footer.credits}
                      onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, credits: e.target.value } })}
                      className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Caso queira desfazer todas as personalizações e voltar aos textos e imagens iniciais:
                </div>
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="px-3 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Conteúdo Padrão</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-red-700">Confirmar restauração?</span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleResetDefaults}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Sim, Restaurar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            As alterações só ficam visíveis publicamente após clicar em <strong>Salvar Tudo no Banco</strong>.
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium rounded-lg"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={saving || uploading}
              onClick={handleSaveAll}
              className="px-5 py-2 bg-[#1B2E5E] hover:bg-[#14234A] disabled:opacity-60 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Salvando no Banco...' : 'Salvar Tudo no Banco'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
