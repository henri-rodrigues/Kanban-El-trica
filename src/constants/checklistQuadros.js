// Modelo do checklist de conferência e liberação de quadros elétricos.
// Baseado no CheckListQuadros3DAR (3D Ar Condicionado): 3 seções, 37 itens, cada um com critério de aceite.

export const SECOES_CHECKLIST = [
  {
    id: 'tampa',
    titulo: 'Tampa',
    descricao: 'Estrutura externa, fixação, identificação e integridade da tampa do painel.',
    itens: [
      { titulo: 'Identificação do Quadro Elétrico', criterio: 'Tag, plaqueta de identificação e aviso de risco elétrico na face externa.' },
      { titulo: 'Identificação das Lâmpadas / Sinaleiros', criterio: 'Identificação legível de cada sinaleiro (ex: Ligado, Falha, Operação).' },
      { titulo: 'Identificação das Chaves Seccionadoras', criterio: 'Posições Lig/Desl e identificação do circuito na manopla externa.' },
      { titulo: 'Fixação dos Componentes da Tampa', criterio: 'Fixação mecânica firme de botões, sinaleiros, comutadoras e IHM.' },
      { titulo: 'Integridade da Tampa e Pintura', criterio: 'Ausência de riscos, amassados, oxidação ou danos na lataria e fechamento.' },
      { titulo: 'Estado das Fechaduras do Quadro Elétrico', criterio: 'Fechaduras travando perfeitamente com chave e vedação adequada.' },
      { titulo: 'Integridade e Funcionamento da IHM', criterio: 'Tela sem trincas, display funcional e membrana em perfeito estado.' },
      { titulo: 'Aterramento da Tampa', criterio: 'Cordoalha de aterramento interligando a tampa à estrutura aterrada.' },
      { titulo: 'Instalação das Venezianas de Ventilação', criterio: 'Venezianas alinhadas, fixadas e com filtro de ar limpo/presente.' },
      { titulo: 'Instalação do Ventilador e Exaustor', criterio: 'Sentido de fluxo correto (insuflamento/exaustão) e fixação firme.' },
      { titulo: 'Integridade das Venezianas', criterio: 'Ausência de aletas quebradas, deformadas ou obstruídas.' },
      { titulo: 'Integridade do Ventilador e Exaustor', criterio: 'Hélices livres, motores sem ruídos anormais e grades protetoras intactas.' }
    ]
  },
  {
    id: 'interna',
    titulo: 'Conferência Interna',
    descricao: 'Inspeção dos componentes elétricos, disjuntores, bornes, relés e barramentos.',
    itens: [
      { titulo: 'Integridade da Placa de Montagem (Miolo)', criterio: 'Placa de montagem sem deformações, trincas ou pontos de oxidação.' },
      { titulo: 'Integridade das Canaletas Plásticas', criterio: 'Canaletas sem aletas quebradas, trincadas ou ressecadas.' },
      { titulo: 'Integridade das Tampas de Canaletas', criterio: 'Tampas sem trincas, empenamentos ou danos físicos.' },
      { titulo: 'Tampas de Canaletas Completas e Encaixadas', criterio: 'Todas as tampas instaladas, cobrindo 100% da fiação interna.' },
      { titulo: 'Diagrama / Projeto Elétrico no Porta-Documentos', criterio: 'Cópia atualizada do esquema unifilar/funcional presente no quadro.' },
      { titulo: 'Integridade dos Disjuntores', criterio: 'Disjuntores em bom estado mecânico, sem avarias ou sinais de queima.' },
      { titulo: 'Integridade das Contatoras', criterio: 'Contatoras sem danos físicos, polos e bobinas em perfeito estado.' },
      { titulo: 'Integridade dos Inversores de Frequência', criterio: 'Conexões firmes, carcaça sem danos e display operacional.' },
      { titulo: 'Integridade dos Conversores de Potência', criterio: 'Módulos sem danos visíveis, superaquecimento ou falha de fixação.' },
      { titulo: 'Integridade dos Relés (Auxiliares e Térmicos)', criterio: 'Bases e soquetes firmes, contatos sem fuligem e carcaças intactas.' },
      { titulo: 'Integridade dos Bornes / Régua de Bornes', criterio: 'Bornes sem trincas, deformações térmicas ou travamento frouxo.' },
      { titulo: 'Integridade das Fontes de Alimentação (24Vcc)', criterio: 'Tensão nominal estável, sem estufamento ou danos nos bornes.' },
      { titulo: 'Identificação de Todos os Componentes', criterio: 'Etiquetas com identificação técnica (TAGs) conforme diagrama.' },
      { titulo: 'Identificação Completa dos Bornes', criterio: 'Marcadores numéricos/alfanuméricos presentes em toda a régua.' },
      { titulo: 'Aterramento Geral da Carcaça e Placa', criterio: 'Barramento de proteção (PE) aterrado e continuidade garantida.' },
      { titulo: 'Reaperto e Torque dos Componentes', criterio: 'Parafusos de fixação e trilhos DIN conferidos com torque adequado.' },
      { titulo: 'Integridade e Operação da Iluminação Interna', criterio: 'Luminária interna e interruptor fim-de-curso operando corretamente.' }
    ]
  },
  {
    id: 'cabeamento',
    titulo: 'Cabeamento',
    descricao: 'Roteamento dos condutores, isolamento, identificação e aperto dos terminais.',
    itens: [
      { titulo: 'Torque e Reaperto das Conexões dos Cabos', criterio: 'Conexões elétricas reapertadas (potência, neutro e comando).' },
      { titulo: 'Identificação dos Cabos de Potência', criterio: 'Anilhas com marcação de fase/circuito nas duas extremidades.' },
      { titulo: 'Identificação dos Cabos de Comando', criterio: 'Anilhas numeradas de comando batendo com o esquema elétrico.' },
      { titulo: 'Identificação dos Cabos de Rede / Comunicação', criterio: 'Cabos de comunicação/Ethernet identificados e organizados.' },
      { titulo: 'Integridade da Isolação e Vias dos Cabos', criterio: 'Cabos sem esmagamento, cortes, quebras ou danos térmicos.' },
      { titulo: 'Isolamento Completo dos Condutores', criterio: 'Ausência de partes vivas desnudas ou fiação desencapada exposta.' },
      { titulo: 'Padronização das Cores dos Cabos (Norma)', criterio: 'Fases, Neutro (Azul Claro) e Terra (Verde/Amarelo) padronizados.' },
      { titulo: 'Terminais Crimpados em Todas as Pontas', criterio: 'Uso de ilhós/terminais apropriados em 100% dos cabos flexíveis.' }
    ]
  }
];

export const TOTAL_ITENS_CHECKLIST = SECOES_CHECKLIST.reduce((n, s) => n + s.itens.length, 0);

/** Chave estável de cada item: `${secao}_${indice}`. */
export const chaveItem = (secaoId, indice) => `${secaoId}_${indice}`;

/** Limites de fotos para o laudo caber num documento do Firestore (limite de 1 MiB). */
export const MAX_FOTOS_POR_ITEM = 3;
export const LIMITE_BYTES_LAUDO = 900000;
