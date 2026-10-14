import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon, Plus, Plane, ChevronLeft, ChevronRight, AlertCircle, Pencil, Trash2, Car, MapPin,
  Download, Printer, Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ModalShell } from './dimensionamento/ModalShell';
import { hojeIso } from './diario/utils';
import { baixar, nomeArquivo, imprimirHtml, h } from './dimensionamento/helpers';
import './escala/escala.css';

import { Valor, useFormatoValor } from './Valor';
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const VALOR_KM = 1.5;
const MAX_POR_CARRO = 4;

const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const dataBr = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const nomesDe = (t) => (t.userNames?.length ? t.userNames : [t.userName || 'Equipe']);
const idsDe = (t) => t.userIds || (t.userId ? [t.userId] : []);

const situacao = (t, hoje) => (t.endDate < hoje ? 'passada' : t.startDate <= hoje ? 'andamento' : 'futura');
const custoViagem = (km, pessoas) => {
  const base = (parseFloat(km) || 0) * VALOR_KM;
  return pessoas > MAX_POR_CARRO ? base * 2 : base;
};

// ---------------------------------------------------------------- formulário
const ViagemForm = ({ obra, viagem, modelo, dataInicial, todasViagens, onFechar }) => {
  const { users, currentUser } = useAuth();
  const { addScheduledTrip, updateScheduledTrip, addNotification } = useData();
  const origem = viagem ?? modelo;
  const editando = !!viagem;

  const equipe = useMemo(() => {
    const aprovados = users.filter((u) => u.status === 'approved' || u.status === undefined);
    const doProjeto = obra.assignedUserIds || [];
    return [...aprovados].sort((a, b) => Number(doProjeto.includes(b.id)) - Number(doProjeto.includes(a.id)));
  }, [users, obra]);

  const [ids, setIds] = useState(origem ? idsDe(origem) : (obra.assignedUserIds || []).slice(0, 1));
  const [inicio, setInicio] = useState(viagem?.startDate ?? dataInicial ?? hojeIso());
  const [fim, setFim] = useState(viagem?.endDate ?? dataInicial ?? hojeIso());
  const [notas, setNotas] = useState(origem?.notes ?? '');
  const [erro, setErro] = useState('');

  const km = parseFloat(obra.distanceKm) || 0;
  const duplo = ids.length > MAX_POR_CARRO;
  const custo = custoViagem(km, ids.length);

  const conflitos = useMemo(() => {
    if (!inicio || !fim) return [];
    const achados = new Set();
    todasViagens.forEach((t) => {
      if (viagem && t.id === viagem.id) return;
      if (t.endDate < inicio || t.startDate > fim) return;
      idsDe(t).filter((id) => ids.includes(id)).forEach((id) => {
        const u = users.find((x) => x.id === id);
        if (u) achados.add(`${u.name.split(' ')[0]} (${t.obraName})`);
      });
    });
    return [...achados];
  }, [todasViagens, ids, inicio, fim, viagem, users]);

  const alternar = (id) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const salvar = (e) => {
    e.preventDefault();
    if (!ids.length) return setErro('Escolha ao menos uma pessoa.');
    if (!inicio || !fim) return setErro('Informe as datas de ida e volta.');
    if (fim < inicio) return setErro('A volta não pode ser antes da ida.');
    const sel = users.filter((u) => ids.includes(u.id));
    const dados = {
      userIds: ids,
      userNames: sel.map((u) => u.name),
      userName: sel.map((u) => u.name).join(', '),
      userColorTag: sel[0]?.userColorTag || 'var(--accent-blue)',
      startDate: inicio,
      endDate: fim,
      distanceKm: km,
      cost: custo,
      isDoubleCar: duplo,
      notes: notas.trim() || `Viagem de serviço para ${obra.name}`
    };
    if (editando) {
      updateScheduledTrip(obra.id, viagem.id, dados);
      ids.filter((id) => id !== currentUser?.id).forEach((id) =>
        addNotification({
          recipientUserId: id,
          senderUserId: currentUser?.id,
          senderName: currentUser?.name,
          type: 'travel_schedule',
          title: 'Viagem alterada',
          message: `${currentUser?.name} atualizou a viagem para "${obra.name}": ${dataBr(inicio)} a ${dataBr(fim)}.`,
          obraId: obra.id
        })
      );
    } else {
      addScheduledTrip(obra.id, dados);
    }
    onFechar();
  };

  return (
    <ModalShell title={editando ? 'Editar viagem' : modelo ? 'Duplicar viagem' : 'Agendar viagem'} subtitle={obra.name} onClose={onFechar} maxWidth={540}>
      <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div className="dq-grid">
          <label className="dq-field">
            <span>Ida</span>
            <input className="form-control" type="date" required value={inicio} onChange={(e) => { setInicio(e.target.value); if (fim < e.target.value) setFim(e.target.value); }} />
          </label>
          <label className="dq-field">
            <span>Volta</span>
            <input className="form-control" type="date" required min={inicio} value={fim} onChange={(e) => setFim(e.target.value)} />
          </label>
        </div>

        <div className="dq-field">
          <span>Equipe ({ids.length})</span>
          <div className="es-pessoas">
            {equipe.map((u) => (
              <button key={u.id} type="button" className={`es-pessoa ${ids.includes(u.id) ? 'ativo' : ''}`} onClick={() => alternar(u.id)}>
                {u.name.split(' ')[0]}
                {(obra.assignedUserIds || []).includes(u.id) && <small>· obra</small>}
              </button>
            ))}
          </div>
        </div>

        <div className="es-custo">
          <span><Car size={13} /> {duplo ? '2 carros (mais de 4 pessoas)' : '1 carro'}</span>
          <span>{km} km × {brl(VALOR_KM)}/km{duplo ? ' × 2' : ''} = <strong><Valor v={custo} /></strong></span>
        </div>

        {conflitos.length > 0 && (
          <div className="es-aviso">Atenção: já viajam nesse período — {conflitos.join(', ')}.</div>
        )}

        <label className="dq-field">
          <span>Objetivo / observações</span>
          <textarea className="form-control" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ex.: Instalação dos quadros do 2º pavimento" />
        </label>

        {erro && <div className="es-erro" role="alert">{erro}</div>}
        <div className="es-acoes">
          <button type="button" className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary">{editando ? 'Salvar alterações' : 'Agendar viagem'}</button>
        </div>
      </form>
    </ModalShell>
  );
};

