import React, { useMemo, useState } from 'react';
import { Check, X, Trash2, Edit3, Save, ShieldCheck, Clock, Search, Crown, Shield, User, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ADMIN_EMAIL } from '../services/firebase';
import { ModalShell } from './dimensionamento/ModalShell';
import { AuditoriaPainel } from './AuditoriaPainel';

const FILTROS = [
  ['todos', 'Todos'],
  ['administrador', 'Administradores'],
  ['usuario', 'Usuários']
];

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const UserManagementModal = ({ isOpen, onClose }) => {
  const { users, approveUser, rejectUser, updateUserProfileByAdmin, deleteUser, currentUser, isAdmin, isOwner } = useAuth();
  const { obras, cards } = useData();
  const ehDono = (u) => u.email?.trim().toLowerCase() === ADMIN_EMAIL;

  const [editingUserId, setEditingUserId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRole, setEditRole] = useState('usuario');
  const [editDailyRate, setEditDailyRate] = useState(250);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [aba, setAba] = useState('usuarios');

  // obras e horas apontadas por usuário
  const resumo = useMemo(() => {
    const mapa = {};
    users.forEach((u) => {
      const horas = cards.reduce(
        (s, c) => s + (c.workedDays || []).filter((w) => w.operatorId === u.id || w.operatorName === u.name).reduce((h, w) => h + (Number(w.hours) || 0), 0),
        0
      );
      mapa[u.id] = { obras: obras.filter((o) => (o.assignedUserIds || []).includes(u.id)).length, horas };
    });
    return mapa;
  }, [users, obras, cards]);

  if (!isOpen || !isAdmin) return null;

  const pendentes = users.filter((u) => u.status === 'pending_approval');
  const ativos = users.filter((u) => u.status !== 'pending_approval');
  const termo = busca.trim().toLowerCase();
  const visiveis = ativos
    .filter((u) => filtro === 'todos' || (filtro === 'administrador' ? u.role === 'administrador' : u.role !== 'administrador'))
    .filter((u) => !termo || u.name?.toLowerCase().includes(termo) || u.email?.toLowerCase().includes(termo) || u.title?.toLowerCase().includes(termo))
    .sort((a, b) => Number(ehDono(b)) - Number(ehDono(a)) || (a.name || '').localeCompare(b.name || ''));

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditTitle(user.title || 'Técnico Operacional');
    setEditRole(user.role || 'usuario');
    setEditDailyRate(user.dailyRate || 250);
  };

  const salvar = (userId) => {
    updateUserProfileByAdmin(userId, {
      title: editTitle,
      ...(isOwner ? { role: editRole } : {}),
      dailyRate: parseFloat(editDailyRate) || 0
    });
    setEditingUserId(null);
  };

  const alternarAdmin = (user) => {
    const virarAdmin = user.role !== 'administrador';
    const msg = virarAdmin
      ? `Tornar "${user.name}" administrador? A pessoa poderá gerenciar obras, valores e aprovar usuários.`
      : `Voltar "${user.name}" para usuário comum?`;
    if (window.confirm(msg)) updateUserProfileByAdmin(user.id, { role: virarAdmin ? 'administrador' : 'usuario' });
  };

  const excluir = (user) => {
    if (user.id === currentUser?.id) return window.alert('Você não pode excluir a própria conta enquanto estiver conectado.');
    if (window.confirm(`Excluir o usuário "${user.name}" (${user.email})? Esta ação não pode ser desfeita.`)) deleteUser(user.id);
  };

  const rotuloPerfil = (u) =>
    ehDono(u) ? [<Crown size={11} key="i" />, 'Dono do sistema', 'badge-amber']
      : u.role === 'administrador' ? [<Shield size={11} key="i" />, 'Administrador', 'badge-purple']
        : [<User size={11} key="i" />, 'Usuário', 'badge-emerald'];

  return (
    <ModalShell
      title="Gestão de usuários"
      subtitle="Aprove solicitações, defina cargos, diárias e perfis de acesso"
      onClose={onClose}
      maxWidth={720}
    >
      <div className="dq-tabs" role="tablist" style={{ marginBottom: '0.9rem' }}>
        {[['usuarios', `Usuários${pendentes.length ? ` (${pendentes.length} pendente${pendentes.length > 1 ? 's' : ''})` : ''}`], ['auditoria', 'Auditoria']].map(([id, rot]) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'active' : ''} onClick={() => setAba(id)}>{rot}</button>
        ))}
      </div>

      {aba === 'auditoria' ? <AuditoriaPainel obras={obras} /> : (<>
      {pendentes.length > 0 && (
        <div style={{ background: 'var(--wash-amber)', padding: '0.9rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Clock size={15} /> Solicitações de acesso ({pendentes.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendentes.map((u) => (
              <div key={u.id} style={{ padding: '0.6rem 0.7rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" onClick={() => approveUser(u.id)} className="btn btn-accent btn-sm"><Check size={14} /> Aceitar como usuário</button>
                  <button type="button" onClick={() => rejectUser(u.id)} className="btn btn-danger btn-sm"><X size={14} /> Recusar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
        <label style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 30 }} placeholder="Buscar por nome, e-mail ou cargo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }} role="group" aria-label="Perfil">
          {FILTROS.map(([id, rot]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltro(id)}
              style={{
                border: `1px solid ${filtro === id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                background: filtro === id ? 'var(--accent-blue)' : 'var(--bg-card)',
                color: filtro === id ? '#fff' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-pill)', padding: '0.28rem 0.75rem', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
              }}
            >{rot}</button>
          ))}
        </div>
      </div>

      <h4 style={{ fontSize: '0.86rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        Usuários ativos ({visiveis.length}{visiveis.length !== ativos.length ? ` de ${ativos.length}` : ''})
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {visiveis.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>Nenhum usuário encontrado.</p>}
        {visiveis.map((u) => {
          const editando = editingUserId === u.id;
          const [icone, rotulo, classe] = rotuloPerfil(u);
          const r = resumo[u.id] || { obras: 0, horas: 0 };
          return (
            <div key={u.id} style={{ padding: '0.8rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              {!editando ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.avatarColor || u.userColorTag || 'var(--accent-blue)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                      {(u.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {u.name}
                        <span className={`badge ${classe}`} style={{ fontSize: '0.64rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{icone} {rotulo}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{u.email}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: 2 }}>
                        <span>{u.title || 'Técnico'}</span>
                        <span>Diária <strong style={{ color: 'var(--accent-emerald)' }}>{brl(u.dailyRate)}</strong></span>
                        <span><Building2 size={11} style={{ verticalAlign: '-1px' }} /> {r.obras} obra(s)</span>
                        <span>{r.horas}h apontadas</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {isOwner && !ehDono(u) && (
                      <button type="button" onClick={() => alternarAdmin(u)} className={`btn btn-sm ${u.role === 'administrador' ? 'btn-secondary' : 'btn-primary'}`}>
                        <ShieldCheck size={14} /> {u.role === 'administrador' ? 'Tornar usuário' : 'Tornar administrador'}
                      </button>
                    )}
                    <button type="button" onClick={() => startEditing(u)} className="btn btn-secondary btn-sm"><Edit3 size={14} /> Editar</button>
                    {u.id !== currentUser?.id && !ehDono(u) && (isOwner || u.role !== 'administrador') && (
                      <button type="button" onClick={() => excluir(u)} className="btn btn-danger btn-sm" title="Excluir usuário"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--accent-blue)' }}>Editando {u.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Cargo / função</label>
                      <input type="text" className="form-control" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Perfil</label>
                      <select className="form-control" value={editRole} disabled={!isOwner || ehDono(u)} title={isOwner ? 'Defina quem é administrador' : 'Somente o dono do sistema define administradores'} onChange={(e) => setEditRole(e.target.value)}>
                        <option value="usuario">Usuário</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Diária (R$)</label>
                      <input type="number" step="10" min="0" className="form-control" value={editDailyRate} onChange={(e) => setEditDailyRate(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <button type="button" onClick={() => setEditingUserId(null)} className="btn btn-secondary btn-sm">Cancelar</button>
                    <button type="button" onClick={() => salvar(u.id)} className="btn btn-accent btn-sm"><Save size={14} /> Salvar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>)}
    </ModalShell>
  );
};
