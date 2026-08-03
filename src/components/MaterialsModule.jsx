import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { extractTextFromPDFFile, parsePurchaseOrderPDFText } from '../services/pdfParser';
import { 
  Package, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  DollarSign, 
  Plus, 
  Check, 
  X,
  Truck,
  TrendingUp,
  FileCheck,
  FileUp,
  ClipboardList,
  Trash2
} from 'lucide-react';

export const MaterialsModule = () => {
  const { isAdmin } = useAuth();
  const { activeObra, purchaseOrders, addPurchaseOrder, updatePOItemStatus, deletePurchaseOrder } = useData();

  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isDragOverPdf, setIsDragOverPdf] = useState(false);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('ALL');
  const [pdfStatus, setPdfStatus] = useState(null);

  // Manual / Paste Modal State
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [manualSupplier, setManualSupplier] = useState('');
  const [manualReqNum, setManualReqNum] = useState('');
  const [manualTotalValue, setManualTotalValue] = useState('');
  const [materialCategory, setMaterialCategory] = useState('quadros');

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <AlertCircle size={48} className="text-rose" style={{ marginBottom: '1rem' }} />
        <h3>Acesso Restrito ao Administrador</h3>
        <p style={{ color: 'var(--text-muted)' }}>Você não possui permissão para acessar o Controle de Materiais.</p>
      </div>
    );
  }

  const obraPOs = purchaseOrders.filter(po => po.obraId === activeObra?.id);

  // Calculate totals and delivery percentage
  let totalMaterialsValue = 0;
  let totalItemsOrderedCount = 0;
  let totalItemsArrivedCount = 0;

  obraPOs.forEach(po => {
    totalMaterialsValue += (parseFloat(po.totalValue) || 0);
    (po.items || []).forEach(itm => {
      totalItemsOrderedCount++;
      if (itm.status === 'Já Chegou') {
        totalItemsArrivedCount++;
      }
    });
  });

  const totalDeliveryPct = totalItemsOrderedCount > 0 
    ? Math.round((totalItemsArrivedCount / totalItemsOrderedCount) * 100) 
    : 0;

  // Filter POs by supplier
  const suppliersList = Array.from(new Set(obraPOs.map(po => po.fornecedor).filter(Boolean)));
  const filteredPOs = selectedSupplierFilter === 'ALL' 
    ? obraPOs 
    : obraPOs.filter(po => po.fornecedor === selectedSupplierFilter);

  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Process File (via input or drag & drop)
  const processPdfFile = async (file) => {
    if (!file || !activeObra) return;
    setIsLoadingPdf(true);
    setPdfStatus(null);
    try {
      const parsedData = await extractTextFromPDFFile(file);
      if (parsedData.error) {
        setPdfStatus({
          type: 'warning',
          message: parsedData.error
        });
      } else {
        const itemsCount = (parsedData.items || []).length;
        setPdfStatus({
          type: 'success',
          message: `PDF Lido com sucesso! Fornecedor: ${parsedData.fornecedor} | Req: ${parsedData.orderNumber} | ${itemsCount} itens encontrados | Total: ${formatBRL(parsedData.totalValue)}`
        });
      }
      addPurchaseOrder(activeObra.id, parsedData);
    } catch (err) {
      console.error('Erro ao ler PDF:', err);
      setPdfStatus({
        type: 'error',
        message: 'Erro ao processar PDF: ' + (err.message || 'Formato incompatível.')
      });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Drag and Drop PDF Handlers
  const handleDragOverArea = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOverPdf) setIsDragOverPdf(true);
  };

  const handleDragLeaveArea = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverPdf(false);
  };

  const handleDropArea = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverPdf(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processPdfFile(file);
    }
  };



  // Handle live auto-parse when pasting text into modal
  const handlePastedTextChange = (text) => {
    setPastedText(text);
    if (text && text.trim().length > 10) {
      const autoParsed = parsePurchaseOrderPDFText(text);
      if (autoParsed.fornecedor && autoParsed.fornecedor !== 'FORNECEDOR NÃO IDENTIFICADO') {
        setManualSupplier(autoParsed.fornecedor);
      }
      if (autoParsed.orderNumber && !autoParsed.orderNumber.startsWith('REQ-')) {
        setManualReqNum(autoParsed.orderNumber);
      }
      if (autoParsed.totalValue > 0) {
        setManualTotalValue(autoParsed.totalValue.toString());
      }
    }
  };

  // Handle Manual Text / Paste Submit
  const handlePasteSubmit = (e) => {
    e.preventDefault();
    if (!activeObra) return;

    let parsed = parsePurchaseOrderPDFText(pastedText || `${manualReqNum} ${manualSupplier} ${manualTotalValue}`);

    if (manualSupplier) parsed.fornecedor = manualSupplier.toUpperCase();
    if (manualReqNum) parsed.orderNumber = manualReqNum;
    if (manualTotalValue && !isNaN(parseFloat(manualTotalValue))) {
      parsed.totalValue = parseFloat(manualTotalValue);
    }
    parsed.destination = materialCategory || 'quadros';

    addPurchaseOrder(activeObra.id, parsed);
    setIsPasteModalOpen(false);
    setPastedText('');
    setManualSupplier('');
    setManualReqNum('');
    setManualTotalValue('');
    setPdfStatus({
      type: 'success',
      message: `Pedido cadastrado com sucesso! Fornecedor: ${parsed.fornecedor} | Total: ${formatBRL(parsed.totalValue)}`
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Package size={24} />
          </div>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: '0.15rem' }}>
              Gestão de Suprimentos & Balanço por Fornecedor
            </span>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              Controle de Materiais & Importação de Pedidos
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Obra: <strong>{activeObra?.name || 'Selecione uma Obra'}</strong>
            </p>
          </div>
        </div>

        {/* PDF Import Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setIsPasteModalOpen(true)} className="btn btn-secondary btn-sm">
            <ClipboardList size={14} className="text-amber" /> Colar / Inserir Pedido
          </button>

          <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={14} />
            <span>{isLoadingPdf ? 'Lendo PDF...' : 'Importar PDF'}</span>
            <input type="file" accept=".pdf" onChange={(e) => processPdfFile(e.target.files[0])} style={{ display: 'none' }} disabled={isLoadingPdf} />
          </label>
        </div>
      </div>

      {/* Status Banner do PDF */}
      {pdfStatus && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '0.85rem 1.25rem', 
            borderRadius: 'var(--radius-md)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: pdfStatus.type === 'success' 
              ? 'rgba(16, 185, 129, 0.12)' 
              : pdfStatus.type === 'warning' 
              ? 'rgba(245, 158, 11, 0.12)' 
              : 'rgba(244, 63, 94, 0.12)',
            borderLeft: `4px solid ${
              pdfStatus.type === 'success' 
                ? 'var(--accent-emerald, #10b981)' 
                : pdfStatus.type === 'warning' 
                ? 'var(--accent-amber, #f59e0b)' 
                : 'var(--accent-rose, #f43f5e)'
            }`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {pdfStatus.type === 'success' ? (
              <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald, #10b981)' }} />
            ) : pdfStatus.type === 'warning' ? (
              <AlertCircle size={18} style={{ color: 'var(--accent-amber, #f59e0b)' }} />
            ) : (
              <AlertCircle size={18} style={{ color: 'var(--accent-rose, #f43f5e)' }} />
            )}
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{pdfStatus.message}</span>
          </div>
          <button 
            onClick={() => setPdfStatus(null)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Drag & Drop PDF Zone */}
      <div 
        onDragOver={handleDragOverArea}
        onDragLeave={handleDragLeaveArea}
        onDrop={handleDropArea}
        className="glass-panel"
        style={{
          padding: '1.5rem 1rem',
          borderRadius: 'var(--radius-lg)',
          border: isDragOverPdf ? '2px dashed var(--accent-blue)' : '2px dashed var(--border-color)',
          background: isDragOverPdf ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-card)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <FileUp size={36} style={{ color: isDragOverPdf ? 'var(--accent-blue)' : 'var(--text-muted)', marginBottom: '0.5rem' }} />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          {isDragOverPdf ? 'Solte o arquivo PDF aqui!' : '📁 Arraste e solte o arquivo PDF do Pedido de Compra aqui'}
        </h3>
        <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
          Ou clique para procurar. O leitor extrai fornecedor, os 12 itens do pedido e desconta automaticamente da verba da obra.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-blue)' }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Total Investido em Materiais</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{formatBRL(totalMaterialsValue)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Descontado automaticamente da Verba</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Taxa de Entrega de Materiais</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{totalDeliveryPct}%</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{totalItemsArrivedCount} de {totalItemsOrderedCount} itens já chegaram</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Itens Pendentes (Falta Chegar)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{totalItemsOrderedCount - totalItemsArrivedCount} itens</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Aguardando entrega do fornecedor</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Fornecedores Ativos</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{suppliersList.length} Fornecedores</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{obraPOs.length} Pedidos de Compra</div>
        </div>
      </div>

      {/* Supplier Filter Tabs */}
      {suppliersList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>Filtrar Fornecedor:</span>
          <button
            onClick={() => setSelectedSupplierFilter('ALL')}
            className="btn btn-secondary btn-sm"
            style={{
              background: selectedSupplierFilter === 'ALL' ? 'var(--accent-blue)' : 'var(--bg-main)',
              color: selectedSupplierFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
              borderColor: selectedSupplierFilter === 'ALL' ? 'var(--accent-blue)' : 'var(--border-color)'
            }}
          >
            Todos ({obraPOs.length})
          </button>
          {suppliersList.map(supplier => (
            <button
              key={supplier}
              onClick={() => setSelectedSupplierFilter(supplier)}
              className="btn btn-secondary btn-sm"
              style={{
                background: selectedSupplierFilter === supplier ? 'var(--accent-blue)' : 'var(--bg-main)',
                color: selectedSupplierFilter === supplier ? '#fff' : 'var(--text-secondary)',
                borderColor: selectedSupplierFilter === supplier ? 'var(--accent-blue)' : 'var(--border-color)'
              }}
            >
              🚚 {supplier.split(' ')[0]} {supplier.split(' ')[1] || ''}
            </button>
          ))}
        </div>
      )}

      {/* Purchase Orders List & Materials Balance */}
      {filteredPOs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredPOs.map((po) => {
            const poItems = po.items || [];
            const poArrivedCount = poItems.filter(i => i.status === 'Já Chegou').length;
            const poTotalCount = poItems.length || 1;
            const poProgressPct = Math.round((poArrivedCount / poTotalCount) * 100);

            return (
              <div key={po.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                {/* PO Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className="badge badge-blue">
                        Req Nº {po.orderNumber || '17355'}
                      </span>
                      <span className="badge badge-purple">
                        NF: {po.nfNumber || '127528'}
                      </span>
                      <span className="badge badge-amber">
                        📅 {po.date}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      🚚 Fornecedor: <span style={{ color: 'var(--accent-blue)' }}>{po.fornecedor}</span>
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {formatBRL(po.totalValue)}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        Descontado do Saldo da Obra
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja EXCLUIR o pedido ${po.orderNumber} (${po.fornecedor})?\nO valor de ${formatBRL(po.totalValue)} será reembolsado na verba da obra.`)) {
                            deletePurchaseOrder(po.id);
                            setPdfStatus({
                              type: 'warning',
                              message: `Pedido ${po.orderNumber} excluído e ${formatBRL(po.totalValue)} reembolsado na verba da obra.`
                            });
                          }
                        }}
                        className="btn btn-danger btn-sm"
                        title="Excluir Pedido / Orçamento"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar of Delivery for this Supplier */}
                <div style={{ padding: '0.75rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.25rem' }}>
                    <span>Progresso de Recebimento ({po.fornecedor})</span>
                    <strong style={{ color: poProgressPct === 100 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {poArrivedCount} de {poTotalCount} itens recebidos ({poProgressPct}%)
                    </strong>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${poProgressPct}%`, height: '100%', background: poProgressPct === 100 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }} />
                  </div>
                </div>

                {/* Table of Items */}
                <div className="table-responsive" style={{ marginTop: '0.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.725rem' }}>
                        <th style={{ padding: '0.5rem' }}>Código / Produto</th>
                        <th style={{ padding: '0.5rem', width: '90px' }}>Qtde</th>
                        <th style={{ padding: '0.5rem', width: '70px' }}>Unidade</th>
                        <th style={{ padding: '0.5rem', width: '110px' }}>Vl. Unitário</th>
                        <th style={{ padding: '0.5rem', width: '110px' }}>Valor Total</th>
                        <th style={{ padding: '0.5rem', width: '160px', textAlign: 'center' }}>Status de Entrega</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', background: item.status === 'Já Chegou' ? 'rgba(5, 150, 105, 0.05)' : 'transparent' }}>
                          <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.description}
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>
                            {item.quantityOrdered}
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>
                            {item.unit}
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>
                            {formatBRL(item.unitPrice)}
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                            {formatBRL(item.totalPrice)}
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => updatePOItemStatus(po.id, item.id, 'Já Chegou')}
                                className="btn btn-sm"
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.7rem',
                                  background: item.status === 'Já Chegou' ? 'var(--accent-emerald)' : 'var(--bg-main)',
                                  color: item.status === 'Já Chegou' ? '#ffffff' : 'var(--text-muted)',
                                  borderColor: item.status === 'Já Chegou' ? 'var(--accent-emerald)' : 'var(--border-color)'
                                }}
                              >
                                <Check size={12} /> Já Chegou
                              </button>

                              <button
                                onClick={() => updatePOItemStatus(po.id, item.id, 'Falta Chegar')}
                                className="btn btn-sm"
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.7rem',
                                  background: item.status === 'Falta Chegar' ? 'var(--accent-amber)' : 'var(--bg-main)',
                                  color: item.status === 'Falta Chegar' ? '#ffffff' : 'var(--text-muted)',
                                  borderColor: item.status === 'Falta Chegar' ? 'var(--accent-amber)' : 'var(--border-color)'
                                }}
                              >
                                <Clock size={12} /> Falta Chegar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border-color)', maxWidth: '560px', margin: '2rem auto' }}>
          <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Nenhum Pedido de Compra Importado
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Arraste e solte o arquivo PDF do pedido de compra na área acima ou clique em "Colar / Inserir Pedido" para cadastrar os materiais da obra.
          </p>
          <button onClick={() => setIsPasteModalOpen(true)} className="btn btn-primary">
            <ClipboardList size={16} /> Colar / Inserir Pedido Manualmente
          </button>
        </div>
      )}

      {/* Modal: Paste / Manual Purchase Order Entry */}
      {isPasteModalOpen && (
        <div className="mobile-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="glass-panel mobile-modal-content" style={{ width: '100%', maxWidth: '550px', borderRadius: 'var(--radius-lg)', padding: '1.5rem', overflowY: 'auto', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Colar Texto do PDF / Cadastrar Pedido</h3>
              <button onClick={() => setIsPasteModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label>Nome do Fornecedor:</label>
                <input
                  type="text"
                  className="form-control"
                  value={manualSupplier}
                  onChange={(e) => setManualSupplier(e.target.value)}
                  placeholder="Ex: CAREL SUD AMERICA INSTRUMENTAÇÃO ELETRONICA LTDA"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Destinação da Verba do Material *</label>
                <select
                  className="form-control"
                  value={materialCategory}
                  onChange={(e) => setMaterialCategory(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="quadros">⚡ Quadros & Painéis (Debitar da Verba de Materiais)</option>
                  <option value="infraestrutura">🛠️ Infraestrutura em Campo (Debitar da Verba de Infraestrutura)</option>
                </select>
              </div>

              <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Nº Requisição / Pedido:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={manualReqNum}
                    onChange={(e) => setManualReqNum(e.target.value)}
                    placeholder="Ex: 17355"
                  />
                </div>

                <div className="form-group">
                  <label>Valor Total (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={manualTotalValue}
                    onChange={(e) => setManualTotalValue(e.target.value)}
                    placeholder="Ex: 27988.87"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Colar Conteúdo / Texto do Pedido (Opcional):</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={pastedText}
                  onChange={(e) => handlePastedTextChange(e.target.value)}
                  placeholder="Cole aqui o texto copiado do PDF do pedido (código, itens, valores)..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsPasteModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Cadastrar e Descontar da Verba
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
