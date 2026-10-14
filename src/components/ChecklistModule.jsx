import React, { useMemo, useState } from 'react';
import { ClipboardCheck, Plus, Search, AlertCircle, ShieldCheck, Download } from 'lucide-react';
import { useData } from '../context/DataContext';
import { dataHora, baixar, nomeArquivo } from './dimensionamento/helpers';
import { LaudoForm } from './checklist/LaudoForm';
import { LaudoDetalhe } from './checklist/LaudoDetalhe';
import './checklist/checklist.css';

/**
 * Checklist de conferência e liberação de quadros elétricos.
 * `quadroFixoId`: quando informado (pasta do quadro), mostra só os laudos desse quadro.
 */
export const ChecklistModule = ({ quadroFixoId = null, onNavigate }) => {
  const { activeObra, activeQuadros, laudos, deleteLaudo } = useData();

  const [tela, setTela] = useState({ nome: 'lista' }); // lista | novo | detalhe | editar
  const [busca, setBusca] = useState('');
  const [filtroQuadro, setFiltroQuadro] = useState('todos');
  const [filtroSituacao, setFiltroSituacao] = useState('todos'); // todos | nok | ok

  const doEscopo = useMemo(
    () =>
      laudos
        .filter((l) => l.obraId === activeObra?.id)
        .filter((l) => !quadroFixoId || l.quadroId === quadroFixoId)
        .sort((a, b) => (b.dataHora ?? '').localeCompare(a.dataHora ?? '')),
    [laudos, activeObra, quadroFixoId]
  );

  if (!activeObra) {
    return (
      <div className="ck-vazio">
        <AlertCircle size={36} />
        <h3>Nenhuma obra selecionada</h3>
        <p>Selecione uma obra na Vitrine para registrar os checklists dos quadros.</p>
      </div>
    );
  }

  const laudoAtual = tela.id ? laudos.find((l) => l.id === tela.id) : null;
  const voltar = () => setTela({ nome: 'lista' });

  if (tela.nome === 'novo' || tela.nome === 'editar') {
    return (
      <LaudoForm
        obra={activeObra}
        obraQuadros={activeQuadros}
        laudo={tela.nome === 'editar' ? laudoAtual : null}
        quadroFixoId={quadroFixoId}
        quadroSugeridoId={tela.quadroId}
        onNavigate={onNavigate}
        onCancelar={() => (laudoAtual ? setTela({ nome: 'detalhe', id: laudoAtual.id }) : voltar())}
        onSalvo={(l) => setTela({ nome: 'detalhe', id: l.id })}
      />
    );
  }

  if (tela.nome === 'detalhe' && laudoAtual) {
    return (
      <LaudoDetalhe
        laudo={laudoAtual}
        obra={activeObra}
        onVoltar={voltar}
        onEditar={() => setTela({ nome: 'editar', id: laudoAtual.id })}
        onExcluir={() => {
          if (window.confirm(`Excluir o relatório Nº ${laudoAtual.numero} (${laudoAtual.quadroNome})?`)) {
            deleteLaudo(laudoAtual.id);
            voltar();
          }
        }}
      />
    );
  }

  // ----- lista -----
  const termo = busca.trim().toLowerCase();
  const lista = doEscopo.filter((l) => {
    if (filtroQuadro !== 'todos' && (l.quadroId ?? l.quadroNome) !== filtroQuadro) return false;
    const nc = l.estatisticas?.naoConformes ?? 0;
    if (filtroSituacao === 'nok' && nc === 0) return false;
    if (filtroSituacao === 'ok' && nc > 0) return false;
    if (!termo) return true;
    return (
      String(l.numero).includes(termo) ||
      l.quadroNome?.toLowerCase().includes(termo) ||
      l.inspetor?.toLowerCase().includes(termo)
    );
  });

  const quadrosComLaudo = [...new Map(doEscopo.map((l) => [l.quadroId ?? l.quadroNome, l.quadroNome])).entries()];
  const total = doEscopo.length;
  const comNaoConforme = doEscopo.filter((l) => (l.estatisticas?.naoConformes ?? 0) > 0).length;
  const mediaConf = total ? Math.round(doEscopo.reduce((s, l) => s + (l.estatisticas?.percentualConformidade ?? 0), 0) / total) : 0;

  // Quadros da obra que ainda não têm nenhum laudo.
  const pendentes = quadroFixoId
    ? []
    : activeQuadros.filter((q) => !laudos.some((l) => l.obraId === activeObra.id && (l.quadroId === q.id)));

  const exportarCsv = () => {
    const cab = ['Nº', 'Quadro', 'Data', 'Inspetor', 'Itens', 'Conformes', 'Não conformes', 'Conformidade (%)'];
    const linhas = lista.map((l) => {
      const e = l.estatisticas || {};
      return [l.numero, l.quadroNome, dataHora(l.dataHora), l.inspetor, e.totalItens ?? '', e.conformes ?? '', e.naoConformes ?? 0, e.percentualConformidade ?? 0];
    });
    const csv = [cab, ...linhas].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    baixar(`checklists-${nomeArquivo(activeObra.name)}.csv`, '\uFEFF' + csv);
  };

  return (
    <div className="ck-wrap">
      <div className="ck-barra">
        <div>
          <h2><ClipboardCheck size={20} /> Checklist de quadros</h2>
          <span className="ck-dica">{activeObra.name} · conferência e liberação com critérios de aceite, fotos e assinatura</span>
        </div>
        <span className="ck-espaco" />
        {total > 0 && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportarCsv} disabled={lista.length === 0}>
            <Download size={13} /> CSV
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={() => setTela({ nome: 'novo' })}>
          <Plus size={15} /> Novo checklist
        </button>
      </div>

      {activeQuadros.length === 0 && !quadroFixoId && (
        <div className="ck-erro" style={{ background: 'var(--wash-amber)', color: 'var(--text-primary)', fontWeight: 500 }}>
          Para criar um checklist é preciso ter um quadro na obra: cada checklist fica na pasta do quadro conferido.{' '}
          {onNavigate && (
            <button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: 6 }} onClick={() => onNavigate('quadros')}>
              Criar quadro
            </button>
          )}
        </div>
      )}

      <div className="ck-kpis">
        <div className="ck-kpi"><span>Relatórios</span><strong>{total}</strong></div>
        <div className={`ck-kpi ${comNaoConforme ? 'ck-kpi-nok' : ''}`}><span>Com não conformidade</span><strong>{comNaoConforme}</strong></div>
        <div className="ck-kpi ck-kpi-ok"><span>Conformidade média</span><strong>{mediaConf}%</strong></div>
      </div>

      {pendentes.length > 0 && (
        <div className="ck-pendentes">
          <span><strong>Sem checklist:</strong></span>
          {pendentes.map((q) => (
            <button key={q.id} type="button" className="ck-chip-pend" onClick={() => setTela({ nome: 'novo', quadroId: q.id })}>
              <Plus size={11} /> {q.name}
            </button>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="ck-filtros">
          <label className="ck-busca">
            <Search size={14} />
            <input className="form-control" placeholder="Buscar por nº, quadro ou inspetor…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          {!quadroFixoId && quadrosComLaudo.length > 1 && (
            <select className="form-control" style={{ width: 'auto' }} value={filtroQuadro} onChange={(e) => setFiltroQuadro(e.target.value)} aria-label="Filtrar por quadro">
              <option value="todos">Todos os quadros</option>
              {quadrosComLaudo.map(([chave, nome]) => <option key={chave} value={chave}>{nome}</option>)}
            </select>
          )}
          <div className="ck-chips" role="group" aria-label="Situação">
            {[['todos', 'Todos'], ['nok', 'Com não conformidade'], ['ok', 'Conformes']].map(([id, rot]) => (
              <button key={id} type="button" className={`ck-chip ${filtroSituacao === id ? 'ativo' : ''}`} onClick={() => setFiltroSituacao(id)}>{rot}</button>
            ))}
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="ck-vazio">
          <ShieldCheck size={36} />
          <h3>Nenhum checklist registrado</h3>
          <p>Escolha um quadro da obra, confira os 37 itens, anexe fotos das não conformidades e gere o laudo com assinatura. Ele fica salvo na pasta do quadro.</p>
          <button type="button" className="btn btn-primary" onClick={() => setTela({ nome: 'novo' })}>
            <Plus size={15} /> Criar o primeiro checklist
          </button>
        </div>
      ) : (
        <div className="ck-grade-cartoes">
          {lista.map((l) => {
            const e = l.estatisticas || {};
            const nc = e.naoConformes ?? 0;
            return (
              <button key={l.id} type="button" className="ck-cartao" onClick={() => setTela({ nome: 'detalhe', id: l.id })}>
                <div className="ck-cartao-topo">
                  <span className="ck-numero">Nº {l.numero}</span>
                  <span className={`ck-selo ${nc ? 'ck-selo-nok' : 'ck-selo-ok'}`}>{nc ? `${nc} não conforme(s)` : 'Conforme'}</span>
                </div>
                <strong>{l.quadroNome}</strong>
                <span className="ck-dica">{dataHora(l.dataHora)} · {l.inspetor}</span>
                <div className="ck-barra-prog"><i style={{ width: `${e.percentualConformidade ?? 0}%` }} /></div>
                <span className="ck-dica">{e.percentualConformidade ?? 0}% de conformidade · {e.conformes ?? 0}/{e.totalItens ?? 0} itens conformes</span>
              </button>
            );
          })}
          {lista.length === 0 && <p className="ck-dica">Nenhum relatório encontrado para essa busca.</p>}
        </div>
      )}
    </div>
  );
};
