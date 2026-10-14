// Links diretos para itens do sistema (usados nas etiquetas QR dos quadros e nos avisos).
// Formato: <endereço do sistema>#/quadro/<obraId>/<quadroId>

const base = () => `${window.location.origin}${window.location.pathname}`;

export const linkDoQuadro = (obraId, quadroId) =>
  `${base()}#/quadro/${encodeURIComponent(obraId)}/${encodeURIComponent(quadroId)}`;

/** Lê o link aberto agora. Devolve { tipo: 'quadro', obraId, quadroId } ou null. */
export function lerLink(hash = window.location.hash) {
  const m = String(hash || '').match(/^#\/quadro\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return { tipo: 'quadro', obraId: decodeURIComponent(m[1]), quadroId: decodeURIComponent(m[2]) };
}

/** Remove o link da barra de endereço sem recarregar a página. */
export const limparLink = () => {
  if (window.location.hash) window.history.replaceState(null, '', base() + window.location.search);
};
