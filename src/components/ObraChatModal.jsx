import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, MessageSquare, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { MentionTextarea, extrairMencoes, TextoComMencoes } from './MentionTextarea';
import './obras/chat.css';

const URL_RE = /(https?:\/\/[^\s]+)/g;

const Texto = ({ texto }) =>
  texto.split(URL_RE).map((parte, i) =>
    /^https?:\/\//.test(parte) ? (
      <a key={i} href={parte} target="_blank" rel="noreferrer noopener">{parte}</a>
    ) : (
      <React.Fragment key={i}>{parte}</React.Fragment>
    )
  );

const diaIso = (iso) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const rotuloDia = (iso) => {
  const hoje = diaIso(new Date().toISOString());
  const ontem = diaIso(new Date(Date.now() - 86400000).toISOString());
  if (iso === hoje) return 'Hoje';
  if (iso === ontem) return 'Ontem';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

const hora = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export const ObraChatModal = ({ isOpen, onClose }) => {
  const { currentUser, users } = useAuth();
  const { activeObra, chatMessages, sendChatMessage, myNotifications, markNotificationAsRead } = useData();

  const [texto, setTexto] = useState('');
  const fimRef = useRef(null);
  const campoRef = useRef(null);

  const mensagens = useMemo(
    () =>
      activeObra
        ? chatMessages
            .filter((m) => m.obraId === activeObra.id)
            .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
        : [],
    [chatMessages, activeObra]
  );

  // Agrupa por dia; mensagens seguidas da mesma pessoa ficam juntas.
  const blocos = useMemo(() => {
    const out = [];
    mensagens.forEach((m) => {
      const dia = diaIso(m.createdAt || new Date().toISOString());
      let grupo = out[out.length - 1];
      if (!grupo || grupo.dia !== dia) {
        grupo = { dia, sequencias: [] };
        out.push(grupo);
      }
      const ultima = grupo.sequencias[grupo.sequencias.length - 1];
      if (ultima && ultima.senderId === m.senderId) ultima.itens.push(m);
      else grupo.sequencias.push({ senderId: m.senderId, senderName: m.senderName, senderTitle: m.senderTitle, itens: [m] });
    });
    return out;
  }, [mensagens]);

  useEffect(() => {
    if (isOpen) fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens.length, isOpen]);

  // Ao abrir o chat, os avisos de mensagem desta obra são marcados como lidos.
  useEffect(() => {
    if (!isOpen || !activeObra) return;
    (myNotifications || [])
      .filter((n) => n.type === 'chat' && n.obraId === activeObra.id && !n.read)
      .forEach((n) => markNotificationAsRead(n.id));
  }, [isOpen, activeObra, mensagens.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return undefined;
    const aoTeclar = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', aoTeclar);
    campoRef.current?.focus();
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [isOpen, onClose]);

  if (!isOpen || !activeObra) return null;

  const membros = activeObra.assignedUserIds?.length
    ? users.filter((u) => activeObra.assignedUserIds.includes(u.id))
    : users;

  const enviar = (e) => {
    e?.preventDefault();
    if (!texto.trim()) return;
    sendChatMessage(activeObra.id, texto, extrairMencoes(texto, membros));
    setTexto('');
  };

  const aoTeclar = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) enviar(e);
  };

  return createPortal(
    <div className="ch-overlay" onClick={onClose}>
      <div className="ch-janela glass-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="ch-topo">
          <div className="ch-icone"><MessageSquare size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong>Chat · {activeObra.name}</strong>
            <span title={membros.map((u) => u.name).join(', ')}>
              <Users size={11} /> {membros.map((u) => u.name.split(' ')[0]).join(', ')}
            </span>
          </div>
          <button type="button" className="ch-fechar" aria-label="Fechar chat" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="ch-mensagens">
          {mensagens.length === 0 ? (
            <div className="ch-vazio">
              <MessageSquare size={36} />
              <p>Nenhuma mensagem ainda.</p>
              <span>Escreva abaixo para avisar a equipe desta obra.</span>
            </div>
          ) : (
            blocos.map((b) => (
              <section key={b.dia}>
                <div className="ch-dia"><span>{rotuloDia(b.dia)}</span></div>
                {b.sequencias.map((s, i) => {
                  const minha = s.senderId === currentUser?.id;
                  const u = users.find((x) => x.id === s.senderId);
                  const cor = u?.userColorTag || u?.avatarColor || 'var(--accent-blue)';
                  return (
                    <div key={i} className={`ch-seq ${minha ? 'minha' : ''}`}>
                      {!minha && <span className="ch-avatar" style={{ background: cor }}>{(s.senderName || '?').charAt(0).toUpperCase()}</span>}
                      <div className="ch-bolhas">
                        {!minha && <span className="ch-autor">{s.senderName}{s.senderTitle ? ` · ${s.senderTitle}` : ''}</span>}
                        {s.itens.map((m) => (
                          <div key={m.id} className="ch-bolha">
                            <p className={m.mentions?.includes(currentUser?.id) ? 'ch-me-mencionou' : ''}>
                              <TextoComMencoes texto={m.text || ''} users={users} meuId={currentUser?.id} renderParte={(p) => <Texto texto={p} />} />
                            </p>
                            <time>{hora(m.createdAt)}</time>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            ))
          )}
          <div ref={fimRef} />
        </div>

        <form className="ch-form" onSubmit={enviar}>
          <MentionTextarea
            ref={campoRef}
            users={membros.filter((u) => u.id !== currentUser?.id)}
            className="form-control"
            rows={1}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            placeholder="Escreva uma mensagem… use @ para marcar alguém (Enter envia)"
          />
          <button type="submit" className="btn btn-primary" disabled={!texto.trim()} aria-label="Enviar mensagem">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
