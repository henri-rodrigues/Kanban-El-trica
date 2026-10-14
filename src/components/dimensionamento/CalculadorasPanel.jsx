import React, { useMemo, useState } from 'react';
import { Printer, Save, Trash2, ListPlus } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CALCULADORAS, calcular } from '../../services/quadros/calc';
import { Pares } from './QuadroResultado';
import { fmt, h, dataHora, imprimirHtml, pares } from './helpers';

const entradasDe = (c, valores) =>
  c.campos
    .filter((f) => (!f.se || f.se(valores)) && (!f.relatorio || f.relatorio(valores)))
    .map((f) => {
      const v = valores[f.id];
      const texto =
        f.tipo === 'sel'
          ? f.opcoes.find(([o]) => String(o) === String(v))?.[1] ?? v
          : `${fmt(v, 3)}${f.unidade ? ' ' + f.unidade : ''}`;
      return { k: f.rotulo, v: String(texto) };
    });

// A memória de cálculo é montada em calc.js só com textos fixos e números (nunca texto digitado).
const Memoria = ({ passos }) => (
  <>
    <h3 style={{ margin: '1.1rem 0 0.2rem' }}>Como o resultado foi calculado</h3>
    <ol className="dq-passos">
      {passos.map((p, i) => (
        <li className="dq-passo" key={i}>
          <div className="dq-passo-cab">
            <span className="dq-passo-n">{i + 1}</span>
            <h4>{p.titulo}</h4>
            {p.ok !== undefined && <span className={`chip ${p.ok ? 'ok' : 'nok'}`}>{p.ok ? 'atende' : 'não atende'}</span>}
          </div>
          <p className="dq-passo-texto" dangerouslySetInnerHTML={{ __html: p.texto }} />
          {p.formula && (
            <div className="dq-formula">
              <span className="dq-formula-label">Fórmula</span>
              <div dangerouslySetInnerHTML={{ __html: p.formula }} />
            </div>
          )}
          {p.subst && (
            <div className="dq-formula subst">
              <span className="dq-formula-label">Com os seus valores</span>
              <div dangerouslySetInnerHTML={{ __html: p.subst }} />
            </div>
          )}
          {p.tabela && <div className="dq-table-wrap" dangerouslySetInnerHTML={{ __html: p.tabela }} />}
          {p.resultado && (
            <p className="dq-passo-resultado">Resultado: <strong dangerouslySetInnerHTML={{ __html: p.resultado }} /></p>
          )}
          {p.ref && <p className="dq-sub">{p.ref}</p>}
        </li>
      ))}
    </ol>
  </>
);

const CSS_CALC_PRINT = `
  *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1f2733;margin:24px;font-size:12px}
  h1{font-size:19px;margin:0}h2{font-size:14px;color:#2f4fa8;border-bottom:1px solid #d9dfeb;padding-bottom:3px;margin:16px 0 6px}
  table{width:100%;border-collapse:collapse}th,td{border:1px solid #d9dfeb;padding:4px 6px;text-align:left}th{background:#eef1f6}
  .num{text-align:right}.sub{color:#667085}.alerta{background:#fff6e0;padding:6px 10px;border-radius:6px}
  .passo{border:1px solid #d9dfeb;border-left:4px solid #4f7cf0;padding:8px 10px;margin:8px 0;border-radius:6px;break-inside:avoid}
  .formula{font-family:Cambria,Georgia,serif;font-size:14px;line-height:2;margin:4px 0}.formula-rotulo{font:700 9px sans-serif;text-transform:uppercase;color:#667085;display:block}
  .frac{display:inline-flex;flex-direction:column;text-align:center;vertical-align:middle;margin:0 4px}.frac span:first-child{border-bottom:1.5px solid currentColor;padding:0 6px 1px}
  .chip{padding:1px 8px;border-radius:10px;font-weight:700;font-size:10px}.chip.ok{background:#dcf5ec;color:#157a5c}.chip.nok{background:#fde4e4;color:#b42323}
  .barra-uso{display:inline-block;width:80px;height:7px;background:#d9dfeb;border-radius:4px;overflow:hidden}.barra-uso i{display:block;height:100%}
  .barra-uso i.ok{background:#22ab84}.barra-uso i.nok{background:#ec6a6a}tr.adotada td{background:#e8effe;font-weight:600}.txt-nok{color:#b42323;font-weight:700}
  .rodape{margin-top:16px;font-size:10px;color:#667085;border-top:1px solid #d9dfeb;padding-top:6px}
`;

