import React, { useMemo, useState } from 'react';
import {
  TrendingUp, CalendarClock, ListChecks, Wallet, AlertTriangle, ChevronUp, ChevronDown,
  PauseCircle, Flame, UserX, Package, ClipboardCheck, Plane, Users, PartyPopper
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import './ObraResumo.css';

import { Valor, useFormatoValor } from './Valor';
const brl = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const hojeZerado = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const paraData = (iso) => {
  if (!iso) return null;
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return null;
  return new Date(a, m - 1, d);
};

const fmtData = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const CHAVE_OCULTO = 'omnifield_resumo_oculto';

/** Resumo da obra (ou do quadro) mostrado acima do Kanban. */
export const ObraResumo = ({ obra, cards, quadroNome, filtroAtivo, onFiltrar, onNavigate }) => {
  const { isAdmin, users, currentUser } = useAuth();
  const { purchaseOrders, laudos, getObraLaborCostsAndDays, getCardEvolutionPct } = useData();

  const [oculto, setOculto] = useState(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_OCULTO);
      if (salvo !== null) return salvo === '1';
    } catch { /* sem storage */ }
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });

  const alternar = () => {
    setOculto((o) => {
      try { localStorage.setItem(CHAVE_OCULTO, o ? '0' : '1'); } catch { /* sem storage */ }
      return !o;
    });
  };

  const noEscopoDaObra = !quadroNome;

  const r = useMemo(() => {
    const total = cards.length;
    const porColuna = { todo: 0, in_progress: 0, on_hold: 0, completed: 0 };
    cards.forEach((c) => { porColuna[c.column] = (porColuna[c.column] || 0) + 1; });

    const progresso = total
      ? Math.round(cards.reduce((s, c) => s + getCardEvolutionPct(c.column), 0) / total)
      : (noEscopoDaObra ? obra.progress || 0 : 0);

    // Prazo
    const inicio = paraData(obra.startDate);
    const prazo = Number(obra.plannedDays) || 0;
    let diasDecorridos = null;
    let prazoPct = null;
    if (inicio && prazo > 0) {
      diasDecorridos = Math.max(0, Math.round((hojeZerado() - inicio) / 86400000));
      prazoPct = Math.min(100, Math.round((diasDecorridos / prazo) * 100));
    }

    // Financeiro (somente administrador)
    let fin = null;
    if (isAdmin && noEscopoDaObra) {
      const trab = getObraLaborCostsAndDays(obra.id);
      const orcado = Number(obra.initialBudget) || 0;
      const gasto = (Number(obra.materialCosts) || 0) + (Number(obra.infraSpentCost) || 0) + (trab.totalLaborCost || 0);
      fin = { orcado, gasto, pct: orcado ? Math.round((gasto / orcado) * 100) : 0 };
    }

    // Pendências
    const abertos = cards.filter((c) => c.column !== 'completed');
    const pend = {
      bloqueados: porColuna.on_hold,
      prioridade: abertos.filter((c) => c.priority === 'Alta' || c.priority === 'Crítica').length,
      semResponsavel: abertos.filter((c) => !c.assignedUserId).length
    };

    const pos = purchaseOrders.filter((p) => p.obraId === obra.id);
    const itensPendentes = pos.reduce(
      (s, p) => s + (p.items || []).filter((i) => i.status !== 'Já Chegou').length, 0
    );
    // Não conformidades abertas = as do laudo mais recente de cada quadro.
    const ultimoPorQuadro = new Map();
    laudos
      .filter((l) => l.obraId === obra.id)
      .sort((a, b) => (b.dataHora ?? '').localeCompare(a.dataHora ?? ''))
      .forEach((l) => {
        const chave = l.quadroId ?? l.quadroNome;
        if (!ultimoPorQuadro.has(chave)) ultimoPorQuadro.set(chave, l);
      });
    const checksPendentes = [...ultimoPorQuadro.values()].reduce((n, l) => n + (l.estatisticas?.naoConformes ?? 0), 0);

    const hoje = hojeZerado();
    const proximaViagem = (obra.scheduledTrips || [])
      .map((t) => ({ ...t, fim: paraData(t.endDate), ini: paraData(t.startDate) }))
      .filter((t) => t.ini && t.fim && t.fim >= hoje)
      .sort((a, b) => a.ini - b.ini)[0] || null;

    // Equipe: quem tem post-its na obra (e, no escopo da obra, os convidados)
    const membros = new Map();
    cards.forEach((c) => {
      if (!c.assignedUserId) return;
      const u = users.find((x) => x.id === c.assignedUserId);
      const m = membros.get(c.assignedUserId) || { id: c.assignedUserId, nome: u?.name || c.assignedUserName || 'Operador', abertos: 0 };
      if (c.column !== 'completed') m.abertos += 1;
      membros.set(c.assignedUserId, m);
    });
    if (noEscopoDaObra) {
      (obra.assignedUserIds || []).forEach((id) => {
        if (membros.has(id)) return;
        const u = users.find((x) => x.id === id);
        if (u) membros.set(id, { id, nome: u.name, abertos: 0 });
      });
    }

    return {
      total, porColuna, progresso, diasDecorridos, prazo, prazoPct, fin, pend,
      itensPendentes, checksPendentes, proximaViagem, equipe: [...membros.values()]
    };
  }, [cards, obra, purchaseOrders, laudos, users, isAdmin, noEscopoDaObra, getObraLaborCostsAndDays, getCardEvolutionPct]);

  const alertas = [];
  if (r.pend.bloqueados > 0) alertas.push({ id: 'bloqueados', Icone: PauseCircle, rotulo: 'Em espera / bloqueados', valor: r.pend.bloqueados, tom: 'amber', filtro: 'bloqueados' });
  if (r.pend.prioridade > 0) alertas.push({ id: 'prioridade', Icone: Flame, rotulo: 'Prioridade alta em aberto', valor: r.pend.prioridade, tom: 'rose', filtro: 'prioridade' });
  if (r.pend.semResponsavel > 0) alertas.push({ id: 'sem_responsavel', Icone: UserX, rotulo: 'Sem responsável', valor: r.pend.semResponsavel, tom: 'blue', filtro: 'sem_responsavel' });
  if (noEscopoDaObra && isAdmin && r.itensPendentes > 0) {
    alertas.push({ id: 'materiais', Icone: Package, rotulo: 'Materiais ainda não chegaram', valor: r.itensPendentes, tom: 'amber', aba: 'materials' });
  }
  if (noEscopoDaObra && r.checksPendentes > 0) {
    alertas.push({ id: 'checklists', Icone: ClipboardCheck, rotulo: 'Não conformidades no checklist', valor: r.checksPendentes, tom: 'blue', aba: 'checklist' });
  }

  const avisoPrazo =
    r.prazoPct !== null && r.total > 0 && r.prazoPct - r.progresso >= 15;
  const avisoFin = r.fin && r.fin.pct - r.progresso >= 15 && r.fin.gasto > 0;

  return (
    <section className="ov-wrap" aria-label="Resumo da obra">
      <div className="ov-cab">
        <h3>{quadroNome ? `Resumo do quadro ${quadroNome}` : 'Resumo da obra'}</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={alternar} aria-expanded={!oculto}>
          {oculto ? <><ChevronDown size={14} /> Mostrar resumo</> : <><ChevronUp size={14} /> Ocultar</>}
        </button>
      </div>

      {!oculto && (
        <>
          <div className="ov-grid">
            <div className="ov-kpi">
              <div className="ov-kpi-topo"><TrendingUp size={15} /> Progresso</div>
              <strong>{r.progresso}%</strong>
              <div className="ov-barra"><i style={{ width: `${r.progresso}%` }} /></div>
              <small>média da evolução dos post-its</small>
            </div>

            {noEscopoDaObra && r.prazoPct !== null && (
              <div className={`ov-kpi ${avisoPrazo ? 'ov-risco' : ''}`}>
                <div className="ov-kpi-topo"><CalendarClock size={15} /> Prazo</div>
                <strong>Dia {r.diasDecorridos} <span>de {r.prazo}</span></strong>
                <div className="ov-barra"><i className="ov-barra-prazo" style={{ width: `${r.prazoPct}%` }} /></div>
                <small>
                  {r.diasDecorridos > r.prazo
                    ? `${r.diasDecorridos - r.prazo} dia(s) além do prazo`
                    : `${r.prazo - r.diasDecorridos} dia(s) restantes`}
                  {avisoPrazo ? ' · progresso abaixo do tempo' : ''}
                </small>
              </div>
            )}

            <div className="ov-kpi">
              <div className="ov-kpi-topo"><ListChecks size={15} /> Post-its</div>
              <strong>{r.porColuna.completed}<span>/{r.total} concluídos</span></strong>
              <div className="ov-mini">
                <span><b>{r.porColuna.todo}</b> a fazer</span>
                <span><b>{r.porColuna.in_progress}</b> andamento</span>
                <span><b>{r.porColuna.on_hold}</b> espera</span>
              </div>
            </div>

            {r.fin && (
              <div className={`ov-kpi ${avisoFin ? 'ov-risco' : ''}`}>
                <div className="ov-kpi-topo"><Wallet size={15} /> Orçamento</div>
                <strong><Valor v={r.fin.gasto} /> <span>de <Valor v={r.fin.orcado} /></span></strong>
                <div className="ov-barra"><i className={r.fin.pct > 100 ? 'ov-barra-estouro' : 'ov-barra-fin'} style={{ width: `${Math.min(100, r.fin.pct)}%` }} /></div>
                <small>{r.fin.pct}% consumido{avisoFin ? ' · gasto acima do progresso' : ''}</small>
              </div>
            )}
          </div>

          <div className="ov-linha">
            <div className="ov-bloco">
              <div className="ov-bloco-titulo"><AlertTriangle size={14} /> Atenção</div>
              {alertas.length === 0 ? (
                <p className="ov-vazio"><PartyPopper size={14} /> Nenhuma pendência no momento.</p>
              ) : (
                <div className="ov-alertas">
                  {alertas.map((a) => {
                    const ativo = a.filtro && filtroAtivo === a.filtro;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`ov-alerta ov-${a.tom} ${ativo ? 'ov-ativo' : ''}`}
                        onClick={() => (a.filtro ? onFiltrar(ativo ? 'todos' : a.filtro) : onNavigate?.(a.aba))}
                        title={a.filtro ? 'Filtrar o quadro' : 'Abrir'}
                      >
                        <a.Icone size={14} />
                        <span>{a.rotulo}</span>
                        <b>{a.valor}</b>
                      </button>
                    );
                  })}
                </div>
              )}

              {noEscopoDaObra && r.proximaViagem && (
                <button type="button" className="ov-viagem" onClick={() => onNavigate?.('agenda')}>
                  <Plane size={14} />
                  <span>
                    Próxima viagem: <b>{fmtData(r.proximaViagem.ini)} a {fmtData(r.proximaViagem.fim)}</b>
                    {r.proximaViagem.userNames?.length ? ` · ${r.proximaViagem.userNames.join(', ')}` : ''}
                  </span>
                </button>
              )}
            </div>

            <div className="ov-bloco">
              <div className="ov-bloco-titulo"><Users size={14} /> Equipe com post-its</div>
              {r.equipe.length === 0 ? (
                <p className="ov-vazio">Ninguém atribuído ainda.</p>
              ) : (
                <div className="ov-equipe">
                  {r.equipe.map((m) => (
                    <span key={m.id} className={`ov-pessoa ${m.id === currentUser?.id ? 'ov-eu' : ''}`}>
                      <i>{m.nome.charAt(0).toUpperCase()}</i>
                      {m.nome.split(' ')[0]}
                      <b>{m.abertos}</b>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};
