import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CardDetailModal } from './CardDetailModal';
import { 
  Plus, 
  Layers, 
  Building, 
  Image as ImageIcon, 
  Clock, 
  CheckSquare, 
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'New / A Fazer', badge: 'tag-service' },
  { id: 'in_progress', title: 'Active / Em Andamento', limit: '5/5', badge: 'tag-hvac' },
  { id: 'commissioning', title: 'Comissionamento', limit: '3/3', badge: 'tag-medium' },
  { id: 'completed', title: 'Resolved / Concluído', badge: 'tag-phone' }
];

export const KanbanBoard = ({ onOpenObraModal }) => {
  const { currentUser, users } = useAuth();
  const { 
    activeObra, 
    activeQuadros, 
    selectedQuadroId, 
    setSelectedQuadroId, 
    activeQuadro, 
    cards, 
    updateCardStatus,
    addCard 
  } = useData();

  const [selectedCard, setSelectedCard] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [activeNewCardCol, setActiveNewCardCol] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  const filteredCards = cards.filter(c => {
    if (c.obraId !== activeObra?.id) return false;
    if (selectedQuadroId && c.quadroId !== selectedQuadroId) return false;
    if (!selectedQuadroId && (c.level !== 'obra' && c.quadroId)) return false;
    if (searchFilter && !c.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const handleCreateQuickCard = (columnId) => {
    if (!newCardTitle.trim()) return;
    addCard({
      title: newCardTitle,
      description: 'Clique para editar detalhes e anotações.',
      fieldNotes: 'Pendências a verificar...',
      column: columnId,
      assignedUserId: currentUser?.id || 'usr-1',
      assignedUserName: currentUser?.name || 'Operador',
      userColor: currentUser?.userColorTag || '#0284c7',
      priority: 'Média',
      categoryTag: 'HVAC',
      subtasks: [
        { id: `st-${Date.now()}-1`, title: 'Inspeção visual', completed: false },
        { id: `st-${Date.now()}-2`, title: 'Medição técnica', completed: false }
      ],
      images: [],
      workedDays: []
    });
    setNewCardTitle('');
    setActiveNewCardCol(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
      {/* Azure DevOps / Miro Top Toolbar */}
      <div className="glass-panel" style={{
        padding: '0.65rem 0.85rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
            <Layers size={18} style={{ color: 'var(--accent-blue)' }} />
            <span>{selectedQuadroId ? activeQuadro?.name : activeObra?.name}</span>
          </div>

          {/* 2-Level Scope Pills */}
          <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setSelectedQuadroId(null)}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.725rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: selectedQuadroId === null ? 'var(--accent-blue)' : 'transparent',
                color: selectedQuadroId === null ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              🌐 Obra Geral
            </button>

            {activeQuadros.map(q => (
              <button
                key={q.id}
                onClick={() => setSelectedQuadroId(q.id)}
                style={{
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedQuadroId === q.id ? 'var(--accent-purple)' : 'transparent',
                  color: selectedQuadroId === q.id ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                ⚡ {q.name.split('-')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Search Input (Azure DevOps style) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ position: 'relative', width: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="form-control"
              style={{ paddingLeft: '28px', fontSize: '0.75rem', padding: '0.35rem 0.6rem 0.35rem 28px' }}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          <button onClick={() => onOpenObraModal('quadro')} className="btn btn-secondary btn-sm">
            <Plus size={14} /> Quadro
          </button>
        </div>
      </div>

      {/* Kanban Board Columns Grid (Azure DevOps & Miro Style) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '0.75rem',
        flex: 1,
        alignItems: 'start'
      }}>
        {COLUMNS.map((col) => {
          const colCards = filteredCards.filter(c => c.column === col.id);

          return (
            <div 
              key={col.id}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem',
                minHeight: '460px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem'
              }}
            >
              {/* Column Header (Azure DevOps Style) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <h3 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {col.title}
                  </h3>
                  {col.limit && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 600, background: 'rgba(5, 150, 105, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                      {colCards.length}/{col.limit.split('/')[1]}
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {colCards.length}
                </span>
              </div>

              {/* Azure DevOps "+ New item" Button */}
              {activeNewCardCol === col.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter title..."
                    className="form-control"
                    style={{ fontSize: '0.775rem', padding: '0.35rem 0.5rem' }}
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateQuickCard(col.id)}
                  />
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button onClick={() => handleCreateQuickCard(col.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      Add
                    </button>
                    <button onClick={() => setActiveNewCardCol(null)} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveNewCardCol(col.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px dashed var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={13} /> New item
                </button>
              )}

              {/* Cards List (Azure DevOps / Miro Format) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1, overflowY: 'auto' }}>
                {colCards.map((card) => {
                  const userColor = card.userColor || '#0284c7';
                  const totalHours = (card.workedDays || []).reduce((sum, w) => sum + (w.hours || 0), 0);
                  const subtasksDone = (card.subtasks || []).filter(st => st.completed).length;
                  const totalSubtasks = (card.subtasks || []).length;

                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      style={{
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        borderLeft: `4px solid ${userColor}`,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
                    >
                      {/* Card Title */}
                      <h4 style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                        {card.title}
                      </h4>

                      {/* Miro / Azure DevOps Tag Pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <span className="tag-pill tag-service">
                          Service
                        </span>
                        <span className="tag-pill tag-hvac">
                          {card.categoryTag || 'HVAC'}
                        </span>
                        {card.priority === 'Alta' && (
                          <span className="tag-pill tag-high">
                            High
                          </span>
                        )}
                      </div>

                      {/* Image Thumbnail preview if attached */}
                      {card.images && card.images.length > 0 && (
                        <div style={{ height: '55px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.35rem', border: '1px solid var(--border-color)' }}>
                          <img src={card.images[0]} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      {/* Footer Info: Subtask count, Story points/hours, Assignee Avatar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                          {totalSubtasks > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-secondary)' }}>
                              <CheckSquare size={11} /> {subtasksDone}/{totalSubtasks}
                            </span>
                          )}

                          {totalHours > 0 && (
                            <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                              {totalHours}h
                            </span>
                          )}
                        </div>

                        {/* User Circle Avatar (Azure DevOps / Miro Style) */}
                        <div 
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: userColor,
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={card.assignedUserName}
                        >
                          {card.assignedUserName ? card.assignedUserName.charAt(0) : 'F'}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colCards.length === 0 && (
                  <div style={{ padding: '1.2rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.725rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
};
