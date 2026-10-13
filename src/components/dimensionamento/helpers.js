import { REFERENCIAS } from '../../services/quadros/normas';
import { PARTIDAS } from '../../services/quadros/dimensionamento';
import { desenharLayout, LEGENDA_LAYOUT } from '../../services/quadros/layout';

export const h = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const fmt = (v, casas = 2) =>
  Number.isFinite(Number(v)) && v !== '' && v !== null
    ? Number(v).toLocaleString('pt-BR', { maximumFractionDigits: casas })
    : '—';

export const dataHora = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export const clone = (o) => JSON.parse(JSON.stringify(o));

// Objeto {chave: valor} ⇄ lista [{k, v}] (o Firestore aceita ambos, mas a lista é mais segura para chaves com símbolos).
export const pares = (o) =>
  Array.isArray(o) ? o : Object.entries(o ?? {}).map(([k, v]) => ({ k, v: String(v) }));

/** Dispara o download de um arquivo gerado no navegador. */
export function baixar(nome, conteudo, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const nomeArquivo = (s) => String(s || 'quadro').replace(/[\\/:*?"<>|\s]+/g, '-');

const CSS_RELATORIO = `
  *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1f2733;margin:24px;font-size:12px;line-height:1.45}
  h1{font-size:20px;margin:0}h2{font-size:14px;margin:18px 0 6px;color:#2f4fa8;border-bottom:1px solid #d9dfeb;padding-bottom:3px}
  .sub{color:#667085}.cab{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #4f7cf0;padding-bottom:10px;margin-bottom:12px}
  .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.meta div{background:#f4f6fa;border-radius:6px;padding:6px 8px}
  .meta dt{font-size:10px;text-transform:uppercase;color:#667085}.meta dd{margin:0;font-weight:700}
  table{width:100%;border-collapse:collapse;margin:6px 0}th,td{border:1px solid #d9dfeb;padding:4px 6px;text-align:left;vertical-align:top}
  th{background:#eef1f6;font-size:11px}td.num,th.num{text-align:right;white-space:nowrap}tr.grupo th{background:#dfe6f7;color:#2f4fa8}
  .avisos{background:#fff6e0;border-radius:6px;padding:8px 8px 8px 24px;margin:8px 0}
  .layout-svg{width:100%;max-height:520px}.lay-caixa,.lay-porta{fill:#c9c7b6;stroke:#77756a;stroke-width:3}.lay-placa{fill:#f2a23c;stroke:#a8661a;stroke-width:1.5}
  .lay-duto{fill:#dfe3e8;stroke:#7d8794}.lay-rasgo line{stroke:#9aa3ae}.lay-trilho{fill:#b9c0c9;stroke:#7d8794}.lay-comp{stroke:#fff}.lay-div{stroke:rgba(255,255,255,.55)}
  .lay-tag{fill:#fff;font-weight:700;text-anchor:middle;dominant-baseline:central}.lay-fecho{fill:#3f4650}.lay-ihm{fill:#17212d;stroke:#5d6876;stroke-width:6}
  .lay-grelha{fill:#8d939b;stroke:#4b5158;stroke-width:2;stroke-dasharray:4 3}.lay-botao{stroke:#2c333c;stroke-width:3}.lay-knob{fill:#f1f3f5}
  .lay-leg{fill:#1f2933;text-anchor:middle;font-weight:700}.lay-titulo,.lay-cota{fill:#1f2733;text-anchor:middle;font-weight:700}.lay-cota{fill:#667085;font-weight:500}
  .legenda{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:4px 14px}.legenda i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px}
  .rodape{margin-top:18px;font-size:10px;color:#667085;border-top:1px solid #d9dfeb;padding-top:6px}
  @media print{body{margin:10mm}tr,.layout-svg{break-inside:avoid}}
`;

const tabelaPares = (o) =>
  `<table><tbody>${pares(o).map(({ k, v }) => `<tr><th style="width:55%">${h(k)}</th><td>${h(v)}</td></tr>`).join('')}</tbody></table>`;

/** Documento HTML autônomo (para impressão / PDF) com o resultado completo do quadro. */
export function relatorioQuadroHtml({ quadro, resultado, obra, responsavel }) {
  const s = resultado.resumo;
  const cargas = resultado.cargas
    .map(
      (c) => `<tr><td><strong>${h(c.nome)}</strong>${c.qtd > 1 ? ` × ${c.qtd}` : ''}</td>
      <td>${{ motor: 'Motor', resistiva: 'Resistência', carga: 'Carga' }[c.natureza] ?? ''}</td>
      <td class="num">${fmt(c.kW)}</td><td class="num">${fmt(c.corrente)}</td><td>${h(PARTIDAS[c.partida] ?? '—')}</td>
      <td>${h(c.protecao)}</td><td>${h(c.acionamento)}</td><td class="num">${c.cabo ? fmt(c.cabo) : '—'}</td><td class="num">${c.cabo ? fmt(c.queda) : '—'}</td></tr>`
    )
    .join('');
  let grupo = '';
  const bom = resultado.bom
    .map((i) => {
      const cab = i.grupo !== grupo ? `<tr class="grupo"><th colspan="7">${h((grupo = i.grupo))}</th></tr>` : '';
      return `${cab}<tr><td>${h(i.tag)}</td><td><strong>${h(i.modelo)}</strong></td><td>${h(i.descricao)}</td>
        <td class="num">${fmt(i.qtd)}</td><td>${h(i.un)}</td><td>${h(i.fabricante)}</td><td>${h(i.just)}</td></tr>`;
    })
    .join('');
  const memorial = resultado.memorial
    .map(
      (m) => `<h2>${h(m.titulo)}</h2>
      <p class="sub">Referência: ${h(m.norma)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div>${tabelaPares(m.entradas)}</div><div>${tabelaPares(m.resultados)}</div></div>`
    )
    .join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
  <title>${h(`Quadro ${s.nome} — lista de materiais`)}</title><style>${CSS_RELATORIO}</style></head><body>
  <div class="cab"><div><h1>Dimensionamento do quadro ${h(s.nome)}</h1>
    <div class="sub">${h(obra?.name ?? 'Obra')} · ${h(s.tipo)}</div></div>
    <div class="sub">Emitido em ${dataHora(new Date().toISOString())}</div></div>
  <dl class="meta">
    <div><dt>Tensão</dt><dd>${h(s.tensao)} V</dd></div>
    <div><dt>Corrente total</dt><dd>${s.correnteTotal ? `${fmt(s.correnteTotal, 1)} A` : '—'}</dd></div>
    <div><dt>Caixa</dt><dd>${h(s.caixa)}</dd></div>
    <div><dt>Dimensões</dt><dd>${h(s.dimensoes)}</dd></div>
    <div><dt>Potência instalada</dt><dd>${s.potenciaTotal ? `${fmt(s.potenciaTotal, 1)} kW` : '—'}</dd></div>
    <div><dt>Itens na lista</dt><dd>${s.itens}</dd></div>
    <div><dt>Gerado em</dt><dd>${dataHora(quadro.geradoEm)}</dd></div>
    <div><dt>Responsável</dt><dd>${h(responsavel ?? '—')}</dd></div>
  </dl>
  ${resultado.avisos.length ? `<ul class="avisos">${resultado.avisos.map((a) => `<li>${h(a)}</li>`).join('')}</ul>` : ''}
  ${resultado.cargas.length ? `<h2>Tabela de cargas</h2><table><thead><tr><th>TAG</th><th>Tipo</th><th class="num">kW</th><th class="num">In (A)</th><th>Partida</th><th>Proteção</th><th>Acionamento</th><th class="num">Cabo (mm²)</th><th class="num">Queda (%)</th></tr></thead><tbody>${cargas}</tbody></table>
  <p class="sub">Cabos de campo: ${h(REFERENCIAS.ampacidade)}; ${h(REFERENCIAS.queda)}.</p>` : ''}
  <h2>Lista de materiais</h2>
  <table><thead><tr><th>TAG</th><th>Modelo</th><th>Descrição</th><th class="num">Qtd</th><th>Un</th><th>Fabricante</th><th>Justificativa técnica</th></tr></thead><tbody>${bom}</tbody></table>
  <h2>Proteções e automação</h2>
  <table><tbody>${resultado.protecoes.map(([t, v]) => `<tr><th style="width:30%">${h(t)}</th><td>${h(v)}</td></tr>`).join('')}</tbody></table>
  <h2>Layout do quadro montado</h2>${desenharLayout(resultado.layout)}
  <ul class="legenda">${LEGENDA_LAYOUT.map((l) => `<li><i style="background:${l.cor}"></i>${h(l.texto)}</li>`).join('')}</ul>
  ${memorial}
  <p class="rodape">Resultado de pré-dimensionamento. A especificação final deve ser conferida e validada pelo responsável técnico, com as normas vigentes e os catálogos atualizados dos fabricantes.</p>
  <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},300)})<\/script>
  </body></html>`;
}

/** Abre o relatório em nova janela e envia para impressão / salvar como PDF. */
export function imprimirHtml(html) {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
