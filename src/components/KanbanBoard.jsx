import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CardDetailModal } from './CardDetailModal';
import { getGradientById } from '../constants/gradients';
import { 
  Plus, 
  Layers, 
  Building, 
  Image as ImageIcon, 
  Clock, 
  CheckSquare, 
  Search,
  GripVertical,
  Lock,
  AlertCircle
} from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', badge: 'tag-service' },
  { id: 'in_progress', title: 'Em Andamento', badge: 'tag-hvac' },
  { id: 'on_hold', title: 'Em Espera', badge: 'tag-hold' },
  { id: 'completed', title: 'Concluído', badge: 'tag-phone' }
];

export const KanbanBoard = ({ onOpenObraModal }) => {
  const { currentUser, users, isAdmin } = useAuth();
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
  const [dragOverColId, setDragOverColId] = useState(null);
  const [permissionErrorMsg, setPermissionErrorMsg] = useState('');

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
      assignedUserId: currentUser?.id || 'usr-admin',
      assignedUserName: currentUser?.name || 'Operador',
      userColor: currentUser?.userColorTag || '#0284c7',
      gradientId: currentUser?.gradientId || 'cyan',
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

  // Drag & Drop Handlers with Strict Ownership Check
  const handleDragStart = (e, card) => {
    setPermissionErrorMsg('');
    const isOwnerOrAdmin = isAdmin || card.assignedUserId === currentUser?.id;
    
    if (!isOwnerOrAdmin) {
      setPermissionErrorMsg('🔒 Você só pode mover os post-its atribuídos ao seu usuário!');
      setTimeout(() => setPermissionErrorMsg(''), 4000);
      e.preventDefault();
      return false;
    }

    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (dragOverColId === colId) {
      setDragOverColId(null);
    }
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    setDragOverColId(null);
    const cardId = e.dataTransfer.getData('cardId');
    if (cardId) {
      const card = cards.find(c => c.id === cardId);
      const isOwnerOrAdmin = isAdmin || card?.assignedUserId === currentUser?.id;
      
      if (isOwnerOrAdmin) {
        updateCardStatus(cardId, targetColId);
      } else {
        setPermissionErrorMsg('🔒 Você só pode mover os post-its atribuídos ao seu usuário!');
        setTimeout(() => setPermissionErrorMsg(''), 4000);
      }
    }
  };

  const handleCardClick = (card) => {
    setPermissionErrorMsg('');
    setSelectedCard(card);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
      {/* Top Notification Toast for Permission Error */}
      {permissionErrorMsg && (
        <div style={{
          padding: '0.65rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(220, 38, 38, 0.2)',
          border: '1px solid rgba(220, 38, 38, 0.4)',
          color: '#f87171',
          fontSize: '0.825rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
          animation: 'fadeIn 0.2s ease-in'
        }}>
          <AlertCircle size={18} />
          <span>{permissionErrorMsg}</span>
        </div>
      )}

      {/* Azure DevOps / Miro Top Toolbar */}
      <div className="glass-panel" style={{
        padding: '0.65rem 0.85rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        {/* First row: Title + Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem', minWidth: 0 }}>
            <Layers size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedQuadroId ? activeQuadro?.name : activeObra?.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative', width: '150px' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
              <Plus size={14} /> <span className="mobile-hide">Quadro</span>
            </button>
          </div>
        </div>

        {/* Second row: Scope Pills — horizontal scroll on mobile */}
        <div style={{ display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch', gap: '2px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setSelectedQuadroId(null)}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.725rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: selectedQuadroId === null ? 'var(--accent-blue)' : 'transparent',
              color: selectedQuadroId === null ? '#ffffff' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            🌐 Obra Geral
          </button>

          {activeQuadros.map(q => (
            <button
              key={q.id}
              onClick={() => setSelectedQuadroId(q.id)}
              style={{
                padding: '0.3rem 0.55rem',
                fontSize: '0.725rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: selectedQuadroId === q.id ? 'var(--accent-purple)' : 'transparent',
                color: selectedQuadroId === q.id ? '#ffffff' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              ⚡ {q.name}
            </button>
          ))}
        </div>
      </div>

      {/* User Legend — hidden on mobile */}
      <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Operadores:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {users.map(u => (
            <span key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.userColorTag }} />
              {u.name.split(' ')[0]} {isAdmin && <strong style={{ color: 'var(--accent-emerald)' }}>(R$ {u.dailyRate}/dia)</strong>}
            </span>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--accent-blue)' }}>
          🔒 Você pode mover e editar apenas os seus próprios post-its
        </span>
      </div>

      {/* Mobile Column Quick Filter Pills */}
      <div className="mobile-show" style={{ display: 'none', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem', WebkitOverflowScrolling: 'touch' }}>
        {COLUMNS.map(col => {
          const count = filteredCards.filter(c => c.column === col.id).length;
          return (
            <button
              key={col.id}
              onClick={() => {
                const el = document.getElementById(`kanban-col-${col.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
              }}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '16px',
                fontSize: '0.7rem',
                fontWeight: 700,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                flexShrink: 0
              }}
            >
              <span>{col.title}</span>
              <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0 4px' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board Columns — Horizontal scroll on mobile */}
      <div className="kanban-scroll-container" style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        flex: 1,
        alignItems: 'stretch'
      }}>
        {COLUMNS.map((col) => {
          const colCards = filteredCards.filter(c => c.column === col.id);
          const isDragOver = dragOverColId === col.id;

          return (
            <div 
              key={col.id}
              id={`kanban-col-${col.id}`}
              className={`glass-panel ${isDragOver ? 'kanban-col-dragover' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <h3 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {col.title}
                  </h3>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {colCards.length}
                </span>
              </div>

              {/* Add item button */}
              {activeNewCardCol === col.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Título do post-it..."
                    className="form-control"
                    style={{ fontSize: '0.775rem', padding: '0.35rem 0.5rem' }}
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateQuickCard(col.id)}
                  />
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button onClick={() => handleCreateQuickCard(col.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      Criar
                    </button>
                    <button onClick={() => setActiveNewCardCol(null)} className="btn btn-secondary btn-sm">
                      ✕
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
                    padding: '0.4rem 0.5rem',
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
                  <Plus size={13} /> Adicionar Item
                </button>
              )}

              {/* Cards List (Draggable Cards with Ownership Protection) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1, overflowY: 'auto' }}>
                {colCards.map((card) => {
                  const cardGradient = getGradientById(card.gradientId || 'cyan');
                  const totalHours = (card.workedDays || []).reduce((sum, w) => sum + (w.hours || 0), 0);
                  const subtasksDone = (card.subtasks || []).filter(st => st.completed).length;
                  const totalSubtasks = (card.subtasks || []).length;
                  const isMine = card.assignedUserId === currentUser?.id;
                  const canTouch = isAdmin || isMine;

                  return (
                    <div
                      key={card.id}
                      draggable={canTouch}
                      onDragStart={(e) => handleDragStart(e, card)}
                      onClick={() => handleCardClick(card)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-main)',
                        border: `1px solid ${cardGradient.border}`,
                        borderLeft: `5px solid ${cardGradient.border}`,
                        cursor: canTouch ? 'grab' : 'not-allowed',
                        opacity: canTouch ? 1 : 0.8,
                        minHeight: '110px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'background 0.15s ease, transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
                    >
                      {/* Card Title & Drag/Lock Handle */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.3rem' }}>
                        <h4 style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', lineHeight: 1.3, flex: 1 }}>
                          {card.title}
                        </h4>
                        {canTouch ? (
                          <GripVertical size={13} style={{ color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }} />
                        ) : (
                          <Lock size={13} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} title="Post-it pertence a outro operador" />
                        )}
                      </div>

                      {/* Priority / Severity Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <span className={`badge ${
                          card.priority === 'Crítica' || card.priority === 'Alta' ? 'badge-danger' : 
                          card.priority === 'Média' ? 'badge-amber' : 'badge-emerald'
                        }`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          {card.priority || 'Normal'}
                        </span>
                        <span className="tag-pill tag-hvac">
                          {card.categoryTag || 'HVAC'}
                        </span>
                      </div>

                      {/* Mentioned User Tags (@) */}
                      {card.mentionedUserIds && card.mentionedUserIds.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                          {card.mentionedUserIds.map(uid => {
                            const u = users.find(usr => usr.id === uid);
                            if (!u) return null;
                            return (
                              <span key={uid} style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.15)', color: 'var(--accent-blue)', fontWeight: 700, border: '1px solid rgba(2, 132, 199, 0.3)' }}>
                                @{u.name.split(' ')[0]}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Image Thumbnail preview */}
                      {card.images && card.images.length > 0 && (
                        <div style={{ height: '50px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.35rem', border: '1px solid var(--border-color)' }}>
                          <img src={card.images[0]} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      {/* Footer Info */}
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

                        {/* User Circle Avatar */}
                        <div 
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: cardGradient.gradient,
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
                    Arraste um card para cá
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Detail Modal (Passing Real-time activeSelectedCard) */}
      <CardDetailModal
        card={cards.find(c => c.id === selectedCard?.id) || selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
};
