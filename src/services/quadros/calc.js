// Calculadoras avulsas (consulta rápida / validação técnica). Cada calculadora
// declara seus campos e uma função calcular(valores) que devolve
// { linhas: [[rótulo, valor, destaque?]], alertas: [texto], passos: [texto] }.
import * as N from "./normas.js";
import { correnteMotor, CV, POTENCIAS_KW } from "./motores.js";
import { disjuntorMotor, contator } from "./catalogo.js";

const f = (v, casas = 2) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: casas });
const sel = (id, rotulo, opcoes, padrao, extra = {}) => ({ id, rotulo, tipo: "sel", opcoes, padrao, ...extra });
const num = (id, rotulo, padrao, unidade = "", extra = {}) => ({ id, rotulo, tipo: "num", padrao, unidade, ...extra });

const SISTEMAS = [[3, "Trifásico"], [2, "Bifásico (fase-fase)"], [1, "Monofásico (fase-neutro)"]];
const TENSOES = [[220, "220 V"], [380, "380 V"], [440, "440 V"], [127, "127 V"]];
const ISOLACOES = [["PVC", "PVC 70 °C"], ["EPR", "EPR / XLPE 90 °C"]];
const METODOS = Object.entries(N.METODOS);
const SECOES = N.SECOES.map((s) => [s, `${f(s)} mm²`]);

// Fração e passo da memória de cálculo (HTML só com textos fixos e números).
const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
const passo = (titulo, texto, formula, subst, resultado, extra = {}) => ({ titulo, texto, formula, subst, resultado, ...extra });

// Ocupação de eletroduto: o circuito n só aparece depois que o anterior tem cabos.
const MAX_CIRCUITOS = 10;
function camposCircuito(n) {
  const visivel = (v) => { for (let k = 1; k < n; k++) if (!(Number(v[`q${k}`]) > 0)) return false; return true; };
  const usado = (v) => visivel(v) && Number(v[`q${n}`]) > 0; // circuito vazio não entra no relatório
  return [
    sel(`t${n}`, `Circuito ${n} — tipo de cabo`, [["uni", "Unipolar"], ["multi", "Multipolar"]], "uni", { se: visivel, relatorio: usado, rerender: true, quebra: true }),
    sel(`v${n}`, `Circuito ${n} — número de vias`, N.VIAS_MULTIPOLAR.map((x) => [x, `${x} vias`]), 3, { se: (v) => visivel(v) && v[`t${n}`] === "multi", relatorio: usado }),
    sel(`s${n}`, `Circuito ${n} — seção`, SECOES, 2.5, { se: visivel, relatorio: usado }),
    num(`q${n}`, `Circuito ${n} — quantidade de cabos`, n === 1 ? 3 : 0, "", { se: visivel, relatorio: usado, rerender: true, passo: 1 })
  ];
}

