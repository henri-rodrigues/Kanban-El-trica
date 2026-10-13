import React, { useState } from 'react';
import { ArrowLeft, Plus, Save, Wand2, Trash2, Copy, Pencil } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  TIPOS_QUADRO, TIPOS_EQUIP, PARTIDAS, PADRAO_QUADRO, dimensionar, bomParaCSV
} from '../../services/quadros/dimensionamento';
import { CATEGORIAS, BOBINAS } from '../../services/quadros/catalogo';
import { METODOS, LIMITES_QUEDA } from '../../services/quadros/normas';
import { CV } from '../../services/quadros/motores';
import { EquipDialog } from './EquipDialog';
import { ModalShell } from './ModalShell';
import { QuadroResultado } from './QuadroResultado';
import { clone, fmt, pares, baixar, nomeArquivo, relatorioQuadroHtml, imprimirHtml } from './helpers';

const Field = ({ label, wide, children }) => (
  <label className={`dq-field${wide ? ' wide' : ''}`}>
    <span>{label}</span>
    {children}
  </label>
);

const descPotencia = (e) => {
  if (e.tipo === 'VRF') return `${String(e.condensadoras ?? '').trim() || '—'} kW`;
  if (e.tipo === 'FANCOLETE') return `${e.fancoleteQty || 1} × 200 W`;
  if (!e.potencia) return '—';
  return e.unidadePot === 'cv' ? `${fmt(e.potencia / CV, 2)} cv (${fmt(e.potencia)} kW)` : `${fmt(e.potencia)} kW`;
};

const descExtras = (e) => {
  const x = [];
  if (e.correntePlaca) x.push(`placa ${fmt(e.correntePlaca)} A`);
  if (e.tipo === 'UTA' && e.hasHeating) x.push(`aquecimento ${fmt(e.heatingPower)} kW (${e.heatingType === 'scr' ? 'SCR' : `${e.heatingStages || 1} estágio(s)`})`);
  if (e.tipo === 'UTA' && e.hasHumid) x.push(`umidificador ${fmt(e.humidPower)} kW`);
  if (e.tipo === 'VRF' && e.evaporadoras) x.push(`${e.evaporadoras} evaporadoras`);
  if (e.tipo === 'SPLITAO' && e.condensadoras) x.push(`cond.: ${e.condensadoras} kW`);
  if (e.tipo === 'SPLIT') x.push(e.splitPhase === 'tri' ? 'trifásico' : 'monofásico 220 V');
  if (e.tipo === 'CARGA' && e.fases === 'mono') x.push('monofásico 220 V');
  if (e.leituras?.length) x.push(`${e.leituras.length} leitura(s)`);
  return x.join(' · ');
};

