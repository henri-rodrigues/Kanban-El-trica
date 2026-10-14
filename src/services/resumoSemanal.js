// Resumo semanal por obra: o que avançou, o que está parado/atrasado e o que está pendente.
// Arquivo SEM dependências: é usado no navegador (PDF em Relatórios) e copiado para
// functions/ na publicação das Cloud Functions (e-mail de domingo). Mantenha-o puro.

const DIA = 86400000;
const isoDia = (d) => new Date(d).toISOString().slice(0, 10);
const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ROTULO = { todo: 'A fazer', in_progress: 'Em andamento', on_hold: 'Em espera', completed: 'Concluído' };
const EVOL = { todo: 0, in_progress: 33, on_hold: 66, completed: 100 };

/**
 * dados: { obras, cards, pedidos, laudos }  ·  agora: data de referência (fim do período).
 * Devolve uma lista de resumos (um por obra que tenha atividade ou pendência).
 */
export function montarResumoSemanal({ obras = [], cards = [], pedidos = [], laudos = [] }, agora = new Date()) {
  const fim = new Date(agora);
  const inicio = new Date(fim.getTime() - 7 * DIA);
  const iniIso = inicio.toISOString();
  const iniDia = isoDia(inicio);
  const fimDia = isoDia(fim);
  const paradoLimite = new Date(fim.getTime() - 7 * DIA).toISOString();

  return obras.map((obra) => {
    const doObra = cards.filter((c) => c.obraId === obra.id);
    const concluidos = doObra.filter((c) => c.column === 'completed' && (c.completedAt || '') >= iniIso);
    const movidos = doObra.filter((c) => (c.movedAt || '') >= iniIso && c.column !== 'completed');
    const abertos = doObra.filter((c) => c.column !== 'completed');
    const parados = abertos.filter((c) => {
      const ref = c.movedAt || (c.createdAt ? new Date(c.createdAt).toISOString() : '');
      return ref && ref < paradoLimite;
    });
    const altas = abertos.filter((c) => c.priority === 'Alta' || c.priority === 'Crítica');
    const horas = doObra.reduce(
      (s, c) => s + (c.workedDays || []).filter((w) => w.date >= iniDia && w.date <= fimDia).reduce((h, w) => h + (Number(w.hours) || 0), 0),
      0
    );
    const progresso = doObra.length ? Math.round(doObra.reduce((s, c) => s + (EVOL[c.column] || 0), 0) / doObra.length) : 0;

    const pos = pedidos.filter((p) => p.obraId === obra.id);
    const itensAReceber = [];
    pos.forEach((p) => (p.items || []).forEach((i) => {
      if (i.status !== 'Já Chegou') itensAReceber.push({ fornecedor: p.fornecedor, descricao: i.description || i.name || 'Item', valor: Number(i.totalPrice) || 0 });
    }));
    const laudosNC = laudos.filter((l) => l.obraId === obra.id && (l.estatisticas?.naoConformes || 0) > 0);
    const proximaSemana = isoDia(new Date(fim.getTime() + 7 * DIA));
    const viagens = (obra.scheduledTrips || []).filter((t) => t.endDate >= fimDia && t.startDate <= proximaSemana);

    return {
      obra: { id: obra.id, nome: obra.name, cliente: obra.client || '' },
      periodo: { inicio: iniDia, fim: fimDia },
      progresso,
      horas,
      concluidos: concluidos.map((c) => c.title),
      movidos: movidos.map((c) => `${c.title} → ${ROTULO[c.column] || c.column}`),
      parados: parados.map((c) => `${c.title} (${ROTULO[c.column] || c.column})`),
      altas: altas.map((c) => c.title),
      itensAReceber,
      valorAReceber: itensAReceber.reduce((s, i) => s + i.valor, 0),
      laudosNC: laudosNC.map((l) => `Nº ${l.numero} · ${l.quadroNome} (${l.estatisticas.naoConformes} não conf.)`),
      viagens: viagens.map((t) => `${t.startDate.split('-').reverse().join('/')} a ${t.endDate.split('-').reverse().join('/')} · ${(t.userNames || []).join(', ')}`)
    };
  }).filter((r) =>
    r.concluidos.length || r.movidos.length || r.parados.length || r.altas.length || r.itensAReceber.length || r.laudosNC.length || r.horas || r.viagens.length
  );
}

