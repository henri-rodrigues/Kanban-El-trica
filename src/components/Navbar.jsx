import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PwaInstallBanner } from './PwaInstallBanner';
import { 
  Building2, 
  Sun, 
  Moon, 
  ChevronDown, 
  Plus, 
  UserCheck,
  Globe,
  Grid
} from 'lucide-react';

export const Navbar = ({ onOpenObraModal, onOpenLoginModal, onOpenFirebaseModal, onGoToHub }) => {
  const { currentUser, switchRole, theme, toggleTheme, isAdmin } = useAuth();
  const { obras, selectedObraId, setSelectedObraId, activeObra } = useData();
  const [showObraDropdown, setShowObraDropdown] = useState(false);

  return (
    <header className="glass-panel" style={{
      height: '56px',
      padding: '0 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--border-color)'
    }}>
      {/* Left: Brand & Hub Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          onClick={onGoToHub}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          title="Ir para Vitrine de Obras (Tela Inicial)"
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1rem'
          }}>
            ⚡
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            OmniField <span style={{ color: 'var(--accent-blue)', fontSize: '0.7rem', padding: '1px 5px', background: 'rgba(2, 132, 199, 0.15)', borderRadius: '4px', border: '1px solid rgba(2, 132, 199, 0.3)' }}>PRO</span>
          </div>
        </button>

        {/* Hub Button */}
        <button onClick={onGoToHub} className="btn btn-secondary btn-sm" style={{ gap: '0.3rem' }}>
          <Grid size={13} />
          <span>Vitrine de Obras</span>
        </button>

        {/* Active Obra Dropdown Selector */}
        {obras.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowObraDropdown(!showObraDropdown)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
            >
              <Building2 size={13} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontWeight: 600, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.775rem' }}>
                {activeObra?.name || 'Selecione uma Obra'}
              </span>
              <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
            </button>

            {showObraDropdown && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  width: '240px',
                  zIndex: 200,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.4rem'
                }}
              >
                <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.3rem 0.5rem', textTransform: 'uppercase' }}>
                  Obras Cadastradas
                </div>
                {obras.map(obra => (
                  <div
                    key={obra.id}
                    onClick={() => {
                      setSelectedObraId(obra.id);
                      setShowObraDropdown(false);
                    }}
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.775rem',
                      background: obra.id === selectedObraId ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                      color: obra.id === selectedObraId ? 'var(--accent-blue)' : 'var(--text-primary)',
                      fontWeight: obra.id === selectedObraId ? 600 : 400,
                      marginBottom: '2px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{obra.name}</span>
                    <span className="badge badge-emerald">{obra.progress || 0}%</span>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.3rem', paddingTop: '0.3rem' }}>
                  <button
                    onClick={() => {
                      setShowObraDropdown(false);
                      onOpenObraModal('obra');
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Plus size={13} /> Nova Obra
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* GitHub Pages & Cloud Backup Modal trigger */}
        <button
          onClick={onOpenFirebaseModal}
          className="btn btn-secondary btn-sm"
          title="Backup JSON & Cloud Firebase"
        >
          <Globe size={14} className="text-blue" />
          <span className="mobile-hide">Backup / Firebase</span>
        </button>

        {/* Role Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-main)',
          borderRadius: 'var(--radius-md)',
          padding: '2px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => switchRole('administrador')}
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: isAdmin ? 'var(--accent-blue)' : 'transparent',
              color: isAdmin ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            Admin
          </button>
          <button
            onClick={() => switchRole('usuario')}
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: !isAdmin ? 'var(--accent-emerald)' : 'transparent',
              color: !isAdmin ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            Usuário
          </button>
        </div>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem' }}>
          {theme === 'dark' ? <Sun size={15} className="text-amber" /> : <Moon size={15} />}
        </button>

        {/* Current User Badge */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div 
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: currentUser.avatarColor || 'var(--accent-blue)',
                border: `2px solid ${currentUser.userColorTag || '#fff'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            >
              {currentUser.name.charAt(0)}
            </div>

            <button onClick={onOpenLoginModal} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem' }}>
              <UserCheck size={13} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
