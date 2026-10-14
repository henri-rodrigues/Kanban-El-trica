import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Download, Search } from 'lucide-react';
import { carregarAuditoria } from '../services/auditoria';
import { baixar } from './dimensionamento/helpers';

const ACOES = { criou: 'Criou', alterou: 'Alterou', excluiu: 'Excluiu', aprovou: 'Aprovou', recusou: 'Recusou', exportou: 'Exportou' };
const TOM = { excluiu: 'var(--accent-rose)', alterou: 'var(--accent-amber)', criou: 'var(--accent-emerald)', aprovou: 'var(--accent-emerald)', recusou: 'var(--accent-rose)' };
const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '');

/** Lista do registro de auditoria (somente administradores). */
export const AuditoriaPainel = ({ obras = [] }) => {
  const [linhas, setLinhas] = useState(null);
  const [busca, setBusca] = useState('');
  const [acao, setAcao] = useState('todas');
  const [dias, setDias] = useState('90');

  const carregar = async () => {
    setLinhas(null);
    setLinhas(await carregarAuditoria(1000));
  };
  useEffect(() => { carregar(); }, []);

  const nomeObra = (id) => obras.find((o) => o.id === id)?.name || '';
  const termo = busca.trim().toLowerCase();
  const visiveis = useMemo(() => {
    if (!linhas) return [];
    const limite = dias === 'tudo' ? '' : new Date(Date.now() - Number(dias) * 86400000).toISOString();
    return linhas.filter((l) => {
      if (limite && (l.createdAt || '') < limite) return false;
      if (acao !== 'todas' && l.acao !== acao) return false;
      if (!termo) return true;
      return [l.autorNome, l.nome, l.entidade, nomeObra(l.obraId), l.detalhe].some((v) => String(v || '').toLowerCase().includes(termo));
    });
  }, [linhas, termo, acao, dias]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportar = () => {
    const cab = ['Data', 'Autor', 'Ação', 'Tipo', 'Item', 'Obra', 'Mudanças', 'Detalhe'];
    const out = visiveis.map((l) => [
      dataHora(l.createdAt), l.autorNome, ACOES[l.acao] || l.acao, l.entidade, l.nome || '', nomeObra(l.obraId),
      (l.mudancas || []).map((m) => `${m.campo}: ${m.de} → ${m.para}`).join(' | '), l.detalhe || ''
    ]);
    const csv = [cab, ...out].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    baixar(`auditoria-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + csv);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 30 }} placeholder="Buscar por pessoa, item ou obra…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <select className="form-control" style={{ width: 'auto' }} value={acao} onChange={(e) => setAcao(e.target.value)} aria-label="Ação">
          <option value="todas">Todas as ações</option>
          {Object.entries(ACOES).map(([id, r]) => <option key={id} value={id}>{r}</option>)}
        </select>
        <select className="form-control" style={{ width: 'auto' }} value={dias} onChange={(e) => setDias(e.target.value)} aria-label="Período">
          <option value="7">7 dias</option>
          <option value="30">30 dias</option>
          <option value="90">90 dias</option>
          <option value="tudo">Tudo</option>
        </select>
        <button type="button" className="btn btn-secondary btn-sm" onClick={carregar} title="Atualizar"><RefreshCw size={13} /></button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={exportar} disabled={!visiveis.length}><Download size={13} /> CSV</button>
      </div>

      {linhas === null ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>Carregando…</p>
      ) : visiveis.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>Nenhum registro no período.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '55vh', overflowY: 'auto' }}>
          {visiveis.map((l) => (
            <div key={l.id} style={{ border: '1px solid var(--border-color)', borderLeft: `4px solid ${TOM[l.acao] || 'var(--accent-blue)'}`, borderRadius: 'var(--radius-md)', padding: '0.5rem 0.7rem', background: 'var(--bg-card)', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
                <strong>{l.autorNome}</strong>
                <span style={{ color: TOM[l.acao], fontWeight: 700 }}>{(ACOES[l.acao] || l.acao).toLowerCase()}</span>
                <span>{l.entidade}</span>
                {l.nome && <span style={{ fontWeight: 600 }}>“{l.nome}”</span>}
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.72rem' }}>{dataHora(l.createdAt)}</span>
              </div>
              {l.obraId && nomeObra(l.obraId) && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Obra: {nomeObra(l.obraId)}</div>}
              {(l.mudancas || []).length > 0 && (
                <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                  {l.mudancas.map((m, i) => <li key={i}><b>{m.campo}</b>: {m.de} → {m.para}</li>)}
                </ul>
              )}
              {l.detalhe && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{l.detalhe}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
