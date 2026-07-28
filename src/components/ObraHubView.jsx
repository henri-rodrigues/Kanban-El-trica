import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Building2, Plus, ArrowRight, MapPin, Calendar, CheckCircle2, TrendingUp, Layers, User } from 'lucide-react';

export const ObraHubView = ({ onSelectObra, onOpenObraModal }) => {
  const { isAdmin } = useAuth();
  const { obras, quadros, getObraLaborCostsAndDays } = useData();

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
              Seleção de Obras & Projetos Corporativos
            </h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Selecione uma obra abaixo para abrir os quadros, Kanban em 2 níveis e checklists de comissionamento.
            </p>
          </div>
        </div>

        <button onClick={() => onOpenObraModal('obra')} className="btn btn-primary">
          <Plus size={16} /> Cadastrar Nova Obra
        </button>
      </div>

      {/* Grid of Obras */}
      {obras.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {obras.map((obra) => {
            const obraQuadrosCount = quadros.filter(q => q.obraId === obra.id).length;
            const { totalLaborCost, daysSpent } = getObraLaborCostsAndDays(obra.id);
            const totalBudget = (obra.initialBudget || 0) + (obra.addedBudget || 0);

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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="badge badge-blue">
                      {obra.code || 'OBRA'}
                    </span>
                    <span className="badge badge-emerald">
                      {obra.status || 'Em Andamento'}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
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
                        <span>{obra.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Info ONLY for Admin */}
                  {isAdmin && (
                    <div style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '0.75rem',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Verba Total: </span>
                        <strong style={{ color: 'var(--accent-blue)' }}>{formatBRL(totalBudget)}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Mão de Obra: </span>
                        <strong style={{ color: 'var(--accent-emerald)' }}>{formatBRL(totalLaborCost)}</strong>
                      </div>
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

                <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                  Abrir Kanban & Quadros <ArrowRight size={14} />
                </button>
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
            Nenhuma Obra Cadastrada
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Comece cadastrando a sua primeira obra para gerenciar quadros, post-its e comissionamento.
          </p>
          <button onClick={() => onOpenObraModal('obra')} className="btn btn-primary">
            <Plus size={16} /> Cadastrar Primeira Obra
          </button>
        </div>
      )}
    </div>
  );
};
