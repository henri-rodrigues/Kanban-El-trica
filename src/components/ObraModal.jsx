import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { X, Building2, Layers, Plus } from 'lucide-react';

export const ObraModal = ({ isOpen, type, onClose }) => {
  const { addObra, addQuadro, activeObra } = useData();

  // Obra Form State
  const [obraName, setObraName] = useState('');
  const [obraCode, setObraCode] = useState('');
  const [obraClient, setObraClient] = useState('');
  const [obraBudget, setObraBudget] = useState('1500000');

  // Quadro Form State
  const [quadroName, setQuadroName] = useState('');
  const [quadroCategory, setQuadroCategory] = useState('HVAC Chiller');
  const [quadroLocation, setQuadroLocation] = useState('Casa de Máquinas');
  const [quadroDesc, setQuadroDesc] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'obra') {
      if (!obraName) return;
      addObra({
        name: obraName,
        code: obraCode || `OBR-${Date.now().toString().slice(-4)}`,
        client: obraClient || 'Cliente Corporativo',
        budget: parseFloat(obraBudget) || 1000000,
        status: 'Em Andamento'
      });
      setObraName('');
    } else {
      if (!quadroName) return;
      addQuadro({
        name: quadroName,
        category: quadroCategory,
        location: quadroLocation,
        description: quadroDesc
      });
      setQuadroName('');
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '500px',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          border: '1px solid var(--border-highlight)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {type === 'obra' ? (
              <Building2 className="text-blue" size={24} />
            ) : (
              <Layers className="text-indigo" size={24} />
            )}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {type === 'obra' ? 'Cadastrar Nova Obra' : `Novo Quadro em: ${activeObra?.name}`}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {type === 'obra' ? (
            <>
              <div className="form-group">
                <label>Nome da Obra *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Centro Logístico Anhanguera"
                  className="form-control"
                  value={obraName}
                  onChange={(e) => setObraName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Código do Projeto</label>
                  <input
                    type="text"
                    placeholder="OBR-2026-CLA"
                    className="form-control"
                    value={obraCode}
                    onChange={(e) => setObraCode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Cliente</label>
                  <input
                    type="text"
                    placeholder="Cliente / Empreendedor"
                    className="form-control"
                    value={obraClient}
                    onChange={(e) => setObraClient(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Verba Alocada (R$)</label>
                <input
                  type="number"
                  step="10000"
                  className="form-control"
                  value={obraBudget}
                  onChange={(e) => setObraBudget(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Nome do Quadro / Subnível *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CAG-02 - Chiller Secundário"
                  className="form-control"
                  value={quadroName}
                  onChange={(e) => setQuadroName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    className="form-control"
                    value={quadroCategory}
                    onChange={(e) => setQuadroCategory(e.target.value)}
                  >
                    <option value="HVAC Chiller">HVAC Chiller</option>
                    <option value="HVAC Precisão">HVAC Precisão</option>
                    <option value="Filtragem & Ar Limpo">Filtragem & Ar Limpo</option>
                    <option value="Painel Elétrico">Painel Elétrico</option>
                    <option value="Automação & Segurança">Automação & Segurança</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Localização na Obra</label>
                  <input
                    type="text"
                    placeholder="Ex: Sala Limpa Bloco B"
                    className="form-control"
                    value={quadroLocation}
                    onChange={(e) => setQuadroLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descrição e Especificações Técnicas</label>
                <textarea
                  className="form-control"
                  placeholder="Resumo dos equipamentos e objetivos de comissionamento..."
                  value={quadroDesc}
                  onChange={(e) => setQuadroDesc(e.target.value)}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> {type === 'obra' ? 'Criar Obra' : 'Criar Quadro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
