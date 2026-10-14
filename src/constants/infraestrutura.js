// Categorias dos serviços de infraestrutura e as subtarefas padrão de cada uma.

export const CATEGORIAS_INFRA = [
  {
    id: 'Passagem de Cabos',
    rotulo: 'Passagem de cabos & fiação',
    subtarefas: ['Lançamento dos cabos', 'Identificação e anilhamento', 'Teste de continuidade e isolação']
  },
  {
    id: 'Eletrodutos & Conduletes',
    rotulo: 'Eletrodutos & conduletes',
    subtarefas: ['Marcação e fixação', 'Instalação de eletrodutos, curvas e luvas', 'Passagem do arame-guia', 'Identificação dos circuitos']
  },
  {
    id: 'Leitos & Eletrocalhas',
    rotulo: 'Leitos & eletrocalhas',
    subtarefas: ['Marcação e suportes', 'Montagem e emendas', 'Aterramento do conjunto', 'Identificação']
  },
  {
    id: 'Tubulação & Perfilados',
    rotulo: 'Tubulação & perfilados',
    subtarefas: ['Marcação e fixação', 'Instalação dos perfilados', 'Acabamento e tampas']
  },
  {
    id: 'Caixas de Passagem',
    rotulo: 'Caixas de passagem & conexão',
    subtarefas: ['Fixação das caixas', 'Conexões e vedação', 'Identificação']
  },
  {
    id: 'Bases e Civil',
    rotulo: 'Bases, alvenaria e civil',
    subtarefas: ['Marcação e preparo', 'Execução (concreto / alvenaria)', 'Cura e conferência de nível']
  },
  {
    id: 'Infraestrutura Geral',
    rotulo: 'Infraestrutura geral',
    subtarefas: ['Planejamento', 'Execução', 'Conferência final']
  }
];

export const rotuloCategoria = (id) => CATEGORIAS_INFRA.find((c) => c.id === id)?.rotulo ?? id ?? 'Infraestrutura';

export const subtarefasPadrao = (categoriaId) => {
  const cat = CATEGORIAS_INFRA.find((c) => c.id === categoriaId) ?? CATEGORIAS_INFRA[CATEGORIAS_INFRA.length - 1];
  const base = Date.now();
  return cat.subtarefas.map((titulo, i) => ({ id: `st-${base}-${i}`, title: titulo, completed: false }));
};

// Um post-it é de infraestrutura se foi criado nesta tela (level) ou tem uma das etiquetas antigas.
export const ehCardInfra = (c) =>
  c.level === 'infra' || ['INFRA', 'Passagem de Cabos', 'Tubulação'].includes(c.categoryTag);

// Calculadoras de infraestrutura: cabos, eletrodutos e queda de tensão dos circuitos de campo.
export const IDS_CALC_INFRA = ['cabo', 'eletroduto', 'queda'];

// Categoria sugerida para cada calculadora de infraestrutura.
export const CATEGORIA_DA_CALCULADORA = {
  cabo: 'Passagem de Cabos',
  queda: 'Passagem de Cabos',
  eletroduto: 'Eletrodutos & Conduletes'
};

export const COLUNAS_INFRA = [
  { id: 'todo', titulo: 'A Fazer', cor: 'var(--accent-blue)' },
  { id: 'in_progress', titulo: 'Em Andamento', cor: 'var(--accent-amber)' },
  { id: 'on_hold', titulo: 'Em Espera', cor: 'var(--accent-purple)' },
  { id: 'completed', titulo: 'Concluído', cor: 'var(--accent-emerald)' }
];
