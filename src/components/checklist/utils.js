import { SECOES_CHECKLIST, chaveItem } from '../../constants/checklistQuadros';
import { h, baixar, nomeArquivo, imprimirHtml, dataHora } from '../dimensionamento/helpers';

// ---------------------------------------------------------------------------
// Fotos: reduz a imagem no navegador para o laudo caber no banco de dados.
// ---------------------------------------------------------------------------
export function comprimirImagem(arquivo, maxLado = 800, qualidade = 0.6) {
  return new Promise((resolve, reject) => {
    if (!arquivo?.type?.startsWith('image/')) return reject(new Error('Arquivo não é uma imagem.'));
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

// ---------------------------------------------------------------------------
// Estatísticas e pendências
// ---------------------------------------------------------------------------
export function estatisticas(itens) {
  let conformes = 0;
  let naoConformes = 0;
  let naoPreenchidos = 0;
  Object.values(itens).forEach((i) => {
    if (i.status === 'conforme') conformes += 1;
    else if (i.status === 'nao_conforme') naoConformes += 1;
    else naoPreenchidos += 1;
  });
  const respondidos = conformes + naoConformes;
  return {
    totalItens: respondidos + naoPreenchidos,
    conformes,
    naoConformes,
    naoPreenchidos,
    percentualConformidade: respondidos ? Math.round((conformes / respondidos) * 100) : 0
  };
}

export const pendenciasDe = (itens) =>
  Object.values(itens)
    .filter((i) => i.status === 'nao_conforme')
    .map((i) => ({ secao: i.secao, item: i.item, motivo: i.motivo || 'Não conformidade registrada', qtdFotos: (i.fotos || []).length }));

/** Itens do laudo na ordem do modelo (seção > item). */
export function itensOrdenados(laudo) {
  const linhas = [];
  SECOES_CHECKLIST.forEach((sec) => {
    sec.itens.forEach((it, idx) => {
      const dado = laudo.itens?.[chaveItem(sec.id, idx)];
      linhas.push({
        chave: chaveItem(sec.id, idx),
        secao: sec.titulo,
        item: it.titulo,
        criterio: it.criterio,
        status: dado?.status ?? null,
        motivo: dado?.motivo ?? '',
        fotos: dado?.fotos ?? []
      });
    });
  });
  return linhas;
}

const ROTULO_STATUS = { conforme: 'Conforme', nao_conforme: 'Não conforme' };

// ---------------------------------------------------------------------------
// Exportações
// ---------------------------------------------------------------------------
const CSS_LAUDO = `
  *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1f2733;margin:22px;font-size:12px;line-height:1.45}
  h1{font-size:20px;margin:0}h2{font-size:14px;margin:18px 0 6px;color:#2f4fa8;border-bottom:2px solid #dfe6f7;padding-bottom:3px}
  .sub{color:#667085}.cab{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #4f7cf0;padding-bottom:10px;margin-bottom:12px}
  .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.meta div{background:#f4f6fa;border-radius:6px;padding:6px 8px}
  .meta dt{font-size:10px;text-transform:uppercase;color:#667085}.meta dd{margin:0;font-weight:700}
  table{width:100%;border-collapse:collapse;margin:6px 0}th,td{border:1px solid #d9dfeb;padding:5px 7px;text-align:left;vertical-align:top}
  th{background:#eef1f6;font-size:11px}.ok{color:#157a5c;font-weight:700}.nok{color:#b42323;font-weight:700}.pend{color:#667085}
  tr.nc td{background:#fff3f3}.fotos{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px}.fotos img{height:90px;border:1px solid #d9dfeb;border-radius:4px}
  .assin{margin-top:26px;text-align:center;width:260px;margin-left:auto}.assin img{max-height:70px}.assin div{border-top:1px solid #1f2733;padding-top:4px;font-weight:700}
  .rodape{margin-top:20px;font-size:10px;color:#667085;border-top:1px solid #d9dfeb;padding-top:6px}
  @media print{body{margin:10mm}tr,.fotos{break-inside:avoid}h2{break-after:avoid}}
`;

export function laudoHtml(laudo, obra) {
  const est = laudo.estatisticas || estatisticas(laudo.itens || {});
  const linhas = itensOrdenados(laudo);

  const pend = linhas.filter((l) => l.status === 'nao_conforme');
  const blocoPend = pend.length
    ? `<h2>Não conformidades (${pend.length})</h2><table><thead><tr><th>Seção</th><th>Item</th><th>Justificativa</th></tr></thead><tbody>${pend
        .map(
          (p) => `<tr class="nc"><td>${h(p.secao)}</td><td>${h(p.item)}
          ${p.fotos.length ? `<div class="fotos">${p.fotos.map((f) => `<img src="${f}" alt="">`).join('')}</div>` : ''}</td><td>${h(p.motivo)}</td></tr>`
        )
        .join('')}</tbody></table>`
    : '<h2>Não conformidades</h2><p class="ok">Nenhuma não conformidade registrada.</p>';

  let secaoAtual = '';
  const corpo = linhas
    .map((l) => {
      const cab = l.secao !== secaoAtual ? `<tr><th colspan="3">${h((secaoAtual = l.secao))}</th></tr>` : '';
      const cls = l.status === 'conforme' ? 'ok' : l.status === 'nao_conforme' ? 'nok' : 'pend';
      return `${cab}<tr class="${l.status === 'nao_conforme' ? 'nc' : ''}"><td>${h(l.item)}<div class="sub">${h(l.criterio)}</div></td>
        <td class="${cls}" style="white-space:nowrap">${h(ROTULO_STATUS[l.status] ?? 'Não verificado')}</td><td>${h(l.motivo)}</td></tr>`;
    })
    .join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${h(`Laudo Nº ${laudo.numero} — ${laudo.quadroNome}`)}</title><style>${CSS_LAUDO}</style></head><body>
    <div class="cab"><div><h1>Checklist de conferência de quadro elétrico</h1>
      <div class="sub">Relatório Nº ${h(laudo.numero)} · ${h(obra?.name ?? 'Obra')}</div></div>
      <div class="sub">3D Ar Condicionado</div></div>
    <dl class="meta">
      <div><dt>Quadro</dt><dd>${h(laudo.quadroNome)}</dd></div>
      <div><dt>Inspetor</dt><dd>${h(laudo.inspetor)}</dd></div>
      <div><dt>Data / hora</dt><dd>${h(dataHora(laudo.dataHora))}</dd></div>
      <div><dt>Conformidade</dt><dd>${est.percentualConformidade}% (${est.conformes} conf. / ${est.naoConformes} não conf.)</dd></div>
    </dl>
    ${blocoPend}
    <h2>Itens verificados</h2>
    <table><thead><tr><th>Item e critério de aceite</th><th>Resultado</th><th>Justificativa</th></tr></thead><tbody>${corpo}</tbody></table>
    <h2>Observações gerais</h2>
    <p>${h(laudo.observacoes || 'Nenhuma observação complementar.')}</p>
    ${laudo.fotosObservacoes?.length ? `<div class="fotos">${laudo.fotosObservacoes.map((f) => `<img src="${f}" alt="">`).join('')}</div>` : ''}
    <div class="assin">${laudo.assinatura ? `<img src="${laudo.assinatura}" alt="Assinatura">` : '<div style="height:50px"></div>'}<div>${h(laudo.inspetor)}</div><span class="sub">Inspetor responsável</span></div>
    <p class="rodape">Laudo gerado pelo sistema de gestão de obras. Documento de conferência técnica — valores e conclusões dependem do preenchimento do inspetor.</p>
    <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})<\/script>
  </body></html>`;
}

export const imprimirLaudo = (laudo, obra) => imprimirHtml(laudoHtml(laudo, obra));

export function baixarLaudoCsv(laudo, obra) {
  const est = laudo.estatisticas || estatisticas(laudo.itens || {});
  const cab = [
    ['Relatório', `Nº ${laudo.numero}`],
    ['Obra', obra?.name ?? ''],
    ['Quadro', laudo.quadroNome],
    ['Inspetor', laudo.inspetor],
    ['Data/hora', dataHora(laudo.dataHora)],
    ['Conformidade', `${est.percentualConformidade}% (${est.conformes} conformes, ${est.naoConformes} não conformes, ${est.naoPreenchidos} sem resposta)`],
    []
  ];
  const linhas = [['Seção', 'Item', 'Critério de aceite', 'Resultado', 'Justificativa', 'Fotos'], ...itensOrdenados(laudo).map((l) => [
    l.secao, l.item, l.criterio, ROTULO_STATUS[l.status] ?? 'Não verificado', l.motivo, l.fotos.length
  ])];
  const rodape = [[], ['Observações gerais', laudo.observacoes || '']];
  const csv =
    '﻿' +
    [...cab, ...linhas, ...rodape]
      .map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
  baixar(`${nomeArquivo(`laudo-${laudo.numero}-${laudo.quadroNome}`)}.csv`, csv, 'text/csv;charset=utf-8');
}
