import React from 'react';
import { Download, Printer, Layers } from 'lucide-react';
import { PARTIDAS } from '../../services/quadros/dimensionamento';
import { REFERENCIAS } from '../../services/quadros/normas';
import { desenharLayout, LEGENDA_LAYOUT } from '../../services/quadros/layout';
import { fmt, dataHora, pares } from './helpers';

const Pares = ({ dados }) => (
  <table className="dq-pairs">
    <tbody>
      {pares(dados).map(({ k, v }, i) => (
        <tr key={`${k}-${i}`}>
          <th>{k}</th>
          <td>{v}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// `mostrar`: lista com as seções a exibir (resumo, cargas, bom, protecoes, layout, memorial). Vazio = todas.
export const QuadroResultado = ({ quadro, resultado: r, onLinhas, onCsv, onPrint, mostrar = null }) => {
  const ver = (id) => !mostrar || mostrar.includes(id);
  const s = r.resumo;
  const kpis = [
    ['Tensão', `${s.tensao} V`],
    ['Corrente total', s.correnteTotal ? `${fmt(s.correnteTotal, 1)} A` : '—'],
    ['Potência instalada', s.potenciaTotal ? `${fmt(s.potenciaTotal, 1)} kW` : '—'],
    ['Caixa', s.caixa],
    ['Dimensões (A × L × P)', s.dimensoes],
    ['Itens na lista', s.itens]
  ];
  const layoutSvg = desenharLayout(r.layout); // SVG gerado pelo motor, com textos escapados

  let grupoAtual = '';

  return (
    <div className="dq-scope">
      {ver('resumo') && (
        <>
      <div className="dq-card">
        <div className="dq-bar">
          <h3 style={{ margin: 0 }}>Resumo geral — {s.nome}</h3>
          <span className="dq-spacer" />
          <button type="button" className="btn btn-secondary btn-sm" onClick={onLinhas}><Layers size={13} /> Linhas de produto</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCsv}><Download size={13} /> Exportar CSV</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onPrint}><Printer size={13} /> Imprimir / PDF</button>
        </div>
        <p className="dq-sub" style={{ marginTop: '0.25rem' }}>
          {s.tipo}{quadro.geradoEm ? ` · gerado em ${dataHora(quadro.geradoEm)}` : ''}
        </p>
        <div className="dq-kpis">
          {kpis.map(([t, v]) => (
            <div className="dq-kpi" key={t}><span>{t}</span><strong>{v}</strong></div>
          ))}
        </div>
        {r.avisos.length > 0 && (
          <ul className="dq-warns">
            {r.avisos.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
      </div>

        </>
      )}

      {ver('cargas') && (
        <>
      {r.cargas.length > 0 && (
        <div className="dq-card">
          <h3>Tabela de cargas</h3>
          <div className="dq-table-wrap">
            <table className="dq-table">
              <thead>
                <tr>
                  <th>TAG</th><th>Tipo</th><th className="num">kW</th><th className="num">In (A)</th>
                  <th>Partida</th><th>Proteção</th><th>Acionamento</th><th className="num">Cabo (mm²)</th><th className="num">Queda (%)</th>
                </tr>
              </thead>
              <tbody>
                {r.cargas.map((c, i) => (
                  <tr key={i}>
                    <td><strong>{c.nome}</strong>{c.qtd > 1 && <span className="dq-sub"> × {c.qtd}</span>}</td>
                    <td>{{ motor: 'Motor', resistiva: 'Resistência', carga: 'Carga' }[c.natureza]}</td>
                    <td className="num">{fmt(c.kW)}{c.natureza === 'motor' && <span className="dq-sub"> ({fmt(c.cv, 1)} cv)</span>}</td>
                    <td className="num">{fmt(c.corrente)}</td>
                    <td>{PARTIDAS[c.partida] ?? '—'}</td>
                    <td>{c.protecao}</td>
                    <td>{c.acionamento}</td>
                    <td className="num">{c.cabo ? fmt(c.cabo) : '—'}</td>
                    <td className="num">{c.cabo ? fmt(c.queda) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="dq-sub" style={{ marginTop: '0.5rem' }}>
            Cabos de campo pela {REFERENCIAS.ampacidade} e {REFERENCIAS.queda}; seção mínima de 2,5 mm² para circuitos de força.
          </p>
        </div>
      )}

        </>
      )}

      {ver('bom') && (
        <>
      <div className="dq-card">
        <h3>Lista de materiais</h3>
        <div className="dq-table-wrap">
          <table className="dq-table">
            <thead>
              <tr><th>TAG</th><th>Modelo</th><th>Descrição</th><th className="num">Qtd</th><th>Un</th><th>Fabricante</th><th>Justificativa técnica</th></tr>
            </thead>
            <tbody>
              {r.bom.map((i, n) => {
                const cabecalho = i.grupo !== grupoAtual ? (grupoAtual = i.grupo) : null;
                return (
                  <React.Fragment key={n}>
                    {cabecalho && <tr className="grupo"><th colSpan={7}>{cabecalho}</th></tr>}
                    <tr>
                      <td>{i.tag}</td>
                      <td><strong>{i.modelo}</strong></td>
                      <td>{i.descricao}</td>
                      <td className="num">{fmt(i.qtd)}</td>
                      <td>{i.un}</td>
                      <td>{i.fabricante}</td>
                      <td className="dq-sub">{i.just}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

        </>
      )}

      {ver('protecoes') && (
        <>
      <div className="dq-card">
        <h3>Proteções e automação</h3>
        <dl className="dq-defs">
          {r.protecoes.map(([t, v]) => (
            <div key={t}><dt>{t}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      </div>

        </>
      )}

      {ver('layout') && (
        <>
      <div className="dq-card">
        <h3>Layout do quadro montado</h3>
        <p className="dq-sub" style={{ marginBottom: '0.6rem' }}>
          Pré-dimensionamento em escala, com as dimensões de catálogo dos componentes. O detalhamento final é feito no projeto executivo.
        </p>
        <div className="dq-layout" dangerouslySetInnerHTML={{ __html: layoutSvg }} />
        <ul className="dq-legend">
          {LEGENDA_LAYOUT.map((l) => (
            <li key={l.texto}><i style={{ background: l.cor }} />{l.texto}</li>
          ))}
        </ul>
      </div>

        </>
      )}

      {ver('memorial') && (
        <>
      <div className="dq-card">
        <h3>Memorial de cálculo</h3>
        <p className="dq-sub" style={{ marginBottom: '0.6rem' }}>Cada passo abaixo documenta como o dimensionamento foi obtido.</p>
        {r.memorial.map((m, i) => (
          <details className="dq-memo-details" key={i}>
            <summary>{m.titulo}</summary>
            <div className="dq-memo-body">
              <div className="dq-memo-cols">
                <div><h5>Entradas</h5><Pares dados={m.entradas} /></div>
                <div><h5>Resultados</h5><Pares dados={m.resultados} /></div>
              </div>
              <p className="dq-sub" style={{ marginTop: '0.5rem' }}>Referência: {m.norma}</p>
            </div>
          </details>
        ))}
      </div>

        </>
      )}

      <p className="dq-sub">
        Resultado de pré-dimensionamento. A especificação final deve ser conferida e validada pelo responsável técnico, com as normas vigentes e os catálogos atualizados dos fabricantes.
      </p>
    </div>
  );
};

export { Pares };
