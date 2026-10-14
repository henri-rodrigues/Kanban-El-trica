import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Modo discreto: valores em dinheiro aparecem como "R$ •••••" até a pessoa tocar no olho.
// Fica guardado só nesta aba (sessionStorage) e volta a ocultar ao sair do app ou após 5 min parado.
const CHAVE = 'omnifield_mostrar_valores';
const INATIVIDADE_MS = 5 * 60 * 1000;

const PrivacyContext = createContext({ mostrarValores: false, alternarValores: () => {}, ocultarValores: () => {} });

const ler = () => {
  try { return sessionStorage.getItem(CHAVE) === '1'; } catch { return false; }
};

export const PrivacyProvider = ({ children }) => {
  const [mostrarValores, setMostrar] = useState(ler);
  const timer = useRef(null);

  const definir = useCallback((v) => {
    setMostrar(v);
    try { sessionStorage.setItem(CHAVE, v ? '1' : '0'); } catch { /* sem armazenamento: só na memória */ }
  }, []);

  const ocultarValores = useCallback(() => definir(false), [definir]);
  const alternarValores = useCallback(() => definir(!mostrarValores), [definir, mostrarValores]);

  useEffect(() => {
    if (!mostrarValores) return undefined;
    const reiniciar = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(ocultarValores, INATIVIDADE_MS);
    };
    const aoSair = () => { if (document.visibilityState === 'hidden') ocultarValores(); };
    const eventos = ['pointerdown', 'keydown', 'scroll'];
    reiniciar();
    eventos.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
    document.addEventListener('visibilitychange', aoSair);
    return () => {
      clearTimeout(timer.current);
      eventos.forEach((e) => window.removeEventListener(e, reiniciar));
      document.removeEventListener('visibilitychange', aoSair);
    };
  }, [mostrarValores, ocultarValores]);

  return (
    <PrivacyContext.Provider value={{ mostrarValores, alternarValores, ocultarValores }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => useContext(PrivacyContext);
