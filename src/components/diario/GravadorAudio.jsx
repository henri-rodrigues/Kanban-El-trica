import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

const MAX_SEGUNDOS = 60;

const escolherTipo = () => {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidatos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return candidatos.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? '';
};

/** Grava uma nota de voz curta direto no navegador (taxa baixa para caber no registro). */
export const GravadorAudio = ({ onGravado, desabilitado = false }) => {
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState('');
  const gravadorRef = useRef(null);
  const trechosRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const suporte = escolherTipo() !== null && !!navigator.mediaDevices?.getUserMedia;

  const limpar = () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => () => limpar(), []);

  const parar = () => {
    if (gravadorRef.current && gravadorRef.current.state !== 'inactive') gravadorRef.current.stop();
  };

  const iniciar = async () => {
    setErro('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const tipo = escolherTipo();
      const gravador = new MediaRecorder(stream, { ...(tipo ? { mimeType: tipo } : {}), audioBitsPerSecond: 24000 });
      gravadorRef.current = gravador;
      trechosRef.current = [];
      gravador.ondataavailable = (e) => e.data.size > 0 && trechosRef.current.push(e.data);
      gravador.onstop = () => {
        const blob = new Blob(trechosRef.current, { type: gravador.mimeType || tipo || 'audio/webm' });
        limpar();
        setGravando(false);
        const leitor = new FileReader();
        leitor.onload = () => onGravado(leitor.result, blob.size);
        leitor.readAsDataURL(blob);
      };
      gravador.start();
      setGravando(true);
      setSegundos(0);
      timerRef.current = setInterval(() => {
        setSegundos((s) => {
          if (s + 1 >= MAX_SEGUNDOS) parar();
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      limpar();
      setErro(e?.name === 'NotAllowedError' ? 'Permita o uso do microfone no navegador para gravar.' : 'Não foi possível acessar o microfone.');
    }
  };

  if (!suporte) return null;

  return (
    <span className="dr-gravador">
      {gravando ? (
        <button type="button" className="btn btn-danger btn-sm" onClick={parar}>
          <Square size={13} /> Parar ({segundos}s / {MAX_SEGUNDOS}s)
        </button>
      ) : (
        <button type="button" className="btn btn-secondary btn-sm" onClick={iniciar} disabled={desabilitado}>
          <Mic size={13} /> Gravar áudio
        </button>
      )}
      {erro && <span className="dr-erro-inline">{erro}</span>}
    </span>
  );
};
