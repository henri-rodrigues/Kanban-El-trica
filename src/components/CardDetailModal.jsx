import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { X, Image, Calendar, Clock, Plus, Trash2, Edit3, Save, Paperclip, CheckSquare, Square } from 'lucide-react';

export const CardDetailModal = ({ card, isOpen, onClose }) => {
  const { currentUser, users, isAdmin } = useAuth();
  const { updateCard, deleteCard, addWorkLogToCard } = useData();

  // Editable post-it fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  
  // Work log form state
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logHours, setLogHours] = useState(8);
  const [logNotes, setLogNotes] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');

  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setFieldNotes(card.fieldNotes || '');
      setSelectedOperatorId(currentUser?.id || users[0]?.id || 'usr-1');
    }
  }, [card, currentUser, users]);

  if (!isOpen || !card) return null;

  const handleSaveDetails = (e) => {
    e.preventDefault();
    updateCard(card.id, {
      title,
      description,
      fieldNotes
    });
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const updatedSubtasks = [
      ...(card.subtasks || []),
      { id: `st-${Date.now()}`, title: newSubtask, completed: false }
    ];
    updateCard(card.id, { subtasks: updatedSubtasks });
    setNewSubtask('');
  };

  const toggleSubtask = (subtaskId) => {
    const updatedSubtasks = (card.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    updateCard(card.id, { subtasks: updatedSubtasks });
  };

  const handleAddWorkLog = (e) => {
    e.preventDefault();
    if (!logHours) return;
    const operatorObj = users.find(u => u.id === selectedOperatorId) || currentUser;
    addWorkLogToCard(card.id, {
      date: logDate,
      hours: parseFloat(logHours),
      operatorId: operatorObj.id,
      operatorName: operatorObj.name,
      notes: logNotes
    });
    setLogNotes('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCard(card.id, {
          images: [...(card.images || []), reader.result]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAssignUser = (user) => {
    updateCard(card.id, {
      assignedUserId: user.id,
      assignedUserName: user.name,
      userColor: user.userColorTag
    });
  };

  const totalHoursWorked = (card.workedDays || []).reduce((acc, curr) => acc + (curr.hours || 0), 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          border: `2px solid ${card.userColor || 'var(--accent-blue)'}`
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: `${card.userColor}22`, color: card.userColor, border: `1px solid ${card.userColor}` }}>
                👤 {card.assignedUserName || 'Usuário'}
              </span>
              <span className="badge badge-purple">
                {card.level === 'obra' ? '🌐 Post-it Geral da Obra' : '⚡ Post-it do Quadro'}
              </span>
              <span className="badge badge-amber">{card.priority}</span>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveDetails}
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border-color)',
                width: '100%',
                outline: 'none'
              }}
              placeholder="Título do Post-it..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => { deleteCard(card.id); onClose(); }} className="btn btn-danger btn-sm">
              <Trash2 size={15} /> Excluir
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Editable Description & Field Notes */}
        <form onSubmit={handleSaveDetails} style={{ marginBottom: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Edit3 size={14} /> Descrição da Tarefa (Editável)
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes desta atividade..."
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-amber)' }}>
              📝 Anotações de Campo & O Que Falta Fazer
            </label>
            <textarea
              className="form-control"
              rows={2}
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
              placeholder="Escreva anotações importantes sobre o status atual, pendências ou observações..."
            />
          </div>

          <button type="submit" className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
            <Save size={14} /> Salvar Alterações no Post-it
          </button>
        </form>

        {/* Subtasks Checklist */}
        <div style={{ marginBottom: '1.25rem', background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
            📋 Sub-tarefas & Pendências do Post-it
          </label>

          <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Adicionar item (ex: Teste elétrico da bomba)..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              style={{ fontSize: '0.8rem' }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <Plus size={14} /> Add
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {(card.subtasks || []).map(st => (
              <div 
                key={st.id}
                onClick={() => toggleSubtask(st.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: st.completed ? 'line-through' : 'none'
                }}
              >
                {st.completed ? <CheckSquare size={16} className="text-emerald" /> : <Square size={16} />}
                <span>{st.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned User Selection (Color Coding) */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
            Usuário Responsável & Cor do Card
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {users.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleAssignUser(u)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: card.assignedUserId === u.id ? `2px solid ${u.userColorTag}` : '1px solid var(--border-color)',
                  background: card.assignedUserId === u.id ? `${u.userColorTag}22` : 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '0.775rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.userColorTag }} />
                {u.name} {isAdmin && `(R$ ${u.dailyRate}/dia)`}
              </button>
            ))}
          </div>
        </div>

        {/* Images & Attachments Section */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Image size={16} /> Anexos e Imagens da Obra ({card.images?.length || 0})
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
            {card.images?.map((img, idx) => (
              <div key={idx} style={{ height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={img} alt={`Anexo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}

            <label style={{
              height: '80px',
              borderRadius: '6px',
              border: '2px dashed var(--border-highlight)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.725rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-main)'
            }}>
              <Paperclip size={16} />
              <span>Enviar Imagem</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Operator Work Days Section */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} className="text-amber" /> Registro de Apontamento dos Operadores
            </h4>
            <span className="badge badge-amber" style={{ fontSize: '0.8rem' }}>
              Total: {totalHoursWorked}h ({Math.round(totalHoursWorked / 8 * 10) / 10} dias)
            </span>
          </div>

          <form onSubmit={handleAddWorkLog} style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.725rem' }}>Operador</label>
                <select className="form-control" style={{ fontSize: '0.775rem' }} value={selectedOperatorId} onChange={(e) => setSelectedOperatorId(e.target.value)}>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} {isAdmin ? `(R$ ${u.dailyRate}/dia)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.725rem' }}>Data</label>
                <input type="date" required className="form-control" style={{ fontSize: '0.775rem' }} value={logDate} onChange={(e) => setLogDate(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.725rem' }}>Horas</label>
                <input type="number" step="0.5" min="0.5" max="24" required className="form-control" style={{ fontSize: '0.775rem' }} value={logHours} onChange={(e) => setLogHours(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.725rem' }}>Observação</label>
                <input type="text" placeholder="Trabalho realizado..." className="form-control" style={{ fontSize: '0.775rem' }} value={logNotes} onChange={(e) => setLogNotes(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-accent btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={14} /> Registrar Apontamento
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {card.workedDays?.map((log) => {
              const op = users.find(u => u.id === log.operatorId || u.name === log.operatorName);
              const rate = op?.dailyRate || 250;
              const costCalculated = (log.hours / 8) * rate;

              return (
                <div key={log.id || Math.random()} style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-blue"><Calendar size={12} /> {log.date}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{log.operatorName}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{log.notes}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-amber">{log.hours}h ({log.hours / 8} dia)</span>
                    {isAdmin && (
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>R$ {costCalculated.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
