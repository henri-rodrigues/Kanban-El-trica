import React, { useMemo, useState } from 'react';
import { Wrench, Calculator, Kanban, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CalculadorasPanel } from './CalculadorasPanel';
import { InfraKanbanView } from '../InfraKanbanView';
import { InfraResumo } from '../infra/InfraResumo';
import {
  IDS_CALC_INFRA, CATEGORIA_DA_CALCULADORA, ehCardInfra, subtarefasPadrao
} from '../../constants/infraestrutura';
import './dimensionamento.css';

export { IDS_CALC_INFRA };

export const InfraestruturaModule = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { activeObra, dimensionamentos, cards, addCard } = useData();

  const [aba, setAba] = useState('geral');
  const [categoria, setCategoria] = useState('todas');
  const [aviso, setAviso] = useState('');

  const cardsInfra = useMemo(
    () => cards.filter((c) => c.obraId === activeObra?.id && ehCardInfra(c)),
    [cards, activeObra]
  );

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

  const abrirKanban = (cat = 'todas') => {
    setCategoria(cat);
    setAba('kanban');
  };

  // Transforma um cálculo em tarefa do Kanban, já com as subtarefas da categoria.
  const criarTarefaDoCalculo = ({ calcId, titulo, descricao }) => {
    const categoriaTarefa = CATEGORIA_DA_CALCULADORA[calcId] || 'Infraestrutura Geral';
    addCard({
      title: titulo,
      description: descricao,
      fieldNotes: '',
      obraId: activeObra.id,
      quadroId: null,
      level: 'infra',
      categoryTag: categoriaTarefa,
      gradientId: 'amber',
      priority: 'Média',
      column: 'todo',
      assignedUserId: currentUser?.id,
      assignedUserName: currentUser?.name,
      subtasks: subtarefasPadrao(categoriaTarefa),
      origem: { tipo: 'calculo', calcId }
    });
    setAviso(`Tarefa criada no Kanban: ${titulo}`);
    setTimeout(() => setAviso(''), 5000);
  };

  const abas = [
    ['geral', 'Visão geral', LayoutDashboard],
    ['calculos', 'Calculadoras', Calculator],
    ['kanban', `Kanban (${cardsInfra.length})`, Kanban]
  ];

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
        {abas.map(([id, rotulo, Icone]) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'active' : ''} onClick={() => setAba(id)}>
            <Icone size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} /> {rotulo}
          </button>
        ))}
      </div>

      {aviso && (
        <div className="dq-alert" role="status" style={{ background: 'var(--wash-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <CheckCircle2 size={15} /> {aviso}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => abrirKanban('todas')}>Ver no Kanban</button>
        </div>
      )}

      {aba === 'geral' && (
        <InfraResumo
          obra={activeObra}
          cardsInfra={cardsInfra}
          onAbrirKanban={abrirKanban}
          onAbrirCalculadoras={() => setAba('calculos')}
          onNavigate={onNavigate}
        />
      )}

      {aba === 'calculos' && (
        <CalculadorasPanel
          obra={activeObra}
          dimensionamentos={quadrosDaObra}
          ids={IDS_CALC_INFRA}
          tituloHistorico="Histórico de cálculos de infraestrutura"
          onCriarTarefa={criarTarefaDoCalculo}
        />
      )}

      {aba === 'kanban' && <InfraKanbanView categoria={categoria} onCategoria={setCategoria} />}
    </div>
  );
};
