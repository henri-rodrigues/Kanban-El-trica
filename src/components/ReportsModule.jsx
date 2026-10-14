import React, { useMemo, useState } from 'react';
import {
  BarChart3, AlertCircle, FileText, FileSpreadsheet, Zap, Users, Layers, Wrench, ListChecks, Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ehCardInfra } from '../constants/infraestrutura';
import { baixar, h, imprimirHtml, nomeArquivo } from './dimensionamento/helpers';
import { montarResumoSemanal, resumoHtml } from '../services/resumoSemanal';
import './relatorios/relatorios.css';

const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const horasDoCard = (c) => (c.workedDays || []).reduce((s, w) => s + (Number(w.hours) || 0), 0);
const ROTULO_COLUNA = { todo: 'A fazer', in_progress: 'Em andamento', on_hold: 'Em espera', completed: 'Concluído' };
const SELO_COLUNA = { todo: 'par', in_progress: 'and', on_hold: '', completed: 'ok' };
const pctDe = (gasto, verba) => (verba > 0 ? Math.round((gasto / verba) * 100) : 0);
const tomBarra = (pct) => (pct > 100 ? 'rose' : pct > 85 ? 'amber' : '');

const Barra = ({ pct, tom = '' }) => (
  <div className={`rl-barra ${tom}`}><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
);

const ABAS = [
  { id: 'financeiro', rotulo: 'Financeiro', icone: Wallet },
  { id: 'equipe', rotulo: 'Equipe', icone: Users },
  { id: 'quadros', rotulo: 'Quadros', icone: Layers },
  { id: 'infra', rotulo: 'Infraestrutura', icone: Wrench },
  { id: 'atividades', rotulo: 'Atividades', icone: ListChecks }
];

