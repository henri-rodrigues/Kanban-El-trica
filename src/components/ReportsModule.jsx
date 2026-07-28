import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Building2,
  PieChart,
  Download,
  Calendar
} from 'lucide-react';

export const ReportsModule = () => {
  const { isAdmin, users } = useAuth();
  const { activeObra, cards, checklists, getObraLaborCostsAndDays, updateObraFinancials } = useData();

  const [editInitialBudget, setEditInitialBudget] = useState(activeObra?.initialBudget || 1000000);
  const [editAddedBudget, setEditAddedBudget] = useState(activeObra?.addedBudget || 0);
  const [editMaterialCosts, setEditMaterialCosts] = useState(activeObra?.materialCosts || 0);

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <AlertCircle size={48} className="text-rose" style={{ marginBottom: '1rem' }} />
        <h3>Acesso Restrito ao Administrador</h3>
        <p style={{ color: 'var(--text-muted)' }}>Você não possui permissão para acessar os relatórios financeiros.</p>
      </div>
    );
  }

  const { totalLaborCost, daysSpent, totalHours } = getObraLaborCostsAndDays(activeObra?.id);

  const initialBudgetNum = parseFloat(activeObra?.initialBudget || editInitialBudget) || 0;
  const addedBudgetNum = parseFloat(activeObra?.addedBudget || editAddedBudget) || 0;
  const totalBudget = initialBudgetNum + addedBudgetNum;
  const materialCostsNum = parseFloat(activeObra?.materialCosts || editMaterialCosts) || 0;

  const totalSpent = totalLaborCost + materialCostsNum;
  const remainingBalance = totalBudget - totalSpent;
  const budgetUsedPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Kanban Tasks distribution by status
  const obraCards = cards.filter(c => c.obraId === activeObra?.id);
  const todoCards = obraCards.filter(c => c.column === 'todo').length;
  const inProgressCards = obraCards.filter(c => c.column === 'in_progress').length;
  const onHoldCards = obraCards.filter(c => c.column === 'on_hold').length;
  const completedCards = obraCards.filter(c => c.column === 'completed').length;
  const totalCardsCount = obraCards.length || 1;

  // Commissioning HVAC Tests Stats
  const obraChecklists = checklists.filter(c => c.obraId === activeObra?.id);
  const approvedTests = obraChecklists.filter(c => c.status === 'passed').length;
  const pendingTests = obraChecklists.filter(c => c.status === 'pending').length;
  const failedTests = obraChecklists.filter(c => c.status === 'failed').length;
  const totalChecklistsCount = obraChecklists.length || 1;

  // Hours per Operator breakdown
  const operatorStats = users.map(user => {
    let operatorHours = 0;
    obraCards.forEach(c => {
      (c.workedDays || []).forEach(w => {
        if (w.operatorId === user.id || w.operatorName === user.name) {
          operatorHours += (w.hours || 0);
        }
      });
    });
    const operatorCost = (operatorHours / 8) * (user.dailyRate || 250);
    return {
      user,
      hours: operatorHours,
      days: Math.round((operatorHours / 8) * 10) / 10,
      cost: operatorCost
    };
  });

  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (activeObra) {
      updateObraFinancials(activeObra.id, {
        initialBudget: parseFloat(editInitialBudget),
        addedBudget: parseFloat(editAddedBudget),
        materialCosts: parseFloat(editMaterialCosts)
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Relatórios Financeiros Executivos & KPIs</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Obra: <strong>{activeObra?.name || 'Selecione uma obra'}</strong></p>
          </div>
        </div>

        <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
          <Download size={14} /> Exportar Relatório PDF / Imprimir
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-blue)' }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Verba Total Alocada</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{formatBRL(totalBudget)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Inicial: {formatBRL(initialBudgetNum)}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Custo Mão de Obra</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatBRL(totalLaborCost)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{totalHours}h acumuladas ({daysSpent} dias)</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Custo com Materiais</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{formatBRL(materialCostsNum)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Dutos, Chillers e Insumos</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${remainingBalance >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}` }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Saldo Restante</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: remainingBalance >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{formatBRL(remainingBalance)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{budgetUsedPct}% da verba consumida</div>
        </div>
      </div>

      {/* Interactive Charts Section Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.25rem' }}>
        
        {/* Chart 1: Financial Budget vs Spent Breakdown */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} className="text-blue" /> Distribuição Financeira do Orçamento
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.25rem' }}>
                <span>Mão de Obra Integrada</span>
                <strong>{formatBRL(totalLaborCost)} ({totalBudget > 0 ? Math.round((totalLaborCost / totalBudget) * 100) : 0}%)</strong>
              </div>
              <div style={{ height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${totalBudget > 0 ? (totalLaborCost / totalBudget) * 100 : 0}%`, height: '100%', background: 'var(--accent-emerald)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.25rem' }}>
                <span>Materiais e Insumos</span>
                <strong>{formatBRL(materialCostsNum)} ({totalBudget > 0 ? Math.round((materialCostsNum / totalBudget) * 100) : 0}%)</strong>
              </div>
              <div style={{ height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${totalBudget > 0 ? (materialCostsNum / totalBudget) * 100 : 0}%`, height: '100%', background: 'var(--accent-amber)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.25rem' }}>
                <span>Saldo Disponível</span>
                <strong style={{ color: remainingBalance >= 0 ? 'var(--accent-blue)' : 'var(--accent-rose)' }}>
                  {formatBRL(remainingBalance)} ({totalBudget > 0 ? Math.round((Math.max(0, remainingBalance) / totalBudget) * 100) : 0}%)
                </strong>
              </div>
              <div style={{ height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${totalBudget > 0 ? (Math.max(0, remainingBalance) / totalBudget) * 100 : 0}%`, height: '100%', background: 'var(--accent-blue)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Kanban Tasks Status Breakdown */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} className="text-purple" /> Status das Tarefas Kanban ({obraCards.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.2rem' }}>
                <span>A Fazer</span>
                <strong>{todoCards} cards ({Math.round((todoCards / totalCardsCount) * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(todoCards / totalCardsCount) * 100}%`, height: '100%', background: 'var(--accent-blue)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.2rem' }}>
                <span>Em Andamento</span>
                <strong>{inProgressCards} cards ({Math.round((inProgressCards / totalCardsCount) * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(inProgressCards / totalCardsCount) * 100}%`, height: '100%', background: 'var(--accent-amber)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.2rem' }}>
                <span>Em Espera</span>
                <strong>{onHoldCards} cards ({Math.round((onHoldCards / totalCardsCount) * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(onHoldCards / totalCardsCount) * 100}%`, height: '100%', background: 'var(--accent-rose)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.2rem' }}>
                <span>Concluído</span>
                <strong>{completedCards} cards ({Math.round((completedCards / totalCardsCount) * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(completedCards / totalCardsCount) * 100}%`, height: '100%', background: 'var(--accent-emerald)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 3: Operator Productivity Breakdown Table & Chart */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} className="text-emerald" /> Apontamento de Mão de Obra & Custos por Operador
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {operatorStats.map(st => (
            <div key={st.user.id} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: st.user.avatarColor || '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                  {st.user.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{st.user.name}</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Diária: R$ {st.user.dailyRate}/dia | Cargo: {st.user.title || 'Técnico'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{st.hours}h ({st.days} dias)</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Horas acumuladas</div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '110px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatBRL(st.cost)}</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Custo gerado</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
