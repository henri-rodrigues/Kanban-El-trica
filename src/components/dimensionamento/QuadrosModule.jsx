import React, { useMemo, useState } from 'react';
import {
  Plus, Zap, ArrowLeft, Trash2, Printer, Download, FolderOpen, Kanban, ListChecks, FileText, SlidersHorizontal,
  ClipboardCheck, Search, QrCode
} from 'lucide-react';
import { imprimirEtiquetas } from '../../services/etiquetasQr';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { TIPOS_QUADRO, PADRAO_QUADRO, dimensionar, bomParaCSV } from '../../services/quadros/dimensionamento';
import { QuadroEditor } from './QuadroEditor';
import { QuadroResultado } from './QuadroResultado';
import { CalculadorasPanel } from './CalculadorasPanel';
import { NormasBase } from './NormasBase';
import { KanbanBoard } from '../KanbanBoard';
import { ChecklistModule } from '../ChecklistModule';
import { baixar, nomeArquivo, relatorioQuadroHtml, imprimirHtml, fmt, dataHora } from './helpers';
import './dimensionamento.css';

// Calculadoras ligadas ao painel; as de infraestrutura (cabo, eletroduto, queda) ficam no módulo Infraestrutura.
export const IDS_CALC_QUADRO = ['motor', 'corrente', 'curto', 'fp', 'ventilacao', 'estrela'];

const ABAS_LISTA = [
  ['quadros', 'Quadros da obra'],
  ['calculos', 'Calculadoras do quadro'],
  ['base', 'Normas e base']
];

const calcular = (doc) => {
  if (!doc?.geradoEm) return null;
  try {
    return dimensionar({ ...PADRAO_QUADRO, ...doc });
  } catch {
    return null;
  }
};

/** Barra de progresso (concluídos / total de post-its). */
const Progresso = ({ feitos, total }) => {
  const pct = total ? Math.round((feitos / total) * 100) : 0;
  return (
    <div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--border-color)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--accent-emerald)' : 'var(--accent-blue)', transition: 'width 0.4s var(--ease)' }} />
      </div>
      <span className="dq-sub">{feitos}/{total} post-its concluídos · {pct}%</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pasta de um quadro: Kanban + lista de materiais + entregáveis + dimensionamento
