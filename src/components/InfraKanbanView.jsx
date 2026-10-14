import React, { useMemo, useState } from 'react';
import { Plus, Search, AlertCircle, Calculator } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CardDetailModal } from './CardDetailModal';
import { ModalShell } from './dimensionamento/ModalShell';
import { getGradientById } from '../constants/gradients';
import {
  CATEGORIAS_INFRA, COLUNAS_INFRA, ehCardInfra, rotuloCategoria, subtarefasPadrao
} from '../constants/infraestrutura';
import './infra/infra.css';

/**
 * Kanban de infraestrutura da obra.
 * `categoria` / `onCategoria`: filtro controlado pelo módulo (a visão geral filtra por aqui).
 */
export const InfraKanbanView = ({ categoria = 'todas', onCategoria = () => {} }) => {
  const { currentUser } = useAuth();
  const { activeObra, cards, addCard, updateCardStatus } = useData();

  const [selectedCard, setSelectedCard] = useState(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaCategoria, setNovaCategoria] = useState(CATEGORIAS_INFRA[0].id);
  const [novaPrioridade, setNovaPrioridade] = useState('Média');
  const [busca, setBusca] = useState('');
  const [arrastando, setArrastando] = useState(null);

  const doInfra = useMemo(
    () => cards.filter((c) => c.obraId === activeObra?.id && ehCardInfra(c)),
    [cards, activeObra]
  );

  if (!activeObra) {
    return (
      <div className="if-vazio">
        <AlertCircle size={36} />
        <h3>Nenhuma obra selecionada</h3>
        <p>Selecione uma obra na Vitrine para acessar o Kanban de infraestrutura.</p>
      </div>
    );
  }

  const termo = busca.trim().toLowerCase();
  const filtrados = doInfra.filter((c) => {
    if (categoria !== 'todas' && (c.categoryTag || 'Infraestrutura Geral') !== categoria) return false;
    if (termo && !c.title.toLowerCase().includes(termo)) return false;
    return true;
  });

  const contagem = (cat) => doInfra.filter((c) => (c.categoryTag || 'Infraestrutura Geral') === cat).length;

  const criar = (e) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;
    addCard({
      title: novoTitulo.trim(),
      description: '',
      obraId: activeObra.id,
      quadroId: null,
      level: 'infra',
      categoryTag: novaCategoria,
      gradientId: 'amber',
      priority: novaPrioridade,
      column: 'todo',
      assignedUserId: currentUser?.id,
      assignedUserName: currentUser?.name,
      subtasks: subtarefasPadrao(novaCategoria)
    });
    setNovoTitulo('');
    setNovoAberto(false);
  };

  const soltar = (e, coluna) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || arrastando;
    if (id) updateCardStatus(id, coluna);
    setArrastando(null);
  };

  return (
    <div className="if-wrap">
      <div className="if-barra">
        <div className="if-busca">
          <Search size={14} />
          <input className="form-control" placeholder="Pesquisar tarefas…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <span className="if-espaco" />
        <button type="button" className="btn btn-primary" onClick={() => setNovoAberto(true)}>
          <Plus size={15} /> Nova tarefa
        </button>
      </div>

      <div className="if-chips" role="group" aria-label="Filtrar por categoria">
        <button type="button" className={`if-chip ${categoria === 'todas' ? 'ativo' : ''}`} onClick={() => onCategoria('todas')}>
          Todas <b>{doInfra.length}</b>
        </button>
        {CATEGORIAS_INFRA.map((c) => {
          const n = contagem(c.id);
          if (n === 0 && categoria !== c.id) return null;
          return (
            <button key={c.id} type="button" className={`if-chip ${categoria === c.id ? 'ativo' : ''}`} onClick={() => onCategoria(c.id)}>
              {c.rotulo} <b>{n}</b>
            </button>
          );
        })}
      </div>

      <div className="kanban-scroll-container" style={{ gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))' }}>
        {COLUNAS_INFRA.map((col) => {
          const colCards = filtrados.filter((c) => c.column === col.id);
          return (
            <div
              key={col.id}
              className="if-coluna"
              style={{ borderTopColor: col.cor }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => soltar(e, col.id)}
            >
              <div className="if-coluna-topo">
                <h3>{col.titulo}</h3>
                <span className="if-contador" style={{ background: col.cor }}>{colCards.length}</span>
              </div>

              <div className="if-cards">
                {colCards.map((card) => {
                  const grad = getGradientById(card.gradientId || 'amber');
                  const subs = card.subtasks || [];
                  const feitas = subs.filter((s) => s.completed).length;
                  const pct = subs.length ? Math.round((feitas / subs.length) * 100) : 0;
                  const alta = card.priority === 'Alta' || card.priority === 'Crítica';
                  return (
                    <div
                      key={card.id}
                      className="if-card"
                      style={{ borderLeftColor: grad.border }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', card.id);
                        setArrastando(card.id);
                      }}
                      onClick={() => setSelectedCard(card)}
                    >
                      <div className="if-card-tags">
                        <span className="badge badge-amber">{rotuloCategoria(card.categoryTag)}</span>
                        <span className={`badge ${alta ? 'badge-danger' : 'badge-emerald'}`}>{card.priority || 'Média'}</span>
                        {card.origem?.tipo === 'calculo' && (
                          <span className="badge badge-blue" title="Criada a partir de um cálculo"><Calculator size={10} /> cálculo</span>
                        )}
                      </div>
                      <h4>{card.title}</h4>
                      {subs.length > 0 && (
                        <div className="if-prog">
                          <div className="if-prog-barra"><i style={{ width: `${pct}%` }} /></div>
                          <span>{feitas}/{subs.length}</span>
                        </div>
                      )}
                      <span className="if-resp">👤 {card.assignedUserName || 'Equipe de infra'}</span>
                    </div>
                  );
                })}

                {colCards.length === 0 && <div className="if-soltar">Arraste para cá</div>}
              </div>
            </div>
          );
        })}
      </div>

      {novoAberto && (
        <ModalShell title="Nova tarefa de infraestrutura" onClose={() => setNovoAberto(false)} maxWidth={480}>
          <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Título da atividade *</label>
              <input
                className="form-control"
                required
                autoFocus
                placeholder="Ex.: Lançamento de cabo PP 4×2,5 mm² para o QTA"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Categoria</label>
              <select className="form-control" value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)}>
                {CATEGORIAS_INFRA.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
              </select>
              <span className="if-dica">As subtarefas padrão desta categoria são criadas automaticamente.</span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Prioridade</label>
              <select className="form-control" value={novaPrioridade} onChange={(e) => setNovaPrioridade(e.target.value)}>
                {['Baixa', 'Média', 'Alta', 'Crítica'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setNovoAberto(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Criar tarefa</button>
            </div>
          </form>
        </ModalShell>
      )}

      <CardDetailModal
        card={cards.find((c) => c.id === selectedCard?.id) || selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
};
