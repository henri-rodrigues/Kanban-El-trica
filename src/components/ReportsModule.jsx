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
  Briefcase,
  FileSpreadsheet,
  FileText,
  MapPin,
  Plane
} from 'lucide-react';

export const ReportsModule = () => {
  const { isAdmin, users } = useAuth();
  const { 
    activeObra, 
    cards, 
    checklists, 
    purchaseOrders,
    quadros,
    getCardEvolutionPct,
    getObraLaborCostsAndDays, 
    updateObraFinancials 
  } = useData();

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

  // 4 Budgets Calculations
  const matBudget = activeObra?.materialsBudget || 0;
  const indBudget = activeObra?.indirectsBudget || 0;
  const infBudget = activeObra?.infraBudget || 0;
  const labBudget = activeObra?.laborBudget || 0;
  const totalGeneralBudget = matBudget + indBudget + infBudget + labBudget || activeObra?.initialBudget || 1000000;

  // Actual Expenses By Category
  const obraPOs = purchaseOrders.filter(po => po.obraId === activeObra?.id);
  const totalMaterialsSpent = obraPOs.reduce((acc, curr) => acc + (parseFloat(curr.totalValue) || 0), 0);

  const scheduledTrips = activeObra?.scheduledTrips || [];
  const distanceKm = parseFloat(activeObra?.distanceKm) || 0;
  const totalTravelSpent = scheduledTrips.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);

  const totalSpentAll = totalLaborCost + totalMaterialsSpent + totalTravelSpent;
  const remainingGeneralBalance = totalGeneralBudget - totalSpentAll;

  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Kanban Cards breakdown
  const obraCards = cards.filter(c => c.obraId === activeObra?.id);
  const totalCardsCount = obraCards.length || 1;
  const todoCards = obraCards.filter(c => c.column === 'todo').length;
  const inProgressCards = obraCards.filter(c => c.column === 'in_progress').length;
  const onHoldCards = obraCards.filter(c => c.column === 'on_hold').length;
  const completedCards = obraCards.filter(c => c.column === 'completed').length;

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

  // Export 1: Download CSV/Excel Spreadsheet
  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
    csvContent += `RELATÓRIO EXECUTIVO DE OBRA - GESTÃO ELÉTRICA\n`;
    csvContent += `Obra:;${activeObra?.name || 'Geral'}\n`;
    csvContent += `Código:;${activeObra?.code || 'N/A'}\n`;
    csvContent += `Cliente:;${activeObra?.client || 'N/A'}\n`;
    csvContent += `Data de Geração:;${new Date().toLocaleDateString('pt-BR')}\n\n`;

    csvContent += `1. BALANÇO DAS 4 VERBAS\n`;
    csvContent += `Categoria;Verba Orçada (R$);Gasto Realizado (R$);Saldo Restante (R$)\n`;
    csvContent += `Mão de Obra;${labBudget};${totalLaborCost};${labBudget - totalLaborCost}\n`;
    csvContent += `Materiais;${matBudget};${totalMaterialsSpent};${matBudget - totalMaterialsSpent}\n`;
    csvContent += `Indiretos / Viagens;${indBudget};${totalTravelSpent};${indBudget - totalTravelSpent}\n`;
    csvContent += `Infraestrutura;${infBudget};0;${infBudget}\n`;
    csvContent += `TOTAL GERAL;${totalGeneralBudget};${totalSpentAll};${remainingGeneralBalance}\n\n`;

    csvContent += `2. APONTAMENTO DE OPERADORES\n`;
    csvContent += `Operador;Horas Trabalhadas;Dias (8h);Diária (R$);Custo Total (R$)\n`;
    operatorStats.forEach(st => {
      csvContent += `${st.user.name};${st.hours};${st.days};${st.user.dailyRate || 250};${st.cost}\n`;
    });
    csvContent += `\n3. PEDIDOS DE COMPRA / MATERIAIS\n`;
    csvContent += `Req Nº;Fornecedor;Data;Valor Total (R$)\n`;
    obraPOs.forEach(po => {
      csvContent += `${po.orderNumber || 'N/A'};${po.fornecedor};${po.date};${po.totalValue}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_Obra_${activeObra?.code || 'Gestão_Elétrica'}.csv`;
    link.click();
  };

  // Export 2: Download Power BI Data Model
  const handleExportPowerBI = () => {
    const powerBIData = {
      Fact_Obra: {
        id: activeObra?.id,
        name: activeObra?.name,
        code: activeObra?.code,
        client: activeObra?.client,
        distanceKm: distanceKm,
        totalGeneralBudget: totalGeneralBudget,
        materialsBudget: matBudget,
        indirectsBudget: indBudget,
        infraBudget: infBudget,
        laborBudget: labBudget,
        totalSpent: totalSpentAll,
        remainingBalance: remainingGeneralBalance
      },
      Fact_Materiais: obraPOs.map(po => ({
        id: po.id,
        reqNumber: po.orderNumber,
        fornecedor: po.fornecedor,
        date: po.date,
        totalValue: po.totalValue,
        itemsCount: (po.items || []).length
      })),
      Fact_MaoDeObra: operatorStats.map(op => ({
        operatorId: op.user.id,
        operatorName: op.user.name,
        hours: op.hours,
        days: op.days,
        dailyRate: op.user.dailyRate || 250,
        totalCost: op.cost
      })),
      Fact_KanbanPostIts: obraCards.map(c => ({
        id: c.id,
        title: c.title,
        column: c.column,
        priority: c.priority || 'Média',
        categoryTag: c.categoryTag || 'Geral'
      }))
    };

    const blob = new Blob([JSON.stringify(powerBIData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PowerBI_DataModel_${activeObra?.code || 'Obra'}.json`;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with 3 Export Buttons */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Dashboard Executivo & Relatórios Financeiros</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Obra: <strong>{activeObra?.name || 'Selecione uma obra'}</strong></p>
          </div>
        </div>

        {/* 3 Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} className="btn btn-secondary btn-sm" title="Gerar PDF de alta qualidade para impressão">
            <FileText size={14} className="text-blue" /> Exportar PDF
          </button>
          <button onClick={handleExportExcel} className="btn btn-secondary btn-sm" title="Baixar planilha formatada para Excel">
            <FileSpreadsheet size={14} className="text-emerald" /> Exportar Excel (.csv)
          </button>
          <button onClick={handleExportPowerBI} className="btn btn-primary btn-sm" title="Baixar modelo de dados para o Microsoft Power BI">
            <Zap size={14} /> Exportar Power BI (.json)
          </button>
        </div>
      </div>

      {/* 4 Budgets KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-blue)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>1. Verba Mão de Obra</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{formatBRL(labBudget)}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Gasto: <strong style={{ color: 'var(--accent-emerald)' }}>{formatBRL(totalLaborCost)}</strong> | Saldo: {formatBRL(labBudget - totalLaborCost)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>2. Verba de Materiais</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatBRL(matBudget)}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Gasto: <strong style={{ color: 'var(--accent-emerald)' }}>{formatBRL(totalMaterialsSpent)}</strong> | Saldo: {formatBRL(matBudget - totalMaterialsSpent)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>3. Verba Indiretos / Viagens</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{formatBRL(indBudget)}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Custo Viagens ({distanceKm}km): <strong style={{ color: 'var(--accent-amber)' }}>{formatBRL(totalTravelSpent)}</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>4. Verba Infraestrutura</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{formatBRL(infBudget)}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Saldo Alocado: <strong>{formatBRL(infBudget)}</strong>
          </div>
        </div>
      </div>

      {/* Summary Banner Total General Budget */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(16, 185, 129, 0.12))', border: '1px solid var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
            VERBA GERAL DO PROJETO (Soma das 4 Verbas)
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatBRL(totalGeneralBudget)}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Total Gasto Acumulado:</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-rose)' }}>{formatBRL(totalSpentAll)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Saldo Geral Restante:</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatBRL(remainingGeneralBalance)}</div>
          </div>
        </div>
      </div>

      {/* Operator Productivity Table */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={18} className="text-blue" /> Detalhamento de Apontamento e Diárias por Operador
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem' }}>Operador</th>
                <th style={{ padding: '0.6rem' }}>Horas Trabalhadas</th>
                <th style={{ padding: '0.6rem' }}>Equivalente em Dias</th>
                <th style={{ padding: '0.6rem' }}>Diária (R$)</th>
                <th style={{ padding: '0.6rem' }}>Custo Total (R$)</th>
                <th style={{ padding: '0.6rem' }}>Participação</th>
              </tr>
            </thead>
            <tbody>
              {operatorStats.map(st => (
                <tr key={st.user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {st.user.name}
                  </td>
                  <td style={{ padding: '0.65rem' }}>{st.hours}h</td>
                  <td style={{ padding: '0.65rem' }}>{st.days} dias</td>
                  <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>R$ {st.user.dailyRate || 250}/dia</td>
                  <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{formatBRL(st.cost)}</td>
                  <td style={{ padding: '0.65rem' }}>
                    <div style={{ width: '100px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${st.sharePct}%`, height: '100%', background: 'var(--accent-blue)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW: Report by Time Spent per Activity and Kickoff Stage */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={18} className="text-amber" /> Relatório de Tempo Gasto por Atividade e Etapa
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Contabilização a partir da Data Inicial da Obra ({activeObra?.startDate || 'Data Não Definida'}) até hoje
            </p>
          </div>
          <span className="badge badge-purple">
            {obraCards.length} Atividades Monitoradas
          </span>
        </div>

        {/* Kickoff Stages Time Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.08)', border: '1px solid var(--accent-blue)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 800, textTransform: 'uppercase' }}>
              🔵 Fase 1: Pré Kickoff-01 (Azul)
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.25rem' }}>
              {obraCards.filter(c => c.gradientId === 'cyan' || c.stagePhase === 'pre-kickoff-01').reduce((acc, curr) => {
                const hrs = (curr.workedDays || []).reduce((hAcc, w) => hAcc + (w.hours || 0), 0);
                return acc + hrs;
              }, 0)}h acumuladas
            </div>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid var(--accent-amber)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 800, textTransform: 'uppercase' }}>
              🟠 Fase 2: Entre Kickoff-01 e Kickoff-02 (Laranja)
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.25rem' }}>
              {obraCards.filter(c => c.gradientId === 'amber' || c.stagePhase === 'mid-kickoff').reduce((acc, curr) => {
                const hrs = (curr.workedDays || []).reduce((hAcc, w) => hAcc + (w.hours || 0), 0);
                return acc + hrs;
              }, 0)}h acumuladas
            </div>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--accent-emerald)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 800, textTransform: 'uppercase' }}>
              🟢 Fase 3: Pós Kickoff-02 (Verde)
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.25rem' }}>
              {obraCards.filter(c => c.gradientId === 'emerald' || c.stagePhase === 'post-kickoff-02').reduce((acc, curr) => {
                const hrs = (curr.workedDays || []).reduce((hAcc, w) => hAcc + (w.hours || 0), 0);
                return acc + hrs;
              }, 0)}h acumuladas
            </div>
          </div>
        </div>

        {/* Individual Activities Table */}
        <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Etapa / Atividade</th>
                <th style={{ padding: '0.5rem' }}>Fase Kickoff</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Horas Apontadas</th>
                <th style={{ padding: '0.5rem' }}>Operador Responsável</th>
              </tr>
            </thead>
            <tbody>
              {obraCards.map(c => {
                const hrs = (c.workedDays || []).reduce((acc, w) => acc + (w.hours || 0), 0);
                const isBlue = c.gradientId === 'cyan' || c.stagePhase === 'pre-kickoff-01';
                const isAmber = c.gradientId === 'amber' || c.stagePhase === 'mid-kickoff';

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.55rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {c.title}
                    </td>
                    <td style={{ padding: '0.55rem' }}>
                      <span className={`badge ${isBlue ? 'badge-blue' : (isAmber ? 'badge-amber' : 'badge-emerald')}`} style={{ fontSize: '0.65rem' }}>
                        {isBlue ? 'Pré Kickoff-01 (Azul)' : (isAmber ? 'Entre Kickoffs (Laranja)' : 'Pós Kickoff-02 (Verde)')}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem' }}>
                      <span className={`badge ${
                        c.column === 'completed' ? 'badge-emerald' : (c.column === 'in_progress' ? 'badge-amber' : 'badge-purple')
                      }`} style={{ fontSize: '0.65rem' }}>
                        {c.column === 'completed' ? 'Concluído' : (c.column === 'in_progress' ? 'Em Andamento' : 'A Fazer')}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem', fontWeight: 700, color: hrs > 0 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                      {hrs} horas
                    </td>
                    <td style={{ padding: '0.55rem', color: 'var(--text-secondary)' }}>
                      {c.assignedUserName || 'Não atribuído'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW: Detailed Report per Quadro & Infraestrutura */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Layers size={18} className="text-purple" /> Relatório Detalhado por Quadro & Infraestrutura
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {quadros.filter(q => q.obraId === activeObra?.id).map(quadro => {
            const qCards = cards.filter(c => c.quadroId === quadro.id);
            const totalQCards = qCards.length;
            const qEvolutionSum = qCards.reduce((acc, c) => acc + (getCardEvolutionPct ? getCardEvolutionPct(c.column) : 0), 0);
            const qProgress = totalQCards > 0 ? Math.round(qEvolutionSum / totalQCards) : 0;

            const qHours = qCards.reduce((acc, c) => {
              const cardHrs = (c.workedDays || []).reduce((hAcc, w) => hAcc + (w.hours || 0), 0);
              return acc + cardHrs;
            }, 0);
            const qDays = Math.round((qHours / 8) * 10) / 10;

            return (
              <div key={quadro.id} style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ⚡ {quadro.name}
                    </h4>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {totalQCards} Post-its no Quadro | Tempo Acumulado: <strong style={{ color: 'var(--accent-amber)' }}>{qDays} dias ({qHours}h)</strong> desde a Data Inicial ({activeObra?.startDate || 'Definida'})
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      Evolução: {qProgress}%
                    </span>
                    <div style={{ width: '120px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}>
                      <div style={{ width: `${qProgress}%`, height: '100%', background: 'var(--accent-emerald)' }} />
                    </div>
                  </div>
                </div>

                {/* Sub-table of cards in Quadro */}
                <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '0.35rem' }}>Post-it / Atividade</th>
                        <th style={{ padding: '0.35rem' }}>Coluna Atual</th>
                        <th style={{ padding: '0.35rem' }}>Nível de Evolução</th>
                        <th style={{ padding: '0.35rem' }}>Horas Trabalhadas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qCards.map(c => {
                        const cHrs = (c.workedDays || []).reduce((acc, w) => acc + (w.hours || 0), 0);
                        const cPct = getCardEvolutionPct ? getCardEvolutionPct(c.column) : 0;

                        return (
                          <tr key={c.id} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                            <td style={{ padding: '0.35rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</td>
                            <td style={{ padding: '0.35rem' }}>{c.column}</td>
                            <td style={{ padding: '0.35rem', fontWeight: 700, color: cPct === 100 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{cPct}%</td>
                            <td style={{ padding: '0.35rem' }}>{cHrs}h</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
