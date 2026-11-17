import React, { useState } from 'react';
import { ArrowLeft, FlaskConical, Lock, Mail, ShieldCheck } from 'lucide-react';
import type { User } from '../types';
import { api, setStoredToken } from '../utils/api';

const QUICK_ACCOUNTS = [
  { label: 'Administrador', email: 'admin@autec.com.br', desc: 'Acesso total, usuários e motivos' },
  { label: 'Gestor Comercial', email: 'gestor@autec.com.br', desc: 'Cockpit, equipe e relatórios' },
  { label: 'Vendedor · Carlos Silva', email: 'carlos.silva@autec.com.br', desc: 'Visão individual de carteira' },
  { label: 'Vendedor · Mariana Costa', email: 'mariana.costa@autec.com.br', desc: 'Visão individual de carteira' },
];

export function LoginPage({
  onLogin,
  onBackToLanding,
}: {
  onLogin: (user: User) => void;
  onBackToLanding?: () => void;
}) {
  const [email, setEmail] = useState('admin@autec.com.br');
  const [password, setPassword] = useState('Autec@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function doLogin(targetEmail: string, targetPass: string) {
    setLoading(true);
    setError('');
    try {
      const res = await api.login(targetEmail, targetPass);
      setStoredToken(res.token);
      onLogin(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void doLogin(email, password);
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="lg:col-span-5 bg-[#1B2E5E] text-white p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight leading-tight">Autec Sales Pulse</div>
                <div className="text-xs text-slate-300">Smart Sales Engine</div>
              </div>
            </div>
            <h1 className="text-xl font-bold leading-snug mb-3">
              Inteligência comercial para equipamentos de laboratório
            </h1>
            <p className="text-xs text-slate-200 leading-relaxed">
              Plataforma integrada de argumentação técnica, funil de vendas, radar competitivo, análise de perdas comerciais, performance e planos de ação executáveis.
            </p>
          </div>
          <div className="pt-8 border-t border-white/15 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-white">Autec Equipamentos de Laboratório</div>
            <div>Desenvolvido por Agência STC Mobile</div>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-center">
          {onBackToLanding ? (
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1B2E5E] mb-4 w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para apresentação da plataforma</span>
            </button>
          ) : null}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#1B2E5E]">Acessar Plataforma</h2>
            <p className="text-xs text-slate-500 mt-1">
              Entre com suas credenciais corporativas ou selecione um perfil de acesso para homologação.
            </p>
          </div>

          {error ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">E-mail corporativo</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Autenticando...' : 'Entrar no Autec Sales Pulse'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1B2E5E]" />
              <span>Acesso rápido por perfil (Senha padrão: Autec@2026)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Autec@2026');
                    void doLogin(acc.email, 'Autec@2026');
                  }}
                  className="p-2.5 text-left border border-slate-200 hover:border-[#1B2E5E] rounded-lg transition-colors"
                >
                  <div className="text-xs font-semibold text-[#1B2E5E]">{acc.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
