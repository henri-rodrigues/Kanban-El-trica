import React, { useState } from 'react';
import { ModalShell } from './ModalShell';
import { TIPOS_EQUIP, TIPOS_QUADRO, PARTIDAS, LEITURAS } from '../../services/quadros/dimensionamento';
import { CV } from '../../services/quadros/motores';
import { clone } from './helpers';

const NOVO = {
  tipo: 'EXCV', nome: '', potencia: '', unidadePot: 'cv', partida: 'direta', distancia: '', leituras: [],
  heatingType: 'estagios', heatingStages: 1, humidType: 'onoff', valvula: 'direta', splitPhase: 'mono', fases: 'tri'
};

const Field = ({ label, wide, children }) => (
  <label className={`dq-field${wide ? ' wide' : ''}`}>
    <span>{label}</span>
    {children}
  </label>
);

const num = (v) => (v === '' || v === undefined || v === null ? '' : v);

export const EquipDialog = ({ initial, quadroTipo, tensao, onSave, onClose }) => {
  const [e, setE] = useState(() => (initial ? clone(initial) : clone(NOVO)));
  const cfg = TIPOS_QUADRO[quadroTipo];
  const t = TIPOS_EQUIP[e.tipo];
  const motor = Boolean(t.partidas);
  const temPotencia = !['VRF', 'FANCOLETE'].includes(e.tipo);

  // Texto digitado na potência (na unidade escolhida) — evita "brigar" com o arredondamento ao digitar.
  const [potTxt, setPotTxt] = useState(() => {
    if (e.potencia === '' || e.potencia == null) return '';
    return e.unidadePot === 'cv' ? String(+(e.potencia / CV).toFixed(3)) : String(e.potencia);
  });

  const set = (campo, valor) => setE((prev) => ({ ...prev, [campo]: valor }));
  const setNum = (campo) => (ev) => set(campo, ev.target.value === '' ? '' : Number(ev.target.value));

  const trocarTipo = (tipo) => {
    setE((prev) => {
      const partidas = TIPOS_EQUIP[tipo].partidas;
      return { ...prev, tipo, partida: partidas && !partidas.includes(prev.partida) ? partidas[0] : prev.partida };
    });
  };

  const mudarPotencia = (txt, unidade = e.unidadePot) => {
    setPotTxt(txt);
    const v = txt === '' ? '' : Number(txt);
    set('potencia', v === '' || Number.isNaN(v) ? '' : +(v * (unidade === 'cv' ? CV : 1)).toFixed(4));
  };

  const mudarUnidade = (unidade) => {
    // mantém o valor em kW e converte o texto exibido
    const kW = e.potencia;
    setE((prev) => ({ ...prev, unidadePot: unidade }));
    setPotTxt(kW === '' || kW == null ? '' : unidade === 'cv' ? String(+(kW / CV).toFixed(3)) : String(kW));
  };

  const alternarLeitura = (l) =>
    set('leituras', e.leituras?.includes(l) ? e.leituras.filter((x) => x !== l) : [...(e.leituras ?? []), l]);

  const salvar = (ev) => {
    ev.preventDefault();
    if (!e.nome.trim()) return;
    onSave({ ...e, nome: e.nome.trim() });
  };

  const alimentacao =
    e.tipo === 'SPLIT' ? (
      <select className="form-control" value={e.splitPhase} onChange={(ev) => set('splitPhase', ev.target.value)}>
        <option value="mono">Monofásico / bifásico 220 V</option>
        <option value="tri">Trifásico {tensao} V</option>
      </select>
    ) : e.tipo === 'CARGA' ? (
      <select className="form-control" value={e.fases} onChange={(ev) => set('fases', ev.target.value)}>
        <option value="tri">Trifásico {tensao} V</option>
        <option value="mono">Monofásico / bifásico 220 V</option>
      </select>
    ) : (
      <input className="form-control" disabled value={e.tipo === 'FANCOLETE' ? 'Bifásico 220 V' : `Trifásico ${tensao} V (tensão do quadro)`} />
    );

  return (
    <ModalShell title={initial ? 'Editar equipamento' : 'Adicionar equipamento'} onClose={onClose} maxWidth={720}>
      <form onSubmit={salvar}>
        <div className="dq-grid">
          <Field label="Tipo de equipamento" wide>
            <select className="form-control" value={e.tipo} onChange={(ev) => trocarTipo(ev.target.value)}>
              {Object.entries(TIPOS_EQUIP).map(([k, v]) => (
                <option key={k} value={k}>{v.rotulo}</option>
              ))}
            </select>
          </Field>
          <Field label="Nome / TAG">
            <input className="form-control" required placeholder="EX-01" value={e.nome} onChange={(ev) => set('nome', ev.target.value)} />
          </Field>
          <Field label="Tensão de alimentação">{alimentacao}</Field>

          {temPotencia && (
            <Field label={e.tipo === 'UTA' || e.tipo === 'SPLITAO' ? 'Potência do motor do ventilador' : 'Potência'}>
              <span className="dq-inline">
                <input
                  className="form-control" type="number" step="any" min="0" required inputMode="decimal"
                  value={potTxt} onChange={(ev) => mudarPotencia(ev.target.value)}
                />
                <select className="form-control" style={{ width: '5.5rem' }} value={e.unidadePot ?? 'kW'} onChange={(ev) => mudarUnidade(ev.target.value)}>
                  <option value="cv">cv</option>
                  <option value="kW">kW</option>
                </select>
              </span>
            </Field>
          )}

          {motor && (
            <Field label="Tipo de partida">
              <select className="form-control" value={e.partida} onChange={(ev) => set('partida', ev.target.value)}>
                {t.partidas.map((p) => (
                  <option key={p} value={p}>{PARTIDAS[p]}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Distância do quadro (m)">
            <input className="form-control" type="number" step="any" min="0" value={num(e.distancia)} onChange={setNum('distancia')} />
          </Field>

          {temPotencia && (
            <Field label="Corrente de placa (A) — opcional">
              <input
                className="form-control" type="number" step="any" min="0" placeholder="prevalece sobre o cálculo"
                value={num(e.correntePlaca)} onChange={setNum('correntePlaca')}
              />
            </Field>
          )}

          {(e.tipo === 'VRF' || e.tipo === 'SPLITAO') && (
            <Field label="Potências das condensadoras (kW), separadas por ;" wide>
              <input className="form-control" placeholder="12; 14; 16" value={e.condensadoras ?? ''} onChange={(ev) => set('condensadoras', ev.target.value)} />
            </Field>
          )}
          {e.tipo === 'VRF' && (
            <Field label="Quantidade de evaporadoras (200 W cada)">
              <input className="form-control" type="number" step="1" min="0" value={num(e.evaporadoras)} onChange={setNum('evaporadoras')} />
            </Field>
          )}
          {e.tipo === 'FANCOLETE' && (
            <Field label="Quantidade de fancoletes (200 W cada)">
              <input className="form-control" type="number" step="1" min="1" value={num(e.fancoleteQty ?? 1)} onChange={setNum('fancoleteQty')} />
            </Field>
          )}
        </div>

        {e.tipo === 'UTA' && (
          <fieldset className="dq-fieldset">
            <legend>Aquecimento, umidificação e válvula</legend>
            <div className="dq-checks" style={{ marginTop: 0 }}>
              <label className="dq-check">
                <input type="checkbox" checked={!!e.hasHeating} onChange={(ev) => set('hasHeating', ev.target.checked)} />
                Resistência de aquecimento
              </label>
              <label className="dq-check">
                <input type="checkbox" checked={!!e.hasHumid} onChange={(ev) => set('hasHumid', ev.target.checked)} />
                Umidificador
              </label>
            </div>
            <div className="dq-grid" style={{ marginTop: '0.75rem' }}>
              {e.hasHeating && (
                <>
                  <Field label="Potência do aquecimento (kW)">
                    <input className="form-control" type="number" step="any" min="0" value={num(e.heatingPower)} onChange={setNum('heatingPower')} />
                  </Field>
                  <Field label="Controle do aquecimento">
                    <select className="form-control" value={e.heatingType} onChange={(ev) => set('heatingType', ev.target.value)}>
                      <option value="estagios">Estágios (contatores)</option>
                      <option value="scr">Proporcional (SCR)</option>
                    </select>
                  </Field>
                  {e.heatingType !== 'scr' && (
                    <Field label="Número de estágios">
                      <input className="form-control" type="number" step="1" min="1" value={num(e.heatingStages ?? 1)} onChange={setNum('heatingStages')} />
                    </Field>
                  )}
                </>
              )}
              {e.hasHumid && (
                <>
                  <Field label="Potência do umidificador (kW)">
                    <input className="form-control" type="number" step="any" min="0" value={num(e.humidPower)} onChange={setNum('humidPower')} />
                  </Field>
                  <Field label="Controle do umidificador">
                    <select className="form-control" value={e.humidType} onChange={(ev) => set('humidType', ev.target.value)}>
                      <option value="onoff">On-Off</option>
                      <option value="prop">Proporcional</option>
                    </select>
                  </Field>
                </>
              )}
              <Field label="Válvula de água / expansão">
                <select className="form-control" value={e.valvula} onChange={(ev) => set('valvula', ev.target.value)}>
                  <option value="direta">Direta</option>
                  <option value="indireta">Indireta — proporcional 0-10 V</option>
                </select>
              </Field>
            </div>
          </fieldset>
        )}

        {cfg.automacao && t.leituras && (
          <fieldset className="dq-fieldset">
            <legend>Leituras de automação</legend>
            <div className="dq-checks" style={{ marginTop: 0 }}>
              {t.leituras.map((l) => (
                <label key={l} className="dq-check">
                  <input type="checkbox" checked={!!e.leituras?.includes(l)} onChange={() => alternarLeitura(l)} />
                  {LEITURAS[l][0]}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">{initial ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </form>
    </ModalShell>
  );
};
