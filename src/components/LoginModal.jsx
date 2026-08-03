import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo3DCrystal } from './Logo';
import { X, LogIn, UserPlus, Sparkles, Check, AlertCircle } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const { loginWithPassword, registerRequestUser, users } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('operador');
  const [newTitle, setNewTitle] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = loginWithPassword(identifier, password);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Erro ao realizar login.');
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = registerRequestUser({
      name: newName,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '')}@gestaoeletrica.com`,
      password: newPassword,
      role: newRole,
      title: newTitle || (newRole === 'admin' ? 'Engenheiro Eletricista' : 'Técnico de Campo')
    });
    if (res.success) {
      setRegSuccess(true);
    } else {
      setErrorMsg(res.error || 'Erro ao solicitar cadastro.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          position: 'relative',
          border: '1px solid var(--border-color)'
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '0.4rem' }}>
            <Logo3DCrystal size={44} showText={false} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            Gestão Elétrica <span style={{ color: '#00a3e0', fontSize: '0.65rem', padding: '1px 5px', background: 'rgba(0, 163, 224, 0.15)', borderRadius: '4px', border: '1px solid rgba(0, 163, 224, 0.3)' }}>3D</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Autenticação de Usuário e Acesso ao Sistema
          </p>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-main)',
          borderRadius: 'var(--radius-md)',
          padding: '3px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.25rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'login' ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === 'login' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            🔑 Entrar (Login)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'register' ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === 'register' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            👤 Criar Nova Conta
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            {loginError && (
              <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#f87171', fontSize: '0.775rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={15} />
                <span>{loginError}</span>
              </div>
            )}

            <div className="form-group">
              <label>E-mail ou Nome de Usuário *</label>
              <input 
                type="text" 
                required 
                placeholder="admin@omnifield.com ou Administrador Geral" 
                className="form-control" 
                value={loginIdentifier} 
                onChange={(e) => setLoginIdentifier(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label>Senha *</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                className="form-control" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.65rem' }}>
              <LogIn size={16} /> Acessar Conta
            </button>

          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Nome Completo *</label>
              <input type="text" required className="form-control" placeholder="Ex: Roberto Silva" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>

            <div className="form-group">
              <label>E-mail *</label>
              <input type="email" required className="form-control" placeholder="roberto@omnifield.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Senha *</label>
              <input type="password" required className="form-control" placeholder="Crie uma senha..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.65rem' }}>
              <UserPlus size={16} /> Criar Conta & Entrar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
