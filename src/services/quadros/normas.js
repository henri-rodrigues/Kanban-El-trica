// Tabelas e regras normativas usadas pelo motor de dimensionamento.
// Valores tabelados da ABNT NBR 5410:2004 (condutores de cobre). Os resultados
// devem ser validados pelo responsável técnico com a norma vigente em mãos.

export const SECOES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];

export const METODOS = {
  A1: "A1 — condutores isolados em eletroduto embutido em parede isolante",
  A2: "A2 — cabo multipolar em eletroduto embutido em parede isolante",
  B1: "B1 — condutores isolados em eletroduto aparente ou embutido em alvenaria",
  B2: "B2 — cabo multipolar em eletroduto aparente ou embutido em alvenaria",
  C: "C — cabos fixados sobre parede ou em bandeja não perfurada",
  D: "D — cabo em eletroduto enterrado no solo",
  E: "E — cabo multipolar em bandeja perfurada, leito ou ao ar livre"
};

// Capacidade de condução de corrente (A) — NBR 5410 Tabelas 36 (PVC 70 °C) e
// 37 (EPR/XLPE 90 °C); método E pelas Tabelas 38/39. Referência: 30 °C no ar,
// 20 °C no solo. Índice = posição em SECOES; chave = nº de condutores carregados.
export const AMPACIDADE = {
  PVC: {
    A1: { 2: [14.5, 19.5, 26, 34, 46, 61, 80, 99, 119, 151, 182, 210, 240, 273, 321, 367], 3: [13.5, 18, 24, 31, 42, 56, 73, 89, 108, 136, 164, 188, 216, 245, 286, 328] },
    A2: { 2: [14, 18.5, 25, 32, 43, 57, 75, 92, 110, 139, 167, 192, 219, 248, 291, 334], 3: [13, 17.5, 23, 29, 39, 52, 68, 83, 99, 125, 150, 172, 196, 223, 261, 298] },
    B1: { 2: [17.5, 24, 32, 41, 57, 76, 101, 125, 151, 192, 232, 269, 309, 353, 415, 477], 3: [15.5, 21, 28, 36, 50, 68, 89, 110, 134, 171, 207, 239, 275, 314, 370, 426] },
    B2: { 2: [16.5, 23, 30, 38, 52, 69, 90, 111, 133, 168, 201, 232, 265, 300, 351, 401], 3: [15, 20, 27, 34, 46, 62, 80, 99, 118, 149, 179, 206, 236, 268, 313, 358] },
    C: { 2: [19.5, 27, 36, 46, 63, 85, 112, 138, 168, 213, 258, 299, 344, 392, 461, 530], 3: [17.5, 24, 32, 41, 57, 76, 96, 119, 144, 184, 223, 259, 299, 341, 403, 464] },
    D: { 2: [22, 29, 38, 47, 63, 81, 104, 125, 148, 183, 216, 246, 278, 312, 361, 408], 3: [18, 24, 31, 39, 52, 67, 86, 103, 122, 151, 179, 203, 230, 258, 297, 336] },
    E: { 2: [22, 30, 40, 51, 70, 94, 119, 148, 180, 232, 282, 328, 379, 434, 514, 593], 3: [18.5, 25, 34, 43, 60, 80, 101, 126, 153, 196, 238, 276, 319, 364, 430, 497] }
  },
  EPR: {
    A1: { 2: [19, 26, 35, 45, 61, 81, 106, 131, 158, 200, 241, 278, 318, 362, 424, 486], 3: [17, 23, 31, 40, 54, 73, 95, 117, 141, 179, 216, 249, 285, 324, 380, 435] },
    A2: { 2: [18.5, 25, 33, 42, 57, 76, 99, 121, 145, 183, 220, 253, 290, 329, 386, 442], 3: [16.5, 22, 30, 38, 51, 68, 89, 109, 130, 164, 197, 227, 259, 295, 346, 396] },
    B1: { 2: [23, 31, 42, 54, 75, 100, 133, 164, 198, 253, 306, 354, 407, 464, 546, 628], 3: [20, 28, 37, 48, 66, 88, 117, 144, 175, 222, 269, 312, 358, 408, 481, 553] },
    B2: { 2: [22, 30, 40, 51, 69, 91, 119, 146, 175, 221, 265, 305, 349, 395, 462, 529], 3: [19.5, 26, 35, 44, 60, 80, 105, 128, 154, 194, 233, 268, 307, 348, 407, 465] },
    C: { 2: [24, 33, 45, 58, 80, 107, 138, 171, 209, 269, 328, 382, 441, 506, 599, 693], 3: [22, 30, 40, 52, 71, 96, 119, 147, 179, 229, 278, 322, 371, 424, 500, 576] },
    D: { 2: [26, 34, 44, 56, 73, 95, 121, 146, 173, 213, 252, 287, 324, 363, 419, 474], 3: [22, 29, 37, 46, 61, 79, 101, 122, 144, 178, 211, 240, 271, 304, 351, 396] },
    E: { 2: [26, 36, 49, 63, 86, 115, 149, 185, 225, 289, 352, 410, 473, 542, 641, 741], 3: [23, 32, 42, 54, 75, 100, 127, 158, 192, 246, 298, 346, 399, 456, 538, 621] }
  }
};

