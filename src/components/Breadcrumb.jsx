import React from 'react';
import { useData } from '../context/DataContext';
import { Building2, Layers, MapPin, ChevronRight, LayoutGrid } from 'lucide-react';

export const Breadcrumb = ({ activeTabName }) => {
  const { activeObra, activeQuadro, selectedQuadroId } = useData();

  return (
    <div className="breadcrumb-bar">
      <div className="breadcrumb-item">
        <Building2 size={15} style={{ color: 'var(--accent-blue)' }} />
        <span>Obra:</span>
        <strong style={{ color: 'var(--text-primary)' }}>{activeObra?.name || 'Selecione uma Obra'}</strong>
      </div>

      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />

      <div className="breadcrumb-item">
        <Layers size={15} style={{ color: 'var(--accent-purple)' }} />
        <span>Subnível:</span>
        <strong style={{ color: selectedQuadroId ? 'var(--accent-purple)' : 'var(--text-primary)' }}>
          {selectedQuadroId ? activeQuadro?.name : 'Visão Geral da Obra'}
        </strong>
      </div>

      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />

      <div className="breadcrumb-item breadcrumb-active">
        <LayoutGrid size={15} />
        <span>{activeTabName}</span>
      </div>
    </div>
  );
};
