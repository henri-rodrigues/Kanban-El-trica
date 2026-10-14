import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Arrastar e soltar post-its com ponteiro (mouse, caneta e toque).
 *
 * - O cartão "levanta": uma cópia flutua sob o ponteiro, inclina conforme a velocidade e ganha sombra.
 * - Na origem fica um espaço fantasma; a coluna sob o ponteiro é destacada.
 * - Ao soltar, a cópia desliza até a nova posição (ou volta, se foi cancelado) e o cartão "pousa".
 * - No toque, o arraste começa pela alça (`data-drag-handle`) para não atrapalhar a rolagem.
 *
 * Elementos esperados: cartão com `data-card-id` e coluna com `data-col-id`.
 */
export function useKanbanDrag({ canDrag, onMove, onBlocked }) {
  const [draggingId, setDraggingId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const estado = useRef(null);
  const overRef = useRef(null);
  const ignorarClique = useRef(false);
  const cbs = useRef({ canDrag, onMove, onBlocked });
  cbs.current = { canDrag, onMove, onBlocked };

  const reduzir = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const limpar = useCallback(() => {
    document.body.classList.remove('kb-arrastando');
    overRef.current = null;
    setOverCol(null);
    setDraggingId(null);
    estado.current = null;
  }, []);

  const moverPonteiro = useCallback((e) => {
    const s = estado.current;
    if (!s || e.pointerId !== s.pointerId) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;

    if (!s.ativo) {
      if (Math.hypot(dx, dy) < 5) return;
      if (!s.permitido) {
        if (!s.avisou) { s.avisou = true; cbs.current.onBlocked?.(s.card); }
        return;
      }
      s.ativo = true;
      const r = s.rect;
      const ghost = s.el.cloneNode(true);
      ghost.removeAttribute('data-card-id');
      ghost.classList.add('kb-fantasma');
      Object.assign(ghost.style, {
        position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
        margin: '0', zIndex: '2500', pointerEvents: 'none', transition: 'none', willChange: 'transform'
      });
      document.body.appendChild(ghost);
      s.ghost = ghost;
      document.body.classList.add('kb-arrastando');
      setDraggingId(s.card.id);
      ghost.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.04) rotate(0deg)' }],
        { duration: 140, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'forwards' }
      );
    }

    // posição e inclinação (suavizada pela velocidade horizontal)
    const vx = e.clientX - s.lastX;
    s.tilt = s.tilt * 0.8 + Math.max(-9, Math.min(9, vx * 0.6)) * 0.2;
    s.lastX = e.clientX;
    if (s.ghost) {
      const tilt = reduzir() ? 0 : s.tilt;
      s.ghost.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${tilt}deg) scale(1.04)`;
    }

    // coluna sob o ponteiro
    const alvo = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-col-id]');
    const col = alvo?.dataset?.colId ?? null;
    if (col !== overRef.current) {
      overRef.current = col;
      setOverCol(col);
    }

    // rolagem horizontal automática perto das bordas do quadro
    const cont = s.el.closest('.kanban-scroll-container');
    if (cont) {
      const b = cont.getBoundingClientRect();
      if (e.clientX < b.left + 60) cont.scrollLeft -= 18;
      else if (e.clientX > b.right - 60) cont.scrollLeft += 18;
    }
  }, []);

  const finalizar = useCallback((e) => {
    const s = estado.current;
    if (!s || (e && e.pointerId !== s.pointerId)) return;
    window.removeEventListener('pointermove', moverPonteiro);
    window.removeEventListener('pointerup', finalizar);
    window.removeEventListener('pointercancel', finalizar);

    if (!s.ativo) { estado.current = null; return; }

    ignorarClique.current = true;
    setTimeout(() => { ignorarClique.current = false; }, 80);

    const cancelado = e?.type === 'pointercancel';
    const destino = cancelado ? null : overRef.current;
    const mudou = destino && destino !== s.card.column;
    const ghost = s.ghost;
    const r = s.rect;

    const encerrar = (pousar) => {
      ghost?.remove();
      if (pousar) {
        const novo = document.querySelector(`[data-card-id="${CSS.escape(String(s.card.id))}"]`);
        if (novo) {
          novo.classList.add('kb-pouso');
          setTimeout(() => novo.classList.remove('kb-pouso'), 600);
        }
      }
      limpar();
    };

    const voar = (para) => {
      if (!ghost) return encerrar(false);
      const dx = para.left - r.left;
      const dy = para.top - r.top;
      ghost.style.transition = reduzir()
        ? 'transform 0.01s'
        : 'transform 0.32s cubic-bezier(.2,.9,.3,1.15), box-shadow 0.32s ease';
      ghost.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(0deg) scale(1)`;
      ghost.classList.add('kb-fantasma-pousando');
      let terminou = false;
      const fim = () => { if (terminou) return; terminou = true; encerrar(!!mudou); };
      ghost.addEventListener('transitionend', fim, { once: true });
      setTimeout(fim, 420);
    };

    if (mudou) {
      cbs.current.onMove(s.card.id, destino);
      // espera o React renderizar o cartão na coluna nova para descobrir onde ele pousa
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const novo = document.querySelector(`[data-card-id="${CSS.escape(String(s.card.id))}"]`);
        voar(novo ? novo.getBoundingClientRect() : r);
      }));
    } else {
      voar(r);
    }
  }, [limpar, moverPonteiro]);

  const onPointerDown = useCallback((e, card) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest?.('button, a, input, textarea, select, [data-no-drag]')) return;
    const toque = e.pointerType === 'touch';
    if (toque && !e.target.closest?.('[data-drag-handle]')) return;
    if (estado.current) return;

    const el = e.currentTarget;
    estado.current = {
      card, el, pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY, lastX: e.clientX, tilt: 0,
      rect: el.getBoundingClientRect(), ativo: false, ghost: null,
      permitido: !!cbs.current.canDrag(card), avisou: false
    };
    window.addEventListener('pointermove', moverPonteiro);
    window.addEventListener('pointerup', finalizar);
    window.addEventListener('pointercancel', finalizar);
  }, [finalizar, moverPonteiro]);

  // Segurança: se o componente sair da tela no meio do arraste.
  useEffect(() => () => {
    window.removeEventListener('pointermove', moverPonteiro);
    window.removeEventListener('pointerup', finalizar);
    window.removeEventListener('pointercancel', finalizar);
    estado.current?.ghost?.remove();
    document.body.classList.remove('kb-arrastando');
  }, [finalizar, moverPonteiro]);

  /** Chame no onClick do cartão: devolve true quando o clique é só o fim de um arraste. */
  const consumirClique = useCallback(() => {
    if (ignorarClique.current) {
      ignorarClique.current = false;
      return true;
    }
    return false;
  }, []);

  return { draggingId, overCol, onPointerDown, consumirClique };
}
