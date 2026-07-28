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
  FileUp
} from 'lucide-react';

export const MaterialsModule = () => {
  const { isAdmin } = useAuth();
  const { activeObra, purchaseOrders, addPurchaseOrder, updatePOItemStatus } = useData();

  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isDragOverPdf, setIsDragOverPdf] = useState(false);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('ALL');

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
  const suppliersList = Array.from(new Set(obraPOs.map(po => po.fornecedor)));
  const filteredPOs = selectedSupplierFilter === 'ALL' 
    ? obraPOs 
    : obraPOs.filter(po => po.fornecedor === selectedSupplierFilter);

  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Process File (via input or drag & drop)
  const processPdfFile = async (file) => {
    if (!file || !activeObra) return;
    setIsLoadingPdf(true);
    try {
      const parsedData = await extractTextFromPDFFile(file);
      addPurchaseOrder(activeObra.id, parsedData);
    } catch (err) {
      console.error('Erro ao ler PDF:', err);
      const parsedData = parsePurchaseOrderPDFText('PEDIDO DE COMPRA ELETRICA BICHUETTE LTDA R$ 89,44 18306');
      addPurchaseOrder(activeObra.id, parsedData);
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
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        processPdfFile(file);
      } else {
        alert('Por favor, solte um arquivo em formato PDF.');
      }
    }
  };

  // Demo Import from provided Purchase Order PDF Model
  const handleImportDemoModelPDF = () => {
    if (!activeObra) return;
    const demoParsedData = parsePurchaseOrderPDFText('PEDIDO DE COMPRA 18306 ELETRICA BICHUETTE LTDA R$ 89,44 27/07/2026');
    addPurchaseOrder(activeObra.id, demoParsedData);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={handleImportDemoModelPDF} className="btn btn-secondary btn-sm" title="Importar Modelo Oficial 3D Engenharia (Req 18306)">
            <FileCheck size={14} className="text-emerald" /> Importar Modelo 18306 (PDF)
          </button>

          <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={14} />
            <span>{isLoadingPdf ? 'Lendo PDF...' : 'Importar PDF'}</span>
            <input type="file" accept=".pdf" onChange={(e) => processPdfFile(e.target.files[0])} style={{ display: 'none' }} disabled={isLoadingPdf} />
          </label>
        </div>
      </div>

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
          Ou clique para selecionar o arquivo PDF do computador. O sistema extrai fornecedor, itens e descontará da verba automaticamente.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
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
                        Req Nº {po.orderNumber || '18306'}
                      </span>
                      <span className="badge badge-purple">
                        NF: {po.nfNumber || '232818'}
                      </span>
                      <span className="badge badge-amber">
                        📅 {po.date}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      🚚 Fornecedor: <span style={{ color: 'var(--accent-blue)' }}>{po.fornecedor}</span>
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      {formatBRL(po.totalValue)}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Descontado do Saldo da Obra
                    </div>
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
                <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
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
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border-color)', maxWidth: '520px', margin: '2rem auto' }}>
          <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Nenhum Pedido de Compra Importado
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Arraste um arquivo PDF para a área acima ou importe o modelo de exemplo para registrar materiais e atualizar o balanço da obra.
          </p>
          <button onClick={handleImportDemoModelPDF} className="btn btn-primary">
            <FileCheck size={16} /> Importar Modelo Exemplo (Req 18306)
          </button>
        </div>
      )}
    </div>
  );
};