const lista = (itens, vazio, max = 12) =>
  itens.length
    ? `<ul>${itens.slice(0, max).map((i) => `<li>${esc(i)}</li>`).join('')}${itens.length > max ? `<li><em>+ ${itens.length - max} outros</em></li>` : ''}</ul>`
    : `<p class="vazio">${vazio}</p>`;

/** HTML do resumo (serve para o e-mail e para o PDF). */
export function resumoHtml(resumos, { appUrl = '', titulo = 'Resumo semanal das obras', paraImpressao = false } = {}) {
  const corpo = resumos.length
    ? resumos.map((r) => `
      <div class="obra">
        <h2>${esc(r.obra.nome)}${r.obra.cliente ? ` <small>· ${esc(r.obra.cliente)}</small>` : ''}</h2>
        <table class="nums"><tr>
          <td><b>${r.progresso}%</b><span>avanço</span></td>
          <td><b>${r.concluidos.length}</b><span>concluídas na semana</span></td>
          <td><b>${r.horas}h</b><span>apontadas</span></td>
          <td><b>${r.parados.length}</b><span>paradas há +7 dias</span></td>
          <td><b>${r.itensAReceber.length}</b><span>itens a receber</span></td>
        </tr></table>
        <h3>✅ Avançou</h3>${lista([...r.concluidos.map((t) => `Concluído: ${t}`), ...r.movidos], 'Nenhuma movimentação registrada.')}
        <h3>⏰ Parado / atrasado</h3>${lista(r.parados, 'Nada parado há mais de 7 dias.')}
        <h3>📌 Pendente</h3>${lista([
          ...r.altas.map((t) => `Prioridade alta: ${t}`),
          ...(r.itensAReceber.length ? [`${r.itensAReceber.length} item(ns) de material a receber (${brl(r.valorAReceber)})`] : []),
          ...r.laudosNC.map((t) => `Checklist com não conformidade: ${t}`)
        ], 'Sem pendências.')}
        ${r.viagens.length ? `<h3>🚗 Viagens nos próximos dias</h3>${lista(r.viagens, '')}` : ''}
      </div>`).join('')
    : '<p>Nenhuma movimentação ou pendência nas obras nesta semana.</p>';

  const periodo = resumos[0] ? `${resumos[0].periodo.inicio.split('-').reverse().join('/')} a ${resumos[0].periodo.fim.split('-').reverse().join('/')}` : '';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1f2733;margin:20px;font-size:13px;line-height:1.5}
    h1{font-size:20px;margin:0}.sub{color:#667085;margin-bottom:14px}
    .obra{border:1px solid #d9dfeb;border-radius:8px;padding:12px 14px;margin:12px 0;page-break-inside:avoid}
    h2{font-size:16px;margin:0 0 8px;color:#2f4fa8}h2 small{color:#667085;font-weight:400}
    h3{font-size:13px;margin:10px 0 2px}ul{margin:2px 0 0 18px;padding:0}.vazio{color:#98a2b3;margin:2px 0}
    .nums{width:100%;border-collapse:collapse}.nums td{text-align:center;border:1px solid #e3e7f0;padding:6px}
    .nums b{display:block;font-size:17px}.nums span{font-size:10px;color:#667085;text-transform:uppercase}
    a.btn{display:inline-block;background:#4f7cf0;color:#fff;text-decoration:none;padding:8px 14px;border-radius:6px;margin-top:8px}
  </style></head><body>
    <h1>${esc(titulo)}</h1><div class="sub">Período: ${periodo} · 3D Ar Condicionado</div>
    ${corpo}
    ${appUrl ? `<a class="btn" href="${esc(appUrl)}">Abrir o sistema</a>` : ''}
    ${paraImpressao ? "<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})<\/script>" : ''}
  </body></html>`;
}
