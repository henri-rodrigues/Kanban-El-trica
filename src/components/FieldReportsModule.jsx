import React, { useMemo, useState } from 'react';
import {
  BookOpen, Plus, Search, Printer, Pencil, Trash2, AlertCircle, ChevronLeft, ChevronRight, X, Link as LinkIcon,
  Camera, Mic, Video as VideoIcon, Download, ListPlus, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { RegistroForm } from './diario/RegistroForm';
import { baixar, nomeArquivo } from './dimensionamento/helpers';
import {
  TIPOS_REGISTRO, tipoDe, diaDe, horaDe, rotuloDia, hojeIso, imprimirDiario
} from './diario/utils';
import './diario/diario.css';

const PERIODOS = [
  ['tudo', 'Todo o período'],
  ['hoje', 'Hoje'],
  ['7', 'Últimos 7 dias'],
  ['30', 'Últimos 30 dias']
];

const dentroDoPeriodo = (dia, periodo) => {
  if (periodo === 'tudo') return true;
  if (periodo === 'hoje') return dia === hojeIso();
  const limite = new Date();
  limite.setDate(limite.getDate() - Number(periodo));
  limite.setMinutes(limite.getMinutes() - limite.getTimezoneOffset());
  return dia >= limite.toISOString().slice(0, 10);
};

const Lightbox = ({ fotos, indice, onFechar, onMudar }) => (
  <div className="dr-lightbox" onClick={onFechar} role="dialog" aria-modal="true">
    <button type="button" className="dr-lb-fechar" aria-label="Fechar" onClick={onFechar}><X size={22} /></button>
    {fotos.length > 1 && (
      <button type="button" className="dr-lb-nav dr-lb-ant" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); onMudar((indice - 1 + fotos.length) % fotos.length); }}>
        <ChevronLeft size={26} />
      </button>
    )}
    <img src={fotos[indice]} alt={`Foto ${indice + 1} de ${fotos.length}`} onClick={(e) => e.stopPropagation()} />
    {fotos.length > 1 && (
      <button type="button" className="dr-lb-nav dr-lb-prox" aria-label="Próxima" onClick={(e) => { e.stopPropagation(); onMudar((indice + 1) % fotos.length); }}>
        <ChevronRight size={26} />
      </button>
    )}
    <span className="dr-lb-contador">{indice + 1} / {fotos.length}</span>
  </div>
);

