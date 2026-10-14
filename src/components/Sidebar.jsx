import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Kanban,
  Layers,
  CheckSquare,
  BarChart3,
  Plus,
  Package,
  ChevronRight,
  Edit3,
  Calendar,
  Wrench,
  FileText,
  Grid,
  UserCheck,
  Zap
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, onOpenObraModal }) => {
  const { isAdmin } = useAuth();
  const { activeObra, activeQuadros, selectedQuadroId, setSelectedQuadroId } = useData();

  const irPara = (aba) => {
    setActiveTab(aba);
  };

  // A Visão Geral é o quadro geral da obra (sem quadro específico selecionado).
  const irParaVisaoGeral = () => {
    setSelectedQuadroId(null);
    setActiveTab('kanban');
  };

  // Menu agrupado pela ordem em que o trabalho acontece.
  const secoes = [
    {
      titulo: 'Acompanhamento',
      itens: [
        {
          id: 'kanban',
          rotulo: 'Visão Geral da Obra',
          Icone: Kanban,
          ativo: activeTab === 'kanban' && selectedQuadroId === null,
          aoClicar: irParaVisaoGeral
        },
        { id: 'quadros', rotulo: 'Quadros & Subníveis', Icone: Layers },
        { id: 'infra', rotulo: 'Kanban de Infraestrutura', Icone: Wrench }
      ]
    },
    {
      titulo: 'Engenharia',
      itens: [
        { id: 'dimensionamento', rotulo: 'Dimensionamento de Quadros', Icone: Zap },
        { id: 'checklist', rotulo: 'Checklist HVAC', Icone: CheckSquare }
      ]
    },
    {
      titulo: 'Campo e equipe',
      itens: [
        { id: 'field_reports', rotulo: 'Diário de Campo & Mídia', Icone: FileText },
        { id: 'agenda', rotulo: 'Escala de Viagens', Icone: Calendar }
      ]
    }
  ];

  if (isAdmin) {
    secoes.push({
      titulo: 'Gestão',
      itens: [
        { id: 'materials', rotulo: 'Controle de Materiais', Icone: Package, badge: 'Admin' },
        { id: 'reports', rotulo: 'Relatórios', Icone: BarChart3, badge: 'Admin', roxo: true }
      ]
    });
  }

  return (
    <aside className="glass-panel" style={{
      width: '248px',
      height: 'calc(100vh - 56px)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border-color)',
      padding: '0.85rem 0.65rem',
      flexShrink: 0,
      overflowY: 'auto'
    }}>
      {/* Atalho global: a agenda reúne as viagens de todas as obras */}
      <button
        type="button"
        onClick={() => irPara('personal_agenda')}
        className={`nav-item nav-global ${activeTab === 'personal_agenda' ? 'active' : ''}`}
        title="Suas viagens e escalas em todas as obras"
      >
        <span className="nav-label">
          <UserCheck size={16} />
          <span className="nav-texto">
            <strong>Minha Agenda</strong>
            <small>Todas as obras</small>
          </span>
        </span>
      </button>

      {/* Obra ativa */}
      <div style={{
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-main)',
        border: '1px solid var(--border-color)',
        marginTop: '0.75rem'
      }}>
        <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
          Obra Ativa
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {activeObra?.name || 'Nenhuma Obra'}
          </div>
          {activeObra && isAdmin && (
            <button
              type="button"
              onClick={() => onOpenObraModal('edit_obra', activeObra)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
              title="Editar Dados e Permissões da Obra"
            >
              <Edit3 size={13} />
            </button>
          )}
        </div>

        {activeObra ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Progresso</span>
              <span className="badge badge-emerald">{activeObra?.progress || 0}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', marginTop: '0.35rem', overflow: 'hidden' }}>
              <div style={{ width: `${activeObra?.progress || 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-blue))', transition: 'width 0.4s var(--ease)' }} />
            </div>
          </>
        ) : (
          isAdmin && (
            <button onClick={() => onOpenObraModal('obra')} className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: '0.75rem', padding: '0.25rem' }}>
              <Plus size={13} /> Criar Obra (Admin)
            </button>
          )
        )}
      </div>

      {!activeObra ? (
        <div style={{ padding: '1.25rem 0.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '0.6rem' }}>Escolha uma obra na vitrine para ver o menu dela.</p>
          <button type="button" onClick={() => irPara('hub')} className="btn btn-secondary btn-sm">
            <Grid size={13} /> Ir para a Vitrine de Obras
          </button>
        </div>
      ) : (
        <>
          {/* Menu da obra, agrupado por etapa */}
          <nav aria-label="Menu da obra">
            {secoes.map((secao) => (
              <div key={secao.titulo}>
                <div className="nav-secao">{secao.titulo}</div>
                {secao.itens.map(({ id, rotulo, Icone, badge, roxo, ativo, aoClicar }) => {
                  const ehAtivo = ativo !== undefined ? ativo : activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={aoClicar || (() => irPara(id))}
                      className={`nav-item ${ehAtivo ? 'active' : ''} ${roxo ? 'nav-roxo' : ''}`}
                      aria-current={ehAtivo ? 'page' : undefined}
                    >
                      <span className="nav-label">
                        <Icone size={16} />
                        <span>{rotulo}</span>
                      </span>
                      {badge && <span className={`badge ${roxo ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '0.6rem' }}>{badge}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Quadros da obra: filtram o Kanban por equipamento */}
          <div style={{ marginTop: '0.35rem' }}>
            <div className="nav-secao" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Quadros ({activeQuadros.length})</span>
              <button
                type="button"
                onClick={() => onOpenObraModal('quadro')}
                title="Novo quadro"
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Plus size={14} />
              </button>
            </div>

            {activeQuadros.length === 0 && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.2rem 0.7rem' }}>
                Nenhum quadro ainda. Use o + para criar.
              </p>
            )}

            {activeQuadros.map((quadro) => {
              const ativo = selectedQuadroId === quadro.id && activeTab === 'kanban';
              return (
                <button
                  key={quadro.id}
                  type="button"
                  onClick={() => {
                    setSelectedQuadroId(quadro.id);
                    setActiveTab('kanban');
                  }}
                  className={`nav-item nav-quadro ${ativo ? 'active' : ''}`}
                >
                  <span className="nav-label" style={{ minWidth: 0 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>⚡ {quadro.name}</span>
                  </span>
                  {ativo && <ChevronRight size={13} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
};
