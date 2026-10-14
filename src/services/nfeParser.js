// Leitura do XML da NF-e (padrão SEFAZ) e conciliação com os pedidos de compra da obra.

const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export const normalizar = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// O XML da NF-e usa namespace; getElementsByTagNameNS('*', ...) ignora o prefixo.
const tags = (raiz, nome) => [...raiz.getElementsByTagNameNS('*', nome)];
const txt = (raiz, nome) => tags(raiz, nome)[0]?.textContent?.trim() ?? '';

/** Lê o texto do XML e devolve os dados principais da nota. Lança erro se não for uma NF-e. */
export function lerNFe(xmlTexto) {
  const docXml = new DOMParser().parseFromString(xmlTexto, 'application/xml');
  if (docXml.getElementsByTagName('parsererror').length) throw new Error('Arquivo XML inválido.');
  const inf = tags(docXml, 'infNFe')[0];
  if (!inf) throw new Error('Este XML não é uma NF-e (não foi encontrado o bloco infNFe).');

  const ide = tags(inf, 'ide')[0] || inf;
  const emit = tags(inf, 'emit')[0] || inf;
  const total = tags(inf, 'ICMSTot')[0] || inf;

  const itens = tags(inf, 'det').map((det, i) => {
    const prod = tags(det, 'prod')[0] || det;
    return {
      n: det.getAttribute('nItem') || String(i + 1),
      codigo: txt(prod, 'cProd'),
      descricao: txt(prod, 'xProd'),
      unidade: txt(prod, 'uCom'),
      quantidade: num(txt(prod, 'qCom')),
      valorUnitario: num(txt(prod, 'vUnCom')),
      valorTotal: num(txt(prod, 'vProd'))
    };
  });

  return {
    chave: (inf.getAttribute('Id') || '').replace(/^NFe/, ''),
    numero: txt(ide, 'nNF'),
    serie: txt(ide, 'serie'),
    emissao: (txt(ide, 'dhEmi') || txt(ide, 'dEmi')).slice(0, 10),
    fornecedor: txt(emit, 'xNome'),
    cnpj: txt(emit, 'CNPJ') || txt(emit, 'CPF'),
    valorTotal: num(txt(total, 'vNF')),
    itens
  };
}

// Semelhança entre descrições: fração de palavras (≥ 3 letras) em comum.
const palavras = (s) => new Set(normalizar(s).split(' ').filter((p) => p.length >= 3));
export function semelhanca(a, b) {
  const A = palavras(a);
  const B = palavras(b);
  if (!A.size || !B.size) return 0;
  let comum = 0;
  A.forEach((p) => { if (B.has(p)) comum += 1; });
  return comum / Math.min(A.size, B.size);
}

const codigoDoItem = (item) => {
  if (item.code) return String(item.code);
  const m = String(item.description || '').match(/\b(\d{4,10})\b/);
  return m ? m[1] : '';
};

/** Escolhe o pedido da obra que mais combina com a nota (fornecedor, número da NF e itens). */
export function pedidoProvavel(nfe, pedidos) {
  let melhor = null;
  pedidos.forEach((po) => {
    let pontos = 0;
    if (po.nfNumber && String(po.nfNumber) === String(nfe.numero)) pontos += 5;
    pontos += semelhanca(po.fornecedor, nfe.fornecedor) * 3;
    const pendentes = (po.items || []).filter((i) => i.status !== 'Já Chegou');
    const casados = nfe.itens.filter((ni) => pendentes.some((pi) => casaItem(ni, pi) > 0.5)).length;
    pontos += nfe.itens.length ? (casados / nfe.itens.length) * 4 : 0;
    if (!melhor || pontos > melhor.pontos) melhor = { po, pontos };
  });
  return melhor && melhor.pontos >= 2 ? melhor.po : null;
}

/** Grau (0 a 1) com que um item da nota corresponde a um item do pedido. */
export function casaItem(itemNota, itemPedido) {
  const cod = codigoDoItem(itemPedido);
  if (cod && itemNota.codigo && normalizar(cod) === normalizar(itemNota.codigo)) return 1;
  if (cod && normalizar(itemNota.descricao).includes(normalizar(cod))) return 0.95;
  return semelhanca(itemNota.descricao, itemPedido.description || itemPedido.name);
}

/**
 * Concilia os itens da nota com os itens de um pedido.
 * Devolve uma linha por item da nota: { itemNota, itemPedido, situacao: 'ok' | 'divergente' | 'sem-pedido', avisos[] }.
 */
export function conciliar(nfe, po) {
  const usados = new Set();
  return nfe.itens.map((itemNota) => {
    let melhor = null;
    (po?.items || []).forEach((ip) => {
      if (usados.has(ip.id)) return;
      const grau = casaItem(itemNota, ip);
      if (grau >= 0.5 && (!melhor || grau > melhor.grau)) melhor = { ip, grau };
    });
    if (!melhor) return { itemNota, itemPedido: null, situacao: 'sem-pedido', avisos: ['Item não encontrado no pedido'] };
    usados.add(melhor.ip.id);
    const ip = melhor.ip;
    const avisos = [];
    const pedida = num(ip.quantityOrdered);
    const jaRecebida = num(ip.quantityReceived);
    const restante = Math.max(0, pedida - jaRecebida);
    if (pedida && Math.abs(itemNota.quantidade - restante) > 1e-6) {
      avisos.push(itemNota.quantidade < restante
        ? `Entrega parcial: ${itemNota.quantidade} de ${restante} pendentes`
        : `Quantidade maior que a pendente (${itemNota.quantidade} × ${restante})`);
    }
    const precoPedido = num(ip.unitPrice);
    if (precoPedido && Math.abs(itemNota.valorUnitario - precoPedido) / precoPedido > 0.01) {
      avisos.push(`Preço diferente: NF ${itemNota.valorUnitario.toFixed(2)} × pedido ${precoPedido.toFixed(2)}`);
    }
    return { itemNota, itemPedido: ip, grau: melhor.grau, situacao: avisos.length ? 'divergente' : 'ok', avisos };
  });
}
