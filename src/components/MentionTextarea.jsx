import React, { forwardRef, useMemo, useRef, useState } from 'react';

const normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Apelido usado na menção: primeiro nome; se houver dois iguais, primeiro + segundo nome juntos. */
export function apelidos(users) {
  const contagem = {};
  users.forEach((u) => {
    const p = normalizar((u.name || '').split(' ')[0]);
    contagem[p] = (contagem[p] || 0) + 1;
  });
  const mapa = new Map();
  users.forEach((u) => {
    const partes = (u.name || '').trim().split(/\s+/);
    const primeiro = partes[0] || 'usuario';
    const apelido = contagem[normalizar(primeiro)] > 1 && partes[1] ? `${primeiro}${partes[1]}` : primeiro;
    mapa.set(u.id, apelido.replace(/[^\p{L}\p{N}_]/gu, ''));
  });
  return mapa;
}

/** IDs das pessoas mencionadas com @apelido no texto. */
export function extrairMencoes(texto, users) {
  const t = normalizar(texto);
  const mapa = apelidos(users);
  return users
    .filter((u) => {
      const a = normalizar(mapa.get(u.id));
      return a && new RegExp(`(^|[^\\p{L}\\p{N}_])@${a}(?![\\p{L}\\p{N}_])`, 'u').test(t);
    })
    .map((u) => u.id);
}

/**
 * Textarea com sugestão de pessoas ao digitar "@".
 * Repassa as demais props para o <textarea>.
 */
export const MentionTextarea = forwardRef(({ users, value, onChange, onKeyDown, ...resto }, refExterno) => {
  const refInterno = useRef(null);
  const ref = refExterno || refInterno;
  const [consulta, setConsulta] = useState(null); // { termo, inicio }
  const [indice, setIndice] = useState(0);
  const mapa = useMemo(() => apelidos(users), [users]);

  const sugestoes = consulta
    ? users
        .filter((u) => normalizar(u.name).includes(normalizar(consulta.termo)) || normalizar(mapa.get(u.id)).startsWith(normalizar(consulta.termo)))
        .slice(0, 6)
    : [];

  const atualizarConsulta = (texto, cursor) => {
    const antes = texto.slice(0, cursor);
    const m = antes.match(/(^|\s)@([\p{L}\p{N}_]*)$/u);
    if (m) {
      setConsulta({ termo: m[2], inicio: cursor - m[2].length - 1 });
      setIndice(0);
    } else {
      setConsulta(null);
    }
  };

  const escolher = (u) => {
    const el = ref.current;
    const cursor = el?.selectionStart ?? value.length;
    const novo = `${value.slice(0, consulta.inicio)}@${mapa.get(u.id)} ${value.slice(cursor)}`;
    onChange({ target: { value: novo } });
    setConsulta(null);
    const pos = consulta.inicio + mapa.get(u.id).length + 2;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  };

  const teclar = (e) => {
    if (consulta && sugestoes.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setIndice((i) => (i + 1) % sugestoes.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIndice((i) => (i - 1 + sugestoes.length) % sugestoes.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); escolher(sugestoes[indice]); return; }
      if (e.key === 'Escape') { e.stopPropagation(); setConsulta(null); return; }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="mn-wrap">
      <textarea
        {...resto}
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e);
          atualizarConsulta(e.target.value, e.target.selectionStart);
        }}
        onKeyDown={teclar}
        onBlur={() => setTimeout(() => setConsulta(null), 150)}
      />
      {consulta && sugestoes.length > 0 && (
        <ul className="mn-lista" role="listbox">
          {sugestoes.map((u, i) => (
            <li key={u.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === indice}
                className={i === indice ? 'ativo' : ''}
                onMouseDown={(e) => { e.preventDefault(); escolher(u); }}
              >
                <b>@{mapa.get(u.id)}</b> <span>{u.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

MentionTextarea.displayName = 'MentionTextarea';

/** Mostra o texto com as menções destacadas (a do usuário atual em destaque maior). */
export function TextoComMencoes({ texto, users, meuId, renderParte = (p) => p }) {
  const mapa = apelidos(users);
  const porApelido = new Map([...mapa.entries()].map(([id, a]) => [normalizar(a), id]));
  const partes = String(texto || '').split(/(@[\p{L}\p{N}_]+)/u);
  return partes.map((p, i) => {
    if (p.startsWith('@')) {
      const id = porApelido.get(normalizar(p.slice(1)));
      if (id) return <mark key={i} className={`mn-mencao ${id === meuId ? 'eu' : ''}`}>{p}</mark>;
    }
    return <React.Fragment key={i}>{renderParte(p)}</React.Fragment>;
  });
}
