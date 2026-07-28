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
  Calendar,
  CheckSquare,
  Award,
  Zap,
  Activity,
  Briefcase
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

  // Projection calculation
  const plannedDays = activeObra?.plannedDays || 90;
  const dailyCostRate = daysSpent > 0 ? totalLaborCost / daysSpent : 0;
  const projectedLaborCost = Math.round(dailyCostRate * plannedDays);
  const projectedTotalCost = projectedLaborCost + materialCostsNum;

  // Kanban Cards breakdown
  const obraCards = cards.filter(c => c.obraId === activeObra?.id);
  const totalCardsCount = obraCards.length || 1;
  const todoCards = obraCards.filter(c => c.column === 'todo').length;
  const inProgressCards = obraCards.filter(c => c.column === 'in_progress').length;
  const onHoldCards = obraCards.filter(c => c.column === 'on_hold').length;
  const completedCards = obraCards.filter(c => c.column === 'completed').length;

  // Priorities Breakdown
  const highPriorityCount = obraCards.filter(c => c.priority === 'Alta').length;
  const medPriorityCount = obraCards.filter(c => c.priority === 'Média' || !c.priority).length;
  const lowPriorityCount = obraCards.filter(c => c.priority === 'Baixa').length;

  // Subtasks Efficiency
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  obraCards.forEach(c => {
    (c.subtasks || []).forEach(st => {
      totalSubtasks++;
      if (st.completed) completedSubtasks++;
    });
  });
  const subtaskPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // HVAC Commissioning Tests Stats
  const obraChecklists = checklists.filter(c => c.obraId === activeObra?.id);
  const totalChecklistsCount = obraChecklists.length || 1;
  const approvedTests = obraChecklists.filter(c => c.status === 'passed').length;
  const pendingTests = obraChecklists.filter(c => c.status === 'pending').length;
  const failedTests = obraChecklists.filter(c => c.status === 'failed').length;

  // Operator Detailed Productivity
  const operatorStats = users.map(user => {
    let operatorHours = 0;
    let logsCount = 0;
    obraCards.forEach(c => {
      (c.workedDays || []).forEach(w => {
        if (w.operatorId === user.id || w.operatorName === user.name) {
          operatorHours += (w.hours || 0);
          logsCount++;
        }
      });
    });
    const operatorDays = Math.round((operatorHours / 8) * 10) / 10;
    const operatorCost = (operatorHours / 8) * (user.dailyRate || 250);
    const maxHoursInObra = totalHours || 1;
    const sharePct = Math.round((operatorHours / maxHoursInObra) * 100);

    return {
      user,
      hours: operatorHours,
      days: operatorDays,
      cost: operatorCost,
      logsCount,
      sharePct
    };
  });

  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Dashboard de Produtividade & Relatórios Executivos</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Obra: <strong>{activeObra?.name || 'Selecione uma obra'}</strong></p>
          </div>
        </div>

        <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
          <Download size={14} /> Imprimir / Salvar Relatório PDF
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
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Mão de Obra Acumulada</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatBRL(totalLaborCost)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{totalHours}h ({daysSpent} dias trabalhados)</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Custo com Materiais</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{formatBRL(materialCostsNum)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Insumos & Equipamentos</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${remainingBalance >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}` }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Saldo Restante</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: remainingBalance >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{formatBRL(remainingBalance)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{budgetUsedPct}% da verba utilizada</div>
        </div>
      </div>

      {/* Interactive Section 1: Financial Projection & Budget Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.25rem' }}>
        
        {/* Chart: Budget vs Spent */}
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

        {/* Financial Projections Simulator */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} className="text-emerald" /> Projeção de Custo Final da Obra
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Custo Diário Médio de Mão de Obra:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatBRL(dailyCostRate)} / dia</div>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projeção de Mão de Obra ({plannedDays} dias planejados):</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{formatBRL(projectedLaborCost)}</div>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Custo Total Estimado ao Término:</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: projectedTotalCost <= totalBudget ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {formatBRL(projectedTotalCost)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Section 2: Detailed Operator Productivity (Days & Hours) */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} className="text-emerald" /> Ranking de Produtividade & Dias Trabalhados por Técnico
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {operatorStats.map(st => (
            <div key={st.user.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: st.user.avatarColor || '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                    {st.user.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{st.user.name}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Cargo: {st.user.title || 'Técnico'} | Diária: R$ {st.user.dailyRate}/dia
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                      📅 {st.days} Dias ({st.hours}h)
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{st.logsCount} apontamentos registrados</div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '110px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatBRL(st.cost)}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Custo gerado</div>
                  </div>
                </div>
              </div>

              {/* Individual Productivity Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <span>Participação na mão de obra da obra</span>
                  <span>{st.sharePct}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${st.sharePct}%`, height: '100%', background: st.user.userColorTag || 'var(--accent-blue)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Section 3: Task Status, Priorities & HVAC Commissioning */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        
        {/* Kanban Task Status Breakdown */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} className="text-purple" /> Status das Tarefas Kanban ({obraCards.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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

        {/* Subtasks Completion & Priorities */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={18} className="text-emerald" /> Eficiência de Subtarefas ({completedSubtasks}/{totalSubtasks})
          </h3>

          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{subtaskPct}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subtarefas executadas e verificadas</div>
          </div>

          <div style={{ height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ width: `${subtaskPct}%`, height: '100%', background: 'var(--accent-emerald)' }} />
          </div>

          <h4 style={{ fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Prioridades das Tarefas:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textOverflow: 'ellipsis' }}>
            <div style={{ background: 'var(--bg-main)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 800, color: 'var(--accent-rose)' }}>{highPriorityCount}</div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Alta</div>
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 800, color: 'var(--accent-amber)' }}>{medPriorityCount}</div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Média</div>
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 800, color: 'var(--accent-blue)' }}>{lowPriorityCount}</div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Baixa</div>
            </div>
          </div>
        </div>

        {/* HVAC Commissioning Tests Stats */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} className="text-amber" /> Testes de Comissionamento HVAC ({obraChecklists.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.2rem' }}>
                <span>Aprovados / Passed</span>
                <strong style={{ color: 'var(--accent-emerald)' }}>{approvedTests} testes ({Math.round((approvedTests / totalChecklistsCount) * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(approvedTests / totalChecklistsCount) * 100}%`, height: '100%', background: 'var(--accent-emerald)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.2rem' }}>
                <span>Pendentes</span>
                <strong style={{ color: 'var(--accent-amber)' }}>{pendingTests} testes ({Math.round((pendingTests / totalChecklistsCount) * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(pendingTests / totalChecklistsCount) * 100}%`, height: '100%', background: 'var(--accent-amber)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.2rem' }}>
                <span>Reprovados / Falha</span>
                <strong style={{ color: 'var(--accent-rose)' }}>{failedTests} testes ({Math.round((failedTests / totalChecklistsCount) * 100)}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(failedTests / totalChecklistsCount) * 100}%`, height: '100%', background: 'var(--accent-rose)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