export const QuadroEditor = ({ initial, obra, obraQuadros, onBack }) => {
  const { saveDimensionamento, deleteDimensionamento } = useData();
  const { currentUser, isAdmin } = useAuth();

  const [q, setQ] = useState(() => ({ ...clone(PADRAO_QUADRO), ...(initial ? clone(initial) : {}) }));
  const [resultado, setResultado] = useState(() => {
    if (!initial?.geradoEm) return null;
    try { return dimensionar({ ...PADRAO_QUADRO, ...initial }); } catch { return null; }
  });
  const [obsoleto, setObsoleto] = useState(false);
  const [equipDlg, setEquipDlg] = useState(null); // { index: number|null }
  const [linhasDlg, setLinhasDlg] = useState(null); // { previa, linhas }
  const [aviso, setAviso] = useState(null);

  const cfg = TIPOS_QUADRO[q.tipo] ?? TIPOS_QUADRO['potencia-comando'];
  const podeExcluir = q.id && (isAdmin || q.createdBy === currentUser?.name);

  const notificar = (texto, tipo = 'ok') => {
    setAviso({ texto, tipo });
    setTimeout(() => setAviso(null), 4500);
  };

  const alterar = (campo, valor) => {
    setQ((prev) => ({ ...prev, [campo]: valor }));
    if (resultado) setObsoleto(true);
  };
  const alterarNum = (campo) => (ev) => alterar(campo, ev.target.value === '' ? '' : Number(ev.target.value));

  const validar = () => {
    if (!q.nome?.trim()) return 'Informe o nome / TAG do quadro.';
    if (!cfg.porQuantidade && !q.equipamentos.length) return 'Adicione ao menos um equipamento.';
    return '';
  };

  const persistir = (res) => {
    const doc = { ...q };
    if (res) {
      doc.geradoEm = new Date().toISOString();
      doc.resumo = res.resumo;
      doc.memorial = res.memorial.map((m) => ({ ...m, entradas: pares(m.entradas), resultados: pares(m.resultados) }));
    }
    const salvo = saveDimensionamento(obra.id, doc);
    if (salvo) setQ((prev) => ({ ...prev, ...salvo }));
    return salvo;
  };

  const salvarRascunho = () => {
    if (!q.nome?.trim()) return notificar('Informe o nome / TAG do quadro.', 'erro');
    persistir(null);
    notificar('Rascunho salvo.');
  };

  const abrirLinhas = () => {
    const erro = validar();
    if (erro) return notificar(erro, 'erro');
    try {
      const previa = dimensionar(q);
      setLinhasDlg({ previa, linhas: { ...previa.linhas } });
    } catch (e) {
      notificar(`Não foi possível dimensionar: ${e.message}`, 'erro');
    }
  };

  const gerar = () => {
    const linhas = { ...q.linhas, ...linhasDlg.linhas };
    const novo = { ...q, linhas };
    setLinhasDlg(null);
    try {
      const res = dimensionar(novo);
      // grava com as linhas escolhidas
      const doc = {
        ...novo,
        geradoEm: new Date().toISOString(),
        resumo: res.resumo,
        memorial: res.memorial.map((m) => ({ ...m, entradas: pares(m.entradas), resultados: pares(m.resultados) }))
      };
      const salvo = saveDimensionamento(obra.id, doc);
      setQ(salvo ? { ...novo, ...salvo } : novo);
      setResultado(res);
      setObsoleto(false);
      notificar('Lista de materiais gerada e salva na obra.');
    } catch (e) {
      notificar(`Não foi possível dimensionar: ${e.message}`, 'erro');
    }
  };

  const salvarEquip = (equip) => {
    const lista = [...q.equipamentos];
    if (equipDlg.index == null) lista.push(equip);
    else lista[equipDlg.index] = equip;
    alterar('equipamentos', lista);
    setEquipDlg(null);
  };

  const duplicarEquip = (i) => {
    const copia = { ...clone(q.equipamentos[i]), nome: `${q.equipamentos[i].nome} (cópia)` };
    alterar('equipamentos', [...q.equipamentos.slice(0, i + 1), copia, ...q.equipamentos.slice(i + 1)]);
  };

  const removerEquip = (i) => alterar('equipamentos', q.equipamentos.filter((_, n) => n !== i));

  const excluirQuadro = () => {
    if (!window.confirm(`Excluir o quadro "${q.nome}" desta obra? Esta ação não pode ser desfeita.`)) return;
    deleteDimensionamento(q.id);
    onBack();
  };

  const exportarCsv = () => baixar(`${nomeArquivo(q.nome)}-lista-de-materiais.csv`, bomParaCSV(resultado));

  const imprimir = () => {
    const ok = imprimirHtml(relatorioQuadroHtml({ quadro: q, resultado, obra, responsavel: q.updatedBy ?? q.createdBy ?? currentUser?.name }));
    if (!ok) notificar('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.', 'erro');
  };

  const vincularQuadroObra = (id) => {
    const alvo = obraQuadros.find((x) => x.id === id);
    setQ((prev) => ({ ...prev, quadroObraId: id || null, nome: prev.nome || alvo?.name || '' }));
    if (resultado) setObsoleto(true);
  };

  return (
    <div className="dq-scope">
      <div className="dq-bar">
        <button type="button" className="btn btn-secondary" onClick={onBack}><ArrowLeft size={15} /> Quadros</button>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{q.id ? q.nome || 'Quadro' : 'Novo quadro'}</h2>
        <span className="dq-spacer" />
        {podeExcluir && (
          <button type="button" className="btn btn-danger" onClick={excluirQuadro}><Trash2 size={14} /> Excluir</button>
        )}
        <button type="button" className="btn btn-secondary" onClick={salvarRascunho}><Save size={14} /> Salvar rascunho</button>
        <button type="button" className="btn btn-primary" onClick={abrirLinhas}><Wand2 size={14} /> Gerar lista de materiais</button>
      </div>

      {aviso && (
        <div
          className="dq-alert"
          role="status"
          style={{ background: aviso.tipo === 'erro' ? 'var(--wash-rose)' : 'var(--wash-emerald)' }}
        >
          {aviso.texto}
        </div>
      )}

      <div className="dq-card">
        <h3>1. Dados do painel</h3>
        <div className="dq-grid">
          <Field label="Nome / TAG do quadro" wide>
            <input className="form-control" placeholder="QFAC-01" value={q.nome} onChange={(e) => alterar('nome', e.target.value)} />
          </Field>
          <Field label="Tensão de alimentação">
            <select className="form-control" value={q.tensao} onChange={(e) => alterar('tensao', Number(e.target.value))}>
              {[220, 380, 440].map((v) => <option key={v} value={v}>{v} V — trifásico</option>)}
            </select>
          </Field>
          <Field label="Tipo de quadro" wide>
            <select className="form-control" value={q.tipo} onChange={(e) => alterar('tipo', e.target.value)}>
              {Object.entries(TIPOS_QUADRO).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
            </select>
          </Field>
          {(cfg.comando || cfg.automacao) && (
            <Field label="Tensão de comando / bobinas">
              <select className="form-control" value={q.tensaoComando} onChange={(e) => alterar('tensaoComando', e.target.value)}>
                {Object.entries(BOBINAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          )}
          {cfg.porQuantidade && (
            <Field label={q.tipo === 'remoto' ? 'Quantidade de pontos / cargas' : 'Quantidade de dispositivos'}>
              <input className="form-control" type="number" min="1" step="1" value={q.quantity} onChange={alterarNum('quantity')} />
            </Field>
          )}
          {cfg.potencia && (
            <Field label="Distância do alimentador até o quadro (m)">
              <input className="form-control" type="number" min="0" step="any" value={q.distanciaAlimentador} onChange={alterarNum('distanciaAlimentador')} />
            </Field>
          )}
          {obraQuadros.length > 0 && (
            <Field label="Vincular a um quadro da obra (opcional)">
              <select className="form-control" value={q.quadroObraId ?? ''} onChange={(e) => vincularQuadroObra(e.target.value)}>
                <option value="">Sem vínculo</option>
                {obraQuadros.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </Field>
          )}
        </div>

        <div className="dq-checks">
          {cfg.potencia && (
            <label className="dq-check">
              <input type="checkbox" checked={!!q.dps} onChange={(e) => alterar('dps', e.target.checked)} />
              DPS na entrada (NBR 5410 6.3.5 / NBR 5419)
            </label>
          )}
          {cfg.automacao && (
            <label className="dq-check">
              <input type="checkbox" checked={!!q.hasIhm} onChange={(e) => alterar('hasIhm', e.target.checked)} />
              IHM na porta
            </label>
          )}
          {cfg.automacao && q.hasIhm && (
            <select className="form-control" style={{ width: 'auto' }} aria-label="Tamanho da IHM" value={q.ihmSize} onChange={(e) => alterar('ihmSize', e.target.value)}>
              {[['4.3"', '4,3"'], ['7"', '7"'], ['10"', '10"'], ['15"', '15"']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          )}
          {cfg.automacao && (
            <label className="dq-check">
              <input type="checkbox" checked={!!q.hasSupervisorio} onChange={(e) => alterar('hasSupervisorio', e.target.checked)} />
              Supervisório (Modbus / BACnet)
            </label>
          )}
        </div>

        <details className="dq-details">
          <summary>{cfg.potencia ? 'Critérios de instalação dos cabos de campo (NBR 5410)' : 'Dimensionamento da caixa'}</summary>
          <div className="dq-grid">
            {cfg.potencia && (
              <>
                <Field label="Método de instalação" wide>
                  <select className="form-control" value={q.metodo} onChange={(e) => alterar('metodo', e.target.value)}>
                    {Object.entries(METODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Isolação">
                  <select className="form-control" value={q.isolacao} onChange={(e) => alterar('isolacao', e.target.value)}>
                    <option value="PVC">PVC 70 °C</option>
                    <option value="EPR">EPR / XLPE 90 °C</option>
                  </select>
                </Field>
                <Field label="Temperatura ambiente (°C)">
                  <input className="form-control" type="number" step="any" value={q.tempAmbiente} onChange={alterarNum('tempAmbiente')} />
                </Field>
                <Field label="Circuitos agrupados no mesmo conduto">
                  <input className="form-control" type="number" min="1" step="1" value={q.agrupamento} onChange={alterarNum('agrupamento')} />
                </Field>
                <Field label="Queda de tensão máxima">
                  <select className="form-control" value={q.quedaMax} onChange={(e) => alterar('quedaMax', Number(e.target.value))}>
                    {LIMITES_QUEDA.map((l) => <option key={l.valor} value={l.valor}>{l.rotulo}</option>)}
                  </select>
                </Field>
                <Field label="Fator de serviço dos motores">
                  <input className="form-control" type="number" step="any" value={q.fatorServico} onChange={alterarNum('fatorServico')} />
                </Field>
                <Field label="Fator de demanda / simultaneidade (%)">
                  <input className="form-control" type="number" max="100" step="any" value={q.fatorDemanda} onChange={alterarNum('fatorDemanda')} />
                </Field>
              </>
            )}
            <Field label="Reserva de espaço na placa (%)">
              <input className="form-control" type="number" max="50" step="any" value={q.reserva} onChange={alterarNum('reserva')} />
            </Field>
          </div>
        </details>
      </div>

      {!cfg.porQuantidade && (
        <div className="dq-card">
          <div className="dq-bar" style={{ marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>2. Equipamentos</h3>
            <span className="dq-spacer" />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setEquipDlg({ index: null })}>
              <Plus size={14} /> Adicionar equipamento
            </button>
          </div>
          {q.equipamentos.length ? (
            <div className="dq-table-wrap">
              <table className="dq-table">
                <thead>
                  <tr><th>TAG</th><th>Tipo</th><th className="num">Potência</th><th>Partida</th><th className="num">Distância</th><th>Detalhes</th><th /></tr>
                </thead>
                <tbody>
                  {q.equipamentos.map((e, i) => (
                    <tr key={i}>
                      <td><strong>{e.nome}</strong></td>
                      <td>{TIPOS_EQUIP[e.tipo]?.rotulo.split(/ — | \(/)[0] ?? e.tipo}</td>
                      <td className="num">{descPotencia(e)}</td>
                      <td>{TIPOS_EQUIP[e.tipo]?.partidas ? PARTIDAS[e.partida] ?? '—' : '—'}</td>
                      <td className="num">{e.distancia ? `${fmt(e.distancia)} m` : '—'}</td>
                      <td className="dq-sub">{descExtras(e)}</td>
                      <td className="actions">
                        <button type="button" className="btn btn-ghost btn-sm" title="Editar" onClick={() => setEquipDlg({ index: i })}><Pencil size={13} /></button>
                        <button type="button" className="btn btn-ghost btn-sm" title="Duplicar" onClick={() => duplicarEquip(i)}><Copy size={13} /></button>
                        <button type="button" className="btn btn-danger btn-sm" title="Remover" onClick={() => removerEquip(i)}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="dq-muted" style={{ textAlign: 'center', padding: '1rem 0' }}>
              Adicione os equipamentos alimentados ou controlados por este quadro.
            </p>
          )}
        </div>
      )}

      {resultado && obsoleto && (
        <div className="dq-alert">
          Os dados foram alterados depois da última geração. Clique em <strong>Gerar lista de materiais</strong> para atualizar o resultado abaixo.
        </div>
      )}

      {resultado && (
        <QuadroResultado
          quadro={q}
          resultado={resultado}
          onLinhas={abrirLinhas}
          onCsv={exportarCsv}
          onPrint={imprimir}
        />
      )}

      {equipDlg && (
        <EquipDialog
          initial={equipDlg.index == null ? null : q.equipamentos[equipDlg.index]}
          quadroTipo={q.tipo}
          tensao={q.tensao}
          onSave={salvarEquip}
          onClose={() => setEquipDlg(null)}
        />
      )}

      {linhasDlg && (
        <ModalShell
          title="Linhas de produto"
          subtitle="Defina a linha de cada tipo de peça usada neste quadro. Os modelos são selecionados nos catálogos conforme as correntes calculadas."
          onClose={() => setLinhasDlg(null)}
        >
          <div className="dq-grid one">
            {linhasDlg.previa.categoriasUsadas.map((k) => (
              <Field key={k} label={CATEGORIAS[k].rotulo}>
                <select
                  className="form-control"
                  value={linhasDlg.linhas[k]}
                  onChange={(e) => setLinhasDlg((d) => ({ ...d, linhas: { ...d.linhas, [k]: e.target.value } }))}
                >
                  {CATEGORIAS[k].opcoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              </Field>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setLinhasDlg(null)}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={gerar}><Wand2 size={14} /> Gerar lista</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
};
