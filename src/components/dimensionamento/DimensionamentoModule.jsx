import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { TIPOS_QUADRO } from '../../services/quadros/dimensionamento';
import { QuadroEditor } from './QuadroEditor';
import { CalculadorasPanel } from './CalculadorasPanel';
import { NormasBase } from './NormasBase';
import { fmt, dataHora } from './helpers';
import './dimensionamento.css';

const ABAS = [
  ['quadros', 'Quadros dimensionados'],
  ['calculos', 'Calculadoras'],
  ['base', 'Normas e base']
];

export const DimensionamentoModule = () => {
  const { activeObra, dimensionamentos, activeQuadros } = useData();
  const [aba, setAba] = useState('quadros');
  const [editando, setEditando] = useState(null); // null = lista | { doc } (doc nulo = novo)

  if (!activeObra) {
    return (
      <div className="dq-scope">
        <div className="dq-empty">
          <Zap size={36} style={{ opacity: 0.5 }} />
          <h3 style={{ margin: '0.5rem 0 0.25rem' }}>Nenhuma obra selecionada</h3>
          <p>Selecione uma obra na Vitrine para dimensionar os quadros elétricos dela.</p>
        </div>
      </div>
    );
  }

  const doDaObra = dimensionamentos
    .filter((d) => d.obraId === activeObra.id)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));

  if (editando) {
    return (
      <div className="dq-scope">
        {/* key força remontar o editor ao trocar de quadro */}
        <QuadroEditor
          key={editando.doc?.id ?? 'novo'}
          initial={editando.doc}
          obra={activeObra}
          obraQuadros={activeQuadros}
          onBack={() => setEditando(null)}
        />
      </div>
    );
  }

  const nomeQuadroObra = (id) => activeQuadros.find((x) => x.id === id)?.name;

  return (
    <div className="dq-scope">
      <div className="dq-bar">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Zap size={20} style={{ color: 'var(--accent-blue)' }} /> Dimensionamento de Quadros Elétricos
          </h2>
          <p className="dq-sub">{activeObra.name} · potência, comando e automação (NBR 5410)</p>
        </div>
        <span className="dq-spacer" />
        {aba === 'quadros' && (
          <button type="button" className="btn btn-primary" onClick={() => setEditando({ doc: null })}>
            <Plus size={15} /> Novo quadro
          </button>
        )}
      </div>

      <div className="dq-tabs" role="tablist">
        {ABAS.map(([id, rotulo]) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'active' : ''} onClick={() => setAba(id)}>
            {rotulo}
          </button>
        ))}
      </div>

      {aba === 'quadros' && (
        doDaObra.length ? (
          <div className="dq-grid-cards">
            {doDaObra.map((d) => (
              <button key={d.id} type="button" className="dq-card dq-quadro-card" onClick={() => setEditando({ doc: d })}>
                <span className={`dq-pill ${d.geradoEm ? 'ok' : 'warn'}`}>{d.geradoEm ? `${d.tensao} V` : 'Rascunho'}</span>
                <strong style={{ fontSize: '1rem', paddingRight: '4.5rem' }}>{d.nome || 'Sem nome'}</strong>
                <span className="dq-muted">{TIPOS_QUADRO[d.tipo]?.rotulo ?? d.tipo}</span>
                <span className="dq-sub">
                  {d.resumo
                    ? `${d.resumo.correnteTotal ? `${fmt(d.resumo.correnteTotal, 1)} A · ` : ''}${d.resumo.caixa} · ${d.resumo.itens} itens`
                    : 'Lista de materiais ainda não gerada'}
                </span>
                {d.quadroObraId && nomeQuadroObra(d.quadroObraId) && (
                  <span className="dq-pill purple" style={{ alignSelf: 'flex-start' }}>↔ {nomeQuadroObra(d.quadroObraId)}</span>
                )}
                <span className="dq-sub">Atualizado em {dataHora(d.updatedAt)}{d.updatedBy ? ` · ${d.updatedBy}` : ''}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="dq-empty">
            <Zap size={34} style={{ opacity: 0.5 }} />
            <h3 style={{ margin: '0.5rem 0 0.25rem' }}>Nenhum quadro dimensionado nesta obra</h3>
            <p>Crie um quadro, adicione os equipamentos e gere a lista de materiais com cabos, proteções e layout.</p>
            <button type="button" className="btn btn-primary" style={{ marginTop: '0.9rem' }} onClick={() => setEditando({ doc: null })}>
              <Plus size={15} /> Criar primeiro quadro
            </button>
          </div>
        )
      )}

      {aba === 'calculos' && <CalculadorasPanel obra={activeObra} dimensionamentos={doDaObra} />}
      {aba === 'base' && <NormasBase />}
    </div>
  );
};
