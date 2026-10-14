import React, { useEffect, useState } from 'react';
import { BellRing, Mail } from 'lucide-react';
import { ativarNotificacoesPush, lerPreferenciasAviso, salvarPreferenciasAviso, isFirebaseActive } from '../services/firebase';

/** Preferências de aviso da pessoa: push neste aparelho e e-mail. */
export const AvisosConfig = () => {
  const [prefs, setPrefs] = useState(null);
  const [status, setStatus] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const permissao = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';

  useEffect(() => {
    if (!isFirebaseActive()) return;
    lerPreferenciasAviso().then(setPrefs).catch(() => setPrefs({ push: false, email: true }));
  }, []);

  if (!isFirebaseActive()) return null;

  const ativarPush = async () => {
    setOcupado(true);
    setStatus('');
    try {
      await ativarNotificacoesPush();
      setPrefs((p) => ({ ...(p || {}), push: true }));
      setStatus('Notificações ativadas neste aparelho.');
    } catch (e) {
      setStatus(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const alternar = async (campo) => {
    const novo = { ...(prefs || {}), [campo]: !(prefs?.[campo] ?? campo === 'email') };
    setPrefs(novo);
    await salvarPreferenciasAviso({ [campo]: novo[campo] }).catch(() => setStatus('Não foi possível salvar agora.'));
  };

  const pushAtivo = prefs?.push && permissao === 'granted';
  return (
    <div className="es-avisos-cfg">
      {pushAtivo ? (
        <button type="button" className="es-pessoa ativo" onClick={() => alternar('push')} title="Desligar push em todos os aparelhos">
          <BellRing size={12} /> Push ligado
        </button>
      ) : (
        <button type="button" className="es-pessoa" onClick={ativarPush} disabled={ocupado}>
          <BellRing size={12} /> {ocupado ? 'Ativando…' : 'Ativar push neste aparelho'}
        </button>
      )}
      <button type="button" className={`es-pessoa ${prefs?.email !== false ? 'ativo' : ''}`} onClick={() => alternar('email')} title="Receber por e-mail tarefas atribuídas, viagens e menções">
        <Mail size={12} /> E-mail {prefs?.email !== false ? 'ligado' : 'desligado'}
      </button>
      {status && <span className="es-dica" style={{ width: '100%' }}>{status}</span>}
    </div>
  );
};
