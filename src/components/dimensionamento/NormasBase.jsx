import React from 'react';
import { CURVAS } from '../../services/quadros/normas';

const NORMAS = [
  ['ABNT NBR 5410', 'Instalações elétricas de baixa tensão', 'Capacidade de condução (Tab. 36 a 39), fatores de correção (Tab. 40 e 42), queda de tensão (6.2.7), seção mínima (Tab. 47), coordenação IB ≤ In ≤ Iz (5.3.4), condutor de proteção (Tab. 58), ocupação de eletrodutos (6.2.11.1.6), circuitos de motores (6.5.1) e DPS (6.3.5).'],
  ['ABNT NBR 5419', 'Proteção contra descargas atmosféricas', 'Parte 4: medidas de proteção contra surtos — define a inclusão do DPS Classe II (ou I+II) na entrada do quadro.'],
  ['ABNT NBR IEC 60898 / NBR NM 60898', 'Minidisjuntores', `Curvas de disparo dos MDW: B (${CURVAS.B}); C (${CURVAS.C}); D (${CURVAS.D}). Capacidade de interrupção deve ser ≥ Icc presumida.`],
  ['ABNT NBR 6147', 'Plugues e tomadas', 'Norma cancelada e substituída pela NBR NM 60884-1 e pela padronização NBR 14136 — aplicada à tomada de serviço 2P+T do quadro.'],
  ['ABNT NBR 6524', 'Fios e cabos de cobre duro e meio duro para instalações aéreas', 'Sem aplicação direta à fiação interna do painel; referência apenas para condutores nus de aterramento. Os cabos isolados seguem a NBR NM 247-3 (750 V) e a NBR 7286/7288 (0,6/1 kV).'],
  ['ABNT NBR IEC 61439-1/2', 'Conjuntos de manobra e comando de baixa tensão', 'Critério de reserva de espaço e de elevação de temperatura usado no pré-dimensionamento da caixa e da ventilação.']
];

const CATALOGOS = [
  ['Disjuntores-motores MPW', 'WEG 50009822'],
  ['Contatores CWB / CWM e minicontatores CWC', 'WEG 50042424, 50051271, 50040226'],
  ['Relés de sobrecarga RW', 'WEG 50042397'],
  ['Minidisjuntores MDW/MDWH, DWP, DR e soluções integradas', 'WEG 50009824'],
  ['Disjuntores em caixa moldada AGW', 'WEG 50051732'],
  ['Seccionadoras MSW', 'WEG 50161813'],
  ['Inversores CFW500', 'Catálogo CFW-500'],
  ['Soft-starters SSW05 / SSW07 / SSW900', 'WEG 10525004'],
  ['Fontes PSS24-W', 'WEG 50058708'],
  ['DPS SPW03 / SPW13', 'WEG 50160727'],
  ['Comando e sinalização CSW', 'WEG CSW'],
  ['Bornes BTW', 'WEG BTW'],
  ['Caixas BRCE e armários BRK', 'Catálogo parcial de armários e caixas'],
  ['Caixa Volt 160 e barramentos Volt EX', 'Catálogos Volt'],
  ['Conversor de potência MPCTPF', 'LOTI rev. 6']
];

export const NormasBase = () => (
  <div className="dq-scope">
    <div className="dq-card">
      <h3>Normas aplicadas</h3>
      <div className="dq-table-wrap">
        <table className="dq-table">
          <thead><tr><th>Norma</th><th>Assunto</th><th>Como é usada no sistema</th></tr></thead>
          <tbody>
            {NORMAS.map((n) => (
              <tr key={n[0]}><td><strong>{n[0]}</strong></td><td>{n[1]}</td><td>{n[2]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="dq-sub" style={{ marginTop: '0.6rem' }}>
        As tabelas normativas estão transcritas no sistema; os PDFs das normas não fazem parte da base. Todo resultado é um pré-dimensionamento e deve ser validado pelo responsável técnico.
      </p>
    </div>

    <div className="dq-card">
      <h3>Catálogos utilizados na seleção de materiais</h3>
      <div className="dq-table-wrap">
        <table className="dq-table">
          <thead><tr><th>Linha de produto</th><th>Documento</th></tr></thead>
          <tbody>
            {CATALOGOS.map((c) => <tr key={c[0]}><td>{c[0]}</td><td>{c[1]}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>

    <div className="dq-card">
      <h3>Premissas de cálculo</h3>
      <ul style={{ paddingLeft: '1.2rem', display: 'grid', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
        <li>Corrente de motores: tabela de valores típicos WEG W22 IR3 Premium, 4 polos, 60 Hz. A corrente de placa, quando informada, prevalece.</li>
        <li>Demais cargas trifásicas: I = P / (√3 · V · 0,85). Cargas monofásicas: I = P / (V · 0,9). Resistências: cosφ = 1.</li>
        <li>Cabos de campo: maior seção entre capacidade de condução corrigida, queda de tensão, coordenação com a proteção e mínimo de 2,5 mm².</li>
        <li>Proteção geral: soma das correntes × fator de demanda + 25% da corrente do maior motor.</li>
        <li>Composição do quadro (itens fixos, bornes por equipamento, cabos internos, regra de 440 V): regras de composição do motor de dimensionamento (EstruturadeCriação).</li>
        <li>TAGs e itens de automação (CLP CAREL, relés de interface, barramentos BDS): projetos QFAC de referência.</li>
      </ul>
    </div>
  </div>
);
