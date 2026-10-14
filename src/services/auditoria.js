import { isFirebaseActive, saveFirestoreDoc, listarColecaoRecente } from './firebase';

// Registro de auditoria: quem alterou o quê (verbas, usuários, exclusões).
// No banco a coleção `audit_log` só aceita criação; ninguém edita nem apaga.
const CHAVE_LOCAL = 'omnifield_audit_v1';
const MAX_LOCAL = 1000;
const CAMPOS_PESADOS = ['images', 'workedDays', 'subtasks', 'items', 'scheduledTrips', 'fotos', 'audios', 'videos', 'itens', 'assinatura'];

const curto = (v) => {
  if (v === undefined || v === null || v === '') return '—';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > 120 ? `${s.slice(0, 117)}…` : s;
};

/** Lista os campos alterados entre duas versões (campos pesados viram só "alterado"). */
export function diferencas(antes = {}, depois = {}) {
  const campos = new Set([...Object.keys(antes || {}), ...Object.keys(depois || {})]);
  const out = [];
  campos.forEach((c) => {
    if (['updatedAt', 'editedAt', 'createdAt', 'id'].includes(c)) return;
    const a = antes?.[c];
    const d = depois?.[c];
    if (JSON.stringify(a) === JSON.stringify(d)) return;
    out.push(CAMPOS_PESADOS.includes(c) ? { campo: c, de: '(lista)', para: 'alterado' } : { campo: c, de: curto(a), para: curto(d) });
  });
  return out;
}

const lerLocal = () => {
  try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || '[]'); } catch { return []; }
};

/**
 * Grava uma linha no log.
 * acao: 'alterou' | 'excluiu' | 'criou' | 'aprovou' | 'recusou' ...
 * entidade: 'obra' | 'verbas' | 'post-it' | 'quadro' | 'pedido' | 'usuario' | 'diario' | 'laudo' | 'viagem'
 */
export function registrarAuditoria({ autor, acao, entidade, entidadeId, nome, obraId = null, antes, depois, detalhe }) {
  const mudancas = antes !== undefined || depois !== undefined ? diferencas(antes, depois) : [];
  if (acao === 'alterou' && mudancas.length === 0) return;
  const linha = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    createdAt: new Date().toISOString(),
    autorId: autor?.id ?? null,
    autorNome: autor?.name ?? 'Sistema',
    acao,
    entidade,
    entidadeId: entidadeId ?? null,
    nome: nome ?? null,
    obraId,
    mudancas,
    detalhe: detalhe ?? null
  };
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify([linha, ...lerLocal()].slice(0, MAX_LOCAL)));
  } catch { /* armazenamento cheio: segue só no banco */ }
  if (isFirebaseActive()) saveFirestoreDoc('audit_log', linha.id, linha);
}

/** Últimas linhas do log (banco quando conectado; senão, o que está neste aparelho). */
export async function carregarAuditoria(limite = 500) {
  if (isFirebaseActive()) {
    const doBanco = await listarColecaoRecente('audit_log', 'createdAt', limite);
    if (doBanco) return doBanco;
  }
  return lerLocal().slice(0, limite);
}
