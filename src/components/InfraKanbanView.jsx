import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CardDetailModal } from './CardDetailModal';
import { 
  Layers, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  Building2,
  Trash2,
  Edit3,
  Wrench
} from 'lucide-react';
import { POSTIT_GRADIENTS, getGradientById } from '../constants/gradients';

const KANBAN_COLUMNS = [
  { id: 'todo', title: '📋 A Fazer', color: 'var(--accent-blue)', bg: 'rgba(2, 132, 199, 0.08)' },
  { id: 'in_progress', title: '⚡ Em Andamento', color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.08)' },
  { id: 'on_hold', title: '⏳ Aguardo', color: 'var(--accent-purple)', bg: 'rgba(147, 51, 234, 0.08)' },
  { id: 'completed', title: '✅ Concluído', color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.08)' }
];

export const InfraKanbanView = () => {
  const { currentUser, users, isAdmin } = useAuth();
  const { 
    activeObra, 
    cards, 
    addCard, 
    updateCardStatus, 
    deleteCard 
  } = useData();

  const [selectedCard, setSelectedCard] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardCategory, setNewCardCategory] = useState('Passagem de Cabos');
  const [newCardGradient, setNewCardGradient] = useState('cyan');
  const [searchFilter, setSearchFilter] = useState('');

  if (!activeObra) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <AlertCircle size={48} className="text-amber" style={{ marginBottom: '1rem' }} />
        <h3>Nenhuma Obra Selecionada</h3>
        <p style={{ color: 'var(--text-muted)' }}>Selecione uma obra na vitrine para acessar o Kanban de Infraestrutura.</p>
      </div>
    );
  }

  // Filter cards for Infrastructure (level === 'infra' OR categoryTag containing Infra)
  const infraCards = cards.filter(c => 
    c.obraId === activeObra.id && 
    (c.level === 'infra' || c.categoryTag === 'INFRA' || c.categoryTag === 'Passagem de Cabos' || c.categoryTag === 'Tubulação')
  );

  const filteredCards = infraCards.filter(c => {
    if (!searchFilter) return true;
    return c.title.toLowerCase().includes(searchFilter.toLowerCase());
  });

  const handleDragStart = (e, cardId) => {
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      updateCardStatus(cardId, targetColumn);
    }
  };

  const handleCreateInfraCard = (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    addCard({
      title: newCardTitle,
      obraId: activeObra.id,
      quadroId: null,
      level: 'infra',
      categoryTag: newCardCategory,
      gradientId: newCardGradient,
      priority: 'Média',
      assignedUserId: currentUser.id,
      assignedUserName: currentUser.name,
      subtasks: [
        { id: `st-1`, title: 'Passagem e fixação', completed: false },
        { id: `st-2`, title: 'Identificação e anilhamento', completed: false },
        { id: `st-3`, title: 'Teste de continuidade / Isolação', completed: false }
      ]
    });

    setNewCardTitle('');
    setIsAddModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>🛠️ Infra</span>
          <span className="badge badge-amber" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{activeObra.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '140px' }}>
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

          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
            <Plus size={14} /> <span className="mobile-hide">Novo Post-it</span><span className="mobile-show" style={{ display: 'none' }}>+</span>
          </button>
        </div>
      </div>

      {/* 4 Kanban Columns — Horizontal scroll on mobile */}
      <div className="kanban-scroll-container" style={{
        gridTemplateColumns: 'repeat(4, 1fr)'
      }}>
        {KANBAN_COLUMNS.map(col => {
          const colCards = filteredCards.filter(c => c.column === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                background: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                borderTop: `4px solid ${col.color}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {col.title}
                </h3>
                <span className="badge" style={{ background: col.color, color: '#fff', fontSize: '0.7rem' }}>
                  {colCards.length}
                </span>
              </div>

              {/* Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                {colCards.map(card => {
                  const cardGradient = getGradientById(card.gradientId || 'cyan');

                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onClick={() => setSelectedCard(card)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-main)',
                        borderLeft: `4px solid ${cardGradient.border}`,
                        border: '1px solid var(--border-color)',
                        cursor: 'grab',
                        transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                          {card.categoryTag || 'INFRA'}
                        </span>
                        <span className={`badge ${
                          card.priority === 'Crítica' || card.priority === 'Alta' ? 'badge-danger' : 'badge-emerald'
                        }`} style={{ fontSize: '0.65rem' }}>
                          {card.priority || 'Média'}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        {card.title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <span>👤 {card.assignedUserName || 'Equipe Infra'}</span>
                        <span>{(card.subtasks || []).filter(s => s.completed).length}/{(card.subtasks || []).length} subs</span>
                      </div>
                    </div>
                  );
                })}

                {colCards.length === 0 && (
                  <div style={{ padding: '2rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    Arraste para cá
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Infra Card Modal */}
      {isAddModalOpen && (
        <div className="mobile-modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="glass-panel mobile-modal-content" style={{ width: '100%', maxWidth: '460px', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Criar Post-it de Infraestrutura</h3>
            
            <form onSubmit={handleCreateInfraCard} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label>Título da Atividade de Infra *</label>
                <input 
                  type="text" 
                  required 
                  className="form-control" 
                  placeholder="Ex: Lançamento de cabo PP 4x2.5mm² para QTA" 
                  value={newCardTitle} 
                  onChange={(e) => setNewCardTitle(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Categoria de Infraestrutura</label>
                <select className="form-control" value={newCardCategory} onChange={(e) => setNewCardCategory(e.target.value)}>
                  <option value="Passagem de Cabos">Passagem de Cabos & Fiação</option>
                  <option value="Leitos & Eletrocalhas">Leitos & Eletrocalhas</option>
                  <option value="Tubulação & Perfilados">Tubulação & Perfilados</option>
                  <option value="Caixas de Passagem">Caixas de Passagem & Conexão</option>
                  <option value="Infraestrutura Geral">Infraestrutura Geral</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Criar Post-it
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Detail Modal */}
      <CardDetailModal
        card={cards.find(c => c.id === selectedCard?.id) || selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
};
