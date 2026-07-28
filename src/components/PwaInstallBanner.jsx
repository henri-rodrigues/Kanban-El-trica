import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check } from 'lucide-react';

export const PwaInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Para instalar no celular: Abra o menu do seu navegador (três pontinhos ou compartilhar) e selecione "Adicionar à Tela de Início".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !showBanner) {
    return (
      <button 
        onClick={handleInstallClick}
        className="btn btn-secondary btn-sm"
        title="Instalar Aplicativo OmniField Pro"
        style={{ fontSize: '0.75rem', gap: '0.3rem' }}
      >
        <Smartphone size={14} className="text-amber" />
        <span className="mobile-hide">Instalar App PWA</span>
      </button>
    );
  }

  return (
    <div 
      className="glass-panel animate-fade-in"
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9999,
        maxWidth: '380px',
        padding: '0.85rem 1.1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--accent-indigo)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        boxShadow: '0 12px 30px rgba(0,0,0,0.6)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
        <div style={{
          background: 'rgba(99, 102, 241, 0.2)',
          padding: '0.6rem',
          borderRadius: '12px',
          color: 'var(--accent-indigo)'
        }}>
          <Smartphone size={24} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '0.2rem' }}>
            Instalar OmniField Pro
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.7rem' }}>
            Adicione o app diretamente na tela inicial do seu celular para acesso rápido e offline no campo.
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleInstallClick} className="btn btn-primary btn-sm">
              <Download size={14} /> Instalar Agora
            </button>
            <button onClick={() => setShowBanner(false)} className="btn btn-secondary btn-sm">
              Agora não
            </button>
          </div>
        </div>

        <button 
          onClick={() => setShowBanner(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