// Fatores de correção de temperatura — NBR 5410 Tabela 40.
const TEMP_AR = {
  PVC: { 10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71, 55: 0.61, 60: 0.5 },
  EPR: { 10: 1.15, 15: 1.12, 20: 1.08, 25: 1.04, 30: 1, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.76, 60: 0.71, 65: 0.65, 70: 0.58, 75: 0.5, 80: 0.41 }
};
const TEMP_SOLO = {
  PVC: { 10: 1.1, 15: 1.05, 20: 1, 25: 0.95, 30: 0.89, 35: 0.84, 40: 0.77, 45: 0.71, 50: 0.63, 55: 0.55, 60: 0.45 },
  EPR: { 10: 1.07, 15: 1.04, 20: 1, 25: 0.96, 30: 0.93, 35: 0.89, 40: 0.85, 45: 0.8, 50: 0.76, 55: 0.71, 60: 0.65, 65: 0.6, 70: 0.53, 75: 0.46, 80: 0.38 }
};

export function fatorTemperatura(isolacao, tempC, metodo = "B1") {
  const tab = (metodo === "D" ? TEMP_SOLO : TEMP_AR)[isolacao];
  const temps = Object.keys(tab).map(Number);
  // arredonda para a temperatura tabelada imediatamente superior (a favor da segurança)
  const t = temps.find((x) => x >= tempC) ?? temps[temps.length - 1];
  return tab[t];
}

// Fatores de agrupamento — NBR 5410 Tabela 42.
const AGRUP = {
  feixe: [1, 0.8, 0.7, 0.65, 0.6, 0.57, 0.54, 0.52, 0.5, 0.5, 0.5, 0.45, 0.45, 0.45, 0.45, 0.41, 0.41, 0.41, 0.41, 0.38],
  camadaParede: [1, 0.85, 0.79, 0.75, 0.73, 0.72, 0.72, 0.71, 0.7],
  camadaBandeja: [1, 0.88, 0.82, 0.77, 0.75, 0.73, 0.73, 0.72, 0.72]
};

export function fatorAgrupamento(metodo, nCircuitos) {
  const n = Math.max(1, Math.round(nCircuitos || 1));
  const tab = metodo === "C" ? AGRUP.camadaParede : metodo === "E" ? AGRUP.camadaBandeja : AGRUP.feixe;
  return tab[Math.min(n, tab.length) - 1];
}

// Resistência em c.c. a 20 °C (Ω/km) — condutor de cobre flexível classe 5 (NBR NM 280).
const R20 = [13.3, 7.98, 4.95, 3.3, 1.91, 1.21, 0.78, 0.554, 0.386, 0.272, 0.206, 0.161, 0.129, 0.106, 0.0801, 0.0641];
// Reatância indutiva típica (Ω/km) para condutores em eletroduto/bandeja.
const XL = [0.16, 0.15, 0.14, 0.13, 0.13, 0.12, 0.12, 0.11, 0.11, 0.1, 0.1, 0.1, 0.1, 0.094, 0.098, 0.097];

