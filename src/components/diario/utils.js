import { h, imprimirHtml } from '../dimensionamento/helpers';

export const TIPOS_REGISTRO = [
  { id: 'atividade', rotulo: 'Atividade executada', tom: 'blue' },
  { id: 'ocorrencia', rotulo: 'Ocorrência / problema', tom: 'rose' },
  { id: 'pendencia', rotulo: 'Pendência / solicitação', tom: 'amber' },
  { id: 'visita', rotulo: 'Visita técnica', tom: 'purple' }
];

export const tipoDe = (r) => TIPOS_REGISTRO.find((t) => t.id === r.tipo) ?? TIPOS_REGISTRO[0];

// Limites: tudo é guardado dentro do documento do banco (máx. 1 MiB), então mídia pesada não cabe.
export const LIMITES = {
  fotos: 6,
  audios: 2,
  videos: 1,
  bytesAudio: 350 * 1024,
  bytesVideo: 700 * 1024,
  bytesRegistro: 900 * 1024
};

export const hojeIso = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** Dia do registro (yyyy-mm-dd), mesmo para registros antigos que só têm a data em texto. */
export function diaDe(r) {
  if (r.dataRegistro) return r.dataRegistro;
  if (r.createdAt) {
    const d = new Date(r.createdAt);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  const m = String(r.date || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : hojeIso();
}

export function rotuloDia(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  const txt = data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

export const horaDe = (r) => {
  if (r.timestamp) return r.timestamp;
  if (!r.createdAt) return '';
  return new Date(r.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const tamanhoKB = (obj) => Math.round(JSON.stringify(obj).length / 1024);

export const arquivoParaDataUrl = (arquivo) =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    leitor.onload = () => resolve(leitor.result);
    leitor.readAsDataURL(arquivo);
  });

// ---------------------------------------------------------------------------
// Exportação (impressão / PDF) do diário
// ---------------------------------------------------------------------------
const CSS = `
  *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1f2733;margin:22px;font-size:12px;line-height:1.5}
  h1{font-size:20px;margin:0}.sub{color:#667085}.cab{border-bottom:3px solid #4f7cf0;padding-bottom:10px;margin-bottom:14px}
  h2{font-size:13px;margin:18px 0 8px;color:#2f4fa8;background:#eef3ff;padding:5px 8px;border-radius:5px}
  .reg{border:1px solid #d9dfeb;border-left:4px solid #4f7cf0;border-radius:6px;padding:9px 11px;margin:8px 0;break-inside:avoid}
  .reg.ocorrencia{border-left-color:#ec6a6a}.reg.pendencia{border-left-color:#e0a13c}.reg.visita{border-left-color:#9184ee}
  .reg h3{font-size:13px;margin:0 0 2px}.meta{color:#667085;font-size:11px}.tag{font-weight:700}
  .fotos{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.fotos img{height:110px;border:1px solid #d9dfeb;border-radius:4px}
  .rodape{margin-top:20px;font-size:10px;color:#667085;border-top:1px solid #d9dfeb;padding-top:6px}
  @media print{body{margin:10mm}h2{break-after:avoid}}
`;

export function diarioHtml(registros, { obra, periodo, autor }) {
  const porDia = new Map();
  [...registros]
    .sort((a, b) => diaDe(a).localeCompare(diaDe(b)) || horaDe(a).localeCompare(horaDe(b)))
    .forEach((r) => {
      const dia = diaDe(r);
      if (!porDia.has(dia)) porDia.set(dia, []);
      porDia.get(dia).push(r);
    });

  const corpo = [...porDia.entries()]
    .map(([dia, lista]) => {
      const itens = lista
        .map((r) => {
          const equipe = (r.nomesEnvolvidos || []).join(', ');
          return `<div class="reg ${h(r.tipo || 'atividade')}">
            <h3>${h(r.title)}</h3>
            <div class="meta"><span class="tag">${h(tipoDe(r).rotulo)}</span> · ${h(horaDe(r))} · ${h(r.authorName || '')}${r.quadroNome ? ` · Quadro ${h(r.quadroNome)}` : ''}</div>
            <p style="white-space:pre-wrap;margin:6px 0 0">${h(r.description)}</p>
            ${equipe ? `<div class="meta">Equipe: ${h(equipe)}</div>` : ''}
            ${(r.links || []).length ? `<div class="meta">Links: ${(r.links || []).map((l) => h(l)).join(' · ')}</div>` : ''}
            ${(r.images || []).length ? `<div class="fotos">${r.images.map((f) => `<img src="${f}" alt="">`).join('')}</div>` : ''}
          </div>`;
        })
        .join('');
      return `<h2>${h(rotuloDia(dia))} — ${lista.length} registro(s)</h2>${itens}`;
    })
    .join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${h(`Diário de campo — ${obra?.name ?? ''}`)}</title><style>${CSS}</style></head><body>
    <div class="cab"><h1>Diário de campo</h1>
      <div class="sub">${h(obra?.name ?? 'Obra')} · ${h(periodo)} · ${registros.length} registro(s)</div>
      <div class="sub">3D Ar Condicionado${autor ? ` · emitido por ${h(autor)}` : ''} · ${new Date().toLocaleDateString('pt-BR')}</div></div>
    ${corpo || '<p class="sub">Nenhum registro no período.</p>'}
    <p class="rodape">Registros do diário de campo do sistema de gestão de obras. Vídeos e áudios não são incluídos no documento impresso.</p>
    <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})<\/script>
  </body></html>`;
}

export const imprimirDiario = (registros, opcoes) => imprimirHtml(diarioHtml(registros, opcoes));
