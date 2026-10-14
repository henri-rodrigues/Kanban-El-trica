import React, { useMemo, useState } from 'react';
import { Wrench, Calculator, Kanban, LayoutDashboard, CheckCircle2, Printer, Download } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CalculadorasPanel } from './CalculadorasPanel';
import { InfraKanbanView } from '../InfraKanbanView';
import { InfraResumo } from '../infra/InfraResumo';
import {
  IDS_CALC_INFRA, CATEGORIA_DA_CALCULADORA, ehCardInfra, subtarefasPadrao
} from '../../constants/infraestrutura';
import { baixar, nomeArquivo, imprimirHtml, h } from './helpers';
import {
  CATEGORIAS_INFRA, rotuloCategoria
} from '../../constants/infraestrutura';
import './dimensionamento.css';

export { IDS_CALC_INFRA };

export const InfraestruturaModule = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { activeObra, dimensionamentos, cards, addCard, purchaseOrders } = useData();
  const { isAdmin } = useAuth();

  const [aba, setAba] = useState('geral');
  const [categoria, setCategoria] = useState('todas');
  const [aviso, setAviso] = useState('');

  const cardsInfra = useMemo(
    () => cards.filter((c) => c.obraId === activeObra?.id && ehCardInfra(c)),
    [cards, activeObra]
  );

  if (!activeObra) {
    return (
      <div className="dq-scope">
        <div className="dq-empty">
          <Wrench size={36} style={{ opacity: 0.5 }} />
          <h3 style={{ margin: '0.5rem 0 0.25rem' }}>Nenhuma obra selecionada</h3>
          <p>Selecione uma obra na Vitrine para dimensionar e acompanhar a infraestrutura dela.</p>
        </div>
      </div>
    );
  }

  const quadrosDaObra = dimensionamentos.filter((d) => d.obraId === activeObra.id);

  const abrirKanban = (cat = 'todas') => {
    setCategoria(cat);
    setAba('kanban');
  };

  // Transforma um cálculo em tarefa do Kanban, já com as subtarefas da categoria.
  const criarTarefaDoCalculo = ({ calcId, titulo, descricao }) => {
    const categoriaTarefa = CATEGORIA_DA_CALCULADORA[calcId] || 'Infraestrutura Geral';
    addCard({
      title: titulo,
      description: descricao,
      fieldNotes: '',
      obraId: activeObra.id,
      quadroId: null,
      level: 'infra',
      categoryTag: categoriaTarefa,
      gradientId: 'amber',
      priority: 'Média',
      column: 'todo',
      assignedUserId: currentUser?.id,
      assignedUserName: currentUser?.name,
      subtasks: subtarefasPadrao(categoriaTarefa),
      origem: { tipo: 'calculo', calcId }
    });
    setAviso(`Tarefa criada no Kanban: ${titulo}`);
    setTimeout(() => setAviso(''), 5000);
  };

  const ROT_COLUNA = { todo: 'A fazer', in_progress: 'Em andamento', on_hold: 'Em espera', completed: 'Concluído' };
  const pedidosInfra = purchaseOrders.filter((p) => p.obraId === activeObra.id && p.destination === 'infraestrutura');
  const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const exportarCsv = () => {
    const l = [['Tarefa', 'Categoria', 'Situação', 'Prioridade', 'Responsável', 'Subtarefas concluídas', 'Subtarefas']];
    cardsInfra.forEach((c) => {
      const subs = c.subtasks || [];
      l.push([c.title, rotuloCategoria(c.categoryTag), ROT_COLUNA[c.column] || c.column, c.priority || 'Média', c.assignedUserName || '', subs.filter((s) => s.completed).length, subs.length]);
    });
    const csv = l.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    baixar(`infraestrutura-${nomeArquivo(activeObra.name)}.csv`, '\uFEFF' + csv);
  };

  const exportarPdf = () => {
    const total = cardsInfra.length;
    const feitas = cardsInfra.filter((c) => c.column === 'completed').length;
    const grupos = CATEGORIAS_INFRA.map((cat) => ({
      cat,
      itens: cardsInfra.filter((c) => (c.categoryTag || 'Infraestrutura Geral') === cat.id)
    })).filter((g) => g.itens.length);
    const itensPedido = pedidosInfra.flatMap((p) => (p.items || []).map((i) => ({ p, i })));
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Infraestrutura — ${h(activeObra.name)}</title><style>
      *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1f2733;margin:22px;font-size:12px;line-height:1.5}
      h1{font-size:20px;margin:0}.sub{color:#667085}.cab{border-bottom:3px solid #4f7cf0;padding-bottom:10px;margin-bottom:14px}
      h2{font-size:13px;margin:18px 0 8px;color:#2f4fa8;background:#eef3ff;padding:5px 8px;border-radius:5px}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}th{text-align:left;background:#f3f5fa;font-size:10px;text-transform:uppercase;padding:4px 6px}
      td{padding:4px 6px;border-bottom:1px solid #e3e7f0}.n{text-align:right;white-space:nowrap}
      @media print{body{margin:10mm}tr{break-inside:avoid}}
    </style></head><body>
      <div class="cab"><h1>Relatório de infraestrutura</h1>
        <div class="sub">${h(activeObra.name)} · ${feitas}/${total} tarefas concluídas</div>
        <div class="sub">3D Ar Condicionado · ${new Date().toLocaleDateString('pt-BR')}</div></div>
      ${grupos.map((g) => `<h2>${h(g.cat.rotulo)}</h2><table><tr><th>Tarefa</th><th>Situação</th><th>Prioridade</th><th>Responsável</th><th class="n">Subtarefas</th></tr>${g.itens.map((c) => {
        const subs = c.subtasks || [];
        return `<tr><td>${h(c.title)}</td><td>${h(ROT_COLUNA[c.column] || c.column)}</td><td>${h(c.priority || 'Média')}</td><td>${h(c.assignedUserName || '')}</td><td class="n">${subs.filter((s) => s.completed).length}/${subs.length}</td></tr>`;
      }).join('')}</table>`).join('')}
      ${isAdmin && itensPedido.length ? `<h2>Materiais de infraestrutura</h2><table><tr><th>Item</th><th>Fornecedor</th><th class="n">Qtd</th><th class="n">Total</th><th>Recebimento</th></tr>${itensPedido.map(({ p, i }) => `<tr><td>${h(i.description || '')}</td><td>${h(p.fornecedor || '')}</td><td class="n">${h(String(i.quantityOrdered ?? ''))}</td><td class="n">${brl(i.totalPrice)}</td><td>${i.status === 'Já Chegou' ? 'Recebido' : 'A receber'}</td></tr>`).join('')}</table>` : ''}
      <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})<\/script>
    </body></html>`;
    if (!imprimirHtml(html)) window.alert('Permita pop-ups para gerar o PDF.');
  };

  const abas = [
    ['geral', 'Visão geral', LayoutDashboard],
    ['calculos', 'Calculadoras', Calculator],
    ['kanban', `Kanban (${cardsInfra.length})`, Kanban]
  ];

  return (
    <div className="dq-scope">
      <div className="dq-bar">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Wrench size={20} style={{ color: 'var(--accent-blue)' }} /> Infraestrutura
          </h2>
          <p className="dq-sub">{activeObra.name} · cabos, eletrodutos e queda de tensão, com o acompanhamento da execução</p>
        </div>
        <span className="dq-spacer" />
        {cardsInfra.length > 0 && (
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportarCsv}><Download size={13} /> CSV</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportarPdf}><Printer size={13} /> PDF</button>
          </>
        )}
      </div>

      <div className="dq-tabs" role="tablist">
        {abas.map(([id, rotulo, Icone]) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'active' : ''} onClick={() => setAba(id)}>
            <Icone size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} /> {rotulo}
          </button>
        ))}
      </div>

      {aviso && (
        <div className="dq-alert" role="status" style={{ background: 'var(--wash-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <CheckCircle2 size={15} /> {aviso}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => abrirKanban('todas')}>Ver no Kanban</button>
        </div>
      )}

      {aba === 'geral' && (
        <InfraResumo
          obra={activeObra}
          cardsInfra={cardsInfra}
          onAbrirKanban={abrirKanban}
          onAbrirCalculadoras={() => setAba('calculos')}
          onNavigate={onNavigate}
        />
      )}

      {aba === 'calculos' && (
        <CalculadorasPanel
          obra={activeObra}
          dimensionamentos={quadrosDaObra}
          ids={IDS_CALC_INFRA}
          tituloHistorico="Histórico de cálculos de infraestrutura"
          onCriarTarefa={criarTarefaDoCalculo}
        />
      )}

      {aba === 'kanban' && <InfraKanbanView categoria={categoria} onCategoria={setCategoria} />}
    </div>
  );
};
