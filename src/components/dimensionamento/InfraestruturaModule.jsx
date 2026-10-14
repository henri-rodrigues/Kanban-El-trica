import React, { useState } from 'react';
import { Wrench, Calculator, Kanban } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CalculadorasPanel } from './CalculadorasPanel';
import { InfraKanbanView } from '../InfraKanbanView';
import './dimensionamento.css';

// Calculadoras de infraestrutura: cabos, eletrodutos e queda de tensão dos circuitos de campo.
export const IDS_CALC_INFRA = ['cabo', 'eletroduto', 'queda'];

export const InfraestruturaModule = () => {
  const { activeObra, dimensionamentos, cards } = useData();
  const [aba, setAba] = useState('calculos');

  if (!activeObra) {
    return (
      <div className="dq-scope">
        <div className="dq-empty">
          <Wrench size={36} style={{ opacity: 0.5 }} />
          <h3 style={{ margin: '0.5rem 0 0.25rem' }}>Nenhuma obra selecionada</h3>
          <p>Selecione uma obra na Vitrine para dimensionar e acompanhar a infraestrutura dela.</p>
        </div>
      </div>
    );
  }

  const quadrosDaObra = dimensionamentos.filter((d) => d.obraId === activeObra.id);
  const qtdInfra = cards.filter(
    (c) =>
      c.obraId === activeObra.id &&
      (c.level === 'infra' || c.categoryTag === 'INFRA' || c.categoryTag === 'Passagem de Cabos' || c.categoryTag === 'Tubulação')
  ).length;

  return (
    <div className="dq-scope">
      <div className="dq-bar">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Wrench size={20} style={{ color: 'var(--accent-blue)' }} /> Infraestrutura
          </h2>
          <p className="dq-sub">{activeObra.name} · cabos, eletrodutos e queda de tensão, com o acompanhamento da execução</p>
        </div>
      </div>

      <div className="dq-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={aba === 'calculos'} className={aba === 'calculos' ? 'active' : ''} onClick={() => setAba('calculos')}>
          <Calculator size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} /> Calculadoras de infraestrutura
        </button>
        <button type="button" role="tab" aria-selected={aba === 'kanban'} className={aba === 'kanban' ? 'active' : ''} onClick={() => setAba('kanban')}>
          <Kanban size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} /> Kanban da infraestrutura ({qtdInfra})
        </button>
      </div>

      {aba === 'calculos' && (
        <CalculadorasPanel
          obra={activeObra}
          dimensionamentos={quadrosDaObra}
          ids={IDS_CALC_INFRA}
          tituloHistorico="Histórico de cálculos de infraestrutura"
        />
      )}
      {aba === 'kanban' && <InfraKanbanView />}
    </div>
  );
};
