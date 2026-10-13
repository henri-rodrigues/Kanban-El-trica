// Pré-dimensionamento da caixa e desenho (SVG) do quadro montado.
// Distribui os componentes em trilhos DIN separados por canaletas, na ordem
// usada nos projetos de referência: entrada → proteções → manobra →
// acionamentos → controle → bornes.
import { CAIXAS } from "./catalogo.js";

const ZONAS = ["entrada", "protecao", "manobra", "drives", "controle", "bornes"];
const CORES = {
  entrada: "#c2410c", protecao: "#1d4ed8", manobra: "#0f766e", drives: "#6d28d9",
  controle: "#be185d", bornes: "#52525b", porta: "#334155"
};
const FOLGA = 3;      // entre componentes no trilho
const MARGEM = 10;    // da canaleta à borda da placa

function distribuir(itens, caixa, reserva) {
  const pequeno = caixa.a <= 600 && caixa.l <= 500;
  const duto = pequeno ? 30 : 50;
  const x0 = MARGEM + duto + 5;
  const util = caixa.placaL - 2 * x0;
  const utilEfetiva = util * (1 - reserva / 100);
  if (util <= 60) return { ok: false };

  const linhas = [];
  let atual = null;
  const nova = (zona) => { atual = { zona, itens: [], w: 0, h: 0 }; linhas.push(atual); };
  const por = (item, w) => {
    atual.itens.push({ ...item, w, x: atual.w });
    atual.w += w + FOLGA;
    atual.h = Math.max(atual.h, item.h + (item.zona === "drives" ? 100 : 20));
  };

  for (const zona of ZONAS) {
    for (const item of itens.filter((i) => i.zona === zona)) {
      const isolada = zona === "drives" || zona === "bornes";
      if (!atual || (isolada && atual.zona !== zona) || (atual.zona === "drives" && zona !== "drives")) nova(zona);
      if (item.divisivel) {
        let resta = item.n;
        while (resta > 0) {
          let cabem = Math.floor((utilEfetiva - atual.w) / item.passo);
          if (cabem < Math.min(4, resta)) { nova(zona); cabem = Math.floor(utilEfetiva / item.passo); }
          if (cabem < 1) return { ok: false };
          const n = Math.min(cabem, resta);
          por({ ...item, n, rotulo: `${item.tag} (${n})` }, n * item.passo);
          resta -= n;
        }
        continue;
      }
      if (item.w > util) return { ok: false };
      if (atual.itens.length && atual.w + item.w > utilEfetiva) nova(zona);
      por(item, item.w);
    }
  }

  let y = MARGEM + duto;
  for (const l of linhas) { l.y = y; y += l.h + duto; }
  const altura = y + MARGEM;
  return { ok: altura <= caixa.placaA, linhas, duto, x0, util, altura, pequeno };
}

function portaCabe(porta, caixa) {
  const area = porta.reduce((s, i) => s + (i.w + 30) * (i.h + 40), 0);
  return area <= (caixa.l - 80) * (caixa.a - 120) * 0.6;
}

/**
 * Escolhe a menor caixa/armário do catálogo em que todos os componentes cabem.
 * minimo: {a, l, p} — limite inferior vindo das regras do EstruturadeCriação.
 */
