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
    descricao: "Taxa de ocupação por área: 53% (1 cabo), 31% (2 cabos) e 40% (3 ou mais).",
    campos: [
      sel("tipoCabo", "Tipo de cabo", Object.keys(N.DIAMETRO_CABO).map((k) => [k, k]), Object.keys(N.DIAMETRO_CABO)[0], { largo: true }),
      num("q1", "Grupo 1 — quantidade", 4, "cabos"), sel("s1", "Grupo 1 — seção", SECOES, 6),
      num("q2", "Grupo 2 — quantidade", 0, "cabos"), sel("s2", "Grupo 2 — seção", SECOES, 2.5),
      num("q3", "Grupo 3 — quantidade", 0, "cabos"), sel("s3", "Grupo 3 — seção", SECOES, 1.5),
      num("qx", "Outros cabos — quantidade", 0, "cabos"), num("dx", "Outros cabos — diâmetro externo", 0, "mm"),
      sel("material", "Eletroduto", Object.keys(N.ELETRODUTOS).map((k) => [k, k]), Object.keys(N.ELETRODUTOS)[0], { largo: true })
    ],
    calcular(v) {
      const diam = N.DIAMETRO_CABO[v.tipoCabo];
      const grupos = [[v.q1, diam[N.SECOES.indexOf(v.s1)]], [v.q2, diam[N.SECOES.indexOf(v.s2)]], [v.q3, diam[N.SECOES.indexOf(v.s3)]], [v.qx, v.dx]].filter(([q, d]) => q > 0 && d > 0);
      const total = grupos.reduce((s, [q]) => s + q, 0);
      if (!total) return { linhas: [], alertas: ["Informe ao menos um grupo de cabos."], passos: [] };
      const area = grupos.reduce((s, [q, d]) => s + (q * Math.PI * d * d) / 4, 0);
      const limite = N.taxaOcupacaoMax(total);
      const tamanhos = N.ELETRODUTOS[v.material].map(([nome, di]) => ({ nome, di, taxa: (area / ((Math.PI * di * di) / 4)) * 100 }));
      const ok = tamanhos.find((t) => t.taxa <= limite);
      return {
        linhas: [
          ["Eletroduto mínimo", ok ? `${ok.nome} (Ø int. ${f(ok.di, 1)} mm)` : "acima de 4\" — dividir em mais eletrodutos", true],
          ["Ocupação no eletroduto mínimo", ok ? `${f(ok.taxa, 1)} %` : "—"], ["Taxa máxima permitida", `${limite} % (${total} cabo${total > 1 ? "s" : ""})`],
          ["Área total dos cabos", `${f(area, 1)} mm²`],
          ...tamanhos.map((t) => [`Ocupação em ${t.nome}`, `${f(t.taxa, 1)} % ${t.taxa <= limite ? "✓" : "✗"}`])
        ],
        alertas: ["Diâmetros de cabos e eletrodutos são valores típicos de catálogo; confirme com os fabricantes."],
        passos: [`Taxa = Σ(n · π · d² / 4) / (π · Di² / 4)`]
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
      const m = correnteMotor(kW, v.tensao);
      const ipDireta = m.corrente * m.ipIn;
      const ip = { direta: ipDireta, estrela: ipDireta / 3, soft: m.corrente * 3, inversor: m.corrente * 1.5 }[v.partida];
      const dm = disjuntorMotor(m.corrente), k = contator(v.partida === "estrela" ? m.corrente * 0.58 : m.corrente);
      const cabo = N.dimensionarCabo({ corrente: m.corrente * v.fs, tensao: v.tensao });
      const padrao = POTENCIAS_KW.some((p) => Math.abs(p - kW) / p < 0.03);
      return {
        linhas: [
          ["Corrente nominal (In)", `${f(m.corrente)} A`, true], ["Potência", `${f(kW)} kW / ${f(kW / CV, 1)} cv`], ["Origem do valor", m.fonte],
          ["Corrente com fator de serviço", `${f(m.corrente * v.fs)} A`],
          ["Corrente de partida estimada", `${f(ip, 0)} A (${{ direta: `${f(m.ipIn, 1)} × In`, estrela: "Ip direta ÷ 3", soft: "limitada em 3 × In", inversor: "até 1,5 × In" }[v.partida]})`],
          ["Disjuntor-motor sugerido", dm ? `${dm.modelo} (${dm.faixa})` : "Caixa moldada + relé de sobrecarga"],
          ["Contator sugerido (AC-3)", k ? `${k.modelo.replace(/[A-Z]\d\d$/, "")} — ${k.ie} A${v.partida === "estrela" ? " (K1/K2)" : ""}` : "—"],
          ["Cabo mínimo (B1, PVC, 30 °C)", `${f(cabo.secao)} mm² — sem considerar queda de tensão`]
        ],
        alertas: padrao ? [] : ["Potência não padronizada: corrente obtida por interpolação. Prefira a corrente de placa do motor."],
        passos: ["In (380 V) = In (220 V) ÷ √3; In (440 V) = In (220 V) ÷ 2", "Condutores do circuito: Iz ≥ In × fator de serviço"]
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
      const k = v.fases === 3 ? Math.sqrt(3) : 1;
      const kW = v.unidade === "cv" ? v.potencia * CV : v.potencia;
      const kVA = v.unidade === "kVA" ? v.potencia : kW / (v.cosfi * v.rend);
      const i = (kVA * 1000) / (k * v.tensao);
      return {
        linhas: [["Corrente", `${f(i)} A`, true], ["Potência aparente", `${f(kVA)} kVA`], ["Potência ativa absorvida", `${f(kVA * v.cosfi)} kW`], ["Potência reativa", `${f(kVA * Math.sqrt(1 - v.cosfi ** 2))} kvar`]],
        alertas: [], passos: [`I = S / (${v.fases === 3 ? "√3 · " : ""}V) = ${f(kVA * 1000, 0)} / (${v.fases === 3 ? "1,732 × " : ""}${v.tensao}) = ${f(i)} A`]
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
      const linhas = [["Queda de tensão", `${f(pct)} %`, true], ["Queda em volts", `${f(dv, 1)} V`], ["Tensão na carga", `${f(v.tensao - dv, 1)} V`], ["Resistência do condutor", `${f(N.resistencia(v.secao, v.isolacao), 3)} Ω/km a ${N.TEMP_SERVICO[v.isolacao]} °C`]];
      const alertas = [];
      if (pct > 4) alertas.push("Acima de 4% — limite usual para circuitos terminais (NBR 5410 6.2.7).");
      if (v.ipIn > 0) {
        const dp = (N.quedaTensao({ ...v, fases, corrente: v.corrente * v.ipIn, cosfi: 0.3 }) / v.tensao) * 100;
        linhas.push(["Queda na partida (cosφ 0,3)", `${f(dp)} %`]);
        if (dp > 10) alertas.push("Queda na partida acima de 10% nos terminais do motor (NBR 5410 6.5.1).");
      }
      return { linhas, alertas, passos: [`ΔV = ${fases === 3 ? "√3" : "2"} · I · L · (R·cosφ + X·senφ)`] };
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
      const zt = (v.z / 100) * (v.tensao ** 2 / (v.kva * 1000));
      const iccTrafo = v.tensao / (Math.sqrt(3) * zt);
      const r = (N.resistencia(v.secao, "PVC") / (1 + 0.00393 * 50)) * v.comprimento / 1000 / v.paralelo; // a 20 °C: maior Icc
      const x = (N.reatancia(v.secao) * v.comprimento) / 1000 / v.paralelo;
      const z = Math.hypot(r + zt * 0.2, x + zt * 0.98);
      const icc = v.tensao / (Math.sqrt(3) * z);
      return {
        linhas: [["Icc no ponto do quadro", `${f(icc / 1000)} kA`, true], ["Icc nos bornes do transformador", `${f(iccTrafo / 1000)} kA`], ["Corrente nominal do transformador", `${f((v.kva * 1000) / (Math.sqrt(3) * v.tensao), 0)} A`], ["Impedância do alimentador", `${f(Math.hypot(r, x) * 1000, 2)} mΩ`]],
        alertas: ["Os dispositivos de proteção devem ter capacidade de interrupção (Icu/Icn) igual ou superior à Icc no ponto de instalação.", "Cálculo simplificado: despreza a impedância da rede de média tensão e a contribuição de motores."],
        passos: [`Zt = Z% · V² / S = ${f(zt * 1000, 2)} mΩ`, `Icc = V / (√3 · Ztotal)`]
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
      const qc = v.potencia * (Math.tan(Math.acos(v.cos1)) - Math.tan(Math.acos(v.cos2)));
      const k = Math.sqrt(3) * v.tensao;
      const i1 = (v.potencia * 1000) / (k * v.cos1), i2 = (v.potencia * 1000) / (k * v.cos2);
      return {
        linhas: [["Banco de capacitores", `${f(qc, 1)} kvar`, true], ["Corrente do banco", `${f((qc * 1000) / k, 1)} A`], ["Corrente antes", `${f(i1, 1)} A`], ["Corrente depois", `${f(i2, 1)} A`], ["Redução de corrente", `${f((1 - i2 / i1) * 100, 1)} %`]],
        alertas: v.cos2 < 0.92 ? ["O fator de potência mínimo exigido pela ANEEL é 0,92."] : [],
        passos: ["Cabos e proteção do banco: dimensionar para 1,35 × a corrente nominal do capacitor."]
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
      return {
        linhas: [["Vazão necessária", `${f(vazao, 0)} m³/h`, true], ["Perdas dissipadas", `${f(perdas, 0)} W`], ["Ventiladores com filtro", `${Math.max(1, Math.ceil(vazao / v.vazaoKit))} un`], ["Diferença de temperatura", `${f(dt)} K`]],
        alertas: ["Perdas estimadas: 3% da potência nos inversores e 0,5% nas soft-starters com bypass."],
        passos: [`V = 3,1 × ${f(perdas, 0)} / ${f(dt)} = ${f(vazao, 0)} m³/h`]
      };
    }
  },
  {
    id: "estrela", nome: "Partida estrela-triângulo", norma: "Dimensionamento dos contatores e do relé na partida Y-Δ",
    descricao: "Correntes em cada contator, ajuste do relé de sobrecarga e corrente de partida.",
    campos: [num("corrente", "Corrente nominal do motor", 60, "A"), num("ipIn", "Ip/In em partida direta", 7.5, "×", { passo: 0.1 }), num("fs", "Fator de serviço", 1.15, "", { passo: 0.05 })],
    calcular(v) {
      const k1 = contator(v.corrente * 0.58), k3 = contator(v.corrente * 0.34);
      return {
        linhas: [
          ["K1 (linha) e K2 (triângulo)", `${f(v.corrente * 0.58)} A → ${k1 ? k1.ie + " A AC-3" : "—"}`, true], ["K3 (estrela)", `${f(v.corrente * 0.33)} A → ${k3 ? k3.ie + " A AC-3" : "—"}`],
          ["Ajuste do relé de sobrecarga", `${f(v.corrente * 0.58)} A (no ramo de K1)`], ["Corrente de partida na linha", `${f((v.corrente * v.ipIn) / 3, 0)} A (⅓ da direta)`],
          ["Corrente de partida direta", `${f(v.corrente * v.ipIn, 0)} A`], ["Cabos até o motor (6 condutores)", `dimensionar para ${f(v.corrente * 0.58 * v.fs)} A cada`]
        ],
        alertas: ["Só é aplicável a motores com 6 terminais cuja tensão em triângulo seja a tensão da rede, e com partida em vazio ou carga leve (conjugado reduzido a ⅓)."],
        passos: ["I(K1) = I(K2) = In / √3 = 0,58 · In", "I(K3) = In / 3 = 0,33 · In"]
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
