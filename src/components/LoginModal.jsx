import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Check, Sparkles, UserPlus, ShieldCheck, User } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const { currentUser, login, users, addUser, isAdmin } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('usuario');
  const [newTitle, setNewTitle] = useState('Técnico Operacional');

  if (!isOpen) return null;

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newName) return;
    const created = addUser({
      name: newName,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '')}@omnifield.com`,
      role: newRole,
      title: newTitle
    });
    login(created);
    setNewName('');
    setShowAddForm(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-blue)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
            color: '#fff'
          }}>
            ⚡
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Autenticação OmniField Pro
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Selecione uma conta ou cadastre um novo usuário
          </p>
        </div>

        {/* List of Users in Firebase */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
          {users.map((user) => {
            const isSelected = currentUser?.id === user.id;
            return (
              <div
                key={user.id}
                onClick={() => {
                  login(user);
                  onClose();
                }}
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: user.avatarColor,
                    border: `2px solid ${user.userColorTag}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}>
                    {user.name.charAt(0)}
                  </div>
                  
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {user.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                      <span className={`badge ${user.role === 'administrador' ? 'badge-purple' : 'badge-emerald'}`}>
                        {user.role === 'administrador' ? '🛡️ Administrador' : '👤 Usuário Operacional'}
                      </span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--accent-blue)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add User Toggle Button */}
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)} 
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
          >
            <UserPlus size={14} /> Cadastrar Novo Usuário
          </button>
        ) : (
          <form onSubmit={handleCreateUser} style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-blue)' }}>
              ➕ Cadastrar Novo Usuário no Banco de Dados
            </h4>

            <div className="form-group">
              <label>Nome Completo *</label>
              <input type="text" required className="form-control" placeholder="Ex: João Souza" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>

            <div className="form-group">
              <label>E-mail</label>
              <input type="email" className="form-control" placeholder="joao@omnifield.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group">
                <label>Perfil de Acesso</label>
                <select className="form-control" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="usuario">👤 Usuário Operacional</option>
                  <option value="administrador">🛡️ Administrador</option>
                </select>
              </div>

              <div className="form-group">
                <label>Cargo / Função</label>
                <input type="text" className="form-control" placeholder="Técnico HVAC" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Cancelar</button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Cadastrar</button>
            </div>
          </form>
        )}

        <div style={{
          padding: '0.65rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(2, 132, 199, 0.1)',
          border: '1px solid rgba(2, 132, 199, 0.2)',
          fontSize: '0.725rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <Sparkles size={14} className="text-blue" />
          <span>Usuários sincronizados em tempo real com o Firebase Firestore.</span>
        </div>
      </div>
    </div>
  );
};