export const TEMP_SERVICO = { PVC: 70, EPR: 90 };

export function resistencia(secao, isolacao = "PVC") {
  const i = SECOES.indexOf(secao);
  return R20[i] * (1 + 0.00393 * (TEMP_SERVICO[isolacao] - 20));
}
export function reatancia(secao) {
  return XL[SECOES.indexOf(secao)];
}

// Queda de tensão (V) no trecho — fases: 3 = trifásico, 2/1 = fase-fase/fase-neutro.
export function quedaTensao({ corrente, comprimento, secao, cosfi = 0.85, fases = 3, isolacao = "PVC" }) {
  const sen = Math.sqrt(Math.max(0, 1 - cosfi * cosfi));
  const z = resistencia(secao, isolacao) * cosfi + reatancia(secao) * sen; // Ω/km
  const k = fases === 3 ? Math.sqrt(3) : 2;
  return (k * corrente * comprimento * z) / 1000;
}

// Condutor de proteção — NBR 5410 Tabela 58.
export function secaoPE(secaoFase) {
  if (secaoFase <= 16) return secaoFase;
  if (secaoFase <= 35) return 16;
  return SECOES.find((s) => s >= secaoFase / 2);
}

// Condutor neutro reduzido — NBR 5410 Tabela 48 (válido sem harmônicas relevantes).
export function secaoNeutro(secaoFase) {
  const tab = { 35: 25, 50: 25, 70: 35, 95: 50, 120: 70, 150: 70, 185: 95, 240: 120, 300: 150 };
  return tab[secaoFase] ?? secaoFase;
}

// Seção mínima — NBR 5410 Tabela 47 (cobre).
export const SECAO_MINIMA = { forca: 2.5, iluminacao: 1.5, comando: 0.5 };

// Limites de queda de tensão — NBR 5410 6.2.7.
export const LIMITES_QUEDA = [
  { valor: 4, rotulo: "4% — circuito terminal" },
  { valor: 5, rotulo: "5% — a partir do ponto de entrega em BT" },
  { valor: 7, rotulo: "7% — a partir de transformador próprio" }
];

/**
 * Dimensiona a seção do condutor pelos critérios da NBR 5410:
 * capacidade de condução (6.2.5), queda de tensão (6.2.7), seção mínima (6.2.6)
 * e coordenação com a proteção contra sobrecarga (5.3.4: IB ≤ In ≤ Iz).
 */
export function dimensionarCabo(p) {
  const {
    corrente, tensao, comprimento = 0, fases = 3, cosfi = 0.85, isolacao = "PVC",
    metodo = "B1", tempAmbiente = 30, agrupamento = 1, quedaMax = 4,
    secaoMinima = SECAO_MINIMA.forca, protecao = 0, correnteQueda = corrente
  } = p;
  const nCond = fases === 3 ? 3 : 2;
  const k1 = fatorTemperatura(isolacao, tempAmbiente, metodo);
  const k2 = fatorAgrupamento(metodo, agrupamento);
  const tab = AMPACIDADE[isolacao][metodo][nCond];
  const izCorr = (s) => tab[SECOES.indexOf(s)] * k1 * k2;
  const queda = (s) => (quedaTensao({ corrente: correnteQueda, comprimento, secao: s, cosfi, fases, isolacao }) / tensao) * 100;

  const ultima = SECOES[SECOES.length - 1];
  const porAmpacidade = SECOES.find((s) => izCorr(s) >= corrente) ?? null;
  const porQueda = comprimento > 0 ? SECOES.find((s) => queda(s) <= quedaMax) ?? null : SECOES[0];
  const porProtecao = protecao > 0 ? SECOES.find((s) => izCorr(s) >= protecao) ?? null : SECOES[0];
  const excede = porAmpacidade === null || porQueda === null || porProtecao === null;
  const secao = excede ? ultima : Math.max(porAmpacidade, porQueda, porProtecao, secaoMinima);

  let criterio = "seção mínima";
  if (secao === porAmpacidade) criterio = "capacidade de condução";
  if (secao === porProtecao && porProtecao > porAmpacidade) criterio = "coordenação com a proteção";
  if (secao === porQueda && porQueda > Math.max(porAmpacidade ?? 0, porProtecao ?? 0)) criterio = "queda de tensão";
  if (excede) criterio = "acima de 300 mm² — usar condutores em paralelo";

  return {
    secao, criterio, excede, k1, k2, nCond,
    porAmpacidade, porQueda, porProtecao, secaoMinima,
    izTabela: tab[SECOES.indexOf(secao)],
    iz: izCorr(secao),
    quedaPct: comprimento > 0 ? queda(secao) : 0,
    quedaV: comprimento > 0 ? (queda(secao) * tensao) / 100 : 0,
    pe: secaoPE(secao),
    neutro: secaoNeutro(secao)
  };
}

