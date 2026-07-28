import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { POSTIT_GRADIENTS } from '../constants/gradients';
import { X, Check, Trash2, Edit3, Save, ShieldCheck, UserCheck, Clock, ShieldAlert, DollarSign } from 'lucide-react';

export const UserManagementModal = ({ isOpen, onClose }) => {
  const { users, approveUser, rejectUser, updateUserProfileByAdmin, isAdmin } = useAuth();

  const [editingUserId, setEditingUserId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRole, setEditRole] = useState('usuario');
  const [editDailyRate, setEditDailyRate] = useState(250);

  if (!isOpen || !isAdmin) return null;

  const pendingUsers = users.filter(u => u.status === 'pending_approval');
  const approvedUsers = users.filter(u => u.status !== 'pending_approval');

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditTitle(user.title || 'Técnico Operacional');
    setEditRole(user.role || 'usuario');
    setEditDailyRate(user.dailyRate || 250);
  };

  const handleSaveProfile = (userId) => {
    updateUserProfileByAdmin(userId, {
      title: editTitle,
      role: editRole,
      dailyRate: parseFloat(editDailyRate) || 0
    });
    setEditingUserId(null);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '650px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          position: 'relative'
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Gestão de Usuários & Aprovação (Admin)</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aprove solicitações e defina cargos e salários/diárias</p>
          </div>
        </div>

        {/* Pending Approval Section */}
        {pendingUsers.length > 0 && (
          <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(217, 119, 6, 0.3)', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} /> Solicitações de Cadastro Pendentes ({pendingUsers.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pendingUsers.map(u => (
                <div key={u.id} style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => approveUser(u.id)} className="btn btn-accent btn-sm">
                      <Check size={14} /> Aprovar
                    </button>
                    <button onClick={() => rejectUser(u.id)} className="btn btn-danger btn-sm">
                      <X size={14} /> Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Users & Profile Editor */}
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            👥 Usuários Ativos no Sistema ({approvedUsers.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {approvedUsers.map(u => {
              const isEditing = editingUserId === u.id;

              return (
                <div key={u.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                  {!isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: u.avatarColor || 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                          {u.name.charAt(0)}
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            Cargo: <strong style={{ color: 'var(--text-secondary)' }}>{u.title || 'Técnico'}</strong> | Diária: <strong style={{ color: 'var(--accent-emerald)' }}>R$ {u.dailyRate || 0}/dia</strong>
                          </div>
                          <span className={`badge ${u.role === 'administrador' ? 'badge-purple' : 'badge-emerald'}`} style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                            {u.role === 'administrador' ? '🛡️ Administrador' : '👤 Usuário'}
                          </span>
                        </div>
                      </div>

                      <button onClick={() => startEditing(u)} className="btn btn-secondary btn-sm">
                        <Edit3 size={14} /> Editar Perfil
                      </button>
                    </div>
                  ) : (
                    /* Edit Form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-blue)' }}>
                        Editando Perfil de {u.name}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Cargo / Função</label>
                          <input type="text" className="form-control" style={{ fontSize: '0.775rem' }} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Perfil</label>
                          <select className="form-control" style={{ fontSize: '0.775rem' }} value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                            <option value="usuario">👤 Usuário</option>
                            <option value="administrador">🛡️ Administrador</option>
                          </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Diária (R$)</label>
                          <input type="number" step="10" className="form-control" style={{ fontSize: '0.775rem' }} value={editDailyRate} onChange={(e) => setEditDailyRate(e.target.value)} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.4rem' }}>
                        <button onClick={() => setEditingUserId(null)} className="btn btn-secondary btn-sm">Cancelar</button>
                        <button onClick={() => handleSaveProfile(u.id)} className="btn btn-accent btn-sm"><Save size={14} /> Salvar Perfil</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
