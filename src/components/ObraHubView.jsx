import React, { useMemo, useState } from 'react';
import {
  Building2, Plus, ArrowRight, MapPin, Users, Trash2, Edit3, Search, Plane, Flame, Package, Layers, DatabaseBackup
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { hojeIso } from './diario/utils';
import './obras/hub.css';

import { Valor, useFormatoValor } from './Valor';
const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const dataBr = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const tomVerba = (pct) => (pct > 100 ? 'rose' : pct > 85 ? 'amber' : '');

export const ObraHubView = ({ onSelectObra, onOpenObraModal }) => {
  const { isAdmin } = useAuth();
  const { obras, quadros, cards, purchaseOrders, getObraLaborCostsAndDays, deleteObra, exportarObra } = useData();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('todos');

  const hoje = hojeIso();

  const linhas = useMemo(
    () =>
      obras.map((obra) => {
        const qtdQuadros = quadros.filter((q) => q.obraId === obra.id).length;
        const { totalLaborCost, daysSpent } = getObraLaborCostsAndDays(obra.id);
        const pos = purchaseOrders.filter((p) => p.obraId === obra.id);
        const gastoMat = pos.reduce((s, p) => s + (parseFloat(p.totalValue) || 0), 0);
        const gastoViagens = (obra.scheduledTrips || []).reduce((s, t) => s + (parseFloat(t.cost) || 0), 0);
        const gasto = totalLaborCost + gastoMat + gastoViagens;
        const somaVerbas =
          (Number(obra.materialsBudget) || 0) + (Number(obra.indirectsBudget) || 0) +
          (Number(obra.infraBudget) || 0) + (Number(obra.laborBudget) || 0);
        const verba = somaVerbas || (Number(obra.initialBudget) || 0) + (Number(obra.addedBudget) || 0);
        const itensPendentes = pos.reduce((s, p) => s + (p.items || []).filter((i) => i.status !== 'Já Chegou').length, 0);
        const altas = cards.filter(
          (c) => c.obraId === obra.id && c.column !== 'completed' && (c.priority === 'Alta' || c.priority === 'Crítica')
        ).length;
        const proxima = (obra.scheduledTrips || [])
          .filter((t) => t.endDate >= hoje)
          .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
        return {
          obra, qtdQuadros, daysSpent, gasto, verba, itensPendentes, altas, proxima,
          pctVerba: verba ? Math.round((gasto / verba) * 100) : 0
        };
      }),
    [obras, quadros, cards, purchaseOrders, getObraLaborCostsAndDays, hoje]
  );

  const statusLista = [...new Set(obras.map((o) => o.status || 'Em Andamento'))];
  const termo = busca.trim().toLowerCase();
  const visiveis = linhas.filter(({ obra }) => {
    if (status !== 'todos' && (obra.status || 'Em Andamento') !== status) return false;
    if (!termo) return true;
    return [obra.name, obra.client, obra.code, obra.location].some((v) => v?.toLowerCase().includes(termo));
  });

  const resumo = {
    total: obras.length,
    andamento: obras.filter((o) => (o.status || 'Em Andamento') === 'Em Andamento').length,
    avanco: obras.length ? Math.round(obras.reduce((s, o) => s + (o.progress || 0), 0) / obras.length) : 0,
    verba: linhas.reduce((s, l) => s + l.verba, 0),
    gasto: linhas.reduce((s, l) => s + l.gasto, 0)
  };

  return (
    <div className="hb-wrap">
      <div className="hb-topo">
        <div>
          <h2><Building2 size={20} /> Obras</h2>
          <span className="hb-dica">
            {isAdmin
              ? 'Selecione uma obra para trabalhar nela ou cadastre uma nova.'
              : 'Selecione uma das obras atribuídas a você.'}
          </span>
        </div>
        <span className="hb-espaco" />
        {isAdmin && (
          <button type="button" onClick={() => onOpenObraModal('obra')} className="btn btn-primary">
            <Plus size={16} /> Nova obra
          </button>
        )}
      </div>

      {obras.length > 0 && (
        <div className="hb-kpis">
          <div className="hb-kpi"><span>Obras</span><strong>{resumo.total}</strong><small>{resumo.andamento} em andamento</small></div>
          <div className="hb-kpi"><span>Avanço médio</span><strong>{resumo.avanco}%</strong><small>das obras visíveis</small></div>
          {isAdmin && (
            <>
              <div className="hb-kpi"><span>Verba total</span><strong><Valor v={resumo.verba} /></strong><small>soma das obras</small></div>
              <div className="hb-kpi">
                <span>Gasto até agora</span><strong><Valor v={resumo.gasto} /></strong>
                <small>{resumo.verba ? `${Math.round((resumo.gasto / resumo.verba) * 100)}% da verba` : 'sem verba definida'}</small>
              </div>
            </>
          )}
        </div>
      )}

      {obras.length > 1 && (
        <div className="hb-filtros">
          <label className="hb-busca">
            <Search size={14} />
            <input className="form-control" placeholder="Buscar obra, cliente, código ou cidade…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          {statusLista.length > 1 && (
            <div className="hb-chips" role="group" aria-label="Situação">
              <button type="button" className={`hb-chip ${status === 'todos' ? 'ativo' : ''}`} onClick={() => setStatus('todos')}>Todas</button>
              {statusLista.map((s) => (
                <button key={s} type="button" className={`hb-chip ${status === s ? 'ativo' : ''}`} onClick={() => setStatus(s)}>{s}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {obras.length === 0 ? (
        <div className="hb-vazio">
          <Building2 size={40} />
          <h3>{isAdmin ? 'Nenhuma obra cadastrada' : 'Nenhuma obra liberada'}</h3>
          <p>
            {isAdmin
              ? 'Comece cadastrando a primeira obra para gerenciar quadros, post-its e comissionamento.'
              : 'Aguarde o administrador vincular você às obras do projeto.'}
          </p>
          {isAdmin && (
            <button type="button" onClick={() => onOpenObraModal('obra')} className="btn btn-primary">
              <Plus size={16} /> Cadastrar primeira obra
            </button>
          )}
        </div>
      ) : visiveis.length === 0 ? (
        <p className="hb-dica" style={{ textAlign: 'center', padding: '1.5rem' }}>Nenhuma obra encontrada com esses filtros.</p>
      ) : (
        <div className="hb-grade">
          {visiveis.map(({ obra, qtdQuadros, daysSpent, gasto, verba, itensPendentes, altas, proxima, pctVerba }) => (
            <article
              key={obra.id}
              className="hb-obra"
              role="button"
              tabIndex={0}
              onClick={() => onSelectObra(obra.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectObra(obra.id)}
            >
              <div className="hb-obra-topo">
                <span className="hb-codigo" title={obra.code || 'OBRA'}>{obra.code || 'OBRA'}</span>
                <span className="hb-status">{obra.status || 'Em Andamento'}</span>
              </div>

              <h3>{obra.name}</h3>

              <div className="hb-meta">
                {obra.client && <span><Building2 size={12} /> {obra.client}</span>}
                {obra.location && <span><MapPin size={12} /> {obra.location}{obra.distanceKm ? ` · ${obra.distanceKm} km` : ''}</span>}
                <span><Users size={12} /> {obra.assignedUserIds?.length || 0} participante(s)</span>
              </div>

              <div>
                <div className="hb-prog-linha">
                  <span><Layers size={12} /> {qtdQuadros} quadro(s) · {daysSpent} dia(s)</span>
                  <strong>{obra.progress || 0}%</strong>
                </div>
                <div className="hb-barra"><i style={{ width: `${obra.progress || 0}%` }} /></div>
              </div>

              {isAdmin && verba > 0 && (
                <div>
                  <div className="hb-prog-linha">
                    <span><Valor v={gasto} /> de <Valor v={verba} /></span>
                    <strong className={`hb-${tomVerba(pctVerba) || 'ok'}`}>{pctVerba}%</strong>
                  </div>
                  <div className={`hb-barra ${tomVerba(pctVerba)}`}><i style={{ width: `${Math.min(100, pctVerba)}%` }} /></div>
                </div>
              )}

              {(altas > 0 || (isAdmin && itensPendentes > 0) || proxima) && (
                <div className="hb-sinais">
                  {altas > 0 && <span className="hb-sinal rose"><Flame size={11} /> {altas} prioridade alta</span>}
                  {isAdmin && itensPendentes > 0 && <span className="hb-sinal amber"><Package size={11} /> {itensPendentes} item(ns) a receber</span>}
                  {proxima && <span className="hb-sinal blue"><Plane size={11} /> viagem {dataBr(proxima.startDate).slice(0, 5)}</span>}
                </div>
              )}

              <div className="hb-acoes">
                <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  Abrir obra <ArrowRight size={14} />
                </button>
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      title="Editar dados, verbas e participantes"
                      onClick={(e) => { e.stopPropagation(); onOpenObraModal('edit_obra', obra); }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      title="Baixar backup completo da obra (JSON)"
                      onClick={(e) => { e.stopPropagation(); exportarObra(obra.id); }}
                    >
                      <DatabaseBackup size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      title="Excluir obra"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Excluir a obra "${obra.name}"?\nTodos os quadros, post-its e orçamentos vinculados serão apagados.`)) deleteObra(obra.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
