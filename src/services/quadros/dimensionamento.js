// Motor de dimensionamento do quadro: recebe os dados do painel e a lista de
// equipamentos e devolve cargas, lista de materiais, proteções, memorial de
// cálculo e layout. Regras de composição: EstruturadeCriação.txt; critérios
// elétricos: NBR 5410; seleção de modelos: catálogos da Base de Consulta.
import * as cat from "./catalogo.js";
import { dimensionarCabo, REFERENCIAS } from "./normas.js";
import { correnteMotor, correnteCarga, correnteResistiva, CV } from "./motores.js";
import { montarLayout } from "./layout.js";

export const TIPOS_QUADRO = {
  potencia: { rotulo: "Potência — apenas circuitos de força", potencia: true, bornes: 4 },
  "potencia-comando": { rotulo: "Potência + comando local", potencia: true, comando: true, bornes: 10 },
  comando: { rotulo: "Comando puro (por quantidade de dispositivos)", comando: true, porQuantidade: true, bornes: 6 },
  automacao: { rotulo: "Automação — CLP e sensores", automacao: true, bornes: 15 },
  completo: { rotulo: "Completo — força + comando + CLP + IHM", potencia: true, comando: true, automacao: true, bornes: 20 },
  remoto: { rotulo: "Remoto de automação (por quantidade de pontos)", automacao: true, porQuantidade: true, bornes: 6 }
};

export const PARTIDAS = {
  direta: "Partida direta", estrela: "Estrela-triângulo", soft: "Soft-starter",
  inversor: "Inversor de frequência", ec: "Motor EC"
};

const TODAS = ["direta", "estrela", "soft", "inversor"];
export const TIPOS_EQUIP = {
  EXCV: { rotulo: "EX/CV — Exaustor / caixa de ventilação", partidas: TODAS, leituras: ["status", "alarme", "pressostato"] },
  BOMBA: { rotulo: "Bomba (água gelada, condensação, pré-aquecimento)", partidas: ["direta", "estrela", "soft", "inversor"], leituras: ["status", "alarme"] },
  UTA: { rotulo: "UTA — Unidade de tratamento de ar / fan coil", partidas: ["inversor", "soft", "direta", "estrela", "ec"], leituras: ["status", "alarme", "tempDuto", "umidade", "co2", "congelamento", "fluxoAr"] },
  MOTOR: { rotulo: "Motor trifásico genérico", partidas: TODAS, leituras: ["status", "alarme"] },
  CHILLER: { rotulo: "Chiller", leituras: ["status", "alarme"] },
  VRF: { rotulo: "VRF — condensadoras e evaporadoras" },
  SPLIT: { rotulo: "Split (hi-wall, cassete, piso-teto)" },
  SPLITAO: { rotulo: "Splitão — evaporadora + condensadoras", partidas: ["direta", "inversor"], leituras: ["status", "alarme"] },
  FANCOLETE: { rotulo: "Fancolete" },
  CARGA: { rotulo: "Carga genérica (não motriz)" }
};

export const LEITURAS = {
  status: ["Status de operação", "di"], alarme: ["Alarme térmico / falha", "di"],
  pressostato: ["Pressostato diferencial de filtro", "di"], tempDuto: ["Temperatura de duto", "ai"],
  umidade: ["Umidade relativa", "ai"], co2: ["Sensor de CO₂", "ai"],
  congelamento: ["Sensor de congelamento", "di"], fluxoAr: ["Pressostato de fluxo de ar", "di"]
};

export const PADRAO_QUADRO = {
  nome: "", tensao: 380, tipo: "potencia-comando", tensaoComando: "220Vca", quantity: 4,
  hasIhm: false, ihmSize: '7"', hasSupervisorio: false, dps: true,
  metodo: "B1", isolacao: "PVC", tempAmbiente: 30, agrupamento: 1, quedaMax: 4, fatorServico: 1.15,
  fatorDemanda: 100, reserva: 20, distanciaAlimentador: 0, equipamentos: [], linhas: {}
};

const fmt = (v, casas = 2) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: casas, minimumFractionDigits: 0 });
const lista = (v) => (Array.isArray(v) ? v : String(v ?? "").split(/[;\s/]+/)).map((x) => parseFloat(String(x).replace(",", "."))).filter((x) => x > 0);

// Desdobra um equipamento nos circuitos elétricos que saem do quadro.
function circuitosDe(e) {
  const base = { equip: e.nome, distancia: Number(e.distancia) || 0, placa: Number(e.correntePlaca) || 0, leituras: e.leituras ?? [] };
  const motor = (extra = {}) => ({ ...base, natureza: "motor", nome: e.nome, kW: Number(e.potencia) || 0, partida: e.partida || "direta", ...extra });
  switch (e.tipo) {
    case "EXCV": case "BOMBA": case "MOTOR":
      return [motor()];
    case "UTA": {
      const c = [motor({ valvula: e.valvula })];
      if (e.hasHeating && e.heatingPower > 0) {
        c.push({ ...base, placa: 0, leituras: [], natureza: "resistiva", nome: `${e.nome} — aquecimento`, kW: Number(e.heatingPower), controle: e.heatingType || "estagios", estagios: Math.max(1, Number(e.heatingStages) || 1) });
      }
      if (e.hasHumid && e.humidPower > 0) {
        c.push({ ...base, placa: 0, leituras: [], natureza: "carga", nome: `${e.nome} — umidificador`, kW: Number(e.humidPower), controle: e.humidType || "onoff", umidificador: true });
      }
      return c;
    }
    case "CHILLER":
      return [{ ...base, natureza: "carga", nome: e.nome, kW: Number(e.potencia) || 0, chiller: true }];
    case "VRF":
      return [
        ...lista(e.condensadoras).map((kW, i) => ({ ...base, placa: 0, leituras: [], natureza: "carga", nome: `${e.nome} — cond. ${i + 1}`, kW })),
        ...(e.evaporadoras > 0 ? [{ ...base, placa: 0, leituras: [], natureza: "carga", nome: `${e.nome} — evaporadoras`, kW: 0.2, fases: 2, qtd: Number(e.evaporadoras), fixo10: true }] : [])
      ];
    case "SPLIT":
      return [{ ...base, natureza: "carga", nome: e.nome, kW: Number(e.potencia) || 0, fases: e.splitPhase === "tri" ? 3 : 2 }];
    case "SPLITAO":
      return [motor(), ...lista(e.condensadoras).map((kW, i) => ({ ...base, placa: 0, leituras: [], natureza: "carga", nome: `${e.nome} — cond. ${i + 1}`, kW }))];
    case "FANCOLETE":
      return [{ ...base, placa: 0, natureza: "carga", nome: e.nome, kW: 0.2, fases: 2, qtd: Math.max(1, Number(e.fancoleteQty) || 1), fixo10: true }];
    default:
      return [{ ...base, natureza: "carga", nome: e.nome, kW: Number(e.potencia) || 0, fases: e.fases === "mono" ? 2 : 3 }];
  }
}

