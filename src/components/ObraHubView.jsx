import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Building2, Plus, ArrowRight, MapPin, Users, Trash2, Edit3 } from 'lucide-react';

export const ObraHubView = ({ onSelectObra, onOpenObraModal }) => {
  const { isAdmin, currentUser } = useAuth();
  const { obras, quadros, getObraLaborCostsAndDays, deleteObra } = useData();

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.6rem',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}>
            🏢
          </div>
          <div>
            <span className="badge badge-blue" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>
              Painel Principal de Projetos
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Vitrine de Obras & Projetos
            </h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              {isAdmin 
                ? 'Selecione ou cadastre uma obra abaixo para gerenciar quadros e permissões de usuários.' 
                : 'Selecione uma das obras atribuídas a você para visualizar o Kanban e os subníveis.'}
            </p>
          </div>
        </div>

        {/* Add Obra Button - ONLY for Admin */}
        {isAdmin && (
          <button onClick={() => onOpenObraModal('obra')} className="btn btn-primary">
            <Plus size={16} /> Cadastrar Nova Obra
          </button>
        )}
      </div>

      {/* Grid of Obras */}
      {obras.length > 0 ? (
        <div className="obra-hub-grid">
          {obras.map((obra) => {
            const obraQuadrosCount = quadros.filter(q => q.obraId === obra.id).length;
            const { totalLaborCost, daysSpent } = getObraLaborCostsAndDays(obra.id);
            const totalBudget = (obra.initialBudget || 0) + (obra.addedBudget || 0);
            const assignedCount = obra.assignedUserIds?.length || 0;

            return (
              <div
                key={obra.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, background 0.15s ease'
                }}
                onClick={() => onSelectObra(obra.id)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem', width: '100%', minWidth: 0 }}>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <span 
                        className="badge badge-blue" 
                        style={{ 
                          display: 'inline-block',
                          maxWidth: '100%', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle'
                        }} 
                        title={obra.code || 'OBRA'}
                      >
                        {obra.code || 'OBRA'}
                      </span>
                    </div>
                    <span className="badge badge-emerald" style={{ flexShrink: 0, marginLeft: '0.35rem' }}>
                      {obra.status || 'Em Andamento'}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', wordBreak: 'break-word', lineHeight: 1.3 }}>
                    {obra.name}
                  </h2>

                  <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                    {obra.client && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building2 size={13} className="text-blue" />
                        <span>Cliente: <strong>{obra.client}</strong></span>
                      </div>
                    )}
                    {obra.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={13} className="text-amber" />
                        <span>{obra.location} {obra.distanceKm ? `(${obra.distanceKm} km)` : ''}</span>
                      </div>
                    )}
                    {assignedCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-blue)' }}>
                        <Users size={13} />
                        <span>{assignedCount} Participantes Autorizados</span>
                      </div>
                    )}
                  </div>

                  {/* Financial 4 Budgets Info ONLY for Admin */}
                  {isAdmin && (
                    <div style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '0.75rem',
                      fontSize: '0.725rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Verba Geral:</span>
                        <strong style={{ color: 'var(--accent-blue)', fontSize: '0.85rem' }}>{formatBRL(totalBudget)}</strong>
                      </div>
                      <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                        <div>Materiais: <strong style={{ color: 'var(--text-primary)' }}>{formatBRL(obra.materialsBudget || 0)}</strong></div>
                        <div>Indiretos: <strong style={{ color: 'var(--text-primary)' }}>{formatBRL(obra.indirectsBudget || 0)}</strong></div>
                        <div>Infra: <strong style={{ color: 'var(--text-primary)' }}>{formatBRL(obra.infraBudget || 0)}</strong></div>
                        <div>Mão de Obra: <strong style={{ color: 'var(--text-primary)' }}>{formatBRL(obra.laborBudget || 0)}</strong></div>
                      </div>
                      {obra.distanceKm > 0 && (
                        <div style={{ fontSize: '0.675rem', color: 'var(--accent-amber)', marginTop: '0.15rem' }}>
                          🚘 Custo Est. Viagem ({obra.distanceKm}km x R$1,50): <strong>{formatBRL(obra.distanceKm * 1.5)}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress bar & Days */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{obraQuadrosCount} Quadros | {daysSpent} dias</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{obra.progress || 0}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${obra.progress || 0}%`, height: '100%', background: 'var(--accent-emerald)' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    Abrir Kanban & Quadros <ArrowRight size={14} />
                  </button>

                  {isAdmin && (
                    <>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenObraModal('edit_obra', obra);
                        }} 
                        className="btn btn-secondary btn-sm"
                        title="Editar Nome, Orçamento e Participantes Autorizados da Obra"
                      >
                        <Edit3 size={14} className="text-blue" />
                      </button>

                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Tem certeza que deseja EXCLUIR a obra "${obra.name}"?\nEsta ação excluirá todos os quadros, post-its e orçamentos vinculados.`)) {
                            deleteObra(obra.id);
                          }
                        }} 
                        className="btn btn-danger btn-sm"
                        title="Excluir Obra"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div 
          className="glass-panel"
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--border-color)',
            maxWidth: '500px',
            margin: '2rem auto'
          }}
        >
          <Building2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {isAdmin ? 'Nenhuma Obra Cadastrada' : 'Nenhuma Obra Liberada'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {isAdmin 
              ? 'Comece cadastrando a sua primeira obra para gerenciar quadros, post-its e comissionamento.'
              : 'Aguarde o Administrador vincular você às Obras do projeto.'}
          </p>
          {isAdmin && (
            <button onClick={() => onOpenObraModal('obra')} className="btn btn-primary">
              <Plus size={16} /> Cadastrar Primeira Obra
            </button>
          )}
        </div>
      )}
    </div>
  );
};
