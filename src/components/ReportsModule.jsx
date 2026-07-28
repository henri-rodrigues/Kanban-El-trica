import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Lock, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Users, 
  Edit3, 
  Save, 
  Plus, 
  Printer,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626'];

export const ReportsModule = () => {
  const { isAdmin, switchRole, users, updateUserDailyRate } = useAuth();
  const { activeObra, activeQuadros, getObraLaborCostsAndDays, updateObraFinancials } = useData();

  // Obra Financial Edit Form State
  const [showEditFinancials, setShowEditFinancials] = useState(false);
  const [initialBudget, setInitialBudget] = useState(activeObra?.initialBudget || 1500000);
  const [addedBudget, setAddedBudget] = useState(activeObra?.addedBudget || 350000);
  const [materialCosts, setMaterialCosts] = useState(activeObra?.materialCosts || 720000);
  const [plannedDays, setPlannedDays] = useState(activeObra?.plannedDays || 120);

  // User rate edit state
  const [editingRates, setEditingRates] = useState({});

  if (!isAdmin) {
    return (
      <div 
        className="glass-panel animate-fade-in"
        style={{
          padding: '2.5rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          maxWidth: '550px',
          margin: '2rem auto',
          border: '1px solid var(--accent-rose)'
        }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(220, 38, 38, 0.15)',
          color: 'var(--accent-rose)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          marginBottom: '0.85rem'
        }}>
          <Lock size={28} />
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Acesso Exclusivo ao Administrador
        </h2>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          O painel de controle financeiro, custos de mão de obra por operador e verbas é de acesso restrito ao perfil de Administrador.
        </p>

        <button 
          onClick={() => switchRole('administrador')} 
          className="btn btn-primary"
        >
          🛡️ Alternar para Administrador
        </button>
      </div>
    );
  }

  // Calculate dynamic labor costs and days spent for active Obra
  const { totalLaborCost, daysSpent } = getObraLaborCostsAndDays(activeObra?.id);
  const totalBudget = (parseFloat(initialBudget) || 0) + (parseFloat(addedBudget) || 0);
  const totalCosts = (parseFloat(materialCosts) || 0) + totalLaborCost;
  const balance = totalBudget - totalCosts;
  const isOverBudget = totalCosts > totalBudget;

  const handleSaveObraFinancials = (e) => {
    e.preventDefault();
    updateObraFinancials(activeObra.id, {
      initialBudget: parseFloat(initialBudget) || 0,
      addedBudget: parseFloat(addedBudget) || 0,
      materialCosts: parseFloat(materialCosts) || 0,
      plannedDays: parseInt(plannedDays) || 0
    });
    setShowEditFinancials(false);
  };

  const handleSaveUserRate = (userId, newRate) => {
    updateUserDailyRate(userId, newRate);
  };

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Chart Data 1: Budget Breakdown vs Realized Costs
  const costBreakdownData = [
    { categoria: 'Verba Inicial', valor: initialBudget },
    { categoria: 'Verbas Adicionais', valor: addedBudget },
    { categoria: 'Materiais & Equip.', valor: materialCosts },
    { categoria: 'Mão de Obra (Operadores)', valor: Math.round(totalLaborCost) }
  ];

  // Chart Data 2: Planned Days vs Days Spent
  const daysData = [
    { item: 'Dias Planejados', dias: plannedDays },
    { item: 'Dias Gastos/Trabalhados', dias: daysSpent }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Header Banner */}
      <div className="glass-panel" style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-purple">Painel Financeiro & Orçamento</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Obra: {activeObra?.name}</span>
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.15rem' }}>
            Gestão de Custos, Mão de Obra e Dias Planejados
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setShowEditFinancials(!showEditFinancials)} className="btn btn-primary btn-sm">
            <Edit3 size={14} /> Editar Verbas & Materiais
          </button>
          <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
            <Printer size={14} /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* Admin Financial Editor Modal/Form */}
      {showEditFinancials && (
        <form onSubmit={handleSaveObraFinancials} className="glass-panel animate-fade-in" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-blue)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-blue)' }}>
            🛠️ Editar Orçamento e Prazos da Obra: {activeObra?.name}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label>Verba Inicial Aprovada (R$)</label>
              <input type="number" step="1000" className="form-control" value={initialBudget} onChange={(e) => setInitialBudget(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Verbas Adicionais / Aditivos (R$)</label>
              <input type="number" step="1000" className="form-control" value={addedBudget} onChange={(e) => setAddedBudget(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Custos com Materiais (R$)</label>
              <input type="number" step="1000" className="form-control" value={materialCosts} onChange={(e) => setMaterialCosts(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Dias Planejados (Prazo)</label>
              <input type="number" step="1" className="form-control" value={plannedDays} onChange={(e) => setPlannedDays(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => setShowEditFinancials(false)} className="btn btn-secondary btn-sm">Cancelar</button>
            <button type="submit" className="btn btn-accent btn-sm"><Save size={14} /> Salvar Orçamento</button>
          </div>
        </form>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        {/* Card 1: Verba Total */}
        <div className="glass-panel" style={{ padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Verba Total (Inicial + Aditivos)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatBRL(totalBudget)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
            Inicial: {formatBRL(initialBudget)} | Aditivos: {formatBRL(addedBudget)}
          </div>
        </div>

        {/* Card 2: Custos de Materiais */}
        <div className="glass-panel" style={{ padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Custos com Materiais</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{formatBRL(materialCosts)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Equipamentos, tubos e insumos</div>
        </div>

        {/* Card 3: Custos de Mão de Obra */}
        <div className="glass-panel" style={{ padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Mão de Obra (Calculado)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatBRL(totalLaborCost)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Calculado dos apontamentos de campo</div>
        </div>

        {/* Card 4: Saldo Final */}
        <div className="glass-panel" style={{ padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Saldo Disponível</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isOverBudget ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
            {formatBRL(balance)}
          </div>
          <div style={{ fontSize: '0.7rem', color: isOverBudget ? 'var(--accent-rose)' : 'var(--accent-emerald)', marginTop: '0.2rem' }}>
            {isOverBudget ? '⚠️ Estouro Orçamentário' : '✓ Orçamento em Dia'}
          </div>
        </div>

        {/* Card 5: Prazos / Dias */}
        <div className="glass-panel" style={{ padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Dias Planejados vs Gastos</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
            {daysSpent} / {plannedDays} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>dias</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {Math.round((daysSpent / (plannedDays || 1)) * 100)}% do prazo consumido
          </div>
        </div>
      </div>

      {/* Admin User Rate Manager Panel */}
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={16} className="text-blue" /> Configuração de Valor da Diária (R$/dia) por Operador/Usuário
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.75rem' }}>
          {users.map(u => (
            <div key={u.id} style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)' }}>{u.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.title}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>R$</span>
                <input
                  type="number"
                  step="10"
                  style={{ width: '80px', padding: '0.25rem 0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={editingRates[u.id] !== undefined ? editingRates[u.id] : u.dailyRate}
                  onChange={(e) => setEditingRates({ ...editingRates, [u.id]: e.target.value })}
                  onBlur={() => handleSaveUserRate(u.id, editingRates[u.id] !== undefined ? editingRates[u.id] : u.dailyRate)}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/dia</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '0.85rem' }}>
        {/* Chart 1: Cost Breakdown */}
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            📊 Composição Financeira da Obra (R$)
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="categoria" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
                <Bar dataKey="valor" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Planned vs Spent Days */}
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            ⏳ Comparativo de Prazos: Dias Planejados vs Dias Trabalhados
          </h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daysData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="item" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
                <Bar dataKey="dias" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
