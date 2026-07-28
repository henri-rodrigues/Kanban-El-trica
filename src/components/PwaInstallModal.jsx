import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, MoreVertical, PlusSquare, CheckCircle2, Sparkles } from 'lucide-react';

export const PwaInstallModal = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('Siga as instruções na tela para adicionar o atalho manualmente.');
    }
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
          maxWidth: '520px',
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

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--accent-blue)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.8rem',
            marginBottom: '0.5rem',
            boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
          }}>
            ⚡
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Criar Atalho na Tela do Celular (PWA)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Acesse o OmniField Pro direto da tela inicial do seu dispositivo como um aplicativo nativo.
          </p>
        </div>

        {/* Automatic One-click Install Button */}
        {deferredPrompt && !isInstalled && (
          <button 
            onClick={handleInstallClick} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem', justifyContent: 'center', fontSize: '0.9rem' }}
          >
            <Download size={18} /> Instalar Aplicativo com 1 Clique
          </button>
        )}

        {/* Visual Guides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Android Guide */}
          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🤖 No Android (Google Chrome)
            </h3>
            <ol style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
              <li>Toque nos <strong>três pontinhos <MoreVertical size={12} inline /></strong> no canto superior direito do navegador.</li>
              <li>Selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
              <li>Confirme em <strong>"Adicionar"</strong>. O ícone aparecerá na tela do seu celular!</li>
            </ol>
          </div>

          {/* iOS Guide */}
          <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🍏 No iPhone / iPad (Safari)
            </h3>
            <ol style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
              <li>Toque no botão <strong>Compartilhar <Share size={12} inline /></strong> na barra inferior do Safari.</li>
              <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início" <PlusSquare size={12} inline /></strong>.</li>
              <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
            </ol>
          </div>
        </div>

        <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
          Entendi, Fechar
        </button>
      </div>
    </div>
  );
};
