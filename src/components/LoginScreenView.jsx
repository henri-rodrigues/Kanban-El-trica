import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo3DCrystal } from './Logo';
import { POSTIT_GRADIENTS } from '../constants/gradients';
import { LogIn, UserPlus, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, Palette } from 'lucide-react';

export const LoginScreenView = () => {
  const { loginWithPassword, resetPassword, registerRequestUser, cloudEnabled } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginInfo, setLoginInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const [regMessage, setRegMessage] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGradientId, setRegGradientId] = useState('cyan');
  const [regSuccessMsg, setRegSuccessMsg] = useState(false);
  const [regError, setRegError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginInfo('');
    setBusy(true);
    try {
      const res = await loginWithPassword(identifier, password);
      if (!res.success) {
        setLoginError(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    setLoginError('');
    setLoginInfo('');
    const res = await resetPassword(identifier);
    if (res.success) setLoginInfo(res.message);
    else setLoginError(res.message);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regPassword) return;
    setRegError('');
    setRegSuccessMsg(false);
    setBusy(true);
    try {
      const res = await registerRequestUser({
        name: regName,
        email: regEmail.trim(),
        password: regPassword,
        gradientId: regGradientId
      });
      if (res.success) {
        setRegMessage(res.message);
        setRegSuccessMsg(true);
        setRegName('');
        setRegEmail('');
        setRegPassword('');
      } else {
        setRegError(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(1200px 600px at 50% -10%, var(--wash-blue), transparent), var(--bg-app)',
      padding: '1.5rem'
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <Logo3DCrystal size={75} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Gestão Elétrica <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>3D</span>
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
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--wash-rose)', color: 'var(--accent-rose)', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}
            {loginInfo && (
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--wash-emerald)', color: 'var(--accent-emerald)', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} />
                <span>{loginInfo}</span>
              </div>
            )}

            <div className="form-group">
              <label>E-mail *</label>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="seu e-mail"
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
                autoComplete="current-password"
                placeholder="••••••••"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.7rem', fontSize: '0.9rem' }}>
              <LogIn size={16} /> {busy ? 'Aguarde…' : 'Acessar Sistema'}
            </button>

            {cloudEnabled && (
              <button type="button" onClick={handleForgot} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                Esqueci minha senha
              </button>
            )}
          </form>
        )}

        {/* Register Request Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister}>
            {regError && (
              <div style={{ padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--wash-rose)', color: 'var(--accent-rose)', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{regError}</span>
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
              <input type="password" required minLength={6} autoComplete="new-password" className="form-control" placeholder="mínimo 6 caracteres" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
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

            <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', padding: '0.7rem', fontSize: '0.9rem' }}>
              <UserPlus size={16} /> {busy ? 'Enviando…' : 'Criar cadastro e solicitar acesso'}
            </button>

            {regSuccessMsg && (
              <div style={{ padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--wash-emerald)', color: 'var(--accent-emerald)', fontSize: '0.8rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>{regMessage}</span>
              </div>
            )}


          </form>
        )}
      </div>
    </div>
  );
};
