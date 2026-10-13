// Dados de seleção extraídos dos catálogos da pasta "Base De Consulta" e dos
// projetos de referência da pasta "Projetos". Dimensões (l × a × p, em mm) são
// aproximadas e servem para o pré-dimensionamento da caixa e o desenho do layout.

const acima = (lista, valor) => lista.find((x) => x >= valor);

// ---------------------------------------------------------------------------
// Linhas de produto selecionáveis por categoria de peça
// ---------------------------------------------------------------------------
export const CATEGORIAS = {
  geral: {
    rotulo: "Proteção / seccionamento geral", padrao: "auto",
    opcoes: [
      ["auto", "Automático — seccionadora MSW para 1 equipamento, disjuntor para vários"],
      ["MSW", "WEG MSW — chave seccionadora rotativa (16 a 160 A)"],
      ["MDW", "WEG MDW — minidisjuntor tripolar curva C (até 125 A)"],
      ["AGW", "WEG AGW — disjuntor em caixa moldada (15 a 800 A)"],
      ["DWP", "WEG DWP — disjuntor em caixa moldada (16 a 800 A)"]
    ]
  },
  disjuntorMotor: {
    rotulo: "Disjuntor-motor", padrao: "MPW40",
    opcoes: [["MPW40", "WEG MPW40 — 0,1 a 40 A (padrão dos projetos)"], ["MPW18", "WEG MPW18 — 0,1 a 18 A"]]
  },
  contator: {
    rotulo: "Contator de potência", padrao: "CWB",
    opcoes: [["CWB", "WEG CWB — 9 a 125 A"], ["CWM", "WEG CWM — 9 a 800 A"], ["CWC", "WEG CWC0 — minicontator 7 a 22 A"]]
  },
  minidisjuntor: {
    rotulo: "Minidisjuntor (comando, tomada, cargas)", padrao: "MDW",
    opcoes: [["MDW", "WEG MDW — 3 kA (NBR NM 60898)"], ["MDWH", "WEG MDWH — alta capacidade, 10 kA"]]
  },
  protInversor: {
    rotulo: "Proteção de entrada do inversor", padrao: "MDW",
    opcoes: [["MDW", "Minidisjuntor tripolar curva C (EstruturadeCriação)"], ["MPW", "Disjuntor-motor MPW (padrão dos projetos)"]]
  },
  inversor: { rotulo: "Inversor de frequência", padrao: "CFW500", opcoes: [["CFW500", "WEG CFW500"]] },
  softStarter: {
    rotulo: "Soft-starter", padrao: "auto",
    opcoes: [
      ["auto", "Automático — SSW05 até 85 A, SSW07 acima"],
      ["SSW05", "WEG SSW05 — 3 a 85 A (micro)"],
      ["SSW07", "WEG SSW07 — 17 a 412 A"],
      ["SSW900", "WEG SSW900 — 10 a 1400 A"]
    ]
  },
  fonte: { rotulo: "Fonte 24 Vcc", padrao: "PSS24-W", opcoes: [["PSS24-W", "WEG PSS24-W — chaveada monofásica"]] },
  sinalizacao: {
    rotulo: "Comando e sinalização (porta)", padrao: "CSW",
    opcoes: [["CSW", "WEG CSW — Ø 22 mm modular"], ["CEW", "WEG CEW-SM — sinaleiro monobloco LED (padrão dos projetos)"]]
  },
  borne: { rotulo: "Bornes", padrao: "BTWP", opcoes: [["BTWP", "WEG BTWP — conexão por parafuso"], ["BTWM", "WEG BTWM — conexão por mola"]] },
  caixa: {
    rotulo: "Caixa / armário", padrao: "auto",
    opcoes: [
      ["auto", "Automático — caixa BRCE; armário BRK quando não couber"],
      ["BRCE", "Caixa para proteção BRCE — IP66 (200 a 1200 mm)"],
      ["BRK", "Armário modular BRK — IP55 (1100 a 2200 mm)"]
    ]
  },
  barramento: {
    rotulo: "Barramentos neutro / terra", padrao: "BDS",
    opcoes: [["BDS", "Sibratec BDS — barramento para trilho DIN (padrão dos projetos)"], ["COBRE", "Barra de cobre com isoladores"]]
  },
  dps: { rotulo: "DPS", padrao: "SPW03-45", opcoes: [["SPW03-45", "WEG SPW03-275-45 — Classe II, Imáx 45 kA"], ["SPW03-20", "WEG SPW03-275-20 — Classe II, Imáx 20 kA"], ["SPW03-60", "WEG SPW03-275-60/12,5 — Classe I+II"]] },
  clp: {
    rotulo: "Controlador (CLP)", padrao: "CAREL",
    opcoes: [["CAREL", "CAREL c.pCO (padrão dos projetos)"], ["DEFINIR", "A definir pelo projetista"]]
  }
};