export const CALCULADORAS = [
  {
    id: "cabo", nome: "Seção de cabo", norma: `${N.REFERENCIAS.ampacidade}; ${N.REFERENCIAS.queda}`,
    descricao: "Capacidade de condução, queda de tensão, seção mínima e coordenação com a proteção.",
    campos: [
      sel("modo", "Dado de entrada", [["corrente", "Corrente de operação"], ["potencia", "Potência (rede trifásica)"]], "corrente", { rerender: true }),
      num("corrente", "Corrente de operação (IB)", 25, "A", { se: (v) => v.modo !== "potencia" }),
      num("potencia", "Potência da carga", 15, "", { se: (v) => v.modo === "potencia" }),
      sel("unidadePot", "Unidade", [["kW", "kW"], ["cv", "cv"]], "kW", { se: (v) => v.modo === "potencia" }),
      num("rend", "Rendimento (η)", 0.9, "", { passo: 0.01, se: (v) => v.modo === "potencia" }),
      sel("tensao", "Tensão", TENSOES, 380), sel("fases", "Sistema", SISTEMAS, 3, { se: (v) => v.modo !== "potencia" }),
      num("comprimento", "Comprimento do circuito", 50, "m"), num("cosfi", "Fator de potência", 0.85, "", { passo: 0.01 }),
      sel("isolacao", "Isolação", ISOLACOES, "PVC"), sel("metodo", "Método de instalação", METODOS, "B1", { largo: true }),
      num("tempAmbiente", "Temperatura ambiente", 30, "°C"), num("agrupamento", "Circuitos agrupados", 1, "circ."),
      sel("quedaMax", "Queda de tensão máxima", N.LIMITES_QUEDA.map((l) => [l.valor, l.rotulo]), 4, { largo: true }),
      num("protecao", "Disjuntor previsto (0 = não verificar)", 0, "A")
    ],
    calcular(v) {
      const porPotencia = v.modo === "potencia";
      const fases = porPotencia || v.fases === 3 ? 3 : 2;
      const kW = v.unidadePot === "cv" ? v.potencia * CV : v.potencia;
      const corrente = porPotencia ? (kW * 1000) / (Math.sqrt(3) * v.tensao * v.cosfi * v.rend) : v.corrente;
      if (!(corrente > 0) || !Number.isFinite(corrente)) return { linhas: [], alertas: ["Informe a corrente ou a potência, a tensão, o fator de potência e o rendimento com valores maiores que zero."], passos: [] };
      const r = N.dimensionarCabo({ ...v, corrente, fases });
      const alertas = [];
      if (r.excede) alertas.push("Nenhuma seção até 300 mm² atende: utilize condutores em paralelo ou reveja o método de instalação.");
      if (v.protecao > 0 && v.protecao < corrente) alertas.push("O disjuntor previsto é menor que a corrente de projeto (IB ≤ In não atendido).");

      // ---- memória de cálculo visual (HTML só com textos fixos e números) ----
      const k = fases === 3 ? "√3" : "2";
      const kNum = fases === 3 ? Math.sqrt(3) : 2;
      const sen = Math.sqrt(Math.max(0, 1 - v.cosfi ** 2));
      const R = N.resistencia(r.secao, v.isolacao), X = N.reatancia(r.secao);
      const tab = N.AMPACIDADE[v.isolacao][v.metodo][r.nCond];
      const iAdot = N.SECOES.indexOf(r.secao);
      const linhasTab = N.SECOES.slice(0, Math.min(N.SECOES.length, iAdot + 3)).map((s, i) => {
        const iz = tab[i] * r.k1 * r.k2;
        const q = v.comprimento > 0 ? (N.quedaTensao({ corrente, comprimento: v.comprimento, secao: s, cosfi: v.cosfi, fases, isolacao: v.isolacao }) / v.tensao) * 100 : 0;
        const uso = (corrente / iz) * 100;
        const okI = iz >= corrente && (!(v.protecao > 0) || iz >= v.protecao), okQ = q <= v.quedaMax, okMin = s >= r.secaoMinima;
        return `<tr class="${s === r.secao ? "adotada" : ""}"><td><strong>${f(s)} mm²</strong></td><td class="num">${f(tab[i], 1)} A</td><td class="num">${f(iz, 1)} A</td>
          <td><span class="barra-uso"><i class="${uso <= 100 ? "ok" : "nok"}" style="width:${Math.min(100, uso).toFixed(0)}%"></i></span> <small>${f(uso, 0)}%</small></td>
          <td class="num ${okQ ? "" : "txt-nok"}">${f(q)} %</td>
          <td>${okI && okQ && okMin ? `<span class="chip ok">atende</span>` : `<span class="chip nok">${!okI ? "corrente" : !okQ ? "queda" : "mínima"}</span>`}</td></tr>`;
      }).join("");
      const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
      const memoria = [];
      if (porPotencia) memoria.push({
        titulo: "Corrente de projeto a partir da potência",
        texto: "Em rede trifásica, a corrente de linha é a potência ativa dividida pela tensão de linha, pelo fator de potência e pelo rendimento da carga.",
        formula: `I<sub>B</sub> = ${frac("P", "√3 · V · cosφ · η")}`,
        subst: `I<sub>B</sub> = ${frac(`${f(kW * 1000, 0)} W`, `1,732 × ${v.tensao} V × ${f(v.cosfi)} × ${f(v.rend)}`)}`,
        resultado: `${f(corrente)} A`, ref: v.unidadePot === "cv" ? `Conversão: ${f(v.potencia)} cv × 0,7355 = ${f(kW)} kW` : ""
      });
      memoria.push({
        titulo: "Fatores de correção",
        texto: `A capacidade tabelada vale para 30 °C${v.metodo === "D" ? " no ar e 20 °C no solo" : ""} e um único circuito. Temperatura maior e circuitos agrupados reduzem a corrente que o cabo suporta.`,
        formula: `k<sub>1</sub> = f(temperatura, isolação) &nbsp;·&nbsp; k<sub>2</sub> = f(nº de circuitos, método)`,
        subst: `k<sub>1</sub> = ${f(r.k1)} <small>(${f(v.tempAmbiente)} °C, ${v.isolacao})</small> &nbsp;·&nbsp; k<sub>2</sub> = ${f(r.k2)} <small>(${f(v.agrupamento, 0)} circuito${v.agrupamento > 1 ? "s" : ""}, método ${v.metodo})</small>`,
        resultado: `k = ${f(r.k1 * r.k2, 3)}`, ref: `${N.REFERENCIAS.temperatura}; ${N.REFERENCIAS.agrupamento}`
      });
      memoria.push({
        titulo: "Capacidade de condução de corrente",
        texto: `A corrente admissível corrigida (I<sub>Z</sub>′) precisa ser maior ou igual à corrente de projeto. Tabela para ${r.nCond} condutores carregados, método ${v.metodo}, isolação ${v.isolacao}.`,
        formula: `I<sub>Z</sub>′ = I<sub>Z</sub> · k<sub>1</sub> · k<sub>2</sub> ≥ I<sub>B</sub>`,
        subst: `I<sub>Z</sub>′ = ${f(r.izTabela, 1)} × ${f(r.k1)} × ${f(r.k2)} = ${f(r.iz, 1)} A ${r.iz >= corrente ? "≥" : "&lt;"} ${f(corrente)} A`,
        resultado: r.porAmpacidade ? `mínimo ${f(r.porAmpacidade)} mm²` : "acima de 300 mm²", ok: r.iz >= corrente, ref: N.REFERENCIAS.ampacidade
      });
      if (v.comprimento > 0) memoria.push({
        titulo: "Queda de tensão",
        texto: `A queda no trecho depende da corrente, do comprimento e da impedância do cabo (resistência a ${N.TEMP_SERVICO[v.isolacao]} °C e reatância). O limite escolhido é ${f(v.quedaMax)} %.`,
        formula: `ΔV = ${k} · I · L · (R·cosφ + X·senφ) &nbsp;&nbsp;&nbsp; ΔV% = ${frac("ΔV", "V")} · 100`,
        subst: `ΔV = ${f(kNum, 3)} × ${f(corrente)} A × ${f(v.comprimento / 1000, 3)} km × (${f(R, 3)} × ${f(v.cosfi)} + ${f(X, 3)} × ${f(sen, 3)}) = ${f(r.quedaV, 2)} V<br>ΔV% = ${frac(`${f(r.quedaV, 2)} V`, `${v.tensao} V`)} · 100 = ${f(r.quedaPct)} %`,
        resultado: r.porQueda ? `mínimo ${f(r.porQueda)} mm²` : "acima de 300 mm²", ok: r.quedaPct <= v.quedaMax,
        ref: `${N.REFERENCIAS.queda} · R = ${f(R, 3)} Ω/km e X = ${f(X, 3)} Ω/km para ${f(r.secao)} mm²`
      });
      if (v.protecao > 0) memoria.push({
        titulo: "Coordenação com a proteção",
        texto: "O disjuntor deve estar entre a corrente de projeto e a capacidade do cabo, para proteger o condutor contra sobrecarga.",
        formula: `I<sub>B</sub> ≤ I<sub>n</sub> ≤ I<sub>Z</sub>′`,
        subst: `${f(corrente)} A ≤ ${f(v.protecao)} A ≤ ${f(r.iz, 1)} A`,
        resultado: r.porProtecao ? `mínimo ${f(r.porProtecao)} mm²` : "acima de 300 mm²", ok: corrente <= v.protecao && v.protecao <= r.iz, ref: N.REFERENCIAS.sobrecarga
      });
      memoria.push({
        titulo: "Comparação das seções", texto: "Cada seção é testada nos critérios acima; a adotada é a menor que atende a todos. A barra mostra quanto da capacidade corrigida a corrente de projeto ocupa.",
        tabela: `<table class="comparacao"><thead><tr><th>Seção</th><th class="num">I<sub>Z</sub> tabela</th><th class="num">I<sub>Z</sub>′ corrigida</th><th>Carregamento</th><th class="num">Queda</th><th>Situação</th></tr></thead><tbody>${linhasTab}</tbody></table>`
      });
      memoria.push({
        titulo: "Seção adotada e condutores complementares",
        texto: "Adota-se a maior seção entre os critérios. O condutor de proteção segue a seção das fases até 16 mm², fica em 16 mm² até 35 mm² e passa à metade acima disso.",
        formula: `S = máx( S<sub>corrente</sub> ; S<sub>queda</sub> ; S<sub>proteção</sub> ; S<sub>mínima</sub> )`,
        subst: `S = máx( ${[r.porAmpacidade, v.comprimento > 0 ? r.porQueda : null, v.protecao > 0 ? r.porProtecao : null, r.secaoMinima].filter((x) => x != null).map((x) => f(x)).join(" ; ")} ) mm²`,
        resultado: `${f(r.secao)} mm² · PE ${f(r.pe)} mm²`, ok: !r.excede, ref: `${N.REFERENCIAS.secaoMinima}; ${N.REFERENCIAS.pe}`
      });

      return {
        linhas: [
          ["Seção adotada (fases)", `${f(r.secao)} mm²`, true], ["Critério determinante", r.criterio],
          ["Corrente de projeto (IB)", `${f(corrente)} A${porPotencia ? ` — calculada de ${f(kW)} kW, trifásico` : ""}`],
          ["Por capacidade de condução", r.porAmpacidade ? `${f(r.porAmpacidade)} mm²` : "acima de 300 mm²"],
          ["Por queda de tensão", r.porQueda ? `${f(r.porQueda)} mm²` : "acima de 300 mm²"],
          ["Seção mínima (força)", `${f(r.secaoMinima)} mm²`],
          ["Capacidade tabelada (Iz)", `${f(r.izTabela, 1)} A`], ["Fator de temperatura k1", f(r.k1)], ["Fator de agrupamento k2", f(r.k2)],
          ["Capacidade corrigida (Iz')", `${f(r.iz, 1)} A`], ["Queda de tensão", `${f(r.quedaPct)} % (${f(r.quedaV, 1)} V)`],
          ["Condutor de proteção (PE)", `${f(r.pe)} mm²`], ["Neutro (sem harmônicas)", `${f(r.neutro)} mm²`]
        ],
        alertas, passos: [], memoria
      };
    }
  },
  {
    id: "eletroduto", nome: "Ocupação de eletroduto", norma: N.REFERENCIAS.eletroduto,
    descricao: "Até 10 circuitos no mesmo eletroduto. Preencha a quantidade de cabos de um circuito para liberar o seguinte. Em cabo unipolar, a quantidade é o número de condutores do circuito (fases + neutro + terra); em multipolar, o número de cabos.",
    campos: [
      ...Array.from({ length: MAX_CIRCUITOS }, (_, i) => camposCircuito(i + 1)).flat(),
      sel("classe", "Cabos unipolares — classe de isolação", Object.keys(N.DIAMETRO_CABO).map((k) => [k, k]), Object.keys(N.DIAMETRO_CABO)[0], { largo: true, quebra: true }),
      sel("eletroduto", "Tipo de eletroduto", Object.entries(N.ELETRODUTOS).map(([k, e]) => [k, e.nome]), "pesado", { largo: true })
    ],
    calcular(v) {
      const diamUni = N.DIAMETRO_CABO[v.classe];
      const circuitos = [];
      for (let n = 1; n <= MAX_CIRCUITOS; n++) {
        const qtd = Math.round(v[`q${n}`]);
        if (!(qtd > 0)) break;
        const multi = v[`t${n}`] === "multi", secao = v[`s${n}`], vias = v[`v${n}`];
        const d = multi ? N.diametroMultipolar(vias, secao) : diamUni[N.SECOES.indexOf(secao)];
        circuitos.push({ n, multi, vias, secao, qtd, d, area: (Math.PI * d * d) / 4 });
      }
      if (!circuitos.length) return { linhas: [], alertas: ["Informe a quantidade de cabos do circuito 1."], passos: [] };
      const total = circuitos.reduce((s, c) => s + c.qtd, 0);
      const area = circuitos.reduce((s, c) => s + c.qtd * c.area, 0);
      const limite = N.taxaOcupacaoMax(total);
      const tipo = N.ELETRODUTOS[v.eletroduto];
      const tamanhos = tipo.tamanhos.map(([nome, de, e]) => { const di = de - 2 * e; const ai = (Math.PI * di * di) / 4; return { nome, de, e, di, ai, taxa: (area / ai) * 100 }; });
      const ok = tamanhos.find((t) => t.taxa <= limite);
      const areaMin = area / (limite / 100), dMin = Math.sqrt((4 * areaMin) / Math.PI);
      const descr = (c) => (c.multi ? `Multipolar ${c.vias} × ${f(c.secao)} mm²` : `Unipolar ${f(c.secao)} mm²`);

      const memoria = [
        {
          titulo: "Área de cada cabo",
          texto: "A ocupação é calculada pela área da seção transversal externa de cada cabo (condutor + isolação + cobertura). Nos cabos multipolares o diâmetro externo é estimado a partir do diâmetro das veias e da cobertura.",
          formula: `A<sub>cabo</sub> = ${frac("π · d²", "4")}`,
          tabela: `<table class="comparacao"><thead><tr><th>Circuito</th><th>Cabo</th><th class="num">Ø externo</th><th class="num">Área unitária</th><th class="num">Qtd</th><th class="num">Área do circuito</th></tr></thead><tbody>${circuitos.map((c) => `<tr><td><strong>${c.n}</strong></td><td>${descr(c)}</td><td class="num">${f(c.d, 1)} mm</td><td class="num">${f(c.area, 1)} mm²</td><td class="num">${c.qtd}</td><td class="num">${f(c.qtd * c.area, 1)} mm²</td></tr>`).join("")}</tbody></table>`,
          ref: "Diâmetros típicos de catálogo — confirmar com o fabricante do cabo"
        },
        {
          titulo: "Área total ocupada", texto: "Soma das áreas de todos os cabos que passam pelo eletroduto.",
          formula: `A<sub>total</sub> = Σ ( n · A<sub>cabo</sub> )`,
          subst: `A<sub>total</sub> = ${circuitos.map((c) => `${c.qtd} × ${f(c.area, 1)}`).join(" + ")}`,
          resultado: `${f(area, 1)} mm² em ${total} cabo${total > 1 ? "s" : ""}`
        },
        {
          titulo: "Taxa máxima de ocupação",
          texto: "A norma limita a parcela da área interna que os cabos podem ocupar, para permitir a enfiação e a dissipação de calor: 53% com um cabo, 31% com dois e 40% com três ou mais.",
          formula: `1 cabo → 53 % &nbsp;·&nbsp; 2 cabos → 31 % &nbsp;·&nbsp; 3 ou mais → 40 %`,
          subst: `${total} cabo${total > 1 ? "s" : ""} no eletroduto`, resultado: `${limite} %`, ref: N.REFERENCIAS.eletroduto
        },
        {
          titulo: "Área e diâmetro interno mínimos",
          texto: "Dividindo a área dos cabos pela taxa máxima obtém-se a menor área interna que o eletroduto pode ter, e dela o diâmetro interno mínimo.",
          formula: `A<sub>mín</sub> = ${frac("A<sub>total</sub>", "taxa")} &nbsp;&nbsp;&nbsp; D<sub>mín</sub> = √( ${frac("4 · A<sub>mín</sub>", "π")} )`,
          subst: `A<sub>mín</sub> = ${frac(`${f(area, 1)} mm²`, f(limite / 100))} = ${f(areaMin, 1)} mm² &nbsp;&nbsp;&nbsp; D<sub>mín</sub> = √( ${frac(`4 × ${f(areaMin, 1)}`, "3,1416")} )`,
          resultado: `Ø interno ≥ ${f(dMin, 1)} mm`
        },
        {
          titulo: `Comparação dos tamanhos — ${tipo.nome}`,
          texto: "Cada bitola comercial é testada; adota-se a menor cuja ocupação fica dentro do limite. O diâmetro interno é o externo menos duas vezes a espessura da parede.",
          formula: `Ocupação = ${frac("A<sub>total</sub>", "π · D<sub>i</sub>² / 4")} · 100`,
          tabela: `<table class="comparacao"><thead><tr><th>Tamanho</th><th class="num">Ø ext.</th><th class="num">Parede</th><th class="num">Ø int.</th><th class="num">Área interna</th><th>Ocupação</th><th>Situação</th></tr></thead><tbody>${tamanhos.map((t) => `<tr class="${t === ok ? "adotada" : ""}"><td><strong>${t.nome}</strong></td><td class="num">${f(t.de, 1)} mm</td><td class="num">${f(t.e)} mm</td><td class="num">${f(t.di, 1)} mm</td><td class="num">${f(t.ai, 0)} mm²</td><td><span class="barra-uso"><i class="${t.taxa <= limite ? "ok" : "nok"}" style="width:${Math.min(100, (t.taxa / limite) * 100).toFixed(0)}%"></i></span> <small>${f(t.taxa, 1)}%</small></td><td><span class="chip ${t.taxa <= limite ? "ok" : "nok"}">${t.taxa <= limite ? "atende" : "excede"}</span></td></tr>`).join("")}</tbody></table>`,
          ref: tipo.ref
        },
        {
          titulo: "Eletroduto adotado", texto: "Menor tamanho comercial que respeita a taxa máxima de ocupação.",
          formula: `Ocupação ≤ ${limite} %`,
          subst: ok ? `${frac(`${f(area, 1)} mm²`, `${f(ok.ai, 0)} mm²`)} · 100 = ${f(ok.taxa, 1)} % ≤ ${limite} %` : `Nenhum tamanho até 4" atende`,
          resultado: ok ? `${ok.nome} — Ø interno ${f(ok.di, 1)} mm` : "dividir os circuitos em mais eletrodutos", ok: Boolean(ok)
        }
      ];
      return {
        linhas: [
          ["Eletroduto mínimo", ok ? `${ok.nome} (Ø int. ${f(ok.di, 1)} mm)` : "acima de 4\" — dividir em mais eletrodutos", true],
          ["Tipo de eletroduto", tipo.nome], ["Ocupação no eletroduto adotado", ok ? `${f(ok.taxa, 1)} %` : "—"],
          ["Taxa máxima permitida", `${limite} % (${total} cabo${total > 1 ? "s" : ""})`], ["Circuitos considerados", String(circuitos.length)],
          ["Área total dos cabos", `${f(area, 1)} mm²`], ["Diâmetro interno mínimo", `${f(dMin, 1)} mm`],
          ...circuitos.map((c) => [`Circuito ${c.n}`, `${c.qtd} × ${descr(c)} — Ø ${f(c.d, 1)} mm`])
        ],
        alertas: [
          "Diâmetros de cabos e de eletrodutos são valores típicos; confirme com os catálogos dos fabricantes antes da compra.",
          "Trechos contínuos sem caixa de passagem: no máximo 15 m, reduzidos em 3 m para cada curva de 90° (NBR 5410 6.2.11.1.6).",
          ...(circuitos.length > 1 ? [`Com ${circuitos.length} circuitos no mesmo eletroduto, aplique o fator de agrupamento na capacidade de condução dos cabos (calculadora Seção de cabo).`] : [])
        ],
        passos: [], memoria
      };
    }
  },
  {
    id: "motor", nome: "Corrente de motor trifásico", norma: `${N.REFERENCIAS.motores}; tabela WEG W22 IR3 Premium, 4 polos`,
    descricao: "Corrente nominal tabelada, corrente de partida e sugestão de proteção e manobra.",
    campos: [
      num("potencia", "Potência", 5, ""), sel("unidade", "Unidade", [["cv", "cv"], ["kW", "kW"]], "cv"), sel("tensao", "Tensão", TENSOES.slice(0, 3), 380),
      num("fs", "Fator de serviço", 1.15, "", { passo: 0.05 }),
      sel("partida", "Tipo de partida", [["direta", "Partida direta"], ["estrela", "Estrela-triângulo"], ["soft", "Soft-starter"], ["inversor", "Inversor de frequência"]], "direta")
    ],
    calcular(v) {
      const kW = v.unidade === "cv" ? v.potencia * CV : v.potencia;
      if (!(kW > 0)) return { linhas: [], alertas: ["Informe a potência do motor."], passos: [] };
      const m = correnteMotor(kW, v.tensao);
      const in220 = (m.corrente * v.tensao) / 220;
      const ipDireta = m.corrente * m.ipIn;
      const ip = { direta: ipDireta, estrela: ipDireta / 3, soft: m.corrente * 3, inversor: m.corrente * 1.5 }[v.partida];
      const iManobra = v.partida === "estrela" ? m.corrente * 0.58 : m.corrente;
      const dm = disjuntorMotor(m.corrente), k = contator(iManobra);
      const cabo = N.dimensionarCabo({ corrente: m.corrente * v.fs, tensao: v.tensao });
      const padrao = POTENCIAS_KW.some((p) => Math.abs(p - kW) / p < 0.03);
      const porFormula = m.fonte.startsWith("fórmula");
      const partidaTxt = {
        direta: ["O motor recebe tensão plena e absorve várias vezes a corrente nominal até acelerar.", `I<sub>p</sub> = I<sub>n</sub> · (I<sub>p</sub>/I<sub>n</sub>)`, `I<sub>p</sub> = ${f(m.corrente)} × ${f(m.ipIn, 1)}`],
        estrela: ["Na ligação estrela cada enrolamento recebe V/√3; a corrente de linha cai para um terço da partida direta (e o conjugado também).", `I<sub>p,Y</sub> = ${frac("I<sub>p,direta</sub>", "3")}`, `I<sub>p,Y</sub> = ${frac(`${f(ipDireta, 0)} A`, "3")}`],
        soft: ["A soft-starter limita a corrente por rampa de tensão; o ajuste típico de limitação é de 3 × In.", `I<sub>p</sub> ≈ 3 · I<sub>n</sub>`, `I<sub>p</sub> ≈ 3 × ${f(m.corrente)}`],
        inversor: ["O inversor acelera o motor em rampa de frequência; a corrente fica limitada à sobrecarga do inversor, em torno de 1,5 × In.", `I<sub>p</sub> ≤ 1,5 · I<sub>n</sub>`, `I<sub>p</sub> ≤ 1,5 × ${f(m.corrente)}`]
      }[v.partida];
      const memoria = [];
      if (v.unidade === "cv") memoria.push(passo("Conversão da potência", "A potência mecânica no eixo em cv é convertida para kW.", `P<sub>kW</sub> = P<sub>cv</sub> · 0,7355`, `P<sub>kW</sub> = ${f(v.potencia)} × 0,7355`, `${f(kW)} kW`));
      memoria.push(porFormula
        ? passo("Corrente nominal", "Potência fora da faixa tabelada: a corrente é estimada pela potência absorvida da rede, com cosφ = 0,85 e η = 0,86.", `I<sub>n</sub> = ${frac("P", "√3 · V · cosφ · η")}`, `I<sub>n</sub> = ${frac(`${f(kW * 1000, 0)} W`, `1,732 × ${v.tensao} × 0,85 × 0,86`)}`, `${f(m.corrente)} A`, { ref: m.fonte })
        : passo("Corrente nominal", "A corrente vem da tabela de motores (valores em 220 V) e é convertida para a tensão da rede: para a mesma potência, a corrente é inversamente proporcional à tensão.", `I<sub>n</sub>(V) = I<sub>n</sub>(220 V) · ${frac("220", "V")}`, `I<sub>n</sub> = ${f(in220)} A × ${frac("220", String(v.tensao))}`, `${f(m.corrente)} A`, { ref: `Origem: ${m.fonte}` }));
      memoria.push(passo("Corrente com fator de serviço", "Os condutores do circuito do motor devem suportar a corrente nominal multiplicada pelo fator de serviço, que é a sobrecarga contínua admitida pelo motor.", `I<sub>B</sub> = I<sub>n</sub> · FS`, `I<sub>B</sub> = ${f(m.corrente)} × ${f(v.fs)}`, `${f(m.corrente * v.fs)} A`, { ref: N.REFERENCIAS.motores }));
      memoria.push(passo("Corrente de partida", partidaTxt[0], partidaTxt[1], partidaTxt[2], `${f(ip, 0)} A`));
      memoria.push(passo("Proteção e manobra", `O disjuntor-motor é escolhido pela faixa de ajuste que contém a corrente nominal; o contator, pela corrente de emprego em AC-3${v.partida === "estrela" ? " (na estrela-triângulo, K1 e K2 conduzem 0,58 · In)" : ""}.`,
        `I<sub>ajuste,mín</sub> ≤ I<sub>n</sub> ≤ I<sub>ajuste,máx</sub> &nbsp;&nbsp;&nbsp; I<sub>e</sub>(AC-3) ≥ ${v.partida === "estrela" ? "0,58 · " : ""}I<sub>n</sub>`,
        `${dm ? `${f(dm.min)} A ≤ ${f(m.corrente)} A ≤ ${f(dm.max)} A` : `${f(m.corrente)} A acima de 100 A`} &nbsp;&nbsp;&nbsp; ${k ? `${k.ie} A ≥ ${f(iManobra)} A` : "—"}`,
        `${dm ? dm.modelo : "caixa moldada + relé"} · ${k ? `contator ${k.ie} A` : "—"}`, { ok: Boolean(dm && k), ref: "Catálogos WEG MPW e CWB" }));
      memoria.push(passo("Cabo mínimo por capacidade de condução", "Menor seção cuja capacidade (método B1, PVC 70 °C, 30 °C, 3 condutores carregados) é maior ou igual à corrente com fator de serviço. A queda de tensão deve ser verificada na calculadora Seção de cabo.", `I<sub>Z</sub> ≥ I<sub>B</sub>`, `${f(cabo.izTabela, 1)} A ≥ ${f(m.corrente * v.fs)} A`, `${f(cabo.secao)} mm²`, { ok: !cabo.excede, ref: N.REFERENCIAS.ampacidade }));
      return {
        linhas: [
          ["Corrente nominal (In)", `${f(m.corrente)} A`, true], ["Potência", `${f(kW)} kW / ${f(kW / CV, 1)} cv`], ["Origem do valor", m.fonte],
          ["Corrente com fator de serviço", `${f(m.corrente * v.fs)} A`],
          ["Corrente de partida estimada", `${f(ip, 0)} A (${{ direta: `${f(m.ipIn, 1)} × In`, estrela: "Ip direta ÷ 3", soft: "limitada em 3 × In", inversor: "até 1,5 × In" }[v.partida]})`],
          ["Disjuntor-motor sugerido", dm ? `${dm.modelo} (${dm.faixa})` : "Caixa moldada + relé de sobrecarga"],
          ["Contator sugerido (AC-3)", k ? `${k.modelo.replace(/[A-Z]\d\d$/, "")} — ${k.ie} A${v.partida === "estrela" ? " (K1/K2)" : ""}` : "—"],
          ["Cabo mínimo (B1, PVC, 30 °C)", `${f(cabo.secao)} mm² — sem considerar queda de tensão`]
        ],
        alertas: padrao ? [] : ["Potência não padronizada: corrente obtida por interpolação ou fórmula. Prefira a corrente de placa do motor."],
        passos: [], memoria
      };
    }
  },
  {
    id: "corrente", nome: "Corrente elétrica (tri / mono)", norma: "I = P / (k · V · cosφ · η)",
    descricao: "Corrente a partir da potência ativa ou aparente, para sistemas trifásicos, bifásicos e monofásicos.",
    campos: [
      num("potencia", "Potência", 15, ""), sel("unidade", "Unidade", [["kW", "kW"], ["kVA", "kVA"], ["cv", "cv"]], "kW"),
      sel("tensao", "Tensão", TENSOES, 380), sel("fases", "Sistema", SISTEMAS, 3),
      num("cosfi", "Fator de potência (cosφ)", 0.85, "", { passo: 0.01 }), num("rend", "Rendimento (η)", 1, "", { passo: 0.01 })
    ],
    calcular(v) {
      if (!(v.potencia > 0 && v.cosfi > 0 && v.cosfi <= 1 && v.rend > 0)) return { linhas: [], alertas: ["Informe potência, fator de potência (até 1) e rendimento maiores que zero."], passos: [] };
      const tri = v.fases === 3;
      const k = tri ? Math.sqrt(3) : 1;
      const kW = v.unidade === "cv" ? v.potencia * CV : v.potencia;
      const kVA = v.unidade === "kVA" ? v.potencia : kW / (v.cosfi * v.rend);
      const i = (kVA * 1000) / (k * v.tensao);
      const sen = Math.sqrt(1 - v.cosfi ** 2);
      const memoria = [];
      if (v.unidade === "cv") memoria.push(passo("Conversão da potência", "Potência no eixo em cv convertida para kW.", `P<sub>kW</sub> = P<sub>cv</sub> · 0,7355`, `P<sub>kW</sub> = ${f(v.potencia)} × 0,7355`, `${f(kW)} kW`));
      memoria.push(v.unidade === "kVA"
        ? passo("Potência aparente", "A potência foi informada diretamente em kVA; fator de potência e rendimento não alteram a corrente.", `S = valor informado`, `S = ${f(kVA)} kVA`, `${f(kVA)} kVA`)
        : passo("Potência aparente", "A rede precisa fornecer mais do que a potência útil: o rendimento cobre as perdas da carga e o fator de potência, a parcela reativa.", `S = ${frac("P", "cosφ · η")}`, `S = ${frac(`${f(kW)} kW`, `${f(v.cosfi)} × ${f(v.rend)}`)}`, `${f(kVA)} kVA`));
      memoria.push(passo("Corrente", tri ? "Em sistema trifásico equilibrado a corrente de linha é a potência aparente dividida por √3 vezes a tensão entre fases." : "Em sistema monofásico ou bifásico a corrente é a potência aparente dividida pela tensão aplicada à carga.",
        `I = ${frac("S", tri ? "√3 · V" : "V")}`, `I = ${frac(`${f(kVA * 1000, 0)} VA`, `${tri ? "1,732 × " : ""}${v.tensao} V`)}`, `${f(i)} A`));
      memoria.push(passo("Potências ativa e reativa", "Decomposição da potência aparente pelo fator de potência (triângulo de potências).", `P = S · cosφ &nbsp;&nbsp;&nbsp; Q = S · senφ &nbsp;&nbsp;&nbsp; senφ = √(1 − cos²φ)`, `P = ${f(kVA)} × ${f(v.cosfi)} &nbsp;&nbsp;&nbsp; Q = ${f(kVA)} × ${f(sen, 3)}`, `${f(kVA * v.cosfi)} kW · ${f(kVA * sen)} kvar`));
      return {
        linhas: [["Corrente", `${f(i)} A`, true], ["Potência aparente", `${f(kVA)} kVA`], ["Potência ativa absorvida", `${f(kVA * v.cosfi)} kW`], ["Potência reativa", `${f(kVA * sen)} kvar`]],
        alertas: [], passos: [], memoria
      };
    }
  },
  {
    id: "queda", nome: "Queda de tensão", norma: N.REFERENCIAS.queda,
    descricao: "Verificação de um cabo já definido, em regime e na partida do motor.",
    campos: [
      num("corrente", "Corrente", 30, "A"), sel("tensao", "Tensão", TENSOES, 380), sel("fases", "Sistema", SISTEMAS, 3),
      num("comprimento", "Comprimento", 80, "m"), sel("secao", "Seção do cabo", SECOES, 6), num("cosfi", "Fator de potência", 0.85, "", { passo: 0.01 }),
      sel("isolacao", "Isolação", ISOLACOES, "PVC"), num("ipIn", "Ip/In na partida (0 = ignorar)", 0, "×")
    ],
    calcular(v) {
      const fases = v.fases === 3 ? 3 : 2;
      const dv = N.quedaTensao({ ...v, fases });
      const pct = (dv / v.tensao) * 100;
      const R = N.resistencia(v.secao, v.isolacao), X = N.reatancia(v.secao);
      const sen = Math.sqrt(Math.max(0, 1 - v.cosfi ** 2));
      const z = R * v.cosfi + X * sen;
      const kTxt = fases === 3 ? "√3" : "2", kNum = fases === 3 ? Math.sqrt(3) : 2;
      const linhas = [["Queda de tensão", `${f(pct)} %`, true], ["Queda em volts", `${f(dv, 1)} V`], ["Tensão na carga", `${f(v.tensao - dv, 1)} V`], ["Resistência do condutor", `${f(R, 3)} Ω/km a ${N.TEMP_SERVICO[v.isolacao]} °C`]];
      const alertas = [];
      if (pct > 4) alertas.push("Acima de 4% — limite usual para circuitos terminais (NBR 5410 6.2.7).");
      const memoria = [
        passo("Resistência e reatância do cabo", `A resistência é a do cobre flexível a 20 °C corrigida para a temperatura de serviço da isolação (${N.TEMP_SERVICO[v.isolacao]} °C); a reatância é o valor típico para cabos em eletroduto ou bandeja.`,
          `R<sub>T</sub> = R<sub>20</sub> · [ 1 + 0,00393 · (T − 20) ]`, `R = ${f(R / (1 + 0.00393 * (N.TEMP_SERVICO[v.isolacao] - 20)), 3)} × [ 1 + 0,00393 × ${N.TEMP_SERVICO[v.isolacao] - 20} ]`, `R = ${f(R, 3)} Ω/km · X = ${f(X, 3)} Ω/km`, { ref: `Cabo de ${f(v.secao)} mm² — NBR NM 280, classe 5` }),
        passo("Impedância efetiva", "Só a parcela da queda que está em fase com a tensão reduz o seu módulo: a resistência pesa pelo cosφ e a reatância pelo senφ da carga.",
          `Z<sub>ef</sub> = R · cosφ + X · senφ`, `Z<sub>ef</sub> = ${f(R, 3)} × ${f(v.cosfi)} + ${f(X, 3)} × ${f(sen, 3)}`, `${f(z, 3)} Ω/km`),
        passo("Queda de tensão em volts", fases === 3 ? "Em circuito trifásico equilibrado a queda entre fases é √3 vezes a queda em um condutor." : "Em circuito de dois condutores a corrente percorre a ida e a volta, por isso o fator 2.",
          `ΔV = ${kTxt} · I · L · Z<sub>ef</sub>`, `ΔV = ${f(kNum, 3)} × ${f(v.corrente)} A × ${f(v.comprimento / 1000, 3)} km × ${f(z, 3)} Ω/km`, `${f(dv, 2)} V`),
        passo("Queda percentual", "Compara-se a queda com a tensão nominal. O limite usual para circuitos terminais é 4%.",
          `ΔV% = ${frac("ΔV", "V")} · 100`, `ΔV% = ${frac(`${f(dv, 2)} V`, `${v.tensao} V`)} · 100`, `${f(pct)} % — ${f(v.tensao - dv, 1)} V na carga`, { ok: pct <= 4, ref: N.REFERENCIAS.queda })
      ];
      if (v.ipIn > 0) {
        const dvp = N.quedaTensao({ ...v, fases, corrente: v.corrente * v.ipIn, cosfi: 0.3 });
        const dp = (dvp / v.tensao) * 100;
        linhas.push(["Queda na partida (cosφ 0,3)", `${f(dp)} %`]);
        if (dp > 10) alertas.push("Queda na partida acima de 10% nos terminais do motor (NBR 5410 6.5.1).");
        memoria.push(passo("Queda de tensão na partida do motor", "Na partida a corrente é multiplicada por Ip/In e o fator de potência cai para cerca de 0,3, o que aumenta o peso da reatância. O limite nos terminais do motor é 10%.",
          `ΔV<sub>p</sub> = ${kTxt} · (I · I<sub>p</sub>/I<sub>n</sub>) · L · (R · 0,3 + X · 0,954)`, `ΔV<sub>p</sub> = ${f(kNum, 3)} × ${f(v.corrente * v.ipIn, 0)} A × ${f(v.comprimento / 1000, 3)} km × ${f(R * 0.3 + X * 0.954, 3)} Ω/km = ${f(dvp, 1)} V`, `${f(dp)} %`, { ok: dp <= 10, ref: N.REFERENCIAS.motores }));
      }
      return { linhas, alertas, passos: [], memoria };
    }
  },
  {
    id: "curto", nome: "Corrente de curto-circuito", norma: "Método simplificado das impedâncias (NBR 5410 5.3.5)",
    descricao: "Icc presumida no secundário do transformador e no ponto de instalação do quadro.",
    campos: [
      num("kva", "Potência do transformador", 500, "kVA"), num("z", "Impedância do transformador", 4.5, "%", { passo: 0.1 }), sel("tensao", "Tensão secundária", TENSOES.slice(0, 3), 380),
      num("comprimento", "Comprimento do alimentador", 30, "m"), sel("secao", "Seção do alimentador", SECOES, 95), num("paralelo", "Condutores por fase", 1, "un")
    ],
    calcular(v) {
      if (!(v.kva > 0 && v.z > 0 && v.paralelo >= 1)) return { linhas: [], alertas: ["Informe a potência e a impedância do transformador e ao menos 1 condutor por fase."], passos: [] };
      const inTrafo = (v.kva * 1000) / (Math.sqrt(3) * v.tensao);
      const zt = (v.z / 100) * (v.tensao ** 2 / (v.kva * 1000));
      const iccTrafo = v.tensao / (Math.sqrt(3) * zt);
      const r20 = N.resistencia(v.secao, "PVC") / (1 + 0.00393 * 50); // a 20 °C: cabo frio dá a maior Icc
      const r = (r20 * v.comprimento) / 1000 / v.paralelo;
      const x = (N.reatancia(v.secao) * v.comprimento) / 1000 / v.paralelo;
      const rt = zt * 0.2, xt = zt * 0.98;
      const z = Math.hypot(r + rt, x + xt);
      const icc = v.tensao / (Math.sqrt(3) * z);
      const m = (o) => f(o * 1000, 2); // em mΩ
      const memoria = [
        passo("Corrente nominal do transformador", "Corrente de plena carga no secundário, usada como referência.", `I<sub>n</sub> = ${frac("S", "√3 · V")}`, `I<sub>n</sub> = ${frac(`${f(v.kva * 1000, 0)} VA`, `1,732 × ${v.tensao} V`)}`, `${f(inTrafo, 0)} A`),
        passo("Impedância do transformador", "A impedância percentual de placa (Z%) é convertida em ohms referidos ao secundário.", `Z<sub>T</sub> = ${frac("Z%", "100")} · ${frac("V²", "S")}`, `Z<sub>T</sub> = ${frac(f(v.z), "100")} × ${frac(`${v.tensao}²`, f(v.kva * 1000, 0))}`, `${m(zt)} mΩ`),
        passo("Curto-circuito nos bornes do transformador", "Sem nenhum cabo no caminho, só a impedância do transformador limita a corrente. Equivale a In dividido por Z%.", `I<sub>cc,T</sub> = ${frac("V", "√3 · Z<sub>T</sub>")}`, `I<sub>cc,T</sub> = ${frac(`${v.tensao} V`, `1,732 × ${m(zt)} mΩ`)}`, `${f(iccTrafo / 1000)} kA`),
        passo("Impedância do alimentador", `Resistência a 20 °C (cabo frio, condição de maior corrente) e reatância do trecho, divididas pelo número de condutores em paralelo (${f(v.paralelo, 0)}).`, `R<sub>c</sub> = ${frac("r · L", "n")} &nbsp;&nbsp;&nbsp; X<sub>c</sub> = ${frac("x · L", "n")}`, `R<sub>c</sub> = ${frac(`${f(r20, 3)} Ω/km × ${f(v.comprimento / 1000, 3)} km`, f(v.paralelo, 0))} &nbsp;&nbsp;&nbsp; X<sub>c</sub> = ${frac(`${f(N.reatancia(v.secao), 3)} × ${f(v.comprimento / 1000, 3)}`, f(v.paralelo, 0))}`, `R = ${m(r)} mΩ · X = ${m(x)} mΩ`, { ref: `Cabo de ${f(v.secao)} mm²` }),
        passo("Impedância total até o quadro", "Somam-se separadamente as resistências e as reatâncias do transformador (adotado R ≈ 0,2·Z e X ≈ 0,98·Z) e do cabo.", `Z = √[ (R<sub>T</sub> + R<sub>c</sub>)² + (X<sub>T</sub> + X<sub>c</sub>)² ]`, `Z = √[ (${m(rt)} + ${m(r)})² + (${m(xt)} + ${m(x)})² ]`, `${m(z)} mΩ`),
        passo("Curto-circuito no ponto do quadro", "Corrente presumida de curto trifásico simétrico no fim do alimentador. Os disjuntores do quadro precisam ter capacidade de interrupção igual ou maior.", `I<sub>cc</sub> = ${frac("V", "√3 · Z")}`, `I<sub>cc</sub> = ${frac(`${v.tensao} V`, `1,732 × ${m(z)} mΩ`)}`, `${f(icc / 1000)} kA`, { ref: "NBR 5410 — 5.3.5" })
      ];
      return {
        linhas: [["Icc no ponto do quadro", `${f(icc / 1000)} kA`, true], ["Icc nos bornes do transformador", `${f(iccTrafo / 1000)} kA`], ["Corrente nominal do transformador", `${f(inTrafo, 0)} A`], ["Impedância do alimentador", `${m(Math.hypot(r, x))} mΩ`]],
        alertas: ["Os dispositivos de proteção devem ter capacidade de interrupção (Icu/Icn) igual ou superior à Icc no ponto de instalação.", "Cálculo simplificado: despreza a impedância da rede de média tensão e a contribuição de motores."],
        passos: [], memoria
      };
    }
  },
  {
    id: "fp", nome: "Correção do fator de potência", norma: "Qc = P · (tanφ1 − tanφ2)",
    descricao: "Potência do banco de capacitores para elevar o fator de potência.",
    campos: [
      num("potencia", "Potência ativa", 100, "kW"), num("cos1", "Fator de potência atual", 0.78, "", { passo: 0.01 }), num("cos2", "Fator de potência desejado", 0.95, "", { passo: 0.01 }),
      sel("tensao", "Tensão", TENSOES.slice(0, 3), 380)
    ],
    calcular(v) {
      if (!(v.potencia > 0 && v.cos1 > 0 && v.cos1 <= 1 && v.cos2 > 0 && v.cos2 <= 1)) return { linhas: [], alertas: ["Informe a potência e fatores de potência entre 0 e 1."], passos: [] };
      const t1 = Math.tan(Math.acos(v.cos1)), t2 = Math.tan(Math.acos(v.cos2));
      const qc = v.potencia * (t1 - t2);
      const k = Math.sqrt(3) * v.tensao;
      const i1 = (v.potencia * 1000) / (k * v.cos1), i2 = (v.potencia * 1000) / (k * v.cos2), ic = (qc * 1000) / k;
      const memoria = [
        passo("Tangentes dos ângulos", "A potência reativa é a ativa multiplicada pela tangente do ângulo de defasagem. Calcula-se a tangente para o fator de potência atual e para o desejado.", `tanφ = tan( arccos( cosφ ) )`, `tanφ<sub>1</sub> = tan(arccos ${f(v.cos1)}) = ${f(t1, 3)} &nbsp;&nbsp;&nbsp; tanφ<sub>2</sub> = tan(arccos ${f(v.cos2)}) = ${f(t2, 3)}`, `Q atual = ${f(v.potencia * t1, 1)} kvar · Q desejado = ${f(v.potencia * t2, 1)} kvar`),
        passo("Potência do banco de capacitores", "O banco fornece localmente a diferença entre a potência reativa atual e a desejada.", `Q<sub>c</sub> = P · ( tanφ<sub>1</sub> − tanφ<sub>2</sub> )`, `Q<sub>c</sub> = ${f(v.potencia)} kW × ( ${f(t1, 3)} − ${f(t2, 3)} )`, `${f(qc, 1)} kvar`, { ok: qc > 0 }),
        passo("Corrente do banco", "Corrente nominal do banco trifásico. Cabos e proteção devem ser dimensionados para 1,35 vezes esse valor.", `I<sub>c</sub> = ${frac("Q<sub>c</sub>", "√3 · V")}`, `I<sub>c</sub> = ${frac(`${f(qc * 1000, 0)} var`, `1,732 × ${v.tensao} V`)}`, `${f(ic, 1)} A — dimensionar para ${f(ic * 1.35, 1)} A`),
        passo("Alívio de corrente na rede", "Com menos potência reativa circulando, a corrente absorvida da rede diminui para a mesma potência ativa.", `I = ${frac("P", "√3 · V · cosφ")}`, `I<sub>antes</sub> = ${frac(f(v.potencia * 1000, 0), `1,732 × ${v.tensao} × ${f(v.cos1)}`)} = ${f(i1, 1)} A &nbsp;&nbsp;&nbsp; I<sub>depois</sub> = ${frac(f(v.potencia * 1000, 0), `1,732 × ${v.tensao} × ${f(v.cos2)}`)} = ${f(i2, 1)} A`, `redução de ${f((1 - i2 / i1) * 100, 1)} %`)
      ];
      return {
        linhas: [["Banco de capacitores", `${f(qc, 1)} kvar`, true], ["Corrente do banco", `${f(ic, 1)} A`], ["Corrente antes", `${f(i1, 1)} A`], ["Corrente depois", `${f(i2, 1)} A`], ["Redução de corrente", `${f((1 - i2 / i1) * 100, 1)} %`]],
        alertas: [...(v.cos2 < 0.92 ? ["O fator de potência mínimo exigido pela ANEEL é 0,92."] : []), ...(qc <= 0 ? ["O fator de potência desejado deve ser maior que o atual."] : [])],
        passos: [], memoria
      };
    }
  },
  {
    id: "ventilacao", nome: "Ventilação do painel", norma: "V = 3,1 · P / ΔT (m³/h)",
    descricao: "Vazão de ar para dissipar as perdas de inversores, soft-starters e fontes.",
    campos: [
      num("kwInv", "Potência total em inversores", 15, "kW"), num("kwSoft", "Potência total em soft-starters", 0, "kW"), num("outras", "Outras perdas (fontes, trafos)", 50, "W"),
      num("tInt", "Temperatura interna máxima", 40, "°C"), num("tExt", "Temperatura externa máxima", 30, "°C"), num("vazaoKit", "Vazão de cada ventilador com filtro", 100, "m³/h")
    ],
    calcular(v) {
      const perdas = v.kwInv * 30 + v.kwSoft * 5 + v.outras;
      const dt = v.tInt - v.tExt;
      if (dt <= 0) return { linhas: [], alertas: ["A temperatura interna admissível deve ser maior que a externa; caso contrário é necessário condicionador de ar para painel."], passos: [] };
      const vazao = (3.1 * perdas) / dt;
      const kits = Math.max(1, Math.ceil(vazao / (v.vazaoKit || 1)));
      const memoria = [
        passo("Potência dissipada dentro do painel", "Estimativa das perdas que viram calor: cerca de 3% da potência nos inversores, 0,5% nas soft-starters com bypass, mais as perdas de fontes e transformadores.", `P<sub>d</sub> = 0,03 · P<sub>inv</sub> + 0,005 · P<sub>soft</sub> + P<sub>outras</sub>`, `P<sub>d</sub> = 0,03 × ${f(v.kwInv * 1000, 0)} W + 0,005 × ${f(v.kwSoft * 1000, 0)} W + ${f(v.outras, 0)} W`, `${f(perdas, 0)} W`),
        passo("Diferença de temperatura disponível", "Quanto o ar pode aquecer ao atravessar o painel: temperatura interna máxima admitida pelos componentes menos a temperatura do ar externo.", `ΔT = T<sub>int</sub> − T<sub>ext</sub>`, `ΔT = ${f(v.tInt)} − ${f(v.tExt)}`, `${f(dt)} K`),
        passo("Vazão de ar necessária", "O fator 3,1 reúne a densidade e o calor específico do ar ao nível do mar e a conversão para m³/h.", `V = ${frac("3,1 · P<sub>d</sub>", "ΔT")}`, `V = ${frac(`3,1 × ${f(perdas, 0)} W`, `${f(dt)} K`)}`, `${f(vazao, 0)} m³/h`),
        passo("Quantidade de ventiladores", "Divide-se a vazão pela vazão efetiva de cada ventilador já com filtro e grelha, arredondando para cima. Preveja grelha de saída com filtro na parte superior.", `n = arredonda para cima ( ${frac("V", "V<sub>vent</sub>")} )`, `n = ${frac(`${f(vazao, 0)} m³/h`, `${f(v.vazaoKit, 0)} m³/h`)} = ${f(vazao / (v.vazaoKit || 1))}`, `${kits} ventilador${kits > 1 ? "es" : ""}`)
      ];
      return {
        linhas: [["Vazão necessária", `${f(vazao, 0)} m³/h`, true], ["Perdas dissipadas", `${f(perdas, 0)} W`], ["Ventiladores com filtro", `${kits} un`], ["Diferença de temperatura", `${f(dt)} K`]],
        alertas: ["Perdas estimadas: confirme com a potência dissipada informada nos manuais dos inversores e soft-starters."],
        passos: [], memoria
      };
    }
  },
  {
    id: "estrela", nome: "Partida estrela-triângulo", norma: "Dimensionamento dos contatores e do relé na partida Y-Δ",
    descricao: "Correntes em cada contator, ajuste do relé de sobrecarga e corrente de partida.",
    campos: [num("corrente", "Corrente nominal do motor", 60, "A"), num("ipIn", "Ip/In em partida direta", 7.5, "×", { passo: 0.1 }), num("fs", "Fator de serviço", 1.15, "", { passo: 0.05 })],
    calcular(v) {
      if (!(v.corrente > 0)) return { linhas: [], alertas: ["Informe a corrente nominal do motor."], passos: [] };
      const i58 = v.corrente / Math.sqrt(3), i33 = v.corrente / 3;
      const k1 = contator(i58), k3 = contator(i33);
      const memoria = [
        passo("Contatores K1 (linha) e K2 (triângulo)", "Em triângulo cada contator fica em série com um enrolamento e conduz a corrente de fase, que é a corrente de linha dividida por √3.", `I<sub>K1</sub> = I<sub>K2</sub> = ${frac("I<sub>n</sub>", "√3")} = 0,58 · I<sub>n</sub>`, `I<sub>K1</sub> = ${frac(`${f(v.corrente)} A`, "1,732")}`, `${f(i58)} A → contator ${k1 ? k1.ie + " A (AC-3)" : "acima da linha"}`, { ok: Boolean(k1) }),
        passo("Contator K3 (estrela)", "Na estrela os enrolamentos recebem V/√3 e a corrente cai para um terço da nominal; K3 só conduz durante a partida.", `I<sub>K3</sub> = ${frac("I<sub>n</sub>", "3")} = 0,33 · I<sub>n</sub>`, `I<sub>K3</sub> = ${frac(`${f(v.corrente)} A`, "3")}`, `${f(i33)} A → contator ${k3 ? k3.ie + " A (AC-3)" : "acima da linha"}`, { ok: Boolean(k3) }),
        passo("Ajuste do relé de sobrecarga", "Instalado no ramo de K1, o relé enxerga a corrente de fase; por isso é ajustado em 0,58 · In, e não na corrente nominal.", `I<sub>ajuste</sub> = 0,58 · I<sub>n</sub>`, `I<sub>ajuste</sub> = 0,58 × ${f(v.corrente)}`, `${f(v.corrente * 0.58)} A`),
        passo("Corrente de partida", "A corrente de linha na partida em estrela é um terço da corrente de partida direta. O conjugado de partida também cai para um terço.", `I<sub>p,Y</sub> = ${frac("I<sub>n</sub> · (I<sub>p</sub>/I<sub>n</sub>)", "3")}`, `I<sub>p,Y</sub> = ${frac(`${f(v.corrente)} × ${f(v.ipIn, 1)}`, "3")}`, `${f((v.corrente * v.ipIn) / 3, 0)} A (direta: ${f(v.corrente * v.ipIn, 0)} A)`),
        passo("Cabos entre o painel e o motor", "São seis condutores até o motor; cada um conduz a corrente de fase, multiplicada pelo fator de serviço.", `I<sub>cabo</sub> = 0,58 · I<sub>n</sub> · FS`, `I<sub>cabo</sub> = 0,58 × ${f(v.corrente)} × ${f(v.fs)}`, `${f(v.corrente * 0.58 * v.fs)} A por condutor`)
      ];
      return {
        linhas: [
          ["K1 (linha) e K2 (triângulo)", `${f(i58)} A → ${k1 ? k1.ie + " A AC-3" : "—"}`, true], ["K3 (estrela)", `${f(i33)} A → ${k3 ? k3.ie + " A AC-3" : "—"}`],
          ["Ajuste do relé de sobrecarga", `${f(v.corrente * 0.58)} A (no ramo de K1)`], ["Corrente de partida na linha", `${f((v.corrente * v.ipIn) / 3, 0)} A (⅓ da direta)`],
          ["Corrente de partida direta", `${f(v.corrente * v.ipIn, 0)} A`], ["Cabos até o motor (6 condutores)", `dimensionar para ${f(v.corrente * 0.58 * v.fs)} A cada`]
        ],
        alertas: ["Só é aplicável a motores com 6 terminais cuja tensão em triângulo seja a tensão da rede, e com partida em vazio ou carga leve (conjugado reduzido a ⅓)."],
        passos: [], memoria
      };
    }
  }
];

export function calcular(id, valores) {
  const c = CALCULADORAS.find((x) => x.id === id);
  const v = {};
  for (const campo of c.campos) {
    const bruto = valores[campo.id] ?? campo.padrao;
    const n = typeof bruto === "number" ? bruto : parseFloat(String(bruto).replace(",", "."));
    v[campo.id] = campo.tipo === "num" || (campo.tipo === "sel" && typeof campo.padrao === "number") ? (Number.isFinite(n) ? n : 0) : bruto;
  }
  return { valores: v, ...c.calcular(v) };
}
