import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Check, Sparkles } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const { currentUser, login, users } = useAuth();

  if (!isOpen) return null;

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
            Selecione uma conta de usuário
          </p>
        </div>

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
                  background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-main)',
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
                        {user.role === 'administrador' ? '🛡️ Admin' : '👤 Usuário'}
                      </span>
                      <span style={{ fontSize: '0.675rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        R$ {user.dailyRate}/dia
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

        <div style={{
          padding: '0.65rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(37, 99, 235, 0.1)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          fontSize: '0.725rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <Sparkles size={14} className="text-blue" />
          <span>Login persistente mantido no navegador via PWA.</span>
        </div>
      </div>
    </div>
  );
};
