import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { POSTIT_GRADIENTS, getGradientById } from '../constants/gradients';
import { X, Image, Calendar, Clock, Plus, Trash2, Edit3, Save, Paperclip, CheckSquare, Square, Palette, AtSign, Check } from 'lucide-react';

export const CardDetailModal = ({ card, isOpen, onClose }) => {
  const { currentUser, users, isAdmin } = useAuth();
  const { cards, updateCard, deleteCard, addWorkLogToCard, addNotification } = useData();

  // Always derive the fresh card object from DataContext state!
  const activeCard = cards.find(c => c.id === card?.id) || card;

  // Editable post-it fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');
  const [gradientId, setGradientId] = useState('cyan');
  const [priority, setPriority] = useState('Média');
  const [newSubtask, setNewSubtask] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState([]);
  
  // Work log form state
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logHours, setLogHours] = useState(8);
  const [logNotes, setLogNotes] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');

  useEffect(() => {
    if (activeCard) {
      setTitle(activeCard.title || '');
      setDescription(activeCard.description || '');
      setFieldNotes(activeCard.fieldNotes || '');
      setGradientId(activeCard.gradientId || 'cyan');
      setPriority(activeCard.priority || 'Média');
      setMentionedUserIds(activeCard.mentionedUserIds || []);
      setSelectedOperatorId(currentUser?.id || users[0]?.id || 'usr-admin');
    }
  }, [activeCard?.id, currentUser, users]);

  if (!isOpen || !activeCard) return null;

  const currentGradient = getGradientById(gradientId);

  const handlePriorityChange = (newPriority) => {
    setPriority(newPriority);
    updateCard(activeCard.id, { priority: newPriority });
  };

  const handleSaveDetails = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const previousMentions = activeCard.mentionedUserIds || [];
    const newMentions = mentionedUserIds.filter(id => !previousMentions.includes(id));

    updateCard(activeCard.id, {
      title,
      description,
      fieldNotes,
      gradientId,
      priority,
      mentionedUserIds
    });

    // Notify newly mentioned users immediately!
    newMentions.forEach(recipientId => {
      if (recipientId !== currentUser?.id) {
        addNotification({
          recipientUserId: recipientId,
          senderUserId: currentUser.id,
          senderName: currentUser.name,
          type: 'mention',
          title: `Você foi marcado no Post-it!`,
          message: `${currentUser.name} marcou você no post "${title || activeCard.title}".`,
          cardId: activeCard.id,
          obraId: activeCard.obraId
        });
      }
    });
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const updatedSubtasks = [
      ...(activeCard.subtasks || []),
      { id: `st-${Date.now()}`, title: newSubtask, completed: false }
    ];
    updateCard(activeCard.id, { subtasks: updatedSubtasks });
    setNewSubtask('');
  };

  const toggleSubtask = (subtaskId) => {
    const updatedSubtasks = (activeCard.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    updateCard(activeCard.id, { subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (subtaskId) => {
    const updatedSubtasks = (activeCard.subtasks || []).filter(st => st.id !== subtaskId);
    updateCard(activeCard.id, { subtasks: updatedSubtasks });
  };

  const handleAddWorkLog = (e) => {
    e.preventDefault();
    if (!logHours) return;
    const operatorObj = users.find(u => u.id === selectedOperatorId) || currentUser;
    addWorkLogToCard(activeCard.id, {
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
        const updatedImages = [...(activeCard.images || []), reader.result];
        updateCard(activeCard.id, { images: updatedImages });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAssignUser = (user) => {
    updateCard(activeCard.id, {
      assignedUserId: user.id,
      assignedUserName: user.name,
      userColor: user.userColorTag
    });
  };

  const totalHoursWorked = (activeCard.workedDays || []).reduce((acc, curr) => acc + (curr.hours || 0), 0);

  return (
    <div className="mobile-modal-overlay" onClick={onClose} style={{
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
        className="glass-panel mobile-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          border: `2px solid ${currentGradient.border}`
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: currentGradient.gradient, color: '#fff', fontSize: '0.65rem' }}>
                👤 {activeCard.assignedUserName || 'Usuário'}
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                {activeCard.level === 'obra' ? '🌐 Geral' : '⚡ Quadro'}
              </span>
              <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>{activeCard.priority || priority}</span>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveDetails}
              style={{
                fontSize: '1.15rem',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            <button 
              onClick={() => { 
                if (window.confirm('Tem certeza que deseja EXCLUIR este post-it permanentemente?')) {
                  deleteCard(activeCard.id); 
                  onClose(); 
                }
              }} 
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={14} />
              <span className="mobile-hide">Excluir</span>
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Priority / Severity Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
            ⚡ Prioridade
          </label>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { label: '🟢 Baixa', value: 'Baixa', color: 'var(--accent-emerald)' },
              { label: '🟡 Média', value: 'Média', color: 'var(--accent-amber)' },
              { label: '🟠 Alta', value: 'Alta', color: '#f97316' },
              { label: '🔴 Crítica', value: 'Crítica', color: 'var(--accent-rose)' }
            ].map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePriorityChange(p.value)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: priority === p.value ? `2px solid ${p.color}` : '1px solid var(--border-color)',
                  background: priority === p.value ? `${p.color}25` : 'var(--bg-main)',
                  color: priority === p.value ? p.color : 'var(--text-muted)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gradient Selector for Post-it */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
            <Palette size={14} className="text-amber" /> Cor do Post-it
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '0.4rem' }}>
            {POSTIT_GRADIENTS.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setGradientId(g.id);
                  updateCard(card.id, { gradientId: g.id });
                }}
                title={g.name}
                style={{
                  height: '32px',
                  borderRadius: '6px',
                  border: gradientId === g.id ? '2px solid #ffffff' : '1px solid var(--border-color)',
                  background: g.gradient,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: gradientId === g.id ? '0 0 10px rgba(255,255,255,0.4)' : 'none'
                }}
              >
                {gradientId === g.id && <Check size={14} style={{ color: '#ffffff' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Mention Team Members Section */}
        <div style={{ marginBottom: '1rem', padding: '0.65rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <AtSign size={14} className="text-amber" /> Mencionar (@)
          </label>

          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {users.map(u => {
              const isMentioned = mentionedUserIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    let updated;
                    if (isMentioned) {
                      updated = mentionedUserIds.filter(id => id !== u.id);
                    } else {
                      updated = [...mentionedUserIds, u.id];
                    }
                    setMentionedUserIds(updated);
                    // Save and trigger notification if adding new mention
                    if (!isMentioned && u.id !== currentUser?.id) {
                      addNotification({
                        recipientUserId: u.id,
                        senderUserId: currentUser.id,
                        senderName: currentUser.name,
                        type: 'mention',
                        title: `Você foi marcado em um Post-it!`,
                        message: `${currentUser.name} marcou você no post "${title || card.title}".`,
                        cardId: card.id,
                        obraId: card.obraId
                      });
                    }
                    updateCard(card.id, { mentionedUserIds: updated });
                  }}
                  style={{
                    padding: '0.3rem 0.55rem',
                    borderRadius: '16px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isMentioned ? `2px solid ${u.userColorTag || 'var(--accent-blue)'}` : '1px solid var(--border-color)',
                    background: isMentioned ? 'rgba(2, 132, 199, 0.2)' : 'var(--bg-card)',
                    color: isMentioned ? 'var(--text-primary)' : 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>@{u.name.split(' ')[0]}</span>
                  {isMentioned && <Check size={11} className="text-emerald" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description & Field Notes */}
        <form onSubmit={handleSaveDetails} style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Edit3 size={14} /> Descrição
            </label>
            <textarea
              className="form-control"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes desta atividade..."
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-amber)' }}>
              📝 Anotações de Campo
            </label>
            <textarea
              className="form-control"
              rows={2}
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
              placeholder="Pendências, status atual..."
            />
          </div>

          <button type="submit" className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
            <Save size={14} /> Salvar
          </button>
        </form>

        {/* Subtasks Checklist */}
        <div style={{ marginBottom: '1rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
            📋 Sub-tarefas
          </label>

          <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Adicionar item..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              style={{ fontSize: '0.8rem', flex: 1 }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
              <Plus size={14} />
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {(activeCard.subtasks || []).map(st => (
              <div 
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div 
                  onClick={() => toggleSubtask(st.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: st.completed ? 'line-through' : 'none',
                    flex: 1
                  }}
                >
                  {st.completed ? <CheckSquare size={16} className="text-emerald" /> : <Square size={16} />}
                  <span>{st.title}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSubtask(st.id);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}
                  title="Excluir Sub-tarefa"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned User Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
            Usuário Responsável
          </label>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {users.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleAssignUser(u)}
                style={{
                  padding: '0.3rem 0.55rem',
                  borderRadius: 'var(--radius-md)',
                  border: activeCard.assignedUserId === u.id ? `2px solid ${u.userColorTag}` : '1px solid var(--border-color)',
                  background: activeCard.assignedUserId === u.id ? `${u.userColorTag}22` : 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.userColorTag, flexShrink: 0 }} />
                {u.name.split(' ')[0]} {isAdmin && `(${u.dailyRate})`}
              </button>
            ))}
          </div>
        </div>

        {/* Images & Attachments Section */}
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Image size={16} /> Anexos ({activeCard.images?.length || 0})
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.4rem' }}>
            {activeCard.images?.map((img, idx) => (
              <div key={idx} style={{ height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={img} alt={`Anexo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}

            <label style={{
              height: '70px',
              borderRadius: '6px',
              border: '2px dashed var(--border-highlight)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-main)'
            }}>
              <Paperclip size={16} />
              <span>Enviar</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Operator Work Days Section */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.35rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} className="text-amber" /> Apontamento
            </h4>
            <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
              Total: {totalHoursWorked}h ({Math.round(totalHoursWorked / 8 * 10) / 10} dias)
            </span>
          </div>

          <form onSubmit={handleAddWorkLog} style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem' }}>Operador</label>
                <select className="form-control" style={{ fontSize: '0.775rem' }} value={selectedOperatorId} onChange={(e) => setSelectedOperatorId(e.target.value)}>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} {isAdmin ? `(R$ ${u.dailyRate}/dia)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem' }}>Data</label>
                <input type="date" required className="form-control" style={{ fontSize: '0.775rem' }} value={logDate} onChange={(e) => setLogDate(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem' }}>Horas</label>
                <input type="number" step="0.5" min="0.5" max="24" required className="form-control" style={{ fontSize: '0.775rem' }} value={logHours} onChange={(e) => setLogHours(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem' }}>Observação</label>
                <input type="text" placeholder="Trabalho realizado..." className="form-control" style={{ fontSize: '0.775rem' }} value={logNotes} onChange={(e) => setLogNotes(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-accent btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={14} /> Registrar Apontamento
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {activeCard.workedDays?.map((log) => {
              const op = users.find(u => u.id === log.operatorId || u.name === log.operatorName);
              const rate = op?.dailyRate || 250;
              const costCalculated = (log.hours / 8) * rate;

              return (
                <div key={log.id || Math.random()} style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                    <span className="badge badge-blue"><Calendar size={11} /> {log.date}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{log.operatorName}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-amber">{log.hours}h</span>
                    {log.notes && <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{log.notes}</span>}
                    {isAdmin && (
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, marginLeft: 'auto' }}>R$ {costCalculated.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Save & Close Action Footer */}
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          position: 'sticky',
          bottom: 0,
          background: 'var(--bg-card)',
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
          zIndex: 10
        }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
          >
            Fechar
          </button>

          <button 
            type="button" 
            onClick={(e) => {
              handleSaveDetails(e);
              onClose();
            }} 
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
