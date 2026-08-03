import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Logo3DCrystal } from './Logo';
import { 
  Building2, 
  Sun, 
  Moon, 
  ChevronDown, 
  Plus, 
  Grid,
  Smartphone,
  LogOut,
  ShieldCheck,
  Bell,
  MessageSquare,
  Check,
  Trash2,
  Menu
} from 'lucide-react';

export const Navbar = ({ 
  onOpenObraModal, 
  onOpenUserManagementModal, 
  onOpenPwaModal, 
  onGoToHub,
  onOpenChatModal,
  onToggleMobileDrawer
}) => {
  const { currentUser, logout, theme, toggleTheme, isAdmin, users } = useAuth();
  const { 
    obras, 
    selectedObraId, 
    setSelectedObraId, 
    activeObra,
    myNotifications,
    unreadNotifsCount,
    markNotificationAsRead,
    clearAllNotifications 
  } = useData();

  const [showObraDropdown, setShowObraDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const pendingApprovalsCount = users.filter(u => u.status === 'pending_approval').length;

  return (
    <header className="glass-panel navbar-mobile" style={{
      height: '56px',
      padding: '0 0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--border-color)'
    }}>
      {/* Left: Hamburger (Mobile) + Brand Logo & Hub Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
        {/* Hamburger Menu Toggle (Mobile Only) */}
        <button
          onClick={onToggleMobileDrawer}
          className="btn btn-secondary btn-sm mobile-show"
          style={{ padding: '0.35rem', display: 'none' }}
          title="Abrir Menu de Navegação"
        >
          <Menu size={18} style={{ color: 'var(--accent-blue)' }} />
        </button>

        <button 
          onClick={onGoToHub}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 }}
          title="Ir para Vitrine de Obras"
        >
          <Logo3DCrystal size={26} showText={false} />
        </button>

        {/* Hub Button — hidden text on mobile */}
        <button onClick={onGoToHub} className="btn btn-secondary btn-sm mobile-hide" style={{ gap: '0.3rem' }}>
          <Grid size={13} />
          <span className="navbar-brand-text">Vitrine de Obras</span>
        </button>

        {/* Active Obra Dropdown Selector */}
        {obras.length > 0 && (
          <div style={{ position: 'relative', minWidth: 0 }}>
            <button
              onClick={() => setShowObraDropdown(!showObraDropdown)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-main)', borderColor: 'var(--border-color)', maxWidth: '160px', overflow: 'hidden' }}
            >
              <Building2 size={13} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                {activeObra?.name || 'Selecione'}
              </span>
              <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>

            {showObraDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div 
                  onClick={() => setShowObraDropdown(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                />
                <div 
                  className="glass-panel obra-dropdown-mobile"
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
                        padding: '0.5rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
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

                  {isAdmin && (
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
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
        {/* Live Obra Chat Trigger Button */}
        {activeObra && (
          <button
            onClick={onOpenChatModal}
            className="btn btn-secondary btn-sm"
            title={`Abrir Chat da Obra (${activeObra.name})`}
            style={{ gap: '0.3rem', borderColor: 'var(--accent-blue)', padding: '0.35rem 0.5rem' }}
          >
            <MessageSquare size={14} className="text-blue" />
            <span className="mobile-hide">Chat Obra</span>
          </button>
        )}

        {/* Notification Bell Center */}
        {currentUser && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.35rem 0.5rem', position: 'relative' }}
              title="Notificações & Menções"
            >
              <Bell size={15} style={{ color: unreadNotifsCount > 0 ? 'var(--accent-rose, #f43f5e)' : 'var(--text-secondary)' }} />
              {unreadNotifsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--accent-rose, #f43f5e)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '17px',
                  height: '17px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(244, 63, 94, 0.5)'
                }}>
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <>
                <div 
                  onClick={() => setShowNotifDropdown(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 299 }}
                />
                <div 
                  className="glass-panel notif-dropdown-mobile"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 300,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Bell size={14} className="text-amber" /> Central de Notificações
                    </div>
                    {myNotifications.length > 0 && (
                      <button 
                        onClick={clearAllNotifications}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Trash2 size={12} /> Limpar
                      </button>
                    )}
                  </div>

                  {myNotifications.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {myNotifications.map(n => (
                        <div 
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.obraId) setSelectedObraId(n.obraId);
                            setShowNotifDropdown(false);
                          }}
                          style={{
                            padding: '0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            background: n.read ? 'var(--bg-main)' : 'rgba(2, 132, 199, 0.1)',
                            borderLeft: n.read ? '3px solid transparent' : '3px solid var(--accent-blue)',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.775rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                            {n.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                      Nenhuma notificação recebida no momento.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Admin User Management Button */}
        {isAdmin && (
          <button
            onClick={onOpenUserManagementModal}
            className="btn btn-secondary btn-sm"
            style={{ position: 'relative', padding: '0.35rem 0.5rem' }}
            title="Aprovação e Gestão de Usuários (Admin)"
          >
            <ShieldCheck size={14} className="text-blue" />
            <span className="mobile-hide">Gestão Usuários</span>
            {pendingApprovalsCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--accent-amber)', color: '#000', fontSize: '0.65rem', fontWeight: 800, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        )}

        {/* PWA App Shortcut modal trigger — hidden on mobile (available in bottom nav) */}
        <button
          onClick={onOpenPwaModal}
          className="btn btn-secondary btn-sm mobile-hide"
          title="Criar Atalho na Tela de Início do Celular"
        >
          <Smartphone size={14} className="text-emerald" />
          <span className="mobile-hide">Atalho Celular</span>
        </button>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem' }}>
          {theme === 'dark' ? <Sun size={15} className="text-amber" /> : <Moon size={15} />}
        </button>

        {/* Current User & Logout */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div 
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: currentUser.avatarColor || 'var(--accent-blue)',
                border: `2px solid ${currentUser.userColorTag || '#fff'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.7rem',
                flexShrink: 0
              }}
              title={`${currentUser.name} (${currentUser.role})`}
            >
              {currentUser.name.charAt(0)}
            </div>

            <button 
              onClick={logout} 
              className="btn btn-danger btn-sm" 
              style={{ padding: '0.35rem 0.5rem' }} 
              title="Sair / Logout"
            >
              <LogOut size={13} />
              <span className="mobile-hide">Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
