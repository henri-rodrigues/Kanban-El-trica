import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Kanban, 
  Layers, 
  CheckSquare, 
  BarChart3, 
  Plus, 
  Lock,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, onOpenObraModal }) => {
  const { isAdmin } = useAuth();
  const { activeObra, activeQuadros, selectedQuadroId, setSelectedQuadroId } = useData();

  return (
    <aside className="glass-panel" style={{
      width: '240px',
      height: 'calc(100vh - 56px)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border-color)',
      padding: '0.85rem 0.65rem',
      flexShrink: 0
    }}>
      {/* Obra Summary Header */}
      <div style={{
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-main)',
        border: '1px solid var(--border-color)',
        marginBottom: '1rem'
      }}>
        <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
          Obra Ativa
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeObra?.name || 'Nenhuma Obra'}
        </div>

        {activeObra ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Progresso</span>
              <span className="badge badge-emerald">{activeObra?.progress || 0}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', marginTop: '0.35rem', overflow: 'hidden' }}>
              <div style={{ width: `${activeObra?.progress || 0}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #0284c7)' }} />
            </div>
          </>
        ) : (
          isAdmin && (
            <button onClick={() => onOpenObraModal('obra')} className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: '0.75rem', padding: '0.25rem' }}>
              <Plus size={13} /> Criar Obra (Admin)
            </button>
          )
        )}
      </div>

      {/* Primary Nav Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 0.4rem 0.2rem' }}>
          Navegação
        </div>

        <button
          onClick={() => setActiveTab('kanban')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: activeTab === 'kanban' ? 600 : 400,
            background: activeTab === 'kanban' ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
            color: activeTab === 'kanban' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            textAlign: 'left'
          }}
        >
          <Kanban size={16} />
          <span>Kanban & Post-its</span>
        </button>

        <button
          onClick={() => setActiveTab('quadros')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: activeTab === 'quadros' ? 600 : 400,
            background: activeTab === 'quadros' ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
            color: activeTab === 'quadros' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            textAlign: 'left'
          }}
        >
          <Layers size={16} />
          <span>Quadros & Subníveis</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: activeTab === 'checklist' ? 600 : 400,
            background: activeTab === 'checklist' ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
            color: activeTab === 'checklist' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            textAlign: 'left'
          }}
        >
          <CheckSquare size={16} />
          <span>Checklist HVAC</span>
        </button>

        {/* Reports Tab ONLY for Admin */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: activeTab === 'reports' ? 600 : 400,
              background: activeTab === 'reports' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
              color: activeTab === 'reports' ? 'var(--accent-purple)' : 'var(--text-secondary)',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <BarChart3 size={16} />
              <span>Relatórios</span>
            </div>
            <span className="badge badge-purple" style={{ fontSize: '0.6rem' }}>Admin</span>
          </button>
        )}
      </div>

      {/* Subníveis (Quadros Filter List) */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.4rem 0.2rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Quadros ({activeQuadros.length})
          </span>
          {activeObra && (
            <button 
              onClick={() => onOpenObraModal('quadro')} 
              style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Plus size={13} />
            </button>
          )}
        </div>

        <button
          onClick={() => {
            setSelectedQuadroId(null);
            if (activeTab !== 'kanban') setActiveTab('kanban');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.45rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            background: selectedQuadroId === null && activeTab === 'kanban' ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
            color: selectedQuadroId === null && activeTab === 'kanban' ? 'var(--accent-blue)' : 'var(--text-primary)',
            fontWeight: selectedQuadroId === null ? 600 : 400
          }}
        >
          <span>🌐 Visão Geral da Obra</span>
          {selectedQuadroId === null && <ChevronRight size={13} />}
        </button>

        {activeQuadros.map(quadro => (
          <button
            key={quadro.id}
            onClick={() => {
              setSelectedQuadroId(quadro.id);
              if (activeTab !== 'kanban') setActiveTab('kanban');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.45rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              textAlign: 'left',
              background: selectedQuadroId === quadro.id ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
              color: selectedQuadroId === quadro.id ? 'var(--accent-indigo)' : 'var(--text-secondary)',
              fontWeight: selectedQuadroId === quadro.id ? 600 : 400
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
              ⚡ {quadro.name}
            </span>
            {selectedQuadroId === quadro.id && <ChevronRight size={13} />}
          </button>
        ))}
      </div>
    </aside>
  );
};
