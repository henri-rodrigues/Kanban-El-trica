import React, { useMemo, useState } from 'react';
import {
  Package, Upload, CheckCircle2, AlertCircle, X, Check, Clock, ClipboardList, Trash2,
  Search, ChevronRight, Download, FileUp, ListChecks
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { extractTextFromPDFFile, parsePurchaseOrderPDFText } from '../services/pdfParser';
import { ModalShell } from './dimensionamento/ModalShell';
import { baixar, nomeArquivo } from './dimensionamento/helpers';
import './materiais/materiais.css';

const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const ehInfra = (po) => po.destination === 'infraestrutura';
const chegou = (i) => i.status === 'Já Chegou';

const resumoPedido = (po) => {
  const itens = po.items || [];
  const recebidos = itens.filter(chegou).length;
  const valorPendente = itens.filter((i) => !chegou(i)).reduce((s, i) => s + (Number(i.totalPrice) || 0), 0);
  return {
    itens,
    recebidos,
    total: itens.length,
    pendentes: itens.length - recebidos,
    pct: itens.length ? Math.round((recebidos / itens.length) * 100) : 0,
    completo: itens.length > 0 && recebidos === itens.length,
    valorPendente
  };
};

const BarraVerba = ({ gasto, verba }) => {
  if (!verba || verba <= 0) return null;
  const pct = Math.round((gasto / verba) * 100);
  const tom = pct > 100 ? 'rose' : pct > 85 ? 'amber' : '';
  return (
    <>
      <div className={`mt-barra ${tom}`}><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
      <small>{pct}% da verba de {brl(verba)}</small>
    </>
  );
};

export const MaterialsModule = () => {
  const { isAdmin } = useAuth();
  const {
    activeObra, purchaseOrders, addPurchaseOrder, updatePurchaseOrderCategory,
    updatePOItemStatus, deletePurchaseOrder
  } = useData();

  const [carregando, setCarregando] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [destinoImport, setDestinoImport] = useState('quadros'); // 'quadros' | 'infraestrutura'

  const [busca, setBusca] = useState('');
  const [fornecedor, setFornecedor] = useState('ALL');
  const [destino, setDestino] = useState('todos'); // todos | quadros | infraestrutura
  const [situacao, setSituacao] = useState('todos'); // todos | pendentes | completos
  const [abertos, setAbertos] = useState({}); // id -> bool (sobrescreve o padrão)

  // modal de cadastro manual
  const [modal, setModal] = useState(false);
  const [texto, setTexto] = useState('');
  const [mFornecedor, setMFornecedor] = useState('');
  const [mNumero, setMNumero] = useState('');
  const [mValor, setMValor] = useState('');
  const [mDestino, setMDestino] = useState('quadros');

  const obraPOs = useMemo(
    () => purchaseOrders.filter((po) => po.obraId === activeObra?.id),
    [purchaseOrders, activeObra]
  );

  const totais = useMemo(() => {
    let material = 0, infra = 0, itens = 0, recebidos = 0, valorPendente = 0;
    obraPOs.forEach((po) => {
      const v = parseFloat(po.totalValue) || 0;
      if (ehInfra(po)) infra += v; else material += v;
      const r = resumoPedido(po);
      itens += r.total;
      recebidos += r.recebidos;
      valorPendente += r.valorPendente;
    });
    return {
      material, infra, itens, recebidos, valorPendente,
      pendentes: itens - recebidos,
      pct: itens ? Math.round((recebidos / itens) * 100) : 0
    };
  }, [obraPOs]);

  const fornecedores = useMemo(
    () => [...new Set(obraPOs.map((po) => po.fornecedor).filter(Boolean))].sort(),
    [obraPOs]
  );

  const termo = busca.trim().toLowerCase();
  const filtrados = obraPOs.filter((po) => {
    if (fornecedor !== 'ALL' && po.fornecedor !== fornecedor) return false;
    if (destino === 'quadros' && ehInfra(po)) return false;
    if (destino === 'infraestrutura' && !ehInfra(po)) return false;
    const r = resumoPedido(po);
    if (situacao === 'pendentes' && r.pendentes === 0) return false;
    if (situacao === 'completos' && !r.completo) return false;
    if (!termo) return true;
    return (
      po.fornecedor?.toLowerCase().includes(termo) ||
      String(po.orderNumber || '').toLowerCase().includes(termo) ||
      String(po.nfNumber || '').toLowerCase().includes(termo) ||
      (po.items || []).some((i) => i.description?.toLowerCase().includes(termo) || String(i.code || '').includes(termo))
    );
  });

  if (!isAdmin) {
    return (
      <div className="mt-vazio">
        <AlertCircle size={36} />
        <h3>Acesso restrito ao administrador</h3>
        <p>Você não possui permissão para acessar o Controle de Materiais.</p>
      </div>
    );
  }

  if (!activeObra) {
    return (
      <div className="mt-vazio">
        <AlertCircle size={36} />
        <h3>Nenhuma obra selecionada</h3>
        <p>Selecione uma obra na Vitrine para controlar os pedidos de compra.</p>
      </div>
    );
  }

  // ---------------------------------------------------------------- importação
  const processarPdf = async (arquivo) => {
    if (!arquivo) return;
    setCarregando(true);
    setAviso(null);
    try {
      const dados = await extractTextFromPDFFile(arquivo);
      if (dados.error) {
        setAviso({ tipo: 'warning', texto: dados.error });
      } else {
        setAviso({
          tipo: 'success',
          texto: `PDF lido (${destinoImport === 'infraestrutura' ? 'Infraestrutura' : 'Materiais'}): ${dados.fornecedor} · Req ${dados.orderNumber} · ${brl(dados.totalValue)}`
        });
      }
      addPurchaseOrder(activeObra.id, { ...dados, destination: destinoImport });
    } catch (err) {
      console.error('Erro ao ler PDF:', err);
      setAviso({ tipo: 'error', texto: 'Erro ao processar o PDF: ' + (err.message || 'formato incompatível.') });
    } finally {
      setCarregando(false);
    }
  };

  const aoSoltar = (e) => {
    e.preventDefault();
    setArrastando(false);
    processarPdf(e.dataTransfer.files?.[0]);
  };

  const aoColar = (valor) => {
    setTexto(valor);
    if (valor && valor.trim().length > 10) {
      const p = parsePurchaseOrderPDFText(valor);
      if (p.fornecedor && p.fornecedor !== 'FORNECEDOR NÃO IDENTIFICADO') setMFornecedor(p.fornecedor);
      if (p.orderNumber && !p.orderNumber.startsWith('REQ-')) setMNumero(p.orderNumber);
      if (p.totalValue > 0) setMValor(String(p.totalValue));
    }
  };

  const fecharModal = () => {
    setModal(false);
    setTexto('');
    setMFornecedor('');
    setMNumero('');
    setMValor('');
  };

  const cadastrar = (e) => {
    e.preventDefault();
    const p = parsePurchaseOrderPDFText(texto || `${mNumero} ${mFornecedor} ${mValor}`);
    if (mFornecedor) p.fornecedor = mFornecedor.toUpperCase();
    if (mNumero) p.orderNumber = mNumero;
    if (mValor && !isNaN(parseFloat(mValor))) p.totalValue = parseFloat(mValor);
    p.destination = mDestino;
    addPurchaseOrder(activeObra.id, p);
    setAviso({ tipo: 'success', texto: `Pedido cadastrado: ${p.fornecedor} · ${brl(p.totalValue)}` });
    fecharModal();
  };

  // ---------------------------------------------------------------- ações
  const estaAberto = (po, r) => (po.id in abertos ? abertos[po.id] : !r.completo);
  const alternar = (po, r) => setAbertos((p) => ({ ...p, [po.id]: !estaAberto(po, r) }));

  const receberTodos = (po) =>
    (po.items || []).filter((i) => !chegou(i)).forEach((i) => updatePOItemStatus(po.id, i.id, 'Já Chegou'));

  const excluir = (po) => {
    if (!window.confirm(`Excluir o pedido ${po.orderNumber} (${po.fornecedor})?\nO valor de ${brl(po.totalValue)} será devolvido à verba da obra.`)) return;
    deletePurchaseOrder(po.id);
    setAviso({ tipo: 'warning', texto: `Pedido ${po.orderNumber} excluído e ${brl(po.totalValue)} devolvido à verba.` });
  };

  const exportarCsv = (somentePendentes) => {
    const linhas = [['Fornecedor', 'Pedido', 'NF', 'Destino', 'Código', 'Descrição', 'Qtde', 'Un', 'Vl. unitário', 'Vl. total', 'Situação']];
    filtrados.forEach((po) =>
      (po.items || []).forEach((i) => {
        if (somentePendentes && chegou(i)) return;
        linhas.push([
          po.fornecedor, po.orderNumber, po.nfNumber ?? '', ehInfra(po) ? 'Infraestrutura' : 'Quadros',
          i.code ?? '', i.description ?? '', i.quantityOrdered ?? '', i.unit ?? '',
          String(i.unitPrice ?? '').replace('.', ','), String(i.totalPrice ?? '').replace('.', ','),
          chegou(i) ? 'Recebido' : 'Pendente'
        ]);
      })
    );
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    baixar(`materiais-${nomeArquivo(activeObra.name)}${somentePendentes ? '-pendentes' : ''}.csv`, '﻿' + csv);
  };

  return (
    <div className="mt-wrap">
      <div className="mt-topo">
        <div>
          <h2><Package size={20} /> Controle de materiais</h2>
          <span className="mt-dica">{activeObra.name} · pedidos de compra, recebimento e verba</span>
        </div>
        <span className="mt-espaco" />
        {obraPOs.length > 0 && (
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => exportarCsv(true)} disabled={totais.pendentes === 0}>
              <ListChecks size={14} /> Pendentes (CSV)
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => exportarCsv(false)}>
              <Download size={14} /> Tudo (CSV)
            </button>
          </>
        )}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setMDestino(destinoImport); setModal(true); }}>
          <ClipboardList size={14} /> Inserir manualmente
        </button>
      </div>

      {aviso && (
        <div className={`mt-aviso ${aviso.tipo}`} role="status">
          {aviso.tipo === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          <span>{aviso.texto}</span>
          <button type="button" aria-label="Fechar aviso" onClick={() => setAviso(null)}><X size={15} /></button>
        </div>
      )}

      <div className="mt-kpis">
        <div className="mt-kpi mt-kpi-blue">
          <span>Materiais (quadros)</span>
          <strong>{brl(totais.material)}</strong>
          <BarraVerba gasto={totais.material} verba={Number(activeObra.materialsBudget) || 0} />
        </div>
        <div className="mt-kpi mt-kpi-purple">
          <span>Infraestrutura</span>
          <strong>{brl(totais.infra)}</strong>
          <BarraVerba gasto={totais.infra} verba={Number(activeObra.infraBudget) || 0} />
        </div>
        <div className="mt-kpi mt-kpi-emerald">
          <span>Recebimento</span>
          <strong>{totais.pct}%</strong>
          <div className="mt-barra"><i style={{ width: `${totais.pct}%` }} /></div>
          <small>{totais.recebidos} de {totais.itens} itens</small>
        </div>
        <div className={`mt-kpi ${totais.pendentes ? 'mt-kpi-amber' : ''}`}>
          <span>A receber</span>
          <strong>{totais.pendentes} itens</strong>
          <small>{brl(totais.valorPendente)} em aberto · {fornecedores.length} fornecedor(es)</small>
        </div>
      </div>

      <div
        className={`mt-importar ${arrastando ? 'arrastando' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
      >
        <FileUp size={26} />
        <div className="mt-importar-texto">
          <strong>{arrastando ? 'Solte o PDF aqui' : 'Arraste o PDF do pedido de compra ou escolha o arquivo'}</strong>
          <span className="mt-dica">Lê fornecedor e itens e desconta o valor da verba escolhida ao lado.</span>
        </div>
        <div className="mt-seg" role="group" aria-label="Verba do pedido">
          <button type="button" className={destinoImport === 'quadros' ? 'ativo' : ''} onClick={() => setDestinoImport('quadros')}>Quadros</button>
          <button type="button" className={`infra ${destinoImport === 'infraestrutura' ? 'ativo' : ''}`} onClick={() => setDestinoImport('infraestrutura')}>Infraestrutura</button>
        </div>
        <label className="btn btn-primary btn-sm" style={{ cursor: carregando ? 'wait' : 'pointer' }}>
          <Upload size={14} /> {carregando ? 'Lendo PDF…' : 'Importar PDF'}
          <input
            type="file"
            accept=".pdf,application/pdf"
            hidden
            disabled={carregando}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; processarPdf(f); }}
          />
        </label>
      </div>

      {obraPOs.length > 0 && (
        <div className="mt-filtros">
          <label className="mt-busca">
            <Search size={14} />
            <input className="form-control" placeholder="Buscar fornecedor, pedido, NF ou item…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          <select className="form-control" style={{ width: 'auto' }} value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} aria-label="Fornecedor">
            <option value="ALL">Todos os fornecedores</option>
            {fornecedores.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <div className="mt-chips" role="group" aria-label="Verba">
            {[['todos', 'Todas as verbas'], ['quadros', 'Quadros'], ['infraestrutura', 'Infraestrutura']].map(([id, rot]) => (
              <button key={id} type="button" className={`mt-chip ${destino === id ? 'ativo' : ''}`} onClick={() => setDestino(id)}>{rot}</button>
            ))}
          </div>
          <div className="mt-chips" role="group" aria-label="Situação">
            {[['todos', 'Todos'], ['pendentes', 'Com pendências'], ['completos', 'Recebidos']].map(([id, rot]) => (
              <button key={id} type="button" className={`mt-chip ${situacao === id ? 'ativo' : ''}`} onClick={() => setSituacao(id)}>{rot}</button>
            ))}
          </div>
        </div>
      )}

      {obraPOs.length === 0 ? (
        <div className="mt-vazio">
          <Package size={36} />
          <h3>Nenhum pedido de compra nesta obra</h3>
          <p>Importe o PDF do pedido ou cadastre manualmente para acompanhar o recebimento dos materiais.</p>
          <button type="button" className="btn btn-primary" onClick={() => setModal(true)}>
            <ClipboardList size={15} /> Inserir pedido manualmente
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <p className="mt-dica" style={{ textAlign: 'center', padding: '1.5rem' }}>Nenhum pedido encontrado com esses filtros.</p>
      ) : (
        filtrados.map((po) => {
          const r = resumoPedido(po);
          const aberto = estaAberto(po, r);
          return (
            <article key={po.id} className={`mt-pedido ${ehInfra(po) ? 'infra' : ''} ${r.completo ? 'completo' : ''}`}>
              <div className="mt-pedido-cab" onClick={() => alternar(po, r)}>
                <ChevronRight size={18} className={`mt-seta ${aberto ? 'aberto' : ''}`} />
                <div className="mt-pedido-info">
                  <h3>{po.fornecedor}</h3>
                  <div className="mt-meta">
                    <span>Pedido {po.orderNumber || '—'}</span>
                    {po.nfNumber && po.nfNumber !== '0' && <span>· NF {po.nfNumber}</span>}
                    {po.date && <span>· {po.date}</span>}
                    <span className={`mt-selo ${ehInfra(po) ? 'infra' : ''}`}>{ehInfra(po) ? 'Infraestrutura' : 'Quadros'}</span>
                    {r.completo
                      ? <span className="mt-selo ok">Recebido</span>
                      : <span className="mt-selo pend">{r.pendentes} a receber</span>}
                  </div>
                </div>
                <div className="mt-prog">
                  <strong>{r.recebidos}/{r.total}</strong> itens
                  <div className={`mt-barra ${r.completo ? '' : 'amber'}`}><i style={{ width: `${r.pct}%` }} /></div>
                </div>
                <div className="mt-valor">{brl(po.totalValue)}</div>
              </div>

              {aberto && (
                <div className="mt-corpo">
                  <div className="mt-acoes">
                    {!r.completo && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => receberTodos(po)}>
                        <Check size={13} /> Marcar tudo como recebido
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      title="Troca a verba debitada pelo pedido"
                      onClick={() => updatePurchaseOrderCategory(po.id, ehInfra(po) ? 'quadros' : 'infraestrutura')}
                    >
                      Mover para {ehInfra(po) ? 'Quadros' : 'Infraestrutura'}
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => excluir(po)}>
                      <Trash2 size={13} /> Excluir
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="mt-tabela">
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th className="num">Qtde</th>
                          <th className="oculta-mobile">Un</th>
                          <th className="num oculta-mobile">Vl. unit.</th>
                          <th className="num">Total</th>
                          <th>Recebimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.itens.map((i) => (
                          <tr key={i.id} className={chegou(i) ? 'chegou' : ''}>
                            <td style={{ fontWeight: 600 }}>{i.description}</td>
                            <td className="num">{i.quantityOrdered}</td>
                            <td className="oculta-mobile">{i.unit}</td>
                            <td className="num oculta-mobile">{brl(i.unitPrice)}</td>
                            <td className="num">{brl(i.totalPrice)}</td>
                            <td>
                              <button
                                type="button"
                                className={`mt-receber ${chegou(i) ? 'ok' : ''}`}
                                onClick={() => updatePOItemStatus(po.id, i.id, chegou(i) ? 'Falta Chegar' : 'Já Chegou')}
                                aria-pressed={chegou(i)}
                              >
                                {chegou(i) ? <><Check size={12} /> Recebido</> : <><Clock size={12} /> A receber</>}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {r.itens.length === 0 && (
                          <tr><td colSpan={6} className="mt-dica">Pedido sem itens detalhados (apenas o valor total foi lançado).</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}

      {modal && (
        <ModalShell title="Inserir pedido de compra" subtitle="Cole o texto do PDF para preencher automaticamente" onClose={fecharModal} maxWidth={560}>
          <form onSubmit={cadastrar} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <label className="dq-field">
              <span>Fornecedor *</span>
              <input className="form-control" required autoFocus value={mFornecedor} onChange={(e) => setMFornecedor(e.target.value)} placeholder="Ex.: CAREL SUD AMERICA LTDA" />
            </label>
            <div className="dq-field">
              <span>Verba debitada</span>
              <div className="mt-seg" role="group" aria-label="Verba">
                <button type="button" className={mDestino === 'quadros' ? 'ativo' : ''} onClick={() => setMDestino('quadros')}>Quadros</button>
                <button type="button" className={`infra ${mDestino === 'infraestrutura' ? 'ativo' : ''}`} onClick={() => setMDestino('infraestrutura')}>Infraestrutura</button>
              </div>
            </div>
            <div className="dq-grid">
              <label className="dq-field">
                <span>Nº do pedido</span>
                <input className="form-control" value={mNumero} onChange={(e) => setMNumero(e.target.value)} placeholder="Ex.: 17355" />
              </label>
              <label className="dq-field">
                <span>Valor total (R$) *</span>
                <input className="form-control" type="number" step="0.01" min="0" required value={mValor} onChange={(e) => setMValor(e.target.value)} placeholder="27988.87" />
              </label>
            </div>
            <label className="dq-field">
              <span>Texto do pedido (opcional)</span>
              <textarea className="form-control" rows={5} value={texto} onChange={(e) => aoColar(e.target.value)} placeholder="Cole aqui o texto copiado do PDF (código, itens, valores)…" />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
              <button type="submit" className="btn btn-primary"><Check size={15} /> Cadastrar e descontar da verba</button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
};
