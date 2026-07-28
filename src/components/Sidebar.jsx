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
  Building,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, onOpenObraModal }) => {
  const { isAdmin } = useAuth();
  const { activeObra, activeQuadros, selectedQuadroId, setSelectedQuadroId } = useData();

  return (
    <aside className="glass-panel" style={{
      width: '260px',
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border-color)',
      padding: '1rem 0.75rem',
      flexShrink: 0
    }}>
      {/* Obra Summary Header */}
      <div style={{
        padding: '0.85rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-main)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.25rem'
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
          Obra Ativa
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeObra?.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Progresso</span>
          <span className="badge badge-emerald">{activeObra?.progress}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '4px',
          background: 'var(--border-color)',
          borderRadius: '2px',
          marginTop: '0.4rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${activeObra?.progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981, #38bdf8)'
          }} />
        </div>
      </div>

      {/* Primary Nav Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 0.5rem 0.3rem' }}>
          Navegação Principal
        </div>

        <button
          onClick={() => setActiveTab('kanban')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'kanban' ? 600 : 400,
            background: activeTab === 'kanban' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(56, 189, 248, 0.1))' : 'transparent',
            color: activeTab === 'kanban' ? 'var(--accent-indigo)' : 'var(--text-secondary)',
            textAlign: 'left',
            transition: 'all 0.2s ease'
          }}
        >
          <Kanban size={18} />
          <span>Kanban & Post-its</span>
        </button>

        <button
          onClick={() => setActiveTab('quadros')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'quadros' ? 600 : 400,
            background: activeTab === 'quadros' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(56, 189, 248, 0.1))' : 'transparent',
            color: activeTab === 'quadros' ? 'var(--accent-indigo)' : 'var(--text-secondary)',
            textAlign: 'left'
          }}
        >
          <Layers size={18} />
          <span>Quadros & Subníveis</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'checklist' ? 600 : 400,
            background: activeTab === 'checklist' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(56, 189, 248, 0.1))' : 'transparent',
            color: activeTab === 'checklist' ? 'var(--accent-indigo)' : 'var(--text-secondary)',
            textAlign: 'left'
          }}
        >
          <CheckSquare size={18} />
          <span>Checklist HVAC</span>
        </button>

        {/* Reports Link (Admin Exclusive badge) */}
        <button
          onClick={() => setActiveTab('reports')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: activeTab === 'reports' ? 600 : 400,
            background: activeTab === 'reports' ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(244, 63, 94, 0.15))' : 'transparent',
            color: activeTab === 'reports' ? 'var(--accent-purple)' : 'var(--text-secondary)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart3 size={18} />
            <span>Relatórios & Custos</span>
          </div>
          {isAdmin ? (
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Admin</span>
          ) : (
            <Lock size={14} style={{ color: 'var(--accent-rose)' }} title="Acesso Exclusivo para Administrador" />
          )}
        </button>
      </div>

      {/* Subníveis (Quadros Filter List) */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem 0.3rem' }}>
          <span style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Quadros da Obra ({activeQuadros.length})
          </span>
          <button 
            onClick={() => onOpenObraModal('quadro')} 
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Adicionar Quadro nesta Obra"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* All Obra General Option */}
        <button
          onClick={() => {
            setSelectedQuadroId(null);
            if (activeTab !== 'kanban') setActiveTab('kanban');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.775rem',
            background: selectedQuadroId === null && activeTab === 'kanban' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: selectedQuadroId === null && activeTab === 'kanban' ? 'var(--accent-blue)' : 'var(--text-primary)',
            fontWeight: selectedQuadroId === null ? 600 : 400
          }}
        >
          <span>🌐 Visão Geral da Obra</span>
          {selectedQuadroId === null && <ChevronRight size={14} />}
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
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.775rem',
              textAlign: 'left',
              background: selectedQuadroId === quadro.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: selectedQuadroId === quadro.id ? 'var(--accent-indigo)' : 'var(--text-secondary)',
              fontWeight: selectedQuadroId === quadro.id ? 600 : 400
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
              ⚡ {quadro.name}
            </span>
            {selectedQuadroId === quadro.id && <ChevronRight size={14} />}
          </button>
        ))}
      </div>
    </aside>
  );
};
