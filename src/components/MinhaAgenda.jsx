import React, { useMemo, useState } from 'react';
import {
  CalendarCheck, Plane, ListTodo, Bell, Flame, Clock, Building2, Check, ArrowRight, Car
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CardDetailModal } from './CardDetailModal';
import { hojeIso } from './diario/utils';
import { dataHora } from './dimensionamento/helpers';
import './escala/escala.css';

const ROT_COLUNA = { todo: 'A fazer', in_progress: 'Em andamento', on_hold: 'Em espera', completed: 'Concluído' };
const dataBr = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const nomesDe = (t) => (t.userNames?.length ? t.userNames : [t.userName || 'Equipe']);
const idsDe = (t) => t.userIds || (t.userId ? [t.userId] : []);
const somaDias = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * Minha agenda: visão pessoal de todas as obras — viagens próximas, tarefas atribuídas e avisos.
 */
export const MinhaAgenda = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { obras, cards, myNotifications, markNotificationAsRead, setSelectedObraId } = useData();
  const [cardAberto, setCardAberto] = useState(null);

  const hoje = hojeIso();
  const limite = somaDias(hoje, 14);

  const viagens = useMemo(
    () =>
      obras
        .flatMap((o) => (o.scheduledTrips || []).map((t) => ({ ...t, obraId: o.id, obraName: o.name })))
        .filter((t) => currentUser && idsDe(t).includes(currentUser.id) && t.endDate >= hoje)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [obras, currentUser, hoje]
  );
  const proximas = viagens.filter((t) => t.startDate <= limite);

  const obrasIds = useMemo(() => new Set(obras.map((o) => o.id)), [obras]);
  const tarefas = useMemo(
    () =>
      cards
        .filter((c) => currentUser && c.assignedUserId === currentUser.id && c.column !== 'completed' && obrasIds.has(c.obraId))
        .sort((a, b) => {
          const pa = a.priority === 'Alta' || a.priority === 'Crítica' ? 0 : 1;
          const pb = b.priority === 'Alta' || b.priority === 'Crítica' ? 0 : 1;
          return pa - pb;
        }),
    [cards, currentUser, obrasIds]
  );
  const porObra = useMemo(() => {
    const mapa = new Map();
    tarefas.forEach((c) => {
      const obra = obras.find((o) => o.id === c.obraId);
      if (!mapa.has(c.obraId)) mapa.set(c.obraId, { obra, itens: [] });
      mapa.get(c.obraId).itens.push(c);
    });
    return [...mapa.values()];
  }, [tarefas, obras]);
  const altas = tarefas.filter((c) => c.priority === 'Alta' || c.priority === 'Crítica').length;

  const avisos = (myNotifications || []).slice(0, 6);
  const naoLidos = (myNotifications || []).filter((n) => !n.read).length;

  const abrirTarefa = (c) => {
    if (c.obraId) setSelectedObraId(c.obraId);
    setCardAberto(c);
  };

  return (
    <div className="es-wrap">
      <div className="es-topo">
        <div>
          <h2><CalendarCheck size={20} /> Minha agenda</h2>
          <span className="es-dica">Olá, {currentUser?.name?.split(' ')[0] || 'bem-vindo'} · tudo o que é seu, em todas as obras</span>
        </div>
        <span className="es-espaco" />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate?.('agenda')}>
          <Plane size={14} /> Calendário de viagens
        </button>
      </div>

      <div className="es-kpis">
        <div className="es-kpi"><span>Viagens (14 dias)</span><strong>{proximas.length}</strong><small>{viagens.length} no total à frente</small></div>
        <div className="es-kpi"><span>Tarefas abertas</span><strong>{tarefas.length}</strong><small>em {porObra.length} obra(s)</small></div>
        <div className={`es-kpi ${altas ? 'amber' : ''}`}><span>Prioridade alta</span><strong>{altas}</strong><small>pedem atenção</small></div>
        <div className="es-kpi"><span>Avisos novos</span><strong>{naoLidos}</strong><small>não lidos</small></div>
      </div>

      <div className="es-grade">
        <div className="es-card">
          <h3><ListTodo size={15} style={{ verticalAlign: '-2px' }} /> Minhas tarefas</h3>
          {porObra.length === 0 ? (
            <div className="es-vazio"><Check size={26} /><span>Nenhuma tarefa aberta atribuída a você.</span></div>
          ) : (
            <div className="es-lista" style={{ maxHeight: 'none' }}>
              {porObra.map(({ obra, itens }) => (
                <React.Fragment key={obra?.id}>
                  <div className="es-grupo-titulo"><Building2 size={11} /> {obra?.name} · {itens.length}</div>
                  {itens.map((c) => {
                    const alta = c.priority === 'Alta' || c.priority === 'Crítica';
                    const subs = c.subtasks || [];
                    return (
                      <button key={c.id} type="button" className={`es-viagem ${alta ? 'duplo' : ''}`} onClick={() => abrirTarefa(c)}>
                        <strong>{alta && <Flame size={12} style={{ color: 'var(--accent-amber)', marginRight: 4 }} />}{c.title}</strong>
                        <small>
                          {ROT_COLUNA[c.column] || c.column}
                          {subs.length ? ` · ${subs.filter((s) => s.completed).length}/${subs.length} subtarefas` : ''}
                          {c.categoryTag ? ` · ${c.categoryTag}` : ''}
                        </small>
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="es-card">
            <h3><Plane size={15} style={{ verticalAlign: '-2px' }} /> Próximas viagens</h3>
            {viagens.length === 0 ? (
              <div className="es-vazio"><Plane size={26} /><span>Nenhuma viagem agendada para você.</span></div>
            ) : (
              <div className="es-lista">
                {viagens.slice(0, 5).map((t) => {
                  const emAndamento = t.startDate <= hoje;
                  return (
                    <div key={t.id} className="es-viagem pessoal" style={{ cursor: 'default' }}>
                      <strong>
                        {dataBr(t.startDate)}{t.endDate !== t.startDate ? ` → ${dataBr(t.endDate)}` : ''}
                        {emAndamento && <span className="es-selo andamento" style={{ marginLeft: 6 }}>em andamento</span>}
                      </strong>
                      <small>{t.obraName} · <Car size={11} style={{ verticalAlign: '-1px' }} /> {t.isDoubleCar ? '2 carros' : '1 carro'}</small>
                      <small>Equipe: {nomesDe(t).map((n) => n.split(' ')[0]).join(', ')}</small>
                    </div>
                  );
                })}
                {viagens.length > 5 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate?.('agenda')}>
                    Ver todas ({viagens.length}) <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="es-card">
            <h3><Bell size={15} style={{ verticalAlign: '-2px' }} /> Avisos recentes</h3>
            {avisos.length === 0 ? (
              <span className="es-dica">Nenhum aviso por aqui.</span>
            ) : (
              <div className="es-lista">
                {avisos.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`es-viagem ${n.read ? 'passada' : ''}`}
                    onClick={() => !n.read && markNotificationAsRead(n.id)}
                    title={n.read ? '' : 'Marcar como lido'}
                  >
                    <strong>{n.title}</strong>
                    <small>{n.message}</small>
                    <small><Clock size={10} style={{ verticalAlign: '-1px' }} /> {dataHora(n.createdAt)}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CardDetailModal
        card={cards.find((c) => c.id === cardAberto?.id) || cardAberto}
        isOpen={!!cardAberto}
        onClose={() => setCardAberto(null)}
      />
    </div>
  );
};