function htmlCalculo({ titulo, norma, entradas, resultados, alertas, passos, memoria, responsavel, quando, origem }) {
  const linhas = (lista) => lista.map(({ k, v }) => `<tr><th style="width:55%">${h(k)}</th><td>${h(v)}</td></tr>`).join('');
  const mem = memoria?.length
    ? `<h2>Como o resultado foi calculado</h2>${memoria
        .map(
          (p, i) => `<div class="passo"><strong>${i + 1}. ${h(p.titulo)}</strong>
        ${p.ok === undefined ? '' : ` <span class="chip ${p.ok ? 'ok' : 'nok'}">${p.ok ? 'atende' : 'não atende'}</span>`}
        <p>${p.texto ?? ''}</p>
        ${p.formula ? `<div class="formula"><span class="formula-rotulo">Fórmula</span>${p.formula}</div>` : ''}
        ${p.subst ? `<div class="formula"><span class="formula-rotulo">Com os seus valores</span>${p.subst}</div>` : ''}
        ${p.tabela ?? ''}${p.resultado ? `<p>Resultado: <strong>${p.resultado}</strong></p>` : ''}</div>`
        )
        .join('')}`
    : '';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${h(titulo)}</title><style>${CSS_CALC_PRINT}</style></head><body>
    <h1>${h(titulo)}</h1><p class="sub">Memória de cálculo — Dimensionamento de Quadros Elétricos · ${h(origem)} · ${h(responsavel ?? '—')} · ${h(quando)}</p>
    <h2>Dados de entrada</h2><table><tbody>${linhas(entradas)}</tbody></table>
    <h2>Resultados</h2><table><tbody>${linhas(resultados)}</tbody></table>
    ${alertas?.length ? `<h2>Observações</h2>${alertas.map((a) => `<p class="alerta">${h(a)}</p>`).join('')}` : ''}
    ${passos?.length ? `<h2>Fórmulas utilizadas</h2><p>${passos.map(h).join('<br>')}</p>` : ''}
    ${mem}
    <h2>Referência normativa</h2><p>${h(norma ?? '—')}</p>
    <p class="rodape">Resultado de pré-dimensionamento. Deve ser conferido e validado pelo responsável técnico, com as normas vigentes e os catálogos atualizados dos fabricantes.</p>
    <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},300)})<\/script></body></html>`;
}

export const CalculadorasPanel = ({ obra, dimensionamentos, ids = null, tituloHistorico = 'Histórico de cálculos da obra', onCriarTarefa = null }) => {
  const { calculosQuadros, addCalculoQuadro, deleteCalculoQuadro } = useData();
  const { currentUser } = useAuth();

  const lista = ids ? CALCULADORAS.filter((x) => ids.includes(x.id)) : CALCULADORAS;
  const [calcId, setCalcId] = useState(lista[0].id);
  const [valores, setValores] = useState({});
  const [descricao, setDescricao] = useState('');
  const [vinculo, setVinculo] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [aviso, setAviso] = useState('');

  const calc = lista.find((x) => x.id === calcId) || lista[0];
  const atuais = valores[calcId] ?? Object.fromEntries(calc.campos.map((f) => [f.id, f.padrao]));

  const r = useMemo(() => {
    try {
      return calcular(calc.id, atuais);
    } catch {
      return { linhas: [], alertas: ['Verifique os valores informados.'], passos: [], valores: atuais };
    }
  }, [calc, atuais]);

  const historico = calculosQuadros
    .filter((c) => c.obraId === obra.id)
    .filter((c) => !ids || ids.includes(c.tipo))
    .filter((c) => filtro === 'todos' || (filtro === 'avulsos' ? !c.dimensionamentoId : c.dimensionamentoId === filtro))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  const nomeQuadro = (id) => dimensionamentos.find((d) => d.id === id)?.nome;

  const mudar = (id, valor) => setValores((prev) => ({ ...prev, [calcId]: { ...atuais, [id]: valor } }));

  const titulo = () => (descricao.trim() ? `${calc.nome} — ${descricao.trim()}` : calc.nome);

  const salvar = () => {
    if (!r.linhas.length) return setAviso('Não há resultado para salvar.');
    addCalculoQuadro(obra.id, {
      tipo: calc.id,
      titulo: titulo(),
      norma: calc.norma,
      entradas: entradasDe(calc, r.valores),
      valores: r.valores,
      resultados: r.linhas.map(([k, v]) => ({ k, v: String(v) })),
      dimensionamentoId: vinculo || null
    });
    setDescricao('');
    setAviso('Cálculo salvo no histórico da obra.');
    setTimeout(() => setAviso(''), 3500);
  };

  // Gera uma tarefa (ex.: no Kanban de infraestrutura) com o resultado do cálculo na descrição.
  const criarTarefa = () => {
    if (!r.linhas.length) return setAviso('Não há resultado para criar a tarefa.');
    const resumo = r.linhas.map(([k, v]) => `${k}: ${v}`).join('\n');
    onCriarTarefa({
      calcId: calc.id,
      titulo: titulo(),
      descricao: `Resultado do cálculo (${calc.nome}):\n${resumo}\n\nReferência: ${calc.norma}`
    });
  };

  const imprimirAtual = () => {
    if (!r.linhas.length) return setAviso('Não há resultado para exportar.');
    imprimirHtml(
      htmlCalculo({
        titulo: titulo(), norma: calc.norma, entradas: entradasDe(calc, r.valores),
        resultados: r.linhas.map(([k, v]) => ({ k, v: String(v) })),
        alertas: r.alertas, passos: r.passos, memoria: r.memoria, responsavel: currentUser?.name,
        quando: dataHora(new Date().toISOString()), origem: vinculo ? `Quadro ${nomeQuadro(vinculo)}` : 'Cálculo avulso'
      })
    );
  };

  const imprimirHistorico = (item) => {
    const c = CALCULADORAS.find((x) => x.id === item.tipo);
    let det = { alertas: [], passos: [], memoria: [] };
    let entradas = pares(item.entradas);
    if (c && item.valores) {
      try {
        det = calcular(c.id, item.valores);
        entradas = entradasDe(c, det.valores);
      } catch { /* mantém o que foi salvo */ }
    }
    imprimirHtml(
      htmlCalculo({
        titulo: item.titulo, norma: item.norma, entradas, resultados: pares(item.resultados),
        alertas: det.alertas, passos: det.passos, memoria: det.memoria, responsavel: item.createdBy,
        quando: dataHora(item.createdAt),
        origem: item.dimensionamentoId ? `Quadro ${nomeQuadro(item.dimensionamentoId) ?? ''}` : 'Cálculo avulso'
      })
    );
  };

  return (
    <div className="dq-scope">
      <div className="dq-calc-layout">
        <nav className="dq-calc-menu" aria-label="Calculadoras">
          {lista.map((x) => (
            <button key={x.id} type="button" className={x.id === calcId ? 'active' : ''} onClick={() => setCalcId(x.id)}>
              {x.nome}
            </button>
          ))}
        </nav>

        <div className="dq-scope">
          <div className="dq-card">
            <h2>{calc.nome}</h2>
            <p className="dq-muted" style={{ marginBottom: '0.9rem' }}>{calc.descricao}</p>
            <div className="dq-grid">
              {calc.campos.filter((f) => !f.se || f.se(atuais)).map((f) => (
                <label key={f.id} className={`dq-field${f.largo ? ' wide' : ''}${f.quebra ? ' dq-quebra' : ''}`}>
                  <span>{f.rotulo}{f.unidade ? <em> ({f.unidade})</em> : null}</span>
                  {f.tipo === 'sel' ? (
                    <select
                      className="form-control"
                      value={atuais[f.id]}
                      onChange={(e) => mudar(f.id, typeof f.padrao === 'number' ? Number(e.target.value) : e.target.value)}
                    >
                      {f.opcoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                    </select>
                  ) : (
                    <input
                      className="form-control" type="number" min="0" step={f.passo ?? 'any'} inputMode="decimal"
                      value={atuais[f.id]}
                      onChange={(e) => mudar(f.id, e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  )}
                </label>
              ))}
            </div>

            <div style={{ marginTop: '1.1rem' }}>
              {r.linhas.length > 0 && (
                <table className="dq-pairs">
                  <tbody>
                    {r.linhas.map(([k, v, d], i) => (
                      <tr key={i} className={d ? 'destaque' : ''}><th>{k}</th><td>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              {r.alertas?.map((a, i) => <p className="dq-alert" key={i}>{a}</p>)}
              {r.passos?.length > 0 && (
                <p className="dq-sub" style={{ marginTop: '0.6rem', fontFamily: 'Consolas, monospace' }}>
                  {r.passos.map((p, i) => <React.Fragment key={i}>{p}<br /></React.Fragment>)}
                </p>
              )}
              {r.memoria?.length > 0 && <Memoria passos={r.memoria} />}
              <p className="dq-sub" style={{ marginTop: '0.6rem' }}>Referência: {calc.norma}</p>
            </div>

            <div className="dq-grid" style={{ marginTop: '1rem', alignItems: 'end' }}>
              <label className="dq-field wide">
                <span>Descrição (opcional)</span>
                <input className="form-control" placeholder="Ex.: alimentador da bomba BAG-02" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </label>
              <label className="dq-field">
                <span>Vincular a</span>
                <select className="form-control" value={vinculo} onChange={(e) => setVinculo(e.target.value)}>
                  <option value="">Cálculo avulso</option>
                  {dimensionamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </label>
              <div className="dq-bar">
                {onCriarTarefa && (
                  <button type="button" className="btn btn-secondary" onClick={criarTarefa} title="Cria uma tarefa no Kanban com este resultado">
                    <ListPlus size={14} /> Criar tarefa
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={imprimirAtual}><Printer size={14} /> PDF</button>
                <button type="button" className="btn btn-primary" onClick={salvar}><Save size={14} /> Salvar no histórico</button>
              </div>
            </div>
            {aviso && <p className="dq-alert" role="status">{aviso}</p>}
          </div>

          <div className="dq-card">
            <div className="dq-bar" style={{ marginBottom: '0.6rem' }}>
              <h3 style={{ margin: 0 }}>{tituloHistorico}</h3>
              <span className="dq-spacer" />
              <select className="form-control" style={{ width: 'auto' }} aria-label="Filtrar histórico" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="avulsos">Somente avulsos</option>
                {dimensionamentos.map((d) => <option key={d.id} value={d.id}>Quadro {d.nome}</option>)}
              </select>
            </div>
            {historico.length === 0 && <p className="dq-muted">Nenhum cálculo salvo neste filtro.</p>}
            {historico.map((item) => (
              <details className="dq-hist-item" key={item.id}>
                <summary style={{ cursor: 'pointer', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.85rem' }}>{item.titulo}</strong>
                  <span className={`dq-pill ${item.dimensionamentoId ? 'purple' : ''}`}>
                    {item.dimensionamentoId ? nomeQuadro(item.dimensionamentoId) ?? 'Quadro' : 'Avulso'}
                  </span>
                  <span className="dq-sub">{dataHora(item.createdAt)}{item.createdBy ? ` · ${item.createdBy}` : ''}</span>
                </summary>
                <div className="dq-memo-cols" style={{ marginTop: '0.6rem' }}>
                  <div><h5>Entradas</h5><Pares dados={item.entradas} /></div>
                  <div><h5>Resultados</h5><Pares dados={item.resultados} /></div>
                </div>
                <div className="dq-bar" style={{ marginTop: '0.6rem' }}>
                  <span className="dq-sub">Referência: {item.norma ?? '—'}</span>
                  <span className="dq-spacer" />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => imprimirHistorico(item)}><Printer size={13} /> PDF</button>
                  <button
                    type="button" className="btn btn-danger btn-sm"
                    onClick={() => window.confirm('Apagar este cálculo do histórico?') && deleteCalculoQuadro(item.id)}
                  >
                    <Trash2 size={13} /> Apagar
                  </button>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