export function montarLayout(instancias, { linha = "auto", minimo, reserva = 20 }) {
  const placa = instancias.filter((i) => i.local === "placa");
  const porta = instancias.filter((i) => i.local === "porta");
  const profundidade = Math.max(0, ...placa.map((i) => i.d || 0));
  const candidatas = CAIXAS.filter((c) => linha === "auto" || c.linha === linha);
  const ordenadas = linha === "auto"
    ? [...candidatas.filter((c) => c.linha === "BRCE"), ...candidatas.filter((c) => c.linha === "BRK")]
    : candidatas;

  for (const caixa of ordenadas) {
    if (caixa.a < minimo.a || caixa.l < minimo.l || caixa.p < minimo.p) continue;
    if (caixa.util < profundidade + 20) continue;
    const r = distribuir(placa, caixa, reserva);
    if (r.ok && portaCabe(porta, caixa)) return { ...r, caixa, porta, profundidade, cabe: true };
  }
  // nada coube: devolve a maior opção disponível sinalizando a divisão em colunas
  const caixa = ordenadas[ordenadas.length - 1];
  const r = distribuir(placa, caixa, 0);
  return { ...r, linhas: r.linhas ?? [], duto: r.duto ?? 50, x0: r.x0 ?? 65, util: r.util ?? caixa.placaL - 130, caixa, porta, profundidade, cabe: false };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function canaleta(x, y, w, h) {
  const horizontal = w > h;
  const n = Math.floor((horizontal ? w : h) / 12);
  let rasgos = "";
  for (let i = 1; i < n; i++) {
    rasgos += horizontal
      ? `<line x1="${x + i * 12}" y1="${y + 2}" x2="${x + i * 12}" y2="${y + h - 2}"/>`
      : `<line x1="${x + 2}" y1="${y + i * 12}" x2="${x + w - 2}" y2="${y + i * 12}"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="lay-duto"/><g class="lay-rasgo">${rasgos}</g>`;
}

function vistaInterna(layout) {
  const { caixa, linhas, duto, x0 } = layout;
  const bx = (caixa.l - caixa.placaL) / 2, by = (caixa.a - caixa.placaA) / 2;
  let s = `<rect x="0" y="0" width="${caixa.l}" height="${caixa.a}" rx="6" class="lay-caixa"/>`;
  s += `<rect x="${bx}" y="${by}" width="${caixa.placaL}" height="${caixa.placaA}" class="lay-placa"/>`;
  s += `<g transform="translate(${bx},${by})">`;
  const fim = linhas.length ? linhas[linhas.length - 1].y + linhas[linhas.length - 1].h + duto : caixa.placaA - MARGEM;
  const altDutos = Math.min(fim, caixa.placaA - MARGEM) - MARGEM;
  s += canaleta(MARGEM, MARGEM, duto, altDutos) + canaleta(caixa.placaL - MARGEM - duto, MARGEM, duto, altDutos);
  const larg = caixa.placaL - 2 * (MARGEM + duto);
  s += canaleta(MARGEM + duto, MARGEM, larg, duto);
  for (const l of linhas) {
    const meio = l.y + l.h / 2;
    s += `<rect x="${x0}" y="${meio - 17.5}" width="${caixa.placaL - 2 * x0}" height="35" class="lay-trilho"/>`;
    for (const i of l.itens) {
      const y = meio - i.h / 2;
      const fonte = Math.max(6, Math.min(13, i.w / 3.2, i.h / 3));
      s += `<g><title>${esc(i.tag)} — ${esc(i.modelo)}</title>`;
      s += `<rect x="${x0 + i.x}" y="${y}" width="${i.w}" height="${i.h}" rx="2" fill="${CORES[i.zona]}" class="lay-comp"/>`;
      if (i.divisivel) {
        for (let k = 1; k < i.n; k++) s += `<line x1="${x0 + i.x + k * i.passo}" y1="${y}" x2="${x0 + i.x + k * i.passo}" y2="${y + i.h}" class="lay-div"/>`;
      }
      const vertical = i.w < 34 && i.h > i.w;
      const cx = x0 + i.x + i.w / 2, cy = meio;
      s += `<text x="${cx}" y="${cy}" font-size="${fonte}" class="lay-tag"${vertical ? ` transform="rotate(-90 ${cx} ${cy})"` : ""}>${esc(i.rotulo ?? i.tag)}</text></g>`;
    }
    s += canaleta(MARGEM + duto, l.y + l.h, larg, duto);
  }
  return s + "</g>";
}

function vistaExterna(layout) {
  const { caixa, porta } = layout;
  let s = `<rect x="0" y="0" width="${caixa.l}" height="${caixa.a}" rx="6" class="lay-porta"/>`;
  s += `<rect x="${caixa.l - 26}" y="${caixa.a / 2 - 35}" width="12" height="70" rx="3" class="lay-fecho"/>`;
  const util = caixa.l - 90;
  let x = 40, y = 50, alturaLinha = 0;
  const ordem = ["ihm", "sinal", "seletora", "pot", "geral", "vent"];
  const itens = [...porta].sort((a, b) => ordem.indexOf(a.tipoPorta) - ordem.indexOf(b.tipoPorta));
  let tipoAnterior = null;
  for (const i of itens) {
    const passoX = i.w + 34;
    if ((x + i.w > 40 + util || (tipoAnterior && tipoAnterior !== i.tipoPorta)) && x > 40) { x = 40; y += alturaLinha + 46; alturaLinha = 0; }
    tipoAnterior = i.tipoPorta;
    const cx = x + i.w / 2, cy = y + i.h / 2;
    s += `<g><title>${esc(i.tag)} — ${esc(i.modelo)}</title>`;
    if (i.tipoPorta === "ihm" || i.tipoPorta === "vent") {
      s += `<rect x="${x}" y="${y}" width="${i.w}" height="${i.h}" rx="4" class="${i.tipoPorta === "ihm" ? "lay-ihm" : "lay-grelha"}"/>`;
    } else {
      s += `<circle cx="${cx}" cy="${cy}" r="${i.w / 2}" fill="${i.cor ?? CORES.porta}" class="lay-botao"/>`;
      if (i.tipoPorta === "seletora" || i.tipoPorta === "geral") s += `<rect x="${cx - 3}" y="${cy - i.w / 2 + 2}" width="6" height="${i.w / 2}" class="lay-knob"/>`;
    }
    s += `<text x="${cx}" y="${y + i.h + 14}" font-size="${Math.max(10, caixa.a / 110)}" class="lay-leg">${esc(i.tag)}</text></g>`;
    x += passoX;
    alturaLinha = Math.max(alturaLinha, i.h);
  }
  return s;
}

/** SVG com vista interna e externa, em escala (1 unidade = 1 mm). */
export function desenharLayout(layout) {
  const { caixa } = layout;
  const fonte = Math.max(18, caixa.a / 42); // legível também nos armários altos
  const esp = fonte * 4, topo = fonte * 2.4;
  const largura = caixa.l * 2 + esp + 40, altura = caixa.a + topo + fonte * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" class="layout-svg" role="img" aria-label="Vista interna e externa do quadro ${esc(caixa.modelo)}">
  <text x="${20 + caixa.l / 2}" y="${fonte * 1.5}" font-size="${fonte}" class="lay-titulo">Vista interna</text>
  <text x="${20 + caixa.l + esp + caixa.l / 2}" y="${fonte * 1.5}" font-size="${fonte}" class="lay-titulo">Vista externa (porta)</text>
  <g transform="translate(20,${topo})">${vistaInterna(layout)}</g>
  <g transform="translate(${20 + caixa.l + esp},${topo})">${vistaExterna(layout)}</g>
  <text x="${20 + caixa.l / 2}" y="${altura - fonte * 0.5}" font-size="${fonte * 0.8}" class="lay-cota">${caixa.l} mm</text>
  <text x="${20 + caixa.l + esp / 2}" y="${topo + caixa.a / 2}" font-size="${fonte * 0.8}" class="lay-cota" dominant-baseline="central" transform="rotate(-90 ${20 + caixa.l + esp / 2} ${topo + caixa.a / 2})">${caixa.a} mm</text>
</svg>`;
}

export const LEGENDA_LAYOUT = [
  ["entrada", "Entrada, comando e fonte"], ["protecao", "Proteções dos circuitos"], ["manobra", "Contatores e relés"],
  ["drives", "Inversores / soft-starters"], ["controle", "CLP e interfaces"], ["bornes", "Bornes e barramentos"]
].map(([z, t]) => ({ cor: CORES[z], texto: t }));