export const FieldReportsModule = () => {
  const { isAdmin, currentUser } = useAuth();
  const { activeObra, activeQuadros, fieldReports, deleteFieldReport, addCard, updateFieldReport } = useData();

  const [form, setForm] = useState(null); // null | { registro? }
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [periodo, setPeriodo] = useState('tudo');
  const [filtroQuadro, setFiltroQuadro] = useState('todos');
  const [filtroAutor, setFiltroAutor] = useState('todos');
  const [lightbox, setLightbox] = useState(null); // { fotos, indice }
  const [expandidos, setExpandidos] = useState({});

  const doObra = useMemo(
    () => fieldReports.filter((r) => r.obraId === activeObra?.id),
    [fieldReports, activeObra]
  );

  if (!activeObra) {
    return (
      <div className="dr-vazio">
        <AlertCircle size={36} />
        <h3>Nenhuma obra selecionada</h3>
        <p>Selecione uma obra na Vitrine para ver e registrar o diário de campo.</p>
      </div>
    );
  }

  const termo = busca.trim().toLowerCase();
  const filtrados = doObra
    .filter((r) => {
      if (tipo !== 'todos' && tipoDe(r).id !== tipo) return false;
      if (!dentroDoPeriodo(diaDe(r), periodo)) return false;
      if (filtroQuadro !== 'todos' && (r.quadroId ?? 'geral') !== filtroQuadro) return false;
      if (filtroAutor !== 'todos' && r.authorId !== filtroAutor) return false;
      if (!termo) return true;
      return (
        r.title?.toLowerCase().includes(termo) ||
        r.description?.toLowerCase().includes(termo) ||
        r.authorName?.toLowerCase().includes(termo) ||
        r.quadroNome?.toLowerCase().includes(termo)
      );
    })
    .sort((a, b) => diaDe(b).localeCompare(diaDe(a)) || horaDe(b).localeCompare(horaDe(a)));

  // agrupa por dia
  const grupos = [];
  filtrados.forEach((r) => {
    const dia = diaDe(r);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dia === dia) ultimo.itens.push(r);
    else grupos.push({ dia, itens: [r] });
  });

  const total = doObra.length;
  const ocorrencias = doObra.filter((r) => tipoDe(r).id === 'ocorrencia').length;
  const pendencias = doObra.filter((r) => tipoDe(r).id === 'pendencia').length;
  const fotos = doObra.reduce((n, r) => n + (r.images?.length ?? 0), 0);
  const ultimaData = total ? diaDe([...doObra].sort((a, b) => diaDe(b).localeCompare(diaDe(a)))[0]) : null;

  const autores = [...new Map(doObra.filter((r) => r.authorId).map((r) => [r.authorId, r.authorName || 'Operador'])).entries()];
  const quadrosUsados = [...new Map(doObra.filter((r) => r.quadroId).map((r) => [r.quadroId, r.quadroNome || 'Quadro'])).entries()];

  const exportarCsv = () => {
    const l = [['Data', 'Hora', 'Tipo', 'Título', 'Descrição', 'Autor', 'Quadro', 'Equipe', 'Fotos']];
    [...filtrados].reverse().forEach((r) =>
      l.push([
        diaDe(r).split('-').reverse().join('/'), horaDe(r), tipoDe(r).rotulo, r.title, r.description,
        r.authorName || '', r.quadroNome || '', (r.nomesEnvolvidos || []).join(', '), (r.images || []).length
      ])
    );
    const csv = l.map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    baixar(`diario-${nomeArquivo(activeObra.name)}.csv`, '\uFEFF' + csv);
  };

  // Ocorrências e pendências viram tarefa no Kanban (do quadro, quando houver).
  const criarTarefa = (r) => {
    const alta = tipoDe(r).id === 'ocorrencia';
    addCard({
      title: r.title,
      description: r.description,
      fieldNotes: `Origem: diário de campo de ${diaDe(r).split('-').reverse().join('/')}.`,
      obraId: activeObra.id,
      quadroId: r.quadroId ?? null,
      level: r.quadroId ? 'quadro' : 'obra',
      column: 'todo',
      priority: alta ? 'Alta' : 'Média',
      categoryTag: 'HVAC',
      gradientId: 'amber',
      assignedUserId: currentUser?.id,
      assignedUserName: currentUser?.name,
      subtasks: [],
      images: [],
      workedDays: [],
      origem: { tipo: 'diario', registroId: r.id }
    });
    updateFieldReport(r.id, { tarefaCriada: true });
  };

  const podeEditar = (r) => isAdmin || r.authorId === currentUser?.id;
  const rotuloPeriodo = PERIODOS.find(([id]) => id === periodo)?.[1] ?? '';

  const exportar = () =>
    imprimirDiario(filtrados, { obra: activeObra, periodo: rotuloPeriodo, autor: currentUser?.name });

  return (
    <div className="dr-wrap">
      <div className="dr-topo">
        <div>
          <h2><BookOpen size={20} /> Diário de campo</h2>
          <span className="dr-dica">{activeObra.name} · registros do dia a dia da obra com fotos, áudio e anexos</span>
        </div>
        <span className="dr-espaco" />
        <button type="button" className="btn btn-secondary btn-sm" onClick={exportarCsv} disabled={filtrados.length === 0}>
          <Download size={14} /> CSV
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={exportar} disabled={filtrados.length === 0}>
          <Printer size={14} /> Exportar PDF
        </button>
        <button type="button" className="btn btn-primary btn-fab-mobile" onClick={() => setForm({})}>
          <Plus size={15} /> Novo registro
        </button>
      </div>

      <div className="dr-kpis">
        <div className="dr-kpi"><span>Registros</span><strong>{total}</strong></div>
        <div className={`dr-kpi ${ocorrencias ? 'dr-kpi-rose' : ''}`}><span>Ocorrências</span><strong>{ocorrencias}</strong></div>
        <div className={`dr-kpi ${pendencias ? 'dr-kpi-amber' : ''}`}><span>Pendências</span><strong>{pendencias}</strong></div>
        <div className="dr-kpi"><span>Fotos</span><strong>{fotos}</strong></div>
        <div className="dr-kpi"><span>Último registro</span><strong>{ultimaData ? ultimaData.split('-').reverse().slice(0, 2).join('/') : '—'}</strong></div>
      </div>

      {total > 0 && (
        <div className="dr-filtros">
          <label className="dr-busca">
            <Search size={14} />
            <input className="form-control" placeholder="Buscar por título, texto, autor ou quadro…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          <select className="form-control" style={{ width: 'auto' }} value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Período">
            {PERIODOS.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
          </select>
          {quadrosUsados.length > 0 && (
            <select className="form-control" style={{ width: 'auto' }} value={filtroQuadro} onChange={(e) => setFiltroQuadro(e.target.value)} aria-label="Quadro">
              <option value="todos">Todos os quadros</option>
              <option value="geral">Geral da obra</option>
              {quadrosUsados.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
            </select>
          )}
          {autores.length > 1 && (
            <select className="form-control" style={{ width: 'auto' }} value={filtroAutor} onChange={(e) => setFiltroAutor(e.target.value)} aria-label="Autor">
              <option value="todos">Todos os autores</option>
              {autores.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
            </select>
          )}
          <div className="dr-chips" role="group" aria-label="Tipo de registro">
            <button type="button" className={`dr-chip ${tipo === 'todos' ? 'ativo' : ''}`} onClick={() => setTipo('todos')}>Todos</button>
            {TIPOS_REGISTRO.map((t) => (
              <button key={t.id} type="button" className={`dr-chip dr-${t.tom} ${tipo === t.id ? 'ativo' : ''}`} onClick={() => setTipo(t.id)}>
                {t.rotulo}
              </button>
            ))}
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="dr-vazio">
          <BookOpen size={36} />
          <h3>Nenhum registro ainda</h3>
          <p>Registre o que foi feito no dia, ocorrências e pendências, com fotos e áudio. Quem você marcar na equipe é avisado.</p>
          <button type="button" className="btn btn-primary" onClick={() => setForm({})}><Plus size={15} /> Fazer o primeiro registro</button>
        </div>
      ) : filtrados.length === 0 ? (
        <p className="dr-dica" style={{ textAlign: 'center', padding: '1.5rem' }}>Nenhum registro encontrado com esses filtros.</p>
      ) : (
        grupos.map((g) => (
          <section key={g.dia} className="dr-dia">
            <h3 className="dr-dia-titulo">{rotuloDia(g.dia)} <span>{g.itens.length} registro(s)</span></h3>

            {g.itens.map((r) => {
              const t = tipoDe(r);
              const longo = (r.description || '').length > 260;
              const aberto = !!expandidos[r.id];
              const imgs = r.images || [];
              return (
                <article key={r.id} className={`dr-registro dr-borda-${t.tom}`}>
                  <header>
                    <div className="dr-reg-titulo">
                      <span className={`dr-selo dr-${t.tom}`}>{t.rotulo}</span>
                      <h4>{r.title}</h4>
                    </div>
                    {podeEditar(r) && (
                      <div className="dr-reg-acoes">
                        <button type="button" className="btn btn-ghost btn-sm" title="Editar" onClick={() => setForm({ registro: r })}><Pencil size={14} /></button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          title="Excluir"
                          onClick={() => window.confirm(`Excluir o registro "${r.title}"?`) && deleteFieldReport(activeObra.id, r.id)}
                        ><Trash2 size={14} /></button>
                      </div>
                    )}
                  </header>

                  <div className="dr-meta">
                    {horaDe(r)} · {r.authorName || 'Operador'}
                    {r.quadroNome && <span className="dr-quadro">Quadro {r.quadroNome}</span>}
                    {r.editedAt && <span className="dr-editado">editado</span>}
                  </div>

                  <p className={`dr-texto ${longo && !aberto ? 'dr-recorte' : ''}`}>{r.description}</p>
                  {longo && (
                    <button type="button" className="dr-link" onClick={() => setExpandidos((p) => ({ ...p, [r.id]: !aberto }))}>
                      {aberto ? 'Mostrar menos' : 'Ler mais'}
                    </button>
                  )}

                  {imgs.length > 0 && (
                    <div className="dr-galeria">
                      {imgs.map((img, i) => (
                        <button key={i} type="button" className="dr-miniatura" onClick={() => setLightbox({ fotos: imgs, indice: i })} aria-label={`Abrir foto ${i + 1}`}>
                          <img src={img} alt={`Foto ${i + 1}`} loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}

                  {(r.audios || []).map((a, i) => (
                    <div className="dr-player" key={`a${i}`}><Mic size={14} /><audio controls src={a} /></div>
                  ))}
                  {(r.videos || []).map((v, i) => (
                    <div className="dr-player" key={`v${i}`}><VideoIcon size={14} /><video controls src={v} /></div>
                  ))}

                  {(r.links || []).length > 0 && (
                    <div className="dr-links">
                      {r.links.map((l, i) => (
                        <a key={i} href={/^https?:\/\//i.test(l) ? l : `https://${l}`} target="_blank" rel="noreferrer noopener">
                          <LinkIcon size={12} /> {l.replace(/^https?:\/\//i, '').slice(0, 48)}
                        </a>
                      ))}
                    </div>
                  )}

                  {((r.nomesEnvolvidos || []).length > 0 || ['ocorrencia', 'pendencia'].includes(t.id)) && (
                    <footer>
                      {(r.nomesEnvolvidos || []).map((n) => <span key={n} className="dr-equipe">{n.split(' ')[0]}</span>)}
                      {['ocorrencia', 'pendencia'].includes(t.id) && (
                        r.tarefaCriada ? (
                          <span className="dr-tarefa ok"><CheckCircle2 size={11} /> tarefa criada no Kanban</span>
                        ) : (
                          <button type="button" className="dr-tarefa" onClick={() => criarTarefa(r)}>
                            <ListPlus size={11} /> Criar tarefa no Kanban
                          </button>
                        )
                      )}
                    </footer>
                  )}
                </article>
              );
            })}
          </section>
        ))
      )}

      {form && (
        <RegistroForm obra={activeObra} quadros={activeQuadros} registro={form.registro} onFechar={() => setForm(null)} />
      )}

      {lightbox && (
        <Lightbox
          fotos={lightbox.fotos}
          indice={lightbox.indice}
          onFechar={() => setLightbox(null)}
          onMudar={(i) => setLightbox((l) => ({ ...l, indice: i }))}
        />
      )}
    </div>
  );
};