export const BOBINAS = { "220Vca": "220 Vca", "24Vcc": "24 Vcc", "24Vca": "24 Vca" };

// ---------------------------------------------------------------------------
// Disjuntores-motores MPW — catálogo WEG 50009822
// ---------------------------------------------------------------------------
const MPW_BASE = [
  [0.1, 0.16, "C016"], [0.16, 0.25, "C025"], [0.25, 0.4, "D004"], [0.4, 0.63, "C063"], [0.63, 1, "U001"],
  [1, 1.6, "D016"], [1.6, 2.5, "D025"], [2.5, 4, "U004"], [4, 6.3, "D063"], [6.3, 10, "U010"], [10, 16, "U016"]
];
const MPW = {
  MPW18: { faixas: [...MPW_BASE, [12, 18, "U018"]], w: 45, h: 97, d: 77 },
  MPW40: { faixas: [...MPW_BASE, [16, 20, "U020"], [20, 25, "U025"], [25, 32, "U032"], [32, 40, "U040"]], w: 45, h: 97, d: 91 },
  MPW80: { faixas: [[32, 40, "U040"], [40, 50, "U050"], [50, 65, "U065"], [65, 80, "U080"]], w: 54, h: 140, d: 122 },
  MPW100: { faixas: [[55, 75, "U075"], [70, 90, "U090"], [80, 100, "U100"]], w: 70, h: 165, d: 171 }
};

export function disjuntorMotor(corrente, linha = "MPW40") {
  const ordem = [linha, "MPW40", "MPW80", "MPW100"].filter((l, i, a) => a.indexOf(l) === i);
  for (const l of ordem) {
    const f = MPW[l].faixas.find(([min, max]) => corrente >= min * 0.999 && corrente <= max);
    if (f) {
      const faixa = `${num(f[0])} a ${num(f[1])} A`;
      return {
        modelo: `${l}-3-${f[2]}`, fabricante: "WEG", faixa, min: f[0], max: f[1],
        descricao: `Disjuntor-motor termomagnético ${faixa} — proteção contra sobrecarga e curto-circuito`,
        w: MPW[l].w, h: MPW[l].h, d: MPW[l].d
      };
    }
  }
  return null; // acima de 100 A: disjuntor em caixa moldada + relé de sobrecarga
}

// ---------------------------------------------------------------------------
// Contatores — catálogos WEG CWB 50042424, CWM 50051271 e panorama 50040226
// Corrente de emprego AC-3 (Ue ≤ 440 V)
// ---------------------------------------------------------------------------
const CONTATORES = {
  CWC: { correntes: [7, 9, 12, 16, 22], nomes: ["CWC07", "CWC09", "CWC012", "CWC016", "CWC025"] },
  CWB: { correntes: [9, 12, 18, 25, 32, 38, 40, 50, 65, 80, 95, 110, 125] },
  CWM: { correntes: [9, 12, 18, 25, 32, 40, 50, 65, 80, 95, 105, 112, 150, 180, 215, 250, 300, 400, 500, 630, 800] }
};