export const ReportsModule = () => {
  const { isAdmin, users } = useAuth();
  const { activeObra, cards, purchaseOrders, quadros, laudos, getCardEvolutionPct, getObraLaborCostsAndDays } = useData();
  const [aba, setAba] = useState('financeiro');
  const [filtroColuna, setFiltroColuna] = useState('todas');

  const obraCards = useMemo(() => cards.filter((c) => c.obraId === activeObra?.id), [cards, activeObra]);
  const obraPOs = useMemo(() => purchaseOrders.filter((po) => po.obraId === activeObra?.id), [purchaseOrders, activeObra]);

  if (!isAdmin) {
    return (
      <div className="rl-vazio">
        <AlertCircle size={36} />
        <h3>Acesso restrito ao administrador</h3>
        <p>Você não possui permissão para acessar os relatórios financeiros.</p>
      </div>
    );
  }
  if (!activeObra) {
    return (
      <div className="rl-vazio">
        <AlertCircle size={36} />
        <h3>Nenhuma obra selecionada</h3>
        <p>Selecione uma obra na Vitrine para ver os relatórios.</p>
      </div>
    );
  }

  const { totalLaborCost, totalHours } = getObraLaborCostsAndDays(activeObra.id);
  const evol = (c) => getCardEvolutionPct(c.column);

  // ---- verbas
  const gastoMateriais = obraPOs.filter((p) => p.destination !== 'infraestrutura').reduce((s, p) => s + (parseFloat(p.totalValue) || 0), 0);
  const gastoInfra = obraPOs.filter((p) => p.destination === 'infraestrutura').reduce((s, p) => s + (parseFloat(p.totalValue) || 0), 0);
  const gastoViagens = (activeObra.scheduledTrips || []).reduce((s, t) => s + (parseFloat(t.cost) || 0), 0);

  const verbas = [
    { id: 'mao', nome: 'Mão de obra', verba: Number(activeObra.laborBudget) || 0, gasto: totalLaborCost },
    { id: 'mat', nome: 'Materiais (quadros)', verba: Number(activeObra.materialsBudget) || 0, gasto: gastoMateriais },
    { id: 'inf', nome: 'Infraestrutura', verba: Number(activeObra.infraBudget) || 0, gasto: gastoInfra },
    { id: 'ind', nome: 'Indiretos / viagens', verba: Number(activeObra.indirectsBudget) || 0, gasto: gastoViagens }
  ];
  const somaVerbas = verbas.reduce((s, v) => s + v.verba, 0);
  const verbaGeral = somaVerbas || Number(activeObra.initialBudget) || 0;
  const gastoGeral = verbas.reduce((s, v) => s + v.gasto, 0);
  const saldoGeral = verbaGeral - gastoGeral;
  const consumo = pctDe(gastoGeral, verbaGeral);

  // ---- execução
  const progresso = obraCards.length ? Math.round(obraCards.reduce((s, c) => s + evol(c), 0) / obraCards.length) : 0;
  const concluidos = obraCards.filter((c) => c.column === 'completed').length;

  const equipe = users
    .map((u) => {
      let horas = 0;
      let registros = 0;
      obraCards.forEach((c) =>
        (c.workedDays || []).forEach((w) => {
          if (w.operatorId === u.id || w.operatorName === u.name) {
            horas += Number(w.hours) || 0;
            registros++;
          }
        })
      );
      const diaria = u.dailyRate || 250;
      return { user: u, horas, registros, dias: Math.round((horas / 8) * 10) / 10, diaria, custo: (horas / 8) * diaria, share: totalHours ? Math.round((horas / totalHours) * 100) : 0 };
    })
    .filter((e) => e.horas > 0)
    .sort((a, b) => b.horas - a.horas);

  const cardsQuadro = obraCards.filter((c) => !ehCardInfra(c));
  const cardsInfra = obraCards.filter(ehCardInfra);
  const agrupar = (lista) => {
    const doObra = quadros.filter((q) => q.obraId === activeObra.id);
    const grupos = doObra
      .map((q) => ({ id: q.id, nome: q.name, cards: lista.filter((c) => c.quadroId === q.id) }))
      .filter((g) => g.cards.length > 0);
    const sem = lista.filter((c) => !doObra.some((q) => q.id === c.quadroId));
    if (sem.length) grupos.push({ id: 'geral', nome: 'Geral da obra', cards: sem });
    return grupos;
  };

  // ---- exportações
  const nomeBase = nomeArquivo(activeObra.code || activeObra.name);

  const exportarCsv = () => {
    const l = [];
    l.push(['RELATÓRIO DE OBRA'], ['Obra', activeObra.name], ['Cliente', activeObra.client || ''], ['Gerado em', new Date().toLocaleDateString('pt-BR')], []);
    l.push(['VERBAS'], ['Categoria', 'Verba (R$)', 'Gasto (R$)', 'Saldo (R$)', 'Consumo (%)']);
    verbas.forEach((v) => l.push([v.nome, v.verba, v.gasto.toFixed(2), (v.verba - v.gasto).toFixed(2), pctDe(v.gasto, v.verba)]));
    l.push(['TOTAL', verbaGeral, gastoGeral.toFixed(2), saldoGeral.toFixed(2), consumo], []);
    l.push(['EQUIPE'], ['Operador', 'Horas', 'Dias (8h)', 'Diária (R$)', 'Custo (R$)']);
    equipe.forEach((e) => l.push([e.user.name, e.horas, e.dias, e.diaria, e.custo.toFixed(2)]));
    l.push([], ['PEDIDOS DE COMPRA'], ['Pedido', 'Fornecedor', 'Verba', 'Data', 'Valor (R$)']);
    obraPOs.forEach((p) => l.push([p.orderNumber || '', p.fornecedor, p.destination === 'infraestrutura' ? 'Infraestrutura' : 'Quadros', p.date || '', p.totalValue]));
    l.push([], ['ATIVIDADES'], ['Atividade', 'Tipo', 'Situação', 'Evolução (%)', 'Horas']);
    obraCards.forEach((c) => l.push([c.title, ehCardInfra(c) ? 'Infraestrutura' : 'Quadro', ROTULO_COLUNA[c.column] || c.column, evol(c), horasDoCard(c)]));
    const csv = l.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    baixar(`Relatorio_${nomeBase}.csv`, '﻿' + csv);
  };

  const exportarPowerBI = () => {
    const dados = {
      Fact_Obra: {
        id: activeObra.id, name: activeObra.name, code: activeObra.code, client: activeObra.client,
        totalBudget: verbaGeral, totalSpent: gastoGeral, remaining: saldoGeral, progress: progresso
      },
      Fact_Verbas: verbas.map((v) => ({ categoria: v.nome, verba: v.verba, gasto: v.gasto, saldo: v.verba - v.gasto })),
      Fact_Materiais: obraPOs.map((p) => ({
        id: p.id, pedido: p.orderNumber, fornecedor: p.fornecedor, destino: p.destination || 'quadros',
        data: p.date, valor: p.totalValue, itens: (p.items || []).length,
        itensRecebidos: (p.items || []).filter((i) => i.status === 'Já Chegou').length
      })),
      Fact_MaoDeObra: equipe.map((e) => ({ operador: e.user.name, horas: e.horas, dias: e.dias, diaria: e.diaria, custo: e.custo })),
      Fact_Atividades: obraCards.map((c) => ({
        id: c.id, titulo: c.title, coluna: c.column, evolucao: evol(c), horas: horasDoCard(c), infraestrutura: ehCardInfra(c)
      }))
    };
    baixar(`PowerBI_${nomeBase}.json`, JSON.stringify(dados, null, 2), 'application/json');
  };

  const exportarPdf = () => {
    const linhasVerba = verbas.map((v) => `<tr><td>${h(v.nome)}</td><td class="n">${brl(v.verba)}</td><td class="n">${brl(v.gasto)}</td><td class="n ${v.verba - v.gasto < 0 ? 'neg' : ''}">${brl(v.verba - v.gasto)}</td><td class="n">${pctDe(v.gasto, v.verba)}%</td></tr>`).join('');
    const linhasEquipe = equipe.map((e) => `<tr><td>${h(e.user.name)}</td><td class="n">${e.horas}h</td><td class="n">${e.dias}</td><td class="n">${brl(e.diaria)}</td><td class="n">${brl(e.custo)}</td></tr>`).join('');
    const linhasPO = obraPOs.map((p) => `<tr><td>${h(p.orderNumber || '')}</td><td>${h(p.fornecedor)}</td><td>${p.destination === 'infraestrutura' ? 'Infraestrutura' : 'Quadros'}</td><td class="n">${brl(p.totalValue)}</td></tr>`).join('');
    const grupo = (g) => `<h3>${h(g.nome)} — ${Math.round(g.cards.reduce((s, c) => s + evol(c), 0) / g.cards.length)}% · ${g.cards.reduce((s, c) => s + horasDoCard(c), 0)}h</h3>
      <table><tr><th>Atividade</th><th>Situação</th><th class="n">Evolução</th><th class="n">Horas</th></tr>${g.cards.map((c) => `<tr><td>${h(c.title)}</td><td>${h(ROTULO_COLUNA[c.column] || c.column)}</td><td class="n">${evol(c)}%</td><td class="n">${horasDoCard(c)}h</td></tr>`).join('')}</table>`;
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório — ${h(activeObra.name)}</title><style>
      *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1f2733;margin:22px;font-size:12px;line-height:1.5}
      h1{font-size:20px;margin:0}.sub{color:#667085}.cab{border-bottom:3px solid #4f7cf0;padding-bottom:10px;margin-bottom:14px}
      h2{font-size:13px;margin:18px 0 8px;color:#2f4fa8;background:#eef3ff;padding:5px 8px;border-radius:5px}
      h3{font-size:12px;margin:12px 0 4px}table{width:100%;border-collapse:collapse;margin-bottom:8px}
      th{text-align:left;background:#f3f5fa;font-size:10px;text-transform:uppercase;padding:4px 6px}td{padding:4px 6px;border-bottom:1px solid #e3e7f0}
      .n{text-align:right;white-space:nowrap}.neg{color:#c0392b;font-weight:700}
      .resumo{display:flex;gap:10px;flex-wrap:wrap}.resumo div{flex:1;min-width:130px;border:1px solid #d9dfeb;border-radius:6px;padding:7px 10px}
      .resumo b{display:block;font-size:15px}.resumo span{font-size:10px;color:#667085;text-transform:uppercase}
      .rodape{margin-top:20px;font-size:10px;color:#667085;border-top:1px solid #d9dfeb;padding-top:6px}
      @media print{body{margin:10mm}h2{break-after:avoid}tr{break-inside:avoid}}
    </style></head><body>
      <div class="cab"><h1>Relatório de obra</h1>
        <div class="sub">${h(activeObra.name)}${activeObra.client ? ` · ${h(activeObra.client)}` : ''}</div>
        <div class="sub">3D Ar Condicionado · ${new Date().toLocaleDateString('pt-BR')}</div></div>
      <div class="resumo">
        <div><span>Verba geral</span><b>${brl(verbaGeral)}</b></div>
        <div><span>Gasto</span><b>${brl(gastoGeral)}</b></div>
        <div><span>Saldo</span><b class="${saldoGeral < 0 ? 'neg' : ''}">${brl(saldoGeral)}</b></div>
        <div><span>Avanço</span><b>${progresso}%</b></div>
      </div>
      <h2>Verbas</h2>
      <table><tr><th>Categoria</th><th class="n">Verba</th><th class="n">Gasto</th><th class="n">Saldo</th><th class="n">Consumo</th></tr>${linhasVerba}</table>
      ${equipe.length ? `<h2>Equipe</h2><table><tr><th>Operador</th><th class="n">Horas</th><th class="n">Dias</th><th class="n">Diária</th><th class="n">Custo</th></tr>${linhasEquipe}</table>` : ''}
      ${obraPOs.length ? `<h2>Pedidos de compra</h2><table><tr><th>Pedido</th><th>Fornecedor</th><th>Verba</th><th class="n">Valor</th></tr>${linhasPO}</table>` : ''}
      ${agrupar(cardsQuadro).length ? `<h2>Quadros</h2>${agrupar(cardsQuadro).map(grupo).join('')}` : ''}
      ${agrupar(cardsInfra).length ? `<h2>Infraestrutura</h2>${agrupar(cardsInfra).map(grupo).join('')}` : ''}
      <p class="rodape">Relatório gerado pelo sistema de gestão de obras.</p>
      <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})<\/script>
    </body></html>`;
    if (!imprimirHtml(html)) window.alert('Permita pop-ups para gerar o PDF.');
  };

  // ---- blocos
  const Grupos = ({ lista, vazio }) => {
    const grupos = agrupar(lista);
    if (!grupos.length) return <div className="rl-vazio"><p>{vazio}</p></div>;
    return grupos.map((g) => {
      const p = Math.round(g.cards.reduce((s, c) => s + evol(c), 0) / g.cards.length);
      const horas = g.cards.reduce((s, c) => s + horasDoCard(c), 0);
      return (
        <div className="rl-grupo" key={g.id}>
          <div className="rl-grupo-cab">
            <h4>{g.nome}</h4>
            <span className="rl-dica">{g.cards.length} atividades · {horas}h ({Math.round((horas / 8) * 10) / 10} dias)</span>
            <Barra pct={p} tom={p === 100 ? '' : 'amber'} />
            <strong>{p}%</strong>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="rl-tabela">
              <thead><tr><th>Atividade</th><th>Situação</th><th className="num">Evolução</th><th className="num">Horas</th></tr></thead>
              <tbody>
                {g.cards.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td><span className={`rl-selo ${SELO_COLUNA[c.column] ?? ''}`}>{ROTULO_COLUNA[c.column] || c.column}</span></td>
                    <td className="num">{evol(c)}%</td>
                    <td className="num">{horasDoCard(c)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    });
  };

  const atividades = obraCards
    .filter((c) => filtroColuna === 'todas' || c.column === filtroColuna)
    .sort((a, b) => horasDoCard(b) - horasDoCard(a));

  return (
    <div className="rl-wrap">
      <div className="rl-topo">
        <div>
          <h2><BarChart3 size={20} /> Relatórios</h2>
          <span className="rl-dica">{activeObra.name} · financeiro, equipe e execução</span>
        </div>
        <span className="rl-espaco" />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          title="O que avançou, o que está parado e o que está pendente nos últimos 7 dias"
          onClick={() => {
            const resumos = montarResumoSemanal({ obras: [activeObra], cards, pedidos: purchaseOrders, laudos });
            if (!imprimirHtml(resumoHtml(resumos, { titulo: `Resumo semanal — ${activeObra.name}`, paraImpressao: true }))) window.alert('Permita pop-ups para gerar o PDF.');
          }}
        >
          <FileText size={14} /> Resumo da semana
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={exportarPdf}><FileText size={14} /> PDF</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={exportarCsv}><FileSpreadsheet size={14} /> Excel (CSV)</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={exportarPowerBI}><Zap size={14} /> Power BI</button>
      </div>

      <div className="rl-kpis">
        <div className="rl-kpi blue"><span>Verba geral</span><strong>{brl(verbaGeral)}</strong><small>soma das 4 verbas</small></div>
        <div className="rl-kpi">
          <span>Gasto</span><strong>{brl(gastoGeral)}</strong>
          <Barra pct={consumo} tom={tomBarra(consumo)} />
          <small>{consumo}% da verba</small>
        </div>
        <div className={`rl-kpi ${saldoGeral < 0 ? 'rose' : 'emerald'}`}><span>Saldo</span><strong>{brl(saldoGeral)}</strong><small>{saldoGeral < 0 ? 'verba estourada' : 'disponível'}</small></div>
        <div className="rl-kpi emerald">
          <span>Avanço da execução</span><strong>{progresso}%</strong>
          <Barra pct={progresso} />
          <small>{concluidos} de {obraCards.length} atividades concluídas</small>
        </div>
      </div>

      <div className="rl-abas" role="tablist">
        {ABAS.map((a) => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} className={`rl-aba ${aba === a.id ? 'ativo' : ''}`} onClick={() => setAba(a.id)}>
            {a.rotulo}
          </button>
        ))}
      </div>

      {aba === 'financeiro' && (
        <>
          <div className="rl-card">
            <h3>Balanço das verbas</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="rl-tabela">
                <thead><tr><th>Categoria</th><th className="num">Verba</th><th className="num">Gasto</th><th className="num">Saldo</th><th>Consumo</th></tr></thead>
                <tbody>
                  {verbas.map((v) => {
                    const p = pctDe(v.gasto, v.verba);
                    return (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 700 }}>{v.nome}</td>
                        <td className="num">{brl(v.verba)}</td>
                        <td className="num">{brl(v.gasto)}</td>
                        <td className={`num ${v.verba - v.gasto < 0 ? 'rl-neg' : ''}`}>{brl(v.verba - v.gasto)}</td>
                        <td style={{ minWidth: 130 }}>
                          {v.verba > 0 ? <><Barra pct={p} tom={tomBarra(p)} /><span className="rl-dica">{p}%</span></> : <span className="rl-dica">sem verba definida</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr><td>Total</td><td className="num">{brl(verbaGeral)}</td><td className="num">{brl(gastoGeral)}</td><td className={`num ${saldoGeral < 0 ? 'rl-neg' : ''}`}>{brl(saldoGeral)}</td><td>{consumo}%</td></tr>
                </tfoot>
              </table>
            </div>
            <span className="rl-dica">
              Mão de obra é calculada pelas horas apontadas nos post-its × diária de cada operador; materiais e infraestrutura vêm dos pedidos de compra; indiretos, das viagens agendadas.
            </span>
          </div>

          <div className="rl-card">
            <h3>Pedidos de compra ({obraPOs.length})</h3>
            {obraPOs.length === 0 ? (
              <span className="rl-dica">Nenhum pedido lançado nesta obra.</span>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="rl-tabela">
                  <thead><tr><th>Pedido</th><th>Fornecedor</th><th>Verba</th><th>Recebimento</th><th className="num">Valor</th></tr></thead>
                  <tbody>
                    {obraPOs.map((p) => {
                      const it = p.items || [];
                      const ok = it.filter((i) => i.status === 'Já Chegou').length;
                      return (
                        <tr key={p.id}>
                          <td>{p.orderNumber || '—'}</td>
                          <td style={{ fontWeight: 600 }}>{p.fornecedor}</td>
                          <td><span className={`rl-selo ${p.destination === 'infraestrutura' ? 'par' : ''}`}>{p.destination === 'infraestrutura' ? 'Infraestrutura' : 'Quadros'}</span></td>
                          <td>{it.length ? `${ok}/${it.length} itens` : '—'}</td>
                          <td className="num">{brl(p.totalValue)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {aba === 'equipe' && (
        <div className="rl-card">
          <h3>Apontamento por operador</h3>
          {equipe.length === 0 ? (
            <span className="rl-dica">Nenhuma hora apontada nos post-its desta obra ainda.</span>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="rl-tabela">
                <thead><tr><th>Operador</th><th className="num">Horas</th><th className="num">Dias (8h)</th><th className="num">Diária</th><th className="num">Custo</th><th>Participação</th></tr></thead>
                <tbody>
                  {equipe.map((e) => (
                    <tr key={e.user.id}>
                      <td style={{ fontWeight: 700 }}>{e.user.name}</td>
                      <td className="num">{e.horas}h</td>
                      <td className="num">{e.dias}</td>
                      <td className="num">{brl(e.diaria)}</td>
                      <td className="num">{brl(e.custo)}</td>
                      <td style={{ minWidth: 120 }}><Barra pct={e.share} tom="blue" /><span className="rl-dica">{e.share}%</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td>Total</td><td className="num">{totalHours}h</td><td className="num">{Math.round((totalHours / 8) * 10) / 10}</td><td /><td className="num">{brl(totalLaborCost)}</td><td /></tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {aba === 'quadros' && <Grupos lista={cardsQuadro} vazio="Nenhuma atividade de quadros nesta obra." />}
      {aba === 'infra' && <Grupos lista={cardsInfra} vazio="Nenhuma atividade de infraestrutura nesta obra." />}

      {aba === 'atividades' && (
        <div className="rl-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h3 style={{ flex: 1 }}>Todas as atividades por horas apontadas</h3>
            <select className="form-control" style={{ width: 'auto' }} value={filtroColuna} onChange={(e) => setFiltroColuna(e.target.value)} aria-label="Situação">
              <option value="todas">Todas as situações</option>
              {Object.entries(ROTULO_COLUNA).map(([id, r]) => <option key={id} value={id}>{r}</option>)}
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="rl-tabela">
              <thead><tr><th>Atividade</th><th>Tipo</th><th>Situação</th><th className="num">Evolução</th><th className="num">Horas</th><th>Responsável</th></tr></thead>
              <tbody>
                {atividades.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td>{ehCardInfra(c) ? 'Infraestrutura' : 'Quadro'}</td>
                    <td><span className={`rl-selo ${SELO_COLUNA[c.column] ?? ''}`}>{ROTULO_COLUNA[c.column] || c.column}</span></td>
                    <td className="num">{evol(c)}%</td>
                    <td className="num">{horasDoCard(c)}h</td>
                    <td>{c.assignedUserName || '—'}</td>
                  </tr>
                ))}
                {atividades.length === 0 && <tr><td colSpan={6} className="rl-dica">Nenhuma atividade encontrada.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
