import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { X, Send, MessageSquare, Users, Sparkles } from 'lucide-react';

export const ObraChatModal = ({ isOpen, onClose }) => {
  const { currentUser, users } = useAuth();
  const { activeObra, chatMessages, sendChatMessage } = useData();

  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  const obraMessages = activeObra
    ? chatMessages.filter(m => m.obraId === activeObra.id)
    : [];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [obraMessages.length, isOpen]);

  if (!isOpen || !activeObra) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendChatMessage(activeObra.id, messageText);
    setMessageText('');
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Get authorized members for this Obra
  const assignedUsers = (activeObra.assignedUserIds && activeObra.assignedUserIds.length > 0)
    ? users.filter(u => activeObra.assignedUserIds.includes(u.id))
    : users;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1050,
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
          maxWidth: '600px',
          height: '80vh',
          maxHeight: '700px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid var(--accent-blue)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Chat da Obra: {activeObra.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={12} className="text-emerald" />
                <span>{assignedUsers.length} integrantes com acesso ao chat</span>
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Messages Stream */}
        <div style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          background: 'var(--bg-card)'
        }}>
          {obraMessages.length > 0 ? (
            obraMessages.map(msg => {
              const isMine = msg.senderId === currentUser?.id;
              const senderUser = users.find(u => u.id === msg.senderId);
              const avatarColor = senderUser?.userColorTag || 'var(--accent-blue)';

              return (
                <div 
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    alignSelf: isMine ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginBottom: '0.2rem', padding: '0 0.2rem' }}>
                    {isMine ? 'Você' : msg.senderName} • {formatTime(msg.createdAt)}
                  </div>

                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: isMine 
                      ? 'linear-gradient(135deg, #0284c7, #0369a1)' 
                      : 'var(--bg-main)',
                    color: isMine ? '#ffffff' : 'var(--text-primary)',
                    border: isMine ? 'none' : '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              <MessageSquare size={40} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem' }}>Nenhuma mensagem ainda no chat desta obra.</p>
              <p style={{ fontSize: '0.75rem' }}>Seja o primeiro a enviar uma mensagem para os integrantes!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} style={{
          padding: '0.85rem 1rem',
          background: 'var(--bg-main)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <input
            type="text"
            className="form-control"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Enviar mensagem para a equipe de ${activeObra.name}...`}
            style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
          />

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={!messageText.trim()}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <Send size={16} /> Enviar
          </button>
        </form>
      </div>
    </div>
  );
};