// Taxa máxima de ocupação de eletrodutos — NBR 5410 6.2.11.1.6.
export function taxaOcupacaoMax(nCabos) {
  if (nCabos <= 1) return 53;
  if (nCabos === 2) return 31;
  return 40;
}

// Diâmetros internos típicos (mm) — confirmar com o fabricante do eletroduto.
export const ELETRODUTOS = {
  "PVC rígido roscável (NBR 15465)": [["1/2\"", 16.4], ["3/4\"", 21.3], ["1\"", 27.5], ["1.1/4\"", 36.1], ["1.1/2\"", 41.4], ["2\"", 52.8], ["2.1/2\"", 67.1], ["3\"", 79.6], ["4\"", 103.1]],
  "Aço galvanizado (NBR 5597/5598)": [["1/2\"", 15.8], ["3/4\"", 20.9], ["1\"", 26.6], ["1.1/4\"", 35.1], ["1.1/2\"", 40.9], ["2\"", 52.5], ["2.1/2\"", 62.7], ["3\"", 77.9], ["4\"", 102.3]]
};

// Diâmetro externo típico de cabos unipolares flexíveis (mm), por seção.
export const DIAMETRO_CABO = {
  "Isolado 450/750 V (PVC)": [3.0, 3.7, 4.2, 4.8, 6.0, 7.0, 8.5, 9.6, 11.3, 13.0, 15.0, 16.5, 18.5, 20.7, 23.5, 26.5],
  "Unipolar 0,6/1 kV (HEPR/PVC)": [5.6, 6.0, 6.5, 7.1, 8.0, 9.0, 10.8, 11.9, 13.7, 15.6, 17.3, 19.3, 21.4, 23.5, 26.4, 29.5]
};

// NBR NM 60898 / NBR IEC 60898 — faixas de disparo magnético dos minidisjuntores.
export const CURVAS = {
  B: "3 a 5 × In — cargas resistivas e circuitos longos",
  C: "5 a 10 × In — uso geral, comando, cargas indutivas moderadas",
  D: "10 a 20 × In — transformadores e cargas com alta corrente de partida"
};

export const REFERENCIAS = {
  ampacidade: "NBR 5410 — 6.2.5, Tabelas 36 a 39",
  temperatura: "NBR 5410 — Tabela 40",
  agrupamento: "NBR 5410 — Tabela 42",
  queda: "NBR 5410 — 6.2.7",
  secaoMinima: "NBR 5410 — 6.2.6, Tabela 47",
  sobrecarga: "NBR 5410 — 5.3.4",
  pe: "NBR 5410 — 6.4.3, Tabela 58",
  eletroduto: "NBR 5410 — 6.2.11.1.6",
  motores: "NBR 5410 — 6.5.1",
  dps: "NBR 5410 — 6.3.5 / NBR 5419-4",
  minidisjuntor: "NBR NM 60898 / NBR IEC 60898",
  tomada: "NBR 14136 (substituiu a NBR 6147)",
  conjunto: "NBR IEC 61439-1/2"
};
