// Correntes nominais típicas de motores trifásicos WEG W22 IR3 Premium, 4 polos,
// 60 Hz. Não há catálogo de motores na Base de Consulta: os valores abaixo são
// de referência e a corrente de placa do motor, quando informada, prevalece.

export const CV = 0.7355; // kW por cv

// [cv, kW, In em 220 V (A), Ip/In típico]
export const MOTORES = [
  [0.16, 0.12, 0.8, 5.0], [0.25, 0.18, 1.1, 5.0], [0.33, 0.25, 1.42, 5.5], [0.5, 0.37, 2.07, 5.5],
  [0.75, 0.55, 2.9, 6.0], [1, 0.75, 3.02, 7.2], [1.5, 1.1, 4.43, 7.5], [2, 1.5, 6.12, 7.5],
  [3, 2.2, 8.7, 7.8], [4, 3.0, 11.1, 7.8], [5, 3.7, 13.8, 8.0], [6, 4.5, 16.3, 8.0],
  [7.5, 5.5, 20.0, 8.0], [10, 7.5, 26.6, 8.0], [12.5, 9.2, 32.0, 8.0], [15, 11, 38.0, 8.0],
  [20, 15, 51.0, 7.5], [25, 18.5, 62.3, 7.5], [30, 22, 73.3, 7.5], [40, 30, 98.3, 7.2],
  [50, 37, 122, 7.2], [60, 45, 146, 7.2], [75, 55, 178, 7.2], [100, 75, 242, 7.2],
  [125, 90, 293, 7.2], [150, 110, 353, 7.2], [175, 132, 422, 7.0], [200, 150, 480, 7.0],
  [250, 185, 592, 7.0], [300, 220, 700, 7.0]
];

export const POTENCIAS_KW = MOTORES.map((m) => m[1]);

/**
 * Corrente nominal do motor para a potência (kW) e tensão de linha (V).
 * Potência padronizada → tabela; intermediária → interpolação; fora da faixa →
 * fórmula I = P / (√3 · V · cosφ · η) com cosφ·η = 0,85·0,86.
 */
export function correnteMotor(kW, tensao) {
  const escala = 220 / tensao;
  const exato = MOTORES.find((m) => Math.abs(m[1] - kW) / m[1] < 0.03);
  if (exato) {
    return { corrente: exato[2] * escala, ipIn: exato[3], cv: exato[0], fonte: "tabela WEG W22 IR3 4 polos" };
  }
  const primeiro = MOTORES[0], ultimo = MOTORES[MOTORES.length - 1];
  if (kW > primeiro[1] && kW < ultimo[1]) {
    const i = MOTORES.findIndex((m) => m[1] > kW);
    const a = MOTORES[i - 1], b = MOTORES[i];
    const f = (kW - a[1]) / (b[1] - a[1]);
    return {
      corrente: (a[2] + f * (b[2] - a[2])) * escala, ipIn: b[3], cv: kW / CV,
      fonte: `interpolado entre ${fmtKW(a[1])} e ${fmtKW(b[1])} kW (tabela WEG)`
    };
  }
  return {
    corrente: (kW * 1000) / (Math.sqrt(3) * tensao * 0.85 * 0.86), ipIn: 7, cv: kW / CV,
    fonte: "fórmula (cosφ 0,85 · η 0,86) — potência fora da tabela"
  };
}

function fmtKW(v) {
  return String(v).replace(".", ",");
}

// Cargas não motrizes — fórmulas do EstruturadeCriação.txt.
export function correnteCarga(kW, tensao, fases = 3) {
  return fases === 3 ? (kW * 1000) / (Math.sqrt(3) * tensao * 0.85) : (kW * 1000) / (tensao * 0.9);
}

// Cargas resistivas (aquecimento): cosφ = 1.
export function correnteResistiva(kW, tensao, fases = 3) {
  return fases === 3 ? (kW * 1000) / (Math.sqrt(3) * tensao) : (kW * 1000) / tensao;
}
