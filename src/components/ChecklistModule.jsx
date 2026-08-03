import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Image as ImageIcon, 
  ShieldCheck, 
  SlidersHorizontal,
  Flame,
  Wind,
  Droplets,
  Zap,
  Paperclip
} from 'lucide-react';

export const ChecklistModule = () => {
  const { currentUser, isAdmin } = useAuth();
  const { activeObra, activeQuadros, checklists, updateChecklistStatus, addChecklistItem } = useData();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New checklist item form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('HVAC - Balanço & TAB');
  const [newQuadroId, setNewQuadroId] = useState(activeQuadros[0]?.id || '');
  const [newDescription, setNewDescription] = useState('');

  const filteredChecklists = checklists.filter(item => {
    if (item.obraId !== activeObra?.id) return false;
    if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) return false;
    return true;
  });

  const totalItems = filteredChecklists.length;
  const passedItems = filteredChecklists.filter(i => i.status === 'pass').length;
  const failedItems = filteredChecklists.filter(i => i.status === 'fail').length;
  const pendingItems = filteredChecklists.filter(i => i.status === 'pending').length;
  const completionRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newTitle) return;
    addChecklistItem({
      title: newTitle,
      category: newCategory,
      quadroId: newQuadroId,
      description: newDescription
    });
    setNewTitle('');
    setNewDescription('');
    setShowAddForm(false);
  };

  const handleEvidenceUpload = (checkId, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateChecklistStatus(checkId, 'pass', undefined, reader.result, currentUser);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.4rem',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}>
            <ShieldCheck size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-emerald">Comissionamento HVAC & Elétrica</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeObra?.name}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.15rem' }}>
              Checklist Dinâmico de Testes e Aceitação
            </h2>
          </div>
        </div>

        {/* Status Gauge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taxa de Conclusão</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              {completionRate}%
            </div>
          </div>

          <div style={{ width: '120px', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #38bdf8)' }} />
          </div>

          {isAdmin ? (
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary btn-sm">
              <Plus size={15} /> Personalizar Checklist (Admin)
            </button>
          ) : (
            <div className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
              ℹ️ Execução liberada para Usuário
            </div>
          )}
        </div>
      </div>

      {/* Admin Custom Checklist Template Form */}
      {isAdmin && showAddForm && (
        <form 
          onSubmit={handleAddItem}
          className="glass-panel animate-fade-in" 
          style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-indigo)' }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-indigo)' }}>
            🛠️ Adicionar Novo Teste ao Checklist (Administrador)
          </h3>

          <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Nome do Teste / Verificação *</label>
              <input
                type="text"
                required
                placeholder="Ex: Calibração de Atuadores VAV e Teste de Vazão Mínima"
                className="form-control"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Categoria HVAC</label>
              <select className="form-control" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                <option value="HVAC - Balanço & TAB">HVAC - Balanço & TAB</option>
                <option value="HVAC - Chillers & Compressores">HVAC - Chillers & Compressores</option>
                <option value="HVAC - Filtragem & Ar Limpo">HVAC - Filtragem & Ar Limpo</option>
                <option value="Automação & Segurança (SDAI)">Automação & Segurança (SDAI)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Quadro / Subnível Vinculado</label>
              <select className="form-control" value={newQuadroId} onChange={(e) => setNewQuadroId(e.target.value)}>
                {activeQuadros.map(q => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Procedimento Técnico e Tolerâncias</label>
            <input
              type="text"
              placeholder="Descreva o procedimento exato de teste..."
              className="form-control"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button type="submit" className="btn btn-accent btn-sm">
              Adicionar Teste ao Checklist
            </button>
          </div>
        </form>
      )}

      {/* Category Filters Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'all', label: 'Todos os Testes HVAC' },
          { id: 'HVAC - Balanço & TAB', label: '💨 TAB & Vazão' },
          { id: 'HVAC - Chillers & Compressores', label: '❄️ Chillers & CAG' },
          { id: 'HVAC - Filtragem & Ar Limpo', label: '🏥 Filtragem & Salas Limpas' },
          { id: 'Automação & Segurança (SDAI)', label: '🔥 Automação & Incêndio' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryFilter(cat.id)}
            className="btn btn-sm"
            style={{
              background: selectedCategoryFilter === cat.id ? 'var(--accent-indigo)' : 'var(--bg-card)',
              borderColor: selectedCategoryFilter === cat.id ? 'var(--accent-indigo)' : 'var(--border-color)',
              color: selectedCategoryFilter === cat.id ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Checklist Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredChecklists.map((check) => {
          const quadro = activeQuadros.find(q => q.id === check.quadroId);

          return (
            <div 
              key={check.id}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                borderLeft: check.status === 'pass' 
                  ? '5px solid var(--accent-emerald)' 
                  : check.status === 'fail' 
                  ? '5px solid var(--accent-rose)' 
                  : '5px solid var(--accent-amber)'
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    {check.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                    ⚡ {quadro?.name || 'Quadro Geral'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  {check.title}
                </h3>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                  {check.description}
                </p>

                {/* Evidence & Stamp Info */}
                {check.testedBy && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span>✍️ Testado por: <strong style={{ color: 'var(--text-primary)' }}>{check.testedBy}</strong></span>
                    <span>📅 Data: <strong style={{ color: 'var(--text-primary)' }}>{check.testedDate}</strong></span>
                    {check.notes && <span>💬 Nota: <em>"{check.notes}"</em></span>}
                  </div>
                )}

                {/* Evidence Image Attachment */}
                {check.evidenceImage && (
                  <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={check.evidenceImage} alt="Evidência" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      ✓ Foto de evidência anexada
                    </span>
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="checklist-actions-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Paperclip size={14} /> Anexar Foto
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleEvidenceUpload(check.id, e)} 
                    style={{ display: 'none' }} 
                  />
                </label>

                <button
                  onClick={() => updateChecklistStatus(check.id, 'pass', 'Aprovado em teste de campo', undefined, currentUser)}
                  className={`btn btn-sm ${check.status === 'pass' ? 'btn-accent' : 'btn-secondary'}`}
                  style={{ gap: '0.3rem' }}
                >
                  <CheckCircle2 size={15} /> Aprovado
                </button>

                <button
                  onClick={() => updateChecklistStatus(check.id, 'fail', 'Reprovado - Requer ajuste técnico', undefined, currentUser)}
                  className={`btn btn-sm ${check.status === 'fail' ? 'btn-danger' : 'btn-secondary'}`}
                  style={{ gap: '0.3rem' }}
                >
                  <XCircle size={15} /> Reprovado
                </button>

                <button
                  onClick={() => updateChecklistStatus(check.id, 'pending', '', undefined, currentUser)}
                  className="btn btn-secondary btn-sm"
                  title="Marcar como Pendente"
                >
                  <Clock size={15} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredChecklists.length === 0 && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)'
          }}>
            Nenhum teste encontrado nesta categoria para o checklist.
          </div>
        )}
      </div>
    </div>
  );
};
