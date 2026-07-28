import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { X, Building2, Layers, Check, Users } from 'lucide-react';

export const ObraModal = ({ isOpen, type, onClose }) => {
  const { isAdmin, users } = useAuth();
  const { addObra, addQuadro } = useData();

  // Obra Form State
  const [obraName, setObraName] = useState('');
  const [obraCode, setObraCode] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [initialBudget, setInitialBudget] = useState('1000000');
  const [materialCosts, setMaterialCosts] = useState('0');
  const [plannedDays, setPlannedDays] = useState('90');
  const [assignedUserIds, setAssignedUserIds] = useState([]);

  // Quadro Form State
  const [quadroName, setQuadroName] = useState('');
  const [subsystem, setSubsystem] = useState('HVAC & Climatização');

  if (!isOpen) return null;

  const toggleUserAssignment = (userId) => {
    setAssignedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateObra = (e) => {
    e.preventDefault();
    if (!obraName) return;
    addObra({
      name: obraName,
      code: obraCode || `OB-${Math.floor(Math.random() * 900 + 100)}`,
      client,
      location,
      initialBudget,
      materialCosts,
      plannedDays,
      assignedUserIds: assignedUserIds.length > 0 ? assignedUserIds : users.map(u => u.id)
    });
    setObraName('');
    onClose();
  };

  const handleCreateQuadro = (e) => {
    e.preventDefault();
    if (!quadroName) return;
    addQuadro({
      name: quadroName,
      subsystem
    });
    setQuadroName('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          position: 'relative'
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        {type === 'obra' ? (
          /* Obra Creation Form (Admin Only) */
          <form onSubmit={handleCreateObra}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Building2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Cadastrar Nova Obra (Admin)</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Defina o nome, orçamento e atribua os usuários autorizados</p>
              </div>
            </div>

            <div className="form-group">
              <label>Nome da Obra *</label>
              <input type="text" required placeholder="Ex: Hospital Central - Bloco Cirúrgico" className="form-control" value={obraName} onChange={(e) => setObraName(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group">
                <label>Código do Projeto</label>
                <input type="text" placeholder="OB-101" className="form-control" value={obraCode} onChange={(e) => setObraCode(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Cliente</label>
                <input type="text" placeholder="Ex: Grupo Hospitalar" className="form-control" value={client} onChange={(e) => setClient(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Localização / Cidade</label>
              <input type="text" placeholder="Ex: São Paulo, SP" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            {/* Financials (Admin Only) */}
            {isAdmin && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label>Verba Inicial (R$)</label>
                  <input type="number" className="form-control" value={initialBudget} onChange={(e) => setInitialBudget(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Materiais (R$)</label>
                  <input type="number" className="form-control" value={materialCosts} onChange={(e) => setMaterialCosts(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Dias Planejados</label>
                  <input type="number" className="form-control" value={plannedDays} onChange={(e) => setPlannedDays(e.target.value)} />
                </div>
              </div>
            )}

            {/* User Access Assignment (ACL) */}
            <div style={{ marginTop: '0.75rem', marginBottom: '1.25rem', background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Users size={15} /> Usuários Autorizados a Acessar Esta Obra
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {users.map(u => {
                  const isChecked = assignedUserIds.includes(u.id);
                  return (
                    <div 
                      key={u.id}
                      onClick={() => toggleUserAssignment(u.id)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: '4px',
                        border: isChecked ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                        background: isChecked ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.775rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.avatarColor || '#0284c7' }} />
                        <span><strong>{u.name}</strong> ({u.title || u.role})</span>
                      </div>
                      {isChecked && <Check size={14} className="text-blue" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Cadastrar Obra
            </button>
          </form>
        ) : (
          /* Quadro Creation Form */
          <form onSubmit={handleCreateQuadro}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Layers size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Adicionar Quadro / Subnível</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crie um quadro técnico para organizar post-its deste sistema</p>
              </div>
            </div>

            <div className="form-group">
              <label>Nome do Quadro *</label>
              <input type="text" required placeholder="Ex: QTA-01 Painel de Transferência" className="form-control" value={quadroName} onChange={(e) => setQuadroName(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Subsistema / Especialidade</label>
              <select className="form-control" value={subsystem} onChange={(e) => setSubsystem(e.target.value)}>
                <option value="HVAC & Climatização">HVAC & Climatização</option>
                <option value="Elétrica & Automação">Elétrica & Automação</option>
                <option value="Hidráulica & Incêndio">Hidráulica & Incêndio</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Criar Quadro
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
