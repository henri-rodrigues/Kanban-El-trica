import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRightLeft, Check } from 'lucide-react';

/**
 * "Mover para…" do post-it no celular: abre uma folha de ações com as colunas.
 * colunas: [{ id, titulo }]  ·  atual: coluna atual  ·  onMover(idColuna)
 */
export const MoverPara = ({ colunas, atual, onMover, desabilitado = false }) => {
  const [aberto, setAberto] = useState(false);
  if (desabilitado) return null;

  return (
    <>
      <button
        type="button"
        className="kb-mover"
        aria-label="Mover para outra coluna"
        onClick={(e) => { e.stopPropagation(); setAberto(true); }}
      >
        <ArrowRightLeft size={14} /> Mover
      </button>
      {aberto && createPortal(
        <div className="kb-folha-fundo" onClick={() => setAberto(false)}>
          <div className="kb-folha" role="dialog" aria-modal="true" aria-label="Mover post-it" onClick={(e) => e.stopPropagation()}>
            <strong>Mover para…</strong>
            {colunas.map((c) => (
              <button
                key={c.id}
                type="button"
                className={c.id === atual ? 'atual' : ''}
                disabled={c.id === atual}
                onClick={() => { setAberto(false); onMover(c.id); }}
              >
                {c.titulo} {c.id === atual && <Check size={14} />}
              </button>
            ))}
            <button type="button" className="cancelar" onClick={() => setAberto(false)}>Cancelar</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