// ---------------------------------------------------------------------------
const QuadroPasta = ({ quadro, doc, obra, obraQuadros, abaInicial, onVoltar, onNavigate, onOpenObraModal }) => {
  const { isAdmin } = useAuth();
  const { cards, laudos, deleteQuadro, deleteDimensionamento } = useData();
  const [aba, setAba] = useState(abaInicial || (doc?.geradoEm ? 'kanban' : 'dimensionamento'));

  const resultado = useMemo(() => calcular(doc), [doc]);
  const postits = cards.filter((c) => c.quadroId === quadro.id);
  const feitos = postits.filter((c) => c.column === 'completed').length;
  const qtdLaudos = laudos.filter((l) => l.quadroId === quadro.id).length;

  const exportarCsv = () =>
    resultado && baixar(`${nomeArquivo(doc.nome)}-lista-de-materiais.csv`, bomParaCSV(resultado));

  const imprimir = () => {
    if (!resultado) return;
    imprimirHtml(relatorioQuadroHtml({ quadro: doc, resultado, obra, responsavel: doc.updatedBy ?? doc.createdBy }));
  };

  const excluir = () => {
    if (!window.confirm(`Excluir o quadro "${quadro.name}"?\nA pasta, o dimensionamento e todos os post-its dele serão apagados.`)) return;
    if (doc) deleteDimensionamento(doc.id);
    deleteQuadro(quadro.id);
    onVoltar();
  };

  const abas = [
    ['kanban', 'Kanban', Kanban, postits.length],
    ['materiais', 'Lista de materiais', ListChecks, resultado ? resultado.resumo.itens : null],
    ['entregaveis', 'Entregáveis', FileText, null],
    ['checklist', 'Checklist', ClipboardCheck, qtdLaudos],
    ['dimensionamento', 'Dimensionamento', SlidersHorizontal, null]
  ];

  const semResultado = (
    <div className="dq-empty">
      <Zap size={34} style={{ opacity: 0.5 }} />
      <h3 style={{ margin: '0.5rem 0 0.25rem' }}>Este quadro ainda não foi dimensionado</h3>
      <p>Informe os dados do painel e os equipamentos para gerar a lista de materiais e os entregáveis.</p>
      <button type="button" className="btn btn-primary" style={{ marginTop: '0.9rem' }} onClick={() => setAba('dimensionamento')}>
        <SlidersHorizontal size={15} /> Dimensionar o quadro
      </button>
    </div>
  );

  return (
    <div className="dq-scope">
      <div className="dq-bar">
        <button type="button" className="btn btn-secondary" onClick={onVoltar}><ArrowLeft size={15} /> Quadros</button>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <FolderOpen size={19} style={{ color: 'var(--accent-blue)' }} /> {quadro.name}
          </h2>
          <span className="dq-sub">
            {doc ? `${doc.tensao} V · ${TIPOS_QUADRO[doc.tipo]?.rotulo ?? doc.tipo}` : 'Sem dimensionamento'}
            {doc?.updatedAt ? ` · atualizado em ${dataHora(doc.updatedAt)}` : ''}
          </span>
        </div>
        <span className="dq-spacer" />
        {resultado && (
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportarCsv}><Download size={13} /> CSV</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={imprimir}><Printer size={13} /> Imprimir / PDF</button>
          </>
        )}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => imprimirEtiquetas(obra, [quadro])} title="Etiqueta para colar no painel: abre esta pasta pelo celular">
          <QrCode size={13} /> Etiqueta QR
        </button>
        {isAdmin && (
          <button type="button" className="btn btn-danger btn-sm" onClick={excluir}><Trash2 size={13} /> Excluir quadro</button>
        )}
      </div>

      <div className="dq-card" style={{ padding: '0.75rem 1rem' }}>
        <Progresso feitos={feitos} total={postits.length} />
      </div>

      <div className="dq-tabs" role="tablist" style={{ flexWrap: 'wrap' }}>
        {abas.map(([id, rotulo, Icone, qtd]) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'active' : ''} onClick={() => setAba(id)}>
            <Icone size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />
            {rotulo}{qtd != null ? ` (${qtd})` : ''}
          </button>
        ))}
      </div>

      {aba === 'kanban' && (
        <KanbanBoard modoPasta onOpenObraModal={onOpenObraModal} onNavigate={onNavigate} />
      )}

      {aba === 'materiais' && (resultado ? (
        <QuadroResultado
          quadro={doc}
          resultado={resultado}
          mostrar={['resumo', 'bom']}
          onLinhas={() => setAba('dimensionamento')}
          onCsv={exportarCsv}
          onPrint={imprimir}
        />
      ) : semResultado)}

      {aba === 'entregaveis' && (resultado ? (
        <QuadroResultado
          quadro={doc}
          resultado={resultado}
          mostrar={['cargas', 'protecoes', 'layout', 'memorial']}
          onLinhas={() => setAba('dimensionamento')}
          onCsv={exportarCsv}
          onPrint={imprimir}
        />
      ) : semResultado)}

      {aba === 'checklist' && <ChecklistModule quadroFixoId={quadro.id} />}

      {aba === 'dimensionamento' && (
        <QuadroEditor
          key={quadro.id}
          initial={doc || { quadroObraId: quadro.id, nome: quadro.name }}
          obra={obra}
          obraQuadros={obraQuadros}
          modoPasta
          onGerado={() => setAba('materiais')}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tela "Quadros": lista de pastas + calculadoras do quadro + normas
// ---------------------------------------------------------------------------
export const QuadrosModule = ({ onOpenObraModal, onNavigate }) => {
  const {
    activeObra, activeQuadros, dimensionamentos, cards, laudos, selectedQuadroId, setSelectedQuadroId,
    addQuadro, saveDimensionamento
  } = useData();

  const [aba, setAba] = useState('quadros');
  const [criando, setCriando] = useState(false);
  const [abaInicial, setAbaInicial] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos'); // todos | dimensionar | andamento | concluidos

  if (!activeObra) {
    return (
      <div className="dq-scope">
        <div className="dq-empty">
          <Zap size={36} style={{ opacity: 0.5 }} />
          <h3 style={{ margin: '0.5rem 0 0.25rem' }}>Nenhuma obra selecionada</h3>
          <p>Selecione uma obra na Vitrine para ver e criar os quadros dela.</p>
        </div>
      </div>
    );
  }

  const docsObra = dimensionamentos
    .filter((d) => d.obraId === activeObra.id)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));

  const docDoQuadro = (q) =>
    docsObra.find((d) => d.quadroObraId === q.id) || docsObra.find((d) => d.id === q.dimensionamentoId) || null;

  // Dimensionamentos antigos, criados antes de existir a pasta.
  const orfaos = docsObra.filter((d) => !d.quadroObraId || !activeQuadros.some((q) => q.id === d.quadroObraId));

  const abrirPasta = (quadro, doc) => {
    setAbaInicial(doc?.geradoEm ? 'kanban' : 'dimensionamento');
    setSelectedQuadroId(quadro.id);
  };

  const criarPastaDoOrfao = (doc) => {
    const quadroId = addQuadro({ name: doc.nome, dimensionamentoId: doc.id });
    if (quadroId) {
      saveDimensionamento(activeObra.id, { ...doc, quadroObraId: quadroId });
      setAbaInicial(doc.geradoEm ? 'materiais' : 'dimensionamento');
    }
  };

  const linhas = activeQuadros.map((q) => {
    const doc = docDoQuadro(q);
    const postits = cards.filter((c) => c.quadroId === q.id);
    const feitos = postits.filter((c) => c.column === 'completed').length;
    const laudosQ = laudos.filter((l) => l.quadroId === q.id).sort((a, b) => (b.dataHora ?? '').localeCompare(a.dataHora ?? ''));
    const pct = postits.length ? Math.round((feitos / postits.length) * 100) : 0;
    const estado = !doc?.geradoEm ? 'dimensionar' : pct === 100 ? 'concluidos' : 'andamento';
    return { q, doc, postits, feitos, laudosQ, pct, estado };
  });

  const resumoObra = {
    total: linhas.length,
    dimensionados: linhas.filter((l) => l.doc?.geradoEm).length,
    corrente: linhas.reduce((s, l) => s + (l.doc?.resumo?.correnteTotal || 0), 0),
    itens: linhas.reduce((s, l) => s + (l.doc?.resumo?.itens || 0), 0),
    avanco: linhas.length ? Math.round(linhas.reduce((s, l) => s + l.pct, 0) / linhas.length) : 0,
    laudos: linhas.reduce((s, l) => s + l.laudosQ.length, 0)
  };

  const termo = busca.trim().toLowerCase();
  const visiveis = linhas.filter((l) => {
    if (filtro !== 'todos' && l.estado !== filtro) return false;
    if (!termo) return true;
    return l.q.name.toLowerCase().includes(termo) || (TIPOS_QUADRO[l.doc?.tipo]?.rotulo ?? '').toLowerCase().includes(termo);
  });

  const exportarListaDaObra = () => {
    const cab = ['Quadro', 'Grupo', 'TAG', 'Modelo', 'Descrição', 'Qtd', 'Un', 'Fabricante'];
    const out = [];
    linhas.forEach((l) => {
      const r = calcular(l.doc);
      if (!r) return;
      r.bom.forEach((i) => out.push([l.q.name, i.grupo, i.tag, i.modelo, i.descricao, i.qtd, i.un, i.fabricante]));
    });
    if (!out.length) return;
    const csv = [cab, ...out].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    baixar(`${nomeArquivo(activeObra.name)}-lista-de-materiais-quadros.csv`, '\uFEFF' + csv);
  };

  // ----- criando um quadro novo (formulário de dimensionamento) -----
  if (criando) {
    return (
      <div className="dq-scope">
        <QuadroEditor
          key="novo"
          initial={null}
          obra={activeObra}
          obraQuadros={activeQuadros}
          onBack={() => setCriando(false)}
          onSalvo={(doc) => {
            setAbaInicial(doc.geradoEm ? 'materiais' : 'dimensionamento');
            setCriando(false); // a pasta abre sozinha: o quadro recém-criado já está selecionado
          }}
        />
      </div>
    );
  }

  // ----- pasta de um quadro -----
  const quadroSel = selectedQuadroId ? activeQuadros.find((q) => q.id === selectedQuadroId) : null;
  if (quadroSel) {
    return (
      <QuadroPasta
        key={quadroSel.id}
        quadro={quadroSel}
        doc={docDoQuadro(quadroSel)}
        obra={activeObra}
        obraQuadros={activeQuadros}
        abaInicial={abaInicial}
        onVoltar={() => {
          setAbaInicial(null);
          setSelectedQuadroId(null);
        }}
        onNavigate={onNavigate}
        onOpenObraModal={onOpenObraModal}
      />
    );
  }

  // ----- lista -----
  return (
    <div className="dq-scope">
      <div className="dq-bar">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Zap size={20} style={{ color: 'var(--accent-blue)' }} /> Quadros
          </h2>
          <p className="dq-sub">{activeObra.name} · cada quadro tem a sua pasta: kanban, lista de materiais e entregáveis</p>
        </div>
        <span className="dq-spacer" />
        {aba === 'quadros' && activeQuadros.length > 0 && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => imprimirEtiquetas(activeObra, activeQuadros)} title="Folha com as etiquetas QR de todos os quadros">
            <QrCode size={13} /> Etiquetas QR
          </button>
        )}
        {aba === 'quadros' && resumoObra.dimensionados > 0 && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportarListaDaObra} title="Lista de materiais de todos os quadros da obra">
            <Download size={13} /> Lista de materiais da obra
          </button>
        )}
        {aba === 'quadros' && (
          <button type="button" className="btn btn-primary" onClick={() => setCriando(true)}>
            <Plus size={15} /> Novo quadro
          </button>
        )}
      </div>

      <div className="dq-tabs" role="tablist">
        {ABAS_LISTA.map(([id, rotulo]) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'active' : ''} onClick={() => setAba(id)}>
            {rotulo}
          </button>
        ))}
      </div>

      {aba === 'quadros' && (
        activeQuadros.length === 0 && orfaos.length === 0 ? (
          <div className="dq-empty">
            <FolderOpen size={34} style={{ opacity: 0.5 }} />
            <h3 style={{ margin: '0.5rem 0 0.25rem' }}>Nenhum quadro nesta obra</h3>
            <p>Ao criar um quadro você dimensiona o painel e a pasta dele nasce pronta, com os post-its padrão, a lista de materiais e os entregáveis.</p>
            <button type="button" className="btn btn-primary" style={{ marginTop: '0.9rem' }} onClick={() => setCriando(true)}>
              <Plus size={15} /> Criar o primeiro quadro
            </button>
          </div>
        ) : (
          <>
            <div className="ql-kpis">
              <div className="ql-kpi"><span>Quadros</span><strong>{resumoObra.total}</strong><small>{resumoObra.dimensionados} dimensionado(s)</small></div>
              <div className="ql-kpi"><span>Avanço médio</span><strong>{resumoObra.avanco}%</strong><small>dos post-its concluídos</small></div>
              <div className="ql-kpi"><span>Corrente total</span><strong>{resumoObra.corrente ? `${fmt(resumoObra.corrente, 1)} A` : '—'}</strong><small>soma dos painéis</small></div>
              <div className="ql-kpi"><span>Itens na lista</span><strong>{resumoObra.itens}</strong><small>{resumoObra.laudos} laudo(s) de checklist</small></div>
            </div>

            {activeQuadros.length > 1 && (
              <div className="ql-filtros">
                <label className="ql-busca">
                  <Search size={14} />
                  <input className="form-control" placeholder="Buscar quadro ou tipo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
                </label>
                <div className="ql-chips" role="group" aria-label="Situação">
                  {[['todos', 'Todos'], ['dimensionar', 'Falta dimensionar'], ['andamento', 'Em andamento'], ['concluidos', 'Concluídos']].map(([id, rot]) => (
                    <button key={id} type="button" className={`ql-chip ${filtro === id ? 'ativo' : ''}`} onClick={() => setFiltro(id)}>{rot}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="dq-grid-cards">
            {visiveis.length === 0 && activeQuadros.length > 0 && (
              <p className="dq-sub" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem' }}>Nenhum quadro com esses filtros.</p>
            )}
            {visiveis.map(({ q, doc, postits, feitos, laudosQ }) => {
              const ultimo = laudosQ[0];
              return (
                <button key={q.id} type="button" className="dq-card dq-quadro-card" onClick={() => abrirPasta(q, doc)}>
                  <span className={`dq-pill ${doc?.geradoEm ? 'ok' : 'warn'}`}>{doc?.geradoEm ? `${doc.tensao} V` : 'Falta dimensionar'}</span>
                  <strong style={{ fontSize: '1rem', paddingRight: '6.5rem' }}>
                    <FolderOpen size={15} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--accent-blue)' }} />
                    {q.name}
                  </strong>
                  <span className="dq-muted">
                    {doc ? (TIPOS_QUADRO[doc.tipo]?.rotulo ?? doc.tipo) : 'Quadro sem dimensionamento'}
                  </span>
                  <span className="dq-sub">
                    {doc?.resumo
                      ? `${doc.resumo.correnteTotal ? `${fmt(doc.resumo.correnteTotal, 1)} A · ` : ''}${doc.resumo.caixa} · ${doc.resumo.itens} itens na lista`
                      : 'Lista de materiais ainda não gerada'}
                  </span>
                  <Progresso feitos={feitos} total={postits.length} />
                  <span className="dq-sub">
                    {ultimo
                      ? `Checklist: ${laudosQ.length} laudo(s) · último ${ultimo.estatisticas?.percentualConformidade ?? 0}% conforme${(ultimo.estatisticas?.naoConformes ?? 0) ? ` · ${ultimo.estatisticas.naoConformes} não conf.` : ''}`
                      : 'Checklist: nenhum laudo ainda'}
                  </span>
                </button>
              );
            })}

            {orfaos.map((d) => (
              <button key={d.id} type="button" className="dq-card dq-quadro-card" onClick={() => criarPastaDoOrfao(d)}>
                <span className="dq-pill purple">Sem pasta</span>
                <strong style={{ fontSize: '1rem', paddingRight: '5.5rem' }}>{d.nome || 'Sem nome'}</strong>
                <span className="dq-muted">{TIPOS_QUADRO[d.tipo]?.rotulo ?? d.tipo}</span>
                <span className="dq-sub">Dimensionamento antigo — clique para criar a pasta com os post-its padrão</span>
              </button>
            ))}
            </div>
          </>
        )
      )}

      {aba === 'calculos' && (
        <CalculadorasPanel
          obra={activeObra}
          dimensionamentos={docsObra}
          ids={IDS_CALC_QUADRO}
          tituloHistorico="Histórico de cálculos dos quadros"
        />
      )}
      {aba === 'base' && <NormasBase />}
    </div>
  );
};