function bobinaCodigo(linha, ie, bobina) {
  if (linha === "CWB" && ie >= 95) return bobina === "220Vca" ? "E65" : "E04";
  if (linha === "CWM" && ie >= 112) return bobina === "220Vca" ? "E65" : "E02";
  if (bobina === "24Vcc") return linha === "CWM" && ie >= 40 ? "C34" : "C03";
  return bobina === "24Vca" ? "D02" : "D23";
}

function dimContator(linha, ie) {
  if (linha === "CWC") return [45, 58, 52];
  if (linha === "CWB") return ie <= 38 ? [45, 85, 98] : ie <= 80 ? [54, 117, 126] : [72, 122, 147];
  if (ie <= 25) return [45, 81, 87];
  if (ie <= 40) return [55, 89, 98];
  if (ie <= 105) return [75, 125, 126];
  if (ie <= 180) return [121, 163, 147];
  if (ie <= 300) return [139, 183, 172];
  return [148, 200, 181];
}

export function contator(corrente, linha = "CWB", bobina = "220Vca", categoria = "AC-3") {
  const ordem = [linha, "CWB", "CWM"].filter((l, i, a) => a.indexOf(l) === i);
  for (const l of ordem) {
    const c = CONTATORES[l];
    const ie = acima(c.correntes, corrente);
    if (!ie) continue;
    const nome = l === "CWC" ? c.nomes[c.correntes.indexOf(ie)] : `${l}${ie}`;
    const aux = l === "CWM" ? (ie >= 112 ? "22" : ie >= 40 ? "11" : "10") : l === "CWB" ? "11" : "10";
    const [w, h, d] = dimContator(l, ie);
    return {
      modelo: `${nome}-${aux}-30${bobinaCodigo(l, ie, bobina)}`, fabricante: "WEG", ie,
      descricao: `Contator tripolar ${ie} A (${categoria}) — bobina ${BOBINAS[bobina]}`,
      w, h, d
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Relés de sobrecarga RW — catálogo WEG 50042397
// ---------------------------------------------------------------------------
const RW = [
  ["RW27-2D3", [[0.28, 0.4, "D004"], [0.4, 0.63, "C063"], [0.56, 0.8, "D008"], [0.8, 1.2, "D012"], [1.2, 1.8, "D018"], [1.8, 2.8, "D028"], [2.8, 4, "U004"], [4, 6.3, "D063"], [5.6, 8, "U008"], [7, 10, "U010"], [8, 12.5, "D125"], [10, 15, "U015"], [11, 17, "U017"], [15, 23, "U023"], [22, 32, "U032"], [32, 40, "U040"]], [45, 82, 90]],
  ["RW67-2D3", [[40, 57, "U057"], [50, 63, "U063"], [57, 70, "U070"], [63, 80, "U080"]], [50, 106, 110]],
  ["RW117-2D3", [[75, 97, "U097"], [90, 112, "U112"]], [75, 99, 120]],
  ["RW317-1D3", [[100, 150, "U150"], [140, 215, "U215"], [200, 310, "U310"], [275, 420, "U420"]], [120, 155, 150]],
  ["RW407-1D3", [[400, 600, "U600"], [560, 840, "U840"]], [260, 166, 182]]
];

export function releSobrecarga(corrente) {
  for (const [serie, faixas, [w, h, d]] of RW) {
    const f = faixas.find(([min, max]) => corrente >= min && corrente <= max);
    if (f) {
      const faixa = `${num(f[0])} a ${num(f[1])} A`;
      return { modelo: `${serie}-${f[2]}`, fabricante: "WEG", faixa, descricao: `Relé de sobrecarga térmico ${faixa} — classe 10`, w, h, d };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Minidisjuntores MDW / MDWH — catálogo WEG 50009824 (NBR NM 60898)
// ---------------------------------------------------------------------------
const MDW_CORRENTES = { MDW: [2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100, 125], MDWH: [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125] };
const POLOS = { 1: "monopolar", 2: "bipolar", 3: "tripolar", 4: "tetrapolar" };

export function minidisjuntor(corrente, polos = 1, linha = "MDW", curva = "C") {
  const l = MDW_CORRENTES[linha] ? linha : "MDW";
  const inom = acima(MDW_CORRENTES[l], corrente);
  if (!inom) return null;
  const larguraPolo = inom >= 80 ? 27 : 18;
  return {
    modelo: `${l}-${curva}${inom}${polos > 1 ? "-" + polos : ""}`, fabricante: "WEG", inom,
    descricao: `Minidisjuntor ${POLOS[polos]} ${inom} A, curva ${curva} (NBR NM 60898)${l === "MDWH" ? " — 10 kA" : " — 3 kA"}`,
    w: larguraPolo * polos, h: 85, d: 75
  };
}

// ---------------------------------------------------------------------------
// Disjuntores em caixa moldada — AGW (catálogo 50051732) e DWP (50009824)
// ---------------------------------------------------------------------------
const MOLDADA = {
  AGW: [
    ["AGW50N", [15, 20, 30, 40, 50], [75, 130, 68]], ["AGW100N", [60, 75, 100], [90, 155, 68]],
    ["AGW250N", [125, 150, 175, 200, 225, 250], [105, 165, 68]], ["AGW400N", [300, 350, 400], [140, 257, 109]],
    ["AGW800N", [500, 630, 700, 800], [210, 280, 109]]
  ],
  DWP: [
    ["DWP63L", [16, 20, 25, 32, 40, 50, 63], [75, 130, 70]], ["DWP125L", [70, 80, 90, 100, 125], [90, 155, 86]],
    ["DWP250L", [150, 160, 175, 200, 225, 250], [105, 165, 86]], ["DWP400L", [300, 350, 400], [140, 257, 110]],
    ["DWP630L", [450, 500, 600, 630], [210, 280, 115]], ["DWP800L", [700, 800], [210, 280, 115]]
  ]
};

export function caixaMoldada(corrente, linha = "AGW") {
  for (const [carcaca, correntes, [w, h, d]] of MOLDADA[linha] ?? MOLDADA.AGW) {
    const inom = acima(correntes, corrente);
    if (inom) {
      const modelo = linha === "DWP" ? `${carcaca}-${inom}-3` : `${carcaca}-DX${inom}-3`;
      return { modelo, fabricante: "WEG", inom, descricao: `Disjuntor em caixa moldada tripolar ${inom} A — verificar Icu ≥ Icc presumida`, w, h, d };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Chaves seccionadoras MSW — brochura WEG 50161813
// ---------------------------------------------------------------------------
const MSW_CORRENTES = [16, 20, 25, 32, 40, 63, 80, 100, 125, 160];

export function seccionadora(corrente) {
  const inom = acima(MSW_CORRENTES, corrente);
  if (!inom) return null;
  const grande = inom > 40;
  return {
    modelo: inom === 160 ? "MSW160C-3P00-1B" : `MSW${String(inom).padStart(3, "0")}B-3P00-3R`, fabricante: "WEG", inom,
    descricao: `Chave seccionadora rotativa tripolar ${inom} A — fixação em base, com haste e manopla na porta`,
    w: grande ? 90 : 53, h: grande ? 100 : 75, d: grande ? 90 : 70
  };
}

// ---------------------------------------------------------------------------
// Inversores CFW500 — catálogo WEG CFW-500
// ---------------------------------------------------------------------------
const CFW_DIM = { A: [75, 189, 150], B: [100, 199, 160], C: [135, 210, 165], D: [180, 307, 167], E: [220, 350, 192], F: [300, 550, 254], G: [335, 675, 314] };
const CFW500 = {
  T2: [[7, "A07P0"], [9.6, "A09P6"], [16, "B16P0"], [24, "C24P0"], [28, "D28P0"], [33, "D33P0"], [47, "D47P0"], [56, "E56P0"], [77, "F77P0"], [88, "F88P0"], [105, "F0105"], [145, "G0145"], [180, "G0180"], [211, "G0211"]],
  T4: [[1, "A01P0"], [1.6, "A01P6"], [2.6, "A02P6"], [4.3, "A04P3"], [6.1, "A06P1"], [10, "B10P0"], [14, "C14P0"], [16, "C16P0"], [24, "D24P0"], [31, "D31P0"], [39, "E39P0"], [49, "E49P0"], [77, "F77P0"], [88, "F88P0"], [105, "F0105"], [142, "G0142"], [180, "G0180"], [211, "G0211"]]
};

export function inversor(corrente, tensao) {
  const serie = tensao <= 240 ? "T2" : "T4";
  const m = CFW500[serie].find(([i]) => i >= corrente);
  if (!m) return null;
  const tam = m[1][0];
  const [w, h, d] = CFW_DIM[tam];
  return {
    modelo: `CFW500${m[1]}${serie}`, fabricante: "WEG", inom: m[0], tamanho: tam,
    descricao: `Inversor de frequência trifásico ${num(m[0])} A, ${serie === "T2" ? "200-240 V" : "380-480 V"} — tamanho ${tam}`,
    w, h, d
  };
}

// ---------------------------------------------------------------------------
// Soft-starters — catálogo WEG 10525004
// ---------------------------------------------------------------------------
const SSW = {
  SSW05: [3, 10, 16, 23, 30, 45, 60, 85],
  SSW07: [17, 24, 30, 45, 61, 85, 130, 171, 200, 255, 312, 365, 412],
  SSW900: [10, 17, 24, 30, 45, 61, 85, 105, 130, 171, 200, 255, 312, 365, 412, 480, 604, 670, 820, 950, 1100, 1400]
};

function dimSSW(linha, i) {
  if (linha === "SSW05") return i <= 30 ? [59, 130, 145] : [79, 185, 172];
  if (linha === "SSW07") return i <= 30 ? [95, 162, 157] : i <= 85 ? [144, 208, 203] : i <= 200 ? [223, 276, 220] : [370, 331, 244];
  return i <= 30 ? [127, 265, 199] : i <= 105 ? [144, 300, 222] : i <= 200 ? [223, 350, 260] : i <= 412 ? [370, 460, 290] : [540, 650, 330];
}

export function softStarter(corrente, linha = "auto") {
  const ordem = linha === "auto" ? ["SSW05", "SSW07", "SSW900"] : [linha, "SSW900"];
  for (const l of ordem) {
    const inom = acima(SSW[l], corrente);
    if (!inom) continue;
    const c4 = String(inom).padStart(4, "0");
    let modelo = `SSW05${c4}T2246TPZ`;
    if (l === "SSW07") modelo = `SSW07${c4}T5SZ`;
    if (l === "SSW900") modelo = `SSW900${inom <= 30 ? "A" : inom <= 105 ? "B" : inom <= 200 ? "C" : inom <= 412 ? "D" : inom <= 670 ? "E" : inom <= 950 ? "F" : "G"}${c4}T5E2`;
    const [w, h, d] = dimSSW(l, inom);
    return { modelo, fabricante: "WEG", inom, linha: l, descricao: `Soft-starter ${l} ${inom} A — bypass incorporado`, w, h, d };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Fontes PSS24-W — catálogo WEG 50058708
// ---------------------------------------------------------------------------
const FONTES = [[0.65, "0,65", 23], [1.3, "1,3", 23], [2.2, "2,2", 40], [3, "3,0", 40], [5, "5", 40], [7.5, "7,5", 60], [10, "10,0", 60], [20, "20,0", 86]];

export function fonte24(corrente) {
  const f = FONTES.find(([i]) => i >= corrente) ?? FONTES[FONTES.length - 1];
  return {
    modelo: `PSS24-W-${f[1]}`, fabricante: "WEG", inom: f[0],
    descricao: `Fonte de alimentação chaveada monofásica 24 Vcc / ${f[1]} A — entrada 100-240 Vca`,
    w: f[2], h: 110, d: 115
  };
}

// ---------------------------------------------------------------------------
// Bornes BTW — catálogo WEG BTW
// ---------------------------------------------------------------------------
const BORNES = { BTWP: [[2.5, 5.2], [4, 6.2], [6, 8.2], [10, 10.2], [16, 12.2], [35, 16], [70, 22], [95, 25], [150, 31], [240, 36]], BTWM: [[2.5, 5.2], [4, 6.2], [6, 8.2], [10, 10.2], [16, 12.2]] };

export function borne(secao, linha = "BTWP") {
  const tab = BORNES[linha].some(([s]) => s >= secao) ? BORNES[linha] : BORNES.BTWP;
  const l = tab === BORNES[linha] ? linha : "BTWP";
  const b = tab.find(([s]) => s >= secao) ?? tab[tab.length - 1];
  return {
    modelo: `${l} ${num(b[0])}`, fabricante: "WEG", secao: b[0], passo: b[1],
    descricao: `Conector de passagem por ${l === "BTWM" ? "mola" : "parafuso"} ${num(b[0])} mm², ${num(b[1])} mm de espessura`,
    w: b[1], h: 45, d: 46
  };
}

// ---------------------------------------------------------------------------
// Comando e sinalização — catálogo WEG CSW e projetos de referência
// ---------------------------------------------------------------------------
export function seletora3pos() {
  return { modelo: "CSW-CK3F45-2", fabricante: "WEG", descricao: "Comutador knob 3 posições fixas 45° Ø 22 mm — 2 NA (Manual-0-Automático)", w: 30, h: 30, d: 60 };
}

const CORES = { verde: ["2", "SM2"], vermelho: ["1", "SM1"], amarelo: ["3", "SM3"], branco: ["0", "SM0"] };

export function sinaleiro(cor, linha = "CSW", tensao = "220Vca") {
  const [csw, cew] = CORES[cor];
  const v = tensao === "220Vca" ? "220 Vca" : "24 Vca/cc";
  if (linha === "CEW") {
    return { modelo: `CEW-${cew}-${tensao === "220Vca" ? "D23" : "E26"}`, fabricante: "WEG", descricao: `Sinaleiro monobloco LED ${cor} ${v} Ø 22 mm`, w: 30, h: 30, d: 45 };
  }
  return { modelo: `CSW-SD${csw} WH + bloco LED`, fabricante: "WEG", descricao: `Sinaleiro difuso ${cor} Ø 22 mm com bloco de LED ${v}`, w: 30, h: 30, d: 60 };
}

export function emergencia() {
  return { modelo: "CSW-BESG WH + BC01", fabricante: "WEG", descricao: "Botão de emergência Ø 40 mm, gira para soltar — 1 NF", w: 40, h: 40, d: 70 };
}

// ---------------------------------------------------------------------------
// DPS — brochura WEG SPW03/SPW13 (Uc 275 V)
// ---------------------------------------------------------------------------
export function dps(linha = "SPW03-45") {
  const tab = {
    "SPW03-45": ["SPW03-275-45", "Classe II, Imáx 45 kA (8/20 µs)"],
    "SPW03-20": ["SPW03-275-20", "Classe II, Imáx 20 kA (8/20 µs)"],
    "SPW03-60": ["SPW03-275-60/12,5", "Classe I+II, Iimp 12,5 kA (10/350 µs)"]
  };
  const [modelo, texto] = tab[linha] ?? tab["SPW03-45"];
  return { modelo, fabricante: "WEG", descricao: `DPS monopolar Uc 275 V — ${texto}`, w: 18, h: 90, d: 67 };
}

// ---------------------------------------------------------------------------
// Caixas BRCE (IP66) e armários modulares BRK (IP55) — catálogos da pasta
// [referência, altura, largura, profundidade, altura da placa, largura da placa]
// ---------------------------------------------------------------------------
const BRCE = [
  [200, 200, 120], [320, 190, 140], [250, 350, 140], [350, 250, 140], [300, 200, 200], [300, 300, 200],
  [380, 320, 170], [380, 320, 220], [400, 300, 200], [500, 300, 200], [400, 400, 200], [400, 400, 250],
  [480, 380, 220], [500, 400, 200], [500, 500, 200], [500, 500, 250], [600, 400, 200], [600, 400, 250],
  [600, 480, 170], [600, 480, 220], [600, 500, 200], [600, 500, 250], [600, 500, 300], [600, 600, 200],
  [600, 600, 250], [760, 480, 220], [760, 600, 220], [800, 500, 200], [800, 600, 200], [800, 600, 250],
  [800, 600, 300], [800, 600, 350], [950, 600, 220], [1000, 600, 200], [1000, 600, 250], [1000, 600, 350],
  [1000, 800, 250], [1000, 800, 300], [1000, 800, 350], [1200, 600, 250], [1200, 760, 220], [1200, 800, 250],
  [1200, 800, 350]
];

function listaBRK() {
  const lista = [];
  const alturas = { 1100: [[600, 800], [400]], 1200: [[600, 800, 1000, 1200], [400]], 1300: [[600, 800, 1000, 1200], [400, 600]] };
  for (const a of [1500, 1700, 1900, 2200]) alturas[a] = [[600, 800, 1000, 1200], [400, 500, 600, 800]];
  for (const [a, [larguras, profs]] of Object.entries(alturas)) {
    for (const l of larguras) for (const p of profs) lista.push([Number(a), l, p]);
  }
  return lista;
}

export const CAIXAS = [
  ...BRCE.map(([a, l, p], i) => ({
    // os dez primeiros modelos do catálogo são sem flange; os demais levam o sufixo "f"
    linha: "BRCE", modelo: `BRCE-${a / 10}.${l / 10}.${p / 10}${i >= 10 ? "f" : ""}`, a, l, p,
    placaA: a - 50, placaL: l - 50, util: p - 20,
    descricao: `Caixa para proteção IP66 ${a} × ${l} × ${p} mm, com placa de montagem`
  })),
  ...listaBRK().map(([a, l, p]) => ({
    linha: "BRK", modelo: `BRK-${a / 100}.${l / 100}.${p / 100}`, a, l, p,
    placaA: a - 80, placaL: l - 55, util: p - 93,
    descricao: `Armário modular IP55 ${a} × ${l} × ${p} mm (+ 100 mm de base soleira), com placa de montagem`
  }))
].sort((x, y) => x.a * x.l - y.a * y.l || x.p - y.p);

// ---------------------------------------------------------------------------
// Itens fora dos catálogos WEG, usados nos projetos de referência
// ---------------------------------------------------------------------------
export const FIXOS = {
  barraNeutro: (l) => l === "BDS"
    ? { modelo: "BDS-N6", fabricante: "Sibratec", descricao: "Barramento para trilho DIN, 6 parafusos — neutro", w: 60, h: 40, d: 35 }
    : { modelo: "Barra Cu 3/8\" × 3/16\"", fabricante: "—", descricao: "Barramento de cobre 80 A com isoladores — neutro", w: 150, h: 30, d: 40 },
  barraTerra: (l) => l === "BDS"
    ? { modelo: "BDS-T6", fabricante: "Sibratec", descricao: "Barramento para trilho DIN, 6 parafusos — terra", w: 60, h: 40, d: 35 }
    : { modelo: "Barra Cu 3/8\" × 3/16\"", fabricante: "—", descricao: "Barramento de cobre 80 A — terra (PE)", w: 150, h: 30, d: 40 },
  tomada: { modelo: "EO NUT 0804139", fabricante: "Phoenix Contact", descricao: "Tomada para trilho DIN 2P+T 20 A 250 V — padrão NBR 14136", w: 45, h: 90, d: 60 },
  releInterface: { modelo: "P16E26", fabricante: "WEG", descricao: "Borne relé de interface 24 Vcc — 1 contato reversível", w: 6.2, h: 90, d: 75 },
  temporizadorYD: { modelo: "RTW-ET", fabricante: "WEG", descricao: "Relé temporizador eletrônico para partida estrela-triângulo", w: 22.5, h: 90, d: 100 },
  trafo: { modelo: "TR 440/220 V — 400 VA", fabricante: "—", descricao: "Transformador de comando monofásico 440/220 V, 400 VA", w: 120, h: 110, d: 100 },
  ssr: { modelo: "SSR 3F + dissipador", fabricante: "—", descricao: "Relé de estado sólido trifásico com dissipador — controle proporcional", w: 100, h: 110, d: 130 },
  ventilacao: { modelo: "Kit ventilação 120 mm", fabricante: "—", descricao: "Microventilador 120 × 120 mm 220 Vca com filtro e grelha de exaustão para porta", w: 150, h: 150, d: 60 },
  potenciometro: { modelo: "CSW-MPKM10K-P65", fabricante: "WEG", descricao: "Potenciômetro rotativo de 1 volta, 10 kΩ — referência de velocidade", w: 30, h: 30, d: 60 },
  barramentoForca: { modelo: "Volt EX — kits 1, 2 e 3.1", fabricante: "Volt", descricao: "Barramento de distribuição trifásico Volt EX 400 A com suportes isoladores e terminais 125/250 A", w: 0, h: 0, d: 0 }
};

// Conversor de potência (SCR) LOTI MPCTPF série R — catálogo da pasta.
export function conversorPotencia(corrente, tensao) {
  const inom = acima([10, 25, 40, 50], corrente);
  if (!inom) return null;
  const v = tensao <= 240 ? "2" : tensao <= 400 ? "3" : "4";
  return {
    modelo: `MPCTPF3-${v}-6-2-${inom}A`, fabricante: "LOTI", inom,
    descricao: `Conversor de potência trifásico ${inom} A — trem de pulsos, sinal 0-10 Vcc`,
    w: 129, h: 160, d: 175
  };
}

// Controladores usados nos projetos de referência (CAREL c.pCO).
export function controlador(pontos, linha = "CAREL") {
  const { di, ai, dout, ao } = pontos;
  if (linha !== "CAREL") {
    return [{ modelo: "CLP a definir", fabricante: "—", descricao: `Controlador programável — mínimo ${di} DI, ${ai} AI, ${dout} DO, ${ao} AO`, w: 140, h: 110, d: 70 }];
  }
  const modelos = [
    { nome: "c.pCO mini High End", modelo: "P+P000UH1DEF0", ui: 10, di: 2, dout: 6, ao: 2, w: 70, kit: "P+P0CON1E0" },
    { nome: "pCOOEM+ médio", modelo: "P+100B000D0M0", ui: 10, di: 12, dout: 13, ao: 4, w: 315, kit: "UP2CONN0M0" },
    { nome: "c.pCO Large", modelo: "P+500BAA000L0", ui: 10, di: 18, dout: 18, ao: 6, w: 315, kit: "kit de conectores" }
  ];
  const cabe = (m) => ai <= m.ui && di <= m.di + (m.ui - ai) && dout <= m.dout && ao <= m.ao;
  const m = modelos.find(cabe) ?? modelos[modelos.length - 1];
  const itens = [
    { modelo: m.modelo, fabricante: "CAREL", descricao: `Controlador lógico programável CAREL ${m.nome} — ${m.ui} UI, ${m.di} DI, ${m.dout} DO, ${m.ao} AO`, w: m.w, h: 110, d: 65 },
    { modelo: m.kit, fabricante: "CAREL", descricao: "Kit de conectores removíveis para o controlador", w: 0, h: 0, d: 0, acessorio: true }
  ];
  if (!cabe(m)) {
    const falta = Math.max(Math.ceil((ai + di - m.ui - m.di) / 10), Math.ceil((dout - m.dout) / 6), Math.ceil((ao - m.ao) / 4), 1);
    itens.push({ modelo: "c.pCOe (expansão)", fabricante: "CAREL", qtd: falta, descricao: "Módulo de expansão de E/S c.pCOe — 10 UI, 6 DO", w: 70, h: 110, d: 65 });
  }
  return itens;
}

export function ihm(tamanho) {
  const pol = parseFloat(tamanho) || 7;
  return { modelo: `IHM touch ${tamanho}`, fabricante: "CAREL / a definir", descricao: `Interface homem-máquina touch screen ${tamanho} — montagem em porta`, w: pol * 24, h: pol * 16, d: 50 };
}

function num(v) {
  return String(v).replace(".", ",");
}
