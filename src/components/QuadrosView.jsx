import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Layers, Plus, Building, CheckCircle2, Clock, MapPin, Tag, Trash2 } from 'lucide-react';

export const QuadrosView = ({ onOpenObraModal, setActiveTab }) => {
  const { isAdmin } = useAuth();
  const { activeObra, activeQuadros, setSelectedQuadroId, selectedQuadroId, deleteQuadro, cards } = useData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.4rem'
          }}>
            <Layers size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-purple">Subníveis Técnicos</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeObra?.name}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.15rem' }}>
              Gestão de Quadros e Painéis de Comissionamento
            </h2>
          </div>
        </div>

        {isAdmin && (
          <button onClick={() => onOpenObraModal('quadro')} className="btn btn-primary btn-sm">
            <Plus size={15} /> Adicionar Novo Quadro
          </button>
        )}
      </div>

      {/* Grid of Quadros */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '1.25rem'
      }}>
        {activeQuadros.map((quadro) => (
          <div
            key={quadro.id}
            className="glass-panel"
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
              border: selectedQuadroId === quadro.id ? '2px solid var(--accent-indigo)' : '1px solid var(--border-color)',
              background: selectedQuadroId === quadro.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--glass-bg)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="badge badge-blue">
                  <Tag size={12} /> {quadro.category}
                </span>
                <span className="badge badge-emerald">
                  {quadro.status}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {quadro.name}
              </h3>

              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
                {quadro.description}
              </p>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} className="text-amber" />
                <span>{quadro.location}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
              <button
                onClick={() => {
                  setSelectedQuadroId(quadro.id);
                  if (setActiveTab) setActiveTab('kanban');
                }}
                className="btn btn-primary btn-sm"
                style={{ flex: 1, justifyContent: 'center', fontWeight: 700 }}
              >
                ⚡ Ver Post-its do Quadro ({cards.filter(c => c.quadroId === quadro.id).length})
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja EXCLUIR o quadro "${quadro.name}"?\nEsta ação excluirá todos os post-its vinculados.`)) {
                      deleteQuadro(quadro.id);
                    }
                  }}
                  className="btn btn-danger btn-sm"
                  title="Excluir Quadro"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
