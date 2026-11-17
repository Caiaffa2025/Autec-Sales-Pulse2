import React, { useState } from 'react';
import type { Client } from '../types';
import { api } from '../utils/api';
import { Modal } from './UI';

export function QuickClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
}) {
  const [razao, setRazao] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [segmento, setSegmento] = useState('Indústria Farmacêutica');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [contatoEmail, setContatoEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!razao.trim()) {
      setError('Informe a razão social ou nome do cliente.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await api.createClient({
        razao_social: razao.trim(),
        cnpj: cnpj.trim(),
        segmento,
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        contato_nome: contatoNome.trim(),
        contato_email: contatoEmail.trim(),
      });
      setRazao('');
      setCnpj('');
      setCidade('');
      setUf('');
      setContatoNome('');
      setContatoEmail('');
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar cliente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cadastrar Novo Cliente"
      subtitle="Adicione o laboratório ou empresa cliente para vincular imediatamente aos registros."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error ? (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
        ) : null}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Razão Social / Laboratório *</label>
          <input
            type="text"
            value={razao}
            onChange={(e) => setRazao(e.target.value)}
            placeholder="Ex.: Laboratório Analítico Paulista Ltda"
            className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">CNPJ (opcional)</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Segmento</label>
            <input
              type="text"
              value={segmento}
              onChange={(e) => setSegmento(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Cidade</label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">UF</label>
            <input
              type="text"
              maxLength={2}
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              placeholder="SP"
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg uppercase focus:outline-none focus:border-[#1B2E5E]"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Contato Principal</label>
            <input
              type="text"
              value={contatoNome}
              onChange={(e) => setContatoNome(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">E-mail do Contato</label>
            <input
              type="email"
              value={contatoEmail}
              onChange={(e) => setContatoEmail(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B2E5E]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-white bg-[#1B2E5E] hover:bg-[#14234A] rounded-lg"
          >
            {saving ? 'Cadastrando...' : 'Cadastrar Cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
