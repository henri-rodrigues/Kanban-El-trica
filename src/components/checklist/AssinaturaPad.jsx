import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Eraser } from 'lucide-react';

/** Campo de assinatura (mouse ou toque). Expõe obter() e limpar() via ref. */
export const AssinaturaPad = forwardRef(({ inicial = '' }, ref) => {
  const canvasRef = useRef(null);
  const desenhando = useRef(false);
  const sujo = useRef(false);
  const apagou = useRef(false); // o usuário limpou a assinatura anterior
  const ultimo = useRef(null);

  const preparar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const razao = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(width * razao));
    canvas.height = Math.max(1, Math.round(height * razao));
    const ctx = canvas.getContext('2d');
    ctx.scale(razao, razao);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1f2733';
    if (inicial) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = inicial;
    }
  };

  useEffect(() => {
    preparar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ponto = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const iniciar = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    desenhando.current = true;
    ultimo.current = ponto(e);
  };

  const mover = (e) => {
    if (!desenhando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = ponto(e);
    ctx.beginPath();
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimo.current = p;
    sujo.current = true;
    apagou.current = false;
  };

  const parar = () => {
    desenhando.current = false;
  };

  const limpar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    sujo.current = false;
    apagou.current = true;
  };

  useImperativeHandle(ref, () => ({
    // Devolve a imagem (PNG) ou, se nada foi desenhado, a assinatura anterior.
    obter: () => (sujo.current ? canvasRef.current.toDataURL('image/png') : (apagou.current ? '' : inicial)),
    limpar
  }));

  return (
    <div className="ck-assinatura">
      <canvas
        ref={canvasRef}
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={parar}
        onPointerLeave={parar}
        style={{ touchAction: 'none' }}
        aria-label="Área de assinatura"
      />
      <button type="button" className="btn btn-secondary btn-sm" onClick={limpar}>
        <Eraser size={13} /> Limpar
      </button>
    </div>
  );
});