// Agrupa tags no estilo dos projetos: "DSJ1/2/3" ou "RL1...RL6".
function juntarTags(tags) {
  const unicos = [...new Set(tags.filter(Boolean))];
  if (unicos.length <= 1) return unicos[0] ?? "";
  const m = unicos.map((t) => t.match(/^(.*?)(\d+)$/));
  if (m.every(Boolean) && m.every((x) => x[1] === m[0][1])) {
    const nums = m.map((x) => Number(x[2]));
    const continuo = nums.every((v, i) => i === 0 || v === nums[i - 1] + 1);
    return continuo && unicos.length > 3 ? `${unicos[0]}...${unicos[unicos.length - 1]}` : `${unicos[0]}/${nums.slice(1).join("/")}`;
  }
  return unicos.join(", ");
}

export function dimensionar(quadroBruto) {
  const q = { ...PADRAO_QUADRO, ...quadroBruto };
  const cfg = TIPOS_QUADRO[q.tipo] ?? TIPOS_QUADRO["potencia-comando"];
  const L = Object.fromEntries(Object.entries(cat.CATEGORIAS).map(([k, c]) => [k, q.linhas?.[k] ?? c.padrao]));
  const V = Number(q.tensao);
  const bobina = q.tensaoComando || "220Vca";
  const itens = [], inst = [], memorial = [], correntes = [], avisos = [], cargas = [];
  const usadas = new Set();
  const n = {};
  const io = { di: 0, ai: 0, dout: 0, ao: 0 };
  let carga24 = 0, perdas = 0, maiorMotor = 0;
  const tag = (p) => `${p}${(n[p] = (n[p] ?? 0) + 1)}`;

  function add(grupo, tagItem, comp, opc = {}) {
    const { qtd = 1, un = "un", just = "", zona, local = "placa", categoria, tipoPorta, cor } = opc;
    if (categoria) usadas.add(categoria);
    if (!comp) { avisos.push(`${tagItem}: não há modelo nos catálogos para ${just || "este item"} — especificar manualmente.`); return null; }
    itens.push({ grupo, tag: tagItem, modelo: comp.modelo, descricao: comp.descricao, fabricante: comp.fabricante ?? "—", qtd, un, just, categoria: categoria ?? "" });
    if (zona || local === "porta") {
      if (opc.divisivel) inst.push({ tag: tagItem, modelo: comp.modelo, zona, local, h: comp.h, d: comp.d, divisivel: true, n: qtd, passo: comp.w });
      else for (let i = 0; i < qtd; i++) inst.push({ tag: tagItem, modelo: comp.modelo, zona, local, w: comp.w, h: comp.h, d: comp.d, tipoPorta, cor });
    }
    return comp;
  }

  // Disjuntor de carga: minidisjuntor até 125 A, caixa moldada acima.
  function disjuntorCarga(corrente, polos, descr, tagD, opc = {}) {
    const mini = cat.minidisjuntor(corrente, polos, L.minidisjuntor);
    if (mini) return add("Partidas e acionamentos", tagD, mini, { just: descr, zona: "protecao", categoria: "minidisjuntor", ...opc });
    return add("Partidas e acionamentos", tagD, cat.caixaMoldada(corrente, L.geral === "DWP" ? "DWP" : "AGW"), { just: descr, zona: "protecao", categoria: "geral", ...opc });
  }

  function comandoPorta(nome, tensaoSinal) {
    add("Comando e sinalização", tag("SS"), cat.seletora3pos(), { just: `Seleção Manual-0-Automático — ${nome}`, local: "porta", tipoPorta: "seletora", categoria: "sinalizacao" });
    add("Comando e sinalização", tag("LMP"), cat.sinaleiro("verde", L.sinalizacao, tensaoSinal), { just: `Ligado — ${nome}`, local: "porta", tipoPorta: "sinal", cor: "#16a34a", categoria: "sinalizacao" });
    add("Comando e sinalização", tag("LMP"), cat.sinaleiro("vermelho", L.sinalizacao, tensaoSinal), { just: `Falha térmica — ${nome}`, local: "porta", tipoPorta: "sinal", cor: "#dc2626", categoria: "sinalizacao" });
  }

  function contatorDe(corrente, nome, funcao, categoria = "AC-3") {
    const c = add("Partidas e acionamentos", tag("C"), cat.contator(corrente, L.contator, bobina, categoria), { just: `${funcao} — ${nome} (${fmt(corrente)} A)`, zona: "manobra", categoria: "contator" });
    if (c && bobina === "24Vcc") carga24 += c.ie <= 38 ? 0.25 : 0.4;
    return c;
  }

  const tensaoSinal = bobina === "220Vca" ? "220Vca" : "24V";
  const circuitos = cfg.porQuantidade ? [] : q.equipamentos.flatMap(circuitosDe);

  // -------------------------------------------------------------------------
  // Circuitos: corrente, acionamento, cabo de campo e pontos de automação
  // -------------------------------------------------------------------------
  for (const c of circuitos) {
    const fases = c.fases ?? 3;
    const tensaoCirc = fases === 3 ? V : 220;
    const qtd = c.qtd ?? 1;
    let corrente, origem, cosfi = 0.85, ipIn = 1;
    if (c.natureza === "motor") {
      const m = correnteMotor(c.kW, V);
      corrente = c.placa || m.corrente; origem = c.placa ? "corrente de placa informada" : m.fonte;
      ipIn = m.ipIn;
      maiorMotor = Math.max(maiorMotor, corrente);
    } else if (c.natureza === "resistiva") {
      corrente = correnteResistiva(c.kW, tensaoCirc, fases); origem = "I = P / (√3·V) — carga resistiva"; cosfi = 1;
    } else {
      corrente = c.placa || correnteCarga(c.kW, tensaoCirc, fases);
      origem = c.placa ? "corrente de placa informada" : fases === 3 ? "I = P / (√3·V·0,85)" : "I = P / (V·0,9)";
      cosfi = 0.9;
    }
    if (!(corrente > 0)) { avisos.push(`${c.nome}: informe a potência para dimensionar o circuito.`); continue; }

    const linha = { nome: c.nome, equip: c.equip, natureza: c.natureza, kW: c.kW, cv: c.kW / CV, corrente, qtd, fases, partida: c.natureza === "motor" ? c.partida : null, distancia: c.distancia, protecao: "—", acionamento: "—" };
    let inProtecao = 0; // corrente nominal do dispositivo que protege o cabo (0 = ajustável na corrente do motor)

    if (cfg.potencia) {
      if (c.natureza === "motor") {
        const p = c.partida;
        if (p === "direta" || p === "estrela") {
          const dm = cat.disjuntorMotor(corrente, L.disjuntorMotor);
          usadas.add("disjuntorMotor");
          if (dm) { add("Partidas e acionamentos", tag("DSJ"), dm, { just: `Proteção do motor ${c.nome} — In ${fmt(corrente)} A`, zona: "protecao", categoria: "disjuntorMotor" }); linha.protecao = `${dm.modelo} (${dm.faixa})`; }
          else {
            const cm = add("Partidas e acionamentos", tag("DSJ"), cat.caixaMoldada(corrente * 1.25, L.geral === "DWP" ? "DWP" : "AGW"), { just: `Proteção contra curto — ${c.nome} (acima de 100 A)`, zona: "protecao", categoria: "geral" });
            const rw = add("Partidas e acionamentos", tag("RT"), cat.releSobrecarga(p === "estrela" ? corrente * 0.58 : corrente), { just: `Sobrecarga — ${c.nome}`, zona: "manobra" });
            linha.protecao = [cm?.modelo, rw?.modelo].filter(Boolean).join(" + ") || "—";
            inProtecao = cm?.inom ?? 0;
          }
          if (p === "direta") {
            const k = contatorDe(corrente, c.nome, "Contator de partida direta");
            linha.acionamento = k?.modelo ?? "—";
          } else {
            const k1 = contatorDe(corrente * 0.58, c.nome, "K1 linha (0,58·In)");
            contatorDe(corrente * 0.58, c.nome, "K2 triângulo (0,58·In)");
            const k3 = contatorDe(corrente * 0.34, c.nome, "K3 estrela (0,33·In)");
            add("Partidas e acionamentos", tag("KT"), cat.FIXOS.temporizadorYD, { just: `Temporização estrela-triângulo — ${c.nome}`, zona: "manobra" });
            linha.acionamento = `Y-Δ: 2× ${k1?.modelo ?? "?"} + ${k3?.modelo ?? "?"}`;
          }
        } else if (p === "soft") {
          const ss = add("Partidas e acionamentos", tag("SSW"), cat.softStarter(corrente, L.softStarter), { just: `Soft-starter — ${c.nome} (In ${fmt(corrente)} A)`, zona: "drives", categoria: "softStarter" });
          const dm = cat.disjuntorMotor(corrente, L.disjuntorMotor);
          usadas.add("disjuntorMotor");
          if (dm) add("Partidas e acionamentos", tag("DSJ"), dm, { just: `Proteção da soft-starter — ${c.nome}`, zona: "protecao", categoria: "disjuntorMotor" });
          else { const cm = add("Partidas e acionamentos", tag("DSJ"), cat.caixaMoldada(corrente * 1.25, L.geral === "DWP" ? "DWP" : "AGW"), { just: `Proteção da soft-starter — ${c.nome}`, zona: "protecao", categoria: "geral" }); inProtecao = cm?.inom ?? 0; }
          linha.protecao = dm ? `${dm.modelo} (${dm.faixa})` : "Caixa moldada";
          linha.acionamento = ss?.modelo ?? "—";
          perdas += c.kW * 1000 * 0.005;
        } else if (p === "inversor") {
          const inv = add("Partidas e acionamentos", tag("INV"), cat.inversor(corrente, V), { just: `Inversor — ${c.nome} (In ${fmt(corrente)} A)`, zona: "drives", categoria: "inversor" });
          usadas.add("protInversor");
          const base = (inv?.inom ?? corrente) * 1.1;
          let prot;
          if (L.protInversor === "MPW") prot = cat.disjuntorMotor(corrente, L.disjuntorMotor);
          if (prot) add("Partidas e acionamentos", tag("DSJ"), prot, { just: `Proteção de entrada do inversor — ${c.nome}`, zona: "protecao", categoria: "disjuntorMotor" });
          else { prot = disjuntorCarga(base, 3, `Proteção de entrada do inversor — ${c.nome}`, tag("DSJ")); inProtecao = 0; }
          linha.protecao = prot?.modelo ?? "—";
          linha.acionamento = inv?.modelo ?? "—";
          perdas += c.kW * 1000 * 0.03;
          if (cfg.comando && !cfg.automacao) add("Comando e sinalização", tag("POT"), cat.FIXOS.potenciometro, { just: `Referência de velocidade — ${c.nome}`, local: "porta", tipoPorta: "pot", categoria: "sinalizacao" });
        } else { // motor EC: eletrônica embarcada, só proteção e sinal 0-10 V
          const d = disjuntorCarga(corrente * 1.25, 3, `Proteção do motor EC — ${c.nome}`, tag("DSJ"));
          linha.protecao = d?.modelo ?? "—"; linha.acionamento = "Motor EC (0-10 V)"; inProtecao = d?.inom ?? 0;
          if (cfg.comando && !cfg.automacao) add("Comando e sinalização", tag("POT"), cat.FIXOS.potenciometro, { just: `Referência de velocidade — ${c.nome}`, local: "porta", tipoPorta: "pot", categoria: "sinalizacao" });
        }
        if (cfg.comando) comandoPorta(c.nome, tensaoSinal);
      } else if (c.natureza === "resistiva") {
        if (c.controle === "scr") {
          const d = disjuntorCarga(corrente * 1.15, 3, `Proteção do aquecimento — ${c.nome}`, tag("DSJ"));
          const conv = cat.conversorPotencia(corrente, V);
          add("Partidas e acionamentos", tag("SCR"), conv ?? cat.FIXOS.ssr, { just: `Controle proporcional do aquecimento — ${c.nome} (${fmt(corrente)} A)`, zona: "drives" });
          if (!conv) avisos.push(`${c.nome}: corrente de ${fmt(corrente)} A acima do conversor MPCTPF (50 A) — especificar relé de estado sólido/tiristor adequado.`);
          contatorDe(corrente * 0.7, c.nome, "Contator de segurança do aquecimento (AC-1)", "AC-3, aplicado em AC-1");
          linha.protecao = d?.modelo ?? "—"; linha.acionamento = conv?.modelo ?? "SSR"; inProtecao = d?.inom ?? 0;
          perdas += corrente * 1.6 * 3;
        } else {
          const porEstagio = corrente / c.estagios;
          let d;
          for (let i = 1; i <= c.estagios; i++) {
            d = disjuntorCarga(porEstagio * 1.15, 3, `Proteção do estágio ${i} — ${c.nome}`, tag("DSJ"));
            contatorDe(porEstagio * 0.7, c.nome, `Contator do estágio ${i} (AC-1, ${fmt(porEstagio)} A)`, "AC-3, aplicado em AC-1");
          }
          linha.protecao = `${c.estagios}× ${d?.modelo ?? "—"}`; linha.acionamento = `${c.estagios} estágio(s)`;
          inProtecao = (d?.inom ?? 0) * c.estagios;
        }
      } else {
        const fator = c.fixo10 ? 0 : 1.25;
        const polos = fases === 3 ? 3 : 2;
        const d = c.fixo10
          ? add("Partidas e acionamentos", tag("DSJ"), cat.minidisjuntor(10, 2, L.minidisjuntor), { qtd, just: `${c.nome} — 200 W cada, disjuntor bipolar 10 A curva C`, zona: "protecao", categoria: "minidisjuntor" })
          : disjuntorCarga(corrente * fator, polos, `Proteção — ${c.nome} (${fmt(corrente)} A)`, tag("DSJ"));
        linha.protecao = d?.modelo ?? "—"; inProtecao = d?.inom ?? 0;
        if (c.umidificador && c.controle === "onoff") { const k = contatorDe(corrente, c.nome, "Contator do umidificador"); linha.acionamento = k?.modelo ?? "—"; }
        if (c.chiller) add("Automação e interfaces", tag("RL"), cat.FIXOS.releInterface, { just: `Intertravamento de comando — ${c.nome}`, zona: "controle", divisivel: true });
      }

      // Cabo de campo — NBR 5410
      // Estrela-triângulo: 6 condutores até o motor, cada um com In/√3 (dois ternos no mesmo conduto);
      // a queda vista pelo enrolamento equivale à de um circuito trifásico com 2/3 da corrente de linha.
      const yd = c.partida === "estrela" && c.natureza === "motor";
      const fs = c.natureza === "motor" ? Number(q.fatorServico) || 1 : 1;
      const ib = corrente * fs * (yd ? 0.58 : 1);
      const agrup = Number(q.agrupamento) * (yd ? 2 : 1);
      const cabo = dimensionarCabo({
        corrente: ib, correnteQueda: yd ? (corrente * fs * 2) / 3 : ib, tensao: tensaoCirc, comprimento: c.distancia, fases, cosfi,
        isolacao: q.isolacao, metodo: q.metodo, tempAmbiente: Number(q.tempAmbiente), agrupamento: agrup,
        quedaMax: Number(q.quedaMax), protecao: yd ? 0 : inProtecao
      });
      linha.cabo = cabo.secao; linha.pe = cabo.pe; linha.queda = cabo.quedaPct; linha.criterio = cabo.criterio; linha.iz = cabo.iz;
      if (cabo.excede) avisos.push(`${c.nome}: nenhuma seção até 300 mm² atende aos critérios — usar condutores em paralelo.`);
      memorial.push({
        tipo: "cabo", titulo: `Seção do cabo — ${c.nome}`, equipamento: c.nome, norma: `${REFERENCIAS.ampacidade}; ${REFERENCIAS.queda}`,
        // estrela-triângulo usa corrente de queda própria: sem passo a passo automático
        ...(yd ? {} : { valores: { modo: "corrente", corrente: ib, tensao: tensaoCirc, fases: fases === 3 ? 3 : 2, comprimento: c.distancia, cosfi, isolacao: q.isolacao, metodo: q.metodo, tempAmbiente: Number(q.tempAmbiente), agrupamento: agrup, quedaMax: Number(q.quedaMax), protecao: inProtecao } }),
        entradas: { "Corrente de projeto (A)": fmt(ib), "Tensão (V)": tensaoCirc, "Distância (m)": c.distancia, "Método": q.metodo, "Isolação": q.isolacao, "Temperatura (°C)": q.tempAmbiente, "Circuitos agrupados": agrup, "Queda máx. (%)": q.quedaMax, ...(yd ? { "Observação": "6 condutores, 0,58·In em cada" } : {}) },
        resultados: { "Seção adotada (mm²)": fmt(cabo.secao), "Critério determinante": cabo.criterio, "Iz corrigida (A)": fmt(cabo.iz, 1), "Fator k1 · k2": `${fmt(cabo.k1)} · ${fmt(cabo.k2)}`, "Queda de tensão (%)": fmt(cabo.quedaPct), "Condutor de proteção (mm²)": fmt(cabo.pe) }
      });
    }

    correntes.push({
      tipo: c.natureza === "motor" ? "motor" : "corrente", titulo: `Corrente nominal — ${c.nome}`, equipamento: c.nome,
      norma: c.natureza === "motor" ? "Tabela WEG W22 IR3 Premium 4 polos / EstruturadeCriação §3" : "EstruturadeCriação §3",
      entradas: { "Potência (kW)": fmt(c.kW), "Tensão (V)": tensaoCirc, "Sistema": fases === 3 ? "Trifásico" : "Monofásico/bifásico" },
      resultados: { "Corrente nominal (A)": fmt(corrente), "Origem": origem, ...(c.natureza === "motor" ? { "Potência (cv)": fmt(c.kW / CV, 1), "Corrente de partida direta (A)": fmt(corrente * ipIn, 0) } : {}) }
    });

    // Pontos de automação — EstruturadeCriação §2
    if (cfg.automacao) {
      if (c.natureza === "motor") {
        io.dout += 1; io.di += 1; // liga/desliga + seleção manual/automático
        if (c.partida === "inversor" || c.partida === "ec") io.ao += 1;
        if (c.valvula === "indireta") io.ao += 1;
      }
      if (c.natureza === "resistiva") { if (c.controle === "scr") io.ao += 1; else io.dout += c.estagios; }
      if (c.umidificador) { if (c.controle === "onoff") io.dout += 1; else io.ao += 1; }
      if (c.chiller) io.dout += 1;
      for (const l of c.leituras) if (LEITURAS[l]) io[LEITURAS[l][1]] += 1;
    }
    cargas.push(linha);
  }

  // -------------------------------------------------------------------------
  // Quadros por quantidade (comando / remoto)
  // -------------------------------------------------------------------------
  const qtdDisp = Math.max(1, Number(q.quantity) || 1);
  if (cfg.porQuantidade) {
    if (q.tipo === "comando") for (let i = 1; i <= qtdDisp; i++) comandoPorta(`dispositivo ${i}`, tensaoSinal);
    else { io.dout += qtdDisp; io.di += qtdDisp * 2; }
  }
  const nEquip = cfg.porQuantidade ? qtdDisp : q.equipamentos.length;

  // -------------------------------------------------------------------------
  // Corrente total e proteção geral — EstruturadeCriação §4.B
  // -------------------------------------------------------------------------
  const soma = cfg.potencia ? cargas.reduce((s, c) => s + c.corrente * c.qtd, 0) : 0;
  const correnteTotal = soma * (Number(q.fatorDemanda) || 100) / 100;
  const correnteGeral = correnteTotal + 0.25 * maiorMotor;
  const potenciaTotal = cfg.potencia ? cargas.reduce((s, c) => s + c.kW * c.qtd, 0) : 0;
  let geral = null, alimentador = null;

  if (cfg.potencia && cargas.length) {
    usadas.add("geral");
    const unico = q.equipamentos.length === 1 && q.equipamentos[0].tipo === "EXCV" && cargas.length === 1;
    let modo = L.geral;
    if (modo === "auto") modo = unico ? "MSW" : correnteGeral <= 63 ? "MDW" : "AGW";
    if (modo === "MSW") {
      geral = cat.seccionadora(correnteGeral * 1.25);
      if (geral) {
        add("Proteção geral e seccionamento", "DSJG", geral, { just: `Seccionamento geral sob carga — ${fmt(correnteGeral)} A × 1,25`, zona: "entrada", categoria: "geral" });
        inst.push({ tag: "DSJG", modelo: "Manopla", local: "porta", tipoPorta: "geral", w: 48, h: 48, cor: "#facc15" });
      } else { modo = "AGW"; avisos.push("Corrente geral acima de 160 A: seccionadora MSW substituída por disjuntor em caixa moldada."); }
    }
    if (modo === "MDW") {
      geral = cat.minidisjuntor(correnteGeral, 3, L.minidisjuntor);
      if (geral) add("Proteção geral e seccionamento", "DSJG", geral, { just: `Disjuntor geral — soma das correntes simultâneas ${fmt(correnteGeral)} A`, zona: "entrada", categoria: "geral" });
      else modo = "AGW";
    }
    if (modo === "AGW" || modo === "DWP") {
      const cm = cat.caixaMoldada(correnteGeral, modo);
      const just = cm ? `Disjuntor geral — soma das correntes simultâneas ${fmt(correnteGeral)} A` : `disjuntor geral de ${fmt(correnteGeral)} A (acima de 800 A: disjuntor aberto, fora dos catálogos da base)`;
      geral = add("Proteção geral e seccionamento", "DSJG", cm, { just, zona: "entrada", categoria: "geral" });
    }
    memorial.push({
      tipo: "corrente", titulo: "Corrente total e proteção geral", equipamento: "Quadro", norma: `${REFERENCIAS.sobrecarga}; EstruturadeCriação §4.B`,
      entradas: { "Soma das correntes (A)": fmt(soma), "Fator de demanda (%)": q.fatorDemanda, "Maior motor (A)": fmt(maiorMotor) },
      resultados: { "Corrente total (A)": fmt(correnteTotal), "Corrente de dimensionamento (A)": `${fmt(correnteGeral)} (total + 25% do maior motor)`, "Dispositivo geral": geral ? `${geral.modelo} — ${geral.inom} A` : "especificar" }
    });

    alimentador = dimensionarCabo({
      corrente: correnteGeral, tensao: V, comprimento: Number(q.distanciaAlimentador) || 0, fases: 3, cosfi: 0.85, isolacao: q.isolacao,
      metodo: q.metodo, tempAmbiente: Number(q.tempAmbiente), agrupamento: 1, quedaMax: Number(q.quedaMax),
      protecao: modo === "MSW" ? 0 : geral?.inom ?? 0
    });
    if (alimentador.excede) avisos.push(`Alimentador do quadro: ${fmt(correnteGeral)} A excede a capacidade de um cabo de 300 mm² — usar condutores em paralelo ou barramento blindado.`);
    memorial.push({
      tipo: "cabo", titulo: "Alimentador do quadro", equipamento: "Quadro", norma: `${REFERENCIAS.ampacidade}; ${REFERENCIAS.queda}`,
      valores: { modo: "corrente", corrente: correnteGeral, tensao: V, fases: 3, comprimento: Number(q.distanciaAlimentador) || 0, cosfi: 0.85, isolacao: q.isolacao, metodo: q.metodo, tempAmbiente: Number(q.tempAmbiente), agrupamento: 1, quedaMax: Number(q.quedaMax), protecao: modo === "MSW" ? 0 : geral?.inom ?? 0 },
      entradas: { "Corrente (A)": fmt(correnteGeral), "Tensão (V)": V, "Distância (m)": q.distanciaAlimentador || 0, "Método": q.metodo, "Isolação": q.isolacao },
      resultados: { "Seção das fases (mm²)": fmt(alimentador.secao), "Critério": alimentador.criterio, "Iz corrigida (A)": fmt(alimentador.iz, 1), "Queda de tensão (%)": fmt(alimentador.quedaPct), "Condutor de proteção (mm²)": fmt(alimentador.pe) }
    });

    if (q.dps) {
      usadas.add("dps");
      const temNeutro = V === 380 && (cfg.comando || cfg.automacao);
      if (V <= 380) {
        add("Proteção geral e seccionamento", "DPS", cat.dps(L.dps), { qtd: temNeutro ? 4 : 3, just: `Proteção contra surtos na entrada (${temNeutro ? "3F + N" : "3F"}) — ${REFERENCIAS.dps}`, zona: "entrada", categoria: "dps" });
        add("Proteção geral e seccionamento", tag("DSJ"), cat.minidisjuntor(32, 3, L.minidisjuntor), { just: "Proteção de retaguarda do DPS — confirmar com o limite do fabricante", zona: "entrada", categoria: "minidisjuntor" });
      } else {
        add("Proteção geral e seccionamento", "DPS", { modelo: "DPS Classe II — Uc ≥ 320 V", fabricante: "—", descricao: "DPS monopolar Classe II com Uc ≥ 320 V para rede 440 V", w: 18, h: 90, d: 67 }, { qtd: 3, just: `Rede 440 V: a linha SPW03-275 (Uc 275 V) dos catálogos não atende — ${REFERENCIAS.dps}`, zona: "entrada" });
        avisos.push("Rede 440 V: o DPS SPW03-275 dos catálogos tem Uc 275 V, inferior ao necessário. Especificar DPS com Uc ≥ 320 V.");
      }
    }
    if (correnteGeral > 75) add("Infraestrutura", "BAR-F", cat.FIXOS.barramentoForca, { un: "kit", just: `Corrente geral ${fmt(correnteGeral)} A > 75 A — barramento de força com kit de fixação` });
  }

  // -------------------------------------------------------------------------
  // Alimentação de comando — EstruturadeCriação §4.C
  // -------------------------------------------------------------------------
  const temControle = cfg.comando || cfg.automacao;
  if (temControle) {
    usadas.add("minidisjuntor");
    if (V === 440) {
      add("Alimentação de comando", "TR-01", cat.FIXOS.trafo, { just: "Rede 440 V com comando/automação — transformador abaixador 440/220 V obrigatório", zona: "entrada" });
      add("Alimentação de comando", tag("DSJ"), cat.minidisjuntor(4, 2, L.minidisjuntor), { just: "Proteção do primário do transformador de comando", zona: "entrada", categoria: "minidisjuntor" });
      add("Alimentação de comando", tag("DSJ"), cat.minidisjuntor(6, 1, L.minidisjuntor), { just: "Proteção do circuito de comando 220 V (secundário)", zona: "entrada", categoria: "minidisjuntor" });
    } else {
      add("Alimentação de comando", tag("DSJ"), cat.minidisjuntor(10, V === 380 ? 1 : 2, L.minidisjuntor), { just: `Proteção do circuito de comando 220 V (${V === 380 ? "fase-neutro" : "fase-fase"})`, zona: "entrada", categoria: "minidisjuntor" });
    }
  } else if (cfg.potencia && itens.some((i) => i.categoria === "contator")) {
    avisos.push("Quadro do tipo Potência: os contatores precisam de alimentação de comando externa (não incluída neste quadro).");
  }
  add("Alimentação de comando", "TG-1", cat.FIXOS.tomada, { just: `Tomada de serviço interna — ${REFERENCIAS.tomada}`, zona: "entrada" });
  add("Alimentação de comando", tag("DSJ"), cat.minidisjuntor(10, 2, L.minidisjuntor), { just: "Proteção da tomada auxiliar", zona: "entrada", categoria: "minidisjuntor" });
  usadas.add("minidisjuntor");

  // -------------------------------------------------------------------------
  // Automação — CLP, IHM, interfaces e fonte 24 Vcc
  // -------------------------------------------------------------------------
  let clp = null;
  if (cfg.automacao) {
    usadas.add("clp");
    const pecas = cat.controlador(io, L.clp);
    clp = pecas[0];
    pecas.forEach((p, i) => add("Automação e interfaces", i === 0 ? "CLP-01" : i === 1 && p.acessorio ? "CLP-01" : tag("EXP"), p, { qtd: p.qtd ?? 1, just: i === 0 ? `Pontos necessários: ${io.di} DI, ${io.ai} AI, ${io.dout} DO, ${io.ao} AO` : "Acessório do controlador", zona: p.acessorio ? undefined : "controle", categoria: "clp" }));
    if (io.dout > 0) add("Automação e interfaces", io.dout > 1 ? `RL1...RL${io.dout}` : "RL1", cat.FIXOS.releInterface, { qtd: io.dout, just: "1 relé de interface por saída digital do CLP", zona: "controle", divisivel: true });
    if (q.hasIhm) add("Automação e interfaces", "IHM-01", cat.ihm(q.ihmSize), { just: "Operação local na porta do painel", local: "porta", tipoPorta: "ihm" });
    if (q.hasSupervisorio) add("Automação e interfaces", "GW-01", { modelo: "Gateway Modbus / BACnet", fabricante: "CAREL / a definir", descricao: "Interface de comunicação para supervisório — Modbus RTU/TCP ou BACnet", w: 36, h: 90, d: 60 }, { just: "Integração com o sistema supervisório", zona: "controle" });
    carga24 += 0.6 + (q.hasIhm ? 1 : 0) + io.dout * 0.02 + io.ai * 0.03;
    memorial.push({
      tipo: "automacao", titulo: "Pontos de automação (E/S)", equipamento: "Quadro", norma: "EstruturadeCriação §2",
      entradas: { "Equipamentos": nEquip }, resultados: { "Entradas digitais": io.di, "Entradas analógicas": io.ai, "Saídas digitais": io.dout, "Saídas analógicas": io.ao, "Controlador": clp?.modelo ?? "—" }
    });
  }
  let fonte = null;
  if (cfg.automacao || (temControle && bobina !== "220Vca")) {
    usadas.add("fonte");
    const necessario = Math.max(carga24 * 1.3, cfg.automacao ? 2.5 : 0.5);
    fonte = add("Alimentação de comando", "FTC-01", cat.fonte24(necessario), { just: `Carga 24 Vcc estimada ${fmt(carga24)} A + 30% de reserva${cfg.automacao ? " (mínimo 2,5 A com CLP)" : ""}`, zona: "entrada", categoria: "fonte" });
    add("Alimentação de comando", tag("DSJ"), cat.minidisjuntor(6, 2, L.minidisjuntor), { just: "Proteção da fonte 24 Vcc", zona: "entrada", categoria: "minidisjuntor" });
    memorial.push({
      tipo: "fonte", titulo: "Fonte 24 Vcc", equipamento: "Quadro", norma: "EstruturadeCriação §4.C",
      entradas: { "Carga estimada (A)": fmt(carga24), "Reserva (%)": 30 }, resultados: { "Corrente mínima (A)": fmt(necessario), "Fonte selecionada": fonte?.modelo ?? "—" }
    });
  }

  // -------------------------------------------------------------------------
  // Ventilação forçada — EstruturadeCriação §4.D
  // -------------------------------------------------------------------------
  let ventilacao = null;
  if (perdas > 0) {
    const vazao = (3.1 * (perdas + 30)) / 10;
    const kits = Math.max(1, Math.ceil(vazao / 100));
    ventilacao = { perdas: perdas + 30, vazao, kits };
    add("Infraestrutura", "VNT", cat.FIXOS.ventilacao, { qtd: kits, un: "kit", just: `Perdas ${fmt(perdas + 30, 0)} W → ${fmt(vazao, 0)} m³/h (ΔT 10 K)`, local: "porta", tipoPorta: "vent" });
    memorial.push({
      tipo: "ventilacao", titulo: "Ventilação forçada do painel", equipamento: "Quadro", norma: "V = 3,1 · P / ΔT (m³/h)",
      entradas: { "Perdas dissipadas (W)": fmt(perdas + 30, 0), "ΔT admissível (K)": 10 }, resultados: { "Vazão necessária (m³/h)": fmt(vazao, 0), "Kits de ventilação": kits }
    });
  }

  // -------------------------------------------------------------------------
  // Bornes — EstruturadeCriação §4.E
  // -------------------------------------------------------------------------
  usadas.add("borne");
  let bornesForca = 0;
  if (cfg.potencia) {
    const porBorne = new Map();
    for (const c of cargas) {
      const b = cat.borne(c.cabo, L.borne);
      const qtdB = ((c.partida === "estrela" ? 6 : c.fases === 3 ? 3 : 2) + 1) * c.qtd;
      porBorne.set(b.modelo, { b, qtd: (porBorne.get(b.modelo)?.qtd ?? 0) + qtdB });
    }
    for (const { b, qtd } of [...porBorne.values()].sort((x, y) => x.b.secao - y.b.secao)) {
      add("Bornes e acessórios", "XP", b, { qtd, just: "Saída de força: fases + PE por circuito, na seção do cabo de campo", zona: "bornes", divisivel: true, categoria: "borne" });
      bornesForca += qtd;
    }
  }
  const bornesComando = Math.max(0, cfg.bornes * nEquip - bornesForca);
  if (bornesComando > 0) add("Bornes e acessórios", "X1", cat.borne(2.5, L.borne), { qtd: bornesComando, just: `${cfg.bornes} bornes por equipamento × ${nEquip} − ${bornesForca} de força`, zona: "bornes", divisivel: true, categoria: "borne" });
  const acess = (modelo, descricao, qtd, just) => add("Bornes e acessórios", "", { modelo, descricao, fabricante: "WEG" }, { qtd, just });
  acess("Poste final BTW", "Poste final de travamento para trilho DIN 35 mm", 2, "Travamento das réguas de bornes");
  add("Bornes e acessórios", "PE", { ...cat.borne(2.5, L.borne), modelo: `${cat.borne(2.5, L.borne).modelo}T`, descricao: "Borne de terra verde/amarelo 2,5 mm²" }, { qtd: 3, just: "Aterramento da régua", zona: "bornes", divisivel: true, categoria: "borne" });
  acess("TF-BTWP 2,5-10", "Tampa de fechamento final de borne", 3, "Fechamento das réguas");
  acess("Cartela de identificação", "Cartela de identificação numérica de bornes (5 mm, linha BTW)", 2, "Identificação dos bornes");

  // -------------------------------------------------------------------------
  // Barramentos, caixa, trilhos e canaletas — EstruturadeCriação §4.A
  // -------------------------------------------------------------------------
  usadas.add("barramento"); usadas.add("caixa");
  add("Infraestrutura", "BRT", cat.FIXOS.barraTerra(L.barramento), { just: "Barramento de terra (PE)", zona: "bornes", categoria: "barramento" });
  if (temControle) add("Infraestrutura", "BRN", cat.FIXOS.barraNeutro(L.barramento), { just: "Barramento de neutro — painel com comando/automação", zona: "bornes", categoria: "barramento" });

  const nInversores = n.INV ?? 0;
  const minimo = nInversores >= 2 || nEquip > 3 ? { a: 800, l: 600, p: 200 } : { a: 400, l: 300, p: 200 };
  const layout = montarLayout(inst, { linha: L.caixa, minimo, reserva: Number(q.reserva) || 0 });
  const cx = layout.caixa;
  if (!layout.cabe) avisos.push(`Os componentes não cabem em um único ${L.caixa === "BRCE" ? "modelo de caixa BRCE" : "armário do catálogo"}: dividir em colunas acopladas ou reduzir a reserva de espaço.`);
  itens.unshift({ grupo: "Infraestrutura", tag: "QMON", modelo: cx.modelo, descricao: cx.descricao, fabricante: "BRUM", qtd: 1, un: "un", just: `Menor ${cx.linha === "BRK" ? "armário" : "caixa"} que comporta os componentes com ${q.reserva}% de reserva (profundidade útil ≥ ${layout.profundidade + 20} mm)`, categoria: "caixa" });
  const trilho = Math.max(1, Math.ceil((layout.linhas.length * layout.util) / 1000));
  add("Infraestrutura", "", { modelo: "Trilho DIN 35 mm perfurado", descricao: "Trilho DIN TS35 × 7,5 mm perfurado, barra de 1 m", fabricante: "—" }, { qtd: trilho, un: "barra", just: `${layout.linhas.length} linha(s) de montagem × ${fmt(layout.util, 0)} mm` });
  const canal = (modelo, qtd, just) => add("Infraestrutura", "", { modelo: `Canaleta ${modelo}`, descricao: `Canaleta de PVC ${modelo} mm com rasgos laterais e tampa, barra de 2 m`, fabricante: "—" }, { qtd, un: "barra", just });
  if (layout.pequeno) canal("30×50", 2, "Quadro pequeno");
  else { canal("50×80", 4, "Quadro médio/grande — força"); canal("30×80", 2, "Quadro médio/grande — comando"); }
  memorial.push({
    tipo: "caixa", titulo: "Dimensões do quadro", equipamento: "Quadro", norma: `${REFERENCIAS.conjunto}; EstruturadeCriação §4.A`,
    entradas: { "Componentes na placa": inst.filter((i) => i.local === "placa").length, "Itens na porta": layout.porta.length, "Reserva de espaço (%)": q.reserva, "Profundidade do maior componente (mm)": layout.profundidade },
    resultados: { "Caixa selecionada": cx.modelo, "Dimensões A × L × P (mm)": `${cx.a} × ${cx.l} × ${cx.p}`, "Placa de montagem (mm)": `${cx.placaA} × ${cx.placaL}`, "Linhas de trilho": layout.linhas.length, "Altura ocupada (mm)": fmt(layout.altura ?? 0, 0) }
  });

  // -------------------------------------------------------------------------
  // Cabos — EstruturadeCriação §4.F e cabos de campo
  // -------------------------------------------------------------------------
  const cabo = (grupo, modelo, descricao, qtd, just) => qtd > 0 && add(grupo, "", { modelo, descricao, fabricante: "—" }, { qtd: Math.ceil(qtd), un: "m", just });
  const porEquip = { "potencia-comando": [50, 25, 25], completo: [50, 25, 25], automacao: [50, 25, 25], comando: [10, 10, 10], remoto: [50, 50, 50] }[q.tipo];
  if (porEquip) {
    ["cinza", "vermelho", "azul"].forEach((cor, i) => cabo("Cabos internos", `Cabo flexível 1,0 mm² ${cor}`, `Cabo de cobre flexível 750 V 1,0 mm² ${cor} — fiação de comando`, porEquip[i] * nEquip, `${porEquip[i]} m por ${cfg.porQuantidade ? "dispositivo" : "equipamento"} × ${nEquip}`));
  }
  if (cfg.potencia) {
    const interno = new Map(), campo = new Map(), campoPE = new Map();
    for (const c of cargas) {
      const f = c.fases === 3 ? 3 : 2;
      interno.set(c.cabo, (interno.get(c.cabo) ?? 0) + 2 * f * c.qtd);
      if (c.distancia > 0) {
        campo.set(c.cabo, (campo.get(c.cabo) ?? 0) + c.distancia * f * c.qtd * (c.partida === "estrela" ? 2 : 1));
        campoPE.set(c.pe, (campoPE.get(c.pe) ?? 0) + c.distancia * c.qtd);
      }
    }
    for (const [s, m] of [...interno].sort((a, b) => a[0] - b[0])) cabo("Cabos internos", `Cabo flexível ${fmt(s)} mm² preto`, `Cabo de cobre flexível 750 V ${fmt(s)} mm² preto — fiação de força interna`, m, "Estimativa: 2 m por fase e por circuito");
    for (const [s, m] of [...campo].sort((a, b) => a[0] - b[0])) cabo("Cabos de campo", `Cabo ${fmt(s)} mm² — fases`, `Cabo de cobre flexível ${q.isolacao === "EPR" ? "0,6/1 kV HEPR 90 °C" : "PVC 70 °C"} ${fmt(s)} mm² — alimentação dos equipamentos`, m, "Distância × nº de fases, por circuito (NBR 5410)");
    for (const [s, m] of [...campoPE].sort((a, b) => a[0] - b[0])) cabo("Cabos de campo", `Cabo ${fmt(s)} mm² verde/amarelo`, `Cabo de cobre flexível ${fmt(s)} mm² verde/amarelo — condutor de proteção`, m, REFERENCIAS.pe);
  }

  // -------------------------------------------------------------------------
  // Consolidação da lista — itens iguais do mesmo grupo somam quantidades
  // -------------------------------------------------------------------------
  const ordemGrupos = ["Infraestrutura", "Proteção geral e seccionamento", "Alimentação de comando", "Partidas e acionamentos", "Automação e interfaces", "Comando e sinalização", "Bornes e acessórios", "Cabos internos", "Cabos de campo"];
  const mapa = new Map();
  for (const i of itens) {
    const chave = `${i.grupo}|${i.modelo}|${i.descricao}|${i.tag.replace(/\d+$/, "")}`;
    const e = mapa.get(chave);
    if (e) { e.qtd += i.qtd; e.tags.push(i.tag); e.justs.add(i.just); }
    else mapa.set(chave, { ...i, tags: [i.tag], justs: new Set([i.just]) });
  }
  const bom = [...mapa.values()].map(({ tags, justs, ...i }) => ({
    ...i, tag: juntarTags(tags), just: justs.size > 2 ? `${[...justs][0]} (+${justs.size - 1} aplicações)` : [...justs].join("; ")
  })).sort((a, b) => ordemGrupos.indexOf(a.grupo) - ordemGrupos.indexOf(b.grupo));

  const protecoes = [
    ["Proteção geral", geral ? `${geral.modelo} — ${geral.descricao}` : cfg.potencia ? "A especificar" : "Não se aplica (sem circuitos de força)"],
    ["Alimentador do quadro", alimentador ? (alimentador.excede ? "Acima de 300 mm² — condutores em paralelo" : `3 × ${fmt(alimentador.secao)} mm² + PE ${fmt(alimentador.pe)} mm² (${alimentador.criterio})`) : "—"],
    ["Transformador de comando", V === 440 && temControle ? "440/220 V — 400 VA" : "Não necessário"],
    ["Tensão de comando", cat.BOBINAS[bobina]],
    ["Fonte 24 Vcc", fonte ? `${fonte.modelo}` : "Não necessária"],
    ["CLP", clp ? `${clp.modelo} — ${io.di} DI, ${io.ai} AI, ${io.dout} DO, ${io.ao} AO` : "Sem automação"],
    ["IHM", cfg.automacao && q.hasIhm ? `Touch ${q.ihmSize}` : "Não"],
    ["Supervisório", cfg.automacao && q.hasSupervisorio ? "Modbus / BACnet via gateway" : "Não"],
    ["Ventilação forçada", ventilacao ? `${ventilacao.kits} kit(s) — ${fmt(ventilacao.vazao, 0)} m³/h` : "Natural"],
    ["DPS", cfg.potencia && q.dps ? (V <= 380 ? cat.dps(L.dps).modelo : "Uc ≥ 320 V (fora dos catálogos)") : "Não incluído"]
  ];

  return {
    resumo: {
      nome: q.nome, tensao: V, tipo: cfg.rotulo, correnteTotal, correnteGeral, potenciaTotal, nEquip,
      caixa: cx.modelo, dimensoes: `${cx.a} × ${cx.l} × ${cx.p} mm`, itens: bom.length
    },
    cargas, bom, protecoes, memorial: [...correntes, ...memorial], layout, avisos, linhas: L,
    categoriasUsadas: Object.keys(cat.CATEGORIAS).filter((k) => usadas.has(k))
  };
}

// Lista de materiais em CSV (separador ";" para abrir direto no Excel em pt-BR).
export function bomParaCSV(resultado) {
  const cab = ["Grupo", "TAG", "Modelo", "Descrição", "Qtd", "Un", "Fabricante", "Justificativa técnica"];
  const linhas = resultado.bom.map((i) => [i.grupo, i.tag, i.modelo, i.descricao, i.qtd, i.un, i.fabricante, i.just]);
  return "﻿" + [cab, ...linhas].map((l) => l.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
}
