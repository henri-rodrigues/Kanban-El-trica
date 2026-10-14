import React, { useMemo, useState } from 'react';
import { Check, AlertTriangle, PackagePlus } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ModalShell } from '../dimensionamento/ModalShell';
import { pedidoProvavel, conciliar } from '../../services/nfeParser';

import { Valor, useFormatoValor } from '../Valor';
const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const NOVO = '__novo__';

/** Conciliação da NF-e (XML) com um pedido de compra da obra e baixa do recebimento. */
export const NFeImportModal = ({ nfe, obra, pedidos, onFechar, onConcluido }) => {
  const { receberItensNFe, addPurchaseOrder } = useData();
  const fv = useFormatoValor();
  const sugerido = useMemo(() => pedidoProvavel(nfe, pedidos), [nfe, pedidos]);
  const [pedidoId, setPedidoId] = useState(sugerido?.id ?? NOVO);
  const [destino, setDestino] = useState('quadros');
  const pedido = pedidos.find((p) => p.id === pedidoId) || null;

  const linhas = useMemo(() => (pedido ? conciliar(nfe, pedido) : []), [nfe, pedido]);
  const [marcados, setMarcados] = useState({});
  const [qtds, setQtds] = useState({});
  const marcado = (i, l) => (i in marcados ? marcados[i] : !!l.itemPedido);
  const qtd = (i, l) => (i in qtds ? qtds[i] : l.itemNota.quantidade);

  const contagem = {
    ok: linhas.filter((l) => l.situacao === 'ok').length,
    divergente: linhas.filter((l) => l.situacao === 'divergente').length,
    semPedido: linhas.filter((l) => l.situacao === 'sem-pedido').length
  };

  const confirmar = () => {
    if (pedidoId === NOVO) {
      addPurchaseOrder(obra.id, {
        fornecedor: nfe.fornecedor.toUpperCase(),
        orderNumber: `NF ${nfe.numero}`,
        nfNumber: nfe.numero,
        nfs: [{ numero: nfe.numero, serie: nfe.serie, chave: nfe.chave, emissao: nfe.emissao, valor: nfe.valorTotal, importadaEm: new Date().toISOString() }],
        date: nfe.emissao ? nfe.emissao.split('-').reverse().join('/') : '',
        totalValue: nfe.valorTotal,
        destination: destino,
        items: nfe.itens.map((i, n) => ({
          id: `itm-nf-${Date.now()}-${n}`,
          code: i.codigo,
          description: i.codigo ? `${i.codigo} - ${i.descricao}` : i.descricao,
          unit: i.unidade,
          quantityOrdered: i.quantidade,
          quantityReceived: i.quantidade,
          status: 'Já Chegou',
          unitPrice: i.valorUnitario,
          totalPrice: i.valorTotal
        }))
      });
      onConcluido(`Pedido criado a partir da NF ${nfe.numero} (${fv(nfe.valorTotal)}) com ${nfe.itens.length} item(ns) recebidos.`);
      return;
    }
    const recebimentos = linhas
      .map((l, i) => (l.itemPedido && marcado(i, l) ? { itemId: l.itemPedido.id, qty: parseFloat(qtd(i, l)) || 0 } : null))
      .filter((r) => r && r.qty > 0);
    if (!recebimentos.length) return window.alert('Marque ao menos um item para dar baixa.');
    receberItensNFe(pedido.id, recebimentos, nfe);
    onConcluido(`NF ${nfe.numero}: baixa de ${recebimentos.length} item(ns) no pedido ${pedido.orderNumber || ''} (${pedido.fornecedor}).`);
  };

  return (
    <ModalShell
      title={`NF-e ${nfe.numero}${nfe.serie ? `/${nfe.serie}` : ''}`}
      subtitle={`${nfe.fornecedor}${nfe.cnpj ? ` · CNPJ ${nfe.cnpj}` : ''} · ${nfe.emissao ? nfe.emissao.split('-').reverse().join('/') : ''} · ${fv(nfe.valorTotal)} · ${nfe.itens.length} item(ns)`}
      onClose={onFechar}
      maxWidth={860}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <label className="dq-field">
          <span>Pedido de compra desta nota</span>
          <select className="form-control" value={pedidoId} onChange={(e) => { setPedidoId(e.target.value); setMarcados({}); setQtds({}); }}>
            {pedidos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === sugerido?.id ? '★ ' : ''}{p.orderNumber || 'Sem nº'} · {p.fornecedor} · {fv(p.totalValue)}
              </option>
            ))}
            <option value={NOVO}>➕ Não há pedido — criar um a partir desta nota</option>
          </select>
          {sugerido && pedidoId === sugerido.id && <small className="mt-dica">Pedido sugerido pelo fornecedor e pelos itens da nota.</small>}
        </label>

        {pedidoId === NOVO ? (
          <>
            <div className="dq-field">
              <span>Verba debitada</span>
              <div className="mt-seg" role="group" aria-label="Verba">
                <button type="button" className={destino === 'quadros' ? 'ativo' : ''} onClick={() => setDestino('quadros')}>Quadros</button>
                <button type="button" className={`infra ${destino === 'infraestrutura' ? 'ativo' : ''}`} onClick={() => setDestino('infraestrutura')}>Infraestrutura</button>
              </div>
            </div>
            <div className="mt-aviso warning"><PackagePlus size={16} /><span>Será criado um pedido com os {nfe.itens.length} itens da nota, já marcados como recebidos, e o valor de <Valor v={nfe.valorTotal} /> será descontado da verba escolhida.</span></div>
          </>
        ) : (
          <>
            <div className="mt-filtros">
              <span className="mt-selo ok">{contagem.ok} conferem</span>
              {contagem.divergente > 0 && <span className="mt-selo pend">{contagem.divergente} com divergência</span>}
              {contagem.semPedido > 0 && <span className="mt-selo infra">{contagem.semPedido} fora do pedido</span>}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="mt-tabela tabela-cartoes">
                <thead>
                  <tr><th /><th>Item da nota</th><th>Item do pedido</th><th className="num">Qtd. NF</th><th className="num">Dar baixa</th><th>Situação</th></tr>
                </thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={i} className={l.situacao === 'ok' ? 'chegou' : ''}>
                      <td>
                        <input type="checkbox" disabled={!l.itemPedido} checked={marcado(i, l)} onChange={(e) => setMarcados((m) => ({ ...m, [i]: e.target.checked }))} aria-label="Dar baixa neste item" />
                      </td>
                      <td style={{ fontWeight: 600 }}>{l.itemNota.codigo ? `${l.itemNota.codigo} - ` : ''}{l.itemNota.descricao}</td>
                      <td>{l.itemPedido ? l.itemPedido.description : <span className="mt-dica">—</span>}</td>
                      <td className="num">{l.itemNota.quantidade} {l.itemNota.unidade}</td>
                      <td className="num">
                        {l.itemPedido ? (
                          <input className="form-control" type="number" min="0" step="any" style={{ width: 80, padding: '0.2rem 0.4rem' }} value={qtd(i, l)} onChange={(e) => setQtds((q) => ({ ...q, [i]: e.target.value }))} />
                        ) : '—'}
                      </td>
                      <td>
                        {l.situacao === 'ok' ? <span className="mt-selo ok"><Check size={11} /> confere</span> : (
                          <span className="mt-dica" style={{ color: l.situacao === 'sem-pedido' ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>
                            <AlertTriangle size={11} /> {l.avisos.join(' · ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Math.abs((pedido?.totalValue || 0) - nfe.valorTotal) > 0.01 && (
              <span className="mt-dica">Valor da nota <Valor v={nfe.valorTotal} /> × valor do pedido <Valor v={pedido?.totalValue} /> (pode ser entrega parcial).</span>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={confirmar}>
            <Check size={15} /> {pedidoId === NOVO ? 'Criar pedido e dar baixa' : 'Confirmar recebimento'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
