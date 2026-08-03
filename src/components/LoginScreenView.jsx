import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo3DCrystal } from './Logo';
import { POSTIT_GRADIENTS } from '../constants/gradients';
import { LogIn, UserPlus, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, Palette } from 'lucide-react';

export const LoginScreenView = () => {
  const { loginWithPassword, registerRequestUser, users } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGradientId, setRegGradientId] = useState('cyan');
  const [regSuccessMsg, setRegSuccessMsg] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const res = loginWithPassword(identifier, password);
    if (!res.success) {
      setLoginError(res.message);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!regName || !regPassword) return;
    registerRequestUser({
      name: regName,
      email: regEmail || `${regName.toLowerCase().replace(/\s+/g, '')}@omnifield.com`,
      password: regPassword,
      gradientId: regGradientId
    });

    setRegSuccessMsg(true);
    setRegName('');
    setRegEmail('');
    setRegPassword('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000000',
      padding: '1.5rem'
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.9)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <Logo3DCrystal size={75} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Gestão Elétrica <span style={{ color: '#00a3e0', fontSize: '0.75rem', padding: '1px 6px', background: 'rgba(0, 163, 224, 0.15)', borderRadius: '4px', border: '1px solid rgba(0, 163, 224, 0.3)' }}>3D</span>
          </h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            Comissionamento & Gestão Corporativa de Obras
          </p>
        </div>

        {/* Tab Buttons */}
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
            onClick={() => { setActiveTab('login'); setRegSuccessMsg(false); setLoginError(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.825rem',
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
            onClick={() => { setActiveTab('register'); setRegSuccessMsg(false); setLoginError(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'register' ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === 'register' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            📝 Solicitar Cadastro
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin}>
            {loginError && (
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <div className="form-group">
              <label>E-mail ou Usuário *</label>
              <input 
                type="text" 
                required 
                placeholder="admin@omnifield.com ou operador@omnifield.com" 
                className="form-control" 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label>Senha *</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                className="form-control" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.7rem', fontSize: '0.9rem' }}>
              <LogIn size={16} /> Acessar Sistema
            </button>

          </form>
        )}

        {/* Register Request Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister}>
            {regSuccessMsg && (
              <div style={{ padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(5, 150, 105, 0.15)', border: '1px solid rgba(5, 150, 105, 0.3)', color: '#34d399', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>Solicitação de cadastro enviada com sucesso! Aguarde a aprovação do Administrador.</span>
              </div>
            )}

            <div className="form-group">
              <label>Nome Completo *</label>
              <input type="text" required className="form-control" placeholder="Ex: Roberto Silva" value={regName} onChange={(e) => setRegName(e.target.value)} />
            </div>

            <div className="form-group">
              <label>E-mail *</label>
              <input type="email" required className="form-control" placeholder="roberto@omnifield.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Crie uma Senha *</label>
              <input type="password" required className="form-control" placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
            </div>

            {/* Custom Creative Gradient Choice for Post-its */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Palette size={14} className="text-amber" /> Escolha o seu Tema de Gradiente Criativo para os Post-its
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.25rem' }}>
                {POSTIT_GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setRegGradientId(g.id)}
                    style={{
                      padding: '0.4rem',
                      borderRadius: '6px',
                      border: regGradientId === g.id ? '2px solid #ffffff' : '1px solid var(--border-color)',
                      background: g.gradient,
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: regGradientId === g.id ? '0 0 10px rgba(255,255,255,0.4)' : 'none'
                    }}
                  >
                    {g.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', padding: '0.7rem', fontSize: '0.9rem' }}>
              <UserPlus size={16} /> Enviar Solicitação para Aprovação
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
