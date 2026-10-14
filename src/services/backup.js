import { baixar, nomeArquivo } from '../components/dimensionamento/helpers';

/** Coleções que pertencem a uma obra (campo `obraId`). */
const COLECOES_DA_OBRA = [
  'quadros', 'cards', 'checklists', 'purchase_orders', 'field_reports',
  'dimensionamentos', 'calculos_quadros', 'laudos_checklist', 'chat_messages'
];

/**
 * Baixa um arquivo JSON com todos os dados de uma obra.
 * `dados`: objeto { obras, quadros, cards, ... } com o estado atual do sistema.
 */
export function exportarObra(obraId, dados, autor) {
  const obra = (dados.obras || []).find((o) => o.id === obraId);
  if (!obra) return null;
  const conteudo = {
    formato: 'gestao-eletrica-backup-obra',
    versao: 1,
    geradoEm: new Date().toISOString(),
    geradoPor: autor ? { id: autor.id, nome: autor.name, email: autor.email } : null,
    obra,
    colecoes: Object.fromEntries(
      COLECOES_DA_OBRA.map((c) => [c, (dados[c] || []).filter((d) => d.obraId === obraId)])
    )
  };
  const resumo = Object.fromEntries(Object.entries(conteudo.colecoes).map(([c, l]) => [c, l.length]));
  conteudo.resumo = resumo;
  const data = new Date().toISOString().slice(0, 10);
  baixar(`backup-${nomeArquivo(obra.code || obra.name)}-${data}.json`, JSON.stringify(conteudo, null, 2), 'application/json');
  return resumo;
}
