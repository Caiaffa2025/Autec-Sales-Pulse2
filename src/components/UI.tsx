import React from 'react';
import { Filter, RotateCcw, X } from 'lucide-react';
import type { Client, GlobalFilters, Product, User } from '../types';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#1B2E5E] tracking-tight">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  subtitle,
  tone = 'neutral',
  onClick,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger' | 'navy';
  onClick?: () => void;
}) {
  const valueToneClass =
    tone === 'positive'
      ? 'text-emerald-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : tone === 'danger'
          ? 'text-red-700'
          : tone === 'navy'
            ? 'text-[#1B2E5E]'
            : 'text-slate-900';

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-4 text-left transition-colors ${
        onClick ? 'hover:border-[#1B2E5E]/40 cursor-pointer' : ''
      }`}
    >
      <div className="text-xs font-medium text-slate-500 truncate">{label}</div>
      <div className={`text-xl md:text-2xl font-bold font-mono tabular-nums mt-1.5 ${valueToneClass}`}>
        {value}
      </div>
      {subtitle ? <div className="text-xs text-slate-500 mt-1 truncate">{subtitle}</div> : null}
    </Tag>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-10 text-center flex flex-col items-center justify-center">
      <div className="w-11 h-11 rounded-lg bg-slate-100 text-[#1B2E5E] flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-[#1B2E5E] hover:bg-[#14234A] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function GlobalFilterBar({
  filters,
  onChange,
  onReset,
  users,
  clients,
  products,
  situations,
  showSellerFilter = true,
  extraControls,
}: {
  filters: GlobalFilters;
  onChange: (next: GlobalFilters) => void;
  onReset: () => void;
  users: User[];
  clients: Client[];
  products: Product[];
  situations?: Array<{ value: string; label: string }>;
  showSellerFilter?: boolean;
  extraControls?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 md:p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B2E5E]">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros de Análise</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#1B2E5E] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Limpar filtros</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Data inicial</label>
          <input
            type="date"
            value={filters.dataInicio}
            onChange={(e) => onChange({ ...filters, dataInicio: e.target.value })}
            className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1B2E5E]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Data final</label>
          <input
            type="date"
            value={filters.dataFim}
            onChange={(e) => onChange({ ...filters, dataFim: e.target.value })}
            className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1B2E5E]"
          />
        </div>
        {showSellerFilter ? (
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Vendedor</label>
            <select
              value={filters.vendedorId}
              onChange={(e) => onChange({ ...filters, vendedorId: e.target.value })}
              className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1B2E5E]"
            >
              <option value="">Todos os vendedores</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Cliente</label>
          <select
            value={filters.clienteId}
            onChange={(e) => onChange({ ...filters, clienteId: e.target.value })}
            className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1B2E5E]"
          >
            <option value="">Todos os clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razao_social}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Produto Autec</label>
          <select
            value={filters.produtoId}
            onChange={(e) => onChange({ ...filters, produtoId: e.target.value })}
            className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1B2E5E]"
          >
            <option value="">Todos os produtos</option>
            <ProductSelectOptions products={products} />
          </select>
        </div>
        {situations ? (
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Situação</label>
            <select
              value={filters.situacao}
              onChange={(e) => onChange({ ...filters, situacao: e.target.value })}
              className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1B2E5E]"
            >
              <option value="">Todas as situações</option>
              {situations.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {extraControls}
      </div>
    </div>
  );
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[1px]">
      <div className={`bg-white border border-slate-200 rounded-xl w-full ${maxWidth} max-h-[90vh] flex flex-col shadow-lg`}>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-[#1B2E5E]">{title}</h2>
            {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function ProductSelectOptions({ products }: { products: Product[] }) {
  const categories = Array.from(new Set(products.map((p) => p.categoria)));
  return (
    <>
      {categories.map((cat) => (
        <optgroup key={cat} label={cat}>
          {products
            .filter((p) => p.categoria === cat)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome_equipamento}
              </option>
            ))}
        </optgroup>
      ))}
    </>
  );
}

