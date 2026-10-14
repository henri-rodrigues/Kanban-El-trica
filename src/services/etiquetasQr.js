import QRCode from 'qrcode';
import { h } from '../components/dimensionamento/helpers';
import { linkDoQuadro } from './deeplink';

const CSS = `
  *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1f2733;margin:10mm}
  .grade{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}
  .etq{border:1px dashed #9aa4b5;border-radius:4mm;padding:4mm;text-align:center;break-inside:avoid;page-break-inside:avoid}
  .etq svg{width:42mm;height:42mm}
  .nome{font-size:15px;font-weight:800;margin-top:2mm}
  .obra{font-size:10px;color:#667085}
  .dica{font-size:8px;color:#98a2b3;margin-top:1mm}
  .topo{font-size:11px;color:#667085;margin-bottom:6mm}
  @media print{.topo{display:none}body{margin:8mm}}
`;

/**
 * Abre uma folha A4 com etiquetas QR (3 por linha) que levam direto à pasta de cada quadro.
 * A janela é aberta antes de gerar os códigos para não ser barrada pelo bloqueador de pop-ups.
 */
export async function imprimirEtiquetas(obra, quadros) {
  const janela = window.open('', '_blank');
  if (!janela) {
    window.alert('Permita pop-ups para imprimir as etiquetas.');
    return;
  }
  janela.document.write('<p style="font-family:sans-serif">Gerando etiquetas…</p>');

  const etiquetas = await Promise.all(
    quadros.map(async (q) => {
      const svg = await QRCode.toString(linkDoQuadro(obra.id, q.id), { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
      return `<div class="etq">${svg}<div class="nome">${h(q.name)}</div><div class="obra">${h(obra.name)}</div><div class="dica">Aponte a câmera para abrir a pasta do quadro</div></div>`;
    })
  );

  janela.document.open();
  janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Etiquetas QR — ${h(obra.name)}</title><style>${CSS}</style></head><body>
    <div class="topo">${quadros.length} etiqueta(s) · recorte na linha tracejada e cole na porta do painel.</div>
    <div class="grade">${etiquetas.join('')}</div>
    <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},300)})<\/script>
  </body></html>`);
  janela.document.close();
}