// ---------------------------------------------------------------- principal
export const ScheduleModule = ({ defaultViewMode = 'obra' }) => {
  const { isAdmin, currentUser, users } = useAuth();
  const { obras, activeObra, deleteScheduledTrip, addNotification } = useData();

  const [modo, setModo] = useState(defaultViewMode); // 'obra' | 'personal'
  useEffect(() => { if (defaultViewMode) setModo(defaultViewMode); }, [defaultViewMode]);

  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [form, setForm] = useState(null); // { viagem?, dataInicial?, obra }
  const [detalhe, setDetalhe] = useState(null);

  const hoje = hojeIso();

  const todas = useMemo(
    () => obras.flatMap((o) => (o.scheduledTrips || []).map((t) => ({ ...t, obraId: o.id, obraName: o.name, obraClient: o.client }))),
    [obras]
  );
  const daObra = useMemo(
    () => todas.filter((t) => t.obraId === activeObra?.id).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [todas, activeObra]
  );
  const minhas = useMemo(
    () => todas.filter((t) => currentUser && idsDe(t).includes(currentUser.id)).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [todas, currentUser]
  );

  const pessoal = modo === 'personal' || !activeObra;
  const lista = pessoal ? minhas : daObra;
  const custoTotal = daObra.reduce((s, t) => s + (parseFloat(t.cost) || 0), 0);
  const proxima = lista.find((t) => t.endDate >= hoje);
  const distanciaKm = parseFloat(activeObra?.distanceKm) || 0;

  const ano = mes.getFullYear();
  const mesNum = mes.getMonth();
  const diasNoMes = new Date(ano, mesNum + 1, 0).getDate();
  const primeiroDia = new Date(ano, mesNum, 1).getDay();
  const isoDia = (d) => `${ano}-${String(mesNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const mudarMes = (n) => setMes(new Date(ano, mesNum + n, 1));

  const excluir = (t) => {
    if (!window.confirm(`Cancelar a viagem de ${dataBr(t.startDate)} a ${dataBr(t.endDate)}?`)) return;
    deleteScheduledTrip(t.obraId, t.id);
    idsDe(t).filter((id) => id !== currentUser?.id).forEach((id) =>
      addNotification({
        recipientUserId: id,
        senderUserId: currentUser?.id,
        senderName: currentUser?.name,
        type: 'travel_schedule',
        title: 'Viagem cancelada',
        message: `${currentUser?.name} cancelou a viagem para "${t.obraName}" (${dataBr(t.startDate)} a ${dataBr(t.endDate)}).`,
        obraId: t.obraId
      })
    );
    setDetalhe(null);
  };

  const duplicar = (t) => {
    const obra = obras.find((o) => o.id === t.obraId);
    if (obra) { setDetalhe(null); setForm({ obra, modelo: t, dataInicial: hoje }); }
  };

  const corDe = (t) => users.find((u) => u.id === idsDe(t)[0])?.userColorTag;

  // dias de viagem de cada pessoa no mês exibido
  const diasPorPessoa = (() => {
    const mapa = new Map();
    const ini = `${ano}-${String(mesNum + 1).padStart(2, '0')}-01`;
    const fimMes = `${ano}-${String(mesNum + 1).padStart(2, '0')}-${String(diasNoMes).padStart(2, '0')}`;
    lista.forEach((t) => {
      const a = t.startDate > ini ? t.startDate : ini;
      const b = t.endDate < fimMes ? t.endDate : fimMes;
      if (a > b) return;
      const dias = Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000) + 1;
      idsDe(t).forEach((id) => mapa.set(id, (mapa.get(id) || 0) + dias));
    });
    return [...mapa.entries()]
      .map(([id, dias]) => [users.find((u) => u.id === id)?.name || 'Pessoa', dias])
      .sort((a, b) => b[1] - a[1]);
  })();

  const exportarCsv = () => {
    const l = [['Obra', 'Ida', 'Volta', 'Equipe', 'Carros', 'Custo (R$)', 'Objetivo']];
    lista.forEach((t) =>
      l.push([t.obraName, dataBr(t.startDate), dataBr(t.endDate), nomesDe(t).join(', '), t.isDoubleCar ? 2 : 1, String(t.cost ?? '').replace('.', ','), t.notes || ''])
    );
    const csv = l.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    baixar(`escala-viagens-${nomeArquivo(pessoal ? 'minha-agenda' : activeObra.name)}.csv`, '\uFEFF' + csv);
  };

  const exportarPdf = () => {
    const linhas = lista.map((t) => `<tr><td>${h(dataBr(t.startDate))} → ${h(dataBr(t.endDate))}</td><td>${h(t.obraName)}</td><td>${h(nomesDe(t).join(', '))}</td><td>${t.isDoubleCar ? 2 : 1}</td>${isAdmin ? `<td class="n">${h(Number(t.cost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}</td>` : ''}<td>${h(t.notes || '')}</td></tr>`).join('');
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Escala de viagens</title><style>
      *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1f2733;margin:22px;font-size:12px}
      h1{font-size:20px;margin:0}.sub{color:#667085}.cab{border-bottom:3px solid #4f7cf0;padding-bottom:10px;margin-bottom:14px}
      table{width:100%;border-collapse:collapse}th{text-align:left;background:#f3f5fa;font-size:10px;text-transform:uppercase;padding:5px 6px}
      td{padding:5px 6px;border-bottom:1px solid #e3e7f0}.n{text-align:right;white-space:nowrap}
    </style></head><body>
      <div class="cab"><h1>Escala de viagens</h1>
      <div class="sub">${h(pessoal ? 'Minha agenda' : activeObra.name)} · ${lista.length} viagem(ns) · ${new Date().toLocaleDateString('pt-BR')}</div></div>
      <table><tr><th>Período</th><th>Obra</th><th>Equipe</th><th>Carros</th>${isAdmin ? '<th class="n">Custo</th>' : ''}<th>Objetivo</th></tr>${linhas}</table>
      <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})<\/script>
    </body></html>`;
    if (!imprimirHtml(html)) window.alert('Permita pop-ups para gerar o PDF.');
  };

  const abrirNovo = (dataInicial) => {
    if (!isAdmin || !activeObra) return;
    setForm({ obra: activeObra, dataInicial });
  };
  const abrirEdicao = (t) => {
    const obra = obras.find((o) => o.id === t.obraId);
    if (obra) { setDetalhe(null); setForm({ obra, viagem: t }); }
  };


  if (!activeObra && modo === 'obra' && minhas.length === 0 && todas.length === 0) {
    return (
      <div className="es-vazio">
        <AlertCircle size={36} />
        <h3>Nenhuma obra selecionada</h3>
        <p>Selecione uma obra na Vitrine para ver e agendar as viagens da equipe.</p>
      </div>
    );
  }

  const grupos = [
    ['Em andamento', lista.filter((t) => situacao(t, hoje) === 'andamento')],
    ['Próximas', lista.filter((t) => situacao(t, hoje) === 'futura')],
    ['Realizadas', [...lista.filter((t) => situacao(t, hoje) === 'passada')].reverse()]
  ].filter(([, itens]) => itens.length);

  return (
    <div className="es-wrap">
      <div className="es-topo">
        <div>
          <h2><Plane size={20} /> Escala de viagens</h2>
          <span className="es-dica">
            {pessoal ? `Minhas viagens em todas as obras` : `${activeObra.name} · ${distanciaKm} km · ${brl(VALOR_KM)}/km · acima de ${MAX_POR_CARRO} pessoas = 2 carros`}
          </span>
        </div>
        <span className="es-espaco" />
        <div className="es-seg" role="group" aria-label="Visão">
          {activeObra && (
            <button type="button" className={modo === 'obra' ? 'ativo' : ''} onClick={() => setModo('obra')}>Da obra</button>
          )}
          <button type="button" className={`pessoal ${pessoal ? 'ativo' : ''}`} onClick={() => setModo('personal')}>Minha agenda</button>
        </div>
        {lista.length > 0 && (
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportarCsv}><Download size={13} /> CSV</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportarPdf}><Printer size={13} /> PDF</button>
          </>
        )}
        {isAdmin && activeObra && !pessoal && (
          <button type="button" className="btn btn-primary" onClick={() => abrirNovo(hoje)}>
            <Plus size={15} /> Agendar viagem
          </button>
        )}
      </div>

      <div className="es-kpis">
        <div className="es-kpi">
          <span>{pessoal ? 'Minhas viagens' : 'Viagens da obra'}</span>
          <strong>{lista.length}</strong>
          <small>{lista.filter((t) => situacao(t, hoje) !== 'passada').length} em andamento ou futuras</small>
        </div>
        <div className="es-kpi">
          <span>Próxima viagem</span>
          <strong>{proxima ? dataBr(proxima.startDate).slice(0, 5) : '—'}</strong>
          <small>{proxima ? (pessoal ? proxima.obraName : nomesDe(proxima).map((n) => n.split(' ')[0]).join(', ')) : 'nada agendado'}</small>
        </div>
        {!pessoal && isAdmin && (
          <div className="es-kpi amber">
            <span>Custo de viagens</span>
            <strong><Valor v={custoTotal} /></strong>
            <small>debitado dos indiretos da obra</small>
          </div>
        )}
        {pessoal && (
          <div className="es-kpi">
            <span>Obras com viagem</span>
            <strong>{new Set(minhas.map((t) => t.obraId)).size}</strong>
            <small>na sua agenda</small>
          </div>
        )}
      </div>

      <div className="es-grade">
        <div className="es-card">
          <div className="es-mes">
            <button type="button" className="btn btn-secondary btn-sm" aria-label="Mês anterior" onClick={() => mudarMes(-1)}><ChevronLeft size={15} /></button>
            <h3>{MESES[mesNum]} {ano}</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { const d = new Date(); setMes(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Hoje</button>
            <button type="button" className="btn btn-secondary btn-sm" aria-label="Próximo mês" onClick={() => mudarMes(1)}><ChevronRight size={15} /></button>
          </div>

          <div className="es-dias-semana">{SEMANA.map((d) => <div key={d}>{d}</div>)}</div>
          <div className="es-dias">
            {Array.from({ length: primeiroDia }).map((_, i) => <div key={`v${i}`} className="es-dia vazio" />)}
            {Array.from({ length: diasNoMes }, (_, i) => i + 1).map((d) => {
              const iso = isoDia(d);
              const doDia = lista.filter((t) => iso >= t.startDate && iso <= t.endDate);
              const fds = [0, 6].includes(new Date(ano, mesNum, d).getDay());
              const clicavel = isAdmin && !pessoal;
              return (
                <div
                  key={d}
                  role={clicavel ? 'button' : undefined}
                  tabIndex={clicavel ? 0 : undefined}
                  className={`es-dia ${iso === hoje ? 'hoje' : ''} ${fds ? 'fds' : ''} ${clicavel ? 'clicavel' : ''}`}
                  onClick={() => clicavel && abrirNovo(iso)}
                  onKeyDown={(e) => clicavel && e.key === 'Enter' && abrirNovo(iso)}
                >
                  <span className="es-dia-num">{d}</span>
                  {doDia.slice(0, 2).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`es-chip ${pessoal ? 'pessoal' : t.isDoubleCar ? 'duplo' : ''}`}
                      style={!pessoal && !t.isDoubleCar && corDe(t) ? { background: corDe(t) } : undefined}
                      title={`${pessoal ? t.obraName : nomesDe(t).join(', ')} — ${t.notes || ''}`}
                      onClick={(e) => { e.stopPropagation(); setDetalhe(t); }}
                    >
                      {pessoal ? t.obraName : nomesDe(t)[0].split(' ')[0]}
                    </button>
                  ))}
                  {doDia.length > 2 && <span className="es-mais">+{doDia.length - 2}</span>}
                </div>
              );
            })}
          </div>
          <span className="es-dica">{isAdmin && !pessoal ? 'Clique em um dia para agendar; clique numa viagem para ver os detalhes.' : 'Clique numa viagem para ver os detalhes.'}</span>
        </div>

        <div className="es-card">
          <h3><CalendarIcon size={15} style={{ verticalAlign: '-2px' }} /> Viagens ({lista.length})</h3>
          {lista.length === 0 ? (
            <div className="es-vazio">
              <Plane size={28} />
              <span>{pessoal ? 'Você não tem viagens agendadas.' : 'Nenhuma viagem agendada nesta obra.'}</span>
              {isAdmin && !pessoal && <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirNovo(hoje)}><Plus size={14} /> Agendar a primeira</button>}
            </div>
          ) : (
            <div className="es-lista">
              {grupos.map(([titulo, itens]) => (
                <React.Fragment key={titulo}>
                  <div className="es-grupo-titulo">{titulo}</div>
                  {itens.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`es-viagem ${pessoal ? 'pessoal' : t.isDoubleCar ? 'duplo' : ''} ${situacao(t, hoje) === 'passada' ? 'passada' : ''}`}
                      onClick={() => setDetalhe(t)}
                    >
                      <strong>{dataBr(t.startDate)}{t.endDate !== t.startDate ? ` → ${dataBr(t.endDate)}` : ''}</strong>
                      <small>{pessoal ? `${t.obraName} · ` : ''}{nomesDe(t).join(', ')}</small>
                      <span className={`es-selo ${t.isDoubleCar ? 'duplo' : situacao(t, hoje) === 'andamento' ? 'andamento' : ''}`}>
                        {t.isDoubleCar ? '2 carros' : '1 carro'}{!pessoal && isAdmin ? <> · <Valor v={t.cost} /></> : ''}
                      </span>
                    </button>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {diasPorPessoa.length > 0 && (
        <div className="es-card">
          <h3>Dias de viagem em {MESES[mesNum]}</h3>
          <div className="es-pessoas">
            {diasPorPessoa.map(([nome, dias]) => (
              <span key={nome} className="es-pessoa ativo" style={{ cursor: 'default' }}>
                {nome.split(' ')[0]} · {dias} dia(s)
              </span>
            ))}
          </div>
        </div>
      )}

      {detalhe && (
        <ModalShell title="Detalhes da viagem" subtitle={detalhe.obraName} onClose={() => setDetalhe(null)} maxWidth={460}>
          <dl className="es-detalhe">
            <div><dt>Período</dt><dd>{dataBr(detalhe.startDate)} até {dataBr(detalhe.endDate)}</dd></div>
            <div><dt>Equipe</dt><dd>{nomesDe(detalhe).join(', ')}</dd></div>
            <div><dt><Car size={11} /> Transporte</dt><dd>{detalhe.isDoubleCar ? '2 carros (mais de 4 pessoas)' : '1 carro'}{isAdmin ? <> · <Valor v={detalhe.cost} /></> : ''}</dd></div>
            {detalhe.distanceKm > 0 && <div><dt><MapPin size={11} /> Distância</dt><dd>{detalhe.distanceKm} km</dd></div>}
            {detalhe.notes && <div><dt>Objetivo</dt><dd>{detalhe.notes}</dd></div>}
          </dl>
          <div className="es-acoes">
            {isAdmin && (
              <>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => excluir(detalhe)}><Trash2 size={13} /> Cancelar viagem</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => duplicar(detalhe)}><Copy size={13} /> Duplicar</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => abrirEdicao(detalhe)}><Pencil size={13} /> Editar</button>
              </>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDetalhe(null)}>Fechar</button>
          </div>
        </ModalShell>
      )}

      {form && (
        <ViagemForm
          obra={form.obra}
          viagem={form.viagem}
          modelo={form.modelo}
          dataInicial={form.dataInicial}
          todasViagens={todas}
          onFechar={() => setForm(null)}
        />
      )}
    </div>
  );
};
