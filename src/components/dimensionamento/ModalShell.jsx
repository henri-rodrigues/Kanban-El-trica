import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Janela modal no padrão visual do app (fecha no clique fora ou com Esc). */
export const ModalShell = ({ title, subtitle, onClose, children, maxWidth = 640 }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="mobile-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.18s var(--ease)'
      }}
    >
      <div
        className="glass-panel mobile-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.4rem',
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideUp 0.22s var(--ease)'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="btn btn-ghost btn-sm"
          style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: '0.3rem' }}
        >
          <X size={18} />
        </button>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, paddingRight: '2rem' }}>{title}</h3>
        {subtitle && <p className="dq-sub" style={{ margin: '0.2rem 0 1rem' }}>{subtitle}</p>}
        {!subtitle && <div style={{ height: '0.9rem' }} />}
        {children}
      </div>
    </div>,
    document.body
  );
};
