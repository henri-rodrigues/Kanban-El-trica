import React, { useEffect, useRef, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { onPendingWrites } from '../services/firebase';

/**
 * Faixa de conexão: avisa quando o aparelho está sem internet (as alterações ficam guardadas)
 * e quando a fila de alterações está sendo enviada ao voltar o sinal.
 */
export const ConnectionBanner = () => {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [pendentes, setPendentes] = useState(0);
  const [sincronizado, setSincronizado] = useState(false);
  const estavaOffline = useRef(false);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const sair = onPendingWrites(setPendentes);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      sair();
    };
  }, []);

  // Mostra "tudo sincronizado" por alguns segundos depois de voltar a conexão e esvaziar a fila.
  useEffect(() => {
    if (!online) {
      estavaOffline.current = true;
      setSincronizado(false);
      return undefined;
    }
    if (estavaOffline.current && pendentes === 0) {
      estavaOffline.current = false;
      setSincronizado(true);
      const t = setTimeout(() => setSincronizado(false), 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [online, pendentes]);

  if (!online) {
    return (
      <div className="cx-banner offline" role="status">
        <WifiOff size={15} />
        <span>
          Sem conexão — você pode continuar trabalhando; as alterações ficam guardadas no aparelho
          {pendentes > 0 ? ` (${pendentes} aguardando envio)` : ''} e serão enviadas quando o sinal voltar.
        </span>
      </div>
    );
  }
  if (pendentes > 0 && estavaOffline.current) {
    return (
      <div className="cx-banner sincronizando" role="status">
        <RefreshCw size={15} className="cx-gira" />
        <span>Conexão de volta — enviando {pendentes} alteração(ões)…</span>
      </div>
    );
  }
  if (sincronizado) {
    return (
      <div className="cx-banner ok" role="status">
        <CheckCircle2 size={15} />
        <span>Tudo sincronizado.</span>
      </div>
    );
  }
  return null;
};
