import React, { useEffect, useState } from 'react';
import { Play, Square, Timer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const formatarDuracao = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** Relógio que atualiza a cada segundo enquanto o cronômetro do post-it está rodando. */
export const useTempoDecorrido = (inicioIso) => {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    if (!inicioIso) return undefined;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [inicioIso]);
  return inicioIso ? agora - Date.parse(inicioIso) : 0;
};

/**
 * Botão iniciar/parar do apontamento de horas.
 * `compacto`: versão do cartão do Kanban; senão, versão do detalhe do post-it.
 */
export const CardTimer = ({ card, compacto = false }) => {
  const { currentUser, isAdmin } = useAuth();
  const { cards, startCardTimer, stopCardTimer } = useData();
  const timer = card?.timer;
  const decorrido = useTempoDecorrido(timer?.startedAt);
  const [aviso, setAviso] = useState('');

  if (!card || !currentUser) return null;

  const responsavel = isAdmin || card.assignedUserId === currentUser.id;
  const meu = timer?.userId === currentUser.id;
  const podeParar = timer && (meu || isAdmin);

  const iniciar = (e) => {
    e.stopPropagation();
    const outro = cards.find((c) => c.id !== card.id && c.timer?.userId === currentUser.id);
    if (outro) {
      if (!window.confirm(`Você está com o cronômetro rodando em "${outro.title}". Parar aquele e iniciar este?`)) return;
      stopCardTimer(outro.id);
    }
    startCardTimer(card.id);
  };

  const parar = (e) => {
    e.stopPropagation();
    const horas = stopCardTimer(card.id);
    setAviso(horas ? `${horas}h apontadas` : 'Menos de 1 minuto: não foi apontado');
    setTimeout(() => setAviso(''), 3500);
  };

  if (timer) {
    return (
      <span className={`ct-timer ativo ${compacto ? 'compacto' : ''}`} title={`Cronômetro de ${timer.userName}`}>
        <Timer size={compacto ? 11 : 14} />
        <b>{formatarDuracao(decorrido)}</b>
        {!meu && <small>{timer.userName?.split(' ')[0]}</small>}
        {podeParar && (
          <button type="button" className="ct-btn parar" onClick={parar} aria-label="Parar cronômetro">
            <Square size={compacto ? 10 : 12} />{!compacto && ' Parar'}
          </button>
        )}
      </span>
    );
  }

  if (!responsavel) return aviso ? <span className="ct-aviso">{aviso}</span> : null;

  return (
    <span className={`ct-timer ${compacto ? 'compacto' : ''}`}>
      <button type="button" className="ct-btn iniciar" onClick={iniciar} aria-label="Iniciar cronômetro" title="Iniciar cronômetro de horas">
        <Play size={compacto ? 10 : 12} />{!compacto && ' Iniciar cronômetro'}
      </button>
      {aviso && <span className="ct-aviso">{aviso}</span>}
    </span>
  );
};
