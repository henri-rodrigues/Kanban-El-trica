import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { X, Building2, Layers, Check, Users, Edit3, DollarSign, MapPin } from 'lucide-react';

export const ObraModal = ({ isOpen, type, editingObra, onClose }) => {
  const { isAdmin, users } = useAuth();
  const { addObra, updateObra, addQuadro } = useData();

  // Obra Form State
  const [obraName, setObraName] = useState('');
  const [obraCode, setObraCode] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [plannedDays, setPlannedDays] = useState('90');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [distanceKm, setDistanceKm] = useState('120');

  // 4 Manual Budget Breakdown States
  const [materialsBudget, setMaterialsBudget] = useState('300000');
  const [indirectsBudget, setIndirectsBudget] = useState('100000');
  const [infraBudget, setInfraBudget] = useState('200000');
  const [laborBudget, setLaborBudget] = useState('400000');

  const [assignedUserIds, setAssignedUserIds] = useState([]);

  // Quadro Form State
  const [quadroName, setQuadroName] = useState('');

  useEffect(() => {
    if (editingObra && (type === 'edit_obra' || type === 'obra')) {
      setObraName(editingObra.name || '');
      setObraCode(editingObra.code || '');
      setClient(editingObra.client || '');
      setLocation(editingObra.location || '');
      setPlannedDays(editingObra.plannedDays?.toString() || '90');
      setStartDate(editingObra.startDate || new Date().toISOString().split('T')[0]);
      setDistanceKm(editingObra.distanceKm?.toString() || '120');

      setMaterialsBudget((editingObra.materialsBudget !== undefined ? editingObra.materialsBudget : 300000).toString());
      setIndirectsBudget((editingObra.indirectsBudget !== undefined ? editingObra.indirectsBudget : 100000).toString());
      setInfraBudget((editingObra.infraBudget !== undefined ? editingObra.infraBudget : 200000).toString());
      setLaborBudget((editingObra.laborBudget !== undefined ? editingObra.laborBudget : 400000).toString());

      setAssignedUserIds(editingObra.assignedUserIds || []);
    } else {
      setObraName('');
      setObraCode('');
      setClient('');
      setLocation('');
      setPlannedDays('90');
      setStartDate(new Date().toISOString().split('T')[0]);
      setDistanceKm('120');
      setMaterialsBudget('300000');
      setIndirectsBudget('100000');
      setInfraBudget('200000');
      setLaborBudget('400000');
      setAssignedUserIds([]);
    }
  }, [editingObra, type, isOpen]);

  if (!isOpen) return null;

  const matB = parseFloat(materialsBudget) || 0;
  const indB = parseFloat(indirectsBudget) || 0;
  const infB = parseFloat(infraBudget) || 0;
  const labB = parseFloat(laborBudget) || 0;
  const totalGeneralBudget = matB + indB + infB + labB;

  const distKmNum = parseFloat(distanceKm) || 0;
  const estimatedTravelCost = distKmNum * 1.5;

  const toggleUserAssignment = (userId) => {
    setAssignedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const isEditing = type === 'edit_obra' && editingObra;

  const handleSaveObra = (e) => {
    e.preventDefault();
    if (!obraName) return;

    const payload = {
      name: obraName,
      code: obraCode || (isEditing ? editingObra.code : `OB-${Math.floor(Math.random() * 900 + 100)}`),
      client,
      location,
      startDate: startDate || new Date().toISOString().split('T')[0],
      plannedDays: parseInt(plannedDays) || 90,
      distanceKm: distKmNum,
      materialsBudget: matB,
      indirectsBudget: indB,
      infraBudget: infB,
      laborBudget: labB,
      initialBudget: totalGeneralBudget,
      assignedUserIds: assignedUserIds.length > 0 ? assignedUserIds : users.map(u => u.id)
    };

    if (isEditing) {
      updateObra(editingObra.id, payload);
    } else {
      addObra(payload);
    }

    setObraName('');
    onClose();
  };

  const handleCreateQuadro = (e) => {
    e.preventDefault();
    if (!quadroName) return;
    addQuadro({
      name: quadroName
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
          maxWidth: '580px',
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

        {type === 'obra' || type === 'edit_obra' ? (
          /* Obra Creation & Editing Form (Admin Only) */
          <form onSubmit={handleSaveObra}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isEditing ? 'var(--accent-indigo)' : 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {isEditing ? <Edit3 size={22} /> : <Building2 size={24} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  {isEditing ? `Editar Obra: ${editingObra.name}` : 'Cadastrar Nova Obra'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isEditing 
                    ? 'Defina o nome, alocação das 4 verbas, distância e permissões de equipe' 
                    : 'Configure os orçamentos por categoria e equipe vinculada'}
                </p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group">
                <label>Data Inicial da Obra *</label>
                <input type="date" required className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Prazo Estimado (Dias) *</label>
                <input type="number" required className="form-control" value={plannedDays} onChange={(e) => setPlannedDays(e.target.value)} />
              </div>
            </div>

            {/* Distance & Travel Cost Section */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <MapPin size={15} className="text-amber" /> Distância da Obra & Custo Estimado de Viagem (R$ 1,50/km)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '0.725rem' }}>Distância Ida e Volta (km)</label>
                  <input type="number" className="form-control" style={{ fontSize: '0.8rem' }} value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="120" />
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Custo Viagem / Deslocamento</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                    R$ {estimatedTravelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Budgets Manual Entry Section */}
            {isAdmin && (
              <div style={{ marginBottom: '1.25rem', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(2, 132, 199, 0.06)', border: '1px solid var(--accent-blue)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <DollarSign size={16} /> Divisão das 4 Verbas da Obra
                  </label>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    Verba Geral: R$ {totalGeneralBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.725rem', fontWeight: 600 }}>1. Verba de Materiais (R$)</label>
                    <input type="number" className="form-control" style={{ fontSize: '0.8rem' }} value={materialsBudget} onChange={(e) => setMaterialsBudget(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.725rem', fontWeight: 600 }}>2. Verba de Indiretos (R$)</label>
                    <input type="number" className="form-control" style={{ fontSize: '0.8rem' }} value={indirectsBudget} onChange={(e) => setIndirectsBudget(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.725rem', fontWeight: 600 }}>3. Verba de Infraestrutura (R$)</label>
                    <input type="number" className="form-control" style={{ fontSize: '0.8rem' }} value={infraBudget} onChange={(e) => setInfraBudget(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.725rem', fontWeight: 600 }}>4. Verba Mão de Obra (R$)</label>
                    <input type="number" className="form-control" style={{ fontSize: '0.8rem' }} value={laborBudget} onChange={(e) => setLaborBudget(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Assigned Users / ACL Access Permission Selector */}
            <div style={{ marginTop: '0.75rem', marginBottom: '1.25rem', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <Users size={15} className="text-blue" /> Participantes Autorizados nesta Obra
              </label>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                Selecione os integrantes da equipe que poderão acessar a obra e a agenda de viagens.
              </p>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {users.map(u => {
                  const isAssigned = assignedUserIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUserAssignment(u.id)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: isAssigned ? `2px solid ${u.userColorTag || 'var(--accent-blue)'}` : '1px solid var(--border-color)',
                        background: isAssigned ? `${u.userColorTag || 'var(--accent-blue)'}25` : 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.userColorTag || 'var(--accent-blue)' }} />
                      <span>{u.name} ({u.role === 'admin' ? 'Admin' : 'Operador'})</span>
                      {isAssigned && <Check size={12} className="text-emerald" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontWeight: 700 }}>
              {isEditing ? 'Salvar Alterações da Obra' : 'Criar Obra'}
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
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gera automaticamente 26 post-its padronizados do projeto</p>
              </div>
            </div>

            <div className="form-group">
              <label>Nome do Quadro *</label>
              <input type="text" required placeholder="Ex: QTA-01 Painel de Transferência Geral" className="form-control" value={quadroName} onChange={(e) => setQuadroName(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', fontWeight: 700 }}>
              Criar Quadro & Gerar 26 Post-its Padronizados
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
