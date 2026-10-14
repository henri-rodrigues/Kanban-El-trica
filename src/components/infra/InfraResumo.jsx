import React, { useMemo } from 'react';
import {
  TrendingUp, ListChecks, Wallet, AlertTriangle, PauseCircle, Flame, Package, Calculator, PartyPopper, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { CATEGORIAS_INFRA, rotuloCategoria, IDS_CALC_INFRA } from '../../constants/infraestrutura';
import { dataHora } from '../dimensionamento/helpers';
import './infra.css';

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Visão geral da infraestrutura: andamento, verba, pendências e materiais. */
export const InfraResumo = ({ obra, cardsInfra, onAbrirKanban, onAbrirCalculadoras, onNavigate }) => {
  const { isAdmin } = useAuth();
  const { purchaseOrders, calculosQuadros, getCardEvolutionPct } = useData();

  const r = useMemo(() => {
    const total = cardsInfra.length;
    const porColuna = { todo: 0, in_progress: 0, on_hold: 0, completed: 0 };
    cardsInfra.forEach((c) => { porColuna[c.column] = (porColuna[c.column] || 0) + 1; });
    const progresso = total
      ? Math.round(cardsInfra.reduce((s, c) => s + getCardEvolutionPct(c.column), 0) / total)
      : 0;

    const abertos = cardsInfra.filter((c) => c.column !== 'completed');
    const altaPrioridade = abertos.filter((c) => c.priority === 'Alta' || c.priority === 'Crítica').length;

    const categorias = CATEGORIAS_INFRA.map((cat) => {
      const doGrupo = cardsInfra.filter((c) => (c.categoryTag || 'Infraestrutura Geral') === cat.id);
      return { ...cat, total: doGrupo.length, feitos: doGrupo.filter((c) => c.column === 'completed').length };
    }).filter((c) => c.total > 0);

    // Materiais de infraestrutura que ainda não chegaram
    const pedidos = purchaseOrders.filter((p) => p.obraId === obra.id && p.destination === 'infraestrutura');
    const pendentes = [];
    pedidos.forEach((p) => {
      (p.items || []).forEach((i) => {
        if (i.status !== 'Já Chegou') pendentes.push({ fornecedor: p.fornecedor, descricao: i.description || i.name || 'Item', qtd: i.quantityOrdered });
      });
    });

    const orcado = Number(obra.infraBudget) || 0;
    const gasto = Number(obra.infraSpentCost) || 0;

    const calculos = calculosQuadros
      .filter((c) => c.obraId === obra.id && IDS_CALC_INFRA.includes(c.tipo))
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, 4);

    return { total, porColuna, progresso, altaPrioridade, categorias, pendentes, orcado, gasto, calculos, pedidos: pedidos.length };
  }, [cardsInfra, obra, purchaseOrders, calculosQuadros, getCardEvolutionPct]);

  const pctVerba = r.orcado ? Math.round((r.gasto / r.orcado) * 100) : 0;
  const estouro = r.orcado > 0 && r.gasto > r.orcado;

  const alertas = [];
  if (r.porColuna.on_hold > 0) alertas.push({ id: 'espera', Icone: PauseCircle, rotulo: 'Tarefas em espera', valor: r.porColuna.on_hold, tom: 'amber' });
  if (r.altaPrioridade > 0) alertas.push({ id: 'alta', Icone: Flame, rotulo: 'Prioridade alta em aberto', valor: r.altaPrioridade, tom: 'rose' });
  if (isAdmin && r.pendentes.length > 0) alertas.push({ id: 'mat', Icone: Package, rotulo: 'Materiais de infra não chegaram', valor: r.pendentes.length, tom: 'amber', aba: 'materials' });

  return (
    <div className="if-wrap">
      <div className="if-kpis">
        <div className="if-kpi">
          <div className="if-kpi-topo"><TrendingUp size={15} /> Andamento</div>
          <strong>{r.progresso}%</strong>
          <div className="if-prog-barra if-grossa"><i style={{ width: `${r.progresso}%` }} /></div>
          <small>média da evolução das tarefas</small>
        </div>

        <div className="if-kpi">
          <div className="if-kpi-topo"><ListChecks size={15} /> Tarefas</div>
          <strong>{r.porColuna.completed}<span>/{r.total} concluídas</span></strong>
          <div className="if-mini">
            <span><b>{r.porColuna.todo}</b> a fazer</span>
            <span><b>{r.porColuna.in_progress}</b> andamento</span>
            <span><b>{r.porColuna.on_hold}</b> espera</span>
          </div>
        </div>

        {isAdmin && (
          <div className={`if-kpi ${estouro ? 'if-risco' : ''}`}>
            <div className="if-kpi-topo"><Wallet size={15} /> Verba de infraestrutura</div>
            <strong>{brl(r.gasto)} <span>de {brl(r.orcado)}</span></strong>
            <div className="if-prog-barra if-grossa"><i className={estouro ? 'if-estouro' : ''} style={{ width: `${Math.min(100, pctVerba)}%` }} /></div>
            <small>{r.orcado ? `${pctVerba}% consumido${estouro ? ' · acima da verba' : ''}` : 'Verba não definida na obra'}</small>
          </div>
        )}
      </div>

      <div className="if-duas">
        <div className="if-bloco">
          <div className="if-bloco-titulo"><AlertTriangle size={14} /> Atenção</div>
          {alertas.length === 0 ? (
            <p className="if-dica"><PartyPopper size={14} /> Nenhuma pendência no momento.</p>
          ) : (
            <div className="if-alertas">
              {alertas.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`if-alerta if-${a.tom}`}
                  onClick={() => (a.aba ? onNavigate?.(a.aba) : onAbrirKanban('todas'))}
                >
                  <a.Icone size={14} /> <span>{a.rotulo}</span> <b>{a.valor}</b>
                </button>
              ))}
            </div>
          )}

          {isAdmin && r.pendentes.length > 0 && (
            <ul className="if-lista-mat">
              {r.pendentes.slice(0, 5).map((m, i) => (
                <li key={i}><Package size={12} /> {m.descricao}{m.qtd ? ` (${m.qtd})` : ''}<small>{m.fornecedor}</small></li>
              ))}
              {r.pendentes.length > 5 && <li className="if-dica">+ {r.pendentes.length - 5} itens</li>}
            </ul>
          )}
        </div>

        <div className="if-bloco">
          <div className="if-bloco-titulo"><Layers size={14} /> Por categoria</div>
          {r.categorias.length === 0 ? (
            <p className="if-dica">Nenhuma tarefa ainda. Crie no Kanban ou a partir de um cálculo.</p>
          ) : (
            r.categorias.map((c) => {
              const pct = Math.round((c.feitos / c.total) * 100);
              return (
                <button key={c.id} type="button" className="if-categoria" onClick={() => onAbrirKanban(c.id)}>
                  <span>{rotuloCategoria(c.id)}</span>
                  <div className="if-prog-barra"><i style={{ width: `${pct}%` }} /></div>
                  <small>{c.feitos}/{c.total}</small>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="if-bloco">
        <div className="if-bloco-titulo"><Calculator size={14} /> Últimos cálculos de infraestrutura</div>
        {r.calculos.length === 0 ? (
          <p className="if-dica">
            Nenhum cálculo salvo.{' '}
            <button type="button" className="if-link" onClick={onAbrirCalculadoras}>Abrir as calculadoras</button>
          </p>
        ) : (
          <ul className="if-lista-calc">
            {r.calculos.map((c) => (
              <li key={c.id}>
                <strong>{c.titulo}</strong>
                <small>{dataHora(c.createdAt)}{c.createdBy ? ` · ${c.createdBy}` : ''}</small>
                <span>{(c.resultados || [])[0] ? `${c.resultados[0].k}: ${c.resultados[0].v}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
