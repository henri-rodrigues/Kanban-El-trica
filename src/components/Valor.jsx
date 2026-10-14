import React, { useEffect, useState } from 'react';
import { usePrivacy } from '../context/PrivacyContext';

const OCULTO = 'R$ •••••';

export const formatarBRL = (v, casas = 2) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: casas, maximumFractionDigits: casas }).format(Number(v) || 0);

/** Formatador que respeita o modo discreto (para textos montados, títulos e atributos). */
export const useFormatoValor = () => {
  const { mostrarValores } = usePrivacy();
  return (v, casas = 2) => (mostrarValores ? formatarBRL(v, casas) : OCULTO);
};

/**
 * Valor em dinheiro com sigilo: oculto por padrão; tocar mostra só este valor por 5 segundos.
 * `casas`: casas decimais (0 para valores grandes nos cartões).
 */
export const Valor = ({ v, casas = 2, className = '', style }) => {
  const { mostrarValores } = usePrivacy();
  const [espiar, setEspiar] = useState(false);

  useEffect(() => {
    if (!espiar) return undefined;
    const t = setTimeout(() => setEspiar(false), 5000);
    return () => clearTimeout(t);
  }, [espiar]);

  if (mostrarValores || espiar) {
    return <span className={`vl ${className}`} style={style}>{formatarBRL(v, casas)}</span>;
  }
  return (
    <span
      className={`vl vl-oculto ${className}`}
      style={style}
      role="button"
      tabIndex={0}
      title="Valor oculto — toque para ver"
      aria-label="Valor oculto, toque para ver"
      onClick={(e) => { e.stopPropagation(); setEspiar(true); }}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setEspiar(true); } }}
    >
      {OCULTO}
    </span>
  );
};
